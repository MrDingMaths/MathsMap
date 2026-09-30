import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,loadBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {revisionHash,writeTransaction} from '../scripts/booklet/bank-sync.mjs';
import {makeBankManifest} from '../src/lib/practice-question-model.js';
import {importProjectBank,practiceQuestions,verifyProjectBank} from '../scripts/booklet/import-project-bank.mjs';
import {contentVerificationKey} from '../src/lib/booklet-content-verification.js';
import {loadWorkflow,liveWorkflow,registerInventory,registerAuthor,sourceEvidence,representativeKey,settlementKey,bytesHash,acceptFinalReview,FINAL_EDITIONS} from '../scripts/booklet/workflow-review.mjs';
import {verificationDependencies,recordVerification,verificationStatus} from '../scripts/booklet/import-verification.mjs';
import {rendererSignature} from '../scripts/booklet/verification-cache.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {fromSource} from '../src/lib/document-content.js';
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';

const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const write=async(f,v)=>{await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,JSON.stringify(v,null,2)+'\n');};
test('bank transfer verifies projected prompts and layouts while retaining owner headings',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 b.content.prompt=fromSource('Find the side.');
 b.content.prompt.blocks.unshift({id:'source-category',type:'paragraph',inlines:[{type:'text',text:'Essential problems'}]});
 b.sourceReview={sourceCategoryHeading:{text:'Essential problems',paragraphId:'source-category'}};
 f.saved.settings.layoutOverrides={blockLayouts:{[b.id]:{arrangement:arrangementCatalog(b).initial}},answerSpaces:{},diagramColourModes:{}};
 await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);
 await write(f.args.assessmentsFile,f.assessments);
 await importProjectBank(f.args);await importProjectBank({...f.args,apply:true});
 const live=await loadBookletProject(f.saved.id,f.options),block=practiceQuestions(live)[0];
 assert.equal(block.content.prompt.blocks[0].id,'source-category');
 const bank=await read(path.join(f.options.bankRoot,block.bankRef.id+'.json'));
 assert.equal(bank.content.prompt.blocks.length,1);
 assert.deepEqual(resolveArrangement({...bank,type:'question'},bank.presentation.layoutOverrides.blockLayouts[b.id].arrangement).missing,[]);
 const receipt=await read(path.join(f.args.out,'receipt.json'));assert.equal(receipt.bankProjection.questions.length,1);
 assert.equal((await importProjectBank({...f.args,apply:true})).created,0);
});
async function fixture(t){
  const parent=path.resolve('.booklet-work/bank-import-tests');await fs.mkdir(parent,{recursive:true});
  const root=await fs.mkdtemp(path.join(parent,'case-'));
  t.after(async()=>{assert.ok(root.startsWith(parent+path.sep));await fs.rm(root,{recursive:true,force:true});});
  const options={projectRoot:path.join(root,'booklets/projects'),bankRoot:path.join(root,'booklets/question-bank')};
  await write(path.join(root,'data/skills.json'),[{id:'sine-rule',courses:['s5-core'],dotPointIds:['trig']},{id:'cosine-rule',courses:['s5-core'],dotPointIds:['trig']},{id:'find-rule-from-table',courses:['s3'],dotPointIds:['patterns']}]);
  await write(path.join(root,'data/dotpoints.json'),[{id:'trig',topicId:'t-s5-trig'},{id:'patterns',topicId:'t-s3-mr-b'}]);
  await write(path.join(options.bankRoot,'manifest.json'),makeBankManifest([]));
  await write(path.join(options.bankRoot,'.sync/links.json'),{});
  const p=createEditableProject({id:'test-transfer',title:'Transfer'});
  const b=createProjectBlock('question');b.id='q-source';b.content.prompt='Find the side.';b.content.answer={short:'2',worked:'The side is 2.',solutionDiagrams:[]};
  p.sections[0].phase='practice';p.sections[0].blocks=[{...createProjectBlock('callout'),id:'source-teaching',content:'Sine rule connects each side with its opposite angle.'},b];
  const saved=await createBookletProject(p,options),assessments={projectId:p.id,questions:practiceQuestions(saved).map(b=>({sourceBlockId:b.id,mappingNote:'Apply the sine rule taught in the source example.',contentHash:revisionHash(b.content),classification:{primarySkillId:'sine-rule',secondarySkillIds:[],difficulty:'Foundation',reasoningScore:20,difficultyReason:'Direct side calculation.'}}))};
  assessments.sourceContext={projectHash:revisionHash(saved),courseIds:['s5-core'],topicIds:['t-s5-trig'],evidenceBlockIds:['source-teaching']};
  const assessmentsFile=path.join(root,'assessments.json');await write(assessmentsFile,assessments);
  const args={root,projectId:p.id,assessmentsFile,out:path.join(root,'stage')};return {root,options,args,assessments,saved};
}

