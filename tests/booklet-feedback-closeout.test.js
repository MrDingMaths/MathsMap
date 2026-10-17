import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {fromSource} from '../src/lib/document-content.js';
import {saveBookletProject,loadBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {snapshotInput,saveRepair,verifyRepairReadback,resolveComments,startFeedbackJob,finishFeedbackJob,feedbackWorkCounts,writeFeedbackReceipt} from '../scripts/booklet/feedback-closeout.mjs';
import {assertRepairScope,structuralPreflight} from '../scripts/booklet/feedback-preflight.mjs';
import {beginRunPhase,endRunPhase} from '../scripts/booklet/run-observability.mjs';

async function temporary(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'mathsmap-closeout-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
const make=()=>createEditableProject({id:'closeout',title:'Closeout',settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'s',title:'Page',blocks:[{id:'b1',type:'rich-text',content:fromSource('First paragraph.')},{id:'b2',type:'rich-text',content:fromSource('Second paragraph.')}]}]});
const flag=(id,extra={})=>({id,targetId:'b1',note:'Please change this.',at:'2026-10-04T00:00:00.000Z',...extra});

test('the input snapshot is written once and rejects a changed project',()=>temporary(async root=>{
 const project=make(),first=await snapshotInput(root,project);
 assert.equal(first.reused,false);assert.equal((await snapshotInput(root,project)).reused,true);
 await assert.rejects(snapshotInput(root,{...project,title:'Edited elsewhere'}),/reconcile concurrent edits/);
 assert.equal(JSON.parse(await fs.readFile(first.file,'utf8')).title,'Closeout');
}));

test('repairs save against the expected revision and read back the changed blocks',()=>temporary(async root=>{
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank')};await fs.mkdir(options.projectRoot,{recursive:true});
 const created=await saveBookletProject(make(),{...options,create:true}),candidate=structuredClone(await loadBookletProject('closeout',{...options,refreshRatings:false}));
 candidate.sections[0].blocks[0].content=fromSource('Repaired paragraph.');
 const done=await saveRepair({candidate,expectedRevision:created.revision,changedBlockIds:['b1'],runDir:path.join(root,'run'),options});
 assert.equal(done.project.revision,created.revision+1);assert.deepEqual(done.readback.mismatched,[]);assert.equal(done.readback.bankSyncItems,0);
 assert.equal(JSON.parse(await fs.readFile(path.join(root,'run','readback.json'),'utf8')).revision,created.revision+1);
 // A concurrent save moved the revision: the stale repair must not overwrite it.
 await assert.rejects(saveRepair({candidate,expectedRevision:created.revision,changedBlockIds:['b1'],options}),/another session/);
 assert.equal((await loadBookletProject('closeout',{...options,refreshRatings:false})).revision,created.revision+1);
 await assert.rejects(saveRepair({candidate,expectedRevision:created.revision+1,changedBlockIds:['missing'],options}),/scope block not found/);
 assert.equal((await loadBookletProject('closeout',{...options,refreshRatings:false})).revision,created.revision+1,'invalid scope fails before writing');
 await assert.rejects(saveRepair({candidate,changedBlockIds:[],options}),/expected input revision/);
}));

test('comments resolve only against recorded evidence and keep the original note',()=>{
 const project={...make(),studio:{version:1,flags:[flag('c1'),flag('c2'),flag('done',{resolved:true})]}};
 const evidence={inspectedPages:[{edition:'student',page:35}]},resolution='Part a now uses two columns; printed page 35 inspected.';
 assert.throws(()=>resolveComments(project,[{id:'c1',resolution}]),/no inspected pages or checks/);
 assert.throws(()=>resolveComments(project,[{id:'c1',resolution:'Fixed.',evidence}]),/state what changed/);
 assert.throws(()=>resolveComments(project,[{id:'c1',resolution,evidence:{inspectedPages:[{page:35}]}}]),/edition and physical page/);
 assert.throws(()=>resolveComments(project,[{id:'absent',resolution,evidence}]),/not found/);
 assert.throws(()=>resolveComments(project,[{id:'done',resolution,evidence}]),/already resolved/);
 assert.throws(()=>resolveComments(project,[{id:'c1',resolution,evidence},{id:'c1',resolution,evidence}]),/duplicate/);
 const next=resolveComments(project,[{id:'c1',resolution,evidence},{id:'c2',resolution,evidence:{checks:['save and reopen']}}],{at:'2026-10-04T06:00:00.000Z'});
 const [c1,c2,done]=next.studio.flags;
 assert.equal(c1.resolved,true);assert.equal(c1.resolvedAt,'2026-10-04T06:00:00.000Z');assert.equal(c1.note,'Please change this.');assert.equal(c2.resolved,true);
 assert.deepEqual(done,project.studio.flags[2]);assert.equal(project.studio.flags[0].resolved,undefined,'the input project is not mutated');
});

