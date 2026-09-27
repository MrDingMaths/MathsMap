// Persistent inspection bookkeeping. Hashes identify evidence; only explicit
// reviewer records establish inspection. Duplicate combined bodies may reuse a
// reviewed standalone page after PDF comparison and explicit composition review.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {artifactHash,projectReviewHash,affectedPages} from './page-review.mjs';
import {validatePdfRasters,validateEditionComparison} from './review-evidence-cache.mjs';
import {rendererSignature,contentAssetSignatures} from './verification-cache.mjs';
import {liveWorkflow,FINAL_EDITIONS} from './workflow-review.mjs';
import {withRunLock,beginRunPhase,endRunPhase} from './run-observability.mjs';
import {UNIQUE_LAYOUT_REVIEW,COMBINED_EDITIONS,COMPOSITION_CHECKS,validateCompositionReview} from './edition-comparison.mjs';

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const hash=value=>createHash('sha256').update(JSON.stringify(stable(value??null))).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const queueFile=runDir=>path.join(runDir,'visual-review','queue.json');
export function visualReviewConcurrency(value=1){
 if(!Number.isInteger(value)||value<1||value>3)throw Error('Visual review concurrency must be an integer from 1 to 3');
 return value;
}
// Keep the legacy active pointer populated while any opt-in claim is live.
// Old workers therefore remain exclusive and cannot enter a concurrent queue.
export const activeReviewClaims=queue=>queue?.activeReviews?.length?queue.activeReviews:queue?.active?[queue.active]:[];
function setActiveReviews(queue,claims){
 queue.active=claims[0]??null;
 if(claims.some(claim=>claim.visualConcurrency>1))queue.activeReviews=claims;else delete queue.activeReviews;
}
function validateActiveReviews(queue){
 if(!Object.hasOwn(queue,'activeReviews'))return;
 const claims=queue.activeReviews;
 if(!Array.isArray(claims)||!claims.length||hash(queue.active)!==hash(claims[0]))throw Error('Invalid concurrent review claims');
 const limit=visualReviewConcurrency(claims[0].visualConcurrency),ids=new Set(),keys=new Set();
 if(limit===1||claims.length>limit)throw Error('Invalid concurrent review capacity');
 for(const claim of claims){
  if(!claim.id||ids.has(claim.id)||claim.kind!=='pages'||claim.visualConcurrency!==limit||!claim.pageKeys?.length)throw Error('Invalid concurrent review ownership');
  ids.add(claim.id);
  for(const key of claim.pageKeys){if(keys.has(key)||!queue.rows.some(row=>row.key===key))throw Error('Overlapping or missing concurrent review pages');keys.add(key);}
 }
}
function checkArtifact(ref){if(!ref?.path||!path.isAbsolute(ref.path)||!fs.existsSync(ref.path)||artifactHash(ref.path)!==ref.hash)throw Error('Missing or stale review artifact: '+ref?.path);return ref;}
function checkReview(row){
 if(!row.review)return;
 const record=read(checkArtifact(row.review.artifact).path);
 if(!record.pageKeys?.includes(row.key)||['outcome','reviewer','note'].some(k=>record[k]!==row.review[k])||record.outcome==='accepted'&&!['sourceCompared','contentVerified','presentationVerified'].every(k=>record[k]===true))throw Error('Stored inspection does not match this page');
}

