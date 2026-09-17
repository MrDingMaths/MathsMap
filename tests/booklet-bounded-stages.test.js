import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {nextBoundedWork,prepareBoundedStage,recordBoundedStage,cancelBoundedStage,runBoundedStage,exerciseTeachingContext,groupFeedbackByCause,registerFeedbackScope,BOUNDED_LIMITS} from '../scripts/booklet/bounded-stages.mjs';
import {loadWorkflow,liveWorkflow,updateWorkflow,bytesHash} from '../scripts/booklet/workflow-review.mjs';
import {PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
import {prepareReviewQueue,reviewQueueStatus,finalReviewRecord} from '../scripts/booklet/visual-review-queue.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';

const ref=file=>({path:path.resolve(file),hash:bytesHash(file)});
function fixture(t,{pages=2,ambiguity=false,project=true}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bounded-stages-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 for(let page=1;page<=pages;page++){
  write(`evidence/pages/page-${String(page).padStart(3,'0')}.png`,'source image fixture '+page);write(`evidence/pages/page-${String(page).padStart(3,'0')}.txt`,'Original source '+page);
  write(`semantic-packets/page-${String(page).padStart(3,'0')}.inventory.json`,{pageNumber:page,inventoried:true,layoutPatterns:[{id:'plain',description:'Plain source exercise'}],entries:[{id:'entry-'+page,kind:'question',targetId:'q'+page,description:'Find the value.' ,...(ambiguity?{ambiguity:'Clarify this source value.'}:{})}]});
 }
 const book={id:'fixture',settings:{},topics:Array.from({length:pages},(_,i)=>({id:'t'+(i+1),title:'Topic '+(i+1)})),sections:Array.from({length:pages},(_,i)=>[
  {id:'teach'+(i+1),topicId:'t'+(i+1),phase:'teaching',blocks:[{id:'method'+(i+1),type:'callout',content:'Substitute before evaluating '+(i+1),sourceRefs:[{pageNumber:i+1}]}]},
  {id:'practice'+(i+1),topicId:'t'+(i+1),phase:'practice',blocks:[{id:'q'+(i+1),type:'question',sourceRefs:[{pageNumber:i+1}],classification:{primarySkillId:'substitution'},content:{id:'q'+(i+1)+'-root',prompt:'Find the value.',answer:{short:String(i+1),worked:'Substitute, then calculate '+(i+1)}}}]}
 ]).flat()};
 const projectFile=project?write('project.json',book):null;write('manifest.json',{id:'fixture',pipelinePolicy:PIPELINE_POLICY,selectedPages:Array.from({length:pages},(_,i)=>i+1)});
 const evidence=ref(write('review.txt','Explicit test fixture review evidence, not production acceptance'));
 const options={runDir:dir,...(projectFile?{projectFile}:{})};return {dir,write,book,projectFile,options,evidence};
}
const signed={reviewer:'Fixture reviewer',note:'Explicit review assertion in a test fixture only'};
const job=(plan,stage,id)=>plan.jobs.find(j=>j.stage===stage&&(!id||j.ownershipIds.includes(id)));
const readTicket=prepared=>JSON.parse(fs.readFileSync(prepared.ticket.path));
async function acceptMath(f,page){const pending=job(await nextBoundedWork(f.options),'maths','inventory:'+page),prepared=await prepareBoundedStage(f.options,pending.id),context=readTicket(prepared).job.context;return recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page,key:context.key}]}});}
async function acceptTheory(f,id){const pending=job(await nextBoundedWork(f.options),'theory','exercise:'+id),prepared=await prepareBoundedStage(f.options,pending.id),context=readTicket(prepared).job.context;return recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted',sourceCompared:true,methods:[{statement:'Substitute into the given expression before calculating.',sourceRefs:[{pageNumber:context.pages[0]}]}]}});}
async function acceptAssessment(f,id){const pending=job(await nextBoundedWork(f.options),'assessment','question:'+id),prepared=await prepareBoundedStage(f.options,pending.id);return recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:readTicket(prepared).job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true}}))}});}

