import test from 'node:test';
import assert from 'node:assert/strict';
import {fragmentQuestion,fragmentLayouts,questionSplitGroups} from '../src/lib/booklet-pagination.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';

test('paired teaching rows follow their response through safe question fragments',()=>{
 const paragraph=id=>({id,type:'paragraph',inlines:[{type:'text',text:id}]});
 const block={id:'b',type:'question',content:{id:'q',prompt:{format:'maths-editor-document-v1',version:1,blocks:[paragraph('demo-a'),paragraph('demo-b')]},children:['a','b'].map(id=>({id,type:'part',prompt:'Your turn '+id,answerSpaceMm:40}))}};
 block.pedagogyRole='example';
 block.sourceReview={responses:[{targetId:'demo-a',kind:'none'},{targetId:'demo-b',kind:'none'},{targetId:'a',kind:'working'},{targetId:'b',kind:'working'}]};
 const item=ref=>({id:'item-'+ref,type:'item',ref});
 const arrangement={version:1,root:{id:'root',type:'group',direction:'stack',children:['a','b'].map(id=>({id:'pair-'+id,type:'group',direction:'row',keepTogether:true,children:[item('q/prompt#demo-'+id),item(id+'/prompt'),item(id+'/space')]}))}};
 const layouts={b:{arrangement}},groups=questionSplitGroups(block,layouts);
 assert.equal(groups.length,2);
 for(let index=0;index<2;index++){
  const fragment=fragmentQuestion(block,[groups[index]],index),projected=fragmentLayouts([fragment],layouts).b.arrangement;
  assert.deepEqual(projected.root.children.map(row=>row.id),['pair-'+['a','b'][index]]);
  assert.deepEqual(arrangementItems(projected.root).map(n=>n.ref),['q/prompt#demo-'+['a','b'][index],['a','b'][index]+'/prompt',['a','b'][index]+'/space']);
 }
 assert.deepEqual(fragmentLayouts([block],layouts).b.arrangement,arrangement);
 const unpaired=structuredClone(layouts);unpaired.b.arrangement.root.children.forEach(row=>delete row.keepTogether);
 assert.equal(fragmentLayouts([fragmentQuestion(block,[groups[0]],0)],unpaired).b.arrangement.root.children.length,2,'Unflagged shared content retains its existing projection');
});
