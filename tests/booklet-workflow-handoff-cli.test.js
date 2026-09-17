import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
import {loadWorkflow} from '../scripts/booklet/workflow-review.mjs';

const repo=fileURLToPath(new URL('../',import.meta.url)),entry=fileURLToPath(new URL('../scripts/booklet/run-workflow.mjs',import.meta.url));
const base=Date.parse('2026-09-17T00:00:00Z'),at=offset=>new Date(base+offset).toISOString();
const values=(input,cached,output)=>({input_tokens:input,cached_input_tokens:cached,output_tokens:output,reasoning_output_tokens:0,total_tokens:input+output});
function fixture(t,{pages=0}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-cli-handoff-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));let sequence=0;
 const write=(name,value,{bom=false}={})=>{const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,(bom?'\uFEFF':'')+(typeof value==='string'?value:JSON.stringify(value)));return file;};
 if(pages){
  write('manifest.json',{id:'cli-fixture',pipelinePolicy:PIPELINE_POLICY,selectedPages:Array.from({length:pages},(_,i)=>i+1)},{bom:true});
  for(let page=1;page<=pages;page++){
   const stem='page-'+String(page).padStart(3,'0');write('evidence/pages/'+stem+'.png','Synthetic original image fixture '+page);write('evidence/pages/'+stem+'.txt','SOURCE-CONTENT-NOT-ON-STDOUT '+page);
   write('semantic-packets/'+stem+'.inventory.json',{pageNumber:page,inventoried:true,layoutPatterns:[{id:'plain',description:'A source exercise'}],entries:[{id:'entry-'+page,kind:'question',targetId:'q'+page,description:'Find the value.'}]});
  }
 }
 const cli=(command,{args=[],input,output=false,bom=false,status=0}={})=>{
  const argv=[entry,command,'--run-dir',dir,...args];
  if(input!==undefined)argv.push('--input',write('input/'+command+'-'+(++sequence)+'.json',input,{bom}));
  const out=output?path.join(dir,'output',command+'-'+(++sequence)+'.json'):null;if(out)argv.push('--out',out);
  const result=spawnSync(process.execPath,argv,{cwd:repo,encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:2*1024*1024});
  assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,status,command+': '+result.stderr+'\n'+result.stdout);
  const printed=result.stdout.trim()?JSON.parse(result.stdout):null;
  return {...result,printed,full:out&&fs.existsSync(out)?JSON.parse(fs.readFileSync(out)):printed};
 };
 return {dir,write,cli};
}
const signed={reviewer:'CLI fixture reviewer',note:'Explicit synthetic review assertion; no production acceptance'};
const mathsResult=ticket=>({...signed,sourceCompared:true,mathematicsVerified:true,pages:[{page:ticket.job.context.page,key:ticket.job.context.key}]});
const lines=rows=>rows.map(row=>JSON.stringify(row)).join('\n')+'\n';
function rollout(id,usage){return [
 {timestamp:at(0),type:'session_meta',payload:{id,base_instructions:'SECRET-TRANSCRIPT-BODY'}},
 {timestamp:at(0),type:'event_msg',payload:{type:'task_started',turn_id:'turn-1'}},
 {timestamp:at(10),type:'response_item',payload:{type:'custom_tool_call',call_id:'tool-1',input:'SECRET-TOOL-BODY'}},
 {timestamp:at(40),type:'token_usage_record',payload:{response_id:id+'-response-1',turn_id:'turn-1',usage,thread_token_usage:usage}},
 {timestamp:at(100),type:'event_msg',payload:{type:'task_complete',turn_id:'turn-1'}},
 ];}

