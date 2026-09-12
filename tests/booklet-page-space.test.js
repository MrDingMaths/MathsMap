import test from 'node:test';
import assert from 'node:assert/strict';
import {measureBookletPage,pageSpaceLabel,BOOKLET_PX_PER_MM as mm} from '../src/lib/booklet-page-space.js';

function fixture({zoom=1,ends=[160],columns=false}={}){
  const rect=(top,bottom,width=180*mm,left=15*mm)=>({top:top*zoom,bottom:bottom*zoom,width:width*zoom,left:left*zoom});
  const child=(end,control=false)=>({matches:()=>control,getBoundingClientRect:()=>rect(80,end)});
  const main={getBoundingClientRect:()=>rect(80,1080),children:[...ends.map(end=>child(end)),child(2000,true)],querySelectorAll:()=>columns?ends.map(end=>({children:[child(end)]})):[]};
  const footer={getBoundingClientRect:()=>rect(1080,1090)};
  const paper={getBoundingClientRect:()=>rect(0,297*mm,210*mm,0),querySelector:s=>s==='main'?main:footer};
  return {querySelector:()=>paper};
}

test('remaining space reserves the actual footer clearance and excludes editor controls',()=>{
  const value=measureBookletPage(fixture());
  assert.equal(value.height,80);assert.equal(value.capacity,988);
  assert.equal(value.remainingMm,908/mm);
});
test('physical space is independent of zoom and transform scale',()=>{
  const normal=measureBookletPage(fixture());
  for(const zoom of [.25,.5,.75,1,1.5,2])assert.ok(Math.abs(measureBookletPage(fixture({zoom})).remainingMm-normal.remainingMm)<1e-8);
});
test('each answer column reports its own remaining space, with the tallest determining fit',()=>{
  const value=measureBookletPage(fixture({ends:[1068,800],columns:true}));
  assert.equal(value.remainingMm,0);assert.deepEqual(value.columns,[0,268/mm]);
});
test('oversized content is reported, while subpixel fitting tolerance is retained',()=>{
  const value=measureBookletPage(fixture({ends:[1100]}));
  assert.ok(value.remainingMm<0);assert.match(pageSpaceLabel(value.remainingMm),/^Overflow by/);
  assert.equal(pageSpaceLabel(-.01),'≈ 0 mm remaining');
});
test('covers do not fabricate remaining editing space',()=>{
  assert.equal(measureBookletPage({querySelector:()=>null}),null);
});
