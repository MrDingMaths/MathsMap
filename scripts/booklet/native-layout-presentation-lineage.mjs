import {readPinnedEvidenceBytes} from './pinned-evidence-reader.mjs';
// Explicit native-schema presentation reuse. No task-hash normalization or load migration.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {normaliseQuestion} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';

export const NATIVE_LAYOUT_PRESENTATION_KIND='native-layout-presentation-only-v1';
export const PHANTOM_EQUALS_KIND='two-phantom-m-equals-gutters-v1';
export const CELL_ALIGNMENT_KIND='two-gradient-response-cells-top-v1';
const need=(ok,message)=>{if(!ok)throw Error(message);};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const at=(v,p)=>p.reduce((x,k)=>x?.[k],v);
const safe=p=>Array.isArray(p)&&p.length&&p.every(k=>(typeof k==='string'||Number.isSafeInteger(k))&&!['__proto__','constructor','prototype'].includes(k));
const canonical=b=>sharedQuestion({...normaliseQuestion(b),title:''}).content;
function blanks(b){const out=[];const walk=(v,path=[])=>{if(!v||typeof v!=='object')return;if(v.type==='cloze'){const value=structuredClone(v);delete value.id;out.push({path,value});}for(const[k,x]of Object.entries(v))if(x&&typeof x==='object')walk(x,[...path,k]);};walk(b.content);return out.sort((a,b)=>JSON.stringify(a.path).localeCompare(JSON.stringify(b.path)));}
function nativeMath(value){const out=[];const walk=(v,path=[])=>{if(!v||typeof v!=='object')return;if(v.type==='math')out.push({path,latex:v.latex});if(['tikz','svg'].includes(v.format)&&typeof v.code==='string')out.push({path,format:v.format,code:v.code,mathematicalModel:v.mathematicalModel});for(const[k,x]of Object.entries(v))if(x&&typeof x==='object')walk(x,[...path,k]);};walk(value);return out.sort((a,b)=>JSON.stringify(a.path).localeCompare(JSON.stringify(b.path)));}
function pinned(a){need(typeof a?.path==='string'&&/^[a-f0-9]{64}$/.test(a.sha256??''),'Missing pinned native-layout artifact');const bytes=readPinnedEvidenceBytes(a);need(sha(bytes)===a.sha256,'Native-layout artifact changed');return JSON.parse(bytes);}
const sameRating=(a,b)=>['reasoningScore','difficulty','difficultyReason'].every(k=>a?.[k]===b?.[k]);
const withoutRating=b=>{const x=structuredClone(b);if(x.classification)for(const k of ['reasoningScore','difficulty','difficultyReason','assessment'])delete x.classification[k];return x;};
function dependencies(b){const out=[];const visit=(n,p=[])=>{if(!n||typeof n!=='object')return;for(const k of ['dependsOn','continuationOf','pairedBlockId'])if(n[k]!==undefined)out.push({path:[...p,k],value:n[k]});for(const k of ['dependsOn','continuationOf','keepWithNext'])if(n.flow?.[k]!==undefined)out.push({path:[...p,'flow',k],value:n.flow[k]});for(const [i,c]of (n.children??[]).entries())visit(c,[...p,'children',i]);};visit(b);visit(b.content,['content']);return out;}

