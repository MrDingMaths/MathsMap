// Pure source-backed candidate transformation; never saves projects.
import{createHash}from'node:crypto';
import fs from'node:fs';
import{reasoningTaskHash,verifiedRating}from'../scripts/booklet/reasoning-ratings.mjs';
import{mathsBaseSource}from'../src/lib/question-source.js';
const sha=value=>createHash('sha256').update(value).digest('hex');
const resolvedEvidence=new WeakSet();
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const at=(value,parts)=>parts.reduce((v,k)=>v?.[k],value);
// A legacy origin may point at a metadata-only screen. Resolve only an actual
// retained raw question with exact ID/code/independently pinned question hash.
// Whole-cache hashes recorded here are current read hashes, never backdated.
export function resolveExamMarkSourceEvidence(block,{cacheArtifacts=[],trialApproval}={}){
 const origin=block.sourceReview?.origin,reviewHash=block.sourceReview?.independentReview?.sourceQuestionSha256,originalHash=origin?.sourceQuestionSha256??reviewHash;
 if(!origin?.externalId||!origin.sourceCode||!/^[a-f0-9]{64}$/.test(originalHash??'')||origin.sourceQuestionSha256&&reviewHash&&origin.sourceQuestionSha256!==reviewHash)return null;
 let approvedTrialSource=false;
 if(block.source?.provider==='HSC-trial'){
  if(!trialApproval||!/^[a-f0-9]{64}$/.test(trialApproval.sha256??''))return null;
  const bytes=fs.readFileSync(trialApproval.path);if(sha(bytes)!==trialApproval.sha256)return null;
  const record=at(JSON.parse(bytes),trialApproval.recordPath??[]);
  if(record?.id!==origin.externalId||record.sourceCode!==origin.sourceCode||!/^Approved\b/.test(record.sourceLabelStatus??'')||!same(record.approvedSource,block.source))return null;
  approvedTrialSource=true;
 }
 const find=value=>{if(!value||typeof value!=='object')return null;const id=value.id??value.externalId,code=value.source??value.sourceCode,text=value.question_text??value.sourceQuestion;if(id===origin.externalId&&code===origin.sourceCode&&typeof text==='string'&&sha(text)===originalHash)return{text};for(const child of Object.values(value)){const row=child&&typeof child==='object'&&find(child);if(row)return row;}return null;};
 for(const artifact of cacheArtifacts){if(!artifact?.path||!/^[a-f0-9]{64}$/.test(artifact.sha256??''))continue;const bytes=fs.readFileSync(artifact.path);if(sha(bytes)!==artifact.sha256)continue;const row=find(JSON.parse(bytes));if(!row)continue;const evidence=Object.freeze({externalId:origin.externalId,sourceCode:origin.sourceCode,questionText:row.text,questionSha256:originalHash,snapshotFile:artifact.path,snapshotSha256:artifact.sha256,questionHashBinding:origin.sourceQuestionSha256?'sourceReview.origin.sourceQuestionSha256':'sourceReview.independentReview.sourceQuestionSha256',cacheHashBinding:'new-current-read-hash-of-retained-raw-cache',approvedTrialSource,...(trialApproval?{trialApproval:structuredClone(trialApproval)}:{})});resolvedEvidence.add(evidence);return evidence;}
 return null;
}
const escaped=(s,at)=>{let n=0;while(at>0&&s[--at]==='\\')n++;return n%2===1;};
function mathRanges(text){const ranges=[];for(let i=0;i<text.length;i++){if(text[i]!=='$'||escaped(text,i))continue;const delimiter=text.startsWith('$$',i)?'$$':'$';for(let j=i+delimiter.length;j<text.length;j++){if(delimiter==='$'&&text[j]==='\n')break;if(text.startsWith(delimiter,j)&&!escaped(text,j)){ranges.push([i,j+delimiter.length]);i=j+delimiter.length-1;break;}}}return ranges;}
const numericMark=/\[(\d{1,3})\]/g;
const plausibleAllocation=token=>/^\[[1-9]\d?\]$/.test(token.token)&&token.marks<=30;
export function markTokens(text,{nativeMath=false}={}){
 const maths=nativeMath?[[0,text.length]]:mathRanges(text);
 return[...text.matchAll(numericMark)].map(match=>{const start=match.index,end=start+match[0].length,lineStart=text.lastIndexOf('\n',start-1)+1,next=text.indexOf('\n',end),lineEnd=next<0?text.length:next,line=text.slice(lineStart,lineEnd),before=text.slice(lineStart,start),after=text.slice(end,lineEnd),inMath=maths.some(([a,b])=>start>=a&&end<=b);return{token:match[0],marks:Number(match[1]),start,end,line,lineStart,lineEnd,inMath,standalone:!before.trim()&&!after.trim(),terminal:!after.trim(),referenceContext:/\b(?:equation|formula|result|reference|see|using|from|matrix|interval|index|list|element|term)\s*$/i.test(before),escaped:escaped(text,start)};});
}
const skip=new Set(['answer','questionDiagrams','diagrams','diagram','workedDiagrams','shortDiagrams','code','spec','src','asset','image','images','source','sourceReview','sourceRefs','classification','provenance','flow','layout','presentation','id','type','format']);
const printable=new Set(['prompt','text','latex','label','caption','title','heading']);
export function questionTextFields(block){const fields=[];const visit=(value,path,key)=>{if(typeof value==='string'){if(printable.has(key))fields.push({path,value,nativeMath:key==='latex'});return;}if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach((v,i)=>visit(v,[...path,i],key));return;}for(const[k,v]of Object.entries(value))if(!skip.has(k))visit(v,[...path,k],k);};visit(block.content,['content'],'content');return fields;}
const pathKey=path=>path.map(k=>typeof k==='number'?'['+k+']':'.'+k).join('').slice(1);
// Evidence is exact source cache data loaded/pinned by the coordinator, not a
// model's assertion that arbitrary brackets are marks. Only the narrow source
// convention of standalone [n] mark lines is presently auto-adaptable.
export function stripExamMarksCandidate(block,{sourceEvidence}={}){
 const provider=block.source?.provider,origin=block.sourceReview?.origin;
 const instructional=['example','worked-example','guided-practice','teaching','definition'].includes(block.pedagogyRole);
 const resolved=sourceEvidence&&resolvedEvidence.has(sourceEvidence),originalQuestionHash=origin?.sourceQuestionSha256??(resolved?block.sourceReview?.independentReview?.sourceQuestionSha256:null),parsed=mathsBaseSource(origin?.sourceCode);
 if(resolved&&(sha(fs.readFileSync(sourceEvidence.snapshotFile))!==sourceEvidence.snapshotSha256||sourceEvidence.trialApproval&&sha(fs.readFileSync(sourceEvidence.trialApproval.path))!==sourceEvidence.trialApproval.sha256))throw Error('Resolved exam-mark source artifact changed');
 const eligible=parsed&&(['HSC','PLC'].includes(provider)&&parsed.provider===provider||provider==='HSC-trial'&&parsed.provider==='HSC-trial'&&resolved&&sourceEvidence.approvedTrialSource===true);
 const snapshotBound=resolved|| (origin?.sourceSnapshotSha256?sourceEvidence?.snapshotSha256===origin.sourceSnapshotSha256:typeof origin?.readSnapshot==='string'&&sourceEvidence?.snapshotFile===origin.readSnapshot&&/^[a-f0-9]{64}$/.test(sourceEvidence?.snapshotSha256??''));
 const evidenceValid=!instructional&&sourceEvidence&&eligible&&origin?.provider==='MathsBase'&&sourceEvidence.externalId===origin.externalId&&sourceEvidence.sourceCode===origin.sourceCode&&sha(sourceEvidence.questionText)===originalQuestionHash&&sourceEvidence.questionSha256===originalQuestionHash&&snapshotBound;
 const sourceTokens=evidenceValid?markTokens(sourceEvidence.questionText).filter(t=>t.standalone&&!t.inMath&&!t.referenceContext&&!t.escaped&&plausibleAllocation(t)):[];
 const remaining=new Map();for(const token of sourceTokens)remaining.set(token.token,(remaining.get(token.token)??0)+1);
 const edits=[],ambiguous=[],preserved=[],candidate=structuredClone(block);
 for(const field of questionTextFields(block)){
  const remove=[];for(const token of markTokens(field.value,{nativeMath:field.nativeMath})){
   const row={field:pathKey(field.path),...token};
   if(token.inMath||token.referenceContext||token.escaped){preserved.push({...row,reason:'Mathematical/escaped/reference notation'});continue;}
   const promptField=field.path.at(-1)==='prompt'||field.path.includes('prompt')&&field.path.at(-1)==='text';
   if(evidenceValid&&promptField&&token.standalone&&plausibleAllocation(token)&&(remaining.get(token.token)??0)>0){remove.push(token);remaining.set(token.token,remaining.get(token.token)-1);}
   else ambiguous.push({...row,reason:!evidenceValid?'No exact eligible exam-source cache proof':!token.standalone?'Inline/terminal bracket needs explicit allocation evidence':'No matching standalone source allocation remains'});
  }
  if(remove.length){let value=field.value;for(const token of remove.toReversed())value=value.slice(0,token.start)+value.slice(token.end);let target=candidate;for(const part of field.path.slice(0,-1))target=target[part];target[field.path.at(-1)]=value;edits.push({path:field.path,field:pathKey(field.path),before:field.value,after:value,removed:remove.map(({start,end,token,marks})=>({start,end,token,marks}))});}
 }
 const proof={kind:'exam-mark-allocation-only-v1',blockId:block.id,originalBlockSha256:sha(JSON.stringify(block)),adaptedBlockSha256:sha(JSON.stringify(candidate)),sourceEvidence:evidenceValid?{externalId:sourceEvidence.externalId,sourceCode:sourceEvidence.sourceCode,questionSha256:sourceEvidence.questionSha256,snapshotSha256:sourceEvidence.snapshotSha256,snapshotFile:sourceEvidence.snapshotFile??null,snapshotBinding:resolved?sourceEvidence.cacheHashBinding:origin.sourceSnapshotSha256?'original-pinned-cache-hash':'current-read-hash-of-original-cache-path-with-original-question-hash',...(resolved?{questionHashBinding:sourceEvidence.questionHashBinding,...(sourceEvidence.trialApproval?{trialApproval:sourceEvidence.trialApproval}:{})}:{})}:null,edits,removedAllocations:edits.reduce((n,e)=>n+e.removed.length,0),ambiguous,preserved,mathematicalDemandChanged:false,assessmentReused:false};
 return{candidate,proof};
}
export function verifyMarkOnlyAdaptation(original,candidate,proof,{sourceEvidence}={}){
 if(proof.kind!=='exam-mark-allocation-only-v1'||proof.blockId!==original.id||sha(JSON.stringify(original))!==proof.originalBlockSha256||sha(JSON.stringify(candidate))!==proof.adaptedBlockSha256)throw Error('Mark-only adaptation identity/hash mismatch');
 const inverse=structuredClone(candidate);
 for(const edit of proof.edits){let target=inverse;for(const part of edit.path.slice(0,-1))target=target[part];if(target[edit.path.at(-1)]!==edit.after)throw Error('Adapted field differs');let rebuilt=edit.before;for(const span of edit.removed.toReversed()){if(rebuilt.slice(span.start,span.end)!==span.token||!/^\[\d{1,2}\]$/.test(span.token))throw Error('Not a mark-token deletion');rebuilt=rebuilt.slice(0,span.start)+rebuilt.slice(span.end);}if(rebuilt!==edit.after)throw Error('Non-mark text altered');target[edit.path.at(-1)]=edit.before;}
 if(JSON.stringify(inverse)!==JSON.stringify(original))throw Error('Other content/metadata changed');
 const recomputed=stripExamMarksCandidate(original,{sourceEvidence});if(JSON.stringify(recomputed.candidate)!==JSON.stringify(candidate)||JSON.stringify(recomputed.proof)!==JSON.stringify(proof))throw Error('Adaptation not independently reproduced from exact source evidence');return true;
}
// Follows existing whole-question-renumbering reuse semantics.
// Never creates a score/model/date or accepts an old unverified assessment.
export function reuseMarkOnlyRating(original,candidate,proof,{sourceEvidence,evidenceFile,evidenceSha256}={}){
 verifyMarkOnlyAdaptation(original,candidate,proof,{sourceEvidence});
 if(!proof.removedAllocations||proof.ambiguous.length||!verifiedRating(original)||typeof evidenceFile!=='string'||!evidenceFile.trim()||!/^[a-f0-9]{64}$/.test(evidenceSha256??''))throw Error('Need unambiguous mark-only proof and verified original assessment');
 const result=structuredClone(original.classification),assessment=result.assessment,old=structuredClone(assessment);
 assessment.originalTaskHash??=assessment.taskHash;assessment.taskHash=reasoningTaskHash(candidate);
 assessment.examMarkAdaptations=[...(assessment.examMarkAdaptations??[]),{kind:'exam-mark-allocation-only-v1',previousTaskHash:old.taskHash,currentTaskHash:assessment.taskHash,originalAssessmentSha256:sha(JSON.stringify(old)),proofFile:evidenceFile,proofSha256:evidenceSha256,sourceQuestionSha256:proof.sourceEvidence.questionSha256,sourceSnapshotSha256:proof.sourceEvidence.snapshotSha256,removedAllocations:proof.removedAllocations,assessmentReused:true,newAssessmentPerformed:false}];
 return result;
}
