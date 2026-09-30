import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';

const withinQuestion=(target,id)=>target===id||target?.startsWith(id+'-');
const currentArtifacts=items=>Array.isArray(items)&&items.length>0&&items.every(a=>{
 try{return typeof a.path==='string'&&createHash('sha256').update(fs.readFileSync(a.path)).digest('hex')===a.hash;}catch{return false;}
});
// The packet's claim of resolution is not approval. Resolve only an explicitly
// cited, current workflow decision for this question, retaining the discrepancy.
export function approvedAnswerConflict(e,{workflow,page,packet,inventory}={}) {
 if(!e.conflict||!workflow||!Number.isInteger(page))return null;
 const cited=new Set(typeof e.conflict==='string'?(e.conflict.match(/[A-Za-z0-9_-]+/g)??[]):[e.conflict.correctionId,e.conflict.decisionId,e.conflict.resolutionId].filter(Boolean));
 // Grouping changes editable IDs. Resolve a source decision only through the
 // validated packet's explicit mappings into this exact whole question.
 const nodes=packet&&inventory?.pageNumber===page?contentNodes(packet):null;
 const sourceIds=new Set(nodes?(inventory.entries??[]).filter(i=>!i.exclusionReason&&['question','part'].includes(i.kind)&&(packet.inventoryMappings??[]).some(m=>m.inventoryId===i.id&&!m.exclusionReason&&!m.derived&&nodes.get(m.targetId)?.block?.id===e.questionId)).map(i=>i.id):[]);
 const owns=target=>withinQuestion(target,e.questionId)||sourceIds.has(target);
 for(const c of workflow.corrections??[])if(cited.has(c.id)&&c.status==='approved'&&c.reason?.trim()&&c.reviewer?.trim()&&currentArtifacts(c.evidence)&&c.patches?.some(p=>p.page===page&&owns(p.targetId)))return {decisionId:c.id,reason:c.reason,reviewer:c.reviewer,evidence:c.evidence};
 for(const id of cited){const i=workflow.issues?.[id];if(!i||i.page!==page||i.status!=='retained'||!i.resolution?.reason?.trim()||!i.resolution.reviewer?.trim()||!currentArtifacts(i.resolution.evidence))continue;
  let details={};try{details=JSON.parse(i.message);}catch{/* Plain source ambiguity uses entryId. */}
  if([i.entryId,i.targetId,details.questionId,details.entryId,...(details.questionIds??[]),...(details.entryIds??[])].some(owns))return {decisionId:id,reason:i.resolution.reason,reviewer:i.resolution.reviewer,evidence:i.resolution.evidence};
 }
 return null;
}

// Keep detailed per-item comparisons when converting generated metadata to the
// existing text field. Empty/malformed metadata is still an incomplete match.
export function answerMatchText(value) {
 if(typeof value==='string')return value;
 const comparisons=value?.individualPixelComparison;
 if(!Array.isArray(comparisons)||!comparisons.length||comparisons.some(row=>!String(row?.sourceLabel??'').trim()||typeof row?.comparison!=='string'||!row.comparison.trim()))return '';
 return JSON.stringify(value);
}

// Evidence completeness is separate from the reviewer checking the mathematics.
export function answerMatchingIssues(questionIds,evidence=[],teacherPages=[],review={}) {
 const issues=[],ids=new Set(questionIds);
 for(const e of evidence)if(!ids.has(e.questionId))issues.push('Unknown answer evidence question '+e.questionId);
 for(const id of ids){
  const rows=evidence.filter(e=>e.questionId===id);
  if(rows.length!==1){issues.push(id+': exactly one question answer-match record is required');continue;}
  const e=rows[0],refs=Array.isArray(e.teacherReference)?e.teacherReference:[e.teacherReference];
  const resolution=e.conflict&&approvedAnswerConflict(e,review);
  // A damaged/absent answer key has no honest teacher-page match. An explicit
  // reviewed source omission can establish provenance for independently derived
  // answers; it does not supply the separate mathematical-review acceptance.
  const reviewedOmission=e.status==='independently-derived'&&e.conflict?.kind==='source-answer-unavailable'&&Array.isArray(e.teacherReference)&&refs.length===0&&!!resolution;
  if(!answerMatchText(e.matchEvidence).trim())issues.push(id+': match the exercise, label and mathematical content');
  if(!reviewedOmission&&(!refs.length||refs.some(r=>!r||!teacherPages.includes(r.pdfPage)||!r.exercise?.trim()||!String(r.questionLabel??'').trim()||!String(r.printedPage??'').trim())))issues.push(id+': answer reference must identify a selected PDF page, printed page, exercise and question');
  if(e.missing||e.status==='missing'||e.conflict&&!resolution)issues.push(id+': unresolved answer match '+(typeof e.conflict==='string'?e.conflict:e.conflict?JSON.stringify(e.conflict):'missing'));
 }
 return issues;
}

