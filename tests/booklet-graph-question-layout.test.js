import test from 'node:test';
import assert from 'node:assert/strict';
import {graphQuestionsBelow,graphQuestionsOverhang} from '../src/lib/booklet-graph-question-layout.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {arrangementItems,findArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
test('graph overhang uses both an absolute and proportional threshold',()=>{
 assert.equal(graphQuestionsOverhang({graphMm:80,textMm:190,overhangMm:110}),true);
 assert.equal(graphQuestionsOverhang({graphMm:80,textMm:99,overhangMm:19}),false);
 assert.equal(graphQuestionsOverhang({graphMm:100,textMm:125,overhangMm:25}),false);
});
test('placing parts below a graph preserves all slots, answers and handwriting space',()=>{
 const block={id:'b',type:'question',content:{id:'q',label:'1',prompt:'Read the graph.',diagramPlacement:'beside-prompt',questionDiagrams:[{id:'graph',format:'tikz',widthMm:80,code:'graph'}],children:['a','b','c'].map(id=>({id,label:id,prompt:'Find '+id,answerSpaceMm:24,answer:{short:id,worked:id}}))}};
 const before=structuredClone(block),initial=resolveArrangement(block).tree;
 const tree=graphQuestionsBelow(block,{}, {nodeId:'q',rowId:'q:beside'});
 assert.equal(findArrangement(tree.root,'q:beside:below-stem').direction,'stack');
 const parts=findArrangement(tree.root,'q:parts');assert.equal(parts.children.length,2);assert.equal(parts.children[1].children.length,2);
 assert.deepEqual(arrangementItems(tree.root).map(n=>n.ref).sort(),arrangementItems(initial.root).map(n=>n.ref).sort());
 assert.deepEqual(block,before);assert.equal(resolveArrangement(block,tree).missing.length,0);
 block.content.diagramPlacement='right-of-prompt';
 const right=graphQuestionsBelow(block,{}, {nodeId:'q',rowId:'q:beside'});
 assert.equal(findArrangement(right.root,'q:beside:below-stem').children[0].id,'q:diagrams');
});
