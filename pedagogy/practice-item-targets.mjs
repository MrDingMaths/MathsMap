// PROPOSAL ONLY: Node-side review/polish contract; never imported by the renderer.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {reasoningTaskHash} from '../scripts/booklet/reasoning-ratings.mjs';
import {contentSource} from '../src/lib/document-content.js';
const sha=v=>createHash('sha256').update(v).digest('hex');
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
export const diagramMeaningHash=d=>sha(JSON.stringify(canon({id:d.id,format:d.format,code:d.code??null,spec:d.spec??null})));
export const nativePromptContentHash=node=>sha(contentSource(node.prompt));
const registries=new WeakMap();
const nonemptyString=value=>typeof value==='string'&&value.trim().length>0;
const fail=message=>{throw Error(message);};
const exactKeys=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&JSON.stringify(Object.keys(value).sort())===JSON.stringify([...keys].sort());
export function practiceNodeIndex(block){
 const index=new Map();
 const add=(node,parents)=>{if(typeof node?.id!=='string')return parents;if(index.has(node.id))fail('Duplicate native practice node '+node.id);index.set(node.id,{parents:new Set(parents),node});return [...parents,node.id];};
 // Only actual question/part nodes and native prompt document containers. Never
 // answers, diagrams, source/flow/classification metadata, or arbitrary object IDs.
 const documentNode=(node,parents)=>{if(!node||typeof node!=='object')return;const next=add(node,parents);for(const key of ['blocks','rows','cells','inlines','parts','children'])for(const child of node[key]??[])documentNode(child,next);};
 const structural=(node,parents=[])=>{if(!node||typeof node!=='object')return;const next=add(node,parents);if(node.prompt?.format==='maths-editor-document-v1')for(const child of node.prompt.blocks??[])documentNode(child,next);for(const child of node.children??[])structural(child,next);};
 structural(block.content);return index;
}
const hashFile=artifact=>{if(!exactKeys(artifact,['path','sha256'])||!/^[a-f0-9]{64}$/.test(artifact.sha256??''))fail('Need exact pinned artifact path/hash');const bytes=fs.readFileSync(artifact.path);if(sha(bytes)!==artifact.sha256)fail('Response-anchor artifact changed');return bytes;};
// Explicit coordinator API, NOT a model-response/JSON loader. The callback must
// inspect the pinned independent review and affirm each complete response. A raw
// Map, serialized registry or model `verified:true` cannot become a capability.
// The trusted caller remains responsible for reviewing the independent evidence;
// file hashes establish identity, never mathematical acceptance by themselves.
export function coordinatorVerifiedResponseAnchors({snapshot,records,confirmIndependentReview}={}){
 if(typeof confirmIndependentReview!=='function')fail('Explicit coordinator review callback required');
 const snapshotBytes=hashFile(snapshot),project=JSON.parse(snapshotBytes),entries=new Map();
 for(const record of records??[]){
  if(!nonemptyString(record?.evidenceId)||entries.has(record.evidenceId))fail('Missing/duplicate anchor evidence ID');
  const reviewBytes=hashFile(record.reviewArtifact),review=JSON.parse(reviewBytes);
  if(JSON.stringify(canon(review))!==JSON.stringify(canon(record.review)))fail('Review record differs from pinned artifact');
  const block=project.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===review.blockId);
  if(!block||reasoningTaskHash(block)!==review.questionTaskHash)fail('Snapshot task does not match anchor review');
  if(review.type==='verified-native-text-response-v1'){
   if(!Array.isArray(review.responses)||!review.responses.length||review.responses.some(r=>!nonemptyString(r?.id))||new Set(review.responses.map(r=>r.id)).size!==review.responses.length)fail('Missing or duplicate native text response IDs');
  }
  if(confirmIndependentReview(Object.freeze({evidenceId:record.evidenceId,snapshotSha256:snapshot.sha256,reviewSha256:record.reviewArtifact.sha256,review:structuredClone(review)}))!==true)fail('Coordinator has not independently verified complete responses');
  entries.set(record.evidenceId,{snapshot:structuredClone(snapshot),reviewArtifact:structuredClone(record.reviewArtifact),review:structuredClone(review)});
 }
 if(!entries.size)fail('Empty verified response-anchor registry');
 const capability=Object.freeze({});registries.set(capability,entries);return capability;
}
const overlaps=(a,b)=>Math.min(a[2],b[2])>Math.max(a[0],b[0])&&Math.min(a[3],b[3])>Math.max(a[1],b[1]);
export function validatePracticeItems(block,items,{responseAnchors}={}){
 if(!Array.isArray(items)||!items.length)fail('Invalid practice items for '+block.id);
 const index=practiceNodeIndex(block),seen=new Set(),scoped=[];
 const related=(a,b)=>a===b||index.get(a).parents.has(b)||index.get(b).parents.has(a);
 const anchored=items.some(item=>Object.hasOwn(item??{},'responseAnchor'));
 const registry=anchored&&registries.get(responseAnchors);
 if(anchored&&!registry)fail('Unverified response-anchor registry for '+block.id);
 for(const item of items){
  if(!Array.isArray(item?.nodeIds)||!item.nodeIds.length)fail('Practice item needs nodeIds: '+block.id);
  if(Object.keys(item).some(k=>['count','itemCount','independentItems','practiceCount'].includes(k)))fail('Numeric practice count override is forbidden');
  if(anchored&&Object.keys(item).some(k=>!['nodeIds','archetype','rationale','responseAnchor'].includes(k)))fail('Unknown anchored practice-item field');
  const own=new Set();for(const id of item.nodeIds){if(!index.has(id))fail('Practice item target outside question; Invalid or reused practice node '+id);if(own.has(id))fail('Repeated practice item target; Invalid or reused practice node '+id);own.add(id);}
  if(Object.hasOwn(item,'responseAnchor')){
   const anchor=item.responseAnchor;
   if(anchor?.type==='verified-native-text-response-v1'){
    if(!exactKeys(anchor,['type','nodeId','responseId','evidenceId'])||!['nodeId','responseId','evidenceId'].every(k=>nonemptyString(anchor[k])))fail('Invalid native text response anchor');
    if(item.nodeIds.length!==1||item.nodeIds[0]!==anchor.nodeId)fail('Text response anchor must target its actual native prompt node');
    const entry=registry.get(anchor.evidenceId);if(!entry)fail('Unknown independently verified response evidence');
    hashFile(entry.snapshot);hashFile(entry.reviewArtifact);
    const review=entry.review,node=index.get(anchor.nodeId).node;
    if(review.type!==anchor.type||review.blockId!==block.id||review.questionTaskHash!==reasoningTaskHash(block))fail('Question changed since text response review');
    if(typeof node.prompt!=='string'&&node.prompt?.format!=='maths-editor-document-v1')fail('Text response requires an actual native prompt');
    const response=review.responses?.find(r=>r.id===anchor.responseId),responseKeys=['id','nodeId','promptContentHash','start','end','nativePromptQuote','nativeAnswerQuote','independentResponse'];
    if(!response||!(exactKeys(response,responseKeys)||exactKeys(response,[...responseKeys,'promptNodeId']))||response.nodeId!==anchor.nodeId||response.independentResponse!==true)fail('No verified complete native text response');
    const promptNodeId=response.promptNodeId??anchor.nodeId;
    if(!index.has(promptNodeId)||promptNodeId!==anchor.nodeId&&!index.get(anchor.nodeId).parents.has(promptNodeId))fail('Text response prompt must belong to its owner or actual ancestor');
    const promptNode=index.get(promptNodeId).node;
    if(typeof promptNode.prompt!=='string'&&promptNode.prompt?.format!=='maths-editor-document-v1')fail('Text response requires an actual native prompt');
    const prompt=contentSource(promptNode.prompt),{start,end}=response;
    if(response.promptContentHash!==nativePromptContentHash(promptNode))fail('Native prompt changed since text response review');
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>prompt.length||!nonemptyString(response.nativePromptQuote)||prompt.slice(start,end)!==response.nativePromptQuote)fail('Invalid native prompt response span');
    if(!nonemptyString(response.nativeAnswerQuote)||![contentSource(node.answer?.short),contentSource(node.answer?.worked)].some(s=>s.includes(response.nativeAnswerQuote)))fail('Native text response answer quote changed');
    if(scoped.some(previous=>related(previous.nodeId,anchor.nodeId)&&(previous.kind!=='text'||previous.nodeId!==anchor.nodeId||previous.promptNodeId!==promptNodeId||Math.min(previous.end,end)>Math.max(previous.start,start))))fail('Repeated or overlapping native text responses');
    if(seen.size)fail('Whole/descendant response overlaps scoped root');
    scoped.push({kind:'text',nodeId:anchor.nodeId,promptNodeId,start,end});
    continue;
   }
   if(!exactKeys(anchor,['type','diagramId','regionId','evidenceId'])||anchor.type!=='verified-diagram-region-response-v1'||!['diagramId','regionId','evidenceId'].every(key=>nonemptyString(anchor[key])))fail('Invalid response anchor');
   if(item.nodeIds.length!==1||item.nodeIds[0]!==block.content.id)fail('Response anchor must target only the actual question root');
   const entry=registry.get(anchor.evidenceId);if(!entry)fail('Unknown independently verified response evidence');
   hashFile(entry.snapshot);hashFile(entry.reviewArtifact);
   const review=entry.review,diagram=(block.content.questionDiagrams??[]).find(d=>d.id===anchor.diagramId);
   if(review.blockId!==block.id||review.questionTaskHash!==reasoningTaskHash(block))fail('Question changed since response review');
   if(!diagram||diagram.format!=='tikz'||!nonemptyString(diagram.code))fail('Response regions require an actual given native TikZ diagram with nonempty code');
   if(review.diagramId!==diagram.id||review.diagramMeaningHash!==diagramMeaningHash(diagram))fail('Current given diagram differs from response review');
   const region=review.regions?.find(r=>r.id===anchor.regionId);
   if(!region||region.independentResponse!==true||typeof region.nativeAnswerQuote!=='string'||!region.nativeAnswerQuote.trim())fail('No verified complete native response');
   if(![contentSource(block.content.answer?.short),contentSource(block.content.answer?.worked)].some(s=>s.includes(region.nativeAnswerQuote)))fail('Native response quote changed');
   const b=region.bounds;if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]>=b[2]||b[1]>=b[3])fail('Invalid response region bounds');
   if(scoped.some(previous=>previous.kind!=='diagram'||previous.evidenceId===anchor.evidenceId&&previous.region.id===region.id||overlaps(previous.region.bounds,b)))fail('Repeated or overlapping response regions');
   scoped.push({kind:'diagram',nodeId:block.content.id,evidenceId:anchor.evidenceId,region});
  }else{
   if(scoped.length)fail('Whole/descendant response overlaps scoped root');
   for(const id of own){if(seen.has(id))fail('Repeated practice item target; Invalid or reused practice node '+id);if([...seen].some(other=>index.get(id).parents.has(other)||index.get(other).parents.has(id)))fail('Overlapping practice item target; Invalid or reused practice node '+id);}
  }
  if(scoped.length&&seen.size)fail('Whole/descendant response overlaps scoped root');
  if(!Object.hasOwn(item,'responseAnchor'))for(const id of own)seen.add(id);
 }
 return {independentItems:items.length};
}
