import test from 'node:test';
import assert from 'node:assert/strict';
import {ARMS,SAMPLES,commandArgs,classifyFailure,schedule,dependencies,selectBenchmarkArms} from '../scripts/booklet/benchmark-models.mjs';

test('paired rerun selects only requested settings and rejects substitutions',()=>{
 assert.deepEqual(selectBenchmarkArms(['astra-low','sol-xhigh']).map(a=>[a.model,a.effort]),[['gpt-6-astra','low'],['gpt-6-sol','xhigh']]);
 assert.throws(()=>selectBenchmarkArms(['sol-high']),/supported/);
 assert.throws(()=>selectBenchmarkArms(['astra-low','astra-low']),/distinct/);
});

test('four exact arms and corrected teaching context',()=>{
 assert.deepEqual(ARMS.map(a=>[a.model,a.effort]),[['gpt-6-astra','low'],['gpt-6-astra','high'],['gpt-6-sol','xhigh'],['gpt-6-luna','max']]);
 assert.equal(SAMPLES.length*ARMS.length*2,80);assert.deepEqual(SAMPLES[3].teachingPages,[10,16]);
});
test('fresh read-only Standard CLI configuration',()=>{
 const args=commandArgs(ARMS[0],'C:/trial',['C:/image.png'],'C:/raw.txt');
 for(const flag of ['--ephemeral','--ignore-user-config','read-only','service_tier="default"','features.fast_mode=false'])assert.ok(args.includes(flag));
 assert.equal(args.at(-1),'-');assert.equal(args[args.indexOf('--model')+1],'gpt-6-astra');
});
test('failure classification stops unsupported and authentication cases',()=>{
 assert.equal(classifyFailure('The model gpt-6-sol is not supported'),'unsupported-model');
 assert.equal(classifyFailure('reasoning effort xhigh is unsupported'),'unsupported-model');
 assert.equal(classifyFailure('401 Unauthorized'),'environment');assert.equal(classifyFailure('spawn codex ENOENT'),'environment');
 assert.equal(classifyFailure('invalid JSON'),'call-failure');assert.equal(classifyFailure(''),null);
});
test('scheduler rotates fourth arm into next slot and never overlaps same arm',async()=>{
 let active=0,max=0;const busy=new Set(),calls=[],counts=new Map();
 await schedule(ARMS,async arm=>{assert.ok(!busy.has(arm.id));busy.add(arm.id);active++;max=Math.max(max,active);calls.push(arm.id);
  await new Promise(r=>setTimeout(r,3));busy.delete(arm.id);active--;const n=(counts.get(arm.id)??0)+1;counts.set(arm.id,n);return n<4;
 });assert.equal(max,3);assert.deepEqual(calls.slice(0,4),ARMS.map(a=>a.id));assert.equal(calls.length,16);
});
test('scheduler drains active calls after fatal failure and stops dispatch',async()=>{
 let finished=0,calls=0;await assert.rejects(schedule(ARMS,async arm=>{calls++;if(arm.id==='astra-low')throw Error('frozen source changed');await new Promise(r=>setTimeout(r,4));finished++;return true;}),/frozen source changed/);
 assert.equal(calls,3);assert.equal(finished,2);
});
test('implementation dependency graph pins prompt and project materialization helpers',()=>{
 const graph=[...dependencies(new URL('../scripts/booklet/benchmark-models.mjs',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'))];
 assert.ok(graph.some(f=>f.endsWith('token-efficient-prompts.mjs')));assert.ok(graph.some(f=>f.endsWith('booklet-source-content.js')));
});
