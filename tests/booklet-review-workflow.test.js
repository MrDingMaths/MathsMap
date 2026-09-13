import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspectTriangle,triangleConstruction,measuredTriangle,verifyTriangleCode} from '../scripts/booklet/triangle-constraints.mjs';
import {loadWorkflow,liveWorkflow,updateWorkflow,registerInventory,registerAuthor,pageGate,recordMathReview,applyDecisions,approveRepresentative,representativeKey,settlementKey,settleWorkflow,acceptFinalReview,materializeCorrections,synchronizeProject,bytesHash,PATTERN_CHECKS,FINAL_EDITIONS,REVIEW_POLICY} from '../scripts/booklet/workflow-review.mjs';
import {rendererSignature} from '../scripts/booklet/verification-cache.mjs';
import {affectedPages,renderedPageHashes,projectReviewHash,validateFinalManifest} from '../scripts/booklet/page-review.mjs';
import {refreshRegister,correctionOutputs} from '../scripts/booklet/review-workflow.mjs';
import {createSemanticTasks,runSemanticPackets} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {synchronizeInventoryAmbiguities} from '../scripts/booklet/workflow-review.mjs';
import {createBookletProject,promoteProjectQuestion,saveBookletProject} from '../scripts/booklet/project-studio-server.mjs';

