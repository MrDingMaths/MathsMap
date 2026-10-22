#!/usr/bin/env node
// Structure-from-source for teaching blocks (22 October 2026, user approved).
//
// For theory, definition, worked-example, scaffold and guided-practice blocks the source
// decides STRUCTURE and house style decides every MEASUREMENT. This loop compares each
// teaching block's rendered structure with its source's, relationship by relationship, and
// repairs the differences with teaching presets (src/lib/booklet-teaching-presets.js).
//
//   node source-match/run.mjs --candidate FILE --dry-run [--blocks a,b] [--out-dir DIR]
//   node source-match/run.mjs --candidate FILE           [--rounds 3] [--no-model]
//   node source-match/run.mjs --project ID --allow-live   (the real pipeline)
//
//  1. Source regions and signatures, cached by block id and content hash (regions.mjs).
//  2. One headless render pass of the student edition, with ink capture for teaching blocks.
//  3. Compare. A block whose structure matches needs no change and no model call.
//  4. Otherwise a preset is chosen deterministically from the source signature, its patches
//     are guarded with trialApply (first-pass/apply.mjs) and saved revision-safely with
//     saveRepair, and the block is measured again.
//  5. The model is called only for what is ambiguous (model.mjs): one Sol low call per batch,
//     the source crop and closed questions in, signature corrections out, never patches.
//  6. A round that leaves a block with more mismatches is reverted with inversePatches; the
//     loop stops at three rounds or when every relationship matches. What remains goes to
//     <dir>/review-queue.json, lowest confidence first.
// Every block ends with sourceReview.structure = {preset|'custom', signatureHash}.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {BASE} from '../first-pass/review.mjs';
import {trialApply,saveRepair,inversePatches} from '../first-pass/apply.mjs';
import {renderGeometry} from '../bench/render-geometry.mjs';
import {signatureFromInk,compareSignatures,applySignatureCorrections,tallyMismatches,signatureHash,structureOf} from '../src/lib/teaching-signature.js';
import {HOUSE,presetFor,matchPresets,presetById,structurePatches} from '../src/lib/booklet-teaching-presets.js';
import {arrangementCatalog} from '../src/lib/booklet-arrangement.js';
import {nodeIdsByBlock} from '../bench/render-ink.mjs';
import {buildRegions,regionInk,loadRegions,saveRegions,sourceFiles,readPages,locatedEntry,teachingBlocks,REGIONS_VERSION} from './regions.mjs';
import {locateRegions,confirmSignatures} from './model.mjs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const SIGNATURES_VERSION=1;
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,1)+'\n');};
const now=()=>new Date().toISOString();
const PAGE_OFFSET_MM=300;

// ---- measuring ---------------------------------------------------------------------------

// Page-side ink of each teaching block, pages concatenated 300 mm apart.
export function inkByBlock(geometry,{edition='student'}={}){
 const out=new Map(),pages=geometry.editions[edition]?.pages??[];
 pages.forEach(page=>{
  for(const [id,ink] of Object.entries(page.ink??{})){
   const acc=out.get(id)??{words:[],rules:[],figures:[],items:[],arrows:[],pages:0},k=acc.pages++,dy=k*PAGE_OFFSET_MM;
   for(const w of ink.words)acc.words.push({...w,y:w.y+dy,p:k});
   for(const r of ink.rules)acc.rules.push({...r,y:r.y+dy});
   for(const f of ink.figures)acc.figures.push({...f,y:f.y+dy});
   for(const i of ink.items)acc.items.push({...i,y:i.y+dy});
   for(const a of ink.arrows)acc.arrows.push({...a,start:[a.start[0],a.start[1]+dy],end:[a.end[0],a.end[1]+dy],mid:[a.mid[0],a.mid[1]+dy]});
   out.set(id,acc);
  }
 });
 return out;
}
// The print surface's own checks (overflow, clipping, footer clearance), attributed to blocks.
// A repair that introduces one of these is reverted, whatever it did for the structure.
export function qaByBlock(geometry,project,{edition='student'}={}){
 const owner=nodeIdsByBlock((project.sections??[]).flatMap(s=>s.blocks??[])),byBlock=new Map();
 for(const page of geometry.editions[edition]?.pages??[])for(const issue of page.issues??[]){
  const id=owner[issue.targetId]??owner[issue.id];if(!id)continue;
  (byBlock.get(id)??byBlock.set(id,new Set()).get(id)).add(issue.kind+'|'+(issue.targetId??issue.id));
 }
 return {byBlock,pageCount:geometry.editions[edition]?.pageCount??null};
}
const signatureKey=(entry,corrections)=>JSON.stringify([SIGNATURES_VERSION,REGIONS_VERSION,entry.blockHash,corrections??null,entry.located??false]);
// The source signature of a block's region, with the model's answers applied.
export function sourceSignature(entry,corrections=null){
 const base=signatureFromInk(regionInk(entry));
 return corrections?applySignatureCorrections(base,corrections).signature:base;
}

