import test from 'node:test';
import assert from 'node:assert/strict';
import {shadingCandidates} from '../src/lib/diagram-shading.js';
import {leanShadingIssues,recordLeanShading} from '../scripts/booklet/lean-shading.mjs';
const fixture=()=>{const code='\\begin{tikzpicture}\\fill[black] (0,0) circle (1pt);\\end{tikzpicture}';return {code,sourceHash:'code-hash',contextHash:'context-hash',occurrence:'book.json#/sections/0/blocks/0/diagram@0',candidates:shadingCandidates(code)};};
const result=row=>({reviews:[{occurrence:row.occurrence,sourceHash:row.sourceHash,contextHash:row.contextHash,outcome:'accepted',evidence:'Inspected student PDF page3 at final size',decisions:row.candidates.map(c=>({index:c.index,purpose:'structural',reason:'Small point marker identifies the triangle vertex; it is not a shaded surface.'}))}]});
test('lean fill reviews bind actual source, context, occurrence and every paint operation',()=>{
 const row=fixture(),state={};assert.equal(recordLeanShading([row],result(row),state).length,0);assert.deepEqual(leanShadingIssues([row],state),[]);
 for(const changed of [{...row,sourceHash:'edited-code'},{...row,contextHash:'edited-context'},{...row,occurrence:'another-occurrence'}])assert(leanShadingIssues([changed],state).length);
});
test('missing paint decisions, unreviewed clarity and stale reviewer results cannot establish fill acceptance',()=>{
 const row=fixture();
 for(const mutate of [r=>r.reviews[0].sourceHash='stale',r=>r.reviews[0].contextHash='stale',r=>r.reviews[0].decisions=[],r=>r.reviews[0].decisions[0].purpose='clarity',r=>r.reviews[0].evidence='']){
  const state={},r=result(row);mutate(r);assert(recordLeanShading([row],r,state).length);assert(leanShadingIssues([row],state).length);
 }
});
