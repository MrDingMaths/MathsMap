import {readPinnedEvidenceBytes} from './pinned-evidence-reader.mjs';
// Finite Studio source-attachment projection. This does not normalize content,
// alter a capture or accept a new assessment. Callers authenticate the producer.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {preserveSourceLineage} from './source-lineage.mjs';
const need=(ok,message)=>{if(!ok)throw Error(message);};
const at=(v,p)=>p.reduce((x,k)=>x?.[k],v);
const blocks=p=>(p.sections??[]).flatMap(s=>s.blocks??[]);
const find=(p,id)=>{const matches=blocks(p).filter(b=>b.id===id);need(matches.length===1,'Unique SDK projection owner required');return matches[0];};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function pinned(a){need(typeof a?.path==='string'&&/^[a-f0-9]{64}$/.test(a.sha256??''),'Missing pinned SDK projection artifact');const bytes=readPinnedEvidenceBytes(a);need(hash(bytes)===a.sha256,'SDK projection artifact changed');return JSON.parse(bytes);}
const validStamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
function restoreProjectStamps(project,before){
 need(project.id===before.id&&Number.isSafeInteger(project.revision)&&project.revision===before.revision+1&&validStamp(project.updatedAt),'Invalid SDK revision/stamp projection');
 need(project.createdAt===before.createdAt,'SDK projection cannot change creation provenance');project.revision=before.revision;project.updatedAt=before.updatedAt;
}
export function checkedSdkAdditionMetadataProjection(proof,rawSource,canonicalRoot,hooks){
 const evidence=pinned(proof.sdkMetadataProjectionEvidence);need(evidence.kind==='studio-additionTo-metadata-only-projection-v1','Foreign SDK metadata projection');
 need(same(evidence.canonicalOutputArtifact,proof.targetArtifact),'SDK canonical output differs from target');
 const renderedArtifact=evidence.renderedTargetArtifact,renderedRoot=pinned(renderedArtifact),rendered=at(renderedRoot,renderedArtifact.blockPath),canonical=at(canonicalRoot,proof.targetArtifact.blockPath);
 need(rendered?.id===rawSource.id&&canonical?.id===rawSource.id&&renderedRoot.id===canonicalRoot.id,'Foreign SDK owner/project');
 const capturedBaseline=pinned(evidence.capturedBaselineArtifact),currentBaseline=pinned(evidence.currentBaselineArtifact),input=pinned(evidence.sdkInputArtifact);
 need(capturedBaseline.id===canonicalRoot.id&&currentBaseline.id===canonicalRoot.id&&input.id===canonicalRoot.id,'SDK baseline project changed');
 const oldProjection=structuredClone(renderedRoot);oldProjection.sections.forEach(s=>s.blocks=s.blocks.filter(b=>b.id!==rawSource.id));need(same(oldProjection,capturedBaseline),'Captured pre-SDK project baseline differs');
 need(!blocks(currentBaseline).some(b=>b.id===rawSource.id),'SDK projection owner was not new');
 const currentInverse=structuredClone(currentBaseline);
 if(evidence.baselineAssessmentRepair){
  const repair=evidence.baselineAssessmentRepair,before=find(capturedBaseline,repair.ownerId),after=find(currentBaseline,repair.ownerId),receipt=pinned(repair.publicationArtifact);
  need(repair.ownerId!==rawSource.id&&receipt.projectId===canonicalRoot.id&&receipt.from===capturedBaseline.revision&&receipt.to===currentBaseline.revision&&receipt.savedSha256===evidence.currentBaselineArtifact.sha256&&receipt.readback===true&&same(receipt.bankWrites,[])&&same(receipt.diff?.added,[])&&same(receipt.diff?.removed,[])&&same(receipt.diff?.changed,[repair.ownerId])&&same(receipt.diff?.otherFields,[]),'Invalid prior assessment-only publication');
  for(const key of ['model','effort','assessedAt','rubricVersion','taskHash','evidence','callId','originalTaskHash'])need(before.classification?.assessment?.[key]===after.classification?.assessment?.[key],'SDK baseline repair changed original assessment facts');
  need(hooks.verifiedRating(after)&&hooks.reasoningTaskHash(before)===hooks.reasoningTaskHash(after),'SDK baseline repair changed demand or lacks valid lineage');
  find(currentInverse,repair.ownerId).classification.assessment=structuredClone(before.classification.assessment);restoreProjectStamps(currentInverse,capturedBaseline);
 }else need(same(currentBaseline,capturedBaseline),'Unrecorded SDK baseline difference');
 need(same(currentInverse,capturedBaseline),'SDK baseline repair changed more than explicit assessment provenance/stamps');
 const inputInverse=structuredClone(input);inputInverse.sections.forEach(s=>s.blocks=s.blocks.filter(b=>b.id!==rawSource.id));need(same(inputInverse,currentBaseline)&&same(find(input,rawSource.id),rendered),'SDK input changed an existing owner or captured table task');
 const addition=canonical.sourceReview?.additionTo;need(addition&&same(Object.keys(addition).sort(),['blockId','projectId'])&&addition.projectId===canonicalRoot.id&&addition.blockId!==rawSource.id,'Invalid SDK addition reference');
 const anchor=find(currentBaseline,addition.blockId);need(find(input,addition.blockId).id===anchor.id,'SDK reference anchor absent');
 need(rawSource.sourceReview&&rawSource.sourceReview.additionTo===undefined&&rendered.sourceReview?.additionTo===undefined,'SDK projection cannot rewrite existing source attachments');
 const outputInverse=structuredClone(canonicalRoot);delete find(outputInverse,rawSource.id).sourceReview.additionTo;restoreProjectStamps(outputInverse,input);need(same(outputInverse,input),'SDK output changed print content, source identity, roles, scores or other fields');
 const replay=preserveSourceLineage(currentBaseline,structuredClone(input));const outputWithoutStamps=structuredClone(canonicalRoot);outputWithoutStamps.revision=input.revision;outputWithoutStamps.updatedAt=input.updatedAt;need(same(replay,outputWithoutStamps),'Actual SDK source-lineage replay differs from canonical output');
 const producer=pinned(evidence.producerReceiptArtifact);need(producer.kind==='actual-studio-sdk-readonly-preparation-v1'&&producer.api==='prepareProjectWrite'&&producer.previousSha256===evidence.currentBaselineArtifact.sha256&&producer.inputSha256===evidence.sdkInputArtifact.sha256&&producer.outputSha256===proof.targetArtifact.sha256&&same(producer.bankWrites,[])&&producer.producer?.module==='scripts/booklet/project-studio-server.mjs'&&/^[a-f0-9]{64}$/.test(producer.producer.sha256??''),'Stale or foreign SDK producer output');
 const moduleArtifact=evidence.producerModuleArtifact;need(typeof moduleArtifact?.path==='string'&&hash(readPinnedEvidenceBytes(moduleArtifact))===moduleArtifact.sha256&&moduleArtifact.sha256===producer.producer.sha256,'SDK producer module bytes differ');
 const review=pinned(evidence.independentReplayEvidence);need(review.accepted===true&&review.kind==='independent-sdk-metadata-projection-review-v1'&&same(review.renderedTargetArtifact,renderedArtifact)&&same(review.canonicalOutputArtifact,proof.targetArtifact)&&same(review.sdkInputArtifact,evidence.sdkInputArtifact)&&review.printFieldsAndTaskHashesUnchanged===true&&review.actualSdkReplayVerified===true&&same(review.producerReceiptArtifact,evidence.producerReceiptArtifact)&&same(review.producerModuleArtifact,moduleArtifact),'Independent SDK metadata replay acceptance required');
 const source=structuredClone(rawSource);source.sourceReview.additionTo=structuredClone(addition);const sourceArtifact=evidence.enrichedSourceArtifact,enriched=at(pinned(sourceArtifact),sourceArtifact.blockPath);need(same(source,enriched)&&hooks.reasoningTaskHash(source)===hooks.reasoningTaskHash(rawSource)&&same(source.classification,rawSource.classification),'SDK rated source enrichment differs');
 const rawInverse=structuredClone(enriched);delete rawInverse.sourceReview.additionTo;need(same(rawInverse,rawSource),'SDK rated-source metadata inverse failed');
 return {source,renderedRoot,renderedArtifact,rendered,evidence};
}
