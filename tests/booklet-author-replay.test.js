import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {replayAuthor} from '../scripts/booklet/semantic-packets.mjs';

test('author recovery reuses matching output but refuses changed prompts, outputs and published pages',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-author-replay-'));
 try{
  const out=path.join(dir,'page-016.author.1');fs.mkdirSync(out);
  const task={page:16,stem:'page-016',packetRoot:dir,resultFile:path.join(dir,'page-016.author.json'),prompt:'source evidence unchanged'};
  const value={pageNumber:16,sections:[],inventoryMappings:[]};
  fs.writeFileSync(path.join(out,'prompt.md'),task.prompt);
  for(const name of ['generation.json','result.json'])fs.writeFileSync(path.join(out,name),JSON.stringify(value));
  const options={runDir:dir,fromAttempt:1,attempt:2};
  const deps={assertInputs:()=>{},createTasks:()=>[task],log:()=>{},runPackets:async(o,d)=>{
   assert.equal(o.pageReplay,true);assert.equal(o.localReplay,true);
   const reply=await d.runner(task);assert.deepEqual(reply.result,value);
   assert.equal(reply.metrics.externalModelCalls,0);d.verifyPublication();return {ok:true};
  }};
  assert.deepEqual(await replayAuthor(options,deps),{ok:true});
  task.prompt='changed source';await assert.rejects(replayAuthor(options,deps),/Source prompt changed/);
  task.prompt='source evidence unchanged';fs.writeFileSync(path.join(out,'result.json'),'{}');
  await assert.rejects(replayAuthor(options,deps),/Preserved author output changed/);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(value));
  await assert.rejects(replayAuthor(options,{...deps,runPackets:async(o,d)=>{fs.writeFileSync(path.join(out,'generation.json'),'{}');d.verifyPublication();}}),/Replay source or output changed/);
  fs.writeFileSync(task.resultFile,JSON.stringify(value));await assert.rejects(replayAuthor(options,deps),/already published/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
