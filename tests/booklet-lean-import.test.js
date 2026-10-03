import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {encodeImportContext,decodeImportContext,compactImportPrompt,IMPORT_PROMPT_PROFILE} from '../scripts/booklet/import-prompt-codec.mjs';
import {validateNativeTemplates,expandNativeTemplates} from '../scripts/booklet/import-native-templates.mjs';
import {createLeanImportRunner} from '../scripts/booklet/lean-import-runner.mjs';
import {runLeanImportPool} from '../scripts/booklet/lean-import.mjs';
import {snapshotDifferences,prepareVerificationSnapshot,exportWithFrozenRuntime,startFrozenVerificationServer} from '../scripts/booklet/import-verification-runtime.mjs';
import {reviewSemanticScope} from '../scripts/booklet/import-review-scope.mjs';
import {retainUnchangedImportReviews} from '../scripts/booklet/import-review-retention.mjs';
import {nextBoundedWork,prepareBoundedStage,cancelBoundedStage,recordBoundedStage} from '../scripts/booklet/bounded-stages.mjs';
import {loadWorkflow,updateWorkflow,bytesHash,fingerprint} from '../scripts/booklet/workflow-review.mjs';
import {PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-booklet-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const write=(dir,name,value)=>{const f=path.join(dir,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof value==='string'?value:JSON.stringify(value));return f;};
const ref=f=>({path:f,hash:bytesHash(f)});
test('context compression reconstructs all native values, source guards and repair pointers exactly',()=>{
 const shared={id:'nested',latex:'\\frac{3}{4}',audit:'source image/answer/context '.repeat(300)};
 const value={context:{questions:[shared,structuredClone(shared)],corrections:[{corrected:shared,correctedValueRef:'/context/questions/0'}]},literal:[{$importRef:2},{$importLiteral:[['x',4]]},'a'],source:'C:\\source\\p.png'};
 const encoded=encodeImportContext(value);assert.deepEqual(decodeImportContext(encoded),value);assert.ok(encoded.sharedValues.length);assert.ok(JSON.stringify(encoded).length<JSON.stringify(value).length);
 const prompt='Canonical contract.\n\n'+JSON.stringify(value),compact=compactImportPrompt(prompt);assert.ok(compact.deliveredCharacters<prompt.length);assert.equal(compactImportPrompt('No trailing JSON').prompt,'No trailing JSON');
 assert.equal(compactImportPrompt('Contract\n\n{"id":"small"}').sharedValues,0);
 assert.throws(()=>decodeImportContext({format:IMPORT_PROMPT_PROFILE,sharedValues:[{$importRef:0}],context:{$importRef:0}}),/cyclic/);
 assert.throws(()=>decodeImportContext({format:IMPORT_PROMPT_PROFILE,sharedValues:[],context:{$importRef:10}}),/Invalid/);
});
test('native template expansion demands explicit IDs, answers and every declared slot',()=>{
 const catalog={format:'mathsmap-native-author-templates-v1',templates:[{id:'paragraph',note:'Existing native paragraph structure.',body:{id:'',type:'paragraph',inlines:[]},slots:['/id','/inlines']}]};
 const result={packets:[{prompt:{$nativeTemplate:'paragraph',values:{'/id':'q-a','/inlines':[{type:'math',latex:'\\frac{1}{2}'}]}}}]};
 assert.deepEqual(expandNativeTemplates(result,catalog).packets[0].prompt,{id:'q-a',type:'paragraph',inlines:[{type:'math',latex:'\\frac{1}{2}'}]});
 assert.throws(()=>expandNativeTemplates({$nativeTemplate:'paragraph',values:{'/id':'q'}},catalog),/every/);
 assert.throws(()=>validateNativeTemplates({...catalog,templates:[{...catalog.templates[0],slots:['/inlines','/inlines/0']}]}),/Overlapping/);
});
test('lean runner preserves provider accounting and binds the complete delivered prompt',async t=>{
 const dir=temp(t),out=path.join(dir,'codex'),payload={rows:Array(8).fill({code:'unchanged'.repeat(80)})};
 let delivered;const runner=createLeanImportRunner({execute:async p=>{delivered=p;return {result:{packets:[]},metrics:{model:'gpt-6.1-sol',effort:'medium',usage:{input_tokens:1}}};}});
 const reply=await runner({out,prompt:'Canonical contract\n\n'+JSON.stringify(payload),profile:'transcription',images:[]});
 assert.equal(reply.metrics.model,'gpt-6.1-sol');assert.deepEqual(reply.metrics.usage,{input_tokens:1});assert.ok(delivered.prompt.length<reply.metrics.importDelivery.canonicalCharacters);assert.ok(fs.existsSync(path.join(dir,'lean-delivery.json')));
});

test('author recipe validation failures retain actual worker usage',async t=>{
 const dir=temp(t),templatesFile=write(dir,'templates.json',{format:'mathsmap-native-author-templates-v1',templates:[{id:'p',note:'Explicit paragraph',body:{id:''},slots:['/id']}]}),runner=createLeanImportRunner({templatesFile,execute:async()=>({result:{$nativeTemplate:'p',values:{}},metrics:{usage:{input_tokens:71,output_tokens:19}}})});
 await assert.rejects(runner({out:path.join(dir,'codex'),prompt:'Author fixture',profile:'transcription'}),error=>{assert.equal(error.metrics.usage.output_tokens,19);assert.ok(error.metrics.importDelivery.deliveredPromptHash);return /every/.test(error.message);});
});
test('pool refills a free slot before a slow batch finishes and never exceeds three workers',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run-a')},{runDir:path.join(dir,'run-b')}],done=new Set(),started=[],finished=[];let active=0,maximum=0;
 const next=async o=>({active:[],blockers:[],jobs:Array.from({length:3},(_,i)=>({id:path.basename(o.runDir)+i,stage:'visual',visualConcurrency:3,ownershipIds:['render:'+i],done:done.has(path.basename(o.runDir)+i),blockers:[]}))});
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),next,lease:async(_d,_i,action)=>action(),run:async(_o,id)=>{started.push(id);maximum=Math.max(maximum,++active);await new Promise(r=>setTimeout(r,id==='run-a0'?80:8));active--;done.add(id);finished.push(id);return {ok:true};}});
 assert.equal(result.completed,6);assert.equal(maximum,3);assert.ok(started.indexOf('run-b0')>=0);assert.ok(finished.indexOf('run-b0')<finished.indexOf('run-a0'));
});
test('pool drains successful work and preserves failures without automatic retries',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run')}],done=new Set();let calls=0;
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),next:async()=>({active:[],jobs:[0,1,2,3].map(i=>({id:'j'+i,stage:'visual',visualConcurrency:3,blockers:[],done:done.has('j'+i)}))}),lease:async(_d,_i,a)=>a(),recover:async()=>({}),run:async(_o,id)=>{calls++;await new Promise(r=>setTimeout(r,id==='j0'?2:15));if(id==='j0')throw Error('Retained failure');done.add(id);return {ok:true};}});
 assert.equal(result.status,'needs-repair');assert.equal(calls,3);assert.equal(result.completed,2);assert.ok(fs.readFileSync(result.eventsFile,'utf8').includes('Retained failure'));
});

