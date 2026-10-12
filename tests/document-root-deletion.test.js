import test from 'node:test';
import assert from 'node:assert/strict';
import {removeDocumentNode} from '../public/libs/maths-editor/document-operations.mjs';
import {normalizeDocument,paragraph} from '../public/libs/maths-editor/document-model.mjs';
test('Studio deletion of the last root paragraph reports empty content rather than recreating it',()=>{const doc=normalizeDocument({blocks:[paragraph()]});removeDocumentNode(doc,doc.blocks[0].id,{allowEmptyRoot:true});assert.deepEqual(normalizeDocument(doc).blocks,[]);});
test('deleting the last cell paragraph keeps a usable cell',()=>{const doc=normalizeDocument({blocks:[{id:'table',type:'table',rows:[[{id:'cell',type:'cell',blocks:[paragraph()]}]]}]});removeDocumentNode(doc,doc.blocks[0].rows[0][0].blocks[0].id);assert.equal(doc.blocks[0].rows[0][0].blocks.length,1);});
