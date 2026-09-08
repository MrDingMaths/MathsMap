# Finish editor usability

Implement the remaining editor work in standalone `D:/WebApps/MathsEditor`, then sync a pinned release into MathsMap. The desired experience is the MathsDatabase admin workflow: edit question/solution content beside an immediate rendered preview, insert or paste images at the cursor, and save explicitly. This handoff describes unfinished work; the features below are not already implemented.

## Current project and user decisions

- Workspace: `D:/WebApps/MathsMap`; standalone editor: `D:/WebApps/MathsEditor`; reference app: `D:/WebApps/MathsDatabase` (read its `AGENTS.md`; no database or deployment changes needed).
- Review project: `booklets/projects/linear-relationships-pilot-v1.json`, initially 12 source pages: 1, 2, 3, 7, 9, 13, 14, 16, 24, 28, 29, 33. Open `http://127.0.0.1:5173/#/booklet?stage=projects&project=linear-relationships-pilot-v1`. Read the current project from disk/API; the user has made edits. Do not rematerialise it from an older `output/` snapshot.
- **All new production transcription uses `gpt-6-astra`, low reasoning, through Codex.** `scripts/booklet/transcription-settings.mjs` is the default. `source-reconstruction.mjs prepare` defaults to A and single-page packets. Benchmark arms remain historical comparison settings, not production choices. No automatic fallback. Old Gemini manifests remain readable and are not silently repinned or resumed.
- Reconstruct mathematical diagrams and graphical answers in TikZ. House style: **no letter O at Cartesian origins**; retain named points elsewhere. Put each question number on the first line of its stem, including questions beside diagrams.
- Removed repeated “Edit content and layout” buttons. Click content directly to open the editor; Enter/Space still activate the accessible content targets. Do not reintroduce those buttons.
- Shared editor release 1.1.2 hides MathLive keyboard/menu toggles. Keep those controls hidden.
- Solutions: left sidebar, **PDF configuration → Practice answers → Short answers / Worked solutions**. **Show theory solutions** controls teaching examples. The source-preserving pilot switches modes on its twelve pages. Other projects may append answers at the back. Keep the labels accurate for each behavior.
- “Booklets” is the editable project workspace; “Full booklet” is source import/evidence/transcription review. They are separate workflow stages, not interchangeable copies. A rename to “Source imports” was discussed but not implemented or explicitly requested.

## Reference workflow, verified in MathsDatabase

Read `D:/WebApps/MathsDatabase/js/admin.js`:

- `setupPreviews()` around line 227 listens to question, solution and feedback inputs, debounces 300 ms, then calls `renderTextWithImages`, `renderMath`, and `renderTikz` into paired previews.
- `_insertImageAtCursor()`, `insertInlineImage()` and `handleImagePaste()` around lines 242–272 preserve the insertion location, show upload feedback, insert the image reference and trigger preview refresh. Treat this as a behavior reference, not a storage format to copy blindly.
- `admin.html` contains the paired input/preview layout. `js/tikz.js` supplies queued, cached TikZ rendering. The app's `[img:URL]` syntax is a text transport; the requested MathsEditor result must be actual structured image content.

## 1. True images within prose

Current `document-model.mjs` accepts paragraph inlines only for text, maths, breaks and cloze. Images are block-level figures. The existing image placement value `inline` does **not** make an image a paragraph inline. `document-editor.js` reads images as blocks and the toolbar inserts a block. Finish the model rather than merely changing figure CSS.

Add a stable inline image representation with source/asset reference, accessible alt text, dimensions/aspect ratio and the placement behavior needed within a sentence. Keep existing block figures, captions and side-by-side figures backwards compatible. Inserting or pasting at a caret between “before” and “after” must retain that prose and ordering. An image must survive mixed prose/math/table documents, native editing, selection/copy/cut/paste, undo/redo, Save/Cancel, reload and print. Reuse the existing safe image validation; do not introduce expiring blob URLs into saved documents.

Update normalisation, DOM capture, rendering, rich clipboard and serialisation together. Define explicitly what plain-source export can represent; never silently flatten or drop an inline asset. Test missing-image feedback and stable sizing during image decode. Clicking an inline image should expose properties without losing the text caret or initiating an unrelated block edit.

Primary files: standalone `document-model.mjs`, `document-editor.js`, `document-editor.css`, `clipboard.js`; MathsMap `src/lib/document-content.js`, `src/components/MathsEditor.svelte`, `BookletRichText.svelte`, `EditableBookletText.svelte`.

## 2. Smoother merged-table editing and direct width adjustment

The model already stores table `widthMm`, relative column `widths`, row heights, cell `rowspan`/`colspan`, cell alignment/rotation/shading/borders and stable cell IDs. The inspector currently exposes “Table width (mm)” and a comma-separated “Column widths” field. That is not the direct cell-width workflow requested.

Provide a selected-column numeric width control in millimetres and draggable column boundaries, with live table and annotation updates. Explain merged-cell width as the sum of covered column tracks; avoid creating inconsistent widths per row. Preserve overall table width when dragging an interior boundary, with minimum widths and sensible page-bound limits. Offer keyboard resizing and clear labels. One completed drag should produce one undo transaction; inspector typing must not lose focus or caret on each render.

Replace physical-array-index assumptions with a logical table occupancy map before extending merge/split behavior. Existing “Merge down” and row/column commands reject already merged tables, and selection derives a column from a row-array index. Handle mixed horizontal and vertical spans without content loss, row drift or duplicated IDs. Preserve rotation, shading, borders and widths after merge/split and row/column edits. Maintain deterministic content order.

