import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSolid} from '../scripts/lib/solid-audit.mjs';
import {solidAcceptance,solidHash} from '../scripts/audit-solid-visibility.mjs';
test('curved complements retain exact-code independent review',()=>{
 const code=String.raw`% mathsmap-solid {"version":1,"kind":"curved-complement","crossSection":"square minus quadrant","radius":2,"depthOffset":[1.6,0.5]}
\begin{tikzpicture}
\draw (0,2) arc[start angle=180,end angle=270,radius=2];
\draw (1.6,2.5) arc[start angle=180,end angle=270,radius=2];
\draw (0,2)--(1.6,2.5);
\draw (2,0)--(3.6,0.5);
\end{tikzpicture}`;
 assert.equal(inspectSolid(code).status,'review');
 assert.equal(solidAcceptance({format:'tikz',code}).length,1);
 const reviews={[solidHash(code)]:{status:'accepted',reason:'Checked the inward-facing curved cut and actual viewing direction.'}};
 assert.deepEqual(solidAcceptance({format:'tikz',code},reviews),[]);
 assert.equal(solidAcceptance({format:'tikz',code:code.replace('1.6,2.5','1.7,2.5')},reviews).length,1);
});
