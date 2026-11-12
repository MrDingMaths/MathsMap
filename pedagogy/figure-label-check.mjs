// Mechanical label-collision check for figure-pass redraws (7 November 2026, "All three" speed-ups).
// 60% of the checker's rejections were label collisions (a curve through a tick label, overlapping labels); each
// cost a whole repair round. This opens the same Studio #/tikz-check page the preview used (diagrams are cached by
// then), runs Studio's own inspectDiagramLabelLayout on every SVG, and reports collisions per field, so a redraw
// with a collision goes straight back to its author without a Terra call.
//   node pedagogy/figure-label-check.mjs --input public/.audit-input/<file>.json   -> JSON {field: [issues]}
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// The diagrams this page compiled, published to the shared render cache that frozen exports read
// (import v2 simplification, 13 November 2026: Ch 5's exports compiled 205-368 diagrams cold that this
// check had just compiled). Keys and version are Studio's own, so they are the export's keys while the
// diagram renderer is unchanged. Warming is best effort: a failure is logged and never fails the check.
// render-cache-server.mjs is not imported here: vite.config.js loads it, so it stays unchanged.
export async function publishCheckedDiagrams(page, cacheRoot, log = () => {}) {
  try {
    const data = await page.evaluate(() => window.TikZ?.cacheEntries?.() ?? null);
    if (!data?.version || !data.entries?.length) return {published: 0};
    const served = await page.evaluate(async () => { try { return (await (await fetch('/__booklet/render-cache/version', {cache: 'no-store'})).json()).diagramVersion; } catch { return null; } });
    if (data.version !== served) throw Error('diagram renderer changed during the check');
    const {publishRenderEntries} = await import('../scripts/booklet/render-cache-server.mjs');
    const published = await publishRenderEntries(data.version, data.entries, {cacheRoot});
    log('Render cache: ' + published + ' compiled diagrams published from the label check');
    return {version: data.version, published};
  } catch (error) { log('Render cache warming skipped: ' + error.message); return {published: 0, error: error.message}; }
}

// publicRoot: the public/ folder Studio serves (another checkout's when called from a worktree).
// publishTo: that checkout's .booklet-work/render-cache, to keep what the check compiled for exports.
export async function labelCollisions(inputFile, {base = 'http://localhost:5173', timeoutMs = 300000, publicRoot = path.resolve('public'), publishTo, log} = {}) {
  const rel = path.relative(publicRoot, path.resolve(inputFile)).replaceAll('\\', '/');
  if (rel.startsWith('..')) throw Error('input must be inside public/');
  const items = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  let browser;
  try { browser = await chromium.launch({headless: true}); } catch { browser = await chromium.launch({headless: true, channel: 'chrome'}); }
  try {
    const page = await browser.newPage({viewport: {width: 1400, height: 2000}});
    await page.goto(`${base}/#/tikz-check?input=${encodeURIComponent('/' + rel)}&offset=0&limit=${items.length}`, {waitUntil: 'domcontentloaded', timeout: 60000});
    await page.waitForFunction(() => window.__tikzCheckDone === true || window.__tikzCheckError, null, {timeout: timeoutMs, polling: 1000});
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(async () => {
      const {inspectDiagramLabelLayout} = await import('/src/lib/diagram-typography.js');
      const list = window.__tikzItems || [], cards = [...document.querySelectorAll('.grid .card')], out = {};
      cards.forEach((card, i) => {
        const field = list[i]?.field, svg = card.querySelector('svg');
        if (!field || !svg) return;
        // Grid lines (the palette grid grey) pass under tick labels by design: not a collision.
        for (const p of svg.querySelectorAll('path,line,polyline')) if (getComputedStyle(p).stroke === 'rgb(204, 204, 204)') p.style.stroke = 'none';
        let issues = [];
        try { issues = inspectDiagramLabelLayout(svg, {strokes: true}); } catch (e) { issues = [{kind: 'check-error', message: e.message}]; }
        // Same label list and order as inspectDiagramLabelLayout (groups that contain text). Glyphs are paths, so
        // name each label by where it sits in the figure.
        const box = svg.getBoundingClientRect();
        const labels = [...svg.querySelectorAll('g[data-diagram-label="1"]')].filter(g => g.querySelector('text')).map(g => {
          const r = g.getBoundingClientRect(), x = (r.left + r.width / 2 - box.left) / box.width, y = (r.top + r.height / 2 - box.top) / box.height;
          const where = `${y < .34 ? 'top' : y > .66 ? 'bottom' : 'middle'}-${x < .34 ? 'left' : x > .66 ? 'right' : 'centre'}`;
          return `the label ${Math.round(x * 100)}% across and ${Math.round(y * 100)}% down (${where})`;
        });
        out[field] = issues.filter(x => ['diagram-label-overlap', 'diagram-label-stroke'].includes(x.kind))
          .map(x => x.kind === 'diagram-label-overlap' ? `${labels[x.labels[0]] ?? 'a label'} overlaps ${labels[x.labels[1]] ?? 'another label'}` : `a curve or line runs through ${labels[x.label] ?? 'a label'}`);
        out[field].labelCount = labels.length;
      });
      return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, {labels: v.labelCount, issues: [...v]}]));
    });
    if (publishTo) await publishCheckedDiagrams(page, publishTo, log);
    return result;
  } finally { await browser.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const i = process.argv.indexOf('--input');
  console.log(JSON.stringify(await labelCollisions(process.argv[i + 1]), null, 1));
}
