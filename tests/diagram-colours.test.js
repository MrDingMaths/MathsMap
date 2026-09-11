import test from 'node:test';
import assert from 'node:assert/strict';
import {adoptDiagramColours,applyDiagramColourPolicy,diagramColourPolicy,DIAGRAM_COLOUR_PREFIX,inspectDiagramColours} from '../src/lib/diagram-colours.js';
import {prepareTikz} from '../src/lib/tikz-prepare.js';
import {migrateDiagramColours} from '../scripts/booklet/normalise-diagram-colours.mjs';
import {rasterColourReplacement} from '../scripts/booklet/diagram-colour-replacements.mjs';
import {answerDiagramStyle,answerDiagramSignature} from '../src/lib/booklet-exercises.js';
import {graphTikz,readGraphModel} from '../src/lib/graph-model.js';

const drawing=String.raw`\begin{tikzpicture}
\definecolor{outlineblue}{HTML}{478FD6}
\definecolor{labelblue}{HTML}{056FDB}
\definecolor{sourceAltitude}{HTML}{EE2227}
\definecolor{highlight}{HTML}{478FD6}
\draw[outlineblue,->,dashed,line width=0.8pt] (0,0)--(1,1) node[text=labelblue] {$a$};
\draw[sourceAltitude,line width=0.4pt] (1,1)--(1,0);
\draw[highlight] (0,0)--(1,0);
\end{tikzpicture}`;
const policy={kind:'geometry',base:['outlineblue','labelblue'],semantic:[{name:'sourceAltitude',hex:'EE2227',reason:'Altitude construction'},{name:'highlight',hex:'478FD6',reason:'Matched side and equation'}],reference:'Example triangle'};
test('ordinary lines and labels become black; semantic roles preserve even the identical source hue',()=>{
 const code=adoptDiagramColours(drawing,policy);
 assert.match(code,/definecolor\{outlineblue\}\{HTML\}\{000000\}/);
 assert.match(code,/definecolor\{labelblue\}\{HTML\}\{000000\}/);
 assert.match(code,/definecolor\{sourceAltitude\}\{HTML\}\{EE2227\}/);
 assert.match(code,/definecolor\{highlight\}\{HTML\}\{478FD6\}/);
 assert.ok(code.includes(drawing.split('\n')[5])); // Geometry/dashes/arrows/weight unchanged.
 assert.equal(applyDiagramColourPolicy(code),code);
 assert.deepEqual(diagramColourPolicy(code),{version:1,...policy});
});
test('fresh and already-normalised sources have the same prepared cache key',()=>{
 const raw=DIAGRAM_COLOUR_PREFIX+JSON.stringify({version:1,...policy})+'\n'+drawing;
 const normal=adoptDiagramColours(drawing,policy);
 assert.equal(prepareTikz(raw).key,prepareTikz(normal).key);
 assert.notEqual(prepareTikz(normal).key,prepareTikz(drawing).key);
 assert.equal(prepareTikz(normal).cleanCode.match(/data-diagram-colours="1"/g).length,1);
});
test('graph adoption leaves all original TeX and curve colours intact',()=>{
 const code=adoptDiagramColours(drawing,{kind:'graph',base:[],semantic:[],reference:'graph'});
 assert.ok(code.includes(drawing.slice(0,drawing.indexOf('\\end{tikzpicture}'))));
 assert.equal(applyDiagramColourPolicy(drawing),drawing);
});
test('graph metadata retains model recognition and calibrated answer widths, while mathematical edits invalidate both',()=>{
 const model={bounds:{xmin:-2,xmax:2,ymin:-2,ymax:2},lines:[{m:1,c:0}]};
 const original={id:'g',code:graphTikz(model),mathematicalModel:model};
 const style={widthMm:76,code:original.code,sourceSignature:answerDiagramSignature(original)},settings={diagramStyles:{short:{g:style}}};
 const diagram={...original,code:adoptDiagramColours(original.code,{kind:'graph',base:[],semantic:[],reference:'graph'})};
 assert.equal(answerDiagramStyle(settings,'short',diagram),style);
 assert.deepEqual(readGraphModel(diagram.code),readGraphModel(original.code));
 const edited={...diagram,code:diagram.code.replace('\\end{axis}','\\draw (0,0)--(1,1);\n\\end{axis}')};
 assert.equal(answerDiagramStyle(settings,'short',edited),null);assert.equal(readGraphModel(edited.code),null);
});
test('semantic colours require evidence and cannot reuse a base alias',()=>{
 assert.throws(()=>adoptDiagramColours(drawing,{...policy,reference:''}),/occurrence reference/);
 assert.throws(()=>adoptDiagramColours(drawing,{...policy,semantic:[{name:'outlineblue',hex:'478FD6',reason:'highlight'}]}),/semantic colour evidence/);
});
test('trailing editor comments retain exactly one SVG policy marker',()=>{
 const code=adoptDiagramColours(drawing,policy)+'\n% Manual edit';
 const prepared=prepareTikz(code).cleanCode;
 assert.equal(prepared.match(/data-diagram-colours="1"/g).length,1);
 assert.ok(prepared.endsWith('% Manual edit'));
 assert.equal(applyDiagramColourPolicy(prepared),prepared);
});
test('migration leaves source evidence and semantic fills intact and is idempotent',()=>{
 const diagram={id:'nr-test',format:'tikz',code:drawing.replaceAll('highlight','sourceCyan'),widthMm:65};
 const project={sections:[{blocks:[{id:'b',content:{questionDiagrams:[diagram]},sourceLayoutEvidence:{questionDiagrams:[structuredClone(diagram)]}}]}]};
 const result=migrateDiagramColours(project);
 assert.deepEqual(result.next.sections[0].blocks[0].sourceLayoutEvidence,project.sections[0].blocks[0].sourceLayoutEvidence);
 assert.equal(result.next.sections[0].blocks[0].content.questionDiagrams[0].widthMm,65);
 assert.equal(migrateDiagramColours(result.next).records.length,0);
});
test('unknown existing diagram colours require review instead of hue-based guesses',()=>{
 assert.throws(()=>migrateDiagramColours({format:'tikz',id:'nr-new',code:drawing}),/Unreviewed colour role/);
});
test('reviewed literal grey outlines become black without changing shaded faces',()=>{
 const code=String.raw`\begin{tikzpicture}\draw[black!65,line width=0.8pt] (0,0)--(1,1);\fill[black!5] (0,0) rectangle (1,1);\end{tikzpicture}`;
 const result=migrateDiagramColours({id:'nr-p59-q21-diagram1',format:'tikz',code});
 assert.match(result.next.code,/draw\[black,line width=0.8pt\]/);
 assert.match(result.next.code,/fill\[black!5\]/);
 assert.equal(migrateDiagramColours(result.next).records.length,0);
});
test('all four raster replacements retain their frame, black outlines and semantic shading',()=>{
 for(const file of ['0da6b03f8746-image106.png','a9c60f28037f-image107.png','13ff3d67d686-image110.png','025f998fd1b5-image123.png']){
  const node={id:'r',format:'image',src:'/assets/'+file,widthMm:120};
  const code=rasterColourReplacement(node);assert.match(code,/use as bounding box/);assert.equal(diagramColourPolicy(code).kind,'geometry');
  const migrated=migrateDiagramColours({questionDiagrams:[node]}).next.questionDiagrams[0];
  assert.equal(migrated.widthMm,120);assert.deepEqual(migrated.spec.originalDiagram,node);assert.equal(migrated.format,'tikz');
 }
});
test('geometry QA checks text and strokes including ellipse/use; graph QA is separate',()=>{
 const previous=globalThis.getComputedStyle;globalThis.getComputedStyle=s=>s.css;
 const shape=(stroke,fill='none',text=false)=>({closest:()=>null,matches:()=>text,css:{stroke,fill}});
 const marker={dataset:{diagramKind:'geometry',diagramSemanticPalette:'EE2227',diagramSemanticReference:'Triangle',diagramSemanticReasons:'Red altitude'}};
 const shapes=[shape('rgb(0, 0, 0)'),shape('rgb(238, 34, 39)'),shape('none','rgb(0, 0, 255)',true),shape('rgb(128, 128, 128)'),shape('none','rgb(187, 187, 217)')];
 const svg={querySelector:()=>marker,querySelectorAll:()=>shapes};
 try{assert.deepEqual(inspectDiagramColours(svg),['rgb(238, 34, 39)','rgb(0, 0, 255)','rgb(128, 128, 128)','rgb(187, 187, 217)']);marker.dataset.diagramKind='graph';assert.deepEqual(inspectDiagramColours(svg),[]);}finally{globalThis.getComputedStyle=previous;}
});
