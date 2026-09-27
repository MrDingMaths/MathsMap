import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {contentNodes,contentVerificationKey} from '../../src/lib/booklet-content-verification.js';
import {sourceInventories} from '../../src/lib/booklet-source-content.js';

const PROJECT='data-visualisation-1-v1';
const provenancePath='booklets/provenance/data-visualisation-1-v1/feedback-2026-09-25.json';
const syllabusIds=['data-classification--p2-syllabus','p2-syllabus-content','data-visualisation-2--p2-syllabus'];
const choiceIds=['data-classification--p7-q4','data-classification--p7-q5','data-classification--p9-q14','data-classification--p9-q15'];
const clone=value=>structuredClone(value);
const hash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const find=(project,id)=>project.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
const likertOptions=project=>find(project,'data-classification--p8-q10')?.content?.children?.[1]?.prompt?.blocks?.find(b=>b.id==='data-classification--p8-q10-options');

export function repairParallelChoiceLabels(project){
  const next=clone(project),layout=likertOptions(next);
  if(layout?.slots?.length!==4)throw Error('Likert choices changed');
  layout.slots.forEach((slot,index)=>{
    const paragraph=slot.blocks?.[0],inline=paragraph?.inlines?.[0],match=inline?.text?.match(/^([A-Da-d][.]) (.+)$/);
    if(!match||match[1][0].toUpperCase()!==String.fromCharCode(65+index))throw Error(`Unexpected Likert option ${index}`);
    paragraph.inlines=[{type:'text',text:match[1].toUpperCase()+' ',marks:['bold']},{type:'text',text:match[2]}];
  });
  return next;
}

export function repairDataClassificationFeedback(project){
  const next=clone(project);
  const originals=syllabusIds.map(id=>{
    const section=next.sections.find(s=>s.blocks.some(b=>b.id===id));
    if(!section)throw Error(`Missing syllabus source ${id}`);
    return {section:clone(section),block:section.blocks.find(b=>b.id===id)};
  });
  const originalSections=originals.map(x=>clone(x.section));
  const [first,second,third]=originals.map(x=>x.block);
  if(first.content.blocks.length!==3||second.content.blocks.length!==4||third.content.blocks.length!==3)throw Error('Syllabus source structure changed');
  // One editable document keeps the three source focus statements and every bullet.
  // Repeated outcome and source-specific heading furniture remain in provenance.
  first.content.blocks.push(...clone(second.content.blocks.slice(2)),...clone(third.content.blocks.slice(1)));
  first.sourceRefs=[...first.sourceRefs,...second.sourceRefs,...third.sourceRefs];
  first.sourceReview={...first.sourceReview,verification:{checked:false,note:'Combined syllabus layout awaits current feedback verification; prior accepted evidence is retained in provenance.'}};
  first.feedbackProvenance={path:provenancePath,sourceBlockIds:syllabusIds,sourceHash:hash(originalSections)};
  next.sections=next.sections.filter(s=>!['p2-front-matter','data-visualisation-2--p2-section'].includes(s.id));
  for(const id of choiceIds){
    const table=find(next,id)?.content?.prompt?.blocks?.find(b=>b.type==='table'&&b.rows?.length===4);
    if(!table)throw Error(`Missing multiple-choice table ${id}`);
    table.rows.forEach((row,index)=>{
      const inline=row?.[0]?.blocks?.[0]?.inlines?.[0];
      if(!inline||!new RegExp(`^[A-Da-d][.]?$`).test(inline.text))throw Error(`Unexpected option label ${id} ${index}`);
      inline.text=inline.text.toUpperCase();
      inline.marks=[...new Set([...(inline.marks??[]),'bold'])];
    });
  }
  const plate=find(next,'data-classification--p8-q9')?.content?.questionDiagrams?.[0];
  if(!plate?.code?.includes('VICTORIA - THE EDUCATION STATE'))throw Error('Number plate source changed');
  plate.code=plate.code.replace('\\node at (25,15) {123};\\node at (59,15) {EDL};\n\\node at (42,6) {VICTORIA - THE EDUCATION STATE};',
    '\\node at (42,11) {\\special{dvisvgm:raw <g data-diagram-label-target-pt="14">}\\textbf{123 EDL}\\special{dvisvgm:raw </g>}};');
  if(plate.code.includes('VICTORIA - THE EDUCATION STATE'))throw Error('Number plate caption was not removed');
  plate.spec={...plate.spec,description:'Vehicle number plate 123 EDL; border, mounting dots, triangular centre emblem. The state slogan is intentionally omitted and the identifier enlarged per feedback.'};
  return {next,originalSections};
}