const exact=value=>({value,exact:true});
const triangle={type:'triangle',sides:{b:exact(5),c:exact(5)},angles:{A:exact(100)}};
const inv=page=>({pageNumber:page,inventoried:true,layoutPatterns:[{id:'short-question',description:'Single short prompt and response'}],entries:[{id:`src-${page}`,targetId:`q-${page}`,kind:'question',description:'Find x.'}]});
const author=page=>({pageNumber:page,sections:[{id:`s-${page}`,title:'Triangles',blocks:[{id:`b-${page}`,type:'question',content:{id:`q-${page}`,type:'question',prompt:'Find x.',answer:{short:'1',worked:'x=1'}}}]}],inventoryMappings:[{inventoryId:`src-${page}`,targetId:`q-${page}`}]});
test('explicit ancestor removal supersedes an old scaffold correction without accepting missing or edited content',()=>{
 const packet=author(1),node=packet.sections[0].blocks[0].content;
 node.prompt={blocks:[{id:'stem',text:'Find x.'},{id:'blank',width:145}]};
 const original=structuredClone(node);original.prompt.blocks[1].width=120;
 const corrected=structuredClone(original);corrected.prompt.blocks.pop();
 const state={corrections:[{status:'approved',patches:[{scope:'author',page:1,targetId:'blank',field:'/width',original:145,corrected:120}]},{status:'approved',patches:[{scope:'project',page:1,targetId:'b-1',field:'/content',original,corrected}]}]};
 const updated=materializeCorrections(packet,state,'project');
 assert.deepEqual(updated.sections[0].blocks[0].content,corrected);
 assert.deepEqual(materializeCorrections(updated,state,'project'),updated);
 const local=structuredClone(updated);local.sections[0].blocks[0].content.prompt.blocks[0].text='Local edit';
 assert.throws(()=>materializeCorrections(local,state,'project'),/Missing correction target/);
 const disconnected=structuredClone(state);disconnected.corrections[1].patches[0].original.prompt.blocks[1].width=99;
 assert.throws(()=>materializeCorrections(updated,disconnected,'project'),/Missing correction target/);
 assert.throws(()=>materializeCorrections(updated,{corrections:state.corrections.slice(0,1)},'project'),/Missing correction target/);
});
test('approved correction chains replay on saved content without hiding concurrent edits',()=>{
 const patch=(original,corrected)=>({scope:'author',page:1,targetId:'q-1',field:'/prompt',original,corrected});
 const state={corrections:[{id:'first',status:'approved',reason:'Approved source correction',sourceRefs:[{pageNumber:1}],patches:[patch('Find x.','Find y.')]},{id:'second',status:'approved',reason:'Approved follow-up correction',sourceRefs:[{pageNumber:1}],patches:[patch('Find y.','Find z.')]}]};
 const packet=author(1),updated=materializeCorrections(packet,state,'author',1);
 assert.equal(updated.sections[0].blocks[0].content.prompt,'Find z.');
 updated.sections[0].blocks[0].sourceReview={verification:{checked:true}};
 assert.deepEqual(materializeCorrections(updated,state,'author',1),updated);
 const edited=structuredClone(updated);edited.sections[0].blocks[0].content.prompt='My local edit';
 assert.throws(()=>materializeCorrections(edited,state,'author',1),/Stale correction/);
 const disconnected=structuredClone(state);disconnected.corrections[1].patches[0].original='Another original';
 assert.throws(()=>materializeCorrections(updated,disconnected,'author',1),/Stale correction/);
});
test('approved parent and descendant corrections replay without overwriting local edits',()=>{
 const packet=author(1),original=structuredClone(packet.sections[0].blocks[0].content);
 const corrected={...original,prompt:{type:'doc',blocks:[{id:'cloze',type:'paragraph',width:145,text:'Explain'}]}};
 const state={corrections:[{id:'parent',status:'approved',patches:[{scope:'author',page:1,targetId:'b-1',field:'/content',original,corrected}]},{id:'child',status:'approved',patches:[{scope:'author',page:1,targetId:'cloze',field:'/width',original:145,corrected:120}]}]};
 const updated=materializeCorrections(packet,state,'author',1);
 assert.equal(updated.sections[0].blocks[0].content.prompt.blocks[0].width,120);
 assert.deepEqual(materializeCorrections(updated,state,'author',1),updated);
 const edited=structuredClone(updated);edited.sections[0].blocks[0].content.prompt.blocks[0].text='Local edit';
 assert.throws(()=>materializeCorrections(edited,state,'author',1),/Stale correction/);
 const final=structuredClone(updated.sections[0].blocks[0].content);final.prompt.blocks[0].width=125;
 state.corrections.push({id:'ancestor',status:'approved',patches:[{scope:'author',page:1,targetId:'b-1',field:'/content',original:structuredClone(updated.sections[0].blocks[0].content),corrected:final}]});
 const last=materializeCorrections(packet,state,'author',1);
 assert.equal(last.sections[0].blocks[0].content.prompt.blocks[0].width,125);
 assert.deepEqual(materializeCorrections(last,state,'author',1),last);
 const local=structuredClone(last);local.sections[0].blocks[0].content.prompt.blocks[0].width=126;
 assert.throws(()=>materializeCorrections(local,state,'author',1),/Stale correction/);
});
test('source-review correction replay retains later acceptance but rejects changed arrangements',()=>{
 const packet=author(1);packet.sections[0].blocks[0].sourceReview={arrangements:[]};
 const corrected={arrangements:[{targetId:'q-1',layout:'grid'}]};
 const state={corrections:[{id:'review',status:'approved',patches:[{scope:'author',page:1,targetId:'b-1',field:'/sourceReview',original:{arrangements:[]},corrected}]}]};
 const updated=materializeCorrections(packet,state,'author',1);
 updated.sections[0].blocks[0].sourceReview.verification={checked:true,signature:'fresh'};
 updated.sections[0].blocks[0].sourceReview.visualAudit={checked:true};
 assert.deepEqual(materializeCorrections(updated,state,'author',1),updated);
 updated.sections[0].blocks[0].sourceReview.arrangements[0].layout='local-grid';
 assert.throws(()=>materializeCorrections(updated,state,'author',1),/Stale correction/);
});
function fixture(t){
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-review-'));
 t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(runDir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 for(let page=1;page<=2;page++){write(`evidence/pages/page-00${page}.png`,'source image '+page);write(`evidence/pages/page-00${page}.txt`,'Source '+page);write(`semantic-packets/page-00${page}.inventory.json`,inv(page));}
 const artifact=write('review.txt','Actual reviewer evidence fixture');
 const evidence={reviewer:'Test reviewer',note:'Source and output inspected in fixture',artifacts:[{path:artifact,hash:bytesHash(artifact)}]};
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,id:'review-fixture',workflowPolicy:REVIEW_POLICY,selectedPages:[1,2]},config:{title:'Triangles',topics:[{id:'triangles',title:'Triangles',start:1,end:2,teachingPages:[1]}]},stage:'author',pages:[1,2]};
 return {runDir,write,evidence,options};
}
function approveMath(state,evidence){recordMathReview(state,{...evidence,pages:Object.entries(state.pages).map(([page,p])=>({page:Number(page),key:p.inventoryHash}))});}
test('resolved source ambiguities propagate to every mapping and reopen on stale evidence',t=>{
 const {runDir,write,evidence}=fixture(t),state=loadWorkflow(runDir);
 const inventory=inv(1);inventory.entries[0].ambiguity='The intended angle is unclear.';
 registerInventory(state,inventory,'source-hash');
 const issue=Object.values(state.issues)[0];
 const entries=[inventory.entries[0],{...inventory.entries[0],id:'src-1-mapping-1'},{...inventory.entries[0],id:'src-1-derived-wrapper',derived:true,continuationOf:'src-1'}].map(e=>({...e,pageNumber:1}));
 synchronizeInventoryAmbiguities(entries,state);
 assert.equal(entries[0].ambiguous,inventory.entries[0].ambiguity);
 applyDecisions(state,{...evidence,expectedRevision:state.revision,key:settlementKey(state),resolutions:[{id:issue.id,status:'retained',reason:'The source arc identifies the intended angle.'}]});
 synchronizeInventoryAmbiguities(entries,state);
 for(const entry of entries){assert.equal(entry.ambiguous,undefined);assert.equal(entry.ambiguity,inventory.entries[0].ambiguity);assert.equal(entry.ambiguityResolution.issueId,issue.id);}
 issue.inputHash='stale';synchronizeInventoryAmbiguities(entries,state);
 assert.ok(entries.every(e=>e.ambiguous&&!e.ambiguityResolution));
 issue.inputHash=state.pages[1].inventoryHash;
 write('review.txt','changed evidence');synchronizeInventoryAmbiguities(entries,state);
 assert.ok(entries.every(e=>e.ambiguous&&!e.ambiguityResolution));
});
function representative(state,evidence,runtime=rendererSignature()){
 return {...evidence,pattern:'short-question',page:1,key:representativeKey(state,1),renderer:runtime,checks:Object.fromEntries(PATTERN_CHECKS.map(k=>[k,true])),sourceCompared:true,finalSize:true};
}