test('scope rejects unrelated block edits, order changes, and broad width edits',()=>{
 const before=make(),candidate=structuredClone(before);
 candidate.sections[0].blocks[0].content=fromSource('Authorised repair');
 assert.doesNotThrow(()=>assertRepairScope(before,candidate,{blockIds:['b1']}));
 candidate.sections[0].blocks[1].content=fromSource('Accidental repair');
 assert.throws(()=>assertRepairScope(before,candidate,{blockIds:['b1']}),/block:b2/);
 candidate.sections[0].blocks[1]=structuredClone(before.sections[0].blocks[1]);
 candidate.settings.layoutOverrides={blockLayouts:{b1:{width:20},b2:{width:20}}};
 assert.throws(()=>assertRepairScope(before,candidate,{blockIds:['b1']}),/b2/);
 assert.doesNotThrow(()=>assertRepairScope(before,candidate,{blockIds:['b1'],allowedPaths:['/settings/layoutOverrides/blockLayouts/b2']}));
 assert.throws(()=>assertRepairScope(before,candidate,{blockIds:['b1'],allowedPaths:['/sections']}),/Use block IDs/);
 const ordered=make();ordered.sections[0].blocks.push({id:'b3',type:'rich-text',content:fromSource('Third')});
 const reordered=structuredClone(ordered);reordered.sections[0].blocks.reverse();
 assert.throws(()=>assertRepairScope(ordered,reordered,{blockIds:['b1']}),/outside its declared scope/);
});

test('preflight inventories table cells, annotations, widths, response owners and dependency groups',()=>{
 const project=make(),block=project.sections[0].blocks[0];
 block.content={type:'group',id:'root',children:[{id:'response',responseSpace:30,dependsOn:['b2'],answer:{short:'3'}}],prompt:{blocks:[{id:'table',type:'table',rows:[[{id:'cell',type:'cell',blocks:[]}]],annotations:[{type:'box'}],width:70}]}};
 block.presentation={layoutOverrides:{blockLayouts:{b1:{arrangement:{version:1,root:{id:'layout',type:'group',direction:'stack',children:[{id:'missing',type:'item',ref:'deleted/prompt'}]}}}}}};
 const untouched=structuredClone(project),report=structuralPreflight(project,{blockIds:['b1']});
 assert.equal(report.blocks[0].tables[0].cells[0],1);
 assert.equal(report.blocks[0].annotations.length,1);
 assert.ok(report.blocks[0].widths.some(w=>w.width===70));
 assert.equal(report.blocks[0].responses[0].id,'response');
 assert.equal(report.blocks[0].dependencies[0].target,'b2');
 assert.ok(report.issues.some(i=>i.kind==='missing-arrangement-ref'));
 assert.deepEqual(project,untouched,'preflight never mutates saved layouts');
 block.content.children[0].dependsOn=['deleted'];
 assert.ok(structuralPreflight(project,{blockIds:['b1']}).issues.some(i=>i.kind==='missing-dependency'));
});

test('readback accepts canonical lineage enrichment but rejects corruption anywhere',()=>{
 const canonical=make();canonical.revision=2;
 canonical.sections[0].blocks[0].sourceReview={origin:{projectId:'original',blockId:'b1',runId:'source'}};
 assert.deepEqual(verifyRepairReadback(canonical,structuredClone(canonical),{expectedRevision:1,changedBlockIds:['b1']}).projectPaths,[]);
 for(const mutate of [p=>{p.sections[0].blocks[0].sourceReview.origin.runId='wrong';},p=>{p.title='Corrupted';},p=>{p.sections[0].blocks[1].content=fromSource('Corrupt unrelated block');},p=>{p.revision=3;}]){
  const reloaded=structuredClone(canonical);mutate(reloaded);
  assert.throws(()=>verifyRepairReadback(canonical,reloaded,{expectedRevision:1,changedBlockIds:['b1']}),/does not match/);
 }
});