test('stage reuse preserves IDs; publication is idempotent and owner saves sync',async t=>{
  const f=await fixture(t);const initial=await importProjectBank(f.args);assert.equal(initial.applied,false);
  const entry={id:'source-question',targetId:'q-source',kind:'question',pageNumber:1};
  const sourceKey=await contentVerificationKey(f.saved,entry);
  const staged=await read(path.join(f.args.out,'projects',f.saved.id+'.json'));
  assert.equal(practiceQuestions(staged)[0].snapshotKind,'bank');
  assert.ok(practiceQuestions(staged)[0].canonicalId);
  assert.equal(await contentVerificationKey(staged,entry),sourceKey,'Bank ownership preserves whole-question source verification');
  for(const mutate of [
    p=>practiceQuestions(p)[0].content.prompt='Find another side.',
    p=>practiceQuestions(p)[0].content.answer.short='3',
    p=>practiceQuestions(p)[0].content.answer.worked='A different method.',
    p=>practiceQuestions(p)[0].content.questionDiagrams=[{id:'changed-diagram',format:'tikz',code:'changed'}],
    p=>practiceQuestions(p)[0].sourceRefs=[{pageNumber:2}],
    p=>p.source={...p.source,sourceHashes:{pdf:'changed-source'}}
  ]){const changed=structuredClone(staged);mutate(changed);assert.notEqual(await contentVerificationKey(changed,entry),sourceKey,'Content and source changes still invalidate verification');}
  const receipt=await read(path.join(f.args.out,'receipt.json'));
  assert.equal((await importProjectBank(f.args)).reused,true);
  assert.deepEqual(await read(path.join(f.args.out,'receipt.json')),receipt);
  const applied=await importProjectBank({...f.args,apply:true});assert.equal(applied.reused,true);
  const live=await loadBookletProject(f.saved.id,f.options);assert.equal(live.revision,f.saved.revision+1);
  assert.equal(await contentVerificationKey(live,entry),sourceKey,'Published save/reopen preserves source verification');
  assert.equal((await importProjectBank({...f.args,apply:true})).created,0);
  const original=practiceQuestions(live)[0].content.answer.worked;
  practiceQuestions(live)[0].content.answer.worked='A revised explanation gives 2.';
  const edited=await saveBookletProject(live,{...f.options,expectedRevision:live.revision});
  const bankFile=path.join(f.options.bankRoot,receipt.questions[0].bankId+'.json');
  assert.equal((await read(bankFile)).content.answer.worked,'A revised explanation gives 2.');
  practiceQuestions(edited)[0].content.answer.worked=original;
  const restored=await saveBookletProject(edited,{...f.options,expectedRevision:edited.revision});
  assert.equal((await verifyProjectBank(restored,f.options.bankRoot,{root:f.root,baseline:f.saved,assessments:f.assessments})).ownedAndSynced,1);
});

test('stale source and edited staging cannot publish',async t=>{
  const f=await fixture(t);await importProjectBank(f.args);
  const p=await loadBookletProject(f.saved.id,f.options);p.title='Concurrent edit';await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
  await assert.rejects(importProjectBank({...f.args,apply:true}),/Source classification context is stale/);
  assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
  const g=await fixture(t);await importProjectBank(g.args);
  const receipt=await read(path.join(g.args.out,'receipt.json'));receipt.method='Tampered';await write(path.join(g.args.out,'receipt.json'),receipt);
  await assert.rejects(importProjectBank({...g.args,apply:true}),/Staged artifacts changed/);
});

