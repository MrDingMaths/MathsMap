import {diagramVersion as installedDiagramVersion} from 'virtual:booklet-render-version';
// The compiled-diagram cache client. Kept apart from the layout cache so layout
// and measurement changes do not change the diagram fingerprint.
export const cacheMode=()=>globalThis.__bookletCacheMode??'normal';
let runtime;
export async function renderEnvironment(){
  if(cacheMode()==='off')return null;
  return runtime??=(async()=>{try{
    const r=await fetch('/__booklet/render-cache/version',{signal:AbortSignal.timeout(5000)}),v=await r.json();
    return r.ok&&v.diagramVersion===installedDiagramVersion?{version:v.diagramVersion}:null;
  }catch{return null;}})();
}
export async function digestKey(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function serverDiagram(version,key){
  if(!version||['server-off','off'].includes(cacheMode()))return null;
  try{
    const r=await fetch('/__booklet/render-cache/'+version+'/'+key,{signal:AbortSignal.timeout(1500)});if(!r.ok)return null;const row=await r.json();
    if(row.version!==version||row.key!==key||typeof row.svg!=='string'||!row.svg.trim().startsWith('<svg')||await digestKey(row.svg)!==row.checksum)return null;
    return row.svg;
  }catch{return null;}
}