// Compare every teaching block of the project with its source. `render` is the page-side ink by block.
export function measure({project,regions,corrections={},render,only=null,cache=null}){
 const rows={};
 for(const {block} of teachingBlocks(project)){
  if(only&&!only.includes(block.id))continue;
  const entry=regions.blocks[block.id];if(!entry)continue;
  // Source signatures are cached by block id and block hash (with the region version and the model's answers).
  const answers=corrections[block.id]?.answers,key=signatureKey(entry,answers);
  let source=cache?.blocks[block.id]?.key===key?cache.blocks[block.id].signature:null;
  if(!source){source=sourceSignature(entry,answers);if(cache)cache.blocks[block.id]={key,blockHash:entry.blockHash,signature:source};}
  const ink=render.get(block.id)??{words:[]},rendered=signatureFromInk(ink);
  const comparison=compareSignatures(source,rendered,{confidence:entry.located?1:entry.confidence,markerFix:block.type==='worked-example'});
  rows[block.id]={block,entry,source,render:rendered,comparison,decidable:comparison.mismatches.filter(m=>m.severity==='decidable').length,ambiguous:comparison.mismatches.filter(m=>m.severity==='ambiguous').length};
 }
 return rows;
}
export function tally(rows){
 const total={},blocks={matched:0,mismatched:0,decidableOnly:0,ambiguous:0};
 for(const row of Object.values(rows)){
  const t=tallyMismatches(row.comparison.mismatches);
  for(const [type,v] of Object.entries(t)){const r=total[type]??={decidable:0,ambiguous:0};r.decidable+=v.decidable;r.ambiguous+=v.ambiguous;}
  if(!row.comparison.mismatches.length)blocks.matched++;else{blocks.mismatched++;if(row.ambiguous)blocks.ambiguous++;else blocks.decidableOnly++;}
 }
 return {byType:total,blocks};
}

// ---- planning --------------------------------------------------------------------------------------

const TIER1=['layout','figure'],TIER2=['column','indent','groups','align','markers','arrows','emphasis'];
const DIMENSION={layout:'layout',figure:'figure',column:'column',indent:'indent',groups:'groups',align:'align',markers:'markers',arrows:'arrows',emphasis:'emphasis'};

