import test from 'node:test';
import assert from 'node:assert/strict';
import {settleBookletMeasurement} from '../src/lib/booklet-measurement.js';

test('offscreen booklet settling starts lazy diagram jobs through the queue API',async()=>{
 const savedTikZ=globalThis.TikZ,savedObserver=globalThis.MutationObserver;
 let ready=false,flushed=0,calibrated=false;
 const fonts=[];fonts.ready=Promise.resolve();
 const diagram={querySelector:()=>ready?{}:null};
 const root={querySelectorAll:s=>s==='.tikz-wrap'?[diagram]:[],querySelector:()=>null,getBoundingClientRect:()=>({}),ownerDocument:{fonts,defaultView:{getComputedStyle:()=>({fontFamily:'serif'})}}};
 globalThis.MutationObserver=class{observe(){}disconnect(){}};
 globalThis.TikZ={flushPending:async(surface,timeout)=>{assert.equal(surface,root);assert.equal(timeout,50);flushed++;ready=true;return true;}};
 try{
  await settleBookletMeasurement(root,{timeoutMs:50,calibrate:()=>{calibrated=true;}});
  assert.equal(flushed,1);assert.equal(calibrated,true);
  ready=false;globalThis.TikZ.flushPending=async()=>false;
  await assert.rejects(settleBookletMeasurement(root,{timeoutMs:50,calibrate:()=>{}}),/Diagram queue timed out/);
  globalThis.TikZ.flushPending=()=>new Promise(()=>{});
  const controller=new AbortController();
  const settling=settleBookletMeasurement(root,{signal:controller.signal,timeoutMs:50,calibrate:()=>{}});
  controller.abort();
  await assert.rejects(settling,error=>error.cancelled===true);
 }finally{
  if(savedTikZ===undefined)delete globalThis.TikZ;else globalThis.TikZ=savedTikZ;
  if(savedObserver===undefined)delete globalThis.MutationObserver;else globalThis.MutationObserver=savedObserver;
 }
});