test('100-degree geometry is constructed numerically; a plausible 80-degree drawing is rejected',()=>{
 const construction=triangleConstruction(triangle);
 assert.ok(Math.abs(measuredTriangle(construction.vertices).angles.A-100)<1e-9);
 assert.equal(verifyTriangleCode(triangle,construction.coordinates).checked,true);
 const wrong=triangleConstruction({...triangle,angles:{A:exact(80)}});
 assert.throws(()=>verifyTriangleCode(triangle,wrong.coordinates),/authored .*80.*required 100/);
 assert.throws(()=>verifyTriangleCode(triangle,'[xscale=2]'+construction.coordinates),/Non-uniform/);
 assert.throws(()=>verifyTriangleCode(triangle,construction.coordinates+'\n\\coordinate (A) at (0,0);'),/exactly one/);
});

test('redundant measurements are retained and checked at stated precision',()=>{
 const rounded={...triangle,sides:{...triangle.sides,a:{value:7.7,quantum:0.1,redundant:true}}};
 const before=structuredClone(rounded);
 assert.equal(inspectTriangle(rounded).consistent,true);
 const actual=measuredTriangle(triangleConstruction(rounded).vertices);
 assert.ok(Math.abs(actual.angles.A-100)<1e-8,'rounded redundant side must not distort the specified angle');
 assert.deepEqual(rounded,before);
 const wrong={...rounded,sides:{...rounded.sides,a:exact(5)}};
 assert.ok(inspectTriangle(wrong).issues.some(i=>i.kind==='cosine-law'));
 assert.throws(()=>triangleConstruction(wrong),/satisfies all givens/);
 assert.ok(inspectTriangle({...triangle,sides:{b:5,c:5}}).issues.every(i=>i.kind==='unknown-precision'));
 assert.throws(()=>triangleConstruction({sides:{a:exact(5),b:exact(6)},angles:{A:exact(30)}}),/SSA-ambiguous/);
});

