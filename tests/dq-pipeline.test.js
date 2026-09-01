import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PRODUCTION_QUESTION_KEYS,
  assessPromotionEligibility,
  buildSkillIndex,
  canonicalizeText,
  evaluateMappingConsensus,
  findDuplicates,
  lintProductionQuestion,
  prepareExistingEntries,
  processCandidateBundle,
  questionHash,
  retrieveSkillCandidates,
  selectQuestionsForSkill,
  stableQuestionId,
  toProductionQuestion,
  validateCandidate,
} from '../scripts/dq/core.mjs';
import { acceptedQaFilter, exportSubagentJobs, preserveWorkerResults } from '../scripts/dq/export-jobs.mjs';

const fixtureDir = path.resolve('scripts', 'dq', 'test-fixtures');
const readFixture = async (name) => JSON.parse(await fs.readFile(path.join(fixtureDir, name), 'utf8'));
const clone = (value) => structuredClone(value);
const BS = String.fromCharCode(92);

test('fixture candidate validates and strips to the exact production schema', async () => {
  const { candidates: [candidate] } = await readFixture('candidate-bundle.json');
  assert.deepEqual(validateCandidate(candidate, { phase: 'ready' }), { valid: true, errors: [] });

  const question = toProductionQuestion(candidate);
  assert.equal(question.id, 'dq-12345');
  assert.deepEqual(Object.keys(question), PRODUCTION_QUESTION_KEYS);
  assert.deepEqual(Object.keys(question.options[0]), ['text', 'correct']);
  assert.deepEqual(Object.keys(question.options[1]), ['text', 'why']);
  assert.ok(!('meaningfulCase' in question));
  assert.ok(!('source' in question));
});

test('capture state exports deterministic, disjoint visual-worker batches', () => {
  const captured = (sourceId, score) => ({
    sourceId,
    questionUrl: `https://diagnosticquestions.com/Questions/${sourceId}`,
    sourcePaths: [['Maths', 'Number', 'Integers']],
    likes: 10,
    ranks: { liked: 2, misconceptions: 4 },
    ranking: { fusedScore: score },
    capture: { pngPath: `png/${sourceId}.png`, pngChecksum: sourceId.padEnd(64, 'a'), capturedAt: '2026-08-01T00:00:00.000Z' },
  });
  const state = {
    version: 1,
    sourceUrl: 'https://diagnosticquestions.com/Questions',
    candidates: Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((id) => [id, captured(id, Number(id))])),
  };
  const exported = exportSubagentJobs(state, {
    archiveRoot: path.resolve('archive'),
    batchSize: 5,
    permissionConfirmed: true,
  });
  assert.deepEqual(exported.jobs.map((job) => job.candidates.length), [5, 1]);
  const candidates = exported.jobs.flatMap((job) => job.candidates);
  assert.equal(new Set(candidates.map((candidate) => candidate.source.id)).size, 6);
  assert.equal(candidates[0].source.id, '6');
  assert.equal(candidates[0].source.pngSha256, '6'.padEnd(64, 'a'));
  assert.equal(candidates[0].source.licence.permissionConfirmed, true);
  assert.deepEqual(candidates[0].source.categoryPath, ['Maths', 'Number', 'Integers']);
  assert.ok(path.isAbsolute(candidates[0].source.pngPath));
  const qaFiltered = exportSubagentJobs(state, {
    archiveRoot: path.resolve('archive'),
    acceptedIds: ['2', '5'],
  });
  assert.deepEqual(qaFiltered.jobs.flatMap((job) => job.candidates)
    .map((candidate) => candidate.source.id), ['5', '2']);

  const checksum2 = state.candidates['2'].capture.pngChecksum;
  const checksum5 = state.candidates['5'].capture.pngChecksum;
  const staleChecksum5 = 'f'.repeat(64);
  const v2Filter = acceptedQaFilter({
    schemaVersion: 2,
    captures: {
      [`2@${checksum2}`]: { sourceId: '2', pngSha256: checksum2, status: 'accepted' },
      [`5@${staleChecksum5}`]: { sourceId: '5', pngSha256: staleChecksum5, status: 'accepted' },
      [`5@${checksum5}`]: { sourceId: '5', pngSha256: checksum5, status: 'unreviewed' },
    },
    currentBySourceId: {
      2: `2@${checksum2}`,
      5: `5@${checksum5}`,
    },
  });
  const revisionFiltered = exportSubagentJobs(state, {
    archiveRoot: path.resolve('archive'),
    ...v2Filter,
  });
  assert.deepEqual(revisionFiltered.jobs.flatMap((job) => job.candidates)
    .map((candidate) => candidate.source.id), ['2']);
});

