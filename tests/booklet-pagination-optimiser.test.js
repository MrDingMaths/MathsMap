import test from 'node:test';
import assert from 'node:assert/strict';
import {optimisePagination,bandAllows,describeUnits,belowFloor,tightenToFloor,gridCandidates,betterObjective,optimisableSections} from '../src/lib/booklet-pagination-optimiser.js';
import {exerciseUnits,ratingHash,organiseExercises} from '../src/lib/booklet-exercises.js';
import {tightenStages,newSplits} from '../src/lib/booklet-layout-actions.js';
import {calibratedWorkingSpace,estimateWorkedWritingSpace,WORKING_SPACE_CALIBRATION_20261022 as CAL} from '../src/lib/booklet-working-space.js';
import {fitKind,fitLad,applyFit} from '../paginate/lib/working-space-fit.mjs';
import {applyCalibratedWorkingSpace} from '../paginate/lib/working-space-apply.mjs';

const CAPACITY=100;
const question=(id,score,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Q '+id,...(extra.content??{})},flow:{localDifficulty:{reasoningScore:score},...(extra.flow??{})},...Object.fromEntries(Object.entries(extra).filter(([k])=>!['content','flow'].includes(k)))});
const project=(blocks,{sections=null,settings={}}={})=>({id:'fake',settings:{layoutOverrides:{},...settings},studio:{flags:[]},sections:sections??[{id:'s1',phase:'practice',topicId:'t',blocks}]});
// A fake paginator: first fit per section, each section on a fresh page, heights by block id.
function fakePaginator(heights,{split=null,leak=false}={}){
 const calls=[];
 const paginate=async(p,focus)=>{
  calls.push(focus);
  const pages=[];
  for(const section of p.sections){
   let current=null;
   const flush=()=>{if(current)pages.push(current);current=null;};
   if(leak&&pages.length&&section.id==='s1')current=pages.pop();
   for(const b of section.blocks){
    const h=heights[b.id]??10;
    if(split?.(p,b)){flush();pages.push({blocks:[b],space:{capacityMm:CAPACITY,usedMm:h/2,remainingMm:CAPACITY-h/2},elements:[{id:b.id,kind:'question',h:h/2}]});pages.push({blocks:[b],space:{capacityMm:CAPACITY,usedMm:h/2,remainingMm:CAPACITY-h/2},elements:[{id:b.id,kind:'question',h:h/2}]});continue;}
    if(current&&current.space.usedMm+h>CAPACITY)flush();
    if(!current)current={blocks:[],space:{capacityMm:CAPACITY,usedMm:0,remainingMm:CAPACITY},elements:[]};
    current.blocks.push(b);current.space.usedMm+=h;current.space.remainingMm=CAPACITY-current.space.usedMm;current.elements.push({id:b.id,kind:'question',h});
   }
   flush();
  }
  return {pages,issues:[]};
 };
 paginate.calls=calls;return paginate;
}
const ids=p=>p.sections[0].blocks.map(b=>b.id);

test('bandAllows preserves difficulty progression as well as band distance and barriers',()=>{
 const unit=(band,extra={})=>({band,barrier:false,...extra});
 const units=[unit(0),unit(1),unit(2),unit(3)];
 assert.equal(bandAllows(units,2,1),false,'space filling cannot put Mastery before Development');
 assert.equal(bandAllows(units,2,0),false,'Mastery over Foundation is two bands');
 assert.equal(bandAllows(units,3,1),false);
 assert.equal(bandAllows([unit(1),unit(1,{barrier:true}),unit(1)],2,1),false,'cannot jump a barrier');
 assert.equal(bandAllows([unit(null),unit(1)],1,0),false,'an unrated unit is never jumped');
 assert.equal(bandAllows([unit(1),unit(null,{barrier:true})],1,0),false);
 assert.equal(bandAllows([unit(1),unit(2)],0,2),false,'moving Development behind Mastery also creates an inversion');
 assert.equal(bandAllows([unit(2),unit(1)],1,0),true,'an easier task can move before a harder one');
 assert.equal(bandAllows([unit(1),unit(1)],1,0),true,'same-band gap filling remains available');
});

test('the optimiser fills a gap with a later unit within one band, and records the move',async()=>{
 // Page 1: A(60) then B(50) does not fit with it; C(30) fits the 40 mm gap. A=F, B=D, C=D (all within 1 band of each other).
 const blocks=[question('A',10),question('B',30),question('C',32)];
 const heights={A:60,B:50,C:30};
 const p=project(blocks);
 const result=await optimisePagination(p,{paginate:fakePaginator(heights),now:()=>'2026-10-22T00:00:00.000Z',gapMm:15});
 assert.deepEqual(ids(result.project),['A','C','B']);
 assert.equal(result.before.pages,2);
 assert.equal(result.after.pages,2);
 const move=result.moves.find(m=>m.type==='reorder');
 assert.ok(move,'a reorder move was recorded');
 assert.deepEqual(move.blockIds,['C']);assert.deepEqual(move.jumped,['B']);assert.equal(move.band,'Development');
 const auto=result.project.sections[0].blocks.find(b=>b.id==='C').flow.autoOrder;
 assert.equal(auto.rank,1);assert.equal(auto.from,2);assert.equal(auto.band,'Development');assert.equal(auto.at,'2026-10-22T00:00:00.000Z');
 assert.equal(auto.ratingHash,ratingHash(result.project.sections[0].blocks.find(b=>b.id==='C')));
});

test('a unit two bands away is never pulled across',async()=>{
 // C is Mastery (55) and would fit page 1's gap, but B is Foundation: two bands.
 const blocks=[question('A',10),question('B',10),question('C',55)];
 const p=project(blocks);
 const result=await optimisePagination(p,{paginate:fakePaginator({A:60,B:50,C:30}),gapMm:15});
 assert.deepEqual(ids(result.project),['A','B','C']);
 assert.equal(result.moves.length,0);
 assert.ok(result.rejected.some(r=>r.reason==='band'));
});

test('units joined by dependsOn, pairedBlockId, keepWithNext and continuations move together',()=>{
 const blocks=[question('a',10),question('b',10,{dependsOn:['d-root']}),question('c',10),question('d',10),question('e',10,{flow:{keepWithNext:true}}),question('f',10),question('g',10,{pairedBlockId:'h'}),question('h',10),question('i',10,{flow:{continuationOf:'h'}}),question('j',10)];
 const {groups}=exerciseUnits({id:'s',blocks});
 const names=groups.map(g=>g.blocks.map(b=>b.id).join(''));
 assert.deepEqual(names,['a','bcd','ef','ghi','j']);
 const units=describeUnits({id:'s',blocks});
 assert.equal(units.length,5);
});

test('the optimiser never separates a joined unit',async()=>{
 const blocks=[question('A',10),question('B',10),question('C',12,{flow:{keepWithNext:true}}),question('D',12)];
 const heights={A:60,B:50,C:15,D:15};
 const result=await optimisePagination(project(blocks),{paginate:fakePaginator(heights),gapMm:15});
 const order=ids(result.project);
 assert.equal(order.indexOf('D'),order.indexOf('C')+1,'C and D stay adjacent');
});

test('a trial that would split a block is rejected',async()=>{
 const blocks=[question('A',10),question('B',30),question('C',32)];
 const heights={A:60,B:50,C:30};
 // Placing C straight after A splits C in this fake.
 const split=(p,b)=>b.id==='C'&&p.sections[0].blocks.findIndex(x=>x.id==='C')===1;
 const result=await optimisePagination(project(blocks),{paginate:fakePaginator(heights,{split}),gapMm:15});
 assert.deepEqual(ids(result.project),['A','B','C']);
 assert.ok(result.rejected.some(r=>r.reason==='new-split'));
 const before={pages:[{blocks:[{id:'x'}]}]},after={pages:[{blocks:[{id:'x'}]},{blocks:[{id:'x'}]}]};
 assert.deepEqual(newSplits(before,after),['x']);
});

test('an exercise that stops starting a page is rejected',async()=>{
 const blocks=[question('A',10),question('B',30),question('C',32)];
 const result=await optimisePagination(project(blocks),{paginate:fakePaginator({A:60,B:50,C:30},{leak:false}),gapMm:15});
 assert.ok(result.moves.length>0);
 // A paginator that lets the previous page's last block share the exercise's first page.
 const sections=[{id:'t0',phase:'teaching',topicId:'t',blocks:[{id:'T',type:'rich-text',content:'text'}]},{id:'s1',phase:'practice',topicId:'t',blocks}];
 const merged=fakePaginator({A:60,B:50,C:30,T:10});
 const mergingPaginate=async(p,focus)=>{const out=await merged(p,focus);const [first,second]=out.pages;if(second)second.blocks.unshift(first.blocks[0]);return out;};
 const rejected=await optimisePagination(project(blocks,{sections}),{paginate:mergingPaginate,gapMm:15});
 assert.equal(rejected.moves.length,0);
 assert.ok(rejected.exercises.some(e=>e.skipped==='does not start a page'));
});

test('a candidate that takes an allowance below the floor is refused; the optimiser never goes under it',()=>{
 const node=id=>({id,type:'part',prompt:'x',answerSpaceMm:80,answer:{short:'1',worked:'$$x=1\\\\x=2\\\\x=3$$'}});
 const block=question('A',10,{content:{children:[node('A-a')]}});
 block.sourceReview={responses:[{targetId:'A-a',kind:'working'}],workingSpaceEstimate:{estimates:[{targetId:'A-a',answerSpaceMm:80}]}};
 const p=project([block]);
 const floor=calibratedWorkingSpace(block.content.children[0],{responseKind:'working',importMm:80});
 assert.ok(floor>0&&floor<80);
 const tight=tightenToFloor(p,0);
 assert.equal(tight.changes.length,1);
 assert.equal(tight.project.sections[0].blocks[0].content.children[0].answerSpaceMm,floor);
 assert.equal(belowFloor(p,tight.project,0).length,0);
 const lower=structuredClone(tight.project);lower.sections[0].blocks[0].content.children[0].answerSpaceMm=floor-3;
 assert.equal(belowFloor(p,lower,0).length,1,'under the floor');
 assert.equal(belowFloor(tight.project,tight.project,0).length,0);
 // A value already under the floor is not a violation.
 const low=structuredClone(p);low.sections[0].blocks[0].content.children[0].answerSpaceMm=floor-4;
 assert.equal(belowFloor(low,low,0).length,0);
});

test('tightening that removes a page is kept, and never goes below the floor',async()=>{
 const node=id=>({id,type:'part',prompt:'x',answerSpaceMm:80,answer:{short:'1',worked:'$$x=1\\\\x=2\\\\x=3$$'}});
 const a=question('A',10,{content:{children:[node('A-a')]}}),b=question('B',12);
 a.sourceReview={responses:[{targetId:'A-a',kind:'working'}],workingSpaceEstimate:{estimates:[{targetId:'A-a',answerSpaceMm:80}]}};
 const floor=calibratedWorkingSpace(a.content.children[0],{responseKind:'working',importMm:80});
 // The fake gives A the height of its allowance; B fills the rest of the page only when A is tight.
 const paginate=async(p)=>{
  const h=p.sections[0].blocks.map(x=>x.id==='A'?x.content.children[0].answerSpaceMm+10:30);
  const pages=[];let cur=null;
  p.sections[0].blocks.forEach((x,i)=>{if(cur&&cur.space.usedMm+h[i]>CAPACITY){pages.push(cur);cur=null;}if(!cur)cur={blocks:[],space:{capacityMm:CAPACITY,usedMm:0,remainingMm:CAPACITY},elements:[]};cur.blocks.push(x);cur.space.usedMm+=h[i];cur.space.remainingMm=CAPACITY-cur.space.usedMm;cur.elements.push({id:x.id,kind:'question',h:h[i]});});
  if(cur)pages.push(cur);return {pages,issues:[]};
 };
 const result=await optimisePagination(project([a,b]),{paginate});
 assert.equal(result.before.pages,2);assert.equal(result.after.pages,1);
 assert.equal(result.project.sections[0].blocks[0].content.children[0].answerSpaceMm,floor);
 assert.ok(result.moves.every(m=>m.type!=='tighten'||m.after>=floor));
});

test('the short and worked guard reverts an exercise whose answers got longer',async()=>{
 const blocks=[question('A',10),question('B',30),question('C',32)];
 const heights={A:60,B:50,C:30};
 const guard=async(p)=>({short:ids(p).join('')==='ABC'?5:6,worked:10});
 const result=await optimisePagination(project(blocks),{paginate:fakePaginator(heights),guard,gapMm:15});
 assert.deepEqual(ids(result.project),['A','B','C']);
 assert.equal(result.moves.length,0);
 assert.ok(result.rejected.some(r=>r.reason==='guard-edition-gained-pages'));
});

test('a teacher-reviewed booklet is refused unless named',async()=>{
 const p=project([question('A',10)]);p.studio.flags=[{id:'f',note:'x',at:'2026-10-18T00:00:00Z'}];
 await assert.rejects(optimisePagination(p,{paginate:fakePaginator({})}),/named explicitly/);
 const named=await optimisePagination(p,{paginate:fakePaginator({}),named:true});
 assert.equal(named.moves.length,0);
});

test('betterObjective orders pages, then trailing whitespace, then inversions',()=>{
 const o=(pages,trailingMm,inversionPenalty)=>({pages,trailingMm,inversionPenalty});
 assert.equal(betterObjective(o(3,500,9),o(4,10,0)),true);
 assert.equal(betterObjective(o(4,100,9),o(4,120,0)),true);
 assert.equal(betterObjective(o(4,100.2,1),o(4,100,2)),true,'within the tolerance the inversion penalty decides');
 assert.equal(betterObjective(o(4,100,3),o(4,100,2)),false);
});

test('grid candidates are questions whose parts are all short',()=>{
 const part=(id,prompt='Solve x')=>({id,type:'part',prompt,answerSpaceMm:12,answer:{short:'1',worked:'1'}});
 const short=question('S',10,{content:{children:[part('a'),part('b'),part('c')]}});
 const long=question('L',10,{content:{children:[part('a','x'.repeat(200)),part('b')]}});
 const grid=question('G',10,{content:{layout:'grid',columns:2,children:[part('a'),part('b')]}});
 const saved=question('P',10,{content:{children:[{...part('a'),dependsOn:['b']},part('b')]}});
 assert.deepEqual(gridCandidates({blocks:[short,long,grid,saved]}).map(b=>b.id),['S']);
});

test('grid candidates include questions whose parts are each one graph of at most half a column',()=>{
 const graph=(id,widthMm,extra={})=>({id,type:'part',prompt:'',answerSpaceMm:50,questionDiagrams:[{id:id+'-graph',format:'tikz',widthMm}],answer:{short:'1',worked:'1'},...extra});
 const graphs=question('F',10,{content:{children:[graph('a',72),graph('b',76),graph('c',54),graph('d',76)]}});
 const wide=question('W',10,{content:{children:[graph('a',72),graph('b',120)]}});
 const two=question('T',10,{content:{children:[{...graph('a',60),questionDiagrams:[{id:'x',widthMm:30},{id:'y',widthMm:30}]},graph('b',60)]}});
 const dependent=question('D',10,{content:{children:[graph('a',60),graph('b',60,{dependsOn:['a']})]}});
 const shared=question('R',10,{content:{questionDiagrams:[{id:'r',widthMm:60}],children:[graph('a',60),graph('b',60)]}});
 assert.deepEqual(gridCandidates({blocks:[graphs,wide,two,dependent,shared]}).map(b=>b.id),['F']);
});

test('exercises that share a page with the section before are not optimised',()=>{
 const p=project(null,{sections:[{id:'s1',phase:'practice',topicId:'t',blocks:[question('A',10)]},{id:'s2',phase:'practice',topicId:'t',pageBreakBefore:false,blocks:[question('B',10)]}]});
 assert.deepEqual(optimisableSections(p).map(x=>x.section.id),['s1']);
});

// ---- organiseExercises and autoOrder ------------------------------------------------

const organiseFixture=()=>({id:'o',settings:{paginationMode:'flexible',compactAnswers:{}},topics:[{id:'t',title:'T'}],studio:{version:1,flags:[]},sections:[{id:'s',phase:'practice',topicId:'t',blocks:[question('q1',50),question('q2',10),question('q3',30)]}]});

test('organiseExercises sorts by score when no autoOrder is recorded',()=>{
 const result=organiseExercises(organiseFixture());
 assert.deepEqual(result.sections[0].blocks.map(b=>b.id),['q2','q3','q1']);
});

test('organiseExercises keeps the optimiser rank while every ratingHash matches',()=>{
 const p=organiseFixture();
 const stamp=(b,rank)=>{b.flow={...b.flow,autoOrder:{rank,from:0,band:'x',reason:'test',at:'t',ratingHash:ratingHash(b)}};};
 const [q1,q2,q3]=p.sections[0].blocks;
 stamp(q2,0);stamp(q1,1);stamp(q3,2); // the optimiser put q1 ahead of q3
 const result=organiseExercises(p);
 assert.deepEqual(result.sections[0].blocks.map(b=>b.id),['q2','q1','q3']);
 assert.ok(result.sections[0].blocks.every(b=>b.flow.autoOrder));
});

test('organiseExercises re-sorts and drops autoOrder when a rating changed',()=>{
 const p=organiseFixture();
 const [q1,q2,q3]=p.sections[0].blocks;
 for(const [b,rank] of [[q2,0],[q1,1],[q3,2]])b.flow={...b.flow,autoOrder:{rank,from:0,band:'x',reason:'test',at:'t',ratingHash:ratingHash(b)}};
 q3.flow.localDifficulty={reasoningScore:5}; // re-rated after the order was made
 const result=organiseExercises(p);
 assert.deepEqual(result.sections[0].blocks.map(b=>b.id),['q3','q2','q1']);
 assert.ok(result.sections[0].blocks.every(b=>b.flow.autoOrder==null),'stale ranks are dropped');
});

test('exerciseUnits is what organiseExercises sorts',()=>{
 const p=organiseFixture();
 const {groups,unresolved}=exerciseUnits(p.sections[0]);
 assert.equal(groups.length,3);assert.equal(unresolved,false);
 assert.equal(exerciseUnits({id:'s',blocks:[question('x',1,{dependsOn:['missing']})]}).unresolved,true);
});

// ---- calibration -------------------------------------------------------------------

test('fitKind keeps at most 5% of calibrated values below the teacher allowance',()=>{
 let seed=7;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const rows=Array.from({length:600},()=>{const raw=12+Math.floor(rand()*70);const final=Math.max(0,Math.round(0.5*raw+rand()*20-6));return {raw,final,old:raw,kind:'working'};});
 const fit=fitKind(rows);
 const under=rows.filter(r=>applyFit(fit,r.raw)<r.final).length/rows.length;
 assert.ok(under<=0.05,'underestimates '+under);
 assert.ok(fit.scale>=0.2&&fit.scale<=1.5);
 assert.equal(applyFit(fit,0),0,'a response with no writing space stays zero');
 assert.ok(applyFit(fit,5)>=8,'never under the handwriting minimum');
});

test('fitLad matches the median of the teacher finals and the 5% fit stays the safe bound',()=>{
 let seed=11;const rand=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const rows=Array.from({length:800},()=>{const old=14+Math.floor(rand()*50);const final=Math.max(0,Math.round(0.6*old+2+rand()*8-4));return {old,raw:old,final,kind:'working'};});
 const lad=fitLad(rows,'old'),safe=fitKind(rows.map(r=>({...r})));
 assert.ok(Math.abs(lad.scale-0.6)<=0.1,'scale '+lad.scale);
 assert.ok(lad.mae<=3,'mae '+lad.mae);
 assert.ok(Math.abs(lad.meanEstimate-lad.meanFinal)<1.5,'matches the teacher on average');
 assert.ok(lad.underOver2Pct>10,'a median fit leaves a real share a little short');
 assert.ok(safe.mae>lad.mae);
});

test('calibratedWorkingSpace uses the import value when there is one, the estimate otherwise, with a hard minimum',()=>{
 const node={id:'n',type:'part',prompt:'x',answer:{short:'4',worked:'$$x=1\\x=2\\x=3\\x=4$$'}};
 const raw=estimateWorkedWritingSpace(node,{preserveExplicit:false});
 const fit=CAL.kinds.working;
 assert.equal(calibratedWorkingSpace(node),Math.max(CAL.floorMm,Math.ceil(fit.fromEstimate.scale*raw+fit.fromEstimate.offset-1e-9)));
 assert.equal(calibratedWorkingSpace(node,{importMm:34}),Math.max(CAL.floorMm,Math.ceil(fit.fromImport.scale*34+fit.fromImport.offset-1e-9)));
 assert.ok(calibratedWorkingSpace(node,{importMm:34})<34,'the median is under a typical import value');
 assert.equal(calibratedWorkingSpace(node,{importMm:1}),CAL.floorMm,'never under the hard minimum');
 assert.equal(calibratedWorkingSpace(node,{responseKind:'cloze'}),0);
 assert.equal(calibratedWorkingSpace(node,{responseContext:{kind:'table-cell',providesWritingSpace:true}}),0);
 assert.ok(calibratedWorkingSpace({...node,answerSpaceMm:3})>=CAL.floorMm,'a stored value is ignored');
 const long={id:'s',type:'part',prompt:'x',answer:{short:'a long expected answer that wraps over several handwritten lines of working',worked:'x'}};
 const kind={responseKind:'short',responseContext:{kind:'short',expectedAnswer:long.answer.short},widthMm:60};
 assert.ok(calibratedWorkingSpace(long,{...kind,importMm:12})>=estimateWorkedWritingSpace(long,{...kind,preserveExplicit:false}),'the handwriting rule for a short answer is a minimum');
});

test('working-space apply moves an allowance still equal to its import value either way, and leaves the rest',()=>{
 const part=(id,mm,rows)=>({id,type:'part',prompt:'x',answerSpaceMm:mm,answer:{short:'1',worked:'$$'+Array.from({length:rows},(_,i)=>'x='+i).join('\\')+'$$'}});
 const block=(id,parts,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Q',children:parts},sourceReview:{responses:parts.map(p=>({targetId:p.id,kind:'working'})),workingSpaceEstimate:{method:'solution-steps',estimates:parts.map(p=>({targetId:p.id,widthMm:80,mathematicalRows:3,answerSpaceMm:p.answerSpaceMm}))},...extra}});
 const big=part('A-a',60,4),tight=part('A-b',4,6),moved=part('A-c',40,3);
 const project={id:'x',settings:{layoutOverrides:{blockLayouts:{},answerSpaces:{}}},studio:{flags:[]},sections:[{id:'s',phase:'practice',topicId:'t',blocks:[block('A',[big,tight,moved]),block('P',[part('P-a',60,4)],{intentionalDepartures:[{note:'kept'}]})]}]};
 project.sections[0].blocks[0].content.children[2].answerSpaceMm=44; // changed since import: not equal to its recorded value
 const {project:next,changes}=applyCalibratedWorkingSpace(project,{history:false});
 const kids=next.sections[0].blocks[0].content.children;
 assert.ok(kids[0].answerSpaceMm<60,'lowered');
 assert.equal(kids[1].answerSpaceMm,8,'raised to the hard minimum');
 assert.equal(kids[2].answerSpaceMm,44,'a changed value is left alone');
 assert.equal(next.sections[0].blocks[1].content.children[0].answerSpaceMm,60,'a protected block is left alone');
 assert.equal(changes.length,2);
 const flagged=structuredClone(project);flagged.studio.flags=[{id:'f',note:'x',at:'2026-10-18T00:00:00Z'}];
 assert.throws(()=>applyCalibratedWorkingSpace(flagged,{history:false}),/named explicitly/);
 assert.ok(applyCalibratedWorkingSpace(flagged,{history:false,named:true}).changes.length===2);
});

test('tightenStages never reduces working space below the calibrated allowance',()=>{
 const part={id:'P-a',type:'part',prompt:'x',answerSpaceMm:90,answer:{short:'4',worked:'$$x=1\\\\x=2\\\\x=3\\\\x=4$$'}};
 const block={id:'P',type:'question',content:{id:'P-root',type:'question',prompt:'Q',children:[part]},sourceReview:{responses:[{targetId:'P-a',kind:'working'}]}};
 const p={id:'x',settings:{layoutOverrides:{blockLayouts:{},answerSpaces:{}}},sections:[{id:'s',phase:'practice',topicId:'t',blocks:[block]}]};
 const floor=calibratedWorkingSpace(part,{responseKind:'working'});
 const stages=tightenStages(p,'P');
 const surplus=stages.find(s=>s.label==='Surplus working space');
 assert.ok(surplus,'surplus working space stage exists');
 const value=surplus.project.settings.layoutOverrides.answerSpaces?.['P-a']??surplus.project.sections[0].blocks[0].content.children[0].answerSpaceMm;
 for(const stage of stages){const v=stage.project.settings.layoutOverrides.answerSpaces?.['P-a'];if(v!=null)assert.ok(v>=floor,'stage '+stage.label+' went below the floor');}
 assert.ok(value==null||value>=floor);
});

test('in a topic booklet only the first practice section of a topic starts a page',()=>{
 const p=project(null,{settings:{exerciseOrganisation:'topic'},sections:[
  {id:'t1',phase:'teaching',topicId:'a',blocks:[{id:'T1',type:'rich-text',content:'x'}]},
  {id:'p1',phase:'practice',topicId:'a',blocks:[question('A',10)]},
  {id:'t2',phase:'teaching',topicId:'a',pageBreakBefore:false,blocks:[{id:'T2',type:'rich-text',content:'x'}]},
  {id:'p2',phase:'practice',topicId:'a',pageBreakBefore:false,blocks:[question('B',10)]},
  {id:'p3',phase:'practice',topicId:'b',blocks:[question('C',10)]}]});
 assert.deepEqual(optimisableSections(p).map(x=>x.section.id),['p1','p3']);
});
