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

// Evidence completeness is separate from the reviewer checking the mathematics.
export function answerMatchingIssues(questionIds,evidence=[],teacherPages=[],review={}) {
 const issues=[],ids=new Set(questionIds);
 for(const e of evidence)if(!ids.has(e.questionId))issues.push('Unknown answer evidence question '+e.questionId);
 for(const id of ids){
  const rows=evidence.filter(e=>e.questionId===id);
  if(rows.length!==1){issues.push(id+': exactly one question answer-match record is required');continue;}
  const e=rows[0],refs=Array.isArray(e.teacherReference)?e.teacherReference:[e.teacherReference];
  if(!e.matchEvidence?.trim())issues.push(id+': match the exercise, label and mathematical content');
  if(!refs.length||refs.some(r=>!r||!teacherPages.includes(r.pdfPage)||!r.exercise?.trim()||!String(r.questionLabel??'').trim()||!String(r.printedPage??'').trim()))issues.push(id+': answer reference must identify a selected PDF page, printed page, exercise and question');
  if(e.missing||e.status==='missing'||e.conflict&&!approvedAnswerConflict(e,review))issues.push(id+': unresolved answer match '+(typeof e.conflict==='string'?e.conflict:e.conflict?JSON.stringify(e.conflict):'missing'));
 }
 return issues;
}

// Authored solution figures are derived responses, not additional printed
// questions or imported answer-book/theory regions. Bind them to the existing
// independently inventoried whole question without changing that inventory.
export function derivedAnswerDiagramEntries(sections,entries) {
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
  const groups=new Set(entries.filter(e=>!e.exclusionReason&&e.kind==='group'&&promptTargets.has(e.targetId)).map(e=>e.id));
  const visit=(node,owner=source)=>{
   if(groups.size)owner=entries.find(e=>!e.exclusionReason&&e.kind==='question'&&e.targetId===node?.id&&(groups.has(e.parentId)||groups.has(e.sharedStemId)))??owner;
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
