#!/usr/bin/env node
// Blank style (polish pipeline, 23 October 2026, user decision: a scaffold blank matches the source). Where the
// source draws a box the booklet keeps its outlined box; where the source leaves empty space (or brackets) the
// booklet has the teacher's parenthesised gap, (\rule{0pt}{5mm}\hspace{Nmm}), the same width. The sweep rule
// `bracket-blank` converts a box that is already inside parentheses; this step handles the rest, which needs the
// source.
//   node polish/blank-style.mjs --candidate FILE|--project ID [--out FILE] [--run-dir DIR] [--work-dir DIR] [--no-model]
//                               [--concurrency N] [--save --allow-live]
// One GPT-6.1 Sol low call per block that holds an outlined blank in its maths, with the block's source page
// image(s) attached (the existing worker path; at most three workers per booklet), asking only whether each
// piece of maths is drawn with boxes or with empty space. Cached by block content and source pages in
// <work>/polish/blank-style.json. "space" pieces are converted deterministically; "box", "mixed" and "unclear"
// stay. Teacher-decided blocks and blocks with a local box exception are never asked.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gapLatex} from '../src/lib/booklet-cloze-convention.js';
import {ROOT,read,write,now,isMain,parseArgs,resolveTarget,runDirOf,saveTarget,changedBlocks,blocksOf} from '../checks/lib/common.mjs';
import {teacherBlocks} from './flags.mjs';

export const PROMPT_VERSION=1;
// An outlined blank: \boxed{\rule{0pt}{5mm}\hspace{Nmm}}, with the strut that sometimes precedes it.
const BOX=/(?:\\rule\{0pt\}\{[\d.]+mm\}\s*)?\\boxed\{\s*(?:\\rule\{0pt\}\{[\d.]+mm\})?\s*\\hspace\{([\d.]+)mm\}\s*\}/g;
const OPEN=/(?:\\left\(|\\[Bb]ig{1,2}[lL]?\(|\()\s*$/,CLOSE=/^\s*(?:\\right\)|\\[Bb]ig{1,2}[rR]?\)|\))/;
const SKIP=new Set(['answer','solution','solutions','sourceReview','questionDiagrams','solutionDiagrams','spec','provenance']);
const EXCEPTION=/for this question only|(?:user|teacher)[^.]*\b(?:keep|retain)[^.]*\b(?:box|dots|cloze)|(?:keep|retain)s? (?:the )?(?:outlined )?box(?:es)? (?:at|by|on) (?:user|teacher)/i;
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex').slice(0,20);

// Every outlined blank of a formula becomes the parenthesised gap, the same width; a blank already between
// parentheses keeps them and becomes the bare gap.
export function boxesToGaps(latex){
 const text=String(latex??'');
 return text.replace(BOX,(whole,width,offset)=>{
  const bare=OPEN.test(text.slice(0,offset))&&CLOSE.test(text.slice(offset+whole.length));
  return bare?gapLatex(width):'('+gapLatex(width)+')';
 });
}
export const hasBox=latex=>{BOX.lastIndex=0;const found=BOX.test(String(latex??''));BOX.lastIndex=0;return found;};

// The maths of a block's printable content that holds an outlined blank, in reading order: [{node, latex}].
export function boxedMaths(block){
 const found=[];
 const walk=value=>{
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.forEach(walk);return;}
  if(value.type==='math'&&typeof value.latex==='string'&&hasBox(value.latex))found.push({node:value,latex:value.latex});
  for(const [key,child] of Object.entries(value))if(!SKIP.has(key)&&child&&typeof child==='object')walk(child);
 };
 walk(block.content);walk(block.examples);
 return found;
}

export const sourcePagesOf=(block,section)=>[...new Set([block.sourcePageNumber??section?.sourcePageNumber,...(block.sourceRefs??[]).map(ref=>ref.pageNumber)].filter(Number.isInteger))].slice(0,2);
const pageImage=(runDir,page)=>runDir&&path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png');

// What the model sees of each piece of maths: its text with every outlined blank shown as [BOX n mm].
export const describeMaths=latex=>String(latex).replace(BOX,(_,width)=>`[BLANK ${width}mm]`);
export function blankStylePrompt(entries,pages){
 return `You compare ONE block of a re-typeset maths booklet with the page(s) of the original printed source attached (source page${pages.length>1?'s':''} ${pages.join(', ')}). Do not run commands or open files.

The re-typeset block has the pieces of maths below, each with blank answer slots shown as [BLANK Nmm] (they print as outlined boxes). Find the same working in the source image and look only at how each blank is drawn there:
- "box": the source draws an outlined box (a rectangle) for the blank;
- "space": the source leaves empty space for it, or brackets with space inside, or a plain underline or dots, or nothing drawn at all.
Judge each piece separately. Use "unclear" only when you cannot find that working in the source image.

Return one JSON object and nothing else: {"pieces":[{"id":"m1","style":"box|space|unclear"}]} with every id below exactly once.

Pieces:
${JSON.stringify(entries.map((entry,i)=>({id:'m'+(i+1),maths:describeMaths(entry.latex)})),null,1)}`;
}
export function parseStyles(result,count){
 const styles=Array(count).fill('unclear');
 for(const row of Array.isArray(result?.pieces)?result.pieces:[]){
  const n=Number(/^m(\d+)$/.exec(String(row?.id??''))?.[1]);
  if(Number.isInteger(n)&&n>=1&&n<=count&&['box','space','unclear'].includes(row.style))styles[n-1]=row.style;
 }
 return styles;
}

