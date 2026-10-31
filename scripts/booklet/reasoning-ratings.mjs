import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {isPractice} from '../../src/lib/booklet-flow.js';
import {isTheoryReview} from '../../src/lib/question-bank-eligibility.js';
import {normaliseQuestion,difficultyBandForScore} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {GRADIENT_TABLE_KIND,checkedGradientTableProof} from './gradient-table-lineage.mjs';
import {WORKED_CORRECTION_KIND,checkedWorkedCorrection,workedCorrectionAssessment} from './worked-answer-correction-lineage.mjs';
import {CONSTRUCT_BLANK_KIND,checkedConstructBlankProof} from './construct-blank-lineage.mjs';

export const REASONING_RUBRIC='mathsmap-cognitive-demand-v1';
export const REASONING_PROMPT=`Assess every whole practice question individually on the MathsMap 0–100 cognitive-demand scale for a prepared student taught the relevant methods. Foundation 0–24: direct application; Development 25–49: routine linked procedures; Mastery 50–79: non-trivial connections or reframing; Challenge 80–100: decisive unsignposted insight. No quota or distribution. Read the student task first, then use the solution to detect hidden demand. Count decisions, representation changes and interpretation, not repeated parts, arithmetic bulk or solution length. Account for scaffolding actually supplied. Rate a multipart task by its hardest essential demand, not its average. Fractional numbers alone do not raise the band. Return an integer reasoningScore and a concise, task-specific difficultyReason explaining the decisions required. Never infer a score from an old band, title, page number or default. Do not change skills, content, answers or layout. If essential diagram/task evidence is unavailable, return a blocker rather than guessing.`;
export function practiceRatingBlocks(project){
 return (project.sections??[]).flatMap(section=>section.phase==='teaching'||section.phase==='front-matter'?[]:(section.blocks??[]).filter(block=>isPractice(block)&&!isTheoryReview(block,section)).map(block=>({section,block})));
}
// Canonical node identities and local layout do not change mathematical demand.
// Include answers: an amended solution can reveal a previously missed demand.
export function reasoningTaskHash(block){
 return createHash('sha256').update(JSON.stringify(sharedQuestion({...normaliseQuestion(block),title:''}).content)).digest('hex');
}
// Only line breaks immediately outside complete display-maths blocks are
// presentation. Preserve all other text, including whitespace inside maths.
function compatibleWorked(value){
 const parts=value.split('$$');
 if(parts.length<3||parts.length%2===0)return value;
 return parts.map((part,i)=>{
  if(i%2)return part;
  if(i)part=part.replace(/^(?:\r?\n)+/,'');
  if(i<parts.length-1)part=part.replace(/(?:\r?\n)+$/,'');
  return part;
 }).join('$$');
}
function normalizeWorkedBoundaries(value){
 if(!value||typeof value!=='object')return;
 if(value.answer&&typeof value.answer==='object'&&typeof value.answer.worked==='string')value.answer.worked=compatibleWorked(value.answer.worked);
 for(const child of Object.values(value))normalizeWorkedBoundaries(child);
}
export function compatibleRatingHash(block){
 const content=sharedQuestion({...normaliseQuestion(block),title:''}).content;
 if(content.label==null||/^\d+[.)]?$/.test(String(content.label)))content.label=null;
 normalizeWorkedBoundaries(content);
 return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
