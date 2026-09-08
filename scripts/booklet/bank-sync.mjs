import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sharedQuestion,mergeQuestionContent} from '../../src/lib/question-sync.js';
import {normaliseQuestion,validateQuestion,makeBankManifest} from '../../src/lib/practice-question-model.js';
import {reconcileSyncLayout} from '../../src/lib/question-sync-layout.js';

export const revisionHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const sharedHash=q=>revisionHash(sharedQuestion(normaliseQuestion(q)));
const json=v=>JSON.stringify(v,null,2)+'\n';
const segment=value=>{if(typeof value!=='string'||!value||!/^[a-zA-Z0-9._-]+$/.test(value)||value==='.'||value==='..')throw Object.assign(new Error('Invalid bank reference'),{statusCode:400});return value;};
const linksPath=root=>path.join(root,'.sync','links.json');
export async function readSyncJson(file,fallback=null){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
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
export function registerOwner(links,project,block,bank){links[bank.id]={projectId:project.id,blockId:block.id,sourceHash:sharedHash(block),bankHash:sharedHash(bank),bankRevision:revisionHash(bank)};}
export async function registerBankOwner(root,project,block,bank){const links=await syncLinks(root);if(!links[bank.id]){registerOwner(links,project,block,bank);await writeTransaction([[linksPath(root),links]]);}}
const blocks=p=>p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question');
export async function prepareAutomaticSync(project,bankRoot){
 const links=await syncLinks(bankRoot),entries=[],updated=[];let changed=false;
 for(const block of blocks(project)){
  const pair=Object.entries(links).find(([,l])=>l.projectId===project.id&&l.blockId===block.id);if(!pair)continue;
  const[id,link]=pair;segment(id);const current=await readSyncJson(path.join(bankRoot,id+'.json'));if(!current)continue;
  const localHash=sharedHash(block),bankHash=sharedHash(current);
  if(localHash===bankHash){if(block.bankRef?.id===id)block.bankRef.revision=revisionHash(current);if(link.sourceHash!==localHash||link.bankHash!==bankHash||link.bankRevision!==revisionHash(current)){registerOwner(links,project,block,current);changed=true;}continue;}
  if(localHash===link.sourceHash||bankHash!==link.bankHash)continue; // local save succeeds; conflicting question pauses.
  const next=normaliseQuestion({...current,title:block.title??'',content:mergeQuestionContent(normaliseQuestion(block).content,current.content),updatedAt:new Date().toISOString()});
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
  const localHash=sharedHash(block),bankHash=sharedHash(bank),bankRevision=revisionHash(bank);
  let state='synced';
  if(localHash!==bankHash){
   if(link)state=localHash!==link.sourceHash&&bankHash!==link.bankHash?'conflict':bankHash!==link.bankHash?'update':'pending';
   else if(block.bankRef.revision!==bankRevision){
    const base=await readSyncJson(path.join(bankRoot,'.revisions',id,block.bankRef.revision+'.json'));
    state=base&&sharedHash(block)===sharedHash(base)?'update':'conflict';
   }else state='local';
  }
  items.push({blockId:block.id,bankId:id,owner:!!link,state,bankRevision,localHash,title:block.title||block.sourceOrder&&`Question ${block.sourceOrder}`||'Question',...(state==='update'||state==='conflict'?{local:{...normaliseQuestion(block)},bank}: {})});
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
  block.content=mergeQuestionContent(bank.content,block.content,base?.content);block.title=bank.title;
  reconcileSyncLayout(before,block,block.presentation);
  reconcileSyncLayout(before,block,project.settings?.layoutOverrides?.blockLayouts?.[block.id]);
  if(block.bankRef)block.bankRef.revision=item.bankRevision;
  if(item.owner)registerOwner(links,project,block,bank);
 }else if(body.action==='use-booklet'&&item.owner){
  const next=normaliseQuestion({...bank,title:block.title??'',content:mergeQuestionContent(normaliseQuestion(block).content,bank.content),updatedAt:new Date().toISOString()});
  reconcileSyncLayout(bank,next,next.presentation);
  const check=validateQuestion(next);if(!check.valid)throw new Error(check.errors.join('; '));
  entries.push([path.join(bankRoot,'.revisions',bank.id,item.bankRevision+'.json'),bank],[path.join(bankRoot,bank.id+'.json'),next],await bankManifestEntry(bankRoot,[next]));
  registerOwner(links,project,block,next);
 }else if(body.action==='keep-local'&&!item.owner){block.bankRef=null;block.snapshotKind='local';delete block.canonicalId;}
 else throw Object.assign(new Error('Invalid sync action'),{statusCode:400});
 entries.push([linksPath(bankRoot),links]);return entries;
}
