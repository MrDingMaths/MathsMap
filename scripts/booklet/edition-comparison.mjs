// Compare actual PDF pixels, never DOM/source hashes. Only duplicate combined
// page bodies can inherit a standalone inspection; composition stays explicit.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gzipSync,gunzipSync} from 'node:zlib';
import {artifactHash} from './page-review.mjs';
import {validatePdfRasters} from './pdf-rasters.mjs';

export const UNIQUE_LAYOUT_REVIEW='unique-layouts-v1';
export const BASE_EDITIONS=['student','short','worked'];
export const COMBINED_EDITIONS=['with-short','with-worked'];
export const COMPOSITION_CHECKS=['covers','contents','transitions','numbering','footers','links'];
const EDITIONS=[...BASE_EDITIONS,...COMBINED_EDITIONS];
const DPI=144,FOOTER_MM=15;
const implementation=fileURLToPath(import.meta.url);
const measuredRasters=new Map();
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const reference=file=>({path:path.resolve(file),hash:artifactHash(file)});
const same=(a,b)=>a?.path===b?.path&&a?.hash===b?.hash;
function current(ref){if(!ref?.path||!path.isAbsolute(ref.path)||!fs.existsSync(ref.path)||artifactHash(ref.path)!==ref.hash)throw Error('Missing or stale PDF comparison evidence: '+ref?.path);return ref;}

// P6 is Poppler's lossless RGB output. Do not skip whitespace after the single
// header delimiter: a first pixel may itself contain a whitespace byte.
export function fingerprintPpm(bytes){
 let offset=0;
 const token=()=>{
  while(offset<bytes.length){if(bytes[offset]===35){while(offset<bytes.length&&bytes[offset]!==10)offset++;}else if(/\s/.test(String.fromCharCode(bytes[offset])))offset++;else break;}
  const start=offset;while(offset<bytes.length&&!/\s/.test(String.fromCharCode(bytes[offset])))offset++;
  return bytes.toString('ascii',start,offset);
 };
 const magic=token(),width=Number(token()),height=Number(token()),max=Number(token());
 if(magic!=='P6'||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>20000000||max!==255||offset>=bytes.length)throw Error('Invalid PDF RGB raster');
 if(bytes[offset]===13&&bytes[offset+1]===10)offset+=2;else offset++;
 const pixels=bytes.subarray(offset);
 if(pixels.length!==width*height*3)throw Error('Incomplete PDF RGB raster');
 const bodyHeight=height-Math.ceil(FOOTER_MM*DPI/25.4);
 // This booklet policy is A4 portrait only. Other dimensions require inspection.
 const a4=Math.abs(width-210*DPI/25.4)<=2&&Math.abs(height-297*DPI/25.4)<=2;
 return {width,height,bodyHeight,a4,bodyHash:digest(Buffer.concat([Buffer.from(`${width}:${height}:${bodyHeight}:`),pixels.subarray(0,Math.max(0,bodyHeight)*width*3)]))};
}

export function renderPdfPage(pdf,page){
 const result=spawnSync('pdftoppm',['-r',String(DPI),'-f',String(page),'-l',String(page),'-singlefile',pdf],{windowsHide:true,maxBuffer:64*1024*1024});
 if(result.error||result.status!==0)throw Error('PDF pixel comparison requires Poppler: '+(result.error?.message??result.stderr?.toString()));
 fingerprintPpm(result.stdout);return result.stdout;
}
function popplerVersion(){const r=spawnSync('pdftoppm',['-v'],{windowsHide:true,encoding:'utf8'});if(r.error||r.status!==0)throw Error('PDF comparison requires pdftoppm');return (r.stderr+r.stdout).trim();}

function manifestsFor(editions,{reviewOnly=false}={}){
 const manifests={};
 for(const edition of EDITIONS){
  const ref=current(editions?.[edition]?.manifest),m=read(ref.path);
  if(m.mode!==(reviewOnly?'review':'full')||(reviewOnly&&m.reviewOnly!==true)||m.passed!==true||m.edition!==edition||!m.pages?.length||m.pages.some((p,i)=>p.page!==i+1))throw Error('PDF comparison requires all five passed '+(reviewOnly?'review-only':'full')+' manifests');
  current(m.pdf);validatePdfRasters(m);manifests[edition]=m;
 }
 const first=manifests.student;
 if(EDITIONS.some(e=>['projectHash','renderer','workflowKey'].some(k=>manifests[e][k]!==first[k])))throw Error('PDF comparison editions have different dependencies');
 return manifests;
}

