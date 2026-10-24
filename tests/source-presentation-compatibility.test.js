import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {compatibleSourcePresentation} from '../scripts/booklet/source-presentation-compatibility.mjs';
import {assertPinnedInputs, presentationContractForRun} from '../scripts/booklet/transcription.mjs';

const relative = 'scripts/booklet/prompts/source-presentation-v2.md';
const current = fs.readFileSync(new URL('../' + relative, import.meta.url));
// Use the actual contract as a fixture, retaining all its old content verbatim.
const before = Buffer.from(current.toString().replace(/Question-stem placement \(24 October 2026, user feedback\):[^\r\n]+\r?\n\r?\n/, ''));
const expected = createHash('sha256').update(before).digest('hex');
function fixture(t) {
 const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'presentation-pin-'));
 t.after(() => fs.rmSync(runDir, {recursive:true, force:true}));
 fs.mkdirSync(path.join(runDir, 'tooling-input-history'));
 const history = path.join(runDir, 'tooling-input-history', expected + '.source-presentation-v2.md');
 fs.writeFileSync(history, before);
 return {runDir, history, relative, expected, current};
}
test('only the exact added stem convention admits the retained v2 pin without changing it', t => {
 const input = fixture(t);
 assert.equal(compatibleSourcePresentation(input), true);
 const model = 'gpt-6.1-sol';
 const manifest = {provider:'codex',model,effort:'medium', pins:{model:createHash('sha256').update(JSON.stringify(model)).digest('hex'), files:{[relative]:expected}}};
 const original = JSON.stringify(manifest);
 fs.writeFileSync(path.join(input.runDir, 'manifest.json'), original);
 assert.deepEqual(assertPinnedInputs(input.runDir), manifest);
 assert.equal(fs.readFileSync(path.join(input.runDir, 'manifest.json'), 'utf8'), original);
 assert.deepEqual(fs.readFileSync(input.history), before);
 assert.equal(presentationContractForRun(manifest), current.toString());
});
test('other additions, deleted old content, duplicate additions and other paths are rejected', t => {
 const input = fixture(t);
 const addition=current.toString().match(/Question-stem placement \(24 October 2026, user feedback\):[^\r\n]+\r?\n\r?\n/)[0];
 for (const changed of [current.toString().replace('keep the shared stem', 'move the shared stem'), current.toString().replace('Preserve every syllabus outcome code', 'Omit every syllabus outcome code'), current.toString().replace('Preserve every syllabus outcome code and its full statement on Syllabus Content pages. ', ''), current.toString() + '\nAnother convention.\n', current.toString().replace(addition,addition+addition)]) {
  assert.equal(compatibleSourcePresentation({...input, current:Buffer.from(changed)}), false);
 }
 assert.equal(compatibleSourcePresentation({...input, relative:'scripts/booklet/prompts/source-presentation-v1.md'}), false);
});
test('missing or corrupted historical bytes cannot admit a mismatched pin', t => {
 const input = fixture(t);
 fs.writeFileSync(input.history, Buffer.concat([before, Buffer.from('corrupt')]));
 assert.equal(compatibleSourcePresentation(input), false);
 assert.throws(() => {
  const model='gpt-6.1-sol';
  fs.writeFileSync(path.join(input.runDir, 'manifest.json'), JSON.stringify({provider:'codex',model,effort:'medium',pins:{model:createHash('sha256').update(JSON.stringify(model)).digest('hex'),files:{[relative]:expected}}}));
  assertPinnedInputs(input.runDir);
 }, /Pinned input changed or disappeared/);
 fs.unlinkSync(input.history);
 assert.equal(compatibleSourcePresentation(input), false);
 assert.equal(compatibleSourcePresentation({...input, expected:'../invalid'}), false);
});
test('the compatibility exception never admits other file or run-file pin drift', t => {
 const input=fixture(t),model='gpt-6.1-sol';
 const manifest={provider:'codex',model,effort:'medium',pins:{model:createHash('sha256').update(JSON.stringify(model)).digest('hex'),files:{[relative]:expected,'scripts/booklet/prompts/source-presentation-v1.md':'0'.repeat(64)}}};
 const manifestFile=path.join(input.runDir,'manifest.json');
 fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 assert.throws(()=>assertPinnedInputs(input.runDir),/Pinned input changed or disappeared: scripts\/booklet\/prompts\/source-presentation-v1.md/);
 delete manifest.pins.files['scripts/booklet/prompts/source-presentation-v1.md'];
 manifest.pins.runFiles={'source-input.json':'0'.repeat(64)};
 fs.writeFileSync(path.join(input.runDir,'source-input.json'),'changed source');
 fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 assert.throws(()=>assertPinnedInputs(input.runDir),/Pinned input changed or disappeared: source-input.json/);
});
