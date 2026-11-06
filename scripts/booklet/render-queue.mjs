#!/usr/bin/env node
// Opt-in shared queue. Existing immutable pins and legacy runners are untouched.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createRenderQueue,QueueBusy,fileHash,requestHash,defaultResources} from './shared-render-queue.mjs';
import {verifyPinnedRuntime} from './frozen-runtime-pin.mjs';
import {createObservedAbortVerifier} from './observed-abort-verifier.mjs';
import {snapshotDifferences,printRelevantChanges} from './import-verification-runtime.mjs';
import {runFeedbackJob,verifyFeedbackClosure,validateFeedbackInputs,feedbackFingerprint} from './shared-render-runner.mjs';

const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const normal=s=>path.resolve(s).replaceAll('\\','/').toLowerCase();
function noAlias(file){let part=path.parse(path.resolve(file)).root;for(const segment of path.resolve(file).slice(part.length).split(path.sep).filter(Boolean)){part=path.join(part,segment);if(fs.existsSync(part)&&fs.lstatSync(part).isSymbolicLink())throw Error('Queue coordination alias/reparse path');}}
export function observeRenderProcesses(){
 if(process.platform!=='win32')throw Error('Shared production admission currently supports Windows CIM inventory only');
 const shell=path.join(process.env.SystemRoot??'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
 const output=execFileSync(shell,['-NoProfile','-Command',"$ErrorActionPreference='Stop'; @(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(node|chrome)\\.exe$' } | Select-Object ProcessId,ParentProcessId,Name,CommandLine,ExecutablePath,@{Name='Birth';Expression={$_.CreationDate.ToUniversalTime().ToString('o')}}) | ConvertTo-Json -Compress"],{encoding:'utf8',windowsHide:true});
 if(!output.trim())return[];const rows=JSON.parse(output);return Array.isArray(rows)?rows:[rows];
}
export function classifyQueueProcesses(rows,owners){
 const byPid=new Map(rows.map(p=>[p.ProcessId,p]));
 const argumentPath=(command,target)=>new RegExp('(?:^|\\s|\")'+normal(target).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:\"|\\s|$)').test(command);
 const descendant=(p,id)=>{const seen=new Set();while(p&&!seen.has(p.ProcessId)){if(p.ProcessId===id)return true;seen.add(p.ProcessId);p=byPid.get(p.ParentProcessId);}return false;};
 const owned=p=>owners.some(o=>{const checker=o.checker&&byPid.get(o.checker.pid),validChecker=checker&&checker.Birth===o.checker.birth&&normal(checker.ExecutablePath??'')===normal(o.nodeExecutable);if(validChecker&&descendant(p,checker.ProcessId))return String(p.Name).toLowerCase()==='node.exe'||normal(p.ExecutablePath??'')===normal(o.browserExecutable);const command=String(p.CommandLine??'').replaceAll('\\','/').replace(/\/+/g,'/').toLowerCase();return p.ParentProcessId===o.workerPid&&String(p.Name).toLowerCase()==='node.exe'&&normal(p.ExecutablePath??'')===normal(o.nodeExecutable)&&argumentPath(command,o.serverCache)&&command.includes('createserver');});
 return {unknownBrowsers:rows.filter(p=>String(p.Name).toLowerCase()==='chrome.exe'&&!owned(p)),unknownRenders:rows.filter(p=>String(p.Name).toLowerCase()==='node.exe'&&/check-feedback-pages|tikz-render-probe|vite-cache|createserver|lean-import|lean-review/i.test(p.CommandLine??'')&&!owned(p))};
}
export function verifyQueueRuntime(root,runtime,{closure=false}={}){
 if(!runtime?.pinRoot||!runtime.pinHash||!runtime.manifestFile||!runtime.manifestSha256||!runtime.cacheFingerprint)throw Error('Exact pinned runtime/manifest/cache required');
 if(fileHash(runtime.manifestFile)!==runtime.manifestSha256)throw Error('Runtime manifest drift');
 const pin=verifyPinnedRuntime(runtime.pinRoot),manifest=read(runtime.manifestFile);
 if(pin.manifestHash!==runtime.pinHash||normal(manifest.snapshot)!==normal(pin.root))throw Error('Runtime pin mismatch');
 if(feedbackFingerprint(pin.root)!==runtime.cacheFingerprint)throw Error('Pinned cache fingerprint mismatch');
 const drift=closure?[]:printRelevantChanges(root,manifest.files,snapshotDifferences(root,manifest.files));
 if(drift.length)throw Error('Print-relevant runtime drift: '+drift.join(', '));
 return pin;
}

// The bounded activation barrier is required because old immutable runners do
// not participate in the queue transaction. It is never inferred from PID age.
export function createRepositoryRenderQueue({root,queueRoot=path.join(root,'.booklet-work/shared-render-queue-v1'),activationFile,activationSha256}){
 root=path.resolve(root);queueRoot=path.resolve(queueRoot);noAlias(queueRoot);
 function activation(){if(!activationFile||fileHash(activationFile)!==activationSha256)throw Error('Exact coordinated activation record required');const a=read(activationFile);if(a.kind!=='shared-render-queue-rollout-v1'||a.legacyAdmissionPaused!==true||!Array.isArray(a.coordinators)||!a.coordinators.includes('Geometry')||!a.coordinators.includes('Exam')||!Number.isFinite(Date.parse(a.expiresAt))||Date.parse(a.expiresAt)<=Date.now())throw Error('Unexpired Geometry/Exam no-legacy-admission barrier required');for(const e of a.evidence??[]){if(fileHash(e.file)!==e.sha256)throw Error('Activation evidence changed');}if(!a.evidence?.length)throw Error('Coordinator evidence required');for(const name of ['render-queue.mjs','shared-render-queue.mjs','shared-render-runner.mjs','observed-abort-verifier.mjs'])if(!a.implementationSha256?.[name]||fileHash(path.join(path.dirname(fileURLToPath(import.meta.url)),name))!==a.implementationSha256[name])throw Error('Queue implementation changed since coordinated activation: '+name);return a;}
 const laneRoot=path.join(root,'.booklet-work/end-goal-20261028'),coord=path.join(laneRoot,'shared-session-render-save-coordination.json');
 const locks=[1,2,3].map(n=>path.join(laneRoot,'geometry-lane'+n+'-host.lock'));
 function reserve({jobId,jobDir,token}){for(const [i,file]of locks.entries()){noAlias(path.dirname(file));const record={kind:'shared-render-slot-v1',jobId,jobDir,token,lane:i+1,pid:process.pid,at:new Date().toISOString()};try{fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n',{flag:'wx'});return{file,record};}catch(e){if(e.code!=='EEXIST')throw e;}}throw new QueueBusy();}
 function releaseReservation(reservation,token){if(!reservation)throw Error('Reservation identity missing; reconcile retained lane locks');const {file,record}=reservation;if(record.token!==token)throw Error('Reservation token mismatch');if(!fs.existsSync(file))return;if(!fs.lstatSync(file).isFile()||fileHash(file)!==fileHashBytes(record))throw Error('Foreign/changed lane lock retained');fs.unlinkSync(file);}
 function fileHashBytes(record){return requestBytesHash(JSON.stringify(record,null,2)+'\n');}
 function admit({activeJobs,manifest,jobId}){
  const a=activation(),c=read(coord),request=manifest.request,auth=manifest.authorization,grant=auth.admission;
  const currentDir=path.join(queueRoot,'jobs',jobId);validateFeedbackInputs(currentDir,manifest,Object.fromEntries(manifest.inputs.map(i=>[i.role,path.join(currentDir,'inputs',i.role)])));
  if(a.legacyScopeReconciled!==true||!Array.isArray(a.registryRoots)||!Array.isArray(a.additionalLocks))throw Error('Explicit reconciled legacy registry/alternate-lock inventory required');
  const liveFile=path.join(root,'booklets/projects',String(request.projectId)+'.json');
  if(!/^[a-zA-Z0-9_-]+$/.test(request.projectId??'')||normal(request.projectFile??'')!==normal(liveFile)||fileHash(liveFile)!==request.projectSha256||read(liveFile).revision!==request.projectRevision||manifest.inputs.find(i=>i.role===request.baselineInput)?.sha256!==request.projectSha256)throw Error('Exact current project identity/revision and byte-exact baseline required');
  if(!grant||grant.projectId!==request.projectId||grant.projectRevision!==request.projectRevision||grant.projectSha256!==request.projectSha256||grant.projectNonoverlap!==true||grant.scopeApproved!==true||grant.pilotAllowed!==true) return{allowed:false,reason:'Exact project/scope/nonoverlap/pilot grant missing',...defaultResources(root),externalHosts:0};
  const activeIds=new Set(activeJobs.map(j=>j.id)),ownDirs=activeJobs.map(j=>normal(path.join(queueRoot,'jobs',j.id)));
  const busy=reason=>({allowed:false,busy:true,reason,externalHosts:0,...defaultResources(root)});
  for(const j of activeJobs.filter(j=>j.id!==jobId)){const f=path.join(queueRoot,'jobs',j.id,'manifest.json');if(fileHash(f)!==j.manifestHash)throw Error('Active manifest drift');if(read(f).request.projectId===request.projectId)return busy('Same booklet already owned by another queued render');}
  if(['lane1','lane2','lane3'].some(k=>c[k]?.activeHost))return busy('Legacy lane claim active; wait without reclaiming');
  for(const file of locks){if(!fs.existsSync(file))continue;if(!fs.lstatSync(file).isFile())return busy('Legacy lane lock active');let r;try{r=read(file);}catch{return busy('Uncertain lane lock');}if(r.kind!=='shared-render-slot-v1'||!activeIds.has(r.jobId)||!activeJobs.some(j=>j.id===r.jobId&&j.attempt?.token===r.token))return busy('Foreign lane reservation retained');}
  for(const file of a.additionalLocks??[])if(fs.existsSync(file))return busy('Legacy alternate lock active: '+file);
  const owners=activeJobs.map(j=>{const jobDir=path.join(queueRoot,'jobs',j.id),file=path.join(jobDir,'manifest.json');if(fileHash(file)!==j.manifestHash)throw Error('Active manifest drift');const m=read(file),pin=verifyPinnedRuntime(m.request.runtime.pinRoot),attempt=path.join(jobDir,'attempt-'+j.attempt.token),childFile=path.join(attempt,'child-started.json');let checker=null;if(fs.existsSync(childFile)){checker=read(childFile);if(checker.token!==j.attempt.token)throw Error('Child identity token mismatch');}return{workerPid:j.attempt.identity.pid,checker,nodeExecutable:pin.engines.node.executable,browserExecutable:pin.engines.browser.executable,serverCache:path.join(attempt,'server/vite-cache')};});
  const processState=classifyQueueProcesses(observeRenderProcesses(),owners);
  if(processState.unknownBrowsers.length)return busy('Unregistered Chromium requires owner/resource reconciliation');
  if(processState.unknownRenders.length)return busy('Unregistered render/import process requires reconciliation');
  const registries=new Set([...a.registryRoots,path.join(request.runtime.pinRoot,'.booklet-work/shared-browser-leases')]);
  for(const registry of registries){if(!fs.existsSync(registry))continue;for(const name of fs.readdirSync(registry)){let r;try{r=read(path.join(registry,name));}catch{return busy('Uncertain shared browser lease');}if(!ownDirs.some(d=>normal(r.operationDir??'/').startsWith(d+'/')))return busy('Foreign browser lease retained');}}
  return{allowed:true,busy:false,externalHosts:0,...defaultResources(root),observedAt:new Date().toISOString(),activationSha256,queueOnlyBarrier:true};
 }
 const verifyObservedAbort=createObservedAbortVerifier({activation,verifyRuntime:(r,c)=>verifyQueueRuntime(root,r,c)});
 return createRenderQueue({queueRoot,admit,verifyObservedAbort,verifyRuntime:(r,context)=>verifyQueueRuntime(root,r,context),verifyClosure:verifyFeedbackClosure,reserve,releaseReservation});
}
import {createHash} from 'node:crypto';
const requestBytesHash=b=>createHash('sha256').update(b).digest('hex');

export async function workRenderQueue(queue,{workerOwner,once=false,idleMs=60000,pollMs=1000,runJob=runFeedbackJob,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 if(!workerOwner)throw Error('Worker owner required');if(!Number.isFinite(idleMs)||idleMs<0||!Number.isFinite(pollMs)||pollMs<100||pollMs>60000)throw Error('Invalid bounded worker wait');let idleSince=Date.now();
 while(true){let claim;try{claim=queue.claimNext(workerOwner);}catch(e){if(!(e instanceof QueueBusy))throw e;}
  if(claim){idleSince=Date.now();try{await runJob({...claim,assertAdmission:()=>{try{return queue.revalidate(claim.job.id,claim.token);}catch(e){e.code='RENDER_ADMISSION_REFUSAL';throw e;}}});}catch(e){queue.uncertain(claim.job.id,claim.token,'Adapter failed; retain ownership: '+e.message);if(once)return;continue;}queue.finish(claim.job.id,claim.token);if(once)return;}
  else{const pending=queue.status().jobs.some(j=>['queued','waiting'].includes(j.status));if(once||!pending&&Date.now()-idleSince>=idleMs)return;await sleep(pollMs);}
 }
}
async function main(){const args=process.argv.slice(2),command=args.shift(),options={};while(args.length){const key=args.shift();if(!key.startsWith('--'))throw Error('Expected --option');options[key.slice(2)]=args[0]&&!args[0].startsWith('--')?args.shift():true;}const root=path.resolve(options.root??process.cwd()),queueRoot=path.resolve(options.queue??path.join(root,'.booklet-work/shared-render-queue-v1'));
 if(command==='status'){const f=path.join(queueRoot,'state.json');console.log(JSON.stringify(fs.existsSync(f)?read(f):{version:1,jobs:[],activated:false},null,2));return;}
 const queue=createRepositoryRenderQueue({root,queueRoot,activationFile:options.activation,activationSha256:options['activation-sha']});
 if(command==='enqueue'){if(!options.manifest)throw Error('--manifest required');console.log(JSON.stringify(queue.enqueue(read(options.manifest)),null,2));}
 else if(command==='work')await workRenderQueue(queue,{workerOwner:options.owner,once:!!options.once,idleMs:options['idle-ms']===undefined?60000:Number(options['idle-ms']),pollMs:options['poll-ms']===undefined?1000:Number(options['poll-ms'])});
 else if(command==='recover')console.log(JSON.stringify(queue.recover(options.job,options.token),null,2));
 else if(command==='abort-observed')console.log(JSON.stringify(queue.reconcileObservedAbort(options.job,options.token,options.owner),null,2));
 else if(command==='inspect')console.log(JSON.stringify(queue.recordInspection(options.job,options.owner,{file:options.file,sha256:options.sha}),null,2));
 else if(command==='cancel')console.log(JSON.stringify(queue.cancel(options.job,options.owner),null,2));
 else throw Error('Commands: status | enqueue | work | recover | abort-observed | inspect | cancel');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.stack??e);process.exitCode=1;});

