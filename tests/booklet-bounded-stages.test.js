import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {nextBoundedWork,prepareBoundedStage,recordBoundedStage,cancelBoundedStage,runBoundedStage,executePreparedBoundedStage,exerciseTeachingContext,groupFeedbackByCause,registerFeedbackScope,assessmentSkillDefinitions,boundedPromptPayload,deliveredTeachingPages,BOUNDED_LIMITS} from '../scripts/booklet/bounded-stages.mjs';
import {loadWorkflow,liveWorkflow,updateWorkflow,bytesHash,applyDecisions,settlementKey} from '../scripts/booklet/workflow-review.mjs';
import {PIPELINE_POLICY,createArtifactVerifier,questionTeachingDependencies} from '../scripts/booklet/import-verification.mjs';
import {prepareReviewQueue,reviewQueueStatus,finalReviewRecord} from '../scripts/booklet/visual-review-queue.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';

const ref=file=>({path:path.resolve(file),hash:bytesHash(file)});
test('supplemental teaching citations require the assigned, delivered primary image with matching source hash',()=>{
 const run=path.resolve('fixture-run'),image=path.join(run,'evidence/pages/page-007.png'),source={path:image,hash:'current-source',page:7};
 const base={context:{pages:[6],evidence:[source]},images:[image],evidence:[source]};
 assert.deepEqual([...deliveredTeachingPages(base,run)],[6,7]);
 for(const change of [
  {images:[]},
  {evidence:[{...source,hash:'different-source'}]},
  {context:{pages:[6],evidence:[{...source,path:path.join(run,'collateral/page-007.png')}]}},
  {context:{pages:[6],evidence:[{...source,path:path.resolve('other-run/evidence/pages/page-007.png')}]}},
  {context:{pages:[6],evidence:[{...source,page:99}]}}
 ])assert.deepEqual([...deliveredTeachingPages({...base,...change},run)],[6]);
 assert.deepEqual(base.context.pages,[6]);
});
test('lean repair prompts preserve exact metadata parents including pagination and artifact references',()=>{
 const sourceReview={responses:[{targetId:'part-a',kind:'working'}],sourcePagination:{page:8,breakBefore:true},arrangements:[{targetId:'q',order:['part-a']}],artifacts:[{path:'/retained-source.png',hash:'original-source'}]};
 const job={stage:'assessment',ownershipIds:['question:q'],dependencyHash:'unchanged',images:[],evidence:[],context:{lean:true,questions:[{id:'q',sourceReview}]}};
 const payload=boundedPromptPayload(job);
 assert.deepEqual(payload.context.questions[0].sourceReview,sourceReview);
 assert.notEqual(payload.context.questions[0].sourceReview,sourceReview);
 assert.equal(payload.dependencyHash,'unchanged');
});
test('content review receives real taxonomy alternatives for unclassified questions',()=>{
 const catalog=[{id:'notation',blurb:'Use algebraic notation.'},{id:'factorise',blurb:'Extract the common factor.'}];
 const questions=[{classification:{primarySkillId:'notation',secondarySkillIds:['missing']}},{}];
 const result=assessmentSkillDefinitions(questions,catalog,['factorise','factorise']);
 assert.deepEqual(result.skillDefinitions,catalog);
 assert.deepEqual(result.missingSkillIds,['missing']);
 assert.deepEqual(assessmentSkillDefinitions([{}],catalog,['factorise']).skillDefinitions,[catalog[1]]);
 assert.deepEqual(assessmentSkillDefinitions(questions,catalog).skillDefinitions,[catalog[0]]);
});
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
test('artifact checks read once per snapshot and reject changed evidence in the next snapshot',t=>{
 const f=fixture(t),file=f.write('shared-evidence.txt','original bytes'),original=ref(file),verify=createArtifactVerifier();
 const read=fs.readFileSync;let reads=0;
 fs.readFileSync=function(name,...args){if(path.resolve(String(name))===file)reads++;return read.call(this,name,...args);};
 try{
  assert.equal(verify(original),true);assert.equal(verify({...original}),true);
  assert.equal(verify({...original,hash:'0'.repeat(64)}),false);assert.equal(reads,1);
 }finally{fs.readFileSync=read;}
 fs.writeFileSync(file,'modified bytes');
 const fresh=createArtifactVerifier();assert.equal(fresh(original),false);assert.equal(fresh(ref(file)),true);
});
async function acceptMath(f,page){const pending=job(await nextBoundedWork(f.options),'maths','inventory:'+page),prepared=await prepareBoundedStage(f.options,pending.id),context=readTicket(prepared).job.context;return recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page,key:context.key}]}});}
async function acceptTheory(f,id){const pending=job(await nextBoundedWork(f.options),'theory','exercise:'+id),prepared=await prepareBoundedStage(f.options,pending.id),context=readTicket(prepared).job.context;return recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted',sourceCompared:true,methods:[{statement:'Substitute into the given expression before calculating.',sourceRefs:[{pageNumber:context.pages[0]}]}]}});}
async function acceptAssessment(f,id){const pending=job(await nextBoundedWork(f.options),'assessment','question:'+id),prepared=await prepareBoundedStage(f.options,pending.id);return recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:readTicket(prepared).job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true}}))}});}

test('next work is a read-only compact projection with stable unique ownership',async t=>{
 const f=fixture(t),before=fs.readdirSync(f.dir);const a=await nextBoundedWork(f.options),b=await nextBoundedWork(f.options);
 assert.deepEqual(a.jobs,b.jobs);assert.deepEqual(fs.readdirSync(f.dir),before);assert.equal(fs.existsSync(path.join(f.dir,'workflow/issues.json')),false);
 assert.equal(a.jobs.filter(j=>j.stage==='maths').length,2);assert.ok(a.jobs.every(j=>!Object.hasOwn(j,'context')&&!Object.hasOwn(j,'images')));
 assert.equal(new Set(a.jobs.flatMap(j=>j.ownershipIds)).size,a.jobs.flatMap(j=>j.ownershipIds).length);
 assert.ok(a.jobs.every(j=>j.profile.model==='gpt-6.1-sol'&&j.profile.effort==='high'&&j.profile.freshContext&&j.profile.speed==='standard'));
});

test('three-pass structured finding identities stay with their actual question instead of the first page question',async t=>{
 const f=fixture(t),manifest=JSON.parse(fs.readFileSync(path.join(f.dir,'manifest.json')));
 manifest.reviewProfile='textbook-three-pass-v1';f.write('manifest.json',manifest);
 f.book.source={reviewProfile:manifest.reviewProfile,inventory:{entries:[{id:'source-part',targetId:'q2-root',pageNumber:1}]}};
 f.book.sections[3].blocks[0].sourceRefs=[{pageNumber:1}];f.write('project.json',f.book);
 const inventory=JSON.parse(fs.readFileSync(path.join(f.dir,'semantic-packets/page-001.inventory.json')));
 inventory.findings=[{id:'specific',targetId:'q2-root',description:'Inspect the later question.'},{id:'question-specific',questionId:'source-part',description:'Inspect the independently inventoried later part.'},{id:'general',description:'Preserve the page-wide source note.'}];
 f.write('semantic-packets/page-001.inventory.json',inventory);
 const plan=await nextBoundedWork(f.options),first=job(plan,'assessment','question:q1'),later=job(plan,'assessment','question:q2');
 const one=readTicket(await prepareBoundedStage(f.options,first.id)),two=readTicket(await prepareBoundedStage(f.options,later.id));
 assert.ok(one.job.context.pendingIssues.some(i=>i.id.includes('general')));
 assert.ok(!one.job.context.pendingIssues.some(i=>i.id.includes('specific')));
 assert.ok(two.job.context.pendingIssues.some(i=>i.id.includes('specific')));
 assert.ok(two.job.context.pendingIssues.some(i=>i.id.includes('question-specific')));
});

