# Direct compact import

Read the [cross-session transcription and rendering rules](booklet-cross-session-rules.md) as well: earlier table, handwriting, graph, attribution and editor-parity feedback remains applicable to every new subject. Shared production authoring prompts carry these rules through `HOUSE_STYLE_PROMPT`; direct compact authoring must perform the same checks.

Every run must complete the [transcription feedback acceptance checklist](booklet-transcription-feedback-checklist.md). Its source comparisons and completion evidence are required, including speech-bubble vertical spacing, all-box alignment, numbered Key Ideas and consistent native mathematical scaffolds. Existing Index Laws regression fixtures supplement, but do not replace, review of the new source.

Implementation fidelity is an acceptance condition, not an agent preference. First inventory each source visual as native maths, editable scaffold/table/card, or a retained-image candidate. Source storage format does not decide output format. An equation stored as a Word image still needs native transcription. Never replace a complete scaffold with only its initial expression.

Feedback applies across all books and every matching occurrence unless the user explicitly says otherwise. Put reusable display behaviour in the shared renderer/editor. `public/libs/maths-editor/equation-spacing.mjs` supplies fraction-step spacing to text maths, rich documents, annotated equations and editor fields; it applies to questions and all answer editions without migrating project files. Do not introduce book-specific spacing defaults. Existing explicit physical writing-space gaps and matrix/diagram rows retain their own layout.

