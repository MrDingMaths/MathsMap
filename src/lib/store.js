// The single source of truth for student progress. Today it is backed by
// localStorage; swapping to a backend (e.g. Supabase) means changing only this
// file — the UI talks exclusively to getMastery / setMastery / subscribe.
import { meta } from './data.js';

const KEY = 'mathsmap.progress.v1';
export const LEVELS = meta.masteryLevels; // ['none','learning','proficient','mastered']

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
