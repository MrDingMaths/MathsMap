import test from 'node:test';
import assert from 'node:assert/strict';
import {diagramSizingKind,proposeDiagramWidth,recentTeacherActivity,diagramSizeReview,renderedDiagramSizingFindings} from '../src/lib/booklet-diagram-sizing.js';
import {COMPACT_IMPORT_PROMPT} from '../src/lib/booklet-import-spacing.js';
const figure={format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}'};
test('tall figures shrink proportionally without changing their source or fonts',()=>{
 const before=structuredClone(figure),r=proposeDiagramWidth(figure,{widthMm:60,heightMm:60});
 assert.equal(r.widthMm,40);assert.equal(r.action,'reduce');assert.deepEqual(figure,before);
});
test('a narrow tall figure requires review rather than an illegibly narrow width',()=>{
 assert.equal(proposeDiagramWidth(figure,{widthMm:25,heightMm:80}).action,'review');
});
test('drawing grids, raster labels and local exceptions are preserved',()=>{
 for(const alt of ['Editable response axes with ticks','Unshaded overlapping-set response diagram','Three empty upper writing cells','Blank compass scaffold for student drawing','Partially completed graph','Blank plotting surface','Reserve handwriting room near tree branches','Nine blank circles on a triangle','All side lengths are response content'])assert.equal(proposeDiagramWidth({...figure,alt},{widthMm:100,heightMm:100}).action,'preserve',alt);
 assert.equal(proposeDiagramWidth(figure,{widthMm:100,heightMm:100},{context:'Measure the angle using a protractor.'}).action,'preserve');
 assert.equal(proposeDiagramWidth({...figure,alt:'Blank Cartesian grid'},{widthMm:100,heightMm:100}).action,'preserve');
 assert.equal(proposeDiagramWidth({format:'image'},{widthMm:100,heightMm:100}).action,'preserve');
 assert.equal(proposeDiagramWidth({...figure,sizing:{exceptionReason:'Teacher requested this size'}},{widthMm:100,heightMm:100}).action,'preserve');
});
test('meaningful multi-figure groups and major reductions need individual treatment',()=>{
 assert.equal(proposeDiagramWidth({...figure,id:'q1-collection'},{widthMm:170,heightMm:100}).action,'preserve');
 assert.equal(proposeDiagramWidth(figure,{widthMm:70,heightMm:110}).action,'review');
 assert.equal(diagramSizingKind({...figure,id:'p5-tree'}),'detailed');
});
test('supplied graphs have independent question/short/worked envelopes',()=>{
 const graph={...figure,code:'\\begin{axis}\\addplot {x^2};\\end{axis}'};
 assert.equal(diagramSizingKind(graph),'graph');
 assert.equal(proposeDiagramWidth(graph,{widthMm:70,heightMm:60}).action,'preserve');
 assert.equal(proposeDiagramWidth(graph,{widthMm:70,heightMm:60},{role:'short'}).widthMm,55);
 assert.equal(diagramSizingKind(graph,{role:'worked'}),'worked-graph');
});
test('resolved and edited teacher feedback counts, automatic findings and save time do not',()=>{
 const cutoff='2026-10-18T00:00:00+11:00';
 assert.equal(recentTeacherActivity({updatedAt:'2026-10-25T01:00:00Z',studio:{flags:[]}},cutoff),false);
 assert.equal(recentTeacherActivity({studio:{flags:[{at:'2026-10-20T01:00:00Z',resolved:true}]}},cutoff),true);
 assert.equal(recentTeacherActivity({studio:{flags:[{kind:'automatic',at:'2026-10-20T01:00:00Z'}]}},cutoff),false);
 assert.equal(recentTeacherActivity({studio:{flags:[{at:'2026-10-10T01:00:00Z',editedAt:'2026-10-24T01:00:00Z'}]}},cutoff),true);
});
test('future semantic import prompts carry sizing and readability rules',()=>{
 assert.match(COMPACT_IMPORT_PROMPT,/25 October 2026/);assert.match(COMPACT_IMPORT_PROMPT,/10 pt complete native labels/);
 assert.match(COMPACT_IMPORT_PROMPT,/never auto-migrate accepted booklets on load/);
});

test('measured outliers require review without resizing or failing justified exceptions',()=>{
 const normal={...figure,id:'normal'},before=structuredClone(normal);
 assert.equal(diagramSizeReview(normal,{widthMm:45,heightMm:30}),null);
 assert.equal(diagramSizeReview(normal,{widthMm:65,heightMm:41}).kind,'diagram-size-review');
 assert.match(diagramSizeReview(normal,{widthMm:66,heightMm:30}).reviewRequired,/not a hard cap/);
 assert.equal(diagramSizeReview({...normal,spec:{sizing:{exceptionReason:'Dense source construction needs this scale'}}},{widthMm:110,heightMm:90}),null);
 assert.equal(diagramSizeReview({...normal,spec:{sizing:{purpose:'drawing'}}},{widthMm:170,heightMm:180}),null);
 assert.deepEqual(normal,before);
 const pair={...normal,spec:{description:'Paired squares with common scale'}};
 assert.equal(diagramSizingKind(pair),'meaningful-group');
 assert.equal(diagramSizeReview(pair,{widthMm:95,heightMm:45}),null);
 assert.equal(diagramSizeReview(pair,{widthMm:140,heightMm:45}).purpose,'meaningful-group');
 assert.equal(proposeDiagramWidth(pair,{widthMm:140,heightMm:45}).action,'preserve');
});

test('rendered measurements use independent answer roles even in combined editions',()=>{
 const project={sections:[{blocks:[{id:'q',content:{questionDiagrams:[{...figure,id:'d'}]}}]}]},before=structuredClone(project);
 const measurements=[{id:'d',page:2,widthMm:60,heightMm:39},{id:'d',page:4,widthMm:60,heightMm:39}];
 const findings=renderedDiagramSizingFindings(project,measurements,{edition:'with-short',pages:[{page:2,isAnswer:false},{page:4,isAnswer:true}]});
 assert.equal(findings.length,1);assert.equal(findings[0].page,4);assert.equal(findings[0].role,'short');assert.equal(findings[0].reference.widthMm,50);
 assert.deepEqual(project,before);
});
