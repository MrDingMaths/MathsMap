import test from 'node:test';
import assert from 'node:assert/strict';
import {shortlist,validateExercisePick,validateMixedPick,existingPracticeSections,exerciseAnchors,buildCandidate,bookletExclusions,CHALLENGE_SCORE,bandTargets,mixedBand,overCeiling,belowFloor,budgetFromArgs,parseSources,finishExercise,orderExercise,openingProblems} from '../pedagogy/bank-draw.mjs';
import {examQuestionGapMm,MIXED_REVIEW_QUESTION_GAP_MM,EXAM_QUESTION_GAP_MM} from '../src/lib/booklet-section-options.js';

const q=(id,prompt=id)=>({id,type:'question',classification:{primarySkillId:'s',reasoningScore:30,difficulty:'Development',difficultyReason:'r',secondarySkillIds:[]},content:{id:id+'-root',type:'question',label:null,prompt,children:[],answer:{short:'1',worked:'1',solutionDiagrams:[]}}});
const record=id=>({format:'mathsmap-practice-question-v3',version:3,status:'approved',title:'',...q(id,'Bank prompt '+id)});
const teach=(id,topicId)=>({id,topicId,role:'teaching',phase:'teaching',title:topicId,blocks:[]});
const booklet=()=>({id:'p',revision:4,settings:{paginationMode:'flexible'},topics:[{id:'a',title:'A'},{id:'b',title:'B'},{id:'n',title:'N'},{id:'exam',title:'Exam questions'},{id:'front-matter',title:'Syllabus'}],sections:[
 {id:'fm',topicId:'front-matter',role:'front-matter',phase:'front-matter',blocks:[]},
 teach('a1','a'),teach('b1','b'),teach('n1','n'),teach('b2','b'),
 {id:'ex',topicId:'exam',role:'exam',phase:'practice',title:'Exam questions',workingSpace:'none',blocks:[{...q('e1'),bankRef:{id:'q-in-booklet',revision:'x'}}]}]});

test('shortlist filters by skill, booklet ids, signatures and score, and spreads ratings', () => {
  const rows=Array.from({length:20},(_,i)=>({id:'c'+i,skill:'s',score:i*5}));
  rows.push({id:'other',skill:'t',score:10},{id:'q-in-booklet',skill:'s',score:12});
  const exclude={ids:new Set(['q-in-booklet']),signatures:new Set(['dup'])};
  const list=shortlist(rows,['s'],{exclude,perSkill:4,maxScore:CHALLENGE_SCORE-1,signaturesOf:c=>c.id==='c0'?['dup']:[]});
  assert.equal(list.length,4);
  assert.ok(list.every(c=>c.skill==='s'&&c.score<CHALLENGE_SCORE&&c.id!=='c0'&&c.id!=='q-in-booklet'));
  assert.equal(list[0].score,5);assert.equal(list.at(-1).score,55);
});

test('exercise picks come from the topic shortlist, once each, within each skill\'s item ceiling', () => {
  const lists={a:new Set(['x','y','w']),b:new Set(['z'])},items={x:3,y:3,w:3,z:1},skill={x:'s',y:'s',w:'s',z:'t'};
  const opts={itemsOf:id=>items[id],skillOf:id=>skill[id],budget:{floor:2,ceiling:6}};
  const withExamples={...opts,examples:{a:[{id:'we1'},{id:'we2'}],b:[]}};
  assert.deepEqual(validateExercisePick({topics:{a:['y','x'],b:['z']},openings:{a:{we1:'x',we2:'not-listed',stray:'y'}},notes:{s:'varied enough'}},lists,withExamples),{topics:{a:['y','x'],b:['z']},openings:{a:{we1:'x',we2:null},b:{}},notes:{s:'varied enough'}});
  assert.throws(()=>validateExercisePick({topics:{a:['x','y','w'],b:['z']}},lists,opts),/ceiling for s \(9\)/);
  assert.throws(()=>validateExercisePick({topics:{a:['z'],b:['z']}},lists,opts),/not on its shortlist/);
  assert.throws(()=>validateExercisePick({topics:{a:['x','x'],b:['z']}},lists,opts),/twice/);
  assert.throws(()=>validateExercisePick({topics:{a:['x']}},lists,opts),/b: no questions/);
});

