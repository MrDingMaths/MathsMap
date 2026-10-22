// One headless render pass per project and edition that records where things
// land on every printed page, in millimetres from the page's top-left corner.
// Read-only: the project (live or a candidate file) is served through a request
// intercept, as in first-pass/review.mjs, and nothing is saved.
//   node bench/render-geometry.mjs --project rates-v1 --out geometry.json
//   node bench/render-geometry.mjs --project-file candidate.json --editions student,short
// Per page: block ids, used/trailing body space, element boxes keyed by
// data-node-id / data-question-id / data-diagram-id, `.mrel` relation glyph boxes,
// and line rectangles for text and maths inside teaching (non-practice) blocks.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {withRenderResource,BASE} from '../first-pass/review.mjs';
import {isPractice} from '../src/lib/booklet-flow.js';
import {inkGeometry,nodeIdsByBlock} from './render-ink.mjs';

export const GEOMETRY_EDITIONS=Object.freeze(['student','short','worked','with-short','with-worked']);

// Runs inside the page, once per `.print-page`. Everything it returns is
// serialisable; lengths are rounded to 0.1 mm.
function pageGeometry(element,{teaching,pageSpaceUrl},measure){
 const paper=element.querySelector('.booklet-page')??element,paperRect=paper.getBoundingClientRect();
 const k=paperRect.width?210/paperRect.width:0,mm=value=>Math.round(value*k*10)/10;
 const box=r=>({x:mm(r.left-paperRect.left),y:mm(r.top-paperRect.top),w:mm(r.width),h:mm(r.height)});
 // A block is owned by its edit root, question wrapper, arrangement or document group;
 // maths-editor nodes carry data-id and the Svelte renderers data-node-id.
 const owner=el=>{const o=el.closest('[data-edit-root],[data-question-id],[data-arrangement-block],[data-document-group]');return o?(o.dataset.editRoot??o.dataset.questionId??o.dataset.arrangementBlock??o.dataset.documentGroup):null;};
 const nodeOf=el=>{const n=el.closest('[data-node-id],[data-id]');return n?(n.dataset.nodeId??n.dataset.id):null;};
 const blocks=element.dataset.flowBlocks?.split(',').filter(Boolean)??[];
 const isAnswer=!!element.querySelector('.compact-answer,.answer-columns,[id*="answer-section-"]'),isCover=!!element.querySelector('.booklet-cover,.project-cover');
 const space=measure?measure(element):null;
 const body=element.querySelector('main')?.getBoundingClientRect();
 const elements=[];
 for(const el of element.querySelectorAll('[data-node-id],[data-question-id],[data-diagram-id],[data-arrangement-block],table[data-id]')){
  const r=el.getBoundingClientRect();if(r.width<0.5&&r.height<0.5)continue;
  const kind=el.dataset.questionId?'question':el.dataset.diagramId?'diagram':el.dataset.arrangementBlock?'arrangement':el.dataset.nodeId?'node':'table';
  elements.push({id:el.dataset.questionId||el.dataset.diagramId||el.dataset.arrangementBlock||el.dataset.nodeId||el.dataset.id,kind,tag:el.tagName.toLowerCase(),block:owner(el),...box(r)});
 }
 const relations=[];
 for(const el of element.querySelectorAll('.mrel')){
  const r=el.getBoundingClientRect();if(r.width<0.2)continue;
  relations.push({text:el.textContent.trim().slice(0,4),node:nodeOf(el),block:owner(el),...box(r)});
 }
 // Lines of text and maths in teaching blocks. A Range over an element's
 // contents yields one client rect per line box, so wrapped text reports each line.
 const lines=[],wanted=new Set(teaching);
 for(const el of element.querySelectorAll('p,li,td,th,.editable-booklet-text,.katex-display,.katex-html')){
  const block=owner(el);if(!wanted.has(block))continue;
  const math=el.matches('.katex-display,.katex-html');
  // Text inside a formula is reported by the formula, not once more as text.
  if(!math&&el.closest('.katex-html,.katex-display'))continue;
  if(math&&el.matches('.katex-html')&&el.closest('.katex-display'))continue;
  const range=document.createRange();range.selectNodeContents(el);
  const rects=math?[el.getBoundingClientRect()]:[...range.getClientRects()].filter(r=>r.width>0.5&&r.height>0.5);
  const merged=[];
  for(const r of rects){const last=merged.at(-1);if(last&&Math.abs(last.top-r.top)<1&&Math.abs(last.bottom-r.bottom)<1){last.left=Math.min(last.left,r.left);last.right=Math.max(last.right,r.right);}else merged.push({left:r.left,right:r.right,top:r.top,bottom:r.bottom});}
  for(const r of merged)lines.push({kind:math?'math':'text',node:nodeOf(el),block,x:mm(r.left-paperRect.left),y:mm(r.top-paperRect.top),w:mm(r.right-r.left),h:mm(r.bottom-r.top)});
 }
 return {blocks,isAnswer,isCover,space,body:body?box(body):null,elements,relations,lines};
}

