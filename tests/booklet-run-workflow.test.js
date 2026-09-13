import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {withRunLock,beginRunPhase,endRunPhase,buildRunReceipt} from '../scripts/booklet/run-observability.mjs';
import {dependencyStatus,drainDependencies} from '../scripts/booklet/dependency-runner.mjs';
import {workflowPreflight} from '../scripts/booklet/workflow-preflight.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {artifactHash,projectReviewHash,validateFinalManifest} from '../scripts/booklet/page-review.mjs';
import {prepareReviewQueue,reviewQueueStatus,beginPageReview,recordPageReview,cancelPageReview,finalReviewRecord} from '../scripts/booklet/visual-review-queue.mjs';
import {recordMathReview,updateWorkflow,loadWorkflow,reviewFile,liveWorkflow,REVIEW_POLICY,approveRepresentative,representativeKey,PATTERN_CHECKS,settlementKey,acceptFinalReview} from '../scripts/booklet/workflow-review.mjs';
import {rendererSignature,contentAssetSignatures} from '../scripts/booklet/verification-cache.mjs';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const editions=['student','short','worked','with-short','with-worked'];
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-run-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const write=(name,data)=>{const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof data==='string'?data:JSON.stringify(data));return file;};return {dir,write};}
const ref=file=>({path:file,hash:artifactHash(file)});
function reviewFixture(t,{mode='final',pages=2}={}){
 const f=fixture(t),project={id:'isolated',settings:{},sections:[]},projectFile=f.write('project.json',project),projectHash=projectReviewHash(project),input={mode,project:{...ref(projectFile),contentHash:projectHash},renderer:'test-renderer',assets:{},key:'settled-1',sourceArtifacts:[ref(f.write('source.txt','Original source fixture'))],editions:{}};
 for(const edition of editions){const images=Array.from({length:pages},(_,i)=>({page:i+1,...ref(f.write(`${edition}-${i+1}.png`,'image fixture '+i))}));const m={mode:mode==='final'?'full':'development',passed:true,edition,projectHash,renderer:input.renderer,workflowKey:input.key,assets:{},images,pdf:ref(f.write(edition+'.pdf','PDF fixture')),pages:images.map(i=>({page:i.page,hash:'page-hash-'+i.page}))};input.editions[edition]={manifest:ref(f.write(edition+'.json',m)),images};}
 const deps={renderer:input.renderer,workflow:{settled:{key:input.key,project:{hash:projectHash}}}};return {...f,input,deps};
}
const expected=s=>({expectedRevision:s.revision,sessionKey:s.sessionKey});
async function inspect(f,s,keys=s.pending.map(r=>r.key)){
 s=await beginPageReview(f.dir,{...expected(s),pageKeys:keys},f.deps);
 return recordPageReview(f.dir,{...expected(s),reviewId:s.active.id,reviewer:'Fixture reviewer',note:'Explicit inspection assertion in regression fixture only',outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true},f.deps);
}
test('final inspection persists and resumes; every page is required by the existing final manifest gate',async t=>{
 const f=reviewFixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps);assert.equal(s.total,10);
 await assert.rejects(()=>finalReviewRecord(f.dir,{...expected(s),reviewer:'Fixture',note:'Incomplete'},f.deps),/Every page/);
 s=await inspect(f,s,[s.pending[0].key]);s=await reviewQueueStatus(f.dir,f.deps);assert.equal(s.reviewed,1);
 s=await prepareReviewQueue(f.dir,f.input,f.deps);assert.equal(s.reviewed,1);s=await inspect(f,s);
 const record=await finalReviewRecord(f.dir,{...expected(s),reviewer:'Fixture reviewer',note:'Completed fixture'},f.deps);
 for(const edition of editions)assert.doesNotThrow(()=>validateFinalManifest(record.editions[edition],{edition,key:f.input.key,projectHash:f.input.project.contentHash,renderer:f.input.renderer}));
 assert.equal(buildRunReceipt(f.dir).phases['visual-review'].length,2);
});
test('new final settlement invalidates even pixel-identical pages',async t=>{
 const f=reviewFixture(t);let s=await inspect(f,await prepareReviewQueue(f.dir,f.input,f.deps));assert.equal(s.reviewed,10);
 f.input.key='settled-2';f.deps.workflow.settled.key=f.input.key;
 for(const e of editions){const file=f.input.editions[e].manifest.path,m=JSON.parse(fs.readFileSync(file));m.workflowKey=f.input.key;fs.writeFileSync(file,JSON.stringify(m));f.input.editions[e].manifest=ref(file);}
 s=await prepareReviewQueue(f.dir,f.input,f.deps);assert.equal(s.reviewed,0);
});
test('development changes invalidate affected pages and neighbours, preserving other inspections',async t=>{
 const f=reviewFixture(t,{mode:'development',pages:5});let s=await inspect(f,await prepareReviewQueue(f.dir,f.input,f.deps));assert.equal(s.reviewed,25);
 const entry=f.input.editions.student;fs.writeFileSync(entry.images[2].path,'changed page');entry.images[2]={page:3,...ref(entry.images[2].path)};
 const file=entry.manifest.path,m=JSON.parse(fs.readFileSync(file));m.images=entry.images;m.pages[2].hash='changed';fs.writeFileSync(file,JSON.stringify(m));entry.manifest=ref(file);
 s=await prepareReviewQueue(f.dir,f.input,f.deps);assert.equal(s.reviewed,22);assert.deepEqual(s.pending.map(r=>r.page),[2,3,4]);
});
test('stale source, image, PDF, renderer, inspection artifacts and optimistic revisions are rejected',async t=>{
 for(const kind of ['source','image','pdf','renderer','inspection']){
  const f=reviewFixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps);
  await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),expectedRevision:0,pageKeys:[s.pending[0].key]},f.deps),/stale/);
  if(kind==='inspection'){s=await inspect(f,s);const q=JSON.parse(fs.readFileSync(path.join(f.dir,'visual-review/queue.json')));fs.writeFileSync(q.rows[0].review.artifact.path,'changed');}
  else if(kind==='renderer')f.deps.renderer='changed';
  else {const file=kind==='source'?f.input.sourceArtifacts[0].path:kind==='image'?f.input.editions.student.images[0].path:JSON.parse(fs.readFileSync(f.input.editions.student.manifest.path)).pdf.path;fs.writeFileSync(file,'changed');}
  await assert.rejects(()=>reviewQueueStatus(f.dir,f.deps),/stale|changed/i);
 }
});
test('acceptance cannot be inferred; cancellation credits no inspection or active review time',async t=>{
 const f=reviewFixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps);s=await beginPageReview(f.dir,{...expected(s),pageKeys:[s.pending[0].key]},f.deps);
 await assert.rejects(()=>recordPageReview(f.dir,{...expected(s),reviewId:s.active.id,reviewer:'Fixture',note:'No actual checks',outcome:'accepted'},f.deps),/explicitly/);
 assert.equal(buildRunReceipt(f.dir).unfinished.length,1);
 s=await cancelPageReview(f.dir,expected(s));assert.equal(s.reviewed,0);assert.equal(buildRunReceipt(f.dir).recordedActiveWallMs,0);
});
test('final queues reject incomplete editions and unrelated images',async t=>{
 const f=reviewFixture(t);delete f.input.editions.worked;await assert.rejects(()=>prepareReviewQueue(f.dir,f.input,f.deps),/five editions/);
 const g=reviewFixture(t);g.input.editions.student.images[0]=g.input.editions.short.images[0];await assert.rejects(()=>prepareReviewQueue(g.dir,g.input,g.deps),/page images/);
});
test('run phases retain failure, unfinished work and union overlapping intervals',t=>{
 const f=fixture(t),a=beginRunPhase(f.dir,'compile'),b=beginRunPhase(f.dir,'export');endRunPhase(f.dir,a);endRunPhase(f.dir,b,{ok:false});beginRunPhase(f.dir,'interrupted');
 const r=buildRunReceipt(f.dir);assert.equal(r.phases.export[0].ok,false);assert.equal(r.unfinished.length,1);assert.ok(r.recordedActiveWallMs<=r.phases.compile[0].elapsedMs+r.phases.export[0].elapsedMs);
});
test('publication locks serialize unrelated writers, release after failure and never steal a busy lock',async t=>{
 const f=fixture(t),order=[];let release;const gate=new Promise(r=>release=r);
 const a=withRunLock(f.dir,'publication',async()=>{order.push('a-start');await gate;order.push('a-end');throw Error('fixture failure');});
 const b=withRunLock(f.dir,'publication',async()=>order.push('b'));await new Promise(r=>setTimeout(r,20));assert.deepEqual(order,['a-start']);release();await assert.rejects(a,/fixture failure/);await b;assert.deepEqual(order,['a-start','a-end','b']);
 const lock=f.write('workflow/publication.lock','Other writer');await assert.rejects(()=>withRunLock(f.dir,'publication',()=>assert.fail(),{timeoutMs:1}),/busy/);assert.equal(fs.readFileSync(lock,'utf8'),'Other writer');
});
function generationFixture(t,{review=false}={}){
 const f=fixture(t);for(let p=1;p<=2;p++){f.write(`evidence/pages/page-00${p}.txt`,'Find x.');f.write(`evidence/pages/page-00${p}.png`,'Source '+p);}
 const options={runDir:f.dir,manifest:{...TRANSCRIPTION_DEFAULT,id:'fixture',selectedPages:[1,2],concurrency:2,...(review?{workflowPolicy:REVIEW_POLICY}:{})},config:{title:'Fixture',topics:[{id:'topic',title:'Topic',start:1,end:2,teachingPages:[]}]},pages:[1,2]};
 const inventory=p=>({pageNumber:p,inventoried:true,layoutPatterns:[{id:'plain',description:'A prompt'}],entries:[{id:'src-'+p,targetId:'q-'+p,kind:'question',description:'Find x.'}]});
 const author=p=>({pageNumber:p,sections:[{id:'s-'+p,title:'Topic',blocks:[{id:'b-'+p,type:'question',content:{id:'q-'+p,type:'question',prompt:'Find x.',answer:{short:'1',worked:'x=1'}}}]}],inventoryMappings:[{inventoryId:'src-'+p,targetId:'q-'+p}]});
 const runner=async({prompt,out})=>{const p=Number(prompt.match(/Target page (\d+)/)[1]);await new Promise(r=>setTimeout(r,p===1?10:25));return {result:out.includes('.inventory.')?inventory(p):author(p),metrics:{usage:{output_tokens:10}}};};
 return {...f,options,runner};
}
test('dependency drain overlaps stages, respects concurrency and does not regenerate valid results',async t=>{
 const f=generationFixture(t),calls=[];let active=0,max=0;const runner=async input=>{calls.push(path.basename(input.out));active++;max=Math.max(max,active);try{return await f.runner(input);}finally{active--;}};
 const r=await drainDependencies(f.options,{runner,log:()=>{}});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(max,2);assert.equal(calls.length,4);assert.equal(buildRunReceipt(f.dir).model.calls,4);
 assert.deepEqual(dependencyStatus(f.options).complete,[1,2]);await drainDependencies(f.options,{runner:()=>assert.fail('Cached task regenerated'),log:()=>{}});
});
test('dependency failures stop once; a reviewed explicit retry creates a new immutable attempt',async t=>{
 const f=generationFixture(t);let calls=0;const fail=async()=>{calls++;throw Error('Fixture failure');};
 const r=await drainDependencies(f.options,{runner:fail,log:()=>{}});assert.equal(r.ok,false);assert.equal(calls,2);assert.equal(r.blocked.length,2);
 await drainDependencies(f.options,{runner:()=>assert.fail('Silent retry'),log:()=>{}});
 const retry=await drainDependencies(f.options,{retry:true,runner:f.runner,log:()=>{}});assert.equal(retry.ok,true,JSON.stringify(retry));assert.ok(fs.existsSync(path.join(f.dir,'semantic-packets/page-001.inventory.2')));
});
test('review-first drain stops at maths then representative gates and resumes after explicit fixture reviews',async t=>{
 const f=generationFixture(t,{review:true}),evidence={reviewer:'Test reviewer',note:'Explicit fixture review',artifacts:[ref(f.write('review.txt','Fixture only'))]};
 let r=await drainDependencies(f.options,{runner:f.runner,log:()=>{}});assert.equal(r.ok,false);assert.equal(r.results.length,2);assert.ok(r.blocked.every(b=>b.reasons.some(s=>/Mathematical/.test(s))));
 await updateWorkflow(f.dir,'fixture maths',state=>{recordMathReview(state,{...evidence,pages:Object.entries(state.pages).map(([p,v])=>({page:Number(p),key:v.inventoryHash}))});});
 r=await drainDependencies(f.options,{representative:true,runner:f.runner,log:()=>{}});assert.equal(r.results.length,1);assert.equal(r.results[0].page,1);
 await updateWorkflow(f.dir,'fixture pattern',state=>{approveRepresentative(state,{...evidence,pattern:'plain',page:1,key:representativeKey(state,1),renderer:rendererSignature(),checks:Object.fromEntries(PATTERN_CHECKS.map(k=>[k,true])),sourceCompared:true,finalSize:true});});
 r=await drainDependencies(f.options,{runner:f.runner,log:()=>{}});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(liveWorkflow(f.dir).pages[2].authorHash?.length>0,true);
});
test('preflight reports all failures without exposing authentication output or making generation calls',async t=>{
 const f=fixture(t),source=f.write('source.txt','source'),probe=async(exe,args)=>({ok:!exe.includes('pdf'),code:exe.includes('pdf')?1:0,output:args.includes('status')?'private identity':'version fixture'});
 const browserType={launch:async()=>{throw Error('Fixture browser unavailable');}};
 const r=await workflowPreflight({runDir:f.dir,manifest:{...TRANSCRIPTION_DEFAULT,pins:{runFiles:{'source.txt':artifactHash(source)}}}},{probe,browserType,compileEngine:async()=>async()=>({svg:'<svg/>'})});
 assert.equal(r.ok,false);assert.equal(r.checks.length,10);assert.doesNotMatch(JSON.stringify(r),/private identity/);assert.equal(r.checks.find(c=>c.name==='codex-auth').authenticated,true);assert.equal(buildRunReceipt(f.dir).model.calls,0);
});
test('generated final record passes the existing acceptance API and retains underlying evidence dependencies',async t=>{
 const f=reviewFixture(t),state=loadWorkflow(f.dir),key=settlementKey(state),renderer=rendererSignature();
 f.input.key=key;f.input.renderer=renderer;f.deps.renderer=renderer;f.deps.workflow=state;state.settled={key,project:{hash:f.input.project.contentHash,file:f.input.project.path},artifacts:f.input.sourceArtifacts};
 for(const e of editions){const file=f.input.editions[e].manifest.path,m=JSON.parse(fs.readFileSync(file));m.workflowKey=key;m.renderer=renderer;fs.writeFileSync(file,JSON.stringify(m));f.input.editions[e].manifest=ref(file);}
 const s=await inspect(f,await prepareReviewQueue(f.dir,f.input,f.deps)),record=await finalReviewRecord(f.dir,{...expected(s),reviewer:'Fixture reviewer',note:'Acceptance API fixture'},f.deps);
 acceptFinalReview(state,record);assert.ok(state.finalReview.artifacts.some(a=>a.path===f.input.editions.student.images[0].path));
 fs.writeFileSync(f.input.sourceArtifacts[0].path,'changed');assert.throws(()=>acceptFinalReview(state,record),/evidence/);
});
test('local image assets are dependencies even when project and rendered page bytes stay unchanged',async t=>{
 const f=reviewFixture(t,{mode:'development'}),asset=f.write('asset.svg','<svg/>'),project=JSON.parse(fs.readFileSync(f.input.project.path));project.sections=[{blocks:[{src:asset}]}];fs.writeFileSync(f.input.project.path,JSON.stringify(project));f.input.project={...ref(f.input.project.path),contentHash:projectReviewHash(project)};f.input.assets=await contentAssetSignatures(project);
 for(const e of editions){const file=f.input.editions[e].manifest.path,m=JSON.parse(fs.readFileSync(file));m.projectHash=f.input.project.contentHash;m.assets=f.input.assets;fs.writeFileSync(file,JSON.stringify(m));f.input.editions[e].manifest=ref(file);}
 await prepareReviewQueue(f.dir,f.input,f.deps);fs.writeFileSync(asset,'<svg>changed</svg>');await assert.rejects(()=>reviewQueueStatus(f.dir,f.deps),/assets changed/);
});
test('separate processes share the publication lock',async t=>{
 const f=fixture(t),module=pathToFileURL(path.resolve('scripts/booklet/run-observability.mjs')).href;
 const script=f.write('writer.mjs',`import fs from 'node:fs';import {withRunLock} from ${JSON.stringify(module)};await withRunLock(process.argv[2],'publication',async()=>{fs.writeFileSync(process.argv[2]+'/entered','yes');});`);
 let child,closed,started;
 await withRunLock(f.dir,'publication',async()=>{
  child=spawn(process.execPath,[script,f.dir],{windowsHide:true,stdio:'ignore'});closed=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  await new Promise(r=>setTimeout(r,100));assert.equal(fs.existsSync(path.join(f.dir,'entered')),false);started=true;
 });
 assert.equal(await closed,0);assert.equal(started,true);assert.equal(fs.readFileSync(path.join(f.dir,'entered'),'utf8'),'yes');
});
test('cached publication can recover missing registration without another generation',async t=>{
 const f=generationFixture(t,{review:true});await drainDependencies(f.options,{runner:f.runner,log:()=>{}});
 const state=loadWorkflow(f.dir);delete state.pages[1];fs.writeFileSync(reviewFile(f.dir),JSON.stringify(state));
 const r=await drainDependencies(f.options,{runner:()=>assert.fail('Registration generated content'),log:()=>{}});
 assert.equal(r.ok,false);assert.ok(loadWorkflow(f.dir).pages[1]);
});