test('save scope stops unrelated changes before the transaction and accepts preserved origins',()=>temporary(async root=>{
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank')};
 const input=make();input.sections[0].blocks[0].sourceReview={origin:{projectId:'original',blockId:'source',runId:'run'}};
 const created=await saveBookletProject(input,{...options,create:true});
 const candidate=structuredClone(created);delete candidate.sections[0].blocks[0].sourceReview;
 candidate.sections[0].blocks[0].content=fromSource('Changed');candidate.sections[0].blocks[1].content=fromSource('Accidental');
 await assert.rejects(saveRepair({candidate,expectedRevision:created.revision,changedBlockIds:['b1'],options}),/block:b2/);
 assert.equal((await loadBookletProject(created.id,{...options,refreshRatings:false})).revision,created.revision);
 candidate.sections[0].blocks[1]=structuredClone(created.sections[0].blocks[1]);
 const done=await saveRepair({candidate,expectedRevision:created.revision,changedBlockIds:['b1'],options});
 assert.deepEqual(done.project.sections[0].blocks[0].sourceReview.origin,input.sections[0].blocks[0].sourceReview.origin);
 assert.deepEqual(done.readback.projectPaths,[]);
}));

test('readback accepts source origins first discovered during the save transaction',()=>temporary(async root=>{
 const options={projectRoot:path.join(root,'booklets','projects'),bankRoot:path.join(root,'booklets','bank')};
 const input=make();input.source={...input.source,runId:'fixture'};input.sections[0].blocks[0].sourcePageNumber=1;
 const packetDir=path.join(root,'.booklet-work/full-imports/fixture/semantic-packets');
 await fs.mkdir(packetDir,{recursive:true});
 await fs.writeFile(path.join(packetDir,'page-001.author.json'),JSON.stringify(input));
 const created=await saveBookletProject(input,{...options,create:true}),candidate=structuredClone(created);
 assert.equal(candidate.sections[0].blocks[0].sourceReview?.origin,undefined);
 candidate.sections[0].blocks[0].content=fromSource('Repaired with newly discovered origin');
 const done=await saveRepair({candidate,expectedRevision:created.revision,changedBlockIds:['b1'],options});
 assert.equal(done.project.sections[0].blocks[0].sourceReview.origin.runId,'fixture');
 assert.deepEqual(done.readback.projectPaths,[]);
}));

test('receipts time the whole job from discovery and mark unrecorded work unavailable',()=>temporary(async root=>{
 assert.equal(feedbackWorkCounts(root).completeJob.elapsedMs,'unavailable');assert.equal(feedbackWorkCounts(root).exports,'unavailable');
 const job=startFeedbackJob(root,{projectId:'closeout'});assert.equal(startFeedbackJob(root).id,job.id,'the first discovery start is kept');
 const failed=beginRunPhase(root,'feedback-pages');endRunPhase(root,failed,{ok:false});
 const passed=beginRunPhase(root,'feedback-pages');endRunPhase(root,passed,{ok:true});
 await fs.mkdir(path.join(root,'pages'));
 await fs.writeFile(path.join(root,'pages','feedback-pages.json'),JSON.stringify({browserLaunches:1,counts:{fullPdfs:0,pagesPrinted:40,pagesRasterised:20,pagesToInspect:20,tikz:{compiles:3,memoryHits:9,idbHits:150,serverHits:1,driverHits:0}}}));
 finishFeedbackJob(root);
 const receipt=await writeFeedbackReceipt({runDir:root,summary:{inputRevision:1},artifacts:[path.join(root,'pages','feedback-pages.json'),path.join(root,'absent.pdf')]});
 assert.ok(receipt.work.completeJob.elapsedMs>=0);assert.equal(receipt.work.retries,1);assert.deepEqual(receipt.work.phases['feedback-pages'],{runs:2,failed:1,elapsedMs:receipt.work.phases['feedback-pages'].elapsedMs});
 assert.deepEqual(receipt.work.exports,{browserLaunches:1,fullPdfs:0,pagesPrinted:40,pagesRasterised:20,pagesSelectedForInspection:20});
 assert.equal(receipt.work.diagramCache.idbHits,150);assert.equal(receipt.work.pagesVisuallyInspected,'unavailable');assert.equal(receipt.work.modelUsage,'unavailable');
 assert.equal(receipt.artifacts.length,1);
 await fs.writeFile(path.join(root,'inspection.json'),JSON.stringify({pages:[{edition:'student',page:35}]}));
 assert.equal(feedbackWorkCounts(root).pagesVisuallyInspected,1);
}));
