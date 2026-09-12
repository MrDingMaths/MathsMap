# Booklet storage and cleanup

Audit: 12 September 2026. No files were deleted by this audit or source reorganisation. Measurements are logical file sizes, excluding directory links/junctions; the workspace can change while another Studio session saves.

## Where things belong

- `booklets/projects/`: the four current editable Studio booklets. Keep their IDs, local layouts and bank sync intact.
- `booklets/studio-sources/<topic>/`: original PDF/Word pairs for Studio, including Linear's student and teacher editions.
- `booklets/mathsmap-sources/<stage>/`: the source Markdown booklets and linked media used to author the MathsMap site.
- `booklets/question-bank/`, `booklets/module-bank/`, `booklets/provenance/`, `public/booklet-assets/`: reusable Studio content, durable reviews and referenced assets.
- `data/`, `public/content/`, `public/quizzes/`: taxonomy and generated content used by the MathsMap site.
- `.booklet-work/full-imports/`: local evidence used by source comparison. Keep active runs.
- `.booklet-work/<run>/` and `output/`: local processing, exports and QA. Classify these before cleanup; some directories contain unique source/recovery evidence.

The source migration moved 17 groups containing 13,449 files (736,725,017 bytes). Every file passed a before/after SHA-256 comparison. The relocation registry is [sources.json](../booklets/sources.json). It maps historic paths to the current paths without rewriting historical evidence. Site generation resolves old batch paths through `scripts/booklet/source-paths.mjs`. Relative Markdown image links remain valid because their media directories moved with them. Studio project and source-comparison paths did not change.

## What takes the space

The audit measured about **17.8 GiB** across the workspace, including roughly **8.1 GiB in `booklets/`**. Git's object database is only about **0.22 GiB**. The four current project JSON files total about **26 MiB**. Deleting tracked source documents or rewriting Git history would miss the main cause.

| Area | Measured size | Proposed treatment |
| --- | ---: | --- |
| `booklets/projects/.revisions/` | 5.94 GiB | Compress older automatic snapshots, verify an archive restore, then prune under an agreed policy. Keeping the latest 20 per project leaves about 5.35 GiB of older uncompressed snapshots. |
| `.booklet-work/recovery/` | 3.52 GiB | Preserve useful recovery records. Consolidate into verified archives; do not blanket-delete. |
| `booklets/archives/` | 1.33 GiB | Legacy project history, outside the current workspace. Compress and retain useful recovery material. |
| `.booklet-work/trig-bank/stage` and `stage-final` | 0.78 GiB combined | Completed staging copies. Compare receipts and publication state, preserve unique evidence, then remove duplicated payloads. |
| `.booklet-work/volume-bank/staged` and `sync-roundtrip` | 0.50 GiB combined | Staging/test copies. Keep the receipts/reports and compare contents before removing copied payloads. |
| `.booklet-work/studio-load/verification` | 0.17 GiB excluding linked directories | Isolated app/test copy; remove after retaining its report and confirming it is no longer in use. |
| `dist/` | 0.05 GiB | Rebuildable output; remove when no preview is using it. |

The largest automatic history belongs to the retired `linear-relationships-bank-working-v1` project: 346 snapshots, with roughly 3.14 GiB older than its latest 20. Keeping this history as loose full JSON copies is expensive. An archive would retain recovery value much more economically; compression savings have not yet been measured.

These rows are review candidates, not a certified deletion manifest. No compression, pruning or deletion has been performed. Exact current byte counts, per-project snapshot counts and further large directories are produced by the read-only command:

```text
node scripts/booklet/audit-storage.mjs --out .booklet-work/storage-audit.json
```

## Retention proposal

1. Retain the latest 20 automatic revisions for each active project, plus deliberate milestone checkpoints. Archive retired projects' histories separately.
2. Compress older snapshots into a dated archive outside the live project-history folder. Keep an index of project IDs, revisions and hashes. Verify extraction before deleting loose copies.
3. Retain a run's source evidence, decisions and final report. Remove reproducible intermediate renders and isolated test/staging payloads only after dependency and uniqueness checks.
4. Do not prune `booklets/question-bank/.revisions/` using the project-history rule: bank revisions can be pinned baselines for live consumers and sync conflict handling.
5. Keep originals and extracted media together. Use a verified external backup before moving archival material off this computer.

This is a proposed retention policy, not an automatic behaviour change. Studio currently continues recording its normal revision history.

## Keep the old MathsMap booklets

The MathsMap source collection is about **627 MiB**, of which its **250 Markdown files are only 33 MiB**; most of the remainder is their linked extracted media. They remain useful for tracing teaching methods, correcting generated questions and regenerating content. The surviving collection has already been through the older triage process; “old” does not mean “unneeded”. Keep it separate from Studio and retain it. Archive an individual source only after confirming it is superseded, preserving its provenance and a recoverable copy.

Deleting Markdown while retaining media would save little and lose context. Deleting media would break source diagrams. The much larger automatic-history and duplicated-work areas should be addressed first.
