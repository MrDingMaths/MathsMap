import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addQuestionsToSection,
  createBookletProject,
  filterQuestionBank,
  insertLibraryContent,
  normalizeBookletProject,
  numberProject,
  projectQuestions,
  resolveProject,
  validateBookletProject,
  wrapMultipartParts,
} from '../src/lib/booklet-model.js';
import {
  clozeNode,
  normalizeRichText,
  parseRichText,
  renderRichTextHtml,
  richTextToPlainText,
  roundTripRichText,
  serializeRichText,
} from '../src/lib/maths-editor.js';
import { importPayloadToProject, reviewImportPayload } from '../src/lib/booklet-import.js';
import { createAutosave, loadBookletProject, saveBookletProject } from '../src/lib/booklet-storage.js';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { publishAcceptedImport } from '../scripts/booklet/import.mjs';

function question(id, prompt = `Question ${id}`) {
  return { id, prompt, solution: `$x=${id.length}$`, difficulty: 'foundation', skillIds: ['skill-a'], courses: ['course-a'], topicIds: ['topic-a'] };
}

test('MathsEditor preserves paragraphs, hard breaks, marks, maths, cloze, and escaped dollars', () => {
  const source = 'Explain **gradient**\nthen _interpret_ $m=\\frac{\\Delta y}{\\Delta x}$ [[positive|32]]\n\nA literal \\$5 follows.';
  const value = parseRichText(source);
  assert.equal(value.paragraphs.length, 2);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'break'), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'text' && node.marks.includes('bold')), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'text' && node.marks.includes('italic')), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'math'), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'cloze'), true);
  assert.equal(serializeRichText(value), source);
  assert.equal(serializeRichText(roundTripRichText(value)), source);
  assert.match(renderRichTextHtml(value), /data-node-type="math"/);
  assert.equal(richTextToPlainText(value, { fillCloze: true }).includes('positive'), true);
});

test('MathsEditor remains compatible with text/maths segment records', () => {
  const value = normalizeRichText({ segments: [{ type: 'text', text: 'Let ', marks: ['bold'] }, { type: 'math', latex: 'x^2' }] });
  assert.equal(serializeRichText(value), '**Let **$x^2$');
  assert.equal(value.paragraphs[0].inlines[1].latex, 'x^2');
});