test('three-pass reference findings use explicit answer parents, category owners and teaching context, while unknown identities stay separate',async t=>{
 const f=fixture(t),manifest=JSON.parse(fs.readFileSync(path.join(f.dir,'manifest.json')));manifest.reviewProfile='textbook-three-pass-v1';f.write('manifest.json',manifest);
 f.book.source={reviewProfile:manifest.reviewProfile};
 f.book.sections[1].blocks[0].sourceReview={sourceIdentity:{category:'Concept Check'}};
 f.book.sections[3].blocks[0].sourceRefs=[{pageNumber:1}];f.book.sections[3].blocks[0].sourceReview={sourceIdentity:{category:'Enrichment'}};
 f.write('project.json',f.book);
 const inventory=JSON.parse(fs.readFileSync(path.join(f.dir,'semantic-packets/page-001.inventory.json')));
 inventory.entries.push({id:'answer-reference',kind:'answer',parentId:'q2-root',exclusionReason:'Teacher answer evidence only.'},{id:'enrichment-heading',kind:'teaching',sourceLabel:'enrichment',exclusionReason:'Practice category heading.'},{id:'context-example',kind:'example',exclusionReason:'Excluded standalone teaching context.'});
 inventory.findings=[{id:'answer-parent',targetId:'answer-reference',description:'Check the matching teacher answer.'},{id:'category-owner',targetId:'enrichment-heading',description:'Restore the source heading once.'},{id:'context-error',targetId:'context-example',description:'Retain the original teaching-reference typo as evidence.'},{id:'unknown',targetId:'missing-later-question',description:'This explicit unknown identity must not be assigned to another question.'}];
 f.write('semantic-packets/page-001.inventory.json',inventory);
 const plan=await nextBoundedWork(f.options),one=readTicket(await prepareBoundedStage(f.options,job(plan,'assessment','question:q1').id)),two=readTicket(await prepareBoundedStage(f.options,job(plan,'assessment','question:q2').id));
 assert.ok(one.job.context.pendingIssues.some(issue=>issue.id.endsWith('context-error')));
 assert.ok(two.job.context.pendingIssues.some(issue=>issue.id.endsWith('answer-parent')));
 assert.ok(two.job.context.pendingIssues.some(issue=>issue.id.endsWith('category-owner')));
 assert.ok(![...one.job.context.pendingIssues,...two.job.context.pendingIssues].some(issue=>issue.id.endsWith('unknown')));
 assert.ok(plan.jobs.some(job=>job.stage==='feedback'&&job.ownershipIds.some(id=>id.endsWith('unknown'))));
});

test('lean assessment scopes author mapping notes to owned questions while retaining all teaching evidence',async t=>{
 const f=fixture(t,{pages:5}),manifest=JSON.parse(fs.readFileSync(path.join(f.dir,'manifest.json')));manifest.reviewProfile='textbook-three-pass-v1';f.write('manifest.json',manifest);
 f.book.sections=f.book.sections.filter(section=>section.phase==='practice');
 for(const [index,section]of f.book.sections.entries()){section.topicId='t1';section.blocks[0].sourceReview={teachingContext:{pdfPages:[1,2,3,4,5],methodNote:'Use the retained taught method.',mappingNote:'Owned question mapping '+(index+1)}};}
 f.book.source={reviewProfile:manifest.reviewProfile,contentScope:'practice-only'};f.write('project.json',f.book);
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[1,2,3,4,5]}]});
 const plan=await nextBoundedWork(f.options),first=plan.jobs.find(job=>job.stage==='assessment'&&job.ownershipIds.includes('question:q1'));
 assert.equal(first.ownershipIds.length,4);
 const prepared=await prepareBoundedStage(f.options,first.id),ticket=readTicket(prepared);
 assert.equal(ticket.job.context.teaching.suppliedNotes.length,4);
 assert.ok(ticket.job.context.teaching.suppliedNotes.every(note=>!note.mappingNote.endsWith('5')));
 assert.deepEqual(ticket.job.context.teaching.pages,[1,2,3,4,5]);
 for(let page=1;page<=5;page++)assert.ok(prepared.images.includes(path.join(f.dir,`evidence/pages/page-00${page}.png`)));
 assert.equal(exerciseTeachingContext(f.book,liveWorkflow(f.dir,[1,2,3,4,5]),'t1',{runDir:f.dir}).suppliedNotes.length,5);
});

test('lean decision projection keeps owned answer references and source context without repeating another question review',async t=>{
 const f=fixture(t),manifest=JSON.parse(fs.readFileSync(path.join(f.dir,'manifest.json')));manifest.reviewProfile='textbook-three-pass-v1';f.write('manifest.json',manifest);
 f.book.sections=f.book.sections.filter(section=>section.phase==='practice');
 for(const section of f.book.sections){section.topicId='t1';section.blocks[0].sourceRefs=[{pageNumber:1}];section.blocks[0].content.prompt+=' '.repeat(12000);section.blocks[0].sourceReview={teachingContext:{pdfPages:[1],methodNote:'Retained source method.'}};}
 const entries=[{id:'teacher-owned',kind:'answer',parentId:'q1-root',exclusionReason:'Teacher reference only.'}];
 f.book.source={reviewProfile:manifest.reviewProfile,contentScope:'practice-only',inventory:{entries}};f.write('project.json',f.book);
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[1]}]});
 await updateWorkflow(f.dir,'fixture retained source decisions',state=>{
  for(const [id,identity]of [['owned','q1-root'],['other','q2-root'],['context','context-example'],['answer','teacher-owned']])state.issues[id]={id,origin:'review',page:1,status:'retained',message:JSON.stringify({targetId:identity,description:'Synthetic scoped source observation.'}),resolution:{status:'retained',reason:'Explicit test observation '+id,reviewer:'Fixture reviewer',evidence:[f.evidence]}};
 });
 const plan=await nextBoundedWork(f.options),prepared=await prepareBoundedStage(f.options,job(plan,'assessment','question:q1').id),context=readTicket(prepared).job.context;
 assert.deepEqual(context.questions.map(question=>question.id),['q1']);
 assert.ok(context.decisions.some(decision=>decision.id==='owned'));
 assert.ok(context.decisions.some(decision=>decision.id==='answer'));
 assert.ok(context.decisions.some(decision=>decision.id==='context'));
 assert.ok(!context.decisions.some(decision=>decision.id==='other'));
 assert.ok(!context.teaching.decisions.some(decision=>['owned','other','answer'].includes(decision.id)));
 assert.ok(context.teaching.decisions.some(decision=>decision.id==='context'));
 const legacy=structuredClone(f.book),state=structuredClone(liveWorkflow(f.dir));delete legacy.source.reviewProfile;delete state.reviewProfile;
 assert.ok(exerciseTeachingContext(legacy,state,'t1',{runDir:f.dir,config:{topics:[{id:'t1',teachingPages:[1]}]}}).decisions.some(decision=>decision.id==='other'));
});

