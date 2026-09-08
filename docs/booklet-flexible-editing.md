# Flexible booklet editing

Open **Linear Relationships — Flexible** to edit a flowing copy of the accepted booklet. Its initial layout matches all 93 original pages, including mixed teaching/practice pages and practice on separate pages. The accepted source project keeps its original pages. **Create flexible copy** creates an independent project from another saved booklet; unknown imported boundaries are retained as separate sections until you organise them.

The outline contains topics, sections and content. Sections normally start on fresh pages. **Page boundary** lets a section share the preceding page while retaining its separate outline entry. Sharing a practice section hides its difficulty heading; enabling that heading starts it on a fresh page. Teaching blocks can share a teaching section; Foundation, Development, Mastery and Challenge sets have separate sections. Section settings change placement and headings, not the question-bank classification. Join previous section removes a section boundary; topic assignment and phase remain editable.

Select content using the checkboxes, then Cut, Copy, Paste, Duplicate or Delete. Drag onto an item to insert before it, or onto a section to append. **Insert / move to** offers a precise destination, including an empty section. Clicking content in the outline makes the following item the insertion point. Cut content remains in place until a successful paste. Escape cancels the pending cut. Ordinary text/equation editing keeps its normal clipboard shortcuts.

Questions carry their diagrams, parts, answers and saved arrangements. Teaching groups and source continuations move together. Each operation can be undone in one step. Copies get new local identities and retain pinned bank references. Existing automatic bank-sync ownership is unchanged; a flexible copy is a consumer, not another original.

The main preview is one continuous white document. Page markers show the actual PDF boundaries; unused page-bottom space is collapsed on screen. Use the page jump or outline to navigate. Pagination waits for fonts, images and TikZ and reports progress. Zoom does not repaginate. Long booklets mount nearby pages as you scroll.

Measurements are cached by content, calculated labels and the presentation settings used by that content. Editing or copying an item reuses unaffected measurements. Asset readiness is observed directly, without fixed animation-frame waits for each candidate page; superseded calculations cancel pending asset waits. New diagrams still need their first compilation before pagination can finish.

Topic titles appear once at the start of each topic. Difficulty headings appear once at the start of their practice sections. There is no generated Teaching heading, and continuation pages repeat neither topic nor difficulty headings. No additional “continued” line is inserted. Original source wording is preserved, with any existing question reference updated to its calculated number. Answer editions follow the same heading rule within their separate answer sequence. Pagination measures heading space before assigning content to pages; screen-only page markers retain navigation context.

**Page layout for selection** provides Start on new page, Keep together, Keep with next and their corresponding release controls. Imported page breaks are editable constraints attached to content; **Remove manual break** also releases an imported break. Inserted content can overflow automatically without repairing later pages. Imported breaks apply to question pages, so separate answers still flow independently. **Continue here** chooses a question-part boundary. Automatic continuation preserves complete rows, dependent parts, diagrams and working space. An item with no safe break is reported for adjustment and prevents export; content is never silently shrunk to fit.

Practice numbering normally restarts per topic, continues through difficulty tiers, and is shared with answers. The Linear Relationships copy also retains the original gap for worked example 15 and the restart at source page 39. **Question numbering → Start numbering at** controls a section restart; leave it blank to continue. Inserting before the first question in a restarted section gives the inserted question its first number and renumbers the following questions. Moved/copied questions use the destination's running numbers. Paired questions retain distinct numbers, while a continuation chain retains one number. Original source numbers and source-page evidence remain stored. **Compare source** follows the selected block, even after it moves to another printed page. Imported contents entries retain their titles and follow their source content to its calculated page; new topics are added to the contents automatically.

Choose Questions only, Questions and short answers, Questions and worked solutions, Short answers only, or Worked solutions only. Separate answers follow the question sequence, grouped on fresh pages by topic and section. Worked-example solutions retain their existing teaching switches. The selected edition is used by both preview and PDF; Save PDF defaults stores it with the project.

## Developer verification

