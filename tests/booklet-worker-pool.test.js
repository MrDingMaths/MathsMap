import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {withWorkerSlot,runBoundedJobs,workerQueueTimeoutMs} from '../scripts/booklet/worker-pool.mjs';
import {runAstraTask,astraCommandArgs} from '../scripts/booklet/codex-transcription.mjs';
import {runSemanticPackets} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';

function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'astra-pool-'));t.after(()=>{assert.ok(path.resolve(directory).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(directory,{recursive:true,force:true});});return directory;}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('worker queue timeout is bounded and retains the historical default',()=>{
 assert.equal(workerQueueTimeoutMs({}),1800000);
 assert.equal(workerQueueTimeoutMs({MATHSMAP_BOOKLET_WORKER_QUEUE_TIMEOUT_MS:'7200000'}),7200000);
 for(const value of ['', ' ', '0', '-1', '1.5', 'Infinity', '43200001', 'invalid'])assert.throws(()=>workerQueueTimeoutMs({MATHSMAP_BOOKLET_WORKER_QUEUE_TIMEOUT_MS:value}),/integer from 1 to 43200000/);
});

test('process-local queue limit preserves explicit timeouts and all occupied leases',async t=>{
 const dir=fixture(t),slots=path.join(dir,'workflow','worker-slots');fs.mkdirSync(slots,{recursive:true});
 const key='MATHSMAP_BOOKLET_WORKER_QUEUE_TIMEOUT_MS',original=process.env[key];
 t.after(()=>{if(original===undefined)delete process.env[key];else process.env[key]=original;});
 process.env[key]='2000';
 const owners=Array.from({length:3},(_,i)=>JSON.stringify({id:'owner-'+i,pid:process.pid}));
 for(const [i,owner]of owners.entries())fs.writeFileSync(path.join(slots,i+'.json'),owner);
 await assert.rejects(()=>withWorkerSlot(dir,{},()=>assert.fail('Explicit timeout cannot launch a worker'),{timeoutMs:5,pollMs:2}),/All three/);
 for(const [i,owner]of owners.entries())assert.equal(fs.readFileSync(path.join(slots,i+'.json'),'utf8'),owner);
 const released=path.join(slots,'1.json'),timer=setTimeout(()=>fs.unlinkSync(released),25);
 t.after(()=>clearTimeout(timer));
 await withWorkerSlot(dir,{},lease=>{
  assert.equal(lease.slot,1);assert.ok(lease.queueWaitMs>=20);
  assert.equal(JSON.parse(fs.readFileSync(lease.file)).queueTimeoutMs,2000);
  assert.equal(fs.readFileSync(path.join(slots,'0.json'),'utf8'),owners[0]);
  assert.equal(fs.readFileSync(path.join(slots,'2.json'),'utf8'),owners[2]);
 },{pollMs:2});
 assert.deepEqual(fs.readdirSync(slots),['0.json','2.json']);
});

test('bounded queue keeps successes after a failure, preserves order and rejects duplicate ownership',async()=>{
 let active=0,peak=0;const visited=[];
 const results=await runBoundedJobs(Array.from({length:7},(_,i)=>({id:String(i)})),async job=>{
  visited.push(job.id);active++;peak=Math.max(peak,active);await delay(10);active--;if(job.id==='1')throw Error('preserved failure');return job.id;
 });
 assert.equal(peak,3);assert.equal(visited.length,7);assert.deepEqual(results.map(r=>r.id),['0','1','2','3','4','5','6']);assert.equal(results.filter(r=>r.ok).length,6);
 await assert.rejects(()=>runBoundedJobs([{id:'a'},{id:'a'}],()=>assert.fail()),/distinct/);
 await assert.rejects(()=>runBoundedJobs([],()=>{}, {concurrency:4}),/1 to 3/);
});

test('worker slots coordinate across processes and release leases after errors',async t=>{
 const dir=fixture(t),events=path.join(dir,'events.jsonl'),module=pathToFileURL(path.resolve('scripts/booklet/worker-pool.mjs')).href,script=path.join(dir,'worker.mjs');
 fs.writeFileSync(script,`import fs from 'node:fs';import {withWorkerSlot} from ${JSON.stringify(module)};await withWorkerSlot(process.argv[2],{},async()=>{fs.appendFileSync(process.argv[3],JSON.stringify({delta:1})+'\\n');await new Promise(r=>setTimeout(r,75));fs.appendFileSync(process.argv[3],JSON.stringify({delta:-1})+'\\n');});`);
 const launch=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,dir,events],{windowsHide:true,stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',s=>stderr+=s);child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(stderr)));});
 await Promise.all(Array.from({length:6},launch));
 let active=0,peak=0;for(const line of fs.readFileSync(events,'utf8').trim().split('\n')){active+=JSON.parse(line).delta;peak=Math.max(peak,active);assert.ok(active>=0);}
 assert.equal(active,0);assert.ok(peak<=3);assert.ok(peak>1);
 await assert.rejects(()=>withWorkerSlot(dir,{},()=>{throw Error('failure');}),/failure/);
 assert.deepEqual(fs.readdirSync(path.join(dir,'workflow/worker-slots')),[]);
});

