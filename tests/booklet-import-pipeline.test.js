import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createAssignmentPlan,mergeAssignmentPackets,planTaskAssignments,assignmentPayload} from '../scripts/booklet/author-assignments.mjs';
import {createSemanticTasks,runSemanticPackets} from '../scripts/booklet/semantic-workflow.mjs';
import {coalescePacketContinuations} from '../scripts/booklet/packet-continuations.mjs';
import {inspectContentCoverage} from '../src/lib/booklet-content-verification.js';
import {decisionInventoryIds} from '../scripts/booklet/editorial-context.mjs';
import {contentProject} from '../src/lib/booklet-source-content.js';
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
test('difficulty categories permit bounded batches while shared activities stay whole',()=>{
 for(const header of ['FOUNDATION','DEVELOPMENT','MASTERY']){
  const inventory=inv(1,5);
  inventory.groups=[{id:'difficulty',kind:'practice',header,members:inventory.entries.map(e=>e.id)}];
  for(const entry of inventory.entries)entry.parentId='difficulty';
  inventory.entries.push({id:'p1-q0-a',parentId:'p1-q0',kind:'part',description:'Explain the first result.'});
  const plan=createAssignmentPlan([inventory]);
  assert.deepEqual(plan.assignments.map(a=>a.questions),[4,1]);
  assert.ok(plan.assignments[0].inventoryIds.includes('p1-q0-a'));
  assert.ok(plan.assignments.every(a=>!a.oversized));
  inventory.groups[0].indivisible=true;
  const activity=createAssignmentPlan([inventory]);
  assert.equal(activity.assignments.length,1);
  assert.equal(activity.assignments[0].questions,5);
  assert.equal(activity.assignments[0].oversized,true);
 }
});
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

test('explicit question continuations keep both fragments together without absorbing unrelated pages',()=>{
 const a=inv(1),b=inv(2);
 a.entries.push({id:'p1-q4-a',parentId:'p1-q4',kind:'part',description:'First fragment'});
 b.entries.push({id:'p2-q0-b',parentId:'p2-q0',kind:'part',description:'Continued fragment'});
 const before=structuredClone([a,b]),continuation={from:1,to:2,entryIds:['p1-q4','p2-q0']};
 const plan=createAssignmentPlan([a,b],{continuations:[continuation]});
 assert.deepEqual(plan.assignments.map(a=>a.questions),[4,1,4]);
 assert.deepEqual(plan.assignments[1].pages,[1,2]);
 assert.deepEqual(new Set(plan.assignments[1].inventoryIds),new Set(['p1-q4','p1-q4-a','p2-q0','p2-q0-b']));
 assert.ok(plan.assignments.every(a=>!a.oversized));
 assert.equal(new Set(plan.assignments.flatMap(a=>a.inventoryIds)).size,a.entries.length+b.entries.length);
 assert.deepEqual([a,b],before);
 assert.throws(()=>createAssignmentPlan([a,b],{continuations:[{...continuation,entryIds:['p1-q4','missing']}]}),/question on every linked page/);
 assert.throws(()=>createAssignmentPlan([a,b],{continuations:[{...continuation,entryIds:['p1-q3','p1-q4']}]}),/question on every linked page/);
 assert.throws(()=>createAssignmentPlan([a,b],{continuations:[{...continuation,entryIds:['p1-q4','p2-q0-b']}]}),/question on every linked page/);
});

test('configured question continuations apply only to the selected authoring pages',async t=>{
 const runDir=temp(t);fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(const page of [1,2,3]){const stem='page-'+String(page).padStart(3,'0');for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',stem+'.'+ext),'Synthetic source');fs.writeFileSync(path.join(runDir,'semantic-packets',stem+'.inventory.json'),JSON.stringify(inv(page,page===3?1:5)));}
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1,2,3],continuations:[[1,2]],pipelinePolicy:PIPELINE_POLICY},config:{title:'Algebra',topics:[{id:'algebra',title:'Algebra',start:1,end:3}],assignmentLimits:{continuations:[{from:1,to:2,entryIds:['p1-q4','p2-q0']}]}},stage:'author',dryRun:true};
 const runner=()=>assert.fail('Planning must not call the model');
 const unrelated=await runSemanticPackets({...options,pages:[3]},{runner,log:()=>{}});assert.deepEqual(unrelated.assignmentPlan.assignments.map(a=>a.pages),[[3]]);
 const linked=await runSemanticPackets({...options,pages:[1]},{runner,log:()=>{}});assert.deepEqual(linked.assignmentPlan.assignments.map(a=>a.questions),[4,1,4]);assert.deepEqual(linked.assignmentPlan.assignments[1].inventoryIds,['p1-q4','p2-q0']);
});

