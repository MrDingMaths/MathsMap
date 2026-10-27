import {stampPacketRatings} from '../scripts/booklet/reasoning-ratings.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createSemanticTasks,runSemanticPackets,semanticCacheInfo,validateSemanticResult,wordExcerpts} from '../scripts/booklet/semantic-workflow.mjs';
import {contentHash} from '../scripts/booklet/lean-review.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {compactTikzPrompt,hasTikzVisual} from '../scripts/booklet/token-efficient-prompts.mjs';
import {readAttemptReceipt,recordAttempt,summarizeAttemptEvents} from '../scripts/booklet/semantic-run-metrics.mjs';
import {applyMappingRepair,mappingRepairContext} from '../scripts/booklet/semantic-mapping-repair.mjs';
import {SHARED_DIAGRAM_FORMAT} from '../scripts/booklet/shared-diagram-authoring.mjs';
import {normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {attemptRepairContext,repairAttempt,applyAttemptPatches,revalidateAssignment,equivalentAssignmentPrompt} from '../scripts/booklet/local-attempt-repair.mjs';
import {planTaskAssignments,runAuthorAssignment} from '../scripts/booklet/author-assignments.mjs';
import {replayInventory} from '../scripts/booklet/semantic-packets.mjs';

function fixture(t){
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'semantic-workflow-'));
 t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});
 fs.mkdirSync(path.join(runDir,'evidence/word'),{recursive:true});
 fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(let p=1;p<=5;p++){
  fs.writeFileSync(path.join(runDir,`evidence/pages/page-00${p}.txt`),`Unique source content ${p}. Solve the equation.`);
  fs.writeFileSync(path.join(runDir,`evidence/pages/page-00${p}.png`),`image-${p}`);
  fs.writeFileSync(path.join(runDir,`semantic-packets/page-00${p}.inventory.json`),JSON.stringify(inventory(p)));
 }
 const config={title:'Algebra',topics:[{id:'algebra',title:'Equations',start:1,end:5,teachingPages:[1,2,3]}]};
 return {runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1,2,3,4,5],concurrency:2},config,stage:'author',pages:[4,5]};
}
const inventory=page=>({pageNumber:page,inventoried:true,entries:[{id:`src-${page}`,targetId:`q-${page}`,kind:'question',description:'Solve the equation.'}]});
const rating={reasoningScore:20,difficulty:'Foundation',difficultyReason:'Direct application of the supplied equation method.'};
const testMetrics={model:'test-model',endedAt:'2026-10-21T00:00:00Z'};
const author=page=>{const packet={pageNumber:page,sections:[{id:`s-${page}`,title:'Equations',blocks:[{id:`b-${page}`,type:'question',classification:{...rating},content:{id:`q-${page}`,type:'question',prompt:'Solve.',answer:{short:'1',worked:'x=1'}}}]}],inventoryMappings:[{inventoryId:`src-${page}`,targetId:`q-${page}`}]};return stampPacketRatings(packet,testMetrics,'test-fixture');};
const pageFrom=prompt=>Number(prompt.match(/Target page (\d+)/)[1]);
const quiet={log:()=>{}};

test('initial authoring requires a reasoning assessment without an optional skill catalogue',async t=>{
 const options={...fixture(t),pages:[4]},task=createSemanticTasks(options)[0];
 assert.equal(options.config.classificationSkillIds,undefined);assert.match(task.prompt,/hardest essential demand/);
 const packet=author(4);delete packet.sections[0].blocks[0].classification;
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>({result:packet,metrics:{...testMetrics,usage:{output_tokens:10}}})});
 assert.equal(report.ok,false);assert.match(report.pages[0].error,/individual reasoning rating/);
 assert.equal(fs.existsSync(task.resultFile),false);
});

test('semantic authors receive the current presentation contract even with a historical v2 pin',t=>{
 const options=fixture(t),relative='scripts/booklet/prompts/source-presentation-v2.md';
 options.manifest.pins={files:{[relative]:'d84dcd762277ebeb25c896857b29e0f93a2920159a1d15a26531fe6fc52879be'}};
 const current=fs.readFileSync(new URL('../'+relative,import.meta.url),'utf8');
 const task=createSemanticTasks(options)[0];
 assert.ok(task.prompt.includes(current));
 assert.match(task.prompt,/Question-stem placement \(24 October 2026, user feedback\)/);
 assert.equal(task.promptSections.filter(section=>section.name==='source-presentation').length,1);
});

test('assignment prompt compatibility permits only explicit empty group membership lists',()=>{
 const context={assignment:{pages:[1]},evidence:[{hash:'source-hash'}],groups:[{id:'group',entryIds:['question']}]};
 const prompt=value=>'Read the exact source.\n'+JSON.stringify(value);
 const next=structuredClone(context);next.groups[0].questionIds=[];next.groups[0].inventoryIds=[];
 assert.equal(equivalentAssignmentPrompt(prompt(context),prompt(next)),true);
 const members=structuredClone(next);members.groups[0].questionIds=['new-question'];
 assert.equal(equivalentAssignmentPrompt(prompt(context),prompt(members)),false);
 const changedSource=structuredClone(next);changedSource.evidence[0].hash='changed-source';
 assert.equal(equivalentAssignmentPrompt(prompt(context),prompt(changedSource)),false);
 assert.equal(equivalentAssignmentPrompt(prompt(context),'Different contract.\n'+JSON.stringify(next)),false);
 assert.equal(equivalentAssignmentPrompt('Malformed\n{','Malformed\n{different'),false);
});

test('unmapped derived wrapper IDs can be repaired without changing source identities or content',()=>{
 const packet=author(4),leaf=packet.sections[0].blocks[0].content;
 const original={id:'derived-wrapper',type:'group',prompt:'',children:[leaf]};packet.sections[0].blocks[0].content=original;
 const context={targets:[{targetId:'b-4',field:'/content',original,derivedWrapperId:original.id}]};
 const corrected={...structuredClone(original),id:'unique-derived-wrapper'},patch={targetId:'b-4',field:'/content',original,corrected,reason:'Repair an unreferenced generated wrapper collision.'};
 const result=applyAttemptPatches(packet,context,[patch]);
 assert.equal(result.sections[0].blocks[0].content.id,'unique-derived-wrapper');
 assert.deepEqual(result.sections[0].blocks[0].content.children,[leaf]);
 const changed=structuredClone(patch);changed.corrected.children[0].prompt='Changed source';
 assert.throws(()=>applyAttemptPatches(packet,context,[changed]),/preserve all content/);
 packet.inventoryMappings.push({inventoryId:'source-stem',targetId:'derived-wrapper'});
 assert.throws(()=>applyAttemptPatches(packet,context,[patch]),/preserve all content and source identities/);
});

test('failed assignments can be revalidated from matching original model output without another call',async t=>{
 const options={...fixture(t),stage:'author',pages:[4],attempt:1},tasks=createSemanticTasks(options),plan=planTaskAssignments(tasks),assignment=plan.assignments[0];
 const generation={packets:[author(4)]};
 await assert.rejects(()=>runAuthorAssignment({runDir:options.runDir,assignment,tasks,attempt:1,validate:()=>{throw Error('Prior validator rejected a valid demonstration');},runner:async task=>{
  fs.writeFileSync(path.join(task.out,'last-message.txt'),JSON.stringify(generation));return {result:generation,metrics:{...testMetrics,provider:'fixture-model'}};
 }}),/Prior validator/);
 let checks=0;
 const report=await revalidateAssignment({...options,attempt:2},{page:4,assignmentId:assignment.id,fromAttempt:1,reason:'Diagnosed validator repair.'},{assertInputs:()=>{checks++;}});
 assert.equal(report.externalModelCalls,0);assert.equal(report.readyForAssembly,true);assert.equal(checks,2);
 const root=path.join(options.runDir,'semantic-packets/assignments',assignment.id);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'2/result.json'))),generation);
 fs.appendFileSync(path.join(root,'1/last-message.txt'),'changed');
 await assert.rejects(()=>revalidateAssignment({...options,attempt:3},{page:4,assignmentId:assignment.id,fromAttempt:1,reason:'Diagnosed validator repair.'},{assertInputs:()=>{}}));
});

test('page publication dependencies retain the assignment implementation loaded by the process',t=>{
 const options=fixture(t);options.manifest.pipelinePolicy='pdf-import-efficient-v1';
 const before=createSemanticTasks(options)[0];
 const read=fs.readFileSync;
 try{
  fs.readFileSync=function(file,...args){
   if(String(file).endsWith('/author-assignments.mjs')||String(file).endsWith('\\author-assignments.mjs'))return Buffer.from('a sibling updated the on-disk planner');
   return read.call(this,file,...args);
  };
  assert.equal(createSemanticTasks(options)[0].inputHash,before.inputHash);
  fs.writeFileSync(path.join(options.runDir,'evidence/pages/page-004.png'),'changed source');
  assert.notEqual(createSemanticTasks(options)[0].inputHash,before.inputHash);
 }finally{fs.readFileSync=read;}
});

async function unpublishedInventory(t){
 const options={...fixture(t),stage:'inventory',pages:[4],attempt:1};
 fs.unlinkSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'));
 const preserved=await runSemanticPackets(options,{...quiet,verifyPublication:()=>{throw Error('Tool changed during generation');},runner:async task=>{
  const result=inventory(4);fs.writeFileSync(path.join(task.out,'last-message.txt'),JSON.stringify(result));
  return {result,metrics:{...testMetrics,provider:'fixture-model'}};
 }});
 assert.equal(preserved.ok,false);
 const files=[1,2,3,4].flatMap(p=>['txt','png'].map(ext=>path.join(options.runDir,`evidence/pages/page-00${p}.${ext}`)));
 const original=files.map(file=>[file,fs.readFileSync(file)]);
 const assertInputs=()=>{for(const [file,bytes]of original)if(!fs.readFileSync(file).equals(bytes))throw Error('Pinned source changed');};
 return {options:{...options,attempt:2,fromAttempt:1},assertInputs,dir:path.join(options.runDir,'semantic-packets/page-004.inventory.1')};
}

