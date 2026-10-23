#!/usr/bin/env node
// Booklet first-pass review (user approved 15 October 2026). The contract,
// calibration and commands are in docs/booklet-first-pass-review.md.
// This file lives outside scripts/ on purpose: exports freeze that tree, and a
// new file there fails any export in flight.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {conflictsWithDecidedConvention} from '../src/lib/booklet-cloze-convention.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const BASE='http://127.0.0.1:5173';
export const LIMITS=Object.freeze({concurrency:3,studentPages:6,answerPages:6,blockCharacters:1800,payloadCharacters:90000,nodes:60,similarPerKind:2,similarBlocks:12,similarCharacters:12000,sourceImages:8,blockArgument:24000});
export const EDITIONS=Object.freeze(['student','short','worked']);
export const EDITION_NAMES=Object.freeze({student:'Questions',short:'Short answers',worked:'Worked solutions'});
export const AREAS=Object.freeze(['pagination','spacing','labels','response','table','diagram','alignment','answers','content','review','extension','duplicate']);
const SCOPES=['local','all'];
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const sha=value=>createHash('sha256').update(value).digest('hex');
const now=()=>new Date().toISOString();
const text=value=>typeof value==='string'?value.trim():'';
const relative=(root,file)=>path.relative(root,file).replaceAll('\\','/');
const FULL_REASON='First-pass review: rasters of the reviewed Questions pages and their answer pages (docs/booklet-first-pass-review.md).';

// ---- contract -------------------------------------------------------------------

const contracts=new Map();
export function contract({root=ROOT}={}){
 if(contracts.has(root))return contracts.get(root);
 const doc=fs.readFileSync(path.join(root,'docs','booklet-first-pass-review.md'),'utf8');
 const match=doc.match(/<!-- contract:first-pass:start -->\r?\n([\s\S]*?)\r?\n<!-- contract:first-pass:end -->/);
 if(!match?.[1].trim())throw Error('Missing first-pass contract in docs/booklet-first-pass-review.md');
 contracts.set(root,match[1].trim());return contracts.get(root);
}
// Said after the contract: workers cannot open files, and the teacher's earlier
// decisions on these blocks travel with the pages.
export const FRAMING='Do not run commands or open files: everything you need is below and in the attached images, in the order of "pages" (then "source", when given).\n\n"decided" lists comments the teacher has already seen on these blocks. "rejected" means the teacher deleted it: do not raise that issue again in any wording. "kept" and "open" are already with the teacher: do not repeat them. A different problem on the same block is still reportable.';

// ---- booklet index ----------------------------------------------------------------

