import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {fromSource} from '../src/lib/document-content.js';
import {group,item,arrangementItems,normalizeArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
import {fragmentLayouts} from '../src/lib/booklet-pagination.js';

const fixture=()=>({id:'b',type:'question',content:{id:'q',prompt:fromSource('First paragraph.\n\nSecond paragraph.')}});
const saved=children=>({version:1,root:group('custom',children,'row')});
const refs=result=>arrangementItems(result.tree.root).map(n=>n.ref);

test('whole native fields project every paragraph and table into the original sized slot',()=>{
 const block=fixture();block.content.prompt.blocks.push({id:'table',type:'table',rows:[[{id:'cell',blocks:fromSource('A cell').blocks}]]});
 const slot={...item('q/prompt'),width:65,weight:3,before:4,after:5,minHeight:12,align:'center',verticalAlign:'middle',keepTogether:false};
 const stored=saved([slot,item('q/space')]),before=structuredClone(stored);
 const result=resolveArrangement(block,stored),wrapper=result.tree.root.children[0];
 assert.deepEqual(result.missing,[]);
 assert.deepEqual(refs(result),[...block.content.prompt.blocks.map(n=>'q/prompt#'+n.id),'q/space']);
 for(const key of ['id','width','weight','before','after','minHeight','align','verticalAlign','keepTogether'])assert.equal(wrapper[key],slot[key],key);
 assert.equal(wrapper.direction,'stack');assert.equal(wrapper.gap,0);
 assert.ok(wrapper.children.every(n=>n.before==null&&n.after==null&&n.width==null));
 assert.equal(result.entries.get(wrapper.children[0].ref).editorKey,'q/prompt');
 assert.deepEqual(stored,before);
 const reopened=JSON.parse(JSON.stringify({block,arrangement:result.tree}));
 assert.deepEqual(resolveArrangement(reopened.block,reopened.arrangement).tree,result.tree);
});

test('explicit native blocks keep their locations without duplicate whole-field rendering',()=>{
 const block=fixture(),[first,second]=block.content.prompt.blocks.map(n=>'q/prompt#'+n.id);
 const explicit={...item(second),width:32,after:7};
 const result=resolveArrangement(block,saved([item('q/prompt'),explicit]));
 assert.deepEqual(refs(result),[first,second]);
 assert.deepEqual(result.tree.root.children[1],normalizeArrangement(saved([explicit])).root.children[0]);
 assert.deepEqual(refs(resolveArrangement(block,saved([item(first),item('q/prompt'),explicit]))),[first,second]);
 assert.deepEqual(refs(resolveArrangement(block,saved([item(second)]))),[second],'Deliberate field omissions remain omitted');
});

test('empty and continuation whole fields collapse while unknown references remain reported',()=>{
 const block=fixture();block.content.prompt=fromSource('');
 const result=resolveArrangement(block,saved([group('blank',[{...item('q/prompt'),after:15}]),item('unknown/prompt')]));
 assert.deepEqual(refs(result),['unknown/prompt']);assert.equal(result.missing.length,1);
 const continuation=fixture();continuation.flow={fragment:1,hideRepeatedStem:true};
 assert.deepEqual(refs(resolveArrangement(continuation,saved([item('q/prompt'),item('q/space')]))),['q/space']);
});

test('native teaching solutions preserve hideable roles and distinct editor keys',()=>{
 const block={id:'teaching',type:'worked-example',examples:[{id:'example',prompt:'Calculate.',theorySolution:fromSource('First step.\n\nSecond step.')} ]};
 const result=resolveArrangement(block,saved([item('example/prompt'),item('example/theorySolution')]));
 const solutions=arrangementItems(result.tree.root).map(n=>result.entries.get(n.ref)).filter(e=>e.role==='solution');
 assert.equal(solutions.length,2);assert.ok(solutions.every(e=>e.kind==='document'));
 assert.equal(new Set(solutions.map(e=>e.editorKey)).size,2);
 assert.equal(solutions[0].editorKey,'example/theorySolution');
 assert.deepEqual(result.missing,[]);
});

test('pagination projects whole native fields before pruning absent fragment content',()=>{
 const block=fixture(),stored=saved([item('q/prompt'),item('removed-part/prompt')]);
 const layouts={b:{arrangement:stored}},before=structuredClone(layouts);
 const projected=fragmentLayouts([block],layouts);
 const result=resolveArrangement(block,projected.b.arrangement);
 assert.deepEqual(refs(result),block.content.prompt.blocks.map(n=>'q/prompt#'+n.id));
 assert.deepEqual(result.missing,[]);
 assert.deepEqual(layouts,before);
 assert.deepEqual(fragmentLayouts([block],projected).b.arrangement,result.tree);
});
