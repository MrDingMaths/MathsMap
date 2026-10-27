import test from 'node:test';
import assert from 'node:assert/strict';
import {setTableBorders,setTableBorderColour,setCellFill,cellSideVisible} from '../src/lib/booklet-table-style.js';
import {tableGrid} from '../public/libs/maths-editor/table-model.mjs';

const cell=id=>({id,type:'cell',rowspan:1,colspan:1,blocks:[{id:id+'p',type:'paragraph',inlines:[]}]});
const table=()=>({id:'t',type:'table',border:true,rows:[[cell('a1'),cell('b1'),cell('c1')],[cell('a2'),{...cell('b2'),border:true,borders:{top:true}},cell('c2')],[cell('a3'),cell('b3'),cell('c3')]],rowHeights:[10,10,10]});
const visible=(t,id,side)=>{const e=tableGrid(t).byId.get(id);return cellSideVisible(t,e.cell,side);};
// A shared edge shows if either cell draws it.
const edgeShown=(t,a,side,b,opposite)=>visible(t,a,side)||visible(t,b,opposite);

test('None on the whole table clears cell overrides that used to stay visible',()=>{
 const t=setTableBorders(table(),'none','table');
 assert.equal(t.border,false);
 for(const id of ['a1','b2','c3'])for(const side of ['top','right','bottom','left'])assert.equal(visible(t,id,side),false);
});

test('Outside and inside on a row, with neighbours kept in step',()=>{
 const outside=setTableBorders({...table(),border:false},'outside','row',['b2']);
 assert.deepEqual(['a2','b2','c2'].map(id=>visible(outside,id,'top')),[true,true,true]);
 assert.equal(visible(outside,'a2','right'),false);assert.equal(visible(outside,'a2','left'),true);
 const inside=setTableBorders(table(),'inside','row',['b2']);
 assert.equal(edgeShown(inside,'b2','top','b1','bottom'),false,'outer edge removed on both sides');
 assert.equal(visible(inside,'a2','right'),true);assert.equal(visible(inside,'a2','left'),false);
 assert.equal(visible(inside,'a1','top'),true,'cells away from the row keep their borders');
});

test('Column and cell scopes; the input never mutates',()=>{
 const original=table(),before=JSON.stringify(original);
 const none=setTableBorders(original,'none','column',['b1']);assert.equal(JSON.stringify(original),before);
 assert.equal(edgeShown(none,'b2','left','a2','right'),false);assert.equal(visible(none,'a2','left'),true);
 const all=setTableBorders({...table(),border:false},'all','cell',['c3']);
 assert.deepEqual(['top','right','bottom','left'].map(s=>visible(all,'c3',s)),[true,true,true,true]);
 assert.throws(()=>setTableBorders(table(),'all','cell',[]),/Select a table cell/);
});

test('Colour and fill write existing fields',()=>{
 assert.equal(setTableBorderColour(table(),'#1f6f43').borderColour,'#1f6f43');
 const row=setTableBorderColour(table(),'#1f6f43','row',['a1']);assert.equal(tableGrid(row).byId.get('c1').cell.borderColour,'#1f6f43');assert.equal(row.borderColour,undefined);
 const fill=setCellFill(table(),'#eef4fb','cell',['a1']);assert.equal(tableGrid(fill).byId.get('a1').cell.background,'#eef4fb');
 assert.equal(tableGrid(setCellFill(fill,'','cell',['a1'])).byId.get('a1').cell.background,undefined);
 assert.throws(()=>setTableBorderColour(table(),'red'),/palette/);
});
