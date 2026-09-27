import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {recordInventoryReuse,inventoryReuseInfo,generationPublicationGuard} from '../scripts/booklet/inventory-reuse.mjs';
import {createSemanticTasks,semanticCacheInfo} from '../scripts/booklet/semantic-workflow.mjs';
import {dependencyStatus,drainDependencies} from '../scripts/booklet/dependency-runner.mjs';
import {registerInventory,recordMathReview,sourceEvidence,liveWorkflow,fingerprint,bytesHash} from '../scripts/booklet/workflow-review.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {withRunLock} from '../scripts/booklet/run-observability.mjs';
import {main} from '../scripts/booklet/run-workflow.mjs';
import {driveBoundedWorkflow} from '../scripts/booklet/workflow-controller.mjs';

const ref=file=>({path:file,hash:bytesHash(file)});
const digest=value=>createHash('sha256').update(value).digest('hex');
function fixture(t,{pipeline=false}={}){
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'inventory-reuse-'));
 t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(runDir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 const read=name=>JSON.parse(fs.readFileSync(path.join(runDir,name),'utf8'));
 const pins={};
 for(const name of ['source/booklet.pdf','evidence/pages/page-001.png','evidence/pages/page-001.txt','evidence/pages/page-002.png','evidence/pages/page-002.txt','evidence/pages/page-003.png','evidence/pages/page-003.txt','evidence/teacher/pages/page-008.png','evidence/teacher/pages/page-008.txt'])pins[name]=bytesHash(write(name,'Synthetic '+name));
 const manifest={...TRANSCRIPTION_DEFAULT,selectedPages:[1],teacherPages:[8],workflowPolicy:'review-first-v1',...(pipeline?{pipelinePolicy:'pdf-import-efficient-v1'}:{}),pins:{runFiles:pins}};
 write('manifest.json',manifest);
 const config={title:'Synthetic',workflowPolicy:'review-first-v1',contentScope:'all',topics:[{id:'algebra',title:'Algebra',start:1,end:1,teachingPages:[2],teacherPages:[8]}]};
 const inventoryConfigFile=write('inventory-config.json',config),configFile=write('author-config.json',config);
 const options={runDir,manifest,config,configFile,inventoryConfigFile,pages:[1],selectedPages:[1]};
 const task=createSemanticTasks({...options,stage:'inventory'})[0];
 const historicalImplementations={runner:ref(write('history/runner.mjs','Historical runner')),workerPool:ref(write('history/pool.mjs','Historical pool')),assignments:ref(write('history/assignments.mjs','Historical assignments'))};
 const oldExecution=fingerprint([['codex-transcription.mjs',historicalImplementations.runner.hash],['worker-pool.mjs',historicalImplementations.workerPool.hash]]);
 const originalInputHash=fingerprint({version:2,stage:'inventory',page:1,configuration:TRANSCRIPTION_DEFAULT,executionHash:oldExecution,
  teacherHashes:[[8,pins['evidence/teacher/pages/page-008.png'],pins['evidence/teacher/pages/page-008.txt']]],prompt:task.prompt,
  images:task.images.map(file=>[file,bytesHash(file)]),teachingImages:[pins['evidence/pages/page-002.png']],wordHash:null,
  ...(pipeline?{pipelinePolicy:manifest.pipelinePolicy,assignmentImplementation:historicalImplementations.assignments.hash}:{})});
 const inventory={pageNumber:1,inventoried:true,layoutPatterns:[{id:'plain',description:'Plain question'}],entries:[{id:'p1-q',targetId:'q1',kind:'question',description:'Solve x+1=2',expectedAnswer:'1'}]};
 const prefix='semantic-packets/page-001.inventory.2/';
 write(prefix+'prompt.md',task.prompt);write(prefix+'config.json',config);write(prefix+'task-input.json',{inputHash:originalInputHash});
 const result=write(prefix+'result.json',inventory);write('semantic-packets/page-001.inventory.json',inventory);
 write(prefix+'result.meta.json',{...TRANSCRIPTION_DEFAULT,version:2,page:1,stage:'inventory',inputHash:originalInputHash,resultHash:bytesHash(result),metrics:{usage:{input_tokens:321,output_tokens:123},serviceTier:'default'}});
 const mathArtifact=write('math-review.md','Actual synthetic test review evidence');
 const state={version:1,revision:1,pages:{},issues:{},corrections:[],representatives:{},settled:null,finalReview:null};
 registerInventory(state,inventory,sourceEvidence(runDir,1));
 recordMathReview(state,{reviewer:'Synthetic reviewer',note:'Synthetic arithmetic reviewed',artifacts:[ref(mathArtifact)],pages:[{page:1,key:state.pages[1].inventoryHash}]});
 if(pipeline)state.verification={representativePlan:{representativePages:[1],patterns:[{id:'plain',representativePage:1}],coverage:[],inventoryKeys:{1:state.pages[1].inventoryHash}}};
 write('workflow/issues.json',state);
 const artifacts=[ref(write('implementation-review.md','Synthetic explicit implementation review'))];
 const currentAssignment=bytesHash('scripts/booklet/author-assignments.mjs');
 const record={pages:[{page:1,originalAttempt:2}],historicalImplementations,reviewer:'Synthetic coordinator',note:'Execution-only fixture migration',artifacts,
  reviewedImplementationChanges:[{name:'executionHash',from:oldExecution,to:task.generationDependencies.executionHash,reason:'Execution only',artifacts},
   {name:'assignmentImplementation',from:historicalImplementations.assignments.hash,to:currentAssignment,reason:'Author-only change',artifacts}]};
 return {runDir,write,read,options,record,task,prefix,state,mathArtifact,async adopt(){const saved=await recordInventoryReuse(options,record);options.inventoryReuseFile=saved.receipt.path;return saved;}};
}

