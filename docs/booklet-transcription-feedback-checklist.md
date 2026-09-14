# Transcription feedback acceptance checklist

This checklist records the user's general feedback from the Index Laws transcription session on 9 September 2026. It is required for every future transcription run, alongside the [direct compact workflow](booklet-direct-compact-import.md). Apply it to every occurrence in every book, including existing books, unless the user explicitly limits the change. A named example is evidence of a pattern, not a scope limit.

## Source fidelity requirements

1. **Alignment in every teaching box:** preserve source paragraph, label, equation and answer alignment. Centred labels remain centred. Check first expressions, first-line equalities and continuation equals-sign columns separately; do not simply left-align every line or centre every equation block.
2. **Speech-bubble spacing:** match the source's spacing above and below the character/bubble row and between the surrounding question paragraphs. Use the shared editable bubble template. Do not inherit large generic diagram or paragraph gaps.
3. **Space before box text:** remove unintended blank paragraphs and stacked template padding, table margins and cell padding. Preserve deliberate source spacing; do not remove all padding indiscriminately.
4. **Source colours:** Ordinary general-diagram lines and labels use black `#000000`; preserve semantic colours and meaningful shading, with graphs following their separate rules. See [the diagram colour contract](booklet-diagram-colours.md). This overrides decorative diagram source palettes. Use the shared standard palette for every editable text run, equation, annotation, fill and background. Map Index Laws source red `#AA0505` to standard red `#ef6068`, preserving its meaning and original evidence. Custom shades fail acceptance. Editor warning styles must not leak into printed content.
5. **Question grids:** preserve meaningful source column counts, row grouping and reading order, including nested subparts. Inventory the source geometry before laying out content; never certify an imported column count by copying it into the review record. Do not default all questions to two columns. Check the resulting pagination; Index Laws Mixed Practice Q5 requires three columns, Exercise 8 Q7b is three columns by two rows, and Exercise 10 Q3 is four columns.
6. **Matching cards:** use editable cards with source-supported widths, spacing, placement and external labels. Avoid stretching small cards across the available page width.
7. **Consistent mathematical typography:** ordinary equations, worked steps and mathematical scaffolds use native editable maths, not screenshots with different fonts or sizing. Power-of-product/quotient arrows use anchored native annotations. Retain original rasters as evidence. A necessary retained raster needs an explicit reason and a final-size visual check.
   Presentation verifier v3 requires an occurrence-specific raster exception; images inside rich-text documents count too. Review the complete scaffold, not just its first expression. For consecutive fraction steps, allow readable vertical separation (the shared equation renderer uses at least 8 pt row spacing across all books and answer editions), preserving larger physical writing-space gaps, colours and equals-sign alignment.
8. **Missing-value boxes:** use native LaTeX boxes with sufficient physical writing space, including in exponents and fractions. Preserve repeated-factor expansions, intermediate powers and final-answer steps. Reflow long working before shrinking writable boxes. Exercise 8 Q2, Q6, Q7a and Q13 are the reference corrections.
9. **Numbered Key Ideas:** keep each number beside the first line of its text, with a consistent label gutter and hanging continuation text. Verify both editable and print views. Inline cloze blanks must not acquire additional working space.
10. **Image alignment controls:** the focused image menu must expose Left/Centre/Right visibly. Block and inline images must also have a usable alignment route. Preserve placement through applying edits, resizing, saving and reopening; never silently reset it to left.
11. **Repeated occurrences and future runs:** a reported problem triggers a whole-booklet search for the same pattern and a shared template/renderer correction when applicable. A local content patch alone does not close a recurring renderer defect.
12. **Syllabus outcomes:** transcribe every source syllabus code together with its complete outcome statement and content bullets. Inventory these separately from the cover and topic titles. The cover's omission of syllabus-summary lines does not authorise dropping the Syllabus Content page's outcomes. Compare the exact code against original evidence; do not infer a replacement from topic names.

13. **Redundant measurements:** retain source-given numerical measurements even when they are not needed for the solution. Identifying which givens are relevant is an assessed skill. Unused is not a defect. Check consistency with the diagram and its stated rounding precision before proposing any correction. Do not delete redundant measurements or replace them with symbolic labels merely to simplify a diagram. Correct confirmed numerical inconsistencies with recorded replacement values while preserving the selection task; keep uncertain repairs open for review.

14. **Exercise headings:** in every questions edition, show each numbered exercise heading once at its first practice section, including starts partway down a teaching page. Source-page sections, teaching checkpoints and pagination continuations must not repeat it. Check the complete rendered booklet, not just the first page of each exercise. Preserve continuous numbering, source sections and pagination settings. Compact answer columns retain exercise context headings.

15. **Question part indents:** every labelled ancestor supplies a 7 mm indent, including custom arrangements and full-width follow-up parts. Check label positions independently of diagram/column placement. Shared rendering restores missing semantic gutters without double-indenting existing nested layouts; see [question part indentation](booklet-question-part-indents.md).