// Corrections for one block from its decidable mismatches. Layout and figure come first
// (they move everything else); the rest are planned from the rendered positions.
export function planBlock(row,{settings,ratioFix}){
 const {block,source,render,comparison}=row,corrections=[],used=[],stuck=[];
 const decidable=comparison.mismatches.filter(m=>m.severity==='decidable');
 const types=new Set(decidable.map(m=>m.type));
 const tier=TIER1.some(t=>types.has(t))?TIER1:TIER2;
 const context={render,map:comparison.map,settings,ratioFix};
 const claimed=new Set();
 const take=(preset,params,build,why)=>{
  let patches;
  try{patches=build();}catch(error){stuck.push({preset:preset.id,why:'build failed: '+error.message});return;}
  if(patches==null){stuck.push({preset:preset.id,why:'the preset cannot realise this on a '+block.type});return;}
  patches=patches.filter(p=>{const key=p.targetId+p.field;if(claimed.has(key))return false;claimed.add(key);return true;});
  if(!patches.length){stuck.push({preset:preset.id,why:'already in place; the lines still differ'});return;}
  corrections.push({id:`sm-${block.id}-${preset.id}`,reason:`${preset.id}: ${why}`,patches});used.push(preset.id);
 };
 for(const type of tier.filter(t=>types.has(t))){
  const dimension=DIMENSION[type],mine=decidable.filter(m=>m.type===type);
  const hit=presetFor(dimension,source,block);
  if(!hit&&type==='column'){stuck.push({type,why:'no preset matches the source columns'});continue;}
  if(!hit){stuck.push({type,why:'no preset matches the source '+type});continue;}
  const {preset,params}=hit,detail=mine.map(m=>m.detail).slice(0,2).join('; ');
  if(type==='column'){
   const colon=source.columns.some(c=>c.relation===':'),pick=colon?presetById('ratio-table'):preset;
   take(pick,params,()=>pick.build(block,params,HOUSE,context),detail);
  }else if(type==='indent'){
   const lanes=new Set(mine.flatMap(m=>m.lineIds).map(id=>source.lines.find(l=>l.id===id)?.lane));
   const levels=source.lines.filter(l=>lanes.has(l.lane)&&l.indent!=null).map(l=>({sourceId:l.id,level:l.indent,lane:l.lane}));
   take(preset,params,()=>preset.build(block,params,HOUSE,{...context,levels}),detail);
  }else if(type==='groups'){
   const splits=source.boundaries.filter(b=>b.split&&b.reliable).map(b=>b.gapMm).sort((a,b)=>a-b);
   const boundaries=mine.map(m=>{const b=source.boundaries.find(x=>x.after===m.lineIds[0]&&x.before===m.lineIds[1]);const rank=b?.split&&splits.length>1?splits.indexOf(b.gapMm)/(splits.length-1):0;return {lineId:m.renderIds[0],split:m.source,rank};});
   take(preset,params,()=>preset.build(block,params,HOUSE,{...context,boundaries}),detail);
  }else if(type==='align'){
   const aligns=mine.map(m=>({lineId:m.renderIds[0],align:m.source}));
   take(preset,params,()=>preset.build(block,params,HOUSE,{...context,aligns}),detail);
  }else if(type==='emphasis'){
   const emphases=mine.map(m=>({lineId:m.renderIds[0],kind:m.kind,hue:m.source,words:m.words}));
   take(preset,params,()=>preset.build(block,params,HOUSE,{...context,emphases}),detail);
  }else if(type==='figure'&&preset.id==='figure-beside-working'){
   take(preset,params,()=>preset.build(block,params,HOUSE,{...context,catalog:arrangementCatalog(block)}),detail);
  }else take(preset,params,()=>preset.build(block,params,HOUSE,context),detail);
 }
 for(const type of types)if(!tier.includes(type)&&!TIER1.includes(type)&&!TIER2.includes(type))stuck.push({type,why:'no preset for '+type});
 return {corrections,used,stuck};
}

// ---- model steps ---------------------------------------------------------------------------------------

