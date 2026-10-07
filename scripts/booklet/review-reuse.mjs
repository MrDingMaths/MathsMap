import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {questionReviewContent,isLeanReview} from './lean-profile.mjs';
import {loadWorkflow} from './workflow-review.mjs';
import {verificationDependencies,recordVerification,createArtifactVerifier,questionTeachingDependencies} from './import-verification.mjs';

const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
// Colours and mathematical diagram code remain significant. Only identity and
// presentation are omitted; never normalise text, values or diagram labels.
const omitted=new Set(['id','number','questionNumber','sourceOrder','sourcePageNumber','sourceLabel','sourceAtom','reuse']);
const remapReference=(value,ids)=>value.split(/([/#:])/).map(part=>ids.get(part)??part).join('');
const referenceField=key=>/(?:Id|Ids)$/.test(key)||['ref','refs','overlayOf','target','targets'].includes(key);
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.keys(value).sort().filter(k=>!omitted.has(k)&&!(k==='label'&&value.type==='question'&&/^\d+$/.test(String(value[k])))).map(k=>[k,canonical(value[k])]));
}
function mathematicalContent(value){
 const projected=questionReviewContent(value);
 function restore(original,copy){
  if(!original||typeof original!=='object'||!copy||typeof copy!=='object')return;
  // Semantic colour and teaching responses are printable mathematical content.
  for(const key of ['colour','color'])if(Object.hasOwn(original,key))copy[key]=original[key];
  if(original.sourceReview?.responses)copy.teachingResponses=structuredClone(original.sourceReview.responses);
  for(const [key,child]of Object.entries(original))restore(child,copy[key]);
 }
 restore(value,projected);return projected;
}
export function reuseContentHash(block){
 const content=mathematicalContent(block),ids=new Map();
 // Assign identities by structural position before sorting/omitting fields.
 // References retain their topology while local names can change freely.
 function collect(value,position='$'){
  if(!value||typeof value!=='object')return;
  if(typeof value.id==='string')ids.set(value.id,position);
  for(const [key,child]of Object.entries(value))if(!omitted.has(key))collect(child,position+'/'+key);
 }
 collect(content);
 function references(value,field=''){
  if(Array.isArray(value))return value.map(child=>references(child,field));
  if(!value||typeof value!=='object'){
   if(!referenceField(field)||typeof value!=='string')return value;
   const mapped=remapReference(value,ids);return mapped===value?value:{localReference:mapped};
  }
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,key==='id'?child:references(child,key)]));
 }
 return sha(canonical(references(content)));
}
export function cloneReusableBlock(block,{projectId,idPrefix,pageMap={},runId}={}){
 if(!projectId||!idPrefix)throw Error('Reuse cloning requires prior project ID and a new ID prefix');
 const copy=structuredClone(block),ids=new Map();
 const visit=(value,fn)=>{if(!value||typeof value!=='object')return;fn(value);for(const child of Object.values(value))visit(child,fn);};
 visit(copy,node=>{if(typeof node.id==='string')ids.set(node.id,idPrefix+'-'+node.id);});
 const removed=new Set(['bankRef','canonicalId','verification','visualAudit','reviewStatus','reviewNotes','reviewFlags','audit','auditTrail','provenance','sourceLayoutEvidence']);
 function remap(value,field=''){
  if(Array.isArray(value))return value.map(child=>['sourcePages','teachingPages','pages'].includes(field)&&Number.isInteger(child)?(pageMap[child]??child):remap(child,field));
  if(!value||typeof value!=='object'){
   if(typeof value!=='string')return value;
   if(field==='id')return ids.get(value)??value;
   return referenceField(field)?remapReference(value,ids):value;
  }
  return Object.fromEntries(Object.entries(value).filter(([key])=>!removed.has(key)).map(([key,child])=>[field==='blockLayouts'&&ids.has(key)?ids.get(key):key,['page','pageNumber','sourcePageNumber','pdfPage'].includes(key)&&Number.isInteger(child)?(pageMap[child]??child):key==='runId'&&runId?runId:remap(child,key)]));
 }
 const result=remap(copy);result.sourceReview??={};
 for(const key of ['status','accepted','reviewer','reviewedAt','evidence','acceptance','diagramReviews','hash'])delete result.sourceReview[key];
 result.sourceReview.reuse={projectId,blockId:block.id};return result;
}
function reviewedSnapshot(snapshot,result){
 const copy=structuredClone(snapshot),nodes=new Map();
 function visit(node){if(!node||typeof node!=='object')return;if(node.id)nodes.set(node.id,node);for(const child of Object.values(node))visit(child);}visit(copy);
 for(const correction of result.corrections??[])for(const patch of correction.patches??[]){
  const node=nodes.get(patch.targetId);if(!node)continue; // another reviewed block
  const parts=String(patch.field??'').split('/').slice(1).map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'));if(!parts.length)throw Error('Invalid review correction');
  let parent=node;for(const key of parts.slice(0,-1))parent=parent?.[key];
  const key=parts.at(-1);if(!parent||!isDeepStrictEqual(parent[key]??null,patch.original??null))throw Error('Review correction does not match its input');
  parent[key]=structuredClone(patch.corrected);
 }
 return copy;
}
export function loadReuseContext({projectFile,runDir}){
 const project=read(projectFile),blocks=(project.sections??[]).flatMap(s=>s.blocks??[]),accepted=new Map();
 const leanFile=path.join(runDir,'lean-review','reviewed.json');
 if(fs.existsSync(leanFile)){
  const table=read(leanFile);
  for(const block of blocks){const row=table.questions?.[block.id];if(row?.outcome==='passed'&&row.hash===sha(questionReviewContent(block)))accepted.set(block.id,{record:leanFile,note:row.note});}
 }else{
  const state=loadWorkflow(runDir),deps=verificationDependencies(state,project,{runDir}),artifactCurrent=createArtifactVerifier();
  for(const block of blocks){
   const record=state.verification?.entries?.['question:'+block.id];
   if(record?.outcome!=='passed'||record.sourceCompared!==true||record.contentVerified!==true)continue;
   try{recordVerification({pipelinePolicy:state.pipelinePolicy,reviewProfile:state.reviewProfile},record,deps,{artifactCurrent});accepted.set(block.id,{record:path.join(runDir,'workflow','issues.json'),note:record.note});}catch{
    // A layout-only edit can stale the old dependency hash. Recover the exact
    // independently reviewed input, validate its original binding, then compare
    // mathematics with today's block. Never treat a mere passed record as proof.
    for(const artifact of record.artifacts??[]){
     if(!artifactCurrent(artifact)||!path.basename(artifact.path).startsWith('result-'))continue;
     const requestFile=path.join(path.dirname(artifact.path),'request.json');if(!fs.existsSync(requestFile))continue;
     try{
      const request=read(requestFile),payload=request.prompt.split('\n').filter(l=>l.startsWith('{')).map(l=>{try{return JSON.parse(l);}catch{return null;}}).find(p=>p?.context?.questions),snapshot=payload?.context.questions.find(q=>q.id===block.id);
      if(!snapshot)continue;
      const result=read(artifact.path),observed=result.records?.find(r=>String(r.id).replace(/^question:/,'')===block.id);
      if(observed?.outcome!=='passed')continue;
      const reviewed=reviewedSnapshot(snapshot,result);if(reuseContentHash(reviewed)!==reuseContentHash(block))continue;
      const lean=isLeanReview(state)||isLeanReview(project),snapshotHash=sha({...(lean?{content:questionReviewContent(snapshot)}:{content:snapshot.content,classification:snapshot.classification,teaching:snapshot.sourceReview?.teachingContext}),source:snapshot.sourceRefs,...(state.pipelinePolicy?{teachingDependencies:questionTeachingDependencies(state,project,snapshot)}:{})});
      if(request.job?.dependencies?.questions?.[block.id]!==snapshotHash)continue;
      const reviewedHash=sha({...(lean?{content:questionReviewContent(reviewed)}:{content:reviewed.content,classification:reviewed.classification,teaching:reviewed.sourceReview?.teachingContext}),source:reviewed.sourceRefs,...(state.pipelinePolicy?{teachingDependencies:questionTeachingDependencies(state,project,reviewed)}:{})});
      recordVerification({pipelinePolicy:state.pipelinePolicy,reviewProfile:state.reviewProfile},record,{...deps,questions:{...deps.questions,[block.id]:reviewedHash}},{artifactCurrent});
      accepted.set(block.id,{record:artifact.path,input:requestFile,note:record.note});break;
     }catch{/* unverifiable snapshot falls back to ordinary review */}
    }
   }
  }
 }
 return {projectId:project.id,projectFile,projectFileHash:sha(fs.readFileSync(projectFile,'utf8')),runDir,blocks,accepted};
}
export function reuseCandidate(block,context){
 if(!context)return null;
 if(context.projectFileHash&&(!fs.existsSync(context.projectFile)||sha(fs.readFileSync(context.projectFile,'utf8'))!==context.projectFileHash))return null;
 const hash=reuseContentHash(block),requested=block.sourceReview?.reuse?.blockId??block.provenance?.reuse?.blockId;
 const matches=context.blocks.filter(b=>(!requested||b.id===requested)&&reuseContentHash(b)===hash&&context.accepted.has(b.id));
 if(matches.length!==1)return null;
 const prior=matches[0];return {projectId:context.projectId,blockId:prior.id,hash,...context.accepted.get(prior.id),priorBlock:prior};
}
export const REUSE_CONTRACT='For blocks listed in reuseCandidates only, the previous independent mathematical acceptance is current and the editable mathematical content matches exactly. Do not independently rederive those unchanged answers. Independently compare every part, given, diagram label, instruction and response requirement against the NEW source images and the taught methods in this booklet; check the NEW skill mapping and changed presentation. Return sourceEquivalent:true, classificationVerified:true and taughtMethodEquivalent:true on that block record only when you personally verified each. If any comparison is uncertain or different, perform the ordinary complete independent mathematical review and return mathematicsReviewed:true instead. All other blocks receive the ordinary complete review. A match alone is not acceptance.';
