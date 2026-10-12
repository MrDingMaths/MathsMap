// Stable source identity is separate from the latest editable/audited version.
// These references never grant mathematical acceptance.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sourceCache=new Map();let cachedBytes=0;
function snapshot(file){
 const stat=fs.statSync(file),stamp=stat.mtimeMs+':'+stat.ctimeMs+':'+stat.size,old=sourceCache.get(file);
 if(old?.stamp===stamp){sourceCache.delete(file);sourceCache.set(file,old);return old;}
 if(old){sourceCache.delete(file);cachedBytes-=old.byteLength;}
 const bytes=fs.readFileSync(file),value={stamp,byteLength:bytes.length,hash:digest(bytes),value:JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''))};
 if(bytes.length<=64*1024*1024){
  sourceCache.set(file,value);cachedBytes+=bytes.length;
  while(sourceCache.size>96||cachedBytes>64*1024*1024){const first=sourceCache.keys().next().value;cachedBytes-=sourceCache.get(first).byteLength;sourceCache.delete(first);}
 }
 return value;
}
const read=file=>snapshot(file).value;
const digest=value=>createHash('sha256').update(value).digest('hex');
const blocks=p=>(p.sections??[]).flatMap(s=>s.blocks??[]);
const safeId=id=>typeof id==='string'&&path.basename(id)===id&&!['.','..'].includes(id);
export function originalSource(block,{runDir,projectId}={}){
 if(!runDir)return null;
 const origin=block.sourceReview?.origin;
 if(origin&&safeId(origin.runId)){
  const root=path.resolve(runDir,'../../..'),priorDir=path.join(root,'.booklet-work/full-imports',origin.runId);
  const tableFile=path.join(priorDir,'lean-review/reviewed.json');
  try{
   const version=read(tableFile).questions?.[origin.blockId]?.acceptedVersion;
   const original=version?.original??version?.snapshot;
   if(original&&version.originalHash===digest(JSON.stringify(original))&&version.origin?.hash===origin.hash)return {block:original,origin,files:[tableFile]};
  }catch{}
  if(typeof origin.artifact?.path==='string'&&typeof origin.artifact.hash==='string'){
   const file=path.resolve(origin.artifact.path),relative=path.relative(path.join(priorDir,'semantic-packets'),file);
   if(relative.startsWith('..')||path.isAbsolute(relative))return null;
   try{if(snapshot(file).hash!==origin.artifact.hash)return null;const found=blocks(read(file)).find(b=>b.id===origin.blockId);if(found)return {block:found,origin,files:[file]};}catch{}
  }
  return null; // Never replace a missing bound origin with an unrelated current page.
 }
 const pages=[...new Set([block.sourcePageNumber,...(block.sourceRefs??[]).map(r=>r.pageNumber)].filter(Number.isInteger))];
 for(const page of pages){
  const file=path.join(runDir,'semantic-packets','page-'+String(page).padStart(3,'0')+'.author.json');
  try{
   const found=blocks(read(file)).find(b=>b.id===block.id);
   if(found)return {block:found,origin:{projectId,blockId:block.id,runId:path.basename(runDir),artifact:{path:file,hash:snapshot(file).hash}},files:[file]};
  }catch{}
 }
 return null;
}
export function preserveSourceLineage(previous,project,{runDir}={}){
 if(!previous)return project;
 const old=new Map(blocks(previous).map(b=>[b.id,b]));
 for(const section of project.sections??[]){let anchor;
  for(const block of section.blocks??[]){
   const prior=old.get(block.id);
   if(block.sourceReview?.additionTo&&!block.sourceReview.additionTo.projectId)block.sourceReview.additionTo.projectId=project.id;
   if(prior){
    // Preserve lineage when an editor reconstructs sourceReview on save.
    if(prior.sourceReview?.origin){block.sourceReview??={};block.sourceReview.origin=structuredClone(prior.sourceReview.origin);}
    if(prior.sourceReview?.additionTo){block.sourceReview??={};block.sourceReview.additionTo=structuredClone(prior.sourceReview.additionTo);}
    if(!block.sourceReview?.additionTo){anchor=block;}
   }else if(anchor&&!block.sourceReview?.additionTo){
    block.sourceReview??={};block.sourceReview.additionTo={projectId:project.id,blockId:anchor.id};
   }
   if(prior&&!block.sourceReview?.origin&&runDir&&JSON.stringify(prior)!==JSON.stringify(block)){
    const source=originalSource(prior,{runDir,projectId:project.id});
    if(source){block.sourceReview??={};block.sourceReview.origin=source.origin;}
   }
  }
 }
 return project;
}
export function attachedAdditions(project,anchor,{originalIds=new Set()}={}){
 const section=(project.sections??[]).find(s=>(s.blocks??[]).some(b=>b.id===anchor.id));
 if(!section)return [];
 const result=[];let owner;
 for(const block of section.blocks??[]){
  const explicit=block.sourceReview?.additionTo;
  if(explicit){if((!explicit.projectId||explicit.projectId===project.id)&&explicit.blockId===anchor.id)result.push(block);continue;}
  if(originalIds.has(block.id)){owner=block.id;continue;}
  // Earlier saved additions may not have lineage yet: only source-free adjacent
  // blocks attach; blocks with their own source pages are never guessed.
  if(owner===anchor.id&&!block.sourceRefs?.length&&!block.sourcePageNumber)result.push(block);
 }
 return result;
}