test('guarded inventory replay preserves the model result without new calls and refuses published results',async t=>{
 const {options,assertInputs}=await unpublishedInventory(t);
 const preview=await replayInventory({...options,dryRun:true},{...quiet,assertInputs});
 assert.equal(preview.dryRun,true);
 assert.equal(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.inventory.2')),false);
 const report=await replayInventory(options,{...quiet,assertInputs});
 assert.equal(report.ok,true,JSON.stringify(report.pages));assert.equal(report.pages[0].metrics.externalModelCalls,0);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'))),inventory(4));
 await assert.rejects(()=>replayInventory({...options,attempt:3},{...quiet,assertInputs}),/already published/);
});

test('guarded inventory replay refuses changed source images or delivered prompts',async t=>{
 const first=await unpublishedInventory(t);
 fs.writeFileSync(path.join(first.options.runDir,'evidence/pages/page-004.png'),'changed source');
 await assert.rejects(()=>replayInventory(first.options,{...quiet,assertInputs:first.assertInputs}),/Pinned source changed/);
 const second=await unpublishedInventory(t);
 second.options.config.pageEvidence={4:{note:'Changed source instructions'}};
 await assert.rejects(()=>replayInventory(second.options,{...quiet,assertInputs:second.assertInputs}),/Source prompt changed/);
});

test('guarded inventory replay refuses edits to preserved model output',async t=>{
 const {options,assertInputs,dir}=await unpublishedInventory(t);
 fs.writeFileSync(path.join(dir,'generation.json'),JSON.stringify({...inventory(4),findings:['changed']}));
 await assert.rejects(()=>replayInventory(options,{...quiet,assertInputs}),/output changed/);
});

test('guarded inventory replay recovers matching original output rejected before result publication',async t=>{
 const {options,assertInputs,dir}=await unpublishedInventory(t);
 fs.unlinkSync(path.join(dir,'result.json'));
 const report=await replayInventory(options,{...quiet,assertInputs});
 assert.equal(report.ok,true,JSON.stringify(report.pages));assert.equal(report.pages[0].metrics.externalModelCalls,0);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'))),inventory(4));
});

test('guarded inventory replay rechecks its preserved bytes immediately before publication',async t=>{
 const {options,assertInputs,dir}=await unpublishedInventory(t);let checks=0;
 const report=await replayInventory(options,{...quiet,assertInputs:()=>{
  assertInputs();if(++checks===3)fs.appendFileSync(path.join(dir,'last-message.txt'),' ');
 }});
 assert.equal(report.ok,false);assert.match(report.pages[0].error,/Replay source or output changed/);
 assert.equal(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json')),false);
});

test('non-response worked demonstrations require independent source support, including given practice examples',()=>{
 const packet={pageNumber:1,sections:[{id:'teaching',title:'Example',phase:'teaching',blocks:[{id:'paired',type:'question',classification:{...rating},sourceReview:{responses:[{targetId:'worked',kind:'none'},{targetId:'turn',kind:'working'}]},content:{id:'pair',type:'group',prompt:'Worked example and your turn',children:[{id:'worked',type:'part',prompt:'Visible worked demonstration.'},{id:'turn',type:'part',prompt:'Solve.',answer:{short:'1',worked:'x=1'}}]}}]}],inventoryMappings:[{inventoryId:'source-example',targetId:'worked'},{inventoryId:'source-turn',targetId:'turn'}]};
 const source={entries:[{id:'source-example',kind:'example'},{id:'source-turn',kind:'question',responseKind:'working'}]};
 const validate=(value=packet,inventory=source)=>validateSemanticResult(value,{stage:'author',page:1,inventory});
 assert.doesNotThrow(()=>validate());
 const missing=structuredClone(packet);delete missing.sections[0].blocks[0].content.children[1].answer;
 missing.sections[0].blocks[0].sourceReview.responses[1].kind='none';
 assert.throws(()=>validate(missing),/Response leaf lacks short\/worked answers turn/);
 const practice=structuredClone(packet);practice.sections[0].phase='practice';
 assert.doesNotThrow(()=>validate(practice));
 const responseSource=structuredClone(source);responseSource.entries[0].responseKind='working';
 assert.throws(()=>validate(packet,responseSource),/Response leaf lacks short\/worked answers worked/);
 const teachingSource=structuredClone(source);teachingSource.entries[0].kind='teaching';
 assert.doesNotThrow(()=>validate(packet,teachingSource));
 teachingSource.entries[0].responseKind='cloze';
 assert.throws(()=>validate(packet,teachingSource),/Response leaf lacks short\/worked answers worked/);
 teachingSource.entries[0].responseKind='none';teachingSource.entries[0].expectedAnswer='growth';
 assert.throws(()=>validate(packet,teachingSource),/Response leaf lacks short\/worked answers worked/);
 const givenSource=structuredClone(source);givenSource.entries[0]={id:'source-example',kind:'part',responseKind:'none',presentation:{suppliedDemonstration:true}};
 assert.doesNotThrow(()=>validate(packet,givenSource));
 delete givenSource.entries[0].presentation.suppliedDemonstration;
 assert.throws(()=>validate(packet,givenSource),/Response leaf lacks short\/worked answers worked/);
 const pairedSource=structuredClone(source),pairedPacket=structuredClone(packet);
 pairedSource.entries[0]={id:'source-example',kind:'part',parentId:'source-pair'};
 pairedSource.entries.push({id:'source-pair',kind:'example'});pairedPacket.inventoryMappings.push({inventoryId:'source-pair',targetId:'paired'});
 assert.doesNotThrow(()=>validate(pairedPacket,pairedSource));
 pairedSource.entries[0].responseKind='working';
 assert.throws(()=>validate(pairedPacket,pairedSource),/Response leaf lacks short\/worked answers worked/);
});

test('source operation arrows can map to native table annotations with both cell anchors',()=>{
 const arrow={id:'division',type:'arrow',cellId:'original',toCellId:'image',label:'÷500',side:'bottom'};
 const table={id:'ratio-table',type:'table',annotations:[arrow],rows:[[{id:'original',type:'cell',blocks:[]},{id:'image',type:'cell',blocks:[]}]]};
 const packet={pageNumber:1,sections:[{id:'section',title:'Scale',blocks:[{id:'example',type:'callout',content:{format:'maths-editor-document-v1',blocks:[table]}}]}],inventoryMappings:[{inventoryId:'source-arrow',targetId:'division'}]};
 const source={entries:[{id:'source-arrow',kind:'diagram'}]};
 assert.doesNotThrow(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}));
 arrow.toCellId='missing';assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}),/Diagram mapped to non-diagram target/);
 arrow.toCellId='image';arrow.label='';assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}),/Diagram mapped to non-diagram target/);
 source.entries[0].responseKind='none';source.entries[0].presentation={meaning:'Identifies the working line referenced by this line.'};
 assert.doesNotThrow(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}));
 arrow.toCellId='original';assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}),/Diagram mapped to non-diagram target/);
});

test('source diagrams can map to editable annotated equations only with resolved labels',()=>{
 const diagram={id:'formula',type:'annotated-equation',latex:'y=mx+c',anchors:[{id:'gradient',start:2,end:3,text:'m'}],annotations:[{id:'gradient-label',targetId:'gradient',blocks:[{id:'gradient-text',type:'paragraph',inlines:[{type:'text',text:'gradient'}]}]}]};
 const packet={pageNumber:1,sections:[{id:'section',title:'Gradient',blocks:[{id:'definition',type:'callout',content:{format:'maths-editor-document-v1',blocks:[diagram]}}]}],inventoryMappings:[{inventoryId:'source-formula',targetId:'formula'}]};
 const source={entries:[{id:'source-formula',kind:'diagram'}]};
 assert.doesNotThrow(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}));
 diagram.anchors[0].start=3;
 assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}),/Diagram mapped to non-diagram target/);
 diagram.anchors[0].start=2;diagram.annotations[0].targetId='missing';
 assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:source}),/Diagram mapped to non-diagram target/);
});

