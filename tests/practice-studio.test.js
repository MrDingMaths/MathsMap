import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTIES,
  difficultyBandForScore,
  approvalCheck,
  containsParentAnswers,
  filterQuestionBank,
  skillMatchesTaxonomyPath,
  hasDiagrams,
  invalidFractionSpans,
  isMultipart,
  makeBankManifest,
  markApproved,
  normaliseQuestion,
  sortQuestions,
  validateImport,
  validateQuestion,
  worksheetLeaves,
  containsSourceMetadata,
} from '../src/lib/practice-question-model.js';

const diagram = { id: 'curve', role: 'question', format: 'tikz', code: '\\draw (0,0)--(1,1);', widthMm: 95, reviewStatus: 'approved' };
const nested = normaliseQuestion({
  format: 'mathsmap-practice-question-v3',
  version: 3,
  id: 'nested-1',
  classification: { primarySkillId: 'composite-functions', secondarySkillIds: ['composite-function-equations'], reasoningScore: 64, difficulty: 'Mastery', difficultyReason: 'Test calibration.' },
  content: {
    type: 'question',
    prompt: 'Sketch derivatives.',
    layout: 'grid',
    columns: 3,
    questionDiagrams: [],
    children: [{
      id: 'group-a',
      type: 'group',
      label: 'a',
      prompt: 'Curve a',
      layout: 'list',
      columns: null,
      questionDiagrams: [],
      children: [{
        id: 'part-a-i',
        type: 'part',
        label: 'i',
        prompt: 'Find $f(x)=\\\\frac{1}{x}$.',
        layout: 'list',
        columns: null,
        questionDiagrams: [diagram],
        children: [],
        answer: {
          short: '$\\\\frac{1}{x}$',
          worked: 'Use the reciprocal rule.',
          solutionDiagrams: [],
        },
        answerSpaceMm: 26,
      }],
    }],
  },
});

test('normalises v3 hierarchy and preserves leaf diagrams', () => {
  assert.equal(isMultipart(nested), true);
  assert.equal(nested.content.type, 'question');
  assert.equal(nested.content.children[0].type, 'group');
  assert.equal(worksheetLeaves(nested)[0].answerSpaceMm, 26);
  assert.equal(hasDiagrams(nested), true);
  assert.equal(JSON.stringify(nested).includes('"marks"'), false);
});

test('approval is explicit and blocks unresolved diagram evidence', () => {
  assert.equal(approvalCheck(nested).ready, true);
  const approved = markApproved(nested, { approvedBy: 'test', at: '2026-01-01T00:00:00.000Z' });
  assert.equal(nested.status, 'draft');
  assert.equal(approved.status, 'approved');
  assert.equal(approved.review.approvedBy, 'test');
  const unresolved = normaliseQuestion({ ...nested, content: { ...nested.content, children: [{ ...nested.content.children[0], children: [{ ...nested.content.children[0].children[0], questionDiagrams: [{ ...diagram, reviewStatus: 'needs-review' }] }] }] } });
  assert.equal(approvalCheck(unresolved).ready, false);
});

test('v3 validation rejects marks, parent answers, source metadata, and slash fractions', () => {
  const valid = validateQuestion(nested, { skillIds: new Set(['composite-functions', 'composite-function-equations']) });
  assert.equal(valid.valid, true);
  assert.deepEqual(DIFFICULTIES.map((item) => item.id), ['Foundation', 'Development', 'Mastery', 'Challenge']);
  assert.equal(invalidFractionSpans('$x/2$').length, 1);
  assert.equal(invalidFractionSpans('See https://example.test/a/b.png').length, 0);
  assert.equal(containsParentAnswers({ content: { children: [{ prompt: 'group', children: [{ prompt: 'leaf' }], answer: { short: 'wrong' } }] } }), true);
  const badMarks = validateImport({ format: 'mathsmap-practice-import-v3', version: 3, questions: [{ ...nested, content: { ...nested.content, marks: 1 } }] });
  assert.equal(badMarks.valid, false);
});


