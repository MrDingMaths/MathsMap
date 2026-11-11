// Import hand-off records (import pipeline v2, Stage 11; docs/booklet-import-pipeline-v2.md).
// Written once a v2 import is deliverable. Rows are keyed by the audit's own content
// fingerprint (pedagogy/audit-v2-plan.mjs contentFingerprint), so the pedagogy audit treats
// what import checked as current and never checks it again while the fingerprint holds.
import fs from 'node:fs';
import path from 'node:path';
import {bookletIndex,contentFingerprint} from '../../pedagogy/audit-v2-plan.mjs';
import {reasoningTaskHash} from './reasoning-ratings.mjs';

const isGuided=block=>block?.type==='question'&&block.pedagogyRole==='guided-practice';
const correctionKind=field=>/^\/classification\/(reasoningScore|difficulty)/.test(field??'')?'rating':/^\/classification/.test(field??'')?'classification':/answer|theorySolution|steps/.test(field??'')?'answer':'content';

// Inventory entry ids whose target is this block or a node inside it.
function inventoryIds(project,block){
 const ids=new Set([block.id]);const walk=node=>{if(Array.isArray(node))return node.forEach(walk);if(node&&typeof node==='object'){if(node.id)ids.add(String(node.id));Object.values(node).forEach(walk);}};walk(block.content??{});
 return (project.source?.inventory?.entries??project.sourceInventory?.entries??[]).filter(entry=>ids.has(String(entry?.targetId))).map(entry=>entry.id);
}

// reviewed: RUN/lean-review/reviewed.json; corrections: parsed corrections.jsonl rows;
// currentHash(block) must equal the lean table's content hash for a row to count as checked.
export function buildImportHandoff({project,reviewed,corrections=[],currentHash,runId,configuration,track='booklet',completedAt=new Date().toISOString()}){
 const rows=[],checks={};
 for(const row of bookletIndex(project)){
  const {block}=row,review=reviewed.questions?.[block.id];
  if(review?.outcome!=='passed'||review.hash!==currentHash(block))continue;
  const fingerprint=contentFingerprint(block),assessment=block.classification?.assessment;
  const confirmed=row.question&&assessment?{at:assessment.assessedAt,model:assessment.model,evidence:assessment.evidence}:{at:review.at,model:configuration.model,effort:configuration.effort};
  rows.push({
   blockId:block.id,fingerprint,...(row.question?{taskHash:reasoningTaskHash(block)}:{}),
   answersConfirmed:confirmed,
   ...(row.question&&assessment?{rating:{taskHash:assessment.taskHash}}:{}),
   ...(block.classification?.primarySkillId?{skill:{primarySkillId:block.classification.primarySkillId,secondarySkillIds:block.classification.secondarySkillIds??[],verifiedBy:'import-content-review'}}:{}),
   sourceRefs:block.sourceRefs??(block.sourceReview?.sourcePages??[]).map(pageNumber=>({pageNumber})),
   inventoryIds:inventoryIds(project,block),
   corrections:corrections.filter(c=>c.blockId===block.id&&c.status==='applied').map(c=>({correctionId:c.correctionId,field:c.field,kind:correctionKind(c.field)})),
   ...(block.sourceReview?.exam?{exam:block.sourceReview.exam}:{})
  });
  if(row.question||row.example||isGuided(block))checks[block.id]={error:fingerprint,solve:fingerprint};
 }
 const importedBy={runId,completedAt,reviewModel:configuration.model,reviewEffort:configuration.effort};
 return {importRecord:{version:1,projectId:project.id,revision:project.revision??null,track,importedBy,rows},auditChecks:track==='booklet'?{importedBy,checks}:null};
}

// The audit record is merged, never overwritten: a block the audit already checked keeps its row.
export function writeImportHandoff(handoff,{root}){
 const id=handoff.importRecord.projectId,write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,1)+'\n');};
 const importFile=path.join(root,'booklets','provenance','import',id+'.json');
 write(importFile,handoff.importRecord);
 let auditFile=null;
 if(handoff.auditChecks){
  auditFile=path.join(root,'booklets','provenance','pedagogy-review','audit-v2',id+'.json');
  const record=fs.existsSync(auditFile)?JSON.parse(fs.readFileSync(auditFile,'utf8')):{version:1,projectId:id,checks:{},types:{},exampleMatches:{},keep:[],runs:[]};
  record.checks??={};
  for(const [blockId,row] of Object.entries(handoff.auditChecks.checks))record.checks[blockId]={...row,...record.checks[blockId]};
  record.importedBy=handoff.auditChecks.importedBy;
  write(auditFile,record);
 }
 return {importFile,auditFile};
}
