import fs from 'node:fs';
import path from 'node:path';
import {decodePpm,renderPdfPage,rgbPng} from './pdf-rasters.mjs';
import {artifactHash} from './page-review.mjs';

// Native pixels prevent thumbnail resampling from erasing thin mathematical ink.
export function nativeRasterTiles({width,height,pixels},overlap=64){
 const midX=Math.floor(width/2),midY=Math.floor(height/2),tiles=[];
 for(const [name,left,right,top,bottom] of [
  ['upper-left',0,Math.min(width,midX+overlap),0,Math.min(height,midY+overlap)],
  ['upper-right',Math.max(0,midX-overlap),width,0,Math.min(height,midY+overlap)],
  ['lower-left',0,Math.min(width,midX+overlap),Math.max(0,midY-overlap),height],
  ['lower-right',Math.max(0,midX-overlap),width,Math.max(0,midY-overlap),height],
 ]){
  const w=right-left,h=bottom-top,data=Buffer.alloc(w*h*3);
  for(let y=0;y<h;y++)pixels.copy(data,y*w*3,((top+y)*width+left)*3,((top+y)*width+right)*3);
  tiles.push({name,left,top,width:w,height:h,pixels:data});
 }
 return tiles;
}
export function writeNativeReviewDetails(pdf,page,out){
 if(artifactHash(pdf.path)!==pdf.hash)throw Error('Native detail requires the current checked PDF');
 return nativeRasterTiles(decodePpm(renderPdfPage(pdf.path,page))).map(tile=>{
  const file=path.resolve(out,`page-${page}-${tile.name}.png`);
  fs.writeFileSync(file,rgbPng(tile));return {page,position:tile.name,imagePath:file,nativePixels:true};
 });
}
