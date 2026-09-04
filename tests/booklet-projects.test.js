import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  addProjectBlock, addProjectSection, collectProjectQuestions, createEditableProject,
  createProjectBlock, duplicateProjectSection, materializeAcceptedImport, materializeLegacyProject,
  resizeFirstProjectTable, resizeQuestionParts, snapshotBankQuestion, updateProjectContent,
  updateProjectSettings, validateEditableProject,
} from '../src/lib/editable-booklet-model.js';
import {
  createBookletProject, deleteBookletProject, duplicateBookletProject,
  listBookletProjects, loadBookletProject, materializeRunAsProject,
  promoteProjectModule, promoteProjectQuestion, saveBookletProject,
} from '../scripts/booklet/project-studio-server.mjs';
import { normaliseQuestion } from '../src/lib/practice-question-model.js';
import { loadBookletProject as loadProjectClient } from '../src/lib/booklet-project-storage.js';

const write = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2)); };
const tempRoots = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'booklet-projects-'));
  return { root, projectRoot: path.join(root, 'projects'), bankRoot: path.join(root, 'bank'), moduleRoot: path.join(root, 'modules'), assetRoot: path.join(root, 'assets'), workRoot: path.join(root, 'runs') };
};

function canonicalQuestion(id = 'bank-q1', prompt = 'Calculate $2+3$.') {
  return normaliseQuestion({
    id,
    status: 'approved',
    title: 'Integer addition',
    classification: { primarySkillId: 'integer-addition', secondarySkillIds: [], reasoningScore: 20, difficultyReason: 'One direct calculation.' },
    content: { id: `${id}-root`, type: 'question', label: null, prompt, layout: 'list', columns: null, questionDiagrams: [], children: [], answer: { short: '$5$', worked: '$2+3=5$', solutionDiagrams: [] }, answerSpaceMm: 12 },
    review: { flags: [], history: [] },
  });
}

test('accepted import materialises independent v4 page snapshots and applies layout review', () => {
  const raw = {
    format: 'mathsmap-full-booklet-import-v1', runId: 'integers-v2', title: 'Integers',
    pages: [{ id: 'page-1', pageNumber: 1, section: { id: 's', title: 'Integers', role: 'teaching' }, blocks: [
      { id: 'theory', type: 'callout', title: 'Theory', content: 'Original' },
      canonicalQuestion('local-q'),
    ] }], assets: [],
  };
  raw.pages[0].blocks[1].type = 'question';
  const project = materializeAcceptedImport(raw, { runId: 'integers-v2', layoutOverrides: { answerSpaces: { 'local-q-root': 31 }, diagramColourModes: {} }, diagrams: {} });
  assert.equal(project.format, 'mathsmap-booklet-project-v4');
  assert.equal(project.sections[0].sourcePageNumber, 1);
  assert.equal(project.sections[0].blocks[1].content.answerSpaceMm, 31);
  assert.equal(project.sections[0].blocks[1].bankRef, null);
  const edited = updateProjectContent(project, 'theory', '/content', 'Changed');
  assert.equal(edited.sections[0].blocks[0].content, 'Changed');
  assert.equal(raw.pages[0].blocks[0].content, 'Original');
});

test('bank questions become pinned project snapshots and local edits do not mutate the bank', () => {
  const bank = canonicalQuestion();
  let project = createEditableProject({ title: 'Integers' });
  project = addProjectBlock(project, project.sections[0].id, snapshotBankQuestion(bank));
  const block = project.sections[0].blocks[0];
  const edited = updateProjectContent(project, block.content.id, '/prompt', 'Calculate $8+9$.');
  assert.equal(edited.sections[0].blocks[0].content.prompt, 'Calculate $8+9$.');
  assert.equal(bank.content.prompt, 'Calculate $2+3$.');
  assert.equal(edited.sections[0].blocks[0].bankRef.id, bank.id);
});

