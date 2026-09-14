import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderDocument,normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {normalizeArrangement,transformArrangement,findArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
import {flowEditionSections} from '../src/lib/booklet-flow.js';
const p=JSON.parse(fs.readFileSync('booklets/projects/probability-v1.json'));
test('layout borders are opt-in while cards and real tables retain their borders',()=>{
 const doc={blocks:[{id:'outer',type:'layout',arrangement:'parallel',slots:[{id:'slot',blocks:[{id:'cards',type:'layout',arrangement:'cards',slots:[{id:'m',blocks:[]}]}]}]},{id:'table',type:'table',border:false,rows:[[{id:'cell',blocks:[]}]]},{id:'values',type:'table',rows:[[{id:'value',blocks:[]}]]}]};
 const html=renderDocument(doc);assert.match(html,/data-id="outer"[^>]*border:0/);assert.match(html,/data-id="cards"[^>]*border:0/);assert.match(html,/data-slot="m"[^>]*border:.25mm solid #000000/);assert.match(html,/data-id="cell"[^>]*border:0/);assert.match(html,/data-id="value"[^>]*border:0.26mm solid #cccccc/);
 doc.blocks[0].border=true;assert.equal(normalizeDocument(doc).blocks[0].border,true);
});
test('minimum height resets to automatic and survives arrangement serialization',()=>{
 const before=p.settings.layoutOverrides.blockLayouts['p10-q2'].arrangement;
 const edited=transformArrangement(before,'properties','p10-q2-a:row',{minHeight:24});
 const cleared=transformArrangement(edited,'properties','p10-q2-a:row',{minHeight:0});
 assert.equal(findArrangement(normalizeArrangement(JSON.parse(JSON.stringify(cleared))).root,'p10-q2-a:row').minHeight,0);
 assert.equal(findArrangement(edited.root,'p10-q2-a:row').minHeight,24);
 for(const label of ['a','b','c'])assert.equal(findArrangement(before.root,`p10-q2-${label}:row`).minHeight??0,0);
});
test('Probability choices and paired spinners keep horizontal arrangements',()=>{
 const layouts=p.settings.layoutOverrides.blockLayouts;
 const choices=findArrangement(layouts['p15-q20'].arrangement.root,'p15-q20-choices-row');assert.equal(choices.direction,'row');assert.deepEqual(choices.children.map(n=>n.ref),['a','b','c','d'].map(l=>'p15-q20-spinner-'+l));
 const pair=findArrangement(layouts['p22-q5'].arrangement.root,'p22-q5-root:diagrams');assert.equal(pair.direction,'row');assert.equal(pair.children.length,2);
});
test('every active booklet exercise opening forces a question-side page boundary only',()=>{
 for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){const project=JSON.parse(fs.readFileSync('booklets/projects/'+file));for(const edition of ['student','with-short','with-worked','short','worked'])for(const section of flowEditionSections(project,edition)){if(section.mode==='student'&&section.blocks[0]?.flow.exerciseHeadingBefore)assert.equal(section.pageBreakBefore,true,file);else assert.equal(section.pageBreakBefore,project.sections.find(s=>s.id===section.sourceSectionId)?.pageBreakBefore);}}
});