test('partial lean review applies only source-page corrections present in its project and retains missing-target guards',async t=>{
 const f=fixture(t),manifest=JSON.parse(fs.readFileSync(path.join(f.dir,'manifest.json')));f.options.selectedPages=[1];manifest.reviewProfile='textbook-three-pass-v1';f.write('manifest.json',manifest);
 f.book.source={reviewProfile:manifest.reviewProfile};f.book.sections=f.book.sections.slice(0,2);f.write('project.json',f.book);
 const inventory=JSON.parse(fs.readFileSync(path.join(f.dir,'semantic-packets/page-001.inventory.json')));inventory.findings=[{id:'general',description:'Synthetic page-wide note'}];f.write('semantic-packets/page-001.inventory.json',inventory);
 await updateWorkflow(f.dir,'fixture later-page correction',state=>{state.corrections.push({id:'later',status:'approved',reason:'Synthetic later-page repair',sourceRefs:[{pageNumber:2}],evidence:[f.evidence],patches:[{scope:'author',page:2,targetId:'q2-root',field:'/prompt',original:'Find the value.',corrected:'Calculate the value.'}]});});
 assert.ok((await nextBoundedWork(f.options)).jobs.some(j=>j.ownershipIds.includes('question:q1')));
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment','question:q1').id),request=readTicket(prepared);
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:request.job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}})),resolutions:request.job.context.pendingIssues.map(i=>({id:i.id,status:'retained',reason:'Synthetic explicit source note resolution'}))}});
 await updateWorkflow(f.dir,'fixture malformed local correction',state=>{state.corrections.push({id:'missing',status:'approved',reason:'Synthetic missing local target',sourceRefs:[{pageNumber:1}],evidence:[f.evidence],patches:[{scope:'author',page:1,targetId:'missing',field:'/prompt',original:'Find',corrected:'Calculate'}]});});
 await assert.rejects(()=>nextBoundedWork(f.options),/Missing correction target missing/);
});

test('independent reviews rebase unrelated register revisions, while duplicate ownership blocks',async t=>{
 const f=fixture(t),plan=await nextBoundedWork(f.options),one=await prepareBoundedStage(f.options,job(plan,'maths','inventory:1').id),two=await prepareBoundedStage(f.options,job(plan,'maths','inventory:2').id);
 assert.match(one.prompt,/without spawning, delegating to, or waiting for other agents/);
 assert.match(one.prompt,/if evidence is missing, report the blocker instead of waiting/);
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

test('teaching may cite an assigned embedded question page only when its primary image was delivered',async t=>{
 const f=fixture(t,{pages:3});f.book.sections=f.book.sections.filter(s=>s.phase==='practice'&&s.topicId==='t1');f.write('project.json',f.book);
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[2]}]});
 const primary=ref(path.join(f.dir,'evidence/pages/page-001.png')),collateral=ref(path.join(f.dir,'evidence/pages/page-003.png'));
 await updateWorkflow(f.dir,'Fixture embedded context',state=>{Object.assign(state,liveWorkflow(f.dir,[1,2,3]));state.issues['review-embedded-context']={id:'review-embedded-context',origin:'review',page:2,status:'retained',message:'Reviewed local definition',resolution:{reason:'The assigned exercise includes a local definition on its question page.',reviewer:'Fixture reviewer',evidence:[primary,collateral]}};});
 const pending=job(await nextBoundedWork(f.options),'theory','exercise:t1'),prepared=await prepareBoundedStage(f.options,pending.id),ticket=readTicket(prepared);
 assert.deepEqual(ticket.job.context.pages,[2]);assert.deepEqual(ticket.job.context.dependencyScope.sourcePages,[1]);assert.ok(prepared.images.includes(primary.path)&&prepared.images.includes(collateral.path));
 const result=pageNumber=>({...signed,outcome:'accepted',sourceCompared:true,methods:[{statement:'Use the local definition explicitly supplied in the assigned question.',sourceRefs:[{pageNumber}]}]});
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:result(3)}),/assigned source references/);
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:result(1)});
 assert.deepEqual(loadWorkflow(f.dir).verification.teachingContexts.t1.methods[0].sourceRefs,[{pageNumber:1}]);
});

test('an assigned practice page cannot support teaching acceptance when its image was not supplied',async t=>{
 const f=fixture(t);f.book.sections=f.book.sections.filter(s=>s.phase==='practice'&&s.topicId==='t1');f.write('project.json',f.book);
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[2]}]});
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'theory','exercise:t1').id);
 assert.ok(!prepared.images.includes(path.join(f.dir,'evidence/pages/page-001.png')));
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted',sourceCompared:true,methods:[{statement:'Unseen embedded context cannot be accepted.',sourceRefs:[{pageNumber:1}]}]}}),/assigned source references/);
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

