import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {REVIEW_DEFAULT,TRANSCRIPTION_DEFAULT,reviewConfiguration,requireCurrentReview} from '../scripts/booklet/transcription-settings.mjs';
import {runAstraTask} from '../scripts/booklet/codex-transcription.mjs';

function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-configuration-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function worker(events=[],capture=()=>{}){return (_binary,args)=>{
 capture(args);const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>child.emit('close',1);
 child.stdin=new Writable({write(_chunk,_encoding,done){done();}});
 child.stdin.on('finish',()=>setImmediate(()=>{fs.writeFileSync(args[args.indexOf('--output-last-message')+1],'{"ok":true}');for(const event of events)child.stdout.write(JSON.stringify(event)+'\n');child.emit('close',0);}));return child;
};}

test('review defaults and explicitly recorded fallback reject implicit migration',()=>{
 assert.deepEqual(REVIEW_DEFAULT,{provider:'codex',model:'gpt-6.1-terra',effort:'high'});
 assert.deepEqual(reviewConfiguration(),REVIEW_DEFAULT);
 const historical={...TRANSCRIPTION_DEFAULT},before=structuredClone(historical);
 assert.throws(()=>reviewConfiguration(historical),/not silently migrated/);assert.deepEqual(historical,before);
 for(const reviewFallback of [{},{model:'gpt-6.1-sol',effort:'low',reason:''},{model:'gpt-6.1-sol',effort:'medium',reason:'Explicit choice'}])assert.throws(()=>reviewConfiguration({reviewFallback}),/recorded reason/);
 const fallback=reviewConfiguration({reviewFallback:{model:'gpt-6.1-sol',effort:'low',reason:'Explicit user fallback'}});
 assert.equal(requireCurrentReview(fallback),fallback);assert.equal(fallback.effort,'low');
 assert.throws(()=>requireCurrentReview({}),/explicitly record/);
});

test('Terra review borrows historical run pool without rewriting its manifest',async t=>{
 const dir=fixture(t),file=path.join(dir,'manifest.json'),original=JSON.stringify({provider:'codex',model:'gpt-6-sol',effort:'high',pins:{model:'historical-pin'}});fs.writeFileSync(file,original);
 let args;const reply=await runAstraTask({cwd:dir,prompt:'Fixed evidence',out:path.join(dir,'review')},{spawnProcess:worker([{model:'gpt-6.1-terra',reasoning_effort:'high'}],value=>args=value)});
 assert.equal(args[args.indexOf('--model')+1],'gpt-6.1-terra');assert.ok(args.includes('model_reasoning_effort="high"'));
 assert.equal(reply.metrics.requestedModel,'gpt-6.1-terra');assert.equal(reply.metrics.observedModel,'gpt-6.1-terra');assert.equal(reply.metrics.requestedEffort,'high');assert.equal(reply.metrics.observedEffort,'high');assert.equal(fs.readFileSync(file,'utf8'),original);
 await assert.rejects(()=>runAstraTask({cwd:dir,prompt:'Fixed',out:path.join(dir,'rejected'),configuration:TRANSCRIPTION_DEFAULT},{spawnProcess:()=>assert.fail('Historical review must not dispatch')}),/not silently migrated/);
 assert.equal(fs.existsSync(path.join(dir,'rejected')),false);
});

test('fallback is deliberate and missing worker identity stays unavailable',async t=>{
 const dir=fixture(t),configuration=reviewConfiguration({reviewFallback:{model:'gpt-6.1-sol',effort:'low',reason:'Named user choice'}});let args;
 const reply=await runAstraTask({cwd:dir,prompt:'Fixed',out:path.join(dir,'fallback'),configuration},{spawnProcess:worker([],value=>args=value)});
 assert.equal(args[args.indexOf('--model')+1],'gpt-6.1-sol');assert.ok(args.includes('model_reasoning_effort="low"'));assert.equal(reply.metrics.reviewFallback.reason,'Named user choice');assert.equal(reply.metrics.observedModel,null);assert.equal(reply.metrics.observedEffort,null);
});

test('reported model or effort substitutions fail once with retained metrics',async t=>{
 const dir=fixture(t);for(const [index,event]of [{model:'gpt-6.1-sol'},{reasoning_effort:'low'}].entries()){
  let calls=0;await assert.rejects(()=>runAstraTask({cwd:dir,prompt:'Fixed',out:path.join(dir,String(index))},{spawnProcess:worker([event],()=>calls++)}),error=>{assert.match(error.message,/no .*substitution/);assert.equal(error.metrics.requestedEffort,'high');return true;});assert.equal(calls,1);
 }
});

test('existing skill-content review stages retain explicit campaign configuration',async t=>{
 const dir=fixture(t);for(const stage of ['content-review','content-bounded-independent']){
  let args;const reply=await runAstraTask({cwd:dir,prompt:'Campaign evidence',out:path.join(dir,stage),stage,configuration:TRANSCRIPTION_DEFAULT},{spawnProcess:worker([],value=>args=value)});
  assert.equal(args[args.indexOf('--model')+1],'gpt-6.1-sol');assert.equal(reply.metrics.effort,'medium');assert.equal(reply.metrics.executionProfile,'transcription');assert.equal(reply.metrics.profile,'review');
 }
});