test('a two-page six-part question survives assignment publication and assembles once with every source mapping',async t=>{
 const runDir=temp(t);fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 const inventories=[1,2].map(page=>({pageNumber:page,inventoried:true,entries:[{id:`p${page}-q`,kind:'question',description:'One question continued across two source pages.'},...Array.from({length:6},(_,i)=>({id:`p${page}-part-${i}`,parentId:`p${page}-q`,kind:'part',description:`Response ${i+1}`}))]}));
 for(const inventory of inventories){const stem='page-'+String(inventory.pageNumber).padStart(3,'0');for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',stem+'.'+ext),'Synthetic source');fs.writeFileSync(path.join(runDir,'semantic-packets',stem+'.inventory.json'),JSON.stringify(inventory));}
 const continuations=[{from:1,to:2,entryIds:['p1-q','p2-q']}],block={id:'whole-question',type:'question',sourceRefs:[{pageNumber:1},{pageNumber:2}],content:{id:'stem',type:'question',prompt:'One shared stem.',children:Array.from({length:6},(_,i)=>({id:'part-'+i,type:'part',prompt:`Part ${i+1}`,answer:{short:String(i),worked:`Result ${i}`}}))}};
 const packets=inventories.map(i=>({pageNumber:i.pageNumber,sections:[{id:'section-'+i.pageNumber,title:'Review',phase:'practice',blocks:[structuredClone(block)]}],inventoryMappings:i.entries.map((e,n)=>({inventoryId:e.id,targetId:n?'part-'+(n-1):'stem'})),answerEvidence:[{questionId:block.id,matchEvidence:'Same six source responses'}],...(i.pageNumber===2?{sharedContentContinuations:[{blockId:block.id,canonicalPageNumber:1,reason:'The stem is on page 1 and its six parts continue on page 2.'}]}:{})}));
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1,2],continuations:[[1,2]],pipelinePolicy:PIPELINE_POLICY},config:{contentScope:'practice-only',title:'Review',topics:[{id:'review',title:'Review',start:1,end:2}],assignmentLimits:{continuations}},stage:'author',pages:[1,2]};
 let calls=0;const generated=await runSemanticPackets(options,{log:()=>{},runner:async({prompt})=>{calls++;assert.match(prompt,/sharedContentContinuations/);return {result:{packets},metrics:{}};}});
 assert.equal(generated.ok,true,JSON.stringify(generated));assert.equal(calls,1);
 const published=[1,2].map(p=>JSON.parse(fs.readFileSync(path.join(runDir,'semantic-packets',`page-00${p}.author.json`))));
 const merged=coalescePacketContinuations(published,{continuations}),sections=merged.flatMap(p=>p.sections);
 assert.equal(sections.flatMap(s=>s.blocks).length,1);assert.equal(sections[0].blocks[0].content.children.length,6);assert.equal(merged[1].answerEvidence.length,0);
 const entries=merged.flatMap(p=>p.inventoryMappings.map(m=>({...inventories[p.pageNumber-1].entries.find(e=>e.id===m.inventoryId),...m,pageNumber:p.pageNumber})));
 assert.equal(entries.length,14);assert.equal(entries.filter(e=>e.continuationOf).length,7);
 const candidate={title:'Continued review',contentScope:'practice-only',topics:[{id:'review',title:'Review'}],sections:sections.map(s=>({...s,topicId:'review'})),sourceInventory:{selectedPages:[1,2],pages:[{pageNumber:1,inventoried:true},{pageNumber:2,inventoried:true}],entries}};
 const project=contentProject(candidate,{runId:'continued-source',projectId:'continued-review',selectedPages:[1,2]});
 const coverage=await inspectContentCoverage(project);
 assert.equal(coverage.rows.length,14);assert.equal(coverage.issues.some(i=>['duplicate','missing','missing-inventory'].includes(i.kind)),false,JSON.stringify(coverage.issues));
 const actualQuestions=project.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question');assert.equal(actualQuestions.length,1);assert.equal(actualQuestions[0].content.children.length,6);assert.deepEqual(actualQuestions[0].sourceRefs,[{pageNumber:1},{pageNumber:2}]);
 assert.equal(project.source.inventory.entries.filter(e=>e.continuationOf).length,7);
 assert.deepEqual(published,packets.map(p=>({...p,findings:[],corrections:[]})));
 const changed=structuredClone(published);changed[1].sections[0].blocks[0].content.children[5].answer.short='WRONG';assert.throws(()=>coalescePacketContinuations(changed,{continuations}),/copies disagree/);
 assert.throws(()=>coalescePacketContinuations(published),/outside the declared/);
 const missing=structuredClone(published);delete missing[1].sharedContentContinuations;assert.throws(()=>coalescePacketContinuations(missing,{continuations}),/explicit continuation/);
 const foreign=structuredClone(published);foreign[1].sharedContentContinuations[0].blockId='unowned';assert.throws(()=>coalescePacketContinuations(foreign,{continuations}),/explicit continuation/);
});

