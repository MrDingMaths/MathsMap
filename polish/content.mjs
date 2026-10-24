// Autonomous content repair (polish pipeline queue c, 23 October 2026; docs/booklet-verification-speed.md). The
// full-book review finds content problems it can see beside the source: a block in the wrong role, theory wording
// that departs from the source, a wrong answer or worked solution, a duplicate task, a question that belongs in
// another as its next part. The user decided these are applied without him. A Sol low author turns each batch of
// findings into exact-field patches (the lean-review repair shape), a second Sol low call that did not write them
// derives every changed answer itself and accepts or refuses each correction, and the accepted ones are saved
// through lean-review.mjs applyRepair (revision-checked; nothing is saved if one patch does not match). Extensions
// and opening reviews are not here: they are suggestions for the teacher (polish/pedagogy.mjs, polish/flags.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {questionReviewContent} from '../src/lib/booklet-review-profile.js';
import {changeBlockRole} from '../src/lib/booklet-layout-actions.js';
import {bookletIndex,pool,targetsUnchanged,setState,loadProvenance,saveProvenance,provenanceFile} from '../first-pass/review.mjs';
import {groupFindings,blockPayload} from '../first-pass/apply.mjs';
import {read,write,now} from '../checks/lib/common.mjs';
import {nodesOf,polishSafetyIssues,teacherBlocks} from './guards.mjs';
import {repairRoute,FEEDBACK_CHECKS} from './repair-routing.mjs';

export const CONTENT_AREAS=Object.freeze(['content','duplicate']);
// What the teacher is left to decide: ideas for the booklet, never applied by the pipeline.
export const SUGGESTION_AREAS=Object.freeze(['extension','review']);
export const ROLES=Object.freeze(['theory','definition','example','guided-practice','question','review','investigation','key-ideas']);

// The pending findings this step repairs, not on a block the teacher decided.
export function contentFindings(record,project,protectedIds=new Set()){
 const index=bookletIndex(project);
 return (record.findings??[]).filter(finding=>finding.state==='pending'&&repairRoute(finding)==='content'&&!finding.groupedUnder&&targetsUnchanged(finding,project,index)&&!finding.targets.some(target=>protectedIds.has(target.blockId)));
}

export function authorPrompt({project,index,group,pages}){
 const ids=[...new Set(group.flatMap(finding=>finding.targets.map(target=>target.blockId)))];
 const targetsOf=id=>[...new Set(group.flatMap(finding=>finding.targets.filter(target=>target.blockId===id).map(target=>target.id)))];
 const payload={booklet:project.title,findings:group.map(finding=>({id:finding.id,edition:finding.edition,page:finding.page,area:finding.area,targets:finding.targets.map(target=>target.id),comment:finding.comment,...(finding.proposal?{proposal:finding.proposal}:{})})),
  blocks:ids.map(id=>({...blockPayload(project,index,id,targetsOf(id)),content:questionReviewContent(index.blocks.get(id).block)})),sourcePages:pages.map((page,i)=>({image:i+1,sourcePage:page.page}))};
 return `You correct printed CONTENT in a MathsMap maths booklet. Do not run commands or open files: everything you need is below and in the attached images (the original document's pages, in the order of "sourcePages"). A reviewer looked at the rendered booklet beside the source and wrote the findings. Decide whether each is right; if it is, return the smallest exact-field patches that fix it.

Rules:
- Structural and diagram-code repairs are allowed here, including moving diagrams into table cells and removing redundant scaffolds; retain all givens, response owners, answers and teacher exceptions. ${FEEDBACK_CHECKS}
- A patch is {"targetId": id of the block or of a node inside it, "field": JSON pointer relative to that node, "original": exact current value (null if absent), "corrected": final value}. "original" must match exactly or the patch is rejected. Each block lists its nodes with their id path and pointer.
- Answers: derive every answer you change yourself, from the question as printed and the source page; never copy an answer from a finding. Change answer.short and answer.worked (and any steps) together so they agree, using the method the booklet teaches.
- Theory wording follows the source page. Keep the booklet's structure and house style; change as little as possible.
- To add a part to a question, patch the parent's /children with the full new array: the next label in the sequence, its own unique id, and its answers. To merge a follow-up question into the question before it, do that and name the follow-up block in "remove".
- A block in the wrong role: give "role" (one of ${ROLES.join(', ')}) and "blockId" instead of patches.
- A duplicate task: change the later copy into a task with the same structure and different numbers, with its answers (patches). Only when no sensible change exists, or after a merge, "remove" names the block to take out.
- A finding that is wrong, or that you cannot fix from the evidence, goes in "comments" with a reason. Never guess.
- Return one JSON object and nothing else: {"corrections":[{"id":"FINDING_ID","reason":"...","patches":[...],"role":"...","blockId":"...","remove":"BLOCK_ID"}],"comments":[{"findingId":"FINDING_ID","why":"..."}]}. Every finding id appears in exactly one of the two lists. Omit the keys a correction does not use.

Input:
${JSON.stringify(payload)}`;
}

