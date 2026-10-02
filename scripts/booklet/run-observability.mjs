import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readAttemptEvents,summarizeAttemptEvents,attemptCallRecords} from './semantic-run-metrics.mjs';
import {createHash} from 'node:crypto';
import {aggregateUsage,aggregateToolMetrics,readCodexSessionUsage,unionDuration,overlapDuration,summarizeWeeklyUsage,timestamp} from './session-usage.mjs';

const queues=new Map();
// One publication/review mutation at a time, including separate CLI processes.
// An abandoned lock needs explicit reconciliation; never steal another writer's lock.
export async function withRunLock(runDir,name,action,{timeoutMs=30000}={}) {
 if(!/^[a-z-]+$/.test(name))throw Error('Invalid run lock name');
 const file=path.resolve(runDir,'workflow',name+'.lock'),prior=queues.get(file)??Promise.resolve();
 const pending=prior.catch(()=>{}).then(async()=>{
  fs.mkdirSync(path.dirname(file),{recursive:true});const started=Date.now();let fd;
  while(fd===undefined){
   try{fd=fs.openSync(file,'wx');}catch(error){
    if(error.code!=='EEXIST'){
     // Windows can report EPERM for an exclusive open of an occupied lock.
     // Only a verified regular file represents another owner; absent,
     // unreadable and directory targets retain the original permission error.
     let occupied=false;
     if(error.code==='EPERM'){try{occupied=fs.statSync(file).isFile();}catch{/* Preserve the original permission error. */}}
     if(!occupied)throw error;
    }
    if(Date.now()-started>=timeoutMs)throw Error(name+' lock is busy; reconcile the owner before retrying');
    await new Promise(resolve=>setTimeout(resolve,50));
   }
  }
  try{fs.writeSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));return await action();}
  finally{fs.closeSync(fd);fs.unlinkSync(file);}
 });
 queues.set(file,pending);
 try{return await pending;}finally{if(queues.get(file)===pending)queues.delete(file);}
}

export function readRunEvents(runDir) {
 const file=path.join(runDir,'workflow','run-events.jsonl');
 if(!fs.existsSync(file))return {events:[],incompleteTail:false};
 const lines=fs.readFileSync(file,'utf8').split('\n'),events=[];let incompleteTail=false;
 for(let i=0;i<lines.length;i++)if(lines[i].trim()){
  try{events.push(JSON.parse(lines[i]));}catch(error){if(i===lines.length-1){incompleteTail=true;break;}throw error;}
 }
 return {events,incompleteTail};
}

export function appendRunEvent(runDir,event) {
 const file=path.join(runDir,'workflow','run-events.jsonl');fs.mkdirSync(path.dirname(file),{recursive:true});
 if(fs.existsSync(file)&&fs.statSync(file).size){
  const fd=fs.openSync(file,'r'),last=Buffer.alloc(1);try{fs.readSync(fd,last,0,1,fs.fstatSync(fd).size-1);}finally{fs.closeSync(fd);}
  if(last[0]!==10)throw Error('Run event log has an incomplete tail; preserve and reconcile it first');
 }
 const time=Date.now();fs.appendFileSync(file,JSON.stringify({...event,time,at:new Date(time).toISOString()})+'\n');
 return time;
}