const cacheFile=dir=>path.join(dir,'polish','blank-style.json');
const loadCache=dir=>{try{const c=read(cacheFile(dir));return c?.version===1&&c.blocks?c:{version:1,blocks:{}};}catch{return {version:1,blocks:{}};}};

export async function runBlankStyle({project,runDir=null,cacheDir=null,model=true,concurrency=3,protectedIds=teacherBlocks(project),askModel=null,log=()=>{}}={}){
 const started=Date.now(),dir=runDir??runDirOf(project)??path.join(ROOT,'.booklet-work','polish',project.id),work=cacheDir??dir;
 const next=structuredClone(project),sections=new Map();
 for(const section of next.sections??[])for(const block of section.blocks??[])sections.set(block.id,section);
 const report={project:project.id,at:now(),blocks:0,asked:0,cache:{hits:0,misses:0},converted:[],kept:[],skipped:[],errors:[]};
 const cache=loadCache(work),rows=[];
 for(const block of blocksOf(next)){
  const maths=boxedMaths(block);if(!maths.length)continue;
  report.blocks++;
  if(protectedIds.has(block.id)){report.skipped.push({block:block.id,why:'a block the teacher decided'});continue;}
  const note=[...(block.sourceReview?.intentionalDepartures??[]),block.sourceReview?.authorisedFeedback?.note,...(block.sourceReview?.feedbackRepairs??[]).map(r=>r?.note)].find(n=>typeof n==='string'&&EXCEPTION.test(n));
  if(note){report.skipped.push({block:block.id,why:'local exception: '+note.slice(0,80)});continue;}
  const pages=sourcePagesOf(block,sections.get(block.id)),images=pages.map(page=>({page,path:pageImage(dir,page)})).filter(image=>image.path&&fs.existsSync(image.path));
  if(!images.length){report.skipped.push({block:block.id,why:'no source page image'});continue;}
  rows.push({block,maths,pages:images.map(i=>i.page),images:images.map(i=>i.path),hash:sha({v:PROMPT_VERSION,latex:maths.map(m=>m.latex),pages:images.map(i=>[i.page,fs.statSync(i.path).size])})});
 }
 const todo=[];
 for(const row of rows){
  const hit=cache.blocks[row.hash];
  if(hit){report.cache.hits++;row.styles=hit.styles;}else if(model){report.cache.misses++;todo.push(row);}
 }
 if(todo.length){
  const {pool}=await import('../first-pass/review.mjs');
  const ask=askModel??(async({prompt,images,workDir})=>(await import('../checks/lib/model.mjs')).askJson({prompt,project,images,workDir,name:'polish-blank-style'}));
  await pool(todo,Math.max(1,Math.min(3,concurrency)),async row=>{
   try{
    const {result,usage,elapsedMs}=await ask({prompt:blankStylePrompt(row.maths,row.pages),images:row.images,workDir:path.join(work,'polish','blank-style-calls')});
    row.styles=parseStyles(result,row.maths.length);report.asked++;
    cache.blocks[row.hash]={block:row.block.id,pages:row.pages,styles:row.styles,usage:usage??null,elapsedMs:elapsedMs??null,at:now()};
    log('blank-style: '+row.block.id+' '+row.styles.join(','));
    write(cacheFile(work),cache);
   }catch(error){report.errors.push({block:row.block.id,error:error.message});log('blank-style: '+row.block.id+' failed: '+error.message);}
  });
 }
 const date=now().slice(0,10);
 for(const row of rows){
  if(!row.styles){continue;}
  let changed=0;
  row.maths.forEach((entry,i)=>{if(row.styles[i]==='space'&&hasBox(entry.node.latex)){entry.node.latex=boxesToGaps(entry.node.latex);changed++;}});
  if(!changed){report.kept.push({block:row.block.id,styles:row.styles});continue;}
  (row.block.sourceReview??={}).feedbackRepairs??=[];
  row.block.sourceReview.feedbackRepairs.push({date,source:'polish',note:`Polish blank style: the source leaves ${changed===row.maths.length?'these blanks':'some blanks'} as empty space, so the outlined box${changed>1?'es are':' is'} now the parenthesised gap, same width; content and answers unchanged.`});
  report.converted.push({block:row.block.id,pieces:changed,of:row.maths.length});
 }
 report.elapsedSeconds=Math.round((Date.now()-started)/1000);
 return {project:next,report};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--out','--run-dir','--work-dir','--concurrency','--report'],flags:['--no-model','--save','--allow-live']});
 const {file,live,project}=resolveTarget(opts);
 const {project:next,report}=await runBlankStyle({project,runDir:opts['--run-dir']?path.resolve(opts['--run-dir']):null,cacheDir:opts['--work-dir']?path.resolve(opts['--work-dir']):null,model:!opts['--no-model'],concurrency:Number(opts['--concurrency']??3),log:m=>console.error(m)});
 if(opts['--out'])write(path.resolve(opts['--out']),next);
 if(opts['--report'])write(path.resolve(opts['--report']),report);
 let saved=null;
 if(opts['--save'])saved=await saveTarget({file,live,before:project,after:next,changed:changedBlocks(project,next),allowLive:!!opts['--allow-live'],tag:'blank-style'});
 console.log(JSON.stringify({project:report.project,blocks:report.blocks,asked:report.asked,cache:report.cache,converted:report.converted,skipped:report.skipped.length,errors:report.errors,saved,elapsedSeconds:report.elapsedSeconds},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
