import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {presentationVerificationKey} from '../../src/lib/booklet-presentation-verification.js';

const revisions={
  'data-visualisation-1-v1':350,
  'angle-relationships-v1':490,
  'index-laws-complete-v1':212,
  'volume-v1':423,
  'project-ac094b6d-f3e7-45ac-b585-6092b8d15f58':23
};
const id=process.argv[process.argv.indexOf('--project')+1];
if(!(id in revisions))throw Error('Pass a supported --project ID');
const project=await loadBookletProject(id);
if(project.revision!==revisions[id])throw Error(`Expected ${id} revision ${revisions[id]}, found ${project.revision}`);
const section=project.sections.find(s=>s.phase==='front-matter'&&/syllabus/i.test(s.title)&&s.role!=='candidate-pool');
if(section?.blocks.length!==1)throw Error('Opening syllabus is not consolidated');
const block=section.blocks[0];
if(!block.sourceReview)throw Error('Source review is missing');
const runId=block.sourceRefs?.find(ref=>ref.runId)?.runId;
const source=runId&&runId!==project.source?.runId?project.source?.imports?.find(item=>item.runId===runId)?.source:project.source;
const signature=await presentationVerificationKey(block,source?.sourceHashes,project.settings);
block.sourceReview.verification={checked:true,signature,reviewer:'Scoped syllabus feedback review',evidence:'.booklet-work/data-classification-feedback-2026-09-25',note:'Compared current editable content block by block with preserved originals and inspected its final-size opening page and immediate teaching neighbour in the affected student/combined-short layout.'};
if(process.argv.includes('--apply')){
  const saved=await saveBookletProject(project,{expectedRevision:project.revision});
  console.log(JSON.stringify({id,fromRevision:project.revision,toRevision:saved.revision,verified:block.id}));
}else console.log(JSON.stringify({id,revision:project.revision,verified:block.id}));
