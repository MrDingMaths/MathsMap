// Headless screenshot harness for the TikZ visual gate.
// Drives system Chrome (via playwright-core, no bundled browser) to the dev
// server's #/tikz-check page, waits for every diagram to compile, and saves one
// PNG per diagram card plus a manifest.json pairing each PNG with its skillId /
// field / question / answer / compile-status. A vision agent then inspects the
// PNGs (see the vision-review workflow) for defects the source-reading blind
// check cannot see: colliding labels, missing lines, stray marks, wrong angles.
//
// Usage:
//   node scripts/shoot-tikz.mjs --ids a,b,c      [--out .shots] [--base http://localhost:5173]
//   node scripts/shoot-tikz.mjs --topic t-s4-ang [--out .shots]
// Requires the dev server (npm run dev) to be running.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

function arg(name, def = null) {
  const i = process.argv.indexOf(name);
  return i !== -1 && i < process.argv.length - 1 ? process.argv[i + 1] : def;
}

const ids = arg('--ids');
const topic = arg('--topic');
const base = arg('--base', 'http://localhost:5173');
const outDir = resolve(arg('--out', '.shots'));
if (!ids && !topic) {
  console.error('Need --ids <a,b,c> or --topic <id>.');
  process.exit(2);
}

const query = ids ? `ids=${encodeURIComponent(ids)}` : `topic=${encodeURIComponent(topic)}`;
const url = `${base}/#/tikz-check?${query}`;

// A per-diagram compile can take a while cold (TikZJax WASM); allow generous
// total budget for a whole batch.
const TOTAL_TIMEOUT_MS = 8 * 60 * 1000;

function slug(s) { return s.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''); }

const launchOpts = { headless: true };
// Prefer bundled chromium if present; otherwise use system Chrome channel.
try {
  var browser = await chromium.launch(launchOpts);
} catch {
  browser = await chromium.launch({ ...launchOpts, channel: 'chrome' });
}

const page = await browser.newPage({ viewport: { width: 1400, height: 2000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('[page error]', e.message));

console.error(`[shoot-tikz] loading ${url}`);
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

// Wait for the harness to finish — but tolerate a wedged diagram. Poll the
// per-card done-count; resolve when all settle OR when no card has settled for
// STALL_MS (a wedged TikZJax worker stops advancing). Either way we then
// capture whatever exists, so the culprit card is visible as still-pending.
const STALL_MS = 90_000;
const deadline = Date.now() + TOTAL_TIMEOUT_MS;
let lastDone = -1, lastProgress = Date.now();
for (;;) {
  const state = await page.evaluate(() => {
    const its = window.__tikzItems || [];
    return { total: its.length, done: its.filter((i) => i.status !== 'pending').length, allDone: window.__tikzCheckDone === true };
  });
  if (state.allDone) break;
  if (state.done !== lastDone) { lastDone = state.done; lastProgress = Date.now(); }
  if (Date.now() - lastProgress > STALL_MS) {
    console.error(`[shoot-tikz] STALLED at ${state.done}/${state.total} — a diagram wedged the compiler; capturing partial.`);
    break;
  }
  if (Date.now() > deadline) { console.error('[shoot-tikz] hard timeout; capturing partial.'); break; }
  await page.waitForTimeout(2000);
}

const items = await page.evaluate(() => window.__tikzItems || []);
if (items.length === 0) {
  // Almost always a serving problem, not "no diagrams": if a freshly-written
  // content file isn't picked up by the dev server, Vite returns the SPA
  // index.html (200 HTML) and loadSkillContent nulls on JSON.parse. Restart
  // `npm run dev` so new files are served, then re-shoot.
  console.error('[shoot-tikz] ERROR: 0 diagrams gathered. The dev server is likely returning the HTML fallback for these content files (newly-added files not served). Restart `npm run dev` and retry.');
  await browser.close();
  process.exit(3);
}
const settled = items.filter((i) => i.status !== 'pending').length;
console.error(`[shoot-tikz] ${settled}/${items.length} settled; capturing…`);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const cards = await page.$$('.grid .card');
if (cards.length !== items.length) {
  console.error(`[shoot-tikz] WARN: ${cards.length} cards vs ${items.length} items — filter may be active; capturing min`);
}

const manifest = [];
const n = Math.min(cards.length, items.length);
for (let i = 0; i < n; i++) {
  const it = items[i];
  const name = `${String(i).padStart(3, '0')}_${slug(it.skillId)}_${slug(it.field)}.png`;
  const file = join(outDir, name);
  await cards[i].scrollIntoViewIfNeeded();
  await cards[i].screenshot({ path: file });
  manifest.push({ png: name, skillId: it.skillId, kind: it.kind, field: it.field, q: it.q, a: it.a, status: it.status });
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
const fails = manifest.filter((m) => m.status === 'fail');
console.error(`[shoot-tikz] wrote ${n} PNG(s) + manifest.json to ${outDir}`);
if (fails.length) console.error(`[shoot-tikz] ${fails.length} compile FAIL(s): ${fails.map((f) => f.skillId + '/' + f.field).join(', ')}`);
console.log(JSON.stringify({ out: outDir, captured: n, compileFails: fails.length }));

await browser.close();
