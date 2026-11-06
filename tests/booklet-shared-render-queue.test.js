import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRenderQueue,fileHash,requestHash,HOST_LIMIT,MIN_FREE_MEMORY,MIN_FREE_DISK} from '../scripts/booklet/shared-render-queue.mjs';

const core=pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)),'../scripts/booklet/shared-render-queue.mjs')).href;
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');
function fixture(t,ports={}){
 const tempParent=fs.realpathSync(os.tmpdir()),dir=fs.mkdtempSync(path.join(tempParent,'mathsmap-renderqueue-tests-'));
 t.after(()=>{const resolved=fs.realpathSync(dir);assert.equal(path.dirname(resolved),tempParent);assert.match(path.basename(resolved),/^mathsmap-renderqueue-tests-/);fs.rmSync(resolved,{recursive:true});});
 const queueRoot=path.join(dir,'queue'),clock={value:Date.now()},living={value:true};
 let resources={allowed:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK},runtimeFailure=null;
 const live=path.join(dir,'live.json');write(live,{id:'fixture-project',revision:7,note:'preserve unrelated content'});
 const verifyClosure=({jobDir,manifest,token})=>{const p=JSON.parse(fs.readFileSync(path.join(jobDir,'closure-proof.json')));assert.equal(p.manifestHash,fileHash(path.join(jobDir,'manifest.json')));assert.equal(p.jobId,path.basename(jobDir));assert.equal(p.browserClosed,true);assert.equal(p.serverClosed,true);assert.equal(p.pinVerified,true);return p;};
 const options={queueRoot,admit:()=>resources,verifyRuntime:()=>{if(runtimeFailure)throw Error(runtimeFailure);},verifyClosure,isAlive:()=>living.value,now:()=>clock.value,identity:()=>({pid:process.pid,fixtureIdentity:dir})};
 const q=createRenderQueue({...options,...ports});
 let sequence=0;
 function enqueue(extra={}){const n=++sequence,baseline=path.join(dir,`baseline-${n}.json`),candidate=path.join(dir,`candidate-${n}.json`);write(baseline,{id:'fixture-project',revision:7,code:'before'});write(candidate,{id:'fixture-project',revision:7,code:'after'});const request={kind:'pinned-feedback-render-v1',owner:'fixture-coordinator',candidateInput:'candidate',baselineInput:'baseline',inputHashes:{baseline:fileHash(baseline),candidate:fileHash(candidate)},runtime:{pinHash:'fixture-pin',cache:'fixture-cache'},liveGuards:[{file:live,sha256:fileHash(live),revision:7,projectId:'fixture-project'}],fixtureCase:n,...extra};const authorizationFile=path.join(dir,`authorization-${n}.json`);write(authorizationFile,{kind:'bounded-render-authorization-v1',owner:request.owner,executionAuthorized:true,publicationAuthorized:false,maxAttempts:1,requestHash:requestHash(request),expiresAt:new Date(clock.value+60_000).toISOString()});const args={request,authorizationFile,authorizationSha256:fileHash(authorizationFile),inputs:[{role:'baseline',file:baseline,sha256:fileHash(baseline)},{role:'candidate',file:candidate,sha256:fileHash(candidate)}]};return{job:q.enqueue(args),args};}
 function proof(claim,overrides={}){write(path.join(claim.jobDir,'closure-proof.json'),{closed:true,token:claim.token,exitCode:0,jobId:claim.job.id,manifestHash:claim.job.manifestHash,browserClosed:true,serverClosed:true,pinVerified:true,...overrides});}
 function inspect(claim,overrides={}){const file=path.join(dir,'inspection-'+claim.job.id+'.json');write(file,{jobId:claim.job.id,manifestHash:claim.job.manifestHash,token:claim.token,accepted:true,...overrides});return{file,sha256:fileHash(file)};}
 return{q,dir,queueRoot,clock,living,live,enqueue,proof,inspect,setResources:r=>{resources=r;},setRuntimeFailure:s=>{runtimeFailure=s;}};
}
const stateJob=(f,id)=>f.q.status().jobs.find(j=>j.id===id);

