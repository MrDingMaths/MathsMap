import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {workerAuthorizationContext,withWorkerAuthorizationContext} from '../scripts/booklet/worker-authorization-context.mjs';
import {runAstraTask,astraCommandArgs} from '../scripts/booklet/codex-transcription.mjs';
const scope=()=>({destination:{provider:'openai',model:'gpt-6.1-terra',effort:'high'},payload:{sourceIds:['source-a','source-b']},purpose:'Review the two specified source questions',attachments:['source.png'],permittedActions:['review'],dataCategories:['questions','answers','diagram-code'],excludedData:['credentials','real-student-information','unrelated-personal-data']});
const envelope=()=>({scope:scope(),originalDisclosure:{messageId:'disclosure-fixture',text:'May I send these two sources and source.png to OpenAI Terra High for review?'},originalApproval:{messageId:'approval-fixture',text:'Yes. Review only; do not change the booklet.'}});
test('requires actual caller-supplied disclosure and approval; legacy un-enveloped calls are unchanged',()=>{
 assert.equal(withWorkerAuthorizationContext('Task'),'Task');
 for(const key of ['originalApproval','originalDisclosure']){const e=envelope();delete e[key];assert.throws(()=>workerAuthorizationContext(e,scope()),/authorization/i);}
 assert.throws(()=>withWorkerAuthorizationContext('Task',{authorizationScope:scope()}),/authorization/i);
 const e=envelope();e.originalApproval.text=' ';assert.throws(()=>workerAuthorizationContext(e,scope()),/originalApproval.text/);
});
test('rejects mismatched destination, bounded sources, actions and attachments',()=>{
 for(const change of [s=>s.destination.model='other',s=>s.payload.sourceIds.push('unapproved'),s=>s.permittedActions.push('save'),s=>s.attachments.push('extra.png')]){const e=envelope();change(e.scope);assert.throws(()=>workerAuthorizationContext(e,scope()),/do not match/);}
 const e=envelope();e.scope.payload={};assert.throws(()=>workerAuthorizationContext(e,scope()),/bounded payload/);
});
test('requires sensitive-data exclusions and rejects declared sensitive inclusions or unknown fields',()=>{
 const e=envelope();e.scope.excludedData.pop();assert.throws(()=>workerAuthorizationContext(e,scope()),/must exclude/);
 for(const category of ['credentials','real-student-information','unrelated-personal-data']){const e=envelope();e.scope.dataCategories.push(category);assert.throws(()=>workerAuthorizationContext(e,scope()),/sensitive data/);}
 const unexpected=envelope();unexpected.credentials='not-a-real-secret';assert.throws(()=>workerAuthorizationContext(unexpected,scope()),/fields/);
});
test('retains verbatim context and task; normalizes sets without mutating inputs; supports hash-bound manifests',()=>{
 const e=envelope(),before=structuredClone(e),s=scope();s.payload.sourceIds.reverse();s.dataCategories.reverse();
 const result=withWorkerAuthorizationContext('Bounded task text',{authorizationContext:e,authorizationScope:s});
 for(const text of [e.originalDisclosure.text,e.originalApproval.text,e.originalDisclosure.messageId,e.originalApproval.messageId,'Bounded task text'])assert(result.includes(text));
 assert.deepEqual(e,before);assert(result.includes('not a grant'));
 const m=envelope();m.scope.payload={manifest:{path:'packet.json',sha256:'a'.repeat(64)}};assert(workerAuthorizationContext(m,m.scope).includes('packet.json'));
 const wrong=structuredClone(m.scope);wrong.payload.manifest.sha256='b'.repeat(64);assert.throws(()=>workerAuthorizationContext(m,wrong),/do not match/);
});
test('runner refuses missing context or actual image/model mismatch before process launch',async()=>{
 let spawns=0;const execution={spawnProcess:()=>{spawns++;throw Error('Unexpected live launch');}};
 const opts={cwd:'.',prompt:'Task',out:'unused-test-output',authorizationContext:envelope(),authorizationScope:scope()};
 await assert.rejects(runAstraTask({...opts,authorizationContext:undefined},execution),/authorization/i);
 await assert.rejects(runAstraTask({...opts,images:[]},execution),/actual worker images/);
 const s=scope();s.destination.model='other';const e=envelope();e.scope=s;
 await assert.rejects(runAstraTask({...opts,images:['source.png'],authorizationContext:e,authorizationScope:s},execution),/actual Codex worker/);
 assert.equal(spawns,0);
 const args=astraCommandArgs({cwd:'.',images:[],raw:'out.json',profile:'review'});assert(!args.some(x=>x.includes('approval-fixture')||x.includes('disclosure-fixture')));assert(args.includes('--ignore-user-config'));assert(args.includes('read-only'));
});
test('valid runner passes original context through stdin only, using a fake process',async()=>{
 const parent=path.resolve('.booklet-work');fs.mkdirSync(parent,{recursive:true});const dir=fs.mkdtempSync(path.join(parent,'auth-context-test-'));let input,args;
 try{
  const spawnProcess=(_bin,argv)=>{args=argv;const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.stdin=new EventEmitter();child.kill=()=>{};child.stdin.end=value=>{input=value;fs.writeFileSync(argv[argv.indexOf('--output-last-message')+1],JSON.stringify({ok:true}));queueMicrotask(()=>child.emit('close',0));};return child;};
  const e=envelope(),result=await runAstraTask({cwd:dir,prompt:'Review this bounded task',images:['source.png'],out:path.join(dir,'out'),authorizationContext:e,authorizationScope:scope()},{spawnProcess});
  assert.deepEqual(result.result,{ok:true});assert(input.includes(e.originalApproval.text));assert(input.includes(e.originalDisclosure.text));assert(input.includes('Review this bounded task'));assert(!args.some(x=>x.includes(e.originalApproval.text)||x.includes(e.originalDisclosure.text)));
 }finally{assert.equal(path.dirname(dir),parent);fs.rmSync(dir,{recursive:true,force:true});}
});
