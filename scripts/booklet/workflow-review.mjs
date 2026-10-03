// Current state is derived from this register; historical events live separately.
// Source inventories and author attempts remain immutable evidence. Approved
// patches are materialized on read, so every consumer gets the same correction.
import fs from 'node:fs';
import {isLeanReview,blockingIssue,printableProject} from './lean-profile.mjs';
import {verificationDependencies,recordVerification,createArtifactVerifier} from './import-verification.mjs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {withBankLock,writeTransaction} from './bank-sync.mjs';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {applySourceCorrection} from '../../src/lib/booklet-source-corrections.js';
import {evaluateExpression} from '../audit-arithmetic.mjs';
import {inspectTriangle,triangleConstruction,verifyTriangleCode} from './triangle-constraints.mjs';
import {rendererSignature} from './verification-cache.mjs';
import {projectReviewHash,validateFinalManifest} from './page-review.mjs';
import {withRunLock} from './run-observability.mjs';
import {UNIQUE_LAYOUT_REVIEW,validateUniqueLayoutReview} from './edition-comparison.mjs';

export const REVIEW_POLICY='review-first-v1';
export const FINAL_EDITIONS=['student','short','worked','with-short','with-worked'];
export const PATTERN_CHECKS=['writingBoxes','labelClearance','diagramSizing','attribution','sourceColours','alignment','nativeMaths'];
export const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)??'undefined').digest('hex');
export const bytesHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=(file,fallback)=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')):fallback;
export const reviewFile=runDir=>path.join(runDir,'workflow','issues.json');
export function loadWorkflow(runDir){const state=json(reviewFile(runDir),{version:1,revision:0,pages:{},issues:{},corrections:[],representatives:{},settled:null,finalReview:null});const manifest=json(path.join(runDir,'manifest.json'),{});if(manifest.pipelinePolicy)state.pipelinePolicy=manifest.pipelinePolicy;if(manifest.reviewProfile)state.reviewProfile=manifest.reviewProfile;return state;}
export const reviewEnabled=(manifest,config={})=>manifest.workflowPolicy===REVIEW_POLICY||config.workflowPolicy===REVIEW_POLICY;

// A representative candidate contains only selected pages. Keep the complete
// register immutable while applying only corrections whose targets are present.
export function workflowForPages(state,pages,scopes=['inventory','author','project']){
 const selected=new Set(pages);
 return {...state,corrections:state.corrections.map(c=>({...c,patches:c.patches.filter(p=>selected.has(p.page)&&scopes.includes(p.scope))})).filter(c=>c.patches.length)};
}

export async function updateWorkflow(runDir,action,change,{lockTimeoutMs=30000}={}){
 return withRunLock(runDir,'review',()=>withBankLock(async()=>{
  const dir=path.join(runDir,'workflow');fs.mkdirSync(dir,{recursive:true});
   const state=loadWorkflow(runDir),before=fingerprint(state),oldIssues=structuredClone(state.issues),result=await change(state);
   if(fingerprint(state)===before){if(result?.outputs)await writeTransaction(result.outputs);return result??state;}
   state.revision++;const historyFile=path.join(dir,'history.json'),history=json(historyFile,{events:[]});
   history.events.push({at:new Date().toISOString(),action,revision:state.revision,before,after:fingerprint(state),previousIssues:Object.fromEntries(Object.entries(oldIssues).filter(([id,v])=>fingerprint(v)!==fingerprint(state.issues[id])))});
   await writeTransaction([[reviewFile(runDir),state],[historyFile,history],...(result?.outputs??[])]);
   return result??state;
 }),{timeoutMs:lockTimeoutMs});
}

export function mathematicalFindings(inventory){
 const findings=[];
 for(const entry of inventory.entries){
  const model=entry.mathematicalModel;
  if(model?.type==='triangle'){
   for(const issue of inspectTriangle(model).issues)findings.push({id:`math-${inventory.pageNumber}-${entry.id}-${issue.kind}-${issue.measurement??''}`,entryId:entry.id,...issue});
   try{triangleConstruction(model);}catch(error){findings.push({id:`math-${inventory.pageNumber}-${entry.id}-construction`,entryId:entry.id,kind:'construction',message:error.message});}
  }else if(model)findings.push({id:`math-${inventory.pageNumber}-${entry.id}-unsupported`,entryId:entry.id,kind:'unsupported-model',message:'Review this model manually; no numerical validator supports it yet.'});
  for(const [index,check]of (entry.mathematicalChecks??[]).entries()){
   const left=evaluateExpression(String(check.left)),right=evaluateExpression(String(check.right));
   const quantum=check.exact===true?0:check.quantum;
   const kind=left===null||right===null||!Number.isFinite(left)||!Number.isFinite(right)?'unsupported-arithmetic':!Number.isFinite(quantum)||quantum<0?'unknown-precision':Math.abs(left-right)>quantum/2+1e-9?'arithmetic-inconsistency':null;
   if(kind)findings.push({id:`math-${inventory.pageNumber}-${entry.id}-arithmetic-${index}`,entryId:entry.id,kind,left,right,quantum});
  }
 }
 return findings;
}