test('new-policy runs cannot stage or publish with absent verification evidence',async t=>{
 const f=await fixture(t),source=path.join(f.options.projectRoot,f.saved.id+'.json');
 f.saved.source={...f.saved.source,workflow:{runId:'new-policy',pipelinePolicy:'pdf-import-efficient-v1'}};
 await write(source,f.saved);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);
 await assert.rejects(importProjectBank(f.args),/verification run is unavailable/);
 const run=path.join(f.root,'.booklet-work/full-imports/new-policy');await write(path.join(run,'manifest.json'),{id:'new-policy',pipelinePolicy:'pdf-import-efficient-v1',selectedPages:[]});
 for(const apply of [false,true])await assert.rejects(importProjectBank({...f.args,apply}),/Import verification pending/);
 assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
});

async function existingTransferFixture(t){
 const f=await fixture(t);f.saved.source={type:'full-booklet-import',workflow:{runId:'component-run',pipelinePolicy:'pdf-import-efficient-v1'}};f.saved.library={category:'master'};f.saved.revision=3;
 await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 const acceptance=path.join(f.root,'historical-acceptance.json'),snapshot=path.join(f.root,'reviewed-project.json'),proof=path.join(f.root,'maintenance.json');
 await write(acceptance,{project:{id:f.saved.id,revision:1},acceptedAt:'2026-09-01T00:00:00Z',checks:[{id:'final-editions',passed:true}]});await write(snapshot,f.saved);await write(proof,{outcome:'passed',note:'Synthetic scoped-maintenance evidence'});
 const ref=file=>({path:file,hash:bytesHash(file)});
 f.assessments.sourceContext.projectHash=revisionHash(f.saved);
 f.assessments.existingTransferReview={profile:'existing-booklet-transfer-v1',projectHash:revisionHash(f.saved),reviewer:'Synthetic transfer reviewer',note:'Published booklet, unchanged practice content and presentation.',historicalAcceptance:ref(acceptance),projectSnapshot:ref(snapshot),baselineSnapshot:ref(snapshot),artifacts:[ref(proof)],questions:practiceQuestions(f.saved).map(q=>({sourceBlockId:q.id,contentHash:revisionHash(q.content),reviewer:'Synthetic question reviewer',outcome:'passed',checks:{answer:true,skillMapping:true,taughtMethod:true},note:'Source question and teaching context checked.'}))};
 await write(f.args.assessmentsFile,f.assessments);return {...f,acceptance,snapshot,proof};
}

test('existing accepted transfers use scoped evidence without rewriting component workflow registers',async t=>{
 const f=await existingTransferFixture(t),ordinaryFile=path.join(f.root,'ordinary.json'),ordinary=structuredClone(f.assessments);delete ordinary.existingTransferReview;await write(ordinaryFile,ordinary);
 await assert.rejects(importProjectBank({...f.args,assessmentsFile:ordinaryFile}),/verification run is unavailable/);
 assert.equal((await importProjectBank(f.args)).questions,1);await importProjectBank({...f.args,apply:true});assert.equal((await importProjectBank({...f.args,apply:true})).created,0);
 const receipt=await read(path.join(f.root,'booklets/provenance',f.saved.id,'bank-import.json'));assert.equal(receipt.existingTransferReview.profile,'existing-booklet-transfer-v1');
 assert.deepEqual((await read(path.join(f.options.projectRoot,f.saved.id+'.json'))).source,f.saved.source);
 await assert.rejects(fs.access(path.join(f.root,'.booklet-work/full-imports/component-run/workflow/issues.json')));
});