async function locateStep({rows,regions,files,project,workDir,model,log,calls}){
 const need=Object.values(regions.blocks).filter(e=>e.needsLocate&&e.pages?.length&&!e.located);
 if(!need.length||!model)return [];
 const byId=new Map(teachingBlocks(project).map(r=>[r.block.id,r.block]));
 const items=need.map(e=>{const block=byId.get(e.blockId),diagram=block?.content?.questionDiagrams?.[0]??block?.examples?.[0]?.questionDiagrams?.[0]??null;
  return {blockId:e.blockId,page:e.pages[0],description:(e.text&&e.text.trim())||diagram?.spec?.description||diagram?.alt||block?.sourceAtom?.label||'a figure'};});
 const {found,calls:made}=await locateRegions({items,files,project,workDir,runner:model.runner,lease:model.lease,log});
 calls.push(...made);
 const pages=readPages(files.pdf,[...new Set(items.map(i=>i.page))]);
 const located=[];
 for(const item of items){
  const hit=found.get(item.blockId);if(!hit?.found)continue;
  regions.blocks[item.blockId]=locatedEntry(regions.blocks[item.blockId],pages[item.page],item.page,hit.box);located.push(item.blockId);
 }
 return located;
}
async function confirmStep({rows,files,project,workDir,model,log,calls,corrections}){
 if(!model)return [];
 const jobs=Object.values(rows).filter(r=>r.comparison.mismatches.some(m=>m.severity==='ambiguous'&&!m.advisory&&['figure','arrows','groups','column'].includes(m.type))&&!corrections[r.block.id]).map(r=>({blockId:r.block.id,block:r.block,signature:r.source,mismatches:r.comparison.mismatches,entry:r.entry}));
 if(!jobs.length)return [];
 const {answers,calls:made}=await confirmSignatures({jobs,files,project,workDir,runner:model.runner,lease:model.lease,log});
 calls.push(...made);
 for(const [id,answered] of answers)corrections[id]={blockHash:jobs.find(j=>j.blockId===id).entry.blockHash,at:now(),answers:answered};
 return [...answers.keys()];
}

// ---- saving ---------------------------------------------------------------------------------------------

const blockList=(project,ids)=>{const index=new Map(project.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));return ids.map(id=>index.get(id)).filter(Boolean);};
async function guard(project,corrections,ids){
 const {applyCorrections}=await import('../scripts/booklet/lean-review.mjs');
 const {structuralPreflight}=await import('../scripts/booklet/feedback-preflight.mjs');
 const preflight=(blocks,settings)=>structuralPreflight({id:project.id,revision:project.revision,sections:[{id:'source-match-trial',phase:'practice',blocks}],settings},{blockIds:blocks.map(b=>b.id)}).issues.filter(issue=>/arrangement/.test(issue.kind)).map(issue=>`${issue.blockId} ${issue.kind} ${issue.ref??issue.message??''}`.trim());
 return trialApply({blocks:blockList(project,ids),settings:project.settings,corrections,applyCorrections,preflight});
}
async function save({projectFile,workDir,runDir,corrections,tag,root}){
 const {applyRepair}=await import('../scripts/booklet/lean-review.mjs');
 const correctionsFile=path.join(workDir,`corrections-${tag}-${now().replace(/[:.]/g,'-')}.json`);
 write(correctionsFile,{project:path.basename(projectFile,'.json'),corrections});
 return saveRepair(applyRepair,{runDir,projectFile,correctionsFile,root});
}

// ---- the loop ---------------------------------------------------------------------------------------------