export async function reviewSnapshot(runDir,input,{renderer=rendererSignature(),workflow}={}) {
 if(!['final','development','review'].includes(input.mode))throw Error('Review queue mode must be final, development or review');
 const project=read(checkArtifact(input.project).path),projectHash=projectReviewHash(project);
 if(input.project.contentHash!==projectHash||input.renderer!==renderer)throw Error('Review project or renderer changed');
 const assets=await contentAssetSignatures(project);
 if(hash(assets)!==hash(input.assets)||Object.values(assets).some(a=>!a))throw Error('Review assets changed or are unavailable');
 if(!input.sourceArtifacts?.length)throw Error('Source evidence is required for visual review');
 input.sourceArtifacts.forEach(checkArtifact);
 const editions=Object.keys(input.editions??{});
 if(input.mode==='review'){
  if(project.library?.category!=='import-review'||project.sections?.some(s=>s.blocks?.some(b=>b.bankRef||b.canonicalId)))throw Error('Review-only inspection requires a local Import review project');
  if(FINAL_EDITIONS.some(e=>!editions.includes(e)))throw Error('Review-only acceptance requires all five editions');
 }
 if(!editions.length||editions.some(e=>!FINAL_EDITIONS.includes(e)))throw Error('Invalid review editions');
 if(input.mode==='final'){
  if(FINAL_EDITIONS.some(e=>!editions.includes(e)))throw Error('Final review requires all five editions');
  const state=workflow??liveWorkflow(runDir);
  if(!state.settled||state.settled.key!==input.key||state.settled.project.hash!==projectHash)throw Error('Review queue requires the current settled project');
 }
 if(input.reviewPolicy&&input.reviewPolicy!==UNIQUE_LAYOUT_REVIEW)throw Error('Unknown visual review policy');
 if(input.reviewPolicy&&!['final','review'].includes(input.mode))throw Error('Equivalent-page reuse requires final manifests');
 const comparison=input.reviewPolicy?validateEditionComparison(input.comparison,input.editions,{reviewOnly:input.mode==='review'}):null;
 const rows=[];
 for(const edition of editions){
  const entry=input.editions[edition],manifest=read(checkArtifact(entry.manifest).path);
  if(manifest.edition!==edition||manifest.projectHash!==projectHash||manifest.renderer!==renderer)throw Error('Render manifest dependencies changed: '+edition);
  if(hash(manifest.assets)!==hash(assets)||hash(manifest.images)!==hash(entry.images))throw Error('Render assets or page images do not match the manifest: '+edition);
  if(input.mode==='final'&&(manifest.mode!=='full'||manifest.passed!==true||manifest.workflowKey!==input.key))throw Error('Final queue requires a passed full manifest: '+edition);
  if(input.mode==='review'&&(manifest.mode!=='review'||manifest.reviewOnly!==true||manifest.passed!==true))throw Error('Review-only queue requires passed review manifests: '+edition);
  checkArtifact(manifest.pdf);
  validatePdfRasters(manifest);
  if(!manifest.pages?.length||entry.images?.length!==manifest.pages.length)throw Error('Every physical page needs a full-page image: '+edition);
  for(let i=0;i<manifest.pages.length;i++){
   const page=manifest.pages[i],image=entry.images[i];checkArtifact(image);
   if(page.page!==i+1||image.page!==page.page||typeof page.hash!=='string')throw Error('Page/image sequence is incomplete: '+edition);
   const key=hash({mode:input.mode,project:input.mode!=='development'?projectHash:null,settlement:input.mode==='final'?input.key:null,renderer,assets,sources:input.sourceArtifacts,edition,page:page.page,pageHash:page.hash,imageHash:image.hash,pdf:input.mode!=='development'?manifest.pdf.hash:null});
   rows.push({key,edition,page:page.page,pageHash:page.hash,image,sources:input.sourceArtifacts,...(comparison?{equivalentTo:comparison.matches[edition+':'+page.page]??null,inspectionReason:comparison.manual[edition+':'+page.page]??null}:{}),review:null});
  }
 }
 return {input,projectHash,sessionKey:hash(input),rows};
}

function saveQueue(runDir,state,event) {
 const file=queueFile(runDir);fs.mkdirSync(path.dirname(file),{recursive:true});
 const temporary=file+'.'+randomUUID()+'.tmp';fs.writeFileSync(temporary,JSON.stringify(state,null,2)+'\n',{flag:'wx'});fs.renameSync(temporary,file);
 fs.appendFileSync(path.join(path.dirname(file),'events.jsonl'),JSON.stringify({...event,revision:state.revision,at:new Date().toISOString()})+'\n');
}
async function current(runDir,deps){const queue=read(queueFile(runDir)),snapshot=await reviewSnapshot(runDir,queue.input,deps);const bare=rows=>rows.map(({review,...row})=>row);if(snapshot.sessionKey!==queue.sessionKey||hash(bare(queue.rows))!==hash(bare(snapshot.rows)))throw Error('Review queue is stale; prepare current inputs');queue.rows.forEach(checkReview);validateActiveReviews(queue);for(const [edition,review]of Object.entries(queue.compositionReviews??{}))validateCompositionReview(review,{edition,sessionKey:queue.sessionKey,comparison:queue.input.comparison,manifest:queue.input.editions[edition].manifest});return queue;}
function expected(queue,record){if(record.expectedRevision!==queue.revision||record.sessionKey!==queue.sessionKey)throw Error('Review request is stale; refresh queue status');}
function reused(queue,row){return row.review?.outcome!=='accepted'&&row.review?.outcome!=='needs-change'&&row.equivalentTo&&queue.compositionReviews?.[row.edition]&&queue.rows.some(r=>r.edition===row.equivalentTo.edition&&r.page===row.equivalentTo.page&&r.review?.outcome==='accepted');}
const covered=(queue,row)=>row.review?.outcome==='accepted'||reused(queue,row);
const summary=queue=>({revision:queue.revision,mode:queue.input.mode,sessionKey:queue.sessionKey,total:queue.rows.length,reviewed:queue.rows.filter(r=>r.review?.outcome==='accepted').length,reused:queue.rows.filter(r=>reused(queue,r)).length,pending:queue.rows.filter(r=>!covered(queue,r)&&(!r.equivalentTo||r.review?.outcome==='needs-change')).map(({review,...r})=>({...r,previousFinding:review?.note??null})),awaitingReuse:queue.rows.filter(r=>!covered(queue,r)&&r.equivalentTo&&r.review?.outcome!=='needs-change').map(({review,...r})=>r),pendingComposition:queue.input.reviewPolicy?COMBINED_EDITIONS.filter(e=>!queue.compositionReviews?.[e]):[],active:activeReviewClaims(queue)[0]??null,activeReviews:activeReviewClaims(queue)});

