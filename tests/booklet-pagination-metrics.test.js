import test from 'node:test';
import assert from 'node:assert/strict';
import {bandIndex,difficultyInversions,lowerBoundPages,exerciseStructure,bodyMetrics,answerMetrics,paginationMetrics,compareMetrics,bodyEqualsStudent} from '../src/lib/booklet-pagination-metrics.js';

const rated=(id,score)=>({id,type:'question',flow:{localDifficulty:{reasoningScore:score}}});
const project=()=>({
 settings:{exerciseOrganisation:'topic'},
 topics:[{id:'t1'}],
 sections:[
  {id:'teach',phase:'teaching',topicId:'t1',blocks:[{id:'theory',type:'rich-text'}]},
  {id:'practice',phase:'practice',topicId:'t1',blocks:[rated('q1',10),rated('q2',60),rated('q3',20),rated('q4',30)]},
 ],
});
const page=(number,blocks,usedMm,{capacityMm=270,elements=[],isAnswer=false,isCover=false}={})=>({page:number,blocks,isAnswer,isCover,space:isCover?null:{capacityMm,usedMm,remainingMm:capacityMm-usedMm},elements});
const q=(id,y,h)=>({id,kind:'question',y,h});

test('reasoning scores fall into ordered difficulty bands',()=>{
 assert.deepEqual([0,24,25,49,50,79,80,100].map(bandIndex),[0,0,1,1,2,2,3,3]);
 assert.equal(bandIndex(null),null);
});
test('inversions count pairs, adjacent drops and band distance, skipping unrated questions',()=>{
 assert.deepEqual(difficultyInversions([10,30,60,90]),{pairs:0,penalty:0,adjacent:0,rated:4,unrated:0});
 const result=difficultyInversions([90,10,null,30]);
 assert.equal(result.pairs,2);assert.equal(result.penalty,3+2);assert.equal(result.adjacent,1);assert.equal(result.unrated,1);
 assert.equal(difficultyInversions([60,30,10]).penalty,1+2+1);
});
test('lower bound is the page count of a perfect packing',()=>{
 assert.equal(lowerBoundPages([100,100,71],270),2);
 assert.equal(lowerBoundPages([270],270),1);
 assert.equal(lowerBoundPages([270.5],270),2);
 assert.equal(lowerBoundPages([],270),0);
});
test('exercises collect practice questions only, in project order',()=>{
 const [exercise]=exerciseStructure(project());
 assert.deepEqual(exercise.blockIds,['q1','q2','q3','q4']);
 assert.equal(exercise.scores.q2,60);
});
test('body metrics report wasted pages, trailing whitespace and inversions from displayed order',()=>{
 // Three pages hold 440 mm of questions, which two pages could carry.
 const pages=[
  page(1,[],0,{isCover:true}),
  page(2,['theory'],40,{elements:[]}),
  page(3,['q1','q2'],150,{elements:[q('q1',20,70),q('q2',100,70)]}),
  page(4,['q3'],120,{elements:[q('q3',20,100)]}),
  page(5,['q4'],210,{elements:[q('q4',20,200)]}),
 ];
 const result=bodyMetrics(project(),pages);
 const [exercise]=result.exercises;
 assert.equal(result.bodyPages,4);assert.equal(result.coverPages,1);
 assert.deepEqual(exercise.pages,[3,4,5]);
 assert.equal(exercise.lowerBound,2);assert.equal(exercise.wastedPages,1);
 // Pages 3 and 4 are not the last page, so their 120 and 150 mm count.
 assert.deepEqual(exercise.trailing.map(t=>t.trailingMm),[120,150]);
 assert.equal(exercise.trailingMm,270);
 // q2 (Mastery) before q3 and q4 (Development) is two inversions.
 assert.equal(exercise.inversions.pairs,2);
 assert.equal(result.fillPct,Math.round(1000*(40+150+120+210)/(4*270))/10);
});
test('a split block sums its fragments into one unit',()=>{
 const pages=[
  page(2,['q1'],200,{elements:[q('q1',20,180)]}),
  page(3,['q1','q2'],200,{elements:[q('q1',10,60),q('q2',80,100)]}),
 ];
 const [exercise]=bodyMetrics(project(),pages).exercises;
 // 240 + 100 mm of content plus the 10 mm gap observed between q1 and q2 for each unit.
 assert.equal(exercise.unitHeightsMm,240+100+2*10);
});
test('displayed order, not stored order, decides inversions',()=>{
 const pages=[page(2,['q3','q1','q2','q4'],250,{elements:[q('q3',10,50),q('q1',70,50),q('q2',130,50),q('q4',190,50)]})];
 const [exercise]=bodyMetrics(project(),pages).exercises;
 // Scores 20,10,60,30: only (60,30) is out of order.
 assert.equal(exercise.inversions.pairs,1);
 const sorted=[page(2,['q1','q3','q4','q2'],250,{elements:[q('q1',10,50),q('q3',70,50),q('q4',130,50),q('q2',190,50)]})];
 assert.equal(bodyMetrics(project(),sorted).exercises[0].inversions.pairs,0);
});
test('guards: short and worked may not gain pages, and combined bodies equal the Questions body',()=>{
 const reference={student:{pages:10,totals:{wastedPages:2,trailingMm:300,inversionPenalty:5}},short:{pages:3},worked:{pages:8},'with-short':{pages:13,bodyEqualsStudent:true}};
 const better={student:{pages:9,totals:{wastedPages:1,trailingMm:120,inversionPenalty:2}},short:{pages:3},worked:{pages:8},'with-short':{pages:12,bodyEqualsStudent:true}};
 assert.equal(compareMetrics(reference,better).passed,true);
 const worse={...better,worked:{pages:9},'with-short':{pages:12,bodyEqualsStudent:false}};
 const result=compareMetrics(reference,worse);
 assert.deepEqual(result.violations.map(v=>v.kind).sort(),['combined-body-differs-from-student','guard-edition-gained-pages']);
 assert.equal(compareMetrics(reference,{...better,student:{...better.student,pages:11}}).violations[0].kind,'objective-edition-gained-pages');
});
test('combined-edition comparison and answer metrics',()=>{
 const body=[page(1,['a'],100),page(2,['b'],100)];
 assert.equal(bodyEqualsStudent(body,[...body,page(3,['a'],50,{isAnswer:true})]),true);
 assert.equal(bodyEqualsStudent(body,[page(1,['b'],100),page(2,['a'],100)]),false);
 assert.deepEqual(answerMetrics([page(1,['a'],135,{isAnswer:true,capacityMm:270})]),{pages:1,answerPages:1,fillPct:50});
 const all=paginationMetrics(project(),{student:{pages:[page(1,['q1'],100,{elements:[q('q1',10,80)]})]},short:{pages:[page(1,['q1'],100,{isAnswer:true})]}});
 assert.equal(all.student.pages,1);assert.equal(all.short.answerPages,1);
});
