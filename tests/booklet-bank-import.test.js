import {bankProjectionPolicy} from '../src/lib/question-bank-projection.js';
import {answerFragments} from '../src/lib/booklet-exercises.js';
import {assessedRating,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {contentHash} from '../scripts/booklet/lean-review.mjs';
import {transferTaskHash} from '../scripts/booklet/bank-transfer-review.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createEditableProject,createProjectBlock,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,loadBookletProject,promoteProjectQuestion} from '../scripts/booklet/project-studio-server.mjs';
import {projectSyncStatus,revisionHash,writeTransaction} from '../scripts/booklet/bank-sync.mjs';
import {normaliseQuestion,makeBankManifest} from '../src/lib/practice-question-model.js';
import {importProjectBank,practiceQuestions,verifyProjectBank} from '../scripts/booklet/import-project-bank.mjs';
import {bankLinkReport} from '../scripts/booklet/bank-links.mjs';
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

test('unresolved feedback is retained without blocking transfer and later owner repairs sync',async t=>{
 const f=await fixture(t);
 f.saved.studio={...f.saved.studio,version:1,flags:[{id:'pending-feedback',targetId:'q-source',note:'Review this answer later.',resolved:false,kind:'first-pass'}]};
 await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);
 assert.equal((await importProjectBank({...f.args,apply:true})).created,1);
 const p=await loadBookletProject(f.saved.id,f.options);
 assert.deepEqual(p.studio.flags,f.saved.studio.flags);
 const block=practiceQuestions(p)[0],bankFile=path.join(f.options.bankRoot,block.bankRef.id+'.json');
 block.content.answer.short='3';block.content.answer.worked='The corrected side is 3.';
 await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
 const bank=await read(bankFile);
 assert.equal(bank.content.answer.short,'3');assert.equal(bank.content.answer.worked,'The corrected side is 3.');
});

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

// Duplicate linking: a booklet may mix its own questions with questions owned elsewhere.
async function mixedFixture(t){
  const f=await fixture(t),question=(id,prompt,worked,skill)=>{const b=createProjectBlock('question');b.id=id;b.content.prompt=prompt;b.content.answer={short:'2',worked,solutionDiagrams:[]};b.classification={...b.classification,primarySkillId:skill};return b;};
  // Another booklet already owns two bank questions.
  const other=createEditableProject({id:'other-booklet',title:'Other'});other.sections[0].phase='practice';
  other.sections[0].blocks=[question('other-x','Find the hypotenuse.','Use the cosine rule.','cosine-rule'),question('other-y','Find the angle.','Use the cosine rule.','cosine-rule')];
  await createBookletProject(other,f.options);
  const bankX=(await promoteProjectQuestion(other.id,{blockId:'other-x',mode:'create'},f.options)).question,bankY=(await promoteProjectQuestion(other.id,{blockId:'other-y',mode:'create'},f.options)).question;
  // This booklet: its own question, a copy of X filed under another skill, a repeat of its own question, and Y with a different solution.
  const project=await loadBookletProject(f.saved.id,f.options);
  project.sections[0].blocks.push(question('q-copy','Find the hypotenuse.','Use the cosine rule.','sine-rule'),question('q-twin','Find the side.','The side is 2.','sine-rule'),question('q-held','Find the angle.','Use the sine rule twice.','sine-rule'));
  const saved=await saveBookletProject(project,{...f.options,expectedRevision:project.revision});
  f.assessments.sourceContext.projectHash=revisionHash(saved);await write(f.args.assessmentsFile,f.assessments);
  const bankIds=async()=>(await fs.readdir(f.options.bankRoot)).filter(n=>n.startsWith('q-')).map(n=>n.slice(0,-5)).sort();
  return {...f,saved,bankX,bankY,question,bankIds};
}

