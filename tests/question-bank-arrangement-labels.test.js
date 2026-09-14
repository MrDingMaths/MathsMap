import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveArrangement,arrangementCatalog} from '../src/lib/booklet-arrangement.js';
import {group,item,arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
test('saved exercise-number slots resolve without inventing bank numbering',()=>{
 const block={id:'bank',type:'question',content:{id:'root',prompt:'Find the probability.',answer:{short:'0.5',worked:'Half the outcomes qualify.'}}};
 const stored={version:1,root:group('layout',[item('root/label'),item('root/prompt')])};
 const resolved=resolveArrangement(block,stored);
 assert.deepEqual(resolved.missing,[]);assert.equal(resolved.entries.get('root/label').value,'');
 assert.ok(!arrangementItems(arrangementCatalog(block).initial.root).some(n=>n.ref==='root/label'));
 const numbered=resolveArrangement(block,stored,{labels:{root:'7'}});
 assert.equal(numbered.entries.get('root/label').value,'7');
 const broken=resolveArrangement(block,{version:1,root:group('layout',[item('missing/prompt')])});
 assert.equal(broken.missing.length,1);
});
