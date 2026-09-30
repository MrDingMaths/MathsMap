import {inspectContentCoverage} from '../src/lib/booklet-content-verification.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {LEAN_REVIEW_PROFILE,printableProject,selectLeanVisualPages} from '../scripts/booklet/lean-profile.mjs';
import {verificationDependencies,recordVerification,verificationStatus,PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
import {pageGate,settlementKey} from '../scripts/booklet/workflow-review.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
function fixture(){
 const state={pipelinePolicy:PIPELINE_POLICY,reviewProfile:LEAN_REVIEW_PROFILE,pages:{1:{inventoryHash:'coverage1',sourceEvidence:'source1',authorHash:'authored1',patterns:[]},2:{inventoryHash:'coverage2',sourceEvidence:'source2',authorHash:'authored2',patterns:[]}},issues:{},corrections:[],representatives:{}};
 const project={id:'lean',source:{reviewProfile:LEAN_REVIEW_PROFILE},settings:{},sections:[1,2].flatMap(i=>[{id:'teaching'+i,exerciseId:'ex'+i,phase:'teaching',blocks:[{id:'method'+i,type:'callout',sourceRefs:[{pageNumber:i}],content:'Divide first.'}]},{id:'practice'+i,exerciseId:'ex'+i,phase:'practice',blocks:[{id:'q'+i,type:'question',classification:{skillId:'division'},sourceRefs:[{pageNumber:i}],content:{id:'node'+i,type:'question',prompt:'Calculate 1/3.',answer:{short:'0.33',worked:'1 divided by 3 is 0.33.'},presentation:{columns:1}}}]}])};
 const deps=()=>verificationDependencies(state,project,{renderer:'fixture',implementation:{}});
 return {state,project,deps,q:project.sections[1].blocks[0]};
}
test('lean metadata, taxonomy and layout edits retain content review; real content and taught method edits invalidate only dependants',()=>{
 const {state,project,deps,q}=fixture(),original=deps(),print=projectReviewHash(project);
 assert.deepEqual(Object.keys(original.questions),['method1','q1','method2','q2']);
 q.classification.skillId='closest-skill';q.sourceReview={reviewNotes:'Typo in reviewer note'};project.revision=2;
 assert.deepEqual(deps().questions,original.questions);assert.equal(projectReviewHash(project),print);
 q.content.presentation.columns=2;assert.deepEqual(deps().questions,original.questions);assert.notEqual(projectReviewHash(project),print);
 q.content.prompt+=' Round to 2 decimal places.';assert.notEqual(deps().questions.q1,original.questions.q1);assert.equal(deps().questions.q2,original.questions.q2);
 const rounded=deps();q.content.answer.short='0.34';assert.notEqual(deps().questions.q1,rounded.questions.q1);
 const answerChanged=deps();project.sections[0].blocks[0].content='Use long division.';assert.notEqual(deps().questions.q1,answerChanged.questions.q1);assert.equal(deps().questions.q2,answerChanged.questions.q2);
 const methodChanged=deps();state.pages[2].sourceEvidence='changed actual source';assert.equal(deps().questions.q1,methodChanged.questions.q1);assert.notEqual(deps().questions.q2,methodChanged.questions.q2);
});
test('answer-only repairs replace only relevant printable editions',()=>{
 const {project,q}=fixture(),editions=['student','short','worked','with-short','with-worked'],before=Object.fromEntries(editions.map(e=>[e,JSON.stringify(printableProject(project,e))]));
 q.content.answer.short='0.34';for(const edition of editions)assert.equal(JSON.stringify(printableProject(project,edition))===before[edition],!['short','with-short'].includes(edition),edition);
});
test('lean removes separate approval gates but never accepts an unchecked or erroneous answer',()=>{
 const {state,project,deps}=fixture();assert.deepEqual(pageGate(state,1,{authoring:true}),[]);assert.deepEqual(pageGate(state,1),[]);
 const key=settlementKey(state);state.representatives={unused:{note:'cosmetic'}};state.pages[1].mathReview={note:'old audit'};assert.equal(settlementKey(state),key);
 const dependencies=deps(),record={id:'question:q1',outcome:'passed',reviewer:'independent reviewer',note:'Checked source, taught method and answer.',artifacts:[{path:'immutable-review',hash:'test'}],dependencies:{question:dependencies.questions.q1},checks:{answer:true,skillMapping:true,taughtMethod:true}};
 assert.throws(()=>recordVerification(state,record,dependencies,{artifactCurrent:()=>true}),/review/);
 record.checks.sourceCompared=true;record.checks.contentVerified=true;recordVerification(state,record,dependencies,{artifactCurrent:()=>true});
 record.outcome='failed';recordVerification(state,record,dependencies,{artifactCurrent:()=>true});assert.equal(state.verification.entries[record.id].outcome,'failed');
 const required=verificationStatus(state,project,{renderer:'fixture'}).required;assert.ok(!required.some(id=>['ui','build','regressions','storage','publication','readback','repeat-import'].includes(id)));assert.ok(required.includes('question:method1'));
 state.issues.polish={status:'pending',page:1,disposition:'optional-polish'};assert.deepEqual(pageGate(state,1),[]);state.issues.error={id:'error',status:'pending',page:1,message:'Wrong answer'};assert.deepEqual(pageGate(state,1),['error']);
});
test('targeted selection deduplicates examples, transitions, flags and local repair neighbours',()=>{
 const {project}=fixture(),pages=Array.from({length:15},(_,i)=>({page:i+1,blocks:i===0?[]:[i<8?'q1':'q2'],mode:i<11?'student':'short',isCover:i===0}));
 const selected=selectLeanVisualPages(project,pages,'with-short',{flaggedPages:[6,6],changedPages:[5]});
 assert.equal(selected.length,new Set(selected).size);for(const n of [1,2,4,5,6,9,11,12,15])assert.ok(selected.includes(n),String(n));assert.ok(selected.length<15);
});
test('three-pass review accepts explicit contract attestations without weakening failed or missing checks',()=>{
 const {state,deps}=fixture(),dependencies=deps();
 const record={id:'question:q1',outcome:'passed',reviewer:'independent reviewer',note:'Inspected source and reviewed all parts.',artifacts:[{path:'immutable-review',hash:'test'}],dependencies:{question:dependencies.questions.q1},sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}};
 recordVerification(state,record,dependencies,{artifactCurrent:()=>true});
 for(const key of ['sourceCompared','contentVerified']){
  const missing=structuredClone(record);delete missing[key];assert.throws(()=>recordVerification(state,missing,dependencies,{artifactCurrent:()=>true}),/review/);
  const failed=structuredClone(record);failed.checks[key]=false;assert.throws(()=>recordVerification(state,failed,dependencies,{artifactCurrent:()=>true}),/review/);
 }
 const failedAnswer=structuredClone(record);failedAnswer.checks.answer=false;assert.throws(()=>recordVerification(state,failedAnswer,dependencies,{artifactCurrent:()=>true}),/review/);
});
test('legacy profiles keep classification in review and project signatures',()=>{
 const {state,project,deps,q}=fixture();delete state.reviewProfile;delete project.source.reviewProfile;
 const before=deps().questions.q1,print=projectReviewHash(project);q.classification.skillId='changed';assert.notEqual(deps().questions.q1,before);assert.notEqual(projectReviewHash(project),print);assert.ok(pageGate(state,1,{authoring:true}).length);
});

