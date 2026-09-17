import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeUsage,aggregateUsage,readCodexSessionUsage,summarizeWeeklyUsage} from '../scripts/booklet/session-usage.mjs';
import {summarizeAttemptEvents} from '../scripts/booklet/semantic-run-metrics.mjs';
import {linkRunSession,recordWeeklyUsage,recordExportReuse,buildRunReceipt,summarizeRunReceipt} from '../scripts/booklet/run-observability.mjs';

const origin=Date.parse('2026-09-17T00:00:00Z'),at=offset=>new Date(origin+offset).toISOString();
const usage=(input,cached,output,reasoning=0)=>({input_tokens:input,cached_input_tokens:cached,output_tokens:output,reasoning_output_tokens:reasoning,total_tokens:input+output});
const event=(offset,type,payload)=>({timestamp:at(offset),type,payload});
const meta=id=>event(0,'session_meta',{id,session_id:id+'-runtime',base_instructions:'SECRET-INSTRUCTIONS',git:{private:'SECRET-GIT'}});
const call=(offset,id,values,total=values)=>event(offset,'token_usage_record',{response_id:id,turn_id:'turn-1',usage:values,thread_token_usage:total});
const snapshot=(offset,total,last)=>event(offset,'event_msg',{type:'token_count',info:{total_token_usage:total,last_token_usage:last},rate_limits:{credits:{balance:'SECRET-CREDIT'}}});
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-accounting-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const write=(name,body)=>{const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof body==='string'?body:body.map(row=>JSON.stringify(row)).join('\n')+'\n');return file;};return {dir,write};}
function attempts(rows){return rows.flatMap(({id,start=0,end=100,metrics,attempt=1,stage='author'})=>[
 {attemptId:id,event:'started',time:origin+start,at:at(start),stage,attempt,retryReason:attempt>1?'content-repair':'initial'},
 {attemptId:id,event:'phase-started',phase:'generation',time:origin+start,at:at(start)},
 {attemptId:id,event:'phase-finished',phase:'generation',time:origin+end,at:at(end),elapsedMs:end-start,metrics},
 {attemptId:id,event:'finished',time:origin+end,at:at(end),ok:true},
]);}
const phase=(id,name,start,end,details={})=>[{id,event:'phase-started',phase:name,time:origin+start,at:at(start),details},{id,event:'phase-finished',time:origin+end,at:at(end),ok:true,details:{}}];

test('session response identities deduplicate snapshots and compaction copies without exposing content',t=>{
 const f=fixture(t),a=usage(100,60,20,8),b=usage(80,40,10,4),total=usage(180,100,30,12);
 const direct=call(40,'response-1',a),log=f.write('session.jsonl',[
  meta('session-a'),event(0,'event_msg',{type:'task_started',turn_id:'turn-1',started_at:origin/1000}),
  event(10,'response_item',{type:'custom_tool_call',call_id:'tool-a',input:'SECRET-ARGUMENTS'}),event(11,'response_item',{type:'custom_tool_call',call_id:'tool-a',input:'SECRET-ARGUMENTS'}),
  event(20,'response_item',{type:'custom_tool_call_output',call_id:'tool-a',output:'SECRET-BASE64'}),direct,snapshot(41,a,a),snapshot(42,a,a),
  event(50,'compacted',{compaction_response_id:'response-1',latest_token_usage_record:direct.payload,replacement_history:'SECRET-HISTORY'}),
  call(70,'response-2',b,total),snapshot(71,total,b),event(100,'event_msg',{type:'task_complete',turn_id:'turn-1',completed_at:(origin+100)/1000}),
 ]);
 const result=readCodexSessionUsage(log,{sessionId:'session-a'});
 assert.equal(result.calls,2);assert.equal(result.responseCalls,2);assert.equal(result.cumulativeObservations,0);
 assert.equal(result.usage.input_tokens,180);assert.equal(result.usage.total_tokens,210);assert.equal(result.usage.reasoning_output_tokens,12);
 assert.equal(result.toolCalls,1);assert.equal(result.compactions,1);assert.deepEqual(result.intervals,[[origin,origin+100]]);assert.equal(result.coverage,'recorded');
 assert.doesNotMatch(JSON.stringify(result),/SECRET/);assert.equal(result.duplicatedRecords,1);
 assert.throws(()=>readCodexSessionUsage(log,{sessionId:'different-session'}),/identity/);
});

