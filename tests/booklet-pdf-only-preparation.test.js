import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareRun, assertPinnedInputs, hashFile } from '../scripts/booklet/transcription.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-preparation-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = {};
  for (const key of ['pdf', 'docx', 'teacherPdf', 'teacherDocx']) {
    files[key] = path.join(root, key); fs.writeFileSync(files[key], key);
  }
  const calls = []; const tooling = [];
  const deps = {
    checkTooling: options => tooling.push(options),
    command: (name, args) => {
      calls.push({ name, args });
      if (name === 'pdfinfo') return 'Pages: 10\n';
      if (name === 'pdftotext') return Array.from({ length: 10 }, (_, i) => `original page ${i + 1}`).join('\f') + '\f';
      if (name === 'pdftoppm') { fs.writeFileSync(args.at(-1) + '.png', `render page ${args[1]}`); return ''; }
      if (name === 'pandoc') {
        fs.writeFileSync(args.at(-1), 'Word content ![figure](media/image.png)');
        const media = args.find(arg => arg.startsWith('--extract-media=')).slice('--extract-media='.length);
        fs.mkdirSync(media, { recursive: true }); fs.writeFileSync(path.join(media, 'image.png'), 'word image'); return '';
      }
      throw Error(name);
    },
  };
  const prepare = options => prepareRun({ pdf: files.pdf, pages: '9-10', runId: 'run', workRoot: path.join(root, 'runs'), ...options }, deps);
  return { root, files, calls, tooling, prepare };
}

test('PDF-only preparation keeps teaching context outside author scope and teacher page identity', t => {
  const f = fixture(t);
  const { runDir, manifest } = f.prepare({ contextPages: '1-2', teacherPdf: f.files.teacherPdf, teacherPages: '2,8' });
  assert.deepEqual(manifest.selectedPages, [9, 10]);
  assert.deepEqual(manifest.contextPages, [1, 2]);
  assert.deepEqual(manifest.teacherPages, [2, 8]);
  assert.equal(manifest.source.docx, undefined);
  assert.deepEqual(f.tooling, [{ word: false }]);
  assert.equal(f.calls.some(call => call.name === 'pandoc'), false);
  assert.equal(fs.readFileSync(path.join(runDir, 'evidence/pages/page-001.txt'), 'utf8'), 'original page 1\n');
  assert.equal(fs.existsSync(path.join(runDir, 'evidence/teacher/pages/page-001.png')), false);
  const teacherText = fs.readFileSync(path.join(runDir, 'evidence/teacher/pages.txt'), 'utf8').split('\f');
  assert.equal(teacherText[0], ''); assert.equal(teacherText[1], 'original page 2'); assert.equal(teacherText[7], 'original page 8');
  assert.equal(manifest.source.teacherPdfHash, hashFile(f.files.teacherPdf));
  assertPinnedInputs(runDir);
  fs.writeFileSync(path.join(runDir, 'evidence/pages/page-001.png'), 'changed');
  assert.throws(() => assertPinnedInputs(runDir), /Pinned input changed/);
});

test('paired PDF/Word preparation preserves and pins extracted teacher and student evidence', t => {
  const f = fixture(t);
  const { runDir, manifest } = f.prepare(f.files);
  assert.deepEqual(f.tooling, [{ word: true }]);
  assert.equal(f.calls.filter(call => call.name === 'pandoc').length, 2);
  assert.equal(manifest.teacherPages.length, 10);
  for (const relative of ['source/booklet.docx', 'source/teacher.docx', 'evidence/word/document.md', 'evidence/word/media/image.png', 'evidence/teacher/document.md', 'evidence/teacher/media/image.png']) assert.ok(manifest.pins.runFiles[relative], relative);
  assertPinnedInputs(runDir);
  fs.writeFileSync(path.join(runDir, 'source/booklet.pdf'), 'changed source');
  assert.throws(() => assertPinnedInputs(runDir), /source\/booklet.pdf/);
});

test('optional teacher Word evidence can be prepared without a teacher PDF', t => {
  const f = fixture(t); const { manifest } = f.prepare({ teacherDocx: f.files.teacherDocx });
  assert.deepEqual(manifest.teacherPages, []);
  assert.ok(manifest.pins.runFiles['source/teacher.docx']);
});

test('invalid scopes and missing optional files fail before partial preparation', t => {
  const f = fixture(t);
  for (const options of [{ pages: '11' }, { contextPages: '11' }, { pages: [1.5] }, { teacherPdf: f.files.teacherPdf, teacherPages: '11' }, { teacherPages: '1' }, { teacherDocx: path.join(f.root, 'missing') }, { docx: path.join(f.root, 'missing') }, { continuations: [[9, 1]] }]) {
    assert.throws(() => f.prepare(options));
    assert.equal(fs.existsSync(path.join(f.root, 'runs')), false);
  }
  assert.equal(f.calls.some(call => ['pdftoppm', 'pandoc'].includes(call.name)), false);
});

test('missing pinned text is rejected as stale source evidence', t => {
  const f = fixture(t); const { runDir } = f.prepare({ teacherPdf: f.files.teacherPdf, teacherPages: '1-8' });
  fs.unlinkSync(path.join(runDir, 'evidence/teacher/pages/page-008.txt'));
  assert.throws(() => assertPinnedInputs(runDir), /page-008.txt/);
});

test('mixed authored/context pages are rendered only once', t => {
  const f = fixture(t); const { manifest } = f.prepare({ contextPages: '8-9' });
  assert.deepEqual(manifest.selectedPages, [9, 10]);
  assert.deepEqual(manifest.contextPages, [8, 9]);
  assert.deepEqual(f.calls.filter(call => call.name === 'pdftoppm').map(call => call.args[1]), ['8', '9', '10']);
});
