# Booklet storage and cleanup

Audit and implementation: 12 September 2026. The original audit and source reorganisation did not delete files. The implemented policy now archives verified recovery payloads before removing their loose copies. Measurements are logical file sizes, excluding directory links/junctions; the workspace can change while another Studio session saves.

## Where things belong

- `booklets/projects/`: the four current editable Studio booklets. Keep their IDs, local layouts and bank sync intact.
- `booklets/studio-sources/<topic>/`: original PDF/Word pairs for Studio, including Linear's student and teacher editions.
- `booklets/mathsmap-sources/<stage>/`: the source Markdown booklets and linked media used to author the MathsMap site.
- `booklets/question-bank/`, `booklets/module-bank/`, `booklets/provenance/`, `public/booklet-assets/`: reusable Studio content, durable reviews and referenced assets.
- `data/`, `public/content/`, `public/quizzes/`: taxonomy and generated content used by the MathsMap site.
- `.booklet-work/full-imports/`: local evidence used by source comparison. Keep active runs.
- `.booklet-work/<run>/` and `output/`: local processing, exports and QA. Classify these before cleanup; some directories contain unique source/recovery evidence.
- `booklets/.storage-archives/`: ignored, local compressed recovery objects, dated manifests and cleanup receipts. Keep the entire store together when backing up; it is not a release asset.

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

At the original audit, the largest automatic history belonged to the retired `linear-relationships-bank-working-v1` project: 346 snapshots, with roughly 3.14 GiB older than its latest 20. All 346 snapshots are now indexed in its retired-history archive.

These are the original measurements and review candidates, not a deletion manifest. Each applied cleanup now has its own dated, source-hashed manifest and receipt in the archive store. Exact current byte counts, per-project snapshot counts and further large directories are produced by the read-only command:

```text
node scripts/booklet/audit-storage.mjs --out .booklet-work/storage-audit.json
```

## Implemented retention policy

1. Retain the latest 20 automatic revisions for each active project, plus deliberate milestone checkpoints. Archive retired projects' histories separately.
2. Compress older snapshots into a dated archive outside the live project-history folder. Keep an index of project IDs, revisions and hashes. Verify extraction before deleting loose copies.
3. Retain a run's source evidence, decisions and final report. Remove reproducible intermediate renders and isolated test/staging payloads only after dependency and uniqueness checks.
4. Do not prune `booklets/question-bank/.revisions/` using the project-history rule: bank revisions can be pinned baselines for live consumers and sync conflict handling.
5. Keep originals and extracted media together. Use a verified external backup before moving archival material off this computer.

Studio autosaves the current document after 500 ms of inactivity, but recovery checkpoints now have a separate **five-minute cadence**. The first edit saves the previous booklet as a checkpoint; further saves within that window update the current file without creating whole-booklet backups. The first save at least five minutes after the last checkpoint captures the previous saved state again. Twenty small adjustments within one window therefore produce one checkpoint, while every completed autosave persists the latest position. The editor's individual Undo/Redo steps are unchanged. Intermediate autosaved states within a window are not separate disk backups.

The checkpoint clock is local under `.revisions/.checkpoints/`, survives server restarts, and commits in the same transaction as the checkpoint and live project. Missing/corrupt clock state or a clock rollback takes a fresh checkpoint. Revision numbers still advance on every save because they detect stale/concurrent edits; they no longer count backup files. Explicit bank-sync resolutions always checkpoint the previous booklet. Authoring tools can request a deliberate checkpoint with `saveBookletProject(project, {...options, checkpoint:true})`; marked milestone revisions also bypass the interval. Existing snapshots and archives are retained.

After a checkpoint transaction commits, retention keeps the latest 20 available checkpoints loose. Older checkpoints are compressed and retained. A failed or busy archive leaves remaining loose snapshots available and logs a warning; it does not report a successfully committed save as failed. A later checkpoint or maintenance sweep retries. Bank revision baselines are untouched and retain their separate sync/conflict requirements.

Deliberate milestones stay loose in addition to the latest 20. Before maintenance, list revision numbers in the local `booklets/projects/.revisions/milestones.json`, for example:

```json
{"linear-relationships-v1": [1, 8], "volume-v1": [208]}
```

Pins apply to existing snapshots; they do not create snapshots. Invalid configuration stops pruning. Retired projects are identified by the absence of their current project JSON and are fully archived only with the explicit `--retired` maintenance option. Direct file-maintenance tools can still create loose history: run the same sweep after that work.

## Maintenance and recovery

Checkpoint-cadence follow-up: 63 focused project/storage/bank/workflow tests pass, including 20 rapid saves producing one backup, persistent timing, milestone/explicit checkpoints, archive retention, stale-save rejection and transaction rollback. The production build passes. This changes storage only; current documents and editor Undo/Redo are not rewritten.

All maintenance commands preview by default. `--apply` writes archives and then removes only the verified individual loose files:

```text
npm run booklet:storage -- revisions --retired
npm run booklet:storage -- revisions --retired --apply
npm run booklet:storage -- archive --tree .booklet-work/recovery
npm run booklet:storage -- archive --tree .booklet-work/recovery --apply
```

