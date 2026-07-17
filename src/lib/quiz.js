// Lazily load per-skill quiz content (multiple-choice check-for-understanding)
// from public/quizzes/{skillId}.json. Mirrors src/lib/content.js: files are
// optional, fetched on demand, and cached in-memory for the page's lifetime.
const cache = new Map();

export async function loadSkillQuiz(id) {
  if (cache.has(id)) return cache.get(id);
  const res = await fetch(`${import.meta.env.BASE_URL}quizzes/${id}.json`);
  let quiz = null;
  if (res.ok) {
    try {
      quiz = await res.json();
    } catch {
      quiz = null;
    }
  }
  cache.set(id, quiz);
  return quiz;
}

// After an admin save, prime the cache with the freshly-written object so the
// view reflects edits immediately.
export function setQuizCache(id, quiz) {
  cache.set(id, quiz);
}

export function clearQuizCache(id) {
  cache.delete(id);
}
