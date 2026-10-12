import {hashText} from './practice-question-model.js';
import {isTheoryReview} from './question-bank-eligibility.js';

// Read student-facing prompts only. Answers, quoted feedback and provenance are
// review data and must not manufacture a dependency.
export function promptText(value) {
 if(typeof value==='string')return value.replace(/\[tikz\][\s\S]*?\[\/tikz\]|\$\$[\s\S]*?\$\$|\$[^$]*\$/g,' ');
 if(!value||typeof value!=='object')return '';
 if(Array.isArray(value))return value.map(promptText).join(' ');
 return [promptText(value.text??''),...['blocks','inlines','slots','rows'].map(key=>promptText(value[key]))].join(' ').replace(/\s+/g,' ').trim();
}
export const dependencySignature=block=>hashText(JSON.stringify([block.content,block.dependsOn??[],block.pairedBlockId??null]));
const nodes=root=>root?[root,...(root.children??[]).flatMap(nodes)]:[];
const crossQuestion=/(?:\b(?:previous|preceding|earlier|next)\s+questions?\b|\bquestions?\s+(?:above|below)\b|\b(?:notation|graph|table|diagram|result|answer|method)\s+(?:as\s+)?above\b|\bas above\b|\b(?:questions?\s*\d+|Q\s*\d+)\b)/gi;

export function questionDependencyFindings(project) {
 const result=[];
 for(const section of project.sections??[]) {
  const blocks=section.blocks??[];
  for(let index=0;index<blocks.length;index++) {
   const block=blocks[index];if(block.type!=='question'||isTheoryReview(block,section)||section.phase!=='practice')continue;
   const owned=new Set();const collect=value=>{if(!value||typeof value!=='object')return;if(value.id)owned.add(value.id);Object.values(value).forEach(collect);};collect(block.content);
   // flow.continuationOf joins pagination fragments of an existing question;
   // it is not itself evidence that the fragment lacks mathematical givens.
   const external=[...new Set([block,...nodes(block.content)].flatMap(n=>[...(n.dependsOn??[]),n.pairedBlockId].filter(id=>id&&!owned.has(id)&&id!==block.id)))];
   const ordered=nodes(block.content);
   const hasTable=value=>value&&typeof value==='object'&&(value.type==='table'||Object.values(value).some(hasTable));
   const references=ordered.flatMap((node,nodeIndex)=>{
    const text=promptText(node.prompt);
    return [...text.matchAll(crossQuestion)].filter(match=>{
     const before=ordered.slice(0,nodeIndex);
     if(/^(?:graph|diagram)\s+(?:as\s+)?above$/i.test(match[0])&&[...before,node].some(n=>n.questionDiagrams?.length))return false;
     if(/^table\s+(?:as\s+)?above$/i.test(match[0])&&before.some(n=>hasTable(n.prompt)))return false;
     if(/previous questions/i.test(match[0])&&nodeIndex>1&&/two previous questions/i.test(text))return false;
     return true;
    }).map(match=>({nodeId:node.id,reference:match[0],prompt:text}));
   });
   if(!external.length&&!references.length)continue;
   const review=block.sourceReview?.bankDependencyReview;
   const contentExternal=nodes(block.content).some(n=>(n.dependsOn??[]).some(id=>!owned.has(id))||n.pairedBlockId&&!owned.has(n.pairedBlockId));
   const reviewed=!contentExternal&&review?.decision==='self-contained'&&review.signature===dependencySignature(block)&&typeof review.note==='string'&&review.note.trim().length>=20;
   result.push({projectId:project.id,sectionId:section.id,blockId:block.id,previousBlockId:blocks[index-1]?.id??null,bankId:block.bankRef?.id??null,external,references,reviewed});
  }
 }
 return result;
}
export function assertBankQuestionDependencies(project,{blockIds}={}) {
 const selected=blockIds?new Set(blockIds):null;
 const findings=questionDependencyFindings(project).filter(f=>(!selected||selected.has(f.blockId))&&!f.reviewed);
 if(findings.length)throw Object.assign(new Error('Question-bank dependency review required: '+findings.map(f=>f.blockId+' ('+(f.external.length?'external dependency '+f.external.join(', '):f.references.map(r=>r.reference).join('; '))+')').join(', ')+'. Append dependent follow-ups to their preceding question where possible; otherwise include the required context. For a self-contained method reference, record sourceReview.bankDependencyReview with decision "self-contained", the current dependencySignature and a substantive note.'),{statusCode:409,dependencyFindings:findings});
 return findings;
}
