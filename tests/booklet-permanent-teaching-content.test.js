import test from 'node:test';
import assert from 'node:assert/strict';
import {retainsTeachingPromptWithAnswers,teachingQuestionMode,independentAnswerPages} from '../src/lib/booklet-answer-options.js';

test('supplied material in mixed teaching activities survives enabled response controls',()=>{
  for(const [kind,option] of [['identify','showIdentifyAnswers'],['review','showReviewAnswers'],['guided-practice','showGuidedPracticeAnswers'],['example','showGuidedPracticeAnswers']]){
    const block={id:kind,type:'question',sourceAtom:{kind},sourceReview:{responses:[{targetId:'demonstration',kind:'none'},{targetId:'response',kind:'working'}]}};
    assert.equal(retainsTeachingPromptWithAnswers(block),true);
    assert.equal(teachingQuestionMode(block,{},'student'),'student');
    assert.equal(teachingQuestionMode(block,{[option]:true},'student'),'worked');
    assert.deepEqual(independentAnswerPages([{blocks:[block]}]),[]);
  }
});
test('practice keys and separate worked examples retain their existing presentation',()=>{
  for(const block of [{type:'question',sourceReview:{responses:[{kind:'none'}]}},{type:'worked-example',sourceReview:{responses:[{kind:'none'}]}},{type:'question',sourceAtom:{kind:'example'},sourceReview:{responses:[{kind:'none'}]}},{type:'question',sourceAtom:{kind:'identify'},sourceReview:{responses:[{kind:'working'}]}}])assert.equal(retainsTeachingPromptWithAnswers(block),false);
});
