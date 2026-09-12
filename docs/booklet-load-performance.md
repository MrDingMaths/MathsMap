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