test('active-time checkpoints run while a worker is still awaiting its result',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run')}];let done=false,checkedDuringWork=false;
 const result=await runLeanImportPool(runs,{poolDir:path.join(dir,'pool'),checkpointIntervalMs:5,checkpoint:async()=>{if(!done)checkedDuringWork=true;},next:async()=>({active:[],jobs:[{id:'slow',stage:'assessment',done,blockers:[]}]}),lease:async(_d,_i,a)=>a(),run:async()=>{await new Promise(r=>setTimeout(r,25));done=true;return {ok:true};}});
 assert.equal(result.completed,1);assert.equal(checkedDuringWork,true);
});
test('pool refuses existing source workers and unresolved stage claims',async t=>{
 const dir=temp(t),runDir=path.join(dir,'run');write(runDir,'workflow/worker-slots/0.json',{pid:123});
 await assert.rejects(runLeanImportPool([{runDir}],{poolDir:path.join(dir,'pool'),next:async()=>({active:[],jobs:[]})}),/existing source worker/);
 await assert.rejects(runLeanImportPool([{runDir:path.join(dir,'other')}],{poolDir:path.join(dir,'pool'),next:async()=>({active:[{id:'held',blockedResult:true}],jobs:[]})}),/reconcile existing owner/);
});

test('restart requires diagnosis before a third unchanged failure and planning errors drain active jobs',async t=>{
 const dir=temp(t),runs=[{runDir:path.join(dir,'run')}],poolDir=path.join(dir,'pool');let calls=0;
 const options={poolDir,next:async()=>({active:[],jobs:[{id:'j',dependencyHash:'fixed',stage:'assessment',blockers:[],done:false}]}),lease:async(_d,_i,a)=>a(),recover:async()=>({}),run:async()=>{calls++;throw Error('Same failure');}};
 await runLeanImportPool(runs,options);await runLeanImportPool(runs,options);
 const held=await runLeanImportPool(runs,options);assert.equal(held.dispatched,0);assert.equal(held.ok,false);assert.equal(calls,2);
 await runLeanImportPool(runs,{...options,retryDiagnosis:'Input format corrected and checked.'});assert.equal(calls,3);
 let active=0,plans=0;
 await assert.rejects(runLeanImportPool(runs,{poolDir:path.join(dir,'other-pool'),next:async()=>{if(++plans>2)throw Error('Planning failed');return {active:[],jobs:[{id:'waiting',stage:'assessment',blockers:[]}]};},lease:async(_d,_i,a)=>a(),run:async()=>{active++;await new Promise(r=>setTimeout(r,20));active--;return {ok:true};}}),/Planning failed/);assert.equal(active,0);
});
test('verification snapshot captures uncommitted bytes and reports exact changed files',t=>{
 const root=temp(t);write(root,'src/main.js','uncommitted source');write(root,'index.html','<html>');write(root,'node_modules/fixture.js','dependency');
 const out=path.join(root,'.booklet-work/test'),manifest=prepareVerificationSnapshot({root,out});assert.equal(fs.readFileSync(path.join(manifest.snapshot,'src/main.js'),'utf8'),'uncommitted source');assert.deepEqual(snapshotDifferences(root,manifest.files),[]);
 assert.equal(prepareVerificationSnapshot({root,out}).snapshot,manifest.snapshot);write(root,'src/main.js','changed');assert.deepEqual(snapshotDifferences(root,manifest.files),['src/main.js']);assert.throws(()=>prepareVerificationSnapshot({root,out}),/src\/main.js/);
 assert.throws(()=>prepareVerificationSnapshot({root,out:path.join(root,'src/bad')}),/separate local/);
 write(root,'src/new.js','new dependency');assert.deepEqual(snapshotDifferences(root,manifest.files),['src/main.js','src/new.js']);
});

