// Eagerly fetches public/content-manifest.json once on module load — a small
// generated index (see scripts/build-manifest.mjs, docs/content-schema.md) of
// which skills have teaching content / quizzes and how much, so views can
// check "does this skill have practice?" without probing per-skill files.
//
// Usage: either `await loadManifest()` before using the sync helpers (safest,
// guarantees the fetch has resolved), or call the sync helpers directly once
// you know the app has been up for a moment — they simply report "no" until
// the manifest has loaded, then reflect it from then on.

const empty = { generated: null, content: {}, quiz: {} };
let manifest = empty;

const manifestPromise = fetch(`${import.meta.env.BASE_URL}content-manifest.json`)
  .then((res) => (res.ok ? res.json() : empty))
  .catch(() => empty)
  .then((data) => {
    manifest = data && typeof data === 'object' ? data : empty;
    return manifest;
  });

// Resolves once the manifest has been fetched (or has failed/defaulted to
// empty). Safe to call repeatedly — always returns the same promise.
export function loadManifest() {
  return manifestPromise;
}

// [foundationCount, developmentCount, masteryCount] tier counts, or null if
// the skill has no content file (or the manifest hasn't loaded yet).
export function contentCounts(id) {
  return manifest.content[id] ?? null;
}

// [questionCount, masteryTaggedCount], or null if the skill has no quiz file
// (or the manifest hasn't loaded yet).
export function quizCounts(id) {
  return manifest.quiz[id] ?? null;
}

// True if the skill has a content file at all (theory-only skills count).
export function hasContent(id) {
  return id in manifest.content;
}

// True if the skill's content includes a practice tier (foundation cards
// present) — theory-only content reports [0, 0, 0] and does not count.
export function hasPractice(id) {
  const counts = manifest.content[id];
  return Array.isArray(counts) && counts[0] > 0;
}

// True if the skill has a quiz file with at least one question.
export function hasQuiz(id) {
  const counts = manifest.quiz[id];
  return Array.isArray(counts) && counts[0] > 0;
}

// Filters a list of skill ids down to those with a usable quiz — for building
// a pool to draw a random check-for-understanding from.
export function quizPool(skillIds) {
  return skillIds.filter((id) => hasQuiz(id));
}
