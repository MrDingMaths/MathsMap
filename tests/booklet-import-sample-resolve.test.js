// Resolving a reviewed early sample without another review round (import-sample-review.mjs resolveImportSample).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {resolveImportSample,sampleSourceKey} from '../scripts/booklet/import-sample-review.mjs';
import {loadReviewed,saveReviewed} from '../scripts/booklet/lean-review.mjs';

const sha = b => createHash('sha256').update(b).digest('hex');
function fixture() {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sample-resolve-')), runDir = path.join(root, 'run'), sampleDir = path.join(root, 'sample');
 fs.mkdirSync(path.join(runDir, 'lean-review'), {recursive: true}); fs.mkdirSync(sampleDir);
 const manifest = {source: {pdf: 'x.pdf'}};
 fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify(manifest));
 const project = {id: 'p', sections: [{id: 's', phase: 'practice', blocks: [{id: 'q1', type: 'question', content: {id: 'q1-root', children: [{id: 'q1-a', answer: {solutionDiagrams: [{id: 'd1', format: 'tikz', code: 'x'}]}}]}}, {id: 'q2', type: 'question', content: {id: 'q2-root'}}]}]};
 const projectFile = path.join(root, 'candidate.json'); fs.writeFileSync(projectFile, JSON.stringify(project));
 const image = path.join(sampleDir, 'p1.png'); fs.writeFileSync(image, 'png');
 const sample = {ok: true, editions: ['short'], pages: [{edition: 'short', page: 1, image, blocks: ['q1']}, {edition: 'short', page: 2, image, blocks: ['q2']}, {edition: 'short', page: 3, image, blocks: ['q2']}]};
 const report = {short: {pageHashes: [{page: 1, hash: 'h1'}, {page: 2, hash: 'h2'}, {page: 3, hash: 'h3'}]}};
 fs.writeFileSync(path.join(sampleDir, 'layout-sample.json'), JSON.stringify(sample));
 fs.writeFileSync(path.join(sampleDir, 'report.json'), JSON.stringify({report: {p: report}}));
 const sampleHash = sha(JSON.stringify({sample, report, images: sample.pages.map(() => sha(fs.readFileSync(image)))}));
 const dir = path.join(runDir, 'lean-review'), state = loadReviewed(dir);
 state.workflow = {p: {sample: {accepted: false, sourceKey: sampleSourceKey(manifest), sampleHash, dir: path.resolve(sampleDir)}}};
 state.pages = {'short:h1': {outcome: 'needs-change', finding: 'label on curve'}, 'short:h2': {outcome: 'needs-change', finding: 'axis missing'}, 'short:h3': {outcome: 'accepted', finding: ''}};
 saveReviewed(dir, state);
 fs.writeFileSync(path.join(dir, 'corrections.jsonl'), JSON.stringify({correctionId: 'fix-d1', targetId: 'd1', field: '/code'}) + '\n');
 const evidence = path.join(root, 'crop.png'); fs.writeFileSync(evidence, 'crop');
 return {runDir, sampleDir, projectFile, evidence, dir};
}
const write = (file, resolutions) => { fs.writeFileSync(file, JSON.stringify({resolutions})); return file; };

test('decisions and verified repairs accept the sample with no review call', async () => {
 const f = fixture(), calls = {labels: 0, render: null};
 const resolutionsFile = write(path.join(f.sampleDir, '..', 'res.json'), [
  {edition: 'short', page: 1, kind: 'repaired', corrections: ['fix-d1'], reason: 'label moved'},
  {edition: 'short', page: 2, kind: 'decision', decidedBy: 'James', reason: 'axis is continuous', evidence: f.evidence}]);
 const result = await resolveImportSample({runDir: f.runDir, projectFile: f.projectFile, sampleDir: f.sampleDir, resolutionsFile,
  labels: async () => { calls.labels++; return {collisions: []}; }, render: async args => { calls.render = args.targets; return {issues: [], skipped: [], seconds: 1}; }});
 assert.equal(result.sampleAccepted, true); assert.equal(result.resolved, 2);
 assert.equal(calls.labels, 1); assert.deepEqual(calls.render, ['q1']);
 const state = loadReviewed(f.dir);
 assert.equal(state.workflow.p.sample.accepted, true);
 assert.equal(state.pages['short:h2'].decision.decidedBy, 'James'); assert.equal(state.pages['short:h2'].decision.overrides.finding, 'axis missing');
 assert.deepEqual(state.pages['short:h1'].resolution.corrections, ['fix-d1']);
 assert.equal(fs.readFileSync(path.join(f.dir, 'page-decisions.jsonl'), 'utf8').trim().split('\n').length, 1);
 assert.equal(fs.readFileSync(path.join(f.dir, 'sample-resolutions.jsonl'), 'utf8').trim().split('\n').length, 1);
});

test('every open finding needs one resolution, and repairs must be applied and verified', async () => {
 const f = fixture(), res = path.join(f.sampleDir, '..', 'res.json'), ok = {labels: async () => ({collisions: []}), render: async () => ({issues: [], skipped: []})};
 const run = (rows, deps = ok) => resolveImportSample({runDir: f.runDir, projectFile: f.projectFile, sampleDir: f.sampleDir, resolutionsFile: write(res, rows), ...deps});
 const decision = {edition: 'short', page: 2, kind: 'decision', decidedBy: 'James', reason: 'r', evidence: f.evidence};
 await assert.rejects(run([decision]), /exactly one resolution for short p1/);
 await assert.rejects(run([decision, {edition: 'short', page: 1, kind: 'repaired', corrections: ['never-applied'], reason: 'r'}]), /was not applied/);
 await assert.rejects(run([decision, {edition: 'short', page: 1, kind: 'repaired', corrections: ['fix-d1'], reason: 'r'}, {edition: 'short', page: 3, kind: 'decision', decidedBy: 'J', reason: 'r', evidence: f.evidence}]), /No open finding on short p3/);
 const repaired = {edition: 'short', page: 1, kind: 'repaired', corrections: ['fix-d1'], reason: 'r'};
 await assert.rejects(run([decision, repaired], {...ok, labels: async () => ({collisions: [{id: 'd1'}]})}), /Label collisions remain: d1/);
 await assert.rejects(run([decision, repaired], {...ok, render: async () => ({issues: [{edition: 'short', kind: 'footer-overflow'}], skipped: []})}), /Targeted render found issues/);
 await assert.rejects(run([{...decision, evidence: path.join(f.sampleDir, 'missing.png')}, repaired]), /existing evidence file/);
 assert.equal(loadReviewed(f.dir).workflow.p.sample.accepted, false);
});

test('a changed sample cannot be resolved against its old review', async () => {
 const f = fixture();
 fs.writeFileSync(path.join(f.sampleDir, 'p1.png'), 'different');
 await assert.rejects(resolveImportSample({runDir: f.runDir, projectFile: f.projectFile, sampleDir: f.sampleDir, resolutionsFile: write(path.join(f.sampleDir, '..', 'r.json'), [])}), /changed since it was reviewed/);
});
