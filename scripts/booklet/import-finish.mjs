// Coordinate existing author/content/render/repair operations; no extra model-review stage.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {COMPLETION_PROFILE,completionPolicy,assessCompletion,completionHash,importV2} from './import-completion.mjs';
import {validateImport} from './import-validation.mjs';
import {withReviewConfiguration,importReviewConfiguration} from './transcription-settings.mjs';
import {openProject,runContentReview,runLeanExport,runVisualReview,reviewStatus,loadReviewed,saveReviewed,runShadingReview,runImagePreflight,prepareExportVisualPlan,pendingBlocks,reviewableBlocks,contentHash,visualPlan,outstandingFindings} from './lean-review.mjs';
import {blockContentStamps} from './lean-visual-evidence.mjs';
import {overlayVisualEvidence,visualOutcomeReader} from './lean-visual-evidence.mjs';
import {teacherBlocks,polishSafetyIssues,layoutSafetyIssues} from '../../polish/guards.mjs';
import {acceptedSnapshot} from './lean-review.mjs';
import {repairRoute} from '../../polish/repair-routing.mjs';
import {projectReviewHash} from './page-review.mjs';
import {sampleSourceKey,reviewImportSample} from './import-sample-review.mjs';
import {withRunLock,readRunEvents} from './run-observability.mjs';
import {printedPracticeHeadings,applyLayoutPreflightFixes,layoutPreflightBlockers,renderRiskTargets,targetedRenderCheck,structuralPreflightBlockers,readRunConfig,resolveQuestionReferences} from './import-layout-preflight.mjs';
import {effectiveInventory} from './workflow-review.mjs';
import {importRunMetrics} from './import-run-metrics.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');


// A persisted attempt is not a committed export. Readable report presence only
// selects context; the ordinary PDF/hash/checker/visual gates still accept it.
function hasFinishExportReport(entry,projectId){
 try{const report=read(path.join(entry.dir,'report.json')).report?.[projectId];return !!report&&typeof report==='object'&&!Array.isArray(report);}catch{return false;}
}
export function selectFinishExport(exports,projectHash,{projectId,regenerationReason}={}){
 const named=Boolean(regenerationReason?.trim());
 let entry=exports.findLast(e=>e.projectHash===projectHash&&(!e.exportError||!named));
 if(entry&&!hasFinishExportReport(entry,projectId)){
  if(!named)return {blocker:'Interrupted export has no committed report: '+entry.dir+'. Preserve it and supply --regenerate-reason with the diagnosed cause for a fresh attempt.'};
  entry=undefined;
 }
 // A diagnosed cause requests one fresh attempt even when content is unchanged.
 // Its recorded cause then permits ordinary reuse within the round and on resume.
 if(entry&&named&&entry.regenerationReason?.trim()!==regenerationReason.trim())entry=undefined;
 return {entry,previousExportDir:exports.findLast(e=>hasFinishExportReport(e,projectId))?.dir};
}

export async function adoptCompletionProfile(runDir,{adopt=false,direct=false,hasActiveWork,projectId}={}){
 const file=path.join(runDir,'manifest.json'),manifest=read(file);
 if(adopt){
  // Explicit adoption is only allowed at a drained boundary. Never cancel a lease.
  const slots=path.join(runDir,'workflow','worker-slots'),workflow=path.join(runDir,'workflow');
  const events=readRunEvents(runDir).events,finished=new Set(events.filter(e=>e.event==='phase-finished').map(e=>e.id));
  const canonicalBusy=fs.existsSync(slots)&&fs.readdirSync(slots).some(n=>n.endsWith('.json'))||fs.existsSync(workflow)&&fs.readdirSync(workflow).some(n=>n.endsWith('.lock')&&n!=='lean-finish.lock')||events.some(e=>e.event==='phase-started'&&!e.excludedFromActive&&!finished.has(e.id));
  const busy=canonicalBusy||hasActiveWork&&await hasActiveWork();
  if(busy===true||busy?.blocked?.length||busy?.held?.length)throw Error('Adopt the workflow only at a completed, idle boundary');
  manifest.completionProfile=COMPLETION_PROFILE;
  if(direct)manifest.completionRoute='iceem-direct';
  write(file,manifest);
 }
 if(!completionPolicy(manifest).enabled)throw Error('Historical run: use --adopt-streamlined at a completed boundary');
 if(direct&&!completionPolicy(manifest).direct)throw Error('Record --iceem-direct together with explicit adoption');
 return manifest;
}

