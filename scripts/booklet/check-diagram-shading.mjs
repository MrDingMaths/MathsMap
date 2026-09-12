import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {visitFigures,solidHash,imageSourceHash} from '../audit-solid-visibility.mjs';
import {shadingCandidates,inspectShadingReview} from '../../src/lib/diagram-shading.js';
const evidenceKeys=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','mathematicalModel','provenance','verification']);
const contextContent=value=>Array.isArray(value)?value.map(contextContent):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>!evidenceKeys.has(k)).map(([k,v])=>[k,contextContent(v)])):value;
// Include native document prompts as well as plain strings. A text edit can
// change the purpose of an unchanged fill, so source hashes alone are insufficient.
export function shadingContextHash(data,location){
 const contexts=[];let node=data;
 const collect=()=>{if(!node||typeof node!=='object')return;for(const k of ['prompt','question_text','title','alt'])if(node[k]!=null)contexts.push(contextContent(node[k]));if(node.format==='maths-editor-document-v1')contexts.push(contextContent(node));};
 collect();for(const key of location.split('/').filter(Boolean)){node=node?.[key];collect();}
 return solidHash(JSON.stringify(contexts));
}
export function inventoryShading(root=process.cwd(),files=null){
 const rows=[];
 files??=['booklets/projects','booklets/question-bank'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>dir+'/'+f));
 for(const file of files){const data=JSON.parse(fs.readFileSync(path.resolve(root,file),'utf8'));visitFigures(data,r=>{
  const occurrence=file+'#'+r.location+'@'+(r.index??0);
  rows.push({...r,file,occurrence,contextHash:shadingContextHash(data,r.location),sourceHash:r.code?solidHash(r.code):imageSourceHash(r.image,root),candidates:r.code?shadingCandidates(r.code):[]});
 });}return rows;
}
export function auditShading(rows,register){
 return rows.flatMap(r=>{
  if(r.code)return inspectShadingReview(r.code,r.sourceHash,register.reviews?.[r.sourceHash],r.occurrence,r.contextHash).map(i=>({file:r.file,location:r.location,...i}));
  const review=register.images?.[r.sourceHash];
  return review?.status==='accepted'&&review.reason?.trim()&&review.evidence?.trim()&&review.occurrences?.includes(r.occurrence)&&review.contextHashes?.[r.occurrence]===r.contextHash?[]:[{file:r.file,location:r.location,kind:'image-shading-review',reason:'Review the retained image and record its asset hash, purpose, occurrence and current context.'}];
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=k=>{const i=process.argv.indexOf(k);return i<0?null:process.argv[i+1];};
 const register=JSON.parse(fs.readFileSync(arg('--reviews')??'booklets/provenance/diagram-shading-2026-09-12.json','utf8'));
 const rows=inventoryShading(process.cwd(),arg('--project')?[arg('--project')]:null),issues=auditShading(rows,register);
 const report={createdAt:new Date().toISOString(),figures:rows.length,native:rows.filter(r=>r.code).length,paintOccurrences:rows.filter(r=>r.candidates.length).length,images:rows.filter(r=>r.image).length,issues};
 if(arg('--report'))fs.writeFileSync(arg('--report'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));if(issues.length)process.exitCode=1;
}