export async function runSourceMatch({projectFile,root=ROOT,dryRun=false,blocks=null,rounds=3,workDir=null,base=BASE,model=null,allowLive=false,liveWorkCheck=null,log=()=>{},render=renderGeometry}={}){
 projectFile=path.resolve(projectFile);
 const live=path.dirname(projectFile)===path.resolve(root,'booklets/projects');
 if(live&&!dryRun&&!allowLive)throw Error('Refusing to change a live project without --allow-live: '+projectFile);
 let project=read(projectFile);
 // The same hold as the optimiser and the checks: no import or review in flight, no newer unsaved candidate.
 if(live&&!dryRun){
  const {blocked,held}=(liveWorkCheck??(await import('../sweep/run.mjs')).liveWork)(project.id);
  if(blocked.length||held.length)throw Error('Deferred: '+[...blocked,...held].join('; '));
 }
 const files=sourceFiles(project,{root});
 if(!files?.pdf)throw Error('No source PDF for '+project.id);
 workDir=path.resolve(workDir??(live?path.join(files.run,'source-match'):path.join(path.dirname(projectFile),'source-match')));
 const runDir=live?files.run:workDir;
 fs.mkdirSync(workDir,{recursive:true});
 const report={project:project.id,file:projectFile,workDir,startedAt:now(),dryRun,rounds:[],modelCalls:[],presets:{},customs:[],queue:[]};
 // 1. Regions, cached by block hash.
 const regionPath=path.join(workDir,'regions.json'),prior=loadRegions(regionPath);
 const regions={version:REGIONS_VERSION,projectId:project.id,pdf:path.relative(root,files.pdf).replaceAll('\\','/'),builtAt:now(),blocks:{}};
 Object.assign(regions.blocks,buildRegions(project,{pdf:files.pdf,blocks:null,root,reuse:prior.blocks}));
 // 2-3. Render once, compare.
 // A render that comes back nearly empty (a page not settled) is taken again once.
 let lastWords=0;
 const snapshot=async()=>{
  let geometry,ink,words;
  for(let attempt=0;attempt<2;attempt++){
   geometry=await render(project,{base,editions:['student'],ink:true,log});ink=inkByBlock(geometry);
   words=[...ink.values()].reduce((n,i)=>n+i.words.length,0);
   if(!lastWords||words>=.5*lastWords)break;
   log('render returned '+words+' words against '+lastWords+'; rendering again');
  }
  lastWords=words;
  return {ink,qa:qaByBlock(geometry,project)};
 };
 const correctionsPath=path.join(workDir,'corrections-model.json'),corrections=fs.existsSync(correctionsPath)?read(correctionsPath):{};
 for(const [id,c] of Object.entries(corrections))if(c.blockHash!==regions.blocks[id]?.blockHash)delete corrections[id];
 const sigPath=path.join(workDir,'signatures.json'),cache=fs.existsSync(sigPath)&&read(sigPath).version===SIGNATURES_VERSION?read(sigPath):{version:SIGNATURES_VERSION,blocks:{}};
 let snap=await snapshot(),ink=snap.ink,rows=measure({project,regions,corrections,render:ink,only:blocks,cache});
 report.regions={blocks:Object.keys(regions.blocks).length,confident:Object.values(regions.blocks).filter(e=>!e.needsLocate).length,needsLocate:Object.values(regions.blocks).filter(e=>e.needsLocate).map(e=>({blockId:e.blockId,confidence:e.confidence,reason:e.reason})),confidence:Object.fromEntries(Object.values(regions.blocks).map(e=>[e.blockId,e.confidence]))};
 report.before=tally(rows);
 if(dryRun){
  report.modelCalls=[];report.dryRunBlocks=Object.fromEntries(Object.entries(rows).map(([id,r])=>[id,{confidence:r.entry.confidence,decidable:r.decidable,ambiguous:r.ambiguous,types:[...new Set(r.comparison.mismatches.map(m=>m.type+':'+m.severity))],signatureHash:signatureHash(r.source)}]));
  saveRegions(regionPath,regions);write(sigPath,cache);write(path.join(workDir,'dry-run.json'),report);return report;
 }
 // 4-5. Model steps for what is ambiguous, then recompute.
 const located=await locateStep({rows,regions,files,project,workDir,model,log,calls:report.modelCalls});
 rows=measure({project,regions,corrections,render:ink,only:blocks,cache});
 const confirmed=await confirmStep({rows,files,project,workDir,model,log,calls:report.modelCalls,corrections});
 write(correctionsPath,corrections);saveRegions(regionPath,regions);write(sigPath,cache);
 rows=measure({project,regions,corrections,render:ink,only:blocks,cache});
 report.located=located;report.confirmed=confirmed;report.afterModel=tally(rows);
 // 6. Rounds of presets. A block that gains mismatches is reverted and left alone.
 const {ratioFix}=await ratioHelper();
 const stuck=new Map(),applied=new Map(),settled=new Set();
 for(let round=1;round<=rounds;round++){
  project=read(projectFile);
  const plans=[];
  for(const row of Object.values(rows)){
   if(row.decidable===0||settled.has(row.block.id))continue;
   const current=blockList(project,[row.block.id])[0];if(!current)continue;
   const plan=planBlock({...row,block:current},{settings:project.settings,ratioFix});
   (stuck.get(row.block.id)??stuck.set(row.block.id,[]).get(row.block.id)).push(...plan.stuck);
   if(plan.corrections.length)plans.push({id:row.block.id,before:row.decidable,...plan});else settled.add(row.block.id);
  }
  if(!plans.length)break;
  const trial=await guard(project,plans.flatMap(p=>p.corrections),plans.map(p=>p.id));
  const accepted=trial.accepted;
  for(const row of trial.comments)for(const plan of plans)if(plan.corrections.some(c=>c.id===row.findingId)){stuck.get(plan.id).push({why:'guard refused: '+row.why});plan.corrections=plan.corrections.filter(c=>c.id!==row.findingId);}
  const entry={round,attempted:plans.map(p=>p.id),accepted:accepted.map(c=>c.id),refused:trial.comments.map(c=>c.why),applied:[],reverted:[]};
  report.rounds.push(entry);
  if(!accepted.length)break;
  if(read(projectFile).revision!==project.revision)throw Error('The project changed on disk during the round; nothing was saved.');
  await save({projectFile,workDir,runDir,corrections:accepted,tag:'round'+round,root});
  project=read(projectFile);
  const before=snap;
  snap=await snapshot();ink=snap.ink;
  let next=measure({project,regions,corrections,render:ink,only:blocks,cache});
  // Per block: keep when mismatches fell and no check of the print surface is new; revert otherwise.
  // A round that adds pages is reverted whole.
  const undo=[],grew=before.qa.pageCount!=null&&snap.qa.pageCount>before.qa.pageCount;
  for(const plan of plans){
   const after=next[plan.id]?.decidable??0,mine=accepted.filter(c=>c.id.startsWith('sm-'+plan.id+'-'));
   if(!mine.length)continue;
   const earlier=before.qa.byBlock.get(plan.id)??new Set(),introduced=[...(snap.qa.byBlock.get(plan.id)??[])].filter(k=>!earlier.has(k));
   if(grew||introduced.length){undo.push(...mine);settled.add(plan.id);entry.reverted.push({block:plan.id,before:plan.before,after,presets:plan.used,why:grew?`the booklet gained pages (${before.qa.pageCount} -> ${snap.qa.pageCount})`:'new layout issue: '+introduced.join(', ')});stuck.get(plan.id).push({why:`${plan.used.join(', ')} ${grew?'added pages':'introduced '+introduced.join(', ')}; reverted`});continue;}
   // A change is kept only when it leaves the block with fewer mismatches than before.
   if(after>=plan.before){undo.push(...mine);settled.add(plan.id);entry.reverted.push({block:plan.id,before:plan.before,after,presets:plan.used});stuck.get(plan.id).push({why:`${plan.used.join(', ')} did not reduce the mismatches (${plan.before} -> ${after}); reverted`});}
   else{entry.applied.push({block:plan.id,before:plan.before,after,presets:plan.used});(applied.get(plan.id)??applied.set(plan.id,[]).get(plan.id)).push(...plan.used);}
  }
  if(undo.length){
   await save({projectFile,workDir,runDir,corrections:inversePatches(undo),tag:'revert'+round,root});
   project=read(projectFile);snap=await snapshot();ink=snap.ink;next=measure({project,regions,corrections,render:ink,only:blocks,cache});
  }
  rows=next;
  if(Object.values(rows).every(r=>r.decidable===0))break;
 }
 // Structure record and the review queue.
 project=read(projectFile);
 const structurePatchList=[],structures={};
 for(const row of Object.values(rows)){
  const current=blockList(project,[row.block.id])[0];if(!current)continue;
  const unresolvedDecidable=row.comparison.mismatches.filter(m=>m.severity==='decidable');
  const best=matchPresets(row.source,current)[0];
  const used=[...new Set(applied.get(row.block.id)??[])];
  const custom=unresolvedDecidable.length>0&&!used.length;
  const preset=custom?'custom':used[0]??best?.preset.id??'default';
  const reason=custom?'The source places '+[...new Set(unresolvedDecidable.map(m=>m.type))].join(', ')+'; no teaching preset expresses it on this block.':null;
  structurePatchList.push(...structurePatches(current,{preset,presets:used,signature:row.source,reason}));
  structures[row.block.id]={preset,presets:used,signatureHash:signatureHash(row.source),structure:structureOf(row.source),custom};
  report.presets[row.block.id]=preset;if(custom)report.customs.push({blockId:row.block.id,signatureHash:signatureHash(row.source),reason});
  const open=row.comparison.mismatches;
  if(open.length)report.queue.push({blockId:row.block.id,confidence:row.entry.located?null:row.entry.confidence,located:!!row.entry.located,sourcePage:row.entry.pages?.[0]??null,mismatches:open.map(m=>({type:m.type,severity:m.severity,detail:m.detail})),stuck:(stuck.get(row.block.id)??[]).slice(0,4),signatureHash:signatureHash(row.source)});
 }
 report.queue.sort((a,b)=>(a.confidence??2)-(b.confidence??2));
 if(structurePatchList.length){
  const byBlock=new Map();for(const p of structurePatchList){(byBlock.get(p.targetId)??byBlock.set(p.targetId,[]).get(p.targetId)).push(p);}
  const list=[...byBlock].map(([id,patches])=>({id:'sm-structure-'+id,reason:'Record how the block follows its source.',patches}));
  const trial=await guard(project,list,[...byBlock.keys()]);
  if(trial.accepted.length)await save({projectFile,workDir,runDir,corrections:trial.accepted,tag:'structure',root});
  report.structureRecorded=trial.accepted.length;
 }
 write(path.join(workDir,'review-queue.json'),{project:project.id,builtAt:now(),items:report.queue});
 write(path.join(workDir,'structures.json'),{project:project.id,builtAt:now(),blocks:structures});
 report.after=tally(rows);report.finishedAt=now();
 write(path.join(workDir,'run-report.json'),report);
 return report;
}

