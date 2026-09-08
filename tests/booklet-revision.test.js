import test from 'node:test';
import assert from 'node:assert/strict';
import {assembleBooklet} from '../src/lib/booklet-assembly.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {createEditableProject,snapshotBankQuestion,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const candidate=(id)=>({question:normaliseQuestion({id,classification:{primarySkillId:'skill'},content:{id:id+'-root',prompt:'Question '+id,children:[],questionDiagrams:[{id:id+'-graph',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}',widthMm:58}],representations:{pattern:'Pattern',table:'Table',equation:'Equation',graph:'Graph',diagramSlots:{[id+'-graph']:'graph'}},answer:{short:'2',worked:'1+1=2'}},presentation:{ownerId:'source-'+id,layoutOverrides:{blockLayouts:{['source-'+id]:{diagramWidthMm:58}},answerSpaces:{[id+'-root']:24}}}}),origin:'bank',sourceId:id,revision:'pinned',skillIds:['skill'],prerequisiteIds:[]});
const recipe=()=>({format:'mathsmap-assembly-recipe-v1',mode:'revision',scopeSkillIds:['skill'],sessions:[{title:'First',questionIds:['b','a']},{title:'Challenge',questionIds:['c'],optional:true}],assumedPrerequisites:[]});
test('revision selection retains order, diagrams, presentation and pinned independent copies',()=>{
 const bank=['a','b','c'].map(candidate),r=assembleBooklet(createEditableProject(),recipe(),bank);
 assert.equal(r.project.sections.length,2);assert.equal(r.project.sections[1].optional,true);
 assert.deepEqual(r.project.sections.flatMap(s=>s.blocks.map(b=>b.bankRef.id)),['b','a','c']);
 const b=r.project.sections[0].blocks[0];assert.equal(b.bankRef.revision,'pinned');
 assert.equal(b.content.representations.diagramSlots[b.content.questionDiagrams[0].id],'graph');
 assert.equal(r.project.settings.layoutOverrides.blockLayouts[b.id].diagramWidthMm,58);
 assert.equal(r.project.settings.layoutOverrides.answerSpaces[b.content.id],24);
 bank[1].question.content.questionDiagrams[0].code='changed';assert.notEqual(b.content.questionDiagrams[0].code,'changed');
});
test('revision rejects missing, repeated, out-of-scope and untaught selections',()=>{
 const p=createEditableProject(),bank=['a','b','c'].map(candidate);
 const r=recipe();r.sessions[0].questionIds.push('a');assert.throws(()=>assembleBooklet(p,r,bank),/Repeated/);
 assert.throws(()=>assembleBooklet(p,recipe(),bank.slice(1)),/Missing/);
 const scoped=recipe();scoped.scopeSkillIds=[];assert.throws(()=>assembleBooklet(p,scoped,bank),/scope/);
 bank[0].prerequisiteIds=['prior'];assert.throws(()=>assembleBooklet(p,recipe(),bank),/prerequisites/);
});
test('inserting a bank question preserves graph slot and layout references',()=>{
 const b=snapshotBankQuestion(candidate('a').question,{placementId:'placement'});
 const p=normalizeEditableProject({sections:[{blocks:[b]}]});
 assert.equal(b.content.representations.diagramSlots[b.content.questionDiagrams[0].id],'graph');
 assert.equal(p.settings.layoutOverrides.blockLayouts[b.id].diagramWidthMm,58);
});
test('revision recipes reject changed bank versions and incomplete dependent groups',()=>{
 const bank=['a','b','c'].map(candidate),p=createEditableProject();
 const r=recipe();r.questionRevisions={a:'older'};assert.throws(()=>assembleBooklet(p,r,bank),/version changed/);
 bank[0].question.presentation.selectionGroup={questionIds:['a','c']};assert.throws(()=>assembleBooklet(p,recipe(),bank),/dependent question group/);
});