test('explicit external teaching retains PDF identity through nested context, citations and review reuse',async t=>{
 const f=fixture(t);f.book.sections=f.book.sections.filter(s=>s.phase==='practice');
 const config={topics:[{id:'t1',teachingPages:[9,10,11,12,13]},{id:'t2',teachingPages:[2]}]};f.options.configFile=f.write('config.json',config);
 for(const p of config.topics[0].teachingPages)f.write(`evidence/pages/page-${String(p).padStart(3,'0')}.png`,'Primary teaching image '+p);
 const external=(id,page)=>{
  const pdfPath=f.write(`${id}.pdf`,'Original PDF '+id),imagePath=f.write(`${id}-${page}.png`,'Original image '+id);
  return {id,pdfPath,pdfSha256:bytesHash(pdfPath),pages:[{pdfPage:page,imagePath,imageSha256:bytesHash(imagePath)}]};
 };
 const direct=external('chapter-one',47),nested=external('appendix',6),broad=external('broad-index',47);
 broad.pages.unshift({pdfPage:9,imagePath:path.join(f.dir,'evidence/pages/page-009.png'),imageSha256:bytesHash(path.join(f.dir,'evidence/pages/page-009.png'))});
 f.book.sections[0].blocks[0].sourceReview={externalTeachingReferences:[direct],constituents:[{sourceReview:{externalTeachingReferences:[nested]}}]};
 f.book.source={contentScope:'practice-only',provenance:{directory:f.dir}};f.write('teaching-context-index.json',{externalTeachingReferences:[broad]});f.write('project.json',f.book);
 const context=()=>exerciseTeachingContext(f.book,liveWorkflow(f.dir,[1,2]),'t1',{runDir:f.dir,config,configFile:f.options.configFile});
 const before=context();assert.deepEqual(before.pages,[9,10,11,12,13]);assert.deepEqual(before.dependencyScope.pages,before.pages);assert.deepEqual(before.problems,[]);
 assert.deepEqual(before.externalReferences.map(r=>[r.id,r.pages.map(p=>p.pdfPage)]),[['broad-index',[9]],['chapter-one',[47]],['appendix',[6]]]);
 for(const r of [direct,nested]){assert.ok(before.evidence.some(e=>e.path===r.pdfPath));assert.ok(before.evidence.some(e=>e.path===r.pages[0].imagePath));}
 assert.equal(fs.existsSync(path.join(f.dir,'evidence/pages/page-047.png')),false);
 const pending=job(await nextBoundedWork(f.options),'theory','exercise:t1');assert.deepEqual(pending.blockers,[]);
 const prepared=await prepareBoundedStage(f.options,pending.id);
 assert.ok(prepared.images.includes(direct.pages[0].imagePath));assert.ok(prepared.images.includes(nested.pages[0].imagePath));assert.ok(!prepared.images.includes(broad.pages[1].imagePath));
 assert.match(prepared.prompt,/externalReferenceId/);
 const accepted={...signed,outcome:'accepted',sourceCompared:true,methods:[
  {statement:'Use the externally defined floor function.',sourceRefs:[{externalReferenceId:'chapter-one',pageNumber:47}]},
  {statement:'Use the constituent question external method.',sourceRefs:[{externalReferenceId:'appendix',pageNumber:6}]},
  {statement:'Use the primary source method.',sourceRefs:[{pageNumber:9}]}
 ]};
 for(const reference of [{externalReferenceId:'unknown',pageNumber:47},{externalReferenceId:'chapter-one',pageNumber:48},{pageNumber:47}]){
  const invalid=structuredClone(accepted);invalid.methods[0].sourceRefs=[reference];
  await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:invalid}),/assigned (external )?source references/);
  assert.equal(loadWorkflow(f.dir).verification.teachingContexts?.t1,undefined);
 }
 f.write('appendix-6.png','Changed nested external image');
 assert.notEqual(context().dependencyHash,before.dependencyHash);assert.match(context().problems.join('\n'),/External teaching image is missing or changed/);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:accepted}),/stale/);
 f.write('appendix-6.png','Original image appendix');
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:accepted});
 const saved=loadWorkflow(f.dir).verification.teachingContexts.t1;
 assert.deepEqual(saved.methods[0].sourceRefs,[{externalReferenceId:'chapter-one',pageNumber:47}]);assert.deepEqual(saved.dependencyScope.pages,[9,10,11,12,13]);
 assert.ok(saved.sourceArtifacts.some(a=>a.path===direct.pdfPath));assert.ok(saved.sourceArtifacts.some(a=>a.path===nested.pages[0].imagePath));
 await acceptTheory(f,'t2');await acceptAssessment(f,'q1');await acceptAssessment(f,'q2');
 const localScope=questionTeachingDependencies(loadWorkflow(f.dir),f.book,f.book.sections[0].blocks[0]);
 assert.deepEqual(localScope.source.map(row=>row[0]),[1,9,10,11,12,13]);
 await updateWorkflow(f.dir,'change unrelated primary pages sharing external page numbers',state=>{
  for(const page of [6,47])state.pages[page]={inventoryHash:'unrelated-current-inventory',sourceEvidence:'unrelated-current-image'};
  state.issues['unrelated-local-47']={id:'unrelated-local-47',page:47,status:'retained',message:'Different source PDF.',resolution:{reason:'Unrelated local-page correction.',evidence:[]}};
 });
 assert.deepEqual((await nextBoundedWork(f.options)).reuse.questions,['q1','q2']);
 broad.pages[1].inspection={note:'An unrelated external index page changed'};f.write('teaching-context-index.json',{externalTeachingReferences:[broad]});
 assert.deepEqual((await nextBoundedWork(f.options)).reuse.questions,['q1','q2']);assert.equal(context().dependencyHash,before.dependencyHash);
 f.write('chapter-one.pdf','Changed external PDF');
 let next=await nextBoundedWork(f.options);assert.deepEqual(next.reuse.questions,['q2']);assert.deepEqual(next.reuse.teaching,['exercise:t2']);assert.ok(job(next,'theory','exercise:t1').blockers.some(b=>b.includes('External teaching PDF is missing or changed')));
 f.write('chapter-one.pdf','Original PDF chapter-one');fs.unlinkSync(nested.pages[0].imagePath);
 next=await nextBoundedWork(f.options);assert.deepEqual(next.reuse.questions,['q2']);assert.ok(job(next,'theory','exercise:t1').blockers.some(b=>b.includes('External teaching image is missing or changed')));
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

test('a prepared review ticket resumes with its original request and records once',async t=>{
 const f=fixture(t,{pages:1}),pending=job(await nextBoundedWork(f.options),'maths');
 const prepared=await prepareBoundedStage(f.options,pending.id);let calls=0;
 const result=await executePreparedBoundedStage(f.options,prepared.ticket,{runner:async request=>{
  calls++;assert.equal(request.prompt,readTicket(prepared).prompt);
  return {result:{...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page:1,key:readTicket(prepared).job.context.key}]},metrics:{usage:{input_tokens:50,cached_input_tokens:20,output_tokens:10},elapsedMs:5}};
 }});
 assert.equal(result.ok,true);assert.equal(calls,1);assert.equal(loadWorkflow(f.dir).pages[1].mathReview.key,readTicket(prepared).job.context.key);
 await assert.rejects(()=>executePreparedBoundedStage(f.options,prepared.ticket,{runner:()=>assert.fail('Duplicate generation')}),/ownership/);
});

test('assessment delivers mapped teacher images with distinct identity and fails closed when absent',async t=>{
 const f=fixture(t,{pages:1}),question=f.book.sections[1].blocks[0];
 question.sourceReview={answerEvidence:{teacherReference:[{pdfPage:1,questionLabel:'1'}]}};f.write('project.json',f.book);
 let plan=await nextBoundedWork(f.options);assert.ok(job(plan,'assessment','question:q1').blockers.some(b=>b.includes('Teacher answer image missing')));
 const teacher=f.write('evidence/teacher/pages/page-001.png','different answer pixels');
 await acceptTheory(f,'t1');plan=await nextBoundedWork(f.options);const pending=job(plan,'assessment','question:q1');assert.equal(pending.blockers.length,0);
 const prepared=await prepareBoundedStage(f.options,pending.id),ticket=readTicket(prepared),payload=JSON.parse(prepared.prompt.slice(prepared.prompt.indexOf('\n\n{"ownershipIds"')+2));
 assert.equal(prepared.job.variableCharacters,prepared.prompt.length);
 assert.deepEqual(ticket.job.images,[path.join(f.dir,'evidence/pages/page-001.png'),teacher]);
 assert.deepEqual(payload.inputImages.map(i=>({number:i.imageNumber,path:payload.artifactIndex[i.artifactRef].path})),[{number:1,path:'evidence/pages/page-001.png'},{number:2,path:'evidence/teacher/pages/page-001.png'}]);
 const answer=payload.artifactIndex[payload.inputImages[1].artifactRef];assert.equal(answer.role,'teacher-answer');assert.equal(answer.teacherPage,1);assert.equal(answer.page,undefined);assert.equal(answer.hash,bytesHash(teacher));
 f.write('evidence/teacher/pages/page-001.png','changed answer pixels');
 await assert.rejects(recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:[{id:'question:q1',outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true}}]}}),/stale/);
});

test('assessment handoffs deliver selected skill definitions inline and reject changed catalogue evidence',async t=>{
 const f=fixture(t);f.options.skillCatalogFile=f.write('skills.json',[{id:'substitution',blurb:'Substitute a stated value into an algebraic expression and evaluate it.'},{id:'unrelated',blurb:'An unrelated catalogue entry.'}]);
 await acceptTheory(f,'t1');const pending=job(await nextBoundedWork(f.options),'assessment','question:q1'),prepared=await prepareBoundedStage(f.options,pending.id),ticket=readTicket(prepared);
 assert.deepEqual(ticket.job.context.skillDefinitions,[{id:'substitution',blurb:'Substitute a stated value into an algebraic expression and evaluate it.'}]);assert.deepEqual(ticket.job.context.missingSkillIds,[]);assert.match(prepared.prompt,/Substitute a stated value into an algebraic expression and evaluate it/);assert.ok(ticket.job.evidence.some(a=>a.path===f.options.skillCatalogFile));
 f.write('skills.json',[{id:'substitution',blurb:'Changed mathematical scope.'}]);
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:[{id:'question:q1',outcome:'passed',note:'Fixture only.',checks:{answer:true,skillMapping:true,taughtMethod:true}}]}}),/stale/);
 assert.equal(loadWorkflow(f.dir).verification.entries['question:q1'],undefined);
});


