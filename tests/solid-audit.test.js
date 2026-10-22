import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSolid,repairSolid} from '../scripts/lib/solid-audit.mjs';
import {solidTikz,prismModel,curvedSolidTikz} from '../src/lib/solid-geometry.js';
import {repairValue} from '../scripts/repair-solid-visibility.mjs';
import {solidHash,visitFigures,isSolidCandidate,solidAcceptance} from '../scripts/audit-solid-visibility.mjs';
const box=()=>solidTikz(prismModel([[0,0],[3,0],[3,2],[0,2]]));

test('three disconnected comparison triangles are planar; solid cues and connected or hidden geometry remain guarded',()=>{
 const triangles=String.raw`\begin{tikzpicture}
 \coordinate (A) at (0,1.5);\coordinate (B) at (3,1.5);\coordinate (C) at (2.3,0);
 \coordinate (D) at (4,1.5);\coordinate (E) at (7,1.5);\coordinate (F) at (6.3,0);
 \coordinate (G) at (8,1.5);\coordinate (H) at (11,1.5);\coordinate (I) at (10.3,0);
 \draw (A)--(B)--(C)--cycle;\draw (D)--(E)--(F)--cycle;\draw (G)--(H)--(I)--cycle;
 \end{tikzpicture}`;
 assert.equal(isSolidCandidate(triangles,'Compare similar triangles'),false);
 for(const context of ['solid prism','3D geometry'])assert.equal(isSolidCandidate(triangles,context),true);
 for(const extra of [String.raw`\draw (A)--(D);`,String.raw`\fill (A)--(D)--(E)--cycle;`,String.raw`\path[draw] (A)--(D);`])assert.equal(isSolidCandidate(triangles.replace('\\end{tikzpicture}',extra+'\\end{tikzpicture}')),true);
 assert.equal(isSolidCandidate(triangles.replace('\\draw (A)','\\draw[dashed] (A)')),true);
 assert.equal(isSolidCandidate(triangles.replace('(8,1.5)','(1,1.5)').replace('(11,1.5)','(4,1.5)').replace('(10.3,0)','(3.3,0)')),true);
 assert.equal(isSolidCandidate(triangles.replace('(0,1.5)','(0,1.5,0)')),true);
 assert.equal(isSolidCandidate(box()),true);
});

test('declared semantic colour aliases follow construction-line rules without exempting ordinary boundaries',()=>{
 const policy={version:1,kind:'geometry',base:['outlineInk'],semantic:[{name:'constructionRed',hex:'EF6068',reason:'Inscribed construction inside another solid'}],reference:'Test source diagram'};
 const original=box();
 const highlighted=original.replace('\\draw (','\\draw[constructionRed,dashed] (');
 const withPolicy='% mathsmap-diagram-colours '+JSON.stringify(policy)+'\n'+highlighted;
 assert.equal(inspectSolid(withPolicy).status,'pass');
 assert.equal(inspectSolid(highlighted).status,'defect');
 assert.equal(inspectSolid(withPolicy.replace('constructionRed,dashed','outlineInk,dashed')).status,'defect');
});

test('registered house avatars do not require a solid review, retained diagrams still do',()=>{
 const portrait={type:'image',src:'/booklet-assets/shared/avatars/avatar-01.png'};
 assert.deepEqual(solidAcceptance(portrait),[]);
 const found=[];visitFigures(portrait,row=>found.push(row));assert.equal(found.length,0);
 for(const src of ['/booklet-assets/projects/source-solid.png','/booklet-assets/shared/avatars/avatar-99.png']){
  assert.equal(solidAcceptance({type:'image',src})[0]?.status,'image-review');
 }
 assert.equal(solidAcceptance({format:'tikz',code:box().replace('"version":1','"version":99')})[0]?.status,'review');
});

test('equally spaced collinear points on a gradient interval are planar',()=>{
 const code=String.raw`\begin{tikzpicture}
 \coordinate (A) at (1,2);\coordinate (B) at (3,3);
 \coordinate (C) at (5,4);\coordinate (D) at (7,5);
 \draw (A)--(D);\end{tikzpicture}`;
 assert.equal(isSolidCandidate(code,'Calculate the gradient of these line segments'),false);
 assert.equal(isSolidCandidate(code,'solid construction'),true);
 assert.equal(isSolidCandidate(box()),true);
});
test('upright set ovals with node-to-node arrows are planar without exempting solids',()=>{
 const mapping=String.raw`\begin{tikzpicture}
 \draw (0,0) ellipse (0.65 and 1.15);\draw (2.6,0) ellipse (0.65 and 1.15);
 \node (a) at (0,0.5) {$a$};\node (one) at (2.6,0.5) {$1$};
 \draw[->,line width=0.8pt] ([yshift=2pt]a.east)--(one.west);\end{tikzpicture}`;
 assert.equal(isSolidCandidate(mapping),false);
 assert.deepEqual(solidAcceptance({format:'tikz',code:mapping}),[]);
 assert.equal(isSolidCandidate(mapping,'solid construction'),true);
 assert.equal(isSolidCandidate(mapping.replace('\\end{tikzpicture}','\\draw (0,1)--(2.6,1);\\end{tikzpicture}')),true);
 assert.equal(isSolidCandidate(mapping.replace('0.65 and 1.15','1.15 and 0.65')),true);
 assert.equal(isSolidCandidate(curvedSolidTikz('cylinder')),true);
});
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