test('next work is a read-only compact projection with stable unique ownership',async t=>{
 const f=fixture(t),before=fs.readdirSync(f.dir);const a=await nextBoundedWork(f.options),b=await nextBoundedWork(f.options);
 assert.deepEqual(a.jobs,b.jobs);assert.deepEqual(fs.readdirSync(f.dir),before);assert.equal(fs.existsSync(path.join(f.dir,'workflow/issues.json')),false);
 assert.equal(a.jobs.filter(j=>j.stage==='maths').length,2);assert.ok(a.jobs.every(j=>!Object.hasOwn(j,'context')&&!Object.hasOwn(j,'images')));
 assert.equal(new Set(a.jobs.flatMap(j=>j.ownershipIds)).size,a.jobs.flatMap(j=>j.ownershipIds).length);
 assert.ok(a.jobs.every(j=>j.profile.model==='gpt-6-astra'&&j.profile.effort==='high'&&j.profile.freshContext&&j.profile.speed==='standard'));
});

test('independent reviews rebase unrelated register revisions, while duplicate ownership blocks',async t=>{
 const f=fixture(t),plan=await nextBoundedWork(f.options),one=await prepareBoundedStage(f.options,job(plan,'maths','inventory:1').id),two=await prepareBoundedStage(f.options,job(plan,'maths','inventory:2').id);
 await assert.rejects(()=>prepareBoundedStage(f.options,one.job.id),/Owned by active ticket/);
 for(const prepared of [one,two]){const c=readTicket(prepared).job.context;await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page:c.page,key:c.key}]}});}
 const state=loadWorkflow(f.dir);assert.ok(state.pages[1].mathReview);assert.ok(state.pages[2].mathReview);assert.deepEqual(state.verification.stageClaims,{});
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:one.ticket,result:{...signed,pages:[]}}),/ownership/);
});

test('changed source rejects a stale result without approval and retains recoverable output',async t=>{
 const f=fixture(t),prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'maths','inventory:1').id),c=readTicket(prepared).job.context;
 f.write('evidence/pages/page-001.txt','Changed source input');
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page:1,key:c.key}]}}),/stale/);
 const state=loadWorkflow(f.dir);assert.equal(state.pages[1].mathReview,null);assert.equal(state.verification.stageClaims[prepared.job.id].id,readTicket(prepared).id);
 assert.ok(fs.readdirSync(path.dirname(prepared.ticket.path)).some(n=>n.startsWith('result-')));
 const cancelled=await cancelBoundedStage(f.options,{ticket:prepared.ticket,reason:'Review changed source inputs'});assert.equal(cancelled.inspectionCredited,false);
 const refreshed=job(await nextBoundedWork(f.options),'maths','inventory:1');assert.equal(refreshed.blockers.length,0);assert.notEqual(refreshed.dependencyHash,prepared.job.dependencyHash);
});

test('exercise method and answer reuse survives unrelated exercise changes',async t=>{
 const f=fixture(t);await acceptTheory(f,'t1');await acceptTheory(f,'t2');await acceptAssessment(f,'q1');await acceptAssessment(f,'q2');
 let next=await nextBoundedWork(f.options);assert.deepEqual(next.reuse.questions,['q1','q2']);assert.deepEqual(next.reuse.teaching,['exercise:t1','exercise:t2']);
 f.book.sections.find(s=>s.id==='teach1').blocks[0].content='Use the revised first-exercise method.';f.write('project.json',f.book);
 next=await nextBoundedWork(f.options);assert.deepEqual(next.reuse.questions,['q2']);assert.deepEqual(next.reuse.teaching,['exercise:t2']);
 assert.ok(job(next,'assessment','question:q1').blockers.some(b=>b.includes('teaching-method')));
 assert.ok(job(next,'theory','exercise:t1'));assert.equal(job(next,'theory','exercise:t2'),undefined);
});

test('a multi-question response is atomic when any record is missing or false acceptance is attempted',async t=>{
 const f=fixture(t,{pages:1});const section=f.book.sections.find(s=>s.phase==='practice');section.blocks.push({...structuredClone(section.blocks[0]),id:'q2',content:{id:'q2-root',prompt:'Second question',answer:{short:'2'}}});f.write('project.json',f.book);
 await acceptTheory(f,'t1');const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment').id);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:[{id:'question:q1',outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true}},{id:'question:q2',outcome:'passed',checks:{answer:true}}]}}),/taught-method/);
 assert.deepEqual(loadWorkflow(f.dir).verification.entries,{});
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:[{id:'question:q1',outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true}}]}}),/exactly once/);
 assert.deepEqual(loadWorkflow(f.dir).verification.entries,{});
});

