import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {shadingCandidates,inspectShadingReview} from '../src/lib/diagram-shading.js';
import {migrateDiagramShading} from '../scripts/booklet/normalise-diagram-shading.mjs';
import {inventoryShading,auditShading,shadingContextHash} from '../scripts/booklet/check-diagram-shading.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const source=String.raw`\begin{tikzpicture}
\fill[blue] (0,0)--(1,0)--(1,1)--cycle;
\fill[white] (0,0) rectangle (.2,.2);
\fill[black] (O) circle (1.3pt);
\draw[dashed] (O)--(A);
\path (A) node {$5\text{ cm}$};
\end{tikzpicture}`;
test('changing a native document prompt invalidates the retained fill purpose',()=>{
 const q={prompt:{format:'maths-editor-document-v1',blocks:[{type:'paragraph',text:'Find the shaded area.'}]},questionDiagrams:[{code:source}]};
 const before=shadingContextHash(q,'/questionDiagrams/0/code');q.prompt.blocks[0].text='Find the perimeter.';
 assert.notEqual(shadingContextHash(q,'/questionDiagrams/0/code'),before);
});
test('paint inventory includes fills, masks and markers but ignores comments and plain outlines',()=>{
 assert.equal(shadingCandidates(source).length,3);
 assert.equal(shadingCandidates('% \\fill[blue] (0,0) circle (1);\n\\draw (0,0)--(1,1);').length,0);
 assert.equal(shadingCandidates(String.raw`\draw[dash pattern=on 2pt off 2pt] (0,0)--(1,1);`).length,0);
 for(const s of [String.raw`\path[fill] (0,0) circle (1);`,String.raw`\tikzset{face/.style={fill}}`,String.raw`\path[top color=blue,bottom color=white] (0,0) rectangle (1,1);`])assert.ok(shadingCandidates(s).length,s);
 for(const s of [String.raw`\shade[ball color=blue] (0,0) circle (1);`,String.raw`\path[pattern=north east lines] (0,0) rectangle (1,1);`,String.raw`\tikzset{face/.style={fill=blue}}`,String.raw`\pic[fill=blue] {angle=A--B--C};`])assert.ok(shadingCandidates(s).length,s);
});
test('source, occurrence and full purpose evidence are required; clarity cannot be inferred',()=>{
 const occurrence='project#/diagram/code@0',sourceHash=hash(source);
 const review={sourceHash,status:'accepted',evidence:'Reviewed printed diagram',occurrences:[occurrence],decisions:shadingCandidates(source).map(o=>({index:o.index,purpose:'mathematical',reason:'Selected base identifies the area A used in V = Ah.'}))};
 assert.deepEqual(inspectShadingReview(source,sourceHash,review,occurrence),[]);
 assert.equal(inspectShadingReview(source,sourceHash,null,occurrence).length,1);
 assert.equal(inspectShadingReview(source+' ',hash(source+' '),review,occurrence).length,1);
 assert.equal(inspectShadingReview(source,sourceHash,review,'other').length,1);
 assert.equal(inspectShadingReview(source,sourceHash,review,occurrence,'changed-question').length,1);
 assert.deepEqual(inspectShadingReview(source,sourceHash,{...review,contextHashes:{[occurrence]:'question'}},occurrence,'question'),[]);
 assert.equal(inspectShadingReview(source,sourceHash,{...review,decisions:[]},occurrence).length,1);
 const clarity=structuredClone(review);clarity.decisions[0]={index:review.decisions[0].index,purpose:'clarity',reason:'Separates the cavity from the cut rim.'};
 assert.equal(inspectShadingReview(source,sourceHash,clarity,occurrence).length,1);
 clarity.decisions[0].comparison='Outline-only comparison at 45 mm showed the rim/cavity boundary was ambiguous.';
 assert.deepEqual(inspectShadingReview(source,sourceHash,clarity,occurrence),[]);
 review.decisions[0].reason='solid shading';assert.equal(inspectShadingReview(source,sourceHash,review,occurrence).length,1);
});
test('exact reviewed edits preserve masks, markers, edges, labels, local layout and evidence; repeat is inert',()=>{
 const after=source.replace('\\fill[blue]','\\path[fill=none]');
 const changes={[hash(source)]:{status:'accepted',before:source,after,afterHash:hash(after),reason:'Decorative face fill removed.'}};
 const value={id:'p',settings:{pageWidth:210},sections:[{blocks:[{id:'q',content:{id:'node',widthMm:43,code:source,answer:{worked:'[tikz]'+source+'[/tikz]'},spec:{originalDiagram:{code:source}},sourceReview:{source}}}]}]};
 const {next,records}=migrateDiagramShading(value,changes);assert.equal(records.length,2);
 assert.equal(next.sections[0].blocks[0].content.widthMm,43);assert.deepEqual(next.settings,value.settings);
 assert.equal(next.sections[0].blocks[0].content.spec.originalDiagram.code,source);
 assert.equal(next.sections[0].blocks[0].content.sourceReview.source,source);
 for(const marker of ['\\fill[white]','\\fill[black]','\\draw[dashed]','5\\text{ cm}'])assert.ok(next.sections[0].blocks[0].content.code.includes(marker));
 assert.deepEqual(migrateDiagramShading(next,changes),{next,records:[]});
 assert.throws(()=>migrateDiagramShading(value,{[hash(source)]:{...changes[hash(source)],afterHash:'stale'}}),/Invalid reviewed/);
 assert.equal(migrateDiagramShading({...value,code:source+' '},changes).next.code,source+' ');
});
test('native image replacements preserve source assets and local widths',()=>{
 const replacement={status:'accepted',code:source,afterHash:hash(source),reason:'Outline replaces decorative whole-region shading.'};
 const node={id:'image',format:'image',src:'/source.png',widthMm:60,alt:'Coordinate figure'};
 const {next}=migrateDiagramShading(node,{}, {'/source.png':replacement});
 assert.equal(next.format,'tikz');assert.equal(next.widthMm,60);assert.equal(next.src,node.src);assert.deepEqual(next.spec.originalDiagram,node);
 assert.deepEqual(migrateDiagramShading(next,{}, {'/source.png':replacement}),{next,records:[]});
});
test('every current booklet and bank paint occurrence has current reviewed evidence',()=>{
 const register=JSON.parse(fs.readFileSync('booklets/provenance/diagram-shading-2026-09-12.json','utf8'));
 assert.deepEqual(auditShading(inventoryShading(),register),[]);
});
