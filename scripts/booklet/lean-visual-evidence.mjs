// Reuse an actual inspection using verified raster bytes. A checked footer
// may differ only when the entire printed body has identical pixels.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {DPI,FOOTER_MM} from './pdf-rasters.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const require=createRequire(import.meta.url);
const bodyCache=new Map();
let png;
function bodyHash(proof){
 const {width,height}=proof;
 if(Math.abs(width-210*DPI/25.4)>3||Math.abs(height-297*DPI/25.4)>3)return null;
 const key=proof.image.hash;
 if(bodyCache.has(key))return bodyCache.get(key);
 try{
  png??=require(path.join(path.dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js')).PNG;
  const bytes=fs.readFileSync(proof.image.path);
  if(digest(bytes)!==key)return null;
  const image=png.sync.read(bytes);
  if(image.width!==width||image.height!==height)return null;
  const hash=digest(image.data.subarray(0,(height-Math.ceil(FOOTER_MM*DPI/25.4))*width*4));
  if(bodyCache.size>=4096)bodyCache.clear();
  bodyCache.set(key,hash);
  return hash;
 }catch{return null;}
}
const blocksKey=blocks=>JSON.stringify(blocks??[]);
const exact=(a,b)=>a.image.hash===b.image.hash;
function checkedBody(review,row){
 if(!row.footerChecked||!row.blocks?.length||row.sizingReviews?.length||row.diagramFindings?.length||
  blocksKey(review.blocks)!==blocksKey(row.blocks)||review.reviewProfile!==row.reviewProfile)return false;
 if(review.raster.width!==row.raster.width||review.raster.height!==row.raster.height)return false;
 const hash=bodyHash(row.raster);
 return !!hash&&hash===bodyHash(review.raster);
}
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
 const verify=rasterEvidenceReader(),index=new Map(),byBlocks=new Map();
 const add=(map,id,entry)=>{if(!map.has(id))map.set(id,[]);map.get(id).push(entry);};
 for(const [key,review]of Object.entries(state.pages??{}))if(['accepted','needs-change'].includes(review.outcome)&&review.raster){
  add(index,review.edition+':'+review.raster.image.hash,[key,review]);
  add(byBlocks,review.edition+':'+blocksKey(review.blocks),[key,review]);
 }
 let retained=0;
 for(const [edition,entry]of Object.entries(plan))for(const row of entry.pending){
  if(!row.raster||!verify(row.raster))continue;
  const candidates=index.get(edition+':'+row.raster.image.hash)??[];
  // A contradictory recorded outcome is a new review/diagnosis, never a pass.
  const valid=candidates.filter(([,review])=>verify(review.raster));
  if(!valid.length&&row.footerChecked){
   const matches=(byBlocks.get(edition+':'+blocksKey(row.blocks))??[]).filter(([,review])=>verify(review.raster)&&checkedBody(review,row));
   if(matches.length&&matches.every(([,review])=>review.outcome==='accepted'))valid.push(...matches);
  }
  if(!valid.length||new Set(valid.map(([,review])=>review.outcome)).size!==1)continue;
  row.retainedReviewKey=valid.at(-1)[0];retained++;
 }
 return retained;
}
// Import pipeline v2 (James, 12 November 2026): a re-rendered page keeps an
// earlier acceptance when it holds the same blocks, every one unchanged, under
// the same settings and renderer. The stamp covers each block's JSON, its own
// layout overrides, every other setting, its section metadata and the renderer.
// A page that starts or ends inside a split block has no stamp, so a moved
// split point is always inspected.
const OWNED_SETTINGS=[['layoutOverrides','blockLayouts'],['layoutOverrides','answerSpaces'],['layoutOverrides','diagramColourModes'],['compactAnswers','diagramWidths']];
const blockIdOf=id=>typeof id==='string'?id:id?.id;
const ownsKey=(key,id)=>key===id||key.startsWith(id+'-')||key.startsWith(id+':')||key.startsWith(id+'/');
export function pageBlockStamp(project,pageHashes,index,{renderer=null}={}){
 const row=pageHashes[index],ids=(row?.blocks??[]).map(blockIdOf).filter(Boolean);
 if(!ids.length||row.isCover)return null;
 const shared=(a,b)=>!!b&&(b.blocks??[]).map(blockIdOf).includes(a);
 if(shared(ids[0],pageHashes[index-1])||shared(ids.at(-1),pageHashes[index+1]))return null;
 const found=new Map(),all=[];
 for(const section of project.sections??[])for(const block of section.blocks??[]){all.push(block.id);if(ids.includes(block.id))found.set(block.id,{block,section});}
 if(found.size!==new Set(ids).size)return null;
 const settings=structuredClone(project.settings??{}),owned={};
 for(const [group,name]of OWNED_SETTINGS){
  const map=settings[group]?.[name];if(!map||typeof map!=='object')continue;
  for(const key of Object.keys(map)){
   const owner=ids.find(id=>ownsKey(key,id));
   if(owner)(owned[owner]??={})[group+'.'+name+'.'+key]=map[key];
   if(all.some(id=>ownsKey(key,id)))delete map[key];
  }
 }
 const sectionMeta=({blocks,...meta})=>meta;
 return digest(JSON.stringify({ids,blocks:ids.map(id=>[found.get(id).block,owned[id]??null,sectionMeta(found.get(id).section)]),settings,presentation:project.presentation??null,renderer,mode:row.mode??null,isAnswer:row.isAnswer??false,answerSectionStart:row.answerSectionStart??false}));
}
// One stamp per block (its JSON, its own layout overrides and every other
// setting), used by finish to tell which blocks a repair round changed.
export function blockContentStamps(project){
 const all=(project.sections??[]).flatMap(section=>section.blocks??[]),settings=structuredClone(project.settings??{}),owned={};
 for(const [group,name]of OWNED_SETTINGS){
  const map=settings[group]?.[name];if(!map||typeof map!=='object')continue;
  for(const key of Object.keys(map)){const owner=all.find(block=>ownsKey(key,block.id));if(owner){(owned[owner.id]??={})[group+'.'+name+'.'+key]=map[key];delete map[key];}}
 }
 const global=digest(JSON.stringify({settings,presentation:project.presentation??null}));
 return Object.fromEntries(all.map(block=>[block.id,digest(JSON.stringify([global,block,owned[block.id]??null]))]));
}
const carriedReview=(review,edition,row)=>review?.edition===edition&&review.outcome==='accepted'&&!!row.blockStamp&&review.blockStamp===row.blockStamp&&
 blocksKey(review.blocks)===blocksKey(row.blocks)&&(review.reviewProfile??null)===(row.reviewProfile??null);
export function carryUnchangedBlockReviews(plan,state){
 const byStamp=new Map();
 for(const [key,review]of Object.entries(state.pages??{}))if(review.blockStamp&&['accepted','needs-change'].includes(review.outcome)){
  const id=review.edition+':'+review.blockStamp;if(!byStamp.has(id))byStamp.set(id,[]);byStamp.get(id).push([key,review]);
 }
 let carried=0;
 for(const [edition,entry]of Object.entries(plan)){
  const issuePages=new Set((entry.automatedIssues??[]).map(issue=>Number(issue.page)).filter(Number.isInteger));
  for(const row of entry.pending){
   delete row.carriedReviewKey;
   if(row.retainedReviewKey||!row.blockStamp||row.sizingReviews?.length||row.diagramFindings?.length||row.previousFindings?.length||issuePages.has(row.page))continue;
   const matches=(byStamp.get(edition+':'+row.blockStamp)??[]).filter(([,review])=>blocksKey(review.blocks)===blocksKey(row.blocks)&&(review.reviewProfile??null)===(row.reviewProfile??null));
   // A contradictory recorded outcome for the same content is never carried.
   if(!matches.length||matches.some(([,review])=>review.outcome!=='accepted'))continue;
   row.carriedReviewKey=matches.at(-1)[0];
  }
  // Pages beside anything still to be inspected are inspected too.
  const inspected=new Set(entry.pending.filter(row=>!row.retainedReviewKey&&!row.carriedReviewKey).map(row=>row.page));
  for(const page of issuePages)inspected.add(page);
  for(const row of entry.pending)if(row.carriedReviewKey&&(inspected.has(row.page-1)||inspected.has(row.page+1)))delete row.carriedReviewKey;
  carried+=entry.pending.filter(row=>row.carriedReviewKey).length;
 }
 return carried;
}
export function visualOutcomeReader(state){
 const verify=rasterEvidenceReader();
 return (edition,row)=>{
  const direct=state.pages?.[edition+':'+row.hash];
  if(direct){
   if(direct.raster&&row.raster&&direct.edition===edition&&exact(direct.raster,row.raster)&&verify(direct.raster)&&verify(row.raster))return direct;
   if(!direct.raster&&!row.raster&&!row.reviewProfile)return direct;
  }
  const retained=row.retainedReviewKey&&state.pages?.[row.retainedReviewKey];
  if(retained?.edition===edition&&retained.raster&&row.raster&&verify(retained.raster)&&verify(row.raster)&&
   (exact(retained.raster,row.raster)||retained.outcome==='accepted'&&checkedBody(retained,row)))return retained;
  const carried=row.carriedReviewKey&&state.pages?.[row.carriedReviewKey];
  if(carriedReview(carried,edition,row)&&(!row.raster||verify(row.raster)))return carried;
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
   // The reader compares this key against the row's current stamp, never the stored one.
   if(proof.carriedReviewKey)row.carriedReviewKey=proof.carriedReviewKey;
  }
 }
 return result;
}
