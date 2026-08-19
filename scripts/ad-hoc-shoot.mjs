// Ad-hoc screenshot helper (waitUntil: domcontentloaded, since Vite's HMR
// websocket keeps the page from ever reaching 'networkidle').
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index !== -1 && index < process.argv.length - 1 ? process.argv[index + 1] : fallback;
}
function slug(value) {
  return String(value).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
}

const ids = arg('--ids');
const topic = arg('--topic');
const base = arg('--base', 'http://localhost:5174');
const outDir = resolve(arg('--out', '.shots'));
if (!ids && !topic) { console.error('Need --ids or --topic'); process.exit(2); }
const query = ids ? `ids=${encodeURIComponent(ids)}` : `topic=${encodeURIComponent(topic)}`;

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 2000 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.error('[page error]', e.message));
const url = `${base}/#/tikz-check?${query}`;
console.error('goto', url);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

const deadline = Date.now() + 6 * 60 * 1000;
for (;;) {
  const state = await page.evaluate(() => {
    const items = window.__tikzItems || [];
    return { total: items.length, done: items.filter((i) => i.status !== 'pending').length, allDone: window.__tikzCheckDone === true };
  });
  if (state.allDone) { console.error('done', state); break; }
  if (Date.now() > deadline) { console.error('TIMEOUT', state); break; }
  await page.waitForTimeout(1500);
}

const items = await page.evaluate(() => window.__tikzItems || []);
const cards = await page.$$('.grid .card');
const manifest = [];
const count = Math.min(cards.length, items.length);
for (let i = 0; i < count; i++) {
  const item = items[i];
  const label = item.skillId || 'diagram';
  const name = `${String(i).padStart(4, '0')}_${slug(label)}_${slug(item.field)}.png`;
  const file = join(outDir, name);
  await cards[i].scrollIntoViewIfNeeded();
  await cards[i].screenshot({ path: file });
  manifest.push({ png: name, skillId: item.skillId, kind: item.kind, field: item.field, status: item.status });
}
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ out: outDir, captured: manifest.length }));
await browser.close();
