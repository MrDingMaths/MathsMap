// Local history of finished diagnostic-quiz sessions, so a student can come
// back later and review what they got right/wrong. Backed by localStorage,
// same pattern as store.js. Newest entry first; capped so it can't grow
// unbounded.
const KEY = 'mathsmap.quizHistory.v1';
const MAX_ENTRIES = 20;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/**
 * Save a finished quiz session.
 * @param {Object} entry
 * @param {string|null} entry.scopeLabel
 * @param {string|null} entry.courseId
 * @param {string[]|null} entry.scopeSkillIds
 * @param {Object} entry.results - the getResults(session) summary
 * @param {Object[]} entry.answerLog - per-question review detail
 * @returns {string} the id assigned to the saved entry
 */
export function saveQuizResult(entry) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const list = read();
  list.unshift({ id, at: Date.now(), ...entry });
  write(list.slice(0, MAX_ENTRIES));
  return id;
}

export function getQuizHistory() {
  return read();
}

export function getQuizHistoryEntry(id) {
  return read().find((e) => e.id === id) ?? null;
}
