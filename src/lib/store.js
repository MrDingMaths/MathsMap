// The single source of truth for student progress. Today it is backed by
// localStorage; swapping to a backend (e.g. Supabase) means changing only this
// file — the UI talks exclusively to getMastery / setMastery / subscribe.
import { meta, skills, topicsForCourse, skillsForTopic } from './data.js';

const KEY_V1 = 'mathsmap.progress.v1';
const KEY = 'mathsmap.progress.v2';
export const LEVELS = meta.masteryLevels; // ['none','learning','proficient','mastered']

// Numeric rank for each level, in the order LEVELS declares them. Used to
// compare levels (e.g. "is this an upgrade?") without string juggling.
const LEVEL_RANK = Object.fromEntries(LEVELS.map((l, i) => [l, i]));

// Shared presentation for each mastery level. `fill` (0–3) drives the segmented
// bars; colors live in CSS (`--m-*`), reached via an `m-{level}` class.
export const MASTERY = {
  none: { label: 'Not started', fill: 0, verb: 'Not started yet' },
  learning: { label: 'Learning', fill: 1, verb: "You're learning this skill" },
  proficient: { label: 'Proficient', fill: 2, verb: "You're proficient at this" },
  mastered: { label: 'Mastered', fill: 3, verb: "You've mastered this skill" }
};

// v2 record shape: { level: 'learning'|'proficient'|'mastered', source: 'manual'|'quiz', at: <epoch ms> }
// A skill with no entry is implicitly level 'none'.

function readRaw(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function read() {
  const v2 = readRaw(KEY);
  if (v2) return v2;

  // No v2 yet — migrate from v1 if present, so existing progress isn't lost.
  const v1 = readRaw(KEY_V1);
  if (v1) {
    const migrated = {};
    const now = Date.now();
    for (const [skillId, level] of Object.entries(v1)) {
      migrated[skillId] = { level, source: 'manual', at: now };
    }
    // Persist the migrated v2 copy, but deliberately leave v1 in place
    // (rollback safety) — it is simply never read again after this.
    localStorage.setItem(KEY, JSON.stringify(migrated));
    return migrated;
  }

  return {};
}

let state = read();
const listeners = new Set();

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  for (const fn of listeners) fn(state);
}

// Back-compat: returns the level string ('none' if absent), same as v1.
export function getMastery(skillId) {
  return state[skillId]?.level || 'none';
}

/**
 * Full v2 record for a skill, or null if there is none.
 * Shape: { level, source: 'manual'|'quiz', at: <epoch ms> }
 * @param {string} skillId
 * @returns {{level: string, source: string, at: number} | null}
 */
export function getMasteryInfo(skillId) {
  return state[skillId] ?? null;
}

// Manual set from the UI. Keeps existing semantics, including downgrades —
// this is a direct, user-driven override, unlike upgradeMastery.
export function setMastery(skillId, level) {
  if (!LEVELS.includes(level)) throw new Error(`invalid mastery level: ${level}`);
  if (level === 'none') delete state[skillId];
  else state[skillId] = { level, source: 'manual', at: Date.now() };
  persist();
}

/**
 * Upgrade-only write, intended for automated sources (e.g. quiz results).
 * Only writes when `level` outranks the skill's current level; a downgrade
 * or equal-rank write is a no-op. Record shape: { level, source, at }.
 * @param {string} skillId
 * @param {string} level - target level, must be one of LEVELS
 * @param {string} [source='quiz'] - provenance tag stored on the record
 * @returns {boolean} true if the record was written, false otherwise
 */
export function upgradeMastery(skillId, level, source = 'quiz') {
  if (!LEVELS.includes(level)) throw new Error(`invalid mastery level: ${level}`);
  const current = getMastery(skillId);
  if (LEVEL_RANK[level] <= LEVEL_RANK[current]) return false;
  state[skillId] = { level, source, at: Date.now() };
  persist();
  return true;
}

export function allProgress() {
  return { ...state };
}

export function resetProgress() {
  state = {};
  localStorage.removeItem(KEY_V1);
  persist();
}

// Minimal subscription so Svelte components can react to changes.
export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export const isMastered = (skillId) => getMastery(skillId) === 'mastered';

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

// Aggregate mastery over an explicit list of skills.
// "inProgress" folds the two middle levels (learning + proficient).
function statsFor(list) {
  let mastered = 0;
  let proficient = 0;
  let learning = 0;
  for (const s of list) {
    const m = getMastery(s.id);
    if (m === 'mastered') mastered++;
    else if (m === 'proficient') proficient++;
    else if (m === 'learning') learning++;
  }
  const total = list.length;
  const inProgress = learning + proficient;
  const none = total - mastered - inProgress;
  return {
    total,
    mastered,
    proficient,
    learning,
    none,
    inProgress,
    masteredPct: pct(mastered, total),
    proficientPct: pct(proficient, total),
    learningPct: pct(learning, total),
    inProgressPct: pct(inProgress, total),
    fullyMastered: total > 0 && mastered === total
  };
}

// Mastery stats for one topic (optionally scoped to a course).
export function topicStats(topicId, courseId = null) {
  const list = skillsForTopic(topicId, courseId).flatMap((g) => g.skills);
  return statsFor(list);
}

// Mastery stats for a whole course, plus topic/skill counts.
export function courseStats(courseId) {
  const list = skills.filter((s) => (s.courses || []).includes(courseId));
  return {
    ...statsFor(list),
    topicCount: topicsForCourse(courseId).length,
    skillCount: list.length
  };
}