// Patches use exact originals; partial substring substitutions are never guessed.
const patchFingerprint=(value,patch)=>fingerprint(patch.field==='/sourceReview'&&value?{...value,verification:undefined,visualAudit:undefined}:value);
function patchField(target,patch){
 const keys=patch.field.split('/').filter(Boolean).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));
 if(!keys.length||keys.some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid correction field');
 let parent=target;for(const k of keys.slice(0,-1))parent=parent?.[k];
 const key=keys.at(-1);if(!parent||!(key in parent))throw Error('Missing correction target '+patch.targetId);
 if(patchFingerprint(parent[key],patch)===patchFingerprint(patch.corrected,patch))return;
 if(patchFingerprint(parent[key],patch)!==patchFingerprint(patch.original,patch))throw Error('Stale correction '+patch.targetId+patch.field);
 parent[key]=structuredClone(patch.corrected);
}
// Source packets retain page sections; compact projects merge those sections.
// A whole source-block replacement used solely to add teaching metadata must
// target its stable block, not the same ordinal in the merged exercise. Keep
// every current prompt, answer and layout field. Other replacements retain the
// ordinary exact-original conflict path.
function compactTeachingMetadataPatch(result,patch){
 if(patch.scope!=='author'||!/^\/blocks\/\d+$/.test(patch.field)||!patch.original?.id||patch.corrected?.id!==patch.original.id)return false;
 const strip=block=>{const value=structuredClone(block);delete value.sourceAtom;for(const response of value.sourceReview?.responses??[])delete response.scaffoldTargetId;return value;};
 if(fingerprint(strip(patch.original))!==fingerprint(strip(patch.corrected)))return false;
 const located=contentNodes(result).get(patch.original.id),target=located?.node;
 if(!target||target.id!==located.block.id||target.type!==patch.original.type||!(target.sourcePageNumber===patch.page||(target.sourceRefs??[]).some(ref=>ref.pageNumber===patch.page)))throw Error('Missing compact teaching metadata owner '+patch.original.id);
 if(fingerprint(patch.original.sourceAtom)!==fingerprint(patch.corrected.sourceAtom)){
  if(fingerprint(target.sourceAtom)!==fingerprint(patch.corrected.sourceAtom)){
   if(fingerprint(target.sourceAtom)!==fingerprint(patch.original.sourceAtom))throw Error('Stale compact teaching header '+target.id);
   if(patch.corrected.sourceAtom===undefined)delete target.sourceAtom;else target.sourceAtom=structuredClone(patch.corrected.sourceAtom);
  }
 }
 const before=patch.original.sourceReview?.responses??[],after=patch.corrected.sourceReview?.responses??[];
 for(let index=0;index<before.length;index++)if(fingerprint(before[index].scaffoldTargetId)!==fingerprint(after[index].scaffoldTargetId)){
  const original=before[index],corrected=after[index],responses=target.sourceReview?.responses?.filter(r=>r.targetId===original.targetId);
  if(responses?.length!==1||responses[0].kind!==original.kind)throw Error('Missing compact scaffold response '+original.targetId);
  const response=responses[0];
  if(fingerprint(response.scaffoldTargetId)===fingerprint(corrected.scaffoldTargetId))continue;
  if(fingerprint(response.scaffoldTargetId)!==fingerprint(original.scaffoldTargetId))throw Error('Stale compact scaffold binding '+original.targetId);
  const scaffold=corrected.scaffoldTargetId&&contentNodes(result).get(corrected.scaffoldTargetId);
  if(corrected.scaffoldTargetId&&(!scaffold||scaffold.block!==located.block||!['table','paragraph'].includes(scaffold.node.type)))throw Error('Foreign compact scaffold binding '+original.targetId);
  if(corrected.scaffoldTargetId===undefined)delete response.scaffoldTargetId;else response.scaffoldTargetId=corrected.scaffoldTargetId;
 }
 return true;
}
// Compact assembly normalises nodes and merges source-page sections. Bind an
// explicitly reviewed materialisation to its complete saved value; correction
// IDs alone cannot prove that a patch was applied or protect a concurrent edit.
function materializedProjectHash(project){
 const strip=value=>Array.isArray(value)?value.map(strip):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['verification','visualAudit'].includes(key)).map(([key,v])=>[key,strip(v)])):value;
 // Ordinary bank promotion attaches ownership/classification metadata without
 // changing the reviewed source correction. Keep content and captured layout
 // bound, while allowing that separately validated transaction.
 const sections=structuredClone(project.sections);
 for(const section of sections??[])for(const block of section.blocks??[])if(block.type==='question'){
  for(const key of ['bankRef','canonicalId','snapshotKind','classification'])delete block[key];
  if(block.flow){delete block.flow.localDifficulty;delete block.flow.bankDifficulty;if(!Object.keys(block.flow).length)delete block.flow;}
 }
 const settings={...project.settings};delete settings.flowEdition;
 return fingerprint(strip({title:project.title,topics:project.topics,sections,settings,entries:project.source?.inventory?.entries,sourceHashes:project.source?.sourceHashes}));
}
export function recordMaterializedCorrections(project,state,review){
 reviewEvidence(review);
 if(review.sourceCompared!==true)throw Error('Compare the assembled project with the corrected source packets before recording materialisation');
 project.source??={};
 project.source.correctionMaterialization={version:1,...review,projectHash:materializedProjectHash(project),patchHashes:state.corrections.filter(c=>c.status==='approved').flatMap(c=>c.patches.map(fingerprint))};
 return project;
}
// Grouping source questions can change their mapped editable node. Keep that
// provenance change in the same guarded correction transaction as the content.
export function authorMappingTarget(source,targetId,scope,page,fields=[]){
 if(!targetId?.startsWith('$mapping:'))return null;
 const inventoryId=targetId.slice('$mapping:'.length);
 const candidates=scope==='author'?source?.inventoryMappings?.filter(m=>m.inventoryId===inventoryId&&!m.derived):scope==='project'?source?.source?.inventory?.entries?.filter(e=>e.id===inventoryId&&e.pageNumber===page&&!e.derived):null;
 if(!inventoryId||candidates?.length!==1)throw Error('Missing or ambiguous author mapping '+targetId);
 const target=candidates[0];
 // A null field maps the whole node; the assembler omits this optional value.
 // Constituent metadata is optional too. Normalize only its requested fields,
 // preserving an omitted whole-node field when adding a continuation.
 const continuationFields=fields.filter(field=>['/continuationOf','/continuationReason'].includes(field));
 if(!continuationFields.length||fields.includes('/field'))target.field??=null;
 for(const field of continuationFields)target[field.slice(1)]??=null;
 return target;
}
export function materializeCorrections(source,state,scope,page){
 let result=structuredClone(source);const affected=new Set(),mappingContinuations=new Map();
 const approvedPatches=state.corrections.filter(c=>c.status==='approved').flatMap(c=>c.patches);
 const receipt=scope==='project'?result.source?.correctionMaterialization:null;
 const materialized=new Set(receipt?.patchHashes??[]);
 if(receipt){
  if(receipt.version!==1||receipt.projectHash!==materializedProjectHash(result)||!evidenceCurrent(receipt.artifacts))throw Error('Stale compact correction materialisation; review the changed project before propagation');
  const approved=new Set(approvedPatches.map(fingerprint));
  if([...materialized].some(hash=>!approved.has(hash)))throw Error('Compact correction materialisation refers to changed or unapproved patches');
 }
 // Saved projects may already contain the last value in an approved correction
 // chain. Only exact, consecutive replacements can supersede an earlier patch;
 // an unrelated local edit must still fail the ordinary conflict check.
 const superseded=(target,patch)=>{
  const fieldKeys=field=>field.split('/').filter(Boolean).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));
  const fieldValue=(value,field)=>fieldKeys(field).reduce((v,key)=>v?.[key],value);
  const embedded=(value,id)=>contentNodes({sections:[{blocks:[{id:'correction-probe',content:value}]}]}).get(id)?.node;
  const keys=fieldKeys(patch.field);
  if(keys.some(k=>['__proto__','constructor','prototype'].includes(k)))return false;
  let current=fieldValue(target,patch.field),tracked=patch,probe=structuredClone(target);
  let owner=probe;for(const key of keys.slice(0,-1))owner=owner?.[key];
  if(!owner)return false;
  owner[keys.at(-1)]=structuredClone(patch.corrected);
  for(const next of approvedPatches.slice(approvedPatches.indexOf(patch)+1)){
   if((next.scope!==patch.scope&&!(scope==='project'&&next.scope==='project'))||next.page!==patch.page)continue;
   const value=fieldValue(probe,tracked.field);
   const ancestorField=next.targetId===tracked.targetId&&tracked.field.startsWith(next.field+'/');
   const before=ancestorField?next.original:embedded(next.original,tracked.targetId);
   if(ancestorField||before){
    const original=fieldValue(before,ancestorField?tracked.field.slice(next.field.length):tracked.field);
    if(patchFingerprint(original,tracked)!==patchFingerprint(value,tracked))return false;
    // Widen the comparison to the whole replaced parent. A restored leaf may
    // equal its canonical original while ownership or sibling content still
    // needs the intervening replacement; leaf equality cannot prove reuse.
    const parent=contentNodes(result).get(next.targetId)?.node;
    if(!parent)return false;
    current=fieldValue(parent,next.field);probe=structuredClone(parent);tracked=next;
    let parentOwner=probe;const parentKeys=fieldKeys(next.field);
    if(parentKeys.some(k=>['__proto__','constructor','prototype'].includes(k)))return false;
    for(const key of parentKeys.slice(0,-1))parentOwner=parentOwner?.[key];
    if(!parentOwner)return false;
    parentOwner[parentKeys.at(-1)]=structuredClone(next.corrected);
    if(patchFingerprint(current,tracked)===patchFingerprint(next.corrected,tracked))return true;
    continue;
   }
   // sourceReview contains node references, never editable descendants.
   const descendant=fieldKeys(tracked.field)[0]==='sourceReview'?undefined:embedded(value,next.targetId);
   const sameTarget=next.targetId===tracked.targetId&&(next.field===tracked.field||next.field.startsWith(tracked.field+'/'));
   const nextTarget=sameTarget?probe:descendant;
   if(!nextTarget)continue;
   try{patchField(nextTarget,next);}catch{return false;}
   if(patchFingerprint(current,tracked)===patchFingerprint(fieldValue(probe,tracked.field),tracked))return true;
  }
  return false;
 };
 for(const correction of state.corrections){
  if(correction.status!=='approved')continue;
  for(const patch of correction.patches.filter(p=>(p.scope===scope||scope==='project'&&['author','inventory'].includes(p.scope))&&(page===undefined||p.page===page))){
   if(materialized.has(fingerprint(patch)))continue;
   if(patch.targetId?.startsWith('$mapping:')){
    if(patch.scope!=='author'||!['author','project'].includes(scope)||!['/targetId','/field','/continuationOf','/continuationReason'].includes(patch.field))throw Error('Author mapping corrections only support targetId, field, continuationOf and continuationReason');
    const target=authorMappingTarget(result,patch.targetId,scope,patch.page,[patch.field]),before=fingerprint(target),oldTargetId=target.targetId;
    if(['/continuationOf','/continuationReason'].includes(patch.field))mappingContinuations.set(patch.page+':'+patch.targetId,{target,page:patch.page});
    if(!superseded(target,patch))patchField(target,patch);
    if(before!==fingerprint(target)&&scope==='project'){
     delete target.verification;
     const nodes=contentNodes(result);
     for(const id of [oldTargetId,target.targetId])if(nodes.get(id)?.block?.id)affected.add(nodes.get(id).block.id);
    }
    continue;
   }
   if(patch.scope==='inventory'){
    if(patch.targetId==='$inventory'){
     if(patch.field!=='/layoutPatterns')throw Error('Inventory envelope corrections only support layoutPatterns');
     const target=scope==='inventory'?result:result.source?.inventory?.pages?.find(p=>p.pageNumber===patch.page);
     if(!target)throw Error('Missing inventory page metadata '+patch.page);
     patchField(target,patch);continue;
    }
    const entries=scope==='inventory'?result.entries:result.source?.inventory?.entries;
    const targets=entries?.filter(e=>e.id===patch.targetId||scope==='project'&&e.id.startsWith(patch.targetId+'-mapping-'))??[];
    if(!targets.length)throw Error('Missing correction target '+patch.targetId);
    for(const target of targets){const before=fingerprint(target);if(!superseded(target,patch))patchField(target,patch);if(scope==='project'&&before!==fingerprint(target))delete target.verification;}
   }
   else{
    if(scope==='project'&&compactTeachingMetadataPatch(result,patch)){affected.add(patch.original.id);continue;}
    const target=contentNodes(result).get(patch.targetId);
    if(!target){
     // An explicitly approved ancestor replacement may remove an old scaffold.
     // Require both its exact saved replacement and the earlier corrected value
     // inside its original; an absent target alone never counts as approval.
     const fieldValue=(value,field)=>field.split('/').filter(Boolean).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~')).reduce((v,k)=>v?.[k],value);
     const removedByApprovedParent=approvedPatches.slice(approvedPatches.indexOf(patch)+1).some(next=>{
      if(next.page!==patch.page||next.scope!==scope&&!(scope==='project'&&['author','project'].includes(next.scope)))return false;
      const embedded=value=>contentNodes({sections:[{blocks:[{id:'correction-probe',content:value}]}]}).get(patch.targetId)?.node;
      const original=embedded(next.original);if(!original||embedded(next.corrected))return false;
      const parent=contentNodes(result).get(next.targetId)?.node;
      return parent&&patchFingerprint(fieldValue(original,patch.field),patch)===patchFingerprint(patch.corrected,patch)&&patchFingerprint(fieldValue(parent,next.field),next)===patchFingerprint(next.corrected,next);
     });
     if(removedByApprovedParent)continue;
     throw Error('Missing correction target '+patch.targetId);
    }
    if(superseded(target.node,patch))continue;
    const originalValue=fingerprint(target.node);
    // Reuse the existing string correction conflict contract when possible.
    if(typeof patch.original==='string'&&typeof patch.corrected==='string'){
     const probe=structuredClone(target.node);patchField(probe,patch);
     if(fingerprint(probe)!==originalValue){
      const record={id:correction.id+'-'+fingerprint(patch).slice(0,12),targetId:patch.targetId,field:patch.field,original:patch.original,corrected:patch.corrected,reason:correction.reason,sourceRefs:correction.sourceRefs};
      result=applySourceCorrection(result,record);
      // Values belong only in the central patch register; retain references here.
      result.source.corrections=result.source.corrections.filter(c=>c.id!==record.id);
     }
    }else patchField(target.node,patch);
    if(originalValue!==fingerprint(contentNodes(result).get(patch.targetId)?.node))affected.add(target.block.id);
   }
  }
 }
 // Validate the completed pair after both guarded fields have been applied.
 // A continuation records another source constituent of the same target/field;
 // it cannot silently suppress a duplicate mapping to unrelated content.
 for(const {target,page:sourcePage}of mappingContinuations.values()){
  const mappings=scope==='author'?result.inventoryMappings:result.source?.inventory?.entries;
  const id=scope==='author'?target.inventoryId:target.id;
  if(target.continuationOf==null&&target.continuationReason==null)continue;
  if(typeof target.continuationOf!=='string'||!target.continuationOf.trim()||typeof target.continuationReason!=='string'||!target.continuationReason.trim()||target.continuationOf===id||!mappings?.some(m=>(scope==='author'?m.inventoryId:m.id)===target.continuationOf&&(scope==='author'||m.pageNumber===sourcePage)&&!m.derived&&!m.exclusionReason&&!m.continuationOf&&m.targetId===target.targetId&&(m.field??null)===(target.field??null)))throw Error('Invalid shared-content continuation '+id);
 }
 if(scope!=='inventory'&&affected.size){
  for(const block of result.sections.flatMap(s=>s.blocks))if(affected.has(block.id)){
   if(block.sourceReview){delete block.sourceReview.verification;delete block.sourceReview.visualAudit;}
  }
  const nodes=contentNodes(result);
  for(const entry of result.source?.inventory?.entries??[]){
   if(affected.has(nodes.get(entry.targetId)?.block.id)||(entry.teachingContextIds??[]).some(id=>affected.has(nodes.get(id)?.block.id)))delete entry.verification;
  }
 }
 if(receipt){
  result.source.correctionMaterialization={...receipt,projectHash:materializedProjectHash(result),patchHashes:[...new Set([...materialized,...approvedPatches.filter(p=>page===undefined||p.page===page).map(fingerprint)])]};
 }
 return result;
}

