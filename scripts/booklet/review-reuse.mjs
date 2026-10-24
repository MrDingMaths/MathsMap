import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {questionReviewContent,isLeanReview} from './lean-profile.mjs';
import {originalSource} from './source-lineage.mjs';
import {loadWorkflow} from './workflow-review.mjs';
import {verificationDependencies,recordVerification,createArtifactVerifier,questionTeachingDependencies} from './import-verification.mjs';
import {remapReference,referenceField,reuseContentValue,reuseContentHash,changedReviewFields} from './reuse-content.mjs';
// The content identity lives in reuse-content.mjs; existing callers import it from here.
export {reuseContentValue,reuseContentHash,changedReviewFields} from './reuse-content.mjs';

const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
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
 // One synchronous verification context may pin many selected rows in the
 // same large review table. Read/parse that file once, retaining exact selector
 // hashes and rejecting any file changed during this context construction.
 const evidence=new Map(),signature=file=>{const s=fs.statSync(file);return [s.mtimeMs,s.ctimeMs,s.size,s.dev,s.ino].join(':');};
 const snapshot=file=>{if(!evidence.has(file)){const before=signature(file),text=fs.readFileSync(file,'utf8');if(signature(file)!==before)throw Error('Reuse evidence changed while reading');evidence.set(file,{signature:before,text});}return evidence.get(file);};
 const json=file=>{const value=snapshot(file);return value.json??=JSON.parse(value.text.replace(/^\uFEFF/,''));};
 const project=json(projectFile),blocks=(project.sections??[]).flatMap(s=>s.blocks??[]),accepted=new Map(),baselines=new Map(),originals=new Map();
 let legacyState;
 const leanFile=path.join(runDir,'lean-review','reviewed.json');
 if(fs.existsSync(leanFile)){
  const table=json(leanFile);
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
  const state=legacyState=loadWorkflow(runDir);
  // This path validates question mathematics, not build/UI/regression evidence.
  // recordVerification requires the exact question dependency, checks and
  // current source artifacts here; hashing every renderer/test tree per reuse
  // candidate cannot establish any additional question acceptance.
  // Preserve the complete historical signature for unknown dependency records.
  const known=new Set(['question','questions','source','project','renderer','authoring','assessment','regression','build','storage']);
  const selected=blocks.filter(b=>!blockIds||blockIds.includes(b.id));
  const broad=selected.some(block=>Object.keys(state.verification?.entries?.['question:'+block.id]?.dependencies??{}).some(key=>!known.has(key)));
  const deps=verificationDependencies(state,project,{runDir,...(!broad?{renderer:null,implementation:{authoring:null,assessment:null,regression:null,build:null,storage:null}}:{})}),artifactCurrent=createArtifactVerifier();
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
   const value=selector?selector.reduce((node,key)=>node?.[key],json(file)):snapshot(file).text;
   return {path:file,hash:sha(value),...(selector?{selector}:{})};
  });
 }
 for(const [file,value]of evidence)if(signature(file)!==value.signature)throw Error('Reuse evidence changed during verification');
 return {projectId:project.id,projectFile,projectFileHash:sha(snapshot(projectFile).text),runDir,blocks,accepted,baselines,originals};
}
// Advisory discovery may compare many candidates carrying pins into the same
// large JSON evidence file. Cache only within that one synchronous retrieval;
// final materialisation uses the ordinary byte checks again.
export function createDiscoveryPinVerifier(){
 const files=new Map();
 const signature=file=>{const s=fs.statSync(file);return [s.mtimeMs,s.ctimeMs,s.size,s.dev,s.ino].join(':');};
 return pin=>{
  if(!fs.existsSync(pin.path))return false;
  const before=signature(pin.path);let cached=files.get(pin.path);
  if(!cached||cached.signature!==before){const text=fs.readFileSync(pin.path,'utf8');if(signature(pin.path)!==before)return false;cached={signature:before,text,hash:sha(text),selectors:new Map()};files.set(pin.path,cached);}
  if(!pin.selector)return cached.hash===pin.hash;
  const key=JSON.stringify(pin.selector);
  if(!cached.selectors.has(key)){cached.json??=JSON.parse(cached.text.replace(/^\uFEFF/,''));cached.selectors.set(key,sha(pin.selector.reduce((node,part)=>node?.[part],cached.json)));}
  return cached.selectors.get(key)===pin.hash;
 };
}
export function reuseCandidate(block,context,{pinCurrent}={}){
 if(!context)return null;
 if(context.contexts){
  const reference=block.sourceReview?.reuse;
  const matches=context.contexts.filter(c=>!reference?.projectId||c.projectId===reference.projectId).map(c=>reuseCandidate(block,c,{pinCurrent})).filter(Boolean);
  return matches.length===1?matches[0]:null;
 }
 let currentBlocks;
 if(context.projectFileHash){
  try{
   if(!fs.existsSync(context.projectFile))return null;
   const currentHash=context.currentProjectHash?context.currentProjectHash():sha(fs.readFileSync(context.projectFile,'utf8'));
   if(currentHash!==context.projectFileHash)currentBlocks=(read(context.projectFile).sections??[]).flatMap(section=>section.blocks??[]);
  }catch(error){
   // Discovery is advisory. A concurrent save can change the signature or
   // expose incomplete JSON; unavailable proof requires ordinary review.
   if(error instanceof SyntaxError||['ENOENT','EBUSY','EACCES','EPERM','UNKNOWN'].includes(error.code)||error.message==='Reuse project changed during retrieval')return null;
   throw error;
  }
 }
 const reference=block.sourceReview?.reuse;
 const hash=context.hashBlock?context.hashBlock(block):reuseContentHash(block),requested=reference?.projectId&&reference.projectId!==context.projectId?null:reference?.blockId??block.provenance?.reuse?.blockId;
 const matching=context.blocks.filter(b=>(!requested||b.id===requested)&&(context.hashBlock?context.hashBlock(b):reuseContentHash(b))===hash&&(!currentBlocks||currentBlocks.some(current=>current.id===b.id&&reuseContentHash(current)===hash)));
 for(const candidate of matching)context.requestedBlockIds?.add(candidate.id);
 const matches=matching.filter(b=>context.accepted.has(b.id)||context.baselines?.has(b.id));
 if(matches.length!==1)return null;
 const prior=matches[0],acceptance=context.accepted.get(prior.id)??context.baselines.get(prior.id);
 try{if(acceptance.acceptancePins?.some(pin=>pinCurrent?!pinCurrent(pin):!fs.existsSync(pin.path)||sha(pin.selector?pin.selector.reduce((node,key)=>node?.[key],read(pin.path)):fs.readFileSync(pin.path,'utf8'))!==pin.hash))return null;}catch{return null;}
 const baseline=context.baselines?.get(prior.id)?.block??prior,amendments=context.accepted.has(prior.id)?[]:changedReviewFields(baseline,prior);
 const source=context.originals?.get(prior.id)??originalSource(prior,{runDir:context.runDir,projectId:context.projectId})??{block:baseline,origin:{projectId:context.projectId,blockId:prior.id,runId:path.basename(context.runDir??''),hash:reuseContentHash(baseline)}};
 const origin={...source.origin,projectId:source.origin?.projectId??context.projectId,blockId:source.origin?.blockId??prior.id,runId:source.origin?.runId??path.basename(context.runDir??''),hash:reuseContentHash(source.block)};
 return {projectId:context.projectId,blockId:prior.id,hash,...acceptance,priorBlock:prior,baselineBlock:baseline,originalSourceBlock:source.block,origin,amendments,amendmentHash:sha(amendments),mode:amendments.length?'amendments':'accepted'};
}
export const REUSE_CONTRACT='For blocks listed in reuseCandidates only, the previous independent mathematical acceptance is current and the editable mathematical content matches exactly. Do not independently rederive those unchanged answers. Independently compare every part, given, diagram label, instruction and response requirement against the NEW source images and the taught methods in this booklet; check the NEW skill mapping and changed presentation. Return sourceEquivalent:true, classificationVerified:true and taughtMethodEquivalent:true on that block record only when you personally verified each. If any comparison is uncertain or different, perform the ordinary complete independent mathematical review and return mathematicsReviewed:true instead. All other blocks receive the ordinary complete review. A match alone is not acceptance. Source identity is originalSourceBlock: current approved clarifications and extra working intentionally extend it and must not be removed merely because they are absent from the new source. For mode amendments, independently review ONLY the listed amendments plus the context needed to check their consequences; unchanged baselineBlock mathematics is independently accepted. Check that the amendments preserve all original givens, parts and assessed tasks and fit this booklet. Return amendmentsReviewed:true, taskPreserved:true and amendmentHash exactly as supplied, alongside the three source/mapping/method checks, only when those checks pass. Correct errors in the amended fields directly. Changed givens, changed assessed tasks or unverifiable baseline acceptance require ordinary authoring/full review. sourceAddition blocks are intentional investigations attached to the matching original teaching; review genuinely new additions fully, and accepted additions for source/context compatibility only.';