test('CLI next, prepare, record and cancel preserve bounded ownership through run-dir and BOM input',t=>{
 const f=fixture(t,{pages:2}),next=f.cli('next',{output:true});
 assert.equal(next.printed.jobs.count,2);assert.ok(next.full.jobs.every(job=>job.stage==='maths'));
 assert.doesNotMatch(next.stdout,/SOURCE-CONTENT-NOT-ON-STDOUT/);assert.equal(fs.existsSync(path.join(f.dir,'workflow/issues.json')),false);
 const prepared=f.cli('prepare-stage',{args:['--job',next.full.jobs[0].id],output:true});
 assert.equal(typeof prepared.printed.prompt.characters,'number');assert.doesNotMatch(prepared.stdout,/independent MathsMap|SOURCE-CONTENT-NOT-ON-STDOUT/);
 const ticket=JSON.parse(fs.readFileSync(prepared.full.ticket.path));assert.equal(ticket.job.ownershipIds.length,1);assert.equal(ticket.job.profile.freshContext,true);
 const duplicate=f.cli('prepare-stage',{args:['--job',next.full.jobs[0].id],status:1});assert.match(duplicate.stderr,/Owned by active ticket/);
 const recorded=f.cli('record-stage',{input:{ticket:prepared.full.ticket,result:mathsResult(ticket)},bom:true});assert.equal(recorded.printed.ok,true);
 assert.ok(loadWorkflow(f.dir).pages[ticket.job.context.page].mathReview);
 const remaining=f.cli('next',{output:true}).full;assert.equal(remaining.jobs.length,1);
 const second=f.cli('prepare-stage',{args:['--job',remaining.jobs[0].id],output:true}).full;
 const cancelled=f.cli('cancel-stage',{input:{ticket:second.ticket,reason:'Synthetic review interrupted before inspection'},bom:true});assert.equal(cancelled.printed.inspectionCredited,false);
 assert.equal(f.cli('next').printed.jobs.count,1);assert.deepEqual(loadWorkflow(f.dir).verification.stageClaims,{});
 assert.equal(fs.existsSync(path.join(f.dir,'semantic-packets/attempt-events.jsonl')),false);
});

test('CLI rejects stale review output, preserves the result and can release its ticket',t=>{
 const f=fixture(t,{pages:1}),next=f.cli('next',{output:true}).full,prepared=f.cli('prepare-stage',{args:['--job',next.next],output:true}).full;
 const ticket=JSON.parse(fs.readFileSync(prepared.ticket.path));f.write('evidence/pages/page-001.txt','Changed synthetic original source');
 const stale=f.cli('record-stage',{input:{ticket:prepared.ticket,result:mathsResult(ticket)},status:1});assert.match(stale.stderr,/stale/);
 assert.equal(loadWorkflow(f.dir).pages[1].mathReview,null);assert.ok(fs.readdirSync(path.dirname(prepared.ticket.path)).some(name=>name.startsWith('result-')));
 assert.equal(Object.keys(loadWorkflow(f.dir).verification.stageClaims).length,1);
 f.cli('cancel-stage',{input:{ticket:prepared.ticket,reason:'Refresh changed synthetic source'}});
 const refreshed=f.cli('next',{output:true}).full;assert.notEqual(refreshed.jobs[0].dependencyHash,prepared.job.dependencyHash);assert.equal(refreshed.jobs[0].blockers.length,0);
});

