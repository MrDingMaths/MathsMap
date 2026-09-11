// Current state is derived from this register; historical events live separately.
// Source inventories and author attempts remain immutable evidence. Approved
// patches are materialized on read, so every consumer gets the same correction.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {withBankLock,writeTransaction} from './bank-sync.mjs';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {applySourceCorrection} from '../../src/lib/booklet-source-corrections.js';
import {evaluateExpression} from '../audit-arithmetic.mjs';
import {inspectTriangle,triangleConstruction,verifyTriangleCode} from './triangle-constraints.mjs';
import {rendererSignature} from './verification-cache.mjs';
import {projectReviewHash,validateFinalManifest} from './page-review.mjs';

export const REVIEW_POLICY='review-first-v1';
export const FINAL_EDITIONS=['student','short','worked','with-short','with-worked'];
export const PATTERN_CHECKS=['writingBoxes','labelClearance','diagramSizing','attribution','sourceColours','alignment','nativeMaths'];
export const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)??'undefined').digest('hex');
export const bytesHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json=(file,fallback)=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback;
export const reviewFile=runDir=>path.join(runDir,'workflow','issues.json');
export function loadWorkflow(runDir){return json(reviewFile(runDir),{version:1,revision:0,pages:{},issues:{},corrections:[],representatives:{},settled:null,finalReview:null});}
export const reviewEnabled=(manifest,config={})=>manifest.workflowPolicy===REVIEW_POLICY||config.workflowPolicy===REVIEW_POLICY;

// A representative candidate contains only selected pages. Keep the complete
// register immutable while applying only corrections whose targets are present.
export function workflowForPages(state,pages,scopes=['inventory','author','project']){
 const selected=new Set(pages);
 return {...state,corrections:state.corrections.map(c=>({...c,patches:c.patches.filter(p=>selected.has(p.page)&&scopes.includes(p.scope))})).filter(c=>c.patches.length)};
}

