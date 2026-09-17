// Append-only attempt events survive validation failures and interrupted runs.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {aggregateUsage,normalizeUsage,timestamp,unionDuration} from './session-usage.mjs';

export function recordAttempt(packetRoot, identity, {now=Date.now}={}) {
 const attemptId=randomUUID(),started=now(),file=path.join(packetRoot,'attempt-events.jsonl');
 if(fs.existsSync(file)&&fs.statSync(file).size){
  const fd=fs.openSync(file,'r'),last=Buffer.alloc(1);
  try{fs.readSync(fd,last,0,1,fs.fstatSync(fd).size-1);}finally{fs.closeSync(fd);}
  if(last[0]!==10)throw Error('Attempt event log has an incomplete tail; preserve and reconcile it before starting another attempt');
 }
 const write=(event,details={})=>{const time=now();fs.appendFileSync(file,JSON.stringify({...identity,attemptId,event,at:new Date(time).toISOString(),time,...details})+'\n');return time;};
 write('started');
 let phase=null,phaseStart=null;
 return {
  phase(name,details={}){phase=name;phaseStart=write('phase-started',{phase,...details});},
  end(details={}){write('phase-finished',{phase,elapsedMs:now()-phaseStart,...details});phase=null;},
  finish(details){const failedPhase=details.ok?null:phase;if(phase)write('phase-finished',{phase,ok:false,elapsedMs:now()-phaseStart,metrics:phase==='generation'?details.metrics:undefined});write('finished',{...details,failedPhase,attemptElapsedMs:now()-started});},
 };
}

export function summarizeAttemptEvents(events) {
 const attempts=new Map();
 for(const e of events){if(!attempts.has(e.attemptId))attempts.set(e.attemptId,[]);attempts.get(e.attemptId).push(e);}
 const usage={},phases={},unfinished=[],intervals=[],byStage={},byOutcome={},byAttempt={},byRetryReason={},promptCharacters={},localByRetryReason={},seenCalls=new Set();let calls=0,missingUsage=0,callElapsedMs=0,generationAttempts=0,localReplays=0,duplicateCalls=0,missingCallElapsedMs=0;
 for(const [attemptId,rows] of attempts){
  const start=rows.find(e=>e.event==='started'),finish=rows.findLast(e=>e.event==='finished');
  if(start&&finish)intervals.push([start.time,finish.time]);
  if(!finish)unfinished.push({attemptId,stage:start?.stage,page:start?.page,attempt:start?.attempt,lastEvent:rows.at(-1)});
  const generation=rows.find(e=>e.event==='phase-started'&&e.phase==='generation');
  if(generation){
   generationAttempts++;
   const metrics=rows.findLast(e=>e.event==='phase-finished'&&e.phase==='generation')?.metrics??finish?.metrics;
   const local=metrics?.externalModelCalls===0;
   if(local){localReplays++;const reason=start?.retryReason??'unrecorded';localByRetryReason[reason]=(localByRetryReason[reason]??0)+1;}
   else if(seenCalls.has(attemptCallIdentity(attemptId,metrics,start))){duplicateCalls++;}
   else{
   seenCalls.add(attemptCallIdentity(attemptId,metrics,start));
   calls++;
   const outcome=!finish?'unfinished':finish.ok?'passed':'failed';
   const repeated=Number(start?.attempt)>1;
   for(const [groups,key] of [[byStage,start?.stage??'unknown'],[byOutcome,outcome],[byAttempt,repeated?'repeat':'first'],[byRetryReason,repeated?(start?.retryReason??(start?.repairFrom?'mapping-repair':'unrecorded')):'initial']]){
    const group=groups[key]??={calls:0,missingUsage:0,usage:{},callElapsedMs:0};group.calls++;
    if(!metrics?.usage)group.missingUsage++;
    for(const [name,value] of Object.entries(metrics?.usage??{}))if(typeof value==='number'&&Number.isFinite(value))group.usage[name]=(group.usage[name]??0)+value;
    group.callElapsedMs+=metrics?.elapsedMs??0;
   }
   for(const [name,value] of Object.entries(start?.promptStats?.sections??{}))if(Number.isFinite(value))promptCharacters[name]=(promptCharacters[name]??0)+value;
   if(!metrics?.usage)missingUsage++;
   for(const [key,value] of Object.entries(metrics?.usage??{}))if(typeof value==='number')usage[key]=(usage[key]??0)+value;
   if(typeof metrics?.elapsedMs!=='number'||!Number.isFinite(metrics.elapsedMs)||metrics.elapsedMs<0)missingCallElapsedMs++;else callElapsedMs+=metrics.elapsedMs;
   }
  }
  for(const e of rows.filter(e=>e.event==='phase-finished'))phases[e.phase]=(phases[e.phase]??0)+e.elapsedMs;
 }
 // Union of completed attempt intervals, never the sum of concurrent durations.
 const records=attemptCallRecords(events),measured=aggregateUsage(records);
 return {version:4,attempts:attempts.size,generationAttempts,calls,localReplays,localByRetryReason,missingUsage,usage,normalizedUsage:measured.usage,unavailableByMetric:measured.unavailableByMetric,callElapsedMs,missingCallElapsedMs,duplicateCalls,byStage,byOutcome,byAttempt,byRetryReason,promptCharacters,phaseElapsedMs:phases,completedAttemptActiveWallMs:unionDuration(intervals),unfinished,
  note:'Calls and prompt characters count external model generation only. Explicit zero-call local replays are separate and do not imply missing usage. Other unavailable usage remains unknown; cached input is a subset of input. Phase sums are not wall time. Active wall time covers completed runner attempts only; review, render, offline work and unfinished intervals are excluded.'};
}

