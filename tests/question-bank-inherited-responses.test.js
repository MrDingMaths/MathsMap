import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseQuestion,validateQuestion,estimateAnswerSpaceMm} from '../src/lib/practice-question-model.js';
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

test('a leading unlabelled shared sketch inherits its direct stem and keeps writing space',()=>{
 const content={id:'q',prompt:'Sketch the component functions and their sum.',sharedSolutionDiagrams:[{id:'sum',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}'}],children:[leaf('sketch',{label:'',sharedSolutionDiagramId:'sum',answerSpaceMm:70}),leaf('a',{label:'a',prompt:'Explain the asymptote.'})]};
 assert.deepEqual(errors(content),[]);
 const normalized=normaliseQuestion({content}).content.children[0];
 assert.equal(normalized.prompt,'');assert.equal(normalized.sharedSolutionDiagramId,'sum');assert.equal(estimateAnswerSpaceMm(normalized),70);assert.equal(normalized.responseSpace,undefined);
 const altered=change=>{const next=structuredClone(content);change(next);return errors(next);};
 assert.equal(altered(q=>q.children.reverse()).length,1);
 assert.equal(altered(q=>delete q.children[0].label).length,1);
 assert.equal(altered(q=>q.children[0].label='a').length,1);
 assert.equal(altered(q=>q.children[0].sharedSolutionDiagramId='missing').length,1);
 assert.equal(altered(q=>delete q.children[0].sharedSolutionDiagramId).length,1);
 const nested={id:'root',prompt:'Sketch the graphs.',children:[{...content,id:'nested',type:'group',prompt:''},leaf('other',{prompt:'Explain.'})]};
 assert.equal(errors(nested).length,1);
});
