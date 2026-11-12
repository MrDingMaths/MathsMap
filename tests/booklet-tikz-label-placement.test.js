// Deterministic TikZ label placement (scripts/booklet/tikz-label-placement.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {scanNodes,scanForeach,instrumentCode,applyPlacements,predictBox,choosePlacements,labelProblems,maskComments,isPlacementOption} from '../scripts/booklet/tikz-label-placement.mjs';

const GRAPH=String.raw`% mathsmap-diagram-colours {"version":1,"kind":"graph","reference":"p16-q9a; node at"}
\begin{tikzpicture}[x=0.65cm,y=0.65cm]
\draw[->,line width=0.5pt] (-6,0)--(6.2,0) node[right] {$x$};
\draw[line width=0.8pt] (-3,0) circle[radius=2];
\foreach \x in {-5,1}{\node[below left=4pt] at (\x,0) {$\x$};}
\foreach \x in {-1,5}{\draw (\x,-0.08)--(\x,0.08);\node[below right=4pt,font=\small] at (\x,0) {$\x$};}
\node[above] at (0,3) {$y=f(x)$};
\end{tikzpicture}`;

test('scanNodes finds statement and path nodes, ignores comments and keys', () => {
 const nodes=scanNodes(GRAPH);
 assert.deepEqual(nodes.map(n=>n.text),['$x$','$\\x$','$\\x$','$y=f(x)$']);
 assert.deepEqual(nodes.map(n=>n.loops.length),[0,1,1,0]);
 assert.deepEqual(nodes[2].optionList,['below right=4pt','font=\\small']);
 assert.equal(scanNodes(String.raw`\begin{tikzpicture}[every node/.style={inner sep=1pt},node distance=2cm]\node at (0,0) {a};\end{tikzpicture}`).length,1);
 assert.equal(maskComments('a % node at {x}\nb').indexOf('node'),-1);
});

test('scanForeach reads variables, items and body', () => {
 const loops=scanForeach(GRAPH);
 assert.equal(loops.length,2);
 assert.deepEqual(loops[0].items,['-5','1']);
 assert.deepEqual(loops[0].vars,['x']);
 assert.ok(loops.every(l=>l.splittable));
 assert.equal(scanForeach(String.raw`\foreach \x in {1,...,5} {\node at (\x,0) {a};}`)[0].splittable,false);
 assert.equal(scanForeach(String.raw`\foreach \x [count=\i] in {1,2} {\node at (\x,0) {a};}`)[0].splittable,false);
 const multi=scanForeach(String.raw`\foreach \x/\l in {1/a,2/b} \node at (\x,0) {$\l$};`)[0];
 assert.deepEqual(multi.vars,['x','l']);assert.ok(multi.splittable);
});

test('placement options are recognised; positioning and rotated nodes are unsupported', () => {
 for(const o of ['above','below left=4pt','right = 2pt','anchor=north east','xshift=2pt','shift={(1pt,2pt)}'])assert.ok(isPlacementOption(o),o);
 for(const o of ['font=\\small','fill=white','inner sep=1pt','pos=0.9','midway'])assert.ok(!isPlacementOption(o),o);
 const nodes=scanNodes(String.raw`\node[above=of a] at (0,0) {a};\node[rotate=30] at (1,0) {b};\node at (0,0) [above] {c};`);
 assert.deepEqual(nodes.map(n=>n.unsupported),['positioning library placement','rotated or sloped node','placement in a later option list']);
});

test('instrumentCode adds a marker per node and centres only the named nodes', () => {
 const code=instrumentCode(GRAPH,{center:[3],tickPt:8.5});
 assert.match(code,/data-mm-src="\\mmsrc"/);
 assert.equal((code.match(/\\gdef\\mmsrc\{\d+(?::\\x)?\}/g)??[]).length,4);
 // A looped node's marker carries its loop value, so a split copy keeps its identity.
 assert.equal((code.match(/\\gdef\\mmsrc\{\d+:\\x\}/g)??[]).length,2);
 assert.match(code,/\\node\[\/utils\/exec=\{\\gdef\\mmsrc\{3\}\},anchor=center\] at \(0,3\)/);
 assert.match(code,/node\[\/utils\/exec=\{\\gdef\\mmsrc\{0\}\},right\]/);
 // Node text, coordinates and paths are untouched.
 assert.ok(code.includes(String.raw`(-3,0) circle[radius=2]`));
});