test('full-development reason cannot be added, changed or removed under an existing grant',t=>{
 const f=fixture(t),reason='The approved affected owners and neighbours span the two-page Short edition.',{args}=f.enqueue({fullDevelopmentReason:reason});
 const authorizedHash=requestHash(args.request);
 args.request.fullDevelopmentReason='A different scope reason';
 assert.notEqual(requestHash(args.request),authorizedHash);
 assert.throws(()=>f.q.enqueue(args),/uthorization/);
 delete args.request.fullDevelopmentReason;
 assert.notEqual(requestHash(args.request),authorizedHash);
 assert.throws(()=>f.q.enqueue(args),/uthorization/);
 const other=f.enqueue();other.args.request.fullDevelopmentReason=reason;
 assert.throws(()=>f.q.enqueue(other.args),/uthorization/);
 assert(f.q.status().jobs.every(j=>j.status==='queued'&&!j.attempt));
});

test('six real child processes contend atomically for three slots in the same queue',async t=>{
 const f=fixture(t);for(let i=0;i<9;i++)f.enqueue();
 const source=`import {createRenderQueue,QueueBusy} from ${JSON.stringify(core)};
 const q=createRenderQueue({queueRoot:process.argv[1],admit:()=>({allowed:true,externalHosts:0,freeMemoryBytes:6*2**30,freeDiskBytes:3*2**30}),verifyRuntime:()=>{},verifyClosure:()=>{throw Error('No child closure allowed');},now:()=>Number(process.argv[2])});
 for(let n=0;n<400;n++){try{const c=q.claimNext('isolated-test-child-'+process.pid);console.log(JSON.stringify({id:c?.job.id??null,token:c?.token??null}));break;}catch(e){if(!(e instanceof QueueBusy))throw e;if(n===399)throw e;await new Promise(r=>setTimeout(r,5));}}`;
 const run=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',source,f.queueRoot,String(f.clock.value)],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.once('error',reject);child.once('close',code=>code===0?resolve(JSON.parse(stdout.trim())):reject(Error(`child exit${code}: ${stderr}`)));});
 const results=await Promise.all(Array.from({length:6},run));const claimed=results.filter(x=>x.id);
 assert.equal(claimed.length,HOST_LIMIT);assert.equal(new Set(claimed.map(x=>x.id)).size,3);assert.equal(new Set(claimed.map(x=>x.token)).size,3);
 const state=f.q.status();assert.equal(state.jobs.filter(j=>j.status==='running').length,3);assert.equal(state.jobs.filter(j=>j.status==='queued').length,6);assert.equal(f.q.claimNext('no-fourth-host'),null);
});

test('immutable snapshotted bytes and manifest changes are denied without an attempt',t=>{
 for(const which of ['input','manifest']){const f=fixture(t),{job}=f.enqueue();const target=path.join(f.queueRoot,'jobs',job.id,which==='input'?'inputs/candidate':'manifest.json');fs.appendFileSync(target,' ');assert.equal(f.q.claimNext('worker'),null);const j=stateJob(f,job.id);assert.equal(j.status,'blocked');assert.equal(j.attempt,undefined);assert.match(j.reason,/Immutable/);}
});

test('authorization-bound role hashes deny candidate or baseline substitution before enqueue',t=>{
 for(const role of ['baseline','candidate']){const f=fixture(t),first=f.enqueue();const replacement=path.join(f.dir,'substitute-'+role+'.json');write(replacement,{id:'fixture-project',revision:7,code:'unapproved substitution'});const inputs=first.args.inputs.map(i=>i.role===role?{...i,file:replacement,sha256:fileHash(replacement)}:i);assert.throws(()=>f.q.enqueue({...first.args,inputs}),/Authorization request must bind every immutable input role\/hash/);assert.equal(f.q.status().jobs.length,1);assert.equal(f.q.status().jobs[0].status,'queued');}
});