test('worker results are preserved only for an unchanged source revision', () => {
  const checksum = 'a'.repeat(64);
  const exported = { jobs: [{ candidates: [{ source: { id: '1', pngSha256: checksum } }] }] };
  const previous = { jobs: [{ candidates: [{
    source: { id: '1', pngSha256: checksum },
    transcription: { question_text: 'Preserved' },
  }, {
    source: { id: '2', pngSha256: 'b'.repeat(64) },
    transcription: { question_text: 'Not present' },
  }] }] };
  assert.deepEqual(preserveWorkerResults(exported, previous), {
    preservedCandidates: 1,
    preservedFields: { transcription: 1, checker: 0, mapping: 0, review: 0 },
  });
  assert.equal(exported.jobs[0].candidates[0].transcription.question_text, 'Preserved');
});

test('candidate validation catches an unconfirmed answer and malformed misconception', async () => {
  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const candidate = clone(base);
  candidate.checker.answerMatch = false;
  candidate.transcription.options[1].why = 'Wrong';
  const result = validateCandidate(candidate, { phase: 'ready' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('15+ characters')));
  assert.ok(result.errors.some((error) => error.includes('checker must confirm')));
});

test('stable ids, canonical hashes and exact/near duplicate audits are deterministic', async () => {
  const { candidates: [candidate] } = await readFixture('candidate-bundle.json');
  assert.equal(stableQuestionId('12345'), 'dq-12345');
  assert.equal(stableQuestionId('Question 12/3'), stableQuestionId('Question 12/3'));
  assert.equal(canonicalizeText('  Evaluate  $-12 + 7$. '), 'evaluate $-12+7$.');
  assert.equal(questionHash(candidate), questionHash(clone(candidate)));

  const exact = findDuplicates(candidate, [{
    skillId: 'x',
    sourceId: '12345',
    question: { ...toProductionQuestion(candidate), id: 'other' },
  }]);
  assert.equal(exact.duplicate, true);
  assert.ok(exact.exact[0].reasons.includes('source_id'));

  const nearCandidate = clone(candidate);
  nearCandidate.source.id = '999';
  nearCandidate.source.pngSha256 = 'b'.repeat(64);
  nearCandidate.transcription.question_text = 'Evaluate $-12+7$. ';
  const near = findDuplicates(nearCandidate, [{
    skillId: 'x',
    question: toProductionQuestion(candidate),
  }], { nearThreshold: 0.75 });
  assert.equal(near.duplicate, true);

  const practiceDuplicate = findDuplicates(nearCandidate, [{
    skillId: 'x',
    kind: 'practice_mastery',
    question: { question_text: 'Evaluate $-12 + 7$.', solution_text: '$-5$' },
  }], { nearThreshold: 0.9 });
  assert.equal(practiceDuplicate.duplicate, true);
});

test('skill index includes graph context and retrieval ranks every stage without stage filtering', async () => {
  const taxonomy = await readFixture('taxonomy.json');
  const index = buildSkillIndex(taxonomy);
  const add = index.find((skill) => skill.id === 'add-subtract-integers');
  assert.deepEqual(add.prereqs, ['locate-integers']);
  assert.ok(add.siblingIds.includes('locate-integers'));
  assert.deepEqual(index.find((skill) => skill.id === 'locate-integers').dependantIds, ['add-subtract-integers']);
  assert.deepEqual(add.existingStructures, ['subtract']);

  const results = retrieveSkillCandidates('Differentiate this polynomial using the power rule', index, { limit: 3 });
  assert.equal(results[0].skill.id, 'differentiate-polynomials');
  assert.equal(results[0].skill.stage, 6);
});

