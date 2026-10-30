import {flowNumbers,exerciseNumbers} from '../src/lib/booklet-flow.js';
import {arrangementCatalog,arrangementQuestionBlock} from '../src/lib/booklet-arrangement.js';
import {resolveExerciseReferences} from '../polish/exercise-references.mjs';

const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const boundary='[A-Za-z0-9_-]';
const referenceField=/^(?:targets?|targetIds?|blockIds?|ownerIds?|nodeIds?|sectionIds?|projectId|questionIds?|teachingIds?|exampleIds?|guidedPracticeIds?|dependsOn|requires|dependent|pairedBlockId|continuationOf|ids|originalOrder|proposedOrder|plannedIds|currentOrder|evidenceIds|teachingEvidenceIds|practiceEvidenceIds|moveAfter|moveBefore|keepTogether|suppliedBy)$/;

// A task-local view for pedagogy/order reviews ONLY. Source-fidelity reviews must
// retain their original source identities and must not use this projection.
export function projectReviewReferences({project,payload,purpose,proposedOrder}={}){
 if(purpose==='source-fidelity')return {payload:structuredClone(payload),encode:value=>structuredClone(value),decode:result=>structuredClone(result)};
 if(!['pedagogy-order','practice-order'].includes(purpose))throw Error('Neutral references require a pedagogy/order review purpose');
 if(!project||!Array.isArray(project.sections)||!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Expected project and JSON object payload');
 const forward=new Map(),reverse=new Map(),entries=new Map(),blocks=[],nodeOwners=new Map();
 const add=(id,metadata)=>{
  if(typeof id!=='string'||!id)return;
  if(!forward.has(id)){const ref='ref'+String(forward.size+1).padStart(4,'0');forward.set(id,ref);reverse.set(ref,id);}
  entries.set(id,{...entries.get(id),...metadata});
 };
 const numbers=flowNumbers(project),exercises=exerciseNumbers(project);
 add(project.id,{kind:'booklet'});
 const seenTopics=new Set();
 for(const [sectionIndex,section]of project.sections.entries()){
  if(section.topicId&&!seenTopics.has(section.topicId)){add(section.topicId,{kind:'topic'});seenTopics.add(section.topicId);}
  add(section.id,{kind:'section',sectionPosition:sectionIndex+1,topicId:section.topicId});
  for(const [blockIndex,block]of (section.blocks??[]).entries()){
   const position=blocks.length+1;
   blocks.push({block,section});
   const location={ownerId:block.id,sectionId:section.id,topicId:section.topicId,sequencePosition:position,sectionPosition:sectionIndex+1,positionInSection:blockIndex+1,...(numbers[block.id]!=null?{displayNumber:numbers[block.id]}:{}),...(exercises[section.topicId]!=null?{exerciseNumber:exercises[section.topicId]}:{})};
   add(block.id,{kind:'block',...location});nodeOwners.set(block.id,block.id);
   const printedPartLabels=block.type==='question'&&block.content&&numbers[block.id]!=null
    ?new Map([...arrangementCatalog(arrangementQuestionBlock(block,numbers[block.id])).entries.values()].filter(entry=>entry.kind==='label').map(entry=>[entry.ownerId,entry.value])):null;
   const visit=(node,partLabels=[],isPart=false)=>{
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){for(const child of node)visit(child,partLabels,isPart);return;}
    const label=printedPartLabels?.has(node.id)?printedPartLabels.get(node.id):node.label;
    const labels=isPart&&label!=null&&label!==''?[...partLabels,String(label)]:partLabels;
    if(node.id){if(node.id!==block.id)add(node.id,{kind:'part',...location,partLabels:labels});nodeOwners.set(node.id,block.id);}
    for(const [key,child]of Object.entries(node))if(child&&typeof child==='object')visit(child,labels,key==='children');
   };
   visit(block.content);
   // Worked-example entries and native diagrams may live beside content.
   for(const [key,value]of Object.entries(block))if(key!=='content'&&value&&typeof value==='object')visit(value);
  }
 }
 if(!forward.size)throw Error('Project has no reference identities');
 const proseIds=[...forward.keys()].filter(id=>nodeOwners.has(id)&&/[0-9_-]/.test(id));
 const canonicalPattern=proseIds.length?new RegExp(`(?<!${boundary})(?:${proseIds.sort((a,b)=>b.length-a.length).map(escape).join('|')})(?!${boundary})`,'g'):null;
 const neutralPattern=/(?<![A-Za-z0-9_-])ref\d+(?![A-Za-z0-9_-])/g;
 const used=new Set();
 const identityFields=new Set(['id','topic','topicId','sectionId','ownerId','blockId','nodeId','projectId']);
 const reviewerProse=new Set(['finding','breakdown','checked','assumptions','proposal','doneWhen','reason','evidence','rationale','note','question','comment','where']);
 const replaceProse=(value,replace)=>canonicalPattern?value.split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/g).map((part,i)=>i%2?part:part.replace(canonicalPattern,replace)).join(''):value;
 const encodeText=(value,key)=>{
  const replace=id=>{used.add(id);return forward.get(id);};
  if((identityFields.has(key)||referenceField.test(key))&&forward.has(value))return replace(value);
  return reviewerProse.has(key)?replaceProse(value,replace):value;
 };
 const taskLists=new Set(['candidates','contextQuestions','findings','suggestions','dropped','clusters']);
 const taskReferenceFields=new Set(['from','candidateId','candidateIds','contextQuestionId','contextQuestionIds']);
 const nativeLists=new Set(['examples','practice','hints','moves']);
 const nativeMaps=new Set(['practiceItems','examples','practice','hints','byTarget','questions']);
 const separateNamespaces=new Set(['prerequisiteIds','skillId','skillIds','primarySkillId','skill','skills','approvedPriorKnowledge','prerequisites','archetype','clusterId','clusterIds']);
 const taskIds=new Set();
 const collectTaskIds=value=>{if(!value||typeof value!=='object')return;for(const [key,child]of Object.entries(value)){if(taskLists.has(key)&&Array.isArray(child))for(const row of child)if(typeof row?.id==='string')taskIds.add(row.id);collectTaskIds(child);}};
 collectTaskIds(payload);
 const isAsset=(value,key)=>/^(?:url|src|href|path|filePath|imagePath|assetPath)$/i.test(key)||/^(?:https?:\/\/|data:|file:\/\/|\/|\.\.?\/)/.test(value);
 const walk=(value,text,validate,key='',identityContainer=false,parentKey='')=>{
  if(separateNamespaces.has(key))return structuredClone(value);
  if(typeof value==='string'){
   if(taskReferenceFields.has(key)){if(!taskIds.has(value))throw Error('Unknown task reference: '+value);return value;}
   if((key==='id'&&taskLists.has(parentKey))||isAsset(value,key))return value;
   if(key==='suppliedBy'&&value==='none')return value;
   if(validate)validate(value,key,identityContainer||nativeLists.has(parentKey));return text(value,key,parentKey);
  }
  if(Array.isArray(value))return value.map(child=>walk(child,text,validate,key,identityContainer,parentKey));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>{
   if(validate&&nativeMaps.has(key)&&!Object.hasOwn(value,'id'))validate(k,'targetId',false);
   return [nativeMaps.has(key)&&!Object.hasOwn(value,'id')?text(k,'targetId'):k,walk(v,text,validate,k,identityContainer||k==='newStudentContent'||referenceField.test(k),key)];
  }));
  return value;
 };
 // Encode before constructing metadata, so the scope is exactly the supplied
 // view, not every question in the master. Canonical IDs never leave the closure.
 const encodeValidate=(value,key,inContainer)=>{
  if((referenceField.test(key)||(key==='id'&&inContainer))&&!forward.has(value))throw Error('Unknown canonical reference in '+key+': '+value);
 };
 const normalizeLabels=value=>{
  if(!value||typeof value!=='object')return;
  if(value.id&&entries.get(value.id)?.kind==='block'&&numbers[value.id]!=null&&value.content&&typeof value.content==='object')value.content.label=String(numbers[value.id]);
  for(const child of Object.values(value))normalizeLabels(child);
 };
 const printablePayload=structuredClone(payload);normalizeLabels(printablePayload);
 const encoded=walk(printablePayload,encodeText,encodeValidate);
 const ownerScope=new Set([...used].map(id=>nodeOwners.get(id)).filter(Boolean));
 if(proposedOrder!==undefined){
  if(!Array.isArray(proposedOrder)||new Set(proposedOrder).size!==proposedOrder.length||proposedOrder.some(id=>!ownerScope.has(id))||proposedOrder.length!==ownerScope.size)throw Error('Proposed order must permute all payload owners');
 }
 const resolution=resolveExerciseReferences(project);
 const dependencies=[];
 const addDependencies=(node,ownerId)=>{
  if(!node||typeof node!=='object')return;
  for(const [field,values]of [['dependsOn',node.dependsOn],['flow.dependsOn',node.flow?.dependsOn],['pairedBlockId',node.pairedBlockId?[node.pairedBlockId]:[]],['continuationOf',(node.flow?.continuationOf??node.continuationOf)?[node.flow?.continuationOf??node.continuationOf]:[]]])for(const targetId of values??[]){
   if(!forward.has(targetId))throw Error('Unknown project dependency: '+targetId);
   dependencies.push({ownerId:node.id??ownerId,targetId,kind:field});used.add(targetId);used.add(node.id??ownerId);
  }
  for(const child of Object.values(node))if(child&&typeof child==='object'){
   if(Array.isArray(child))for(const item of child)addDependencies(item,ownerId);
   else addDependencies(child,ownerId);
  }
 };
 for(const {block}of blocks)if(ownerScope.has(block.id)){addDependencies(block,block.id);addDependencies(block.content,block.id);}
 const literalReferences=resolution.records.filter(row=>ownerScope.has(row.ownerId));
 for(const row of literalReferences){used.add(row.ownerId);used.add(row.targetId);}
 const originalOrder=blocks.filter(({block})=>ownerScope.has(block.id)).map(({block})=>block.id);
 for(const id of [...used])if(nodeOwners.has(id))used.add(nodeOwners.get(id));
 const targets=[...entries].filter(([id])=>used.has(id)).map(([id,entry])=>({id,...entry}));
 const referenceContext={
  note:'Neutral task references identify native targets. displayNumber/exerciseNumber are current printed labels; partLabels preserve multipart labels. sequencePosition follows the saved booklet traversal. Literal question references remain unchanged and their resolved targets are listed separately. Do not infer printed labels from IDs or content.label.',
  targets,originalOrder,...(proposedOrder?{proposedOrder}:{}),dependencies,
  literalReferences:literalReferences.map(({ownerId,targetId,oldNumber,quote,field})=>({ownerId,targetId,printedNumber:oldNumber,quote,field})),
  referenceHolds:resolution.holds.filter(row=>ownerScope.has(row.id)),
 };
 const validate=(value,key,inNewContent)=>{
  for(const match of value.matchAll(neutralPattern))if(!reverse.has(match[0])||!used.has(reverse.get(match[0])))throw Error('Unknown review reference: '+match[0]);
  if(referenceField.test(key)||(key==='id'&&inNewContent)){
   if(!reverse.has(value)||!used.has(reverse.get(value)))throw Error('Expected known review reference in '+key+': '+value);
  }
 };
 const decodeText=value=>value.replace(neutralPattern,ref=>{if(!reverse.has(ref)||!used.has(reverse.get(ref)))throw Error('Unknown review reference: '+ref);return reverse.get(ref);});
 const resultEncodeText=(value,key)=>{
  const replace=id=>{if(!used.has(id))throw Error('Canonical reference outside review scope: '+id);return forward.get(id);};
  if((identityFields.has(key)||referenceField.test(key))&&forward.has(value))return replace(value);
  return reviewerProse.has(key)?replaceProse(value,replace):value;
 };
 return {payload:{...encoded,reviewReferences:walk(referenceContext,encodeText)},encode(value){
  return walk(value,resultEncodeText,(text,key,inContainer)=>{
   encodeValidate(text,key,inContainer);
   if((referenceField.test(key)||(key==='id'&&inContainer))&&!used.has(text))throw Error('Canonical reference outside review scope: '+text);
  });
 },decode(result){
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Expected review result object');
  // Validate keys as well as values; task-owned finding IDs (c1, f1) remain valid.
  const inspectKeys=value=>{if(!value||typeof value!=='object')return;for(const [key,child]of Object.entries(value)){decodeText(key);inspectKeys(child);}};
  inspectKeys(result);return walk(result,decodeText,validate);
 }};
}
