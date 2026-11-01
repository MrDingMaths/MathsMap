// One execution copy for an import campaign; source documents and candidates
// remain explicit canonical inputs, never renderer dependencies.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {copyFrozenDependencies,verifyFrozenDependencies} from './frozen-dependencies.mjs';
import {copyFrozenEngines} from './frozen-engines.mjs';

export const PIN_FILE='.mathsmap-runtime-pin.json';
const sha=value=>createHash('sha256').update(value).digest('hex');
const fileBuffer=Buffer.allocUnsafe(1024*1024);
const hash=file=>{const digest=createHash('sha256'),fd=fs.openSync(file,'r');try{let count;while((count=fs.readSync(fd,fileBuffer,0,fileBuffer.length,null)))digest.update(fileBuffer.subarray(0,count));return digest.digest('hex');}finally{fs.closeSync(fd);}};
const inside=(root,file)=>{const r=path.relative(root,file);return r===''||r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r);};
const entries=['src','data','public','scripts','polish','checks','paginate','first-pass','bench','sweep','docs','AGENTS.md','index.html','vite.config.js','package.json','package-lock.json'];
export const PIN_OVERLAYS=['scripts/booklet/frozen-runtime-pin.mjs','scripts/booklet/frozen-dependencies.mjs','scripts/booklet/frozen-engines.mjs','scripts/booklet/browser-launch.mjs','scripts/booklet/browser-engine-mirror.mjs','scripts/booklet/browser-mirror-lifecycle.mjs','scripts/booklet/import-verification-runtime.mjs','scripts/booklet/lean-review.mjs','scripts/booklet/lean-import.mjs','scripts/booklet/transcription.mjs','first-pass/review.mjs','bench/render-geometry.mjs','paginate/optimise.mjs','scripts/booklet/check-compact-exercises.mjs','scripts/booklet/check-feedback-pages.mjs','scripts/booklet/export-pdf.mjs'];

export function readPinnedRuntime(root){
 const file=path.join(path.resolve(root),PIN_FILE);
 if(!fs.existsSync(file))return null;
 const bytes=fs.readFileSync(file),manifest=JSON.parse(bytes);
 if(manifest.version!==1||path.resolve(manifest.root)!==path.resolve(root)||!Array.isArray(manifest.files))throw Error('Invalid pinned execution runtime');
 return {...manifest,manifestHash:sha(bytes)};
}
export function verifyPinnedRuntime(root){
 const pin=readPinnedRuntime(root);if(!pin)throw Error('No pinned execution runtime: '+root);
 for(const row of pin.files){
  const file=path.resolve(root,row.path);
  if(!inside(root,file)||!fs.existsSync(file)||fs.lstatSync(file).isSymbolicLink()||hash(file)!==row.hash)throw Error('Pinned execution file changed: '+row.path);
 }
 verifyFrozenDependencies(root,pin.dependencies);
 const expected=new Set(pin.files.map(row=>row.path));
 const scan=name=>{if(['node_modules','.booklet-work',PIN_FILE].includes(name))return;const file=path.join(root,name);if(!fs.existsSync(file))return;const stat=fs.lstatSync(file);if(stat.isSymbolicLink())throw Error('Link in pinned execution files: '+name);if(stat.isDirectory())for(const child of fs.readdirSync(file))scan(path.join(name,child));else if(!expected.has(name.replaceAll('\\','/')))throw Error('Unexpected pinned execution file: '+name);};
 fs.readdirSync(root).forEach(scan);
 return pin;
}

