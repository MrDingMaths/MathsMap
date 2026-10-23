import {contentSource} from './document-content.js';
import {clozeHandwritingMm} from '../../public/libs/maths-editor/house-style.mjs';

// Authoring/explicit maintenance only. Never called by project normalisation.
export const IMPORT_SPACING = Object.freeze({spaceAfter:1,spaceBefore:0,gap:1,rowGap:2,padding:1,partFigureWidthMm:32});
export const COMPACT_IMPORT_PROMPT = ` Layout defaults for new imports (17 October 2026): ordinary paragraphs have spaceBefore:0 and spaceAfter:1 mm; plain stacks use gap:1 mm and side-by-side arrangement rows use gap:2 mm. Use padding:1 mm on ordinary tables and 0 on borderless mathematical alignment layouts. Table body row heights are content-sized plus a small margin, not a fixed tall row: retain at least 8 mm per handwritten line and all space required by the expected response, fractions and drawings. Do not reduce cloze or column widths. Question graphs start around 70 mm, short-answer graphs around 50 mm. Simple supplied figures inside tables and part grids start around 32 mm; use larger figures wherever mathematical features or 10 pt labels require it. Preserve meaningful placement, avatars, card activities, manual exceptions and handwriting capacity. Working-space reductions are pilot-only; retain reviewed solution-based working estimates. Write these values explicitly in new semantic content and saved arrangements; legacy rendering defaults are unchanged.`;

export const hasTeacherReview=project=>(project.studio?.flags??[]).some(f=>!f.kind&&f.at);
// A repair the automated sweep, handoff or polish run recorded ("Pre-review sweep ...") is not teacher-driven feedback and does not protect spacing.
export const automatedRepair=entry=>['sweep','handoff','polish'].includes(entry?.source)||typeof entry?.note==='string'&&/^Pre-review sweep/.test(entry.note);
export const spacingProtected=block=>!!(block.sourceReview?.intentionalDepartures?.length||block.sourceReview?.authorisedFeedback||(block.sourceReview?.feedbackRepairs??[]).some(entry=>!automatedRepair(entry)));

export function responseCellHeight(cell,{widthMm=40,padding=1,expectedAnswer=cell.expectedAnswer}={}){
 const text=contentSource({format:'maths-editor-document-v1',version:1,blocks:cell.blocks??[]});
 if(expectedAnswer?.drawing)return null;
 if(!text.trim()&&expectedAnswer==null)return null;
 const response=expectedAnswer==null?'':contentSource(expectedAnswer);
 let clozes=[];const visit=n=>{if(!n||typeof n!=='object')return;if(n.type==='cloze')clozes.push(n);for(const value of Object.values(n))if(value&&typeof value==='object'){if(Array.isArray(value))value.flat().forEach(visit);else visit(value);}};visit(cell.blocks);
 const capacity=Math.max(1,Math.floor((widthMm-2*padding)/2.2));
 const lines=Math.max(1,...(text+'\n'+response).split('\n').map(row=>Math.ceil(row.length/capacity)));
 const fraction=/\\(?:d?frac|tfrac|boxed)\b/.test(text+' '+response);
 // Empty response cells need one writing line. A native cloze is never resized.
 const writing=!text.trim()||clozes.length>0;
 if(clozes.some(c=>Number(c.width)<clozeHandwritingMm(c.answer??'')))return null;
 return Math.ceil((Math.max(writing?8:5,lines*(fraction?10:writing?8:5))+2*padding)*2)/2;
}

export function tableRowMinimum(table,index,widthMm=table.widthMm??170,expectedAnswers={}){
 const row=table.rows?.[index];if(!row?.length||row.some(c=>c.rowspan>1||c.rotation))return null;
 const widths=table.widths??[],total=widths.reduce((a,b)=>a+b,0)||row.length;
 let column=0;
 const heights=row.map(cell=>{const span=cell.colspan??1,weight=Array.from({length:span},(_,i)=>widths[column+i]??1).reduce((a,b)=>a+b,0);column+=span;return responseCellHeight(cell,{widthMm:widthMm*weight/total,padding:Math.max(table.padding??2,cell.paddingTop??0,cell.paddingBottom??0),expectedAnswer:expectedAnswers[cell.id]??cell.expectedAnswer});});
 return heights.some(h=>h==null)?null:Math.max(...heights);
}

export function tableResponseAnswers(block){
 const owners=new Map(),walk=n=>{if(!n)return;if(n.id)owners.set(n.id,n);n.children?.forEach(walk);};walk(block.content);
 return Object.fromEntries((block.sourceReview?.tableResponses??[]).flatMap(binding=>{const node=owners.get(binding.targetId),answer=node?.answer?.[binding.field??'short'];return answer==null?[]:[[binding.cellId,node.answer.solutionDiagrams?.length?{drawing:true}:answer]];}));
}

// Return explicit, safe candidate values. Source evidence and answers are excluded.
export function compactSpacingValues(node,{inCell=false}={}){
 if(node.type==='paragraph'&&!inCell)return {spaceBefore:0,spaceAfter:1};
 if(node.type==='layout'&&!['speech-bubble','cards'].includes(node.arrangement))return {gap:1,padding:node.border?1:0};
 if(node.type==='table')return {padding:node.border===false?0:1};
 return {};
}
