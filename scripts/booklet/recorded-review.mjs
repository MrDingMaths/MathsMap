// The recorded-review test of the bank import pipeline (docs/booklet-bank-import-pipeline.md, Decision 2):
// a practice question is mathematically accepted for the bank when a review on record covers its current
// content. Shared by the read-only planner (pedagogy/bank-batch.mjs) and the publisher's `recorded-review-v1`
// acceptance profile (import-project-bank.mjs), so both use one definition. No model call is made here.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {questionReviewContent} from './lean-profile.mjs';
import {transferTaskHash,reviewedTransferSnapshot} from './bank-transfer-review.mjs';
import {liveWorkflow} from './workflow-review.mjs';
import {contentFingerprint} from '../../pedagogy/audit-v2-plan.mjs';
import {beforeSlashFractionRepair} from './slash-fraction-notation.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const sha=text=>createHash('sha256').update(text).digest('hex');

// A review covers a question when one of these matches its current content:
// - audit v2's error check, against the content fingerprint;
// - the import's lean review row, against its hash or its accepted snapshot;
// - a bank-merge record, against the content fingerprint of the joined question;
// - for September runs, the workflow register's independent review, against the reviewed input beside the
//   result (the same test as the master transfer profile's `workflow` proof).
export function recordedReview(block,context={}){
 const {leanRows={},auditChecks={},workflowRows={}}=context;
 const original=beforeSlashFractionRepair(block);
 if(original){
  const reviewed=recordedReview(original,context);
  if(reviewed.current)return reviewed;
 }
 const fp=contentFingerprint(block),hash=sha(JSON.stringify(questionReviewContent(block)));
 if(auditChecks[block.id]?.error===fp)return {current:true,by:'audit-v2'};
 // A follow-up merged into (or a given embedded in) a question whose parts each had a current review: the record
 // binds the joined content (pedagogy/bank-merges.mjs, Decision 5).
 const joined=block.sourceReview?.bankMergeReview;
 if(joined?.fingerprint===fp&&joined.components?.length&&joined.components.every(c=>c.current===true))return {current:true,by:'bank-merge'};
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
export const runDirOf=(project,root)=>{const runId=runIdOf(project);return runId?path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_')):null;};
export const leanReviewFile=(project,root)=>{const dir=runDirOf(project,root);return dir?path.join(dir,'lean-review','reviewed.json'):null;};
export const auditRecordFile=(projectId,root)=>path.join(root,'booklets','provenance','pedagogy-review','audit-v2',projectId+'.json');

export function leanRowsOf(project,root){
 const file=leanReviewFile(project,root);if(!file)return {};
 try{return read(file).questions??{};}catch{return {};}
}
// Read only when the run has no lean table: loading a workflow re-registers every page's inventory.
export function workflowRowsOf(project,root){
 const runDir=runDirOf(project,root);if(!runDir)return {};
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
export function auditChecksOf(project,root){
 try{return read(auditRecordFile(project.id,root)).checks??{};}catch{return {};}
}
export const reviewContext=(project,root)=>({leanRows:leanRowsOf(project,root),auditChecks:auditChecksOf(project,root),workflowRows:workflowRowsOf(project,root)});
