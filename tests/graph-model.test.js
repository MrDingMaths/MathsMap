import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {graphModel,graphTikz,readGraphModel,visibleDomain,resolvedGraphPoint} from '../src/lib/graph-model.js';
import {reconstructionHazards} from '../scripts/booklet/source-fidelity.mjs';

test('equation edits regenerate curves, linked solution points and equation labels',()=>{
 const model=graphModel({lines:[{m:2,c:1}],points:[{x:1,y:3,lineIndex:0,label:'(1,3)',coordinateLabel:true},{x:2,y:4}],labels:[{x:0,y:4,text:'y=2x+1',equationLine:0,originalEquation:{m:2,c:1}}]});
 const original=graphTikz(model);model.lines[0].m=-3;model.lines[0].c=2;
 const changed=graphTikz(model);
 assert.match(original,/\{\(2\)\*x\+\(1\)\}/);
 assert.match(changed,/\{\(-3\)\*x\+\(2\)\}/);
 assert.match(changed,/\$y=-3x\+2\$/);
 assert.match(changed,/\$\(1,-1\)\$/);
 assert.equal(resolvedGraphPoint(model.points[0],model).y,-1);
 assert.equal(resolvedGraphPoint(model.points[1],model).y,4,'independent source data must stay fixed');
});
test('plot domains meet visible bounds so steep-line arrowheads are retained',()=>{
 const bounds={xmin:-5,xmax:5,ymin:-5,ymax:5};
 assert.deepEqual(visibleDomain({m:2,c:1},bounds),[-3,2]);
 assert.deepEqual(visibleDomain({m:-2,c:1,domain:[0,4]},bounds),[0,3]);
 assert.equal(visibleDomain({m:0,c:6},bounds),null);
 assert.match(graphTikz({lines:[{x:3}]}),/domain=-5:5\] \(\{3\},\{x\}\)/);
 assert.match(graphTikz({lines:[{m:2,c:1}]}),/domain=-3:2/);
});
test('minor grids retain regular ticks through zero without printing zero labels',()=>{
 const code=graphTikz({bounds:{xmin:-2,xmax:2,ymin:-2,ymax:2},xminor:1,yminor:1});
 assert.match(code,/xtick=\{-2,-1,0,1,2\}/);
 assert.match(code,/minor x tick num=1/);
 assert.match(code,/\\ifdim\\tick pt=0pt\\else/);
});

test('graph typography survives model recovery and subsequent equation edits',()=>{
 const code=graphTikz({tickFontPt:16,labelFontPt:18,lines:[{m:1,c:1}]});
 const recovered=readGraphModel(code);
 assert.equal(recovered.tickFontPt,16);assert.equal(recovered.labelFontPt,18);
 recovered.lines[0].m=2;
 const edited=graphTikz(recovered);
 assert.ok(edited.includes(String.raw`tick label style={font=\fontsize{10}{12}\selectfont,scale=0.888888888889}`));
 assert.ok(edited.includes(String.raw`every node/.style={font=\fontsize{10}{12}\selectfont,scale=1.8}`));
 assert.throws(()=>graphTikz({tickFontPt:0}),/font size/);
});
test('rectangle edits update vertices, coordinate captions and measured height',()=>{
 const model=graphModel({rectangle:{left:3,right:18,bottom:-5,top:1,showHeight:true,labels:[{text:'(3,1)'},{text:'(?,?)'}]}});
 model.rectangle.top=4;const code=graphTikz(model);
 assert.match(code,/coordinates \{\(3,4\) \(18,4\) \(18,-5\) \(3,-5\) \(3,4\)\}/);
 assert.match(code,/\$\(3,4\)\$/);assert.match(code,/\$\(\?,\?\)\$/);assert.match(code,/\$9\$/);
 assert.throws(()=>graphTikz({rectangle:{left:3,right:2,bottom:0,top:1}}),/Rectangle/);
});
test('caption text colours do not override explicit white backgrounds',()=>{
 const code=graphTikz({points:[{x:1,y:2,label:'(1,2)',anchor:'above right,fill=white'}]});
 assert.match(code,/\\node\[above right,fill=white,text=answerblue,/);
});
test('invalid graph drafts cannot generate broken TikZ',()=>{
 for(const data of [{bounds:{xmin:5,xmax:1}},{xstep:0},{ystep:.00001},{lines:[{m:null,c:1}]},{lines:[{m:1,c:0,domain:[2,1]}]},{points:[{x:1,y:null}]},{labels:[{x:null,y:1,text:'A'}]}])assert.throws(()=>graphTikz(data));
});
test('embedded models survive code-only callers without trusting edited code',()=>{
 const model=graphModel({lines:[{m:2,c:1}]});
 assert.deepEqual(readGraphModel(graphTikz(model)),model);
 assert.equal(readGraphModel(graphTikz(model)+'\n% manual change'),null);
 const composite=graphModel({panels:[graphModel({lines:[{m:1,c:0}]}),graphModel({lines:[]})]});
 assert.deepEqual(readGraphModel(graphTikz(composite)),composite);
 const cloned=graphModel(model);cloned.lines[0].m=9;assert.equal(model.lines[0].m,2);
});
test('all 93 inspected graph images have recoverable mathematical source models',()=>{
 const sources=JSON.parse(fs.readFileSync(new URL('../scripts/booklet/graph-source-models.json',import.meta.url)));
 assert.equal(Object.keys(sources).length,93);
 for(const [id,source]of Object.entries(sources))assert.deepEqual(readGraphModel(graphTikz(source)),graphModel(source),id);
 const blank=Object.entries(sources).filter(([id])=>id.startsWith('page-59'));
 assert.ok(blank.length>0);assert.ok(blank.every(([,m])=>m.lines.length===0),'student plotting grids must remain blank');
});
test('reconstruction gate rejects fixed endpoints in a mathematical function graph',()=>{
 const diagram={id:'graph',format:'tikz',mathematicalModel:{lines:[{m:1,c:0}]},code:String.raw`\draw (-5,-5)--(5,5);`};
 assert.ok(reconstructionHazards([{pageNumber:1,diagram}]).some(f=>f.code==='noneditable-function-graph'));
 diagram.code=graphTikz(diagram.mathematicalModel);
 assert.ok(!reconstructionHazards([{pageNumber:1,diagram}]).some(f=>f.code==='noneditable-function-graph'));
});


test('unscaled axes retain independent grid positions after equation editing',()=>{
 const model=graphModel({ticks:false,tickLabels:false,grid:true,lines:[{m:2,c:1}]});
 const recovered=readGraphModel(graphTikz(model));recovered.lines[0].c=3;
 const code=graphTikz(recovered);
 assert.ok(code.includes(String.raw`xticklabel={\relax},yticklabel={\relax}`));
 assert.ok(code.includes('tick style={draw=none}'));
 assert.ok(code.includes('grid=major'));
 assert.ok(code.includes('xtick={-5,-4,-3,-2,-1,0,1,2,3,4,5}'));
 assert.ok(!code.includes('ticks=none'));
 assert.ok(code.includes('{$x$}')&&code.includes('{$y$}'));
});

test('tick placement survives regeneration independently of font sizes',()=>{
 const model=graphModel({xTickLabelShiftPt:2,tickFontPt:8.5,labelFontPt:10,lines:[{m:1,c:0}]});
 const recovered=readGraphModel(graphTikz(model));recovered.lines[0].c=2;
 const code=graphTikz(recovered);
 assert.ok(code.includes('xticklabel style={yshift=2pt}'));
 assert.equal(recovered.tickFontPt,8.5);assert.equal(recovered.labelFontPt,10);
});
