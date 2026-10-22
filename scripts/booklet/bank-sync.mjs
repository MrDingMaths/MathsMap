import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sharedQuestion,mergeQuestionContent,questionKey} from '../../src/lib/question-sync.js';
import {normaliseQuestion,validateQuestion,makeBankManifest} from '../../src/lib/practice-question-model.js';
import {reconcileSyncLayout} from '../../src/lib/question-sync-layout.js';
import {projectBankQuestion,mergeBankIntoBooklet,bankProjectionPolicy} from '../../src/lib/question-bank-projection.js';
import {isSelectableBankQuestion} from '../../src/lib/question-bank-eligibility.js';

export const revisionHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const sharedHash=(q,policy=null)=>revisionHash(sharedQuestion(normaliseQuestion(policy?projectBankQuestion(q,{policy}):q)));
export const questionKeyHash=(q,policy=null)=>revisionHash(questionKey(normaliseQuestion(policy?projectBankQuestion(q,{policy}):q)));
const json=v=>JSON.stringify(v,null,2)+'\n';
const segment=value=>{if(typeof value!=='string'||!value||!/^[a-zA-Z0-9._-]+$/.test(value)||value==='.'||value==='..')throw Object.assign(new Error('Invalid bank reference'),{statusCode:400});return value;};
const linksPath=root=>path.join(root,'.sync','links.json');
export async function readSyncJson(file,fallback=null,{readFile=fs.readFile,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 for(let attempt=0;;attempt++)try{return JSON.parse(await readFile(file,'utf8'));}catch(e){
  if(e.code==='ENOENT')return fallback;
  if(attempt>=3||!['EPERM','EBUSY','UNKNOWN'].includes(e.code))throw e;
  await delay([25,75,150][attempt]);
 }
}
export async function syncLinks(root){return readSyncJson(linksPath(root),{});}
let queue=Promise.resolve();
export function withBankLock(work){const pending=queue.then(work,work);queue=pending.catch(()=>{});return pending;}
export async function writeTransaction(entries){
 const before=new Map();for(const[file]of entries)before.set(file,await fs.readFile(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
 try{for(const[file,value]of entries){await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.sync-tmp';await fs.writeFile(temp,json(value));await fs.rename(temp,file);}}
 catch(e){for(const[file,raw]of before){if(raw===null)await fs.rm(file,{force:true});else await fs.writeFile(file,raw);await fs.rm(file+'.sync-tmp',{force:true});}throw e;}
}
async function bankRecords(root){const names=await fs.readdir(root).catch(()=>[]);return Promise.all(names.filter(n=>n.endsWith('.json')&&n!=='manifest.json').map(n=>readSyncJson(path.join(root,n))));}
export async function bankManifestEntry(root,updates){const records=await bankRecords(root),byId=new Map(records.filter(Boolean).map(q=>[q.id,q]));for(const q of updates)byId.set(q.id,q);return [path.join(root,'manifest.json'),makeBankManifest([...byId.values()].sort((a,b)=>a.id.localeCompare(b.id)))];}
export function registerOwner(links,project,block,bank,projection=links[bank.id]?.projection){links[bank.id]={projectId:project.id,blockId:block.id,sourceHash:sharedHash(block,projection),bankHash:sharedHash(bank),bankRevision:revisionHash(bank),...(projection?{projection}: {})};}
export async function registerBankOwner(root,project,block,bank,projection,{refreshExisting=false}={}){const links=await syncLinks(root),old=links[bank.id];if(refreshExisting&&old&&(old.projectId!==project.id||old.blockId!==block.id))throw Object.assign(new Error('Projection updates require the existing bank owner'),{statusCode:409});if(!old||refreshExisting){registerOwner(links,project,block,bank,projection);await writeTransaction([[linksPath(root),links]]);}}
const blocks=p=>p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question');
export async function refreshBankRatings(project,bankRoot){
 for(const block of blocks(project)){
  if(!block.bankRef?.id)continue;
  const bank=await readSyncJson(path.join(bankRoot,segment(block.bankRef.id)+'.json'));
  if(bank&&Number.isFinite(bank.classification?.reasoningScore))block.flow={...block.flow,bankDifficulty:{difficulty:bank.classification.difficulty,reasoningScore:bank.classification.reasoningScore,difficultyReason:bank.classification.difficultyReason??'',...(bank.classification.assessment?{assessment:structuredClone(bank.classification.assessment)}:{}),revision:revisionHash(bank)}};
 }
 return project;
}
export async function prepareAutomaticSync(project,bankRoot){
 const links=await syncLinks(bankRoot),entries=[],updated=[];let changed=false;
 for(const block of blocks(project)){
  const pair=Object.entries(links).find(([,l])=>l.projectId===project.id&&l.blockId===block.id);if(!pair)continue;
  const[id,link]=pair;segment(id);const current=await readSyncJson(path.join(bankRoot,id+'.json'));if(!current)continue;
  const localHash=sharedHash(block,link.projection),bankHash=sharedHash(current);
  if(localHash===bankHash){if(block.bankRef?.id===id)block.bankRef.revision=revisionHash(current);if(link.sourceHash!==localHash||link.bankHash!==bankHash||link.bankRevision!==revisionHash(current)){registerOwner(links,project,block,current);changed=true;}continue;}
  if(localHash===link.sourceHash||bankHash!==link.bankHash)continue; // local save succeeds; conflicting question pauses.
  const next=normaliseQuestion({...current,title:block.title??'',content:mergeQuestionContent(normaliseQuestion(projectBankQuestion(block,{policy:link.projection??null})).content,current.content),updatedAt:new Date().toISOString()});
  reconcileSyncLayout(current,next,next.presentation);
  const check=validateQuestion(next);if(!check.valid)throw new Error('Bank sync: '+check.errors.join('; '));
  entries.push([path.join(bankRoot,'.revisions',id,revisionHash(current)+'.json'),current],[path.join(bankRoot,id+'.json'),next]);updated.push(next);
  registerOwner(links,project,block,next);changed=true;
  if(block.bankRef?.id===id)block.bankRef.revision=revisionHash(next);
 }
 if(changed)entries.push([linksPath(bankRoot),links]);
 if(updated.length)entries.push(await bankManifestEntry(bankRoot,updated));
 return entries;
}
export async function projectSyncStatus(project,bankRoot){
 const links=await syncLinks(bankRoot),items=[];
 for(const block of blocks(project)){
  const ownerEntry=Object.entries(links).find(([,l])=>l.projectId===project.id&&l.blockId===block.id);
  const id=ownerEntry?.[0]??block.bankRef?.id;if(!id)continue;
  segment(id);if(block.bankRef?.revision)segment(block.bankRef.revision);
  const bank=await readSyncJson(path.join(bankRoot,id+'.json')),link=ownerEntry?.[1];
  if(!bank){items.push({blockId:block.id,bankId:id,state:'missing',owner:!!link});continue;}
  const localHash=sharedHash(block,link?.projection??block.bankRef?.projection),bankHash=sharedHash(bank),bankRevision=revisionHash(bank);
  let state='synced';
  if(localHash!==bankHash){
   if(link)state=localHash!==link.sourceHash&&bankHash!==link.bankHash?'conflict':bankHash!==link.bankHash?'update':'pending';
   else if(block.bankRef.revision!==bankRevision){
    const base=await readSyncJson(path.join(bankRoot,'.revisions',id,block.bankRef.revision+'.json'));
    // A classification-only bank revision offers no content update.
    state=base&&sharedHash(base)===bankHash?'local':base&&sharedHash(block)===sharedHash(base)?'update':'conflict';
   }else state='local';
  }
  items.push({blockId:block.id,bankId:id,owner:!!link,state,bankRevision,localHash,...(Number.isFinite(bank.classification?.reasoningScore)?{bankDifficulty:{difficulty:bank.classification.difficulty,reasoningScore:bank.classification.reasoningScore,difficultyReason:bank.classification.difficultyReason??'',...(bank.classification.assessment?{assessment:structuredClone(bank.classification.assessment)}:{}),revision:bankRevision}}:{}),title:block.title||block.sourceOrder&&`Question ${block.sourceOrder}`||'Question',...(state==='update'||state==='conflict'?{local:{...normaliseQuestion(block)},bank}: {})});
 }
 return {projectRevision:project.revision,items};
}
export async function prepareSyncResolution(project,bankRoot,body){
 const status=await projectSyncStatus(project,bankRoot),item=status.items.find(i=>i.blockId===body.blockId);
 if(!item||item.bankRevision!==body.bankRevision||item.localHash!==body.localHash)throw Object.assign(new Error('Question changed; review the latest differences.'),{statusCode:409});
 if(!['update','conflict','pending'].includes(item.state))throw Object.assign(new Error('No pending question update'),{statusCode:409});
 const links=await syncLinks(bankRoot),block=blocks(project).find(b=>b.id===body.blockId),bank=await readSyncJson(path.join(bankRoot,item.bankId+'.json')),entries=[];
 if(body.action==='use-bank'){
  const base=block.bankRef?.revision?await readSyncJson(path.join(bankRoot,'.revisions',item.bankId,block.bankRef.revision+'.json')):null;
  const before=structuredClone(block);
  block.content=mergeBankIntoBooklet(bank.content,block,base?.content,item.owner?links[item.bankId]?.projection:block.bankRef?.projection??null);block.title=bank.title;
  reconcileSyncLayout(before,block,block.presentation);
  reconcileSyncLayout(before,block,project.settings?.layoutOverrides?.blockLayouts?.[block.id]);
  if(block.bankRef)block.bankRef.revision=item.bankRevision;
  if(item.owner)registerOwner(links,project,block,bank);
 }else if(body.action==='use-booklet'&&item.owner){
  const next=normaliseQuestion({...bank,title:block.title??'',content:mergeQuestionContent(normaliseQuestion(projectBankQuestion(block,{policy:links[item.bankId]?.projection??null})).content,bank.content),updatedAt:new Date().toISOString()});
  reconcileSyncLayout(bank,next,next.presentation);
  const check=validateQuestion(next);if(!check.valid)throw new Error(check.errors.join('; '));
  entries.push([path.join(bankRoot,'.revisions',bank.id,item.bankRevision+'.json'),bank],[path.join(bankRoot,bank.id+'.json'),next],await bankManifestEntry(bankRoot,[next]));
  registerOwner(links,project,block,next);
 }else if(body.action==='keep-local'&&!item.owner){block.bankDecision={decision:'distinct',of:[...new Set([...(block.bankDecision?.of??[]),item.bankId])]};block.bankRef=null;block.snapshotKind='local';delete block.canonicalId;}
 else throw Object.assign(new Error('Invalid sync action'),{statusCode:400});
 entries.push([linksPath(bankRoot),links]);return entries;
}

// Duplicate linking. A duplicate is a question the sync comparison above already
// calls identical; a looser question-only key raises a pair for one decision.
const keyCache=new Map();
export async function bankQuestionKeys(root){
 const cache=keyCache.get(root)??keyCache.set(root,new Map()).get(root),seen=new Set();
 const names=(await fs.readdir(root).catch(()=>[])).filter(n=>n.endsWith('.json')&&n!=='manifest.json'),entries=new Array(names.length);let cursor=0;
 await Promise.all(Array.from({length:Math.min(32,names.length)},async()=>{
  while(cursor<names.length){
   const index=cursor++,name=names[index],file=path.join(root,name),stat=await fs.stat(file),stamp=stat.mtimeMs+':'+stat.size;seen.add(name);
   let entry=cache.get(name);
   if(entry?.stamp!==stamp){const q=await readSyncJson(file);entry=q?.id?{stamp,id:q.id,title:q.title??'',revision:revisionHash(q),selectable:isSelectableBankQuestion(q),shared:sharedHash(q),key:questionKeyHash(q)}:{stamp};cache.set(name,entry);}
   if(entry.selectable)entries[index]=entry;
  }
 }));
 for(const name of cache.keys())if(!seen.has(name))cache.delete(name);
 return entries.filter(Boolean);
}
export const blockPolicy=block=>{try{return bankProjectionPolicy(block);}catch{return null;}};
// One outcome per question, in order: linked, exact, held, new. A new question
// also stands for its future record, so a later copy in the same booklet links to it.
export async function resolveBankOutcomes(questions,bankRoot,entries=null){
 const byShared=new Map(),byKey=new Map(),outcomes=new Map();
 const add=(shared,key,ref)=>{if(!byShared.has(shared))byShared.set(shared,ref);byKey.set(key,[...(byKey.get(key)??[]),ref]);};
 for(const e of entries??await bankQuestionKeys(bankRoot))add(e.shared,e.key,{bankId:e.id});
 for(const block of questions){
  if(block.bankRef?.id){outcomes.set(block.id,{outcome:'linked',bankId:block.bankRef.id});continue;}
  const policy=blockPolicy(block),projected=sharedHash(block,policy),exact=byShared.get(projected);
  // Only content the consumer comparison will also call equal links without a decision.
  if(exact&&projected===sharedHash(block)){outcomes.set(block.id,{outcome:'exact',...exact});continue;}
  const decided=new Set(block.bankDecision?.of??[]),key=questionKeyHash(block,policy);
  const same=(byKey.get(key)??[]).filter(ref=>ref===exact||!ref.bankId||!decided.has(ref.bankId));
  if(same.length){outcomes.set(block.id,{outcome:'held',sameQuestionAs:same});continue;}
  outcomes.set(block.id,{outcome:'new'});add(projected,key,{blockId:block.id});
 }
 return outcomes;
}
// An exact match takes identity only. A same-question match adopts the bank's
// answers by structural path, so local ids and layout stay.
export function linkBlockToBank(project,block,bank,projection=bankProjectionPolicy(block)){
 if(sharedHash(block,projection)!==sharedHash(bank)){
  const before=structuredClone(block);
  block.content=mergeBankIntoBooklet(bank.content,block,bank.content,projection);block.title=bank.title;
  reconcileSyncLayout(before,block,block.presentation);
  reconcileSyncLayout(before,block,project.settings?.layoutOverrides?.blockLayouts?.[block.id]);
 }
 block.bankRef={id:bank.id,revision:revisionHash(bank),...(projection?{projection}: {})};block.canonicalId=bank.id;block.snapshotKind='bank';delete block.bankDecision;
}
// A booklet that files a shared question under another skill keeps it findable there.
export async function secondarySkillAmendment(bankRoot,bank,skillId){
 const c=bank.classification??{};
 if(!skillId||!c.primarySkillId||c.primarySkillId===skillId||(c.secondarySkillIds??[]).includes(skillId))return null;
 const next={...bank,classification:{...c,secondarySkillIds:[...(c.secondarySkillIds??[]),skillId]},updatedAt:new Date().toISOString()};
 return {bank:next,entries:[[path.join(bankRoot,'.revisions',segment(bank.id),revisionHash(bank)+'.json'),bank],[path.join(bankRoot,bank.id+'.json'),next],await bankManifestEntry(bankRoot,[next])]};
}
export async function assertNoBankDuplicate(bankRoot,question){
 const shared=sharedHash(question),match=(await bankQuestionKeys(bankRoot)).find(e=>e.shared===shared&&e.id!==question.id);
 if(match)throw Object.assign(new Error('This question is identical to bank question '+match.id+'. Use that question instead of creating another.'),{statusCode:409});
}
