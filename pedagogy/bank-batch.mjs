// Bank import pipeline (pipeline 4): docs/booklet-bank-import-pipeline.md (James's decisions, 11 November 2026).
//   node pedagogy/bank-batch.mjs plan --projects a,b | --masters | --textbooks [--json]
// `plan` is read-only: it writes nothing to projects or the bank. For every practice question in the batch it
// says what publication would do and why: linked already, publish, link to a master copy, hold for James,
// merge as a follow-up first, left out (with the reason) or out of scope (Exam questions in masters).
// Report: .booklet-work/bank-import-20261111/plan-<time>.json
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {practiceQuestions} from '../scripts/booklet/import-project-bank.mjs';
import {bankQuestionKeys,resolveBankOutcomes,syncLinks} from '../scripts/booklet/bank-sync.mjs';
import {verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {questionReviewContent} from '../scripts/booklet/lean-profile.mjs';
import {transferTaskHash,reviewedTransferSnapshot} from '../scripts/booklet/bank-transfer-review.mjs';
import {liveWorkflow} from '../scripts/booklet/workflow-review.mjs';
import {questionDependencyFindings,promptText} from '../src/lib/booklet-question-dependencies.js';
import {contentFingerprint} from './audit-v2-plan.mjs';
import {recordFile} from './audit-v2.mjs';
import {teacherBlocks} from '../polish/guards.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const RUN='.booklet-work/bank-import-20261111';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha=text=>createHash('sha256').update(text).digest('hex');

// Origin decides the rules: masters go first (Decision 9); textbooks are chapters still under import review or accepted.
export const originOf=project=>project.library?.category==='master'?'master':['import-review','textbook'].includes(project.library?.category)&&project.contentScope==='practice-only'?'textbook':null;

// Decision 7: an exam is named by a printed label (HSC, trial or school paper, PLC); NAPLAN stays practice.
const EXAM_LABEL=/\b(?:HSC|Higher School Certificate|PLC|CSSA)\b|\b(?:trial|half-yearly|yearly|school)\s+(?:HSC\s+)?(?:exam(?:ination)?|paper)\b/i;
export function examLabel(block){
 const lead=promptText(block.content?.prompt).trim().slice(0,80);
 const texts=[block.source?.label,block.source?.provider,block.source?.paper,block.title,lead].filter(t=>typeof t==='string'&&t.trim());
 if(texts.some(t=>/\bNAPLAN\b/i.test(t)))return null;
 const hit=texts.find(t=>EXAM_LABEL.test(t));return hit?hit.match(EXAM_LABEL)[0]:null;
}
const isExamQuestion=(block,section)=>section.role==='exam'||!!block.sourceReview?.exam||!!examLabel(block);

// Mathematical acceptance on the question's current content: the import's lean review row, or audit v2's
// error check on the current content fingerprint. Decision 2: trust a recorded review; never make a new one here.
export function recordedReview(block,{leanRows={},auditChecks={},workflowRows={}}={}){
 const fp=contentFingerprint(block),hash=sha(JSON.stringify(questionReviewContent(block)));
 if(auditChecks[block.id]?.error===fp)return {current:true,by:'audit-v2'};
 // Older (September) runs record each question's independent review in the workflow register, with the
 // reviewed input beside the result. Same test as the master transfer profile's `workflow` proof.
 const wf=workflowRows[block.id];
 if(wf&&!leanRows[block.id]){
  if(wf.outcome!=='passed')return {current:false,reason:'open-finding'};
  return wf.snapshot&&transferTaskHash(wf.snapshot)===transferTaskHash(block)?{current:true,by:'import'}:{current:false,reason:'review-stale'};
 }
 const row=leanRows[block.id];if(!row)return {current:false,reason:'no-recorded-review'};
 const version=row.acceptedVersion,passed=row.outcome==='passed'||version?.outcome==='passed'&&!version.revoked;
 if(!passed)return {current:false,reason:'open-finding'};
 if(row.hash===hash||version?.hash===hash||version?.snapshot&&(contentFingerprint(version.snapshot)===fp||transferTaskHash(version.snapshot)===transferTaskHash(block)))return {current:true,by:'import'};
 return {current:false,reason:'review-stale'};
}

export function runIdOf(project){
 const ref=project.source?.workflow??project.source?.inventory?.workflow;
 return ref?.runId??project.source?.runId??project.runId??null;
}
function leanRowsOf(project,root){
 const runId=runIdOf(project);if(!runId)return {};
 const file=path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'),'lean-review','reviewed.json');
 try{return read(file).questions??{};}catch{return {};}
}
// Read only when the run has no lean table: loading a workflow re-registers every page's inventory.
function workflowRowsOf(project,root){
 const runId=runIdOf(project);if(!runId)return {};
 const runDir=path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'));
 if(fs.existsSync(path.join(runDir,'lean-review','reviewed.json'))||!fs.existsSync(path.join(runDir,'workflow')))return {};
 let state;try{state=liveWorkflow(runDir);}catch{return {};}
 const rows={};
 for(const [key,entry] of Object.entries(state.verification?.entries??{})){
  if(!key.startsWith('question:'))continue;const id=key.slice(9);
  const resultRef=(entry.artifacts??[]).find(a=>/[\\/]stages[\\/]assessment-[^\\/]+[\\/][^\\/]+[\\/]result-[^\\/]+\.json$/.test(a.path));
  let snapshot=null;
  if(resultRef)try{
   const result=read(resultRef.path),request=read(path.join(path.dirname(resultRef.path),'request.json'));
   const input=request.job?.context?.questions?.find(q=>q.id===id);
   if(input)snapshot=reviewedTransferSnapshot(input,result);
  }catch{}
  rows[id]={outcome:entry.outcome,snapshot};
 }
 return rows;
}
function auditChecksOf(project,root){
 try{return read(recordFile(project.id,{root})).checks??{};}catch{return {};}
}

// One process listing for the whole batch: a booklet is busy when any other node process names it or its run.
export function busyProjects(projects){
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',`Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.ProcessId -ne ${process.pid} } | ForEach-Object { $_.CommandLine }`],{encoding:'utf8',windowsHide:true});
 const lines=String(r.stdout??'').split(/\r?\n/).filter(Boolean);
 return new Map(projects.map(p=>[p.id,lines.find(l=>l.includes(p.id)||runIdOf(p)&&l.includes(runIdOf(p)))]).filter(([,l])=>l));
}

// What publication would do with one question. Order matters: scope, existing link, readiness, follow-ups, bank outcome.
export function classify({project,section,block,origin,skills,review,outcome,dependency,protectedIds,ownerOrigin}){
 const row={blockId:block.id,origin,sectionRole:section.role==='challenge'||/challenge/i.test(section.title??'')?'challenge':'exercise'};
 if(origin==='master'&&isExamQuestion(block,section))return {...row,action:'out-of-scope',reason:'exam-question'};
 if(origin==='textbook'){const label=examLabel(block);if(label)row.examTag=label;}
 if(block.bankRef?.id)return {...row,action:'linked',bankId:block.bankRef.id};
 const reasons=[];
 if(!verifiedRating(block))reasons.push('rating-not-current');
 if(!skills.has(block.classification?.primarySkillId))reasons.push('no-known-skill');
 if(!review.current)reasons.push(review.reason);
 if(reasons.length)return {...row,action:'leave-out',reasons};
 if(dependency&&!dependency.reviewed)return {...row,action:protectedIds.has(block.id)?'follow-up-comment':'follow-up-merge',previousBlockId:dependency.previousBlockId,references:dependency.references.map(r=>r.reference)};
 if(outcome.outcome==='exact')return {...row,action:'link',bankId:outcome.bankId};
 if(outcome.outcome==='held'){
  const matches=(outcome.sameQuestionAs??[]).map(r=>r.bankId??r.blockId);
  // Decision 6: a textbook question matching a master-owned bank question links to the master's copy.
  const master=origin==='textbook'&&matches.find(id=>ownerOrigin(id)==='master');
  return master?{...row,action:'link-master',bankId:master,matches}:{...row,action:'hold',matches};
 }
 return {...row,action:'publish'};
}

export async function planBatch(projects,{root=ROOT}={}){
 const bankRoot=path.join(root,'booklets','question-bank');
 const skills=new Set(read(path.join(root,'data','skills.json')).map(s=>s.id));
 const entries=await bankQuestionKeys(bankRoot),links=await syncLinks(bankRoot);
 const categories=new Map();for(const name of fs.readdirSync(path.join(root,'booklets','projects')).filter(n=>n.endsWith('.json'))){try{const p=read(path.join(root,'booklets','projects',name));categories.set(p.id,originOf(p));}catch{}}
 const ownerOrigin=bankId=>categories.get(links[bankId]?.projectId)??null;
 const busy=busyProjects(projects),rows=[];
 for(const project of projects){
  const origin=originOf(project);
  if(!origin){rows.push({projectId:project.id,skipped:'not a master or textbook chapter'});continue;}
  if(busy.has(project.id)){rows.push({projectId:project.id,origin,skipped:'busy: '+busy.get(project.id).slice(0,160)});continue;}
  const sectionOf=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,s])));
  const questions=practiceQuestions(project),outcomes=await resolveBankOutcomes(questions,bankRoot,entries);
  const deps=new Map(questionDependencyFindings(project).map(d=>[d.blockId,d]));
  const ctx={leanRows:leanRowsOf(project,root),auditChecks:auditChecksOf(project,root),workflowRows:workflowRowsOf(project,root)},protectedIds=teacherBlocks(project);
  const blocks=questions.map(block=>classify({project,section:sectionOf.get(block.id),block,origin,skills,review:recordedReview(block,ctx),outcome:outcomes.get(block.id),dependency:deps.get(block.id),protectedIds,ownerOrigin}));
  const counts={};for(const b of blocks)counts[b.action]=(counts[b.action]??0)+1;
  const reasons={};for(const b of blocks)for(const r of b.reasons??[])reasons[r]=(reasons[r]??0)+1;
  rows.push({projectId:project.id,origin,revision:project.revision,questions:blocks.length,counts,reasons,examTags:blocks.filter(b=>b.examTag).length,blocks});
 }
 return rows;
}

