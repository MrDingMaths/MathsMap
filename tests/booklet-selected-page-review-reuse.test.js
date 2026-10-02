import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {pngBodyFingerprint,UnsupportedCandidateImage,selectedPageReusePlans,validateSelectedPageReuse,selectedPageReuseArtifacts} from '../scripts/booklet/selected-page-review-reuse.mjs';

const PROFILE='textbook-three-pass-v1';
const editions=['student','short','worked','student-short','student-worked'];
const combinedEditions=editions.slice(3);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const digest=b=>createHash('sha256').update(b).digest('hex');
const clone=v=>JSON.parse(JSON.stringify(v));
function crc(b){let n=0xffffffff;for(const byte of b){n^=byte;for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;}return (n^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([name,data])),out.length-4);return out;}
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
function png({width=1191,height=1684,filter=0,change,colourType=2}={}){
 const pixels=Buffer.alloc(width*height*3,255);
 // A small mathematical/scaffold mark in the printed body.
 if(width>12&&height>12){pixels[(10*width+10)*3]=0;pixels[(11*width+10)*3]=0;}
 if(change)change(pixels,width,height);
 const stride=width*3,raw=Buffer.alloc((stride+1)*height);
 for(let y=0;y<height;y++){
  const f=typeof filter==='function'?filter(y):filter,start=y*(stride+1);raw[start]=f;
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=3?pixels[i-3]:0,b=y?pixels[i-stride]:0,c=y&&x>=3?pixels[i-stride-3]:0;
   const predictor=f===0?0:f===1?a:f===2?b:f===3?Math.floor((a+b)/2):paeth(a,b,c);
   raw[start+x+1]=(pixels[i]-predictor)&255;
  }
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=colourType;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'selected-body-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 let serial=0;
 function artifact(data,suffix='bin'){
  const file=path.join(dir,`${++serial}.${suffix}`);fs.writeFileSync(file,data);
  return {path:file,hash:digest(fs.readFileSync(file))};
 }
 const source=artifact('original PDF','pdf');
 function queue({image=png(),accepted=false,edition='student',page=3,mode='final',profile=PROFILE,sources=[source],eligible=true}={}){
  const imageRef={...artifact(image,'png'),page},key=hash({edition,page,imageHash:imageRef.hash});
  const row={key,edition,page,pageHash:'semantic-page',image:imageRef,sources:clone(sources),selectedBodyEligible:eligible,review:null};
  if(accepted){
   const record={outcome:'accepted',reviewer:'Original human reviewer',note:'Inspected printed mathematics and writing space.',reviewProfile:profile,presentationVerified:true,pageKeys:[key],sourceArtifacts:clone(sources)};
   row.review={outcome:record.outcome,reviewer:record.reviewer,note:record.note,artifact:artifact(JSON.stringify(record),'json')};
  }
  const input={mode,reviewProfile:profile,key:'settlement',sourceArtifacts:clone(sources),renderer:'renderer',project:{contentHash:'project'},assets:{},editions:{}};
  for(const name of editions){
   const images=name===edition?[imageRef]:[],pdf=artifact('passed current PDF '+name,'pdf');
   const manifest={edition:name,mode:'full',passed:true,workflowKey:input.key,renderer:input.renderer,projectHash:'project',assets:{},images,pdf,visualPages:name===edition?[page]:[1],pages:Array.from({length:8},(_,i)=>({page:i+1,hash:'page-'+i}))};
   input.editions[name]={manifest:artifact(JSON.stringify(manifest),'json'),images};
  }
  return {input,rows:[row]};
 }
 return {dir,artifact,queue,source};
}
const plans=(old,current)=>selectedPageReusePlans(old,current,{combinedEditions});

test('lossless RGB reconstruction covers all five scanline filters',()=>{
 const options={dpi:25.4,footerMm:1},base=pngBodyFingerprint(png({width:17,height:13}),options);
 for(let filter=0;filter<5;filter++)assert.deepEqual(pngBodyFingerprint(png({width:17,height:13,filter}),options),base);
 assert.deepEqual(pngBodyFingerprint(png({width:17,height:13,filter:y=>y%5}),options),base);
});

test('tiny helper distinguishes body pixels, footer pixels and dimensions',()=>{
 const options={dpi:25.4,footerMm:1},base=pngBodyFingerprint(png({width:17,height:13}),options);
 const footer=pngBodyFingerprint(png({width:17,height:13,change:(b,w,h)=>{b[((h-1)*w+2)*3]=7;}}),options);
 const body=pngBodyFingerprint(png({width:17,height:13,change:b=>{b[0]=7;}}),options);
 assert.equal(footer.bodyHash,base.bodyHash);
 assert.notEqual(body.bodyHash,base.bodyHash);
 assert.notEqual(pngBodyFingerprint(png({width:18,height:13}),options).bodyHash,base.bodyHash);
 assert.throws(()=>pngBodyFingerprint(png({width:17,height:13}),{strictA4:true}),UnsupportedCandidateImage);
});

