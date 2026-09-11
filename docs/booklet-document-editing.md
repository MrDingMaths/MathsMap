# Document-first Booklet Studio

The booklet itself is the editor. Click prose or mathematics on the page and write; changing paragraphs does not require Save or Cancel. Changes autosave through the normal project/bank save path. The status distinguishes local changes, saving, saved, failure and conflict.

## Writing and selection

The persistent toolbar supplies styles, emphasis, colour, alignment, lists, mathematics and insertion. Insert → teaching template creates one shared teaching group and places the caret in its body. Empty writing prompts are editor-only. Insert markers add text before a group; the end marker adds text after that group.

Use margin handles to select complete teaching groups/questions, Shift for an adjacent range, and the toolbar or Ctrl+X/C/V/D and Delete for structural operations. The outline mirrors this selection. Text deletion retains question containers and answer associations; whole-group deletion is a separate selection. Ctrl+Z/Ctrl+Y undo and redo both typing and structure. Continuous typing is grouped, and unchanged history branches are shared to avoid retaining a full copy of a large booklet for every edit.

Within native text, Enter creates paragraphs and lists use the existing MathsEditor behaviour. Left/right at field boundaries moves to an adjacent writing area. Cross-field selection supports copy, cut, deletion and emphasis/colour while preserving containers. Mathematics and writable boxes are atomic for prose selections; click inside a formula to edit its mathematics.

Arrangement keyboard activation handles Space and Enter only when the arrangement container itself is focused. Events from nested text editors and controls retain their native behaviour. `node scripts/booklet/check-text-spacing.mjs` checks actual Space/Enter input in question stems and nested parts, autosave, preview/reopen, and keyboard selection of the layout, using only in-memory project writes.

More options opens controls for the active selection, including spacing, tables and images. Table selections also expose common row/column actions in the toolbar. The block-properties panel retains specialist question arrangements. Source comparison and bank-conflict review remain available.

The toolbar's quick colour swatches include the house palette and colours already used by the open booklet. They colour selected prose or selected maths, including source colours such as Index Laws red. The custom colour picker remains available.

Click a question or its margin handle, then open **Question spacing**. **Answer space height** updates all nested answer spaces in one undoable change; **Vertical gap** updates stacked-item gaps while retaining horizontal arrangements. Embedded cloze/writing boxes retain their own dimensions. **Arrange question** opens more detailed group/item controls.

**Insert → More insertions** restores display equations, annotated equations, writing space, block figures, matching cards, speech bubbles and the investigation, parallel, worked-row and scaffold templates. List indent/outdent are beside Bullets and Numbering. **More options** includes the tab ruler, custom positions/alignment/leaders, copy/paste of tab settings across fields and applying tabs to the question's parts.

In the outline, **Organise booklet** reveals destination-based moves/pastes, bank insertion, topic renaming/reordering, section settings, numbering and pagination controls. It uses the document's clipboard and undo history.

## Diagrams

Click a diagram to select it. Resize using its corner handle or toolbar width; alignment is beside that width. Edit TikZ opens the code/preview specialist directly, without first opening a question-arrangement editor. Applying a specialist draft is one document undo step. Invalid or still-compiling changed TikZ cannot replace the saved diagram. Size/alignment changes preserve its mathematical model; changing the code clears that model because its constraints may no longer be accurate.

Arbitrary TikZ remains code-based internally. Use a comment and feedback export when the desired construction change is easier to describe. This release does not add a graphical TikZ construction editor.

## Comments and feedback

Select text or an object and use Add comment or Ctrl+Alt+M. The Comments panel also supports booklet-wide notes. Existing `studio.flags` are displayed without replacing their IDs or resolved state. Comments can be edited, deleted, resolved and reopened; deletion is undoable.

All applicable occurrences is the default scope; This occurrence only is an explicit local exception. A margin indicator opens comments belonging to a group, including notes on its question parts. Comments follow stable project content references. Removed targets and changed content remain visible for attention; matching text elsewhere is never used as a replacement target.

Copy feedback prompt exports selected unresolved comments, or all unresolved comments if none are selected. It waits for a successful save and records that revision, edition, source pages, content references and excerpts. A failed save retains the work and prevents stale export. A selectable prompt remains available if clipboard access fails. Export does not resolve comments or execute an LLM. Comments never print or sync into bank questions; class copies start without the source project's comments.

## Interaction contract and baseline

| Task | Previous path | Document workspace |
| --- | --- | --- |
| Edit an arranged question's prose | Open question arrangement → edit content → apply → save question | Click and type |
| Edit the next question | Finish current draft, close editor, open next editor | Click the next writing area |
| Format selected text | Open content editor and formatting controls | One toolbar action after selection |
| Add a teaching group | Choose destination and block type, insert, open editor | Insert → template; body focused |
| Remove a teaching group | Outline selection or block actions; some paths required confirmation | Margin selection → Delete; Undo restores |
| Give correction feedback | Review → Flags; manually describe location and copy notes | Selection → comment; Copy feedback prompt |

Panels overlay the workspace without changing the physical paper width. Pagination debounces while typing, defers during composition, and restores the canonical selection and viewport after reflow. Paragraph/page fragments edit their original content rather than replacing the entire field with a displayed fragment. Long ordinary paragraphs can continue at measured word boundaries; indivisible equations and protected arrangements retain their safe-break checks.