test('automatic mapping requires two high-confidence, unflagged, atomic reports', () => {
  const passing = {
    mappers: [
      { skillId: 'x', score: 95, runnerUpScore: 80, atomic: true, flags: [] },
      { skillId: 'x', score: 92, runnerUpScore: 79, atomic: true, flags: [] },
    ],
  };
  assert.deepEqual(evaluateMappingConsensus(passing).skillId, 'x');
  assert.equal(evaluateMappingConsensus(passing).autoMapped, true);

  const flagged = clone(passing);
  flagged.mappers[1].flags.push('stage_notation_uncertain');
  assert.equal(evaluateMappingConsensus(flagged).autoMapped, false);
  const narrowMargin = clone(passing);
  narrowMargin.mappers[0].runnerUpScore = 85;
  assert.ok(evaluateMappingConsensus(narrowMargin).reasons.includes('mapper_1_margin_below_12'));
  const disagreement = clone(passing);
  disagreement.mappers[1].skillId = 'y';
  assert.ok(evaluateMappingConsensus(disagreement).reasons.includes('mapper_disagreement'));
});

test('selection preserves the bank cap and rotates structures with a two-per-case maximum', async () => {
  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const make = (id, structure, meaningfulCase, qualityScore) => {
    const candidate = clone(base);
    candidate.source.id = id;
    candidate.source.pngSha256 = String(id).padStart(64, '0').slice(-64);
    candidate.transcription.structure = structure;
    candidate.transcription.meaningfulCase = meaningfulCase;
    candidate.qualityScore = qualityScore;
    return candidate;
  };
  const candidates = [
    make('1', 'same', 'positive', 10),
    make('2', 'same', 'positive', 9),
    make('3', 'same', 'positive', 8),
    make('4', 'other', 'negative', 7),
  ];
  const existingQuestions = Array.from({ length: 17 }, (_, index) => ({
    id: `old-${index}`,
    structure: `old-${index}`,
    question_text: `Old ${index}`,
  }));
  const result = selectQuestionsForSkill({ candidates, existingQuestions });
  assert.equal(result.finalCount, 20);
  assert.deepEqual(result.selected.map((item) => item.source.id), ['1', '4', '2']);
  assert.ok(result.skipped.some((item) => item.candidate.source.id === '3'));
});

test('dry run never writes, contentless skills are held, and explicit promotion is schema exact', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  await fs.mkdir(path.join(temporary, 'public', 'content'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'public', 'quizzes'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'data'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'public', 'content', 'add-subtract-integers.json'), '{}');

  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const dryRun = await processCandidateBundle({ candidates: [base], repoRoot: temporary });
  assert.equal(dryRun.mode, 'dry-run');
  assert.equal(dryRun.decisions[0].status, 'eligible');
  await assert.rejects(fs.access(path.join(temporary, 'public', 'quizzes', 'add-subtract-integers.json')));

  const contentless = clone(base);
  contentless.source.id = '54321';
  contentless.source.pngSha256 = 'c'.repeat(64);
  contentless.mapping.mappers.forEach((mapper) => { mapper.skillId = 'differentiate-polynomials'; });
  const held = await assessPromotionEligibility(contentless, { repoRoot: temporary });
  assert.equal(held.status, 'held_missing_content');

  const promoted = await processCandidateBundle({ candidates: [base], repoRoot: temporary, promote: true });
  assert.equal(promoted.mode, 'promote');
  const quiz = JSON.parse(await fs.readFile(path.join(temporary, 'public', 'quizzes', 'add-subtract-integers.json'), 'utf8'));
  assert.equal(quiz.questions.length, 1);
  assert.deepEqual(Object.keys(quiz.questions[0]), PRODUCTION_QUESTION_KEYS);
  const provenance = JSON.parse(await fs.readFile(path.join(temporary, 'data', 'dq-provenance.json'), 'utf8'));
  assert.equal(provenance.entries[0].questionId, 'dq-12345');
  assert.equal(provenance.entries[0].mappedSkillId, 'add-subtract-integers');
});

