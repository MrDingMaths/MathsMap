// Explicit review records only: this CLI never invents reviewer approvals.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRun} from './transcription.mjs';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {rendererSignature} from './verification-cache.mjs';
import {projectReviewHash} from './page-review.mjs';
import {loadWorkflow,liveWorkflow,updateWorkflow,currentStatus,registerInventory,registerAuthor,sourceEvidence,effectiveInventory,effectiveAuthor,synchronizeProject,recordMathReview,applyDecisions,approveRepresentative,settleWorkflow,acceptFinalReview,fingerprint,bytesHash} from './workflow-review.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
export function refreshRegister(runDir,pages,state,{decisions=[]}={}){
 const approved=new Map(decisions.map(id=>[id,structuredClone(state.issues[id])]));
 const hashes=new Map(),hash=file=>{if(!hashes.has(file))hashes.set(file,bytesHash(file));return hashes.get(file);};
 for(const page of pages){
  const inventory=effectiveInventory(runDir,page,state);if(!inventory)continue;
  registerInventory(state,inventory,sourceEvidence(runDir,page,hash));
  const packet=effectiveAuthor(runDir,page,state);if(packet)registerAuthor(state,inventory,packet,{strict:false});
 }
 // Propagation must not resurrect the very unchanged finding just resolved by
 // this decision. A different finding or a later unrelated edit still reopens it.
 const finding=issue=>{if(!issue)return null;const {inputHash,status,resolution,...value}=issue;return value;};
 for(const [id,old]of approved){const current=state.issues[id];if(current&&old&&fingerprint(finding(old))===fingerprint(finding(current))){current.status=old.status;current.resolution=old.resolution;}}
 return state;
}
export function correctionOutputs(runDir,pages,state){
 const outputs=[];
 for(const page of pages){
  const stem=`page-${String(page).padStart(3,'0')}`;
  for(const [scope,readEffective]of [['inventory',effectiveInventory],['author',effectiveAuthor]]){
   const packet=readEffective(runDir,page,state);
   if(packet)outputs.push([path.join(runDir,'workflow/current',`${stem}.${scope}.json`),packet]);
  }
 }
 outputs.push([path.join(runDir,'workflow/current/status.json'),currentStatus(state,pages)]);
 return outputs;
}
export async function main(args=process.argv.slice(2)){
 const command=args[0],options={};
 if(!['status','inventory','review-maths','decide','approve-pattern','propagate','settle','final-review'].includes(command))throw Error('Use status|inventory|review-maths|decide|approve-pattern|propagate|settle|final-review --run-id ID [--input REVIEW.json] [--project ID]');
 for(let i=1;i<args.length;i++){
  if(!['--run-id','--input','--project'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+args[i]);
  options[args[i]]=args[++i];
 }
 const {runDir,manifest}=loadRun(options['--run-id']),pages=manifest.selectedPages;
 if(command==='status'){const state=liveWorkflow(runDir,pages);const report={...currentStatus(state,pages),renderer:rendererSignature()};console.log(JSON.stringify(report,null,2));return report;}
 const record=options['--input']?read(options['--input']):null;
 if(!['inventory','propagate'].includes(command)&&!record)throw Error('This command needs --input with explicit review evidence');
 const projectId=options['--project']??loadWorkflow(runDir).projectId;
 if(command==='settle'&&!projectId)throw Error('Settlement requires --project ID');
 let project=projectId?await loadBookletProject(projectId):null,projectFile;
 if(project){
  if(project.source?.runId!==manifest.id)throw Error('Project belongs to another source run');
  projectFile=path.resolve('booklets/projects',projectId+'.json');
 }
 await updateWorkflow(runDir,command,async state=>{
  Object.assign(state,liveWorkflow(runDir,pages));
  if(projectId)state.projectId=projectId;
  if(command==='review-maths')recordMathReview(state,record);
  if(command==='decide')applyDecisions(state,record);
  if(command==='approve-pattern')approveRepresentative(state,record);
  if(command==='settle'){
   if(fingerprint(synchronizeProject(project,state,pages,manifest.id))!==fingerprint(project))throw Error('Propagate current corrections/status before settling the project');
   settleWorkflow(state,pages,{...record,project:{id:projectId,file:projectFile,hash:projectReviewHash(read(projectFile))}});
  }
  if(command==='final-review')acceptFinalReview(state,record);
  if(project)synchronizeProject(project,state,pages,manifest.id);
  if(['decide','propagate'].includes(command)){
   // Preflight every existing dependent before committing approval or outputs.
   refreshRegister(runDir,pages,state,{decisions:command==='decide'?(record.resolutions??[]).map(r=>r.id):[]});
   return {outputs:correctionOutputs(runDir,pages,state)};
  }
 });
 if(project){
  // Use the normal optimistic save and automatic bank-sync transaction. Never
  // nest that save under the workflow's bank lock. Derived outputs are replayable
  // if a concurrent project edit makes this save fail.
  const state=liveWorkflow(runDir),updated=synchronizeProject(project,state,pages,manifest.id);
  if(fingerprint(updated)!==fingerprint(project))await saveBookletProject(updated,{expectedRevision:project.revision});
 }
 const report=currentStatus(liveWorkflow(runDir),pages);console.log(JSON.stringify(report,null,2));return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
