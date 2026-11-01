import {readPinnedEvidenceBytes} from './pinned-evidence-reader.mjs';
// Explicit authoring opt-in. Never normalize on load or manufacture an assessment.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {fromSource} from '../../public/libs/maths-editor/document-model.mjs';
import {checkedSdkAdditionMetadataProjection} from './sdk-addition-metadata-projection.mjs';

export const NATIVE_TABLE_REPRESENTATION_KIND='native-table-representation-only-v1';
const need=(ok,message)=>{if(!ok)throw Error(message);};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const at=(value,parts)=>parts.reduce((v,k)=>v?.[k],value);
function pinned(artifact){
 need(typeof artifact?.path==='string'&&/^[a-f0-9]{64}$/.test(artifact.sha256??''),'Missing pinned native-table artifact');
 const bytes=readPinnedEvidenceBytes(artifact);need(hash(bytes)===artifact.sha256,'Native-table artifact changed');return JSON.parse(bytes);
}
// Intentionally narrow: one fully bordered rectangular array of plain scalar
// maths/empty cells. Fractions, spans, nested commands and ambiguous TeX stay held.
export function simpleArrayRepresentation(source){
 need(typeof source==='string','Native-table source must be a string');
 const matches=[...source.matchAll(/\$\$\\begin\{array\}\{([^}]+)\}([\s\S]*?)\\end\{array\}\$\$/g)];
 need(matches.length===1,'Exactly one complete display array required');const m=matches[0];
 need(/^\|(?:[clr]\|)+$/.test(m[1]),'Only fully bordered scalar columns supported');
 const columns=m[1].replaceAll('|','').split(''),body=m[2],boundaries=body.split('\\hline');
 need(boundaries[0].trim()===''&&boundaries.at(-1).trim()===''&&boundaries.length>=3,'Top and bottom source rules required');
 const lines=boundaries.slice(1,-1).map(segment=>{const row=segment.trim();need(row.endsWith('\\\\'),'Exactly one rule after each complete source row required');const cells=row.slice(0,-2).trim();need(cells!==''&&!cells.includes('\\\\'),'Misplaced source table rule or multiple rows per boundary');return cells;});
 need(columns.length>0&&columns.length<=12&&lines.length>0&&lines.length<=12,'Bounded rectangular table required');
 need((body.match(/\\hline/g)??[]).length===lines.length+1,'Every row boundary must remain bordered');
 const matrix=lines.map(line=>line.split('&').map(cell=>cell.trim()));
 need(matrix.every(row=>row.length===columns.length),'Ragged source array');
 need(matrix.flat().every(cell=>cell===''||/^[+-]?(?:\d+(?:\.\d+)?|[A-Za-z])$/.test(cell)),'Unsupported source cell syntax');
 return {span:m[0],offset:m.index,columns,matrix,prefix:source.slice(0,m.index),suffix:source.slice(m.index+m[0].length)};
}
export function nativeTableRepresentationDocument(source,{idPrefix}={}){
 need(typeof idPrefix==='string'&&/^[A-Za-z0-9_.-]+$/.test(idPrefix),'Stable native-table ID prefix required');
 const parsed=simpleArrayRepresentation(source),markdown=parsed.matrix.map((row,i)=>'| '+row.map(cell=>cell?'$'+cell+'$':'').join(' | ')+' |'+(i===0?'\n| '+row.map(()=> '---').join(' | ')+' |':'')).join('\n');
 const doc=fromSource(parsed.prefix+markdown+parsed.suffix),tables=doc.blocks.filter(b=>b.type==='table');need(tables.length===1,'Conversion must create one native table');const table=tables[0];
 need(table.rows.length===parsed.matrix.length&&table.rows.every(row=>row.length===parsed.columns.length),'Native table dimensions changed');
 table.rows.forEach((row,r)=>row.forEach((cell,c)=>{
  cell.header=false;cell.background=null;cell.bold=false;cell.align={c:'center',l:'left',r:'right'}[parsed.columns[c]];
  need(cell.blocks.length===1&&cell.blocks[0].type==='paragraph','One native paragraph per cell required');const p=cell.blocks[0];p.align=cell.align;
  const value=parsed.matrix[r][c];need(value?same(p.inlines,[{type:'math',latex:value,display:false}]):p.inlines.length===0,'Native mathematical/blank cell changed');
 }));
 let index=0;function identify(v){if(!v||typeof v!=='object')return;if(Object.hasOwn(v,'id'))v.id=idPrefix+'-'+(++index);for(const x of Object.values(v))if(x&&typeof x==='object')identify(x);}identify(doc);
 return doc;
}
function validFieldPath(parts){
 if(!Array.isArray(parts)||parts[0]!=='content')return false;let i=1;while(parts[i]==='children'&&Number.isInteger(parts[i+1])&&parts[i+1]>=0)i+=2;
 return i===parts.length-1&&parts[i]==='prompt'||i===parts.length-2&&parts[i]==='answer'&&['short','worked'].includes(parts[i+1]);
}
export function checkedNativeTableRepresentationProof(target,artifact,hooks,{checkImages=false}={}){
 need(typeof hooks?.verifiedRating==='function'&&typeof hooks?.reasoningTaskHash==='function','Native-table rating hooks required');
 const proof=pinned(artifact);need(proof.kind===NATIVE_TABLE_REPRESENTATION_KIND&&Array.isArray(proof.sourceArtifact?.blockPath)&&Array.isArray(proof.targetArtifact?.blockPath),'Invalid native-table proof');
 const rawSource=at(pinned(proof.sourceArtifact),proof.sourceArtifact.blockPath),targetRoot=pinned(proof.targetArtifact),snapshot=at(targetRoot,proof.targetArtifact.blockPath),projection=proof.sdkMetadataProjectionEvidence?checkedSdkAdditionMetadataProjection(proof,rawSource,targetRoot,hooks):null,source=projection?.source??rawSource,renderedArtifact=projection?.renderedArtifact??proof.targetArtifact,renderedRoot=projection?.renderedRoot??targetRoot;
 need(source?.id===target.id&&snapshot?.id===target.id&&hooks.verifiedRating(source),'Unverified original native-table task');
 need(proof.sourceTaskHash===hooks.reasoningTaskHash(source)&&proof.targetTaskHash===hooks.reasoningTaskHash(target),'Foreign native-table task hash');
 const noAssessment=b=>{const copy=structuredClone(b);delete copy.classification.assessment;return copy;};
 need(same(noAssessment(snapshot),noAssessment(target))&&same(snapshot.classification.assessment,source.classification.assessment),'Native-table target snapshot changed');
 const request=pinned(proof.initialRequestArtifact),reply=pinned(proof.initialReviewArtifact),review=reply.result?.items?.find(r=>r.id===source.id),assessment=source.classification.assessment;
 need(proof.initialReviewArtifact.path===assessment.evidence&&review?.taskHash===proof.sourceTaskHash&&request.targets?.filter(r=>r.id===source.id&&r.taskHash===proof.sourceTaskHash).length===1,'Foreign original native-table review');
 need(reply.metrics?.model===assessment.model&&reply.metrics?.effort===assessment.effort&&reply.metrics?.endedAt===assessment.assessedAt&&reply.metrics?.callId===assessment.callId&&request.configuration?.model===assessment.model&&request.configuration?.effort===assessment.effort,'Original native-table assessment provenance differs');
 need(review.answersVerified===true&&review.sourceNativeEquivalent===true&&review.sourceAsksPreserved===true&&review.taughtMethod===true&&review.newTeachingRequired===false&&review.reasoningScore===source.classification.reasoningScore&&review.difficultyReason===source.classification.difficultyReason,'Original combined review did not verify this task');
 need(Array.isArray(proof.changes)&&proof.changes.length>0&&proof.changes.length<=8,'Bounded native-table conversions required');
 const inverse=structuredClone(target),seen=[],matrices=[],fieldRequirements=[];
 for(const change of proof.changes){
  const parts=change.path;need(validFieldPath(parts)&&!parts.some(k=>['__proto__','constructor','prototype'].includes(k)),'Unsupported native-table field');need(!seen.some(p=>same(p,parts)),'Repeated native-table path');seen.push(parts);
  const before=at(source,parts),after=at(target,parts),parsed=simpleArrayRepresentation(before),expected=nativeTableRepresentationDocument(before,{idPrefix:change.idPrefix});
  need(same(change.matrix,parsed.matrix)&&same(after,expected),'Native-table cells, blanks, surrounding content or scaffolding changed');
  at(inverse,parts.slice(0,-1))[parts.at(-1)]=before;matrices.push({path:parts,matrix:parsed.matrix,columns:parsed.columns});
  fieldRequirements.push({path:parts,edition:parts.at(-1)==='prompt'?'student':parts.at(-1),tableId:expected.blocks.find(b=>b.type==='table').id,matrix:parsed.matrix});
 }
 inverse.classification.assessment=structuredClone(source.classification.assessment);need(same(inverse,source),'Native-table whole-block inverse failed');
 const equivalence=pinned(proof.equivalenceEvidence),visual=pinned(proof.visualEvidence);
 for(const e of [equivalence,visual])need(e.sourceTaskHash===proof.sourceTaskHash&&e.targetTaskHash===proof.targetTaskHash&&e.accepted===true,'Missing current native-table equivalence/output acceptance');
 need(equivalence.kind==='independent-native-table-representation-review-v1'&&equivalence.reviewer?.model==='gpt-6.1-terra'&&equivalence.reviewer?.effort==='high'&&same(equivalence.tables,matrices)&&equivalence.mathematicsAndScaffoldingUnchanged===true&&equivalence.answersUnchanged===true&&equivalence.surroundingContentVerified===true,'Independent native-table representation review incomplete');
 need(same(equivalence.reviewedSourceArtifact,proof.sourceArtifact)&&same(equivalence.reviewedTargetArtifact,renderedArtifact),'Independent native-table review inspected a different source or target snapshot');
 const holds=review.semanticHolds??[];need(Array.isArray(holds)&&same(equivalence.retainedInitialReviewHolds,holds),'Original review holds were lost');
 if(review.accepted!==true||holds.length)need(holds.length>0&&same(equivalence.resolvedMetadataHolds,holds.map(hold=>({hold,kind:'taxonomy-only',primarySkillId:source.classification.primarySkillId})))&&equivalence.remainingSemanticHolds?.length===0,'Original semantic hold remains unresolved');
 need(Array.isArray(visual.images)&&visual.images.length>0&&visual.affectedOutputAccepted===true&&same(visual.candidateArtifact,renderedArtifact),'Actual native-table candidate output inspection required');
 const inventory=pinned(visual.outputInventoryArtifact);need(typeof renderedRoot.id==='string'&&inventory.candidateSha256===renderedArtifact.sha256&&Array.isArray(inventory.images),'Native-table output does not bind the inspected candidate');
 const fields=pinned(visual.fieldCoverageArtifact);need(fields.kind==='native-table-output-field-map-v1'&&fields.candidateSha256===renderedArtifact.sha256&&fields.projectId===renderedRoot.id&&Array.isArray(fields.rows),'Actual native-table field/page map required');
 for(const image of visual.images){
  need(typeof image.path==='string'&&/^[a-f0-9]{64}$/.test(image.sha256??'')&&(!checkImages||hash(fs.readFileSync(image.path))===image.sha256),'Native-table visual image changed');
  need(image.ownerId===target.id&&['student','short','worked'].includes(image.edition)&&Number.isSafeInteger(image.page)&&image.page>0&&Array.isArray(image.conversionPaths),'Native-table image lacks affected owner/page/edition coverage');
  need(inventory.images.some(row=>row.path===image.path&&(row.hash??row.sha256)===image.sha256&&row.edition===image.edition&&row.page===image.page&&row.blocks?.includes(target.id)),'Native-table image is unrelated to this candidate owner/output');
 }
 for(const field of fieldRequirements){need(visual.images.some(image=>image.edition===field.edition&&image.conversionPaths.some(p=>same(p,field.path))&&fields.rows.some(row=>row.edition===image.edition&&row.page===image.page&&row.ownerId===target.id&&row.tableId===field.tableId&&same(row.documentPath,field.path)&&same(row.matrix,field.matrix)&&row.visible===true&&row.cellCount===field.matrix.flat().length)),'Missing actual output for a converted native table field');}
 return {proof,source,inverse,equivalence,visual,sdkMetadataProjection:projection?.evidence??null};
}
