import installedVersion,{leanVersion as installedLeanVersion} from 'virtual:booklet-render-version';
import {createMeasurementStore} from './booklet-cache-store.js';
import {isLeanReview} from './booklet-review-profile.js';
import {cacheMode} from './diagram-cache-client.js';
export {cacheMode,renderEnvironment,digestKey,serverDiagram} from './diagram-cache-client.js';
export const measurementStore=createMeasurementStore();
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
// One validation per asset list per session: renderer changes replace this
// module through HMR, and opening, changing edition or returning to the tab
// revalidates. Re-hashing on every edit cost 260–425 ms per typing pause.
const validated=new Map();
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')validated.clear();});
async function validateContext(lean,assets){
  try{
    const r=await fetch('/__booklet/render-cache/version?assets='+encodeURIComponent(assets)+(lean?'&lean=1':''),{signal:AbortSignal.timeout(5000)}),v=await r.json();
    if(!r.ok||!v.assets||v.version!==(lean?installedLeanVersion:installedVersion))return null;
    return JSON.stringify([v.version,v.assets,navigator.userAgent,devicePixelRatio]);
  }catch{return null;}
}
export async function dimensionCacheContext(project,{fresh=false}={}){
  if(['measurements-off','off'].includes(cacheMode()))return null;
  const lean=isLeanReview(project),assets=JSON.stringify(measurementAssets(project)),id=(lean?'lean:':'')+assets;
  if(fresh||!validated.has(id)){validated.set(id,validateContext(lean,assets));if(validated.size>20)validated.delete(validated.keys().next().value);}
  return validated.get(id);
}
// Same code and same tab: in-memory sizes stay valid when persistent validation
// fails, so a failed check disables IndexedDB reuse instead of every reuse.
export function sessionCacheContext(project){
  if(['measurements-off','off'].includes(cacheMode()))return null;
  return JSON.stringify(['session',isLeanReview(project)?installedLeanVersion:installedVersion,measurementAssets(project),navigator.userAgent,devicePixelRatio]);
}
