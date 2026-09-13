// Persistent inspection bookkeeping. Hashes identify evidence; only explicit
// reviewer records establish inspection, and new final settlement resets all pages.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {artifactHash,projectReviewHash,affectedPages} from './page-review.mjs';
import {rendererSignature,contentAssetSignatures} from './verification-cache.mjs';
import {liveWorkflow,FINAL_EDITIONS} from './workflow-review.mjs';
import {withRunLock,beginRunPhase,endRunPhase} from './run-observability.mjs';

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const hash=value=>createHash('sha256').update(JSON.stringify(stable(value??null))).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const queueFile=runDir=>path.join(runDir,'visual-review','queue.json');
function checkArtifact(ref){if(!ref?.path||!path.isAbsolute(ref.path)||!fs.existsSync(ref.path)||artifactHash(ref.path)!==ref.hash)throw Error('Missing or stale review artifact: '+ref?.path);return ref;}
function checkReview(row){
 if(!row.review)return;
 const record=read(checkArtifact(row.review.artifact).path);
 if(!record.pageKeys?.includes(row.key)||['outcome','reviewer','note'].some(k=>record[k]!==row.review[k])||record.outcome==='accepted'&&!['sourceCompared','contentVerified','presentationVerified'].every(k=>record[k]===true))throw Error('Stored inspection does not match this page');
}

export async function reviewSnapshot(runDir,input,{renderer=rendererSignature(),workflow}={}) {
 if(!['final','development'].includes(input.mode))throw Error('Review queue mode must be final or development');
 const project=read(checkArtifact(input.project).path),projectHash=projectReviewHash(project);
 if(input.project.contentHash!==projectHash||input.renderer!==renderer)throw Error('Review project or renderer changed');
 const assets=await contentAssetSignatures(project);
 if(hash(assets)!==hash(input.assets)||Object.values(assets).some(a=>!a))throw Error('Review assets changed or are unavailable');
 if(!input.sourceArtifacts?.length)throw Error('Source evidence is required for visual review');
 input.sourceArtifacts.forEach(checkArtifact);
 const editions=Object.keys(input.editions??{});
 if(!editions.length||editions.some(e=>!FINAL_EDITIONS.includes(e)))throw Error('Invalid review editions');
 if(input.mode==='final'){
  if(FINAL_EDITIONS.some(e=>!editions.includes(e)))throw Error('Final review requires all five editions');
  const state=workflow??liveWorkflow(runDir);
  if(!state.settled||state.settled.key!==input.key||state.settled.project.hash!==projectHash)throw Error('Review queue requires the current settled project');
 }
 const rows=[];
 for(const edition of editions){
  const entry=input.editions[edition],manifest=read(checkArtifact(entry.manifest).path);
  if(manifest.edition!==edition||manifest.projectHash!==projectHash||manifest.renderer!==renderer)throw Error('Render manifest dependencies changed: '+edition);
  if(hash(manifest.assets)!==hash(assets)||hash(manifest.images)!==hash(entry.images))throw Error('Render assets or page images do not match the manifest: '+edition);
  if(input.mode==='final'&&(manifest.mode!=='full'||manifest.passed!==true||manifest.workflowKey!==input.key))throw Error('Final queue requires a passed full manifest: '+edition);
  checkArtifact(manifest.pdf);
  if(!manifest.pages?.length||entry.images?.length!==manifest.pages.length)throw Error('Every physical page needs a full-page image: '+edition);
  for(let i=0;i<manifest.pages.length;i++){
   const page=manifest.pages[i],image=entry.images[i];checkArtifact(image);
   if(page.page!==i+1||image.page!==page.page||typeof page.hash!=='string')throw Error('Page/image sequence is incomplete: '+edition);
   const key=hash({mode:input.mode,project:input.mode==='final'?projectHash:null,settlement:input.mode==='final'?input.key:null,renderer,assets,sources:input.sourceArtifacts,edition,page:page.page,pageHash:page.hash,imageHash:image.hash,pdf:input.mode==='final'?manifest.pdf.hash:null});
   rows.push({key,edition,page:page.page,pageHash:page.hash,image,sources:input.sourceArtifacts,review:null});
  }
 }
 return {input,projectHash,sessionKey:hash(input),rows};
}

function saveQueue(runDir,state,event) {
 const file=queueFile(runDir);fs.mkdirSync(path.dirname(file),{recursive:true});
 const temporary=file+'.'+randomUUID()+'.tmp';fs.writeFileSync(temporary,JSON.stringify(state,null,2)+'\n',{flag:'wx'});fs.renameSync(temporary,file);
 fs.appendFileSync(path.join(path.dirname(file),'events.jsonl'),JSON.stringify({...event,revision:state.revision,at:new Date().toISOString()})+'\n');
}
async function current(runDir,deps){const queue=read(queueFile(runDir)),snapshot=await reviewSnapshot(runDir,queue.input,deps);const bare=rows=>rows.map(({review,...row})=>row);if(snapshot.sessionKey!==queue.sessionKey||hash(bare(queue.rows))!==hash(bare(snapshot.rows)))throw Error('Review queue is stale; prepare current inputs');queue.rows.forEach(checkReview);return queue;}
function expected(queue,record){if(record.expectedRevision!==queue.revision||record.sessionKey!==queue.sessionKey)throw Error('Review request is stale; refresh queue status');}
const summary=queue=>({revision:queue.revision,mode:queue.input.mode,sessionKey:queue.sessionKey,total:queue.rows.length,reviewed:queue.rows.filter(r=>r.review?.outcome==='accepted').length,pending:queue.rows.filter(r=>r.review?.outcome!=='accepted').map(({review,...r})=>({...r,previousFinding:review?.note??null})),active:queue.active});