export function effectiveInventory(runDir,page,state=loadWorkflow(runDir)){
 const file=path.join(runDir,'semantic-packets',`page-${String(page).padStart(3,'0')}.inventory.json`);
 return materializeCorrections(json(file,null),state,'inventory',page);
}
export function effectiveAuthor(runDir,page,state=loadWorkflow(runDir)){
 const file=path.join(runDir,'semantic-packets',`page-${String(page).padStart(3,'0')}.author.json`);
 return materializeCorrections(json(file,null),state,'author',page);
}

export function sourceEvidence(runDir,page,hash=bytesHash){
 return fingerprint([`evidence/pages/page-${String(page).padStart(3,'0')}.png`,`evidence/pages/page-${String(page).padStart(3,'0')}.txt`,'evidence/word/document.md','evidence/teacher/pages.txt'].map(f=>{const file=path.join(runDir,f);return [f,fs.existsSync(file)?hash(file):null];}));
}
export function registerInventory(state,inventory,evidence=state.pages[inventory.pageNumber]?.sourceEvidence){
 const page=inventory.pageNumber,key=fingerprint({inventory:isLeanReview(state)?printableProject(inventory):inventory,evidence}),previous=state.pages[page];
 const patterns=(inventory.layoutPatterns??[]).filter(p=>!p.exclusionReason?.trim());
 if(!isLeanReview(state)&&(!patterns.length||patterns.some(p=>typeof p.id!=='string'||!p.description)))throw Error('Inventory needs explicit layoutPatterns with IDs and descriptions, including a plain/cover pattern where applicable');
 state.pages[page]={...previous,inventoryHash:key,sourceEvidence:evidence,patterns,mathReview:previous?.inventoryHash===key?previous.mathReview:null};
 const findings=mathematicalFindings(inventory);
 for(const entry of inventory.entries)if(entry.ambiguity)findings.push({id:`inventory-${page}-${entry.id}-ambiguity`,entryId:entry.id,kind:'source-ambiguity',message:entry.ambiguity});
 for(const [i,f]of (inventory.findings??[]).entries())findings.push({id:`inventory-${page}-${f.id??i}`,kind:'source-finding',message:typeof f==='string'?f:f.message??f.note??JSON.stringify(f)});
 const active=new Set(findings.map(f=>f.id));
 for(const [id,issue]of Object.entries(state.issues))if(issue.page===page&&!['author','review'].includes(issue.origin)&&!active.has(id))delete state.issues[id];
 for(const issue of Object.values(state.issues))if(issue.origin==='review'&&issue.status!=='pending'){
  const bound=(issue.resolution?.sourceHashes??issue.sourceHashes)?.[page];
  if(bound&&bound.source!==evidence){issue.previousResolution=issue.resolution;issue.resolution=null;issue.status='pending';issue.reopenedReason='Source evidence changed for page '+page;state.settled=null;state.finalReview=null;}
 }
 for(const finding of findings){
  const old=state.issues[finding.id];state.issues[finding.id]={...finding,page,inputHash:key,status:old?.inputHash===key?old.status:'pending',resolution:old?.inputHash===key?old.resolution:null};
 }
 if(previous?.inventoryHash!==key){state.settled=null;state.finalReview=null;}
}