test('explicit immutable adoption preserves stale generation, original bytes, review credit and newer failed attempts',async t=>{
 const f=fixture(t,{pipeline:true}),old=fs.readFileSync(path.join(f.runDir,f.prefix+'result.meta.json'));
 assert.equal(semanticCacheInfo(f.task).kind,'stale');
 assert.equal(dependencyStatus(f.options,{representative:true}).blocked[0].stage,'inventory');
 const saved=await f.adopt();assert.equal(saved.reused,false);
 const again=await f.adopt();assert.deepEqual(again.receipt,saved.receipt);assert.equal(again.reused,true);
 f.write('semantic-packets/page-001.inventory.3/error.txt','Preserved newer failure');
 const status=dependencyStatus(f.options,{representative:true});
 assert.equal(status.jobs[0].stage,'author');assert.equal(status.observations[0].kind,'reviewed-inventory-reuse');assert.equal(status.observations[0].generationCache.kind,'stale');
 assert.equal(inventoryReuseInfo(f.options,1).originalAttempt,2);assert.equal(semanticCacheInfo(f.task).kind,'stale');
 assert.deepEqual(fs.readFileSync(path.join(f.runDir,f.prefix+'result.meta.json')),old);
 assert.equal(f.read('workflow/issues.json').revision,1);assert.deepEqual(f.read('workflow/issues.json').pages[1].mathReview,f.state.pages[1].mathReview);
 assert.ok(dependencyStatus(f.options).blocked[0].reasons.some(r=>r.includes('Representative pattern')));
});

test('every original artifact, pinned source and review evidence is revalidated',async t=>{
 const f=fixture(t);await f.adopt();
 for(const name of [f.prefix+'task-input.json',f.prefix+'prompt.md',f.prefix+'config.json',f.prefix+'result.meta.json',f.prefix+'result.json',
  'semantic-packets/page-001.inventory.json','inventory-config.json','source/booklet.pdf','evidence/pages/page-001.png','evidence/pages/page-001.txt',
  'evidence/pages/page-002.png','evidence/pages/page-002.txt','evidence/teacher/pages/page-008.png','evidence/teacher/pages/page-008.txt',
  'math-review.md','implementation-review.md','history/runner.mjs']){
  const file=path.join(f.runDir,name),before=fs.readFileSync(file);fs.appendFileSync(file,' ');
  assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid',name);fs.writeFileSync(file,before);
 }
 assert.equal(inventoryReuseInfo(f.options,1).kind,'reviewed-inventory-reuse');
});