test('early mathematical findings block only affected pages, and unused givens do not become findings',t=>{
 const {runDir,evidence}=fixture(t),state=loadWorkflow(runDir),a=inv(1),b=inv(2);
 a.entries[0].mathematicalChecks=[{left:'2+3',right:'6',exact:true}];
 b.entries[0].redundantMeasurements=[{value:7}];
 registerInventory(state,a);registerInventory(state,b);
 const issue=Object.values(state.issues)[0];assert.equal(issue.page,1);
 assert.throws(()=>recordMathReview(state,{...evidence,pages:[{page:1,key:state.pages[1].inventoryHash}]}),/Resolve editorial/);
 recordMathReview(state,{...evidence,pages:[{page:2,key:state.pages[2].inventoryHash}]});
 assert.ok(pageGate(state,1,{representative:true}).some(r=>r.includes('Mathematical')));
 assert.ok(!pageGate(state,2).some(r=>r.includes('Mathematical')));
 applyDecisions(state,{...evidence,expectedRevision:0,key:settlementKey(state),resolutions:[{id:issue.id,status:'retained',reason:'Source discrepancy explicitly retained for discussion'}]});
 recordMathReview(state,{...evidence,pages:[{page:1,key:state.pages[1].inventoryHash}]});
 assert.deepEqual(pageGate(state,1,{representative:true}),[]);
 assert.throws(()=>applyDecisions(state,{...evidence,expectedRevision:99}),/stale/);
});

test('representative approval needs every physical-size check and is invalidated by content changes',t=>{
 const {runDir,evidence}=fixture(t),state=loadWorkflow(runDir);
 registerInventory(state,inv(1));registerInventory(state,inv(2));approveMath(state,evidence);
 assert.deepEqual(pageGate(state,1,{representative:true}),[]);
 assert.ok(pageGate(state,2,{representative:true}).some(r=>r.includes('Representative')));
 registerAuthor(state,inv(1),author(1));
 const record=representative(state,evidence,'fixture-renderer');
 const incomplete=structuredClone(record);delete incomplete.checks.writingBoxes;
 assert.throws(()=>approveRepresentative(state,incomplete,'fixture-renderer'),/writingBoxes/);
 assert.throws(()=>approveRepresentative(state,{...record,finalSize:false},'fixture-renderer'),/final-size/);
 approveRepresentative(state,record,'fixture-renderer');assert.deepEqual(pageGate(state,2),[]);
 const changed=author(1);changed.sections[0].blocks[0].content.prompt='New prompt';registerAuthor(state,inv(1),changed);
 assert.ok(pageGate(state,2).some(r=>r.includes('Representative')));
});

test('inventory ambiguities and later author correction proposals join the one pending register',t=>{
 const {runDir}=fixture(t),state=loadWorkflow(runDir),inventory=inv(1);
 inventory.entries[0].ambiguity='Stated precision is unclear';registerInventory(state,inventory);
 const packet=author(1);packet.corrections=[{targetId:'q-1',field:'/prompt',original:'Find x.',replacement:'Find y.',reason:'Possible source typo'}];
 registerAuthor(state,inventory,packet);
 assert.equal(Object.values(state.issues).filter(i=>i.status==='pending').length,2);
 assert.equal(state.issues['author-1-correction-0'].proposal.replacement,'Find y.');
 assert.ok(pageGate(state,1).includes('author-1-correction-0'));
 assert.ok(!pageGate(state,1,{authoring:true}).includes('author-1-correction-0'),'pending author findings must not block their own repair');
});

