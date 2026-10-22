// Calibration of the working-space estimate against what the teacher left in
// place. Pure fitting plus the data collection that regenerates the rows the
// 17 October calibration kept only as summary figures.
//
// A row compares one answer body at import time with the teacher's final
// allowance: {id, targetId, kind, widthMm, old, final, raw}. `raw` is the
// response-aware estimate for the same body (estimateWorkedWritingSpace without
// the stored value). The fit maps raw to a calibrated value, per response kind,
// with at most 5% of the calibrated values below the teacher's final allowance.
import {findContent} from '../../src/lib/booklet-arrangement.js';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
import {hasTeacherReview} from '../../src/lib/booklet-import-spacing.js';
import {estimateWorkedWritingSpace,applyWorkingSpaceFit} from '../../src/lib/booklet-working-space.js';
import {historyIndex,snapshot,allBlocks,teacherFlags} from '../../bench/history.mjs';

export const MAX_UNDER=0.05;
export const HANDWRITING_FLOOR_MM=8;

const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
const round=(v,p=2)=>v==null?null:Math.round(v*10**p)/10**p;

// The calibrated value for raw `x`: ceil to whole millimetres, never under the
// handwriting minimum for a body that needs writing space at all.
export const applyFit=applyWorkingSpaceFit;

// Fit scale and offset: the smallest MAE among line fits whose calibrated value
// is at least the teacher's final in all but `maxUnder` of rows.
export function fitKind(rows,{maxUnder=MAX_UNDER,floor=HANDWRITING_FLOOR_MM}={}){
 if(!rows.length)return null;
 let best=null;
 for(let s=20;s<=150;s++){
  const scale=s/100;
  // Smallest offset (step 0.5) that keeps the underestimates within bounds.
  const residual=rows.map(r=>r.final-scale*r.raw).sort((a,b)=>a-b);
  let offset=Math.floor(residual[Math.min(residual.length-1,Math.ceil(residual.length*(1-maxUnder))-1)]*2)/2-1;
  for(let guard=0;guard<400;guard++){
   const under=rows.filter(r=>applyFit({scale,offset},r.raw,floor)<r.final).length;
   if(under/rows.length<=maxUnder)break;
   offset+=0.5;
  }
  const evaluated=evaluateFit({scale,offset},rows,floor);
  if(!best||evaluated.mae<best.mae-1e-9||Math.abs(evaluated.mae-best.mae)<1e-9&&scale<best.scale)best={scale,offset,...evaluated};
 }
 return best;
}
export function evaluateFit(fit,rows,floor=HANDWRITING_FLOOR_MM){
 const cal=rows.map(r=>applyFit(fit,r.raw,floor));
 return {n:rows.length,mae:mean(rows.map((r,i)=>Math.abs(cal[i]-r.final))),underestimates:rows.filter((r,i)=>cal[i]<r.final).length,underPct:100*rows.filter((r,i)=>cal[i]<r.final).length/Math.max(1,rows.length),meanCalibrated:mean(cal),meanFinal:mean(rows.map(r=>r.final))};
}

// Fit every response kind with enough rows; the rest share the pooled fit.
export function fitCalibration(rows,{minRows=40,maxUnder=MAX_UNDER}={}){
 const kinds={},byKind=new Map();
 for(const r of rows){if(!byKind.has(r.kind))byKind.set(r.kind,[]);byKind.get(r.kind).push(r);}
 const pooledRows=rows.filter(r=>r.raw>0);
 const fallback=fitKind(pooledRows,{maxUnder});
 for(const [kind,group] of byKind){
  const usable=group.filter(r=>r.raw>0);
  if(usable.length>=minRows)kinds[kind]=fitKind(usable,{maxUnder});
 }
 return {kinds:Object.fromEntries(Object.entries(kinds).map(([k,v])=>[k,{scale:v.scale,offset:v.offset}])),fallback:{scale:fallback.scale,offset:fallback.offset},
  detail:{fallback,kinds}};
}
export const fitFor=(calibration,kind)=>calibration.kinds[kind]??calibration.fallback;

// Error summary of a calibration (or any predictor) over rows. `predict(row)`
// returns the allowance to compare with the teacher's final.
export function summarise(rows,predict){
 const mae=mean(rows.map(r=>Math.abs(predict(r)-r.final)));
 const under=rows.filter(r=>predict(r)<r.final).length;
 return {n:rows.length,mae:round(mae),underestimates:under,underPct:round(100*under/Math.max(1,rows.length),1)};
}

// Books where the teacher actually worked on spacing: a book whose allowances are
// nearly all unchanged (a few comments on content only) says nothing about what
// the teacher wants. Returns the ids with at least `share` of rows changed.
export function layoutReviewedBooks(rows,share=0.3){
 const by=new Map();
 for(const r of rows){const b=by.get(r.id)??{n:0,changed:0};b.n++;if(r.final!==r.old)b.changed++;by.set(r.id,b);}
 return new Set([...by].filter(([,b])=>b.changed/b.n>=share).map(([id])=>id));
}

// What each tolerance for under-provision would give: the cost of safety.
export function tradeoff(rows,kind,tolerances=[0.05,0.1,0.15,0.2,0.25],options={}){
 const usable=rows.filter(r=>r.kind===kind&&r.raw>0);
 return tolerances.map(maxUnder=>{const fit=fitKind(usable,{...options,maxUnder});return {maxUnder,scale:fit.scale,offset:fit.offset,mae:round(fit.mae),underPct:round(fit.underPct,1),meanCalibrated:round(fit.meanCalibrated,1)};});
}

