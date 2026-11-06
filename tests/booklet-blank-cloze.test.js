import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
const doc=appearance=>({blocks:[{id:'p',type:'paragraph',inlines:[{type:'cloze',answer:'Independent',width:31,...(appearance?{appearance}:{})}]}]});
test('blank clozes retain width and answers while hiding response marks',()=>{
 const normalized=normalizeDocument(doc('blank'));assert.equal(normalized.blocks[0].inlines[0].appearance,'blank');
 const html=renderDocument(normalized);assert.match(html,/data-cloze-appearance="blank"/);assert.match(html,/width:31mm/);assert.doesNotMatch(html,/data-cloze-leader|border-bottom/);
 assert.match(renderDocument(normalized,{fillCloze:true}),/Independent/);
});
test('unmarked clozes keep existing dotted rendering and omit optional metadata',()=>{
 const html=renderDocument(doc());assert.match(html,/data-cloze-leader/);assert.doesNotMatch(html,/data-cloze-appearance/);
 assert.equal(normalizeDocument(doc()).blocks[0].inlines[0].appearance,undefined);
});
import {sharedQuestion,mergeQuestionContent} from '../src/lib/question-sync.js';
test('blank cloze appearance remains local across bank comparison and refresh',()=>{
 const regular={id:'root',type:'question',prompt:doc()};const local=structuredClone(regular);local.prompt.blocks[0].inlines[0].appearance='blank';
 assert.deepEqual(sharedQuestion({content:regular}),sharedQuestion({content:local}));
 const merged=mergeQuestionContent(regular,local);assert.equal(merged.prompt.blocks[0].inlines[0].appearance,'blank');
 assert.equal(mergeQuestionContent(local,regular).prompt.blocks[0].inlines[0].appearance,undefined);
});
