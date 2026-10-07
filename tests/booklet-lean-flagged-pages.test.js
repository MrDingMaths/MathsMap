import test from 'node:test';
import assert from 'node:assert/strict';
import {visualPlan} from '../scripts/booklet/lean-review.mjs';
test('lean selection includes unresolved nested author flags in standalone and combined editions',()=>{
 const project={sections:[{id:'exercise',blocks:[1,2,3,4].map(n=>({id:'b'+n,type:'question',content:{id:'node'+n,type:'part'}}))}],studio:{flags:[{targetId:'node3',resolved:false},{targetId:'node2',resolved:true}]}};
 const pageHashes=[1,2,3,4].map(n=>({page:n,hash:'hash'+n,blocks:['b'+n],mode:'student'}));
 const report=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(edition=>[edition,{pdf:{path:edition+'.pdf'},pageHashes}]));
 const plan=visualPlan({project,report,state:{pages:{}}});
 assert.deepEqual(plan.student.pending.map(row=>row.page),[1,3,4]);
 assert.deepEqual(plan['with-short'].pending.map(row=>row.page),[1,3,4]);
});
