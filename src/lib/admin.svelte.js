// Dev-only authoring mode, toggled by `?admin` in the URL hash. Reads the
// reactive `route.query` from the router, so `isAdmin` tracks navigation
// automatically. No login — this only does anything against the dev server's
// /_admin write endpoint, which doesn't exist in production builds.
import { route } from './router.svelte.js';

export const adminState = {
  get isAdmin() {
    return 'admin' in route.query;
  }
};

// Save edited JSON back to disk via the dev-server endpoint. Returns true on
// success. The caller is responsible for updating in-memory state/cache.
async function writeAdmin(kind, skillId, body) {
  const res = await fetch(`/_admin/${kind}/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `save failed (${res.status})`);
  }
  return true;
}

export function saveContent(skillId, content) {
  return writeAdmin('content', skillId, content);
}

export function saveQuiz(skillId, quiz) {
  return writeAdmin('quizzes', skillId, quiz);
}