test('author assignment passes explicit worker wait options without changing lease ownership',async t=>{
 const options={...fixture(t),pages:[4]},tasks=createSemanticTasks(options),assignment=planTaskAssignments(tasks).assignments[0];
 const slots=path.join(options.runDir,'workflow','worker-slots');fs.mkdirSync(slots,{recursive:true});
 for(let slot=0;slot<3;slot++)fs.writeFileSync(path.join(slots,slot+'.json'),JSON.stringify({id:'original-owner-'+slot}));
 const owners=fs.readdirSync(slots).map(file=>fs.readFileSync(path.join(slots,file),'utf8'));
 const controller=new AbortController();controller.abort(new Error('Explicit queued assignment cancellation'));
 let calls=0;
 await assert.rejects(runAuthorAssignment({runDir:options.runDir,tasks,assignment,attempt:1,validate:validateSemanticResult,
  workerSlotOptions:{pollMs:1,signal:controller.signal},runner:()=>{calls++;assert.fail('No slot was acquired');}}),/Explicit queued assignment cancellation/);
 assert.equal(calls,0);assert.deepEqual(fs.readdirSync(slots).map(file=>fs.readFileSync(path.join(slots,file),'utf8')),owners);
 fs.unlinkSync(path.join(slots,'0.json'));
 const result=await runAuthorAssignment({runDir:options.runDir,tasks,assignment,attempt:2,regenerationReason:'Original explicit cancellation had no generation.',validate:validateSemanticResult,
  workerSlotOptions:{pollMs:1,timeoutMs:1234},runner:async()=>{
   const lease=JSON.parse(fs.readFileSync(path.join(slots,'0.json')));assert.equal(lease.assignmentId,assignment.id);assert.equal(lease.queueTimeoutMs,1234);
   return {result:{packets:[author(4)]},metrics:{...testMetrics,provider:'test',externalModelCalls:0}};
  }});
 assert.equal(result.packets.length,1);assert.equal(fs.existsSync(path.join(slots,'0.json')),false);
 assert.equal(fs.readFileSync(path.join(slots,'1.json'),'utf8'),owners[1]);assert.equal(fs.readFileSync(path.join(slots,'2.json'),'utf8'),owners[2]);
});

test('a regeneration reason naming one assignment reruns only that assignment and keeps the other cached',async t=>{
 const options=fixture(t),tasks=createSemanticTasks(options),{assignments}=planTaskAssignments(tasks);
 assert.ok(assignments.length>=2,'fixture plans separate assignments');
 const calls=[],runner=assignment=>async()=>{calls.push(assignment.id);return {result:{packets:[author(assignment.pages[0])]},metrics:{...testMetrics,provider:'test',externalModelCalls:0}};};
 for(const assignment of assignments)await runAuthorAssignment({runDir:options.runDir,tasks,assignment,attempt:1,validate:validateSemanticResult,runner:runner(assignment),...quiet});
 assert.equal(calls.length,assignments.length);calls.length=0;
 await assert.rejects(runAuthorAssignment({runDir:options.runDir,tasks,assignment:assignments[0],attempt:2,regenerationReason:'Cause fixed elsewhere',validate:validateSemanticResult,runner:()=>assert.fail('An unnamed assignment must stay cached'),...quiet}).then(()=>{throw Error('cached');}),/cached/);
 await runAuthorAssignment({runDir:options.runDir,tasks,assignment:assignments[0],attempt:2,regenerationReason:'Repair duplicate ownership in '+assignments[0].id,validate:validateSemanticResult,runner:runner(assignments[0]),...quiet});
 await runAuthorAssignment({runDir:options.runDir,tasks,assignment:assignments[1],attempt:2,regenerationReason:'Repair duplicate ownership in '+assignments[0].id,validate:validateSemanticResult,runner:runner(assignments[1]),...quiet});
 assert.deepEqual(calls,[assignments[0].id],'only the named assignment called a worker');
});

test('three-pass inventory accepts a source checklist without legacy layout approvals and reuses it',async t=>{
 const options={...fixture(t),stage:'inventory',pages:[4]};
 options.manifest={...options.manifest,workflowPolicy:'review-first-v1',reviewProfile:'textbook-three-pass-v1'};
 fs.writeFileSync(path.join(options.runDir,'manifest.json'),JSON.stringify(options.manifest));
 fs.unlinkSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'));
 let calls=0;
 const runner=async()=>{calls++;return {result:inventory(4),metrics:{...testMetrics,}};};
 const first=await runSemanticPackets(options,{...quiet,runner});
 assert.equal(first.ok,true);
 const second=await runSemanticPackets(options,{...quiet,runner});
 assert.equal(second.ok,true);assert.equal(calls,1);
 const state=JSON.parse(fs.readFileSync(path.join(options.runDir,'workflow/issues.json')));
 assert.equal(state.reviewProfile,'textbook-three-pass-v1');
 assert.ok(state.pages['4'].inventoryHash);
});

test('explicit zero-call replay validates and publishes while model slots stay owned',async t=>{
 const options={...fixture(t),stage:'inventory',pages:[4],attempt:2,localReplay:true};
 const slots=path.join(options.runDir,'workflow','worker-slots');fs.mkdirSync(slots,{recursive:true});
 for(let i=0;i<3;i++)fs.writeFileSync(path.join(slots,i+'.json'),JSON.stringify({id:'model-owner-'+i}));
 const before=fs.readdirSync(slots).map(file=>fs.readFileSync(path.join(slots,file),'utf8'));
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>({result:inventory(4),metrics:{...testMetrics,provider:'local-replay',externalModelCalls:0,usage:null,elapsedMs:0}})});
 assert.equal(report.ok,true);assert.equal(report.pages[0].metrics.externalModelCalls,0);
 assert.deepEqual(fs.readdirSync(slots).map(file=>fs.readFileSync(path.join(slots,file),'utf8')),before);
 assert.equal(JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'))).pageNumber,4);
 const badOptions={...fixture(t),stage:'inventory',pages:[4],attempt:2,localReplay:true};
 const invalid=await runSemanticPackets(badOptions,{...quiet,runner:async()=>({result:{pageNumber:4},metrics:{...testMetrics,provider:'local-replay',externalModelCalls:0,usage:null}})});
 assert.equal(invalid.ok,false);assert.equal(JSON.parse(fs.readFileSync(path.join(badOptions.runDir,'semantic-packets/page-004.inventory.json'))).inventoried,true);
});

test('local replay cannot use the model runner or conceal external generation metrics',async t=>{
 const options={...fixture(t),stage:'inventory',pages:[4],attempt:2,localReplay:true};
 await assert.rejects(()=>runSemanticPackets(options,quiet),/explicit local result runner/);
 for(const metrics of [{provider:'codex',externalModelCalls:0},{provider:'local-replay',externalModelCalls:1},{provider:'local-replay',externalModelCalls:0,usage:{output_tokens:1}}]){
  const isolated={...fixture(t),stage:'inventory',pages:[4],attempt:2,localReplay:true};
  const report=await runSemanticPackets(isolated,{...quiet,runner:async()=>({result:inventory(4),metrics})});
  assert.equal(report.ok,false);assert.match(report.pages[0].error,/zero external model calls/);
  assert.equal(fs.existsSync(path.join(isolated.runDir,'semantic-packets/page-004.inventory.2/result.meta.json')),false);
 }
 const assigned={...fixture(t),localReplay:true};assigned.manifest.pipelinePolicy='pdf-import-efficient-v1';
 await assert.rejects(()=>runSemanticPackets(assigned,{...quiet,runner:()=>assert.fail()}),/cannot dispatch authoring assignments/);
});

test('a preserved structural failure is repaired locally with exact fields and all normal validators',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);bad.inventoryMappings[0].targetId='missing-target';
 let calls=0;
 const failed=await runSemanticPackets(options,{...quiet,runner:async()=>{calls++;return {result:bad,metrics:{...testMetrics,usage:{input_tokens:10,output_tokens:5}}};}});
 assert.equal(failed.ok,false);
 const context=attemptRepairContext(options,{page:4,fromAttempt:1,targets:[{targetId:'$packet',fields:['/inventoryMappings']}]});
 const record={context,patches:[{...context.targets[0],corrected:author(4).inventoryMappings,reason:'Use the existing question ID matched to the independently inventoried source.'}],review:{reviewer:'Test reviewer',note:'Compared existing source and content identity.',artifacts:[context.evidence[0]]}};
 const stale=structuredClone(record);stale.patches[0].original=[];
 await assert.rejects(repairAttempt({...options,attempt:2},stale,quiet),/original/);
 const passed=await repairAttempt({...options,attempt:2},record,quiet);
 assert.equal(passed.ok,true);assert.equal(calls,1);
 const canonical=JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.author.json')));
 assert.deepEqual(canonical.sections,bad.sections);assert.deepEqual(canonical.inventoryMappings,author(4).inventoryMappings);
 const receipt=readAttemptReceipt(path.join(options.runDir,'semantic-packets'));
 assert.equal(receipt.calls,1);assert.equal(receipt.localReplays,1);assert.equal(receipt.missingUsage,0);
 assert.throws(()=>attemptRepairContext(options,{page:4,fromAttempt:1,targets:[{targetId:'$packet',fields:['/inventoryMappings']}]}),/Published content/);
});

test('local repairs reject stale source dependencies, missing evidence and ID changes',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);delete bad.sections[0].blocks[0].content.answer;
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{...testMetrics,}})});
 const request={page:4,fromAttempt:1,targets:[{targetId:'s-4',fields:['/blocks']}]},context=attemptRepairContext(options,request);
 const replacement=structuredClone(context.targets[0].original);replacement[0].id='changed-id';
 // The source context now restores real rating provenance. Use that exact
 // current baseline so this assertion reaches the identity guard itself.
 const current=structuredClone(bad);current.sections[0].blocks=structuredClone(context.targets[0].original);
 assert.throws(()=>applyAttemptPatches(current,context,[{...context.targets[0],corrected:replacement,reason:'Bad identity change'}]),/preserve every content ID/);
 await assert.rejects(repairAttempt({...options,attempt:2},{context,patches:[]},quiet),/named reviewer/);
 fs.appendFileSync(path.join(options.runDir,'evidence/pages/page-004.txt'),'Changed source');
 assert.throws(()=>attemptRepairContext(options,request),/source inputs changed/);
});

