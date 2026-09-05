# Editable theory and an auditable booklet bank

Decision, 5 September 2026: all theory should ultimately be editable in Studio. Structured data supports auditing atomisation across booklets and controlled AI changes. Word remains source evidence; it is not the intended long-term theory editor.

## What the current queues mean

| Queue | What to check | What approval means |
| --- | --- | --- |
| Pages | Source versus reconstructed wording, maths, arrangements and diagrams | This source-page reconstruction is complete |
| Modules | Proposed reusable teaching sequences containing theory, examples and practice | The grouping is suitable for reuse |
| Questions | Prompts, parts, scaffolds and answers | This question has been checked |
| Mappings | Actual curriculum skill links, separately for modules and questions | The proposed module assignment has been checked |
| Diagrams | Source evidence beside generated TikZ or retained images | Generated geometry and labels have been checked visually |
| Flags | Specific defects still requiring work | Resolve only after checking the correction |

“Adding and Subtracting Negative Integers” is the inferred title of the pilot's module spanning source pages 29–38. It is not the skill list for the booklet. Question records already support a primary skill and secondary skills; modules have their own assignments. The pilot includes selected pages, not the complete original booklet. Some practice pages sit outside this inferred module. Neither this grouping nor a module approval constitutes a full atomisation audit.

Use Pages for visual review, Questions for individual content approvals, and Modules/Mappings for reuse and curriculum decisions. Use **Create editable booklet** to work on an independent structured copy. Publication to the banks remains subject to review checks. The three-pass review process is described in [booklet-human-review.md](booklet-human-review.md).

## Editing maths

Turn on **Edit preview**, then click the text or answer. The editor receives keyboard focus. Type prose normally. Click an equation once inside the editor to open its LaTeX input and live preview. Enter notation without dollar signs there, choose **Apply equation**, then **Save** the block. Enter applies an equation; Escape cancels its draft. Ctrl+Enter saves a block when focus is in the prose surface. Tab moves to the next control.

The palette inserts an equation and opens its editor. **Help and source editor** exposes the full source when needed; write `$x^2$` there to distinguish maths from prose. Undo includes equation changes. Revert restores the imported value; legacy numeric TeX short answers still render as maths. It does not remove the original import's validation defect: saving corrected delimited notation is still required for clean structured data.

No application shortcut for S or Bing was found. The old editor required a double-click for equations and did not focus when activated. Automated checks now verify ordinary S typing stays in the focused editor and does not create a tab. If Bing still opens, record the browser and whether text was selected; that could be a browser shortcut or extension.

## Flags and preventing repeat defects

Write a flag as a concrete comparison, for example: “Source p32, second worked example: arrow intersects the line; keep its endpoints but place the arc above the ticks.” Include stable block/question IDs where available.

**Build flagged repairs** incorporates unresolved flag notes in AI tasks. **Run repairs** runs and merges targeted replacements. Inspect the output, then resolve the flag yourself. You do not need to copy the flags into another chat for that repair lane. Repairs overlapping saved content edits are now blocked with the edited identity, preserving your work; use a reviewed content edit for that target. Repairs reopen affected approvals and make dependent audits stale. Flags remain unresolved until you inspect the result.

Resolving a flag does not automatically improve later imports. Recurring issues require three changes: a shared renderer or extraction correction, an explicit import rule, and a regression fixture that would fail if the defect returned. The versioned source-presentation contract now carries the pilot lessons into newly prepared imports without altering existing runs' pinned prompts. It covers meaningful layouts, source difficulty headings, scaffolds, diagram provenance and maths delimiters. These rules reduce repeat errors; rendered review still checks model compliance.

## Proposed next product work

These are design proposals, not features implemented by this repair.

1. **Atomisation audit first.** Show source page/block and each question part alongside proposed skills, prerequisites and rationale. Distinguish “teaches”, “practises” and “assesses”. Detect mixed-skill questions and oversized modules. Let AI propose splits/merges with before/after previews and keep dependent material together. Approve changes explicitly. Preserve source identity through every split.
2. **A library of theory layouts.** Store editable semantic blocks: definition, rule, worked example, investigation, guided practice and key ideas. Give each a choice of arrangements: prose plus diagram, parallel examples, worked rows, rule plus examples, or scaffolded table. Content and layout should be separate. An unusual page should extend the layout library rather than force its mathematics into a single text field.
3. **One review workspace.** Replace the feeling of six independent jobs with a source/preview comparison and an inspector showing content, skill links, diagram evidence and flags for the selected block. Display content, sequence and final-layout progress separately. Batch acceptance can follow once selections and dependencies are clear.
4. **AI change proposals.** Requests such as “reduce the scaffolding in these four examples” should produce a structured diff, affected skills, source references and regenerated previews. Accept/reject individual changes and undo the whole batch. Review edits must survive regeneration; conflicts must be visible.
5. **Assemble from the reviewed bank.** Select skills and difficulty progression, choose theory modules and practice questions, then adjust working space. Generate student, short-answer and worked-solution outputs from the same records. Keep bank revisions pinned so improving a reusable question does not silently change an existing booklet.

The time saving should accumulate: import and review a block once, reuse it across booklets, then improve its content or layout in one reviewed place. Accurate transcription and worked solutions already reduce the first-pass workload. Atomisation and reusable theory layouts are the next investments needed to make the entire booklet workflow worthwhile.

## New-PC verification

AGY was installed at `%LOCALAPPDATA%\agy\bin\agy.exe`; Poppler and Pandoc were installed through Scoop. `pdftoppm`, `pdftotext` and `pandoc` ran against the original booklet. The AGY file/image/model preflight passed with `gemini-3.8-flash-high`. New terminals pick up the AGY PATH entry; the pipeline also resolves its installed executable directly. Source input defaults now use repository-relative paths instead of the previous PC's user directory.

Verification commands: `node scripts/booklet/check-review-usability.mjs` (local Vite server required; intercepts writes so it cannot alter the pilot), and `node --test tests/booklet*.test.js tests/integers-feedback.test.js tests/practice-studio.test.js tests/inline-content.test.js`.
