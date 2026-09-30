import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {bytesHash} from '../scripts/booklet/workflow-review.mjs';
import {sourceReviewViews} from '../scripts/booklet/multi-source-review.mjs';
import {questionTeachingDependencies,verificationDependencies,verificationStatus,PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
import {assessmentQuestionGroups,boundedPromptPayload,exerciseTeachingContext,nextBoundedWork,prepareBoundedStage,recordBoundedStage} from '../scripts/booklet/bounded-stages.mjs';
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'multi-source-review-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const write=(run,file,value)=>{const f=path.join(dir,run,file);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof value==='string'?value:JSON.stringify(value));return f};
 const state={version:1,revision:0,pipelinePolicy:PIPELINE_POLICY,pages:{6:{sourceEvidence:{hash:'primary-six'},inventoryHash:'primary-inventory'}},issues:{wrong:{page:6,status:'retained',message:'PRIMARY ONLY',resolution:{reason:'primary'}}},corrections:[],representatives:{}};
 const old={...state,pipelinePolicy:undefined,pages:{6:{sourceEvidence:{hash:'old-six'},inventoryHash:'old-inventory'}},issues:{old:{page:6,status:'retained',message:'ORIGINAL ONLY',resolution:{reason:'old'}}}};
 write('original','workflow/issues.json',old);write('primary','workflow/issues.json',state);write('primary','manifest.json',{selectedPages:[],pipelinePolicy:PIPELINE_POLICY});
 for(const run of ['original','primary']){write(run,'evidence/pages/page-006.png',run+' pixels');write(run,'evidence/pages/page-006.txt',run+' source')}
 const blocks=prefix=>[{id:prefix+'method',type:'callout',sourceRefs:[{pageNumber:6,...(prefix?{runId:'primary'}:{})}],content:'method'},{id:prefix+'q',type:'question',sourceRefs:[{pageNumber:6,...(prefix?{runId:'primary'}:{})}],content:{id:prefix+'root',prompt:'question',answer:{short:'1',worked:'1'}}}];
 const sections=['','new--'].flatMap(prefix=>{const [method,q]=blocks(prefix);return [{id:prefix+'teach',topicId:prefix+'topic',phase:'teaching',blocks:[method]},{id:prefix+'practice',topicId:prefix+'topic',phase:'practice',blocks:[q]}]});
 const inventory={entries:[{id:'entry',targetId:'q',teachingContextIds:['method'],pageNumber:6}]};
 const project={id:'merged',sections,source:{runId:'original',workflow:{runId:'primary'},inventory,imports:[{runId:'primary',namespace:'new',idMap:{q:'new--q',method:'new--method',entry:'new--entry'},source:{inventory}}]}};
 return {dir,runDir:path.join(dir,'primary'),state,old,project,write};
}
test('colliding pages resolve original and imported inventories, decisions and source dependencies independently',t=>{
 const f=fixture(t),views=sourceReviewViews(f.project,f.state,{runDir:f.runDir});
 const deps=q=>questionTeachingDependencies(f.state,f.project,q,{sourceViews:views});
 const original=deps(f.project.sections[1].blocks[0]),added=deps(f.project.sections[3].blocks[0]);
 assert.equal(original.sources[0].runId,'original');assert.equal(original.sources[0].dependencies.source[0][1].hash,'old-six');assert.equal(original.sources[0].dependencies.resolutions[0].message,'ORIGINAL ONLY');
 assert.equal(added.sources[0].dependencies.source[0][1].hash,'primary-six');assert.deepEqual(added.sources[0].dependencies.teachingContextIds,['new--method']);
 const before=verificationDependencies(f.state,f.project,{runDir:f.runDir});f.state.pages[6].inventoryHash='changed-primary';const after=verificationDependencies(f.state,f.project,{runDir:f.runDir});
 assert.equal(before.questions.q,after.questions.q);assert.notEqual(before.questions['new--q'],after.questions['new--q']);
});
test('theory and assessment use the correct run images and retain real review requirements',async t=>{
 const f=fixture(t),context=exerciseTeachingContext(f.project,f.state,'topic',{runDir:f.runDir});
 assert.ok(context.evidence.some(e=>e.runId==='original'&&e.path.includes('original')));assert.ok(!context.evidence.some(e=>e.path.includes('primary')));assert.equal(context.decisions[0].message,undefined);assert.equal(context.decisions[0].reason,'old');
 const file=f.write('primary','project.json',f.project),plan=await nextBoundedWork({runDir:f.runDir,projectFile:file,selectedPages:[]});
 const job=plan.jobs.find(j=>j.stage==='assessment'&&j.ownershipIds.includes('question:q'));
 assert.equal(job.done,false);assert.ok(job.evidence.some(e=>e.path.includes('original')&&e.path.endsWith('.png')));assert.ok(job.blockers.some(b=>b.includes('teaching-method')));
 fs.rmSync(path.join(f.dir,'original/workflow/issues.json'));
 assert.ok(exerciseTeachingContext(f.project,f.state,'topic',{runDir:f.runDir}).problems.some(p=>p.includes('register missing')));
});