test('scoped transfer rejects missing acceptance, stale evidence and incomplete question review',async t=>{
 for(const kind of ['acceptance','snapshot','question','import-review']){
  const f=await existingTransferFixture(t),r=f.assessments.existingTransferReview;
  if(kind==='acceptance'){await write(f.acceptance,{project:{id:f.saved.id,revision:1},acceptedAt:'2026-09-01T00:00:00Z',checks:[{id:'final-editions',passed:false}]});r.historicalAcceptance.hash=bytesHash(f.acceptance);}
  if(kind==='snapshot')await write(f.proof,{outcome:'changed'});
  if(kind==='question')r.questions[0].checks.taughtMethod=false;
  if(kind==='import-review'){f.saved.library.category='import-review';await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);r.projectHash=revisionHash(f.saved);f.assessments.sourceContext.projectHash=r.projectHash;}
  await write(f.args.assessmentsFile,f.assessments);await assert.rejects(importProjectBank(f.args));assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
 }
});

test('scoped transfer rechecks maintenance evidence before publication',async t=>{
 const f=await existingTransferFixture(t);await importProjectBank(f.args);await write(f.proof,{outcome:'changed after staging'});await assert.rejects(importProjectBank({...f.args,apply:true}),/evidence is stale/);assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
});

test('implementation-only stage reverification retains promoted IDs and checks all staged records',async t=>{
 const f=await fixture(t);await importProjectBank(f.args);const file=path.join(f.args.out,'stage.json'),state=await read(file),receipt=await read(path.join(f.args.out,'receipt.json'));state.inputs.implementation='0'.repeat(64);await write(file,state);
 await assert.rejects(importProjectBank(f.args),/Staging inputs changed/);
 assert.equal((await importProjectBank({...f.args,reverifyStage:true})).reused,true);assert.deepEqual(await read(path.join(f.args.out,'receipt.json')),receipt);assert.equal((await read(file)).reverifications.length,1);
 await importProjectBank({...f.args,reverifyStage:true,apply:true});assert.equal((await importProjectBank({...f.args,apply:true})).created,0);
});

test('stage reverification cannot accept changed inputs or edited bank artifacts',async t=>{
 for(const kind of ['bank-input','stage-bank']){
  const f=await fixture(t);await importProjectBank(f.args);
  if(kind==='bank-input')await write(path.join(f.options.bankRoot,'manifest.json'),{format:'changed',questions:[]});
  else{const receipt=await read(path.join(f.args.out,'receipt.json')),file=path.join(f.args.out,'bank',receipt.questions[0].bankId+'.json'),bank=await read(file);bank.content.answer.worked='Unreviewed';await write(file,bank);}
  await assert.rejects(importProjectBank({...f.args,reverifyStage:true,apply:true}));assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
 }
});

