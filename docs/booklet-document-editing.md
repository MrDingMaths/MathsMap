# Document-first Booklet Studio

The booklet itself is the editor. Click prose or mathematics on the page and write; changing paragraphs does not require Save or Cancel. Changes autosave through the normal project/bank save path. The status distinguishes local changes, saving, saved, failure and conflict.

This page is the single guide to editing in Booklet Studio. The sections from "Document workspace: commands and contracts" onwards were merged in on 9 October 2026 from five separate notes, and each says when its note was written. Where two sections name different menu routes for the same action, check the app: a later section not mentioning a route does not mean the route was removed. The original notes, with their dated benchmarks and acceptance records, are in `archive/`.

## Writing and selection

The persistent toolbar supplies styles, emphasis, colour, alignment, lists, mathematics and insertion. Insert → teaching template creates one shared teaching group and places the caret in its body. Empty writing prompts are editor-only. Insert markers add text before a group; the end marker adds text after that group.

Use margin handles to select complete teaching groups/questions, Shift for an adjacent range, and the toolbar or Ctrl+X/C/V/D and Delete for structural operations. The outline mirrors this selection. Text deletion retains question containers and answer associations; whole-group deletion is a separate selection. Ctrl+Z/Ctrl+Y undo and redo both typing and structure. Continuous typing is grouped, and unchanged history branches are shared to avoid retaining a full copy of a large booklet for every edit.

Within native text, Enter creates paragraphs and lists use the existing MathsEditor behaviour. Left/right at field boundaries moves to an adjacent writing area. Cross-field selection supports copy, cut, deletion and emphasis/colour while preserving containers. Mathematics and writable boxes are atomic for prose selections; click inside a formula to edit its mathematics.

Source emphasis may contain native mathematics, for example `**Assume true for $n = k$**`. Bold and italic source text is parsed recursively; math keeps its original LaTeX and stores explicit inline marks separately. JSON save/reopen, the native editor reader and native HTML clipboard preserve those marks. Semantic table-header bold remains presentation only and never adds bold commands to saved LaTeX. Escaped dollar amounts remain prose.

Arrangement keyboard activation handles Space and Enter only when the arrangement container itself is focused. Events from nested text editors and controls retain their native behaviour. `node scripts/booklet/check-text-spacing.mjs` checks actual Space/Enter input in question stems and nested parts, autosave, preview/reopen, and keyboard selection of the layout, using only in-memory project writes.

More options opens controls for the active selection, including spacing, tables and images. Table selections also expose common row/column actions in the toolbar. The block-properties panel retains specialist question arrangements. Source comparison and bank-conflict review remain available.

The toolbar's quick colour swatches include the house palette and colours already used by the open booklet. They colour selected prose or selected maths, including source colours such as Index Laws red. The custom colour picker remains available.

Click a question or its margin handle, then open **Question spacing**. **Answer space height** updates all nested answer spaces in one undoable change; **Vertical gap** updates stacked-item gaps while retaining horizontal arrangements. Embedded cloze/writing boxes retain their own dimensions. **Arrange question** opens more detailed group/item controls.

**Insert → More insertions** restores display equations, annotated equations, writing space, block figures, matching cards, speech bubbles and the investigation, parallel, worked-row and scaffold templates. List indent/outdent are beside Bullets and Numbering. **More options** retains specialised formatting; custom tab authoring controls are retired. Existing custom stops remain until **Reset to 1 cm tabs** is chosen.

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

## Smooth editing controls

Click prose to place a caret. Block handles select text, equations, tables, images or groups without changing their printed geometry; Delete removes the selected item and document Undo restores it. Nested text is removable. Removing the sole table row or column removes the table, leaving a caret paragraph only where its container requires one.

**Layout** exposes before/after, destination moves, grouping, stack/side-by-side, full width, spacing, widths and column alignment directly. It supports teaching groups and questions, plus blocks inside native layout slots. Ctrl+click sibling handles to group them. Drag a handle onto an indicated before/after/inside destination; use the equivalent buttons with a keyboard. Column boundaries preview while dragging, commit on release and cancel with Escape. Detailed arrangement and specialist image/TikZ controls remain available. **Paragraph** exposes font size, line spacing, spacing before/after and indent.

