# Booklet Studio load performance

Booklets retain the complete-document loading screen. The selected project and
picker list load concurrently. `GET /__booklet/projects?summary=1` omits source
inventories; the existing unfiltered response is unchanged. The new
`GET /__booklet/projects/:id/open` returns `{project, bankSync, bankSyncError}`
from one project read. A sync-check failure remains visible without blocking the
project. Older server endpoints and isolated export fixtures remain supported.

The question bank loads when its tab or insertion controls are used. Reading the
bank manifest no longer writes a file. Content hashes invalidate the validated,
approved-only manifest after edits, deletion, status changes or bank transactions.
Project and bank save/conflict semantics are unchanged.

## Cache ownership and invalidation

Compiled diagrams use memory, IndexedDB, then a read-only local server cache before
falling back to the existing TikZ compiler. Cache keys bind prepared diagram
source to a dedicated diagram-runtime fingerprint, including preparation, SVG
calibration, cache code, bundled libraries/fonts and the dependency lockfile.
Catalog-derived diagram changes participate through the prepared source key.
Page measurements retain the broader renderer fingerprint. Checksums reject corrupt persisted SVGs;
bounded storage/network waits cannot hold up compilation indefinitely.

Only trusted warming/export tools publish compiled SVG entries under
`.booklet-work/render-cache/`. The browser cannot publish them. Cache generation
does not certify content fidelity, purposeful shading or solid visibility. Those
remain independent source-hashed and visual acceptance gates. Cache directories
are local, disposable evidence, not Git release assets.

Page measurements use a bounded memory/IndexedDB cache. Only `height` and
`capacity` are persisted; the paginator reconstructs pages, numbering and links
from the current project every time. Content, relevant arrangements and writing
space, section headings, edition/options, image contents, renderer and fonts
participate in validity. Unresolved remote/missing images disable persistent
measurement reuse. A failed font load stops measurement rather than saving
dimensions from a fallback font. Source inventories and review state are retained.

## Commands

```powershell
node scripts/booklet/warm-render-cache.mjs --base http://127.0.0.1:5173
node scripts/booklet/check-load-cache.mjs http://127.0.0.1:5173
node scripts/booklet/check-diagram-load-cache.mjs http://127.0.0.1:5173
node --test tests/booklet-load-cache.test.js tests/booklet-measurement.test.js tests/tikz-startup.test.js
node scripts/booklet/profile-studio-load.mjs --base http://127.0.0.1:5173
```

Warming defaults to every current project and all five editions. `--projects`
and `--editions` accept comma-separated lists. Successful ordinary PDF exports
also publish their compiled diagrams. `--review` on the warming tool adds actual
PDFs, Poppler page images, printed geometry and navigation checks.

For cache-bypass parity, run the warming tool again with `--measurements-off
--compare PATH/TO/report.json --out NEW_DIRECTORY`, without `--review`. This
compares complete page placement, rendered content and navigation without a
duplicate PDF export. Diagram cache parity is also exercised by the profiler's
empty-cache and prepared-cache browser contexts.

Profiling defaults to three repetitions across all four books: empty browser
cache without the server cache, empty browser cache with prepared diagrams,
reload, and switch away/back. HTTP caching is disabled consistently by API-write
interception; report these as diagram/measurement-cache timings, not HTTP-cache
benchmarks. Raw timing samples, phase information, compilations, cache hits,
page counts, errors and source hashes are saved under `.booklet-work/studio-load/`.
Changed source inputs invalidate a benchmark. Do not compare runs across ongoing
editing sessions or claim savings from single unrelated samples.

## Acceptance evidence

The implementation was validated in an isolated copy of the working tree to
avoid concurrent authoring edits and development-server restarts. Complete run
receipts, retries, review output and measured timings are retained locally under
`.booklet-work/studio-load/`. Existing solid-visibility review findings are not
waived by cache acceptance; no source diagrams are repaired by this change.