export async function prepareReviewQueue(runDir,input,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const snapshot=await reviewSnapshot(runDir,input,deps),old=fs.existsSync(queueFile(runDir))?read(queueFile(runDir)):null;
  if(activeReviewClaims(old).length)throw Error('Finish or cancel the active review before preparing another snapshot');
  const oldRows=new Map((old?.rows??[]).map(r=>[r.key,r])),neighbours=new Set();
  if(input.mode==='development'&&old)for(const edition of Object.keys(input.editions)){
   const pages=rows=>rows.filter(r=>r.edition===edition).map(r=>({page:r.page,hash:r.image.hash}));
   for(const p of affectedPages(pages(old.rows),pages(snapshot.rows)))neighbours.add(edition+':'+p);
  }
  const mayReuse=input.mode==='development'||old?.sessionKey===snapshot.sessionKey;
  for(const row of snapshot.rows)if(mayReuse&&!neighbours.has(row.edition+':'+row.page)){row.review=oldRows.get(row.key)?.review??null;checkReview(row);}
  const compositionReviews=old?.sessionKey===snapshot.sessionKey?old.compositionReviews??{}:{};
  for(const [edition,review]of Object.entries(compositionReviews))validateCompositionReview(review,{edition,sessionKey:snapshot.sessionKey,comparison:input.comparison,manifest:input.editions[edition].manifest});
  const queue={version:1,...snapshot,compositionReviews,revision:(old?.revision??0)+1,active:null};saveQueue(runDir,queue,{event:'prepared',sessionKey:queue.sessionKey});return summary(queue);
 });
}
export async function reviewQueueStatus(runDir,deps={}){return summary(await current(runDir,deps));}

export async function beginPageReview(runDir,record,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=await current(runDir,deps);expected(queue,record);
  const claims=activeReviewClaims(queue),limit=visualReviewConcurrency(record.visualConcurrency),composition=record.compositionEditions;
  if(claims.length&&(composition||limit===1||claims.some(claim=>claim.kind!=='pages'||claim.visualConcurrency!==limit)))throw Error('A review is already active; record it or cancel it first');
  if(composition){if(!queue.input.reviewPolicy||record.pageKeys||!composition.length||new Set(composition).size!==composition.length||composition.some(e=>!COMBINED_EDITIONS.includes(e)))throw Error('Select distinct combined editions for composition review');}
  else{
   if(!record.pageKeys?.length||new Set(record.pageKeys).size!==record.pageKeys.length||record.pageKeys.some(k=>!queue.rows.some(r=>r.key===k)))throw Error('Select distinct current page keys');
   if(claims.some(claim=>claim.pageKeys.some(key=>record.pageKeys.includes(key))))throw Error('Page review ownership overlaps an active claim');
   if(claims.length>=limit)throw Error('Visual page review concurrency limit reached');
  }
  const selection=composition?{kind:'composition',compositionEditions:composition}:{kind:'pages',pageKeys:record.pageKeys,...(limit>1?{visualConcurrency:limit}:{})};
  const id=beginRunPhase(runDir,composition?'composition-review':'visual-review',{mode:queue.input.mode,sessionKey:queue.sessionKey,...selection}),claim={id,...selection};
  setActiveReviews(queue,[...claims,claim]);queue.revision++;saveQueue(runDir,queue,{event:'review-started',...claim});return {...summary(queue),startedReviewId:id};
 });
}
export async function recordPageReview(runDir,record,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=await current(runDir,deps);expected(queue,record);
  const claims=activeReviewClaims(queue),active=claims.find(claim=>claim.id===record.reviewId);
  if(!active)throw Error('Begin this review before recording inspection');
  if(!record.reviewer?.trim()||!record.note?.trim()||!['accepted','needs-change'].includes(record.outcome))throw Error('Actual reviewer, note and outcome are required');
  const composition=active.kind==='composition';
  if(record.outcome==='accepted'&&!(composition?COMPOSITION_CHECKS.every(k=>record.compositionChecks?.[k]===true):['sourceCompared','contentVerified','presentationVerified'].every(k=>record[k]===true)))throw Error('Record '+(composition?'covers, contents, transitions, numbering, footers and links':'source, content and presentation')+' inspection explicitly');
  const evidence=path.join(runDir,'visual-review','inspection-'+active.id+'.json');
  fs.writeFileSync(evidence,JSON.stringify({...record,...active,sessionKey:queue.sessionKey,...(composition?{comparison:queue.input.comparison,manifests:Object.fromEntries(active.compositionEditions.map(e=>[e,queue.input.editions[e].manifest]))}:{}),recordedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
  const review={outcome:record.outcome,reviewer:record.reviewer,note:record.note,artifact:{path:path.resolve(evidence),hash:artifactHash(evidence)}};
  if(composition){for(const edition of active.compositionEditions){if(record.outcome==='accepted')queue.compositionReviews[edition]=review;else delete queue.compositionReviews[edition];}}
  else for(const row of queue.rows)if(active.pageKeys.includes(row.key))row.review=review;
  endRunPhase(runDir,active.id,{outcome:record.outcome,...(composition?{editionsInspected:active.compositionEditions.length}:{pagesInspected:active.pageKeys.length})});
  setActiveReviews(queue,claims.filter(claim=>claim.id!==active.id));queue.revision++;saveQueue(runDir,queue,{event:'inspection-recorded',reviewId:active.id,artifact:review.artifact});return summary(queue);
 });
}
export async function cancelPageReview(runDir,record) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=read(queueFile(runDir));expected(queue,record);validateActiveReviews(queue);
  const claims=activeReviewClaims(queue);
  if(!record.reviewId&&claims.length>1)throw Error('Select reviewId when cancelling concurrent reviews');
  const active=record.reviewId?claims.find(claim=>claim.id===record.reviewId):claims[0];
  if(!active)throw Error('No active review');
  endRunPhase(runDir,active.id,{ok:false,excludedFromActive:true,reason:'Cancelled; no inspection credited'});
  setActiveReviews(queue,claims.filter(claim=>claim.id!==active.id));queue.revision++;saveQueue(runDir,queue,{event:'review-cancelled',reviewId:active.id});return summary(queue);
 });
}