export function nativeLayoutSchemaEvidence(source,target,{transform,changes}={}){
 need(Array.isArray(changes)&&changes.length===2&&changes.every(c=>safe(c.path)),'Exactly two bounded native-layout changes required');
 const a=canonical(source),b=canonical(target),inverse=structuredClone(b),paths=changes.map(c=>c.path.join('/'));
 need(new Set(paths).size===2,'Duplicate native-layout path');
 for(const c of changes){need(at(a,c.path)===c.before&&at(b,c.path)===c.after,'Changed native-layout path/value');at(inverse,c.path.slice(0,-1))[c.path.at(-1)]=c.before;}
 need(same(inverse,a),'Non-layout canonical task, blank, answer or scaffold changed');
 need(same(dependencies(source),dependencies(target)),'Raw task dependency changed');
 need(same(blanks(source),blanks(target)),'Native response blank changed');
 const rawInverse=structuredClone(target.content);
 if(transform===PHANTOM_EQUALS_KIND)for(const c of changes){need(at(source.content,c.path)===c.before&&at(rawInverse,c.path)===c.after,'Raw relation maths differs');at(rawInverse,c.path.slice(0,-1))[c.path.at(-1)]=c.before;}
 need(same(nativeMath(source.content),nativeMath(rawInverse)),'Raw native mathematics or diagram changed');
 if(transform===PHANTOM_EQUALS_KIND){
  const matches=paths.map(p=>p.match(/^children\/(\d+)\/prompt\/blocks\/(\d+)\/inlines\/0\/latex$/));need(matches.every(Boolean),'Gutter must be the first maths inline of a native part paragraph');
  need(matches[0][1]===matches[1][1],'Gutters must share one part');const indices=matches.map(m=>Number(m[2])).sort((x,y)=>x-y);need(indices[0]>0&&indices[1]===indices[0]+1,'Consecutive relation paragraphs required');
  const part=a.children[Number(matches[0][1])],current=b.children[Number(matches[0][1])];need(part?.type==='part'&&part.prompt?.format==='maths-editor-document-v1'&&current?.prompt?.format==='maths-editor-document-v1','Native part prompt required');
  const previous=part.prompt.blocks[indices[0]-1];need(previous?.type==='paragraph'&&previous.inlines?.length===1&&previous.inlines[0].type==='math'&&/^m=.+/.test(previous.inlines[0].latex),'Existing explicit m= method line required');
  for(const c of changes){need(c.before==='='&&c.after==='\\phantom{m}=','Only exact invisible m equals gutter supported');const paragraph=at(a,c.path.slice(0,-3));need(paragraph?.type==='paragraph'&&paragraph.inlines?.length===2&&paragraph.inlines[0].type==='math'&&paragraph.inlines[1].type==='cloze','Existing one-blank relation scaffold required');}
 }else if(transform===CELL_ALIGNMENT_KIND){
  const matches=paths.map(p=>p.match(/^children\/(\d+)\/prompt\/blocks\/(\d+)\/rows\/0\/([01])\/verticalAlign$/));need(matches.every(Boolean)&&matches[0][1]===matches[1][1]&&matches[0][2]===matches[1][2]&&new Set(matches.map(m=>m[3])).size===2,'Exactly both cells of one response row required');
  const tablePath=['children',Number(matches[0][1]),'prompt','blocks',Number(matches[0][2])],table=at(a,tablePath),next=at(b,tablePath),rawSource=at(source,['content',...tablePath]),rawTarget=at(target,['content',...tablePath]);
  need(table?.type==='table'&&next?.type==='table'&&table.border===false&&table.rows?.length===1&&table.rows[0].length===2,'Borderless two-cell response table required');
  need(Array.isArray(rawSource.rowHeights)&&rawSource.rowHeights.length===1&&rawSource.rowHeights[0]>0&&same(rawSource.rowHeights,rawTarget.rowHeights),'Response row height changed');
  const ratios=v=>{const w=v.widths??[1,1];need(w.length===2&&w.every(n=>Number.isFinite(n)&&n>0),'Invalid response columns');return w.map(n=>n/(w[0]+w[1]));};need(same(ratios(rawSource),ratios(rawTarget)),'Response column proportions changed');
  for(const c of changes){need(c.before==='middle'&&c.after==='top','Only exact middle-to-top alignment supported');const cell=at(a,c.path.slice(0,-1));need(cell?.type==='cell'&&cell.colspan===1&&cell.rowspan===1&&cell.blocks?.length===1&&cell.blocks[0].type==='paragraph'&&cell.blocks[0].inlines?.length===1&&cell.blocks[0].inlines[0].type==='math'&&/^m_\{[A-Z]{2}\}=$/.test(cell.blocks[0].inlines[0].latex),'Existing single gradient-label response cell required');}
 }else throw Error('Unsupported native-layout transformation');
 return {transform,changes:structuredClone(changes),canonicalWholeInverseExact:true,sourceCanonicalSha256:sha(JSON.stringify(a)),targetCanonicalSha256:sha(JSON.stringify(b)),rawDependenciesExact:true};
}