test('structure map renormalises the slug and makes the per-structure cap bind', async () => {
  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const variant = (id, structure) => {
    const candidate = clone(base);
    candidate.source.id = id;
    candidate.source.pngSha256 = id.padEnd(64, 'e');
    candidate.transcription.structure = structure;
    candidate.transcription.question_text = `${base.transcription.question_text} (${id})`;
    return candidate;
  };
  // Imports arrive with one hyper-specific slug each, so the cap never binds.
  const candidates = ['1', '2', '3'].map((id) => variant(id, `import-only-archetype-${id}`));

  const unmapped = selectQuestionsForSkill({ candidates, existingQuestions: [] });
  assert.equal(unmapped.selected.length, 3);

  const structureMap = { 1: 'add-two-integers', 2: 'add-two-integers', 3: 'add-two-integers' };
  assert.equal(toProductionQuestion(candidates[0], { structureMap }).structure, 'add-two-integers');
  assert.equal(toProductionQuestion(candidates[0]).structure, 'import-only-archetype-1');

  const mapped = selectQuestionsForSkill({ candidates, existingQuestions: [], structureMap });
  assert.equal(mapped.selected.length, 2, 'MAX_PER_STRUCTURE_CASE binds once the slugs collapse');
  assert.ok(mapped.skipped.some((entry) => entry.reason === 'structure_case_limit'));
});

test('bundle honours skill scope, bank cap, and structure overrides', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-scope-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  await fs.mkdir(path.join(temporary, 'public', 'content'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'public', 'quizzes'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'data'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'public', 'content', 'add-subtract-integers.json'), '{}');
  await fs.writeFile(path.join(temporary, 'public', 'content', 'multiply-integers.json'), '{}');

  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const variant = (id, skillId) => {
    const candidate = clone(base);
    candidate.source.id = id;
    candidate.source.pngSha256 = id.padEnd(64, 'd');
    candidate.transcription.structure = `archetype-${id}`;
    candidate.transcription.meaningfulCase = `case-${id}`;
    candidate.transcription.question_text = `${base.transcription.question_text} (${id})`;
    candidate.mapping.mappers.forEach((mapper) => { mapper.skillId = skillId; });
    return candidate;
  };
  const candidates = [
    variant('91', 'add-subtract-integers'),
    variant('92', 'add-subtract-integers'),
    variant('93', 'add-subtract-integers'),
    variant('94', 'multiply-integers'),
  ];

  const scoped = await processCandidateBundle({
    candidates,
    repoRoot: temporary,
    skillFilter: ['add-subtract-integers'],
    maxQuestions: 2,
    structureMap: { 91: 'shared-archetype', 92: 'shared-archetype', 93: 'shared-archetype' },
  });
  assert.deepEqual(scoped.scope, { skillIds: ['add-subtract-integers'], outOfScopeCount: 1 });
  assert.equal(scoped.maxQuestions, 2);
  assert.equal(scoped.promotionPlan.length, 1, 'the out-of-scope skill never enters the plan');
  assert.equal(scoped.promotionPlan[0].finalCount, 2, 'the bank cap holds below the hard ceiling of 20');

  const promoted = await processCandidateBundle({
    candidates,
    repoRoot: temporary,
    promote: true,
    skillFilter: ['add-subtract-integers'],
    maxQuestions: 2,
    structureMap: { 91: 'shared-archetype', 92: 'shared-archetype', 93: 'shared-archetype' },
  });
  assert.equal(promoted.mode, 'promote');
  const quiz = JSON.parse(await fs.readFile(path.join(temporary, 'public', 'quizzes', 'add-subtract-integers.json'), 'utf8'));
  assert.equal(quiz.questions.length, 2);
  assert.deepEqual([...new Set(quiz.questions.map((question) => question.structure))], ['shared-archetype']);
  await assert.rejects(fs.access(path.join(temporary, 'public', 'quizzes', 'multiply-integers.json')));
});

