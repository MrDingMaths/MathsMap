# Booklet Studio document workspace

Implemented 14 September 2026. Current projects keep their stored content, IDs, bank ownership and layout settings. Studio is a document workspace with a 48 px document bar, 44 px formatting row and 28 px status bar at the reference desktop size. Outline and inspector start closed; panels overlay the paper without changing its zoom.

## Editing and commands

Click prose or mathematics to edit it directly. Native editor instances survive page redistribution. Enter splits ordinary paragraphs; Backspace joins adjacent ordinary paragraphs in their native owner. Question and table ownership remain structural. Use a group handle to move, copy or delete a complete question. One document history owns typing, formatting, paste and structural operations.

- **Spacing** opens the contextual inspector. Prose has line/before/after spacing; a multiline equation has an explicit additional gap in millimetres and tighter/looser actions. Table cells have text spacing, padding and minimum row height. Mixed paragraph values are shown as mixed. Whole-question scope is explicit.
- Preview spacing changes locally, commit on confirmation or release, and cancel with Escape. Advanced native properties remain collapsed, with colour and specialist data controls disclosed on demand.
- **Ctrl+F** finds document prose, **Ctrl+G** goes to a page, and **Ctrl+K** searches commands, including equation spacing. File contains source comparison, bank sync and specialist project tools.
- Studio clipboard payloads retain native content. Structural question copies use the existing cloning rules; moves keep identities. Basic Word HTML is sanitised into destination typography, emphasis, lists, links and simple tables. **Ctrl+Shift+V** inserts literal text. Unsupported equations/objects require a fallback choice before replacement. DOCX round trips and Word equation conversion are outside this change.

## Internal contracts

The document session owns transactions, canonical field selections and immutable history. An edit transaction carries changed block IDs, selection before/after, a generation and layout impact. Field hosts register stable content IDs and paths; page numbers are presentation metadata. A single parked editor portal moves between fragment views. Native DOM reconciliation preserves MathLive islands and text nodes. Hosted native editors emit document transactions without standalone history or complete source exports on every input. Their standalone API remains available.

Pagination begins after 250 ms of editing inactivity. Superseded jobs cancel, including asset waits. In-memory checkpoints resume from the earliest changed logical unit with the preceding partial page and keep-with-next dependencies. Reuse continues after the carry, placement and continuation state converge. Override fingerprints include every per-item layout map; global settings, edition and renderer/assets are cache inputs. Combined editions reuse page bodies while deriving numbering and links. Measurement work yields with a 4 ms JavaScript budget; DOM measurement stays on the main thread. Page views use the settled project snapshot while the active editor displays live input. Composition and drag selection defer redistribution.

Autosave remains approximately 500 ms and keeps the existing revision-safe project/bank endpoint. A persistence worker receives one seed on open and subsequent immutable-branch patches. It serialises requests, parses canonical server responses and compares them off the main thread; the UI applies a small acknowledgement patch. Saves coalesce, and edits made during a save remain pending for the next revision. There is a compatibility fallback when workers are unavailable. Recovery checkpoint and bank conflict policies are unchanged.

Export flushes the current document, requires a successful save, checks the layout generation and edition, settles fonts and assets, and rechecks the generation before printing. Failed layout keeps the editable document and last valid pages, with retry in the status bar. Save state and layout state remain separate.

## Verification

The run receipt, frozen project hashes, browser reports, timing profiles and render evidence are local under `.booklet-work/word-studio/`. Browser mutation checks use isolated project copies and intercept their save endpoints, including worker requests. They must never write the accepted project files. Incremental layouts are compared with fresh pagination for all five editions.

The normal public build continues to exclude the local authoring route. Set `VITE_BOOKLET_STUDIO=true` for a production authoring build on the local authoring server; this also permits profiling the optimised code. The temporary local `booklet-word-workspace=off` preference is a development chrome escape hatch, not a project migration.

Production typing benchmarks on the recorded Windows 11 machine (Ryzen 7 7800X3D, 31 GiB RAM, Chrome 153, 1700 × 1100 viewport):

| Book | Samples | p95 paint estimate | Layout settled after last input | Editor / page mounts |
| --- | ---: | ---: | ---: | ---: |
| Volume for 8MAT6 | 22 | 9.7 ms | 279.4 ms | 0 / 0 |
| Index Laws, native equation | 21 | 47.6 ms | 421.5 ms | 0 / 0 |
| Linear Relationships | 22 | 11.3 ms | 297.5 ms | 0 / 0 |

The estimate measures input to the following animation frame after the first frame callback (prose starts at beforeinput; mathematics at keydown). Browser Event Timing was also collected. No >50 ms long tasks occurred during the recorded ordinary typing/settling windows. The same Linear editor was reattached once, not recreated. These are local samples, not a guarantee for every machine or document. The baseline used first-frame timings only, so no paint-speed ratio is inferred. The profiles precede the final standalone Tab and SVG paint-bounds corrections; neither changes the measured transaction path.

All 845 regressions pass, including five-edition incremental/full pagination parity, project/bank conflicts, revision-safe persistence, diagram contracts and warning-free Svelte compilation. Browser checks cover real Chromium IME composition (no intermediate composition save), cross-page and virtualised selection, paragraph splitting/joining, save concurrency, native maths retention, spacing preview/cancel/undo, question moves, Word list/table paste, unsupported-equation fallback, plain text, document search, themes, enlarged controls and actual reload. Standalone MathsEditor and equation reliability checks pass. The public and local authoring production builds pass with the existing bundle-size advisory. Repository storage checks include both indexed files and proposed working-tree additions.

All five trigonometry PDFs (64 / 4 / 35 / 68 / 99 pages) pass diagram, geometry, footer and navigation checks. Visual review covers every page, reusing identical page-body rasters by hash. Final affected-page/neighbour review covers 138 selected pages across the other six current projects (454 exported pages), including every flagged diagram viewport or label-pair location and its neighbours. The source and PDF hashes, reviewed page numbers and findings are recorded in the run receipt. All seven current project hashes and the bank files remain unchanged.

Cold preparation still compiles uncached native diagrams and can take minutes in large books; the responsiveness targets apply after opening. An existing Volume cylinder Key Ideas continuation was reproduced with the original renderer: all four isolated comparison pages have identical text and pixels. This overhaul preserves its content and stored layout settings.

For PDF word-bound checks, Poppler remains the default. Environments without Poppler can set BOOKLET_PDF_PYTHON to a Python executable with PyMuPDF installed; BOOKLET_PYTHON_LIBS optionally names its module directory. The alternative supplies actual printed word bounds to the same page-overflow and 3 mm footer-clearance checks. Generated PDFs, caches and benchmark traces remain local.