export function beginRunPhase(runDir,phase,details={}) {
 const id=randomUUID();appendRunEvent(runDir,{event:'phase-started',id,phase,details});return id;
}
export function endRunPhase(runDir,id,{ok=true,...details}={}) {appendRunEvent(runDir,{event:'phase-finished',id,ok,details});}
export function beginHumanWait(runDir,details={}) {return beginRunPhase(runDir,'human-wait',{...details,activity:'human-wait',excludedFromActive:true});}
export function endHumanWait(runDir,id,details={}) {
 const events=readRunEvents(runDir).events,start=events.find(event=>event.event==='phase-started'&&event.id===id);
 if(!start||start.phase!=='human-wait')throw Error('Human wait id is missing or belongs to another phase');
 // Retried acknowledgements must not extend an already completed wait.
 if(!events.some(event=>event.event==='phase-finished'&&event.id===id))endRunPhase(runDir,id,details);
}
export async function measureRunPhase(runDir,phase,action,details={}) {
 const id=beginRunPhase(runDir,phase,details);
 try{const result=await action();endRunPhase(runDir,id,{ok:result?.ok!==false});return result;}catch(error){endRunPhase(runDir,id,{ok:false,error:error.message});throw error;}
}
// CLI lifetime includes startup failures. Abrupt termination leaves an unfinished
// start event; normal errors retain a failed completion. Never infer inspection.
export function trackProcessPhase(runDir,phase,{artifact,...details}={}) {
 if(!runDir)return;
 const id=beginRunPhase(runDir,phase,details);
 process.once('exit',code=>{
  const evidence=artifact&&fs.existsSync(artifact)?{path:path.resolve(artifact),hash:createHash('sha256').update(fs.readFileSync(artifact)).digest('hex')}:null;
  endRunPhase(runDir,id,{ok:code===0,exitCode:code,artifact:evidence});
 });
 return id;
}
const identity=(value,label)=>{if(typeof value!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/.test(value))throw Error('Invalid '+label);return value;};
const iso=(value,label)=>{const time=timestamp(value);if(time===null)throw Error('Invalid '+label);return new Date(time).toISOString();};
const eventHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Explicit links are the only way to include other sessions. Never infer run
// ownership by scanning unrelated conversations, workspaces or account history.
export async function linkRunSession(runDir,input) {
 const sessionId=identity(input.sessionId,'session identity'),stage=identity(input.stage,'session stage'),role=input.role;
 if(!['coordinator','transcription','review'].includes(role))throw Error('Session role must be coordinator, transcription or review');
 if(typeof input.rolloutPath!=='string'||!input.rolloutPath.trim())throw Error('Session link requires a local rollout path');
 const startedAt=input.startedAt===undefined||input.startedAt===null?null:iso(input.startedAt,'session start'),endedAt=input.endedAt===undefined||input.endedAt===null?null:iso(input.endedAt,'session end');
 if(startedAt&&endedAt&&Date.parse(endedAt)<=Date.parse(startedAt))throw Error('Session end must follow its start');
 const link={sessionId,stage,role,rolloutPath:path.resolve(input.rolloutPath),startedAt,endedAt,attemptIds:[...new Set(input.attemptIds??[])].map(value=>identity(value,'attempt identity')).sort()};
 const id=eventHash({sessionId,stage,startedAt,endedAt});
 return withRunLock(runDir,'observability',()=>{
  const links=readRunEvents(runDir).events.filter(event=>event.event==='session-linked');
  const prior=links.find(event=>event.id===id);
  if(prior){const {canonicalSessionId,...attribution}=prior.link;if(eventHash(attribution)!==eventHash(link))throw Error('Session link already exists with different attribution');return {ok:true,id,reused:true,...link};}
  const a=startedAt?Date.parse(startedAt):-Infinity,b=endedAt?Date.parse(endedAt):Infinity;
  // Missing historical logs are legitimate unavailable evidence. Existing files
  // must match the declared session before their metadata can be attributed.
  const metadata=fs.existsSync(link.rolloutPath)?readCodexSessionUsage(link.rolloutPath,link):null,aliases=new Set([sessionId,...(metadata?.sessionAliases??[])]);
  for(const entry of links)if(aliases.has(entry.link.sessionId)||aliases.has(entry.link.canonicalSessionId)){const c=entry.link.startedAt?Date.parse(entry.link.startedAt):-Infinity,d=entry.link.endedAt?Date.parse(entry.link.endedAt):Infinity;if(Math.min(b,d)>Math.max(a,c))throw Error('Session stage links overlap; use disjoint explicit intervals');}
  appendRunEvent(runDir,{event:'session-linked',id,link:{...link,canonicalSessionId:metadata?.canonicalSessionId??sessionId}});return {ok:true,id,reused:false,...link};
 });
}