test('project operations add sections, questions, tables and export settings', () => {
  let project = createEditableProject({ title: 'Operations' });
  project = addProjectSection(project, { title: 'Practice' });
  project = addProjectBlock(project, project.sections[1].id, createProjectBlock('question'));
  project = resizeQuestionParts(project, project.sections[1].blocks[0].id, 1);
  project = addProjectBlock(project, project.sections[1].id, createProjectBlock('grid'));
  project = addProjectBlock(project, project.sections[1].id, createProjectBlock('spacer'));
  const table = project.sections[1].blocks[1];
  project = resizeFirstProjectTable(project, table.id, { rows: 1, columns: 1 });
  project = updateProjectSettings(project, { practiceAnswers: 'worked', showResponseSpaces: false });
  project = duplicateProjectSection(project, project.sections[1].id);
  assert.equal(project.sections.length, 3);
  assert.equal(collectProjectQuestions(project).length, 2);
  assert.equal(project.sections[1].blocks[0].content.children.length, 2);
  assert.equal(project.sections[1].blocks[2].heightMm, 10);
  assert.match(project.sections[1].blocks[1].content, /Column 1.*Column 2.*\|\s*\|/s);
  assert.equal(project.settings.practiceAnswers, 'worked');
  assert.equal(project.settings.showResponseSpaces, false);
  assert.equal(validateEditableProject(project).valid, true);
});

test('v3 refs materialise through supplied bank and module snapshots without changing the source', () => {
  const question = canonicalQuestion('shared-q');
  const module = { id: 'shared-module', sequence: [{ type: 'content-block', block: { id: 'module-theory', type: 'callout', title: 'Rule', content: 'Keep the sign.' } }, { type: 'question-ref', questionId: question.id }] };
  const legacy = { format: 'mathsmap-booklet-project-v3', version: 3, id: 'old-project', title: 'Old', sections: [{ id: 'old-section', title: 'Old section', role: 'teaching', blocks: [{ type: 'module-ref', id: 'm', moduleId: module.id }, { type: 'question-set', id: 'qs', questionIds: [question.id] }] }] };
  const migrated = materializeLegacyProject(legacy, { bank: [question], modules: [module] });
  assert.equal(migrated.version, 4);
  assert.equal(migrated.sections[0].blocks.filter((block) => block.type === 'question').length, 2);
  assert.equal(migrated.sections[0].blocks[0].content, 'Keep the sign.');
  assert.equal(legacy.version, 3);
});

test('file-backed project CRUD is revision checked and duplication is independent', async () => {
  const roots = tempRoots();
  const created = await createBookletProject({ title: 'Integers' }, roots);
  assert.equal(created.revision, 1);
  const saved = await saveBookletProject({ ...created, subtitle: 'Stage 4' }, { ...roots, expectedRevision: 1 });
  assert.equal(saved.revision, 2);
  await assert.rejects(() => saveBookletProject(created, { ...roots, expectedRevision: 1 }), /changed in another session/);
  const duplicated = await duplicateBookletProject(created.id, { ...roots, title: 'Integers adaptation' });
  assert.notEqual(duplicated.id, created.id);
  assert.equal((await listBookletProjects(roots)).length, 2);
  await deleteBookletProject(created.id, created.id, roots);
  assert.equal((await loadBookletProject(duplicated.id, roots)).title, 'Integers adaptation');
});

test('a reviewed run materialises without modifying its immutable transcription', async () => {
  const roots = tempRoots();
  const runDir = path.join(roots.workRoot, 'accepted-run');
  const transcription = { format: 'mathsmap-full-booklet-import-v1', runId: 'accepted-run', title: 'Imported', pages: [{ id: 'page-1', pageNumber: 1, section: { id: 's', title: 'Imported', role: 'teaching' }, blocks: [{ id: 'copy', type: 'rich-text', content: 'Evidence copy' }] }], assets: [] };
  write(path.join(runDir, 'manifest.json'), { id: 'accepted-run', selectedPages: [1], source: {}, exactResultFormat: 'mathsmap-exact-transcription-result-v2' });
  write(path.join(runDir, 'merged', 'transcription.json'), transcription);
  write(path.join(runDir, 'review.json'), { runId: 'accepted-run', layoutOverrides: {}, diagrams: {}, contentOverrides: {} });
  const project = await materializeRunAsProject('accepted-run', { ...roots, requireAccepted: false });
  assert.equal(project.source.runId, 'accepted-run');
  const changed = await saveBookletProject({ ...project, title: 'Edited master' }, { ...roots, expectedRevision: project.revision });
  assert.equal(changed.title, 'Edited master');
  assert.equal(JSON.parse(fs.readFileSync(path.join(runDir, 'merged', 'transcription.json'))).title, 'Imported');
});

