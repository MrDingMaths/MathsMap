// Discovery is advisory. Only a literal editable copy can reuse mathematics;
// the independent review still checks the new source, classification and method.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {captureQuestionPresentation} from '../../src/lib/question-presentation.js';
import {originalSource,attachedAdditions} from './source-lineage.mjs';
import {loadReuseContext,cloneReusableBlock,reuseContentHash,reuseCandidate} from './review-reuse.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const projectCache=new Map(),searchCache=new WeakMap(),contentHashes=new WeakMap();
const contentHash=block=>{if(!contentHashes.has(block))contentHashes.set(block,reuseContentHash(block));return contentHashes.get(block);};
function projectSnapshot(file){
 const stat=fs.statSync(file),signature=stat.mtimeMs+':'+stat.ctimeMs+':'+stat.size,old=projectCache.get(file);
 if(old?.signature===signature)return old;
 const text=fs.readFileSync(file,'utf8'),value={signature,project:JSON.parse(text.replace(/^\uFEFF/,'')),hash:hash(text)};projectCache.set(file,value);return value;
}

export function discoverReuseContexts({root=ROOT,excludeRunDir,excludeProjectId,reviewBlocks}={}){
 const dir=path.join(root,'booklets/projects'),contexts=[];
 const reviewHashes=reviewBlocks?new Set(reviewBlocks.map(reuseContentHash)):null;
 if(!fs.existsSync(dir))return {contexts};
 for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json')).sort()){
  const projectFile=path.join(dir,name);
  try{
   const snapshot=projectSnapshot(projectFile),project=snapshot.project,runId=project.runId??project.source?.runId;
   if(project.id===excludeProjectId||!runId||path.basename(runId)!==runId)continue;
   const runDir=path.join(root,'.booklet-work','full-imports',runId);
   if(excludeRunDir&&path.resolve(runDir)===path.resolve(excludeRunDir))continue;
   if(!fs.existsSync(path.join(runDir,'lean-review/reviewed.json'))&&!fs.existsSync(path.join(runDir,'workflow/issues.json')))continue;
   // Verify only projects with a relevant candidate, not the entire library.
   let verified,verifiedSelection;
   const requestedBlockIds=new Set();
   if(reviewBlocks)for(const block of (project.sections??[]).flatMap(s=>s.blocks??[]))if(reviewHashes.has(reuseContentHash(block)))requestedBlockIds.add(block.id);
   const lean=path.join(runDir,'lean-review/reviewed.json'),table=read(fs.existsSync(lean)?lean:path.join(runDir,'workflow/issues.json'));
   const eligible=fs.existsSync(lean)?new Set(Object.entries(table.questions??{}).filter(([,row])=>row.outcome==='passed'||row.acceptedVersion?.outcome==='passed'&&!row.acceptedVersion.revoked).map(([id])=>id)):new Set(Object.entries(table.verification?.entries??{}).filter(([id,row])=>id.startsWith('question:')&&row.outcome==='passed'&&row.sourceCompared===true&&row.contentVerified===true).map(([id])=>id.slice(9)));
   const context={projectId:project.id,projectFile,projectFileHash:snapshot.hash,runDir,eligible,requestedBlockIds,updatedAt:Date.parse(project.updatedAt??project.createdAt??'')||0,blocks:(project.sections??[]).filter(s=>s.phase!=='front-matter').flatMap(s=>s.blocks??[])};
   const verification=()=>{const selection=[...requestedBlockIds].sort().join('\n');if(!verified||selection!==verifiedSelection){verified=loadReuseContext({projectFile,runDir,blockIds:[...requestedBlockIds]});verifiedSelection=selection;}return verified;};
   for(const field of ['accepted','baselines','originals'])Object.defineProperty(context,field,{get(){try{return verification()[field];}catch{return new Map();}}});
   context.project=project;
   context.originalFor=block=>{const source=originalSource(block,{runDir,projectId:project.id}),version=table.questions?.[block.id]?.acceptedVersion;return source?.block??((version?.original??version?.snapshot)&&version.originalHash===hash(version.original??version.snapshot)?(version.original??version.snapshot):block);};
   contexts.push(context);
  }catch{/* Missing or unverifiable historical acceptance means ordinary authoring. */}
 }
 return {contexts};
}