// Every id inside a top-level block maps to that block, so a finding on a part,
// cell or diagram is owned by the block that holds it.
export function bookletIndex(project){
 const blocks=new Map(),owners=new Map(),ids=new Map();let order=0;
 for(const section of project.sections??[])for(const block of section.blocks??[]){
  const own=new Set();
  const visit=value=>{if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object'){if(typeof value.id==='string'){own.add(value.id);if(!owners.has(value.id))owners.set(value.id,block.id);}Object.values(value).forEach(visit);}};
  visit(block);owners.set(block.id,block.id);own.add(block.id);
  blocks.set(block.id,{block,section,order:order++});ids.set(block.id,own);
 }
 return {blocks,owners,ids};
}
const frontMatter=(index,id)=>index.blocks.get(id)?.section.phase==='front-matter';
const roleOf=({block,section})=>block.pedagogyRole??(section.phase==='practice'?'practice':section.phase??'unlabelled');
const labelOf=block=>block.label??block.content?.label??null;
// Layout overrides live in project settings, keyed by a block or node id, or a path of ids.
export function overridesFor(project,index,blockId){
 const own=index.ids.get(blockId)??new Set([blockId]),result={};
 for(const [name,map] of Object.entries(project.settings?.layoutOverrides??{})){
  if(!map||typeof map!=='object'||Array.isArray(map))continue;
  const entries=Object.entries(map).filter(([key])=>key.split('/').some(part=>own.has(part)));
  if(entries.length)result[name]=Object.fromEntries(entries);
 }
 return result;
}
// A finding is about layout, so its target counts as changed when the block or
// any layout override that names it changes.
export function blockHash(project,index,blockId){
 const found=index.blocks.get(blockId);
 return found?sha(JSON.stringify(found.block)+JSON.stringify(overridesFor(project,index,blockId))):null;
}
// What the booklet looks like, not who saved it: comments and revisions do not move pages.
export function contentHash(project){const {studio,revision,updatedAt,...rest}=project;return sha(JSON.stringify(rest));}

// ---- block payloads -----------------------------------------------------------------

const LAYOUT=new Set(['align','verticalAlign','spaceBefore','spaceAfter','marginBefore','marginAfter','padding','margin','widths','rowHeights','border','borderColour','background','widthMm','width','heightMm','gap','minHeight','answerSpaceMm','layout','columns','flow','fontSize','lineHeight','indent','display','header','colspan','rowspan','pageBreakBefore','responseLabel','unlabelled','presentation']);
export function textOf(node,limit=160){
 const parts=[];let size=0;
 (function walk(value){
  if(size>limit)return;
  if(Array.isArray(value))return value.forEach(walk);
  if(typeof value==='string'){parts.push(value);size+=value.length;return;}
  if(!value||typeof value!=='object')return;
  if(value.type==='text'&&value.text){parts.push(value.text);size+=value.text.length;}
  else if(value.type==='math'&&value.latex){parts.push('$'+value.latex+'$');size+=value.latex.length+2;}
  else if(value.type==='cloze')parts.push(`[cloze w=${value.width??'?'}]`);
  for(const key of ['prompt','inlines','blocks','content','rows','cells','children'])if(value[key])walk(value[key]);
 })(node);
 return parts.join(' ').replace(/\s+/g,' ').trim().slice(0,limit);
}
// The layout fields of a block and its children, with text cut to a line.
export function compactLayout(node,depth=0){
 if(Array.isArray(node))return node.map(child=>compactLayout(child,depth));
 if(!node||typeof node!=='object')return node;
 const out={};
 if(node.id)out.id=node.id;if(node.type)out.type=node.type;
 if(node.label!==undefined&&typeof node.label!=='object')out.label=node.label;
 for(const [key,value] of Object.entries(node))if(LAYOUT.has(key)&&value!=null)out[key]=typeof value==='object'&&JSON.stringify(value).length>300?JSON.stringify(value).slice(0,300)+'…':value;
 if(node.type==='paragraph'||node.type==='cell'){out.text=textOf(node);return out;}
 if(node.type==='tikz'||node.code){out.diagram=String(typeof node.spec==='string'?node.spec:typeof node.alt==='string'?node.alt:'diagram').slice(0,120);return out;}
 const kids=[];
 for(const key of ['prompt','content','blocks','parts','items','rows','children','questions'])if(node[key]&&typeof node[key]==='object')kids.push(...(Array.isArray(node[key])?node[key].flat():[node[key]]));
 if(kids.length&&depth<7)out.children=kids.map(child=>compactLayout(child,depth+1)).filter(child=>child&&(child.id||child.text||child.children));
 else if(kids.length)out.text=textOf(kids);
 return out;
}
export function blockEntry(project,index,blockId,{characters=LIMITS.blockCharacters}={}){
 const found=index.blocks.get(blockId);if(!found)return null;
 const {block,section}=found,overrides=overridesFor(project,index,blockId);
 const entry={id:block.id,type:block.type,role:roleOf(found),section:section.title??null,label:labelOf(block),layout:compactLayout(block),
  ...(overrides.answerSpaces?{answerSpaces:Object.fromEntries(Object.entries(overrides.answerSpaces).slice(0,30))}:{}),
  ...(overrides.blockLayouts?.[blockId]?{arrangement:JSON.stringify(overrides.blockLayouts[blockId]).slice(0,600)}:{})};
 if(JSON.stringify(entry).length>characters)entry.layout=JSON.parse(JSON.stringify(entry.layout,(key,value)=>key==='children'&&JSON.stringify(value).length>400?value.slice(0,6):value));
 return JSON.stringify(entry).length>characters*2?{...entry,layout:{id:block.id,type:block.type,text:textOf(block)}}:entry;
}
const textEntry=(index,id)=>{const found=index.blocks.get(id);return found?{id,label:labelOf(found.block),text:textOf(found.block)}:null;};
// Comparable blocks outside the batch, nearest first, for consistency checks.
export function similarBlocks(project,index,batchIds,studentMap=[],{perKind=LIMITS.similarPerKind,limit=LIMITS.similarBlocks,characters=LIMITS.similarCharacters}={}){
 const inBatch=new Set(batchIds),kinds=new Map(),pageOf=new Map();
 for(const page of studentMap)for(const id of page.blocks??[])if(!pageOf.has(id))pageOf.set(id,page.page);
 const kindOf=found=>found.block.type+'|'+roleOf(found);
 for(const id of batchIds){const found=index.blocks.get(id);if(!found||found.section.phase==='front-matter')continue;if(!kinds.has(kindOf(found)))kinds.set(kindOf(found),[]);kinds.get(kindOf(found)).push(found.order);}
 const picked=[];
 for(const [kind,orders] of kinds){
  const rows=[...index.blocks.values()].filter(found=>!inBatch.has(found.block.id)&&found.section.phase!=='front-matter'&&kindOf(found)===kind);
  rows.sort((a,b)=>Math.min(...orders.map(o=>Math.abs(o-a.order)))-Math.min(...orders.map(o=>Math.abs(o-b.order))));
  picked.push(...rows.slice(0,perKind));
 }
 const result=[];let used=0;
 for(const found of picked.slice(0,limit)){
  const entry=blockEntry(project,index,found.block.id,{characters:700}),row={...entry,page:pageOf.get(found.block.id)??null},size=JSON.stringify(row).length;
  if(used+size>characters)continue;
  result.push(row);used+=size;
 }
 return result;
}

// ---- pages and batches ----------------------------------------------------------------

export function parsePages(value){
 if(!value)return null;
 const pages=new Set();
 for(const part of String(value).split(',').map(item=>item.trim()).filter(Boolean)){
  const match=part.match(/^(\d+)(?:-(\d+))?$/);if(!match)throw Error('--pages takes numbers and ranges such as 12-30,34');
  const first=Number(match[1]),last=Number(match[2]??match[1]);if(last<first)throw Error('Page range runs backwards: '+part);
  for(let page=first;page<=last;page++)pages.add(page);
 }
 return pages;
}
const uniqueBlocks=page=>[...new Set(page.blocks??[])];
// Questions pages in the range that carry reviewable blocks, and every answer
// page that carries one of their blocks.
export function selectPages(index,pagemap,{pages}={}){
 const student=(pagemap.student??[]).filter(page=>(!pages||pages.has(page.page))&&uniqueBlocks(page).some(id=>index.blocks.has(id)&&!frontMatter(index,id)));
 const blocks=[...new Set(student.flatMap(page=>uniqueBlocks(page).filter(id=>index.blocks.has(id)&&!frontMatter(index,id))))],wanted=new Set(blocks);
 const answers=edition=>(pagemap[edition]??[]).filter(page=>uniqueBlocks(page).some(id=>wanted.has(id)));
 return {student,short:answers('short'),worked:answers('worked'),blocks};
}
const pageRow=(index,edition,page)=>({edition,page:page.page,blocks:uniqueBlocks(page).map(id=>{const found=index.blocks.get(id);return {id,type:found?.block.type??null,role:found?roleOf(found):null,label:found?labelOf(found.block):null};}),nodes:(page.nodes??[]).slice(0,LIMITS.nodes)});
// What the teacher has already seen on these blocks.
export function decidedFor(record,blockIds){
 const wanted=new Set(blockIds),state=finding=>finding.state==='rejected'?'rejected':finding.state==='approved'?'kept':finding.commentId&&['pending','stale'].includes(finding.state)?'open':null;
 return (record.findings??[]).filter(finding=>state(finding)&&finding.targets.some(target=>wanted.has(target.blockId))).map(finding=>({state:state(finding),edition:finding.edition,area:finding.area,targets:finding.targets.map(target=>target.id),comment:finding.comment}));
}
export function batchPrompt({project,index,edition,rows,pagemap,record={findings:[]},source=[],root=ROOT,textbook=false}){
 const ids=[...new Set(rows.flatMap(row=>row.blocks.map(block=>block.id)))].filter(id=>index.blocks.has(id));
 const payload={booklet:project.title??project.id,course:project.settings?.cover?.course??null,edition,pages:rows,
  blocks:edition==='student'?ids.map(id=>blockEntry(project,index,id)).filter(Boolean):ids.map(id=>textEntry(index,id)).filter(Boolean),
  similar:edition==='student'?similarBlocks(project,index,ids,pagemap.student):[],
  decided:decidedFor(record,ids),...(source.length?{source:source.map(row=>({sourcePage:row.page}))}:{})};
 const build=()=>contract({root})+'\n\n'+FRAMING+(textbook?'\n\nTextbook import override: do not assess pedagogy, opening reviews, extensions, bridging questions or teaching-sequence redesign. Return only source/content and presentation defects; never return review or extension findings.':'')+'\n\nInput:\n'+JSON.stringify(payload);
 let prompt=build();
 // Too large: drop the comparisons first, then cut block layouts to a line of text.
 if(prompt.length>LIMITS.payloadCharacters&&payload.similar.length){payload.similar=[];prompt=build();}
 if(prompt.length>LIMITS.payloadCharacters&&edition==='student'){payload.blocks=payload.blocks.map(block=>({...block,layout:{id:block.id,type:block.type,text:textOf(index.blocks.get(block.id)?.block)}}));prompt=build();}
 return {prompt,payload};
}
// At most six pages per call (polish pipeline, 23 October 2026: the source pages of the batch's own blocks, up to
// eight, travel with them), one edition per call, and a new call before the prompt passes the size limit.
export function planBatches({project,index,selection,pagemap,record,root=ROOT}){
 const batches=[];
 for(const edition of EDITIONS){
  const size=edition==='student'?LIMITS.studentPages:LIMITS.answerPages;let current=[];
  for(const page of selection[edition]){
   const row=pageRow(index,edition,page),next=[...current,row];
   if(current.length&&(next.length>size||batchPrompt({project,index,edition,rows:next,pagemap,record,root}).prompt.length>LIMITS.payloadCharacters)){batches.push({edition,rows:current});current=[row];}
   else current=next;
  }
  if(current.length)batches.push({edition,rows:current});
 }
 return batches;
}
// Source page images for the blocks on a Questions batch, when the import run kept them: the pages of the batch's
// own blocks (sourcePageNumber, then sourceRefs), in the order the blocks print, at most `limit`.
export function sourceImages(index,rows,runDir,{limit=LIMITS.sourceImages}={}){
 if(!runDir)return [];
 const pages=[];
 for(const row of rows)for(const {id} of row.blocks){const found=index.blocks.get(id);if(!found)continue;for(const page of [found.block.sourcePageNumber??found.section.sourcePageNumber,...(found.block.sourceRefs??[]).map(ref=>ref.pageNumber)])if(Number.isInteger(page)&&!pages.includes(page))pages.push(page);}
 return pages.map(page=>({page,path:path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png')})).filter(row=>fs.existsSync(row.path)).slice(0,limit);
}

// ---- rendering ---------------------------------------------------------------------------

async function serverReady(base){
 try{const response=await fetch(base,{signal:AbortSignal.timeout(5000)});return response.ok||response.status<500;}catch{return false;}
}
// Per-page block maps of each edition, in the print surface that
// check-feedback-pages rasterises. Read-only: the project is served through a
// request intercept and nothing is saved.
export async function withRenderResource(action){
 const {withWorkerSlot}=await import('../scripts/booklet/worker-pool.mjs');
 return withWorkerSlot(path.join(ROOT,'.booklet-work','first-pass-render-resources'),{tool:'first-pass-render',resource:'browser-and-print'},action);
}
export async function renderPageMap(project,options={}){
 return withRenderResource(()=>renderPageMapInner(project,options));
}
async function renderPageMapInner(project,{base=BASE,editions=EDITIONS}={}){
 if(!await serverReady(base))throw Error(`No Studio server at ${base}. Start the port-5173 server with the mathsmap-dev launch configuration (AGENTS.md, Remote Studio access).`);
 const {chromium}=await import('playwright-core'),{routeCandidateProject}=await import('../scripts/booklet/diagram-preflight.mjs');
 let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 try{
  const page=await(await browser.newContext({viewport:{width:1600,height:1100}})).newPage(),record=structuredClone(project),result={};
  page.setDefaultTimeout(300000);
  await routeCandidateProject(page,record);
  for(const edition of editions){
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
   result[edition]=await page.locator('.project-print .print-page').evaluateAll(elements=>elements.map((element,i)=>{
    const nodes=[];
    for(const el of element.querySelectorAll('[data-question-id],[data-node-id],[data-diagram-id]')){const id=el.dataset.questionId||el.dataset.nodeId||el.dataset.diagramId;if(id&&!nodes.includes(id))nodes.push(id);}
    return {page:i+1,blocks:element.dataset.flowBlocks?.split(',').filter(Boolean)??[],nodes:nodes.slice(0,80),isAnswer:!!element.querySelector('.compact-answer,.answer-columns,[id*="answer-section-"]'),isCover:!!element.querySelector('.booklet-cover,.project-cover')};
   }));
   // The paginator's own issues for this edition (oversized-content and the like): a repair that adds one is reverted.
   (result.issues??={})[edition]=await page.evaluate(()=>{try{return JSON.parse(document.querySelector('.project-print')?.dataset.layoutIssues||'[]').map(issue=>({kind:issue.kind,id:issue.id,message:issue.message}));}catch{return [];}});
   await page.emulateMedia({media:'screen'});
  }
  return result;
 }finally{await browser.close();}
}
// The page map is cached by booklet content: comments and saves that change
// nothing printed reuse it. --fresh renders again after a renderer change.
export async function defaultMapPages({project,dir,base,fresh}){
 const file=path.join(dir,'pagemap.json');
 if(!fresh&&fs.existsSync(file))return read(file).editions;
 const editions=await renderPageMap(project,{base});
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,JSON.stringify({projectId:project.id,revision:project.revision??null,contentHash:contentHash(project),renderedAt:now(),editions},null,1)+'\n');
 return editions;
}
const blocksOn=(pages,wanted)=>pages.filter(page=>uniqueBlocks(page).some(id=>wanted.has(id))).map(page=>page.page);
// check-feedback-pages paginates again; its pages must be the page map's pages.
export function checkReport(report,pagemap,blocks,editions){
 const wanted=new Set(blocks),errors=[];
 for(const edition of editions){
  const entry=report.editionsReport?.[edition];
  if(!entry){errors.push(edition+': no report');continue;}
  if(entry.pageCount!==(pagemap[edition]??[]).length)errors.push(`${edition}: ${entry.pageCount} pages rendered, ${(pagemap[edition]??[]).length} in the page map`);
  else if(JSON.stringify(entry.changed??[])!==JSON.stringify(blocksOn(pagemap[edition]??[],wanted)))errors.push(edition+': the reviewed blocks fall on different pages from the page map');
 }
 return errors;
}
const imagesOf=report=>Object.fromEntries(Object.entries(report.editionsReport??{}).map(([edition,entry])=>[edition,Object.fromEntries((entry.images??[]).map(image=>[image.page,image.path]))]));
// Rasters of the selected pages, from check-feedback-pages (which needs
// PowerShell's Poppler for its printed-geometry checks). An earlier render of
// the same content that already covers the pages is reused.
export async function defaultRenderImages({project,dir,selection,pagemap,base,fresh,root,log=()=>{}}){
 const editions=EDITIONS.filter(edition=>selection[edition].length),needed=edition=>selection[edition].map(page=>page.page);
 const covers=report=>{const images=imagesOf(report);return editions.every(edition=>needed(edition).every(page=>images[edition]?.[page]&&fs.existsSync(images[edition][page])));};
 const recovered={editionsReport:{},failures:[]};
 if(!fresh&&fs.existsSync(dir))for(const name of fs.readdirSync(dir).filter(name=>name.startsWith('pages-'))){
  const file=path.join(dir,name,'feedback-pages.json');if(!fs.existsSync(file))continue;
  const report=read(file);if(covers(report)&&!checkReport(report,pagemap,report.blocks??[],editions).length)return {images:imagesOf(report),report:relative(root,file),failures:report.failures??[],reused:true};
  const images=imagesOf(report);
  for(const edition of editions)if(!checkReport(report,pagemap,selection.blocks,[edition]).length&&needed(edition).every(page=>images[edition]?.[page]&&fs.existsSync(images[edition][page]))){recovered.editionsReport[edition]=report.editionsReport[edition];recovered.failures.push(...(report.failures??[]).filter(row=>row.edition===edition));}
 }
 const missing=editions.filter(edition=>!recovered.editionsReport[edition]);
 if(!missing.length){const file=path.join(dir,'recovered-feedback-pages.json');fs.writeFileSync(file,JSON.stringify({...recovered,blocks:selection.blocks},null,1));return {images:imagesOf(recovered),report:relative(root,file),failures:recovered.failures,reused:true};}
 const argument=selection.blocks.join(',');
 if(argument.length>LIMITS.blockArgument)throw Error('Too many blocks for one render; review the booklet in page ranges with --pages.');
 const snapshot=path.join(dir,'project.json'),out=path.join(dir,'pages-'+sha(argument+missing.join()).slice(0,10)),logFile=path.join(dir,path.basename(out)+'.log');
 fs.mkdirSync(out,{recursive:true});if(!fs.existsSync(snapshot))fs.writeFileSync(snapshot,JSON.stringify(project,null,1)+'\n');
 log(`Rendering ${missing.map(edition=>needed(edition).length+' '+edition).join(', ')} pages with check-feedback-pages`);
 const args=[path.join(root,'scripts','booklet','check-feedback-pages.mjs'),'--project-file',snapshot,'--blocks',argument,'--editions',missing.join(','),'--checks-only','none','--full-reason',FULL_REASON,'--base',base,'--out',out];
 const descriptor=fs.openSync(logFile,'w');
 const code=await withRenderResource(()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:root,windowsHide:true,stdio:['ignore',descriptor,descriptor]});child.on('error',reject);child.on('close',resolve);})).finally(()=>fs.closeSync(descriptor));
 const file=path.join(out,'feedback-pages.json');
 if(!fs.existsSync(file))throw Error(`check-feedback-pages wrote no report (exit ${code}); see ${relative(root,logFile)}`);
 const report=read(file);Object.assign(recovered.editionsReport,report.editionsReport);recovered.failures.push(...(report.failures??[]));
 const merged={...report,editionsReport:recovered.editionsReport,failures:recovered.failures},mismatch=checkReport(merged,pagemap,selection.blocks,editions);
 // Automated layout failures still leave usable rasters; they are recorded, not fatal.
 if(mismatch.length){const diagnostic=fs.existsSync(logFile)?fs.readFileSync(logFile,'utf8').trim().slice(-1500):'';throw Error('Page map and rasters disagree ('+mismatch.join('; ')+'). Renderer log: '+diagnostic);}
 if(!covers(merged))throw Error(`check-feedback-pages produced no raster for some reviewed pages (exit ${code}); see ${relative(root,logFile)}`);
 const mergedFile=path.join(dir,'recovered-feedback-pages.json');fs.writeFileSync(mergedFile,JSON.stringify(merged,null,1));
 return {images:imagesOf(merged),report:relative(root,mergedFile),failures:merged.failures??[],reused:false};
}