test('one correction bundle updates inventory, authored content and project, preserves originals, and invalidates only affected checks',t=>{
 const {runDir,evidence}=fixture(t),state=loadWorkflow(runDir),inventory=inv(1),packet=author(1);
 registerInventory(state,inventory);
 const correction={id:'source-correction',reason:'Confirmed source typo',sourceRefs:[{pageNumber:1}],patches:[
  {scope:'inventory',page:1,targetId:'src-1',field:'/description',original:'Find x.',corrected:'Find y.'},
  {scope:'author',page:1,targetId:'q-1',field:'/prompt',original:'Find x.',corrected:'Find y.'},
 ]};
 applyDecisions(state,{...evidence,expectedRevision:0,key:settlementKey(state),corrections:[correction]});
 const correctedInventory=materializeCorrections(inventory,state,'inventory',1),correctedPacket=materializeCorrections(packet,state,'author',1);
 assert.equal(correctedInventory.entries[0].description,'Find y.');assert.equal(correctedPacket.sections[0].blocks[0].content.prompt,'Find y.');
 assert.equal(inventory.entries[0].description,'Find x.');assert.equal(packet.sections[0].blocks[0].content.prompt,'Find x.');
 const project=structuredClone(packet);project.source={inventory:{entries:[{...inventory.entries[0],verification:{checked:true}}]}};
 project.sections[0].blocks[0].sourceReview={verification:{checked:true},visualAudit:{checked:true}};
 project.sections[0].blocks.push({...author(2).sections[0].blocks[0],sourceReview:{verification:{checked:true}}});
 const updated=materializeCorrections(project,state,'project');
 assert.equal(updated.source.inventory.entries[0].verification,undefined);
 assert.equal(updated.sections[0].blocks[0].sourceReview.verification,undefined);
 assert.equal(updated.sections[0].blocks[1].sourceReview.verification.checked,true);
 updated.sections[0].blocks[0].sourceReview.verification={checked:true};
 updated.source.inventory.entries[0].verification={checked:true};
 assert.deepEqual(materializeCorrections(updated,state,'project'),updated,'replaying an already applied correction must not erase fresh acceptance');
 const edited=structuredClone(project);edited.sections[0].blocks[0].content.prompt='Concurrent user edit';
 assert.throws(()=>materializeCorrections(edited,state,'project'),/Stale correction/);
 assert.equal(edited.sections[0].blocks[0].content.prompt,'Concurrent user edit');
});

test('current register separates issue history and does not resurrect resolved author findings',async t=>{
 const {runDir,write,evidence}=fixture(t),packet={...author(1),findings:[{id:'question',note:'Confirm wording'}]};
 write('semantic-packets/page-001.author.json',packet);
 await updateWorkflow(runDir,'inventory',state=>refreshRegister(runDir,[1,2],state));
 await updateWorkflow(runDir,'decision',state=>applyDecisions(state,{...evidence,expectedRevision:state.revision,key:settlementKey(state),resolutions:[{id:'author-1-question',status:'retained',reason:'Original wording confirmed'}]}));
 const state=liveWorkflow(runDir);
 assert.equal(state.issues['author-1-question'].status,'retained');
 const history=JSON.parse(fs.readFileSync(path.join(runDir,'workflow/history.json')));
 assert.equal(history.events[1].previousIssues['author-1-question'].status,'pending');
 const before=fs.readFileSync(path.join(runDir,'semantic-packets/page-001.author.json'),'utf8');
 correctionOutputs(runDir,[1,2],state);
 assert.equal(fs.readFileSync(path.join(runDir,'semantic-packets/page-001.author.json'),'utf8'),before);
});

test('a bundled correction closes its unchanged source finding during propagation, but later edits reopen it',t=>{
 const {runDir,write,evidence}=fixture(t),inventory={...inv(1),findings:[{id:'wording',message:'Confirm wording'}]};
 write('semantic-packets/page-001.inventory.json',inventory);
 const state=refreshRegister(runDir,[1],loadWorkflow(runDir)),id='inventory-1-wording';
 const key=settlementKey(state);
 applyDecisions(state,{...evidence,key,expectedRevision:0,corrections:[{id:'wording',reason:'Approved wording',sourceRefs:[{pageNumber:1}],patches:[{scope:'inventory',page:1,targetId:'src-1',field:'/description',original:'Find x.',corrected:'Find y.'}]}],resolutions:[{id,status:'corrected',correctionId:'wording',reason:'Confirmed replacement'}]});
 refreshRegister(runDir,[1],state,{decisions:[id]});
 assert.equal(state.issues[id].status,'corrected');
 refreshRegister(runDir,[1],state);assert.equal(state.issues[id].status,'corrected');
 assert.throws(()=>applyDecisions(state,{...evidence,key,expectedRevision:0}),/inputs changed/);
 write('semantic-packets/page-001.inventory.json',{...inventory,palette:['new evidence']});
 refreshRegister(runDir,[1],state);assert.equal(state.issues[id].status,'pending');
});

