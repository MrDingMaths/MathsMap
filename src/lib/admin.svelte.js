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

// Save edited content back to disk via the dev-server endpoint. Returns true on
// success. The caller is responsible for updating in-memory state/cache.
export async function saveContent(skillId, content) {
  const res = await fetch(`/_admin/content/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `save failed (${res.status})`);
  }
  return true;
}
