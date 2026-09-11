import test from 'node:test';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';import {scopeSvgPaintReferences,normaliseSvgPaintScopes} from '../src/lib/svg-paint-scope.js';import {renderedPageHashes} from '../scripts/booklet/page-review.mjs';
test('fresh and cached SVG copies retain private gradient and clipping references',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const page=await browser.newPage();
  await page.setContent('<div id="hidden" style="display:none"><svg><defs><linearGradient id="paint"><stop stop-color="red"/></linearGradient><clipPath id="clip"><rect width="1" height="1"/></clipPath></defs></svg></div><svg id="visible" width="100" height="100"><defs><linearGradient id="paint"><stop stop-color="#d4e8ff"/><stop offset="1" stop-color="white"/></linearGradient><linearGradient id="alias" href="#paint"/><clipPath id="clip"><circle cx="50" cy="50" r="45"/></clipPath></defs><rect width="100" height="100" fill="url(#alias)" clip-path="url(#clip)"/></svg>');
  const result=await page.evaluate(fn=>{
   const apply=new Function('let nextScope=0;const scoped=new WeakSet();return ('+fn+')')();const svg=document.querySelector('#visible');apply(svg);
   const first=svg.outerHTML;apply(svg);const stable=svg.outerHTML===first;
   const clone=svg.cloneNode(true);clone.id='copy';document.body.append(clone);apply(clone);
   const resolve=s=>[...s.querySelectorAll('rect')].flatMap(n=>['fill','clip-path'].map(k=>n.getAttribute(k))).filter(Boolean).every(v=>s.querySelector('[id="'+v.match(/#([^)]*)/)[1]+'"]'));
   return {stable,firstIds:[...svg.querySelectorAll('[id]')].map(n=>n.id),secondIds:[...clone.querySelectorAll('[id]')].map(n=>n.id),resolved:resolve(svg)&&resolve(clone),href:clone.querySelector('linearGradient[href]').getAttribute('href')};
  },scopeSvgPaintReferences.toString());
  assert.equal(result.stable,true);assert.equal(result.resolved,true);assert.ok(result.firstIds.every(id=>!result.secondIds.includes(id)));assert.ok(result.secondIds.includes(result.href.slice(1)));
  const expected=await page.locator('#visible').screenshot();await page.locator('#hidden').evaluate(el=>el.remove());const actual=await page.locator('#visible').screenshot();assert.deepEqual(actual,expected,'Hidden duplicate definitions must not affect visible pixels');
 }finally{await browser.close();}
});
test('page cache ignores only generated paint scope numbers while retaining content changes',()=>{
 const options={renderer:'same',settings:{},assets:{}},page=html=>[{blocks:['a'],html}];
 const a='<svg><linearGradient id="mm-svg-paint-1-shade"/><path fill="url(#mm-svg-paint-1-shade)"/></svg>',b=a.replaceAll('paint-1-','paint-42-');
 assert.deepEqual(renderedPageHashes(page(a),options),renderedPageHashes(page(b),options));
 assert.notDeepEqual(renderedPageHashes(page(a),options),renderedPageHashes(page(b.replace('path fill','path stroke="red" fill')),options));
 assert.equal(normaliseSvgPaintScopes(a),'<svg><linearGradient id="shade"/><path fill="url(#shade)"/></svg>');
});