// Retrieval never grants acceptance and never strips numbers from comparisons.
// Text identifies candidates even when pagination, numbering or stage changed.
const tokens=text=>new Set(String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]);
const textFields=new Set(['text','latex','value','prompt','content','title','caption','alt','instruction','instructions','unit']);
const omittedSearchFields=new Set(['answer','theorySolution','steps','classification','sourceReview','sourceRefs','sourceAtom','id','number','label','code','presentation','layout','provenance','sourceLayoutEvidence','verification','visualAudit','bankRef','canonicalId']);
function printableText(node,field=''){
 if(typeof node==='string')return textFields.has(field)?node:'';
 if(Array.isArray(node))return node.map(value=>printableText(value,field)).join(' ');
 if(!node||typeof node!=='object')return '';
 return Object.entries(node).filter(([key])=>!omittedSearchFields.has(key)).map(([key,value])=>printableText(value,key)).join(' ');
}
const externalAsset=node=>node&&typeof node==='object'&&(node.type==='image'||node.format==='image'||Object.values(node).some(v=>Array.isArray(v)?v.some(externalAsset):externalAsset(v)));
export function findAuthorReuseCandidates(sourceText,catalog,{limit=12,maxCharacters=16000}={}){
 const query=tokens(sourceText),ranked=[];
 if(!query.size)return [];
 for(const context of catalog.contexts??[])for(const block of context.blocks){
  let search=searchCache.get(block);if(!search){search={externalAsset:externalAsset(block),words:tokens(printableText(context.originalFor?.(block)??block))};searchCache.set(block,search);}
  if(search.externalAsset||context.eligible&&!context.eligible.has(block.id))continue;
  const words=search.words,common=[...words].filter(w=>query.has(w)).length;
  if(common<Math.min(4,words.size)||!words.size)continue;
  if([...words].some(w=>/^\d+$/.test(w)&&!query.has(w)))continue;
  const score=common/words.size;
  if(score<0.55)continue;
  ranked.push({weight:Math.log2(words.size+1),key:hash([context.projectId,block.id]).slice(0,24),projectId:context.projectId,blockId:block.id,block,score,context});
 }
 ranked.sort((a,b)=>b.score-a.score||b.weight-a.weight||b.context.updatedAt-a.context.updatedAt||a.key.localeCompare(b.key));
 // Verify a bounded shortlist in one pass per prior project. Stale matches
 // fall back instead of causing an unbounded historical-review scan.
 const shortlist=ranked.slice(0,36);
 for(const candidate of shortlist)candidate.context.requestedBlockIds?.add(candidate.blockId);
 const result=[],seen=new Set(),seenOrigins=new Set();let length=0;
 for(const candidate of shortlist){
  const signature=reuseContentHash(candidate.block);if(seen.has(signature))continue;
  const reuse=reuseCandidate(candidate.block,candidate.context);if(!reuse)continue;
  candidate.block={...candidate.block,presentation:captureQuestionPresentation(candidate.block,candidate.context.project?.settings?.layoutOverrides??{})};
  candidate.originalSourceBlock=reuse.originalSourceBlock;candidate.origin=reuse.origin;
  const sourceKey=reuseContentHash(reuse.originalSourceBlock);if(seenOrigins.has(sourceKey))continue;
  candidate.enhanced=reuseContentHash(reuse.originalSourceBlock)!==reuseContentHash(candidate.block);
  const originalIds=new Set(candidate.context.blocks.filter(b=>candidate.context.eligible?.has(b.id)).map(b=>b.id));
  candidate.additions=attachedAdditions(candidate.context.project??{},candidate.block,{originalIds}).map(addition=>({...addition,presentation:captureQuestionPresentation(addition,candidate.context.project?.settings?.layoutOverrides??{})}));
  candidate.enhanced ||=candidate.additions.length>0;
  candidate.mode=reuse.mode;candidate.amendmentHash=reuse.amendmentHash;
  candidate.reviewOwner={projectId:candidate.projectId,blockId:candidate.blockId};
  const acceptedOwner=(item)=>{
   for(const other of catalog.contexts??[]){
    const matched=other.blocks.find(b=>contentHash(b)===contentHash(item));
    if(!matched)continue;other.requestedBlockIds?.add(matched.id);
    const accepted=reuseCandidate(matched,other);
    if(accepted?.mode==='accepted')return {projectId:other.projectId,blockId:matched.id};
   }
   return null;
  };
  if(reuse.mode==='amendments'){
   const owner=acceptedOwner(candidate.block);if(owner){candidate.reviewOwner=owner;candidate.mode='accepted';}
  }
  candidate.additionOwners=Object.fromEntries(candidate.additions.map(addition=>[addition.id,acceptedOwner(addition)]));
  const size=JSON.stringify([candidate.block,candidate.originalSourceBlock,candidate.additions]).length;if(length+size>maxCharacters)continue;
  result.push(candidate);length+=size;seen.add(signature);seenOrigins.add(sourceKey);if(result.length>=limit)break;
 }
 return result;
}