function attemptCallIdentity(attemptId,metrics,start) {
 const sessionId=metrics?.sessionId??start?.sessionId,callId=metrics?.callId??start?.callId;
 return callId?'call:'+(sessionId??'unknown-session')+':'+callId:'attempt:'+attemptId;
}

// One row per external generation invocation. Usage is an invocation total, not
// necessarily one response: a linked session can provide finer response records.
export function attemptCallRecords(events) {
 const attempts=new Map(),records=new Map();
 for(const event of events){if(!attempts.has(event.attemptId))attempts.set(event.attemptId,[]);attempts.get(event.attemptId).push(event);}
 for(const [attemptId,rows]of attempts){
  const start=rows.find(row=>row.event==='started'),generation=rows.find(row=>row.event==='phase-started'&&row.phase==='generation');
  if(!generation)continue;
  const finish=rows.findLast(row=>row.event==='finished'),end=rows.findLast(row=>row.event==='phase-finished'&&row.phase==='generation'),metrics=end?.metrics??finish?.metrics;
  if(metrics?.externalModelCalls===0)continue;
  const id=attemptCallIdentity(attemptId,metrics,start);if(records.has(id))continue;
  const measured=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
  const started=timestamp(metrics?.startedAt)??timestamp(generation.time),ended=timestamp(metrics?.endedAt)??timestamp(end?.time);
  records.set(id,{id,attemptId,sessionId:metrics?.sessionId??start?.sessionId??null,callId:metrics?.callId??start?.callId??null,stage:start?.stage??metrics?.stage??'unknown',role:metrics?.role??(metrics?.profile==='review'?'review':'transcription'),
   attempt:start?.attempt??null,retryReason:Number(start?.attempt)>1?(start?.retryReason??(start?.repairFrom?'mapping-repair':'unrecorded')):'initial',outcome:!finish?'unfinished':finish.ok?'passed':'failed',
   usage:normalizeUsage(metrics?.usage),elapsedMs:measured(metrics?.elapsedMs),toolCalls:measured(metrics?.toolCalls),compactions:measured(metrics?.compactions),startedAt:started,endedAt:ended,kind:'runner-invocation'});
 }
 return [...records.values()];
}

export function readAttemptEvents(packetRoot) {
 const file=path.join(packetRoot,'attempt-events.jsonl');
 const text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 const lines=text.split('\n'),events=[];let incompleteTail=false;
 for(let i=0;i<lines.length;i++){
  if(!lines[i].trim())continue;
  try{events.push(JSON.parse(lines[i]));}catch(error){if(i===lines.length-1){incompleteTail=true;break;}throw error;}
 }
 return {events,incompleteTail};
}

export function readAttemptReceipt(packetRoot) {const {events,incompleteTail}=readAttemptEvents(packetRoot);return {...summarizeAttemptEvents(events),incompleteTail};}