Tab advances to the next 1 cm stop in prose, to the next table cell (adding a row at the end), or indents a list. Shift+Tab reverses cell navigation or outdents a list. Use **Insert > Tab** for a literal tab inside a table cell. **Alt+=** inserts mathematics. Inside maths, Tab retains MathLive navigation; **Symbols** opens the palette. Escape returns to prose; Escape then Tab leaves the editor. Browser Ctrl+Tab remains unchanged.

Enter splits a paragraph through one document transaction. Explicit blank paragraphs carry optional `preserveEmpty: true`; unmarked empty placeholders still collapse. Editing sessions own one rendered host and explicit canonical fragments. The active maths overlay shares the preview's layout metrics, including while selection controls are visible. Project endpoints and existing custom-tab layouts are unchanged.

Regression commands: `node --test tests/booklet-smooth-editing.test.js` and `node scripts/booklet/check-smooth-editing.mjs` (`BOOKLET_TEST_BASE` selects the development server). Browser tests intercept all project writes in memory; reports and screenshots are local under `.booklet-work/smooth-editing/`.


## Editing the cover directly

In a questions edition, click the printed title, course, Book number, version or feedback text on the cover. Type the replacement and press Enter or click outside the field to save. Escape cancels the current field. Ctrl+S saves the current field before saving the project; Ctrl+P includes it in printing. Use the Studio Undo/Redo buttons after leaving the field.

The printed cover title is independent of Project ? Project details ? Title (the name in the project picker). Cover edits are stored in `settings.cover`; the original cover transcription and source documents remain unchanged. Title and Book number cannot be emptied. Contents, exercise numbering and answer-section navigation remain calculated from the chosen edition. The short-answer-only and worked-solution-only editions have no cover.

Validation uses `node scripts/booklet/check-cover-editing.mjs` with in-memory project copies, all four current cover patterns, save/reopen, cancellation, undo/redo, zoom and all five edition paths. It does not modify saved booklets or claim a new full-content transcription acceptance.


## Document workspace: commands and contracts

Merged from the document-workspace note of 14 September 2026.

Current projects keep their stored content, IDs, bank ownership and layout settings. Studio is a document workspace with a 48 px document bar, 44 px formatting row and 28 px status bar at the reference desktop size. Outline and inspector start closed; panels overlay the paper without changing its zoom.

### Editing and commands

Click prose or mathematics to edit it directly. Native editor instances survive page redistribution. Enter splits ordinary paragraphs; Backspace joins adjacent ordinary paragraphs in their native owner. Question and table ownership remain structural. Use a group handle to move, copy or delete a complete question. One document history owns typing, formatting, paste and structural operations.

- **Spacing** opens the contextual inspector. Prose has line/before/after spacing; a multiline equation has an explicit additional gap in millimetres and tighter/looser actions. Table cells have text spacing, padding and minimum row height. Mixed paragraph values are shown as mixed. Whole-question scope is explicit.
- Preview spacing changes locally, commit on confirmation or release, and cancel with Escape. Advanced native properties remain collapsed, with colour and specialist data controls disclosed on demand.
- **Ctrl+F** finds document prose, **Ctrl+G** goes to a page, and **Ctrl+K** searches commands, including equation spacing. File contains source comparison, bank sync and specialist project tools.
- Studio clipboard payloads retain native content. Structural question copies use the existing cloning rules; moves keep identities. Basic Word HTML is sanitised into destination typography, emphasis, lists, links and simple tables. **Ctrl+Shift+V** inserts literal text. Unsupported equations/objects require a fallback choice before replacement. DOCX round trips and Word equation conversion are outside this change.

### Internal contracts

The document session owns transactions, canonical field selections and immutable history. An edit transaction carries changed block IDs, selection before/after, a generation and layout impact. Field hosts register stable content IDs and paths; page numbers are presentation metadata. A single parked editor portal moves between fragment views. Native DOM reconciliation preserves MathLive islands and text nodes. Hosted native editors emit document transactions without standalone history or complete source exports on every input. Their standalone API remains available.

