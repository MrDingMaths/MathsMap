import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {artifactHash,projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {prepareReviewQueue,reviewQueueStatus,beginPageReview,recordPageReview,cancelPageReview,finalReviewRecord} from '../scripts/booklet/visual-review-queue.mjs';
import {nextBoundedWork,prepareBoundedStage,recordBoundedStage,cancelBoundedStage,executePreparedBoundedStage,runBoundedStage} from '../scripts/booklet/bounded-stages.mjs';
import {loadWorkflow} from '../scripts/booklet/workflow-review.mjs';

const ref=file=>({path:path.resolve(file),hash:artifactHash(file)});
const expected=s=>({expectedRevision:s.revision,sessionKey:s.sessionKey});
const accepted={reviewer:'Concurrency regression fixture',note:'Synthetic explicit inspection; no production acceptance.',outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true};
function fixture(t,{pages=5}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'visual-concurrency-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(dir,name);fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 const project={id:'fixture',settings:{},sections:[]},projectFile=write('project.json',project),projectHash=projectReviewHash(project);
 const input={mode:'final',project:{...ref(projectFile),contentHash:projectHash},renderer:'test-renderer',assets:{},key:'fixture-settlement',sourceArtifacts:[ref(write('source.txt','Original source fixture'))],editions:{}};
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const images=Array.from({length:pages},(_,i)=>({page:i+1,...ref(write(`${edition}-${i+1}.png`,'image '+i))}));
  const manifest={mode:'full',passed:true,edition,projectHash,renderer:input.renderer,workflowKey:input.key,assets:{},images,pdf:ref(write(edition+'.pdf','PDF fixture')),pages:images.map(i=>({page:i.page,hash:'page-'+i.page}))};
  input.editions[edition]={manifest:ref(write(edition+'.json',manifest)),images};
 }
 const deps={renderer:input.renderer,workflow:{settled:{key:input.key,project:{hash:projectHash}}}},options={runDir:dir,projectFile,stages:['visual'],visualConcurrency:3};
 return {dir,write,input,deps,options,overrides:{queueDependencies:deps}};
}
const ticket=p=>JSON.parse(fs.readFileSync(p.ticket.path));

test('three disjoint raw claims reject overlaps, a fourth owner, stale snapshots and implicit cancellation',async t=>{
 const f=fixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps);const original=s,keys=s.pending.map(r=>r.key),ids=[];
 for(let i=0;i<3;i++){s=await beginPageReview(f.dir,{...expected(s),pageKeys:[keys[i]],visualConcurrency:3},f.deps);ids.push(s.startedReviewId);}
 assert.equal(s.activeReviews.length,3);assert.equal(s.active.id,ids[0]);
 await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),pageKeys:[keys[0]],visualConcurrency:3},f.deps),/overlaps/);
 await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),pageKeys:[keys[3]],visualConcurrency:3},f.deps),/concurrency limit/);
 await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),pageKeys:[keys[3]]},f.deps),/already active/);
 await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),compositionEditions:['with-short']},f.deps),/already active/);
 await assert.rejects(()=>recordPageReview(f.dir,{...accepted,...expected(original),reviewId:ids[0]},f.deps),/stale/);
 await assert.rejects(()=>cancelPageReview(f.dir,expected(s)),/Select reviewId/);
 await assert.rejects(()=>prepareReviewQueue(f.dir,f.input,f.deps),/active review/);
 s=await recordPageReview(f.dir,{...accepted,...expected(s),reviewId:ids[1]},f.deps);
 assert.equal(s.reviewed,1);assert.deepEqual(s.activeReviews.map(a=>a.id),[ids[0],ids[2]]);
 s=await cancelPageReview(f.dir,{...expected(s),reviewId:ids[2]});assert.equal(s.reviewed,1);assert.equal(s.active.id,ids[0]);
 s=await recordPageReview(f.dir,{...accepted,...expected(s),reviewId:ids[0]},f.deps);
 assert.equal(s.reviewed,2);assert.equal(s.active,null);assert.deepEqual(s.activeReviews,[]);
 const queue=JSON.parse(fs.readFileSync(path.join(f.dir,'visual-review/queue.json')));assert.equal(queue.rows.find(r=>r.key===keys[2]).review,null);
});

