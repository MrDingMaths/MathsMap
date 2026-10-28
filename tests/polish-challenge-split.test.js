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