## Implementation and verification

The host controller, DOM adapter and feedback model live in MathsMap. The bundled standalone MathsEditor keeps its existing API and history when no booklet host is provided; synchronising its bundle does not overwrite the host adapter. Project format/storage endpoints are unchanged. Existing projects are not migrated on load.

Run `node --test "tests/*.test.js"` and `npm.cmd run build`. Browser checks use a development server (default port 5174; override with `BOOKLET_TEST_BASE`):

- `node scripts/booklet/check-document-workspace.mjs`: in-memory fixture; typing, undo, theory/maths insertion, cross-field formatting, feedback, failed-save recovery, reload, TikZ drafts, continued-page editing and composition.
- `node scripts/booklet/check-document-tools.mjs`: restored palette for prose/maths, whole-question spacing, cross-field tab settings, templates, list indentation and outline organisation; saves and undo are checked against an in-memory project.
- `node scripts/booklet/check-document-projects.mjs`: in-memory copies of both accepted books; canonical edits/restoration, bank pins, stable paper width, all three edition layouts and worked PDF output.
- `node scripts/booklet/check-document-editor.mjs http://127.0.0.1:5174/libs/maths-editor/studio.html`: standalone native editor compatibility.

Screenshots, PDFs and reports stay under `.booklet-work/`. Original project/bank files are not written by these checks. The existing Index Laws formula-label regression now asserts the accepted native equations rather than the raster IDs retired by the earlier native-maths sweep.

Verified on 9 September 2026: all 576 tests pass, the production build passes, and the workspace, standalone editor and both accepted-booklet browser checks pass. The isolated question/short-answer/worked editions contain 92/14/47 pages for Linear Relationships and 65/15/68 pages for Index Laws. Worked PDFs contain 47 and 68 A4 pages respectively. The build retains the existing large-bundle warning.

## Follow-up control audit

The first document-toolbar rollout hid the native toolbar and outline settings too broadly. The missing routes above are restored. The audit also repaired direct diagram width/alignment changes failing to update saved arrangement geometry, tab propagation being repeated by later unrelated typing, and identical repeated maths events adding an extra Undo step. Table styling/merging, image crop/grayscale, equation symbols/LaTeX, source comparison and specialist question arrangements retain their existing controls. No accepted booklet is restyled or migrated by this repair.

## Responsiveness

Source verification now runs through **Review → Source coverage and exceptions → Check source coverage**. It no longer hashes and compares the entire book after every edit or save while its panel is hidden. Existing findings remain visible and are marked stale after changes; Recheck updates them. Hidden assembly tools also defer question-bank candidate calculations until opened, while retaining their form drafts.

Pagination detects changed document branches without serialising the whole book on every keystroke, yields to input even when measurements are cached, and retains the active editor when its field stays on the same page. Moved and fragmented fields use canonical caret restoration. Measurement and print copies never mount live editors. Save responses preserve unchanged document branches; autosave, conflict handling and document undo remain in place.

Comment indicators share their location lookups. Content lookups remember paths and validate the target ID against the current document on every use, preserving correct results after moves, deletions, undo and project switching without retaining stale content objects.

`node scripts/booklet/check-document-performance.mjs` profiles typing and autosave on an isolated full accepted book, checks saved text and editor retention, and exercises explicit source rechecking. Set `BOOKLET_PERF_PROJECT` to select a project and `BOOKLET_PERF_RUN` to name the local report. The Index Laws baseline recorded two pauses of about 2.7 seconds after a short edit. The final check at `localhost:5173` recorded a longest task of 97 ms and a median input-to-next-frame time of 25 ms, compared with about 47 ms initially. These are local development measurements, not timing guarantees.

The responsiveness follow-up passes 588 model tests, the production build, workspace/tool/standalone browser regressions, explicit source rechecking, and all three editions plus worked PDFs of isolated copies of both accepted booklets. The full-book checks restore the edited field exactly with Undo and retain bank references. Reports capture the project snapshots used; ongoing content edits can change later page counts.

### Equation editing follow-up

Superseded pagination jobs are discarded before their debounce delay begins. A burst of equation input therefore cannot accumulate one delay per keystroke. Arranged text fields also retain their rendered identity when the first edit converts legacy source to a native document; the stored arrangement references still identify native paragraphs separately. This keeps MathLive and its caret mounted through the conversion, reflow and save.

`node scripts/booklet/check-equation-performance.mjs` profiles a full isolated Index Laws copy, checks that the same math field remains focused across edit/pause/continue, and verifies two Undo steps plus Redo against the saved content. Use `BOOKLET_PERF_BLOCK` for another question and `BOOKLET_TEST_BASE` for the running server. The measured post-typing save/pagination wait fell from about 4.6 seconds to 1.2 seconds; individual equation key responses in this local check were around 5–12 ms. Timing reports and CPU profiles remain under `.booklet-work/equation-performance/`.

This follow-up passes all 593 model tests, the production build and the workspace, restored-tools and standalone-editor browser checks. Source-content regressions accept both legacy strings and native documents, as normal page editing may change the representation without changing the mathematics.