- `node --test tests/booklet-flow.test.js tests/booklet-save-merge.test.js` covers conversion, stable identities, copying, cross-section merges, boundaries and continuation.
- `node scripts/booklet/check-flexible-booklet.mjs` exercises all editions and editing with intercepted writes. `--full` uses an in-memory conversion of the complete source booklet. Reports, screenshots, PDFs and browser caches stay under `.booklet-work/flexible-check`.
- `node scripts/booklet/benchmark-pagination.mjs` measures opening, changing editions, duplication and undo against the saved flexible booklet with intercepted writes. It reuses the browser check's diagram cache when available; `--cold-diagrams` starts without it. Reports stay under `.booklet-work`. `tests/booklet-measurement.test.js` covers selective cache invalidation, delayed assets, cancellation and rendering failures.
- `node scripts/booklet/create-flexible-linear.mjs` validates conversion; `--apply` creates the named copy once through the project persistence API.
- `node scripts/booklet/match-linear-flexible-layout.mjs` prepares the existing flexible copy with original layout boundaries and numbering. `--apply` saves it with a revision check, preserving content and pinned bank snapshots.
- `node scripts/booklet/export-pdf.mjs --project-id linear-relationships-flexible-v1 --mode student --out .booklet-work/flexible.pdf` exports the shared page map. Flexible projects also accept `short`, `worked`, `with-short` and `with-worked`.

The additive v4 settings are `paginationMode: flexible` and `flowEdition`. Topics carry stable IDs/titles; sections reference `topicId` and carry `phase` and optional `difficulty`. Block `flow` metadata holds local layout constraints and logical continuation references. Calculated pages/fragments remain transient. Existing projects without the setting continue through the legacy renderer.

## Verification, 8 September 2026

The flexible copy contains 237 source blocks, including 168 questions with pinned bank revisions, in 14 topic/front-matter groups and 46 sections. It derives from source revision 164. Creation verified the source SHA-256 remained `17338c151908631f6a405a615ef50e180340162ea2e1cb1a83657757a2cb1a47`; the accepted project and bank-sync ownership records are unchanged.

All 495 tests and the production build pass. The existing large-bundle warning remains. The flexible browser check passes all five editions, verifies topic/tier headings occur only at their starts, and exercises keyboard copy, paste, cut/move, undo, save/reload, source comparison after movement, zoom and a 390px viewport. The full check asserts the same content blocks on each of the 93 original pages and no added continuation line. The legacy human-workflow check previously passed with five intercepted saves and no browser errors; its print test explicitly prepares the lazy print surface, matching the exporter.

Local Chrome pagination timings on the saved 93-page booklet, with its question diagrams cached, improved from 7.065 seconds to 2.008 seconds on opening. Duplicating the benchmark question improved from 6.460 seconds to 0.188 seconds, remeasuring 15 candidates instead of 176. Returning to the already measured question edition took 0.020 seconds; undo took 0.021 seconds. These timings measure pagination, excluding application startup, and vary by machine and content. First-time answer-diagram compilation remains the main cost of an uncached answer edition (about 57 seconds in this run).

| Edition | Preview pages | PDF pages | Printed geometry issues |
| --- | ---: | ---: | ---: |
| Questions | 93 | 93 | 0 |
| Short answers | 45 | 45 | 0 |
| Worked solutions | 60 | 60 | 0 |
| Questions and short answers | 138 | 138 | 0 |
| Questions and worked solutions | 153 | 153 | 0 |

The saved flexible project's command-line student export passes DOM layout/style checks and final PDF geometry checks at 93 pages. All 93 pages have identical extracted text and line layout to a fresh export of the accepted original; word positions agree within 0.02 points. Raster comparison found only minor SVG text rasterisation differences. Cover/contents, the shared page-17 continuation opening, mixed teaching/practice page 37, the preserved empty arrangement column on page 49, and the four-part continuation on page 79 were visually inspected. The flexible copy is saved at revision 3; the accepted original remains unchanged. Generated PDFs, screenshots, measurement reports and browser caches are local QA evidence, not release files. The page counts above describe the saved source content with default answer switches; later content or spacing edits can change them.