test('live hash/revision drift, changed authorization and expired authorization deny action-time admission',t=>{
 for(const mode of ['live-hash','authorization','expiry','runtime']){const f=fixture(t),record=f.enqueue();
  if(mode==='live-hash')write(f.live,{id:'fixture-project',revision:8});if(mode==='authorization')fs.appendFileSync(record.args.authorizationFile,' ');if(mode==='expiry')f.clock.value+=60_001;if(mode==='runtime')f.setRuntimeFailure('Pinned bytes drifted');
  assert.equal(f.q.claimNext('worker'),null,mode);const j=stateJob(f,record.job.id);assert.equal(j.status,'blocked',mode);assert.equal(j.attempt,undefined,mode);
 }
});

test('incorrect live revision or project identity is rejected at enqueue',t=>{
 for(const override of [{revision:8,projectId:'fixture-project'},{revision:7,projectId:'foreign-project'}]){const f=fixture(t);assert.throws(()=>f.enqueue({liveGuards:[{file:f.live,sha256:fileHash(f.live),...override}]}),/Live revision\/identity drift/);assert.equal(f.q.status().jobs.length,0);}
});

test('resource busy/host cap preserve unattempted queued work and later admit at exact thresholds',t=>{
 for(const observation of [{allowed:true,busy:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK},{allowed:true,externalHosts:3,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK},{allowed:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY-1,freeDiskBytes:MIN_FREE_DISK},{allowed:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK-1}]){const f=fixture(t),{job}=f.enqueue();f.setResources(observation);assert.equal(f.q.claimNext('worker'),null);assert.equal(stateJob(f,job.id).status,'waiting');assert.equal(stateJob(f,job.id).attempt,undefined);f.setResources({allowed:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK});assert.equal(f.q.claimNext('worker').job.id,job.id);}
});

test('missing/nonfinite resource measurements must not positively admit work',t=>{
 for(const bad of [undefined,NaN,Infinity]){const f=fixture(t),{job}=f.enqueue();f.setResources({allowed:true,externalHosts:0,freeMemoryBytes:bad,freeDiskBytes:MIN_FREE_DISK});assert.ok(f.q.claimNext('worker')===null,`freeMemoryBytes=${bad} must fail closed`);assert.equal(stateJob(f,job.id).attempt,undefined);}
 for(const bad of [undefined,NaN,Infinity]){const f=fixture(t);f.enqueue();f.setResources({allowed:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:bad});assert.ok(f.q.claimNext('worker')===null,`freeDiskBytes=${bad} must fail closed`);}
});

test('only matching tokens can finish/mark uncertain; only owning coordinator can cancel or inspect',t=>{
 const f=fixture(t),{job}=f.enqueue(),c=f.q.claimNext('worker');assert.throws(()=>f.q.finish(job.id,'foreign-token'),/matching job token/);assert.throws(()=>f.q.uncertain(job.id,'foreign-token','bad'),/matching job token/);assert.throws(()=>f.q.cancel(job.id,'foreign-owner'),/owning coordinator/);assert.equal(stateJob(f,job.id).status,'running');f.proof(c);assert.equal(f.q.finish(job.id,c.token).status,'succeeded');const record=f.inspect(c);assert.throws(()=>f.q.recordInspection(job.id,'foreign-owner',record),/owning coordinator/);assert.equal(f.q.recordInspection(job.id,'fixture-coordinator',record).inspection.accepted,true);
});

test('failed jobs do not automatically retry and identical completed/failed requests cannot replay',t=>{
 const f=fixture(t),first=f.enqueue(),c=f.q.claimNext('worker');f.proof(c,{exitCode:1});assert.equal(f.q.finish(first.job.id,c.token).status,'failed');assert.equal(f.q.claimNext('worker'),null);assert.throws(()=>f.q.enqueue(first.args),/Identical job already recorded/);assert.throws(()=>f.q.finish(first.job.id,c.token),/Active matching/);
 const next=f.enqueue(),second=f.q.claimNext('worker');assert.equal(second.job.id,next.job.id);f.proof(second);f.q.finish(next.job.id,second.token);assert.throws(()=>f.q.enqueue(next.args),/Identical job already recorded/);
});