test('a mixed booklet creates, links and holds without publishing a duplicate',async t=>{
  const f=await mixedFixture(t),byId=p=>new Map(practiceQuestions(p).map(b=>[b.id,b]));
  const report=(await bankLinkReport({root:f.root})).find(row=>row.project===f.saved.id);
  assert.deepEqual([report.toCreate,report.toLink,report.held,report.owned],[1,2,1,0]);
  const staged=await importProjectBank(f.args);
  assert.deepEqual([staged.created,staged.linked,staged.held,staged.fullyLinked,staged.applied],[1,2,1,false,false]);
  assert.deepEqual(await f.bankIds(),[f.bankX.id,f.bankY.id].sort(),'Staging leaves the live bank alone');
  const applied=await importProjectBank({...f.args,apply:true});assert.equal(applied.applied,true);
  const live=byId(await loadBookletProject(f.saved.id,f.options)),created=live.get('q-source').bankRef.id;
  assert.deepEqual(await f.bankIds(),[f.bankX.id,f.bankY.id,created].sort());
  assert.equal(live.get('q-copy').bankRef.id,f.bankX.id);assert.equal(live.get('q-twin').bankRef.id,created);assert.equal(live.get('q-held').bankRef,null);
  for(const id of ['q-copy','q-twin','q-held'])assert.deepEqual(live.get(id).content,byId(f.saved).get(id).content,id+' content is untouched');
  // The copy was filed under another skill: the owner's record gains it, and the old revision stays for other consumers.
  const amended=await read(path.join(f.options.bankRoot,f.bankX.id+'.json'));
  assert.equal(amended.classification.primarySkillId,'cosine-rule');assert.deepEqual(amended.classification.secondarySkillIds,['sine-rule']);
  assert.deepEqual(await read(path.join(f.options.bankRoot,'.revisions',f.bankX.id,revisionHash(f.bankX)+'.json')),f.bankX);
  assert.equal(live.get('q-copy').bankRef.revision,revisionHash(amended));
  assert.deepEqual(await read(path.join(f.options.bankRoot,f.bankY.id+'.json')),f.bankY);
  const links=await read(path.join(f.options.bankRoot,'.sync/links.json'));
  assert.equal(links[created].blockId,'q-source');assert.equal(links[f.bankX.id].projectId,'other-booklet');
  const receipt=await read(path.join(f.root,'booklets/provenance',f.saved.id,'bank-import.json'));
  assert.deepEqual(receipt.questions.map(q=>[q.sourceBlockId,q.outcome,q.bankId??q.sameQuestionAs]),[['q-source','created',created],['q-copy','linked',f.bankX.id],['q-twin','linked',created],['q-held','held',[f.bankY.id]]]);
  assert.equal(receipt.questions[1].ownerProjectId,'other-booklet');
  // A rerun with only a held question left creates nothing.
  const again=await importProjectBank({...f.args,apply:true});
  assert.deepEqual([again.created,again.held,again.fullyLinked],[0,1,false]);assert.equal((await f.bankIds()).length,3);
  // Use existing: the held question adopts the bank's solution and the booklet is fully linked.
  await promoteProjectQuestion(f.saved.id,{blockId:'q-held',mode:'link-existing',targetId:f.bankY.id},f.options);
  const done=await importProjectBank({...f.args,apply:true});
  assert.deepEqual([done.created,done.held,done.fullyLinked,done.linkedExisting],[0,0,true,3]);assert.equal((await f.bankIds()).length,3);
  assert.equal(practiceQuestions(await loadBookletProject(f.saved.id,f.options)).find(b=>b.id==='q-held').content.answer.worked,'Use the cosine rule.');
});