test('legacy cumulative snapshots use deltas and retain unknown baselines and regressions',t=>{
 const f=fixture(t),log=f.write('legacy.jsonl',[meta('legacy'),snapshot(10,usage(100,60,20),usage(100,60,20)),snapshot(20,usage(100,60,20),usage(100,60,20)),snapshot(30,usage(160,100,30),usage(60,40,10))]);
 const result=readCodexSessionUsage(log,{sessionId:'legacy'});
 assert.equal(result.calls,2);assert.equal(result.usage.input_tokens,160);assert.equal(result.usage.cached_input_tokens,100);assert.equal(result.coverage,'recorded');
 const partial=f.write('partial.jsonl',[meta('partial'),snapshot(10,usage(1000,500,100),usage(20,10,5)),snapshot(20,usage(30,10,8),usage(10,0,3)),snapshot(30,usage(1000,500,100),usage(20,10,5))]);
 const unknown=readCodexSessionUsage(partial,{sessionId:'partial'});
 assert.equal(unknown.usage.input_tokens,20);assert.equal(unknown.baselineUnavailable,true);assert.equal(unknown.counterRegressions,1);assert.equal(unknown.missingUsage,1);assert.equal(unknown.coverage,'partial');
});

test('missing optional fields do not count a response and its cumulative mirror twice',t=>{
 const f=fixture(t),a=usage(100,60,20),total={...a,cache_write_input_tokens:0};
 const log=f.write('optional.jsonl',[meta('s'),call(1,'r',a,a),snapshot(2,total,total)]);
 assert.equal(readCodexSessionUsage(log,{sessionId:'s'}).usage.input_tokens,100);
});

test('response records stay authoritative when UI totals omit compaction usage',t=>{
 const f=fixture(t),first=usage(100,60,20),compaction=usage(300,80,30),next=usage(40,20,10);
 const log=f.write('compaction.jsonl',[meta('s'),call(10,'first',first),snapshot(11,first,first),call(20,'compaction',compaction,usage(400,140,50)),snapshot(21,first,usage(0,0,0)),call(30,'next',next,usage(440,160,60)),snapshot(31,usage(140,80,30),next)]);
 const result=readCodexSessionUsage(log,{sessionId:'s'});assert.equal(result.usage.input_tokens,440);assert.equal(result.calls,3);assert.equal(result.cumulativeObservations,0);assert.equal(result.coverage,'recorded');
});

test('stage windows use prior cumulative baselines and completed task intervals',t=>{
 const f=fixture(t),log=f.write('window.jsonl',[meta('s'),event(0,'event_msg',{type:'task_started',turn_id:'turn-1'}),snapshot(10,usage(100,60,20),usage(100,60,20)),snapshot(60,usage(140,80,30),usage(40,20,10)),event(100,'event_msg',{type:'task_complete',turn_id:'turn-1'})]);
 const result=readCodexSessionUsage(log,{sessionId:'s',startedAt:at(50),endedAt:at(90)});
 assert.equal(result.usage.input_tokens,40);assert.deepEqual(result.intervals,[[origin+50,origin+90]]);
});

test('truncated logs retain safe known usage; unreadable or absent sessions stay unavailable',t=>{
 const f=fixture(t),log=f.write('tail.jsonl',[meta('s'),call(10,'r',usage(20,10,3))]);fs.appendFileSync(log,'{"payload":');
 const result=readCodexSessionUsage(log,{sessionId:'s'});assert.equal(result.incompleteTail,true);assert.equal(result.usage.input_tokens,20);assert.equal(result.coverage,'partial');
 const absent=readCodexSessionUsage(path.join(f.dir,'missing.jsonl'),{sessionId:'missing'});assert.equal(absent.available,false);assert.equal(absent.usage.input_tokens,null);
 const invalid=f.write('invalid.jsonl','{}\nmalformed\n{}\n');assert.throws(()=>readCodexSessionUsage(invalid,{sessionId:'s'}),/line 2/);
});

test('cache and reasoning tokens remain subsets and unavailable fields remain null',()=>{
 const values=normalizeUsage({input_tokens:100,output_tokens:20,input_tokens_details:{cached_tokens:70},output_tokens_details:{reasoning_tokens:12},total_tokens:202});
 assert.equal(values.total_tokens,120);assert.equal(values.cached_input_tokens,70);assert.equal(values.reasoning_output_tokens,12);assert.equal(values.cache_write_input_tokens,null);
 const summed=aggregateUsage([{usage:values},{usage:null}]);assert.equal(summed.usage.input_tokens,100);assert.equal(summed.missingUsage,1);assert.equal(summed.unavailableByMetric.input_tokens,1);
 assert.equal(normalizeUsage({input_tokens:10,cached_input_tokens:20,output_tokens:-1}).cached_input_tokens,null);
 assert.equal(aggregateUsage([]).usage.input_tokens,null);
});

