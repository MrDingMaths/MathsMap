import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

export const WORKED_CORRECTION_KIND='worked-answer-mathematical-correction-v1';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const safePath=value=>Array.isArray(value)&&value.every(k=>(typeof k==='string'||Number.isInteger(k))&&!['__proto__','constructor','prototype'].includes(k));
const at=(value,parts)=>parts.reduce((v,k)=>v?.[k],value);
const pinned=artifact=>{
 if(typeof artifact?.path!=='string'||!/^[a-f0-9]{64}$/.test(artifact.sha256??''))throw Error('Missing pinned worked-correction evidence');
 const bytes=fs.readFileSync(artifact.path);
 if(createHash('sha256').update(bytes).digest('hex')!==artifact.sha256)throw Error('Worked-correction evidence changed');
 return JSON.parse(bytes);
};
const ratingFields=['reasoningScore','difficulty','difficultyReason','assessment'];
const rating=value=>Object.fromEntries(ratingFields.map(k=>[k,value?.[k]]));
export function workedCorrectionAssessment(source,target,artifact,{reasoningTaskHash}){
 const original=source.classification.assessment,assessment=structuredClone(original);
 assessment.originalTaskHash??=original.taskHash;
 assessment.taskHash=reasoningTaskHash(target);
 assessment.workedMathematicalCorrectionReuse={kind:WORKED_CORRECTION_KIND,sourceId:source.id,targetId:target.id,previousTaskHash:reasoningTaskHash(source),currentTaskHash:reasoningTaskHash(target),proofFile:artifact.path,proofSha256:artifact.sha256,originalAssessment:structuredClone(original),correctedMathematics:true,newDemand:false,assessmentReused:true,newAssessmentPerformed:false};
 return assessment;
}
export function checkedWorkedCorrection(target,artifact,hooks){
 const {reasoningTaskHash,verifiedRating}=hooks,proof=pinned(artifact);
 if(proof.kind!==WORKED_CORRECTION_KIND||!safePath(proof.sourceArtifact?.blockPath))throw Error('Invalid worked-correction source');
 const source=at(pinned(proof.sourceArtifact),proof.sourceArtifact.blockPath);
 if(!source||source.id!==target.id||proof.sourceId!==source.id||proof.targetId!==target.id||!verifiedRating(source))throw Error('Unverified worked-correction source/identity');
 const oldHash=reasoningTaskHash(source),newHash=reasoningTaskHash(target);
 if(proof.sourceTaskHash!==oldHash||proof.targetTaskHash!==newHash||oldHash===newHash)throw Error('Worked-correction task hash mismatch');
 if(!Array.isArray(proof.changes)||!proof.changes.length)throw Error('Missing scoped Worked changes');
 const inverse=structuredClone(target),seen=[];
 for(const change of proof.changes){
  const parts=change.path;
  if(!safePath(parts)||parts[0]!=='content'||parts.at(-2)!=='answer'||parts.at(-1)!=='worked'||seen.some(p=>isDeepStrictEqual(p,parts)))throw Error('Only disjoint Worked text may change');
  seen.push(parts);const before=at(source,parts),after=at(target,parts);
  if(typeof before!=='string'||typeof after!=='string'||before===after||hash(before)!==change.beforeSha256||hash(after)!==change.afterSha256)throw Error('Worked-correction exact inverse mismatch');
  // Supplied answers are givens and cannot use this correction path.
  for(let i=1;i<parts.length;i++){const ancestor=at(source,parts.slice(0,i));if(ancestor?.responseSpace==='given'||ancestor?.responseKind==='given')throw Error('Supplied given cannot be corrected as an answer');}
  at(inverse,parts.slice(0,-1))[parts.at(-1)]=before;
 }
 // Accept only the old rating or the exact lineage this helper constructs.
 // No other metadata, layout, prompt, short answer, diagram or dependency moves.
 const expected={...rating(source.classification),assessment:workedCorrectionAssessment(source,target,artifact,hooks)};
 for(const parts of [['classification'],['flow','localDifficulty']]){
  const original=at(source,parts),current=at(target,parts);
  if(isDeepStrictEqual(original,current))continue;
  if(!original||!current||!isDeepStrictEqual(current,{...original,...expected}))throw Error('Rating or unrelated metadata changed');
  at(inverse,parts.slice(0,-1))[parts.at(-1)]=structuredClone(original);
 }
 if(!isDeepStrictEqual(inverse,source))throw Error('Non-Worked content, posed task, diagram, scaffold or dependency changed');
 const mathematicalReview=pinned(proof.mathematicalCorrectionReview),applicabilityReview=pinned(proof.retainedAssessmentApplicabilityReview);
 const bound=review=>review.sourceId===source.id&&review.targetId===target.id&&review.sourceTaskHash===oldHash&&review.targetTaskHash===newHash&&typeof review.rationale==='string'&&review.rationale.trim();
 if(!bound(mathematicalReview)||mathematicalReview.kind!=='independent-worked-mathematical-correction-acceptance-v1'||mathematicalReview.accepted!==true||mathematicalReview.correctedMathematics!==true||mathematicalReview.newDemand!==false)throw Error('Missing independent mathematical-correction acceptance');
 if(!bound(applicabilityReview)||applicabilityReview.kind!=='independent-retained-assessment-applicability-v1'||applicabilityReview.retainOriginalAssessment!==true||applicabilityReview.conflict!==false||applicabilityReview.newDemand!==false||!isDeepStrictEqual(applicabilityReview.originalRating,rating(source.classification)))throw Error('Retained assessment conflict or missing applicability verdict');
 // Both independent verdicts cite the actual durable reviewer response, not an
 // uncited coordinator boolean. The caller authenticates its meaning on creation.
 const mathematicalEvidence=pinned(mathematicalReview.evidence),applicabilityEvidence=pinned(applicabilityReview.evidence),retainedDecisionEvidence=pinned(applicabilityReview.retainedDecisionEvidence);
 const reviewedInput=pinned(mathematicalReview.reviewedInput);
 if(!safePath(mathematicalReview.reviewedSourcePath)||!safePath(mathematicalReview.reviewedTargetPath))throw Error('Missing actual mathematical review input binding');
 const reviewedSource=at(reviewedInput,mathematicalReview.reviewedSourcePath),reviewedTarget=at(reviewedInput,mathematicalReview.reviewedTargetPath);
 if(reviewedSource?.id!==source.id||reviewedTarget?.id!==target.id||!isDeepStrictEqual(reviewedSource.content,source.content)||!isDeepStrictEqual(reviewedTarget.content,target.content)||reasoningTaskHash(reviewedSource)!==oldHash||reasoningTaskHash(reviewedTarget)!==newHash)throw Error('Actual mathematical review input differs from correction');
 const verdict=(review,evidence)=>{if(!safePath(review.evidenceVerdictPath))throw Error('Missing actual reviewer verdict path');const row=at(evidence,review.evidenceVerdictPath);if(!row||row.ownerId!==source.id)throw Error('Actual reviewer verdict identity mismatch');return row;};
 const mathematicalVerdict=verdict(mathematicalReview,mathematicalEvidence),applicabilityVerdict=verdict(applicabilityReview,applicabilityEvidence);
 if(mathematicalVerdict.pass!==true||mathematicalVerdict.requiredCorrections?.length||mathematicalVerdict.blockers?.length)throw Error('Actual mathematical reviewer did not accept correction');
 if(applicabilityVerdict.retainedAssessmentApplicable!==true||applicabilityVerdict.numericConflict!==false||applicabilityVerdict.newDemand!==false||applicabilityVerdict.newNumericAssessment!==false||applicabilityVerdict.blockers?.length)throw Error('Actual applicability reviewer rejected retained assessment');
 if(applicabilityVerdict.sourceTaskHash!==oldHash||applicabilityVerdict.targetTaskHash!==newHash)throw Error('Actual applicability verdict belongs to a different correction');
 for(const [name,expected] of [['source',source],['reviewedCandidate',target]]){
  const artifact=applicabilityVerdict[name];if(!safePath(artifact?.blockPath))throw Error('Missing actual applicability snapshot');
  const reviewed=at(pinned(artifact),artifact.blockPath);
  if(!reviewed||hash(reviewed)!==artifact.blockSha256||reasoningTaskHash(reviewed)!==artifact.taskHash||artifact.taskHash!==reasoningTaskHash(expected)||reviewed.id!==expected.id||!isDeepStrictEqual(reviewed.content,expected.content))throw Error('Actual applicability snapshot differs from correction');
  if(name==='source'&&!isDeepStrictEqual(reviewed,source))throw Error('Actual applicability original assessment or source metadata changed');
 }
 const retainedVerdict=verdict({...applicabilityReview,evidenceVerdictPath:applicabilityReview.retainedDecisionVerdictPath},retainedDecisionEvidence);
 if(retainedVerdict.retain!==true||retainedVerdict.conflict===true||retainedVerdict.newDemand===true||retainedVerdict.blockers?.length)throw Error('Actual reviewer rejected retained assessment');
 return {source,proof,mathematicalReview,applicabilityReview,mathematicalEvidence,applicabilityEvidence,retainedDecisionEvidence,inverse};
}