export async function finalReviewRecord(runDir,signer,deps={}) {
 return withRunLock(runDir,'visual-queue',async()=>{
  const queue=await current(runDir,deps);expected(queue,signer);
  if(queue.input.mode!=='final'||activeReviewClaims(queue).length||queue.rows.some(r=>!covered(queue,r))||summary(queue).pendingComposition.length)throw Error('Every page of the current final settlement needs inspection or verified reuse, plus combined-edition composition review');
  if(!signer.reviewer?.trim()||!signer.note?.trim())throw Error('Final reviewer and note are required');
  for(const row of queue.rows)if(row.review)checkArtifact(row.review.artifact);
  const evidence=path.resolve(runDir,'visual-review','completed-'+randomUUID()+'.json');fs.writeFileSync(evidence,JSON.stringify(queue,null,2)+'\n',{flag:'wx'});
  const artifact={path:evidence,hash:artifactHash(evidence)},editions={};
  for(const edition of FINAL_EDITIONS){const rows=queue.rows.filter(r=>r.edition===edition);editions[edition]={allPagesVisuallyInspected:rows.every(r=>r.review?.outcome==='accepted'),allPagesCovered:true,manifest:queue.input.editions[edition].manifest,artifacts:[artifact],pages:rows.map(r=>({page:r.page,hash:r.pageHash,checked:true,...(queue.input.reviewPolicy?(r.review?.outcome==='accepted'?{reviewMethod:'visual'}:{reviewMethod:'equivalent',equivalentTo:r.equivalentTo}):{})}))};}
  // Keep the underlying evidence in the existing acceptance register, so later
  // source/image/inspection edits invalidate acceptance as well as queue status.
  const assetArtifacts=Object.keys(queue.input.assets).filter(src=>!src.startsWith('data:')).map(src=>{
   const relative=src.replace(/^\//,''),file=[path.join('public',relative),relative].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
   return checkArtifact({path:path.resolve(file),hash:queue.input.assets[src]});
  });
  const comparisonArtifacts=queue.input.reviewPolicy?validateEditionComparison(queue.input.comparison,queue.input.editions).artifacts:[];
  const artifacts=[artifact,...queue.input.sourceArtifacts,...assetArtifacts,...queue.rows.flatMap(r=>[r.image,...(r.review?[r.review.artifact]:[])]),...comparisonArtifacts,...Object.values(queue.compositionReviews??{}).map(r=>r.artifact)];
  return {reviewer:signer.reviewer,note:signer.note,artifacts:[...new Map(artifacts.map(a=>[a.path,a])).values()],key:queue.input.key,sourceCompared:true,contentVerified:true,presentationVerified:true,editions,...(queue.input.reviewPolicy?{reviewPolicy:queue.input.reviewPolicy,sessionKey:queue.sessionKey,comparison:queue.input.comparison,compositionReviews:queue.compositionReviews}:{} )};
 });
}