test('lean editorial audit artifacts cannot invalidate unrelated completed content checks',()=>{
 const {state,project,deps}=fixture();
 state.issues.note={id:'note',status:'retained',page:1,message:'Page-wide audit note',resolution:{reason:'Preserve the note',evidence:[{path:'first-review.json',hash:'first'}]}};
 const leanBefore=deps().questions.q1;
 state.issues.note.resolution.evidence=[{path:'second-review.json',hash:'second'}];
 assert.equal(deps().questions.q1,leanBefore);
 delete state.reviewProfile;delete project.source.reviewProfile;const legacyBefore=deps().questions.q1;
 state.issues.note.resolution.evidence=[{path:'third-review.json',hash:'third'}];
 assert.notEqual(deps().questions.q1,legacyBefore);
});

test('lean source coverage catches omissions and missing answers without requiring a second per-entry approval register',async()=>{
 const {project,q}=fixture();project.source.inventory={selectedPages:[1,2],pages:[1,2].map(pageNumber=>({pageNumber,inventoried:true})),entries:[1,2].flatMap(i=>[{id:'source-method'+i,targetId:'method'+i,kind:'teaching',pageNumber:i},{id:'source-q'+i,targetId:'node'+i,kind:'question',pageNumber:i}])};
 const report=await inspectContentCoverage(project);assert.equal(report.complete,true,JSON.stringify(report.issues));assert.equal(report.counts.verified,0);assert.equal(report.counts.mapped,4);assert.ok(report.reviewRequired);
 delete q.content.answer.worked;assert.ok((await inspectContentCoverage(project)).issues.some(i=>i.kind==='missing-answer'));
 project.sections[0].blocks=[];assert.ok((await inspectContentCoverage(project)).issues.some(i=>i.kind==='missing'));
});

test('teaching example answers outside content invalidate the example and its dependent exercise',()=>{
 const {project,deps}=fixture();const teaching=project.sections[0].blocks[0];teaching.type='worked-example';teaching.examples=[{prompt:'Calculate 1 + 1.',answer:'2'}];const before=deps();teaching.examples[0].answer='3';const after=deps();assert.notEqual(after.questions.method1,before.questions.method1);assert.notEqual(after.questions.q1,before.questions.q1);assert.equal(after.questions.q2,before.questions.q2);
});

test('changing retained question image bytes invalidates only its content review',async t=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-image-')),file=path.join(dir,'diagram.png');t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 fs.writeFileSync(file,'diagram source bytes');const {q,deps}=fixture();q.content.questionDiagrams=[{id:'figure',format:'image',src:file}];const before=deps();fs.writeFileSync(file,'corrected diagram bytes');assert.notEqual(deps().questions.q1,before.questions.q1);assert.equal(deps().questions.q2,before.questions.q2);
});
