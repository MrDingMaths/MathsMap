import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePacketGeometry} from '../scripts/booklet/workflow-review.mjs';
import {triangleConstruction} from '../scripts/booklet/triangle-constraints.mjs';

const exact=value=>({value,exact:true});
const model={type:'triangle',sides:{b:exact(5),c:exact(5)},angles:{A:exact(100)}};
const entry={id:'external-proof',kind:'diagram',mathematicalModel:model,exclusionReason:'External teaching proof; practice-only reference.'};
const packet=()=>({sections:[],inventoryMappings:[]});

test('an explicitly excluded teaching triangle requires no authored practice diagram',()=>{
 assert.deepEqual(validatePacketGeometry({entries:[entry]},packet()),[]);
 for(const exclusionReason of [undefined,'','   '])assert.throws(()=>validatePacketGeometry({entries:[{...entry,exclusionReason}]},packet()),/Triangle has no authored mapping/);
});

test('an authored triangle mapping still receives numerical validation despite an exclusion label',()=>{
 const make=geometry=>({sections:[{blocks:[{id:'diagram',code:triangleConstruction(geometry).coordinates}]}],inventoryMappings:[{inventoryId:entry.id,targetId:'diagram'}]});
 const result=validatePacketGeometry({entries:[entry]},make(model));
 assert.equal(result.length,1);assert.equal(result[0].checked,true);
 assert.throws(()=>validatePacketGeometry({entries:[entry]},make({...model,angles:{A:exact(80)}})),/authored .*80.*required 100/);
 const missing=make(model);missing.sections=[];
 assert.throws(()=>validatePacketGeometry({entries:[entry]},missing),/Triangle needs native code/);
});
