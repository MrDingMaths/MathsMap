import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseQuestion,validateQuestion} from '../src/lib/practice-question-model.js';
const leaf=(id,extra={})=>({id,type:'part',prompt:'',answer:{short:'2',worked:'There are two qualifying outcomes.'},...extra});
const errors=content=>validateQuestion(normaliseQuestion({content})).errors.filter(e=>e.includes('prompt is required'));
test('visible parent tasks support table scaffold responses and a sole answer child',()=>{
 assert.deepEqual(errors({id:'q',prompt:'Complete the table.',children:[leaf('a',{responseSpace:'scaffold'}),leaf('b',{responseSpace:'scaffold'})]}),[]);
 assert.deepEqual(errors({id:'q',prompt:'Count the outcomes.',children:[leaf('a')]}),[]);
 assert.deepEqual(errors({id:'q',prompt:'Complete the table.',children:[{id:'g',type:'group',prompt:'',children:[leaf('a',{responseSpace:'scaffold'}),leaf('b',{responseSpace:'scaffold'})]}]}),[]);
});
test('empty independent tasks and unscaffolded multipart responses still need prompts',()=>{
 assert.equal(errors(leaf('q')).length,1);
 assert.equal(errors({id:'q',prompt:'',children:[leaf('a',{responseSpace:'scaffold'})]}).length,1);
 assert.equal(errors({id:'q',prompt:'Answer these.',children:[leaf('a'),leaf('b')]}).length,2);
});
test('labelled native table rows supply the matching response task only',()=>{
 const prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'t',type:'table',rows:['a','b'].map(label=>[{id:label,type:'cell',blocks:[{type:'paragraph',inlines:[{type:'text',text:label,marks:['bold']}]}]}])}]};
 assert.deepEqual(errors({id:'q',prompt,children:[leaf('a',{label:'a'}),leaf('b',{label:'b'})]}),[]);
 assert.equal(errors({id:'q',prompt,children:[leaf('a',{label:'a'}),leaf('c',{label:'c'})]}).length,1);
});
