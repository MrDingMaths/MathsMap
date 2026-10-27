// Diagram sizes for a question or selection, in the renderer's own priority:
// a stored arrangement item width, then a stored block-layout width, then the
// diagram's width; answer editions use their compact-answer width. Heights are
// never stored: a height target becomes width = height × the rendered aspect,
// so a diagram is never distorted. All writes reuse existing fields.
import {findEditableDiagram} from './booklet-review-model.js';
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
 for(const [key,value] of Object.entries(node))if(!SKIP.has(key))diagramsIn(value,inAnswer||key==='answer',out);
 return out;
}

export function diagramSizeTargets(project,blockIds,mode='question'){
 const overrides=project.settings?.layoutOverrides??{},rows=[];
 for(const block of project.sections.flatMap(s=>s.blocks).filter(b=>blockIds.includes(b.id))){
  let items=new Map();
  if(mode==='question'&&overrides.blockLayouts?.[block.id]?.arrangement){
   const resolved=resolveArrangement(block,overrides.blockLayouts[block.id].arrangement,overrides);
   items=new Map(arrangementItems(resolved.tree.root).flatMap(n=>{const e=resolved.entries.get(n.ref);return e?.kind==='diagram'&&n.width!=null?[[e.diagramId,n.width]]:[];}));
  }
  for(const {diagram,inAnswer} of diagramsIn(block.content??block)){
   if((mode==='question')===inAnswer)continue;
   const role=mode==='question'?'question':mode,kind=diagramSizingKind(diagram,{role});
   const widthMm=mode==='question'?items.get(diagram.id)??overrides.blockLayouts?.[diagram.id]?.diagramWidthMm??diagram.widthMm??null:answerDiagramWidth(project.settings.compactAnswers,mode,diagram);
   rows.push({blockId:block.id,id:diagram.id,kind,role,widthMm,adjustable:!!DIAGRAM_SIZE_LIMITS[kind],diagram});
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
  if(mode==='question'){
   const block=next.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId),found=block&&findEditableDiagram(block,id);
   if(!found)throw Error('A diagram moved or was removed; reselect the question.');
   next=updateProjectContent(next,blockId,found.path,{...found.diagram,widthMm:targetMm});
   next=syncDiagramPresentation(next,blockId,id,{widthMm:targetMm});
  }else next=updateProjectSettings(next,{compactAnswers:withAnswerDiagramWidth(next.settings.compactAnswers,mode,id,targetMm)});
 }
 return next;
}
