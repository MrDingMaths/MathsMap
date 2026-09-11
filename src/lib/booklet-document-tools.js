import {BOOKLET_HOUSE_STYLE} from './booklet-house-style.js';
import {bookletColourChoices} from '../../public/libs/maths-editor/booklet-palette.mjs';
import {resolveArrangement,setGroupAnswerSpaceHeight} from './booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';

export const DOCUMENT_INSERT_TOOLS = [
  ['Display equation','Display math'],['Annotated equation','Annotated equation'],
  ['Writing space','Working space'],['Block figure','Block figure'],
  ['Matching cards','cards'],['Speech bubble','speech-bubble'],
  ['Investigation layout','investigation'],['Parallel layout','parallel'],
  ['Worked rows','worked-rows'],['Mathematical scaffold','scaffold'],
];
const names={ink:'Ink',blue:'Booklet blue',red:'Booklet red',green:'Booklet green',orange:'Booklet orange',tableLabel:'Label blue',border:'Border grey',skipped:'Skipped-value grey',white:'White'};
export function bookletColours(){return bookletColourChoices.map(c=>({...c,name:names[c.name]??c.name}));}

export function questionSpacing(project,block){
  const overrides=project.settings.layoutOverrides;
  const resolved=resolveArrangement(block,overrides.blockLayouts?.[block.id]?.arrangement,overrides);
  const spaces=arrangementItems(resolved.tree.root).filter(n=>resolved.entries.get(n.ref)?.kind==='space');
  const stacks=[];const walk=n=>{if(n.type==='group'){if(n.direction!=='row'&&n.children.length>1)stacks.push(n);n.children.forEach(walk);}};walk(resolved.tree.root);
  const common=values=>values.length&&values.every(v=>v===values[0])?values[0]:'';
  return {...resolved,spaces,stacks,height:common(spaces.map(n=>n.height??resolved.entries.get(n.ref).value)),gap:common(stacks.map(n=>n.gap??2))};
}
export function applyQuestionSpacing(project,blockId,property,value){
  if(!Number.isFinite(value)||value<0||value>(property==='height'?180:30)||!['height','gap'].includes(property))throw Error('Enter a valid spacing in millimetres.');
  const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId);
  if(!block)throw Error('Select a question first.');
  const state=questionSpacing(project,block);
  if(!(property==='height'?state.spaces:state.stacks).length)return project;
  const tree=property==='height'?setGroupAnswerSpaceHeight(state.tree,state.entries,state.tree.root.id,value):structuredClone(state.tree);
  if(property==='gap'){const ids=new Set(state.stacks.map(n=>n.id));const walk=n=>{if(ids.has(n.id))n.gap=value;n.children?.forEach(walk);};walk(tree.root);}
  const overrides=project.settings.layoutOverrides;
  // Keep the ordinary response-space renderer and saved arrangements in agreement.
  const answerSpaces={...overrides.answerSpaces};
  if(property==='height')for(const space of state.spaces)answerSpaces[state.entries.get(space.ref).ownerId]=value;
  return {...project,settings:{...project.settings,layoutOverrides:{...overrides,answerSpaces,blockLayouts:{...overrides.blockLayouts,[blockId]:{...overrides.blockLayouts[blockId],arrangement:tree}}}}};
}

export function syncDiagramPresentation(project,blockId,diagramId,patch){
  const overrides=project.settings.layoutOverrides,holder=overrides.blockLayouts?.[blockId];
  const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId);
  if(!block)return project;
  let blockLayouts=overrides.blockLayouts;
  if(holder?.arrangement){
    const {entries,tree}=resolveArrangement(block,holder.arrangement,overrides);
    let changed=false;
    for(const node of arrangementItems(tree.root))if(entries.get(node.ref)?.diagramId===diagramId){if(patch.align!=null)node.align=patch.align;if(patch.widthMm!=null)node.width=patch.widthMm;changed=true;}
    if(changed)blockLayouts={...blockLayouts,[blockId]:{...holder,arrangement:tree}};
  }
  return {...project,settings:{...project.settings,layoutOverrides:{...overrides,blockLayouts,...(patch.widthMm!=null?{diagramWidths:{...overrides.diagramWidths,[diagramId]:patch.widthMm}}:{})}}};
}