test('project propagation refreshes only workflow flags and uses the normal bank-safe save',async t=>{
 const {runDir}=fixture(t),options={projectRoot:path.join(runDir,'projects'),bankRoot:path.join(runDir,'bank'),moduleRoot:path.join(runDir,'modules')};
 let project=createEditableProject({id:'review-bank-owner',title:'Original'});
 const block=createProjectBlock('question');block.id='q-owner';block.classification={primarySkillId:'solve-linear-1-step'};
 block.content.prompt='Solve $x+1=3$';block.content.answer={short:'2',worked:'$x=2$',solutionDiagrams:[]};
 project.sections[0].blocks=[block];project.source={runId:'fixture-run'};
 project.studio={version:1,flags:[{id:'user-note',note:'Keep this independent flag',resolved:true},{id:'old-workflow',workflowIssue:true,note:'Old pending statement',resolved:false}]};
 project=await createBookletProject(project,options);
 const published=await promoteProjectQuestion(project.id,{blockId:block.id,mode:'create'},options);project=published.project;
 const content=project.sections[0].blocks[0].content,state=loadWorkflow(runDir);
 state.corrections=[{id:'corrected-sum',status:'approved',reason:'Confirmed source correction',sourceRefs:[{pageNumber:1}],patches:[
  {scope:'author',page:1,targetId:content.id,field:'/prompt',original:'Solve $x+1=3$',corrected:'Solve $x+1=4$'},
  {scope:'author',page:1,targetId:content.id,field:'/answer/short',original:'2',corrected:'3'},
  {scope:'author',page:1,targetId:content.id,field:'/answer/worked',original:'$x=2$',corrected:'$x=3$'},
 ]}];
 const corrected=synchronizeProject(project,state,[],'fixture-run');
 assert.equal(corrected.studio.flags.length,1);assert.equal(corrected.studio.flags[0].id,'user-note');
 const saved=await saveBookletProject(corrected,{...options,expectedRevision:project.revision});
 const bank=JSON.parse(fs.readFileSync(path.join(options.bankRoot,published.question.id+'.json')));
 assert.equal(bank.content.answer.short,'3');assert.equal(saved.sections[0].blocks[0].classification.primarySkillId,'solve-linear-1-step');
 await assert.rejects(()=>saveBookletProject(corrected,{...options,expectedRevision:project.revision}),/another session/);
});

test('source-byte and review-artifact edits invalidate live mathematical approval',async t=>{
 const {runDir,write,evidence}=fixture(t);
 await updateWorkflow(runDir,'review',state=>{refreshRegister(runDir,[1,2],state);approveMath(state,evidence);});
 assert.ok(liveWorkflow(runDir).pages[1].mathReview);
 write('evidence/pages/page-001.png','changed source');
 assert.equal(liveWorkflow(runDir).pages[1].mathReview,null);
 assert.ok(liveWorkflow(runDir).pages[2].mathReview);
 write('review.txt','replaced reviewer evidence');
 assert.equal(liveWorkflow(runDir).pages[2].mathReview,null);
});

