import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {applyQuestionSpacing} from '../src/lib/booklet-document-tools.js';

test('question spacing does not repaginate compact answers, but answer diagram widths do',async()=>{
 let project=normalizeEditableProject({id:'spacing-answers',title:'Spacing',topics:[{id:'t',title:'Topic'}],settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:{}},sections:[{id:'s',topicId:'t',phase:'practice',blocks:Array.from({length:8},(_,i)=>({id:'q'+i,type:'question',content:{id:'root'+i,prompt:'Calculate.',children:['a','b','c'].map(label=>({id:'part'+i+label,label,prompt:'Solve.',answerSpaceMm:10,answer:{short:'1',worked:'1+0=1'}}))}}))}]});
 let calls=0;const measure=async page=>(calls++,{height:page.blocks.length*30,capacity:900});
 for(const edition of ['short','worked','with-short','with-worked']){
  let previous=await paginateFlow(project,edition,measure);
  for(const property of ['height','gap']){
   project=applyQuestionSpacing(project,'q0',property,property==='height'?30:7);calls=0;
   const measuredModes=[];const next=await paginateFlow(project,edition,p=>{measuredModes.push(p.mode);return measure(p);},{previous});
   assert.ok(measuredModes.every(mode=>mode==='student'),`${edition}: question spacing must not measure answers`);
   assert.deepEqual(next,await paginateFlow(project,edition,measure));previous=next;
  }
 }
 // Retain the dimension dependencies that compact answers actually render.
 const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id==='q0');
 const changed={...block,content:{...block.content,children:block.content.children.map((child,i)=>i?child:{...child,answer:{...child.answer,solutionDiagrams:[{id:'answer-diagram',format:'tikz',code:'test',widthMm:40}]}})}};
 project={...project,sections:project.sections.map(s=>({...s,blocks:s.blocks.map(b=>b===block?changed:b)}))};
 const previous=await paginateFlow(project,'short',measure);
 const overrides=project.settings.layoutOverrides;
 project={...project,settings:{...project.settings,layoutOverrides:{...overrides,blockLayouts:{...overrides.blockLayouts,'answer-diagram':{diagramWidthMm:25}}}}};calls=0;
 await paginateFlow(project,'short',measure,{previous});assert.ok(calls>0);
});

test('a changed height in the partial page cannot reuse its old suffix',async()=>{
 const blocks=['a','b','c'].map(id=>({id,type:'rich-text',content:id}));
 let project={id:'spacing-carry',title:'Carry',topics:[{id:'t',title:'Topic'}],settings:{paginationMode:'flexible',layoutOverrides:{blockLayouts:{},answerSpaces:{a:20,b:60,c:10}}},sections:[{id:'s',topicId:'t',title:'Section',phase:'teaching',blocks}]};
 const measure=p=>({height:p.blocks.reduce((n,b)=>n+project.settings.layoutOverrides.answerSpaces[b.id],0),capacity:100});
 const previous=await paginateFlow(project,'student',measure);
 project={...project,settings:{...project.settings,layoutOverrides:{...project.settings.layoutOverrides,answerSpaces:{a:50,b:60,c:10}}}};
 const next=await paginateFlow(project,'student',measure,{previous});
 assert.deepEqual(next,await paginateFlow(project,'student',measure));
 assert.deepEqual(next.pages.map(p=>p.blocks.map(b=>b.id)),[['a'],['b','c']]);
});
