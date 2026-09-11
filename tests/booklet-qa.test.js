import test from 'node:test';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
import {inspectBookletPage,assertBookletFits} from '../src/lib/booklet-qa.js';
import {BOOKLET_PALETTE} from '../public/libs/maths-editor/booklet-palette.mjs';
import {inspectDiagramColours} from '../src/lib/diagram-colours.js';
import {clozeLayout} from '../public/libs/maths-editor/house-style.mjs';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {styleGraph,graphTikz,readGraphModel} from '../src/lib/graph-model.js';
test('long cloze responses retain sufficient capacity and remain hidden in student output',()=>{
 const answer='find how many triangles can be made with 17 matchsticks',size=clozeLayout(answer,70);assert.ok(size.lines>1);
 const doc=normalizeDocument({blocks:[{type:'paragraph',inlines:[{type:'cloze',answer,expectedResponse:answer,...size}]}]});
 const html=renderDocument(doc);assert.ok(html.includes('data-lines="2"'));assert.ok(!html.includes('>'+answer+'<'));assert.ok(renderDocument(doc,{fillCloze:true}).includes('>'+answer+'<'));
});
test('explicit graph style preserves mathematics, applies palette and survives regeneration',()=>{
 const model=styleGraph({bounds:{xmin:-3,xmax:4,ymin:-2,ymax:6},lines:[{m:1,c:0},{m:-1,c:2},{m:2,c:1}]},55);
 const code=graphTikz(model),recovered=readGraphModel(code);assert.deepEqual(recovered.bounds,model.bounds);assert.deepEqual(recovered.lines.map(l=>l.colour),['blue','red','green']);assert.equal(recovered.gridColour,'housegrid');assert.ok(recovered.labelFontPt>recovered.tickFontPt);recovered.lines[0].c=1;assert.ok(graphTikz(recovered).includes('CCCCCC'));
});
test('page QA detects nested overflow, writing spaces, overlap, scaled fonts and wrapped labels',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});try{const page=await browser.newPage();
 const base='<style>*{box-sizing:border-box}article{position:relative;width:210mm;height:297mm;padding:10mm 15mm}main{width:180mm}footer{position:absolute;left:15mm;bottom:10mm;height:4mm}p{margin:0} .answer-space{height:40mm}</style>';
 async function check(html){await page.setContent(base+'<article data-page-number="62"><main>'+html+'</main><footer>Footer</footer></article>');return page.evaluate(({fn,colours,palette})=>(new Function('inspectDiagramColours','return ('+fn+')'))((new Function('BOOKLET_PALETTE','return ('+colours+')'))(palette))(document.querySelector('article'),{style:true}),{fn:inspectBookletPage.toString(),colours:inspectDiagramColours.toString(),palette:BOOKLET_PALETTE});}
 assert.equal((await check('<p>Fits</p>')).issues.length,0);
 const sourceColour=(metadata='',colour='#4654B5')=>`<div class="tikz-wrap"><svg width="100" height="50">${metadata}<path d="M0 20L90 20" fill="none" stroke="${colour}"/></svg></div>`;
 assert.ok((await check(sourceColour())).issues.some(i=>i.kind==='graph-palette'));
 const paletteEvidence='<metadata data-graph-source-palette="#4654B5" data-graph-source-reference="source page 8, example triangle"/>';
 assert.ok((await check(sourceColour(paletteEvidence))).issues.some(i=>i.kind==='graph-palette'));
 assert.ok((await check(sourceColour(paletteEvidence.replace('#4654B5','4654B5')))).issues.some(i=>i.kind==='graph-palette'));
 assert.ok((await check(sourceColour(paletteEvidence,'#AA0505'))).issues.some(i=>i.kind==='graph-palette'));
 assert.ok((await check(sourceColour(paletteEvidence.replace('source page 8, example triangle','')))).issues.some(i=>i.kind==='graph-palette'));
 assert.ok((await check('<div class="question-grid"><section class="question-node" data-node-id="part-a" style="width:40mm"><span class="katex-html"><span class="base" style="display:inline-block;width:50mm">Long formula</span></span></section></div>')).issues.some(i=>i.kind==='question-column-overflow'&&i.targetId==='part-a'));
 assert.ok((await check('<div class="arr-item" data-content-owner="part-b" style="width:40mm"><span class="katex-html"><span class="base" style="display:inline-block;width:50mm">Long native formula</span></span></div>')).issues.some(i=>i.kind==='question-column-overflow'&&i.targetId==='part-b'));
 const strokeSvg=(width,tag='data-graph-stroke-pt="0.8"')=>`<div class="tikz-wrap"><svg width="100" height="50"><metadata data-graph-strokes="1"/><path ${tag} d="M0 20L90 20" fill="none" stroke="black" stroke-width="${width}"/></svg></div>`;
 assert.ok((await check(strokeSvg(2))).issues.some(i=>i.kind==='graph-stroke-weight'));
 assert.ok((await check(strokeSvg(1.0666667))).issues.every(i=>!i.kind.includes('stroke')));
 assert.ok((await check(strokeSvg(1.2,''))).issues.some(i=>i.kind==='unclassified-graph-stroke'));
 assert.ok((await check('<div style="height:280mm"><p>Nested</p></div>')).issues.some(i=>i.kind==='footer-overflow'));
 assert.ok((await check('<div style="height:250mm"></div><div class="answer-space"></div>')).issues.some(i=>i.kind==='footer-overflow'));
 assert.ok((await check('<div class="arr-group"><div style="height:30mm">A</div><div style="height:30mm;margin-top:-20mm">B</div></div>')).issues.some(i=>i.kind==='sibling-overlap'));
 assert.ok((await check('<div class="tikz-wrap"><svg width="100" height="100" viewBox="0 0 200 200"><text x="10" y="20" font-size="14.667">1</text></svg></div>')).issues.some(i=>i.kind==='small-graph-label'));
 for(const [size,kind]of [[12,'small-graph-label'],[15,'large-graph-label']])assert.ok((await check(`<div class="tikz-wrap"><svg width="100" height="50"><text x="10" y="20" font-size="${size}">A</text></svg></div>`)).issues.some(i=>i.kind===kind),'Geometry labels need both bounds without graph tick metadata');
 const tickSvg=x=>'<div class="tikz-wrap"><svg width="160" height="50"><g data-graph-text="tick"><text x="20" y="30" font-size="11.3333">11</text></g><g data-graph-text="tick"><text x="'+x+'" y="30" font-size="11.3333">12</text></g></svg></div>';
 assert.ok((await check(tickSvg(23))).issues.some(i=>i.kind==='graph-tick-overlap'));
 assert.ok(!(await check(tickSvg(90))).issues.some(i=>i.kind==='graph-tick-overlap'));
 assert.ok((await check(tickSvg(90).replaceAll('font-size="11.3333"','font-size="16"'))).issues.some(i=>i.kind==='large-graph-label'));
 assert.equal((await check('<div class="tikz-wrap"><svg width="160" height="50"><g data-graph-text="tick"><text x="10" y="30" font-size="11.3333">1</text></g><text x="80" y="30" font-size="13.3333">x</text><text x="90" y="24" font-size="9.3333">2</text></svg></div>')).issues.length,0);
 assert.ok((await check('<table style="width:30mm;table-layout:fixed"><tr><td>Number of matches</td><td>1</td></tr></table>')).issues.some(i=>i.kind==='wrapped-table-label'));
 assert.ok(!(await check('<table style="width:60mm;table-layout:fixed"><tr><td>When the numerator has a higher power, find the difference of the powers and retain the base in the numerator.</td><td>When the denominator has a higher power, retain the base in the denominator.</td></tr></table>')).issues.some(i=>i.kind==='wrapped-table-label'));
 assert.ok(!(await check('<table style="width:30mm;table-layout:fixed"><tr><td><span class="katex">x/y</span><p>Law does not apply</p></td><td><span class="katex">x</span></td></tr></table>')).issues.some(i=>i.kind==='wrapped-table-label'));
 assert.throws(()=>assertBookletFits([{page:73,issues:[{kind:'footer-overflow'}]}]),/QA failed/);
 }finally{await browser.close();}
});

