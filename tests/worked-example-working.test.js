import test from 'node:test';
import assert from 'node:assert/strict';
import {workingInPrompt,workingKind} from '../scripts/booklet/worked-example-working.mjs';

const para=(id,...inlines)=>({id,type:'paragraph',lineHeight:1.4,inlines});
const text=(t,colour)=>({type:'text',text:t,...(colour?{colour}:{})});
const block=(prompt,extra={})=>({id:'b',type:'worked-example',presentation:{layout:'columns'},examples:[{id:'e',prompt:{format:'maths-editor-document-v1',version:1,blocks:prompt},...extra}]});

test('working in the prompt is found so "Show theory solutions" can hide it', () => {
  const found=workingInPrompt(block([para('q',text('Find a.')),para('w1',text('1. ','#ef6068'),text('a=3','#268cff'))]));
  assert.deepEqual(found,[{exampleId:'e',nodeIds:['w1']}]);
});

test('working already in theorySolution, mixed lines and question text after working are not flagged', () => {
  assert.deepEqual(workingInPrompt(block([para('q',text('Find a.')),para('w',text('a=3','#268cff'))],{theorySolution:{blocks:[para('s',text('x'))]}})),[]);
  assert.deepEqual(workingInPrompt(block([para('m',text('82%'),text('=0.82','#268cff'))])),[]);
  assert.deepEqual(workingInPrompt(block([para('q',text('Part a')),para('w',text('1','#268cff')),para('q2',text('Part b'))])),[]);
  assert.deepEqual(workingInPrompt({...block([para('q',text('Find a.')),para('w',text('a=3','#268cff'))]),pedagogyRole:'definition'}),[]);
});

test('red step headings and \\color maths count as working', () => {
  assert.equal(workingKind(para('h',text('Step 2: Solve','#ef6068'))),'working');
  assert.equal(workingKind(para('m',{type:'math',latex:'\\color{#268cff}x=2'})),'working');
  assert.equal(workingKind(para('q',text('Solve'))),'question');
});

test('moved working is renamed in both saved arrangement copies', async () => {
  const {renameArrangementRefs}=await import('../scripts/booklet/worked-example-working.mjs');
  const arrangement=()=>({version:1,root:{id:'r',type:'group',direction:'stack',children:[{id:'i1',type:'item',ref:'e/prompt#q'},{id:'i2',type:'item',ref:'e/prompt#w'}]}});
  const b={...block([]),presentation:{layout:'columns',layoutOverrides:{blockLayouts:{b:{arrangement:arrangement()}}}}};
  const project={settings:{layoutOverrides:{blockLayouts:{b:{arrangement:arrangement()}}}}};
  assert.equal(renameArrangementRefs(project,b,{'e/prompt#w':'e/theorySolution#w'}),2);
  for(const a of [project.settings.layoutOverrides.blockLayouts.b.arrangement,b.presentation.layoutOverrides.blockLayouts.b.arrangement])
    assert.deepEqual(a.root.children.map(c=>c.ref),['e/prompt#q','e/theorySolution#w']);
});
