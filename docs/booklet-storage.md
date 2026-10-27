# Booklet storage and cleanup

Audit and implementation: 12 September 2026. The original audit and source reorganisation did not delete files. The implemented policy now archives verified recovery payloads before removing their loose copies. Measurements are logical file sizes, excluding directory links/junctions; the workspace can change while another Studio session saves.

## Where things belong

- `booklets/projects/`: current editable Studio booklets. Keep their IDs, local layouts and bank sync intact.
- `booklets/studio-sources/<stage>/<topic>/`: original PDF/Word pairs for Studio, including Linear's student and teacher editions.
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

### Pruning run folders

Every export keeps a frozen copy of the app (`runtime/`), a Vite cache and page rasters. They are regenerable and are not evidence, but they were about 45% of `.booklet-work/` by 8 October 2026. Remove them when an import is delivered or a feedback repair closes:

```text
npm run booklet:storage -- exports
npm run booklet:storage -- exports --apply
npm run booklet:storage -- exports --records --out .booklet-work/NAME/prune.json
```

Run it only when no import or feedback repair is in flight in any session. Check first that no `lean-import.mjs`, `lean-review.mjs` or export process is running. The command cannot tell a paused run from a working one: on 8 October 2026 a second pass removed sample payload from twelve imports that had started half an hour earlier. The command also lives in `scripts/booklet/`, so editing it while an import is running changes that import's export snapshot hash.

Without `--records` the command removes only regenerable payload: frozen app copies, `vite-cache/`, folders ending in `rasters`, `cache.json` in export folders, and leaked test temp folders older than 24 hours. The newest export of a run folder active in the last 48 hours is left whole so a paused import can still reuse it; its earlier exports are pruned.

`--records` also removes the process records of run folders idle for seven days or more: model call transcripts, intermediate booklet and bank copies, state snapshots, review renders, receipts and superseded exports. It keeps source evidence (`evidence/`, `lanes/`, `source/`, `media/`, `word/`, Word documents), run state (`manifest.json`, `config.json`, `review.json`, `workflow/`, `semantic-packets/`), final decisions (corrections, reviewed tables, visual findings), the newest export's PDFs and report, Markdown notes and lease files.

Neither mode removes a tracked file, a file or sub-folder that a live booklet, bank or module or a tracked `booklets/provenance/` record points to, or anything in `render-cache/`, `deliveries/`, `recovery/`, `python/`, `pdf-libs/` or `practice-imports/`. A campaign folder under `.agywork/content-campaign/` is one run: nothing in it is touched until the whole campaign has been idle for seven days, and its root files and `candidate.json` files are always kept. These files are deleted, not archived; `--out` saves the list.

Frozen copies contain junctions to the real `node_modules` and render cache. The command removes each link without entering it. Do not clear these trees with `rm -rf`, `Remove-Item -Recurse` or `git clean`.

Verify a complete manifest, or restore into a new review directory:

```text
npm run booklet:storage -- verify --manifest booklets/.storage-archives/manifests/NAME.json
npm run booklet:storage -- restore --manifest booklets/.storage-archives/manifests/NAME.json --out .booklet-work/restored-history
```

Add `--only projects/.revisions/PROJECT/REVISION.json` for a single entry from a revision archive. Other archives use workspace-relative paths; consult their manifest. Review recovered projects and apply current palette, shading, visibility and sync contracts before importing them into Studio. Recovery extraction itself does not modify a live project or bank.

Keep archive objects, manifests and receipts together. These archives provide local recovery, not protection against loss of the computer. No history rewrite or off-computer move is needed. Re-run the storage audit periodically; move archival material off this computer only after a verified external backup.

## Prevent future Git growth

On 27 October 2026 James explicitly authorised a total repository limit of
**3000 MiB (3,145,728,000 bytes)**, superseding the proposed 2229 MiB allowance
and the previous 2226 MiB limit. This permits later verified campaign
checkpoints within that limit without another budget request; it does not
authorise unrelated files or grant content acceptance. Individual-file limits,
their existing exceptions and generated-file exclusions remain unchanged.
The accompanying checkpoint adds only the verified revision-1 Y9 Chapter 3
and Chapter 10 masters (1,480,829 and 2,159,479 bytes); their exact delivery
hashes and local recovery snapshots are checked before staging.

