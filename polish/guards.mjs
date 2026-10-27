// Save invariants shared by the polish driver and its layout trials. Pure/browser-safe.
import {isPractice} from '../src/lib/booklet-flow.js';
import {bandIndex,reasoningScore} from '../src/lib/booklet-pagination-metrics.js';
import {allowanceCopies,importedAllowance,stillImportAllowance,workingSpaceFloor} from '../src/lib/booklet-working-space.js';
import {automatedRepair} from '../src/lib/booklet-import-spacing.js';

const blocksOf=p=>(p.sections??[]).flatMap(s=>s.blocks??[]);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function nodesOf(value){
 const found=[];
 const walk=n=>{if(!n||typeof n!=='object')return;if(n.id)found.push(n);for(const [key,v] of Object.entries(n))if(key!=='sourceReview'&&v&&typeof v==='object'){if(Array.isArray(v))v.flat().forEach(walk);else walk(v);}};
 walk(value);return found;
}
export const teacherFlags=p=>(p.studio?.flags??[]).filter(f=>!f.kind&&f.at);
export function teacherBlocks(project){
 const owners=new Map(blocksOf(project).flatMap(b=>nodesOf(b).map(n=>[n.id,b.id]))),found=new Set();
 // Open requests still need repair. Resolved decisions and authorised repairs stay protected.
 for(const flag of teacherFlags(project).filter(f=>f.resolved))for(const id of [flag.targetId,flag.anchor?.rootId])if(owners.has(id))found.add(owners.get(id));
 for(const b of blocksOf(project))if(b.sourceReview?.authorisedFeedback||(b.sourceReview?.feedbackRepairs??[]).some(e=>!automatedRepair(e)))found.add(b.id);
 return found;
}
const keyedSettings=(settings,ids)=>{
 const result=[];
 const walk=(v,path)=>{if(!v||typeof v!=='object')return;for(const [k,child] of Object.entries(v)){const next=path+'/'+k;if(ids.has(k))result.push([next,child]);else walk(child,next);}};
 walk(settings,'');return result;
};
const references=n=>[...(n.dependsOn??[]),...(n.flow?.dependsOn??[]),n.pairedBlockId,n.flow?.continuationOf,n.continuationOf].filter(Boolean);

// Layout may add constraints, but cannot erase an existing link or suppress a response label.
export function layoutSafetyIssues(before,after){
 const issues=[],next=new Map(nodesOf(after).map(n=>[n.id,n]));
 for(const old of nodesOf(before)){
  const n=next.get(old.id);
  if(references(old).some(id=>!n||!references(n).includes(id))||old.flow?.keepWithNext&&!n?.flow?.keepWithNext)issues.push('lost dependency on '+old.id);
  if(old.flow?.exercisePageBreakBefore!==false&&n?.flow?.exercisePageBreakBefore===false)issues.push('removed exercise break on '+old.id);
  if(isPractice(before)){
   if(old.type==='part'&&!n||n&&(old.label!==''&&n.label===''||String(old.label??'').trim()&&!String(n.label??'').trim()||old.unlabelled!==true&&n.unlabelled===true||String(old.responseLabel??'').trim()&&!String(n.responseLabel??'').trim()))issues.push('lost part label on '+old.id);
  }
 }
 if(isPractice(before)){
  if(before.presentation?.showLabels!==false&&after.presentation?.showLabels===false)issues.push('suppressed practice labels on '+before.id);
  for(const edition of ['short','worked'])for(const [id,label] of Object.entries(after.presentation?.answerPartLabels?.[edition]??{}))if(id!==before.content?.id&&label===''&&before.presentation?.answerPartLabels?.[edition]?.[id]!=='')issues.push('suppressed answer label on '+id);
  if(before.presentation?.sourceResponseLabels!==true&&after.presentation?.sourceResponseLabels===true&&(after.sourceReview?.responses??[]).some(r=>r.label===''))issues.push('suppressed source response labels on '+before.id);
  for(const r of before.sourceReview?.responses??[]){const n=after.sourceReview?.responses?.find(x=>x.targetId===r.targetId);if(String(r.label??'').trim()&&!String(n?.label??'').trim())issues.push('lost response label on '+r.targetId);}
 }
 return issues;
}

