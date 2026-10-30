// Pure source-backed candidate transformation; never saves projects.
import{createHash}from'node:crypto';
import fs from'node:fs';
import{reasoningTaskHash,verifiedRating}from'../scripts/booklet/reasoning-ratings.mjs';
import{mathsBaseSource}from'../src/lib/question-source.js';
const sha=value=>createHash('sha256').update(value).digest('hex');
const resolvedEvidence=new WeakSet();
// Opt-in whole-question allocation; existing [1] and two-part defaults stay unchanged.
function plcApprovedAllocations(descriptor,{row,mapping,questionHash,cacheArtifact}){
 if(descriptor?.kind!=='coordinator-verified-HSC.PLC-single-mark-allocation-v1')return plcTwoPartAllocations(descriptor,{row,mapping,questionHash});
 if(typeof descriptor.path!=='string'||!/^[a-f0-9]{64}$/.test(descriptor.sha256??'')||!Array.isArray(descriptor.recordPath)||!descriptor.recordPath.length)return false;
 const bytes=fs.readFileSync(descriptor.path);if(sha(bytes)!==descriptor.sha256)return false;
 const r=at(JSON.parse(bytes),descriptor.recordPath);
 if(r?.kind!==descriptor.kind||r.externalId!==row.id||r.sourceCode!==row.source||r.questionSha256!==questionHash||!Number.isInteger(row.marks)||row.marks<1||row.marks>30||r.marksColumn!==row.marks||!same(r.approvedMapping,mapping)||!same(r.cacheArtifact,cacheArtifact))return false;
 if(/\\textbf\{\([a-z]\)\}|(?:^|\n)\s*(?:\([a-z]\)|[a-z][.)])\s/i.test(row.text))return false;
 const tokens=markTokens(row.text).filter(t=>t.standalone&&!t.inMath&&!t.referenceContext&&!t.escaped),a=r.allocations?.[0],t=tokens[0];
 if(!Array.isArray(r.allocations)||r.allocations.length!==1||tokens.length!==1||!a||!t||!plausibleAllocation(t)||a.role!=='exam-mark-allocation'||a.partLabel!=null||a.start!==t.start||a.end!==t.end||a.token!==t.token||a.marks!==t.marks||t.marks!==row.marks||t.end!==row.text.trimEnd().length)return false;
 const codeRanges=[...row.text.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]|\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g)].map(m=>[m.index,m.index+m[0].length]);
 const outsideCode=codeRanges.toReversed().reduce((text,[l,r])=>text.slice(0,l)+text.slice(r),row.text);
 return !/\[tikz\]|\\begin\{tikzpicture\}/.test(outsideCode)&&!codeRanges.some(([l,r])=>t.start>=l&&t.start<r);
}
// Opt-in only: an exact coordinator-vetted two-part PLC allocation record.
// Existing single-terminal-[1] resolution is unchanged when this is absent.
function plcTwoPartAllocations(descriptor,{row,mapping,questionHash}){
 if(descriptor?.kind!=='coordinator-verified-HSC.PLC-two-part-mark-allocations-v1'||typeof descriptor.path!=='string'||!/^[a-f0-9]{64}$/.test(descriptor.sha256??'')||!Array.isArray(descriptor.recordPath)||!descriptor.recordPath.length)return false;
 const bytes=fs.readFileSync(descriptor.path);if(sha(bytes)!==descriptor.sha256)return false;
 const r=at(JSON.parse(bytes),descriptor.recordPath),m=r?.approvedMapping;
 if(r?.kind!==descriptor.kind||r.externalId!==row.id||r.sourceCode!==row.source||r.questionSha256!==questionHash||r.marksColumn!==row.marks||!Number.isInteger(row.marks)||![2,3].includes(row.marks)||!m||m.kind!==mapping.kind||m.path!==mapping.path||m.sha256!==mapping.sha256||!same(m.recordPath,mapping.recordPath))return false;
 const tokens=markTokens(row.text).filter(t=>t.standalone&&!t.inMath&&!t.referenceContext&&!t.escaped&&plausibleAllocation(t)),allocations=r.allocations;
 if(!Array.isArray(allocations)||allocations.length!==2||tokens.length!==2||allocations.some(a=>!a||typeof a!=='object'||Array.isArray(a)||!Number.isInteger(a.marks))||allocations.reduce((n,a)=>n+a.marks,0)!==row.marks)return false;
 const codeRanges=[...row.text.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]|\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g)].map(m=>[m.index,m.index+m[0].length]);
 for(let i=0;i<2;i++){const a=allocations[i],t=tokens[i],headers=[...row.text.slice(0,t.start).matchAll(/\$\\textbf\{\(([a-z])\)\}\$/g)],part=headers.at(-1)?.[1];
  if(a.role!=='exam-mark-allocation'||a.partLabel!==['a','b'][i]||part!==a.partLabel||a.start!==t.start||a.end!==t.end||a.token!==t.token||a.marks!==t.marks||!Number.isSafeInteger(a.start)||!Number.isSafeInteger(a.end)||codeRanges.some(([l,r])=>t.start>=l&&t.start<r))return false;
 }
 if(![1,2].includes(allocations[0].marks)||allocations[1].marks!==1||tokens[1].end!==row.text.trimEnd().length)return false;
 const between=row.text.slice(tokens[0].end,tokens[1].start);if(!/^\s*\$\\textbf\{\(b\)\}\$/.test(between))return false;
 return true;
}

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const at=(value,parts)=>parts.reduce((v,k)=>v?.[k],value);
// A legacy origin may point at a metadata-only screen. Resolve only an actual
// retained raw question with exact ID/code/independently pinned question hash.
// Whole-cache hashes recorded here are current read hashes, never backdated.
export function resolveExamMarkSourceEvidence(block,{cacheArtifacts=[],trialApproval,approvedMapping,approvedAllocations}={}){
 const origin=block.sourceReview?.origin,reviewHash=block.sourceReview?.independentReview?.sourceQuestionSha256,originalHash=origin?.sourceQuestionSha256??reviewHash;
 if(!origin?.externalId||!origin.sourceCode||!/^[a-f0-9]{64}$/.test(originalHash??'')||origin.sourceQuestionSha256&&reviewHash&&origin.sourceQuestionSha256!==reviewHash)return null;
 let approvedTrialSource=false,approvedPLCInternalMapping;
 const parsed=mathsBaseSource(origin.sourceCode);
 // A literal HSC.PLC code can be an already approved PLC internal paper. This
 // bounded disposition does not rewrite its code/provider or admit other schools.
 if(block.source?.provider==='PLC'&&parsed?.provider==='HSC-trial'){
  if(parsed.schoolCode!=='PLC'||approvedMapping?.kind!=='existing-approved-HSC.PLC-internal-mapping-v1'||typeof approvedMapping.path!=='string'||!/^[a-f0-9]{64}$/.test(approvedMapping.sha256??'')||!Array.isArray(approvedMapping.recordPath)||!approvedMapping.recordPath.length)return null;
  const bytes=fs.readFileSync(approvedMapping.path);if(sha(bytes)!==approvedMapping.sha256)return null;
  const record=at(JSON.parse(bytes),approvedMapping.recordPath),source=block.source;
  if(record?.id!==origin.externalId||record.sourceCode!==origin.sourceCode||record.questionSha256!==originalHash||!/^Approved\b/.test(record.sourceLabelStatus??'')||!same(record.approvedSource,source))return null;
  if(source.origin!=='MathsBase'||source.paper!=='PLC '+parsed.paper||source.label!==source.paper+' '+parsed.year||String(source.year)!==String(parsed.year)||!/^\d{4}$/.test(String(parsed.year)))return null;
  approvedPLCInternalMapping=Object.freeze({...structuredClone(approvedMapping),recordPath:Object.freeze([...approvedMapping.recordPath])});
 }
 if(block.source?.provider==='HSC-trial'){
  if(!trialApproval||!/^[a-f0-9]{64}$/.test(trialApproval.sha256??''))return null;
  const bytes=fs.readFileSync(trialApproval.path);if(sha(bytes)!==trialApproval.sha256)return null;
  const record=at(JSON.parse(bytes),trialApproval.recordPath??[]);
  if(record?.id!==origin.externalId||record.sourceCode!==origin.sourceCode||!/^Approved\b/.test(record.sourceLabelStatus??'')||!same(record.approvedSource,block.source))return null;
  approvedTrialSource=true;
 }
 const find=value=>{if(!value||typeof value!=='object')return null;const id=value.id??value.externalId,code=value.source??value.sourceCode,text=value.question_text??value.sourceQuestion;if(id===origin.externalId&&code===origin.sourceCode&&typeof text==='string'&&sha(text)===originalHash)return{text,marks:value.marks,id,source:code};for(const child of Object.values(value)){const row=child&&typeof child==='object'&&find(child);if(row)return row;}return null;};
 for(const artifact of cacheArtifacts){if(!artifact?.path||!/^[a-f0-9]{64}$/.test(artifact.sha256??''))continue;const bytes=fs.readFileSync(artifact.path);if(sha(bytes)!==artifact.sha256)continue;const row=find(JSON.parse(bytes));if(!row)continue;
  if(approvedPLCInternalMapping){const tokens=markTokens(row.text).filter(t=>t.standalone&&!t.inMath&&!t.referenceContext&&!t.escaped);const single=row.marks===1&&tokens.length===1&&tokens[0].token==='[1]'&&tokens[0].end===row.text.trimEnd().length;const multipart=approvedAllocations&&plcApprovedAllocations(approvedAllocations,{row,mapping:approvedPLCInternalMapping,questionHash:originalHash,cacheArtifact:{path:artifact.path,sha256:artifact.sha256}});if((approvedAllocations?!multipart:!single)||typeof block.content?.prompt!=='string'||block.content.prompt!==row.text)continue;}
  const evidence=Object.freeze({externalId:origin.externalId,sourceCode:origin.sourceCode,questionText:row.text,questionSha256:originalHash,snapshotFile:artifact.path,snapshotSha256:artifact.sha256,questionHashBinding:origin.sourceQuestionSha256?'sourceReview.origin.sourceQuestionSha256':'sourceReview.independentReview.sourceQuestionSha256',cacheHashBinding:'new-current-read-hash-of-retained-raw-cache',approvedTrialSource,...(trialApproval?{trialApproval:structuredClone(trialApproval)}:{}),...(approvedPLCInternalMapping?{approvedPLCInternalMapping,sourceAllocationMarks:row.marks,...(approvedAllocations?{approvedAllocations:Object.freeze({...structuredClone(approvedAllocations),recordPath:Object.freeze([...approvedAllocations.recordPath])})}:{})}:{})});resolvedEvidence.add(evidence);return evidence;}
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
 if(resolved&&sourceEvidence.approvedPLCInternalMapping&&sha(fs.readFileSync(sourceEvidence.approvedPLCInternalMapping.path))!==sourceEvidence.approvedPLCInternalMapping.sha256)throw Error('Resolved exam-mark approved mapping artifact changed');
 if(resolved&&sourceEvidence.approvedAllocations&&sha(fs.readFileSync(sourceEvidence.approvedAllocations.path))!==sourceEvidence.approvedAllocations.sha256)throw Error('Resolved exam-mark allocation review artifact changed');
 let currentPLCMappingMatches=false;
 if(resolved&&sourceEvidence.approvedPLCInternalMapping){const mapping=sourceEvidence.approvedPLCInternalMapping,record=at(JSON.parse(fs.readFileSync(mapping.path)),mapping.recordPath);currentPLCMappingMatches=same(record?.approvedSource,block.source)&&typeof block.content?.prompt==='string'&&block.content.prompt===sourceEvidence.questionText;if(currentPLCMappingMatches&&sourceEvidence.approvedAllocations)currentPLCMappingMatches=plcApprovedAllocations(sourceEvidence.approvedAllocations,{row:{id:sourceEvidence.externalId,source:sourceEvidence.sourceCode,text:sourceEvidence.questionText,marks:sourceEvidence.sourceAllocationMarks},mapping,questionHash:sourceEvidence.questionSha256,cacheArtifact:{path:sourceEvidence.snapshotFile,sha256:sourceEvidence.snapshotSha256}});}
 const eligible=parsed&&(['HSC','PLC'].includes(provider)&&parsed.provider===provider||provider==='HSC-trial'&&parsed.provider==='HSC-trial'&&resolved&&sourceEvidence.approvedTrialSource===true||provider==='PLC'&&parsed.provider==='HSC-trial'&&parsed.schoolCode==='PLC'&&resolved&&currentPLCMappingMatches&&sourceEvidence.approvedPLCInternalMapping?.kind==='existing-approved-HSC.PLC-internal-mapping-v1');
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
 const proof={kind:'exam-mark-allocation-only-v1',blockId:block.id,originalBlockSha256:sha(JSON.stringify(block)),adaptedBlockSha256:sha(JSON.stringify(candidate)),sourceEvidence:evidenceValid?{externalId:sourceEvidence.externalId,sourceCode:sourceEvidence.sourceCode,questionSha256:sourceEvidence.questionSha256,snapshotSha256:sourceEvidence.snapshotSha256,snapshotFile:sourceEvidence.snapshotFile??null,snapshotBinding:resolved?sourceEvidence.cacheHashBinding:origin.sourceSnapshotSha256?'original-pinned-cache-hash':'current-read-hash-of-original-cache-path-with-original-question-hash',...(resolved?{questionHashBinding:sourceEvidence.questionHashBinding,...(sourceEvidence.trialApproval?{trialApproval:sourceEvidence.trialApproval}:{}),...(sourceEvidence.approvedPLCInternalMapping?{approvedPLCInternalMapping:structuredClone(sourceEvidence.approvedPLCInternalMapping),sourceAllocationMarks:sourceEvidence.sourceAllocationMarks,...(sourceEvidence.approvedAllocations?{approvedAllocations:structuredClone(sourceEvidence.approvedAllocations)}:{})}:{})}:{})}:null,edits,removedAllocations:edits.reduce((n,e)=>n+e.removed.length,0),ambiguous,preserved,mathematicalDemandChanged:false,assessmentReused:false};
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