export async function prepareReviewQueue(runDir,input,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const snapshot=await reviewSnapshot(runDir,input,deps),old=fs.existsSync(queueFile(runDir))?read(queueFile(runDir)):null;
  if(old?.active)throw Error('Finish or cancel the active review before preparing another snapshot');
  const oldRows=new Map((old?.rows??[]).map(r=>[r.key,r])),neighbours=new Set();
  if(input.mode==='development'&&old)for(const edition of Object.keys(input.editions)){
   const pages=rows=>rows.filter(r=>r.edition===edition).map(r=>({page:r.page,hash:r.image.hash}));
   for(const p of affectedPages(pages(old.rows),pages(snapshot.rows)))neighbours.add(edition+':'+p);
  }
  const mayReuse=input.mode==='development'||old?.sessionKey===snapshot.sessionKey;
  for(const row of snapshot.rows)if(mayReuse&&!neighbours.has(row.edition+':'+row.page)){row.review=oldRows.get(row.key)?.review??null;checkReview(row);}
  const queue={version:1,...snapshot,revision:(old?.revision??0)+1,active:null};saveQueue(runDir,queue,{event:'prepared',sessionKey:queue.sessionKey});return summary(queue);
 });
}
export async function reviewQueueStatus(runDir,deps={}){return summary(await current(runDir,deps));}

export async function beginPageReview(runDir,record,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=await current(runDir,deps);expected(queue,record);
  if(queue.active)throw Error('A review is already active; record it or cancel it first');
  if(!record.pageKeys?.length||new Set(record.pageKeys).size!==record.pageKeys.length||record.pageKeys.some(k=>!queue.rows.some(r=>r.key===k)))throw Error('Select distinct current page keys');
  const id=beginRunPhase(runDir,'visual-review',{mode:queue.input.mode,sessionKey:queue.sessionKey,pageKeys:record.pageKeys});
  queue.active={id,pageKeys:record.pageKeys};queue.revision++;saveQueue(runDir,queue,{event:'review-started',...queue.active});return summary(queue);
 });
}
export async function recordPageReview(runDir,record,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=await current(runDir,deps);expected(queue,record);
  if(!queue.active||record.reviewId!==queue.active.id)throw Error('Begin this review before recording inspection');
  if(!record.reviewer?.trim()||!record.note?.trim()||!['accepted','needs-change'].includes(record.outcome))throw Error('Actual reviewer, note and outcome are required');
  if(record.outcome==='accepted'&&!['sourceCompared','contentVerified','presentationVerified'].every(k=>record[k]===true))throw Error('Record source, content and presentation inspection explicitly');
  const evidence=path.join(runDir,'visual-review','inspection-'+queue.active.id+'.json');
  fs.writeFileSync(evidence,JSON.stringify({...record,pageKeys:queue.active.pageKeys,recordedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
  const review={outcome:record.outcome,reviewer:record.reviewer,note:record.note,artifact:{path:path.resolve(evidence),hash:artifactHash(evidence)}};
  for(const row of queue.rows)if(queue.active.pageKeys.includes(row.key))row.review=review;
  endRunPhase(runDir,queue.active.id,{outcome:record.outcome,pagesInspected:queue.active.pageKeys.length});
  queue.active=null;queue.revision++;saveQueue(runDir,queue,{event:'inspection-recorded',artifact:review.artifact});return summary(queue);
 });
}
export async function cancelPageReview(runDir,record) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=read(queueFile(runDir));expected(queue,record);if(!queue.active)throw Error('No active review');
  endRunPhase(runDir,queue.active.id,{ok:false,excludedFromActive:true,reason:'Cancelled; no inspection credited'});
  queue.active=null;queue.revision++;saveQueue(runDir,queue,{event:'review-cancelled'});return summary(queue);
 });
}

export async function finalReviewRecord(runDir,signer,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=await current(runDir,deps);expected(queue,signer);
  if(queue.input.mode!=='final'||queue.active||queue.rows.some(r=>r.review?.outcome!=='accepted'))throw Error('Every page of the current final settlement must be inspected');
  if(!signer.reviewer?.trim()||!signer.note?.trim())throw Error('Final reviewer and note are required');
  for(const row of queue.rows)checkArtifact(row.review.artifact);
  const evidence=path.resolve(runDir,'visual-review','completed-'+randomUUID()+'.json');fs.writeFileSync(evidence,JSON.stringify(queue,null,2)+'\n',{flag:'wx'});
  const artifact={path:evidence,hash:artifactHash(evidence)},editions={};
  for(const edition of FINAL_EDITIONS)editions[edition]={allPagesVisuallyInspected:true,manifest:queue.input.editions[edition].manifest,artifacts:[artifact],pages:queue.rows.filter(r=>r.edition===edition).map(r=>({page:r.page,hash:r.pageHash,checked:true}))};
  // Keep the underlying evidence in the existing acceptance register, so later
  // source/image/inspection edits invalidate acceptance as well as queue status.
  const assetArtifacts=Object.keys(queue.input.assets).filter(src=>!src.startsWith('data:')).map(src=>{
   const relative=src.replace(/^\//,''),file=[path.join('public',relative),relative].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
   return checkArtifact({path:path.resolve(file),hash:queue.input.assets[src]});
  });
  const artifacts=[artifact,...queue.input.sourceArtifacts,...assetArtifacts,...queue.rows.flatMap(r=>[r.image,r.review.artifact])];
  return {reviewer:signer.reviewer,note:signer.note,artifacts:[...new Map(artifacts.map(a=>[a.path,a])).values()],key:queue.input.key,sourceCompared:true,contentVerified:true,presentationVerified:true,editions};
 });
}
