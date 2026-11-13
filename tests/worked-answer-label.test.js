import test from 'node:test';
import assert from 'node:assert/strict';
import {workedAnswerStartsWithDisplay} from '../src/lib/worked-answer-label.js';

test('a worked answer opening with displayed or multi-line maths takes a top-aligned label',()=>{
 for(const source of ['$$x=1$$','\\[x=1\\]','  $$\\begin{align*}a&=b\\end{align*}$$',
  '$\\begin{align*}\\angle BAC&=180^\\circ-90^\\circ-70^\\circ\\\\&=20^\\circ\\end{align*}$',
  '$\\begin{aligned}x&=1\\end{aligned}$','$\\begin{cases}x,&x\\ge0\\end{cases}$','$ \\begin{gather*}x\\end{gather*}$'])
  assert.equal(workedAnswerStartsWithDisplay(source),true,source);
 // Prose or single-line inline maths keeps the first-baseline label.
 for(const source of ['Since $\\theta\\in[0,90]$, ...','$\\angle CAD=30^\\circ$.\nEqual angles.','By the sine rule,\n$\\begin{align*}a&=b\\end{align*}$','',null,undefined])
  assert.equal(workedAnswerStartsWithDisplay(source),false,String(source));
});
