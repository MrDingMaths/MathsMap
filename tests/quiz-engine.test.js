import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession,
  nextStep,
  answerQuestion,
  extendCap,
  getResults
} from '../src/lib/quiz-engine.js';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function skill(id, prereqs = [], extra = {}) {
  return { id, title: id, stage: 1, difficulty: 1, prereqs, ...extra };
}

let optSeq = 0;
function opt(correct) {
  return correct
    ? { text: 'correct-answer', correct: true }
    : { text: `distractor-${optSeq++}`, why: 'a specific named misconception here' };
}

function question(id, structure = 'main', mastery = false) {
  // Correct option is authored at index 0; distractors follow.
  return { id, structure, mastery, options: [opt(true), opt(false), opt(false)] };
}

function quiz(skillId, questions) {
  return { skillId, questions };
}

// A standard 2-non-mastery quiz, optionally with a mastery question.
function quiz2(skillId, { withMastery = false } = {}) {
  const qs = [question(`${skillId}-q1`, 's1'), question(`${skillId}-q2`, 's2')];
  if (withMastery) qs.push(question(`${skillId}-m1`, 'twist', true));
  return quiz(skillId, qs);
}

// Answer the currently-served question correctly or incorrectly.
function answer(session, correct) {
  const q = session.current.question;
  const ci = q.options.findIndex((o) => o.correct === true);
  const idx = correct ? ci : (ci + 1) % q.options.length;
  return answerQuestion(session, idx);
}

// Drive to completion, answering every question with the given policy.
// policy(skillId, question, isMastery) -> boolean (true = answer correctly).
function run(session, policy) {
  const served = [];
  let guard = 0;
  while (guard++ < 1000) {
    const step = nextStep(session);
    if (step.type === 'done') return { reason: step.reason, served };
    const isMastery = session.current.isMastery;
    served.push({ skillId: step.skillId, question: step.question, isMastery });
    answer(session, policy(step.skillId, step.question, isMastery));
  }
  throw new Error('run: did not terminate');
}

// ---------------------------------------------------------------------------
// 1. Frontier selection: max in-scope descendants, then tie-breaks
// ---------------------------------------------------------------------------

test('selection prefers the candidate with the most in-scope descendants', () => {
  // A has descendants C, D, E within scope; B has none.
  const skills = [
    skill('A'),
    skill('B'),
    skill('C', ['A']),
    skill('D', ['A']),
    skill('E', ['D'])
  ];
  const scope = ['A', 'B', 'C', 'D', 'E'];
  const quizzes = Object.fromEntries(scope.map((id) => [id, quiz2(id)]));
  const s = createSession({ skills, scopeSkillIds: scope, quizzes, initialMastery: {} });
  const step = nextStep(s);
  assert.equal(step.type, 'question');
  assert.equal(step.skillId, 'A'); // 3 descendants beats B's 0
});

test('tie-break order is stage, then difficulty, then title', () => {
  // Three zero-descendant candidates.
  const skills = [
    skill('zebra', [], { stage: 2, difficulty: 1 }),
    skill('gamma', [], { stage: 2, difficulty: 3 }),
    skill('alpha', [], { stage: 1, difficulty: 9 })
  ];
  const quizzesFor = (ids) => Object.fromEntries(ids.map((id) => [id, quiz2(id)]));

  // alpha has the lowest stage -> chosen first despite high difficulty.
  const scope = ['zebra', 'gamma', 'alpha'];
  let s = createSession({ skills, scopeSkillIds: scope, quizzes: quizzesFor(scope) });
  assert.equal(nextStep(s).skillId, 'alpha');

  // Between zebra & gamma (same stage 2): lower difficulty wins -> gamma.
  const skills2 = [
    skill('zebra', [], { stage: 2, difficulty: 5 }),
    skill('gamma', [], { stage: 2, difficulty: 2 })
  ];
  s = createSession({ skills: skills2, scopeSkillIds: ['zebra', 'gamma'], quizzes: quizzesFor(['zebra', 'gamma']) });
  assert.equal(nextStep(s).skillId, 'gamma');

  // Same stage & difficulty: title ascending -> 'aaa' before 'bbb'.
  const skills3 = [
    skill('bbb', [], { stage: 2, difficulty: 2, title: 'bbb' }),
    skill('aaa', [], { stage: 2, difficulty: 2, title: 'aaa' })
  ];
  s = createSession({ skills: skills3, scopeSkillIds: ['bbb', 'aaa'], quizzes: quizzesFor(['bbb', 'aaa']) });
  assert.equal(nextStep(s).skillId, 'aaa');
});

