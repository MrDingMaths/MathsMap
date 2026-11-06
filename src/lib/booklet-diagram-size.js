// Diagram sizes for a question or selection, in the renderer's own priority:
// a stored arrangement item width, then a stored block-layout width, then the
// diagram's width; answer editions use their compact-answer width. Heights are
// never stored: a height target becomes width = height × the rendered aspect,
// so a diagram is never distorted. All writes reuse existing fields. A minimum
// height is not a size: it reserves page space around the diagram (below).
import {findEditableDiagram,inlineTikzDiagram,patchDiagram} from './booklet-review-model.js';
import {updateProjectContent,updateProjectSettings} from './editable-booklet-model.js';
import {syncDiagramPresentation} from './booklet-document-tools.js';
import {answerDiagramWidth,withAnswerDiagramWidth} from './booklet-exercises.js';
import {diagramSizingKind,DIAGRAM_SIZE_LIMITS,proposeDiagramWidth} from './booklet-diagram-sizing.js';
import {resolveArrangement} from './booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';

export const SIZE_MODES=Object.freeze([['question','Questions'],['short','Short answers'],['worked','Worked solutions']]);
export const sizeModeFor=edition=>/short/.test(edition)?'short':/worked/.test(edition)?'worked':'question';
const SKIP=new Set(['source','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','spec']);
const round=value=>Math.round(value*2)/2;

function diagramsIn(node,inAnswer=false,out=[]){
 if(!node||typeof node!=='object')return out;
 if(node.id&&(node.format||node.type==='image')&&(node.code||node.src)){out.push({diagram:node,inAnswer});return out;}
 const inline=inlineTikzDiagram(node);if(inline){out.push({diagram:inline,inAnswer});return out;}
 for(const [key,value] of Object.entries(node))if(!SKIP.has(key))diagramsIn(value,inAnswer||key==='answer',out);
 return out;
}

export function diagramSizeTargets(project,blockIds,mode='question'){
 const overrides=project.settings?.layoutOverrides??{},rows=[];
 for(const block of project.sections.flatMap(s=>s.blocks).filter(b=>blockIds.includes(b.id))){
  let items=new Map(),reserved=new Map();
  if(mode==='question'&&overrides.blockLayouts?.[block.id]?.arrangement){
   const resolved=resolveArrangement(block,overrides.blockLayouts[block.id].arrangement,overrides);
   const diagramItems=arrangementItems(resolved.tree.root).flatMap(n=>{const e=resolved.entries.get(n.ref);return e?.kind==='diagram'?[[e.diagramId,n]]:[];});
   items=new Map(diagramItems.filter(([,n])=>n.width!=null).map(([id,n])=>[id,n.width]));reserved=new Map(diagramItems.filter(([,n])=>n.minHeight).map(([id,n])=>[id,n.minHeight]));
  }
  for(const {diagram,inAnswer} of diagramsIn(block.content??block)){
   if((mode==='question')===inAnswer)continue;
   const role=mode==='question'?'question':mode,kind=diagramSizingKind(diagram,{role});
   const widthMm=mode==='question'||diagram.inline?items.get(diagram.id)??overrides.blockLayouts?.[diagram.id]?.diagramWidthMm??diagram.widthMm??null:answerDiagramWidth(project.settings.compactAnswers,mode,diagram);
   rows.push({blockId:block.id,id:diagram.id,kind,role,widthMm,minHeightMm:reserved.get(diagram.id)??null,adjustable:!!DIAGRAM_SIZE_LIMITS[kind],diagram});
  }
 }
 return rows;
}

// measured: id -> {widthMm,heightMm} from the rendered page, for aspect ratios.
export function targetWidths(rows,action,value,measured={}){
 const aspect=row=>{const m=measured[row.id];return m?.widthMm>0&&m?.heightMm>0?m.widthMm/m.heightMm:null;};
 const tallest=Math.max(0,...rows.map(r=>measured[r.id]?.heightMm??0)),widest=Math.max(0,...rows.map(r=>r.widthMm??measured[r.id]?.widthMm??0));
 return rows.map(row=>{
  const current=row.widthMm??measured[row.id]?.widthMm;let width=null;
  if(action==='width')width=value;
  else if(action==='height')width=aspect(row)?value*aspect(row):null;
  else if(action==='scale')width=current?current*value/100:null;
  else if(action==='match-tallest')width=aspect(row)&&tallest?tallest*aspect(row):null;
  else if(action==='match-widest')width=widest||null;
  else if(action==='recommended'){const proposal=proposeDiagramWidth(row.diagram,measured[row.id],{role:row.role});width=proposal.action==='reduce'?proposal.widthMm:null;}
  return {...row,targetMm:Number.isFinite(width)?Math.min(190,Math.max(5,round(width))):null};
 });
}

export function setDiagramWidths(project,entries,mode='question'){
 let next=project;
 for(const {blockId,id,targetMm} of entries){
  if(!Number.isFinite(targetMm))continue;
  if(targetMm<5||targetMm>190)throw Error('Choose diagram widths between 5 and 190 mm.');
  const block=next.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId),found=block&&findEditableDiagram(block,id);
  // Inline [tikz] carries one width in its source for every edition.
  if(mode==='question'||found?.inline){
   if(!found)throw Error('A diagram moved or was removed; reselect the question.');
   next=updateProjectContent(next,blockId,found.path,patchDiagram(found.diagram,{widthMm:targetMm}));
   if(!found.inline)next=syncDiagramPresentation(next,blockId,id,{widthMm:targetMm});
  }else next=updateProjectSettings(next,{compactAnswers:withAnswerDiagramWidth(next.settings.compactAnswers,mode,id,targetMm)});
 }
 return next;
}

// Minimum height keeps every diagram at its size and reserves at least that much
// page height for its place in the question's arrangement, so a row or column
// grows downwards and never sideways; 0 clears it. Arrangements belong to the
// question edition, and only question blocks lay out through one when none is
// saved; other diagrams are returned as skipped.
export function reserveDiagramHeights(project,rows,heightMm){
 if(!(heightMm>=0&&heightMm<=180))throw Error('Choose a minimum height between 0 and 180 mm.');
 let next=project;const skipped=[];
 for(const blockId of new Set(rows.map(r=>r.blockId))){
  const ids=new Set(rows.filter(r=>r.blockId===blockId).map(r=>r.id)),block=next.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId),overrides=next.settings?.layoutOverrides??{},stored=overrides.blockLayouts?.[blockId]?.arrangement;
  if(!block||(!stored&&block.type!=='question')){skipped.push(...ids);continue;}
  // The same resolved tree the arrangement controls save when a layout is first edited.
  const resolved=resolveArrangement(block,stored,{...overrides,editable:true}),tree=structuredClone(resolved.tree),found=new Set();
  for(const item of arrangementItems(tree.root)){const entry=resolved.entries.get(item.ref);if(entry?.kind!=='diagram'||!ids.has(entry.diagramId))continue;found.add(entry.diagramId);if(heightMm)item.minHeight=heightMm;else delete item.minHeight;}
  skipped.push(...[...ids].filter(id=>!found.has(id)));
  if(found.size)next=updateProjectSettings(next,{layoutOverrides:{...overrides,blockLayouts:{...overrides.blockLayouts,[blockId]:{...overrides.blockLayouts?.[blockId],arrangement:tree}}}});
 }
 return {project:next,skipped};
}
