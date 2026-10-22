#!/usr/bin/env node
// Vertical whitespace (22 October 2026; docs/booklet-verification-speed.md).
//   node checks/whitespace.mjs --project ID|--candidate FILE [--apply] [--min-mm 6] [--report FILE] [--allow-live]
// Renders the Questions edition, lists every vertical gap over 6 mm between blocks and between lines
// of a teaching block, and explains each with layoutSpaceChain (the chain the Studio spacing inspector
// shows). A gap that no spacing field accounts for is an "unattributable gap": a renderer bug to fix
// centrally, never papered over in the booklet. With --apply, a source page boundary that is not an
// exercise start and leaves its page short is removed (setPageBoundary 'remove') and the render
// repeated; the change is kept only if the booklet gains no page and the page above is fuller.
import path from 'node:path';
import {blockBoxProbe,betweenBlocks,withinBlocks,explainGap,strayBoundaries,storedGaps,GAP_MM} from '../src/lib/booklet-whitespace-check.js';
import {layoutSpaceChain} from '../src/lib/booklet-layout-actions.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {pageBoundaryKind,setPageBoundary} from '../src/lib/booklet-workspace.js';
import {exerciseStarts} from '../sweep/rules.mjs';
import {ownerIndex} from '../bench/fields.mjs';
import {pathTo} from '../src/lib/booklet-wrap-check.js';
import {write,now,isMain,parseArgs,resolveTarget,saveTarget,changedBlocks,renderWithProbes,blocksOf} from './lib/common.mjs';

// The replay cannot render: it sees stored values over the threshold and stray source boundaries.
export const detectors=[{name:'whitespace',categories:['spacing-pagination'],detect:project=>storedGaps(project,{exerciseStarts:exerciseStarts(project).exerciseStarts})}];

// The chain of spacing fields around one node of a block, and the answer-space heights in the block.
export function chainFor(project,blockId,nodeId){
 const block=blocksOf(project).find(b=>b.id===blockId);if(!block)return {chain:[],spaces:[]};
 try{
  const o=project.settings.layoutOverrides??{},resolved=resolveArrangement(block,o.blockLayouts?.[block.id]?.arrangement,{...o,editable:true}),items=arrangementItems(resolved.tree.root);
  const trail=(pathTo({content:block.content,examples:block.examples},nodeId)??[]).reverse().map(n=>n.id).filter(Boolean);
  const base=ref=>String(ref??'').split('#');
  let pick=items.find(i=>base(i.ref)[1]===nodeId);
  for(const id of trail){if(pick)break;pick=items.find(i=>base(i.ref)[1]===id)??items.find(i=>base(i.ref)[0].split('/')[0]===id);}
  pick??=items[0];
  const spaces=[...resolved.entries.values()].filter(e=>e.kind==='space').map(e=>Number(e.value)).filter(Number.isFinite);
  return {chain:pick?layoutSpaceChain(project,{blockId,id:pick.id,nativeId:nodeId}):[],spaces};
 }catch(error){return {chain:[],spaces:[],error:error.message};}
}

async function measure(project,log){
 const geometry=await renderWithProbes(project,{probes:{blocks:blockBoxProbe},editions:['student'],log});
 return geometry.editions.student;
}
export function findGaps(project,edition,{minMm=GAP_MM}={}){
 const index=ownerIndex(project),ownerOf=id=>id?index.get(id)??null:null;
 const teaching=new Set(blocksOf(project).filter(b=>b.type!=='question'||b.sourceAtom||b.pedagogyRole).map(b=>b.id));
 const raw=[];
 for(const page of edition.pages){
  if(page.isCover||page.isAnswer)continue;
  for(const gap of betweenBlocks(page.probes?.blocks??[],{minMm,ownerOf}))raw.push({...gap,page:page.page});
  for(const gap of withinBlocks(page,{minMm,ownerOf,skip:id=>!teaching.has(id)}))raw.push({...gap,page:page.page});
 }
 return raw.map(gap=>{
  const below=chainFor(project,gap.blockId,gap.belowNode??null);
  const aboveBlock=gap.kind==='between-blocks'?gap.aboveBlock:gap.blockId;
  const above=chainFor(project,aboveBlock,gap.aboveNode??null);
  const why=explainGap(gap,{below:below.chain,above:above.chain,workingSpaces:below.spaces});
  return {...gap,explanation:why,detail:`${gap.gapMm} mm ${gap.kind==='between-blocks'?'between blocks':'inside the block'} on page ${gap.page}: `+(why.attributed?why.kind==='working-space'?'working space':why.fields.slice(0,3).map(f=>`${f.label} ${f.field} ${f.value}`).join(', '):'no spacing field accounts for it')};
 });
}

export async function runWhitespace({project,file,live=false,apply=false,allowLive=false,minMm=GAP_MM,log=()=>{},render=measure}){
 const started=Date.now(),report={project:project.id,at:now(),minMm};
 let edition=await render(project,log),working=structuredClone(project);
 const starts=exerciseStarts(project).exerciseStarts;
 const stray=()=>strayBoundaries(working,edition.pages,{minMm,pageBoundaryKind,startsExercise:id=>starts.has(id),firstBlocks:page=>page.blocks?.[0]});
 report.gaps=findGaps(working,edition,{minMm});
 report.strays=stray();
 report.counts={gaps:report.gaps.length,attributed:report.gaps.filter(g=>g.explanation.attributed).length,unattributable:report.gaps.filter(g=>!g.explanation.attributed).length,strayBoundaries:report.strays.length,pages:edition.pageCount};
 report.fixes=[];
 if(apply)for(const item of report.strays){
  const before=structuredClone(working),next=setPageBoundary(working,item.blockId,'remove'),measured=await render(next,log);
  const page=edition.pages.find(p=>p.page===item.page),after=measured.pages.find(p=>p.blocks?.includes(page?.blocks?.[0]));
  const grew=measured.pageCount>edition.pageCount;
  if(grew){report.fixes.push({blockId:item.blockId,kept:false,why:`the booklet gained pages (${edition.pageCount} -> ${measured.pageCount})`});working=before;continue;}
  working=next;edition=measured;report.fixes.push({blockId:item.blockId,kept:true,why:`${item.gapMm} mm left on page ${item.page}; pages ${edition.pageCount}`});
 }
 report.changed=changedBlocks(project,working);
 if(apply&&report.changed.length){report.saved=await saveTarget({file,live,before:project,after:working,changed:report.changed,allowLive,tag:'whitespace'});report.gapsAfter=findGaps(working,edition,{minMm}).length;}
 report.elapsedSeconds=Math.round((Date.now()-started)/1000);
 return {report,project:working};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--report','--min-mm'],flags:['--apply','--allow-live']});
 const {file,live,project}=resolveTarget(opts);
 const {report}=await runWhitespace({project,file,live,apply:!!opts['--apply'],allowLive:!!opts['--allow-live'],minMm:Number(opts['--min-mm']??GAP_MM),log:m=>console.error(m)});
 if(opts['--report'])write(path.resolve(opts['--report']),report);
 console.log(JSON.stringify({project:report.project,counts:report.counts,fixes:report.fixes,changed:report.changed,saved:report.saved??null,gapsAfter:report.gapsAfter??null,elapsedSeconds:report.elapsedSeconds,unattributable:report.gaps.filter(g=>!g.explanation.attributed).slice(0,10).map(g=>g.detail+' ['+g.blockId+']')},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
