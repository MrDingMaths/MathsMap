import test from 'node:test';
import assert from 'node:assert/strict';
import {workflowForPages,materializeCorrections} from '../scripts/booklet/workflow-review.mjs';

test('representative assembly scopes a cross-page correction bundle without weakening stale-target checks',()=>{
 const state={corrections:[{id:'units',status:'approved',patches:[
  {scope:'inventory',page:2,targetId:'p2-units',field:'/description',original:'cm2',corrected:'cm3'},
  {scope:'inventory',page:19,targetId:'p19-units',field:'/description',original:'cm2',corrected:'cm3'},
 ]}]};
 const original=structuredClone(state);
 const partial={sections:[],source:{inventory:{entries:[{id:'p2-units',description:'cm2'}]}}};
 assert.throws(()=>materializeCorrections(partial,state,'project'),/Missing correction target p19-units/);
 const scoped=workflowForPages(state,[2]);
 assert.equal(materializeCorrections(partial,scoped,'project').source.inventory.entries[0].description,'cm3');
 assert.deepEqual(state,original);
 assert.deepEqual(workflowForPages(state,[2,19]),state);
 partial.source.inventory.entries[0].description='concurrent edit';
 assert.throws(()=>materializeCorrections(partial,scoped,'project'),/Stale correction/);
});

test('assembly does not replay earlier author patches over their later corrected value',()=>{
 const state={corrections:[{id:'first',status:'approved',patches:[{scope:'author',page:3,targetId:'diagram',field:'/code',original:'A',corrected:'B'}]},{id:'second',status:'approved',patches:[{scope:'author',page:3,targetId:'diagram',field:'/code',original:'B',corrected:'C'}]},{id:'project',status:'approved',patches:[{scope:'project',page:3,targetId:'diagram',field:'/code',original:'C',corrected:'D'}]}]};
 for(const correction of state.corrections){correction.reason='Reviewed representation correction';correction.sourceRefs=[{pageNumber:3}];}
 const packet={sections:[{blocks:[{id:'diagram',type:'diagram',code:'A'}]}]};
 const effective=materializeCorrections(packet,state,'author',3);
 assert.equal(effective.sections[0].blocks[0].code,'C');
 const project=materializeCorrections(effective,workflowForPages(state,[3],['project']),'project');
 assert.equal(project.sections[0].blocks[0].code,'D');
 packet.sections[0].blocks[0].code='unreviewed edit';
 assert.throws(()=>materializeCorrections(packet,state,'author',3),/Stale correction/);
});
