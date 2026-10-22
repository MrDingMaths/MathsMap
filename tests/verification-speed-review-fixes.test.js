// Fixes from the review of the faster-verification change set (22 October 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {saveTarget,settingsAllowedPaths} from '../checks/lib/common.mjs';
import {runHandoff,STEPS} from '../handoff/run.mjs';
import {runSourceMatch} from '../source-match/run.mjs';
import {applyCalibratedWorkingSpace} from '../paginate/lib/working-space-apply.mjs';
import {tightenToFloor} from '../src/lib/booklet-pagination-optimiser.js';
import {tightenStages} from '../src/lib/booklet-layout-actions.js';
import {workingSpaceFloor,estimateWorkedWritingSpace,calibratedWorkingSpace} from '../src/lib/booklet-working-space.js';
import {spacingProtected} from '../src/lib/booklet-import-spacing.js';
import {layoutFields} from '../bench/fields.mjs';

const part=(id,mm,rows=3)=>({id,type:'part',prompt:'x',answerSpaceMm:mm,answer:{short:'1',worked:'$$'+Array.from({length:rows},(_,i)=>'x='+i).join('\\\\')+'$$'}});
const block=(id,parts,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Q',children:parts},sourceReview:{responses:parts.map(p=>({targetId:p.id,kind:'working'})),workingSpaceEstimate:{method:'solution-steps',estimates:parts.map(p=>({targetId:p.id,widthMm:80,mathematicalRows:3,answerSpaceMm:p.answerSpaceMm}))},...extra}});
const project=(blocks,{settings={},flags=[]}={})=>({id:'fx',revision:5,settings:{layoutOverrides:{blockLayouts:{},answerSpaces:{}},...settings},studio:{flags},sections:[{id:'s',phase:'practice',topicId:'t',blocks}]});

test('a check save names the settings it changed to the repair scope and expects the revision the run started from',async()=>{
 const before=project([block('A',[part('A-a',60)])]),after=structuredClone(before);
 after.settings.layoutOverrides.answerSpaces={'A-a':30};
 assert.deepEqual(settingsAllowedPaths(before,after),['/settings/layoutOverrides/answerSpaces/A-a']);
 const calls=[];
 const deps={liveWork:()=>({blocked:[],held:[]}),saveRepair:async args=>{calls.push(args);return {project:{revision:6}};}};
 const saved=await saveTarget({file:'x.json',live:true,before,after,changed:['A'],allowLive:true,tag:'test',deps});
 assert.equal(saved.saved,true);
 assert.deepEqual(calls[0].allowedPaths,['/settings/layoutOverrides/answerSpaces/A-a']);
 assert.equal(calls[0].expectedRevision,5);
 // The booklet moved on while the run worked: refuse, so the teacher's later edits are not reverted.
 const moved={...before,revision:7};
 await assert.rejects(()=>saveTarget({file:'x.json',live:true,before:moved,after,changed:['A'],allowLive:true,expectedRevision:5,deps}),/changed during the run/);
 assert.equal(calls.length,1);
 // A hold (import in flight) defers the save.
 await assert.rejects(()=>saveTarget({file:'x.json',live:true,before,after,changed:['A'],allowLive:true,deps:{...deps,liveWork:()=>({blocked:['running: lean-import.mjs'],held:[]})}}),/Deferred/);
});

test('handoff records the input revision at the start and runs the regions step before roles',async()=>{
 assert.ok(STEPS.indexOf('regions')>=0&&STEPS.indexOf('regions')<STEPS.indexOf('roles'));
 assert.ok(STEPS.indexOf('regions')<STEPS.indexOf('source-match'));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'handoff-rev-'));
 try{
  const file=path.join(dir,'in.json');fs.writeFileSync(file,JSON.stringify(project([block('A',[part('A-a',60)])])));
  const {state}=await runHandoff({file,workDir:path.join(dir,'work'),only:[]});
  assert.equal(state.input.revision,5);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('source-match on a live booklet applies the same live-work hold as the optimiser',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sm-live-'));
 try{
  const dir=path.join(root,'booklets','projects');fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'fx.json');fs.writeFileSync(file,JSON.stringify(project([block('A',[part('A-a',60)])])));
  await assert.rejects(()=>runSourceMatch({projectFile:file,root,allowLive:true,liveWorkCheck:()=>({blocked:['running: lean-review.mjs'],held:[]})}),/Deferred: running: lean-review/);
  await assert.rejects(()=>runSourceMatch({projectFile:file,root,allowLive:true,liveWorkCheck:()=>({blocked:[],held:['newer unsaved candidate: x']})}),/Deferred/);
  await assert.rejects(()=>runSourceMatch({projectFile:file,root}),/Refusing to change a live project/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('the optimiser tightens only allowances still equal to their import value in every stored copy',()=>{
 const imported=block('A',[part('A-a',80)]),manual=block('B',[part('B-a',80)]);
 manual.content.children[0].answerSpaceMm=70; // changed by the teacher since import (import value 80)
 const split=block('C',[part('C-a',80)]);
 const p=project([imported,manual,split]);
 p.settings.layoutOverrides.answerSpaces={'C-a':72}; // the stored override differs from the part's own value
 const {changes,project:next}=tightenToFloor(p,0);
 assert.deepEqual(changes.map(c=>c.blockId),['A']);
 assert.ok(next.sections[0].blocks[0].content.children[0].answerSpaceMm<80);
 assert.equal(next.sections[0].blocks[1].content.children[0].answerSpaceMm,70);
 assert.equal(next.settings.layoutOverrides.answerSpaces['C-a'],72);
});

test('working-space apply needs every stored copy to equal the import value, and honours --no-raise on a minHeight too',()=>{
 const a=block('A',[part('A-a',60)]),b=block('B',[part('B-a',60)]),c=block('C',[part('C-a',4)]);
 const arrangement=id=>({version:1,root:{id:id+'-g',type:'group',direction:'stack',children:[{id:id+'-i',type:'item',ref:id+'-a/space',height:60}]}});
 const p=project([a,b,c]);
 p.settings.layoutOverrides.blockLayouts.A={arrangement:arrangement('A')};
 p.settings.layoutOverrides.blockLayouts.B={arrangement:{...arrangement('B'),root:{...arrangement('B').root,children:[{id:'B-i',type:'item',ref:'B-a/space',height:45}]}}}; // saved item differs
 const {project:next,changes}=applyCalibratedWorkingSpace(p,{history:false});
 const ids=changes.map(x=>x.blockId);
 assert.ok(ids.includes('A'));assert.ok(!ids.includes('B'),'a changed arrangement item protects the part');
 assert.equal(next.sections[0].blocks[1].content.children[0].answerSpaceMm,60);
 // minHeight: a floor below the import value rises only without --no-raise.
 const m=block('M',[part('M-a',4)]);
 const q=project([m]);q.settings.layoutOverrides.blockLayouts.M={arrangement:{version:1,root:{id:'M-g',type:'group',direction:'stack',children:[{id:'M-i',type:'item',ref:'M-a/space',minHeight:4}]}}};
 const kept=applyCalibratedWorkingSpace(q,{history:false,raise:false});
 assert.equal(kept.project.settings.layoutOverrides.blockLayouts.M.arrangement.root.children[0].minHeight,4);
 const raised=applyCalibratedWorkingSpace(q,{history:false});
 assert.ok(raised.project.settings.layoutOverrides.blockLayouts.M.arrangement.root.children[0].minHeight>4);
});

test('table rows keep their content-sized minimum by default, and the opt-in fails closed without a history',()=>{
 const cell=(id,text)=>({id,type:'cell',blocks:[{id:id+'-p',type:'paragraph',inlines:[{id:id+'-t',type:'text',text}]}]});
 const table={id:'t1',type:'table',widthMm:170,rowHeights:[10,60],rows:[[{...cell('h1','H'),header:true}],[cell('c1','1')]]};
 const q=block('T',[part('T-a',30)]);q.content.prompt={format:'maths-editor-document-v1',version:1,blocks:[table]};
 const p=project([q]);
 const byDefault=applyCalibratedWorkingSpace(p,{history:false});
 assert.ok(!byDefault.changes.some(c=>c.field==='rowHeights'));
 const optIn=applyCalibratedWorkingSpace(p,{history:false,tableRows:true});
 assert.ok(!optIn.changes.some(c=>c.field==='rowHeights'),'no history to compare: every row counts as changed');
});

test('Studio Tighten and the optimiser share one floor: calibrated when unreviewed, the estimator once the teacher has reviewed',()=>{
 const b=block('P',[part('P-a',90,4)]);
 const node=b.content.children[0];
 const calibrated=workingSpaceFloor(b,node,{reviewed:false}),estimator=workingSpaceFloor(b,node,{reviewed:true});
 assert.equal(estimator,estimateWorkedWritingSpace(node,{preserveExplicit:false}));
 assert.equal(calibrated,calibratedWorkingSpace(node,{responseKind:'working',importMm:90,widthMm:80,responseContext:{kind:'working',expectedAnswer:'1'}}));
 assert.notEqual(calibrated,estimator,'the two floors differ, so the reviewed/unreviewed choice is observable');
 const fresh=project([b]);
 const reviewed=project([structuredClone(b)],{flags:[{id:'f',note:'x',at:'2026-10-18T00:00:00Z'}]});
 const finalSpace=stages=>{const last=stages.at(-1).project;return last.settings.layoutOverrides.answerSpaces?.['P-a']??last.sections[0].blocks[0].content.children[0].answerSpaceMm;};
 // Tighten goes to the floor of its kind of booklet and no deeper.
 assert.equal(finalSpace(tightenStages(fresh,'P')),Math.min(90,calibrated));
 assert.equal(finalSpace(tightenStages(reviewed,'P')),Math.min(90,estimator));
 // The optimiser asks the same helper.
 const optimised=tightenToFloor(fresh,0);
 assert.equal(optimised.project.sections[0].blocks[0].content.children[0].answerSpaceMm,calibrated);
});

test('a repair the automated sweep recorded does not protect spacing; teacher-driven repairs and departures do',()=>{
 const sweep={date:'2026-10-22',note:'Pre-review sweep (cloze, gutter): standing house conventions applied before the teacher\'s review; content and answers unchanged.'};
 assert.equal(spacingProtected({sourceReview:{feedbackRepairs:[sweep]}}),false);
 assert.equal(spacingProtected({sourceReview:{feedbackRepairs:[{date:'2026-10-22',source:'handoff',note:'anything'}]}}),false);
 assert.equal(spacingProtected({sourceReview:{feedbackRepairs:[sweep,{date:'2026-10-20',note:'Teacher: tighten the table'}]}}),true);
 assert.equal(spacingProtected({sourceReview:{feedbackRepairs:[{date:'2026-10-20',note:'Teacher: tighten the table'}]}}),true);
 assert.equal(spacingProtected({sourceReview:{intentionalDepartures:[{note:'kept'}]}}),true);
 assert.equal(spacingProtected({sourceReview:{}}),false);
});

test('the optimiser record flow.autoOrder is pipeline bookkeeping, not a layout field the benchmark compares',()=>{
 const b=block('A',[part('A-a',30)]);b.flow={keepWithNext:true,autoOrder:{rank:0,from:0,band:'Foundation',reason:'order-kept',at:'2026-10-22T00:00:00Z',ratingHash:'abc'}};
 const fields=[...layoutFields(project([b])).keys()];
 assert.ok(fields.includes('flow/A.keepWithNext'));
 assert.ok(!fields.some(k=>k.includes('autoOrder')));
});
