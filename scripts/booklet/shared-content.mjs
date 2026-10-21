// Identical content shared by several booklets stays in step: an edit to one
// copy waits for a decision (apply to all copies, or keep this copy different),
// and applying it updates every other linked copy while keeping that booklet's
// IDs, layout, numbering and classification. See docs/booklet-shared-content.md.
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {reuseContentHash,reuseContentValue,reuseNodePositions,remapReference,referenceField} from './reuse-content.mjs';
import {writeTransaction,readSyncJson,withBankLock} from './bank-sync.mjs';
import {reconcileProjectLayouts} from '../../src/lib/question-sync-layout.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const SHARED_ROOT=path.join(ROOT,'booklets','shared-content');
export const PROJECT_ROOT=path.join(ROOT,'booklets','projects');
export const CHECK_ROOT=path.join(ROOT,'.booklet-work','shared-content','checks');
const RUN_ROOT=path.join(ROOT,'.booklet-work','full-imports');
// Registry, page-check and index locations that belong with a projects folder.
// A checkout's booklets/projects uses that checkout's registry and work folder;
// a temporary library keeps everything beside it and never touches the real one.
export function sharedRootsFor(projectRoot){
 const projects=path.resolve(projectRoot),repo=path.dirname(path.dirname(projects));
 if(path.basename(projects)==='projects'&&path.basename(path.dirname(projects))==='booklets')
  return {sharedRoot:path.join(repo,'booklets','shared-content'),checkRoot:path.join(repo,'.booklet-work','shared-content','checks'),indexFile:path.join(repo,'.booklet-work','shared-content','index.json')};
 return {sharedRoot:path.join(projects,'..','shared-content'),checkRoot:path.join(projects,'..','shared-checks'),indexFile:path.join(projects,'..','shared-index.json')};
}
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const registryFile=root=>path.join(root,'groups.json');
const revisionFile=(root,group,hash)=>path.join(root,'.revisions',group,hash+'.json');
const key=(projectId,blockId)=>projectId+'\0'+blockId;
const fail=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});

const SIZES=new Set(['width','widths','rowHeights','gap','margin']);
// Fields each booklet keeps for itself. They are the fields the content hash
// ignores, so a merged copy hashes equal to the version it took. Colour is
// mathematical meaning and is shared.
const LOCAL=new Set(['classification','verification','sourceReview','sourceLayoutEvidence','provenance','visualAudit','reviewStatus','reviewNotes','reviewFlags','audit','auditTrail','sourceRefs','studio','bankRef','canonicalId','snapshotKind','scaffoldTargetId',
 'presentation','flow','answerSpaceMm','workingSpaceEstimate','workingEstimate','responseSpace','layout','columns','diagramPlacement','widthMm','heightMm','fontSize','align','verticalAlign','background','border','showClozeDots','joinPrevious','padding','marginBefore','marginAfter','spaceBefore','spaceAfter',
 'number','questionNumber','sourceOrder','sourcePageNumber','sourceLabel','sourceAtom','reuse','bankDecision','sharedDecision',...SIZES]);
const LAYOUT_MAPS=['blockLayouts','answerSpaces','diagramColourModes','diagramWidths'];

export const contentBlocks=project=>(project.sections??[]).filter(section=>section.phase!=='front-matter').flatMap(section=>(section.blocks??[]).filter(block=>block?.id&&block.type!=='page-break'));
// Class copies are a class's own snapshot of a booklet; they are linked only on request.
export const isClassCopy=project=>project?.library?.category==='class';
// Sizes and spacing inside the content (cloze and inline widths, table column
// widths, row heights, gaps) are each booklet's own layout: two copies that
// differ only in these are the same content, and a merge keeps the target's.
function withoutSizes(value){
 if(Array.isArray(value))return value.map(withoutSizes);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.entries(value).filter(([name])=>!SIZES.has(name)).map(([name,child])=>[name,withoutSizes(child)]));
}
const hashes=new WeakMap();
export function blockHash(block){if(!hashes.has(block))hashes.set(block,reuseContentHash(withoutSizes(block)));return hashes.get(block);}
// Any practice question can be shared. Teaching blocks need enough content that
// an identical match means the same teaching, not a generic one-line instruction.
export function substantive(block){
 if(block.type==='question')return true;
 return JSON.stringify(reuseContentValue(block)).length>=300;
}
function walk(value,visit){if(!value||typeof value!=='object')return;visit(value);for(const child of Object.values(value))walk(child,visit);}
function nodeIds(value){const ids=new Set();walk(value,node=>{if(typeof node.id==='string')ids.add(node.id);});return ids;}

// --- registry -------------------------------------------------------------

export async function readRegistry(root=SHARED_ROOT){
 const value=await readSyncJson(registryFile(root),null);
 return value?.groups?{offers:{},...value}:{format:'mathsmap-shared-content-v1',version:1,groups:{},offers:{}};
}
export const readRevision=(root,group,hash)=>readSyncJson(revisionFile(root,group,hash),null);
function memberIndex(registry){
 const index=new Map();
 for(const group of Object.values(registry.groups))for(const member of group.members)index.set(key(member.projectId,member.blockId),{group,member});
 return index;
}
const groupId=(projectId,blockId)=>'g-'+sha(key(projectId,blockId)).slice(0,20);

// What a copy is doing now, from its content and the recorded decisions.
export function memberStatus(member,group,hash){
 if(member.state==='separate')return 'separate';
 if(hash==null)return 'missing';
 if(hash===group.current.hash)return 'synced';
 if(member.edit)return 'edited';
 if(member.adopt)return 'behind';
 if(member.state==='diverged')return 'diverged';
 if(hash===member.syncedHash)return 'behind';
 return 'edited';
}
export const editBase=member=>member.edit?.basedOn??member.syncedHash??null;

// --- merge ----------------------------------------------------------------

