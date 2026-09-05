import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BOOKLET_AGY_MODEL, DEFAULT_CONCURRENCY, applyContentOverrides, assertPinnedInputs, buildTasks, contentHash,
  extractWordAssetOccurrences, hashFile, hashValue, mergeLane, mergeRepairs, parsePageSelection,
  saveContentOverride, shardPages, shardQuestions, transcriptionHazards,
} from '../scripts/booklet/transcription.mjs';
import { normalizeBookletProject, resolveProject } from '../src/lib/booklet-model.js';
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

test('booklet lanes are pinned to Gemini 3.8 Flash High and image-heavy concurrency three', () => {
  assert.equal(BOOKLET_AGY_MODEL, 'gemini-3.8-flash-high');
  assert.equal(DEFAULT_CONCURRENCY, 3);
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

test('classification merge is content-hash locked', () => {
  const { runDir } = fakeRun();
  const q1 = question('page-1-q1', 'Calculate 2 + 3.');
  const q2 = question('page-2-q1', 'Calculate 7 - 4.');
  writeJson(path.join(runDir, 'lanes', 'exact', 'task-001.result.json'), { pages: [
    { id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'mixed-practice' }, blocks: [q1] },
    { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'mixed-practice' }, blocks: [q2] },
  ] });
  mergeLane(runDir, { lane: 'exact' });
  fs.mkdirSync(path.join(runDir, 'lanes', 'enrichment'), { recursive: true });
  writeJson(path.join(runDir, 'lanes', 'enrichment', 'task-001.result.json'), { questions: [q1, q2].map((q, index) => ({
    id: q.id, contentHash: contentHash(q), classification: { reasoningScore: 20 + index * 20, difficulty: index ? 'Development' : 'Foundation', primarySkillId: 'skill-x', secondarySkillIds: [], difficultyReason: 'Test' },
  })) });
  const before = [contentHash(q1), contentHash(q2)];
  mergeLane(runDir, { lane: 'enrichment' });
  const merged = JSON.parse(fs.readFileSync(path.join(runDir, 'merged', 'transcription.json')));
  assert.deepEqual(merged.pages.flatMap((page) => page.blocks).map(contentHash), before);

  const bad = JSON.parse(fs.readFileSync(path.join(runDir, 'lanes', 'enrichment', 'task-001.result.json')));
  bad.questions[0].contentHash = 'changed';
  writeJson(path.join(runDir, 'lanes', 'enrichment', 'task-001.result.json'), bad);
  assert.throws(() => mergeLane(runDir, { lane: 'enrichment' }), /content hash changed/i);
});

test('targeted repair cannot modify an unaddressed root', () => {
  const { runDir } = fakeRun();
  const q1 = question('page-1-q1', 'Old prompt'); const q2 = question('page-2-q1', 'Untouched prompt');
  writeJson(path.join(runDir, 'lanes', 'exact', 'task-001.result.json'), { pages: [
    { id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'mixed-practice' }, blocks: [q1] },
    { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'mixed-practice' }, blocks: [q2] },
  ] });
  mergeLane(runDir, { lane: 'exact' });
  const review = JSON.parse(fs.readFileSync(path.join(runDir, 'review.json'))); review.flags = [{ rootId: q1.id, code: 'bad-text', severity: 'fatal' }];
  review.pages.forEach((page) => { page.accepted = true; });
  review.questions[q1.id] = { accepted: true };
  writeJson(path.join(runDir, 'review.json'), review);
  fs.mkdirSync(path.join(runDir, 'lanes', 'repair'), { recursive: true });
  const replacement = question(q1.id, 'Corrected prompt');
  writeJson(path.join(runDir, 'lanes', 'repair', 'task-001.result.json'), { repairs: [{ id: q1.id, beforeHash: contentHash(q1), replacement }] });
  const untouchedBefore = contentHash(q2);
  mergeRepairs(runDir);
  const merged = JSON.parse(fs.readFileSync(path.join(runDir, 'merged', 'transcription.json')));
  assert.equal(merged.pages[0].blocks[0].content.prompt, 'Corrected prompt');
  assert.equal(contentHash(merged.pages[1].blocks[0]), untouchedBefore);
  const afterReview = JSON.parse(fs.readFileSync(path.join(runDir, 'review.json')));
  assert.equal(afterReview.pages[0].accepted, false);
  assert.equal(afterReview.pages[1].accepted, true);
  assert.equal(afterReview.questions[q1.id], undefined);
  assert.notEqual(afterReview.flags[0].resolved, true);
});

