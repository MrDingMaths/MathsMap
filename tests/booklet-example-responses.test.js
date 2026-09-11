import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingAnswerCategory,teachingQuestionMode,independentAnswerPages} from '../src/lib/booklet-answer-options.js';
import {teachingLabels} from '../src/lib/booklet-labels.js';

test('student responses inside a source Example remain blank until teaching controls reveal them',()=>{
 const response={id:'response',type:'question',sourceAtom:{id:'shared-example',kind:'example'},sourceReview:{responses:[{targetId:'cloze',kind:'cloze'}]}};
 const demonstration={id:'demonstration',type:'worked-example',sourceAtom:{id:'shared-example',kind:'example'}};
 assert.equal(teachingAnswerCategory(response),'guided');
 for(const mode of ['student','short','worked'])assert.equal(teachingQuestionMode(response,{},mode),'student');
 assert.equal(teachingQuestionMode(response,{showGuidedPracticeAnswers:true},'student'),'worked');
 assert.equal(teachingQuestionMode(demonstration,{},'student'),'worked');
 assert.equal(response.sourceAtom.kind,'example');
 assert.deepEqual(independentAnswerPages([{blocks:[response,demonstration]}]),[]);
 assert.equal(teachingAnswerCategory({...response,sourceReview:{responses:[{kind:'none'}]}}),'theory');
 const labels=teachingLabels([{...response,content:{id:'group',children:[{id:'cloze',label:''},{id:'labelled',label:'a'}]}}]);
 assert.equal(labels.cloze,'');assert.equal(labels.labelled,'a');
 const steps=teachingLabels([{id:'guided',type:'question',sourceAtom:{kind:'guided-practice'},content:{id:'parts',children:[{id:'a',label:'a',children:[{id:'volume',label:'1'},{id:'capacity',label:'2'}]},{id:'b',label:'b',children:[{id:'volume-b',label:'1'},{id:'capacity-b',label:'2'}]}]}}]);
 assert.equal(steps.a,'a');assert.equal(steps.b,'b');assert.equal(steps.volume,'1');assert.equal(steps.capacity,'2');
});
