import test from 'node:test';
import assert from 'node:assert/strict';
import {answerFragments,answerNodePath,compactAnswerLabel} from '../src/lib/booklet-exercises.js';
import {renderDocument} from '../public/libs/maths-editor/document-model.mjs';

test('one unlettered construction shares the question number while its labelled parts retain letters',()=>{
 const block={id:'q',type:'question',presentation:{sourceResponseLabels:true},sourceReview:{responses:[{targetId:'draw',label:''}]},content:{id:'root',children:[{id:'draw',label:'',prompt:'Draw the graph.',answer:{short:'Graph',worked:'Graph'}},{id:'a',label:'a',prompt:'Read a value.',answer:{short:'3',worked:'3'}},{id:'b',label:'b',answer:{short:'5',worked:'5'}}]}};
 for(const mode of ['short','worked']){
  const labels=answerFragments(block,mode).map(f=>{const root=f.content,n=root.children[0];return compactAnswerLabel(3,answerNodePath(root,n,[],0,root));});
  assert.deepEqual(labels,['3','3a','3b']);
 }
 const two=structuredClone(block);two.content.children[1].label='';
 assert.equal(compactAnswerLabel(3,answerNodePath(two.content,two.content.children[0],[],0,two.content)),'3(1)');
});

test('numeric and text clozes share the sentence baseline and retain requested widths',()=>{
 const render=answer=>renderDocument({format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'text',text:'At '},{type:'cloze',answer,width:22},{type:'text',text:' minutes.'}]}]});
 for(const answer of ['70','9:30 am','noon']){
  const html=render(answer);assert.match(html,/data-width="22"/);assert.doesNotMatch(html,/cloze-bottom:.5em/);assert.match(html,/bottom:var\(--document-cloze-bottom,.18em\)/);
 }
});
