// Fit: one parameter t in [0,1] scales every allowed reduction from its current
// value (t=0) to its floor (t=1), so a binary search over t finds the smallest
// uniform reduction that fits. Writes only fields the renderer already reads:
// paragraph/arrangement spacing, table padding and row heights, answer spaces and
// arrangement diagram widths (with any stored diagram width kept in step).
import {resolveArrangement,findContent} from './booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {blockDocuments} from './booklet-bulk-spacing.js';
import {tableRowMinimum,tableResponseAnswers,hasTeacherReview} from './booklet-import-spacing.js';
import {workingSpaceFloor} from './booklet-working-space.js';
import {diagramSizingKind,DIAGRAM_SIZE_LIMITS} from './booklet-diagram-sizing.js';

export const FIT_OPTIONS=Object.freeze([
 ['spacing','Spacing and gaps'],['workingSpace','Working space (to its floor)'],['diagrams','Diagram size (to its kind minimum)'],
 ['otherBlocks','Other blocks on the page'],['belowMinimum','Go below recommended minimums'],
]);
export const FIT_DEFAULTS=Object.freeze({spacing:true,workingSpace:true,diagrams:true,otherBlocks:false,belowMinimum:false});
// Below-minimum floors, opt-in only.
const BELOW={workingSpace:.7,diagram:.8};

const blocks=p=>p.sections.flatMap(s=>s.blocks);
const visit=(node,fn,context={})=>{if(!node||typeof node!=='object')return;fn(node,context);const inside=node.type==='cell'?{...context,cell:node}:context;for(const value of Object.values(node))if(value&&typeof value==='object'){if(Array.isArray(value))value.flat().forEach(n=>visit(n,fn,inside));else visit(value,fn,inside);}};
// Current toward floor, rounded to half millimetres; never increases a value.
export const scaled=(current,floor,t)=>!(current>floor)?current:Math.max(floor,Math.round((current-(current-floor)*t)*2)/2);

