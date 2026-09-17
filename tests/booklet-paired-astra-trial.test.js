import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {selectCompleteUnit,runPairedTrial,recordTrialReview,pairedTrialReport,repairTrialPacket} from '../scripts/booklet/paired-astra-trial.mjs';
import {namespaceTrialReference} from '../scripts/booklet/paired-astra-trial-render.mjs';
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(v));return {path:f,hash:hash(f)};};
function fixture(t){
 const root=fs.mkdtempSync(path.resolve('.booklet-work/paired-trial-test-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const samples=Array.from({length:6},(_,i)=>{const id='s'+i,page=i<2?1:i,inventory={pageNumber:page,inventoried:true,entries:[{id:'q'+i,kind:'question',description:'Solve x = 1.'}]},assignment={id:'a'+i,pages:[page],inventoryIds:['q'+i],entries:inventory.entries.map(e=>({...e,pageNumber:page}))};
  const input=write(path.join(root,id+'.json'),{id,page,run:'example',runDir:root,title:'Trial',topic:'algebra',titleTopic:'Algebra',inventory,assignment});
  const prompt=write(path.join(root,id+'.txt'),id);return {id,page,run:'example',input,baseline:{prompt,images:[]},bounded:{prompt,images:[]}};});
 write(path.join(root,'protocol.json'),{version:1,arms:['baseline','bounded'],samples,model:{model:'gpt-6-astra',effort:'low'},sourceDependencies:[]});write(path.join(root,'review-register.json'),{version:1,revision:0,records:[]});return root;
}
function reply({prompt}){
 const id=JSON.parse(prompt),i=Number(id.slice(1)),page=i<2?1:i;
 return {result:{packets:[{pageNumber:page,sections:[{id:'section-'+id,title:'Algebra',topicId:'algebra',phase:'practice',role:'mixed-practice',blocks:[{id:'block-'+id,type:'question',sourceRefs:[{pageNumber:page}],sourceOrder:i+1,content:{id:'q'+i,type:'question',prompt:'Solve $x=1$.',answer:{short:'$1$',worked:'$x=1$.'}}}]}],inventoryMappings:[{inventoryId:'q'+i,targetId:'q'+i}],findings:[],corrections:[]}]},metrics:{callId:id,sessionId:'thread-'+id,elapsedMs:10,toolCalls:0,usage:{input_tokens:10,cached_input_tokens:4,output_tokens:3}}};
}
test('complete-unit selection preserves descendants and rejects split shared groups',()=>{
 const inventory={entries:[{id:'q',kind:'question'},{id:'a',parentId:'q',kind:'part'},{id:'figure',parentId:'a',kind:'diagram'},{id:'other',kind:'question'}],groups:[]};
 assert.deepEqual(selectCompleteUnit(inventory,'q').entries.map(e=>e.id),['q','a','figure']);
 assert.throws(()=>selectCompleteUnit(inventory,'a'),/complete top-level/);
 assert.throws(()=>selectCompleteUnit({...inventory,groups:[{id:'linked',entryIds:['q','other']}]},'q'),/splits a source group/);
 assert.throws(()=>selectCompleteUnit({...inventory,entries:inventory.entries.map(e=>e.id==='a'?{...e,sharedContextIds:['other']}:e)},'q'),/external shared dependency/);
});
test('paired queues retain successes, bound concurrency and never silently replay attempts',async t=>{
 const root=fixture(t);let active=0,max=0,calls=0;
 const runner=async options=>{active++;calls++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,5));active--;if(JSON.parse(options.prompt)==='s2')throw Error('preserved failure');return reply(options);};
 const report=await runPairedTrial({out:root,arm:'baseline'},{runner,log:()=>{}});assert.equal(report.scheduled,5);assert.equal(calls,6);assert.ok(max<=3);assert.equal(report.results.filter(r=>r.status==='failed').length,1,JSON.stringify(report.results.map(r=>r.error)));
 await runPairedTrial({out:root,arm:'baseline'},{runner,log:()=>{}});assert.equal(calls,6);
 fs.writeFileSync(path.join(root,'baseline','s0','1','stderr.txt'),'ERROR codex_core::tools::router: error=exec_command failed: rejected: blocked by policy\n');
 const result=pairedTrialReport(root);assert.equal(result.arms.baseline.modelInvocations,6);assert.equal(result.arms.baseline.usage.inputTokens.unavailableCalls,1);assert.equal(result.arms.baseline.acceptedAssignments,0);assert.equal(result.comparisonEligible,false);
 assert.equal(result.arms.baseline.rejectedToolAttempts[0].count,1);assert.ok(result.comparisonBlockers.some(x=>/Tool-access rejections/.test(x)));
});
test('review requires current revision, output and real render evidence; repair invalidates acceptance',async t=>{
 const root=fixture(t);await runPairedTrial({out:root,arm:'bounded'},{runner:reply,log:()=>{}});
 const attempt=JSON.parse(fs.readFileSync(path.join(root,'bounded','s0','1','attempt.json'))),output=attempt.output;
 const record={id:'s0',arm:'bounded',expectedRevision:0,outputHash:output.hash,reviewer:'Test reviewer',note:'Explicit test observation',artifacts:[output],checks:Object.fromEntries(['source','mathematics','taughtMethod','editability','presentation','rendered'].map(c=>[c,'passed'])),issues:[]};
 assert.throws(()=>recordTrialReview({out:root,record}),/inspected image/);
 const png=path.join(root,'inspected.png');fs.writeFileSync(png,'test raster');record.artifacts.push({path:png,hash:hash(png)});
 assert.equal(recordTrialReview({out:root,record}).accepted,true);
 assert.throws(()=>recordTrialReview({out:root,record}),/revision changed/);
 fs.writeFileSync(png,'changed raster');assert.equal(pairedTrialReport(root).arms.bounded.acceptedAssignments,0);fs.writeFileSync(png,'test raster');
 const context={targets:[{targetId:'q0',field:'/answer/short',original:'$1$'}]},patches=[{...context.targets[0],corrected:'$x=1$',reason:'Clarify variable in answer'}];
 const repaired=repairTrialPacket({out:root,arm:'bounded',id:'s0',expectedOutputHash:output.hash,context,patches,reviewer:'Test',note:'Exact answer repair',elapsedMs:5});
 assert.equal(repaired.attempt,2);assert.equal(pairedTrialReport(root).arms.bounded.acceptedAssignments,0);
 assert.throws(()=>repairTrialPacket({out:root,arm:'bounded',id:'s0',expectedOutputHash:output.hash,context,patches,reviewer:'Test',note:'Stale'}),/output changed/);
});
test('changed frozen evidence blocks calls and reporting',async t=>{
 const root=fixture(t);fs.writeFileSync(path.join(root,'s0.txt'),'changed');let calls=0;
 await assert.rejects(runPairedTrial({out:root,arm:'bounded'},{runner:()=>{calls++;},log:()=>{}}),/Frozen trial input changed/);assert.equal(calls,0);
 assert.throws(()=>pairedTrialReport(root),/Frozen trial input changed/);
});
test('trial composition namespaces native paragraph fragments and their owner together',()=>{
 const ids=new Set(['question','question-part','paragraph']);
 assert.equal(namespaceTrialReference('question-part/prompt#paragraph','sample',ids),'sample-question-part/prompt#sample-paragraph');
 assert.equal(namespaceTrialReference('question-part/label','sample',ids),'sample-question-part/label');
 assert.equal(namespaceTrialReference('unrelated/prompt#paragraph','sample',ids),'unrelated/prompt#paragraph');
});
test('interrupted calls retain explicitly unavailable usage and are never silently replayed',async t=>{
 const root=fixture(t);write(path.join(root,'bounded','s0','1','started.json'),{id:'s0',arm:'bounded',attempt:1,kind:'generation',metrics:null,status:'pending'});
 let calls=0;await runPairedTrial({out:root,arm:'bounded'},{runner:args=>{calls++;return reply(args);},log:()=>{}});
 const report=pairedTrialReport(root);assert.equal(calls,5);assert.equal(report.arms.bounded.rows[0].status,'interrupted');assert.equal(report.arms.bounded.usage.inputTokens.unavailableCalls,1);assert.equal(report.arms.bounded.modelInvocations,6);
});
