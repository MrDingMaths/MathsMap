import {renderDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {assertSharedResourceView,hasSharedResourceAnnotations,sharedResourceRequirements,verifySharedResourcePages,requireResourceExportProject} from './booklet-shared-resources.js';

export function resourcePrintBindings(project,{hash}={}){
 requireResourceExportProject(project);
 const requirements=sharedResourceRequirements(project,{hash});
 const owners=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,b.content?.id??b.id])));
 return requirements.access.map(e=>({...e,expectedHtml:renderDocument({format:'maths-editor-document-v1',blocks:[e.table]},{math:()=>'<span data-math="true"></span>'}),consumerRootId:owners.get(e.consumerId),targetRootId:owners.get(e.targetOwnerId)}));
}

// Serializable for the headless caller; all inputs remain explicit. Studio calls
// the same function on its settled, application-controlled print surface.
export function resourcePrintPageEvidence(bindings,root=document.querySelector('.project-print')){
  const pages=[...root.querySelectorAll('.print-page')];
  const visible=el=>{
   if(!el)return false;
   for(let n=el;n;n=n.parentElement){
    const s=getComputedStyle(n);
    if(s.display==='none'||s.visibility!=='visible'||Number(s.opacity)===0)return false;
    if(n===root)break;
   }
   const r=el.getBoundingClientRect();return r.width>0&&r.height>0;
  };
  const semanticTable=table=>{
   const text=n=>n.nodeType===3?n.textContent:n.nodeType===1?n.hasAttribute('data-latex')?'$'+n.dataset.latex+'$':[...n.childNodes].map(text).join(''):'';
   return JSON.stringify([...table.rows].map(row=>[...row.cells].map(cell=>({id:cell.dataset.id,tag:cell.tagName,colspan:cell.colSpan,rowspan:cell.rowSpan,text:text(cell).replace(/\s+/g,' ').trim()}))));
  };
  const expected=new Map(bindings.map(b=>{
   const template=document.createElement('template');template.innerHTML=b.expectedHtml;
   return [b.tableId,semanticTable(template.content.querySelector('table'))];
  }));
  const unclipped=el=>{
   const r=el.getBoundingClientRect();
   for(let n=el.parentElement;n;n=n.parentElement){
    const s=getComputedStyle(n),a=n.getBoundingClientRect();
    if(s.clipPath!=='none')return false;
    if(/hidden|clip/.test(s.overflowX)&&(r.left<a.left-1||r.right>a.right+1)||/hidden|clip/.test(s.overflowY)&&(r.top<a.top-1||r.bottom>a.bottom+1))return false;
    if(n===root)break;
   }
   return true;
  };
  const nodes=(p,ownerId,rootId)=>{
   const student=el=>!el.closest('.answer-key,.answer-item');
   // Current student rendering is a PracticeQuestionRenderer wrapper around
   // BookletArrangement. Its former data-node-id snippet is not that route.
   const questions=[...p.querySelectorAll('[data-question-id]')].filter(e=>e.dataset.questionId===ownerId&&student(e));
   if(questions.length)return questions;
   const arrangements=[...p.querySelectorAll('[data-arrangement-block]')].filter(e=>e.dataset.arrangementBlock===ownerId&&student(e));
   if(arrangements.length)return arrangements;
   return [...p.querySelectorAll('[data-node-id]')].filter(e=>e.dataset.nodeId===rootId&&student(e));
  };
  const evidence=pages.map(p=>{
   const elements=[],pr=p.getBoundingClientRect(),footer=p.querySelector('footer')?.getBoundingClientRect();
   for(const b of bindings){
    for(const c of nodes(p,b.consumerId,b.consumerRootId))if(visible(c))elements.push({id:b.consumerId,y:c.getBoundingClientRect().top-pr.top});
    for(const owner of nodes(p,b.targetOwnerId,b.targetRootId))for(const t of owner.querySelectorAll('table[data-id]'))if(t.dataset.id===b.tableId){
     const r=t.getBoundingClientRect(),v=visible(t),cells=[...t.querySelectorAll('td,th')];
     const readable=v&&semanticTable(t)===expected.get(b.tableId)&&unclipped(t)&&cells.length>0&&!!t.textContent.trim()&&r.left>=pr.left-1&&r.right<=pr.right+1&&r.top>=pr.top&&r.bottom<=(footer?.top??pr.bottom)+1&&cells.every(c=>visible(c)&&c.scrollWidth<=c.clientWidth+1&&Number.parseFloat(getComputedStyle(c).fontSize)>=8);
     elements.push({id:b.tableId,ownerId:b.targetOwnerId,tableSha256:b.tableSha256,y:r.bottom-pr.top,visible:v,readable,bounds:{width:r.width,height:r.height}});
    }
   }
   return {elements};
  });
  // Do not infer an intentional selection from missing DOM evidence. The full
  // rendered Questions surface must establish each bound consumer before an
  // explicit selectedPages subset can safely exclude it.
  for(const b of bindings)if(!evidence.some(p=>p.elements.some(e=>e.id===b.consumerId)))throw Error('Expected dependent question '+b.consumerId+' is missing or hidden in the Questions print view; refresh the full booklet before printing.');
  return evidence;
}

// The browser supplies SHA-256 mechanically; this never creates a semantic or
// atomic-grouping capability from persisted JSON annotations.
export async function inspectSharedResourcePrint(project,root,{edition,selectedPages=null}={}){
 requireResourceExportProject(project);
 if(!hasSharedResourceAnnotations(project))return {checked:0,pages:[]};
 assertSharedResourceView(project,null);
 if(['short','worked'].includes(edition))return {checked:0,pages:[]};
 const blocks=project.sections.flatMap(s=>s.blocks??[]),values=[project];
 const addTables=n=>{if(!n)return;for(const t of n.prompt?.blocks??[])if(t?.type==='table')values.push(t);for(const c of n.children??[])addTables(c);};
 for(const b of blocks)for(const edge of b.flow?.sharedResourceEdges??[]){values.push(b.content);for(const owner of blocks.filter(x=>x.id===edge.targetOwnerId)){values.push(owner.content);addTables(owner.content);}}
 const hashes=new Map(await Promise.all([...new Set(values.map(v=>JSON.stringify(v)))].map(async value=>{
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [value,[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('')];
 })));
 const hash=value=>hashes.get(JSON.stringify(value)),bindings=resourcePrintBindings(project,{hash}),pages=resourcePrintPageEvidence(bindings,root),selected=selectedPages??pages.map((_,i)=>i);
 try{verifySharedResourcePages(project,null,{edition,pages,selectedPages:selected,hash});}
 catch{throw Error('Include the required table before the questions that use it, or choose the full booklet, then print again.');}
 return {checked:bindings.length,pages,selectedPages:selected,humanReadabilityReview:'required'};
}
