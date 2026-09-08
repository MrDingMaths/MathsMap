import test from 'node:test';
import assert from 'node:assert/strict';
import { createEditableProject, updateProjectSettings, updateProjectContent, moveProjectBlock } from '../src/lib/editable-booklet-model.js';
import { adoptHouseStyle, BOOKLET_HOUSE_STYLE, clozeWidthMm } from '../src/lib/booklet-house-style.js';
import { studioProject } from '../src/lib/booklet-review-model.js';
import { normaliseQuestion } from '../src/lib/practice-question-model.js';
import { fromSource } from '../src/lib/document-content.js';
const fixture=()=>studioProject(createEditableProject({id:'style',sections:[{id:'s',blocks:[{id:'a',type:'rich-text',content:fromSource('First $x$')},{id:'b',type:'rich-text',content:'Second'}]}]}));

test('style adoption is explicit and preserves custom local geometry',()=>{
 const original=fixture();assert.equal(original.settings.houseStyleVersion,undefined);
 original.sections[0].blocks[0].sourceAtom={id:'key',kind:'key-ideas'};
 original.sections[0].blocks[0].content.blocks[0].indent=7;
 const styled=adoptHouseStyle(original);
 assert.equal(styled.settings.houseStyleVersion,BOOKLET_HOUSE_STYLE.version);
 assert.equal(styled.sections[0].blocks[0].content.blocks[0].lineHeight,1.5);
 assert.equal(styled.sections[0].blocks[0].content.blocks[0].indent,7);
 assert.equal(original.settings.houseStyleVersion,undefined);
 assert.ok(clozeWidthMm('independent variable')>clozeWidthMm('x'));
 assert.equal(clozeWidthMm(''),24);
});

test('local layout and content edits preserve the original undo snapshot',()=>{
 const original=fixture(),saved=JSON.stringify(original);
 const next=updateProjectSettings(original,{layoutOverrides:{...original.settings.layoutOverrides,answerSpaces:{a:25}}});
 assert.equal(JSON.stringify(original),saved);
 assert.equal(next.sections,original.sections);
 const edited=updateProjectContent(original,'a','/content','Revised');
 assert.equal(edited.sections[0].blocks[1],original.sections[0].blocks[1]);
 assert.equal(JSON.stringify(original),saved);
});

test('representation slots and independent answers survive normalization',()=>{
 const q=normaliseQuestion({id:'q',content:{id:'root',prompt:'Question',layoutPreset:'pattern-top',representations:{pattern:'Pattern',table:fromSource('| x | 1 |\n|---|---|\n| y | |'),equation:'Equation',graph:'Graph',diagramSlots:{g:'graph'}},questionDiagrams:[{id:'g',format:'image',src:'/grid.png'}],afterDiagramPrompt:'Verify below',answer:{short:'y=2x',worked:'A complete solution'}}});
 assert.equal(q.content.layoutPreset,'pattern-top');
 assert.equal(q.content.representations.table.format,'maths-editor-document-v1');
 assert.equal(q.content.afterDiagramPrompt,'Verify below');
 assert.equal(q.content.answer.worked,'A complete solution');
 assert.equal(q.content.representations.equation,'Equation');
});

test('moving source groups keeps their related blocks together',()=>{
 const p=fixture();p.sections[0].blocks.push({id:'c',type:'rich-text',content:'Third'});
 p.sections[0].blocks[0].sourceAtom={id:'shared'};p.sections[0].blocks[1].sourceAtom={id:'shared'};
 const next=moveProjectBlock(p,'s','b',1);
 assert.deepEqual(next.sections[0].blocks.map(b=>b.id),['c','a','b']);
 assert.deepEqual(p.sections[0].blocks.map(b=>b.id),['a','b','c']);
});