test('a question kept separate is published by the next run with assessments for it alone',async t=>{
  const f=await mixedFixture(t);
  await assert.rejects(importProjectBank({...f.args,resumeFrom:path.join(f.root,'interrupted'),resumeAssessmentsFile:f.args.assessmentsFile}),/--resume-from supports only/);
  await importProjectBank({...f.args,apply:true});
  const decided=(await promoteProjectQuestion(f.saved.id,{blockId:'q-held',mode:'distinct',targetId:f.bankY.id},f.options)).project;
  const held=practiceQuestions(decided).find(b=>b.id==='q-held');
  const assessments={projectId:decided.id,sourceContext:{...f.assessments.sourceContext,projectHash:revisionHash(decided)},questions:[{...f.assessments.questions[0],sourceBlockId:'q-held',contentHash:revisionHash(held.content)}]};
  const assessmentsFile=path.join(f.root,'assessments-2.json'),args={...f.args,assessmentsFile,out:path.join(f.root,'stage-2')};
  // Assessments for every question are no longer accepted: only the new one needs review.
  await write(assessmentsFile,{...assessments,questions:[...assessments.questions,{...f.assessments.questions[0],contentHash:revisionHash(practiceQuestions(decided)[0].content)}]});
  await assert.rejects(importProjectBank(args),/exactly the 1 new questions/);
  await write(assessmentsFile,assessments);
  const second=await importProjectBank({...args,apply:true});
  assert.deepEqual([second.created,second.linked,second.held,second.fullyLinked],[1,0,0,true]);assert.equal((await f.bankIds()).length,4);
  const receipt=await read(path.join(f.root,'booklets/provenance',f.saved.id,'bank-import.json'));
  assert.deepEqual(receipt.questions.map(q=>q.outcome),['created','linked','linked','created']);
  assert.equal(receipt.questions[0].mappingNote,f.assessments.questions[0].mappingNote,'The first run\'s entry is kept');
  assert.equal((await importProjectBank({...args,apply:true})).created,0);
});

test('adding another bank question preserves existing owner-local paragraph spacing and still rejects changed answers',async t=>{
 const f=await fixture(t),first=practiceQuestions(f.saved)[0];first.content.prompt=fromSource('Find the side.');
 await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);f.assessments.questions[0].contentHash=revisionHash(first.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);
 await importProjectBank({...f.args,apply:true});
 const p=await loadBookletProject(f.saved.id,f.options),owned=practiceQuestions(p)[0];owned.content.prompt.blocks[0].spaceAfter=1;
 const next=createProjectBlock('question');next.id='q-added';next.content.prompt='Find the other side.';next.content.answer={short:'3',worked:'The other side is 3.',solutionDiagrams:[]};p.sections[0].blocks.push(next);
 const saved=await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
 const a={...f.assessments,sourceContext:{...f.assessments.sourceContext,projectHash:revisionHash(saved)},questions:[{...f.assessments.questions[0],sourceBlockId:next.id,contentHash:revisionHash(practiceQuestions(saved).find(b=>b.id===next.id).content)}]};
 const args={...f.args,out:path.join(f.root,'second-stage')};await write(args.assessmentsFile,a);assert.equal((await importProjectBank({...args,apply:true})).created,1);
 const live=await loadBookletProject(saved.id,f.options);assert.equal(practiceQuestions(live)[0].content.prompt.blocks[0].spaceAfter,1);
 const bankFile=path.join(f.options.bankRoot,practiceQuestions(live)[0].bankRef.id+'.json'),bank=await read(bankFile);bank.content.answer.short='Wrong answer';await write(bankFile,bank);
 await assert.rejects(verifyProjectBank(live,f.options.bankRoot,{root:f.root,baseline:live,assessments:{...a,questions:[]}}),/content and answers/);
});

test('later transfers retain historical ownership of removed source questions',async t=>{
 const f=await fixture(t);await importProjectBank({...f.args,apply:true});
 const p=await loadBookletProject(f.saved.id,f.options),retired=practiceQuestions(p)[0];
 const retiredFile=path.join(f.options.bankRoot,retired.bankRef.id+'.json'),retiredBytes=await fs.readFile(retiredFile,'utf8');
 const linksFile=path.join(f.options.bankRoot,'.sync/links.json'),oldLink=(await read(linksFile))[retired.bankRef.id];
 const next=createProjectBlock('question');next.id='q-added';next.content.prompt='Find the other side.';next.content.answer={short:'3',worked:'The other side is 3.',solutionDiagrams:[]};
 p.sections[0].blocks=p.sections[0].blocks.filter(b=>b.id!==retired.id);p.sections[0].blocks.push(next);
 const saved=await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
 const a={...f.assessments,sourceContext:{...f.assessments.sourceContext,projectHash:revisionHash(saved)},questions:[{...f.assessments.questions[0],sourceBlockId:next.id,contentHash:revisionHash(practiceQuestions(saved)[0].content)}]};
 const args={...f.args,out:path.join(f.root,'later-stage')};await write(args.assessmentsFile,a);
 assert.equal((await importProjectBank({...args,apply:true})).created,1);
 assert.equal(await fs.readFile(retiredFile,'utf8'),retiredBytes);
 assert.deepEqual((await read(linksFile))[retired.bankRef.id],oldLink);
 assert.equal((await importProjectBank(args)).created,0);
 const stagedLinksFile=path.join(args.out,'bank/.sync/links.json'),stagedLinks=await read(stagedLinksFile);
 stagedLinks[retired.bankRef.id].blockId='invented-owner';await write(stagedLinksFile,stagedLinks);
 const staged=await read(path.join(args.out,'projects',saved.id+'.json'));
 await assert.rejects(verifyProjectBank(staged,path.join(args.out,'bank'),{root:f.root,baseline:saved,assessments:a}),/Unexpected ownership/);
});

