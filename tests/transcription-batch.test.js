import test from 'node:test';
import assert from 'node:assert/strict';
import {workerPool} from '../scripts/booklet/transcription-batch.mjs';
test('transcription pool reaches ten workers, bounds concurrency and retains failures without losing queued tasks',async()=>{
 let active=0,peak=0;const seen=[];
 const results=await workerPool(Array.from({length:16},(_,i)=>i),10,async item=>{
  active++;peak=Math.max(peak,active);seen.push(item);
  await new Promise(resolve=>setTimeout(resolve,5));active--;
  if(item===4)throw new Error('Invalid draft');return item;
 });
 assert.equal(peak,10);assert.equal(active,0);assert.equal(new Set(seen).size,16);
 assert.equal(results[4].status,'rejected');assert.equal(results[15].value,15);
 await assert.rejects(workerPool([],11,()=>{}),/Concurrency/);
});