// Git supplies small host-tool directories missing from the older print-only
// snapshot. The proven renderer bytes come from that snapshot, not a live edit.
export function createPinnedRuntime({sourceRoot=process.cwd(),out,revision='HEAD',baselineManifest,overlays=PIN_OVERLAYS,engines}){
 sourceRoot=path.resolve(sourceRoot);out=path.resolve(out);
 revision=execFileSync('git',['rev-parse',revision],{cwd:sourceRoot,encoding:'utf8'}).trim();
 if(!inside(path.join(sourceRoot,'.booklet-work'),out)||fs.existsSync(out))throw Error('Use a fresh ignored .booklet-work pin directory');
 const baseline=baselineManifest?JSON.parse(fs.readFileSync(baselineManifest)):null;
 const baselineFiles=new Map((baseline?.files??[]).map(row=>[row.path,row]));
 const names=execFileSync('git',['ls-tree','-r','--name-only',revision,'--',...entries],{cwd:sourceRoot,encoding:'utf8'}).trim().split(/\r?\n/).filter(name=>name&&(!name.startsWith('docs/')||/^docs\/[^/]+\.md$/.test(name)));
 const selected=new Set([...names,...baselineFiles.keys(),...overlays]),root=path.join(out,'runtime'),files=[];
 fs.mkdirSync(root,{recursive:true});
 for(const name of [...selected].sort()){
  if(!inside(root,path.resolve(root,name)))throw Error('Invalid runtime entry: '+name);
  let bytes;
  if(overlays.includes(name))bytes=fs.readFileSync(path.join(sourceRoot,name));
  else if(baselineFiles.has(name)){
   const original=path.join(baseline.snapshot,name);bytes=fs.readFileSync(original);
   if(sha(bytes)!==baselineFiles.get(name).hash)throw Error('Baseline runtime changed: '+name);
  }else bytes=execFileSync('git',['show',revision+':'+name],{cwd:sourceRoot,maxBuffer:64*1024*1024});
  const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});files.push({path:name,hash:sha(bytes)});
 }
 if(hash(path.join(root,'package-lock.json'))!==hash(path.join(sourceRoot,'package-lock.json')))throw Error('Installed dependency lock differs from the pinned baseline');
 const dependencies=copyFrozenDependencies(sourceRoot,root);
 const frozenEngines=engines?copyFrozenEngines(root,engines):null;
 const manifest={version:1,root,sourceRoot,workRoot:path.join(sourceRoot,'.booklet-work/full-imports'),revision,baselineFilesDigest:baseline?sha(JSON.stringify(baseline.files)):null,files:[...files,...(frozenEngines?.files??[])],dependencies,engines:frozenEngines,createdAt:new Date().toISOString(),node:{executable:process.execPath,version:process.version,hash:hash(process.execPath)}};
 fs.writeFileSync(path.join(root,PIN_FILE),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return verifyPinnedRuntime(root);
}

const pathOptions=new Set(['--project-file','--out','--exports','--sample','--visibility-reviews','--corrections','--config','--runs','--pool','--teaching-exports','--teaching-project-file','--previous-exports']);
export function pinnedArguments(args,pin,cwd=process.cwd()){
 const result=[];
 for(let i=0;i<args.length;i++){
  const key=args[i];if(key==='--runtime-root'){i++;continue;}
  result.push(key);
  if(pathOptions.has(key)&&args[i+1])result.push(path.resolve(cwd,args[++i]));
  else if(key==='--run-id'&&args[i+1]){const id=args[++i];result.push(path.isAbsolute(id)?id:path.join(pin.workRoot,id));}
 }
 return result;
}

