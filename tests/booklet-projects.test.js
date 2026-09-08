import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  addProjectBlock, addProjectSection, collectProjectQuestions, createEditableProject,
  createProjectBlock, duplicateProjectSection, materializeReconstruction, materializeLegacyProject,
  resizeFirstProjectTable, resizeQuestionParts, snapshotBankQuestion, updateProjectContent,
  updateProjectSettings, validateEditableProject,
} from '../src/lib/editable-booklet-model.js';
import {
  createBookletProject, deleteBookletProject, duplicateBookletProject,
  listBookletProjects, loadBookletProject, materializeRunAsProject,
  promoteProjectModule, promoteProjectQuestion, saveBookletProject,
} from '../scripts/booklet/project-studio-server.mjs';
import { normaliseQuestion } from '../src/lib/practice-question-model.js';
import { importReconstruction } from '../scripts/booklet/import-reconstruction.mjs';
import { studioProject, editFields } from '../src/lib/booklet-review-model.js';
import { loadBookletProject as loadProjectClient } from '../src/lib/booklet-project-storage.js';
import { independentAnswerPages, teachingAnswerCategory, teachingQuestionMode } from '../src/lib/booklet-answer-options.js';

test('teaching answer switches are independent and survive saved defaults', () => {
  let project=createEditableProject({title:'Teaching'});
  project=updateProjectSettings(project,{showReviewAnswers:true,showIdentifyAnswers:false,showGuidedPracticeAnswers:true});
  const review=createProjectBlock('review'),activity=createProjectBlock('activity'),guided=createProjectBlock('guided-practice');
  assert.equal(teachingQuestionMode(review,project.settings,'student'),'worked');
  assert.equal(teachingQuestionMode(activity,project.settings,'worked'),'student');
  assert.equal(teachingQuestionMode(guided,project.settings,'short'),'short');
  activity.sourceAtom.label='Prove';activity.sourceAtom.kind='investigation';
  assert.equal(teachingAnswerCategory(activity),'identify');
  assert.equal(JSON.parse(JSON.stringify(project)).settings.showGuidedPracticeAnswers,true);
});

test('back-of-book answers exclude teaching activities even on mixed-practice pages', () => {
  const independent=createProjectBlock('question'), review=createProjectBlock('review'), activity=createProjectBlock('activity');
  const pages=[{id:'theory',blocks:[createProjectBlock('callout'),review]}, {id:'mixed',blocks:[activity,independent,createProjectBlock('guided-practice')]}];
  const result=independentAnswerPages(pages);
  assert.deepEqual(result.map(p=>p.id),['mixed']);
  assert.deepEqual(result[0].blocks.map(b=>b.id),[independent.id]);
  assert.equal(result[0].blocks[0].sourceOrder,2,'retains original question numbering');
  assert.equal(pages[1].blocks.length,3,'does not mutate stored blocks');
});

test('new theory blocks expose a writable heading without a duplicate Theory subtitle', () => {
  let project=createEditableProject({title:'Headings'});project=addProjectSection(project);
  const block=createProjectBlock('callout');project=addProjectBlock(project,project.sections[0].id,block);
  project=updateProjectContent(project,block.id,'/label','Important result');
  assert.equal(project.sections[0].blocks.find(b=>b.id===block.id).label,'Important result');
  assert.equal(block.title,'');
});

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
  const project = materializeReconstruction(raw, { runId: 'integers-v2', layoutOverrides: { answerSpaces: { 'local-q-root': 31 }, diagramColourModes: {} }, diagrams: {} });
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

test('a run without approvals materialises without modifying its immutable transcription', async () => {
  const roots = tempRoots();
  const runDir = path.join(roots.workRoot, 'accepted-run');
  const transcription = { format: 'mathsmap-full-booklet-import-v1', runId: 'accepted-run', title: 'Imported', pages: [{ id: 'page-1', pageNumber: 1, section: { id: 's', title: 'Imported', role: 'teaching' }, blocks: [{ id: 'copy', type: 'rich-text', content: 'Evidence copy' }] }], assets: [] };
  write(path.join(runDir, 'manifest.json'), { id: 'accepted-run', selectedPages: [1], source: {}, exactResultFormat: 'mathsmap-exact-transcription-result-v2' });
  write(path.join(runDir, 'merged', 'transcription.json'), transcription);
  write(path.join(runDir, 'review.json'), { runId: 'accepted-run', layoutOverrides: {}, diagrams: {}, contentOverrides: {} });
  const project = await materializeRunAsProject('accepted-run', roots);
  assert.equal(project.source.runId, 'accepted-run');
  const changed = await saveBookletProject({ ...project, title: 'Edited master' }, { ...roots, expectedRevision: project.revision });
  assert.equal(changed.title, 'Edited master');
  assert.equal(JSON.parse(fs.readFileSync(path.join(runDir, 'merged', 'transcription.json'))).title, 'Imported');
});

