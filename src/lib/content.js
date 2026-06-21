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