test('actual Poppler A4 rounding is accepted but differently sized bodies never match',()=>{
 const actual=pngBodyFingerprint(png({width:1190,height:1684}),{strictA4:true});
 const alternative=pngBodyFingerprint(png({width:1191,height:1684}),{strictA4:true});
 assert.equal(actual.width,1190);
 assert.notEqual(actual.bodyHash,alternative.bodyHash);
 assert.throws(()=>pngBodyFingerprint(png({width:1200,height:1684}),{strictA4:true}),UnsupportedCandidateImage);
});
test('invalid headers, CRCs, lengths, filters and trailing bytes fail closed',()=>{
 assert.throws(()=>pngBodyFingerprint(png({colourType:6})),UnsupportedCandidateImage);
 assert.throws(()=>pngBodyFingerprint(png({filter:5})),UnsupportedCandidateImage);
 const corrupt=png({width:17,height:13});corrupt[29]^=1;
 assert.throws(()=>pngBodyFingerprint(corrupt),UnsupportedCandidateImage);
 const truncated=png({width:17,height:13}).subarray(0,-1);
 assert.throws(()=>pngBodyFingerprint(truncated),UnsupportedCandidateImage);
 const trailing=Buffer.concat([png({width:17,height:13}),Buffer.from([0])]);
 assert.throws(()=>pngBodyFingerprint(trailing),UnsupportedCandidateImage);
 const oversized=png({width:17,height:13});oversized.writeUInt32BE(0xffffffff,8);
 assert.throws(()=>pngBodyFingerprint(oversized),UnsupportedCandidateImage);
});

test('footer-only changes retain original inspection with exact evidence',t=>{
 const f=fixture(t),old=f.queue({accepted:true}),current=f.queue({image:png({change:(b,w,h)=>{b[((h-1)*w+7)*3]=0;}})});
 const [plan]=plans(old,current);assert.ok(plan);
 assert.equal(plan.record.reuseKind,'selected-body');
 assert.equal(plan.record.originalActualReviewer,old.rows[0].review.reviewer);
 assert.deepEqual(plan.record.currentPageKeys,[current.rows[0].key]);
 assert.equal(plan.record.pageKeys,undefined);
 assert.equal(plan.record.presentationVerified,undefined);
 assert.deepEqual(plan.record.priorReview.artifact,old.rows[0].review.artifact);
 assert.equal(validateSelectedPageReuse(plan.record,current.rows[0],current.input),true);
 const evidence=selectedPageReuseArtifacts(plan.record,current.rows[0],current.input);
 for(const ref of [old.rows[0].review.artifact,old.rows[0].image,current.rows[0].image,f.source])assert.ok(evidence.some(r=>r.path===ref.path&&r.hash===ref.hash));
 // The caller persists a new immutable record rather than overwriting inspection.
 const retained=f.artifact(JSON.stringify(plan.record),'json');
 current.rows[0].review={outcome:'accepted',reviewer:plan.record.reviewer,note:plan.record.note,reuseKind:'selected-body',artifact:retained};
 const next=f.queue({image:png({change:(b,w,h)=>{b[((h-2)*w+7)*3]=0;}})});
 const [again]=plans(current,next);assert.ok(again);
 assert.deepEqual(again.record.priorReview.artifact,old.rows[0].review.artifact);
});

test('math, scaffold and header changes prevent reuse',t=>{
 const f=fixture(t),old=f.queue({accepted:true});
 for(const change of [b=>{b[0]=0;},(b,w)=>{b[(10*w+10)*3]=255;},(b,w)=>{b[(40*w+40)*3]=0;}])assert.deepEqual(plans(old,f.queue({image:png({change})})),[]);
});

test('current actual standalone inspection can cover an identical combined body',t=>{
 const f=fixture(t),current=f.queue({edition:'student-short'}),standalone=f.queue({accepted:true});
 current.rows.push(standalone.rows[0]);current.input.editions.student=standalone.input.editions.student;
 const [plan]=plans(null,current);assert.ok(plan);
 assert.equal(plan.record.priorRow.edition,'student');
 assert.equal(validateSelectedPageReuse(plan.record,current.rows[0],current.input),true);
});

test('old standalone can cover combined; unrelated standalone pages cannot',t=>{
 const f=fixture(t),old=f.queue({accepted:true});
 assert.equal(plans(old,f.queue({edition:'student-worked'})).length,1);
 assert.deepEqual(plans(old,f.queue({edition:'student',page:4})),[]);
 assert.deepEqual(plans(old,f.queue({edition:'short'})),[]);
});