test('merged failed review retains observations without writing a falsely bound primary issue',async t=>{
 const f=fixture(t),file=f.write('primary','project.json',f.project),options={runDir:f.runDir,projectFile:file,selectedPages:[]};
 const plan=await nextBoundedWork(options),job=plan.jobs.find(j=>j.stage==='theory'&&j.ownershipIds.includes('exercise:topic'));
 const prepared=await prepareBoundedStage(options,job.id);assert.equal(prepared.job.variableCharacters,prepared.prompt.length);
 await assert.rejects(recordBoundedStage(options,{ticket:prepared.ticket,result:{reviewer:'Test reviewer',note:'Source method needs clarification',outcome:'needs-context',findings:[{page:6,message:'Original source concern'}]}}),/source run/);
 const register=JSON.parse(fs.readFileSync(path.join(f.runDir,'workflow/issues.json')));
 assert.ok(!Object.values(register.issues).some(i=>i.message==='Original source concern'));
 assert.ok(fs.readdirSync(path.dirname(prepared.ticket.path)).some(name=>name.startsWith('result-')));
});

test('unknown source run fails closed instead of falling back to primary page',t=>{
 const f=fixture(t),question=f.project.sections[3].blocks[0];question.sourceRefs=[{runId:'unregistered-source',pageNumber:6}];
 assert.throws(()=>verificationDependencies(f.state,f.project,{runDir:f.runDir}),/unknown source run/);
});

test('combined final gates require current mathematics and no pending findings in every source run',t=>{
 const f=fixture(t);f.state.pages[6].mathReview={key:'primary-inventory'};f.old.pages[6].mathReview={key:'old-inventory'};f.write('original','workflow/issues.json',f.old);
 const secondary=structuredClone(f.old);secondary.pages[6].inventoryHash='v2-inventory';secondary.pages[6].mathReview={key:'v2-inventory'};secondary.issues={};
 f.write('v2','workflow/issues.json',secondary);f.project.source.imports.push({runId:'v2',namespace:'v2',idMap:{},source:{inventory:{entries:[]}}});
 const checks=()=>Object.fromEntries(verificationStatus(f.state,f.project,{runDir:f.runDir}).checks.map(c=>[c.id,c.passed]));
 assert.equal(checks().inventory,true);assert.equal(checks()['task-findings'],true);
 secondary.pages[6].mathReview.key='stale';f.write('v2','workflow/issues.json',secondary);assert.equal(checks().inventory,false);
 secondary.pages[6].mathReview.key='v2-inventory';secondary.issues.pending={status:'pending',page:6,message:'Unresolved source issue'};f.write('v2','workflow/issues.json',secondary);
 assert.equal(checks().inventory,true);assert.equal(checks()['task-findings'],false);
 const single={...f.project,source:{runId:'primary'}};assert.equal(verificationStatus(f.state,single).checks.find(c=>c.id==='inventory').passed,true);
});

