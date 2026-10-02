import fs from 'node:fs';
import path from 'node:path';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const PROFILE='textbook-three-pass-v1';
const standalone=new Set(['student','short','worked']);
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const hash=v=>createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const equal=(a,b)=>hash(a)===hash(b);
const digest=b=>createHash('sha256').update(b).digest('hex');
const copy=v=>JSON.parse(JSON.stringify(v));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const absolute=p=>typeof p==='string'&&/^(?:\/|[A-Za-z]:[\\/]|\\\\)/.test(p);
let validationScope=null;
// Process-lifetime reuse is limited to successful pure PNG fingerprint scalars.
// Evidence snapshots, JSON, proofs and acceptance remain operation-scoped.
const fingerprintMemo=new Map();
const fingerprintMemoLimit=1024;
// Cached values stay private; exported plans and artifact references are copied.
export function withSelectedPageReuseValidation(fn){
 assert(typeof fn==='function'&&Object.prototype.toString.call(fn)!=='[object AsyncFunction]','Selected-page reuse validation requires a synchronous callback');
 const previous=validationScope;
 validationScope={snapshots:new Map(),json:new Map(),bodies:new Map()};
 try{
  const result=fn();
  assert(!result||typeof result.then!=='function','Selected-page reuse validation requires a synchronous callback');
  return result;
 }finally{validationScope=previous;}
}
function bytes(ref){
 assert(absolute(ref?.path)&&/^[a-f0-9]{64}$/.test(ref?.hash??''),'Invalid evidence reference');
 const file=path.resolve(ref.path);
 let snapshot=validationScope?.snapshots.get(file);
 if(!snapshot){
  const data=fs.readFileSync(file);
  snapshot={data,hash:digest(data)};
  validationScope?.snapshots.set(file,snapshot);
 }
 assert(snapshot.hash===ref.hash,'Missing or stale selected-page evidence: '+ref.path);
 return snapshot.data;
}
function json(ref){
 const data=bytes(ref);
 if(!validationScope)return JSON.parse(data.toString('utf8').replace(/^\uFEFF/,''));
 if(!validationScope.json.has(ref.hash))validationScope.json.set(ref.hash,JSON.parse(data.toString('utf8').replace(/^\uFEFF/,'')));
 return validationScope.json.get(ref.hash);
}

export class UnsupportedCandidateImage extends Error {}
const crcTable=Array.from({length:256},(_,n)=>{
 for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;
 return n>>>0;
});
function crc(data){let n=0xffffffff;for(const b of data)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
const bad=message=>{throw new UnsupportedCandidateImage(message);};
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}