test('precomputing the corpus does not change duplicate verdicts', async () => {
  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const near = clone(base);
  near.source.id = '99999';
  near.source.pngSha256 = 'b'.repeat(64);
  const unrelated = { skillId: 'other', question: { id: 'q-1', question_text: 'Differentiate $x^3$ with respect to $x$.', options: [] } };
  const existing = [
    { skillId: 'add-subtract-integers', question: toProductionQuestion(base) },
    unrelated,
  ];

  const slow = findDuplicates(near, existing);
  const fast = findDuplicates(near, [], { preparedExisting: prepareExistingEntries(existing) });
  assert.deepEqual(fast, slow);
  assert.equal(slow.duplicate, true);
  assert.deepEqual(slow.exact.map((entry) => entry.reasons), [['canonical_question']]);
});

test('delimiter style is normalised but eaten backslashes are rejected', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-lint-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  await fs.mkdir(path.join(temporary, 'public', 'content'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'public', 'quizzes'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'public', 'content', 'add-subtract-integers.json'), '{}');

  const { candidates: [base] } = await readFixture('candidate-bundle.json');

  const parenStyle = clone(base);
  parenStyle.transcription.question_text = 'Work out '+BS+'('+BS+'frac{1}{2}+'+BS+'frac{1}{3}'+BS+').';
  const converted = toProductionQuestion(parenStyle);
  assert.equal(converted.question_text, `Work out $${BS}frac{1}{2}+${BS}frac{1}{3}$.`);
  assert.deepEqual(lintProductionQuestion(converted), []);
  assert.equal((await assessPromotionEligibility(parenStyle, { repoRoot: temporary })).status, 'eligible');

  // A transcription that lost its backslash arrives with a raw control character.
  const corrupted = clone(base);
  corrupted.source.id = '77777';
  corrupted.source.pngSha256 = 'a'.repeat(64);
  corrupted.transcription.question_text = ['Work out $45', 'imes0.2$.'].join(String.fromCharCode(9));
  const held = await assessPromotionEligibility(corrupted, { repoRoot: temporary });
  assert.equal(held.status, 'invalid');
  assert.ok(held.reasons.some((reason) => /raw TAB/.test(reason)));
});

test('a bank already larger than the pass ceiling is left alone, not refused', async (t) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-ceiling-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  await fs.mkdir(path.join(temporary, 'public', 'content'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'public', 'quizzes'), { recursive: true });
  await fs.mkdir(path.join(temporary, 'data'), { recursive: true });
  await fs.writeFile(path.join(temporary, 'public', 'content', 'add-subtract-integers.json'), '{}');

  // An authored bank of 12 is not a defect; this pass simply has no room to add to it.
  const authored = Array.from({ length: 12 }, (_, i) => ({
    id: `q${i}`,
    question_text: `Authored question ${i}`,
    structure: 'authored',
    mastery: false,
    options: [{ text: 'a', correct: true }, { text: 'b', why: 'a specific misconception here' }, { text: 'c', why: 'another specific misconception' }],
    solution_text: 'x',
  }));
  const quizPath = path.join(temporary, 'public', 'quizzes', 'add-subtract-integers.json');
  await fs.writeFile(quizPath, JSON.stringify({ skillId: 'add-subtract-integers', questions: authored }));

  const { candidates: [base] } = await readFixture('candidate-bundle.json');
  const report = await processCandidateBundle({ candidates: [base], repoRoot: temporary, promote: true, maxQuestions: 10 });
  assert.equal(report.promotionPlan[0].selectedSourceIds.length, 0, 'no capacity, so nothing is selected');
  const after = JSON.parse(await fs.readFile(quizPath, 'utf8'));
  assert.equal(after.questions.length, 12, 'the authored bank is untouched');
});