test('bare decision artifact cannot discard source page metadata during evidence deduplication',t=>{
 const f=fixture(t),image=path.join(f.dir,'original/evidence/pages/page-006.png');
 f.old.issues.old.resolution.evidence=[{path:image,hash:bytesHash(image)}];f.write('original','workflow/issues.json',f.old);
 const context=exerciseTeachingContext(f.project,f.state,'topic',{runDir:f.runDir});
 const evidence=context.evidence.find(e=>e.path===image);assert.equal(evidence.page,6);assert.equal(evidence.runId,'original');
 assert.ok(!context.problems.some(p=>p.includes('image missing')));
});
test('provided views stay coherent within one snapshot while later calls reread sources',t=>{
 const f=fixture(t),views=sourceReviewViews(f.project,f.state,{runDir:f.runDir});
 const before=verificationDependencies(f.state,f.project,{runDir:f.runDir,sourceViews:views});
 f.old.pages[6].inventoryHash='source changed after snapshot';f.write('original','workflow/issues.json',f.old);
 assert.deepEqual(verificationDependencies(f.state,f.project,{runDir:f.runDir,sourceViews:views}),before);
 assert.notEqual(verificationDependencies(f.state,f.project,{runDir:f.runDir}).questions.q,before.questions.q);
});

test('prompt projection retains teaching and exact corrections while indexing repeated audit evidence',()=>{
 const artifact={path:'/source.png',hash:'source-hash'},content={prompt:'Use the taught method',answer:{short:'2',worked:'1+1=2'},questionDiagrams:[{code:'native TikZ',spec:{vertices:{A:[0,0,0]}}}]};
 const corrected={sourceReview:{verification:{key:'exact correction value'}},content};
 const job={stage:'theory',dependencyHash:'unchanged',ownershipIds:['exercise:x'],evidence:[artifact],context:{teaching:[{id:'teaching',sourceRefs:[{runId:'original',pageNumber:6}],content,sourceReview:{verification:{key:'audit'},visualAudit:{artifacts:[artifact]},arrangements:[{order:['a','b']}],teachingContext:'Retain teaching note'}}],evidence:[artifact],decisions:[{id:'fix',reason:'Current decision',evidence:[artifact],patches:[{targetId:'teaching',field:'/content',corrected}],resolution:{status:'corrected',reason:'Current decision',evidence:[artifact]}}]}};
 const before=JSON.stringify(job),result=boundedPromptPayload(job);
 assert.equal(JSON.stringify(job),before);assert.deepEqual(result.context.teaching[0].content,content);assert.deepEqual(result.context.teaching[0].sourceRefs,job.context.teaching[0].sourceRefs);
 assert.equal(result.context.teaching[0].sourceReview.verification,undefined);assert.equal(result.context.teaching[0].sourceReview.visualAudit,undefined);assert.equal(result.context.teaching[0].sourceReview.teachingContext,'Retain teaching note');
 assert.equal(result.context.teaching[0].sourceReview.arrangements,undefined);
 assert.deepEqual(result.context.decisions[0].patches[0].corrected,corrected);assert.equal(result.context.decisions[0].reason,'Current decision');assert.equal(result.context.decisions[0].resolution.status,'corrected');assert.deepEqual(result.artifactIndex,[{...artifact,path:path.basename(artifact.path)}]);assert.deepEqual(result.context.artifactRefs,[0]);assert.equal(result.dependencyHash,'unchanged');
});

