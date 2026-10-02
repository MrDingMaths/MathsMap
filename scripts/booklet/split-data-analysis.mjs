// Split accepted editable content without reauthoring questions or source evidence.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {saveBookletProject} from './project-studio-server.mjs';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {isPractice, exerciseNumbers, flowNumbers} from '../../src/lib/booklet-flow.js';
import {syncLinks} from './bank-sync.mjs';

const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name)+1] : fallback;
const out = path.resolve(arg('--out', '.booklet-work/data-analysis-split-20261001'));
const sourceFile = path.resolve('booklets/projects/data-analysis-v1.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const write = (file, value) => { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value,null,2)+'\n'); };
const definitions = [
  {id:'data-analysis-v1', number:1, name:'Summary Statistics', first:0, last:8, pages:[4,32]},
  {id:'data-analysis-2-v1', number:2, name:'Analysing Tables and Plots', first:8, last:15, pages:[33,61]},
  {id:'data-analysis-3-v1', number:3, name:'Comparing and Interpreting Data', first:15, last:24, pages:[62,94]},
];
const receiptFile = path.join(out,'receipt.json');

function checkConservation(original, projects) {
  const old = structuredClone(original.sections.filter(s=>s.phase!=='front-matter').flatMap(s=>s.blocks));
  // One measured existing overflow: give the long mean numerator 1.6 mm more room.
  old.find(b=>b.id==='p62-example').examples[0].theorySolution.blocks[0].widths=[28,72];
  const current = projects.flatMap(p=>p.sections.filter(s=>s.phase!=='front-matter').flatMap(s=>s.blocks));
  assert.equal(new Set(current.map(b=>b.id)).size,current.length,'A block occurs in more than one booklet');
  assert.deepEqual(current,old,'All teaching, questions, solutions, classifications and source references remain unchanged and in order');
  for (const project of projects) {
    const check=validateEditableProject(project);assert.ok(check.valid,check.errors.join('; '));
    const exercises=Object.values(exerciseNumbers(project));
    assert.deepEqual(exercises,exercises.map((_,i)=>i+1),'Each booklet restarts exercise numbering at one');
    const originalNumbers=flowNumbers(original), numbers=flowNumbers(project);
    for(const [id,number] of Object.entries(numbers))assert.equal(number,originalNumbers[id],'Within-exercise numbering is preserved');
    for(const section of project.sections.filter(s=>s.phase!=='front-matter')) {
      assert.ok(project.topics.some(t=>t.id===section.topicId),'Every section has its topic');
      for(const block of section.blocks)for(const dependency of [...(block.dependsOn??[]),...(block.pairedBlockId?[block.pairedBlockId]:[])])
        assert.ok(current.some(b=>b.id===dependency)&&project.sections.some(s=>s.blocks.some(b=>b.id===dependency)),'Related blocks stay together');
    }
  }
  const third=projects[2];
  assert.equal(third.topics.filter(t=>t.title==='Impact of outliers').length,1);
  assert.ok(!third.topics.some(t=>['clusters-gaps-outliers','adding-removing-values'].includes(t.id)));
  return {contentBlocks:old.length,practiceQuestions:old.filter(isPractice).length,unchangedMathematics:true,layoutRepair:'p62-example mean calculation table column proportions 30/70 -> 28/72; width remains 80 mm'};
}

if(process.argv.includes('--apply')) {
  const receipt=JSON.parse(fs.readFileSync(receiptFile,'utf8'));
  assert.equal(digest(fs.readFileSync(sourceFile)),receipt.input.hash,'Source changed since staging; restage before publishing');
  const original=JSON.parse(fs.readFileSync(path.join(out,'original.json'),'utf8'));
  const projects=definitions.map(d=>JSON.parse(fs.readFileSync(path.join(out,'projects',d.id+'.json'),'utf8')));
  checkConservation(original,projects);
  const links=await syncLinks(path.resolve('booklets/question-bank'));
  assert.equal(Object.values(links).filter(l=>l.projectId===original.id).length,0,'Owner-linked content needs an explicit ownership transfer');
  for(const project of projects.slice(1))assert.ok(!fs.existsSync(path.resolve('booklets/projects',project.id+'.json')),'Split target already exists');
  // New projects first; keep the full original available until their saves succeed.
  for(const project of [...projects.slice(1),projects[0]]) {
    const saved=await saveBookletProject(project,project.id===original.id?{expectedRevision:original.revision,checkpoint:true}:{create:true});
    assert.deepEqual(saved.sections,project.sections,'Saved content and section structure match the checked candidate');
    receipt.outputs.find(d=>d.id===project.id).revision=saved.revision;
  }
  const saved=definitions.map(d=>JSON.parse(fs.readFileSync(path.resolve('booklets/projects',d.id+'.json'),'utf8')));
  receipt.readback=checkConservation(original,saved);receipt.publishedAt=new Date().toISOString();
  write(receiptFile,receipt);console.log(JSON.stringify({published:receipt.outputs,readback:receipt.readback}));
} else {
  assert.ok(!fs.existsSync(receiptFile),'Use a new output directory rather than overwrite a prior split');
  const bytes=fs.readFileSync(sourceFile), original=JSON.parse(bytes);
  const projects=definitions.map(def=>{
    const project=structuredClone(original), topicIds=new Set(original.topics.slice(def.first,def.last).map(t=>t.id));
    project.id=def.id;project.title=`Data Analysis ${def.number}: ${def.name} v1`;
    project.settings.cover={...project.settings.cover,title:def.name,book:`Book ${def.number}`,version:'261001'};
    project.sections=project.sections.filter(s=>s.phase==='front-matter'||topicIds.has(s.topicId));
    if(def.number===3) {
      for(const section of project.sections)if(['clusters-gaps-outliers','adding-removing-values'].includes(section.topicId)) {
        section.topicId='impact-of-outliers';if(section.phase==='teaching')section.title='Impact of outliers';
      }
      project.sections.flatMap(s=>s.blocks).find(b=>b.id==='p62-example').examples[0].theorySolution.blocks[0].widths=[28,72];
    }
    const usedTopics=new Set(project.sections.map(s=>s.topicId));
    project.topics=project.topics.filter(t=>usedTopics.has(t.id));
    if(def.number===3)project.topics.splice(2,0,{id:'impact-of-outliers',title:'Impact of outliers'});
    const pages=new Set([1,2,3,...Array.from({length:def.pages[1]-def.pages[0]+1},(_,i)=>def.pages[0]+i)]);
    const inventory=project.source.inventory;
    inventory.selectedPages=inventory.selectedPages.filter(p=>pages.has(p));
    inventory.pages=inventory.pages.filter(p=>pages.has(p.pageNumber));
    inventory.entries=inventory.entries.filter(e=>pages.has(e.pageNumber));
    const inventoryIds=new Set(inventory.entries.map(e=>e.id));
    project.sourceInventoryOverrides=Object.fromEntries(Object.entries(project.sourceInventoryOverrides).filter(([id])=>inventoryIds.has(id)));
    const ids=new Set();const visit=v=>{if(!v||typeof v!=='object')return;if(v.id)ids.add(v.id);Object.values(v).forEach(visit);};visit(project.sections);
    for(const store of Object.keys(project.settings.layoutOverrides))project.settings.layoutOverrides[store]=Object.fromEntries(Object.entries(project.settings.layoutOverrides[store]).filter(([id])=>ids.has(id)));
    project.settings.compactAnswers.diagramWidths=Object.fromEntries(Object.entries(project.settings.compactAnswers.diagramWidths).filter(([id])=>ids.has(id)));
    // Keep applicable historical comments and their resolutions; the full record is in original.json.
    project.studio.flags=project.studio.flags.filter(f=>f.targetId?ids.has(f.targetId):(f.sourceRefs?.length?f.sourceRefs.some(r=>pages.has(r.pageNumber)):true));
    project.studio.lineage=Object.fromEntries(Object.entries(project.studio.lineage).filter(([id])=>ids.has(id)));
    project.source.partition={parentProjectId:original.id,parentRevision:original.revision,parentHash:digest(bytes),number:def.number,total:3,sourcePages:def.pages,originalSnapshot:path.join(out,'original.json'),topicMerge:def.number===3?{from:['clusters-gaps-outliers','adding-removing-values'],to:'impact-of-outliers',title:'Impact of outliers'}:null};
    if(def.number!==1){project.revision=0;project.createdAt=null;project.updatedAt=null;}
    return project;
  });
  const conservation=checkConservation(original,projects);
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'original.json'),bytes);
  for(const project of projects)write(path.join(out,'projects',project.id+'.json'),project);
  const receipt={startedAt:new Date().toISOString(),input:{revision:original.revision,hash:digest(bytes)},scope:'Existing-booklet structural maintenance; no questions, solutions, diagrams or teaching methods changed.',verificationScope:'Content conservation, revision-safe save/readback, edition numbering/navigation/page maps, covers and new boundaries; reuse unchanged content and diagram evidence.',conservation,outputs:projects.map(p=>({id:p.id,title:p.title,topics:p.topics.length,practiceQuestions:p.sections.flatMap(s=>s.blocks).filter(isPractice).length,file:path.join(out,'projects',p.id+'.json')}))};
  write(receiptFile,receipt);console.log(JSON.stringify(receipt));
}