The settled acceptance set is Index Laws revision 206, Linear Relationships
revision 9, Non-Right-Angled Trigonometry revision 169 and Volume revision 200.
All 20 editions passed DOM layout, printed geometry and link-target checks.
Cached and bypassed measurement runs matched complete page-block placement,
rendered text and navigation hashes for every edition. Visual review covered
all pages in the five trigonometry editions, with full-size checks of dense
native diagrams and solutions; representative pages and neighbours were checked
in the other books. This is cache/layout acceptance, not a new transcription
or a waiver of existing source-review findings.

The settled all-edition warm/export/review phase took 638.165 seconds. Separate
measurement-bypass comparisons took 58.881 seconds (Index), 95.838 seconds
(Linear) and 54.747 seconds (trigonometry and Volume together); overlapping
phases must not be summed as elapsed wall time. Earlier development attempts
were retried after concurrent inputs changed and after fixing the verification
copy's omitted catalog data, font access and shared Vite cache. Those attempts
are retained as development evidence, excluded from the settled benchmarks.

Focused cache, measurement, TikZ startup, project/revision and bank-sync
regressions passed. The broad test run's 13 failures came from omitted catalog
data in the isolated copy; all affected groups passed after restoring that
copy's data. The production build passed in 4.94 seconds, retaining its existing
large-chunk advisory. Browser checks confirmed measurement reuse, changed-content
invalidation, no unsolicited bank-detail requests and no project/API writes.


## Settled benchmark medians (12 September 2026)

Three repetitions, default Questions and short answers, same frozen inputs and
local Chrome/Vite setup. Times include project opening, pagination and initial
preview settling. HTTP caching was consistently disabled.

| Booklet | Empty caches | Prepared server diagrams | Reload | Switch back |
|---|---:|---:|---:|---:|
| Index Laws | 10.6 s | 8.2 s | 2.6 s | 2.5 s |
| Linear Relationships | 229.3 s | 10.6 s | 3.6 s | 4.0 s |
| Non-Right-Angled Trigonometry | 112.0 s | 4.2 s | 1.4 s | 1.2 s |
| Volume | 99.2 s | 3.9 s | 1.0 s | 0.9 s |

All 48 measured runs passed. Prepared opening compiled zero diagrams; reloads
and returns performed zero new measurements. Reused measurement counts were
1,270 (Index), 718 (Linear), 398 (trigonometry) and 415 (Volume). No browser
errors, compiler resets, bank-detail opening requests or source/manifest changes
were recorded. The largest request list contained 586 entries, below the
20,000-entry timing buffer; request lists were not sliced. The benchmark phase
took 1641.107 seconds.

For this fixed local setup, subsequent regression targets are median prepared
opening at most 15 seconds and median reload/return at most 5 seconds, with
zero unchanged-diagram compilation and zero reopening measurements. These are
local regression targets, not production or cross-machine performance promises.
New inputs require new baselines.

The summary picker response was 893 bytes versus 4,588,585 bytes for the legacy
full response. The source-hashed shading audit passed all 1,629 figures. The
solid-visibility audit retained 82 existing review findings (plus 927 reviewed,
407 passing and 9,243 two-dimensional occurrences); these are not newly accepted
geometry, and this cache change does not waive their independent review.

Raw evidence: `.booklet-work/studio-load/settled-profile.json`,
`settled-review/report.json`, `parity-index/report.json`,
`parity-linear/report.json`, `parity-remaining/report.json`,
`shading-audit.json` and `solid-audit.json`.

The additional native-diagram browser regression passed pixel-identical fresh,
server-cached, corrupt-cache fallback and unavailable-cache fallback output,
including 60 mm and 100 mm resizing. Edited source compiled a different image.
Its final receipt is `diagram-cache-parity.json`; three earlier synthetic-fixture
timeouts used deferred inline-text TikZ in an offscreen surface, corrected to
the native diagram block used by this regression.

