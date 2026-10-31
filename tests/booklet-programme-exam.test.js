import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {approvedMathsBaseSource, mathsBaseSource} from '../src/lib/question-source.js';
import {createProgrammeExamSection, requireProgrammeExamSection, validateProgrammeExamSection} from '../pedagogy/programme-exam.mjs';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {flowEditionSections} from '../src/lib/booklet-flow.js';
import {sectionShowsWorkingSpace} from '../src/lib/booklet-section-options.js';
import {buildProgrammeExamSection, selectExamCandidates} from '../scripts/booklet/export-mathsbase-exams.mjs';

const question = (code = 'HSC.ADV.2011 Q2') => ({
  id: 'q', type: 'question', source: mathsBaseSource(code),
  content: {id: 'root', type: 'question', prompt: 'Keep $[1,3]$ and $x^2$.', answerSpaceMm: 55,
    children: [{id: 'cell', type: 'part', prompt: 'Complete $\\boxed{x}$.', answerSpaceMm: 20}],
    answer: {short: '2', worked: '$x=2$'}},
  sourceReview: {origin: {provider: 'MathsBase', externalId: 'raw-id', sourceCode: code,
    sourceQuestionSha256: 'raw-question-hash', sourceSolutionSha256: 'raw-answer-hash', readSnapshot: 'raw.json'}},
});
const options = block => ({id: 'exam', topicId: 'exam', title: 'Exam questions', blocks: [block]});

test('programme builder fixes the omitted section option without rewriting mathematical or raw source evidence', () => {
  const block = question(), input = options(block), original = structuredClone(input);
  const section = requireProgrammeExamSection(input);
  assert.deepEqual(input, original);
  assert.equal(section.workingSpace, 'none');
  assert.equal(section.role, 'exam');
  assert.deepEqual(section.blocks[0], block);
  assert.equal(validateProgrammeExamSection(section).valid, true);
});

test('an existing valid owner cannot hide new question records missing their project wrapper', () => {
  const unwrapped = {...question(), id: 'new-source'}; delete unwrapped.type;
  const input = {...options(question()), blocks: [question(), unwrapped]};
  assert.throws(() => requireProgrammeExamSection(input), /new-source: project block type is required/);
  unwrapped.type = 'question';
  assert.equal(requireProgrammeExamSection(input).blocks.length, 2);
});

test('saved typed course corrections retain their literal identity without rewriting booklet origins', () => {
  const block = question('HSC.X1.2016 Q14a');
  block.title = '2016 HSC Advanced Band 4';
  block.sourceReview.origin = {provider:'booklet',sourcePage:43};
  block.sourceReview.courseAttributionCorrection = {kind:'whole-source-ask-course-attribution-only-v1',sourceId:'source-id',sourceCode:'HSC.X1.2016 Q14a',proofFile:'match-proof.json',mathematicsAndRatingUnchanged:true,nativeTaskHash:'a'.repeat(64),sourceQuestionSha256:'b'.repeat(64),sourceSolutionSha256:'c'.repeat(64)};
  assert.deepEqual(requireProgrammeExamSection(options(block)).blocks[0],block);
  delete block.sourceReview.courseAttributionCorrection.proofFile;
  assert.throws(()=>requireProgrammeExamSection(options(block)),/held/);
});

test('literal formatter is mandatory even when a hand-written label looks plausible', () => {
  for (const source of [undefined, {provider: 'HSC', label: '2011 HSC Advanced'}, {...mathsBaseSource('HSC.ADV.2011'), label: 'HSC Advanced 2012'}, {...mathsBaseSource('HSC.ADV.2011'), label: ' HSC Advanced 2011 '}]) {
    const section = {...options({...question(), source}), role: 'exam', phase: 'practice', workingSpace: 'none'};
    assert.equal(validateProgrammeExamSection(section).valid, false);
  }
  const absent = question(); delete absent.source;
  assert.deepEqual(requireProgrammeExamSection(options(absent)).blocks[0].source, mathsBaseSource('HSC.ADV.2011'));
});

test('correct printed labels preserve existing partial source objects and compatible historical course metadata', () => {
  const code = 'PLC.Y12.ADV.2024.T2 Q1', label = 'PLC Y12 ADV T2 2024';
  for (const source of [{label}, {label, paper: 'Advanced'}, {label, provider: 'PLC', year: 2024, paper: 'Advanced', origin: 'booklet'}]) {
    const block = {...question(code), source}, before = structuredClone(block);
    const section = requireProgrammeExamSection(options(block));
    assert.deepEqual(section.blocks[0], before);
    assert.deepEqual(block, before);
    assert.equal(validateProgrammeExamSection(section).valid, true);
  }
});

