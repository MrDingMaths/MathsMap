// One opt-in entry point; all review credit remains in the canonical APIs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {nextBoundedWork,runBoundedStage,recordBoundedStage,cancelBoundedStage} from './bounded-stages.mjs';
import {selectDispatchJobs,recoveryAction,recoverEndedStageFailure,publishStageCorrections} from './workflow-controller.mjs';
import {withRunLock,buildRunReceipt,summarizeRunReceipt} from './run-observability.mjs';
import {withWorkerSlot,workerConcurrency} from './worker-pool.mjs';
import {requireCurrentTranscription,transcriptionConfiguration,TRANSCRIPTION_DEFAULT} from './transcription-settings.mjs';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {runSemanticPackets} from './semantic-workflow.mjs';
import {isLeanReview} from './lean-profile.mjs';
import {runAstraTask} from './codex-transcription.mjs';
import {createRelayRunner} from './relay-runner.mjs';
import {exportWithFrozenRuntime} from './import-verification-runtime.mjs';
import {prepareLeanVisualReview,queueVisualReviewAfterExport,runLayoutSample} from './lean-visual.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const DEFAULT_POOL='.booklet-work/lean-import-pool';
export function leanRunOptions(record){
 const loaded=loadRun(record.runId),manifest=loaded.manifest;requireCurrentTranscription(manifest);
 if(!isLeanReview(manifest))throw Error('Keep historical policy; lean execution requires a recorded three-pass run');
 return {...loaded,configFile:path.resolve(record.configFile),projectFile:path.resolve(record.projectFile),selectedPages:manifest.selectedPages,config:read(record.configFile)};
}
// Production runs keep the Codex runner. A recorded benchmark arm is answered
// through the file relay; neither path changes tickets, validators or recording.
export function runnerForManifest(manifest,poolDir){
 return transcriptionConfiguration(manifest).provider===TRANSCRIPTION_DEFAULT.provider?runAstraTask:createRelayRunner({relayDir:path.join(poolDir,'relay')});
}
// One compact checkpoint for every command: summaries, never whole receipts.
export function writeCheckpoint(poolDir,reason,runDirs,extra={}){
 fs.mkdirSync(poolDir,{recursive:true});const file=path.join(poolDir,'checkpoint-'+Date.now()+'.json');
 fs.writeFileSync(file,JSON.stringify({at:new Date().toISOString(),reason,...extra,runs:runDirs.map(runDir=>({runDir,receipt:summarizeRunReceipt(buildRunReceipt(runDir))}))},null,2),{flag:'wx'});return file;
}
export async function runLeanImportPool(runs,{poolDir,concurrency=3,maxJobs=10000,retryDiagnosis,runner,next=nextBoundedWork,run=runBoundedStage,record=recordBoundedStage,cancel=cancelBoundedStage,lease=withWorkerSlot,recover=recoverEndedStageFailure,publish=publishStageCorrections,onEvent=()=>{},checkpoint,checkpointIntervalMs=1800000}={}){
 concurrency=workerConcurrency(concurrency);if(!poolDir||!Number.isSafeInteger(maxJobs)||maxJobs<1||!runs.length||new Set(runs.map(r=>path.resolve(r.runDir))).size!==runs.length)throw Error('Choose distinct runs, a shared pool and a positive job limit');
 if(!Number.isSafeInteger(checkpointIntervalMs)||checkpointIntervalMs<1)throw Error('Choose a positive checkpoint interval');
 return withRunLock(poolDir,'lean-import-dispatch',async()=>{
  const logFile=path.join(poolDir,'workflow','lean-import-events.jsonl'),active=new Map(),attempted=new Set(),stopped=new Map(),failures=new Map(),results=[],plans=new Map(),dirty=new Set(runs.map(r=>r.runDir));let started=0,lastCheckpoint=Date.now(),sourcePages=new Set();
  fs.mkdirSync(path.dirname(logFile),{recursive:true});
  const failureKey=(runDir,id,dependencyHash)=>path.resolve(runDir)+':'+id+':'+(dependencyHash??'unknown');
  if(fs.existsSync(logFile))for(const line of fs.readFileSync(logFile,'utf8').split('\n').filter(Boolean)){
   const row=JSON.parse(line);if(!row.runDir||!row.jobId)continue;const key=failureKey(row.runDir,row.jobId,row.dependencyHash);
   if(row.event==='failed')failures.set(key,(failures.get(key)??0)+1);else if(row.event==='finished')failures.delete(key);
  }
  // Every event records slot occupancy, so utilisation is measured directly.
  const emit=(event,data={})=>{const row={event,at:new Date().toISOString(),activeWorkers:active.size,...data};fs.appendFileSync(logFile,JSON.stringify(row)+'\n');onEvent(row);};
  const runnerFor=options=>runner??runnerForManifest(options.manifest,poolDir);
  // Adoption happens at a drained boundary. Completed immutable output can be
  // recorded; active/unknown historical owners are never cancelled or stolen.
  for(const options of runs){
   const state=await next(options);
   for(const claim of state.active??[]){const action=recoveryAction(claim,options.runDir);if(action.kind!=='record')throw Error('Drain or reconcile existing owner before lean dispatch: '+claim.id);
    // A completed result whose dependencies have since changed can never be
    // recorded. Release exactly that ticket without credit; its output stays.
    let r;try{r=await record(options,{ticket:claim.ticket,...(action.resultFile?{resultFile:action.resultFile}:{result:action.result})});}
    catch(error){if(!/stale/i.test(error.message))throw error;await cancel(options,{ticket:claim.ticket,reason:'Completed result became stale after a sibling decision changed its dependencies; the job is planned again'});emit('stale-released',{runDir:options.runDir,jobId:claim.jobId,inspectionCredited:false});continue;}
    if(r.ok===false||r.next)throw Error('Recovered result needs the existing correction handoff');emit('recovered',{runDir:options.runDir,jobId:claim.jobId,externalModelCalls:0});}
   const slots=path.join(options.runDir,'workflow','worker-slots');if(fs.existsSync(slots)&&fs.readdirSync(slots).some(n=>n.endsWith('.json')))throw Error('An existing source worker is active; adopt lean dispatch at its completed batch boundary');
  }
  const settle=async()=>{
   let timer;const waiting=[...active.values()].map(v=>v.promise);
   if(checkpoint)waiting.push(new Promise(resolve=>{timer=setTimeout(()=>resolve({checkpoint:true}),Math.max(1,checkpointIntervalMs-(Date.now()-lastCheckpoint)));}));
   let row;try{row=await Promise.race(waiting);}finally{clearTimeout(timer);}
   if(row.checkpoint){await checkpoint(runs,'active-time');lastCheckpoint=Date.now();sourcePages=new Set();emit('checkpoint',{reason:'active-time'});return;}
   const item=active.get(row.key),runDir=item.options.runDir;active.delete(row.key);results.push({key:row.key,ok:row.ok});dirty.add(runDir);
   // A failure pauses only its own run; other ready booklets keep their slots.
   if(!row.ok){stopped.set(runDir,'needs-repair');emit('failed',{runDir,jobId:item.job.id,dependencyHash:item.job.dependencyHash,reason:row.error?.message??'Review requires repair'});if(row.error)await recover(item.options,row.error).catch(e=>emit('recovery-blocked',{runDir,reason:e.message}));}
   else{
    emit('finished',{runDir,jobId:item.job.id,dependencyHash:item.job.dependencyHash});
    // Approved corrections use the existing serialized publication; results
    // are settled one at a time, so no two publications overlap.
    if(row.result.next)try{await publish(item.options,row.result);emit('corrections-published',{runDir,jobId:item.job.id});}catch(error){stopped.set(runDir,'correction-handoff');emit('correction-handoff',{runDir,jobId:item.job.id,next:row.result.next,reason:error.message});}
    for(const page of item.job.dispatch?.sourcePages??[])sourcePages.add(runDir+':'+page);
   }
   if(checkpoint&&(sourcePages.size>=10||Date.now()-lastCheckpoint>=checkpointIntervalMs)){await checkpoint(runs,'progress');sourcePages=new Set();lastCheckpoint=Date.now();emit('checkpoint',{reason:'progress'});}
  };
  let dispatchError;
  try{while(started<maxJobs){
   let added=false;
   // Re-plan only runs whose state changed; unchanged plans stay valid.
   for(const options of runs)if(dirty.has(options.runDir)){if(!stopped.has(options.runDir))plans.set(options.runDir,await next(options));dirty.delete(options.runDir);}
   // Each booklet has its own slots; nearer acceptance determines dispatch order.
   const ready=runs.filter(options=>!stopped.has(options.runDir)&&plans.has(options.runDir)).map(options=>{const plan=plans.get(options.runDir),pending=(plan.jobs??[]).filter(j=>!j.done);return {options,plan,pending:pending.length,finishing:pending.some(j=>!j.blockers?.length&&['visual','composition'].includes(j.stage))};});
   ready.sort((a,b)=>Number(b.finishing)-Number(a.finishing)||a.pending-b.pending);
   for(const {options,plan} of ready){
    if(stopped.has(options.runDir))continue;
    const running=[...active.values()].filter(v=>v.options.runDir===options.runDir).map(v=>v.job);
    if(running.length>=concurrency)continue;
    const jobs=(plan.jobs??[]).filter(j=>!j.done&&!j.blockers?.length&&!attempted.has(options.runDir+':'+j.id)).sort((a,b)=>(['visual','composition'].includes(b.stage)?1:0)-(['visual','composition'].includes(a.stage)?1:0));
    // Each repair decision changes the shared register its siblings were
    // prepared against, so one run's feedback jobs are delivered one at a time.
    let feedbackBusy=running.some(j=>j.stage==='feedback');
    for(const job of selectDispatchJobs(jobs,running,concurrency-running.length)){if(started>=maxJobs)break;const key=options.runDir+':'+job.id;
     if(job.stage==='feedback'){if(feedbackBusy)continue;feedbackBusy=true;}
     if((failures.get(failureKey(options.runDir,job.id,job.dependencyHash))??0)>=2){
      if(!retryDiagnosis?.trim()){stopped.set(options.runDir,'retry-diagnosis-required');emit('retry-diagnosis-required',{runDir:options.runDir,jobId:job.id,dependencyHash:job.dependencyHash});break;}
      emit('retry-diagnosis',{runDir:options.runDir,jobId:job.id,dependencyHash:job.dependencyHash,reason:retryDiagnosis});
     }
     attempted.add(key);started++;added=true;
     const jobRunner=runnerFor(options),promise=lease(options.runDir,{stage:job.stage,jobId:job.id,runDir:options.runDir},()=>run(options,job.id,{runner:jobRunner})).then(result=>({key,ok:result.ok!==false,result}),error=>({key,ok:false,error}));active.set(key,{options,job,promise});
     emit('dispatch',{runDir:options.runDir,jobId:job.id,dependencyHash:job.dependencyHash,owned:job.ownershipIds?.length,deliveredCharacters:job.deliveredCharacters});
    }
   }
   if(active.size)await settle();else if(!added&&!dirty.size)break;
  }}catch(error){dispatchError=error;emit('dispatch-error',{reason:error.message});}
  while(active.size)await settle();
  if(dispatchError)throw dispatchError;
  const final=await Promise.all(runs.map(options=>next(options))),blocked=[...stopped.values()];
  const status=blocked.some(v=>v!=='correction-handoff')?'needs-repair':blocked.length?'correction-handoff':started>=maxJobs?'job-limit':'handoff';
  return {ok:status==='handoff'||status==='job-limit',status,completed:results.filter(r=>r.ok).length,dispatched:started,plans:final.map((p,i)=>({runDir:runs[i].runDir,stopped:stopped.get(runs[i].runDir)??null,pending:p.jobs?.filter(j=>!j.done).length,blockers:p.blockers,active:p.active?.length})),eventsFile:logFile};
 },{timeoutMs:180000});
}
export async function main(args=process.argv.slice(2)){
 const command=args[0],values={};for(let i=1;i<args.length;i++){const key=args[i];if(!['--runs','--pool','--concurrency','--run-id','--config','--pages','--attempt','--regenerate-reason','--retry-reason','--repair-from','--out','--project','--project-file','--visibility-reviews','--exports','--limit'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+key);values[key]=args[++i];}
 const poolDir=path.resolve(values['--pool']??DEFAULT_POOL);let result;
 if(['plan','review'].includes(command)){
  const runs=read(values['--runs']).map(leanRunOptions);
  if(command==='plan')result=await Promise.all(runs.map(async options=>({runDir:options.runDir,...await nextBoundedWork(options)})));
  else{result=await runLeanImportPool(runs,{poolDir,concurrency:Number(values['--concurrency']??3),retryDiagnosis:values['--regenerate-reason'],checkpoint:async(all,reason)=>writeCheckpoint(poolDir,reason,all.map(o=>o.runDir))});writeCheckpoint(poolDir,'command-finished',runs.map(o=>o.runDir),{status:result.status});}
 }else if(['author','inventory'].includes(command)){
  const loaded=loadRun(values['--run-id']);requireCurrentTranscription(loaded.manifest);if(!isLeanReview(loaded.manifest))throw Error('Lean authoring requires a three-pass run');
  const runner=runnerForManifest(loaded.manifest,poolDir),config=read(values['--config']),pages=parsePageSelection(values['--pages']);
  const timer=setInterval(()=>{try{writeCheckpoint(poolDir,'active-time',[loaded.runDir],{command});}catch{}},1800000);
  try{result=await runSemanticPackets({...loaded,config,stage:command,pages,attempt:Number(values['--attempt']??1),concurrency:Number(values['--concurrency']??3),regenerationReason:values['--regenerate-reason']??null,retryReason:values['--retry-reason']??null,repairFrom:values['--repair-from']?Number(values['--repair-from']):null},{runner:prepared=>withWorkerSlot(loaded.runDir,{stage:command,runDir:loaded.runDir},()=>runner({...prepared,stage:command,profile:'transcription'}))});}finally{clearInterval(timer);}
  writeCheckpoint(poolDir,'command-finished',[loaded.runDir],{command});
 }else if(command==='export'){
  const loaded=loadRun(values['--run-id']),projectFile=values['--project-file']??path.join('booklets/projects',values['--project']+'.json');
  const receipt=await withRunLock(loaded.runDir,'lean-final-export',()=>exportWithFrozenRuntime({out:values['--out'],projectId:values['--project'],runDir:loaded.runDir,projectFile:values['--project-file'],visibilityReviews:values['--visibility-reviews'],regenerationReason:values['--regenerate-reason']}));
  // Automated checks never establish inspection. Queue the selected pages now, so
  // the final visual review is scheduled work rather than something to remember.
  const visualReview=await queueVisualReviewAfterExport({runDir:loaded.runDir,manifest:loaded.manifest,projectFile,projectId:values['--project'],exportDir:values['--out']});
  result={...receipt,visualReview};
 }else if(command==='visual'){
  const loaded=loadRun(values['--run-id']);
  result=await withRunLock(loaded.runDir,'lean-visual-prepare',()=>prepareLeanVisualReview({runDir:loaded.runDir,manifest:loaded.manifest,projectFile:values['--project-file']??path.join('booklets/projects',values['--project']+'.json'),projectId:values['--project'],exportDir:values['--exports']}));
 }else if(command==='sample'){
  const loaded=loadRun(values['--run-id']);
  result=await withRunLock(loaded.runDir,'lean-layout-sample',()=>runLayoutSample({runDir:loaded.runDir,projectId:values['--project'],projectFile:values['--project-file'],out:values['--out'],limit:values['--limit']?Number(values['--limit']):undefined,visibilityReviews:values['--visibility-reviews'],regenerationReason:values['--regenerate-reason']}));
 }else throw Error('Use plan|review --runs FILE, inventory|author --run-id ID --config FILE --pages RANGE, sample --run-id ID --project ID --project-file CANDIDATE --out DIR [--limit N], export --run-id ID --project ID --out DIR, or visual --run-id ID --project ID --exports DIR');
 console.log(JSON.stringify(result,null,2));if(result?.ok===false)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
