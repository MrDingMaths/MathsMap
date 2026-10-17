import test from 'node:test';
import assert from 'node:assert/strict';
import {answerDisplayLabel,answerFragments,exerciseLabelWidth} from '../src/lib/booklet-exercises.js';
import {normaliseQuestion,containsParentAnswers} from '../src/lib/practice-question-model.js';
import {captureQuestionPresentation,remapQuestionPresentation} from '../src/lib/question-presentation.js';
import {sharedQuestion} from '../src/lib/question-sync.js';

const fixture=()=>({id:'q',sourceOrder:3,type:'question',presentation:{answerPartLabels:{short:{a:'ai',match:'b'},worked:{a:'a'}}},content:{id:'root',type:'question',label:'3',children:[{id:'a',type:'part',label:'a',prompt:'Calculate.',answer:{short:'16',worked:'2^4=16'}},{id:'match',type:'part',label:'',prompt:'Match.',answer:{short:'Match',worked:'Match'}}]}});

test('edition suffixes follow the displayed question number and leave default labels intact',()=>{
 const q=fixture(),a=q.content.children[0],match=q.content.children[1];
 assert.equal(answerDisplayLabel(q,a,3,['1','a'],'short'),'3ai');
 assert.equal(answerDisplayLabel(q,a,8,['1','a'],'worked'),'8a');
 assert.equal(answerDisplayLabel(q,match,3,['2'],'short'),'3b');
 assert.equal(answerDisplayLabel(q,match,3,['2'],'worked'),'3(2)');
 assert.equal(answerDisplayLabel({...q,presentation:{}},a,3,['a'],'short'),'3a');
 assert.equal(answerDisplayLabel(q,a,null,[],'short'),'ai');
});

test('suffixes survive normalisation, answer fragmentation, and identity remapping as local presentation',()=>{
 const q=fixture(),normal=normaliseQuestion(q);
 assert.deepEqual(normal.presentation.answerPartLabels,q.presentation.answerPartLabels);
 const fragment=answerFragments(q,'short')[0];
 assert.equal(answerDisplayLabel(fragment,fragment.content.children[0],3,[],'short'),'3ai');
 const captured=captureQuestionPresentation(q);
 assert.equal(remapQuestionPresentation(captured,new Map([['a','new-a']])).answerPartLabels.short['new-a'],'ai');
 assert.deepEqual(sharedQuestion(q),sharedQuestion({...q,presentation:{}}));
});

test('answer gutter measures explicit labels including the longest roman suffix',()=>{
 const q=fixture();q.presentation.answerPartLabels.short.a='aviii';
 assert.equal(exerciseLabelWidth([q],'short'),6*2.1);
 assert.equal(exerciseLabelWidth([q],'worked'),4*2.1);
});

test('completed group answers survive bank normalisation with child identities intact',()=>{
 const table={format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{id:'cell',type:'cell',blocks:[{id:'value',type:'paragraph',inlines:[{type:'math',latex:'16'}]}]}]]}]};
 const q=fixture();q.content.answer={short:table,worked:table};
 const normal=normaliseQuestion(q);
 assert.equal(normal.content.answer.short.blocks[0].rows[0][0].blocks[0].inlines[0].latex,'16');
 assert.deepEqual(normal.content.answer.short,normal.content.answer.worked);
 assert.equal(containsParentAnswers(normal),false);
 assert.equal(containsParentAnswers({...q,content:{...q.content,answer:{short:'Summary',worked:'Summary'}}}),true);
 assert.deepEqual(normal.content.children.map(n=>n.id),['a','match']);
 assert.equal(answerFragments(normal,'short').length,1);
 assert.equal(answerFragments(normal,'worked').length,1);
 const supported=structuredClone(q);
 supported.content.answer.worked.blocks.push({id:'reason',type:'paragraph',inlines:[{type:'text',text:'The events cover all outcomes.'}]});
 const withWorking=normaliseQuestion(supported);
 assert.equal(withWorking.content.answer.worked.blocks[1].inlines[0].text,'The events cover all outcomes.');
 assert.equal(containsParentAnswers(withWorking),false);
 const other=fixture();assert.equal(normaliseQuestion(other).content.answer,undefined);
});