test('runner receipts deduplicate repeated session/call identity and retain retry costs',()=>{
 const metrics={sessionId:'s',callId:'call-1',elapsedMs:100,usage:usage(100,60,20)};
 const result=summarizeAttemptEvents(attempts([{id:'a',metrics},{id:'duplicate',metrics},{id:'retry',attempt:2,metrics:{...metrics,callId:'call-2'}}]));
 assert.equal(result.attempts,3);assert.equal(result.calls,2);assert.equal(result.duplicateCalls,1);assert.equal(result.usage.input_tokens,200);assert.equal(result.callElapsedMs,200);assert.equal(result.byRetryReason['content-repair'].calls,1);
});

test('complete-job receipt deduplicates worker usage while adding coordinator and review sessions',async t=>{
 const f=fixture(t),worker=f.write('worker.jsonl',[meta('worker'),call(40,'r1',usage(100,60,20))]),coordinator=f.write('coordinator.jsonl',[meta('coordinator'),call(10,'r2',usage(200,180,30))]),review=f.write('review.jsonl',[meta('review'),event(20,'event_msg',{type:'task_started',turn_id:'turn-1'}),call(50,'r3',usage(50,10,5)),event(120,'event_msg',{type:'task_complete',turn_id:'turn-1'})]);
 f.write('semantic-packets/attempt-events.jsonl',attempts([{id:'attempt-a',metrics:{sessionId:'worker',callId:'invocation-1',elapsedMs:100,usage:usage(100,60,20),toolCalls:0}}]));
 await linkRunSession(f.dir,{sessionId:'worker',stage:'author',role:'transcription',rolloutPath:worker});
 await linkRunSession(f.dir,{sessionId:'coordinator',stage:'dispatch',role:'coordinator',rolloutPath:coordinator});
 await linkRunSession(f.dir,{sessionId:'review',stage:'math-review',role:'review',rolloutPath:review});
 const result=buildRunReceipt(f.dir);
 assert.equal(result.model.usage.input_tokens,100);assert.equal(result.completeJob.usage.input_tokens,350);assert.equal(result.completeJob.deduplicatedRunnerInvocations,1);assert.equal(result.completeJob.responseCalls,3);assert.equal(result.completeJob.runnerInvocations,1);
 assert.deepEqual(result.completeJob.coverage.missingRoles,[]);assert.equal(result.completeJob.byRole.coordinator.usage.input_tokens,200);assert.equal(result.recordedActiveWallMs,120);assert.equal(result.recordedReviewWallMs,100);
 assert.equal(result.summedModelCallMs,100);assert.equal(result.completeJob.missingModelCallDurations,2);
 assert.doesNotMatch(JSON.stringify(summarizeRunReceipt(result)),/SECRET|rolloutPath/);
});

test('missing linked sessions retain known runner totals and explicit unavailable review usage',async t=>{
 const f=fixture(t);f.write('semantic-packets/attempt-events.jsonl',attempts([{id:'a',metrics:{sessionId:'missing-worker',elapsedMs:10,usage:usage(30,10,5)}}]));
 await linkRunSession(f.dir,{sessionId:'missing-worker',stage:'author',role:'transcription',rolloutPath:path.join(f.dir,'missing-worker.jsonl')});
 await linkRunSession(f.dir,{sessionId:'missing-review',stage:'math-review',role:'review',rolloutPath:path.join(f.dir,'missing-review.jsonl')});
 const result=buildRunReceipt(f.dir).completeJob;
 assert.equal(result.usage.input_tokens,30);assert.equal(result.missingUsage,1);assert.equal(result.byRole.review.usage.input_tokens,null);assert.equal(result.coverage.unavailableSessions,2);assert.equal(result.sessions[0].usageSource,'runner-fallback');
});

test('session registration is idempotent and overlapping stage ownership is rejected',async t=>{
 const f=fixture(t),rolloutPath=f.write('session.jsonl',[meta('s'),call(20,'r',usage(10,0,2))]),input={sessionId:'s',stage:'dispatch',role:'coordinator',rolloutPath,startedAt:at(0),endedAt:at(50)};
 assert.equal((await linkRunSession(f.dir,input)).reused,false);assert.equal((await linkRunSession(f.dir,input)).reused,true);
 await assert.rejects(()=>linkRunSession(f.dir,{...input,role:'review'}),/different attribution/);
 await assert.rejects(()=>linkRunSession(f.dir,{...input,stage:'review',startedAt:at(40),endedAt:at(100)}),/overlap/);
 await assert.rejects(()=>linkRunSession(f.dir,{...input,sessionId:'s-runtime',stage:'review',startedAt:at(40),endedAt:at(100)}),/overlap/);
 await linkRunSession(f.dir,{...input,stage:'review',role:'review',startedAt:at(50),endedAt:at(100)});
 assert.equal(buildRunReceipt(f.dir).completeJob.usage.input_tokens,10);
});

