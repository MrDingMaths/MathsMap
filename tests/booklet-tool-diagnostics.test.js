import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {runAstraTask,readToolDiagnostics} from '../scripts/booklet/codex-transcription.mjs';
import {buildRunReceipt,linkRunSession,summarizeRunReceipt} from '../scripts/booklet/run-observability.mjs';

function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-tool-metrics-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const write=(name,value)=>{const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:value.map(row=>JSON.stringify(row)).join('\n')+'\n');return file;};return {dir,write};}
const diagnostic='2026-09-17T08:54:21.048547Z ERROR codex_core::tools::router: error=exec_command failed: SECRET-COMMAND rejected: blocked by policy\\")" }';
const usage={input_tokens:100,cached_input_tokens:80,output_tokens:20};
function invocation(metrics){return [{attemptId:'a',event:'started',stage:'author',attempt:1,time:0},{attemptId:'a',event:'phase-started',phase:'generation',time:0},{attemptId:'a',event:'phase-finished',phase:'generation',time:100,elapsedMs:100,metrics},{attemptId:'a',event:'finished',time:100,ok:true}];}

test('runner counts split stderr rejections separately from deduplicated completed events',async t=>{
 const f=fixture(t),spawnProcess=(_binary,args)=>{
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new Writable({write(_chunk,_encoding,done){done();}});child.kill=()=>child.emit('close',1);
  setTimeout(()=>{
   fs.writeFileSync(args[args.indexOf('--output-last-message')+1],'{"fixture":true}');
   const completed={type:'item.completed',item:{id:'tool-a',type:'command_execution'}};
   child.stdout.write([JSON.stringify({type:'thread.started',thread_id:'worker'}),JSON.stringify(completed),JSON.stringify(completed),JSON.stringify({type:'turn.completed',usage})].join('\n'));
   child.stderr.write(diagnostic.slice(0,-9));child.stderr.write(diagnostic.slice(-9)+'\n');child.emit('close',0);
  },5);return child;
 };
 const result=await runAstraTask({cwd:f.dir,prompt:'Synthetic evidence',out:path.join(f.dir,'attempt')},{spawnProcess});
 assert.equal(result.metrics.toolCalls,1);assert.equal(result.metrics.completedToolCalls,1);assert.equal(result.metrics.rejectedToolAttempts,1);assert.equal(result.metrics.missingCompletedToolCounts,0);assert.equal(result.metrics.missingRejectedToolCounts,0);
 assert.deepEqual(result.metrics.rejectedToolReasons,{'blocked-by-policy':1});assert.match(result.metrics.toolCountingNote,/may overlap/);assert.doesNotMatch(JSON.stringify(result.metrics),/SECRET-COMMAND/);
 assert.equal(readToolDiagnostics(path.join(f.dir,'attempt/stderr.txt')).rejectedToolAttempts,1);
});

test('missing capture and unsupported diagnostic failures remain unavailable',async t=>{
 const f=fixture(t);await assert.rejects(()=>runAstraTask({cwd:f.dir,prompt:'Fixture',out:path.join(f.dir,'spawn-error')},{spawnProcess:()=>{throw Error('Synthetic spawn failure');}}),error=>{
  assert.equal(error.metrics.toolCalls,0);assert.equal(error.metrics.completedToolCalls,null);assert.equal(error.metrics.rejectedToolAttempts,null);assert.equal(error.metrics.missingCompletedToolCounts,1);assert.equal(error.metrics.missingRejectedToolCounts,1);return true;
 });
 const absent=readToolDiagnostics(path.join(f.dir,'missing.txt'));assert.equal(absent.rejectedToolAttempts,null);assert.equal(absent.missingRejectedToolCounts,1);
 const unknown=readToolDiagnostics(f.write('unknown.txt','2026-09-17T08:54:21Z ERROR codex_core::tools::router: error=exec_command failed: unsupported diagnostic reason\n'));
 assert.equal(unknown.rejectedToolAttempts,0);assert.equal(unknown.unclassifiedToolFailures,1);assert.equal(unknown.missingRejectedToolCounts,1);
});

