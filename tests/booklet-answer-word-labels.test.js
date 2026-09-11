import test from 'node:test';
import assert from 'node:assert/strict';
import {compactAnswerLabel,exerciseLabelWidth,answerNodePath,answerFragments} from '../src/lib/booklet-exercises.js';
test('named answer views have readable separation and a matching gutter',()=>{
 assert.equal(compactAnswerLabel(1,['a','Front']),'1a Front');
 assert.equal(compactAnswerLabel(12,['b','ii']),'12bii');
 assert.equal(compactAnswerLabel(null,['a','Top']),'a Top');
 const width=exerciseLabelWidth([{sourceOrder:1,content:{id:'root',children:[{label:'a',children:[{label:'Front'}]}]}}]);
 assert.equal(width,'1a Front'.length*2.1);
});

test('a source-numbered group uses its current exercise number once in answer fragments',()=>{
 const block={sourceOrder:2,content:{id:'source-question-3',type:'group',label:'3',children:[{id:'a',type:'part',label:'a'},{id:'b',type:'part',label:'b'}]}};
 const labels=answerFragments(block).map(fragment=>{
  const root=fragment.content,path=answerNodePath(root,root);
  return compactAnswerLabel(fragment.sourceOrder,answerNodePath(root,root.children[0],path));
 });
 assert.deepEqual(labels,['2a','2b']);
 assert.equal(exerciseLabelWidth([block]),8);
});
