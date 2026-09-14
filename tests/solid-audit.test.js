import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSolid,repairSolid} from '../scripts/lib/solid-audit.mjs';
import {solidTikz,prismModel,curvedSolidTikz} from '../src/lib/solid-geometry.js';
import {repairValue} from '../scripts/repair-solid-visibility.mjs';
import {solidHash,visitFigures,isSolidCandidate} from '../scripts/audit-solid-visibility.mjs';
const box=()=>solidTikz(prismModel([[0,0],[3,0],[3,2],[0,2]]));
test('current model detects flipped edge styles and cannot be fooled by a label stroke',()=>{
 const code=box(),wrong=code.replace(/\\draw\[dashed\]/,'\\draw');
 assert.equal(inspectSolid(code).status,'pass');assert.equal(inspectSolid(wrong).status,'defect');
 const fixed=repairSolid(wrong).code;assert.equal(inspectSolid(fixed).status,'pass');assert.equal(repairSolid(fixed).code,fixed);
 const labelled=code.replace('\\end{tikzpicture}','\\draw (B0)--(B1) node[midway] {$4$};\n\\end{tikzpicture}');
 assert.equal(inspectSolid(labelled).status,'defect');assert.match(repairSolid(labelled).code,/\\path \(B0\)--\(B1\) node/);
});
test('stale vertices and unknown metadata versions require review',()=>{
 const code=box();assert.equal(inspectSolid(code.replace('(A0) at (0,0)','(A0) at (1,0)')).status,'review');
 assert.equal(inspectSolid(code.replace('"version":1','"version":99')).status,'review');
});
test('missing boundaries and additional unmodelled solids cannot silently pass',()=>{
 const code=box();assert.equal(inspectSolid(code.replace(/\\draw[^;]+;/,'')).status,'review');
 const extra=code.replace('\\end{tikzpicture}',String.raw`\draw (10,0)--(12,0)--(11,2)--cycle;\end{tikzpicture}`);assert.equal(inspectSolid(extra).status,'review');
});
test('two separate translated triangles are not a prism',()=>{
 const code=String.raw`\begin{tikzpicture}
 \coordinate (A) at (0,0);\coordinate (B) at (2,0);\coordinate (C) at (1,1);
 \coordinate (D) at (3,1);\coordinate (E) at (5,1);\coordinate (F) at (4,2);
 \draw (A)--(B)--(C)--cycle;\draw (D)--(E)--(F)--cycle;\end{tikzpicture}`;
 assert.equal(inspectSolid(code).status,'review');assert.equal(repairSolid(code).code,code);
});
test('all checked curved templates pass and edits invalidate their certificate',()=>{
 for(const kind of ['cone','cylinder','sphere','semicylinder']){const code=curvedSolidTikz(kind);assert.equal(inspectSolid(code).status,'pass',kind);assert.equal(inspectSolid(code.replace('\\draw[dashed]','\\draw')).status,'review',kind);}
});
test('legacy cone gets real tangencies, label-only paths and repeatable repair',()=>{
 const code=String.raw`\begin{tikzpicture}\draw (-1,0)--(0,3);\draw (1,0)--(0,3) node[midway,right] {$5\text{ cm}$};\draw (0,0) ellipse (1 and 0.3);\end{tikzpicture}`;
 const fixed=repairSolid(code).code;assert.equal(inspectSolid(code).status,'defect');assert.equal(inspectSolid(fixed).status,'pass');assert.match(fixed,/\\path.*5\\text/);assert.equal(repairSolid(fixed).code,fixed);
});
test('sector extrusion keeps rear silhouette solid and hides the central depth guide',()=>{
 const code=String.raw`\begin{tikzpicture}\coordinate (O) at (0,0);\coordinate (A) at (0:3);\coordinate (B) at (60:3);\coordinate (O2) at ($(O)+(30:2)$);\coordinate (A2) at ($(A)+(30:2)$);\coordinate (B2) at ($(B)+(30:2)$);\draw (A) arc (0:60:3);\draw[dashed] (A2) arc (0:60:3);\draw (O)--(O2);\draw (A)--(A2);\draw (B)--(B2);\draw[dashed] (O2)--(A2);\draw[dashed] (O2)--(B2);\end{tikzpicture}`;
 const fixed=repairSolid(code).code;assert.equal(inspectSolid(code).status,'defect');assert.equal(inspectSolid(fixed).status,'pass');assert.match(fixed,/\\draw\[dashed\] \(0,0\)--/);assert.equal(repairSolid(fixed).code,fixed);
});
test('guarded migration preserves prose/evidence and is idempotent, conflicts stop',()=>{
 const before=box(),after=before.replace('font=\\large','font=\\large,black');
 const record={location:'/prompt',occurrence:0,beforeHash:solidHash(before),afterHash:solidHash(after),afterCode:after,review:{status:'accepted'}};
 const source={prompt:'Keep current edits [tikz]'+before+'[/tikz]',sourceReview:{code:before},id:'stable'};
 const {next,records}=repairValue(source,[record]);assert.equal(records.length,1);assert.equal(next.id,'stable');assert.deepEqual(next.sourceReview,source.sourceReview);assert.ok(next.prompt.startsWith('Keep current edits'));assert.equal(repairValue(next,[record]).records.length,0);
 assert.throws(()=>repairValue({...source,prompt:source.prompt.replace('(A0) at (0,0)','(A0) at (1,0)')},[record]),/Conflicting/);
 const found=[];visitFigures(source,r=>found.push(r));assert.equal(found.length,1);
});

test('question UUIDs cannot turn planar figures into 3D candidates',()=>{
 const plane=String.raw`\begin{tikzpicture}\coordinate (A) at (0,0);\coordinate (B) at (1,1);\draw (A)--(B);\end{tikzpicture}`;
 for(const id of ['q-01f9954f-23d9-4a9f-96a2-adc0bdb4f137','q-dc804bf3-d9ca-4914-9623-57d3721e667d'])assert.equal(isSolidCandidate(plane,'booklets/question-bank/'+id+'.json'),false);
 for(const context of ['3D diagram','3-D diagram','a solid prism'])assert.equal(isSolidCandidate(plane,context),true);
});
