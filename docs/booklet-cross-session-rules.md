# Cross-session transcription and rendering rules

## Sentence-case headers and native table structure (4 October 2026)

Use sentence case for displayed section, teaching-box and table headers, preserving proper names, acronyms, syllabus codes, case-sensitive unit symbols such as km and mL, and native mathematics. Retain original source headings in evidence. Store the chosen text; do not impose case with CSS. Generated exercise headings and shared teaching-header defaults follow the same convention.

Keep opening syllabus content unboxed beneath the shared Syllabus content section header. Teaching templates supply their own outer panel: prose and formulas do not need another inner card or one-column bordered table. Preserve actual mathematical tables, calculator displays, meaningful paired work and dedicated response regions.

Keep grouped headers and data rows in one native editable table, with meaningful spans and stable answer-owning parts. Do not imitate a table using a separate header table and one table per part. House label cells use blue `#d3e8fc` and grey `#cccccc` borders; preserve colour where it carries mathematical meaning. Single-column tables require a mathematical or response purpose rather than automatic removal. New teaching activities require explicit authorisation. Header-cell roles, centred statistical tables, pictograms and answer-table alignment follow the [table conventions](booklet-table-conventions.md).

For a response table taller than a page, `flow.tableContinuation` explicitly maps each body row to its stable answer part using `tableId`, `headerRows` and `rowPartIds`. Printed fragments retain whole owned rows and repeat the header; Studio opens the complete canonical table for editing. Preserve meaningful figure arrangements when consolidating rows. Do not shrink writing space to force a long table onto one page.

The opt-in house-authoring validator rejects fragmented tables and boxed syllabus content; ambiguous single-column tables are reported for the existing content review. Historical authoring packets remain pinned. Layout and writing-space acceptance still requires final-size PDF inspection: screen measurements alone are insufficient.

> Future runs with `textbook-three-pass-v1` use [three-pass imports](booklet-three-pass-import.md), which supersede conflicting approval stages and exhaustive visual/audit requirements here. Historical runs keep their existing policy.

This register consolidates earlier recorded user feedback for every future booklet and every applicable occurrence. Read it with the [acceptance checklist](booklet-transcription-feedback-checklist.md), [compact import workflow](booklet-direct-compact-import.md) and [worked-solution contract](booklet-worked-solution-style.md). This is an audit of repository feedback records and instructions, not a claim to have retrieved every historical conversation or visually rechecked every existing book.

## Precedence and scope

### Preset arrangements, templated diagrams and avatars (4 October 2026)

Source appearance is evidence, not a layout target. Reproduce content, order,
mathematical structure and meaningful relationships; apply house style to
everything else. These defaults apply to future imports and authorised feedback
repairs. Accepted projects are not migrated on load.

**Preset arrangements.** Teaching and practice content uses the shared
arrangement presets. A custom arrangement is used only where position carries
mathematical or instructional meaning (paired figures, matching activities, card
placement, a diagram that working must sit beside), and that meaning is recorded.
Source placement alone is not a reason. Presets keep the per-part handwriting
estimate and all instructional content. This supersedes source-relative
placement as the default, including the Volume prevention wording and the
"before/after/beside diagram order" row below; explicit local exceptions remain.
The supporting comparison found that accepted Operations pages rebuilt regular
source grids as independent column stacks, leaving rows misaligned between
columns.

**Paired Worked Example | Your Turn.** Use one question block: a borderless
one-row heading table ("Worked Example", "Your Turn") in the root prompt, then a
two-column part grid alternating worked part and your-turn part. Nothing in this
layout prints a border, box or arrangement rule. Parts carry no letters unless
the source prints them. A given equation and the working that follows from it
share one aligned block, with the given as the first row in ordinary ink, so
their relation signs line up as in the source. Lines that do not follow from the
previous line are independent and stay as separate lines; Earning Money's
sliding-scale commission example (labelled 5%, 7% and total-pay calculations) is
the reference for that case and is correct as it stands. Never build paired rows
from one-cell bordered tables, a block per row or a separate heading block.
Inverse Functions p7, Earning Money pp26–27 and p50, and Rates p36 were repaired
on 4 October 2026.

