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
