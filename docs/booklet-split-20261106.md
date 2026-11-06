# Booklet split, 6 November 2026

On 6 November 2026, 49 master booklets were split into 98 (a few ~20-page booklets with a logical partner were merged separately; see the no-merge rule below).

## Naming and ids

- Titles use a number or letter suffix, for example "Indices 1: ..." and "Indices 2: ...", or "FDP 4A" and "FDP 4B" (9A/9B, 2A/2B and similar). A series number is not guaranteed to be contiguous across booklets.
- Part 1 keeps the original project id (`<id>-v1`). Part 2 is `<id minus -v1>-2-v1` (for example `rates-2-v1`). The 49 pairs are the files in `.booklet-work/split-merge-20261106/configs/*.json`.
- Block ids are unchanged and unique across the pair. Bank ownership follows blocks: `booklets/question-bank/links.json` owners moved from part 1 to part 2 for blocks that moved; `bankRef`, `blockId` and hashes are unchanged.
- Part 2 keeps the old section and topic ids (for example `inverse-functions-v1-exam-questions`). Do not rename them. Builders that create `<project id>-exam-questions` look for an existing `role: exam` section first (`regroup-exam-sections.mjs`); `export-mathsbase-exams.mjs` accepts `mapping.examSectionId`.
- Part 2 starts at revision 1 and records `source.partition.parentProjectId`, `parentRevision` and `parentHash`. The syllabus page is copied into both halves.

## Evidence and run folders

- Provenance: `booklets/provenance/<id>/` exists for the original id only. Each part 2 has `booklets/provenance/<id>-2-v1/PARENT.json` ({parentProjectId, splitDate, reason}); read the parent's folder for receipts such as `bank-import.json` (`check-project-bank.mjs` follows the pointer). Do not copy evidence.
- Both halves keep `source.runId` equal to the original run, so they share one run folder under `.booklet-work/full-imports/`. See [pruning run folders](booklet-storage.md#pruning-run-folders).
- The three-workers-per-booklet limit counts both halves of a pair together, because they share the run directory.

## Tool and receipts

The split tool, per-pair configs, link backups, analysis and the risk report are in `.booklet-work/split-merge-20261106/` (`split-master.mjs`, `apply-split.mjs`, `RISK-REPORT.md`). That folder is local and untracked.

## Tooling that names split ids

- `sweep/conventions.mjs` treats `-2-v1` siblings like their part 1 for the named blocks and exceptions.
- Defaults naming `rates-v1` in `first-pass/`, `paginate/` and `bench/`, and the default id list in `bench/studio/interactions.mjs`, are parameters or examples and exercise part 1 only; pass `--project` / `--projects` for part 2.

## No-merge rule

Do not merge booklets back together. Merge only booklets of about 20 pages that have a logical partner; anything larger stays split.

## Size caps

`booklets/storage-policy.json` caps for data-visualisation-1, linear-relationships, operations-fractions-decimals and solve-2-step-equations cover both halves with about 15% headroom. `repo:check` measures the Git index, so it reports the old unsplit sizes against the new caps until the split files are staged.

## Follow-up decisions (6 November 2026, user approved)

- **Exam closure is per pair.** `node pedagogy/exam-closure.mjs skeleton --project-id <part 1 id> --pair --out FILE` builds one record on the parent's screen, with both halves under `members`. `check` takes either half and reads the other from `booklets/projects`. Owners count across both Exam sections, and each half's revision and sha are checked separately. `exam-publish.mjs` rebases only the half it saved. Re-baselined pair records for the 38 masters are in `.booklet-work/end-goal-20261028/exam-closure-pairs-20261106/` (`summary.json`). 20 close on their pre-split closure rows. The other 18 had no closure record before the split either.
- **Audit v2 carries parent evidence over.** For a part 2 with no record of its own, `pedagogy/audit-v2.mjs` starts from the parent's record (checks are keyed by block id and content fingerprint) and accepts archetype-map snapshots saved under the parent id. Only blocks the split changed are re-checked. The rating anchor `p30-q2` and the progression exception `p46-practice`/`p47-*` now name the `-2-v1` booklets that hold them.
- **Old ids in other booklets.** Strings such as `sourceReview.origin/reuse.projectId`, `reusedFrom.projectId` and evidence paths in `concept-maths-x11-ch01`, `multistep-linear-equations-v1`, `iceem-*`, `wf1-algebraic-techniques-v2` and others still name part 1. They are provenance: no tool loads a project from them. Import reuse matches only inside the current run and falls back to an ordinary review. Evidence paths and `/booklet-assets/projects/<parent id>/` still resolve, and nothing prunes assets per project. `polish/challenge-split.mjs` treats a block whose `origin.projectId` is the parent as owned.
- **Syllabus page:** kept identical in both halves by decision.

## FDP 4 in three booklets (7 November 2026, user approved)

FDP 4A was 79 pages (student and short answers), so FDP 4 was re-split by operation. Pages are student + short answers:

| Booklet | Id | Topics | Pages |
| --- | --- | --- | --- |
| FDP 4A: Adding and Subtracting Fractions | `operations-fractions-decimals-v1` | 1–5 | 45 |
| FDP 4B: Multiplying and Dividing Fractions | `operations-fractions-decimals-2-v1` | 6–14 | 63 |
| FDP 4C: Operations with Decimals | `operations-fractions-decimals-3-v1` | 15–19 | 34 |

Challenge questions follow their primary skill: add/subtract/compare/simplify go to 4A; multiply/divide and fraction-of-quantity problems go to 4B; order of operations goes to 4C. Their topic ids are `…-topic-20`, `…-topic-20-part2` and `…-topic-20-part3`. 4C has `booklets/provenance/operations-fractions-decimals-3-v1/PARENT.json` and shares the parent's run folder. The tools are `.booklet-work/split-merge-20261106/stage-fdp-three.mjs` and `apply-fdp-three.mjs` (links backup `links-backup-fdp-three.json`). Compact contents now write "Challenge: X" for a "Challenge exercise: X" title (`src/lib/booklet-cover.js`).
