import test from 'node:test';
import assert from 'node:assert/strict';
import {answerFragments,isGivenFigureNode} from '../src/lib/booklet-exercises.js';
import {expectedAnswerNodeIds} from '../scripts/booklet/check-compact-exercises.mjs';

const figure={id:'given-a',type:'group',label:'a',questionDiagrams:[{id:'graph-a',format:'tikz',code:'\\begin{tikzpicture}\\end{tikzpicture}'}]};
const response={id:'response',type:'part',label:'',prompt:'Match y=x².',answer:{short:'a',worked:'Graph a has vertex (0,0) and opens upwards.'}};
const block={id:'matching',type:'question',content:{id:'root',type:'group',prompt:'Match the equation to the supplied graph.',children:[response,figure]}};
test('matching figures retain the question diagram but create no extra answer fragments',()=>{
 for(const mode of ['short','worked']){
  const fragments=answerFragments(block,mode);
  assert.equal(fragments.length,1);
  assert.equal(fragments[0].content.children[0].id,'response');
  const project={id:'test',settings:{},topics:[{id:'topic',title:'Matching'}],sections:[{id:'s',topicId:'topic',phase:'practice',blocks:[block]}]};
  assert.deepEqual(expectedAnswerNodeIds(project,mode),['response']);
 }
 assert.equal(block.content.children[1].questionDiagrams[0].id,'graph-a');
});
test('a real diagram question missing its answer is still an answer row to repair',()=>{
 const question={...figure,prompt:''};
 assert.equal(isGivenFigureNode(question),false);
 assert.equal(answerFragments({...block,content:question},'worked').length,1);
 assert.equal(isGivenFigureNode({...figure,answer:{short:'a'}}),false);
});
