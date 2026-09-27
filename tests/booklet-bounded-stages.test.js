import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {nextBoundedWork,prepareBoundedStage,recordBoundedStage,cancelBoundedStage,runBoundedStage,executePreparedBoundedStage,exerciseTeachingContext,groupFeedbackByCause,registerFeedbackScope,BOUNDED_LIMITS} from '../scripts/booklet/bounded-stages.mjs';
import {loadWorkflow,liveWorkflow,updateWorkflow,bytesHash,applyDecisions,settlementKey} from '../scripts/booklet/workflow-review.mjs';
import {PIPELINE_POLICY,createArtifactVerifier,questionTeachingDependencies} from '../scripts/booklet/import-verification.mjs';
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
 assert.ok(a.jobs.every(j=>j.profile.model==='gpt-6-sol'&&j.profile.effort==='xhigh'&&j.profile.freshContext&&j.profile.speed==='standard'));
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
