// How well a rendered edition uses its pages. Pure: no DOM and no browser. The
// input is the per-page geometry recorded by bench/render-geometry.mjs (or any
// source with the same page fields) plus the project that was rendered.
//
//   page = {page, blocks:[blockId], isAnswer, isCover, space:{capacityMm,usedMm,remainingMm}|null,
//           trailingMm, elements:[{id,kind,y,h}]}
//
// `student` is the objective. `short` and `worked` are guards that may not gain
// pages. A `with-*` body is the `student` body, so only its answer tail differs.
import {isPractice,exerciseNumbers} from './booklet-flow.js';
import {DIFFICULTIES,difficultyBandForScore} from './practice-question-model.js';

const round=(value,places=1)=>Math.round(value*10**places)/10**places;
const sum=values=>values.reduce((total,value)=>total+value,0);
const median=values=>{const s=[...values].sort((a,b)=>a-b);return s.length?(s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2:0;};

export const BODY_EDITIONS=Object.freeze(['student','with-short','with-worked']);
export const GUARD_EDITIONS=Object.freeze(['short','worked']);

// Difficulty bands in teaching order; unknown scores sit outside the order.
export const bandIndex=score=>Number.isFinite(score)?DIFFICULTIES.findIndex(d=>d.id===difficultyBandForScore(score)):null;
export const reasoningScore=block=>{const rating=block?.flow?.bankDifficulty??block?.flow?.localDifficulty;return Number.isFinite(rating?.reasoningScore)?rating.reasoningScore:null;};

// Practice blocks of each exercise in project order. An exercise is a topic with
// practice sections; exercise numbers follow `exerciseNumbers` when the booklet is
// organised by topic and otherwise count practice topics in order.
export function exerciseStructure(project){
 const numbers=exerciseNumbers(project),found=new Map();
 let counter=0;
 for(const section of project.sections??[]){
  if(section.phase!=='practice'||section.role==='candidate-pool')continue;
  const blocks=(section.blocks??[]).filter(b=>!b.presentation?.editorOnly&&isPractice(b));
  if(!blocks.length)continue;
  if(!found.has(section.topicId))found.set(section.topicId,{topicId:section.topicId,number:numbers[section.topicId]??++counter,blocks:[]});
  found.get(section.topicId).blocks.push(...blocks);
 }
 return [...found.values()].map(e=>({topicId:e.topicId,number:e.number,blockIds:e.blocks.map(b=>b.id),scores:Object.fromEntries(e.blocks.map(b=>[b.id,reasoningScore(b)]))}));
}

// Pairs of questions in the wrong band order. `scores` is the displayed order.
// penalty adds the band distance of each pair, so a Challenge question ahead of a
// Foundation one costs more than one band apart. Unrated questions are skipped.
export function difficultyInversions(scores){
 const bands=scores.map(bandIndex).filter(b=>b!=null);
 let pairs=0,penalty=0,adjacent=0;
 for(let i=0;i<bands.length;i++)for(let j=i+1;j<bands.length;j++)if(bands[i]>bands[j]){pairs++;penalty+=bands[i]-bands[j];}
 for(let i=1;i<bands.length;i++)if(bands[i-1]>bands[i])adjacent++;
 return {pairs,penalty,adjacent,rated:bands.length,unrated:scores.length-bands.length};
}

// Fewest pages that could hold the units if they packed perfectly.
export const lowerBoundPages=(heightsMm,capacityMm)=>heightsMm.length&&capacityMm>0?Math.max(1,Math.ceil(sum(heightsMm)/capacityMm-1e-9)):0;

const isBodyPage=page=>!page.isAnswer&&!page.isCover&&!!page.space;

// Metrics of one body edition (student, with-short, with-worked).
export function bodyMetrics(project,pages){
 const body=pages.filter(isBodyPage),exercises=exerciseStructure(project);
 const covers=pages.filter(p=>p.isCover).length,answerPages=pages.filter(p=>p.isAnswer).length;
 const usedMm=sum(body.map(p=>p.space.usedMm)),capacityMm=sum(body.map(p=>p.space.capacityMm));
 const result=[];
 for(const exercise of exercises){
  const owned=new Set(exercise.blockIds);
  const mine=body.filter(p=>p.blocks?.some(id=>owned.has(id)));
  if(!mine.length){result.push({topicId:exercise.topicId,number:exercise.number,pageCount:0,pages:[],blocks:exercise.blockIds.length,missing:true});continue;}
  // A block split across pages has one question element per fragment.
  const heights=new Map(),tops=new Map();
  const questionBoxes=[];
  for(const page of mine)for(const el of page.elements??[])if(el.kind==='question'&&owned.has(el.id)){
   heights.set(el.id,(heights.get(el.id)??0)+el.h);
   if(!tops.has(el.id))tops.set(el.id,[page.page,el.y]);
   questionBoxes.push({page:page.page,...el});
  }
  const gaps=[];
  for(const page of mine){
   const column=questionBoxes.filter(b=>b.page===page.page).sort((a,b)=>a.y-b.y);
   for(let i=1;i<column.length;i++)gaps.push(Math.max(0,column[i].y-(column[i-1].y+column[i-1].h)));
  }
  const gap=median(gaps),unitHeights=[...heights.values()].map(h=>h+gap);
  const capacity=Math.max(...mine.map(p=>p.space.capacityMm));
  const lowerBound=lowerBoundPages(unitHeights,capacity);
  // Trailing whitespace counts on pages that are not the exercise's last.
  const trailing=mine.slice(0,-1).map(p=>({page:p.page,trailingMm:round(Math.max(0,p.space.remainingMm))}));
  const displayed=[...tops.entries()].sort((a,b)=>a[1][0]-b[1][0]||a[1][1]-b[1][1]).map(([id])=>id);
  const order=displayed.length?displayed:exercise.blockIds;
  result.push({
   topicId:exercise.topicId,number:exercise.number,blocks:exercise.blockIds.length,
   pages:mine.map(p=>p.page),pageCount:mine.length,unitHeightsMm:round(sum(unitHeights)),capacityMm:round(capacity),
   lowerBound,wastedPages:Math.max(0,mine.length-lowerBound),
   trailing,trailingMm:round(sum(trailing.map(t=>t.trailingMm))),
   fillPct:round(100*sum(mine.map(p=>p.space.usedMm))/sum(mine.map(p=>p.space.capacityMm))),
   inversions:difficultyInversions(order.map(id=>exercise.scores[id]??null)),
  });
 }
 const counted=result.filter(e=>!e.missing);
 return {
  pages:pages.length,bodyPages:body.length,coverPages:covers,answerPages,
  fillPct:capacityMm?round(100*usedMm/capacityMm):null,
  exercises:result,
  totals:{
   exercisePages:sum(counted.map(e=>e.pageCount)),lowerBound:sum(counted.map(e=>e.lowerBound)),wastedPages:sum(counted.map(e=>e.wastedPages)),
   trailingMm:round(sum(counted.map(e=>e.trailingMm))),
   inversionPairs:sum(counted.map(e=>e.inversions.pairs)),inversionPenalty:sum(counted.map(e=>e.inversions.penalty)),
  },
 };
}

// Answer-only editions: page count and how full the tallest column runs.
export function answerMetrics(pages){
 const answer=pages.filter(p=>p.isAnswer&&p.space);
 const usedMm=sum(answer.map(p=>p.space.usedMm)),capacityMm=sum(answer.map(p=>p.space.capacityMm));
 return {pages:pages.length,answerPages:answer.length,fillPct:capacityMm?round(100*usedMm/capacityMm):null};
}

// A combined edition's body must paginate like the Questions edition.
export const bodyEqualsStudent=(studentPages,combinedPages)=>{
 const key=p=>JSON.stringify(p.blocks),a=studentPages.filter(isBodyPage),b=combinedPages.filter(isBodyPage);
 return a.length===b.length&&a.every((p,i)=>key(p)===key(b[i]));
};

// Metrics for every rendered edition of one project. `geometry` is the
// `editions` object of a render-geometry result: {edition:{pages:[...]}}.
export function paginationMetrics(project,geometry){
 const editions={};
 for(const [edition,{pages}] of Object.entries(geometry)){
  editions[edition]=GUARD_EDITIONS.includes(edition)?answerMetrics(pages):bodyMetrics(project,pages);
 }
 if(geometry.student)for(const edition of ['with-short','with-worked'])if(geometry[edition])editions[edition].bodyEqualsStudent=bodyEqualsStudent(geometry.student.pages,geometry[edition].pages);
 return editions;
}

// What changed between a reference and a candidate, with the plan's guards:
// short and worked may not gain pages, and student pages must not increase.
export function compareMetrics(reference,candidate){
 const pages=Object.fromEntries(Object.keys({...reference,...candidate}).map(e=>[e,{reference:reference[e]?.pages??null,candidate:candidate[e]?.pages??null,delta:(candidate[e]?.pages??0)-(reference[e]?.pages??0)}]));
 const violations=[];
 for(const edition of GUARD_EDITIONS)if(pages[edition]?.delta>0)violations.push({edition,kind:'guard-edition-gained-pages',delta:pages[edition].delta});
 if(pages.student?.delta>0)violations.push({edition:'student',kind:'objective-edition-gained-pages',delta:pages.student.delta});
 for(const edition of ['with-short','with-worked'])if(candidate[edition]?.bodyEqualsStudent===false)violations.push({edition,kind:'combined-body-differs-from-student'});
 const totals=key=>({reference:reference.student?.totals?.[key]??null,candidate:candidate.student?.totals?.[key]??null});
 return {pages,wastedPages:totals('wastedPages'),trailingMm:totals('trailingMm'),inversionPenalty:totals('inversionPenalty'),fillPct:{reference:reference.student?.fillPct??null,candidate:candidate.student?.fillPct??null},violations,passed:!violations.length};
}
