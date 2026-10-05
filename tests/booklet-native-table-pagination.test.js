import test from 'node:test';
import assert from 'node:assert/strict';
import {questionSplitGroups,fragmentQuestion,paginateFlow} from '../src/lib/booklet-pagination.js';
import {editableTableFragment,replaceDocumentFragment} from '../src/lib/booklet-document-controller.js';
const fixture=()=>({id:'table-question',type:'question',flow:{repeatSharedStem:true,tableContinuation:{tableId:'table',headerRows:1,rowPartIds:['a','b','c']}},content:{id:'root',type:'question',label:'1',prompt:{format:'maths-editor-document-v1',blocks:[{id:'table',type:'table',rowHeights:[10,20,20,20],rows:[[{id:'heading'}],[{id:'a-cell'}],[{id:'b-cell'}],[{id:'c-cell'}]]}]},children:['a','b','c'].map(id=>({id,type:'part',label:id,prompt:'',answerSpaceMm:0,answer:{short:id,worked:id}}))}});
test('native table continuations keep headers and row/answer ownership through repeated cuts',()=>{
 const original=fixture(),groups=questionSplitGroups(original),right=fragmentQuestion(original,groups.slice(1),1),last=fragmentQuestion(right,questionSplitGroups(right).slice(1),2);
 assert.deepEqual(right.content.prompt.blocks[0].rows.map(row=>row[0].id),['heading','b-cell','c-cell']);
 assert.deepEqual(right.content.children.map(p=>p.id),['b','c']);
 assert.deepEqual(last.content.prompt.blocks[0].rows.map(row=>row[0].id),['heading','c-cell']);
 assert.deepEqual(last.content.prompt.blocks[0].rowHeights,[10,20]);
 assert.deepEqual(last.content.children[0].answer,original.content.children[2].answer);
 assert.deepEqual(original,fixture());
});
test('editing a printed table slice opens and saves the whole canonical table',()=>{
 const original=fixture(),fragment=fragmentQuestion(original,questionSplitGroups(original).slice(1),1),visible=fragment.content.prompt;
 const editing=editableTableFragment(original.content.prompt,visible,'table');
 assert.equal(editing.blocks[0].rows.length,4);
 editing.blocks[0].rows[2][0].text='edited b';
 const saved=replaceDocumentFragment(original.content.prompt,['table'],editing);
 assert.deepEqual(saved.blocks[0].rows.map(row=>row[0].id),['heading','a-cell','b-cell','c-cell']);
 assert.equal(saved.blocks[0].rows[2][0].text,'edited b');
 assert.equal(original.content.prompt.blocks[0].rows[2][0].text,undefined);
 assert.equal(editableTableFragment(original.content.prompt,visible,null),visible);
});
test('unsafe cross-row spans or missing ownership fail instead of losing cells',()=>{
 const b=fixture();b.content.prompt.blocks[0].rows[1][0].rowspan=2;
 assert.throws(()=>fragmentQuestion(b,[{parentId:'root',ids:['b','c']}],1),/ownership/);
 delete b.content.prompt.blocks[0].rows[1][0].rowspan;b.flow.tableContinuation.rowPartIds=['a','b'];
 assert.throws(()=>fragmentQuestion(b,questionSplitGroups(b).slice(1),1),/ownership/);
});
test('oversized response tables paginate once per owned row without repeating data',async()=>{
 const project={id:'book',topics:[],settings:{paginationMode:'flexible',layoutOverrides:{blockLayouts:{}}},sections:[{id:'s',phase:'exercise',blocks:[fixture()]}]};
 const {pages}=await paginateFlow(project,'student',async page=>({height:page.blocks.reduce((sum,b)=>sum+b.content.prompt.blocks[0].rowHeights.reduce((a,h)=>a+h,0),0),capacity:50}));
 assert.equal(pages.length,2);
 assert.deepEqual(pages.flatMap(page=>page.blocks.flatMap(b=>b.content.prompt.blocks[0].rows.slice(1).map(row=>row[0].id))),['a-cell','b-cell','c-cell']);
 assert.ok(pages.every(page=>page.blocks[0].content.prompt.blocks[0].rows[0][0].id==='heading'));
});
