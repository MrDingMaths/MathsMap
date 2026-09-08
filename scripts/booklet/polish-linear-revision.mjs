import fs from 'node:fs/promises';
import {loadBookletProject,saveBookletProject,promoteProjectQuestion} from './project-studio-server.mjs';
const id='linear-relationships-revision-selection-v1';
let prep=await loadBookletProject(id);
const b=prep.sections[0].blocks.find(b=>b.id==='page-80-q9-revision');
const worked=[
 'The lines $y=2x+3$ and $y=2x-4$ have the same coefficient of $x$ and different constant terms, so they are parallel.',
 'The increasing lines have positive coefficients of $x$: $y=2x+3$, $y=2x-4$ and $y=4x+3$.',
 'The lines $y=2x+3$ and $y=4x+3$ both pass through $(0,3)$, so they have the same $y$-intercept.',
];
if(worked.some((value,i)=>b.content.children[i].answer.worked!==value)){
 worked.forEach((value,i)=>b.content.children[i].answer.worked=value);
 prep=await saveBookletProject(prep,{expectedRevision:prep.revision});
 const promoted=await promoteProjectQuestion(id,{blockId:b.id,mode:'update'});
 const project=await loadBookletProject('linear-relationships-revision-v1');
 const placed=project.sections.flatMap(s=>s.blocks).find(v=>v.bankRef?.id===b.bankRef.id);
 worked.forEach((value,i)=>placed.content.children[i].answer.worked=value);
 placed.bankRef=promoted.project.sections[0].blocks.find(v=>v.id===b.id).bankRef;
 project.studio.recipe.questionRevisions[b.bankRef.id]=placed.bankRef.revision;
 await saveBookletProject(project,{expectedRevision:project.revision});
 const report=JSON.parse(await fs.readFile('output/linear-bank/revision-selection.json','utf8'));
 report.recipe.questionRevisions[b.bankRef.id]=placed.bankRef.revision;
 report.selections.find(s=>s.bankId===b.bankRef.id).bankRevision=placed.bankRef.revision;
 await fs.writeFile('output/linear-bank/revision-selection.json',JSON.stringify(report,null,2));
}
