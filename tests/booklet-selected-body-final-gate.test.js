import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {LEAN_REVIEW_PROFILE} from '../scripts/booklet/lean-profile.mjs';
import {artifactHash,projectReviewHash,validateFinalManifest} from '../scripts/booklet/page-review.mjs';
import {ensureSelectedPdfRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {pngBodyFingerprint} from '../scripts/booklet/selected-page-review-reuse.mjs';

const editions=['student','short','worked','with-short','with-worked'];
const ref=file=>({path:path.resolve(file),hash:artifactHash(file)});
const clone=value=>structuredClone(value);
const pageKey=(edition,page,imageHash)=>createHash('sha256').update(JSON.stringify({edition,imageHash,page})).digest('hex');
const crcTable=Array.from({length:256},(_,value)=>{for(let i=0;i<8;i++)value=(value&1)?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
function chunk(type,payload){
 const name=Buffer.from(type),result=Buffer.alloc(payload.length+12);result.writeUInt32BE(payload.length);name.copy(result,4);payload.copy(result,8);
 let crc=0xffffffff;for(const byte of Buffer.concat([name,payload]))crc=crcTable[(crc^byte)&255]^(crc>>>8);
 result.writeUInt32BE((crc^0xffffffff)>>>0,result.length-4);return result;
}
function fixturePng(){
 const width=1191,height=1684,header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 const raw=Buffer.alloc((width*3+1)*height,255);for(let y=0;y<height;y++)raw[y*(width*3+1)]=0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
const png=fixturePng();
const accepted={outcome:'accepted',reviewer:'Synthetic fixture',note:'Test evidence only; no production inspection.'};
const identity=row=>({key:row.key,edition:row.edition,page:row.page,image:clone(row.image),sources:clone(row.sources)});

async function fixture(t,target=3){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'selected-body-gate-'));
 t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const write=(name,value)=>{const file=path.join(dir,name);fs.writeFileSync(file,Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value));return file;};
 const project={id:'selected-body-fixture',source:{reviewProfile:LEAN_REVIEW_PROFILE},settings:{},sections:[]};
 const projectFile=write('project.json',project),projectHash=projectReviewHash(project),sourceFile=write('source.txt','Original source fixture');
 const input={reviewProfile:LEAN_REVIEW_PROFILE,mode:'final',key:'fixture-settlement',renderer:'fixture-renderer',project:{...ref(projectFile),contentHash:projectHash},assets:{},sourceArtifacts:[ref(sourceFile)],editions:{}};
 const manifests={},rows=[],visualPages=[1,2,3,4,5,6,7];
 for(const edition of editions){
  const pdf=ref(write(edition+'.pdf','Synthetic PDF '+edition));
  const raster=await ensureSelectedPdfRasters(pdf,7,path.join(dir,'rasters'),{pages:visualPages,engine:'fixture',renderRange:async(_,first,last)=>Array.from({length:last-first+1},(_,i)=>({page:first+i,bytes:png}))});
  const manifest={version:2,reviewProfile:LEAN_REVIEW_PROFILE,mode:'full',passed:true,edition,projectHash,renderer:input.renderer,workflowKey:input.key,assets:{},pdf,pages:visualPages.map(page=>({page,hash:edition+'-page-'+page})),visualPages,images:raster.images,rasterization:raster.rasterization};
  manifests[edition]=manifest;input.editions[edition]={manifest:ref(write(edition+'.json',manifest)),images:raster.images};
  for(const image of raster.images){
   const row={edition,page:image.page,pageHash:manifest.pages[image.page-1].hash,image:clone(image),sources:clone(input.sourceArtifacts),selectedBodyEligible:true};
   row.key=pageKey(edition,row.page,image.hash);
   const actual={...accepted,reviewProfile:LEAN_REVIEW_PROFILE,presentationVerified:true,pageKeys:[row.key],sourceArtifacts:clone(input.sourceArtifacts)};
   row.review={...accepted,artifact:ref(write(edition+'-'+row.page+'-actual.json',actual))};rows.push(row);
  }
 }
 const row=rows.find(row=>row.edition==='student'&&row.page===target);
 const priorRow={...identity(row),image:{...clone(row.image),...ref(write('prior-page.png',png))}};
 priorRow.key=pageKey(priorRow.edition,priorRow.page,priorRow.image.hash);
 const priorActual={...accepted,reviewProfile:LEAN_REVIEW_PROFILE,presentationVerified:true,pageKeys:[priorRow.key],sourceArtifacts:clone(input.sourceArtifacts)};
 const priorFile=write('prior-actual.json',priorActual),priorReview={...accepted,artifact:ref(priorFile)};
 const proof={...accepted,reuseKind:'selected-body',reviewProfile:LEAN_REVIEW_PROFILE,originalActualReviewer:accepted.reviewer,currentPageKeys:[row.key],currentRow:identity(row),priorRow,priorReview,sourceArtifacts:clone(input.sourceArtifacts),currentManifests:Object.fromEntries(editions.map(edition=>[edition,clone(input.editions[edition].manifest)])),bodyFingerprint:pngBodyFingerprint(png,{dpi:144,footerMm:15,strictA4:true}),combinedEditions:[]};
 const proofFile=write('proof.json',proof);
 row.review={...accepted,reuseKind:'selected-body',artifact:ref(proofFile)};
 const queue={input,rows},queueFile=write('completed.json',queue);
 const review={allPagesVisuallyInspected:false,allPagesCovered:true,manifest:clone(input.editions.student.manifest),visualPages:clone(visualPages),artifacts:[ref(queueFile)],pages:manifests.student.pages.map(page=>({...page,checked:true,reviewMethod:page.page===target?'selected-body':'visual',...(page.page===target?{reuseKind:'selected-body',provenance:clone(row.review.artifact)}:{})}))};
 const options={edition:'student',key:input.key,projectHash,renderer:input.renderer};
 const saveQueue=()=>{write('completed.json',queue);review.artifacts=[ref(queueFile)];};
 const saveProof=()=>{write('proof.json',proof);row.review.artifact=ref(proofFile);review.pages[target-1].provenance=clone(row.review.artifact);saveQueue();};
 const saveManifest=edition=>{input.editions[edition].manifest=ref(write(edition+'.json',manifests[edition]));if(edition==='student')review.manifest=clone(input.editions.student.manifest);proof.currentManifests[edition]=clone(input.editions[edition].manifest);saveProof();};
 return {dir,write,input,manifests,rows,row,queue,review,proof,proofFile,priorActual,priorFile,sourceFile,options,saveQueue,saveProof,saveManifest,gate:()=>validateFinalManifest(review,options)};
}

test('exact completed queue accepts selected-body semantics and retains full proof closure',async t=>{
 const f=await fixture(t),artifacts=f.gate();
 const contains=reference=>artifacts.some(item=>item.path===reference.path&&item.hash===reference.hash);
 for(const reference of [f.review.manifest,f.manifests.student.pdf,...f.manifests.student.images,f.review.artifacts[0],f.row.review.artifact,f.proof.priorReview.artifact,f.proof.priorRow.image,f.proof.currentRow.image,...f.proof.sourceArtifacts,...Object.values(f.proof.currentManifests)])assert.ok(contains(reference),reference.path);
 assert.equal(f.review.pages[2].reviewMethod,'selected-body');assert.equal(f.review.pages[2].reuseKind,'selected-body');assert.deepEqual(f.review.pages[2].provenance,f.row.review.artifact);
});

test('visual-only acceptance requires no queue or retention checks',async t=>{
 const f=await fixture(t);f.review.pages[2]={page:3,hash:f.manifests.student.pages[2].hash,checked:true,reviewMethod:'visual'};delete f.review.artifacts;
 assert.doesNotThrow(f.gate);
});

test('missing proof or completed queue is rejected',async t=>{
 const f=await fixture(t);delete f.review.pages[2].provenance;assert.throws(f.gate,/immutable proof/);
 f.review.pages[2].provenance=clone(f.row.review.artifact);f.review.artifacts=[];assert.throws(f.gate,/completed queue/);
});

test('proof must be the exact row artifact, with unchanged bytes',async t=>{
 const f=await fixture(t);f.review.pages[2].provenance=ref(f.write('orphan-proof.json',f.proof));assert.throws(f.gate,/orphaned/);
 f.review.pages[2].provenance=clone(f.row.review.artifact);fs.appendFileSync(f.proofFile,' ');assert.throws(f.gate,/stale final review evidence/);
});

test('completed queue reference requires its full current hash',async t=>{
 const f=await fixture(t);fs.appendFileSync(f.review.artifacts[0].path,' ');assert.throws(f.gate,/stale completed queue/);
});

test('wrong edition, page hash and image membership are rejected',async t=>{
 for(const defect of ['edition','pageHash','image']){
  const f=await fixture(t);
  if(defect==='edition')f.row.edition='short';
  if(defect==='pageHash')f.row.pageHash='different-page';
  if(defect==='image')f.row.image={...f.row.image,path:f.proof.priorRow.image.path};
  f.saveQueue();assert.throws(f.gate,/exact selected page/);
 }
});

test('current key, project, renderer and all-five manifest closure are required',async t=>{
 for(const defect of ['key','project','renderer','edition-count','passed','manifest-reference']){
  const f=await fixture(t);
  if(defect==='key')f.input.key='different-settlement';
  if(defect==='project')f.input.project.contentHash='different-project';
  if(defect==='renderer')f.input.renderer='different-renderer';
  if(defect==='edition-count')delete f.input.editions.worked;
  if(defect==='passed'){f.manifests.worked.passed=false;f.saveManifest('worked');}
  if(defect==='manifest-reference')f.input.editions.student.manifest=ref(f.write('other-student.json',f.manifests.student));
  f.saveQueue();assert.throws(f.gate,/current lean|current five|stale edition/);
 }
});

test('changed original source and a non-actual origin are rejected',async t=>{
 const source=await fixture(t);fs.writeFileSync(source.sourceFile,'Changed original source');assert.throws(source.gate,/stale selected-page evidence/);
 const origin=await fixture(t);origin.priorActual.presentationVerified=false;fs.writeFileSync(origin.priorFile,JSON.stringify(origin.priorActual));origin.proof.priorReview.artifact=ref(origin.priorFile);origin.saveProof();assert.throws(origin.gate,/actual lean inspection/);
});

test('cover, answer-boundary and physical neighbours cannot inherit forged eligibility',async t=>{
 for(const target of [1,2,6,7]){const f=await fixture(t,target);assert.equal(f.row.selectedBodyEligible,true);assert.throws(f.gate,/physical neighbour/);}
 for(const [page,field]of [[2,'isCover'],[3,'isCover'],[4,'isCover'],[2,'answerSectionStart'],[3,'answerSectionStart'],[4,'answerSectionStart']]){
  const f=await fixture(t);f.manifests.student.pages[page-1][field]=true;f.saveManifest('student');assert.throws(f.gate,/physical neighbour/);
 }
 const transition=await fixture(t);transition.manifests.student.pages[3].isAnswer=true;transition.manifests.student.pages[3].mode='short';transition.saveManifest('student');assert.throws(transition.gate,/physical neighbour/);
});

test('legacy, loose method claims and relabelled retention are rejected',async t=>{
 const legacy=await fixture(t);delete legacy.manifests.student.reviewProfile;legacy.saveManifest('student');delete legacy.review.visualPages;assert.throws(legacy.gate,/three-pass manifest/);
 const loose=await fixture(t);delete loose.review.pages[2].reuseKind;assert.throws(loose.gate,/immutable proof/);
 const renamed=await fixture(t);renamed.review.pages[2].reviewMethod='visual';assert.throws(renamed.gate,/actual visual inspection/);
});

test('existing PDF, raster and required-selection gates remain enforced',async t=>{
 const pdf=await fixture(t);fs.appendFileSync(pdf.manifests.student.pdf.path,' changed');assert.throws(pdf.gate,/Final PDF changed/);
 const raster=await fixture(t);fs.appendFileSync(raster.row.image.path,' changed');assert.throws(raster.gate);
 const selection=await fixture(t);selection.review.pages[0].reviewMethod='automated';assert.throws(selection.gate,/actual visual inspection/);
});
