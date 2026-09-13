// Drain runnable work; review decisions remain explicit and are never fabricated.
import fs from 'node:fs';
import path from 'node:path';
import {createSemanticTasks,semanticCacheInfo,runSemanticPackets,positive} from './semantic-workflow.mjs';
import {measureRunPhase} from './run-observability.mjs';
import {reviewEnabled,liveWorkflow,loadWorkflow} from './workflow-review.mjs';

function latestAttempt(root,page,stage) {
 const prefix=`page-${String(page).padStart(3,'0')}.${stage}.`;
 return fs.existsSync(root)?Math.max(0,...fs.readdirSync(root).filter(n=>n.startsWith(prefix)&&/^\d+$/.test(n.slice(prefix.length))).map(n=>Number(n.slice(prefix.length)))):0;
}

export function dependencyStatus(options,{retry=false,representative=false}={}) {
 const {runDir,pages}=options,root=path.join(runDir,'semantic-packets'),jobs=[],blocked=[],complete=[];
 if(!Array.isArray(pages)||!pages.length||new Set(pages).size!==pages.length)throw Error('Select distinct source pages');
 // One current dependency snapshot per scheduling pass. Publication always
 // builds its own fresh snapshot inside the serialized publication lock.
 const reviewed=reviewEnabled(options.manifest,options.config),workflowState=reviewed?liveWorkflow(runDir,pages):undefined,persisted=reviewed?loadWorkflow(runDir):null;
 for(const page of pages){
  let inventoryReady=false;
  for(const stage of ['inventory','author']){
   if(stage==='author'&&!inventoryReady)break;
   try{
    const task=createSemanticTasks({...options,stage,pages:[page],representative,workflowState})[0],cache=semanticCacheInfo(task),latest=latestAttempt(root,page,stage);
    if(task.blockers.length){blocked.push({page,stage,reasons:task.blockers});break;}
    if(cache.kind==='hit'){
     if(reviewed&&(!persisted.pages[page]||stage==='author'&&!persisted.pages[page].authorHash)){jobs.push({page,stage,attempt:cache.attempt,kind:'registration',inputHash:task.inputHash});break;}
     if(stage==='inventory')inventoryReady=true;else complete.push(page);continue;
    }
    if(cache.kind!=='missing'&&!retry){blocked.push({page,stage,reasons:[`Cache is ${cache.kind}; inspect current evidence and explicitly retry with a new immutable attempt.`]});break;}
    if(latest&&!retry){blocked.push({page,stage,reasons:['A previous attempt exists; explicit retry is required.']});break;}
    jobs.push({page,stage,attempt:latest+1,inputHash:task.inputHash});break;
   }catch(error){blocked.push({page,stage,reasons:[error.message]});break;}
  }
 }
 return {jobs,blocked,complete};
}

export async function drainDependencies(options,{runner,log=console.log,retry=false,representative=false}={}) {
 const concurrency=positive(options.concurrency??options.manifest.concurrency??3,'Concurrency'),attempted=new Set(),active=new Map(),results=[];
 return measureRunPhase(options.runDir,'dependency-drain',async()=>{
  while(true){
   const state=dependencyStatus(options,{retry,representative});
   for(const job of state.jobs){
    const key=job.stage+':'+job.page;
    if(active.size>=concurrency)break;
    if(active.has(key)||attempted.has(key))continue;
    attempted.add(key);
    const work=runSemanticPackets({...options,stage:job.stage,pages:[job.page],attempt:job.attempt,concurrency:1,representative},{...(runner?{runner}:{}),log})
     .then(report=>results.push({page:job.page,stage:job.stage,report}),error=>results.push({page:job.page,stage:job.stage,error:error.message})).finally(()=>active.delete(key));
    active.set(key,work);
   }
   if(!active.size){const status=dependencyStatus(options,{retry,representative});return {...status,results,concurrency,ok:status.complete.length===options.pages.length};}
   await Promise.race(active.values());
  }
 },{concurrency,pages:options.pages,retry,representative});
}
