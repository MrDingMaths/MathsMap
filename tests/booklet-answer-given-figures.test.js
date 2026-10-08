import test from 'node:test';
import assert from 'node:assert/strict';
import {answerFragments,isGivenFigureNode,answerNodePath,compactAnswerLabel,firstAnswerNode} from '../src/lib/booklet-exercises.js';
import {expectedAnswerNodeIds} from '../scripts/booklet/check-compact-exercises.mjs';

const figure={id:'given-a',type:'group',label:'a',questionDiagrams:[{id:'graph-a',format:'tikz',code:'\\begin{tikzpicture}\\end{tikzpicture}'}]};
const response={id:'response',type:'part',label:'',prompt:'Match y=x².',answer:{short:'a',worked:'Graph a has vertex (0,0) and opens upwards.'}};
const block={id:'matching',type:'question',content:{id:'root',type:'group',prompt:'Match the equation to the supplied graph.',children:[response,figure]}};

test('answer navigation skips permanent figures and preserves real missing-answer targets',()=>{
 assert.equal(firstAnswerNode(figure),null);
 assert.equal(firstAnswerNode({id:'choices',children:[figure]}),null);
 assert.equal(firstAnswerNode({id:'selection',children:[figure,response]}),response);
 const incomplete={id:'incomplete',prompt:''};
 assert.equal(firstAnswerNode({id:'root',children:[incomplete,response]}),incomplete);
});
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

test('a source-supplied permanent demonstration does not create an empty answer row',()=>{
 const demonstration={id:'demo',prompt:'$\\sqrt{12}=2\\sqrt3$'};
 const activity={...block,sourceReview:{responses:[{targetId:'demo',kind:'none'}]},content:{id:'root',children:[demonstration,response]}};
 const project={id:'test',settings:{},topics:[{id:'topic',title:'Surds'}],sections:[{id:'s',topicId:'topic',phase:'practice',blocks:[activity]}]};
 for(const mode of ['short','worked']){
  assert.deepEqual(answerFragments(activity,mode).map(f=>f.content.children[0].id),['response']);
  assert.deepEqual(expectedAnswerNodeIds(project,mode),['response']);
 }
 assert.equal(demonstration.prompt,'$\\sqrt{12}=2\\sqrt3$');
});

test('opt-in source response labels remove an invented answer suffix for a single selection',()=>{
 const selected={...block,presentation:{sourceResponseLabels:true},sourceReview:{responses:[{targetId:'response',label:''}]}};
 const fragment=answerFragments(selected,'short')[0],root=fragment.content,leaf=root.children[0];
 assert.equal(compactAnswerLabel(3,answerNodePath(root,leaf,[],0)),'3');
 const legacy=answerFragments(block,'short')[0];
 assert.equal(compactAnswerLabel(3,answerNodePath(legacy.content,legacy.content.children[0],[],0)),'3(1)');
 assert.equal(response.label,'');assert.equal(figure.questionDiagrams.length,1);
 const labelled={...selected,sourceReview:{responses:[{targetId:'response',label:'b'}]}};
 const actual=answerFragments(labelled,'worked')[0];
 assert.equal(compactAnswerLabel(3,answerNodePath(actual.content,actual.content.children[0],[],0)),'3b');
});

test('navigation skips source-reviewed supplied demonstrations',()=>{
 const example={id:'example',prompt:'Complete supplied division'};
 const responses=[{targetId:'example',kind:'none'}];
 assert.equal(firstAnswerNode(example,responses),null);
 assert.equal(firstAnswerNode({id:'root',children:[example,response]},responses),response);
});
