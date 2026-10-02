import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {syncBuiltinESMExports} from 'node:module';
import {pngBodyFingerprint,UnsupportedCandidateImage,selectedPageReusePlans,validateSelectedPageReuse,withSelectedPageReuseValidation} from '../scripts/booklet/selected-page-review-reuse.mjs';

const PROFILE='textbook-three-pass-v1';
const editions=['student','short','worked','student-short','student-worked'];
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const clone=v=>JSON.parse(JSON.stringify(v));
function crc(data){let n=0xffffffff;for(const byte of data){n^=byte;for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;}return (n^0xffffffff)>>>0;}
function chunk(type,data){
 const name=Buffer.from(type),out=Buffer.alloc(data.length+12);
 out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);
 out.writeUInt32BE(crc(Buffer.concat([name,data])),out.length-4);
 return out;
}
function png(mark,{invalidFilter=false}={}){
 const width=1191,height=1684,stride=width*3,raw=Buffer.alloc((stride+1)*height,255);
 for(let y=0;y<height;y++)raw[y*(stride+1)]=0;
 raw[1]=mark;
 if(invalidFilter)raw[0]=5;
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'selected-fingerprint-memo-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let serial=0;
 function artifact(data,suffix='bin'){
  const file=path.join(dir,`${++serial}.${suffix}`),buffer=Buffer.isBuffer(data)?data:Buffer.from(data);
  fs.writeFileSync(file,buffer);return {path:file,hash:digest(buffer)};
 }
 const source=artifact('unchanged original source','pdf');
 function queue(image,{accepted=false}={}){
  const edition='student',page=3,imageRef={...artifact(image,'png'),page},key=hash({edition,page,imageHash:imageRef.hash});
  const row={key,edition,page,image:imageRef,sources:[clone(source)],selectedBodyEligible:true,review:null};
  if(accepted){
   const record={outcome:'accepted',reviewer:'Actual reviewer',note:'Inspected mathematics and writing space.',reviewProfile:PROFILE,presentationVerified:true,pageKeys:[key],sourceArtifacts:[clone(source)]};
   row.review={outcome:record.outcome,reviewer:record.reviewer,note:record.note,artifact:artifact(JSON.stringify(record),'json')};
  }
  const input={mode:'final',reviewProfile:PROFILE,key:'settlement',sourceArtifacts:[clone(source)],renderer:'renderer',project:{contentHash:'project'},assets:{},editions:{}};
  const pdfs=[];
  for(const name of editions){
   const images=name===edition?[imageRef]:[],pdf=artifact('current passed PDF '+name,'pdf');pdfs.push(pdf);
   const manifest={edition:name,mode:'full',passed:true,workflowKey:input.key,renderer:input.renderer,projectHash:'project',assets:{},images,pdf,visualPages:name===edition?[page]:[1],pages:Array.from({length:3},(_,i)=>({page:i+1}))};
   input.editions[name]={manifest:artifact(JSON.stringify(manifest),'json'),images};
  }
  return {input,rows:[row],pdfs};
 }
 return {source,queue};
}
function observe(fn){
 const read=fs.readFileSync,createHash=crypto.createHash,inflate=zlib.inflateSync;
 const readBuffers=new WeakMap(),stats={inflates:0,reads:new Map(),hashes:new Map()};
 const increment=(map,key)=>map.set(key,(map.get(key)??0)+1);
 fs.readFileSync=function(...args){
  const data=read.apply(this,args),file=path.resolve(String(args[0]));
  increment(stats.reads,file);
  if(Buffer.isBuffer(data))readBuffers.set(data,file);
  return data;
 };
 crypto.createHash=function(...args){
  const result=createHash.apply(this,args),update=result.update;
  result.update=function(data,...rest){
   const file=Buffer.isBuffer(data)&&readBuffers.get(data);
   if(args[0]==='sha256'&&file)increment(stats.hashes,file);
   return update.call(this,data,...rest);
  };
  return result;
 };
 zlib.inflateSync=function(...args){stats.inflates++;return inflate.apply(this,args);};
 try{syncBuiltinESMExports();return fn(stats);}
 finally{fs.readFileSync=read;crypto.createHash=createHash;zlib.inflateSync=inflate;syncBuiltinESMExports();}
}
const scope=fn=>withSelectedPageReuseValidation(fn);
const plans=(old,current)=>scope(()=>selectedPageReusePlans(old,current));
const validate=(record,current)=>scope(()=>validateSelectedPageReuse(record,current.rows[0],current.input));
function closure(f,old,current){
 return [f.source,old.rows[0].review.artifact,old.rows[0].image,current.rows[0].image,...Object.values(current.input.editions).map(entry=>entry.manifest),...current.pdfs];
}
function retarget(record,current){
 const altered=clone(record),row=current.rows[0];
 altered.currentPageKeys=[row.key];
 altered.currentRow={key:row.key,edition:row.edition,page:row.page,image:clone(row.image),sources:clone(row.sources)};
 altered.currentManifests=Object.fromEntries(Object.entries(current.input.editions).map(([edition,entry])=>[edition,clone(entry.manifest)]));
 return altered;
}

