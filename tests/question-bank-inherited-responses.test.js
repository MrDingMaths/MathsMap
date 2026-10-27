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

test('a native table row may prefix its name with the response label',()=>{
 const prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'t',type:'table',rows:['a) Alan Douglas','b. Betty Smith','Clara'].map(label=>[{blocks:[{type:'paragraph',inlines:[{type:'text',text:label}]}]}])}]};
 assert.deepEqual(errors({id:'q',prompt,children:[leaf('a',{label:'a'}),leaf('b',{label:'b'})]}),[]);
 assert.equal(errors({id:'q',prompt,children:[leaf('a',{label:'a'}),leaf('c',{label:'c'})]}).length,1);
 assert.equal(errors({id:'q',prompt,children:[leaf('a',{label:'a'}),leaf('c',{label:'Cl'})]}).length,1);
});

test('native currency is literal while mathematical inlines and clozes retain notation guards',()=>{
 const doc=inlines=>({format:'maths-editor-document-v1',version:1,blocks:[{type:'paragraph',inlines}]});
 const notationErrors=prompt=>validateQuestion(normaliseQuestion({content:leaf('q',{type:'question',prompt})})).errors.filter(e=>/maths delimiters|slash-style/.test(e));
 assert.deepEqual(notationErrors(doc([{type:'text',text:'Salary $23.90; complete: '},{type:'cloze',answer:'$23.90',width:25}])),[]);
 assert.ok(notationErrors('Salary $23.90; complete the calculation.').some(e=>/maths delimiters/.test(e)));
 assert.ok(notationErrors(doc([{type:'math',latex:'1/2'}])).some(e=>/slash-style/.test(e)));
 assert.ok(notationErrors(doc([{type:'cloze',answer:'$1/2$',width:25}])).some(e=>/slash-style/.test(e)));
 assert.ok(notationErrors(doc([{type:'cloze',answer:String.raw`$\$31.60/\text{h}$`,width:25}])).some(e=>/slash-style/.test(e)));
 assert.deepEqual(notationErrors(doc([{type:'cloze',answer:String.raw`$\frac{\$31.60}{\text{h}}$`,width:25}])),[]);
 assert.deepEqual(notationErrors(doc([{type:'math',latex:'\\frac{1}{2}'},{type:'cloze',answer:'$\\frac{1}{2}$',width:25}])),[]);
 assert.ok(notationErrors(doc([{type:'math',latex:'\\(x'},{type:'math',latex:'x\\)'}])).some(e=>/maths delimiters/.test(e)));
});

test('a leading shared sketch retains its inherited task after visible part labels are added',()=>{
 const content={id:'q',prompt:'Sketch the component functions and their sum.',sharedSolutionDiagrams:[{id:'sum',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}'}],children:[leaf('sketch',{label:'',sharedSolutionDiagramId:'sum',answerSpaceMm:70}),leaf('a',{label:'a',prompt:'Explain the asymptote.'})]};
 assert.deepEqual(errors(content),[]);
 const normalized=normaliseQuestion({content}).content.children[0];
 assert.equal(normalized.prompt,'');assert.equal(normalized.sharedSolutionDiagramId,'sum');assert.equal(estimateAnswerSpaceMm(normalized),70);assert.equal(normalized.responseSpace,undefined);
 const altered=change=>{const next=structuredClone(content);change(next);return errors(next);};
 assert.equal(altered(q=>q.children.reverse()).length,1);
 assert.equal(altered(q=>delete q.children[0].label).length,1);
 assert.deepEqual(altered(q=>{q.children[0].label='a';q.children[1].label='b';}),[]);
 assert.deepEqual(altered(q=>q.children[0].label='i'),[]);
 assert.equal(altered(q=>q.children[0].sharedSolutionDiagramId='missing').length,1);
 assert.equal(altered(q=>delete q.children[0].sharedSolutionDiagramId).length,1);
 const nested={id:'root',prompt:'Sketch the graphs.',children:[{...content,id:'nested',type:'group',prompt:''},leaf('other',{prompt:'Explain.'})]};
 assert.equal(errors(nested).length,1);
});
