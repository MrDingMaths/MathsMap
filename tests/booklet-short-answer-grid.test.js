import test from 'node:test';
import assert from 'node:assert/strict';
import {canShareShortAnswer,packShortAnswerRows,shortAnswerRows} from '../src/lib/booklet-short-answer-grid.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {measurementKeyFor} from '../src/lib/booklet-measurement.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {fromSource} from '../src/lib/document-content.js';

const block=(id,short='$315^\\circ$')=>({id,type:'question',content:{id:id+'root',answer:{short,worked:'Full working.'}}});
const fixture=()=>normalizeEditableProject({id:'answer-grid',title:'Answers',settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:{}},topics:[{id:'t',title:'Angles'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:Array.from({length:30},(_,i)=>block('q'+i))}]});
const measure=async page=>page.shortAnswerProbe?{height:0,capacity:60,answerColumnWidthMm:86,answerWidthsMm:page.blocks.map(b=>b.content.answer.short.includes('wide')?55:18)}:{height:Math.max(0,...page.columns.map(c=>shortAnswerRows(c).length*20)),capacity:60};

test('maths and short literal answers can share; explanations, rich structures and diagrams stay full width',()=>{
  for(const value of ['$315^\\circ$','$\\frac{x+2}{x-1}$','True','True.','9 people.','12 cm','Line CD or DC',fromSource('$x=2$')])assert.equal(canShareShortAnswer(block('q',value)),true);
  for(const value of ['Use symmetry.','Angles are equal.','Use the sine rule to find the missing side.','$x=2$\nUse substitution.','$$\\begin{aligned}x&=2\\\\y&=3\\end{aligned}$$',fromSource('First paragraph.\n\nSecond paragraph.')])assert.equal(canShareShortAnswer(block('q',value)),false);
  const diagram=block('q');diagram.content.answer.solutionDiagrams=[{id:'d'}];assert.equal(canShareShortAnswer(diagram),false);
  assert.equal(canShareShortAnswer({content:{children:[block('a').content],sharedSolutionDiagrams:[{id:'shared'}]}}),false);
});

test('actual widths choose three, two or one cells without reordering or crossing exercises',()=>{
  const entries=Array.from({length:9},(_,i)=>({block:block('q'+i),section:{topicId:i===8?'u':'t'}}));
  const rows=packShortAnswerRows(entries,[18,18,18,34,34,null,18,18,18],86);
  assert.deepEqual(rows.map(r=>r.length),[3,2,1,2,1]);
  assert.deepEqual(rows.flat().map(e=>e.block.id),entries.map(e=>e.block.id));
  assert.deepEqual(shortAnswerRows(rows.flat()).map(r=>r.length),[3,2,1,2,1]);
});

test('brief mathematical methods span the column while final results can share',()=>{
 for(const value of ['$\\frac{30a}{5}=6a$',fromSource('$\\frac{3a+21}{3}=a+7$'),'$6+4=10$','$x=8/2=4$','$\\frac{80}{3}\\approx26.67$'])assert.equal(canShareShortAnswer(block('q',value)),false);
 for(const value of ['$6a$','$\\frac{3a+21}{3}$','$x=-2$',fromSource('$\\bar{x}=15$'),'$x_1=3$','$\\approx63.6\\%$','$\\angle XYZ=\\angle XZY$','$m=2,\\ c=3,\\ y=2x+3$','$3=\\log_2 8$','$x=2; y=3$'])assert.equal(canShareShortAnswer(block('q',value)),true,value);
});

test('a consolidated group answer occupies a whole column even with one child',()=>{
 const grouped={content:{id:'group',answer:{short:'a → B; b → C'},children:[block('a').content]}};
 assert.equal(canShareShortAnswer(grouped),false);
 delete grouped.content.answer;
 assert.equal(canShareShortAnswer(grouped),true);
});

test('complete answer rows paginate left then right and retain every original node',async()=>{
  const p=fixture(),before=structuredClone(p),result=await paginateFlow(p,'short',measure);
  assert.equal(result.pages.length,2);assert.deepEqual(result.pages[0].columns.map(c=>c.length),[9,9]);
  assert.deepEqual(result.pages.flatMap(p=>p.columns.flat()).map(e=>e.block.id),p.sections[0].blocks.map(b=>b.id));
  for(const page of result.pages)for(const column of page.columns)assert.ok(shortAnswerRows(column).every(r=>r.length===3));
  assert.deepEqual(p,before);
});

test('unchanged runs retain row checkpoints; a longer answer reflows exactly like a fresh run',async()=>{
  let p=fixture(),previous=await paginateFlow(p,'short',measure);
  for(let i=0;i<2;i++)previous=await paginateFlow(p,'short',()=>{throw Error('Unchanged answers must reuse pagination');},{previous});
  const old=p.sections[0].blocks[22],changed={...old,content:{...old.content,answer:{...old.content.answer,short:'$wide$'}}};
  p={...p,sections:p.sections.map(s=>({...s,blocks:s.blocks.map(b=>b===old?changed:b)}))};
  let pagesMeasured=0;
  const next=await paginateFlow(p,'short',page=>{if(!page.shortAnswerProbe)pagesMeasured++;return measure(page);},{previous});
  assert.deepEqual(next,await paginateFlow(p,'short',measure));assert.ok(pagesMeasured<10,'Resume before the affected row instead of repaginating the prefix');
});

test('row shape and width probes have distinct measurement keys',()=>{
  const p=fixture(),b=p.sections[0].blocks[0],entry={block:b,section:{topicId:'t'},labelWidthMm:8,shortRow:0,shortColumns:1};
  const page={section:{id:'s'},blocks:[b],mode:'short',columns:[[entry],[]]},key=measurementKeyFor(p);
  assert.notEqual(key(page),key({...page,shortAnswerProbe:true}));
  assert.notEqual(key(page),key({...page,columns:[[{...entry,shortColumns:2}],[]]}));
});

test('worked solutions retain individual entries and do not request short-answer measurements',async()=>{
  const result=await paginateFlow(fixture(),'worked',page=>{assert.equal(page.shortAnswerProbe,undefined);assert.ok(page.columns.every(c=>c.every(e=>e.shortRow==null)));return {height:page.blocks.length*20,capacity:100};});
  assert.equal(result.pages.length,6);assert.ok(result.pages.every(p=>p.columns.length===1));
});