test('the final gate waits for every live claim even when all pages had prior inspection',async t=>{
 const f=fixture(t,{pages:1});let s=await prepareReviewQueue(f.dir,f.input,f.deps);const keys=s.pending.map(r=>r.key);
 s=await beginPageReview(f.dir,{...expected(s),pageKeys:keys},f.deps);
 s=await recordPageReview(f.dir,{...accepted,...expected(s),reviewId:s.active.id},f.deps);assert.equal(s.reviewed,s.total);
 const ids=[];for(let i=0;i<3;i++){s=await beginPageReview(f.dir,{...expected(s),pageKeys:[keys[i]],visualConcurrency:3},f.deps);ids.push(s.startedReviewId);}
 for(const id of [ids[1],ids[0],ids[2]]){
  await assert.rejects(()=>finalReviewRecord(f.dir,{...accepted,...expected(s)},f.deps),/Every page/);
  s=await cancelPageReview(f.dir,{...expected(s),reviewId:id});
 }
 const final=await finalReviewRecord(f.dir,{...accepted,...expected(s)},f.deps);assert.equal(Object.keys(final.editions).length,5);
});

test('bounded concurrent tickets own disjoint pages and record out of order through serialized writes',async t=>{
 const f=fixture(t);await prepareReviewQueue(f.dir,f.input,f.deps);
 const plan=await nextBoundedWork(f.options,f.overrides);assert.deepEqual(plan.jobs.map(j=>j.ownershipIds.length),[8,8,8,1]);
 const prepared=await Promise.all(plan.jobs.slice(0,3).map(j=>prepareBoundedStage(f.options,j.id,f.overrides))),ids=prepared.map(p=>ticket(p).reviewId);
 assert.equal(new Set(ids).size,3);assert.ok(prepared.every(p=>ticket(p).visualConcurrency===3));
 let s=await reviewQueueStatus(f.dir,f.deps);assert.deepEqual(s.activeReviews.map(a=>a.id),ids);
 await assert.rejects(()=>prepareBoundedStage(f.options,plan.jobs[3].id,f.overrides),/concurrency limit/);
 await assert.rejects(()=>prepareBoundedStage(f.options,plan.jobs[0].id,f.overrides),/active visual review|Owned by active ticket/);
 await assert.rejects(()=>recordBoundedStage({...f.options,visualConcurrency:1},{ticket:prepared[0].ticket,result:accepted},f.overrides),/differs from the immutable ticket/);
 const inherited={runDir:f.dir,projectFile:f.options.projectFile};
 await recordBoundedStage(inherited,{ticket:prepared[1].ticket,result:accepted},f.overrides);
 await cancelBoundedStage(inherited,{ticket:prepared[2].ticket,reason:'Explicit cancellation fixture'});
 const replacement=await prepareBoundedStage(f.options,prepared[2].job.id,f.overrides);
 await Promise.all([replacement,prepared[0]].map(p=>recordBoundedStage(inherited,{ticket:p.ticket,result:accepted},f.overrides)));
 s=await reviewQueueStatus(f.dir,f.deps);assert.equal(s.reviewed,24);assert.equal(s.active,null);
 assert.deepEqual(loadWorkflow(f.dir).verification.stageClaims,{});
 await assert.rejects(()=>executePreparedBoundedStage(inherited,prepared[0].ticket,{...f.overrides,runner:()=>assert.fail('Duplicate worker')}),/ownership/);
 const last=(await nextBoundedWork(f.options,f.overrides)).jobs[0],p=await prepareBoundedStage(f.options,last.id,f.overrides);
 await recordBoundedStage(inherited,{ticket:p.ticket,result:accepted},f.overrides);
 s=await reviewQueueStatus(f.dir,f.deps);assert.equal(s.reviewed,25);
 await finalReviewRecord(f.dir,{...accepted,...expected(s)},f.deps);
});

