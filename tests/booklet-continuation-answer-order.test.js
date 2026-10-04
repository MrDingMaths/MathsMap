import test from 'node:test';import assert from 'node:assert/strict';
import {orderedAnswerUnits,answerFragments} from '../src/lib/booklet-exercises.js';
import {paginateCompactAnswers} from '../src/lib/booklet-answer-pagination.js';
import {paginateShortAnswerGrid} from '../src/lib/booklet-short-answer-grid.js';
const leaf=(id,label)=>({id,type:'part',label,prompt:'Calculate',answer:{short:'1',worked:'$1$'}});
const block=(id,left,right,parent)=>({id,type:'question',flow:parent?{continuationOf:parent}:{},content:{id:id+'-root',type:'group',layout:'grid',columns:2,prompt:'Calculate',children:[{id:id+'-left',type:'group',label:'',prompt:'',children:left.map(x=>leaf(id+'-'+x,x))},{id:id+'-right',type:'group',label:'',prompt:'',children:right.map(x=>leaf(id+'-'+x,x))}]}});
const section={id:'practice',topicId:'topic',phase:'practice',blocks:[block('first',['a','b'],['e','f']),block('second',['c','d'],['g','h'],'first')]};
const leafId=b=>{let n=b.content;while(n.children?.length)n=n.children[0];return n.id;};
const expected=['first-a','first-b','second-c','second-d','first-e','first-f','second-g','second-h'];
test('answer continuation order preserves source columns, owners and immutable student content',()=>{
 const before=structuredClone(section);for(const mode of ['short','worked']){const units=orderedAnswerUnits([section],mode);assert.deepEqual(units.flatMap(u=>(u.fragments??answerFragments(u.blocks[0],mode)).map(leafId)),expected);assert.deepEqual(units.map(u=>u.blocks[0].id),['first','first','second','second','first','first','second','second']);}assert.deepEqual(section,before);
});
test('ordinary and nonrectangular continuation units retain original source order',()=>{
 const ordinary=structuredClone(section);delete ordinary.blocks[1].flow.continuationOf;assert.deepEqual(orderedAnswerUnits([ordinary],'worked').map(u=>u.blocks[0].id),['first','second']);const atomic=structuredClone(section);atomic.blocks[0].content.answer={worked:'Shared answer'};assert.equal(orderedAnswerUnits([atomic],'worked').length,2);
});
test('implicit numbered rows continue through source column continuations without changing editable labels',()=>{
 const source={...structuredClone(section),blocks:[block('first',Array.from({length:7},(_,i)=>'a'+i),Array.from({length:7},(_,i)=>'b'+i)),block('second',Array.from({length:6},(_,i)=>'a'+(i+7)),Array.from({length:6},(_,i)=>'b'+(i+7)),'first')]};
 for(const b of source.blocks)for(const c of b.content.children)for(const n of c.children)n.label='';
 const before=structuredClone(source);
 for(const mode of ['short','worked']){
  const rows=orderedAnswerUnits([source],mode).flatMap(u=>u.fragments).map(f=>f.content.children[0].children[0]);
  assert.deepEqual(rows.map(n=>n._answerDisplay.label),[...Array.from({length:13},(_,i)=>String(i+1)),...Array.from({length:13},(_,i)=>String(i+1))]);
  assert.equal(new Set(rows.map(n=>n.id)).size,26);
 }
 assert.deepEqual(source,before);
});
test('both actual answer paginators keep complete column groups across page breaks',async()=>{
 const project={id:'test',title:'Test',topics:[{id:'topic',title:'Topic'}],sections:[section],settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:{gutterMm:8}}};
 const measure=async page=>({height:Math.max(0,...(page.columns??[]).map(c=>c.length))*10,capacity:35,answerColumnWidthMm:86,answerWidthsMm:page.blocks?.map(()=>60)});
 for(const paginate of [paginateCompactAnswers,paginateShortAnswerGrid]){const result=await paginate(project,paginate===paginateCompactAnswers?'worked':'short',measure);assert.deepEqual(result.pages.flatMap(p=>p.columns.flat().map(e=>leafId(e.block))),expected);assert.equal(result.issues.length,0);assert.ok(result.pages.length>1);}
});
