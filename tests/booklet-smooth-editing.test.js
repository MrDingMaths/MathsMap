import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,fromSource,renderDocument,paragraph} from '../public/libs/maths-editor/document-model.mjs';
import {locateDocumentNode,removeDocumentNode,transformDocumentLayout} from '../public/libs/maths-editor/document-operations.mjs';
import {hasVisibleContent} from '../src/lib/document-content.js';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {bookletLayoutSelection,applyBookletLayout} from '../src/lib/booklet-direct-layout.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
const p=(id,text=id)=>({...paragraph([{type:'text',text,marks:[]}]),id});
const nested=()=>normalizeDocument({blocks:[{id:'layout',type:'layout',columns:2,slots:[{id:'left',blocks:[p('a'),p('b')]},{id:'right',blocks:[{id:'table',type:'table',rows:[[{id:'cell',blocks:[p('cell-p')]}]]}]}]},p('last')]});
test('intentional blank lines survive normalization and rendering; placeholders collapse',()=>{
 const blank=normalizeDocument({blocks:[{...p('blank',''),preserveEmpty:true}]}),placeholder=fromSource('');
 assert.equal(hasVisibleContent(blank),true);assert.equal(hasVisibleContent(placeholder),false);assert.match(renderDocument(blank),/data-preserve-empty="true"/);
 const block={id:'theory',type:'callout',content:blank};assert.equal(resolveArrangement(block).entries.size,1);
});
test('nested deletion removes only selected content, keeping editable containers',()=>{
 const doc=nested();removeDocumentNode(doc,'a');assert.ok(!locateDocumentNode(doc,'a'));assert.ok(locateDocumentNode(doc,'b'));
 removeDocumentNode(doc,'cell-p');assert.equal(locateDocumentNode(doc,'cell').node.blocks.length,1);assert.ok(!locateDocumentNode(doc,'cell').node.blocks[0].preserveEmpty);
 removeDocumentNode(doc,'table');assert.ok(!locateDocumentNode(doc,'table'));assert.ok(locateDocumentNode(doc,'last'));assert.doesNotThrow(()=>normalizeDocument(doc));
});
test('nested reposition, grouping and ungrouping retain every content ID once',()=>{
 const doc=nested();transformDocumentLayout(doc,'b','before');assert.deepEqual(locateDocumentNode(doc,'left').node.blocks.map(n=>n.id),['b','a']);
 const group=transformDocumentLayout(doc,'a','group',{ids:['a','b']});transformDocumentLayout(doc,group,'direction',{value:'row'});assert.equal(locateDocumentNode(doc,group).node.columns,2);
 transformDocumentLayout(doc,group,'ungroup');assert.deepEqual(locateDocumentNode(doc,'left').node.blocks.map(n=>n.id),['b','a']);
 transformDocumentLayout(doc,'a','full-width');assert.deepEqual(doc.blocks.map(n=>n.id),['layout','a','last']);assert.doesNotThrow(()=>normalizeDocument(doc));
});
test('native image/text side-by-side placement retains column alignment after normalization',()=>{
 const doc=normalizeDocument({blocks:[p('text'),p('picture')]});transformDocumentLayout(doc,'picture','move',{targetId:'text',position:'right'});transformDocumentLayout(doc,'picture','vertical',{value:'middle'});
 const saved=normalizeDocument(doc);assert.equal(saved.blocks[0].slots[1].verticalAlign,'middle');assert.match(renderDocument(saved),/align-self:center/);
 assert.throws(()=>transformDocumentLayout(doc,doc.blocks[0].id,'move',{targetId:'picture'}),/outside/);
});
test('direct teaching arrangements reorder and align without changing content or existing layout',()=>{
 const project=createEditableProject({id:'direct',title:'Direct',sections:[{id:'s',title:'Theory',blocks:[{id:'b',type:'callout',content:normalizeDocument({blocks:[p('one'),p('two')]})}]}]});
 const initial=resolveArrangement(project.sections[0].blocks[0]),items=arrangementItems(initial.tree.root),sel={blockId:'b',id:items[1].id};
 const beside=applyBookletLayout(project,sel,'beside',{targetId:items[0].id,side:'right'}),middle=applyBookletLayout(beside,sel,'properties',{verticalAlign:'middle'});
 assert.deepEqual(middle.sections,project.sections);assert.equal(bookletLayoutSelection(middle,sel).verticalAlign,'middle');assert.equal(arrangementItems(bookletLayoutSelection(middle,sel).tree.root).length,2);
 const removed=applyBookletLayout(middle,sel,'delete');assert.equal(removed.sections[0].blocks[0].content.blocks.length,1);assert.equal(removed.sections[0].blocks[0].content.blocks[0].id,'one');
});

test('native moves enter a group and promote an inline image without cloning identities',()=>{
 const doc=normalizeDocument({blocks:[{...p('prose'),inlines:[{type:'text',text:'Before '},{id:'photo',type:'inline-image',src:'/example.png',width:30},{type:'text',text:' after'}]},{id:'target',type:'layout',columns:1,slots:[{id:'slot',blocks:[p('destination')]}]}]});
 transformDocumentLayout(doc,'photo','move',{targetId:'target',position:'inside'});
 assert.equal(locateDocumentNode(doc,'slot').node.blocks.at(-1).id,'photo');
 assert.equal(locateDocumentNode(doc,'photo').node.type,'image');
 assert.equal(locateDocumentNode(doc,'prose').node.inlines[0].text,'Before ');
 assert.doesNotThrow(()=>normalizeDocument(doc));
});
