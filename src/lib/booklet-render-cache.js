import installedVersion from 'virtual:booklet-render-version';
import {createMeasurementStore} from './booklet-cache-store.js';
export const measurementStore=createMeasurementStore();
export const cacheMode=()=>globalThis.__bookletCacheMode??'normal';
let runtime;
export async function renderEnvironment(){
  if(cacheMode()==='off')return null;
  return runtime??=(async()=>{try{
    const r=await fetch('/__booklet/render-cache/version',{signal:AbortSignal.timeout(5000)}),v=await r.json();
    return r.ok&&v.version===installedVersion?v:null;
  }catch{return null;}})();
}
export function measurementAssets(project){
  const urls=new Set(),run=project.source?.runId??project.id;
  const visit=value=>{
    if(!value||typeof value!=='object')return;
    for(const [key,child] of Object.entries(value)){
      if(['sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','spec'].includes(key))continue;
      if(key==='src'&&typeof child==='string'&&!child.startsWith('data:'))urls.add(child.startsWith('evidence/')?'/__booklet/full-imports/'+encodeURIComponent(run)+'/files/lanes/exact/'+child:child);
      else if(typeof child==='object')visit(child);
    }
  };visit(project.sections);return [...urls];
}
export async function dimensionCacheContext(project){
  if(['measurements-off','off'].includes(cacheMode()))return null;
  try{
    const r=await fetch('/__booklet/render-cache/version?assets='+encodeURIComponent(JSON.stringify(measurementAssets(project))),{signal:AbortSignal.timeout(5000)}),v=await r.json();
    if(!r.ok||!v.assets||v.version!==installedVersion)return null;
    return JSON.stringify([v.version,v.assets,navigator.userAgent,devicePixelRatio]);
  }catch{return null;}
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