test('assessment batching measures projected questions and preserves complete ownership',async t=>{
 const f=fixture(t),section=f.project.sections[1],original=section.blocks[0];
 section.blocks=Array.from({length:4},(_,i)=>({...structuredClone(original),id:'q'+i,content:{...original.content,id:'root'+i},sourceReview:{verification:{duplicatedAudit:'x'.repeat(30000)}}}));
 const file=f.write('primary','project.json',f.project),plan=await nextBoundedWork({runDir:f.runDir,projectFile:file,selectedPages:[]});
 const jobs=plan.jobs.filter(j=>j.stage==='assessment'&&j.ownershipIds.includes('question:q0'));
 assert.equal(jobs.length,1);assert.deepEqual(jobs[0].ownershipIds,['question:q0','question:q1','question:q2','question:q3']);assert.ok(jobs[0].variableCharacters<24000);assert.ok(jobs[0].canonicalContextCharacters>120000);
});

test('prompt corrections reference only exact values in delivered current content',()=>{
 const prompt={format:'maths-editor-document-v1',blocks:[{id:'a/b~c',type:'paragraph',inlines:[{type:'text',text:'Complete source question '.repeat(30)}]}]},unique={...prompt,extra:'Unique correction remains byte-exact'};
 const stripped={verification:{signature:'x'.repeat(200)}};
 const patches=[{targetId:'q',field:'/content/prompt',corrected:prompt},{targetId:'q',field:'/unique',corrected:unique},{targetId:'q',field:'/sourceReview',corrected:stripped}];
 const job={stage:'assessment',ownershipIds:['question:q'],dependencyHash:'same',evidence:[],context:{questions:[{id:'q',content:{prompt},sourceReview:stripped}],decisions:[{id:'fix',reason:'Exact approved correction',sourceRefs:[{pageNumber:6}],patches}]}};
 const before=JSON.stringify(job),result=boundedPromptPayload(job),actual=result.context.decisions[0].patches;
 assert.equal(JSON.stringify(job),before);assert.deepEqual(result.context.questions[0].content.prompt,prompt);
 assert.equal(actual[0].corrected,undefined);assert.equal(actual[0].correctedValueRef,'/context/questions/0/content/prompt');
 const resolved=actual[0].correctedValueRef.slice(1).split('/').reduce((v,k)=>v[k.replaceAll('~1','/').replaceAll('~0','~')],result);
 assert.equal(JSON.stringify(resolved),JSON.stringify(prompt));assert.deepEqual(actual[1].corrected,unique);assert.deepEqual(actual[2].corrected,stripped);
 assert.equal(actual[0].targetId,'q');assert.equal(actual[0].field,'/content/prompt');assert.equal(result.context.decisions[0].reason,'Exact approved correction');assert.deepEqual(result.context.decisions[0].sourceRefs,[{pageNumber:6}]);
 assert.ok(JSON.stringify(result).length<before.length);
});

test('batch budget includes instructions, artifact index and decision overhead',async t=>{
 const f=fixture(t),section=f.project.sections[1],original=section.blocks[0];
 f.old.issues.old.resolution.reason='Decision details '.repeat(500);f.write('original','workflow/issues.json',f.old);
 section.blocks=Array.from({length:3},(_,i)=>({...structuredClone(original),id:'budget'+i,content:{...original.content,id:'budget-root'+i,prompt:'Substantive question '.repeat(320)}}));
 const file=f.write('primary','project.json',f.project),plan=await nextBoundedWork({runDir:f.runDir,projectFile:file,selectedPages:[]});
 const jobs=plan.jobs.filter(j=>j.stage==='assessment'&&j.ownershipIds.some(id=>id.includes('budget')));
 assert.ok(jobs.length>1);assert.equal(jobs.flatMap(j=>j.ownershipIds).length,3);for(const j of jobs)assert.ok(j.ownershipIds.length===1||j.variableCharacters<=24000);
});

