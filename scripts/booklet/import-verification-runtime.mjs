// Frozen copies include current uncommitted application bytes. No live server
// or project is stopped, migrated, saved or overwritten by this helper.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const entries=['src','data','public','scripts','index.html','vite.config.js','package.json','package-lock.json'];
export function snapshotFiles(root,names=entries){
 const files=[];const walk=relative=>{const file=path.join(root,relative);if(!fs.existsSync(file))return;const stat=fs.lstatSync(file);if(stat.isSymbolicLink())throw Error('Snapshot source must not be symbolic: '+relative);if(stat.isDirectory())for(const name of fs.readdirSync(file).sort())walk(path.join(relative,name));else if(stat.isFile())files.push({path:relative.replaceAll('\\','/'),hash:hash(file)});};
 names.forEach(walk);return files;
}
export function snapshotDifferences(root,files){
 const expected=new Set(files.map(row=>row.path)),actual=snapshotFiles(root),hashes=new Map(actual.map(row=>[row.path,row.hash]));
 return [...files.filter(row=>hashes.get(row.path)!==row.hash).map(row=>row.path),...actual.filter(row=>!expected.has(row.path)).map(row=>row.path)];
}
function attachSharedRenderCache(root,snapshot){
 const source=path.join(root,'.booklet-work/render-cache'),target=path.join(snapshot,'.booklet-work/render-cache');
 // The server has GET-only access; existing version/checksum guards validate
 // each SVG. Trusted export tools keep publishing through their usual path.
 if(fs.existsSync(source)&&!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.symlinkSync(source,target,process.platform==='win32'?'junction':'dir');}
}
export function prepareVerificationSnapshot({root=process.cwd(),out}){
 root=path.resolve(root);out=path.resolve(out);const snapshot=path.join(out,'runtime'),manifestFile=path.join(out,'runtime-manifest.json');
 const relative=path.relative(root,out);if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||!relative.replaceAll('\\','/').startsWith('.booklet-work/'))throw Error('Verification output must be a separate local .booklet-work directory');
 if(fs.existsSync(manifestFile)){
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  if(manifest.root!==root||manifest.snapshot!==snapshot)throw Error('Verification snapshot belongs to another workspace');
  const changed=[...snapshotDifferences(root,manifest.files),...snapshotDifferences(snapshot,manifest.files)];
  if(changed.length)throw Error('Verification snapshot changed; preserve this output and use a new output directory: '+[...new Set(changed)].slice(0,12).join(', '));
  attachSharedRenderCache(root,snapshot);
  return manifest;
 }
 if(fs.existsSync(snapshot))throw Error('Incomplete runtime snapshot; preserve it and select a fresh output directory');
 const files=snapshotFiles(root);fs.mkdirSync(snapshot,{recursive:true});
 for(const row of files){const target=path.join(snapshot,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,row.path),target);}
 if(snapshotDifferences(root,files).length||snapshotDifferences(snapshot,files).length)throw Error('Source changed while freezing the verification runtime');
 fs.symlinkSync(path.join(root,'node_modules'),path.join(snapshot,'node_modules'),process.platform==='win32'?'junction':'dir');
 attachSharedRenderCache(root,snapshot);
 const manifest={version:1,root,snapshot,files,createdAt:new Date().toISOString(),watch:false,hmr:false};
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2),{flag:'wx'});return manifest;
}
export async function startFrozenVerificationServer(manifest,out){
 // Plugins using process.cwd() and module constants must also see the frozen
 // root. Passing Vite's root in the parent's process does not isolate those.
 const script=`import {createServer} from 'vite';import path from 'node:path';
 const server=await createServer({root:process.cwd(),configFile:path.join(process.cwd(),'vite.config.js'),cacheDir:process.argv[1],server:{host:'127.0.0.1',port:0,strictPort:false,open:false,hmr:false,watch:null}});
 let closing=false;const close=async()=>{if(closing)return;closing=true;await server.close();process.exit(0);};process.on('message',m=>{if(m==='close')close();});process.on('disconnect',close);
 await server.listen();process.send({port:server.httpServer.address().port,cwd:process.cwd(),hmr:server.config.server.hmr,watch:server.config.server.watch});`;
 const child=spawn(process.execPath,['--input-type=module','-e',script,path.resolve(out,'vite-cache')],{cwd:manifest.snapshot,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
 const log=fs.createWriteStream(path.join(out,'frozen-server.log'),{flags:'a'});child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 let exited=false;const ended=new Promise(resolve=>child.once('close',()=>{exited=true;log.end();resolve();}));
 let info;
 try{info=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Frozen server startup timed out')),60000);const finish=(error,value)=>{clearTimeout(timer);error?reject(error):resolve(value);};child.once('message',m=>finish(null,m));child.once('error',e=>finish(e));child.once('exit',code=>finish(Error('Frozen server exited before readiness: '+code)));});}
 catch(error){child.kill();await ended;const diagnostic=fs.readFileSync(path.join(out,'frozen-server.log'),'utf8').slice(-2000);throw Error(error.message+'\n'+diagnostic);}
 const close=async()=>{if(exited)return;const timer=setTimeout(()=>child.kill(),10000);try{if(child.connected)child.send('close');else child.kill();await ended;}finally{clearTimeout(timer);}};
 if(path.resolve(info.cwd)!==manifest.snapshot||info.hmr!==false||info.watch!==null){await close();throw Error('Frozen server isolation configuration mismatch');}
 return {info,listen:async()=>{},httpServer:{address:()=>({port:info.port})},close};
}
export async function exportWithFrozenRuntime({root=process.cwd(),out,projectId,runDir,visibilityReviews,projectFile,regenerationReason,execute=runChecker,createServer}){
 if(!out||!projectId||!runDir)throw Error('Frozen export requires project ID, source run and output directory');
 const attempts=fs.existsSync(out)?fs.readdirSync(out).filter(n=>/^frozen-export-receipt-.*\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(out,n),'utf8'))):[];
 if(attempts.filter(r=>r.status!==0).length>=2&&!regenerationReason?.trim())throw Error('Diagnose repeated export failure before a third attempt; provide --regenerate-reason with the cause and changed approach');
 const manifest=prepareVerificationSnapshot({root,out}),inputs=[projectFile??path.join(root,'booklets/projects',projectId+'.json'),...(visibilityReviews?[visibilityReviews]:[])].map(file=>({file,hash:hash(file)}));
 let server,status,error;
 try{
  try{
   server=createServer?await createServer({root:manifest.snapshot,configFile:path.join(manifest.snapshot,'vite.config.js'),cacheDir:path.join(out,'vite-cache'),server:{host:'127.0.0.1',port:0,strictPort:false,open:false,hmr:false,watch:null}}):await startFrozenVerificationServer(manifest,out);
   await server.listen();const address=server.httpServer.address();if(!address||typeof address==='string')throw Error('Verification server address unavailable');
   const args=['scripts/booklet/check-compact-exercises.mjs','--projects',projectId,'--out',path.resolve(out),'--run-dir',path.resolve(runDir),'--base','http://127.0.0.1:'+address.port,'--fresh-edition-document',...(visibilityReviews?['--visibility-reviews',path.resolve(visibilityReviews)]:[]),...(projectFile?['--project-file',path.resolve(projectFile)]:[])];
   status=await execute({root:manifest.root,args});
  }catch(e){status=null;error=e.message;}
  const changed=[...snapshotDifferences(manifest.root,manifest.files),...snapshotDifferences(manifest.snapshot,manifest.files),...inputs.filter(i=>!fs.existsSync(i.file)||hash(i.file)!==i.hash).map(i=>i.file)];
  const receipt={version:1,at:new Date().toISOString(),status,error,regenerationReason:regenerationReason??null,changedDependencies:[...new Set(changed)],runtimeManifest:path.join(path.resolve(out),'runtime-manifest.json'),freshEditionDocuments:true,visualAcceptance:false};
  fs.writeFileSync(path.join(out,'frozen-export-receipt-'+Date.now()+'.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
  if(changed.length)throw Error('Export snapshot no longer matches live dependencies; passing artifacts remain preserved: '+changed.slice(0,12).join(', '));
  if(status!==0)throw Error('Export failed; resume the same output directory to reuse passed editions. Diagnose repeated failure before a third attempt.');
  return receipt;
 }finally{if(server)await server.close();}
}
async function runChecker({root,args}){
 const child=spawn(process.execPath,args,{cwd:root,windowsHide:true,stdio:'inherit'});return new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
}
