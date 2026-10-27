import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {editableTableFragment,replaceDocumentFragment} from '../src/lib/booklet-document-controller.js';
import {normalizeDocument,toSource} from '../public/libs/maths-editor/document-model.mjs';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';

const paragraph=id=>({id,type:'paragraph',inlines:[{type:'text',text:id}]});
const item=(id,value)=>({id,type:'list-item',...(value==null?{}:{value}),blocks:[paragraph(id+'-text')]});
const list=(items,more={})=>({id:'list',type:'list',ordered:false,indent:7,items,...more});
const document=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const prose=(blocks,opt=true)=>({id:'syllabus',type:'rich-text',sourcePageNumber:2,sourceRefs:[{pageNumber:2}],sourceReview:{responses:[{targetId:'syllabus',kind:'none'}]},content:document(blocks),flow:opt==null?{}:{greedyDocumentFragments:opt}});
const project=blocks=>({id:'greedy-prose',title:'Prose',topics:[{id:'t',title:'Topic'}],settings:{paginationMode:'flexible',layoutOverrides:{blockLayouts:{}}},sections:[{id:'s',topicId:'t',phase:'teaching',blocks}]});
const wrapper=()=>({id:'heading-first',type:'layout',arrangement:'parallel',columns:1,slots:[{id:'heading-slot',blocks:[paragraph('heading'),{...list([item('first-bullet')]),id:'first-list'}]}]});
function measure(heights,capacity=100){
  const node=n=>heights[n.id]??(n.items?n.items.reduce((sum,i)=>sum+node(i),0):n.slots?n.slots.reduce((sum,s)=>sum+s.blocks.reduce((v,b)=>v+node(b),0),0):n.blocks?n.blocks.reduce((sum,b)=>sum+node(b),0):0);
  return page=>({height:page.blocks.reduce((sum,b)=>sum+(b.type==='question'?b.content.answerSpaceMm:typeof b.content==='string'?heights[b.id]??0:node(b.content)),0),capacity});
}
const contents=result=>result.pages.map(p=>p.blocks.map(b=>b.content));
const ids=result=>result.pages.flatMap(p=>p.blocks.flatMap(b=>b.content.blocks??[]).flatMap(n=>n.type==='list'?n.items.map(i=>i.id):[n.id]));

test('absence and false retain legacy one-page-per-document-block fragmentation',async()=>{
  const blocks=[paragraph('outcome'),wrapper(),list(['a','b','c','d','e'].map(id=>item(id)))],heights={outcome:10,'heading-first':20,a:25,b:25,c:25,d:25,e:25};
  const absent=await paginateFlow(project([prose(blocks,null)]),'student',measure(heights));
  const disabled=await paginateFlow(project([prose(blocks,false)]),'student',measure(heights));
  assert.deepEqual(contents(absent),contents(disabled));
  assert.deepEqual(absent.pages.map(p=>p.blocks.flatMap(b=>b.content.blocks.map(n=>n.id))),[['outcome'],['heading-first'],['list']]);
  assert.equal(absent.issues.length,1);
  assert.equal(absent.issues[0].kind,'oversized-content');
});

