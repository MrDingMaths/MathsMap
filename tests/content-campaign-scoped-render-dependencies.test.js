import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import { hashValue } from '../scripts/content/campaign-sources.mjs';
import { campaignRendererDependencyManifest, campaignScopedRendererDependencyManifest,
  compareCampaignNonPaintingDependencyDelta, projectCampaignNonPaintingFunctions,
  CAMPAIGN_RENDER_DEPENDENCY_PROFILE, CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE, CAMPAIGN_SCOPED_RENDER_CODE_FILES } from '../scripts/content/campaign-render-dependencies.mjs';
import {captureCampaignDiagrams, finalizeCampaignDiagrams, rebindCampaignRenderReceipt, verifyCampaignRenderReceipt, withCampaignRendererContext, pngCrc32} from '../scripts/content/campaign-visual-evidence.mjs';
import {probeCampaignRenderBrowser} from '../scripts/content/campaign-render-browser.mjs';

const pagination = 'src/lib/booklet-pagination.js', sources = 'scripts/content/campaign-sources.mjs';
function actualGraph(t) {
  const original = process.cwd(), root = fs.mkdtempSync(path.join(os.tmpdir(), 'campaign-scoped-render-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const row of campaignRendererDependencyManifest(original).files) {
    const file = path.join(root, row.path); fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.copyFileSync(path.join(original, row.path), file);
  }
  for (const relative of CAMPAIGN_SCOPED_RENDER_CODE_FILES) {
    const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.copyFileSync(path.join(original, relative), file);
  }
  const read = file => fs.readFileSync(path.join(root, file));
  const write = (file, value) => fs.writeFileSync(path.join(root, file), value);
  return { root, read, write };
}
const bodyEdit = (bytes, declaration) => Buffer.from(bytes.toString().replace(declaration, declaration + '\n/* local repair inside uncalled body */'));

test('opt-in projection preserves actual skill/TikZ dependencies through pagination and parser body repairs', t => {
  const { root, read, write } = actualGraph(t);
  const before = campaignRendererDependencyManifest(root), scoped = campaignScopedRendererDependencyManifest(root);
  assert.equal(before.profile, CAMPAIGN_RENDER_DEPENDENCY_PROFILE);
  assert.equal(scoped.profile, CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE);
  assert.deepEqual(scoped.files.map(r => r.path), before.files.map(r => r.path));
  const snapshots = {};
  for (const [file, declaration] of [[pagination, 'function nestedGridSplitGroups(block, layouts) {'], [sources, 'function validateSourceLongDescription(root, ref, gap, sourcePath) {']]) {
    const bytes = read(file), edited = bodyEdit(bytes, declaration);
    assert.notDeepEqual(edited, bytes); snapshots[file] = { before: bytes, after: edited }; write(file, edited);
    assert.deepEqual(campaignScopedRendererDependencyManifest(root), scoped, file);
  }
  const after = campaignRendererDependencyManifest(root);
  assert.notEqual(hashValue(after), hashValue(before));
  const result = compareCampaignNonPaintingDependencyDelta(before, after, snapshots);
  assert.equal(result.applicableDependencies, true); assert.equal(result.pixelAcceptance, false);
  assert.deepEqual(result.changed.sort(), [pagination, sources].sort());
  assert.throws(() => compareCampaignNonPaintingDependencyDelta(before, after, {}), /original\/current source bytes/);
  snapshots[pagination].before = Buffer.from('guessed history');
  assert.throws(() => compareCampaignNonPaintingDependencyDelta(before, after, snapshots), /original\/current source bytes/);
});

function syntheticPng() {
  const header = Buffer.alloc(13); header.writeUInt32BE(1); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6;
  const chunk = (name, bytes) => { const data = Buffer.concat([Buffer.from(name), bytes]), size = Buffer.alloc(4), crc = Buffer.alloc(4); size.writeUInt32BE(bytes.length); crc.writeUInt32BE(pngCrc32(data)); return Buffer.concat([size, data, crc]); };
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0,0,0,0,255]))), chunk('IEND', Buffer.alloc(0))]);
}