test('v3 format is required and parent spacing or source metadata block validation', () => {
  const missingFormat = { ...nested, format: undefined };
  assert.equal(validateQuestion(missingFormat).valid, false);
  const parentSpace = { ...nested, content: { ...nested.content, answerSpaceMm: 20 } };
  assert.equal(validateQuestion(parentSpace).valid, false);
  const badSource = { ...nested, source: { file: 'pilot.pdf', pageNumber: 1 } };
  assert.equal(containsSourceMetadata(badSource), true);
  assert.equal(approvalCheck(badSource).ready, false);
  assert.ok(approvalCheck(badSource).blockers.some((item) => item.includes('source metadata')));
});

test('bank filters, sorts, and manifest expose only approved v3 records', () => {
  const other = markApproved(normaliseQuestion({
    format: 'mathsmap-practice-question-v3',
    version: 3,
    id: 'other',
    classification: { primarySkillId: 'composite-functions', reasoningScore: 12, difficulty: 'Foundation', difficultyReason: 'Test calibration.' },
    content: { type: 'question', prompt: 'Easy', layout: 'list', columns: null, children: [], answer: { short: '1', worked: 'Done', solutionDiagrams: [] } },
  }));
  const records = [markApproved(nested), other];
  assert.equal(filterQuestionBank(records, { difficulty: ['Mastery'], multipart: true }).length, 1);
  assert.equal(sortQuestions(records, 'difficulty')[0].id, 'other');
  const manifest = makeBankManifest(records);
  assert.equal(manifest.questions.length, 2);
  assert.equal(JSON.stringify(manifest).includes('"marks"'), false);
});

test('taxonomy filters and reasoning score bands are deterministic', () => {
  assert.equal(difficultyBandForScore(0), 'Foundation');
  assert.equal(difficultyBandForScore(24), 'Foundation');
  assert.equal(difficultyBandForScore(25), 'Development');
  assert.equal(difficultyBandForScore(49), 'Development');
  assert.equal(difficultyBandForScore(50), 'Mastery');
  assert.equal(difficultyBandForScore(79), 'Mastery');
  assert.equal(difficultyBandForScore(80), 'Challenge');
  assert.equal(difficultyBandForScore(100), 'Challenge');

  const taxonomy = {
    skills: [{ id: 'composite-functions', title: 'Composite functions', courses: ['course-a'], dotPointIds: ['subtopic-a'] }],
    topics: [{ id: 'topic-a', title: 'Functions' }],
    dotpoints: [{ id: 'subtopic-a', title: 'Composition', topicId: 'topic-a' }],
  };
  assert.equal(filterQuestionBank([markApproved(nested)], {
    courseId: 'course-a',
    topicId: 'topic-a',
    subtopicId: 'subtopic-a',
    skill: 'composite-functions',
    reasoningMin: 60,
    reasoningMax: 70,
  }, taxonomy).length, 1);
  assert.equal(filterQuestionBank([markApproved(nested)], { reasoningMin: '', reasoningMax: '' }, taxonomy).length, 1);
  assert.equal(filterQuestionBank([markApproved(nested)], { courseId: 'course-b' }, taxonomy).length, 0);

  const matchingSkill = taxonomy.skills[0];
  const otherSkill = { id: 'other-skill', title: 'Other', courses: ['course-a'], dotPointIds: ['subtopic-b'] };
  const dotpoints = [...taxonomy.dotpoints, { id: 'subtopic-b', title: 'Other', topicId: 'topic-b' }];
  assert.equal(skillMatchesTaxonomyPath(matchingSkill, { courseId: 'course-a' }, dotpoints), true);
  assert.equal(skillMatchesTaxonomyPath(matchingSkill, { topicId: 'topic-a' }, dotpoints), true);
  assert.equal(skillMatchesTaxonomyPath(matchingSkill, { subtopicId: 'subtopic-a' }, dotpoints), true);
  assert.equal(skillMatchesTaxonomyPath(otherSkill, { topicId: 'topic-a' }, dotpoints), false);
  assert.equal(skillMatchesTaxonomyPath(otherSkill, { subtopicId: 'subtopic-a' }, dotpoints), false);
  assert.equal(skillMatchesTaxonomyPath(matchingSkill, { courseId: 'course-b' }, dotpoints), false);
});