test('opted-in prose greedily fills existing page space and retains carry for following content',async()=>{
  const syllabus=prose([paragraph('outcome'),wrapper(),list(['a','b','c','d','e'].map(id=>item(id)))]);
  const source=structuredClone(syllabus),p=project([{id:'before',type:'rich-text',content:'Before'},syllabus,{id:'after',type:'rich-text',content:'After'}]);
  const result=await paginateFlow(p,'student',measure({before:30,outcome:10,'heading-first':20,a:20,b:20,c:20,d:20,e:20,after:10}));
  assert.equal(result.pages.length,2);assert.deepEqual(result.issues,[]);
  assert.deepEqual(result.pages.map(p=>p.blocks.map(b=>b.id)),[['before','syllabus'],['syllabus','after']]);
  assert.deepEqual(result.pages[0].blocks[1].content.blocks.map(n=>n.id),['outcome','heading-first','list']);
  assert.deepEqual(result.pages[0].blocks[1].content.blocks.at(-1).items.map(i=>i.id),['a','b']);
  assert.deepEqual(result.pages[1].blocks[0].content.blocks[0].items.map(i=>i.id),['c','d','e']);
  assert.deepEqual(result.pages.flatMap(p=>p.blocks.filter(b=>b.id==='syllabus').map(b=>b.flow.fragment)),[0,1]);
  assert.deepEqual(ids({pages:result.pages.map(p=>({...p,blocks:p.blocks.filter(b=>b.id==='syllabus')}))}),['outcome','heading-first','a','b','c','d','e']);
  for(const fragment of result.pages.flatMap(p=>p.blocks.filter(b=>b.id==='syllabus'))){assert.deepEqual(fragment.sourceRefs,source.sourceRefs);assert.deepEqual(fragment.sourceReview,source.sourceReview);}
  assert.deepEqual(syllabus,source);
});

test('complete documents that fit remain unsliced, including a single complete native list',async()=>{
  const syllabus=prose([list([item('a'),item('b')],{ordered:true,start:3})]);
  const result=await paginateFlow(project([syllabus]),'student',measure({a:10,b:10}));
  assert.equal(result.pages.length,1);assert.deepEqual(result.pages[0].blocks[0].content,syllabus.content);
  assert.equal(result.pages[0].blocks[0].flow.fragment,undefined);
});

test('the optional flow flag survives normalise/save/reopen without migrating other blocks',()=>{
  const input=project([prose([paragraph('a'),paragraph('b')]),{id:'ordinary',type:'rich-text',content:'Unchanged'}]);
  const reopened=normalizeEditableProject(JSON.parse(JSON.stringify(normalizeEditableProject(input))));
  assert.equal(reopened.sections[0].blocks[0].flow.greedyDocumentFragments,true);
  assert.equal(reopened.sections[0].blocks[1].flow?.greedyDocumentFragments,undefined);
});

test('ordered list continuations retain starts, explicit values, nested contents and every source item identity',async()=>{
  const source=list([item('a'),item('b'),item('c',10),item('d'),item('e')],{ordered:true,start:4});
  source.items[1].blocks.push({...list([item('nested-a'),item('nested-b')]),id:'nested-list'});
  const result=await paginateFlow(project([prose([source])]),'student',measure({a:10,b:10,c:10,d:10,e:10},20));
  const lists=result.pages.map(p=>p.blocks[0].content.blocks[0]);
  assert.deepEqual(lists.map(n=>n.start),[4,10,12]);
  assert.deepEqual(lists.flatMap(n=>n.items),source.items);
  assert.deepEqual(lists[0].items[1].blocks,source.items[1].blocks);
  assert.deepEqual(lists.map(n=>toSource(document([n])).split('\n').filter(s=>/^\d/.test(s)).map(s=>Number(s.match(/^\d+/)[0]))),[[4,5],[10,11],[12]]);
  assert.ok(result.pages.every(p=>p.blocks[0].content._bookletListFragments.includes('list')));
});

test('heading-first-bullet wrappers and oversized list items remain atomic and report overflow instead of shrinking',async()=>{
  const heading=wrapper(),large=item('large');large.blocks.push(paragraph('more-large-working'));
  const syllabus=prose([paragraph('outcome'),heading,list([item('a'),large,item('b')])]),before=structuredClone(syllabus);
  const result=await paginateFlow(project([syllabus]),'student',measure({outcome:10,'heading-first':120,a:10,large:150,b:10}));
  assert.deepEqual(result.issues.map(i=>i.kind),['oversized-content','oversized-content']);
  assert.deepEqual(result.pages.flatMap(p=>p.blocks.flatMap(b=>b.content.blocks)).find(n=>n.id==='heading-first'),heading);
  assert.deepEqual(result.pages.flatMap(p=>p.blocks.flatMap(b=>b.content.blocks)).filter(n=>n.type==='list').flatMap(n=>n.items),before.content.blocks[2].items);
  assert.deepEqual(ids(result),['outcome','heading-first','a','large','b']);
  assert.deepEqual(syllabus,before);
});