test('review-first authoring reports blocked pages and still runs an unaffected representative',async t=>{
 const {runDir,evidence,options}=fixture(t);
 await updateWorkflow(runDir,'review',state=>{refreshRegister(runDir,[1,2],state);recordMathReview(state,{...evidence,pages:[{page:1,key:state.pages[1].inventoryHash}]});});
 let calls=0;
 const report=await runSemanticPackets({...options,representative:true},{log:()=>{},runner:async()=>{calls++;return {result:author(1),metrics:{}};}});
 assert.equal(calls,1);assert.equal(report.pages[0].ok,true);assert.ok(report.pages[1].blocked.length);
 assert.equal(report.ok,false);
 assert.ok(!fs.existsSync(path.join(runDir,'semantic-packets/page-002.author.1')));
 const [task]=createSemanticTasks({...options,stage:'inventory',pages:[1]});
 assert.match(task.prompt,/unused is not a defect/);assert.match(task.prompt,/layoutPatterns/);assert.match(task.prompt,/quantum/);
});

test('a source change during review-first generation preserves the attempt without publishing stale content',async t=>{
 const {runDir,write,evidence,options}=fixture(t);
 await updateWorkflow(runDir,'review',state=>{refreshRegister(runDir,[1,2],state);approveMath(state,evidence);});
 const report=await runSemanticPackets({...options,pages:[1],representative:true},{log:()=>{},runner:async()=>{write('evidence/pages/page-001.txt','Source changed during generation');return {result:author(1),metrics:{}};}});
 assert.equal(report.ok,false);assert.match(report.pages[0].error,/changed during generation/);
 assert.ok(!fs.existsSync(path.join(runDir,'semantic-packets/page-001.author.json')));
 assert.ok(fs.existsSync(path.join(runDir,'semantic-packets/page-001.author.1/result.json')));
});

