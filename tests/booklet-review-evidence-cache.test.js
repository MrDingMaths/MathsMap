import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {ensurePdfRasters,validatePdfRasters as originalRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {buildEditionComparison,validateEditionComparison as originalComparison} from '../scripts/booklet/edition-comparison.mjs';
import {validatePdfRasters,validateEditionComparison} from '../scripts/booklet/review-evidence-cache.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),ref=file=>({path:file,hash:hash(fs.readFileSync(file))});
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-review-memo-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert(path.basename(dir).startsWith('mathsmap-review-memo-'));fs.rmSync(dir,{recursive:true,force:true});});
 const pdf=path.join(dir,'fixture.pdf');fs.writeFileSync(pdf,'Synthetic PDF; no visual acceptance');
 const ppm=Buffer.concat([Buffer.from('P6\n2 3\n255\n'),Buffer.alloc(18,10)]);
 const raster=ensurePdfRasters(ref(pdf),1,path.join(dir,'rasters'),{render:()=>ppm,engine:'Synthetic deterministic fixture'});
 return {dir,pdf,ppm,manifest:{version:2,pdf:ref(pdf),pages:[{page:1}],...raster}};
}
async function comparisonFixture(t){
 const f=fixture(t),editions={};
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const file=path.join(f.dir,edition+'.json');fs.writeFileSync(file,JSON.stringify({...f.manifest,mode:'full',passed:true,edition,projectHash:'p',renderer:'r',workflowKey:'w'}));editions[edition]={manifest:ref(file)};
 }
 const comparison=await buildEditionComparison(editions,path.join(f.dir,'comparison'),{engine:'Synthetic deterministic fixture',render:()=>assert.fail('No PDF export needed')});
 return {...f,editions,comparison:comparison.reference};
}
function readsDuring(fn,file){
 const original=fs.readFileSync;let reads=0;
 fs.readFileSync=function(f,...args){if(path.resolve(String(f))===path.resolve(file))reads++;return original.call(this,f,...args);};
 try{return {value:fn(),reads};}finally{fs.readFileSync=original;}
}
test('raster first/repeat equals original; warm result still hashes bytes and cannot be poisoned',t=>{
 const {manifest:m}=fixture(t),expected=originalRasters(m),raster=m.images[0].raster.path;
 const first=readsDuring(()=>validatePdfRasters(m),raster);assert.deepEqual(first.value,expected);assert(first.reads>1);
 first.value[0].hash='poison';
 const repeated=readsDuring(()=>validatePdfRasters(m),raster);assert.deepEqual(repeated.value,expected);assert.equal(repeated.reads,1);
 repeated.value.length=0;assert.deepEqual(validatePdfRasters(m),expected);
});
test('comparison first/repeat equals original; warm result hashes closure and cannot be poisoned',async t=>{
 const f=await comparisonFixture(t),expected=originalComparison(f.comparison,f.editions),raster=f.manifest.images[0].raster.path;
 const first=readsDuring(()=>validateEditionComparison(f.comparison,f.editions),raster);assert.deepEqual(first.value,expected);assert(first.reads>1);
 first.value.artifacts[0].hash='poison';first.value.manual.poison='unreviewed';
 const repeated=readsDuring(()=>validateEditionComparison(f.comparison,f.editions),raster);assert.deepEqual(repeated.value,expected);assert.equal(repeated.reads,1);
 repeated.value.artifacts.length=0;assert.deepEqual(validateEditionComparison(f.comparison,f.editions),expected);
});
test('warm raster cache rejects PNG/PPM/receipt/PDF/footer byte corruption',t=>{
 const {manifest:m,pdf}=fixture(t);validatePdfRasters(m);
 for(const file of [m.images[0].path,m.images[0].raster.path,m.images[0].receipt.path,pdf,m.rasterization.footerSheets[0].path]){
  const bytes=fs.readFileSync(file);try{fs.appendFileSync(file,'changed');assert.throws(()=>validatePdfRasters(m),/stale/);}finally{fs.writeFileSync(file,bytes);}
 }
});
test('warm comparison cache rejects every referenced byte dependency',async t=>{
 const f=await comparisonFixture(t);validateEditionComparison(f.comparison,f.editions);
 for(const file of [f.comparison.path,f.editions.student.manifest.path,f.pdf,f.manifest.images[0].path,f.manifest.images[0].raster.path,f.manifest.images[0].receipt.path,f.manifest.rasterization.footerSheets[0].path]){
  const bytes=fs.readFileSync(file);try{fs.appendFileSync(file,'changed');assert.throws(()=>validateEditionComparison(f.comparison,f.editions),/stale/);}finally{fs.writeFileSync(file,bytes);}
 }
});
test('rehashed forged PNG misses memo and fails original equivalence',t=>{
 const {manifest:m}=fixture(t);validatePdfRasters(m);fs.appendFileSync(m.images[0].path,'extra bytes');const changed=structuredClone(m);changed.images[0].hash=ref(changed.images[0].path).hash;
 assert.throws(()=>validatePdfRasters(changed),/does not represent/);
});
test('rehashed changed PPM with updated receipt still fails original equivalence',t=>{
 const {manifest:m,ppm}=fixture(t);validatePdfRasters(m);const changed=structuredClone(m),i=changed.images[0],other=Buffer.from(ppm);other[other.length-1]++;
 fs.writeFileSync(i.raster.path,gzipSync(other));i.raster.hash=ref(i.raster.path).hash;const receipt=read(i.receipt.path);receipt.raster={...i.raster};fs.writeFileSync(i.receipt.path,JSON.stringify(receipt));i.receipt.hash=ref(i.receipt.path).hash;
 assert.throws(()=>validatePdfRasters(changed),/does not represent/);
});
test('rehashed receipt/PDF and changed dimensions/engine/DPI must run original guards',t=>{
 const {manifest:m}=fixture(t);validatePdfRasters(m);
 for(const field of ['engine','dpi']){const changed=structuredClone(m);changed.rasterization[field]=field==='engine'?'Changed engine':72;assert.throws(()=>validatePdfRasters(changed),/identity|stale/);}
 const width=structuredClone(m);width.images[0].width++;assert.throws(()=>validatePdfRasters(width),/does not represent/);
 const receipt=read(m.images[0].receipt.path),bytes=fs.readFileSync(m.images[0].receipt.path);receipt.key='0'.repeat(64);fs.writeFileSync(m.images[0].receipt.path,JSON.stringify(receipt));const forged=structuredClone(m);forged.images[0].receipt.hash=ref(forged.images[0].receipt.path).hash;assert.throws(()=>validatePdfRasters(forged),/identity/);fs.writeFileSync(m.images[0].receipt.path,bytes);
 fs.appendFileSync(m.pdf.path,'new PDF');const pdf=structuredClone(m);pdf.pdf.hash=ref(pdf.pdf.path).hash;assert.throws(()=>validatePdfRasters(pdf),/stale/);
});
test('benign manifest metadata and valid reference changes rerun original pixel checks',t=>{
 const {manifest:m,dir}=fixture(t);validatePdfRasters(m);const changed=structuredClone(m);changed.audit='new metadata';assert(readsDuring(()=>validatePdfRasters(changed),m.images[0].raster.path).reads>1);
 const other=path.join(dir,'same-bytes-new-reference.png');fs.copyFileSync(m.images[0].path,other);changed.images[0].path=other;assert(readsDuring(()=>validatePdfRasters(changed),m.images[0].raster.path).reads>1);
});
test('rehashed benign report metadata and changed comparison raster path rerun original',async t=>{
 const f=await comparisonFixture(t);validateEditionComparison(f.comparison,f.editions);const report=read(f.comparison.path);report.audit='new metadata';fs.writeFileSync(f.comparison.path,JSON.stringify(report));let updated=ref(f.comparison.path);
 assert(readsDuring(()=>validateEditionComparison(updated,f.editions),f.manifest.images[0].raster.path).reads>1);
 const other=path.join(f.dir,'same-bytes-comparison.ppm.gz');fs.copyFileSync(report.editions.student.pages[0].raster.path,other);report.editions.student.pages[0].raster.path=other;fs.writeFileSync(f.comparison.path,JSON.stringify(report));updated=ref(f.comparison.path);
 assert(readsDuring(()=>validateEditionComparison(updated,f.editions),f.manifest.images[0].raster.path).reads>1);
});
test('rehashed forged comparison body/algorithm and manifest dependencies cannot use prior pass',async t=>{
 const f=await comparisonFixture(t);validateEditionComparison(f.comparison,f.editions);const original=fs.readFileSync(f.comparison.path),report=read(f.comparison.path);report.editions.student.pages[0].bodyHash='0'.repeat(64);fs.writeFileSync(f.comparison.path,JSON.stringify(report));assert.throws(()=>validateEditionComparison(ref(f.comparison.path),f.editions),/pixels changed/);fs.writeFileSync(f.comparison.path,original);
 const algorithm=read(f.comparison.path),copy=path.join(f.dir,'algorithm-copy.mjs');fs.copyFileSync(algorithm.algorithm.path,copy);algorithm.algorithm=ref(copy);fs.writeFileSync(f.comparison.path,JSON.stringify(algorithm));assert.throws(()=>validateEditionComparison(ref(f.comparison.path),f.editions),/implementation/);fs.writeFileSync(f.comparison.path,original);
 const changed=read(f.editions.student.manifest.path);changed.projectHash='changed';fs.writeFileSync(f.editions.student.manifest.path,JSON.stringify(changed));const editions=structuredClone(f.editions);editions.student.manifest=ref(f.editions.student.manifest.path);assert.throws(()=>validateEditionComparison(f.comparison,editions),/different dependencies|dependencies changed/);
});
test('loaded implementation/algorithm/artifactHash dependency bytes are pinned in an isolated subprocess',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-review-dependency-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert(path.basename(dir).startsWith('mathsmap-review-dependency-'));fs.rmSync(dir,{recursive:true,force:true});});
 const files=['scripts/booklet/pdf-rasters.mjs','scripts/booklet/edition-comparison.mjs','scripts/booklet/page-review.mjs','scripts/booklet/review-evidence-cache.mjs','src/lib/svg-paint-scope.js'];
 for(const relative of files){const from=fileURLToPath(new URL('../'+relative,import.meta.url)),to=path.join(dir,relative);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);assert.equal(hash(fs.readFileSync(from)),hash(fs.readFileSync(to)));}
 fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({type:'module',private:true}));
 const script=`import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
 const root=path.resolve(process.argv[1]),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 const {ensurePdfRasters}=await import(pathToFileURL(path.join(root,'scripts/booklet/pdf-rasters.mjs')));
 const {validatePdfRasters}=await import(pathToFileURL(path.join(root,'scripts/booklet/review-evidence-cache.mjs')));
 const pdf=path.join(root,'fixture.pdf');fs.writeFileSync(pdf,'Synthetic isolated PDF');const pdfRef={path:pdf,hash:digest(fs.readFileSync(pdf))};
 const ppm=Buffer.concat([Buffer.from('P6\\n2 3\\n255\\n'),Buffer.alloc(18,10)]);
 const raster=ensurePdfRasters(pdfRef,1,path.join(root,'rasters'),{render:()=>ppm,engine:'Synthetic deterministic fixture'}),manifest={version:2,pdf:pdfRef,pages:[{page:1}],...raster};validatePdfRasters(manifest);
 let checked=0;for(const name of ['pdf-rasters.mjs','edition-comparison.mjs','page-review.mjs','review-evidence-cache.mjs']){
  const file=path.resolve(root,'scripts/booklet',name),relative=path.relative(root,file);assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));const bytes=fs.readFileSync(file);
  try{fs.appendFileSync(file,'\\n// isolated mutation\\n');assert.throws(()=>validatePdfRasters(manifest),/stale/);checked++;}finally{fs.writeFileSync(file,bytes);}
 }
 validatePdfRasters(manifest);console.log(JSON.stringify({checked,sourceWritesOutsideFixture:0}));`;
 const result=spawnSync(process.execPath,['--input-type=module','-e',script,dir],{cwd:dir,windowsHide:true,encoding:'utf8',maxBuffer:1024*1024});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.deepEqual(JSON.parse(result.stdout.trim()),{checked:4,sourceWritesOutsideFixture:0});
});