test('atomic blocks and stored custom arrangements do not gain optional split boundaries',async()=>{
  const syllabus=prose([paragraph('a'),paragraph('b'),paragraph('c')]);syllabus.flow.keepTogether=true;
  const atomic=await paginateFlow(project([syllabus]),'student',measure({a:60,b:60,c:60}));
  assert.equal(atomic.pages.length,1);assert.equal(atomic.issues[0].kind,'oversized-content');
  const arranged=project([prose([paragraph('a'),paragraph('b'),paragraph('c')])]);
  arranged.settings.layoutOverrides.blockLayouts.syllabus={arrangement:{version:1,root:{id:'arr',type:'group',direction:'row',children:[]}}};
  const result=await paginateFlow(arranged,'student',measure({a:60,b:60,c:60}));
  assert.equal(result.pages.length,1);assert.equal(result.issues[0].kind,'oversized-content');
});

test('greedy rich-text fragments preserve forced exercise starts and complete working allowances',async()=>{
  const p=project([prose([paragraph('a'),paragraph('b'),paragraph('c')])]);
  p.settings.exerciseOrganisation='topic';
  p.sections.push({id:'practice',topicId:'t',phase:'practice',pageBreakBefore:false,blocks:[{id:'question',type:'question',content:{id:'q-root',prompt:'Work downwards.',answerSpaceMm:70,answer:{short:'1',worked:'1'}}}]});
  const result=await paginateFlow(p,'student',measure({a:60,b:60,c:10}));
  assert.deepEqual(result.pages.map(p=>p.blocks.map(b=>b.id)),[['syllabus'],['syllabus'],['question']]);
  assert.equal(result.pages[2].blocks[0].content.answerSpaceMm,70);
  assert.equal(result.pages[2].section.exerciseNumber,1);
  assert.equal(result.pages[2].blocks[0].flow.exerciseHeadingBefore,1);
});

test('editing an opted-in list fragment opens the full canonical list and preserves all off-page items and numbering',async()=>{
  const canonical=normalizeDocument(document([paragraph('before'),list([item('a'),item('b',20),item('c'),item('d')],{ordered:true,start:7}),paragraph('after')]));
  const result=await paginateFlow(project([prose(canonical.blocks)]),'student',measure({before:10,a:20,b:20,c:20,d:20,after:10},40));
  const visible=result.pages[1].blocks[0].content;
  assert.deepEqual(visible.blocks[0].items.map(i=>i.id),['b','c']);
  const editing=editableTableFragment(canonical,visible,null);
  assert.equal(editing._bookletListFragments,undefined);
  assert.deepEqual(editing.blocks[0],canonical.blocks[1]);
  const roundTrip=replaceDocumentFragment(canonical,visible.blocks.map(n=>n.id),normalizeDocument(editing));
  assert.deepEqual(roundTrip,canonical);
  editing.blocks[0].items[2].blocks[0].inlines[0].text='Changed c';
  const saved=replaceDocumentFragment(canonical,visible.blocks.map(n=>n.id),normalizeDocument(editing));
  assert.deepEqual(saved.blocks.map(n=>n.id),['before','list','after']);
  assert.deepEqual(saved.blocks[1].items.map(i=>[i.id,i.value]),[['a',undefined],['b',20],['c',undefined],['d',undefined]]);
  assert.equal(saved.blocks[1].start,7);assert.match(toSource(saved),/21\. Changed c/);
  assert.deepEqual(saved.blocks[0],canonical.blocks[0]);assert.deepEqual(saved.blocks[2],canonical.blocks[2]);
  assert.throws(()=>editableTableFragment(document([]),visible,null),/continued list moved or changed/);
});

test('ordinary unmarked fragment editing is exactly unchanged',()=>{
  const visible=document([list([item('a')])]),canonical=document([list([item('a'),item('b')])]);
  assert.equal(editableTableFragment(canonical,visible,null),visible);
});
