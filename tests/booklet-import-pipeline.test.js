import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createAssignmentPlan,mergeAssignmentPackets,planTaskAssignments,assignmentPayload} from '../scripts/booklet/author-assignments.mjs';
import {runSemanticPackets} from '../scripts/booklet/semantic-workflow.mjs';
import {attemptRepairContext,repairAttempt} from '../scripts/booklet/local-attempt-repair.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {ensurePdfRasters,validatePdfRasters,decodePpm} from '../scripts/booklet/pdf-rasters.mjs';
import {buildEditionComparison} from '../scripts/booklet/edition-comparison.mjs';
import {compactRepresentativePages,selectRepresentativeCases,REPRESENTATIVE_COVERAGE} from '../scripts/booklet/efficiency-tools.mjs';
import {recordVerification,verificationDependencies,verificationStatus,PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
import {approveCoverage,pageGate,representativeKey} from '../scripts/booklet/workflow-review.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const reference=file=>({path:file,hash:hash(fs.readFileSync(file))});
function temp(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'import-pipeline-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
const inv=(page,n=5)=>({pageNumber:page,inventoried:true,entries:Array.from({length:n},(_,i)=>({id:`p${page}-q${i}`,targetId:`q${page}-${i}`,kind:'question',description:'Solve x+1=2',expectedAnswer:'1'}))});
const packet=(page,entries,id='s')=>({pageNumber:page,sections:[{id,title:'Algebra',phase:'practice',blocks:entries.filter(e=>e.kind==='question').map(e=>({id:e.targetId+'-block',type:'question',content:{id:e.targetId,type:'question',prompt:'Solve x+1=2.',answer:{short:'1',worked:'x=1'}}}))}],inventoryMappings:entries.map(e=>({inventoryId:e.id,targetId:e.targetId}))});
test('assignments bound whole questions, preserve descendants, activities and continuations',()=>{
 const a=inv(1);a.entries.splice(1,0,{id:'p1-q0-a',parentId:'p1-q0',kind:'part',description:'Explain'});
 const p=createAssignmentPlan([a]);assert.deepEqual(p.assignments.map(a=>a.questions),[4,1]);assert.ok(p.assignments[0].inventoryIds.includes('p1-q0-a'));
 assert.deepEqual(p,createAssignmentPlan([a]));
 const linked=createAssignmentPlan([a,inv(2,1)],{continuations:[[1,2]]});assert.equal(linked.assignments.length,1);assert.equal(linked.assignments[0].oversized,true);
 assert.throws(()=>createAssignmentPlan([a],{continuations:[[1,2]]}),/every source inventory/);
 const large=inv(3,1);large.entries[0].description='x'.repeat(25000);assert.equal(createAssignmentPlan([large]).assignments[0].oversized,true);
});
test('merging rejects ownership and mapping mistakes',()=>{
 const inventory=inv(1),plan=createAssignmentPlan([inventory]),fragments=plan.assignments.map(a=>({assignment:a,packet:packet(1,a.entries,a.id)}));
 assert.equal(mergeAssignmentPackets(inventory,fragments).inventoryMappings.length,5);
 assert.deepEqual(mergeAssignmentPackets(inventory,[...fragments].reverse()),mergeAssignmentPackets(inventory,fragments));
 assert.throws(()=>mergeAssignmentPackets(inventory,fragments.slice(0,1)),/Incomplete assignment/);
 assert.throws(()=>mergeAssignmentPackets(inventory,[...fragments,fragments[0]]),/Duplicate assignment/);
 const bad=structuredClone(fragments);bad[0].packet.inventoryMappings.push({inventoryId:'other',targetId:'q'});assert.throws(()=>mergeAssignmentPackets(inventory,bad),/Out-of-assignment/);
 const duplicate=structuredClone(fragments);duplicate[0].packet.inventoryMappings.push(duplicate[0].packet.inventoryMappings[0]);assert.throws(()=>mergeAssignmentPackets(inventory,duplicate),/Duplicate inventory/);
});

test('shared guidance is referenced once and a context page never imports unrelated question repairs',t=>{
 const dir=temp(t),inventory=inv(1,5),task={page:1,inventory,packetRoot:dir,promptSections:[{name:'contract',text:'Contract'},{name:'supplement',text:'Shared teaching guidance. '.repeat(2000)}],images:[],evidence:[],contextPages:[1],teacherPages:[],editorial:{corrections:[{id:'unrelated',patches:[{targetId:'q1-4',page:1,field:'/prompt'}],reason:'Unrelated question'}],currentValues:[{targetId:'q1-4',page:1,field:'/prompt',key:'other'}]}};
 inventory.groups=[{id:'shared-stem',instruction:'Simplify each expression.',questionIds:['p1-q0','p1-q1','p1-q2']}];
 const plan=planTaskAssignments([task]),payload=assignmentPayload(plan.assignments[0],[task]);
 assert.equal(plan.assignments.length,2);assert.ok(payload.promptStats.sections.assignment<24000);assert.equal(payload.resources.length,1);assert.equal(payload.context.decisions.length,0);assert.equal(payload.context.currentValues.length,0);assert.equal(payload.context.groups[0].instruction,'Simplify each expression.');assert.equal(payload.prompt.includes(task.promptSections[1].text),false);
});
test('failed assignment repair reuses successful work and publishes one validated page',async t=>{
 const runDir=temp(t),inventory=inv(1);fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages/page-001.'+ext),'Synthetic source');
 fs.writeFileSync(path.join(runDir,'semantic-packets/page-001.inventory.json'),JSON.stringify(inventory));
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1],pipelinePolicy:PIPELINE_POLICY},config:{title:'Algebra',topics:[{id:'algebra',title:'Algebra',start:1,end:1}]},stage:'author',pages:[1]};
 let calls=0;const runner=async({prompt})=>{calls++;const context=JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n')+2)),a=context.assignment;const p=packet(1,a.inventory,a.id);if(calls===2)p.inventoryMappings[0].targetId='missing';return {result:{packets:[p]},metrics:{usage:{input_tokens:10,output_tokens:5}}};};
 const failed=await runSemanticPackets(options,{runner,log:()=>{}});assert.equal(failed.ok,false);assert.equal(calls,2);
 const id=createAssignmentPlan([inventory]).assignments[1].id;
 const context=attemptRepairContext(options,{page:1,assignmentId:id,fromAttempt:1,targets:[{targetId:'$packet',fields:['/inventoryMappings']}]});
 const record={context,patches:[{...context.targets[0],corrected:[{inventoryId:'p1-q4',targetId:'q1-4'}],reason:'Restore the existing content target'}],review:{reviewer:'Regression fixture',note:'Synthetic exact-field repair',artifacts:[context.evidence[0]]}};
 const stale=structuredClone(record);stale.patches[0].original=[];await assert.rejects(()=>repairAttempt({...options,attempt:2},stale),/original/);
 await repairAttempt({...options,attempt:2},record);
 const result=await runSemanticPackets({...options,attempt:2,regenerationReason:'Assemble repaired and cached assignments'},{runner:()=>assert.fail('No model retry expected'),log:()=>{}});
 assert.equal(result.ok,true,JSON.stringify(result));assert.equal(calls,2);
 const saved=JSON.parse(fs.readFileSync(path.join(runDir,'semantic-packets/page-001.author.json')));assert.equal(saved.sections.flatMap(s=>s.blocks).length,5);
});
test('PDF images, comparisons and footers share rasters and recover independently',async t=>{
 const dir=temp(t),pdf=path.join(dir,'test.pdf');fs.writeFileSync(pdf,'Synthetic PDF');let calls=0;
 const render=()=>{calls++;return Buffer.concat([Buffer.from('P6\n2 3\n255\n'),Buffer.alloc(18,10)]);};
 const options={render,engine:'Synthetic raster engine'},out=path.join(dir,'rasters');
 const first=ensurePdfRasters(reference(pdf),2,out,options),manifest={version:2,pdf:reference(pdf),pages:[{page:1},{page:2}],...first};
 assert.equal(calls,2);assert.equal(first.rasterization.footerSheets.length,1);validatePdfRasters(manifest);
 fs.unlinkSync(first.images[0].path);ensurePdfRasters(reference(pdf),2,out,options);assert.equal(calls,2);
 fs.writeFileSync(first.images[1].raster.path,'broken');ensurePdfRasters(reference(pdf),2,out,options);assert.equal(calls,3);
 const forged=structuredClone(manifest);forged.images[0].path=pdf;forged.images[0].hash=reference(pdf).hash;assert.throws(()=>validatePdfRasters(forged),/does not represent/);
 const editions={};for(const edition of ['student','short','worked','with-short','with-worked']){const m={...manifest,mode:'full',passed:true,edition,projectHash:'p',renderer:'r',workflowKey:'w'},file=path.join(dir,edition+'.json');fs.writeFileSync(file,JSON.stringify(m));editions[edition]={manifest:reference(file)};}
 const compared=await buildEditionComparison(editions,path.join(dir,'comparison'),{engine:options.engine,render:()=>assert.fail('Comparison must reuse export rasters')});assert.equal(compared.rendered,0);assert.equal(compared.reused,10);
 fs.appendFileSync(pdf,'changed');assert.throws(()=>validatePdfRasters(manifest),/stale/);
 assert.equal(decodePpm(render()).pixels[0],10);
});
test('coverage selection is deterministic and an uninspected plan does not unlock bulk work',t=>{
 assert.deepEqual(compactRepresentativePages([{id:'a',pages:[1,3]},{id:'b',pages:[2,3]},{id:'c',pages:[2,4]}]),[1,2]);
 const selected=selectRepresentativeCases({inventoryKeys:{1:'one',2:'two'},patterns:[{id:'p',pages:[1,2],representativePage:1,inventoryKey:'one',key:'old'}],coverage:[{id:'spacing',status:'planned',candidatePages:[2,3],exceptionPages:[4]}]});
 assert.deepEqual(selected.representativePages,[2,4]);assert.deepEqual(selected.coverage[0].pages,[2,4]);
 assert.equal(selected.patterns[0].inventoryKey,'two');assert.equal(selected.patterns[0].key,undefined);
 for(const id of ['fraction-step-spacing','equation-to-prose-spacing','venn-purposeful-shading','number-line-labels','editor-display'])assert.ok(REPRESENTATIVE_COVERAGE.includes(id));
 const dir=temp(t),file=path.join(dir,'review.txt');fs.writeFileSync(file,'Synthetic review');
 const state={pipelinePolicy:PIPELINE_POLICY,pages:{1:{inventoryHash:'i',authorHash:'a',patterns:[],mathReview:{key:'i'}}},issues:{},representatives:{},verification:{representativePlan:{coverage:[{id:'fraction-step-spacing',status:'planned',pages:[1]}]}}};
 assert.ok(pageGate(state,1,{authoring:true}).some(r=>r.includes('inspection pending')));
 state.pages[2]={inventoryHash:'i2',authorHash:'a2',patterns:[],mathReview:{key:'i2'}};
 assert.ok(pageGate(state,2,{authoring:true,representative:true}).some(r=>r.includes('limited to')));
 const keys={1:representativeKey(state,1)};approveCoverage(state,{id:'fraction-step-spacing',keys,renderer:'test',reviewer:'Fixture',note:'Synthetic observation',artifacts:[reference(file)],finalSize:true,sourceCompared:true},'test');
 assert.equal(state.verification.coverage['fraction-step-spacing'].keys[1],keys[1]);
 assert.throws(()=>approveCoverage(state,{id:'fraction-step-spacing',keys:{}},'test'),/Review needs/);
});
test('verification is dependency-bound, question-specific and requires postpublication checks',t=>{
 const dir=temp(t),file=path.join(dir,'proof.json');fs.writeFileSync(file,'{}');
 const project={id:'p',settings:{},sections:[{phase:'practice',blocks:[{id:'q',type:'question',content:{prompt:'Solve',answer:{short:'1'}}}]}]};
 const state={pipelinePolicy:PIPELINE_POLICY,pages:{1:{inventoryHash:'i',mathReview:{key:'i'}}},issues:{},finalReview:{},verification:{version:1,entries:{}}};
 const deps=verificationDependencies(state,project,{renderer:'r'});state.settled={project:{hash:deps.project}};
 const common={reviewer:'Fixture',note:'Synthetic evidence',artifacts:[reference(file)],outcome:'passed'};
 recordVerification(state,{...common,id:'question:q',dependencies:{question:deps.questions.q},checks:{answer:true,skillMapping:true,taughtMethod:true}},deps);
 for(const id of ['ui','regressions','build','storage'])recordVerification(state,{...common,id,dependencies:{...deps},checks:{filtering:true,solutions:true,worksheet:true,saveReopen:true,ownershipSync:true}},deps);
 assert.equal(verificationStatus(state,project,{renderer:'r'}).ok,true);
 assert.equal(verificationStatus(state,project,{renderer:'r',phase:'complete'}).ok,false);
 for(const id of ['publication','readback','repeat-import'])recordVerification(state,{...common,id,dependencies:{project:deps.project}},deps);
 assert.equal(verificationStatus(state,project,{renderer:'r',phase:'complete'}).ok,true);
 state.verification.entries.regressions.dependencies.authoring='outdated';
 const stale=verificationStatus(state,project,{renderer:'r'});assert.equal(stale.ok,false);assert.equal(stale.checks.find(c=>c.id==='question:q').passed,true);
 assert.equal(verificationStatus(state,project,{renderer:'new'}).checks.find(c=>c.id==='question:q').passed,true);
 project.sections[0].blocks[0].content.answer.short='2';assert.equal(verificationStatus(state,project,{renderer:'r'}).checks.find(c=>c.id==='question:q').passed,false);
 assert.equal(verificationStatus({},project).policy,'legacy');
});
