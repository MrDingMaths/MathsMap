// Intended path: scripts/booklet/check-table-baseline-editor.mjs
// Small in-memory native fixtures; one regression PDF and no project writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {tableBaselineFixture,equationCellIds} from '../../tests/fixtures/booklets/table-baseline.mjs';

const base=process.argv[2]??'http://127.0.0.1:5173',out=process.argv[3]??'.booklet-work/table-baseline-regression';
assert(!fs.existsSync(out),'Use a fresh output directory');
// Keep the tiny production preview inside the actual page's formula wrapping rule.
const pageSource=fs.readFileSync(new URL('../../src/components/TranscribedBookletPage.svelte',import.meta.url),'utf8');
const pageMathRule=pageSource.match(/\.booklet-page :global\(\.katex\)\s*\{[^}]+\}/)?.[0];
assert(pageMathRule,'Missing canonical booklet formula wrapping rule');
const errors=[],blocked=[];let browser;
try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1400,height:1100}});
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const request=route.request();if(!['GET','HEAD','OPTIONS'].includes(request.method())){blocked.push({method:request.method(),url:request.url()});return route.abort();}return route.continue();});
const value=()=>page.evaluate(()=>document.querySelector('maths-editor').document);
const ready=()=>page.waitForFunction(()=>document.querySelector('maths-editor')?.document?.blocks?.length>0);
const selectCell=async id=>{await page.locator('.me-content td[data-id="'+id+'"] > p').first().click();};
const alignmentMap=doc=>Object.fromEntries(doc.blocks.flatMap(t=>t.rows.flat()).map(c=>[c.id,c.verticalAlign]));
try{
 await page.goto(base+'/libs/maths-editor/studio.html');await ready();
 await page.evaluate(d=>document.querySelector('maths-editor').document=d,tableBaselineFixture('middle'));
 for(const id of equationCellIds.flat()){
  await selectCell(id);const control=page.getByLabel('Cell vertical alignment',{exact:true});
  assert((await control.locator('option').evaluateAll(options=>options.map(o=>o.value))).includes('baseline'));
  await control.selectOption('baseline');assert.equal(alignmentMap(await value())[id],'baseline');
 }
 const saved=JSON.parse(JSON.stringify(await value()));assert.equal(alignmentMap(saved)['callout-note'],'middle');
 await page.reload();await ready();await page.evaluate(d=>document.querySelector('maths-editor').document=d,saved);
 assert.deepEqual(await value(),saved,'Structured editor save/reopen retains exact document');
 await selectCell('callout-label');assert.equal(await page.getByLabel('Cell vertical alignment',{exact:true}).inputValue(),'baseline');
 // Use the production preview path. The untouched middle fixture is a measured control.
 await page.evaluate(async({saved,control})=>{
  await import('/node_modules/katex/dist/katex.min.css');
  await import('/src/app.css');
  const {documentHtml}=await import('/src/lib/document-content.js'),{mountTableAnnotations}=await import('/libs/maths-editor/table-annotations.mjs');
  window.baselineObservers=[];
  for(const [id,doc]of [['baseline-preview',saved],['middle-preview',control]]){
   const div=document.createElement('div');div.id=id;div.className='booklet-page';div.style.cssText='font-size:11pt;line-height:1.5;width:190mm;background:white;color:black';div.innerHTML=documentHtml(doc,{mathsStyle:'display-glyphs'});document.body.append(div);window.baselineObservers.push(mountTableAnnotations(div));
  }
  await document.fonts.ready;
 },{saved,control:tableBaselineFixture('middle')});
 await page.addStyleTag({content:pageMathRule.replace(':global(.katex)','.katex')});
 const measure=async (media,onlyBaseline=false)=>{
  await page.emulateMedia({media});
  return page.evaluate(async({groups,media,onlyBaseline})=>{
   await document.fonts.ready;window.baselineObservers.forEach(o=>o.update());await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const {tableMathBoxElement}=await import('/libs/maths-editor/table-annotations.mjs');
   const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   const sample=id=>{const root=document.getElementById(id);return{groups:groups.map(ids=>ids.map(cellId=>{
    const cell=root.querySelector('td[data-id="'+cellId+'"]');
    const strut=cell.querySelector('.katex-html > .base > .strut');
    const glyph=e=>{const css=getComputedStyle(e),range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect(),ctx=document.createElement('canvas').getContext('2d');ctx.font=css.font;const m=ctx.measureText(e.textContent),fontSizePx=parseFloat(css.fontSize);return{...rect(e),baseline:r.top+m.fontBoundingBoxAscent,axis:r.top+m.fontBoundingBoxAscent+(m.actualBoundingBoxDescent-m.actualBoundingBoxAscent)/2,axisFromBaselineEm:(m.actualBoundingBoxDescent-m.actualBoundingBoxAscent)/2/fontSizePx,fontSizePx};};
    const baseline=strut?strut.getBoundingClientRect().bottom+(parseFloat(getComputedStyle(strut).verticalAlign)||0):glyph(cell.querySelector('p')).baseline;
    return{cellId,baseline,cell:rect(cell),verticalAlign:getComputedStyle(cell).verticalAlign,boxes:[...cell.querySelectorAll('.fbox')].map(rect),equalities:[...cell.querySelectorAll('.mrel')].filter(e=>e.textContent==='=').map(glyph),fractionBars:[...cell.querySelectorAll('.frac-line')].map(e=>{const r=rect(e);return{...r,axis:(r.top+r.bottom)/2};})};
   })),arrow:(()=>{const table=root.querySelector('table[data-id="callout-table"]'),annotation=JSON.parse(table.dataset.annotations)[0],bounds=rect(table),scale=bounds.width/parseFloat(getComputedStyle(table).width),box=cellId=>{const r=rect(tableMathBoxElement(table.querySelector('td[data-id="'+cellId+'"]')));return{top:(r.top-bounds.top)/scale,left:(r.left-bounds.left)/scale,right:(r.right-bounds.left)/scale};};return{from:box(annotation.cellId),to:box(annotation.toCellId),path:table.parentElement.querySelector('[data-table-annotations] path')?.getAttribute('d'),diagnostics:table.parentElement.querySelector('[data-annotation-diagnostics]')?.textContent??null};})()};};
   return{media,baseline:sample('baseline-preview'),middle:onlyBaseline?null:sample('middle-preview')};
  },{groups:equationCellIds,media,onlyBaseline});
 };
 const measurements=[];
 for(const media of ['screen','print']){
  const m=await measure(media);measurements.push(m);
  for(let i=0;i<m.baseline.groups.length;i++){
   const group=m.baseline.groups[i],control=m.middle.groups[i],ys=group.map(c=>c.baseline);
   assert(Math.max(...ys)-Math.min(...ys)<1,media+' unmutated equation baselines must align: '+JSON.stringify(group));
   const axes=group.flatMap(c=>[...c.equalities.map(x=>x.axis),...c.fractionBars.map(x=>x.axis)]);assert(Math.max(...axes)-Math.min(...axes)<1,media+' actual equality and fraction axes must align');
   const old=control.map(c=>c.baseline);assert(Math.max(...old)-Math.min(...old)>1,'Control must reproduce the unequal-height alignment defect');
   group.forEach((c,j)=>{assert.equal(c.verticalAlign,'baseline');assert.equal(control[j].verticalAlign,'middle');assert.equal(c.boxes.length,control[j].boxes.length);c.boxes.forEach((b,k)=>{assert(Math.abs(b.width-control[j].boxes[k].width)<.2);assert(Math.abs(b.height-control[j].boxes[k].height)<.2);});});
  }
  const arrow=m.baseline.arrow;assert.equal(arrow.diagnostics,null);assert(arrow.path);const numbers=arrow.path.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/g).map(Number);
  assert(Math.abs(numbers[1]-arrow.from.top)<.2);assert(Math.abs(numbers[7]-arrow.to.top)<.2);
  assert(numbers[0]>arrow.from.left&&numbers[0]<arrow.from.right);assert(numbers[6]>arrow.to.left&&numbers[6]<arrow.to.right);
 }
 // Printing must preserve settled geometry at each supported transformed scale,
 // restore only its own styles, and remove both event listeners on destroy.
 const lifecycle=[];
 for(const scale of [.75,1,1.5]){
  lifecycle.push(await page.evaluate(scale=>{
   const root=document.getElementById('baseline-preview');root.style.transform='scale('+scale+')';root.style.transformOrigin='top left';
   const cells=[...root.querySelectorAll('td')],snapshot=()=>cells.map(c=>({id:c.dataset.id,style:c.getAttribute('style'),firstTop:c.firstElementChild.getBoundingClientRect().top,boxes:[...c.querySelectorAll('.fbox')].map(e=>{const r=e.getBoundingClientRect();return[r.left,r.top,r.width,r.height];})}));
   const before=snapshot();window.dispatchEvent(new Event('beforeprint'));const frozen=snapshot();window.dispatchEvent(new Event('afterprint'));const restored=snapshot();return{scale,before,frozen,restored};
  },scale));
 }
 for(const state of lifecycle){assert.deepEqual(state.restored,state.before,'Exact afterprint restoration');state.before.forEach((c,i)=>{assert(Math.abs(c.firstTop-state.frozen[i].firstTop)<.3,'Print inset preserves transformed content position');assert.equal(c.boxes.length,state.frozen[i].boxes.length);c.boxes.forEach((box,j)=>{const frozen=state.frozen[i].boxes[j];assert.deepEqual(box.slice(2),frozen.slice(2),'Print inset preserves exact writing-box dimensions');assert(Math.abs(box[0]-frozen[0])<.1&&Math.abs(box[1]-frozen[1])<.1,'Print inset preserves writing-box position within subpixel layout rounding');});});}
 const concurrentStyle=await page.evaluate(()=>{const cell=document.querySelector('#baseline-preview td');const before=cell.style.verticalAlign;window.dispatchEvent(new Event('beforeprint'));cell.style.setProperty('color','rgb(12, 34, 56)','important');window.dispatchEvent(new Event('afterprint'));const result={before,alignment:cell.style.verticalAlign,colour:cell.style.color,priority:cell.style.getPropertyPriority('color')};cell.style.removeProperty('color');return result;});assert.equal(concurrentStyle.alignment,concurrentStyle.before);assert.equal(concurrentStyle.colour,'rgb(12, 34, 56)');assert.equal(concurrentStyle.priority,'important');
 await page.evaluate(()=>{document.getElementById('baseline-preview').style.transform='none';});
 await page.addStyleTag({content:'@page{size:A4;margin:0}@media print{body>*:not(#baseline-preview){display:none!important}#baseline-preview{margin:0!important;width:180mm!important}}'});
 const pdfGeometry=await measure('print',true);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'pdf-geometry.json'),JSON.stringify(pdfGeometry,null,2)+'\n');
 const pdf=path.join(out,'baseline-fixture.pdf');await page.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
 const pdfCheck=spawnSync('python',[path.resolve('scripts/booklet/check-table-baseline-pdf.py'),pdf,path.join(out,'pdf-geometry.json'),path.join(out,'pdf-check.json')],{encoding:'utf8'});fs.writeFileSync(path.join(out,'pdf-check-output.txt'),(pdfCheck.stdout??'')+(pdfCheck.stderr??''));assert.equal(pdfCheck.status,0,pdfCheck.stdout+pdfCheck.stderr);
 const cleanup=await page.evaluate(()=>{const root=document.getElementById('baseline-preview'),before=[...root.querySelectorAll('td')].map(c=>c.getAttribute('style'));window.dispatchEvent(new Event('beforeprint'));window.baselineObservers.forEach(o=>o.destroy());const restored=[...root.querySelectorAll('td')].map(c=>c.getAttribute('style'));window.dispatchEvent(new Event('beforeprint'));window.dispatchEvent(new Event('afterprint'));return{before,restored,afterEvents:[...root.querySelectorAll('td')].map(c=>c.getAttribute('style'))};});assert.deepEqual(cleanup.restored,cleanup.before);assert.deepEqual(cleanup.afterEvents,cleanup.before);
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);assert.deepEqual(await value(),saved);
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({at:new Date().toISOString(),passed:true,browserVersion:browser.version(),checks:['real-cell-option','structured-editor-save-reopen','production-preview-baselines','print-media-baselines','middle-control','unchanged-writing-box-dimensions','attached-maths-box-arrow'],measurements,lifecycle,concurrentStyle,cleanup,pdfGeometry,pdfCheck:JSON.parse(fs.readFileSync(path.join(out,'pdf-check.json'),'utf8')),errors,blocked,pdfExports:1,projectWrites:0,visualAcceptance:false},null,2)+'\n',{flag:'wx'});
 console.log('Table baseline editor, preview and print-media regression passed.');
}finally{await browser.close();}
