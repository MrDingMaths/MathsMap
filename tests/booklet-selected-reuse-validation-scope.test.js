import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {pngBodyFingerprint,selectedPageReusePlans,selectedPageReuseArtifacts,validateSelectedPageReuse,withSelectedPageReuseValidation} from '../scripts/booklet/selected-page-review-reuse.mjs';

const digest=data=>createHash('sha256').update(data).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));
const editions=['student','short','worked','student-short','student-worked'];
const profile='textbook-three-pass-v1';
const crcTable=Array.from({length:256},(_,n)=>{
 for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;
 return n>>>0;
});
function chunk(type,payload){
 const body=Buffer.concat([Buffer.from(type),payload]);
 let crc=0xffffffff;
 for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);
 const size=Buffer.alloc(4),checksum=Buffer.alloc(4);
 size.writeUInt32BE(payload.length);checksum.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([size,body,checksum]);
}
function a4Png(){
 const width=1191,height=1684,header=Buffer.alloc(13);
 header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 return Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),
  chunk('IDAT',deflateSync(Buffer.alloc((width*3+1)*height))),chunk('IEND',Buffer.alloc(0))
 ]);
}
const imageBytes=a4Png();

// Instrument the actual filesystem boundary; production code exposes no cache hooks.
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'selected-reuse-scope-'));
 const write=(name,data)=>{
  const file=path.join(dir,name);fs.writeFileSync(file,data);
  return {path:file,hash:digest(data)};
 };
 const sources=[write('source.pdf','source revision A'),write('source.docx','document source')];
 const priorImage={...write('prior.png',imageBytes),page:2};
 const image={...write('current.png',imageBytes),page:2};
 const input={mode:'final',reviewProfile:profile,key:'settlement',renderer:'renderer',project:{contentHash:'project'},assets:{},sourceArtifacts:clone(sources),editions:{}};
 const manifests={},pdfs=[];
 for(const edition of editions){
  const pdf=write(edition+'.pdf','PDF '+edition);pdfs.push(pdf);
  const manifest={edition,mode:'full',passed:true,workflowKey:input.key,renderer:input.renderer,projectHash:input.project.contentHash,assets:{},images:[clone(image)],pdf,visualPages:[2],pages:[1,2,3].map(page=>({page,hash:'page-'+page}))};
  manifests[edition]=manifest;
  input.editions[edition]={manifest:write(edition+'.json',JSON.stringify(manifest)),images:[clone(image)]};
 }
 const key=digest(JSON.stringify({edition:'student',imageHash:image.hash,page:2}));
 const priorRow={key,edition:'student',page:2,image:clone(priorImage),sources:clone(sources)};
 const row={key,edition:'student',page:2,image:clone(image),sources:clone(sources),selectedBodyEligible:true};
 const actual={outcome:'accepted',reviewProfile:profile,presentationVerified:true,reviewer:'Actual reviewer',note:'Inspected printed page.',pageKeys:[key],sourceArtifacts:clone(sources)};
 const priorReview={outcome:actual.outcome,reviewer:actual.reviewer,note:actual.note,artifact:write('actual-inspection.json',JSON.stringify(actual))};
 const record={reuseKind:'selected-body',reviewProfile:profile,outcome:'accepted',reviewer:actual.reviewer,originalActualReviewer:actual.reviewer,note:actual.note,currentPageKeys:[key],currentRow:{key,edition:row.edition,page:row.page,image:clone(image),sources:clone(sources)},priorRow:clone(priorRow),priorReview:clone(priorReview),sourceArtifacts:clone(sources),currentManifests:Object.fromEntries(editions.map(edition=>[edition,clone(input.editions[edition].manifest)])),bodyFingerprint:pngBodyFingerprint(imageBytes,{dpi:144,footerMm:15,strictA4:true}),combinedEditions:[]};
 const reads=new Map(),originalRead=fs.readFileSync;
 fs.readFileSync=function(file,...args){
  if(typeof file==='string'){
   const resolved=path.resolve(file);
   if(resolved.startsWith(dir+path.sep))reads.set(resolved,(reads.get(resolved)??0)+1);
  }
  return originalRead.call(this,file,...args);
 };
 t.after(()=>{fs.readFileSync=originalRead;fs.rmSync(dir,{recursive:true,force:true});});
 const paths=[...sources,...pdfs,...editions.map(edition=>input.editions[edition].manifest),priorImage,image,priorReview.artifact].map(ref=>ref.path);
 return {dir,write,sources,input,manifests,priorRow,priorReview,row,actual,record,reads,paths};
}
const validate=f=>validateSelectedPageReuse(f.record,f.row,f.input);
const plansForInput=input=>selectedPageReusePlans(null,{input,rows:[]});

 test('one operation reads every dependency once and exposes only copied evidence',t=>{
 const f=fixture(t),previous={input:f.input,rows:[{...f.priorRow,review:f.priorReview}]},current={input:f.input,rows:[f.row]};
 withSelectedPageReuseValidation(()=>{
  assert.equal(validate(f),true);
  assert.equal(validate(f),true);
  const plans=selectedPageReusePlans(previous,current);
  assert.equal(plans.length,1);
  plans[0].record.bodyFingerprint.bodyHash='mutated';
  plans[0].record.currentManifests.student.path='mutated';
  plans[0].record.priorReview.note='mutated';
  plans[0].record.currentRow.image.path='mutated';
  assert.deepEqual(selectedPageReusePlans(previous,current)[0].record,f.record);
  const artifacts=selectedPageReuseArtifacts(f.record,f.row,f.input);
  artifacts[0].path='mutated';
  assert.equal(selectedPageReuseArtifacts(f.record,f.row,f.input)[0].path,f.priorReview.artifact.path);
  assert.equal(validate(f),true);
 });
 for(const file of f.paths)assert.equal(f.reads.get(file),1,file);
 withSelectedPageReuseValidation(()=>assert.equal(validate(f),true));
 for(const file of f.paths)assert.equal(f.reads.get(file),2,file);
});

