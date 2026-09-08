import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createBookletProject,loadBookletProject,promoteProjectQuestion,saveBookletProject} from './project-studio-server.mjs';
import {assembleBooklet} from '../../src/lib/booklet-assembly.js';
import {reviewTargets} from '../../src/lib/booklet-review-model.js';
const copy=v=>JSON.parse(JSON.stringify(v));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const root='output/linear-bank';
const working=await loadBookletProject('linear-relationships-bank-working-v1');
const blocks=new Map(working.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
// Each subset retains its shared root prompt, diagrams, and all selected descendants.
const selections=[
 ['page-8-q6',['c','d'],6,1],['page-26-q1',['b','e'],3,1],['page-21-q3',['b','d'],8,1],
 ['page-52-b1',null,4,1],['page-80-q9',null,7,1],['page-40-q3',['a','h'],6,1],
 ['page-68-q1',null,10,1],['page-14-q2',['b','g'],4,1],
 ['page-31-q2',['b','f'],4,2],['page-45-q1',null,9,2],['page-86-q1',['b','g'],6,2],
 ['page-59-q1',null,7,2],['page-91-q1',['a','d'],6,2],['page-92-q2',null,6,2],
 ['page-57-q12',null,5,3],['page-70-q5',null,10,3],
];
const prepId='linear-relationships-revision-selection-v1';
let prep;
try{prep=await loadBookletProject(prepId);}catch{
 prep=copy(working);prep.id=prepId;prep.title='Linear Relationships — Revision selections';prep.sections=[{id:'revision-selections',title:'Revision selections',role:'candidate-pool',blocks:[]}];prep.revision=0;
 for(const [sourceId,parts] of selections){
  const b=copy(blocks.get(sourceId));if(!b)throw Error('Missing source '+sourceId);
  if(parts){
   b.id=sourceId+'-revision';b.content.children=b.content.children.filter(n=>parts.includes(n.label));
   if(b.content.children.length!==parts.length)throw Error('Part selection mismatch '+sourceId);
   b.content.children.forEach((n,i)=>n.label=String.fromCharCode(97+i));
   b.content.columns=Math.min(2,b.content.children.length);b.content.layout='grid';
   b.content.label=null;b.bankRef=null;b.snapshotKind='local';
   // Whole-question arrangement trees include omitted parts. Keep local node layouts only.
   delete b.presentation?.layoutOverrides?.blockLayouts?.[sourceId];
   const ids=new Set();const scan=v=>{if(!v||typeof v!=='object')return;if(v.id)ids.add(v.id);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(scan):scan(x));};scan(b.content);
   for(const key of Object.keys(b.presentation?.layoutOverrides??{}))b.presentation.layoutOverrides[key]=Object.fromEntries(Object.entries(b.presentation.layoutOverrides[key]).filter(([id])=>ids.has(id)));
   b.provenance={...b.provenance,selectedSourcePartLabels:parts,selectionReason:'Independent sibling exercises with shared root retained; source bank question remains complete.'};
  }
  b.pedagogyRole='practice';delete b.sourceOrder;b.content.label=null;
  prep.sections[0].blocks.push(b);
 }
 await createBookletProject(prep);
}
// The source graph's colours were adjusted after its colour-based answer was written.
// Use coordinates to identify the lines in a separate reusable revision variant.
const comparison=prep.sections[0].blocks.find(b=>b.id==='page-80-q9');
if(comparison){
 comparison.id='page-80-q9-revision';comparison.bankRef=null;comparison.snapshotKind='local';
 const answer=comparison.content.children.find(n=>n.id==='page-80-q9-d').answer;
 answer.short='$y=2x+3$: through $(0,3)$ and $(1,5)$; $y=2x-4$: through $(0,-4)$ and $(2,0)$; $y=-x+1$: decreasing, through $(0,1)$; $y=4x+3$: steepest rising line, through $(0,3)$.';
 answer.worked='Identify each line by its intercept and change in $y$ for a one-unit increase in $x$.\n\n'+answer.short;
 comparison.provenance={...comparison.provenance,revisionCorrection:'Replaced stale colour descriptions with coordinate-based line identification; graph unchanged.'};
 prep=await saveBookletProject(prep,{expectedRevision:prep.revision});
}
for(const b of prep.sections[0].blocks)if(!b.bankRef?.id)await promoteProjectQuestion(prepId,{blockId:b.id,mode:'create'});
prep=await loadBookletProject(prepId);
const candidates=[],selectionReport=[];
for(let i=0;i<selections.length;i++){
 const [sourceId,parts,minutes,session]=selections[i],b=prep.sections[0].blocks[i];
 const q=JSON.parse(await fs.readFile('booklets/question-bank/'+b.bankRef.id+'.json','utf8'));
 const skillIds=[q.classification.primarySkillId,...q.classification.secondarySkillIds];
 const prerequisiteIds=[...new Set(reviewTargets({sections:[{blocks:[b]}]}).flatMap(t=>t.node.teachingMapping?.prerequisiteIds??[]))];
 candidates.push({question:q,origin:'bank',sourceId:q.id,revision:hash(q),skillIds,prerequisiteIds,tier:q.classification.difficulty});
 selectionReport.push({sourceBlockId:sourceId,sourcePartLabels:parts,bankId:q.id,bankRevision:hash(q),module:blocks.get(sourceId).provenance.moduleId,minutes,session});
}
const recipe={format:'mathsmap-assembly-recipe-v1',mode:'revision',title:'Linear Relationships — Revision',chunks:[],counts:{},extensions:[],exceptions:{},scopeSkillIds:[...new Set(candidates.flatMap(c=>c.skillIds))],assumedPrerequisites:[...new Set(candidates.flatMap(c=>c.prerequisiteIds))],sessions:[1,2,3].map(n=>({title:n===3?'Optional challenge':`Session ${n} — Mixed revision`,optional:n===3,questionIds:selectionReport.filter(s=>s.session===n).map(s=>s.bankId)}))};
recipe.questionRevisions=Object.fromEntries(candidates.map(c=>[c.question.id,c.revision]));
const result=assembleBooklet(prep,recipe,candidates);
result.project.id='linear-relationships-revision-v1';result.project.subtitle='Stage 4 • Two lessons of mixed practice';
// Keep labels sequential in the new booklet rather than copying source numbering.
let number=0;for(const s of result.project.sections)for(const b of s.blocks)b.sourceOrder=++number;
for(const s of result.project.sections)for(const b of s.blocks){
 if([7,16].includes(b.sourceOrder)){
  const applications=b.content.children.find(n=>n.children?.length);
  applications?.children.forEach((n,i)=>n.label=String.fromCharCode(97+i));
 }
 if(b.sourceOrder===11)for(const n of b.content.children)n.answerSpaceMm=Math.max(18,n.answerSpaceMm??0);
}
result.project.settings.showTheorySolutions=false;
try{const old=await loadBookletProject(result.project.id);await saveBookletProject(result.project,{expectedRevision:old.revision});}catch(e){if(e.statusCode!==404)throw e;await createBookletProject(result.project);}
await fs.writeFile(root+'/revision-selection.json',JSON.stringify({recipe,selections:selectionReport,coreMinutes:selectionReport.filter(s=>s.session<3).reduce((n,s)=>n+s.minutes,0),challengeMinutes:15,coverageGaps:[]},null,2));
console.log(JSON.stringify({project:result.project.id,questions:result.selectedQuestionCount,selections:selectionReport.map(s=>({source:s.sourceBlockId,parts:s.sourcePartLabels,minutes:s.minutes}))}));