export function representativePage(state,pattern){
 const selected=state.verification?.representativePlan?.patterns?.find(p=>p.id===pattern)?.representativePage;
 if(selected&&state.pages[selected]?.patterns.some(p=>p.id===pattern))return selected;
 return Math.min(...Object.entries(state.pages).filter(([,p])=>p.patterns.some(x=>x.id===pattern)).map(([p])=>Number(p)));
}
export function representativeKey(state,page){const p=state.pages[page];return fingerprint({inventory:p?.inventoryHash,author:p?.authorHash});}
// One synchronous status/flag operation shares evidence reads. Each public call
// starts fresh, so changed files and renderer inputs are checked again.
function gateEvidence(){
 const hashes=new Map(),reviews=new Map();let runtime;
 const hash=file=>{if(!hashes.has(file))hashes.set(file,bytesHash(file));return hashes.get(file);};
 return {renderer:()=>runtime??=(rendererSignature()),current:artifacts=>{if(!reviews.has(artifacts))reviews.set(artifacts,evidenceCurrent(artifacts,hash));return reviews.get(artifacts);}};
}
export function pageGate(state,page,{representative=false,authoring=false}={},evidence=gateEvidence()){
 const p=state.pages[page],reasons=[];
 if(!p)return ['Inventory not registered'];
 if(isLeanReview(state)){
  if(!authoring)for(const issue of Object.values(state.issues))if((issue.pages??[issue.page]).includes(page)&&blockingIssue(issue,state))reasons.push(issue.id);
  if(!authoring&&p.geometryError)reasons.push('Numerical triangle validation pending: '+p.geometryError);
  return reasons;
 }
 if(state.pipelinePolicy&&representative){
  const plan=state.verification?.representativePlan,selected=new Set([...(plan?.representativePages??[]),...(plan?.patterns??[]).map(p=>p.representativePage),...(plan?.coverage??[]).flatMap(c=>c.pages??[])]);
  if(!plan||!selected.has(page))reasons.push('Representative scheduling is limited to the recorded coverage pages');
 }
 if(state.pipelinePolicy&&!representative){
  const plan=state.verification?.representativePlan;
  if(!plan)reasons.push('Accepted representative coverage plan required');
  else {const runtime=evidence.renderer();
   if(!plan.inventoryKeys||Object.entries(plan.inventoryKeys).some(([page,key])=>state.pages[page]?.inventoryHash!==key))reasons.push('Representative coverage plan is stale');
   for(const item of plan.coverage){
   if(item.status==='not-applicable')continue;
   const approval=state.verification?.coverage?.[item.id];
   if(!approval||approval.renderer!==runtime||!evidence.current(approval.artifacts)||fingerprint(approval.keys)!==fingerprint(Object.fromEntries(item.pages.map(p=>[p,representativeKey(state,p)]))))reasons.push('Representative coverage inspection pending: '+item.id);
   }
  }
 }
 if(p.mathReview?.key!==p.inventoryHash)reasons.push('Mathematical inventory review pending');
 for(const issue of Object.values(state.issues))if((issue.pages??[issue.page]).includes(page)&&issue.status==='pending'&&!(authoring&&issue.origin==='author'))reasons.push(issue.id);
 if(!authoring&&p.geometryError)reasons.push('Numerical triangle validation pending: '+p.geometryError);
 for(const pattern of p.patterns){
  const first=representativePage(state,pattern.id),approval=state.representatives[pattern.id];
  if(approval?.key===representativeKey(state,first)&&approval?.page===first)continue;
  if(!(representative&&page===first))reasons.push('Representative pattern pending: '+pattern.id+' (page '+first+')');
 }
 return reasons;
}
export function currentStatus(state,selectedPages){
 const evidence=gateEvidence();
 const issues=Object.values(state.issues).filter(i=>blockingIssue(i,state));
 const pages=selectedPages.map(page=>({page,inventoryKey:state.pages[page]?.inventoryHash,representativeKey:representativeKey(state,page),patterns:state.pages[page]?.patterns,reasons:pageGate(state,page,{},evidence),author:!!state.pages[page]?.authorHash}));
 return {revision:state.revision,issues,pages,reviewKey:settlementKey(state),contentSettled:!!state.settled,finalAccepted:!!state.finalReview};
}