The Stage 6 delivery checkpoint on 27 October 2026 raises the total from 2206
to 2226 MiB for eleven verified revision-1 live masters, adding 20,845,291 bytes
of editable content. The reviewed index before this note is 2,332,480,200 bytes.
Every master matches the retained delivery archive; no bank records, pilot
outputs, generated exports or automatic histories are added. Individual-file
limits and generated-file exclusions stay unchanged. This records historical
acceptance and delivery only: the 309 later-added planner selections remain
unperformed and are not granted acceptance by this checkpoint.

The final 27 October 2026 non-exemplar checkpoint raises the total from 2204 to
2206 MiB. The reviewed 68-file data batch adds 1,069,279 bytes: 796,899 bytes of
current editable booklet content and 272,380 bytes of synchronised bank records.
The index before this policy note contains 2,311,634,347 bytes. No generated
exports, caches, automatic revision histories or new assets are included. The
default individual-file limit, existing narrow exceptions and generated-file
exclusions remain unchanged. This storage allowance does not grant content
acceptance.

The later 27 October 2026 checkpoint raises the total from 2202 to 2204 MiB.
The reviewed index is 2,309,017,733 bytes after the verified Data, Estimating
Change, Arithmetic Sequences, Fundamental Theorem, Further Areas, Rates of Change
and Acute Trigonometry repairs and synchronised bank updates. This is current
editable content growth; generated artifacts and automatic histories remain
excluded, with the same individual-file and content-acceptance safeguards.

The 27 October 2026 non-exemplar repair checkpoint raises the tracked-file budget
from 2200 to 2202 MiB. The reviewed index contains 2,307,678,020 bytes, including
the verified editable Further Parabolas, Right-Angled Trigonometry and Working
with Functions 5 repairs and their synchronised question-bank records. The narrow
increase accommodates this current content; generated exports, run evidence and
automatic project histories remain excluded, and individual file limits and
content acceptance checks are unchanged.

The 24 October 2026 working-tree settlement raises the tracked-file budget from
2.1 GiB to 2200 MiB for 34 Stage 6 Advanced booklet projects, 23 new ICE-EM
chapter projects, Network Concepts and its original sources, referenced source
images, and saved booklet repairs with synchronised bank baselines and durable
review records. The Stage 6 Advanced group adds about 30 MiB of editable content
and source assets. Network Concepts.docx is an original 10,965,177-byte Word
source and receives a narrow 11 MiB file allowance. Other individual file limits
and generated-file exclusions remain unchanged. These allowances record storage
growth, not content acceptance.

The 18 October 2026 working-tree settlement raises the tracked-file budget to
1700 MiB for saved booklet convention/layout repairs, synchronised bank records,
pinned bank revision baselines and first-pass review records. Inspection of the
three newly oversized projects found growth in editable sections and saved layout
settings, rather than generated exports or automatic project histories. Narrow
11/14/12 MiB limits cover Data Visualisation 1, Linear Relationships and Operations
with Fractions and Decimals respectively; the default 10 MiB limit remains.
This allowance records storage growth only and does not grant content acceptance.

The 2 October 2026 working-tree settlement raises the tracked-file budget to
1100 MiB for 24 original Stage 4 Word/PDF sources (113,982,377 bytes), the current
Pythagoras project and pinned bank baselines, published theory/practice updates,
and durable content-campaign acceptance records. Operations with FDP.docx has a
narrow 15 MiB allowance for its 13,493,835-byte original; the default remains
10 MiB. Campaign progress snapshots and temporary renderer diagnostics stay
local. This storage allowance does not establish content or visual acceptance.

`.gitignore` excludes automatic project history, legacy local archives, compressed recovery, render caches and run outputs. Current projects, bank records and pinned bank baselines, reusable tools, durable provenance and referenced assets remain versioned.