test('nested runner uses its existing slot; interrupted ownership is never stolen',async t=>{
 const dir=fixture(t);
 await withWorkerSlot(dir,{},lease=>withWorkerSlot(dir,{},nested=>assert.equal(nested.id,lease.id)));
 const slots=path.join(dir,'workflow/worker-slots');for(let i=0;i<3;i++)fs.writeFileSync(path.join(slots,i+'.json'),JSON.stringify({id:'unreconciled-'+i,pid:-1}));
 await assert.rejects(()=>withWorkerSlot(dir,{},()=>assert.fail(),{timeoutMs:5,pollMs:2}),/reconcile interrupted owners/);
 assert.equal(fs.readdirSync(slots).length,3);
});

test('Windows EPERM on an existing lease preserves ownership and uses another slot',async t=>{
 const dir=fixture(t),slots=path.join(dir,'workflow','worker-slots');fs.mkdirSync(slots,{recursive:true});
 const owned=path.join(slots,'0.json'),bytes=JSON.stringify({id:'existing-owner',pid:-1});fs.writeFileSync(owned,bytes);
 const open=fs.openSync;t.mock.method(fs,'openSync',(file,flags,...args)=>{
  if(file===owned&&flags==='wx')throw Object.assign(Error('Exclusive Windows lease'),{code:'EPERM'});
  return open(file,flags,...args);
 });
 await withWorkerSlot(dir,{},lease=>{assert.equal(lease.slot,1);assert.equal(fs.readFileSync(owned,'utf8'),bytes);});
 assert.equal(fs.readFileSync(owned,'utf8'),bytes);assert.deepEqual(fs.readdirSync(slots),['0.json']);
});

test('permission failures without an existing regular lease remain errors',async t=>{
 const dir=fixture(t),slots=path.join(dir,'workflow','worker-slots'),target=path.join(slots,'0.json');
 const open=fs.openSync;t.mock.method(fs,'openSync',(file,flags,...args)=>{
  if(file===target&&flags==='wx')throw Object.assign(Error('Denied slot creation'),{code:'EPERM'});
  return open(file,flags,...args);
 });
 await assert.rejects(()=>withWorkerSlot(dir,{},()=>assert.fail('Permission error must not claim a later slot')),/Denied slot creation/);
 fs.mkdirSync(target);
 await assert.rejects(()=>withWorkerSlot(dir,{},()=>assert.fail('A directory is not an occupied lease')),/Denied slot creation/);
});

test('fresh Sol high execution fixes profile and Standard speed and preserves usage on invalid JSON',async t=>{
 const dir=fixture(t);let captured;
 const spawnProcess=(binary,args)=>{
  captured=args;const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new Writable({write(chunk,encoding,callback){callback();}});child.kill=()=>child.emit('close',1);
  setTimeout(()=>{fs.writeFileSync(args[args.indexOf('--output-last-message')+1],'invalid JSON');child.stdout.write(JSON.stringify({type:'thread.started',thread_id:'thread-fixture'})+'\n'+JSON.stringify({type:'item.completed',item:{id:'tool-1',type:'command_execution'}})+'\n'+JSON.stringify({type:'turn.completed',usage:{input_tokens:100,cached_input_tokens:80,output_tokens:10}}));child.emit('close',0);},5);return child;
 };
 await assert.rejects(()=>runAstraTask({cwd:dir,prompt:'Bounded source fixture',out:path.join(dir,'attempt'),profile:'review'},{spawnProcess}),error=>{
  assert.equal(error.metrics.sessionId,'thread-fixture');assert.equal(error.metrics.toolCalls,1);assert.equal(error.metrics.usage.output_tokens,10);assert.equal(error.metrics.effort,'high');assert.ok(error.metrics.callId);return true;
 });
 for(const profile of ['transcription','review','coordinator']){const args=astraCommandArgs({cwd:dir,raw:'result',profile});assert.equal(args[args.indexOf('--model')+1],'gpt-6-sol');assert.ok(args.includes('model_reasoning_effort="high"'));}
 assert.ok(captured.includes('--ephemeral'));assert.ok(captured.includes('--ignore-user-config'));assert.ok(captured.includes('service_tier="default"'));assert.ok(captured.includes('features.fast_mode=false'));assert.ok(captured.includes('model_reasoning_effort="high"'));
 assert.ok(astraCommandArgs({cwd:dir,raw:'result',profile:'coordinator'}).includes('model_reasoning_effort="high"'));assert.equal(captured.includes('resume'),false);
 assert.deepEqual(fs.readdirSync(path.join(dir,'workflow/worker-slots')),[]);
});