export function settlementKey(state){if(isLeanReview(state))return fingerprint({pages:Object.fromEntries(Object.entries(state.pages).map(([p,v])=>[p,{source:v.sourceEvidence,inventory:v.inventoryHash,author:v.authorHash}])),issues:Object.values(state.issues).filter(i=>blockingIssue(i,state))});return fingerprint({pages:state.pages,issues:state.issues,corrections:state.corrections,representatives:state.representatives});}
export function liveWorkflow(runDir,selectedPages=[]){
 const state=loadWorkflow(runDir),runtime=rendererSignature({lean:isLeanReview(state)});
 const hashes=new Map(),hash=file=>{if(!hashes.has(file))hashes.set(file,bytesHash(file));return hashes.get(file);};
 for(const page of [...new Set([...Object.keys(state.pages).map(Number),...selectedPages])]){
  const inventory=effectiveInventory(runDir,page,state);
  if(!inventory)continue;
  registerInventory(state,inventory,sourceEvidence(runDir,page,hash));
  if(state.pages[page].mathReview&&!evidenceCurrent(state.pages[page].mathReview.artifacts,hash))state.pages[page].mathReview=null;
  const file=path.join(runDir,'semantic-packets',`page-${String(page).padStart(3,'0')}.author.json`);
  const packet=fs.existsSync(file)?effectiveAuthor(runDir,page,state):null;
  if(packet)registerAuthor(state,inventory,packet,{strict:false});
  else if(state.pages[page].authorHash){state.pages[page].authorHash=null;state.settled=null;state.finalReview=null;}
 }
 for(const [id,approval]of Object.entries(state.representatives)){
  if(approval.renderer!==runtime||!evidenceCurrent(approval.artifacts,hash)){
   // Preserve the actual inspection for an explicit scoped reuse review.
   // Stale evidence never remains in the active approval map.
   state.staleRepresentatives??={};state.staleRepresentatives[id]=approval;
   delete state.representatives[id];
  }
 }
 if(state.settled?.key!==settlementKey(state)||state.settled&&(!(isLeanReview(state)?state.settled.artifacts.every(a=>path.resolve(a.path)===path.resolve(state.settled.project?.file??'')||evidenceCurrent([a],hash)):evidenceCurrent(state.settled.artifacts,hash))||!state.settled.project?.file||!fs.existsSync(state.settled.project.file)||projectReviewHash(json(state.settled.project.file))!==state.settled.project.hash)){state.settled=null;state.finalReview=null;}
 if(state.finalReview&&!evidenceCurrent(state.finalReview.artifacts,hash))state.finalReview=null;
 return state;
}
function evidenceCurrent(artifacts,hash=bytesHash){return Array.isArray(artifacts)&&artifacts.length>0&&artifacts.every(a=>typeof a.path==='string'&&fs.existsSync(a.path)&&a.hash===hash(a.path));}
function reviewEvidence(record){
 if(!record.reviewer?.trim()||!record.note?.trim()||!evidenceCurrent(record.artifacts))throw Error('Review needs a named reviewer, note and current hashed evidence artifacts');
}
export function recordMathReview(state,record){
 reviewEvidence(record);
 if(!record.pages?.length)throw Error('Select pages for mathematical review');
 for(const {page,key}of record.pages??[]){
  if(state.pages[page]?.inventoryHash!==key)throw Error('Stale mathematical review for page '+page);
  if(Object.values(state.issues).some(i=>(i.pages??[i.page]).includes(page)&&i.status==='pending'))throw Error('Resolve editorial decisions first for page '+page);
  state.pages[page].mathReview={key,reviewer:record.reviewer,note:record.note,artifacts:record.artifacts};
 }
 state.settled=null;state.finalReview=null;
}
export function applyDecisions(state,record){
 reviewEvidence(record);
 if(record.expectedRevision!==state.revision)throw Error('Editorial decisions are stale; regenerate from current status');
 if(record.key!==settlementKey(state))throw Error('Editorial source/review inputs changed; use the current reviewKey');
 for(const correction of record.corrections??[]){
  if(!correction.id||!correction.reason||!correction.sourceRefs?.length||!correction.patches?.length)throw Error('Correction needs ID, reason, source references and complete structured patches');
  for(const p of correction.patches)if(!['inventory','author','project'].includes(p.scope)||!Number.isInteger(p.page)||!p.targetId||!p.field||!('original'in p)||!('corrected'in p))throw Error('Invalid correction patch');
  const saved={...correction,status:'approved',reviewer:record.reviewer,evidence:record.artifacts};
  const old=state.corrections.find(c=>c.id===correction.id);
  if(old&&fingerprint(old)!==fingerprint(saved))throw Error('Correction identity conflict '+correction.id);
  if(!old)state.corrections.push(saved);
 }
 for(const resolution of record.resolutions??[]){
  const issue=state.issues[resolution.id];
  if(!issue||!resolution.reason||!['retained','corrected'].includes(resolution.status))throw Error('Invalid editorial resolution');
  if(resolution.status==='corrected'&&!state.corrections.some(c=>c.id===resolution.correctionId))throw Error('A corrected issue needs an approved structured patch');
  issue.status=resolution.status;issue.resolution={...resolution,reviewer:record.reviewer,evidence:record.artifacts,...(issue.origin==='review'?{sourceHashes:Object.fromEntries((issue.pages??[issue.page]).map(page=>[page,{source:state.pages[page]?.sourceEvidence??issue.sourceHashes?.[page]?.source??null}]))}:{})};
 }
 state.settled=null;state.finalReview=null;
}
export function approveRepresentative(state,record,runtime=rendererSignature()){
 reviewEvidence(record);const first=representativePage(state,record.pattern);
 if(first!==record.page||record.key!==representativeKey(state,first)||!state.pages[first]?.authorHash)throw Error('Representative content/source changed or wrong representative page');
 if(pageGate(state,first,{representative:true}).length)throw Error('Representative mathematical review is incomplete');
 if(record.renderer!==runtime)throw Error('Representative renderer signature is stale');
 for(const check of PATTERN_CHECKS)if(record.checks?.[check]!==true&&!record.notApplicable?.[check]?.trim())throw Error('Missing final-size representative check: '+check);
 if(record.finalSize!==true||record.sourceCompared!==true)throw Error('Compare representative source and final-size output before approval');
 state.representatives[record.pattern]={...record};
 if(state.staleRepresentatives)delete state.staleRepresentatives[record.pattern];
 state.settled=null;state.finalReview=null;
}
export function approveCoverage(state,record,runtime=rendererSignature()){
 reviewEvidence(record);const item=state.verification?.representativePlan?.coverage.find(c=>c.id===record.id);
 if(!item||item.status!=='planned'||record.renderer!==runtime||record.finalSize!==true||record.sourceCompared!==true)throw Error('Coverage requires a planned case and actual current final-size inspection');
 const keys=Object.fromEntries(item.pages.map(p=>[p,representativeKey(state,p)]));
 if(item.pages.some(p=>!state.pages[p]?.authorHash)||fingerprint(keys)!==fingerprint(record.keys))throw Error('Representative coverage content changed');
 state.verification.coverage??={};state.verification.coverage[item.id]=structuredClone(record);
}
export function settleWorkflow(state,selectedPages,record){
 reviewEvidence(record);
 if(!selectedPages.length)throw Error('Select all source pages');
 const status=currentStatus(state,selectedPages);
 if(status.pages.some(p=>p.reasons.length||!p.author)||status.issues.length)throw Error('Content cannot settle while inventory, mathematical review, representatives or authoring are pending');
 if(record.key!==settlementKey(state))throw Error('Content changed since settlement review');
 if(!record.project?.file||!fs.existsSync(record.project.file)||projectReviewHash(json(record.project.file))!==record.project.hash)throw Error('Settlement needs the current project hash and file');
 if(isLeanReview(state)){
  const project=json(record.project.file),deps=verificationDependencies(state,project),artifactCurrent=createArtifactVerifier();
  for(const id of Object.keys(deps.questions)){const entry=state.verification?.entries?.['question:'+id];if(entry?.outcome!=='passed')throw Error('Complete content review required: '+id);recordVerification({pipelinePolicy:state.pipelinePolicy,reviewProfile:state.reviewProfile},entry,deps,{artifactCurrent});}
 }
 state.settled={...record};state.finalReview=null;
}
export function acceptFinalReview(state,record){
 reviewEvidence(record);
 if(!state.settled||state.settled.key!==settlementKey(state)||record.key!==state.settled.key)throw Error('Settle current content before final review');
 if(record.sourceCompared!==true||record.contentVerified!==true||record.presentationVerified!==true)throw Error('Independent source, content and presentation checks are required');
 const artifacts=[...record.artifacts],renderer=rendererSignature({lean:isLeanReview(state)});
 if(isLeanReview(state)&&(!isLeanReview(record)||record.reviewPolicy))throw Error('Three-pass imports require targeted visual acceptance');
 if(record.reviewPolicy&&record.reviewPolicy!==UNIQUE_LAYOUT_REVIEW)throw Error('Unknown final review policy');
 for(const edition of FINAL_EDITIONS){
  const review=record.editions?.[edition];
  if(isLeanReview(state)&&!review?.visualPages?.length)throw Error('Targeted inspection selection is missing: '+edition);
  if(((record.reviewPolicy||isLeanReview(state))?review?.allPagesCovered!==true:review?.allPagesVisuallyInspected!==true)||!review.pages?.length||!evidenceCurrent(review.artifacts)||review.pages.some(p=>!Number.isInteger(p.page)||!p.hash||p.checked!==true))throw Error('Incomplete final visual review: '+edition);
  const numbers=review.pages.map(p=>p.page).sort((a,b)=>a-b);
  if(numbers.some((p,i)=>p!==i+1))throw Error('Final review must cover every page exactly once: '+edition);
  artifacts.push(...review.artifacts,...validateFinalManifest(review,{edition,key:state.settled.key,projectHash:state.settled.project.hash,renderer}));
 }
 if(record.reviewPolicy)artifacts.push(...validateUniqueLayoutReview(record));
 state.finalReview={...record,artifacts};
}