// The second reader sees what changed and the source, and must find the answers itself before it judges.
export function checkPrompt({changes,pages}){
 return `You are the independent checker of corrections made to a printed MathsMap maths booklet. Do not run commands or open files: everything is below and in the attached images (the original document's pages, in the order of "sourcePages"). Another worker wrote each correction; you have not seen its reasoning.

For every correction: first derive, yourself, the correct answer to each question or part it touches (from the question as printed in "after" and the source page), and only then compare your answer with the "after" answer.short and answer.worked. Then check that the question still matches the source, that the short and worked answers agree, that the working uses the method the booklet teaches, and that nothing else was lost. Theory wording corrections must match the source page. A role change must put the block where the source puts it. Accept a correction only when every changed answer is yours. Verify the exact requested structural relationship in the finding against before/after data. ${FEEDBACK_CHECKS} A successful content check still needs affected-page visual verification before completion.

Return one JSON object and nothing else: {"checks":[{"id":"FINDING_ID","verdict":"accept|reject","derived":"your answer to each changed question, in short","note":"why, in under 25 words"}]} with exactly one entry per correction.

Input:
${JSON.stringify({sourcePages:pages.map((page,i)=>({image:i+1,sourcePage:page.page})),corrections:changes})}`;
}

// ---- applying ---------------------------------------------------------------------------------------

// A duplicate or merged block can be removed only when nothing leans on it.
export function removalBlocked(project,blockId){
 const index=bookletIndex(project),found=index.blocks.get(blockId);
 if(!found)return 'the block does not exist';
 if(found.section.phase!=='practice')return 'only a practice question can be removed';
 if(found.block.bankRef)return 'the block is linked to the question bank';
 const own=index.ids.get(blockId);
 const ordered=project.sections.flatMap(s=>s.blocks),previous=ordered[ordered.findIndex(b=>b.id===blockId)-1];
 if(previous?.flow?.keepWithNext)return 'block '+previous.id+' depends on it (keepWithNext)';
 for(const [id,{block}] of index.blocks)if(id!==blockId&&nodesOf(block).some(node=>[node.pairedBlockId,node.flow?.continuationOf,node.continuationOf,...(node.dependsOn??[]),...(node.flow?.dependsOn??[])].some(ref=>ref&&own.has(ref))))return 'block '+id+' depends on it';
 if(nodesOf(found.block).some(node=>node.flow?.keepWithNext||node.pairedBlockId||node.dependsOn?.length||node.flow?.dependsOn?.length))return 'the block has dependencies';
 return '';
}
// Role changes and removals on a project object. Returns {project, applied:[ids], refused:[{id, why}]}.
export function applyOperations(project,operations){
 let next=project;const applied=[],refused=[];
 for(const operation of operations){
  try{
   if(operation.role){
    if(!ROLES.includes(operation.role))throw Error('unknown role '+operation.role);
    next=changeBlockRole(next,operation.blockId,operation.role);
   }
   if(operation.remove){
    const why=removalBlocked(next,operation.remove);if(why)throw Error(why);
    next={...next,sections:next.sections.map(section=>({...section,blocks:section.blocks.filter(block=>block.id!==operation.remove)}))};
   }
   applied.push(operation.id);
  }catch(error){refused.push({id:operation.id,why:error.message});}
 }
 return {project:next,applied,refused};
}

