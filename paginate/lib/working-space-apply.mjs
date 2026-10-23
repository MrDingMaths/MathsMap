// Apply the teacher-calibrated working space to a project: the default for new
// imports and unreviewed booklets (22 October 2026, user approved). Pure: takes a
// project, returns a changed copy and a record of every change.
//
// Only values that still equal their import value change (the 17 October rule,
// docs/booklet-cross-session-rules.md "Tighter unreviewed layouts"):
//  * an answer allowance equal to the estimate recorded at import
//    (sourceReview.workingSpaceEstimate), wherever it is stored: the part's
//    answerSpaceMm, layoutOverrides.answerSpaces[id] and a saved arrangement's
//    space item;
//  * only with `tableRows: true` (--table-rows): a body table row taller than the
//    least its cells need (tableRowMinimum), unless the row changed since the first
//    revision. The calibration data supports no fit for table rows (78% unchanged),
//    so by default rows keep their content-sized minimum untouched.
// Guided practice and "your turn" blocks are included (workingSpaceProtected below: only a repair or a note
// about spacing protects them; `teaching:false` restores the stricter rule). `freshImport` says the project
// has not been edited since import, so with `tableRows` every body row is still its import height.
// Skipped: blocks with sourceReview.intentionalDepartures, authorisedFeedback or
// feedbackRepairs, front matter, and teacher-reviewed booklets unless `named`.
import {findContent} from '../../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {hasTeacherReview,spacingProtected,automatedRepair,tableRowMinimum,tableResponseAnswers} from '../../src/lib/booklet-import-spacing.js';
import {blockDocuments} from '../../src/lib/booklet-bulk-spacing.js';
import {calibratedWorkingSpace,allowanceCopies,stillImportAllowance,WORKING_SPACE_CALIBRATION_20261022} from '../../src/lib/booklet-working-space.js';
import {revisionsOf,loadRevision,allBlocks,collect} from '../../bench/history.mjs';

const clone=v=>structuredClone(v);
const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<0.01;
const RESPONSE_KINDS=new Set(['short','cloze','inline','working']);
export const isFrontMatter=section=>section.phase==='front-matter'||section.role==='front-matter';

// Guided practice and "your turn" response areas inside teaching blocks (23 October 2026). The import records
// departures and an authorised-feedback note on nearly every teaching block (palette, answers as editable text,
// "writing-space dimensions are authored estimates"); those do not make its working space a teacher's decision,
// and a value that still equals its import value in every stored copy has not been touched by anyone. Such a
// block is protected only by a repair or note about spacing, or by any non-automated feedback repair.
export const teachingResponseBlock=block=>block.pedagogyRole==='guided-practice'||block.presentation?.studentRole==='your-turn';
const SPACING_NOTE=/\b(?:keep|retain|preserve|leave|reduce|tighten|increase|enlarge|shrink)\b[^.]*\b(?:spac(?:e|ing)|gap|height|room)\b|\b(?:spac(?:e|ing)|gap)\b[^.]*\b(?:keep|retain|preserve|reduce|tighten|increase)\b/i;
// `relaxed` (a teacher-reviewed booklet in a polish run, 23 October 2026): the import's own departures protect no
// block by themselves; a non-automated repair, an authorised-feedback note or a note about spacing still does,
// and every allowance the teacher changed is protected one by one (it no longer equals its import value).
export function workingSpaceProtected(block,{teaching=true,relaxed=false}={}){
 if(!spacingProtected(block))return false;
 const sourceReview=block.sourceReview??{};
 if(relaxed&&!(teaching&&teachingResponseBlock(block))){
  const notes=[...(sourceReview.intentionalDepartures??[]),sourceReview.authorisedFeedback?.note].filter(n=>typeof n==='string'&&!/authored estimates/i.test(n));
  return !!sourceReview.authorisedFeedback||(sourceReview.feedbackRepairs??[]).some(entry=>!automatedRepair(entry))||notes.some(note=>SPACING_NOTE.test(note));
 }
 if(!teaching||!teachingResponseBlock(block))return true;
 if((sourceReview.feedbackRepairs??[]).some(entry=>!automatedRepair(entry)))return true;
 const notes=[...(sourceReview.intentionalDepartures??[]),sourceReview.authorisedFeedback?.note].filter(n=>typeof n==='string'&&!/authored estimates/i.test(n));
 return notes.some(note=>SPACING_NOTE.test(note));
}