export async function recordWeeklyUsage(runDir,input) {
 const id=identity(input.id,'allowance observation identity'),at=iso(input.at,'allowance observation time'),resetAt=iso(input.resetAt,'allowance reset time');
 if(input.windowMinutes!==10080)throw Error('Weekly allowance observations require a 10080-minute window');
 if(typeof input.usedPercent!=='number'||!Number.isFinite(input.usedPercent)||input.usedPercent<0||input.usedPercent>100)throw Error('Allowance used percent must be between 0 and 100');
 if(Date.parse(at)>=Date.parse(resetAt)||Date.parse(at)<Date.parse(resetAt)-input.windowMinutes*60000)throw Error('Allowance observation is outside its stated reset window');
 const unrelatedConcurrentUsage=input.unrelatedConcurrentUsage??'unknown';
 if(!['none','present','unknown'].includes(unrelatedConcurrentUsage))throw Error('Invalid concurrent usage status');
 const unrelatedSessionIds=[...new Set(input.unrelatedSessionIds??[])].map(value=>identity(value,'unrelated session identity')).sort();
 if(unrelatedConcurrentUsage==='none'&&unrelatedSessionIds.length)throw Error('Unrelated session identities contradict an absence of concurrent usage');
 const observation={id,at,resetAt,windowMinutes:10080,usedPercent:input.usedPercent,limitId:identity(input.limitId??'codex','allowance limit identity'),unrelatedConcurrentUsage,unrelatedSessionIds};
 return withRunLock(runDir,'observability',()=>{
  const previous=readRunEvents(runDir).events.find(event=>event.event==='weekly-usage-observed'&&event.observation.id===id);
  if(previous){if(eventHash(previous.observation)!==eventHash(observation))throw Error('Allowance observation identity already has different values');return {ok:true,id,reused:true};}
  appendRunEvent(runDir,{event:'weekly-usage-observed',observation});return {ok:true,id,reused:false};
 });
}

export async function recordExportReuse(runDir,input) {
 const id=identity(input.id,'export observation identity'),edition=identity(input.edition,'export edition');
 if(typeof input.reused!=='boolean')throw Error('Export reuse must be explicitly true or false');
 if(!input.dependencyKey||typeof input.dependencyKey!=='string'||!input.artifact?.path||typeof input.artifact.hash!=='string')throw Error('Export observation requires current artifact and dependency evidence');
 const artifact={path:path.resolve(input.artifact.path),hash:input.artifact.hash};
 if(!fs.existsSync(artifact.path)||createHash('sha256').update(fs.readFileSync(artifact.path)).digest('hex')!==artifact.hash)throw Error('Export observation artifact is missing or changed');
 const observation={id,edition,reused:input.reused,artifact,dependencyKey:input.dependencyKey,phaseId:input.phaseId??null,...(input.reason?{reason:input.reason}:{})};
 return withRunLock(runDir,'observability',()=>{
  const previous=readRunEvents(runDir).events.find(event=>event.event==='export-observed'&&event.observation.id===id);
  if(previous){if(eventHash(previous.observation)!==eventHash(observation))throw Error('Export observation identity already has different values');return {ok:true,id,reused:true};}
  appendRunEvent(runDir,{event:'export-observed',observation});return {ok:true,id,reused:false};
 });
}