test('declared group and target anchors preserve every descendant without adding ownership',()=>{
 const inventory={pageNumber:5,groups:[{id:'information',header:'Summary Statistics'}],entries:[
  {id:'heading',kind:'teaching',parentId:'information'},
  {id:'instruction',targetId:'grid',kind:'teaching',parentId:'information'},
  {id:'part-a',kind:'part',parentId:'grid'},
  {id:'part-b',kind:'part',parentId:'grid'},
  {id:'other',kind:'question'}
 ]};
 const plan=createAssignmentPlan([inventory],{maxCharacters:1});
 assert.deepEqual(plan.assignments.map(a=>a.inventoryIds),[['heading','instruction','part-a','part-b'],['other']]);
 assert.equal(plan.assignments[0].oversized,true);
 assert.deepEqual(inventory.entries.map(e=>e.id),['heading','instruction','part-a','part-b','other']);
 const invalid=structuredClone(inventory);invalid.entries[2].parentId='undeclared-grid';
 assert.throws(()=>createAssignmentPlan([invalid]),/Missing shared\/continuation inventory dependency: undeclared-grid/);
 const task={page:5,inventory,promptSections:[],images:[],evidence:[],contextPages:[],teacherPages:[]};
 const payload=assignmentPayload(plan.assignments[0],[task]);
 assert.equal(payload.context.groups[0].header,'Summary Statistics');
 assert.deepEqual(payload.context.assignment.inventory.map(e=>e.id),plan.assignments[0].inventoryIds);
});

test('practice categories retain provenance without joining independent questions',()=>{
 const inventory=inv(6,7);
 inventory.groups=[{id:'category-metadata',entryId:'category',kind:'practice-category',members:inventory.entries.map(e=>e.id)}];
 inventory.entries.unshift({id:'category',targetId:'category-heading',kind:'group',description:'Additional practice'});
 for(const entry of inventory.entries.slice(1))entry.parentId='category';
 const before=structuredClone(inventory),plan=createAssignmentPlan([inventory]);
 assert.deepEqual(plan.assignments.map(a=>a.questions),[4,3]);
 assert.ok(plan.assignments.every(a=>!a.oversized));
 assert.deepEqual(plan.assignments.flatMap(a=>a.inventoryIds),inventory.entries.map(e=>e.id));
 assert.deepEqual(inventory,before);
 inventory.groups[0]={...inventory.groups[0],kind:'practice',header:'additional practice'};
 assert.deepEqual(createAssignmentPlan([inventory]).assignments.map(a=>a.questions),[4,3]);
 // Some inventories retain the heading separately from group metadata.
 delete inventory.groups[0].entryId;
 assert.deepEqual(createAssignmentPlan([inventory]).assignments.map(a=>a.questions),[4,3]);
});