test('local structural repair may update author review references without changing evidence or required values',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4),block=bad.sections[0].blocks[0];
 block.content.children=[{...block.content,id:'response',type:'part'}];delete block.content.answer;
 block.sourceReview={sourcePages:[4],sourceCompared:false,presentationRequirements:[{path:'/content/children/0/prompt',value:'Solve.'}],arrangements:[{targetId:'q-4',layout:'list',order:['response']}]};
 bad.inventoryMappings[0].targetId='missing';
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{...testMetrics,}})});
 const targets=[{targetId:'b-4',fields:['/content','/sourceReview/presentationRequirements','/sourceReview/arrangements']}];
 const context=attemptRepairContext(options,{page:4,fromAttempt:1,targets});
 const child=block.content.children[0],changed={...block.content,children:[],answer:child.answer,prompt:child.prompt};
 // Move the existing parent ID into a native prompt paragraph, retaining IDs.
 changed.id='response';changed.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'q-4',type:'paragraph',inlines:[{type:'text',text:'Solve.'}]}]};
 const patches=context.targets.map(t=>({...t,reason:'Reviewed reparenting; preserve source facts and required content.',corrected:t.field==='/content'?changed:t.field.endsWith('presentationRequirements')?[{path:'/content/prompt/blocks/0/inlines/0/text',value:'Solve.'}]:[{targetId:'q-4',layout:'list',order:['response']}]}));
 assert.doesNotThrow(()=>applyAttemptPatches(bad,context,patches));
 const altered=structuredClone(patches);altered[1].corrected[0].value='Different source';assert.throws(()=>applyAttemptPatches(bad,context,altered),/preserve every requirement value/);
 const stale=structuredClone(patches);stale[1].corrected[0].path='/content/missing';assert.throws(()=>applyAttemptPatches(bad,context,stale),/Missing|resolve/);
 for(const field of ['/sourceReview','/sourceReview/sourcePages','/sourceReview/sourceCompared','/sourceLayoutEvidence'])assert.throws(()=>attemptRepairContext(options,{page:4,fromAttempt:1,targets:[{targetId:'b-4',fields:[field]}]}),/Preserve identity/);
});

test('external full-page retries require a recorded reason before any new attempt starts',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);bad.inventoryMappings=[];
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{...testMetrics,}})});
 await assert.rejects(runSemanticPackets({...options,attempt:2},quiet),/targeted repair is insufficient/);
 assert.equal(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.author.2')),false);
});
test('semantic layouts reject sibling labels that share one positioning group',()=>{
 const a=author(1);a.sections[0].blocks[0].presentation={arrangement:{id:'bad-layout',type:'group',direction:'stack',children:[{id:'label-a',type:'item',ref:'a/label'},{id:'label-b',type:'item',ref:'b/label'}]}};
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:inventory(1)}),/Multiple structural labels/);
 a.sections[0].blocks[0].presentation.arrangement.children=a.sections[0].blocks[0].presentation.arrangement.children.map((n,i)=>({id:'cell-'+i,type:'group',direction:'stack',children:[n]}));
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:inventory(1)}));
});
test('shared-content inventory continuations require an existing matching target and a reason',()=>{
 const i=inventory(1),a=author(1);
 i.entries.push({id:'second-region',kind:'question',description:'Another region of the same source figure.'});
 a.inventoryMappings.push({inventoryId:'second-region',targetId:'q-1',continuationOf:'src-1',continuationReason:'Both independently inventoried regions belong to the same source figure.'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:i}));
 delete a.inventoryMappings[1].continuationReason;
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:i}),/continuation/);
 a.inventoryMappings[1].continuationReason='Shared figure';a.inventoryMappings[1].continuationOf='missing';
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:i}),/continuation/);
});