test('a skill may end with one question across the ceiling, never two; shortfalls are reported', () => {
  const items={a:2,b:2,c:3},skillOf=()=>'s',itemsOf=id=>items[id];
  assert.deepEqual(overCeiling(['a','b','c'],{itemsOf,skillOf,ceiling:4}),[{skill:'s',items:7}]);
  assert.deepEqual(overCeiling(['a','c'],{itemsOf,skillOf,ceiling:4}),[]);
  const list=[{id:'a',skill:'s'},{id:'b',skill:'s'},{id:'c',skill:'t'}];
  assert.deepEqual(belowFloor(['a'],list,{itemsOf,floor:6}),[{skill:'s',items:2,supply:4},{skill:'t',items:0,supply:3}]);
  assert.deepEqual(belowFloor(['a','b','c'],list,{itemsOf,floor:6}),[]);
});

test('exercises fill avoidable jumps, open with worked-example practice and report the rest', () => {
  const score={o1:20,a:22,b:30,c:62,f1:40,f2:48,f3:55,late:45},skillOf=id=>id==='late'?'t':'s',itemsOf=()=>1,scoreOf=id=>score[id];
  const list=Object.keys(score).filter(id=>id!=='late').map(id=>({id,skill:skillOf(id),score:score[id]}));
  // 30→62 is avoidable: 40, 48 and 55 lie between; the script picks the one nearest the midpoint each time.
  const f=finishExercise(['a','b','c'],list,{openings:{we1:'o1',we2:null},examples:[{id:'we1'},{id:'we2'}],scoreOf,itemsOf,skillOf,ceiling:18});
  // 30→62: midpoint 46 takes 48; 48→62 is within 15; 30→48: midpoint 39 takes 40. 55 is not needed.
  assert.deepEqual(f.ids,['o1','a','b','f1','f2','c']);
  assert.deepEqual(f.added.map(a=>a.id),['o1','f2','f1']);
  assert.deepEqual(f.jumps,[]);assert.deepEqual(f.unopened,['we2']);
  // No fill fits under the ceiling: the jump is reported, not filled.
  const tight=finishExercise(['a','c'],list,{scoreOf,itemsOf,skillOf,ceiling:2});
  assert.deepEqual(tight.jumps.map(j=>[j.fromScore,j.toScore]),[[22,62]]);
  assert.deepEqual(orderExercise(['b','x','a'],{scoreOf:id=>({a:5,b:5,x:1})[id],openings:{we:'b'}}),['x','b','a']);
  const late=openingProblems(['a','b','c','late'],{we:'late'},[{id:'we'}],{scoreOf});
  assert.match(late[0],/harder half/);
});

test('budgets come from defaults or FLOOR-CEILING flags', () => {
  const b=budgetFromArgs({'exercise-items':'8-16','challenge-max':'20'});
  assert.deepEqual([b.exercises.floor,b.exercises.ceiling,b.exercises.shortlistPerSkill],[8,16,20]);
  assert.deepEqual([budgetFromArgs({}).exercises.floor,budgetFromArgs({}).exercises.ceiling],[8,18]);
  assert.deepEqual([b.mixed.floor,b.mixed.ceiling,b.challenge.max,b.challenge.perSkill],[2,4,20,1]);
  assert.throws(()=>budgetFromArgs({'mixed-items':'5-2'}),/FLOOR-CEILING/);
});

