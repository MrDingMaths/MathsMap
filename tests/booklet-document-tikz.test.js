import test from 'node:test';
import assert from 'node:assert/strict';
import {documentTikzEntries,mountDocumentTikz} from '../src/lib/document-tikz.js';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {arrangementCatalog} from '../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
const paragraph={id:'interval-graph',type:'paragraph',inlines:[{type:'text',text:'[tikz]% mathsmap-inline-width-mm 65\n\\begin{tikzpicture}\\draw (0,0)--(1,0);\\end{tikzpicture}[/tikz]'}]};
test('native continuation table remains visible while its repeated instruction is hidden',()=>{
 const block={id:'q',type:'question',flow:{fragment:1,hideRepeatedStem:true,tableOnly:true,tableContinuation:{tableId:'table'}},content:{id:'root',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'instruction',type:'paragraph',inlines:[{type:'text',text:'Complete the table.'}]},{id:'table',type:'table',rows:[[{blocks:[paragraph]}]]}]},children:[]}};
 const catalog=arrangementCatalog(block);
 assert.ok(catalog.entries.has('root/prompt#table'));
 assert.ok(!catalog.entries.has('root/prompt#instruction'));
 assert.ok(arrangementItems(catalog.initial.root).some(item=>item.ref==='root/prompt#table'));
 const ordinary=arrangementCatalog({...block,flow:{fragment:1,hideRepeatedStem:true}});
 assert.ok(!ordinary.entries.has('root/prompt#table'));
});
test('table-cell TikZ retains editable source and identity through document normalization',()=>{
 const doc=normalizeDocument({blocks:[{id:'table',type:'table',rows:[[{id:'cell',blocks:[paragraph]}]]}]});
 assert.deepEqual(documentTikzEntries(doc).map(({id,widthMm})=>({id,widthMm})),[{id:'interval-graph',widthMm:65}]);
 assert.match(renderDocument(doc),/data-id="interval-graph"/);
 assert.deepEqual(normalizeDocument(doc),doc);
 assert.deepEqual(documentTikzEntries({blocks:[{...paragraph,inlines:[{type:'text',text:'Instruction [tikz]code[/tikz]'}]}]}),[]);
 assert.deepEqual(documentTikzEntries({blocks:[{...paragraph,inlines:[{type:'text',text:'[tikz]unterminated'}]}]}),[]);
});
test('table-only presentation retains answer ownership and leaves default arrangements unchanged',()=>{
 const block={id:'q',type:'question',content:{id:'root',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{blocks:[paragraph]}]]}]},children:[{id:'a',type:'part',label:'a',prompt:'',responseSpace:'scaffold',answer:{short:'[0,1]',worked:'Both ends are included.'}}]}};
 const regular=arrangementItems(arrangementCatalog(block).initial.root).map(item=>item.ref);
 assert.ok(regular.includes('a/label'));
 const tableOnly=arrangementCatalog({...block,flow:{tableOnly:true}});
 assert.ok(!arrangementItems(tableOnly.initial.root).some(item=>item.ref==='a/label'));
 assert.equal(tableOnly.entries.get('a/answer/short').value,'[0,1]');
 assert.deepEqual(arrangementItems(arrangementCatalog({...block,flow:{}}).initial.root).map(item=>item.ref),regular);
});
