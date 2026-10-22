#!/usr/bin/env node
// Measure a candidate against the benchmark's arm A and the teacher version: pages
// per edition, fill, wasted pages, trailing whitespace, difficulty inversions and
// answer-space agreement. Uses bench/render-geometry.mjs and the pagination metrics.
//   node paginate/measure.mjs --project rates-v1 --candidate FILE [--name armA-pg] [--editions student,short,worked]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT} from '../bench/history.mjs';
import {compareFields} from '../bench/fields.mjs';
import {renderGeometry,GEOMETRY_EDITIONS} from '../bench/render-geometry.mjs';
import {paginationMetrics,compareMetrics} from '../src/lib/booklet-pagination-metrics.js';

const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const WORK=path.join(ROOT,'.booklet-work','bench-20261022');

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const id=arg('--project','rates-v1'),file=path.resolve(arg('--candidate')),name=arg('--name',path.basename(file,'.json'));
 const dir=path.join(WORK,id),project=read(file),teacher=read(path.join(dir,'teacher.json'));
 const editions=arg('--editions',GEOMETRY_EDITIONS.join(',')).split(',');
 console.log('render start');const geometry=await renderGeometry(project,{editions,log:console.log});console.log('render returned');
 const metrics=paginationMetrics(project,geometry.editions);
 fs.writeFileSync(path.join(dir,`geometry-${name}.json`),JSON.stringify(geometry));
 fs.writeFileSync(path.join(dir,`metrics-${name}.json`),JSON.stringify({name,project:project.id,source:path.relative(ROOT,file),renderedAt:geometry.renderedAt,metrics},null,1));
 const teacherMetrics=read(path.join(dir,'metrics-teacher.json')).metrics,armA=fs.existsSync(path.join(dir,'metrics-A.json'))?read(path.join(dir,'metrics-A.json')).metrics:null;
 const fields=compareFields(project,teacher),fieldsA=compareFields(read(path.join(dir,'armA.json')),teacher);
 const row=m=>({pages:Object.fromEntries(Object.entries(m).map(([e,v])=>[e,v.pages])),fillPct:m.student?.fillPct,wastedPages:m.student?.totals?.wastedPages,exercisePages:m.student?.totals?.exercisePages,lowerBound:m.student?.totals?.lowerBound,trailingMm:m.student?.totals?.trailingMm,inversionPairs:m.student?.totals?.inversionPairs,inversionPenalty:m.student?.totals?.inversionPenalty,shortFill:m.short?.fillPct,workedFill:m.worked?.fillPct});
 const answer=f=>({agreePct:f.groups.answerSpace?.agreePct,mae:f.groups.answerSpace?.mae,n:f.groups.answerSpace?.total});
 const out={name,teacher:row(teacherMetrics),armA:armA&&row(armA),candidate:row(metrics),answerSpace:{armA:answer(fieldsA),candidate:answer(fields)},vsTeacher:compareMetrics(teacherMetrics,metrics),vsArmA:armA&&compareMetrics(armA,metrics)};
 fs.writeFileSync(path.join(dir,`measure-${name}.json`),JSON.stringify(out,null,1));
 console.log(JSON.stringify(out,null,1));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
