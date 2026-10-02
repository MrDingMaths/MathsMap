import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { campaignRendererDependencyManifest, campaignRendererSignature } from '../scripts/content/campaign-render-dependencies.mjs';
import { withCampaignRendererContext, verifyCampaignRenderReceipt } from '../scripts/content/campaign-visual-evidence.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'campaign-renderer-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value = '') => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
  write('src/components/Tikz.svelte', '<script>import a from "../lib/tikz.js"; import b from "../lib/diagram-label-space.js";</script><style>@import "../extra.css"; i{background:url("../ink.svg#edge")}</style>');
  write('src/lib/tikz.js', 'export {x} from "./tikz-prepare.js"; const lazy=()=>import("./diagram-typography.js");');
  for (const name of ['tikz-prepare', 'diagram-typography', 'diagram-label-space']) write('src/lib/' + name + '.js', 'export const x=1;');
  write('src/app.css', '@font-face{src:url("/libs/fonts/label.woff2?v=1")}');
  write('index.html', '<script type="module" src="/src/main.js"></script>');
  write('src/main.js', 'import App from "./App.svelte";');
  write('src/App.svelte', '<script>import theme from "./lib/theme.js";</script><style>@import url("./extra.css");</style>');
  write('src/lib/theme.js', 'export default "light";');
  for (const name of ['public/libs/fonts/label.woff2', 'public/libs/tikzjax/tex.wasm', 'node_modules/katex/dist/fonts/math.woff2', 'src/extra.css', 'src/ink.svg']) write(name, 'actual fixture bytes');
  return { root, write };
}

test('complete renderer binding follows same-line imports, re-exports, dynamic literals and CSS URLs', t => {
  const { root, write } = fixture(t), manifest = campaignRendererDependencyManifest(root);
  for (const name of ['src/main.js', 'src/App.svelte', 'src/lib/theme.js', 'src/lib/tikz-prepare.js', 'src/lib/diagram-typography.js', 'src/lib/diagram-label-space.js', 'src/extra.css', 'src/ink.svg', 'public/libs/fonts/label.woff2']) assert.ok(manifest.files.some(row => row.path === name && row.hash), name);
  for (const name of ['src/App.svelte', 'src/lib/theme.js', 'src/extra.css', 'src/components/Tikz.svelte', 'src/lib/tikz-prepare.js', 'src/lib/diagram-typography.js', 'src/lib/diagram-label-space.js', 'src/app.css', 'public/libs/fonts/label.woff2', 'public/libs/tikzjax/tex.wasm', 'node_modules/katex/dist/fonts/math.woff2']) {
    const before = campaignRendererSignature(root), bytes = fs.readFileSync(path.join(root, name));
    write(name, bytes.toString() + '\n/* changed */'); assert.notEqual(campaignRendererSignature(root), before, name);
    write(name, bytes); assert.equal(campaignRendererSignature(root), before, name);
  }
  const before = campaignRendererSignature(root); write('public/libs/fonts/new.woff2', 'new'); assert.notEqual(campaignRendererSignature(root), before);
});

test('missing dependencies are explicit and unknown or escaping local imports reject', t => {
  const { root, write } = fixture(t);
  write('src/lib/tikz.js', 'import "./missing.js";');
  assert.equal(campaignRendererDependencyManifest(root).files.find(row => row.path === 'src/lib/missing.js').hash, null);
  const before = campaignRendererSignature(root); write('src/lib/missing.js', 'export const a=1'); assert.notEqual(campaignRendererSignature(root), before);
  write('src/lib/tikz.js', 'const source="./missing.js"; import(source);'); assert.throws(() => campaignRendererSignature(root), /Unbound variable renderer import/);
  write('src/lib/tikz.js', 'import "../../../outside.js";'); assert.throws(() => campaignRendererSignature(root), /outside campaign root/);
});

test('current renderer manifest binds transitive paint, labels, colours, containers and actual fonts', () => {
  const manifest = campaignRendererDependencyManifest(process.cwd());
  for (const name of ['src/lib/tikz-prepare.js', 'src/lib/diagram-typography.js', 'src/lib/diagram-label-space.js', 'src/lib/graph-strokes.js', 'src/lib/svg-paint-scope.js', 'src/lib/diagram-colours.js', 'src/components/Tikz.svelte', 'src/app.css', 'scripts/shoot-tikz.mjs']) assert.ok(manifest.files.some(row => row.path === name && row.hash), name);
  assert.ok(manifest.files.some(row => row.path.startsWith('public/libs/fonts/') && row.hash));
  assert.ok(manifest.files.some(row => row.path.startsWith('node_modules/katex/dist/fonts/') && row.hash));
  assert.ok(manifest.files.every(row => row.hash), 'current installed rendering dependencies must exist');
});

test('scoped renderer signature rejects mutation and cannot escape its validation operation', t => {
  const { root, write } = fixture(t); let retained;
  withCampaignRendererContext(root, context => { retained = context; assert.equal(context.signature, campaignRendererSignature(root)); assert.ok(Object.isFrozen(context)); });
  write('receipt.json', JSON.stringify({}));
  const bytes = fs.readFileSync(path.join(root, 'receipt.json'));
  return import('../scripts/content/campaign-sources.mjs').then(({hashValue}) => {
    assert.throws(() => verifyCampaignRenderReceipt(root, 'candidate', {}, { path: 'receipt.json', hash: hashValue(bytes) }, retained), /Expired\/foreign/);
    assert.throws(() => withCampaignRendererContext(root, () => write('src/app.css', 'changed')), /changed during scoped validation/);
  });
});