Pagination begins after 250 ms of editing inactivity. Superseded jobs cancel, including asset waits. In-memory checkpoints resume from the earliest changed logical unit with the preceding partial page and keep-with-next dependencies. Reuse continues after the carry, placement and continuation state converge. Override fingerprints include every per-item layout map; global settings, edition and renderer/assets are cache inputs. Combined editions reuse page bodies while deriving numbering and links. Measurement work yields with a 4 ms JavaScript budget; DOM measurement stays on the main thread. Page views use the settled project snapshot while the active editor displays live input. Composition and drag selection defer redistribution.

Autosave remains approximately 500 ms and keeps the existing revision-safe project/bank endpoint. A persistence worker receives one seed on open and subsequent immutable-branch patches. It serialises requests, parses canonical server responses and compares them off the main thread; the UI applies a small acknowledgement patch. Saves coalesce, and edits made during a save remain pending for the next revision. There is a compatibility fallback when workers are unavailable. Recovery checkpoint and bank conflict policies are unchanged.

Export flushes the current document, requires a successful save, checks the layout generation and edition, settles fonts and assets, and rechecks the generation before printing. Failed layout keeps the editable document and last valid pages, with retry in the status bar. Save state and layout state remain separate.

### Builds and checks

Browser mutation checks use isolated project copies and intercept their save endpoints, including worker requests. They must never write the accepted project files. Incremental layouts are compared with fresh pagination for all five editions.

The normal public build continues to exclude the local authoring route. Set `VITE_BOOKLET_STUDIO=true` for a production authoring build on the local authoring server; this also permits profiling the optimised code. The temporary local `booklet-word-workspace=off` preference is a development chrome escape hatch, not a project migration.

Cold preparation still compiles uncached native diagrams and can take minutes in large books; the responsiveness targets apply after opening.

For PDF word-bound checks, Poppler remains the default. Environments without Poppler can set `BOOKLET_PDF_PYTHON` to a Python executable with PyMuPDF installed; `BOOKLET_PYTHON_LIBS` optionally names its module directory. The alternative supplies actual printed word bounds to the same page-overflow and 3 mm footer-clearance checks. Generated PDFs, caches and benchmark traces remain local.

The typing benchmarks, regression counts and reviewed PDFs from that release are in the [archived note](archive/booklet-word-workspace.md).


## Outline, page breaks and bank insertion

Merged from the workspace UI note, last changed 15 September 2026.

The booklet editor uses a compact outline, contextual Layout / Arrange / Page inspector, and a full-height detailed arrangement workspace. The left outline expands the current topic and shows question numbers, content excerpts and page numbers. Topic, section and block actions are in their adjacent menus.

- **Insert a bank question:** Insert -> From question bank. Search by skill, wording or ID, inspect the full question/answers, then Insert question. Copies are inserted after the selected logical group using the existing bank snapshot workflow.
- **Manual page break:** select a question or teaching block, then Layout & spacing -> Page -> Page break before/after. The same actions are in outline block menus. Use the topic menu's Start exercise on new page for an exercise boundary.
- **Remove a break:** use Remove on its manual-break marker or Page -> Remove break before. Automatic and source boundaries are labelled separately; explicit actions can override a source boundary. Keeping with next does not defeat an explicit break.
- **Spacing:** Layout shows Whole question controls first for question blocks, followed by the selected item or selected-paragraph controls. Whole-question changes affect all answer spaces or stacked gaps; selected-item changes remain local. Units are shown once per field group; Auto width retains automatic sizing.
- **Arrangement:** Detailed arrangement preserves the selected item. Layout changes dimensions; Arrange changes order/grouping; Page changes booklet boundaries when the draft is saved. Cancel leaves the project unchanged. Use Structure on smaller screens to open the tree.
- **Tables:** select a cell and use the Table row selector to edit one row's minimum height. The inspector does not grow with the number of rows.

Desktop property tabs fit at 1366 x 768, 1920 x 1080 and 3386 x 1219. Narrow screens use drawers and enlarged text can scroll without hiding controls. The document canvas owns page scrolling. Colours, print geometry, booklet IDs/content and bank ownership are unchanged by opening or closing the UI.

Checks:

