import test from 'node:test';
import assert from 'node:assert/strict';
import {insertFromBooklet,libraryPicks,libraryTopics,insertSummary} from '../src/lib/booklet-library-transfer.js';
import {flowNumbers,exerciseNumbers} from '../src/lib/booklet-flow.js';
import {normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';

const question=(id,prompt,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt,children:[],answer:{short:'1',worked:'$x=1$'}},...extra});
const theory=(id,kind)=>({id,type:'question',pedagogyRole:'theory',sourceAtom:{id:id+'-atom',kind,label:kind},content:{id:id+'-root',type:'question',prompt:kind,children:[],answer:{short:'',worked:''}}});
const settings={paginationMode:'flexible',exerciseOrganisation:'topic'};
// Imported booklets reuse page-based ids, so two sources share every id here.
const source=(id,space)=>normalizeEditableProject({format:'mathsmap-booklet-project-v4',version:4,id,title:id,revision:7,settings:{...settings,layoutOverrides:{answerSpaces:{'p5-q1-root':space}}},
  topics:[{id:'t1',title:id+' topic'},{id:'t2',title:'Challenge'},{id:'front',title:'Cover'}],sections:[
  {id:'cover',topicId:'front',title:'Cover',phase:'front-matter',role:'front-matter',sourcePageNumber:1,blocks:[{id:'cover-text',type:'rich-text',content:'Cover'}]},
  {id:'s1',topicId:'t1',title:'Teaching',phase:'teaching',role:'teaching',sourcePageNumber:3,numberingStart:4,pageBreakBefore:false,blocks:[theory('p3-def','definition'),theory('p3-ex','example')]},
  {id:'s2',topicId:'t1',title:'Exercise',phase:'practice',role:'mixed-practice',sourcePageNumber:5,blocks:[
    question('p5-q1',id+' first',{bankRef:{id:'bank-'+id,revision:'r3'},snapshotKind:'bank',flow:{sourcePageBreakBefore:true,numberResetBefore:9}}),
    question('p5-q2',id+' second',{flow:{pageBreakBefore:true}}),question('p5-q3',id+' third',{dependsOn:['p5-q2']})]},
  {id:'s3',topicId:'t2',title:'Exercise',phase:'practice',role:'mixed-practice',blocks:[question('p9-q1',id+' challenge')]},
]});
const destination=()=>normalizeEditableProject({format:'mathsmap-booklet-project-v4',version:4,id:'new-booklet',title:'Expanding',settings,topics:[{id:'ta',title:'First'},{id:'tb',title:'Last'}],sections:[
  {id:'da',topicId:'ta',title:'Teaching',phase:'teaching',role:'teaching',blocks:[theory('d-def','definition')]},
  {id:'db',topicId:'ta',title:'Practice',phase:'practice',role:'practice',blocks:[question('d-q1','Own one'),question('d-q2','Own two')]},
  {id:'dc',topicId:'tb',title:'Practice',phase:'practice',role:'practice',blocks:[question('d-q3','Own three')]},
]});
const ids=p=>p.sections.flatMap(s=>s.blocks.map(b=>b.id));
const prompts=section=>section.blocks.map(b=>b.content.prompt);
const valid=p=>assert.equal(validateEditableProject(p).valid,true,validateEditableProject(p).errors.join('; '));

test('library lists teaching and practice topics without front matter',()=>{
  assert.deepEqual(libraryTopics(source('a',10)).map(t=>[t.title,t.sections.map(s=>s.id)]),[['a topic',['s1','s2']],['Challenge',['s3']]]);
});

test('ticks grow to dependent groups and split into whole topics and loose items',()=>{
  const a=source('a',10);
  const partial=libraryPicks(a,['p5-q3']);
  assert.deepEqual(partial.ids,['p5-q2','p5-q3']);assert.equal(partial.topics.length,0);assert.deepEqual(partial.items.map(g=>g.section.id),['s2']);
  const whole=libraryPicks(a,['p3-def','p3-ex','p5-q1','p5-q2','p5-q3','cover-text']);
  assert.deepEqual(whole.topics.map(t=>t.id),['t1']);assert.equal(whole.items.length,0);assert.equal(whole.ids.includes('cover-text'),false);
});