test('new-policy publication pins accepted evidence and requires one idempotent readback',async t=>{
 const f=await fixture(t),sourceFile=path.join(f.options.projectRoot,f.saved.id+'.json'),run=path.join(f.root,'.booklet-work/full-imports/registered-run');
 f.saved.source={...f.saved.source,workflow:{runId:'registered-run',pipelinePolicy:'pdf-import-efficient-v1'}};await write(sourceFile,f.saved);
 f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);
 await write(path.join(run,'manifest.json'),{id:'registered-run',selectedPages:[1],pipelinePolicy:'pdf-import-efficient-v1'});
 const proof=path.join(run,'synthetic-proof.json');await write(proof,{note:'Synthetic regression acceptance only'});const artifacts=[{path:proof,hash:bytesHash(proof)}],runtime=rendererSignature();
 const inventory={pageNumber:1,entries:[{id:'source-q',targetId:'q-source',kind:'question',description:'Synthetic fixture question'}],layoutPatterns:[{id:'plain',description:'Plain fixture'}]};
 const packet={pageNumber:1,sections:f.saved.sections,inventoryMappings:[{inventoryId:'source-q',targetId:'q-source'}]};
 await write(path.join(run,'semantic-packets/page-001.inventory.json'),inventory);await write(path.join(run,'semantic-packets/page-001.author.json'),packet);
 const state=loadWorkflow(run);registerInventory(state,inventory,sourceEvidence(run,1));registerAuthor(state,inventory,packet);state.pages[1].mathReview={key:state.pages[1].inventoryHash,artifacts};
 state.representatives.plain={page:1,key:representativeKey(state,1),renderer:runtime,artifacts};
 state.settled={key:settlementKey(state),project:{file:sourceFile,hash:projectReviewHash(f.saved)},artifacts:[...artifacts,{path:sourceFile,hash:bytesHash(sourceFile)}]};
 const record={reviewer:'Synthetic regression',note:'No actual publication approval',artifacts,key:state.settled.key,sourceCompared:true,contentVerified:true,presentationVerified:true,editions:{}};
 for(const edition of FINAL_EDITIONS){const pdf=path.join(run,edition+'.pdf'),manifest=path.join(run,edition+'.json'),pages=[{page:1,hash:'synthetic-page'}];await fs.writeFile(pdf,'Synthetic PDF');await write(manifest,{mode:'full',passed:true,edition,workflowKey:record.key,projectHash:state.settled.project.hash,renderer:runtime,pages,pdf:{path:pdf,hash:bytesHash(pdf)}});record.editions[edition]={allPagesVisuallyInspected:true,pages:pages.map(p=>({...p,checked:true})),artifacts,manifest:{path:manifest,hash:bytesHash(manifest)}};}
 acceptFinalReview(state,record);const deps=verificationDependencies(state,f.saved),common={reviewer:'Synthetic regression',note:'Synthetic test evidence',artifacts,outcome:'passed'};
 recordVerification(state,{...common,id:'question:q-source',dependencies:{question:deps.questions['q-source']},checks:{answer:true,skillMapping:true,taughtMethod:true}},deps);
 for(const id of ['ui','build','regressions','storage'])recordVerification(state,{...common,id,dependencies:{...deps},checks:{filtering:true,solutions:true,worksheet:true,saveReopen:true,ownershipSync:true}},deps);
 await write(path.join(run,'workflow/issues.json'),state);
 assert.equal((await importProjectBank({...f.args,apply:true})).applied,true);
 let current=liveWorkflow(run),accepted=await read(current.settled.project.file);
 assert.equal(verificationStatus(current,accepted,{phase:'complete',validateFinal:()=>acceptFinalReview(structuredClone(current),current.finalReview)}).ok,false);
 assert.equal((await importProjectBank({...f.args,apply:true})).created,0);
 current=liveWorkflow(run);accepted=await read(current.settled.project.file);
 const status=verificationStatus(current,accepted,{phase:'complete',validateFinal:()=>acceptFinalReview(structuredClone(current),current.finalReview)});assert.equal(status.ok,true,status.issues.join('; '));
 const published=await read(sourceFile);published.title='Changed after readback';await write(sourceFile,published);assert.equal(verificationStatus(current,accepted,{phase:'complete'}).ok,false);
});

test('changed bank, assessments and stale content hashes reject reuse',async t=>{
  const f=await fixture(t);await importProjectBank(f.args);
  await write(path.join(f.options.bankRoot,'.sync/links.json'),{unrelated:{projectId:'other'}});
  await assert.rejects(importProjectBank({...f.args,apply:true}),/Staging inputs changed/);
  const g=await fixture(t);await importProjectBank(g.args);g.assessments.questions[0].classification.reasoningScore=21;await write(g.args.assessmentsFile,g.assessments);
  await assert.rejects(importProjectBank({...g.args,apply:true}),/Staging inputs changed/);
  g.assessments.questions[0].contentHash='stale';await write(g.args.assessmentsFile,g.assessments);
  await assert.rejects(importProjectBank(g.args),/assessment is stale/);
});

test('shared transaction rolls back an earlier write when a later rename fails',async t=>{
  const f=await fixture(t),first=path.join(f.root,'first.json'),blocked=path.join(f.root,'blocked.json');
  await write(first,{before:true});await write(blocked,{before:true});
  // A directory at the temporary filename forces failure after first was written.
  await fs.mkdir(blocked+'.sync-tmp');
  await assert.rejects(writeTransaction([[first,{after:true}],[blocked,{after:true}]]));
  assert.deepEqual(await read(first),{before:true});assert.deepEqual(await read(blocked),{before:true});
});