test('incomplete/wrong-token closure leaves an uncertain job occupying its slot',t=>{
 const f=fixture(t);for(let i=0;i<4;i++)f.enqueue();const claims=[f.q.claimNext('w1'),f.q.claimNext('w2'),f.q.claimNext('w3')];assert.equal(f.q.finish(claims[0].job.id,claims[0].token).status,'uncertain');f.proof(claims[1],{token:'wrong-token'});assert.equal(f.q.finish(claims[1].job.id,claims[1].token).status,'uncertain');f.proof(claims[2],{serverClosed:false});assert.equal(f.q.finish(claims[2].job.id,claims[2].token).status,'uncertain');assert.equal(f.q.claimNext('fourth'),null);assert.equal(f.q.status().jobs.filter(j=>j.status==='uncertain').length,3);
});

test('recovery requires dead worker AND matching complete local proof; age never suffices',t=>{
 const f=fixture(t),{job}=f.enqueue(),c=f.q.claimNext('worker');f.q.uncertain(job.id,c.token,'simulated lost parent');f.clock.value+=365*24*60*60*1000;f.proof(c);assert.throws(()=>f.q.recover(job.id,c.token),/Worker is live or ownership uncertain/);assert.equal(stateJob(f,job.id).status,'uncertain');f.living.value=false;f.proof(c,{browserClosed:false});assert.equal(f.q.recover(job.id,c.token).status,'uncertain');f.proof(c,{token:'not-owner'});assert.equal(f.q.recover(job.id,c.token).status,'uncertain');f.proof(c);assert.equal(f.q.recover(job.id,c.token).status,'succeeded');
});

test('a live/unknown transaction writer lock is retained regardless of age or caller token',t=>{
 const f=fixture(t),lock=path.join(f.queueRoot,'transaction.lock'),token='fixture-writer-token';fs.mkdirSync(lock);write(path.join(lock,'owner.json'),{token,identity:{pid:process.pid},at:'2000-01-01T00:00:00Z'});assert.throws(()=>f.q.claimNext('worker'),/Queue transaction busy/);assert.throws(()=>f.q.recoverTransactionLock({token}),/live\/unknown/);assert.throws(()=>f.q.recoverTransactionLock({token:'foreign'}),/token mismatch/);assert.equal(fs.existsSync(lock),true);f.living.value=false;assert.equal(f.q.recoverTransactionLock({token}),true);assert.equal(fs.existsSync(lock),false);
});

test('dependency remains blocked until exact actual-inspection record is bound by owning coordinator',t=>{
 const f=fixture(t),parent=f.enqueue(),dep=f.enqueue({dependsOn:[{jobId:parent.job.id,requireInspection:true}]}),c=f.q.claimNext('worker');f.proof(c);f.q.finish(parent.job.id,c.token);assert.equal(f.q.claimNext('worker'),null);assert.equal(stateJob(f,dep.job.id).status,'waiting');assert.equal(stateJob(f,dep.job.id).attempt,undefined);
 for(const wrong of [{jobId:'foreign'},{manifestHash:'foreign'},{token:'foreign'}])assert.throws(()=>f.q.recordInspection(parent.job.id,'fixture-coordinator',f.inspect(c,wrong)),/Exact actual-inspection binding/);
 const record=f.inspect(c);const bytes=fs.readFileSync(record.file);fs.appendFileSync(record.file,' ');assert.throws(()=>f.q.recordInspection(parent.job.id,'fixture-coordinator',record),/Inspection changed/);fs.writeFileSync(record.file,bytes);f.q.recordInspection(parent.job.id,'fixture-coordinator',record);assert.equal(f.q.claimNext('worker').job.id,dep.job.id);
});

