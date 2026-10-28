import test from 'node:test';
import assert from 'node:assert/strict';
import {locateBookletContent,replaceAtPath} from '../src/lib/booklet-content-index.js';
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
test('content lookups take the first pre-order match and skip source evidence',()=>{
 const project={id:'index-order',sections:[{id:'s1',blocks:[
  {id:'q1',type:'question',source:{id:'hidden'},content:{id:'q1-root',children:[{id:'dup',prompt:'first'},{id:'a'}]}},
  {id:'q2',type:'question',content:{id:'dup',prompt:'second'}}]},{id:'s2',blocks:[{id:'t',type:'rich-text'}]}]};
 assert.deepEqual(locateBookletContent(project,'dup').path,['sections',0,'blocks',0,'content','children',0]);
 assert.deepEqual(locateBookletContent(project,'t').path,['sections',1,'blocks',0]);
 assert.equal(locateBookletContent(project,'t').block.id,'t');
 assert.equal(locateBookletContent(project,'s2').block,null);
 assert.equal(locateBookletContent(project,'hidden'),null);
 assert.equal(locateBookletContent(project,'absent'),null);
});
test('content lookups follow moves and in-place changes after indexing',()=>{
 const block=id=>({id,type:'question',content:{id:id+'-root',children:[{id:id+'-a'}]}});
 const project={id:'index-moves',sections:[{id:'s',blocks:[block('x'),block('y')]}]};
 assert.equal(locateBookletContent(project,'y-a').block.id,'y');
 const moved={...project,sections:[{id:'s',blocks:[project.sections[0].blocks[1],project.sections[0].blocks[0]]}]};
 assert.deepEqual(locateBookletContent(moved,'y-a').path,['sections',0,'blocks',0,'content','children',0]);
 assert.equal(locateBookletContent(moved,'x-root').block.id,'x');
 // The same sections array changed in place: the stale index must not hide new content.
 moved.sections[0].blocks.push(block('z'));
 assert.equal(locateBookletContent(moved,'z-a').block.id,'z');
 moved.sections[0].blocks.shift();
 assert.equal(locateBookletContent(moved,'x-root').block.id,'x');
 assert.equal(locateBookletContent(moved,'y-a'),null);
});