test('new imports require source evidence and review out-of-topic secondary tags',async t=>{
 const f=await fixture(t),context=f.assessments.sourceContext;
 delete f.assessments.sourceContext;await write(f.args.assessmentsFile,f.assessments);
 await assert.rejects(importProjectBank(f.args),/Source classification context is required/);
 f.assessments.sourceContext=context;f.assessments.questions[0].classification.secondarySkillIds=['find-rule-from-table'];await write(f.args.assessmentsFile,f.assessments);
 await assert.rejects(importProjectBank(f.args),/outside the source/);
 assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
 f.assessments.questions[0].sourceContextException='A separate part explicitly assesses a prerequisite table pattern.';await write(f.args.assessmentsFile,f.assessments);
 assert.equal((await importProjectBank(f.args)).questions,1);
});

test('an interrupted isolated stage retains IDs and reconciles newly reviewed content through owner save',async t=>{
 const f=await fixture(t),second=structuredClone(practiceQuestions(f.saved)[0]);second.id='q-source-2';second.content.id='second-content';second.content.prompt='Find the other side.';f.saved.sections[0].blocks.push(second);
 practiceQuestions(f.saved)[0].content.answer.solutionDiagrams=[{id:'number-line',format:'tikz',widthMm:40,code:'\\begin{tikzpicture}\\node at (2,0) {$2$};\\end{tikzpicture}'}];
 f.saved=await saveBookletProject(f.saved,{...f.options,expectedRevision:f.saved.revision});
 const refresh=p=>{f.assessments.questions=practiceQuestions(p).map(b=>({...structuredClone(f.assessments.questions[0]),sourceBlockId:b.id,contentHash:revisionHash(b.content)}));f.assessments.sourceContext.projectHash=revisionHash(p);};refresh(f.saved);await write(f.args.assessmentsFile,f.assessments);
 const previousAssessments=path.join(f.root,'previous-assessments.json');await write(previousAssessments,f.assessments);
 await assert.rejects(importProjectBank({...f.args,onProgress:r=>{if(r.promoted===1)throw Error('Simulated interruption');}}),/Simulated interruption/);
 const interruptedFile=path.join(f.args.out,'projects',f.saved.id+'.json'),interrupted=await read(interruptedFile),oldId=practiceQuestions(interrupted)[0].bankRef.id,oldBank=await read(path.join(f.args.out,'bank',oldId+'.json'));
 assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
 practiceQuestions(f.saved)[0].content.answer.worked='The reviewed sine-rule calculation gives a side of 2.';
 practiceQuestions(f.saved)[0].content.answer.solutionDiagrams[0].code='\\begin{tikzpicture}\\node at (2,0) {\\special{dvisvgm:raw <g data-graph-text="tick">}$2$\\special{dvisvgm:raw </g>}};\\end{tikzpicture}';
 f.saved=await saveBookletProject(f.saved,{...f.options,expectedRevision:f.saved.revision});refresh(f.saved);await write(f.args.assessmentsFile,f.assessments);
 const retry={...f.args,out:path.join(f.root,'retry'),resumeFrom:f.args.out,resumeAssessmentsFile:previousAssessments};
 const result=await importProjectBank(retry);assert.equal(result.questions,2);assert.equal(result.ownedAndSynced,2);
 const staged=await read(path.join(retry.out,'projects',f.saved.id+'.json'));assert.equal(practiceQuestions(staged)[0].bankRef.id,oldId);assert.ok(practiceQuestions(staged)[1].bankRef.id);
 assert.equal((await read(path.join(retry.out,'bank',oldId+'.json'))).content.answer.worked,practiceQuestions(f.saved)[0].content.answer.worked);
 assert.equal((await read(path.join(retry.out,'bank',oldId+'.json'))).content.answer.solutionDiagrams[0].code,practiceQuestions(f.saved)[0].content.answer.solutionDiagrams[0].code);
 assert.deepEqual(await read(interruptedFile),interrupted);assert.deepEqual(await read(path.join(f.args.out,'bank',oldId+'.json')),oldBank);
 assert.equal((await read(path.join(retry.out,'receipt.json'))).resume.reusedQuestions,1);
 await importProjectBank({...retry,apply:true});assert.equal((await importProjectBank({...retry,apply:true})).created,0);
});