test('complete receipts retain runner rejection diagnostics when linked session usage replaces totals',async t=>{
 const f=fixture(t),metrics={sessionId:'worker',callId:'call-a',usage,elapsedMs:100,toolCalls:1,completedToolCalls:1,rejectedToolAttempts:1,missingCompletedToolCounts:0,missingRejectedToolCounts:0};
 f.write('semantic-packets/attempt-events.jsonl',invocation(metrics));const stamp='2026-09-17T00:00:00Z',rollout=f.write('worker.jsonl',[
  {timestamp:stamp,type:'session_meta',payload:{id:'worker'}},
  {timestamp:stamp,type:'response_item',payload:{type:'function_call',call_id:'tool-a',arguments:'SECRET-ARGUMENTS'}},
  {timestamp:stamp,type:'response_item',payload:{type:'function_call_output',call_id:'tool-a',output:'SECRET-OUTPUT'}},
  {timestamp:stamp,type:'token_usage_record',payload:{response_id:'response-a',usage}},
 ]);
 await linkRunSession(f.dir,{sessionId:'worker',stage:'author',role:'transcription',rolloutPath:rollout});
 await linkRunSession(f.dir,{sessionId:'coordinator',stage:'coordination',role:'coordinator',rolloutPath:path.join(f.dir,'missing.jsonl')});
 const receipt=buildRunReceipt(f.dir),summary=summarizeRunReceipt(receipt);
 assert.equal(receipt.completeJob.deduplicatedRunnerInvocations,1);assert.equal(receipt.completeJob.completedToolCalls,1);assert.equal(receipt.completeJob.rejectedToolAttempts,1);assert.equal(receipt.completeJob.missingCompletedToolCounts,1);assert.equal(receipt.completeJob.missingRejectedToolCounts,1);
 assert.equal(summary.model.completedToolCalls,1);assert.equal(summary.model.rejectedToolAttempts,1);assert.doesNotMatch(JSON.stringify(summary),/SECRET-/);
});

test('historical zero observed tools does not establish missing completed or rejection counts',t=>{
 const f=fixture(t);f.write('semantic-packets/attempt-events.jsonl',invocation({toolCalls:0,usage}));const receipt=buildRunReceipt(f.dir);
 assert.equal(receipt.completeJob.toolCalls,0);assert.equal(receipt.completeJob.completedToolCalls,null);assert.equal(receipt.completeJob.rejectedToolAttempts,null);assert.equal(receipt.completeJob.missingCompletedToolCounts,1);assert.equal(receipt.completeJob.missingRejectedToolCounts,1);
 assert.equal(receipt.model.rejectedToolAttempts,null);assert.equal(receipt.model.missingRejectedToolCounts,1);
});


test('medium execution metrics record the same effort and override sent to Codex',async t=>{
 const f=fixture(t),reasoningOverride={effort:'medium',reason:'User-requested Pythagoras trial'};
 const {transcriptionConfiguration}=await import('../scripts/booklet/transcription-settings.mjs');
 const result=await runAstraTask({cwd:f.dir,prompt:'Synthetic evidence',out:path.join(f.dir,'medium'),configuration:transcriptionConfiguration({reasoningOverride})},{spawnProcess:(_binary,args)=>{
  assert.ok(args.includes('model_reasoning_effort="medium"'));
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new Writable({write(_chunk,_encoding,done){done();}});child.kill=()=>child.emit('close',1);
  setTimeout(()=>{fs.writeFileSync(args[args.indexOf('--output-last-message')+1],'{}');child.stdout.write(JSON.stringify({type:'turn.completed',usage})+'\n');child.emit('close',0);},5);
  return child;
 }});
 assert.equal(result.metrics.effort,'medium');assert.deepEqual(result.metrics.reasoningOverride,reasoningOverride);assert.equal(result.metrics.serviceTier,'default');
});


test('repair workers infer medium from run manifest and reject explicit high before execution',async t=>{
 const f=fixture(t),manifest={provider:'codex',model:'gpt-6.1-sol',effort:'medium',reasoningOverride:{effort:'medium',reason:'User-requested Pythagoras trial'}};
 fs.writeFileSync(path.join(f.dir,'manifest.json'),JSON.stringify(manifest));
 await assert.rejects(()=>runAstraTask({runDir:f.dir,cwd:f.dir,prompt:'Repair',out:path.join(f.dir,'wrong'),configuration:{provider:'codex',model:'gpt-6.1-sol',effort:'high'}},{spawnProcess:()=>assert.fail('Mismatched execution started')}),/differs from recorded run/);
 await assert.rejects(()=>runAstraTask({runDir:f.dir,cwd:f.dir,prompt:'Repair',out:path.join(f.dir,'inferred')},{spawnProcess:(_binary,args)=>{assert.ok(args.includes('model_reasoning_effort="medium"'));throw Error('Synthetic inference checked');}}),error=>{assert.equal(error.metrics.effort,'medium');return /Synthetic inference/.test(error.message);});
});
