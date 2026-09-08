// Explicit metadata maintenance. No question, answer, teaching mapping, layout or booklet edits.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {linearAssessments} from './linear-bank-assessments.mjs';
import {difficultyBandForScore,validateQuestion,makeBankManifest,normaliseQuestion} from '../../src/lib/practice-question-model.js';
import {isTheoryReview,isSelectableBankQuestion} from '../../src/lib/question-bank-eligibility.js';
import {revisionHash,writeTransaction,readSyncJson,projectSyncStatus} from './bank-sync.mjs';
import {sharedQuestion} from '../../src/lib/question-sync.js';

export function assessedClassification(question, sourceId) {
 const rating=linearAssessments[sourceId];
 if(!rating)throw Error('Missing individual assessment: '+sourceId);
 const classification={...question.classification,...rating,difficulty:difficultyBandForScore(rating.reasoningScore)};
 let ids=[classification.primarySkillId,...classification.secondarySkillIds];
 // Equation solving supports these tasks; the assessed task is the linear pattern/model.
 // Detailed node teaching mappings retain the supporting algebra evidence.
 if(ids.includes('equations-from-formulas')&&!['page-50-q1','page-82-q1','page-92-q3'].includes(sourceId)) {
  ids=ids.filter(id=>id!=='equations-from-formulas');
  if(sourceId==='page-27-q4')ids=['find-equation-from-table','apply-pattern-equation'];
 }
 if(['page-51-q1','page-52-b1'].includes(sourceId))ids=['apply-pattern-equation']; // rule is given, not generated
 if(sourceId==='page-56-q11')ids=['pattern-to-equation','apply-pattern-equation'];
 classification.primarySkillId=ids[0];classification.secondarySkillIds=ids.slice(1);
 return classification;
}

export async function reassessLinearBank({root=process.cwd(),apply=false}={}) {
 const file=p=>path.join(root,p),bankRoot=file('booklets/question-bank');
 const read=async p=>JSON.parse(await fs.readFile(file(p),'utf8'));
 const index=await read('docs/linear-relationships-bank-index.json');
 const prior=await readSyncJson(file('docs/linear-bank-assessment-register.json'));
 const priorById=new Map((prior?.questions??[]).map(q=>[q.id,q]));
 const source=await read('booklets/projects/linear-relationships-complete-v1.json');
 const sourceBlocks=new Map(source.sections.flatMap(s=>s.blocks.map(b=>[b.id,{block:b,section:s}])));
 const lineage=new Map(index.modules.flatMap(m=>m.blocks.filter(b=>b.bankRef).map(b=>[b.bankRef.id,b.id])));
 const links=await read('booklets/question-bank/.sync/links.json'),linksBefore=structuredClone(links);
 const statusBefore=await projectSyncStatus(source,bankRoot);
 const skillIds=new Set((await read('data/skills.json')).map(s=>s.id));
 const snapshots=new Map();
 // Preserve every existing project and module byte-for-byte, including consumer revision pins.
 for(const folder of ['booklets/projects','booklets/module-bank'])for(const name of await fs.readdir(file(folder)))if(name.endsWith('.json')){
  const target=file(folder+'/'+name);snapshots.set(target,await fs.readFile(target));
 }
 const records=[],entries=[],audit=[];const inputs=new Map();
 const now=new Date().toISOString();
 for(const name of (await fs.readdir(bankRoot)).filter(n=>/^q-.*\.json$/.test(n)).sort()) {
  const target=path.join(bankRoot,name),raw=await fs.readFile(target),before=JSON.parse(raw);
  inputs.set(target,raw);
  const previousAssessment=priorById.get(before.id);
  if(previousAssessment&&previousAssessment.contentHash!==revisionHash(before.content))throw Error('Content changed since assessment; review the score before maintenance: '+before.id);
  const sourceId=lineage.get(before.id)??before.id,placement=sourceBlocks.get(sourceId);
  const classification=assessedClassification(before,sourceId);
  const next={...before,classification};
  if(placement&&isTheoryReview(placement.block,placement.section))next.libraryRole='theory-review';
  const changed=JSON.stringify(next)!==JSON.stringify(before);
  if(changed)next.updatedAt=now;
  assert.deepEqual(next.content,before.content);assert.deepEqual(next.presentation,before.presentation);
  assert.deepEqual(sharedQuestion(normaliseQuestion(next)),sharedQuestion(normaliseQuestion(before)));
  const checked=validateQuestion(next,{skillIds});assert.ok(checked.valid,before.id+': '+checked.errors.join('; '));
  if(changed)entries.push([path.join(bankRoot,'.revisions',before.id,revisionHash(before)+'.json'),before],[target,next]);
  // Classification and visibility do not change either shared-content baseline.
  // Do not resolve or reset an existing content conflict as a side effect.
  const link=links[before.id];
  if(link&&link.bankHash===revisionHash(sharedQuestion(normaliseQuestion(before))))link.bankRevision=revisionHash(next);
  audit.push({id:before.id,sourceId,contentHash:revisionHash(before.content),libraryRole:next.libraryRole??'practice',before:before.classification,after:classification,changed});
  records.push(next);
 }
 const report={version:1,method:'Individual content assessment; estimated cognitive demand, not observed student performance.',reviewedAt:now,questions:audit};
 const visible=records.filter(isSelectableBankQuestion);
 const summary={total:records.length,selectable:visible.length,theoryReviews:records.filter(isTheoryReview).length,drafts:records.filter(q=>q.status==='draft').length,changed:audit.filter(a=>a.changed).length,classificationChanges:audit.filter(a=>a.before.primarySkillId!==a.after.primarySkillId||JSON.stringify(a.before.secondarySkillIds)!==JSON.stringify(a.after.secondarySkillIds)).length,scoreRange:[Math.min(...visible.map(q=>q.classification.reasoningScore)),Math.max(...visible.map(q=>q.classification.reasoningScore))],distinctScores:new Set(visible.map(q=>q.classification.reasoningScore)).size};
 if(apply&&summary.changed) {
  // Recheck reads immediately before the transaction so concurrent authoring is not overwritten.
  for(const[target,raw]of [...inputs,...snapshots])assert.ok(raw.equals(await fs.readFile(target)),'Changed during assessment: '+target);
  assert.deepEqual(await read('booklets/question-bank/.sync/links.json'),linksBefore,'Sync links changed during assessment');
  entries.push([file('booklets/question-bank/.sync/links.json'),links],[file('booklets/question-bank/manifest.json'),makeBankManifest(records)],[file('docs/linear-bank-assessment-register.json'),report]);
  await writeTransaction(entries);
  for(const[target,raw]of snapshots)assert.ok(raw.equals(await fs.readFile(target)),'Booklet/module modified: '+target);
  const statusAfter=await projectSyncStatus(source,bankRoot);
  assert.deepEqual(statusAfter.items.map(i=>[i.bankId,i.state]),statusBefore.items.map(i=>[i.bankId,i.state]),'Sync state changed');
  const savedLinks=await read('booklets/question-bank/.sync/links.json');
  for(const[id,link]of Object.entries(savedLinks))assert.deepEqual({...link,bankRevision:null},{...linksBefore[id],bankRevision:null},'Sync baseline changed: '+id);
 }
 return summary;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await reassessLinearBank({apply:process.argv.includes('--apply')}),null,2));