test('existing owner verification ignores paragraph identity but rejects changed answers',async t=>{
 const f=await fixture(t);const b=practiceQuestions(f.saved)[0];b.content.prompt=fromSource('Find the side.');await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);
 await importProjectBank({...f.args,apply:true});const live=await loadBookletProject(f.saved.id,f.options),local=practiceQuestions(live)[0];local.content.prompt.blocks[0].id='local-paragraph-id';
 const check=()=>verifyProjectBank(live,f.options.bankRoot,{root:f.root,baseline:structuredClone(live),assessments:{...f.assessments,questions:[]}});
 assert.equal((await check()).ownedAndSynced,1);
 local.content.answer.short='3';await assert.rejects(check(),/content and answers/);
});

async function acceptedMasterFixture(t){
 const f=await fixture(t);f.saved.library={category:'master'};f.saved.source={type:'full-booklet-import'};
 await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 const block=practiceQuestions(f.saved)[0],table=path.join(f.root,'reviewed.json');
 await write(table,{questions:{[block.id]:{outcome:'passed',hash:contentHash(block),note:'Source, answer and sine-rule method independently checked.'}}});
 f.assessments.sourceContext.projectHash=revisionHash(f.saved);
 f.assessments.existingTransferReview={profile:'accepted-master-content-v1',questions:[{sourceBlockId:block.id,taskHash:transferTaskHash(block),note:'Reuse completed independent acceptance.',proof:{kind:'lean',table:{path:table,hash:bytesHash(table)},snapshot:block}}]};
 await write(f.args.assessmentsFile,f.assessments);return f;
}
test('accepted master transfers preserve unrelated bank edits made after staging',async t=>{
 const f=await acceptedMasterFixture(t);
 const other=normaliseQuestion({id:'q-unrelated',status:'approved',classification:f.assessments.questions[0].classification,content:{prompt:'Find a different side.',answer:{short:'7',worked:'The other side is 7.'}}});
 const otherFile=path.join(f.options.bankRoot,other.id+'.json'),linksFile=path.join(f.options.bankRoot,'.sync/links.json');
 await write(otherFile,other);await write(path.join(f.options.bankRoot,'manifest.json'),makeBankManifest([other]));
 await write(linksFile,{[other.id]:{projectId:'another-master',blockId:'other-source',bankRevision:revisionHash(other)}});
 const first=await importProjectBank(f.args);assert.equal(first.created,1);
 const changed={...other,classification:{...other.classification,reasoningScore:21},updatedAt:new Date().toISOString()};
 const liveLink={projectId:'another-master',blockId:'other-source',bankRevision:revisionHash(changed)};
 await write(otherFile,changed);await write(path.join(f.options.bankRoot,'manifest.json'),makeBankManifest([changed]));await write(linksFile,{[other.id]:liveLink});
 const published=await importProjectBank({...f.args,apply:true});assert.equal(published.created,1);assert.equal(published.reused,true);
 assert.deepEqual(await read(otherFile),changed);assert.deepEqual((await read(linksFile))[other.id],liveLink);
 assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.find(q=>q.id===other.id).reasoningScore,21);
 assert.equal((await importProjectBank(f.args)).created,0);
});

