import fs from 'node:fs';import path from 'node:path';import {loadRun} from './transcription.mjs';import {nextBoundedWork,runBoundedStage,cancelBoundedStage} from './bounded-stages.mjs';
const [runId,file,workers='3']=process.argv.slice(2);if(!runId||!file||![1,2,3].includes(Number(workers)))throw Error('Use RUN_ID PROJECT_FILE WORKERS');process.env.CODEX_HOME=path.join(process.env.USERPROFILE,'.codex');const {runDir,manifest}=loadRun(runId),options={runDir,manifest,selectedPages:manifest.selectedPages,projectFile:path.resolve(file),configFile:path.join(runDir,'config.json'),stages:['visual','composition'],visualConcurrency:Number(workers)},attempted=new Set(),active=new Map(),resultsFile=path.join(runDir,'workflow/visual-pool-results.json'),results=fs.existsSync(resultsFile)?JSON.parse(fs.readFileSync(resultsFile,'utf8')):[];if(!Array.isArray(results))throw Error('Existing visual pool results must be an array');let stopped=false;
const saveResults=()=>fs.writeFileSync(resultsFile,JSON.stringify(results,null,2)+'\n');
function retainedDirectory(value){
 const supplied=typeof value==='string'?value:value?.directory??value?.path;
 if(typeof supplied!=='string'||!path.isAbsolute(supplied))throw Error('Retained output does not identify an absolute worker directory');
 const directory=path.resolve(supplied),root=fs.realpathSync(runDir),real=fs.realpathSync(directory),relative=path.relative(root,real);
 if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative)||!fs.lstatSync(directory).isDirectory())throw Error('Retained worker directory is outside this run or is not a directory');
 let current=directory;
 while(true){if(fs.lstatSync(current).isSymbolicLink())throw Error('Retained worker directory contains a symbolic path');const parent=path.dirname(current);if(parent===current)break;current=parent;}
 return directory;
}
async function recoverEndedFailure(result){
 const receipt={type:'worker-recovery',at:new Date().toISOString(),jobId:result.jobId,ticket:result.ticket,inspectionCredited:false};
 if(result.executionRejected!==true||!result.ticket)return {...receipt,action:'retained',reason:'No completed rejection with an exact ownership ticket; cancellation was not attempted.'};
 const directory=retainedDirectory(result.retainedOutput),generationFile=path.join(directory,'generation.json');
 try{fs.lstatSync(generationFile);return {...receipt,action:'retained-for-reconciliation',generationFile,reason:'Retained generation.json requires validation/reconciliation; ownership was preserved.'};}
 catch(error){if(error.code!=='ENOENT')throw error;}
 const reason='Bounded worker '+result.jobId+' rejected after execution ended without generation.json: '+result.error;
 const cancellation=await cancelBoundedStage(options,{ticket:result.ticket,reason});
 return {...receipt,action:'cancelled-ended-owner',generationFile,reason,cancellation};
}

while(true){if(!stopped&&active.size<Number(workers)){const next=await nextBoundedWork(options);fs.writeFileSync(path.join(runDir,'workflow/next-visual.json'),JSON.stringify(next,null,2)+'\n');const ready=next.jobs.filter(j=>!j.done&&!j.blockers.length&&!attempted.has(j.id)).slice(0,Number(workers)-active.size);for(const job of ready){attempted.add(job.id);console.log(JSON.stringify({stage:'visual-dispatch',job:job.id,ownershipIds:job.ownershipIds}));active.set(job.id,runBoundedStage(options,job.id).then(result=>({jobId:job.id,...result}),error=>({jobId:job.id,ok:false,executionRejected:true,error:error.message,errorStack:error.stack,ticket:error.ticket,retainedOutput:error.retainedOutput})));}if(!ready.length&&!active.size){console.log(JSON.stringify({stage:'visual-handoff',remaining:next.jobs.filter(j=>!j.done).map(j=>({id:j.id,blockers:j.blockers})),active:next.active,blockers:next.blockers}));break;}}
 if(!active.size)break;const result=await Promise.race(active.values());active.delete(result.jobId);results.push(result);saveResults();console.log(JSON.stringify({stage:'visual-result',jobId:result.jobId,ok:result.ok,error:result.error,ticket:result.ticket,artifact:result.artifact,metrics:result.metrics}));
 if(!result.ok){
  stopped=true;process.exitCode=1;
  let recovery;
  try{recovery=await recoverEndedFailure(result);}
  catch(error){recovery={type:'worker-recovery',at:new Date().toISOString(),jobId:result.jobId,ticket:result.ticket,action:'retained-cleanup-blocked',reason:error.message,inspectionCredited:false};}
  results.push(recovery);saveResults();console.log(JSON.stringify({stage:'visual-recovery',...recovery}));
 }
 if(stopped&&!active.size)break;
}
try{
 const next=await nextBoundedWork(options),complete=!stopped&&next.jobs.every(job=>job.done)&&!(next.active?.length)&&!(next.blockers?.length);
 fs.writeFileSync(path.join(runDir,'workflow/next-visual.json'),JSON.stringify(next,null,2)+'\n');
 const state={at:new Date().toISOString(),complete,stopped,passingJobs:next.jobs.filter(job=>job.done).map(job=>job.id),remaining:next.jobs.filter(job=>!job.done).map(job=>({id:job.id,blockers:job.blockers})),active:next.active,blockers:next.blockers};
 fs.writeFileSync(path.join(runDir,'workflow/visual-pool-state.json'),JSON.stringify(state,null,2)+'\n');
 console.log(JSON.stringify({stage:'visual-pool-settled',...state}));
}catch(error){
 process.exitCode=1;const state={at:new Date().toISOString(),complete:false,stopped,error:error.message};
 fs.writeFileSync(path.join(runDir,'workflow/visual-pool-state.json'),JSON.stringify(state,null,2)+'\n');
 console.log(JSON.stringify({stage:'visual-pool-state-blocked',...state}));
}
