import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {rgbPng,ensureSelectedPdfRasters,selectedPageRanges,validatePdfRasters,TARGETED_RASTER_FORMAT} from '../scripts/booklet/pdf-rasters.mjs';
import {reusableExportManifest,requireLeanFinalEditions,retainVisualPages,accumulateTikzCompilation,tikzCompilationDelta} from '../scripts/booklet/check-compact-exercises.mjs';
import {renderedPageHashes} from '../scripts/booklet/page-review.mjs';
import {LEAN_REVIEW_PROFILE} from '../scripts/booklet/lean-profile.mjs';
import {validatePdfRasters as validateCachedPdfRasters} from '../scripts/booklet/review-evidence-cache.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const samplePng=rgbPng({width:2,height:3,pixels:Buffer.alloc(18,170)});
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-lean-export-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert(path.basename(dir).startsWith('mathsmap-lean-export-'));fs.rmSync(dir,{recursive:true,force:true});});
 const file=path.join(dir,'sample.pdf');fs.writeFileSync(file,'Synthetic PDF identity');
 return {dir,pdf:{path:file,hash:hash(fs.readFileSync(file))}};
}

test('selected physical PDF ranges are bounded, sorted and distinct',()=>{
 assert.deepEqual(selectedPageRanges([11,2,1,3,5,6,7,8,9,10,12],12,{maxPages:4}),[{first:1,last:3},{first:5,last:8},{first:9,last:12}]);
 assert.throws(()=>selectedPageRanges([1,1],3),/distinct/);
 assert.throws(()=>selectedPageRanges([4],3),/physical/);
});

test('lean rasters retain native PNG bytes, reuse exact cache hits and repair one corrupt image',async t=>{
 const {dir,pdf}=fixture(t),out=path.join(dir,'rasters'),calls=[];
 let active=0,maximum=0;
 const renderRange=async(_pdf,first,last)=>{
  calls.push([first,last]);active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setImmediate(resolve));active--;
  return Array.from({length:last-first+1},(_,i)=>({page:first+i,bytes:samplePng}));
 };
 const options={pages:[1,2,5,6,9],engine:'Synthetic PNG renderer',renderRange};
 const first=await ensureSelectedPdfRasters(pdf,10,out,options);
 assert.equal(first.rasterization.format,TARGETED_RASTER_FORMAT);
 assert.deepEqual(first.images.map(image=>image.page),[1,2,5,6,9]);
 assert.deepEqual(calls,[[1,2],[5,6],[9,9]]);
 assert.equal(first.metrics.processes,3);assert.equal(maximum,2);
 assert(first.images.every(image=>fs.readFileSync(image.path).equals(samplePng)));
 assert.equal(fs.readdirSync(out).some(name=>name.endsWith('.ppm.gz')||name.startsWith('footers-')),false);
 const manifest={version:2,reviewProfile:LEAN_REVIEW_PROFILE,pdf,pages:Array.from({length:10},(_,i)=>({page:i+1})),visualPages:[1,2,5,6,9],...first};
 assert.equal(validatePdfRasters(manifest).length,11);
 assert.equal(validateCachedPdfRasters(manifest).length,11);
 const second=await ensureSelectedPdfRasters(pdf,10,out,{...options,renderRange:()=>assert.fail('Valid PNG hits must not rerender')});
 assert.equal(second.metrics.rendered,0);assert.equal(second.metrics.reused,5);
 fs.writeFileSync(first.images[2].path,'broken');
 const third=await ensureSelectedPdfRasters(pdf,10,out,options);
 assert.equal(third.metrics.rendered,1);assert.equal(third.metrics.reused,4);
 assert.deepEqual(calls.at(-1),[5,5]);
 assert.equal(validatePdfRasters({...manifest,images:third.images}).length,11);
});

test('targeted manifests bind selected physical pages, source PDF and review profile',async t=>{
 const {dir,pdf}=fixture(t),raster=await ensureSelectedPdfRasters(pdf,3,path.join(dir,'rasters'),{pages:[2],engine:'Fixture',renderRange:async()=>[{page:2,bytes:samplePng}]});
 const manifest={version:2,reviewProfile:LEAN_REVIEW_PROFILE,pdf,pages:[{page:1},{page:2},{page:3}],visualPages:[2],...raster};
 validatePdfRasters(manifest);
 assert.throws(()=>validatePdfRasters({...manifest,visualPages:[1]}),/identity changed/);
 assert.throws(()=>validatePdfRasters({...manifest,reviewProfile:'legacy'}),/Invalid or stale/);
 assert.throws(()=>validatePdfRasters({...manifest,pdf:{...pdf,hash:'stale'}}),/Invalid or stale/);
});