if(process.argv[1]?.replaceAll('\\','/').endsWith('/repair-data-classification-feedback.mjs')){
  const source=await loadBookletProject(PROJECT);
  if(process.argv.includes('--resolve')){
    if(source.revision!==349)throw Error(`Expected revision 349, found ${source.revision}`);
    const next=clone(source),resolutions={
      '811be730-3fe0-42e8-8a42-86211c3b8238':'Three source syllabus focus statements and all 13 bullets are consolidated in one editable opening block. Repeated outcome/header furniture and the original blocks remain in feedback-2026-09-25.json; source inventory mappings record the editorial consolidation. Inspected student and with-short page 2 and the following teaching page.',
      '88497a4f-682b-41c0-9243-1e4dbe13a782':'Audited seven active multiple-choice arrangements across current books. Repaired four classification tables and the Likert parallel options; Probability labels were already compliant. Inspected student and with-short pages 6, 9 and 10, and passed the project-wide label regression.',
      '317083d7-abab-41fa-a30b-4dbf95ed256f':'Removed the Victoria slogan and enlarged the combined 123 EDL identifier to 14 pt. Final-size student and with-short page 8 show clear placement; diagram QA measured 14.000 pt with no clipping or overlap. The source plate remains in feedback provenance and the mounting-dot shading review is source hashed.'
    };
    for(const [id,resolution]of Object.entries(resolutions)){
      const flag=next.studio?.flags?.find(x=>x.id===id);
      if(!flag||flag.resolved)throw Error(`Comment state changed: ${id}`);
      Object.assign(flag,{resolved:true,resolution,resolvedAt:new Date().toISOString(),evidence:'.booklet-work/data-classification-feedback-2026-09-25/final/development-report.json'});
    }
    if(process.argv.includes('--apply')){
      const saved=await saveBookletProject(next,{expectedRevision:source.revision});
      console.log(JSON.stringify({fromRevision:source.revision,toRevision:saved.revision,resolved:Object.keys(resolutions)}));
    }else console.log(JSON.stringify({fromRevision:source.revision,resolved:Object.keys(resolutions)}));
    process.exit(0);
  }
  if(process.argv.includes('--restore-slots')){
    if(source.revision!==348)throw Error(`Expected revision 348, found ${source.revision}`);
    const next=clone(source),provenance=JSON.parse(await fs.readFile(provenancePath,'utf8'));
    for(const [index,position] of [[1,5],[2,28]]){
      const old=provenance.originalSyllabusSections[index];
      if(next.sections.some(s=>s.id===old.id))throw Error(`Section slot already exists: ${old.id}`);
      next.sections.splice(position,0,{...clone(old),role:'candidate-pool',blocks:[],feedbackConsolidation:{into:syllabusIds[0],evidence:provenancePath}});
    }
    if(process.argv.includes('--apply')){
      const saved=await saveBookletProject(next,{expectedRevision:source.revision});
      console.log(JSON.stringify({fromRevision:source.revision,toRevision:saved.revision,originalSectionPositionsPreserved:true}));
    }else console.log(JSON.stringify({fromRevision:source.revision,originalSectionPositionsPreserved:true}));
    process.exit(0);
  }
  if(process.argv.includes('--inventory')){
    if(source.revision!==347)throw Error(`Expected revision 347, found ${source.revision}`);
    const next=clone(source);
    const relocated='Original source wrapper or repeated heading was consolidated into data-classification--p2-syllabus. All substantive focus statements and bullets remain editable there; original structure and source review are retained in feedback-2026-09-25.json.';
    next.sourceInventoryOverrides=Object.fromEntries([
      'p2-overview','p2-syllabus-heading','p2-syllabus-outcome','derived-p2-syllabus-content',
      'data-visualisation-2--p2-heading','data-visualisation-2--p2-syllabus'
    ].map(id=>[id,{exclusionReason:relocated}]));
    const entry=sourceInventories(next).flatMap(x=>x.entries).find(e=>e.id==='data-classification--p2-syllabus');
    if(!entry)throw Error('Missing classification source inventory entry');
    const signature=await contentVerificationKey(next,entry,contentNodes(next));
    next.sourceInventoryOverrides[entry.id]={verification:{checked:true,signature,reviewer:'Feedback consolidation inspection',evidence:provenancePath,note:'Three source syllabus lists were compared with preserved originals and the consolidated final-size student page 2.'}};
    if(process.argv.includes('--apply')){
      const saved=await saveBookletProject(next,{expectedRevision:source.revision});
      console.log(JSON.stringify({fromRevision:source.revision,toRevision:saved.revision,excludedSourceWrappers:6,verifiedCombinedSyllabus:entry.id}));
    }else console.log(JSON.stringify({fromRevision:source.revision,excludedSourceWrappers:6,verifiedCombinedSyllabus:entry.id}));
    process.exit(0);
  }
  if(process.argv.includes('--parallel-choice')){
    if(source.revision!==346)throw Error(`Expected revision 346, found ${source.revision}`);
    const originalOptions=clone(likertOptions(source));
    const next=repairParallelChoiceLabels(source);
    const provenance=JSON.parse(await fs.readFile(provenancePath,'utf8'));
    provenance.originalLikertOptions=originalOptions;
    if(process.argv.includes('--apply')){
      const saved=await saveBookletProject(next,{expectedRevision:source.revision});
      await fs.writeFile(provenancePath,JSON.stringify(provenance,null,2)+'\n');
      console.log(JSON.stringify({fromRevision:source.revision,toRevision:saved.revision,parallelChoices:4}));
    }else console.log(JSON.stringify({fromRevision:source.revision,parallelChoices:4}));
    process.exit(0);
  }
  const {next,originalSections}=repairDataClassificationFeedback(source);
  const provenance={projectId:PROJECT,fromRevision:source.revision,comments:['811be730-3fe0-42e8-8a42-86211c3b8238','88497a4f-682b-41c0-9243-1e4dbe13a782','317083d7-abab-41fa-a30b-4dbf95ed256f'],originalSyllabusSections:originalSections,originalPlate:find(source,'data-classification--p8-q9').content.questionDiagrams[0],sourceHash:hash(source.source),reason:'Consolidate syllabus presentation; uppercase bold choice labels; enlarge the local plate identifier and omit the slogan while retaining source evidence.'};
  if(process.argv.includes('--apply')){
    if(source.revision!==345)throw Error(`Expected revision 345, found ${source.revision}`);
    await fs.mkdir('booklets/provenance/data-visualisation-1-v1',{recursive:true});
    await fs.writeFile(provenancePath,JSON.stringify(provenance,null,2)+'\n');
    const saved=await saveBookletProject(next,{expectedRevision:source.revision});
    console.log(JSON.stringify({fromRevision:source.revision,toRevision:saved.revision,syllabusBlocks:find(saved,syllabusIds[0]).content.blocks.length,provenancePath}));
  }else console.log(JSON.stringify({fromRevision:source.revision,candidateHash:hash(next),syllabusBlocks:find(next,syllabusIds[0]).content.blocks.length,removedSections:2,choiceQuestions:choiceIds.length,provenancePath}));
}
