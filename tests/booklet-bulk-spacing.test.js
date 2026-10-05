import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {blockSpacing,applyBlockSpacing,blockDocuments} from '../src/lib/booklet-bulk-spacing.js';
import {setTableRowHeights,setTablePadding,tablePadding} from '../public/libs/maths-editor/document-operations.mjs';

const text=(id,extra={})=>({id,type:'paragraph',inlines:[{type:'text',text:id}],...extra});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const table=(id,rowHeights,cells={})=>({id,type:'table',padding:2,rowHeights,rows:rowHeights.map((_,r)=>[{id:`${id}-c${r}`,type:'cell',blocks:[text(`${id}-p${r}`)],...cells}])});
const project=()=>createEditableProject({id:'bulk',title:'Bulk',settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'s',title:'S',blocks:[
  {id:'q1',type:'question',content:{id:'r1',prompt:doc([text('a'),text('b',{spaceAfter:5}),table('t1',[12,12,9])]),answer:{short:doc([text('ans',{spaceAfter:7})])},children:[{id:'r1a',label:'a',prompt:doc([text('c'),table('t2',[12],{paddingTop:4,preserveParagraphSpacing:true})])}]}},
  {id:'q2',type:'question',content:{id:'r2',prompt:doc([text('d')])}},
  {id:'theory',type:'rich-text',content:doc([text('e'),text('f')])},
]}]});
const find=(p,id)=>{let found;const visit=n=>{if(!n||typeof n!=='object'||found)return;if(n.id===id){found=n;return;}Object.values(n).forEach(visit);};visit(p.sections);return found;};

test('table helpers set every row and one padding',()=>{
  const t=table('t',[12,9]);t.rows[0][0].paddingLeft=5;
  assert.equal(tablePadding(t),null);
  setTablePadding(t,1);assert.equal(tablePadding(t),1);assert.equal('paddingLeft' in t.rows[0][0],false);
  setTableRowHeights(t,6);assert.deepEqual(t.rowHeights,[6,6]);
  setTableRowHeights(t,8,[1]);assert.deepEqual(t.rowHeights,[6,8]);
  setTableRowHeights(t,1);assert.deepEqual(t.rowHeights,[4,4]);
});

test('a block reports shared and mixed values, excluding answers',()=>{
  const p=project(),q1=p.sections[0].blocks[0];
  assert.equal(blockDocuments(q1).length,2);
  const state=blockSpacing(p,['q1']);
  assert.equal(state.counts.tables,2);assert.equal(state.counts.rows,4);
  assert.equal(state.values.rowHeight,'');assert.equal(state.values.spaceAfter,'');assert.equal(state.values.padding,'');
  assert.equal(blockSpacing(p,['theory']).values.spaceAfter,2);
  assert.equal(blockSpacing(p,['theory']).counts.tables,0);
});

test('one value reaches every like item in the block and nothing else',()=>{
  const p=project();
  let next=applyBlockSpacing(p,['q1'],'rowHeight',7);
  assert.deepEqual(find(next,'t1').rowHeights,[7,7,7]);assert.deepEqual(find(next,'t2').rowHeights,[7]);
  next=applyBlockSpacing(next,['q1'],'padding',1);
  assert.equal(find(next,'t2').padding,1);assert.equal('paddingTop' in find(next,'t2-c0'),false);
  next=applyBlockSpacing(next,['q1'],'spaceAfter',1);
  for(const id of ['a','b','c','t2-p0'])assert.equal(find(next,id).spaceAfter,1,id);
  // Cells that take the table's spacing are left to it; answers are another edition.
  assert.equal(find(next,'t1-p0').spaceAfter,undefined);assert.equal(find(next,'ans').spaceAfter,7);
  next=applyBlockSpacing(next,['q1'],'lineHeight',1.2);
  assert.equal(find(next,'t1-p0').lineHeight,1.2);
  assert.equal(next.sections[0].blocks[1],p.sections[0].blocks[1]);assert.equal(next.sections[0].blocks[2],p.sections[0].blocks[2]);
  assert.equal(blockSpacing(next,['q1']).values.rowHeight,7);
});

test('several blocks change together and invalid values are refused',()=>{
  const p=project(),next=applyBlockSpacing(p,['q2','theory'],'spaceAfter',0.5);
  for(const id of ['d','e','f'])assert.equal(find(next,id).spaceAfter,0.5);
  assert.equal(find(next,'a').spaceAfter,undefined);
  assert.equal(applyBlockSpacing(p,['q2'],'rowHeight',6),p);
  assert.throws(()=>applyBlockSpacing(p,['q1'],'rowHeight',200));
  assert.throws(()=>applyBlockSpacing(p,['q1'],'colour',1));
});

test('worked example rows share one layout value',()=>{
  const p=project();p.sections[0].blocks.push({id:'we',type:'worked-example',examples:[{id:'e1',prompt:doc([text('x')])},{id:'e2',rowLayout:{gapMm:6},prompt:doc([text('y')])}]});
  assert.equal(blockSpacing(p,['we']).values.gapMm,'');
  const next=applyBlockSpacing(p,['we'],'gapMm',4);
  assert.deepEqual(next.sections[0].blocks.at(-1).examples.map(e=>e.rowLayout.gapMm),[4,4]);
});
