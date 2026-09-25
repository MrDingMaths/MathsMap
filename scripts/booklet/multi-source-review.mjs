// Internal read-only views. A source page number is local to its import run.
import fs from 'node:fs';
import path from 'node:path';
import {liveWorkflow,reviewFile} from './workflow-review.mjs';
import {sourceInventories} from '../../src/lib/booklet-source-content.js';
import {remapQuestionPresentation} from '../../src/lib/question-presentation.js';

export const isMultiSource=project=>!!project?.source?.imports?.length;
export function blockRunIds(project,block){
 return [...new Set((block?.sourceRefs?.length?block.sourceRefs:[{}]).map(r=>r.runId??project.source?.runId))];
}
export function sourceReviewViews(project,state,{runDir,loadState=liveWorkflow}={}){
 if(!isMultiSource(project))return [];
 const inventories=sourceInventories(project),primary=project.source.workflow?.runId??project.source.inventory?.workflow?.runId??project.source.runId;
 return [{runId:project.source.runId,source:project.source},...project.source.imports].map((item,index)=>{
  const runId=item.runId;
  if(typeof runId!=='string'||!runId||path.basename(runId)!==runId||runId==='.'||runId==='..')throw Error('Invalid source run identity');
  const directory=runDir?path.resolve(runDir,'..',runId):path.resolve('.booklet-work/full-imports',runId);
  const available=runId===primary||fs.existsSync(reviewFile(directory));
  const sourceState=runId===primary?state:available?loadState(directory):{pages:{},issues:{},corrections:[]};
  const ids=new Map(Object.entries(item.idMap??{}));
  const mapped=remapQuestionPresentation(sourceState,ids);
  // Reviews for the merged exercise are recorded in the primary register.
  const teachingContexts=Object.fromEntries(Object.entries(state.verification?.teachingContexts??{}).map(([key,record])=>{
   const binding=record.dependencyScope?.sources?.find(s=>s.runId===runId);
   const originalExercise=[...ids].find(([,mappedId])=>mappedId===binding?.exerciseId)?.[0]??binding?.exerciseId;
   return [key,binding?{...record,dependencyScope:{...binding,exerciseId:originalExercise}}:record];
  }));
  mapped.verification={...mapped.verification,teachingContexts};
  const source={...item.source,runId,inventory:inventories[index]};delete source.imports;
  const view={...project,source,sections:project.sections.map(s=>({...s,blocks:(s.blocks??[]).filter(b=>blockRunIds(project,b).includes(runId))})).filter(s=>s.blocks.length)};
  return {runId,runDir:directory,project:view,state:mapped,available,ids,problems:available?[]:['Source workflow register missing for '+runId]};
 });
}
