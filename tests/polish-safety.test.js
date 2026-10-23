import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {booklet,patch,temp} from './polish-fixture.mjs';
import {teacherBlocks,polishSafetyIssues} from '../polish/guards.mjs';
import {trialApply,sameContent} from '../first-pass/apply.mjs';
import {applyCorrections} from '../scripts/booklet/lean-review.mjs';
import {savePolished,saveThroughStudio,pinMilestone} from '../polish/run.mjs';
import {describeUnits,bandAllows,optimisePagination,tightenToFloor} from '../src/lib/booklet-pagination-optimiser.js';
import {runWrappedMath} from '../checks/wrapped-math.mjs';
import {removalBlocked} from '../polish/content.mjs';

const blocks=p=>p.sections[1].blocks;
const trial=(p,patches,extra={})=>trialApply({blocks:blocks(p),settings:p.settings,corrections:[{id:'repair',patches}],applyCorrections,...extra});

test('authorised feedback, resolved comments and nested comment anchors protect their whole blocks',()=>{
 const p=booklet();blocks(p)[0].sourceReview={authorisedFeedback:{note:'Keep this'}};
 p.studio.flags=[{id:'t',at:'2026-10-23',targetId:'q2-a',resolved:true},{id:'a',at:'2026-10-23',anchor:{rootId:'q3-b'}}];
 assert.deepEqual([...teacherBlocks(p)].sort(),['q1','q2','q3']);
 for(const change of [q=>blocks(q)[0].content.columns=1,q=>q.settings.layoutOverrides.answerSpaces['q2-a']=6,q=>q.studio.flags[0].resolved=false]){
  const q=structuredClone(p);change(q);assert.ok(polishSafetyIssues(p,q).some(x=>/teacher/.test(x)));
 }
});

test('bulk child and whole content replacements cannot remove practice part labels',()=>{
 const p=booklet(),b=blocks(p)[0];
 for(const field of ['/content/children','/content']){
  const original=field.endsWith('children')?b.content.children:b.content,corrected=structuredClone(original);
  (Array.isArray(corrected)?corrected:corrected.children)[0].label='';
  const out=trial(p,[patch(b.id,field,original,corrected)]);assert.equal(out.accepted.length,0);
 }
 assert.equal(trial(p,[patch('q1-a','/unlabelled',null,true)]).accepted.length,0);
 assert.equal(trial(p,[patch('q1','/presentation',null,{showLabels:false})]).accepted.length,0);
 assert.equal(trial(p,[patch('q1','/presentation',null,{answerPartLabels:{short:{'q1-a':''}}})]).accepted.length,0);
 assert.equal(trial(p,[patch('q1-a','/label','a','c')]).accepted.length,1,'a genuine relabel remains available');
});

test('flow replacement cannot erase dependencies or disable implicit or explicit exercise breaks',()=>{
 for(const flow of [{dependsOn:['q2'],keepWithNext:true},{exercisePageBreakBefore:true},null]){
  const p=booklet();if(flow)blocks(p)[0].flow=flow;
  const corrected=flow?.dependsOn?{keepTogether:true}:{exercisePageBreakBefore:false};
  assert.equal(trial(p,[patch('q1','/flow',flow,corrected)]).accepted.length,0);
 }
 const p=booklet();blocks(p)[0].pairedBlockId='q2';
 const q=structuredClone(p);delete blocks(q)[0].pairedBlockId;
 assert.ok(polishSafetyIssues(p,q).some(x=>/dependency/.test(x)));
});

test('arrow labels and both string and numeric answers survive layout rewrites',()=>{
 assert.equal(sameContent({answer:{short:3}},{answer:{short:4}}),false);
 assert.equal(sameContent({answer:{short:'3',worked:'x=3'}},{answer:{short:'3'}}),false);
 assert.equal(sameContent({annotations:[{label:'multiply by 2'}]},{annotations:[]}),false);
});