// ---------------------------------------------------------------------------
// 2. 2/2 -> PASSED + proficient; mastery offered; mastered / no-downgrade
// ---------------------------------------------------------------------------

test('2/2 passes, writes proficient, offers mastery, mastered on correct', () => {
  const skills = [skill('X')];
  const quizzes = { X: quiz2('X', { withMastery: true }) };
  const s = createSession({ skills, scopeSkillIds: ['X'], quizzes });

  // First non-mastery question: no outcome yet.
  let step = nextStep(s);
  assert.equal(step.type, 'question');
  let r = answer(s, true);
  assert.deepEqual(r.writes, []);

  // Second non-mastery: PASS -> proficient write.
  step = nextStep(s);
  r = answer(s, true);
  assert.deepEqual(r.writes, [{ id: 'X', level: 'proficient' }]);
  assert.equal(s.status.X, 'PASSED');

  // Mastery follow-up is offered next.
  step = nextStep(s);
  assert.equal(step.type, 'question');
  assert.equal(step.question.mastery, true);
  assert.equal(s.current.isMastery, true);

  // Correct mastery answer -> mastered write.
  r = answer(s, true);
  assert.deepEqual(r.writes, [{ id: 'X', level: 'mastered' }]);

  assert.equal(nextStep(s).type, 'done');
});

test('wrong mastery answer does not downgrade and writes nothing', () => {
  const skills = [skill('X')];
  const quizzes = { X: quiz2('X', { withMastery: true }) };
  const s2 = createSession({ skills, scopeSkillIds: ['X'], quizzes });
  nextStep(s2);
  answer(s2, true);
  nextStep(s2);
  answer(s2, true); // PASS -> proficient
  nextStep(s2); // mastery question served
  const r = answer(s2, false); // wrong
  assert.deepEqual(r.writes, []);
  // Effective level stays proficient (one proficient write, no mastered).
  assert.deepEqual(getResults(s2).writes, [{ id: 'X', level: 'proficient' }]);
});

// ---------------------------------------------------------------------------
// 3. 1/2 -> learning; descendants BLOCKED and never asked
// ---------------------------------------------------------------------------

test('1/2 partial writes learning and blocks descendants (never asked)', () => {
  const skills = [skill('X'), skill('Y', ['X']), skill('Z', ['Y'])];
  const scope = ['X', 'Y', 'Z'];
  const quizzes = Object.fromEntries(scope.map((id) => [id, quiz2(id)]));
  const s = createSession({ skills, scopeSkillIds: scope, quizzes });

  // Answer X: first correct, second wrong -> PARTIAL.
  nextStep(s);
  answer(s, true);
  const step2 = nextStep(s);
  assert.equal(step2.skillId, 'X');
  const r = answer(s, false);
  assert.deepEqual(r.writes, [{ id: 'X', level: 'learning' }]);
  assert.equal(s.status.X, 'PARTIAL');

  // Nothing else is asked.
  assert.equal(nextStep(s).type, 'done');
  assert.equal(s.status.Y, 'BLOCKED');
  assert.equal(s.status.Z, 'BLOCKED');

  const res = getResults(s);
  assert.deepEqual(res.blocked.sort((a, b) => a.id.localeCompare(b.id)), [
    { id: 'Y', blockedBy: 'X' },
    { id: 'Z', blockedBy: 'X' }
  ]);
  // Y and Z never appear in the log.
  assert.ok(!s.log.some((e) => e.skillId === 'Y' || e.skillId === 'Z'));
});

