import {applySavePatch,createSavePatch} from './booklet-save-patch.js';
let project;
self.onmessage=async({data})=>{if(data.type==='seed'){project=data.project;return;}if(data.type!=='save')return;
 try{project=applySavePatch(project,data.patch);const snapshot=project;const response=await fetch('/__booklet/projects/'+encodeURIComponent(snapshot.id),{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({project:snapshot,expectedRevision:snapshot.revision})});const saved=await response.json();if(!response.ok)throw Object.assign(Error(saved.error??'Booklet save failed'),{status:response.status});if(saved.id!==snapshot.id)throw Error('The save response belongs to another booklet');const patch=createSavePatch(snapshot,saved);project=saved;self.postMessage({id:data.id,patch});}
 catch(error){self.postMessage({id:data.id,error:{message:error.message,status:error.status}});}
};
