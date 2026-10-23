#!/usr/bin/env node
// Wrapped display maths (22 October 2026; docs/booklet-verification-speed.md).
//   node checks/wrapped-math.mjs --project ID|--candidate FILE [--apply] [--report FILE] [--allow-live]
// Renders the Questions edition, finds formulas that wrap although their source has no `\\` break,
// and (with --apply) tries the teacher's own fixes in order: one column fewer, the diagram above the
// prompt, a wider column. Every step is verified by a new render: a block keeps a fix only if it
// has fewer wrapped formulas, the booklet gains no page and the block gains no layout issue.
import path from 'node:path';
import {wrapProbe,wrappedFindings,estimatedWraps,wrapFix,WRAP_STEPS} from '../src/lib/booklet-wrap-check.js';
import {ownerIndex} from '../bench/fields.mjs';
import {teacherBlocks} from '../polish/guards.mjs';
import {ROOT,write,now,isMain,parseArgs,resolveTarget,saveTarget,changedBlocks,renderWithProbes} from './lib/common.mjs';

// The replay cannot render: it uses the width estimate, conservatively.
export const detectors=[{name:'wrapped-math',categories:['wrapping'],detect:project=>estimatedWraps(project).map(f=>({blockId:f.blockId,detail:f.detail}))}];

const blockMap=project=>{const index=ownerIndex(project);return id=>id?index.get(id)??null:null;};
async function measure(project,log){
 const geometry=await renderWithProbes(project,{probes:{wrap:wrapProbe},editions:['student'],log});
 const edition=geometry.editions.student,rows=[];
 edition.pages.forEach(page=>{for(const row of page.probes?.wrap??[])rows.push({...row,page:page.page});});
 const issues=new Map();
 return {pageCount:edition.pageCount,findings:wrappedFindings(rows,{ownerOf:blockMap(project)}),pages:edition.pages};
}
const restore=(working,saved,blockId)=>{
 for(const section of working.sections){const i=section.blocks.findIndex(b=>b.id===blockId),from=saved.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId);if(i>=0&&from)section.blocks[i]=structuredClone(from);}
 const layouts=working.settings?.layoutOverrides?.blockLayouts,was=saved.settings?.layoutOverrides?.blockLayouts?.[blockId];
 if(layouts){if(was)layouts[blockId]=structuredClone(was);else delete layouts[blockId];}
};

export async function runWrappedMath({project,file,live=false,apply=false,allowLive=false,log=()=>{},render=measure,protectedIds=teacherBlocks(project)}){
 const started=Date.now(),report={project:project.id,at:now(),steps:[],before:null,after:null};
 let state=await render(project,log);
 report.before={pages:state.pageCount,wrapped:state.findings.length,findings:state.findings.map(({blockId,nodeId,lines,widthMm,containerMm,detail})=>({blockId,nodeId,lines,widthMm,containerMm,detail}))};
 let working=structuredClone(project),open=state.findings;
 if(apply)for(const step of WRAP_STEPS){
  if(!open.length)break;
  const before=structuredClone(working),touched=new Map(),changes=[];
  // One fix per block per step: a column change reflows every formula in the grid.
  for(const finding of open){
   if(protectedIds.has(finding.blockId)||touched.has(finding.blockId))continue;
   const fix=wrapFix(step,working,finding);if(!fix)continue;
   working=fix.project;touched.set(finding.blockId,finding);changes.push({blockId:finding.blockId,change:fix.change});
  }
  if(!touched.size){report.steps.push({step,tried:0});continue;}
  const next=await render(working,log),entry={step,tried:touched.size,kept:[],reverted:[]};
  if(next.pageCount>state.pageCount){
   working=before;entry.reverted=changes.map(c=>({...c,why:`the booklet gained pages (${state.pageCount} -> ${next.pageCount})`}));
   report.steps.push(entry);continue;
  }
  for(const {blockId,change} of changes){
   const was=open.filter(f=>f.blockId===blockId).length,now_=next.findings.filter(f=>f.blockId===blockId).length;
   if(now_<was)entry.kept.push({blockId,change,wrapped:`${was} -> ${now_}`});
   else{restore(working,before,blockId);entry.reverted.push({blockId,change,why:`still ${now_} wrapped (was ${was})`});}
  }
  report.steps.push(entry);
  // Reverts change the render, so the next step starts from a fresh measurement of what is kept.
  if(entry.reverted.length&&entry.kept.length)state=await render(working,log);else if(entry.kept.length)state=next;
  open=state.findings;
 }
 report.after={pages:state.pageCount,wrapped:open.length,left:open.map(f=>({blockId:f.blockId,nodeId:f.nodeId,detail:f.detail}))};
 report.changed=changedBlocks(project,working);
 if(apply&&report.changed.length)report.saved=await saveTarget({file,live,before:project,after:working,changed:report.changed,allowLive,tag:'wrapped-math'});
 report.elapsedSeconds=Math.round((Date.now()-started)/1000);
 return {report,project:working};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--report'],flags:['--apply','--allow-live']});
 const {file,live,project}=resolveTarget(opts);
 const {report}=await runWrappedMath({project,file,live,apply:!!opts['--apply'],allowLive:!!opts['--allow-live'],log:m=>console.error(m)});
 if(opts['--report'])write(path.resolve(opts['--report']),report);
 console.log(JSON.stringify({project:report.project,before:report.before.wrapped,after:report.after.wrapped,pages:[report.before.pages,report.after.pages],steps:report.steps.map(s=>({step:s.step,tried:s.tried,kept:s.kept?.length??0,reverted:s.reverted?.length??0})),changed:report.changed,saved:report.saved??null,elapsedSeconds:report.elapsedSeconds},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
