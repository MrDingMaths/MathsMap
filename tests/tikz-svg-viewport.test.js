import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { loadTikzEngine } from '../scripts/booklet/check-pgfplots-engine.mjs';
import { reserveDiagramLabelSpace } from '../src/lib/diagram-label-space.js';
import { watchGraphStrokes } from '../src/lib/graph-strokes.js';
import { combinedExampleTikz } from '../src/lib/booklet-preview.js';

// Exact unlabelled Ratios F1 source whose top painted stroke exceeds PGF's
// native viewport. Keep all five circles/two squares, coordinates and scale.
const shapes = String.raw`\begin{tikzpicture}[scale=0.62]
\draw[fill=white] (0.45,0.45) circle (0.42);
\draw[fill=white] (1.50,0.45) circle (0.42);
\draw[fill=white] (2.55,0.45) circle (0.42);
\draw[fill=white] (3.60,0.45) circle (0.42);
\draw[fill=white] (4.65,0.45) circle (0.42);
\draw[fill=white] (5.95,0.05) rectangle ++(0.85,0.85);
\draw[fill=white] (7.00,0.05) rectangle ++(0.85,0.85);
\end{tikzpicture}`;

test('real PGF fresh and cached SVG paint stays visible without changing geometry or source clipping', async () => {
  const compile = await loadTikzEngine();
  const sources = [shapes, String.raw`\begin{tikzpicture}\clip (0,0) rectangle (1,1);\draw[fill=black] (-1,-1) rectangle (2,2);\end{tikzpicture}`, String.raw`\begin{tikzpicture}\draw (0,0)--(3,0);\node[above] at (1,0) {$x_1^2+\frac{a}{b}$};\end{tikzpicture}`];
  const outputs = [];
  // The same composed solution must retain its axes and original curve through
  // both the fresh-load event and every production cache application path.
  sources.push(combinedExampleTikz(
    {id:'cache-base',format:'tikz',code:String.raw`% colour metadata precedes the picture
\begin{tikzpicture}[x=1cm,y=1cm]\draw[black] (-2,0)--(2,0);\draw[gray] (-1,-1)--(1,1);\end{tikzpicture}`},
    {format:'tikz',overlayOf:'cache-base',code:String.raw`% solution metadata
\begin{tikzpicture}[x=1cm,y=1cm]\draw[blue] (-1,1)--(1,-1);\end{tikzpicture}`}));
  for (const source of sources) outputs.push((await compile(source)).svg);
  assert.match(outputs[1], /clipPath/);
  assert.match(outputs[2], /data-diagram-label/);
  const script = fs.readFileSync(new URL('../src/lib/tikz.js', import.meta.url), 'utf8').replace(/^import .*;$/gm, '').replace(/export function/g, 'function');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.setContent('<style>svg{overflow:hidden}.tikz-wrap{width:max-content;overflow-x:auto;min-height:32px}</style><main></main>');
    const rows = await page.evaluate(({ script, outputs, reserve }) => {
      const api = new Function('localStorage', 'indexedDB', 'renderEnvironment', 'cacheMode', 'serverDiagram', 'digestKey', script + '\nreturn {apply:_applyCachedToNode,cache:tikzCache};')({ getItem: () => '1' }, { open: () => { throw Error('No persistent writes in test harness'); } }, async () => null, () => 'off', async () => null, async () => 'test');
      const reserveInk = new Function('return (' + reserve + ')')();
      const fingerprint = svg => ({ viewBox: svg.getAttribute('viewBox'), width: svg.getAttribute('width'), height: svg.getAttribute('height'), inner: svg.innerHTML });
      return outputs.map((source, index) => {
        const slot = document.createElement('div'); slot.className = 'tikz-wrap'; slot.dataset.cacheKey = 'fixture-' + index; slot.innerHTML = source; document.querySelector('main').append(slot);
        const original = fingerprint(slot.querySelector('svg'));
        slot.querySelector('svg').dispatchEvent(new CustomEvent('tikzjax-load-finished', { bubbles: true, detail: { source: 'compiled' } }));
        const fresh = slot.querySelector('svg'), serialized = api.cache.get(slot.dataset.cacheKey);
        reserveInk(document.querySelector('main'));
        const padding = slot.style.paddingTop, paddingRight=slot.style.paddingRight; reserveInk(document.querySelector('main')); if(slot.style.paddingTop!==padding||slot.style.paddingRight!==paddingRight)throw Error('Cumulative paint padding');
        const cachedRows = [];
        // Memory SVG and old persisted/server SVG use the same cache apply path.
        for (const [kind, cached] of [['memory', serialized], ['persisted-before-fix', source], ['server-before-fix', source]]) {
          const node = document.createElement('div'); node.className = 'tikz-wrap'; document.querySelector('main').append(node);
          if (!api.apply(node, cached)) throw Error('Cached SVG rejected');
          reserveInk(document.querySelector('main'));
          const svg = node.querySelector('svg'); cachedRows.push({ kind, overflow: getComputedStyle(svg).overflow, shape: fingerprint(svg), paddingTop: node.style.paddingTop, paddingRight:node.style.paddingRight });
        }
        return { original, fresh: fingerprint(fresh), overflow: getComputedStyle(fresh).overflow, cachedRows, paddingTop: padding, paddingRight, clipPaths: fresh.querySelectorAll('clipPath').length, labelFont: fresh.querySelector('[data-diagram-label]')?.getAttribute('data-label-font') || null };
      });
    }, { script, outputs, reserve: reserveDiagramLabelSpace.toString() });
    for (const row of rows) {
      assert.deepEqual(row.fresh, row.original); assert.equal(row.overflow, 'visible');
      for (const cached of row.cachedRows) { assert.deepEqual(cached.shape, row.original); assert.equal(cached.overflow, 'visible', cached.kind); }
    }
    assert.ok(rows[1].clipPaths > 0, 'explicit source clip remains');
    assert.ok(parseFloat(rows[0].paddingTop) > 1.3 && parseFloat(rows[0].paddingTop) < 1.5, 'measured F1 ink plus one physical raster footprint is reserved');
    assert.ok(parseFloat(rows[0].paddingRight) > .5 && parseFloat(rows[0].paddingRight) < .7, 'only the near-edge raster footprint needs horizontal space');
    for (const cached of rows[0].cachedRows) { assert.equal(cached.paddingTop, rows[0].paddingTop, cached.kind);assert.equal(cached.paddingRight,rows[0].paddingRight,cached.kind); }
    assert.equal(rows[1].paddingTop, '0px', 'clipped source ink does not create artificial padding');
    assert.ok(Number(rows[2].labelFont) > 0, 'whole label typography markers remain');
  } finally { await browser.close(); }
});