// Cache only immutable rendered bytes, with PDF, engine and implementation keys.
// A corrupt cached raster is regenerated, never credited as a match.
export async function buildEditionComparison(editions,outDir,{render=renderPdfPage,engine=popplerVersion(),onProgress=()=>{},reviewOnly=false}={}){
 const manifests=manifestsFor(editions,{reviewOnly}),algorithm=reference(implementation);
 fs.mkdirSync(outDir,{recursive:true});
 const report={version:1,policy:UNIQUE_LAYOUT_REVIEW,dpi:DPI,footerMm:FOOTER_MM,algorithm,engine,...(reviewOnly?{reviewOnly:true}:{}),editions:{}};
 let rendered=0,reused=0;
 for(const edition of EDITIONS){
  const m=manifests[edition],pages=[];
  for(const p of m.pages){
   if(m.version===2){
    const raster=m.images[p.page-1].raster,pixels=gunzipSync(fs.readFileSync(current(raster).path));
    pages.push({page:p.page,raster,...fingerprintPpm(pixels)});reused++;
    onProgress({edition,page:p.page,pages:m.pages.length,rendered,reused});continue;
   }
   const cacheKey=digest(JSON.stringify({pdf:m.pdf.hash,page:p.page,algorithm:algorithm.hash,engine,dpi:DPI}));
   const file=path.resolve(outDir,cacheKey+'.ppm.gz'),receipt=file+'.json';let pixels;
   if(fs.existsSync(file)&&fs.existsSync(receipt))try{const cached=read(receipt);if(cached.key!==cacheKey||cached.hash!==artifactHash(file))throw Error('Stale raster cache');pixels=gunzipSync(fs.readFileSync(file));fingerprintPpm(pixels);}catch{pixels=null;}
   if(pixels)reused++;else{pixels=await render(m.pdf.path,p.page);fingerprintPpm(pixels);fs.writeFileSync(file,gzipSync(pixels));fs.writeFileSync(receipt,JSON.stringify({key:cacheKey,hash:artifactHash(file)}));rendered++;}
   pages.push({page:p.page,raster:reference(file),...fingerprintPpm(pixels)});
   onProgress({edition,page:p.page,pages:m.pages.length,rendered,reused});
  }
  report.editions[edition]={manifest:editions[edition].manifest,pdf:m.pdf,pages};
 }
 const bytes=JSON.stringify(report,null,2)+'\n',file=path.resolve(outDir,'comparison-'+digest(bytes)+'.json');
 if(!fs.existsSync(file))fs.writeFileSync(file,bytes,{flag:'wx'});
 else if(fs.readFileSync(file,'utf8')!==bytes)throw Error('Retained PDF comparison report changed');
 return {reference:reference(file),rendered,reused};
}

// Recompute the pixel fingerprints from retained full rasters. A passed flag or
// caller-supplied body hash never establishes equivalence.
export function validateEditionComparison(ref,editions,{reviewOnly=false}={}){
 const report=read(current(ref).path),manifests=manifestsFor(editions,{reviewOnly});
 if((report.reviewOnly===true)!==reviewOnly)throw Error('Review-only comparison cannot establish final acceptance');
 if(report.policy!==UNIQUE_LAYOUT_REVIEW||report.version!==1||report.dpi!==DPI||report.footerMm!==FOOTER_MM||!same(report.algorithm,reference(implementation)))throw Error('PDF comparison policy or implementation changed');
 const artifacts=[ref,current(report.algorithm)],pages={};
 for(const edition of EDITIONS){
  const r=report.editions?.[edition],m=manifests[edition];
  if(!same(r?.manifest,editions[edition].manifest)||!same(r?.pdf,m.pdf)||r.pages?.length!==m.pages.length)throw Error('PDF comparison dependencies changed: '+edition);
  artifacts.push(r.manifest,r.pdf);pages[edition]=[];
  for(let i=0;i<r.pages.length;i++){
   const p=r.pages[i];if(p.page!==i+1)throw Error('Incomplete PDF comparison pages');
   artifacts.push(current(p.raster));let measured=measuredRasters.get(p.raster.hash);
   if(!measured){measured=fingerprintPpm(gunzipSync(fs.readFileSync(p.raster.path)));measuredRasters.set(p.raster.hash,measured);}
   if(['width','height','bodyHeight','a4','bodyHash'].some(k=>p[k]!==measured[k]))throw Error('PDF comparison pixels changed');
   pages[edition].push(measured);
  }
 }
 const matches={},manual={};
 for(const edition of COMBINED_EDITIONS){
  const answer=edition.slice(5),questionCount=pages.student.length,expected=questionCount+pages[answer].length;
  for(let i=0;i<pages[edition].length;i++){
   const page=i+1,key=edition+':'+page,source=i<questionCount?'student':answer,sourcePage=i<questionCount?page:page-questionCount;
   const a=pages[edition][i],b=pages[source][sourcePage-1];
   let reason=pages[edition].length!==expected?'Different pagination':page===1?'Cover and contents':page===questionCount||page===questionCount+1?'Answer-section boundary':!a.a4||!b?.a4?'Unsupported page dimensions':a.bodyHash!==b.bodyHash?'Different rendered content':null;
   if(reason)manual[key]=reason;else matches[key]={edition:source,page:sourcePage,bodyHash:a.bodyHash};
  }
 }
 return {matches,manual,artifacts};
}

export function validateCompositionReview(review,{edition,sessionKey,comparison,manifest}={}){
 if(!review?.artifact)throw Error('Explicit combined-edition composition review required: '+edition);
 const record=read(current(review.artifact).path);
 if(record.kind!=='composition'||record.outcome!=='accepted'||!record.compositionEditions?.includes(edition)||!sessionKey||record.sessionKey!==sessionKey||!same(record.comparison,comparison)||!same(record.manifests?.[edition],manifest)||!record.reviewer?.trim()||!record.note?.trim()||COMPOSITION_CHECKS.some(k=>record.compositionChecks?.[k]!==true))throw Error('Incomplete combined-edition composition review: '+edition);
 return review.artifact;
}

export function validateUniqueLayoutReview(record){
 const result=validateEditionComparison(record.comparison,record.editions),artifacts=[...result.artifacts];
 for(const edition of COMBINED_EDITIONS)artifacts.push(validateCompositionReview(record.compositionReviews?.[edition],{edition,sessionKey:record.sessionKey,comparison:record.comparison,manifest:record.editions[edition].manifest}));
 for(const edition of EDITIONS)for(const page of record.editions[edition].pages){
  if(page.reviewMethod==='visual')continue;
  const match=result.matches[edition+':'+page.page],base=match&&record.editions[match.edition]?.pages[match.page-1];
  if(page.reviewMethod!=='equivalent'||!match||JSON.stringify(page.equivalentTo)!==JSON.stringify(match)||base?.reviewMethod!=='visual'||base.checked!==true)throw Error('No reviewed standalone pixel match: '+edition+' page '+page.page);
 }
 return artifacts;
}