test('assessment method artifacts share the indexed provenance without repeating absolute paths',()=>{
 const artifact={path:'/long/local/source/review/result.json',hash:'result-hash',runId:'original',page:25};
 const job={stage:'assessment',dependencyHash:'stable',ownershipIds:['question:q'],evidence:[artifact],context:{questions:[{id:'q',content:{prompt:'Read the plot',answer:{short:'2',worked:'Count two leaves.'}}}],teaching:{methods:[{statement:'Count the leaves',sourceRefs:[{pageNumber:25}]}],artifacts:[artifact]},decisions:[]}};
 const before=JSON.stringify(job),result=boundedPromptPayload(job);
 assert.equal(JSON.stringify(job),before);assert.deepEqual(result.context.questions,job.context.questions);assert.deepEqual(result.context.teaching.methods,job.context.teaching.methods);assert.deepEqual(result.context.teaching.artifactRefs,[0]);assert.equal(result.context.teaching.artifacts,undefined);assert.deepEqual(result.artifactIndex,[{...artifact,path:path.basename(artifact.path)}]);
});

test('teaching source and summary indexing preserves exact scoped metadata and rejects conflicting hashes',()=>{
 const source={path:'/evidence/pages/page-006.png',hash:'source-hash',page:6,role:'primary-source',runId:'original'},summary={path:'/long/local/result.json',hash:'review-hash',reviewer:'Actual independent reviewer'};
 const content={prompt:'Preserve the exact task',answer:{short:'2',worked:'1+1=2'},diagrams:[{code:'Exact editable diagram'}]};
 const job={stage:'assessment',ownershipIds:['question:q'],dependencyHash:'unchanged',evidence:[{...source,role:'delivered-image'}],images:[source.path],context:{questions:[{id:'q',content}],teaching:{methods:[{statement:'Use the taught method',sourceRefs:[{pageNumber:6}]}],sourceArtifacts:[source],summaryArtifacts:[summary]}}};
 const before=structuredClone(job),payload=boundedPromptPayload(job);
 const expand=reference=>{const {artifactRef,...metadata}=reference,artifact=payload.artifactIndex[artifactRef];return {path:artifact.path,hash:artifact.hash,...metadata};};
 assert.deepEqual(job,before);assert.deepEqual(payload.context.questions,job.context.questions);assert.deepEqual(payload.context.teaching.methods,job.context.teaching.methods);assert.equal(payload.dependencyHash,job.dependencyHash);
 assert.deepEqual(expand(payload.context.teaching.sourceArtifacts[0]),{...source,path:'evidence/pages/page-006.png'});
 assert.deepEqual(expand(payload.context.teaching.summaryArtifacts[0]),{...summary,path:'result.json'});
 assert.equal(payload.context.teaching.sourceArtifacts[0].artifactRef,payload.inputImages[0].artifactRef);assert.equal(payload.artifactIndex.length,2);
 const conflict=structuredClone(job);conflict.context.teaching.sourceArtifacts[0].hash='changed-source';assert.throws(()=>boundedPromptPayload(conflict),/conflicting source hashes/);
});

test('assessment projection changes preserve claimed ownership while future batches use the same limits',()=>{
 const questions=Array.from({length:7},(_,index)=>({id:'q'+index,content:{prompt:'Question '+index}}));
 const claim={stage:'assessment',ownershipIds:['question:q1','question:q2'],dependencyHash:'original-dependencies'},claims={existing:claim},before=structuredClone({questions,claims});
 const groups=assessmentQuestionGroups(questions,claims,group=>group.length*100);
 assert.deepEqual(groups.map(group=>group.map(q=>q.id)),[['q0'],['q1','q2'],['q3','q4','q5','q6']]);
 assert.deepEqual({questions,claims},before);assert.equal(claim.dependencyHash,'original-dependencies');assert.equal(new Set(groups.flat().map(q=>q.id)).size,questions.length);
 const changed=structuredClone(questions);changed[2].content.prompt='Changed source-facing task';
 const rebuilt=assessmentQuestionGroups(changed,claims,group=>group.length*100);assert.equal(rebuilt[1][1].content.prompt,'Changed source-facing task');assert.equal(claim.dependencyHash,'original-dependencies');
 assert.deepEqual(assessmentQuestionGroups(questions,{},group=>group.length*100).map(group=>group.map(q=>q.id)),[['q0','q1','q2','q3'],['q4','q5','q6']]);
 assert.throws(()=>assessmentQuestionGroups(questions,{one:claim,two:{stage:'assessment',ownershipIds:['question:q2']}},()=>0),/claims overlap/);
});