export function geometryEvidence(inventory){
 return inventory.entries.filter(e=>e.mathematicalModel?.type==='triangle').map(e=>({inventoryId:e.id,...triangleConstruction(e.mathematicalModel)}));
}
export function validatePacketGeometry(inventory,packet){
 const nodes=contentNodes(packet),results=[];
 for(const entry of inventory.entries.filter(e=>e.mathematicalModel?.type==='triangle')){
  const mappings=packet.inventoryMappings.filter(m=>m.inventoryId===entry.id&&!m.derived);
  // External teaching evidence stays inventoried without an authored diagram.
  // An actual mapping still requires native geometry validation, even if excluded.
  if(entry.exclusionReason?.trim()&&!mappings.length)continue;
  if(!mappings.length)throw Error('Triangle has no authored mapping: '+entry.id);
  for(const mapping of mappings){const diagram=nodes.get(mapping.targetId)?.node;if(!diagram?.code)throw Error('Triangle needs native code '+mapping.targetId);results.push({id:diagram.id,...verifyTriangleCode(entry.mathematicalModel,diagram.code)});}
 }
 return results;
}

export function registerAuthor(state,inventory,packet,{strict=true}={}){
 const page=inventory.pageNumber,hash=fingerprint(isLeanReview(state)?printableProject(packet):packet);
 let geometry=[],geometryError;
 try{geometry=validatePacketGeometry(inventory,packet);}catch(error){if(strict)throw error;geometryError=error.message;}
 if(!state.pages[page])throw Error('Inventory not registered');
 if(state.pages[page].authorHash!==hash){state.settled=null;state.finalReview=null;}
 state.pages[page].authorHash=hash;state.pages[page].geometry=geometry;state.pages[page].geometryError=geometryError??null;
 // Authored findings join the same current register; no second pending ledger.
 const proposals=(packet.corrections??[]).map((proposal,i)=>({id:'correction-'+(proposal.id??i),message:'Source correction proposed; obtain an editorial decision',proposal}));
 const findings=[...(packet.findings??[]),...proposals,...(geometryError?[{id:'geometry',message:geometryError}]:[])],active=new Set();
 findings.forEach((f,i)=>{const id=`author-${page}-${f.id??i}`;active.add(id);const old=state.issues[id];state.issues[id]={id,page,origin:'author',message:typeof f==='string'?f:f.note??f.message??JSON.stringify(f),...(f.proposal?{proposal:f.proposal}:{}),inputHash:hash,status:old?.inputHash===hash?old.status:'pending',resolution:old?.inputHash===hash?old.resolution:null};});
 for(const [id,issue]of Object.entries(state.issues))if(issue.page===page&&issue.origin==='author'&&!active.has(id))delete state.issues[id];
}

