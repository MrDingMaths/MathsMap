import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {revisionHash,withBankLock,writeTransaction,bankManifestEntry,projectSyncStatus} from './bank-sync.mjs';
import {filterQuestionBank,validateQuestion} from '../../src/lib/practice-question-model.js';

export async function repairSourceClassifications({root=process.cwd(),apply=false}={}) {
 return withBankLock(async()=>{
  const started=Date.now(),read=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
  const bankRoot=path.join(root,'booklets/question-bank');
  const reviewFile='booklets/provenance/linear-relationships-v1/source-classification-review.json';
  const review=await read(reviewFile),projectFile='booklets/projects/'+review.projectId+'.json';
  const project=await read(projectFile),original=structuredClone(project),links=await read('booklets/question-bank/.sync/links.json');
  const taxonomy={skills:await read('data/skills.json'),topics:await read('data/topics.json'),dotpoints:await read('data/dotpoints.json')};
  const names=(await fs.readdir(bankRoot)).filter(n=>/^q-.*\.json$/.test(n)).sort();
  const records=await Promise.all(names.map(n=>read('booklets/question-bank/'+n))),byId=new Map(records.map(q=>[q.id,q]));
  const completed=review.questions.every(a=>JSON.stringify(byId.get(a.id)?.classification)===JSON.stringify(a.after));
  if(completed){
   const selected=review.questions.map(a=>byId.get(a.id));
   assert.equal(filterQuestionBank(selected,{topicId:'t-s3-mr-b'},taxonomy).length,0);
   assert.equal(filterQuestionBank(selected,{topicId:'t-s4-lin'},taxonomy).length,7);
   return {changed:0,alreadyApplied:true,reviewed:selected.length};
  }
  assert.equal(revisionHash(project),review.sourceProjectHash,'Source project changed since review');
  const tracked=[projectFile,reviewFile,'booklets/question-bank/.sync/links.json','booklets/question-bank/manifest.json',...names.map(n=>'booklets/question-bank/'+n)];
  const snapshots=await Promise.all(tracked.map(async f=>[f,await fs.readFile(path.join(root,f),'utf8')]));
  const entries=[],updated=[],now=new Date().toISOString();
  const status=await projectSyncStatus(project,bankRoot);
  for(const a of review.questions){
   const q=byId.get(a.id);assert.ok(q,'Missing reviewed bank question');
   assert.equal(revisionHash(q),a.beforeRevision,a.id+' changed since review');
   assert.equal(revisionHash(q.content),a.contentHash);
   assert.deepEqual(q.classification,a.before);
   const next=structuredClone(q);next.classification=structuredClone(a.after);next.updatedAt=now;
   next.review.history.push({at:now,action:'source-guided-classification',sourceProjectId:project.id,sourceBlockId:a.sourceBlockId,contentHash:a.contentHash,note:a.mappingNote});
   assert.ok(validateQuestion(next,{skillIds:new Set(taxonomy.skills.map(s=>s.id))}).valid);
   assert.deepEqual(next.content,q.content);assert.deepEqual(next.presentation,q.presentation);
   assert.equal(next.classification.reasoningScore,q.classification.reasoningScore);
   const link=links[q.id];
   if(link){
    assert.equal(link.projectId,project.id,'Unexpected owner');
    assert.equal(status.items.find(i=>i.bankId===q.id)?.state,'synced','Content sync needs review');
    const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id===link.blockId);
    assert.equal(block.bankRef?.id,q.id);block.bankRef.revision=revisionHash(next);
    if(block.flow?.bankDifficulty)block.flow.bankDifficulty.revision=revisionHash(next);
    link.bankRevision=revisionHash(next); // Shared-content baselines remain unchanged.
   }
   entries.push([path.join(bankRoot,'.revisions',q.id,a.beforeRevision+'.json'),q],[path.join(bankRoot,q.id+'.json'),next]);
   updated.push(next);
  }
  assert.equal(filterQuestionBank(updated,{topicId:'t-s3-mr-b'},taxonomy).length,0);
  assert.equal(filterQuestionBank(updated,{topicId:'t-s4-lin'},taxonomy).length,7);
  project.revision++;project.updatedAt=now;
  const withoutMetadata=p=>{const copy=structuredClone(p);delete copy.revision;delete copy.updatedAt;for(const b of copy.sections.flatMap(s=>s.blocks)){if(b.bankRef)delete b.bankRef.revision;if(b.flow?.bankDifficulty)delete b.flow.bankDifficulty.revision;}return copy;};
  assert.deepEqual(withoutMetadata(project),withoutMetadata(original),'Project content/layout changed');
  entries.push(await bankManifestEntry(bankRoot,updated),[path.join(bankRoot,'.sync/links.json'),links],
   [path.join(root,'booklets/projects/.revisions',project.id,original.revision+'.json'),original],[path.join(root,projectFile),project]);
  if(apply){
   for(const[f,raw]of snapshots)assert.equal(await fs.readFile(path.join(root,f),'utf8'),raw,'Concurrent edit: '+f);
   assert.deepEqual((await fs.readdir(bankRoot)).filter(n=>/^q-.*\.json$/.test(n)).sort(),names,'Bank inventory changed');
   await writeTransaction(entries);
   const after=await projectSyncStatus(project,bankRoot);
   for(const item of status.items)assert.equal(after.items.find(i=>i.blockId===item.blockId)?.state,item.state,'Sync state changed');
  }
  return {changed:apply?updated.length:0,reviewed:updated.length,applied:apply,projectRevision:apply?project.revision:original.revision,contentAndLayoutPreserved:true,durationMs:Date.now()-started};
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await repairSourceClassifications({apply:process.argv.includes('--apply')}),null,2));
