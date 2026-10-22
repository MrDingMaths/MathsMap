// Benchmark one booklet: how close the import as delivered (arm A) and a
// pipeline-processed copy (arm B) come to the teacher-corrected version.
//   node bench/benchmark.mjs prepare --project rates-v1
//   node bench/benchmark.mjs run     --project rates-v1 [--arm A,teacher] [--candidate FILE --arm B]
//   node bench/benchmark.mjs report  --project rates-v1 [--findings FILE] [--no-detectors]
// Work directory: .booklet-work/bench-20261022/<project>/. Nothing here writes to
// booklets/projects: arm B is a scratch copy under the id <project>-bench that is
// only ever a file in the work directory and a request intercept while rendering.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ROOT,liveProject,importFinalRevision,firstTeacherTime} from './history.mjs';
import {layoutFields,compareFields,theoryDrift,blockHash,MM_TOLERANCE} from './fields.mjs';
import {collectComments,buildCase,loadOverrides,CATEGORIES,AREA_TO_CATEGORY,SWEEP_RULE_CATEGORIES,ensureDetectors,detectors} from './corpus.mjs';
import {paginationMetrics,compareMetrics} from '../src/lib/booklet-pagination-metrics.js';

export const WORK=path.join(ROOT,'.booklet-work','bench-20261022');
export const ARMS=Object.freeze(['A','B','teacher']);
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};
export const workDir=id=>path.join(WORK,id);
export const armFile=(id,arm)=>path.join(workDir(id),arm==='teacher'?'teacher.json':`arm${arm}.json`);
const benchId=id=>`${id}-bench`;

// ---------------------------------------------------------------- prepare
export function prepare(id,{log=console.log}={}){
 const dir=workDir(id),live=liveProject(id),final=importFinalRevision(id,{live});
 if(!final)throw Error(`${id}: no revision before the first teacher flag`);
 write(armFile(id,'teacher'),live);
 write(armFile(id,'A'),final.project);
 // Arm B starts identical to arm A under a scratch id; only the id changes.
 const copy=structuredClone(final.project);copy.id=benchId(id);
 write(armFile(id,'B'),copy);
 const overrides=loadOverrides(),cases=collectComments({projectIds:[id]}).map(row=>buildCase(row,{overrides}));
 write(path.join(dir,'comments.json'),{projectId:id,cases});
 const meta={projectId:id,benchId:benchId(id),preparedAt:new Date().toISOString(),
  armA:{revision:final.revision,updatedAt:final.updatedAt,rule:'last revision before the first teacher flag'},
  teacher:{revision:live.revision,updatedAt:live.updatedAt},firstTeacherFlagAt:firstTeacherTime(live),comments:cases.length};
 write(path.join(dir,'meta.json'),meta);
 log(JSON.stringify({dir,...meta}));
 return meta;
}

// ---------------------------------------------------------------- run
// Render an arm (or the teacher version) in all editions and record geometry and
// pagination metrics next to the project files.
export async function runArm(id,arm,{candidate=null,base,editions,log=console.log}={}){
 const {renderGeometry,GEOMETRY_EDITIONS}=await import('./render-geometry.mjs');
 let file=armFile(id,arm);
 if(arm==='B'){
  if(candidate)file=path.resolve(candidate);
  else{
   // handoff/run.mjs (phase 4) takes armB.json through the whole pipeline and writes the
   // processed project to --out; pass --candidate FILE to render an existing candidate instead.
   const handoff=path.join(ROOT,'handoff','run.mjs');
   if(!fs.existsSync(handoff))throw Error('Arm B needs --candidate FILE: handoff/run.mjs does not exist yet.');
   const out=path.join(workDir(id),'armB.candidate.json'),result=spawnSync(process.execPath,[handoff,'--project-file',armFile(id,'B'),'--out',out],{cwd:ROOT,stdio:'inherit'});
   if(result.status!==0||!fs.existsSync(out))throw Error('handoff/run.mjs did not produce a candidate');
   file=out;
  }
 }
 const project=read(file);
 if(arm==='B'&&project.id!==benchId(id))throw Error(`Arm B candidates must use the scratch id ${benchId(id)}, not ${project.id}`);
 const geometry=await renderGeometry(project,{base,editions:editions??GEOMETRY_EDITIONS,log});
 const metrics=paginationMetrics(project,geometry.editions);
 write(path.join(workDir(id),`geometry-${arm}.json`),JSON.stringify(geometry));
 write(path.join(workDir(id),`metrics-${arm}.json`),{arm,project:project.id,revision:project.revision??null,source:path.relative(ROOT,file),renderedAt:geometry.renderedAt,metrics});
 log(`${id} arm ${arm}: `+Object.entries(metrics).map(([e,m])=>`${e} ${m.pages}`).join(', '));
 return metrics;
}