test('whole topics from two booklets with identical ids arrive as separate new topics',()=>{
  const a=source('a',10),b=source('b',40),before=JSON.stringify([a,b]),all=['p3-def','p3-ex','p5-q1','p5-q2','p5-q3'];
  const first=insertFromBooklet(destination(),a,all,{sectionId:'db',afterId:'d-q1'});
  const second=insertFromBooklet(first.project,b,all,{sectionId:first.project.sections.find(s=>s.blocks.some(x=>x.id===first.report.firstId)).id});
  const p=second.project;valid(p);
  assert.equal(JSON.stringify([a,b]),before,'sources are read-only');
  assert.equal(new Set(ids(p)).size,ids(p).length);assert.equal(ids(p).some(id=>id.startsWith('p5-')),false);
  assert.deepEqual(p.topics.map(t=>t.title),['First','a topic','b topic','Last']);
  assert.deepEqual(p.sections.map(s=>p.topics.find(t=>t.id===s.topicId).title+':'+s.phase),['First:teaching','First:practice','a topic:teaching','a topic:practice','b topic:teaching','b topic:practice','Last:practice']);
  const [fromA,fromB]=[3,5].map(i=>p.sections[i]);
  assert.deepEqual(prompts(fromA),['a first','a second','a third']);assert.deepEqual(prompts(fromB),['b first','b second','b third']);
  // Each copy keeps its own source's layout override under its new id.
  assert.equal(p.settings.layoutOverrides.answerSpaces[fromA.blocks[0].content.id],10);
  assert.equal(p.settings.layoutOverrides.answerSpaces[fromB.blocks[0].content.id],40);
  assert.equal(p.settings.layoutOverrides.answerSpaces['p5-q1-root'],undefined);
  assert.deepEqual(fromA.blocks[0].bankRef,{id:'bank-a',revision:'r3'});
  assert.deepEqual(fromA.blocks[2].dependsOn,[fromA.blocks[1].id]);
  // Source page positions do not follow the content.
  const teaching=p.sections[2];
  assert.equal(teaching.sourcePageNumber,undefined);assert.equal(teaching.numberingStart,undefined);assert.equal(teaching.pageBreakBefore,false);
  assert.equal(fromA.blocks[0].flow?.sourcePageBreakBefore,undefined);assert.equal(fromA.blocks[0].flow?.numberResetBefore,undefined);
  assert.equal(fromA.blocks[1].flow.pageBreakBefore,true);
  const numbers=flowNumbers(p);assert.deepEqual(fromA.blocks.map(x=>numbers[x.id]),[1,2,3]);assert.deepEqual(fromB.blocks.map(x=>numbers[x.id]),[1,2,3]);
  assert.deepEqual(p.topics.map(t=>exerciseNumbers(p)[t.id]),[1,2,3,4]);
  assert.deepEqual(p.studio.lineage[fromB.blocks[0].id],{sourceIds:['p5-q1'],projectId:'b',revision:7});
  assert.deepEqual(first.report.topics,['a topic']);assert.equal(first.report.items,5);assert.equal(first.report.breaks,1);assert.equal(first.report.bankLinked,1);
  assert.match(insertSummary(first.report,'A'),/Inserted 5 items from A as 1 new topic\. 1 page break came with them\. 1 bank question keeps its pinned version\./);
});

test('loose items go after the selection or into the matching part of the current topic',()=>{
  const a=source('a',10);
  const practice=insertFromBooklet(destination(),a,['p5-q1','p9-q1'],{sectionId:'db',afterId:'d-q1'},{asTopics:false}).project;valid(practice);
  assert.deepEqual(practice.topics.map(t=>t.title),['First','Last']);
  assert.deepEqual(prompts(practice.sections[1]),['Own one','a first','a challenge','Own two']);
  // A question ticked while the cursor is in teaching joins the topic's exercise.
  const mixed=insertFromBooklet(destination(),a,['p3-ex','p5-q1'],{sectionId:'da',afterId:'d-def'}).project;valid(mixed);
  assert.deepEqual(prompts(mixed.sections[0]),['definition','example']);
  assert.deepEqual(prompts(mixed.sections[1]),['Own one','Own two','a first']);
  // A topic without teaching gains a teaching section ahead of its exercise.
  const created=insertFromBooklet(destination(),a,['p3-def'],{sectionId:'dc',afterId:'d-q3'}).project;valid(created);
  assert.deepEqual(created.sections.map(s=>s.topicId+':'+s.phase),['ta:teaching','ta:practice','tb:teaching','tb:practice']);
  assert.deepEqual(prompts(created.sections[2]),['definition']);
});

test('whole topics can join the current topic instead, and empty booklets accept content',()=>{
  const a=source('a',10);
  const joined=insertFromBooklet(destination(),a,['p9-q1'],{sectionId:'dc',afterId:'d-q3'},{asTopics:false});valid(joined.project);
  assert.deepEqual(joined.project.topics.map(t=>t.title),['First','Last']);assert.deepEqual(prompts(joined.project.sections[2]),['Own three','a challenge']);
  const empty=normalizeEditableProject({format:'mathsmap-booklet-project-v4',version:4,id:'blank',title:'Blank',settings,topics:[],sections:[]});
  const filled=insertFromBooklet(empty,a,['p9-q1','p5-q1']).project;valid(filled);
  assert.deepEqual(filled.topics.map(t=>t.title),['New topic','Challenge']);assert.deepEqual(filled.sections.map(prompts),[['a first'],['a challenge']]);
  assert.throws(()=>insertFromBooklet(destination(),a,[]),/Tick the content/);
  assert.throws(()=>insertFromBooklet(a,a,['p9-q1']),/different booklet/);
});
