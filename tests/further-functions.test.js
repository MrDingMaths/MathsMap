import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildTheoryDraft } from '../src/lib/theory-content.js';
import { collectBlocks } from '../scripts/lib/tikz-blocks.mjs';
import { fieldAccessor } from '../scripts/diagram-audit/lib/audit-lib.mjs';
import { visitTextFields } from '../scripts/lib/content-fields.mjs';
import { authorItem } from '../scripts/content/further-functions.mjs';
import { validateInlineText } from '../scripts/lib/lint-math.mjs';
import { voiceBreaches } from '../scripts/lib/theory-voice.mjs';
import { compile } from 'svelte/compiler';
import { build } from 'esbuild';
import { checkRepair } from '../scripts/check-theory.mjs';

test('the shared theory component renders optional rich-text examples after the method and preserves legacy theory', async () => {
  const built=await build({
    stdin:{contents:"import {render} from 'svelte/server'; import Theory from './src/components/TheoryView.svelte'; export const view=theory=>render(Theory,{props:{theory}}).body;",resolveDir:process.cwd()},
    bundle:true,platform:'node',format:'esm',write:false,
    plugins:[{name:'theory-component',setup(builder){
      builder.onLoad({filter:/[/\\]tikz\.js$/},()=>({contents:'export function renderTikzCode() {} export function cancelTikzJob() {}'}));
      builder.onLoad({filter:/\.svelte$/},args=>({contents:compile(fs.readFileSync(args.path,'utf8'),{filename:args.path,generate:'server'}).js.code,resolveDir:path.dirname(args.path)}));
    }}],
  });
  const {view}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
  const legacy={intro:'Introduction',facts:['Key fact'],steps:['First step']};
  const old=view(legacy);
  assert.match(old,/Introduction/);
  assert.match(old,/First step/);
  assert.doesNotMatch(old,/Worked example/);
  const html=view({...legacy,workedExample:{question_text:'Find $x$.',solution_text:'$x=2$'}});
  assert.ok(html.indexOf('First step')<html.indexOf('Worked example'));
  assert.match(html,/class="example-question/);
  assert.match(html,/class="example-solution/);
  assert.match(html,/katex/);
});

test('a theory editor save/reopen retains and edits the worked example without mutating its source', () => {
  const original = { intro: 'Old', facts: ['Rule'], steps: ['Method'], extension: { keep: true }, workedExample: { question_text: 'Before', solution_text: '$x=1$' } };
  const saved = buildTheoryDraft(original, { intro: 'New', facts: ['New rule'], steps: ['Method'], exampleQuestion: 'Find $x$.', exampleSolution: '$x=2$' });
  const reopened = JSON.parse(JSON.stringify(saved));
  assert.deepEqual(reopened.workedExample, { question_text: 'Find $x$.', solution_text: '$x=2$' });
  assert.deepEqual(reopened.extension, original.extension);
  assert.equal(original.workedExample.question_text, 'Before');
  assert.ok(!('workedExample' in buildTheoryDraft(saved, { ...saved, exampleQuestion: '', exampleSolution: '' })));
});

test('worked example diagrams and text participate in the same review/edit traversal as practice', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-example-'));
  try {
    fs.mkdirSync(path.join(dir, 'content'));
    const figure = '[tikz]\n\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}\n[/tikz]';
    const doc = { theory: { workedExample: { question_text: 'Given:\n'+figure, solution_text: 'Answer:\n'+figure } } };
    fs.writeFileSync(path.join(dir, 'content', 'example.json'), JSON.stringify(doc));
    const blocks = collectBlocks(dir);
    assert.deepEqual(blocks.map(b=>b.where), ['theory.workedExample.question_text', 'theory.workedExample.solution_text']);
    const accessor = fieldAccessor(doc, blocks[1].where);
    accessor.set('Repaired');
    assert.equal(doc.theory.workedExample.solution_text, 'Repaired');
    const fields = [];
    visitTextFields(doc, 'content', v=>fields.push(v.where+'.'+v.key));
    assert.deepEqual(fields, ['theory.workedExample.question_text', 'theory.workedExample.solution_text']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the theory review gate accepts example figures and checks corrupted or incomplete example text', () => {
  const theory=JSON.parse(fs.readFileSync('public/content/reciprocal-function-graph.json')).theory;
  const check=replacement=>checkRepair('reciprocal-function-graph',{replacement,figure:'kept',placement:'workedExample.question_text'}).faults;
  assert.deepEqual(check(structuredClone(theory)),[]);
  const corrupt=structuredClone(theory);corrupt.workedExample.solution_text+='\tfrac';
  assert.match(check(corrupt).join(' '),/workedExample.solution_text: raw control character/);
  const incomplete=structuredClone(theory);delete incomplete.workedExample.solution_text;
  assert.match(check(incomplete).join(' '),/workedExample.solution_text is missing or empty/);
});

const skills = JSON.parse(fs.readFileSync('data/skills.json')).filter(s=>s.dotPointIds?.some(d=>d.startsWith('dp-s6x1y11-functions-')));
test('all 21 revised skills have compact theory, worked examples, unique practice and valid rich text', () => {
  assert.equal(skills.length,21);
  for(const {id} of skills){
    const content=JSON.parse(fs.readFileSync(`public/content/${id}.json`));
    const quiz=JSON.parse(fs.readFileSync(`public/quizzes/${id}.json`));
    assert.deepEqual(voiceBreaches(content.theory),[],id);
    const cards=Object.values(content.practice).filter(Array.isArray).flat();
    assert.equal(new Set(cards.map(c=>c.question_text)).size,cards.length,id);
    const errors=[];
    for(const card of [content.theory.workedExample,...cards,...quiz.questions]){
      assert.ok(card?.question_text && card.solution_text,id);
      validateInlineText(card.question_text,id,errors);
      validateInlineText(card.solution_text,id,errors);
      // A swallowed JavaScript escape remains legal KaTeX but changes the mathematics.
      assert.doesNotMatch(card.question_text+' '+card.solution_text,/\$[^$]*(?<!\\)\b(?:xge|yle|yge|xle|le\d|ge\d)[^$]*\$/);
    }
    assert.deepEqual(errors,[],id);
    for(const q of quiz.questions){
      assert.equal(q.options.filter(o=>o.correct).length,1,id+' '+q.id);
      assert.equal(new Set(q.options.map(o=>o.text)).size,4,id+' '+q.id);
      q.options.forEach(o=>{
        assert.ok(o.correct || o.why);
        validateInlineText(o.text,id+' '+q.id+' option',errors);
        if(o.why)validateInlineText(o.why,id+' '+q.id+' explanation',errors);
      });
    }
    assert.deepEqual(errors,[],id+' options');
    assert.ok(!cards.some(c=>['eliminate-hyperbola-reciprocal','classify-relation-mapping-type'].includes(c.structure)));
  }
});

function bound(s){
  s=s.trim();
  if(s==='-\\infty')return -Infinity;
  if(s==='\\infty')return Infinity;
  const root=s.match(/^(-?\d*)\\sqrt(?:\{(\d+)\}|(\d+))$/);
  if(root)return (root[1]==='-'?-1:Number(root[1]||1))*Math.sqrt(Number(root[2]||root[3]));
  return Number(s);
}
function contains(answer,x){
  const parts=[...answer.matchAll(/([\[(])([^,]+),([^\])]+)([\])])/g)];
  assert.ok(parts.length,answer);
  return parts.some(([,left,a,b,right])=>{
    const lo=bound(a),hi=bound(b);assert.ok(!Number.isNaN(lo)&&!Number.isNaN(hi),answer);
    return (left==='['?x>=lo-1e-9:x>lo+1e-9)&&(right===']'?x<=hi+1e-9:x<hi-1e-9);
  });
}
const predicates = {
  'solve-cubic-factored-distinct': (x,h)=>(x+h+1)*(x-h)*(x-h-3)>1e-9,
  'solve-cubic-factored-repeated': (x,h)=>(x+h)**2*(x-h-3)<-1e-9,
  'solve-cubic-common-factor': (x,h)=>x**3-(h+1)**2*x<-1e-9,
  'solve-cubic-rearrange-factorise': (x,h)=>x**3-(h+3)*x*x<=1e-9,
  'solve-polynomial-higher-degree': (x,h)=>(x*x-h*h)*(x*x-(h+1)**2)<-1e-9,
  'solve-rational-basic-constant': (x,h)=>Math.abs(x-h)>1e-9&&1/(x-h)>1+1e-9,
  'solve-rational-linear-fraction': (x,h)=>Math.abs(x-h)>1e-9&&(x+h)/(x-h)<=2+1e-9,
  'solve-rational-two-fractions': (x,h)=>Math.abs(x*x-h*h)>1e-9&&1/(x-h)-1/(x+h)>1e-9,
  'solve-rational-variable-rhs': (x,h)=>Math.abs(x)>1e-9&&1/x-x/(h*h)>1e-9,
  'solve-rational-quadratic-terms': (x,h)=>Math.abs(x*x-h*h)>1e-9&&1/(x*x-h*h)>=1-1e-9,
  'solve-abs-less-than': (x,h)=>Math.abs(x-h)<=h+2+1e-9,
  'solve-abs-greater-than': (x,h)=>Math.abs(x-h)>h+2+1e-9,
  'solve-abs-reciprocal': (x,h)=>Math.abs(x-h)>1e-9&&1/Math.abs(x-h)<=1/(h+2)+1e-9,
  'solve-abs-both-sides-linear': (x,h)=>Math.abs(x-h)<=Math.abs(x+h)+1e-9,
  'solve-abs-vs-linear-function': (x,h)=>Math.abs(x-h)<x+h-1e-9,
  'solve-abs-quadratic-composite': (x,h)=>Math.abs(x*x-h*h)<=h*h+1e-9,
  'solve-abs-denominator-variable': (x,h)=>Math.abs(x-h)>1e-9&&1/Math.abs(x-h)<=1/h+1e-9,
  'solve-abs-case-analysis-rational': (x,h)=>Math.abs(x+h)>1e-9&&Math.abs(x-h)/(x+h)<=1+1e-9,
};
test('inequality intervals agree with the original inequalities, including roots, poles and endpoint strictness', () => {
  for(const [structure,predicate] of Object.entries(predicates)){
    const id=structure.startsWith('solve-cubic')||structure==='solve-polynomial-higher-degree'?'solve-cubic-inequalities':structure.startsWith('solve-rational')?'solve-rational-inequalities':['solve-abs-less-than','solve-abs-greater-than','solve-abs-reciprocal'].includes(structure)?'solve-absolute-value-inequalities':'solve-inequality-abs-both-sides';
    for(let n=0;n<6;n++){
      const h=n+1,item=authorItem(id,structure,n);
      const samples=[...Array.from({length:161},(_,i)=>(i-80)/4),h,-h,3*h,h+1,h+3,2*h+2,Math.sqrt(h*h+1),-Math.sqrt(h*h+1),h*Math.sqrt(2),-h*Math.sqrt(2)];
      for(const x of samples)assert.equal(contains(item.answer,x),predicate(x,h),`${structure} h=${h} x=${x} ${item.answer}`);
    }
  }
});

test('the reciprocal of a rational function retains the original excluded input as a hole', () => {
  for(let n=0;n<6;n++){
    const h=n+1,item=authorItem('reciprocal-function-graph','reciprocal-rational-and-inverses',n);
    assert.match(item.answer,new RegExp('\\{'+h+','+(h+2)));
    assert.match(item.a,/hole/);
    assert.doesNotMatch(item.a,/intercept.*hole/);
  }
});