`npm run repo:check` checks actual Git index blobs (including staged content), rejecting local/generated paths, files over 10 MiB and a total tracked-file size over the current policy budget. `booklets/storage-policy.json` contains narrow 12/15 MiB allowances for the two existing Linear source Word documents. The current 450 MiB total budget records the justified September 2026 growth from the Advanced 11, Data Visualisation 1 and Logarithms imports plus pinned question-bank baselines; it does not admit oversized original source files or generated evidence unless they receive an individual review. Review further justified source/content growth explicitly in that policy rather than raising limits to accommodate generated files. The initial index was 299,173,415 bytes (about 285 MiB); this budget leaves space for ordinary content growth.

The check runs in `.github/workflows/storage.yml`. Enable the included local pre-commit hook in each checkout with `git config core.hooksPath .githooks` (already enabled in this workspace). If a checkout has existing hooks, integrate the check into them. `.gitignore` alone cannot catch force-added generated files; the index check does. The guard does not prune bank revisions or rewrite Git history.

## Applied cleanup and verification

The pre-implementation checkpoint is `3eaa767d`. The fresh baseline was **18.67 GiB**; the post-cleanup audit was **7.71 GiB**, a **10.96 GiB** reduction. Across seven passes, **13,675 files / 12,531,276,242 bytes** of loose recovery payloads were archived into **745,998,999 bytes** of compressed objects, plus indexes and receipts. Identical bytes shared objects. Original audit figures above are historical; use the audit command for current sizes.

Completed scopes: older active-project revisions, all retired-project revisions, recovery payloads, legacy archives, both nominated Trig stages, and Volume's nominated staged/round-trip copies. Publication and sync receipts were checked; no live project/bank/module/content or app-source references to these cleanup trees were found. Staging payloads were archived in full, so unique versions were retained as well as duplicates. The isolated Studio verification copy and `dist/` were retained because several development servers were running and their usage could not be ruled out. Active imports, source media and other render/evidence runs were retained.

Every archived entry passed full extraction and SHA-256 verification before pruning. The largest entry from each of the seven manifests also passed restoration to disk and a second byte-hash check. Current tracked project/bank/module/provenance/source/asset files match the checkpoint; no booklet content, layout or rendering changed. All 61 focused storage/project/bank/workflow tests and the production build passed (the existing bundle-size warning remains). The post-cleanup retention preview has no remaining candidates. Local audit reports, per-pass measured durations, restore checks, execution retries and detailed receipts are recorded in `.booklet-work/storage-run-receipt.json`; archive manifests and receipts remain with the archive store.

## 25 September 2026 cleanup

Snapshot commit `c27b0d86` records the then-current project, bank, code, tests and
eligible sources before cleanup. Twelve oversized original source documents stay
at their referenced local paths with SHA-256 hashes in
`.booklet-work/repo-cleanup-20260925/source-hashes.json`; narrow ignore rules
exclude them from Git without moving the originals.

Completed Volume staging copies, old review renders, benchmark outputs and
scratch/export files were put in the verified local archive store before their
loose copies were removed. One current Linear provenance file remains at
`output/linear-complete/provenance.json`. Retired trial runners, detailed
protocols, applied one-off repairs and unreferenced assets were archived before
Git removal; the snapshot commit also retains them. The Logarithms feedback and
Data Visualisation teaching work trees remain loose because live projects still
refer to them. Current projects, banks, pinned bank revisions, original sources,
active full-import evidence and the archive store were not pruned. Archive
manifests and receipts are under `booklets/.storage-archives/`.

## Keep the old MathsMap booklets

The MathsMap source collection is about **627 MiB**, of which its **250 Markdown files are only 33 MiB**; most of the remainder is their linked extracted media. They remain useful for tracing teaching methods, correcting generated questions and regenerating content. The surviving collection has already been through the older triage process; “old” does not mean “unneeded”. Keep it separate from Studio and retain it. Archive an individual source only after confirming it is superseded, preserving its provenance and a recoverable copy.

Deleting Markdown while retaining media would save little and lose context. Deleting media would break source diagrams. The much larger automatic-history and duplicated-work areas should be addressed first.

## 28 September 2026 current-project growth

The tracked-file budget is 500 MiB to accommodate the current editable Data Analysis and Concept Maths Advanced 11 Chapter 2 projects (about 19.2 and 27.1 MiB), their referenced assets, and the existing project/bank updates. These are current content, not render caches or automatic project history. The two project-specific file limits in `booklets/storage-policy.json` preserve the default 10 MiB limit for other files. Original oversized Data Analysis sources and temporary Word owner files remain local. This storage allowance does not establish import or visual acceptance.

