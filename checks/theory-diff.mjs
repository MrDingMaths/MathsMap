#!/usr/bin/env node
// Theory text against the source (22 October 2026; docs/booklet-cross-session-rules.md "Theory text:
// source fidelity and cognitive load"). A deterministic standing check, no model.
//   node checks/theory-diff.mjs --project ID|--candidate FILE [--regions FILE] [--report FILE] [--all]
// For every teaching block with a located source region (source-match/regions.json) the words the
// source prints in the region are compared with the words the block prints. Reported: source words the
// block lacks and words the block adds, apart from the tokens of the block's recorded intentional
// departures and source corrections. --all lists every difference; the default lists the significant
// ones (three or more words and 8% of the source's). The check never edits a booklet: a source
// difference is a content decision.
import fs from 'node:fs';
import path from 'node:path';
import {theoryDiff,regionWords,describeDiff,exemptTokens,wordTokens} from '../src/lib/booklet-theory-diff.js';
import {blockPlainText,normKey} from '../src/lib/teaching-signature.js';
import {teachingBlocks,sourceFiles,readPages,alignBlockText,blockPages,loadRegions} from '../source-match/regions.mjs';
import {blockHash} from '../bench/fields.mjs';
import {read,write,now,isMain,parseArgs,resolveTarget,runDirOf} from './lib/common.mjs';

// Compare every teaching block that has a region. `pages` is {page: {words,height}} of the source.
export function diffProject({project,regions,pages,onlySignificant=true}){
 const rows=[];
 for(const {block} of teachingBlocks(project)){
  const entry=regions.blocks?.[block.id];
  if(!entry||entry.blockHash!==blockHash(block)||!entry.parts?.length||entry.needsLocate&&!entry.located)continue;
  const words=[];
  for(const part of entry.parts){const page=pages[part.page];if(page)words.push(...regionWords(page.words,part.box,{pageHeight:page.height}));}
  if(!words.length)continue;
  const diff=theoryDiff({block,sourceWords:words});
  if(onlySignificant&&!diff.significant)continue;
  if(!diff.missing.length&&!diff.extra.length)continue;
  rows.push({blockId:block.id,confidence:entry.confidence,...diff,detail:describeDiff(diff)});
 }
 return rows.sort((a,b)=>Math.max(b.missingPct,b.extraPct)-Math.max(a.missingPct,a.extraPct));
}

// ---- corpus detector (project only) ------------------------------------------------------------
// Without a region it measures how much of a teaching block's text the source page prints at all:
// the alignment of source-match/regions.mjs, after the exempt words are taken out. A block whose text
// is mostly not in its source has been rewritten or extended.
const wordCache=new Map();
function pageWords(pdf,numbers){
 const have=wordCache.get(pdf)??wordCache.set(pdf,new Map()).get(pdf),need=numbers.filter(n=>!have.has(n));
 if(need.length){let data={};try{data=readPages(pdf,need);}catch{}for(const n of need)have.set(n,data[n]?.words??null);}
 return have;
}
export function staticTheory(project,{minChars=200,threshold=.4}={}){
 const files=sourceFiles(project);if(!files?.pdf)return [];
 const blocks=teachingBlocks(project).filter(({block})=>!['question','page-break','diagram'].includes(block.type)||block.type==='worked-example');
 const need=[...new Set(blocks.flatMap(({block})=>blockPages(block)))];
 if(!need.length)return [];
 const have=pageWords(files.pdf,need),out=[];
 for(const {block} of blocks){
  const pages=blockPages(block).filter(n=>have.get(n));if(!pages.length)continue;
  const exempt=exemptTokens(block),text=blockPlainText(block).split(/\s+/).filter(w=>!exempt.has(normKey(w))).join(' '),chars=normKey(text).length;
  if(chars<minChars)continue;
  const matched=pages.reduce((sum,n)=>sum+alignBlockText(text,have.get(n)).matchedChars,0),share=Math.min(1,matched/chars);
  if(share<threshold)out.push({blockId:block.id,detail:`only ${Math.round(share*100)}% of this teaching text is printed on its source page ${pages.join(', ')}`});
 }
 return out;
}
export const detectors=[{name:'theory-diff',categories:['content'],detect:project=>staticTheory(project)}];

// The standing check on one booklet, from its regions file. Used by the CLI and by handoff/run.mjs.
export function runTheoryDiff({project,regionsFile,all=false}){
 const files=sourceFiles(project);
 if(!files?.pdf)throw Error('No source PDF for '+project.id);
 if(!regionsFile||!fs.existsSync(regionsFile))throw Error('No regions: run `node source-match/regions.mjs --project '+project.id+'` first ('+regionsFile+')');
 const regions=loadRegions(regionsFile),numbers=[...new Set(Object.values(regions.blocks).flatMap(e=>(e.parts??[]).map(p=>p.page)))];
 const data=readPages(files.pdf,numbers),pages=Object.fromEntries(Object.entries(data).map(([n,page])=>[n,{words:page.words,height:page.height}]));
 const rows=diffProject({project,regions,pages,onlySignificant:!all});
 return {project:project.id,at:now(),regions:path.relative(process.cwd(),regionsFile),compared:Object.keys(regions.blocks).length,differences:rows.length,rows};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--regions','--report'],flags:['--all','--apply']});
 if(opts['--apply'])throw Error('theory-diff only reports: a difference from the source is a content decision for the teacher');
 const {project}=resolveTarget(opts),run=runDirOf(project);
 const regionsFile=opts['--regions']?path.resolve(opts['--regions']):run&&path.join(run,'source-match','regions.json');
 const report=runTheoryDiff({project,regionsFile,all:!!opts['--all']}),rows=report.rows;
 if(opts['--report'])write(path.resolve(opts['--report']),report);
 console.log(JSON.stringify({project:report.project,compared:report.compared,differences:report.differences,top:rows.slice(0,8).map(r=>({blockId:r.blockId,missing:r.missing.length,extra:r.extra.length,detail:r.detail.slice(0,160)}))},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
