// Real screen-to-print transition: settling in print media first conceals hidden-SVG calibration failures.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
import {graphTikz,styleGraph} from '../../src/lib/graph-model.js';
import {routeCandidateProject} from './diagram-preflight.mjs';

const out=process.env.BOOKLET_PRINT_TEST_OUT??'.booklet-work/print-transition';
fs.mkdirSync(out,{recursive:true});
const started=Date.now();
// Angle Relationships v1, p12-right-diagram, revision 477: the reported example.
const right={id:'right-angle',format:'tikz',widthMm:28.4,code:String.raw`
% mathsmap-diagram-colours {"version":1,"kind":"geometry","base":[],"semantic":[{"name":"exampleBlue","hex":"268CFF","reason":"Illustrated teaching magnitude"}],"reference":"Angle Relationships p12-right-diagram"}
\begin{tikzpicture}[x=1cm,y=1cm,line width=0.8pt,every node/.style={font=\fontsize{10}{12}\selectfont,text=black}]
\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}
\definecolor{exampleBlue}{HTML}{268CFF}
\coordinate (V) at (0,0); \coordinate (A) at (-1.5,0); \coordinate (B) at (0,1.5);
\draw[->] (V)--(A); \draw[->] (V)--(B);
\coordinate (P) at ($(V)!0.15!(A)$); \coordinate (Q) at ($(V)!0.15!(B)$);
\draw[line width=0.4pt] (P)--($(P)+(Q)-(V)$)--(Q);
\node[text=exampleBlue,above left] at ($(P)+(Q)-(V)$) {$90^\circ$};
\fill (V) circle (1.2pt);
\end{tikzpicture}`};
// A harmless unique comment forces one fresh compile; reopening exercises its cache.
const notation={id:'notation',format:'tikz',widthMm:60,code:String.raw`% print-transition-fresh ${started}
\begin{tikzpicture}
\path[use as bounding box] (0,0) rectangle (6,2);
\node[rotate=30] at (1.5,1) {$x_1^2+\frac{a}{b}$};
\node[anchor=west] at (3,1) {$\frac{12}{5}\text{ cm}$};
\end{tikzpicture}`};
const graph={id:'graph',format:'tikz',widthMm:65,code:graphTikz(styleGraph({bounds:{xmin:-2,xmax:2,ymin:-2,ymax:2},lines:[{m:1,c:0}],widthCm:5,heightCm:5},65))};
const smallTicks={...graph,id:'graph-8pt',code:graphTikz(styleGraph({bounds:{xmin:-2,xmax:2,ymin:-2,ymax:2},lines:[{m:-1,c:0}],widthCm:5,heightCm:5,tickTargetPt:8},65))};
const question=(id,prompt,diagrams)=>({id,type:'question',content:{id:id+'-root',type:'question',prompt,questionDiagrams:diagrams,answer:{short:'Use the labelled diagram.',worked:'Read the labelled angle or coordinates.',solutionDiagrams:diagrams.map(d=>({...d,id:d.id+'-answer'}))}}});
const record=normalizeEditableProject({id:'print-transition-check',title:'Print transition check',revision:1,
 settings:{paginationMode:'flexible',generatedCover:false,flowEdition:'student',exerciseOrganisation:'topic'},
 topics:[{id:'angles',title:'Diagram typography'}],sections:[{id:'practice',topicId:'angles',phase:'practice',title:'Practice',blocks:[
 question('q1','Right angle: $\\theta=90^\\circ$. Read the complete mathematical labels.',[right,notation]),
 {id:'manual-break',type:'page-break'},question('q2','Read the graph axes, ticks and plotted lines.',[graph,smallTicks])]}]});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1366,height:1000}}),page=await context.newPage();
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
await routeCandidateProject(page,record);
const ready=edition=>page.waitForFunction(edition=>{const root=document.querySelector('.flow-document');return root?.dataset.paginationState==='ready'&&(!edition||root.dataset.paginatedEdition===edition);},edition,{timeout:180000});
const measure=()=>page.evaluate(async()=>{
 const {graphPageScale,measureDiagramLabels,inspectDiagramLabelLayout}=await import('/src/lib/diagram-typography.js');
 const issues=[],pages=[];
 for(const article of document.querySelectorAll('.project-print .booklet-page')){
  const paper=article.getBoundingClientRect(),fonts={},strokes=[];
  for(const svg of article.querySelectorAll('svg.tikz-svg')){
   const scale=graphPageScale(svg);
   for(const label of measureDiagramLabels(svg))if(!Number.isFinite(label.pt)||Math.abs(label.pt-label.targetPt)>.1)issues.push({kind:'label-size',...label});
   issues.push(...inspectDiagramLabelLayout(svg).filter(i=>i.kind!=='diagram-label-viewport'));
   for(const text of svg.querySelectorAll('[data-diagram-label] text')){
    const m=text.getScreenCTM(),css=getComputedStyle(text),font=css.fontFamily.replace(/["']/g,'').split(',')[0].trim();
    (fonts[font]??=[]).push(parseFloat(css.fontSize)*Math.hypot(m.c,m.d)*.75/scale);
   }
   for(const shape of svg.querySelectorAll('[data-graph-stroke-pt]')){
    const m=shape.getScreenCTM(),css=getComputedStyle(shape),b=shape.getBoundingClientRect(),target=Number(shape.dataset.graphStrokePt);
    const width=parseFloat(css.strokeWidth)*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))*.75/scale;
    if(Math.abs(width-target)>.05)issues.push({kind:'stroke-width',width,target});
    // A rotated path's rectangular SVG box is wider than its painted path.
    // Sample the actual curve so PDF stroke matching uses the same bounds.
    let rect=[b.left,b.top,b.right,b.bottom];
    if(shape.getTotalLength){
     const length=shape.getTotalLength(),steps=Math.max(1,Math.ceil(length*Math.hypot(m.a,m.b)/.25)),points=[];
     for(let i=0;i<=steps;i++)points.push(shape.getPointAtLength(length*i/steps).matrixTransform(m));
     rect=[Math.min(...points.map(p=>p.x)),Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.x)),Math.max(...points.map(p=>p.y))];
    }
    strokes.push({rect:rect.map((v,i)=>(v-(i%2?paper.top:paper.left))*.75/scale),pt:target});
   }
  }
  for(const font of Object.keys(fonts))fonts[font]=[...new Set(fonts[font].map(v=>+v.toFixed(4)))];
  pages.push({fonts,strokes});
 }
 return {pages,issues};
});
const capture=async(name,expected)=>{
 const file=path.join(out,name+'.pdf'),geometry=path.join(out,name+'.expected.json');fs.writeFileSync(geometry,JSON.stringify(expected,null,2));
 await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
 const text=execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8',windowsHide:true}),pages=text.split('\f').slice(0,-1);
 assert.equal(pages.length,expected.pages.length);assert.ok(pages.every(p=>p.trim().length>30),name+': blank PDF page');
 assert.ok(!/My learning|Layout & spacing|Booklets\s+Outline|Undo\s+Redo/.test(text),name+': workspace leaked into PDF');
 const result=execFileSync(process.env.BOOKLET_PDF_PYTHON??'python',['scripts/booklet/pdf-diagram-geometry.py',file,geometry],{encoding:'utf8',windowsHide:true});
 fs.writeFileSync(file+'.geometry.json',result);return {file,pages,geometry:JSON.parse(result)};
};
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://localhost:5173')+'/#/booklet?stage=projects&project='+record.id);await ready('student');
 // The stub checks handoff readiness; returning simulates closing/cancelling the dialog.
 await page.evaluate(()=>{window.__printChecks=[];window.print=()=>{
  const root=document.querySelector('.project-print'),labels=[...root.querySelectorAll('[data-diagram-label]:has(text)')].map(g=>{const m=g.getScreenCTM(),paper=g.closest('.booklet-page').getBoundingClientRect();return {pt:Number(g.dataset.labelFont)*Math.hypot(m.c,m.d)*.75/(paper.width/(210*96/25.4)),target:g.querySelector('[data-graph-text="tick"]')?Number(g.dataset.tickTarget):10};});
  window.__printChecks.push({pages:root.querySelectorAll('.print-page').length,labels});
 };});
 await page.getByRole('button',{name:'Export',exact:true}).click();await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();
 await page.waitForFunction(()=>window.__printChecks.length===1,null,{timeout:180000});await page.waitForFunction(()=>!document.querySelector('.project-print .print-page'));
 let count=1;
 for(const zoom of ['0.5','0.75','1']){
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);await page.keyboard.press('Control+p');
  await page.waitForFunction(count=>window.__printChecks.length===count,++count,{timeout:180000});
  await page.waitForFunction(()=>!document.querySelector('.project-print .print-page')&&!document.querySelector('.project-print.preparing-print'));
 }
 const actions=await page.evaluate(()=>window.__printChecks);
 assert.equal(actions.length,4);assert.ok(actions.every(a=>a.pages===2&&a.labels.length>0&&a.labels.every(l=>Math.abs(l.pt-l.target)<.1)),JSON.stringify(actions));
 const fresh=await page.evaluate(()=>window.TikZ?.stats?.());assert.ok(fresh.compiles>0,'Fresh diagrams were not compiled');
 await page.reload();await ready('student');
 for(const edition of ['student','short','worked','with-short','with-worked']){
  await page.getByRole('combobox',{name:'Booklet edition',exact:true}).selectOption(edition);await ready(edition);
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
  await page.evaluate(async()=>{const root=document.querySelector('.project-print');await window.TikZ?.flushPending(root,180000);const {settleBookletMeasurement}=await import('/src/lib/booklet-measurement.js');await settleBookletMeasurement(root);});
  const expected=await measure();assert.deepEqual(expected.issues,[]);
  // No print emulation or print-media observer delay before this PDF.
  const immediate=await capture(edition+'-immediate',expected);
  await page.emulateMedia({media:'print'});await page.waitForTimeout(200);
  const settledExpected=await measure();assert.deepEqual(settledExpected.issues,[]);
  const settled=await capture(edition+'-settled',settledExpected);assert.deepEqual(immediate.pages,settled.pages);
  for(let i=1;i<=immediate.pages.length;i++){
   const raster=file=>execFileSync('pdftoppm',['-r','144','-f',String(i),'-l',String(i),'-singlefile',file],{windowsHide:true,maxBuffer:32*1024*1024});
   assert.ok(raster(immediate.file).equals(raster(settled.file)),edition+': PDF page '+i+' changed pixels during print transition');
  }
  checks.push({edition,pages:immediate.pages.length,printed:immediate.geometry,pixelIdentical:true});await page.emulateMedia({media:null});
 }
 const cache=await page.evaluate(()=>window.TikZ?.stats?.());assert.ok(cache.idbHits+cache.serverHits>0,'Reopened diagrams did not exercise the cache');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,actions,fresh,cache,errors,elapsedMs:Date.now()-started},null,2));
 console.log(JSON.stringify({checks:checks.map(c=>({edition:c.edition,pages:c.pages,pixelIdentical:c.pixelIdentical})),actions:actions.length,elapsedMs:Date.now()-started}));
}finally{await browser.close();}