// ---------------------------------------------------------------- classification
const tolerant=(a,b,tol)=>typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<=tol:a===b;

// Does the arm already hold the values the teacher's fix produced?
export function holdsFix(armFieldMap,diff,{tolerance=MM_TOLERANCE}={}){
 if(!diff.length)return {observable:false,held:0,total:0,avoided:false,missing:[]};
 let held=0;const missing=[];
 for(const row of diff){
  const value=armFieldMap.get(row.key)?.value??null;
  if(tolerant(value,row.after,tolerance))held++;else missing.push({key:row.key,arm:value,teacher:row.after});
 }
 return {observable:true,held,total:diff.length,avoided:held===diff.length,missing:missing.slice(0,10)};
}

export function findingBlocks(finding){
 return [...new Set([finding.blockId,...(finding.targets??[]).map(t=>t.blockId),...(finding.blocks??[])].filter(Boolean))];
}
export const findingCategory=finding=>finding.category??AREA_TO_CATEGORY[finding.area]??null;

// avoided: the arm holds the fix. caught: a finding or detector names the block
// in the comment's category. Otherwise missed. `detections` is an array of
// {blockId, category, via}.
export function classifyComment(caseRow,armFieldMap,detections,armBlock){
 const armHasBlock=!caseRow.blockId||!!armBlock;
 const fix=holdsFix(armFieldMap,caseRow.diff);
 // A content edit counts as one more field the arm must hold: its block equals the fixed block.
 if(caseRow.content?.changed){
  fix.observable=true;fix.total++;
  if(armBlock&&blockHash(armBlock)===caseRow.content.afterHash)fix.held++;else fix.missing.push({key:'content/'+caseRow.blockId,arm:'differs',teacher:'fixed content'});
  fix.avoided=fix.held===fix.total;
 }
 const hits=detections.filter(d=>d.blockId===caseRow.blockId&&d.category===caseRow.category);
 const base={id:caseRow.id,at:caseRow.at,category:caseRow.category,blockId:caseRow.blockId,note:caseRow.note.replace(/\s+/g,' ').slice(0,140),observable:fix.observable,fixFields:fix.total,fixFieldsHeld:fix.held};
 if(caseRow.blockId&&!armHasBlock)return {...base,status:'missed',reason:'block is not in the arm'};
 if(fix.avoided)return {...base,status:'avoided'};
 if(hits.length)return {...base,status:'caught',via:[...new Set(hits.map(h=>h.via))]};
 return {...base,status:'missed',reason:fix.observable?'fix values not held':'fix changed neither layout fields nor block content',stillMissing:fix.missing.slice(0,3)};
}

export function tallyComments(rows){
 const by=Object.fromEntries(CATEGORIES.map(c=>[c,{avoided:0,caught:0,missed:0,unobservable:0}]));
 const total={avoided:0,caught:0,missed:0,unobservable:0};
 for(const r of rows)for(const t of [by[r.category],total]){t[r.status]++;if(!r.observable)t.unobservable++;}
 return {total,byCategory:Object.fromEntries(Object.entries(by).filter(([,v])=>v.avoided+v.caught+v.missed))};
}

async function detectionsFor(project,{useDetectors,findings}){
 const out=[];
 for(const f of findings??[]){const category=findingCategory(f);if(category)for(const blockId of findingBlocks(f))out.push({blockId,category,via:'findings'});}
 // A block the pipeline's own sweep already fixed is credited to the rules that fixed it: once repaired the
 // detector no longer fires on it, but the check did name that block and category.
 for(const section of project.sections??[])for(const block of section.blocks??[])for(const entry of block.sourceReview?.feedbackRepairs??[]){
  const rules=/^Pre-review sweep \(([^)]*)\)/.exec(entry?.note??'')?.[1]?.split(',').map(r=>r.trim())??[];
  for(const rule of rules)for(const category of SWEEP_RULE_CATEGORIES[rule]??[])out.push({blockId:block.id,category,via:'fixed:sweep:'+rule});
 }
 if(useDetectors){
  await ensureDetectors();
  for(const d of detectors())try{for(const hit of d.detect(project))for(const category of d.categories)out.push({blockId:hit.blockId,category,via:'detector:'+d.name});}catch{}
 }
 return out;
}
export function loadFindings(file){
 if(!file)return [];
 const value=read(file);
 return Array.isArray(value)?value:value.findings??Object.values(value.findings??{});
}

