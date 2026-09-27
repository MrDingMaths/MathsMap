// Intended path: tests/booklet-table-baseline.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {normalizeDocument,renderDocument,toSource} from '../public/libs/maths-editor/document-model.mjs';
import {mergeCells,splitCell,tableGrid} from '../public/libs/maths-editor/table-model.mjs';
import {storageValue} from '../src/lib/document-content.js';
import {saveBookletProject,loadBookletProject} from '../src/lib/booklet-project-storage.js';
import {tableBaselineFixture,equationCellIds} from './fixtures/booklets/table-baseline.mjs';

const cells=doc=>doc.blocks.flatMap(t=>t.rows.flat());
const alignments=doc=>Object.fromEntries(cells(doc).map(c=>[c.id,c.verticalAlign]));
const withoutAlignment=doc=>{const out=structuredClone(doc);for(const c of cells(out))delete c.verticalAlign;return out;};
const roundtrip=doc=>storageValue(JSON.parse(JSON.stringify(doc)));

test('opt-in equation baselines survive structured storage without changing content or geometry',()=>{
 const doc=storageValue(tableBaselineFixture()),control=storageValue(tableBaselineFixture('middle'));
 for(const id of equationCellIds.flat())assert.equal(alignments(doc)[id],'baseline');
 assert.equal(alignments(doc)['callout-note'],'middle','The annotation cell keeps its independent placement');
 assert.deepEqual(roundtrip(doc),doc);
 assert.deepEqual(withoutAlignment(doc),withoutAlignment(control),'Alignment changes no other native fields');
 assert.equal(toSource(doc),toSource(control),'Formula and visible text content are unchanged');
 assert.equal(doc.blocks[0].annotations[0].toCellId,'callout-fraction');
});

test('existing cell alignment choices, missing values and invalid values retain their old behavior',()=>{
 const values=['top','middle','bottom',undefined,'unsupported'];
 const doc=normalizeDocument({blocks:[{id:'compatibility',type:'table',rows:[values.map((verticalAlign,i)=>({id:'cell-'+i,type:'cell',...(verticalAlign===undefined?{}:{verticalAlign}),blocks:[]}))]}]});
 assert.deepEqual(cells(doc).map(c=>c.verticalAlign),['top','middle','bottom','middle','middle']);
 assert.deepEqual(roundtrip(doc),doc);
});

test('baseline participates in real editable and print markup while native maths and control cells stay unchanged',()=>{
 for(const editable of [false,true]){
  const render=doc=>{const calls=[];const html=renderDocument(doc,{editable,editableMathPreview:editable,math:(latex,display)=>{calls.push({latex,display});return katex.renderToString(latex,{displayMode:display,throwOnError:true});}});return{html,calls};};
  const actual=render(tableBaselineFixture()),control=render(tableBaselineFixture('middle'));
  for(const id of equationCellIds.flat())assert.match(actual.html,new RegExp('<td data-id="'+id+'"[^>]*vertical-align:baseline;'));
  assert.match(actual.html,/<td data-id="callout-note"[^>]*vertical-align:middle;/);
  assert.deepEqual(actual.calls,control.calls);
  assert.equal(actual.html.replace(/<td\b[^>]*>/g,tag=>tag.replace('vertical-align:baseline;','vertical-align:middle;')),control.html,'Opt-in cell styling is the only generated markup change');
 }
});

test('merge, normalized structured save and split retain each original logical cell alignment',()=>{
 const doc=normalizeDocument({blocks:[{id:'merge-table',type:'table',rows:[[
  {id:'left',type:'cell',verticalAlign:'baseline',blocks:[{id:'left-p',type:'paragraph',inlines:[{type:'text',text:'Left'}]}]},
  {id:'right',type:'cell',verticalAlign:'middle',blocks:[{id:'right-p',type:'paragraph',inlines:[{type:'text',text:'Right'}]}]}
 ]]}]});
 const before=toSource(doc);mergeCells(doc.blocks[0],'left','right');
 const saved=roundtrip(doc);assert.equal(saved.blocks[0].rows[0].length,1);assert.equal(saved.blocks[0].rows[0][0].colspan,2);
 splitCell(saved.blocks[0],'left');const reopened=roundtrip(saved),map=tableGrid(reopened.blocks[0]);
 assert.equal(map.columns,2);assert.equal(map.grid[0][0].cell.id,'left');
 assert.deepEqual(map.grid[0].map(e=>e.cell.verticalAlign),['baseline','middle']);
 assert.equal(new Set(map.entries.map(e=>e.cell.id)).size,2);
 // Splitting preserves merged content in the first cell; the new cell is blank by contract.
 assert.equal(toSource(reopened).replace(/\s+/g,' ').trim(),before.replace(/\s+/g,' ').trim());
});

test('revision-safe project API serializes and reopens the native baseline field',async()=>{
 const project={id:'baseline-regression',revision:7,sections:[{id:'section',blocks:[{id:'question',type:'rich-text',content:storageValue(tableBaselineFixture())}]}]};
 let stored=null,writes=0;
 const fetchImpl=async(url,options)=>{
  assert.equal(url,'/__booklet/projects/baseline-regression');
  if(options.method==='PUT'){const body=JSON.parse(options.body);assert.equal(body.expectedRevision,7);assert.deepEqual(body.project,project);stored={...body.project,revision:8};writes++;}
  else assert.equal(options.method,undefined);
  return{ok:true,json:async()=>structuredClone(stored)};
 };
 const saved=await saveBookletProject(project,fetchImpl),reopened=await loadBookletProject(project.id,fetchImpl);
 assert.equal(writes,1);assert.equal(saved.revision,8);assert.deepEqual(reopened,saved);
 assert.deepEqual(reopened.sections[0].blocks[0].content,project.sections[0].blocks[0].content);
 for(const id of equationCellIds.flat())assert.equal(alignments(reopened.sections[0].blocks[0].content)[id],'baseline');
});