test('bank-only notation keeps verified rating provenance on both source and projected bank task',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 b.content.prompt='Calculate $4/2$.';b.content.answer={short:'2',worked:'$4/2=2$',solutionDiagrams:[]};
 const c=f.assessments.questions[0].classification;
 Object.assign(c,assessedRating(b,c,{model:'test-review-model',assessedAt:'2026-10-21T00:00:00Z',evidence:'test-only-review.json'}));
 f.assessments.questions[0].contentHash=revisionHash(b.content);
 f.assessments.questions[0].bankProjection={version:1,notationReplacements:[{nodeId:b.content.id,field:'prompt',from:'4/2',to:'\\frac{4}{2}'},{nodeId:b.content.id,field:'answer.worked',from:'4/2=2',to:'\\frac{4}{2}=2'}]};
 f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,source.bankRef.id+'.json'));
 assert.equal(source.content.prompt,'Calculate $4/2$.');assert.equal(verifiedRating(source),true);assert.equal(verifiedRating(bank),true);
 assert.equal(bank.classification.assessment.model,c.assessment.model);assert.equal(bank.classification.assessment.assessedAt,c.assessment.assessedAt);
 assert.equal(bank.classification.assessment.originalTaskHash,c.assessment.taskHash);assert.equal((await importProjectBank(f.args)).created,0);
});
test('a labelled leaf group with its own worked answer remains transferable',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 b.content.children=[{id:'given-worked-part',type:'group',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}];delete b.content.answer;
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 assert.equal((await importProjectBank({...f.args,apply:true})).created,1);
});

test('given alternatives and explicitly inherited task responses transfer without invented answers',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 b.content.prompt='Which labelled segment is a radius?';b.content.children=[{id:'given-A',type:'part',label:'A',prompt:'',questionDiagrams:[{id:'given-diagram',format:'tikz',role:'question',code:'\\begin{tikzpicture}\\draw (0,0)--(1,0);\\end{tikzpicture}',widthMm:30}]},{id:'response',type:'part',label:'',prompt:'',answer:{short:'A',worked:'A joins the centre to the circumference.'}},{id:'second-instruction',type:'group',prompt:'Now calculate the side.',children:[{id:'second-part',type:'part',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}]}];delete b.content.answer;
 b.sourceReview={responses:[{targetId:'given-A',kind:'none'},{targetId:'response',kind:'short'}]};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),block=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,block.bankRef.id+'.json'));
 assert.equal(bank.content.children[0].responseSpace,'given');assert.equal(bank.content.children[0].answer,undefined);assert.equal(bank.content.children[1].responseSpace,'scaffold');assert.equal(block.content.children[0].responseSpace,undefined);assert.equal(block.content.children[1].prompt,'');
});

test('equivalent projected duplicates link as consumers without rewriting source notation',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];b.content.prompt='Calculate $4/2$.';b.content.answer={short:'2',worked:'$4/2=2$',solutionDiagrams:[]};
 const policy={version:1,notationReplacements:[{nodeId:b.content.id,field:'prompt',from:'4/2',to:'\\frac{4}{2}'},{nodeId:b.content.id,field:'answer.worked',from:'4/2=2',to:'\\frac{4}{2}=2'}]};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.questions[0].bankProjection=policy;f.assessments.sourceContext.projectHash=revisionHash(f.saved);
 await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);await importProjectBank({...f.args,apply:true});
 const owner=await loadBookletProject(f.saved.id,f.options),bankId=practiceQuestions(owner)[0].bankRef.id;
 const consumer=createEditableProject({id:'projected-consumer',title:'Consumer'});consumer.sections[0].phase='practice';consumer.sections[0].blocks=[{...structuredClone(b),id:'consumer-question',classification:f.assessments.questions[0].classification},{...createProjectBlock('callout'),id:'consumer-teaching',content:'Use the source sine-rule context.'}];
 const saved=await createBookletProject(consumer,f.options),before=structuredClone(practiceQuestions(saved)[0].content);
 const a={projectId:saved.id,questions:[],linkProjections:{'consumer-question':policy},sourceContext:{projectHash:revisionHash(saved),courseIds:['s5-core'],topicIds:['t-s5-trig'],evidenceBlockIds:['consumer-teaching']}};
 const args={...f.args,projectId:saved.id,assessmentsFile:path.join(f.root,'consumer-assessments.json'),out:path.join(f.root,'consumer-stage')};await write(args.assessmentsFile,a);
 const result=await importProjectBank({...args,apply:true});assert.equal(result.created,0);assert.equal(result.linked,1);
 const linked=await loadBookletProject(saved.id,f.options),block=practiceQuestions(linked)[0];assert.deepEqual(block.content,before);assert.equal(block.bankRef.id,bankId);assert.deepEqual(block.bankRef.projection,policy);
 assert.equal((await projectSyncStatus(linked,f.options.bankRoot)).items[0].state,'synced');assert.equal((await importProjectBank(args)).created,0);
});

