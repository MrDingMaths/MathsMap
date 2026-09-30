import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createSemanticTasks,runSemanticPackets,semanticCacheInfo,validateSemanticResult,wordExcerpts} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {compactTikzPrompt,hasTikzVisual} from '../scripts/booklet/token-efficient-prompts.mjs';
import {readAttemptReceipt,recordAttempt,summarizeAttemptEvents} from '../scripts/booklet/semantic-run-metrics.mjs';
import {applyMappingRepair,mappingRepairContext} from '../scripts/booklet/semantic-mapping-repair.mjs';
import {SHARED_DIAGRAM_FORMAT} from '../scripts/booklet/shared-diagram-authoring.mjs';
import {normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {attemptRepairContext,repairAttempt,applyAttemptPatches} from '../scripts/booklet/local-attempt-repair.mjs';
import {planTaskAssignments,runAuthorAssignment} from '../scripts/booklet/author-assignments.mjs';

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
const author=page=>({pageNumber:page,sections:[{id:`s-${page}`,title:'Equations',blocks:[{id:`b-${page}`,type:'question',content:{id:`q-${page}`,type:'question',prompt:'Solve.',answer:{short:'1',worked:'x=1'}}}]}],inventoryMappings:[{inventoryId:`src-${page}`,targetId:`q-${page}`}]});
const pageFrom=prompt=>Number(prompt.match(/Target page (\d+)/)[1]);
const quiet={log:()=>{}};

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
   return {result:{packets:[author(4)]},metrics:{provider:'test',externalModelCalls:0}};
  }});
 assert.equal(result.packets.length,1);assert.equal(fs.existsSync(path.join(slots,'0.json')),false);
 assert.equal(fs.readFileSync(path.join(slots,'1.json'),'utf8'),owners[1]);assert.equal(fs.readFileSync(path.join(slots,'2.json'),'utf8'),owners[2]);
});

test('three-pass inventory accepts a source checklist without legacy layout approvals and reuses it',async t=>{
 const options={...fixture(t),stage:'inventory',pages:[4]};
 options.manifest={...options.manifest,workflowPolicy:'review-first-v1',reviewProfile:'textbook-three-pass-v1'};
 fs.writeFileSync(path.join(options.runDir,'manifest.json'),JSON.stringify(options.manifest));
 fs.unlinkSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'));
 let calls=0;
 const runner=async()=>{calls++;return {result:inventory(4),metrics:{}};};
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
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>({result:inventory(4),metrics:{provider:'local-replay',externalModelCalls:0,usage:null,elapsedMs:0}})});
 assert.equal(report.ok,true);assert.equal(report.pages[0].metrics.externalModelCalls,0);
 assert.deepEqual(fs.readdirSync(slots).map(file=>fs.readFileSync(path.join(slots,file),'utf8')),before);
 assert.equal(JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.inventory.json'))).pageNumber,4);
 const badOptions={...fixture(t),stage:'inventory',pages:[4],attempt:2,localReplay:true};
 const invalid=await runSemanticPackets(badOptions,{...quiet,runner:async()=>({result:{pageNumber:4},metrics:{provider:'local-replay',externalModelCalls:0,usage:null}})});
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
 const failed=await runSemanticPackets(options,{...quiet,runner:async()=>{calls++;return {result:bad,metrics:{usage:{input_tokens:10,output_tokens:5}}};}});
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
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{}})});
 const request={page:4,fromAttempt:1,targets:[{targetId:'s-4',fields:['/blocks']}]},context=attemptRepairContext(options,request);
 const replacement=structuredClone(context.targets[0].original);replacement[0].id='changed-id';
 assert.throws(()=>applyAttemptPatches(bad,context,[{...context.targets[0],corrected:replacement,reason:'Bad identity change'}]),/preserve every content ID/);
 await assert.rejects(repairAttempt({...options,attempt:2},{context,patches:[]},quiet),/named reviewer/);
 fs.appendFileSync(path.join(options.runDir,'evidence/pages/page-004.txt'),'Changed source');
 assert.throws(()=>attemptRepairContext(options,request),/source inputs changed/);
});

test('local structural repair may update author review references without changing evidence or required values',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4),block=bad.sections[0].blocks[0];
 block.content.children=[{...block.content,id:'response',type:'part'}];delete block.content.answer;
 block.sourceReview={sourcePages:[4],sourceCompared:false,presentationRequirements:[{path:'/content/children/0/prompt',value:'Solve.'}],arrangements:[{targetId:'q-4',layout:'list',order:['response']}]};
 bad.inventoryMappings[0].targetId='missing';
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{}})});
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
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{}})});
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
 assert.throws(()=>createSemanticTasks({...options,manifest:{...options.manifest,effort:'xhigh'}}),/fresh Sol high/);
});