test('a real flip transition settles the mirrored cached face without resizing its diagram',async()=>{
  const compile=await loadTikzEngine(),{svg}=await compile(shapes);
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page=await browser.newPage({deviceScaleFactor:1});
    await page.setContent('<style>.flip-inner{transform:rotateY(0deg);transition:transform .12s linear;transform-style:preserve-3d}.flipped .flip-inner{transform:rotateY(180deg)}.flip-back{transform:rotateY(180deg);backface-visibility:hidden}.tikz-wrap{width:max-content;overflow-x:auto}svg{overflow:visible}</style><main class="flip-card"><div class="flip-inner"><div class="flip-back"><div class="tikz-wrap">'+svg+'</div></div></div></main>');
    await page.evaluate(({watch,reserve})=>{
      const reserveInk=new Function('return ('+reserve+')')();
      const observe=new Function('calibrateGraphStrokes','return ('+watch+')')(reserveInk);
      window.stopPaintWatch=observe(document.querySelector('.tikz-wrap'));
    },{watch:watchGraphStrokes.toString(),reserve:reserveDiagramLabelSpace.toString()});
    await page.waitForFunction(()=>Number(document.querySelector('.tikz-wrap').dataset.strokeSpaceLeft)>.5);
    const original=await page.locator('svg').evaluate(svg=>({viewBox:svg.getAttribute('viewBox'),paths:[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')),width:svg.getBoundingClientRect().width}));
    await page.locator('main').evaluate(card=>card.classList.add('flipped'));
    await page.waitForFunction(()=>Number(document.querySelector('.tikz-wrap').dataset.strokeSpaceRight)>.5);
    const settled=await page.locator('svg').evaluate(svg=>({viewBox:svg.getAttribute('viewBox'),paths:[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')),width:svg.getBoundingClientRect().width}));
    assert.deepEqual(settled,original,'the transform hook reserves raster clearance without changing source geometry or native fitting');
    await page.evaluate(()=>window.stopPaintWatch());
    await page.locator('main').evaluate(card=>card.classList.remove('flipped'));
    await page.waitForTimeout(180);
    assert.ok(await page.locator('.tikz-wrap').evaluate(node=>Number(node.dataset.strokeSpaceRight)>.5),'cleanup removes the transition listener');
  }finally{await browser.close();}
});
