// Rolling batch driver for pedagogy audit v2 (8 November 2026).
//   node pedagogy/audit-v2-batch.mjs --stage4 [--projects a,b] [--parallel 3] [--dry-run] [--no-apply] [--limit N] [--top-up-counts]
// For each booklet: audit run, then --apply (one render, one save; verified findings are applied
// and still leave a comment for review). Booklets run side by side, up to --parallel at a time; the
// three-worker limit applies per booklet, so booklets do not compete for it. Resumable: a booklet
// whose audit record already checked its live revision, or that the ledger shows as applied at that
// revision, is skipped. A booklet with blockers is recorded and not applied.
// --dry-run runs only the free Stage 0 preflight for every booklet (holds, prompt sizes, slots).
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {isStage4Master,recordFile} from './audit-v2.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),value=n=>{const i=args.indexOf(n);return i<0?undefined:args[i+1];},flag=n=>args.includes(n);
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const projectsDir=path.join(ROOT,'booklets','projects');
const ledger=path.join(ROOT,'.booklet-work','pedagogy-audit-v2',flag('--dry-run')?'batch-dry-run.jsonl':'batch.jsonl');
const log=row=>{fs.mkdirSync(path.dirname(ledger),{recursive:true});fs.appendFileSync(ledger,JSON.stringify({at:new Date().toISOString(),...row})+'\n');console.error(`[${row.projectId}] ${row.status}${row.note?': '+row.note:''}`);};

function targets(){
 const named=(value('--projects')??'').split(',').filter(Boolean);
 if(named.length)return named;
 if(!flag('--stage4'))throw Error('Name --projects a,b or pass --stage4');
 return fs.readdirSync(projectsDir).filter(f=>f.endsWith('.json')).map(f=>{try{const p=read(path.join(projectsDir,f));return isStage4Master(p)?p.id??f.slice(0,-5):null;}catch{return null;}}).filter(Boolean).sort();
}
function done(id){
 // A count top-up (8 November 2026) runs once per booklet, whatever the audit record says.
 if(flag('--top-up-counts')){if(fs.existsSync(ledger)&&fs.readFileSync(ledger,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).some(r=>r.projectId===id&&r.topUp&&r.status==='applied'))return 'count top-up already applied';return null;}
 const live=read(path.join(projectsDir,id+'.json')),rec=recordFile(id,{root:ROOT});
 if(fs.existsSync(rec)&&read(rec).checkedRevision===live.revision)return 'audit record already checked revision '+live.revision;
 if(fs.existsSync(ledger)){const rows=fs.readFileSync(ledger,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(r=>r.projectId===id&&r.status==='applied');if(rows.some(r=>r.revision===live.revision))return 'applied at revision '+live.revision;}
 return null;
}
function run(cmd){
 return new Promise(resolve=>{const child=spawn(process.execPath,['pedagogy/review.mjs','audit-v2',...cmd],{cwd:ROOT,windowsHide:true});let out='',err='';
  child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);
  child.on('close',code=>{let json=null;const at=out.indexOf('{');try{json=JSON.parse(out.slice(at));}catch{}resolve({code,json,err:err.slice(-3000)});});});
}
let applyQueue=Promise.resolve();
const applyLock=()=>{let release;const next=new Promise(r=>release=r),wait=applyQueue;applyQueue=wait.then(()=>next);return wait.then(()=>release);};
async function one(id){
 const skip=!flag('--force')&&!flag('--dry-run')&&done(id);if(skip){log({projectId:id,status:'skipped',note:skip});return;}
 const audit=await run(['--project',id,...(flag('--dry-run')?['--dry-run']:[]),...(flag('--top-up-counts')?['--top-up-counts']:[])]);
 if(flag('--dry-run')){log({projectId:id,status:audit.code===0?'dry-run':'dry-run-failed',result:audit.json,note:audit.code?audit.err.slice(-400):undefined});return;}
 const r=audit.json;
 if(audit.code!==0||!r?.run||r.blockers?.length){log({projectId:id,status:'blocked',run:r?.run,blockers:r?.blockers,totals:r?.totals,note:audit.err.slice(-400)});return;}
 log({projectId:id,status:'audited',...(flag('--top-up-counts')?{topUp:true}:{}),run:r.run,totals:r.totals,applied:r.applied,comments:r.comments});
 if(flag('--no-apply'))return;
 // One apply at a time: an apply refuses to start while another page check runs (8 November 2026).
 const release=await applyLock();let apply;try{apply=await run(['--project',id,'--apply','--run',r.run]);}finally{release();}
 if(apply.code!==0||!apply.json?.revision){log({projectId:id,status:'apply-failed',run:r.run,note:apply.err.slice(-600)});return;}
 // What the run left (11 November 2026): jumps over 15 and core types short of the minimum, so a second pass can be
 // scheduled from the ledger instead of by reading every report.
 let remaining=null;try{const rep=read(path.join(path.isAbsolute(r.run)?r.run:path.join(ROOT,r.run),'report.json')).remaining??{};remaining={jumpsOver15:(rep.jumpsOver15??[]).length,countGapsOpen:(rep.deficits??[]).length,slotsStillOpen:rep.slotsStillOpen??null};}catch{}
 log({projectId:id,status:'applied',...(flag('--top-up-counts')?{topUp:true}:{}),run:r.run,revision:apply.json.revision,autoApplied:apply.json.autoApplied,render:apply.json.render,remaining});
}

const list=targets().slice(0,Number(value('--limit')??1e9)),parallel=Math.max(1,Number(value('--parallel')??3));
console.error(`audit v2 batch: ${list.length} booklets, ${parallel} at a time${flag('--dry-run')?', dry run':''}; ledger ${path.relative(ROOT,ledger)}`);
let next=0;
await Promise.all(Array.from({length:Math.min(parallel,list.length)},async()=>{while(next<list.length){const id=list[next++];try{await one(id);}catch(e){log({projectId:id,status:'error',note:e.message});}}}));
