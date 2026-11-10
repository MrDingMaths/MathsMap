import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {arrangementSolutionHidden} from '../src/lib/booklet-answer-options.js';

const doc=(...ids)=>({format:'maths-editor-document-v1',version:1,blocks:ids.map(id=>({id,type:'paragraph',lineHeight:1.4,inlines:[{type:'text',text:id,colour:'#268cff'}]}))});
const block=own=>({id:'b',type:'worked-example',presentation:{layout:'columns',columns:1},examples:[{id:'e',label:'',prompt:doc('q'),theorySolution:doc('w'),...(own?{solutionOwnStyle:true}:{})}]});

// Working moved out of the prompt (10 November 2026) keeps the prompt's formatting but still hides
// with "Show theory solutions".
test('solutionOwnStyle marks theorySolution entries, which stay solutions', () => {
  for(const own of [false,true]){
    const entry=[...resolveArrangement(block(own),null,{}).entries.values()].find(e=>e.field==='theorySolution');
    assert.equal(entry.role,'solution');
    assert.equal(!!entry.ownStyle,own);
    assert.equal(arrangementSolutionHidden(entry,false),true);
  }
});
