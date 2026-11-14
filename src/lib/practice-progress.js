// Self-marked practice on the skill page ("Got it" / "Not yet" after checking
// a solution), saved per browser. The level rule lives in practice-level.js and
// never goes past Proficient; writes go through the store's upgrade-only
// upgradeMastery, so practice never lowers a level a quiz has set.

import { upgradeMastery } from './store.js';
import { practiceLevel } from './practice-level.js';

export { practiceLevel, practiceSummary, GOT_IT_FOR_PROFICIENT } from './practice-level.js';

const KEY = 'mathsmap.practice.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; }
}
let marks = read();
const listeners = new Set();

export function getPracticeMarks(skillId) {
  return { ...(marks[skillId] ?? {}) };
}

export function markPractice(skillId, key, mark, options = {}) {
  if (mark !== 'got' && mark !== 'not') throw new Error(`invalid practice mark: ${mark}`);
  marks = { ...marks, [skillId]: { ...(marks[skillId] ?? {}), [key]: mark } };
  try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch { /* private mode: keep in memory */ }
  const level = practiceLevel(marks[skillId], options);
  if (level !== 'none') upgradeMastery(skillId, level, 'practice');
  for (const fn of listeners) fn();
}

export function subscribePractice(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
