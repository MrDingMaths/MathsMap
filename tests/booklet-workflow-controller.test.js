import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {driveBoundedWorkflow,evaluateDispatchBudget,recoveryAction} from '../scripts/booklet/workflow-controller.mjs';
import {summarizeControllerEvents} from '../scripts/booklet/run-observability.mjs';

const usage=(tokens=0,missingUsage=0)=>({completeJob:{usage:{total_tokens:tokens,input_tokens:tokens,cached_input_tokens:0,output_tokens:0},missingUsage},model:{normalizedUsage:{total_tokens:tokens}}});
const budget={totalTokens:1000,reserveTokensPerJob:100};
const fixture=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'workflow-controller-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const empty={jobs:[],active:[],blockers:[],checklist:[{id:'complete',passed:true}]};

test('dispatch budget accounts for pending calls, missing usage and warnings',()=>{
 assert.equal(evaluateDispatchBudget(usage(750),{...budget,warningFraction:0.8},1).warnings.length,1);
 assert.equal(evaluateDispatchBudget(usage(850),budget,2).exceeded[0].measure,'totalTokens');
 assert.equal(evaluateDispatchBudget(usage(0,1),budget,1).ok,false);
 assert.equal(evaluateDispatchBudget({...usage(),completeJob:{...usage().completeJob,coverage:{missingRoles:['coordinator']}}},budget,1).ok,false);
});

test('controller dispatches independent jobs once and stops at current acceptance',async t=>{
 const dir=fixture(t),calls=[],jobs=[{id:'maths-1',stage:'maths',dependencyHash:'a',blockers:[]},{id:'maths-2',stage:'maths',dependencyHash:'b',blockers:[]}];let completed=false;
 const result=await driveBoundedWorkflow({runDir:dir},{budget,concurrency:2,receipt:()=>usage(),next:async()=>completed?empty:{...empty,jobs,checklist:[{id:'complete',passed:false}]},
  run:async(_options,id)=>{calls.push(id);if(calls.length===2)completed=true;return {ok:true};}});
 assert.equal(result.status,'complete');assert.deepEqual(calls.sort(),['maths-1','maths-2']);
 assert.equal(fs.readFileSync(path.join(dir,'workflow/controller-events.jsonl'),'utf8').split('\n').filter(Boolean).filter(line=>JSON.parse(line).event==='dispatch').length,2);
 assert.equal(summarizeControllerEvents(dir).dispatchByStage.maths,2);
});

test('controller records a durable worker result without another model call',async t=>{
 const dir=fixture(t),ticketPath=path.join(dir,'workflow/stages/claim-1/request.json'),generation=path.join(path.dirname(ticketPath),'generation.json');fs.mkdirSync(path.dirname(ticketPath),{recursive:true});fs.writeFileSync(ticketPath,'{}');fs.writeFileSync(generation,'{"outcome":"accepted"}');
 const claim={id:'claim-1',jobId:'maths-1',ticket:{path:ticketPath,hash:'fixture'}};let active=true,recorded=0;
 const result=await driveBoundedWorkflow({runDir:dir},{budget,receipt:()=>usage(),next:async()=>active?{...empty,active:[claim],checklist:[{id:'complete',passed:false}]}:empty,
  record:async(_options,input)=>{assert.equal(input.resultFile,generation);recorded++;active=false;return {ok:true};},run:()=>{throw Error('unexpected new model call');}});
 assert.equal(result.status,'complete');assert.equal(recorded,1);
});

test('prepared ticket resumes once; ambiguous worker output remains a blocker',async t=>{
 const dir=fixture(t),ticketPath=path.join(dir,'workflow/stages/claim-2/request.json');fs.mkdirSync(path.dirname(ticketPath),{recursive:true});fs.writeFileSync(ticketPath,'{}');
 const claim={id:'claim-2',jobId:'maths-2',ticket:{path:ticketPath,hash:'fixture'}};let active=true,resumed=0;
 const result=await driveBoundedWorkflow({runDir:dir},{budget,receipt:()=>usage(),next:async()=>active?{...empty,active:[claim],checklist:[{id:'complete',passed:false}]}:empty,
  resume:async()=>{resumed++;active=false;return {ok:true};}});
 assert.equal(result.status,'complete');assert.equal(resumed,1);
 fs.mkdirSync(path.join(dir,'semantic-packets'));fs.writeFileSync(path.join(dir,'semantic-packets/attempt-events.jsonl'),JSON.stringify({event:'started',requestId:'claim-2'})+'\n');
 assert.equal(recoveryAction(claim,dir).kind,'blocked');
 fs.mkdirSync(path.join(path.dirname(ticketPath),'codex'));assert.equal(recoveryAction(claim,dir).kind,'blocked');
});

