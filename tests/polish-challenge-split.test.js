import test from 'node:test';
import assert from 'node:assert/strict';
import {challengeSplitReport as report} from '../polish/challenge-split.mjs';
const q=(id,score,dependsOn=[])=>({id,type:'question',classification:{reasoningScore:score},flow:{dependsOn}});
const section=(id,blocks,role='mixed-practice')=>({id,topicId:id,phase:'practice',role,blocks});
test('dependency closure spans exercises, includes backward links, and preserves input',()=>{
 const p={sections:[section('a',[q('a',65,['b']),q('spare-a',20)]),section('b',[q('b',20,['c']),q('c',30),q('d',40,['a']),q('spare-b',20)])]};
 const before=structuredClone(p); assert.deepEqual(report(p).moves.map(x=>x.id),['a','b','c','d']);assert.deepEqual(p,before);
});
test('source count and minimum set sufficiency targets; gradient and upper end remain visible',()=>{
 const p={sections:[section('a',[q('a',10),q('b',40),q('c',50),q('d',60),q('e',65)])]};
 const archetypes={topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered'}]}],questions:Object.fromEntries(['a','b','c','d','e'].map(id=>[id,{archetype:'routine'}]))};
 const r=report(p,{archetypes}),t=r.topics[0];assert.equal(t.coverage[0].target,5);assert.equal(t.coverage[0].gap,1);assert.equal(t.gradientGaps[0].step,30);assert.equal(t.upperRoutineGap,0);assert.equal(r.publicationBlocked,true);
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

test('parent and child targets count once inside a dependent item but cannot span independent items',()=>{
 const block=q('a',20);block.content={id:'root',children:[{id:'first'},{id:'second'}]};
 const project={sections:[section('a',[block])]},archetypes={questions:{a:{archetype:'routine',practiceItems:[{nodeIds:['root','first']}]}},topics:[{topicId:'a',archetypes:[{id:'routine',coverage:'covered'}]}]};
 const coverage=report(project,{archetypes}).topics[0].coverage[0];assert.equal(coverage.count,1);assert.equal(coverage.target,3);assert.equal(coverage.gap,2);
 archetypes.questions.a.practiceItems=[{nodeIds:['root']},{nodeIds:['first']}];assert.throws(()=>report(project,{archetypes}),/Invalid or reused practice node/);
 archetypes.questions.a.practiceItems=[{nodeIds:['first']},{nodeIds:['root']}];assert.throws(()=>report(project,{archetypes}),/Invalid or reused practice node/);
 archetypes.questions.a.practiceItems=[{nodeIds:['root','first','first']}];assert.throws(()=>report(project,{archetypes}),/Invalid or reused practice node/);
 archetypes.questions.a.practiceItems=[{nodeIds:['root','not-a-node']}];assert.throws(()=>report(project,{archetypes}),/Invalid or reused practice node/);
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
 archetypes.topics[0].routineUpperScore=60;const upper=challengeSplitCandidate(p,{approvedCalibration:true,archetypes}).report;assert.equal(upper.topics[0].gradientGaps.length,0);assert.ok(upper.publicationHolds.some(h=>h.kind==='upper-routine-gap'));assert.equal(upper.backfillBlocked,true);
});
test('candidate adds Challenge topic and recognises an existing Challenge exercise alias',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const p={id:'p',topics:[],sections:[section('a',[q('low',20),q('a',70)]),{...section('old',[q('old',80)]),title:'Challenge exercise'}]};
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
test('Exam identity overrides practice Challenge threshold for owned and external papers',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const a=q('owned65',65),b=q('owned76',76),follow=q('follow',25,['owned65']),external=q('external',90);a.source={origin:'booklet',label:'HSC 2016'};external.source={origin:'MathsBase'};
 const exam=section('exam',[a,follow,b,external],'exam'),p={id:'p',sections:[section('routine',[q('routine',20)]),exam]},r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}});
 assert.deepEqual(r.report.moves,[]);assert.deepEqual(r.report.highOwnedExamRemaining,[]);assert.deepEqual(r.project.sections.find(s=>s.id==='exam').blocks.map(b=>b.id),['owned65','follow','owned76','external']);assert.ok(!r.report.scopeHolds.some(h=>h.kind==='external-source-eligibility'));assert.ok(!r.report.publicationHolds.some(h=>h.kind==='high-owned-end-question-remaining'));
});
test('Exam title aliases and labelled paper questions cannot move via dependency closure',()=>{
 const labelled=q('paper',75);labelled.source={provider:'HSC',label:'HSC Extension 1 2014'};const linked=q('linked',70,['paper']);
 const p={id:'p',topics:[{id:'alias',title:'Exam questions'}],sections:[section('routine',[q('spare',20),labelled,linked]),{...section('alias',[q('exam-alias',80)]),title:'Exam questions'}]},r=report(p);assert.deepEqual(r.moves,[]);assert.ok(r.scopeHolds.some(h=>h.ids?.includes('paper')));assert.equal(r.preservedExamQuestions.length,2);
});
test('continuation source stem and nested dependency owners remain a single ordered move unit',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');
 const stem=q('stem',30),part=q('part',70),last=q('last',20);stem.content={id:'stem-root',children:[{id:'shared-given',type:'part'}]};part.flow={continuationOf:'stem'};last.content={id:'last-root',dependsOn:['shared-given']};
 const p={id:'p',sections:[section('a',[stem,part,last,q('retained',20)])]},r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{questions:Object.fromEntries(['stem','part','last'].map(id=>[id,{continuationUnitReviewed:true}]))}});
 assert.deepEqual(r.report.moves.map(m=>m.id),['stem','part','last']);assert.deepEqual(r.project.sections.at(-1).blocks.map(b=>b.id),['stem','part','last']);
});
test('continuation whole unit is held when moving it would erase an exercise boundary',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs');const stem=q('stem',30),part=q('part',70);part.flow={continuationOf:'stem'};
 const p={id:'p',sections:[section('a',[stem,part])]},r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}});assert.equal(r.report.moves.length,0);assert.ok(r.report.scopeHolds.some(h=>h.reason.includes('exercise boundary')||h.reason.includes('Semantic-unit review')));assert.deepEqual(r.project.sections[0].blocks.map(b=>b.id),['stem','part']);
});
test('unreviewed mixed-score continuation is held in original placement and unchanged',async()=>{
 const {challengeSplitCandidate}=await import('../polish/challenge-split.mjs'),stem=q('stem',40),part=q('part',70),later=q('later',10);part.flow={continuationOf:'stem'};
 const p={id:'p',sections:[section('a',[stem,part,later])]},r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}});assert.deepEqual(r.project.sections[0].blocks.slice(0,2),[stem,part]);assert.equal(r.report.moves.length,0);assert.ok(r.report.scopeHolds.some(h=>h.reason.startsWith('Semantic-unit review')));
});
test('basic exercise reaching its original30 demand has no artificial64 target',async()=>{
 const{challengeSplitCandidate}=await import('../polish/challenge-split.mjs');const p={id:'p',sections:[section('a',[q('one',10),q('two',20),q('three',30)])]},archetypes={questions:Object.fromEntries(['one','two','three'].map(id=>[id,{archetype:'routine'}])),topics:[{topicId:'a',clusters:[{id:'routine',coverage:'covered',originalPracticeCount:3}]}]};
 const r=challengeSplitCandidate(p,{approvedCalibration:true,archetypes}).report;assert.equal(r.topics[0].upperRoutineTarget,30);assert.equal(r.topics[0].upperRoutineGap,0);assert.equal(r.backfillBlocked,false);assert.ok(!r.publicationHolds.some(h=>['gradient-gap','upper-routine-gap','practice-deficit'].includes(h.kind)));
 p.sections[0].blocks[1].classification.reasoningScore=22;const gap=challengeSplitCandidate(p,{approvedCalibration:true,archetypes}).report;assert.ok(gap.publicationHolds.some(h=>h.kind==='gradient-gap'));assert.equal(gap.backfillBlocked,true);
});
test('mixed independent item archetypes count5quadratic/1linear and frozen replacements do not inflate needs',()=>{
 const mixed=q('mixed',20);mixed.content={id:'root',children:Array.from({length:6},(_,i)=>({id:'part'+i,type:'part'}))};
 const items=mixed.content.children.map((n,i)=>({nodeIds:[n.id],...(i===5?{archetype:'linear'}:{})}));
 const map={questions:{mixed:{archetype:'quadratic',practiceItems:items}},topics:[{topicId:'a',clusters:[{id:'quadratic',coverage:'covered',originalPracticeCount:5},{id:'linear',coverage:'covered',originalPracticeCount:3}]}]};
 let p={sections:[section('a',[mixed])]},c=report(p,{archetypes:map}).topics[0].coverage;assert.deepEqual(c.map(x=>x.count),[5,1]);
 mixed.classification.reasoningScore=70;const existing=[q('old-linear1',20),q('old-linear2',20)],backfill=[...Array.from({length:5},(_,i)=>q('new-q'+i,20)),q('new-linear',20)];p.sections[0].blocks.push(...existing,...backfill);
 for(const b of existing)map.questions[b.id]={archetype:'linear'};for(const b of backfill)map.questions[b.id]={archetype:b.id==='new-linear'?'linear':'quadratic'};
 c=report(p,{archetypes:map}).topics[0].coverage;assert.deepEqual(c.map(x=>x.currentBeforeCount),[10,4]);assert.deepEqual(c.map(x=>x.count),[5,3]);assert.deepEqual(c.map(x=>x.target),[5,3]);assert.deepEqual(c.map(x=>x.gap),[0,0]);
});
test('unknown or malformed explicit item archetype holds sufficiency within same topic',()=>{
 const b=q('b',20);b.content={id:'root'};const map={questions:{b:{archetype:'known',practiceItems:[{nodeIds:['root'],archetype:'elsewhere'}]}},topics:[{topicId:'a',clusters:[{id:'known',coverage:'covered'}]},{topicId:'other',clusters:[{id:'elsewhere',coverage:'covered'}]}]};
 const check=()=>report({sections:[section('a',[b])]},{archetypes:map}).topics[0];assert.equal(check().sufficiencyStatus,'unassessable');assert.equal(check().invalidItemArchetypes.length,1);assert.equal(check().coverage[0].gap,null);map.questions.b.practiceItems[0].archetype=null;assert.equal(check().invalidItemArchetypes.length,1);
});
