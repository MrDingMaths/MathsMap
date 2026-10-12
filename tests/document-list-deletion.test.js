import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {removeDocumentNode} from '../public/libs/maths-editor/document-operations.mjs';

const paragraph=(id,text)=>({id,type:'paragraph',inlines:[{type:'text',text}]});
const item=(id,text)=>({id,type:'list-item',blocks:[paragraph(id+'-text',text)]});
for(const ordered of [false,true])test(`delete a ${ordered?'numbered':'bulleted'} item without losing sibling content`,()=>{
 const doc=normalizeDocument({blocks:[{id:'list',type:'list',ordered,start:3,items:[item('a','First'),item('b','Second'),item('c','Third')]}]});
 const siblings=structuredClone([doc.blocks[0].items[0],doc.blocks[0].items[2]]);
 assert.equal(removeDocumentNode(doc,'b'),'c');
 assert.deepEqual(doc.blocks[0].items,siblings);
 for(const editable of [true,false]){const html=renderDocument(doc,{editable});assert.equal((html.match(/<li\b/g)||[]).length,2);assert.ok(!html.includes('Second'));}
});
test('last list item removes its list and preserves surrounding content',()=>{
 const doc=normalizeDocument({blocks:[paragraph('intro','Keep'),{id:'list',type:'list',items:[item('a','Remove')]}]});
 removeDocumentNode(doc,'a');assert.deepEqual(doc.blocks.map(b=>b.id),['intro']);
});
test('last nested item removes only its nested list',()=>{
 const doc=normalizeDocument({blocks:[{id:'outer',type:'list',items:[{...item('a','Keep'),blocks:[paragraph('keep','Keep'),{id:'inner',type:'list',items:[item('b','Remove')]}]}]}]});
 removeDocumentNode(doc,'b');assert.deepEqual(doc.blocks[0].items[0].blocks.map(b=>b.id),['keep']);
});
test('last root item supports Studio empty-document deletion and standalone caret fallback',()=>{
 for(const allowEmptyRoot of [true,false]){const doc=normalizeDocument({blocks:[{id:'list',type:'list',items:[item('a','Remove')]}]});removeDocumentNode(doc,'a',{allowEmptyRoot});assert.equal(doc.blocks.length,allowEmptyRoot?0:1);if(!allowEmptyRoot)assert.equal(doc.blocks[0].type,'paragraph');}
});
