// Deterministic dispatch around the existing review register. Review credit and
// publication remain with their authoritative, revision-checked APIs.
import fs from 'node:fs';
import path from 'node:path';
import {nextBoundedWork,runBoundedStage,executePreparedBoundedStage,recordBoundedStage,cancelBoundedStage} from './bounded-stages.mjs';
import {randomUUID} from 'node:crypto';
import {buildRunReceipt,withRunLock,measureRunPhase} from './run-observability.mjs';
import {workerConcurrency} from './worker-pool.mjs';
import {dependencyStatus} from './dependency-runner.mjs';
import {runSemanticPackets} from './semantic-workflow.mjs';
import {runCodexTranscription} from './codex-transcription.mjs';
import {readAttemptEvents} from './semantic-run-metrics.mjs';
import {freshGenerationOptions,generationPublicationGuard} from './inventory-reuse.mjs';
import {liveWorkflow,synchronizeProject,fingerprint,bytesHash} from './workflow-review.mjs';

const defaults={warningFraction:0.8,reserveTokensPerJob:100000,maxWaves:100};
const positive=(value,name)=>{if(value===undefined)return null;if(!Number.isSafeInteger(value)||value<1)throw Error(name+' must be a positive integer');return value;};
export function evaluateDispatchBudget(receipt,budget={},slots=1){
 const config={...defaults,...budget},reserve=positive(config.reserveTokensPerJob,'reserveTokensPerJob')*slots;
 if(!(config.warningFraction>0&&config.warningFraction<1))throw Error('warningFraction must be between zero and one');
 const usage=receipt.completeJob?.usage??{},external=receipt.model?.normalizedUsage??receipt.model?.usage??{};
 const measures={totalTokens:usage.total_tokens??0,uncachedPlusOutputTokens:(usage.input_tokens??0)-(usage.cached_input_tokens??0)+(usage.output_tokens??0),externalTokens:external.total_tokens??0};
 const coverage=receipt.completeJob?.coverage??{};
 const missing=(receipt.completeJob?.missingUsage??0)+(receipt.incompleteTail?1:0)+(coverage.unavailableSessions??0)+(coverage.partialSessions??0)
  +(coverage.missingRoles?.includes('coordinator')?1:0);
 const limits=Object.fromEntries(['totalTokens','uncachedPlusOutputTokens','externalTokens'].map(key=>[key,positive(config[key],key)]));
 const warnings=[],exceeded=[];
 for(const [key,limit] of Object.entries(limits))if(limit!==null){
  const projected=measures[key]+reserve;
  if(projected>limit)exceeded.push({measure:key,observed:measures[key],reserved:reserve,limit});
  else if(projected>=limit*config.warningFraction)warnings.push({measure:key,observed:measures[key],reserved:reserve,limit});
 }
 return {ok:!missing&&!exceeded.length,observed:measures,missingUsage:missing,reserved:reserve,warnings,exceeded,
  note:'Reservations limit automatic dispatch, not actual model usage. Missing usage stops dispatch; provider calls can exceed an estimate.'};
}

const resultPath=claim=>path.join(path.dirname(claim.ticket.path),'generation.json');
export function selectDispatchJobs(jobs,active=[],capacity=3){
 const selected=[];
 for(const job of jobs){
  const others=[...active,...selected];
  if(others.some(other=>other.stage==='composition')||job.stage==='composition'&&others.length)continue;
  if(job.stage==='visual'&&others.filter(other=>other.stage==='visual').length>=(job.visualConcurrency??1))continue;
  if(job.stage==='assessment'){
   const scope=job.dispatch;
   if(!scope&&others.some(other=>other.stage==='assessment'))continue;
   if(scope&&others.some(other=>{
    if(other.stage!=='assessment')return false;
    const otherScope=other.dispatch;if(!otherScope)return true;
    const overlaps=(a,b)=>(a??[]).some(page=>(b??[]).includes(page));
    return overlaps(scope.sourcePages,otherScope.sourcePages)||
     (!scope.teachingStable||!otherScope.teachingStable)&&
      (scope.exerciseId===otherScope.exerciseId||overlaps([...(scope.sourcePages??[]),...(scope.teachingPages??[])],[...(otherScope.sourcePages??[]),...(otherScope.teachingPages??[])]));
   }))continue;
  }
  selected.push(job);if(selected.length===capacity)break;
 }
 return selected;
}