test('legacy native overlay intent transfers as metadata without changing diagram code',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0],code='\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}';
 b.content.questionDiagrams=[{id:'base-grid',format:'tikz',role:'question',code,widthMm:40}];b.content.answer.solutionDiagrams=[{id:'solution-segment',format:'tikz',role:'solution-overlay',overlayOf:'base-grid',code,widthMm:40}];
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,source.bankRef.id+'.json'));
 assert.equal(bank.content.answer.solutionDiagrams[0].transparent,true);assert.equal(bank.content.answer.solutionDiagrams[0].code,code);assert.equal(source.content.answer.solutionDiagrams[0].transparent,undefined);
});


test('supplied text and table examples retain content without manufactured answer entries',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 const given=fromSource('Example: 2+3=5.');
 b.content.children=[{id:'example',type:'part',label:'',prompt:given},{id:'answer-part',type:'part',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}];delete b.content.answer;
 b.sourceReview={responses:[{targetId:'example',kind:'none'},{targetId:'answer-part',kind:'working'}]};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,source.bankRef.id+'.json'));
 assert.equal(bank.content.children[0].responseSpace,'given');assert.equal(bank.content.children[0].answer,undefined);assert.deepEqual(bank.content.children[0].prompt,given);assert.deepEqual(source.content.children[0].prompt,given);
});

test('generated native answer-table identities preserve structure and layout on transfer',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 const table={format:'maths-editor-document-v1',version:1,blocks:[{type:'table',widthMm:40,rows:[[{type:'cell',blocks:[{type:'paragraph',inlines:[{type:'text',text:'2'}]}]}]]}]};
 b.content.answer={short:table,worked:structuredClone(table)};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 assert.equal((await importProjectBank({...f.args,apply:true})).created,1);
 assert.equal((await importProjectBank(f.args)).created,0);
});


test('currency projections retain delimited maths and literal money without changing the owner',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];b.content.prompt='The initial balance is $2000.';b.content.answer={short:'2',worked:'Use $n=2$. The final balance is $2500.'};
 Object.assign(f.assessments.questions[0].classification,assessedRating(b,f.assessments.questions[0].classification,{model:'test-review-model',assessedAt:'2026-10-21T00:00:00Z',evidence:'test-only.json'}));
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,source.bankRef.id+'.json'));
 assert.equal(source.content.prompt,b.content.prompt);assert.equal(source.content.answer.worked,b.content.answer.worked);assert.equal(bank.content.prompt.blocks[0].inlines[0].text,'The initial balance is $2000.');assert.equal(bank.content.answer.worked.blocks[0].inlines.some(i=>i.type==='math'&&i.latex==='n=2'),true);assert.equal(verifiedRating(bank),true);
});

test('shared diagram-only worked context stays outside response fragments',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];
 b.content.children=[{id:'shared-guide',type:'group',label:'Chart',prompt:'',answer:{short:null,worked:'',solutionDiagrams:[{id:'guide',format:'tikz',role:'solution',code:'\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}',widthMm:40}]}},{id:'response',type:'part',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}];delete b.content.answer;b.sourceReview={responses:[{targetId:'shared-guide',kind:'none'},{targetId:'response',kind:'working'}]};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,source.bankRef.id+'.json'));
 assert.equal(bank.content.children[0].responseSpace,'solution-context');assert.equal(bank.content.children[0].answer.solutionDiagrams[0].id,'guide');assert.equal(answerFragments(bank,'worked').length,1);assert.equal(source.content.children[0].responseSpace,undefined);
});