test('bounded workers resume completed pages, reject edited caches, and preserve failed retries',async t=>{
 const options=fixture(t);let active=0,peak=0,calls=0;
 const runner=async({prompt})=>{calls++;active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,10));active--;return {result:author(pageFrom(prompt)),metrics:{usage:{input_tokens:100,output_tokens:20}}};};
 const first=await runSemanticPackets(options,{...quiet,runner});
 assert.equal(first.ok,true);assert.equal(peak,2);assert.equal(calls,2);
 await runSemanticPackets(options,{...quiet,runner});assert.equal(calls,2);
 const task=createSemanticTasks(options)[0];assert.equal(semanticCacheInfo(task).kind,'hit');
 const original=fs.readFileSync(task.resultFile,'utf8');
 fs.writeFileSync(task.resultFile,original+' ');
 assert.equal(semanticCacheInfo(task).kind,'modified');
 await assert.rejects(()=>runSemanticPackets(options,{...quiet,runner}),/modified/);assert.equal(calls,2);
 fs.writeFileSync(task.resultFile,original);
 const retry=await runSemanticPackets({...options,pages:[4],attempt:2},{...quiet,runner:async()=>({result:{pageNumber:4},metrics:{}})});
 assert.equal(retry.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),original);
 assert.ok(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.author.2/prompt.md')));
});

test('explicit attempts resume matching successes and legacy results require review',async t=>{
 const options={...fixture(t),pages:[4]};let calls=0;
 const runner=async()=>{calls++;return {result:author(4),metrics:{}};};
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

test('source tables may map to populated native tables but not empty placeholders',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-table',kind:'diagram',description:'Outcome table'});
 const table={id:'native-table',type:'table',rows:[[{blocks:[{id:'heading',type:'paragraph',inlines:[{type:'text',text:'Outcome'}]}]}]]};
 a.sections[0].blocks.push({id:'table-block',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[table]}});
 a.inventoryMappings.push({inventoryId:'source-table',targetId:'native-table'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 table.rows=[];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
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
 a.sections[0].blocks.push({id:'grid-block',type:'question',content:grid});
 const mapping={inventoryId:'source-grid',targetId:grid.id,field:'/layout'};a.inventoryMappings.push(mapping);
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 mapping.field='/prompt';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
 mapping.field='/layout';grid.layout='stack';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('a concurrent canonical edit survives an in-flight transcription',async t=>{
 const options={...fixture(t),pages:[4]},task=createSemanticTasks(options)[0];
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>{
  fs.writeFileSync(task.resultFile,'user edit');return {result:author(4),metrics:{}};
 }});
 assert.equal(report.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),'user edit');
 assert.ok(fs.existsSync(path.join(task.out,'result.json')));
});

test('validation and publication failures retain model usage, phase outcomes and immutable generation',async t=>{
 const options={...fixture(t),pages:[4]},metrics={usage:{input_tokens:100,cached_input_tokens:60,output_tokens:25},elapsedMs:50};
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
  {attemptId,event:'phase-finished',phase:'generation',time:end,elapsedMs:end-start,metrics:{elapsedMs:100,usage:{input_tokens:10,cached_input_tokens:6,output_tokens:3}}},
  {attemptId,event:'finished',time:end},
 ]);
 const receipt=summarizeAttemptEvents(events);assert.equal(receipt.completedAttemptActiveWallMs,150);assert.equal(receipt.callElapsedMs,200);assert.equal(receipt.usage.input_tokens,20);assert.equal(receipt.usage.cached_input_tokens,12);
});

test('mapping-only repair preserves content and valid mappings, records reasons, and revalidates',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);
 bad.inventoryMappings.push({inventoryId:'p4-generated-heading',targetId:'s-4'});
 const metrics={usage:{input_tokens:30,output_tokens:10}};
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
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{}})});
 const report=await runSemanticPackets({...options,attempt:2,repairFrom:1},{...quiet,runner:async()=>({result:{edits:[{index:1,original:bad.inventoryMappings[1],replacement:null,reason:'Generated layout'}]},metrics:{}})});
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
 const raw=sharedAuthor(),report=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{usage:{output_tokens:20}}})});
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
 const disabled=await runSemanticPackets(options,{...quiet,runner:async()=>({result:raw,metrics:{usage:{output_tokens:20}}})});
 assert.equal(disabled.ok,false);assert.match(disabled.pages[0].error,/explicit config/);
 const enabled={...options,config:{...options.config,authoringFormat:SHARED_DIAGRAM_FORMAT},attempt:2};
 raw.inventoryMappings.push({inventoryId:'generated-heading',targetId:'s-4'});
 const failed=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{usage:{output_tokens:30}}})});
 assert.equal(failed.ok,false);assert.match(failed.pages[0].error,/Unknown inventory mapping/);
 const repair=await runSemanticPackets({...enabled,attempt:3,repairFrom:2},{...quiet,runner:async()=>({result:{edits:[{index:1,original:raw.inventoryMappings[1],replacement:null,reason:'Generated heading is not a source inventory entry.'}]},metrics:{usage:{output_tokens:5}}})});
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
   return {result:{...inventory(page),layoutPatterns:[{id:'plain',description:'Plain source question'}]},metrics:{}};
  }});
  await release;assert.equal(report.ok,success);assert.equal(fs.existsSync(canonical),success);if(!success)assert.match(report.pages[0].error,/review lock is busy/);
 }
});
