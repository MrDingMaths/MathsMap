import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';

const table=(id,border)=>({id,type:'table',...(border===undefined?{}:{border}),rows:[[{id:id+'-cell',type:'cell',blocks:[{id:id+'-text',type:'paragraph',inlines:[{type:'text',text:'1 cm³ = 1 mL'}]}]}]]});
test('numeric zero borders survive normalization, nested tables and editor/print rendering',()=>{
 const inner=table('equivalences',0),outer=table('panel',true);
 outer.rows[0][0].blocks=[inner];
 const doc={format:'maths-editor-document-v1',version:1,blocks:[outer,table('false',false),table('default'),table('one',1)]};
 const normalized=normalizeDocument(doc);
 assert.equal(normalized.blocks[0].rows[0][0].blocks[0].border,false);
 assert.deepEqual(normalized.blocks.map(t=>t.border),[true,false,true,true]);
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(normalized))),normalized,'save/reopen is stable');
 for(const editable of [false,true]){
  const html=renderDocument(doc,{editable});
  assert.match(html,/data-id="equivalences-cell"[^>]*border:0;/);
  assert.match(html,/data-id="false-cell"[^>]*border:0;/);
  assert.match(html,/data-id="panel-cell"[^>]*border:0\.26mm solid/);
  assert.match(html,/data-id="default-cell"[^>]*border:0\.26mm solid/);
 }
});

test('individual cell borders retain only meaningful heading and column rules through save/reopen',()=>{
 const t=table('frequency',false);t.borderColour='#000000';t.borderWidthMm=.3;
 const cell=t.rows[0][0];cell.borders={right:true,bottom:true,top:false,left:'invalid',unknown:true};
 const doc=normalizeDocument({blocks:[t]});
 assert.deepEqual(doc.blocks[0].rows[0][0].borders,{right:true,bottom:true,top:false});
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
 for(const editable of [false,true]){
  const html=renderDocument(doc,{editable});
  assert.match(html,/data-id="frequency-cell"[^>]*border:0;border-top:0;border-right:0\.3mm solid #000000;border-bottom:0\.3mm solid #000000;/);
  assert.doesNotMatch(html,/border-left:/);
 }
});
