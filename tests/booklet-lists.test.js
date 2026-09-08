import test from 'node:test';
import assert from 'node:assert/strict';
import {fromSource,toSource,normalizeDocument,renderDocument,freshDocument,visitDocument} from '../public/libs/maths-editor/document-model.mjs';
import {groupTextBlocks} from '../src/lib/inline-content.js';
test('numbered lists retain starts, skipped numbers, nested bullets and maths',()=>{
 const source='3. **First** $x$\n   - Detail\n5. Second\n6. Third\n5. Repeated';
 const doc=fromSource(source),list=doc.blocks[0];
 assert.equal(list.ordered,true);assert.equal(list.start,3);assert.equal(list.items[1].value,5);
 assert.equal(list.items[0].blocks[1].ordered,false);
 assert.match(renderDocument(doc),/<ol[^>]*start="3"/);assert.match(renderDocument(doc),/<li value="5"/);
 assert.equal(toSource(doc),source.replace('   -','  -'));
 assert.equal(fromSource('1.5 is a decimal').blocks[0].type,'paragraph');
 assert.equal(groupTextBlocks('1) First\n2) Second')[0].list.ordered,true);
});

test('bullet source becomes nested semantic lists and preserves maths, marks and surrounding prose',()=>{
 const doc=fromSource('Heading\n• **First** $x+1$\n  - Nested $-2$\n• Second\n\nAfter');
 assert.deepEqual(doc.blocks.map(b=>b.type),['paragraph','list','paragraph']);
 const list=doc.blocks[1];assert.equal(list.indent,7);assert.equal(list.items.length,2);
 assert.equal(list.items[0].blocks[1].type,'list');
 assert.equal(list.items[0].blocks[0].inlines[0].marks[0],'bold');
 assert.ok(list.items[0].blocks[0].inlines.some(n=>n.latex==='x+1'));
 const html=renderDocument(doc);assert.equal((html.match(/<ul /g)??[]).length,2);assert.equal((html.match(/<li /g)??[]).length,3);
 assert.match(html,/padding-left:7mm;list-style-position:outside/);
 assert.equal(fromSource(toSource(doc)).blocks[1].items[0].blocks[1].type,'list');
 assert.deepEqual(normalizeDocument(doc),doc);
});
test('list IDs are traversed and renewed for rich paste',()=>{
 const doc=fromSource('- One\n  - Two\n- Three'),original=[],copied=[];
 visitDocument(doc,n=>original.push(n.id));visitDocument(freshDocument(doc),n=>copied.push(n.id));
 assert.equal(new Set(copied).size,copied.length);assert.equal(original.length,copied.length);assert.ok(copied.every(id=>!original.includes(id)));
});
test('legacy preview shares the list parser without treating mathematical negatives as bullets',()=>{
 const blocks=groupTextBlocks('Intro\n- First\n  continued text\n- Second\n\n$-3$\n$-4$');
 assert.equal(blocks[1].kind,'list');assert.equal(blocks[1].list.items.length,2);
 assert.match(toSource({blocks:[blocks[1].list]}),/continued text/);
 assert.equal(groupTextBlocks('$-3$')[0].kind,'line');
 assert.equal(fromSource('-3 is negative').blocks[0].type,'paragraph');
});