- `node --test tests/booklet-workspace.test.js` covers logical teaching groups, exercise boundaries, idempotence, break removal, keep-with-next precedence and bank summaries/search.
- `node scripts/booklet/check-workspace-ui.mjs` intercepts all booklet saves in memory. It checks desktop overflow, full dialog height, Cancel, bank preview/insertion, page-break removal, save/reopen, native text and table-row controls, and captures narrow/enlarged-text views. `BOOKLET_TEST_BASE` selects the server (default port 5173).
- `BOOKLET_TEST_BASE=http://127.0.0.1:5173 node scripts/booklet/check-text-spacing.mjs` covers actual Space/Enter input, nested content, autosave/reopen and keyboard layout selection. Set the environment variable using the syntax for your shell.
- `node scripts/booklet/check-arrangement-controls.mjs` uses isolated trigonometry questions to check selected-diagram preservation, movement/undo, Apply/Discard, spacing, save/reopen and preview zoom.
- `node scripts/booklet/check-print-transition.mjs` verifies the PDF button and Ctrl+P preparation, then exports actual PDFs immediately from screen mode in all five editions. It rejects blank pages, leaked workspace controls and pagination differences compared with settled print mode. Requires Chrome and Poppler; `BOOKLET_TEST_BASE` selects the server. The route animation is disabled in print because Chromium can snapshot its invisible initial frame.

The UI and print parity evidence for that redesign is described in the [archived note](archive/booklet-workspace-ui.md).


## Specialist arrangement editor

Merged from the focused-editing note, last changed 12 September 2026. Step-by-step recipes for common layout adjustments are in [adjusting question layouts](booklet-arrangement-controls.md).

Ordinary writing happens directly on the page. Select a question and open its block properties to access the specialist arrangement editor described below. **Save** applies that specialist draft as one booklet change; **Cancel** discards it. TikZ code editing is available directly from a selected diagram.

### Rearrange a question

- Select a **Part** or **Group** in the left panel to move everything belonging to it.
- **Move before / Move after** reorders siblings. **Move out of column** moves a selection up one level. **Full width** places it after its containing row, outside the columns.
- Select several sibling items using their checkboxes, then **Group**. Give the group a useful name. **Ungroup** retains its contents.
- Choose **Side by side** to make a row, or **Stack** to put items vertically. Drag a row's boundary handles, or use **Column proportion**. The handles also accept arrow keys.
- Choose a destination group and **Move into column / group**, or drag an item onto its destination. Drop near the top or bottom of another item to place it before or after that item.
- **Graph and table beside responses** creates an editable starting arrangement from the selected group's existing items.

For the P11 Q14 pattern, select each final unlabelled part and choose **Full width**. For P39, place the graph and table in one stacked group and the equation responses in another, then put those groups side by side. These are saved arrangements, not special page templates.

### Spacing, tables and diagrams

**Space above / below** and **Indent** apply to the selected arrangement item. Paragraph and table spacing are listed separately beneath them so an internal margin is distinguishable from the gap around its group. **Reset spacing** clears the arrangement spacing. **Remove empty paragraph / space** removes an empty paragraph or collapses response space; **Restore answer space** brings response space back.

Select a table or diagram and drag its width handle, or enter **Width**. **Edit selected content** opens only that item's MathsEditor or diagram controls. Apply it to the question, then Save the question. Short and worked answers remain available under **Answers and solutions** in the structure panel.

Image controls show the full original with a crop rectangle as well as the rendered result. Drag the rectangle or its edges; numeric crop fields remain available. Arrow keys move the rectangle; Shift changes the step to ten pixels. Escape cancels a drag. Grayscale, crop, width and manually edited TikZ all save directly. Diagram controls have local undo/redo.

### Corrections and stored content

Tab, Shift+Tab and Alt+= behave as described under Smooth editing controls. Existing custom stops retain their layout until **Reset to 1 cm tabs** is chosen. Custom-stop authoring controls are retired from booklet editing.

AI corrections are requested through document comments and **Copy feedback prompt**. Studio does not run models or use proposal/approval gates. Specialist arrangement edits apply directly and can be undone in the document.