test('assessment deduplicates exact repeated decisions across teaching and question scopes',()=>{
 const artifact={path:'/source.png',hash:'source'},decision={id:'resolved',reason:'Preserve the source interpretation',evidence:[artifact],resolution:{status:'retained',reason:'Preserve the source interpretation',evidence:[artifact]}};
 const unique={id:'teaching-only',reason:'Use the taught method',resolution:{status:'retained',reason:'Use the taught method'}};
 const job={stage:'assessment',ownershipIds:['question:q'],dependencyHash:'stable',evidence:[artifact],context:{questions:[{id:'q',content:{prompt:'Calculate',answer:{short:'2',worked:'1+1=2'}}}],decisions:[decision],teaching:{decisions:[structuredClone(decision),unique]}}};
 const before=structuredClone(job),result=boundedPromptPayload(job);
 assert.deepEqual(job,before);assert.deepEqual(result.context.teaching.decisions[0],{decisionValueRef:'/context/decisions/0'});
 assert.equal(result.context.decisions[0].resolution.status,'retained');assert.equal(result.context.decisions[0].reason,decision.reason);
 assert.equal(result.context.teaching.decisions[1].id,'teaching-only');assert.equal(result.context.teaching.decisions[1].reason,unique.reason);
 assert.equal(result.dependencyHash,'stable');assert.deepEqual(result.context.questions,job.context.questions);
});

test('assessment teacher evidence retains its owning source run despite colliding page labels',async t=>{
 const f=fixture(t);for(const s of f.project.sections.filter(s=>s.phase==='practice'))s.blocks[0].sourceReview={answerEvidence:{teacherReference:{pdfPage:6}}};
 const original=f.write('original','evidence/teacher/pages/page-006.png','original answer'),file=f.write('primary','project.json',f.project),options={runDir:f.runDir,projectFile:file,selectedPages:[]};
 let plan=await nextBoundedWork(options);assert.ok(!plan.jobs.find(j=>j.stage==='assessment'&&j.ownershipIds.includes('question:q')).blockers.some(b=>b.includes('Teacher answer image missing')));
 assert.ok(plan.jobs.find(j=>j.stage==='assessment'&&j.ownershipIds.includes('question:new--q')).blockers.some(b=>b.includes('Teacher answer image missing for primary page 6')));
 const theory=plan.jobs.find(j=>j.stage==='theory'&&j.ownershipIds.includes('exercise:topic')),preparedTheory=await prepareBoundedStage(options,theory.id);
 await recordBoundedStage(options,{ticket:preparedTheory.ticket,result:{reviewer:'Fixture reviewer',note:'Fixture teaching evidence',outcome:'accepted',sourceCompared:true,methods:[{statement:'Use the original taught method',sourceRefs:[{runId:'original',pageNumber:6}]}]}});
 plan=await nextBoundedWork(options);const assessment=plan.jobs.find(j=>j.stage==='assessment'&&j.ownershipIds.includes('question:q')),prepared=await prepareBoundedStage(options,assessment.id),ticket=JSON.parse(fs.readFileSync(prepared.ticket.path));
 const answer=ticket.job.evidence.find(e=>e.role==='teacher-answer');assert.equal(answer.path,original);assert.equal(answer.runId,'original');assert.equal(answer.hash,bytesHash(original));assert.ok(ticket.job.images.includes(original));assert.ok(!ticket.job.images.some(p=>p.includes(path.join('primary','evidence','teacher'))));
});
