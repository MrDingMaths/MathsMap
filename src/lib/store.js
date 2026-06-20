// The single source of truth for student progress. Today it is backed by
// localStorage; swapping to a backend (e.g. Supabase) means changing only this
// file — the UI talks exclusively to getMastery / setMastery / subscribe.
import { meta, skills, topicsForCourse, skillsForTopic } from './data.js';

const KEY = 'mathsmap.progress.v1';
export const LEVELS = meta.masteryLevels; // ['none','learning','proficient','mastered']

// Shared presentation for each mastery level. `fill` (0–3) drives the segmented
// bars; colors live in CSS (`--m-*`), reached via an `m-{level}` class.
export const MASTERY = {
  none: { label: 'Not started', fill: 0, verb: 'Not started yet' },
  learning: { label: 'Learning', fill: 1, verb: "You're learning this skill" },
  proficient: { label: 'Proficient', fill: 2, verb: "You're proficient at this" },
  mastered: { label: 'Mastered', fill: 3, verb: "You've mastered this skill" }
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

let state = read();
const listeners = new Set();

function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  for (const fn of listeners) fn(state);
}

export function getMastery(skillId) {
  return state[skillId] || 'none';
}

export function setMastery(skillId, level) {
  if (!LEVELS.includes(level)) throw new Error(`invalid mastery level: ${level}`);
  if (level === 'none') delete state[skillId];
  else state[skillId] = level;
  persist();
}

export function allProgress() {
  return { ...state };
}

export function resetProgress() {
  state = {};
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
