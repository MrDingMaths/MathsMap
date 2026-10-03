import test from 'node:test';
import assert from 'node:assert/strict';
import {createAssignmentPlan} from '../scripts/booklet/author-assignments.mjs';

test('difficulty-kind categories keep independent complete questions within assignment limits',()=>{
 for(const kind of ['foundation','development','mastery','difficulty category','difficulty-category','practice category','practice-category','challenge']){
  const questions=Array.from({length:4},(_,i)=>({id:`q${i}`,kind:'question',description:`Question ${i}`,parentId:'difficulty'}));
  const header=kind==='challenge'?'Challenge Exercise':/category/.test(kind)?'MASTERY':kind.toUpperCase();
  const inventory={pageNumber:15,entries:[{id:'difficulty',kind:'teaching',description:kind==='challenge'?'FOUNDATION':header},...questions],groups:[{id:'difficulty-group',kind,header,members:questions.map(q=>q.id)}]};
  const original=structuredClone(inventory),plan=createAssignmentPlan([inventory],{maxQuestions:2});
  assert.deepEqual(plan.assignments.map(a=>a.questions),[2,2]);
  assert.ok(plan.assignments[0].inventoryIds.includes('difficulty'));
  assert.ok(plan.assignments.every(a=>!a.oversized));
  assert.deepEqual(inventory,original);
  if(kind!=='practice-category'){
   inventory.groups[0].indivisible=true;
   assert.equal(createAssignmentPlan([inventory],{maxQuestions:2}).assignments[0].questions,4);
  }
 }
});

test('a numbered question remains indivisible when its group kind names a difficulty',()=>{
 const inventory={pageNumber:15,entries:[{id:'q',kind:'question',description:'Shared instruction'},{id:'a',kind:'part',parentId:'q',description:'First part'},{id:'b',kind:'part',parentId:'q',description:'Second part'}],groups:[{id:'q',kind:'foundation',header:'FOUNDATION',members:['a','b']}]};
 const plan=createAssignmentPlan([inventory],{maxQuestions:1,maxCharacters:1});
 assert.equal(plan.assignments.length,1);
 assert.deepEqual(plan.assignments[0].inventoryIds,['q','a','b']);
});

test('a late-listed heading binds to the unique explicitly named category first question',()=>{
 const inventory={pageNumber:35,entries:[{id:'q1',kind:'question',description:'Convert to decimal hours.'},{id:'q2',kind:'question',description:'Convert to hours, minutes and seconds.'},{id:'foundation',kind:'teaching',description:'FOUNDATION'}],groups:[{id:'foundation-group',kind:'foundation',header:'FOUNDATION',members:['q1','q2']}]};
 const original=structuredClone(inventory),plan=createAssignmentPlan([inventory],{maxQuestions:1});
 assert.deepEqual(plan.assignments.map(a=>a.inventoryIds),[['q1','foundation'],['q2']]);
 assert.deepEqual(inventory,original);
 inventory.groups.push({id:'other-foundation',kind:'foundation',header:'FOUNDATION',members:['q2']});
 assert.throws(()=>createAssignmentPlan([inventory]),/explicit first question/);
});

test('an explicitly parented answer continuation stays with its question and leaves later practice separate',()=>{
 const first={pageNumber:54,entries:[{id:'q2',kind:'question',description:'Combined movers.'}]},next={pageNumber:55,entries:[{id:'q2-answer',kind:'answer',parentId:'q2',description:'Supplied2hours44minutes.'},{id:'q3',kind:'question',description:'Two taps.'}]};
 const continuation={from:54,to:55,entryIds:['q2','q2-answer']},original=structuredClone([first,next]),plan=createAssignmentPlan([first,next],{maxQuestions:1,continuations:[continuation]});
 assert.deepEqual(plan.assignments.map(a=>a.inventoryIds),[['q2','q2-answer'],['q3']]);
 assert.equal(plan.assignments[0].questions,1);
 assert.deepEqual(plan.assignments[0].continuations,[continuation]);
 assert.deepEqual([first,next],original);
 next.entries[0].parentId='another-question';
 assert.throws(()=>createAssignmentPlan([first,next],{continuations:[continuation]}),/Missing shared\/continuation inventory dependency|question on every linked page/);
});
