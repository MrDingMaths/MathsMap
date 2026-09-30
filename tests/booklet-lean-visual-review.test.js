import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {LEAN_REVIEW_PROFILE} from '../scripts/booklet/lean-profile.mjs';
import {artifactHash,projectReviewHash,validateFinalManifest} from '../scripts/booklet/page-review.mjs';
import {ensureSelectedPdfRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {prepareReviewQueue,beginPageReview,recordPageReview,finalReviewRecord} from '../scripts/booklet/visual-review-queue.mjs';
const ref=file=>({path:path.resolve(file),hash:artifactHash(file)});
const expected=s=>({expectedRevision:s.revision,sessionKey:s.sessionKey});
const accepted={reviewer:'Synthetic fixture',note:'Test record only; no production acceptance.',outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
test('five-edition targeted review resumes and rebinds metadata without repeated inspections',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-visual-'));t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const write=(name,value)=>{const file=path.join(dir,name);fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 const project={id:'lean-visual',source:{reviewProfile:LEAN_REVIEW_PROFILE},settings:{},sections:[]},projectFile=write('project.json',project),projectHash=projectReviewHash(project);
 const input={reviewProfile:LEAN_REVIEW_PROFILE,mode:'final',project:{...ref(projectFile),contentHash:projectHash},renderer:'test-runtime',assets:{},key:'settlement',sourceArtifacts:[ref(write('source.txt','Source evidence fixture'))],editions:{}};
 let calls=0;for(const edition of ['student','short','worked','with-short','with-worked']){
  const pdf=ref(write(edition+'.pdf','Synthetic PDF '+edition)),visualPages=[1,3],raster=await ensureSelectedPdfRasters(pdf,3,path.join(dir,'rasters'),{pages:visualPages,engine:'fixture',renderRange:async(_,first,last)=>{calls++;return Array.from({length:last-first+1},(_,i)=>({page:first+i,bytes:png}));}});
  const manifest={version:2,reviewProfile:LEAN_REVIEW_PROFILE,mode:'full',passed:true,edition,projectHash,renderer:input.renderer,workflowKey:input.key,assets:{},pdf,pages:[1,2,3].map(page=>({page,hash:'page'+page})),visualPages,images:raster.images,rasterization:raster.rasterization};
  input.editions[edition]={manifest:ref(write(edition+'.json',manifest)),images:raster.images};
 }
 assert.equal(calls,10);const deps={renderer:input.renderer,workflow:{settled:{key:input.key,project:{hash:projectHash}}}};
 let status=await prepareReviewQueue(dir,input,deps);assert.equal(status.total,10);assert.deepEqual(status.pendingComposition,[]);
 await assert.rejects(()=>finalReviewRecord(dir,{...accepted,...expected(status)},deps),/Every page/);
 status=await beginPageReview(dir,{...expected(status),pageKeys:status.pending.map(p=>p.key)},deps);
 status=await recordPageReview(dir,{...accepted,...expected(status),reviewId:status.active.id},deps);
 const completed=await finalReviewRecord(dir,{...accepted,...expected(status)},deps);
 for(const [edition,review]of Object.entries(completed.editions)){
  assert.equal(review.allPagesVisuallyInspected,false);assert.equal(review.pages[1].reviewMethod,'automated');
  validateFinalManifest(review,{edition,key:input.key,projectHash,renderer:input.renderer});
  const missing=structuredClone(review);missing.pages[0].reviewMethod='automated';assert.throws(()=>validateFinalManifest(missing,{edition,key:input.key,projectHash,renderer:input.renderer}),/actual visual/);
 }
 project.studio={flags:[]};project.revision=8;write('project.json',project);input.project={...ref(projectFile),contentHash:projectReviewHash(project)};
 status=await prepareReviewQueue(dir,input,deps);assert.equal(status.pending.length,0);assert.equal(status.reviewed,10);
 for(const entry of Object.values(input.editions)){const manifest=JSON.parse(fs.readFileSync(entry.manifest.path));const reused=await ensureSelectedPdfRasters(manifest.pdf,3,path.join(dir,'rasters'),{pages:manifest.visualPages,engine:'fixture',renderRange:()=>assert.fail('An unchanged PDF must not rasterise again')});assert.equal(reused.metrics.rendered,0);assert.equal(reused.metrics.reused,2);}
});
