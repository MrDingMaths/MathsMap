import test from 'node:test';
import assert from 'node:assert/strict';
import {reconstructionHazards} from '../scripts/booklet/source-fidelity.mjs';
test('coordinate lists and empty worked fields cannot stand in for sketches',()=>{
 const pages=[{pageNumber:9,blocks:[{id:'q10',responseKind:'graph',prompt:'Plot K',answer:{short:'K(1/3,5)',worked:'',solutionDiagrams:[]}}]}];
 assert.deepEqual(reconstructionHazards(pages).map(f=>f.code),['missing-worked-answer','missing-sketch']);
 pages[0].blocks[0].answer.worked={format:'maths-editor-document-v1',blocks:[]};
 assert.deepEqual(reconstructionHazards(pages).map(f=>f.code),['missing-worked-answer','missing-sketch']);
 pages[0].blocks[0].sharedSolutionDiagrams=[{id:'plot',format:'tikz',code:'source-checked plot'}];
 assert.deepEqual(reconstructionHazards(pages),[]);
});
test('one source occurrence has one rendered owner, while evidence stays available',()=>{
 const blocks=[{id:'text',sourceOccurrenceId:'p7-q4',content:'Plot the points'},{id:'image',sourceOccurrenceId:'p7-q4',format:'image',retentionReason:'Unresolved source evidence'}];
 assert.equal(reconstructionHazards([{pageNumber:7,blocks}])[0].code,'duplicate-occurrence');
 blocks[1].usage='evidence-only';assert.deepEqual(reconstructionHazards([{pageNumber:7,blocks}]),[]);
});
test('raw LaTeX in subtitles is caught without rejecting maths spans',()=>{
 const page={pageNumber:30,blocks:[{id:'heading',title:'Read m \\quad from the table'}]};
 assert.equal(reconstructionHazards([page])[0].code,'raw-latex');page.blocks[0].title='Read $m\\quad c$';assert.deepEqual(reconstructionHazards([page]),[]);
});
