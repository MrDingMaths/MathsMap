import path from 'node:path';
import {withBankLock,readSyncJson,revisionHash,writeTransaction,bankManifestEntry,syncLinks} from './bank-sync.mjs';
import {normaliseQuestion} from '../../src/lib/practice-question-model.js';

// Absorbing a question must not erase the bank record or a pinned revision.
// This maintenance action is explicit, revision-checked and uses the same bank
// lock/rollback transaction as owner sync. Ordinary imports never call it.
export async function supersedeBankQuestion({id,expectedRevision,replacementBankId,projectId,blockId,replacementBlockId},{bankRoot=path.resolve('booklets/question-bank'),projectRoot=path.resolve('booklets/projects')}={}) {
 for(const value of [id,replacementBankId,projectId,blockId,replacementBlockId])if(!/^[a-zA-Z0-9._-]+$/.test(value??''))throw Error('Invalid supersession reference');
 if(id===replacementBankId)throw Error('A bank question cannot supersede itself');
 return withBankLock(async()=>{
  const project=await readSyncJson(path.join(projectRoot,projectId+'.json'));
  const blocks=project?.sections?.flatMap(s=>s.blocks)??[];
  if(blocks.some(b=>b.bankRef?.id===id))throw Error('Absorbed question is still linked in the owner booklet');
  const replacement=blocks.find(b=>b.id===replacementBlockId);
  if(replacement?.bankRef?.id!==replacementBankId)throw Error('Replacement is not linked to the merged booklet question');
  const current=await readSyncJson(path.join(bankRoot,id+'.json'));
  if(!current)throw Error('Absorbed bank question is missing');
  if(current.status==='draft'&&current.review?.history?.some(h=>h.action==='superseded'&&h.replacementBankId===replacementBankId))return {id,replacementBankId,reused:true};
  if(revisionHash(current)!==expectedRevision)throw Error('Absorbed bank question changed; review before superseding');
  const links=await syncLinks(bankRoot),link=links[id];
  if(link&&(link.projectId!==projectId||link.blockId!==blockId))throw Error('Another booklet owns the absorbed question');
  const next=normaliseQuestion({...current,status:'draft',updatedAt:new Date().toISOString(),review:{...current.review,history:[...(current.review?.history??[]),{action:'superseded',at:new Date().toISOString(),replacementBankId,projectId,replacementBlockId,note:'Dependent follow-up appended to its preceding whole question by user request; previous content and pinned revisions retained.'}]}});
  delete links[id];
  await writeTransaction([[path.join(bankRoot,'.revisions',id,revisionHash(current)+'.json'),current],[path.join(bankRoot,id+'.json'),next],[path.join(bankRoot,'.sync','links.json'),links],await bankManifestEntry(bankRoot,[next])]);
  return {id,replacementBankId,reused:false};
 });
}
