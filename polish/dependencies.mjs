#!/usr/bin/env node
// Order dependencies (polish pipeline step 2, 23 October 2026). Reordering must never break a dependency: a
// question that scaffolds the next, refers back to an earlier one or shares its stimulus keeps its order.
//   node polish/dependencies.mjs --candidate FILE|--project ID [--out FILE] [--run-dir DIR] [--no-model]
//                                [--concurrency N] [--save --allow-live]
// 1. A deterministic wording pass (src/lib/booklet-question-dependencies.js orderDependencies): "previous
//    question", "part (a)", "Question 3", "your answer to", "the graph above", a shared figure or table.
// 2. One GPT-6.1 Sol low call per exercise (the existing worker path, at most three workers per booklet, all
//    material in the prompt because read-only workers cannot open files), cached by the content hash of the
//    exercise in <run>/polish/dependencies.json. It lists the pairs that must keep their order and returns JSON.
// Both are written as block.flow.dependsOn, which exerciseUnits() and the pagination optimiser respect.
// --no-model keeps the deterministic pass only (and reads no cache). Launch the model step with the permitted
// host launch AGENTS.md describes; the worker's own read-only sandbox is never disabled.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isPractice} from '../src/lib/booklet-flow.js';
import {orderDependencies,applyFlowDependencies,questionNumber,promptText} from '../src/lib/booklet-question-dependencies.js';
import {ROOT,read,write,now,isMain,parseArgs,resolveTarget,runDirOf,saveTarget,changedBlocks} from '../checks/lib/common.mjs';
import {teacherBlocks} from './guards.mjs';

export const PROMPT_VERSION=1;
export const KINDS=Object.freeze(['scaffolds-next','refers-back','shared-stimulus']);
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex').slice(0,20);
const nodesOf=root=>root?[root,...(root.children??[]).flatMap(nodesOf)]:[];

// The exercises of a booklet: a run of practice sections of one topic (as organiseExercises groups them), each
// with its practice questions in order. Only a run of two or more questions can hold a dependency.
export function exerciseRuns(project){
 const runs=[];let current=null;
 for(const section of project.sections??[]){
  if(section.phase!=='practice'){current=null;continue;}
  if(!current||current.topicId!==section.topicId){current={topicId:section.topicId??null,sectionIds:[],blocks:[]};runs.push(current);}
  current.sectionIds.push(section.id);
  current.blocks.push(...(section.blocks??[]).filter(isPractice));
 }
 return runs.filter(run=>run.blocks.length>1).map(run=>({...run,key:run.sectionIds[0]}));
}

// What the worker reads about each question: its number, the words of the stem and each part, and whether it
// carries its own figure or table. Maths is not stripped from the stem text, only from prose matching.
export function exerciseDigest(blocks){
 return blocks.map(block=>{
  const parts=nodesOf(block.content).filter(n=>n!==block.content&&String(n.label??'').trim()).map(n=>({label:String(n.label),text:promptText(n.prompt).slice(0,240)}));
  const hasTable=v=>v&&typeof v==='object'&&(v.type==='table'||Object.values(v).some(hasTable));
  return {id:block.id,number:questionNumber(block),text:promptText(block.content?.prompt).slice(0,400),...(parts.length?{parts}:{}),stimulus:nodesOf(block.content).some(n=>n.questionDiagrams?.length)||hasTable(block.content?.prompt)};
 });
}
export const exerciseHash=(blocks,regexPairs)=>sha({v:PROMPT_VERSION,digest:exerciseDigest(blocks),regex:regexPairs.map(p=>p.dependent+'>'+p.requires)});

export function dependencyPrompt(blocks,regexPairs){
 return `You order-check the questions of ONE exercise in a printed maths booklet. Do not run commands or open files: everything you need is below.

A layout tool may reorder questions of similar difficulty to fill pages better. List only the pairs of questions that must keep their order:
- scaffolds-next: this question sets up, defines or gives working that the next question builds on;
- refers-back: a question uses, extends or compares with the answer, result or method of an earlier question;
- shared-stimulus: questions that use one figure, table, graph, passage or data set that is given once.
Do not list two questions only because they share a topic or a skill: questions may be reordered freely otherwise. When unsure, leave the pair out.

Return one JSON object and nothing else: {"pairs":[{"dependent":"ID","requires":"ID","kind":"scaffolds-next|refers-back|shared-stimulus","why":"under 15 words"}]}. "dependent" is the question that must stay after "requires". Use only the question ids below. Return {"pairs":[]} when there are none.

Questions in the order printed (stimulus is true when the question carries its own figure or table):
${JSON.stringify(exerciseDigest(blocks),null,1)}

Pairs already found from the wording (do not repeat them; add only others):
${JSON.stringify(regexPairs.map(({dependent,requires,kind})=>({dependent,requires,kind})))}`;
}