test('question promotion writes an approved bank record, pins a revision, and reports exact duplicates', async () => {
  const roots = tempRoots();
  let project = createEditableProject({ title: 'Promotion' });
  const local = canonicalQuestion('local-source'); local.status = 'draft'; local.type = 'question'; local.bankRef = null; local.snapshotKind = 'local';
  project = addProjectBlock(project, project.sections[0].id, local);
  project = await createBookletProject(project, roots);
  const created = await promoteProjectQuestion(project.id, { blockId: local.id, mode: 'create' }, roots);
  assert.equal(created.question.status, 'approved');
  assert.ok(created.project.sections[0].blocks[0].bankRef.revision);
  const inspection = await promoteProjectQuestion(project.id, { blockId: local.id, mode: 'inspect' }, roots);
  assert.equal(inspection.candidates[0].exact, true);
  const priorRevision = created.project.sections[0].blocks[0].bankRef.revision;
  const edited = updateProjectContent(created.project, created.project.sections[0].blocks[0].content.id, '/prompt', 'Calculate $10+11$.');
  const saved = await saveBookletProject(edited, { ...roots, expectedRevision: edited.revision });
  const updated = await promoteProjectQuestion(saved.id, { blockId: saved.sections[0].blocks[0].id, mode: 'update' }, roots);
  assert.notEqual(updated.project.sections[0].blocks[0].bankRef.revision, priorRevision);
  assert.ok(fs.readdirSync(path.join(roots.bankRoot, '.revisions', created.question.id)).length);
});

test('explicit section promotion creates a reusable teaching module only after questions have bank refs', async () => {
  const roots = tempRoots();
  write(path.join(roots.bankRoot, 'shared-q.json'), canonicalQuestion('shared-q'));
  let project = createEditableProject({ title: 'Module' });
  project = addProjectBlock(project, project.sections[0].id, { id: 'theory', type: 'callout', title: 'Rule', content: 'Keep the sign.', pedagogyRole: 'theory' });
  project = addProjectBlock(project, project.sections[0].id, snapshotBankQuestion(canonicalQuestion('shared-q')));
  project = await createBookletProject(project, roots);
  const result = await promoteProjectModule(project.id, { sectionId: project.sections[0].id, title: 'Integer rule' }, roots);
  assert.equal(result.module.status, 'approved');
  assert.equal(result.module.sequence[1].type, 'question-ref');
});

test('project API client awaits fetch and reports decoded project data', async () => {
  const value = await loadProjectClient('project-one', async (url) => ({ ok: true, json: async () => ({ id: 'project-one', url }) }));
  assert.equal(value.id, 'project-one');
  assert.equal(value.url, '/__booklet/projects/project-one');
});

test('Booklets workspace exposes materialisation, structural editing, promotion and temporary export controls', () => {
  const studio = fs.readFileSync('src/components/BookletStudio.svelte', 'utf8');
  const imports = fs.readFileSync('src/components/FullBookletImport.svelte', 'utf8');
  const projects = fs.readFileSync('src/components/BookletProjects.svelte', 'utf8');
  assert.match(studio, />Booklets<\/button>/);
  assert.match(imports, /Create editable booklet/);
  assert.match(projects, /Duplicate section/);
  assert.match(projects, /Save section as reusable module/);
  assert.match(projects, /Update bank question/);
  assert.match(projects, /Save as defaults/);
  assert.match(projects, /exportSettings\.practiceAnswers !== 'none'/);
  assert.doesNotMatch(projects, /solutionMode="student"[^\n]*practiceAnswers/);
});
