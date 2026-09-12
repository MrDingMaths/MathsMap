# Cross-session transcription and rendering rules

This register consolidates earlier recorded user feedback for every future booklet and every applicable occurrence. Read it with the [acceptance checklist](booklet-transcription-feedback-checklist.md), [compact import workflow](booklet-direct-compact-import.md) and [worked-solution contract](booklet-worked-solution-style.md). This is an audit of repository feedback records and instructions, not a claim to have retrieved every historical conversation or visually rechecked every existing book.

## Precedence and scope

Use the [booklet change runbook](booklet-change-runbook.md) for efficient execution: inspect representative cases early, iterate on affected pages and neighbours, reuse valid evidence, settle inputs before final checks, and record actual costs. Existing source-fidelity and required complete final review gates remain in force.

Current user instructions take precedence. Apply explicit general house-style choices to new imports; preserve source mathematics, pedagogical meaning, ordering and evidence. Record any intentional departure from source appearance. Specific dimensions, topic methods, source palettes, deletions and merges are not universal defaults. Existing projects retain their content and pagination settings unless a change is authorised; this does not exempt shared rendering defects from general fixes. Historical run evidence stays unchanged.

## Required checks carried forward

| Convention | General requirement | Earlier record |
| --- | --- | --- |
| Handwriting | Dotted cloze; size for the exact missing response, excluding supplied prefixes. Estimate 2.2 mm per written character plus 6 mm, minimum 8 mm; allow fractions and signs. Long responses need multiple lines 8 mm apart. Unknown expected responses require review. Do not use the entire worked solution as blank-sizing metadata. | Linear feedback 03, 32–33, 36, 40, 51; house style 1.1 |
| Key Ideas | 1.5 prose line spacing, number beside first text line, hanging continuation alignment. Inline cloze supplies its own response area; do not add generic working space. | Linear feedback 02; Index checklist |
| Value tables | Native maths for variables and numbers. Wider descriptive labels and compact numeric columns; start at 44 mm and 10 mm respectively, then measure rather than force widths. Use the accepted blue label fill and grey borders. Preserve borderless alignment tables and meaningful semantic colour. Narrow grey skipped-value cells are distinct from blank response cells. No redundant underlines inside response cells. | Linear feedback 09–10, 13, 18–20, 22–23, 28–29, 48; house style 1.1 |
| Complete scaffolds | Preserve arrows, constant circles, highlighted terms, intermediate working, construction lines, intersection points, equation labels and verification space. A correct final expression does not replace the teaching scaffold. | Linear feedback 17, 21, 38, 45–46, 49, 51; focused 02 |
| Question identity | Numbers and part labels are structural, outside editable prompt prose. Preserve source-supported before/after/beside diagram order, meaningful full-width follow-up parts and real tab alignment. Remove accidental duplicated headings/stems; continuations retain identity without repeating the entire stem unnecessarily. Exam attribution appears once on its own question. | Linear feedback 06–08, 11, 14, 22, 26, 37, 41, 44, 49–50; source presentation v2 |
| Equations | Align successive working at relation signs; independent equations are not a calculation chain and need their own source-supported alignment. Left-aligned question prompts must not inherit centred table-cell alignment. Preserve meaningful colour, annotations and all steps. Fraction-row spacing is shared across books. | Linear feedback 12, 38, 42, 52; Index checklist; solution contract |
| Native diagrams | Reconstruct known mathematical graphs, blank grids, number lines and representable geometry natively. Plot known equations mathematically, not by tracing pixels. Preserve originals as evidence; uncertainty must be recorded, not guessed. Necessary active images require occurrence-specific reasons and final-size review. | Linear feedback 25–27; diagram reconstruction v4; Index native-maths follow-up |
| Graph readability | Final printed ticks 8.5 pt (8 pt for reviewed crowding); other labels 10 pt. Move colliding labels or reflow instead of repeatedly enlarging/shrinking all text. Preserve source scale/tick presence independently of grids. Omit the letter O at Cartesian origins; preserve named points elsewhere. | Graph typography convention; reconstruction v4 |
| Graph strokes and palette | Final weights: plots/geometry 0.8 pt, axes 0.5 pt, ticks/guides 0.4 pt, major grid 0.25 pt, minor grid 0.15 pt. Shared graph palette: black axes, grey grid, blue/red/green series with matching legends. Preserve dashes, arrowheads and semantic annotations. Source shades are evidence only; all rendered colours use the standard booklet palette. | Graph stroke convention; shared house style |
| Images and editor parity | Crop, grayscale, size and alignment must agree in focused editing, preview, saved/reopened content and print. Preserve original assets. Resizing should preview locally and commit once on release; Escape cancels. Saving must retain subsequent edits. | Linear feedback 01, 04–05, 24, 30–31, 43; focused 06 |
| Page fit | Remove duplicated margins before changing layout. Preserve handwriting space and readable text/diagrams; reflow or continue rather than shrink to fit. Wait for fonts, images, TikZ and annotations. Check all reserved spaces, nested content and at least 3 mm footer clearance in preview and actual PDF; check each edition and navigation separately. | House style 1.1; compact specification |
| Answers | Use the booklet's taught method, concise student-facing working, native aligned calculations, exact arithmetic until requested rounding, units and required reasons. Keep student prompts separate from teacher answer evidence. Preserve source-given worked demonstrations; practice answers must not leak into questions. | Worked-solution contract; student/teacher evidence contract |