// RGB8 only. Colour-transform chunks are deliberately unsupported: identical
// channel bytes must establish identical printed pixels without approximation.
export function pngBodyFingerprint(data,{dpi=144,footerMm=15,strictA4=false}={}){
 try{
  if(!Buffer.isBuffer(data))data=Buffer.from(data);
  if(!Number.isFinite(dpi)||dpi<=0||!Number.isFinite(footerMm)||footerMm<0)bad('Invalid fingerprint geometry');
  if(data.length>33554432||data.length<45||!data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))bad('Invalid PNG signature or size');
  let offset=8,width=0,height=0,ended=false,sawData=false,dataEnded=false,physical=false,chunks=0;
  const compressed=[];
  while(offset<data.length){
   if(++chunks>10000||offset+12>data.length)bad('Invalid PNG chunk count or length');
   const length=data.readUInt32BE(offset),end=offset+12+length;
   if(end>data.length)bad('Truncated PNG chunk');
   const type=data.toString('ascii',offset+4,offset+8),payload=data.subarray(offset+8,end-4);
   if(!/^[A-Za-z]{4}$/.test(type)||type[2]!==type[2].toUpperCase())bad('Invalid PNG chunk type');
   if(crc(data.subarray(offset+4,end-4))!==data.readUInt32BE(end-4))bad('Invalid PNG CRC');
   if(chunks===1&&type!=='IHDR')bad('PNG must begin with IHDR');
   if(type==='IHDR'){
    if(chunks!==1||length!==13)bad('Invalid PNG header');
    width=payload.readUInt32BE(0);height=payload.readUInt32BE(4);
    if(!width||!height||width>8192||height>8192||width*height>10000000||payload[8]!==8||payload[9]!==2||payload[10]!==0||payload[11]!==0||payload[12]!==0)bad('Unsupported PNG header');
    if(strictA4&&(dpi!==144||footerMm!==15||Math.abs(width-210*144/25.4)>2||Math.abs(height-297*144/25.4)>2))bad('Expected portrait A4 at 144 dpi');
   }else if(type==='IDAT'){
    if(dataEnded)bad('Non-contiguous PNG image data');
    sawData=true;compressed.push(payload);
   }else if(type==='pHYs'){
    if(physical||sawData||length!==9||!payload.readUInt32BE(0)||!payload.readUInt32BE(4)||payload[8]>1)bad('Invalid PNG physical dimensions');
    if(strictA4&&payload[8]===1&&(Math.abs(payload.readUInt32BE(0)-144/0.0254)>1||Math.abs(payload.readUInt32BE(4)-144/0.0254)>1))bad('PNG resolution is not 144 dpi');
    physical=true;
   }else if(type==='IEND'){
    if(length||!sawData||end!==data.length)bad('Invalid PNG ending');
    ended=true;offset=end;break;
   }else bad('Unsupported PNG chunk: '+type);
   if(sawData&&type!=='IDAT')dataEnded=true;
   offset=end;
  }
  if(!ended)bad('Missing PNG ending');
  const stride=width*3,expected=(stride+1)*height;
  const raw=inflateSync(Buffer.concat(compressed),{maxOutputLength:expected,info:true});
  if(raw.buffer.length!==expected||raw.engine.bytesWritten!==compressed.reduce((n,b)=>n+b.length,0))bad('Invalid PNG inflated length or trailing stream');
  const pixels=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){
   const start=y*(stride+1),filter=raw.buffer[start];
   if(filter>4)bad('Unsupported PNG scanline filter');
   for(let x=0;x<stride;x++){
    const i=y*stride+x,a=x>=3?pixels[i-3]:0,b=y?pixels[i-stride]:0,c=y&&x>=3?pixels[i-stride-3]:0;
    const predictor=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
    pixels[i]=(raw.buffer[start+1+x]+predictor)&255;
   }
  }
  const bodyHeight=height-Math.ceil(footerMm*dpi/25.4);
  if(bodyHeight<=0)bad('Footer consumes the image');
  const geometry={width,height,bodyHeight,dpi,footerMm};
  const bodyHash=createHash('sha256').update(JSON.stringify(geometry)).update(pixels.subarray(0,bodyHeight*stride)).digest('hex');
  return {...geometry,bodyHash};
 }catch(error){
  if(error instanceof UnsupportedCandidateImage)throw error;
  throw new UnsupportedCandidateImage(error.message);
 }
}