test('complete prompts share a stable prefix, preserve context, and never duplicate target evidence',t=>{
 const options=fixture(t),[a,b]=createSemanticTasks(options);
 const sharedEnd=a.prompt.indexOf('No TikZ visual');
 assert.equal(a.prompt.slice(0,sharedEnd),b.prompt.slice(0,sharedEnd));
 assert.match(a.prompt,/DOCUMENT: \{format:"maths-editor-document-v1"/);
 assert.match(a.prompt,/NODE: \{id,type:/);
 assert.match(a.prompt,/Missing or conflicting teaching context/);
 assert.match(a.prompt,/align\*/);
 assert.ok(!a.prompt.includes('PILOT-VERIFIED'));
 assert.ok(!a.prompt.includes('pageBreakBefore:true'));
 assert.ok(!a.prompt.includes('#AA0505'));
 assert.match(a.prompt,/#4f9b63/);
 assert.match(a.prompt,/Unresolved custom colours fail acceptance/);
 assert.equal(a.images.length,3); // Bounded previews plus target; all context is linked.
 assert.match(a.prompt,/page-003.png/);
 assert.equal(createSemanticTasks({...options,config:{...options.config,teachingImageLimit:3}})[0].images.length,4);
 const [teaching]=createSemanticTasks({...options,pages:[2]});
 assert.equal(teaching.images.length,2);
 assert.equal(teaching.prompt.split('Unique source content 2').length-1,1);
 const [inv]=createSemanticTasks({...options,stage:'inventory',pages:[4]});
 assert.match(inv.prompt,/SOURCE CONTEXT PAGE 3/);
 assert.equal(inv.images.length,3);
});

test('visual routing includes requested answer sketches without triggering on topic words',()=>{
 assert.equal(hasTikzVisual({entries:[{kind:'question',description:'Calculate circle area for radius 2.'}]}),false);
 assert.equal(hasTikzVisual({entries:[{kind:'question',description:'Sketch the function.'}]}),true);
 const prompt=compactTikzPrompt({inventory:{entries:[{kind:'diagram',description:'bearing diagram'}]}});
 assert.ok(prompt.includes('\\pic{angle'));
 assert.ok(prompt.includes('\\special{dvisvgm:raw'));
 assert.match(prompt,/90-b/);
 assert.match(prompt,/outer response remains JSON/);
});

test('reviewed author prompts explain corrected source and teaching context without exposing unrelated decisions',t=>{
 const options=fixture(t);
 options.config.workflowPolicy='review-first-v1';
 const correction=(page,original,corrected)=>({id:'fix-'+page,status:'approved',reason:'Reviewed numerical error',patches:[{scope:'inventory',page,targetId:'src-'+page,field:'/description',original,corrected}]});
 const workflowState={pages:{4:{patterns:[]}},issues:{a:{id:'a',page:1,status:'retained',message:'Teaching convention',resolution:{reason:'Use the taught method'}},b:{id:'b',page:5,status:'retained',message:'Unrelated secret',resolution:{reason:'Do not send'}}},corrections:[correction(4,'Solve the equation.','Find the corrected probability.'),correction(1,'Solve the equation.','Correct teaching formula'),correction(5,'Solve the equation.','Unrelated correction')],representatives:{}};
 const [task]=createSemanticTasks({...options,pages:[4],workflowState});
 assert.match(task.prompt,/Apply these decisions even when original PDF pixels or Word text differ/);
 assert.match(task.prompt,/Correct teaching formula/);
 assert.match(task.prompt,/Find the corrected probability/);
 assert.match(task.prompt,/Use the taught method/);
 assert.doesNotMatch(task.prompt,/Unrelated secret|Unrelated correction/);
 assert.equal(task.inventory.entries[0].description,'Find the corrected probability.');
 const [inv]=createSemanticTasks({...options,pages:[4],stage:'inventory',workflowState});
 assert.doesNotMatch(inv.prompt,/APPROVED EDITORIAL DECISIONS/);
});

test('Word retrieval merges overlap while preserving source offsets and whitespace',()=>{
 const word='alpha   beta\n'+('alpha equation '.repeat(700));
 const excerpts=wordExcerpts(word,'alpha equation');
 assert.equal(excerpts.length,1);
 assert.equal(excerpts[0].text,word.slice(excerpts[0].start,excerpts[0].end));
 assert.ok(excerpts[0].text.startsWith('alpha   beta'));
 assert.equal(wordExcerpts(word,'unrelated zebra').length,0);
});
test('practice-only three-pass authoring retains source pixels but excludes reviews of other practice on mixed context pages',t=>{
 const options=fixture(t);
 options.config={...options.config,workflowPolicy:'review-first-v1',contentScope:'practice-only'};
 options.manifest={...options.manifest,selectedPages:[1,4,5],reviewProfile:'textbook-three-pass-v1'};
 const workflowState={reviewProfile:'textbook-three-pass-v1',pipelinePolicy:'pdf-import-efficient-v1',pages:{4:{inventoryHash:'source4',patterns:[]}},issues:{},corrections:[],representatives:{}};
 const task=()=>createSemanticTasks({...options,pages:[4],workflowState})[0],before=task();
 workflowState.corrections.push({id:'other-practice',status:'approved',reason:'Reviewed another practice prompt.',patches:[{scope:'project',page:1,targetId:'unbound-other-question',field:'/prompt',original:'Old prompt',corrected:'Corrected other practice'}]});
 workflowState.issues.other={id:'other',page:1,status:'retained',message:'Other practice wording',resolution:{reason:'Reviewed separately'}};
 const after=task();assert.equal(after.inputHash,before.inputHash);assert.ok(after.images.includes(path.join(options.runDir,'evidence/pages/page-001.png')));assert.doesNotMatch(after.prompt,/Corrected other practice|Other practice wording/);
 workflowState.corrections.push({id:'external-teaching',status:'approved',reason:'Reviewed external teaching convention.',patches:[{scope:'inventory',page:2,targetId:'src-2',field:'/description',original:'Solve the equation.',corrected:'Current external teaching convention'}]});
 assert.match(task().prompt,/Current external teaching convention/);assert.notEqual(task().inputHash,before.inputHash);
});

test('author handoffs scope method clarifications to the assigned exercise without hiding shared corrections',t=>{
 const options=fixture(t);options.config.workflowPolicy='review-first-v1';
 const workflowState={pages:{4:{patterns:[]}},issues:{},corrections:[],representatives:{}};
 const task=()=>createSemanticTasks({...options,pages:[4],workflowState})[0];
 const before=task();
 const issue=(id,extra={})=>({id,page:1,status:'retained',message:id,resolution:{reason:'Use the supplied method'},...extra});
 workflowState.issues.other=issue('foreign-method',{reviewJob:{stage:'theory',ownershipIds:['exercise:another']}});
 assert.equal(task().inputHash,before.inputHash);
 workflowState.issues.own=issue('assigned-method',{reviewJob:{stage:'theory',ownershipIds:['exercise:algebra']}});
 workflowState.issues.source=issue('shared-source');
 workflowState.issues.target=issue('explicit-target',{targetId:'q-4',reviewJob:{stage:'theory',ownershipIds:['exercise:another']}});
 const current=task();
 assert.deepEqual(current.editorialDecisions.map(d=>d.id),['assigned-method','shared-source','explicit-target']);
 assert.notEqual(current.inputHash,before.inputHash);
 fs.writeFileSync(path.join(options.runDir,'evidence/pages/page-001.png'),'changed source pixels');
 assert.notEqual(task().inputHash,current.inputHash);
});

test('dry run performs no model calls or writes, and fingerprints only relevant evidence',async t=>{
 const options=fixture(t),before=fs.readdirSync(path.join(options.runDir,'semantic-packets'));
 const report=await runSemanticPackets({...options,dryRun:true},{...quiet,runner:()=>assert.fail('dry run called model')});
 assert.equal(report.concurrency,2);
 assert.deepEqual(fs.readdirSync(path.join(options.runDir,'semantic-packets')),before);
 const [a]=createSemanticTasks(options);
 const [b]=createSemanticTasks({...options,config:{...options.config,pageEvidence:{5:{note:'Only page five changes'}}}});
 assert.equal(a.inputHash,b.inputHash);
 fs.writeFileSync(path.join(options.runDir,'evidence/pages/page-003.png'),'changed teaching image');
 assert.notEqual(createSemanticTasks(options)[0].inputHash,a.inputHash);
 assert.throws(()=>createSemanticTasks({...options,manifest:{...options.manifest,effort:'xhigh'}}),/fresh Sol medium/);
});

test('bounded workers resume completed pages, reject edited caches, and preserve failed retries',async t=>{
 const options=fixture(t);let active=0,peak=0,calls=0;
 const runner=async({prompt})=>{calls++;active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,10));active--;return {result:author(pageFrom(prompt)),metrics:{...testMetrics,usage:{input_tokens:100,output_tokens:20}}};};
 const first=await runSemanticPackets(options,{...quiet,runner});
 assert.equal(first.ok,true);assert.equal(peak,2);assert.equal(calls,2);
 await runSemanticPackets(options,{...quiet,runner});assert.equal(calls,2);
 const task=createSemanticTasks(options)[0];assert.equal(semanticCacheInfo(task).kind,'hit');
 const original=fs.readFileSync(task.resultFile,'utf8');
 fs.writeFileSync(task.resultFile,original+' ');
 assert.equal(semanticCacheInfo(task).kind,'modified');
 await assert.rejects(()=>runSemanticPackets(options,{...quiet,runner}),/modified/);assert.equal(calls,2);
 fs.writeFileSync(task.resultFile,original);
 const retry=await runSemanticPackets({...options,pages:[4],attempt:2},{...quiet,runner:async()=>({result:{pageNumber:4},metrics:{...testMetrics,}})});
 assert.equal(retry.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),original);
 assert.ok(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.author.2/prompt.md')));
});

test('explicit attempts resume matching successes and legacy results require review',async t=>{
 const options={...fixture(t),pages:[4]};let calls=0;
 const runner=async()=>{calls++;return {result:author(4),metrics:{...testMetrics,}};};
 const task=createSemanticTasks(options)[0];fs.writeFileSync(task.resultFile,JSON.stringify(author(4)));
 assert.equal(semanticCacheInfo(task).kind,'legacy');
 await assert.rejects(()=>runSemanticPackets(options,{...quiet,runner}),/legacy/);
 await runSemanticPackets({...options,attempt:2},{...quiet,runner});
 await runSemanticPackets({...options,attempt:2},{...quiet,runner});
 assert.equal(calls,1);
 await runSemanticPackets({...options,attempt:4},{...quiet,runner});
 await assert.rejects(()=>runSemanticPackets({...options,attempt:3},{...quiet,runner}),/greater than 4/);
});

test('result validation rejects omissions, nonexistent targets, incomplete diagrams and missing answers',()=>{
 const task={stage:'author',page:4,inventory:inventory(4)};
 const missing=author(4);missing.inventoryMappings=[];
 assert.throws(()=>validateSemanticResult(missing,task),/Missing inventory mapping/);
 const wrong=author(4);wrong.inventoryMappings[0].targetId='invented';
 assert.throws(()=>validateSemanticResult(wrong,task),/Missing mapping target/);
 const diagram=author(4);diagram.sections[0].blocks.push({id:'diagram',format:'tikz',code:''});
 assert.throws(()=>validateSemanticResult(diagram,task),/Incomplete TikZ/);
 const answerless=author(4);delete answerless.sections[0].blocks[0].content.answer;
 assert.throws(()=>validateSemanticResult(answerless,task),/lacks short\/worked/);
 const visualInventory=inventory(4);visualInventory.entries[0].kind='diagram';
 assert.throws(()=>validateSemanticResult(author(4),{...task,inventory:visualInventory}),/non-diagram target/);
});

test('a retained source portrait maps to its native speech-template image after document normalization',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-portrait',kind:'diagram',description:'Portrait beside a speech bubble'});
 let portrait={id:'portrait',type:'image',src:'/booklet-assets/portrait.png',alt:'Edward',width:18,aspectRatio:1};
 a.sections[0].blocks[0].content.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'bubble',type:'layout',arrangement:'speech-bubble',columns:2,slots:[{id:'character',blocks:[portrait]},{id:'statement',blocks:[{id:'text',type:'paragraph',inlines:[{type:'text',text:'A mode is a data value.'}]}]}]}]};
 a.inventoryMappings.push({inventoryId:'source-portrait',targetId:'portrait'});
 a.sections[0].blocks[0].content.prompt=normalizeDocument(a.sections[0].blocks[0].content.prompt);
 portrait=a.sections[0].blocks[0].content.prompt.blocks[0].slots[0].blocks[0];
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 portrait.src=' ';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 portrait.src='/booklet-assets/portrait.png';portrait.width=0;assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('source card diagrams may map to individual editable card slots, not arbitrary prose slots',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-card',kind:'diagram',description:'Letter M card'});
 const layout={id:'cards',type:'layout',arrangement:'cards',slots:[{id:'card-m',blocks:[{id:'letter-m',type:'paragraph',inlines:[{type:'text',text:'M'}]}]}]};
 a.sections[0].blocks.push({id:'native-cards',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[layout]}});
 a.inventoryMappings.push({inventoryId:'source-card',targetId:'card-m'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 a.inventoryMappings.at(-1).targetId='cards';assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 const saved=layout.slots;layout.slots=[];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);layout.slots=saved;
 layout.arrangement='parallel';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('source speech bubbles map to populated editable statements with a tail',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-bubble',kind:'diagram',description:'Quoted statement in a speech bubble'});
 const layout={id:'bubble',type:'layout',arrangement:'speech-bubble',tail:'left',slots:[{id:'statement',blocks:[{id:'quote',type:'paragraph',inlines:[{type:'text',text:'Increasing by 50% then decreasing by 50%.'}]}]}]};
 a.sections[0].blocks.push({id:'native-bubble',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[layout]}});
 a.inventoryMappings.push({inventoryId:'source-bubble',targetId:'bubble'});
 const task={stage:'author',page:4,inventory:i};
 assert.doesNotThrow(()=>validateSemanticResult(a,task));
 a.inventoryMappings.at(-1).targetId='statement';assert.doesNotThrow(()=>validateSemanticResult(a,task));
 layout.slots[0].blocks[0].inlines[0].text=' ';assert.throws(()=>validateSemanticResult(a,task),/non-diagram/);
 layout.slots[0].blocks[0].inlines[0].text='Statement';delete layout.tail;assert.throws(()=>validateSemanticResult(a,task),/non-diagram/);
 layout.tail='left';layout.arrangement='parallel';assert.throws(()=>validateSemanticResult(a,task),/non-diagram/);
 layout.arrangement='speech-bubble';layout.slots=[];a.inventoryMappings.at(-1).targetId='bubble';assert.throws(()=>validateSemanticResult(a,task),/non-diagram/);
});

test('source tables may map to populated native tables but not empty placeholders',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-table',kind:'diagram',description:'Outcome table'});
 const table={id:'native-table',type:'table',rows:[[{blocks:[{id:'heading',type:'paragraph',inlines:[{type:'text',text:'Outcome'}]}]}]]};
 a.sections[0].blocks.push({id:'table-block',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[table]}});
 a.inventoryMappings.push({inventoryId:'source-table',targetId:'native-table'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 table.rows=[];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});