// Dispatch before a command begins any work. The child loads the CLI and every
// lazy module from the copy; the launcher never runs candidate checks itself.
export async function dispatchPinnedCli(metaUrl,args){
 const index=args.indexOf('--runtime-root');
 if(index<0){
  if(process.env.MATHSMAP_RUNTIME_PIN_HASH){const root=path.resolve(path.dirname(fileURLToPath(metaUrl)),'../..'),pin=verifyPinnedRuntime(root);if(pin.manifestHash!==process.env.MATHSMAP_RUNTIME_PIN_HASH)throw Error('Pinned execution manifest changed before launch');if(path.resolve(process.execPath)!==path.resolve(pin.engines?.node.executable??''))throw Error('Pinned CLI must use its copied Node executable');}
  return false;
 }
 if(!args[index+1])throw Error('--runtime-root needs a pinned directory');
 const pin=verifyPinnedRuntime(path.resolve(args[index+1]));
 if(!pin.engines?.node?.executable||!pin.engines?.browser?.executable)throw Error('Pinned execution requires copied Node and browser engines');
 const relative=path.relative(pin.sourceRoot,fileURLToPath(metaUrl));
 if(!['scripts/booklet/lean-review.mjs','scripts/booklet/lean-import.mjs'].includes(relative.replaceAll('\\','/')))throw Error('Unsupported pinned entry point');
 const forwarded=pinnedArguments(args,pin),runIndex=forwarded.indexOf('--run-id'),runDir=runIndex<0?null:forwarded[runIndex+1];
 let server,binding,failure;
 try{
  if(['finish','sample','export','content','shading'].includes(args[0])){
   if(!runDir||!inside(pin.workRoot,runDir))throw Error('Pinned finish needs a canonical run');
   const {startFrozenVerificationServer}=await import(pathToFileURL(path.join(pin.root,'scripts/booklet/import-verification-runtime.mjs')).href);
   const operation=path.join(runDir,'lean-review','pinned-server',String(Date.now()));fs.mkdirSync(operation,{recursive:true});
   server=await startFrozenVerificationServer({snapshot:pin.root,pin},operation);
  }
  if(!runDir||!inside(pin.workRoot,runDir))throw Error('Pinned command needs a canonical run for its private browser mirror');
  const {createPrivateMirror,verifyPrivateMirror}=await import('./browser-engine-mirror.mjs');
  const mirrorParent=path.join(runDir,'lean-review','browser-mirrors');fs.mkdirSync(mirrorParent,{recursive:true});
  binding=createPrivateMirror(pin.root,path.join(mirrorParent,`${Date.now()}-${process.pid}`));
  const browser=verifyPrivateMirror(binding.receiptFile,binding.receiptSha256,pin.manifestHash);
  const env={...process.env,NODE_ENV:'development',MATHSMAP_BOOKLET_WORK_ROOT:pin.workRoot,MATHSMAP_RUNTIME_PIN_HASH:pin.manifestHash,MATHSMAP_BOOKLET_CHROMIUM:browser.executable,MATHSMAP_BROWSER_MIRROR_RECEIPT:binding.receiptFile,MATHSMAP_BROWSER_MIRROR_SHA256:binding.receiptSha256,MATHSMAP_BOOKLET_BASE:server?'http://127.0.0.1:'+server.info.port:'http://127.0.0.1:1'};
  delete env.NODE_PATH;delete env.NODE_OPTIONS;
  const status=await new Promise((resolve,reject)=>{const child=spawn(pin.engines.node.executable,[path.join(pin.root,relative),...forwarded],{cwd:pin.root,env,windowsHide:true,stdio:'inherit'});child.once('error',reject);child.once('close',resolve);});
  process.exitCode=status??1;return true;
 }catch(error){failure=error;throw error;}
 finally{
  const errors=[];try{await server?.close();}catch(error){errors.push(error);}
  try{if(verifyPinnedRuntime(pin.root).manifestHash!==pin.manifestHash)throw Error('Pinned runtime changed');}catch(error){errors.push(error);}
  if(binding)try{const {verifyPrivateMirror}=await import('./browser-engine-mirror.mjs');verifyPrivateMirror(binding.receiptFile,binding.receiptSha256,pin.manifestHash);if(fs.existsSync(path.join(path.dirname(binding.receiptFile),'browser-active.lease')))throw Error('Browser ownership remains unresolved; mirror lease retained');}catch(error){errors.push(error);}
  if(errors.length)throw new AggregateError(failure?[failure,...errors]:errors,'Pinned dispatch cleanup failed');
 }
}
