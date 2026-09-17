import fs from 'node:fs';
import {createHash} from 'node:crypto';

const withinQuestion=(target,id)=>target===id||target?.startsWith(id+'-');
const currentArtifacts=items=>Array.isArray(items)&&items.length>0&&items.every(a=>{
 try{return typeof a.path==='string'&&createHash('sha256').update(fs.readFileSync(a.path)).digest('hex')===a.hash;}catch{return false;}
});
// The packet's claim of resolution is not approval. Resolve only an explicitly
// cited, current workflow decision for this question, retaining the discrepancy.
export function approvedAnswerConflict(e,{workflow,page}={}) {
 if(!e.conflict||!workflow||!Number.isInteger(page))return null;
 const cited=new Set(typeof e.conflict==='string'?(e.conflict.match(/[A-Za-z0-9_-]+/g)??[]):[e.conflict.correctionId,e.conflict.decisionId].filter(Boolean));
 for(const c of workflow.corrections??[])if(cited.has(c.id)&&c.status==='approved'&&c.reason?.trim()&&c.reviewer?.trim()&&currentArtifacts(c.evidence)&&c.patches?.some(p=>p.page===page&&withinQuestion(p.targetId,e.questionId)))return {decisionId:c.id,reason:c.reason,reviewer:c.reviewer,evidence:c.evidence};
 for(const id of cited){const i=workflow.issues?.[id];if(!i||i.page!==page||i.status!=='retained'||!i.resolution?.reason?.trim()||!i.resolution.reviewer?.trim()||!currentArtifacts(i.resolution.evidence))continue;
  let details={};try{details=JSON.parse(i.message);}catch{/* Plain source ambiguity uses entryId. */}
  if([i.entryId,i.targetId,...(details.questionIds??[]),...(details.entryIds??[])].some(t=>withinQuestion(t,e.questionId)))return {decisionId:id,reason:i.resolution.reason,reviewer:i.resolution.reviewer,evidence:i.resolution.evidence};
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
  const source=entries.find(e=>!e.exclusionReason&&e.targetId===block.id);
  const visit=node=>{
   for(const diagram of node?.answer?.solutionDiagrams??[]){
    if(!diagram.id)throw Error('Authored answer diagram requires a stable identity: '+block.id);
    if(mapped.has(diagram.id))continue;
    if(!source)throw Error('Authored answer diagram requires an inventoried source question: '+block.id);
    result.push({id:block.id+'-derived-answer-'+diagram.id,kind:'answer-diagram',targetId:diagram.id,pageNumber:source.pageNumber,derived:true,derivedFrom:source.id,sourceQuestionId:block.id,responseId:node.id,description:'Editable authored solution diagram for the independently inventoried question; verify against its mathematical task and answer reference.',derivationReason:'Derived solution content, not a separate printed source diagram or imported teaching region.'});
    mapped.add(diagram.id);
   }
   for(const child of node?.children??[])visit(child);
  };
  visit(block.content);
 }
 return result;
}
