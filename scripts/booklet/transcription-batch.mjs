// Resumable bounded direct-input transcription. Results stay drafts for review.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadRun,assertPinnedInputs} from './transcription.mjs';
import {preparePacket} from './transcription-packet.mjs';
import {prepareDirect,executeDirect} from './transcription-direct.mjs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function concurrencyValue(value){if(!Number.isInteger(value)||value<1||value>10)throw new Error('Concurrency must be an integer from 1 to 10');return value;}
export function pendingTasks(runDir){
 const lane=path.join(runDir,'lanes/exact');
 return fs.readdirSync(lane).filter(n=>/^task-\d+\.md$/.test(n)).sort().filter(n=>!fs.existsSync(path.join(lane,n.replace('.md','.result.json')))).map(n=>({task:n.slice(0,-3),pages:json(path.join(lane,n.replace('.md','.ids.json'))).ids.map(id=>Number(id.replace('page-','')))}));
}
export async function workerPool(items,concurrency,worker){
 concurrencyValue(concurrency);let cursor=0;
 const results=Array(items.length);
 await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{
  for(;;){const index=cursor++;if(index>=items.length)return;
   try{results[index]={status:'fulfilled',value:await worker(items[index],index)};}catch(error){results[index]={status:'rejected',reason:error.message};}
  }
 }));return results;
}
export function prepareBatch(runId,output,concurrency=10){
 concurrencyValue(concurrency);const {runDir}=loadRun(runId);assertPinnedInputs(runDir);
 output=path.resolve(output);if(fs.existsSync(output))throw new Error('Choose a new batch directory; prior packets are preserved');
 fs.mkdirSync(output,{recursive:true});const tasks=[];
 for(const item of pendingTasks(runDir)){
  const packetDir=path.join(output,item.task,'packet'),directDir=path.join(output,item.task,'direct');
  preparePacket(runDir,Number(item.task.slice(5)),packetDir);
  prepareDirect(packetDir,directDir,'high');
  tasks.push({...item,directory:path.relative(output,directDir),manifestSha256:hash(path.join(directDir,'direct.json'))});
 }
 const batch={format:'mathsmap-direct-transcription-batch-v1',runDir,model:'gemini-3.8-flash-high',effort:'high',concurrency,createdAt:new Date().toISOString(),tasks};
 fs.writeFileSync(path.join(output,'batch.json'),JSON.stringify(batch,null,2),{flag:'wx'});
 return batch;
}
export async function runBatch(dir){
 dir=path.resolve(dir);const batch=json(path.join(dir,'batch.json'));
 if(batch.format!=='mathsmap-direct-transcription-batch-v1')throw new Error('Invalid batch manifest');
 concurrencyValue(batch.concurrency);assertPinnedInputs(batch.runDir);
 for(const item of batch.tasks){
  const target=path.resolve(dir,item.directory),relative=path.relative(dir,target);
  if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Task outside batch');
  if(hash(path.join(target,'direct.json'))!==item.manifestSha256)throw new Error('Task manifest changed: '+item.task);
 }
 const lock=path.join(dir,'active.lock');fs.writeFileSync(lock,JSON.stringify({pid:process.pid,at:new Date().toISOString()}),{flag:'wx'});
 let active=0,peak=0;
 try{
  const results=await workerPool(batch.tasks,batch.concurrency,async item=>{
   const taskDir=path.join(dir,item.directory);
   if(fs.existsSync(path.join(batch.runDir,'lanes/exact',item.task+'.result.json')))return {...item,status:'existing-import-result'};
   // Even failed validation may leave a useful complete draft. Never regenerate
   // it automatically on resume or overwrite edits made during review.
   const candidates=fs.readdirSync(taskDir).filter(n=>/\.(?:candidate|result)\.json$/.test(n));
   if(candidates.length)return {...item,status:'existing-draft',candidates};
   active++;peak=Math.max(peak,active);console.log(JSON.stringify({event:'start',task:item.task,pages:item.pages,active,concurrency:batch.concurrency}));
   let status='validated-draft',error=null,metrics=null;
   try{
    const out=await executeDirect(taskDir,{onProgress:event=>{if(event.event==='init')console.log(JSON.stringify({...event,task:item.task}));}});metrics=out.metrics;
   }catch(e){error=e.message;status=fs.readdirSync(taskDir).some(n=>n.endsWith('.candidate.json'))?'draft-needs-repair':'failed';
    const ledger=path.join(taskDir,'ledger.jsonl');if(fs.existsSync(ledger))metrics=JSON.parse(fs.readFileSync(ledger,'utf8').trim().split('\n').at(-1));
   }finally{active--;}
   const record={task:item.task,pages:item.pages,status,error,metrics,at:new Date().toISOString()};
   fs.appendFileSync(path.join(dir,'progress.jsonl'),JSON.stringify(record)+'\n');
   console.log(JSON.stringify({event:'complete',task:item.task,status,elapsedMs:metrics?.elapsedMs,active,error}));return record;
  });
  const summary={format:'mathsmap-direct-transcription-batch-summary-v1',concurrency:batch.concurrency,peakActive:peak,completedAt:new Date().toISOString(),results};
  fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(summary,null,2));return summary;
 }finally{fs.unlinkSync(lock);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [command,...args]=process.argv.slice(2);
 if(command==='prepare'){const b=prepareBatch(args[0],args[1],Number(args[2]??10));console.log(JSON.stringify({tasks:b.tasks.length,pages:b.tasks.flatMap(t=>t.pages),concurrency:b.concurrency}));}
 else if(command==='run'){const s=await runBatch(args[0]);console.log(JSON.stringify({attemptsFinished:true,peakActive:s.peakActive,tasks:s.results.length}));}
 else throw new Error('Use prepare RUN_ID NEW_DIR [CONCURRENCY] or run BATCH_DIR');
}