Source pagination, stable content IDs, original diagram evidence and answer associations remain in the project. Existing arrangements change when explicitly edited; loading a project does not convert all its pages. Retained source images still carry their existing review flags.


## Flow, identity and pagination rules

Merged from the flexible-editing note, last changed 25 September 2026. New-project defaults are in [compact exercises](booklet-compact-exercise-trial.md).

Content has stable IDs, source references and logical continuation relationships. Moves retain identity; copies remap local references and retain bank pins. Cross-section edits merge through revision-checked saves. Conflicting edits require review.

Page constraints include start-on-new-page, keep-together and keep-with-next. Releasing an imported break permits reflow. Break only at safe boundaries, preserving complete arrangement rows, shared diagrams, dependencies and handwriting space. Content without a safe fit remains a layout finding; do not shrink it silently.

Numbering follows each exercise across teaching checkpoints. Source comparison follows the selected block after movement. Preview, contents navigation and PDF use the same calculated page map. All five editions remain supported; existing noncompact projects retain their settings.

Run `node --test tests/booklet-flow.test.js tests/booklet-save-merge.test.js` for identity, continuation, conversion and merge regressions. `check-flexible-booklet.mjs` exercises isolated editing; `--full` uses the legacy layout test fixture. Use `check-compact-exercises.mjs --project ID` for current project edition checks; historical baseline/trial aliases are retired.


## Project library

Merged from the project-library note of 17 September 2026.

The Open booklet picker searches titles, stage/course names and class labels. Masters are grouped by their single home course, using the existing MathsMap course catalogue. Class booklets are grouped by class label. Import reviews and unclassified legacy projects have separate groups. Archived projects are shown only when the archive checkbox is selected; their direct project links still work.

Use **File → Project details** to change category, home course or class label. Uncertain courses remain Unassigned. A library category is independent of publication status and bank ownership: changing it never transfers ownership.

In a master, **File → Create class booklet** saves pending edits and creates an independent copy with a class label and editable title. Content, solutions, pagination, local layout and bank revision pins are retained. Source review comments are cleared. Bank content updates still require explicit acceptance; master layout changes do not propagate to copies. Display ratings retain their existing automatic refresh behaviour.

**Archive booklet** hides the project without deleting its JSON, assets, evidence, history or bank links. Open it through Archived projects and choose **Restore booklet** to return it to the active library. Concept Maths is an active Import review for spacing checks. Keep it after import because it owns linked bank questions; archive it when review is finished instead of deleting it.

### Persistence and migration

Optional `library` metadata contains `category` (`master`, `class`, `import-review`, or null), `courseId`, `classLabel`, and `archivedAt` (ISO date or null). Stage is derived from the course. List summaries include normalized metadata; absent metadata means Unassigned. Existing whole-project saves retain revision checking and bank-sync behaviour.

`PATCH /__booklet/projects/:id/library` accepts `library` and a required `expectedRevision`. It writes only library metadata, revision and update time through the shared transaction and checkpoint helpers. It does not publish pending question edits. A stale revision returns 409.

The repeatable initial migration uses the running authoring server's write queue:

```powershell
node scripts/booklet/migrate-project-library.mjs --base http://localhost:5173
node scripts/booklet/migrate-project-library.mjs --base http://localhost:5173 --apply
```

It categorises the eight named topic masters, Volume for 8MAT6, and Concept Maths. Only Linear Relationships (Stage 4) and Concept Maths (Year 11 Advanced) receive home courses. Already classified or manually adjusted projects are skipped. Publication status, bank ownership, source references and document content are preserved. The 17 September 2026 application verified unchanged document-content hashes for all ten projects and unchanged bank-ownership links.

### Checks

Run the library, project, bank-sync and save-merge unit tests, plus `node scripts/booklet/check-project-library.mjs http://localhost:5173`. The browser check uses temporary projects and bank storage, tests keyboard/search, class creation, details/save/reopen, archive/restore, narrow-screen positioning, preview and print-only visibility, and new project categories. Screenshots are local under `.booklet-work/library-review/`. Loading/switching checks use `project-library-browser.mjs` instead of the retired native-select interaction. This change does not alter booklet rendering and does not require full PDF exports.
