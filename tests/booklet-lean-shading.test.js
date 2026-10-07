import test from 'node:test';
import assert from 'node:assert/strict';
import {shadingCandidates} from '../src/lib/diagram-shading.js';
import {leanShadingIssues,recordLeanShading,assertTeachingPreviewProject} from '../scripts/booklet/lean-shading.mjs';
import {shadingContextHash} from '../scripts/booklet/check-diagram-shading.mjs';
const fixture=()=>{const code='\\begin{tikzpicture}\\fill[black] (0,0) circle (1pt);\\end{tikzpicture}';return {code,sourceHash:'code-hash',contextHash:'context-hash',occurrence:'book.json#/sections/0/blocks/0/diagram@0',candidates:shadingCandidates(code)};};
const result=row=>({reviews:[{occurrence:row.occurrence,sourceHash:row.sourceHash,contextHash:row.contextHash,outcome:'accepted',evidence:'Inspected student PDF page3 at final size',decisions:row.candidates.map(c=>({index:c.index,purpose:'structural',reason:'Small point marker identifies the triangle vertex; it is not a shaded surface.'}))}]});

test('teaching preview can reveal answers but cannot substitute changed content, geometry or revision',()=>{
 const project={id:'book',revision:3,settings:{flowEdition:'with-short',showIdentifyAnswers:false},sections:[{blocks:[{id:'q',diagram:{code:'original',widthMm:70}}]}]};
 const preview=structuredClone(project);Object.assign(preview.settings,{flowEdition:'student',showIdentifyAnswers:true});assertTeachingPreviewProject(project,preview);
 for(const mutate of [p=>p.revision++,p=>p.sections[0].blocks[0].diagram.code='changed',p=>p.sections[0].blocks[0].diagram.widthMm=100,p=>p.settings.compactAnswers={shortFontPt:8}]){const changed=structuredClone(preview);mutate(changed);assert.throws(()=>assertTeachingPreviewProject(project,changed));}
});
test('lean fill reviews bind actual source, context, occurrence and every paint operation',()=>{
 const row=fixture(),state={};assert.equal(recordLeanShading([row],result(row),state).length,0);assert.deepEqual(leanShadingIssues([row],state),[]);
 for(const changed of [{...row,sourceHash:'edited-code'},{...row,contextHash:'edited-context'},{...row,occurrence:'another-occurrence'}])assert(leanShadingIssues([changed],state).length);
});
test('bounded teaching previews retain exact complete blocks and source order',()=>{
 const project={id:'book',revision:3,settings:{},sections:[{id:'s1',title:'One',blocks:[{id:'a',diagram:{code:'a'}},{id:'b',diagram:{code:'b'}}]},{id:'s2',title:'Two',blocks:[{id:'c',diagram:{code:'c'}}]}]};
 const preview=structuredClone(project);preview.sections=preview.sections.slice(0,1);preview.sections[0].blocks=preview.sections[0].blocks.slice(1);preview.settings.showGuidedPracticeAnswers=true;
 assert.doesNotThrow(()=>assertTeachingPreviewProject(project,preview));
 for(const mutate of [p=>p.sections[0].blocks[0].diagram.code='changed',p=>p.sections[0].title='changed',p=>p.sections[0].blocks.push(p.sections[0].blocks[0]),p=>p.sections[0].blocks[0].id='missing',p=>p.sections=[]]){const changed=structuredClone(preview);mutate(changed);assert.throws(()=>assertTeachingPreviewProject(project,changed));}
 const reversed=structuredClone(project);reversed.sections[0].blocks.reverse();assert.throws(()=>assertTeachingPreviewProject(project,reversed));
});
test('missing paint decisions, unreviewed clarity and stale reviewer results cannot establish fill acceptance',()=>{
 const row=fixture();
 for(const mutate of [r=>r.reviews[0].sourceHash='stale',r=>r.reviews[0].contextHash='stale',r=>r.reviews[0].decisions=[],r=>r.reviews[0].decisions[0].purpose='clarity',r=>r.reviews[0].evidence='']){
  const state={},r=result(row);mutate(r);assert(recordLeanShading([row],r,state).length);assert(leanShadingIssues([row],state).length);
 }
});
test('retained-image review requires final-size evidence and exact asset, context and occurrence binding',()=>{
 const row={image:'/booklet-assets/error.png',sourceHash:'image-hash',contextHash:'question-hash',occurrence:'book.json#/image@0',candidates:[]};
 const reply={reviews:[{occurrence:row.occurrence,sourceHash:row.sourceHash,contextHash:row.contextHash,outcome:'accepted',reason:'The question asks students to explain the original handwritten error; its source-visible lines and error marker remain legible.',evidence:'Inspected student PDF page 12 against source page 36',decisions:[]}]};
 const state={};assert.deepEqual(recordLeanShading([row],reply,state),[]);assert.deepEqual(leanShadingIssues([row],state),[]);
 for(const changed of [{...row,sourceHash:'new-bytes'},{...row,contextHash:'new-question'},{...row,occurrence:'another-image'},{...row,sourceHash:null}])assert(leanShadingIssues([changed],state).length);
 for(const change of [r=>r.reviews[0].evidence='',r=>r.reviews[0].reason='',r=>r.reviews[0].outcome='needs-change']){const next=structuredClone(reply),empty={};change(next);assert(recordLeanShading([row],next,empty).length);assert(leanShadingIssues([row],empty).length);}
});
test('retained-image crop and physical size edits invalidate their image-purpose context',()=>{
 const image={format:'image',src:'/sample.png',widthMm:168,sourceRegion:{x:0,y:55,width:1088,height:466,sourceWidth:1088,sourceHeight:521}},project={image};
 const before=shadingContextHash(project,'/image');
 assert.notEqual(shadingContextHash({image:{...image,widthMm:100}},'/image'),before);
 assert.notEqual(shadingContextHash({image:{...image,sourceRegion:{...image.sourceRegion,y:100,height:421}}},'/image'),before);
});