test('numbered multipart identity takes precedence over a difficulty header',()=>{
 const inventory={pageNumber:25,entries:[{id:'p25-q3',targetId:'p25-q3',kind:'question',description:'Calculate the area of these parallelograms.'}],groups:[{id:'p25-q3',kind:'practice',header:'DEVELOPMENT',sourceLabel:'3',parts:['a','b','c']}]};
 for(const label of ['a','b','c'])inventory.entries.push({id:'p25-q3-'+label,kind:'part',parentId:'p25-q3'},{id:'p25-q3-'+label+'-diagram',kind:'diagram',parentId:'p25-q3-'+label});
 const before=structuredClone(inventory),plan=createAssignmentPlan([inventory],{maxCharacters:1});
 assert.equal(plan.assignments.length,1);assert.equal(plan.assignments[0].questions,1);assert.equal(plan.assignments[0].oversized,true);assert.deepEqual(plan.assignments[0].inventoryIds,inventory.entries.map(e=>e.id));assert.deepEqual(inventory,before);
 const category=inv(26,3);category.entries.unshift({id:'development',kind:'group',sourceLabel:'Development'});for(const entry of category.entries.slice(1))entry.parentId='development';category.groups=[{id:'development',kind:'practice',header:'Development',members:category.entries.slice(1).map(e=>e.id)}];
 assert.deepEqual(createAssignmentPlan([category],{maxQuestions:2}).assignments.map(a=>a.questions),[2,1]);
});

test('shared printed ranges count as whole questions and remain intact at category boundaries',()=>{
 const inventory=inv(7,8);
 inventory.groups=[{id:'category',kind:'practice-category',members:inventory.entries.map(e=>e.id)}];
 for(const entry of inventory.entries)entry.parentId='category';
 for(const entry of inventory.entries.slice(0,5))entry.sharedStemId='shared-range';
 const plan=createAssignmentPlan([inventory],{maxQuestions:2});
 assert.deepEqual(plan.assignments.map(a=>a.questions),[2,2]);
 assert.deepEqual(plan.assignments[0].inventoryIds,inventory.entries.slice(0,6).map(e=>e.id));
 assert.ok(plan.assignments.every(a=>!a.oversized));
 inventory.entries[0].sharedStemId='category';
 assert.throws(()=>createAssignmentPlan([inventory]),/category cannot be a shared question stem/);
});

test('tight context budgets cannot strand category headings or absorb the next category',()=>{
 const inventory=inv(8,4),first={id:'first-heading',kind:'group',sourceLabel:'essential problems',description:'Essential problems'},second={id:'second-heading',kind:'group',sourceLabel:'enrichment',description:'Enrichment'};
 inventory.entries.splice(0,0,first);inventory.entries.splice(3,0,second);
 inventory.entries.find(e=>e.id==='p8-q0').sharedStemId='first-range';inventory.entries.find(e=>e.id==='p8-q1').sharedStemId='first-range';
 const before=structuredClone(inventory),plan=createAssignmentPlan([inventory],{maxCharacters:1});
 assert.deepEqual(plan.assignments.map(a=>a.inventoryIds),[['first-heading','p8-q0','p8-q1'],['second-heading','p8-q2'],['p8-q3']]);
 assert.deepEqual(plan.assignments.map(a=>a.questions),[1,1,1]);assert.deepEqual(inventory,before);
 const trailing=structuredClone(inventory);trailing.entries.push({id:'empty-heading',kind:'group',description:'Additional practice'});
 assert.throws(()=>createAssignmentPlan([trailing]),/explicit first question: empty-heading/);
});