test('post-binding inspection-file drift must not unlock a dependent render',t=>{
 const f=fixture(t),parent=f.enqueue(),dep=f.enqueue({dependsOn:[{jobId:parent.job.id,requireInspection:true}]}),c=f.q.claimNext('worker');f.proof(c);f.q.finish(parent.job.id,c.token);const record=f.inspect(c);f.q.recordInspection(parent.job.id,'fixture-coordinator',record);write(record.file,{jobId:parent.job.id,manifestHash:c.job.manifestHash,token:c.token,accepted:false});assert.ok(f.q.claimNext('worker')===null,'Changed actual inspection cannot be treated as retained passing evidence');assert.equal(stateJob(f,dep.job.id).attempt,undefined);
});

test('busy reserve port leaves no attempt; successful reservation is retained and released only after complete proof',t=>{
 let busy=true;const reservations=[],releases=[];
 const f=fixture(t,{reserve:({jobId,token})=>{if(busy){const e=Error('Legacy lane busy');e.code='QUEUE_BUSY';throw e;}const r={jobId,token,lane:1};reservations.push(r);return r;},releaseReservation:(r,token)=>{assert.equal(r.token,token);releases.push({r,token});}});
 const {job}=f.enqueue();assert.equal(f.q.claimNext('worker'),null);assert.equal(stateJob(f,job.id).status,'waiting');assert.equal(stateJob(f,job.id).attempt,undefined);assert.equal(reservations.length,0);
 busy=false;const c=f.q.claimNext('worker');assert.equal(reservations.length,1);assert.deepEqual(c.job.attempt.reservation,reservations[0]);assert.equal(f.q.finish(job.id,c.token).status,'uncertain');assert.equal(releases.length,0,'Missing closure must not release external ownership');
 f.proof(c);assert.equal(f.q.finish(job.id,c.token).status,'succeeded');assert.equal(releases.length,1);assert.equal(releases[0].token,c.token);
});

test('release failure retains uncertain slot; dead-worker recovery uses the original reservation/token',t=>{
 let releaseFailure=true;const seen=[];
 const f=fixture(t,{reserve:({jobId,token})=>({jobId,token,lane:2}),releaseReservation:(r,token)=>{seen.push({r,token});if(releaseFailure)throw Error('External release closure not proven');}});
 for(let i=0;i<4;i++)f.enqueue();const c=f.q.claimNext('w1');f.q.claimNext('w2');f.q.claimNext('w3');f.proof(c);assert.equal(f.q.finish(c.job.id,c.token).status,'uncertain');assert.equal(f.q.claimNext('fourth'),null);assert.equal(seen.length,1);assert.throws(()=>f.q.recover(c.job.id,c.token),/Worker is live/);
 f.living.value=false;releaseFailure=false;assert.equal(f.q.recover(c.job.id,c.token).status,'succeeded');assert.equal(seen.length,2);assert.deepEqual(seen[0],seen[1],'Recovery must retain exact reservation and token');assert.ok(f.q.claimNext('fourth'));
});

test('reservation intent is durable before external effects and a partial-throw stays uncertain within the cap',t=>{
 let first=true,durableToken;const f=fixture(t,{reserve:({jobId,token})=>{const persisted=JSON.parse(fs.readFileSync(path.join(f.queueRoot,'state.json'))).jobs.find(j=>j.id===jobId);assert.equal(persisted.status,'running');assert.equal(persisted.attempt.token,token,'Token must precede any external effect');if(first){first=false;durableToken=token;write(path.join(f.dir,'simulated-external-lane.json'),{jobId,token});throw Error('Simulated partial external reservation then crash');}return{jobId,token,lane:2};}});
 const firstJob=f.enqueue().job;assert.equal(f.q.claimNext('partial-worker'),null);const uncertain=stateJob(f,firstJob.id);assert.equal(uncertain.status,'uncertain');assert.equal(uncertain.attempt.token,durableToken);assert.equal(JSON.parse(fs.readFileSync(path.join(f.dir,'simulated-external-lane.json'))).token,durableToken);
 for(let i=0;i<3;i++)f.enqueue();assert.ok(f.q.claimNext('w2'));assert.ok(f.q.claimNext('w3'));assert.equal(f.q.claimNext('w4'),null);assert.equal(f.q.status().jobs.filter(j=>['running','uncertain'].includes(j.status)).length,3);
});