test('development, legacy, changed sources, protected pages and failed reviews receive no retention',t=>{
 const f=fixture(t),old=f.queue({accepted:true});
 assert.deepEqual(plans(old,f.queue({mode:'development'})),[]);
 assert.deepEqual(plans(old,f.queue({profile:'legacy'})),[]);
 assert.deepEqual(plans(f.queue({accepted:true,profile:'legacy'}),f.queue()),[]);
 assert.deepEqual(plans(old,f.queue({sources:[f.artifact('changed original','pdf')]})),[]);
 assert.deepEqual(plans(old,f.queue({eligible:false})),[]);
 const failed=f.queue({accepted:true});failed.rows[0].review.outcome='needs-change';
 assert.deepEqual(plans(failed,f.queue()),[]);
 assert.deepEqual(plans(f.queue(),f.queue()),[]);
});

test('unsupported candidate geometry is no reuse, while stale evidence remains an error',t=>{
 const f=fixture(t),old=f.queue({accepted:true});
 assert.deepEqual(plans(old,f.queue({image:png({width:17,height:13})})),[]);
 const unsupported=f.queue({image:png({colourType:6})});assert.deepEqual(plans(old,unsupported),[]);
 fs.appendFileSync(old.rows[0].review.artifact.path,' ');
 assert.throws(()=>plans(old,unsupported),/stale/);
});

test('proof validation recomputes images and rejects reference and record tampering',t=>{
 const f=fixture(t),old=f.queue({accepted:true}),current=f.queue(),record=plans(old,current)[0].record;
 for(const mutate of [
  r=>{r.currentPageKeys=['another-key'];},
  r=>{r.currentRow.page=4;},
  r=>{r.priorRow.key='invented';},
  r=>{r.bodyFingerprint.bodyHash='0'.repeat(64);},
  r=>{r.originalActualReviewer='Automatic process';},
  r=>{r.sourceArtifacts=[];},
  r=>{r.currentManifests.student.hash='0'.repeat(64);},
  r=>{r.priorReview.reviewer='Other reviewer';}
 ]){const altered=clone(record);mutate(altered);assert.throws(()=>validateSelectedPageReuse(altered,current.rows[0],current.input));}
 fs.writeFileSync(current.rows[0].image.path,png({change:b=>{b[0]=0;}}));
 assert.throws(()=>validateSelectedPageReuse(record,current.rows[0],current.input),/stale/);
 assert.throws(()=>plans(old,current),/stale/);
});

test('old actual acceptance, profile, presentation and page membership are mandatory',t=>{
 const f=fixture(t);
 for(const mutate of [r=>{r.outcome='needs-change';},r=>{r.reviewProfile='legacy';},r=>{r.presentationVerified=false;},r=>{r.pageKeys=[];},r=>{r.reuseKind='selected-body';}]){
  const old=f.queue({accepted:true}),record=JSON.parse(fs.readFileSync(old.rows[0].review.artifact.path,'utf8'));mutate(record);
  old.rows[0].review.artifact=f.artifact(JSON.stringify(record),'json');
  assert.throws(()=>plans(old,f.queue()));
 }
});

test('current all-five full QA and fresh manifest bytes are mandatory',t=>{
 const f=fixture(t),old=f.queue({accepted:true});
 const missing=f.queue();delete missing.input.editions.worked;
 assert.throws(()=>plans(old,missing),/all-five/);
 const failed=f.queue(),ref=failed.input.editions.worked.manifest,manifest=JSON.parse(fs.readFileSync(ref.path,'utf8'));manifest.passed=false;
 failed.input.editions.worked.manifest=f.artifact(JSON.stringify(manifest),'json');
 assert.throws(()=>plans(old,failed),/passed full manifest/);
 const stale=f.queue();fs.appendFileSync(stale.input.editions.worked.manifest.path,' ');
 assert.throws(()=>plans(old,stale),/stale/);
});

test('candidate fingerprint cache is scoped to one operation',t=>{
 const f=fixture(t),old=f.queue({accepted:true}),current=f.queue();
 assert.equal(plans(old,current).length,1);
 fs.writeFileSync(old.rows[0].image.path,png({change:b=>{b[0]=0;}}));
 assert.throws(()=>plans(old,current),/stale/);
});

test('a changed selected body prevents automatic retention of its pagination neighbour',t=>{
 const f=fixture(t),old=f.queue({accepted:true,page:3}),oldNeighbour=f.queue({accepted:true,page:4});
 old.rows.push(oldNeighbour.rows[0]);
 const current=f.queue({page:3,image:png({change:b=>{b[0]=0;}})}),neighbour=f.queue({page:4});
 current.rows.push(neighbour.rows[0]);
 const entry=current.input.editions.student,manifest=JSON.parse(fs.readFileSync(entry.manifest.path,'utf8'));
 entry.images.push(neighbour.rows[0].image);manifest.images=entry.images;manifest.visualPages=[3,4];entry.manifest=f.artifact(JSON.stringify(manifest),'json');
 assert.deepEqual(plans(old,current),[]);
});