test('a source table may map to its exact native response payload, never prose or a missing field',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-response-table',kind:'diagram',description:'Completion table'});
 const table={id:'native-response-table',type:'table',rows:[[{blocks:[{id:'native-response-heading',type:'paragraph',inlines:[{type:'text',text:'Pay'}]}]}]]};
 const response={id:'table-response',type:'part',prompt:{format:'maths-editor-document-v1',version:1,blocks:[table]},answer:{short:'5',worked:'2+3=5'}};
 a.sections[0].blocks.push({id:'response-table-block',type:'question',classification:{...rating},content:response});
 const mapping={inventoryId:'source-response-table',targetId:response.id,field:'/prompt/blocks/0'};a.inventoryMappings.push(mapping);
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 mapping.field='/prompt/blocks/1';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 mapping.field='/prompt/blocks/0';table.type='paragraph';table.inlines=[{type:'text',text:'Table placeholder'}];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 table.type='table';table.rows=[];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('equation and writing-scaffold visuals can retain editable native maths',()=>{
 const i=inventory(4),a=author(4);
 i.entries.push({id:'source-scaffold',kind:'diagram',description:'Range equals three handwritten boxes with subtraction and equals signs.'});
 const scaffold={id:'native-scaffold',type:'paragraph',inlines:[{type:'math',latex:'\\mathrm{Range}=\\boxed{\\phantom{7}}-\\boxed{\\phantom{3}}=\\boxed{\\phantom{4}}'}]};
 a.sections[0].blocks.push({id:'scaffold-block',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[scaffold]}});
 a.inventoryMappings.push({inventoryId:'source-scaffold',targetId:scaffold.id});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 scaffold.inlines=[{type:'text',text:'Range = '},{type:'cloze',answer:'4',width:15}];
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 scaffold.inlines=[{type:'math',latex:'  '}];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 scaffold.inlines=[{type:'text',text:'Diagram goes here'}];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('a populated native scaffold can replace a source equation visual',()=>{
 const i=inventory(4),a=author(4);
 i.entries.push({id:'source-scaffold',kind:'diagram',description:'Range calculation with writable boxes'});
 const scaffold={id:'native-scaffold',type:'layout',arrangement:'scaffold',slots:[
  {id:'formula-slot',blocks:[{id:'formula',type:'paragraph',inlines:[{type:'math',latex:'R='}]}]},
  {id:'box-slot',blocks:[{id:'box',type:'table',rows:[[{blocks:[{id:'answer',type:'paragraph',inlines:[{type:'cloze',answer:'4',width:12}]}]}]]}]}
 ]};
 a.sections[0].blocks.push({id:'scaffold-block',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[scaffold]}});
 a.inventoryMappings.push({inventoryId:'source-scaffold',targetId:scaffold.id});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 scaffold.arrangement='parallel';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 scaffold.arrangement='scaffold';scaffold.slots[1].blocks=[];
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 scaffold.slots=[{id:'empty-prose-slot',blocks:[{id:'empty-prose',type:'paragraph',inlines:[{type:'text',text:'Scaffold goes here'}]}]}];
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('an inventoried response grid maps explicitly to its native grid layout',()=>{
 const i=inventory(4),a=author(4);i.entries.push({id:'source-grid',kind:'diagram',description:'Two response cells'});
 const grid={id:'native-grid',type:'group',prompt:'Find each range.',layout:'grid',children:['a','b'].map(id=>({id,type:'part',prompt:'$1, 2$',answer:{short:'1',worked:'$2-1=1$'}}))};
 a.sections[0].blocks.push({id:'grid-block',type:'question',classification:{...rating},content:grid});
 const mapping={inventoryId:'source-grid',targetId:grid.id,field:'/layout'};a.inventoryMappings.push(mapping);
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 mapping.field='/prompt';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 mapping.field='/layout';grid.layout='stack';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('a concurrent canonical edit survives an in-flight transcription',async t=>{
 const options={...fixture(t),pages:[4]},task=createSemanticTasks(options)[0];
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>{
  fs.writeFileSync(task.resultFile,'user edit');return {result:author(4),metrics:{...testMetrics,}};
 }});
 assert.equal(report.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),'user edit');
 assert.ok(fs.existsSync(path.join(task.out,'result.json')));
});

test('validation and publication failures retain model usage, phase outcomes and immutable generation',async t=>{
 const options={...fixture(t),pages:[4]},metrics={...testMetrics,usage:{input_tokens:100,cached_input_tokens:60,output_tokens:25},elapsedMs:50};
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:{pageNumber:4},metrics})});
 const root=path.join(options.runDir,'semantic-packets');
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'page-004.author.1/generation.json'))),{pageNumber:4});
 let ledger=fs.readFileSync(path.join(root,'ledger.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(ledger[0].usage,metrics.usage);assert.equal(ledger[0].canonicalWritten,false);
 const task=createSemanticTasks({...options,attempt:2})[0];
 await runSemanticPackets({...options,attempt:2},{...quiet,runner:async()=>{fs.writeFileSync(task.resultFile,'concurrent edit');return {result:author(4),metrics};}});
 const events=fs.readFileSync(path.join(root,'attempt-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(events.filter(e=>e.event==='finished').map(e=>e.failedPhase),['validation','publication']);
 const receipt=readAttemptReceipt(root);assert.equal(receipt.calls,2);assert.equal(receipt.usage.input_tokens,200);assert.equal(receipt.usage.cached_input_tokens,120);assert.equal(receipt.missingUsage,0);
 assert.equal(fs.readFileSync(task.resultFile,'utf8'),'concurrent edit');
});

test('generation errors record missing usage honestly and unfinished events survive resume',async t=>{
 const options={...fixture(t),pages:[4]},root=path.join(options.runDir,'semantic-packets');
 await runSemanticPackets(options,{...quiet,runner:async()=>{const error=Error('runner failed');error.metrics={elapsedMs:12,usage:null};throw error;}});
 const before=readAttemptReceipt(root);assert.equal(before.missingUsage,1);assert.equal(before.callElapsedMs,12);
 const unfinished=recordAttempt(root,{stage:'author',page:5,attempt:1});unfinished.phase('generation');
 const after=readAttemptReceipt(root);assert.equal(after.unfinished.length,1);assert.equal(after.calls,2);assert.equal(after.missingUsage,2);
 fs.appendFileSync(path.join(root,'attempt-events.jsonl'),'{"attemptId":');
 assert.equal(readAttemptReceipt(root).incompleteTail,true);
 assert.throws(()=>recordAttempt(root,{stage:'author',page:5,attempt:2}),/incomplete tail/);
});

test('concurrent attempt time is a union, not a sum of model call durations',()=>{
 const events=[['a',0,100],['b',50,150]].flatMap(([attemptId,start,end])=>[
  {attemptId,event:'started',time:start},{attemptId,event:'phase-started',phase:'generation',time:start},
  {attemptId,event:'phase-finished',phase:'generation',time:end,elapsedMs:end-start,metrics:{...testMetrics,elapsedMs:100,usage:{input_tokens:10,cached_input_tokens:6,output_tokens:3}}},
  {attemptId,event:'finished',time:end},
 ]);
 const receipt=summarizeAttemptEvents(events);assert.equal(receipt.completedAttemptActiveWallMs,150);assert.equal(receipt.callElapsedMs,200);assert.equal(receipt.usage.input_tokens,20);assert.equal(receipt.usage.cached_input_tokens,12);
});

test('mapping-only repair preserves content and valid mappings, records reasons, and revalidates',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);
 bad.inventoryMappings.push({inventoryId:'p4-generated-heading',targetId:'s-4'});
 const metrics={...testMetrics,usage:{input_tokens:30,output_tokens:10}};
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics})});
 const repair={edits:[{index:1,original:bad.inventoryMappings[1],replacement:null,reason:'Generated section heading is not an independently inventoried item; all actual entries retain mappings.'}]};
 const report=await runSemanticPackets({...options,attempt:2,repairFrom:1},{...quiet,runner:async({prompt,images})=>{
  assert.match(prompt,/Repair unknown inventory references only/);assert.deepEqual(images,[]);return {result:repair,metrics};
 }});
 assert.equal(report.ok,true);
 const task=createSemanticTasks({...options,attempt:2})[0];
 assert.deepEqual(JSON.parse(fs.readFileSync(task.resultFile)),author(4));
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(task.out,'repair.json'))),repair);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.author.1/generation.json'))),bad);
 assert.equal(readAttemptReceipt(task.packetRoot).calls,2);
 assert.throws(()=>applyMappingRepair(bad,inventory(4),{edits:[{...repair.edits[0],index:0,original:bad.inventoryMappings[0]}]}),/invalid/);
 assert.throws(()=>applyMappingRepair(bad,inventory(4),{edits:[{...repair.edits[0],reason:''}]}),/invalid/);
 fs.writeFileSync(path.join(options.runDir,'evidence/pages/page-004.txt'),'changed source');
 await assert.rejects(()=>runSemanticPackets({...options,attempt:3,repairFrom:1},{...quiet,runner:()=>assert.fail('stale repair called runner')}),/inputs changed/);
});

test('a targeted repair cannot hide other content defects or drop known inventory coverage',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);delete bad.sections[0].blocks[0].content.answer;
 bad.inventoryMappings.push({inventoryId:'generated',targetId:'s-4'});
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{...testMetrics,}})});
 const report=await runSemanticPackets({...options,attempt:2,repairFrom:1},{...quiet,runner:async()=>({result:{edits:[{index:1,original:bad.inventoryMappings[1],replacement:null,reason:'Generated layout'}]},metrics:{...testMetrics,}})});
 assert.equal(report.ok,false);assert.match(report.pages[0].error,/lacks short\/worked/);
 assert.equal(fs.existsSync(createSemanticTasks(options)[0].resultFile),false);
 assert.equal(mappingRepairContext(bad,inventory(4)).invalid.length,1);
});

