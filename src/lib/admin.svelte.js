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

// Capture both files together at load time. Keep this revision with the editor
// draft; fetching it only when saving would permit overwriting external edits.
export async function loadAdminSnapshot(skillId) {
  const res = await fetch(`/_admin/snapshot/${skillId}`, { cache: 'no-store' });
  const detail = await res.json();
  if (!res.ok) throw new Error(detail.error || `load failed (${res.status})`);
  return detail;
}

async function writeAdmin(kind, skillId, value, expected) {
  const res = await fetch(`/_admin/${kind}/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value, expected })
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `save failed (${res.status})`);
  }
  return res.json();
}

export function saveContent(skillId, content, expected) {
  return writeAdmin('content', skillId, content, expected);
}

export function saveQuiz(skillId, quiz, expected) {
  return writeAdmin('quizzes', skillId, quiz, expected);
}