export const AUTHOR_REUSE_CONTRACT=`AUTOMATIC ACCEPTED-CONTENT REUSE: reuseCandidates are retrieval suggestions, never proof of identical source. Before transcribing an assigned complete question or teaching block, compare its ENTIRE prompt, every part, given, response requirement, supplied working, table and diagram with these candidates and the new source pixels. Different question numbering and page placement alone do not change content. Identify the SAME ORIGINAL task/theory using originalSourceBlock, not its improved wording. Source-original identity ignores later clarifications and expanded solutions. Compare the new source's givens, all parts, diagrams and required responses to originalSourceBlock. Use the most recently saved compatible version offered for an original source. Carry the current block's clarifications, extra working and attached additions when they preserve that task and fit this booklet's teaching. For enhanced candidates return improvementsCompatible:true only after checking that complete distinction. Never treat changed givens or changed assessed tasks as an improvement; author them normally. Only a whole source-identical block may be reused. Do not adapt values, remove/add parts or regenerate unchanged solutions. Return a placeholder in its normal section.blocks: {type:"reuse",reuseKey:KEY,id:NEW_UNIQUE_BLOCK_ID,sourceEquivalent:true,improvementsCompatible:true,number:NEW_NUMBER,classification:NEW_CLASSIFICATION,sourceReview:{teachingContext:NEW_CONTEXT}}. Map all assigned inventory entries and NEW answer-book match evidence to the candidate's ORIGINAL node IDs (these are remapped locally); add reuseKey:KEY and reuseCopyId:the placeholder id to every reused mapping/evidence record so copies from different books or repeated copies can safely share original IDs; preserve mapping fields. Supply fresh answerEvidence against the new source where required. The importer copies its editable content and answers deterministically, sets new source references and records the prior review. Author and solve unmatched items normally. Similar wording, uncertain diagrams or different taught methods require ordinary authoring. No reuse placeholder grants review acceptance. Never copy a prior bank link or review status. Do not put copied content into the placeholder.`;