// ---- findings ------------------------------------------------------------------------------

export const findingId=(area,edition,targets)=>'fp-'+sha(area+'|'+edition+'|'+[...targets].sort().join(',')).slice(0,10);
// Keep only what the contract allows; a target the reviewer could not have seen on its pages is removed.
export function normalise(row,{index,edition,blockIds,pages}){
 const visible=new Set(blockIds),targets=[...new Set((Array.isArray(row?.targets)?row.targets:[]).map(String).filter(id=>visible.has(index.owners.get(id))))];
 if(!targets.length)return {error:'no target is an id on the reviewed pages'};
 if(!AREAS.includes(row.area))return {error:'unknown area '+row?.area};
 if(!text(row.comment))return {error:'no comment'};
 const page=Number.isInteger(row.page)&&pages.includes(row.page)?row.page:null;
 const proposal=typeof row.proposal==='string'?text(row.proposal):row.proposal?JSON.stringify(row.proposal):'';
 // A decided convention (src/lib/booklet-cloze-convention.js) is dropped even when the worker raises it: 92 such findings were rejected by the teacher.
 const decided=conflictsWithDecidedConvention({comment:text(row.comment),proposal});
 if(decided)return {error:'conflicts with a decided convention: '+decided};
 return {value:{edition,page,area:row.area,scope:SCOPES.includes(row.scope)?row.scope:'local',targets,comment:text(row.comment),gain:text(row.gain),proposal}};
}
const targetRows=(project,index,targets)=>targets.map(id=>({id,blockId:index.owners.get(id),hash:blockHash(project,index,index.owners.get(id))}));
// One issue: the same area in the same edition on an overlapping block. The
// model may name a part one run and its question the next.
export const sameIssue=(a,b)=>a.area===b.area&&a.edition===b.edition&&a.targets.some(target=>b.targets.some(other=>other.blockId===target.blockId));
export const targetsUnchanged=(finding,project,index)=>finding.targets.every(target=>index.blocks.has(target.blockId)&&blockHash(project,index,target.blockId)===target.hash);