// ---------------------------------------------------------------- report
export async function report(id,{findings=[],useDetectors=true,log=console.log}={}){
 const dir=workDir(id),meta=read(path.join(dir,'meta.json')),cases=read(path.join(dir,'comments.json')).cases;
 const teacher=read(armFile(id,'teacher')),arms={};
 const teacherMetrics=fs.existsSync(path.join(dir,'metrics-teacher.json'))?read(path.join(dir,'metrics-teacher.json')).metrics:null;
 // Arm B is reported once a candidate has been rendered; its metrics file names the candidate.
 const sources={A:armFile(id,'A')};
 if(fs.existsSync(path.join(dir,'metrics-B.json')))sources.B=path.resolve(ROOT,read(path.join(dir,'metrics-B.json')).source);
 for(const [arm,file] of Object.entries(sources)){
  const project=read(file);
  const fields=compareFields(project,teacher),armFieldMap=layoutFields(project);
  const blocks=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
  const detections=await detectionsFor(project,{useDetectors,findings});
  const rows=cases.map(c=>classifyComment(c,armFieldMap,detections,blocks.get(c.blockId)));
  const metrics=fs.existsSync(path.join(dir,`metrics-${arm}.json`))?read(path.join(dir,`metrics-${arm}.json`)).metrics:null;
  arms[arm]={revision:project.revision??null,id:project.id,fields,theoryDrift:theoryDrift(project,teacher),comments:{...tallyComments(rows),rows},
   pagination:metrics,paginationVsTeacher:metrics&&teacherMetrics?compareMetrics(teacherMetrics,metrics):null};
 }
 const result={projectId:id,builtAt:new Date().toISOString(),meta,toleranceMm:MM_TOLERANCE,detectors:useDetectors?detectors().map(d=>d.name):[],findingsGiven:findings.length,teacherPagination:teacherMetrics,arms};
 write(path.join(dir,'report.json'),result);write(path.join(dir,'report.md'),reportMarkdown(result));
 log(path.join(dir,'report.md'));
 return result;
}

