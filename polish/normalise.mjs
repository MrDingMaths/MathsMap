// Polish pipeline step 1, Normalise (23 October 2026; deterministic, no model): the pre-review sweep's house rules
// (gutter, cloze, empty, ratio and the new steps, scaffold-anchor and bracket-blank) and the calibrated working
// space for every response area, guided practice and "your turn" included. A block the teacher decided
// (polish/flags.mjs teacherBlocks) is left exactly as it is, so reviewed booklets can go through too. A sweep change
// that would alter content, an answer or a classification is dropped for that block, never the run.
import {sweepProject,SWEEP_DATE} from '../sweep/rules.mjs';
import {verifyCandidate} from '../sweep/run.mjs';
import {applyCalibratedWorkingSpace} from '../paginate/lib/working-space-apply.mjs';
import {hasTeacherReview} from '../src/lib/booklet-import-spacing.js';
import {importFinalRevision} from '../bench/history.mjs';
import {teacherBlocks} from './flags.mjs';
import {exerciseStarts} from '../sweep/rules.mjs';

const blocksOf=project=>(project.sections??[]).flatMap(section=>section.blocks??[]);
// Put the original of these blocks back into a changed copy (a block is replaced whole, by id).
function restoreBlocks(project,original,ids){
 if(!ids.size)return project;
 const old=new Map(blocksOf(original).map(block=>[block.id,block]));
 return {...project,sections:project.sections.map(section=>({...section,blocks:section.blocks.map(block=>ids.has(block.id)&&old.has(block.id)?structuredClone(old.get(block.id)):block)}))};
}

// The import as delivered, for a reviewed booklet whose blocks record no import allowance: the last revision before
// the first teacher comment. Null when the history cannot say (the working space then fails closed).
const loadImported=project=>{try{return importFinalRevision(project.id,{live:project})?.project??null;}catch{return null;}};


// Source page boundaries inside a topic are not kept (23 October 2026, user decision): only exercise starts and topic banners
// start a page. A block with `flow.sourcePageBreakBefore` that is neither the first block of an exercise, nor the first
// block of a section opening a new topic (its banner), nor a block the teacher decided, loses the flag, as the teacher's
// "remove page break" does; `pageBreakBefore: true` (a manual break, possibly the teacher's) and page-break blocks stay.
// The optimiser then decides where pages end. Returns the ids changed.
export function clearSourceBreaks(project,{protectedIds=new Set()}={}){
 const {exerciseStarts:starts}=exerciseStarts(project),changed=[];
 let previousTopic;
 for(const section of project.sections??[]){
  const newTopic=section.topicId!==previousTopic;previousTopic=section.topicId;
  if(section.phase==='front-matter'||section.phase==='cover')continue;
  section.blocks?.forEach((block,index)=>{
   if(!block.flow?.sourcePageBreakBefore||block.flow.pageBreakBefore===true||protectedIds.has(block.id)||starts.has(block.id)||newTopic&&index===0)return;
   block.flow={...block.flow,sourcePageBreakBefore:false};
   changed.push(block.id);
  });
 }
 return changed;
}

export function normaliseProject(input,{protectedIds=teacherBlocks(input),freshImport=false,sweep=true,workingSpace=true,imported,date=new Date().toISOString().slice(0,10)}={}){
 let project=structuredClone(input);const report={sweep:null,workingSpace:null,sourceBreaksCleared:[],protectedBlocks:protectedIds.size,dropped:[]};
 if(sweep){
  const {project:swept,findings,changed}=sweepProject(project,{fix:true});
  // Drop what would change content, and anything on a block the teacher decided.
  const bad=new Set(verifyCandidate(project,swept,changed).map(problem=>problem.split(':')[0]));
  for(const id of changed)if(protectedIds.has(id))bad.add(id);
  for(const id of bad)report.dropped.push(id);
  project=restoreBlocks(swept,project,bad);
  const kept=changed.filter(id=>!bad.has(id)),byBlock=Object.fromEntries(kept.map(id=>[id,[...new Set(findings.filter(f=>f.blockId===id&&f.action==='fix').map(f=>f.rule))]]));
  for(const block of blocksOf(project))if(kept.includes(block.id)){
   block.sourceReview??={};(block.sourceReview.feedbackRepairs??=[]).push({date,source:'polish',note:'Polish normalise ('+byBlock[block.id].join(', ')+'): standing house conventions applied; content and answers unchanged.'});
  }
  const counts={};for(const f of findings)(counts[f.rule]??={fix:0,report:0})[f.action==='fix'?'fix':'report']++;
  report.sweep={changedBlocks:kept.length,counts,sweepRulesDate:SWEEP_DATE};
 }
 const cleared=clearSourceBreaks(project,{protectedIds});report.sourceBreaksCleared=cleared;
 for(const block of blocksOf(project))if(cleared.includes(block.id)){
  block.sourceReview??={};(block.sourceReview.feedbackRepairs??=[]).push({date,source:'polish',note:'Polish normalise (breaks): source page boundary inside a topic not kept; content and answers unchanged.'});
 }
 if(workingSpace){
  // Every booklet, reviewed ones included (23 October 2026): the teacher's own edits are protected allowance by
  // allowance (a value that is no longer its import value) and block by block (a teacher comment, authorised feedback).
  const reviewed=hasTeacherReview(input),from=imported===undefined?(reviewed?loadImported(input):null):imported;
  // A reviewed booklet's allowances only come down: a short answer's handwriting capacity could raise a block the
  // teacher has already seen past its page (logarithms p32-activity grew 80 mm and had no safe page break).
  const result=applyCalibratedWorkingSpace(project,{named:true,history:!freshImport,raise:!reviewed,tableRows:freshImport,teaching:true,freshImport,protectedIds,imported:from,relaxed:reviewed});
  project=result.project;report.workingSpace={...result.summary,...(reviewed?{importRevision:from?.revision??null}:{})};
 }
 return {project,report};
}

// Repair only a pre-review candidate stopped at pagination after an older
// normaliser expanded an explicit zero. Current source/answers must still match;
// caller retains every finished unrelated step and the canonical input is untouched.
export function restoreImportedZeroSpaces(input,candidate){
 const next=structuredClone(candidate),owners=new Map(blocksOf(input).map(b=>[b.id,b])),changed=[];
 const collect=(node,map)=>{if(!node||typeof node!=='object')return;if(node.id)map.set(node.id,node);node.children?.forEach(n=>collect(n,map));};
 for(const block of blocksOf(next)){const original=owners.get(block.id);if(!original)continue;const nodes=new Map();collect(original.content,nodes);
  const visit=node=>{if(!node)return;const old=nodes.get(node.id),estimate=original.sourceReview?.workingSpaceEstimate?.estimates?.find(e=>e.targetId===node.id);
   if(old?.answerSpaceMm===0&&estimate?.answerSpaceMm===0&&node.answerSpaceMm>0&&JSON.stringify(old.prompt)===JSON.stringify(node.prompt)&&JSON.stringify(old.answer)===JSON.stringify(node.answer)){
    // A separate saved override is a distinct user value; never infer permission
    // to overwrite it. Only the erroneous generated node field is restored.
    const override=next.settings?.layoutOverrides?.answerSpaces?.[node.id];
    if(override==null||override===0){changed.push({blockId:block.id,nodeId:node.id,before:node.answerSpaceMm,after:0});node.answerSpaceMm=0;}
   }
   node.children?.forEach(visit);
  };visit(block.content);
 }
 return {project:next,changes:changed};
}