test('mixed picks interleave topics, stay on the shortlist and cap challenge per skill', () => {
  const topic={m1:'a',m2:'a',m3:'b',m4:'b'},sets={mixed:new Set(Object.keys(topic)),challenge:new Set(['c1','c2']),topicOf:id=>topic[id],skillOf:id=>id.startsWith('c')?'cs':topic[id],challengeWanted:true};
  assert.deepEqual(validateMixedPick({mixed:['m1','m3','m2','m4'],challenge:['c1']},sets),{mixed:['m1','m3','m2','m4'],challenge:['c1'],notes:{}});
  assert.throws(()=>validateMixedPick({mixed:['m1','m2','m3'],challenge:[]},sets),/adjacent/);
  assert.throws(()=>validateMixedPick({mixed:['m1','m3','c1'],challenge:[]},sets),/not on the shortlist/);
  assert.throws(()=>validateMixedPick({mixed:['m1','m3'],challenge:['c1','c2']},sets),/per skill/);
  assert.deepEqual(validateMixedPick({mixed:['m1','m3'],challenge:['c1']},{...sets,challengeWanted:false}).challenge,[]);
});

test('mixed practice keeps Foundation : Development : Mastery at 1 : 2 : 1', () => {
  assert.deepEqual(bandTargets(24,{Foundation:20,Development:20,Mastery:20}),{Foundation:6,Development:12,Mastery:6});
  assert.deepEqual(bandTargets(8,{Foundation:1,Development:20,Mastery:20}),{Foundation:1,Development:5,Mastery:2});
  assert.equal(mixedBand(55),'Mastery');assert.equal(mixedBand(60),null);
  const score={f:10,d1:30,d2:35,m:55,d3:40,d4:45},bandOf=id=>mixedBand(score[id]),supply={Foundation:5,Development:5,Mastery:5};
  const base={mixed:new Set(Object.keys(score)),challenge:new Set(),topicOf:id=>id,skillOf:id=>id,challengeWanted:false,bandOf,supply};
  assert.ok(validateMixedPick({mixed:['f','d1','d2','m']},base));
  assert.throws(()=>validateMixedPick({mixed:['d1','d2','d3','d4']},base),/Foundation|Mastery/);
});

test('sources accept series, book or chapter prefixes and all; a prefix with no textbook is refused', () => {
  assert.deepEqual(parseSources('all'),['all']);
  assert.deepEqual(parseSources('cambridge,concept-maths-adv11-ch01'),['cambridge','concept-maths-adv11-ch01']);
  assert.throws(()=>parseSources('cambrige'),/No textbook project id starts with cambrige/);
  assert.throws(()=>parseSources('all,cambridge'),/cannot be combined/);
  assert.throws(()=>parseSources(''),/--sources is required/);
});

test('existing exercises, reviews and challenges are recognised by role, title or topic', () => {
  const p=booklet();
  p.sections.splice(2,0,{id:'a-ex',topicId:'a',role:'practice',phase:'practice',title:'Exercise',blocks:[]});
  p.sections.splice(5,0,{id:'tm',topicId:'b',role:'teaching',phase:'teaching',title:'Mixed practice',blocks:[]});
  p.sections.push({id:'rv',topicId:'mixed-review',role:'mixed-practice',phase:'practice',title:'Exercise',blocks:[]},{id:'ch',topicId:'challenge',role:'challenge',phase:'practice',title:'Challenge exercise',blocks:[]},{id:'own',topicId:'b',role:'mixed-practice',phase:'practice',title:'Exercise',bankDraw:{command:'exercises'},blocks:[]});
  const e=existingPracticeSections(p);
  assert.deepEqual([...e.exercises.keys()],['a','b']);
  assert.deepEqual(e.reviews.map(s=>s.id),['rv']);
  assert.deepEqual(e.challenges.map(s=>s.id),['ch']);
  assert.equal(e.exam.id,'ex');
  assert.ok(![...e.exercises.values()].flat().some(s=>s.id==='own'));
});

test('a topic taught inside another gets its exercise after the outer topic', () => {
  const anchors=exerciseAnchors(booklet());
  assert.deepEqual(Object.fromEntries(anchors),{a:'a1',b:'b2',n:'b2'});
});

