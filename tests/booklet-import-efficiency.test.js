import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assessmentSourceContext,normalizeReviewResult} from '../scripts/booklet/review-packet-context.mjs';
import {assessmentQuestionGroups} from '../scripts/booklet/bounded-stages.mjs';
import {driveBoundedWorkflow,selectDispatchJobs,recoverEndedStageFailure} from '../scripts/booklet/workflow-controller.mjs';
import {finalExportOutput,finalExportIneligibility} from '../scripts/booklet/seed-final-export-cache.mjs';
import {replayReviewPacket} from '../scripts/booklet/benchmark-review-packets.mjs';

test('offline replay never infers savings without the original supplemental delivery',()=>{
 const request={job:{id:'assessment-test',stage:'assessment',ownershipIds:['question:q'],evidence:[],context:{lean:true,questions:[{id:'q',content:'Calculate'}]}}};
 const before=structuredClone(request),row=replayReviewPacket(request,{prompt:'Canonical ticket only'});
 assert.equal(row.comparisonAvailable,false);assert.equal(row.owned,1);assert.ok(row.afterCharacters>0);
 assert.equal(row.beforeCharacters,undefined);assert.match(row.note,/no before\/after saving/);assert.deepEqual(request,before);
});

const fixture=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'import-efficiency-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const usage=()=>({completeJob:{usage:{total_tokens:0,input_tokens:0,cached_input_tokens:0,output_tokens:0},missingUsage:0},model:{normalizedUsage:{total_tokens:0}}});
const budget={totalTokens:10000,reserveTokensPerJob:100};
const empty={jobs:[],active:[],blockers:[],checklist:[{id:'complete',passed:true}]};

test('source packets deliver text once and omit teaching siblings already delivered',t=>{
 const dir=fixture(t),file=path.join(dir,'evidence/pages/page-001.txt');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'Original source including maths');
 const question={id:'q',sourceRefs:[{pageNumber:1},{pageNumber:1}]},given={id:'already',type:'callout',sourceRefs:[{pageNumber:1}],content:'Taught context'},sibling={id:'sibling',type:'callout',sourceRefs:[{pageNumber:1}],content:'Same-page definition'};
 const project={sections:[{phase:'teaching',blocks:[given,sibling]},{phase:'practice',blocks:[question]}]},options={project,questions:[question],teaching:{teaching:[given]},runDir:dir};
 const first=assessmentSourceContext(options);
 assert.equal(first.sourceTexts.length,1);assert.equal(first.sourceTexts[0].text,'Original source including maths');assert.deepEqual(first.siblingContext.map(v=>v.id),['sibling']);
 fs.writeFileSync(file,'Changed source');assert.notEqual(assessmentSourceContext(options).sourceTexts[0].artifact.hash,first.sourceTexts[0].artifact.hash);
 assert.deepEqual(project.sections[0].blocks,[given,sibling]);
});

test('normalization only unwraps JSON and resolves unique delivered teaching aliases',()=>{
 const job={stage:'assessment',context:{teaching:{teaching:[{id:'native-group',sourceAtom:{id:'source-group'}}]}}};
 const original={reviewer:'Reviewer',note:'Checked',records:[{id:'question:q',outcome:'failed',checks:{answer:false}}],corrections:[{patches:[{targetId:'source-group',corrected:'x=5'}]}],teachingSummary:{methods:[{statement:'Method',sourceRefs:[{pageNumber:1,targetId:'source-group'}]}]}};
 const normalized=normalizeReviewResult('```json\n'+JSON.stringify(original)+'\n```',job);
 assert.equal(normalized.result.teachingSummary.methods[0].sourceRefs[0].targetId,'native-group');
 assert.deepEqual(normalized.result.records,original.records);assert.deepEqual(normalized.result.corrections,original.corrections);
 assert.equal(original.teachingSummary.methods[0].sourceRefs[0].targetId,'source-group');assert.equal(normalized.transformations.length,2);
 assert.equal(normalizeReviewResult(JSON.stringify({note:'Unmodified JSON'}),job).transformations.length,0);
 const ambiguous=structuredClone(job);ambiguous.context.teaching.teaching.push({id:'other-group',sourceAtom:{id:'source-group'}});
 assert.throws(()=>normalizeReviewResult(original,ambiguous),/Ambiguous teaching source alias/);
 assert.throws(()=>normalizeReviewResult('Incomplete JSON',job));
});