test('practice-only exercises use configured and nested source-linked teaching evidence',async t=>{
 const f=fixture(t,{pages:2});f.book.sections=f.book.sections.filter(s=>s.phase==='practice');
 for(const [i,s]of f.book.sections.entries())s.blocks[0].sourceReview={constituents:[{sourceReview:{teachingContext:{pdfPages:[i+1],methodNote:'Retained source method '+(i+1),mappingNote:'Question-specific mapping'}}}]};
 const pdf=f.write('source.pdf','Original teaching PDF fixture');const external={id:'teaching-reference',pdfPath:pdf,pdfSha256:bytesHash(pdf),pages:[1,2].map(p=>({pdfPage:p,imagePath:path.join(f.dir,`evidence/pages/page-00${p}.png`),imageSha256:bytesHash(path.join(f.dir,`evidence/pages/page-00${p}.png`)),inspection:{reviewer:'Earlier fixture reviewer',note:'Retained source observation '+p}}))};
 f.book.source={contentScope:'practice-only',provenance:{directory:f.dir}};f.write('teaching-context-index.json',{externalTeachingReferences:[external]});f.write('project.json',f.book);
 const before=exerciseTeachingContext(f.book,liveWorkflow(f.dir,[1,2]),'t1',{runDir:f.dir});assert.equal(before.teaching.length,0);assert.deepEqual(before.pages,[1]);assert.equal(before.suppliedNotes[0].methodNote,'Retained source method 1');assert.equal(before.externalReferences[0].pages.length,1);
 const next=await nextBoundedWork(f.options);assert.equal(job(next,'theory','exercise:t1').blockers.length,0);await acceptTheory(f,'t1');await acceptAssessment(f,'q1');
 external.pages[1].inspection.note='An unrelated exercise observation';f.write('teaching-context-index.json',{externalTeachingReferences:[external]});
 assert.equal(exerciseTeachingContext(f.book,liveWorkflow(f.dir),'t1',{runDir:f.dir}).dependencyHash,before.dependencyHash);
 assert.ok((await nextBoundedWork(f.options)).reuse.questions.includes('q1'));
 external.pages[0].inspection.note='Changed source method mapping for this exercise';f.write('teaching-context-index.json',{externalTeachingReferences:[external]});assert.ok(!(await nextBoundedWork(f.options)).reuse.questions.includes('q1'));
 f.write('evidence/pages/page-001.png','Changed original teaching image');assert.ok(job(await nextBoundedWork(f.options),'theory','exercise:t1').blockers.some(b=>b.includes('changed')));
 const configured=structuredClone(f.book);delete configured.sections[0].blocks[0].sourceReview;delete configured.source;
 assert.deepEqual(exerciseTeachingContext(configured,liveWorkflow(f.dir),'t1',{runDir:f.dir,config:{topics:[{id:'t1',teachingPages:[2]}]}}).pages,[2]);
});

test('changing only an exercise config teaching selection invalidates its accepted question',async t=>{
 const f=fixture(t),config={topics:[{id:'t1',teachingPages:[1]},{id:'t2',teachingPages:[2]}]};f.options.configFile=f.write('config.json',config);
 await acceptTheory(f,'t1');await acceptTheory(f,'t2');await acceptAssessment(f,'q1');await acceptAssessment(f,'q2');
 const record=loadWorkflow(f.dir).verification.teachingContexts.t1;assert.equal(record.dependencyScope.configFile,f.options.configFile);assert.deepEqual(record.dependencyScope.sourcePages,[1]);assert.ok(record.sourceArtifacts.length);
 config.topics[0].teachingPages=[1,2];f.write('config.json',config);
 const next=await nextBoundedWork(f.options);assert.deepEqual(next.reuse.questions,['q2']);assert.deepEqual(next.reuse.teaching,['exercise:t2']);assert.ok(job(next,'assessment','question:q1').blockers.some(b=>b.includes('teaching-method')));
});