export function workflowFlags(state,pages){
 const evidence=gateEvidence();
 const flags=Object.values(state.issues).map(i=>({id:'workflow-'+i.id,workflowIssue:true,note:i.message??i.kind,resolved:!blockingIssue(i,state),...(i.resolution?{resolution:i.resolution.reason}:{})}));
 for(const page of pages)for(const [i,reason]of pageGate(state,page,{},evidence).filter(r=>!state.issues[r]).entries())flags.push({id:`workflow-gate-${page}-${i}`,workflowIssue:true,note:reason,resolved:false});
 return flags;
}
// Keep the original ambiguity as evidence, while deriving its active state from
// the current source-hashed decision. Stale decisions must reopen the item.
export function synchronizeInventoryAmbiguities(entries,state){
 for(const entry of entries){
  if(!entry.ambiguity)continue;
  const page=entry.pageNumber,sourceId=entry.derived&&entry.continuationOf?entry.continuationOf:entry.id.replace(/-mapping-\d+$/,'');
  const issue=state.issues[`inventory-${page}-${sourceId}-ambiguity`];
  const current=issue?.kind==='source-ambiguity'&&issue.entryId===sourceId&&issue.page===page&&issue.inputHash===state.pages[page]?.inventoryHash&&['retained','corrected'].includes(issue.status)&&issue.resolution?.reason&&evidenceCurrent(issue.resolution.evidence);
  if(current){
   delete entry.ambiguous;
   entry.ambiguityResolution={issueId:issue.id,inputHash:issue.inputHash,status:issue.status,resolution:structuredClone(issue.resolution)};
  }else{
   entry.ambiguous=entry.ambiguity;
   delete entry.ambiguityResolution;
  }
 }
 return entries;
}
export function synchronizeProject(project,state,pages,runId){
 const result=materializeCorrections(project,state,'project');
 synchronizeInventoryAmbiguities(result.source?.inventory?.entries??[],state);
 // The incoming receipt was validated above; bind the authorized derived
 // ambiguity annotations without changing its evidence or approved patches.
 if(result.source?.correctionMaterialization)result.source.correctionMaterialization.projectHash=materializedProjectHash(result);
 result.source??={};if(state.reviewProfile)result.source.reviewProfile=state.reviewProfile;result.source.workflow={policy:REVIEW_POLICY,runId,correctionIds:state.corrections.map(c=>c.id)};
 result.studio??={};result.studio.flags=[...(result.studio.flags??[]).filter(f=>!f.workflowIssue),...workflowFlags(state,pages)];
 return result;
}
