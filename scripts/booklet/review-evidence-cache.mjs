// Cache deterministic verification work, never reviewer acceptance. Every call
// freshly hashes the entire dependency closure before a successful result is reused.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validatePdfRasters as validateOriginalRasters} from './pdf-rasters.mjs';
import {validateEditionComparison as validateOriginalComparison} from './edition-comparison.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const editions=['student','short','worked','with-short','with-worked'];
// Loaded function code must continue to match its source files, including this
// wrapper. An in-process source edit is rejected, not treated as a cold cache miss.
const implementations=['./pdf-rasters.mjs','./edition-comparison.mjs','./page-review.mjs','./review-evidence-cache.mjs'].map(relative=>{
 const file=fileURLToPath(new URL(relative,import.meta.url));return {path:file,hash:hash(fs.readFileSync(file))};
});
const rasterResults=new Map(),comparisonResults=new Map();
function scope(){
 const actual=new Map();
 const check=ref=>{
  if(!ref?.path||!path.isAbsolute(ref.path)||typeof ref.hash!=='string')throw Error('Missing or stale review dependency: '+ref?.path);
  const file=path.resolve(ref.path);
  if(!actual.has(file)){
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())throw Error('Missing or stale review dependency: '+file);
   actual.set(file,hash(fs.readFileSync(file)));
  }
  if(actual.get(file)!==ref.hash)throw Error('Missing or stale review dependency: '+file);
  return ref;
 };
 implementations.forEach(check);
 return {check,key:input=>hash(JSON.stringify({input,implementations,artifacts:[...actual]}))};
}
function rasterClosure(manifest,check){
 check(manifest.pdf);check(manifest.rasterization?.implementation);
 for(const image of manifest.images??[]){check(image);check(image.raster);check(image.receipt);}
 for(const footer of manifest.rasterization?.footerSheets??[])check(footer);
}
function remember(cache,key,value,limit){
 cache.set(key,structuredClone(value));
 if(cache.size>limit)cache.delete(cache.keys().next().value);
 return structuredClone(value);
}
export function validatePdfRasters(manifest){
 // Preserve the original inexpensive legacy contract without introducing new requirements.
 if(manifest.version!==2&&!manifest.rasterization)return validateOriginalRasters(manifest);
 const fresh=scope();rasterClosure(manifest,fresh.check);const key=fresh.key(manifest);
 if(rasterResults.has(key))return structuredClone(rasterResults.get(key));
 return remember(rasterResults,key,validateOriginalRasters(manifest),32);
}
export function validateEditionComparison(ref,inputEditions,options={}){
 const fresh=scope(),report=read(fresh.check(ref).path),manifests={};
 fresh.check(report.algorithm);
 for(const edition of editions){
  const manifestRef=inputEditions?.[edition]?.manifest,manifest=read(fresh.check(manifestRef).path);
  manifests[edition]=manifest;
  if(manifest.version===2||manifest.rasterization)rasterClosure(manifest,fresh.check);
  else fresh.check(manifest.pdf);
  // Comparison rasters are separately named inputs; do not assume that their
  // paths are identical to the full-page PNG validation's raster references.
  for(const page of report.editions?.[edition]?.pages??[])fresh.check(page.raster);
 }
 const key=fresh.key({ref,inputEditions,report,manifests,options});
 if(comparisonResults.has(key))return structuredClone(comparisonResults.get(key));
 return remember(comparisonResults,key,validateOriginalComparison(ref,inputEditions,options),8);
}