function completeJobAccounting(events,attempts) {
 const links=[...new Map(events.filter(event=>event.event==='session-linked').map(event=>[event.id,{id:event.id,...event.link}])).values()];
 const sources=links.map(link=>{
  try{return {link,data:readCodexSessionUsage(link.rolloutPath,link)};}
  catch(error){return {link,data:{sessionId:link.sessionId,available:false,reason:error.code??error.message,records:[],intervals:[],unfinished:[],toolCalls:null,compactions:null}};}
 });
 const covered=new Set(),mapped=new Map(),overlapConflicts=[];
 for(const source of sources){
  const {link,data}=source,a=link.startedAt?Date.parse(link.startedAt):-Infinity,b=link.endedAt?Date.parse(link.endedAt):Infinity;
  const matching=attempts.filter(row=>link.attemptIds.includes(row.attemptId)||row.sessionId===link.sessionId||data.sessionAliases?.includes(row.sessionId));
  const contained=matching.filter(row=>link.attemptIds.includes(row.attemptId)||(a===-Infinity&&b===Infinity)||(row.startedAt!==null&&row.endedAt!==null&&row.startedAt>=a&&row.endedAt<=b));
  const overlap=matching.filter(row=>!contained.includes(row)&&(row.startedAt===null||row.endedAt===null||Math.min(b,row.endedAt)>Math.max(a,row.startedAt)));
  source.attempts=contained;mapped.set(source.link.id,contained);
  // If attribution cannot be bounded, keep known runner totals and report the
  // excluded session coverage instead of counting overlapping tokens twice.
  if(overlap.length){source.useUsage=false;overlapConflicts.push({sessionId:link.sessionId,stage:link.stage,attemptIds:overlap.map(row=>row.attemptId)});}
  else source.useUsage=data.available&&(!contained.length||(data.coverage==='recorded'&&data.records.length>0));
  if(source.useUsage)for(const row of contained)covered.add(row.id);
 }
 const records=new Map();
 for(const source of sources)if(source.useUsage)for(const record of source.data.records){const id=(source.data.canonicalSessionId??source.link.sessionId)+':'+record.id;if(!records.has(id))records.set(id,{...record,id,stage:source.link.stage,role:source.link.role});}
 for(const source of sources)if(!source.data.records.length&&!source.attempts.length)records.set('unavailable:'+source.link.id,{id:'unavailable:'+source.link.id,kind:'unavailable-session',stage:source.link.stage,role:source.link.role,usage:null});
 for(const attempt of attempts)if(!covered.has(attempt.id))records.set(attempt.id,attempt);
 const rows=[...records.values()],groupBy=key=>Object.fromEntries([...new Set(rows.map(row=>row[key]))].map(name=>{const selected=rows.filter(row=>row[key]===name);return [name,{records:selected.length,...aggregateUsage(selected)}];}));
 const countedSessionTools=new Set(),countedCompletedTools=new Set(),countedCompactions=new Set(),toolFallback=[],completionFallback=[],compactionFallback=[];
 for(const source of sources)if(source.data.available){for(const row of source.data.toolRecords??[])countedSessionTools.add((source.data.canonicalSessionId??source.link.sessionId)+':'+row.id);for(const row of source.data.completedToolRecords??[])countedCompletedTools.add((source.data.canonicalSessionId??source.link.sessionId)+':'+row.id);for(const row of source.data.compactionRecords??[])countedCompactions.add((source.data.canonicalSessionId??source.link.sessionId)+':'+row.id);}
 for(const attempt of attempts){const source=sources.find(entry=>entry.data.available&&(mapped.get(entry.link.id)??[]).includes(attempt));if(!source){toolFallback.push(attempt.toolCalls);completionFallback.push(attempt);compactionFallback.push(attempt.compactions);}}
 const unmatchedSources=sources.filter(source=>!source.attempts.length),availableSources=sources.filter(source=>source.data.available);
 const completedMetrics=aggregateToolMetrics([...completionFallback,...(availableSources.length?[{completedToolCalls:countedCompletedTools.size,missingCompletedToolCounts:availableSources.reduce((sum,source)=>sum+(source.data.missingCompletedToolCounts??0),0)}]:[]),...unmatchedSources.filter(source=>!source.data.available).map(()=>({completedToolCalls:null}))]);
 // Session JSONL does not establish stderr rejection counts. Retain a linked
 // runner's diagnostics even when session response records replace its usage.
 const rejectedMetrics=aggregateToolMetrics([...attempts,...unmatchedSources.map(source=>({rejectedToolAttempts:source.data.rejectedToolAttempts??null,missingRejectedToolCounts:source.data.missingRejectedToolCounts??1}))]);
 const toolMissing=toolFallback.filter(value=>value===null).length+sources.filter(source=>!source.data.available&&!source.attempts.length).length;
 const compactionMissing=compactionFallback.filter(value=>value===null).length+sources.filter(source=>!source.data.available&&!source.attempts.length).length;
 const durations=attempts.map(row=>row.elapsedMs);
 // Runner durations already cover their linked sessions; do not add them again.
 for(const source of sources)if(!source.attempts.length&&source.useUsage)for(const row of source.data.records)durations.push(row.elapsedMs??null);
 const knownDurations=durations.filter(value=>value!==null),roles=new Set([...links.map(link=>link.role),...attempts.map(row=>row.role)]),missingRoles=['coordinator','transcription','review'].filter(role=>!roles.has(role));
 const summaries=sources.map(({link,data,useUsage,attempts})=>({sessionId:link.sessionId,stage:link.stage,role:link.role,rolloutPath:link.rolloutPath,startedAt:link.startedAt,endedAt:link.endedAt,available:data.available,reason:data.reason??null,
  usageSource:useUsage?'session':attempts.length?'runner-fallback':'unavailable',usage:data.usage??aggregateUsage([]).usage,records:data.records.length,toolCalls:data.toolCalls,completedToolCalls:data.completedToolCalls??null,rejectedToolAttempts:data.rejectedToolAttempts??null,compactions:data.compactions,coverage:data.coverage??'unavailable',unfinished:data.unfinished.length,
  counterRegressions:data.counterRegressions??0,baselineUnavailable:data.baselineUnavailable??false,incompleteTail:data.incompleteTail??false}));
 return {version:1,...aggregateUsage(rows),records:rows.length,responseCalls:rows.filter(row=>row.kind==='response').length,cumulativeObservations:rows.filter(row=>row.kind?.includes('cumulative')).length,runnerInvocations:attempts.length,deduplicatedRunnerInvocations:covered.size,
  byStage:groupBy('stage'),byRole:groupBy('role'),sessions:summaries,toolCalls:countedSessionTools.size||toolFallback.some(value=>value!==null)||sources.some(source=>source.data.available)?countedSessionTools.size+toolFallback.reduce((sum,value)=>sum+(value??0),0):null,missingToolCounts:toolMissing,
  completedToolCalls:completedMetrics.completedToolCalls,missingCompletedToolCounts:completedMetrics.missingCompletedToolCounts,rejectedToolAttempts:rejectedMetrics.rejectedToolAttempts,missingRejectedToolCounts:rejectedMetrics.missingRejectedToolCounts,
  compactions:countedCompactions.size||compactionFallback.some(value=>value!==null)||sources.some(source=>source.data.available)?countedCompactions.size+compactionFallback.reduce((sum,value)=>sum+(value??0),0):null,missingCompactionCounts:compactionMissing,
  summedModelCallMs:knownDurations.length?knownDurations.reduce((sum,value)=>sum+value,0):null,missingModelCallDurations:durations.filter(value=>value===null).length,
  retryInvocations:attempts.filter(row=>Number(row.attempt)>1).length,byRetryReason:Object.fromEntries([...new Set(attempts.map(row=>row.retryReason))].map(reason=>[reason,attempts.filter(row=>row.retryReason===reason).length])),
  coverage:{missingRoles,unavailableSessions:sources.filter(source=>!source.data.available).length,partialSessions:sources.filter(source=>source.data.available&&source.data.coverage!=='recorded').length,unlinkedRunnerInvocations:attempts.filter(row=>!sources.some(source=>(mapped.get(source.link.id)??[]).includes(row))).length,overlapConflicts},
  intervals:sources.flatMap(source=>source.data.intervals),reviewIntervals:[...sources.filter(source=>source.link.role==='review').flatMap(source=>source.data.intervals),...attempts.filter(row=>row.role==='review'&&Number.isFinite(row.startedAt)&&Number.isFinite(row.endedAt)).map(row=>[row.startedAt,row.endedAt])],note:'Known usage across explicitly linked sessions and runner invocations, deduplicated by session/call identity. Partial sums carry unavailable counts. Legacy toolCalls retains observed session requests or runner completion events. Completed events and rejected stderr diagnostics are separate, potentially overlapping observations, not an inferred total. Timing and allowance are separate from token usage.'};
}

