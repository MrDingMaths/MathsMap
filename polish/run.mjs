#!/usr/bin/env node
// Booklet polish pipeline (23 October 2026; docs/booklet-verification-speed.md). One command that takes a booklet,
// a new import or any Stage 5 master, from its import state to a page-checked, source-checked Questions edition
// without the teacher. Replaces handoff/run.mjs.
//
//   node polish/run.mjs --project ID | --candidate FILE [--save] [--skip a,b] [--only a,b] [--no-model]
//                       [--out FILE] [--work-dir DIR] [--fresh] [--fresh-import] [--allow-live]
//   node polish/run.mjs --list
//
// Steps, in order (each is resumable from <work>/polish/state.json, which also holds every step's seconds):
//   snapshot      the input revision, the page counts of every edition, and (with --save) the milestone checkpoint
//   normalise     the sweep's house rules (incl. step gutter, scaffold anchor, bracket blanks) + calibrated working space
//   blank-style   outlined blanks where the source leaves empty space become the parenthesised gap (polish/blank-style.mjs; one Sol low call per block, with its source page)
//   wrapped-math  display formulas that wrap (checks/wrapped-math.mjs)
//   dependencies  which questions must keep their order (polish/dependencies.mjs; one Sol low call per exercise)
//   paginate      the pagination optimiser with the orphan pull (paginate/optimise.mjs)
//   review        the full-book first-pass review beside the source pages, then its layout findings applied, at most 2 rounds
//   content       content findings (roles, theory wording, answers, duplicates) repaired and independently checked
//   residual      a second full-book review, report only; more than 1 finding per 10 pages gets one more apply round
//   supersede     open first-pass / pedagogy-review comments of earlier runs closed as superseded
//   breaks        forced exercise breaks worth removing, as Studio comments with a one-click button
//   export        deterministic gates and the student PDF without --draft
//   sheets        contact sheets of every Questions page
//   pedagogy      extension and bridging-question suggestions as Studio comments (nothing applied)
//   report        <work>/polish/report.json and one line
//
// The pipeline edits a working copy, <work>/polish/candidate.json, never the input. --out copies the result; --save
// (a live --project only) writes it through the revision-checked repair path: the revision recorded at the start must
// still be the booklet's, no import, review or export may be running for it, and a milestone checkpoint of the start
// revision is taken first. Teacher comments (a flag with no kind) and the blocks the teacher decided are never changed.
// Model calls are GPT-6.1 Sol at low reasoning, at most three workers per booklet; launch them with the permitted host
// launch AGENTS.md describes. The Studio server on 127.0.0.1:5173 is used, never restarted.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {ROOT,read,write,now,isMain,parseArgs,runDirOf,changedBlocks} from '../checks/lib/common.mjs';
import {teacherBlocks,openMachineFlagIds,supersedeMachineFlags,addBreakSuggestionFlags,KIND_BREAK} from './flags.mjs';
import {assertPolishSafety,polishSafetyIssues} from './guards.mjs';

export const STEPS=Object.freeze(['snapshot','normalise','blank-style','wrapped-math','dependencies','paginate','review','content','residual','supersede','breaks','export','sheets','pedagogy','report']);
const MODEL_STEPS=new Set(['blank-style','dependencies','review','content','residual','pedagogy']);
export const RESIDUAL_PER_PAGES=10; // more than one layout finding per ten Questions pages holds the booklet
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,16);
const BASE='http://127.0.0.1:5173';
const LAYOUT_AREAS=new Set(['pagination','spacing','labels','response','table','diagram','alignment','answers']);
const SUGGESTION_AREAS=new Set(['extension','review']);