test('pending batching skips accepted content while keeping prepared ownership intact',()=>{
 const questions=Array.from({length:8},(_,i)=>({id:'q'+i})),measure=()=>100;
 assert.deepEqual(assessmentQuestionGroups(questions,{},measure,{isPending:q=>Number(q.id.slice(1))%2===0}).map(group=>group.map(q=>q.id)),[['q0','q2','q4','q6']]);
 const claims={reserved:{stage:'assessment',ownershipIds:['question:q1','question:q2']}};
 assert.deepEqual(assessmentQuestionGroups(questions,claims,measure,{isPending:q=>['q0','q2','q7'].includes(q.id)}).map(group=>group.map(q=>q.id)),[['q0'],['q1','q2'],['q7']]);
});

test('dispatch respects first-summary and shared-source barriers and composition exclusivity',()=>{
 const assessment=(id,exerciseId,page,teachingStable=false)=>({id,stage:'assessment',dispatch:{exerciseId,sourcePages:[page],teachingPages:[8],teachingStable}});
 const a=assessment('a','exercise',1),b=assessment('b','exercise',2),c=assessment('c','other',3);
 assert.deepEqual(selectDispatchJobs([a,b,c]).map(v=>v.id),['a']);
 for(const row of [a,b,c])row.dispatch.teachingStable=true;
 assert.deepEqual(selectDispatchJobs([a,b,c]).map(v=>v.id),['a','b','c']);
 assert.deepEqual(selectDispatchJobs([a,assessment('same-source','other',1,true)]).map(v=>v.id),['a']);
 assert.equal(selectDispatchJobs([{id:'composition',stage:'composition'}],[a]).length,0);
 assert.equal(selectDispatchJobs([a],[{id:'composition',stage:'composition'}]).length,0);
});

test('controller refills a free slot before slower workers finish',async t=>{
 const dir=fixture(t),slow=deferred(),allStarted=deferred(),fourth=deferred(),started=[],completed=new Set(),jobs=['slow-a','fast','slow-b','fourth'].map(id=>({id,stage:'maths',blockers:[]}));
 const driven=driveBoundedWorkflow({runDir:dir},{budget,receipt:usage,concurrency:3,next:async()=>({...empty,jobs:jobs.filter(j=>!completed.has(j.id)),checklist:[{id:'complete',passed:completed.size===4}]}),run:async(_options,id)=>{
  started.push(id);if(started.length===3)allStarted.resolve();
  if(id.startsWith('slow'))await slow.promise;
  if(id==='fast')await allStarted.promise;
  if(id==='fourth'){assert.equal(completed.has('slow-a'),false);fourth.resolve();}
  completed.add(id);return {ok:true};
 }});
 await fourth.promise;slow.resolve();assert.equal((await driven).status,'complete');assert.equal(started.length,4);
});

test('a failed worker drains other successes and prevents further dispatch',async t=>{
 const dir=fixture(t),slow=deferred(),startedThree=deferred(),started=[],done=[];
 const jobs=['slow-a','failure','slow-b','never'].map(id=>({id,stage:'maths',blockers:[]}));
 const driven=driveBoundedWorkflow({runDir:dir},{budget,receipt:usage,concurrency:3,next:async()=>({...empty,jobs,checklist:[{id:'complete',passed:false}]}),run:async(_options,id)=>{
  started.push(id);if(started.length===3)startedThree.resolve();
  if(id==='failure'){await startedThree.promise;throw Error('Diagnose this failure');}
  await slow.promise;done.push(id);return {ok:true};
 }});
 await startedThree.promise;await new Promise(resolve=>setTimeout(resolve,20));assert.equal(started.includes('never'),false);slow.resolve();
 assert.equal((await driven).status,'needs-repair');assert.deepEqual(done.sort(),['slow-a','slow-b']);
});

