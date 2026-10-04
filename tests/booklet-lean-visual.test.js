import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {LEAN_REVIEW_PROFILE} from '../scripts/booklet/lean-profile.mjs';
import {selectLayoutSample,samplePages,runLayoutSample,prepareLeanVisualReview,queueVisualReviewAfterExport,editionManifestFiles} from '../scripts/booklet/lean-visual.mjs';
import {exportWithFrozenRuntime} from '../scripts/booklet/import-verification-runtime.mjs';
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-visual-gate-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const write=(dir,name,value)=>{const f=path.join(dir,name);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof value==='string'?value:JSON.stringify(value));return f;};
const prompt=n=>Array.from({length:n},(_,i)=>({type:'text',prompt:'p'+i}));
const project=()=>({id:'book',source:{reviewProfile:LEAN_REVIEW_PROFILE},sections:[
 {phase:'front-matter',blocks:[{id:'cover',type:'rich-text',content:prompt(40)}]},
 {phase:'practice',blocks:[
  {id:'plain-a',type:'question',content:prompt(3)},
  {id:'plain-b',type:'question',content:prompt(12)},
  {id:'figure-small',type:'question',content:{questionDiagrams:[{id:'d1',format:'tikz',code:'x'}]}},
  {id:'figure-big',type:'question',content:{questionDiagrams:[{id:'d2',format:'tikz',code:'y'}],parts:prompt(10)}},
  {id:'grid',type:'question',content:{layout:'grid',cells:prompt(8)}},
 ]}]});

test('the layout sample puts figure blocks first, then the densest block of each other family, and skips generated front matter',()=>{
 const sample=selectLayoutSample(project(),{limit:8});
 assert.deepEqual(sample.slice(0,2).map(r=>r.id),['figure-big','figure-small']);
 assert.ok(sample.slice(0,2).every(r=>r.figure));
 assert.ok(!sample.some(r=>r.id==='cover'));
 assert.equal(sample.filter(r=>r.id==='plain-a'||r.id==='plain-b').length,1,'one block per non-figure family');
 assert.equal(sample.find(r=>r.id==='plain-b')?.id??'plain-a','plain-b');
 assert.equal(selectLayoutSample(project(),{limit:1}).length,1);
 assert.throws(()=>selectLayoutSample(project(),{limit:0}),/positive integer/);
});

test('sampled pages include every page a split block appears on',()=>{
 const map=[{page:1,blocks:['intro']},{page:2,blocks:['figure-big','x']},{page:3,blocks:['figure-big-cont','y']},{page:4,blocks:['other']}];
 assert.deepEqual(samplePages(map,[{id:'figure-big'}]),[2,3]);
 assert.deepEqual(samplePages(map,[{id:'missing'}]),[]);
});

test('a layout sample draft-renders student and worked answers, rasterises only sampled pages and records no acceptance',async t=>{
 const dir=temp(t),projectFile=write(dir,'candidate.json',project()),out=path.join(dir,'sample');
 let exportArgs,rasterCalls=[];
 const exportRuntime=async args=>{
  exportArgs=args;
  write(out,'report.json',{report:{book:{
   student:{pdf:{path:path.join(out,'book-student.pdf'),hash:'a'.repeat(64)},map:[{page:1,blocks:['plain-a']},{page:2,blocks:['figure-big']},{page:3,blocks:['figure-big']}]},
   worked:{pdf:{path:path.join(out,'book-worked.pdf'),hash:'b'.repeat(64)},map:[{page:1,blocks:['figure-small']}]},
  }}});
  return {runtimeManifest:path.join(out,'runtime-manifest.json'),visualAcceptance:false};
 };
 const rasterize=async(pdf,count,rasterDir,{pages})=>{rasterCalls.push({pdf:pdf.path,count,pages});return {images:pages.map(page=>({page,path:path.join(rasterDir,pdf.hash.slice(0,4)+'-'+page+'.png')}))};};
 const result=await runLayoutSample({runDir:dir,projectId:'book',projectFile,out,limit:3},{exportRuntime,rasterize});
 assert.deepEqual(exportArgs.extraArgs,['--draft','--editions','student,worked']);
 assert.deepEqual(rasterCalls.map(c=>c.pages),[[2,3],[1]]);
 assert.deepEqual(result.pages.map(p=>p.edition+':'+p.page),['student:2','student:3','worked:1']);
 assert.equal(result.visualAcceptance,false);
 assert.ok(fs.existsSync(result.file));
 await assert.rejects(runLayoutSample({runDir:dir,projectId:'book',projectFile:write(dir,'legacy.json',{id:'book',sections:[]}),out},{exportRuntime}),/three-pass/);
});