function reduceBlock(project,blockId,t,options){
 const original=blocks(project).find(b=>b.id===blockId);if(!original)return project;
 const block=structuredClone(original),layoutOverrides={...project.settings.layoutOverrides},below=options.belowMinimum;
 if(options.spacing){
  for(const {document}of blockDocuments(block))visit(document,(n,ctx)=>{
   if(n.type==='paragraph'&&(!ctx.cell||ctx.cell.preserveParagraphSpacing)){if(n.spaceBefore>0)n.spaceBefore=scaled(n.spaceBefore,0,t);const after=n.spaceAfter??2;if(after>(below?0:1))n.spaceAfter=scaled(after,below?0:1,t);}
   if(n.type==='layout'&&!['speech-bubble','cards'].includes(n.arrangement)){const gap=n.gap??3,margin=n.margin??3,padding=n.padding??3;if(gap>(below?0:1))n.gap=scaled(gap,below?0:1,t);if(margin>0)n.margin=scaled(margin,0,t);if(padding>(n.border?1:0))n.padding=scaled(padding,n.border?1:0,t);}
   if(n.type==='table'){const floor=n.border===false?0:1,padding=n.padding??2;if(padding>floor)n.padding=scaled(padding,floor,t);
    n.rows?.forEach((row,i)=>{if(row.some(c=>c.header))return;const minimum=tableRowMinimum(n,i,n.widthMm??170,tableResponseAnswers(block));if(minimum!=null&&n.rowHeights?.[i]>minimum)n.rowHeights[i]=scaled(n.rowHeights[i],minimum,t);});}
  });
  if(block.type==='worked-example'&&block.presentation?.layout==='worked-rows')for(const e of block.examples??[]){const above=e.rowLayout?.aboveMm??0,after=e.rowLayout?.belowMm??4;e.rowLayout={...e.rowLayout,aboveMm:scaled(above,0,t),belowMm:scaled(after,below?0:1,t)};}
 }
 const stored=layoutOverrides.blockLayouts?.[blockId]?.arrangement??block.presentation?.layoutOverrides?.blockLayouts?.[blockId]?.arrangement;
 const usesArrangement=block.type==='question'||!!stored;
 let next={...project,sections:project.sections.map(s=>s.blocks.some(b=>b.id===blockId)?{...s,blocks:s.blocks.map(b=>b.id===blockId?block:b)}:s),settings:{...project.settings,layoutOverrides}};
 if(!usesArrangement)return next;
 const resolved=resolveArrangement(block,layoutOverrides.blockLayouts?.[blockId]?.arrangement,layoutOverrides),tree=structuredClone(resolved.tree);
 const reviewed=hasTeacherReview(project);let blockLayouts=layoutOverrides.blockLayouts??{},answerSpaces=layoutOverrides.answerSpaces??{};
 if(options.spacing)visit(tree.root,n=>{if(n.type==='group'&&n.gap>(below?0:1))n.gap=scaled(n.gap,below?0:1,t);if(n.before>0)n.before=scaled(n.before,0,t);if(n.after>(below?0:1))n.after=scaled(n.after,below?0:1,t);});
 for(const item of arrangementItems(tree.root)){
  const entry=resolved.entries.get(item.ref);
  if(options.workingSpace&&entry?.kind==='space'){
   const node=findContent(block,entry.ownerId);if(!node?.answer)continue;
   let floor;try{floor=workingSpaceFloor(block,node,{reviewed});}catch{continue;}
   if(below)floor=Math.round(floor*BELOW.workingSpace*2)/2;
   const height=item.height??entry.value;if(height>floor){item.height=scaled(height,floor,t);answerSpaces={...answerSpaces,[entry.ownerId]:item.height};}
  }
  if(options.diagrams&&entry?.kind==='diagram'){
   const limit=DIAGRAM_SIZE_LIMITS[diagramSizingKind(entry.value)];if(!limit)continue;
   const floor=below?Math.round(limit.minWidthMm*BELOW.diagram*2)/2:limit.minWidthMm,width=item.width??blockLayouts[entry.diagramId]?.diagramWidthMm??entry.value.widthMm;
   if(width>floor){item.width=scaled(width,floor,t);if(blockLayouts[entry.diagramId]?.diagramWidthMm!=null)blockLayouts={...blockLayouts,[entry.diagramId]:{...blockLayouts[entry.diagramId],diagramWidthMm:item.width}};}
  }
 }
 blockLayouts={...blockLayouts,[blockId]:{...blockLayouts[blockId],arrangement:tree}};
 next.settings={...next.settings,layoutOverrides:{...layoutOverrides,blockLayouts,answerSpaces}};
 return next;
}

export function fitCandidate(project,blockIds,t,options=FIT_DEFAULTS){
 return blockIds.reduce((value,id)=>reduceBlock(value,id,t,options),project);
}

// fits(candidate) resolves true when the goal is met. Probes t=1 first so an
// impossible fit costs one measurement, then bisects to the smallest fitting t.
export async function searchFit(project,blockIds,options,fits,{steps=6,cancelled=()=>false}={}){
 const at=t=>fitCandidate(project,blockIds,t,options),probes=[];
 const full=at(1);if(JSON.stringify(full.sections)===JSON.stringify(project.sections)&&JSON.stringify(full.settings)===JSON.stringify(project.settings))return {project:null,probes,reason:'nothing-to-reduce'};
 probes.push(1);if(!await fits(full))return {project:null,probes,reason:'does-not-fit'};
 let low=0,high=1,best=full;
 for(let i=0;i<steps;i++){
  if(cancelled())throw Object.assign(Error('Fit cancelled'),{cancelled:true});
  const middle=(low+high)/2,candidate=at(middle);probes.push(middle);
  if(await fits(candidate)){high=middle;best=candidate;}else low=middle;
 }
 return {project:best,t:high,probes};
}

// Which disabled reductions could free more space.
export function fitSuggestions(options){
 return FIT_OPTIONS.filter(([key])=>!options[key]&&key!=='otherBlocks').map(([,label])=>label);
}