test('v2 projects normalize to reversible v3 local placements and still resolve', () => {
  const legacy = { format: 'mathsmap-booklet-project-v2', version: 2, id: 'old', title: 'Old', sections: [{ id: 's', title: 'S', blocks: [{ id: 'text', type: 'rich-text', content: 'Hello' }] }] };
  const migrated = normalizeBookletProject(legacy);
  assert.equal(migrated.format, 'mathsmap-booklet-project-v3');
  assert.equal(migrated.migratedFrom.format, legacy.format);
  assert.equal(migrated.sections[0].blocks[0].type, 'local-block');
  assert.equal(resolveProject(migrated).sections[0].blocks[0].type, 'rich-text');
});

test('theory solutions are visible by default and can be hidden without affecting practice answers', () => {
  const project = normalizeBookletProject({ id: 'toggle', title: 'Toggle', sections: [{ id: 's', title: 'S', role: 'teaching', blocks: [{ id: 'm-place', type: 'module-ref', moduleId: 'm' }] }] });
  const modules = new Map([['m', { id: 'm', sequence: [{ type: 'content-block', block: { id: 'example', type: 'worked-example', content: 'Prompt', theorySolution: 'Blue solution', examples: [{ prompt: 'P', theorySolution: 'S' }] } }] }]]);
  const shown = resolveProject(project, new Map(), { modules });
  assert.equal(shown.sections[0].blocks[0].theorySolution, 'Blue solution');
  assert.equal(shown.sections[0].blocks[0].examples[0].theorySolution, 'S');
  const hidden = resolveProject(project, new Map(), { modules, showTheorySolutions: false });
  assert.equal(hidden.sections[0].blocks[0].theorySolution, undefined);
  assert.equal(hidden.sections[0].blocks[0].examples[0].theorySolution, undefined);
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

test('content overrides preserve raw transcription, retain original value, invalidate approvals, and reject stale roots', () => {
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
  assert.equal(JSON.parse(fs.readFileSync(manifestFile)).lanes.fidelity.status, 'stale');
  raw.pages[0].blocks[0].content.prompt = 'Changed upstream';
  assert.throws(() => applyContentOverrides(raw, review), /stale/);
});

test('fidelity capture base accepts only local Booklet Studio origins', () => {
  assert.equal(validateCaptureBase('http://localhost:5173/path'), 'http://localhost:5173');
  assert.throws(() => validateCaptureBase('https://example.com'), /local Booklet Studio/);
});

test('fidelity merge rejects results after reconstructed screenshot evidence changes', () => {
  const { runDir } = fakeRun();
  writeJson(path.join(runDir, 'lanes', 'exact', 'task-001.result.json'), { pages: [
    { id: 'page-1', pageNumber: 1, section: { id: 's1', role: 'front-matter' }, blocks: [] },
    { id: 'page-2', pageNumber: 2, section: { id: 's2', role: 'front-matter' }, blocks: [] },
  ] });
  mergeLane(runDir, { lane: 'exact' });
  for (const pageNumber of [1, 2]) {
    const suffix = String(pageNumber).padStart(3, '0');
    const source = path.join(runDir, 'evidence', 'pages', `page-${suffix}.png`);
    const reconstructed = path.join(runDir, 'evidence', 'reconstructed', `page-${suffix}.png`);
    fs.mkdirSync(path.dirname(source), { recursive: true });
    fs.mkdirSync(path.dirname(reconstructed), { recursive: true });
    fs.writeFileSync(source, `source-${pageNumber}`);
    fs.writeFileSync(reconstructed, `reconstructed-${pageNumber}`);
  }
  buildTasks(runDir, { lane: 'fidelity' });
  const task = fs.readFileSync(path.join(runDir, 'lanes', 'fidelity', 'task-001.md'), 'utf8');
  const inputs = [...task.matchAll(/"pageNumber": (\d+),[\s\S]*?"rootId": "([^"]+)",[\s\S]*?"contentHash": "([^"]+)",[\s\S]*?"evidenceHash": "([^"]+)"/g)]
    .map((match) => ({ pageNumber: Number(match[1]), rootId: match[2], contentHash: match[3], evidenceHash: match[4], status: 'pass', flags: [] }));
  assert.equal(inputs.length, 2);
  writeJson(path.join(runDir, 'lanes', 'fidelity', 'task-001.result.json'), { format: 'mathsmap-fidelity-audit-result-v1', pages: inputs });
  fs.writeFileSync(path.join(runDir, 'evidence', 'reconstructed', 'page-002.png'), 'changed screenshot');
  assert.throws(() => mergeLane(runDir, { lane: 'fidelity' }), /screenshot evidence changed or is stale/);
});
