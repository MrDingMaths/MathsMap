import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {rgbPng,ensureSelectedPdfRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {rasterEvidence,retainPixelReviews,visualOutcomeReader} from '../scripts/booklet/lean-visual-evidence.mjs';
import {recordVisualResult} from '../scripts/booklet/lean-review.mjs';
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('pixel reuse retains actual accepted and failed reviews only for identical full pages',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pixel-review-'));t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const png=rgbPng({width:2,height:2,pixels:Buffer.alloc(12,255)});
 async function proof(name,bytes=png){const file=path.join(dir,name+'.pdf');fs.writeFileSync(file,name);const pdf={path:file,hash:hash(file)},result=await ensureSelectedPdfRasters(pdf,1,path.join(dir,name),{pages:[1],engine:'fixture',renderRange:async()=>[{page:1,bytes}]});return rasterEvidence(pdf,result.images[0]);}
 const original=await proof('old'),current=await proof('new'),state={pages:{}};
 const batch={edition:'student',rows:[{page:1,hash:'old-html',blocks:['q'],raster:original}]};
 recordVisualResult({batch,state,result:{pages:[{page:1,outcome:'accepted'}]}});
 const plan={student:{pending:[{page:1,hash:'new-html',raster:current}]}};
 assert.equal(retainPixelReviews(plan,state),1);assert.equal(visualOutcomeReader(state)('student',plan.student.pending[0]).outcome,'accepted');assert.equal(state.pages['student:new-html'],undefined,'No new acceptance is written');
 const changed=await proof('changed',rgbPng({width:2,height:2,pixels:Buffer.alloc(12,0)})),other={student:{pending:[{page:1,hash:'changed',raster:changed}]}};assert.equal(retainPixelReviews(other,state),0);
 assert.equal(retainPixelReviews({worked:{pending:[{page:1,hash:'other-edition',raster:current}]}},state),0);
 fs.appendFileSync(current.image.path,'altered');assert.equal(visualOutcomeReader(state)('student',plan.student.pending[0]),undefined);
 assert.throws(()=>recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:'tampered',raster:current}]},state,result:{pages:[{page:1,outcome:'accepted'}]}}),/evidence changed/);
 const failure=await proof('failure');recordVisualResult({batch:{edition:'short',rows:[{page:1,hash:'failed',raster:original}]},state,result:{pages:[{page:1,outcome:'needs-change',finding:'Label collision'}]}});
 const failedPlan={short:{pending:[{page:1,hash:'metadata-change',raster:failure}]}};assert.equal(retainPixelReviews(failedPlan,state),1);assert.equal(visualOutcomeReader(state)('short',failedPlan.short.pending[0]).outcome,'needs-change');
 fs.appendFileSync(original.pdf.path,'changed');assert.equal(visualOutcomeReader(state)('short',failedPlan.short.pending[0]),undefined);
});
test('malformed or duplicate visual replies cannot create acceptance',()=>{
 for(const pages of [[{page:1,outcome:'maybe'}],[{page:1,outcome:'accepted'},{page:1,outcome:'accepted'}],[{page:2,outcome:'accepted'}]])assert.throws(()=>recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:'h'}]},state:{pages:{}},result:{pages}}),/Invalid independent/);
});