test('applyPlacements rewrites one node in place and keeps everything else', () => {
 const {code,applied,skipped}=applyPlacements(GRAPH,new Map([['3:0',{anchor:'south west',dx:1.5,dy:1.5}]]));
 assert.deepEqual(skipped,[]);assert.deepEqual(applied,['3:0']);
 assert.ok(code.includes(String.raw`\node[anchor=south west,xshift=1.50pt,yshift=1.50pt] at (0,3) {$y=f(x)$};`));
 assert.equal(code.replace(/\\node\[[^\]]*\] at \(0,3\)/,''),GRAPH.replace(/\\node\[[^\]]*\] at \(0,3\)/,''));
});

test('applyPlacements splits a foreach when one iteration moves', () => {
 const {code,applied}=applyPlacements(GRAPH,new Map([['2:1',{anchor:'south east',dx:-1,dy:1}]]));
 assert.deepEqual(applied,['2:1']);
 // Iteration -1 stays in the loop; iteration 5 becomes its own copy with the tick and the moved label.
 assert.ok(code.includes(String.raw`\foreach \x in {-1}{\draw (\x,-0.08)--(\x,0.08);\node[below right=4pt,font=\small] at (\x,0) {$\x$};}`));
 assert.ok(code.includes(String.raw`{\draw (5,-0.08)--(5,0.08);\node[font=\small,anchor=south east,xshift=-1.00pt,yshift=1.00pt] at (5,0) {$5$};}`));
 // The other loop is unchanged.
 assert.ok(code.includes(String.raw`\foreach \x in {-5,1}{\node[below left=4pt] at (\x,0) {$\x$};}`));
});

test('applyPlacements edits a loop node in place when every iteration moves the same way', () => {
 const {code}=applyPlacements(GRAPH,new Map([['1:0',{anchor:'north',dx:0,dy:-2}],['1:1',{anchor:'north',dx:0,dy:-2}]]));
 assert.ok(code.includes(String.raw`\foreach \x in {-5,1}{\node[anchor=north,yshift=-2.00pt] at (\x,0) {$\x$};}`));
});

test('predictBox puts the ink anchor at the shifted point, inset by inner sep', () => {
 const geometry={px:100,py:50,w:10,h:6,innerSep:3};
 // anchor south (label above the point): ink bottom centre at y = 50 - (2 + 3) in SVG units.
 assert.deepEqual(predictBox(geometry,{anchor:'south',dx:0,dy:2}),[95,39,105,45]);
 // anchor north west (label below right): ink top-left at (100+1+3, 50+1+3).
 assert.deepEqual(predictBox(geometry,{anchor:'north west',dx:1,dy:-1}),[104,54,114,60]);
});

test('choosePlacements moves a label off a curve and keeps clear labels', () => {
 // A horizontal stroke through y=50 from x=0 to 200; a label centred on it, another clear one.
 const points=[];for(let x=0;x<=200;x+=.5)points.push(x,50);
 const current={tol:.375,viewBox:[0,0,200,100],points,labels:[{src:0,instance:0,anchor:'center',box:[95,47,105,53]},{src:1,instance:0,anchor:'south',box:[10,10,20,16]}]};
 const centred={labels:[{src:0,instance:0,box:[95,47,105,53]},{src:1,instance:0,box:[10,10,20,16]}]};
 const problems=labelProblems(current);
 assert.deepEqual(problems.map(p=>p.problem),[true,false]);
 const chosen=choosePlacements({current,centred,moving:problems.filter(p=>p.problem),innerSep:3});
 const pick=chosen.get(0);
 assert.ok(pick&&pick.hits===0&&pick.near===0,'label cleared');
 assert.ok(['north','south'].includes(pick.placement.anchor),'moved straight above or below');
});
