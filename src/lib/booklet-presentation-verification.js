import {contentSource} from './document-content.js';
import {signature} from './booklet-content-verification.js';
import {normalizeArrangement} from '../../public/libs/maths-editor/arrangement-model.mjs';

export const PRESENTATION_VERIFIER_VERSION='3';
// Review every rendered occurrence; preserved originals are evidence, not output.
export function activeRasterOccurrences(block){
 const result=[];
 const walk=(node,path,owner)=>{
  if(!node||typeof node!=='object')return;
  if(node.mathematicalExpression)owner=node;
  if(node.src&&(node.format==='image'||['image','inline-image'].includes(node.type)))result.push({path,node,mathematicalExpression:owner?.mathematicalExpression});
  for(const [key,value]of Object.entries(node))if(!['sourceLayoutEvidence','sourceReview','sourceAtom','originalDiagram','originalGraph','mathematicalModel'].includes(key)&&value&&typeof value==='object')walk(value,path+'/'+key,owner);
 };
 walk(block.content,'/content',null);return result;
}
export const rasterReviewKey=occurrence=>signature({path:occurrence.path,image:occurrence.node,mathematicalExpression:occurrence.mathematicalExpression});
export const RESPONSE_KINDS=['cloze','tick-cross','inline','short','working','none'];
export const SOURCE_VISUAL_CATEGORIES=['colour','pagination','speech-bubbles','writing-boxes','activity-groups','alignment','cards-and-prose'];
export function questionNodes(root){
  const result=[];const visit=n=>{if(!n)return;result.push(n);n.children?.forEach(visit);};visit(root);return result;
}
export async function presentationVerificationKey(block,sourceHashes,settings={}){
  return signature({version:PRESENTATION_VERIFIER_VERSION,sourceHashes,atom:block.sourceAtom,role:block.pedagogyRole,
    pagination:{sourcePage:block.sourcePageNumber,sourceBreak:block.flow?.sourcePageBreakBefore,manualBreak:block.flow?.pageBreakBefore,policy:settings.sourcePaginationPolicy,preserveSourcePages:settings.sourcePaginationPolicy?settings.preserveSourcePages:undefined},
    sourceRefs:block.sourceRefs,review:{...block.sourceReview,verification:undefined},
    nodes:questionNodes(block.type==='question'?block.content:null).map(n=>({id:n.id,prompt:n.prompt,layout:n.layout,columns:n.columns,order:n.children?.map(c=>c.id),questionDiagrams:n.questionDiagrams,sharedSolutionDiagrams:n.sharedSolutionDiagrams,answerSpaceMm:n.answerSpaceMm})),
    content:block.type==='question'?undefined:block.content});
}
export async function inspectPresentationFidelity(project){
  const issues=[];let checked=0;
  const issue=(kind,targetId,note)=>issues.push({kind,targetId,note});
  const templateChecks=project.settings?.teachingPresentationVersion===1;
  if(templateChecks&&project.settings.includeTeachingAnswers)issue('teaching-in-practice-answers',null,'Use practice-only answer editions; teaching answers have their own controls.');
  for(const section of project.sections??[])for(const block of section.blocks??[]){
    const review=block.sourceReview;
    for(const occurrence of activeRasterOccurrences(block)){
      const exception=review?.rasterExceptions?.find(e=>e.path===occurrence.path);
      const authorised=exception?.kind==='authorised-exception'&&exception.authorization?.trim();
      if(occurrence.mathematicalExpression&&!authorised)issue('rasterised-editable-maths',block.id,`Transcribe the equation and its complete scaffold at ${occurrence.path} into native maths; keeping a source crop is not a fidelity exception.`);
      if(!exception?.checked||!exception.reason?.trim()||!exception.evidence?.trim()||!['illustration','handwritten-analysis','geometry','flowchart','authorised-exception'].includes(exception.kind)||exception.kind==='authorised-exception'&&!authorised||exception.signature!==await rasterReviewKey(occurrence))issue('unreviewed-raster-exception',block.id,`Review retained image ${occurrence.path}: record its kind, specific reason, source/render evidence and current occurrence signature. Ordinary equations, cards and writing boxes must be native.`);
    }
    if(!templateChecks||section.phase==='front-matter')continue;
    if(project.source?.inventory&&(!review?.visualAudit?.checked||SOURCE_VISUAL_CATEGORIES.some(category=>!review.visualAudit.categories?.includes(category))))issue('unchecked-source-visuals',block.id,'Compare source colours, pagination, speech bubbles, writable boxes, activity identity, alignment, cards and prose styling. Content counts and an overflow check do not verify these features.');
    for(const requirement of review?.presentationRequirements??[]){
      const actual=requirement.path.split('/').slice(1).reduce((value,key)=>value?.[key],block);
      if(JSON.stringify(actual)!==JSON.stringify(requirement.value))issue('source-presentation-mismatch',block.id,`Restore the source-reviewed presentation at ${requirement.path}.`);
    }
    if(review?.teachingGroup&&Object.entries(review.teachingGroup).some(([key,value])=>block.sourceAtom?.[key]!==value))issue('source-teaching-group-mismatch',block.id,'The source activity heading or group has been replaced. Preserve its meaning and shared demonstrations/responses.');
    if(review?.sourcePagination&&project.settings.sourcePaginationPolicy==='source-boundaries'&&(review.sourcePagination.page!==block.sourcePageNumber||review.sourcePagination.breakBefore!==!!block.flow?.sourcePageBreakBefore||block.flow?.pageBreakBefore===false&&review.sourcePagination.breakBefore))issue('source-page-boundary-mismatch',block.id,'Restore the reviewed source page boundary.');
    const activeArrangement=project.settings?.layoutOverrides?.blockLayouts?.[block.id]?.arrangement;
    if(JSON.stringify(normalizeArrangement(activeArrangement))!==JSON.stringify(normalizeArrangement(review?.arrangementOverride)))issue('unreviewed-source-arrangement',block.id,'The active custom arrangement differs from the reviewed source arrangement.');
    if(section.phase==='teaching'&&!block.sourceAtom?.id)issue('missing-teaching-template',block.id,'Assign a source teaching group and header template.');
    if(block.sourceAtom){
      if(!review?.headerOwnedByTemplate)issue('unchecked-header',block.id,'Check that the template owns the heading and the body contains only the teaching content.');
      const body=contentSource(block.type==='question'?block.content.prompt:block.content).replace(/[*#]/g,'').trim();
      if(/^(?:-\s*)?(Guided Practice|Key Ideas|Review|Example)\s*(?::|$)/i.test(body))issue('duplicate-teaching-header',block.id,'Move the repeated heading out of the teaching body.');
    }
    const nodes=questionNodes(block.type==='question'?block.content:null);
    for(const node of nodes){
      if(node.children?.length){
        const arrangement=review?.arrangements?.find(a=>a.targetId===node.id);
        if(!arrangement||!arrangement.reason||arrangement.layout!==node.layout||arrangement.columns!==(node.columns??null)||JSON.stringify(arrangement.order)!==JSON.stringify(node.children.map(n=>n.id)))issue('unreviewed-source-arrangement',node.id,'Review source columns, row/column reading order and meaningful groups. Record why the active arrangement is faithful.');
      }else{
        const response=review?.responses?.find(r=>r.targetId===node.id);
        if(!RESPONSE_KINDS.includes(response?.kind))issue('unreviewed-response-space',node.id,'Identify the response requirement from the source before allocating working space.');
        if(response&&['cloze','inline','none'].includes(response.kind)&&node.answerSpaceMm>0)issue('unnecessary-response-space',node.id,'An inline response or cloze already supplies its response space.');
        if(response?.kind==='tick-cross'&&node.answerSpaceMm>6)issue('excessive-response-space',node.id,'A tick/cross response needs at most 6 mm, not a working area.');
      }
    }
    if(!review?.verification?.checked||review.verification.signature!==await presentationVerificationKey(block,project.source?.sourceHashes,project.settings))issue('unchecked-teaching-arrangement',block.id,'Verify teaching presentation and response arrangements against the source and accepted templates.');
    else checked++;
  }
  return {required:templateChecks||issues.length>0,complete:issues.length===0,issues,checked};
}