Source-specific corrections remain source-specific: deleting a supplied column on Linear p17, a particular 25 mm tab stop, merging selected questions, Index source-page boundaries, and individual mathematical corrections. Generalise the underlying checks (fit, alignment, fidelity), not those edits.

## Redundant measurements (10 September 2026)

Retain redundant numerical measurements in source diagrams: identifying which givens are needed is a skill being assessed. This applies across booklets. Redundancy alone is not a reason to remove a given or replace it with a symbolic label. When measurements are mathematically inconsistent, retain their roles and record any confirmed numerical corrections; uncertain replacement choices remain open for review. Preserve original evidence.

## Review groups (9 September 2026)

Use one existing Review heading and enclosing panel per teaching group, preserving its palette. Number top-level prompts 1, 2, …, restarting within each source activity group (`sourceAtom.id`). Even a single prompt has number 1. Retain subpart labels and the original number on continuations. Review numbers are presentation labels, independent of practice numbering and stored source order. Do not print small checkboxes or embed checkbox glyphs in prompt prose. Preserve mathematical writing boxes. This user-requested house-style change applies to Linear Relationships v1, Index Laws and future booklets. The shared teaching-label helper supplies numbers in editing, preview and print, including saved arrangements; teaching-answer controls keep their existing behaviour.

`scripts/booklet/normalise-review-prompts.mjs` audits both current books and removes leading source checkbox glyphs with `--apply`, syncing only affected owner questions through the shared bank transaction helpers. Historical source evidence and archived projects retain their original appearance.

Verification: all 26 prompts across Linear's 6 groups and Index Laws' 8 groups have been checked. Five embedded Linear checkbox glyphs were removed and the five owner questions report synced; Index Laws required no content edits. All 85 targeted label, arrangement, flow, compact-exercise, measurement, source-presentation and bank-sync tests passed, as did the production build. `scripts/booklet/check-review-numbering.mjs` verified every prompt's number/alignment, an existing custom arrangement without its label, inline edit/save/reload and teaching-answer controls using isolated in-memory copies. Practice-only answer editions contain no Review groups. Full question PDFs (Linear 92 pages; Index Laws 65 pages) passed DOM and printed geometry checks. Every Review page was visually inspected: Linear 3, 12, 14, 41, 49, 80; Index Laws 3, 9, 16, 21, 25, 31, 49, 56. Local PDFs, rendered page images and browser reports are in `.booklet-work/review-numbering/`.

## Audit findings and enforcement

