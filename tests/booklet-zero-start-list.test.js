import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,renderDocument,fromSource} from '../public/libs/maths-editor/document-model.mjs';
test('numbered source rules retain a zero start through normalization, save/reopen and printing',()=>{
 const document=normalizeDocument({blocks:[{id:'rules',type:'list',ordered:true,start:0,items:[{id:'rule-zero',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Preparation'}]}]},{id:'rule-one',blocks:[{type:'paragraph',inlines:[{type:'text',text:'First step'}]}]}]}]});
 assert.equal(document.blocks[0].start,0);
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(document))),document);
 assert.match(renderDocument(document),/<ol[^>]*start="0"/);
 assert.equal(fromSource('0. Preparation\n1. First step').blocks[0].start,0);
 assert.equal(normalizeDocument({blocks:[{type:'list',ordered:true,items:[]}]}).blocks[0].start,1);
});
