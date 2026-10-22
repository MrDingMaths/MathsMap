#!/usr/bin/env node
// Block roles against the source (22 October 2026; docs/booklet-verification-speed.md).
//   node checks/roles.mjs --project ID|--candidate FILE [--apply] [--no-model] [--report FILE] [--allow-live]
// Compares each block's role with the kind the import inventory recorded for its source group and
// with the header words printed above its source region (source-match/regions.json, when built),
// and flags solutions that would show in the Questions edition on a your-turn or guided block.
// --apply repairs with the existing changeBlockRole; a mismatch the sources disagree on goes to one
// Sol low call per batch of four, closed list of kinds, and is repaired only on a confirming answer.
import fs from 'node:fs';
import path from 'node:path';
import {roleFindings,applyRoleFix,headerAbove,headerFamily} from '../src/lib/booklet-role-check.js';
import {changeBlockRole} from '../src/lib/booklet-layout-actions.js';
import {ROOT,read,write,now,isMain,parseArgs,resolveTarget,runDirOf,inventoryGroups,saveTarget,changedBlocks} from './lib/common.mjs';

// ---- corpus detectors (project only: the inventory is read from the import run folder) -------
const kindOnly=kinds=>project=>roleFindings(project,{groups:inventoryGroups(project)}).filter(f=>kinds.includes(f.kind)).map(f=>({blockId:f.blockId,detail:f.detail}));
export const detectors=[
 {name:'roles',categories:['block-role'],detect:kindOnly(['role-mismatch'])},
 {name:'roles-solutions',categories:['block-role'],detect:kindOnly(['example-without-working','solutions-visible'])},
];

// ---- header words above each block's region ---------------------------------------------------
async function sourceHeaders(project,regionsFile){
 const out=new Map();
 if(!regionsFile||!fs.existsSync(regionsFile))return out;
 const {sourceFiles,readPages}=await import('../source-match/regions.mjs');
 const files=sourceFiles(project);if(!files?.pdf)return out;
 const regions=read(regionsFile).blocks??{},pages=[...new Set(Object.values(regions).flatMap(e=>(e.parts??[]).slice(0,1).map(p=>p.page)))];
 let data;try{data=readPages(files.pdf,pages);}catch{return out;}
 for(const [id,entry] of Object.entries(regions)){
  const part=entry.parts?.[0];if(!part||!data[part.page])continue;
  const text=headerAbove(data[part.page].words,part.box);
  if(text)out.set(id,text);
 }
 return out;
}

export async function runRoles({project,file,live=false,apply=false,model=true,regionsFile=null,workDir=null,allowLive=false,log=()=>{}}){
 const groups=inventoryGroups(project),headers=await sourceHeaders(project,regionsFile);
 const findings=roleFindings(project,{groups,headers}),report={project:project.id,at:now(),findings:[],modelCalls:[]};
 let working=structuredClone(project);
 // 1. The sources disagree: ask once per batch of four.
 const ask=findings.filter(f=>f.ambiguous);
 const confirmed=new Map();
 if(ask.length&&model){
  const {askRoles,KIND_TO_FAMILY}=await import('./lib/model.mjs');
  const regions=regionsFile&&fs.existsSync(regionsFile)?read(regionsFile).blocks:{};
  const blockPage=new Map((project.sections??[]).flatMap(s=>s.blocks).map(b=>[b.id,b.sourcePageNumber]));
  const {answers,calls}=await askRoles({items:ask.map(f=>({blockId:f.blockId,entry:regions[f.blockId],page:blockPage.get(f.blockId)})),project,workDir:workDir??path.join(ROOT,'.booklet-work','checks',project.id,'roles'),log});
  report.modelCalls=calls;
  for(const [id,answer] of answers)confirmed.set(id,{family:KIND_TO_FAMILY[answer.kind]??null,...answer});
 }
 for(const f of findings){
  const row={...f,status:'found'};
  if(f.ambiguous){
   const answer=confirmed.get(f.blockId);
   if(!answer)row.status='ambiguous';
   else{row.model=answer;if(answer.family&&answer.family!==f.actual){row.expected=answer.family;row.suggestedRole=({theory:'theory',example:'example',guided:'guided-practice',practice:'question','key-ideas':'key-ideas',review:'review',activity:'investigation'})[answer.family];row.status='confirmed';}else row.status='model-agrees-with-the-block';}
  }
  if(apply&&['found','confirmed'].includes(row.status)){
   try{
    const next=applyRoleFix(working,row,changeBlockRole);
    // The repair counts only if the finding is gone and no other block's role changed.
    const gone=!roleFindings(next,{groups,headers}).some(g=>g.blockId===row.blockId&&g.kind===row.kind);
    if(gone){working=next;row.status='fixed';}else row.status='repair-did-not-clear-the-finding';
   }catch(error){row.status='refused';row.reason=error.message;}
  }
  report.findings.push(row);
 }
 const changed=changedBlocks(project,working);
 report.changed=changed;
 if(apply&&changed.length)report.saved=await saveTarget({file,live,before:project,after:working,changed,allowLive,tag:'roles'});
 report.counts=report.findings.reduce((acc,f)=>(acc[f.status]=(acc[f.status]??0)+1,acc),{});
 return {report,project:working};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--report','--regions','--work-dir'],flags:['--apply','--no-model','--allow-live']});
 const {file,live,project}=resolveTarget(opts);
 const run=runDirOf(project),regionsFile=opts['--regions']?path.resolve(opts['--regions']):run&&path.join(run,'source-match','regions.json');
 const {report}=await runRoles({project,file,live,apply:!!opts['--apply'],model:!opts['--no-model'],regionsFile,workDir:opts['--work-dir'],allowLive:!!opts['--allow-live'],log:m=>console.error(m)});
 if(opts['--report'])write(path.resolve(opts['--report']),report);
 console.log(JSON.stringify({project:report.project,findings:report.findings.length,counts:report.counts,modelCalls:report.modelCalls.length,changed:report.changed,saved:report.saved??null,items:report.findings.slice(0,12).map(f=>({blockId:f.blockId,status:f.status,detail:f.detail}))},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
