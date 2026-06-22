// Lazily load per-skill teaching content (theory, atom sequence, practice tiers)
// from data/content/{skillId}.json. Files are optional — a skill
// without one falls back to the placeholder in SkillDetail. Vite resolves the glob
// to per-file dynamic imports, so only the viewed skill's content is fetched.
const modules = import.meta.glob('../../data/content/*.json');
const cache = new Map();

export async function loadSkillContent(id) {
  if (cache.has(id)) return cache.get(id);
  const loader = modules[`../../data/content/${id}.json`];
  const content = loader ? (await loader()).default : null;
  cache.set(id, content);
  return content;
}

// After an admin save, prime the cache with the freshly-written object so the
// view reflects edits immediately. The static glob import won't pick up disk
// writes without a full reload, so we update the in-memory copy directly.
export function setContentCache(id, content) {
  cache.set(id, content);
}

export function clearContentCache(id) {
  cache.delete(id);
}
