// Rebind actual passing reviews in one transaction after metadata/layout edits.
// No result is accepted unless its complete semantic/source/method scope matches.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {isLeanReview} from './lean-profile.mjs';
import {reviewSemanticScope} from './import-review-scope.mjs';
export {reviewSemanticScope} from './import-review-scope.mjs';
import {updateWorkflow,bytesHash,fingerprint,materializeCorrections,workflowForPages} from './workflow-review.mjs';
import {verificationDependencies,recordVerification} from './import-verification.mjs';
import {exerciseTeachingContext} from './bounded-stages.mjs';

const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
export async function retainUnchangedImportReviews({runDir,projectFile,config,configFile}){
 const projectHash=bytesHash(projectFile),manifest=read(path.join(runDir,'manifest.json'));
 if(!isLeanReview(manifest))throw Error('Review retention requires a recorded three-pass run');
 return updateWorkflow(runDir,'retain unchanged import review scopes',state=>{
  if(bytesHash(projectFile)!==projectHash)throw Error('Project changed before review retention');
  const raw=read(projectFile),pages=manifest.selectedPages,project=materializeCorrections(raw,workflowForPages(state,pages),'project');
  if(!isLeanReview(project))throw Error('Review retention requires a three-pass project');
  if(project.source?.imports?.length)throw Error('Batch retention currently supports individual-source projects; keep merged-project reviews in their canonical workflow');
  if(Object.keys(state.verification?.stageClaims??{}).length)throw Error('Drain active tickets before batch review retention');
  const deps=verificationDependencies(state,project,{runDir}),blocks=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,b]))),teaching=new Map(),fileHashes=new Map();
  const current=a=>{if(!a?.path||!a.hash||!fs.existsSync(a.path))return false;const p=path.resolve(a.path);if(!fileHashes.has(p))fileHashes.set(p,bytesHash(p));return fileHashes.get(p)===a.hash;};
  const kept=[],pending=[],unchanged=[],outputs=[],proofs=[];
  for(const [id,entry]of Object.entries(state.verification?.entries??{})){
   if(!id.startsWith('question:')||entry.outcome!=='passed'||!blocks.has(id.slice(9)))continue;
   if(entry.dependencies?.question===deps.questions[id.slice(9)]&&(entry.artifacts??[]).every(current)){unchanged.push(id);continue;}
   try{
    if(!(entry.artifacts??[]).length||!entry.artifacts.every(current)||(entry.dependencyArtifacts??[]).some(a=>!current(a)))throw Error('Original review artifacts changed');
    const binding=entry.retentionBinding;
    if(!binding||!current(binding.ticket)||!current(binding.result))throw Error('Hash-bound final review scope unavailable; preserve historical acceptance without guessing a new binding');
    const artifact=binding.result,requestFile=binding.ticket.path,request=read(requestFile);
    if(request.job.stage!=='assessment'||!request.job.context.lean||!request.job.ownershipIds.includes(id))throw Error('Original source/content assessment unavailable');
    const now=blocks.get(id.slice(9));
    if(binding.semanticScopeHash!==fingerprint(reviewSemanticScope(now)))throw Error('Mathematical, classification, identity or source-response scope changed');
    const exerciseId=request.job.context.exerciseId;
    if(!teaching.has(exerciseId))teaching.set(exerciseId,exerciseTeachingContext(project,state,exerciseId,{runDir,config,configFile}));
    if(binding.teachingHash!==teaching.get(exerciseId).dependencyHash)throw Error('Taught method/source context changed');
    if((request.job.evidence??[]).some(a=>!current(a)))throw Error('Originally delivered source evidence changed');
    // New pending issues and unknown whole-register dependencies require review.
    if(entry.dependencies?.unknown||entry.dependencies?.source&&entry.dependencies.source!==deps.source)throw Error('Additional review dependency changed');
    const ids=new Set([now.id,...JSON.stringify(now).matchAll(/"id":"([^"]+)"/g)].map(v=>typeof v==='string'?v:v[1]));
    if(Object.values(state.issues??{}).some(i=>i.status==='pending'&&(ids.has(i.targetId)||ids.has(i.entryId)||!i.targetId&&!i.entryId&&(i.pages??[i.page]).some(p=>(now.sourceRefs??[]).some(r=>r.pageNumber===p)))))throw Error('Pending source/content finding requires a reviewer');
    const proof={id,actualReview:artifact,actualTicket:{path:requestFile,hash:bytesHash(requestFile)},semanticScopeHash:fingerprint(reviewSemanticScope(now)),teachingHash:teaching.get(exerciseId).dependencyHash,oldDependency:entry.dependencies.question,newDependency:deps.questions[now.id]};
    proofs.push(proof);kept.push(id);
   }catch(error){pending.push({id,reason:error.message});}
  }
  if(proofs.length){
   const file=path.join(runDir,'workflow','retention','batch-'+randomUUID()+'.json'),proof={version:1,project:{path:path.resolve(projectFile),hash:projectHash},reviews:proofs,externalModelCalls:0,inspectionCredit:false};
   const bytes=JSON.stringify(proof,null,2)+'\n',ref={path:file,hash:fingerprint(proof)};
   // recordVerification uses byte hashes; bind the exact serialized proof.
   ref.hash=createHash('sha256').update(bytes).digest('hex');
   for(const item of proofs){const entry=state.verification.entries[item.id];recordVerification(state,{...entry,dependencies:{...entry.dependencies,question:item.newDependency},artifacts:[...entry.artifacts,ref]},deps,{artifactCurrent:a=>a.path===file?a.hash===ref.hash:current(a)});}
   outputs.push([file,proof]);
  }
  if(bytesHash(projectFile)!==projectHash)throw Error('Project changed during review retention');
  return {outputs,retained:kept,alreadyCurrent:unchanged,requiresReview:pending,externalModelCalls:0};
 });
}
