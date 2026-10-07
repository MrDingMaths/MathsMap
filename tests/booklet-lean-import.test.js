import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runLeanImportPool} from '../scripts/booklet/lean-import.mjs';
import {createRelayRunner} from '../scripts/booklet/relay-runner.mjs';
import {transcriptionConfiguration,requireCurrentTranscription} from '../scripts/booklet/transcription-settings.mjs';
import {runAstraTask} from '../scripts/booklet/codex-transcription.mjs';
import {snapshotDifferences,prepareVerificationSnapshot,exportWithFrozenRuntime,startFrozenVerificationServer} from '../scripts/booklet/import-verification-runtime.mjs';
import {nextBoundedWork,prepareBoundedStage,cancelBoundedStage,recordBoundedStage} from '../scripts/booklet/bounded-stages.mjs';
import {loadWorkflow,updateWorkflow,bytesHash,fingerprint} from '../scripts/booklet/workflow-review.mjs';
import {PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-booklet-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const write=(dir,name,value)=>{const f=path.join(dir,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof value==='string'?value:JSON.stringify(value));return f;};
const ref=f=>({path:f,hash:bytesHash(f)});
test('pool gives each booklet three workers and leases its run rather than the shared pool',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run-a')},{runDir:path.join(dir,'run-b')}],done=new Set(),started=[],finished=[];let active=0,maximum=0;
 const next=async o=>({active:[],blockers:[],jobs:Array.from({length:3},(_,i)=>({id:path.basename(o.runDir)+i,stage:'visual',visualConcurrency:3,ownershipIds:['render:'+i],done:done.has(path.basename(o.runDir)+i),blockers:[]}))});
 const counts=new Map(),peaks=new Map();
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),next,lease:async(directory,details,action)=>{assert.equal(directory,details.runDir);return action();},run:async(o,id)=>{started.push(id);const count=(counts.get(o.runDir)??0)+1;counts.set(o.runDir,count);peaks.set(o.runDir,Math.max(peaks.get(o.runDir)??0,count));maximum=Math.max(maximum,++active);await new Promise(r=>setTimeout(r,id==='run-a0'?80:8));active--;counts.set(o.runDir,counts.get(o.runDir)-1);done.add(id);finished.push(id);return {ok:true};}});
 assert.equal(result.completed,6);assert.equal(maximum,6);assert.deepEqual([...peaks.values()],[3,3]);assert.ok(finished.indexOf('run-b0')<finished.indexOf('run-a0'));
});
test('pool drains successful work and preserves failures without automatic retries',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run')}],done=new Set();let calls=0;
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),next:async()=>({active:[],jobs:[0,1,2,3].map(i=>({id:'j'+i,stage:'visual',visualConcurrency:3,blockers:[],done:done.has('j'+i)}))}),lease:async(_d,_i,a)=>a(),recover:async()=>({}),run:async(_o,id)=>{calls++;await new Promise(r=>setTimeout(r,id==='j0'?2:15));if(id==='j0')throw Error('Retained failure');done.add(id);return {ok:true};}});
 assert.equal(result.status,'needs-repair');assert.equal(calls,3);assert.equal(result.completed,2);assert.ok(fs.readFileSync(result.eventsFile,'utf8').includes('Retained failure'));
});

test('active-time checkpoints run while a worker is still awaiting its result',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run')}];let done=false,checkedDuringWork=false;
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),checkpointIntervalMs:5,checkpoint:async()=>{if(!done)checkedDuringWork=true;},next:async()=>({active:[],jobs:[{id:'slow',stage:'assessment',done,blockers:[]}]}),lease:async(_d,_i,a)=>a(),run:async()=>{await new Promise(r=>setTimeout(r,25));done=true;return {ok:true};}});
 assert.equal(result.completed,1);assert.equal(checkedDuringWork,true);
});
test('pool refuses existing source workers and unresolved stage claims',async t=>{
 const dir=temp(t),runDir=path.join(dir,'run');write(runDir,'workflow/worker-slots/0.json',{pid:123});
 await assert.rejects(runLeanImportPool([{runDir}],{poolDir:path.join(dir,'pool'),next:async()=>({active:[],jobs:[]})}),/existing source worker/);
 await assert.rejects(runLeanImportPool([{runDir:path.join(dir,'other')}],{poolDir:path.join(dir,'pool'),next:async()=>({active:[{id:'held',blockedResult:true}],jobs:[]})}),/reconcile existing owner/);
});