// Renumbering a whole question changes no assessed mathematics. Preserve the
// actual assessment and record its original binding when copying that rating.
export function reuseReasoningRating(source,target,rating=source.classification){
 if(!verifiedRating(source,rating)||compatibleRatingHash(source)!==compatibleRatingHash(target))return null;
 const assessment=structuredClone(rating.assessment),taskHash=reasoningTaskHash(target);
 if(assessment.taskHash!==taskHash){assessment.originalTaskHash??=assessment.taskHash;assessment.taskHash=taskHash;}
 return {reasoningScore:rating.reasoningScore,difficulty:rating.difficulty,difficultyReason:rating.difficultyReason,assessment};
}
export function validRawRating(rating){
 return Number.isInteger(rating?.reasoningScore)&&rating.reasoningScore>=0&&rating.reasoningScore<=100&&typeof rating.difficultyReason==='string'&&rating.difficultyReason.trim().length>0&&!/^(?:Score-derived from|Author-created booklet question\.?$)/i.test(rating.difficultyReason.trim())&&rating.difficulty===difficultyBandForScore(rating.reasoningScore);
}
export function verifiedRating(block,rating=block.classification){
 const a=rating?.assessment;
 if(!(validRawRating(rating)&&a?.rubricVersion===REASONING_RUBRIC&&a.taskHash===reasoningTaskHash(block)&&typeof a.model==='string'&&a.model.trim().length>0&&Number.isFinite(Date.parse(a.assessedAt))&&typeof a.evidence==='string'&&a.evidence.length>0))return false;
 if(a.workedMathematicalCorrectionReuse){const key='worked-correction:'+a.workedMathematicalCorrectionReuse.proofSha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validWorkedCorrectionReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 if(a.promptLineBreakReuse){const key='prompt-break:'+a.promptLineBreakReuse.proofSha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validPromptLineBreakReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 if(a.answerPresentationReuse){const key='answer:'+a.answerPresentationReuse.proofSha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validAnswerPresentationReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 if(a.bankProjectionReuse){const key='bank:'+a.bankProjectionReuse.sourceArtifact?.sha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validBankProjectionReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 if(a.gradientTablePresentationAdaptations?.length){const key='table:'+a.gradientTablePresentationAdaptations.at(-1)?.proofSha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validGradientTableReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 if(a.constructBlankPresentationAdaptations?.length){const key='blank:'+a.constructBlankPresentationAdaptations.at(-1)?.proofSha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validConstructBlankReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 if(a.diagramPresentationAdaptations?.length){const key=a.diagramPresentationAdaptations.at(-1)?.proofSha256;if(checkingDiagramProofs.has(key)||checkingDiagramProofs.size>=32)return false;checkingDiagramProofs.add(key);try{return validDiagramPresentationReuse(block,rating);}catch{return false;}finally{checkingDiagramProofs.delete(key);}}
 return true;
}
const checkingDiagramProofs=new Set();
const gradientTableHooks={verifiedRating,reasoningTaskHash};
function reusedGradientTableAssessment(source,target,artifact){
 const original=source.classification.assessment,assessment=structuredClone(original);
 assessment.originalTaskHash??=original.taskHash;assessment.taskHash=reasoningTaskHash(target);
 assessment.gradientTablePresentationAdaptations=[{kind:GRADIENT_TABLE_KIND,previousTaskHash:original.taskHash,currentTaskHash:assessment.taskHash,proofFile:artifact.path,proofSha256:artifact.sha256,originalAssessment:structuredClone(original),assessmentReused:true,newAssessmentPerformed:false}];
 return assessment;
}
function validGradientTableReuse(block,rating){
 const row=rating.assessment.gradientTablePresentationAdaptations.at(-1);
 if(rating.assessment.gradientTablePresentationAdaptations.length!==1||row.kind!==GRADIENT_TABLE_KIND||row.assessmentReused!==true||row.newAssessmentPerformed!==false)return false;
 const artifact={path:row.proofFile,sha256:row.proofSha256},{source}=checkedGradientTableProof(block,artifact,gradientTableHooks);
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,reusedGradientTableAssessment(source,block,artifact));
}
export function reuseGradientTablePresentationRating(source,target,{proofArtifact,confirmEquivalent}={}){
 if(typeof confirmEquivalent!=='function')throw Error('Coordinator exact decorative-table review required');
 const checked=checkedGradientTableProof(target,proofArtifact,gradientTableHooks);
 if(!isDeepStrictEqual(checked.source,source)||confirmEquivalent(structuredClone(checked))!==true)throw Error('Decorative-table equivalence not confirmed');
 return {reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:reusedGradientTableAssessment(source,target,proofArtifact)};
}
const constructBlankHooks={verifiedRating,reasoningTaskHash,reuseReasoningRating};
function reusedConstructBlankAssessment(source,target,artifact){
 const original=source.classification.assessment,assessment=structuredClone(original);
 assessment.originalTaskHash??=original.taskHash;assessment.taskHash=reasoningTaskHash(target);
 assessment.constructBlankPresentationAdaptations=[{kind:CONSTRUCT_BLANK_KIND,previousTaskHash:original.taskHash,currentTaskHash:assessment.taskHash,proofFile:artifact.path,proofSha256:artifact.sha256,originalAssessment:structuredClone(original),assessmentReused:true,newAssessmentPerformed:false}];
 return assessment;
}
function validConstructBlankReuse(block,rating){
 const row=rating.assessment.constructBlankPresentationAdaptations.at(-1);
 if(rating.assessment.constructBlankPresentationAdaptations.length!==1||row.kind!==CONSTRUCT_BLANK_KIND||row.assessmentReused!==true||row.newAssessmentPerformed!==false)return false;
 const artifact={path:row.proofFile,sha256:row.proofSha256},{source}=checkedConstructBlankProof(block,artifact,constructBlankHooks);
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,reusedConstructBlankAssessment(source,block,artifact));
}
export function reuseConstructBlankPresentationRating(source,target,{proofArtifact,confirmEquivalent}={}){
 if(typeof confirmEquivalent!=='function')throw Error('Coordinator exact blank-equivalence review required');
 const checked=checkedConstructBlankProof(target,proofArtifact,constructBlankHooks);
 if(!isDeepStrictEqual(checked.source,source)||confirmEquivalent(structuredClone(checked))!==true)throw Error('Exact blank equivalence not confirmed');
 return {reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:reusedConstructBlankAssessment(source,target,proofArtifact)};
}
const objectHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function pinnedJson(artifact){
 if(typeof artifact?.path!=='string'||!/^[a-f0-9]{64}$/.test(artifact.sha256??''))throw Error('Missing pinned diagram evidence');
 const bytes=fs.readFileSync(artifact.path);if(createHash('sha256').update(bytes).digest('hex')!==artifact.sha256)throw Error('Diagram evidence changed');return JSON.parse(bytes);
}
const valueAt=(value,parts)=>parts.reduce((v,k)=>v?.[k],value);
// Remove answers before canonical ID/local-style processing: answer-owned IDs
// must not shift posed identities. Keep semantic scaffolding and actual diagram
// code even where sharedQuestion normally ignores their presentation fields.
function withoutAnswers(value){
 if(Array.isArray(value))return value.map(withoutAnswers);
 if(!value||typeof value!=='object')return value;
 const supplied=value.responseSpace==='given'||value.responseKind==='given';
 return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='answer'||supplied).map(([key,v])=>[key==='answer'?'answerReuseGivenContent':key,withoutAnswers(v)]));
}
function answerReusePosedTask(block){
 const normalized=normaliseQuestion({...block,content:withoutAnswers(block.content)});
 function protect(value){
  if(Array.isArray(value))return value.map(protect);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([key,v])=>[key==='code'?'answerReuseDiagramCode':key==='responseSpace'?'answerReuseResponseSpace':key,protect(v)]));
 }
 // Compare canonical stated fields too: normalizers may omit newer card or
 // relationship fields, which must never disappear from this equivalence gate.
 return {normalized:sharedQuestion({...normalized,title:'',content:protect(normalized.content)}).content,stated:sharedQuestion({title:'',content:protect(withoutAnswers(block.content))}).content};
}
function checkedAnswerPresentationProof(target,artifact){
 const proof=pinnedJson(artifact);
 if(proof.kind!=='answer-presentation-only-v1'||!Array.isArray(proof.sourceArtifact?.blockPath)||proof.sourceArtifact.blockPath.some(k=>!['string','number'].includes(typeof k)||['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid answer-presentation proof');
 const source=valueAt(pinnedJson(proof.sourceArtifact),proof.sourceArtifact.blockPath);
 if(!source||!verifiedRating(source)||proof.sourceTaskHash!==reasoningTaskHash(source)||proof.targetTaskHash!==reasoningTaskHash(target)||proof.sourceTaskHash===proof.targetTaskHash)throw Error('Unverified or changed answer-presentation source/task');
 if(!source.content||!target.content||!isDeepStrictEqual(answerReusePosedTask(source),answerReusePosedTask(target)))throw Error('Canonical posed task, diagram or scaffold changed');
 if((source.id!==target.id||proof.sourceId!==undefined||proof.targetId!==undefined)&&(proof.sourceId!==source.id||proof.targetId!==target.id))throw Error('Explicit source/target identity mapping required');
 for(const key of ['dependsOn','continuationOf','pairedBlockId'])if(!isDeepStrictEqual(source[key],target[key])||!isDeepStrictEqual(source.flow?.[key],target.flow?.[key]))throw Error('Task dependency changed');
 const review=pinnedJson(proof.answerEquivalenceReview);
 if((source.id!==target.id||review.sourceId!==undefined||review.targetId!==undefined)&&(review.sourceId!==source.id||review.targetId!==target.id))throw Error('Independent review identity mapping mismatch');
 if(review.kind!=='independent-answer-equivalence-v1'||review.sourceTaskHash!==proof.sourceTaskHash||review.targetTaskHash!==proof.targetTaskHash||review.answersEquivalent!==true||review.newMathematics!==false||review.newDemand!==false||review.rationaleApplicable!==true||typeof review.rationale!=='string'||!review.rationale.trim())throw Error('Missing independent answer-equivalence review');
 return{source,proof,review};
}
function reusedAnswerPresentationAssessment(source,target,artifact){
 const original=source.classification.assessment,assessment=structuredClone(original);
 assessment.originalTaskHash??=original.taskHash;assessment.taskHash=reasoningTaskHash(target);
 assessment.answerPresentationReuse={kind:'answer-presentation-only-v1',sourceId:source.id,targetId:target.id,previousTaskHash:reasoningTaskHash(source),currentTaskHash:reasoningTaskHash(target),proofFile:artifact.path,proofSha256:artifact.sha256,originalAssessment:structuredClone(original),assessmentReused:true,newAssessmentPerformed:false};
 return assessment;
}
function validAnswerPresentationReuse(target,rating){
 const row=rating.assessment.answerPresentationReuse;
 if(row?.kind!=='answer-presentation-only-v1'||row.assessmentReused!==true||row.newAssessmentPerformed!==false)return false;
 const artifact={path:row.proofFile,sha256:row.proofSha256},{source}=checkedAnswerPresentationProof(target,artifact);
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,reusedAnswerPresentationAssessment(source,target,artifact));
}
// Explicit opt-in only: pinned retained rating + unchanged canonical posed task +
// pinned independent semantic review and coordinator confirmation. Preserve the
// actual legacy numeric/model/date/evidence facts; this performs no new rating.
export function reuseAnswerPresentationRating(source,target,{proofArtifact,confirmEquivalent}={}){
 if(typeof confirmEquivalent!=='function')throw Error('Coordinator independent answer-review confirmation required');
 const checked=checkedAnswerPresentationProof(target,proofArtifact);
 if(!isDeepStrictEqual(checked.source,source))throw Error('Answer-presentation source differs');
 if(confirmEquivalent(structuredClone({source,target,proof:checked.proof,review:checked.review}))!==true)throw Error('Answer equivalence not confirmed');
 return{reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:reusedAnswerPresentationAssessment(source,target,proofArtifact)};
}
const workedCorrectionHooks={reasoningTaskHash,verifiedRating};
function validWorkedCorrectionReuse(target,rating){
 const row=rating.assessment.workedMathematicalCorrectionReuse;
 if(row?.kind!==WORKED_CORRECTION_KIND||row.correctedMathematics!==true||row.newDemand!==false||row.assessmentReused!==true||row.newAssessmentPerformed!==false)return false;
 const artifact={path:row.proofFile,sha256:row.proofSha256},{source}=checkedWorkedCorrection(target,artifact,workedCorrectionHooks);
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,workedCorrectionAssessment(source,target,artifact,workedCorrectionHooks));
}
// Substantive mathematical correction, never presentation equivalence or a new
// numeric assessment. Both pinned independent verdicts and explicit coordinator
// confirmation are required; all non-Worked fields remain byte-value exact.
export function reuseWorkedMathematicalCorrectionRating(source,target,{proofArtifact,confirmCorrection}={}){
 if(typeof confirmCorrection!=='function')throw Error('Coordinator worked-correction confirmation required');
 const checked=checkedWorkedCorrection(target,proofArtifact,workedCorrectionHooks);
 if(!isDeepStrictEqual(checked.source,source))throw Error('Worked-correction source differs');
 if(confirmCorrection(structuredClone(checked))!==true)throw Error('Worked correction not confirmed');
 return {reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:workedCorrectionAssessment(source,target,proofArtifact,workedCorrectionHooks)};
}
// Opt-in for an independently reviewed break between plain prose in ONE native
// prompt paragraph. Never part of reasoningTaskHash/compatibleRatingHash.
function checkedPromptLineBreakProof(target,artifact){
 const proof=pinnedJson(artifact);
 const safePath=p=>Array.isArray(p)&&p.every(k=>['string','number'].includes(typeof k)&&!['__proto__','constructor','prototype'].includes(k));
 if(proof.kind!=='plain-prompt-line-break-only-v1'||!safePath(proof.sourceArtifact?.blockPath)||!safePath(proof.promptPath)||proof.promptPath[0]!=='content')throw Error('Invalid plain prompt-break proof');
 const source=valueAt(pinnedJson(proof.sourceArtifact),proof.sourceArtifact.blockPath);
 if(!source||source.id!==target.id||!verifiedRating(source)||proof.sourceTaskHash!==reasoningTaskHash(source)||proof.targetTaskHash!==reasoningTaskHash(target)||proof.sourceTaskHash===proof.targetTaskHash)throw Error('Changed or unverified prompt-break source/task');
 const parts=proof.promptPath;let cursor=1;
 while(parts[cursor]==='children'&&Number.isSafeInteger(parts[cursor+1])&&parts[cursor+1]>=0)cursor+=2;
 if(parts.slice(cursor).length!==4||parts[cursor]!=='prompt'||parts[cursor+1]!=='blocks'||!Number.isSafeInteger(parts[cursor+2])||parts[cursor+2]<0||parts[cursor+3]!=='inlines')throw Error('Break must be in a native question/part prompt paragraph');
 const rawA=structuredClone(source),rawB=structuredClone(target),nodePath=parts.slice(0,cursor),paragraphPath=parts.slice(0,-1);
 if(!['question','part'].includes(valueAt(rawA,nodePath)?.type)||!['question','part'].includes(valueAt(rawB,nodePath)?.type)||valueAt(rawA,paragraphPath)?.type!=='paragraph'||valueAt(rawB,paragraphPath)?.type!=='paragraph')throw Error('Not a plain question paragraph');
 const collapse=(record,expectedBreaks)=>{
  const inlines=valueAt(record,parts);if(!Array.isArray(inlines)||!inlines.length)throw Error('Missing native inlines');let text='',breaks=0;
  for(const [index,inline] of inlines.entries()){
   if(inline.type==='break'){if(Object.keys(inline).some(k=>k!=='type'))throw Error('Decorated/semantic break');const left=inlines[index-1],right=inlines[index+1];if(left?.type!=='text'||right?.type!=='text'||!left.text?.trim()||!right.text?.trim()||!/[.!?;:]\s*$/.test(left.text)||!(/\s$/.test(left.text)||/^\s/.test(right.text)))throw Error('Leading, trailing or ambiguous prose break');breaks++;continue;}
   if(inline.type!=='text'||typeof inline.text!=='string'||inline.marks?.length||Object.keys(inline).some(k=>!['type','text','marks'].includes(k)))throw Error('Math, marked text or non-plain inline');text+=inline.text;
  }
  if(breaks!==expectedBreaks||/[$\\=<>≤≥^×÷\r\n]/.test(text))throw Error('Not one plain-prose line break');
  valueAt(record,paragraphPath).inlines=[{type:'text',text,marks:[]}];return text;
 };
 if(collapse(rawA,0)!==collapse(rawB,1))throw Error('Plain prompt words/data/order changed');
 // Preserve stated semantic fields that a normalizer does not yet know. Only
 // provenance/layout metadata is excluded; default native fields still normalize.
 const omitted=new Set(['provenance','sourceReview','sourceRefs','sourceLayoutEvidence','spec']);
 const stated=(normalized,raw)=>{if(!raw||typeof raw!=='object')return normalized;if(Array.isArray(raw))return raw.map((v,i)=>stated(normalized?.[i],v));const out={...(normalized??{})};for(const[k,v]of Object.entries(raw))if(!omitted.has(k)){if(v&&typeof v==='object')out[k]=stated(normalized?.[k],v);else if(!Object.hasOwn(out,k)||k==='code')out[k]=v;}return out;};
 const a=normaliseQuestion(rawA),b=normaliseQuestion(rawB);a.content=stated(a.content,rawA.content);b.content=stated(b.content,rawB.content);
 const semanticKeys={code:'promptBreakDiagramCode',responseSpace:'promptBreakResponseSpace',layout:'promptBreakLayout',layoutPreset:'promptBreakLayoutPreset',columns:'promptBreakColumns',answerColumns:'promptBreakAnswerColumns',diagramPlacement:'promptBreakDiagramPlacement',presentation:'promptBreakPresentation'};
 const semantic=value=>{if(Array.isArray(value))return value.map(semantic);if(!value||typeof value!=='object')return value;if(['card','table','grid','equation','aligned'].includes(value.type))throw Error('Card/table/equation semantics outside this opt-in');if(Object.keys(value).some(k=>Object.values(semanticKeys).includes(k)))throw Error('Reserved semantic field');return Object.fromEntries(Object.entries(value).map(([k,v])=>[semanticKeys[k]??k,semantic(v)]));};
 if(!isDeepStrictEqual(sharedQuestion({content:semantic(a.content)}).content,sharedQuestion({content:semantic(b.content)}).content))throw Error('Task, answer, diagram, relationship or scaffold changed');
 for(const key of ['dependsOn','continuationOf','pairedBlockId'])if(!isDeepStrictEqual(source[key],target[key])||!isDeepStrictEqual(source.flow?.[key],target.flow?.[key]))throw Error('Task dependency changed');
 if(!isDeepStrictEqual(source.presentation,target.presentation))throw Error('Prompt-break presentation relationships changed');
 const review=pinnedJson(proof.equivalenceReview);
 if(review.kind!=='independent-plain-prompt-break-equivalence-v1'||review.sourceTaskHash!==proof.sourceTaskHash||review.targetTaskHash!==proof.targetTaskHash||review.posedTaskEquivalent!==true||review.answersEquivalent!==true||review.newMathematics!==false||review.newDemand!==false||review.layoutMeaningChanged!==false||review.rationaleApplicable!==true||typeof review.rationale!=='string'||!review.rationale.trim())throw Error('Independent prompt equivalence review missing');
 return{source,proof,review};
}
function reusedPromptLineBreakAssessment(source,target,artifact){
 const original=source.classification.assessment,assessment=structuredClone(original);assessment.originalTaskHash??=original.taskHash;assessment.taskHash=reasoningTaskHash(target);
 assessment.promptLineBreakReuse={kind:'plain-prompt-line-break-only-v1',previousTaskHash:reasoningTaskHash(source),currentTaskHash:reasoningTaskHash(target),proofFile:artifact.path,proofSha256:artifact.sha256,originalAssessment:structuredClone(original),assessmentReused:true,newAssessmentPerformed:false};return assessment;
}
function validPromptLineBreakReuse(target,rating){
 const row=rating.assessment.promptLineBreakReuse;if(row?.kind!=='plain-prompt-line-break-only-v1'||row.assessmentReused!==true||row.newAssessmentPerformed!==false)return false;
 const artifact={path:row.proofFile,sha256:row.proofSha256},{source}=checkedPromptLineBreakProof(target,artifact);
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,reusedPromptLineBreakAssessment(source,target,artifact));
}
// Creation still requires the coordinator to inspect the pinned independent
// review. Its booleans alone never approve reuse or manufacture a new score.
export function reusePromptLineBreakRating(source,target,{proofArtifact,confirmEquivalent}={}){
 if(typeof confirmEquivalent!=='function')throw Error('Coordinator prompt-break review confirmation required');const checked=checkedPromptLineBreakProof(target,proofArtifact);
 if(!isDeepStrictEqual(source,checked.source))throw Error('Source differs from pinned owner');if(confirmEquivalent(structuredClone({source,target,proof:checked.proof,review:checked.review}))!==true)throw Error('Prompt-break equivalence not confirmed');
 return{reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:reusedPromptLineBreakAssessment(source,target,proofArtifact)};
}
// Bank normalization may add diagram defaults. Pin the actual rated project
// owner and compare the complete normalized diagram, including its spec.
function checkedBankProjection(target,record){
 if(record?.kind!=='same-task-bank-projection-v1'||!Array.isArray(record.sourceArtifact?.blockPath)||record.sourceArtifact.blockPath.some(k=>!['string','number'].includes(typeof k)||['__proto__','constructor','prototype'].includes(k))||!Array.isArray(record.diagramPaths)||!record.diagramPaths.length)throw Error('Invalid bank projection evidence');
 const source=valueAt(pinnedJson(record.sourceArtifact),record.sourceArtifact.blockPath);
 if(!source||source.id!==record.sourceId||source.bankRef?.id!==record.bankId||target.id!==record.bankId||!verifiedRating(source)||reasoningTaskHash(source)!==record.taskHash||reasoningTaskHash(target)!==record.taskHash)throw Error('Bank projection source or task changed');
 const a=normaliseQuestion(source),b=normaliseQuestion(target),seen=new Set();
 for(const parts of record.diagramPaths){
  if(!Array.isArray(parts)||parts[0]!=='content'||parts.some(k=>!['string','number'].includes(typeof k)||['__proto__','constructor','prototype'].includes(k))||seen.has(JSON.stringify(parts)))throw Error('Invalid bank diagram path');
  seen.add(JSON.stringify(parts));const x=valueAt(a,parts),y=valueAt(b,parts);
  if(!x||!y||!['tikz','svg'].includes(x.format)||!isDeepStrictEqual(x,y))throw Error('Bank normalized diagram differs');
 }
 // Also check every diagram, so a caller cannot name an unrelated matching
 // figure while a changed figure carries stale or divergent metadata.
 const diagrams=(v,p=[],out=[])=>{if(!v||typeof v!=='object')return out;if(['tikz','svg'].includes(v.format)&&typeof v.id==='string')out.push([p,v]);for(const [k,x] of Object.entries(v))if(x&&typeof x==='object')diagrams(x,[...p,Array.isArray(v)?Number(k):k],out);return out;};
 const da=diagrams(a.content),db=diagrams(b.content);
 if(da.length!==db.length||da.some(([p,v],i)=>!isDeepStrictEqual(p,db[i][0])||!isDeepStrictEqual(v,db[i][1])))throw Error('Bank normalized diagram differs');
 return source;
}
function bankProjectionAssessment(source,record){return {...structuredClone(source.classification.assessment),bankProjectionReuse:structuredClone(record)};}
function validBankProjectionReuse(target,rating){
 const record=rating.assessment.bankProjectionReuse,source=checkedBankProjection(target,record);
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,bankProjectionAssessment(source,record));
}
export function reuseBankProjectionRating(source,target,{sourceArtifact,diagramPaths}={}){
 const record={kind:'same-task-bank-projection-v1',sourceArtifact:structuredClone(sourceArtifact),sourceId:source.id,bankId:target.id,taskHash:reasoningTaskHash(source),diagramPaths:structuredClone(diagramPaths)};
 if(!isDeepStrictEqual(checkedBankProjection(target,record),source))throw Error('Bank projection source differs');
 return {reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:bankProjectionAssessment(source,record)};
}
const ratingKeys=['reasoningScore','difficulty','difficultyReason','assessment'];
const withoutRating=block=>{const copy=structuredClone(block);for(const key of ratingKeys)delete copy.classification?.[key];return copy;};
// Only the explicitly approved grid palette substitutions within complete
// inline TikZ blocks may be treated as a string-level presentation change.
function inlineTikzGridPalette(before,after){
 if(typeof before!=='string'||typeof after!=='string'||before===after)return false;
 let changed=false,invalid=false;
 const mapped=before.replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/g,(whole,body)=>{
  if(/\[\/?tikz\]/.test(body)){invalid=true;return whole;}
  const next=body.replace(/\\draw\s*\[([^\[\]\r\n]*)\](?=\s*\([^;]*?\)\s*grid\b[^;]*;)/g,(draw,options)=>{
   const mapped=options.replace(/(?<![\w!])gray!(?:35|40|70)(?![\w!])/g,()=>{changed=true;return 'black!20';});
   return draw.slice(0,draw.indexOf('[')+1)+mapped+']';
  });
  return '[tikz]'+next+'[/tikz]';
 });
 // Any remaining tag indicates an incomplete, nested or unmatched block.
 const withoutBlocks=before.replace(/\[tikz\][\s\S]*?\[\/tikz\]/g,'');
 return changed&&!invalid&&!/\[\/?tikz\]/.test(withoutBlocks)&&mapped===after;
}
// Exact house-blue insertion at a TikZ picture start; grid edits use the
// already constrained grid-only checker above, block by block.
function inlineTikzHousePalette(before,after){
 if(typeof before!=='string'||typeof after!=='string'||before===after)return false;
 if(/\\(?:definecolor|providecolor|colorlet|definecolorset)\b/.test(before))return false;
 const blocks=[];let malformed=false;
 const template=before.replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/g,(whole,body)=>{if(/\[\/?tikz\]/.test(body))malformed=true;blocks.push(body);return '\u0000TIKZ'+(blocks.length-1)+'\u0000';});
 if(malformed||/\[\/?tikz\]/.test(template)||!blocks.length)return false;
 const targetBlocks=[];const targetTemplate=after.replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/g,(whole,body)=>{if(/\[\/?tikz\]/.test(body))malformed=true;targetBlocks.push(body);return '\u0000TIKZ'+(targetBlocks.length-1)+'\u0000';});
 if(malformed||/\[\/?tikz\]/.test(targetTemplate)||targetTemplate!==template||targetBlocks.length!==blocks.length)return false;
 let changed=false;
 for(let i=0;i<blocks.length;i++){
  const a=blocks[i];let b=targetBlocks[i];
  // Reject existing color-definition machinery, including an existing blue override.
  if(/\\(?:definecolor|providecolor|colorlet|definecolorset)\b/.test(a))return false;
  const prefix='\\definecolor{blue}{HTML}{268CFF}\n',position=b.indexOf(prefix);
  if(position!==-1){if(!b.slice(position+prefix.length).startsWith('\\begin{tikzpicture}'))return false;b=b.slice(0,position)+b.slice(position+prefix.length);changed=true;}
  if(/\\(?:definecolor|providecolor|colorlet|definecolorset)\b/.test(b))return false;
  if(a!==b){if(!inlineTikzGridPalette('[tikz]'+a+'[/tikz]','[tikz]'+b+'[/tikz]'))return false;changed=true;}
 }
 return changed;
}
function diagramAdditionalAdaptations(source,target,proof,inverse,seen,{checkImages}){
 if(proof.additionalAdaptations===undefined)return;
 if(!Array.isArray(proof.additionalAdaptations)||!proof.additionalAdaptations.length||!Array.isArray(proof.targetArtifact?.blockPath))throw Error('Invalid additional diagram adaptations');
 const originalTarget=valueAt(pinnedJson(proof.targetArtifact),proof.targetArtifact.blockPath);
 if(source.id!==target.id||originalTarget?.id!==target.id||!isDeepStrictEqual(withoutRating(originalTarget),withoutRating(target)))throw Error('Changed current diagram snapshot');
 if(!isDeepStrictEqual(originalTarget.classification?.assessment,source.classification.assessment))throw Error('Changed pinned original assessment');
 for(const key of ratingKeys.slice(0,3))if(source.classification[key]!==target.classification[key]||source.classification[key]!==originalTarget.classification[key])throw Error('Changed original rating');
 const metadata=new Set(['classification/archetype','classification/archetypeReview','sourceReview/origin','sourceReview/feedbackRepair','bankRef/revision','flow/bankDifficulty/revision']);
 for(const change of proof.additionalAdaptations){
  const parts=change.path;
  if(!Array.isArray(parts)||parts.some(k=>!['string','number'].includes(typeof k)||['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid additional adaptation path');
  if(seen.some(p=>p.every((k,i)=>parts[i]===k)||parts.every((k,i)=>p[i]===k)))throw Error('Overlapping diagram paths');seen.push(parts);
  if(change.kind==='stable-part-reference-v1'){
   if(parts.length!==4||parts[0]!=='content'||parts[1]!=='children'||!Number.isInteger(parts[2])||parts[3]!=='prompt')throw Error('Invalid stable reference prompt');
   const before=valueAt(source,parts),after=valueAt(target,parts),old='the grid on the previous page',replacement='the grid in part (a)';
   if(typeof before!=='string'||typeof after!=='string'||before.split(old).length!==2||before.replace(old,replacement)!==after||change.beforeSha256!==objectHash({value:before})||change.afterSha256!==objectHash({value:after}))throw Error('Invalid stable reference replacement');
   const ref=change.referenceTarget;if(typeof ref?.partId!=='string'||!ref.partId||typeof ref.diagramId!=='string'||!ref.diagramId)throw Error('Missing stable reference identity');
   const collect=(v,id,out=[])=>{if(!v||typeof v!=='object')return out;if(v.id===id)out.push(v);for(const x of Object.values(v))if(x&&typeof x==='object')collect(x,id,out);return out;};
   const original=collect(source.content,ref.partId),restored=collect(inverse.content,ref.partId),current=collect(target.content,ref.partId),diagramsBefore=collect(source.content,ref.diagramId),diagramsAfter=collect(target.content,ref.diagramId);
   if(original.length!==1||restored.length!==1||current.length!==1||diagramsBefore.length!==1||diagramsAfter.length!==1||original[0].label!=='a'||current[0].label!=='a'||!isDeepStrictEqual(original[0],restored[0])||collect(original[0],ref.diagramId).length!==1||collect(current[0],ref.diagramId).length!==1||source.content.children[parts[2]]?.id===ref.partId||!proof.changes.some(c=>valueAt(source,c.path)?.id===ref.diagramId))throw Error('Stable reference target changed or ambiguous');
   const visual=pinnedJson(change.visualEvidence);
   if(visual.accepted!==true||visual.sourceTaskHash!==proof.sourceTaskHash||visual.targetTaskHash!==proof.targetTaskHash||!isDeepStrictEqual(visual.adaptationPath,parts)||!isDeepStrictEqual(visual.referenceTarget,ref)||!Array.isArray(visual.images)||!visual.images.length)throw Error('Missing stable reference visual review');
   for(const image of visual.images)if(typeof image.path!=='string'||!/^[a-f0-9]{64}$/.test(image.sha256??'')||checkImages&&fileHash(image.path)!==image.sha256)throw Error('Stable reference visual image changed');
   valueAt(inverse,parts.slice(0,-1))[parts.at(-1)]=before;
   continue;
  }
  const key=parts.join('/'),isMetadata=metadata.has(key);
  const parent=valueAt(target,parts.slice(0,-1)),last=parts.at(-1);
  const isRows=parts[0]==='content'&&last==='rowHeights'&&parent?.type==='table';
  const isWidth=parts.length===5&&parts.slice(0,3).join('/')==='presentation/layoutOverrides/blockLayouts'&&last==='diagramWidthMm'&&typeof parts[3]==='string';
  if(change.kind!==(isMetadata?'metadata':'presentation')||!isMetadata&&!isRows&&!isWidth)throw Error('Unsupported additional adaptation');
  if(key==='bankRef/revision'||key==='flow/bankDifficulty/revision'){
   const a=valueAt(source,parts.slice(0,-1)),b=valueAt(target,parts.slice(0,-1));
   if(!a||!b||!isDeepStrictEqual({...a,revision:null},{...b,revision:null})||key==='bankRef/revision'&&(typeof a.id!=='string'||!a.id.trim()))throw Error('Bank identity changed');
  }
  const before=valueAt(source,parts),after=valueAt(target,parts);
  if(change.beforeSha256!==objectHash({value:before})||change.afterSha256!==objectHash({value:after})||isDeepStrictEqual(before,after))throw Error('Additional adaptation changed');
  if(!isMetadata){
   if(isRows&&(!Array.isArray(before)||!Array.isArray(after)||before.length!==after.length||![...before,...after].every(n=>Number.isFinite(n)&&n>0)))throw Error('Invalid row-height adaptation');
   if(isWidth&&![before,after].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid diagram-width adaptation');
   const visual=pinnedJson(change.visualEvidence);
   if(visual.accepted!==true||visual.sourceTaskHash!==proof.sourceTaskHash||visual.targetTaskHash!==proof.targetTaskHash||!isDeepStrictEqual(visual.adaptationPath,parts)||typeof visual.reason!=='string'||!visual.reason.trim()||!Array.isArray(visual.images)||!visual.images.length)throw Error('Missing adaptation visual review');
   for(const image of visual.images)if(typeof image.path!=='string'||!/^[a-f0-9]{64}$/.test(image.sha256??'')||checkImages&&fileHash(image.path)!==image.sha256)throw Error('Adaptation visual image changed');
  }
  const inverseParent=valueAt(inverse,parts.slice(0,-1));
  if(!inverseParent)throw Error('Missing inverse adaptation parent');
  if(Object.hasOwn(valueAt(source,parts.slice(0,-1))??{},last))inverseParent[last]=structuredClone(before);else delete inverseParent[last];
 }
 // Assessment rebinding is validated separately; every other original field
 // must return exactly to the actual pinned source, never a synthetic source.
 for(const key of ratingKeys)inverse.classification[key]=structuredClone(source.classification[key]);
 if(!isDeepStrictEqual(inverse,source))throw Error('Additional adaptation whole-block inverse failed');
}
function diagramReuseProof(target,artifact,{checkImages=false}={}){
 const proof=pinnedJson(artifact);
 if(proof.kind!=='diagram-presentation-only-v1'||!Array.isArray(proof.sourceArtifact?.blockPath)||!Array.isArray(proof.changes)||!proof.changes.length)throw Error('Invalid diagram-only proof');
 const source=valueAt(pinnedJson(proof.sourceArtifact),proof.sourceArtifact.blockPath);
 if(!source||proof.sourceTaskHash!==reasoningTaskHash(source)||proof.targetTaskHash!==reasoningTaskHash(target)||!verifiedRating(source))throw Error('Unverified original diagram task');
 const semantic=pinnedJson(proof.semanticEvidence),visual=pinnedJson(proof.visualEvidence);
 for(const evidence of [semantic,visual])if(evidence.sourceTaskHash!==proof.sourceTaskHash||evidence.targetTaskHash!==proof.targetTaskHash)throw Error('Foreign diagram review');
 if(!semantic.mathematicsBefore||!Object.keys(semantic.mathematicsBefore).length||!isDeepStrictEqual(semantic.mathematicsBefore,semantic.mathematicsAfter))throw Error('Diagram mathematics changed');
 if(visual.accepted!==true||!Array.isArray(visual.images)||!visual.images.length)throw Error('Missing actual diagram visual review');
 for(const image of visual.images){if(typeof image.path!=='string'||!/^[a-f0-9]{64}$/.test(image.sha256??'')||fileHash(image.path)!==image.sha256)throw Error('Diagram visual image changed');}
 const inverse=structuredClone(target),seen=[];
 for(const change of proof.changes){
  const parts=change.path;
  if(!Array.isArray(parts)||parts[0]!=='content'||parts.length<2||parts.some(k=>!['string','number'].includes(typeof k)||['__proto__','constructor','prototype'].includes(k)))throw Error('Invalid diagram path');
  if(seen.some(p=>p.every((k,i)=>parts[i]===k)||parts.every((k,i)=>p[i]===k)))throw Error('Overlapping diagram paths');seen.push(parts);
  const before=valueAt(source,parts),after=valueAt(target,parts);
  if(change.kind==='inline-tikz-house-palette-v1'){
   if(objectHash(before)!==change.beforeSha256||objectHash(after)!==change.afterSha256||!inlineTikzHousePalette(before,after))throw Error('Invalid inline TikZ house palette change');
  }else if(change.kind==='inline-tikz-grid-palette-v1'){
   if(objectHash(before)!==change.beforeSha256||objectHash(after)!==change.afterSha256||!inlineTikzGridPalette(before,after))throw Error('Invalid inline TikZ grid palette change');
  }else{
   if(!before||!after||typeof before.id!=='string'||!before.id.trim()||before.id!==after.id||!['tikz','svg'].includes(before.format)||before.format!==after.format||typeof before.code!=='string'||!before.code.trim()||typeof after.code!=='string'||!after.code.trim()||objectHash(before)!==change.beforeSha256||objectHash(after)!==change.afterSha256)throw Error('Changed or unsupported diagram identity');
   if(!isDeepStrictEqual(before.mathematicalModel,after.mathematicalModel))throw Error('Diagram mathematical model changed');
  }
  valueAt(inverse,parts.slice(0,-1))[parts.at(-1)]=structuredClone(before);
 }
 diagramAdditionalAdaptations(source,target,proof,inverse,seen,{checkImages});
 // Recheck posed task, answers and supplied scaffolding even on bank copies,
 // whose placement metadata and native IDs can legitimately differ.
 if(reasoningTaskHash(inverse)!==proof.sourceTaskHash)throw Error('Non-diagram task changed');
 return{proof,source,inverse,semantic,visual};
}
function reusedDiagramAssessment(source,target,artifact){
 const original=source.classification.assessment,assessment=structuredClone(original);
 assessment.originalTaskHash??=original.taskHash;assessment.taskHash=reasoningTaskHash(target);
 assessment.diagramPresentationAdaptations=[...(assessment.diagramPresentationAdaptations??[]),{kind:'diagram-presentation-only-v1',previousTaskHash:original.taskHash,currentTaskHash:assessment.taskHash,proofFile:artifact.path,proofSha256:artifact.sha256,originalAssessment:structuredClone(original),assessmentReused:true,newAssessmentPerformed:false}];
 return assessment;
}
function validDiagramPresentationReuse(block,rating){
 const row=rating.assessment.diagramPresentationAdaptations.at(-1);
 if(row.kind!=='diagram-presentation-only-v1'||row.newAssessmentPerformed!==false||row.assessmentReused!==true)throw Error('Invalid diagram rating history');
 const artifact={path:row.proofFile,sha256:row.proofSha256},{source}=diagramReuseProof(block,artifact);
 if(!isDeepStrictEqual(row.originalAssessment,source.classification.assessment)||row.previousTaskHash!==reasoningTaskHash(source)||row.currentTaskHash!==reasoningTaskHash(block))return false;
 return ['reasoningScore','difficulty','difficultyReason'].every(k=>rating[k]===source.classification[k])&&isDeepStrictEqual(rating.assessment,reusedDiagramAssessment(source,block,artifact));
}
// Explicit authoring/repair opt-in. A model response or a saved boolean cannot
// approve semantic equivalence; the coordinator must inspect the pinned source,
// relationship/multiplicity invariants and actual visual evidence at creation.
export function reuseDiagramPresentationRating(source,target,{proofArtifact,confirmEquivalent}={}){
 if(typeof confirmEquivalent!=='function')throw Error('Coordinator diagram-equivalence review required');
 const checked=diagramReuseProof(target,proofArtifact,{checkImages:true});
 if(!isDeepStrictEqual(checked.source,source)||source.id!==target.id||!isDeepStrictEqual(checked.inverse,source))throw Error('Diagram-only whole-block inverse failed');
 if(confirmEquivalent(structuredClone({source,target,proof:checked.proof,semanticEvidence:checked.semantic,visualEvidence:checked.visual}))!==true)throw Error('Diagram equivalence not confirmed');
 return{reasoningScore:source.classification.reasoningScore,difficulty:source.classification.difficulty,difficultyReason:source.classification.difficultyReason,assessment:reusedDiagramAssessment(source,target,proofArtifact)};
}
export function assessedRating(block,rating,{model,assessedAt,evidence}){
 if(!validRawRating(rating)||!model||!Number.isFinite(Date.parse(assessedAt))||!evidence)throw Error('Incomplete LLM reasoning assessment for '+block.id);
 return {reasoningScore:rating.reasoningScore,difficulty:difficultyBandForScore(rating.reasoningScore),difficultyReason:rating.difficultyReason.trim(),assessment:{model,assessedAt,rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(block),evidence}};
}
export function validatePacketRatings(packet){
 for(const {block} of practiceRatingBlocks(packet))if(!validRawRating(block.classification))throw Error('Missing or invalid individual reasoning rating: '+block.id);
}
// A fresh model supplies the score and rationale; the rubric determines its band.
// This does not create assessment provenance or change saved project ratings.
export function normaliseAuthoredRatingBands(packet){
 for(const {block} of practiceRatingBlocks(packet)){
  const rating=block.classification,score=rating?.reasoningScore;
  if(Number.isInteger(score)&&score>=0&&score<=100)rating.difficulty=difficultyBandForScore(score);
 }
 return packet;
}
export function stampPacketRatings(packet,metrics,evidence){
 validatePacketRatings(packet);
 for(const {block} of practiceRatingBlocks(packet)){
  if(verifiedRating(block))continue;
  if(!metrics?.model||!metrics?.endedAt||metrics.externalModelCalls===0)throw Error('Missing LLM assessment provenance: '+block.id);
  block.classification={...block.classification,...assessedRating(block,block.classification,{model:metrics.model,assessedAt:metrics.endedAt,evidence})};
 }
 return packet;
}
// A mapping/validator repair can reuse the original model assessment. Recover
// it before applying repairs, so a changed mathematical task stays stale.
export function restorePacketRatings(packet,{runDir,out}){
 if(practiceRatingBlocks(packet).every(({block})=>verifiedRating(block)))return packet;
 const folder=path.basename(out),assignment=path.basename(path.dirname(out)),match=/^page-(\d+)\.author\.(\d+)$/.exec(folder);
 const file=path.join(runDir,'semantic-packets/attempt-events.jsonl');if(!fs.existsSync(file))return packet;
 const events=fs.readFileSync(file,'utf8').split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}});
 const event=events.findLast(e=>e.stage==='author'&&e.metrics?.model&&e.metrics?.endedAt&&e.metrics.externalModelCalls!==0&&(match?e.page===Number(match[1])&&e.attempt===Number(match[2]):e.assignmentId===assignment&&e.attempt===Number(folder)));
 // Recover only ratings that already satisfy the rubric. An invalid sibling
 // must remain unverified and available for a real scoped assessment repair;
 // ordinary packet validation still rejects it until that repair is complete.
 if(event)for(const {block} of practiceRatingBlocks(packet))if(validRawRating(block.classification)&&!verifiedRating(block))stampPacketRatings({sections:[{phase:'practice',blocks:[block]}]},event.metrics,path.relative(process.cwd(),path.join(out,'generation.json')).replaceAll('\\','/'));
 restoreLocalRepairRatings(packet,{runDir,out,seen:new Set()});
 return packet;
}
const fileHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rawRating=block=>{const {assessment,...rating}=block.classification??{};return rating;};
const sameRatingTask=(a,b)=>reasoningTaskHash(a)===reasoningTaskHash(b)&&isDeepStrictEqual(rawRating(a),rawRating(b));
function checkedRunArtifact(runDir,artifact){
 const file=fs.realpathSync(artifact.path),relative=path.relative(fs.realpathSync(runDir),file);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||fileHash(file)!==artifact.hash)throw Error('Changed or foreign rating provenance');
 return file;
}
function matchingRepair(decision,record){return decision?.action==='attempt-patches'&&decision.repairs?.some(r=>r.request.page===record.context.page&&r.request.fromAttempt===record.context.fromAttempt&&r.request.assignmentId===record.context.assignmentId&&isDeepStrictEqual(r.patches,record.patches));}
// Historical local repairs retained the actual response and call metrics but
// omitted their link from local-repair.json. Recover only an exact matching
// decision; never use a similar question or an earlier rating for changed maths.
function repairAssessment(runDir,record){
 const candidates=record.assessment?[record.assessment]:fs.readdirSync(runDir).filter(n=>n.startsWith('background-repair-')).flatMap(n=>{
  const dir=path.join(runDir,n),file=path.join(dir,'decision.json');
  if(!fs.existsSync(file)||!matchingRepair(JSON.parse(fs.readFileSync(file,'utf8')),record))return [];
  return fs.readdirSync(dir).filter(f=>/^assessment-provenance-\d+\.json$/.test(f)).map(f=>({path:path.join(dir,f),hash:fileHash(path.join(dir,f))}));
 });
 for(const artifact of candidates){
  const file=checkedRunArtifact(runDir,artifact),proof=JSON.parse(fs.readFileSync(file,'utf8')),m=proof.metrics;
  if(m?.provider!=='codex'||m.externalModelCalls===0||!m.callId||!m.usage||!m.model||!Number.isFinite(Date.parse(m.endedAt)))continue;
  const response=fs.realpathSync(proof.response),relative=path.relative(fs.realpathSync(runDir),response);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Foreign rating response');
  const responseHash=fileHash(response),text=fs.readFileSync(response,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  if(!matchingRepair(JSON.parse(text),record))continue;
  return {model:m.model,assessedAt:m.endedAt,evidence:path.relative(process.cwd(),response).replaceAll('\\','/'),verify(){checkedRunArtifact(runDir,artifact);if(fileHash(response)!==responseHash)throw Error('Rating response changed');}};
 }
}
export function bindRepairAssessment(packet,record,{runDir}){
 if(!record.assessment)return packet;
 const assessment=repairAssessment(runDir,record);
 if(!assessment)throw Error('No exact actual model assessment for local repair');
 for(const patch of record.patches.filter(p=>p.field==='/classification')){
  const block=practiceRatingBlocks(packet).find(({block})=>block.id===patch.targetId)?.block;
  if(!block||!isDeepStrictEqual(rawRating(block),patch.corrected))throw Error('Assessed classification differs from applied repair');
  assessment.verify();block.classification={...block.classification,...assessedRating(block,block.classification,assessment)};
 }
 return packet;
}
function restoreLocalRepairRatings(packet,{runDir,out,seen}){
 if(practiceRatingBlocks(packet).every(({block})=>verifiedRating(block)))return;
 const current=fs.realpathSync(out),relative=path.relative(fs.realpathSync(runDir),current);
 if(relative.startsWith('..')||path.isAbsolute(relative)||seen.has(current)||seen.size>=64)throw Error('Invalid rating repair ancestry');
 seen.add(current);
 const local=path.join(current,'local-repair.json'),replay=path.join(current,'revalidation.json');
 if(!fs.existsSync(local)&&!fs.existsSync(replay))return;
 const record=fs.existsSync(local)?JSON.parse(fs.readFileSync(local,'utf8')):null;
 const artifacts=record?[...record.context.source,...record.context.evidence,...record.review.artifacts]:[JSON.parse(fs.readFileSync(replay,'utf8')).modelOutput];
 const files=artifacts.map(a=>checkedRunArtifact(runDir,a));
 const sourceFile=record?files.find(f=>path.basename(f)==='generation.json'):files[0];
 if(!sourceFile)throw Error('Missing original rating generation');
 const generation=JSON.parse(fs.readFileSync(sourceFile,'utf8')),source=structuredClone((generation.packets??[generation]).find(p=>p.pageNumber===packet.pageNumber));
 if(!source)throw Error('Rating ancestry page changed');
 // An actual original author call is restored before walking local ancestry.
 const sourceOut=path.dirname(sourceFile),eventsFile=path.join(runDir,'semantic-packets/attempt-events.jsonl');
 const events=fs.existsSync(eventsFile)?fs.readFileSync(eventsFile,'utf8').split('\n').filter(Boolean).map(s=>JSON.parse(s)):[];
 const folder=path.basename(sourceOut),assignment=path.basename(path.dirname(sourceOut)),match=/^page-(\d+)\.author\.(\d+)$/.exec(folder);
 const event=events.findLast(e=>e.stage==='author'&&e.metrics?.model&&e.metrics?.endedAt&&e.metrics.externalModelCalls!==0&&(match?e.page===Number(match[1])&&e.attempt===Number(match[2]):e.assignmentId===assignment&&e.attempt===Number(folder)));
 if(event)for(const {block}of practiceRatingBlocks(source))if(validRawRating(block.classification)&&!verifiedRating(block))stampPacketRatings({sections:[{phase:'practice',blocks:[block]}]},event.metrics,path.relative(process.cwd(),sourceFile).replaceAll('\\','/'));
 restoreLocalRepairRatings(source,{runDir,out:sourceOut,seen});
 const originals=new Map(practiceRatingBlocks(source).map(({block})=>[block.id,block]));
 for(const {block}of practiceRatingBlocks(packet)){const before=originals.get(block.id);if(!verifiedRating(block)&&before&&verifiedRating(before)&&sameRatingTask(block,before))block.classification.assessment=structuredClone(before.classification.assessment);}
 if(record){
  const ratingPatches=record.patches.filter(p=>p.field==='/classification');
  const pending=practiceRatingBlocks(packet).filter(({block})=>!verifiedRating(block)&&validRawRating(block.classification)&&ratingPatches.some(p=>p.targetId===block.id&&isDeepStrictEqual(rawRating(block),p.corrected)));
  if(pending.length){
   const saved=JSON.parse(fs.readFileSync(path.join(current,'generation.json'),'utf8')),savedPacket=(saved.packets??[saved]).find(p=>p.pageNumber===packet.pageNumber),savedBlocks=new Map(practiceRatingBlocks(savedPacket).map(({block})=>[block.id,block]));
   const assessment=repairAssessment(runDir,record);
   if(assessment)for(const {block}of pending)if(savedBlocks.has(block.id)&&sameRatingTask(block,savedBlocks.get(block.id))){assessment.verify();block.classification={...block.classification,...assessedRating(block,block.classification,assessment)};}
  }
 }
 for(const artifact of artifacts)checkedRunArtifact(runDir,artifact);
}
export function recoverStoredRatingFile(out,targets,cache,{root,cacheDir}){
 const inputFile=path.join(out,'input.json'),rawFile=path.join(out,'last-message.txt'),metricsFile=path.join(out,'metrics.json');
 if(![inputFile,rawFile,metricsFile].every(file=>fs.existsSync(file)))return 0;
 let input,result,metrics;try{const payload=JSON.parse(fs.readFileSync(inputFile,'utf8'));input=Array.isArray(payload)?payload:payload.questions;result=JSON.parse(fs.readFileSync(rawFile,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));metrics=JSON.parse(fs.readFileSync(metricsFile,'utf8'));}catch{return 0;}
 if(!Array.isArray(input)||!Array.isArray(result.ratings)||typeof metrics.model!=='string'||!metrics.model.trim()||!Number.isFinite(Date.parse(metrics.endedAt))||metrics.externalModelCalls===0)return 0;
 let recovered=0;
 for(const source of input){
  const id=source.sourceId??source.id,block=targets.get(id),answers=result.ratings.filter(r=>r.id===source.id),raw=answers[0];
  if(!block||answers.length!==1||source.taskHash!==reasoningTaskHash(block)||raw.taskHash!==undefined&&raw.taskHash!==source.taskHash||raw.blocker)continue;
  const rating={...raw,difficulty:difficultyBandForScore(raw.reasoningScore)};if(!validRawRating(rating))continue;
  const assessed=assessedRating(block,rating,{model:metrics.model,assessedAt:metrics.endedAt,evidence:path.relative(root,rawFile).replaceAll('\\','/')});
  cache.set(source.taskHash,assessed);fs.mkdirSync(cacheDir,{recursive:true});fs.writeFileSync(path.join(cacheDir,source.taskHash+'.json'),JSON.stringify(assessed,null,2)+'\n');targets.delete(id);recovered++;
 }
 return recovered;
}
export function ratingCoverage(project){
 const rows=practiceRatingBlocks(project),missing=rows.filter(({block})=>!verifiedRating(block));
 return {total:rows.length,verified:rows.length-missing.length,missing:missing.map(({block})=>block.id)};
}
export function requireReasoningCoverage(project){
 const report=ratingCoverage(project);
 if(report.missing.length)throw Error(`Incomplete LLM reasoning ratings: ${report.missing.length}/${report.total}; ${report.missing.slice(0,8).join(', ')}`);
 return report;
}
