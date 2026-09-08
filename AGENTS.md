# MathsMap working conventions

For booklet generation and solution editing, read [the worked-solution contract](docs/booklet-worked-solution-style.md). Use MathsDatabase notation and concise student-facing voice, and use the methods taught in the booklet's worked examples, Key Ideas and scaffolds. Obtain missing teaching context or flag it for review; do not silently substitute a different method.

The accepted 93-page Linear Relationships booklet is `booklets/projects/linear-relationships-complete-v1.json`. Preserve its questions and layout unless the user requests changes. Bank synchronisation is explicit: preserve classifications and mappings, stable bank IDs, and existing projects' pinned snapshots. `scripts/booklet/sync-linear-bank.mjs` prepares and verifies a candidate before `--apply`.

Keep application code, tests, reusable authoring tools, current booklet/bank content and referenced assets in Git. Local render caches, extracted evidence, run logs and automatic project revision histories are not release files. Preserve original source documents and useful recovery/evidence records locally when cleaning temporary renders.