test('explicit page configuration selection retains each exact successful attempt configuration',async t=>{
 const f=fixture(t),original=f.options.inventoryConfigFile;
 f.options.inventoryConfigFile=f.write('inventory-selection.json',{format:'mathsmap-inventory-config-selection-v1',pages:{1:ref(original)}});
 await f.adopt();assert.equal(inventoryReuseInfo(f.options,1).kind,'reviewed-inventory-reuse');
 assert.equal(dependencyStatus(f.options,{representative:true}).jobs[0].stage,'author');
 const guard=generationPublicationGuard(f.options,'inventory',1);fs.appendFileSync(original,' ');
 assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');assert.throws(()=>guard({page:1}),/configuration/);
});

test('mixed historical runner revisions need an explicit per-page implementation review',async t=>{
 const f=fixture(t),pageReview={historicalImplementations:structuredClone(f.record.historicalImplementations),reviewedImplementationChanges:structuredClone(f.record.reviewedImplementationChanges)};
 f.record.historicalImplementations.runner=ref(f.write('history/another-runner.mjs','Another historical runner'));
 f.record.reviewedImplementationChanges[0].from=fingerprint([['codex-transcription.mjs',f.record.historicalImplementations.runner.hash],['worker-pool.mjs',f.record.historicalImplementations.workerPool.hash]]);
 await assert.rejects(()=>f.adopt(),/cannot be reproduced/);
 f.record.pages[0].implementationReview=pageReview;await f.adopt();
 assert.equal(inventoryReuseInfo(f.options,1).kind,'reviewed-inventory-reuse');
 fs.appendFileSync(pageReview.historicalImplementations.runner.path,'Changed original bytes');
 assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');
});

test('current author teaching remains a new dependency while source and inventory scope changes fail',async t=>{
 const f=fixture(t);await f.adopt();
 const before=createSemanticTasks({...f.options,stage:'author',representative:true})[0].inputHash;
 const config=f.read('author-config.json');config.pageTeachingPages={1:[3]};config.pageEvidence={1:{note:'A newer author method'}};f.write('author-config.json',config);
 assert.equal(inventoryReuseInfo(f.options,1).kind,'reviewed-inventory-reuse');
 assert.notEqual(dependencyStatus(f.options,{representative:true}).jobs[0].inputHash,before);
 for(const patch of [{contentScope:'practice-only'},{sourceEvidenceMode:'pixels'},{title:'Changed'}, {topics:[{...config.topics[0],start:0}]}]){
  f.write('author-config.json',{...config,...patch});assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');
 }
 f.write('author-config.json',config);f.write('inventory-config.json',config);
 assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');
 await assert.rejects(()=>recordInventoryReuse(f.options,f.record),/configuration changed/);
});

test('unrelated revisions preserve reuse; approval, decision and effective inventory changes invalidate it',async t=>{
 const f=fixture(t);await f.adopt();let state=f.read('workflow/issues.json');
 state.revision++;state.issues.other={id:'other',page:2,status:'pending',message:'Unrelated'};f.write('workflow/issues.json',state);
 assert.equal(inventoryReuseInfo(f.options,1).kind,'reviewed-inventory-reuse');
 state.pages[1].mathReview.note+=' Changed';f.write('workflow/issues.json',state);assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');
 state.pages[1].mathReview=f.state.pages[1].mathReview;state.issues.decision={id:'decision',page:1,origin:'review',status:'pending',message:'New source issue'};f.write('workflow/issues.json',state);
 assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');
 delete state.issues.decision;state.corrections=[{id:'correct',status:'approved',reason:'Synthetic correction',reviewer:'Synthetic reviewer',evidence:[ref(f.mathArtifact)],sourceRefs:[{page:1}],patches:[{scope:'inventory',page:1,targetId:'p1-q',field:'/expectedAnswer',original:'1',corrected:'2'}]}];
 f.write('workflow/issues.json',state);state=liveWorkflow(f.runDir);state.pages[1].mathReview={...f.state.pages[1].mathReview,key:state.pages[1].inventoryHash};f.write('workflow/issues.json',state);
 assert.equal(inventoryReuseInfo(f.options,1).kind,'invalid');
});

