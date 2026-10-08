import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeRasterTiles} from '../scripts/booklet/native-review-details.mjs';
test('native review tiles preserve one-pixel lines and cover every original pixel across overlaps',()=>{
 const width=19,height=23,pixels=Buffer.alloc(width*height*3,255);
 for(let y=0;y<height;y++)pixels.fill(0,(y*width+9)*3,(y*width+10)*3);
 const covered=new Set();
 for(const t of nativeRasterTiles({width,height,pixels},2))for(let y=0;y<t.height;y++)for(let x=0;x<t.width;x++){
  const i=(y*t.width+x)*3,j=((t.top+y)*width+t.left+x)*3;
  assert.deepEqual(t.pixels.subarray(i,i+3),pixels.subarray(j,j+3));covered.add(j);
 }
 assert.equal(covered.size,width*height);
});