export function provenanceFile(projectId,{root=ROOT,provenanceDir}={}){return path.join(provenanceDir??path.join(root,'booklets','provenance','first-pass-review'),projectId+'.json');}
export function loadProvenance(file,project){
 return fs.existsSync(file)?whileLocked(()=>read(file)):{version:1,projectId:project.id,title:project.title,findings:[],notReliablyReviewed:[]};
}
// Windows can hold a file open for another process for some seconds (UNKNOWN, EBUSY, EPERM):
// wait and retry for up to about two minutes before giving up.
const LOCKED=new Set(['UNKNOWN','EBUSY','EPERM','EACCES']);
export function whileLocked(action){
 for(let attempt=1;;attempt++){
  try{return action();}
  catch(error){if(attempt>=30||!LOCKED.has(error.code))throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,Math.min(500*attempt,6000));}
 }
}
export function saveProvenance(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true});const text=JSON.stringify(value,null,1)+'\n';
 whileLocked(()=>fs.writeFileSync(file,text));
}
export const setState=(finding,state,note)=>{if(finding.state===state)return;finding.state=state;(finding.history??=[]).push({state,at:now(),...(note?{note}:{})});};

// Merge a run's findings into the record. A rejected finding suppresses the same
// issue while its targets are unchanged; a posted or approved one stands for it.
// An unposted pending finding on re-reviewed blocks that was not found again is removed.
export function mergeFindings(previous,found,{reviewed,project,index}){
 const byId=new Map(previous.map(finding=>[finding.id,finding])),kept=[],added=new Map(),suppressed=[];
 const known=finding=>byId.get(finding.id)??[...byId.values()].find(old=>sameIssue(old,finding)&&(old.state==='rejected'?targetsUnchanged(old,project,index):['approved','deferred'].includes(old.state)||['pending','stale'].includes(old.state)&&old.commentId));
 // Still with the teacher: approved or deferred, or posted and not yet triaged.
 const standing=old=>['approved','deferred'].includes(old.state)||['pending','stale'].includes(old.state)&&old.commentId;
 for(const finding of found){
  // Two comments on the same targets in one run become one.
  if(added.has(finding.id)){const row=added.get(finding.id);if(!row.comment.includes(finding.comment))row.comment+='\n'+finding.comment;continue;}
  const old=known(finding);
  if(old?.state==='rejected'&&targetsUnchanged(old,project,index)){suppressed.push(finding.id);continue;}
  if(old&&standing(old)){if(!kept.includes(old))kept.push(old);byId.delete(old.id);continue;}
  if(old?.id===finding.id)byId.delete(old.id);
  const row={...finding,state:'pending',history:[...(old?.id===finding.id?old.history??[]:[]),{state:'pending',at:now()}]};
  added.set(row.id,row);kept.push(row);
 }
 for(const old of byId.values()){
  if(old.state==='pending'&&!old.commentId&&old.targets.some(target=>reviewed[old.edition]?.has(target.blockId)))continue;
  kept.push(old);
 }
 return {findings:kept,suppressed};
}