test('candidate places exercises, mixed practice before Exam and a challenge at the end', () => {
  const p=booklet(),records=id=>record(id);
  const ex=buildCandidate(p,{revision:4,command:'exercises',series:['cambridge'],createdAt:'t',sections:[{kind:'exercises',topicId:'b',bankIds:['q-2']},{kind:'exercises',topicId:'n',bankIds:['q-3']},{kind:'exercises',topicId:'a',bankIds:['q-1']}]},{recordOf:records}).project;
  assert.deepEqual(ex.sections.map(s=>s.id),['fm','a1','bank-draw-exercise-a','b1','n1','b2','bank-draw-exercise-b','bank-draw-exercise-n','ex']);
  const s=ex.sections.find(x=>x.id==='bank-draw-exercise-a');
  assert.equal(s.role,'mixed-practice');assert.equal(s.pageBreakBefore,true);assert.equal(s.bankDraw.command,'exercises');
  assert.equal(s.blocks[0].bankRef.id,'q-1');assert.equal(s.blocks[0].snapshotKind,'bank');
  const mixed=buildCandidate({...ex,revision:5},{revision:5,command:'mixed',series:['concept-maths'],createdAt:'t',sections:[{kind:'mixed',bankIds:['q-4','q-5']},{kind:'challenge',bankIds:['q-6']}]},{recordOf:records}).project;
  const ids=mixed.sections.map(x=>x.id);
  assert.deepEqual(ids.slice(-3),['bank-draw-mixed-practice','ex','bank-draw-challenge']);
  const m=mixed.sections.find(x=>x.id==='bank-draw-mixed-practice');
  assert.equal(m.workingSpace,'none');assert.equal(m.title,'Mixed practice');
  assert.deepEqual(mixed.topics.map(t=>t.id),['a','b','n','bank-draw-mixed-practice','exam','challenge','front-matter']);
  assert.equal(bookletExclusions(mixed).ids.size,7);
});

test('a re-run replaces only its own sections; booklet ids and stale revisions are refused', () => {
  const p=booklet(),recordOf=id=>record(id),proposal=ids=>({revision:4,command:'exercises',series:['cambridge'],createdAt:'t',sections:[{kind:'exercises',topicId:'a',bankIds:ids}]});
  const once=buildCandidate(p,proposal(['q-1']),{recordOf}).project;
  const twice=buildCandidate({...once,revision:4},proposal(['q-9']),{recordOf}).project;
  assert.deepEqual(twice.sections.filter(s=>s.bankDraw).flatMap(s=>s.blocks.map(b=>b.bankRef.id)),['q-9']);
  assert.throws(()=>buildCandidate(p,proposal(['q-in-booklet']),{recordOf}),/already in the booklet/);
  assert.throws(()=>buildCandidate({...p,revision:5},proposal(['q-1']),{recordOf}),/Propose again/);
  const withChallenge={...p,sections:[...p.sections,{id:'ch',topicId:'challenge',role:'challenge',phase:'practice',blocks:[]}]};
  assert.throws(()=>buildCandidate(withChallenge,{revision:4,command:'mixed',series:[],createdAt:'t',sections:[{kind:'challenge',bankIds:['q-1']}]},{recordOf}),/already has a Challenge/);
});

test('mixed practice prints a 5 mm gap; Exam and Challenge keep 10 mm', () => {
  const blocks=[{id:'1',type:'question'},{id:'2',type:'question'}];
  assert.equal(MIXED_REVIEW_QUESTION_GAP_MM,5);
  assert.equal(examQuestionGapMm({role:'mixed-practice',bankDraw:{command:'mixed'}},blocks,blocks[0]),0);
  assert.equal(examQuestionGapMm({role:'mixed-practice',bankDraw:{command:'mixed'}},blocks,blocks[1]),5);
  assert.equal(examQuestionGapMm({role:'mixed-practice',bankDraw:{command:'exercises'}},blocks,blocks[1]),0);
  assert.equal(examQuestionGapMm({role:'mixed-practice',title:'Mixed practice'},blocks,blocks[1]),0);
  assert.equal(examQuestionGapMm({role:'exam'},blocks,blocks[1]),EXAM_QUESTION_GAP_MM);
});