test('a completed result made stale by a sibling decision is released without credit, other failures still stop adoption',async t=>{
 const dir=temp(t),runDir=path.join(dir,'run'),ticket=write(runDir,'workflow/stages/job/claim/request.json',{});write(runDir,'workflow/stages/job/claim/generation.json',{outcome:'passed'});
 const claim={id:'claim',jobId:'job',ticket:{path:ticket,hash:'x'}};let planned=0,cancelled;
 const next=async()=>({active:planned++?[]:[claim],blockers:[],jobs:[]});
 const result=await runLeanImportPool([{runDir}],{poolDir:path.join(dir,'pool'),next,record:async()=>{throw Error('Result is stale: dependencies changed');},cancel:async(_o,input)=>{cancelled=input;return {ok:true};}});
 assert.ok(/stale/.test(cancelled.reason)&&cancelled.ticket.path===ticket);assert.equal(result.status,'handoff');
 const events=fs.readFileSync(result.eventsFile,'utf8').split(String.fromCharCode(10)).filter(Boolean).map(l=>JSON.parse(l));
 assert.ok(events.some(e=>e.event==='stale-released'&&e.inspectionCredited===false&&e.jobId==='job'));
 planned=0;await assert.rejects(runLeanImportPool([{runDir}],{poolDir:path.join(dir,'pool2'),next,record:async()=>{throw Error('Disk full');},cancel:async()=>assert.fail('Only stale results are released')}),/Disk full/);
});
test('restart requires diagnosis before a third unchanged failure and planning errors drain active jobs',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run')}],poolDir=path.join(dir,'pool');let calls=0;
 const options={poolDir,next:async()=>({active:[],jobs:[{id:'j',dependencyHash:'fixed',stage:'assessment',blockers:[],done:false}]}),lease:async(_d,_i,a)=>a(),recover:async()=>({}),run:async()=>{calls++;throw Error('Same failure');}};
 await runLeanImportPool(runs,options);await runLeanImportPool(runs,options);
 const held=await runLeanImportPool(runs,options);assert.equal(held.dispatched,0);assert.equal(held.ok,false);assert.equal(calls,2);
 await runLeanImportPool(runs,{...options,retryDiagnosis:'Input format corrected and checked.'});assert.equal(calls,3);
 let active=0,plans=0;
 await assert.rejects(runLeanImportPool(runs,{poolDir:path.join(dir,'other-pool'),next:async()=>{if(++plans>2)throw Error('Planning failed');return {active:[],jobs:[{id:'waiting',stage:'assessment',blockers:[]}]};},lease:async(_d,_i,a)=>a(),run:async()=>{active++;await new Promise(r=>setTimeout(r,20));active--;return {ok:true};}}),/Planning failed/);assert.equal(active,0);
});
test('verification snapshot captures uncommitted bytes and reports exact changed files',t=>{
 const root=temp(t);write(root,'src/main.js','uncommitted source');write(root,'index.html','<html>');write(root,'node_modules/fixture.js','dependency');
 const out=path.join(root,'.booklet-work/test'),manifest=prepareVerificationSnapshot({root,out});assert.equal(fs.readFileSync(path.join(manifest.snapshot,'src/main.js'),'utf8'),'uncommitted source');assert.deepEqual(snapshotDifferences(root,manifest.files),[]);
 assert.equal(prepareVerificationSnapshot({root,out}).snapshot,manifest.snapshot);write(root,'src/main.js','changed');assert.deepEqual(snapshotDifferences(root,manifest.files),['src/main.js']);assert.throws(()=>prepareVerificationSnapshot({root,out}),/src\/main.js/);
 assert.throws(()=>prepareVerificationSnapshot({root,out:path.join(root,'src/bad')}),/separate local/);
 write(root,'src/new.js','new dependency');assert.deepEqual(snapshotDifferences(root,manifest.files),['src/main.js','src/new.js']);
});