test('required guidance is self-contained and a context page never imports unrelated question repairs',t=>{
 const dir=temp(t),inventory=inv(1,5),task={page:1,inventory,packetRoot:dir,promptSections:[{name:'contract',text:'Contract'},{name:'supplement',text:'Shared teaching guidance. '.repeat(200)}],images:[],evidence:[],contextPages:[1],teacherPages:[],editorial:{corrections:[{id:'unrelated',patches:[{targetId:'q1-4',page:1,field:'/prompt'}],reason:'Unrelated question'}],currentValues:[{targetId:'q1-4',page:1,field:'/prompt',key:'other'}]}};
 inventory.groups=[{id:'shared-stem',instruction:'Simplify each expression.',questionIds:['p1-q0','p1-q1','p1-q2']}];
 task.editorialDecisions=[{id:'retained',page:1,entryId:'p1-q0',status:'retained',reason:'The stated precision is intentional.'},{id:'unrelated',page:1,entryId:'p1-q4',status:'retained',reason:'Other question.'}];
 const plan=planTaskAssignments([task]),payload=assignmentPayload(plan.assignments[0],[task]);
 assert.equal(plan.assignments.length,2);assert.ok(payload.promptStats.sections.assignment<24000);assert.equal(payload.resources.length,1);assert.equal(payload.context.decisions.length,0);assert.equal(payload.context.currentValues.length,0);assert.equal(payload.context.groups[0].instruction,'Simplify each expression.');assert.equal(payload.prompt.includes(task.promptSections[1].text),true);
 assert.deepEqual(payload.context.resolutions.map(d=>d.id),['retained']);assert.equal(payload.context.resolutions[0].reason,'The stated precision is intentional.');
 task.promptSections[1].text='Required indivisible teaching context. '.repeat(1000);
 const large=planTaskAssignments([task]);assert.ok(large.assignments.every(a=>a.oversized));
 const complete=assignmentPayload(large.assignments[0],[task]);assert.ok(complete.promptStats.sections.assignment>24000);assert.ok(complete.prompt.includes(task.promptSections[1].text));
});

test('bounded author context follows explicit decision identities and assigned mathematical visuals',t=>{
 const inventory=inv(1,5);inventory.entries.forEach((e,i)=>e.sourceLabel=String(i+1));inventory.entries[4].description='Sketch the circle on coordinate axes.';
 const own={id:'own',page:1,message:JSON.stringify({questionId:'p1-q0'}),resolution:{reason:'Keep this required condition.'}},other={id:'other',page:1,message:JSON.stringify({questionId:'p1-q4'}),resolution:{reason:'Other question condition.'}};
 assert.deepEqual(decisionInventoryIds(own,inventory),['p1-q0']);
 assert.equal(decisionInventoryIds({message:'Q5 is mentioned in prose only.'},inventory),undefined);
 assert.equal(decisionInventoryIds({message:JSON.stringify({questionIds:['p1-q0','missing']})},inventory),undefined);
 assert.deepEqual(decisionInventoryIds({resolution:{questionMappings:[{questionLabel:'2B Q2–3'},{questionLabel:'2B Q5(a-e)'}]}},inventory),['p1-q1','p1-q2','p1-q4']);
 assert.equal(decisionInventoryIds({resolution:{questionMappings:[{questionLabel:'2B Q5–6'}]}},inventory),undefined);
 const task={page:1,inventory,packetRoot:temp(t),promptSections:[{name:'contract',text:'Contract'},{name:'diagrams',text:'Whole page has circle and graph guidance.'}],images:[],evidence:[],contextPages:[1,2],teacherPages:[],editorialDecisions:[own,other].map(i=>({id:i.id,page:i.page,reason:i.resolution.reason,inventoryIds:decisionInventoryIds(i,inventory)}))};
 task.editorialDecisions.push({id:'context',page:2,inventoryIds:['external-question'],reason:'Retain the referenced teaching correction.'});
 const plan=planTaskAssignments([task]),first=assignmentPayload(plan.assignments[0],[task]),last=assignmentPayload(plan.assignments[1],[task]);
 assert.deepEqual(first.context.resolutions.map(r=>r.id),['own','context']);assert.deepEqual(last.context.resolutions.map(r=>r.id),['other','context']);
 assert.match(first.resources.find(r=>r.name==='diagrams').text,/No TikZ visual/);
 assert.match(last.resources.find(r=>r.name==='diagrams').text,/Circle rules/);assert.match(last.resources.find(r=>r.name==='diagrams').text,/Graph\/coordinate rules/);
});

