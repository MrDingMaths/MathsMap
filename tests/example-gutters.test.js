import test from 'node:test';
import assert from 'node:assert/strict';
import {exampleGutterProblems,repairExampleGutters} from '../scripts/content/example-gutters.mjs';
const ex=solution_text=>({question_text:'Calculate.',solution_text});
test('reports bare opening paragraphs and mispositioned aligned phantoms',()=>{
  assert.equal(exampleGutterProblems(ex('$2+3$\n$=5$')).length,1);
  assert.equal(exampleGutterProblems(ex('$\\begin{aligned}\\mathrel{\\phantom{=}}2+3\\\\&=5\\end{aligned}$')).length,1);
  assert.equal(exampleGutterProblems(ex('$\\begin{aligned}&\\mathrel{\\phantom{=}}2+3\\\\&=5\\end{aligned}$')).length,0);
});
test('scoped formatter adds or moves only the required gutter controls',()=>{
  for(const source of ['$2+3$\n$=5$','$\\begin{aligned}\\mathrel{\\phantom{=}}2+3\\\\&=5\\end{aligned}$','$\\begin{aligned}&2+3\\\\&=5\\end{aligned}$','$\\begin{aligned}\\mathrel{\\phantom{=}}47-12\\\\=35\\end{aligned}$']){
    const before={...ex(source),extension:{retain:true}},after=repairExampleGutters(before);
    assert.equal(exampleGutterProblems(after.example).length,0);assert.equal(after.operations.length,1);assert.deepEqual(after.example.extension,before.extension);assert.equal(after.example.question_text,before.question_text);
  }
  assert.deepEqual(repairExampleGutters(ex('$x=2$\n$y=3$')),{example:ex('$x=2$\n$y=3$'),operations:[]});
});
test('preserves independent equations, relation wraps and supported separate-field gutters',()=>{
  assert.equal(exampleGutterProblems(ex('$x=2$\n$y=3$')).length,0);
  assert.equal(exampleGutterProblems(ex('$\\begin{aligned}x&=a+b\\\\&\\quad+c\\\\&=5\\end{aligned}$')).length,0);
  assert.equal(exampleGutterProblems({question_text:'$2+3$',solution_text:'$=5$',equationAlignment:{mode:'continuation'}}).length,0);
  assert.equal(exampleGutterProblems(ex('[tikz]\\node {$2+3$};[/tikz]')).length,0);
});
