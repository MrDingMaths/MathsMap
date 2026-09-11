# Standard palette acceptance — 11 September 2026

Implemented the [standard palette contract](booklet-standard-palette.md) for all three current projects, their five editions, reusable bank content and future authoring. Shared editor, preview, TikZ preparation, cache and print paths use the palette. Custom editable colours fail acceptance; original evidence, history, recovery copies and raster pixels remain unchanged.

## Accepted inputs and output

| Project | Revision | Questions | Short answers | Worked solutions | Questions + short | Questions + worked |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Index Laws | 205 | 63 | 15 | 68 | 78 | 131 |
| Linear Relationships | 7 | 92 | 14 | 47 | 106 | 139 |
| Non-Right-Angled Trigonometry | 73 | 71 | 4 | 35 | 75 | 106 |

Numbers are physical PDF page counts. All 15 final editions (1,044 pages) passed browser/export QA and an independent PDF painted-text/vector audit. All 3,900 internal PDF destinations resolve. Ordinary short answers remain near-black, including mathematics and labels; both answer sections remain practice-only. Teaching responses, correctness symbols, graph identities and worked highlights retain their meaning through standard accents.

The stored-content audit covered 332 project/bank files with zero custom-shade findings. The repeat migration proposes zero file changes. All 317 owned bank links are synced. Comparison against the task's original local snapshots confirms preservation outside reviewed palette migration, including mathematical content, source evidence, IDs, classifications, local layouts and pagination settings. Valid answer-diagram width signatures were reconciled after colour-only changes.

The native inventory contains 591 occurrences and 668 distinct renderings, including answer variants. All 324 distinct geometry renderings passed colour and label-layout checks. The 1,385 measured ordinary geometry labels span 9.999998–10.000002 pt. Printed base fonts also pass 10 ± 0.1 pt; regression coverage retains relative scripts, fractions, rotation, alignment, width changes, repeated resizing, page zoom, reopen behaviour and existing graph tick targets.

Browser editor checks passed initial and live equation normalization, save/reopen, preview parity, 15 standard swatches and rejection of a custom fill. Two independently fresh compilations matched cached SVG bytes exactly (657 ms and 623 ms). All 648 regression tests passed; the final production build exited successfully in 5.68 seconds.

## Visual evidence

All 291 pages across the five trig editions were visually reviewed. Other-book review covered the complete Index Laws questions/worked output (131 pages), Linear Relationships questions/worked output (139 pages), both standalone short-answer sections (15 and 14 pages), edition covers, answer transitions and pagination neighbours. Actual PDFs were rendered to page images, inspected in contact sheets and enlarged for representative patterns. All editions additionally received automated layout, typography, palette and navigation checks.

Checks covered matched equations/graph legends, correctness symbols, teaching/worked highlights, rich-text fills, cards, speech bubbles, collisions, clipping, handwriting space and footer clearance. Retained raster figures, photographs and screenshots were reviewed separately as unchanged source evidence; their pixels are outside palette acceptance.

A late stored-content finding required an Index-only final re-export. All five dependent editions passed again. All 226 available full-page comparisons were pixel-identical to the reviewed images, including the complete questions/worked and short-answer output. Final project and PDF hashes are recorded with provenance.

## Actual costs and retries

The run started at 12:13:09 UTC; 40 minutes 54 seconds elapsed to receipt generation. Observed log windows were 12:21:16–12:28:51 for the first compile attempt, 12:30:13–12:35:41 for the successful cache-aware retry, 12:37:43–12:42:03 for the first 15-edition export, and 12:44:24–12:46:17 for the five dependent Index re-exports. These overlapping windows are not additive CPU timings. Inventory, implementation and visual-review time were not separately instrumented; token usage and a comparable savings baseline are unavailable.

The first compile exposed legacy answer overrides without palette definitions. Representative output then exposed old card border defaults and a QA false positive on unpainted SVG groups. These shared causes were repaired with regression coverage. The late stored-content audit found two supplemental Index prompts containing decorative blue mathematics; their project/bank repair invalidated only Index exports. Three production builds occurred during these corrections; acceptance refers to the last settled build. Repeated checks were limited to changed dependencies, followed by the settled full regression suite.

The compile retry reused 276 valid SVG files and created 392 remaining renderings. The final 668-entry cache seeded all edition exports; runtime cache hit/miss counters were not instrumented. No measured speedup is claimed.

Durable reviewed departures, follow-up transactions, input/output hashes, timings and acceptance summaries are in [project provenance](../booklets/provenance/standard-palette-2026-09-11.json). Detailed local evidence is under `.booklet-work/standard-palette/`, particularly `run-receipt.json`, `stored-palette-qa.json`, `preservation.json`, `geometry-qa.json`, `editor-qa.json`, `cache-parity.json`, `printed-qa.json`, `index-render-equivalence.json` and `editions/report.json`. Render caches, PDFs, page images, baseline evidence and logs remain local under the [change runbook](booklet-change-runbook.md).