// Render each edition of a project and return its page geometry. `project` is
// the whole record (a candidate need not exist on disk). Returns
// {projectId, revision, renderedAt, editions:{<edition>:{pageCount,pages:[...]}}}.
// With `ink`, each page also carries `ink`, keyed by teaching block id (render-ink.mjs), and
// `issues`, the print surface's own checks (booklet-qa.js inspectBookletPage).
// `probes` (22 October 2026, checks/): {name: function(printPageElement) -> serialisable}. Each function
// runs inside the page, self-contained, once per page, and its result is stored in page.probes[name].
export async function renderGeometry(project,{base=BASE,editions=GEOMETRY_EDITIONS,ink=false,probes=null,log=()=>{}}={}){
 return withRenderResource(async()=>{
  const {chromium}=await import('playwright-core'),{routeCandidateProject}=await import('../scripts/booklet/diagram-preflight.mjs');
  let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
  try{
   const page=await(await browser.newContext({viewport:{width:1600,height:1100}})).newPage(),record=structuredClone(project),result={};
   page.setDefaultTimeout(300000);
   await routeCandidateProject(page,record);
   const teaching=record.sections.flatMap(s=>s.blocks??[]).filter(b=>!isPractice(b)).map(b=>b.id);
   for(const edition of editions){
    const started=Date.now();
    record.settings.flowEdition=edition;
    await page.goto('about:blank');
    await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(project.id),{waitUntil:'domcontentloaded',timeout:180000});
    await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
    const select=page.getByLabel('Booklet edition',{exact:true});await select.waitFor({state:'visible',timeout:600000});
    for(const deadline=Date.now()+600000;;){
     if(await select.inputValue()!==edition)await select.selectOption(edition);
     const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition,error:document.querySelector('.project-notice.error,[role=alert]')?.textContent}));
     if(state.state==='ready'&&state.edition===edition)break;
     if(state.state==='error')throw Error(`Pagination failed for ${edition}: ${state.error??''}`);
     if(Date.now()>deadline)throw Error('Pagination timed out for '+edition);
     await page.waitForTimeout(200);
    }
    await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
    await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
    await page.emulateMedia({media:'print'});
    await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
    // measureBookletPage and the geometry reader are loaded into the page once.
    const pages=await page.evaluate(async({fn,teaching})=>{
     const {measureBookletPage,BOOKLET_PX_PER_MM}=await import('/src/lib/booklet-page-space.js');
     const read=new Function('return ('+fn+')')();
     const measure=el=>{const m=measureBookletPage(el);if(!m)return null;const r=v=>Math.round(v*10)/10;return {capacityMm:r(m.capacity/BOOKLET_PX_PER_MM),usedMm:r(m.height/BOOKLET_PX_PER_MM),remainingMm:r(m.remainingMm),columnsMm:m.columns.map(r),overflowMm:r(m.overflowHeight/BOOKLET_PX_PER_MM)};};
     return [...document.querySelectorAll('.project-print .print-page')].map((el,i)=>({page:i+1,...read(el,{teaching},measure)}));
    },{fn:pageGeometry.toString(),teaching});
    if(ink){
     const idToBlock=nodeIdsByBlock(record.sections.flatMap(s=>s.blocks??[]).filter(b=>!isPractice(b)));
     const inks=await page.evaluate(({fn,idToBlock})=>{const read=new Function('return ('+fn+')')();return [...document.querySelectorAll('.project-print .print-page')].map(el=>read(el,{idToBlock}));},{fn:inkGeometry.toString(),idToBlock});
     pages.forEach((p,i)=>{p.ink=inks[i];});
     // The acceptance checks of the print surface, per page: a repair that introduces one is reverted.
     const issues=await page.evaluate(async()=>{
      const {inspectBookletPage}=await import('/src/lib/booklet-qa.js');
      return [...document.querySelectorAll('.project-print .print-page')].map(el=>{const paper=el.querySelector('.booklet-page');return paper?inspectBookletPage(paper).issues.map(i=>({kind:i.kind,id:String(i.id??''),targetId:i.targetId??null,excessMm:i.excessMm==null?null:Math.round(i.excessMm*10)/10})):[];});
     });
     pages.forEach((p,i)=>{p.issues=issues[i];});
    }
    if(probes&&Object.keys(probes).length){
     const sources=Object.fromEntries(Object.entries(probes).map(([name,fn])=>[name,fn.toString()]));
     const results=await page.evaluate(({sources})=>[...document.querySelectorAll('.project-print .print-page')].map(el=>Object.fromEntries(Object.entries(sources).map(([name,fn])=>[name,new Function('return ('+fn+')')()(el)]))),{sources});
     pages.forEach((p,i)=>{p.probes=results[i];});
    }
    await page.emulateMedia({media:'screen'});
    for(const p of pages){p.trailingMm=p.space&&!p.isAnswer?Math.max(0,p.space.remainingMm):null;}
    result[edition]={pageCount:pages.length,pages,elapsedMs:Date.now()-started};
    log(`${project.id} ${edition}: ${pages.length} pages, ${Math.round((Date.now()-started)/1000)} s`);
   }
   return {projectId:project.id,revision:project.revision??null,renderedAt:new Date().toISOString(),editions:result};
  }finally{await browser.close();}
 });
}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const file=arg('--project-file'),id=arg('--project');
 const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
 const project=file?read(file):read(`booklets/projects/${id??(()=>{throw Error('Use --project ID or --project-file FILE');})()}.json`);
 const editions=arg('--editions',GEOMETRY_EDITIONS.join(',')).split(',');
 if(editions.some(e=>!GEOMETRY_EDITIONS.includes(e)))throw Error('Unknown edition');
 const out=path.resolve(arg('--out',`.booklet-work/bench-20261022/geometry-${project.id}.json`));
 const geometry=await renderGeometry(project,{base:arg('--base',BASE).replace(/\/$/,''),editions,ink:args.includes('--ink'),log:console.log});
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(geometry));
 console.log(JSON.stringify({out,editions:Object.fromEntries(Object.entries(geometry.editions).map(([k,v])=>[k,v.pageCount]))}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