SVG annotations in `table-annotations.mjs` anchor arrows/circles/boxes to cell IDs. Resizing must keep them attached live. When a merge removes an anchored cell, explicitly remap to the surviving cell or report an unresolved anchor; never silently lose arrows. Splitting must preserve valid anchor identity. Avoid per-keystroke whole-surface redraws that jump focus.

Primary files: standalone `document-editor.js` (`properties`, `transact`, `render`, merge/split handlers), `document-model.mjs`, `table-annotations.mjs`; synced MathsMap renderer `BookletRichText.svelte`.

## 3. Live TikZ preview while editing

Current `BookletReviewInspector.svelte` stores typed code in `diagramDrafts[d.id]`, but `<Tikz code={d.code}/>` previews the saved code. Thus the preview does not reflect typing until a proposal is applied. Add a live draft preview next to the code editor, using draft code, with about 300 ms debounce and a sequence token/cancellation rule so an older compilation cannot replace newer output.

Reuse `src/components/Tikz.svelte`, `src/lib/tikz.js` and their queue/cache/cancellation APIs. Do not load a second TeX engine or compile on every keystroke. Keep the last successful diagram visible while a draft compiles or has an error; label that state clearly so it cannot be mistaken for the current draft. Surface a useful compile error near the code and allow recovery without discarding edits. Changing a width should update layout immediately without recompiling unchanged TikZ.

Save/Cancel must be explicit. Existing proposed-repair review semantics should remain intact where the inspector uses proposals; previewing or saving a draft must not grant mathematical/fidelity approval. Preserve student/answer diagram identity, graphical answers and overlay/shared-figure relationships. Ensure the preview works for question, solution and teaching diagrams, not only the first question diagram found by the inspector.

## 4. Representative editing, save and print verification

Use a temporary copy or mocked read-only API fixtures for browser tests. Never run destructive test edits against the user's live pilot. Start with the existing checks rather than constructing a second test harness:

```powershell
npm.cmd test
node --test D:/WebApps/MathsEditor/tests/document-model.test.mjs
node scripts/booklet/check-document-editor.mjs
node scripts/booklet/check-fidelity-v3.mjs
node scripts/booklet/check-pilot-layout.mjs booklets/projects/linear-relationships-pilot-v1.json output/linear-pilot/house-style/browser-verification.json
npm.cmd run build
```

Representative cases:

| Fixture | Required interactions and checks |
| --- | --- |
| Prose + inline maths + true inline image | Paste image at caret, type before/after, resize, copy/paste mixed selection, undo/redo, cancel, save/reload, keyboard access, print with correct position and aspect ratio. |
| Source 13/14 structured tables | Adjust selected column width live; rotated substitution text remains readable; horizontal/vertical alignment and table bounds survive saving. |
| Mixed row/column-span table | Merge/split in both directions, edit nested maths, add/remove row/column, undo/redo, stable IDs, no clipped cells or lost prose. |
| Source 29/33 annotated tables | Resize cells with live arrows/circles/label boxes; save/reload and print preserve anchors, colours and boxes. |
| Source 7/9/16/28 diagrams | Type rapid valid → invalid → valid TikZ edits; newest output wins; Save/Cancel work; coordinates/lines/scales/clipping and no-origin-O style stay correct. |
| Two browser sessions | Stale save returns 409; edits remain recoverable, refresh/merge does not silently overwrite them, saving does not approve content. |
| Student / short / worked modes | Correct answer visibility, actual plotted solutions, no duplicate headings/solutions, question number/stem on same row, table and image alignment, no footer/page collision. |

After the relevant model/browser tests pass, export representative PDFs through the actual project renderer, inspect every exported page, and fix visible defects. Inspect narrow/wide tables and both portrait-style long number lines and square Cartesian plots. Successful TikZ compilation alone is not mathematical verification. Sync only the intentional standalone release files with `scripts/booklet/sync-maths-editor.mjs`, increment its release version and retain checksums.

## State and preservation notes

- Initial three-arm benchmark is immutable under `.booklet-work/reconstruction-benchmarks/linear-three-model-v1`. 15/36 page candidates completed; no satisfactory winner. A completed nine pages, B three, C three. The last packet (28/29/33) failed: Astra/Luna timed out; Gemini reached its output limit. Manual recovery was performed only after initial scoring.
- The corrected composite's origins are eight A pages, C page 2, and three explicit manual reconstructions. Selecting Astra for future work was the user's later instruction, not a benchmark victory claim. Do not rebrand the composite as all-Astra.
- User edits are in the current project and `.revisions/`. The origin-label patch preserved revision 5 and wrote revision 6; re-read before working because it may have advanced. `output/linear-pilot/house-style/changes.json` records the 16 diagram edits. Earlier PDFs and `review.json` describe the previous exported revision; regenerate and inspect new exports before claiming updated PDF verification.
- Existing `booklets/question-bank/manifest.json` modification predates this work. Leave it alone. Do not overwrite imports, original evidence, candidates, user edits, approvals or frozen benchmark results. No publication, deployment, full 93-page repair or extra model comparison is authorised by this handoff.
- At handoff: 397 application tests and the production build pass; all twelve current print pages pass geometry checks in student/short/worked modes, including first-line question labels. New transcription routing is tested with an injected runner, without starting another paid transcription job. The larger usability features above remain to implement.