// ---- data collection ---------------------------------------------------------

// Reviewed projects with an import-time snapshot that predates the first teacher
// flag, as in the 17 October calibration. Returns {rows, sources, excluded}.
export function collectRows(projects,{log=()=>{}}={}){
 const index=historyIndex(),rows=[],sources=[],excluded=[];
 for(const p of projects.filter(hasTeacherReview)){
  const entries=[...(index.get(p.id)??[])].sort((a,b)=>a[0]-b[0]);if(!entries.length)continue;
  const first=snapshot(entries[0][1]),at=teacherFlags(p).map(f=>f.at).sort()[0];
  if(p.source?.type==='project-copy'){excluded.push({id:p.id,reason:'copy lineage'});continue;}
  if(first.updatedAt>at){excluded.push({id:p.id,reason:'baseline after teacher feedback'});continue;}
  if(allBlocks(first).length<allBlocks(p).length/2){excluded.push({id:p.id,reason:'partial initial import'});continue;}
  sources.push({id:p.id,firstRevision:first.revision,currentRevision:p.revision});
  const current=normalizeEditableProject(p),before=rows.length;
  for(const oldBlock of allBlocks(first)){
   const block=allBlocks(current).find(b=>b.id===oldBlock.id);if(!block)continue;
   const responses=new Map((block.sourceReview?.responses??[]).map(r=>[r.targetId,r.kind]));
   for(const estimate of oldBlock.sourceReview?.workingSpaceEstimate?.estimates??[]){
    const node=findContent(block,estimate.targetId),oldNode=findContent(oldBlock,estimate.targetId),width=estimate.widthMm,old=estimate.answerSpaceMm;
    if(!node?.answer||!oldNode?.answer||JSON.stringify(node.answer)!==JSON.stringify(oldNode.answer)||!Number.isFinite(width)||!Number.isFinite(old))continue;
    const final=current.settings.layoutOverrides.answerSpaces?.[node.id]??node.answerSpaceMm,kind=responses.get(node.id)??'working';
    if(!Number.isFinite(final))continue;
    let raw;try{raw=estimateWorkedWritingSpace(node,{widthMm:width,preserveExplicit:false,responseKind:kind,responseContext:{kind,expectedAnswer:node.answer.short}});}catch{continue;}
    rows.push({id:p.id,targetId:node.id,kind,widthMm:width,old,final,raw,mathRows:estimate.mathematicalRows??null,figures:node.answer.solutionDiagrams?.length??0,fractions:/\\(?:d?frac|tfrac)(?![a-zA-Z])/.test(JSON.stringify(node.answer.worked??''))});
   }
  }
  log(`${p.id}: ${rows.length-before} rows`);
 }
 return {rows,sources,excluded};
}

// ---- median (least-absolute-deviation) calibration ----------------------------------
// The default the teacher chose on 22 October 2026: match the teacher's finals on
// average, accepting that a share of answers get a little less than they would give.
// `feature` picks what the line is fitted on: the allowance recorded at import
// ('old', used whenever an import value exists) or the node estimate ('raw').
export function fitLad(rows,feature,{floor=HANDWRITING_FLOOR_MM}={}){
 const x=r=>r[feature];
 const set=rows.filter(r=>x(r)>0);
 if(!set.length)return null;
 let best=null;
 for(let s=0;s<=150;s++){const scale=s/100;
  for(let offset=-30;offset<=40;offset+=0.5){
   let err=0;
   for(const r of set)err+=Math.abs(applyFit({scale,offset},x(r),floor)-r.final);
   if(!best||err<best.err-1e-9)best={scale,offset,err};
  }}
 const fit={scale:best.scale,offset:best.offset};
 return {...fit,...evaluateOn(set,r=>applyFit(fit,x(r),floor))};
}
export function evaluateOn(set,predict){
 const mae=mean(set.map(r=>Math.abs(predict(r)-r.final)));
 return {n:set.length,mae:round(mae),underOver2Pct:round(100*set.filter(r=>r.final-predict(r)>2).length/Math.max(1,set.length),1),meanEstimate:round(mean(set.map(predict)),1),meanFinal:round(mean(set.map(r=>r.final)),1)};
}
// Per kind, one line on the import value and one on the node estimate; kinds with
// too few rows share the pooled lines. Tick-cross has no real slope, so it keeps
// whatever the data gives and the floor decides.
export function fitLadCalibration(rows,{minRows=40}={}){
 const pooled=rows.filter(r=>r.raw>0&&r.old>0);
 const fallback={fromImport:fitLad(pooled,'old'),fromEstimate:fitLad(pooled,'raw')};
 const kinds={},detail={fallback};
 for(const kind of [...new Set(rows.map(r=>r.kind))]){
  const set=rows.filter(r=>r.kind===kind&&r.raw>0&&r.old>0);
  if(set.length<minRows)continue;
  const fromImport=fitLad(set,'old'),fromEstimate=fitLad(set,'raw');
  kinds[kind]={fromImport:{scale:fromImport.scale,offset:fromImport.offset},fromEstimate:{scale:fromEstimate.scale,offset:fromEstimate.offset}};
  detail[kind]={fromImport,fromEstimate};
 }
 const strip=f=>({scale:f.scale,offset:f.offset});
 return {kinds,fallback:{fromImport:strip(fallback.fromImport),fromEstimate:strip(fallback.fromEstimate)},detail};
}
