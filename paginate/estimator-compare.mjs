#!/usr/bin/env node
// Diagnostic (22 October 2026): per response kind, how teacher finals relate to the
// import estimate, and three estimators against teacher finals on the layout-reviewed
// books: the stored import value, a least-absolute-deviation fit on the node
// estimate, and the 5%-under fit now in WORKING_SPACE_CALIBRATION_20261022.
//   node paginate/estimator-compare.mjs [--rows FILE]
// Reads the rows `working-space.mjs calibrate` wrote; changes no default.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../bench/history.mjs';
import {WORKING_SPACE_CALIBRATION_20261022 as CAL,applyWorkingSpaceFit} from '../src/lib/booklet-working-space.js';
import {layoutReviewedBooks} from './lib/working-space-fit.mjs';

const WORK=path.join(ROOT,'.booklet-work','bench-20261022');
const args=process.argv.slice(2),file=args[args.indexOf('--rows')+1]??path.join(WORK,'working-space-calibration.json');
const data=JSON.parse(fs.readFileSync(file,'utf8')).data;
const reviewed=layoutReviewedBooks(data),rows=data.filter(r=>reviewed.has(r.id));
const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
const q=(a,ps=[0.05,0.25,0.5,0.75,0.95])=>{a=[...a].sort((x,y)=>x-y);return ps.map(p=>Math.round(a[Math.min(a.length-1,Math.floor(p*(a.length-1)))]*100)/100);};
const r1=v=>Math.round(v*100)/100;

// LAD fit of final on the node estimate (the same feature the calibration uses).
function ladFit(set,feature=r=>r.raw){
 let best=null;
 for(let s=0;s<=150;s++){const scale=s/100;
  for(let off=-30;off<=40;off+=0.5){
   const err=mean(set.map(r=>Math.abs(applyWorkingSpaceFit({scale,offset:off},feature(r))-r.final)));
   if(!best||err<best.mae)best={scale,offset:off,mae:err};
  }}
 return best;
}
const score=(set,predict)=>({n:set.length,mae:r1(mean(set.map(r=>Math.abs(predict(r)-r.final)))),underOver2Pct:r1(100*set.filter(r=>r.final-predict(r)>2).length/set.length),meanEstimate:r1(mean(set.map(predict))),meanFinal:r1(mean(set.map(r=>r.final)))});
const out={books:[...reviewed].length,rows:rows.length,kinds:{}};
for(const kind of ['working','short','tick-cross']){
 const set=rows.filter(r=>r.kind===kind&&r.raw>0&&r.old>0);
 if(set.length<30)continue;
 const lad=ladFit(set),ladOld=ladFit(set,r=>r.old);
 out.kinds[kind]={
  n:set.length,
  ratioFinalOverImport:{quantiles_5_25_50_75_95:q(set.map(r=>r.final/r.old)),shareUnchanged:r1(set.filter(r=>r.final===r.old).length/set.length),shareZero:r1(set.filter(r=>r.final===0).length/set.length),shareAbove:r1(set.filter(r=>r.final>r.old).length/set.length)},
  stored:score(set,r=>r.old),
  ladOnNodeEstimate:{fit:{scale:lad.scale,offset:lad.offset},...score(set,r=>applyWorkingSpaceFit(lad,r.raw))},
  ladOnImportValue:{fit:{scale:ladOld.scale,offset:ladOld.offset},...score(set,r=>applyWorkingSpaceFit(ladOld,r.old))},
  under5pctFit:{fit:CAL.kinds[kind]??CAL.fallback,...score(set,r=>applyWorkingSpaceFit(CAL.kinds[kind]??CAL.fallback,r.raw))},
 };
}
const all=rows.filter(r=>['working','short'].includes(r.kind)&&r.raw>0&&r.old>0);
out.workingAndShort={n:all.length,stored:score(all,r=>r.old),under5pctFit:score(all,r=>applyWorkingSpaceFit(CAL.kinds[r.kind],r.raw))};
fs.writeFileSync(path.join(WORK,'estimator-compare.json'),JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