test('CLI accounting links live numeric usage and keeps compact output, waiting and weekly attribution honest',t=>{
 const f=fixture(t),coordinator=f.write('coordinator.jsonl',lines(rollout('coordinator',values(100,80,20)))),worker=f.write('worker.jsonl',lines(rollout('worker',values(50,30,10))));
 const metrics={sessionId:'worker',callId:'invocation-1',role:'transcription',usage:values(50,30,10),elapsedMs:100,toolCalls:1};
 f.write('semantic-packets/attempt-events.jsonl',lines([
  {attemptId:'attempt-1',event:'started',stage:'author',attempt:1,time:base,at:at(0)},
  {attemptId:'attempt-1',event:'phase-started',phase:'generation',time:base,at:at(0)},
  {attemptId:'attempt-1',event:'phase-finished',phase:'generation',time:base+100,at:at(100),elapsedMs:100,metrics},
  {attemptId:'attempt-1',event:'finished',time:base+100,at:at(100),ok:true},
 ]));
 const link={sessionId:'coordinator',stage:'coordination',role:'coordinator',rolloutPath:coordinator};
 f.cli('link-session',{input:link,bom:true});assert.equal(f.cli('link-session',{input:link}).printed.reused,true);
 f.cli('link-session',{input:{sessionId:'worker',stage:'author',role:'transcription',rolloutPath:worker}});
 f.cli('link-session',{input:{sessionId:'missing-review',stage:'maths',role:'review',rolloutPath:path.join(f.dir,'unavailable-review.jsonl')}});
 const window={resetAt:'2026-09-20T00:00:00Z',windowMinutes:10080,unrelatedConcurrentUsage:'unknown'};
 f.cli('weekly-usage',{input:{...window,id:'before',at:at(0),usedPercent:10},bom:true});f.cli('weekly-usage',{input:{...window,id:'after',at:at(200),usedPercent:18}});
 const pdf=f.write('short.pdf','Synthetic PDF artifact'),artifact={path:pdf,hash:createHash('sha256').update(fs.readFileSync(pdf)).digest('hex')};
 f.cli('export-observation',{input:{id:'short-1',edition:'short',reused:true,artifact,dependencyKey:'fixture-layout-dependency'}});
 const wait=f.cli('wait-start',{input:{reason:'Synthetic bundled editorial choice'},bom:true}).printed;
 f.cli('wait-end',{input:{id:wait.id},bom:true});
 const receipt=f.cli('receipt',{output:true});
 assert.equal(receipt.printed.completeJob.usage.input_tokens,150);assert.equal(receipt.printed.completeJob.deduplicatedRunnerInvocations,1);assert.equal(receipt.printed.completeJob.coverage.unavailableSessions,1);
 assert.equal(receipt.printed.completeJob.byRole.review.usage.input_tokens,null);assert.equal(receipt.printed.completeJob.toolCalls,2);assert.equal(receipt.printed.recordedActiveWallMs,100);assert.ok(receipt.printed.humanWaitingMs>0);
 assert.equal(receipt.printed.weeklyAllowance.observedChangePercentagePoints,8);assert.equal(receipt.printed.weeklyAllowance.attributedToRunPercentagePoints,null);assert.equal(receipt.printed.exportReuse.reused,1);
 assert.doesNotMatch(receipt.stdout,/SECRET-|rolloutPath/);assert.ok(receipt.full.completeJob.sessions.some(session=>session.rolloutPath===coordinator));
 f.cli('wait-end',{input:{id:wait.id}});assert.equal(f.cli('receipt').printed.humanWaitingMs,receipt.printed.humanWaitingMs);
 fs.appendFileSync(coordinator,lines([{timestamp:at(110),type:'token_usage_record',payload:{response_id:'coordinator-response-2',turn_id:'turn-2',usage:values(20,10,5)}}]));
 const refreshed=f.cli('receipt',{args:['--summary']});assert.equal(refreshed.printed.completeJob.usage.input_tokens,170);assert.doesNotMatch(refreshed.stdout,/SECRET-/);
});

test('CLI rejects missing handoff arguments and contradictory run locations before doing work',t=>{
 const f=fixture(t);
 assert.match(f.cli('prepare-stage',{status:1}).stderr,/requires --job/);
 assert.match(f.cli('record-stage',{status:1}).stderr,/requires --input/);
 assert.match(f.cli('wait-end',{input:{},status:1}).stderr,/wait-start id/);
 assert.match(f.cli('wait-end',{input:{id:'not-a-recorded-wait'},status:1}).stderr,/Human wait id/);
 assert.match(f.cli('next',{args:['--run-id','foreign-run'],status:1}).stderr,/either --run-id or --run-dir/);
 assert.equal(fs.existsSync(path.join(f.dir,'workflow/run-events.jsonl')),false);
});
