import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import {artifactHash,projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {LEAN_REVIEW_PROFILE} from '../scripts/booklet/lean-profile.mjs';
import {FINAL_EDITIONS} from '../scripts/booklet/workflow-review.mjs';
import {COMBINED_EDITIONS} from '../scripts/booklet/edition-comparison.mjs';
import {ensureSelectedPdfRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {prepareReviewQueue,beginPageReview,recordPageReview,reviewQueueStatus} from '../scripts/booklet/visual-review-queue.mjs';
import {validateSelectedPageReuse} from '../scripts/booklet/selected-page-review-reuse.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
const ref=file=>({path:path.resolve(file),hash:artifactHash(file)});
const expected=status=>({expectedRevision:status.revision,sessionKey:status.sessionKey});
const queuePath=run=>path.join(run,'visual-review','queue.json');
const readQueue=run=>JSON.parse(fs.readFileSync(queuePath(run),'utf8'));
const readProof=row=>JSON.parse(fs.readFileSync(row.review.artifact.path,'utf8'));
const findRow=(queue,edition,page=4)=>queue.rows.find(row=>row.edition===edition&&row.page===page);

function crc(bytes){
 let value=0xffffffff;
 for(const byte of bytes){
  value^=byte;
  for(let i=0;i<8;i++)value=(value&1)?0xedb88320^(value>>>1):value>>>1;
 }
 return (value^0xffffffff)>>>0;
}
function chunk(type,bytes){
 const name=Buffer.from(type),result=Buffer.alloc(bytes.length+12);
 result.writeUInt32BE(bytes.length);name.copy(result,4);bytes.copy(result,8);
 result.writeUInt32BE(crc(Buffer.concat([name,bytes])),result.length-4);
 return result;
}
// Full portrait A4 RGB8 at 144 dpi. The synthetic body depicts 1 + 1 = 2;
// variants move that equation, alter a result stroke, or change footer ink.
function a4Png({body=0,footer=0,alterMath=false}={}){
 const width=1191,height=1684,stride=width*3+1,raw=Buffer.alloc(stride*height,255);
 for(let y=0;y<height;y++)raw[y*stride]=0;
 function rectangle(x,y,w,h){
  for(let row=y;row<y+h;row++)raw.fill(0,row*stride+1+x*3,row*stride+1+(x+w)*3);
 }
 const y=120+body*35;
 rectangle(100,y,3,20);
 rectangle(120,y+8,17,3);rectangle(127,y+1,3,17);
 rectangle(150,y,3,20);
 rectangle(166,y+5,16,3);rectangle(166,y+12,16,3);
 rectangle(190,y,16,3);rectangle(203,y,3,11);
 rectangle(190,y+9,16,3);rectangle(190,y+9,3,11);rectangle(190,y+17,16,3);
 if(alterMath)rectangle(203,y+12,3,5);
 if(footer)rectangle(100+footer*8,height-4,3,2);
 const header=Buffer.alloc(13);
 header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 return Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))
 ]);
}

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'selected-rebinding-'));
 t.after(()=>{
  assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));
  fs.rmSync(dir,{recursive:true,force:true});
 });
 let serial=0;
 function artifact(value,suffix='json'){
  const file=path.join(dir,`${++serial}.${suffix}`);
  fs.writeFileSync(file,Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value));
  return ref(file);
 }
 const project={id:'synthetic-selected-rebinding',source:{reviewProfile:LEAN_REVIEW_PROFILE},settings:{},sections:[]};
 const projectHash=projectReviewHash(project),projectRef=artifact(project);
 const source=artifact('Original synthetic source evidence; no production acceptance.','txt');
 const pngs=new Map();
 function image(options){
  const key=JSON.stringify(options);
  if(!pngs.has(key))pngs.set(key,a4Png(options));
  return pngs.get(key);
 }
 async function exports(session,{sources=[source],original=false,alterMath=false,changedCover=false}={}){
  const input={
   reviewProfile:LEAN_REVIEW_PROFILE,mode:'final',
   project:{...projectRef,contentHash:projectHash},renderer:'synthetic-renderer-'+session,
   assets:{},key:'synthetic-settlement-'+session,sourceArtifacts:clone(sources),editions:{}
  };
  for(const [index,edition]of FINAL_EDITIONS.entries()){
   const pdf=artifact('Synthetic full export '+session+' '+edition,'pdf'),visualPages=[1,4,8];
   const combined=COMBINED_EDITIONS.includes(edition);
   const raster=await ensureSelectedPdfRasters(pdf,8,path.join(dir,'rasters',session),{
    pages:visualPages,engine:'fixture',
    renderRange:async(_,first,last)=>Array.from({length:last-first+1},(_,offset)=>{
     const page=first+offset;
     const options=page===4
      ?{body:combined&&!original?0:index,footer:combined&&!original?index+1:0,alterMath:alterMath&&edition===COMBINED_EDITIONS[0]}
      :{body:10+index*2+(page===8?1:0),footer:changedCover&&edition===COMBINED_EDITIONS[0]&&page===1?1:0};
     return {page,bytes:image(options)};
    })
   });
   const manifest={
    version:2,reviewProfile:LEAN_REVIEW_PROFILE,mode:'full',passed:true,edition,
    projectHash,renderer:input.renderer,workflowKey:input.key,assets:{},pdf,
    pages:Array.from({length:8},(_,i)=>({page:i+1,hash:`synthetic-${edition}-${i+1}-${session}`})),
    visualPages,images:raster.images,rasterization:raster.rasterization
   };
   input.editions[edition]={manifest:artifact(manifest),images:raster.images};
  }
  const deps={renderer:input.renderer,workflow:{settled:{key:input.key,project:{hash:projectHash}}}};
  return {input,deps};
 }
 function fork(name,queue){
  const run=path.join(dir,name);
  fs.mkdirSync(path.dirname(queuePath(run)),{recursive:true});
  fs.writeFileSync(queuePath(run),JSON.stringify(clone(queue)));
  return run;
 }
 const run=path.join(dir,'main');fs.mkdirSync(run);
 return {dir,run,source,artifact,exports,fork};
}