Concurrent cover/editor renderer changes arrived during the frozen benchmarks.
Their hashes intentionally invalidate the previously warmed renderer version;
run the warming command after those changes settle, or let successful exports
populate that version. The measurements above certify the recorded frozen
inputs, not those subsequent renderer edits. All 19 focused cache/startup/
measurement tests also passed against the subsequently updated working tree.

The subsequent renderer was then warmed successfully for all 20 editions
(`current-warm/report.json`, 508.467 seconds, renderer
`61fefe458d05f81f8b8ed8760739f9e1b9bd7562ed1471486346112912450035`). A separate 12-run prepared/reload/return smoke
check passed for all four current books with zero compilation and zero reopening
measurements (`current-cache-smoke.json`). Current-renderer diagram pixel parity
also passed (`current-diagram-parity.log`). These single smoke samples are not
substituted for the three-repetition medians above. Concurrent Volume content/
bank/layout changes were preserved; its new questions-edition hashes differ
from the frozen source, while the other 17 edition hashes still match. All 20
new warming outputs retained the expected page counts and passed DOM layout QA.

Final current-tree shading and strict solid-visibility audits both passed after
the concurrent source-review updates. The 82 review findings above describe the
frozen benchmark snapshot and are resolved in the later current-tree audit
receipts (`current-shading-audit.json`, `current-solid-audit.json`). Those source
repairs were concurrent work, not performed by the cache implementation.


## Startup follow-up (13 September 2026)

The current renderer had no prepared diagram cache when this investigation began.
A read-only Index Laws opening took 8.895 seconds, compiled four diagrams and
performed 1,270 measurements. The strict prepared-cache benchmark correctly
rejected that run because compilation occurred. This is one diagnostic sample,
not a replacement for the historical three-repetition medians above.

Diagram compilation now has its own version, independent of unrelated application
screens and booklet page-layout components. Page measurements still invalidate
against the full renderer, content, fonts, assets and settings. The explicit
runtime input list in `render-cache-server.mjs` has a dependency-coverage regression;
new runtime imports must remain covered. All bundled library files are retained
conservatively in the diagram fingerprint. A prepared-source edit still changes
that individual diagram's key. Old broad-version cache directories are preserved
locally and never relabelled as accepted under the new version.

The version endpoint adds `diagramVersion`; its existing `version` remains the
page renderer version. Trusted warming/export publication checks the diagram
version. Browser code checks its installed version independently for each cache.
This avoids reusing stale page dimensions when compilation alone remains valid.

The Vite development resolver also maps the host's filesystem imports of the
standalone editor to the same `/libs/maths-editor/` URLs used by the editor itself.
This removes the `/public/libs/...` warnings and duplicate module identities.
Node authoring imports and production bundling remain unchanged. The real-browser
cache check now opens the standalone editor and verifies shared document-model
identity and zero `/public/libs/` requests.

Validation and current warm/profile receipts are kept locally in
`.booklet-work/studio-startup-2026-09-13/`. This change concerns cache ownership and
module URLs; it does not change booklet content, layout algorithms or diagram
geometry, and is not new source-fidelity or geometry acceptance.

The next substantial first-opening improvement is reusable, source-hashed page
measurements prepared outside the user's browser: browser IndexedDB is empty on
a first visit, so Studio still measures the complete selected edition before
opening. Such a change needs independent stale-input and complete-pagination
parity checks. The complete-document loading behaviour remains in place.


### Current default-edition verification

All six current books were warmed for Questions and short answers (456 pages
checked in total). Warming took 530.309 seconds of wall time across two overlapping
workers. All navigation targets passed. Volume page 26 has a 0.395 mm shortfall
against the 3 mm footer-clearance target; the same finding remains with measurement
caching disabled. That bypass run matched complete page placement, rendered
content and navigation hashes. This finding is recorded, not accepted as a new
layout change or silently omitted from the checks.

The final three-repetition benchmark passed all 36 opening/reload runs, with zero
diagram compilation, zero new measurements on reload, zero browser errors and
zero /public/libs/ requests. Project and bank source hashes remained unchanged.
HTTP caching was disabled consistently by write-blocking interception. Prepared
opening uses an empty browser cache; reload reuses that browser's measurements.