// ---- workers ------------------------------------------------------------------------------

function codexBinary(){
 const base=path.join(process.env.LOCALAPPDATA||'','OpenAI','Codex','bin');
 if(fs.existsSync(base))for(const name of fs.readdirSync(base)){const file=path.join(base,name,'codex.exe');if(fs.existsSync(file))return file;}
 return 'codex';
}
export async function defaultRunner(options){
 process.env.BOOKLET_CODEX_BIN??=codexBinary();
 return (await import('../scripts/booklet/codex-transcription.mjs')).runAstraTask(options);
}
export async function defaultLease(runDir,details,action){return (await import('../scripts/booklet/worker-pool.mjs')).withWorkerSlot(runDir,details,action);}
async function lowEffort(){
 const {transcriptionConfiguration}=await import('../scripts/booklet/transcription-settings.mjs');
 return transcriptionConfiguration({reasoningOverride:{effort:'low',reason:'First-pass review: user decision of 15 October 2026 (Sol 6.1 at low reasoning).'}});
}
// A slot in the booklet's canonical run directory is the shared three-worker
// limit. Workers start outside the repository so they do not load its AGENTS.md.
export async function callWorker({runner,lease,canonicalRunDir,workDir,name,prompt,images}){
 const out=path.join(workDir,'calls',Date.now()+'-'+name+'-'+Math.random().toString(36).slice(2,6)),cwd=path.join(os.tmpdir(),'mathsmap-first-pass-review');
 fs.mkdirSync(cwd,{recursive:true});fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'prompt.txt'),prompt);
 const configuration=await lowEffort(),invoke=()=>runner({cwd,runDir:workDir,prompt,images,out,profile:'review',stage:'first-pass',configuration});
 const {result,metrics}=await(canonicalRunDir?lease(canonicalRunDir,{stage:'first-pass',tool:'first-pass-review'},invoke):invoke());
 return {result,usage:metrics?.usage??null,elapsedMs:metrics?.elapsedMs??null,out};
}
export async function pool(items,concurrency,work){
 const queue=[...items.entries()];
 await Promise.all(Array.from({length:Math.max(1,Math.min(concurrency,queue.length))},async()=>{while(queue.length){const [index,item]=queue.shift();await work(item,index);}}));
}
export function canonicalRunDir(project,{root=ROOT}={}){
 const runId=project.source?.runId??project.runId,dir=runId&&path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'));
 return dir&&fs.existsSync(dir)?dir:null;
}