## Tracked content budget (4 October 2026)

The complete working-tree publication adds 17 editable booklet projects, original Studio PDF/Word pairs, referenced assets, synced bank records and durable campaign reviews/content. After staging all requested files, the repository check measured 1,230,409,116 bytes across 9,792 files. Increase the total tracked budget from 1.1 GiB to 1.2 GiB to accommodate this source/content growth with limited headroom. Individual file limits and generated-file exclusions remain unchanged; local caches, run logs and revision histories remain outside Git.


## 8 October 2026 clean-up

Baseline commit `8b00e8f6`. The workspace had grown from about 16 GiB after the 25 September clean-up to **103.0 GiB** in 2.4 million files, of which `.booklet-work/` was 89.5 GiB. It is now **45.7 GiB** in 0.77 million files, with `.booklet-work/` at 33.0 GiB. Other sessions added about 4 GiB during the work, so the amount removed was 61.6 GiB.

| Removed | Size | Files |
| --- | ---: | ---: |
| Frozen app copies (`runtime/`) | 27.1 GiB | 1,379,988 |
| Page rasters | 9.4 GiB | 219,964 |
| Vite caches | 1.8 GiB | 23,383 |
| Layout caches (`cache.json`) | 1.1 GiB | 329 |
| Process records in run folders idle 7+ days | 20.3 GiB | 116,070 |
| Leaked test temp folders | 0.02 GiB | 1,575 |
| The merged `lean` worktree | 1.8 GiB | |
| Stray folders, scratch, `dist/`, old exports and logs | 0.2 GiB | 3,877 |

Deletion was by the new `exports --records --apply` command in two passes, with 696 links unlinked rather than followed and no errors. `node_modules/` and the render cache were unchanged. The lists are in `.booklet-work/repo-cleanup-20261008/` (`prune-applied.json`, `prune-applied-2.json`, `extras-result.json`, `report.json`).

Tracked removals, all in history: 36 applied one-off repair scripts with 28 tests, a helper and 4 fixtures; the Diagnostic Questions pipeline (`scripts/dq`, its npm scripts, 5 tests, 2 fixtures and its guide); the temporary library-panel and Sonnet benchmark booklets; and one test case pinned to the 25 September Data Visualisation source hash.

Two things went wrong and are recorded here so they are not repeated.

- **Twenty cited files were deleted** (about 1 MB) because the first pass matched references too literally. They are not in the archive store. The command now handles all three forms and has a regression test.
  - `.booklet-work/volume-feedback/representatives-final/`: 14 page renders, cited as a folder with a trailing slash by Volume and Volume for 8MAT6.
  - `.booklet-work/stage4-algebra-20260930/`: `introduction-final-layout-remainders-proof.json`, `introduction-image-shading-rebound.json`, `introduction-nested-fraction-occurrences.json` and `simplifying-native-equation-rows-proof.json`, cited through the work-folder link inside `renderer-snapshot-final/`. Three are hash-bound artifacts of accepted review records in Introduction to Algebra and Simplifying Expressions; if the bounded workflow is run on those booklets again, those records will count as stale.
  - `.booklet-work/full-imports/data-analysis-v1-20260926-1047/representatives/mean-tower-v1-student-3.png` and `-4.png`, cited by Data Analysis relative to its run folder.
- **The second pass ran while twelve new imports were in flight.** It removed the frozen copies, rasters, Vite caches and layout caches of their earlier sample exports (about 1.8 GiB), keeping each run's newest export. A `CLEANUP-NOTE-20261008.md` in each affected run folder lists what went. The reference fix also edited `scripts/booklet/storage-prune.mjs` between 22:50 and 22:57 that evening, which changes the export snapshot hash for exports made before then.

Left as they were: the live content campaign's folders under `.agywork/` (1.2 GiB), records in run folders active within seven days (18 GiB, eligible as they go idle), `booklets/projects/.revisions/` at its 20-per-booklet policy, the archive store, and 88 MiB of stale Git temp objects that are under Git's two-week expiry.