test('actual frozen Vite server isolates plugin cwd, watching and live source changes',async t=>{
 const parent=path.resolve('.booklet-work/lean-import-implementation');fs.mkdirSync(parent,{recursive:true});const root=fs.mkdtempSync(path.join(parent,'server-fixture-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 write(root,'index.html','<html><body>Frozen fixture</body></html>');write(root,'vite.config.js',"export default {server:{open:true,watch:{ignored:['**/.booklet-work/**']}}}");
 fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),process.platform==='win32'?'junction':'dir');
 const out=path.join(root,'.booklet-work/server'),manifest=prepareVerificationSnapshot({root,out}),server=await startFrozenVerificationServer(manifest,out);
 try{assert.equal(server.info.cwd,manifest.snapshot);assert.equal(server.info.watch,null);assert.equal(server.info.hmr,false);write(root,'index.html','<html><body>Changed live fixture</body></html>');const response=await fetch('http://127.0.0.1:'+server.info.port);assert.equal(response.status,200);const html=await response.text();assert.match(html,/Frozen fixture/);assert.doesNotMatch(html,/Changed live fixture/);
  // Dependency files reached through the node_modules junction (fonts, libraries) stay readable.
  assert.equal((await fetch('http://127.0.0.1:'+server.info.port+'/node_modules/vite/package.json')).status,200);}finally{await server.close();}
});
test('frozen exports close their server, retain failed editions and diagnose before a third attempt',async t=>{
 const root=temp(t);write(root,'src/main.js','stable');write(root,'vite.config.js','export default {}');write(root,'node_modules/fixture.js','dependency');write(root,'booklets/projects/book.json',{id:'book'});
 const out=path.join(root,'.booklet-work/exports');let closes=0,calls=0;
 const server=()=>({listen:async()=>{},httpServer:{address:()=>({port:9000})},close:async()=>{closes++;}});
 const args={root,out,projectId:'book',runDir:path.join(root,'.booklet-work/run'),createServer:async()=>server(),execute:async({args})=>{calls++;assert.ok(args.includes('--fresh-edition-document'));write(out,'passed-student.pdf','retained PDF bytes');return 1;}};
 await assert.rejects(exportWithFrozenRuntime(args),/Export failed/);await assert.rejects(exportWithFrozenRuntime(args),/Export failed/);assert.equal(calls,2);assert.equal(closes,2);assert.equal(fs.readFileSync(path.join(out,'passed-student.pdf'),'utf8'),'retained PDF bytes');
 await assert.rejects(exportWithFrozenRuntime(args),/third attempt/);assert.equal(calls,2);
 const receipt=await exportWithFrozenRuntime({...args,regenerationReason:'Isolated missing-document cause; fresh document path fixed.',execute:async()=>0});assert.equal(receipt.visualAcceptance,false);assert.equal(closes,3);
});

test('a failure pauses only its own run while another booklet finishes and corrections publish in place',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'bad')},{runDir:path.join(dir,'good')}],done=new Set(),published=[];let plans=0;
 const next=async o=>{plans++;const name=path.basename(o.runDir);return {active:[],blockers:[],jobs:[0,1].map(i=>({id:name+i,stage:'assessment',ownershipIds:['question:'+name+i],done:done.has(name+i),blockers:[]}))};};
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),concurrency:1,next,lease:async(_d,_i,a)=>a(),recover:async()=>({}),publish:async(_o,r)=>{published.push(r.id);},run:async(_o,id)=>{if(id==='bad0')throw Error('Review failed');done.add(id);return id==='good0'?{ok:true,id,next:'Propagate approved corrections'}:{ok:true,id};}});
 assert.equal(result.status,'needs-repair');assert.deepEqual([...done].sort(),['good0','good1']);assert.deepEqual(published,['good0']);
 assert.equal(result.plans.find(p=>p.runDir.endsWith('bad')).stopped,'needs-repair');assert.equal(result.plans.find(p=>p.runDir.endsWith('good')).stopped,null);
 const events=fs.readFileSync(result.eventsFile,'utf8').split(String.fromCharCode(10)).filter(Boolean).map(l=>JSON.parse(l));assert.ok(events.every(e=>Number.isInteger(e.activeWorkers)));
});
test('low reasoning can be recorded for new imports while historical medium stays unchanged',()=>{
 const configuration=transcriptionConfiguration({reasoningOverride:{effort:'low',reason:'User-approved future model preference'}});
 assert.equal(configuration.effort,'low');assert.doesNotThrow(()=>requireCurrentTranscription(configuration));
 assert.equal(transcriptionConfiguration().effort,'medium');
 assert.throws(()=>transcriptionConfiguration({reasoningOverride:{effort:'low'}}),/recorded user-request reason/);
});
test('benchmark arms are explicit, recorded and never reach the Codex runner',async t=>{
 const arm={benchmarkArm:{id:'claude-sonnet-5-5-relay',reason:'User-requested Sonnet benchmark'}},configuration=transcriptionConfiguration(arm);
 assert.equal(configuration.model,'claude-sonnet-5-5');assert.equal(configuration.provider,'claude-subagent');assert.doesNotThrow(()=>requireCurrentTranscription({...configuration}));
 assert.throws(()=>transcriptionConfiguration({benchmarkArm:{id:'unknown',reason:'x'}}),/Benchmark arm/);assert.throws(()=>transcriptionConfiguration({benchmarkArm:{id:'claude-sonnet-5-5-relay'}}),/Benchmark arm/);
 assert.equal(transcriptionConfiguration().model,'gpt-6.1-sol');assert.throws(()=>requireCurrentTranscription({provider:'codex',model:'claude-sonnet-5-5',effort:'medium'}),/Sol 6.1 medium/);
 const dir=temp(t);await assert.rejects(runAstraTask({cwd:dir,prompt:'x',out:path.join(dir,'o'),configuration}),/relay runner/);
});
test('relay runner delivers the canonical prompt and images, records the actual model and refuses production runs',async t=>{
 const dir=temp(t),runDir=path.join(dir,'run'),relayDir=path.join(dir,'relay'),out=path.join(runDir,'job','codex');
 write(runDir,'manifest.json',transcriptionConfiguration({benchmarkArm:{id:'claude-sonnet-5-5-relay',reason:'User-requested Sonnet benchmark'}}));
 const pending=createRelayRunner({relayDir,pollMs:5})({runDir,cwd:runDir,prompt:'Canonical prompt',images:['a.png','a.png'],out,profile:'review',job:{id:'j',stage:'assessment'}});
 let request;for(let i=0;i<200&&!request;i++){const names=fs.readdirSync(path.join(relayDir,'pending'));if(names.length)request=JSON.parse(fs.readFileSync(path.join(relayDir,'pending',names[0]),'utf8'));else await new Promise(r=>setTimeout(r,5));}
 assert.ok(fs.readFileSync(request.promptFile,'utf8').endsWith('Canonical prompt'));assert.deepEqual(request.images,['a.png']);assert.equal(request.stage,'assessment');
 fs.writeFileSync(request.responseFile,'{"records":');await new Promise(r=>setTimeout(r,20));fs.writeFileSync(request.responseFile,'{"records":[]}');
 const reply=await pending;assert.deepEqual(reply.result,{records:[]});assert.equal(reply.metrics.model,'claude-sonnet-5-5');assert.equal(reply.metrics.usage,null);assert.equal(reply.metrics.externalModelCalls,1);
 assert.equal(fs.readdirSync(path.join(relayDir,'pending')).length,0);assert.equal(fs.readdirSync(path.join(relayDir,'done')).length,1);
 const production=path.join(dir,'production');write(production,'manifest.json',transcriptionConfiguration());
 await assert.rejects(createRelayRunner({relayDir})({runDir:production,prompt:'x',out:path.join(production,'o')}),/benchmark arms only/);
});
