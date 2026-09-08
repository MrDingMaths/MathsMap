// Resumable, source-preserving preparation of the reviewed Linear Relationships bank.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createBookletProject,loadBookletProject,promoteProjectQuestion,promoteProjectModule} from './project-studio-server.mjs';
import {reviewTargets} from '../../src/lib/booklet-review-model.js';
import {contentSource} from '../../src/lib/document-content.js';
import {normaliseQuestion,validateQuestion} from '../../src/lib/practice-question-model.js';
import {isTheoryReview} from '../../src/lib/question-bank-eligibility.js';
import {linearAssessments} from './linear-bank-assessments.mjs';
import {assessedClassification} from './reassess-linear-bank.mjs';

const sourcePath='booklets/projects/linear-relationships-complete-v1.json';
const out='output/linear-bank';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const copy=v=>JSON.parse(JSON.stringify(v));
const unique=v=>[...new Set(v.filter(Boolean))];
const write=async(file,v)=>fs.writeFile(file,JSON.stringify(v,null,2)+'\n');
const audit=JSON.parse(await fs.readFile('docs/linear-relationships-atomisation-audit.json','utf8'));
const skills=JSON.parse(await fs.readFile('data/skills.json','utf8'));
const validSkills=new Set(skills.map(s=>s.id));
const targetAudit=new Map(audit.targets.map(t=>[t.targetId,t]));
const workId='linear-relationships-bank-working-v1';
await fs.mkdir(out,{recursive:true});
let baseline;
try{baseline=JSON.parse(await fs.readFile(out+'/baseline.json','utf8'));}catch{
  const raw=await fs.readFile(sourcePath,'utf8');
  const source=JSON.parse(raw);
  baseline={projectId:source.id,revision:source.revision,sha256:hash(raw),capturedAt:new Date().toISOString()};
  await fs.writeFile(out+'/source-snapshot.json',raw);await write(out+'/baseline.json',baseline);
}
const source=JSON.parse(await fs.readFile(out+'/source-snapshot.json','utf8'));
const chunks=audit.chunks.filter(c=>c.id!=='LR-C00');
const moduleFor=b=>chunks.find(c=>c.targetIds.includes(b.id))??chunks.find(c=>c.pages.includes(b.sourcePageNumber));
const inventory=[],gaps=[];
let working;
try{working=await loadBookletProject(workId);}catch{
  working=copy(source);working.id=workId;working.title='Linear Relationships — Reusable bank';working.revision=0;
  working.source={type:'project-copy',projectId:source.id,revision:baseline.revision,sha256:baseline.sha256};
  working.sections=chunks.map(c=>({id:'linear-module-'+c.id,title:c.title,role:'teaching',blocks:[]}));
  working.studio={version:1,atoms:{},lineage:{},flags:[]};
  for(const section of source.sections)for(const original of section.blocks){
    const b=copy(original);b.sourcePageNumber??=section.sourcePageNumber;
    const chunk=moduleFor(b);
    if(!chunk){if(b.sourcePageNumber>2)throw Error('Unassigned block '+b.id);continue;}
    const targets=reviewTargets({sections:[{blocks:[b]}]});
    for(const t of targets){
      const a=targetAudit.get(t.id),existing=source.studio?.atoms?.[t.id];
      const links=unique((a?.recommendedLinks??[]).map(l=>l.skillId).filter(id=>validSkills.has(id)));
      const skillIds=links.length?links:(existing?.skillIds??[]).filter(id=>validSkills.has(id));
      const role=a?.roles?.includes('teaches')?'teaches':a?.roles?.includes('assesses')?'assesses':'practises';
      const atom={skillIds,role,prerequisiteIds:unique(skillIds.flatMap(id=>skills.find(s=>s.id===id)?.prereqs??[])),archetype:(a?.teachingAtomIds??[]).join('+')||chunk.id,rationale:'Classification of revised source content; no teaching-content edits.',sourcePages:[b.sourcePageNumber],sourceTargetId:t.id};
      working.studio.atoms[t.id]=atom;
      if(t.kind!=='block')t.node.teachingMapping=copy(atom);
    }
    if(b.type==='question'){
      const mapping=working.studio.atoms[b.id];
      const mapped=unique(targets.flatMap(t=>working.studio.atoms[t.id]?.skillIds??[]));
      if(!mapped.length)throw Error('No valid mapping '+b.id);
      mapping.skillIds=mapped;
      const independent=targetAudit.get(b.id)?.roles?.includes('assesses')&&!['guided-practice','identify','investigation'].includes(b.pedagogyRole);
      b.pedagogyRole??=independent?'practice':(/guided|gp/.test(b.id)?'guided-practice':'practice');
      const extension=b.id==='page-93-q6'||b.id==='page-93-q5';
      const assessment=linearAssessments[b.id];
      if(!assessment)throw Error('Question needs an individual reasoning assessment: '+b.id);
      b.classification=normaliseQuestion({classification:{primarySkillId:mapped[0],secondarySkillIds:mapped.slice(1),archetype:mapping.archetype,...assessment}}).classification;
      b.classification=assessedClassification(b,b.id);
      mapping.skillIds=[b.classification.primarySkillId,...b.classification.secondarySkillIds];
      if(isTheoryReview(b,section))b.libraryRole='theory-review';
      const ids=new Set([b.id]);const scan=v=>{if(!v||typeof v!=='object')return;if(v.id)ids.add(v.id);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(scan):scan(x));};scan(b.content);
      b.presentation={layoutOverrides:Object.fromEntries(['blockLayouts','answerSpaces','diagramColourModes'].map(key=>[key,Object.fromEntries(Object.entries(source.settings?.layoutOverrides?.[key]??{}).filter(([id])=>ids.has(id)))]))};
      b.provenance={projectId:source.id,revision:baseline.revision,projectSha256:baseline.sha256,sourceBlockIds:[b.id],sourcePages:[b.sourcePageNumber],moduleId:chunk.id,revisionEligible:independent&&!extension,extension,sourceContentSha256:hash(original.content)};
      const check=validateQuestion(normaliseQuestion(b));if(!check.valid)throw Error(b.id+': '+check.errors.join('; '));
    }
    working.sections.find(s=>s.id==='linear-module-'+chunk.id).blocks.push(b);
  }
  await createBookletProject(working);
}
// The cross-page graphing module is processed first as the transfer pilot.
const order=[chunks.find(c=>c.id==='LR-C03'),...chunks.filter(c=>c.id!=='LR-C03')];
for(const chunk of order){
  working=await loadBookletProject(workId);
  const section=working.sections.find(s=>s.id==='linear-module-'+chunk.id);
  for(const block of section.blocks.filter(b=>b.type==='question')){
    if(isTheoryReview(block,section))continue;
    if(!block.bankRef?.id)await promoteProjectQuestion(workId,{blockId:block.id,mode:'create'});
  }
  working=await loadBookletProject(workId);
  const current=working.sections.find(s=>s.id===section.id);
  const moduleId='linear-relationships-'+chunk.id.toLowerCase();
  try{await fs.access('booklets/module-bank/'+moduleId+'.json');}catch{
    const skillIds=unique(current.blocks.flatMap(b=>working.studio.atoms[b.id]?.skillIds??[]));
    await promoteProjectModule(workId,{sectionId:current.id,id:moduleId,title:chunk.title,classification:{primarySkillId:skillIds[0],secondarySkillIds:skillIds.slice(1),mappingStatus:'cross-skill'}});
  }
  inventory.push({id:moduleId,title:chunk.title,sourcePages:chunk.pages,blocks:current.blocks.map(b=>({id:b.id,type:b.type,page:b.sourcePageNumber,bankRef:b.bankRef??null,parts:b.type==='question'?reviewTargets({sections:[{blocks:[b]}]}).filter(t=>t.kind==='part').map(t=>t.id):[]}))});
  console.log('Banked '+chunk.title);
}
working=await loadBookletProject(workId);
const graphChecks=[];
for(const b of working.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question'&&!isTheoryReview(b))){
  const bank=JSON.parse(await fs.readFile('booklets/question-bank/'+b.bankRef.id+'.json','utf8'));
  const expected=normaliseQuestion(b);
  if(hash(expected.content)!==hash(bank.content)||hash(expected.presentation)!==hash(bank.presentation))throw Error('Bank transfer mismatch '+b.id);
  graphChecks.push({sourceBlockId:b.id,bankId:bank.id,contentEqual:true,presentationEqual:true});
}
const currentHash=hash(await fs.readFile(sourcePath,'utf8'));
if(currentHash!==baseline.sha256)gaps.push({kind:'source-changed',reason:'Source was edited after baseline capture. Bank remains pinned to the captured revision; reconcile later edits explicitly.'});
const accounted=inventory.flatMap(m=>m.blocks.map(b=>b.id));
const sourceBlocks=source.sections.flatMap(s=>s.blocks);
const frontMatter=sourceBlocks.filter(b=>!accounted.includes(b.id)).map(b=>b.id);
if(frontMatter.some(id=>!['page-1-cover','page-1-contents','page-2-content'].includes(id)))throw Error('Unaccounted content');
await write(out+'/inventory.json',{baseline,modules:inventory,frontMatter,contextGroups:audit.contextGroups,gaps});
await write(out+'/transfer-verification.json',{baseline,sourceUnchanged:currentHash===baseline.sha256,questions:graphChecks,blocks:accounted.length,frontMatter:frontMatter.length});
await fs.writeFile(out+'/inventory.md','# Linear Relationships reusable bank\n\nSource revision '+baseline.revision+'. Original project preserved.\n\n| Module | Source pages | Blocks | Questions |\n|---|---|---:|---:|\n'+inventory.map(m=>'| '+m.title+' | '+m.sourcePages[0]+'–'+m.sourcePages.at(-1)+' | '+m.blocks.length+' | '+m.blocks.filter(b=>b.bankRef).length+' |').join('\n')+'\n\nSynchronization is deferred: bank updates are explicit; existing booklet snapshots do not automatically refresh.\n');
console.log(JSON.stringify({workingProject:workId,modules:inventory.length,questions:graphChecks.length,gaps}));
