// Copies topics and items from a read-only source booklet into the open one.
// The source is never written; inserted content is an independent copy with
// new ids, its own layout overrides and its bank pins.
import {flowCommand,captureFlowClipboard,logicalUnits,selectedFlowIds,flowId} from './booklet-flow.js';
import {normalizeEditableProject} from './editable-booklet-model.js';

const copy=value=>JSON.parse(JSON.stringify(value));
const phaseOf=section=>section.phase==='practice'?'practice':'teaching';
// Section settings that describe layout, not the source document's pages.
const SECTION_FIELDS=['title','phase','role','headingStyle','difficulty','showDifficultyHeading','pageBreakBefore'];

// Covers, syllabus pages and candidate pools stay with their own booklet.
export const librarySections=source=>source.sections.filter(s=>s.phase!=='front-matter'&&s.role!=='front-matter'&&s.role!=='candidate-pool'&&s.blocks.length);

export function libraryTopics(source) {
  const titles=new Map((source.topics??[]).map(t=>[t.id,t.title])),topics=[];
  for(const section of librarySections(source)){
    let topic=topics.find(t=>t.id===section.topicId);
    if(!topic){topic={id:section.topicId,title:titles.get(section.topicId)??section.title,sections:[]};topics.push(topic);}
    topic.sections.push(section);
  }
  return topics;
}

// Ticked ids grow to whole logical units and dependent groups, then split into
// complete topics and loose items, both in source order.
export function libraryPicks(source, blockIds) {
  const eligible=new Set(librarySections(source).flatMap(s=>s.blocks.map(b=>b.id)));
  const ids=new Set(selectedFlowIds(source,[...blockIds].filter(id=>eligible.has(id))).filter(id=>eligible.has(id)));
  const topics=[],items=[];
  for(const topic of libraryTopics(source)){
    const whole=topic.sections.every(s=>s.blocks.every(b=>ids.has(b.id)));
    if(whole)topics.push(topic);
    else for(const section of topic.sections){const picked=section.blocks.filter(b=>ids.has(b.id)).map(b=>b.id);if(picked.length)items.push({section,ids:picked});}
  }
  return {ids:[...ids],topics,items,units:logicalUnits(source).filter(u=>u.blocks.some(b=>ids.has(b.id))).length};
}

