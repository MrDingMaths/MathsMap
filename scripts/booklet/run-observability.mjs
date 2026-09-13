import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readAttemptReceipt} from './semantic-run-metrics.mjs';
import {createHash} from 'node:crypto';

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
    if(error.code!=='EEXIST')throw error;
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
}
const union=intervals=>{let end=-Infinity,total=0;for(const [a,b]of intervals.sort((a,b)=>a[0]-b[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return total;};

export function buildRunReceipt(runDir) {
 const {events,incompleteTail}=readRunEvents(runDir),starts=new Map(),ends=new Map(),intervals=[],phases={},unfinished=[];
 for(const e of events){if(e.event==='phase-started')starts.set(e.id,e);if(e.event==='phase-finished')ends.set(e.id,e);}
 for(const [id,start]of starts){const end=ends.get(id);if(!end){unfinished.push(start);continue;}const elapsedMs=end.time-start.time;if(!end.details?.excludedFromActive)intervals.push([start.time,end.time]);(phases[start.phase]??=[]).push({id,startedAt:start.at,endedAt:end.at,elapsedMs,ok:end.ok,...start.details,...end.details});}
 const attemptFile=path.join(runDir,'semantic-packets','attempt-events.jsonl'),attempts=[];
 if(fs.existsSync(attemptFile))for(const line of fs.readFileSync(attemptFile,'utf8').split('\n'))if(line){try{attempts.push(JSON.parse(line));}catch{/* The semantic receipt reports an incomplete tail. */}}
 const attemptStarts=new Map(attempts.filter(e=>e.event==='started').map(e=>[e.attemptId,e]));
 for(const e of attempts.filter(e=>e.event==='finished'))if(attemptStarts.has(e.attemptId))intervals.push([attemptStarts.get(e.attemptId).time,e.time]);
 return {version:1,generatedAt:new Date().toISOString(),model:readAttemptReceipt(path.join(runDir,'semantic-packets')),phases,unfinished,incompleteTail,
  recordedActiveWallMs:union(intervals),calendarSpanMs:intervals.length?Math.max(...intervals.map(i=>i[1]))-Math.min(...intervals.map(i=>i[0])):0,
  note:'Derived only from recorded events. Active time is the union of completed work intervals; overlapping phases count once. Unrecorded/offline work, unresolved review sessions and historical missing usage remain unavailable. Readiness, render checks and actual visual inspection are separate evidence.'};
}
