import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedAnswerNodeIds,assertAnswerNodeCoverage} from '../scripts/booklet/check-compact-exercises.mjs';

const leaf=id=>({id,type:'part',answer:{short:'1',worked:'One observation.'}});
const project=content=>({id:'answer-coverage',settings:{},topics:[{id:'topic',title:'Topic'}],sections:[{id:'practice',topicId:'topic',phase:'practice',role:'practice',blocks:[{id:'question',type:'question',content}]}]});

test('coverage expects a consolidated answer only in the edition that supplies it',()=>{
 const p=project({id:'root',type:'question',children:[leaf('left'),leaf('right')],answer:{short:{format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Left: 1. Right: 1.'}]}]}}});
 const before=structuredClone(p);
 assert.deepEqual(expectedAnswerNodeIds(p,'short'),['root']);
 assert.deepEqual(expectedAnswerNodeIds(p,'worked'),['left','right']);
 assert.deepEqual(p,before);
 assertAnswerNodeCoverage(['root'],expectedAnswerNodeIds(p,'short'));
 assert.throws(()=>assertAnswerNodeCoverage(['left','right'],expectedAnswerNodeIds(p,'short')));
});

test('nested overrides retain sibling answers and shared diagrams do not conceal leaves',()=>{
 const p=project({id:'root',children:[{id:'group',children:[leaf('a'),leaf('b')],answer:{worked:'Both totals are 1.'}},{id:'shared',sharedSolutionDiagrams:[{id:'figure'}],children:[leaf('c'),leaf('d')]}]});
 assert.deepEqual(expectedAnswerNodeIds(p,'short'),['a','b','c','d']);
 assert.deepEqual(expectedAnswerNodeIds(p,'worked'),['group','c','d']);
 assertAnswerNodeCoverage(['d','group','c'],expectedAnswerNodeIds(p,'worked'));
 for(const actual of [['group','c'],['group','c','d','d'],['group','c','other']])assert.throws(()=>assertAnswerNodeCoverage(actual,expectedAnswerNodeIds(p,'worked')));
});

test('an outer override owns all nested answers and empty overrides retain children',()=>{
 const p=project({id:'root',answer:{short:'',worked:'Complete table.'},children:[{id:'nested',answer:{short:'A: 1; B: 1',worked:'Two rows.'},children:[leaf('a'),leaf('b')]}]});
 assert.deepEqual(expectedAnswerNodeIds(p,'short'),['nested']);
 assert.deepEqual(expectedAnswerNodeIds(p,'worked'),['root']);
});

test('coverage excludes teaching and refuses duplicate expected identities',()=>{
 const p=project({id:'root',children:[leaf('a'),leaf('b')]});
 p.sections.unshift({id:'teaching',topicId:'topic',phase:'teaching',role:'teaching',blocks:[{id:'example',type:'rich-text',content:'Worked example'}]});
 assert.deepEqual(expectedAnswerNodeIds(p,'short'),['a','b']);
 p.sections[1].blocks[0].content.children[1].id='a';
 assert.throws(()=>expectedAnswerNodeIds(p,'worked'),/unique identities/);
});