// Put incoming content into the target block. Nodes correspond by structural
// position: incomingPositions gives each incoming node's position in the version
// the target still matches, targetPositions the target's own nodes.
export function mergeSharedBlock(incoming,target,{incomingPositions=reuseNodePositions(incoming),targetPositions=reuseNodePositions(target),usedIds=new Set()}={}){
 const byPosition=new Map([...targetPositions].map(([id,position])=>[position,id])),targetById=new Map(),ids=new Map();
 walk(target,node=>{if(typeof node.id==='string'&&!targetById.has(node.id))targetById.set(node.id,node);});
 const taken=new Set([...usedIds,...targetById.keys()]),fresh=id=>{let next=target.id+'-'+id,n=2;while(taken.has(next))next=target.id+'-'+id+'-'+n++;taken.add(next);return next;};
 const claimed=new Set([target.id]);ids.set(incoming.id,target.id);
 walk(incoming,node=>{
  if(typeof node.id!=='string'||ids.has(node.id))return;
  const match=byPosition.get(incomingPositions.get(node.id));
  if(match&&!claimed.has(match)){claimed.add(match);ids.set(node.id,match);}else ids.set(node.id,fresh(node.id));
 });
 const remap=(value,field='')=>{
  if(Array.isArray(value))return value.map(child=>remap(child,field));
  if(!value||typeof value!=='object'){
   if(typeof value!=='string')return value;
   if(field==='id')return ids.get(value)??value;
   return referenceField(field)?remapReference(value,ids):value;
  }
  return Object.fromEntries(Object.entries(value).map(([name,child])=>[name,remap(child,name)]));
 };
 const result=remap(structuredClone(incoming));
 const pair=(node,fallback)=>node&&typeof node==='object'&&!Array.isArray(node)&&typeof node.id==='string'?targetById.get(node.id)??null:fallback;
 const restore=(node,local)=>{
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach((child,i)=>restore(child,pair(child,Array.isArray(local)?local[i]:undefined)));return;}
  if(local&&typeof local==='object'&&!Array.isArray(local)){
   const responses=node.sourceReview?.responses;
   for(const name of LOCAL){if(Object.hasOwn(local,name))node[name]=structuredClone(local[name]);else delete node[name];}
   if(responses!==undefined)node.sourceReview={...(node.sourceReview??{}),responses};
   else if(node.sourceReview?.responses!==undefined){node.sourceReview={...node.sourceReview};delete node.sourceReview.responses;}
   if(node.type==='question'&&/^\d+$/.test(String(node.label??''))&&/^\d+$/.test(String(local.label??'')))node.label=local.label;
  }
  for(const [name,child] of Object.entries(node))if(!LOCAL.has(name))restore(child,pair(child,local?.[name]));
 };
 restore(result,target);
 return result;
}

// Replace one block in a project, dropping saved layout entries of removed nodes
// and reconciling arrangement pointers, as bank sync does.
export function replaceProjectBlock(project,blockId,next){
 const before=project,previous=contentBlocks(project).find(b=>b.id===blockId);
 const after=structuredClone(project);
 for(const section of after.sections)section.blocks=section.blocks.map(block=>block.id===blockId?next:block);
 const removed=[...nodeIds(previous)].filter(id=>!nodeIds(next).has(id));
 const overrides=after.settings?.layoutOverrides;
 if(overrides)for(const name of LAYOUT_MAPS)if(overrides[name])for(const id of removed)delete overrides[name][id];
 return overrides?.blockLayouts?reconcileProjectLayouts(before,after):after;
}

// --- busy booklets ---------------------------------------------------------