const eligibleInput=input=>input?.mode==='final'&&input.reviewProfile===PROFILE;
function finalEvidence(input){
 assert(eligibleInput(input),'Selected-body retention requires a lean final settlement');
 assert(input.sourceArtifacts?.length,'Original source evidence is required');
 input.sourceArtifacts.forEach(bytes);
 const entries=Object.entries(input.editions??{});
 assert(entries.length===5,'Current all-five-edition QA is required');
 for(const [edition,entry]of entries){
  const manifest=json(entry.manifest);
  assert(manifest.edition===edition&&manifest.mode==='full'&&manifest.passed===true&&manifest.workflowKey===input.key,'Current passed full manifest is required: '+edition);
  if(input.renderer!==undefined)assert(manifest.renderer===input.renderer,'Current renderer does not match: '+edition);
  if(input.project?.contentHash!==undefined)assert(manifest.projectHash===input.project.contentHash,'Current project does not match: '+edition);
  if(input.assets!==undefined)assert(equal(manifest.assets,input.assets),'Current assets do not match: '+edition);
  assert(equal(manifest.images,entry.images),'Current manifest image references do not match: '+edition);
  bytes(manifest.pdf);
 }
 return Object.fromEntries(entries.map(([edition,entry])=>[edition,copy(entry.manifest)]));
}
const rowIdentity=row=>({key:row.key,edition:row.edition,page:row.page,image:copy(row.image),sources:copy(row.sources)});
function rowKey(row){return hash({edition:row.edition,page:row.page,imageHash:row.image.hash});}
function checkRow(row,sources){
 assert(Number.isInteger(row.page)&&row.page>0&&row.key===rowKey(row),'Selected-page key does not identify its image');
 assert(equal(row.sources,sources),'Selected-page original sources do not match');
 row.sources.forEach(bytes);
}
function actualInspection(row,sources){
 checkRow(row,sources);
 const review=row.review,record=json(review?.artifact);
 assert(review.outcome==='accepted'&&!review.reuseKind&&!record.reuseKind&&record.outcome==='accepted'&&record.reviewProfile===PROFILE&&record.presentationVerified===true,'Prior record is not an accepted actual lean inspection');
 assert(typeof record.reviewer==='string'&&record.reviewer.trim()&&typeof record.note==='string'&&record.note.trim(),'Prior actual reviewer and note are required');
 assert(record.pageKeys?.includes(row.key)&&['outcome','reviewer','note'].every(k=>record[k]===review[k]),'Prior actual inspection does not identify this page');
 if(record.sourceArtifacts!==undefined)assert(equal(record.sourceArtifacts,sources),'Prior inspection original sources changed');
 bytes(row.image);
 return {row:rowIdentity(row),review:copy(review)};
}
function origin(row,input){
 if(row.review?.reuseKind==='selected-body'){
  const record=json(row.review.artifact);
  validateSelectedPageReuse(record,row,input);
  assert(['outcome','reviewer','note'].every(k=>record[k]===row.review[k]),'Prior retention summary changed');
  return {row:copy(record.priorRow),review:copy(record.priorReview)};
 }
 return actualInspection(row,input.sourceArtifacts);
}
function currentRow(row,input){
 assert(row.selectedBodyEligible===true,'Cover, boundary, flagged or neighbour pages require current inspection');
 checkRow(row,input.sourceArtifacts);
 const entry=input.editions[row.edition],manifest=json(entry?.manifest);
 assert(entry.images?.some(image=>equal(image,row.image)),'Current row image is absent from its edition');
 assert(manifest.visualPages?.includes(row.page)&&manifest.pages?.[row.page-1]?.page===row.page,'Current row is not a selected physical page');
 bytes(row.image);
}
function fingerprintData(data){
 // Hash actual bytes independently of the evidence reference, after bytes()
 // has verified the freshly read operation snapshot.
 const key=digest(data)+':144:15:strictA4:true';
 let cached=validationScope?.bodies.get(key)??fingerprintMemo.get(key);
 if(!cached){
  const {width,height,bodyHeight,dpi,footerMm,bodyHash}=pngBodyFingerprint(data,{dpi:144,footerMm:15,strictA4:true});
  cached=Object.freeze({width,height,bodyHeight,dpi,footerMm,bodyHash});
 }
 // Promote every successful access; exceptions never enter either cache.
 fingerprintMemo.delete(key);
 fingerprintMemo.set(key,cached);
 if(fingerprintMemo.size>fingerprintMemoLimit)fingerprintMemo.delete(fingerprintMemo.keys().next().value);
 validationScope?.bodies.set(key,cached);
 return {...cached};
}
function fingerprint(ref){return fingerprintData(bytes(ref));}

export function validateSelectedPageReuse(record,row,input){
 const manifests=finalEvidence(input);
 currentRow(row,input);
 assert(record?.reuseKind==='selected-body'&&record.reviewProfile===PROFILE&&record.outcome==='accepted','Invalid selected-body retention record');
 assert(equal(record.currentPageKeys,[row.key])&&equal(record.currentRow,rowIdentity(row)),'Retention proof does not identify the current row');
 assert(equal(record.sourceArtifacts,input.sourceArtifacts)&&equal(record.currentManifests,manifests),'Retention proof source or manifest closure changed');
 const prior=actualInspection({...record.priorRow,review:record.priorReview},input.sourceArtifacts);
 const allowed=prior.row.edition===row.edition&&prior.row.page===row.page||standalone.has(prior.row.edition)&&record.combinedEditions?.includes(row.edition);
 assert(allowed,'Retention origin is not the same page or an accepted standalone');
 assert(record.originalActualReviewer===prior.review.reviewer&&record.reviewer===prior.review.reviewer&&record.note===prior.review.note,'Original actual inspection provenance changed');
 const oldBody=fingerprint(prior.row.image),newBody=fingerprint(row.image);
 assert(equal(oldBody,newBody)&&equal(record.bodyFingerprint,newBody),'Selected printed body changed');
 return true;
}

