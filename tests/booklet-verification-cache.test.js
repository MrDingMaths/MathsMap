import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {layoutCacheKey,readLayoutCache,writeLayoutCache,contentAssetSignatures} from '../scripts/booklet/verification-cache.mjs';
import {contentVerificationKey,inspectContentCoverage} from '../src/lib/booklet-content-verification.js';

test('content verification tracks diagram bytes and source references, and rejects unavailable assets',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-content-cache-'));
 try{
  const asset=path.join(dir,'diagram.svg');fs.writeFileSync(asset,'first diagram');
  const entry={id:'source-d',targetId:'d',kind:'diagram',pageNumber:1};
  const project={sections:[{blocks:[{id:'d',format:'image',src:asset,sourceRefs:[{pageNumber:1}]}]}],source:{inventory:{entries:[entry]}}};
  let assets=await contentAssetSignatures(project);
  const before=await contentVerificationKey(project,entry,undefined,assets);
  entry.verification={checked:true,signature:before};
  assert.equal((await inspectContentCoverage(project,{assetSignatures:assets})).complete,true);
  fs.writeFileSync(asset,'changed diagram');assets=await contentAssetSignatures(project);
  assert.equal((await inspectContentCoverage(project,{assetSignatures:assets})).counts.unchecked,1);
  const changed=await contentVerificationKey(project,entry,undefined,assets);
  project.sections[0].blocks[0].sourceRefs=[{pageNumber:2}];
  assert.notEqual(await contentVerificationKey(project,entry,undefined,assets),changed);
  fs.unlinkSync(asset);assets=await contentAssetSignatures(project);
  assert.ok((await inspectContentCoverage(project,{assetSignatures:assets})).issues.some(i=>i.kind==='unreadable-diagram'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('layout cache checks the PDF and referenced asset bytes, not only paths',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-cache-'));
 try{
  const asset=path.join(dir,'diagram.svg'),pdf=path.join(dir,'test.pdf'),cache=path.join(dir,'check.json');
  fs.writeFileSync(asset,'first diagram');fs.writeFileSync(pdf,'first PDF');
  const project={sections:[{blocks:[{id:'d',format:'image',src:asset}]}],settings:{}};
  const key=await layoutCacheKey(project,'short','renderer-1');
  writeLayoutCache(cache,key,pdf,{pages:2});assert.deepEqual(readLayoutCache(cache,key,pdf),{pages:2});
  fs.writeFileSync(asset,'changed diagram');assert.notEqual(await layoutCacheKey(project,'short','renderer-1'),key);
  assert.notEqual(await layoutCacheKey(project,'worked','renderer-1'),key);
  assert.notEqual(await layoutCacheKey(project,'short','renderer-2'),key);
  fs.writeFileSync(pdf,'changed PDF');assert.equal(readLayoutCache(cache,key,pdf),null);
  project.sections[0].blocks[0].src='https://example.test/changing.svg';assert.equal(await layoutCacheKey(project,'short','renderer-1'),null);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