export async function updateWorkflow(runDir,action,change){
 return withBankLock(async()=>{
  const dir=path.join(runDir,'workflow');fs.mkdirSync(dir,{recursive:true});
  const lock=path.join(dir,'review.lock');let fd;
  try{fd=fs.openSync(lock,'wx');}catch{throw Error('Workflow is being updated by another process; retry after it finishes');}
  try{
   const state=loadWorkflow(runDir),before=fingerprint(state),oldIssues=structuredClone(state.issues),result=await change(state);
   if(fingerprint(state)===before){if(result?.outputs)await writeTransaction(result.outputs);return result??state;}
   state.revision++;const historyFile=path.join(dir,'history.json'),history=json(historyFile,{events:[]});
   history.events.push({at:new Date().toISOString(),action,revision:state.revision,before,after:fingerprint(state),previousIssues:Object.fromEntries(Object.entries(oldIssues).filter(([id,v])=>fingerprint(v)!==fingerprint(state.issues[id])))});
   await writeTransaction([[reviewFile(runDir),state],[historyFile,history],...(result?.outputs??[])]);
   return result??state;
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
 });
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
function patchField(target,patch){
 const keys=patch.field.split('/').filter(Boolean).map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));
 if(!keys.length||keys.some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid correction field');
 let parent=target;for(const k of keys.slice(0,-1))parent=parent?.[k];
 const key=keys.at(-1);if(!parent||!(key in parent))throw Error('Missing correction target '+patch.targetId);
 if(fingerprint(parent[key])===fingerprint(patch.corrected))return;
 if(fingerprint(parent[key])!==fingerprint(patch.original))throw Error('Stale correction '+patch.targetId+patch.field);
 parent[key]=structuredClone(patch.corrected);
}
export function materializeCorrections(source,state,scope,page){
 let result=structuredClone(source);const affected=new Set();
 for(const correction of state.corrections){
  if(correction.status!=='approved')continue;
  for(const patch of correction.patches.filter(p=>(p.scope===scope||scope==='project'&&['author','inventory'].includes(p.scope))&&(page===undefined||p.page===page))){
   if(patch.scope==='inventory'){
    const entries=scope==='inventory'?result.entries:result.source?.inventory?.entries;
    const targets=entries?.filter(e=>e.id===patch.targetId||scope==='project'&&e.id.startsWith(patch.targetId+'-mapping-'))??[];
    if(!targets.length)throw Error('Missing correction target '+patch.targetId);
    for(const target of targets){const before=fingerprint(target);patchField(target,patch);if(scope==='project'&&before!==fingerprint(target))delete target.verification;}
   }
   else{
    const target=contentNodes(result).get(patch.targetId);if(!target)throw Error('Missing correction target '+patch.targetId);
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
 if(scope!=='inventory'&&affected.size){
  for(const block of result.sections.flatMap(s=>s.blocks))if(affected.has(block.id)){
   if(block.sourceReview){delete block.sourceReview.verification;delete block.sourceReview.visualAudit;}
  }
  const nodes=contentNodes(result);
  for(const entry of result.source?.inventory?.entries??[]){
   if(affected.has(nodes.get(entry.targetId)?.block.id)||(entry.teachingContextIds??[]).some(id=>affected.has(nodes.get(id)?.block.id)))delete entry.verification;
  }
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
 const page=inventory.pageNumber,key=fingerprint({inventory,evidence}),previous=state.pages[page];
 const patterns=inventory.layoutPatterns??[];
 if(!patterns.length||patterns.some(p=>typeof p.id!=='string'||!p.description))throw Error('Inventory needs explicit layoutPatterns with IDs and descriptions, including a plain/cover pattern where applicable');
 state.pages[page]={...previous,inventoryHash:key,sourceEvidence:evidence,patterns,mathReview:previous?.inventoryHash===key?previous.mathReview:null};
 const findings=mathematicalFindings(inventory);
 for(const entry of inventory.entries)if(entry.ambiguity)findings.push({id:`inventory-${page}-${entry.id}-ambiguity`,entryId:entry.id,kind:'source-ambiguity',message:entry.ambiguity});
 for(const [i,f]of (inventory.findings??[]).entries())findings.push({id:`inventory-${page}-${f.id??i}`,kind:'source-finding',message:typeof f==='string'?f:f.message??f.note??JSON.stringify(f)});
 const active=new Set(findings.map(f=>f.id));
 for(const [id,issue]of Object.entries(state.issues))if(issue.page===page&&issue.origin!=='author'&&!active.has(id))delete state.issues[id];
 for(const finding of findings){
  const old=state.issues[finding.id];state.issues[finding.id]={...finding,page,inputHash:key,status:old?.inputHash===key?old.status:'pending',resolution:old?.inputHash===key?old.resolution:null};
 }
 if(previous?.inventoryHash!==key){state.settled=null;state.finalReview=null;}
}

export function representativePage(state,pattern){
 return Math.min(...Object.entries(state.pages).filter(([,p])=>p.patterns.some(x=>x.id===pattern)).map(([p])=>Number(p)));
}
export function representativeKey(state,page){const p=state.pages[page];return fingerprint({inventory:p?.inventoryHash,author:p?.authorHash});}
export function pageGate(state,page,{representative=false,authoring=false}={}){
 const p=state.pages[page],reasons=[];
 if(!p)return ['Inventory not registered'];
 if(p.mathReview?.key!==p.inventoryHash)reasons.push('Mathematical inventory review pending');
 for(const issue of Object.values(state.issues))if(issue.page===page&&issue.status==='pending'&&!(authoring&&issue.origin==='author'))reasons.push(issue.id);
 if(!authoring&&p.geometryError)reasons.push('Numerical triangle validation pending: '+p.geometryError);
 for(const pattern of p.patterns){
  const first=representativePage(state,pattern.id),approval=state.representatives[pattern.id];
  if(approval?.key===representativeKey(state,first)&&approval?.page===first)continue;
  if(!(representative&&page===first))reasons.push('Representative pattern pending: '+pattern.id+' (page '+first+')');
 }
 return reasons;
}
export function currentStatus(state,selectedPages){
 const issues=Object.values(state.issues).filter(i=>i.status==='pending');
 const pages=selectedPages.map(page=>({page,inventoryKey:state.pages[page]?.inventoryHash,representativeKey:representativeKey(state,page),patterns:state.pages[page]?.patterns,reasons:pageGate(state,page),author:!!state.pages[page]?.authorHash}));
 return {revision:state.revision,issues,pages,reviewKey:settlementKey(state),contentSettled:!!state.settled,finalAccepted:!!state.finalReview};
}

export function settlementKey(state){return fingerprint({pages:state.pages,issues:state.issues,corrections:state.corrections,representatives:state.representatives});}
export function liveWorkflow(runDir,selectedPages=[]){
 const state=loadWorkflow(runDir),runtime=rendererSignature();
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
  if(approval.renderer!==runtime||!evidenceCurrent(approval.artifacts,hash))delete state.representatives[id];
 }
 if(state.settled?.key!==settlementKey(state)||state.settled&&(!evidenceCurrent(state.settled.artifacts,hash)||!state.settled.project?.file||!fs.existsSync(state.settled.project.file)||projectReviewHash(json(state.settled.project.file))!==state.settled.project.hash)){state.settled=null;state.finalReview=null;}
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
  if(Object.values(state.issues).some(i=>i.page===page&&i.status==='pending'))throw Error('Resolve editorial decisions first for page '+page);
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
  issue.status=resolution.status;issue.resolution={...resolution,reviewer:record.reviewer,evidence:record.artifacts};
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
 state.representatives[record.pattern]={...record};state.settled=null;state.finalReview=null;
}
export function settleWorkflow(state,selectedPages,record){
 reviewEvidence(record);
 if(!selectedPages.length)throw Error('Select all source pages');
 const status=currentStatus(state,selectedPages);
 if(status.pages.some(p=>p.reasons.length||!p.author)||status.issues.length)throw Error('Content cannot settle while inventory, mathematical review, representatives or authoring are pending');
 if(record.key!==settlementKey(state))throw Error('Content changed since settlement review');
 if(!record.project?.file||!fs.existsSync(record.project.file)||projectReviewHash(json(record.project.file))!==record.project.hash)throw Error('Settlement needs the current project hash and file');
 state.settled={...record};state.finalReview=null;
}
export function acceptFinalReview(state,record){
 reviewEvidence(record);
 if(!state.settled||state.settled.key!==settlementKey(state)||record.key!==state.settled.key)throw Error('Settle current content before final review');
 if(record.sourceCompared!==true||record.contentVerified!==true||record.presentationVerified!==true)throw Error('Independent source, content and presentation checks are required');
 const artifacts=[...record.artifacts],renderer=rendererSignature();
 for(const edition of FINAL_EDITIONS){
  const review=record.editions?.[edition];
  if(review?.allPagesVisuallyInspected!==true||!review.pages?.length||!evidenceCurrent(review.artifacts)||review.pages.some(p=>!Number.isInteger(p.page)||!p.hash||p.checked!==true))throw Error('Incomplete final visual review: '+edition);
  const numbers=review.pages.map(p=>p.page).sort((a,b)=>a-b);
  if(numbers.some((p,i)=>p!==i+1))throw Error('Final review must cover every page exactly once: '+edition);
  artifacts.push(...review.artifacts,...validateFinalManifest(review,{edition,key:state.settled.key,projectHash:state.settled.project.hash,renderer}));
 }
 state.finalReview={...record,artifacts};
}

export function geometryEvidence(inventory){
 return inventory.entries.filter(e=>e.mathematicalModel?.type==='triangle').map(e=>({inventoryId:e.id,...triangleConstruction(e.mathematicalModel)}));
}
export function validatePacketGeometry(inventory,packet){
 const nodes=contentNodes(packet),results=[];
 for(const entry of inventory.entries.filter(e=>e.mathematicalModel?.type==='triangle')){
  const mappings=packet.inventoryMappings.filter(m=>m.inventoryId===entry.id&&!m.derived);
  if(!mappings.length)throw Error('Triangle has no authored mapping: '+entry.id);
  for(const mapping of mappings){const diagram=nodes.get(mapping.targetId)?.node;if(!diagram?.code)throw Error('Triangle needs native code '+mapping.targetId);results.push({id:diagram.id,...verifyTriangleCode(entry.mathematicalModel,diagram.code)});}
 }
 return results;
}

export function registerAuthor(state,inventory,packet,{strict=true}={}){
 const page=inventory.pageNumber,hash=fingerprint(packet);
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
 const flags=Object.values(state.issues).map(i=>({id:'workflow-'+i.id,workflowIssue:true,note:i.message??i.kind,resolved:i.status!=='pending',...(i.resolution?{resolution:i.resolution.reason}:{})}));
 for(const page of pages)for(const [i,reason]of pageGate(state,page).filter(r=>!state.issues[r]).entries())flags.push({id:`workflow-gate-${page}-${i}`,workflowIssue:true,note:reason,resolved:false});
 return flags;
}
export function synchronizeProject(project,state,pages,runId){
 const result=materializeCorrections(project,state,'project');
 result.source??={};result.source.workflow={policy:REVIEW_POLICY,runId,correctionIds:state.corrections.map(c=>c.id)};
 result.studio??={};result.studio.flags=[...(result.studio.flags??[]).filter(f=>!f.workflowIssue),...workflowFlags(state,pages)];
 return result;
}
