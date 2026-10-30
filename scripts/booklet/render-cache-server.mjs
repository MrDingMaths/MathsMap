import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {rendererSignature} from './verification-cache.mjs';
export const RENDER_CACHE_ROOT=path.resolve('.booklet-work/render-cache');
const hash=v=>createHash('sha256').update(v).digest('hex');
const fileHash=async file=>hash(await fs.readFile(file));
// Read every input on every validation, with bounded I/O concurrency. Hash order
// stays deterministic; neither timestamps nor a time window establish validity.
async function hashRows(files,root,readHash=fileHash){
  const rows=new Array(files.length);let index=0;
  await Promise.all(Array.from({length:Math.min(32,files.length)},async()=>{
    while(index<files.length){const i=index++,file=files[i];rows[i]=[path.relative(root,file),await readHash(file)];}
  }));return rows;
}
// Cached SVGs are captured before page layout/calibration. Prepared TeX is
// already in the entry key; unrelated screens must not invalidate compilation.
// Keep the runtime dependency closure covered by booklet-load-cache.test.js.
export const DIAGRAM_RENDER_INPUTS=[
  'src/lib/tikz.js','src/lib/tikz-prepare.js','src/lib/diagram-colours.js',
  'src/lib/diagram-typography.js','src/lib/diagram-label-space.js','src/lib/graph-strokes.js','src/lib/svg-paint-scope.js',
  'src/lib/diagram-cache-client.js',
  'src/lib/diagram-label-geometry.js',
];
async function filesUnder(root){return (await Promise.all((await fs.readdir(root,{withFileTypes:true})).map(e=>e.isDirectory()?filesUnder(path.join(root,e.name)):path.join(root,e.name)))).flat().sort();}
// Compiled SVGs can only depend on modules the diagram path can execute. Follow
// its static relative imports; anything unresolved or dynamic widens to every
// shared library, the previous conservative scope. The TikZ engine is loaded by
// URL rather than imported, so its whole directory always participates.
export async function diagramInputFiles(root=process.cwd()){
  const files=new Set(),pending=DIAGRAM_RENDER_INPUTS.map(file=>path.join(root,file));let wide=false;
  while(pending.length){
    const file=pending.pop();if(files.has(file))continue;files.add(file);
    if(!/\.(?:[cm]?js)$/.test(file))continue;
    let source;try{source=await fs.readFile(file,'utf8');}catch{continue;}
    if(/import\.meta\.glob|\bimport\s*\(\s*[^'"\s)]/.test(source))wide=true;
    for(const match of source.matchAll(/(?:\b(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)){
      if(!match[1].startsWith('.'))continue;
      const target=path.resolve(path.dirname(file),match[1].split('?')[0]);
      try{if((await fs.stat(target)).isFile())pending.push(target);else wide=true;}catch{wide=true;}
    }
  }
  const libraries=path.join(root,'public/libs');
  for(const file of await filesUnder(wide?libraries:path.join(libraries,'tikzjax')).catch(()=>[]))files.add(file);
  files.add(path.join(root,'package-lock.json'));
  return [...files].sort();
}
// A module that marks its output-determining code (TikZ input and SVG capture)
// versions diagrams by those regions alone, so job scheduling, watchdog and
// measurement edits keep compiled SVGs. Unmarked files are hashed whole.
export function diagramOutputSource(source){
  const regions=[...source.matchAll(/\/\/ diagram-output:begin\r?\n([\s\S]*?)\/\/ diagram-output:end/g)].map(match=>match[1].replace(/\r\n/g,'\n'));
  return regions.length?'diagram-output-regions\n'+regions.join('\n---\n'):source;
}
const diagramInputHash=async file=>/\.(?:[cm]?js)$/.test(file)?hash(diagramOutputSource(await fs.readFile(file,'utf8'))):fileHash(file);
// The entry key already hashes the prepared TeX (colour policy, palette,
// typography, packages and extra preamble), so modules that only shape that TeX
// cannot make a cached entry wrong. The version covers what can change the SVG
// for a fixed key: the engine, the base preamble and SVG capture. Stroke and
// label refits run from observers after capture and never reach the cache.
// diagramInputFiles keeps the whole closure for candidate-override checks.
export const DIAGRAM_VERSION_INPUTS=['src/lib/tikz.js','src/lib/tikz-prepare.js'];
export async function diagramVersionFiles(root=process.cwd()){
  const engine=await filesUnder(path.join(root,'public/libs/tikzjax')).catch(()=>[]);
  return [...DIAGRAM_VERSION_INPUTS.map(file=>path.join(root,file)),...engine].sort();
}
export async function diagramInputRows(root=process.cwd(),readHash=diagramInputHash){
  return hashRows(await diagramVersionFiles(root),root,readHash);
}
export async function diagramFingerprint(root=process.cwd(),readHash=diagramInputHash){
  return hash(JSON.stringify(['booklet-diagram-cache-v2',await diagramInputRows(root,readHash)]));
}
export async function rendererFingerprint(root=process.cwd(),readHash=fileHash){
  const files=[...await filesUnder(path.join(root,'src')),...await filesUnder(path.join(root,'data')).catch(()=>[]),...await filesUnder(path.join(root,'public/libs')),...await filesUnder(path.join(root,'node_modules/katex/dist/fonts')).catch(()=>[]),path.join(root,'index.html'),path.join(root,'package-lock.json')],rows=[];
  rows.push(...await hashRows(files,root,readHash));
  return hash(JSON.stringify(['booklet-render-cache-v2',rows]));
}
function assetFile(url,root){
  const pathname=new URL(url,'http://local').pathname;
  let base=path.join(root,'public'),relative=decodeURIComponent(pathname).replace(/^\/+/, '');
  const source=/^\/__booklet\/full-imports\/([^/]+)\/files\/(.*)$/.exec(pathname);
  if(source){base=path.join(root,'.booklet-work/full-imports');relative=decodeURIComponent(source[1]+'/'+source[2]);}
  const target=path.resolve(base,relative);if(!target.startsWith(path.resolve(base)+path.sep))throw Error('Invalid cache asset path');return target;
}
export async function assetFingerprint(urls,root=process.cwd()){
  const sorted=[...new Set(urls)].sort();
  if(sorted.some(url=>!url.startsWith('/')||url.startsWith('//')))return null;
  try{const rows=await hashRows(sorted.map(url=>assetFile(url,root)),root);return hash(JSON.stringify(sorted.map((url,i)=>[url,rows[i][1]])));}catch{return null;}
}
const validToken=v=>/^[a-z0-9-]{1,100}$/.test(v);
export async function publishRenderEntries(version,entries,{cacheRoot=RENDER_CACHE_ROOT}={}){
  if(!/^[a-f0-9]{64}$/.test(version))throw Error('Invalid renderer fingerprint');
  const directory=path.join(cacheRoot,version);await fs.mkdir(directory,{recursive:true});let count=0;
  for(const {key,svg} of entries){
    if(!validToken(key)||typeof svg!=='string'||!svg.trim().startsWith('<svg')||/<(?:script|animate)\b/i.test(svg))throw Error('Invalid compiled diagram');
    const file=path.join(directory,key+'.json'),temp=file+'.'+randomUUID()+'.tmp';
    await fs.writeFile(temp,JSON.stringify({key,version,svg,checksum:hash(svg)}));await fs.rename(temp,file);count++;
  }return count;
}
export async function readRenderEntry(version,key,{cacheRoot=RENDER_CACHE_ROOT}={}){
  if(!/^[a-f0-9]{64}$/.test(version)||!validToken(key))return null;
  try{const row=JSON.parse(await fs.readFile(path.join(cacheRoot,version,key+'.json'),'utf8'));return row.key===key&&row.version===version&&hash(row.svg)===row.checksum?row:null;}catch{return null;}
}
// Every root rendererFingerprint or the lean signature reads. The virtual module
// and /version share one memo that the watcher clears for any of them, so the
// browser's installed version can never drift from the server's answer.
const RENDER_INPUT=/\/(src|data|public\/libs|node_modules\/katex\/dist)\/|\/(index\.html|package-lock\.json)$/;
export function renderCachePlugin(){
  let versions=null;
  const currentVersions=()=>versions??=(async()=>{
    const memo=(reads,read)=>file=>{if(!reads.has(file))reads.set(file,read(file));return reads.get(file);};
    const [version,diagramVersion]=await Promise.all([rendererFingerprint(process.cwd(),memo(new Map(),fileHash)),diagramFingerprint(process.cwd(),memo(new Map(),diagramInputHash))]);
    return {version,diagramVersion,leanVersion:rendererSignature({lean:true})};
  })().catch(error=>{versions=null;throw error;});
  const invalidate=(file,server)=>{
    if(!RENDER_INPUT.test(file.replaceAll('\\','/')))return null;
    versions=null;const module=server.moduleGraph.getModuleById('\0booklet-render-version');
    if(module)server.moduleGraph.invalidateModule(module);return module;
  };
  const install=server=>{
    // handleHotUpdate sees changes only; additions and deletions also change the fingerprint.
    if(server.watcher)for(const event of ['add','unlink'])server.watcher.on(event,file=>{const module=invalidate(file,server);if(module)server.ws?.send({type:'full-reload'});});
    server.middlewares.use(async(req,res,next)=>{
    const url=new URL(req.url??'/','http://localhost');if(!url.pathname.startsWith('/__booklet/render-cache/'))return next();
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
    try{
      if(req.method!=='GET'){res.statusCode=405;return res.end('{}');}
      if(url.pathname==='/__booklet/render-cache/version'){
        const assets=JSON.parse(url.searchParams.get('assets')??'[]');if(!Array.isArray(assets)||assets.length>1000||assets.some(v=>typeof v!=='string'))throw Error('Invalid assets');
        const [current,assetVersion]=await Promise.all([currentVersions(),assetFingerprint(assets)]);
        return res.end(JSON.stringify({version:url.searchParams.get('lean')==='1'?current.leanVersion:current.version,diagramVersion:current.diagramVersion,assets:assetVersion}));
      }
      const match=/^\/__booklet\/render-cache\/([a-f0-9]{64})\/([a-z0-9-]+)$/.exec(url.pathname),entry=match&&await readRenderEntry(match[1],match[2]);
      res.statusCode=entry?200:404;res.end(JSON.stringify(entry??{}));
    }catch{res.statusCode=503;res.end('{}');}
  });};return {name:'booklet-render-cache',configureServer:install,configurePreviewServer:install,
    resolveId(id){if(id==='virtual:booklet-render-version')return '\0booklet-render-version';},
    async load(id){if(id==='\0booklet-render-version'){const current=await currentVersions();return 'export default '+JSON.stringify(current.version)+'; export const diagramVersion = '+JSON.stringify(current.diagramVersion)+'; export const leanVersion = '+JSON.stringify(current.leanVersion)+';';}},
    handleHotUpdate({file,server,modules}){const module=invalidate(file,server);if(module)return [...modules,module];}
  };
}
// Only trusted export/warming tools publish; HTTP cache clients are read-only.
export async function publishBrowserDiagrams(page){
  const data=await page.evaluate(()=>window.TikZ?.cacheEntries?.()??null);
  if(!data?.version)return {published:0};
  // Compare with the server that compiled them: a frozen snapshot versions by
  // its own copy of this file, which may differ from the live checkout's.
  const served=await page.evaluate(async()=>{try{return (await (await fetch('/__booklet/render-cache/version',{cache:'no-store'})).json()).diagramVersion;}catch{return null;}});
  if(data.version!==served)throw Error('Diagram renderer changed during cache warming; rerun with settled inputs');
  const published=await publishRenderEntries(data.version,data.entries);
  // Record what this version was built from so a later invalidation can be attributed.
  if(published&&data.version===await diagramFingerprint())await fs.writeFile(path.join(RENDER_CACHE_ROOT,data.version,'_inputs.manifest'),JSON.stringify(await diagramInputRows())).catch(()=>{});
  return {version:data.version,published};
}
