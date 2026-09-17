// One run shares three model workers, including independent CLI processes.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {AsyncLocalStorage} from 'node:async_hooks';
const leaseContext=new AsyncLocalStorage();

export const MAX_ASTRA_WORKERS=3;
export function workerConcurrency(value=MAX_ASTRA_WORKERS){
 const n=Number(value);
 if(!Number.isInteger(n)||n<1||n>MAX_ASTRA_WORKERS)throw Error('Worker concurrency must be an integer from 1 to 3');
 return n;
}

export async function withWorkerSlot(runDir,details,action,{timeoutMs=1800000,pollMs=50,signal}={}){
 const directory=path.resolve(runDir,'workflow','worker-slots');
 const inherited=leaseContext.getStore();
 if(inherited?.directory===directory)return action(inherited);
 fs.mkdirSync(directory,{recursive:true});
 const waitingAt=Date.now(),id=randomUUID();let lease;
 while(!lease){
  signal?.throwIfAborted();
  for(let slot=0;slot<MAX_ASTRA_WORKERS;slot++){
   const file=path.join(directory,slot+'.json');let fd;
   try{fd=fs.openSync(file,'wx');}catch(error){if(error.code==='EEXIST')continue;throw error;}
   try{fs.writeSync(fd,JSON.stringify({...details,id,pid:process.pid,startedAt:new Date().toISOString()}));}
   catch(error){fs.closeSync(fd);fs.unlinkSync(file);throw error;}
   fs.closeSync(fd);lease={file,id,slot,directory,queueWaitMs:Date.now()-waitingAt};break;
  }
  if(lease)break;
  if(Date.now()-waitingAt>=timeoutMs)throw Error('All three Astra worker slots are busy. Inspect workflow/worker-slots and reconcile interrupted owners before resuming; leases are never stolen.');
  await new Promise(resolve=>setTimeout(resolve,pollMs));
 }
 try{return await leaseContext.run(lease,()=>action(lease));}
 finally{
  // A changed lease belongs to another owner and must never be removed.
  if(fs.existsSync(lease.file)&&JSON.parse(fs.readFileSync(lease.file,'utf8')).id===id)fs.unlinkSync(lease.file);
 }
}

// Every queued item runs once. Failed items do not discard independent successes.
export async function runBoundedJobs(jobs,action,{concurrency=MAX_ASTRA_WORKERS}={}){
 concurrency=workerConcurrency(concurrency);
 const ids=new Set();for(const job of jobs){if(!job.id||ids.has(job.id))throw Error('Jobs need distinct ownership IDs');ids.add(job.id);}
 const results=new Array(jobs.length);let cursor=0;
 await Promise.all(Array.from({length:Math.min(concurrency,jobs.length)},async()=>{
  while(cursor<jobs.length){const i=cursor++,job=jobs[i];
   try{results[i]={id:job.id,ok:true,result:await action(job)};}
   catch(error){results[i]={id:job.id,ok:false,error};}
  }
 }));
 return results;
}