test('actual opt-in capture/context guards preserve scoped receipt only through inactive bodies', t => {
  const {root, read, write} = actualGraph(t), profile = CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE;
  const review = {format: 'content-campaign-scoped-render-code-review-v1', accepted: true, authorIdentity: '/root/synthetic-author', reviewerIdentity: '/root/synthetic-reviewer', profile: {model: 'gpt-6.1-sol', effort: 'medium', requestedServiceTier: 'default'}, files: CAMPAIGN_SCOPED_RENDER_CODE_FILES.map(file => ({path: file, hash: hashValue(read(file))}))};
  const reviewPath = '.agywork/content-campaign/synthetic-activation.json'; fs.mkdirSync(path.dirname(path.join(root, reviewPath)), {recursive: true}); write(reviewPath, JSON.stringify(review));
  const activation = {path: reviewPath, hash: hashValue(read(reviewPath))}, options = {profile, activation};
  const value = 'Whole caption [tikz]\\begin{tikzpicture}\\draw(0,0)--(1,0);\\end{tikzpicture}[/tikz]';
  const field = {where: 'practice.foundation[0].question_text', value, hash: hashValue(value), diagramHashes: [hashValue(value.slice(value.indexOf('[tikz]')))]};
  const params = {skillId: 'synthetic', candidateHash: 'complete-candidate-fixture', fields: [field], out: '.agywork/content-campaign/synthetic-capture', base: 'http://synthetic.invalid', rendererDependencyProfile: profile, rendererActivation: activation};
  assert.throws(() => withCampaignRendererContext(root, () => {}, {profile}), /independently reviewed/);
  assert.throws(() => withCampaignRendererContext(root, () => {}, {profile: 'unknown'}), /Unknown/);
  const browser = probeCampaignRenderBrowser(root);
  const reference = captureCampaignDiagrams(root, params, {capture: ({out, items}) => {
    fs.mkdirSync(out, {recursive: true}); fs.writeFileSync(path.join(out, 'block.png'), syntheticPng());
    fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(items.map(item => ({auditId: item.auditId, status: 'pass', png: 'block.png'}))));
    fs.writeFileSync(path.join(out, 'render-environment.json'), JSON.stringify({format: 'tikz-capture-environment-v1', browserVersion: browser.browserVersion, viewports: [{userAgent: 'SYNTHETIC: no pixel acceptance', devicePixelRatio: 1, viewport: {width: 1, height: 1}, fontStatus: 'loaded', fonts: []}]}));
  }});
  const verify = (f = field, candidate = params.candidateHash) => withCampaignRendererContext(root, context => verifyCampaignRenderReceipt(root, candidate, f, reference, context), options);
  assert.equal(verify().fieldHash, field.hash);
  assert.throws(() => verifyCampaignRenderReceipt(root, params.candidateHash, field, reference), /renderer mismatch/);
  for (const [file, declaration] of [[pagination, 'function nestedGridSplitGroups(block, layouts) {'], [sources, 'function validateSourceLongDescription(root, ref, gap, sourcePath) {']]) write(file, bodyEdit(read(file), declaration));
  assert.equal(verify().fieldHash, field.hash);
  const request = JSON.parse(read(params.out + '/capture-request.json'));
  assert.deepEqual(finalizeCampaignDiagrams(root, {...request, directory: params.out}), reference);
  const rebound = rebindCampaignRenderReceipt(root, {reference, candidateHash: 'unrelated-candidate-repair', fields: [field], out: params.out + '/rebound.json', rendererDependencyProfile: profile, rendererActivation: activation});
  assert.equal(withCampaignRendererContext(root, context => verifyCampaignRenderReceipt(root, 'unrelated-candidate-repair', field, rebound, context), options).fieldHash, field.hash);
  assert.throws(() => verify(field, 'changed-candidate'), /candidate\/producer/);
  assert.throws(() => verify({...field, hash: 'changed-whole-field'}), /every current block/);
  const receiptPath = reference.path, original = read(receiptPath), receipt = JSON.parse(original);
  receipt.browserBinding.executableHash = 'upgraded-browser'; write(receiptPath, JSON.stringify(receipt));
  const changedReference = {path: receiptPath, hash: hashValue(read(receiptPath))};
  assert.throws(() => withCampaignRendererContext(root, context => verifyCampaignRenderReceipt(root, params.candidateHash, field, changedReference, context), options), /live browser mismatch/); write(receiptPath, original);
  const css = read('src/app.css'); write('src/app.css', css.toString() + '\nbody{color:red}'); assert.throws(() => verify(), /renderer mismatch/); write('src/app.css', css);
  const accepted = read(reviewPath); review.authorIdentity = review.reviewerIdentity; write(reviewPath, JSON.stringify(review));
  assert.throws(() => withCampaignRendererContext(root, () => {}, {profile, activation: {path: reviewPath, hash: hashValue(read(reviewPath))}}), /Different-worker/); write(reviewPath, accepted);
  write('scripts/content/campaign-render-browser.mjs', read('scripts/content/campaign-render-browser.mjs').toString() + '\n// unreviewed');
  assert.throws(() => verify(), /accepted code changed/);
});