// `at` is the open booklet's current position: {sectionId, afterId}. Whole
// topics become new topics after the current one unless `asTopics` is false.
export function insertFromBooklet(dest, source, blockIds, at={}, {asTopics=true}={}) {
  if(source.id===dest.id)throw Error('Choose a different booklet to copy from.');
  const picks=libraryPicks(source,blockIds);
  if(!picks.ids.length)throw Error('Tick the content to insert first.');
  // One clipboard keeps continuations and dependent groups mapped together.
  const stagingId=flowId(),clip=captureFlowClipboard(source,picks.ids);
  const staged=flowCommand({...dest,sections:[...dest.sections,{id:stagingId,title:'Library',role:'teaching',phase:'teaching',blocks:[]}]},{type:'paste',clipboard:clip,sectionId:stagingId,beforeId:null});
  const fresh=staged.sections.find(s=>s.id===stagingId).blocks;
  const next={...staged,topics:copy(staged.topics??[]),sections:staged.sections.filter(s=>s.id!==stagingId)};
  const copied=new Map(clip.blocks.map((b,i)=>[b.id,fresh[i]]));
  for(const block of fresh)if(block.flow)delete block.flow.sourcePageBreakBefore;
  const take=section=>section.blocks.filter(b=>copied.has(b.id)).map(b=>copied.get(b.id));

  let current=next.sections.find(s=>s.id===at.sectionId)??next.sections.findLast(s=>s.phase!=='front-matter')??null;
  let topicId=current?.topicId??null;
  const newTopics=[],order=section=>source.sections.indexOf(section);
  const groups=asTopics?picks.items:[...picks.topics.flatMap(t=>t.sections.map(section=>({section}))),...picks.items].sort((a,b)=>order(a.section)-order(b.section));

  if(groups.length){
    if(!current){
      const topic={id:flowId(),title:'New topic'};next.topics.push(topic);topicId=topic.id;
    }
    // Later groups for the same section follow the earlier ones.
    const anchors=new Map();
    const selected=current&&at.afterId?new Set(selectedFlowIds(next,[at.afterId])):new Set();
    const afterSelection=current?Math.max(-1,...current.blocks.map((b,i)=>selected.has(b.id)?i:-1)):-1;
    for(const group of groups){
      const phase=phaseOf(group.section);
      let target=current&&phaseOf(current)===phase?current:next.sections.findLast(s=>s.topicId===topicId&&s.phase!=='front-matter'&&phaseOf(s)===phase);
      if(!target){
        target={id:flowId(),topicId,title:phase==='practice'?'Practice':'Teaching',role:phase,phase,difficulty:null,blocks:[]};
        const inTopic=i=>next.sections[i].topicId===topicId;
        const firstPractice=next.sections.findIndex((s,i)=>inTopic(i)&&s.phase==='practice'),last=next.sections.findLastIndex((s,i)=>inTopic(i));
        next.sections.splice(phase==='teaching'&&firstPractice>=0?firstPractice:last>=0?last+1:next.sections.length,0,target);
      }
      const index=anchors.get(target.id)??(target===current&&afterSelection>=0?afterSelection+1:target.blocks.length);
      const blocks=take(group.section);
      target.blocks.splice(index,0,...blocks);anchors.set(target.id,index+blocks.length);
    }
  }

  if(asTopics&&picks.topics.length){
    let topicAt=next.topics.findIndex(t=>t.id===topicId),sectionAt=next.sections.findLastIndex(s=>s.topicId===topicId);
    topicAt=topicAt<0?next.topics.length:topicAt+1;sectionAt=sectionAt<0?next.sections.length:sectionAt+1;
    for(const picked of picks.topics){
      const topic={id:flowId(),title:picked.title};
      const sections=picked.sections.map(section=>({id:flowId(),topicId:topic.id,...Object.fromEntries(SECTION_FIELDS.filter(key=>section[key]!==undefined).map(key=>[key,copy(section[key])])),blocks:take(section)}));
      next.topics.splice(topicAt++,0,topic);next.sections.splice(sectionAt,0,...sections);sectionAt+=sections.length;
      newTopics.push(topic);
    }
  }

  let images=0;const scan=value=>{if(!value||typeof value!=='object')return;for(const [key,child] of Object.entries(value)){if(key==='src'&&typeof child==='string'&&/^\/(?:booklet-assets\/projects|__booklet\/full-imports)\//.test(child))images++;else if(child&&typeof child==='object')scan(child);}};
  for(const block of fresh)scan({content:block.content,diagrams:block.diagrams,src:block.src});
  return {project:normalizeEditableProject(next),report:{
    items:picks.units,topics:newTopics.map(t=>t.title),firstId:fresh[0].id,ids:fresh.map(b=>b.id),
    breaks:fresh.filter(b=>b.flow?.pageBreakBefore).length,bankLinked:fresh.filter(b=>b.bankRef?.id).length,sourceImages:images,
  }};
}

export function insertSummary(report, sourceTitle) {
  const parts=[`Inserted ${report.items} item${report.items===1?'':'s'} from ${sourceTitle}`+(report.topics.length?` as ${report.topics.length} new topic${report.topics.length===1?'':'s'}`:'')+'.'];
  if(report.breaks)parts.push(`${report.breaks} page break${report.breaks===1?'':'s'} came with ${report.items===1?'it':'them'}.`);
  if(report.bankLinked)parts.push(`${report.bankLinked} bank question${report.bankLinked===1?' keeps its':'s keep their'} pinned version.`);
  if(report.sourceImages)parts.push(`${report.sourceImages} image${report.sourceImages===1?' is':'s are'} still stored with ${sourceTitle}; archive rather than delete it.`);
  return parts.join(' ');
}
