// Headless screenshot harness for the TikZ visual gate.
// Drives system Chrome (via playwright-core, no bundled browser) to the dev
// server's #/tikz-check page and saves one PNG per diagram plus manifest.json.
//
// Usage:
//   node scripts/shoot-tikz.mjs --ids a,b,c [--out .shots]
//   node scripts/shoot-tikz.mjs --topic t-s4-ang [--out .shots]
//   node scripts/shoot-tikz.mjs --input public/.audit-input/<file>.json \
//     --batch-size 20 --out .shots/<run>/captures
//
// --input renders an arbitrary list of TikZ blocks instead of skills from the
// manifest. The file must sit inside public/ so the dev server can serve it;
// see MathsDatabase/tools/tikz-audit/RUNBOOK.md for the MB.STN audit that uses it.
//
// Requires the dev server to be running.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index !== -1 && index < process.argv.length - 1 ? process.argv[index + 1] : fallback;
}

function slug(value) {
  return String(value).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}

const ids = arg('--ids');
const topic = arg('--topic');
const input = arg('--input');
const batchSize = Math.max(1, +(arg('--batch-size', '20')) || 20);
const base = arg('--base', 'http://localhost:5173');
const outDir = resolve(arg('--out', '.shots'));
if (!ids && !topic && !input) {
  console.error('Need --ids <a,b,c>, --topic <id>, or --input <public JSON file>.');
  process.exit(2);
}

let externalItems = null;
let inputUrl = null;
if (input) {
  const inputPath = resolve(input);
  const publicRoot = resolve('public');
  const publicRelative = relative(publicRoot, inputPath).replace(/\\/g, '/');
  if (!publicRelative || publicRelative === '..' || publicRelative.startsWith('../')) {
    console.error('--input must be inside public/ so the local dev server can serve it.');
    process.exit(2);
  }
  const payload = JSON.parse(readFileSync(inputPath, 'utf8'));
  externalItems = Array.isArray(payload) ? payload : payload.items;
  if (!Array.isArray(externalItems)) {
    console.error('--input JSON must be an array or contain an items array.');
    process.exit(2);
  }
  inputUrl = `/${publicRelative}`;
}

const baseQuery = input
  ? `input=${encodeURIComponent(inputUrl)}`
  : ids ? `ids=${encodeURIComponent(ids)}` : `topic=${encodeURIComponent(topic)}`;

const TOTAL_TIMEOUT_MS = 20 * 60 * 1000;
const STALL_MS = 90_000;
const launchOpts = { headless: true };
let browser;
try {
  browser = await chromium.launch(launchOpts);
} catch {
  browser = await chromium.launch({ ...launchOpts, channel: 'chrome' });
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const manifest = [];
const batches = externalItems
  ? Array.from({ length: Math.ceil(externalItems.length / batchSize) }, (_, index) => ({ offset: index * batchSize, limit: batchSize }))
  : [{ offset: 0, limit: null }];

for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
  const batch = batches[batchIndex];
  const query = input
    ? `${baseQuery}&offset=${batch.offset}&limit=${batch.limit}`
    : baseQuery;
  const url = `${base}/#/tikz-check?${query}`;
  const page = await browser.newPage({ viewport: { width: 1400, height: 2000 }, deviceScaleFactor: 2 });
  page.on('pageerror', (error) => console.error('[page error]', error.message));
  console.error(`[shoot-tikz] batch ${batchIndex + 1}/${batches.length}: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const deadline = Date.now() + TOTAL_TIMEOUT_MS;
  let lastDone = -1;
  let lastProgress = Date.now();
  for (;;) {
    const state = await page.evaluate(() => {
      const items = window.__tikzItems || [];
      return {
        total: items.length,
        done: items.filter((item) => item.status !== 'pending').length,
        allDone: window.__tikzCheckDone === true,
        error: window.__tikzCheckError || null
      };
    });
    if (state.error) throw new Error(state.error);
    if (state.allDone) break;
    if (state.done !== lastDone) {
      lastDone = state.done;
      lastProgress = Date.now();
    }
    if (Date.now() - lastProgress > STALL_MS) {
      console.error(`[shoot-tikz] STALLED at ${state.done}/${state.total}; capturing partial batch.`);
      break;
    }
    if (Date.now() > deadline) {
      console.error('[shoot-tikz] hard timeout; capturing partial batch.');
      break;
    }
    await page.waitForTimeout(2000);
  }

  const items = await page.evaluate(() => window.__tikzItems || []);
  if (items.length === 0) {
    console.error('[shoot-tikz] ERROR: 0 diagrams gathered. Check the dev server and audit input.');
    await page.close();
    await browser.close();
    process.exit(3);
  }
  const settled = items.filter((item) => item.status !== 'pending').length;
  console.error(`[shoot-tikz] batch ${batchIndex + 1}: ${settled}/${items.length} settled; capturing...`);

  const cards = await page.$$('.grid .card');
  if (cards.length !== items.length) {
    console.error(`[shoot-tikz] WARN: ${cards.length} cards vs ${items.length} items; capturing min.`);
  }
  const count = Math.min(cards.length, items.length);
  for (let index = 0; index < count; index++) {
    const item = items[index];
    const globalIndex = batch.offset + index;
    const label = item.source || item.skillId || item.questionId || 'diagram';
    const name = `${String(globalIndex).padStart(4, '0')}_${slug(label)}_${slug(item.field)}.png`;
    const file = join(outDir, name);
    await cards[index].scrollIntoViewIfNeeded();
    await cards[index].screenshot({ path: file });
    manifest.push({
      png: name,
      auditId: item.auditId || null,
      questionId: item.questionId || null,
      source: item.source || null,
      marks: item.marks ?? null,
      skillId: item.skillId,
      kind: item.kind,
      field: item.field,
      q: item.q,
      a: item.a,
      status: item.status,
      verdict: null,
      reason: null
    });
  }
  await page.close();
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
const fails = manifest.filter((item) => item.status === 'fail');
const pending = manifest.filter((item) => item.status === 'pending');
console.error(`[shoot-tikz] wrote ${manifest.length} PNG(s) + manifest.json to ${outDir}`);
if (fails.length) console.error(`[shoot-tikz] ${fails.length} compile failure(s).`);
if (pending.length) console.error(`[shoot-tikz] ${pending.length} pending/stalled diagram(s).`);
console.log(JSON.stringify({ out: outDir, captured: manifest.length, compileFails: fails.length, pending: pending.length }));

await browser.close();
