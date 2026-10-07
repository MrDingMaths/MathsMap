import test from 'node:test';
import assert from 'node:assert/strict';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {printableProject} from '../src/lib/booklet-review-profile.js';

const fixture=()=>({id:'scaffold-book',source:{reviewProfile:'textbook-three-pass-v1'},sections:[{phase:'practice',blocks:[{
 id:'table-question',type:'question',content:{id:'root',type:'group',prompt:'Complete the table.',children:[{id:'response',type:'part',responseSpace:'scaffold',answer:{short:'2',worked:'4 / 2 = 2'}}]},
 sourceReview:{responses:[{targetId:'response',kind:'cloze',label:'a'}]}
}]}]});

test('binding existing table responses keeps accepted printable hashes in every edition',()=>{
 const before=fixture(),after=structuredClone(before);
 after.sections[0].blocks[0].sourceReview.responses[0].scaffoldTargetId='native-table';
 assert.equal(projectReviewHash(after),projectReviewHash(before));
 for(const edition of ['student','short','worked','with-short','with-worked'])assert.deepEqual(printableProject(after,edition),printableProject(before,edition));
});

test('response presentation and actual answers still invalidate printable hashes',()=>{
 const before=fixture();
 for(const [field,value] of [['targetId','another-response'],['kind','working'],['label','b']]){
  const changed=structuredClone(before);changed.sections[0].blocks[0].sourceReview.responses[0][field]=value;
  assert.notEqual(projectReviewHash(changed),projectReviewHash(before),field);
 }
 const changed=structuredClone(before);changed.sections[0].blocks[0].content.children[0].answer.short='3';
 assert.notEqual(projectReviewHash(changed),projectReviewHash(before));
});