**Templated diagrams.** A source diagram in a supported family (number line,
fraction bar or grid, fraction circle, blank grid) is authored from the shared
parameter model. Its mathematical content is reproduced exactly: range, ticks,
marked values, shaded parts, labels and givens. Proportions and size follow the
template. Other diagrams, and any case where a template would lose a
mathematical feature, use free-form TikZ. Typography, stroke, palette and
shading contracts are unchanged.

**Decorative images and avatars.** Omit mascots and illustrations with no
instructional or mathematical content, keeping everything they say as editable
text and recording the omission against the source inventory. Explain-the-mistake
and speech-bubble characters use the standard avatar set (source file
`D:\OneDrive\Admin\Templates\Avatars.pptx`, 14 avatars), assigned in order of
first appearance within each booklet so a character keeps one avatar throughout.
Keep the 17 mm portrait width and 5 mm gap. This supersedes cropping source
portraits for new work. Keep the character's name and any image a question
depends on.

**Source difficulty pictograms (8 October 2026).** Chillies, stars and similar
markers printed beside a question number are source evidence only. Never
transcribe them into a prompt, answer or diagram: Studio shows its own
printed chillies under the question number from the reasoning score (65+ one, 80+ two, 87+ three,
94+ four), so a transcribed marker would appear twice. Record the source count
against the inventory entry. Presentation readiness rejects a chilli in rendered
content (`sourceDifficultyPictograms` in `src/lib/booklet-difficulty-headings.js`).

Implementation: new run configurations set
`authoringPreferences: "house-presets-v1"`; see
[three-pass imports](booklet-three-pass-import.md). The presets are the existing
default semantic layout (`layout:"grid"` with `columns`, and `diagramPlacement`),
whose row grid keeps parts in a row aligned. Template generators are in
`src/lib/diagram-templates.js`, avatar assignment in `src/lib/booklet-avatars.js`
and the 14 shared images in `public/booklet-assets/shared/avatars/`. Standard
avatars are house assets and need no raster-exception review; retained source
images still do. The templates have been compiled with the TikZ engine but not
yet inspected at final size inside a booklet: include each family used in the
early layout sample of the first import that adopts them.

No review stage, quality gate, spacing rule, cloze or table convention changes.
The effect on import time is unmeasured; compare authoring minutes per block,
feedback and visual findings per 100 blocks, export runs and failures, and the
share of templated diagrams and preset arrangements on the next comparable
accepted import. Native SVG rendering was considered and not pursued: TikZ
compilation was 18 of 137 export minutes across the six FDP booklets.

### Cloze styles and source tables (4 October 2026)

Ordinary completion blanks use **editable native dotted clozes**, including when
the source uses outlined boxes. Use the shared handwriting-sizing rule for each
expected response; consistency does not require equal widths for different
responses. Preserve operand positions, signs, response metadata and sufficient
writing capacity, including blanks in fractions and exponents. Keep boxes only
for a specific mathematical or response purpose, such as card placement,
dedicated writing regions or meaningful table cells. Source decoration alone
does not justify a box. Honour an explicit local user instruction to retain one.

Keep source tables as **native editable tables**, preserving their rows, columns,
givens, reading order and meaningful borders. Do not reconstruct table cells as
separate cards. Bordered response cells provide their own writing region and
normally contain no dotted leaders or duplicate response boxes. Preserve actual
card activities as cards. The Integers magic squares are an explicit user-requested
table conversion from separate source boxes, not evidence that all source cards
should become tables.

These defaults apply to future imports and authorised feedback repairs. Preserve
original source evidence and record intentional departures; do not migrate
accepted projects automatically on load. Apply the existing scoped verification
rules without adding a review stage. This supersedes older blanket instructions
to preserve outlined missing-value boxes.

### Graph sizing and user-directed compact layouts (2 October 2026)