test('active time unions concurrent work and excludes explicit human waiting',t=>{
 const f=fixture(t);f.write('workflow/run-events.jsonl',[...phase('compile','compile',0,100),...phase('review','visual-review',50,150),...phase('wait','human-wait',75,125,{activity:'human-wait',excludedFromActive:true}),{id:'open',event:'phase-started',phase:'review',time:origin+200,at:at(200),details:{}}]);
 f.write('semantic-packets/attempt-events.jsonl',attempts([{id:'a',start:0,end:100,metrics:{elapsedMs:100,usage:null}},{id:'b',start:50,end:150,metrics:{elapsedMs:100,usage:null}}]));
 const result=buildRunReceipt(f.dir);assert.equal(result.recordedActiveWallMs,100);assert.equal(result.humanWaitingMs,50);assert.equal(result.calendarSpanMs,150);assert.equal(result.summedModelCallMs,200);assert.equal(result.recordedReviewWallMs,50);assert.equal(result.unfinished.length,1);
});

test('review invocation time contributes without a linked rollout and unions overlapping reviews',t=>{
 const f=fixture(t),metrics={role:'review',elapsedMs:100,usage:usage(100,60,20)};
 f.write('semantic-packets/attempt-events.jsonl',attempts([{id:'a',start:0,end:100,stage:'maths',metrics},{id:'b',start:50,end:150,stage:'theory',metrics},{id:'c',start:100,end:200,metrics:{...metrics,role:'transcription'}}]));
 f.write('workflow/run-events.jsonl',phase('wait','human-wait',75,125,{activity:'human-wait',excludedFromActive:true}));
 const result=buildRunReceipt(f.dir);assert.equal(result.recordedReviewWallMs,100);assert.equal(result.recordedActiveWallMs,150);assert.equal(result.summedModelCallMs,300);assert.equal(result.completeJob.byRole.review.usage.input_tokens,200);
});

test('weekly allowance comparison requires one reset window and discloses unrelated usage',async t=>{
 const f=fixture(t),base={resetAt:'2026-09-20T00:00:00Z',windowMinutes:10080,unrelatedConcurrentUsage:'none'};
 const first={...base,id:'before',at:'2026-09-17T00:00:00Z',usedPercent:10},last={...base,id:'after',at:'2026-09-17T02:00:00Z',usedPercent:18};
 await recordWeeklyUsage(f.dir,first);assert.equal((await recordWeeklyUsage(f.dir,first)).reused,true);await recordWeeklyUsage(f.dir,last);
 assert.equal(buildRunReceipt(f.dir).weeklyAllowance.attributedToRunPercentagePoints,8);assert.equal(buildRunReceipt(f.dir).weeklyAllowance.reason,null);
 const contaminated=summarizeWeeklyUsage([first,{...last,unrelatedConcurrentUsage:'present',unrelatedSessionIds:['unrelated']}]);assert.equal(contaminated.observedChangePercentagePoints,8);assert.equal(contaminated.attributedToRunPercentagePoints,null);
 const resets=summarizeWeeklyUsage([first,{...last,resetAt:'2026-09-27T00:00:00Z'}]);assert.equal(resets.observedChangePercentagePoints,null);assert.equal(resets.reason,'different-reset-windows');
 await assert.rejects(()=>recordWeeklyUsage(f.dir,{...last,usedPercent:19}),/different values/);
 await assert.rejects(()=>recordWeeklyUsage(f.dir,{...last,id:'wrong-window',windowMinutes:300}),/10080/);
 await assert.rejects(()=>recordWeeklyUsage(f.dir,{...last,id:'contradiction',unrelatedSessionIds:['unrelated']}),/contradict/);
});

test('export reuse is explicit, deduplicated and tied to current artifact evidence',async t=>{
 const f=fixture(t),file=f.write('review.pdf','fixture pdf'),artifact={path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
 f.write('workflow/run-events.jsonl',phase('render','render-export',0,100));
 const input={id:'short-1',edition:'short',reused:true,artifact,dependencyKey:'settled-1',phaseId:'render'};
 await recordExportReuse(f.dir,input);assert.equal((await recordExportReuse(f.dir,input)).reused,true);
 const result=buildRunReceipt(f.dir);assert.equal(result.exportReuse.reused,1);assert.equal(result.exportReuse.generated,0);assert.equal(result.exportReuse.unmeasuredPhases,0);
 await assert.rejects(()=>recordExportReuse(f.dir,{...input,reused:false}),/different values/);
 fs.writeFileSync(file,'changed');await assert.rejects(()=>recordExportReuse(f.dir,{...input,id:'short-2'}),/changed/);
});