test('parent answer summaries and their existing leaves retain verified provenance',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];b.content.answer={short:'2',worked:'The complete grouped derivation gives the side as 2.'};b.content.children=[{id:'part-a',type:'part',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}];
 Object.assign(f.assessments.questions[0].classification,assessedRating(b,f.assessments.questions[0].classification,{model:'test-review-model',assessedAt:'2026-10-21T00:00:00Z',evidence:'test-only.json'}));
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0],bank=await read(path.join(f.options.bankRoot,source.bankRef.id+'.json'));
 assert.equal(bank.content.answer.worked,b.content.answer.worked);assert.equal(bank.content.children[0].answer.worked,b.content.children[0].answer.worked);assert.equal(bank.content.responseKind,'group-answer');assert.equal(source.content.responseKind,undefined);assert.equal(verifiedRating(bank),true);assert.equal(verifiedRating(source),true);
});

test('presentation arrangement identities are scoped to each override',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];b.content.children=[{id:'part-a',type:'part',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}];delete b.content.answer;
 const parent=arrangementCatalog(b).initial,child=arrangementCatalog({...b,content:b.content.children[0]}).initial;parent.root.id='same-layout-root';child.root.id='same-layout-root';
 f.saved.settings.layoutOverrides={blockLayouts:{[b.id]:{arrangement:parent},'part-a':{arrangement:child}},answerSpaces:{},diagramColourModes:{}};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);
 await importProjectBank({...f.args,apply:true});const p=await loadBookletProject(f.saved.id,f.options);assert.equal(validateEditableProject(p).valid,true);
 const bad=structuredClone(p),tree=practiceQuestions(bad)[0].presentation.layoutOverrides.blockLayouts[b.id].arrangement.root;tree.children.push(structuredClone(tree.children[0]));assert.equal(validateEditableProject(bad).errors.some(e=>e.includes('Duplicate arrangement node id')),true);
});


test('an owned projection upgrade retains the bank ID and then synchronizes parent answers',async t=>{
 const f=await fixture(t),b=practiceQuestions(f.saved)[0];b.content.answer={short:'2',worked:'The grouped derivation gives the side as 2.'};b.content.children=[{id:'part-a',type:'part',label:'a',prompt:'Find the side.',answer:{short:'2',worked:'The side is 2.'}}];
 Object.assign(f.assessments.questions[0].classification,assessedRating(b,f.assessments.questions[0].classification,{model:'test-review-model',assessedAt:'2026-10-21T00:00:00Z',evidence:'test-only.json'}));f.assessments.questions[0].bankProjection={version:1};
 f.assessments.questions[0].contentHash=revisionHash(b.content);f.assessments.sourceContext.projectHash=revisionHash(f.saved);await write(f.args.assessmentsFile,f.assessments);await write(path.join(f.options.projectRoot,f.saved.id+'.json'),f.saved);await importProjectBank({...f.args,apply:true});
 let p=await loadBookletProject(f.saved.id,f.options),source=practiceQuestions(p)[0];const id=source.bankRef.id,before=structuredClone(source.content);assert.equal((await read(path.join(f.options.bankRoot,id+'.json'))).content.answer,undefined);
 await promoteProjectQuestion(p.id,{blockId:source.id,mode:'update',bankProjection:bankProjectionPolicy(source)},f.options);
 p=await loadBookletProject(p.id,f.options);source=practiceQuestions(p)[0];let bank=await read(path.join(f.options.bankRoot,id+'.json'));
 assert.equal(source.bankRef.id,id);assert.deepEqual(source.content,before);assert.equal(bank.content.answer.worked,before.answer.worked);assert.equal(verifiedRating(bank),true);assert.equal((await projectSyncStatus(p,f.options.bankRoot)).items[0].state,'synced');
 source.content.answer.worked='A later owner correction retains the side as 2.';await saveBookletProject(p,{...f.options,expectedRevision:p.revision});bank=await read(path.join(f.options.bankRoot,id+'.json'));assert.equal(bank.content.answer.worked,source.content.answer.worked);
});