function exportReuseSummary(events,phases) {
 const observations=[...new Map(events.filter(event=>event.event==='export-observed').map(event=>[event.observation.id,event.observation])).values()],phaseIds=new Set(observations.map(row=>row.phaseId).filter(Boolean));
 const exports=Object.entries(phases).filter(([name])=>/export/.test(name)).flatMap(([,rows])=>rows),unobserved=exports.filter(row=>!phaseIds.has(row.id));
 return {recordedExports:observations.length,reused:observations.filter(row=>row.reused).length,generated:observations.filter(row=>!row.reused).length,unmeasuredPhases:unobserved.length,failedPhases:exports.filter(row=>!row.ok).length,
  note:'Only explicit observations with artifact/dependency evidence establish export reuse; phase presence or an existing file does not.'};
}

export function summarizeControllerEvents(runDir){
 const file=path.join(runDir,'workflow','controller-events.jsonl');if(!fs.existsSync(file))return {events:0,byKind:{},dispatchByStage:{},incompleteTail:false};
 const contents=fs.readFileSync(file,'utf8'),lines=contents.split('\n'),byKind={},dispatchByStage={},batchReasons={};let count=0,incompleteTail=false,owned=0,pending=0,batches=0,deliveredCharacters=0;
 for(let i=0;i<lines.length;i++){
  if(!lines[i].trim())continue;let row;
  try{row=JSON.parse(lines[i]);}catch(error){if(i===lines.length-1){incompleteTail=true;break;}throw error;}
  count++;byKind[row.event]=(byKind[row.event]??0)+1;
  if(row.event==='dispatch'){
   dispatchByStage[row.stage]=(dispatchByStage[row.stage]??0)+1;
   deliveredCharacters+=row.deliveredCharacters??0;
   if(row.batch){batches++;owned+=row.batch.owned;pending+=row.batch.pending;batchReasons[row.batch.reason]=(batchReasons[row.batch.reason]??0)+1;}
  }
 }
 return {events:count,byKind,dispatchByStage,incompleteTail,batching:{batches,owned,pending,reasons:batchReasons},deliveredCharacters};
}

