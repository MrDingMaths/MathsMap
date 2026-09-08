import test from 'node:test';
import assert from 'node:assert/strict';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {resolveArrangement,applyArrangementContent} from '../src/lib/booklet-arrangement.js';

test('diagram drafts update code and supersede stored stretch and width without mutating the original',()=>{
 const block={id:'block',type:'question',content:{id:'q',prompt:'Plot',questionDiagrams:[{id:'graph',format:'tikz',code:'old',widthMm:95}]}};
 const {tree,entries}=resolveArrangement(block);
 const node=arrangementItems(tree.root).find(n=>n.ref==='graph');
 node.width=120;node.align='stretch';
 const result=applyArrangementContent(block,tree,node.id,entries.get('graph'),{...entries.get('graph').value,code:'new',widthMm:45});
 assert.equal(result.block.content.questionDiagrams[0].code,'new');
 assert.equal(result.block.content.questionDiagrams[0].widthMm,45);
 const updated=arrangementItems(result.tree.root).find(n=>n.ref==='graph');
 assert.equal(updated.width,45);assert.equal(updated.align,'start');
 assert.equal(node.width,120);assert.equal(block.content.questionDiagrams[0].code,'old');
});
