#!/usr/bin/env node
// Teacher-calibrated working space (22 October 2026, user approved).
//   node paginate/working-space.mjs calibrate [--out FILE] [--min-rows N]
//   node paginate/working-space.mjs apply --candidate FILE [--out FILE] [--named] [--no-history] [--no-raise] [--table-rows] [--no-teaching] [--fresh-import]
//   node paginate/working-space.mjs apply --project ID [--out FILE] [--named]
// calibrate refits the per-kind scale and offset on the answer bodies whose
// import-time estimate and final teacher allowance are both recorded, and prints
// the constants for WORKING_SPACE_CALIBRATION_20261022 in
// src/lib/booklet-working-space.js. apply writes a candidate file with the
// calibrated allowances; it never touches booklets/projects. Guided practice and "your turn" areas are
// included unless --no-teaching; --fresh-import (with --table-rows) says nothing has been edited since import.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,PROJECTS,liveProject} from '../bench/history.mjs';
import {WORKING_SPACE_CALIBRATION_20261022 as CALIBRATION} from '../src/lib/booklet-working-space.js';
import {hasTeacherReview} from '../src/lib/booklet-import-spacing.js';
import {collectRows,fitCalibration,fitLadCalibration,evaluateOn,summarise,applyFit,fitFor,layoutReviewedBooks,tradeoff} from './lib/working-space-fit.mjs';
import {applyCalibratedWorkingSpace} from './lib/working-space-apply.mjs';

export const WORK=path.join(ROOT,'.booklet-work','bench-20261022');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};

export function calibrate({minRows=30,out=path.join(WORK,'working-space-calibration.json'),log=console.log}={}){
 const projects=fs.readdirSync(PROJECTS).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>read(path.join(PROJECTS,f)));
 const {rows,sources,excluded}=collectRows(projects,{log});
 const reviewed=layoutReviewedBooks(rows),fitRows=rows.filter(r=>reviewed.has(r.id));
 // The default: median (least-absolute-deviation) fit. The 5%-under fit is kept for comparison.
 const lad=fitLadCalibration(fitRows,{minRows});
 const safe=fitCalibration(fitRows,{minRows:40});
 const kinds=[...new Set(rows.map(r=>r.kind))].sort();
 const ladValue=r=>{const fits=lad.kinds[r.kind]??lad.fallback;return r.old>0&&r.raw>0?applyFit(fits.fromImport,r.old):applyFit(fits.fromEstimate,r.raw);};
 const table=Object.fromEntries(['all','needing space',...kinds].map(kind=>{
  const set=(kind==='all'?fitRows:kind==='needing space'?fitRows.filter(r=>r.raw>0):fitRows.filter(r=>r.kind===kind));
  return [kind,{stored:evaluateOn(set,r=>r.old),pilotEstimator:evaluateOn(set,r=>Math.min(r.old,r.raw)),under5pctFit:evaluateOn(set,r=>applyFit(fitFor(safe,r.kind),r.raw)),medianFit:evaluateOn(set,ladValue)}];
 }));
 const sweep=Object.fromEntries(['working','short'].map(kind=>[kind,tradeoff(fitRows,kind)]));
 const constants={version:'2026-10-22',method:'least-absolute-deviation',floorMm:8,kinds:lad.kinds,fallback:lad.fallback};
 const result={at:new Date().toISOString(),rows:rows.length,fitRows:fitRows.length,fitBooks:[...reviewed],sources,excluded,table,tradeoff5pct:sweep,fitDetail:lad.detail,constants};
 write(out,{...result,data:rows});
 log(JSON.stringify({rows:rows.length,fitRows:fitRows.length,books:[...reviewed].length,table,constants},null,1));
 log('Wrote '+path.relative(ROOT,out));
 return result;
}

async function main(){
 const args=process.argv.slice(2),command=args[0],arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 if(command==='calibrate'){calibrate({minRows:Number(arg('--min-rows',30)),out:arg('--out')?path.resolve(arg('--out')):undefined});return;}
 if(command==='apply'){
  const file=arg('--candidate'),id=arg('--project');
  if(!file&&!id)throw Error('Use --candidate FILE or --project ID');
  const project=file?read(path.resolve(file)):liveProject(id);
  const named=args.includes('--named');
  if(hasTeacherReview(project)&&!named)throw Error(`${project.id} has teacher comments: pass --named only when the teacher named this booklet for the change.`);
  const result=applyCalibratedWorkingSpace(project,{named,history:!args.includes('--no-history'),raise:!args.includes('--no-raise'),tableRows:args.includes('--table-rows'),teaching:!args.includes('--no-teaching'),freshImport:args.includes('--fresh-import'),calibration:CALIBRATION});
  const out=path.resolve(arg('--out',file?file.replace(/\.json$/,'')+'-ws.json':path.join(WORK,project.id,'candidate-ws.json')));
  write(out,result.project);
  console.log(JSON.stringify({out,project:project.id,revision:project.revision,summary:result.summary},null,1));
  return;
 }
 throw Error('Usage: node paginate/working-space.mjs calibrate|apply ...');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
