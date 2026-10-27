// Reuse only an actual inspection of the exact same full-page PNG bytes.
// HTML/settings hashes can change without changing the printed page. Neither a
// matching block list nor a source/model claim establishes pixel equivalence.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function rasterEvidence(pdf,image){
 if(!image?.receipt||!image.hash)return undefined; // Old/synthetic plans have no proof.
 return {pdf,image:{path:image.path,hash:image.hash},receipt:image.receipt,page:image.page,width:image.width,height:image.height};
}
export function rasterEvidenceReader(){
 const files=new Map();
 const read=ref=>{
  if(!ref?.path||!ref.hash)throw Error('Missing raster evidence');
  const stat=fs.statSync(ref.path),stamp=[stat.size,stat.mtimeMs,stat.ctimeMs].join(':');
  let row=files.get(ref.path);
  if(!row||row.stamp!==stamp){const bytes=fs.readFileSync(ref.path),after=fs.statSync(ref.path);if(stamp!==[after.size,after.mtimeMs,after.ctimeMs].join(':'))throw Error('Raster changed while reading');row={stamp,bytes,hash:digest(bytes)};files.set(ref.path,row);}
  if(row.hash!==ref.hash)throw Error('Raster evidence changed');return row.bytes;
 };
 return proof=>{try{
  read(proof.pdf);const bytes=read(proof.image),receipt=JSON.parse(read(proof.receipt));
  return receipt.page===proof.page&&receipt.pdfHash===proof.pdf.hash&&receipt.image?.path===proof.image.path&&receipt.image.hash===proof.image.hash&&receipt.image.width===proof.width&&receipt.image.height===proof.height&&bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.readUInt32BE(16)===proof.width&&bytes.readUInt32BE(20)===proof.height;
 }catch{return false;}};
}
export function retainPixelReviews(plan,state){
 const verify=rasterEvidenceReader(),index=new Map();
 for(const [key,review]of Object.entries(state.pages??{}))if(['accepted','needs-change'].includes(review.outcome)&&review.raster){const id=review.edition+':'+review.raster.image.hash;if(!index.has(id))index.set(id,[]);index.get(id).push([key,review]);}
 let retained=0;
 for(const [edition,entry]of Object.entries(plan))for(const row of entry.pending){
  if(!row.raster||!verify(row.raster))continue;
  const candidates=index.get(edition+':'+row.raster.image.hash)??[];
  // A contradictory recorded outcome is a new review/diagnosis, never a pass.
  const valid=candidates.filter(([,review])=>verify(review.raster));
  if(!valid.length||new Set(valid.map(([,review])=>review.outcome)).size!==1)continue;
  row.retainedReviewKey=valid.at(-1)[0];retained++;
 }
 return retained;
}
export function visualOutcomeReader(state){
 const verify=rasterEvidenceReader();
 return (edition,row)=>{
  const direct=state.pages?.[edition+':'+row.hash];
  if(direct){
   if(direct.raster||row.raster)return direct.edition===edition&&direct.raster&&row.raster&&direct.raster.image.hash===row.raster.image.hash&&verify(direct.raster)&&verify(row.raster)?direct:undefined;
   if(!row.reviewProfile)return direct;
  }
  const retained=row.retainedReviewKey&&state.pages?.[row.retainedReviewKey];
  if(retained?.edition===edition&&retained.raster?.image.hash===row.raster?.image.hash&&verify(retained.raster)&&verify(row.raster))return retained;
 };
}

// Rebuild required source coverage independently; a stored plan contributes only
// byte-verifiable evidence for that exact current PDF page and current hash.
export function overlayVisualEvidence(required,stored){
 const result=structuredClone(required);
 for(const [edition,entry]of Object.entries(result)){
  const candidates=[...(stored?.[edition]?.pending??[]),...(stored?.[edition]?.reused??[])];
  for(const row of entry.pending){
   const proof=candidates.find(old=>old.page===row.page&&old.hash===row.hash&&old.raster?.page===row.page&&old.raster.pdf?.path===entry.pdf?.path&&old.raster.pdf?.hash===entry.pdf?.hash);
   if(!proof)continue;
   row.raster=proof.raster;row.image=proof.raster.image?.path;
   if(proof.retainedReviewKey)row.retainedReviewKey=proof.retainedReviewKey;
  }
 }
 return result;
}