test('legacy tickets remain exclusive and valid while concurrency is opt-in and immutable',async t=>{
 const f=fixture(t);await prepareReviewQueue(f.dir,f.input,f.deps);
 const legacy={...f.options};delete legacy.visualConcurrency;
 const plan=await nextBoundedWork(legacy,f.overrides),p=await prepareBoundedStage(legacy,plan.jobs[0].id,f.overrides);
 assert.equal(ticket(p).visualConcurrency,undefined);
 await assert.rejects(()=>prepareBoundedStage(f.options,plan.jobs[1].id,f.overrides),/active visual review/);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:p.ticket,result:accepted},f.overrides),/differs from the immutable ticket/);
 await recordBoundedStage(legacy,{ticket:p.ticket,result:accepted},f.overrides);
 const next=await nextBoundedWork(f.options,f.overrides),concurrent=await prepareBoundedStage(f.options,next.jobs[0].id,f.overrides);
 await assert.rejects(()=>prepareBoundedStage(legacy,next.jobs[1].id,f.overrides),/active visual review/);
 await cancelBoundedStage(f.options,{ticket:concurrent.ticket,reason:'Fixture handoff cleanup'});
 for(const visualConcurrency of [0,4,null,'3',1.5])await assert.rejects(()=>nextBoundedWork({...f.options,visualConcurrency},f.overrides),/integer from 1 to 3/);
});

test('concurrent claims cannot record or execute after source evidence changes',async t=>{
 const f=fixture(t);await prepareReviewQueue(f.dir,f.input,f.deps);
 const plan=await nextBoundedWork(f.options,f.overrides),prepared=[];
 for(const j of plan.jobs.slice(0,3))prepared.push(await prepareBoundedStage(f.options,j.id,f.overrides));
 fs.writeFileSync(f.input.sourceArtifacts[0].path,'Changed original source');
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared[1].ticket,result:accepted},f.overrides),/stale/);
 await assert.rejects(()=>executePreparedBoundedStage(f.options,prepared[0].ticket,{...f.overrides,runner:()=>assert.fail('Stale source invoked worker')}),/stale/);
 const queue=JSON.parse(fs.readFileSync(path.join(f.dir,'visual-review/queue.json')));assert.equal(queue.activeReviews.length,3);assert.ok(queue.rows.every(r=>r.review===null));
 for(const p of prepared)await cancelBoundedStage(f.options,{ticket:p.ticket,reason:'Cancel stale fixture evidence'});
});

test('a runBoundedStage wave overlaps three workers and serializes their fast results',async t=>{
 const f=fixture(t);await prepareReviewQueue(f.dir,f.input,f.deps);
 const plan=await nextBoundedWork(f.options,f.overrides);let arrived=0,release;const ready=new Promise(resolve=>release=resolve);
 const runner=async prepared=>{arrived++;if(arrived===3)release();await ready;return {result:accepted};};
 const results=await Promise.all(plan.jobs.slice(0,3).map(j=>runBoundedStage(f.options,j.id,{...f.overrides,runner})));
 assert.equal(arrived,3);assert.ok(results.every(r=>r.ok));
 const s=await reviewQueueStatus(f.dir,f.deps);assert.equal(s.reviewed,24);assert.deepEqual(s.activeReviews,[]);
 assert.deepEqual(loadWorkflow(f.dir).verification.stageClaims,{});
});

test('an immediately returned worker result cannot race later bounded preparations',async t=>{
 const f=fixture(t);await prepareReviewQueue(f.dir,f.input,f.deps);
 const plan=await nextBoundedWork(f.options,f.overrides);let calls=0;
 const results=await Promise.all(plan.jobs.slice(0,3).map(j=>runBoundedStage(f.options,j.id,{...f.overrides,runner:async()=>{calls++;return {result:accepted};}})));
 assert.equal(calls,3);assert.ok(results.every(r=>r.ok));
 const s=await reviewQueueStatus(f.dir,f.deps);assert.equal(s.reviewed,24);assert.deepEqual(s.activeReviews,[]);
});
