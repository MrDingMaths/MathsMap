import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {dependencyStatus,drainDependencies} from './dependency-runner.mjs';
import {buildRunReceipt,summarizeRunReceipt,linkRunSession,recordWeeklyUsage,recordExportReuse,beginHumanWait,endHumanWait} from './run-observability.mjs';
import {workflowPreflight} from './workflow-preflight.mjs';
import {liveWorkflow,loadWorkflow,updateWorkflow,approveCoverage,acceptFinalReview} from './workflow-review.mjs';
import {verificationStatus,verificationDependencies,recordVerification} from './import-verification.mjs';
import {representativePlan,checkRepresentativePlan,targetedRepairContext} from './efficiency-tools.mjs';
import {attemptRepairContext,repairAttempt} from './local-attempt-repair.mjs';
import {printWorkflowOutput} from './workflow-output.mjs';
import {importCloseout} from './import-closeout.mjs';
import {importPreFinal} from './import-pre-final.mjs';
import {recordInventoryReuse} from './inventory-reuse.mjs';
const jsonFile=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const boundedCommands=['next','prepare-stage','run-stage','record-stage','cancel-stage','feedback-scope','drive'];
const accountingCommands=['link-session','weekly-usage','export-observation','wait-start','wait-end'];
export async function main(args=process.argv.slice(2)){
 if(args[0]==='--help'){
  console.log('run-workflow next|drive|prepare-stage|run-stage|record-stage|cancel-stage|feedback-scope|status|drain|preflight|representatives|check-representatives|approve-coverage|verification|record-verification|repair-context|attempt-context|repair-attempt|record-inventory-reuse|pre-final|closeout|receipt|link-session|weekly-usage|export-observation|wait-start|wait-end --run-id RUN [--input JSON --out JSON --full]. Drive requires --budget BUDGET.json and accepts --concurrency. Bounded stages use --job ID and optional --project-file/--config. Accounting and bounded commands also accept --run-dir. Pre-final uses --input PROJECT.json without a run. Status/drain and attempt commands require --config. Bulk drain requires --plan and current representative inspections. Reviewed inventory reuse is explicit: record-inventory-reuse requires --input, --config and --inventory-config; scheduling adds --inventory-reuse RECEIPT.json. --inventory-config accepts an original config or a mathsmap-inventory-config-selection-v1 file mapping pages to immutable config references. repair-attempt requires --attempt. Receipt supports --run-dir and legacy --summary. See docs/booklet-workflow-controller.md and docs/booklet-bounded-workflow.md.');return;
 }
 const command=args[0],flags={};
 for(let i=1;i<args.length;i++){
  const key=args[i];if(['--retry','--representative','--summary','--full'].includes(key)){flags[key]=true;continue;}
  if(!['--run-id','--run-dir','--pages','--config','--inventory-config','--inventory-reuse','--concurrency','--base','--out','--retry-reason','--input','--attempt','--plan','--regenerate-reason','--job','--project-file','--budget'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+key);flags[key]=args[++i];
 }
 if(command==='pre-final'){
  if(!flags['--input'])throw Error('Pre-final requires --input PROJECT.json');
  const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')),result=importPreFinal(read(flags['--input']));
  printWorkflowOutput(result,{out:flags['--out'],full:!!flags['--full']});if(!result.ok)process.exitCode=1;return result;
 }
 if(!flags['--run-id']&&!(flags['--run-dir']&&['receipt','record-inventory-reuse',...accountingCommands,...boundedCommands].includes(command)))throw Error('Supply --run-id, or --run-dir for receipt, accounting and bounded stage commands');
 if(flags['--run-id']&&flags['--run-dir'])throw Error('Choose either --run-id or --run-dir');
 const loaded=flags['--run-id']?loadRun(flags['--run-id']):{runDir:path.resolve(flags['--run-dir'])};let result;
 if(!loaded.manifest&&fs.existsSync(path.join(loaded.runDir,'manifest.json')))loaded.manifest=jsonFile(path.join(loaded.runDir,'manifest.json'));
 const reuseOptions={...(flags['--inventory-config']?{inventoryConfigFile:path.resolve(flags['--inventory-config'])}:{}),...(flags['--inventory-reuse']?{inventoryReuseFile:path.resolve(flags['--inventory-reuse'])}:{})};
 if(accountingCommands.includes(command)){
  if(!flags['--input'])throw Error(command+' requires --input JSON');const input=jsonFile(flags['--input']);
  if(command==='link-session')result=await linkRunSession(loaded.runDir,input);
  else if(command==='weekly-usage')result=await recordWeeklyUsage(loaded.runDir,input);
  else if(command==='export-observation')result=await recordExportReuse(loaded.runDir,input);
  else if(command==='wait-start')result={ok:true,id:beginHumanWait(loaded.runDir,input)};
  else {if(!input.id)throw Error('wait-end requires the wait-start id');endHumanWait(loaded.runDir,input.id,input);result={ok:true,id:input.id};}
 }
 else if(boundedCommands.includes(command)){
  const stages=await import('./bounded-stages.mjs');
  const options={...loaded,...reuseOptions,selectedPages:flags['--pages']?parsePageSelection(flags['--pages']):loaded.manifest?.selectedPages,projectFile:flags['--project-file']?path.resolve(flags['--project-file']):undefined,...(flags['--config']?{config:jsonFile(flags['--config']),configFile:path.resolve(flags['--config'])}:{})};
  if(command==='drive'){
   if(!flags['--budget'])throw Error('Drive requires --budget JSON with dispatch limits');
   const {driveBoundedWorkflow}=await import('./workflow-controller.mjs');
   result=await driveBoundedWorkflow(options,{budget:jsonFile(flags['--budget']),...(flags['--concurrency']?{concurrency:Number(flags['--concurrency'])}:{}),...(flags['--plan']?{planFile:path.resolve(flags['--plan'])}:{})});
  }else if(command==='next'){
   result=await stages.nextBoundedWork(options);
   if(options.config&&loaded.manifest){const generation=dependencyStatus({...options,pages:options.selectedPages},{retry:!!flags['--retry'],representative:!!flags['--representative'],requireRepresentativePlan:true,planFile:flags['--plan']});result.generation={...generation,complete:generation.complete.length};}
  }else if(['prepare-stage','run-stage'].includes(command)){
   if(!flags['--job'])throw Error(command+' requires --job ID');
   result=command==='prepare-stage'?await stages.prepareBoundedStage(options,flags['--job']):await stages.runBoundedStage(options,flags['--job']);
  }else{
   if(!flags['--input'])throw Error(command+' requires --input JSON');const input=jsonFile(flags['--input']);
   result=command==='record-stage'?await stages.recordBoundedStage(options,input):command==='cancel-stage'?await stages.cancelBoundedStage(options,input):await stages.registerFeedbackScope(options,input);
  }
 }
 else if(command==='record-inventory-reuse'){
  if(!flags['--input']||!flags['--config']||!flags['--inventory-config'])throw Error('Reviewed inventory reuse requires --input, --config and --inventory-config');
  result=await recordInventoryReuse({...loaded,...reuseOptions,configFile:path.resolve(flags['--config']),config:jsonFile(flags['--config'])},jsonFile(flags['--input']));
 }
 else if(command==='receipt'){
  result=buildRunReceipt(loaded.runDir);if(flags['--summary'])result=summarizeRunReceipt(result);
  if(loadWorkflow(loaded.runDir).pipelinePolicy){const closeout=importCloseout(loaded.runDir,loaded.manifest?.selectedPages??[]);result={...result,verification:closeout.verification,checklist:closeout.checklist};}
 }
 else if(command==='representatives')result=representativePlan(liveWorkflow(loaded.runDir),loaded.manifest.selectedPages);
 else if(command==='closeout')result=importCloseout(loaded.runDir,loaded.manifest.selectedPages);
 else if(['verification','record-verification','approve-coverage'].includes(command)){
  const input=flags['--input']?JSON.parse(fs.readFileSync(flags['--input'],'utf8')):null;
  const projectFor=state=>state.settled?.project?.file?JSON.parse(fs.readFileSync(state.settled.project.file,'utf8')):null;
  if(command==='verification'){const state=liveWorkflow(loaded.runDir);result=verificationStatus(state,projectFor(state),{validateFinal:()=>acceptFinalReview(structuredClone(state),state.finalReview)});}
  else {if(!input)throw Error('Explicit review input required');await updateWorkflow(loaded.runDir,command,async state=>{
   Object.assign(state,liveWorkflow(loaded.runDir));
   if(command==='approve-coverage')approveCoverage(state,input);else{
    if(input.id==='regressions'&&input.regressionScope){const {regressionScopeSignature}=await import('./verification-cache.mjs');input.dependencies??={};input.dependencies.regression??=regressionScopeSignature(input.regressionScope);}
    recordVerification(state,input,verificationDependencies(state,projectFor(state)));
   }
  });result={ok:true,recorded:input.id};}
 }
 else if(command==='check-representatives'){
  if(!flags['--input'])throw Error('Representative check requires --input JSON');
  let plan=JSON.parse(fs.readFileSync(flags['--input'],'utf8').replace(/^\uFEFF/,''));
  if(loaded.manifest.pipelinePolicy){const {selectRepresentativeCases}=await import('./efficiency-tools.mjs');plan=selectRepresentativeCases(plan);}
  result=checkRepresentativePlan(liveWorkflow(loaded.runDir),loaded.manifest.selectedPages,plan);
  if(result.ok&&loaded.manifest.pipelinePolicy)await updateWorkflow(loaded.runDir,'register representative plan',state=>{
   const checked=checkRepresentativePlan(liveWorkflow(loaded.runDir),loaded.manifest.selectedPages,plan);if(!checked.ok)throw Error(checked.issues.join('; '));
   state.verification??={version:1,entries:{}};state.verification.representativePlan=plan;
  });
 }
 else if(command==='repair-context'){
  if(!flags['--input'])throw Error('Repair context requires --input JSON');
  result=targetedRepairContext(loaded.runDir,JSON.parse(fs.readFileSync(flags['--input'],'utf8').replace(/^\uFEFF/,'')));
 }
 else if(['attempt-context','repair-attempt'].includes(command)){
  if(!flags['--input']||!flags['--config'])throw Error('Attempt repair requires --input and --config');
  const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')),options={...loaded,config:read(flags['--config']),representative:!!flags['--representative'],attempt:flags['--attempt']};
  result=command==='attempt-context'?attemptRepairContext(options,read(flags['--input'])):await repairAttempt(options,read(flags['--input']),{log:()=>{}});
 }
 else if(command==='preflight')result=await workflowPreflight({...loaded,base:flags['--base']});
 else if(['status','drain'].includes(command)){
  if(!flags['--config'])throw Error('Status/drain requires --config');
  const options={...loaded,...reuseOptions,configFile:path.resolve(flags['--config']),config:JSON.parse(fs.readFileSync(flags['--config'],'utf8').replace(/^\uFEFF/,'')),pages:flags['--pages']?parsePageSelection(flags['--pages']):loaded.manifest.selectedPages,concurrency:flags['--concurrency']};
  const policy={retry:!!flags['--retry'],representative:!!flags['--representative'],retryReason:flags['--retry-reason']??null,regenerationReason:flags['--regenerate-reason']??null,requireRepresentativePlan:true,planFile:flags['--plan']};
  result=command==='status'?dependencyStatus(options,policy):await drainDependencies(options,policy);
 }else throw Error('Unknown workflow command');
 printWorkflowOutput(result,{full:!!flags['--full'],out:flags['--out'],exclusive:['representatives','repair-context','attempt-context','closeout'].includes(command)});
 if(result.ok===false)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.ticket?JSON.stringify({ok:false,error:error.message,ticket:error.ticket,retainedOutput:error.retainedOutput??null}):error.message);process.exitCode=1;});
