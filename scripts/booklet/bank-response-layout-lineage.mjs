import {readPinnedEvidenceBytes} from './pinned-evidence-reader.mjs';
// Strict, opt-in zero-diagram bank projection; no hash normalization.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {normaliseQuestion,hasDiagrams} from '../../src/lib/practice-question-model.js';
export const RESPONSE_LAYOUT_BANK_KIND='zero-diagram-response-layout-bank-projection-v1';
const need=(ok,m)=>{if(!ok)throw Error(m);};
const sha=v=>createHash('sha256').update(v).digest('hex');
const at=(v,p)=>p.reduce((x,k)=>x?.[k],v);
const safe=p=>Array.isArray(p)&&p.length&&p.every(k=>(typeof k==='string'||Number.isSafeInteger(k))&&!['__proto__','constructor','prototype'].includes(k));
const pinned=a=>{need(typeof a?.path==='string'&&/^[a-f0-9]{64}$/.test(a.sha256??''),'Missing bank projection pin');const b=readPinnedEvidenceBytes(a);need(sha(b)===a.sha256,'Bank projection artifact changed');return JSON.parse(b);};
const diagrams=v=>{if(!v||typeof v!=='object')return false;if(['tikz','svg'].includes(v.format)||v.type==='diagram'||v.type==='image'||v.type==='graph')return true;if(Object.entries(v).some(([k,x])=>['questionDiagrams','question_diagrams','solutionDiagrams','sharedSolutionDiagrams','diagrams','images','tikz'].includes(k)&&(Array.isArray(x)?x.length>0:!!x)))return true;return Object.values(v).some(diagrams);};
const noRating=b=>{const x=structuredClone(b);delete x.updatedAt;for(const k of ['reasoningScore','difficulty','difficultyReason','assessment'])delete x.classification?.[k];return x;};
const differences=(a,b,p=[],out=[])=>{if(same(a,b))return out;if(!a||!b||typeof a!=='object'||typeof b!=='object'){out.push({path:p,before:a,after:b});return out;}for(const k of new Set([...Object.keys(a),...Object.keys(b)]))differences(a[k],b[k],[...p,Array.isArray(a)?Number(k):k],out);return out;};
const dependencies=v=>{const out=[];const walk=(x,p=[])=>{if(!x||typeof x!=='object')return;for(const[k,y]of Object.entries(x)){if(['dependsOn','continuationOf','pairedBlockId','keepWithNext'].includes(k))out.push({path:[...p,k],value:y});else if(k!=='classification'&&k!=='bankDifficulty')walk(y,[...p,k]);}};walk({dependsOn:v.dependsOn,continuationOf:v.continuationOf,pairedBlockId:v.pairedBlockId,keepWithNext:v.keepWithNext});walk(v.content);walk(v.flow);return out;};
export function responseLayoutBankEvidence(source,target,changes){
 need(!diagrams(source.content)&&!diagrams(target.content)&&!hasDiagrams(normaliseQuestion(source))&&!hasDiagrams(normaliseQuestion(target)),'Zero-diagram projection contains a diagram');
 const a=normaliseQuestion(source).content,b=normaliseQuestion(target).content;
 need(Array.isArray(changes)&&changes.length>0&&same(differences(a,b),changes),'Bank response-layout paths or values changed');
 need(same(dependencies(source),dependencies(target)),'Bank projection dependencies differ');
 for(const c of changes){need(safe(c.path),'Unsafe response-layout path');const key=c.path.join('/');
  if(/^children\/\d+\/answerSpaceMm$/.test(key)){need(Number.isFinite(c.before)&&c.before>0&&Number.isFinite(c.after)&&c.after>0,'Invalid answer-space dimensions');continue;}
  const match=key.match(/^(children\/\d+\/prompt\/blocks\/\d+)\/(widthMm|rowHeights\/0|widths\/[01])$/);need(match,'Non-response bank layout path');
  const table=at(a,c.path.slice(0,5)),next=at(b,c.path.slice(0,5));
  for(const t of [table,next])need(t?.type==='table'&&t.border===false&&t.rows?.length===1&&t.rows[0].length===2&&t.rows[0].every(cell=>cell.type==='cell'&&cell.blocks?.length===1&&cell.blocks[0].type==='paragraph'&&cell.blocks[0].inlines?.length===1&&cell.blocks[0].inlines[0].type==='math'&&/^m_\{[A-Z]{2}\}=$/.test(cell.blocks[0].inlines[0].latex)),'Existing gradient response row required');
  need((match[2]==='widthMm'&&c.before===null||Number.isFinite(c.before)&&c.before>0)&&(match[2]==='widthMm'&&c.after===null||Number.isFinite(c.after)&&c.after>0),'Invalid table dimension');
  need(Array.isArray(table.widths)&&table.widths.length===2&&Array.isArray(next.widths)&&next.widths.length===2&&table.widths.every(n=>Number.isFinite(n)&&n>0)&&next.widths.every(n=>Number.isFinite(n)&&n>0)&&table.widths[0]/table.widths[1]===next.widths[0]/next.widths[1],'Response column proportions changed');
 }
 return {changes:structuredClone(changes),zeroDiagrams:true,completeNormalizedContentInverse:true,dependenciesExact:true};
}
export function checkedResponseLayoutBankProjection(target,record,hooks){
 const proof=pinned(record.responseLayoutProof);need(proof.kind===RESPONSE_LAYOUT_BANK_KIND&&safe(record.sourceArtifact?.blockPath),'Invalid response-layout bank proof');
 const source=at(pinned(record.sourceArtifact),record.sourceArtifact.blockPath),bank=pinned(proof.bankBeforeArtifact);
 need(source?.id===record.sourceId&&source.bankRef?.id===record.bankId&&target.id===record.bankId&&bank.id===record.bankId&&hooks.verifiedRating(source)&&hooks.reasoningTaskHash(source)===record.taskHash&&hooks.reasoningTaskHash(target)===record.taskHash,'Foreign or unverified bank projection owner');
 need(same(proof.sourceArtifact,record.sourceArtifact)&&proof.sourceId===source.id&&proof.bankId===bank.id&&proof.taskHash===record.taskHash&&sha(JSON.stringify(bank))===proof.bankRevision,'Bank projection identity/revision differs');
 need(same(noRating(target),noRating(bank)),'Bank projection target differs from pinned bank');
 const schema=responseLayoutBankEvidence(source,bank,proof.changes);need(same(schema,proof.schemaEvidence),'Stale bank response-layout schema');
 const review=pinned(proof.independentReview),rows=review.rows?.filter(r=>r.sourceId===source.id&&r.bankId===bank.id)??[];need(rows.length===1,'Ambiguous bank applicability');const row=rows[0];
 need(same(row.sourceArtifact,record.sourceArtifact)&&row.bankBeforeSha256===proof.bankBeforeArtifact.sha256&&row.taskHash===record.taskHash&&row.bankRevision===proof.bankRevision&&same(row.changes,proof.changes)&&row.zeroDiagrams===true&&row.mathematicsEquivalent===true&&row.blanksAndAnswersEquivalent===true&&row.dependenciesEquivalent===true&&row.rationaleApplicable===true&&row.newDemand===false&&row.newRatingPerformed===false&&typeof row.rationale==='string'&&row.rationale.trim(),'Bank independent applicability differs');
 return {source,proof,review,row,schema};
}