// ---------------------------------------------------------------------------
// 4. 0/2 -> no write; descendants BLOCKED
// ---------------------------------------------------------------------------

test('0/2 fails with no write and blocks descendants', () => {
  const skills = [skill('X'), skill('Y', ['X'])];
  const scope = ['X', 'Y'];
  const quizzes = Object.fromEntries(scope.map((id) => [id, quiz2(id)]));
  const s = createSession({ skills, scopeSkillIds: scope, quizzes });

  const { reason } = run(s, () => false); // answer everything wrong
  assert.equal(reason, 'exhausted');
  assert.equal(s.status.X, 'FAILED');
  assert.equal(s.status.Y, 'BLOCKED');
  assert.deepEqual(s.writes, []);
  assert.ok(!s.log.some((e) => e.skillId === 'Y'));
});

// ---------------------------------------------------------------------------
// 5. Skip-ahead inference across a 3-deep chain (out-of-scope write, in-scope INFERRED)
// ---------------------------------------------------------------------------

test('passing a leaf infers its full-DAG prereq chain', () => {
  // Chain A <- B <- C <- D. Scope is only {A, D}; B and C are out of scope.
  const skills = [
    skill('A', [], { stage: 2 }),
    skill('B', ['A']),
    skill('C', ['B']),
    skill('D', ['C'], { stage: 1 })
  ];
  const scope = ['A', 'D'];
  const quizzes = { A: quiz2('A'), D: quiz2('D') };
  const s = createSession({ skills, scopeSkillIds: scope, quizzes });

  // D (stage 1) is selected before A (stage 2); its in-scope prereqs are empty.
  let step = nextStep(s);
  assert.equal(step.skillId, 'D');
  answer(s, true);
  step = nextStep(s);
  assert.equal(step.skillId, 'D');
  const r = answer(s, true); // PASS D

  // Inference wrote proficient to B, C (out of scope) and A (in scope).
  const writeMap = Object.fromEntries(r.writes.map((w) => [w.id, w.level]));
  assert.equal(writeMap.D, 'proficient');
  assert.equal(writeMap.C, 'proficient');
  assert.equal(writeMap.B, 'proficient');
  assert.equal(writeMap.A, 'proficient');

  // A is in scope -> marked INFERRED and never asked.
  assert.equal(s.status.A, 'INFERRED');
  assert.equal(nextStep(s).type, 'done');
  assert.ok(!s.log.some((e) => e.skillId === 'A'));

  const res = getResults(s);
  assert.deepEqual(res.inferred, ['A']);
});

// ---------------------------------------------------------------------------
// 6. Already-mastered skills pre-resolved: never asked, no writes
// ---------------------------------------------------------------------------

test('already-mastered prereqs are pre-resolved and unblock dependents', () => {
  const skills = [skill('X'), skill('Y', ['X'])];
  const scope = ['X', 'Y'];
  const quizzes = Object.fromEntries(scope.map((id) => [id, quiz2(id)]));
  const s = createSession({
    skills,
    scopeSkillIds: scope,
    quizzes,
    initialMastery: { X: 'mastered' }
  });

  // X is pre-resolved PASSED; Y becomes a candidate immediately.
  assert.equal(s.status.X, 'PASSED');
  const step = nextStep(s);
  assert.equal(step.skillId, 'Y');

  run(s, () => true);
  // X was never asked and produced no write.
  assert.ok(!s.log.some((e) => e.skillId === 'X'));
  assert.ok(!s.writes.some((w) => w.id === 'X'));

  const res = getResults(s);
  // Pre-resolved X appears in no bucket.
  assert.ok(!res.tested.some((t) => t.id === 'X'));
  assert.ok(!res.notAssessed.includes('X'));
  assert.ok(res.tested.some((t) => t.id === 'Y' && t.status === 'PASSED'));
});