// ---- review --------------------------------------------------------------------------------

const describeBatch=batch=>({edition:batch.edition,pages:batch.rows.map(row=>row.page)});
// reportOnly (polish residual check): the same review and contract; the findings of this run are returned as
// `residual`, and the record is saved only into an explicitly named --provenance-dir, never the booklet's own.
export async function runReview({projectFile,root=ROOT,pages=null,editions=EDITIONS,concurrency=LIMITS.concurrency,dry=false,fresh=false,source=false,reportOnly=false,textbook=false,base=BASE,runner=defaultRunner,lease=defaultLease,mapPages=defaultMapPages,renderImages=defaultRenderImages,provenanceDir,workDir,runDir,log=()=>{}}={}){
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>LIMITS.concurrency)throw Error('Use one to three workers');
 if(!editions.length||editions.some(edition=>!EDITIONS.includes(edition)))throw Error('--editions takes student, short and worked');
 const project=read(projectFile),index=bookletIndex(project),hash=contentHash(project);
 runDir??=canonicalRunDir(project,{root});workDir??=path.join(root,'.booklet-work','first-pass-review',project.id);
 const renderDir=path.join(workDir,'render-'+hash.slice(0,12)),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 log('Page map for '+project.id);
 const pagemap=await mapPages({project,dir:renderDir,base,fresh,root});
 const selection=selectPages(index,pagemap,{pages});
 if(!selection.student.length)throw Error(pages?'No reviewable Questions page in --pages':'The booklet has no reviewable Questions page');
 // The Questions pages still choose the blocks; --editions only limits which calls run.
 for(const edition of EDITIONS)if(!editions.includes(edition))selection[edition]=[];
 const batches=planBatches({project,index,selection,pagemap,record,root});
 const plan={project:project.id,revision:project.revision??null,contentHash:hash,pageCounts:Object.fromEntries(EDITIONS.map(edition=>[edition,(pagemap[edition]??[]).length])),reviewed:Object.fromEntries(EDITIONS.map(edition=>[edition,selection[edition].map(page=>page.page)])),
  batches:batches.map(batch=>({...describeBatch(batch),blocks:new Set(batch.rows.flatMap(row=>row.blocks.map(block=>block.id))).size,promptCharacters:batchPrompt({project,index,edition:batch.edition,rows:batch.rows,pagemap,record,root}).prompt.length})),
  pageMap:relative(root,path.join(renderDir,'pagemap.json')),runDir:runDir&&relative(root,runDir)};
 if(dry)return plan;

 const rendered=await renderImages({project,dir:renderDir,selection,pagemap,base,fresh,root,log});
 const found=[],unreliable=[],calls=[],errors=[],reviewed={student:new Set(),short:new Set(),worked:new Set()},reviewedPages={student:new Set(),short:new Set(),worked:new Set()};
 await pool(batches,concurrency,async(batch,i)=>{
  const extra=source&&batch.edition==='student'?sourceImages(index,batch.rows,runDir):[];
  const {prompt}=batchPrompt({project,index,edition:batch.edition,rows:batch.rows,pagemap,record,source:extra,root,textbook});
  const blockIds=[...new Set(batch.rows.flatMap(row=>row.blocks.map(block=>block.id)))],pageNumbers=batch.rows.map(row=>row.page);
  const call={batch:i,...describeBatch(batch),findings:0,discarded:[]};calls.push(call);
  try{
   const images=[...batch.rows.map(row=>rendered.images[batch.edition]?.[row.page]),...extra.map(row=>row.path)];
   if(images.some(image=>!image))throw Error('Missing page raster');
   log(`Reviewing ${EDITION_NAMES[batch.edition]} pages ${pageNumbers.join(',')}`);
   const {result,usage,elapsedMs,out}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,name:batch.edition+'-'+pageNumbers[0],prompt,images});
   Object.assign(call,{usage,elapsedMs,out:relative(root,out)});
   for(const raw of Array.isArray(result?.findings)?result.findings:[]){
    if(textbook&&['review','extension'].includes(raw.area)){call.discarded.push('Excluded from textbook import: '+raw.area);continue;}
    const {value,error}=normalise(raw,{index,edition:batch.edition,blockIds,pages:pageNumbers});
    if(error){call.discarded.push(error);continue;}
    found.push({id:findingId(value.area,value.edition,value.targets),...value,targets:targetRows(project,index,value.targets),revision:project.revision??null,batch:i});call.findings++;
   }
   for(const row of Array.isArray(result?.notReliablyReviewed)?result.notReliablyReviewed:[])if(text(row?.note))unreliable.push({edition:batch.edition,page:Number.isInteger(row.page)?row.page:null,note:text(row.note),revision:project.revision??null});
   blockIds.forEach(id=>reviewed[batch.edition].add(id));pageNumbers.forEach(page=>reviewedPages[batch.edition].add(page));
  }catch(error){call.error=error.message;errors.push(`${batch.edition} ${pageNumbers.join(',')}: ${error.message}`);}
 });