Size graphs for the information or student drawing they must carry, rather than
stretching them to the available page or column width. For newly authored routine
supplied question graphs, start around **70 mm wide**; for simple short-answer
graphs, start around **50 mm wide**. These are reference sizes, not maximums or
automatic acceptance thresholds. The Further Transformations repairs used
50–65 mm short-answer widths and reviewed 75 mm question exceptions; see the
[retained sizing decisions](../booklets/provenance/further-transformations-layout-2026-10-02.json).

Increase width where required for complete labels, ticks, intercepts, asymptotes,
multiple curves or other assessed features. Ordinary native labels remain 10 pt,
with graph ticks at their existing 8.5 pt default or reviewed 8 pt exception.
Resolve crowding through placement or appropriate size, never smaller fonts,
lost mathematical features or changed coordinate ranges solely to fit. Blank
grids students must draw on need sufficient drawing space; a small supplied
answer graph is not their sizing template. Preserve meaningful paired figures.

Question placement and short/worked answer widths remain independently editable.
Store answer changes using the existing edition-specific diagram-width controls;
do not shrink worked solutions implicitly when sizing short answers. Preserve
manual overrides and accepted project layouts on load or duplication. Existing
oversizing repairs use the scoped change runbook and revision-safe save.

Check a simple graph and a dense graph within the existing early layout sample,
then include applicable dense/flagged graphs in the existing selected final-size
review. Check readability, clipping and drawing capacity. Add no separate sizing
approval, routine model call or whole-book export for this convention alone.

Compact-layout tuning remains user-directed: import-efficiency work must not
introduce a new automatic compact-spacing policy or discretionary reductions in
gaps, padding or minimum heights. Existing house style, source fidelity and
required handwriting space still apply. Oversized-graph prevention is expressly
included in future authoring.

### Opening syllabus and multiple-choice options (25 September 2026)

Keep all syllabus content in one editable block at the start of each booklet, with its source outcomes, focus statements and bullets intact. The shared section header remains separate from that content block. Preserve original source blocks and review evidence when consolidating existing projects.

Render all multiple-choice option letters in uppercase bold, including table and parallel layouts. Keep option wording at its source-supported weight. The local Data Classification number plate omits its state slogan and uses an enlarged 14 pt identifier; this is an explicit feedback exception for that figure only.

### Adaptive back-of-book answers (16 September 2026)

All current and future compact short-answer editions use two 9 pt columns with
an 8 mm gutter and measured three/two/one-entry rows within each column, with
3 mm between cells. Preserve full labels and reading order. Explanations,
methods, tables and diagrams use the full column width. Short answers have no
grey divider rules between questions or parts; keep exercise separators and
meaningful table/diagram borders. Retain the final result and add one concise,
booklet-supported method sentence where useful for harder questions. Existing
worked-solution presentation and question pagination settings remain intact.
Row measurement, pagination, caching and the reviewed migration are described in
[adaptive back-of-book answers](booklet-adaptive-short-answers.md).

### Edition review (16 September 2026)

