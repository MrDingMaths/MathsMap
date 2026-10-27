import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {tableCircleGeometry} from '../public/libs/maths-editor/table-annotations.mjs';
import {normalizeDocument,freshDocument} from '../public/libs/maths-editor/document-model.mjs';

const cell={left:20,top:10,width:40,height:30},second={left:20,top:40,width:40,height:30};
test('ordinary circles retain exact geometry; explicit spans use both cell bounds',()=>{
 assert.deepEqual(tableCircleGeometry(cell),{rx:12,ry:11.4});
 const annotation={spanToCellId:'second',widthMm:7.5,heightMm:17};
 assert.equal(tableCircleGeometry(cell,annotation),null);
 assert.deepEqual(tableCircleGeometry(cell,annotation,second),{cx:40,cy:40,rx:7.5*96/25.4/2,ry:17*96/25.4/2});
});
test('normalization retains only explicit circle spans and copying remaps both anchors',()=>{
 const raw={format:'maths-editor-document-v1',version:1,blocks:[{id:'t',type:'table',annotations:[{id:'a',type:'circle',cellId:'first',spanToCellId:'second'},{id:'b',type:'circle',cellId:'first'}],rows:[[{id:'first',blocks:[]}],[{id:'second',blocks:[]}]]}]};
 const doc=normalizeDocument(raw),table=doc.blocks[0];
 assert.equal(table.annotations[0].spanToCellId,'second');
 assert.equal(Object.hasOwn(table.annotations[1],'spanToCellId'),false);
 const copied=freshDocument(doc).blocks[0];
 assert.equal(copied.annotations[0].cellId,copied.rows[0][0].id);
 assert.equal(copied.annotations[0].spanToCellId,copied.rows[1][0].id);
 assert.notEqual(copied.annotations[0].spanToCellId,'second');
 assert.equal(Object.hasOwn(copied.annotations[1],'spanToCellId'),false);
});
test('mounted paired circles follow local cell bounds at zoom and diagnose missing second anchors',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.route('http://paired.test/module.mjs',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('public/libs/maths-editor/table-annotations.mjs','utf8')}));
  await page.setContent('<div id="root"><div style="position:relative;width:40mm"><table style="width:40mm;border-collapse:collapse" data-id="t"><tr style="height:9mm"><td data-id="first">−2</td></tr><tr style="height:9mm"><td data-id="second">0</td></tr></table></div></div>');
  const result=await page.evaluate(async()=>{
   const{mountTableAnnotations}=await import('http://paired.test/module.mjs');const root=document.querySelector('#root'),table=root.querySelector('table');
   const annotations=[{id:'pair',type:'circle',cellId:'first',spanToCellId:'second',widthMm:7.5,heightMm:17,colour:'#4f9b63'},{id:'legacy',type:'circle',cellId:'first',colour:'#000000'}];table.dataset.annotations=JSON.stringify(annotations);
   const mounted=mountTableAnnotations(root),settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),values=[];
   for(const zoom of [1,.65,1.6]){root.style.zoom=zoom;mounted.update();await settle();const svg=root.querySelector('svg'),ellipse=svg.querySelector('[data-annotation-id="pair"] ellipse'),legacy=svg.querySelector('[data-annotation-id="legacy"] ellipse');const a=table.querySelector('[data-id="first"]').getBoundingClientRect(),b=table.querySelector('[data-id="second"]').getBoundingClientRect(),s=table.getBoundingClientRect(),scale=s.width/parseFloat(getComputedStyle(table).width);values.push({cx:+ellipse.getAttribute('cx'),cy:+ellipse.getAttribute('cy'),expectedX:((a.left+b.right)/2-s.left)/scale,expectedY:((a.top+b.bottom)/2-s.top)/scale,rx:+ellipse.getAttribute('rx'),ry:+ellipse.getAttribute('ry'),legacyCx:+legacy.getAttribute('cx'),legacyCy:+legacy.getAttribute('cy')});}
   table.querySelector('[data-id="second"]').remove();mounted.update();await settle();const missing={drawn:!!root.querySelector('[data-annotation-id="pair"] ellipse'),warning:root.querySelector('[data-annotation-diagnostics]')?.textContent};mounted.destroy();return{values,missing};
  });
  for(const v of result.values){assert.ok(Math.abs(v.cx-v.expectedX)<.02);assert.ok(Math.abs(v.cy-v.expectedY)<.02);assert.ok(Math.abs(v.rx-7.5*96/25.4/2)<.001);assert.ok(Math.abs(v.ry-17*96/25.4/2)<.001);assert.ok(v.legacyCy<v.cy);}
  assert.equal(result.missing.drawn,false);assert.match(result.missing.warning,/pair/);
 }finally{await browser.close();}
});
