# Annotated equations, Key Ideas and PDF cloze — 6 September 2026

Booklet Studio now supports native `annotated-equation` document blocks through the focused MathsEditor. Choose **Insert → Annotated equation**, edit the equation, select a term and choose **Add annotation**. Annotation labels are ordinary editable paragraphs with maths. Properties provide booklet colours, above/below placement, arrows, brackets, highlights and reattachment of missing targets.

Term anchors use stable identities and source ranges, distinguishing repeated occurrences. Edits outside an anchored term move its range; edits that remove or replace it retain the annotation and display a repair warning. Rich clipboard copies remap both anchors and label identities. Plain-text export explicitly reports annotation information as lossy. Native equation typing updates the draft without replacing the focused input; undo groups a field edit and suppresses stale field events while restoring history.

Shared implementation was made in the standalone `D:/WebApps/MathsEditor` project and synced as pinned release **1.5.0**. MathsEditor uses MathLive for focused editing; booklet/PDF rendering uses KaTeX with only generated anchor IDs allowed. Arrows are measured SVG paths, refreshed after layout and fonts settle. Equation and label content remains in `.document` storage.

Converted the two formula callouts on source pages **29 and 73**, preserving their wording and original TikZ in source evidence. The initial input was revision 27. During implementation the user saved newer edits; adoption merged only those two unchanged source diagrams into revision 42 and saved **revision 43**. All other **235 blocks** matched the immediate pre-adoption snapshot exactly. The migration checks the formula targets and uses revision conflict protection. Later user saves remain independent of this export snapshot.

**Show Key Ideas answers** is now an independent PDF/configuration switch, off by default. It controls the canvas and full-book print view regardless of short/worked practice mode. Use **Save as defaults** to retain the choice for this booklet. Key Ideas blocks are excluded from the compact independent-practice answer key.

Cloze leaders now use fixed vector circles with a **0.13 mm radius and 0.8 mm pitch**, shared by native and legacy cloze renderers. This avoids Chromium's width-dependent dotted-border appearance. Leaders are positioned outside text flow, preserving writing widths; house-style table response cells still omit redundant leaders. The existing house-style version retains its intended dotted appearance.

## Checks and evidence

- **413 repository tests** and **15 standalone document-model tests** pass. Regression coverage includes range tracking, removed targets, rich-copy identities, narrowly allowed render anchors, vector dots and independent Key Ideas answers.
- `check-annotated-equations.mjs` uses the real 93-page snapshot with intercepted writes. It checks actual keyboard equation editing, undo, term replacement warnings, new annotations, placement, booklet colours, label editing, save/reload, read-only controls, Key Ideas independence and saved defaults.
- The existing document-editor browser suite passes prose/maths history, table boundaries, arrows, crop, rich clipboard, reload, read-only and print checks. The production build passes with the existing bundle-size advisory.
- Student and worked PDFs contain **93 pages** each; short answers contain **30**. Final metrics show **zero detected collisions** and successful TikZ rendering for retained diagrams. Visually checked both converted formulas, all seven Key Ideas sections and pages containing the user's intervening edits. Inspected the printed cloze section at high resolution to verify identical dots across different leader widths.
- Evidence is in `output/annotated-equations/`: preserved inputs, adoption record, candidate snapshot, browser results, print metrics, rendered pages and test/build logs. Final PDFs are under `output/pdf/`.

The booklet retains its existing review status. Native conversion and implementation checks do not grant mathematical or curriculum approvals, and original diagram evidence remains available.