function practiceOnlySharedPage(f){
 f.book.sections=f.book.sections.filter(s=>s.phase==='practice');
 const section=f.book.sections[0],first=section.blocks[0];
 first.sourceReview={teachingContext:{pdfPages:[1],methodNote:'Use the explicitly supplied source-page method.'}};
 first.classification={primarySkillId:null,secondarySkillIds:[]};
 section.blocks.push({...structuredClone(first),id:'q2',classification:{primarySkillId:'substitution'},content:{id:'q2-root',prompt:'Second independent question.',answer:{short:'2',worked:'Substitute to get 2.'}}});
 f.write('project.json',f.book);
}
async function retainFinding(f,id){
 await updateWorkflow(f.dir,'Fixture explicit retained finding',state=>{
  applyDecisions(state,{...signed,artifacts:[f.evidence],expectedRevision:state.revision,key:settlementKey(state),corrections:[],resolutions:[{id,status:'retained',reason:'Keep this finding visible for review; do not grant question acceptance.'}]});
 });
}
test('retained validated classification-only findings preserve teaching and other question reviews',async t=>{
 const f=fixture(t,{pages:1});practiceOnlySharedPage(f);await acceptTheory(f,'t1');
 const teachingBefore=exerciseTeachingContext(f.book,liveWorkflow(f.dir),'t1',{runDir:f.dir});
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment').id);
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records:[
  {id:'question:q1',outcome:'failed',note:'No matching primary classification; answer and method checked.',checks:{answer:true,skillMapping:false,taughtMethod:true}},
  {id:'question:q2',outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true}}
 ]}});
 const state=loadWorkflow(f.dir),issue=Object.values(state.issues).find(i=>i.targetId==='q1');
 assert.deepEqual(issue.reviewChecks,{answer:true,skillMapping:false,taughtMethod:true});
 await retainFinding(f,issue.id);
 assert.equal(exerciseTeachingContext(f.book,liveWorkflow(f.dir),'t1',{runDir:f.dir}).dependencyHash,teachingBefore.dependencyHash);
 const next=await nextBoundedWork(f.options);assert.deepEqual(next.reuse.teaching,['exercise:t1']);assert.deepEqual(next.reuse.questions,['q2']);
 assert.equal(loadWorkflow(f.dir).verification.entries['question:q1'].outcome,'failed');assert.ok(job(next,'assessment','question:q1'));
 f.book.sections[0].blocks[0].sourceReview.teachingContext.methodNote='A substantively revised taught method.';f.write('project.json',f.book);
 assert.deepEqual((await nextBoundedWork(f.options)).reuse.teaching,[]);
});
test('legacy, answer and method findings still invalidate teaching when retained',async t=>{
 for(const checks of [undefined,{answer:false,skillMapping:false,taughtMethod:true},{answer:true,skillMapping:false,taughtMethod:false}]){
  const f=fixture(t,{pages:1});practiceOnlySharedPage(f);await acceptTheory(f,'t1');
  const before=exerciseTeachingContext(f.book,liveWorkflow(f.dir),'t1',{runDir:f.dir});
  await updateWorkflow(f.dir,'Fixture conservative finding',state=>{state.issues['review-fixture']={id:'review-fixture',origin:'review',page:1,pages:[1],targetId:'q1',status:'pending',reviewJob:{stage:'assessment',ownershipIds:['question:q1']},...(checks?{reviewChecks:checks}:{})};});
  await retainFinding(f,'review-fixture');
  assert.notEqual(exerciseTeachingContext(f.book,liveWorkflow(f.dir),'t1',{runDir:f.dir}).dependencyHash,before.dependencyHash);
 }
});
test('free-form assessment findings cannot self-declare validated classification-only checks',async t=>{
 const f=fixture(t,{pages:1});practiceOnlySharedPage(f);await acceptTheory(f,'t1');
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment').id);
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'needs-review',findings:[{id:'unvalidated',targetId:'q1',pages:[1],message:'Needs actual structured assessment.',reviewChecks:{answer:true,skillMapping:false,taughtMethod:true}}]}});
 const issue=Object.values(loadWorkflow(f.dir).issues).find(i=>i.targetId==='q1');assert.equal(issue.reviewChecks,undefined);
});

test('visual stage scope filters construction without reducing the complete verification checklist',async t=>{
 const f=fixture(t,{pages:1}),before=liveWorkflow(f.dir,[1]),full=await nextBoundedWork(f.options);
 assert.deepEqual(full.jobs.map(j=>j.stage),['maths','theory','assessment']);assert.equal(full.stages,undefined);
 const scoped=await nextBoundedWork({...f.options,stages:['composition','visual']});
 assert.deepEqual(scoped.stages,['visual','composition']);assert.deepEqual(scoped.jobs,[]);assert.equal(scoped.next,null);
 assert.deepEqual(scoped.checklist,full.checklist);assert.ok(scoped.checklist.some(c=>!c.passed));
 assert.deepEqual(scoped.reuse.questions,[]);assert.deepEqual(scoped.reuse.teaching,[]);
 assert.deepEqual(liveWorkflow(f.dir,[1]),before);
 // Assessment-only evidence is not loaded when no assessment job is constructed.
 const brokenCatalog=f.write('invalid-skills.json','not JSON');
 await nextBoundedWork({...f.options,skillCatalogFile:brokenCatalog,stages:['visual']});
 await assert.rejects(()=>nextBoundedWork({...f.options,skillCatalogFile:brokenCatalog}),SyntaxError);
 for(const stages of [null,[],Array(1),['maths'],['visual','visual'],['visual','unknown'],'visual']){
  await assert.rejects(()=>nextBoundedWork({...f.options,stages}),/Stage scope/);
  await assert.rejects(()=>prepareBoundedStage({...f.options,stages},full.jobs[0].id),/Stage scope/);
 }
 assert.equal(loadWorkflow(f.dir).verification?.stageClaims,undefined);
});

test('scoped visual tickets preserve ownership, explicit inspection and immutable stage selection',async t=>{
 const f=visualFixture(t);await prepareReviewQueue(f.dir,f.input,f.overrides.queueDependencies);
 const options={...f.options,stages:['composition','visual']},full=await nextBoundedWork(f.options,f.overrides),scoped=await nextBoundedWork(options,f.overrides);
 assert.deepEqual(scoped.jobs,full.jobs.filter(j=>['visual','composition'].includes(j.stage)));
 const prepared=await prepareBoundedStage(options,scoped.jobs[0].id,f.overrides);
 assert.deepEqual(readTicket(prepared).stages,['visual','composition']);
 await assert.rejects(()=>prepareBoundedStage(options,scoped.jobs[1].id,f.overrides),/active visual review/);
 const accepted={...signed,outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true};
 for(const stages of [['visual'],['composition']]){
  await assert.rejects(()=>executePreparedBoundedStage({...f.options,stages},prepared.ticket,{...f.overrides,runner:()=>assert.fail('Changed scope invoked runner')}),/scope differs/);
  await assert.rejects(()=>recordBoundedStage({...f.options,stages},{ticket:prepared.ticket,result:accepted},f.overrides),/scope differs/);
 }
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted'}},f.overrides),/explicitly/);
 let queue=await reviewQueueStatus(f.dir,f.overrides.queueDependencies);assert.equal(queue.reviewed,0);assert.equal(queue.active.id,readTicket(prepared).reviewId);
 let calls=0;
 const result=await executePreparedBoundedStage(f.options,prepared.ticket,{...f.overrides,runner:async()=>{calls++;return {result:accepted};}});
 assert.equal(result.ok,true);assert.equal(calls,1);
 queue=await reviewQueueStatus(f.dir,f.overrides.queueDependencies);assert.equal(queue.reviewed,8);
 await assert.rejects(()=>finalReviewRecord(f.dir,{...signed,expectedRevision:queue.revision,sessionKey:queue.sessionKey},f.overrides.queueDependencies),/Every page/);
 await assert.rejects(()=>executePreparedBoundedStage(f.options,prepared.ticket,{...f.overrides,runner:()=>assert.fail('Duplicate runner')}),/ownership/);
});