test('fresh proof scopes reread and hash every closure while decoding identical PNG bytes once',t=>{
 const f=fixture(t),image=png(37),old=f.queue(image,{accepted:true}),current=f.queue(image),refs=closure(f,old,current);
 observe(stats=>{
  const [plan]=plans(old,current);assert.ok(plan);
  const expected=clone(plan.record.bodyFingerprint);
  assert.equal(stats.inflates,1);
  for(let operation=0;operation<3;operation++){
   const before=refs.map(ref=>[stats.reads.get(ref.path)??0,stats.hashes.get(ref.path)??0]);
   assert.equal(validate(plan.record,current),true);
   refs.forEach((ref,i)=>{
    assert.equal(stats.reads.get(ref.path),before[i][0]+1,'fresh read: '+ref.path);
    assert.ok(stats.hashes.get(ref.path)>=before[i][1]+1,'actual SHA verification: '+ref.path);
   });
   assert.equal(stats.inflates,1);
  }
  plan.record.bodyFingerprint.width=0;
  plan.record.bodyFingerprint.bodyHash='0'.repeat(64);
  assert.throws(()=>validate(plan.record,current),/printed body changed/);
  const [fresh]=plans(old,current);
  assert.deepEqual(fresh.record.bodyFingerprint,expected);
  assert.equal(validate(fresh.record,current),true);
  assert.equal(stats.inflates,1,'mutated public fingerprint cannot poison memo');
  const before=stats.inflates;
  assert.deepEqual(pngBodyFingerprint(image),pngBodyFingerprint(image));
  assert.equal(stats.inflates,before+2,'direct exported fingerprint remains uncached');
 });
});

test('new bytes decode and reject; corrupt results and stale closure evidence never gain acceptance',t=>{
 const f=fixture(t),image=png(83),old=f.queue(image,{accepted:true}),current=f.queue(image);
 const changed=f.queue(png(84)),corrupt=f.queue(png(85,{invalidFilter:true}));
 observe(stats=>{
  const record=plans(old,current)[0].record;
  assert.equal(validate(record,current),true);
  assert.equal(stats.inflates,1);
  const changedRecord=retarget(record,changed);
  assert.throws(()=>validate(changedRecord,changed),/printed body changed/);
  assert.equal(stats.inflates,2,'new independently hashed bytes must decode');
  const corruptRecord=retarget(record,corrupt);
  for(let operation=0;operation<2;operation++){
   assert.throws(()=>validate(corruptRecord,corrupt),UnsupportedCandidateImage);
   assert.equal(stats.inflates,3+operation,'failed PNG fingerprints are never memoized');
  }
  const decodes=stats.inflates;
  for(const ref of closure(f,old,current)){
   const original=fs.readFileSync(ref.path);
   try{
    fs.appendFileSync(ref.path,Buffer.from([0]));
    assert.throws(()=>validate(record,current),/stale/,'fresh closure rejects changed bytes: '+ref.path);
    assert.equal(stats.inflates,decodes);
   }finally{fs.writeFileSync(ref.path,original);}
  }
  assert.equal(validate(record,current),true);
  assert.equal(stats.inflates,decodes);
 });
});