export function checkedNativeLayoutPresentationProof(target,artifact,hooks){
 const proof=pinned(artifact);need(proof.kind===NATIVE_LAYOUT_PRESENTATION_KIND&&typeof proof.projectId==='string'&&proof.projectId&&typeof proof.blockId==='string'&&proof.blockId&&safe(proof.sourceArtifact?.blockPath)&&safe(proof.targetArtifact?.blockPath),'Invalid native-layout proof identity');
 const source=at(pinned(proof.sourceArtifact),proof.sourceArtifact.blockPath),project=pinned(proof.targetArtifact),originalTarget=at(project,proof.targetArtifact.blockPath);
 need(source?.id===proof.blockId&&originalTarget?.id===proof.blockId&&target.id===proof.blockId&&project.id===proof.projectId&&project.revision===proof.targetRevision,'Foreign native-layout project or owner');
 need(hooks.verifiedRating(source)&&hooks.reasoningTaskHash(source)===proof.sourceTaskHash&&hooks.reasoningTaskHash(originalTarget)===proof.targetTaskHash&&hooks.reasoningTaskHash(target)===proof.targetTaskHash&&proof.sourceTaskHash!==proof.targetTaskHash,'Unverified original or changed native-layout task');
 need(sameRating(source.classification,originalTarget.classification)&&same(source.classification.assessment,originalTarget.classification.assessment),'Original stored rating changed');
 need(!Object.keys(source.classification.assessment).some(k=>k.endsWith('Reuse')||k.endsWith('Adaptations')),'Native-layout source must be an unadapted retained assessment');
 need(same(withoutRating(target),withoutRating(originalTarget)),'Current native-layout block changed outside rating metadata');
 const rated=pinned(proof.ratedSource?.artifact),reply=pinned(proof.ratingReply?.artifact);need(safe(proof.ratedSource?.recordPath)&&safe(proof.ratingReply?.recordPath),'Invalid actual rated-task/reply path');
 const input=at(rated,proof.ratedSource.recordPath),verdict=at(reply,proof.ratingReply.recordPath);
 if(proof.ratedSource.kind==='rating-input-task-v1'){
  need(input?.id===source.id&&input.taskHash===proof.sourceTaskHash&&same(input.task,canonical(source)),'Snapshot differs from actual original rated input');
  need(verdict?.id===source.id&&verdict.taskHash===proof.sourceTaskHash&&verdict.reasoningScore===source.classification.reasoningScore&&verdict.difficultyReason===source.classification.difficultyReason&&(verdict.difficulty===undefined||verdict.difficulty===source.classification.difficulty),'Original actual rating reply differs');
 }else if(proof.ratedSource.kind==='author-generated-task-v1'){
  need(input?.id===source.id&&same(canonical(input),canonical(source))&&sameRating(input.classification,source.classification),'Snapshot differs from original author task/rating');
  need(proof.ratedSource.artifact.path===proof.ratingReply.artifact.path&&proof.ratedSource.artifact.sha256===proof.ratingReply.artifact.sha256&&same(proof.ratedSource.recordPath,proof.ratingReply.recordPath)&&same(verdict,input),'Author task and rating must be the same actual retained output');
 }else throw Error('Unsupported retained rating source');
 need(proof.ratingReply.artifact.path===source.classification.assessment.evidence,'Original assessment reply evidence differs');
 const schema=nativeLayoutSchemaEvidence(source,originalTarget,proof);need(same(schema,proof.schemaEvidence),'Stale native-layout schema evidence');
 const review=pinned(proof.independentReview),rows=review.rows?.filter(r=>r.id===proof.blockId)??[];need(rows.length===1,'Independent applicability owner is missing or ambiguous');const row=rows[0];
 need(review.projectId===proof.projectId&&review.revision===proof.targetRevision&&review.sourceSha256===proof.targetArtifact.sha256&&row?.oldTaskHash===proof.sourceTaskHash&&row.currentTaskHash===proof.targetTaskHash&&row.score===source.classification.reasoningScore&&row.canonicalInverseExact===true&&same(row.changes,proof.changes)&&row.transform===proof.transform&&row.mathematicsEquivalent===true&&row.blanksAndAnswersEquivalent===true&&row.rationaleApplicable===true&&row.newDemand===false&&row.newRatingPerformed===false&&typeof row.rationale==='string'&&row.rationale.trim().length>0,'Independent native-schema applicability binding differs');
 return {proof,source,originalTarget,schema,review,row};
}

// A bank-owned display-cache refresh is metadata, but it must be bound to the
// exact archived bank-after record, never accepted from an arbitrary hash.
export function checkedNativeLayoutBankCacheRefresh(target,rating,hooks){
 const row=rating.assessment.nativeLayoutPresentationReuse,refresh=row?.bankCacheRefresh;
 need(refresh?.kind==='verified-owner-bank-cache-refresh-v1'&&refresh.ownerId===target.id&&refresh.bankId===target.bankRef?.id&&typeof refresh.projectId==='string','Foreign native-layout cache refresh');
 const bank=pinned(refresh.bankAfterArtifact),revision=sha(JSON.stringify(bank));
 need(bank.id===refresh.bankId&&revision===refresh.bankRevision&&hooks.reasoningTaskHash(bank)===hooks.reasoningTaskHash(target)&&hooks.verifiedRating(bank),'Unverified archived bank-after record');
 const outer=bank.classification.assessment.bankProjectionReuse;need(outer&&outer.sourceId===target.id&&outer.bankId===bank.id,'Bank cache has no same-owner outer projection');
 const ownerProject=pinned(outer.sourceArtifact),owner=at(ownerProject,outer.sourceArtifact.blockPath);need(ownerProject.id===refresh.projectId&&owner?.id===target.id&&owner.bankRef?.id===bank.id,'Foreign cache source project/owner');
 const restoredRating=structuredClone(rating);delete restoredRating.assessment.nativeLayoutPresentationReuse.bankCacheRefresh;
 const inherited=structuredClone(bank.classification.assessment);delete inherited.bankProjectionReuse;
 need(same(inherited,restoredRating.assessment)&&sameRating(bank.classification,rating),'Bank cache inherited assessment differs');
 const expected={reasoningScore:bank.classification.reasoningScore,difficulty:bank.classification.difficulty,difficultyReason:bank.classification.difficultyReason,assessment:structuredClone(bank.classification.assessment),revision};
 need(same(target.flow?.bankDifficulty,expected),'Bank display cache differs from exact archived grade/revision');
 const restored=structuredClone(target);restored.classification={...restored.classification,...restoredRating};
 if(refresh.previousBankDifficulty===undefined)delete restored.flow.bankDifficulty;else restored.flow.bankDifficulty=structuredClone(refresh.previousBankDifficulty);
 return {restored,restoredRating,projectId:refresh.projectId};
}