test('all booklet profiles disable nested agents and send the bounded-worker contract to the CLI',async t=>{
 const dir=fixture(t),prompt='Assigned source evidence only.\n\n{"assignment":"whole-question"}';
 for(const profile of ['transcription','review','coordinator']){
  let sent='';
  const spawnProcess=(_binary,args,options)=>{
   assert.equal(args[args.indexOf('--sandbox')+1],'read-only');assert.equal(options.shell,false);
   const overrides=args.flatMap((value,index)=>value==='-c'?[args[index+1]]:[]);
   assert.ok(overrides.includes('features.multi_agent=false'));assert.ok(overrides.includes('features.multi_agent_v2=false'));
   assert.equal(overrides.some(value=>/^features\.multi_agent(?:_v2)?=true$/.test(value)),false);
   const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new Writable({write(chunk,_encoding,done){sent+=chunk.toString();done();}});child.kill=()=>child.emit('close',1);
   child.stdin.on('finish',()=>{fs.writeFileSync(args[args.indexOf('--output-last-message')+1],'{"ok":true}');child.emit('close',0);});return child;
  };
  const reply=await runAstraTask({cwd:dir,prompt,out:path.join(dir,profile),profile},{spawnProcess});
  assert.equal(reply.result.ok,true);assert.ok(sent.endsWith('\n\n'+prompt));
  assert.match(sent,/already occupy one slot in the shared three-worker pool/);
  assert.match(sent,/Do not spawn sub-agents, delegate work, or launch another Codex CLI, model runner or model\/API call/);
  assert.match(sent,/Only the parent coordinator schedules workers/);assert.match(sent,/report the specific blocker/);
 }
 assert.deepEqual(fs.readdirSync(path.join(dir,'workflow/worker-slots')),[]);
});

function authorFixture(t,{pages=1,questions=13,continuations=[]}={}){
 const runDir=fixture(t),inventories=[];
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(let page=1;page<=pages;page++){
  const inventory={pageNumber:page,inventoried:true,entries:Array.from({length:questions},(_,i)=>({id:`p${page}-q${i}`,targetId:`q${page}-${i}`,kind:'question',description:'Solve x+1=2',expectedAnswer:'1'}))};inventories.push(inventory);
  for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,`evidence/pages/page-${String(page).padStart(3,'0')}.${ext}`),'Synthetic source');
  fs.writeFileSync(path.join(runDir,`semantic-packets/page-${String(page).padStart(3,'0')}.inventory.json`),JSON.stringify(inventory));
 }
 return {runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:inventories.map(i=>i.pageNumber),pipelinePolicy:'pdf-import-efficient-v1',continuations},config:{title:'Algebra',topics:[{id:'algebra',title:'Algebra',start:1,end:pages}]},stage:'author',pages:inventories.map(i=>i.pageNumber)};
}
function reply(prompt){const context=JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n')+2)),a=context.assignment;
 return {result:{packets:a.pages.map(page=>{const entries=a.inventory.filter(e=>e.pageNumber===page);return {pageNumber:page,sections:[{id:a.id+'-'+page,title:'Algebra',phase:'practice',blocks:entries.map(e=>({id:e.targetId+'-block',type:'question',content:{id:e.targetId,type:'question',prompt:'Solve x+1=2.',answer:{short:'1',worked:'x=1'}}}))}],inventoryMappings:entries.map(e=>({inventoryId:e.id,targetId:e.targetId}))};})},metrics:{usage:{input_tokens:10,output_tokens:5}}};
}
test('a single dense page fills three slots and resumes without model calls',async t=>{
 const options=authorFixture(t);let active=0,peak=0,calls=0;
 const runner=async({prompt})=>{calls++;active++;peak=Math.max(peak,active);await delay(20);active--;return reply(prompt);};
 const result=await runSemanticPackets(options,{runner,log:()=>{}});assert.equal(result.ok,true,JSON.stringify(result));assert.equal(calls,4);assert.equal(peak,3);
 const again=await runSemanticPackets(options,{runner:()=>assert.fail('Cache caused model call'),log:()=>{}});assert.equal(again.ok,true);
});
test('one continued activity is generated once and both canonical pages publish',async t=>{
 const options=authorFixture(t,{pages:2,questions:1,continuations:[[1,2]]});let calls=0;
 const result=await runSemanticPackets(options,{runner:async({prompt})=>{calls++;return reply(prompt);},log:()=>{}});
 assert.equal(result.ok,true,JSON.stringify(result));assert.equal(calls,1);assert.equal(result.pages.length,2);
});
