import test from 'node:test';
import assert from 'node:assert/strict';
import {nextGroupSelection,nudgeDestination,moveDestinations,movedBreaks} from '../src/lib/booklet-group-selection.js';
import {flowCommand,flowNumbers} from '../src/lib/booklet-flow.js';
import {normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';

const question=id=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Find $x$.',children:[],answer:{short:'1',worked:'$x=1$'}}});
const text=id=>({id,type:'rich-text',content:id});
const fixture=()=>normalizeEditableProject({format:'mathsmap-booklet-project-v4',version:4,id:'selection-test',title:'Selection fixture',settings:{paginationMode:'flexible',exerciseOrganisation:'topic'},topics:[{id:'ta',title:'First'},{id:'tb',title:'Second'}],sections:[
  {id:'a',topicId:'ta',title:'Practice',phase:'practice',role:'practice',blocks:['q1','q2','q3','q4','q5'].map(question)},
  {id:'t',topicId:'tb',title:'Teaching',phase:'teaching',role:'teaching',blocks:[text('theory')]},
  {id:'b',topicId:'tb',title:'Practice',phase:'practice',role:'practice',blocks:['q6','q7'].map(question)},
]});
const order=p=>p.sections.map(s=>s.blocks.map(b=>b.id));

test('plain click replaces, Ctrl-click toggles non-adjacent questions',()=>{
  const p=fixture();
  let state=nextGroupSelection(p,{ids:['q2']});
  assert.deepEqual(state,{selection:['q2'],anchor:'q2'});
  state=nextGroupSelection(p,{...state,ids:['q5'],toggle:true});
  assert.deepEqual(state.selection,['q2','q5']);
  state=nextGroupSelection(p,{...state,ids:['q1'],toggle:true});
  assert.deepEqual(state.selection,['q1','q2','q5']);
  state=nextGroupSelection(p,{...state,ids:['q2'],toggle:true});
  assert.deepEqual(state.selection,['q1','q5']);
});

test('Shift-click ranges from the last-clicked anchor and can shrink or pivot',()=>{
  const p=fixture();
  let state=nextGroupSelection(p,{ids:['q3']});
  state=nextGroupSelection(p,{...state,ids:['q5'],shift:true});
  assert.deepEqual(state.selection,['q3','q4','q5']);
  state=nextGroupSelection(p,{...state,ids:['q4'],shift:true});
  assert.deepEqual(state.selection,['q3','q4']);
  state=nextGroupSelection(p,{...state,ids:['q1'],shift:true});
  assert.deepEqual(state.selection,['q1','q2','q3']);
  assert.equal(state.anchor,'q3');
});

test('a practice range across exercises leaves the teaching content between them',()=>{
  const p=fixture();
  const state=nextGroupSelection(p,{selection:['q4'],anchor:'q4',ids:['q6'],shift:true});
  assert.deepEqual(state.selection,['q4','q5','q6']);
});

test('non-contiguous selections move together in document order and keep ids',()=>{
  const p=fixture(),ids=['q5','q1','q3'];
  const moved=flowCommand(p,{type:'move',ids,sectionId:'b',beforeId:'q7'});
  assert.deepEqual(order(moved),[['q2','q4'],['theory'],['q6','q1','q3','q5','q7']]);
  assert.deepEqual(flowNumbers(moved),{q2:1,q4:2,q6:1,q1:2,q3:3,q5:4,q7:5});
  assert.equal(validateEditableProject(moved).valid,true);
  assert.deepEqual(moved.sections[2].blocks.find(b=>b.id==='q3').content,p.sections[0].blocks[2].content);
});

test('nudging gathers the selection and moves it one question at a time',()=>{
  const p=fixture();
  const up=flowCommand(p,{type:'move',ids:['q3','q5'],...nudgeDestination(p,['q3','q5'],-1)});
  assert.deepEqual(order(up)[0],['q1','q3','q5','q2','q4']);
  const down=flowCommand(p,{type:'move',ids:['q1','q3'],...nudgeDestination(p,['q1','q3'],1)});
  assert.deepEqual(order(down)[0],['q2','q4','q1','q3','q5']);
  const last=flowCommand(p,{type:'move',ids:['q4'],...nudgeDestination(p,['q4'],1)});
  assert.deepEqual(order(last)[0],['q1','q2','q3','q5','q4']);
  assert.equal(nudgeDestination(p,['q1'],-1),null);
  assert.equal(nudgeDestination(p,['q5'],1),null,'practice does not fall into the next teaching section');
  assert.equal(nudgeDestination(p,['q7'],1),null);
});

test('move destinations omit the selection and report travelling page breaks',()=>{
  const p=fixture();p.sections[0].blocks[1].flow={...p.sections[0].blocks[1].flow,pageBreakBefore:true};
  const destinations=moveDestinations(p,['q1','q2']);
  assert.deepEqual(destinations[0].sections[0].positions.map(x=>x.label),['Question 3','Question 4','Question 5']);
  assert.deepEqual(destinations[1].sections.map(s=>s.title),['Teaching','Practice']);
  assert.equal(movedBreaks(p,['q1','q2']),1);
  assert.equal(movedBreaks(p,['q3']),0);
});
