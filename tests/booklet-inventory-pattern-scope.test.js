import test from 'node:test';
import assert from 'node:assert/strict';
import {materializeCorrections,registerInventory} from '../scripts/booklet/workflow-review.mjs';

test('reviewed reference-only patterns remain evidence without becoming authoring gates',()=>{
 const original=[{id:'practice',description:'Question and parts'},{id:'example',description:'Excluded worked example'}];
 const corrected=original.map(p=>p.id==='example'?{...p,exclusionReason:'Standalone teaching is reference evidence only.'}:p);
 const inventory={pageNumber:30,entries:[],layoutPatterns:original};
 const state={pages:{},issues:{},corrections:[{status:'approved',patches:[{scope:'inventory',page:30,targetId:'$inventory',field:'/layoutPatterns',original,corrected}]}]};
 const effective=materializeCorrections(inventory,state,'inventory',30);
 assert.deepEqual(inventory.layoutPatterns,original);
 assert.deepEqual(effective.layoutPatterns,corrected);
 registerInventory(state,effective,'source-hash');
 assert.deepEqual(state.pages[30].patterns,[original[0]]);
 const project={source:{inventory:{pages:[inventory]}}};
 assert.deepEqual(materializeCorrections(project,state,'project').source.inventory.pages[0].layoutPatterns,corrected);
 const edited=structuredClone(inventory);edited.layoutPatterns[0].description='Local change';
 assert.throws(()=>materializeCorrections(edited,state,'inventory',30),/Stale correction/);
 state.corrections[0].patches[0].field='/entries';
 assert.throws(()=>materializeCorrections(inventory,state,'inventory',30),/only support layoutPatterns/);
});
