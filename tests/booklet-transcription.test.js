import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BOOKLET_AGY_MODEL, DEFAULT_CONCURRENCY, applyContentOverrides, assertPinnedInputs, contentHash,
  extractWordAssetOccurrences, hashFile, hashValue, mergeLane, parsePageSelection,
  saveContentOverride, shardPages, shardQuestions, transcriptionHazards,
} from '../scripts/booklet/transcription.mjs';
import { materializeLegacyProject } from '../src/lib/editable-booklet-model.js';
import { normalizeBookletProject } from '../src/lib/booklet-model.js';
import { groupBookletBlocks, investigationDescription, splitBookletTables } from '../src/lib/booklet-preview.js';
import { validateCaptureBase } from '../scripts/booklet/capture-fidelity.mjs';

const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2)); };
const question = (id, prompt) => ({
  id, type: 'question', title: '', pedagogyRole: 'practice', sourceOrder: 1,
  content: { id: `${id}-root`, type: 'question', label: null, prompt, layout: 'list', columns: null, questionDiagrams: [], children: [{ id: `${id}-a`, type: 'part', label: null, prompt: '', layout: 'list', columns: null, questionDiagrams: [], children: [], answer: { short: '1', worked: '1', solutionDiagrams: [] }, answerSpaceMm: 12 }] },
});

function fakeRun() {
  const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'booklet-transcription-'));
  const runDir = path.join(workRoot, 'pilot');
  fs.mkdirSync(path.join(runDir, 'lanes', 'exact'), { recursive: true });
  writeJson(path.join(runDir, 'manifest.json'), {
    id: 'pilot', model: BOOKLET_AGY_MODEL, selectedPages: [1, 2], continuations: [], status: 'prepared', lanes: {},
    pins: { model: hashValue(BOOKLET_AGY_MODEL), files: {}, runFiles: {} },
  });
  writeJson(path.join(runDir, 'review.json'), { pages: [{ pageNumber: 1, accepted: false }, { pageNumber: 2, accepted: false }], modules: {}, questions: {}, mappings: {}, diagrams: {}, flags: [], history: [], contentOverrides: {}, layoutOverrides: {} });
  return { workRoot, runDir };
}

test('historical Gemini identity remains readable while new transcription runs serially', () => {
  assert.equal(BOOKLET_AGY_MODEL, 'gemini-3.8-flash-high');
  assert.equal(DEFAULT_CONCURRENCY, 1);
});

test('page selection and structural sharding are deterministic and continuation-safe', () => {
  const pages = parsePageSelection('3,1-2,29-33');
  assert.deepEqual(pages, [1, 2, 3, 29, 30, 31, 32, 33]);
  assert.deepEqual(shardPages(pages, { continuations: [[2, 3], [30, 31]] }), [[1, 2, 3], [29, 30, 31], [32, 33]]);
  assert.throws(() => shardPages([1, 2, 3, 4], { continuations: [[1, 2], [2, 3], [3, 4]] }), /exceeds/);
  assert.deepEqual(shardQuestions([1, 2, 3, 4, 5, 6]), [[1, 2, 3, 4, 5], [6]]);
});

test('resume guard refuses changed immutable evidence', () => {
  const { runDir } = fakeRun();
  const evidence = path.join(runDir, 'evidence.txt');
  fs.writeFileSync(evidence, 'before');
  const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json')));
  manifest.pins.runFiles['evidence.txt'] = hashFile(evidence);
  writeJson(path.join(runDir, 'manifest.json'), manifest);
  assert.doesNotThrow(() => assertPinnedInputs(runDir));
  fs.writeFileSync(evidence, 'after');
  assert.throws(() => assertPinnedInputs(runDir), /Pinned input changed/);
});

test('exact merge rejects missing pages and duplicate ids', () => {
  const missing = fakeRun();
  writeJson(path.join(missing.runDir, 'lanes', 'exact', 'task-001.result.json'), { pages: [{ id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'front-matter' }, blocks: [] }] });
  assert.throws(() => mergeLane(missing.runDir, { lane: 'exact' }), /Page coverage mismatch/);

  const duplicate = fakeRun();
  writeJson(path.join(duplicate.runDir, 'lanes', 'exact', 'task-001.result.json'), { pages: [
    { id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'teaching' }, blocks: [{ id: 'same', type: 'rich-text', content: 'A' }] },
    { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'teaching' }, blocks: [{ id: 'same', type: 'rich-text', content: 'B' }] },
  ] });
  assert.throws(() => mergeLane(duplicate.runDir, { lane: 'exact' }), /Duplicate ids/);
});


test('v2 projects normalize to reversible v3 local placements and still resolve', () => {
  const legacy = { format: 'mathsmap-booklet-project-v2', version: 2, id: 'old', title: 'Old', sections: [{ id: 's', title: 'S', blocks: [{ id: 'text', type: 'rich-text', content: 'Hello' }] }] };
  const migrated = normalizeBookletProject(legacy);
  assert.equal(migrated.format, 'mathsmap-booklet-project-v3');
  assert.equal(migrated.migratedFrom.format, legacy.format);
  assert.equal(migrated.sections[0].blocks[0].type, 'local-block');
  assert.equal(materializeLegacyProject(migrated).sections[0].blocks[0].type, 'rich-text');
});

test('Word asset extraction keeps occurrence order even when a path repeats', () => {
  const markdown = 'Before ![one](media/image1.png) middle ![again](media/image1.png) after';
  const occurrences = extractWordAssetOccurrences(markdown);
  assert.deepEqual(occurrences.map((item) => item.occurrenceId), ['word-asset-0001', 'word-asset-0002']);
  assert.deepEqual(occurrences.map((item) => item.path), ['media/image1.png', 'media/image1.png']);
  assert.ok(occurrences[1].markdownOffset > occurrences[0].markdownOffset);
});

