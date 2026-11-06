import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {teachingLabels,labelledTeachingQuestion} from '../src/lib/booklet-labels.js';
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {fragmentQuestion} from '../src/lib/booklet-pagination.js';
import {cleanReviewPrompt} from '../scripts/booklet/normalise-review-prompts.mjs';
import {loadWholeProject} from './helpers/split-projects.js';
const review=(id,group='review')=>({id,type:'question',sourceOrder:17,sourceAtom:{id:group,kind:'review'},content:{id:id+'-root',label:'19',prompt:'Recall the rule',children:[{id:id+'-a',label:'a',prompt:'First'},{id:id+'-b',label:'b',prompt:'Second'}]}});
test('Review numbers restart per group and preserve subparts and stored identities',()=>{
 const blocks=[review('one'),review('two'),review('three','other')],before=structuredClone(blocks),labels=teachingLabels(blocks);
 assert.deepEqual(labels,{'one-root':'1','two-root':'2','three-root':'1'});
 for(const b of blocks){const result=resolveArrangement(b,null,{labels});assert.equal(result.entries.get(b.content.id+'/label').value,labels[b.content.id]);assert.equal(result.entries.get(b.id+'-a/label').value,'a');}
 assert.equal(labelledTeachingQuestion(blocks[1],labels).sourceOrder,2);assert.deepEqual(blocks,before);
});
test('saved unnumbered arrangements acquire a Review number and retain geometry',()=>{
 const b=review('one'),saved=arrangementCatalog(b).initial;saved.root.children=saved.root.children.filter(n=>n.ref!=='one-root/label');saved.root.gap=4;
 const result=resolveArrangement(b,saved);assert.equal(result.missing.length,0);assert.equal(result.tree.root.gap,4);assert.equal(result.tree.root.children[0].ref,'one-root/label');assert.equal(result.entries.get('one-root/label').value,'1');
 assert.ok(!saved.root.children.some(n=>n.ref==='one-root/label'));
});
test('pagination and source continuations retain their original Review number',()=>{
 const b=review('one'),second=review('two'),continued={...review('continued'),flow:{continuationOf:'one'}};
 const fragment=fragmentQuestion(b,[{parentId:'one-root',ids:['one-b']}],1);
 const labels=teachingLabels([b,fragment,continued,second]);assert.equal(labels['continued-root'],'1');assert.equal(labels['two-root'],'2');
 assert.equal(resolveArrangement(fragment,null,{labels}).entries.get('one-root/label').value,'1');
});
test('checkbox cleanup preserves maths, rich-text styles and writing boxes',()=>{
 assert.equal(cleanReviewPrompt('☐ Find $x$. Keep $\\boxed{2}$.'),'Find $x$. Keep $\\boxed{2}$.');
 const value={format:'maths-editor-document-v1',blocks:[{id:'p',type:'paragraph',align:'left',inlines:[{type:'text',text:'☐ Recall',marks:['bold']},{type:'math',latex:'x^2'}]}]};
 const result=cleanReviewPrompt(value);assert.equal(result.blocks[0].inlines[0].text,'Recall');assert.equal(value.blocks[0].inlines[0].text,'☐ Recall');assert.deepEqual(result.blocks[0].inlines[1],value.blocks[0].inlines[1]);
});