The archive command accepts only the named recovery, legacy and staging candidates in `scripts/booklet/storage.mjs`. Before archiving a completed staging tree, check its publication/round-trip receipts, live references and running servers. It preserves original PDF/Word documents, Markdown, scripts, logs and named review/receipt/manifest/decision records in place. Every other selected payload, including unique older content, receives a recoverable archive copy. Tracked files are always excluded from this command. No blanket scratch cleanup runs automatically. Retired staging is recovery material; use a new run directory for future staging.

Objects are gzip files addressed by the SHA-256 of their original bytes. Identical payloads share one object across revisions, recovery and staging. Every object is read back from disk, fully extracted and checked for both size and SHA-256 before pruning begins. A durable dated manifest records original relative paths, hashes, sizes, modification times, project revision groups and retained evidence. Files that changed during archiving remain loose. Linked directories/junctions are never traversed; source and restore paths are constrained, and restore never overwrites existing files. The store's exclusive `maintenance.lock` prevents overlapping archive jobs. After an interrupted process, confirm its recorded PID is no longer running before removing that lock and retrying; do not remove archive objects or indexes.

Verify a complete manifest, or restore into a new review directory:

```text
npm run booklet:storage -- verify --manifest booklets/.storage-archives/manifests/NAME.json
npm run booklet:storage -- restore --manifest booklets/.storage-archives/manifests/NAME.json --out .booklet-work/restored-history
```

Add `--only projects/.revisions/PROJECT/REVISION.json` for a single entry from a revision archive. Other archives use workspace-relative paths; consult their manifest. Review recovered projects and apply current palette, shading, visibility and sync contracts before importing them into Studio. Recovery extraction itself does not modify a live project or bank.

Keep archive objects, manifests and receipts together. These archives provide local recovery, not protection against loss of the computer. No history rewrite or off-computer move is needed. Re-run the storage audit periodically; move archival material off this computer only after a verified external backup.

## Prevent future Git growth

`.gitignore` excludes automatic project history, legacy local archives, compressed recovery, render caches and run outputs. Current projects, bank records and pinned bank baselines, reusable tools, durable provenance and referenced assets remain versioned.

`npm run repo:check` checks actual Git index blobs (including staged content), rejecting local/generated paths, files over 10 MiB and a total tracked-file size over 350 MiB. `booklets/storage-policy.json` contains narrow 12/15 MiB allowances for the two existing Linear source Word documents. Review justified new source/content growth explicitly in that policy rather than raising limits to accommodate generated files. The initial index was 299,173,415 bytes (about 285 MiB); this budget leaves space for ordinary content growth.

The check runs in `.github/workflows/storage.yml`. Enable the included local pre-commit hook in each checkout with `git config core.hooksPath .githooks` (already enabled in this workspace). If a checkout has existing hooks, integrate the check into them. `.gitignore` alone cannot catch force-added generated files; the index check does. The guard does not prune bank revisions or rewrite Git history.

## Applied cleanup and verification

The pre-implementation checkpoint is `3eaa767d`. The fresh baseline was **18.67 GiB**; the post-cleanup audit was **7.71 GiB**, a **10.96 GiB** reduction. Across seven passes, **13,675 files / 12,531,276,242 bytes** of loose recovery payloads were archived into **745,998,999 bytes** of compressed objects, plus indexes and receipts. Identical bytes shared objects. Original audit figures above are historical; use the audit command for current sizes.

Completed scopes: older active-project revisions, all retired-project revisions, recovery payloads, legacy archives, both nominated Trig stages, and Volume's nominated staged/round-trip copies. Publication and sync receipts were checked; no live project/bank/module/content or app-source references to these cleanup trees were found. Staging payloads were archived in full, so unique versions were retained as well as duplicates. The isolated Studio verification copy and `dist/` were retained because several development servers were running and their usage could not be ruled out. Active imports, source media and other render/evidence runs were retained.

Every archived entry passed full extraction and SHA-256 verification before pruning. The largest entry from each of the seven manifests also passed restoration to disk and a second byte-hash check. Current tracked project/bank/module/provenance/source/asset files match the checkpoint; no booklet content, layout or rendering changed. All 61 focused storage/project/bank/workflow tests and the production build passed (the existing bundle-size warning remains). The post-cleanup retention preview has no remaining candidates. Local audit reports, per-pass measured durations, restore checks, execution retries and detailed receipts are recorded in `.booklet-work/storage-run-receipt.json`; archive manifests and receipts remain with the archive store.

## Keep the old MathsMap booklets

The MathsMap source collection is about **627 MiB**, of which its **250 Markdown files are only 33 MiB**; most of the remainder is their linked extracted media. They remain useful for tracing teaching methods, correcting generated questions and regenerating content. The surviving collection has already been through the older triage process; “old” does not mean “unneeded”. Keep it separate from Studio and retain it. Archive an individual source only after confirming it is superseded, preserving its provenance and a recoverable copy.

Deleting Markdown while retaining media would save little and lose context. Deleting media would break source diagrams. The much larger automatic-history and duplicated-work areas should be addressed first.
