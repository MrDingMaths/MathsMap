import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {summarizeAttemptEvents} from '../scripts/booklet/semantic-run-metrics.mjs';
import {summarizeRunReceipt} from '../scripts/booklet/run-observability.mjs';
import {representativePlan,checkRepresentativePlan,targetedRepairContext,writeNewJson} from '../scripts/booklet/efficiency-tools.mjs';
import {isolatedHarnessDirectory} from '../scripts/booklet/check-import-harness.mjs';
import {compactEditorialCorrections} from '../scripts/booklet/token-efficient-prompts.mjs';
import {importCloseout} from '../scripts/booklet/import-closeout.mjs';

test('compact editorial context retains teaching replacements and exact register identities',()=>{
 const patches=[{scope:'inventory',page:4,targetId:'s4',field:'/description',original:'wrong',corrected:'Current reviewed inventory'},
  {scope:'inventory',page:1,targetId:'s1',field:'/description',original:'old teaching',corrected:'Required taught method'},
  {scope:'author',page:4,targetId:'q4',field:'/answer/short',original:'old answer',corrected:'2'},
  {scope:'inventory',page:9,targetId:'s9',field:'/description',original:'other',corrected:'Unrelated'}];
 const source=[{id:'c',status:'approved',reason:'Reviewed correction',patches}];
 const result=compactEditorialCorrections(source,4,[1]);
 assert.equal(result[0].patches.length,3);assert.equal(result[0].patches[0].appliedToInventory,true);
 assert.equal(result[0].patches[1].corrected,'Required taught method');assert.equal(result[0].patches[2].corrected,'2');
 assert.ok(result[0].patches.every(p=>!Object.hasOwn(p,'original')));assert.equal(source[0].patches[0].original,'wrong');
});

test('retry costs distinguish outcomes, unavailable usage and overlapping wall time',()=>{
 const events=[];
 const attempt=(id,number,ok,usage,reason)=>{
  events.push({attemptId:id,event:'started',time:0,stage:'author',attempt:number,retryReason:reason,promptStats:{sections:{schema:40}}},
   {attemptId:id,event:'phase-started',phase:'generation',time:0},
   {attemptId:id,event:'phase-finished',phase:'generation',time:10,elapsedMs:10,metrics:{elapsedMs:10,usage}},
   {attemptId:id,event:'finished',time:10,ok});
 };
 attempt('a',1,false,{input_tokens:100,cached_input_tokens:50,output_tokens:30});
 attempt('b',2,true,{input_tokens:20,output_tokens:4},'content-repair');
 attempt('c',3,false,null);
 const result=summarizeAttemptEvents(events);
 assert.equal(result.usage.input_tokens,120);assert.equal(result.byAttempt.repeat.usage.input_tokens,20);
 assert.equal(result.byOutcome.failed.missingUsage,1);assert.equal(result.byRetryReason.unrecorded.calls,1);
 assert.equal(result.byRetryReason['content-repair'].usage.output_tokens,4);
 assert.equal(result.completedAttemptActiveWallMs,10);assert.equal(result.callElapsedMs,30);
 assert.equal(result.promptCharacters.schema,120);
 const summary=summarizeRunReceipt({model:result,phases:{render:[{ok:true,elapsedMs:5},{ok:false,elapsedMs:3}]},unfinished:[],recordedActiveWallMs:10,calendarSpanMs:10});
 assert.deepEqual(summary.phases.render,{runs:2,failed:1,elapsedMs:8});assert.equal(summary.model.missingUsage,1);
});

test('representative plan covers shared patterns once and exposes missing inventory',()=>{
 const state={pages:{1:{inventoryHash:'a',patterns:[{id:'plain'}]},2:{inventoryHash:'b',patterns:[{id:'plain'},{id:'graph'}]}},representatives:{}};
 const plan=representativePlan(state,[1,2,3]);
 assert.deepEqual(plan.missingInventories,[3]);assert.deepEqual(plan.representativePages,[1,2]);
 assert.deepEqual(plan.patterns.find(p=>p.id==='plain').pages,[1,2]);
 assert.ok(plan.patterns.every(p=>!p.approved));assert.ok(plan.coverage.every(c=>c.status==='needs-source-review'));
 assert.equal(checkRepresentativePlan(state,[1,2,3],plan).ok,false);
 const complete=representativePlan(state,[1,2]);complete.coverage.forEach(c=>{c.status='planned';c.pages=[1,2];});
 assert.equal(checkRepresentativePlan(state,[1,2],complete).ok,true);
 state.pages[1].inventoryHash='changed';assert.equal(checkRepresentativePlan(state,[1,2],complete).ok,false);
});

test('repair context extracts exact current corrected fields without mutating originals',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-repair-context-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'semantic-packets'));fs.mkdirSync(path.join(dir,'evidence/pages'),{recursive:true});
 const packet={pageNumber:1,sections:[{id:'s',blocks:[{id:'b',type:'question',content:{id:'q',prompt:'Original',answer:{short:'1',worked:'x=1'}}}]}]};
 const file=path.join(dir,'semantic-packets/page-001.author.json');fs.writeFileSync(file,JSON.stringify(packet));
 for(const ext of ['png','txt'])fs.writeFileSync(path.join(dir,'evidence/pages/page-001.'+ext),'source fixture');
 const state={revision:2,pages:{},issues:{},representatives:{},corrections:[{id:'repair',reason:'Reviewed source fixture',sourceRefs:[{pageNumber:1}],status:'approved',patches:[{scope:'author',page:1,targetId:'q',field:'/prompt',original:'Original',corrected:'Reviewed'}]}]};
 const request={targets:[{page:1,scope:'author',targetId:'q',fields:['/prompt','/answer/short']}]};
 const result=targetedRepairContext(dir,request,{state});
 assert.equal(result.targets[0].original,'Reviewed');assert.equal(result.targets[1].original,'1');
 assert.equal(result.expectedRevision,2);assert.equal(result.evidence[0].files.length,2);
 assert.deepEqual(JSON.parse(fs.readFileSync(file)),packet);
 for(const field of ['/missing','/answer/__proto__','/answer/~2'])assert.throws(()=>targetedRepairContext(dir,{targets:[{...request.targets[0],fields:[field]}]},{state}),/field|pointer/);
 const out=path.join(dir,'context.json');writeNewJson(out,result);assert.throws(()=>writeNewJson(out,{}),/EEXIST/);
});

test('editor harness rejects live project directories and existing output',()=>{
 assert.throws(()=>isolatedHarnessDirectory('booklets/projects'),/inside .booklet-work/);
 assert.throws(()=>isolatedHarnessDirectory('.booklet-work'),/inside .booklet-work/);
 assert.throws(()=>isolatedHarnessDirectory('.booklet-work/../booklets/projects'),/inside .booklet-work/);
});

test('closeout reports absent acceptance without writing or manufacturing review records',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-closeout-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'workflow'));const file=path.join(dir,'workflow/issues.json'),raw=JSON.stringify({revision:0,pages:{},issues:{},corrections:[],representatives:{},settled:null,finalReview:null});fs.writeFileSync(file,raw);
 const report=importCloseout(dir,[]);assert.equal(report.ok,false);assert.equal(report.finalAccepted,false);assert.equal(report.finalReview,null);assert.equal(fs.readFileSync(file,'utf8'),raw);
});