test('project numbering is section-local with plain question and part labels', () => {
  const project = createBookletProject({
    id: 'numbering',
    title: 'Numbering',
    sections: [
      { id: 'one', title: 'One', blocks: [{ type: 'question', id: 'q-one', prompt: 'one', parts: [{ content: 'a' }, { content: 'b' }] }] },
      { id: 'two', title: 'Two', blocks: [{ type: 'question', id: 'q-two', prompt: 'two', parts: [{ content: 'a' }] }, { type: 'question', id: 'q-three', prompt: 'three', parts: [{ content: 'a' }, { content: 'b' }, { content: 'c' }] }] },
    ],
  });
  const numbered = numberProject(project);
  assert.equal(numbered.sections[0].blocks[0].number, '1');
  assert.deepEqual(numbered.sections[0].blocks[0].parts.map((part) => part.number), ['a', 'b']);
  assert.deepEqual(numbered.sections[1].blocks.map((block) => block.number), ['1', '2']);
  assert.deepEqual(numbered.sections[1].blocks[1].parts.map((part) => part.number), ['a', 'b', 'c']);
  assert.deepEqual(wrapMultipartParts([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(wrapMultipartParts([1, 2, 3, 4, 5], 3), [[1, 2, 3], [4, 5]]);
  assert.deepEqual(wrapMultipartParts([1, 2, 3, 4, 5], 4), [[1, 2, 3, 4], [5]]);
});

test('library insertion deep-copies content and keeps stable provenance', () => {
  const project = createBookletProject({ id: 'library-project', title: 'Library project', sections: [{ id: 's', title: 'Section', blocks: [] }] });
  const master = { type: 'callout', id: 'master-key-idea', title: 'Key idea', content: 'Original', source: { type: 'import', pageNumber: 3 } };
  const inserted = insertLibraryContent(project, 's', master, { sourcePage: 3 });
  const copy = inserted.sections[0].blocks[0];
  copy.content.paragraphs[0].inlines[0].text = 'Changed copy';
  assert.equal(master.content, 'Original');
  assert.equal(copy.origin.masterId, 'master-key-idea');
  assert.equal(copy.origin.sourcePage, 3);
  assert.notEqual(copy.id, master.id);
});

test('bank additions preserve bank order and avoid cross-section collisions', () => {
  const base = createBookletProject({ id: 'bank-project', title: 'Bank project', sections: [{ id: 'one', blocks: [] }, { id: 'two', blocks: [] }] });
  const bank = [question('q-a'), question('q-b')];
  const first = addQuestionsToSection(base, 'one', bank);
  const second = addQuestionsToSection(first, 'two', [bank[0]]);
  const ids = second.sections.flatMap((section) => section.blocks.map((block) => block.id));
  assert.deepEqual(second.sections[0].blocks.map((block) => block.questionId), ['q-a', 'q-b']);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(projectQuestions(second).map((block) => block.origin.questionId), ['q-a', 'q-b', 'q-a']);
});

test('difficulty is a bank filter only and soft page targets are rejected', () => {
  const bank = [question('foundation'), { ...question('mastery'), difficulty: 'mastery', prompt: normalizeRichText('Mastery prompt') }];
  assert.equal(filterQuestionBank(bank, { difficulty: 'foundation' }).length, 1);
  assert.equal(filterQuestionBank(bank, { text: 'mastery prompt' }).length, 1);
  assert.match(validateBookletProject({ id: 'bad', title: 'Bad', pageTarget: 12, sections: [{ id: 's', blocks: [] }] })[0], /Soft page targets/);
});

test('page import sorts numerically, preserves blocks/assets, and requires explicit acceptance', () => {
  const raw = {
    format: 'mathsmap-booklet-import-v2',
    source: { pdf: 'source.pdf', word: 'source.docx' },
    assets: [{ id: 'asset-1', originalName: 'diagram.png', sourcePath: 'scratch/diagram.png' }],
    pages: [
      { pageNumber: 10, sourceImage: 'page-10.png', blocks: [{ type: 'rich-text', id: 'p10', content: 'ten' }], accepted: true },
      { pageNumber: 2, sourceImage: 'page-2.png', blocks: [{ type: 'rich-text', id: 'p2', content: 'two' }], accepted: false, reviewFlags: ['notation-check'] },
    ],
  };
  const checked = reviewImportPayload(raw, { requireSourceRender: true });
  assert.deepEqual(checked.payload.pages.map((page) => page.pageNumber), [2, 10]);
  assert.equal(checked.payload.assets[0].originalName, 'diagram.png');
  assert.equal(checked.allPagesAccepted, false);
  assert.equal(checked.canPublish, false);
  const accepted = reviewImportPayload({ ...raw, pages: raw.pages.map((page) => ({ ...page, accepted: true })) }, { requireSourceRender: true });
  assert.equal(accepted.canPublish, true);
  const project = importPayloadToProject(accepted.payload);
  assert.equal(project.status, 'accepted');
  assert.equal(project.sections[0].blocks[1].type, 'page-break');
  assert.equal(resolveProject(project).solutions.length, 0);
});

test('unreconstructed import pages cannot publish even when a reviewer accepts the page', () => {
  const checked = reviewImportPayload({ format: 'mathsmap-booklet-import-v2', source: { pdf: 'source.pdf' }, pages: [{ pageNumber: 1, sourceImage: 'page-1.png', blocks: [], accepted: true }] });
  assert.ok(checked.flags.some((flag) => flag.flag === 'no-reconstructed-blocks'));
  assert.equal(checked.canPublish, false);
});

test('legacy autosave reloads a project', async () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const project = createBookletProject({ id: 'autosave-project', title: 'Autosave', sections: [{ id: 's', blocks: [{ type: 'rich-text', id: 'copy-me', content: 'before' }] }] });
  saveBookletProject(project, storage);
  assert.equal(loadBookletProject(project.id, storage).title, 'Autosave');
  let saved = null;
  const autosave = createAutosave((value) => { saved = value; }, { delay: 5 });
  autosave(project);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(saved.id, project.id);
});

test('accepted import publisher writes project, master, and served original assets', () => {
  const root = mkdtempSync(join(tmpdir(), 'mathsmap-booklet-publish-'));
  const sourceAsset = join(root, 'diagram.png');
  writeFileSync(sourceAsset, 'original-bytes');
  const payload = {
    format: 'mathsmap-booklet-import-v2',
    title: 'Published source',
    source: { pdf: 'published-source.pdf' },
    assets: [{ id: 'asset-diagram', sourcePath: sourceAsset, originalName: 'diagram.png' }],
    pages: [{ pageNumber: 1, sourceImage: 'page-1.png', accepted: true, blocks: [{ type: 'rich-text', id: 'intro', content: 'Faithful source' }] }],
  };
  const result = publishAcceptedImport(payload, { projectDir: join(root, 'projects'), libraryDir: join(root, 'library'), assetDir: join(root, 'public') });
  assert.equal(existsSync(result.projectPath), true);
  assert.equal(existsSync(result.libraryPath), true);
  assert.equal(readFileSync(join(result.assetDir, 'diagram.png'), 'utf8'), 'original-bytes');
  assert.equal(JSON.parse(readFileSync(result.projectPath, 'utf8')).status, 'accepted');
});