16. **Diagram and working relationships:** apply the [Volume prevention rules](booklet-volume-feedback-2026-09-12.md#prevention-in-future-work). Record source-relative left/right placement of diagrams, calculations and photos, paired-figure rows, and scaffold baseline alignment before layout. Compare isolated cross-sections with the actual cut and verify curved/composite solid silhouettes independently. Use shared annotation and vertical-alignment controls; inspect every complete label and writing blank at final size. Source appearance does not override dotted-scaffold or section-header house style.

## Required completion evidence

- **Purposeful diagram shading:** use unshaded diagrams by default. Retain only
  mathematical region/face/material highlights or a demonstrated final-size
  clarity benefit, using the minimum standard-palette fill. Source shading is
  insufficient evidence. Preserve masks, markers and mathematical graph regions.
  Review every occurrence and retained illustration; pass the source-hashed
  [shading audit](booklet-diagram-colours.md#purposeful-shading-12-september-2026).
  Shading acceptance does not replace solid visibility or final visual review.

For new runs, complete the [review-first gates](booklet-review-first-workflow.md): early mathematical inventory review and bundled editorial decisions; final-size representatives for every distinct layout pattern; numerical triangle construction checks separate from appearance; structured correction propagation and current issue status. Use affected-page/neighbour exports while editing, then inspect all pages in all five editions after content settles. Hash reuse and a representative checkpoint do not replace whole-booklet fidelity checks.

Also complete the [cross-session rules](booklet-cross-session-rules.md): handwriting capacity and dotted cloze, Key Ideas line spacing, numeric-table semantics, graph typography/strokes, complete annotations, question identity, editor/print parity and solution methods. These earlier Linear Relationships requirements apply equally to future subjects; their original feedback category of “specific” does not limit an explicitly recurring problem to that example.

- Inventory applicable occurrences from the original source, independently of the transcription. Record source pages, reviewed expected alignment/colour/grid/dimension values and retained-raster exceptions. An absent feature is checked as not applicable, not silently skipped.
- Compare all applicable occurrences against rendered output at its intended physical size. Check typography, spacing, labels, writing room and reading order as well as overflow. Check source page boundaries when explicitly requested; do not impose Index Laws pagination on other compact projects.
- Record reviewed values in `sourceReview.presentationRequirements`, arrangements and visual audit categories using the direct compact workflow. Never regenerate expected values from the output merely to make a check pass.
- Pass content reconciliation, presentation fidelity and rendered layout checks separately. Run the relevant edition/navigation checks listed in the direct compact workflow. Missing, ambiguous, unchecked or stale evidence remains an open finding; a successful import, matching counts or zero overflow is insufficient.
- For shared editor/renderer changes, run the relevant regression tests and build. `node scripts/booklet/check-index-editing.mjs` checks all 20 Index Laws Key Ideas rows and image centring through apply/reopen without writing to a project. `tests/booklet-arrangement.test.js` covers alignment preservation; `tests/booklet-index-boxes.test.js` covers the native scaffold, card and grid reference corrections. These are regression fixtures, not automatic visual verification of a new source.

The transcribing agent must complete these checks before describing a run as finished. Unresolved source interpretation or visual exceptions must be reported explicitly. Automated checks detect recorded-value regressions; source comparison is still required to establish that those values were correct in the first place.


## Diagram typography and ordinary short-answer ink (11 September 2026)

Every complete native diagram label is **10 pt at final printed size (tolerance 0.1 pt)**, independent of diagram width. The shared TikZ path calibrates whole labels, retaining relative superscripts/subscripts, fractions, rotation and alignment. Graph ticks retain 8.5 pt, or explicitly reviewed 8 pt exceptions. Do not repeatedly scale node fonts. Resolve collisions by label placement or available space; preserve mathematical content, mathematical colour meaning through the standard palette and meaningful arrangements. Raster labels need separate review. Check editing, preview, repeated resizing, page zoom, cached/fresh rendering, save/reopen, answer widths and PDF.

Ordinary practice short-answer prose, native mathematics, answer numbers and part labels inherit **#24282d**, including structured editor content. Do not embed decorative blue. Retain colour with mathematical meaning (series identification and correctness symbols); teaching-page answers, worked solutions and diagram palettes are outside this ink change. Both answer sections remain practice-only. Repair existing content through the revision-safe project/bank transaction, preserving IDs, classifications, local layouts, current edits and source evidence. Record these intentional departures from source appearance. Preserve existing pagination settings. Inspect affected pages and neighbours, then all five trig editions and affected pages elsewhere; check collisions, clipping, writing space, footer clearance and navigation.


Current palette precedence (11 September 2026): all editable content in every current booklet, bank and future transcription uses the [standard booklet palette](booklet-standard-palette.md). Preserve mathematical meaning through standard accents, rather than retaining source shades. This includes teaching responses, worked solutions, fills and backgrounds. Retain original evidence and raster pixels; restored projects require current palette acceptance before export.


Main section-header precedence (11 September 2026): across all current booklets and future transcriptions, main section bands use desaturated blue `#52769a` with white `#ffffff` text through the shared `headerBlue` token. Preserve existing header geometry. Light teaching-group headers and unfilled exercise/answer headings retain near-black text; mathematical blue remains `#268cff`. This overrides the earlier blanket near-black heading rule in palette standardisation.


## Exercise starts and layout spacing (13 September 2026)

Every exercise opening in a questions edition starts on a new page, including
when teaching and practice sections are stored as joined. This supersedes the
earlier mid-page exercise-start convention for current books and future imports.
Show the exercise heading once; checkpoints and continuations do not create
additional exercise breaks. Compact answer pagination is unchanged.

Layout containers default to borderless; explicit meaningful borders, individual
card outlines and actual table cells retain their own border controls. In Studio,
select the question, open **Layout & spacing ? Detailed arrangement?**, select
the row/group in **Question structure**, and adjust **Minimum height (mm)**.
Zero fits content; **Gap (mm)** controls separation between children. Separate
answer spaces and table row heights can also reserve writing room.