// ---- pure helpers (tested) ---------------------------------------------------------------------------
// The residual findings that count against the booklet: layout and answer-edition findings, not suggestions or content.
export function residualHold(residual,studentPages){
 const layout=residual.filter(row=>LAYOUT_AREAS.has(row.area)),limit=Math.floor(studentPages/RESIDUAL_PER_PAGES);
 return {count:residual.length,layout:layout.length,limit,held:layout.length>limit,perTenPages:studentPages?Math.round(layout.length/studentPages*100)/10:0};
}
// What the export gate refuses: a longer edition, an oversized block, or a pagination issue the input did not have.
export function gateProblems(baseline,final){
 const problems=[];
 for(const edition of ['student','short','worked'])if(Number.isInteger(baseline?.pages?.[edition])&&final.pages[edition]>baseline.pages[edition])problems.push(`${edition} grew from ${baseline.pages[edition]} to ${final.pages[edition]} pages`);
 const known=new Set(Object.entries(baseline?.issues??{}).flatMap(([edition,issues])=>issues.map(issue=>`${edition}:${issue.kind}:${issue.id}`)));
 for(const [edition,issues] of Object.entries(final.issues??{}))for(const issue of issues)if(issue.kind==='oversized-content'||!known.has(`${edition}:${issue.kind}:${issue.id}`))problems.push(`${edition} pagination issue ${issue.kind} on ${issue.id}`);
 return problems;
}
export function reportLine(report){
 const pages=['student','short','worked'].map(edition=>`${edition} ${report.pages.before?.[edition]??'?'}→${report.pages.after?.[edition]??'?'}`).join(', ');
 const f=report.fixes;
 return `${report.project}: pages ${pages}; fixes normalise ${f.normalise?.blocks??0}, paginate ${f.paginate?.moves??0}, review ${f.review?.applied??0}, content ${f.content?.applied??0}; residual ${report.residual?.count??'-'}${report.residual?.held?' (held)':''}; pedagogy suggestions ${report.pedagogy?.suggestions??0}; break suggestions ${report.breakSuggestions?.length??0}; ${Math.round(report.elapsedSeconds/60)} min`;
}
// Mark a running state's steps, resumably: the steps already done are kept unless the input changed.
export function startState({previous,inputSha,project,file,fresh=false}){
 if(previous&&!fresh&&previous.input?.sha===inputSha)return {state:previous,resumed:true};
 return {state:{version:1,project:project.id,input:{file:path.resolve(file),sha:inputSha,revision:project.revision??null},startedAt:now(),steps:{}},resumed:false};
}
export async function pinMilestone(id,revision,{root=ROOT}={}){
 if(!Number.isInteger(revision))return {pinned:false,reason:'the booklet has no revision number'};
 const file=path.join(root,'booklets','projects','.revisions','milestones.json');
 if(!/^[a-zA-Z0-9._-]+$/.test(id)||id==='.'||id==='..')throw Error('Invalid milestone project id');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const lock=file+'.polish-lock',deadline=Date.now()+60000;let descriptor;
 for(;;){try{descriptor=fs.openSync(lock,'wx');break;}catch(error){if(error.code!=='EEXIST'||Date.now()>=deadline)throw error;await new Promise(resolve=>setTimeout(resolve,50));}}
 try{
  let all={};try{all=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw Error('Invalid revision milestone configuration: '+file,{cause:error});}
  if(!all||typeof all!=='object'||Array.isArray(all)||Object.values(all).some(pins=>!Array.isArray(pins)||pins.some(n=>!Number.isSafeInteger(n)||n<0)))throw Error('Invalid revision milestone configuration: '+file);
  const live=path.join(root,'booklets','projects',id+'.json');
  if(fs.existsSync(live)){
   const project=read(live);if(project.revision!==revision)throw Error('Booklet changed before the milestone checkpoint');
   const checkpoint=path.join(path.dirname(file),id,revision+'.json');fs.mkdirSync(path.dirname(checkpoint),{recursive:true});
   try{fs.writeFileSync(checkpoint,JSON.stringify(project,null,2)+'\n',{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
  }
  if(!(all[id]??[]).includes(revision)){
   all[id]=[...(all[id]??[]),revision].sort((a,b)=>a-b);
   const temporary=file+'.'+process.pid+'.tmp';
   try{fs.writeFileSync(temporary,JSON.stringify(all,null,1)+'\n');fs.renameSync(temporary,file);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
  }
  return {pinned:true,revision};
 }finally{fs.closeSync(descriptor);fs.unlinkSync(lock);}
}

// Studio and teacher autosaves must share ONE save queue. A CLI import of the server
// module has its own in-process lock and cannot exclude an edit in the running server.
export async function saveThroughStudio(project,{expectedRevision},request=fetch){
 const response=await request(BASE+'/__booklet/projects/'+encodeURIComponent(project.id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({project,expectedRevision})});
 const saved=await response.json();
 if(!response.ok)throw Error('Studio refused the polish save: '+(saved.error??response.status));
 if(saved.id!==project.id||saved.revision!==expectedRevision+1)throw Error('Studio returned an unexpected polish save revision');
 return saved;
}

// ---- the steps ---------------------------------------------------------------------------------------
// Each step reads and writes ctx.work (the working copy) and returns a small result object, or {skipped: why}.
// ctx: {id, work, polishDir, baseDir, runDir, opts, log, deps}. `deps` replaces the heavy parts in tests.
const provenanceDirOf=ctx=>path.join(ctx.polishDir,'provenance');
const safetyOptions=ctx=>({reference:ctx.original,imported:ctx.imported,protectedIds:teacherBlocks(ctx.original)});
const safetyGuard=(ctx,before)=>after=>polishSafetyIssues(before,after,safetyOptions(ctx));
function seedProvenance(ctx){
 const dir=provenanceDirOf(ctx),file=path.join(dir,ctx.id+'.json'),live=path.join(ROOT,'booklets','provenance','first-pass-review',ctx.id+'.json');
 fs.mkdirSync(dir,{recursive:true});
 if(!fs.existsSync(file)&&fs.existsSync(live))fs.copyFileSync(live,file);
 return dir;
}
const mapPages=async(ctx,project,name)=>{
 const {defaultMapPages}=await import('../first-pass/review.mjs');
 return defaultMapPages({project,dir:path.join(ctx.polishDir,name),base:BASE,fresh:true});
};
const countsOf=map=>({pages:Object.fromEntries(['student','short','worked'].map(edition=>[edition,(map[edition]??[]).length])),issues:Object.fromEntries(['student','short','worked'].map(edition=>[edition,map.issues?.[edition]??[]]))});

const impl={
 async snapshot(ctx){
  const project=read(ctx.work),result={revision:ctx.state.input.revision};
  if(ctx.opts['--save'])result.milestone=await(ctx.deps.pinMilestone??pinMilestone)(ctx.id,ctx.state.input.revision);
  const counts=countsOf(await(ctx.deps.mapPages??mapPages)(ctx,project,'render-baseline'));
  ctx.state.baseline=counts;ctx.state.startFlagIds=[...openMachineFlagIds(project)];
  return {...result,pages:counts.pages};
 },
 async normalise(ctx){
  const {normaliseProject}=await import('./normalise.mjs'),project=read(ctx.work);
  const {project:next,report}=normaliseProject(project,{freshImport:!!ctx.opts['--fresh-import'],protectedIds:teacherBlocks(project)});
  write(ctx.work,next);
  return {blocks:changedBlocks(project,next).length,sweep:report.sweep,sourceBreaksCleared:report.sourceBreaksCleared?.length??0,workingSpace:report.workingSpace?.byField??null,protectedBlocks:report.protectedBlocks,dropped:report.dropped};
 },
 async 'blank-style'(ctx){
  const {runBlankStyle}=await import('./blank-style.mjs'),project=read(ctx.work);
  const {project:next,report}=await(ctx.deps.runBlankStyle??runBlankStyle)({project,runDir:ctx.runDir,cacheDir:ctx.baseDir,protectedIds:teacherBlocks(project),log:ctx.log});
  write(ctx.work,next);
  return {blocks:report.blocks,asked:report.asked,cache:report.cache,converted:report.converted.length,pieces:report.converted.reduce((n,row)=>n+row.pieces,0),kept:report.kept.length,skipped:report.skipped.length,errors:report.errors};
 },
 async 'wrapped-math'(ctx){
  const {runWrappedMath}=await import('../checks/wrapped-math.mjs');
  const {report}=await runWrappedMath({project:read(ctx.work),file:ctx.work,apply:true,log:ctx.log});
  return {before:report.before.wrapped,after:report.after.wrapped,pages:[report.before.pages,report.after.pages],changed:report.changed.length};
 },
 async dependencies(ctx){
  const {runDependencies}=await import('./dependencies.mjs'),project=read(ctx.work);
  const {project:next,report}=await runDependencies({project,runDir:ctx.baseDir,model:!ctx.opts['--no-model'],log:ctx.log});
  write(ctx.work,next);
  return {exercises:report.exercises,wording:report.regex,model:report.model,cache:report.cache,pairs:report.pairs.length,blocksChanged:report.changed.length,errors:report.errors};
 },
 async paginate(ctx){
  const {driveStudio}=await import('../paginate/optimise.mjs'),project=read(ctx.work);
  const out=await(ctx.deps.driveStudio??driveStudio)(project,{apply:true,named:true,log:ctx.log});
  if(out.moves?.length&&out.project)write(ctx.work,out.project);
  const rejections={};for(const row of out.rejected??[])rejections[row.reason]=(rejections[row.reason]??0)+1;
  return {before:out.before,after:out.after,moves:out.moves?.length??0,byType:out.byType,trials:out.trials,rejections};
 },
 async review(ctx){
  const rv=await import('../first-pass/review.mjs'),queues=await import('../first-pass/queues.mjs'),{runApply,APPLY_AREAS}=await import('../first-pass/apply.mjs'),{feedbackStatus}=await import('../src/lib/booklet-feedback.js');
  const provenanceDir=seedProvenance(ctx),workDir=path.join(ctx.polishDir,'first-pass'),file=rv.provenanceFile(ctx.id,{provenanceDir});
  const review=ctx.deps.runReview??rv.runReview,apply=ctx.deps.runApply??runApply;
  const result={rounds:[]};
  const first=await review({projectFile:ctx.work,provenanceDir,workDir,runDir:ctx.runDir,source:true,textbook:!!ctx.opts['--textbook'],concurrency:3,log:ctx.log});
  result.reviewed={pages:first.reviewed,states:first.states,errors:first.errors};
  for(let round=1;round<=2;round++){
   const project=read(ctx.work),record=rv.loadProvenance(file,project),protectedIds=teacherBlocks(project);
   queues.classifyRecord(record,project,{feedbackStatus});
   // A finding on a block the teacher decided is never attempted.
   for(const finding of record.findings??[])if(finding.state==='pending'&&!finding.applyOutcome&&finding.targets.some(target=>protectedIds.has(target.blockId))){finding.applyOutcome='protected';finding.applyNote='A block the teacher decided; polish does not change it.';}
   rv.saveProvenance(file,record);
   const named=round===1?null:(record.findings??[]).filter(finding=>finding.state==='pending'&&['reverted','comment'].includes(finding.applyOutcome)&&['a','b'].includes(finding.queue?.name)&&APPLY_AREAS.includes(finding.area)&&!finding.queueRerun&&!finding.targets.some(target=>protectedIds.has(target.blockId))).map(finding=>finding.id);
   if(round===2&&!named.length)break;
   const outcome=await apply({projectFile:ctx.work,provenanceDir,runDir:path.join(ctx.polishDir,'apply'),workDir,findingIds:named,queueLabel:round===1?null:'a,b',safetyGuard:safetyGuard(ctx,project),log:ctx.log});
   result.rounds.push({round,applied:outcome.applied.length,reverted:outcome.reverted.length,comment:outcome.comment.length,left:outcome.left.length,errors:outcome.errors});
  }
  const project=read(ctx.work),record=rv.loadProvenance(file,project);
  result.applied=result.rounds.reduce((n,row)=>n+row.applied,0);
  result.protected=(record.findings??[]).filter(f=>f.applyOutcome==='protected').length;
  result.unapplied=(record.findings??[]).filter(f=>f.state==='pending'&&LAYOUT_AREAS.has(f.area)).map(f=>({id:f.id,area:f.area,page:f.page,comment:f.comment,why:f.applyNote??null}));
  return result;
 },
 async content(ctx){
  const {runContentRepair}=await import('./content.mjs'),project=read(ctx.work);
  const out=await(ctx.deps.runContentRepair??runContentRepair)({projectFile:ctx.work,provenanceDir:provenanceDirOf(ctx),polishDir:ctx.polishDir,runDir:ctx.runDir,protectedIds:teacherBlocks(ctx.original),safetyGuard:safetyGuard(ctx,project),log:ctx.log});
  return {findings:out.findings,applied:out.applied.length,operations:out.operations.length,commented:out.commented,rejected:out.rejected,errors:out.errors,calls:out.calls};
 },
 async residual(ctx){
  const rv=await import('../first-pass/review.mjs'),{runApply}=await import('../first-pass/apply.mjs'),queues=await import('../first-pass/queues.mjs'),{feedbackStatus}=await import('../src/lib/booklet-feedback.js');
  const mainDir=provenanceDirOf(ctx),dir=path.join(ctx.polishDir,'provenance-residual');
  fs.mkdirSync(dir,{recursive:true});
  const mainFile=rv.provenanceFile(ctx.id,{provenanceDir:mainDir});
  if(fs.existsSync(mainFile))fs.copyFileSync(mainFile,rv.provenanceFile(ctx.id,{provenanceDir:dir}));
  const review=ctx.deps.runReview??rv.runReview,workDir=path.join(ctx.polishDir,'first-pass');
  const out=await review({projectFile:ctx.work,provenanceDir:dir,workDir,runDir:ctx.runDir,source:true,reportOnly:true,textbook:!!ctx.opts['--textbook'],concurrency:3,log:ctx.log});
  const studentPages=out.pageCounts?.student??0;let hold=residualHold(out.residual,studentPages);
  const result={reviewedPages:out.reviewed,found:out.residual.length,layout:hold.layout,limit:hold.limit,perTenPages:hold.perTenPages,held:hold.held,errors:out.errors,applied:0};
  let listed=out.residual;
  if(hold.held){
   const project=read(ctx.work),protectedIds=teacherBlocks(project),file=rv.provenanceFile(ctx.id,{provenanceDir:dir}),record=rv.loadProvenance(file,project);
   queues.classifyRecord(record,project,{feedbackStatus});
   for(const finding of record.findings??[])if(finding.state==='pending'&&!finding.applyOutcome&&finding.targets.some(target=>protectedIds.has(target.blockId))){finding.applyOutcome='protected';}
   rv.saveProvenance(file,record);
   const outcome=await(ctx.deps.runApply??runApply)({projectFile:ctx.work,provenanceDir:dir,runDir:path.join(ctx.polishDir,'apply-residual'),workDir,queueLabel:'residual',safetyGuard:safetyGuard(ctx,project),log:ctx.log});
   result.applied=outcome.applied.length;result.roundErrors=outcome.errors;
   const appliedIds=new Set(outcome.applied);listed=out.residual.filter(row=>!appliedIds.has(row.id));
  }
  result.remaining=listed.length;result.listed=listed;
  return result;
 },
 async supersede(ctx){
  const rv=await import('../first-pass/review.mjs'),project=read(ctx.work),date=now().slice(0,10);
  const ids=new Set(ctx.state.startFlagIds??[]);
  if(ctx.opts['--textbook'])for(const flag of project.studio?.flags??[])if(flag.kind==='pedagogy-review')ids.delete(flag.id);
  const {project:next,closed}=supersedeMachineFlags(project,{date,ids});
  if(closed.length){
   write(ctx.work,next);
   // The findings of the booklet's own first-pass record whose comments were closed are closed too.
   const dir=provenanceDirOf(ctx),file=rv.provenanceFile(ctx.id,{provenanceDir:dir});
   if(fs.existsSync(file)){const record=rv.loadProvenance(file,next),ids=new Set(closed.map(row=>row.findingId).filter(Boolean));for(const finding of record.findings??[])if(ids.has(finding.id))rv.setState(finding,'closed','superseded by polish '+date);rv.saveProvenance(file,record);}
  }
  return {closed:closed.length,kinds:closed.reduce((by,row)=>({...by,[row.kind]:(by[row.kind]??0)+1}),{})};
 },
 async breaks(ctx){
  const {driveStudio}=await import('../paginate/optimise.mjs'),{exerciseNumbers}=await import('../src/lib/booklet-flow.js'),project=read(ctx.work);
  const out=await(ctx.deps.driveStudio??driveStudio)(project,{suggestOnly:true,named:true,log:ctx.log}),found=out.breakSuggestions??[];
  const numbers=exerciseNumbers(project),labels=Object.fromEntries(found.map(item=>[item.sectionId,numbers[item.topicId]?'Exercise '+numbers[item.topicId]:'this exercise']));
  const {project:next,added}=addBreakSuggestionFlags(project,found,{labels});
  write(ctx.work,next);write(path.join(ctx.polishDir,'break-suggestions.json'),{project:ctx.id,at:now(),minFreeMm:60,suggestions:found});
  ctx.state.breakSuggestions=found;
  return {found:found.length,flagged:added.length,estPagesSaved:found.reduce((n,item)=>n+item.estPagesSaved,0),savedMm:Math.round(found.reduce((n,item)=>n+(item.savedMm??0),0))};
 },
 async export(ctx){
  const project=read(ctx.work),dir=path.join(ctx.polishDir,'export'),pdf=path.join(dir,'student.pdf');
  fs.mkdirSync(dir,{recursive:true});
  const final=countsOf(await(ctx.deps.mapPages??mapPages)(ctx,project,'render-final'));
  ctx.state.final=final;
  const problems=gateProblems(ctx.state.baseline,final);
  // The student edition must export without --draft: that runs the page checks (inspectBooklet) and refuses any pagination issue.
  const doExport=ctx.deps.exportPdf??exportPdf,run=doExport(ctx.work,pdf);
  let note=null;
  if(run.status!==0){
   const message='export-pdf student failed: '+String(run.stderr||run.error?.message||'').split(/\r?\n/).filter(Boolean).slice(-2).join(' | ');
   // A page-check failure the input already had is not the pipeline's: export both with --draft (which writes the PDF and the
   // QA file anyway) and compare the issues by kind. More issues than the input is a failed gate; a PDF is kept for the sheets.
   const qaFailed=/QA failed|Printed PDF geometry failed/.test(String(run.stderr));
   if(qaFailed){
    const draft=doExport(ctx.work,pdf,{draft:true}),inputPdf=path.join(path.dirname(pdf),'input.pdf'),before=doExport(ctx.state.input.file,inputPdf,{draft:true});
    const now=qaCounts(pdf),was=qaCounts(inputPdf),worse=qaWorse(was,now);
    if(draft.status===0&&before.status===0&&!worse.length)note='The student export has page-check findings, but no more than the input: '+JSON.stringify(now);
    else problems.push(message+(worse.length?' (worse than the input: '+worse.join('; ')+')':''));
   }else problems.push(message);
  }
  ctx.state.gates={ok:!problems.length,problems,...(note?{note}:{})};
  return {pages:final.pages,pdf:fs.existsSync(pdf)?path.relative(ROOT,pdf):null,gates:ctx.state.gates};
 },
 async sheets(ctx){
  const pdf=path.join(ctx.polishDir,'export','student.pdf');
  if(!fs.existsSync(pdf))return {skipped:'no student PDF (the export step did not produce one)'};
  const {makeSheets}=await import('./sheets.mjs');
  const out=await(ctx.deps.makeSheets??makeSheets)({pdf,out:path.join(ctx.polishDir,'sheets'),title:ctx.id,log:ctx.log});
  return {pages:out.pages,sheets:out.sheets.length,dir:path.relative(ROOT,path.join(ctx.polishDir,'sheets'))};
 },
 async pedagogy(ctx){
  const {runPedagogySuggestions,postSuggestions}=await import('./pedagogy.mjs'),rv=await import('../first-pass/review.mjs');
  const out=await(ctx.deps.runPedagogySuggestions??runPedagogySuggestions)({projectFile:ctx.work,polishDir:ctx.polishDir,log:ctx.log});
  const items=[...(out.items??[])];
  // The first-pass review's own extension and opening-review ideas are the teacher's to decide too.
  const file=rv.provenanceFile(ctx.id,{provenanceDir:provenanceDirOf(ctx)});
  if(fs.existsSync(file))for(const finding of rv.loadProvenance(file,read(ctx.work)).findings??[])if(finding.state==='pending'&&SUGGESTION_AREAS.has(finding.area)&&!finding.groupedUnder)items.push({id:finding.id,targets:finding.targets.map(target=>target.id),note:rv.commentNote(finding)});
  const added=postSuggestions(ctx.work,items);
  return {...(out.skipped?{skipped:out.skipped}:{}),suggestions:items.length,posted:added.length,reportedOnly:(out.reported??[]).map(f=>({id:f.id,kind:f.kind,severity:f.severity,finding:f.finding}))};
 },
 async report(ctx){
  const steps=ctx.state.steps,get=name=>steps[name]?.result??null,seconds=Object.values(steps).reduce((n,row)=>n+(row.seconds??0),0);
  const report={project:ctx.id,at:now(),input:ctx.state.input,elapsedSeconds:seconds,
   pages:{before:ctx.state.baseline?.pages??null,after:ctx.state.final?.pages??null},
   steps:Object.fromEntries(STEPS.filter(name=>steps[name]).map(name=>[name,{status:steps[name].status,seconds:steps[name].seconds??null}])),
   fixes:{normalise:get('normalise'),wrappedMath:get('wrapped-math'),dependencies:get('dependencies'),paginate:get('paginate'),review:get('review'),content:get('content'),residualRound:get('residual')?.applied??0},
   residual:get('residual')&&{count:get('residual').found,layout:get('residual').layout,perTenPages:get('residual').perTenPages,held:get('residual').held,remaining:get('residual').remaining,listed:get('residual').listed},
   pedagogy:get('pedagogy'),breakSuggestions:ctx.state.breakSuggestions??[],gates:ctx.state.gates??null,sheets:get('sheets')};
  report.line=reportLine(report);
  write(path.join(ctx.polishDir,'report.json'),report);
  return report;
 },
};
// The page-check findings (inspectBooklet, per page) an export left in <pdf>.qa.json, counted by kind.
export function qaCounts(pdf){
 try{
  const counts={};
  for(const page of JSON.parse(fs.readFileSync(pdf+'.qa.json','utf8')))for(const issue of page.issues??[])counts[issue.kind]=(counts[issue.kind]??0)+1;
  return counts;
 }catch{return null;}
}
// The kinds the polished copy has more of than the input (an unreadable file counts as worse).
export function qaWorse(was,now){
 if(!was||!now)return ['the page-check findings could not be read'];
 return Object.entries(now).filter(([kind,count])=>count>(was[kind]??0)).map(([kind,count])=>`${kind} ${was[kind]??0} to ${count}`);
}
function exportPdf(file,pdf,{draft=false}={}){
 return spawnSync(process.execPath,[path.join(ROOT,'scripts','booklet','export-pdf.mjs'),'--project',file,'--mode','student','--out',pdf,'--base',BASE,...(draft?['--draft']:[])],{cwd:ROOT,encoding:'utf8',maxBuffer:256*1024*1024,windowsHide:true,timeout:60*60*1000});
}

// ---- the driver --------------------------------------------------------------------------------------
export async function runPolish({file,baseDir,opts={},skip=[],only=null,fresh=false,deps={},log=()=>{}}){
 const original=read(file),id=original.id,polishDir=path.join(baseDir,'polish');
 fs.mkdirSync(polishDir,{recursive:true});
 const work=path.join(polishDir,'candidate.json'),statePath=path.join(polishDir,'state.json');
 const previous=fs.existsSync(statePath)?read(statePath):null;
 // Textbook imports never run pedagogy, including when --only requests it.
 if(opts['--textbook']){skip=[...new Set([...skip,'pedagogy'])];if(only)only=only.filter(name=>name!=='pedagogy');}
 const {state,resumed}=startState({previous,inputSha:sha(file),project:original,file,fresh});
 if(previous&&!resumed&&!fresh)log('The input changed since the last run; starting again.');
 if(!resumed||!fs.existsSync(work)){fs.copyFileSync(file,work);state.steps={};}
 // Resume a failed pagination step after the explicit-zero estimator fix.
 // Never touch a completed/reviewed candidate or rerun completed model steps.
 if(resumed&&state.steps.normalise?.status==='done'&&state.steps.paginate?.status==='failed'&&!['review','content','residual','export'].some(name=>state.steps[name]?.status==='done')){
  const {restoreImportedZeroSpaces}=await import('./normalise.mjs'),repaired=restoreImportedZeroSpaces(original,read(work));
  if(repaired.changes.length){write(work,repaired.project);state.steps.normalise.result.zeroSpaceRepair=repaired.changes;delete state.steps.paginate;write(statePath,state);}
 }
 let imported=null;
 if((original.studio?.flags??[]).some(f=>!f.kind&&f.at)){try{imported=(await import('../bench/history.mjs')).importFinalRevision(original.id,{live:original})?.project??null;}catch{}}
 const ctx={id,work,polishDir,baseDir,original,imported,runDir:runDirOf(original),opts,state,deps,log:message=>{log(message);fs.appendFileSync(path.join(polishDir,'polish.log'),message+'\n');}};
 for(const name of STEPS){
  const done=state.steps[name],wanted=only?only.includes(name):!skip.includes(name);
  if(!wanted){if(done?.status!=='done')state.steps[name]={status:'skipped',reason:'skipped by option'};continue;}
  if(done?.status==='done'){log(`${name}: done earlier (${done.seconds??0} s)`);continue;}
  if(MODEL_STEPS.has(name)&&opts['--no-model']&&name!=='dependencies'){state.steps[name]={status:'skipped',reason:'--no-model'};write(statePath,state);continue;}
  const started=Date.now();ctx.log('== '+name);
  const before=read(work);
  try{
   const result=await impl[name](ctx);
   assertPolishSafety(before,read(work),safetyOptions(ctx));
   state.steps[name]={status:result?.skipped?'skipped':'done',startedAt:new Date(started).toISOString(),seconds:Math.round((Date.now()-started)/1000),result,...(result?.skipped?{reason:result.skipped}:{})};
  }catch(error){
   if(error.message.startsWith('Polish safety guard:'))write(work,before);
   state.steps[name]={status:'failed',startedAt:new Date(started).toISOString(),seconds:Math.round((Date.now()-started)/1000),error:error.message};
   write(statePath,state);
   throw Object.assign(error,{step:name});
  }
  write(statePath,state);
 }
 state.finishedAt=now();write(statePath,state);
 const reportFile=path.join(polishDir,'report.json');
 return {state,work,polishDir,report:fs.existsSync(reportFile)?read(reportFile):null};
}

// Writes the polished copy to the live booklet through the revision-checked path. The input revision is the one the
// run started from; the save fails if the booklet has moved on, or if the export gate refused.
export async function savePolished({state,work,id,root=ROOT,deps={}}){
 if(state.gates?.ok!==true)throw Error('Not saved: the export gate refused ('+(state.gates?.problems??['export gates have not passed']).join('; ')+').');
 const liveFile=path.join(root,'booklets','projects',id+'.json'),before=read(liveFile),after=read(work);
 if(before.revision!==state.input.revision)throw Error(`The booklet changed during the run (r${state.input.revision} to r${before.revision}); run again rather than overwrite the newer edits.`);
 let imported=null;
 if((before.studio?.flags??[]).some(f=>!f.kind&&f.at)){try{imported=(await import('../bench/history.mjs')).importFinalRevision(id,{live:before})?.project??null;}catch{}}
 assertPolishSafety(before,after,{imported});
 const present=new Set(after.sections.flatMap(s=>s.blocks.map(b=>b.id)));
 const changed=[...new Set([...changedBlocks(before,after),...before.sections.flatMap(s=>s.blocks.filter(b=>!present.has(b.id)).map(b=>b.id))])];
 if(!changed.length&&JSON.stringify(before.studio)===JSON.stringify(after.studio)&&JSON.stringify(before.settings)===JSON.stringify(after.settings))return {saved:false,reason:'nothing changed'};
 const liveWork=deps.liveWork??(await import('../sweep/run.mjs')).liveWork,{blocked=[],held=[]}=liveWork(id,{projectOnly:true});
 if(blocked.length||held.length)throw Error('Deferred: '+[...blocked,...held].join('; '));
 const {changedPaths}=await import('../scripts/booklet/feedback-preflight.mjs'),saveRepair=deps.saveRepair??(await import('../scripts/booklet/feedback-closeout.mjs')).saveRepair;
 const strip=p=>({...p,sections:p.sections.map(s=>({...s,blocks:s.blocks.filter(b=>!changed.includes(b.id)).map(b=>b.id)}))});
 // A whole-booklet run declares every path it changed outside the changed blocks, as the optimiser does for its own.
 const allowedPaths=changedPaths(strip(before),strip(after)).filter(pointer=>!['/','/sections','/settings','/studio'].includes(pointer));
 const result=await saveRepair({candidate:after,expectedRevision:state.input.revision,changedBlockIds:changed,allowedPaths,runDir:path.join(root,'.booklet-work','polish-save',id,now().replace(/[:.]/g,'-')),options:{checkpoint:true},saveProject:deps.saveProject??saveThroughStudio});
 return {saved:true,revision:result.project.revision,changed:changed.length,allowedPaths:allowedPaths.length};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--project','--candidate','--out','--work-dir','--skip','--only'],flags:['--save','--no-model','--fresh','--fresh-import','--allow-live','--list','--textbook']});
 if(opts['--list']){console.log(STEPS.join('\n'));return;}
 const source=opts['--candidate']?path.resolve(opts['--candidate']):opts['--project']?path.join(ROOT,'booklets','projects',opts['--project']+'.json'):null;
 if(!source)throw Error('Name a booklet with --project ID or --candidate FILE');
 const live=path.dirname(source)===path.resolve(ROOT,'booklets','projects');
 if(live&&!opts['--allow-live'])throw Error('A live booklet is processed on a copy but read from booklets/projects: pass --allow-live to confirm. Use --candidate for a copy you made.');
 if(opts['--save']&&!live)throw Error('--save writes to a live booklet; this is a candidate file (use --out)');
 for(const name of [...(opts['--skip']?.split(',')??[]),...(opts['--only']?.split(',')??[])])if(!STEPS.includes(name))throw Error('Unknown step '+name+'. Steps: '+STEPS.join(', '));
 const project=read(source),baseDir=path.resolve(opts['--work-dir']??runDirOf(project)??path.join(ROOT,'.booklet-work','polish',project.id));
 const {state,work,report}=await runPolish({file:source,baseDir,opts,skip:opts['--skip']?.split(',')??[],only:opts['--only']?.split(','),fresh:!!opts['--fresh'],log:m=>console.error(m)});
 if(opts['--out']){fs.mkdirSync(path.dirname(path.resolve(opts['--out'])),{recursive:true});fs.copyFileSync(work,path.resolve(opts['--out']));}
 let saved=null;
 if(opts['--save']){
  saved=await savePolished({state,work,id:project.id});
  if(saved.saved){
   // The review records go with the booklet: the closed machine findings and the pedagogy decisions.
   for(const [from,to] of [[path.join(path.dirname(work),'provenance'),'first-pass-review'],[path.join(path.dirname(work),'provenance-pedagogy'),'pedagogy-review']]){
    const file=path.join(from,project.id+'.json');if(fs.existsSync(file)){fs.mkdirSync(path.join(ROOT,'booklets','provenance',to),{recursive:true});fs.copyFileSync(file,path.join(ROOT,'booklets','provenance',to,project.id+'.json'));}
   }
  }
 }
 console.log(JSON.stringify({project:project.id,work:path.relative(ROOT,work),saved,steps:STEPS.map(name=>({step:name,status:state.steps[name]?.status??'-',seconds:state.steps[name]?.seconds??null,note:state.steps[name]?.reason??state.steps[name]?.error??null})),gates:state.gates??null,report:path.relative(ROOT,path.join(path.dirname(work),'report.json'))},null,1));
 if(report)console.log(report.line??reportLine(report));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.step?`polish failed at ${error.step}: ${error.message}`:error.stack??error.message);process.exitCode=1;});
