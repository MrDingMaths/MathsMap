// Adaptive diagnostic quiz ENGINE — pure, dependency-injected.
//
// This module owns the *logic* of an adaptive diagnostic: given a scope of
// skills, their prerequisite DAG, and their quiz files, it decides which skill
// to probe next, grades the answers, infers mastery of skipped prerequisites,
// and blocks skills whose foundations just failed. It performs NO I/O: no
// fetch, no localStorage, no Date, no Math.random, no Svelte. Everything it
// needs is injected through `createSession`, and every write it wants to make
// to the store is returned to the caller to apply (via `upgradeMastery`).
//
// The caller (a view) is responsible for: shuffling option order for display,
// mapping the chosen option back to its ORIGINAL index before calling
// `answerQuestion`, and applying returned `writes` to the store.
//
// Level ladder (mirrors src/lib/store.js LEVELS):
//   'none' < 'learning' < 'proficient' < 'mastered'
//
// Per-skill traversal status:
//   UNTESTED  — in scope, not yet reached
//   ACTIVE    — questions are currently being served for it (transient)
//   PASSED    — all asked questions correct (or pre-resolved as already mastered)
//   PARTIAL   — exactly one of two questions correct
//   FAILED    — zero questions correct
//   INFERRED  — proven proficient indirectly, because a descendant passed
//   BLOCKED   — a prerequisite came back PARTIAL/FAILED, so it is not probed

/** @typedef {'none'|'learning'|'proficient'|'mastered'} Level */
/** @typedef {'UNTESTED'|'ACTIVE'|'PASSED'|'PARTIAL'|'FAILED'|'INFERRED'|'BLOCKED'} Status */

/**
 * @typedef {Object} Skill
 * @property {string} id
 * @property {string} [title]
 * @property {number} [stage]
 * @property {number} [difficulty]
 * @property {string[]} [prereqs]
 */

/**
 * @typedef {Object} QuizOption
 * @property {string} text
 * @property {boolean} [correct]  // present & true on exactly one option
 * @property {string} [why]       // present on every distractor
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} id
 * @property {string} [structure]
 * @property {boolean} mastery
 * @property {QuizOption[]} options
 */

/**
 * @typedef {Object} Quiz
 * @property {string} skillId
 * @property {QuizQuestion[]} questions
 */

const LEVELS = /** @type {Level[]} */ (['none', 'learning', 'proficient', 'mastered']);
const LEVEL_RANK = Object.fromEntries(LEVELS.map((l, i) => [l, i]));

const DEFAULT_CAP = 20;