export function buildRunReceipt(runDir) {
 const {events,incompleteTail}=readRunEvents(runDir),starts=new Map(),ends=new Map(),intervals=[],waits=[],phases={},unfinished=[];
 for(const e of events){if(e.event==='phase-started')starts.set(e.id,e);if(e.event==='phase-finished')ends.set(e.id,e);}
 for(const [id,start]of starts){const end=ends.get(id);if(!end){unfinished.push(start);continue;}const elapsedMs=end.time-start.time;
  if(start.phase==='human-wait'||start.details?.activity==='human-wait')waits.push([start.time,end.time]);
  else if(!start.details?.excludedFromActive&&!end.details?.excludedFromActive)intervals.push([start.time,end.time]);
  (phases[start.phase]??=[]).push({id,startedAt:start.at,endedAt:end.at,elapsedMs,ok:end.ok,...start.details,...end.details});}
 const attemptEvents=readAttemptEvents(path.join(runDir,'semantic-packets')),attempts=attemptEvents.events,model={...summarizeAttemptEvents(attempts),incompleteTail:attemptEvents.incompleteTail};
 const attemptStarts=new Map(attempts.filter(e=>e.event==='started').map(e=>[e.attemptId,e]));
 for(const e of attempts.filter(e=>e.event==='finished'))if(attemptStarts.has(e.attemptId))intervals.push([attemptStarts.get(e.attemptId).time,e.time]);
 const completeJob=completeJobAccounting(events,attemptCallRecords(attempts));intervals.push(...completeJob.intervals);
 const reviews=[...completeJob.reviewIntervals,...Object.entries(phases).filter(([name])=>/review/.test(name)).flatMap(([,rows])=>rows.filter(row=>!row.excludedFromActive).map(row=>[timestamp(row.startedAt),timestamp(row.endedAt)]))];
 delete completeJob.intervals;delete completeJob.reviewIntervals;
 const calendar=[...intervals,...waits];
 return {version:2,generatedAt:new Date().toISOString(),model,completeJob,phases,unfinished,incompleteTail,
  recordedActiveWallMs:unionDuration(intervals)-overlapDuration(intervals,waits),humanWaitingMs:unionDuration(waits),summedModelCallMs:completeJob.summedModelCallMs,
  recordedReviewWallMs:unionDuration(reviews)-overlapDuration(reviews,waits),
  calendarSpanMs:calendar.length?Math.max(...calendar.map(i=>i[1]))-Math.min(...calendar.map(i=>i[0])):0,
  exportReuse:exportReuseSummary(events,phases),weeklyAllowance:summarizeWeeklyUsage(events.filter(event=>event.event==='weekly-usage-observed').map(event=>event.observation)),controller:summarizeControllerEvents(runDir),
  note:'Derived only from recorded events. Active time unions completed work intervals and subtracts explicitly recorded human waiting. Concurrent model call durations are summed separately. Unrecorded/offline work, unfinished intervals and historical missing usage remain unavailable. Metrics never establish source review or visual inspection.'};
}

