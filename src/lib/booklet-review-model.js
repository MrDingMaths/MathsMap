import { contentSource, isDocument, normalizeDocument } from './document-content.js';
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const id = () => globalThis.crypto?.randomUUID?.() ?? `edit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function studioProject(raw) {
  const project=copy(raw);
  if(project.studio?.version && project.studio.version!==1)throw new Error('Unsupported Studio version');
  project.studio={version:1,atoms:{},lineage:{},flags:[],...project.studio};
  return project;
}
export function reviewTargets(project) {
  const result=[];
  for(const section of project.sections ?? []) for(const block of section.blocks ?? []) {
    result.push({id:block.id,node:block,block,section,kind:'block'});
    const visit=node=>{if(!node)return;result.push({id:node.id,node,block,section,kind:node.children?.length?'group':'part'});(node.children??[]).forEach(visit);};
    if(block.type==='question')visit(block.content);
  }
  return result;
}
export const targetById=(project,targetId)=>reviewTargets(project).find(t=>t.id===targetId);
export function findEditableDiagram(node, diagramId, path='') {
  if (!node || typeof node !== 'object') return null;
  if (node.id===diagramId && (node.format || node.type==='image')) return {diagram:node,path};
  for (const [key,value] of Object.entries(node)) {
    if (['source','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','spec'].includes(key)) continue;
    const found=findEditableDiagram(value,diagramId,path+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1'));
    if (found) return found;
  }
  return null;
}
function pointer(node,path) {
  const parts=String(path).split('/').slice(1).map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'));
  if(!parts.length || parts.some(p=>['__proto__','prototype','constructor','id','source','bankRef','canonicalId'].includes(p)))throw new Error('Protected or invalid edit path');
  let owner=node;for(const key of parts.slice(0,-1)){if(!owner || !Object.hasOwn(owner,key))throw new Error('Edit path no longer exists');owner=owner[key];}
  if(!owner || typeof owner!=='object')throw new Error('Edit path no longer exists');
  return {owner,key:parts.at(-1)};
}
function buildEditFields(project,changes) {
  const operations=changes.map(change=>{
    const target=targetById(project,change.targetId);if(!target)throw new Error('Unknown edit target');
    if(change.kind==='mapping') return {id:id(),kind:'mapping',targetId:change.targetId,before:copy(project.studio?.atoms?.[change.targetId] ?? {}),after:copy(change.after),};
    const {owner,key}=pointer(target.node,change.path);
    return {id:id(),kind:'field',targetId:change.targetId,path:change.path,before:copy(owner[key]),after:copy(change.after),};
  });
  return {operations};
}
function changeOperation(p,operation) {
  const expected=operation.before, replacement=copy(operation.after);
  if(operation.kind==='section-blocks') {
    for(const item of expected)if(!same(p.sections.find(s=>s.id===item.id)?.blocks,item.blocks))throw new Error('A continuation section changed since this edit');
    for(const item of replacement)p.sections.find(s=>s.id===item.id).blocks=item.blocks;
    for(const [targetId,sourceIds] of Object.entries(operation.lineage??{}))p.studio.lineage[targetId]={sourceIds,editId:operation.id};
    return;
  }
  if(operation.kind==='blocks') {
    const section=p.sections.find(s=>s.id===operation.sectionId);if(!section)throw new Error('Section removed');
    const i=section.blocks.findIndex(b=>b.id===expected[0]?.id);
    if(i<0||!same(section.blocks.slice(i,i+expected.length),expected))throw new Error('Structural edit overlaps changed or reordered blocks');
    section.blocks.splice(i,expected.length,...replacement);
    for(const block of replacement)p.studio.lineage[block.id]={sourceIds:operation.sourceIds,editId:operation.id};
    return;
  }
  if(operation.kind==='mapping') {
    if(!targetById(p,operation.targetId))throw new Error('Mapping target removed');
    if(!same(p.studio.atoms[operation.targetId]??{},expected))throw new Error('Mapping changed since edit');
    p.studio.atoms[operation.targetId]=replacement;return;
  }
  if(operation.kind!=='field')throw new Error('Unsupported edit operation');
  const target=targetById(p,operation.targetId);if(!target)throw new Error('Edit target removed');
  const {owner,key}=pointer(target.node,operation.path);
  if(!same(owner[key],expected))throw new Error('Fields changed during this edit');
  owner[key]=replacement;
  for(const [targetId,sourceIds] of Object.entries(operation.lineage??{}))p.studio.lineage[targetId]={sourceIds,editId:operation.id};
}
function applyEdit(project, edit) {
  const next = studioProject(project);
  for (const operation of edit.operations) changeOperation(next, operation);
  return next;
}
function buildSplitTheory(project,blockId) {
  const target=targetById(project,blockId), block=target?.block;
  if(!block || !['rich-text','callout'].includes(block.type))throw new Error('Split a text/theory block. Question parts retain their shared stem and are audited individually.');
  const parts=isDocument(block.content)?block.content.blocks:contentSource(block.content).split(/\n\s*\n/);
  if(parts.length<2)throw new Error('Add a paragraph boundary at the intended split first');
  const middle=Math.ceil(parts.length/2), content=items=>isDocument(block.content)?normalizeDocument({...block.content,blocks:items}):items.join('\n\n');
  const after=[{...copy(block),id:id(),content:content(parts.slice(0,middle))},{...copy(block),id:id(),content:content(parts.slice(middle))}];
  return {operations:[{id:id(),kind:'blocks',sectionId:target.section.id,before:[copy(block)],after,sourceIds:[block.id],}]};
}
// Split teaching groups inside a question, retaining the parent stem and diagrams.
// Every child keeps its identity and relative order, including dependent parts.
function buildSplitQuestionParts(project,targetId,at=null) {
  const target=targetById(project,targetId),node=target?.node;
  if(target?.block.type!=='question'||!node.children?.length)throw new Error('Select a question or group with at least two parts');
  const boundary=at??Math.ceil(node.children.length/2);
  if(!Number.isInteger(boundary)||boundary<1||boundary>=node.children.length)throw new Error('Choose a split between existing parts');
  if(questionDepth(target.block.content)>=5)throw new Error('This question already uses the supported five nesting levels');
  const groups=[node.children.slice(0,boundary),node.children.slice(boundary)].map(children=>({id:id(),type:'group',label:null,prompt:'',layout:'list',columns:null,questionDiagrams:[],children:copy(children)}));
  const edit=buildEditFields(project,[{targetId,path:'/children',after:groups}]);
  edit.operations[0].lineage=Object.fromEntries(groups.map(g=>[g.id,[targetId,...g.children.map(c=>c.id)]]));return edit;
}
function buildMergeQuestionParts(project,targetId) {
  const target=targetById(project,targetId);if(target?.block.type!=='question')throw new Error('Select a question part or teaching group');
  const parent=reviewTargets(project).find(t=>t.node.children?.some(c=>c.id===targetId));
  if(!parent)throw new Error('Select the first of two adjacent parts to group');
  const children=parent.node.children,index=children.findIndex(c=>c.id===targetId),pair=children.slice(index,index+2);
  if(pair.length!==2)throw new Error('There is no following part to group');
  if(questionDepth(target.block.content)>=5)throw new Error('This question already uses the supported five nesting levels');
  const group={id:id(),type:'group',label:null,prompt:'',layout:'list',columns:null,questionDiagrams:[],children:copy(pair)};
  const edit=buildEditFields(project,[{targetId:parent.id,path:'/children',after:[...copy(children.slice(0,index)),group,...copy(children.slice(index+2))]}]);
  edit.operations[0].lineage={[group.id]:pair.map(n=>n.id)};return edit;
}
function questionDepth(node){return node.children?.length?1+Math.max(...node.children.map(questionDepth)):0;}
function buildMergeQuestionContinuation(project,blockId) {
  const blocks=project.sections.flatMap(section=>section.blocks.map(block=>({section,block}))),index=blocks.findIndex(t=>t.block.id===blockId);
  const left=blocks[index],right=blocks[index+1];
  if(!left||left.block.type!=='question'||right?.block.type!=='question')throw new Error('Select the first of two adjacent question blocks, including across a page boundary.');
  if(Math.max(questionDepth(left.block.content),questionDepth(right.block.content))>=5)throw new Error('Grouping this continuation would exceed five nesting levels.');
  const shared=same(left.block.content.prompt,right.block.content.prompt);
  const children=[left.block.content,right.block.content].map(node=>({...copy(node),type:'group',...(shared?{prompt:''}:{})}));
  const merged={...copy(left.block),content:{id:id(),type:'question',prompt:shared?copy(left.block.content.prompt):'',layout:'list',columns:null,questionDiagrams:[],children},continuationSources:[...(left.block.continuationSources??[left.block.id]),...(right.block.continuationSources??[right.block.id])]};
  const sections=[...new Set([left.section.id,right.section.id])];
  const before=sections.map(sectionId=>({id:sectionId,blocks:copy(project.sections.find(s=>s.id===sectionId).blocks)}));
  const after=before.map(section=>({...section,blocks:section.blocks.filter(b=>b.id!==right.block.id).map(b=>b.id===left.block.id?merged:b)}));
  return {operations:[{id:id(),kind:'section-blocks',targetId:blockId,sourceIds:[left.block.id,right.block.id],before,after,lineage:{[merged.id]:merged.continuationSources,[merged.content.id]:[left.block.content.id,right.block.content.id]},}]};
}
function buildMergeTheory(project,blockId) {
  const target=targetById(project,blockId);if(!target)throw new Error('Select theory to merge');
  const blocks=target.section.blocks,i=blocks.findIndex(b=>b.id===blockId),left=blocks[i],right=blocks[i+1];
  if(!right||left.type!==right.type||!['rich-text','callout'].includes(left.type))throw new Error('Select adjacent theory blocks of the same kind');
  if((left.title??'')!==(right.title??''))throw new Error('The blocks have different headings; reconcile those headings before merging');
  if(isDocument(left.content)!==isDocument(right.content))throw new Error('Convert both blocks to the same document format before merging');
  const content=isDocument(left.content)?normalizeDocument({...left.content,blocks:[...left.content.blocks,...right.content.blocks]}):[left.content,right.content].join('\n\n');
  return {operations:[{id:id(),kind:'blocks',sectionId:target.section.id,before:copy([left,right]),after:[{...copy(left),id:id(),content}],sourceIds:[left.id,right.id],}]};
}

export function editFields(project, ...args) { return applyEdit(project, buildEditFields(project, ...args)); }

export function splitTheory(project, ...args) { return applyEdit(project, buildSplitTheory(project, ...args)); }

export function mergeTheory(project, ...args) { return applyEdit(project, buildMergeTheory(project, ...args)); }

export function splitQuestionParts(project, ...args) { return applyEdit(project, buildSplitQuestionParts(project, ...args)); }

export function mergeQuestionParts(project, ...args) { return applyEdit(project, buildMergeQuestionParts(project, ...args)); }

export function mergeQuestionContinuation(project, ...args) { return applyEdit(project, buildMergeQuestionContinuation(project, ...args)); }
