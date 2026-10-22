import fs from 'node:fs/promises';
import path from 'node:path';
import {withBankLock,writeTransaction,readSyncJson,revisionHash,bankManifestEntry,syncLinks} from './bank-sync.mjs';
import {practiceRatingBlocks,reasoningTaskHash,verifiedRating} from './reasoning-ratings.mjs';

const conflict=message=>Object.assign(new Error(message),{statusCode:409});
const ratingMetadata=rating=>({reasoningScore:rating?.reasoningScore,difficulty:rating?.difficulty,difficultyReason:rating?.difficultyReason,assessment:structuredClone(rating?.assessment)});
// Metadata-only transaction: no content normalisation, ordering or bank promotion.
export async function saveReasoningRatings({projectId,expectedRevision,updates},{projectRoot=path.resolve('booklets/projects'),bankRoot=path.resolve('booklets/question-bank')}={}){
 if(!/^[\w.-]+$/.test(projectId)||['.','..'].includes(projectId)||!Number.isInteger(expectedRevision)||!Array.isArray(updates))throw Error('Invalid rating transaction');
 return withBankLock(async()=>{
  const file=path.join(projectRoot,projectId+'.json'),before=await fs.readFile(file,'utf8'),project=JSON.parse(before.replace(/^\uFEFF/,''));
  if(project.revision!==expectedRevision)throw conflict('Project changed; reload before saving reasoning ratings');
  const blocks=new Map(practiceRatingBlocks(project).map(({block})=>[block.id,block])),links=await syncLinks(bankRoot),linksBefore=revisionHash(links),entries=[],bankUpdates=new Map(),bankDisplays=new Map(),bankBefore=new Map(),seen=new Set();
  for(const update of updates){
   const block=blocks.get(update.blockId);
   if(!block||seen.has(block.id)||update.expectedTaskHash!==reasoningTaskHash(block)||!verifiedRating(block,update.rating))throw conflict('Question changed or invalid assessment: '+update.blockId);
   seen.add(block.id);
   block.classification={...block.classification,...ratingMetadata(update.rating)};
   if(!block.bankRef?.id)continue;
   const id=block.bankRef.id;if(!/^[\w.-]+$/.test(id)||['.','..'].includes(id))throw Error('Invalid bank ID');
   const bankFile=path.join(bankRoot,id+'.json'),bank=await readSyncJson(bankFile);
   // Locally amended or pinned tasks keep an individual assessment. Their
   // different canonical bank task must never receive this task's rating.
   if(!bank||reasoningTaskHash(bank)!==update.expectedTaskHash)continue;
   if(JSON.stringify(ratingMetadata(bank.classification))===JSON.stringify(ratingMetadata(update.rating))){bankDisplays.set(id,bank);continue;}
   if(update.expectedBankRevision!==revisionHash(bank))throw conflict('Bank changed during assessment: '+id);
   bankBefore.set(id,revisionHash(bank));
   const next={...bank,classification:{...bank.classification,...ratingMetadata(update.rating)},updatedAt:new Date().toISOString()};
   const previous=bankUpdates.get(id);
   if(previous&&JSON.stringify(previous.classification)!==JSON.stringify(next.classification))throw conflict('Conflicting assessments for linked question '+id);
   bankUpdates.set(id,next);
   bankDisplays.set(id,next);
   entries.push([path.join(bankRoot,'.revisions',id,revisionHash(bank)+'.json'),bank],[bankFile,next]);
   if(links[id])links[id]={...links[id],bankRevision:revisionHash(next)};
  }
  // Refresh matching placements without altering pinned content revisions.
  for(const {block} of practiceRatingBlocks(project)){
   const bank=bankDisplays.get(block.bankRef?.id);if(!bank)continue;
   const c=bank.classification;
   block.flow={...block.flow,bankDifficulty:{reasoningScore:c.reasoningScore,difficulty:c.difficulty,difficultyReason:c.difficultyReason,assessment:structuredClone(c.assessment),revision:revisionHash(bank)}};
  }
  if(!updates.length)return project;
  if(bankUpdates.size)entries.push(await bankManifestEntry(bankRoot,[...bankUpdates.values()]),[path.join(bankRoot,'.sync/links.json'),links]);
  project.revision++;project.updatedAt=new Date().toISOString();
  // Refuse a concurrent on-disk edit as well as a changed expected revision.
  if(await fs.readFile(file,'utf8')!==before)throw conflict('Project changed before rating publication');
  for(const [id,hash]of bankBefore)if(revisionHash(await readSyncJson(path.join(bankRoot,id+'.json')))!==hash)throw conflict('Bank changed before rating publication: '+id);
  if(bankUpdates.size&&revisionHash(await syncLinks(bankRoot))!==linksBefore)throw conflict('Bank ownership changed before rating publication');
  entries.push([file,project]);await writeTransaction(entries);return project;
 });
}