calls.sort((a,b)=>a.batch-b.batch);found.sort((a,b)=>a.batch-b.batch||EDITIONS.indexOf(a.edition)-EDITIONS.indexOf(b.edition)||(a.page??Infinity)-(b.page??Infinity));
 const residual=found.map(({batch,...finding})=>({id:finding.id,edition:finding.edition,page:finding.page,area:finding.area,scope:finding.scope,targets:finding.targets.map(target=>target.id),comment:finding.comment,...(finding.proposal?{proposal:finding.proposal}:{})}));
 const merged=mergeFindings(record.findings??[],found.map(({batch,...finding})=>finding),{reviewed,project,index});
 Object.assign(record,{projectId:project.id,title:project.title,reviewedRevision:project.revision??null,reviewedAt:now(),model:'gpt-6.1-sol',effort:'low',findings:merged.findings,
  notReliablyReviewed:[...(record.notReliablyReviewed??[]).filter(row=>!reviewedPages[row.edition]?.has(row.page)),...unreliable],
  lastRun:{contentHash:hash,pages:plan.reviewed,calls,suppressed:merged.suppressed,render:{report:rendered.report,reused:rendered.reused,automatedFailures:(rendered.failures??[]).map(row=>row.kind+(row.count?' ×'+row.count:''))},errors}});
 if(!reportOnly||provenanceDir)saveProvenance(file,record);
 return {...summary(record,project),provenance:relative(root,file),calls:calls.map(({out,...call})=>call),errors,...(reportOnly?{reportOnly:true,residual,pageCounts:plan.pageCounts}:{})};
}
const brief=finding=>({id:finding.id,state:finding.state,edition:finding.edition,page:finding.page,area:finding.area,scope:finding.scope,targets:finding.targets.map(target=>target.id),comment:finding.comment,...(finding.proposal?{proposal:finding.proposal}:{}),...(finding.commentId?{posted:true}:{})});
export function summary(record,project){
 const states={};for(const finding of record.findings??[])states[finding.state]=(states[finding.state]??0)+1;
 return {project:record.projectId,revision:project?.revision??record.reviewedRevision,reviewed:record.lastRun?.pages??null,states,suppressed:record.lastRun?.suppressed?.length??0,discarded:(record.lastRun?.calls??[]).reduce((count,call)=>count+(call.discarded?.length??0),0),
  findings:(record.findings??[]).filter(finding=>['pending','approved'].includes(finding.state)).map(brief),notReliablyReviewed:record.notReliablyReviewed??[]};
}

// ---- Studio comments -------------------------------------------------------------------------

export function commentNote(finding){
 const others=finding.targets.slice(1).map(target=>target.id),where=EDITION_NAMES[finding.edition]+(finding.page?' p. '+finding.page:'');
 return [`[First pass · ${finding.area} · ${finding.id} · ${where}]`,finding.comment,finding.gain&&'Gain: '+finding.gain,finding.proposal&&'Proposal: '+finding.proposal,others.length&&(finding.scope==='all'?'Also at: ':'Also affects: ')+others.join(', ')].filter(Boolean).join('\n');
}
async function projectHandle(projectFile,root){return (await import('../scripts/booklet/lean-review.mjs')).openProject(projectFile,{root});}
const flagsOf=project=>project.studio?.flags??[];
const flagOf=(project,finding)=>flagsOf(project).find(flag=>flag.findingId===finding.id&&flag.kind==='first-pass');
// Each pending finding becomes one Studio comment on its first target in its
// edition. A part or diagram the comment model cannot anchor falls back to its block.
export async function postFindings({projectFile,root=ROOT,provenanceDir,findingIds}={}){
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const handle=await projectHandle(projectFile,root),project=handle.project,index=bookletIndex(project),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 const selected=findingIds&&new Set(findingIds),posted=[],stale=[],present=[];
 if(selected)for(const id of selected)if(!record.findings.some(finding=>finding.id===id))throw Error('Unknown finding '+id);
 for(const finding of record.findings??[]){
  if(selected&&!selected.has(finding.id)||finding.state!=='pending')continue;
  if(finding.groupedUnder)continue; // listed on its pattern's representative comment
  if(flagOf(project,finding)){present.push(finding.id);continue;}
  if(finding.commentId)continue; // posted before and since deleted: status records the rejection
  if(!targetsUnchanged(finding,project,index)){setState(finding,'stale','A target changed before posting.');stale.push(finding.id);continue;}
  const note=commentNote(finding),anchor=id=>createFeedback(project,{rootId:id,edition:finding.edition},note,finding.scope);
  let comment;try{comment=anchor(finding.targets[0].id);}catch{comment=anchor(finding.targets[0].blockId);}
  const flag={...comment,kind:'first-pass',findingId:finding.id,area:finding.area};
  project.studio={version:1,...project.studio,flags:[...flagsOf(project),flag]};
  Object.assign(finding,{commentId:flag.id,postedAt:flag.at,postedNote:note});posted.push(finding.id);
 }
 let lost=[];
 if(posted.length){
  await handle.save();
  const saved=read(handle.file);
  lost=posted.filter(id=>!flagsOf(saved).some(flag=>flag.findingId===id&&flag.kind==='first-pass'));
  record.postedRevision=saved.revision??null;
 }
 saveProvenance(file,record);
 return {project:project.id,posted,alreadyPresent:present,stale,revision:record.postedRevision??project.revision??null,errors:lost.length?['The saved project is missing comments for '+lost.join(', ')]:[]};
}
// States come from the comments. A deleted comment is a rejection and a resolved
// one a repair. An open comment stays pending until the teacher says triage is
// finished (--triaged), when every comment still present is approved; --approve
// names single findings instead.
export async function reconcile({projectFile,root=ROOT,provenanceDir,triaged=false,approve=[],reject=[],resolve=[]}={}){
 const {feedbackStatus}=await import('../src/lib/booklet-feedback.js');
 const handle=await projectHandle(projectFile,root),project=handle.project,index=bookletIndex(project),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project),errors=[];
 const byId=new Map((record.findings??[]).map(finding=>[finding.id,finding]));
 for(const id of [...approve,...reject,...resolve])if(!byId.has(id))errors.push('Unknown finding '+id);
 for(const finding of record.findings??[]){
  // Closed findings no longer apply; grouped ones follow their representative below.
  if(finding.state==='closed'||finding.groupedUnder)continue;
  const flag=flagOf(project,finding);
  if(finding.commentId&&!flag){if(['pending','approved','stale'].includes(finding.state))setState(finding,'rejected','Its comment was deleted in Studio.');continue;}
  if(flag?.resolved){setState(finding,'repaired','Its comment was resolved in Studio.');continue;}
  if(flag&&text(flag.note)!==text(finding.postedNote??'')&&flag.note)finding.teacherNote=flag.note;
  if(finding.state==='pending'&&(flag?feedbackStatus(project,flag)==='Target removed':!targetsUnchanged(finding,project,index)))setState(finding,'stale',flag?'Its target was removed.':'A target changed before posting.');
  if(triaged&&flag&&['pending','stale'].includes(finding.state)&&feedbackStatus(project,flag)!=='Target removed')setState(finding,'approved','Comment kept after triage.');
 }
 // One decision per pattern: a grouped finding takes its representative's decision.
 for(const finding of record.findings??[]){
  const representative=finding.groupedUnder&&byId.get(finding.groupedUnder);
  if(representative&&['pending','stale'].includes(finding.state)&&['approved','rejected','repaired','closed'].includes(representative.state))setState(finding,representative.state,'Follows its pattern comment '+representative.id+'.');
 }
 for(const id of approve){
  const finding=byId.get(id);if(!finding||finding.state==='approved')continue;
  if(finding.state!=='pending'||!flagOf(project,finding)&&!targetsUnchanged(finding,project,index)){errors.push(`${id} cannot be approved: it is ${finding.state==='pending'?'stale':finding.state}. Review those pages again.`);continue;}
  setState(finding,'approved','Named by the user.');
 }
 // The user can reject in chat as well as by deleting a comment; any posted comment goes with it.
 const withdrawn=[],resolved=[];
 for(const id of reject){
  const finding=byId.get(id);if(!finding||finding.state==='rejected')continue;
  if(flagOf(project,finding)){project.studio={...project.studio,flags:flagsOf(project).filter(flag=>!(flag.findingId===id&&flag.kind==='first-pass'))};withdrawn.push(id);}
  setState(finding,'rejected','Rejected by the user.');
 }
 // Resolving is the last step of a repair, and only for an approved finding.
 for(const id of resolve){
  const finding=byId.get(id);if(!finding)continue;
  if(finding.state!=='approved'){errors.push(`${id} cannot be resolved: it is ${finding.state}, not approved.`);continue;}
  if(flagOf(project,finding)){project.studio={...project.studio,flags:flagsOf(project).map(flag=>flag.findingId===id&&flag.kind==='first-pass'?{...flag,resolved:true,resolvedAt:now(),resolution:'Repaired after approval.'}:flag)};resolved.push(id);}
  setState(finding,'repaired','Repaired and resolved.');
 }
 if(withdrawn.length||resolved.length)await handle.save();
 saveProvenance(file,record);
 const states={};for(const finding of record.findings??[])(states[finding.state]??=[]).push(finding.id);
 return {project:project.id,states,awaitingTriage:(record.findings??[]).filter(finding=>['pending','stale'].includes(finding.state)&&flagOf(project,finding)).map(finding=>finding.id),
  approved:(record.findings??[]).filter(finding=>finding.state==='approved').map(finding=>({...brief(finding),...(finding.teacherNote?{teacherNote:finding.teacherNote}:{})})),errors};
}