test('working space changed since import is protected in all copies; reviewed values never increase',()=>{
 const p=booklet();delete p.settings.layoutOverrides.answerSpaces['q1-a'];
 blocks(p)[0].sourceReview={workingSpaceEstimate:{estimates:[{targetId:'q1-a',answerSpaceMm:18}]}};
 blocks(p)[0].content.children[0].answerSpaceMm=25;
 const q=structuredClone(p);blocks(q)[0].content.children[0].answerSpaceMm=12;
 assert.ok(polishSafetyIssues(p,q).some(x=>/working space q1-a/.test(x)));
 const untouched=booklet();delete untouched.settings.layoutOverrides.answerSpaces['q1-a'];
 blocks(untouched)[0].sourceReview={workingSpaceEstimate:{estimates:[{targetId:'q1-a',answerSpaceMm:18}]}};
 untouched.studio.flags=[{id:'t',at:'2026-10-23',targetId:'q6'}];
 const raised=structuredClone(untouched);blocks(raised)[0].content.children[0].answerSpaceMm=20;
 assert.ok(polishSafetyIssues(untouched,raised).some(x=>/increased reviewed/.test(x)));
 const lowered=structuredClone(untouched);blocks(lowered)[0].content.children[0].answerSpaceMm=12;
 assert.deepEqual(polishSafetyIssues(untouched,lowered),[]);
});

test('a neighbour patch is checked against the complete project and its protected settings',()=>{
 const p=booklet();p.studio.flags=[{id:'t',at:'2026-10-23',targetId:'q2-a'}];
 const safetyGuard=(changed,settings)=>{const by=new Map(changed.map(b=>[b.id,b]));return polishSafetyIssues(p,{...p,settings,sections:p.sections.map(s=>({...s,blocks:s.blocks.map(b=>by.get(b.id)??b)}))});};
 const out=trial(p,[patch('q2-a','/answerSpaceMm',18,8)],{safetyGuard});assert.equal(out.accepted.length,0);
 const setting=trial(p,[patch('project','/settings/layoutOverrides/answerSpaces/q2-a',null,8)],{safetyGuard});assert.equal(setting.accepted.length,0);
});

test('nested dependencies and keepWithNext prevent content removal',()=>{
 const p=booklet();blocks(p)[0].content.children[0].dependsOn=['q3-a'];
 assert.match(removalBlocked(p,'q3'),/depends on it/);
 blocks(p)[1].flow={keepWithNext:true};assert.match(removalBlocked(p,'q3'),/keepWithNext/);
});

test('wrap repair skips a commented block even when a render says fewer columns would fix it',async()=>{
 const p=booklet();p.studio.flags=[{id:'t',at:'2026-10-23',targetId:'q1'}];
 const out=await runWrappedMath({project:p,apply:true,render:async()=>({pageCount:1,findings:[{blockId:'q1',nodeId:'q1-a'}],pages:[]})});
 assert.deepEqual(out.project,p);assert.deepEqual(out.report.changed,[]);
});

test('save guard refuses unsafe candidates before invoking the live save transaction',async t=>{
 const root=temp(t),p=booklet();p.studio.flags=[{id:'t',at:'2026-10-23',targetId:'q2'}];
 const live=path.join(root,'booklets/projects',p.id+'.json');fs.mkdirSync(path.dirname(live),{recursive:true});fs.writeFileSync(live,JSON.stringify(p));
 const q=structuredClone(p);blocks(q)[1].content.columns=1;const work=path.join(root,'candidate.json');fs.writeFileSync(work,JSON.stringify(q));let saves=0;
 await assert.rejects(savePolished({state:{input:{revision:3},gates:{ok:true}},work,id:p.id,root,deps:{saveRepair:async()=>{saves++;}}}),/changed teacher block/);
 assert.equal(saves,0);assert.equal(JSON.parse(fs.readFileSync(live)).revision,3);
 await assert.rejects(savePolished({state:{input:{revision:3}},work,id:p.id,root}),/export gates have not passed/);
});

