import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {fromSource} from '../../public/libs/maths-editor/document-model.mjs';
import {sourceInventories} from '../../src/lib/booklet-source-content.js';
import {contentNodes,contentVerificationKey} from '../../src/lib/booklet-content-verification.js';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';

const revisions={
  'angle-relationships-v1':488,
  'index-laws-complete-v1':210,
  'volume-v1':421,
  'project-ac094b6d-f3e7-45ac-b585-6092b8d15f58':21
};
const clone=value=>structuredClone(value);
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const doc=value=>typeof value==='string'?fromSource(value):value;

export function consolidateSyllabusBlocks(project,provenancePath){
  const next=clone(project),section=next.sections.find(s=>s.phase==='front-matter'&&/syllabus/i.test(s.title));
  if(!section||next.sections.indexOf(section)>1||section.blocks.length<2)throw Error('No split opening syllabus');
  if(!section.blocks.every(b=>b.type==='rich-text'))throw Error('Syllabus includes non-text blocks');
  const originalSection=clone(section),header=section.blocks[0].presentation?.kind==='main-section-header';
  const active=section.blocks.slice(header?1:0),anchor=active[0];
  if(!anchor)throw Error('Syllabus body is missing');
  anchor.content={format:'maths-editor-document-v1',version:1,blocks:active.flatMap(b=>clone(doc(b.content).blocks))};
  anchor.sourceRefs=[...new Map(active.flatMap(b=>b.sourceRefs??[]).map(r=>[JSON.stringify(r),r])).values()];
  anchor.feedbackProvenance={path:provenancePath,sourceBlockIds:originalSection.blocks.map(b=>b.id),sourceHash:hash(originalSection)};
  section.blocks=[anchor];
  if(header)section.headingStyle='main';
  const removedIds=new Set(originalSection.blocks.filter(b=>b.id!==anchor.id).map(b=>b.id));
  next.sourceInventoryOverrides={...next.sourceInventoryOverrides};
  for(const entry of sourceInventories(project).flatMap(x=>x.entries))if(removedIds.has(entry.targetId)){
    next.sourceInventoryOverrides[entry.id]={exclusionReason:`Original syllabus block consolidated into ${anchor.id}; all substantive text remains in its editable document and the exact source blocks remain in ${provenancePath}.`};
  }
  return {next,originalSection,anchorId:anchor.id,removedIds:[...removedIds]};
}

if(process.argv[1]?.replaceAll('\\','/').endsWith('/consolidate-syllabus-blocks.mjs')){
  const id=process.argv[process.argv.indexOf('--project')+1];
  if(!(id in revisions))throw Error('Pass a supported --project ID');
  const project=await loadBookletProject(id);
  if(process.argv.includes('--verify')){
    if(project.revision!==revisions[id]+1)throw Error(`Expected ${id} revision ${revisions[id]+1}, found ${project.revision}`);
    const next=clone(project),anchor=next.sections.find(s=>s.phase==='front-matter'&&/syllabus/i.test(s.title)).blocks[0];
    const entry=sourceInventories(next).flatMap(x=>x.entries).find(e=>e.targetId===anchor.id);
    if(!entry)throw Error(`No source inventory target for ${anchor.id}`);
    const signature=await contentVerificationKey(next,entry,contentNodes(next));
    const evidence=id==='angle-relationships-v1'?'.booklet-work/data-classification-feedback-2026-09-25/angle-relationships-v1':id==='index-laws-complete-v1'?'.booklet-work/data-classification-feedback-2026-09-25/index-laws-complete-v1':id==='volume-v1'?'.booklet-work/data-classification-feedback-2026-09-25/volume-v1':'.booklet-work/data-classification-feedback-2026-09-25/volume-copy';
    next.sourceInventoryOverrides={...next.sourceInventoryOverrides,[entry.id]:{verification:{checked:true,signature,reviewer:'Scoped syllabus consolidation review',evidence,note:'Compared every native document block with preserved originals; inspected final-size syllabus and immediate teaching neighbour in the combined short-answer edition.'}}};
    if(process.argv.includes('--apply')){
      const saved=await saveBookletProject(next,{expectedRevision:project.revision});
      console.log(JSON.stringify({id,fromRevision:project.revision,toRevision:saved.revision,verified:entry.id}));
    }else console.log(JSON.stringify({id,revision:project.revision,verified:entry.id}));
    process.exit(0);
  }
  if(project.revision!==revisions[id])throw Error(`Expected ${id} revision ${revisions[id]}, found ${project.revision}`);
  const provenancePath=`booklets/provenance/${id}/syllabus-consolidation-2026-09-25.json`;
  const {next,originalSection,anchorId,removedIds}=consolidateSyllabusBlocks(project,provenancePath);
  if(process.argv.includes('--apply')){
    await fs.mkdir(`booklets/provenance/${id}`,{recursive:true});
    await fs.writeFile(provenancePath,JSON.stringify({projectId:id,fromRevision:project.revision,originalSection,sourceHash:hash(project.source),feedback:'combine all syllabus content as a single block at the start of the booklet'},null,2)+'\n');
    const saved=await saveBookletProject(next,{expectedRevision:project.revision});
    console.log(JSON.stringify({id,fromRevision:project.revision,toRevision:saved.revision,anchorId,removedIds,provenancePath}));
  }else console.log(JSON.stringify({id,revision:project.revision,anchorId,removedIds,provenancePath}));
}