export function summarizeRunReceipt(receipt){
 const model=receipt.model;
 return {version:4,generatedAt:receipt.generatedAt,recordedActiveWallMs:receipt.recordedActiveWallMs,humanWaitingMs:receipt.humanWaitingMs??null,recordedReviewWallMs:receipt.recordedReviewWallMs??null,summedModelCallMs:receipt.summedModelCallMs??null,calendarSpanMs:receipt.calendarSpanMs,
  phases:Object.fromEntries(Object.entries(receipt.phases).map(([name,rows])=>[name,{runs:rows.length,failed:rows.filter(r=>!r.ok).length,elapsedMs:rows.reduce((sum,r)=>sum+r.elapsedMs,0)}])),
  model:{attempts:model.attempts,generationAttempts:model.generationAttempts,calls:model.calls,localReplays:model.localReplays,localByRetryReason:model.localByRetryReason,missingUsage:model.missingUsage,usage:model.usage,normalizedUsage:model.normalizedUsage,unavailableByMetric:model.unavailableByMetric,completedToolCalls:model.completedToolCalls,missingCompletedToolCounts:model.missingCompletedToolCounts,rejectedToolAttempts:model.rejectedToolAttempts,missingRejectedToolCounts:model.missingRejectedToolCounts,duplicateCalls:model.duplicateCalls,callElapsedMs:model.callElapsedMs,missingCallElapsedMs:model.missingCallElapsedMs,byStage:model.byStage,byAttempt:model.byAttempt,byOutcome:model.byOutcome,byRetryReason:model.byRetryReason,promptCharacters:model.promptCharacters},
  completeJob:receipt.completeJob?{...receipt.completeJob,sessions:receipt.completeJob.sessions.map(({rolloutPath,...session})=>session)}:null,exportReuse:receipt.exportReuse??null,weeklyAllowance:receipt.weeklyAllowance??null,controller:receipt.controller??null,
  unfinished:{phases:receipt.unfinished.length,attempts:model.unfinished.length},incompleteTail:receipt.incompleteTail||model.incompleteTail,note:receipt.note};
}
