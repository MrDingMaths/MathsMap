// Snapshot-local source delivery. Pixels remain authoritative; text is a supplement.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {questionReviewContent} from './lean-profile.mjs';

const pagesOf=node=>[...new Set([node.sourcePageNumber,...(node.sourceRefs??[]).map(r=>r.pageNumber),...(node.sourceReview?.sourcePages??[])].filter(Number.isInteger))];
function nodeIds(value,ids=new Set()){
 if(!value||typeof value!=='object')return ids;
 if(value.id)ids.add(value.id);
 for(const [key,child] of Object.entries(value))if(!['sourceAtom','sourceReview'].includes(key)&&child&&typeof child==='object')nodeIds(child,ids);
 return ids;
}
export function assessmentSourceContext({project,questions,teaching,views,runDir,cache=new Map()}){
 const delivered=nodeIds([...questions,...(teaching?.teaching??[])]),sourceTexts=[],siblingContext=[];
 for(const view of views??[{project,questions,runDir}]){
  const pages=new Set(view.questions.flatMap(pagesOf)),book=view.project??project;
  for(const page of [...pages].sort((a,b)=>a-b)){
   const file=path.resolve(view.runDir,'evidence/pages',`page-${String(page).padStart(3,'0')}.txt`);
   if(!cache.has(file)){
    const bytes=fs.existsSync(file)?fs.readFileSync(file):null;
    cache.set(file,bytes?{page,text:bytes.toString('utf8'),artifact:{path:file,hash:createHash('sha256').update(bytes).digest('hex')}}:null);
   }
   const value=cache.get(file);if(value)sourceTexts.push({...value,...(view.runId?{runId:view.runId}:{})});
  }
  for(const section of book.sections??[])if(section.phase==='teaching')for(const block of section.blocks??[]){
   if(delivered.has(block.id)||block.type==='question'||!pagesOf(block).some(page=>pages.has(page)))continue;
   siblingContext.push({id:block.id,sourceRefs:block.sourceRefs,content:questionReviewContent(block),...(view.runId?{runId:view.runId}:{})});
   nodeIds(block,delivered);
  }
 }
 const sourceMetadata=questions.filter(question=>question.presentation?.editorOnly).map(question=>({id:question.id,editorOnly:question.presentation.editorOnly}));
 return {sourceTexts,siblingContext,...(sourceMetadata.length?{sourceMetadata}:{})};
}

// Only syntax envelopes and uniquely mapped teaching citations can be repaired
// locally. Never change patches, mathematical values, checks or review verdicts.
export function normalizeReviewResult(original,job){
 const transformations=[];let result=original;
 if(typeof result==='string'){
  const text=result.replace(/^\uFEFF/,'').trim(),unwrapped=text.replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/,'$1');
  result=JSON.parse(unwrapped);if(unwrapped!==text||original.startsWith('\uFEFF'))transformations.push({kind:'json-envelope'});
 }
 if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Review result must be a JSON object');
 result=structuredClone(result);
 const teaching=job.context?.teaching?.teaching??(Array.isArray(job.context?.teaching)?job.context.teaching:[]);
 const ids=nodeIds(teaching),aliases=new Map();
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(value.id)for(const alias of [value.sourceAtom?.id,value.sourceReview?.sourceGroupId].filter(Boolean)){
   if(!aliases.has(alias))aliases.set(alias,new Set());aliases.get(alias).add(value.id);
  }
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child);
 };
 visit(teaching);
 for(const method of result.teachingSummary?.methods??(job.stage==='theory'?result.methods??[]:[]))for(const ref of method.sourceRefs??[]){
  if(!ref.targetId||ids.has(ref.targetId)||!aliases.has(ref.targetId))continue;
  const matches=[...aliases.get(ref.targetId)];
  if(matches.length!==1)throw Error('Ambiguous teaching source alias: '+ref.targetId);
  transformations.push({kind:'teaching-source-alias',original:ref.targetId,canonical:matches[0]});ref.targetId=matches[0];
 }
 return {result,transformations};
}