test('forged receipt paths and unexplained historical dependencies cannot adopt content',async t=>{
 const f=fixture(t);await f.adopt();
 const saved=f.options.inventoryReuseFile,receipt=JSON.parse(fs.readFileSync(saved,'utf8'));receipt.pages[0].originalInputHash='forged';fs.writeFileSync(saved,JSON.stringify(receipt));
 assert.match(inventoryReuseInfo(f.options,1).reason,/content-addressed/);
 f.record.reviewedImplementationChanges[0].from='not-original';await assert.rejects(()=>recordInventoryReuse(f.options,f.record),/Unexplained/);
 f.record.reviewedImplementationChanges[0].from=fingerprint([['codex-transcription.mjs',f.record.historicalImplementations.runner.hash],['worker-pool.mjs',f.record.historicalImplementations.workerPool.hash]]);
 const input=f.read(f.prefix+'task-input.json');input.inputHash=digest('unexplained');f.write(f.prefix+'task-input.json',input);
 const meta=f.read(f.prefix+'result.meta.json');meta.inputHash=input.inputHash;f.write(f.prefix+'result.meta.json',meta);
 await assert.rejects(()=>recordInventoryReuse(f.options,f.record),/cannot be reproduced/);
});

test('publication lock rechecks source and configuration changes without granting any credit',async t=>{
 const f=fixture(t);let release,entered;
 const ready=new Promise(r=>entered=r),hold=withRunLock(f.runDir,'publication',async()=>{entered();await new Promise(r=>release=r);});await ready;
 const recording=recordInventoryReuse(f.options,f.record);
 fs.appendFileSync(path.join(f.runDir,'evidence/pages/page-001.png'),'Changed while waiting');release();await hold;
 await assert.rejects(()=>recording,/hash cannot be reproduced|source pin/);
 assert.equal(fs.existsSync(path.join(f.runDir,'semantic-packets/inventory-reuse')),false);
 assert.equal(f.read('workflow/issues.json').revision,1);
});

test('next, status, drain and controller preserve representative gates and agree on reuse',async t=>{
 const f=fixture(t,{pipeline:true});await f.adopt();
 const originalLog=console.log;t.after(()=>console.log=originalLog);console.log=()=>{};
 const cli=await main(['next','--run-dir',f.runDir,'--config',f.options.configFile,'--inventory-config',f.options.inventoryConfigFile,'--inventory-reuse',f.options.inventoryReuseFile,'--representative']);
 assert.equal(cli.generation.jobs[0].stage,'author');assert.equal(cli.generation.observations[0].kind,'reviewed-inventory-reuse');
 const status=dependencyStatus(f.options,{requireRepresentativePlan:true});
 const drained=await drainDependencies(f.options,{runner:()=>assert.fail('Representative gate must prevent calls'),log:()=>{},requireRepresentativePlan:true});
 assert.deepEqual(drained.blocked,status.blocked);assert.deepEqual(drained.observations,status.observations);
 const controller=await driveBoundedWorkflow(f.options,{budget:{totalTokens:1000000},next:async()=>({jobs:[],active:[]}),receipt:()=>({}),generationRun:()=>assert.fail('Controller must retain representative gate')});
 assert.ok(JSON.stringify(controller).includes('Representative'));assert.ok(JSON.stringify(controller).includes('author'));
 const guard=generationPublicationGuard(f.options,'author');f.write('author-config.json',{...f.options.config,pageTeachingPages:{1:[3]}});
 assert.throws(()=>guard({page:1}),/configuration/);
});
