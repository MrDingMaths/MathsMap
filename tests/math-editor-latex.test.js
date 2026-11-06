import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {editableMathLatex,storedMathLatex} from '../public/libs/maths-editor/math-latex.mjs';

test('bold italic maths crosses the MathLive/KaTeX boundary without changing upright maths',()=>{
 assert.equal(editableMathLatex(String.raw`\boldsymbol{x_i}+\bm{f}+\mathbf{A}`),String.raw`\mathbfit{x_i}+\mathbfit{f}+\mathbf{A}`);
 const stored=storedMathLatex(String.raw`\mathbf{\mathbfit{x_i}}+\mathbf{A}+\frac{\mathbfit{f}}{2}`);
 assert.equal(stored,String.raw`\boldsymbol{x_i}+\mathbf{A}+\frac{\boldsymbol{f}}{2}`);
 assert.doesNotThrow(()=>katex.renderToString(stored));
 assert.equal(storedMathLatex(String.raw`\mathbf{x+\mathbfit{y}}`),String.raw`\mathbf{x+\boldsymbol{y}}`);
 assert.equal(storedMathLatex(String.raw`\mathbf{\mathbfit{x}}+\mathbf{\mathbfit{y}}`),String.raw`\boldsymbol{x}+\boldsymbol{y}`);
});

test('a typed double prime is stored in a form KaTeX can render',()=>{
 for(const written of [String.raw`8.4^{\doubleprime}`,String.raw`8.4^\doubleprime `,String.raw`8.4^{ \doubleprime }`]){
  const stored=storedMathLatex(written);
  assert.equal(stored,"8.4''");
  assert.doesNotThrow(()=>katex.renderToString(stored,{throwOnError:true}));
 }
 assert.equal(storedMathLatex(String.raw`43^{\circ}\,44'\,8.4^{\doubleprime}\approx44^{\circ}`),String.raw`43^{\circ}\,44'\,8.4''\approx44^{\circ}`);
 assert.equal(storedMathLatex(String.raw`f^{\prime\prime}(x)`),String.raw`f^{\prime\prime}(x)`);
});

test('MathLive output that drops the space after \pmod is made renderable',()=>{
 const stored=storedMathLatex(String.raw`x^2\equiv1\pmodn`);
 assert.equal(stored,String.raw`x^2\equiv1\pmod n`);
 assert.doesNotThrow(()=>katex.renderToString(stored,{throwOnError:true}));
 assert.equal(storedMathLatex(String.raw`a\pmod{n}`),String.raw`a\pmod{n}`);
});