export async function prepareFinishCandidate({file,runDir,direct=false,examTags=false,log=()=>{}},{normalise,dependencies}={}){
 const before=read(file),protectedIds=teacherBlocks(before);
 if(!direct){
  normalise??=(await import('../../polish/normalise.mjs')).normaliseProject;
  const next=normalise(before,{protectedIds}).project;
  const unsafe=polishSafetyIssues(before,next,{protectedIds});if(unsafe.length)throw Error(unsafe.join('; '));
  write(file,next);
 }
 // Source/content review verifies explicit links; wording discovery is cheap and adds no model call.
 dependencies??=(await import('../../polish/dependencies.mjs')).runDependencies;
 const links=await dependencies({project:read(file),runDir,model:false,log});
 const unsafe=polishSafetyIssues(before,links.project,{protectedIds});if(unsafe.length)throw Error(unsafe.join('; '));
 // Import pipeline v2, Stage 6: exam hand-off tags only (metadata; no content change).
 if(examTags){const {tagExamQuestions}=await import('./import-exam-tags.mjs');const tagged=tagExamQuestions(links.project);if(tagged)log('Exam hand-off tags: '+tagged+' questions');}
 write(file,links.project);
 return {prepared:true};
}

// Measure only after substantive content/scaffold corrections have settled.
export async function layoutFinishCandidate({file,direct=false,log=()=>{}},{paginate,wrapped}={}){
 const before=read(file),protectedIds=teacherBlocks(before);
 // Wrapped maths is measured and repaired before final rendering, using the existing bounded tool.
 wrapped??=(await import('../../checks/wrapped-math.mjs')).runWrappedMath;
 const wrap=await wrapped({project:read(file),file,apply:true,log});
 if(wrap.report?.after?.wrapped)throw Error('Wrapped mathematics remains: '+wrap.report.after.wrapped);
 if(!direct){
  // The Paginate booklet pass of the 11 November pagination principles (import pipeline v2,
  // Decision 8). Since 11 November it is the only Studio pagination action; the Optimise
  // pagination button and paginate/optimise.mjs were retired.
  paginate??=(await import('../../paginate/compose.mjs')).driveCompose;
  const trial=await paginate(read(file),{apply:true,named:true,log});
  if(trial.pageErrors?.length)throw Error('Pagination page errors: '+trial.pageErrors.slice(0,3).join('; '));
  if(trial.project){const unsafe=polishSafetyIssues(before,trial.project,{protectedIds});if(unsafe.length)throw Error(unsafe.join('; '));write(file,trial.project);}
 }
 return {laidOut:true};
}

export async function repairFinishFindings({file,runDir,workDir,exportDir,concurrency=3,log=()=>{}},{layoutRepair,contentRepair}={}){
 const rv=await import('../../first-pass/review.mjs'),project=read(file),index=rv.bookletIndex(project),provenanceDir=path.join(workDir,'provenance');
 const record=rv.loadProvenance(rv.provenanceFile(project.id,{provenanceDir}),project);
 const report=read(path.join(exportDir,'report.json')).report[project.id],state=loadReviewed(path.join(runDir,'lean-review'));
 const manifestFile=path.join(runDir,'manifest.json'),manifest=fs.existsSync(manifestFile)?read(manifestFile):{},policy=completionPolicy(manifest);
 const planFile=path.join(exportDir,'visual-plan.json');
 const pages=policy.enabled?overlayVisualEvidence(visualPlan({project,report,state,manifest}),fs.existsSync(planFile)?read(planFile):null):report;
 const outcome=visualOutcomeReader(state),findings=[];
 for(const [edition,entry] of Object.entries(pages))for(const page of entry.pending??entry.pageHashes??[]){
  const row=policy.enabled?outcome(edition,page):state.pages[edition+':'+page.hash];if(row?.outcome!=='needs-change')continue;
  const ids=(page.blocks??[]).map(id=>typeof id==='string'?id:id.id).filter(id=>index.blocks.has(id));
  const details=row.details?.length?row.details:[{area:'alignment',targets:ids,comment:row.finding}];
  for(const [n,detail]of details.entries()){
   const targets=(detail.targets??ids).map(id=>{const blockId=index.blocks.has(id)?id:index.owners.get(id);return blockId?{id,blockId,hash:rv.blockHash(project,index,blockId)}:null;}).filter(Boolean);
   if(!targets.length)continue;
   const finding={id:'finish-'+hash({edition,page:page.hash,n}).slice(0,16),edition,page:page.page,area:detail.area??'alignment',scope:'local',comment:detail.comment??row.finding,repairKind:detail.repairKind,sourceRepair:row.reviewProfile==='source-layout-v2',targets,state:'pending'};
   finding.repairRoute=repairRoute(finding);findings.push(finding);
  }
 }
 record.findings=[...(record.findings??[]).filter(f=>!findings.some(n=>n.id===f.id)),...findings];
 rv.saveProvenance(rv.provenanceFile(project.id,{provenanceDir}),record);
 layoutRepair??=(await import('../../first-pass/apply.mjs')).runApply;
 const layoutIds=findings.filter(f=>repairRoute(f)==='layout').map(f=>f.id);
 const safe=next=>polishSafetyIssues(project,next,{protectedIds:teacherBlocks(project)});
 if(layoutIds.length)await layoutRepair({projectFile:file,provenanceDir,runDir:path.join(workDir,'apply'),findingIds:layoutIds,workDir,allowSubstantiveGrowth:true,retry:false,safetyGuard:safe,concurrency,log});
 contentRepair??=(await import('../../polish/content.mjs')).runContentRepair;
 await contentRepair({projectFile:file,provenanceDir,polishDir:workDir,runDir,exportDir,safetyGuard:safe,concurrency,log});
 return {file:rv.provenanceFile(project.id,{provenanceDir}),findings:findings.length};
}

