// Remove source checkbox glyphs now that Review labels are structural numbers.
// Dry-run by default; publish only affected owner questions through shared sync.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {prepareAutomaticSync,projectSyncStatus,writeTransaction} from './bank-sync.mjs';
import {usesReviewNumbers} from '../../src/lib/booklet-labels.js';

export function cleanReviewPrompt(value){
 if(typeof value==='string')return value.replace(/^\s*[☐□▢]\s*/u,'');
 if(value?.format!=='maths-editor-document-v1')return value;
 const next=structuredClone(value),first=next.blocks.find(b=>b.type==='paragraph'&&b.inlines?.length)?.inlines?.[0];
 if(first?.type==='text')first.text=cleanReviewPrompt(first.text);
 return next;
}
export async function normaliseReviews(apply=false){
 const report=[];
 for(const id of ['linear-relationships-v1','index-laws-complete-v1']){
  const file=path.resolve('booklets/projects',id+'.json'),raw=await fs.readFile(file,'utf8'),project=JSON.parse(raw);
  const reviews=project.sections.flatMap(s=>s.blocks).filter(usesReviewNumbers),changed=[];
  for(const block of reviews){const next=cleanReviewPrompt(block.content.prompt);if(JSON.stringify(next)!==JSON.stringify(block.content.prompt)){block.content.prompt=next;changed.push(block);}}
  const scoped={...project,sections:[{blocks:changed}]},bankRoot=path.resolve('booklets/question-bank');
  const status=await projectSyncStatus(scoped,bankRoot);
  assert.ok(status.items.every(i=>!['conflict','update','missing'].includes(i.state)),'Review sync needs explicit conflict review');
  if(apply&&changed.length){
   const entries=await prepareAutomaticSync(scoped,bankRoot);
   entries.push([path.resolve('booklets/projects/.revisions',id,project.revision+'.json'),JSON.parse(raw)]);
   project.revision++;project.updatedAt=new Date().toISOString();
   entries.push([file,project]);
   assert.equal(await fs.readFile(file,'utf8'),raw,'Project changed during maintenance');
   await writeTransaction(entries);
   const after=await projectSyncStatus(scoped,bankRoot);
   assert.ok(after.items.every(i=>i.state==='synced'),'Repaired Review questions must be synced');
  }
  report.push({id,groups:new Set(reviews.map(b=>b.sourceAtom.id)).size,prompts:reviews.length,changed:changed.map(b=>b.id),applied:apply});
 }
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1')))console.log(JSON.stringify(await normaliseReviews(process.argv.includes('--apply')),null,2));