The [Volume feedback prevention rules](booklet-volume-feedback-2026-09-12.md#prevention-in-future-work) extend this register to source-relative diagram/calculation/photo arrangements, equal scaffold starts, anchored formula annotations, isolated cut orientation and curved/composite silhouettes. Retain source-supported placement, with house-style dotted writing blanks and shared headers. The named Volume repairs retain their local dimensions; do not copy those dimensions into unrelated books.

Question-side numbered exercise headings appear once at the start of each exercise, never again at source-page sections, teaching checkpoints or pagination continuations. This applies to all current compact books and future transcriptions. `flowEditionSections` derives the first non-empty practice section per topic without changing stored content; compact answer columns retain exercise context. Regression coverage in `booklet-compact-exercises.test.js` includes all active books and joined/separate sections.

Most table, cloze, graph and layout rules already exist in the shared `public/libs/maths-editor/house-style.mjs` and renderer/QA. Their discovery was fragmented between Linear feedback, graph reports and newer Index instructions. The main checklist and AGENTS.md now link this register.

The older exact-transcription prompt said to retain graphical material as assets by default, conflicting with the later native-diagram requirement. It now distinguishes preserved source evidence from the active rendered representation. Shared authoring guidance also clarifies that source alignment and semantic colours are preserved, borderless tables are not value tables, and specific repairs do not become universal dimensions.

Completion still requires independent source comparison, content reconciliation, presentation review and rendered checks. A policy being documented or a shared helper existing is not proof that every imported occurrence follows it.

Primary records: [Linear feedback](linear-booklet-feedback-2026-09-06.json), [house style](booklet-house-style-1.1.md), [graph typography](booklet-graph-typography-2026-09.md), [graph strokes](booklet-graph-strokes-2026-09.md), [compact style](booklet-compact-exercise-trial.md), [Index feedback](../booklets/provenance/index-laws-complete-v1/feedback-review.md).

## General diagram ink (11 September 2026)

The 12 September 2026 [purposeful shading convention](booklet-diagram-colours.md#purposeful-shading-12-september-2026)
applies to all current booklets, bank content and future transcriptions: unshaded
by default, with minimal shading only for mathematical meaning or demonstrated
final-size clarity. Source shading alone is not justification. Preserve white
occlusion masks, markers and meaningful graph regions. Record exact-source and
occurrence-specific reviews and run the shading audit before acceptance.

Across every current and future booklet and answer edition, ordinary diagram lines and labels use solid black `#000000`. Retain semantic colours and meaningful shading; graphs retain their existing curve/legend/axis/grid rules. This explicit user house-style instruction overrides source-palette fidelity for ordinary geometry. Use the shared [diagram colour contract](booklet-diagram-colours.md), audit every active occurrence, preserve original evidence, and record semantic exceptions by role and meaning.

## Diagram typography and ordinary short-answer ink (11 September 2026)

Every complete native diagram label is **10 pt at final printed size (tolerance 0.1 pt)**, independent of diagram width. The shared TikZ path calibrates whole labels, retaining relative superscripts/subscripts, fractions, rotation and alignment. Graph ticks retain 8.5 pt, or explicitly reviewed 8 pt exceptions. Do not repeatedly scale node fonts. Resolve collisions by label placement or available space; preserve mathematical content, mathematical colour meaning through the standard palette and meaningful arrangements. Raster labels need separate review. Check editing, preview, repeated resizing, page zoom, cached/fresh rendering, save/reopen, answer widths and PDF.

Ordinary practice short-answer prose, native mathematics, answer numbers and part labels inherit **#24282d**, including structured editor content. Do not embed decorative blue. Retain colour with mathematical meaning (series identification and correctness symbols); teaching-page answers, worked solutions and diagram palettes are outside this ink change. Both answer sections remain practice-only. Repair existing content through the revision-safe project/bank transaction, preserving IDs, classifications, local layouts, current edits and source evidence. Record these intentional departures from source appearance. Preserve existing pagination settings. Inspect affected pages and neighbours, then all five trig editions and affected pages elsewhere; check collisions, clipping, writing space, footer clearance and navigation.


Current palette precedence (11 September 2026): all editable content in every current booklet, bank and future transcription uses the [standard booklet palette](booklet-standard-palette.md). Preserve mathematical meaning through standard accents, rather than retaining source shades. This includes teaching responses, worked solutions, fills and backgrounds. Retain original evidence and raster pixels; restored projects require current palette acceptance before export.


Main section-header precedence (11 September 2026): across all current booklets and future transcriptions, main section bands use desaturated blue `#52769a` with white `#ffffff` text through the shared `headerBlue` token. Preserve existing header geometry. Light teaching-group headers and unfilled exercise/answer headings retain near-black text; mathematical blue remains `#268cff`. This overrides the earlier blanket near-black heading rule in palette standardisation.


## Header and continuation prevention (Volume revision 198)

Use the [revision 198 prevention rules](booklet-volume-feedback-r198.md) for shared exercise/main headings, editor-only source difficulty labels, single opening question numbers, equation row spacing, empty-paragraph deletion and image spacing. Preserve substantive continuation instructions and intentional blank lines. The accepted exercise reference is Linear Relationships v1, not a new left-aligned style.