test('assignment workers receive page authoring contracts and complete taught evidence inline',t=>{
 const runDir=temp(t),inventory=inv(1,5);
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(const page of [1,2,3])for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',`page-${String(page).padStart(3,'0')}.${ext}`),page===1?'Source exercise':`Taught method on page ${page}: use the supplied table.`);
 fs.writeFileSync(path.join(runDir,'semantic-packets/page-001.inventory.json'),JSON.stringify(inventory));
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1],pipelinePolicy:PIPELINE_POLICY},config:{title:'Statistics',teachingImageLimit:1,topics:[{id:'stats',title:'Statistics',start:1,end:1,teachingPages:[2,3]}]},stage:'author',pages:[1]};
 const task=createSemanticTasks(options)[0],plan=planTaskAssignments([task]),payload=assignmentPayload(plan.assignments[0],[task]);
 for(const name of ['execution','first-pass-patterns','teaching','diagrams','source'])assert.ok(payload.prompt.includes(task.promptSections.find(s=>s.name===name).text),`Missing inline ${name}`);
 assert.equal(payload.prompt.split('FIRST-PASS PRESENTATION CONTRACT').length,2);
 assert.ok(payload.prompt.includes('Taught method on page 3')); // Beyond the attached preview.
 assert.ok(payload.resources.some(r=>r.name==='envelope'&&r.text.includes('Map EVERY assigned non-excluded inventory item')));
 assert.match(payload.prompt,/headingStyle:"page-title\|none"/);assert.doesNotMatch(payload.prompt,/headingStyle:"none"/);
 assert.match(payload.prompt,/Never emulate a main band as a body table/);
 assert.match(payload.prompt,/sourceAtom teaching header/);
 assert.match(payload.prompt,/CARD SLOT ID/);assert.match(payload.prompt,/populated native table ID/);assert.match(payload.prompt,/native math\/cloze/);assert.match(payload.prompt,/populated scaffold/);assert.match(payload.prompt,/field:"\/layout"/);assert.match(payload.prompt,/JSON pointers relative to the target/);assert.match(payload.prompt,/canonical inventory exclusionReason/);
 assert.equal(payload.context.assignment.inventory.length,4);assert.equal(payload.context.assignment.inventory.some(e=>e.id==='p1-q4'),false);
 assert.equal(payload.promptStats.sections.assignment,JSON.stringify(payload.context).length+payload.promptStats.inlineGuidanceCharacters);
 const before=payload.inputHash;task.promptSections.find(s=>s.name==='teaching').text+=' Additional taught-method constraint.';
 assert.notEqual(assignmentPayload(plan.assignments[0],[task]).inputHash,before);
});

test('three-pass assignment workers receive classifications and handwriting guidance once',t=>{
 const runDir=temp(t),inventory=inv(1,2);
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',`page-001.${ext}`),'Algebra source');
 fs.writeFileSync(path.join(runDir,'semantic-packets/page-001.inventory.json'),JSON.stringify(inventory));
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1],pipelinePolicy:PIPELINE_POLICY,reviewProfile:'textbook-three-pass-v1'},config:{title:'Algebra',classificationSkillIds:['factorise-common-factor'],topics:[{id:'algebra',title:'Algebra',start:1,end:1}]},stage:'author',pages:[1]};
 const task=createSemanticTasks(options)[0],plan=planTaskAssignments([task]),payload=assignmentPayload(plan.assignments[0],[task]);
 for(const name of ['three-pass-precedence','classification','working-space','native-grouping']){
  const text=task.promptSections.find(s=>s.name===name).text;
  assert.equal(payload.prompt.split(text).length,2,`Missing or repeated ${name}`);
 }
 assert.match(payload.prompt,/factorise-common-factor/);
 assert.match(payload.prompt,/Foundation, Development and Mastery do not create native category headings/);
 assert.match(payload.prompt,/block.id must differ from content.id/);
 assert.match(payload.prompt,/toCellId is an arrow endpoint, not a box range/);
});

