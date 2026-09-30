import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {cleanReviewPrompt, normaliseReviewProject, normaliseReviews} from '../scripts/booklet/normalise-review-prompts.mjs';
import {teachingLabels} from '../src/lib/booklet-labels.js';
import {arrangementCatalog, resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';

const paragraph = (id, inlines) => ({id, type: 'paragraph', align: 'left', inlines});
const text = value => ({type: 'text', text: value});
const square = {id: 'checkbox-inline', type: 'math', latex: '\\square', display: false};
const doc = blocks => ({format: 'maths-editor-document-v1', version: 1, blocks});
const review = (id, prompt) => ({id, type: 'question', sourceOrder: 19, sourceAtom: {id: 'review-group', kind: 'review'}, content: {id: `${id}-root`, label: '19', prompt, children: [{id: `${id}-a`, label: 'a', prompt: 'Solve', answer: {short: '2', worked: 'x = 2'}}]}});
const layoutPrompt = () => doc([{
 id: 'objective-layout', type: 'layout', arrangement: 'parallel', columns: 2, tracks: [5, 155], gap: 3, padding: 0, margin: 0,
 slots: [{id: 'checkbox-slot', blocks: [paragraph('checkbox-paragraph', [square])]}, {id: 'objective-slot', blocks: [paragraph('objective-text', [text('Identify median from the table')])]}],
}]);

test('leading Unicode checkbox cleanup preserves later mathematical squares and rich-text IDs', () => {
 for (const glyph of ['\u2610', '\u25a1', '\u25a2']) {
  assert.equal(cleanReviewPrompt(`  ${glyph} Find x²; retain $\\square$ and □.`), 'Find x²; retain $\\square$ and □.');
  const value = doc([paragraph('heading', [{id: 'mark', ...text(glyph + ' '), marks: ['bold']}, text('Recall powers'), {type: 'math', latex: 'x^2'}]), paragraph('later', [text('□ = 4')])]);
  const original = structuredClone(value), next = cleanReviewPrompt(value);
  assert.equal(next.blocks[0].inlines[0].text, '');
  assert.equal(next.blocks[0].inlines[0].id, 'mark');
  assert.deepEqual(next.blocks[0].inlines[0].marks, ['bold']);
  assert.deepEqual(next.blocks[0].inlines.slice(1), original.blocks[0].inlines.slice(1));
  assert.deepEqual(next.blocks[1], original.blocks[1]);
  assert.deepEqual(value, original);
  assert.deepEqual(cleanReviewPrompt(next), next);
 }
});

test('leading exact native checkbox becomes empty text without erasing real mathematics', () => {
 const value = doc([paragraph('heading', [text(' '), square, {id: 'instruction', ...text(' Solve equations'), marks: ['bold']}, {type: 'math', latex: 'x^2'}])]);
 const original = structuredClone(value), next = cleanReviewPrompt(value);
 assert.deepEqual(next.blocks[0].inlines[1], {id: 'checkbox-inline', type: 'text', text: ''});
 assert.deepEqual(next.blocks[0].inlines[2], {id: 'instruction', ...text('Solve equations'), marks: ['bold']});
 assert.deepEqual(next.blocks[0].inlines[3], original.blocks[0].inlines[3]);
 assert.deepEqual(value, original);
 assert.deepEqual(cleanReviewPrompt(next), next);
 for (const inlines of [[{type: 'math', latex: '\\square + 1 = 4'}, text('Solve')], [square, {type: 'math', latex: '= 4'}], [square], [text('Area of a square: '), square]]) {
  const mathematical = doc([paragraph('maths', inlines)]);
  assert.deepEqual(cleanReviewPrompt(mathematical), mathematical);
 }
});

test('checkbox-only layout slot and track disappear while substantive layout IDs and references survive', () => {
 const value = layoutPrompt(), original = structuredClone(value), next = cleanReviewPrompt(value), layout = next.blocks[0];
 assert.equal(layout.id, 'objective-layout');
 assert.equal(layout.columns, 1);
 assert.equal(layout.gap, 0);
 assert.deepEqual(layout.tracks, [155]);
 assert.deepEqual(layout.slots, [original.blocks[0].slots[1]]);
 assert.deepEqual(value, original);
 assert.deepEqual(cleanReviewPrompt(next), next);
 for (const glyph of ['\u2610', '\u25a1', '\u25a2']) {
  const textual = layoutPrompt();
  textual.blocks[0].slots[0].blocks[0].inlines = [text(glyph)];
  assert.equal(cleanReviewPrompt(textual).blocks[0].slots.length, 1);
 }
 const realMath = layoutPrompt();
 realMath.blocks[0].slots[0].blocks[0].inlines = [{type: 'math', latex: '\\square = x^2'}];
 assert.deepEqual(cleanReviewPrompt(realMath), realMath);
});

test('pure project repair retains source exceptions unless explicitly scoped and preserves answers and arrangements', () => {
 const one = review('one', layoutPrompt()), two = review('two', doc([paragraph('second-heading', [square, text(' Solve equations')])])), continued = review('continued', 'Recall');
 for (const block of [one, two]) block.presentation = {reviewNumbering: 'source', spacing: 4};
 continued.flow = {continuationOf: 'one'};
 const practice = {...review('practice', '☐ Keep this practice prompt'), sourceAtom: {kind: 'practice'}};
 const arrangements = Object.fromEntries([one, two, continued].map(block => [block.id, {arrangement: arrangementCatalog(block).initial}]));
 const project = {id: 'test', revision: 8, sections: [{id: 'section', blocks: [one, two, continued, practice]}], settings: {layoutOverrides: {blockLayouts: arrangements}}, source: {evidence: 'unchanged'}};
 const original = structuredClone(project), defaultRepair = normaliseReviewProject(project);
 assert.deepEqual(defaultRepair.report.promptChanges, ['one', 'two']);
 assert.deepEqual(defaultRepair.report.numberingChanges, []);
 assert.equal(defaultRepair.project.sections[0].blocks[0].presentation.reviewNumbering, 'source');
 const scoped = normaliseReviewProject(project, {clearSourceNumbering: ['one']});
 assert.deepEqual(scoped.report.numberingChanges, ['one']);
 assert.equal(scoped.project.sections[0].blocks[1].presentation.reviewNumbering, 'source');
 const repaired = normaliseReviewProject(project, {clearSourceNumbering: true}), blocks = repaired.project.sections[0].blocks, labels = teachingLabels(blocks);
 assert.deepEqual(repaired.report.numberingChanges, ['one', 'two']);
 assert.equal(labels['one-root'], '1');
 assert.equal(labels['two-root'], '2');
 assert.equal(labels['continued-root'], '1');
 for (const block of blocks.slice(0, 3)) {
  const before = original.sections[0].blocks.find(value => value.id === block.id);
  assert.deepEqual(block.content.children, before.content.children);
  assert.equal(block.content.id, before.content.id);
  assert.equal(block.content.label, before.content.label);
  assert.equal(block.sourceOrder, before.sourceOrder);
  const resolved = resolveArrangement(block, arrangements[block.id].arrangement, {labels});
  assert.deepEqual(resolved.missing, []);
  assert.equal(resolved.entries.get(block.content.id + '/label').value, labels[block.content.id]);
 }
 assert.deepEqual(repaired.project.settings, original.settings);
 assert.deepEqual(blocks[3], practice);
 assert.deepEqual(project, original);
 assert.deepEqual(normaliseReviewProject(repaired.project, {clearSourceNumbering: true}).report.changed, []);
});

test('all-active dry run includes class copies and keeps archived projects and project bytes unchanged', async () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-normalise-'));
 try {
  const projects = [
   {id: 'master', library: {category: 'master'}, sections: [{blocks: [review('one', '☐ Recall')]}]},
   {id: 'class-copy', library: {category: 'class'}, sections: [{blocks: [review('two', doc([paragraph('prompt', [square, text(' Solve')])]))]}]},
   {id: 'archived', library: {archivedAt: '2026-09-01T00:00:00Z'}, sections: [{blocks: [review('three', '□ Recall')]}]},
  ];
  const originals = new Map();
  for (const project of projects) {
   const file = path.join(root, project.id + '.json'), bytes = JSON.stringify(project);
   fs.writeFileSync(file, bytes);
   originals.set(file, bytes);
  }
  const report = await normaliseReviews(false, {projectRoot: root});
  assert.deepEqual(report.map(value => value.id), ['class-copy', 'master']);
  assert.deepEqual(report.flatMap(value => value.changed), ['two', 'one']);
  assert.ok(report.every(value => value.applied === false));
  for (const [file, bytes] of originals) assert.equal(fs.readFileSync(file, 'utf8'), bytes);
 } finally { fs.rmSync(root, {recursive: true, force: true}); }
});

