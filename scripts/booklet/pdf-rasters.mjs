// One retained PDF raster supplies review images, exact comparisons and footers.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {gzipSync,gunzipSync,deflateSync} from 'node:zlib';

export const RASTER_FORMAT='mathsmap-pdf-rasters-v1',DPI=144,FOOTER_MM=15;
export const TARGETED_RASTER_FORMAT='mathsmap-pdf-targeted-rasters-v1';
const digest=b=>createHash('sha256').update(b).digest('hex');
const ref=file=>({path:path.resolve(file),hash:digest(fs.readFileSync(file))});
const implementation=()=>ref(fileURLToPath(import.meta.url));
function check(r){if(!r?.path||!path.isAbsolute(r.path)||!fs.existsSync(r.path)||ref(r.path).hash!==r.hash)throw Error('Missing or stale PDF raster artifact: '+r?.path);return r;}
export function decodePpm(bytes){
 let offset=0;
 const token=()=>{while(offset<bytes.length){if(bytes[offset]===35){while(offset<bytes.length&&bytes[offset]!==10)offset++;}else if(/\s/.test(String.fromCharCode(bytes[offset])))offset++;else break;}const start=offset;while(offset<bytes.length&&!/\s/.test(String.fromCharCode(bytes[offset])))offset++;return bytes.toString('ascii',start,offset);};
 const magic=token(),width=Number(token()),height=Number(token()),max=Number(token());
 if(magic!=='P6'||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>20000000||max!==255||offset>=bytes.length)throw Error('Invalid PDF RGB raster');
 if(bytes[offset]===13&&bytes[offset+1]===10)offset+=2;else offset++;
 const pixels=bytes.subarray(offset);if(pixels.length!==width*height*3)throw Error('Incomplete PDF RGB raster');
 return {width,height,pixels};
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const name=Buffer.from(type),body=Buffer.concat([name,data]);let crc=0xffffffff;for(const b of body)crc=crcTable[(crc^b)&255]^(crc>>>8);const length=Buffer.alloc(4),tail=Buffer.alloc(4);length.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([length,body,tail]);}
export function rgbPng({width,height,pixels}){
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 const rows=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)pixels.copy(rows,y*(width*3+1)+1,y*width*3,(y+1)*width*3);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
export function popplerVersion(){const r=spawnSync('pdftoppm',['-v'],{windowsHide:true,encoding:'utf8'});if(r.error||r.status!==0)throw Error('PDF rasterization requires pdftoppm: '+(r.error?.message??r.stderr));return (r.stderr+r.stdout).trim();}
export function renderPdfPage(pdf,page){const r=spawnSync('pdftoppm',['-r',String(DPI),'-f',String(page),'-l',String(page),'-singlefile',pdf],{windowsHide:true,maxBuffer:64*1024*1024});if(r.error||r.status!==0)throw Error('PDF rasterization failed: '+(r.error?.message??r.stderr?.toString()));decodePpm(r.stdout);return r.stdout;}
// Native PNG output is retained verbatim. Cache validation reads its hash and
// header, never inflates pixels or re-encodes an already accepted image.
function pngSize(bytes){
 if(bytes.length<33||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.readUInt32BE(8)!==13||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PDF PNG raster');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(width<1||height<1||width*height>20000000)throw Error('Invalid PDF PNG dimensions');
 return {width,height};
}
export function selectedPageRanges(pages,count,{maxPages=8}={}){
 if(!Number.isInteger(count)||count<1||!Number.isInteger(maxPages)||maxPages<1)throw Error('PDF page count and range size required');
 if(!Array.isArray(pages)||!pages.length||pages.some(page=>!Number.isInteger(page)||page<1||page>count)||new Set(pages).size!==pages.length)throw Error('Select distinct physical PDF pages within the page count');
 const ranges=[];
 for(const page of [...pages].sort((a,b)=>a-b)){
  const last=ranges.at(-1);
  if(last&&page===last.last+1&&last.last-last.first+1<maxPages)last.last=page;
  else ranges.push({first:page,last:page});
 }
 return ranges;
}
export async function renderPdfRange(pdf,first,last,{out}){
 const dir=fs.mkdtempSync(path.join(path.resolve(out),'range-')),prefix=path.join(dir,'page');
 try{
  await new Promise((resolve,reject)=>{
   const child=spawn('pdftoppm',['-r',String(DPI),'-f',String(first),'-l',String(last),'-png',pdf,prefix],{windowsHide:true,stdio:['ignore','ignore','pipe']});let errors='';
   child.stderr.on('data',bytes=>{errors=(errors+bytes.toString()).slice(-8192);});
   child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('PDF rasterization failed: '+errors)));
  });
  const files=new Map(fs.readdirSync(dir).map(name=>[Number(/^page-(\d+)\.png$/.exec(name)?.[1]),path.join(dir,name)]));
  return Array.from({length:last-first+1},(_,i)=>({page:first+i,bytes:fs.readFileSync(files.get(first+i))}));
 }finally{
  if(path.dirname(path.resolve(dir))!==path.resolve(out)||!path.basename(dir).startsWith('range-'))throw Error('Unsafe PDF raster temporary path');
  fs.rmSync(dir,{recursive:true,force:true});
 }
}
function targetedKey(pdf,page,engine,algorithm){return digest(JSON.stringify({format:TARGETED_RASTER_FORMAT,pdf:pdf.hash,page,engine,dpi:DPI,implementation:algorithm.hash}));}
function readTargetedImage(pdf,page,out,engine,algorithm){
 const key=targetedKey(pdf,page,engine,algorithm),base=path.resolve(out,key),receiptFile=base+'.json',imageFile=base+'.png';
 const saved=JSON.parse(fs.readFileSync(receiptFile,'utf8'));
 if(saved.key!==key||saved.page!==page||saved.pdfHash!==pdf.hash||saved.image?.path!==imageFile)throw Error('PDF raster generation identity changed');
 const bytes=fs.readFileSync(imageFile),size=pngSize(bytes);
 if(digest(bytes)!==saved.image.hash||size.width!==saved.image.width||size.height!==saved.image.height)throw Error('Missing or stale PDF PNG raster');
 return {page,...saved.image,pdfHash:pdf.hash,receipt:ref(receiptFile)};
}
export async function ensureSelectedPdfRasters(pdf,count,out,{pages,renderRange=renderPdfRange,engine=popplerVersion()}={}){
 const started=Date.now();check(pdf);selectedPageRanges(pages,count);fs.mkdirSync(out,{recursive:true});
 const algorithm=implementation(),images=new Map(),missing=[];
 for(const page of [...pages].sort((a,b)=>a-b)){
  try{images.set(page,readTargetedImage(pdf,page,out,engine,algorithm));}catch{missing.push(page);}
 }
 const ranges=missing.length?selectedPageRanges(missing,count):[],reused=images.size;
 let cursor=0;
 const worker=async()=>{
  while(cursor<ranges.length){
   const {first,last}=ranges[cursor++],rendered=await renderRange(pdf.path,first,last,{out});
   if(!Array.isArray(rendered)||rendered.length!==last-first+1||rendered.some((item,i)=>item.page!==first+i))throw Error('PDF raster range did not return its exact physical pages');
   for(const {page,bytes} of rendered){
    const size=pngSize(bytes),key=targetedKey(pdf,page,engine,algorithm),base=path.resolve(out,key),imageFile=base+'.png',receiptFile=base+'.json';
    fs.writeFileSync(imageFile,bytes);
    fs.writeFileSync(receiptFile,JSON.stringify({key,page,pdfHash:pdf.hash,image:{path:imageFile,hash:digest(bytes),...size}}));
    images.set(page,readTargetedImage(pdf,page,out,engine,algorithm));
   }
  }
 };
 const workers=await Promise.allSettled(Array.from({length:Math.min(2,ranges.length)},worker));
 const failed=workers.find(result=>result.status==='rejected');if(failed)throw failed.reason;
 return {images:[...images.values()].sort((a,b)=>a.page-b.page),rasterization:{format:TARGETED_RASTER_FORMAT,dpi:DPI,engine,implementation:algorithm,pdfHash:pdf.hash,selection:'physical-pages',footerSheets:[]},metrics:{rendered:missing.length,reused,ranges,processes:ranges.length,maxConcurrency:Math.min(2,ranges.length),elapsedMs:Date.now()-started}};
}
function validateTargetedRasters(manifest){
 const r=manifest.rasterization;
 if(manifest.version!==2||manifest.reviewProfile!=='textbook-three-pass-v1'||r.dpi!==DPI||!r.engine||r.pdfHash!==manifest.pdf?.hash||r.implementation?.hash!==implementation().hash||r.selection!=='physical-pages')throw Error('Invalid or stale targeted PDF raster manifest');
 check(manifest.pdf);check(r.implementation);
 if(!manifest.pages?.length||manifest.pages.some((page,i)=>page.page!==i+1))throw Error('Incomplete PDF raster page inventory');
 selectedPageRanges(manifest.visualPages,manifest.pages.length);
 if(manifest.visualPages.some((page,i)=>i>0&&page<=manifest.visualPages[i-1])||manifest.images?.length!==manifest.visualPages.length)throw Error('Incomplete targeted PDF raster pages');
 const artifacts=[r.implementation];
 manifest.images.forEach((image,i)=>{
  if(image.page!==manifest.visualPages[i]||image.pdfHash!==manifest.pdf.hash)throw Error('PDF raster page identity changed');
  check(image.receipt);const saved=JSON.parse(fs.readFileSync(image.receipt.path,'utf8'));
  if(saved.key!==targetedKey(manifest.pdf,image.page,r.engine,r.implementation)||saved.page!==image.page||saved.pdfHash!==manifest.pdf.hash||saved.image?.path!==image.path||saved.image.hash!==image.hash||saved.image.width!==image.width||saved.image.height!==image.height)throw Error('PDF raster generation identity changed');
  check(image);const size=pngSize(fs.readFileSync(image.path));
  if(size.width!==image.width||size.height!==image.height)throw Error('Review PNG dimensions changed');
  artifacts.push(image,image.receipt);
 });
 return artifacts;
}
export function ensurePdfRasters(pdf,count,out,{render=renderPdfPage,engine=popplerVersion()}={}){
 check(pdf);if(!Number.isInteger(count)||count<1)throw Error('PDF page count required');fs.mkdirSync(out,{recursive:true});
 const algorithm=implementation(),images=[],footerSheets=[];let rendered=0,reused=0;
 for(let page=1;page<=count;page++){
  const key=digest(JSON.stringify({pdf:pdf.hash,page,engine,dpi:DPI,implementation:algorithm.hash})),base=path.resolve(out,key),file=base+'.ppm.gz',receipt=base+'.json';let bytes;
  try{const saved=JSON.parse(fs.readFileSync(receipt));if(saved.key!==key||saved.raster.path!==file)throw Error('Changed raster');check(saved.raster);bytes=gunzipSync(fs.readFileSync(file));decodePpm(bytes);}catch{bytes=null;}
  if(bytes)reused++;else{bytes=render(pdf.path,page);decodePpm(bytes);fs.writeFileSync(file,gzipSync(bytes));fs.writeFileSync(receipt,JSON.stringify({key,raster:ref(file)}));rendered++;}
  const decoded=decodePpm(bytes),png=rgbPng(decoded),image=base+'.png';
  if(!fs.existsSync(image)||digest(fs.readFileSync(image))!==digest(png))fs.writeFileSync(image,png);
  images.push({page,...ref(image),width:decoded.width,height:decoded.height,pdfHash:pdf.hash,raster:ref(file),receipt:ref(receipt)});
 }
 // A sheet is a lossless stack of complete footer strips, in physical page order.
 for(let start=0;start<images.length;start+=12){
  const group=images.slice(start,start+12),decoded=group.map(i=>decodePpm(gunzipSync(fs.readFileSync(i.raster.path))));
  const width=Math.max(...decoded.map(d=>d.width)),strip=Math.ceil(FOOTER_MM*DPI/25.4),height=group.length*strip,pixels=Buffer.alloc(width*height*3,255);
  decoded.forEach((d,i)=>{for(let y=0;y<Math.min(strip,d.height);y++)d.pixels.copy(pixels,((i*strip+y)*width)*3,((d.height-Math.min(strip,d.height)+y)*d.width)*3,((d.height-Math.min(strip,d.height)+y+1)*d.width)*3);});
  const png=rgbPng({width,height,pixels}),file=path.resolve(out,`footers-${digest(png)}.png`);if(!fs.existsSync(file)||digest(fs.readFileSync(file))!==digest(png))fs.writeFileSync(file,png);
  footerSheets.push({...ref(file),pages:group.map(i=>i.page)});
 }
 return {images,rasterization:{format:RASTER_FORMAT,dpi:DPI,engine,implementation:algorithm,pdfHash:pdf.hash,footerMm:FOOTER_MM,footerSheets},metrics:{rendered,reused}};
}
export function validatePdfRasters(manifest){
 if(manifest.rasterization?.format===TARGETED_RASTER_FORMAT)return validateTargetedRasters(manifest);
 if(manifest.version!==2&&!manifest.rasterization)return []; // Legacy evidence keeps its original contract.
 const r=manifest.rasterization;
 if(manifest.version!==2||r?.format!==RASTER_FORMAT||r.dpi!==DPI||r.footerMm!==FOOTER_MM||!r.engine||r.pdfHash!==manifest.pdf?.hash||r.implementation?.hash!==implementation().hash)throw Error('Invalid or stale PDF raster manifest');
 check(manifest.pdf);check(r.implementation);
 if(!manifest.pages?.length||manifest.images?.length!==manifest.pages.length)throw Error('Incomplete PDF raster pages');
 const artifacts=[r.implementation];
 manifest.images.forEach((image,i)=>{
  if(image.page!==i+1||manifest.pages[i].page!==image.page||image.pdfHash!==manifest.pdf.hash)throw Error('PDF raster page identity changed');
  check(image.receipt);const receipt=JSON.parse(fs.readFileSync(image.receipt.path)),key=digest(JSON.stringify({pdf:manifest.pdf.hash,page:image.page,engine:r.engine,dpi:r.dpi,implementation:r.implementation.hash}));
  if(receipt.key!==key||receipt.raster.path!==image.raster?.path||receipt.raster.hash!==image.raster?.hash)throw Error('PDF raster generation identity changed');
  check(image);check(image.raster);const decoded=decodePpm(gunzipSync(fs.readFileSync(image.raster.path)));
  if(decoded.width!==image.width||decoded.height!==image.height||digest(rgbPng(decoded))!==image.hash)throw Error('Review PNG does not represent the retained PDF pixels');
  artifacts.push(image,image.raster,image.receipt);
 });
 for(const sheet of r.footerSheets??[])artifacts.push(check(sheet));
 return artifacts;
}
