// Repairs confirmed during the whole-booklet transfer review; preserves source evidence.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {prismModel,obliqueView,withSolidMetadata} from '../../src/lib/solid-geometry.js';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';
const repairs=[
 {id:'p16-q1-d-diagram',front:[[0,1.2],[.8,1.7],[1.6,1.2],[1.6,.3],[.8,-.2],[0,.3]],dx:1.9,dy:.6,
 old:String.raw`draw[black,dashed] (B)--(AA)--(FF)--(EE) (FF)--(D) (AA)--(BB);`,
 next:String.raw`draw[black,dashed] (A)--(AA)--(FF)--(EE) (F)--(FF) (AA)--(BB);`,reason:'Replace two dashed non-edges with A-AA and F-FF, the actual obscured extrusion edges of the hexagonal prism.'},
 {id:'p16-q1-h-diagram',front:[[0,1.5],[.6,2.05],[1.4,1.8],[1.6,.95],[.95,.4],[.18,.65]],dx:1.7,dy:-1.55,
 old:String.raw`draw[black,dashed] (D)--(CC)--(BB)--(AA)--(FF) (E)--(AA);`,
 next:String.raw`draw[black,dashed] (CC)--(BB)--(AA)--(FF) (B)--(BB) (A)--(AA);`,reason:'Remove diagonal chords D-CC and E-AA; the obscured extrusion edges join A-AA and B-BB.'},
];
function namedModel(r){const m=prismModel(r.front,[0,0,1],obliqueView(r.dx,r.dy));const name=id=>String.fromCharCode(65+Number(id.slice(1))).repeat(id[0]==='A'?1:2);return {...m,vertices:Object.fromEntries(Object.entries(m.vertices).map(([id,p])=>[name(id),p])),faces:m.faces.map(f=>f.map(name))};}
export function repairVolumeBank(project){
 if(project.id!=='volume-v1')return {next:project,records:[]};
 const next=structuredClone(project),records=[];
 const visit=(value,location)=>{if(!value||typeof value!=='object')return;
  const r=repairs.find(r=>r.id===value.id);
  if(r){const before=value.code;if(before.includes(r.old)){value.code=withSolidMetadata(before.replace(r.old,r.next),{kind:'polyhedron',model:namedModel(r)});records.push({id:r.id,location,before:revisionHash(before),after:revisionHash(value.code),reason:r.reason,model:namedModel(r)});}else if(!before.includes(r.next))throw Error('Changed diagram requires review: '+r.id);}
  if(typeof value.code==='string'&&value.code.includes('reference":"source page 15')&&value.code.includes(String.raw`coordinate (Lt) at (0,1.8);`)){
   const before=value.code,old=String.raw`draw (L)--(R)--(F)--cycle;`,replacement=String.raw`draw[dashed] (L)--(R);
\draw (R)--(F)--(L);`;
   if(before.includes('\ndraw (R)--(F)--(L);')){value.code=before.replace('\ndraw (R)--(F)--(L);','\n\\draw (R)--(F)--(L);');records.push({id:value.id,location,before:revisionHash(before),after:revisionHash(value.code),reason:'Restore the TikZ command prefix on the visible lower triangular silhouette.'});}
   else if(before.includes(old)){value.code=before.replace(old,replacement);records.push({id:value.id,location,before:revisionHash(before),after:revisionHash(value.code),reason:'Bottom LR is behind the two visible lateral faces in this top-view triangular extrusion; retain its silhouette and all non-drawing dimension paths.'});}
  }
  if(value.id==='p38-q12'&&value.type==='question'&&typeof value.content?.prompt==='string'&&value.content.prompt.endsWith('two decimal')){const before=value.content.prompt;value.content.prompt+=' places.';records.push({id:value.id,location,before:revisionHash(before),after:revisionHash(value.content.prompt),reason:'Propagate the already approved p38-reviewed-source-decisions restoration of the final word from editable source evidence.'});}
  for(const [key,child]of Object.entries(value))if(!['source','sourceReview','sourceLayoutEvidence','spec','studio','provenance'].includes(key))if(Array.isArray(child))child.forEach((c,i)=>visit(c,location+'/'+key+'/'+i));else if(child&&typeof child==='object')visit(child,location+'/'+key);
 };
 visit(next,'');return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:repairVolumeBank,policy:'Volume transfer: explicit prism edge topology and propagation of approved rounding wording'});
 fs.mkdirSync('.booklet-work/volume-bank',{recursive:true});fs.writeFileSync('.booklet-work/volume-bank/geometry-repairs.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({applied:report.applied,files:report.files,repairs:report.projects.flatMap(p=>p.records).map(r=>({id:r.id,reason:r.reason}))}));
}
