# Adaptive back-of-book answers — 16 September 2026

Short answers now use measured rows of three, two or one entries within the
existing two page columns. Text remains 9 pt, with an 8 mm centre gutter and
3 mm between entries. Full labels and reading order are preserved. Explanations,
methods, tables and diagrams occupy a complete column-width row. Exercise rules
remain; individual short-answer questions and parts have no divider rules.
Meaningful table and diagram borders remain intact.

This applies to all nine current compact projects and future compact imports,
in Short answers and Questions + short answers. Both answer sections remain
practice-only. This change preserves question pagination settings, question/node
IDs and worked-solution content.

`booklet-short-answer-grid.js` derives rows using width probes rendered with the
same components, fonts and label gutters as the final pages. The paginator
measures complete rows, keeps exercise headings with their first answer and
repeats exercise context on continuations. Shared-diagram/dependency groups
remain atomic. Preview and PDF consume the same derived rows. Row composition
and physical widths participate in measurement/pagination caches; persisted
width probes survive reopening, and edits invalidate affected rows.

The editorial review considered 299 questions using reasoning content and
difficulty metadata, including unrated data questions. It retained 221 existing
responses and added 85 method sentences across 78 questions. Results, reasons,
units and precision remain in the existing editable `answer.short` field.
The [review register](../booklets/provenance/adaptive-short-answers-2026-09-16.json)
records each amendment, teaching references and content hashes. The revision-safe
project/bank transaction preserves unrelated edits, classifications, evidence,
ownership and pinned relationships; a second application produces no changes.

| Current project | Short pages before | Short pages after | Methods added |
| --- | ---: | ---: | ---: |
| Angle Relationships v1 | 18 | 14 | 5 |
| Data Visualisation 1 v1 | 10 | 8 | 14 |
| Index Laws Complete v1 | 15 | 7 | 22 |
| Linear Relationships v1 | 18 | 13 | 14 |
| Logarithms v1 | 7 | 4 | 16 |
| Non-Right-Angled Trigonometry v1 | 5 | 3 | 9 |
| Probability v1 | 5 | 4 | 3 |
| Volume Book 16 (`project-ac094b6d-f3e7-45ac-b585-6092b8d15f58`) | 5 | 4 | 1 |
| Volume v1 | 7 | 5 | 1 |
| **Total** | **90** | **62** | **85** |

Page counts compare the captured pre-change projects/renderer with the settled
implementation and reviewed methods. They are actual PDF counts, not estimates.

Validation passed: 60 focused regressions; ten browser checks covering width
cache persistence, the six-angle-parts example, full-width explanation, borders,
zoom, native editing, save/reopen, longer-answer reflow and worked presentation;
a production build; diagram shading and solid-visibility checks; and automated
layout, inventory, label/order and navigation checks on all 45 edition PDFs.
The PDF navigation audit inspects actual annotations and named destinations,
including textless links that `pdftohtml` may omit.

All 62 standalone short-answer pages were visually inspected, together with
corresponding combined covers, contents, answer boundaries, every footer and
every unmatched answer page. Trigonometry additionally received fresh visual
inspection of all 64 student and 35 worked pages. Both trigonometry combined
editions received composition/footer review and inspection of every unmatched
page. Combined bodies reuse standalone inspection only through current, exact
144 dpi PDF-pixel comparisons with the prescribed footer exclusion.

Local evidence is retained under
`.booklet-work/adaptive-short-answers-20260916/`: `receipt.json` records page-level
visual review, PDF hashes, actual timings and retries; `final-edition-checks.json`
indexes the 45 checked PDFs; comparison files reference hashed full-size
rasters. Generated exports and caches remain outside Git. These are layout
maintenance checks using draft export mode; existing source-fidelity/readiness
gates remain separate and were not marked complete by this work.

The run began at 08:57:45 UTC. Representative layout acceptance finished at
09:08:57, editorial review/transactions at 09:31:44, and implementation settlement
at 09:44:29. Retained export runs spanned 09:42:59–10:11:41; manual review completed
at 10:18:54. These phases overlap. Retries addressed a hidden-surface test wait,
legacy table colours, baseline harness isolation, missing persistent width
measurements, a horizontal print arrangement and HTML-based PDF link counting.
No token/time savings are inferred from those timings.

A final freshness check detected a concurrent authorised Data Visualisation
teaching revision, saved at 09:52 UTC. Revision 7 was preserved. All 103 practice
blocks still matched the applied answer changes; all six affected teaching
contexts were reread against the 14 methods. Original context hashes remain in
the amendment register alongside the revalidated references. The two short-answer
editions were refreshed at 10:21:51–10:22:29 and visually reinspected by 10:26:21,
including all 87 combined footers. Its short section remains eight pages; the
combined edition is now 87 pages. The other three editions already used revision
7. Current shading and solid-visibility checks passed again after this refresh.

Authoring conventions are in the [compact specification](booklet-compact-exercise-trial.md),
[worked-solution contract](booklet-worked-solution-style.md) and shared editor
house-style prompt. Useful focused checks are
`node scripts/booklet/check-short-answer-grid.mjs` and
`node --test tests/booklet-short-answer-grid.test.js tests/booklet-short-answer-methods.test.js tests/booklet-pdf-navigation.test.js`.
The reviewed migration defaults to dry run:
`node scripts/booklet/apply-short-answer-methods.mjs`.