test('final visual review needs a settlement and all five passed edition manifests, then queues the exporter selection',async t=>{
 const dir=temp(t),runDir=path.join(dir,'run'),exportDir=path.join(dir,'exports'),projectFile=write(dir,'book.json',project());
 const manifest={selectedPages:[1,2],reviewProfile:LEAN_REVIEW_PROFILE};
 assert.throws(()=>editionManifestFiles(exportDir,'book'),/all five/);
 await assert.rejects(prepareLeanVisualReview({runDir,manifest,projectFile,projectId:'book',exportDir},{workflow:{settled:null}}),/Settle current content/);
 await assert.rejects(prepareLeanVisualReview({runDir,manifest:{selectedPages:[1]},projectFile,projectId:'book',exportDir},{workflow:{settled:{key:'k'}}}),/three-pass/);
 for(const [edition,pages] of Object.entries({student:[1,3],short:[1],worked:[1,2],'with-short':[1,2,4],'with-worked':[1]}))write(exportDir,'book-'+edition+'.full.pages.json',{edition,visualPages:pages});
 let described,prepared;
 const summary=await prepareLeanVisualReview({runDir,manifest,projectFile,projectId:'book',exportDir},{
  workflow:{settled:{key:'settled-key'}},
  describe:async args=>{described=args;return {mode:'final',key:args.key};},
  prepare:async(dir_,input)=>{prepared={dir:dir_,input};return {total:9,pending:[1,2,3,4,5,6,7,8,9],reused:0};},
 });
 assert.equal(described.key,'settled-key');assert.equal(described.manifestFiles.length,5);
 assert.deepEqual(described.sourceFiles.map(f=>path.basename(f)),['page-001.png','page-002.png']);
 assert.equal(prepared.dir,runDir);assert.equal(summary.pending,9);assert.equal(summary.total,9);
 assert.deepEqual(summary.selectedPagesByEdition,{student:2,short:1,worked:2,'with-short':3,'with-worked':1});
 assert.equal(summary.visualAcceptance,false);
 assert.equal(JSON.parse(fs.readFileSync(summary.inputFile,'utf8')).key,'settled-key');
});

test('a queue problem is reported beside a passed export without hiding that inspection is still pending',async t=>{
 const dir=temp(t);
 const report=await queueVisualReviewAfterExport({runDir:dir,manifest:{selectedPages:[1],reviewProfile:LEAN_REVIEW_PROFILE},projectFile:path.join(dir,'none.json'),projectId:'book',exportDir:path.join(dir,'none')},{workflow:{settled:{key:'k'}}});
 assert.equal(report.visualAcceptance,false);assert.match(report.error,/all five/);assert.match(report.next,/visual --run-id/);
});

test('frozen exports can pass extra checker arguments for a draft sample',async t=>{
 const root=temp(t);write(root,'src/main.js','stable');write(root,'vite.config.js','export default {}');write(root,'node_modules/fixture.js','dependency');write(root,'booklets/projects/book.json',{id:'book'});
 const out=path.join(root,'.booklet-work/exports');let seen;
 const server={listen:async()=>{},httpServer:{address:()=>({port:9000})},close:async()=>{}};
 await exportWithFrozenRuntime({root,out,projectId:'book',runDir:path.join(root,'.booklet-work/run'),extraArgs:['--draft','--editions','student,worked'],createServer:async()=>server,execute:async({args})=>{seen=args;return 0;}});
 assert.deepEqual(seen.slice(-3),['--draft','--editions','student,worked']);
});