// The ratio convention of the sweep, run on a copy of one block (sweep/rules.mjs).
async function ratioHelper(){
 const {sweepProject}=await import('../sweep/rules.mjs');
 return {ratioFix:block=>{
  const mini={id:'source-match-ratio',sections:[{id:'s',phase:'teaching',blocks:[structuredClone(block)]}],settings:{}};
  return sweepProject(mini,{fix:true,rules:['ratio']}).project.sections[0].blocks[0];
 }};
}

// ---- command line ---------------------------------------------------------------------------------------------

async function main(args=process.argv.slice(2)){
 const values={},flags=new Set(['--dry-run','--no-model','--allow-live']);
 for(let i=0;i<args.length;i++){
  if(flags.has(args[i])){values[args[i]]=true;continue;}
  if(!['--project','--candidate','--blocks','--rounds','--out-dir','--base'].includes(args[i])||args[i+1]===undefined)throw Error('Invalid option '+args[i]);
  values[args[i]]=args[++i];
 }
 const projectFile=values['--candidate']??(values['--project']&&path.join(ROOT,'booklets','projects',values['--project']+'.json'));
 if(!projectFile)throw Error('Name a booklet with --project ID or a candidate file with --candidate FILE');
 let model=null;
 if(!values['--no-model']&&!values['--dry-run']){
  const {defaultRunner,defaultLease}=await import('../first-pass/review.mjs');
  model={runner:defaultRunner,lease:defaultLease};
 }
 const report=await runSourceMatch({projectFile,dryRun:!!values['--dry-run'],blocks:values['--blocks']?.split(','),rounds:Number(values['--rounds']??3),workDir:values['--out-dir'],base:values['--base']??BASE,model,allowLive:!!values['--allow-live'],log:m=>console.error(m)});
 console.log(JSON.stringify({project:report.project,dryRun:report.dryRun,regions:{blocks:report.regions.blocks,confident:report.regions.confident,needsLocate:report.regions.needsLocate.length},before:report.before,afterModel:report.afterModel,after:report.after,rounds:report.rounds.map(r=>({round:r.round,applied:r.applied.length,reverted:r.reverted.length})),modelCalls:report.modelCalls.length,customs:report.customs.length,queue:report.queue.length,workDir:report.workDir},null,1));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