test('interrupted-stage reuse rejects altered bank records and stale previous review evidence',async t=>{
 for(const kind of ['bank','review']){
  const f=await fixture(t),priorAssessments=path.join(f.root,'previous-assessments.json');await write(priorAssessments,f.assessments);
  await assert.rejects(importProjectBank({...f.args,onProgress:()=>{throw Error('Interrupted');}}),/Interrupted/);
  if(kind==='bank'){const p=await read(path.join(f.args.out,'projects',f.saved.id+'.json')),file=path.join(f.args.out,'bank',practiceQuestions(p)[0].bankRef.id+'.json'),q=await read(file);q.content.answer.worked='Unreviewed alteration';await write(file,q);}
  else{const a=await read(priorAssessments);a.sourceContext.projectHash='stale';await write(priorAssessments,a);}
  await assert.rejects(importProjectBank({...f.args,out:path.join(f.root,'retry'),resumeFrom:f.args.out,resumeAssessmentsFile:priorAssessments}));
  assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
 }
});

test('interrupted-stage reuse retains IDs when only stale score-derived bands are reconciled',async t=>{
 const f=await fixture(t),prior=path.join(f.root,'previous-assessments.json');
 f.assessments.questions[0].classification.difficulty='Development';
 await write(prior,f.assessments);await write(f.args.assessmentsFile,f.assessments);
 await assert.rejects(importProjectBank({...f.args,onProgress:()=>{throw Error('Interrupted');}}),/Interrupted/);
 const interrupted=await read(path.join(f.args.out,'projects',f.saved.id+'.json')),id=practiceQuestions(interrupted)[0].bankRef.id;
 f.assessments.questions[0].classification.difficulty='Foundation';await write(f.args.assessmentsFile,f.assessments);
 const retry={...f.args,out:path.join(f.root,'retry-bands'),resumeFrom:f.args.out,resumeAssessmentsFile:prior};
 await importProjectBank(retry);
 const staged=await read(path.join(retry.out,'projects',f.saved.id+'.json'));
 assert.equal(practiceQuestions(staged)[0].bankRef.id,id);
 assert.equal((await read(path.join(retry.out,'bank',id+'.json'))).classification.difficulty,'Foundation');
 assert.equal((await read(path.join(retry.out,'receipt.json'))).resume.reusedQuestions,1);
});

test('interrupted reuse requires the same source, inventory, classification and captured presentation',async t=>{
 for(const kind of ['source','inventory','classification','presentation']){
  const f=await fixture(t),priorAssessments=path.join(f.root,'previous-assessments.json');await write(priorAssessments,f.assessments);
  await assert.rejects(importProjectBank({...f.args,onProgress:()=>{throw Error('Interrupted');}}),/Interrupted/);
  if(kind==='source')f.saved.source={sourceHashes:{pdf:'different-original'}};
  if(kind==='inventory'){const b=structuredClone(practiceQuestions(f.saved)[0]);b.id='added';b.content.id='added-content';b.content.prompt='A newly inventoried question.';f.saved.sections[0].blocks.push(b);}
  if(kind==='presentation')practiceQuestions(f.saved)[0].content.answerSpaceMm=42;
  f.saved=await saveBookletProject(f.saved,{...f.options,expectedRevision:f.saved.revision});
  f.assessments.questions=practiceQuestions(f.saved).map(b=>({...structuredClone(f.assessments.questions[0]),sourceBlockId:b.id,contentHash:revisionHash(b.content)}));
  f.assessments.sourceContext.projectHash=revisionHash(f.saved);
  if(kind==='classification')f.assessments.questions[0].classification.reasoningScore=21;
  await write(f.args.assessmentsFile,f.assessments);
  const messages={source:/Original source bytes changed/,inventory:/Question inventory changed/,classification:/Reviewed classification changed/,presentation:/Question presentation changed/};
  await assert.rejects(importProjectBank({...f.args,out:path.join(f.root,'retry'),resumeFrom:f.args.out,resumeAssessmentsFile:priorAssessments}),messages[kind]);
  assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
 }
});