test('publication recovery retries the retained save without a new worker',async t=>{
 const dir=fixture(t),job={id:'review',stage:'assessment',blockers:[]};let reviewed=false,saves=0,calls=0;
 const options={budget,receipt:usage,next:async()=>reviewed?empty:{...empty,jobs:[job],checklist:[{id:'complete',passed:false}]},run:async()=>{calls++;reviewed=true;return {ok:true,next:'Propagate approved corrections'};},publish:async()=>{saves++;if(saves===1)throw Error('Concurrent save conflict');}};
 assert.equal((await driveBoundedWorkflow({runDir:dir},options)).status,'needs-repair');
 assert.equal((await driveBoundedWorkflow({runDir:dir},options)).status,'complete');assert.equal(calls,1);assert.equal(saves,2);
});

test('restarting an unchanged failed job requires a recorded retry diagnosis',async t=>{
 const dir=fixture(t),job={id:'failed',stage:'maths',dependencyHash:'same',blockers:[]};let calls=0;
 const options={budget,receipt:usage,next:async()=>({...empty,jobs:[job],checklist:[{id:'complete',passed:false}]}),run:async()=>{calls++;throw Error('Retained bootstrap failure');}};
 assert.equal((await driveBoundedWorkflow({runDir:dir},options)).status,'needs-repair');
 assert.equal((await driveBoundedWorkflow({runDir:dir},options)).status,'needs-repair');assert.equal(calls,1);
 await driveBoundedWorkflow({runDir:dir},{...options,retryDiagnosis:'Corrected worker connectivity; retain previous failure evidence'});assert.equal(calls,2);
});

test('ended-owner recovery preserves any completed generation instead of cancelling it',async t=>{
 const dir=fixture(t),ticket={path:path.join(dir,'workflow/stages/job/request.json'),hash:'fixture'},worker=path.join(path.dirname(ticket.path),'codex');fs.mkdirSync(worker,{recursive:true});fs.writeFileSync(ticket.path,'{}');let cancelled=0;
 const error={ticket,retainedOutput:worker,message:'Ended execution failure'};
 fs.writeFileSync(path.join(path.dirname(ticket.path),'generation.json'),'{}');
 assert.equal((await recoverEndedStageFailure({runDir:dir},error,{cancel:async()=>{cancelled++;}})).action,'retained-for-reconciliation');assert.equal(cancelled,0);
 fs.unlinkSync(path.join(path.dirname(ticket.path),'generation.json'));
 assert.equal((await recoverEndedStageFailure({runDir:dir},error,{cancel:async()=>{cancelled++;}})).action,'cancelled-ended-owner');assert.equal(cancelled,1);
});

test('canonical full export defaults enable seeding and preserve explicit/development paths',()=>{
 const runDir=path.resolve('fixture-run');assert.equal(finalExportOutput({runDir,now:1}),path.join(runDir,'final-exports-1'));
 assert.equal(finalExportOutput({out:'user-selected',runDir}),'user-selected');assert.equal(finalExportOutput({runDir,development:true}),'.booklet-work/compact-exercises');assert.equal(finalExportOutput({runDir,draft:true}),'.booklet-work/compact-exercises');
 const input={manifest:{passed:true,mode:'full',reviewProfile:'textbook-three-pass-v1',edition:'student',renderer:'old',printableKey:'same',pdf:{hash:'a'.repeat(64)}},edition:'student',renderer:'new',printableKey:'same',pdfHash:'a'.repeat(64)};
 assert.equal(finalExportIneligibility(input),'renderer-changed');input.renderer='old';assert.equal(finalExportIneligibility(input),null);input.printableKey='changed';assert.equal(finalExportIneligibility(input),'printable-dependencies-changed');
});