// ---- command line ---------------------------------------------------------------------------

export async function main(args=process.argv.slice(2)){
 const command=args[0],values={},flags=new Set();
 for(let i=1;i<args.length;i++){
  if(['--fresh','--source','--dry','--triaged','--queues','--report-only'].includes(args[i])){flags.add(args[i]);continue;}
  if(!['--project','--project-file','--pages','--editions','--concurrency','--provenance-dir','--base','--findings','--approve','--reject','--resolve'].includes(args[i])||args[i+1]===undefined)throw Error('Invalid option '+args[i]);
  values[args[i]]=args[++i];
 }
 const list=name=>values[name]?.split(',').map(item=>item.trim()).filter(Boolean)??[],live=values['--project']&&path.join(ROOT,'booklets','projects',values['--project']+'.json');
 const projectFile=values['--project-file']?path.resolve(values['--project-file']):live,provenanceDir=values['--provenance-dir']&&path.resolve(values['--provenance-dir']);
 // Queue view (17 October 2026): every booklet with a provenance file unless --project names one.
 if(command==='status'&&flags.has('--queues')){
  const {queueStatus}=await import('./queues.mjs'),result=await queueStatus({ids:values['--project']?[values['--project']]:undefined,provenanceDir});
  console.log(JSON.stringify(result,null,1));if(result.errors.length)process.exitCode=1;return result;
 }
 if(!projectFile)throw Error('Name a booklet with --project ID or --project-file FILE');
 const log=message=>console.error(message),options={projectFile,provenanceDir,pages:parsePages(values['--pages']),editions:values['--editions']?list('--editions'):EDITIONS,base:values['--base']??BASE,fresh:flags.has('--fresh'),log};
 let result;
 if(command==='map'||command==='review'&&flags.has('--dry'))result=await runReview({...options,dry:true});
 else if(command==='review')result=await runReview({...options,concurrency:Number(values['--concurrency']??LIMITS.concurrency),source:flags.has('--source'),reportOnly:flags.has('--report-only')});
 else if(command==='post'){if(!live||values['--project-file'])throw Error('Comments are posted only to a live project: use --project ID');result=await postFindings({projectFile,provenanceDir,...(values['--findings']?{findingIds:list('--findings')}:{})});}
 else if(command==='status')result=await reconcile({projectFile,provenanceDir,triaged:flags.has('--triaged'),approve:list('--approve'),reject:list('--reject'),resolve:list('--resolve')});
 else if(command==='confirm'||command==='group'){
  if(!live||values['--project-file'])throw Error('Queues act only on a live project: use --project ID');
  const queues=await import('./queues.mjs');
  result=await(command==='confirm'?queues.confirmStale:queues.groupComments)({projectFile,provenanceDir,dry:flags.has('--dry'),base:values['--base']??BASE,log});
 }
 else throw Error('Use map|review|post|status|confirm|group --project ID. See docs/booklet-first-pass-review.md');
 console.log(JSON.stringify(result,null,2));if(result.errors?.length)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
