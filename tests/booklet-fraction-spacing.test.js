import test from 'node:test';
import assert from 'node:assert/strict';
import {spaceFractionSteps} from '../public/libs/maths-editor/equation-spacing.mjs';
import {renderMath} from '../src/lib/render-math.js';
import {renderDocument,normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
test('fraction steps gain breathing room without shrinking explicit writing gaps',()=>{
 const input=String.raw`\begin{aligned}\frac{x}{y}&=a\\[2pt]&=b\\[2mm]&=c\\[10pt]&=d\end{aligned}`;
 const result=spaceFractionSteps(input);
 assert.match(result,/\\\\\[8pt\]/);assert.match(result,/\\\\\[2mm\]/);assert.match(result,/\\\\\[10pt\]/);
 assert.equal(spaceFractionSteps(result),result);
 assert.equal(spaceFractionSteps(String.raw`\frac{x}{y}`),String.raw`\frac{x}{y}`);
});
test('shared spacing reaches all books, answers and editable maths without changing source',()=>{
 const latex=String.raw`\begin{aligned}\frac{x^5}{x^3}&=x^{5-3}\\&=x^2\end{aligned}`;
 assert.match(renderMath('$'+latex+'$'),/\\\\\[8pt\]/);
 const doc=normalizeDocument({blocks:[{type:'paragraph',inlines:[{type:'math',latex}]}]}),before=JSON.stringify(doc);
 assert.match(renderDocument(doc,{editable:true}),/\\\\\[8pt\]/);
 assert.equal(JSON.stringify(doc),before);
});
test('nested matrices and fraction-free equation blocks retain their own row spacing',()=>{
 const latex=String.raw`\begin{aligned}\frac12&=\begin{pmatrix}1\\2\end{pmatrix}\\x&=2\end{aligned}`;
 assert.equal(spaceFractionSteps(latex),String.raw`\begin{aligned}\frac12&=\begin{pmatrix}1\\2\end{pmatrix}\\[8pt]x&=2\end{aligned}`);
 const plain=String.raw`\begin{aligned}x&=2\\x+1&=3\end{aligned}`;assert.equal(spaceFractionSteps(plain),plain);
});