// A booklet is busy while an import or repair runs on it: a live worker lease in
// its run directory, or a node process whose command line names it or its run.
export function busyProjects(projects,{runRoot=RUN_ROOT,commandLines=processCommandLines}={}){
 const busy=new Set(),lines=commandLines();
 const alive=pid=>{try{process.kill(pid,0);return true;}catch(error){return error.code==='EPERM';}};
 for(const project of projects){
  const runId=project.runId??project.source?.runId;
  // Whole names only: one booklet ID can be part of another (ratios-v1, percentage-ratios-v1).
  const named=[project.id,runId].filter(Boolean).map(name=>new RegExp('(^|[^A-Za-z0-9._-])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'($|[^A-Za-z0-9._-])'));
  if(lines.some(line=>named.some(pattern=>pattern.test(line)))){busy.add(project.id);continue;}
  if(!runId)continue;
  const slots=path.join(runRoot,runId,'workflow','worker-slots');
  for(const name of fsSync.existsSync(slots)?fsSync.readdirSync(slots):[]){
   try{const lease=JSON.parse(fsSync.readFileSync(path.join(slots,name),'utf8'));if(lease.pid&&alive(lease.pid)){busy.add(project.id);break;}}catch{/* An unreadable lease is being written: busy. */busy.add(project.id);break;}
  }
 }
 return busy;
}
function processCommandLines(){
 try{
  const out=process.platform==='win32'
   ?execFileSync('powershell',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { \"$($_.ProcessId) $($_.CommandLine)\" }"],{encoding:'utf8',windowsHide:true,timeout:20000})
   :execFileSync('ps',['-eo','pid=,args='],{encoding:'utf8',timeout:20000});
  return out.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).filter(line=>Number(line.split(' ')[0])!==process.pid).filter(line=>/lean-import|lean-review|export|pedagogy[\\/]review|import-project-bank|check-feedback-pages/.test(line)).map(line=>line.replace(/^\d+\s+/,''));
 }catch{return [];}
}

// --- projects --------------------------------------------------------------

const projectCache=new Map();
async function readProject(projectRoot,id){
 const file=path.join(projectRoot,id+'.json');
 let stat;try{stat=await fs.stat(file);}catch{return null;}
 const old=projectCache.get(file);
 if(old&&old.mtimeMs===stat.mtimeMs&&old.size===stat.size)return old.project;
 const project=JSON.parse((await fs.readFile(file,'utf8')).replace(/^﻿/,''));
 // A few recent booklets only: Studio's server is long-running and booklets are large.
 projectCache.delete(file);projectCache.set(file,{mtimeMs:stat.mtimeMs,size:stat.size,project});
 while(projectCache.size>6)projectCache.delete(projectCache.keys().next().value);
 return project;
}
async function projectIds(projectRoot){return (await fs.readdir(projectRoot).catch(()=>[])).filter(name=>name.endsWith('.json')&&name!=='manifest.json').map(name=>name.slice(0,-5)).sort();}
const findBlock=(project,blockId)=>project?contentBlocks(project).find(block=>block.id===blockId)??null:null;

// --- save hook -------------------------------------------------------------

// Called inside the revision-checked save. It records, once, the version an
// edited copy started from (so apply-to-all can map new parts exactly), links
// copies that rejoined the shared version, links new imports whose reuse source
// is shared and identical, and forgets deleted copies. It never edits booklets.
export async function sharedSaveEntries(previous,project,{sharedRoot=SHARED_ROOT,now=new Date().toISOString()}={}){
 const registry=await readRegistry(sharedRoot),index=memberIndex(registry);let changed=false;
 const blocks=new Map(contentBlocks(project).map(block=>[block.id,block])),before=new Map(previous?contentBlocks(previous).map(block=>[block.id,block]):[]);
 for(const group of Object.values(registry.groups)){
  for(const member of [...group.members]){
   if(member.projectId!==project.id)continue;
   const block=blocks.get(member.blockId);
   if(!block){group.members=group.members.filter(m=>m!==member);changed=true;continue;}
   if(member.state==='separate')continue;
   const hash=blockHash(block);
   if(hash===group.current.hash){
    if(member.syncedHash!==hash||member.edit||member.adopt||member.state!=='linked'){Object.assign(member,{state:'linked',syncedHash:hash});delete member.edit;delete member.adopt;changed=true;}
    continue;
   }
   const old=before.get(member.blockId);
   if(!member.edit&&!member.adopt&&member.state==='linked'&&hash!==member.syncedHash&&old&&blockHash(old)===member.syncedHash){
    member.edit={basedOn:member.syncedHash,basePositions:[...reuseNodePositions(old)],at:now};changed=true;
   }
  }
  if(group.members.length<2){delete registry.groups[group.id];changed=true;}
 }
 for(const block of isClassCopy(project)?[]:blocks.values()){
  const reuse=block.sourceReview?.reuse;
  if(!reuse?.projectId||!reuse.blockId||index.has(key(project.id,block.id)))continue;
  const source=index.get(key(reuse.projectId,reuse.blockId));
  if(!source||!registry.groups[source.group.id]||blockHash(block)!==source.group.current.hash)continue;
  source.group.members.push({projectId:project.id,blockId:block.id,state:'linked',syncedHash:source.group.current.hash,linkedAt:now,via:'reuse'});
  index.set(key(project.id,block.id),{group:source.group});changed=true;
 }
 // A question added to an exercise that other booklets share is offered to them.
 // Imported copies, class copies and questions already shared are not offered.
 registry.offers??={};
 for(const [offerKey,offer] of Object.entries(registry.offers))if(offer.projectId===project.id&&!blocks.has(offer.blockId)){delete registry.offers[offerKey];changed=true;}
 if(previous&&!isClassCopy(project)){
  const members=memberIndex(registry);
  const sharedHere=id=>members.get(key(project.id,id))?.group.members.some(m=>m.projectId!==project.id&&m.state!=='separate');
  for(const section of project.sections??[]){
   if(section.phase==='front-matter'||!(section.blocks??[]).some(b=>sharedHere(b.id)))continue;
   for(const block of section.blocks){
    const offerKey=key(project.id,block.id);
    if(block.type!=='question'||before.has(block.id)||members.has(offerKey)||block.sourceReview?.reuse||registry.offers[offerKey])continue;
    registry.offers[offerKey]={projectId:project.id,blockId:block.id,state:'pending',at:now};changed=true;
   }
  }
 }
 return changed?[[registryFile(sharedRoot),registry]]:[];
}

// --- catching copies up ----------------------------------------------------

// The revisions between a copy's version and the shared version, oldest first.
async function revisionChain(root,group,fromHash){
 const chain=[];let hash=group.current.hash;
 for(let guard=0;hash&&guard<500;guard++){
  if(hash===fromHash)return chain.reverse();
  const revision=await readRevision(root,group.id,hash);if(!revision)return null;
  chain.push(revision);hash=revision.previousHash;
 }
 return null;
}

// Bring one booklet's copies of shared content up to the shared version.
// prepareWrite(previous,next) returns {project,entries} for a revision-checked
// write (validation, revision, checkpoint, bank sync). Returns what changed.
export async function catchUpProject(projectId,{projectRoot=PROJECT_ROOT,sharedRoot=SHARED_ROOT,checkRoot=CHECK_ROOT,prepareWrite,groupIds=null,force=false,busy=null,expectedRevision=null,source=null,now=new Date().toISOString()}={}){
 const registry=await readRegistry(sharedRoot),previous=await readProject(projectRoot,projectId);
 if(!previous)return {projectId,updated:[],skipped:'missing'};
 if(expectedRevision!=null&&Number(previous.revision)!==Number(expectedRevision))throw fail('Booklet changed; reload before applying shared content.',409);
 const behind=Object.values(registry.groups).filter(group=>!groupIds||groupIds.includes(group.id)).flatMap(group=>group.members.filter(m=>m.projectId===projectId).map(member=>({group,member}))).filter(({group,member})=>{const block=findBlock(previous,member.blockId);return block&&memberStatus(member,group,blockHash(block))==='behind';});
 if(!behind.length)return {projectId,updated:[],errors:[]};
 if(!force&&(busy??busyProjects([previous])).has(projectId))return {projectId,updated:[],skipped:'busy',errors:[]};
 let next=previous;const updated=[],errors=[];
 for(const {group,member} of behind){
  const block=findBlock(next,member.blockId);
  try{
   const steps=member.adopt?null:await revisionChain(sharedRoot,group,member.syncedHash);
   let merged=block;
   const usedIds=nodeIds(next);
   if(steps?.length){
    for(const step of steps)merged=mergeSharedBlock(step.snapshot,merged,{incomingPositions:step.basePositions?new Map(step.basePositions):reuseNodePositions(step.snapshot),usedIds});
   }else{
    const latest=await readRevision(sharedRoot,group.id,group.current.hash);
    if(!latest)throw Error('Shared version '+group.current.hash.slice(0,12)+' is missing');
    merged=mergeSharedBlock(latest.snapshot,merged,{usedIds});
   }
   if(blockHash(merged)!==group.current.hash)throw Error('Merged copy does not match the shared version');
   next=replaceProjectBlock(next,member.blockId,merged);
   updated.push({groupId:group.id,blockId:member.blockId,before:block,after:merged,from:group.current.from});
  }catch(error){errors.push({groupId:group.id,blockId:member.blockId,message:error.message});}
 }
 if(!updated.length)return {projectId,updated:[],errors};
 const {project,entries}=await prepareWrite(previous,next);
 // Re-read the registry inside the write so concurrent decisions are kept.
 const fresh=await readRegistry(sharedRoot);
 for(const item of updated){const member=fresh.groups[item.groupId]?.members.find(m=>m.projectId===projectId&&m.blockId===item.blockId);if(member){Object.assign(member,{state:'linked',syncedHash:fresh.groups[item.groupId].current.hash,syncedAt:now});delete member.adopt;delete member.edit;}}
 entries.push([registryFile(sharedRoot),fresh],...await queuePageCheck(previous,project,updated,{checkRoot,source,now}));
 await writeTransaction(entries);
 return {projectId,project,updated:updated.map(({before,after,...item})=>item),errors};
}

// --- new questions in shared exercises ---------------------------------------

const sectionOf=(project,blockId)=>(project?.sections??[]).find(section=>(section.blocks??[]).some(block=>block.id===blockId))??null;
function excerpt(block){
 const parts=[];walk(block.content,node=>{for(const name of ['prompt','text','latex'])if(typeof node[name]==='string')parts.push(node[name]);});
 return (block.title||parts.join(' ')).replace(/\s+/g,' ').trim().slice(0,140);
}
// Where a new question could go: the exercises in other booklets that hold
// copies of this exercise's shared blocks, unless they already have it.
function offerTargets(project,blockId,registry,index){
 const section=sectionOf(project,blockId),block=findBlock(project,blockId);if(!section||!block)return [];
 const members=memberIndex(registry),hash=blockHash(block),own=members.get(key(project.id,blockId))?.group,targets=new Map();
 for(const sibling of section.blocks){
  const shared=members.get(key(project.id,sibling.id));if(!shared)continue;
  for(const other of shared.group.members){
   const target=index.projects[other.projectId];
   if(other.projectId===project.id||other.state==='separate'||!target||target.classCopy)continue;
   if(target.blocks.some(b=>b.hash===hash)||own?.members.some(m=>m.projectId===other.projectId))continue;
   const at=target.blocks.find(b=>b.id===other.blockId);if(!at)continue;
   targets.set(other.projectId+'\0'+at.sectionId,{projectId:other.projectId,title:target.title,sectionId:at.sectionId,sectionTitle:target.sections?.[at.sectionId]??''});
  }
 }
 return [...targets.values()];
}
// Place the copy after the target's copy of the nearest earlier shared block in
// the source exercise, else before the nearest later one, else at the end.
function insertionIndex(source,sourceSection,blockId,targetId,targetSection,members){
 const order=sourceSection.blocks.map(b=>b.id),at=order.indexOf(blockId);
 const position=id=>{const copy=members.get(key(source.id,id))?.group.members.find(m=>m.projectId===targetId&&m.state!=='separate');return copy?targetSection.blocks.findIndex(b=>b.id===copy.blockId):-1;};
 for(let i=at-1;i>=0;i--){const p=position(order[i]);if(p>=0)return p+1;}
 for(let i=at+1;i<order.length;i++){const p=position(order[i]);if(p>=0)return p;}
 return targetSection.blocks.length;
}
// A fresh local copy for another booklet: new IDs, no bank link, numbering or
// source identity, and the source's saved layout entries carried over.
function copyForBooklet(block,source,target){
 const used=nodeIds(target),prefix='s'+sha(key(source.id,block.id)).slice(0,6),ids=new Map();
 walk(block,node=>{if(typeof node.id==='string'&&!ids.has(node.id)){let next=prefix+'-'+node.id,n=2;while(used.has(next))next=prefix+'-'+node.id+'-'+n++;used.add(next);ids.set(node.id,next);}});
 const remap=(value,field='')=>{
  if(Array.isArray(value))return value.map(child=>remap(child,field));
  if(!value||typeof value!=='object'){if(typeof value!=='string')return value;if(field==='id')return ids.get(value)??value;return referenceField(field)?remapReference(value,ids):value;}
  return Object.fromEntries(Object.entries(value).map(([name,child])=>[name,remap(child,name)]));
 };
 const copy=remap(structuredClone(block));
 for(const name of ['flow','number','questionNumber','sourceRefs','sourcePageNumber','sourceLabel','sourceOrder','sourceAtom','canonicalId','verification','visualAudit','reviewStatus','reviewNotes','reviewFlags','audit','auditTrail','provenance','sourceLayoutEvidence','bankDecision'])delete copy[name];
 Object.assign(copy,{bankRef:null,snapshotKind:'local',sourceReview:{...(copy.sourceReview?.responses?{responses:copy.sourceReview.responses}:{}),reuse:{projectId:source.id,blockId:block.id}}});
 const layouts={};
 for(const name of LAYOUT_MAPS)for(const [old,next] of ids){const value=source.settings?.layoutOverrides?.[name]?.[old];if(value!==undefined)(layouts[name]??={})[next]=remap(structuredClone(value));}
 return {copy,layouts};
}
async function addOffered(projectId,body,options,registry){
 const {projectRoot=PROJECT_ROOT,sharedRoot=SHARED_ROOT,checkRoot=CHECK_ROOT,indexFile=sharedRootsFor(projectRoot).indexFile,now=new Date().toISOString()}=options;
 const offerKey=key(projectId,body.blockId),offer=registry.offers?.[offerKey];
 if(!offer||offer.state!=='pending')throw fail('This question has no open offer',404);
 const source=await readProject(projectRoot,projectId),block=findBlock(source,body.blockId),sourceSection=sectionOf(source,body.blockId);
 if(!block)throw fail('Save the booklet before adding the question elsewhere',409);
 const {index}=await updateSharedIndex({projectRoot,indexFile}),allowed=offerTargets(source,body.blockId,registry,index);
 const chosen=(body.targets??allowed).filter(t=>allowed.some(a=>a.projectId===t.projectId&&a.sectionId===t.sectionId));
 if(!chosen.length)throw fail('Choose at least one booklet to add the question to');
 const hash=blockHash(block),members=memberIndex(registry),existing=members.get(offerKey)?.group;
 if(existing&&existing.current.hash!==hash)throw fail('Decide this question\'s own shared change first',409);
 const added=[],results=[];
 for(const projectIdTarget of [...new Set(chosen.map(t=>t.projectId))]){
  const previous=await readProject(projectRoot,projectIdTarget);
  if(!previous){results.push({projectId:projectIdTarget,updated:[],errors:[{message:'Booklet not found'}]});continue;}
  if((options.busy??busyProjects([previous])).has(projectIdTarget)){results.push({projectId:projectIdTarget,updated:[],skipped:'busy',errors:[]});continue;}
  let next=structuredClone(previous);const inserted=[];
  for(const target of chosen.filter(t=>t.projectId===projectIdTarget)){
   const section=next.sections.find(s=>s.id===target.sectionId);if(!section)continue;
   const {copy,layouts}=copyForBooklet(block,source,next);
   section.blocks.splice(insertionIndex(source,sourceSection,block.id,projectIdTarget,section,members),0,copy);
   next.settings.layoutOverrides??={};for(const [name,values] of Object.entries(layouts))next.settings.layoutOverrides[name]={...(next.settings.layoutOverrides[name]??{}),...values};
   inserted.push({blockId:copy.id,before:null,after:copy});
  }
  if(!inserted.length)continue;
  const {project,entries}=await options.prepareWrite(previous,next);
  entries.push(...await queuePageCheck(previous,project,inserted,{checkRoot,source:{projectId,blockId:block.id},now}));
  await writeTransaction(entries);
  added.push(...inserted.map(item=>({projectId:projectIdTarget,blockId:item.blockId})));
  results.push({projectId:projectIdTarget,updated:inserted.map(item=>({blockId:item.blockId}))});
 }
 // Record the copies as one shared group with the original.
 const fresh=await readRegistry(sharedRoot),writes=[];
 let group=existing?fresh.groups[existing.id]:null;
 if(added.length){
  if(!group){
   group={id:groupId(projectId,block.id),current:{hash,from:{projectId,blockId:block.id,revision:source.revision??null},at:now},members:[{projectId,blockId:block.id,state:'linked',syncedHash:hash,linkedAt:now,via:'offer'}],createdAt:now};
   fresh.groups[group.id]=group;
   writes.push([revisionFile(sharedRoot,group.id,hash),{hash,previousHash:null,snapshot:structuredClone(block),basePositions:null,from:group.current.from,at:now}]);
  }
  for(const item of added)group.members.push({projectId:item.projectId,blockId:item.blockId,state:'linked',syncedHash:hash,linkedAt:now,via:'offer'});
 }
 const remaining=offerTargets(source,body.blockId,fresh,(await updateSharedIndex({projectRoot,indexFile})).index).filter(t=>!added.some(a=>a.projectId===t.projectId));
 fresh.offers[offerKey]={...fresh.offers[offerKey],state:remaining.length&&results.some(r=>r.skipped)?'pending':'added',addedTo:[...(fresh.offers[offerKey]?.addedTo??[]),...added],decidedAt:now};
 await writeTransaction([...writes,[registryFile(sharedRoot),fresh]]);
 options.onQueued?.(results.filter(r=>r.updated?.length).map(r=>r.projectId));
 return results;
}

// --- decisions ------------------------------------------------------------

// Studio and the CLI decide here. Each action runs under the bank lock and
// writes the booklets it changes with a revision-checked write.
export async function resolveShared(projectId,body,options={}){
 return withBankLock(()=>resolveUnlocked(projectId,body,options));
}
async function resolveUnlocked(projectId,body,options){
 const {projectRoot=PROJECT_ROOT,sharedRoot=SHARED_ROOT,checkRoot=CHECK_ROOT,now=new Date().toISOString()}=options;
 const registry=await readRegistry(sharedRoot),project=await readProject(projectRoot,projectId);
 if(!project)throw fail('Booklet project not found',404);
 if(body.action==='mark-checked'){
  const file=path.join(checkRoot,projectId+'.json'),queue=await readSyncJson(file,null),item=queue?.updates?.find(u=>u.id===body.checkId);
  if(!item)throw fail('Page check not found',404);
  item.status='checked';item.checkedAt=now;await writeTransaction([[file,queue]]);return {status:await sharedStatus(projectId,options)};
 }
 if(body.action==='catch-up'){
  // Studio's automatic catch-up still waits while an import or repair runs here.
  const result=await catchUpProject(projectId,{...options,expectedRevision:body.expectedRevision});
  return {...result,status:await sharedStatus(projectId,options)};
 }
 if(body.action==='offer-add'||body.action==='offer-decline'){
  if(body.expectedRevision!=null&&Number(project.revision)!==Number(body.expectedRevision))throw fail('Booklet changed; save or reload before deciding.',409);
  if(body.action==='offer-add')return {results:await addOffered(projectId,body,options,registry),status:await sharedStatus(projectId,options)};
  const offer=registry.offers?.[key(projectId,body.blockId)];if(!offer)throw fail('This question has no open offer',404);
  Object.assign(offer,{state:'declined',decidedAt:now});await writeTransaction([[registryFile(sharedRoot),registry]]);
  return {status:await sharedStatus(projectId,options)};
 }
 const found=Object.values(registry.groups).flatMap(group=>group.members.filter(m=>m.projectId===projectId&&m.blockId===body.blockId).map(member=>({group,member})))[0];
 if(!found)throw fail('This block is not shared with another booklet',404);
 if(body.expectedRevision!=null&&Number(project.revision)!==Number(body.expectedRevision))throw fail('Booklet changed; save or reload before deciding.',409);
 const {group,member}=found,block=findBlock(project,body.blockId);
 if(!block)throw fail('Shared block not found in the saved booklet; save first',409);
 const hash=blockHash(block),status=memberStatus(member,group,hash);
 if(body.action==='keep-separate'){
  Object.assign(member,{state:'separate',reason:String(body.reason??'').trim(),decidedAt:now});delete member.edit;delete member.adopt;
  await writeTransaction([[registryFile(sharedRoot),registry]]);
  return {status:await sharedStatus(projectId,options)};
 }
 if(body.action==='use-shared'){
  Object.assign(member,{state:'linked',adopt:true});delete member.edit;delete member.reason;delete member.decidedAt;
  await writeTransaction([[registryFile(sharedRoot),registry]]);
  const result=await catchUpProject(projectId,{...options,groupIds:[group.id],force:true});
  return {...result,status:await sharedStatus(projectId,options)};
 }
 if(body.action!=='apply-all')throw fail('Unknown shared-content action');
 if(!['edited','diverged'].includes(status))throw fail(status==='synced'?'This copy already matches the shared version.':'Only an edited copy can be applied to all copies.',409);
 if(status==='edited'&&editBase(member)!==group.current.hash)throw fail('Another copy changed this shared content since this one was edited. Use the shared version, or keep this copy different.',409);
 // Record the new shared version, then catch every other copy up to it.
 const revision={hash,previousHash:group.current.hash,snapshot:structuredClone(block),basePositions:status==='edited'&&member.edit?.basePositions?member.edit.basePositions:null,from:{projectId,blockId:block.id,revision:project.revision},at:now};
 group.current={hash,from:revision.from,at:now};
 Object.assign(member,{state:'linked',syncedHash:hash});delete member.edit;delete member.adopt;
 // Copies that already differed (seeded as diverged) take this version too.
 if(status==='diverged'||group.members.some(m=>m.state==='diverged'))for(const other of group.members)if(other!==member&&other.state==='diverged'){other.state='linked';other.adopt=true;}
 await writeTransaction([[revisionFile(sharedRoot,group.id,hash),revision],[registryFile(sharedRoot),registry]]);
 const results=[];
 for(const other of [...new Set(group.members.filter(m=>m!==member&&m.state!=='separate').map(m=>m.projectId))]){
  const target=await readProject(projectRoot,other);
  const busy=options.busy??busyProjects(target?[target]:[]);
  try{results.push(await catchUpProject(other,{...options,groupIds:[group.id],busy,source:{projectId,blockId:block.id}}));}
  catch(error){results.push({projectId:other,updated:[],errors:[{message:error.message}]});}
 }
 options.onQueued?.(results.filter(r=>r.updated?.length).map(r=>r.projectId));
 return {results,status:await sharedStatus(projectId,options)};
}

// --- status ----------------------------------------------------------------

// Other booklets' copies are read from the hash index (only changed booklets are
// read again), so a status check never loads the whole library.
const indexedHash=(index,projectId,blockId)=>index.projects[projectId]?.blocks.find(b=>b.id===blockId)?.hash??null;
export async function sharedStatus(projectId,{projectRoot=PROJECT_ROOT,sharedRoot=SHARED_ROOT,checkRoot=CHECK_ROOT,indexFile=sharedRootsFor(projectRoot).indexFile}={}){
 const registry=await readRegistry(sharedRoot),project=await readProject(projectRoot,projectId),members=[];
 const {index}=await updateSharedIndex({projectRoot,indexFile});
 for(const group of Object.values(registry.groups)){
  const own=group.members.filter(m=>m.projectId===projectId);if(!own.length)continue;
  const others=[];
  for(const other of group.members){
   if(other.projectId===projectId&&own.includes(other))continue;
   const local=other.projectId===projectId?findBlock(project,other.blockId):null;
   const hash=other.projectId===projectId?(local?blockHash(local):null):indexedHash(index,other.projectId,other.blockId);
   others.push({projectId:other.projectId,title:index.projects[other.projectId]?.title??other.projectId,blockId:other.blockId,status:memberStatus(other,group,hash),reason:other.reason??''});
  }
  for(const member of own){
   const block=findBlock(project,member.blockId),status=memberStatus(member,group,block?blockHash(block):null);
   members.push({groupId:group.id,blockId:member.blockId,status,reason:member.reason??'',stale:status==='edited'&&editBase(member)!==group.current.hash,current:group.current.from,others});
  }
 }
 const offers=[];
 for(const offer of Object.values(registry.offers??{})){
  if(offer.projectId!==projectId||offer.state!=='pending')continue;
  const block=findBlock(project,offer.blockId),targets=block?offerTargets(project,offer.blockId,registry,index):[];
  if(targets.length)offers.push({blockId:offer.blockId,excerpt:excerpt(block),targets});
 }
 const queue=await readSyncJson(path.join(checkRoot,projectId+'.json'),null);
 return {projectId,revision:Number(project?.revision)||0,members,offers,checks:(queue?.updates??[]).filter(u=>u.status!=='checked')};
}

// --- page checks -----------------------------------------------------------

const answers=block=>{const found=[];walk(block,node=>{if(node.answer!==undefined)found.push(node.answer);});return JSON.stringify(found);};
// Queue a moved-page check. One batch per booklet: its baseline is the version
// before the first update not yet checked, and its candidate the latest update.
async function queuePageCheck(previous,project,updated,{checkRoot,source,now}){
 const dir=path.join(checkRoot,project.id),file=path.join(checkRoot,project.id+'.json');
 const queue=await readSyncJson(file,null)??{projectId:project.id,updates:[]};
 const open=queue.updates.filter(u=>u.status==='queued');
 const before=open[0]?.beforeFile??path.join(dir,'before-r'+previous.revision+'.json'),after=path.join(dir,'after-r'+project.revision+'.json');
 // A new or changed question with answers moves the answer editions too.
 const editions=new Set(['student']);for(const item of updated)if(item.after.type==='question'&&(!item.before||answers(item.before)!==answers(item.after))){editions.add('short');editions.add('worked');}
 for(const item of updated)queue.updates.push({id:'c-'+sha([project.id,item.blockId,project.revision,now]).slice(0,16),groupId:item.groupId,blockId:item.blockId,...(item.before?{}:{added:true}),from:source??item.from??null,appliedAt:now,revision:project.revision,editions:[...editions],status:'queued',beforeFile:before,afterFile:after});
 for(const u of queue.updates)if(u.status==='queued'){u.afterFile=after;u.editions=[...new Set([...u.editions,...editions])];}
 const entries=[[file,queue],[after,project]];if(!open.length)entries.push([before,previous]);
 return entries;
}

// Compare page maps: pages holding an updated block, pages whose blocks moved,
// and whether the page count (so every footer and the contents) changed.
export function comparePageMaps(before,after,blockIds){
 const ids=new Set(blockIds),list=page=>(page?.blocks??[]).join(',');
 const changed=after.filter(page=>(page.blocks??[]).some(id=>ids.has(id))).map(page=>page.page);
 const moved=after.filter(page=>!changed.includes(page.page)&&list(page)!==list(before[page.page-1])).map(page=>page.page);
 const restyled=after.filter(page=>!changed.includes(page.page)&&!moved.includes(page.page)&&page.hash!==before[page.page-1]?.hash).map(page=>page.page);
 return {pagesBefore:before.length,pagesAfter:after.length,pageCountChanged:before.length!==after.length,changed,moved,otherChanged:restyled.length};
}

// Run queued checks for one booklet until none remain. One runner per booklet.
export async function runPageChecks(projectId,{checkRoot=CHECK_ROOT,base='http://127.0.0.1:5173',render=null}={}){
 const lock=path.join(checkRoot,projectId+'.lock');
 await fs.mkdir(checkRoot,{recursive:true});
 let fd;try{fd=fsSync.openSync(lock,'wx');fsSync.writeSync(fd,String(process.pid));fsSync.closeSync(fd);}
 catch(error){
  if(error.code!=='EEXIST'&&error.code!=='EPERM')throw error;
  const pid=Number(fsSync.readFileSync(lock,'utf8'));let alive=false;try{process.kill(pid,0);alive=true;}catch(e){alive=e.code==='EPERM';}
  if(alive)return {projectId,skipped:'running'};
  fsSync.writeFileSync(lock,String(process.pid));
 }
 const file=path.join(checkRoot,projectId+'.json'),done=[];
 try{
  if(!render)throw Error('runPageChecks needs a page-map renderer (shared-content-pages.mjs supplies it)');
  for(let round=0;round<20;round++){
   const queue=await readSyncJson(file,null),batch=queue?.updates?.filter(u=>u.status==='queued')??[];
   if(!batch.length)break;
   const {beforeFile,afterFile}=batch.at(-1),editions=[...new Set(batch.flatMap(u=>u.editions))];
   for(const u of batch)u.status='checking';await writeTransaction([[file,queue]]);
   let results,failure=null;
   try{
    const read=f=>JSON.parse(fsSync.readFileSync(f,'utf8'));
    const maps=await render({base,before:read(batch[0].beforeFile),after:read(afterFile),editions});
    results=Object.fromEntries(editions.map(edition=>[edition,comparePageMaps(maps.before[edition],maps.after[edition],batch.map(u=>u.blockId))]));
   }catch(error){failure=error.message;}
   const latest=await readSyncJson(file,queue);
   for(const u of latest.updates)if(batch.some(b=>b.id===u.id)){u.status=failure?'failed':'ready';u.checkedAt=new Date().toISOString();if(failure)u.error=failure;else u.result=results;}
   await writeTransaction([[file,latest]]);
   if(!failure)for(const f of new Set([batch[0].beforeFile,afterFile]))if(!latest.updates.some(u=>u.status==='queued'&&(u.beforeFile===f||u.afterFile===f)))await fs.rm(f,{force:true});
   done.push(...batch.map(u=>u.id));
  }
 }finally{await fs.rm(lock,{force:true});}
 return {projectId,checked:done};
}

// Start background runners without waiting for them (Studio save path). The
// runner is its own entry point: the Studio server, which Vite bundles with its
// config, never imports the headless-browser code.
export function startPageChecks(projectIds,{base}={}){
 const runner=path.join(path.dirname(fileURLToPath(import.meta.url)),'shared-content-pages.mjs');
 for(const id of projectIds){
  const child=spawn(process.execPath,[runner,'--project',id,...(base?['--base',base]:[])],{cwd:ROOT,detached:true,stdio:'ignore',windowsHide:true});
  child.unref();
 }
}

// --- registry refresh --------------------------------------------------------

// A hash index of every booklet's blocks, kept beside the run work. Only booklets
// whose file changed since the last refresh are read again, so the registry can
// follow imports, repairs and Studio edits without reading the whole library.
async function readFresh(file){return JSON.parse((await fs.readFile(file,'utf8')).replace(/^﻿/,''));}
function indexEntry(project,stat){
 const blocks=[],sections={};
 for(const section of project.sections??[]){
  if(section.phase==='front-matter')continue;
  sections[section.id]=section.title??'';
  for(const block of section.blocks??[]){
   if(!block?.id||block.type==='page-break')continue;
   const reuse=block.sourceReview?.reuse;
   blocks.push({id:block.id,type:block.type,sectionId:section.id,hash:blockHash(block),substantive:substantive(block),...(reuse?.projectId&&reuse.blockId?{reuse:[reuse.projectId,reuse.blockId]}:{})});
  }
 }
 return {mtimeMs:stat.mtimeMs,size:stat.size,version:Number(project.version)||0,revision:project.revision??null,title:project.title??project.id,classCopy:isClassCopy(project),sections,blocks};
}
const indexes=new Map(),dirtyIndexes=new Set();
export async function updateSharedIndex({projectRoot=PROJECT_ROOT,indexFile=sharedRootsFor(projectRoot).indexFile}={}){
 const index=indexes.get(indexFile)??await readSyncJson(indexFile,null)??{format:'mathsmap-shared-index-v1',projects:{}},ids=await projectIds(projectRoot),changed=[];
 indexes.set(indexFile,index);
 for(const id of ids){
  const file=path.join(projectRoot,id+'.json');let stat;try{stat=await fs.stat(file);}catch{continue;}
  const old=index.projects[id];if(old&&old.mtimeMs===stat.mtimeMs&&old.size===stat.size)continue;
  try{const project=await readFresh(file);index.projects[id]=project?.sections?indexEntry(project,stat):{mtimeMs:stat.mtimeMs,size:stat.size,version:0,blocks:[]};changed.push(id);}
  catch{/* A file being written: read it on the next refresh. */}
 }
 for(const id of Object.keys(index.projects))if(!ids.includes(id)){delete index.projects[id];changed.push(id);}
 if(changed.length)dirtyIndexes.add(indexFile);
 return {index,changed,indexFile};
}

// Bring the registry up to date with the library: link import reuse copies and
// identical blocks in different booklets, and forget copies that were deleted.
// Additive for everything else: existing groups and decisions are kept, and no
// booklet is edited. Class copies are left out unless asked for.
export async function refreshSharedRegistry({projectRoot=PROJECT_ROOT,sharedRoot=sharedRootsFor(projectRoot).sharedRoot,indexFile=sharedRootsFor(projectRoot).indexFile,apply=false,includeClassCopies=false,now=new Date().toISOString()}={}){
 const {index,changed}=await updateSharedIndex({projectRoot,indexFile});
 const registry=await readRegistry(sharedRoot),members=memberIndex(registry),entries=new Map();
 const report={changedBooklets:changed.length,groupsCreated:0,membersAdded:0,membersRemoved:0,diverged:[],ambiguous:[],groups:[]},writes=[];
 for(const [projectId,project] of Object.entries(index.projects)){
  if(project.version!==4||(!includeClassCopies&&project.classCopy))continue;
  for(const block of project.blocks)entries.set(key(projectId,block.id),{projectId,...block});
 }
 // Forget copies whose block or booklet is gone.
 for(const group of Object.values(registry.groups)){
  const kept=group.members.filter(m=>{const project=index.projects[m.projectId];return project&&(project.version!==4||project.blocks.some(b=>b.id===m.blockId));});
  if(kept.length!==group.members.length){report.membersRemoved+=group.members.length-kept.length;group.members=kept;}
  if(group.members.length<2){delete registry.groups[group.id];report.membersRemoved+=group.members.length;}
 }
 for(const [offerKey,offer] of Object.entries(registry.offers??{}))if(!entries.has(key(offer.projectId,offer.blockId))&&index.projects[offer.projectId]?.version===4)delete registry.offers[offerKey];
 const current=memberIndex(registry);
 const parent=new Map(),find=k=>{while(parent.get(k)!==k){parent.set(k,parent.get(parent.get(k)));k=parent.get(k);}return k;};
 const union=(a,b)=>{for(const k of [a,b])if(!parent.has(k))parent.set(k,k);parent.set(find(a),find(b));};
 const sources=new Set();
 for(const [k,entry] of entries){
  const target=entry.reuse?key(...entry.reuse):null;
  if(target&&entries.has(target)&&target!==k){union(k,target);sources.add(target);}
 }
 const byHash=new Map();
 for(const [k,entry] of entries){if(!entry.substantive)continue;if(!byHash.has(entry.hash))byHash.set(entry.hash,[]);byHash.get(entry.hash).push(k);}
 for(const keys of byHash.values())if(new Set(keys.map(k=>entries.get(k).projectId)).size>1)for(const k of keys.slice(1))union(keys[0],k);
 const components=new Map();for(const k of parent.keys()){const r=find(k);if(!components.has(r))components.set(r,[]);components.get(r).push(k);}
 for(const keys of components.values()){
  if(keys.length<2||keys.every(k=>current.has(k)))continue;
  const existing=[...new Set(keys.map(k=>current.get(k)?.group).filter(Boolean))];
  if(existing.length>1){report.ambiguous.push(keys.map(k=>k.replace('\0','/')));continue;}
  let group=existing[0];
  if(!group){
   // The shared version: the content most copies hold, preferring reuse sources.
   const score=new Map();for(const k of keys){const h=entries.get(k).hash;score.set(h,(score.get(h)??0)+1+(sources.has(k)?0.5:0));}
   const hash=[...score].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
   const owner=entries.get(keys.filter(k=>entries.get(k).hash===hash).sort((a,b)=>Number(sources.has(b))-Number(sources.has(a))||a.localeCompare(b))[0]);
   const block=findBlock(await readProject(projectRoot,owner.projectId),owner.id);
   if(!block||blockHash(block)!==hash)continue; // Changed while refreshing: next refresh.
   group={id:groupId(owner.projectId,owner.id),current:{hash,from:{projectId:owner.projectId,blockId:owner.id,revision:index.projects[owner.projectId].revision},at:now},members:[],createdAt:now};
   registry.groups[group.id]=group;report.groupsCreated++;
   writes.push([revisionFile(sharedRoot,group.id,hash),{hash,previousHash:null,snapshot:block,basePositions:null,from:group.current.from,at:now}]);
  }
  for(const k of keys){
   if(current.has(k))continue;
   const entry=entries.get(k),same=entry.hash===group.current.hash;
   // One copy per booklet unless import reuse says otherwise: a question
   // duplicated within a booklet is usually the start of a variant.
   if(!entry.reuse&&group.members.some(m=>m.projectId===entry.projectId))continue;
   group.members.push({projectId:entry.projectId,blockId:entry.id,state:same?'linked':'diverged',syncedHash:same?entry.hash:null,linkedAt:now,via:'refresh'});
   current.set(k,{group});report.membersAdded++;
   if(!same)report.diverged.push({groupId:group.id,projectId:entry.projectId,blockId:entry.id,sharedWith:group.current.from});
  }
  report.groups.push({id:group.id,type:entries.get(keys[0]).type,members:group.members.map(m=>m.projectId+'/'+m.blockId)});
 }
 if(apply){
  const registryChanged=report.groupsCreated||report.membersAdded||report.membersRemoved;
  await writeTransaction([...writes,...(registryChanged?[[registryFile(sharedRoot),registry]]:[]),...(dirtyIndexes.has(indexFile)?[[indexFile,index]]:[])]);
  dirtyIndexes.delete(indexFile);
 }
 return report;
}
// The original name of the first full refresh.
export const seedSharedContent=refreshSharedRegistry;

// Studio runs refreshes in the background: after saves and decisions, and when
// a booklet asks for its status and the last refresh is over a minute old.
const refreshers=new Map();
export function scheduleSharedRefresh(options={},{delayMs=3000}={}){
 const projectRoot=path.resolve(options.projectRoot??PROJECT_ROOT),state=refreshers.get(projectRoot)??{timer:null,running:null,last:0};refreshers.set(projectRoot,state);
 clearTimeout(state.timer);
 state.timer=setTimeout(()=>{state.timer=null;state.running=(state.running??Promise.resolve()).then(()=>withBankLock(()=>refreshSharedRegistry({...options,apply:true}))).then(()=>{state.last=Date.now();},error=>console.warn('Shared content refresh deferred:',error.message));},delayMs);
 state.timer.unref?.();
}
export function refreshIfStale(options={},{maxAgeMs=60000}={}){
 const state=refreshers.get(path.resolve(options.projectRoot??PROJECT_ROOT));
 if(!state||(!state.timer&&Date.now()-state.last>maxAgeMs))scheduleSharedRefresh(options,{delayMs:0});
}

// --- library report --------------------------------------------------------

export async function sharedReport({projectRoot=PROJECT_ROOT,sharedRoot=SHARED_ROOT,checkRoot=CHECK_ROOT,indexFile=sharedRootsFor(projectRoot).indexFile,projectId=null}={}){
 const registry=await readRegistry(sharedRoot),rows=[],{index}=await updateSharedIndex({projectRoot,indexFile});
 for(const group of Object.values(registry.groups)){
  if(projectId&&!group.members.some(m=>m.projectId===projectId))continue;
  const members=group.members.map(member=>({projectId:member.projectId,blockId:member.blockId,status:memberStatus(member,group,indexedHash(index,member.projectId,member.blockId)),reason:member.reason??''}));
  rows.push({groupId:group.id,current:group.current.from,members});
 }
 const counts={};for(const m of rows.flatMap(r=>r.members))counts[m.status]=(counts[m.status]??0)+1;
 const checks=[];for(const name of (await fs.readdir(checkRoot).catch(()=>[])).filter(n=>n.endsWith('.json'))){const queue=await readSyncJson(path.join(checkRoot,name),null);for(const u of queue?.updates??[])if(u.status!=='checked'&&(!projectId||queue.projectId===projectId))checks.push({projectId:queue.projectId,...u});}
 return {groups:rows.length,counts,attention:rows.filter(r=>r.members.some(m=>['edited','diverged','behind','missing'].includes(m.status))),checks,rows};
}

// --- CLI -------------------------------------------------------------------

async function cli(){
 const args=process.argv.slice(2),command=args[0],arg=(name,fallback=null)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];},flag=name=>args.includes(name);
 const projectRoot=path.resolve(arg('--projects',PROJECT_ROOT)),roots=sharedRootsFor(projectRoot);
 const options={projectRoot,sharedRoot:path.resolve(arg('--shared',roots.sharedRoot)),checkRoot:path.resolve(arg('--checks',roots.checkRoot))};
 const print=value=>console.log(JSON.stringify(value,null,flag('--json')?0:2));
 if(command==='seed'||command==='refresh'){
  const report=await refreshSharedRegistry({...options,apply:flag('--apply'),includeClassCopies:flag('--include-class-copies')});
  if(flag('--json'))return print(report);
  console.log(`${flag('--apply')?'Registry updated':'Preview (nothing written; add --apply)'}: ${report.changedBooklets} booklets read, ${report.groupsCreated} new groups, ${report.membersAdded} copies linked, ${report.membersRemoved} removed, ${report.diverged.length} copies that already differ, ${report.ambiguous.length} ambiguous.`);
  for(const d of report.diverged)console.log(`  differs: ${d.projectId}/${d.blockId} (shared version in ${d.sharedWith.projectId}/${d.sharedWith.blockId})`);
  return;
 }
 if(command==='report'){
  const report=await sharedReport({...options,projectId:arg('--project')});
  if(flag('--json'))return print(report);
  console.log(`${report.groups} shared groups. Copies: ${Object.entries(report.counts).map(([k,v])=>v+' '+k).join(', ')||'none'}.`);
  for(const row of report.attention)for(const m of row.members.filter(m=>m.status!=='synced'&&m.status!=='separate'))console.log(`  ${m.status}: ${m.projectId}/${m.blockId} (group ${row.groupId})`);
  for(const c of report.checks)console.log(`  pages to check: ${c.projectId} ${c.blockId} ${c.status}${c.result?' '+Object.entries(c.result).map(([e,r])=>`${e}: changed ${r.changed.join(',')||'-'}, moved ${r.moved.join(',')||'none'}${r.pageCountChanged?`, page count ${r.pagesBefore}→${r.pagesAfter}`:''}`).join('; '):''}`);
  return;
 }
 const {prepareProjectWrite}=await import('./project-studio-server.mjs');
 const bankRoot=arg('--bank')?path.resolve(arg('--bank')):undefined;
 const write={...options,prepareWrite:(previous,next)=>prepareProjectWrite(previous,next,{projectRoot:options.projectRoot,...(bankRoot?{bankRoot}:{})})};
 if(command==='decide'){
  const action=flag('--apply-all')?'apply-all':flag('--keep-separate')?'keep-separate':flag('--use-shared')?'use-shared':null;
  if(!action)throw Error('decide needs --apply-all, --keep-separate or --use-shared');
  const result=await resolveShared(arg('--project'),{action,blockId:arg('--block'),reason:arg('--reason','')},write);
  print({results:result.results?.map(r=>({projectId:r.projectId,updated:r.updated?.length??0,skipped:r.skipped,errors:r.errors})),status:result.status.members.find(m=>m.blockId===arg('--block'))});
  return;
 }
 if(command==='apply-pending'){
  const ids=arg('--project')?[arg('--project')]:[...new Set(Object.values((await readRegistry(options.sharedRoot)).groups).flatMap(g=>g.members.map(m=>m.projectId)))];
  const results=[];for(const id of ids)results.push(await withBankLock(()=>catchUpProject(id,write)));
  print(results.map(r=>({projectId:r.projectId,updated:r.updated.length,skipped:r.skipped,errors:r.errors})));
  return;
 }
 throw Error('Commands: refresh [--apply] [--include-class-copies] (alias seed), report [--project ID], decide --project ID --block ID --apply-all|--keep-separate|--use-shared [--reason TEXT], apply-pending [--project ID]. Page checks: node scripts/booklet/shared-content-pages.mjs --project ID [--base URL]');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await cli().catch(error=>{console.error(error.message);process.exitCode=1;});