test('panel graph typography and colours survive a subsequent equation edit',()=>{
 const model=styleGraph({panels:[{widthCm:5,nodeScale:1.25,lines:[{m:1,c:0,colour:'black'}]},{widthCm:5,lines:[{m:-1,c:2,colour:'black'}]}]},120);
 assert.equal(model.panels[0].nodeScale,1.25);assert.equal(model.panels[0].lines[0].colour,'blue');
 const original=graphTikz(model);model.panels[0].lines[0].c=3;
 assert.ok(original.includes('\\tikzset{every node'));assert.equal(model.panels[0].nodeScale,1.25);
});

test('printed PDF gate detects footer clearance after browser pagination',async()=>{
 const {inspectPrintedPdf}=await import('../scripts/booklet/pdf-layout-qa.mjs');
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const dir=mkdtempSync(join(tmpdir(),'booklet-pdf-qa-')),file=join(dir,'case.pdf');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const page=await browser.newPage();await page.setContent('<style>@page{size:A4;margin:0}body{font:11pt Arial}p{position:absolute;margin:0;left:15mm}footer{position:absolute;left:170mm;top:285mm}</style><p style="top:284mm">Writing response</p><footer>Page 1</footer>');await page.pdf({path:file,preferCSSPageSize:true});assert.ok(inspectPrintedPdf(file)[0].issues.some(i=>i.kind==='pdf-footer-clearance'));}
 finally{await browser.close();rmSync(dir,{recursive:true,force:true});}
});