Feedback-maintenance precedence: select only the checks required by the [minimum verification matrix](booklet-change-runbook.md#minimum-verification-for-feedback-maintenance). Ordinary repairs do not create a new import settlement. Conditional diagram, bank, interaction and edition checks replace blanket reruns; preserve source/teaching fidelity and audit shared causes across applicable books. The full-acceptance requirements in the next paragraph apply only when full acceptance is required.

Use [scoped checks](booklet-change-runbook.md) for ordinary edits and editor-only changes. Required full acceptance retains all five automated export checks, with [unique-layout visual acceptance](booklet-review-first-workflow.md#unique-layout-final-acceptance): inspect the three standalone layouts completely, verify duplicate combined bodies using exact actual-PDF pixels, inspect exceptions/covers/answer boundaries, and explicitly check combined contents, transitions, numbering, every footer and links. Matching bodies can inherit only current completed standalone inspection, never an automatic/source-hash pass. This supersedes earlier blanket five-edition rereading requirements, including trig-specific wording. Full manual review remains supported. New settlements require fresh actual inspections and composition review; source, mathematical and teaching/arrangement gates remain independent.

### Activity correctness markers and numbered working (13 September 2026)

All current and future activity correctness ticks and crosses use 14 pt at final
printed size, with standard green/red semantic colours. Author native maths with
`semanticRole: 'correctness-marker'` using `correctnessMarker` in
`public/libs/maths-editor/teaching-style.mjs`. Multiplication signs are ordinary
maths and must never acquire this role. Preserve the role through rich editing,
clipboard, save/reopen and print; avoid embedded LaTeX size commands.

Numbered teaching calculations keep a separate left-aligned red number gutter
and blue working aligned at relation signs. Use `numberedTeachingWorking` from
the same shared authoring module; a null number continues the preceding step.
Retain all equations, annotations, fraction separation and writable scaffolds.
Do not place numbers inside the right-aligned equation left-hand-side column.
This does not recolour ordinary practice short answers or explanatory Key Ideas
numbered lists.

Booklet Studio exposes arrangement and spacing through **Spacing**.
Its question-wide controls, selected object controls, paragraph settings and
detailed arrangement entry share one panel. Table row minimum heights and cell
padding belong here too: paragraph spacing cannot override a taller table row.

Related teaching equations use explicit, source-reviewed `equationAlignment`
metadata on each example. `mode: 'relation'` aligns the black prompt and supplied
response at their relation signs; `align: 'center'` centres the complete pair.
`mode: 'continuation'` reserves an equals-sign gutter in the initial expression,
matching the right-hand expressions of subsequent working. The renderer derives
display values from separately editable prompts and solutions. Independent
equations and source-centred demonstrations retain their own arrangements.
Compare fraction baselines, row heights and the whole teaching box in the PDF.
Align question labels to the first text baseline only when the leading content is
text or a paragraph. Diagram, table and structured-layout prompts keep their label
at the top; an SVG's bottom baseline must not pull its label below the figure.

Explain-the-mistake portraits follow the Index Laws convention: an editable crop,
17 mm printed portrait width, proportional height and 5 mm character-to-bubble
gap. The native speech-bubble template uses a fixed character track. Statement
widths exclude the character and gap. Preserve original image files; review each
project and bank occurrence at final size. Logarithms page 47's compact paired
operations are a local source arrangement, not a global table-spacing change.

Answer-diagram widths can be legacy numbers or `{short, worked}` values in
`compactAnswers.diagramWidths`. A resize changes the current answer layout and
its combined edition. Explicit widths override default caps within the available
column; mathematical diagram edits remain shared. Verify code edits, resizing,
keyboard deletion, undo/redo and save/reopen while retaining the rendered mode,
content fragment and viewport offset. Failed commits keep the draft open.

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

### Open responses and question-part borders (13 September 2026)

Do not convert ordinary unruled exercise response space into clozes. Clozes are
for source-supported completion blanks and mathematical scaffolds, sized for the
missing response. A complete open-response prompt does not acquire an appended
cloze or empty line. Retain separately intended working areas and explicit local
exceptions. Probability revision 39 feedback selects compact spacing when removing
its extraneous clozes.

Question-part arrangements and tables used only to lay out independent parts are
borderless, even when the source shows separators. Preserve meaningful columns,
reading order and working space. Keep borders in actual value/comparison tables,
dedicated writable boxes and solutions. Shared rendering must continue to support
those legitimate bordered structures; do not suppress all borders with CSS.
Part labels keep a 7 mm indent for each labelled ancestor wherever a part is
placed; see [question part indentation](booklet-question-part-indents.md).

The [Volume feedback prevention rules](booklet-volume-feedback-2026-09-12.md#prevention-in-future-work) extend this register to source-relative diagram/calculation/photo arrangements, equal scaffold starts, anchored formula annotations, isolated cut orientation and curved/composite silhouettes. Retain source-supported placement, with house-style dotted writing blanks and shared headers. The named Volume repairs retain their local dimensions; do not copy those dimensions into unrelated books. Since 4 October 2026 the [preset arrangement rule](#preset-arrangements-templated-diagrams-and-avatars-4-october-2026) decides placement: keep a source arrangement only where position carries mathematical or instructional meaning.

Question-side numbered exercise headings appear once at the start of each exercise, never again at source-page sections, teaching checkpoints or pagination continuations. This applies to all current compact books and future transcriptions. `flowEditionSections` derives the first non-empty practice section per topic without changing stored content; compact answer columns retain exercise context. Regression coverage in `booklet-compact-exercises.test.js` includes all active books and joined/separate sections.

Most table, cloze, graph and layout rules already exist in the shared `public/libs/maths-editor/house-style.mjs` and renderer/QA. Their discovery was fragmented between Linear feedback, graph reports and newer Index instructions. The main checklist and AGENTS.md now link this register.

The older exact-transcription prompt said to retain graphical material as assets by default, conflicting with the later native-diagram requirement. It now distinguishes preserved source evidence from the active rendered representation. Shared authoring guidance also clarifies that source alignment and semantic colours are preserved, borderless tables are not value tables, and specific repairs do not become universal dimensions.

Completion still requires independent source comparison, content reconciliation, presentation review and rendered checks. A policy being documented or a shared helper existing is not proof that every imported occurrence follows it.

Primary records: [Linear feedback](archive/linear-booklet-feedback-2026-09-06.json), [house style](booklet-house-style-1.1.md), [graph typography](archive/booklet-graph-typography-2026-09.md), [graph strokes](archive/booklet-graph-strokes-2026-09.md) (current rules: [diagram typography](booklet-diagram-typography.md#graph-scales-and-tick-labels)), [compact style](booklet-compact-exercise-trial.md), [Index feedback](../booklets/provenance/index-laws-complete-v1/feedback-review.md).

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

Use the [revision 198 prevention rules](booklet-volume-feedback-r198.md) for shared exercise/main headings, editor-only source difficulty labels, single opening question numbers, equation row spacing, empty-paragraph deletion and image spacing. Preserve substantive continuation instructions and intentional blank lines. The accepted exercise reference is Linear Relationships v1, not a new left-aligned style. Heading text follows the sentence-case rule at the top of this register, which replaces the uppercase wording in that record.


## Exercise starts and layout spacing (13 September 2026)

Every exercise opening in a questions edition starts on a new page, including
when teaching and practice sections are stored as joined. This supersedes the
earlier mid-page exercise-start convention for current books and future imports.
Show the exercise heading once; checkpoints and continuations do not create
additional exercise breaks. Compact answer pagination is unchanged.

Layout containers default to borderless; explicit meaningful borders, individual
card outlines and actual table cells retain their own border controls. In Studio,
select the question, open **Spacing → Detailed arrangement…**, select
the row/group in **Question structure**, and adjust **Minimum height (mm)**.
Zero fits content; **Gap (mm)** controls separation between children. Separate
answer spaces and table row heights can also reserve writing room.

## Question-part separators and practice teaching headings (15 September 2026)

Question arrangements never draw borders between question parts, including imported
arrangements with explicit internal rules. The shared arrangement resolver suppresses
these separators across current books, bank previews, answer editions and future
imports. Preserve real table-cell borders, individual card outlines and teaching-panel
outlines. Keep original source rules as evidence; source appearance does not override
this convention. Logarithms v1 page 3 is the reference example.

Practice teaching blocks use the shared **Guided Practice** heading regardless of the
source heading. Preserve source activity identity and original labels in source evidence.
This does not rename exercise sections or change which questions enter answer editions.

Teaching-panel grids must allow their content column to fit the available width;
minimum-content sizing must not push tables into the margins. The tighter margins and
table after-spacing accepted for Logarithms page 4 are local, not global defaults.


## Shared-stem question groups and working space (17 September 2026)

Group related source items under their shared instruction or definition as one editable question with a, b, c parts and a native grid, even when the source numbers them individually. Preserve meaningful range, exercise and category boundaries, nested parts and original source identities in provenance. Renumber displayed questions within each exercise. Generate/review worked solutions first and estimate per-part handwriting space from mathematical steps (including TeX rows), cell-width wrapping, fractions and required drawings; save editable estimates and retain manual overrides. Inspect representative grids at final size, including pagination. Do not repeat the stem per item or use question-type allowances alone. See [practice-only import contract](booklet-practice-only-import.md).
