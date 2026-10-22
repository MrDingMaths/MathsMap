// Existing master transfers reuse mathematical acceptance, not renderer or
// project-version hashes. New/changed tasks still need an independent review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {questionReviewContent} from './lean-profile.mjs';
import {compatibleRatingHash} from './reasoning-ratings.mjs';

const sha=v=>createHash('sha256').update(v).digest('hex');
const contentHash=b=>sha(JSON.stringify(questionReviewContent(b)));
export function transferTaskHash(block){
 const parents=[];const visit=(n,path=[])=>{if(n?.children?.length){if(n.answer&&(n.answer.short||n.answer.worked||n.answer.solutionDiagrams?.length))parents.push([path,compatibleRatingHash({content:{type:'question',prompt:'',answer:n.answer}})]);n.children.forEach((child,i)=>visit(child,[...path,i]));}};visit(block.content);
 const base=compatibleRatingHash(block);return parents.length?sha(JSON.stringify([base,parents])):base;
}
export function readTransferArtifact(ref,root=process.cwd()){
 const file=path.resolve(root,ref?.path??'');
 assert.ok(ref?.hash&&ref.path,'Transfer review artifact required');
 const bytes=fs.readFileSync(file);assert.equal(sha(bytes),ref.hash,'Transfer review artifact changed: '+file);
 return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));
}
export function reviewedTransferSnapshot(block,result){
 const copy=structuredClone(block),nodes=new Map();
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.id)nodes.set(v.id,v);for(const child of Object.values(v))visit(child);};visit(copy);
 for(const c of result.corrections??[])for(const patch of c.patches??[]){
  const node=nodes.get(patch.targetId);if(!node)continue;
  const keys=patch.field.split('/').slice(1).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));
  let parent=node;for(const k of keys.slice(0,-1))parent=parent?.[k];
  assert.ok(parent&&keys.length,'Invalid review correction');const key=keys.at(-1);
  assert.deepEqual(parent[key]??null,patch.original??null,'Review correction input differs');parent[key]=structuredClone(patch.corrected);
 }
 return copy;
}
export function validateMasterTransferReview(project,assessments,questions,{root=process.cwd(),targets}={}){
 const review=assessments.existingTransferReview;
 assert.equal(review?.profile,'accepted-master-content-v1');
 assert.equal(project.library?.category,'master','Only existing master booklets may reuse acceptance');
 assert.ok(['full-booklet-import','project-copy'].includes(project.source?.type),'Existing source import required');
 const artifacts=new Map();const artifact=ref=>{const key=JSON.stringify(ref);if(!artifacts.has(key))artifacts.set(key,readTransferArtifact(ref,root));return artifacts.get(key);};
 const records=new Map((review.questions??[]).map(r=>[r.sourceBlockId,r]));
 const selected=questions.filter(q=>!targets||targets.has(q.id));
 assert.equal(records.size,selected.length,'Transfer review must cover exactly the new questions');
 for(const q of selected){
  const record=records.get(q.id);assert.equal(record?.taskHash,transferTaskHash(q),q.id+' reviewed task changed');
  assert.ok(record.note?.trim(),q.id+' needs review observations');
  const proof=record.proof;let snapshot;
  if(proof?.kind==='lean'){
   const table=artifact(proof.table),row=table.questions?.[q.id];
   assert.ok(row,'Missing historical question review');
   snapshot=proof.snapshot;
   const version=row.acceptedVersion;
   assert.ok(row.outcome==='passed'&&row.hash===contentHash(snapshot)||version?.outcome==='passed'&&!version.revoked&&version.hash===contentHash(snapshot),'Snapshot lacks historical acceptance');
  }else if(proof?.kind==='workflow'){
   const result=artifact(proof.result),request=artifact(proof.request);
   const accepted=result.records?.find(r=>r.id==='question:'+q.id||r.id===q.id);
   assert.ok(accepted?.outcome==='passed'&&accepted.note?.trim(),'Missing independent passed review');
   snapshot=request.job?.context?.questions?.find(b=>b.id===q.id);
   assert.ok(snapshot,'Historical reviewed input missing');snapshot=reviewedTransferSnapshot(snapshot,result);
  }else if(proof?.kind==='independent'){
   const result=artifact(proof.result),input=artifact(proof.input),metrics=artifact(proof.metrics);
   const r=result.records?.find(r=>r.id===q.id)??result.projects?.flatMap(p=>p.questions??[]).find(r=>r.sourceBlockId===q.id);
   assert.ok((r?.outcome==='passed'||r?.passed===true)&&r.note?.trim(),'Changed/unreviewed question lacks independent acceptance');
   assert.ok(metrics.model&&metrics.endedAt,'Actual review model/time required');
   snapshot=input.questions?.find(row=>row.block.id===q.id)?.block??input.projects?.flatMap(p=>p.questions??[]).find(b=>b.id===q.id);
   assert.ok(snapshot,'Independent review input missing');
   assert.ok(!result.corrections?.length,'Apply and verify review corrections before transferring');
  }else assert.fail('Unknown transfer review proof');
  assert.equal(transferTaskHash(snapshot),transferTaskHash(q),q.id+' mathematical content changed since acceptance');
 }
 return review;
}
