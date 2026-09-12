import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
export const RENDER_CACHE_ROOT=path.resolve('.booklet-work/render-cache');
const hash=v=>createHash('sha256').update(v).digest('hex');
const fileHash=async file=>hash(await fs.readFile(file));
async function filesUnder(root){return (await Promise.all((await fs.readdir(root,{withFileTypes:true})).map(e=>e.isDirectory()?filesUnder(path.join(root,e.name)):path.join(root,e.name)))).flat().sort();}
export async function rendererFingerprint(root=process.cwd()){
  const files=[...await filesUnder(path.join(root,'src')),...await filesUnder(path.join(root,'data')).catch(()=>[]),...await filesUnder(path.join(root,'public/libs')),...await filesUnder(path.join(root,'node_modules/katex/dist/fonts')).catch(()=>[]),path.join(root,'index.html'),path.join(root,'package-lock.json')],rows=[];
  for(const file of files)rows.push([path.relative(root,file),await fileHash(file)]);
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
  const rows=[];for(const url of [...new Set(urls)].sort()){
    if(!url.startsWith('/')||url.startsWith('//'))return null;
    try{rows.push([url,await fileHash(assetFile(url,root))]);}catch{return null;}
  }return hash(JSON.stringify(rows));
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
export function renderCachePlugin(){
  const install=server=>{server.middlewares.use(async(req,res,next)=>{
    const url=new URL(req.url??'/','http://localhost');if(!url.pathname.startsWith('/__booklet/render-cache/'))return next();
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
    try{
      if(req.method!=='GET'){res.statusCode=405;return res.end('{}');}
      if(url.pathname==='/__booklet/render-cache/version'){
        const assets=JSON.parse(url.searchParams.get('assets')??'[]');if(!Array.isArray(assets)||assets.length>1000||assets.some(v=>typeof v!=='string'))throw Error('Invalid assets');
        return res.end(JSON.stringify({version:await rendererFingerprint(),assets:await assetFingerprint(assets)}));
      }
      const match=/^\/__booklet\/render-cache\/([a-f0-9]{64})\/([a-z0-9-]+)$/.exec(url.pathname),entry=match&&await readRenderEntry(match[1],match[2]);
      res.statusCode=entry?200:404;res.end(JSON.stringify(entry??{}));
    }catch{res.statusCode=503;res.end('{}');}
  });};return {name:'booklet-render-cache',configureServer:install,configurePreviewServer:install,
    resolveId(id){if(id==='virtual:booklet-render-version')return '\0booklet-render-version';},
    async load(id){if(id==='\0booklet-render-version')return 'export default '+JSON.stringify(await rendererFingerprint())+';';},
    handleHotUpdate({file,server,modules}){if(!file.replaceAll('\\','/').match(/\/(src|public\/libs|node_modules\/katex\/dist\/fonts)\/|\/(index\.html|package-lock\.json)$/))return;const module=server.moduleGraph.getModuleById('\0booklet-render-version');if(module){server.moduleGraph.invalidateModule(module);return [...modules,module];}}
  };
}
// Only trusted export/warming tools publish; HTTP cache clients are read-only.
export async function publishBrowserDiagrams(page){
  const data=await page.evaluate(()=>window.TikZ?.cacheEntries?.()??null);
  if(!data?.version)return {published:0};
  if(data.version!==await rendererFingerprint())throw Error('Renderer changed during cache warming; rerun with settled inputs');
  return {version:data.version,published:await publishRenderEntries(data.version,data.entries)};
}
