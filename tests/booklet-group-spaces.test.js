import test from 'node:test';
import assert from 'node:assert/strict';
import {setGroupAnswerSpaceHeight} from '../src/lib/booklet-arrangement.js';
import {group,item,arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
test('group space height updates nested spaces only and preserves undo snapshot',()=>{
 const tree={version:1,root:group('root',[group('selected',[item('a/space'),group('nested',[item('b/space'),item('text')])]),item('outside/space')])};
 const entries=new Map(['a/space','b/space','outside/space'].map(ref=>[ref,{kind:'space'}]));entries.set('text',{kind:'text'});
 for(const height of [0,25,180]){
  const result=setGroupAnswerSpaceHeight(tree,entries,'selected',height);
  assert.deepEqual(arrangementItems(result.root).map(n=>n.height),[height,height,undefined,undefined]);
 }
 assert.ok(arrangementItems(tree.root).every(n=>n.height===undefined));
 for(const height of [-1,181,NaN])assert.throws(()=>setGroupAnswerSpaceHeight(tree,entries,'selected',height));
});
