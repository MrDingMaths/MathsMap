// Lazily load per-skill teaching content (theory, atom sequence, practice tiers)
// from public/content/{skillId}.json. Files are optional — a skill without one
// falls back to the placeholder in SkillDetail. Content is served as a static
// asset (public/) and fetched on demand, so only the viewed skill's content is
// requested.
const cache = new Map();

export async function loadSkillContent(id) {
  if (cache.has(id)) return cache.get(id);
  let res;
  try {
    res = await fetch(`${import.meta.env.BASE_URL}content/${id}.json`);
  } catch (err) {
    // Network failure (e.g. offline) — don't poison the cache with null, so a
    // later retry can succeed once connectivity returns.
    throw err;
  }
  let content = null;
  if (res.ok) {
    try {
      content = await res.json();
    } catch {
      content = null;
    }
  }
  cache.set(id, content);
  return content;
}

// After an admin save, prime the cache with the freshly-written object so the
// view reflects edits immediately. A fetch is cached in-memory only for the
// lifetime of the page, so we update the in-memory copy directly rather than
// re-fetching.
export function setContentCache(id, content) {
  cache.set(id, content);
}

export function clearContentCache(id) {
  cache.delete(id);
}