test('composition-only dispatch still waits for pending page inspections',async t=>{
 const f=visualFixture(t);await prepareReviewQueue(f.dir,f.input,f.overrides.queueDependencies);
 const queue={...await reviewQueueStatus(f.dir,f.overrides.queueDependencies),pendingComposition:['with-short']};
 const options={...f.options,stages:['composition']},overrides={...f.overrides,queue,queueInput:f.input};
 const scoped=await nextBoundedWork(options,overrides);
 assert.deepEqual(scoped.jobs.map(j=>j.stage),['composition']);assert.equal(scoped.next,null);
 assert.deepEqual(scoped.jobs[0].blockers,['Inspect pending standalone and unmatched pages first']);
 await assert.rejects(()=>prepareBoundedStage(options,scoped.jobs[0].id,overrides),/Inspect pending standalone/);
 assert.equal(loadWorkflow(f.dir).verification?.stageClaims,undefined);
});

test('scoped visual validation rejects changed project, renderer, source and page evidence',async t=>{
 for(const dependency of ['project','renderer','source','page']){
  const f=visualFixture(t);await prepareReviewQueue(f.dir,f.input,f.overrides.queueDependencies);
  const options={...f.options,stages:['visual']},pending=job(await nextBoundedWork(options,f.overrides),'visual'),prepared=await prepareBoundedStage(options,pending.id,f.overrides);
  const overrides={...f.overrides,queueDependencies:{...f.overrides.queueDependencies}};
  if(dependency==='project')f.write('project.json',{...f.book,title:'Changed project'});
  if(dependency==='renderer')overrides.queueDependencies.renderer='changed-renderer';
  if(dependency==='source')fs.writeFileSync(f.evidence.path,'Changed source');
  if(dependency==='page')fs.writeFileSync(f.input.editions.student.images[0].path,'Changed page image');
  await assert.rejects(()=>executePreparedBoundedStage(f.options,prepared.ticket,{...overrides,runner:()=>assert.fail('Stale evidence invoked runner')}),/stale/);
  await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true}},overrides),/stale/);
  const queue=JSON.parse(fs.readFileSync(path.join(f.dir,'visual-review/queue.json')));
  assert.equal(queue.rows.filter(r=>r.review).length,0);assert.equal(queue.active.id,readTicket(prepared).reviewId);
 }
});

test('tickets without a stage scope retain the full default and cannot acquire a scope',async t=>{
 const f=fixture(t,{pages:1}),pending=job(await nextBoundedWork(f.options),'maths'),prepared=await prepareBoundedStage(f.options,pending.id);
 const ticket=readTicket(prepared);assert.equal(ticket.stages,undefined);
 const result={...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page:1,key:ticket.job.context.key}]};
 await assert.rejects(()=>recordBoundedStage({...f.options,stages:['visual']},{ticket:prepared.ticket,result}),/scope differs/);
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result});
 assert.equal(loadWorkflow(f.dir).pages[1].mathReview.key,ticket.job.context.key);
});

test('visual page limits are captured in tickets and remain immutable across execute, record and cancel',async t=>{const f=visualFixture(t);await prepareReviewQueue(f.dir,f.input,f.overrides.queueDependencies);const options={...f.options,stages:['visual'],visualPageLimits:{student:2}},plan=await nextBoundedWork(options,f.overrides);assert.equal(plan.visualPageLimits.student,2);assert.deepEqual(plan.jobs.filter(j=>j.stage==='visual').map(j=>j.ownershipIds.length),[2,2,1,5,5,5,5]);const prepared=await prepareBoundedStage(options,plan.jobs[0].id,f.overrides);assert.deepEqual(readTicket(prepared).visualPageLimits,{student:2});const accepted={...signed,outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true},changed={...options,visualPageLimits:{student:3}};await assert.rejects(()=>executePreparedBoundedStage(changed,prepared.ticket,{...f.overrides,runner:()=>assert.fail('Changed page limits invoked runner')}),/page limits differ/);await assert.rejects(()=>recordBoundedStage(changed,{ticket:prepared.ticket,result:accepted},f.overrides),/page limits differ/);await assert.rejects(()=>cancelBoundedStage(changed,{ticket:prepared.ticket,reason:'Fixture mismatch'}),/page limits differ/);const recorded=await recordBoundedStage(f.options,{ticket:prepared.ticket,result:accepted},f.overrides);assert.equal(recorded.ok,true);const queue=await reviewQueueStatus(f.dir,f.overrides.queueDependencies);assert.equal(queue.reviewed,2);assert.equal(queue.pending.length,23);});


test('lean assessment combines source, teaching and practice once and reuses direct corrections',async t=>{
 const f=fixture(t,{pages:1});
 f.book.reviewProfile='textbook-three-pass-v1';
 f.write('project.json',f.book);
 let plan=await nextBoundedWork(f.options);
 assert.equal(plan.jobs.some(j=>j.stage==='maths'||j.stage==='theory'),false);
 const assessment=job(plan,'assessment');
 assert.ok(assessment);
 assert.deepEqual(assessment.blockers,[]);
 const prepared=await prepareBoundedStage(f.options,assessment.id);
 const ticket=readTicket(prepared);
 assert.deepEqual(ticket.job.context.questions.map(b=>b.id),['method1','q1']);
 assert.deepEqual(ticket.job.context.sectionContext.map(section=>({title:section.title,blockIds:section.blockIds})),f.book.sections.map(section=>({title:section.title,blockIds:section.blocks.map(block=>block.id)})));
 assert.match(prepared.prompt,/must not be duplicated in body content/);
 assert.ok(ticket.job.context.teaching.teaching.some(b=>b.id==='method1'));
 assert.match(prepared.prompt,/one complete source, mathematics, content, answer, taught-method and taxonomy pass/);
 assert.match(prepared.prompt,/otherwise 2 decimal places/);
 const records=ticket.job.context.questions.map(b=>({id:'question:'+b.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}));
 const corrected={...signed,records,corrections:[{id:'fix-lean-answer',reason:'Correct the calculated result',sourceRefs:[{pageNumber:1}],patches:[{scope:'project',page:1,targetId:'q1-root',field:'/answer/short',original:'1',corrected:'2'}]}]};
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:corrected});
 const state=loadWorkflow(f.dir);
 assert.equal(state.corrections[0].status,'approved');
 assert.equal(state.verification.entries['question:q1'].outcome,'passed');
 assert.equal(state.verification.entries['question:method1'].outcome,'passed');
 plan=await nextBoundedWork(f.options);
 assert.equal(plan.jobs.some(j=>j.stage==='assessment'),false);
 assert.deepEqual(plan.reuse.questions,['method1','q1']);
 f.book.sections.find(section=>section.phase==='practice').blocks[0].classification.primarySkillId='different-skill';
 f.write('project.json',f.book);
 plan=await nextBoundedWork(f.options);
 assert.equal(plan.jobs.some(j=>j.stage==='assessment'),false);
 f.book.sections.find(section=>section.phase==='practice').blocks[0].content.prompt='Find the revised value.';
 f.write('project.json',f.book);
 plan=await nextBoundedWork(f.options);
 assert.ok(job(plan,'assessment','question:q1'));
 assert.deepEqual(plan.reuse.questions,['method1']);
});