| Booklet | Prepared opening median | Reload median |
|---|---:|---:|
| Angle Relationships | 8.6 s | 2.0 s |
| Index Laws | 6.9 s | 2.4 s |
| Linear Relationships | 10.6 s | 3.5 s |
| Non-Right-Angled Trigonometry | 4.2 s | 1.4 s |
| Probability | 3.9 s | 1.4 s |
| Volume | 3.9 s | 1.2 s |

These are local current-input measurements, not a claimed speedup against the
historical frozen inputs. Raw samples and phase timings are in `after.json` in
the local run directory. All 23 focused unit tests, the real-browser cache/module
check and fresh/cached/corrupt/unavailable diagram pixel/resize checks passed.
The settled production build passed with its existing large-chunk advisory;
repository storage checks passed. Native standalone-library edits trigger a full
reload so browser module caching cannot retain the old runtime under a new cache
version. Detailed phase coverage, retry reasons and unavailable timing/token
metrics are recorded in `receipt.json`.

## Load-time investigation (4 October 2026)

Report only: no performance code was changed. The library has grown from the
4–6 projects of the September baselines to 54 project files (257 MB on disk;
largest 28 MB, nine more at 7–10 MB). Samples below are single local readings on
`npm run dev` with a fresh browser profile, taken while other work was running
on the same machine. They show where the time goes; they are not medians.

| Step | Reading |
|---|---|
| `GET /__booklet/projects?summary=1` (the Studio project list) | 29.3 s for a 16.9 KB response |
| Inverse Functions, first open (no browser cache, diagram cache cold) | 42.2 s pagination: 39.8 s waiting for diagrams, 1.4 s rendering, 0.03 s layout; 325 measurements, 11 cache hits |
| Same content reopened under a new project id (diagrams cached, measurements cold) | 5.4 s pagination: 2.3 s diagrams, 1.9 s rendering; 336 measurements, 0 hits |

Findings, most costly first:

1. **The project list parses every project.** `readRecords`
   (`scripts/booklet/project-studio-server.mjs`) reads and `JSON.parse`s all 54
   files to return eleven small fields each; `summary=1` only trims the response.
   It runs on the Vite thread, so the `/open` request and module requests queue
   behind it, and it reruns after create, duplicate, archive and delete. This is
   the wait that has grown with the number of booklets.
2. **Cold diagrams dominate a cold open.** With compiled diagrams unavailable,
   95% of pagination was waiting for TikZ. Any change to the diagram input files
   or `public/libs` issues a new diagram version, after which every booklet
   recompiles in the browser until `warm-render-cache.mjs` is rerun.
3. **Measurements are discarded by any edit under `src/`, `data/` or
   `public/libs`**, and by a change of device pixel ratio (browser zoom, another monitor) or
   browser, because all are in the measurement key. During active development
   most opens re-measure the whole edition (about 5 s here; 400–1,300
   measurements for larger books).
4. **`/__booklet/render-cache/version` re-hashes those trees on every pagination
   run**, including after each edit. Its 5 s client timeout clears both caches
   for that run, which is likely while finding 1 holds the server thread.
5. **Layout itself is small.** Forced layout was 33–48 ms and keying 130–160 ms
   in these samples, so rewriting the measurement loop would save less than the
   code suggests; rendering each candidate page (1.4–1.9 s) is the larger part.
6. **Project payloads carry review evidence the editor does not render**
   (`sourceReview`, `workingSpaceEstimate`, `source`: over half of the largest
   file). It is parsed on the server, sent, cloned for the save baseline and
   included in measurement keys.
7. **The built site** is one 1.48 MB script (408 KB gzipped) with every view,
   Cytoscape, KaTeX and about 490 KB of taxonomy data loaded up front. It does not
   grow with question count; per-skill content is already fetched on demand.

Options, in suggested order. The first three cannot change rendering.

