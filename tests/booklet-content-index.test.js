import test from 'node:test';
import assert from 'node:assert/strict';
import {replaceAtPath} from '../src/lib/booklet-content-index.js';
import {updateProjectContent} from '../src/lib/editable-booklet-model.js';

test('list parts without columns can switch to a grid and back immutably',()=>{
 const content={id:'q-root',type:'question',layout:'list',children:[{id:'a',prompt:'2, 3 and 5'}]};
 const project={id:'p',sections:[{id:'s',blocks:[{id:'q',type:'question',content}]}]};
 const grid=updateProjectContent(updateProjectContent(project,'q-root','/layout','grid'),'q-root','/columns',2);
 assert.equal(grid.sections[0].blocks[0].content.columns,2);
 assert.equal(grid.sections[0].blocks[0].content.layout,'grid');
 assert.equal(content.layout,'list');assert.equal(Object.hasOwn(content,'columns'),false);
 assert.equal(grid.sections[0].blocks[0].content.children,content.children);
 const list=updateProjectContent(updateProjectContent(grid,'q-root','/layout','list'),'q-root','/columns',null);
 assert.equal(list.sections[0].blocks[0].content.columns,null);
});
test('optional terminal fields never create missing ancestors or array entries',()=>{
 assert.deepEqual(replaceAtPath({a:{}},['a','columns'],2),{a:{columns:2}});
 for(const path of [['missing','columns'],['a','missing','columns'],['items',1],['items','bad'],['items','length'],['items',-1],['items','01'],['a','__proto__']])
  assert.throws(()=>replaceAtPath({a:{},items:[{}]},path,2));
 assert.throws(()=>replaceAtPath({a:null},['a','columns'],2));
});