// Only publication may reconcile a false layout edge after actual independent
// content review. Layout trials keep their stricter immutable-input guards.
export function finishPublishSafetyIssues(original,current,reviewed){
 const reference=structuredClone(original),protectedIds=teacherBlocks(original),blocks=p=>(p.sections??[]).flatMap(s=>s.blocks??[]),next=new Map(blocks(current).map(b=>[b.id,b])),extra=[];
 for(const old of blocks(reference)){
  const block=next.get(old.id),prior=old.flow?.dependsOn,remaining=block?.flow?.dependsOn,row=reviewed?.questions?.[old.id],accepted=row?.acceptedVersion;
  if(protectedIds.has(old.id)||!Array.isArray(prior)||!Array.isArray(remaining)||remaining.length>=prior.length||!isDeepStrictEqual(prior.filter(id=>remaining.includes(id)),remaining))continue;
  if(row?.outcome!=='passed'||row.hash!==contentHash(block)||accepted?.outcome!=='passed'||accepted.revoked||accepted.hash!==row.hash||!accepted.snapshot||contentHash(accepted.snapshot)!==row.hash||!isDeepStrictEqual(accepted.snapshot,acceptedSnapshot(block)))continue;
  // Change only the comparison copy, never the guarded input or review proof.
  old.flow.dependsOn=structuredClone(remaining);
  extra.push(...layoutSafetyIssues(old,block));
 }
 return [...new Set([...polishSafetyIssues(reference,current,{reference:original,protectedIds,spacing:false}),...extra])];
}