// Keys (blockId/nodeId.field[index]) of table rows changed since the first revision. Null when the history
// cannot say (an error, no revisions, one revision): callers treat that as everything changed (fail closed).
export function changedSinceImport(project){
 try{
  const rows=revisionsOf(project.id);if(rows.length<2)return null;
  const first=collect(loadRevision(project.id,rows[0].revision)),current=collect(project),changed=new Set();
  for(const [key,x] of first)if(current.get(key)?.value!==x.value)changed.add(key);
  return changed;
 }catch{return null;}
}

// The allowances of a block as the import delivered it, for a block that records none (older imports): the leaf
// answers of `imported`, the project as it stood before the first teacher comment (bench/history.mjs
// importFinalRevision). Null import, no such block or a part with no allowance: nothing (fail closed).
function importedEstimates(imported,block){
 const old=imported?(imported.sections??[]).flatMap(section=>section.blocks??[]).find(b=>b.id===block.id):null;
 const found=new Map();
 const visit=node=>{
  if(!node||typeof node!=='object')return;
  if(node.children?.length){node.children.forEach(visit);return;}
  const mm=imported.settings?.layoutOverrides?.answerSpaces?.[node.id]??node.answerSpaceMm;
  if(node.answer&&node.id&&Number.isFinite(mm))found.set(node.id,{targetId:node.id,answerSpaceMm:mm});
 };
 if(old)visit(old.content);
 return found;
}

