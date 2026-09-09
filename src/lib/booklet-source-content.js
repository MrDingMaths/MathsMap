import {applyCreationPreset} from './booklet-creation.js';
import {normalizeEditableProject,materializeReconstruction,PROJECT_BLOCK_TYPES} from './editable-booklet-model.js';
import {organiseExercises} from './booklet-exercises.js';
import {applySourceCorrection} from './booklet-source-corrections.js';

export function sourceReferences(node) {
  const refs=node?.sourceRefs??(node?.sourcePageNumber?[{pageNumber:node.sourcePageNumber}]:[]);
  return refs.filter(r=>Number.isInteger(r.pageNumber)&&r.pageNumber>0);
}

export function contentProject(candidate,{runId,projectId,mode='compact',review={},selectedPages=[]}={}) {
  let project;
  if(candidate.sections){
    if(!candidate.topics?.length)throw Error('Semantic content needs named topics');
    const topics=new Set(candidate.topics.map(t=>t.id));
    if(topics.size!==candidate.topics.length)throw Error('Duplicate topic identity');
    for(const section of candidate.sections){
      if(!['practice','teaching','front-matter'].includes(section.phase))throw Error('Semantic section needs a teaching/practice phase');
      if(section.phase!=='front-matter'&&!topics.has(section.topicId))throw Error('Section references an unknown topic');
      for(const block of section.blocks??[]){
        if(!PROJECT_BLOCK_TYPES.includes(block.type))throw Error('Unsupported content block');
        if(!sourceReferences(block).length)throw Error(`Missing source reference: ${block.id}`);
      }
    }
    project=normalizeEditableProject({...candidate,id:projectId,title:candidate.title,source:{type:'full-booklet-import',runId},settings:candidate.settings??{}});
  }else{
    project=materializeReconstruction({...candidate,runId},review,{projectId});
    for(const section of project.sections){
      const original=candidate.pages.find(p=>p.pageNumber===section.sourcePageNumber)?.section??{};
      Object.assign(section,...['topicId','phase','sequenceUncertain'].filter(k=>original[k]!==undefined).map(k=>({[k]:original[k]})));
      for(const block of section.blocks)block.sourceRefs??=[{pageNumber:section.sourcePageNumber}];
    }
    if(candidate.topics)project.topics=structuredClone(candidate.topics);
    if(mode==='compact'&&project.sections.some(s=>!s.topicId&&s.role!=='front-matter')){
      project.studio??={version:1,flags:[]};project.studio.flags??=[];
      project.studio.flags.push({id:'import-topic-boundaries',targetId:project.sections[0]?.blocks[0]?.id,note:'Historical page-based import: review topic boundaries and teaching/practice assignments before organising exercises.',resolved:false,automatic:true});
      for(const section of project.sections)section.sequenceUncertain=true;
    }
  }
  const visit=value=>{
    if(!value||typeof value!=='object')return;
    for(const ref of value.sourceRefs??[])if(!Number.isInteger(ref.pageNumber)||!selectedPages.includes(ref.pageNumber))throw Error('Content references an unexpected source page');
    for(const [key,v]of Object.entries(value))if(key!=='sourceRefs')Array.isArray(v)?v.forEach(visit):typeof v==='object'&&visit(v);
  };visit(project.sections);
  project.source.inventory=structuredClone(candidate.sourceInventory??{version:1,entries:[],pages:[]});
  delete project.sourceInventory;delete project.ratings;
  project.source.importMode=mode;
  for(const correction of candidate.sourceCorrections??[])project=applySourceCorrection(project,correction);
  delete project.sourceCorrections;
  if(mode==='compact'){
    // Only source-derived breaks/spacers are discarded. Author constraints survive.
    for(const section of project.sections){
      section.blocks=section.blocks.filter(b=>!(['spacer','page-break'].includes(b.type)&&b.sourceLayoutOnly===true));
      for(const b of section.blocks){
        if(b.flow?.sourcePageBreakBefore){b.sourceLayoutEvidence={...b.sourceLayoutEvidence,pageBreakBefore:true};b.flow.sourcePageBreakBefore=false;}
      }
    }
    project=organiseExercises(applyCreationPreset(project,mode),candidate.ratings??{});
  }else project=applyCreationPreset(project,mode);
  return normalizeEditableProject(project);
}
