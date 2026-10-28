import test from 'node:test';
import assert from 'node:assert/strict';
import {challengeSplitReport as report} from '../polish/challenge-split.mjs';
const q=(id,score,dependsOn=[])=>({id,type:'question',classification:{reasoningScore:score},flow:{dependsOn}});
const section=(id,blocks,role='mixed-practice')=>({id,topicId:id,phase:'practice',role,blocks});
test('dependency closure spans exercises, includes backward links, and preserves input',()=>{
 const p={sections:[section('a',[q('a',65,['b'])]),section('b',[q('b',20,['c']),q('c',30),q('d',40,['a'])])]};
 const before=structuredClone(p); assert.deepEqual(report(p).moves.map(x=>x.id),['a','b','c','d']);assert.deepEqual(p,before);
});
test('source count and minimum set sufficiency targets; gradient and upper end remain visible',()=>{
 const p={sections:[section('a',[q('a',10),q('b',40),q('c',50),q('d',60),q('e',65)])]};
 const archetypes={topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered'}]}],questions:Object.fromEntries(['a','b','c','d','e'].map(id=>[id,{archetype:'routine'}]))};
 const r=report(p,{archetypes}),t=r.topics[0];assert.equal(t.coverage[0].target,5);assert.equal(t.coverage[0].gap,1);assert.equal(t.gradientGaps[0].step,30);assert.equal(t.upperRoutineGap,4);assert.equal(r.publicationBlocked,true);
});
test('excluded end sections stay untouched and unrated/unmapped questions block calibration',()=>{
 const r=report({sections:[section('exam',[q('exam',99)],'exam'),section('a',[q('a',undefined,['exam'])])]});
 assert.equal(r.moves.length,0);assert.deepEqual(r.topics[0].missingRatings,['a']);assert.deepEqual(r.topics[0].missingArchetypes,['a']);assert.equal(r.unresolvedDependencies.length,1);
});

test('unknown coverage is unassessable; untaught archetypes excluded and distinct-parts override retained',()=>{
 const p={sections:[section('a',[q('a',20),q('b',70)])]};
 assert.equal(report(p).topics[0].sufficiencyStatus,'unassessable');
 const archetypes={questions:{a:{archetype:'routine'},b:{archetype:'challenge'}},topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered',practiceTarget:6},{id:'challenge',coverage:'missing',challengeOnly:true}]}]};
 const t=report(p,{archetypes}).topics[0];assert.equal(t.coverage.length,1);assert.equal(t.coverage[0].target,6);assert.equal(t.coverage[0].gap,5);
});
test('score order reversing a retained dependency is held',()=>{
 const t=report({sections:[section('a',[q('a',40),q('b',10,['a'])])]}).topics[0];
 assert.equal(t.order,null);assert.equal(t.orderHolds[0].id,'b');
});
test('reviewed independent attempts count separately, grouped scaffold steps once, invalid evidence rejected',()=>{
 const b=q('a',20);b.content={id:'root',children:[{id:'first'},{id:'second'},{id:'step1'},{id:'step2'}]};
 const p={sections:[section('a',[b])]},archetypes={questions:{a:{archetype:'routine',practiceItems:[{nodeIds:['first']},{nodeIds:['second']},{nodeIds:['step1','step2']}]}},topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered'}]}]};
 const t=report(p,{archetypes}).topics[0];assert.equal(t.coverage[0].count,3);assert.equal(t.coverage[0].gap,0);
 archetypes.questions.a.practiceItems.push({nodeIds:['first']});assert.throws(()=>report(p,{archetypes}),/reused practice node/);
});
test('unreviewed multipart content holds sufficiency instead of inventing a block deficit',()=>{
 const b=q('a',20);b.content={id:'root',children:[{id:'one',type:'part'},{id:'two',type:'part'}]};
 const archetypes={questions:{a:{archetype:'routine'}},topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered'}]}]};
 const t=report({sections:[section('a',[b])]},{archetypes}).topics[0];assert.equal(t.sufficiencyStatus,'unassessable');assert.deepEqual(t.missingItemReview,['a']);assert.equal(t.coverage[0].gap,null);
});
test('approved candidate moves own challenge questions without adding content; incomplete map blocks publication',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',sections:[section('a',[q('a',20),q('b',70)])]};assert.throws(()=>challengeSplitCandidate(p),/approved calibration/);
 const r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}});assert.equal(r.project.sections.at(-1).role,'challenge');assert.equal(r.project.sections.at(-1).workingSpace,'none');assert.equal(r.project.sections.at(-1).blocks[0].id,'b');assert.equal(r.report.backfillBlocked,true);assert.equal(p.sections.length,1);
});
test('band exception requires exact proposed IDs/order, preserving default guard',async()=>{
 const {polishSafetyIssues}=await import('../polish/guards.mjs');
 const p={sections:[section('a',[q('a',10),q('b',70)])]},after=structuredClone(p);after.sections[0].blocks.reverse();
 const band=options=>polishSafetyIssues(p,after,options).filter(x=>x.startsWith('reordered outside'));
 assert.equal(band({}).length,1);assert.equal(band({challengeSplit:true}).length,1);assert.equal(band({challengeSplit:{movedIds:[],routineOrders:[['b','a']]}}).length,0);
});
test('gradient-only and routine upper-range gaps hold publication even with enough independent practice',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',sections:[section('a',[q('a',10),q('b',40),q('c',60)])]};
 const archetypes={questions:Object.fromEntries(['a','b','c'].map(id=>[id,{archetype:'routine'}])),topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered'}]}]};
 const r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes}).report;
 assert.equal(r.topics[0].coverage[0].gap,0);assert.equal(r.backfillBlocked,true);assert.ok(r.publicationHolds.some(h=>h.kind==='gradient-gap'));assert.equal(r.publicationBlocked,true);
 p.sections[0].blocks.forEach((b,i)=>b.classification.reasoningScore=10+i*5);
 const upper=challengeSplitCandidate(p,{approvedCalibration:true,archetypes}).report;assert.equal(upper.topics[0].gradientGaps.length,0);assert.ok(upper.publicationHolds.some(h=>h.kind==='upper-routine-gap'));assert.equal(upper.backfillBlocked,true);
});
test('candidate adds Challenge topic and recognises an existing Challenge exercise alias',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',topics:[],sections:[section('a',[q('a',70)]),{...section('old',[q('old',80)]),title:'Challenge exercise'}]};
 const r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}}).project;
 assert.equal(r.sections.filter(s=>s.role==='challenge').length,1);const c=r.sections.at(-1);assert.equal(c.id,'old');assert.ok(r.topics.some(t=>t.id===c.topicId));assert.deepEqual(c.blocks.map(b=>b.id),['old','a']);
});
test('actual order and gradient reflect a teaching checkpoint, not global score proposal',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',sections:[section('a',[q('high',60)]),{id:'teach',topicId:'a',phase:'teaching',blocks:[]},{...section('b',[q('low',10),q('mid',40)]),topicId:'a'}]};
 const t=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}}).report.topics[0];assert.deepEqual(t.actualOrder,['high','low','mid']);assert.equal(t.orderDiffersFromProposal,true);assert.deepEqual(t.gradientGaps.map(g=>({before:g.before,after:g.after,step:g.step})),[{before:'high',after:'low',step:-50},{before:'low',after:'mid',step:30}]);
});
test('frozen original source count excludes new backfill from sufficiency target',()=>{
 const originals=Array.from({length:7},(_,i)=>q('old'+i,70)),backfill=Array.from({length:7},(_,i)=>q('new'+i,30));
 const p={sections:[section('a',[...originals,...backfill])]},archetypes={questions:Object.fromEntries([...originals,...backfill].map(b=>[b.id,{archetype:'routine'}])),topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered',originalPracticeCount:7}]}]};
 const c=report(p,{archetypes}).topics[0].coverage[0];assert.equal(c.currentBeforeCount,14);assert.equal(c.sourceCount,7);assert.equal(c.count,7);assert.equal(c.target,7);assert.equal(c.gap,0);
 archetypes.topics[0].archetypes[0].originalPracticeCount=-1;assert.throws(()=>report(p,{archetypes}),/Invalid originalPracticeCount/);
});
test('rejected score-sort dependency proposal does not hold valid actual linked order or fake a gradient',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',sections:[section('a',[q('first',50),q('follow',10,['first']),q('next',55)])]};
 const r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}}).report,t=r.topics[0];
 assert.ok(t.rejectedProposalOrderHolds.length);assert.deepEqual(t.orderHolds,[]);assert.deepEqual(t.actualOrder,['first','follow','next']);assert.deepEqual(t.gradientUnits.map(u=>u.score),[50,55]);assert.deepEqual(t.gradientGaps,[]);assert.ok(!r.publicationHolds.some(h=>h.kind==='dependency-order'||h.kind==='gradient-gap'));
});
test('routine linked units sort by max member rating without changing their internal order',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',sections:[section('a',[q('next',55),q('first',50),q('follow',10,['first']),q('early',20)])]};
 const t=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}}).report.topics[0];assert.deepEqual(t.actualOrder,['early','first','follow','next']);assert.deepEqual(t.gradientUnits.map(u=>u.score),[20,50,55]);
});
