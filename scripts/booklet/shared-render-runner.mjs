// Render-only adapter. Install beside existing booklet helpers; never publish.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {verifyPinnedRuntime} from './frozen-runtime-pin.mjs';
import {verifySharedEngineBinding} from './shared-browser-engine.mjs';

const digest=x=>createHash('sha256').update(x).digest('hex');
const hash=f=>digest(fs.readFileSync(f));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const norm=f=>path.resolve(f).toLowerCase();
const same=(a,b,message)=>{if(!isDeepStrictEqual(a,b))throw Error(message);};
function atomic(file,value){const temp=file+'.'+randomUUID()+'.tmp',fd=fs.openSync(temp,'wx');try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,file);}
function direct(file){const full=path.resolve(file);let part=path.parse(full).root;for(const s of full.slice(part.length).split(path.sep).filter(Boolean)){part=path.join(part,s);if(fs.lstatSync(part).isSymbolicLink())throw Error('Aliased render input: '+part);}if(norm(fs.realpathSync.native(full))!==norm(full))throw Error('Render path alias');return full;}
function regular(file){direct(file);if(!fs.statSync(file).isFile())throw Error('Regular file required');}
function tokenPath(jobDir,token){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(token))throw Error('Unsafe attempt token');return path.join(path.resolve(jobDir),'attempt-'+token);}
function pointerParts(p){if(typeof p!=='string'||!p.startsWith('/')||p==='/'||p.split('/').some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Invalid exact allowed path');return p.slice(1).split('/').map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));}
function at(o,keys){for(const k of keys){if(!o||!Object.hasOwn(o,k))return{exists:false};o=o[k];}return{exists:true,value:o};}
function requestedFullDevelopmentReason(request){
 const value=request.fullDevelopmentReason;
 if(value===undefined)return undefined;
 if(typeof value!=='string'||!value.trim()||value.length>2000||value.includes('\0'))throw Error('Invalid fullDevelopmentReason: explicit nonblank string of at most 2000 characters without NUL required');
 return value;
}
export function validateFeedbackInputs(jobDir,manifest,snapshots,{checkLive=true}={}){
 const request=manifest.request;if(request?.kind!=='pinned-feedback-render-v1')throw Error('Render-only request required');
 requestedFullDevelopmentReason(request);
 same(read(path.join(jobDir,'manifest.json')),manifest,'Immutable manifest differs');
 if(!Array.isArray(manifest.inputs)||new Set(manifest.inputs.map(x=>x.role)).size!==manifest.inputs.length)throw Error('Unique input guards required');
 const guards=[];
 for(const i of manifest.inputs){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(i.role))throw Error('Unsafe role');const expected=path.join(jobDir,'inputs',i.role),file=snapshots[i.role];if(!file||norm(file)!==norm(expected))throw Error('Snapshot role escaped immutable job inputs');regular(file);if(hash(file)!==i.sha256)throw Error('Immutable input changed: '+i.role);guards.push({role:i.role,file:path.resolve(file),sha256:i.sha256});}
 if(checkLive)for(const g of request.liveGuards??[]){regular(g.file);if(hash(g.file)!==g.sha256)throw Error('Live guard drift: '+g.file);if(g.revision!==undefined){const p=read(g.file);if(p.revision!==g.revision||g.projectId&&p.id!==g.projectId)throw Error('Live guard identity/revision drift');}}
 const candidate=snapshots[request.candidateInput],baseline=snapshots[request.baselineInput];if(!candidate||!baseline||candidate===baseline)throw Error('Distinct candidate and baseline snapshots required');
 const c=read(candidate),b=read(baseline);if(!request.projectId||c.id!==request.projectId||b.id!==c.id||!Number.isInteger(b.revision)||c.revision!==b.revision)throw Error('Project identity/revision mismatch');
 if(!Array.isArray(request.allowedPaths)||!request.allowedPaths.length||new Set(request.allowedPaths).size!==request.allowedPaths.length)throw Error('Exact nonempty allowed-path scope required');
 const back=structuredClone(c);
 for(const p of request.allowedPaths){const keys=pointerParts(p),old=at(b,keys),parent=at(back,keys.slice(0,-1));if(!parent.exists||!parent.value||typeof parent.value!=='object')throw Error('Inverse parent absent');if(old.exists)parent.value[keys.at(-1)]=structuredClone(old.value);else delete parent.value[keys.at(-1)];}
 same(back,b,'Allowed-path inverse does not restore exact baseline');
 const ids=new Set([...(b.sections??[]),...(c.sections??[])].flatMap(s=>s.blocks??[]).map(b=>b.id));if(!Array.isArray(request.blocks)||!request.blocks.length||request.blocks.some(id=>typeof id!=='string'||!ids.has(id)||id.includes(',')))throw Error('Exact existing repair blocks required');
 if(request.selectionBlocks!==undefined&&(!Array.isArray(request.selectionBlocks)||!request.selectionBlocks.length||request.selectionBlocks.some(id=>typeof id!=='string'||!ids.has(id)||id.includes(','))))throw Error('Exact existing selection blocks required');
 const editions=['student','short','worked','with-short','with-worked'];for(const key of ['editions','checksOnly'])if(!Array.isArray(request[key])||request[key].some(e=>!editions.includes(e)))throw Error('Explicit supported '+key+' array required');
 if(!request.editions.length&&!request.checksOnly.length)throw Error('Empty rendering/check scope');
 return{candidate,baseline,guards,revision:b.revision,manifestSha256:hash(path.join(jobDir,'manifest.json'))};
}
// Same public fingerprint contract, computed synchronously for closure admission.
export function feedbackFingerprint(root){const engine=path.join(root,'public/libs/tikzjax'),walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name));const files=[path.join(root,'src/lib/tikz.js'),path.join(root,'src/lib/tikz-prepare.js'),...walk(engine)].sort();const rows=files.map(file=>{regular(file);let bytes=fs.readFileSync(file);if(/\.(?:[cm]?js)$/.test(file)){const source=bytes.toString(),regions=[...source.matchAll(/\/\/ diagram-output:begin\r?\n([\s\S]*?)\/\/ diagram-output:end/g)].map(m=>m[1].replace(/\r\n/g,'\n'));bytes=regions.length?'diagram-output-regions\n'+regions.join('\n---\n'):source;}return[path.relative(root,file),digest(bytes)];});return digest(JSON.stringify(['booklet-diagram-cache-v2',rows]));}
function runtimeGuard(runtime){
 if(!runtime||!path.isAbsolute(runtime.pinRoot)||!path.isAbsolute(runtime.manifestFile))throw Error('Absolute pinned runtime and manifest required');regular(runtime.manifestFile);if(hash(runtime.manifestFile)!==runtime.manifestSha256)throw Error('Runtime wrapper manifest changed');
 const pin=verifyPinnedRuntime(runtime.pinRoot),wrapper=read(runtime.manifestFile);if(pin.manifestHash!==runtime.pinHash||norm(wrapper.snapshot)!==norm(pin.root)||wrapper.pin?.manifestHash!==runtime.pinHash)throw Error('Runtime pin/wrapper mismatch');
 for(const e of [pin.engines?.node,pin.engines?.browser]){if(!e?.executable||!e.hash)throw Error('Pinned engines required');regular(e.executable);if(hash(e.executable)!==e.hash)throw Error('Pinned executable changed');}
 const fp=feedbackFingerprint(pin.root),expected=runtime.cacheFingerprint;if(!/^[a-f0-9]{64}$/.test(expected??'')||expected!==fp)throw Error('Exact requested cacheFingerprint required');
 return{pin,wrapper,guard:{pinRoot:path.resolve(pin.root),pinHash:pin.manifestHash,manifestFile:path.resolve(runtime.manifestFile),manifestSha256:runtime.manifestSha256,fingerprint:fp,nodeExecutable:pin.engines.node.executable,nodeHash:pin.engines.node.hash}};
}
function birthIdentity(pid){
 if(!Number.isInteger(pid)||pid<=0)throw Error('Child PID unavailable');
 if(process.platform==='win32'){const shell=path.join(process.env.SystemRoot??'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');const script=`$p=Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; if(!$p){exit 3}; [pscustomobject]@{pid=[int]$p.ProcessId;birth=$p.CreationDate.ToUniversalTime().ToString('o');executable=$p.ExecutablePath}|ConvertTo-Json -Compress`;const x=JSON.parse(execFileSync(shell,['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true,timeout:10000}));if(!x.birth||!x.executable)throw Error('Child birth identity unavailable');return x;}
 if(process.platform==='linux'){const stat=fs.readFileSync('/proc/'+pid+'/stat','utf8'),fields=stat.slice(stat.lastIndexOf(')')+2).split(' ');return{pid,birth:fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim()+':'+fields[19],executable:fs.realpathSync('/proc/'+pid+'/exe')};}
 throw Error('No supported process birth identity on this platform');
}
export function feedbackEnvironment(pin,binding,browser,source=process.env){const env={...source},pathValue=Object.entries(env).find(([k])=>k.toUpperCase()==='PATH')?.[1];for(const key of Object.keys(env))if(/^(?:NODE_OPTIONS|NODE_PATH|PATH|MATHSMAP_BROWSER_MIRROR_RECEIPT|MATHSMAP_BROWSER_MIRROR_SHA256|MATHSMAP_SHARED_BROWSER_RECEIPT|MATHSMAP_SHARED_BROWSER_SHA256|MATHSMAP_BOOKLET_CHROMIUM|MATHSMAP_RUNTIME_PIN_HASH|MATHSMAP_BOOKLET_BASE)$/i.test(key))delete env[key];if(pathValue!==undefined)env.PATH=pathValue;Object.assign(env,{NODE_ENV:'development',MATHSMAP_BOOKLET_WORK_ROOT:pin.workRoot,MATHSMAP_RUNTIME_PIN_HASH:pin.manifestHash,MATHSMAP_BOOKLET_CHROMIUM:browser.executable,MATHSMAP_SHARED_BROWSER_RECEIPT:binding.receiptFile,MATHSMAP_SHARED_BROWSER_SHA256:binding.receiptSha256});return env;}
function leasesAbsent(binding,pinHash){const b=verifySharedEngineBinding(binding.receiptFile,binding.receiptSha256,pinHash);for(const file of [path.join(b.operationDir,'browser-active.lease'),path.join(b.leaseRegistryRoot,b.operationId+'.json')])if(fs.existsSync(file))throw Error('Operation-specific browser lease remains: '+file);return b;}
function requireDeadChild(identity){if(!identity?.birth||!Number.isInteger(identity.pid)||identity.pid<=0)throw Error('Owned child birth identity absent');try{process.kill(identity.pid,0);}catch(e){if(e.code==='ESRCH')return;throw Error('Child liveness uncertain: '+e.message);}throw Error('Child PID still live or reused; retain ownership');}
function resources(dir){const stat=fs.statfsSync(dir),observation={freeMemoryBytes:os.freemem(),freeDiskBytes:Number(stat.bavail)*Number(stat.bsize),at:new Date().toISOString()};if(!Number.isFinite(observation.freeMemoryBytes)||!Number.isFinite(observation.freeDiskBytes)||observation.freeMemoryBytes<6*2**30||observation.freeDiskBytes<3*2**30){const error=Error('Action-time memory/disk resource floor not met');error.code='RENDER_RESOURCE_REFUSAL';error.observation=observation;throw error;}return observation;}
export function feedbackArguments(pin,q,input,port,output){
 const reason=requestedFullDevelopmentReason(q);
 return[path.join(pin.root,'scripts/booklet/check-feedback-pages.mjs'),'--project',q.projectId,'--project-file',input.candidate,'--baseline-project-file',input.baseline,'--blocks',q.blocks.join(','),'--selection-blocks',(q.selectionBlocks??q.blocks).join(','),...q.allowedPaths.flatMap(p=>['--allow-path',p]),'--editions',q.editions.length?q.editions.join(','):'none','--checks-only',q.checksOnly.length?q.checksOnly.join(','):'none',...(reason===undefined?[]:['--full-development-reason',reason]),'--base','http://127.0.0.1:'+port,'--out',output];
}

export async function runFeedbackJob({jobDir,token,manifest,snapshots,assertAdmission}){
 if(typeof assertAdmission!=='function')throw Error('Production action-time admission callback required');
 jobDir=direct(jobDir);const attempt=tokenPath(jobDir,token);if(fs.existsSync(attempt))throw Error('Attempt already exists: reconcile without retry');fs.mkdirSync(attempt);
 let input,runtime,binding,server,childRecord=null,childKnownClosed=false,checkerAttempted=false,spawnError=false,serverAttempted=false,serverClosed=false,attempted=false,exitCode=1,renderPassed=false,reportArtifact=null,error=null,resourceRefusal=null,admissionRefusal=null,contentDrift=null;const cleanupErrors=[];
 const closureFile=path.join(attempt,'closure.json'),output=path.join(attempt,'output'),serverDir=path.join(attempt,'server');fs.mkdirSync(output);fs.mkdirSync(serverDir);
 const admit=async phase=>{try{const observation=await assertAdmission({phase,jobDir,token,manifest});if(observation===false)throw Error('Production admission returned false');atomic(path.join(attempt,'admission-'+phase+'.json'),{token,phase,checked:true,observation:observation??null,at:new Date().toISOString()});}catch(cause){const e=Error('Action-time admission refused: '+cause.message,{cause});e.code='RENDER_ADMISSION_REFUSAL';e.phase=phase;throw e;}};
 try{
  input=validateFeedbackInputs(jobDir,manifest,snapshots);runtime=runtimeGuard(manifest.request.runtime);
  const load=name=>import(pathToFileURL(path.join(runtime.pin.root,'scripts/booklet',name)).href);
  const shared=await load('shared-browser-engine.mjs'),{startFrozenVerificationServer}=await load('import-verification-runtime.mjs'),{diagramFingerprint}=await load('render-cache-server.mjs');same(await diagramFingerprint(runtime.pin.root),runtime.guard.fingerprint,'Fingerprint implementation mismatch');
  binding=shared.createSharedEngineBinding(runtime.pin.root,path.join(attempt,'browser-operation'));const browser=leasesAbsent(binding,runtime.pin.manifestHash);atomic(path.join(attempt,'binding.json'),binding);
  const env=feedbackEnvironment(runtime.pin,binding,browser);
  env.TEMP=path.join(browser.operationDir,'temp');env.TMP=env.TEMP;
  // The existing server helper has no env option. Its spawn occurs synchronously
  // before its first await; restore the parent environment before awaiting it.
  await admit('before-server');atomic(path.join(attempt,'resources-before-server.json'),resources(attempt));
  atomic(path.join(attempt,'server-spawn-intent.json'),{token,at:new Date().toISOString()});
  const previous={...process.env};let pending;serverAttempted=true;attempted=true;
  try{for(const k of Object.keys(process.env))if(!Object.hasOwn(env,k))delete process.env[k];Object.assign(process.env,env);pending=startFrozenVerificationServer({...runtime.wrapper,snapshot:runtime.pin.root,pin:runtime.pin},serverDir);}finally{for(const k of Object.keys(process.env))if(!Object.hasOwn(previous,k))delete process.env[k];Object.assign(process.env,previous);}
  server=await pending;atomic(path.join(attempt,'server-started.json'),{token,runtime:runtime.guard,info:server.info});
  same(validateFeedbackInputs(jobDir,manifest,snapshots),input,'Inputs changed before child');same(runtimeGuard(manifest.request.runtime).guard,runtime.guard,'Runtime changed before child');leasesAbsent(binding,runtime.pin.manifestHash);
  const q=manifest.request,args=feedbackArguments(runtime.pin,q,input,server.info.port,output);
  env.MATHSMAP_BOOKLET_BASE='http://127.0.0.1:'+server.info.port;
  const log=fs.openSync(path.join(attempt,'child-output.log'),'wx');
  try{await admit('before-checker');atomic(path.join(attempt,'resources-before-checker.json'),resources(attempt));atomic(path.join(attempt,'checker-spawn-intent.json'),{token,executable:runtime.pin.engines.node.executable,args,at:new Date().toISOString()});checkerAttempted=true;}catch(e){fs.closeSync(log);throw e;}
  try{const result=await new Promise(resolve=>{let child;try{child=spawn(runtime.pin.engines.node.executable,args,{cwd:runtime.pin.root,env,windowsHide:true,stdio:['ignore',log,log]});}catch(e){spawnError=true;return resolve({error:e});}let identityError;child.once('spawn',()=>{try{const identity=birthIdentity(child.pid);if(norm(identity.executable)!==norm(runtime.pin.engines.node.executable))throw Error('Checker executable/birth identity differs');childRecord={...identity,token,args};atomic(path.join(attempt,'child-started.json'),childRecord);}catch(e){identityError=e;}});child.once('error',e=>{spawnError=true;error=e;});child.once('close',(code,signal)=>{childKnownClosed=true;resolve({code,signal,error:identityError??(spawnError?error:null)});});});if(result.error)throw result.error;if(result.signal||!Number.isInteger(result.code))throw Error('Checker ended without normal exit');exitCode=result.code;atomic(path.join(attempt,'child-exited.json'),{token,child:childRecord,exitCode,closed:true});}
  finally{fs.closeSync(log);}
  const reportFile=path.join(output,'feedback-pages.json'),report=read(reportFile);reportArtifact={file:reportFile,sha256:hash(reportFile),projectId:report.projectId,passed:report.passed};renderPassed=report.projectId===q.projectId&&report.passed===true&&exitCode===0;if(!renderPassed)exitCode=exitCode||1;
 }catch(e){error=e;exitCode=1;if(e.code==='RENDER_RESOURCE_REFUSAL')resourceRefusal={beforeAttempt:!attempted,observation:e.observation};if(e.code==='RENDER_ADMISSION_REFUSAL'){admissionRefusal={beforeAttempt:!attempted,phase:e.phase,code:e.code,cause:e.cause?.message??e.message};atomic(path.join(attempt,'admission-refused.json'),{token,...admissionRefusal});}}
 finally{
  if(server)try{await server.close();serverClosed=true;atomic(path.join(attempt,'server-closed.json'),{token,closed:true,info:server.info,runtime:runtime.guard,method:'existing-startFrozenVerificationServer.close-resolved',at:new Date().toISOString()});}catch(e){cleanupErrors.push('Server close: '+e.message);}
  else if(serverAttempted)cleanupErrors.push('Server startup outcome uncertain; no returned server handle');else serverClosed=true;
  let browserLeasesClosed=false,inputsVerified=false,runtimeVerified=false;
  try{if(binding){leasesAbsent(binding,runtime.pin.manifestHash);browserLeasesClosed=true;}}catch(e){cleanupErrors.push('Browser binding: '+e.message);}
  try{same(validateFeedbackInputs(jobDir,manifest,snapshots,{checkLive:false}),input,'Immutable inputs changed after execution');inputsVerified=true;}catch(e){cleanupErrors.push('Immutable input closure: '+e.message);}
  if(inputsVerified)try{validateFeedbackInputs(jobDir,manifest,snapshots);}catch(e){contentDrift={reason:e.message,at:new Date().toISOString()};exitCode=1;renderPassed=false;}
  try{same(runtimeGuard(manifest.request.runtime).guard,runtime?.guard,'Runtime changed after execution');runtimeVerified=true;}catch(e){cleanupErrors.push('Runtime closure: '+e.message);}
  const childNotStarted=!checkerAttempted&&!childRecord&&!fs.existsSync(path.join(attempt,'checker-spawn-intent.json'))&&!fs.existsSync(path.join(attempt,'child-started.json'));
  if(childNotStarted)atomic(path.join(attempt,'child-not-started.json'),{token,childNotStarted:true,method:'no-checker-spawn-intent-or-child-start',serverAttempted,at:new Date().toISOString()});
  let childDead=false;if(!childNotStarted)try{requireDeadChild(childRecord);childDead=true;}catch(e){cleanupErrors.push('Child closure: '+e.message);}
  const localResourcesClosed=serverClosed&&!spawnError&&(childNotStarted||childKnownClosed&&childDead);
  const resourceObservationKnown=!resourceRefusal||Number.isFinite(resourceRefusal.observation?.freeMemoryBytes)&&Number.isFinite(resourceRefusal.observation?.freeDiskBytes);
  const closed=localResourcesClosed&&browserLeasesClosed&&inputsVerified&&runtimeVerified&&resourceObservationKnown&&cleanupErrors.length===0;
  const closure={kind:'render-queue-closure-v1',token,closed,serverClosed,browserLeasesClosed,localResourcesClosed,exitCode,renderPassed,report:reportArtifact,actualVisualAcceptance:false,attempted,checkerAttempted,childNotStarted,resourceRefusal,admissionRefusal,contentDrift,child:childRecord,childKnownClosed,spawnError,inputs:input??null,runtime:runtime?.guard??null,binding:binding??null,error:error?.message??null,cleanupErrors,at:new Date().toISOString()};
  atomic(path.join(attempt,'outcome.json'),closure);atomic(closureFile,closure);
 }
 return read(closureFile);
}

export function assertNoCheckerStartProof({attempt,token,closure:c}){
 if(c.childNotStarted!==true||c.checkerAttempted!==false||c.child!==null||c.exitCode!==1||c.renderPassed||fs.existsSync(path.join(attempt,'checker-spawn-intent.json'))||fs.existsSync(path.join(attempt,'child-started.json'))||fs.existsSync(path.join(attempt,'child-exited.json')))throw Error('No-checker-start proof invalid');
 const proof=read(path.join(attempt,'child-not-started.json'));if(proof.token!==token||proof.childNotStarted!==true||proof.method!=='no-checker-spawn-intent-or-child-start'||proof.serverAttempted!==c.attempted)throw Error('No-checker-start record absent/foreign');
}
export function verifyFeedbackClosure({jobDir,token,manifest}){
 jobDir=direct(jobDir);const attempt=tokenPath(jobDir,token),file=path.join(attempt,'closure.json');regular(file);const c=read(file);
 if(c.kind!=='render-queue-closure-v1'||c.token!==token||!c.closed||!c.serverClosed||!c.browserLeasesClosed||!c.localResourcesClosed||c.spawnError||!Number.isInteger(c.exitCode))throw Error('Incomplete/foreign render closure; retain ownership');
 const snapshots=Object.fromEntries(manifest.inputs.map(i=>[i.role,path.join(jobDir,'inputs',i.role)]));same(validateFeedbackInputs(jobDir,manifest,snapshots,{checkLive:false}),c.inputs,'Closure immutable input guards changed');let lateContentDrift=null;if(c.exitCode===0)try{validateFeedbackInputs(jobDir,manifest,snapshots);}catch(e){lateContentDrift={reason:e.message,at:new Date().toISOString()};}same(runtimeGuard(manifest.request.runtime).guard,c.runtime,'Closure runtime guards changed');
 const binding=leasesAbsent(c.binding,c.runtime.pinHash);if(norm(binding.operationDir)!==norm(path.join(attempt,'browser-operation')))throw Error('Foreign browser operation');
 if(c.admissionRefusal){const refusal=read(path.join(attempt,'admission-refused.json'));same(refusal,{token,...c.admissionRefusal},'Admission refusal cause changed');if(refusal.code!=='RENDER_ADMISSION_REFUSAL'||typeof refusal.cause!=='string'||!refusal.cause)throw Error('Admission refusal cause absent');}
 if(c.resourceRefusal){const o=c.resourceRefusal.observation;if(!o||!Number.isFinite(o.freeMemoryBytes)||!Number.isFinite(o.freeDiskBytes)||!(o.freeMemoryBytes<6*2**30||o.freeDiskBytes<3*2**30))throw Error('Finite resource refusal below-floor evidence required');}
 if(c.attempted){const intent=read(path.join(attempt,'server-spawn-intent.json')),started=read(path.join(attempt,'server-started.json')),ended=read(path.join(attempt,'server-closed.json'));if(intent.token!==token||started.token!==token||ended.token!==token||ended.closed!==true||ended.method!=='existing-startFrozenVerificationServer.close-resolved')throw Error('Server closed proof absent');same(started.info,ended.info,'Server identity proof changed');same(ended.runtime,c.runtime,'Server runtime proof changed');}
 else if(fs.existsSync(path.join(attempt,'server-spawn-intent.json'))||fs.existsSync(path.join(attempt,'server-started.json')))throw Error('Server startup intent requires normal close proof');
 if(c.childNotStarted){assertNoCheckerStartProof({attempt,token,closure:c});same(read(path.join(attempt,'outcome.json')),c,'Outcome/closure disagree');return lateContentDrift?{...c,contentDrift:lateContentDrift}:c;}
 if(!c.attempted||!c.checkerAttempted||!c.childKnownClosed)throw Error('Child closure unknown');const checkerIntent=read(path.join(attempt,'checker-spawn-intent.json'));if(checkerIntent.token!==token)throw Error('Checker intent token mismatch');
 const childStart=read(path.join(attempt,'child-started.json')),childEnd=read(path.join(attempt,'child-exited.json'));same(childStart,c.child,'Child birth identity changed');same(childEnd.child,c.child,'Child exit identity changed');same(checkerIntent.args,childStart.args,'Checker arguments differ from intent');if(norm(checkerIntent.executable)!==norm(c.runtime.nodeExecutable)||childEnd.token!==token||!childEnd.closed||!Number.isInteger(childEnd.exitCode)||childStart.token!==token||!Number.isInteger(childStart.pid)||!childStart.birth||norm(childStart.executable)!==norm(c.runtime.nodeExecutable))throw Error('Child closure proof incomplete');requireDeadChild(childStart);
 if(c.report){if(norm(c.report.file)!==norm(path.join(attempt,'output/feedback-pages.json'))||hash(c.report.file)!==c.report.sha256)throw Error('Checker report changed');const report=read(c.report.file);if(report.projectId!==c.report.projectId||report.passed!==c.report.passed)throw Error('Checker disposition changed');}
 if(c.exitCode===0&&(!c.renderPassed||childEnd.exitCode!==0||!c.report||c.report.projectId!==manifest.request.projectId||c.report.passed!==true))throw Error('Successful checker report proof absent');
 same(read(path.join(attempt,'outcome.json')),c,'Outcome/closure disagree');return lateContentDrift?{...c,contentDrift:lateContentDrift}:c;
}


