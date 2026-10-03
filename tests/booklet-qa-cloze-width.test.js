import test from 'node:test';
import assert from 'node:assert/strict';
import {clozeResponseRequiredMm} from '../src/lib/booklet-qa.js';

const width=latex=>clozeResponseRequiredMm(`$${latex}$`);

test('written division measures its widest handwritten row, excluding array syntax',()=>{
 const division=(q,r,d,n)=>`\\begin{array}{rl}&${q}\\ \\mathrm{r}\\ ${r}\\\\${d}&\\begin{array}{|l}\\hline${n}\\end{array}\\end{array}`;
 assert.equal(width(division('2','3','4','11')),15);
 assert.equal(width(division('535','9','37','19804')),24);
 assert.ok(width(division('2','3','4','11'))<=32);
 assert.ok(width(division('535','9','37','19804'))>width(division('2','3','4','11')));
 assert.ok(width('\\begin{array}{rl}12345&67890\\\\98765&43210\\end{array}')>24,'Unrecognised structures retain the existing conservative rule');
});

test('colour formatting does not increase handwriting width',()=>{
 for(const latex of ['+2','\\div3','-2','\\times3','12345','x^{12}','x_{123}','\\frac{123}{45}']){
  const plain=width(latex);
  assert.equal(width(`\\color{#268cff}{${latex}}`),plain,latex);
  assert.equal(width(`\\textcolor{#123456}{${latex}}`),plain,latex);
  assert.equal(width(`\\color[HTML]{268CFF}{${latex}}`),plain,latex);
 }
 assert.equal(width('+2'),11);
 assert.ok(width('\\color{#268cff}{+2}')<=16);
});

test('mathematical digits and scripts retain their width contribution',()=>{
 assert.equal(width('10x'),13);
 assert.equal(width('12345'),17);
 assert.equal(width('x^{12}'),15);
 assert.equal(width('x_{123}'),17);
 assert.ok(width('12345')>width('5'));
 assert.ok(width('x^{12}')>width('x^2'));
 assert.ok(width('x_{123}')>width('x_3'));
});

test('fraction numerator, denominator and separator remain counted',()=>{
 for(const command of ['frac','dfrac','tfrac']){
  assert.equal(width(`\\${command}{123}{45}`),20);
  assert.ok(width(`\\${command}{123}{45}`)>width(`\\${command}{1}{2}`));
  assert.equal(width(`\\color{#268cff}{\\${command}{123}{45}}`),20);
 }
 assert.ok(width('\\frac{x^{12}}{123}')>width('\\frac{x}{3}'));
});