test('printable-key rebinding is lean-only and requires the exact PDF and renderer',()=>{
 const base={mode:'full',passed:true,edition:'short',renderer:'runtime',projectHash:'old',workflowKey:'old-run',pdf:{hash:'pdf'}};
 const current={edition:'short',renderer:'runtime',projectHash:'new',workflowKey:'new-run',reviewProfile:LEAN_REVIEW_PROFILE,printableKey:'printable',pdfHash:'pdf'};
 assert.equal(reusableExportManifest({...base,reviewProfile:LEAN_REVIEW_PROFILE,printableKey:'printable'},current),true);
 assert.equal(reusableExportManifest({...base,reviewProfile:LEAN_REVIEW_PROFILE,printableKey:'changed'},current),false);
 assert.equal(reusableExportManifest({...base,reviewProfile:LEAN_REVIEW_PROFILE,printableKey:'printable'}, {...current,pdfHash:'other'}),false);
 assert.equal(reusableExportManifest(base,current),false);
 assert.equal(reusableExportManifest({...base,mode:'review',reviewProfile:LEAN_REVIEW_PROFILE,printableKey:'printable'},{...current,allowReviewPdf:true}),true);
 assert.equal(reusableExportManifest({...base,mode:'review',reviewProfile:LEAN_REVIEW_PROFILE,printableKey:'printable'},current),false);
 assert.equal(reusableExportManifest(base,{...current,reviewProfile:undefined,projectHash:'old',workflowKey:'old-run'}),true);
 assert.equal(reusableExportManifest(base,{...current,reviewProfile:undefined}),false);
});

test('lean final checks require five editions; printable page identity keeps mode separate from hash',()=>{
 const project={reviewProfile:LEAN_REVIEW_PROFILE};
 assert.throws(()=>requireLeanFinalEditions(project,['student','short']),/all five/);
 requireLeanFinalEditions(project,['student','short'],{draft:true});
 assert.throws(()=>requireLeanFinalEditions(project,['student'],{draft:true,reviewOnly:true}),/all five/);
 const pages=[{html:'<div>same page</div>',blocks:['q'],mode:'student',isAnswer:false},{html:'<div>same page</div>',blocks:['q'],mode:'short',isAnswer:true,answerSectionStart:true}];
 const rendered=renderedPageHashes(pages,{renderer:'r',settings:{},assets:[]});
 assert.equal(rendered[0].hash,rendered[1].hash);assert.equal(rendered[1].answerSectionStart,true);
});

test('resuming the same PDF keeps prior repair pages outside the ordinary visual sample',()=>{
 assert.deepEqual(retainVisualPages([1,4,10],[6,7,8],10),[1,4,6,7,8,10]);
 assert.deepEqual(retainVisualPages([1,4],[0,4,12],8),[1,4]);
});

test('compiler timing aggregation counts actual compiled events and preserves unavailable durations',()=>{
 let state=accumulateTikzCompilation(null,{source:'driver-cache',timings:{texifyMs:50}});
 assert.deepEqual(tikzCompilationDelta(null,state),{compiles:0,measuredCompiles:0,unmeasuredCompiles:0,measuredMs:0,compilationMs:0});
 state=accumulateTikzCompilation(state,{source:'compiled',timings:{texifyMs:8,texExecutionMs:20,dviToSvgMs:30}});
 const initial=state;
 state=accumulateTikzCompilation(state,{source:'compiled',timings:{texExecutionMs:4,dviToSvgMs:2}});
 assert.equal(tikzCompilationDelta(null,state).compilationMs,14);
 assert.equal(tikzCompilationDelta(initial,state).compilationMs,6);
 state=accumulateTikzCompilation(state,{source:'compiled',timings:{texExecutionMs:4}});
 assert.deepEqual(tikzCompilationDelta(initial,state),{compiles:2,measuredCompiles:1,unmeasuredCompiles:1,measuredMs:6,compilationMs:null});
});