test('indivisible teaching and answer guidance counts in the budget without truncation',t=>{
 const inventory=inv(1,1),task={page:1,inventory,packetRoot:temp(t),promptSections:[{name:'contract',text:'Contract'},{name:'teaching',text:'Required taught method. '.repeat(800)},{name:'answer-page-8',text:'Teacher answer evidence. '.repeat(800)}],images:[],evidence:[],contextPages:[],teacherPages:[8]};
 const plan=planTaskAssignments([task]),payload=assignmentPayload(plan.assignments[0],[task]);
 assert.equal(plan.assignments.length,1);assert.equal(plan.assignments[0].oversized,true);assert.match(plan.assignments[0].exception,/Indivisible/);
 for(const section of task.promptSections)assert.ok(payload.prompt.includes(section.text));
 assert.ok(payload.promptStats.inlineGuidanceCharacters>24000);assert.equal(plan.assignments[0].variableCharacters,payload.promptStats.sections.assignment);
});
test('explicit reviewed question context scopes teaching evidence without changing inventory inputs',t=>{
 const runDir=temp(t),inventory=inv(1,2);
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(const page of [1,2,3])for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',`page-${String(page).padStart(3,'0')}.${ext}`),page===1?'Assigned source':`Distinct taught method ${page}`);
 fs.writeFileSync(path.join(runDir,'semantic-packets/page-001.inventory.json'),JSON.stringify(inventory));
 const reviewed=path.join(runDir,'scoped-review.json');fs.writeFileSync(reviewed,'Synthetic reviewed context-selection evidence');
 const config={title:'Scoped practice',topics:[{id:'review',title:'Review',start:1,end:1,teachingPages:[2,3]}]};
 const base={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1],pipelinePolicy:PIPELINE_POLICY},config,stage:'author',pages:[1]};
 const inventoryBefore=createSemanticTasks({...base,stage:'inventory'})[0].inputHash;
 config.authoringContextByInventoryId=Object.fromEntries(inventory.entries.map((e,i)=>[e.id,{entryHash:hash(JSON.stringify(e)),teachingPages:[i+2],note:'Synthetic source-specific mapping',evidence:reference(reviewed)}]));
 assert.equal(createSemanticTasks({...base,stage:'inventory'})[0].inputHash,inventoryBefore);
 const task=createSemanticTasks(base)[0],plan=planTaskAssignments([task],{maxQuestions:1}),first=assignmentPayload(plan.assignments[0],[task]),second=assignmentPayload(plan.assignments[1],[task]);
 assert.deepEqual(first.context.teaching[0].teachingPages,[2]);assert.deepEqual(second.context.teaching[0].teachingPages,[3]);
 assert.match(first.prompt,/Distinct taught method 2/);assert.doesNotMatch(first.prompt,/Distinct taught method 3/);
 const image=n=>path.join(runDir,'evidence/pages',`page-${String(n).padStart(3,'0')}.png`);
 assert.ok(first.images.includes(image(1)));assert.ok(first.images.includes(image(2)));assert.ok(!first.images.includes(image(3)));
 assert.ok(!first.context.evidence.some(e=>e.path===image(3)));
 fs.writeFileSync(path.join(runDir,'evidence/pages/page-003.txt'),'Changed unrelated teaching method');
 const updated=createSemanticTasks(base)[0];
 assert.equal(assignmentPayload(plan.assignments[0],[updated]).inputHash,first.inputHash);
 assert.notEqual(assignmentPayload(plan.assignments[1],[updated]).inputHash,second.inputHash);
 const missing=structuredClone(updated);delete missing.authoringContextSelections['p1-q0'];
 assert.throws(()=>assignmentPayload(plan.assignments[0],[missing]),/Missing or stale reviewed authoring context selection/);
 const stale=structuredClone(updated);stale.authoringContextSelections['p1-q0'].entryHash='0'.repeat(64);
 assert.throws(()=>assignmentPayload(plan.assignments[0],[stale]),/Missing or stale reviewed authoring context selection/);
 const empty=structuredClone(updated);empty.authoringContextSelections['p1-q0'].teachingPages=[];
 assert.throws(()=>assignmentPayload(plan.assignments[0],[empty]),/embedded-context rationale required/);
 fs.writeFileSync(reviewed,'Changed review evidence');
 assert.throws(()=>assignmentPayload(plan.assignments[0],[updated]),/context selection evidence changed/);
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
test('failed continuation repair retains configured question scope and cached unrelated assignments',async t=>{
 const runDir=temp(t);fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 const inventories=[1,2].map(page=>({pageNumber:page,inventoried:true,entries:[
  {id:`p${page}-q`,kind:'question',description:'Continued question'},
  {id:`p${page}-a`,parentId:`p${page}-q`,kind:'part',description:'One response'},
  {id:`p${page}-other`,targetId:`other-${page}`,kind:'question',description:'Unrelated question'}
 ]}));
 for(const i of inventories){const stem=`page-00${i.pageNumber}`;for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',stem+'.'+ext),'Synthetic source');fs.writeFileSync(path.join(runDir,'semantic-packets',stem+'.inventory.json'),JSON.stringify(i));}
 const continuations=[{from:1,to:2,entryIds:['p1-q','p2-q']}],correct='Result\n\nConclusion';
 const block={id:'whole-question',type:'question',sourceRefs:[{pageNumber:1},{pageNumber:2}],content:{id:'whole-root',type:'question',prompt:'One shared stem',children:[{id:'whole-a',type:'part',prompt:'Find the result',answer:{short:'1',worked:correct}}]}};
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1,2],continuations:[[1,2]],pipelinePolicy:PIPELINE_POLICY},config:{title:'Review',topics:[{id:'review',title:'Review',start:1,end:2}],assignmentLimits:{maxQuestions:1,continuations}},stage:'author',pages:[1,2]};
 let calls=0;
 const failed=await runSemanticPackets(options,{log:()=>{},runner:async({prompt})=>{
  calls++;const a=JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n')+2)).assignment;
  const packets=a.pages.map(page=>{
   const entries=a.inventory.filter(e=>e.pageNumber===page);
   if(!entries.some(e=>e.id===`p${page}-q`)){const result=packet(page,entries,a.id+'-'+page);if(page===2)result.inventoryMappings[0].targetId='missing';return result;}
   const copy=structuredClone(block);if(page===1)copy.content.children[0].answer.worked='Result\\n\nConclusion';
   return {pageNumber:page,sections:[{id:a.id+'-'+page,title:'Review',phase:'practice',blocks:[copy]}],inventoryMappings:entries.map(e=>({inventoryId:e.id,targetId:e.kind==='part'?'whole-a':'whole-root'})),...(page===2?{sharedContentContinuations:[{blockId:block.id,canonicalPageNumber:1,reason:'The question continues on page 2'}]}:{})};
  });return {result:{packets},metrics:{}};
 }});
 assert.equal(failed.ok,false);assert.equal(calls,3);
 const assignmentId=createAssignmentPlan(inventories,options.config.assignmentLimits).assignments.find(a=>a.inventoryIds.includes('p1-q')).id;
 const context=attemptRepairContext(options,{page:1,assignmentId,fromAttempt:1,targets:[{targetId:'whole-a',fields:['/answer/worked']}]});
 assert.equal(context.assignmentId,assignmentId);
 const record={context,patches:[{...context.targets[0],corrected:correct,reason:'Replace a literal newline escape with the existing correct continuation paragraph break'}],review:{reviewer:'Regression fixture',note:'Retain the complete shared question and unrelated successful assignments',artifacts:[context.evidence[0]]}};
 await repairAttempt({...options,attempt:2},record);
 const otherId=createAssignmentPlan(inventories,options.config.assignmentLimits).assignments.find(a=>a.inventoryIds.includes('p2-other')).id;
 const other=attemptRepairContext(options,{page:2,assignmentId:otherId,fromAttempt:1,targets:[{targetId:'$packet',fields:['/inventoryMappings']}]});
 assert.equal(other.assignmentId,otherId);
 await repairAttempt({...options,attempt:2},{context:other,patches:[{...other.targets[0],corrected:[{inventoryId:'p2-other',targetId:'other-2'}],reason:'Restore the existing unrelated question mapping without expanding ownership to the continuation'}],review:{reviewer:'Regression fixture',note:'Rebuild the continuation-page plan while retaining the unrelated immutable assignment payload',artifacts:[other.evidence[0]]}});
 const resumed=await runSemanticPackets({...options,attempt:2,regenerationReason:'Assemble repaired continuation and retained unrelated assignments'},{log:()=>{},runner:()=>assert.fail('Existing assignments must be reused')});
 assert.equal(resumed.ok,true,JSON.stringify(resumed));assert.equal(calls,3);
 const published=[1,2].map(page=>JSON.parse(fs.readFileSync(path.join(runDir,'semantic-packets',`page-00${page}.author.json`))));
 const merged=coalescePacketContinuations(published,{continuations});assert.equal(merged.flatMap(p=>p.sections.flatMap(s=>s.blocks)).length,3);
 const shared=merged.flatMap(p=>p.sections.flatMap(s=>s.blocks)).find(b=>b.id===block.id);assert.equal(shared.content.children[0].answer.worked,correct);
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