test('resolved path aliases share a snapshot but every requested hash is checked',t=>{
 const f=fixture(t),input=clone(f.input);
 const alias=f.dir+path.sep+'unused'+path.sep+'..'+path.sep+'source.pdf';
 input.sourceArtifacts.push({...input.sourceArtifacts[0],path:alias});
 withSelectedPageReuseValidation(()=>{
  assert.deepEqual(plansForInput(input),[]);
  input.sourceArtifacts[input.sourceArtifacts.length-1].hash=digest('different source');
  assert.throws(()=>plansForInput(input),/Missing or stale selected-page evidence/);
 });
 assert.equal(f.reads.get(f.sources[0].path),1);
});

test('changed source bytes fail in the next operation',t=>{
 const f=fixture(t);
 withSelectedPageReuseValidation(()=>assert.equal(validate(f),true));
 fs.writeFileSync(f.sources[0].path,'source revision B');
 assert.throws(()=>withSelectedPageReuseValidation(()=>validate(f)),/Missing or stale selected-page evidence/);
 assert.equal(f.reads.get(f.sources[0].path),2);
});

test('deleted evidence is read again and fails in the next operation',t=>{
 const f=fixture(t);
 withSelectedPageReuseValidation(()=>assert.equal(validate(f),true));
 fs.unlinkSync(f.sources[0].path);
 assert.throws(()=>withSelectedPageReuseValidation(()=>validate(f)),/ENOENT/);
 assert.equal(f.reads.get(f.sources[0].path),2);
});

test('the next operation accepts a fresh hash only for its freshly read bytes',t=>{
 const f=fixture(t);
 withSelectedPageReuseValidation(()=>assert.deepEqual(plansForInput(f.input),[]));
 const changed='source revision B',input=clone(f.input);
 fs.writeFileSync(f.sources[0].path,changed);
 input.sourceArtifacts[0].hash=digest(changed);
 withSelectedPageReuseValidation(()=>{
  assert.deepEqual(plansForInput(input),[]);
  assert.throws(()=>plansForInput(f.input),/Missing or stale selected-page evidence/);
 });
 assert.equal(f.reads.get(f.sources[0].path),2);
});

test('nested scopes read fresh snapshots and restore the outer snapshot',t=>{
 const f=fixture(t);
 withSelectedPageReuseValidation(()=>{
  assert.equal(validate(f),true);
  const changed='source revision B',input=clone(f.input);
  fs.writeFileSync(f.sources[0].path,changed);input.sourceArtifacts[0].hash=digest(changed);
  withSelectedPageReuseValidation(()=>{
   assert.throws(()=>validate(f),/Missing or stale selected-page evidence/);
   assert.deepEqual(plansForInput(input),[]);
  });
  assert.equal(validate(f),true);
  assert.equal(f.reads.get(f.sources[0].path),2);
 });
 assert.throws(()=>validate(f),/Missing or stale selected-page evidence/);
 assert.equal(f.reads.get(f.sources[0].path),3);
});

test('throwing callbacks restore state and leave no unscoped acceptance cache',t=>{
 const f=fixture(t);
 assert.throws(()=>withSelectedPageReuseValidation(()=>{validate(f);throw Error('callback failed');}),/callback failed/);
 fs.writeFileSync(f.sources[0].path,'source revision B');
 assert.throws(()=>validate(f),/Missing or stale selected-page evidence/);
 assert.throws(()=>validate(f),/Missing or stale selected-page evidence/);
 assert.equal(f.reads.get(f.sources[0].path),3);
});

test('Promise callbacks are rejected and restore state',t=>{
 const f=fixture(t);
 let invoked=false;
 assert.throws(()=>withSelectedPageReuseValidation(async()=>{invoked=true;}),/synchronous callback/);
 assert.equal(invoked,false);
 assert.throws(()=>withSelectedPageReuseValidation(()=>{validate(f);return Promise.resolve(true);}),/synchronous callback/);
 fs.writeFileSync(f.sources[0].path,'source revision B');
 assert.throws(()=>validate(f),/Missing or stale selected-page evidence/);
 assert.equal(f.reads.get(f.sources[0].path),2);
});

test('all five manifests retain their settlement binding checks',t=>{
 const f=fixture(t);
 for(const edition of editions){
  const input=clone(f.input);
  input.editions[edition].manifest=f.write('wrong-'+edition+'.json',JSON.stringify({...f.manifests[edition],workflowKey:'another settlement'}));
  assert.throws(()=>withSelectedPageReuseValidation(()=>validateSelectedPageReuse(f.record,f.row,input)),/Current passed full manifest is required/);
 }
});

test('freshly rehashed original inspection artifacts still require actual acceptance',t=>{
 const f=fixture(t),record=clone(f.record);
 record.priorReview.artifact=f.write('invalid-actual.json',JSON.stringify({...f.actual,presentationVerified:false}));
 assert.throws(()=>withSelectedPageReuseValidation(()=>validateSelectedPageReuse(record,f.row,f.input)),/Prior record is not an accepted actual lean inspection/);
 assert.equal(f.reads.get(record.priorReview.artifact.path),1);
});