const sharedAuthor=()=>{
 const p=author(4);p.authoringFormat=SHARED_DIAGRAM_FORMAT;
 p.diagramLibrary={base:'\\begin{tikzpicture}\\draw (0,0)--(1,0);',end:'\\end{tikzpicture}'};
 p.sections[0].blocks[0].content.questionDiagrams=[{id:'q4-diagram',format:'tikz',role:'question',codeParts:['base','end'],spec:{sourcePage:4}}];
 return p;
};

test('shared authoring is opt-in, fingerprints its format, and publishes only ordinary editable code',async t=>{
 const options={...fixture(t),pages:[4]},enabled={...options,config:{...options.config,authoringFormat:SHARED_DIAGRAM_FORMAT}};
 const normalTask=createSemanticTasks(options)[0],sharedTask=createSemanticTasks(enabled)[0];
 assert.notEqual(normalTask.inputHash,sharedTask.inputHash);assert.doesNotMatch(normalTask.prompt,/Optional internal shared-diagram/);assert.match(sharedTask.prompt,/NO inserted spaces\/newlines/);
 assert.deepEqual(createSemanticTasks({...options,stage:'inventory'})[0].prompt,createSemanticTasks({...enabled,stage:'inventory'})[0].prompt);
 assert.throws(()=>createSemanticTasks({...options,config:{...options.config,authoringFormat:'unknown'}}),/Unsupported/);
 const raw=sharedAuthor(),report=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{...testMetrics,usage:{output_tokens:20}}})});
 assert.equal(report.ok,true);
 const canonical=JSON.parse(fs.readFileSync(sharedTask.resultFile));assert.equal(canonical.authoringFormat,undefined);assert.equal(canonical.diagramLibrary,undefined);
 assert.equal(canonical.sections[0].blocks[0].content.questionDiagrams[0].code,raw.diagramLibrary.base+raw.diagramLibrary.end);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(sharedTask.out,'generation.json'))),raw);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(sharedTask.out,'materialized.json'))),canonical);
 const events=fs.readFileSync(path.join(sharedTask.packetRoot,'attempt-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(events[0].authoringFormat,SHARED_DIAGRAM_FORMAT);
 assert.equal(events.find(e=>e.event==='phase-finished'&&e.phase==='generation').generatedCharacters,JSON.stringify(raw).length);
 assert.equal(events.find(e=>e.event==='phase-finished'&&e.phase==='validation').materializedCharacters,JSON.stringify(canonical).length);
 assert.equal(semanticCacheInfo(sharedTask).kind,'hit');
 await runSemanticPackets(enabled,{...quiet,runner:()=>assert.fail('materialized cache caused regeneration')});
});

test('shared materialization failures retain metrics and bounded mapping repairs consume expanded content',async t=>{
 const options={...fixture(t),pages:[4]},raw=sharedAuthor();
 const disabled=await runSemanticPackets(options,{...quiet,runner:async()=>({result:raw,metrics:{...testMetrics,usage:{output_tokens:20}}})});
 assert.equal(disabled.ok,false);assert.match(disabled.pages[0].error,/explicit config/);
 const enabled={...options,config:{...options.config,authoringFormat:SHARED_DIAGRAM_FORMAT},attempt:2};
 raw.inventoryMappings.push({inventoryId:'generated-heading',targetId:'s-4'});
 const failed=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{...testMetrics,usage:{output_tokens:30}}})});
 assert.equal(failed.ok,false);assert.match(failed.pages[0].error,/Unknown inventory mapping/);
 const repair=await runSemanticPackets({...enabled,attempt:3,repairFrom:2},{...quiet,runner:async()=>({result:{edits:[{index:1,original:raw.inventoryMappings[1],replacement:null,reason:'Generated heading is not a source inventory entry.'}]},metrics:{...testMetrics,usage:{output_tokens:5}}})});
 assert.equal(repair.ok,true);
 const saved=JSON.parse(fs.readFileSync(createSemanticTasks(enabled)[0].resultFile));assert.equal(saved.authoringFormat,undefined);assert.equal(saved.inventoryMappings.length,1);assert.equal(typeof saved.sections[0].blocks[0].content.questionDiagrams[0].code,'string');
 const receipt=readAttemptReceipt(path.join(options.runDir,'semantic-packets'));assert.equal(receipt.calls,3);assert.equal(receipt.usage.output_tokens,55);
});

test('reviewed publication honours its bounded wait without stealing another writer lock',async t=>{
 for(const [waitMs,releaseMs,success]of [[10,180,false],[1000,180,true]]){
  const base=fixture(t),page=1,canonical=path.join(base.runDir,'semantic-packets/page-001.inventory.json');fs.unlinkSync(canonical);
  const options={...base,manifest:{...base.manifest,workflowPolicy:'review-first-v1'},stage:'inventory',pages:[page],reviewLockTimeoutMs:waitMs};let release;
  const report=await runSemanticPackets(options,{...quiet,runner:async()=>{
   const file=path.join(base.runDir,'workflow/review.lock');fs.mkdirSync(path.dirname(file),{recursive:true});const owner=JSON.stringify({pid:process.pid,note:'Fixture writer owns this lock'});fs.writeFileSync(file,owner,{flag:'wx'});
   release=new Promise(resolve=>setTimeout(()=>{assert.equal(fs.readFileSync(file,'utf8'),owner);fs.unlinkSync(file);resolve();},releaseMs));
   return {result:{...inventory(page),layoutPatterns:[{id:'plain',description:'Plain source question'}]},metrics:{...testMetrics,}};
  }});
  await release;assert.equal(report.ok,success);assert.equal(fs.existsSync(canonical),success);if(!success)assert.match(report.pages[0].error,/review lock is busy/);
 }
});


test('retained medium trial provenance changes generation identity and reaches inventory and author workers',async t=>{
 const options={...fixture(t),pages:[4]},defaultTask=createSemanticTasks(options)[0];
 options.manifest={...options.manifest,effort:'medium',reasoningOverride:{effort:'medium',reason:'User-requested Pythagoras trial'}};
 const medium=createSemanticTasks(options)[0];
 assert.notEqual(defaultTask.inputHash,medium.inputHash);
 assert.equal(medium.generationDependencies.configuration.effort,'medium');
 for(const stage of ['inventory','author']){
  if(stage==='inventory')fs.unlinkSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'));
  let calls=0;
  const result=await runSemanticPackets({...options,stage},{...quiet,runner:async request=>{
   calls++;assert.equal(request.configuration.effort,'medium');
   if(stage==='author')assert.match(request.prompt,/assigned Sol medium authoring worker/);
   return {result:stage==='inventory'?inventory(4):author(4),metrics:{...testMetrics,provider:'test',effort:request.configuration.effort}};
  }});
  assert.equal(result.ok,true);assert.equal(calls,1);
  const task=createSemanticTasks({...options,stage})[0],meta=JSON.parse(fs.readFileSync(path.join(task.out,'result.meta.json')));
  assert.equal(meta.effort,'medium');assert.deepEqual(meta.reasoningOverride,options.manifest.reasoningOverride);assert.equal(meta.metrics.effort,'medium');
  assert.ok(fs.existsSync(task.resultFile));
 }
});

test('house authoring preferences are opt-in, fingerprinted, and publish generated editable diagrams',async t=>{
 const options={...fixture(t),pages:[4]},enabled={...options,config:{...options.config,authoringPreferences:'house-presets-v1'}};
 const normalTask=createSemanticTasks(options)[0],houseTask=createSemanticTasks(enabled)[0];
 assert.notEqual(normalTask.inputHash,houseTask.inputHash);assert.doesNotMatch(normalTask.prompt,/HOUSE AUTHORING PREFERENCES/);assert.match(houseTask.prompt,/PRESET ARRANGEMENTS/);
 assert.deepEqual(createSemanticTasks({...options,stage:'inventory'})[0].prompt,createSemanticTasks({...enabled,stage:'inventory'})[0].prompt);
 assert.throws(()=>createSemanticTasks({...options,config:{...options.config,authoringPreferences:'unknown'}}),/Unsupported/);
 const raw=author(4);raw.sections[0].blocks[0].content.questionDiagrams=[{id:'q4-diagram',role:'question',spec:{sourcePage:4},diagramTemplate:{family:'number-line',min:0,max:5,step:1}}];
 const report=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{...testMetrics,usage:{output_tokens:20}}})});
 assert.equal(report.ok,true);
 const diagram=JSON.parse(fs.readFileSync(houseTask.resultFile)).sections[0].blocks[0].content.questionDiagrams[0];
 assert.equal(diagram.diagramTemplate,undefined);assert.match(diagram.code,/\\begin\{tikzpicture\}/);assert.equal(diagram.spec.template.family,'number-line');
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(houseTask.out,'generation.json'))),raw);
});

function suppliedDemonstration(entry){
 const inventory={pageNumber:1,inventoried:true,entries:[{id:'source-demo',description:'Sketch the supplied parabola.',...entry}]};
 const packet={pageNumber:1,sections:[{id:'demo-section',title:'Demonstration',topicId:'topic',phase:'teaching',blocks:[{id:'demo-block',type:'question',classification:{...rating},content:{id:'demo-node',type:'part',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'demo-paragraph',type:'paragraph',inlines:[{type:'text',text:'Supplied completed working.'}]}]}},sourceReview:{responses:[{targetId:'demo-node',kind:'none'}]}}]}],inventoryMappings:[{inventoryId:'source-demo',targetId:'demo-paragraph'}],findings:[],corrections:[]};
 return {inventory,packet};
}

