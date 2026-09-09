import test from 'node:test';
import assert from 'node:assert/strict';
import {createPaginationKey,createWorkYield,canKeepPageEditor} from '../src/lib/booklet-pagination-work.js';
import {fromSource} from '../public/libs/maths-editor/document-model.mjs';
import {contentTarget} from '../src/lib/booklet-document-controller.js';

test('cached content locations follow edits, moves and undo without retaining deleted or other-project nodes',()=>{
 const first={id:'cached-child',prompt:'first'},block={id:'cached-block',content:{children:[first]}},p={id:'book',sections:[{id:'s',blocks:[block]}]};
 assert.equal(contentTarget(p,first.id).node,first);
 const next=structuredClone(p);next.sections[0].blocks[0].content.children[0].prompt='edited';
 assert.equal(contentTarget(next,first.id).node.prompt,'edited');
 next.sections.unshift({id:'new-section',blocks:[]});assert.equal(contentTarget(next,first.id).section.id,'s');
 next.sections[1].blocks[0].content.children=[];assert.equal(contentTarget(next,first.id),undefined);
 assert.equal(contentTarget(p,first.id).node,first);
 assert.equal(contentTarget({id:'other',sections:[{id:'s',blocks:[{id:'different',content:{children:[{id:'different-child'}]}}]}]},first.id),undefined);
 assert.equal(contentTarget(p,''),undefined);
});

test('pagination invalidation ignores saved revisions but tracks content, layout, editions and mutable view options',()=>{
 const key=createPaginationKey(),p={id:'p',title:'Book',sections:[],topics:[],settings:{}},options={showTheorySolutions:false};
 const before=key(p,'student',options);assert.equal(key({...p,revision:2,updatedAt:'now',studio:{flags:[]}},'student',options),before);
 for(const changed of [{...p,title:'Other book'},{...p,sections:[...p.sections]},{...p,settings:{...p.settings}},{...p,topics:[]}])assert.notEqual(key(changed,'student',options),before);
 assert.notEqual(key(p,'worked',options),before);options.showTheorySolutions=true;assert.notEqual(key(p,'student',options),before);
});
test('cached pagination work yields once its time budget is used and resets after yielding',async()=>{
 let time=0,pauses=0;const work=createWorkYield({budgetMs:12,now:()=>time,pause:async()=>{pauses++;time+=50;}});
 for(let i=0;i<6;i++){time+=3;await work();}assert.equal(pauses,1);time+=6;await work();assert.equal(pauses,2);
});
test('editors stay mounted only when their complete editable fragment survives on the same page',()=>{
 const doc=fromSource('First\n\nSecond'),p={id:'page',blocks:[{id:'b',type:'rich-text',content:doc}]},session={rootId:'b',pointer:'/content',value:doc};
 assert.equal(canKeepPageEditor(session,p,{...p}),true);
 assert.equal(canKeepPageEditor(session,p,{...p,id:'elsewhere'}),false);
 assert.equal(canKeepPageEditor(session,p,{...p,blocks:[]}),false);
 assert.equal(canKeepPageEditor(session,p,{...p,blocks:[{...p.blocks[0],content:{...doc,blocks:doc.blocks.slice(0,1)}}]}),false);
 assert.equal(canKeepPageEditor({...session,fragmentIds:[doc.blocks[0].id]},p,p),true);
 assert.equal(canKeepPageEditor({...session,paragraphSlice:{start:0}},p,p),false);
 assert.equal(canKeepPageEditor(session,p,{...p,blocks:[{...p.blocks[0],content:{...doc,_bookletSlice:{start:0,end:10}}}]}),false);
});
