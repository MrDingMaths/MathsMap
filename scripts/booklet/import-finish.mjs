// Coordinate existing author/content/render/repair operations; no extra model-review stage.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {COMPLETION_PROFILE,completionPolicy,assessCompletion,completionHash} from './import-completion.mjs';
import {validateImport} from './import-validation.mjs';
import {openProject,runContentReview,runLeanExport,runVisualReview,reviewStatus,loadReviewed,saveReviewed,runShadingReview,runImagePreflight,prepareExportVisualPlan,pendingBlocks,reviewableBlocks,contentHash,visualPlan} from './lean-review.mjs';
import {overlayVisualEvidence,visualOutcomeReader} from './lean-visual-evidence.mjs';
import {teacherBlocks,polishSafetyIssues,layoutSafetyIssues} from '../../polish/guards.mjs';
import {acceptedSnapshot} from './lean-review.mjs';
import {repairRoute} from '../../polish/repair-routing.mjs';
import {projectReviewHash} from './page-review.mjs';
import {sampleSourceKey,reviewImportSample} from './import-sample-review.mjs';
import {withRunLock,readRunEvents} from './run-observability.mjs';

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

export async function prepareFinishCandidate({file,runDir,direct=false,log=()=>{}},{normalise,dependencies}={}){
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
  paginate??=(await import('../../paginate/optimise.mjs')).driveStudio;
  const trial=await paginate(read(file),{apply:true,named:true,log});
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

export async function finishImport(options,deps={}){
 return withRunLock(options.runDir,'lean-finish',()=>finishCandidate(options,deps),{timeoutMs:60000});
}
async function finishCandidate({runDir,projectFile,projectId,out,concurrency=3,runner,visibilityReviews,adopt=false,direct=false,saveProgress=false,sampleDir,regenerationReason,log=()=>{}},deps={}){
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
 if(!state.steps.prepared){await(deps.prepare??prepareFinishCandidate)({file,runDir,direct:policy.direct,log},deps.prepareDeps);state.steps.prepared=true;persist();}
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
 const content=await(deps.content??runContentReview)({runDir,projectFile:file,concurrency,runner});
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
   const exportDir=path.resolve(out??path.join(workDir,'exports'),String(state.exports.length+1));
   entry={dir:exportDir,projectHash:currentHash,...(regenerationReason?{regenerationReason}:{})};state.exports.push(entry);persist();
   try{await(deps.export??runLeanExport)({runDir,projectId,projectFile:file,out:exportDir,visibilityReviews,regenerationReason,previousExportDir:selection.previousExportDir});}
   catch(error){
    entry.exportError=error.message;persist();
    try{await(deps.prepareVisual??prepareExportVisualPlan)({runDir,projectId,projectFile:file,out:exportDir,previousExportDir:selection.previousExportDir});}
    catch{errors.push(error.message);break;}
   }
  }
  if(!hasFinishExportReport(entry,projectId)){errors.push('Export did not commit a readable report: '+entry.dir);break;}
  if(!entry.exportError){const shading=await(deps.shading??runShadingReview)({runDir,projectFile:file,exportDir:entry.dir,concurrency,runner});errors.push(...(shading.errors??[]));}
  await(deps.visual??runVisualReview)({runDir,projectFile:file,exportDir:entry.dir,concurrency,runner});
  const status=await(deps.status??finishStatus)({runDir,projectFile:file,exportDir:entry.dir});
  if(status.deliverable||round===1||state.steps.repaired)break;
  const before=hash(read(file));
  await(deps.repair??repairFinishFindings)({file,runDir,workDir,exportDir:entry.dir,concurrency,log});
  state.steps.repaired=true;persist();
  if(before===hash(read(file)))break;
   const repairedContent=await(deps.content??runContentReview)({runDir,projectFile:file,concurrency,runner});
   const repairedCompletion=currentContentCompletion(repairedContent.errors??[]);
   if(!repairedCompletion.ready)return incomplete(repairedCompletion);
   validation=(deps.validate??validateImport)(read(file));if(!validation.ok){errors.push(...validation.blockers);break;}
   await settleLayout();
   validation=(deps.validate??validateImport)(read(file));if(!validation.ok){errors.push(...validation.blockers);break;}stamp();
 }
 stamp();const entry=state.exports.at(-1);
 const status=entry&&hasFinishExportReport(entry,projectId)?await(deps.status??finishStatus)({runDir,projectFile:file,exportDir:entry.dir}):{deliverable:false,completion:assessCompletion({exportProblems:['No checked final export'],errors})};
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
 state.completion=status.completion;persist();
 return {...status,projectFile:file,exports:state.exports.map(e=>e.dir),saved:status.deliverable||saveProgress,validation};
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
