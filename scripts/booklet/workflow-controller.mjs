// Deterministic dispatch around the existing review register. Review credit and
// publication remain with their authoritative, revision-checked APIs.
import fs from 'node:fs';
import path from 'node:path';
import {nextBoundedWork,runBoundedStage,executePreparedBoundedStage,recordBoundedStage} from './bounded-stages.mjs';
import {buildRunReceipt,withRunLock} from './run-observability.mjs';
import {runBoundedJobs,workerConcurrency} from './worker-pool.mjs';
import {dependencyStatus} from './dependency-runner.mjs';
import {runSemanticPackets} from './semantic-workflow.mjs';
import {runCodexTranscription} from './codex-transcription.mjs';
import {readAttemptEvents} from './semantic-run-metrics.mjs';
import {freshGenerationOptions,generationPublicationGuard} from './inventory-reuse.mjs';

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

export async function driveBoundedWorkflow(options,{budget={},concurrency=3,runner,maxWaves=defaults.maxWaves,
 next=nextBoundedWork,receipt=buildRunReceipt,run=runBoundedStage,resume=executePreparedBoundedStage,record=recordBoundedStage,
 generationStatus=dependencyStatus,generationRun=runSemanticPackets,planFile}={}){
 const runDir=path.resolve(options.runDir),limit=workerConcurrency(concurrency);
 if(!Number.isSafeInteger(maxWaves)||maxWaves<1)throw Error('maxWaves must be a positive integer');
 if(!['totalTokens','uncachedPlusOutputTokens','externalTokens'].some(key=>budget[key]!==undefined))throw Error('Drive needs at least one token budget');
 return withRunLock(runDir,'bounded-drive',async()=>{
  const logFile=path.join(runDir,'workflow','controller-events.jsonl'),attempted=new Set(),recovered=new Set(),priorFailures=new Map(),failures=[],warnings=[];
  if(fs.existsSync(logFile)){
   const content=fs.readFileSync(logFile,'utf8');if(content&&!content.endsWith('\n'))throw Error('Controller event log has an incomplete tail; reconcile it before dispatch');
   for(const line of content.split('\n').filter(Boolean)){
    const event=JSON.parse(line);
    if(event.event==='recovery-failed'&&event.claimId){recovered.add(event.claimId);priorFailures.set(event.claimId,{jobId:event.jobId,reason:event.reason,retainedOutput:event.retainedOutput});}
    if(event.event==='recovered'&&event.claimId){recovered.delete(event.claimId);priorFailures.delete(event.claimId);}
   }
  }
  const log=(event,details={})=>fs.appendFileSync(logFile,JSON.stringify({event,at:new Date().toISOString(),...details})+'\n');
  for(let wave=0;wave<maxWaves;wave++){
   const state=await next(options),claims=state.active??[];
   const claim=claims.find(c=>!recovered.has(c.id)&&['record','execute'].includes(recoveryAction(c,runDir).kind));
   if(claim){
    recovered.add(claim.id);const action=recoveryAction(claim,runDir),gate=evaluateDispatchBudget(receipt(runDir),budget,action.kind==='execute'?1:0);
    if(action.kind==='execute'&&!gate.ok)return {ok:false,status:gate.missingUsage?'usage-unavailable':'budget-exhausted',budget:gate,failures,active:claims.length};
    try{
     const result=action.kind==='execute'?await resume(options,claim.ticket,{runner}):await record(options,{ticket:claim.ticket,...('resultFile'in action?{resultFile:action.resultFile}:{result:action.result})});
     log('recovered',{claimId:claim.id,jobId:claim.jobId,action:action.kind,accepted:result.ok});
    }catch(error){failures.push({jobId:claim.jobId,reason:error.message,retainedOutput:error.retainedOutput??null});priorFailures.set(claim.id,failures.at(-1));log('recovery-failed',{claimId:claim.id,...failures.at(-1)});}
    continue;
   }
   const runnable=(state.jobs??[]).filter(j=>!j.blockers?.length&&!attempted.has(j.id));
   if(!runnable.length){
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
       if(!report.ok)failures.push({jobId:'generation:'+job.stage+':'+job.page,reason:report.pages?.filter(p=>!p.ok).map(p=>`Page ${p.page}: ${p.error??p.blocked?.join(', ')??'failed'}`).join('; ')||'Generation returned failed pages; inspect the retained attempts'});
      }catch(error){const failure={jobId:'generation:'+job.stage+':'+job.page,reason:error.message};failures.push(failure);log('generation-failed',failure);}
      continue;
     }
    }
    const complete=!!state.checklist?.length&&state.checklist.every(c=>c.passed)&&!claims.length&&!state.jobs?.length&&!state.blockers?.length&&!generationBlockers.length;
    const retainedFailures=claims.map(c=>priorFailures.get(c.id)).filter(Boolean),status=complete?'complete':failures.length||retainedFailures.length?'needs-repair':'handoff';
    log('stopped',{status,remaining:state.jobs?.length??0,active:claims.length});
    return {ok:complete,status,remaining:state.jobs??[],active:claims.map(c=>({jobId:c.jobId,action:recoveryAction(c,runDir)})),blockers:[...(state.blockers??[]),...generationBlockers],
     checks:state.checklist?.filter(c=>!c.passed)??[],handoffs:state.handoffs,failures:[...retainedFailures,...failures],warnings};
   }
   const capacity=limit,visual=runnable.find(j=>['visual','composition'].includes(j.stage));
   let selected=visual?[visual,...runnable.filter(j=>!['visual','composition'].includes(j.stage)).slice(0,capacity-1)]:runnable.slice(0,capacity);
   if(!selected.length)return {ok:false,status:'handoff',remaining:runnable,active:claims.map(c=>({jobId:c.jobId,action:recoveryAction(c,runDir)})),failures,warnings};
   const currentReceipt=receipt(runDir);let gate=evaluateDispatchBudget(currentReceipt,budget,selected.length);
   while(!gate.ok&&!gate.missingUsage&&selected.length>1){selected=selected.slice(0,-1);gate=evaluateDispatchBudget(currentReceipt,budget,selected.length);}
   warnings.push(...gate.warnings);
   if(!gate.ok){log('budget-stopped',{gate});return {ok:false,status:gate.missingUsage?'usage-unavailable':'budget-exhausted',budget:gate,remaining:selected,failures,warnings};}
   for(const job of selected){attempted.add(job.id);log('dispatch',{jobId:job.id,stage:job.stage,dependencyHash:job.dependencyHash});}
   const results=await runBoundedJobs(selected,job=>run(options,job.id,{runner}),{concurrency:limit});
   for(const row of results){if(row.ok)log('finished',{jobId:row.id,accepted:row.result.ok});else{
    const failure={jobId:row.id,reason:row.error.message,retainedOutput:row.error.retainedOutput??null};failures.push(failure);log('failed',failure);
   }}
  }
  log('stopped',{status:'wave-limit'});
  return {ok:false,status:'wave-limit',failures,warnings,note:'Resume with the durable register and existing tickets.'};
 });
}