const pct=v=>v==null?'-':v+'%';
export function reportMarkdown(r){
 const L=[`# Benchmark: ${r.projectId}`,'',
  `Arm A is revision ${r.meta.armA.revision} (${r.meta.armA.updatedAt}), the last save before the first teacher flag (${r.meta.firstTeacherFlagAt}). The teacher version is revision ${r.meta.teacher.revision} (${r.meta.teacher.updatedAt}). Numbers differ within ${r.toleranceMm} mm count as agreement.`,''];
 const armNames=Object.keys(r.arms);
 L.push('## Layout fields against the teacher version','','| Arm | Fields compared | Agree | Agree % | Only in arm | Only in teacher | MAE (mm) |','|---|---|---|---|---|---|---|');
 for(const a of armNames){const h=r.arms[a].fields.headline;L.push(`| ${a} | ${h.total} | ${h.agree} | ${pct(h.agreePct)} | ${h.onlyArm} | ${h.onlyTeacher} | ${h.mae ?? '-'} |`);}
 L.push('','| Group | '+armNames.map(a=>`${a} agree % (n)`).join(' | ')+' | '+armNames.map(a=>`${a} MAE`).join(' | ')+' |','|---|'+'---|'.repeat(armNames.length*2));
 const groups=new Set(armNames.flatMap(a=>Object.keys(r.arms[a].fields.groups)));
 for(const g of groups)L.push(`| ${g} | `+armNames.map(a=>{const x=r.arms[a].fields.groups[g];return x?`${pct(x.agreePct)} (${x.total})`:'-';}).join(' | ')+' | '+armNames.map(a=>r.arms[a].fields.groups[g]?.mae??'-').join(' | ')+' |');
 const lay=armNames.map(a=>`${a}: ${r.arms[a].fields.groups.layout?.agreePct ?? '-'}%`).join(', ');
 L.push('',`Block arrangement trees (\`layout\`) are compared separately and are not in the headline (agree %: ${lay}).`);
 L.push('','## Pages and pagination','');
 const eds=['student','short','worked','with-short','with-worked'];
 L.push('| Edition | Teacher | '+armNames.map(a=>`Arm ${a}`).join(' | ')+' |','|---|---|'+'---|'.repeat(armNames.length));
 for(const e of eds)L.push(`| ${e} | ${r.teacherPagination?.[e]?.pages ?? '-'} | `+armNames.map(a=>r.arms[a].pagination?.[e]?.pages ?? '-').join(' | ')+' |');
 const row=(label,fn)=>`| ${label} | ${fn(r.teacherPagination)} | `+armNames.map(a=>fn(r.arms[a].pagination)).join(' | ')+' |';
 L.push('','| Questions edition | Teacher | '+armNames.map(a=>`Arm ${a}`).join(' | ')+' |','|---|---|'+'---|'.repeat(armNames.length),
  row('Fill % (body pages)',m=>m?.student?.fillPct ?? '-'),
  row('Pages in exercises',m=>m?.student?.totals?.exercisePages ?? '-'),
  row('Lower bound (perfect packing)',m=>m?.student?.totals?.lowerBound ?? '-'),
  row('Wasted pages',m=>m?.student?.totals?.wastedPages ?? '-'),
  row('Trailing mm on non-final exercise pages',m=>m?.student?.totals?.trailingMm ?? '-'),
  row('Difficulty inversions (pairs)',m=>m?.student?.totals?.inversionPairs ?? '-'),
  row('Short answers fill %',m=>m?.short?.fillPct ?? '-'),
  row('Worked solutions fill %',m=>m?.worked?.fillPct ?? '-'));
 for(const a of armNames){const c=r.arms[a].paginationVsTeacher;if(c)L.push('',`Arm ${a} against the teacher: ${c.passed?'no guard violated':'violations: '+c.violations.map(v=>`${v.edition} ${v.kind} (+${v.delta ?? ''})`).join('; ')}.`);}
 L.push('','## Teacher comments','','A comment is avoided when the arm already holds the values the teacher\'s fix set, caught when a detector or finding names that block in the comment\'s category, otherwise missed. A comment whose fix changed no layout field (content, role-less edits) cannot be avoided and is counted in "no field change" (the scope is the commented block, the next block and the first block of the next two sections).','');
 for(const a of armNames){
  const t=r.arms[a].comments;
  L.push(`### Arm ${a}: ${t.total.avoided} avoided, ${t.total.caught} caught, ${t.total.missed} missed of ${t.rows.length} (${t.total.unobservable} with no field change)`,'','| Category | Avoided | Caught | Missed | No field change |','|---|---|---|---|---|');
  for(const [c,v] of Object.entries(t.byCategory))L.push(`| ${c} | ${v.avoided} | ${v.caught} | ${v.missed} | ${v.unobservable} |`);
  L.push('');
 }
 L.push('## Teaching-text drift','','| Arm | Teacher tokens | Added | Removed | Drift % | Blocks changed |','|---|---|---|---|---|---|');
 for(const a of armNames){const d=r.arms[a].theoryDrift;L.push(`| ${a} | ${d.teacherTokens} | ${d.added} | ${d.removed} | ${d.driftPct} | ${d.blocksChanged} |`);}
 L.push('',`Detectors used for "caught": ${r.detectors.length?r.detectors.join(', '):'none'}. Findings from a file: ${r.findingsGiven}.`,'');
 return L.join('\n');
}

async function main(){
 const args=process.argv.slice(2),command=args[0],arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const id=arg('--project');if(!id)throw Error('Use --project ID');
 if(command==='prepare'){prepare(id);return;}
 if(command==='run'){
  const arms=arg('--arm','A,teacher').split(',');
  if(arms.some(a=>!ARMS.includes(a)))throw Error('--arm takes A, B and teacher');
  for(const arm of arms)await runArm(id,arm,{candidate:arg('--candidate'),base:arg('--base')?.replace(/\/$/,''),editions:arg('--editions')?.split(',')});
  return;
 }
 if(command==='report'){await report(id,{findings:loadFindings(arg('--findings')),useDetectors:!args.includes('--no-detectors')});return;}
 throw Error('Usage: node bench/benchmark.mjs prepare|run|report --project ID');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