test('actual frozen Vite server isolates plugin cwd, watching and live source changes',async t=>{
 const parent=path.resolve('.booklet-work/lean-import-implementation');fs.mkdirSync(parent,{recursive:true});const root=fs.mkdtempSync(path.join(parent,'server-fixture-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 write(root,'index.html','<html><body>Frozen fixture</body></html>');write(root,'vite.config.js','export default {}');
 fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),process.platform==='win32'?'junction':'dir');
 const out=path.join(root,'.booklet-work/server'),manifest=prepareVerificationSnapshot({root,out}),server=await startFrozenVerificationServer(manifest,out);
 try{assert.equal(server.info.cwd,manifest.snapshot);assert.equal(server.info.watch,null);assert.equal(server.info.hmr,false);write(root,'index.html','<html><body>Changed live fixture</body></html>');const response=await fetch('http://127.0.0.1:'+server.info.port);assert.equal(response.status,200);const html=await response.text();assert.match(html,/Frozen fixture/);assert.doesNotMatch(html,/Changed live fixture/);}finally{await server.close();}
});
test('frozen exports close their server, retain failed editions and diagnose before a third attempt',async t=>{
 const root=temp(t);write(root,'src/main.js','stable');write(root,'vite.config.js','export default {}');write(root,'node_modules/fixture.js','dependency');write(root,'booklets/projects/book.json',{id:'book'});
 const out=path.join(root,'.booklet-work/exports');let closes=0,calls=0;
 const server=()=>({listen:async()=>{},httpServer:{address:()=>({port:9000})},close:async()=>{closes++;}});
 const args={root,out,projectId:'book',runDir:path.join(root,'.booklet-work/run'),createServer:async()=>server(),execute:async({args})=>{calls++;assert.ok(args.includes('--fresh-edition-document'));write(out,'passed-student.pdf','retained PDF bytes');return 1;}};
 await assert.rejects(exportWithFrozenRuntime(args),/Export failed/);await assert.rejects(exportWithFrozenRuntime(args),/Export failed/);assert.equal(calls,2);assert.equal(closes,2);assert.equal(fs.readFileSync(path.join(out,'passed-student.pdf'),'utf8'),'retained PDF bytes');
 await assert.rejects(exportWithFrozenRuntime(args),/third attempt/);assert.equal(calls,2);
 const receipt=await exportWithFrozenRuntime({...args,regenerationReason:'Isolated missing-document cause; fresh document path fixed.',execute:async()=>0});assert.equal(receipt.visualAcceptance,false);assert.equal(closes,3);
});
test('semantic retention keeps layout independent but binds every answer, method, source response and classification',()=>{
 const q={id:'q',sourceRefs:[{pageNumber:1}],classification:{primarySkillId:'fractions'},sourceReview:{responses:[{kind:'working'}],teachingContext:{method:'common denominator'}},content:{prompt:'Simplify',widthMm:70,answer:{short:'1/2',worked:'Divide both by 3'}}};
 assert.deepEqual(reviewSemanticScope(q),reviewSemanticScope({...q,content:{...q.content,widthMm:60}}));
 for(const changed of [{...q,classification:{primarySkillId:'decimals'}},{...q,sourceReview:{...q.sourceReview,responses:[{kind:'draw'}]}},{...q,content:{...q.content,answer:{short:'2/3',worked:'Divide'}}}])assert.notDeepEqual(reviewSemanticScope(q),reviewSemanticScope(changed));
});
function sourceFixture(t){
 const dir=temp(t);write(dir,'manifest.json',{id:'fixture',pipelinePolicy:PIPELINE_POLICY,reviewProfile:'textbook-three-pass-v1',selectedPages:[1]});
 write(dir,'evidence/pages/page-001.png','source pixels fixture');write(dir,'evidence/pages/page-001.txt','Source methods and question.');write(dir,'semantic-packets/page-001.inventory.json',{pageNumber:1,inventoried:true,entries:[{id:'entry-q',kind:'question',targetId:'q',description:'Compute'}],layoutPatterns:[]});
 const book={id:'fixture',reviewProfile:'textbook-three-pass-v1',settings:{},sections:[{id:'teach',topicId:'fractions',phase:'teaching',blocks:[{id:'method',type:'callout',sourceRefs:[{pageNumber:1}],content:'Divide numerator and denominator by their common factor.'}]},{id:'practice',topicId:'fractions',phase:'practice',blocks:[{id:'q',type:'question',sourceRefs:[{pageNumber:1}],classification:{primarySkillId:'simplify-fractions'},content:{id:'q-root',prompt:'Simplify 3/6.',answer:{short:'1/2',worked:'Divide both by 3.'}}}]}]};
 const projectFile=write(dir,'project.json',book),options={runDir:dir,projectFile};return {dir,book,options,projectFile};
}
test('lean delivery is opt-in, immutable per ticket, and preserves the original canonical context',async t=>{
 const f=sourceFixture(t),before=await nextBoundedWork(f.options),lean=await nextBoundedWork({...f.options,promptProfile:IMPORT_PROMPT_PROFILE});
 const ordinary=before.jobs.find(j=>j.stage==='assessment'),job=lean.jobs.find(j=>j.stage==='assessment');assert.equal(ordinary.promptProfile,undefined);assert.equal(job.promptProfile,IMPORT_PROMPT_PROFILE);assert.notEqual(job.dependencyHash,ordinary.dependencyHash);
 const prepared=await prepareBoundedStage({...f.options,promptProfile:IMPORT_PROMPT_PROFILE},job.id),ticket=JSON.parse(fs.readFileSync(prepared.ticket.path));assert.equal(ticket.job.promptProfile,IMPORT_PROMPT_PROFILE);assert.deepEqual(ticket.job.context.questions[0].content,f.book.sections[0].blocks[0].content);
 await assert.rejects(cancelBoundedStage({...f.options,promptProfile:'other'},{ticket:prepared.ticket,reason:'fixture'}),/profile/);
 await cancelBoundedStage(f.options,{ticket:prepared.ticket,reason:'Fixture only, no review credit'});
});
test('batch retention uses an actual hash-bound content result and refuses changed answers or historical guesses',async t=>{
 const f=sourceFixture(t),options={...f.options,promptProfile:IMPORT_PROMPT_PROFILE},plan=await nextBoundedWork(options),job=plan.jobs.find(j=>j.stage==='assessment');
 const prepared=await prepareBoundedStage(options,job.id),ticket=JSON.parse(fs.readFileSync(prepared.ticket.path));
 const result={reviewer:'Independent fixture reviewer',note:'Explicit fixture review; never production credit.',records:job.ownershipIds.map(id=>({id,outcome:'passed',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true}}))};
 await recordBoundedStage(options,{ticket:prepared.ticket,result});
 const first=loadWorkflow(f.dir).verification.entries['question:q'];assert.equal(first.retentionBinding.ticket.hash,prepared.ticket.hash);
 await updateWorkflow(f.dir,'fixture old dependency version',state=>{state.verification.entries['question:q'].dependencies.question='old-layout-inclusive-key';});
 f.book.sections[1].blocks[0].content.widthMm=60;write(f.dir,'project.json',f.book);
 const receipt=await retainUnchangedImportReviews(f.options);assert.ok(receipt.retained.includes('question:q'));assert.equal(receipt.externalModelCalls,0);
 const retained=loadWorkflow(f.dir).verification.entries['question:q'];assert.notEqual(retained.dependencies.question,'old-layout-inclusive-key');assert.ok(retained.artifacts.every(a=>bytesHash(a.path)===a.hash));
 f.book.sections[1].blocks[0].content.answer.short='2/3';write(f.dir,'project.json',f.book);
 const changed=await retainUnchangedImportReviews(f.options);assert.ok(changed.requiresReview.some(r=>r.id==='question:q'&&/scope changed/.test(r.reason)));assert.deepEqual(changed.retained,[]);
});