export async function recoverEndedStageFailure(options,error,{cancel=cancelBoundedStage}={}){
 const ticket=error.ticket;if(!ticket?.path||!error.retainedOutput)return {action:'retained',inspectionCredited:false,reason:'No exact ticket and retained worker directory'};
 const worker=path.join(path.dirname(ticket.path),'codex'),supplied=typeof error.retainedOutput==='string'?error.retainedOutput:error.retainedOutput?.directory;
 if(path.resolve(supplied??'')!==worker||!fs.existsSync(worker)||!fs.lstatSync(worker).isDirectory())return {action:'retained-for-reconciliation',inspectionCredited:false};
 const root=fs.realpathSync(path.join(options.runDir,'workflow/stages')),real=fs.realpathSync(worker),relative=path.relative(root,real);
 if(relative.startsWith('..')||path.isAbsolute(relative)||fs.lstatSync(worker).isSymbolicLink())throw Error('Retained worker directory is outside the run or symbolic');
 if(fs.existsSync(path.join(path.dirname(ticket.path),'generation.json'))||completedWorkerResult({ticket}))return {action:'retained-for-reconciliation',inspectionCredited:false};
 // Called only after the awaited execution rejects, never for an active claim.
 await cancel(options,{ticket,reason:'Ended worker failed without a completed result: '+error.message});
 return {action:'cancelled-ended-owner',inspectionCredited:false,ticket};
}
function completedWorkerResult(claim){
 const dir=path.join(path.dirname(claim.ticket.path),'codex'),message=path.join(dir,'last-message.txt'),events=path.join(dir,'events.jsonl');
 if(!fs.existsSync(message)||!fs.existsSync(events))return null;
 const lines=fs.readFileSync(events,'utf8').trim().split('\n');
 if(!lines.some(line=>{try{return JSON.parse(line).type==='turn.completed';}catch{return false;}}))return null;
 try{return JSON.parse(fs.readFileSync(message,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{return null;}
}
export function recoveryAction(claim,runDir){
 if(claim.blockedResult)return {kind:'blocked',reason:'Reviewer finding needs a recorded decision'};
 if(!claim.ticket?.path||!fs.existsSync(claim.ticket.path))return {kind:'blocked',reason:'Immutable stage ticket is missing'};
 if(runDir){
  const root=fs.realpathSync(path.resolve(runDir,'workflow','stages')),target=fs.realpathSync(claim.ticket.path),relative=path.relative(root,target);
  if(relative.startsWith('..')||path.isAbsolute(relative))return {kind:'blocked',reason:'Stage ticket is outside this run'};
 }
 if(fs.existsSync(resultPath(claim)))return {kind:'record',resultFile:resultPath(claim)};
 const result=completedWorkerResult(claim);if(result)return {kind:'record',result};
 if(fs.existsSync(path.join(path.dirname(claim.ticket.path),'codex')))return {kind:'blocked',reason:'Interrupted worker output needs explicit reconciliation'};
 if(runDir){
  const attempts=readAttemptEvents(path.join(runDir,'semantic-packets'));
  if(attempts.incompleteTail||attempts.events.some(event=>event.event==='started'&&event.requestId===claim.id))
   return {kind:'blocked',reason:'A prior worker attempt needs explicit reconciliation before another model call'};
 }
 return {kind:'execute'};
}

export async function publishStageCorrections(options,result){
 if(!result.next?.startsWith('Propagate approved corrections'))return;
 if(bytesHash(result.ticket.path)!==result.ticket.hash||!result.artifact||bytesHash(result.artifact.path)!==result.artifact.hash)throw Error('Reviewed correction evidence changed before publication');
 const request=JSON.parse(fs.readFileSync(result.ticket.path,'utf8')),file=path.resolve(request.projectFile),project=JSON.parse(fs.readFileSync(file,'utf8'));
 if(file!==path.resolve('booklets/projects',project.id+'.json'))throw Error('Reviewed candidate corrections are retained; save the candidate through the revision-safe project transaction before resuming');
 const updated=synchronizeProject(project,liveWorkflow(options.runDir),request.selectedPages,JSON.parse(fs.readFileSync(path.join(options.runDir,'manifest.json'),'utf8')).id);
 if(fingerprint(updated)!==fingerprint(project)){
  const {saveBookletProject}=await import('./project-studio-server.mjs');
  await saveBookletProject(updated,{expectedRevision:project.revision});
  const saved=JSON.parse(fs.readFileSync(file,'utf8'));
  const {materializeCorrections,workflowForPages}=await import('./workflow-review.mjs');
  const state=liveWorkflow(options.runDir),effective=materializeCorrections(saved,workflowForPages(state,request.selectedPages),'project');
  if(fingerprint(effective.sections)!==fingerprint(saved.sections))throw Error('Project correction readback differs from the reviewed result');
 }
}

export async function driveBoundedWorkflow(options,{budget={},concurrency=3,runner,maxWaves=defaults.maxWaves,
 next=nextBoundedWork,receipt=buildRunReceipt,run=runBoundedStage,resume=executePreparedBoundedStage,record=recordBoundedStage,
 generationStatus=dependencyStatus,generationRun=runSemanticPackets,planFile,cancel=cancelBoundedStage,publish=publishStageCorrections,retryDiagnosis}={}){
 const runDir=path.resolve(options.runDir),limit=workerConcurrency(concurrency);
 if(!Number.isSafeInteger(maxWaves)||maxWaves<1)throw Error('maxWaves must be a positive integer');
 if(!['totalTokens','uncachedPlusOutputTokens','externalTokens'].some(key=>budget[key]!==undefined))throw Error('Drive needs at least one token budget');
 return measureRunPhase(runDir,'workflow-dispatch',()=>withRunLock(runDir,'bounded-drive',async()=>{
  const logFile=path.join(runDir,'workflow','controller-events.jsonl'),attempted=new Set(),recovered=new Set(),priorFailures=new Map(),failedJobs=new Map(),pendingPublications=new Map(),failures=[],warnings=[],active=new Map();
  const probe=path.join(runDir,'workflow','.dispatch-bootstrap-'+randomUUID());
  fs.writeFileSync(probe,'local writable-state probe',{flag:'wx'});fs.unlinkSync(probe);
  if(fs.existsSync(logFile)){
   const content=fs.readFileSync(logFile,'utf8');if(content&&!content.endsWith('\n'))throw Error('Controller event log has an incomplete tail; reconcile it before dispatch');
   for(const line of content.split('\n').filter(Boolean)){
    const event=JSON.parse(line);
    if(event.event==='recovery-failed'&&event.claimId){recovered.add(event.claimId);priorFailures.set(event.claimId,{jobId:event.jobId,reason:event.reason,retainedOutput:event.retainedOutput});}
    if(event.event==='recovered'&&event.claimId){recovered.delete(event.claimId);priorFailures.delete(event.claimId);}
    if(event.event==='publication-pending')pendingPublications.set(event.jobId,event.result);
    if(event.event==='publication-finished')pendingPublications.delete(event.jobId);
    if(event.event==='failed')failedJobs.set(event.jobId,event);
    if(event.event==='finished')failedJobs.delete(event.jobId);
   }
  }
  const log=(event,details={})=>fs.appendFileSync(logFile,JSON.stringify({event,at:new Date().toISOString(),...details})+'\n');
  const publishResult=async(jobId,result)=>{
   if(result.next){pendingPublications.set(jobId,result);log('publication-pending',{jobId,result});}
   await publish(options,result);
   if(result.next){pendingPublications.delete(jobId);log('publication-finished',{jobId});}
  };
  let stopReason=null;
  const takeResult=async()=>{
   const row=await Promise.race([...active.values()].map(value=>value.promise)),assigned=active.get(row.id)?.job;active.delete(row.id);
   if(row.ok&&row.result.ok!==false){
    try{await publishResult(row.id,row.result);log('finished',{jobId:row.id,accepted:row.result.ok});return;}
    catch(error){row.ok=false;row.error=error;}
   }
   const error=row.error??Error('Reviewer returned a failed result'),failure={jobId:row.id,reason:error.message,retainedOutput:error.retainedOutput??null,dependencyHash:assigned?.dependencyHash};
   failures.push(failure);stopReason={ok:false,status:'needs-repair'};log('failed',failure);
   if(row.error)try{log('worker-recovery',{jobId:row.id,...await recoverEndedStageFailure(options,error,{cancel})});}
   catch(recoveryError){log('worker-recovery',{jobId:row.id,action:'retained-cleanup-blocked',reason:recoveryError.message,inspectionCredited:false});}
  };
  log('bootstrap',{kind:'local',externalModelCalls:0});
  try{
  for(const [jobId,result] of [...pendingPublications])try{await publishResult(jobId,result);}
  catch(error){log('publication-failed',{jobId,reason:error.message});return {ok:false,status:'needs-repair',failures:[{jobId,reason:error.message}],warnings};}
  for(let wave=0;wave<maxWaves;wave++){
   if(fs.existsSync(path.join(runDir,'workflow','dispatch-drain')))stopReason??={ok:false,status:'drained'};
   if(stopReason){while(active.size)await takeResult();return {...stopReason,failures,warnings};}
   const state=await next(options),claims=state.active??[];
   const undiagnosed=(state.jobs??[]).filter(job=>!job.done&&failedJobs.has(job.id)&&failedJobs.get(job.id).dependencyHash===job.dependencyHash&&!retryDiagnosis?.trim()&&!claims.some(claim=>claim.jobId===job.id&&recoveryAction(claim,runDir).kind==='record'));
   if(undiagnosed.length){while(active.size)await takeResult();return {ok:false,status:'needs-repair',failures:undiagnosed.map(job=>({jobId:job.id,reason:'Diagnose the retained failure before redispatch; use --regenerate-reason to record the changed approach'})),warnings};}
   const claim=!active.size&&claims.find(c=>!recovered.has(c.id)&&['record','execute'].includes(recoveryAction(c,runDir).kind));
   if(claim){
    recovered.add(claim.id);const action=recoveryAction(claim,runDir),gate=evaluateDispatchBudget(receipt(runDir),budget,action.kind==='execute'?1:0);
    if(action.kind==='execute'&&!gate.ok)return {ok:false,status:gate.missingUsage?'usage-unavailable':'budget-exhausted',budget:gate,failures,active:claims.length};
    try{
     const result=action.kind==='execute'?await resume(options,claim.ticket,{runner}):await record(options,{ticket:claim.ticket,...('resultFile'in action?{resultFile:action.resultFile}:{result:action.result})});
     if(result.ok!==false)await publishResult(claim.jobId,result);
     log('recovered',{claimId:claim.id,jobId:claim.jobId,action:action.kind,accepted:result.ok});
     if(result.ok===false){failures.push({jobId:claim.jobId,reason:'Recovered reviewer result needs repair'});stopReason={ok:false,status:'needs-repair'};}
    }catch(error){failures.push({jobId:claim.jobId,reason:error.message,retainedOutput:error.retainedOutput??null});priorFailures.set(claim.id,failures.at(-1));log('recovery-failed',{claimId:claim.id,...failures.at(-1)});stopReason={ok:false,status:'needs-repair'};}
    continue;
   }
   const runnable=(state.jobs??[]).filter(j=>!j.done&&!j.blockers?.length&&!attempted.has(j.id)&&!active.has(j.id));
   if(!runnable.length){
    if(active.size){await takeResult();continue;}
    let generationBlockers=[];
    if(options.config&&options.manifest){
     const generationOptions={...options,pages:options.selectedPages??options.manifest.selectedPages};
     const generation=generationStatus(generationOptions,{requireRepresentativePlan:true,planFile});
     generationBlockers=generation.blocked??[];
     const job=generation.jobs.find(j=>!attempted.has('generation:'+j.stage+':'+j.page));
     if(job){
      const argumentsForRun={...freshGenerationOptions(generationOptions,job.stage,job.page),stage:job.stage,pages:[job.page],attempt:job.attempt,concurrency:1};
      let preview;
      try{preview=job.kind==='registration'?null:await generationRun({...argumentsForRun,dryRun:true},{log:()=>{}});}
      catch(error){const failure={jobId:'generation:'+job.stage+':'+job.page,reason:'Generation preflight: '+error.message};log('generation-preflight-failed',failure);
       return {ok:false,status:'needs-repair',remaining:[job],failures:[...failures,failure],warnings};}
      const estimated=job.kind==='registration'?0:job.stage==='author'?Math.max(1,preview?.assignmentPlan?.assignments?.filter(a=>!a.evidenceOnly).length??1):1;
      const gate=evaluateDispatchBudget(receipt(runDir),budget,estimated);
      if(!gate.ok){log('budget-stopped',{gate});return {ok:false,status:gate.missingUsage?'usage-unavailable':'budget-exhausted',budget:gate,remaining:[job],failures,warnings};}
      attempted.add('generation:'+job.stage+':'+job.page);log('generation-dispatch',{stage:job.stage,page:job.page,attempt:job.attempt,estimatedCalls:estimated});
      let reserved=0,unknown=false;const charged={total:0,input:0,cached:0,output:0};
      const guardedRunner=async request=>{
       const current=receipt(runDir),usage=current.completeJob?.usage??{},external=current.model?.normalizedUsage??{};
       const guarded={...current,completeJob:{...current.completeJob,usage:{...usage,total_tokens:(usage.total_tokens??0)+charged.total,
        input_tokens:(usage.input_tokens??0)+charged.input,cached_input_tokens:(usage.cached_input_tokens??0)+charged.cached,output_tokens:(usage.output_tokens??0)+charged.output}},
        model:{...current.model,normalizedUsage:{...external,total_tokens:(external.total_tokens??0)+charged.total}}};
       const callGate=evaluateDispatchBudget(guarded,budget,reserved+1);
       if(unknown||!callGate.ok)throw Error('Token budget or usage coverage stopped automatic generation dispatch');
       reserved++;
       try{
        const reply=await (runner??runCodexTranscription)(request),measured=reply.metrics?.usage,
         actual=measured?.total_tokens??(Number.isFinite(measured?.input_tokens)&&Number.isFinite(measured?.output_tokens)?measured.input_tokens+measured.output_tokens:null);
        if([actual,measured?.input_tokens,measured?.cached_input_tokens,measured?.output_tokens].every(value=>Number.isFinite(value)&&value>=0)){
         charged.total+=actual;charged.input+=measured.input_tokens;charged.cached+=measured.cached_input_tokens;charged.output+=measured.output_tokens;
        }else unknown=true;
        return reply;
       }catch(error){unknown=true;throw error;}finally{reserved--;}
      };
      try{
       const report=await generationRun(argumentsForRun,{runner:guardedRunner,log:()=>{},verifyPublication:generationPublicationGuard(generationOptions,job.stage,job.page)});
       log('generation-finished',{stage:job.stage,page:job.page,ok:report.ok,completed:report.pages?.filter(p=>p.ok).length??0});
       if(!report.ok){failures.push({jobId:'generation:'+job.stage+':'+job.page,reason:report.pages?.filter(p=>!p.ok).map(p=>`Page ${p.page}: ${p.error??p.blocked?.join(', ')??'failed'}`).join('; ')||'Generation returned failed pages; inspect the retained attempts'});stopReason={ok:false,status:'needs-repair'};}
      }catch(error){const failure={jobId:'generation:'+job.stage+':'+job.page,reason:error.message};failures.push(failure);log('generation-failed',failure);stopReason={ok:false,status:'needs-repair'};}
      continue;
     }
    }
    const complete=!!state.checklist?.length&&state.checklist.every(c=>c.passed)&&!claims.length&&!state.jobs?.length&&!state.blockers?.length&&!generationBlockers.length;
    const retainedFailures=claims.map(c=>priorFailures.get(c.id)).filter(Boolean),status=complete?'complete':failures.length||retainedFailures.length?'needs-repair':'handoff';
    log('stopped',{status,remaining:state.jobs?.length??0,active:claims.length});
    return {ok:complete,status,remaining:state.jobs??[],active:claims.map(c=>({jobId:c.jobId,action:recoveryAction(c,runDir)})),blockers:[...(state.blockers??[]),...generationBlockers],
     checks:state.checklist?.filter(c=>!c.passed)??[],handoffs:state.handoffs,failures:[...retainedFailures,...failures],warnings};
   }
   const capacity=limit-active.size;
   let selected=capacity?selectDispatchJobs(runnable.map(job=>job.stage==='visual'?{...job,visualConcurrency:state.visualConcurrency??options.visualConcurrency??1}:job),[...active.values()].map(value=>value.job),capacity):[];
   if(!selected.length){if(active.size){await takeResult();continue;}return {ok:false,status:'handoff',remaining:runnable,active:claims.map(c=>({jobId:c.jobId,action:recoveryAction(c,runDir)})),failures,warnings};}
   const currentReceipt=receipt(runDir);let gate=evaluateDispatchBudget(currentReceipt,budget,selected.length+active.size);
   while(!gate.ok&&!gate.missingUsage&&selected.length>1){selected=selected.slice(0,-1);gate=evaluateDispatchBudget(currentReceipt,budget,selected.length+active.size);}
   warnings.push(...gate.warnings);
   if(!gate.ok){log('budget-stopped',{gate});stopReason={ok:false,status:gate.missingUsage?'usage-unavailable':'budget-exhausted',budget:gate,remaining:selected};while(active.size)await takeResult();return {...stopReason,failures,warnings};}
   for(const job of selected){
    attempted.add(job.id);log('dispatch',{jobId:job.id,stage:job.stage,dependencyHash:job.dependencyHash,batch:job.batch,deliveredCharacters:job.deliveredCharacters,...(failedJobs.has(job.id)&&retryDiagnosis?{retryDiagnosis}: {})});
    const promise=Promise.resolve().then(()=>run(options,job.id,{runner})).then(result=>({id:job.id,ok:true,result}),error=>({id:job.id,ok:false,error}));
    active.set(job.id,{job,promise});
   }
   await takeResult();
  }
  while(active.size)await takeResult();
  if(stopReason)return {...stopReason,failures,warnings};
  log('stopped',{status:'wave-limit'});
  return {ok:false,status:'wave-limit',failures,warnings,note:'Resume with the durable register and existing tickets.'};
  }catch(error){while(active.size)await takeResult();throw error;}
 }));
}
