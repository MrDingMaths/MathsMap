// One opt-in entry point; all review credit remains in the canonical APIs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {nextBoundedWork,runBoundedStage,recordBoundedStage} from './bounded-stages.mjs';
import {selectDispatchJobs,recoveryAction,recoverEndedStageFailure} from './workflow-controller.mjs';
import {withRunLock,buildRunReceipt} from './run-observability.mjs';
import {withWorkerSlot,workerConcurrency} from './worker-pool.mjs';
import {requireCurrentTranscription} from './transcription-settings.mjs';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {bytesHash} from './workflow-review.mjs';
import {runSemanticPackets} from './semantic-workflow.mjs';
import {isLeanReview} from './lean-profile.mjs';
import {IMPORT_PROMPT_PROFILE} from './import-prompt-codec.mjs';
import {createLeanImportRunner} from './lean-import-runner.mjs';
import {retainUnchangedImportReviews} from './import-review-retention.mjs';
import {exportWithFrozenRuntime} from './import-verification-runtime.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
export function leanRunOptions(record){
 const loaded=loadRun(record.runId),manifest=loaded.manifest;requireCurrentTranscription(manifest);
 if(!isLeanReview(manifest))throw Error('Keep historical policy; lean execution requires a recorded three-pass run');
 return {...loaded,configFile:path.resolve(record.configFile),projectFile:path.resolve(record.projectFile),selectedPages:manifest.selectedPages,promptProfile:IMPORT_PROMPT_PROFILE,config:read(record.configFile)};
}
export async function runLeanImportPool(runs,{poolDir,concurrency=3,maxJobs=10000,retryDiagnosis,runner=createLeanImportRunner(),next=nextBoundedWork,run=runBoundedStage,record=recordBoundedStage,lease=withWorkerSlot,recover=recoverEndedStageFailure,onEvent=()=>{},checkpoint,checkpointIntervalMs=1800000}={}){
 concurrency=workerConcurrency(concurrency);if(!poolDir||!Number.isSafeInteger(maxJobs)||maxJobs<1||!runs.length||new Set(runs.map(r=>path.resolve(r.runDir))).size!==runs.length)throw Error('Choose distinct runs, a shared pool and a positive job limit');
 if(!Number.isSafeInteger(checkpointIntervalMs)||checkpointIntervalMs<1)throw Error('Choose a positive checkpoint interval');
 return withRunLock(poolDir,'lean-import-dispatch',async()=>{
  const logFile=path.join(poolDir,'workflow','lean-import-events.jsonl'),active=new Map(),attempted=new Set(),stopped=new Set(),retryBlocked=new Set(),failures=new Map(),results=[];let stopping=false,started=0,lastCheckpoint=Date.now(),sourcePages=new Set();
  fs.mkdirSync(path.dirname(logFile),{recursive:true});
  const failureKey=(runDir,id,dependencyHash)=>path.resolve(runDir)+':'+id+':'+(dependencyHash??'unknown');
  if(fs.existsSync(logFile))for(const line of fs.readFileSync(logFile,'utf8').split('\n').filter(Boolean)){
   const row=JSON.parse(line);if(!row.runDir||!row.jobId)continue;const key=failureKey(row.runDir,row.jobId,row.dependencyHash);
   if(row.event==='failed')failures.set(key,(failures.get(key)??0)+1);else if(row.event==='finished')failures.delete(key);
  }
  const emit=(event,data={})=>{const row={event,at:new Date().toISOString(),...data};fs.appendFileSync(logFile,JSON.stringify(row)+'\n');onEvent(row);};
  // Adoption happens at a drained boundary. Completed immutable output can be
  // recorded; active/unknown historical owners are never cancelled or stolen.
  for(const options of runs){
   const state=await next(options);
   for(const claim of state.active??[]){const action=recoveryAction(claim,options.runDir);if(action.kind!=='record')throw Error('Drain or reconcile existing owner before lean dispatch: '+claim.id);const r=await record({...options,promptProfile:undefined},{ticket:claim.ticket,...(action.resultFile?{resultFile:action.resultFile}:{result:action.result})});if(r.ok===false||r.next)throw Error('Recovered result needs the existing correction handoff');emit('recovered',{runDir:options.runDir,jobId:claim.jobId,externalModelCalls:0});}
   const slots=path.join(options.runDir,'workflow','worker-slots');if(fs.existsSync(slots)&&fs.readdirSync(slots).some(n=>n.endsWith('.json')))throw Error('An existing source worker is active; adopt lean dispatch at its completed batch boundary');
  }
  const settle=async()=>{
   let timer;const waiting=[...active.values()].map(v=>v.promise);
   if(checkpoint)waiting.push(new Promise(resolve=>{timer=setTimeout(()=>resolve({checkpoint:true}),Math.max(1,checkpointIntervalMs-(Date.now()-lastCheckpoint)));}));
   let row;try{row=await Promise.race(waiting);}finally{clearTimeout(timer);}
   if(row.checkpoint){await checkpoint(runs);lastCheckpoint=Date.now();sourcePages=new Set();emit('checkpoint',{reason:'active-time'});return;}
   const item=active.get(row.key);active.delete(row.key);results.push({key:row.key,ok:row.ok});
   if(!row.ok){stopping=true;emit('failed',{runDir:item.options.runDir,jobId:item.job.id,dependencyHash:item.job.dependencyHash,reason:row.error?.message??'Review requires repair'});if(row.error)await recover(item.options,row.error).catch(e=>emit('recovery-blocked',{reason:e.message}));}
   else{emit('finished',{runDir:item.options.runDir,jobId:item.job.id,dependencyHash:item.job.dependencyHash});if(row.result.next){stopped.add(item.options.runDir);emit('correction-handoff',{runDir:item.options.runDir,jobId:item.job.id,next:row.result.next});}for(const page of item.job.dispatch?.sourcePages??[])sourcePages.add(item.options.runDir+':'+page);}
   if(checkpoint&&(sourcePages.size>=10||Date.now()-lastCheckpoint>=checkpointIntervalMs)){await checkpoint(runs);sourcePages=new Set();lastCheckpoint=Date.now();emit('checkpoint');}
  };
  let dispatchError;
  try{while(!stopping&&started<maxJobs){
   let added=false;
   // Ready review/delivery jobs precede other review work; refill on every
   // completion rather than waiting for a wave's slowest worker.
   const ready=[];
   for(const options of runs){
    if(stopped.has(options.runDir))continue;
    const plan=await next(options),pending=(plan.jobs??[]).filter(j=>!j.done);
    ready.push({options,plan,pending:pending.length,finishing:pending.some(j=>!j.blockers?.length&&['visual','composition'].includes(j.stage))});
   }
   ready.sort((a,b)=>Number(b.finishing)-Number(a.finishing)||a.pending-b.pending);
   for(const {options,plan} of ready){
    if(active.size>=concurrency||stopped.has(options.runDir))continue;
    const running=[...active.values()].filter(v=>v.options.runDir===options.runDir).map(v=>v.job);
    const jobs=(plan.jobs??[]).filter(j=>!j.done&&!j.blockers?.length&&!attempted.has(options.runDir+':'+j.id)).sort((a,b)=>(['visual','composition'].includes(b.stage)?1:0)-(['visual','composition'].includes(a.stage)?1:0));
    const selected=selectDispatchJobs(jobs,running,concurrency-active.size);
    for(const job of selected){if(started>=maxJobs)break;const key=options.runDir+':'+job.id;
     if((failures.get(failureKey(options.runDir,job.id,job.dependencyHash))??0)>=2){
      if(!retryDiagnosis?.trim()){stopped.add(options.runDir);retryBlocked.add(options.runDir);emit('retry-diagnosis-required',{runDir:options.runDir,jobId:job.id,dependencyHash:job.dependencyHash});break;}
      emit('retry-diagnosis',{runDir:options.runDir,jobId:job.id,dependencyHash:job.dependencyHash,reason:retryDiagnosis});
     }
     attempted.add(key);started++;added=true;emit('dispatch',{runDir:options.runDir,jobId:job.id,dependencyHash:job.dependencyHash,owned:job.ownershipIds?.length,deliveredCharacters:job.deliveredCharacters});
     const promise=lease(poolDir,{stage:job.stage,jobId:job.id,runDir:options.runDir},()=>run(options,job.id,{runner})).then(result=>({key,ok:result.ok!==false,result}),error=>({key,ok:false,error}));active.set(key,{options,job,promise});
    }
   }
   if(active.size&&(!added||active.size>=concurrency))await settle();else if(!active.size)break;
  }}catch(error){dispatchError=error;stopping=true;emit('dispatch-error',{reason:error.message});}
  while(active.size)await settle();
  if(dispatchError)throw dispatchError;
  const plans=await Promise.all(runs.map(options=>next(options)));
  return {ok:!stopping&&!retryBlocked.size,status:stopping||retryBlocked.size?'needs-repair':stopped.size?'correction-handoff':started>=maxJobs?'job-limit':'handoff',completed:results.filter(r=>r.ok).length,dispatched:started,plans:plans.map((p,i)=>({runDir:runs[i].runDir,pending:p.jobs?.filter(j=>!j.done).length,blockers:p.blockers,active:p.active?.length})),eventsFile:logFile};
 },{timeoutMs:180000});
}
export async function main(args=process.argv.slice(2)){
 const command=args[0],values={};for(let i=1;i<args.length;i++){const key=args[i];if(!['--runs','--pool','--concurrency','--run-id','--config','--pages','--attempt','--regenerate-reason','--templates','--out','--project','--project-file','--visibility-reviews'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+key);values[key]=args[++i];}
 let result;
 if(['plan','review'].includes(command)){
  const records=read(values['--runs']),runs=records.map(leanRunOptions);
  if(command==='plan')result=await Promise.all(runs.map(async options=>({runDir:options.runDir,...await nextBoundedWork(options)})));
  else result=await runLeanImportPool(runs,{poolDir:path.resolve(values['--pool']??'.booklet-work/lean-import-pool'),concurrency:Number(values['--concurrency']??3),retryDiagnosis:values['--regenerate-reason'],checkpoint:async all=>{const rows=all.map(o=>({runDir:o.runDir,receipt:buildRunReceipt(o.runDir)}));const f=path.join(values['--pool']??'.booklet-work/lean-import-pool','checkpoint-'+Date.now()+'.json');fs.writeFileSync(f,JSON.stringify(rows,null,2),{flag:'wx'});}});
 }else if(command==='retain'){
  const runs=read(values['--runs']).map(leanRunOptions);result=[];for(const options of runs){const {outputs,...receipt}=await retainUnchangedImportReviews(options);result.push({runDir:options.runDir,...receipt});}
 }else if(['author','inventory'].includes(command)){
  const loaded=loadRun(values['--run-id']);requireCurrentTranscription(loaded.manifest);if(!isLeanReview(loaded.manifest))throw Error('Lean authoring requires a three-pass run');
  const poolDir=path.resolve(values['--pool']??'.booklet-work/lean-import-pool'),runner=createLeanImportRunner({templatesFile:command==='author'?values['--templates']??fileURLToPath(new URL('./native-author-templates.json',import.meta.url)):undefined}),config=read(values['--config']),pages=parsePageSelection(values['--pages']);
  const files=pages.map(p=>path.join(loaded.runDir,'semantic-packets','page-'+String(p).padStart(3,'0')+'.'+command+'.json')),baseline=new Map(files.map(f=>[f,fs.existsSync(f)?bytesHash(f):null]));let lastCheckpoint=Date.now();
  fs.mkdirSync(poolDir,{recursive:true});const checkpoint=reason=>{fs.writeFileSync(path.join(poolDir,command+'-checkpoint-'+Date.now()+'.json'),JSON.stringify({reason,runDir:loaded.runDir,receipt:buildRunReceipt(loaded.runDir)},null,2),{flag:'wx'});for(const f of files)baseline.set(f,fs.existsSync(f)?bytesHash(f):null);lastCheckpoint=Date.now();};
  let monitorError;const monitor=setInterval(()=>{try{if(Date.now()-lastCheckpoint>=1800000||files.filter(f=>fs.existsSync(f)&&bytesHash(f)!==baseline.get(f)).length>=10)checkpoint('progress');}catch(error){monitorError=error;}},30000);
  try{result=await runSemanticPackets({...loaded,config,stage:command,pages,attempt:Number(values['--attempt']??1),concurrency:Number(values['--concurrency']??3),regenerationReason:values['--regenerate-reason']??null},{runner:prepared=>withWorkerSlot(poolDir,{stage:command,runDir:loaded.runDir},()=>runner({...prepared,profile:'transcription'}))});}finally{clearInterval(monitor);}
  if(monitorError)throw monitorError;checkpoint('command-finished');
 }else if(command==='export'){
  const loaded=loadRun(values['--run-id']);result=await withRunLock(loaded.runDir,'lean-final-export',()=>exportWithFrozenRuntime({out:values['--out'],projectId:values['--project'],runDir:loaded.runDir,projectFile:values['--project-file'],visibilityReviews:values['--visibility-reviews'],regenerationReason:values['--regenerate-reason']}));
 }else throw Error('Use plan|review|retain --runs FILE, inventory|author --run-id ID --config FILE --pages RANGE, or export --run-id ID --project ID --out DIR');
 console.log(JSON.stringify(result,null,2));if(result?.ok===false)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