test('chat reconstruction imports source assets and IDs without receipts or merged results', async () => {
  const roots = tempRoots(), runDir = path.join(roots.workRoot, 'chat-source');
  write(path.join(runDir, 'manifest.json'), { id: 'chat-source', selectedPages: [1, 2], source: {} });
  const candidate = { title: 'From chat', pages: [{ id:'source-1', pageNumber:1, section:{title:'Rule'}, blocks:[
    {id:'text',type:'rich-text',content:'Original wording'},
    {id:'graphic',type:'image',src:'evidence/word/graphic.svg',alt:'Source graphic'},
  ] }] };
  const source = path.join(runDir, 'evidence/word/graphic.svg');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, '<svg xmlns="http://www.w3.org/2000/svg"/>');
  const input = path.join(runDir, 'candidate.json'); write(input, candidate);
  const before = fs.readFileSync(input);
  const project = await importReconstruction({ ...roots, runId:'chat-source', input, projectId:'chat-project' });
  assert.equal(project.source.runId, 'chat-source');
  assert.ok(project.source.reconstructionHash);
  assert.equal(project.sections[0].blocks[0].id, 'text');
  const image = project.sections[0].blocks[1];
  assert.match(image.src, /^\/booklet-assets\/projects\/chat-project\//);
  assert.equal(fs.readFileSync(path.join(roots.assetRoot, 'chat-project', path.basename(image.src)), 'utf8'), fs.readFileSync(source, 'utf8'));
  assert.equal(project.studio.approvals, undefined);
  assert.equal(project.studio.proposals, undefined);
  assert.deepEqual(fs.readFileSync(input), before);
  assert.equal(fs.existsSync(path.join(runDir, 'merged/transcription.json')), false);
  await assert.rejects(importReconstruction({ ...roots, runId:'chat-source', input, projectId:'chat-project' }), /already exists/);
  candidate.pages.push(structuredClone(candidate.pages[0])); write(input, candidate);
  await assert.rejects(importReconstruction({ ...roots, runId:'chat-source', input }), /duplicate or unexpected/);
});

test('legacy review metadata stays inert through edits, saves and bank publication', async () => {
  const roots = tempRoots();
  const question = {...canonicalQuestion('legacy-question'),type:'question'};
  let project = studioProject(createEditableProject({id:'legacy-studio',title:'Legacy',sections:[{id:'s',title:'Content',blocks:[question]}]}));
  const historical = { approvals:{'legacy-question':{content:{accepted:false}}}, proposals:[{id:'old',operations:[{status:'pending',after:'Never apply this'}]}],metrics:[{type:'minutes',value:4}] };
  Object.assign(project.studio, structuredClone(historical));
  project.studio.flags.push({targetId:question.id,note:'Check wording',resolved:false});
  question.review.flags=['Historical issue note'];
  project = await createBookletProject(project, roots);
  project = editFields(project,[{targetId:question.content.id,path:'/prompt',after:'Calculate $4+5$.'}]);
  project = await saveBookletProject(project,{...roots,expectedRevision:project.revision});
  const loaded = await loadBookletProject(project.id, roots);
  for (const key of Object.keys(historical)) assert.deepEqual(loaded.studio[key],historical[key]);
  assert.equal(loaded.sections[0].blocks[0].content.prompt,'Calculate $4+5$.');
  const result = await promoteProjectQuestion(project.id,{blockId:question.id,mode:'create'},roots);
  assert.equal(result.question.status,'approved');
  assert.deepEqual(result.project.studio.proposals,historical.proposals);
});

test('bank publication still rejects invalid question content without requiring approval', async () => {
  const roots = tempRoots(),question={...canonicalQuestion('bad-question'),type:'question'};
  question.content.prompt='$x/2$';
  const project=await createBookletProject(createEditableProject({title:'Invalid',sections:[{id:'s',title:'Test',blocks:[question]}]}),roots);
  await assert.rejects(promoteProjectQuestion(project.id,{blockId:question.id,mode:'create'},roots), /fraction/);
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
  assert.match(projects, /Duplicate page/);
  assert.match(projects, /Save as reusable module/);
  assert.match(projects, /Update bank question/);
  assert.match(projects, /Save as defaults/);
  assert.match(projects, /exportSettings\.practiceAnswers !== 'none'/);
  assert.doesNotMatch(projects, /solutionMode="student"[^\n]*practiceAnswers/);
});
import { normalizeBlockLayouts, questionLayoutStyle } from '../src/lib/booklet-layout.js';

test('block layout overrides retain zero insets and use stable target widths', () => {
  const layouts=normalizeBlockLayouts({q:{textWidthMm:65,gapMm:3,diagramSizing:'fit'},example:{insetMm:0},invalid:{textWidthMm:'bad'}});
  assert.equal(layouts.example.insetMm,0);
  assert.equal(layouts.q.textWidthMm,65);
  assert.deepEqual(layouts.invalid,{});
  assert.match(questionLayoutStyle({id:'q',diagramPlacement:'right-of-prompt'},layouts),/minmax\(0,65mm\) minmax\(0,1fr\)/);
  assert.match(questionLayoutStyle({id:'q'},layouts),/--question-diagram-width:100%/);
  assert.equal(questionLayoutStyle({id:'legacy'},layouts),'');
});