/**
 * Deterministic seedable PRNG (mulberry32). Returns a function producing floats
 * in [0, 1). Used so question sampling is reproducible in tests and so the
 * engine never touches Math.random (banned by workflow scripts).
 * @param {number} seed
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {Level} a @param {Level} b @returns {Level} */
function maxLevel(a, b) {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

/**
 * @param {Map<string, Quiz>|Object<string, Quiz>} quizzes
 * @param {string} id
 * @returns {Quiz|undefined}
 */
function getQuiz(quizzes, id) {
  if (!quizzes) return undefined;
  return quizzes instanceof Map ? quizzes.get(id) : quizzes[id];
}

/** Non-mastery questions of a quiz. @param {Quiz|undefined} quiz */
function nonMasteryQuestions(quiz) {
  return quiz ? quiz.questions.filter((q) => !q.mastery) : [];
}

/**
 * In-place Fisher–Yates on a copy, driven by the injected rng (deterministic).
 * @template T @param {T[]} arr @param {() => number} rng @returns {T[]}
 */
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/**
 * Create a diagnostic session.
 *
 * @param {Object} cfg
 * @param {Skill[]} cfg.skills - FULL skill array (for full-graph inference).
 * @param {string[]} cfg.scopeSkillIds - skill ids in the chosen scope.
 * @param {Map<string, Quiz>|Object<string, Quiz>} cfg.quizzes - skillId → quiz.
 * @param {Object<string, Level>} [cfg.initialMastery] - skillId → current level.
 * @param {number} [cfg.seed=1] - seed for the default rng.
 * @param {() => number} [cfg.rng] - optional injected rng (overrides seed).
 * @returns {Object} session — a mostly-serializable state object. Its `_internal`
 *   field holds non-serializable engine scratch (rng, quiz map, precomputed
 *   graphs); the remaining fields are plain JSON. To persist and resume a
 *   session, serialize everything except `_internal` and re-inject the deps.
 */
export function createSession({ skills, scopeSkillIds, quizzes, initialMastery = {}, seed = 1, rng }) {
  const random = rng || mulberry32(seed);
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const allIds = new Set(skillById.keys());

  // Effective scope S: in the chosen scope AND has a quiz with ≥1 non-mastery
  // question. Anything else can never be probed, so it never enters traversal.
  const scope = [];
  const scopeSet = new Set();
  for (const id of scopeSkillIds) {
    if (!skillById.has(id)) continue;
    if (scopeSet.has(id)) continue;
    if (nonMasteryQuestions(getQuiz(quizzes, id)).length >= 1) {
      scope.push(id);
      scopeSet.add(id);
    }
  }

  // Full-DAG transitive ancestors (prerequisites), memoized.
  const ancestorCache = new Map();
  /** @param {string} id @returns {Set<string>} */
  function fullAncestors(id) {
    if (ancestorCache.has(id)) return ancestorCache.get(id);
    const out = new Set();
    ancestorCache.set(id, out); // guard against cycles
    const skill = skillById.get(id);
    for (const p of (skill && skill.prereqs) || []) {
      if (!allIds.has(p)) continue;
      out.add(p);
      for (const a of fullAncestors(p)) out.add(a);
    }
    return out;
  }

  // S-restricted forward edges (prereq → dependent, both in S) → descendants.
  const sDependents = new Map(scope.map((id) => [id, []]));
  for (const id of scope) {
    for (const p of skillById.get(id).prereqs || []) {
      if (scopeSet.has(p)) sDependents.get(p).push(id);
    }
  }
  const descendantCache = new Map();
  /** In-scope transitive descendants of a skill. @param {string} id @returns {Set<string>} */
  function inScopeDescendants(id) {
    if (descendantCache.has(id)) return descendantCache.get(id);
    const out = new Set();
    descendantCache.set(id, out);
    for (const d of sDependents.get(id) || []) {
      out.add(d);
      for (const dd of inScopeDescendants(d)) out.add(dd);
    }
    return out;
  }
  // Precompute descendant counts once (used by selection tie-breaking).
  const descendantCount = new Map(scope.map((id) => [id, inScopeDescendants(id).size]));

  /** @type {Object<string, Status>} */
  const status = {};
  /** @type {Object<string, true>} */
  const preResolved = {};
  for (const id of scope) {
    if ((initialMastery[id] || 'none') === 'mastered') {
      status[id] = 'PASSED'; // pre-resolved: already mastered, never re-asked, no write
      preResolved[id] = true;
    } else {
      status[id] = 'UNTESTED';
    }
  }

  return {
    version: 1,
    scope, // string[] — effective scope S
    initialMastery: { ...initialMastery },
    status, // {skillId: Status}
    preResolved, // {skillId: true} — subset of PASSED that was already mastered
    asked: {}, // {skillId: [questionId,...]} (all questions asked, mastery included)
    correct: {}, // {skillId: nonMasteryCorrectCount}
    log: [], // ordered [{skillId, questionId, correct}]
    writes: [], // accumulated [{id, level}] (upgrade-only, deduped)
    writeLevels: {}, // {skillId: highestLevelWrittenThisSession}
    blockedBy: {}, // {skillId: blockerSkillId}
    answeredCount: 0, // number of questions answered (cap counter)
    cap: DEFAULT_CAP,
    activeSkillId: null, // skill currently being probed
    queue: [], // remaining non-mastery questions for the active skill
    pendingMastery: null, // a mastery question to serve next, or null
    current: null, // {skillId, question, isMastery} served & awaiting an answer
    _internal: { rng: random, quizzes, skillById, scopeSet, fullAncestors, inScopeDescendants, descendantCount }
  };
}

/** Effective level = max(initial, any session write). @returns {Level} */
function effectiveLevel(session, id) {
  const init = /** @type {Level} */ (session.initialMastery[id] || 'none');
  const wr = /** @type {Level} */ (session.writeLevels[id] || 'none');
  return maxLevel(init, wr);
}

/**
 * Record an upgrade-only write. Writes only when `level` outranks the skill's
 * current effective level (never a downgrade, never a duplicate). Returns the
 * write object if one was made, else null.
 * @returns {{id: string, level: Level}|null}
 */
function recordWrite(session, id, level) {
  if (LEVEL_RANK[level] <= LEVEL_RANK[effectiveLevel(session, id)]) return null;
  session.writeLevels[id] = level;
  const w = { id, level };
  session.writes.push(w);
  return w;
}

/** Mark a skill's in-scope transitive descendants BLOCKED (only UNTESTED ones). */
function blockDescendants(session, skillId) {
  for (const d of session._internal.inScopeDescendants(skillId)) {
    if (session.status[d] === 'UNTESTED') {
      session.status[d] = 'BLOCKED';
      if (!(d in session.blockedBy)) session.blockedBy[d] = skillId;
    }
  }
}

/**
 * Candidate = UNTESTED skill in S whose in-scope prerequisites are all resolved
 * (PASSED or INFERRED). Out-of-scope prereqs are treated as satisfied.
 * @returns {string[]}
 */
function candidates(session) {
  const { skillById, scopeSet } = session._internal;
  const out = [];
  for (const id of session.scope) {
    if (session.status[id] !== 'UNTESTED') continue;
    const prereqs = skillById.get(id).prereqs || [];
    const ready = prereqs.every((p) => {
      if (!scopeSet.has(p)) return true; // out-of-scope → satisfied
      const st = session.status[p];
      return st === 'PASSED' || st === 'INFERRED';
    });
    if (ready) out.push(id);
  }
  return out;
}

/**
 * Pick the next skill to probe: maximize in-scope descendant count, then lower
 * stage, lower difficulty, title ascending.
 * @returns {string|null}
 */
function selectNextSkill(session) {
  const { skillById, descendantCount } = session._internal;
  const cands = candidates(session);
  if (cands.length === 0) return null;
  cands.sort((a, b) => {
    const dc = (descendantCount.get(b) || 0) - (descendantCount.get(a) || 0);
    if (dc) return dc;
    const sa = skillById.get(a);
    const sb = skillById.get(b);
    const st = (sa.stage ?? 0) - (sb.stage ?? 0);
    if (st) return st;
    const df = (sa.difficulty ?? 0) - (sb.difficulty ?? 0);
    if (df) return df;
    return (sa.title || a).localeCompare(sb.title || b);
  });
  return cands[0];
}

/**
 * Choose the 1–2 non-mastery questions to ask for a skill. Prefers two DISTINCT
 * `structure` tags; if the skill has only one non-mastery question, returns that
 * single question. Deterministic via the injected rng.
 * @returns {QuizQuestion[]}
 */
function pickNonMasteryQuestions(session, skillId) {
  const quiz = getQuiz(session._internal.quizzes, skillId);
  const nm = nonMasteryQuestions(quiz);
  if (nm.length <= 1) return nm.slice(); // single-question edge case
  const shuffled = shuffle(nm, session._internal.rng);
  const first = shuffled[0];
  const distinct = shuffled.find((q, i) => i > 0 && q.structure !== first.structure);
  return [first, distinct || shuffled[1]];
}

/**
 * After all non-mastery questions of the active skill are answered, resolve its
 * outcome and apply the resulting writes / inference / blocking. Returns the NEW
 * writes triggered.
 * @returns {{id: string, level: Level}[]}
 */
function resolveSkill(session, skillId) {
  const asked = (session.asked[skillId] || []).length; // only non-mastery so far
  const correctCount = session.correct[skillId] || 0;
  /** @type {{id: string, level: Level}[]} */
  const newWrites = [];

  if (correctCount === asked) {
    // PASSED — all asked correct.
    session.status[skillId] = 'PASSED';
    const w = recordWrite(session, skillId, 'proficient');
    if (w) newWrites.push(w);

    // Offer one mastery question next, if the skill has one unasked.
    const quiz = getQuiz(session._internal.quizzes, skillId);
    const askedSet = new Set(session.asked[skillId] || []);
    const masteryQs = quiz.questions.filter((q) => q.mastery && !askedSet.has(q.id));
    if (masteryQs.length > 0) {
      session.pendingMastery = shuffle(masteryQs, session._internal.rng)[0];
    }

    // Inference over the FULL DAG: any transitive prereq below proficient is
    // written up to proficient; in-scope UNTESTED ones become INFERRED.
    for (const a of session._internal.fullAncestors(skillId)) {
      const w2 = recordWrite(session, a, 'proficient');
      if (w2) {
        newWrites.push(w2);
        if (session._internal.scopeSet.has(a) && session.status[a] === 'UNTESTED') {
          session.status[a] = 'INFERRED';
        }
      }
    }
  } else if (correctCount === 0) {
    // FAILED — no write; block the downstream cone.
    session.status[skillId] = 'FAILED';
    blockDescendants(session, skillId);
  } else {
    // PARTIAL — exactly one of two correct.
    session.status[skillId] = 'PARTIAL';
    const w = recordWrite(session, skillId, 'learning');
    if (w) newWrites.push(w);
    blockDescendants(session, skillId);
  }
  return newWrites;
}

/**
 * Advance the session and get the next thing to do.
 *
 * A pending mastery follow-up is served first and is exempt from the cap (it may
 * cross the cap by exactly one). Otherwise, once the cap of answered questions is
 * reached, no further NON-mastery questions are served.
 *
 * @param {Object} session
 * @returns {{type:'question', skillId:string, question:QuizQuestion} | {type:'done', reason:'exhausted'|'cap'}}
 */
export function nextStep(session) {
  // A question already served and awaiting its answer — re-offer it verbatim.
  if (session.current) {
    return { type: 'question', skillId: session.current.skillId, question: session.current.question };
  }

  // Mastery follow-up (cap-exempt: only ever one extra question).
  if (session.pendingMastery) {
    const question = session.pendingMastery;
    session.pendingMastery = null;
    session.current = { skillId: session.activeSkillId, question, isMastery: true };
    return { type: 'question', skillId: session.activeSkillId, question };
  }

  // From here we would serve a non-mastery question — apply the cap.
  if (session.answeredCount >= session.cap) return { type: 'done', reason: 'cap' };

  // Continue the active skill's batch.
  if (session.activeSkillId && session.queue.length > 0) {
    const question = session.queue.shift();
    session.current = { skillId: session.activeSkillId, question, isMastery: false };
    return { type: 'question', skillId: session.activeSkillId, question };
  }

  // Select the next skill to probe.
  const next = selectNextSkill(session);
  if (!next) return { type: 'done', reason: 'exhausted' };
  session.activeSkillId = next;
  session.status[next] = 'ACTIVE';
  session.queue = pickNonMasteryQuestions(session, next);
  session.correct[next] = session.correct[next] || 0;
  session.asked[next] = session.asked[next] || [];
  const question = session.queue.shift();
  session.current = { skillId: next, question, isMastery: false };
  return { type: 'question', skillId: next, question };
}

/**
 * Answer the currently-served question.
 *
 * @param {Object} session
 * @param {number} optionIndex - index into the question's ORIGINAL option order
 *   (the caller maps its shuffled display back to this before calling).
 * @returns {{correct:boolean, correctIndex:number, writes:{id:string, level:Level}[]}}
 *   `writes` are the NEW store writes triggered by THIS answer; the caller applies
 *   them (e.g. via upgradeMastery) and records them for the results screen.
 */
export function answerQuestion(session, optionIndex) {
  if (!session.current) throw new Error('answerQuestion: no question is currently active');
  const { skillId, question, isMastery } = session.current;
  const correctIndex = question.options.findIndex((o) => o.correct === true);
  const correct = optionIndex === correctIndex;

  session.log.push({ skillId, questionId: question.id, correct });
  (session.asked[skillId] || (session.asked[skillId] = [])).push(question.id);
  session.answeredCount += 1;
  session.current = null;

  /** @type {{id:string, level:Level}[]} */
  let writes = [];

  if (isMastery) {
    // Mastery follow-up: correct upgrades to mastered; wrong does nothing.
    if (correct) {
      const w = recordWrite(session, skillId, 'mastered');
      if (w) writes.push(w);
    }
    // The passed skill is fully resolved; move on next nextStep().
  } else {
    if (correct) session.correct[skillId] = (session.correct[skillId] || 0) + 1;
    // If the skill's non-mastery batch is now exhausted, resolve the outcome.
    if (session.queue.length === 0) {
      writes = resolveSkill(session, skillId);
    }
  }

  return { correct, correctIndex, writes };
}

/**
 * Extend the answered-question cap (e.g. the learner chose to keep going).
 * @param {Object} session
 * @param {number} [extra=10]
 * @returns {number} the new cap
 */
export function extendCap(session, extra = 10) {
  session.cap += extra;
  return session.cap;
}

/**
 * Summarize the session for a results screen.
 *
 * @param {Object} session
 * @returns {{
 *   tested: {id:string, status:Status, level:Level, questionsAsked:number, correctCount:number}[],
 *   inferred: string[],
 *   blocked: {id:string, blockedBy:string}[],
 *   notAssessed: string[],
 *   writes: {id:string, level:Level}[]
 * }}
 *
 * Buckets:
 *  - tested: skills that had ≥1 question asked (PASSED via probing, PARTIAL,
 *    FAILED, or a mid-batch ACTIVE skill cut off by the cap).
 *  - inferred: skills proven proficient indirectly (INFERRED).
 *  - blocked: skills skipped because a prerequisite came back PARTIAL/FAILED.
 *  - notAssessed: in-scope skills that were never reached (still UNTESTED).
 *  - Pre-resolved already-mastered skills appear in NONE of these buckets: they
 *    were neither probed nor need any action.
 */
export function getResults(session) {
  const tested = [];
  const inferred = [];
  const blocked = [];
  const notAssessed = [];

  for (const id of session.scope) {
    const st = session.status[id];
    const askedCount = (session.asked[id] || []).length;
    if (askedCount > 0) {
      tested.push({
        id,
        status: st,
        level: effectiveLevel(session, id),
        questionsAsked: askedCount,
        correctCount: session.correct[id] || 0
      });
    } else if (st === 'INFERRED') {
      inferred.push(id);
    } else if (st === 'BLOCKED') {
      blocked.push({ id, blockedBy: session.blockedBy[id] });
    } else if (st === 'UNTESTED') {
      notAssessed.push(id);
    }
    // PASSED-with-no-questions == pre-resolved mastered → intentionally omitted.
  }

  return { tested, inferred, blocked, notAssessed, writes: session.writes.slice() };
}
