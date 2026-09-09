import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {contentSource} from '../src/lib/document-content.js';
const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
const get=id=>p.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
test('source syllabus outcome is preserved separately from cover summaries',()=>{
 const text=get('index-teaching-4').content.blocks.flatMap(b=>b.inlines?.map(i=>i.text??'')??[]).join('');
 assert.match(text,/MA5-IND-C-01 simplifies algebraic expressions involving positive-integer and zero indices, and establishes the meaning of negative indices for numerical bases/);
});
test('source p52 nested six-part grid and p61 twenty-eight-part grid retain row order',()=>{
 const nested=get('index-t8-q7').content.children[1],q=get('index-t10-q3').content;
 assert.equal(nested.layout,'grid');assert.equal(nested.columns,3);
 assert.deepEqual(nested.children.map(c=>c.label),['i','ii','iii','iv','v','vi']);
 assert.equal(q.columns,4);assert.equal(q.children.length,28);
 assert.deepEqual(q.children.slice(-4).map(c=>c.label),['y','z','aa','bb']);
});
test('flowchart supplied and response boxes share dimensions and render as native maths',()=>{
 for(const n of get('index-t8-q15').content.children){
  const latex=contentSource(n.prompt).split('$')[1];
  assert.equal((latex.match(/\\boxed/g)??[]).length,5);
  assert.equal((latex.match(/\\rule\[-1mm\]\{0pt\}\{6mm\}/g)??[]).length,5);
  assert.doesNotThrow(()=>katex.renderToString(latex,{throwOnError:true}));
 }
});
test('method labels sit beside steps and the locally requested underline removal covers every part',()=>{
 for(const id of ['index-t8-q16','index-t10-q5']){
  const n=get(id).content.children[0];
  const prompt=contentSource(n.prompt);
  assert.doesNotMatch(prompt,/\\underset/);
  assert.match(prompt,/\\quad\\boxed\{\\text\{Expand\}/);
  assert.match(prompt,/\\quad\\boxed\{\\text\{Simplify\}/);
  assert.doesNotThrow(()=>katex.renderToString(prompt.slice(1,-1),{throwOnError:true}));
 }
 for(const n of get('index-t8-q16').content.children)assert.doesNotMatch(contentSource(n.prompt),/\\underline|_{3,}/);
 // Q15's separate completion lines are an explicitly different local scope.
 assert.match(contentSource(get('index-t8-q15').content.children[1].prompt),/\\underline/);
});