// Full-project guard, also used immediately before the revision-checked live save.
// `reference` is the run's immutable input, so an earlier calibration never makes a teacher edit look imported.
export function polishSafetyIssues(before,after,{reference=before,imported=null,protectedIds=teacherBlocks(reference),spacing=true}={}){
 const issues=[],oldBlocks=blocksOf(before),newBlocks=blocksOf(after),nextBlocks=new Map(newBlocks.map(b=>[b.id,b])),nextNodes=new Map(newBlocks.flatMap(b=>nodesOf(b).map(n=>[n.id,{node:n,block:b}]))),beforeIds=new Set(oldBlocks.flatMap(b=>nodesOf(b).map(n=>n.id)));
 const referenceBlocks=new Map(blocksOf(reference).map(b=>[b.id,b]));
 const oldFlags=new Map((after.studio?.flags??[]).map(f=>[f.id,f]));
 for(const flag of teacherFlags(reference))if(!equal(flag,oldFlags.get(flag.id)))issues.push('changed teacher comment '+flag.id);
 for(const id of protectedIds){
  const old=referenceBlocks.get(id),n=nextBlocks.get(id);if(!old)continue;
  if(!equal(old,n))issues.push('changed teacher block '+id);
  const ids=new Set(nodesOf(old).map(n=>n.id));
  if(!equal(keyedSettings(reference.settings,ids),keyedSettings(after.settings,ids)))issues.push('changed teacher layout '+id);
 }
 for(const block of oldBlocks){
  const now=nextBlocks.get(block.id);
  for(const old of nodesOf(block)){
   const n=nextNodes.get(old.id)?.node;
   if(references(old).some(id=>!n||!references(n).includes(id)||beforeIds.has(id)&&!nextNodes.has(id))||old.flow?.keepWithNext&&!n?.flow?.keepWithNext)issues.push('lost dependency on '+old.id);
   // An implicit exercise break is just as binding as an explicit true.
   if(n&&old.flow?.exercisePageBreakBefore!==false&&n.flow?.exercisePageBreakBefore===false)issues.push('removed exercise break on '+old.id);
  }
  if(spacing)for(const node of nodesOf(block).filter(n=>Number.isFinite(n.answerSpaceMm)||n.answer)){
   const original=referenceBlocks.get(block.id),source=original&&nodesOf(original).find(n=>n.id===node.id),n=now&&nodesOf(now).find(n=>n.id===node.id);
   if(!source)continue;
   const copies=allowanceCopies(reference,original,source);if(!copies.length)continue;
   const importedBlock=imported&&blocksOf(imported).find(b=>b.id===block.id),importedNode=importedBlock&&nodesOf(importedBlock).find(n=>n.id===node.id);
   const estimate=importedAllowance(original,node.id)??(importedNode?imported.settings?.layoutOverrides?.answerSpaces?.[node.id]??importedNode.answerSpaceMm:undefined);
   const protectedSpace=!stillImportAllowance(copies,estimate),afterCopies=n?allowanceCopies(after,now,n):[];
   if(n)for(const [key,value]of afterCopies){
    const previous=allowanceCopies(before,block,node).find(([k])=>k===key)?.[1];
    if(Number.isFinite(previous)&&value<previous&&value+0.01<workingSpaceFloor(now,n,{reviewed:teacherFlags(reference).some(f=>f.resolved)}))issues.push('working space below its floor '+node.id);
   }
   if(protectedSpace&&!equal(copies,afterCopies))issues.push('changed teacher/unknown working space '+node.id);
   if(teacherFlags(reference).length&&afterCopies.some(([key,value])=>{const previous=allowanceCopies(before,block,node).find(([k])=>k===key)?.[1];return Number.isFinite(previous)&&value>previous+0.01;}))issues.push('increased reviewed working space '+node.id);
  }
 }
 // Preserve every existing exercise start, even when a content operation removes its first question.
 const practices=p=>(p.sections??[]).filter(s=>s.phase==='practice'&&s.role!=='candidate-pool'&&s.blocks?.length);
 const starts=p=>{const seen=new Set(),out=[];for(const s of practices(p))if(!seen.has(s.topicId)){seen.add(s.topicId);out.push(s);}return out;};
 const nextStarts=starts(after),afterStarts=new Map(nextStarts.map(s=>[s.topicId,s])),afterStartsById=new Map(nextStarts.map(s=>[s.id,s])),afterPracticeById=new Map(practices(after).map(s=>[s.id,s]));
 // A corrected topic identifier does not remove the same physical exercise start.
 // A later section can retain that boundary through its explicit native page break.
 for(const s of starts(before))if(s.blocks[0].flow?.exercisePageBreakBefore!==false){const same=afterPracticeById.get(s.id),retained=same?.blocks[0].id===s.blocks[0].id&&(afterStartsById.has(s.id)||same.blocks[0].flow?.pageBreakBefore===true),n=retained?same:afterStarts.get(s.topicId);if(!n||n.blocks[0].flow?.exercisePageBreakBefore===false)issues.push('removed exercise boundary '+s.id);}
 const oldOrder=new Map(oldBlocks.map((b,i)=>[b.id,i])),newOrder=new Map(newBlocks.map((b,i)=>[b.id,i]));
 for(let i=0;i<oldBlocks.length;i++)for(let j=i+1;j<oldBlocks.length;j++){
  const a=oldBlocks[i],b=oldBlocks[j];if(!isPractice(a)||!isPractice(b)||!newOrder.has(a.id)||!newOrder.has(b.id)||newOrder.get(a.id)<newOrder.get(b.id))continue;
  const x=bandIndex(reasoningScore(a)),y=bandIndex(reasoningScore(b));if(x==null||y==null||Math.abs(x-y)>1)issues.push('reordered outside one difficulty band '+a.id+'/'+b.id);
 }
 // Preserve relative order and adjacency of linked groups, including links added during this run.
 for(const b of [...oldBlocks,...newBlocks])for(const n of nodesOf(b))for(const ref of references(n)){
  const owner=oldBlocks.find(b=>nodesOf(b).some(n=>n.id===ref));if(!owner||owner.id===b.id)continue;
  if(!newOrder.has(owner.id)||!newOrder.has(b.id)||(oldOrder.get(owner.id)<oldOrder.get(b.id))!==(newOrder.get(owner.id)<newOrder.get(b.id)))issues.push('reordered dependency '+b.id+'/'+ref);
 }
 for(let i=0;i<oldBlocks.length-1;i++)if(oldBlocks[i].flow?.keepWithNext||oldBlocks[i].pairedBlockId&&oldBlocks[i].pairedBlockId===oldBlocks[i+1].id){const a=newOrder.get(oldBlocks[i].id),b=newOrder.get(oldBlocks[i+1].id);if(a==null||b!==a+1)issues.push('separated linked blocks '+oldBlocks[i].id);}
 return [...new Set(issues)];
}
export function assertPolishSafety(before,after,options){const issues=polishSafetyIssues(before,after,options);if(issues.length)throw Error('Polish safety guard: '+issues.join('; '));}