test('isolated apply uses Studio revision saves and makes repeated normalisation a no-op', async () => {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'review-normalise-save-'));
 const projectRoot = path.join(root, 'projects'), bankRoot = path.join(root, 'bank');
 try {
  const {createBookletProject} = await import('../scripts/booklet/project-studio-server.mjs');
  const source = createEditableProject({id: 'review-test', title: 'Review', sections: [{id: 'section', title: 'Review', blocks: [review('one', '☐ Recall'), review('two', layoutPrompt())]}]});
  source.sections[0].blocks[0].presentation = {reviewNumbering: 'source'};
  const before = await createBookletProject(source, {projectRoot, bankRoot});
  const options = {projectRoot, bankRoot, clearSourceNumberingByProject: {'review-test': true}};
  const report = await normaliseReviews(true, options);
  assert.equal(report[0].applied, true);
  assert.deepEqual(report[0].changed, ['one', 'two']);
  const file = path.join(projectRoot, 'review-test.json'), saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(saved.revision, before.revision + 1);
  assert.equal(saved.sections[0].blocks[0].content.prompt, 'Recall');
  assert.equal(saved.sections[0].blocks[0].presentation.reviewNumbering, undefined);
  assert.deepEqual(saved.sections[0].blocks[0].content.children, before.sections[0].blocks[0].content.children);
  assert.deepEqual(saved.sections[0].blocks[1].content.prompt.blocks[0].slots.map(slot => slot.id), ['objective-slot']);
  const bytes = fs.readFileSync(file, 'utf8'), repeated = await normaliseReviews(true, options);
  assert.deepEqual(repeated[0].changed, []);
  assert.equal(repeated[0].applied, false);
  assert.equal(fs.readFileSync(file, 'utf8'), bytes);
 } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
