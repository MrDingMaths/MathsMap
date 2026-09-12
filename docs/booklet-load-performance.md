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
source to the loaded renderer fingerprint, including rendering code, catalog
data, bundled libraries and fonts. Checksums reject corrupt persisted SVGs;
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