const changedFields=(before,after)=>{
 const found=[];
 const walk=(a,b,pointer)=>{
  if(JSON.stringify(a)===JSON.stringify(b))return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))return void new Set([...Object.keys(a),...Object.keys(b)]).forEach(key=>walk(a[key],b[key],pointer+'/'+key));
  found.push(pointer);
 };
 walk(before,after,'');return found;
};

// ---- the step ------------------------------------------------------------------------------------------

// ask({prompt, images, name}) -> {result}. The default is the one model path of the polish steps (Sol low, at most
// three workers per booklet).
export async function runContentRepair({projectFile,provenanceDir,polishDir,runDir=null,protectedIds=null,concurrency=3,ask=null,applyRepairFn=null,safetyGuard=null,log=()=>{}}={}){
 const started=Date.now(),project=read(projectFile),index=bookletIndex(project),file=provenanceFile(project.id,{provenanceDir}),record=loadProvenance(file,project);
 protectedIds??=teacherBlocks(project);
 const safe=safetyGuard??(next=>polishSafetyIssues(project,next,{protectedIds,spacing:false}));
 const result={project:project.id,findings:0,applied:[],operations:[],commented:[],rejected:[],errors:[],calls:0};
 const pending=contentFindings(record,project,protectedIds);result.findings=pending.length;
 if(!pending.length)return {...result,elapsedSeconds:0};
 const dir=path.join(polishDir,'content');fs.mkdirSync(dir,{recursive:true});
 const askModel=ask??(async({prompt,images,name})=>(await import('../checks/lib/model.mjs')).askJson({prompt,project,workDir:path.join(dir,'calls'),name,images}));
 const pageFile=page=>runDir&&path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png');
 const sourceFor=ids=>{
  const pages=[];
  for(const id of ids){const block=index.blocks.get(id)?.block;if(!block)continue;for(const page of [block.sourcePageNumber,...(block.sourceRefs??[]).map(ref=>ref.pageNumber)])if(Number.isInteger(page)&&!pages.some(row=>row.page===page)&&pageFile(page)&&fs.existsSync(pageFile(page)))pages.push({page,path:pageFile(page)});}
  return pages.slice(0,6);
 };
 const byId=new Map(pending.map(finding=>[finding.id,finding])),corrections=[],comments=new Map();
 // 1. the author, one batch of findings per shared block
 await pool(groupFindings(pending),Math.max(1,Math.min(3,concurrency)),async group=>{
  const ids=[...new Set(group.flatMap(finding=>finding.targets.map(target=>target.blockId)))],pages=sourceFor(ids);
  try{
   result.calls++;
   const {result:answer}=await askModel({prompt:authorPrompt({project,index,group,pages}),images:pages.map(page=>page.path),name:'content-author'});
   const seen=new Set();
   for(const row of Array.isArray(answer?.corrections)?answer.corrections:[])if(byId.has(row?.id)&&!seen.has(row.id)&&group.some(finding=>finding.id===row.id)){seen.add(row.id);corrections.push({...row,group:ids,pages});}
   for(const row of Array.isArray(answer?.comments)?answer.comments:[])if(byId.has(row?.findingId)&&!seen.has(row.findingId)){seen.add(row.findingId);comments.set(row.findingId,String(row.why??'Not fixable from the evidence.'));}
   for(const finding of group)if(!seen.has(finding.id))comments.set(finding.id,'The author returned nothing for this finding.');
  }catch(error){result.errors.push(error.message);for(const finding of group)comments.set(finding.id,'The author failed: '+error.message);}
 });
 // 2. each correction must apply on a running copy; its patches and operations are separated
 const {applyCorrections}=await import('../scripts/booklet/lean-review.mjs');
 const blocks=structuredClone(project.sections.flatMap(section=>section.blocks)),holder={id:'project',settings:structuredClone(project.settings??{})};
 const staged=[];let operated=structuredClone(project);
 for(const correction of corrections){
  const patches=(correction.patches??[]).filter(patch=>patch&&patch.targetId&&patch.field),operation=correction.role||correction.remove?{id:correction.id,role:correction.role,blockId:correction.blockId??byId.get(correction.id).targets[0].blockId,remove:correction.remove}:null;
  if(!patches.length&&!operation){comments.set(correction.id,'The correction has no patch and no operation.');continue;}
  if(patches.some(patch=>patch.targetId==='project')){comments.set(correction.id,'A content correction may not change project settings.');continue;}
  const trial=structuredClone(blocks),outcome=applyCorrections([...trial,structuredClone(holder)],[{id:correction.id,patches}]),bad=outcome.rejected.filter(row=>row.status==='rejected');
  if(bad.length){comments.set(correction.id,'Does not apply: '+bad.map(row=>row.targetId+row.field+' ('+row.error+')').join('; '));continue;}
  if(patches.length&&!outcome.applied.length){comments.set(correction.id,'The patches change nothing.');continue;}
  const byBlock=new Map(trial.map(b=>[b.id,b])),candidate={...project,sections:project.sections.map(s=>({...s,blocks:s.blocks.map(b=>byBlock.get(b.id)??b)}))};
  const allOperations=[...staged.map(row=>row.operation).filter(Boolean),...(operation?[operation]:[])],op=applyOperations(candidate,allOperations);
  if(op.refused.length){comments.set(correction.id,'Refused: '+op.refused[0].why);continue;}
  const unsafe=safe(op.project);if(unsafe.length){comments.set(correction.id,'Unsafe content repair: '+unsafe.join('; '));continue;}
  operated=op.project;
  blocks.splice(0,blocks.length,...trial);
  staged.push({...correction,patches,operation,touched:[...new Set([...outcome.applied.map(row=>row.blockId),...(operation?[operation.blockId]:[])])]});
 }
 // 3. the independent check of everything staged
 const verdicts=new Map(),afterIndex=bookletIndex({...project,sections:[{id:'after',phase:'practice',blocks}]});
 const checkable=staged.map(row=>({row,before:row.touched.map(id=>index.blocks.get(id)?.block).filter(Boolean),after:row.touched.map(id=>afterIndex.blocks.get(id)?.block).filter(Boolean)}));
 const batches=[];for(const item of checkable){const last=batches.at(-1);if(last&&last.length<4&&last.reduce((n,x)=>n+JSON.stringify(x.after).length,0)<30000)last.push(item);else batches.push([item]);}
 await pool(batches,Math.max(1,Math.min(3,concurrency)),async batch=>{
  const pages=[...new Map(batch.flatMap(item=>sourceFor(item.row.group)).map(page=>[page.page,page])).values()].slice(0,8);
  const changes=batch.map(({row,before,after})=>({id:row.id,reason:row.reason,requested:byId.get(row.id)?.comment,fieldsChanged:before.flatMap((block,i)=>changedFields(questionReviewContent(block),questionReviewContent(after[i]??block))),...(row.operation?.role?{newRole:row.operation.role}:{}),...(row.operation?.remove?{removedBlock:row.operation.remove}:{}),before:before.map(questionReviewContent),after:after.map(questionReviewContent)}));
  try{
   result.calls++;
   const {result:answer}=await askModel({prompt:checkPrompt({changes,pages}),images:pages.map(page=>page.path),name:'content-check'});
   for(const row of Array.isArray(answer?.checks)?answer.checks:[])if(batch.some(item=>item.row.id===row?.id))verdicts.set(row.id,row);
  }catch(error){result.errors.push('check: '+error.message);}
 });
 const accepted=[];
 for(const {row} of checkable){
  const verdict=verdicts.get(row.id);
  if(verdict?.verdict==='accept')accepted.push(row);
  else{comments.set(row.id,'The independent check did not accept it: '+(verdict?.note||'no verdict returned')+'.');result.rejected.push({id:row.id,note:verdict?.note??'no verdict'});}
 }
 // 4. save: patches through the lean-review repair path, then the operations on the saved file
 if(accepted.length){
  // Rebuild the accepted subset: rejected siblings must not be needed to make it safe.
  const acceptedBlocks=structuredClone(project.sections.flatMap(s=>s.blocks));
  const replay=applyCorrections(acceptedBlocks,accepted.filter(row=>row.patches.length));
  const byBlock=new Map(acceptedBlocks.map(b=>[b.id,b])),candidate={...project,sections:project.sections.map(s=>({...s,blocks:s.blocks.map(b=>byBlock.get(b.id)??b)}))};
  const op=applyOperations(candidate,accepted.map(row=>row.operation).filter(Boolean));
  const unsafe=[...safe(op.project),...op.refused.map(row=>row.why),...replay.rejected.filter(row=>row.status==='rejected').map(row=>row.error)];
  if(unsafe.length){for(const row of accepted)comments.set(row.id,'Unsafe accepted repair set: '+unsafe.join('; '));accepted.length=0;}
 }
 if(accepted.length){
  const withPatches=accepted.filter(row=>row.patches.length);
  if(withPatches.length){
   const correctionsFile=path.join(dir,'corrections-'+now().replace(/[:.]/g,'-')+'.json');
   write(correctionsFile,{project:project.id,corrections:withPatches.map(({id,reason,patches})=>({id,reason,patches}))});
   try{
    const saved=await(applyRepairFn??(await import('../scripts/booklet/lean-review.mjs')).applyRepair)({runDir:dir,projectFile,correctionsFile});
    if(saved.errors?.length)result.errors.push(...saved.errors);
   }catch(error){result.errors.push('save: '+error.message);for(const row of withPatches)comments.set(row.id,'The save refused the repair: '+error.message);accepted.splice(0,accepted.length,...accepted.filter(row=>!withPatches.includes(row)));}
  }
  const operations=accepted.filter(row=>row.operation);
  if(operations.length){
   const saved=read(projectFile),op=applyOperations(saved,operations.map(row=>row.operation));
   for(const row of op.refused)comments.set(row.id,'Refused when saving: '+row.why);
   if(op.applied.length)write(projectFile,op.project);
   result.operations=op.applied;
   accepted.splice(0,accepted.length,...accepted.filter(row=>!op.refused.some(r=>r.id===row.id)));
  }
 }
 // 5. a note on every changed block, and the finding records
 const final=read(projectFile),finalIndex=bookletIndex(final),date=now().slice(0,10);
 for(const row of accepted){
  for(const id of row.touched){const block=finalIndex.blocks.get(id)?.block;if(!block)continue;block.sourceReview??={};(block.sourceReview.feedbackRepairs??=[]).push({date,source:'polish',note:`Polish content repair (${row.id}): ${row.reason??'content corrected'}; independently checked.`});}
  const finding=byId.get(row.id);finding.applyOutcome='repaired';finding.applyReason=row.reason;finding.contentVerified=true;finding.visualVerified=false;setState(finding,'repaired','Content repaired and independently checked; affected-page verification remains required.');result.applied.push(row.id);
 }
 if(accepted.length)write(projectFile,final);
 for(const finding of pending)if(!result.applied.includes(finding.id)){finding.applyOutcome='comment';finding.applyNote=comments.get(finding.id)??'Not applied.';result.commented.push({id:finding.id,why:finding.applyNote});}
 saveProvenance(file,record);
 return {...result,elapsedSeconds:Math.round((Date.now()-started)/1000)};
}
