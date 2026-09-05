import { contentSource, isDocument, normalizeDocument } from './document-content.js';
const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const id = () => globalThis.crypto?.randomUUID?.() ?? `proposal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const REVIEW_KINDS = ['content','mapping','sequence','layout'];
export function studioProject(raw) {
  const project=copy(raw);
  if(project.studio?.version && project.studio.version!==1)throw new Error('Unsupported Studio review version');
  project.studio={version:1,atoms:{},approvals:{},proposals:[],lineage:{},flags:[],metrics:[],...project.studio};
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
const LAYOUT_KEYS=new Set(['presentation','layout','columns','widthMm','heightMm','answerSpaceMm','tableStyle','settings','spaceBefore','spaceAfter','lineHeight','indent','align','width','crop','padding','border','widths','colspan','rowspan','arrangement','rotation','fontSize']);
function withoutLayout(value) {
  if(Array.isArray(value))return value.map(withoutLayout);
  if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!LAYOUT_KEYS.has(k)).map(([k,v])=>[k,withoutLayout(v)]));
  return value;
}
function fingerprint(project,targetId,kind) {
  const target=targetById(project,targetId); if(!target)return null;
  if(kind==='mapping')return copy(project.studio?.atoms?.[targetId] ?? {});
  if(kind==='sequence')return project.sections.map(s=>({id:s.id,blocks:s.blocks.map(b=>b.id)}));
  return kind==='content'?withoutLayout(target.node):{node:copy(target.node),settings:copy(project.settings)};
}
export function approvalCurrent(project,targetId,kind) {
  const approval=project.studio?.approvals?.[targetId]?.[kind];
  return approval?.accepted===true && same(approval.fingerprint,fingerprint(project,targetId,kind));
}
export function approveTarget(raw,targetId,kind,accepted=true) {
  if(!REVIEW_KINDS.includes(kind)||!targetById(raw,targetId))throw new Error('Unknown review target or approval kind');
  const p=studioProject(raw);
  const related=new Set(reviewTargets(p).filter(t=>t.id===targetId || t.block.id===targetId).map(t=>t.id));
  if(accepted && p.studio.flags.some(f=>!f.resolved && related.has(f.targetId)))throw new Error('Resolve this target’s flags before approving it');
  p.studio.approvals[targetId]??={};
  p.studio.approvals[targetId][kind]={accepted,revision:p.revision,at:new Date().toISOString(),fingerprint:fingerprint(p,targetId,kind)};
  return p;
}
export function reconcileApprovals(before,raw) {
  const p=studioProject(raw);
  const changedDependencies=new Set();
  for(const target of reviewTargets(before)) {
    const contentChanged=!same(fingerprint(before,target.id,'content'),fingerprint(p,target.id,'content'));
    const mappingChanged=!same(fingerprint(before,target.id,'mapping'),fingerprint(p,target.id,'mapping'));
    const sequenceChanged=!same(fingerprint(before,target.id,'sequence'),fingerprint(p,target.id,'sequence'));
    const layoutChanged=!same(fingerprint(before,target.id,'layout'),fingerprint(p,target.id,'layout'));
    if(contentChanged || mappingChanged) { changedDependencies.add(target.id); for(const skill of before.studio?.atoms?.[target.id]?.skillIds??[])changedDependencies.add(skill); }
    for(const kind of REVIEW_KINDS) if(contentChanged || mappingChanged && ['mapping','sequence'].includes(kind) || sequenceChanged && ['sequence','layout'].includes(kind) || layoutChanged && kind==='layout') {
      if(p.studio.approvals[target.id]?.[kind])p.studio.approvals[target.id][kind].accepted=false;
    }
  }
  let added=true;
  while(added){added=false;for(const [targetId,atom] of Object.entries(p.studio.atoms))if(!changedDependencies.has(targetId) && (atom.prerequisiteIds??[]).some(key=>changedDependencies.has(key))){changedDependencies.add(targetId);added=true;for(const kind of ['sequence','layout'])if(p.studio.approvals[targetId]?.[kind])p.studio.approvals[targetId][kind].accepted=false;}}
  return p;
}
function pointer(node,path) {
  const parts=String(path).split('/').slice(1).map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'));
  if(!parts.length || parts.some(p=>['__proto__','prototype','constructor','id','source','bankRef','canonicalId'].includes(p)))throw new Error('Protected or invalid proposal path');
  let owner=node;for(const key of parts.slice(0,-1)){if(!owner || !Object.hasOwn(owner,key))throw new Error('Proposal path no longer exists');owner=owner[key];}
  if(!owner || typeof owner!=='object')throw new Error('Proposal path no longer exists');
  return {owner,key:parts.at(-1)};
}
export function proposalForFields(project,changes,reason='Reviewed revision') {
  const operations=changes.map(change=>{
    const target=targetById(project,change.targetId);if(!target)throw new Error('Unknown proposal target');
    if(change.kind==='mapping') return {id:id(),groupId:change.groupId??null,kind:'mapping',targetId:change.targetId,before:copy(project.studio?.atoms?.[change.targetId] ?? {}),after:copy(change.after),reason:change.reason??reason,status:'pending'};
    const {owner,key}=pointer(target.node,change.path);
    return {id:id(),groupId:change.groupId??null,kind:'field',targetId:change.targetId,path:change.path,before:copy(owner[key]),after:copy(change.after),reason:change.reason??reason,status:'pending'};
  });
  return {id:id(),format:'mathsmap-studio-proposal-v1',baseRevision:project.revision,reason,createdAt:new Date().toISOString(),operations};
}
export function addProposal(raw,proposal) {
  const p=studioProject(raw);
  if(proposal.format!=='mathsmap-studio-proposal-v1'||!Array.isArray(proposal.operations)||!proposal.operations.length)throw new Error('Invalid revision proposal');
  if(p.studio.proposals.some(x=>x.id===proposal.id))throw new Error('Proposal already exists');
  p.studio.proposals.push(copy(proposal));return p;
}
function changeOperation(p,operation,undo=false) {
  const expected=undo?operation.after:operation.before, replacement=copy(undo?operation.before:operation.after);
  if(operation.kind==='section-blocks') {
    for(const item of expected)if(!same(p.sections.find(s=>s.id===item.id)?.blocks,item.blocks))throw new Error('A continuation section changed since this proposal');
    for(const item of replacement)p.sections.find(s=>s.id===item.id).blocks=item.blocks;
    for(const [targetId,sourceIds] of Object.entries(operation.lineage??{}))p.studio.lineage[targetId]={sourceIds,proposalId:operation.id};
    return;
  }
  if(operation.kind==='candidate-section') {
    const index=p.sections.findIndex(s=>s.id===operation.after.id),current=index<0?null:p.sections[index];
    if(!same(current,expected))throw new Error('Candidate section has changed since this proposal');
    if(undo)p.sections.splice(index,1);else p.sections.push(replacement);
    return;
  }
  if(operation.kind==='blocks') {
    const section=p.sections.find(s=>s.id===operation.sectionId);if(!section)throw new Error('Section removed');
    const i=section.blocks.findIndex(b=>b.id===expected[0]?.id);
    if(i<0||!same(section.blocks.slice(i,i+expected.length),expected))throw new Error('Structural edit overlaps changed or reordered blocks');
    section.blocks.splice(i,expected.length,...replacement);
    for(const block of replacement)p.studio.lineage[block.id]={sourceIds:operation.sourceIds,proposalId:operation.id};
    return;
  }
  if(operation.kind==='mapping') {
    if(!targetById(p,operation.targetId))throw new Error('Mapping target removed');
    if(!same(p.studio.atoms[operation.targetId]??{},expected))throw new Error('Mapping changed since proposal');
    p.studio.atoms[operation.targetId]=replacement;return;
  }
  if(operation.kind!=='field')throw new Error('Unsupported proposal operation');
  const target=targetById(p,operation.targetId);if(!target)throw new Error('Proposal target removed');
  const {owner,key}=pointer(target.node,operation.path);
  if(!same(owner[key],expected))throw new Error('Saved edit conflicts with proposal');
  owner[key]=replacement;
  for(const [targetId,sourceIds] of Object.entries(operation.lineage??{}))p.studio.lineage[targetId]={sourceIds,proposalId:operation.id};
}
export function decideProposal(raw,proposalId,operationIds,decision='accept') {
  const p=studioProject(raw), proposal=p.studio.proposals.find(x=>x.id===proposalId);
  if(!proposal)throw new Error('Proposal not found');
  const ids=new Set(operationIds), selected=proposal.operations.filter(op=>ids.has(op.id));
  if(!selected.length)throw new Error('Select a change');
  for(const op of selected)if(op.groupId)for(const sibling of proposal.operations.filter(x=>x.groupId===op.groupId))ids.add(sibling.id);
  const operations=proposal.operations.filter(op=>ids.has(op.id));
  const undo=decision==='undo';
  if(operations.some(op=>undo?op.status!=='accepted':op.status!=='pending'))throw new Error('Change is no longer eligible for this decision');
  if(decision!=='reject')for(const operation of undo?[...operations].reverse():operations)changeOperation(p,operation,undo);
  for(const operation of operations){operation.status=undo?'undone':decision==='reject'?'rejected':'accepted';operation.decidedAt=new Date().toISOString();}
  p.studio.metrics.push({type:'proposal',decision,count:operations.length,at:new Date().toISOString()});
  return reconcileApprovals(raw,p);
}
export function splitTheoryProposal(project,blockId) {
  const target=targetById(project,blockId), block=target?.block;
  if(!block || !['rich-text','callout'].includes(block.type))throw new Error('Split a text/theory block. Question parts retain their shared stem and are audited individually.');
  const parts=isDocument(block.content)?block.content.blocks:contentSource(block.content).split(/\n\s*\n/);
  if(parts.length<2)throw new Error('Add a paragraph boundary at the intended split first');
  const middle=Math.ceil(parts.length/2), content=items=>isDocument(block.content)?normalizeDocument({...block.content,blocks:items}):items.join('\n\n');
  const after=[{...copy(block),id:id(),content:content(parts.slice(0,middle))},{...copy(block),id:id(),content:content(parts.slice(middle))}];
  return {id:id(),format:'mathsmap-studio-proposal-v1',baseRevision:project.revision,reason:'Split theory at a paragraph boundary; review both resulting atoms.',operations:[{id:id(),kind:'blocks',sectionId:target.section.id,before:[copy(block)],after,sourceIds:[block.id],status:'pending'}]};
}
// Split teaching groups inside a question, retaining the parent stem and diagrams.
// Every child keeps its identity and relative order, including dependent parts.
export function splitQuestionPartsProposal(project,targetId,at=null) {
  const target=targetById(project,targetId),node=target?.node;
  if(target?.block.type!=='question'||!node.children?.length)throw new Error('Select a question or group with at least two parts');
  const boundary=at??Math.ceil(node.children.length/2);
  if(!Number.isInteger(boundary)||boundary<1||boundary>=node.children.length)throw new Error('Choose a split between existing parts');
  if(questionDepth(target.block.content)>=5)throw new Error('This question already uses the supported five nesting levels');
  const groups=[node.children.slice(0,boundary),node.children.slice(boundary)].map(children=>({id:id(),type:'group',label:null,prompt:'',layout:'list',columns:null,questionDiagrams:[],children:copy(children)}));
  const proposal=proposalForFields(project,[{targetId,path:'/children',after:groups}],'Split teaching groups; shared stem, diagrams and dependent parts remain together.');
  proposal.operations[0].lineage=Object.fromEntries(groups.map(g=>[g.id,[targetId,...g.children.map(c=>c.id)]]));return proposal;
}
export function mergeQuestionPartsProposal(project,targetId) {
  const target=targetById(project,targetId);if(target?.block.type!=='question')throw new Error('Select a question part or teaching group');
  const parent=reviewTargets(project).find(t=>t.node.children?.some(c=>c.id===targetId));
  if(!parent)throw new Error('Select the first of two adjacent parts to group');
  const children=parent.node.children,index=children.findIndex(c=>c.id===targetId),pair=children.slice(index,index+2);
  if(pair.length!==2)throw new Error('There is no following part to group');
  if(questionDepth(target.block.content)>=5)throw new Error('This question already uses the supported five nesting levels');
  const group={id:id(),type:'group',label:null,prompt:'',layout:'list',columns:null,questionDiagrams:[],children:copy(pair)};
  const proposal=proposalForFields(project,[{targetId:parent.id,path:'/children',after:[...copy(children.slice(0,index)),group,...copy(children.slice(index+2))]}],'Merge adjacent teaching parts into one group; preserve both prompts, answers, diagrams and identities.');
  proposal.operations[0].lineage={[group.id]:pair.map(n=>n.id)};return proposal;
}
function questionDepth(node){return node.children?.length?1+Math.max(...node.children.map(questionDepth)):0;}
export function mergeQuestionContinuationProposal(project,blockId) {
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
  return {id:id(),format:'mathsmap-studio-proposal-v1',baseRevision:project.revision,reason:'Join the next question continuation. Preserve both part groups, diagrams and source identities; review the combined question before reuse.',operations:[{id:id(),kind:'section-blocks',targetId:blockId,sourceIds:[left.block.id,right.block.id],before,after,lineage:{[merged.id]:merged.continuationSources,[merged.content.id]:[left.block.content.id,right.block.content.id]},status:'pending'}]};
}
export function publicationBlockers(project,blockIds) {
  if(!project.studio)return [];
  const wanted=new Set(blockIds),targets=reviewTargets(project).filter(t=>wanted.has(t.block.id)),blockers=[];
  for(const target of targets)for(const kind of REVIEW_KINDS)if(!approvalCurrent(project,target.id,kind))blockers.push(`${target.node.label??target.id}: ${kind} review required`);
  for(const flag of project.studio.flags??[])if(!flag.resolved&&targets.some(t=>t.id===flag.targetId))blockers.push(flag.note);
  return blockers;
}
export function proposalConflict(project,operation) {
  if(operation.status!=='pending')return '';
  try{changeOperation(studioProject(project),operation);return '';}catch(error){return error.message;}
}
export function mergeTheoryProposal(project,blockId) {
  const target=targetById(project,blockId);if(!target)throw new Error('Select theory to merge');
  const blocks=target.section.blocks,i=blocks.findIndex(b=>b.id===blockId),left=blocks[i],right=blocks[i+1];
  if(!right||left.type!==right.type||!['rich-text','callout'].includes(left.type))throw new Error('Select adjacent theory blocks of the same kind');
  if((left.title??'')!==(right.title??''))throw new Error('The blocks have different headings; reconcile those headings before merging');
  if(isDocument(left.content)!==isDocument(right.content))throw new Error('Convert both blocks to the same document format before merging');
  const content=isDocument(left.content)?normalizeDocument({...left.content,blocks:[...left.content.blocks,...right.content.blocks]}):[left.content,right.content].join('\n\n');
  return {id:id(),format:'mathsmap-studio-proposal-v1',baseRevision:project.revision,reason:'Merge adjacent theory while preserving both source identities.',operations:[{id:id(),kind:'blocks',sectionId:target.section.id,before:copy([left,right]),after:[{...copy(left),id:id(),content}],sourceIds:[left.id,right.id],status:'pending'}]};
}