// Authored solution figures are derived responses, not additional printed
// questions or imported answer-book/theory regions. Bind them to the existing
// independently inventoried whole question without changing that inventory.
export function derivedAnswerDiagramEntries(sections,entries,{groups:sourceGroups=[]}={}) {
 const mapped=new Set(entries.filter(e=>!e.exclusionReason).map(e=>e.targetId)),result=[];
 for(const block of sections.flatMap(s=>s.blocks??[]).filter(b=>b.type==='question')){
  // Authors may map the independently inventoried whole question to its native
  // content root. That root and the outer question block have the same ownership;
  // an arbitrary descendant part does not establish whole-question provenance.
  const source=entries.find(e=>!e.exclusionReason&&e.kind==='question'&&e.targetId===block.id)
   ??entries.find(e=>!e.exclusionReason&&e.kind==='question'&&e.targetId===block.content?.id);
  // A shared-stem root may group several independently numbered questions.
  // Bind each response to its own inventoried question only when the explicit
  // inventory parent belongs to that mapped group; an isolated part is not enough.
  // A group can map directly to its editable instruction paragraph. Locate
  // source-bearing prompts inside this question, excluding answer-only content.
  const promptTargets=new Set([block.id]);
  const promptIds=value=>{if(!value||typeof value!=='object')return;if(value.id)promptTargets.add(value.id);Object.values(value).forEach(promptIds);};
  const questionIds=node=>{if(!node)return;if(node.id)promptTargets.add(node.id);promptIds(node.prompt);for(const child of node.children??[])questionIds(child);};
  questionIds(block.content);
  // Native teaching activities also group independently inventoried tasks
  // under one source heading. The heading establishes the parent group only;
  // each derived figure still needs its own explicit source-question owner.
  const groups=new Set(entries.filter(e=>!e.exclusionReason&&(e.kind==='group'||block.pedagogyRole&&e.kind==='teaching')&&promptTargets.has(e.targetId)).map(e=>e.id));
  // Some original inventories store range instructions in their groups table,
  // separately from numbered entries. Use only a complete explicit membership
  // declaration; never invent a group entry or infer an arbitrary descendant.
  const responseTargets=new Set(),collectResponses=node=>{for(const child of node?.children??[]){if(child.id)responseTargets.add(child.id);collectResponses(child);}};
  collectResponses(block.content);const metadataOwners=new Set();
  for(const group of sourceGroups){
   const originalPage=group.sourceIdentity?.pdfPage??group.sourceReview?.sourceIdentity?.pdfPage,page=group.pageNumber??originalPage;
   const instruction=group.header??group.instruction;
   const target=!Object.hasOwn(group,'targetId')&&group.id===block.id&&group.sharedStemId===group.id?block.id:group.targetId;
   if(group.kind!=='practice'||group.exclusionReason||!group.id||typeof instruction!=='string'||!instruction.trim()||!promptTargets.has(target)||!Number.isInteger(page)||originalPage!==undefined&&originalPage!==page||!Array.isArray(group.items)||group.items.length<2||new Set(group.items).size!==group.items.length)continue;
   const members=group.items.map(id=>entries.find(e=>e.id===id&&!e.exclusionReason&&e.kind==='question'&&e.pageNumber===page&&e.sharedStemId===group.id&&(e.parentId===group.id||e.parentId===target)&&responseTargets.has(e.targetId)));
   if(members.some(member=>!member)||new Set(members.map(member=>member.targetId)).size!==members.length)continue;
   members.forEach(member=>metadataOwners.add(member));
  }
  const visit=(node,owner=source)=>{
   if(groups.size||metadataOwners.size)owner=entries.find(e=>!e.exclusionReason&&e.kind==='question'&&e.targetId===node?.id&&(metadataOwners.has(e)||groups.has(e.parentId)||groups.has(e.sharedStemId)))??owner;
   for(const diagram of [...(node?.answer?.solutionDiagrams??[]),...(node?.sharedSolutionDiagrams??[])]){
    if(!diagram.id)throw Error('Authored answer diagram requires a stable identity: '+block.id);
    if(mapped.has(diagram.id))continue;
    if(!owner)throw Error('Authored answer diagram requires an inventoried source question: '+block.id);
    result.push({id:block.id+'-derived-answer-'+diagram.id,kind:'answer-diagram',targetId:diagram.id,pageNumber:owner.pageNumber,derived:true,derivedFrom:owner.id,sourceQuestionId:block.id,responseId:node.id,description:'Editable authored solution diagram for the independently inventoried question; verify against its mathematical task and answer reference.',derivationReason:'Derived solution content, not a separate printed source diagram or imported teaching region.'});
    mapped.add(diagram.id);
   }
   for(const child of node?.children??[])visit(child,owner);
  };
  visit(block.content);
 }
 return result;
}
