import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {questionReviewContent,isLeanReview} from './lean-profile.mjs';
import {originalSource} from './source-lineage.mjs';
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
export function reuseContentValue(block){
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
 return canonical(references(content));
}
export const reuseContentHash=block=>sha(reuseContentValue(block));
export function changedReviewFields(before,after){
 const result=[],escape=s=>String(s).replaceAll('~','~0').replaceAll('/','~1');
 const visit=(a,b,field='')=>{
  if(isDeepStrictEqual(a,b))return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)]))visit(a[key],b[key],field+'/'+escape(key));
  }else result.push({field,original:a??null,current:b??null});
 };
 visit(reuseContentValue(before),reuseContentValue(after));return result;
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
  return Object.fromEntries(Object.entries(value).filter(([key])=>!removed.has(key)).map(([key,child])=>[['blockLayouts','answerSpaces','diagramColourModes','diagramWidths'].includes(field)?remapReference(key,ids):key,['page','pageNumber','sourcePageNumber','pdfPage'].includes(key)&&Number.isInteger(child)?(pageMap[child]??child):key==='runId'&&runId?runId:remap(child,key)]));
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
function originalTeachingProject(project,payload,result){
 const supplied=payload?.context?.teaching?.teaching;
 if(!Array.isArray(supplied))return project;
 const snapshots=new Map([...supplied.map(row=>row.block??row),...(payload.context.questions??[])].filter(block=>block?.id).map(block=>[block.id,block]));
 const teachingIds=new Set(supplied.map(row=>(row.block??row)?.id));
 const original=structuredClone(project),scope=payload.context.exerciseId;
 for(const section of original.sections??[]){
  // Newly added teaching did not form part of the original reviewed dependency.
  if(section.phase==='teaching'&&section.topicId===scope)section.blocks=section.blocks.filter(block=>teachingIds.has(block.id));
  section.blocks=section.blocks.map(block=>snapshots.has(block.id)?reviewedSnapshot(snapshots.get(block.id),result):block);
  const context=payload.context.sectionContext?.find(row=>(row.blockIds??[]).some(id=>section.blocks.some(block=>block.id===id)));
  if(context)for(const key of ['id','topicId','phase','role','title','sourcePageNumber'])if(context[key]!==undefined)section[key]=context[key];
 }
 return original;
}
export function loadReuseContext({projectFile,runDir,blockIds}){
 const project=read(projectFile),blocks=(project.sections??[]).flatMap(s=>s.blocks??[]),accepted=new Map(),baselines=new Map(),originals=new Map();
 let legacyState;
 const leanFile=path.join(runDir,'lean-review','reviewed.json');
 if(fs.existsSync(leanFile)){
  const table=read(leanFile);
  for(const block of blocks.filter(b=>!blockIds||blockIds.includes(b.id))){
   const row=table.questions?.[block.id],version=row?.acceptedVersion;
   if(row?.outcome==='passed'&&row.hash===sha(questionReviewContent(block))&&(!version?.mathematicalHash||version.mathematicalHash===reuseContentHash(block)))accepted.set(block.id,{record:leanFile,note:row.note});
   if(version?.outcome==='passed'&&!version.revoked&&version.snapshot&&version.hash===sha(questionReviewContent(version.snapshot))&&(!version.mathematicalHash||version.mathematicalHash===reuseContentHash(version.snapshot))){
    baselines.set(block.id,{record:leanFile,note:version.note,block:version.snapshot});
    const original=version.original??version.snapshot;if(original&&version.originalHash===sha(original))originals.set(block.id,{block:original,origin:version.origin,files:[leanFile]});
   }
   if(accepted.has(block.id)&&!baselines.has(block.id))baselines.set(block.id,{...accepted.get(block.id),block});
   // Historical lean records can bind an unchanged authored snapshot by exact hash.
   if(!baselines.has(block.id)&&row?.outcome==='passed'){
    const source=originalSource(block,{runDir,projectId:project.id});
    if(source&&sha(questionReviewContent(source.block))===row.hash)baselines.set(block.id,{record:leanFile,note:row.note,block:source.block});
   }
  }
 }else{
  const state=legacyState=loadWorkflow(runDir),deps=verificationDependencies(state,project,{runDir}),artifactCurrent=createArtifactVerifier();
  for(const block of blocks.filter(b=>!blockIds||blockIds.includes(b.id))){
   const record=state.verification?.entries?.['question:'+block.id];
   if(record?.outcome!=='passed'||record.sourceCompared!==true||record.contentVerified!==true)continue;
   try{recordVerification({pipelinePolicy:state.pipelinePolicy,reviewProfile:state.reviewProfile},record,deps,{artifactCurrent});accepted.set(block.id,{record:path.join(runDir,'workflow','issues.json'),note:record.note});baselines.set(block.id,{...accepted.get(block.id),block});}catch{
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
      const reviewed=reviewedSnapshot(snapshot,result);
      const inputProject=originalTeachingProject(project,payload,{corrections:[]}),reviewedProject=originalTeachingProject(project,payload,result);
      const lean=isLeanReview(state)||isLeanReview(project),snapshotHash=sha({...(lean?{content:questionReviewContent(snapshot)}:{content:snapshot.content,classification:snapshot.classification,teaching:snapshot.sourceReview?.teachingContext}),source:snapshot.sourceRefs,...(state.pipelinePolicy?{teachingDependencies:questionTeachingDependencies(state,inputProject,snapshot)}:{})});
      if(request.job?.dependencies?.questions?.[block.id]!==snapshotHash)continue;
      const reviewedHash=sha({...(lean?{content:questionReviewContent(reviewed)}:{content:reviewed.content,classification:reviewed.classification,teaching:reviewed.sourceReview?.teachingContext}),source:reviewed.sourceRefs,...(state.pipelinePolicy?{teachingDependencies:questionTeachingDependencies(state,reviewedProject,reviewed)}:{})});
      recordVerification({pipelinePolicy:state.pipelinePolicy,reviewProfile:state.reviewProfile},record,{...deps,questions:{...deps.questions,[block.id]:reviewedHash}},{artifactCurrent});
      const acceptance={record:artifact.path,input:requestFile,note:record.note};baselines.set(block.id,{...acceptance,block:reviewed});
      if(reuseContentHash(reviewed)===reuseContentHash(block))accepted.set(block.id,acceptance);break;
     }catch{/* unverifiable snapshot falls back to ordinary review */}
    }
   }
  }
 }
 for(const [id,acceptance] of [...accepted,...baselines]){
  const files=[acceptance.record,acceptance.input].filter(Boolean);
  if(!fs.existsSync(leanFile)){const record=legacyState.verification?.entries?.['question:'+id];files.push(...(record?.artifacts??[]).map(a=>a.path));}
  acceptance.acceptancePins=[...new Set(files)].map(file=>{
   const selector=file===leanFile?['questions',id]:file===path.join(runDir,'workflow/issues.json')?['verification','entries','question:'+id]:null;
   const value=selector?selector.reduce((node,key)=>node?.[key],read(file)):fs.readFileSync(file,'utf8');
   return {path:file,hash:sha(value),...(selector?{selector}:{})};
  });
 }
 return {projectId:project.id,projectFile,projectFileHash:sha(fs.readFileSync(projectFile,'utf8')),runDir,blocks,accepted,baselines,originals};
}
export function reuseCandidate(block,context){
 if(!context)return null;
 if(context.contexts){
  const reference=block.sourceReview?.reuse;
  const matches=context.contexts.filter(c=>!reference?.projectId||c.projectId===reference.projectId).map(c=>reuseCandidate(block,c)).filter(Boolean);
  return matches.length===1?matches[0]:null;
 }
 let currentBlocks;
 if(context.projectFileHash){
  if(!fs.existsSync(context.projectFile))return null;
  if(sha(fs.readFileSync(context.projectFile,'utf8'))!==context.projectFileHash)currentBlocks=(read(context.projectFile).sections??[]).flatMap(section=>section.blocks??[]);
 }
 const reference=block.sourceReview?.reuse;
 const hash=reuseContentHash(block),requested=reference?.projectId&&reference.projectId!==context.projectId?null:reference?.blockId??block.provenance?.reuse?.blockId;
 const matching=context.blocks.filter(b=>(!requested||b.id===requested)&&reuseContentHash(b)===hash&&(!currentBlocks||currentBlocks.some(current=>current.id===b.id&&reuseContentHash(current)===hash)));
 for(const candidate of matching)context.requestedBlockIds?.add(candidate.id);
 const matches=matching.filter(b=>context.accepted.has(b.id)||context.baselines?.has(b.id));
 if(matches.length!==1)return null;
 const prior=matches[0],acceptance=context.accepted.get(prior.id)??context.baselines.get(prior.id);
 try{if(acceptance.acceptancePins?.some(pin=>!fs.existsSync(pin.path)||sha(pin.selector?pin.selector.reduce((node,key)=>node?.[key],read(pin.path)):fs.readFileSync(pin.path,'utf8'))!==pin.hash))return null;}catch{return null;}
 const baseline=context.baselines?.get(prior.id)?.block??prior,amendments=context.accepted.has(prior.id)?[]:changedReviewFields(baseline,prior);
 const source=context.originals?.get(prior.id)??originalSource(prior,{runDir:context.runDir,projectId:context.projectId})??{block:baseline,origin:{projectId:context.projectId,blockId:prior.id,runId:path.basename(context.runDir??''),hash:reuseContentHash(baseline)}};
 const origin={...source.origin,projectId:source.origin?.projectId??context.projectId,blockId:source.origin?.blockId??prior.id,runId:source.origin?.runId??path.basename(context.runDir??''),hash:reuseContentHash(source.block)};
 return {projectId:context.projectId,blockId:prior.id,hash,...acceptance,priorBlock:prior,baselineBlock:baseline,originalSourceBlock:source.block,origin,amendments,amendmentHash:sha(amendments),mode:amendments.length?'amendments':'accepted'};
}
export const REUSE_CONTRACT='For blocks listed in reuseCandidates only, the previous independent mathematical acceptance is current and the editable mathematical content matches exactly. Do not independently rederive those unchanged answers. Independently compare every part, given, diagram label, instruction and response requirement against the NEW source images and the taught methods in this booklet; check the NEW skill mapping and changed presentation. Return sourceEquivalent:true, classificationVerified:true and taughtMethodEquivalent:true on that block record only when you personally verified each. If any comparison is uncertain or different, perform the ordinary complete independent mathematical review and return mathematicsReviewed:true instead. All other blocks receive the ordinary complete review. A match alone is not acceptance. Source identity is originalSourceBlock: current approved clarifications and extra working intentionally extend it and must not be removed merely because they are absent from the new source. For mode amendments, independently review ONLY the listed amendments plus the context needed to check their consequences; unchanged baselineBlock mathematics is independently accepted. Check that the amendments preserve all original givens, parts and assessed tasks and fit this booklet. Return amendmentsReviewed:true, taskPreserved:true and amendmentHash exactly as supplied, alongside the three source/mapping/method checks, only when those checks pass. Correct errors in the amended fields directly. Changed givens, changed assessed tasks or unverifiable baseline acceptance require ordinary authoring/full review. sourceAddition blocks are intentional investigations attached to the matching original teaching; review genuinely new additions fully, and accepted additions for source/context compatibility only.';