// protectedIds: block ids the teacher has decided (polish/flags.mjs teacherBlocks); they never change.
// imported: the project as the import delivered it, the import value of a block with no recorded estimate.
export function applyCalibratedWorkingSpace(source,{named=false,history=true,raise=true,tableRows=false,teaching=true,freshImport=false,protectedIds=null,imported=null,relaxed=false,calibration=WORKING_SPACE_CALIBRATION_20261022}={}){
 if(hasTeacherReview(source)&&!named)throw Error(`${source.id} has teacher comments; it changes only when named explicitly.`);
 const project=clone(source),changes=[],skipped={};
 const skip=reason=>{skipped[reason]=(skipped[reason]??0)+1;};
 const o=project.settings.layoutOverrides??={};
 // A fresh import has no history and nothing changed since import: every row is still its import height.
 const changedKeys=tableRows?(freshImport?new Set():history?changedSinceImport(source):null):null;
 for(const section of project.sections){
  if(isFrontMatter(section))continue;
  for(const block of section.blocks??[]){
   if(protectedIds?.has(block.id)||workingSpaceProtected(block,{teaching,relaxed})){skip('protected-block');continue;}
   // ---- answer allowances ----
   const responses=new Map((block.sourceReview?.responses??[]).map(r=>[r.targetId,r.kind]));
   const recorded=new Map((block.sourceReview?.workingSpaceEstimate?.estimates??[]).map(e=>[e.targetId,e]));
   if(!recorded.size&&imported)for(const [id,e] of importedEstimates(imported,block))recorded.set(id,e);
   const layout=o.blockLayouts?.[block.id]?.arrangement;
   for(const [targetId,estimate] of recorded){
    const node=findContent(block,targetId);
    if(!node?.answer||node.children?.length){skip('not-a-leaf-answer');continue;}
    const kind=responses.get(targetId)??'working';
    if(!RESPONSE_KINDS.has(kind)){skip('response-kind-'+kind);continue;}
    const items=layout?arrangementItems(layout.root).filter(item=>item.ref===targetId+'/space'&&Number.isFinite(item.height)):[];
    const copies=allowanceCopies(source,block,node);
    if(!copies.length){skip('no-allowance');continue;}
    // Every stored copy the renderer or a saved layout may read must still be the import value.
    const effective=o.answerSpaces?.[targetId]??items[0]?.height??node.answerSpaceMm;
    if(!stillImportAllowance(copies,estimate.answerSpaceMm)){skip('changed-since-import');continue;}
    const binding=block.sourceReview?.tableResponses?.find(r=>r.targetId===targetId);
    const context=binding?{kind:'table-cell',providesWritingSpace:true}:{kind,expectedAnswer:node.answer.short};
    let target;
    try{target=calibratedWorkingSpace(node,{widthMm:estimate.widthMm,responseKind:kind,responseContext:context,importMm:estimate.answerSpaceMm},calibration);}catch{skip('no-worked-solution');continue;}
    if(near(target,effective))continue;
    // The median fit moves an allowance either way; --no-raise keeps tight import values.
    if(target>effective&&!raise){skip('import-value-below-floor');continue;}
    if(Number.isFinite(node.answerSpaceMm))node.answerSpaceMm=target;
    if(Number.isFinite(o.answerSpaces?.[targetId]))o.answerSpaces[targetId]=target;
    for(const item of items)item.height=target;
    changes.push({blockId:block.id,nodeId:targetId,field:'answerSpaceMm',kind,before:effective,after:target});
   }
   // ---- table body rows ----
   if(tableRows)for(const {document} of blockDocuments(block)){
    const visit=n=>{
     if(!n||typeof n!=='object')return;
     if(Array.isArray(n)){n.forEach(visit);return;}
     if(n.type==='table'&&Array.isArray(n.rowHeights)){
      n.rows.forEach((row,i)=>{
       if(row.some(c=>c.header)||!Number.isFinite(n.rowHeights[i]))return;
       // Fail closed: without a history to compare, every row counts as changed.
       if(!changedKeys||changedKeys.has(`${block.id}/${n.id}.rowHeights[${i}]`)){skip(changedKeys?'row-changed-since-import':'row-history-unavailable');return;}
       const minimum=tableRowMinimum(n,i,n.widthMm??170,tableResponseAnswers(block));
       if(minimum==null){skip('row-needs-unknown');return;}
       const target=Math.max(10,minimum);
       if(target<n.rowHeights[i]-0.01){changes.push({blockId:block.id,nodeId:n.id,field:'rowHeights',index:i,before:n.rowHeights[i],after:target});n.rowHeights[i]=target;}
      });
     }
     for(const v of Object.values(n))if(v&&typeof v==='object')visit(v);
    };
    visit(document);
   }
   // ---- arrangement minHeight on a response space ----
   if(layout)for(const item of arrangementItems(layout.root)){
    if(!Number.isFinite(item.minHeight)||!item.ref?.endsWith('/space'))continue;
    const node=findContent(block,item.ref.slice(0,-6));
    if(!node?.answer)continue;
    const recordedHere=recorded.get(node.id);
    if(!recordedHere||!near(item.minHeight,recordedHere.answerSpaceMm))continue;
    const kind=responses.get(node.id)??'working';
    try{const target=calibratedWorkingSpace(node,{widthMm:recordedHere.widthMm,responseKind:kind,responseContext:{kind,expectedAnswer:node.answer.short},importMm:recordedHere.answerSpaceMm},calibration);
     if(target>item.minHeight&&!raise){skip('import-value-below-floor');continue;}
     if(!near(target,item.minHeight)){changes.push({blockId:block.id,nodeId:node.id,field:'minHeight',before:item.minHeight,after:target});item.minHeight=target;}}catch{}
   }
  }
 }
 const by={};
 for(const c of changes){const k=c.field;by[k]??={count:0,lowered:0,raised:0,mmChange:0};by[k].count++;by[k][c.after<c.before?'lowered':'raised']++;by[k].mmChange=Math.round((by[k].mmChange+c.after-c.before)*10)/10;}
 return {project,changes,summary:{changes:changes.length,byField:by,skipped}};
}
