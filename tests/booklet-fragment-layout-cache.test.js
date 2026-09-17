import test from 'node:test';import assert from 'node:assert/strict';
import {arrangementCatalog} from '../src/lib/booklet-arrangement.js';
import {fragmentLayouts,fragmentQuestion} from '../src/lib/booklet-pagination.js';
test('fragment layouts are recalculated when pagination extends the same page array',()=>{
 const block={id:'q',type:'question',content:{id:'root',type:'question',prompt:'Solve.',children:['a','b'].map(id=>({id,type:'part',label:id,prompt:'$x=1$',answerSpaceMm:20,answer:{short:'1',worked:'$x=1$'}}))}};
 const layouts={q:{arrangement:arrangementCatalog(block).initial}},blocks=[];
 const empty=fragmentLayouts(blocks,layouts);
 const first=fragmentQuestion(block,[{parentId:'root',ids:['a']}]);blocks.push(first);
 const current=fragmentLayouts(blocks,layouts);
 assert.notEqual(current,empty);
 assert.ok(!JSON.stringify(current.q.arrangement).includes('b/prompt'));
 assert.equal(fragmentLayouts(blocks,layouts),current);
 blocks[0]=fragmentQuestion(block,[{parentId:'root',ids:['b']}],1);
 const replaced=fragmentLayouts(blocks,layouts);
 assert.ok(!JSON.stringify(replaced.q.arrangement).includes('a/prompt'));
 assert.ok(JSON.stringify(replaced.q.arrangement).includes('b/prompt'));
});