test('partial-source compatibility still rejects false declared provider, year and nonliteral labels', () => {
  const code = 'PLC.Y12.ADV.2024.T2 Q1', label = 'PLC Y12 ADV T2 2024';
  for (const source of [{label, provider: 'HSC'}, {label, year: 2023}, {label: 'PLC Y12 ADV T2 2023'}, {label: ' PLC Y12 ADV T2 2024 '}]) {
    const block = {...question(code), source};
    assert.equal(createProgrammeExamSection(options(block)).section, null);
  }
  const sample = {id: 'sample', type: 'question', title: 'HSC Sample Advanced Question', content: {prompt: 'Keep.'}, source: {label: 'HSC Sample Advanced Question', year: 2024}};
  assert.equal(createProgrammeExamSection(options(sample)).section, null);
});

test('accepted trial calibration retains explicit levels, courses and terms without guessing unknown schools', () => {
  assert.deepEqual(approvedMathsBaseSource('HSC.BHHS.Y11.X1.2022.T2 Q13b'), {
    provider: 'HSC-trial', paper: 'BHHS Y11 X1 T2', year: '2022', label: 'BHHS Y11 X1 T2 2022', origin: 'MathsBase',
  });
  assert.equal(approvedMathsBaseSource('HSC.PLC.Y11.ADV.2023.S2 Q2').label, 'PLC Y11 ADV S2 2023');
  for (const code of ['HSC.UNKNOWN.Y11.X1.2022', 'HSC.BHHS.2022', 'HSC.BHHS.Y11.UNKNOWN.2022', 'PLC.Y10.UNKNOWN.2022', 'CAIE.2022', 'MB.2022']) {
    const input = options(question(code)), before = structuredClone(input), result = createProgrammeExamSection(input);
    assert.equal(result.section, null, code);
    assert.equal(result.report.status, 'held');
    assert(result.report.held.some(row => /excluded|unknown|mapping/.test(row.reason)));
    assert.deepEqual(input, before);
    assert.throws(() => requireProgrammeExamSection(input), error => Array.isArray(error.held) && error.held.length > 0);
  }
  const block = question('HSC.BHHS.Y11.X1.2022.T2 Q13b'); delete block.source;
  assert.equal(requireProgrammeExamSection(options(block)).blocks[0].source.label, 'BHHS Y11 X1 T2 2022');
});

test('official and PLC literals use the same accepted formatter, including course and term tokens', () => {
  for (const [code, label] of [['HSC.STN1.2024 Q2', 'HSC Standard 1 2024'], ['PLC.Y9.COM.2023.T1 S1Q5a', 'PLC Y9 COM T1 2023'], ['PLC.Y10.ADD.2025.S2 Q1', 'PLC Y10 ADD S2 2025']]) {
    assert.equal(requireProgrammeExamSection(options(question(code))).blocks[0].source.label, label);
  }
});

test('raw-code identity cannot be bypassed using a recognised booklet title', () => {
  const block = question('HSC.UNKNOWN.Y11.2022');
  block.title = '2022 HSC Advanced'; block.source = mathsBaseSource('HSC.ADV.2022');
  assert.equal(createProgrammeExamSection(options(block)).section, null);
});

test('existing approved undated samples reuse the booklet parser and never invent a year', () => {
  const block = {id: 'sample', type: 'question', title: 'HSC Sample Advanced Question Band 4', content: {prompt: 'Keep source task.'}};
  const section = requireProgrammeExamSection(options(block));
  assert.equal(section.blocks[0].source.label, 'HSC Sample Advanced Question');
  assert.equal(Object.hasOwn(section.blocks[0].source, 'year'), false);
  assert.equal(createProgrammeExamSection(options({...block, title: 'HSC Question'})).section, null);
  assert.equal(createProgrammeExamSection(options({...block, source: {provider: 'HSC', label: 'Arbitrary sample'}})).section, null);
});

test('direct section construction cannot omit or override the no-working-space acceptance requirement', () => {
  for (const workingSpace of [undefined, null, 'all', 'default']) {
    const section = {...options(question()), role: 'exam', phase: 'practice', ...(workingSpace === undefined ? {} : {workingSpace})};
    assert.equal(validateProgrammeExamSection(section).valid, false);
  }
  assert.equal(createProgrammeExamSection({...options(question()), workingSpace: 'all'}).section, null);
});

test('programme acceptance remains separate from schema/load compatibility and preserves cells in every edition', () => {
  const block = question(), section = requireProgrammeExamSection(options(block));
  const legacy = normalizeEditableProject({id: 'old', sections: [{...options(block), role: 'exam', phase: 'practice'}]});
  assert.equal(Object.hasOwn(legacy.sections[0], 'workingSpace'), false);
  assert.equal(sectionShowsWorkingSpace(legacy.sections[0]), true);
  assert.equal(validateProgrammeExamSection(legacy.sections[0]).valid, false);
  const project = normalizeEditableProject({id: 'new', sections: [section]});
  for (const edition of ['student', 'short', 'worked', 'with-short', 'with-worked']) {
    for (const projected of flowEditionSections(project, edition)) {
      assert.equal(projected.workingSpace, 'none');
      assert.equal(sectionShowsWorkingSpace(projected), false);
      assert.deepEqual(projected.blocks[0].content, block.content);
      assert.deepEqual(projected.blocks[0].sourceReview.origin, block.sourceReview.origin);
    }
  }
});