| Option | Addresses | Rendering risk |
|---|---|---|
| Keep a project summary index keyed by file size and modified time (in memory, or a sidecar written on save) | 1 | None |
| Memoise the renderer and diagram fingerprints on the server and invalidate them from the existing file watcher | 4 | None |
| Rewarm the diagram cache automatically when the diagram version changes | 2 | None |
| Read a project's cached measurements in one IndexedDB transaction | first-open storage reads | None |
| Narrow the measurement fingerprint to the page renderer's dependency closure and drop device pixel ratio | 3 | Needs stale-input and pagination-parity checks |
| Serve the editor a project without review evidence, loading it on demand | 6 | Needs save/merge parity checks |
| Show pages as they are paginated instead of after the whole edition | perceived wait | Changes the complete-document loading behaviour |
| Split the production bundle by route | 7 | None for booklets |

### Correction: dev-server file watching (4 October 2026)

Findings 1 and 4 above misattribute the wait. On a settled dev server the
summary project list takes 1.0–1.2 s and `/__booklet/render-cache/version`
0.04 s (0.21 s lean); three readings each. The 29.3 s list reading was queued
behind Vite's file watcher, which registered about 93,000 files individually
after each server start (`booklets/` 48,782, `.agywork/` 30,253, `.claude/`
7,685, `dist/` 2,870) and blocked all requests meanwhile. A server CPU profile
of the first 100 s showed 65 s in the watcher's per-file `fs.watch` call.

`vite.config.js` now also ignores `booklets/`, `.agywork/`, `.claude/` and
`dist/`. Nothing the app imports lives there and no plugin watches them, so
reload behaviour is unchanged. Single local readings on a fresh server: first
Studio load finished in about 70 s before and 1.6 s after; watcher time in the
profile fell from 65 s to 0.6 s. The server restarts whenever the Vite config
or an imported `scripts/` plugin file changes, so this was paid repeatedly.

The summary index and fingerprint memoisation options are not needed at the
current library size. Finding 2 (cold diagrams) stands: `.booklet-work/render-cache/`
holds 56 diagram versions since 12 September, so automatic rewarming is deferred
until the `_inputs.manifest` records show what changes the diagram version.

## Warm spacing edits

Merged from the question-spacing note of 15 September 2026. This covers the
response to a spacing change in a booklet that is already open. It is separate
from the opening and cache timings above; do not compare the two.

The warm-edit target is a median below 300 ms and a p95 below 500 ms, measured
from the control's change event through the updated preview's paint,
independently of autosave. A first uncached layout can take longer.

- Explicit whole-question spacing commits bypass the typing debounce. Composition, typing debounce and cancellation remain active.
- Warm measurements are read synchronously from memory. Misses are measured directly; opening and edition changes retain persistent-cache reads. Writes update memory immediately and persist in coalesced background transactions.
- Compact answer pagination ignores question-only spacing overrides, while retaining answer diagram-width and other relevant invalidation.
- Incremental continuation cannot reuse a partial page containing a changed question. Repeated unchanged answer runs retain their checkpoint metadata.
- Missing DOM measurements are retried after paint and rejected if still unavailable. They cannot become cached zero-height results.
- Every validation request still hashes renderer and asset bytes. Bounded parallel reads and request-local sharing reduce validation time without time-based or file-stat-based acceptance. File-stat hash caching was tried and rejected after a same-size, same-timestamp regression.
- Preview metrics include scheduling, validation, cache I/O, measurement, pagination, rendering, paint and cancelled work.

Run `node scripts/booklet/check-spacing-performance.mjs --project linear-relationships-v1 --verify` (and repeat with `non-right-angled-trigonometry-v1`). Use `--out` for a new local evidence directory and `--capture` for affected-page PDFs. Run `node scripts/booklet/check-spacing-editor.mjs` for live typing/composition, cancellation and failure handling. That note also records that the older smooth-editing script has an obsolete layout selector.

The measured before-and-after timings, the evidence folders and the export check from that change are in the [archived note](archive/booklet-spacing-performance.md).