test('selected-body proofs rebind across export sessions while original actual inspection stays immutable',async t=>{
 const f=await fixture(t),a=await f.exports('a',{original:true});
 assert.equal(FINAL_EDITIONS.length,5);
 let status=await prepareReviewQueue(f.run,a.input,a.deps);
 const inspected=status.pending.filter(row=>!(COMBINED_EDITIONS.includes(row.edition)&&row.page===4));
 assert.equal(inspected.length,13);
 status=await beginPageReview(f.run,{...expected(status),pageKeys:inspected.map(row=>row.key)},a.deps);
 status=await recordPageReview(f.run,{
  ...expected(status),reviewId:status.active.id,outcome:'accepted',
  reviewer:'Independent synthetic fixture reviewer',
  note:'Synthetic inspection record only; no real source, content or visual acceptance.',
  presentationVerified:true
 },a.deps);
 assert.equal(status.reviewed,13);assert.equal(status.reused,0);assert.equal(status.pending.length,2);
 const original=readQueue(f.run),actual=findRow(original,'student');
 assert.equal(actual.selectedBodyEligible,true);
 const actualBytes=fs.readFileSync(actual.review.artifact.path);
 const actualRecord=JSON.parse(actualBytes);
 assert.equal(actualRecord.reuseKind,undefined);
 assert.equal(actualRecord.presentationVerified,true);
 assert.ok(actualRecord.pageKeys.includes(actual.key));

 // New combined bodies now match the previously inspected standalone body,
 // while footer ink differs. All five current synthetic manifests are passed.
 const b=await f.exports('b');
 status=await prepareReviewQueue(f.run,b.input,b.deps);
 assert.equal(status.pending.length,0);assert.equal(status.reviewed,13);assert.equal(status.reused,2);
 const retained=readQueue(f.run),oldProofs=new Map();
 for(const edition of COMBINED_EDITIONS){
  const row=findRow(retained,edition),record=readProof(row);
  assert.equal(row.review.reuseKind,'selected-body');
  assert.deepEqual(record.priorReview,actual.review);
  assert.deepEqual(record.priorRow.image,actual.image);
  assert.equal(validateSelectedPageReuse(record,row,retained.input),true);
  oldProofs.set(edition,{row:clone(row),record:clone(record),bytes:fs.readFileSync(row.review.artifact.path)});
 }

 // These exports have identical PNG bytes to B but a new renderer, PDFs,
 // settlement and all-five manifest closure. This failed before the repair.
 const c=await f.exports('c');
 status=await prepareReviewQueue(f.run,c.input,c.deps);
 assert.equal(status.pending.length,0);assert.equal(status.reviewed,13);assert.equal(status.reused,2);
 assert.notEqual(status.sessionKey,retained.sessionKey);
 const rebound=readQueue(f.run);
 for(const previous of retained.rows){
  const current=findRow(rebound,previous.edition,previous.page);
  assert.equal(current.key,previous.key);
  assert.notEqual(current.image.path,previous.image.path);
  if(previous.review.reuseKind!=='selected-body')assert.deepEqual(current.review,previous.review);
  if(previous.page===1||previous.page===8){
   assert.equal(current.selectedBodyEligible,false);
   assert.equal(current.review.reuseKind,undefined);
  }
 }
 const currentManifests=Object.fromEntries(FINAL_EDITIONS.map(edition=>[edition,c.input.editions[edition].manifest]));
 for(const edition of COMBINED_EDITIONS){
  const row=findRow(rebound,edition),record=readProof(row),old=oldProofs.get(edition);
  assert.notEqual(row.review.artifact.path,old.row.review.artifact.path);
  assert.deepEqual(record.currentManifests,currentManifests);
  for(const name of FINAL_EDITIONS)assert.notEqual(record.currentManifests[name].hash,old.record.currentManifests[name].hash);
  assert.deepEqual(record.priorReview,actual.review);
  assert.equal(record.priorRow.key,old.record.priorRow.key);
  assert.equal(record.priorRow.image.hash,old.record.priorRow.image.hash);
  assert.deepEqual(record.priorRow.sources,old.record.priorRow.sources);
  assert.equal(record.originalActualReviewer,actual.review.reviewer);
  assert.equal(validateSelectedPageReuse(record,row,c.input),true);
  assert.deepEqual(fs.readFileSync(old.row.review.artifact.path),old.bytes);
  assert.equal(validateSelectedPageReuse(old.record,old.row,b.input),true);
 }
 assert.deepEqual(fs.readFileSync(actual.review.artifact.path),actualBytes);
 assert.equal((await reviewQueueStatus(f.run,c.deps)).pending.length,0);
 await prepareReviewQueue(f.run,c.input,c.deps);
 for(const edition of COMBINED_EDITIONS)assert.deepEqual(findRow(readQueue(f.run),edition).review,findRow(rebound,edition).review);

 await t.test('changed mathematical body cannot inherit selected-body credit',async()=>{
  const run=f.fork('changed-math',retained),next=await f.exports('changed-math',{alterMath:true});
  const result=await prepareReviewQueue(run,next.input,next.deps),queue=readQueue(run);
  const changed=findRow(queue,COMBINED_EDITIONS[0]);
  assert.equal(changed.review,null);
  assert.ok(result.pending.some(row=>row.key===changed.key));
  assert.equal(findRow(queue,COMBINED_EDITIONS[1]).review.reuseKind,'selected-body');
  await reviewQueueStatus(run,next.deps);
 });

 await t.test('changed source receives neither ordinary nor selected-body reuse',async()=>{
  const run=f.fork('changed-source',retained),source=f.artifact('Changed synthetic source evidence.','txt');
  const next=await f.exports('changed-source',{sources:[source]});
  const result=await prepareReviewQueue(run,next.input,next.deps);
  assert.equal(result.reviewed,0);assert.equal(result.reused,0);assert.equal(result.pending.length,result.total);
  assert.ok(readQueue(run).rows.every(row=>row.review===null));
 });

 await t.test('changed cover pixels still require actual inspection',async()=>{
  const run=f.fork('changed-cover',retained),next=await f.exports('changed-cover',{changedCover:true});
  const result=await prepareReviewQueue(run,next.input,next.deps),cover=findRow(readQueue(run),COMBINED_EDITIONS[0],1);
  assert.equal(cover.selectedBodyEligible,false);assert.equal(cover.review,null);
  assert.ok(result.pending.some(row=>row.key===cover.key));
 });

 async function rejectsTampering(name,evidence,next){
  const run=f.fork(name,retained),before=fs.readFileSync(queuePath(run)),bytes=fs.readFileSync(evidence.path);
  try{
   fs.appendFileSync(evidence.path,' ');
   await assert.rejects(()=>prepareReviewQueue(run,next.input,next.deps),/stale/i);
   assert.deepEqual(fs.readFileSync(queuePath(run)),before);
  }finally{fs.writeFileSync(evidence.path,bytes);}
 }
 await t.test('old source tampering fails even when current source is different',async()=>{
  const next=await f.exports('tampered-source',{sources:[f.artifact('Valid different current source.','txt')]});
  await rejectsTampering('tampered-source',f.source,next);
 });
 await t.test('original actual inspection artifact tampering fails',async()=>{
  await rejectsTampering('tampered-inspection',actual.review.artifact,c);
 });
 await t.test('original inspected image tampering fails',async()=>{
  await rejectsTampering('tampered-origin-image',actual.image,c);
 });
 await t.test('old all-five manifest closure tampering fails',async()=>{
  await rejectsTampering('tampered-old-manifest',b.input.editions.worked.manifest,c);
 });
 assert.deepEqual(fs.readFileSync(actual.review.artifact.path),actualBytes);
 for(const old of oldProofs.values())assert.deepEqual(fs.readFileSync(old.row.review.artifact.path),old.bytes);
});
