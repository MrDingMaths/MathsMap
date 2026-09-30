// Drain runnable work; review decisions remain explicit and are never fabricated.
import fs from 'node:fs';
import {isLeanReview} from './lean-profile.mjs';
import path from 'node:path';
import {createSemanticTasks,semanticCacheInfo,runSemanticPackets,positive} from './semantic-workflow.mjs';
import {measureRunPhase} from './run-observability.mjs';
import {reviewEnabled,liveWorkflow,loadWorkflow} from './workflow-review.mjs';
import {checkRepresentativePlan} from './efficiency-tools.mjs';
import {workerConcurrency} from './worker-pool.mjs';
import {freshGenerationOptions,inventoryReuseInfo,generationPublicationGuard} from './inventory-reuse.mjs';

function latestAttempt(root,page,stage) {
 const prefix=`page-${String(page).padStart(3,'0')}.${stage}.`;
 return fs.existsSync(root)?Math.max(0,...fs.readdirSync(root).filter(n=>n.startsWith(prefix)&&/^\d+$/.test(n.slice(prefix.length))).map(n=>Number(n.slice(prefix.length)))):0;
}

export function dependencyStatus(options,{retry=false,representative=false,requireRepresentativePlan=false,planFile,retryDiagnosis}={}) {
 options=freshGenerationOptions(options,'author');
 const {runDir,pages}=options,root=path.join(runDir,'semantic-packets'),jobs=[],blocked=[],complete=[],observations=[];
 if(!Array.isArray(pages)||!pages.length||new Set(pages).size!==pages.length)throw Error('Select distinct source pages');
 // One current dependency snapshot per scheduling pass. Publication always
 // builds its own fresh snapshot inside the serialized publication lock.
 const reviewed=reviewEnabled(options.manifest,options.config),workflowState=reviewed?liveWorkflow(runDir,pages):undefined,persisted=reviewed?loadWorkflow(runDir):null;
 let planIssues=[];
 if(reviewed&&!isLeanReview(options.manifest)&&!representative&&requireRepresentativePlan){
  if(!planFile)planIssues=['Complete representative coverage and supply --plan before bulk authoring'];
  else try{planIssues=checkRepresentativePlan(workflowState,options.manifest.selectedPages,JSON.parse(fs.readFileSync(planFile,'utf8').replace(/^\uFEFF/,''))).issues;}catch(error){planIssues=[error.message];}
 }
 for(const page of pages){
  let inventoryReady=false;
  for(const stage of ['inventory','author']){
   if(stage==='author'&&!inventoryReady)break;
   try{
    const task=createSemanticTasks({...freshGenerationOptions(options,stage,page),stage,pages:[page],representative,workflowState})[0],cache=semanticCacheInfo(task),latest=latestAttempt(root,page,stage);
    if(task.blockers.length){blocked.push({page,stage,reasons:task.blockers});break;}
    if(cache.kind==='hit'){
     if(reviewed&&(!persisted.pages[page]||stage==='author'&&!persisted.pages[page].authorHash)){jobs.push({page,stage,attempt:cache.attempt,kind:'registration',inputHash:task.inputHash});break;}
     if(stage==='inventory')inventoryReady=true;else complete.push(page);continue;
    }
    if(stage==='inventory'&&options.inventoryReuseFile){
     const reuse=inventoryReuseInfo(options,page,workflowState);
     observations.push({page,stage,generationCache:cache,generationInputHash:task.inputHash,...reuse});
     if(reuse.kind==='reviewed-inventory-reuse'){inventoryReady=true;continue;}
     blocked.push({page,stage,reasons:['Reviewed inventory reuse is invalid: '+(reuse.reason??reuse.kind)]});break;
    }
    if(stage==='author'&&planIssues.length){blocked.push({page,stage,reasons:planIssues});break;}
    if(cache.kind!=='missing'&&!retry){blocked.push({page,stage,reasons:[`Cache is ${cache.kind}; inspect current evidence and explicitly retry with a new immutable attempt.`]});break;}
    if(latest&&!retry){blocked.push({page,stage,reasons:['A previous attempt exists; explicit retry is required.']});break;}
    if(isLeanReview(options.manifest)&&latest>=2&&!retryDiagnosis?.trim()){blocked.push({page,stage,reasons:['Before a third attempt, diagnose the repeated failure and provide retryDiagnosis (cause and changed approach).']});break;}
    jobs.push({page,stage,attempt:latest+1,inputHash:task.inputHash});break;
   }catch(error){blocked.push({page,stage,reasons:[error.message]});break;}
  }
 }
 return {jobs,blocked,complete,...(observations.length?{observations}:{})};
}

export async function drainDependencies(options,{runner,log=console.log,retry=false,representative=false,retryReason=null,regenerationReason=null,requireRepresentativePlan=false,planFile,retryDiagnosis}={}) {
 const concurrency=workerConcurrency(options.concurrency??options.manifest.concurrency??3),attempted=new Set(),active=new Map(),results=[];
 return measureRunPhase(options.runDir,'dependency-drain',async()=>{
  while(true){
   const state=dependencyStatus(options,{retry,representative,requireRepresentativePlan,planFile,retryDiagnosis:retryDiagnosis??regenerationReason});
   for(const job of state.jobs){
    const key=job.stage+':'+job.page;
    if(active.size>=concurrency)break;
    if(active.has(key)||attempted.has(key))continue;
    // New-policy author jobs share one assignment queue. A dense source page
    // can fill all three worker slots without spawning duplicate page workers.
    const batch=job.stage==='author'&&options.manifest.pipelinePolicy?state.jobs.filter(other=>other.stage==='author'&&other.attempt===job.attempt&&!attempted.has('author:'+other.page)):[job];
    for(const item of batch)attempted.add(item.stage+':'+item.page);
    const generationOptions=freshGenerationOptions(options,job.stage,job.page);
    const work=runSemanticPackets({...generationOptions,stage:job.stage,pages:batch.map(item=>item.page),attempt:job.attempt,concurrency:job.stage==='author'&&options.manifest.pipelinePolicy?concurrency:1,representative,retryReason,regenerationReason},{...(runner?{runner}:{}),log,verifyPublication:generationPublicationGuard(options,job.stage,job.page)})
     .then(report=>{for(const item of batch)results.push({page:item.page,stage:item.stage,report:{...report,pages:report.pages.filter(p=>p.page===item.page)}});},error=>{for(const item of batch)results.push({page:item.page,stage:item.stage,error:error.message});}).finally(()=>active.delete(key));
    active.set(key,work);
   }
   if(!active.size){const status=dependencyStatus(options,{retry,representative,requireRepresentativePlan,planFile,retryDiagnosis:retryDiagnosis??regenerationReason});return {...status,results,concurrency,ok:status.complete.length===options.pages.length};}
   await Promise.race(active.values());
  }
 },{concurrency,pages:options.pages,retry,representative});
}
