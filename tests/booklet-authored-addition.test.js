import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectContentCoverage,contentVerificationKey} from '../src/lib/booklet-content-verification.js';

async function fixture({lean=false,authored=true}={}){
 const block={id:'task',type:'question',content:{id:'part',type:'part',prompt:'Find 3 × 4.',answer:{short:'12',worked:'3 × 4 = 12'}}};
 const entry={id:'item',targetId:'task',kind:'question',pageNumber:1,...(authored?{origin:'authored',addition:{approvedBy:'user',date:'2026-10-09',reason:'Approved review question.'}}:{})};
 const project={sections:[{id:'s',blocks:[block]}],settings:{},source:{...(lean?{reviewProfile:'textbook-three-pass-v1'}:{}),inventory:{entries:[entry],pages:[{pageNumber:1,inventoried:true}]}}};
 entry.verification={checked:true,signature:await contentVerificationKey(project,entry),...(authored?{basis:'authored-addition',reviewer:'Independent reviewer',checkedAt:'2026-10-09',reviewNotes:{mathematics:'Derived 12 independently.',teaching:'Rehearses multiplication already taught.'}}:{})};
 return {project,entry,block};
}
const state=async project=>(await inspectContentCoverage(project)).rows[0].state;

test('approved signed authored reviews pass in legacy and lean profiles and identify their basis',async()=>{
 for(const lean of [false,true]){const {project}=await fixture({lean});const report=await inspectContentCoverage(project);assert.equal(report.rows[0].state,'verified');assert.equal(report.rows[0].basis,'authored-addition');}
});
test('authored additions require approval, explicit review basis, reviewer and both review notes',async()=>{
 for(const lean of [false,true])for(const missing of ['approval','basis','reviewer','date','mathematics','teaching','checked']){
  const {project,entry}=await fixture({lean});
  if(missing==='approval')delete entry.addition;else if(missing==='date')delete entry.verification.checkedAt;else if(['mathematics','teaching'].includes(missing))entry.verification.reviewNotes[missing]=' ';else delete entry.verification[missing];
  entry.verification.signature=await contentVerificationKey(project,entry);
  assert.equal(await state(project),'unchecked',`${lean}: ${missing}`);
 }
});
test('content, answer, diagram, relevant context and approval edits invalidate authored review',async()=>{
 for(const change of ['prompt','answer','diagram','context','approval']){
  const {project,entry,block}=await fixture();
  if(change==='prompt')block.content.prompt='Find 3 × 5.';
  if(change==='answer')block.content.answer.short='15';
  if(change==='diagram')block.content.questionDiagrams=[{id:'drawing',format:'tikz',code:'changed'}];
  if(change==='context'){entry.teachingContextIds=['part'];}
  if(change==='approval')entry.addition.reason='Different repair';
  assert.equal(await state(project),'unchecked',change);
 }
});
test('source verification retains legacy signatures and lean mapping; authored basis cannot bypass origin',async()=>{
 const {project,entry,block}=await fixture({authored:false});assert.equal(await state(project),'verified');
 entry.verification.basis='authored-addition';assert.equal(await state(project),'unchecked');delete entry.verification.basis;
 block.content.answer.worked='Changed working';assert.equal(await state(project),'unchecked');
 const lean=await fixture({lean:true,authored:false});assert.equal(await state(lean.project),'mapped');
});
