import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {gzipSync,gunzipSync} from 'node:zlib';
import {artifactHash,projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {buildEditionComparison,validateEditionComparison,fingerprintPpm,UNIQUE_LAYOUT_REVIEW,COMPOSITION_CHECKS} from '../scripts/booklet/edition-comparison.mjs';
import {prepareReviewQueue,reviewQueueStatus,beginPageReview,recordPageReview,finalReviewRecord,cancelPageReview} from '../scripts/booklet/visual-review-queue.mjs';
import {loadWorkflow,settlementKey,acceptFinalReview} from '../scripts/booklet/workflow-review.mjs';
import {rendererSignature} from '../scripts/booklet/verification-cache.mjs';
import {describeReview} from '../scripts/booklet/visual-review.mjs';

const editions=['student','short','worked','with-short','with-worked'];
const ref=file=>({path:path.resolve(file),hash:artifactHash(file)});
const expected=s=>({expectedRevision:s.revision,sessionKey:s.sessionKey});
const renderer=rendererSignature();
function ppm(value,footer=0){
 const width=1191,height=1684,pixels=Buffer.alloc(width*height*3,255);
 pixels[width*3*100+100]=value;pixels[pixels.length-100]=footer;
 return Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`),pixels]);
}
async function fixture(t,{changeBody=false,extraPage=false}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'edition-comparison-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const write=(name,data)=>{const file=path.join(dir,name);fs.writeFileSync(file,typeof data==='string'||Buffer.isBuffer(data)?data:JSON.stringify(data));return file;};
 const project={id:'fixture',settings:{},sections:[]},projectFile=write('project.json',project),projectHash=projectReviewHash(project);
 const state=loadWorkflow(dir),key=settlementKey(state),sources=[ref(write('source.txt','Synthetic regression evidence; no booklet acceptance'))];
 state.settled={key,project:{file:projectFile,hash:projectHash},artifacts:sources};
 const input={mode:'final',project:{...ref(projectFile),contentHash:projectHash},renderer,assets:{},key,sourceArtifacts:sources,reviewPolicy:UNIQUE_LAYOUT_REVIEW,editions:{}};
 const content={student:[1,2,3],short:[4,5],worked:[6,7],'with-short':[1,2,3,4,5],'with-worked':[1,2,3,6,7]};
 if(changeBody)content['with-short'][1]=22;
 if(extraPage)content['with-short'].push(8);
 for(const edition of editions){
  const images=content[edition].map((_,i)=>({page:i+1,...ref(write(`${edition}-${i+1}.png`,'Synthetic image reference'))}));
  const m={mode:'full',passed:true,edition,projectHash,renderer,workflowKey:key,assets:{},images,pdf:ref(write(edition+'.pdf','Synthetic PDF reference '+edition)),pages:images.map(i=>({page:i.page,hash:`${edition}-${i.page}`}))};
  input.editions[edition]={manifest:ref(write(edition+'.json',m)),images};
 }
 let renderCalls=0;
 const render=(pdf,p)=>{renderCalls++;const edition=path.basename(pdf,'.pdf');return ppm(content[edition][p-1],editions.indexOf(edition));};
 const options={engine:'Synthetic regression rasterizer',render};
 input.comparison=(await buildEditionComparison(input.editions,path.join(dir,'rasters'),options)).reference;
 return {dir,input,state,write,render,options,calls:()=>renderCalls,deps:{renderer,workflow:state}};
}
async function inspect(f,s,keys=s.pending.map(r=>r.key)){
 s=await beginPageReview(f.dir,{...expected(s),pageKeys:keys},f.deps);
 return recordPageReview(f.dir,{...expected(s),reviewId:s.active.id,reviewer:'Test fixture',note:'Synthetic page inspection assertion only',outcome:'accepted',sourceCompared:true,contentVerified:true,presentationVerified:true},f.deps);
}
async function compose(f,s){
 s=await beginPageReview(f.dir,{...expected(s),compositionEditions:['with-short','with-worked']},f.deps);
 return recordPageReview(f.dir,{...expected(s),reviewId:s.active.id,reviewer:'Test fixture',note:'Synthetic composition inspection assertion only',outcome:'accepted',compositionChecks:Object.fromEntries(COMPOSITION_CHECKS.map(k=>[k,true]))},f.deps);
}
const finish=(f,s)=>finalReviewRecord(f.dir,{...expected(s),reviewer:'Test fixture',note:'Synthetic final acceptance regression only'},f.deps);

test('pixel matching retains footer exclusion but never waives covers or section boundaries',async t=>{
 const f=await fixture(t),result=validateEditionComparison(f.input.comparison,f.input.editions);
 assert.deepEqual(Object.keys(result.matches),['with-short:2','with-short:5','with-worked:2','with-worked:5']);
 assert.equal(result.matches['with-short:5'].edition,'short');assert.equal(result.matches['with-short:5'].page,2);
 assert.match(result.manual['with-short:1'],/Cover/);assert.match(result.manual['with-short:3'],/boundary/);assert.match(result.manual['with-short:4'],/boundary/);
 const different=await fixture(t,{changeBody:true});assert.equal(validateEditionComparison(different.input.comparison,different.input.editions).matches['with-short:2'],undefined);
 const shifted=await fixture(t,{extraPage:true});assert.equal(Object.keys(validateEditionComparison(shifted.input.comparison,shifted.input.editions).matches).filter(k=>k.startsWith('with-short')).length,0);
});

test('combined reuse requires standalone inspection and all composition checks; final API preserves honest counts',async t=>{
 const f=await fixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps);
 assert.equal(s.total,17);assert.equal(s.pending.length,13);assert.equal(s.awaitingReuse.length,4);assert.equal(s.reused,0);
 s=await inspect(f,s);assert.equal(s.reviewed,13);assert.equal(s.reused,0);
 await assert.rejects(()=>finish(f,s),/Every page/);
 s=await beginPageReview(f.dir,{...expected(s),compositionEditions:['with-short']},f.deps);
 await assert.rejects(()=>recordPageReview(f.dir,{...expected(s),reviewId:s.active.id,reviewer:'Fixture',note:'Missing footer and links checks',outcome:'accepted',compositionChecks:{covers:true}},f.deps),/footers and links/);
 s=await cancelPageReview(f.dir,expected(s));s=await compose(f,s);
 assert.equal(s.reviewed,13);assert.equal(s.reused,4);assert.equal(s.awaitingReuse.length,0);
 const record=await finish(f,s);assert.equal(record.editions.student.allPagesVisuallyInspected,true);assert.equal(record.editions['with-short'].allPagesVisuallyInspected,false);
 acceptFinalReview(f.state,record);assert.ok(f.state.finalReview.artifacts.some(a=>a.path.endsWith('.ppm.gz')));
 const bypass=structuredClone(record);delete bypass.compositionReviews['with-short'];assert.throws(()=>acceptFinalReview(f.state,bypass),/composition review required/);
 const badSource=structuredClone(record);badSource.editions.student.pages[1].reviewMethod='equivalent';assert.throws(()=>acceptFinalReview(f.state,badSource),/No reviewed standalone/);
 const cover=structuredClone(record);cover.editions['with-short'].pages[0].reviewMethod='equivalent';assert.throws(()=>acceptFinalReview(f.state,cover),/No reviewed standalone/);
 s=await prepareReviewQueue(f.dir,f.input,f.deps);assert.equal(s.reviewed,13);assert.equal(s.reused,4);
});

test('reported defects cannot be silently accepted through matching pixels',async t=>{
 const f=await fixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps),duplicate=s.awaitingReuse[0].key;
 s=await inspect(f,s);s=await compose(f,s);
 s=await beginPageReview(f.dir,{...expected(s),pageKeys:[duplicate]},f.deps);
 s=await recordPageReview(f.dir,{...expected(s),reviewId:s.active.id,reviewer:'Fixture',note:'Unresolved issue needs actual correction',outcome:'needs-change'},f.deps);
 assert.equal(s.reused,3);assert.equal(s.pending.length,1);await assert.rejects(()=>finish(f,s),/Every page/);
});

test('changed rasters, forged comparison hashes and stale dependencies invalidate reuse',async t=>{
 const f=await fixture(t);await prepareReviewQueue(f.dir,f.input,f.deps);
 const report=JSON.parse(fs.readFileSync(f.input.comparison.path)),raster=report.editions['with-short'].pages[1].raster,old=fs.readFileSync(raster.path);
 fs.writeFileSync(raster.path,gzipSync(ppm(22)));await assert.rejects(()=>reviewQueueStatus(f.dir,f.deps),error=>error.message==='Missing or stale review dependency: '+raster.path);
 report.editions['with-short'].pages[1].raster=ref(raster.path);f.write(path.basename(f.input.comparison.path),report);
 const forged=ref(path.join(f.dir,path.basename(f.input.comparison.path)));assert.throws(()=>validateEditionComparison(forged,f.input.editions),/pixels changed/);
 fs.writeFileSync(raster.path,old);
 const pdf=report.editions.student.pdf;fs.writeFileSync(pdf.path,'changed PDF');assert.throws(()=>validateEditionComparison(f.input.comparison,f.input.editions),/stale/);
});

test('settlement and source changes cannot inherit old unique-layout or composition reviews',async t=>{
 const f=await fixture(t);let s=await compose(f,await inspect(f,await prepareReviewQueue(f.dir,f.input,f.deps)));
 f.input.key='new-settlement';f.state.settled.key=f.input.key;
 for(const e of editions){const file=f.input.editions[e].manifest.path,m=JSON.parse(fs.readFileSync(file));m.workflowKey=f.input.key;fs.writeFileSync(file,JSON.stringify(m));f.input.editions[e].manifest=ref(file);}
 f.input.comparison=(await buildEditionComparison(f.input.editions,path.join(f.dir,'rasters'),f.options)).reference;
 s=await prepareReviewQueue(f.dir,f.input,f.deps);assert.equal(s.reviewed,0);assert.equal(s.reused,0);assert.equal(s.pendingComposition.length,2);
 fs.writeFileSync(f.input.sourceArtifacts[0].path,'new source');await assert.rejects(()=>reviewQueueStatus(f.dir,f.deps),/stale/);
});

test('valid PDF raster caches are reused and corrupt entries rerender exactly once',async t=>{
 const f=await fixture(t),first=f.calls();
 let cached=await buildEditionComparison(f.input.editions,path.join(f.dir,'rasters'),f.options);assert.equal(f.calls(),first);assert.equal(cached.rendered,0);assert.equal(cached.reused,17);assert.deepEqual(cached.reference,f.input.comparison,'Unchanged describe output must preserve the review session');
 const report=JSON.parse(fs.readFileSync(cached.reference.path)),file=report.editions.student.pages[0].raster.path;
 fs.writeFileSync(file,gzipSync(ppm(99)));
 cached=await buildEditionComparison(f.input.editions,path.join(f.dir,'rasters'),f.options);assert.equal(cached.rendered,1);assert.equal(f.calls(),first+1);
 assert.equal(fingerprintPpm(gunzipSync(fs.readFileSync(file))).bodyHash,fingerprintPpm(ppm(1)).bodyHash);
});

test('RGB parser rejects truncation and preserves a whitespace-valued first pixel',()=>{
 const a=Buffer.from('P6\n1 1\n255\n\n\r '),b=Buffer.from('P6\n1 1\n255\n\0\0\0');
 assert.equal(fingerprintPpm(a).a4,false);assert.equal(fingerprintPpm(b).width,1);
 assert.throws(()=>fingerprintPpm(a.subarray(0,-1)),/Incomplete/);assert.throws(()=>fingerprintPpm(Buffer.from('P6\n-1 1\n255\n')),/Invalid/);
 const p=ppm(1),changed=Buffer.from(p);changed[changed.length-1]=10;assert.equal(fingerprintPpm(p).bodyHash,fingerprintPpm(changed).bodyHash);
 const {width,height,bodyHeight}=fingerprintPpm(p),above=Buffer.from(p),below=Buffer.from(p),header=p.length-width*height*3;
 above[header+(bodyHeight-1)*width*3]=0;below[header+bodyHeight*width*3]=0;
 assert.notEqual(fingerprintPpm(p).bodyHash,fingerprintPpm(above).bodyHash,'Even one pixel immediately above the footer strip needs inspection');
 assert.equal(fingerprintPpm(p).bodyHash,fingerprintPpm(below).bodyHash,'Excluded pixels require the separate composition review');
});

test('the normal descriptor defaults to unique-layout review and keeps a full-manual fallback',async t=>{
 const f=await fixture(t),descriptor={projectFile:f.input.project.path,sourceFiles:f.input.sourceArtifacts.map(a=>a.path),manifestFiles:Object.values(f.input.editions).map(e=>e.manifest.path),key:f.input.key,outDir:path.join(f.dir,'rasters')};
 const compare=(editions,out)=>buildEditionComparison(editions,out,f.options);
 const first=await describeReview(descriptor,{compare}),again=await describeReview(descriptor,{compare});
 assert.equal(first.reviewPolicy,UNIQUE_LAYOUT_REVIEW);assert.deepEqual(first,again);assert.deepEqual(first.comparison,f.input.comparison);
 const manual=await describeReview({...descriptor,fullVisual:true},{compare:()=>assert.fail('Full manual review must not require pixel comparison')});
 assert.equal(manual.reviewPolicy,undefined);assert.equal(manual.comparison,undefined);assert.equal(Object.keys(manual.editions).length,5);
});

test('composition and concurrent page claims remain mutually exclusive',async t=>{
 const f=await fixture(t);let s=await prepareReviewQueue(f.dir,f.input,f.deps);const keys=s.pending.map(r=>r.key);
 s=await beginPageReview(f.dir,{...expected(s),compositionEditions:['with-short']},f.deps);
 await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),pageKeys:[keys[0]],visualConcurrency:3},f.deps),/already active/);
 s=await cancelPageReview(f.dir,expected(s));
 s=await beginPageReview(f.dir,{...expected(s),pageKeys:[keys[0]],visualConcurrency:3},f.deps);
 s=await beginPageReview(f.dir,{...expected(s),pageKeys:[keys[1]],visualConcurrency:3},f.deps);
 await assert.rejects(()=>beginPageReview(f.dir,{...expected(s),compositionEditions:['with-short']},f.deps),/already active/);
 for(const claim of [...s.activeReviews])s=await cancelPageReview(f.dir,{...expected(s),reviewId:claim.id});
 assert.equal(s.reviewed,0);assert.deepEqual(s.activeReviews,[]);
});


test('Import review can inspect all layouts with visible findings but cannot grant final acceptance',async t=>{
 const f=await fixture(t);
 const project=JSON.parse(fs.readFileSync(f.input.project.path));project.library={category:'import-review'};project.studio={flags:[{id:'open',resolved:false,message:'User decision remains visible'}]};
 fs.writeFileSync(f.input.project.path,JSON.stringify(project));const projectHash=projectReviewHash(project);f.input.project={...ref(f.input.project.path),contentHash:projectHash};f.input.mode='review';delete f.input.key;
 for(const e of editions){const file=f.input.editions[e].manifest.path,m=JSON.parse(fs.readFileSync(file));Object.assign(m,{mode:'review',reviewOnly:true,projectHash,workflowKey:null});fs.writeFileSync(file,JSON.stringify(m));f.input.editions[e].manifest=ref(file);}
 f.options.reviewOnly=true;f.input.comparison=(await buildEditionComparison(f.input.editions,path.join(f.dir,'review-rasters'),f.options)).reference;
 assert.throws(()=>validateEditionComparison(f.input.comparison,f.input.editions),/full manifests/);
 let s=await prepareReviewQueue(f.dir,f.input,f.deps);s=await inspect(f,s);s=await compose(f,s);assert.equal(s.pending.length,0);assert.equal(s.reused,4);
 await assert.rejects(()=>finish(f,s),/Every page/);
 assert.equal(JSON.parse(fs.readFileSync(f.input.project.path)).studio.flags[0].resolved,false);
 const final={...f.input,mode:'final',key:f.state.settled.key};await assert.rejects(()=>prepareReviewQueue(f.dir,final,f.deps),/settled|full manifests/);
 project.sections=[{blocks:[{id:'banked',bankRef:{id:'q'}}]}];fs.writeFileSync(f.input.project.path,JSON.stringify(project));f.input.project={...ref(f.input.project.path),contentHash:projectReviewHash(project)};await assert.rejects(()=>prepareReviewQueue(f.dir,f.input,f.deps),/local Import review/);
});