test('lean content review resolves inventoried ambiguity without a separate feedback job',async t=>{
 const f=fixture(t,{pages:1,ambiguity:true});
 f.book.reviewProfile='textbook-three-pass-v1';
 f.write('project.json',f.book);
 const plan=await nextBoundedWork(f.options);
 assert.equal(plan.jobs.some(j=>j.stage==='feedback'),false);
 const pending=job(plan,'assessment');
 const prepared=await prepareBoundedStage(f.options,pending.id);
 const context=readTicket(prepared).job.context;
 assert.equal(context.pendingIssues.length,1);
 assert.match(prepared.prompt,/Resolve every pendingIssues item in the same review/);
 const result={...signed,records:context.questions.map(block=>({id:'question:'+block.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}})),resolutions:[{id:context.pendingIssues[0].id,status:'retained',reason:'The given source phrasing is mathematically unambiguous in this task.'}]};
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result});
 const state=loadWorkflow(f.dir);
 assert.equal(state.issues[context.pendingIssues[0].id].status,'retained');
 assert.equal((await nextBoundedWork(f.options)).jobs.some(j=>j.stage==='feedback'||j.stage==='assessment'),false);
});

test('lean first assessment retains source-bound teaching for later batches without dropping question images',async t=>{
 const f=fixture(t,{pages:5});f.book.reviewProfile='textbook-three-pass-v1';
 f.book.sections=f.book.sections.filter(s=>s.phase==='practice');for(const s of f.book.sections)s.topicId='t1';
 f.write('project.json',f.book);f.write('evidence/pages/page-006.png','Stable teaching image');
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[6]}]});
 let plan=await nextBoundedWork(f.options);assert.equal(plan.jobs.some(j=>j.stage==='theory'),false);
 const first=await prepareBoundedStage(f.options,job(plan,'assessment','question:q1').id),ticket=readTicket(first);
 assert.ok(ticket.job.images.some(file=>file.endsWith('page-006.png')));
 const records=ticket.job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}));
 await recordBoundedStage(f.options,{ticket:first.ticket,result:{...signed,records,teachingSummary:{outcome:'accepted',sourceCompared:true,note:'Source method checked once.',methods:[{statement:'Apply the method demonstrated on the teaching page.',sourceRefs:[{pageNumber:6}]}]}}});
 plan=await nextBoundedWork(f.options);assert.deepEqual(plan.reuse.questions,['q1','q2','q3','q4']);
 const second=await prepareBoundedStage(f.options,job(plan,'assessment','question:q5').id),next=readTicket(second);
 assert.equal(next.job.context.teaching.reused,true);assert.ok(next.job.context.teaching.methods.length);
 assert.ok(next.job.images.some(file=>file.endsWith('page-005.png')));
 assert.equal(next.job.images.some(file=>file.endsWith('page-006.png')),false);
 assert.equal(loadWorkflow(f.dir).verification.entries['question:q5'],undefined);
 await cancelBoundedStage(f.options,{ticket:second.ticket,reason:'Check source invalidation.'});
 f.write('evidence/pages/page-006.png','Changed teaching method image');
 plan=await nextBoundedWork(f.options);const changed=readTicket(await prepareBoundedStage(f.options,job(plan,'assessment','question:q5').id));
 assert.equal(changed.job.context.teaching.reused,undefined);assert.ok(changed.job.images.some(file=>file.endsWith('page-006.png')));
});

test('configured lean teaching survives practice appends and delivers extra methods only to their owner',async t=>{
 const f=fixture(t,{pages:5});f.book.reviewProfile='textbook-three-pass-v1';
 const later=f.book.sections.find(s=>s.id==='practice5');
 later.blocks[0].sourceReview={teachingContext:{pdfPages:[7],methodNote:'Use this question-specific prior method.',mappingNote:'Only the fifth question needs page7.'}};
 f.book.sections=f.book.sections.filter(s=>s.phase==='practice'&&s.id!=='practice5');for(const s of f.book.sections)s.topicId='t1';later.topicId='t1';
 f.write('project.json',f.book);f.write('evidence/pages/page-006.png','Stable configured teaching');f.write('evidence/pages/page-007.png','Additional prior method');
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[6]}]});
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment','question:q1').id),ticket=readTicket(prepared);
 const records=ticket.job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}));
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records,teachingSummary:{outcome:'accepted',sourceCompared:true,note:'Configured source inspected.',methods:[{statement:'Use the configured demonstration.',sourceRefs:[{pageNumber:6}]}]}}});
 const before=exerciseTeachingContext(f.book,liveWorkflow(f.dir,[1,2,3,4,5]),'t1',{runDir:f.dir,config:{topics:[{id:'t1',teachingPages:[6]}]},configFile:f.options.configFile});
 f.book.sections.unshift(later);f.write('project.json',f.book);
 const after=exerciseTeachingContext(f.book,liveWorkflow(f.dir,[1,2,3,4,5]),'t1',{runDir:f.dir,config:{topics:[{id:'t1',teachingPages:[6]}]},configFile:f.options.configFile});
 assert.equal(after.dependencyHash,before.dependencyHash);assert.deepEqual(after.pages,[6]);assert.deepEqual(after.suppliedNotes,[]);
 const plan=await nextBoundedWork(f.options);assert.deepEqual(new Set(plan.reuse.questions),new Set(['q1','q2','q3','q4']));
 const next=await prepareBoundedStage(f.options,job(plan,'assessment','question:q5').id),owned=readTicket(next);
 assert.equal(owned.job.context.teaching.reused,true);assert.equal(owned.job.context.teaching.suppliedNotes[0].pdfPages[0],7);
 assert.ok(owned.job.images.some(file=>file.endsWith('page-007.png')));assert.ok(!owned.job.images.some(file=>file.endsWith('page-006.png')));
 assert.ok(owned.job.context.questionTeachingEvidence.some(a=>a.path.endsWith('page-007.png')));
 await recordBoundedStage(f.options,{ticket:next.ticket,result:{...signed,records:[{id:'question:q5',outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}]}});
 f.write('evidence/pages/page-007.png','Changed prior method');
 assert.deepEqual(new Set((await nextBoundedWork(f.options)).reuse.questions),new Set(['q1','q2','q3','q4']));
 f.write('evidence/pages/page-006.png','Changed configured source');
 assert.equal((await nextBoundedWork(f.options)).reuse.teaching.includes('exercise:t1'),false);
});