test('real programme export producer joins raw selection to native identity and enforces both presentation requirements', () => {
  const block = question(), before = structuredClone(block);
  const rows = [{id: 'raw-id', source: block.sourceReview.origin.sourceCode, difficulty: 'Development', question_text: 'Raw $[1,3]$.', solution_text: 'Raw answer.'}];
  const mapping = {projectId: 'p', skillIds: ['s'], questions: {'raw-id': {skillId: 's', archetype: 'a', routine: true, inScope: true}}};
  const result = buildProgrammeExamSection(rows, mapping, {blocks: [block]});
  assert.equal(result.report.status, 'candidate-only');
  assert.equal(result.section.workingSpace, 'none');
  assert.deepEqual(result.section.blocks[0], before);
  assert.deepEqual(block, before);
  assert.equal(buildProgrammeExamSection(rows, mapping, {blocks: [block], section: {workingSpace: 'all'}}).section, null);
  assert.equal(buildProgrammeExamSection(rows, mapping, {blocks: [{...block, source: {...block.source, label: '2011 HSC Advanced'}}]}).section, null);
  const wrongIdentity = structuredClone(block); wrongIdentity.sourceReview.origin.externalId = 'different-id';
  assert.equal(buildProgrammeExamSection(rows, mapping, {blocks: [wrongIdentity]}).section, null);
  assert.equal(buildProgrammeExamSection(rows, mapping, {blocks: []}).section, null);
  assert.equal(buildProgrammeExamSection(rows, {...mapping, projectId: undefined}, {blocks: [block]}).section, null);
});

test('real raw export uses the calibrated trial formatter and holds guessed school mappings', () => {
  const mapping = {skillIds: ['s'], schools: {UNKNOWN: {name: 'Guessed School', yearLevel: 'Y12'}}, questions: {'raw-id': {skillId: 's', archetype: 'a', routine: true, inScope: true}}};
  const row = {id: 'raw-id', source: 'HSC.BHHS.Y11.X1.2022.T2 Q13b', difficulty: 'Development'};
  assert.equal(selectExamCandidates([row], mapping).selected[0].source.label, 'BHHS Y11 X1 T2 2022');
  const unknown = selectExamCandidates([{...row, source: 'HSC.UNKNOWN.Y11.X1.2022'}], mapping);
  assert.equal(unknown.selected.length, 0);
  assert.equal(unknown.held.length, 1);
});

test('programme CLI writes a guarded local candidate or an explicit held result without network access', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-programme-exam-'));
  try {
    const block = question(), rows = [{id: 'raw-id', source: block.sourceReview.origin.sourceCode, difficulty: 'Development', question_text: 'Original $[1,3]$.', solution_text: 'Original answer.'}];
    const mapping = {projectId: 'p', skillIds: ['s'], questions: {'raw-id': {skillId: 's', archetype: 'a', routine: true, inScope: true}}};
    for (const [name, value] of [['rows.json', rows], ['mapping.json', mapping], ['blocks.json', [block]]]) await fs.writeFile(path.join(dir, name), JSON.stringify(value));
    const run = () => spawnSync(process.execPath, ['scripts/booklet/export-mathsbase-exams.mjs', '--input', path.join(dir, 'rows.json'), '--mapping', path.join(dir, 'mapping.json'), '--native-blocks', path.join(dir, 'blocks.json'), '--out', path.join(dir, 'output')], {encoding: 'utf8', windowsHide: true});
    const accepted = run(); assert.equal(accepted.status, 0, accepted.stderr);
    assert.equal(JSON.parse(accepted.stdout).sectionCreated, true);
    const output = path.join(dir, 'output', 'programme-exam-candidate.json');
    const candidate = JSON.parse(await fs.readFile(output, 'utf8'));
    assert.equal(candidate.section.workingSpace, 'none');
    assert.deepEqual(candidate.section.blocks[0], block);
    mapping.programmeExamSection = {workingSpace: 'all'};
    await fs.writeFile(path.join(dir, 'mapping.json'), JSON.stringify(mapping));
    const denied = run(); assert.equal(denied.status, 0, denied.stderr);
    assert.equal(JSON.parse(denied.stdout).status, 'held');
    assert.equal(JSON.parse(denied.stdout).sectionCreated, false);
    const held = JSON.parse(await fs.readFile(output, 'utf8'));
    assert.equal(held.section, null);
    assert(held.report.held.some(row => /workingSpace/.test(row.reason)));
  } finally {
    await fs.rm(dir, {recursive: true, force: true});
  }
});
