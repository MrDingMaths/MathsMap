import test from 'node:test';
import assert from 'node:assert/strict';
import {storageViolations} from '../scripts/check-repo-storage.mjs';

test('repository guard blocks local payloads, large files and accumulated growth while keeping bank baselines',()=>{
  const policy={maxFileBytes:100,maxTotalBytes:200,fileLimits:{'booklets/projects/large.json':150}};
  assert.equal(storageViolations([{path:'booklets/question-bank/.revisions/q/hash.json',bytes:80},{path:'booklets/studio-sources/topic/original.pdf',bytes:80}],policy).errors.length,0);
  for(const p of ['.booklet-work/run/file.json','booklets/.storage-archives/objects/a.gz','booklets/projects/.revisions/id/1.json','booklets/archives/old.json','output/export.pdf','dist/index.html']) assert.ok(storageViolations([{path:p,bytes:1}],policy).errors.length);
  assert.equal(storageViolations([{path:'booklets/projects/large.json',bytes:140}],policy).errors.length,0);
  assert.ok(storageViolations([{path:'new.bin',bytes:101}],policy).errors.length);
  assert.ok(storageViolations([{path:'a',bytes:100},{path:'b',bytes:100},{path:'c',bytes:1}],policy).errors.length);
});
