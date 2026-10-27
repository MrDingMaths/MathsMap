import {applySavePatch,canonicalJson,createSavePatch} from './booklet-save-patch.js';
let project;
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const failed=async response=>{const body=await response.json().catch(()=>({}));return Object.assign(Error(body.error??'Booklet save failed'),{status:response.status});};
// Send only the changed branches when the server holds the same base; it replies
// with only its own changes. A different base (412) or an older server sends the
// whole project, as before.
async function patchSave(base,snapshot,patch){
 let response;
 // A refused request (an older server, or a harness that only answers PUT) falls back too.
 try{response=await fetch('/__booklet/projects/'+encodeURIComponent(snapshot.id),{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({patch,baseRevision:snapshot.revision,baseHash:await digest(canonicalJson(base))})});}catch{return null;}
 if([404,405,412].includes(response.status))return null;
 if(!response.ok)throw await failed(response);
 const result=await response.json();if(result.id!==snapshot.id)throw Error('The save response belongs to another booklet');
 return result.serverPatch;
}
async function putSave(snapshot){
 const response=await fetch('/__booklet/projects/'+encodeURIComponent(snapshot.id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({project:snapshot,expectedRevision:snapshot.revision})});
 if(!response.ok)throw await failed(response);
 const saved=await response.json();if(saved.id!==snapshot.id)throw Error('The save response belongs to another booklet');
 return createSavePatch(snapshot,saved);
}
self.onmessage=async({data})=>{if(data.type==='seed'){project=data.project;return;}if(data.type!=='save')return;
 // The page advances its base when it posts, so the worker does too, even if saving fails.
 try{const base=project,snapshot=project=applySavePatch(base,data.patch);const patch=await patchSave(base,snapshot,data.patch)??await putSave(snapshot);project=applySavePatch(snapshot,patch);self.postMessage({id:data.id,patch});}
 catch(error){self.postMessage({id:data.id,error:{message:error.message,status:error.status}});}
};