test('registration failure reports an already-published packet and retains usage for safe resume',async t=>{
 const {runDir,write,evidence,options}=fixture(t);
 await updateWorkflow(runDir,'review',state=>{refreshRegister(runDir,[1,2],state);approveMath(state,evidence);});
 const report=await runSemanticPackets({...options,pages:[1],representative:true},{log:()=>{},runner:async()=>{
  write('workflow/review.lock','another process');return {result:author(1),metrics:{usage:{input_tokens:10,output_tokens:5},elapsedMs:7}};
 }});
 assert.equal(report.ok,false);assert.match(report.pages[0].error,/another process/);
 const ledger=JSON.parse(fs.readFileSync(path.join(runDir,'semantic-packets/ledger.jsonl'),'utf8').trim());
 assert.equal(ledger.canonicalWritten,true);assert.equal(ledger.registered,false);assert.equal(ledger.usage.output_tokens,5);
 const events=fs.readFileSync(path.join(runDir,'semantic-packets/attempt-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(events.at(-1).failedPhase,'registration');
 fs.unlinkSync(path.join(runDir,'workflow/review.lock'));
 const resumed=await runSemanticPackets({...options,pages:[1],representative:true},{log:()=>{},runner:()=>assert.fail('registration resume regenerated content')});
 assert.equal(resumed.ok,true);assert.equal(resumed.pages[0].cached,true);
});

test('shared diagram expansion still runs review-first numerical geometry validation',async t=>{
 const {runDir,write,evidence,options}=fixture(t),inventory=inv(1);
 inventory.entries.push({id:'triangle-source',targetId:'triangle-diagram',kind:'diagram',description:'Triangle with a 100 degree angle and two 5 unit sides.',mathematicalModel:triangle});
 write('semantic-packets/page-001.inventory.json',inventory);
 await updateWorkflow(runDir,'review',state=>{refreshRegister(runDir,[1,2],state);approveMath(state,evidence);});
 const request={...options,pages:[1],representative:true,config:{...options.config,authoringFormat:'shared-diagrams-v1'}};
 const make=angle=>{
  const p=author(1);p.authoringFormat='shared-diagrams-v1';
  p.diagramLibrary={base:'\\begin{tikzpicture}'+triangleConstruction({...triangle,angles:{A:exact(angle)}}).coordinates,end:'\\draw (A)--(B)--(C)--cycle;\\end{tikzpicture}'};
  p.sections[0].blocks[0].content.questionDiagrams=[{id:'triangle-diagram',format:'tikz',codeParts:['base','end']}];
  p.inventoryMappings.push({inventoryId:'triangle-source',targetId:'triangle-diagram'});return p;
 };
 const failed=await runSemanticPackets(request,{log:()=>{},runner:async()=>({result:make(80),metrics:{}})});
 assert.equal(failed.ok,false);assert.match(failed.pages[0].error,/authored .*80.*required 100/);
 assert.equal(fs.existsSync(path.join(runDir,'semantic-packets/page-001.author.json')),false);
 const passed=await runSemanticPackets({...request,attempt:2},{log:()=>{},runner:async()=>({result:make(100),metrics:{}})});
 assert.equal(passed.ok,true);
 const canonical=JSON.parse(fs.readFileSync(path.join(runDir,'semantic-packets/page-001.author.json')));
 assert.equal(canonical.authoringFormat,undefined);assert.equal(typeof canonical.sections[0].blocks[0].content.questionDiagrams[0].code,'string');
});

test('development hashes select changed pages and pagination neighbours, including a removed tail',()=>{
 const before=[1,2,3,4,5].map(page=>({page,hash:String(page)}));
 const changed=structuredClone(before);changed[2].hash='changed';
 assert.deepEqual(affectedPages(before,changed),[2,3,4]);
 assert.deepEqual(affectedPages(before,before),[]);
 assert.deepEqual(affectedPages(null,before),[1,2,3,4,5]);
 assert.deepEqual(affectedPages(before,before.slice(0,3)),[2,3]);
 const options={renderer:'one',settings:{flowEdition:'student',font:9},assets:{}};
 const pages=[{html:'<p>one</p>',blocks:['a']},{html:'<p>two</p>',blocks:['b']}];
 const hashes=renderedPageHashes(pages,options);
 assert.notDeepEqual(hashes,renderedPageHashes(pages,{...options,renderer:'two'}));
 assert.deepEqual(hashes,renderedPageHashes(pages,{...options,settings:{...options.settings,flowEdition:'worked'}}));
});

test('settlement and all-five final acceptance require current full manifests and every checked page',t=>{
 const {runDir,write,evidence}=fixture(t),state=loadWorkflow(runDir),runtime=rendererSignature();
 registerInventory(state,inv(1));approveMath(state,evidence);registerAuthor(state,inv(1),author(1));
 approveRepresentative(state,representative(state,evidence,runtime),runtime);
 const project=author(1),file=write('project.json',project),projectHash=projectReviewHash(project);
 const key=settlementKey(state);
 settleWorkflow(state,[1],{...evidence,key,project:{file,hash:projectHash}});
 const record={...evidence,key,sourceCompared:true,contentVerified:true,presentationVerified:true,editions:{}};
 for(const edition of FINAL_EDITIONS){
  const pdf=write(edition+'.pdf','PDF fixture '+edition),pages=[{page:1,hash:'page-one'},{page:2,hash:'page-two'}];
  const manifest=write(edition+'.pages.json',{mode:'full',passed:true,edition,renderer:runtime,workflowKey:key,projectHash,pages,pdf:{path:pdf,hash:bytesHash(pdf)}});
  record.editions[edition]={allPagesVisuallyInspected:true,pages:pages.map(p=>({...p,checked:true})),artifacts:evidence.artifacts,manifest:{path:manifest,hash:bytesHash(manifest)}};
 }
 const incomplete=structuredClone(record);delete incomplete.editions.worked;
 assert.throws(()=>acceptFinalReview(state,incomplete),/Incomplete final visual review: worked/);
 const subset=structuredClone(record);subset.editions.worked.pages.pop();
 assert.throws(()=>acceptFinalReview(state,subset),/every rendered page/);
 const wrong=structuredClone(record);wrong.editions.worked.pages[0].hash='changed';
 assert.throws(()=>acceptFinalReview(state,wrong),/every rendered page/);
 acceptFinalReview(state,record);assert.ok(state.finalReview);
 write('student.pdf','replaced PDF');
 assert.throws(()=>validateFinalManifest(record.editions.student,{edition:'student',key,projectHash,renderer:runtime}),/PDF changed/);
 assert.equal(projectReviewHash({...project,revision:20,updatedAt:'later'}),projectHash);
});
