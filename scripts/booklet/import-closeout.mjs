// Summarize existing acceptance, never infer visual review from an automated pass.
import path from 'node:path';
import {liveWorkflow,currentStatus,acceptFinalReview,bytesHash} from './workflow-review.mjs';
import {buildRunReceipt,summarizeRunReceipt} from './run-observability.mjs';
import fs from 'node:fs';
import {verificationStatus} from './import-verification.mjs';
export function importCloseout(runDir,pages){
 const state=liveWorkflow(runDir,pages),status=currentStatus(state,pages),issues=[];
 if(!state.finalReview)issues.push('Current final review is missing or stale');
 else try{acceptFinalReview(structuredClone(state),state.finalReview);}catch(error){issues.push(error.message);}
 const project=state.settled?.project?.file&&fs.existsSync(state.settled.project.file)?JSON.parse(fs.readFileSync(state.settled.project.file,'utf8')):null;
 const verification=verificationStatus(state,project,{phase:'complete',validateFinal:()=>acceptFinalReview(structuredClone(state),state.finalReview)});
 issues.push(...verification.issues);
 const register=path.resolve(runDir,'workflow/issues.json');
 return {version:1,generatedAt:new Date().toISOString(),ok:issues.length===0,issues,projectId:state.projectId??null,
  register:{path:register,hash:bytesHash(register)},revision:state.revision,reviewKey:status.reviewKey,
  contentSettled:status.contentSettled,finalAccepted:status.finalAccepted&&issues.length===0,
  inventory:{pages:pages.length,authored:status.pages.filter(p=>p.author).length,pending:status.pages.filter(p=>p.reasons.length).map(p=>({page:p.page,reasons:p.reasons}))},
  corrections:state.corrections.map(c=>({id:c.id,status:c.status,reason:c.reason,sourceRefs:c.sourceRefs})),
  representatives:{approved:Object.keys(state.representatives).length},
  finalReview:state.finalReview?{reviewer:state.finalReview.reviewer,note:state.finalReview.note,editions:Object.fromEntries(Object.entries(state.finalReview.editions).map(([edition,r])=>[edition,{pages:r.pages.length,checked:r.pages.filter(p=>p.checked).length,manifest:r.manifest}]))}:null,
  verification,checklist:verification.checks,metrics:summarizeRunReceipt(buildRunReceipt(runDir)),
  note:'Read-only summary of current source-hashed records. No review or acceptance is created. The full register, final manifests, correction evidence and inspection records remain authoritative.'};
}