test('a rejected recovered result remains blocked across controller restarts',async t=>{
 const dir=fixture(t),ticketPath=path.join(dir,'workflow/stages/claim-failed/request.json');fs.mkdirSync(path.dirname(ticketPath),{recursive:true});fs.writeFileSync(ticketPath,'{}');fs.writeFileSync(path.join(path.dirname(ticketPath),'generation.json'),'{}');
 const claim={id:'claim-failed',jobId:'maths-failed',ticket:{path:ticketPath,hash:'fixture'}};let recordings=0;
 const options={budget,receipt:()=>usage(),next:async()=>({...empty,active:[claim],checklist:[{id:'complete',passed:false}]}),
  record:async()=>{recordings++;throw Error('Explicit reviewer check is missing');}};
 assert.equal((await driveBoundedWorkflow({runDir:dir},options)).status,'needs-repair');
 assert.equal((await driveBoundedWorkflow({runDir:dir},options)).status,'needs-repair');
 assert.equal(recordings,1);
});

test('budget exhaustion stops before dispatch',async t=>{
 const dir=fixture(t),jobs=[{id:'maths-1',stage:'maths',dependencyHash:'a',blockers:[]}];
 const result=await driveBoundedWorkflow({runDir:dir},{budget,receipt:()=>usage(950),next:async()=>({...empty,jobs,checklist:[{id:'complete',passed:false}]}),run:()=>{throw Error('unexpected dispatch');}});
 assert.equal(result.status,'budget-exhausted');assert.equal(result.budget.exceeded[0].measure,'totalTokens');
});

test('controller reduces a batch when only one reservation fits',async t=>{
 const dir=fixture(t),jobs=[{id:'maths-1',stage:'maths',dependencyHash:'a',blockers:[]},{id:'maths-2',stage:'maths',dependencyHash:'b',blockers:[]}];let calls=0;
 const result=await driveBoundedWorkflow({runDir:dir},{budget,concurrency:2,receipt:()=>usage(850),maxWaves:1,
  next:async()=>({...empty,jobs,checklist:[{id:'complete',passed:false}]}),run:async()=>{calls++;return {ok:true};}});
 assert.equal(result.status,'wave-limit');assert.equal(calls,1);
});

test('controller dispatches inventory generation and checks every assignment call',async t=>{
 const dir=fixture(t),options={runDir:dir,manifest:{selectedPages:[1]},selectedPages:[1],config:{}},calls=[];let generated=false;
 const result=await driveBoundedWorkflow(options,{budget,maxWaves:3,receipt:()=>usage(),next:async()=>({...empty,checklist:[{id:'complete',passed:generated}]}),
  generationStatus:()=>({jobs:generated?[]:[{page:1,stage:'inventory',attempt:1}],blocked:[],complete:generated?[1]:[]}),
  generationRun:async(args,{runner})=>{
   if(args.dryRun)return {pages:[{page:1}],assignmentPlan:{assignments:[{id:'first'},{id:'second'}]}};
   await runner({prompt:'first'});await runner({prompt:'second'});generated=true;return {ok:true,pages:[{page:1,ok:true}]};
  },runner:async request=>{calls.push(request.prompt);return {result:{},metrics:{usage:{input_tokens:50,cached_input_tokens:0,output_tokens:10}}};}});
 assert.equal(result.status,'complete');assert.deepEqual(calls,['first','second']);
 assert.equal(summarizeControllerEvents(dir).byKind['generation-dispatch'],1);
});
