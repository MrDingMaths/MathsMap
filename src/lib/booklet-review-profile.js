// New imports opt in explicitly. Existing projects and run manifests stay legacy.
export const LEAN_REVIEW_PROFILE='textbook-three-pass-v1';
export const isLeanReview=value=>[value?.reviewProfile,value?.source?.reviewProfile,value?.source?.inventory?.reviewProfile,value?.source?.workflow?.reviewProfile,value?.source?.inventory?.workflow?.reviewProfile].includes(LEAN_REVIEW_PROFILE);

const metadata=new Set(['classification','verification','sourceReview','sourceLayoutEvidence','provenance','visualAudit','reviewStatus','reviewNotes','reviewFlags','audit','auditTrail','sourceRefs','studio','bankRef','canonicalId','snapshotKind']);
const presentation=new Set(['presentation','flow','answerSpaceMm','workingSpaceEstimate','workingEstimate','responseSpace','layout','columns','diagramPlacement','widthMm','heightMm','fontSize','align','verticalAlign','colour','color','background','border','padding','marginBefore','marginAfter','spaceBefore','spaceAfter']);
function projectValue(value,omit){
 if(Array.isArray(value))return value.map(v=>projectValue(v,omit));
 if(!value||typeof value!=='object')return value;
 if(omit===metadata&&value.sourceReview?.responses){const copy={...value};delete copy.sourceReview;return {...projectValue(copy,omit),sourceReview:{responses:projectValue(value.sourceReview.responses,omit)}};}
 return Object.fromEntries(Object.entries(value).filter(([key])=>!omit.has(key)).map(([key,child])=>[key,projectValue(child,omit)]));
}
export function printableProject(project,edition){
 const result=projectValue(project,metadata);
 for(const key of ['revision','updatedAt','createdAt','history','comments','feedback','library','bankSync'])delete result[key];
 // Source identity remains available to resolve source-relative image URLs.
 if(result.source)result.source={runId:result.source.runId};
 if(result.settings){delete result.settings.flowEdition;delete result.settings.reviewProfile;}
 // Teaching responses remain visible. Practice answer fields belong only to
 // their selected edition; changing a worked solution cannot reprint student.
 const mode=edition==='with-short'?'short':edition==='with-worked'?'worked':edition;
 function answers(value){if(!value||typeof value!=='object')return;if(value.answer&&['student','short','worked'].includes(mode)){if(mode==='student')delete value.answer;else delete value.answer[mode==='short'?'worked':'short'];}for(const child of Object.values(value))if(child&&typeof child==='object')answers(child);}
 if(edition)for(const section of result.sections??[])if(section.phase==='practice')for(const block of section.blocks??[])if(block.type==='question')answers(block.content);
 return result;
}
export function questionReviewContent(question){
 return projectValue(question,new Set([...metadata,...presentation]));
}
export const LEAN_EDITORIAL_PROMPT=`Use the textbook three-pass policy. Fix clear errors and likely student misunderstandings; use ordinary high-school conventions without exhaustive qualifications. Add missing rounding instructions using source/answer/teaching precision, otherwise 2 decimal places when rounding is needed; preserve exact-answer tasks. Choose the closest existing skill using source context and the most advanced directly assessed skill. Imperfect taxonomy fit is not a blocker. Return straightforward exact-field corrections with the content review, not a request for another approval. Only escalate missing essential evidence or competing interpretations that materially change the answer or assessed task. Explain that student-facing consequence. Optional polish never blocks delivery. Preserve original source evidence and briefly record intentional departures. Do not redo a successful review without a relevant content/source change.`;