// ---------------------------------------------------------------------------
// 7. Cap termination + extendCap; exhausted termination
// ---------------------------------------------------------------------------

test('cap halts after N answers; extendCap resumes; then exhausts', () => {
  const skills = [skill('A'), skill('B'), skill('C')];
  const scope = ['A', 'B', 'C'];
  const quizzes = Object.fromEntries(scope.map((id) => [id, quiz2(id)]));
  const s = createSession({ skills, scopeSkillIds: scope, quizzes });
  s.cap = 2; // room for exactly one 2-question skill

  nextStep(s);
  answer(s, true);
  nextStep(s);
  answer(s, true); // first skill resolved, answeredCount === 2

  // Cap reached -> done:'cap'.
  let step = nextStep(s);
  assert.deepEqual(step, { type: 'done', reason: 'cap' });

  // Extend and continue.
  extendCap(s, 10);
  assert.equal(s.cap, 12);
  const { reason } = run(s, () => true);
  assert.equal(reason, 'exhausted'); // all three skills now assessed
  assert.equal(s.answeredCount, 6);
});

// ---------------------------------------------------------------------------
// 8. No question id repeats; distinct structure preferred
// ---------------------------------------------------------------------------

test('the two asked questions have distinct ids and prefer distinct structures', () => {
  // Three non-mastery questions: two share structure s1, one is s2.
  const qs = [
    question('q1', 's1'),
    question('q2', 's1'),
    question('q3', 's2')
  ];
  const skills = [skill('X')];
  for (let seed = 1; seed <= 6; seed++) {
    const s = createSession({
      skills,
      scopeSkillIds: ['X'],
      quizzes: { X: quiz('X', qs) },
      seed
    });
    const { served } = run(s, () => true);
    const nonMastery = served.filter((x) => !x.isMastery);
    assert.equal(nonMastery.length, 2);
    const ids = nonMastery.map((x) => x.question.id);
    assert.notEqual(ids[0], ids[1], `seed ${seed}: ids must differ`);
    const structs = nonMastery.map((x) => x.question.structure);
    assert.notEqual(structs[0], structs[1], `seed ${seed}: structures should differ`);
  }
});

// ---------------------------------------------------------------------------
// 9. Writes never downgrade
// ---------------------------------------------------------------------------

test('a partial result does not downgrade an already-proficient skill', () => {
  const skills = [skill('X')];
  const quizzes = { X: quiz2('X') };
  const s = createSession({
    skills,
    scopeSkillIds: ['X'],
    quizzes,
    initialMastery: { X: 'proficient' }
  });

  nextStep(s);
  answer(s, true);
  nextStep(s);
  const r = answer(s, false); // 1/2 -> PARTIAL, would-be learning write
  assert.deepEqual(r.writes, []); // learning < proficient -> suppressed
  assert.equal(s.status.X, 'PARTIAL');
  assert.deepEqual(s.writes, []);
});

// ---------------------------------------------------------------------------
// 10. Single non-mastery question edge case
// ---------------------------------------------------------------------------

test('single-question skill: 1/1 passes, 0/1 fails', () => {
  const skills = [skill('X')];
  const one = quiz('X', [question('only', 's1')]);

  // 1/1 -> PASS
  let s = createSession({ skills, scopeSkillIds: ['X'], quizzes: { X: one } });
  let step = nextStep(s);
  assert.equal(step.skillId, 'X');
  let r = answer(s, true);
  assert.deepEqual(r.writes, [{ id: 'X', level: 'proficient' }]);
  assert.equal(s.status.X, 'PASSED');
  assert.equal(nextStep(s).type, 'done');

  // 0/1 -> FAIL
  s = createSession({ skills, scopeSkillIds: ['X'], quizzes: { X: one } });
  nextStep(s);
  r = answer(s, false);
  assert.deepEqual(r.writes, []);
  assert.equal(s.status.X, 'FAILED');
});