test('reordering preserves nested dependencies, pairs and the per-question band bound',()=>{
 const p=booklet();for(const b of blocks(p))b.flow={localDifficulty:{reasoningScore:10}};
 blocks(p)[2].content.children[0].dependsOn=['q2-a'];
 let q=structuredClone(p);[blocks(q)[1],blocks(q)[2]]=[blocks(q)[2],blocks(q)[1]];
 assert.ok(polishSafetyIssues(p,q).some(x=>/reordered dependency/.test(x)));
 blocks(p)[0].flow.keepWithNext=true;q=structuredClone(p);[blocks(q)[1],blocks(q)[2]]=[blocks(q)[2],blocks(q)[1]];
 assert.ok(polishSafetyIssues(p,q).some(x=>/separated linked/.test(x)));
 blocks(p)[2].flow.localDifficulty.reasoningScore=90;q=structuredClone(p);[blocks(q)[2],blocks(q)[3]]=[blocks(q)[3],blocks(q)[2]];
 assert.ok(polishSafetyIssues(p,q).some(x=>/outside one difficulty band/.test(x)));
});

test('the live save uses Studio expectedRevision and never retries a conflict',async()=>{
 let calls=0;
 const request=async(url,options)=>{
  calls++;assert.match(url,/127\.0\.0\.1:5173\/__booklet\/projects\/first-pass-fixture$/);
  assert.equal(options.method,'PUT');const body=JSON.parse(options.body);assert.equal(body.expectedRevision,3);assert.equal(body.project.id,'first-pass-fixture');
  return {ok:false,status:409,json:async()=>({error:'Project changed in another session; reload before saving'})};
 };
 await assert.rejects(saveThroughStudio(booklet(),{expectedRevision:3},request),/changed in another session/);assert.equal(calls,1);
});

test('milestones retain a real start snapshot and malformed pins are never overwritten',async t=>{
 const root=temp(t),p=booklet(),live=path.join(root,'booklets/projects',p.id+'.json');fs.mkdirSync(path.dirname(live),{recursive:true});fs.writeFileSync(live,JSON.stringify(p));
 await pinMilestone(p.id,3,{root});assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'booklets/projects/.revisions',p.id,'3.json'))),p);
 const pins=path.join(root,'booklets/projects/.revisions/milestones.json');fs.writeFileSync(pins,'broken pins');
 await assert.rejects(pinMilestone(p.id,3,{root}),/Invalid revision milestone/);assert.equal(fs.readFileSync(pins,'utf8'),'broken pins');
});

test('a mixed-difficulty dependency unit cannot carry an easy question across a far band',()=>{
 const p=booklet();for(const b of blocks(p))b.flow={localDifficulty:{reasoningScore:90}};
 blocks(p)[0].flow.localDifficulty.reasoningScore=10;blocks(p)[0].flow.keepWithNext=true;
 const units=describeUnits(p.sections[1]);assert.equal(units[0].ids.length,2);
 assert.equal(bandAllows(units,0,3),false);
});

test('pagination leaves commented blocks and their order metadata intact',async()=>{
 const p=booklet();p.studio.flags=[{id:'t',at:'2026-10-23',targetId:'q2'}];
 for(const b of blocks(p)){b.flow={localDifficulty:{reasoningScore:20}};b.sourceReview={workingSpaceEstimate:{estimates:b.content.children.map(n=>({targetId:n.id,answerSpaceMm:18}))}};}
 assert.deepEqual(tightenToFloor(p,1).project.sections[1].blocks[1],blocks(p)[1]);
 assert.ok(describeUnits(p.sections[1],teacherBlocks(p)).every(u=>u.barrier));
 const paginate=async project=>({issues:[],pages:project.sections.slice(1).flatMap(s=>s.blocks.map(b=>({blocks:[b],space:{capacityMm:100,usedMm:30,remainingMm:70},elements:[{id:b.id,kind:'question',h:30}]})))});
 const out=await optimisePagination(p,{paginate,named:true});assert.deepEqual(blocks(out.project)[1],blocks(p)[1]);
});
