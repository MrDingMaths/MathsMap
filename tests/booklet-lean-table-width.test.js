import test from 'node:test';
import assert from 'node:assert/strict';
import {contentHash,sameReviewedContent,retainLoggedTableLayoutReviews} from '../scripts/booklet/lean-review.mjs';

const original=()=>({id:'q',type:'question',content:{id:'root',type:'question',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',widthMm:100,widths:[30,70],rows:[[{id:'label',type:'cell',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Part-time work'}]}]},{id:'value',type:'cell',blocks:[{type:'paragraph',inlines:[{type:'text',text:'439'}]}]}]]}]},answer:{short:'439',worked:'The incorrect copied value is 439.'}}});
const project=block=>({sections:[{phase:'practice',blocks:[block]}]});
test('guarded table-width changes retain mathematics but never changed cells or answers',()=>{
 const before=original(),after=structuredClone(before);after.content.prompt.blocks[0].widths=[40,60];
 const review={outcome:'passed',hash:contentHash(before),note:'Independent content review'};
 const state={questions:{q:structuredClone(review)}};
 const patch={status:'applied',blockId:'q',targetId:'table',field:'/widths',original:[30,70],corrected:[40,60]};
 assert.equal(sameReviewedContent(before,after),true);
 assert.equal(retainLoggedTableLayoutReviews(project(after),state,[patch]),1);
 assert.equal(state.questions.q.hash,contentHash(after));
 assert.equal(state.questions.q.note,review.note);
 for(const edit of [b=>b.content.answer.short='440',b=>b.content.prompt.blocks[0].rows[0][1].blocks[0].inlines[0].text='440']){
  const changed=structuredClone(after);edit(changed);
  assert.equal(retainLoggedTableLayoutReviews(project(changed),{questions:{q:structuredClone(review)}},[patch]),0);
 }
 assert.equal(retainLoggedTableLayoutReviews(project(after),{questions:{q:structuredClone(review)}},[]),0);
 assert.equal(retainLoggedTableLayoutReviews(project(after),{questions:{q:structuredClone(review)}},[{...patch,corrected:[45,55]}]),0);
});