test('a supplied example mapped to its native paragraph retains its non-response owner',()=>{
 const {inventory,packet}=suppliedDemonstration({kind:'example',responseKind:'none'});
 assert.doesNotThrow(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory}));
});

test('independent inventory demonstration descriptions support permanent supplied parts',()=>{
 for(const presentation of ['Completed demonstration: preserve the supplied scaffold.',{answerVisibility:'Completed demonstration remains student-visible.'}]){
  const {inventory,packet}=suppliedDemonstration({kind:'part',presentation});
  assert.doesNotThrow(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory}));
 }
});

test('a real response cannot waive answers through an author none declaration',()=>{
 for(const entry of [{kind:'question',responseKind:'none',presentation:'Completed demonstration'}, {kind:'part',responseKind:'working',presentation:'Completed demonstration'}, {kind:'part',responseKind:'none',presentation:{answerVisibility:'Supplied answer evidence; omit from student response spaces.'}}]){
  const {inventory,packet}=suppliedDemonstration(entry);
  assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory}),/Response leaf lacks short\/worked answers/);
 }
});

test('inventoried selection alternatives stay given while the selection requires answers',()=>{
 const inventory={pageNumber:1,inventoried:true,entries:[
  {id:'selection',kind:'question',description:'Circle the radius.',responseKind:'inline',expectedAnswer:'A'},
  ...['a','b'].map(label=>({id:label,kind:'part',parentId:'selection',description:'Alternative '+label+'.'}))
 ]};
 const option=id=>({id,type:'part',prompt:'',questionDiagrams:[{id:id+'-diagram',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0) circle (1);\\end{tikzpicture}'}]});
 const packet={pageNumber:1,sections:[{id:'section',title:'Selection',blocks:[{id:'block',type:'question',classification:{...rating},content:{id:'root',type:'group',prompt:'Circle the radius.',children:[option('a'),option('b'),{id:'response',type:'part',prompt:'',answer:{short:'A',worked:'A joins the centre to the circumference.'}}]},sourceReview:{responses:[{targetId:'a',kind:'none'},{targetId:'b',kind:'none'},{targetId:'response',kind:'inline'}]}}]}],inventoryMappings:[{inventoryId:'selection',targetId:'root'},{inventoryId:'a',targetId:'a'},{inventoryId:'b',targetId:'b'}]};
 const validate=(p=packet,i=inventory)=>validateSemanticResult(p,{stage:'author',page:1,inventory:i});
 assert.doesNotThrow(()=>validate());
 const unanswered=structuredClone(packet);delete unanswered.sections[0].blocks[0].content.children[2].answer;
 assert.throws(()=>validate(unanswered),/Response leaf lacks short\/worked answers/);
 const realPart=structuredClone(inventory);realPart.entries[1].responseKind='working';
 assert.throws(()=>validate(packet,realPart),/Response leaf lacks short\/worked answers a/);
 const unconfirmed=structuredClone(inventory);unconfirmed.entries[1].description='Find the radius.';
 assert.throws(()=>validate(packet,unconfirmed),/Response leaf lacks short\/worked answers a/);
 const undeclared=structuredClone(packet);undeclared.sections[0].blocks[0].sourceReview.responses[0].kind='working';
 assert.throws(()=>validate(undeclared),/Response leaf lacks short\/worked answers a/);
});

// A library shortlist is advisory; only used copies own prior proof dependencies.
function publicationLibrary(t,options){
 const root=path.resolve('.'),id='publication-fixture-'+path.basename(options.runDir),projectFile=path.join(root,'booklets/projects',id+'.json'),runDir=path.join(root,'.booklet-work/full-imports',id),block=author(4).sections[0].blocks[0];
 block.content.prompt='Unique source content 4. Solve the equation.';
 fs.mkdirSync(path.join(runDir,'lean-review'),{recursive:true});
 const table=path.join(runDir,'lean-review/reviewed.json'),project={id,runId:id,updatedAt:new Date().toISOString(),sections:[{blocks:[block]}]};
 fs.writeFileSync(projectFile,JSON.stringify(project));fs.writeFileSync(table,JSON.stringify({questions:{[block.id]:{hash:contentHash(block),outcome:'passed',note:'Original independent proof'}}}));
 const dispose=()=>{if(fs.existsSync(projectFile))fs.unlinkSync(projectFile);fs.rmSync(runDir,{recursive:true,force:true});};t.after(dispose);return {id,block,project,projectFile,table,dispose};
}
test('in-flight unrelated accepted-library addition publishes once, including assignment materialization',async t=>{
 for(const assigned of [false,true]){
  const options={...fixture(t),pages:[4]};options.manifest={...options.manifest,reviewProfile:'textbook-three-pass-v1',...(assigned?{pipelinePolicy:'bounded-three-pass-v1'}:{})};options.config.automaticReuse=true;
  let calls=0,added=false;const report=await runSemanticPackets(options,{...quiet,verifyPublication:()=>{if(!added){publicationLibrary(t,options);added=true;}},runner:async()=>{calls++;return {result:assigned?{packets:[author(4)]}:author(4),metrics:{...testMetrics,}};}});
  assert.equal(report.ok,true,JSON.stringify(report));assert.equal(calls,1);assert.ok(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.author.json')));
 }
});
test('retired cross-booklet discovery ignores old flags and never supplies library candidates',t=>{
 const options={...fixture(t),pages:[4]};options.manifest={...options.manifest,reviewProfile:'textbook-three-pass-v1',automaticReuse:true};options.config.automaticReuse=true;
 publicationLibrary(t,options);const task=createSemanticTasks(options)[0];
 assert.equal(task.reuseCandidates,undefined);assert.equal(task.reuseEnabled,undefined);
 assert.ok(!task.promptSections.some(s=>s.name==='automatic-reuse'));
 assert.doesNotMatch(task.prompt,/AUTOMATIC ACCEPTED-CONTENT REUSE/);
});

test('source, teaching and current guidance still hold publication after discovery retirement',async t=>{
 for(const change of ['source','teaching','guidance']){
  const options={...fixture(t),pages:[4]};options.manifest={...options.manifest,reviewProfile:'textbook-three-pass-v1'};options.config.automaticReuse=true;let calls=0;
  const report=await runSemanticPackets(options,{...quiet,verifyPublication:()=>{if(change==='guidance')options.config.pageEvidence={4:{note:'New current workflow guidance'}};else fs.appendFileSync(path.join(options.runDir,'evidence/pages/page-00'+(change==='source'?4:1)+'.png'),'changed');},runner:async()=>{calls++;return {result:author(4),metrics:{...testMetrics,}};}});
  assert.equal(report.ok,false,change);assert.equal(calls,1);assert.match(report.pages[0].error,/Source, corrections or review gates changed/);
 }
});

test('other-booklet acceptance changes cannot affect source-only authoring',async t=>{
 const options={...fixture(t),pages:[4]};options.manifest={...options.manifest,reviewProfile:'textbook-three-pass-v1'};options.config.automaticReuse=true;const f=publicationLibrary(t,options);assert.equal(createSemanticTasks(options)[0].reuseCandidates,undefined);let calls=0;
 const report=await runSemanticPackets(options,{...quiet,verifyPublication:()=>fs.writeFileSync(f.table,JSON.stringify({questions:{}})),runner:async()=>{calls++;return {result:author(4),metrics:{...testMetrics,}};}});assert.equal(report.ok,true,JSON.stringify(report));assert.equal(calls,1);
});
test('current workflow source correction holds an in-flight prepared generation',async t=>{
 const options={...fixture(t),pages:[4]};options.manifest={...options.manifest,reviewProfile:'textbook-three-pass-v1',workflowPolicy:'review-first-v1'};options.config.automaticReuse=true;fs.writeFileSync(path.join(options.runDir,'manifest.json'),JSON.stringify(options.manifest));const state={version:1,revision:0,reviewProfile:'textbook-three-pass-v1',pages:{4:{patterns:[]}},issues:{},corrections:[],representatives:{}};fs.mkdirSync(path.join(options.runDir,'workflow'));const file=path.join(options.runDir,'workflow/issues.json');fs.writeFileSync(file,JSON.stringify(state));let calls=0;
 const report=await runSemanticPackets(options,{...quiet,verifyPublication:()=>{state.corrections.push({id:'changed-source',status:'approved',reason:'Current source decision',patches:[{scope:'inventory',page:4,targetId:'src-4',field:'/description',original:'Solve the equation.',corrected:'Changed assessed source task.'}]});fs.writeFileSync(file,JSON.stringify(state));},runner:async()=>{calls++;return {result:author(4),metrics:{...testMetrics,}};}});assert.equal(report.ok,false,JSON.stringify(report));assert.equal(calls,1);assert.match(report.pages[0].error,/Source, corrections or review gates changed/);assert.ok(!fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.author.json')));
});


test('resumed authoring closes config-only continuations transitively without expanding unrelated pages',async t=>{
 const options=fixture(t);options.manifest.pipelinePolicy='pdf-import-efficient-v1';options.manifest.continuations=[];
 options.pages=[3];options.config.assignmentLimits={continuations:[{from:3,to:4,entryIds:['src-3','src-4']},{from:4,to:5,entryIds:['src-4','src-5']}]};
 const result=await runSemanticPackets({...options,dryRun:true},{...quiet,runner:()=>assert.fail('A dry run must not call a model')});
 assert.deepEqual(result.pages.map(p=>p.page),[3],'only the requested page is published');
 assert.deepEqual([...new Set(result.assignmentPlan.assignments.flatMap(a=>a.pages))].sort(),[3,4,5]);
 assert.equal(result.assignmentPlan.assignments.length,1,'the continued question stays indivisible');
});
