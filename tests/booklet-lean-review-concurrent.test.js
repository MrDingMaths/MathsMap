import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadReviewed,saveReviewed,recoverVisualCallResults} from '../scripts/booklet/lean-review.mjs';

test('independent saves retain visual, shading and newer values in the same bucket',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-review-'));
 try{
  const initial=loadReviewed(dir);initial.pages.old={outcome:'needs-change'};saveReviewed(dir,initial);
  const visual=loadReviewed(dir),shading=loadReviewed(dir);
  visual.pages.old={outcome:'accepted'};visual.pages.new={outcome:'accepted'};saveReviewed(dir,visual);
  shading.shading.marker={status:'accepted'};saveReviewed(dir,shading);
  const final=loadReviewed(dir);
  assert.equal(final.pages.old.outcome,'accepted');assert.equal(final.pages.new.outcome,'accepted');assert.equal(final.shading.marker.status,'accepted');
  visual.pages.tail={outcome:'accepted'};saveReviewed(dir,visual);
  assert.equal(loadReviewed(dir).shading.marker.status,'accepted');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('recovery restores actual outcomes against the original current PDF batch',()=>{
 const plan={student:{pending:[{page:2,hash:'pdf-page',blocks:['question'],image:'page.png'}]}},report={student:{pageHashes:[{hash:'cover'},{hash:'pdf-page'}]}},state={pages:{},shading:{marker:{status:'accepted'}}};
 const calls=[{name:'visual-200-0',result:{pages:[{page:2,outcome:'needs-change',finding:'Label crosses a segment.'}]}}];
 assert.equal(recoverVisualCallResults({plan,report,calls,state,notBefore:100}),1);
 assert.equal(state.pages['student:pdf-page'].outcome,'needs-change');assert.equal(state.shading.marker.status,'accepted');
 assert.throws(()=>recoverVisualCallResults({plan,report:{student:{pageHashes:[{hash:'cover'},{hash:'changed'}]}},calls,state}),/stale PDF/);
 assert.throws(()=>recoverVisualCallResults({plan,report,calls:[{name:'visual-200-0',result:{pages:[{page:1,outcome:'accepted'}]}}],state}),/original batch/);
 assert.equal(recoverVisualCallResults({plan,report,calls,state,notBefore:300}),0);
});
