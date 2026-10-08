// Whole-question selection for the document workspace. Selections hold block
// ids in document order; the anchor is the unit last clicked without Shift.
import {logicalUnits,selectedFlowIds,flowNumbers} from './booklet-flow.js';

const unitIds=unit=>unit.blocks.map(b=>b.id);

export function nextGroupSelection(project,{selection=[],anchor='',ids=[],shift=false,toggle=false}={}) {
  const units=logicalUnits(project),at=id=>units.findIndex(u=>u.blocks.some(b=>b.id===id));
  const target=at(ids[0]),start=at(anchor);
  if(target<0)return {selection:selectedFlowIds(project,ids),anchor};
  if(shift&&start>=0){
    // A range covers everything between the two clicks, so theory and its
    // exercise can be copied together.
    const range=units.slice(Math.min(start,target),Math.max(start,target)+1);
    return {selection:selectedFlowIds(project,range.flatMap(unitIds)),anchor};
  }
  const clicked=selectedFlowIds(project,unitIds(units[target]));
  if(toggle){
    const current=new Set(selection),remove=clicked.every(id=>current.has(id));
    const kept=remove?selection.filter(id=>!clicked.includes(id)):[...selection,...clicked];
    return {selection:selectedFlowIds(project,kept),anchor:units[target].id};
  }
  return {selection:clicked,anchor:units[target].id};
}

// Destination for moving the selection one unit earlier or later. The selected
// units are gathered together; null means there is nowhere further to go.
export function nudgeDestination(project,ids,delta) {
  const moving=new Set(selectedFlowIds(project,ids)),units=logicalUnits(project);
  const picked=units.filter(u=>u.blocks.some(b=>moving.has(b.id)));
  if(!picked.length)return null;
  const edge=delta<0?picked[0]:picked.at(-1),index=project.sections.findIndex(s=>s.id===edge.sectionId),section=project.sections[index];
  const others=units.filter(u=>u.sectionId===section.id&&!picked.includes(u)),position=units.indexOf(edge);
  if(delta<0){
    const before=others.filter(u=>units.indexOf(u)<position).at(-1);
    if(before)return {sectionId:section.id,beforeId:before.id};
    const previous=project.sections[index-1];
    return previous&&previous.phase===section.phase?{sectionId:previous.id,beforeId:null}:null;
  }
  const after=others.filter(u=>units.indexOf(u)>position);
  if(after.length)return {sectionId:section.id,beforeId:after[1]?.id??null};
  const next=project.sections[index+1];
  if(!next||next.phase!==section.phase)return null;
  return {sectionId:next.id,beforeId:next.blocks.find(b=>!moving.has(b.id))?.id??null};
}

// Sections and insertion points offered by "Move to…", excluding the selection.
export function moveDestinations(project,ids) {
  const moving=new Set(selectedFlowIds(project,ids)),numbers=flowNumbers(project),units=logicalUnits(project);
  const label=b=>b.type==='question'&&numbers[b.id]!=null?`Question ${numbers[b.id]}`:b.sourceAtom?.label||b.title||({'rich-text':'Text','worked-example':'Example',callout:'Theory','page-break':'Page break',image:'Image'}[b.type]??'Content');
  return project.topics.map(topic=>({id:topic.id,title:topic.title,sections:project.sections.filter(s=>s.topicId===topic.id).map(s=>({
    id:s.id,title:s.phase==='practice'?(s.difficulty?`Practice · ${s.difficulty}`:'Practice'):s.title,
    positions:units.filter(u=>u.sectionId===s.id&&!u.blocks.some(b=>moving.has(b.id))).map(u=>({id:u.id,label:label(u.blocks[0])})),
  }))}));
}

// Page-layout flags travel with a moved block; report them instead of dropping them.
export function movedBreaks(project,ids) {
  const moving=new Set(ids);
  return project.sections.flatMap(s=>s.blocks).filter(b=>moving.has(b.id)&&(b.flow?.pageBreakBefore||b.flow?.sourcePageBreakBefore)).length;
}
