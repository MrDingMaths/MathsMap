import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {renderDocument,normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {hasTablePartLabel} from '../public/libs/maths-editor/table-part-label.mjs';
import {repairIntegersFeedback,walk} from '../scripts/booklet/repair-integers-feedback-20261002.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';

const paragraph={id:'p',type:'paragraph',inlines:[{type:'text',text:'a',marks:['bold']},{type:'text',text:' '},{type:'math',latex:'5-2'}]};
const table=(border=false)=>({format:'maths-editor-document-v1',version:1,blocks:[{id:'t',type:'table',border,rows:[[{id:'c',type:'cell',align:'left',blocks:[structuredClone(paragraph),{id:'cloze',type:'paragraph',inlines:[{type:'cloze',answer:'less',width:22}]}]}]]}]});
test('table part gutters render centrally without changing editable text',()=>{
 const doc=normalizeDocument(table()),snapshot=JSON.stringify(doc);
 for(const editable of [false,true])assert.match(renderDocument(doc,{editable}),/data-table-part-label style="display:inline-block;min-width:6mm"/);
 assert.equal(JSON.stringify(doc),snapshot);
 assert.doesNotMatch(renderDocument({format:doc.format,blocks:[paragraph]}),/data-table-part-label/);
 assert.equal(hasTablePartLabel({...paragraph,inlines:[{type:'math',latex:'a'},...paragraph.inlines.slice(1)]}),false);
});
test('nested borderless table clozes retain baseline leaders and meaningful table suppression',()=>{
 const html=renderDocument(table());assert.match(html,/--document-cloze-bottom:-.3mm/);assert.doesNotMatch(html,/cloze-bottom:.5em/);
 assert.match(renderDocument(table(true)),/--document-cloze-dots:var\(--document-table-cloze-dots,none\)/);
 const nested=table(),inner=table();walk(inner,n=>{if(n.id)n.id+='-inner';});nested.blocks[0].rows[0][0].blocks.push(...inner.blocks);
 assert.doesNotMatch(renderDocument(nested),/cloze-bottom:.5em/);
});
test('scoped integer repairs preserve all mathematical answers and source inventory',()=>{
 const original=JSON.parse(fs.readFileSync('booklets/projects/computation-with-integers-v1.json'));
 const answers=p=>{const found=[];walk(p.sections,n=>{if(n.answer&&typeof n.answer==='object')found.push({id:n.id,answer:n.answer});});return found;};
 const next=repairIntegersFeedback(original);
 assert.deepEqual(answers(next),answers(original));assert.deepEqual(next.source,original.source);
 const blocks=next.sections.flatMap(s=>s.blocks),find=id=>blocks.find(b=>b.id===id);
 assert.deepEqual(find('p50-q15').content.children.map(n=>n.label),['a','b']);
 assert.ok(find('p56-q11-block').content.children.every(p=>p.prompt.blocks.length===1));
 for(const id of ['p57-q14','p56-q11-block']){
  const resolved=resolveArrangement(find(id),next.settings.layoutOverrides.blockLayouts[id].arrangement,next.settings.layoutOverrides);
  assert.equal(resolved.missing.length,0);
 }
 const thirds=find('p57-q14').content.children.filter(n=>['c','f','i'].includes(n.label));
 assert.ok(thirds.every(n=>!n.prompt.blocks[0].inlines[0].latex.includes('aligned')));
 assert.ok(find('p12-q3-block').content.children.every(n=>n.prompt.blocks[0].widthMm===100));
});