Presentation verifier v3 checks every active raster occurrence, including rich-text inline images. Record `sourceReview.rasterExceptions` entries with `path`, `kind`, `reason`, `evidence`, `checked` and `signature` from `rasterReviewKey(occurrence)`. Allowed kinds are `illustration`, `handwritten-analysis`, `geometry`, `flowchart`, and `authorised-exception` (which also requires `authorization` citing the user's actual instruction). These classifications require source and final-size output review; a label or signature alone is not evidence. Known equation-image nodes are rejected unless explicitly authorised. Generic reasons such as “preserves appearance” do not justify retaining reconstructible maths. Preserved source images in `sourceLayoutEvidence` are excluded from active-image checks.

The author performs the implementation; the acceptance pass compares it with the independently recorded source requirements. Do not refresh reviewed expected values from output just to clear failures. Record user-requested layout adjustments separately with their reason and original values. Report remaining exceptions and stale reviews explicitly. Run content reconciliation, presentation acceptance and final-size visual checks before claiming completion.

The creation path is **source → structured content with evidence → compact project → review/export**. A page clone is optional, and is not an intermediate project. Existing projects keep their settings when loaded, duplicated or saved.

`src/lib/booklet-creation.js` owns new-project presentation defaults. Blank creation, semantic imports and assembly apply that preset. Normalization does not apply it. Imports accept `mode: 'compact' | 'exact'`; compact is the default. Exact mode retains the historical page-based materialization path.

New compact projects also calculate a cover when no existing source cover is present. Its title follows the project; optional `settings.cover` metadata supplies `course`, `book`, `version` and `feedback`. This generated page has no invented source-page identity. Questions editions use calculated exercise and included-answer contents; answer-only editions start with answers. Existing projects do not acquire a cover when loaded.

## Prepare and create

Prepare a fresh source run with `npm run booklet:prepare -- --pdf SOURCE.pdf --docx SOURCE.docx --pages 1-N --run-id RUN`. Keep originals, hashes, extracted media and page images local. Do not overwrite an earlier evidence run.

A semantic candidate has `title`, `topics: [{id,title}]`, and `sections: [{id,topicId,phase,blocks}]`. Phase is `teaching`, `practice` or `front-matter`. Blocks use existing v4 types, with stable IDs and `sourceRefs: [{pageNumber}]`. Parts and diagrams may carry their own references; shared or continued content may reference several pages. Historical candidates with `pages` remain readable through a compatibility adapter.

Record `sourceInventory` independently of the content being laid out:

```json
{
  "version": 1,
  "selectedPages": [1, 2],
  "pages": [{"pageNumber": 1, "inventoried": true}, {"pageNumber": 2, "inventoried": true}],
  "entries": [
    {"id": "source-cover", "pageNumber": 1, "kind": "cover", "exclusionReason": "Replaced by calculated cover and navigation."},
    {"id": "source-q1", "pageNumber": 2, "kind": "question", "targetId": "q1", "teachingContextIds": ["multiplication-example"]}
  ]
}
```

Inventory questions, all parts, shared instructions, diagrams and labels, examples, scaffolds, response requirements and supplied answers. Each entry maps to a target (and optionally a field), or has an explicit exclusion reason. `continuationOf` distinguishes a legitimate continuation from duplicate mapping. `ambiguous` records an unresolved interpretation. Never mark a page inventoried from imported counts alone.

Use `node scripts/booklet/create-compact-booklet.mjs --run-id RUN --input CONTENT.json --project-id ID` to validate a candidate. Add `--apply` to create the editable project. The lower-level import CLI also accepts `--mode compact|exact`. Creation rejects an existing project ID; subsequent editing uses revision-checked project saves.

Source geometry belongs in `sourceLayoutEvidence`. Only meaningful arrangements, dependencies, shared instructions and response spaces constrain the active layout. Explicit author page constraints survive; `sourceLayoutOnly` spacers/breaks and `sourcePageBreakBefore` do not constrain compact layout.

Difficulty ratings can be local (`flow.localDifficulty`) or pinned bank ratings. Creation sorts stable groups within a continuous practice run. Missing ratings, uncertain boundaries and external dependencies keep the run in source order and create a finding. Rating refreshes never re-sort existing projects.

## Verification and corrections

Projects’ Review panel displays coverage and exceptions. Selecting a finding follows the affected content; source comparison follows its source references, with a page selector for continuations.

`node scripts/booklet/check-content-coverage.mjs --project ID --out .booklet-work/coverage/ID` writes a local reconciliation report. Missing, duplicated, ambiguous and unchecked entries remain distinct. Unmapped content, missing answers, unresolved review findings and short-only worked-answer placeholders prevent readiness.

Content verification records an explicit checked result and a signature from `contentVerificationKey`. A matching signature reuses the check; content, diagram, source hash, verifier version or shared teaching-context changes invalidate it. Presentation changes leave unchanged content checks intact. A signature is evidence of a recorded check, not a verifier: do not generate checked records merely because import or rendering succeeded.

Supply current asset signatures when recording or checking verification: `contentAssetSignatures(project)` in Node tools, or `verificationAssetSignatures(project, readAsset)` in the browser. Pass that map as the fourth argument to `contentVerificationKey`, and as `{assetSignatures}` to `inspectContentCoverage`. These signatures hash the actual referenced file bytes, so replacing an image at the same path invalidates its check. Unavailable assets are readiness findings. Source-reference changes also invalidate content verification.

Confirmed corrections use `sourceCorrections` on the candidate and become `project.source.corrections`. Each records a stable identity, target, field path, exact original and replacement, source references and reason. Applying a correction refuses stale originals. Preserve the original PDF. For the Index Laws pilot, the user explicitly authorized correcting confirmed errors and retaining every correction. Extraction errors must be identified separately from errors in the printed source.

Imported short answers and authored solutions retain their provenance. `answer.provenance.worked: 'source-short-only'` is an unfinished solution, even if its text is nonempty. Follow the [worked-solution contract](booklet-worked-solution-style.md), verify agreement with short answers, and resolve missing teaching context before acceptance.

Represent review, guided practice and Key Ideas responses as semantic question content, separating their answers from student prompts. **Both answer editions are practice-only for new compact projects.** Teaching answers remain editable and available through the teaching-answer controls. Do not print generated R/G/A/K references. Historical projects retain their existing answer selection. Intentional worked examples remain visible teaching content.

Teaching sections must use the existing `sourceAtom` groups and header templates, as in Linear Relationships v1: Review, Definition/Theory, Identify, Example, Guided Practice and Key Ideas. A group has one template-owned header; remove only that heading from the body, preserving instructions and scaffolds. Retain original native documents and removed header evidence in `sourceLayoutEvidence`.

Preserve the source group's meaning when choosing a template. A red activity headed “Simplify” or “Apply” may contain both visible demonstrations and student responses: use one shared Identify/activity `sourceAtom`, retain the source heading, and keep its responses behind the activity answer control. Do not turn this into separate Example and Guided Practice groups. Genuine orange examples and guided practice remain separate when the source separates them.

Review meaningful colour (including colour within equations), paragraph and equation alignment, speech bubbles, card arrangements and the physical size of writing boxes. Text and math inlines support `colour: '#rrggbb'`. Mixed table cells can opt into `preserveParagraphAlignment: true`; otherwise existing cell alignment still governs paragraphs. Use native `layout` arrangements `cards` and `speech-bubble`, not flattened screenshots or quoted prose. A speech bubble has a character-image slot followed by an editable statement slot and `tail: 'left' | 'right' | 'none'`. Cards preserve the source order and row grouping. Keep words such as “base” upright inside mathematics using `\\text{base}`.

Do not infer alignment from whether content is prose or mathematics. Preserve source paragraph alignment, including centred one-word labels under equations, and record both `align` and `preserveParagraphAlignment` requirements. Compare the expression/result column separately from the equals-sign column. For source rows whose leading equals signs extend left, opt into `alignSourceLeadingEquals` from `src/lib/booklet-source-equation-rows.js`; do not put every line at the same left edge. Check coloured and fraction rows as well as plain expressions. Record the reviewed equation as a presentation requirement.

Check all teaching boxes after an alignment correction, including examples with the first equality on the same line (their continuation equals signs align with that first equality). Avoid stacking outer box padding, table top margins and cell top padding before introductory prose. Use `marginBefore: 0` and source-supported `paddingTop: 0` on introductory cells when the outer template already supplies that space; preserve genuine internal spacing.

Power-law arrows can now use native `annotated-equation` blocks with `connections: [{id, fromId, toId, colour, height}]` linking stable `anchors`. Use `fontSize: null` to inherit surrounding text size, and `margin: 0` inside cells. Match the reserved `arrowSpace` across neighbouring examples so their baselines agree. Keep question prompts left aligned when that is the source placement. Inspect formula/arrow geometry at final size, test rich editing/copying and flag unresolved anchors after equation edits. Do not rasterise an otherwise editable equation just to retain arrows. Preserve replaced raster evidence and redirect its inventory references to the native equation.

Matching cards support external slot `label` values, individual `widthMm`, and a bounded, centre-aligned layout width. Keep labels outside the card faces when the source does. Do not stretch small answer cards to the full page width. Record the actual question grid in `sourceReview.arrangements`: Mixed Practice Q5 in Index Laws is 27 parts in nine rows of three, not two columns.

Image centring controls depend on the image type: arrangement diagrams use **Alignment → center**; rich-text block images use **Placement → center**; inline images follow the containing paragraph's **Align → center**. Resizing must preserve that alignment. Keep editor warning colours scoped to editor controls so they do not colour printed paragraphs.

Resolve exact source colours rather than substituting a generic red. The Index Laws source uses `#AA0505` for red text and equation highlights (confirmed from Word colour metadata and rendered PDF pixels on 9 September 2026); preserve original evidence separately. PDF text extraction may truncate colour channels by one, so compare rendered solid pixels with the source metadata. Review every occurrence of a substituted colour throughout active content. New sources require their own palette evidence. Changes to these reviewed values must fail the presentation-requirement check rather than silently rewriting its expected values.

Blank mathematical boxes must have room for the expected handwritten value in their rendered context, including superscripts and fractions. A tick/cross mark, a printed example box and a writable box have different requirements. Size the actual box, not an unrelated answer space below it. Compare raster scaffolds at their final physical size too. Reflow a long equation or record a source-arrangement exception before reducing writing space to make it fit.

When source pagination is explicitly requested, set `sourcePaginationPolicy: 'source-boundaries'` and preserve source order, section boundaries and `flow.sourcePageBreakBefore`. Keep the flexible renderer so larger writing spaces may produce continuation pages within a source-page group; do not pull content from the next source page into unused space. Answer sections retain their compact pagination. This is an explicit project choice, not a new default for existing or future compact projects.

Every imported block needs `sourceReview` metadata before acceptance:

```json
{
  "sourcePages": [5],
  "headerOwnedByTemplate": true,
  "responses": [{"targetId": "q3-a", "kind": "tick-cross"}],
  "arrangements": [{"targetId": "q3", "layout": "grid", "columns": 4,
    "order": ["q3-a", "q3-b", "q3-c", "q3-d"],
    "reason": "Source has four columns; comparisons and row reading order retained."}]
}
```

Response kinds are `cloze`, `tick-cross`, `inline`, `short`, `working` or `none`. Cloze and inline completion supply their own response space; tick/cross needs only a compact area. Do not assign blanket 12/14 mm working spaces or two-column grids. Inspect source rows, columns, comparisons and dependencies. Custom arrangements also require `sourceReview.arrangementOverride`. Uncertain choices remain actionable Review findings. `inspect-source-question-layout.py --pdf SOURCE --project PROJECT.json --out REPORT.json` suggests label geometry; it never verifies a choice automatically.

Record a checked presentation signature with `presentationVerificationKey(block, project.source?.sourceHashes)` only after source comparison. `inspectPresentationFidelity` independently checks teaching templates, heading ownership, response requirements, meaningful arrangements and reviewed signatures. These checks are separate from content signatures and rendered layout checks. Changing grouping, response requirements or source arrangements invalidates presentation verification. Content/diagram/context changes still invalidate content checks; font, renderer and edition changes invalidate layout checks. Counts or zero overflow cannot establish readiness.

For verifier v2, pass project settings as the third argument: `presentationVerificationKey(block, project.source?.sourceHashes, project.settings)`. Record `sourceReview.teachingGroup` (id, kind, label and visibleSubtitle), `sourceReview.sourcePagination` (page and breakBefore), and source-reviewed `presentationRequirements: [{path, value}]` for meaningful colours, native visual arrangements, alignment and writing dimensions. Paths are block-relative JSON paths such as `/content/blocks/0/arrangement`; requirements are checked against active content. Record expected values from source comparison, never from an unchecked import. Page-policy or boundary edits invalidate signatures. Review the complete booklet for repeated occurrences after user feedback and retain a source-to-output page map, including continuation exceptions.

Source-backed imports also require `sourceReview.visualAudit: {checked: true, categories: [...]}` after visual comparison. The required categories are exported as `SOURCE_VISUAL_CATEGORIES`: colour, pagination, speech-bubbles, writing-boxes, activity-groups, alignment, and cards-and-prose. Check applicability against the source even when a category is absent. Missing visual review blocks readiness independently of content counts, signatures and overflow checks.

New compact projects explicitly adopt `mathsStyle: 'display-glyphs'`: native and text mathematics use consistent fraction glyphs while retaining inline placement. Legacy projects retain their previous rendering policy.

## Layout and export

The general tools accept project IDs and local output directories:

- `calibrate-compact-answers.mjs --project ID --editions short,worked --out DIR [--apply]`
- `check-compact-exercises.mjs --project ID --editions student,short,worked,with-short,with-worked --out DIR [--force] [--draft]`
- `check-teaching-presentation.mjs --project ID --out DIR`
- `check-compact-navigation.mjs --project ID --out DIR`
- `export-pdf.mjs --project-id ID --mode EDITION --out FILE.pdf`

Successful layout checks cache their project, renderer, font, asset and edition signatures plus the PDF hash. `--force` requests a fresh check. Failed checks are not cached as successes. Unsupported diagram calibration creates an actionable review finding. Explicit `export-pdf --draft` retains QA reports while allowing layout findings for inspection; it does not bypass rendering failures or establish acceptance.

## Index Laws pilot and retirement

`index-laws-complete-v1` contains the complete 63-page pair, using the ten contents topics. The PDF is authoritative where it differs from Word. The corrected revision 89 reconciles 1,666 verified entries and one explicit source-cover-layout exclusion, including six separately inventoried arrow diagrams missed by equation-only extraction. Its 212 teaching/arrangement block checks pass independently. All questions and teaching responses retain short answers and worked solutions; answer editions include practice only. The user confirmed that the mixed-index questions apply the normal laws directly and need no added conversion lesson. Corrections and durable import provenance are in `booklets/provenance/index-laws-complete-v1/`. The revision 83 acceptance report is superseded because it did not establish teaching/arrangement fidelity. The user **accepted revision 200 on 9 September 2026** and authorised importing its practice questions. All 149 whole practice questions are now published and owned by this original booklet; revision 201 records the bank links and classifications while preserving accepted content and pagination. See `booklets/provenance/index-laws-complete-v1/bank-import.json` and `bank-import.md`.

Keep Source reconstructions until the pilot passes reconciliation, complete answer/solution checks, all five edition checks and representative printed-page review, and the user accepts it. Only then retire its separate workspace and unused write controls. Retain historical evidence browsing/materialization in Projects, old-link redirects without automatic creation, correction conflict checks, source serving and exact-mode rendering. Practice-bank publication is complete; retirement remains a separate follow-up requiring confirmation of the remaining verification gates.


For image editing, expose Left/Centre/Right in the focused image editor and retain the chosen placement when applying content, resizing, saving and reopening. Keep numbered Key Ideas in explicit number/text columns on the same row, including in editable and print views. Transcribe missing-value mathematical scaffolds into native LaTeX with physical-size writable boxes; preserve repeated-factor and exponent steps, and retain the original raster as source evidence. `node scripts/booklet/check-index-editing.mjs` checks every Index Laws Key Ideas row and the focused image alignment round trip without writing to the project.