function selectProjects(args,root){
 const dir=path.join(root,'booklets','projects'),all=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>{try{return read(path.join(dir,n));}catch{return null;}}).filter(p=>p?.id&&!p.library?.archived);
 if(args.projects)return args.projects.split(',').map(id=>{const p=all.find(x=>x.id===id);if(!p)throw Error('Unknown project '+id);return p;});
 if(args.masters)return all.filter(p=>originOf(p)==='master');
 if(args.textbooks)return all.filter(p=>originOf(p)==='textbook');
 throw Error('Name a batch: --projects a,b | --masters | --textbooks');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...rest]=process.argv.slice(2),args={};
 for(let i=0;i<rest.length;i++){const k=rest[i].replace(/^--/,'');args[k]=rest[i+1]&&!rest[i+1].startsWith('--')?rest[++i]:true;}
 if(command!=='plan'){console.error('Usage: node pedagogy/bank-batch.mjs plan --projects a,b | --masters | --textbooks [--json]');process.exit(2);}
 const rows=await planBatch(selectProjects(args,ROOT));
 const out=path.join(ROOT,RUN,'plan-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({createdAt:new Date().toISOString(),projects:rows},null,1)+'\n');
 if(args.json)console.log(JSON.stringify(rows,null,1));
 else{
  const actions=['linked','publish','link','link-master','hold','follow-up-merge','follow-up-comment','leave-out','out-of-scope'];
  console.log(['project','origin','questions',...actions,'examTags','leave-out reasons'].join('\t'));
  for(const r of rows)console.log(r.skipped?[r.projectId,r.origin??'',r.skipped].join('\t'):[r.projectId,r.origin,r.questions,...actions.map(a=>r.counts[a]??0),r.examTags,Object.entries(r.reasons).map(([k,v])=>k+' '+v).join(', ')].join('\t'));
  console.log('Report: '+path.relative(ROOT,out));
 }
}
