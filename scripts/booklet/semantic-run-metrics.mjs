// Append-only attempt events survive validation failures and interrupted runs.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

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
 const usage={},phases={},unfinished=[],intervals=[];let calls=0,missingUsage=0,callElapsedMs=0;
 for(const [attemptId,rows] of attempts){
  const start=rows.find(e=>e.event==='started'),finish=rows.findLast(e=>e.event==='finished');
  if(start&&finish)intervals.push([start.time,finish.time]);
  if(!finish)unfinished.push({attemptId,stage:start?.stage,page:start?.page,attempt:start?.attempt,lastEvent:rows.at(-1)});
  const generation=rows.find(e=>e.event==='phase-started'&&e.phase==='generation');
  if(generation){
   calls++;
   const metrics=rows.findLast(e=>e.event==='phase-finished'&&e.phase==='generation')?.metrics??finish?.metrics;
   if(!metrics?.usage)missingUsage++;
   for(const [key,value] of Object.entries(metrics?.usage??{}))if(typeof value==='number')usage[key]=(usage[key]??0)+value;
   callElapsedMs+=metrics?.elapsedMs??0;
  }
  for(const e of rows.filter(e=>e.event==='phase-finished'))phases[e.phase]=(phases[e.phase]??0)+e.elapsedMs;
 }
 // Union of completed attempt intervals, never the sum of concurrent durations.
 let activeWallMs=0,end=-Infinity;
 for(const [a,b] of intervals.sort((a,b)=>a[0]-b[0])){activeWallMs+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}
 return {version:1,attempts:attempts.size,calls,missingUsage,usage,callElapsedMs,phaseElapsedMs:phases,completedAttemptActiveWallMs:activeWallMs,unfinished,
  note:'Usage is incomplete when unavailable; cached input is a subset of input. Phase sums are not wall time. Active wall time covers completed runner attempts only; review, render, offline work and unfinished intervals are excluded.'};
}

export function readAttemptReceipt(packetRoot) {
 const file=path.join(packetRoot,'attempt-events.jsonl');
 const text=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 const lines=text.split('\n'),events=[];let incompleteTail=false;
 for(let i=0;i<lines.length;i++){
  if(!lines[i].trim())continue;
  try{events.push(JSON.parse(lines[i]));}catch(error){if(i===lines.length-1){incompleteTail=true;break;}throw error;}
 }
 return {...summarizeAttemptEvents(events),incompleteTail};
}