export function materializeAutomaticReuse(packet,candidates,{runId,teachingPages=[]}={}){
 const result=structuredClone(packet),used=new Set(),mapping=new Map();
 const expandedAdditions=new Map();
 for(const section of result.sections??[])section.blocks=(section.blocks??[]).flatMap(block=>{
  if(block.type!=='reuse')return block;
  const candidate=candidates.find(c=>c.key===block.reuseKey);
  if(!candidate||block.sourceEquivalent!==true||!block.id||used.has(block.reuseKey+'\0'+block.id))throw Error('Invalid or ambiguous automatic reuse selection');
  const current=candidate.context.projectFile?loadReuseContext({projectFile:candidate.context.projectFile,runDir:candidate.context.runDir,blockIds:[candidate.blockId]}):candidate.context;
  const currentReuse=reuseCandidate(candidate.block,current);if(!currentReuse||currentReuse.origin.hash!==candidate.origin.hash||candidate.amendmentHash&&currentReuse.amendmentHash!==candidate.amendmentHash)throw Error('Prior reuse acceptance changed during authoring');
  if(candidate.enhanced&&block.improvementsCompatible!==true)throw Error('Improved source reuse requires a complete compatibility check');
  used.add(block.reuseKey+'\0'+block.id);
  const prefix=block.id,copy=cloneReusableBlock(candidate.block,{projectId:candidate.projectId,idPrefix:prefix,runId});
  const register=(id,target,native=true)=>{if(!mapping.has(id))mapping.set(id,[]);mapping.get(id).push({key:candidate.key,copyId:block.id,target,native});};
  const localIds=new Set(),metadata=new Set(['sourceAtom','sourceReview','presentation','sourceLayoutEvidence','provenance','verification','bankRef','studio','audit','auditTrail']);
  const collect=node=>{if(!node||typeof node!=='object')return;if(node.id){if(localIds.has(node.id))throw Error('Duplicate native node inside reused content');localIds.add(node.id);register(node.id,prefix+'-'+node.id);}for(const [key,value] of Object.entries(node))if(!metadata.has(key))collect(value);};
  collect(candidate.block);
  copy.sourcePageNumber=result.pageNumber;copy.sourceRefs=[{pageNumber:result.pageNumber,...(runId?{runId}:{})}];
  // Remove old source and teaching bindings recursively; the new source owns them.
  const reset=node=>{if(!node||typeof node!=='object')return;
   for(const key of ['sourceRefs','sourcePageNumber','sourceLabel','sourceOrder','answerEvidence'])delete node[key];
   if(node.sourceReview){for(const key of ['teachingContext','sourcePages','teachingPages','sourcePagination','sourceCategoryHeading'])delete node.sourceReview[key];}
   for(const value of Object.values(node))reset(value);
  };reset(copy);
  copy.sourcePageNumber=result.pageNumber;copy.sourceRefs=[{pageNumber:result.pageNumber,...(runId?{runId}:{})}];
  if(copy.sourceAtom?.id){
   const originalGroup=candidate.originalSourceBlock.sourceAtom?.id??candidate.block.sourceAtom?.id;
   copy.sourceAtom.id='p'+result.pageNumber+'-reuse-group-'+hash([candidate.origin.projectId,originalGroup]).slice(0,16);
   if(!localIds.has(candidate.block.sourceAtom.id))register(candidate.block.sourceAtom.id,copy.sourceAtom.id,false);
  }
  if(block.number!==undefined)copy.number=block.number;
  if(block.classification)copy.classification=structuredClone(block.classification);
  copy.sourceReview={...copy.sourceReview,...(block.sourceReview?.teachingContext?{teachingContext:structuredClone(block.sourceReview.teachingContext)}:{}),teachingPages,sourcePages:[result.pageNumber],reuse:candidate.reviewOwner??{projectId:candidate.projectId,blockId:candidate.blockId},origin:candidate.origin};
  const extras=[];
  for(const addition of candidate.additions??[]){
   const key=candidate.projectId+':'+addition.id;if(expandedAdditions.has(key))continue;
   // The entire source project is pinned: additions cannot change in flight.
   if(!current.blocks.some(b=>b.id===addition.id&&reuseContentHash(b)===reuseContentHash(addition)))throw Error('Attached investigation changed during authoring');
   const extra=cloneReusableBlock(addition,{projectId:candidate.projectId,idPrefix:prefix+'-addition',runId});reset(extra);
   extra.sourceRefs=structuredClone(copy.sourceRefs);extra.sourcePageNumber=result.pageNumber;extra.sourceReview??={};
   extra.sourceReview.sourceAddition={projectId:candidate.projectId,blockId:addition.id,anchorId:copy.id};
   extra.sourceReview.teachingPages=teachingPages;
   extra.sourceReview.reuse=candidate.additionOwners?.[addition.id]??{projectId:candidate.projectId,blockId:addition.id};
   extra.sourceReview.additionTo={blockId:copy.id};
   extras.push(extra);expandedAdditions.set(key,extra.id);
  }
  return [copy,...extras];
 });
 const resolve=(id,marker={})=>{
  let matches=(mapping.get(id)??[]).filter(row=>(!marker.reuseKey||row.key===marker.reuseKey)&&(!marker.reuseCopyId||row.copyId===marker.reuseCopyId));
  if(!matches.length)return id;if(matches.some(row=>row.native))matches=matches.filter(row=>row.native);
  const targets=[...new Set(matches.map(row=>row.target))];if(targets.length!==1)throw Error('Ambiguous reused node mapping; supply reuseKey and reuseCopyId');return targets[0];
 };
 for(const item of result.inventoryMappings??[]){item.targetId=resolve(item.targetId,item);delete item.reuseKey;delete item.reuseCopyId;}
 const remapEvidence=(node,parent={})=>{if(!node||typeof node!=='object')return;const marker={reuseKey:node.reuseKey??parent.reuseKey,reuseCopyId:node.reuseCopyId??parent.reuseCopyId};for(const [key,value] of Object.entries(node)){if(['questionId','targetId','blockId'].includes(key))node[key]=resolve(value,marker);else remapEvidence(value,marker);}delete node.reuseKey;delete node.reuseCopyId;};
 remapEvidence(result.answerEvidence);
 return result;
}