// The worker's pairs, checked against the exercise: known ids, a known kind, not the same question. A pair is
// stored with the earlier question as `requires` whichever way the worker named it (the order is what matters).
export function parseModelPairs(result,blocks){
 const order=new Map(blocks.map((b,i)=>[b.id,i])),out=[],seen=new Set();
 for(const row of Array.isArray(result?.pairs)?result.pairs:[]){
  const a=String(row?.dependent??''),b=String(row?.requires??'');
  if(!order.has(a)||!order.has(b)||a===b)continue;
  const [dependent,requires]=order.get(a)>order.get(b)?[a,b]:[b,a],key=dependent+'>'+requires;
  if(seen.has(key))continue;seen.add(key);
  out.push({dependent,requires,kind:KINDS.includes(row.kind)?row.kind:'refers-back',evidence:String(row.why??'').slice(0,120),source:'model'});
 }
 return out;
}

const cacheFile=dir=>path.join(dir,'polish','dependencies.json');
const loadCache=dir=>{try{const c=read(cacheFile(dir));return c?.version===1&&c.exercises?c:{version:1,exercises:{}};}catch{return {version:1,exercises:{}};}};

export async function runDependencies({project,runDir=null,model=true,concurrency=3,askModel=null,log=()=>{}}={}){
 const started=Date.now(),dir=runDir??runDirOf(project)??path.join(ROOT,'.booklet-work','polish',project.id);
 const runs=exerciseRuns(project),cache=model?loadCache(dir):{version:1,exercises:{}};
 const all=[],report={project:project.id,at:now(),exercises:runs.length,regex:0,model:0,cache:{hits:0,misses:0},calls:[],errors:[]};
 const rows=runs.map(run=>{const regex=orderDependencies(run.blocks).map(p=>({...p,source:'wording'}));return {run,regex,hash:exerciseHash(run.blocks,regex)};});
 const todo=[];
 for(const row of rows){
  all.push(...row.regex);report.regex+=row.regex.length;
  if(!model)continue;
  const hit=cache.exercises[row.hash];
  if(hit){report.cache.hits++;row.model=hit.pairs;}else if(row.run.blocks.length>1){report.cache.misses++;todo.push(row);}
 }
 if(model&&todo.length){
  const {pool}=await import('../first-pass/review.mjs');
  const ask=askModel??(async({prompt,workDir})=>(await import('../checks/lib/model.mjs')).askJson({prompt,project,workDir,name:'polish-dependencies'}));
  await pool(todo,Math.max(1,Math.min(3,concurrency)),async row=>{
   try{
    const {result,usage,elapsedMs}=await ask({prompt:dependencyPrompt(row.run.blocks,row.regex),workDir:path.join(dir,'polish','dependencies-calls')});
    row.model=parseModelPairs(result,row.run.blocks);
    cache.exercises[row.hash]={exercise:row.run.key,blocks:row.run.blocks.map(b=>b.id),pairs:row.model,usage:usage??null,elapsedMs:elapsedMs??null,at:now()};
    report.calls.push({exercise:row.run.key,pairs:row.model.length,elapsedMs:elapsedMs??null});
    log('dependencies: '+row.run.key+' '+row.model.length+' pair(s) from the model');
    write(cacheFile(dir),cache);
   }catch(error){report.errors.push({exercise:row.run.key,error:error.message});log('dependencies: '+row.run.key+' failed: '+error.message);row.model=[];}
  });
 }
 for(const row of rows){all.push(...(row.model??[]));report.model+=(row.model??[]).length;}
 // One pair per (dependent, requires): the wording pass wins over the model when both name it.
 const seen=new Set(),pairs=all.filter(p=>{const key=p.dependent+'>'+p.requires;if(seen.has(key))return false;seen.add(key);return true;});
 const next=structuredClone(project);
 const protectedIds=teacherBlocks(project);
 const changed=applyFlowDependencies(next,pairs.filter(pair=>!protectedIds.has(pair.dependent)));
 Object.assign(report,{pairs,changed,elapsedSeconds:Math.round((Date.now()-started)/1000)});
 return {project:next,report};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--out','--run-dir','--concurrency','--report'],flags:['--no-model','--save','--allow-live']});
 const {file,live,project}=resolveTarget(opts);
 const {project:next,report}=await runDependencies({project,runDir:opts['--run-dir']?path.resolve(opts['--run-dir']):null,model:!opts['--no-model'],concurrency:Number(opts['--concurrency']??3),log:m=>console.error(m)});
 if(opts['--out'])write(path.resolve(opts['--out']),next);
 if(opts['--report'])write(path.resolve(opts['--report']),report);
 let saved=null;
 if(opts['--save'])saved=await saveTarget({file,live,before:project,after:next,changed:changedBlocks(project,next),allowLive:!!opts['--allow-live'],tag:'dependencies'});
 console.log(JSON.stringify({project:report.project,exercises:report.exercises,wording:report.regex,model:report.model,cache:report.cache,pairs:report.pairs.length,blocksChanged:report.changed.length,errors:report.errors,saved,elapsedSeconds:report.elapsedSeconds},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
