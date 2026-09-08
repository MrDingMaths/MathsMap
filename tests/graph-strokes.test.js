import test from 'node:test';
import assert from 'node:assert/strict';
import {graphTikz,readGraphModel} from '../src/lib/graph-model.js';
import {GRAPH_STROKES,GRAPH_STROKE_MARKER,strokeTargetFromSvg,strokeWidthForScale} from '../src/lib/graph-strokes.js';
import {styleManualGraphStrokes} from '../src/lib/graph-stroke-source.js';

test('generated plots, axes, ticks and independent minor grids use the shared weights',()=>{
  const code=graphTikz({lines:[{m:1,c:0,dashed:true}],xminor:1});
  assert.ok(code.includes('axis line style={black,line width=0.5pt,'));
  assert.ok(code.includes('tick style={black,line width=0.4pt}'));
  assert.ok(code.includes('minor grid style={line width=0.15pt}'));
  assert.match(code,/grid style=\{[^}]*line width=0.25pt\}/);
  assert.match(code,/addplot\[answerblue,dashed,line width=0.8pt/);
  assert.ok(code.includes(GRAPH_STROKE_MARKER));
  assert.doesNotMatch(code,/\b(?:thin|thick)\b/);
});
test('older generated models remain recoverable without accepting manually edited equations',()=>{
  const old=graphTikz({lines:[{m:2,c:3}]},{legacyStrokes:true});
  assert.ok(readGraphModel(old));
  assert.equal(readGraphModel(old.replace('{(2)*x+(3)}','{(9)*x+(3)}')),null);
  assert.ok(graphTikz(readGraphModel(old)).includes(GRAPH_STROKE_MARKER));
});
test('stroke calibration accounts for SVG fitting and page zoom without cumulative scaling',()=>{
  for(const target of [.8,.5,.4,.25,.15])for(const svgScale of [.25,1,2,4])for(const pageScale of [.6,1,1.5]){
    const width=strokeWidthForScale(target,svgScale,pageScale);
    assert.ok(Math.abs(width*svgScale/pageScale*72/96-target)<1e-10);
    assert.equal(strokeTargetFromSvg(target),target);
  }
  assert.equal(strokeWidthForScale(.8,0),null);
  assert.equal(strokeTargetFromSvg(1.7),null);
  assert.equal(GRAPH_STROKES.tolerancePt,.05);
});
test('manual adoption handles nested arrow options, ticks, guides and geometry without changing labels',()=>{
  const source=String.raw`\begin{tikzpicture}
\draw[gray,very thin,step=1] (-5,-5) grid (5,5);
\draw[{Straight Barb[length=2.5mm,width=2.2mm]}-{Straight Barb},thick] (-5,0)--(5,0);
\foreach \n in {-5,...,5} {\draw[line width=1pt] (\n,-0.13)--(\n,0.13);}
\draw[blue,very thick] (0,1)--(3,4) node[right] {$y=x+1$};
\draw[dashed] (1,0)--(1,2);
\node at (0,0) {thin and thick};
\end{tikzpicture}`;
  const result=styleManualGraphStrokes(source);
  assert.deepEqual(result.roles.map(x=>x.role),['majorGrid','axis','tick','plot','guide']);
  assert.ok(result.code.includes('Straight Barb[length=2.5mm,width=2.2mm]'));
  assert.ok(result.code.includes('node[right] {$y=x+1$}'));
  assert.ok(result.code.includes('{thin and thick}'));
  assert.equal(styleManualGraphStrokes(result.code).code,result.code);
});
test('PGFPlots manual styles retain nested labels and invisible ticks',()=>{
  const source=String.raw`\begin{tikzpicture}\begin{axis}[axis line style={black,thin,->},tick style={draw=none},grid style={gray,thin},minor x tick num=1]\addplot[blue,thick] {x};\end{axis}\end{tikzpicture}`;
  const {code}=styleManualGraphStrokes(source);
  assert.ok(code.includes('tick style={draw=none,line width=0.4pt}'));
  assert.ok(code.includes('minor grid style={line width=0.15pt}'));
});
test('manual migration preserves embedded model comments and annotation scaffolds',()=>{
  const comment=String.raw`% original: axis line style={thin} \draw[thick] (0,0)--(1,1);`;
  const source=String.raw`\begin{tikzpicture}`+'\n'+comment+'\n'+String.raw`\draw[red,->] (axis cs:1,1)--(axis cs:2,2);\end{tikzpicture}`;
  const {code,roles}=styleManualGraphStrokes(source);
  assert.ok(code.includes(comment));
  assert.deepEqual(roles.map(r=>r.role),['guide']);
});