// Keyed as the lean table keys accepted diagrams (sha256 of the code).
const codeKey=code=>createHash('sha256').update(code).digest('hex');
// Native TikZ in the candidate, by node id. Accepted diagrams in the lean table are skipped.
export function candidateTikz(project,accepted={}){
 const rows=[],walk=node=>{if(Array.isArray(node))return node.forEach(walk);if(!node||typeof node!=='object')return;
  if(node.format==='tikz'&&typeof node.code==='string'&&node.id&&accepted[codeKey(node.code)]?.status!=='accepted')rows.push({id:String(node.id),code:node.code});
  for(const value of Object.values(node))walk(value);};
 walk(project.sections??[]);return rows;
}
// Studio's own label inspection (pedagogy/figure-label-check.mjs) on the candidate's
// unaccepted diagrams. Checked code is remembered, so a resume repeats nothing. If
// Studio cannot be reached the check is skipped with a log line, never a blocker.
// With place (simplification plan item 1), colliding diagrams go through deterministic label
// placement (diagram-label-placer.mjs) and the placed code replaces the authored code in the
// candidate, recorded in RUN/lean-review/label-placement.jsonl; only what placement cannot
// clear is reported. It runs before content review, so the reviewer sees the placed code.
export async function diagramLabelCheck({file,runDir,checked={},log=()=>{},check,place=false,placer}={}){
 const first=await labelCheckOnce({file,runDir,checked,log,check});
 if(!place||first.skipped||!first.collisions.length)return first;
 const project=read(file),rows=candidateTikz(project,loadReviewed(path.join(runDir,'lean-review')).diagrams??{}),failing=new Set(first.collisions.map(row=>row.id));
 let placed;
 try{placed=await(placer??(async rows=>(await import('./diagram-label-placer.mjs')).placeDiagramLabels(rows,{log})))(rows.filter(row=>failing.has(row.id)));}
 catch(error){log('Label placement skipped: '+error.message);return first;}
 const changed=new Map(placed.results.filter(row=>row.changed).map(row=>[row.id,row]));
 if(!changed.size)return {...first,placement:{tried:failing.size,changed:0,seconds:placed.seconds}};
 const walk=node=>{if(Array.isArray(node))return node.forEach(walk);if(!node||typeof node!=='object')return;
  if(node.format==='tikz'&&changed.has(node.id)&&typeof node.code==='string')node.code=changed.get(node.id).code;
  for(const value of Object.values(node))walk(value);};
 walk(project.sections??[]);write(file,project);
 const record=path.join(runDir,'lean-review','label-placement.jsonl');fs.mkdirSync(path.dirname(record),{recursive:true});
 fs.appendFileSync(record,[...changed.values()].map(row=>JSON.stringify({at:new Date().toISOString(),diagramId:row.id,before:row.before,after:row.after,moved:row.moved,skipped:row.skipped})).join('\n')+'\n');
 log('Label placement: '+changed.size+' of '+failing.size+' colliding diagrams placed');
 const second=await labelCheckOnce({file,runDir,checked:first.checked,log,check});
 return {...second,placement:{tried:failing.size,changed:changed.size,seconds:placed.seconds}};
}
async function labelCheckOnce({file,runDir,checked={},log=()=>{},check}={}){
 const project=read(file),reviewed=loadReviewed(path.join(runDir,'lean-review')),rows=candidateTikz(project,reviewed.diagrams??{});
 const pending=rows.filter(row=>!checked[codeKey(row.code)]),next={...checked},collisions=[];
 for(const row of rows){const prior=checked[codeKey(row.code)];if(prior?.issues?.length)collisions.push({id:row.id,issues:prior.issues});}
 if(!pending.length)return {checked:next,collisions};
 // Studio serves public/ from its own checkout (MATHSMAP_STUDIO_ROOT when this runs from a worktree).
 const root=process.env.MATHSMAP_STUDIO_ROOT?path.resolve(process.env.MATHSMAP_STUDIO_ROOT):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),input=path.join(root,'public','.audit-input','import-labels-'+project.id+'.json');
 fs.mkdirSync(path.dirname(input),{recursive:true});fs.writeFileSync(input,JSON.stringify(pending.map(row=>({skillId:project.id,source:project.id,field:row.id,code:row.code}))));
 let found;
 try{found=await(check??(async file=>(await import('../../pedagogy/figure-label-check.mjs')).labelCollisions(file,{publicRoot:path.join(root,'public'),publishTo:path.join(root,'.booklet-work','render-cache'),log})))(input);}
 catch(error){log('Diagram label check skipped (Studio unavailable): '+error.message);return {checked,collisions,skipped:error.message};}
 finally{fs.rmSync(input,{force:true});}
 for(const row of pending){const issues=found?.[row.id]?.issues??[];next[codeKey(row.code)]={issues};if(issues.length)collisions.push({id:row.id,issues});}
 return {checked:next,collisions};
}
// Every review call finish makes, including the first-pass and polish repair checks
// it runs, uses the import configuration (import pipeline v2, Decision 12).
export async function finishImport(options,deps={}){
 return withReviewConfiguration(importReviewConfiguration(),()=>finishImportScoped(options,deps));
}
async function finishImportScoped(options,deps={}){
 return withRunLock(options.runDir,'lean-finish',()=>finishCandidate(options,deps),{timeoutMs:60000});
}
async function finishCandidate({runDir,projectFile,projectId,out,concurrency=3,runner,visibilityReviews,adopt=false,direct=false,saveProgress=false,sampleDir,regenerationReason,oversize:oversizeOption,log=()=>{}},deps={}){
 const manifest=await(deps.adopt??adoptCompletionProfile)(runDir,{adopt,direct,hasActiveWork:deps.hasActiveWork,projectId:read(projectFile).id}),policy=completionPolicy(manifest);
 const handle=openProject(projectFile),original=structuredClone(handle.project);projectId??=original.id;
 if(sampleDir)await(deps.sample??reviewImportSample)({runDir,projectFile,sampleDir,runner});
 const sample=loadReviewed(path.join(runDir,'lean-review')).workflow?.[projectId]?.sample;
 if(!sample?.accepted||sample.sourceKey!==sampleSourceKey(manifest))return {deliverable:false,completion:assessCompletion({required:['early layout sample'],completed:[]}),projectFile};
 if(projectId!==original.id)throw Error('Project ID does not match the candidate');
 const dir=path.join(runDir,'lean-review'),workDir=path.join(dir,'finish'),file=path.join(workDir,'candidate.json'),stateFile=path.join(workDir,'state.json');
 let state=fs.existsSync(stateFile)?read(stateFile):null;
 if(state&&state.inputHash!==hash(original))throw Error('Finish input changed: preserve this run and reconcile the newer revision before resuming');
 if(!state){state={inputHash:hash(original),steps:{},exports:[]};write(file,original);write(stateFile,state);}
 const persist=()=>write(stateFile,state),errors=[];
 // A named prompt-size exemption is kept with the finish state, so every later attempt and
 // re-review uses it without the coordinator running content by hand (simplification plan).
 if(oversizeOption?.reason?.trim()){state.steps.oversize={reason:oversizeOption.reason.trim(),blocks:[...new Set(oversizeOption.blocks??[])]};persist();}
 const oversize=state.steps.oversize;
 const publish=async()=>{
  const next=read(file),unsafe=finishPublishSafetyIssues(original,next,loadReviewed(dir));if(unsafe.length)throw Error(unsafe.join('; '));
  Object.keys(handle.project).forEach(key=>delete handle.project[key]);Object.assign(handle.project,next);
  const saved=await handle.save();
  if(completionHash(saved)!==completionHash(next))throw Error('Saved project was normalised differently; its current content needs validation before completion');
  state.inputHash=hash(handle.project);write(file,handle.project);persist();
  return true;
 };
 const incomplete=async(completion,extra={})=>{
  const saved=saveProgress?await publish():false;state.completion=completion;persist();
  return {projectFile:file,deliverable:false,completion,saved,...extra};
 };
 const stamp=()=>{const reviewed=loadReviewed(dir);reviewed.workflow??={};reviewed.workflow[projectId]={...reviewed.workflow[projectId],profile:COMPLETION_PROFILE,preparedHash:completionHash(read(file)),projectHash:completionHash(read(file)),errors};saveReviewed(dir,reviewed);};
 if(!state.steps.prepared){
  await(deps.prepare??prepareFinishCandidate)({file,runDir,direct:policy.direct,examTags:importV2(manifest),log},deps.prepareDeps);
  // Import v2 layout preflight fixes run once, before content review and rating, so they make nothing stale.
  if(importV2(manifest)&&!policy.direct)state.steps.layoutPreflight=(deps.preflightFixes??applyFinishPreflightFixes)({file,runDir,manifest,log});
  state.steps.prepared=true;persist();
 }
 // Import pipeline v2 (inefficiency 5): label collisions in new TikZ are found before any review call.
 if(importV2(manifest)&&!policy.direct){
  // Question references the script can decide are linked and recorded first (on every run, so a
  // reviewer edit that breaks a record is re-resolved); the rest are blockers below.
  const references=resolveQuestionReferences(read(file));
  if(references.changes.length){
   write(file,references.project);
   const record=path.join(workDir,'reference-fixes.jsonl');fs.mkdirSync(workDir,{recursive:true});
   fs.appendFileSync(record,references.changes.map(change=>JSON.stringify({at:new Date().toISOString(),...change})).join('\n')+'\n');
   log('Question references recorded as follow-ups: '+references.changes.map(c=>c.blockId).join(', '));
  }
  // Labels first: placement edits diagram code, and the evidence and prompt checks below see the result.
  const labels=await(deps.labels??diagramLabelCheck)({file,runDir,checked:state.steps.diagramLabels,log,place:true});
  state.steps.diagramLabels=labels.checked;persist();
  // Every pre-review blocker at once (simplification plan item 3): config, structure (C8, C9,
  // question references), evidence, prompt size and the labels placement could not clear.
  // No content review call starts while any is reported. finish --check lists the same and more.
  const {preReviewBlockers}=await import('./import-finish-check.mjs');
  const pre=(deps.preReview??preReviewBlockers)({runDir,project:read(file),projectFile:file,manifest,config:readRunConfig(runDir),stages:['config','structure','evidence','prompt-size'],oversize});
  const blockers=[...pre.blockers.map(row=>row.message),...labels.collisions.map(row=>'Diagram label collision in '+row.id+' (placement could not clear it): '+row.issues.join('; '))];
  if(blockers.length)return incomplete(assessCompletion({errors:blockers}),{preReview:pre.blockers,diagramLabels:labels});
 }
 const settleLayout=async()=>{
  const current=projectReviewHash(read(file));
  if(state.steps.layoutHash===current)return;
  await(deps.layout??layoutFinishCandidate)({file,runDir,direct:policy.direct,log},deps.layoutDeps);
  state.steps.layoutHash=projectReviewHash(read(file));persist();
 };
 const currentContentCompletion=(errors=[])=>{
  const reviewed=loadReviewed(dir),candidate=read(file);
  return assessCompletion({pending:pendingBlocks(candidate,reviewed).length,failed:reviewableBlocks(candidate).filter(({block})=>reviewed.questions[block.id]?.hash===contentHash(block)&&reviewed.questions[block.id]?.outcome==='failed').map(({block})=>block.id),errors});
 };
 const content=await(deps.content??runContentReview)({runDir,projectFile:file,concurrency,oversize,runner});
 const contentCompletion=currentContentCompletion(content.errors??[]);
 if(!contentCompletion.ready)return incomplete(contentCompletion);
 let validation=(deps.validate??validateImport)(read(file));
 if(!validation.ok)return incomplete(assessCompletion({errors:validation.blockers}),{validation});
 await settleLayout();
 validation=(deps.validate??validateImport)(read(file));
 if(!validation.ok)return incomplete(assessCompletion({errors:validation.blockers}),{validation});
 stamp();
 const initialExport=selectFinishExport(state.exports,completionHash(read(file)),{projectId,regenerationReason});
 if(initialExport.blocker)return incomplete(assessCompletion({exportProblems:[initialExport.blocker]}));
 const images=await(deps.images??runImagePreflight)({runDir,projectFile:file,runner});errors.push(...(images.errors??[]));
 // At most final + one batched-repair export. A failed/unchanged finding stays visible on resume.
 for(let round=0;round<2;round++){
  // A measured tool must not accidentally export content whose acceptance it invalidated.
  const accepted=currentContentCompletion();if(!accepted.ready)return incomplete(accepted);
  const currentHash=completionHash(read(file)),selection=selectFinishExport(state.exports,currentHash,{projectId,regenerationReason});
  if(selection.blocker)return incomplete(assessCompletion({exportProblems:[selection.blocker]}));
  let entry=selection.entry;
  if(!entry){
   if(state.exports.length>=2&&!regenerationReason?.trim()){errors.push('Two finish exports used; diagnose remaining findings and supply a named regeneration cause');break;}
   // Import v2 (12 November 2026 pilot review): one batched repair per export.
   // Every block named by an outstanding visual finding of the last checked
   // export must have changed before another export is printed.
   const stamps=importV2(manifest)?blockContentStamps(read(file)):null;
   if(stamps){
    const unrepaired=unrepairedVisualFindings({state,projectId,stamps,dir});
    const last=state.exports.findLast(entry=>hasFinishExportReport(entry,projectId));
    const runtime=last&&path.join(last.dir,'runtime-manifest.json');
    let rendererChanged=false;
    if(unrepaired.length&&runtime&&fs.existsSync(runtime)){
      const {snapshotDifferences,printRelevantChanges}=await import('./import-verification-runtime.mjs');
      const frozen=read(runtime);
      rendererChanged=printRelevantChanges(process.cwd(),frozen.files,snapshotDifferences(process.cwd(),frozen.files))
        .some(file=>/^(?:src|public)\//.test(file));
    }
    if(unrepaired.length&&!rendererChanged){errors.push('Repair every outstanding visual finding in one batch before another export; unchanged since export '+state.exports.length+': '+unrepaired.map(row=>row.edition+' p'+row.page+' ('+row.blocks.join(', ')+')').join('; '));break;}
    // Layout preflight before printing: recorded cross-reference decisions, then a
    // targeted render of risky and repaired blocks (seconds, not a five-edition export).
    if(!policy.direct){
     const gate=await(deps.preRender??finishPreRenderGate)({file,projectId,state,stamps,workDir,visibilityReviews,log});persist();
     if(gate.errors.length)return incomplete(assessCompletion({errors:gate.errors}),{layoutPreflight:gate});
    }
    if(state.exports.length>=FINISH_EXPORT_BUDGET)log('Finish export '+(state.exports.length+1)+' exceeds the budget of '+FINISH_EXPORT_BUDGET+': '+regenerationReason);
   }
   const exportDir=path.resolve(out??path.join(runDir,'streamlined-exports'),String(state.exports.length+1));
   entry={dir:exportDir,projectHash:currentHash,...(regenerationReason?{regenerationReason}:{}),...(stamps?{blockStamps:stamps}:{}),...(stamps&&state.exports.length>=FINISH_EXPORT_BUDGET?{overBudget:true}:{})};state.exports.push(entry);persist();
   try{await(deps.export??runLeanExport)({runDir,projectId,projectFile:file,out:exportDir,visibilityReviews,regenerationReason,previousExportDir:selection.previousExportDir});}
   catch(error){
    entry.exportError=error.message;persist();
    try{await(deps.prepareVisual??prepareExportVisualPlan)({runDir,projectId,projectFile:file,out:exportDir,previousExportDir:selection.previousExportDir});}
    catch{errors.push(error.message);break;}
   }
  }
  if(!hasFinishExportReport(entry,projectId)){errors.push('Export did not commit a readable report: '+entry.dir);break;}
  if(entry.exportError&&state.steps.repaired)break;
  if(!entry.exportError){const shading=await(deps.shading??runShadingReview)({runDir,projectFile:file,exportDir:entry.dir,concurrency,runner});errors.push(...(shading.errors??[]));}
  await(deps.visual??runVisualReview)({runDir,projectFile:file,exportDir:entry.dir,concurrency,runner});
  const status=await(deps.status??finishStatus)({runDir,projectFile:file,exportDir:entry.dir});
  if(status.deliverable||round===1||state.steps.repaired)break;
  const before=hash(read(file));
  await(deps.repair??repairFinishFindings)({file,runDir,workDir,exportDir:entry.dir,concurrency,log});
  state.steps.repaired=true;persist();
  if(before===hash(read(file)))break;
   const repairedContent=await(deps.content??runContentReview)({runDir,projectFile:file,concurrency,oversize,runner});
   const repairedCompletion=currentContentCompletion(repairedContent.errors??[]);
   if(!repairedCompletion.ready)return incomplete(repairedCompletion);
   validation=(deps.validate??validateImport)(read(file));if(!validation.ok){errors.push(...validation.blockers);break;}
   await settleLayout();
   validation=(deps.validate??validateImport)(read(file));if(!validation.ok){errors.push(...validation.blockers);break;}stamp();
 }
 stamp();const entry=state.exports.at(-1);
 const status=entry&&hasFinishExportReport(entry,projectId)?await(deps.status??finishStatus)({runDir,projectFile:file,exportDir:entry.dir}):{deliverable:false,completion:assessCompletion({exportProblems:['No checked final export'],errors})};
 // Loop refusals (an unrepaired finding, the export cap) are blockers too; report them instead of the last export's status alone.
 if(!status.deliverable&&errors.length&&status.completion)status.completion={...status.completion,ready:false,blockers:[...new Set([...(status.completion.blockers??[]),...errors])]};
 if(entry&&state.steps.sheets!==entry.projectHash){
  const reportFile=path.join(entry.dir,'report.json');
  const pdf=fs.existsSync(reportFile)?read(reportFile).report?.[projectId]?.student?.pdf?.path:null;
  if(pdf&&fs.existsSync(pdf)){
   const sheets=deps.sheets??(await import('../../polish/sheets.mjs')).makeSheets;
   await sheets({pdf,out:path.join(entry.dir,'sheets'),title:projectId,log});state.steps.sheets=entry.projectHash;persist();
  }
 }
 // Only the checked current candidate can be published. Progress saves remain explicitly incomplete.
 if(status.deliverable||saveProgress){await publish();stamp();}
 // Import pipeline v2, Stage 11: hand-off records for the audit and the bank (deliverable only).
 if(status.deliverable&&importV2(manifest)){
  const {buildImportHandoff,writeImportHandoff}=await import('./import-handoff.mjs');
  const correctionFile=path.join(dir,'corrections.jsonl'),corrections=fs.existsSync(correctionFile)?fs.readFileSync(correctionFile,'utf8').split('\n').filter(Boolean).map(line=>{try{return JSON.parse(line);}catch{return null;}}).filter(Boolean):[];
  const handoff=buildImportHandoff({project:read(file),reviewed:loadReviewed(dir),corrections,currentHash:contentHash,runId:path.basename(runDir),configuration:importReviewConfiguration(),track:manifest.track??'booklet'});
  (deps.writeHandoff??writeImportHandoff)(handoff,{root:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')});
 }
 state.completion=status.completion;persist();
 // Completion-report metrics: every model call (finish's own included), time, exports and visual evidence.
 if(importV2(manifest))try{write(path.join(workDir,'metrics.json'),(deps.metrics??importRunMetrics)(runDir));}catch(error){log('Run metrics not written: '+error.message);}
 return {...status,projectFile:file,exports:state.exports.map(e=>e.dir),exportBudget:{used:state.exports.length,budget:FINISH_EXPORT_BUDGET},saved:status.deliverable||saveProgress,validation};
}
const FINISH_EXPORT_BUDGET=3;
// Import v2 layout preflight (docs/booklet-import-v2-ch01-efficiency.md). Headings
// come only from printed group headers in the accepted source inventory.
export function applyFinishPreflightFixes({file,runDir,manifest,log=()=>{},inventories}){
 inventories??=(manifest.selectedPages??[]).map(page=>effectiveInventory(runDir,page)).filter(Boolean);
 const {project,changes}=applyLayoutPreflightFixes(read(file),{headings:printedPracticeHeadings(inventories)});
 if(changes.length)write(file,project);
 write(path.join(runDir,'lean-review','finish','preflight-fixes.json'),{at:new Date().toISOString(),changes});
 const counts={};for(const change of changes)counts[change.check]=(counts[change.check]??0)+1;
 log('Layout preflight fixes: '+(Object.entries(counts).map(([k,n])=>k+' '+n).join(', ')||'none'));
 return {counts};
}
export async function finishPreRenderGate({file,projectId,state,stamps,workDir,visibilityReviews,log=()=>{},render=targetedRenderCheck}){
 const project=read(file),key=completionHash(project);
 const blockers=layoutPreflightBlockers(project).map(row=>row.message);
 if(blockers.length)return {errors:blockers};
 state.steps.preRender??={};
 if(state.steps.preRender[key])return state.steps.preRender[key];
 const last=state.exports.findLast(entry=>entry.blockStamps);
 const changed=last&&stamps?Object.keys(stamps).filter(id=>last.blockStamps[id]!==stamps[id]):[];
 // Always render at least one block: the DOM pass then checks every page of each edition.
 const targets=renderRiskTargets(project,{changed});if(!targets.length){const first=(project.sections??[]).find(s=>s.phase==='practice'&&s.blocks?.length)?.blocks[0]?.id;if(first)targets.push(first);}
 const result=await render({file,projectId,targets,out:path.join(workDir,'preflight',String(state.exports.length+1)),visibilityReviews,log});
 const errors=result.issues.map(issue=>'Targeted render, '+issue.edition+' p'+issue.page+': '+issue.kind+(issue.targetId?' '+issue.targetId:'')+(issue.excessMm?' ('+issue.excessMm.toFixed(1)+' mm)':''));
 // Fail closed (simplification plan item 3): an edition that did not render is not a pass.
 for(const row of result.skipped)errors.push('Targeted render did not run for '+row.edition+': '+row.reason+' (Studio on 5173 must be running)');
 const outcome={errors,targets:result.targets.length,changed:changed.length,seconds:result.seconds,skipped:result.skipped.length};
 // Only a clean, complete check is remembered; a failing or skipped one reruns on resume.
 if(!errors.length&&!result.skipped.length)state.steps.preRender[key]=outcome;
 return outcome;
}
// Outstanding needs-change pages of the last export with a readable report whose
// blocks all still carry the stamps recorded when that export was made.
export function unrepairedVisualFindings({state,projectId,stamps,dir}){
 const last=state.exports.findLast(entry=>hasFinishExportReport(entry,projectId));
 if(!last?.blockStamps)return [];
 // The plan rows carry the raster proof the outcome reader needs.
 const planFile=path.join(last.dir,'visual-plan.json');if(!fs.existsSync(planFile))return [];
 return outstandingFindings(loadReviewed(dir),read(planFile)).filter(row=>row.blocks.length&&row.blocks.every(id=>{const key=typeof id==='string'?id:id.id;return last.blockStamps[key]!==undefined&&last.blockStamps[key]===stamps[key];})).map(row=>({...row,blocks:row.blocks.map(id=>typeof id==='string'?id:id.id)}));
}
async function finishStatus(options){
 // Content acceptance may finish after immutable PDFs were checked. Recompute
 // only the deterministic coverage report against the exact exported project;
 // later tool fixes do not require printing those same pages again.
 const {runDir,projectFile,exportDir}=options,project=read(projectFile);
 let artifactError;
 try{(await import('./import-verification-runtime.mjs')).verifyCompletedFrozenExport({out:exportDir,projectId:project.id,projectFile,artifactReview:true});}catch(error){artifactError=error.message;}
 if(!artifactError){
  const {inspectContentCoverage}=await import('../../src/lib/booklet-content-verification.js');
  const {contentAssetSignatures}=await import('./verification-cache.mjs');
  const coverage=await inspectContentCoverage(project,{assetSignatures:await contentAssetSignatures(project),reviewedQuestions:loadReviewed(path.join(runDir,'lean-review')).questions});
  write(path.join(exportDir,project.id+'-readiness.json'),coverage);
 }
 const status=reviewStatus({...options,projectHash:(await import('./page-review.mjs')).projectReviewHash});
 if(artifactError){status.deliverable=false;status.completion=assessCompletion({errors:[...(status.completion?.blockers??[]),artifactError]});}
 return status;
}