test('same-token idempotent external release recovers a post-release failure only after matching complete closure',t=>{
 let externallyHeld=true,throwAfterRelease=true,calls=0;
 const f=fixture(t,{reserve:({jobId,token})=>({jobId,token,lane:3}),releaseReservation:(reservation,token)=>{calls++;assert.equal(reservation.token,token);if(externallyHeld)externallyHeld=false;else assert.equal(token,reservation.token,'Idempotency is scoped to original token');if(throwAfterRelease){throwAfterRelease=false;throw Error('Simulated lost completion after owned external release');}}});
 const {job}=f.enqueue(),c=f.q.claimNext('worker');assert.equal(f.q.finish(job.id,c.token).status,'uncertain');assert.equal(calls,0,'Release forbidden without closure fixture');f.proof(c);assert.equal(f.q.finish(job.id,c.token).status,'uncertain');assert.equal(externallyHeld,false);assert.equal(calls,1);f.living.value=false;assert.equal(f.q.recover(job.id,c.token).status,'succeeded');assert.equal(calls,2);
});

test('action-time revalidation rejects newly expired authorization, resource/admission changes and uncertain ownership',t=>{
 const f=fixture(t),{job}=f.enqueue(),c=f.q.claimNext('worker');assert.ok(f.q.revalidate(job.id,c.token));assert.throws(()=>f.q.revalidate(job.id,'foreign-token'),/matching job token/);f.setResources({allowed:true,busy:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK});assert.throws(()=>f.q.revalidate(job.id,c.token),/admission no longer valid/);f.setResources({allowed:true,externalHosts:0,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK});f.clock.value+=60_001;assert.throws(()=>f.q.revalidate(job.id,c.token),/unexpired/);f.clock.value-=60_001;f.q.uncertain(job.id,c.token,'uncertain owner');assert.throws(()=>f.q.revalidate(job.id,c.token),/Uncertain attempt cannot resume/);
});

test('complete closure with content drift fails job but releases capacity using closure runtime context',t=>{
 let drift=false,releases=0;const contexts=[];
 const f=fixture(t,{verifyRuntime:(runtime,context)=>{contexts.push(context??null);if(drift&&!context?.closure)throw Error('Live renderer content drift');},reserve:({token})=>({token}),releaseReservation:(r,token)=>{assert.equal(r.token,token);releases++;}});
 for(let i=0;i<4;i++)f.enqueue();const c=f.q.claimNext('w1');f.q.claimNext('w2');f.q.claimNext('w3');assert.equal(f.q.claimNext('fourth'),null);drift=true;assert.throws(()=>f.q.revalidate(c.job.id,c.token),/content drift/);f.proof(c,{contentDrift:'Live input changed after rendering'});const ended=f.q.finish(c.job.id,c.token);assert.equal(ended.status,'failed');assert.match(ended.reason,/Live input changed/);assert.equal(releases,1);assert.deepEqual(contexts.at(-1),{closure:true});drift=false;assert.ok(f.q.claimNext('fourth'));
});

test('action-time revalidation includes external hosts in the global three-host cap',t=>{
 const f=fixture(t),{job}=f.enqueue(),c=f.q.claimNext('worker');f.setResources({allowed:true,externalHosts:3,freeMemoryBytes:MIN_FREE_MEMORY,freeDiskBytes:MIN_FREE_DISK});assert.throws(()=>f.q.revalidate(job.id,c.token),/admission no longer valid|host|capacity/i);
});

