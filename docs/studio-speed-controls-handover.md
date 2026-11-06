# Booklet Studio speed and controls: handover (28 October 2026)

Remaining work from the "Booklet Studio: speed and controls redesign" plan. Work
on it in the order below. Read [the load performance doc](booklet-load-performance.md#speed-pass-28-october-2026)
and [the arrangement controls doc](booklet-arrangement-controls.md#layout-panel-controls-28-october-2026)
first; they describe what already shipped.

## Already done (commits on `master`, not pushed)

| Commit | Contents |
|---|---|
| `a0e6c5ba` | Stale render-version fix (`data/` invalidation, shared memo), per-session cache validation, in-memory reuse when validation fails, project-list stat cache, bank-sync link index, bulk bank records, undo keeps identity, narrower diagram fingerprint (`diagram-cache-client.js`), TikZ IndexedDB cap 10,000, `bench/studio/interactions.mjs`, `scripts/booklet/warm-diagrams.mjs` |
| `dcac177a` | PATCH saves, remote compression, normalised bank records and cached picker rows, bank warm on Studio start, shared overflow observer, renderMath LRU, canvas observer once per canvas, rAF-throttled visible pages, shared measurement cache between previews, **Fit** (`booklet-fit.js`), **Diagrams in question** (`booklet-diagram-size.js`), diagram-width store fixes |
| `ed61a292` | Table format group (`booklet-table-style.js`), palette swatches, Spacing → Layout, Ctrl+K entries, duplicate Part layout and arrangement Tables tab removed |
| `278fa2b6` | Remote compression stalled piped static files (maths libraries); fixed by forwarding `drain` |

## Done in the follow-up session (28 October 2026, later; not pushed)

| Commit | Contents |
|---|---|
| `76529156` | Diagram-as-code fixes. Compare source closes the edit session and the editor only relocates into a visible pane. Document diagrams redraw whenever their HTML re-renders. A table-cell `[tikz]` paragraph is a selectable, resizable diagram (handle, Diagram width field, Diagrams in question, TikZ dialog), with its width kept in the inline width comment. The inline editor draws these diagrams beside their hidden source and has an "Edit code" button. Check script: `.booklet-work/checks/tikz-cells.mjs` |
| `ef337457` | **C3** hashed page keys. Reload is under 4 s on every benchmarked book. **C5**: the heap fell from 1.5–3.3 GB to 156–392 MB because the key strings were the bulk of it. |
| `cdd8c7ec` | **C4** early pages: pages 1–3 show at about 2–3 s on Linear. Combined editions paginate questions first. |

The C3 and C4 commits were checked with `warm-render-cache.mjs --compare .booklet-work/studio-load/c3-off/report.json`, a `--measurements-off` baseline for Index Laws and Linear; all five editions match. Reuse that baseline for C2.

**C2 batch-accept was tried and dropped.** It is described in section 1 below. It passed the five-edition gate but did not reduce measurements: Linear 607 → 616, ch02 2,377 → 2,591. Pages need about 5–6 measurements each, and most of these are binary searches for question split points, not whole-unit additions. A failed two-unit batch costs as much as a successful one saves. Fresh opens are still 14–24 s, mostly measurement. The next lever is the split searches. For example, start the binary search from the previous fragment's boundary, or cache fragment signatures by source block and group range. Still open: C5's `annotationMath` cache.

Table-diagram controls (branch `c2-batch-pagination`, commit `549cd9fe`, not yet on master): a first click selects the diagram instead of opening the cell editor. The resize handle shows on hover in the word-processor workspace. Space above/below fields set the diagram paragraph's spacing. The worktree server needs `vite.c2.config.js`, which allows the junctioned `node_modules`, and a restart after each edit, because Vite does not watch `.claude/` paths. Fragment signatures are still rebuilt on every trial, because each fragment is a new object. Sections 2–5 have not been started.

## Branch `controls-d6` (merged into master 29 October 2026 at `de292bd3`; not pushed)

`549cd9fe` (table-diagram controls) was already contained in this branch; cherry-picking it changed nothing. Tests that fail only in the worktree are missing ignored source media (`booklets/mathsmap-sources/.../media`), not code faults.

| Commit | Contents |
|---|---|
| `d0684f7a` | **D-1** MathLive focus-tracker guard (`document-content.js`) |
| `443bae4b` | **D-2** steps 1–2: structural edits copy only changed sections; one-walk content index. Steps 3–5 (dev freeze, B4, B6, A2) are still open |
| `dabe182f` | **D-6** page-count preview before Apply in Diagrams in question, Fit "Needs about N mm more", "Fit whole exercise" goal, shared `booklet-probe-pagination.js` |
| `78744276` | **F4** Layout inspector follows the selection: levels Question › Part › Table › Cell, each with collapsible groups remembered in `localStorage` (`BookletInspectorLevel`/`BookletInspectorGroup`). `paginate/optimise.mjs` opens the Page group |
| `9017287f` | **F1** equation tools as a strip under the toolbar while an equation is active, one Whole equation/Selection colour toggle with swatches (`math-editing.mjs`); covered native table fields and Annotations (JSON) under More… (`document-editor.js`). Print unchanged on Index Laws (pages and bytes) |
| `f2a62aba` | Diagrams in question: **Minimum height (mm)**; diagrams held back by their column are marked "Limited by its column" |
| `adb5b136` | **D-6 step 1** trial layouts start from the newest layout of the same edition; Fit and the optimiser build candidates from the live project (frozen-input tests). One Fit trial on Linear 1.39 → 0.79 s; Fit shortfall 5.5 → 5.1 s (Linear), 3.6 → 2.2 s (Angle Relationships). Fit whole exercise and the diagram preview are unchanged: their trials change the exercise itself, so measurements dominate |

| `1bd59035` | **D-3** question splits predicted from part positions (`measurePartBottoms`), confirmed by two trials; a later page of a split question first tries the whole remainder. Identical output in all 20 editions, but measurements fell only 21,026 → 20,942: these books rarely split a question. The handover's premise (split searches dominate) does not hold for them |
| `478287bb` | Worked answers look ahead: batches of fragments are measured and binary-searched instead of re-measuring the page per fragment. Worked editions: Index Laws 1,119 → 472 measurements (38 → 20 s), Operations FDP 1,349 → 846 (65 → 34 s); identical output in all eight worked/with-worked editions |
| `ea0a63dd` | Short answers look ahead the same way per column. Short: Index Laws 495 → 135 (17 → 9 s), Operations FDP 647 → 261 (41 → 17 s), ch02 1,331 → 773 (115 → 55 s); with-short ch02 537 → 294 s; identical output in all eight short/with-short editions |
| `522bbb78` | **D-5** the bank picker lists `GET /__booklet/bank/index` (3.8 MB, about 1 MB compressed; while a bank write holds the lock, the last index is served after 300 ms) and fetches full questions with `/__booklet/bank/records?ids=` (40 per request, session cache) only for the previewed and inserted question. Picker open on Angle Sums 2.8 → 0.9 s, heap 159 → 106 MB; inserted blocks match the full-record snapshot (`.booklet-work/checks/bank-index-insert.mjs` in the worktree). Not done: the builder's paginated list (D-5 step 4); outline insert, promotion and the builder still load full records |

D-3 and look-ahead gate: `warm-render-cache.mjs --measurements-off --compare` against a baseline of this branch before D-3 (`d3-before-all.json`, made in the session scratchpad; regenerate from `adb5b136` if needed) for Index Laws, Linear, Operations FDP and ch02. Run ch02's combined editions in their own invocation: late in a long run they can exceed the script's 10-minute readiness limit. Question pages already average 3–5 measurements per page, so a look-ahead there is unlikely to pay (as C2 found).

Checks: `.booklet-work/checks/controls-d6.mjs` (`--project`, `--only`, `--metrics` records each preview's pagination time, measurements and reused pages), `equation-row.mjs`, `print-hash.mjs` (compare pages and bytes; the hash varies per run). Pre-existing check failures are listed in the memory note `studio-check-baselines`.

## Measurements before the follow-up session (one headless run each, after warming)

| Book | Fresh open | Reload | Edit median / p95 | Undo | Bank picker | Heap |
|---|---|---|---|---|---|---|
| Angle Sums | 1.5 s | 1.0 s | 74 / 146 ms | 145 ms | 2.1 s | 229 MB |
| Index Laws | 4.4 s | 1.6 s | 225 / 641 ms | 152 ms | 2.0 s | 405 MB |
| Operations FDP | 18.0 s | 4.4 s | 383 / 1,490 ms | 355 ms | 2.2 s | 1.8 GB |
| Linear | 17.5 s | 4.3 s | 273 / 636 ms | 238 ms | 2.1 s | 1.5 GB |
| Angle Relationships | 12.9 s | 3.4 s | 228 / 272 ms | 319 ms | 2.2 s | 774 MB |
| concept-adv11-ch02 | 28.5 s | 8.1 s | 147 / 454 ms | 200 ms | 2.1 s | 3.3 GB |

Targets still missed: reload ≤4 s on large books (Linear, Operations, ch02),
edit p95 <500 ms (first edit after opening a large book), bank picker <2 s,
Fit preview <1 s on large books (about 4 s per probe on Linear), and memory on
ch02. Fresh opens compile no diagrams for the 18 warmed books only.

Run `node bench/studio/interactions.mjs --label <name>` (add `--projects a,b`,
`--edits N`, `--no-bank`) before and after each change; reports go to
`.booklet-work/studio-bench/`. Writes stay in memory.

## Remaining tasks

### 1. Measurement and pagination (C2–C4, C5) — largest remaining speed win

- **C2 batch-accept pagination** in `paginateFlowLayout` (`src/lib/booklet-pagination.js`): for runs of simple units (no page break, keep-with-next chain, continuation or fragments), measure `[...current, ...next m]` and accept all m when it fits; otherwise fall back to the existing one-unit `add()`. Record checkpoints per unit. Must pass `node scripts/booklet/warm-render-cache.mjs --projects <set> --measurements-off --compare <report> --out <dir>` with identical page placement, text and navigation hashes in all five editions.
- **C3 cheaper keys**: hash each block signature once per run (WeakMap) and build page keys from block hashes; read an opening's IndexedDB entries in one transaction (`src/lib/booklet-cache-store.js`, `measurementKeyFor` in `booklet-measurement.js`).
- **C4 progressive first paint** (user approved): show pages 1–3 as soon as paginated, keep paginating behind them with the progress line, and hold selection/editing until ready. Today `FlowBookletPreview.svelte` waits for the whole document (`prepareInitialPreview`). Update `docs/booklet-load-performance.md`.
- **C5 memory**: take a heap snapshot on concept-adv11-ch02 (3.3 GB after the benchmark) and bound whatever dominates (SVG caches, measurement maps, history frames, the bank records held twice). Cache `annotationMath`. The renderMath LRU (20,000) is done.

### 2. Per-edit identity (B4, B5, B6 remainder)

- **B5**: `flowCommand`, add/move/delete/duplicate, `setPageBoundary`, `insertBank` and the `changeDiagram` path deep-clone the whole project (`editable-booklet-model.js:128-149, 321-463`, `booklet-flow.js:196`, `booklet-workspace.js:44,77`; `setPageBoundary` uses `structuredClone`). Copy only changed paths so pagination reuses untouched pages and history frames stop holding full copies. Undo already keeps identity (`restoreDocumentFrame`).
- **B4**: the lean path stringifies the whole project and its printable projection every run (`paginateFlow` in `booklet-pagination.js`). It was **not** changed because identity checks are only safe if nothing mutates the project in place. First establish whether any path mutates `project.sections` in place (Svelte proxies, `structuredClone($state.snapshot(...))` call sites); only then replace the snapshot comparison.
- **B6 negative cache** in `locateBookletContent` was skipped for the same in-place-mutation reason.
- **A2 remainder**: `prepareAutomaticSync`/`refreshBankRatings` still run for every linked block on each save (about 0.4–0.5 s on Linear). Restrict them to blocks whose content changed in this save, keeping bank-side update detection.

### 3. Diagrams on cold open (D2, D3)

- **D2**: add `POST /__booklet/render-cache/:version/lookup` taking the page's keys and returning the found SVGs in one response, replacing one request plus a 1.5 s timeout per diagram (`serverDiagram` in `src/lib/diagram-cache-client.js`, server in `scripts/booklet/render-cache-server.mjs`). Note `tikz.js` and `diagram-cache-client.js` are in the diagram fingerprint: changing them recompiles every diagram, so land them together and rerun `warm-diagrams.mjs` once.
- **D3**: the warmer exists (`node scripts/booklet/warm-diagrams.mjs --recent 12` or `--projects a,b`, three headless pages). Still to do: the server spawns it (by path, not import; see the server-import-chain memory) when a project's lookup misses more than N diagrams, the browser shows "Compiling N diagrams (server)", and it runs once after a diagram-version change. Books outside the 18 warmed still compile once in the browser.

### 4. Question bank (E remainder)

The picker uses one bulk `records` response (73 MB) of pre-normalised questions and opens in about 2.1 s warm. Still to do: a light index (`GET /__booklet/bank/index`: id, title, excerpt, skill, difficulty, search text) served outside the bank lock; the picker and builder render from it and fetch full questions only for visible/selected rows (40 at a time) and on insert; paginate the builder list. Remote loads especially need this (73 MB before compression). `outline` insert, promotion and the builder use full records today, so keep a full-record path for them.

### 5. Controls (F remainder)

- **F1 equation**: the inline equation group overflowed the one-row toolbar and appeared even when no equation was being edited, so it stays behind **Equation ▸** (`booklet-editor-dom.js`). The plan's whole/selection toggle and inline swatches need a contextual second row (or a layout that only appears while an equation is active) rather than more items on the main row.
- **F1 native inspector**: move native table fields the format bar now covers, and the raw **Annotations (JSON)** field, under "More…" in `public/libs/maths-editor/document-editor.js` (shared library; changes the layout fingerprint).
- **F2**: show the page-count effect before **Apply** in **Diagrams in question** (today it reports after); consider a Diagrams group in `BookletQuestionSpacing` for multi-question selections.
- **F3**: fold `BookletPaginationOptimiser` into Fit as "Fit whole exercise"; on failure report how much space is missing ("Needs 18 mm more") instead of only listing options to allow; Fit preview speed on large books (see section 1).
- **F4**: inspector sections that follow the selection breadcrumb (Question › Part › Table › Cell) with collapsible Spacing / Diagrams / Table / Arrangement / Page / Fit. `BookletLayoutControls` keeps its local Undo/Redo deliberately: inside the detailed-edit modal the layout draft has no other undo.
- **F5**: the page error "Cannot read properties of undefined (reading 'options')" after equation editing then Escape was not investigated.
- Cleanup: unused CSS selectors left in `BookletProjects.svelte` from the old Colour menu (`.colour-menu`, `.document-colours`, `.colour-swatch`) produce Svelte warnings.

## Designs for the remaining work (28 October 2026)

These are in the suggested working order. Each one says what to change, where, how to check it and what could go wrong. Nothing below has been implemented.

### D-1. "Cannot read properties of undefined (reading 'options')" after equation edit + Escape (F5)

**What the code shows.** No Studio or maths-editor code reads `.options` from a value that can be `undefined`. The one candidate in Studio, `measurement.options` in `FlowBookletPreview.svelte:176`, is cleared to `null`, which would give "of null", not "of undefined". So the error almost certainly comes from MathLive (`vendor/mathlive.min.js`). It reads `t.options` / `t.mathfield.options` from deferred work: the inline-shortcut timer (`inlineShortcutTimeout`), `flushInlineShortcutBuffer({defer:true})`, popover and keystroke-caption updates, and render callbacks. All of these run after the field's internal `Mathfield` has been disposed. Escape is handled in `math-editing.mjs:105`. It calls `exit()`, which moves the caret into prose (`place()` → `setActive(null)` → `previous.blur()`) in the same keydown. If that commit re-renders the paragraph, or the inline editor closes, the `<math-field>` is disconnected while MathLive still has a timer queued. The timer then finds `mathfield` undefined.

**Plan.**
1. Reproduce it headless with in-memory `PUT`/`PATCH` routing (as in `bench/studio/interactions.mjs`). Type into an equation, including a letter sequence that starts an inline shortcut such as `pi` or `sq`, then press Escape. Capture `pageerror` with a stack. Map the minified frame to its MathLive function by searching for the nearby text in `mathlive.min.js`.
2. Fix it in our layer, not the vendor bundle. In `exit()` and `remove()`, first let MathLive settle: call `mf.executeCommand('commit')` if it is available, or flush pending inline shortcuts by blurring the field first. Then do the DOM move in a `queueMicrotask`/`requestAnimationFrame` after the blur. If the stack shows the field being *replaced* by a re-render rather than moved, keep the field's node across the re-render (the editor's commit path) instead.
3. If the cause turns out to be a MathLive timer that we cannot drain, add a narrow guard. A `disconnectedCallback`-time `mf.blur()` plus a cleared selection in `setActive(null)` stops the popover and caption updates.

**Check.** The repro script reports no `pageerror` over 20 Escape/Shift+Escape/Enter exits, including exits mid-shortcut and exits that close the detailed-edit modal. `public/libs/maths-editor/` is shared, so run the maths-editor tests and one representative print check. A layout-fingerprint change needs no re-render if only event handling changed.

### D-2. Copy-free structural edits (B5, then B4/B6)

**What the code shows.** `updateProjectContent` already copies only the changed path (`replaceAtPath`). Every structural edit does not: `addProjectBlock`, `move…`, `delete…`, `duplicate…`, the section operations and `resizeFirstProjectTable` start with `normalizeEditableProject(project)`. That function deep-clones the whole project (`...clone(value)`, then re-normalises every section and block). `setPageBoundary` and `startExerciseOnNewPage` use `structuredClone(project)` (`booklet-workspace.js:44,77`), and `booklet-flow.js` uses a JSON round-trip `copy()`. The pagination fast path (`paginateFlow`, `booklet-pagination.js:230-245`) then `JSON.stringify`s the whole project and its printable projection, because it cannot trust identity.

**Plan.**
1. **Shared helpers** in `editable-booklet-model.js`:
   - `editSection(project, sectionId, fn)` copies only `project`, `project.sections`, that section and its `blocks` array, then calls `fn(blocksCopy, sectionCopy)`.
   - `editBlock(project, blockId, fn)` adds a copy of the one block.
   - Normalise only *new* blocks (`normalizeV4Block` on created or duplicated blocks). Leave the rest untouched.
2. Rewrite the structural operations on top of these helpers. `setPageBoundary` touches at most three blocks plus one or two sections' `blocks` arrays, so it copies exactly those. `insertBank` and the `changeDiagram` path follow the same pattern.
3. **Freeze in development.** Behind `import.meta.env.DEV`, `Object.freeze` every project returned from an edit, applied deeply but only to the new path, so it costs little. Run the interaction bench and the Studio check scripts. Any in-place mutation (Svelte proxies, `$state.snapshot` round-trips, `block.flow = …` on a shared object) then throws at the site. This is the audit B4 was waiting for. Fix each site that throws.
4. When a full Studio session runs clean with freezing on, do **B4**: replace the `projectSnapshot` string comparison with `cached.project === project` plus a per-section identity check. Do **B6**: add a negative cache keyed on the `sections` array identity.
5. **A2 remainder.** With identity available, `prepareAutomaticSync`/`refreshBankRatings` can skip linked blocks whose object is the same as at the previous save.

**Benefit.** Pages and history frames before the first changed block keep their identity. The C3 WeakMap block hashes are reused, and pagination's `previous` checkpoints apply. Expect first-edit p95 on Linear and Operations FDP to fall from about 1.5 s to under 500 ms. History memory also falls, because frames share untouched sections.

**Check.** Save the project before and after the change and compare it byte for byte, for each operation on Index Laws and Linear. Unit tests assert that untouched sections and blocks are `===` their originals. Run `bench/studio/interactions.mjs` before and after. **Risk:** a hidden mutation gives a stale page. Freezing in development (step 3) is the guard. Do not land step 4 before step 3 runs clean.

### D-3. Faster first opens: cheaper question split searches (C2 follow-up)

**What the code shows.** Splitting a question at a page boundary uses a binary search over `questionSplitGroups` (`booklet-pagination.js:338-341` for topic layouts, `366-375` for the general case, `386` for working continuations, `404-406` for paragraphs). Each probe is a full render, settle and measure (`fits` → `measure` → `FlowBookletPreview` measurement root). A 12-part question costs about 4–5 measurements per split, and pages average 5–6 measurements. `measureBookletPage` (`booklet-page-space.js:5`) returns only the page's `height` and `capacity`.

**Plan.**
1. **Report where each part ends.** Give `measureBookletPage` an optional `splitMarks` result: the bottom (in mm, page-relative) of each rendered top-level split group. Rendered parts already carry ids. Mark group roots with a `data-split-group="<index>"` attribute in the question renderer. Store the marks on the measurement value; the cached shape stays compatible because old entries simply lack them.
2. **Predict, then confirm.** Before the binary search, the code has usually just measured the whole question overflowing (`size=await fits(blocks)`, line 356) or the page plus the whole question. Take `k` = the last group whose bottom is at or below `capacity`. Then measure `k` (must fit) and `k+1` (must not fit). If both hold, accept `k` after 2 measurements. If either fails (reflow shifted things), fall back to the existing binary search, bounded by what the two probes learned.
3. **Carry forward.** For the following page of the same question, the marks from the `k+1` probe are already on a fresh page, so predict the next split the same way.
4. Apply the same predict-then-confirm step to paragraph splits (line 404) using line-box bottoms. Leave working continuations (line 386) until the question path is measured.
5. Separately, close C5's `annotationMath` cache.

**Check.** The result must be identical to the binary search whenever fit is monotonic in the part count, which is the existing assumption. Gate with `warm-render-cache.mjs --measurements-off --compare .booklet-work/studio-load/c3-off/report.json`: identical placement, text and navigation hashes in all five editions for Index Laws, Linear, Operations FDP and ch02. Target: measurements per page from about 5–6 down to about 3, and fresh opens on Linear and Operations from about 17 s to under 10 s. **Risk:** the confirm probes can disagree with the prediction (for example a keep-together row that moves) and fall back; count fallbacks in `stats` and report them.

### D-4. One-request diagram lookup and server-side compiling (D2, D3)

**What the code shows.** `serverDiagram(version,key)` (`diagram-cache-client.js:14`) makes one `GET /__booklet/render-cache/:version/:key` per diagram, with a 1.5 s timeout. The middleware (`render-cache-server.mjs:105-117`) accepts only `GET`.

**Plan.**
1. **Server.** Add `POST /__booklet/render-cache/:version/lookup` with body `{keys:[…]}` (cap 500). It returns `{found:{key:svgRow}, missing:[…]}`, read with bounded concurrency from `.booklet-work/render-cache`. Keep the GET route for single misses.
2. **Client.** In `diagram-cache-client.js`, add a micro-batcher: `serverDiagram` calls queued within one task (`queueMicrotask`) or up to 16 ms are sent as one lookup. Each caller gets its own promise. One 5 s timeout applies to the batch rather than 1.5 s per diagram. Requests for keys already known to be missing in this session resolve `null` at once.
3. **Server compiling (D3).** When a lookup's `missing` count is above a threshold (say 10), the server spawns `scripts/booklet/warm-diagrams.mjs --projects <id>` by path (`child_process.spawn`, not import; see the server-import-chain memory). Only one runs per project, and the server answers with `compiling: N`. The browser shows "Compiling N diagrams (server)" and keeps compiling the visible page's diagrams itself so nothing waits. On a diagram-version change, the server queues one warm of the 18 recent books.
4. Land the `tikz.js` and `diagram-cache-client.js` changes in **one commit**, because both are in the diagram fingerprint, then run `warm-diagrams.mjs` once.

**Check.** Bench a cold open (empty IndexedDB) on Linear: diagram requests go from N to ⌈N/500⌉, and no 1.5 s timeouts show in network timing. Test a book outside the warmed 18 for the "Compiling (server)" path. Remote: lookups are small JSON and compressible; test through the tunnel after landing.

### D-5. Lighter question-bank picker (E remainder)

**What the code shows.** `loadPracticeBank` (`practice-question-storage.js:10`) fetches `/__booklet/bank/manifest` (2.8 MB, already one entry per question with skill, difficulty, reasoning score, shape and diagram flags), then the 73 MB `/__booklet/bank/records`. Both are served under `withBankLock` (`practice-studio-server.mjs:66-69`). Every consumer (`views/BookletStudio.svelte`, `components/BookletStudio.svelte`) gets full records.

**Plan.**
1. **Index.** Add `GET /__booklet/bank/index?v=<manifest version>`: the manifest entry fields plus `title`, a plain-text `excerpt` (first ~160 characters of the stem, maths as LaTeX text) and a lowercased `search` string. Build and cache it with the manifest in `bank-manifest-cache.mjs`, and serve the cached copy **without** the bank lock, with the version in the query giving cache safety. Expect about 3–5 MB, under 1 MB compressed.
2. **Client API.** Split `loadPracticeBank` into `loadBankIndex()` and `loadBankRecords(ids)`. The second batches into `GET /__booklet/bank/records?ids=…` (40 per request) and keeps a session `Map` cache. Keep `loadPracticeBank()` unchanged for the full-record callers: `outline` insert, promotion and the builder's bulk operations.
3. **Picker.** Rows render from the index. Previews fetch full records for visible rows, 40 at a time as the list scrolls, and for selected rows. Insert awaits the full record of each chosen question.
4. **Builder.** Paginate the list (100 rows a page) from the index, and fetch full records for the page shown.

**Check.** Bank picker open under 1 s warm and under 2 s remote. Insert from the bank gives byte-identical blocks to today (compare against the full-record path in a test). The existing bank check scripts that route `/__booklet/bank/manifest` keep working, because the index falls back to the manifest when the route is absent.

### D-6. Remaining controls (F2, F3, F4, cleanup)

**What the code shows.** **Diagrams in question** (`BookletDiagramSizes.svelte`) applies, then says the page count "updates when layout finishes". **Fit** (`BookletLayoutActions.svelte:52`, `booklet-fit.js` `searchFit`) probes by repaginating the whole candidate project in a `FlowBookletPreview`, which takes about 4 s per probe on Linear. `BookletPaginationOptimiser.svelte` is a separate panel under page controls.

**Plan.**
1. **Faster probes (prerequisite for 2 and 3).** After D-2, a candidate shares every section before the change, so pagination's `previous` checkpoints reuse those pages and a probe measures from the first changed page onwards. Add `stopAfter: blockIds` to `paginateFlowLayout`: once the affected unit and one following page are placed and the next checkpoint matches `previous`, return early with the rest copied from `previous`. Target under 1 s per probe on Linear.
2. **F2 preview before Apply.** Changing the target width or mode in **Diagrams in question** starts a debounced probe of the candidate (the same mechanism as Fit). The panel shows "Pages: 24 → 23" and highlights the pages that change, and **Apply** commits the previewed candidate. If the probe is still running, Apply works as today and reports afterwards. In `BookletQuestionSpacing`, add a "Diagrams" group for multi-question selections that reuses `diagramSizeTargets` across all selected blocks.
3. **F3 Fit whole exercise.** Add a fourth Fit goal, "Fit whole exercise", that runs the optimiser's search through `searchFit`'s probe loop. Move `BookletPaginationOptimiser`'s break suggestions into it and remove the separate panel. On failure, the t = 1 probe already measures the unit at its floors. Report `height − capacity` as "Needs 18 mm more", then the options that would free space, from `fitSuggestions`.
4. **F4 inspector by selection.** Sections follow the breadcrumb (Question › Part › Table › Cell). Each level shows only its collapsible groups (Spacing, Diagrams, Table, Arrangement, Page, Fit), with the open/closed state remembered per group in `localStorage`. `BookletInspectorTabs.svelte` is the host. `BookletLayoutControls` keeps its local Undo/Redo inside the detailed-edit modal.
5. **F1.** The equation whole/selection toggle and swatches go in a second toolbar row that appears only while an equation is active (`math-editing.mjs` already hides `.me-math-tools` otherwise). The native inspector's covered table fields and **Annotations (JSON)** move under "More…" in `document-editor.js`. That changes the layout fingerprint, so land it alone.
6. **Cleanup.** Remove `.colour-menu`, `.document-colours` and `.colour-swatch` from `BookletProjects.svelte`.

**Check.** Run focused headless interaction scripts with in-memory saves for each control: preview count matches the post-Apply count, a failure message shows the mm shortfall, and a save/reopen round trip works. Run a representative print check for item 5.

## Things to know

- **Server**: after the compression fix the 5173 server was restarted with the `mathsmap-dev` launch configuration inside the Claude desktop app. If that app closes, the server may stop; run `remote/start-remote-studio.cmd` (it starts the server only if 5173 is free). Touching `remote/vite.remote.config.js` to force a restart stopped the server once; prefer letting Vite restart on its own after a config dependency changes.
- **Remote path**: compression applies only to authorised non-local requests and cannot be exercised locally past the Access guard. After any change to `remote/compression.mjs`, test piped static files (`tests/remote-compression.test.js`) and ask the user to confirm through the tunnel.
- **Tests**: about 57 tests fail on the baseline as well. Two more fail only in this checkout: `tests/diagram-large-coordinate-space.test.js` times out (passes in a clean worktree with identical code) and the frozen Vite server test fails with EPERM in full runs (passes alone). Compare failures against a clean worktree of the base commit rather than reading the total.
- **Testing UI without touching booklets**: use headless Playwright with in-memory routing of `PUT`/`PATCH` (see `bench/studio/interactions.mjs`), never the in-app browser on 5173, which saves to real booklets.
- **Landing rules** (`AGENTS.md`): before editing `src/`, `scripts/`, `public/`, `data/` or `vite.config.js`, check for running imports, exports, lean-review, finish or repair processes; if any run, use a worktree. Restart 5173 only when idle and say so. Commit with explicit paths; untracked `booklets/studio-sources/Stage 6 Extension/` folders belong to another session.
- Do not rename top-level folders of the live checkout to test a hypothesis: the 5173 watcher locks them (see memory `studio-watcher-locks-renamed-folders`).