export function selectedPageReuseArtifacts(record,row,input){
 validateSelectedPageReuse(record,row,input);
 const refs=[record.priorReview.artifact,record.priorRow.image,record.currentRow.image,...record.sourceArtifacts,...Object.values(record.currentManifests)];
 return [...new Map(refs.map(ref=>[ref.path,copy(ref)])).values()];
}

// This cache exists for this operation only. Each reference is verified even
// when another selected candidate has the same bytes. No all-page comparison.
export function selectedPageReusePlans(previous,current,{combinedEditions=[]}={}){
 if(!eligibleInput(current?.input))return [];
 const manifests=finalEvidence(current.input),sources=current.input.sourceArtifacts;
 const candidates=[];
 if(previous&&eligibleInput(previous.input)&&equal(previous.input.sourceArtifacts,sources)){
  for(const row of previous.rows)if(row.review?.outcome==='accepted'){
   const prior=origin(row,previous.input);
   candidates.push({...prior,position:{edition:row.edition,page:row.page}});
  }
 }
 for(const row of current.rows)if(row.review?.outcome==='accepted'&&standalone.has(row.edition)){
  const prior=origin(row,current.input);
  candidates.push({...prior,position:{edition:row.edition,page:row.page}});
 }
 const cache=new Map();
 function candidateFingerprint(ref){
  const data=bytes(ref);
  if(!cache.has(ref.hash)){
   try{cache.set(ref.hash,fingerprintData(data));}
   catch(error){if(!(error instanceof UnsupportedCandidateImage))throw error;cache.set(ref.hash,null);}
  }
  return cache.get(ref.hash);
 }
 const byBody=new Map(),byPosition=new Map();
 for(const candidate of candidates){
  candidate.body=candidateFingerprint(candidate.row.image);
  const position=candidate.position.edition+':'+candidate.position.page;
  if(!byPosition.has(position))byPosition.set(position,[]);
  byPosition.get(position).push(candidate);
  if(!candidate.body)continue;
  if(!byBody.has(candidate.body.bodyHash))byBody.set(candidate.body.bodyHash,{same:new Map(),standalone:null});
  const index=byBody.get(candidate.body.bodyHash),key=candidate.row.edition+':'+candidate.row.page;
  if(!index.same.has(key))index.same.set(key,candidate);
  if(standalone.has(candidate.row.edition)&&!index.standalone)index.standalone=candidate;
 }
 const targets=[],blocked=new Set();
 for(const row of current.rows)if(!row.review&&row.selectedBodyEligible===true){
  currentRow(row,current.input);
  const body=candidateFingerprint(row.image),position=row.edition+':'+row.page;
  targets.push({row,body});
  const prior=byPosition.get(position);
  if(prior?.length&&!prior.some(candidate=>candidate.body&&body&&equal(candidate.body,body)))for(const page of [row.page-1,row.page,row.page+1])blocked.add(row.edition+':'+page);
 }
 const plans=[];
 for(const {row,body}of targets){
  if(!body||blocked.has(row.edition+':'+row.page))continue;
  const index=byBody.get(body.bodyHash);
  const candidate=index?.same.get(row.edition+':'+row.page)??(combinedEditions.includes(row.edition)?index?.standalone:null);
  if(!candidate||!equal(body,candidate.body))continue;
  plans.push({key:row.key,record:{
   reuseKind:'selected-body',reviewProfile:PROFILE,outcome:'accepted',
   reviewer:candidate.review.reviewer,originalActualReviewer:candidate.review.reviewer,note:candidate.review.note,
   currentPageKeys:[row.key],currentRow:rowIdentity(row),priorRow:copy(candidate.row),priorReview:copy(candidate.review),
   sourceArtifacts:copy(sources),currentManifests:copy(manifests),bodyFingerprint:copy(body),combinedEditions:copy(combinedEditions)
  }});
 }
 return plans;
}
