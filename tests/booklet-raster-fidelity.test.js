import test from 'node:test';
import assert from 'node:assert/strict';
import {activeRasterOccurrences,rasterReviewKey,inspectPresentationFidelity} from '../src/lib/booklet-presentation-verification.js';
const fixture=()=>({settings:{teachingPresentationVersion:1},source:{inventory:{}},sections:[{phase:'practice',blocks:[{id:'q',type:'question',content:{id:'root',prompt:{blocks:[{id:'p',type:'paragraph',inlines:[{type:'inline-image',src:'/formula.png'}]}]},sourceLayoutEvidence:{original:{format:'image',src:'/evidence.png'}}},sourceReview:{}}]}]});
test('acceptance checks rich-text raster occurrences but excludes original evidence',async()=>{
 const p=fixture(),b=p.sections[0].blocks[0];assert.equal(activeRasterOccurrences(b).length,1);
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unreviewed-raster-exception'));
 const occurrence=activeRasterOccurrences(b)[0];b.sourceReview.rasterExceptions=[{path:occurrence.path,kind:'illustration',checked:true,reason:'Character portrait beside the statement.',evidence:'Source p3 and final-size render p2 reviewed.',signature:await rasterReviewKey(occurrence)}];
 assert.ok(!(await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unreviewed-raster-exception'));
 occurrence.node.src='/replacement.png';assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unreviewed-raster-exception'));
});
test('a retention label cannot excuse an identified editable equation',async()=>{
 const p=fixture(),b=p.sections[0].blocks[0];b.content.mathematicalExpression='x^2';
 const occurrence=activeRasterOccurrences(b)[0];b.sourceReview.rasterExceptions=[{path:occurrence.path,kind:'illustration',checked:true,reason:'Preserves appearance.',evidence:'review.png',signature:await rasterReviewKey(occurrence)}];
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='rasterised-editable-maths'));
});
test('raster review also applies to older books, but original graph evidence is not rendered content',async()=>{
 const p=fixture();delete p.settings.teachingPresentationVersion;delete p.source;
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unreviewed-raster-exception'));
 const b=p.sections[0].blocks[0];b.content={questionDiagrams:[{format:'tikz',code:'native graph',spec:{originalGraph:{format:'image',src:'/source.png'}}}]};
 assert.equal(activeRasterOccurrences(b).length,0);assert.equal((await inspectPresentationFidelity(p)).complete,true);
});
