import test from 'node:test';import assert from 'node:assert/strict';
import {currentEditorialContext,exactField} from '../scripts/booklet/editorial-context.mjs';
import {summarizeAttemptEvents} from '../scripts/booklet/semantic-run-metrics.mjs';

test('prompt context emits the final parent once including later nested targets and retains every decision',()=>{
 const packet={sections:[{id:'s',blocks:[{id:'b',content:{id:'q',answer:{short:'final',worked:'Current method'}}}]}]};
 const patch=(targetId,field,corrected)=>({scope:'author',page:1,targetId,field,corrected});
 const corrections=[{id:'old',status:'approved',reason:'First revision',patches:[patch('s','/blocks',[{id:'old-snapshot'}])]},
  {id:'new',status:'approved',reason:'Replacement',patches:[patch('s','/blocks',[{id:'new-snapshot'}])]},
  {id:'answer',status:'approved',reason:'Correct arithmetic',patches:[patch('q','/answer/short','final')]},
  {id:'other',status:'approved',reason:'Other page',patches:[{...patch('q','/answer/short','secret'),page:9}]}];
 const before=JSON.stringify(corrections),result=currentEditorialContext(corrections,2,[1],()=>packet);
 assert.equal(result.currentValues.length,1);assert.deepEqual(result.currentValues[0].value,packet.sections[0].blocks);
 assert.deepEqual(result.currentValues[0].correctionIds,['old','new','answer']);assert.equal(result.corrections.length,3);
 const leaf=result.corrections[2].patches[0];assert.equal(leaf.within,'/0/content/answer/short');
 assert.equal(exactField(result.currentValues[0].value,leaf.within),'final');
 assert.doesNotMatch(JSON.stringify(result),/old-snapshot|new-snapshot|secret/);assert.equal(JSON.stringify(corrections),before);
});
test('context retains independent fields, escaped pointers, explicit supersession and inventory references',()=>{
 const packet={entries:[{id:'i',description:'Current','a/b':{'~x':7}}]};
 const c=[{id:'c',status:'approved',reason:'Reviewed',patches:[{scope:'inventory',page:1,targetId:'i',field:'/description'},
  {scope:'inventory',page:1,targetId:'i',field:'/a~1b/~0x'},{scope:'inventory',page:1,targetId:'removed',field:'/description'}]}];
 const result=currentEditorialContext(c,2,[1],()=>packet);assert.equal(result.currentValues.length,2);assert.equal(result.currentValues[1].value,7);assert.equal(result.corrections[0].patches[2].superseded,true);
 assert.ok(currentEditorialContext(c,1,[],()=>assert.fail('Already materialized inventory read again')).corrections[0].patches.every(p=>p.appliedToInventory));
 assert.throws(()=>exactField({},'/__proto__/x'),/Unsafe/);assert.throws(()=>exactField({},'/bad~2'),/Invalid/);
 assert.throws(()=>currentEditorialContext(c,2,[1],()=>null),/Cannot resolve/);
});
test('local replays have no model calls, input characters or missing-usage penalty',()=>{
 const rows=[];for(const [id,metrics]of [['model',{usage:{input_tokens:100,cached_input_tokens:40,output_tokens:20},elapsedMs:10}],['replay',{externalModelCalls:0,usage:null,elapsedMs:0}],['unknown',null]]){
  rows.push({attemptId:id,event:'started',stage:'author',attempt:1,time:0,promptStats:{sections:{schema:50}}},{attemptId:id,event:'phase-started',phase:'generation',time:0},{attemptId:id,event:'phase-finished',phase:'generation',time:10,elapsedMs:10,metrics},{attemptId:id,event:'finished',time:10,ok:true});
 }
 const r=summarizeAttemptEvents(rows);assert.equal(r.attempts,3);assert.equal(r.generationAttempts,3);assert.equal(r.calls,2);assert.equal(r.localReplays,1);assert.equal(r.missingUsage,1);assert.equal(r.promptCharacters.schema,100);assert.equal(r.usage.input_tokens,100);assert.equal(r.completedAttemptActiveWallMs,10);
});
