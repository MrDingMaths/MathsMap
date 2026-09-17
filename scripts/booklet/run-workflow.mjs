import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {dependencyStatus,drainDependencies} from './dependency-runner.mjs';
import {buildRunReceipt,summarizeRunReceipt} from './run-observability.mjs';
import {workflowPreflight} from './workflow-preflight.mjs';
import {liveWorkflow,loadWorkflow,updateWorkflow,approveCoverage,acceptFinalReview} from './workflow-review.mjs';
import {verificationStatus,verificationDependencies,recordVerification} from './import-verification.mjs';
import {representativePlan,checkRepresentativePlan,targetedRepairContext} from './efficiency-tools.mjs';
import {attemptRepairContext,repairAttempt} from './local-attempt-repair.mjs';
import {printWorkflowOutput} from './workflow-output.mjs';
import {importCloseout} from './import-closeout.mjs';
import {importPreFinal} from './import-pre-final.mjs';
export async function main(args=process.argv.slice(2)){
 if(args[0]==='--help'){
  console.log('run-workflow status|drain|preflight|representatives|check-representatives|approve-coverage|verification|record-verification|repair-context|attempt-context|repair-attempt|pre-final|closeout|receipt --run-id RUN [--input JSON --out JSON --full]. Pre-final uses --input PROJECT.json without a run. Status/drain and attempt commands require --config. Bulk drain requires --plan and current representative inspections. repair-attempt requires --attempt. Receipt supports --run-dir and legacy --summary. See docs/booklet-import-efficiency.md.');return;
 }
 const command=args[0],flags={};
 for(let i=1;i<args.length;i++){
  const key=args[i];if(['--retry','--representative','--summary','--full'].includes(key)){flags[key]=true;continue;}
  if(!['--run-id','--run-dir','--pages','--config','--concurrency','--base','--out','--retry-reason','--input','--attempt','--plan','--regenerate-reason'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+key);flags[key]=args[++i];
 }
 if(command==='pre-final'){
  if(!flags['--input'])throw Error('Pre-final requires --input PROJECT.json');
  const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')),result=importPreFinal(read(flags['--input']));
  printWorkflowOutput(result,{out:flags['--out'],full:!!flags['--full']});if(!result.ok)process.exitCode=1;return result;
 }
 if(!flags['--run-id']&&!(command==='receipt'&&flags['--run-dir']))throw Error('Use status|drain|preflight --run-id ID [--config JSON --pages RANGE --concurrency N --retry --representative], or receipt --run-dir DIR');
 const loaded=flags['--run-id']?loadRun(flags['--run-id']):{runDir:flags['--run-dir']};let result;
 if(command==='receipt'){
  result=buildRunReceipt(loaded.runDir);if(flags['--summary'])result=summarizeRunReceipt(result);
  if(loadWorkflow(loaded.runDir).pipelinePolicy){const closeout=importCloseout(loaded.runDir,loaded.manifest?.selectedPages??[]);result={...result,verification:closeout.verification,checklist:closeout.checklist};}
 }
 else if(command==='representatives')result=representativePlan(liveWorkflow(loaded.runDir),loaded.manifest.selectedPages);
 else if(command==='closeout')result=importCloseout(loaded.runDir,loaded.manifest.selectedPages);
 else if(['verification','record-verification','approve-coverage'].includes(command)){
  const input=flags['--input']?JSON.parse(fs.readFileSync(flags['--input'],'utf8')):null;
  const projectFor=state=>state.settled?.project?.file?JSON.parse(fs.readFileSync(state.settled.project.file,'utf8')):null;
  if(command==='verification'){const state=liveWorkflow(loaded.runDir);result=verificationStatus(state,projectFor(state),{validateFinal:()=>acceptFinalReview(structuredClone(state),state.finalReview)});}
  else {if(!input)throw Error('Explicit review input required');await updateWorkflow(loaded.runDir,command,state=>{
   Object.assign(state,liveWorkflow(loaded.runDir));
   if(command==='approve-coverage')approveCoverage(state,input);else recordVerification(state,input,verificationDependencies(state,projectFor(state)));
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
  const options={...loaded,config:JSON.parse(fs.readFileSync(flags['--config'],'utf8').replace(/^\uFEFF/,'')),pages:flags['--pages']?parsePageSelection(flags['--pages']):loaded.manifest.selectedPages,concurrency:flags['--concurrency']};
  const policy={retry:!!flags['--retry'],representative:!!flags['--representative'],retryReason:flags['--retry-reason']??null,regenerationReason:flags['--regenerate-reason']??null,requireRepresentativePlan:true,planFile:flags['--plan']};
  result=command==='status'?dependencyStatus(options,policy):await drainDependencies(options,policy);
 }else throw Error('Unknown workflow command');
 printWorkflowOutput(result,{full:!!flags['--full'],out:flags['--out'],exclusive:['representatives','repair-context','attempt-context','closeout'].includes(command)});
 if(result.ok===false)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
