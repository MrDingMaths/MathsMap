#!/usr/bin/env node
// Replay of the render-based check on the corpus (22 October 2026). The deterministic replay of
// bench/corpus.mjs cannot render, so the wrapped-maths check only sees an estimate there.
// This renders the snapshot saved before each comment (Questions edition, headless, nothing saved) and
// runs the real check on it:
//   node checks/replay-render.mjs [--categories wrapping] [--limit N] [--out FILE]
// A case is caught when a finding names the commented block. Findings on blocks that were never
// commented in that booklet are listed too: the teacher may not have looked at them, so they are
// not all false alarms, but a rule that raises many of them needs a reason.
import path from 'node:path';
import {loadRevision} from '../bench/history.mjs';
import {DEFAULT_OUT} from '../bench/corpus.mjs';
import {ownerIndex} from '../bench/fields.mjs';
import {wrapProbe,wrappedFindings} from '../src/lib/booklet-wrap-check.js';
import {read,write,now,isMain,parseArgs,renderWithProbes} from './lib/common.mjs';

export async function replayRender({cases,limit=Infinity,log=()=>{}}){
 const byKey=new Map(),commented=new Map();
 for(const c of cases){if(!c.before||!c.blockId)continue;(commented.get(c.project)??commented.set(c.project,new Set()).get(c.project)).add(c.blockId);}
 for(const c of cases){if(!c.before||!c.blockId)continue;const key=c.project+'@'+c.before.revision;(byKey.get(key)??byKey.set(key,[]).get(key)).push(c);}
 const snapshots=[...byKey].slice(0,limit),found=new Map(),errors=[];
 for(const [key] of snapshots){
  const [id,revision]=key.split('@');
  try{
   const project=loadRevision(id,Number(revision)),geometry=await renderWithProbes(project,{probes:{wrap:wrapProbe},editions:['student'],log});
   const edition=geometry.editions.student,index=ownerIndex(project),ownerOf=x=>x?index.get(x)??null:null,rows=[];
   edition.pages.forEach(page=>{for(const row of page.probes?.wrap??[])rows.push({...row,page:page.page});});
   found.set(key,{wrapped:wrappedFindings(rows,{ownerOf}).map(f=>({blockId:f.blockId,detail:f.detail}))});
   log(`${key}: ${found.get(key).wrapped.length} wrapped`);
  }catch(error){errors.push({key,error:error.message});log(`${key}: ${error.message}`);}
 }
 const kinds={wrapped:s=>s.wrapped};
 const out={replayedAt:now(),snapshots:snapshots.length,errors,rows:[]};
 for(const [name,pick] of Object.entries(kinds)){
  const stats={eligible:0,caught:0,onCommented:0,offCommented:0,cases:[]};
  const categories={};
  for(const [key,list] of snapshots){
   const snap=found.get(key);if(!snap)continue;
   const [id]=key.split('@'),mine=pick(snap),cm=commented.get(id)??new Set();
   for(const f of mine)(cm.has(f.blockId)?stats.onCommented++:stats.offCommented++);
   for(const c of list){
    const hit=mine.some(f=>f.blockId===c.blockId);
    const cat=categories[c.category]??={eligible:0,caught:0};cat.eligible++;if(hit)cat.caught++;
    stats.eligible++;if(hit){stats.caught++;stats.cases.push(c.id);}
   }
  }
  out.rows.push({check:name,categories,...stats});
 }
 return out;
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--categories','--limit','--out'],flags:[]});
 const wanted=(opts['--categories']??'wrapping').split(',');
 const cases=read(path.join(DEFAULT_OUT,'cases.json')).cases.filter(c=>wanted.includes(c.category));
 const report=await replayRender({cases,limit:Number(opts['--limit']??Infinity),log:m=>console.error(m)});
 write(path.resolve(opts['--out']??path.join(DEFAULT_OUT,'replay-render.json')),report);
 console.log(JSON.stringify({snapshots:report.snapshots,errors:report.errors.length,rows:report.rows.map(r=>({check:r.check,categories:r.categories,onCommented:r.onCommented,offCommented:r.offCommented}))},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