test('lean teaching summary rejects unassigned citations and preserves unresolved question ownership',async t=>{
 const f=fixture(t,{pages:1});f.book.reviewProfile='textbook-three-pass-v1';f.write('project.json',f.book);
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment').id),ticket=readTicket(prepared);
 const records=ticket.job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}));
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records,teachingSummary:{outcome:'accepted',sourceCompared:true,methods:[{statement:'Unsupported method citation',sourceRefs:[{pageNumber:99}]}]}}}),/assigned source references/);
 assert.equal(loadWorkflow(f.dir).verification?.teachingContexts?.t1,undefined);
 assert.equal(loadWorkflow(f.dir).verification?.entries?.['question:q1'],undefined);
});

test('lean summary survives same-review answer-evidence repairs and retained question issues',async t=>{
 const f=fixture(t,{pages:5,ambiguity:true});f.book.reviewProfile='textbook-three-pass-v1';
 const inventory=JSON.parse(fs.readFileSync(path.join(f.dir,'semantic-packets/page-001.inventory.json')));
 inventory.findings=[{id:'page-answer-coverage',description:'Retain the missing answer-key evidence for this practice page.'},{id:'page-working-space',description:'Keep historical handwriting estimates distinct from rendered acceptance.'}];
 f.write('semantic-packets/page-001.inventory.json',inventory);
 f.book.sections=f.book.sections.filter(s=>s.phase==='practice');for(const s of f.book.sections)s.topicId='t1';
 const original={status:'missing',teacherReference:[]};f.book.sections[0].blocks[0].sourceReview={answerEvidence:original};
 f.write('project.json',f.book);f.write('evidence/pages/page-006.png','Stable teaching image');
 f.options.configFile=f.write('config.json',{topics:[{id:'t1',teachingPages:[1,2,3,4,5,6]}]});
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment','question:q1').id),ticket=readTicket(prepared);
 const records=ticket.job.context.questions.map(q=>({id:'question:'+q.id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}));
 const correction={id:'missing-key-metadata',reason:'Record independent derivation where source answers are absent.',sourceRefs:[{pageNumber:1}],patches:[{scope:'project',page:1,targetId:'q1',field:'/sourceReview/answerEvidence',original,corrected:{status:'independently-derived',teacherReference:[],conflict:{kind:'source-answer-unavailable',decisionId:'missing-key-metadata'}}}]};
 await recordBoundedStage(f.options,{ticket:prepared.ticket,result:{...signed,records,corrections:[correction],resolutions:ticket.job.context.pendingIssues.map(issue=>({id:issue.id,status:'retained',reason:'Preserve source wording after independent inspection.'})),teachingSummary:{outcome:'accepted',sourceCompared:true,note:'Unchanged teaching source inspected.',methods:[{statement:'Use the source demonstration.',sourceRefs:[{pageNumber:6}]}]}}});
 const state=loadWorkflow(f.dir);assert.equal(state.corrections[0].status,'approved');assert.ok(Object.values(state.issues).some(issue=>issue.status==='retained'));
 assert.ok(Object.values(state.issues).some(issue=>issue.id.includes('page-answer-coverage')&&issue.status==='retained'));
 const plan=await nextBoundedWork(f.options);assert.deepEqual(plan.reuse.questions,['q1','q2','q3','q4']);
 const second=await prepareBoundedStage(f.options,job(plan,'assessment','question:q5').id),next=readTicket(second);
 assert.equal(next.job.context.teaching.reused,true);assert.equal(next.job.images.some(file=>file.endsWith('page-006.png')),false);
 assert.ok(next.job.images.some(file=>file.endsWith('page-005.png')));
 await recordBoundedStage(f.options,{ticket:second.ticket,result:{...signed,records:[{id:'question:q5',outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}],resolutions:next.job.context.pendingIssues.map(issue=>({id:issue.id,status:'retained',reason:'Preserve the source after this assigned review.'}))}});
 const final=await nextBoundedWork(f.options);assert.deepEqual(final.reuse.questions,['q1','q2','q3','q4','q5']);assert.equal(final.jobs.some(j=>j.stage==='assessment'),false);
});

test('same-review summary cannot bind a newly introduced uninspected teaching page',async t=>{
 const f=fixture(t,{pages:1});f.book.reviewProfile='textbook-three-pass-v1';f.book.sections=f.book.sections.filter(s=>s.phase==='practice');
 const original={teachingContext:{pdfPages:[2]}};f.book.sections[0].blocks[0].sourceReview=original;
 f.write('project.json',f.book);f.write('evidence/pages/page-002.png','Delivered method source');f.write('evidence/pages/page-003.png','Uninspected different method source');
 const prepared=await prepareBoundedStage(f.options,job(await nextBoundedWork(f.options),'assessment').id),ticket=readTicket(prepared);
 const result={...signed,records:[{id:'question:q1',outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}],teachingSummary:{outcome:'accepted',sourceCompared:true,methods:[{statement:'Use the delivered method.',sourceRefs:[{pageNumber:2}]}]},corrections:[{id:'new-context',reason:'Introduce a different teaching page.',sourceRefs:[{pageNumber:1}],patches:[{scope:'project',page:1,targetId:'q1',field:'/sourceReview',original,corrected:{teachingContext:{pdfPages:[3]}}}]}]};
 await assert.rejects(()=>recordBoundedStage(f.options,{ticket:prepared.ticket,result}),/uninspected final source/);
 const state=loadWorkflow(f.dir);assert.equal(state.verification?.entries?.['question:q1'],undefined);assert.equal(state.verification?.teachingContexts?.t1,undefined);assert.equal(state.corrections?.length??0,0);
});

test('lean visual job only carries selected rendered blocks source pages',async t=>{
 const f=fixture(t,{pages:2});
 f.book.reviewProfile='textbook-three-pass-v1';
 f.write('project.json',f.book);
 const manifest=f.write('student-layout.json',{pages:[{page:1,blocks:['q1']}]});
 const image=ref(f.write('student-page-1.png','Rendered page'));
 const unrelated=ref(f.write('unrelated-source.txt','Unrelated source material'));
 const queue={sessionKey:'layout-fixture',mode:'final',pending:[{edition:'student',page:1,key:'render-one',image,sources:[unrelated]}],pendingComposition:[],reviewed:0,reused:0,total:1};
 const plan=await nextBoundedWork(f.options,{queue,queueInput:{editions:{student:{manifest:ref(manifest)}}}});
 const visual=job(plan,'visual');
 assert.ok(visual);
 assert.ok(visual.evidence.some(artifact=>artifact.path.endsWith('page-001.png')));
 assert.equal(visual.evidence.some(artifact=>artifact.path===unrelated.path),false);
});


test('lean teaching-summary receipts preserve completed question dependencies while explicit method sources remain bound',t=>{
 const f=fixture(t,{pages:2});f.book.reviewProfile='textbook-three-pass-v1';
 const q=f.book.sections.find(s=>s.phase==='practice').blocks[0];q.sourceReview={teachingContext:{pdfPages:[2]}};
 const state=loadWorkflow(f.dir);state.pages[2]={sourceEvidence:{hash:'original-teaching-source'}};const before=questionTeachingDependencies(state,f.book,q);
 state.verification??={entries:{}};state.verification.teachingContexts={t1:{reviewProfile:'textbook-three-pass-v1',dependencyScope:{pages:[2]},artifacts:[f.evidence],sourceArtifacts:[f.evidence],note:'New inspection receipt'}};
 assert.deepEqual(questionTeachingDependencies(state,f.book,q),before);
 state.pages[2].sourceEvidence={...state.pages[2].sourceEvidence,hash:'changed-original-teaching-source'};
 assert.notDeepEqual(questionTeachingDependencies(state,f.book,q),before);
});