test('named shared feedback causes preserve exact boundaries and reject foreign fields atomically',async t=>{
 const f=fixture(t,{pages:3,ambiguity:true});f.book.source={inventory:{entries:[1,2,3].flatMap(page=>JSON.parse(fs.readFileSync(path.join(f.dir,`semantic-packets/page-00${page}.inventory.json`))).entries.map(e=>({...e,pageNumber:page})))}};f.write('project.json',f.book);await updateWorkflow(f.dir,'load fixture inventory',state=>Object.assign(state,liveWorkflow(f.dir,[1,2,3])));
 const state=loadWorkflow(f.dir),issues=Object.values(state.issues),issueIds=issues.filter(i=>i.page<=2).map(i=>i.id);
 await registerFeedbackScope(f.options,{...signed,expectedRevision:state.revision,sharedCauseId:'source-description',issueIds,targets:[1,2].map(page=>({page,scope:'inventory',targetId:'entry-'+page,fields:['/description']})),occurrenceAudit:true,artifacts:[f.evidence]});
 const groups=groupFeedbackByCause(loadWorkflow(f.dir));assert.equal(groups.length,2);assert.deepEqual(groups.find(g=>g.sharedCauseId).pages,[1,2]);
 const plan=await nextBoundedWork(f.options),pending=plan.jobs.find(j=>j.stage==='feedback'&&j.ownershipIds.length===2),prepared=await prepareBoundedStage(f.options,pending.id);
 assert.equal(readTicket(prepared).job.context.targets[0].original,'Find the value.');
 const result={...signed,resolutions:issueIds.map(id=>({id,status:'corrected',reason:'Source description clarified',correctionId:'clarified'})),corrections:[{id:'clarified',reason:'Source description clarified',sourceRefs:[{pageNumber:1},{pageNumber:2}],patches:[1,2].map(page=>({scope:'inventory',page,targetId:'entry-'+page,field:'/description',original:'Find the value.',corrected:'Find the stated value.'}))}]};
 const bad=structuredClone(result);bad.corrections[0].patches[1].field='/ambiguity';
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:bad}),/exact feedback targets/);assert.equal(loadWorkflow(f.dir).corrections.length,0);assert.ok(Object.values(loadWorkflow(f.dir).issues).every(i=>i.status==='pending'));
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result});assert.equal(loadWorkflow(f.dir).corrections.length,1);assert.equal(Object.values(loadWorkflow(f.dir).issues).filter(i=>i.status==='pending').length,1);
});

function visualFixture(t){
 const f=fixture(t,{pages:0});const projectHash=projectReviewHash(f.book),input={mode:'final',project:{...ref(f.projectFile),contentHash:projectHash},renderer:'test-renderer',assets:{},key:'settlement-fixture',sourceArtifacts:[f.evidence],editions:{}};
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const images=Array.from({length:5},(_,i)=>({page:i+1,...ref(f.write(`${edition}-${i+1}.png`,'Full-page image fixture '+i))}));
  const manifest={mode:'full',passed:true,edition,projectHash,renderer:input.renderer,workflowKey:input.key,assets:{},images,pdf:ref(f.write(edition+'.pdf','PDF fixture')),pages:images.map(i=>({page:i.page,hash:'page-'+i.page}))};input.editions[edition]={manifest:ref(f.write(edition+'.json',manifest)),images};
 }
 return {...f,input,overrides:{queueDependencies:{renderer:input.renderer,workflow:{settled:{key:input.key,project:{hash:projectHash}}}}}};
}
test('visual singleton preserves failed output, resumes batches and still requires every final page',async t=>{
 const f=visualFixture(t);await prepareReviewQueue(f.dir,f.input,f.overrides.queueDependencies);
 let plan=await nextBoundedWork(f.options,f.overrides),visual=plan.jobs.filter(j=>j.stage==='visual');assert.deepEqual(visual.map(j=>j.ownershipIds.length),[8,8,8,1]);assert.equal(BOUNDED_LIMITS.renderedPages,8);
 const prepared=await prepareBoundedStage(f.options,visual[0].id,f.overrides);await assert.rejects(()=>prepareBoundedStage(f.options,visual[1].id,f.overrides),/active visual review/);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted'}},f.overrides),/explicitly/);
 let queue=await reviewQueueStatus(f.dir,f.overrides.queueDependencies);assert.equal(queue.reviewed,0);assert.equal(queue.active.id,readTicket(prepared).reviewId);
 await updateWorkflow(f.dir,'unrelated fixture review',state=>{state.verification.unrelated='preserved';});
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true}},f.overrides);
 queue=await reviewQueueStatus(f.dir,f.overrides.queueDependencies);assert.equal(queue.reviewed,8);
 await assert.rejects(()=>finalReviewRecord(f.dir,{...signed,expectedRevision:queue.revision,sessionKey:queue.sessionKey},f.overrides.queueDependencies),/Every page/);
 while((plan=await nextBoundedWork(f.options,f.overrides)).jobs.some(j=>j.stage==='visual')){
  const p=await prepareBoundedStage(f.options,job(plan,'visual').id,f.overrides);assert.ok(p.job.ownershipIds.length<=8);await recordBoundedStage(f.options,{ticket:p.ticket,result:{...signed,outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true}},f.overrides);
 }
 queue=await reviewQueueStatus(f.dir,f.overrides.queueDependencies);assert.equal(queue.reviewed,25);
 const complete=await finalReviewRecord(f.dir,{...signed,expectedRevision:queue.revision,sessionKey:queue.sessionKey},f.overrides.queueDependencies);assert.equal(Object.keys(complete.editions).length,5);assert.ok(Object.values(complete.editions).every(e=>e.pages.length===5));
});

