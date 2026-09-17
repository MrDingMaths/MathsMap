// One retained PDF raster supplies review images, exact comparisons and footers.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gzipSync,gunzipSync,deflateSync} from 'node:zlib';

export const RASTER_FORMAT='mathsmap-pdf-rasters-v1',DPI=144,FOOTER_MM=15;
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