test('investigation labels are suppressed while description and one atom are retained', () => {
  assert.equal(investigationDescription('Investigation Adding and subtracting negative numbers'), 'Adding and subtracting negative numbers');
  const sourceAtom = { id: 'atom-1', kind: 'investigation', label: 'Investigation', description: 'Adding and subtracting negative numbers', order: 1 };
  const grouped = groupBookletBlocks([
    { id: 'b1', type: 'worked-example', sourceAtom },
    { id: 'b2', type: 'question', sourceAtom },
  ]);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].atom.label, '');
  assert.equal(grouped[0].atom.description, 'Adding and subtracting negative numbers');
  assert.deepEqual(grouped[0].blocks.map((item) => item.id), ['b1', 'b2']);
});

test('structural Markdown tables are detected and malformed pipe text is rejected', () => {
  const table = '| A | B |\n| --- | --- |\n| 1 | 2 |';
  assert.equal(splitBookletTables(table)[0].type, 'table');
  assert.deepEqual(transcriptionHazards({ pages: [{ section: { role: 'mixed-practice' }, blocks: [{ id: 'bad', content: '| A | B |\n| 1 | 2 |' }] }] }), ['bad.content: malformed Markdown table would render as pipe text']);
});

test('exact v2 keeps an Identify atom intact and rejects evidence-only duplication', () => {
  const ok = fakeRun();
  const manifestFile = path.join(ok.runDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile));
  manifest.exactResultFormat = 'mathsmap-exact-transcription-result-v2';
  writeJson(manifestFile, manifest);
  const atom = { id: 'identify-1', kind: 'identify', label: 'Identify', description: 'Rewrite signs', sourceText: 'Identify Rewrite signs', order: 1 };
  writeJson(path.join(ok.runDir, 'lanes', 'exact', 'task-001.result.json'), {
    format: 'mathsmap-exact-transcription-result-v2',
    pages: [
      { id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'teaching' }, blocks: [{ id: 'example', type: 'worked-example', sourceAtom: atom }, { ...question('identify-q', 'Rewrite'), pedagogyRole: 'identify', sourceAtom: atom }], reviewFlags: [] },
      { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'mixed-practice' }, blocks: [], reviewFlags: [] },
    ],
    assets: [],
  });
  assert.doesNotThrow(() => mergeLane(ok.runDir, { lane: 'exact' }));
  const merged = JSON.parse(fs.readFileSync(path.join(ok.runDir, 'merged', 'transcription.json')));
  assert.equal(groupBookletBlocks(merged.pages[0].blocks).length, 1);

  const bad = fakeRun();
  const badManifest = JSON.parse(fs.readFileSync(path.join(bad.runDir, 'manifest.json')));
  badManifest.exactResultFormat = 'mathsmap-exact-transcription-result-v2';
  writeJson(path.join(bad.runDir, 'manifest.json'), badManifest);
  writeJson(path.join(bad.runDir, 'lanes', 'exact', 'task-001.result.json'), {
    format: 'mathsmap-exact-transcription-result-v2',
    pages: [{ id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'mixed-practice' }, blocks: [{ ...question('q', 'Cards $\\boxed{-4}$'), content: { ...question('q', '').content, questionDiagrams: [{ id: 'd', format: 'image', src: 'evidence/word/media/cards.png', role: 'question' }] } }], reviewFlags: [] }, { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'mixed-practice' }, blocks: [], reviewFlags: [] }],
    assets: [{ occurrenceId: 'cards-1', path: 'evidence/word/media/cards.png', pageNumber: 1, usage: 'evidence-only' }],
  });
  assert.throws(() => mergeLane(bad.runDir, { lane: 'exact' }), /Evidence-only assets are referenced|no occurrence records/);
});

test('content overrides preserve raw transcription, retain original value, preserve historical metadata, and reject stale roots', () => {
  const { runDir } = fakeRun();
  const q1 = question('page-1-q1', 'Before');
  writeJson(path.join(runDir, 'lanes', 'exact', 'task-001.result.json'), { pages: [
    { id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'mixed-practice' }, blocks: [q1] },
    { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'mixed-practice' }, blocks: [] },
  ] });
  mergeLane(runDir, { lane: 'exact' });
  const manifestFile = path.join(runDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile));
  manifest.lanes.enrichment = { status: 'merged' }; manifest.lanes.mapping = { status: 'merged' }; manifest.lanes.fidelity = { status: 'merged' };
  writeJson(manifestFile, manifest);
  saveContentOverride(runDir, { rootId: q1.id, pointer: '/content/prompt', value: 'After', editor: 'tester' });
  const raw = JSON.parse(fs.readFileSync(path.join(runDir, 'merged', 'transcription.json')));
  const review = JSON.parse(fs.readFileSync(path.join(runDir, 'review.json')));
  assert.equal(raw.pages[0].blocks[0].content.prompt, 'Before');
  assert.equal(applyContentOverrides(raw, review).pages[0].blocks[0].content.prompt, 'After');
  assert.equal(review.contentOverrides[q1.id]['/content/prompt'].originalValue, 'Before');
  assert.equal(review.pages[0].accepted, false);
  assert.equal(JSON.parse(fs.readFileSync(manifestFile)).lanes.fidelity.status, 'merged');
  raw.pages[0].blocks[0].content.prompt = 'Changed upstream';
  assert.throws(() => applyContentOverrides(raw, review), /stale/);
});

test('fidelity capture base accepts only local Booklet Studio origins', () => {
  assert.equal(validateCaptureBase('http://localhost:5173/path'), 'http://localhost:5173');
  assert.throws(() => validateCaptureBase('https://example.com'), /local Booklet Studio/);
});