test('an unresolved reviewer finding blocks retry and injected runners retain measured attempts',async t=>{
 const f=fixture(t,{pages:1}),pending=job(await nextBoundedWork(f.options),'maths');let calls=0;
 const result=await runBoundedStage(f.options,pending.id,{runner:async request=>{calls++;assert.equal(request.runDir,f.dir);assert.equal(request.profile,'review');assert.ok(request.images.length);return {result:{...signed,outcome:'needs-review',findings:[{id:'new-finding',page:1,message:'Source interpretation needs an editorial decision'}]},metrics:{usage:{input_tokens:50,cached_input_tokens:20,output_tokens:10},elapsedMs:5}};}});
 assert.equal(result.ok,false);assert.equal(calls,1);assert.equal(loadWorkflow(f.dir).pages[1].mathReview,null);assert.equal(loadWorkflow(f.dir).verification.stageClaims[pending.id].blockedResult.findings.length,1);
 await assert.rejects(()=>runBoundedStage(f.options,pending.id,{runner:async()=>assert.fail('No silent second model call')}),/Owned by active ticket/);
 const events=fs.readFileSync(path.join(f.dir,'semantic-packets/attempt-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(events.filter(e=>e.event==='started').length,1);assert.ok(events.some(e=>e.metrics?.usage?.input_tokens===50));
 await cancelBoundedStage(f.options,{ticket:result.ticket,reason:'Bundle the new editorial finding before another review'});
 assert.equal((await nextBoundedWork(f.options)).active.length,0);
 const persisted=Object.values(liveWorkflow(f.dir).issues).find(i=>i.origin==='review');assert.equal(persisted.status,'pending');assert.equal(persisted.reviewJob.id,pending.id);assert.ok(persisted.sourceHashes[1].source);
 const feedback=job(await nextBoundedWork(f.options),'feedback'),review=await prepareBoundedStage(f.options,feedback.id);
 await recordBoundedStage(f.options,{ticket:review.ticket,result:{...signed,resolutions:[{id:persisted.id,status:'retained',reason:'The inspected source definition resolves the interpretation.'}],corrections:[]}});
 assert.equal(liveWorkflow(f.dir).issues[persisted.id].status,'retained');assert.equal(job(await nextBoundedWork(f.options),'maths').blockers.length,0);
 const revised=await prepareBoundedStage(f.options,pending.id);assert.ok(readTicket(revised).job.context.decisions.some(d=>d.id===persisted.id&&d.reason.includes('source definition')));
 await cancelBoundedStage(f.options,{ticket:revised.ticket,reason:'Fixture inspected the retained-decision handoff'});
});

test('review findings reject foreign source ownership without writing an issue',async t=>{
 const f=fixture(t,{pages:1}),prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'maths').id);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'needs-review',findings:[{id:'foreign',page:2,message:'Another source page'}]}}),/assigned source pages/);
 assert.equal(Object.keys(loadWorkflow(f.dir).issues).length,0);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'needs-review',findings:[{id:'foreign',page:1,targetId:'unassigned-question',message:'Another question'}]}}),/outside the assigned ownership/);
 assert.equal(Object.keys(loadWorkflow(f.dir).issues).length,0);
});