test('actual paint, inactive global CSS, fonts, TeX and producer changes invalidate scoped dependencies', t => {
  const { root, read, write } = actualGraph(t), before = hashValue(campaignScopedRendererDependencyManifest(root));
  const files = ['scripts/shoot-tikz.mjs', 'src/components/Tikz.svelte', 'src/components/Math.svelte',
    'src/views/TikzCheck.svelte', 'src/views/SkillDetail.svelte', 'src/components/InlineContent.svelte',
    'src/lib/tikz-prepare.js', 'src/app.css', 'src/components/BookletArrangement.svelte',
    'public/libs/tikzjax/tikzjax.js'];
  const rows = campaignRendererDependencyManifest(root).files;
  files.push(rows.find(r => r.path.startsWith('public/libs/fonts/') && r.hash).path);
  files.push(rows.find(r => r.path.startsWith('node_modules/katex/dist/fonts/') && r.hash).path);
  files.push(rows.find(r => /\.wasm(?:\.gz)?$/.test(r.path)).path);
  files.push(rows.find(r => r.path.includes('/tex_files/') && r.hash).path);
  for (const file of files) {
    const bytes = read(file); write(file, Buffer.concat([bytes, Buffer.from('\n/* mutation */')]));
    assert.notEqual(hashValue(campaignScopedRendererDependencyManifest(root)), before, file); write(file, bytes);
  }
  const broad = campaignRendererDependencyManifest(root), changed = structuredClone(broad);
  changed.files.find(r => r.path === 'src/app.css').hash = 'different';
  assert.throws(() => compareCampaignNonPaintingDependencyDelta(broad, changed, {}), /Painting\/unreviewed/);
  // Neither candidate nor browser identities live in the renderer graph. They
  // remain separately mandatory receipt/live-environment guards; a renderer
  // comparison deliberately offers no pixel/content/browser acceptance.
  assert.equal(compareCampaignNonPaintingDependencyDelta(broad, broad, {}).pixelAcceptance, false);
});

test('activation, module wiring, imports, signatures and new graph membership fail closed', t => {
  const { root, read, write } = actualGraph(t);
  const bytes = read(pagination);
  for (const suffix of ['\nquestionSplitGroups({});', '\n(()=>questionSplitGroups({}))();', '\nconst invoke=questionSplitGroups;', '\nconst key={[questionSplitGroups]:1};', '\n[].map(questionSplitGroups);', '\nglobalThis.paint=1;']) {
    write(pagination, bytes.toString() + suffix);
    assert.throws(() => campaignScopedRendererDependencyManifest(root), /module evaluation|module wiring/, suffix);
  }
  write(pagination, bytes);
  write(pagination, bytes.toString().replace('questionSplitGroups(block, layouts={})', 'questionSplitGroups(block, layouts={}, extra=0)'));
  assert.throws(() => campaignScopedRendererDependencyManifest(root), /module wiring/); write(pagination, bytes);
  const sourceBytes = read(sources);
  write(sources, sourceBytes.toString().replace("export const hashValue =", "export const hashValueChanged ="));
  assert.throws(() => campaignScopedRendererDependencyManifest(root), /module wiring/); write(sources, sourceBytes);
  const skill = read('src/views/SkillDetail.svelte');
  write('src/views/SkillDetail.svelte', skill.toString().replace('<script>', '<script>import {paginateFlow} from "../lib/booklet-pagination.js";'));
  assert.throws(() => campaignScopedRendererDependencyManifest(root), /active skill\/TikZ route/); write('src/views/SkillDetail.svelte', skill);
  const tikz = read('src/lib/tikz.js'); write('src/lib/tikz.js', tikz.toString() + '\nimport("../../scripts/content/campaign-sources.mjs");');
  assert.throws(() => campaignScopedRendererDependencyManifest(root), /dynamic source parser dependency/); write('src/lib/tikz.js', tikz);
  const shell = read('src/App.svelte'); write('src/App.svelte', shell.toString() + '\n<!-- route changed -->');
  assert.throws(() => campaignScopedRendererDependencyManifest(root), /route\/consumer/); write('src/App.svelte', shell);
  const broad = campaignRendererDependencyManifest(root), extra = structuredClone(broad);
  extra.files.push({ path: 'new-renderer.js', hash: 'x' });
  assert.throws(() => compareCampaignNonPaintingDependencyDelta(broad, extra, {}), /membership/);
  const prior = hashValue(campaignScopedRendererDependencyManifest(root));
  write(pagination, bodyEdit(bytes, 'function nestedGridSplitGroups(block, layouts) {').toString().replace('/* local repair inside uncalled body */', 'import("./new-render-asset.js");'));
  write('src/lib/new-render-asset.js', 'export const ink="red";');
  assert.notEqual(hashValue(campaignScopedRendererDependencyManifest(root)), prior, 'literal imports inside projected bodies still bind new dependency assets');
  assert.throws(() => projectCampaignNonPaintingFunctions(pagination, Buffer.from('export function paginateFlow(){}; paginateFlow();')), /module evaluation/);
});
