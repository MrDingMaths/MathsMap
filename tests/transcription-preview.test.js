import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { loadDraftPreview } from '../scripts/booklet/transcription-preview.mjs';

const save = (file, value) => { fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value)); };
const page = (n, title) => ({id:`page-${n}`,pageNumber:n,section:{id:'shared-section',title},blocks:[],reviewFlags:[]});
test('unmerged preview shows adopted results and rejected candidates without adopting or rewriting either', t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'transcription-preview-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const runDir=path.join(root,'run'), batchDir=path.join(root,'batch');
  const exact=path.join(runDir,'lanes/exact/task-001.result.json');
  save(exact,{pages:[page(1,'Locally repaired')],assets:[]});
  const dir=path.join(batchDir,'task-002/direct');
  save(path.join(dir,'direct.json'),{task:'task-002'});
  const candidate=path.join(dir,'task-002.123.candidate.json');
  save(candidate,{pages:[page(2,'Raw draft')],assets:[]});
  const sha=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'direct.json'))).digest('hex');
  save(path.join(batchDir,'batch.json'),{format:'mathsmap-direct-transcription-batch-v1',runDir,tasks:[{task:'task-001',pages:[1],directory:'unused'},{task:'task-002',pages:[2],directory:'task-002/direct',manifestSha256:sha}]});
  const before=[fs.readFileSync(exact,'utf8'),fs.readFileSync(candidate,'utf8')];
  const preview=loadDraftPreview(runDir,{id:'run',selectedPages:[1,2,3],directBatch:batchDir});
  assert.deepEqual(preview.transcription.pages.map(p=>p.section.title),['Locally repaired','Raw draft']);
  assert.equal(preview.summary.adoptedPages,1);assert.equal(preview.summary.batchPages,1);
  assert.deepEqual(preview.summary.missingPages,[3]);assert.deepEqual(preview.summary.issues,[]);
  assert.deepEqual([fs.readFileSync(exact,'utf8'),fs.readFileSync(candidate,'utf8')],before);
  assert.equal(fs.existsSync(path.join(runDir,'merged')),false);
  assert.deepEqual(fs.readdirSync(path.join(runDir,'lanes/exact')),['task-001.result.json']);
  // Misconfigured batches do not load another import's private drafts.
  const batch=JSON.parse(fs.readFileSync(path.join(batchDir,'batch.json')));
  batch.runDir=path.join(root,'another-run');save(path.join(batchDir,'batch.json'),batch);
  const wrong=loadDraftPreview(runDir,{id:'run',selectedPages:[1,2,3],directBatch:batchDir});
  assert.equal(wrong.summary.availablePages,1);assert.match(wrong.summary.issues[0].note,/different import/);
  batch.runDir=runDir;batch.tasks[1].directory='../escape';save(path.join(batchDir,'batch.json'),batch);
  assert.match(loadDraftPreview(runDir,{id:'run',selectedPages:[1,2],directBatch:batchDir}).summary.issues[0].note,/outside batch/);
});
