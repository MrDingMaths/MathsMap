import {applySavePatch,createSavePatch} from './booklet-save-patch.js';
import {saveBookletProject} from './booklet-project-storage.js';
/** Seed once on open, then send changed branches. The existing endpoint and its
 * revision/bank checks remain authoritative. Response comparison happens off-thread. */
export function createBookletPersistence(){
 let worker=null,base=null,sequence=0;const pending=new Map();
 function dispose(){worker?.terminate();worker=null;base=null;for(const item of pending.values())item.reject(Error('Booklet persistence closed'));pending.clear();}
 function reset(project){dispose();if(typeof Worker==='undefined')return;try{worker=new Worker(new URL('./booklet-save.worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{const item=pending.get(data.id);if(!item)return;pending.delete(data.id);if(data.error){item.reject(Object.assign(Error(data.error.message),{status:data.error.status}));return;}const saved=applySavePatch(item.snapshot,data.patch);base=saved;item.resolve(saved);};worker.onerror=event=>{const error=Error(event.message||'Booklet persistence worker failed');for(const item of pending.values())item.reject(error);pending.clear();worker?.terminate();worker=null;base=null;};worker.postMessage({type:'seed',project});base=project;}catch{worker?.terminate();worker=null;base=null;}}
 function save(snapshot){if(!worker||!base)return saveBookletProject(snapshot);if(pending.size)throw Error('Coalesce saves before sending another revision');const id=++sequence,patch=createSavePatch(base,snapshot);return new Promise((resolve,reject)=>{pending.set(id,{snapshot,resolve,reject});try{worker.postMessage({type:'save',id,patch});base=snapshot;}catch(error){pending.delete(id);reject(error);}});}
 return {reset,save,dispose};
}
