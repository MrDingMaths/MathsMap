# MathsEditor structured-document integration

## Equation selection and history (1.6.1, 11 September 2026)

Selected equations have a screen-only blue wrapper highlight that persists through equation controls and dialogs. Shared transient bookmarks retain the caret and selected range; equation-only undo updates MathLive in place. Structural undo restores the field or a neighbouring prose position. The booklet adapter also restores legacy source fields whose paragraph IDs are regenerated when reopened, using the saved equation ordinal only when the equation count is unchanged.

The standalone source now includes the former embedded editing and palette changes, source-colour support and shared fraction spacing. The sync manifest includes `math-editing.mjs`, `math-selection.mjs`, `equation-spacing.mjs` and the palette files; MathsMap's current house style is preserved. See [equation editing and its regression checks](embedded-equation-editing.md). This release changes no stored document schema or public change-event shape.

## Numbered theory lists and teaching labels (2026-09-07)

Numbered source lines (`1.` or `1)`) now use the same semantic list pipeline as bullets, retaining start numbers, explicit number changes, nested bullets and a 7 mm hanging indent. Format includes Numbered list. The specialised numbered-rules theory layout also uses native `ol`/`li` while retaining its paired detail/maths columns.

Activity/investigation/identify boxes, examples and guided practice display alphabetic task labels without a root question number. Letters continue across blocks sharing a source-atom box; unlabelled shared stems do not consume a letter. Nested task leaves receive the next letter. Independent practice retains its question numbers. Labels are derived from stable content IDs for preview, focused editing and print; original source labels and references remain stored. Saved arrangements keep their layout and receive missing label references where necessary.

Validation: 58 focused unit tests; `check-teaching-numbering.mjs` verifies ordered-list creation/continuation and matching teaching labels in preview, focused editing and print. `check-bullet-lists.mjs` covers the existing bullet behavior.

## Semantic bulleted lists (2026-09-07)

Ordinary legacy `•`, `-`, `*`, `+`, `◦` and `▪` bullet lines now share a list parser between booklet preview and the structured editor. They render as real `ul`/`li` elements with outside markers and a 7 mm text inset per level. Wrapped lines align with item text. Previewing does not rewrite project content; saving a content draft stores the structured list.

Structured `list` blocks retain `items` containing stable `list-item` identities and child blocks, plus ordered/start and indent properties. Normalization, traversal, HTML rendering, rich clipboard and identity renewal cover nested lists. HTML paste preserves unordered and ordered list structure. The Format menu provides Bulleted list, Indent list and Outdent list. Enter continues a list, an empty item ends it, and Tab/Shift+Tab nest/outdent the current item. Escape then Tab leaves the editor. Ordinary paragraph tab stops remain 10 mm apart.

`tests/booklet-lists.test.js` covers parsing, nested content, identities and legacy preview blocks. `scripts/booklet/check-bullet-lists.mjs` checks native editing, nesting, HTML and partial-list clipboard, undo/redo, 7 mm print geometry, and the actual Studio legacy-list preview/focused editor without saving to user projects.

## Studio interaction update (2026-09-07)

Contextual Format, Insert and selection Properties now open as popovers over the editing surface. They dismiss on outside pointer input or Escape. Selecting the same content retains the existing property controls; opening a content draft retains the arrangement canvas width on desktop. The structure navigator uses rendered text and maths previews instead of raw source snippets.

Default paragraph tabs advance to 10 mm increments from the paragraph's indented text origin. Contextual properties explain this default and offer **Use 1 cm default tabs** for paragraphs with saved custom stops. Existing custom alignments and leaders remain intact until reset. The standalone editor retains its custom-stop controls. Source changes are mirrored in `D:\WebApps\MathsEditor` and the bundled release checksums are updated.

The shared question arrangement reserves 7 mm at each labelled level: a 6 mm label box and 1 mm remaining inset. Thus the heading and first part label begin 7 mm from the question-number origin, and first-part prose begins at 14 mm. Default group/column gaps are 2 mm. Column pitch depends on available question width and column count; row heights also depend on prose, maths and answer space. Paragraph indentation is an additional property, defaulting to 0 mm.

Validation: `check-studio-menu-stability.mjs` checks content position, retained controls, tabs, rendered maths and canvas width. Use the current isolated document and arrangement checks listed in `booklet-document-editing.md`; historical run results are retained locally.

The source of truth is `D:\WebApps\MathsEditor`. MathsMap consumes the pinned release identified in `public/libs/maths-editor/release.json` under `public/libs/maths-editor`; `release.json` records SHA-256 checksums for every runtime file. Run `npm run booklet:sync-editor` after changing and verifying the standalone source. Do not patch the copied runtime independently.

## Public API

Load `maths-editor.js` as an ES module and create `<maths-editor structured>`. Assign `editor.document` to a JSON document with `format: "maths-editor-document-v1"`, `version: 1` and a `blocks` array. Reading `.document` returns a copy. Persist this property, including identities and nested blocks.

Listen for `document-change`; `event.detail.document` is the structured value and `event.detail.source` is its legacy text/maths projection. `detail.losses` describes projection losses and `detail.layout` requests immediate layout preview updates. The existing `.value` string API remains available for legacy prose and equations. Assigning `.value` replaces the document through the legacy parser: it must not be used as rich-document storage. The Svelte adapter keeps draft content local until Save; committed edits use existing project persistence.

`readonly` disables editing. History covers prose, MathLive input, tables, layouts and image properties. Rich clipboard data uses a custom JSON MIME representation, with text/HTML fallbacks; the destination gives pasted nodes fresh identities.

## Storage

- Paragraphs contain text with marks, inline/display math, breaks, cloze fields and true `inline-image` nodes. Each inline image has `id`, validated `src`, accessible `alt`, `width` in mm, `aspectRatio`, and `verticalAlign` (`baseline`, `middle`, `top`, `bottom`). Paragraph properties hold spacing, font size, alignment and indentation.
- Tables hold column width ratios and rows of cell origins. `table-model.mjs` resolves logical occupancy across row/column spans. Cells retain nested blocks, spans, borders, padding, alignment and optional rotation. Optional `splitStyles` stores original formatting by covered grid position, without old text or identities.
- Images retain source, alternative text, caption, width, aspect ratio, crop percentages and placement. Uploaded images use data URLs, so saving does not depend on a temporary object URL.
- Layout blocks retain an arrangement (`investigation`, `parallel`, `worked-rows` or `scaffold`) separately from content slots.
- Spacers retain working-space height.

The structured-document normalizer rejects unsupported versions. Existing string content is parsed only when opening the editor; it is not destructively rewritten during project loading.

## Verification and current limits

`node scripts/booklet/check-document-editor.mjs` exercises the standalone fixture through a browser. `node scripts/booklet/check-studio-workflow.mjs` exercises the Svelte integration with intercepted writes. Unit tests cover storage and review invalidation.

The Image action and image paste insert at the caret, including within table cells and layout slots. Block figure remains available for captions, cropping and beside-text placement. Inline image dimensions reserve space while loading; missing assets show feedback. Enter/Space opens image properties; arrow keys return to adjacent prose.

`exportSource(document)` returns `{ text, losses }`; `toSource(document)` remains a string compatibility projection. Inline assets emit `[Image "alt" source="stable source"]` in prose order. This marker is readable, not a round-trip source syntax. Structured JSON and rich clipboard retain assets and layout. HTML clipboard data includes an encoded structured payload plus a rendered fallback; copied nodes and annotation references receive fresh identities.

Select a table cell to choose a logical column and type its width in mm. Numeric changes preserve other columns and change total width. Drag an interior boundary to redistribute its two tracks while preserving total width; arrows change it by 1 mm, Shift+arrows by 5 mm. One drag is one undo step; Escape cancels. Merges preserve row-major content order, survivor identity, and formatting snapshots. Split keeps current content in the survivor and restores empty cells' formatting. Missing annotation anchors remain stored and are reported; merge remaps endpoints, including visible self-arrows.

Content editors and the standalone studio show paired rendered previews. TikZ proposal editors debounce draft compilation for 300 ms and keep a labelled previous successful preview during compilation or errors. Width-only edits do not compile. Save proposal records pending changes; acceptance and fidelity approval remain separate.

HTTP 409 stops automatic retries and retains edits. Recovery download includes the project and active drafts. Load latest and merge combines disjoint edits by stable IDs; overlapping fields require a local/latest choice. Structured document fields are atomic during conflict resolution.

AI/OCR and free page positioning remain outside this release. Plain source cannot preserve rich formatting or layout. Splitting does not reconstruct the original distribution of prose: all current merged prose remains in the surviving cell.


## Booklets workspace and contextual controls (1.2.1)

Booklets uses a 240 px collapsible page navigator and a paper canvas. The navigator becomes a drawer below 1100 px. The header owns project selection, save status, Undo/Redo, source comparison, Review and PDF. Project details and destructive project actions live in Project; assembly and measurements open full-width Tools views. Navigation, zoom and panel preferences are session-only and never change the project or its approvals.

The canvas defaults to Fit width. Fit page, 100% and incremental zoom scale only the paper. Compare source temporarily hides navigation and displays independent source/booklet zoom controls; Exit comparison restores the prior canvas scroll. Review provides Proposals, Approvals, Mapping and Flags, docking at 360 px only when at least 794 px remains for the canvas. PDF settings retain the existing source-preserving and appended-answer semantics.

`EditableBookletText` accepts `oneditrequest({rootId, pointer, value, selectedNodeId, selectedType, origin, commit})`. Booklets supplies the same handler through Svelte context so nested renderers retain existing content pointers and commit adapters. Other studio workflows retain their default editing interface. Diagram requests retain their target, identity and field path.

The project owns a native modal edit session outside the scaled preview. It has a maximum width of 1600 px and 24 px desktop viewport margins. Save/Cancel stay visible; explicit Cancel discards the draft. Escape/Close on a dirty draft offers Keep editing or Discard. Focus returns to the original content, including when Save replaces the rendered element. Content and diagram previews share the same resizable split view; arrows move its divider by 1 percentage point and Shift+arrows by 5. Below 1000 px, Edit/Preview tabs retain the mounted editor, history and draft. Source evidence occupies an optional preview tab.

Set `controls="contextual"` before attaching `<maths-editor structured>` to opt in to Format, Insert, common selected-object properties and Advanced controls. The default standalone toolbar is unchanged. On narrow screens Format is collapsible. Column selection, numeric width, merge/split and boundary handles remain in common table controls; crop and annotation JSON are under Advanced; 1.3.0 brings table colours and border width into common properties. Contextual paper stays white in dark application themes; production ink and authored maths colours are retained.

Diagram editing uses Save proposal; this creates pending field repairs rather than accepting them. The existing compile queue, cached results, cancellation, last-successful output and error diagnostics remain authoritative. Save, compilation and layout changes confer no mathematical or fidelity approval.

## Direct layout controls (1.3.0)

Open the text beside a diagram to change **Text column width (mm)**, **Column gap (mm)** and **Diagram sizing**. The divider preserves the available row width; arrows move it by 1 mm and Shift+arrows by 5 mm. Fixed diagrams retain their authored width; Fit available space uses the remaining track while preserving aspect ratio. Layout changes remain in the focused draft until Save, with local Undo layout/Redo layout and Reset. Cancel discards them. The preview renders the enclosing question with production assets.

Worked-example prompts expose **Block inset (mm)** separately from paragraph **Indent (mm)**. Existing 5 mm prompt insets remain until explicitly changed. Legacy single-paragraph editing retains the inherited line height and avoids adding a new trailing paragraph margin on Save.

Paragraphs optionally store `tabStops: [{position, align, leader}]`, with positions in millimetres, alignment `left`, `center`, `right` or `decimal`, and leaders `none`, `dots` or `underline`. An inline `{type: 'tab'}` advances to a stop. The ruler and numeric fields edit these values. Insert tab or press Tab in prose; Escape then Tab leaves the editing surface. MathLive retains its own Tab navigation. Copy/Paste tab settings transfers paragraph stops. In a question session, Apply to this question’s parts schedules the same stops for sibling part prompts on Save. It does not automatically replace their existing punctuation.

Select an existing dotted answer line and choose **Insert → Replace selected dots with tab leader** to create two stops: an unlined gap followed by a dotted line. Both ends can then be aligned independently. Existing exercises are not rewritten on load. The shared `mountTabs` renderer measures subpixel geometry after fonts, maths, images, resizing and print layout settle. Stops beyond a narrow container end are constrained to its available edge; wrapping prose remains in normal flow.

The rich document and clipboard retain tabs. Plain export emits actual tab characters and loss diagnostics for positioning, leaders and styling. Plain text is not a layout-preserving round trip. Rich layout blocks optionally store numeric `tracks` proportions; omitted tracks retain equal columns.

Table Shading, Text colour, Border colour and Border width are common properties, with selected-cells, row, column and whole-table scopes. Drag-select cells for a multi-cell scope. Mixed values are shown explicitly; whole-table border changes also replace existing cell overrides. No fill and Inherit reset supported properties. MathLive inherits authored cell colours instead of forcing dark ink; the focused adapter passes production ink and typography into its white paper surface.

Select an SVG table arrow or its labelled Edit arrow button to edit endpoints, label, colour, thickness, curve, spacing, side and arrowheads. Endpoints remain stable cell IDs. Optional `thicknessMm`, `curveMm`, `distanceMm` and `heads` fields preserve the old geometry when omitted. Custom curves reserve enough margin for their labels. Editing hit targets are absent from document exports; unresolved anchors remain diagnostics. Table merge/split and clipboard remapping retain annotation semantics.

Booklets stores its optional overrides under `settings.layoutOverrides.blockLayouts[targetId]`, with `textWidthMm`, `gapMm`, `diagramSizing`, `diagramWidthMm` and `insetMm`. There is no backend or project-version change. Focused sessions add enclosing layout and rendering context to the existing edit request and commit content/layout in one project transaction. Geometric changes invalidate layout review; annotation text or content changes follow normal content invalidation. No edit grants approval.

**Questions / Short answers / Worked solutions** are always available beside page navigation. This session-only view preference does not change project content, approval state or PDF settings. PDF → Use current view explicitly copies it to the current export options. Source-preserving and appended-answer export semantics remain unchanged.

Turning off **Show theory solutions** preserves the measured working area as blank copy space, including solution-only diagrams. Prompts and base question diagrams stay visible. The hidden solution stays mounted for accurate font/diagram sizing, is inert and hidden from assistive technology, and is not painted into the PDF. Re-enabling the option restores the working without moving subsequent content.

## Teaching answers and back-of-book export (1.3.1)

PDF configuration also provides **Show review answers**, **Show identify answers** and **Show guided practice answers**. These independent switches affect the canvas and full-booklet export. Identify includes activity, proof, investigation and verification kinds; it does not depend on the editable heading text. They start off unless enabled in saved defaults. Enabled groups show worked answers, or short answers when the canvas uses Short answers. Toggling is temporary until Save as defaults.

**Add content → Activity (identify / proof / investigation)** creates a question-based teaching activity. Review activity and Guided practice are also explicit options. Block properties provide Activity style. Click the bold heading to edit it through the focused Save/Cancel session; grouped imported headings update all their member blocks in one transaction. The bold Theory heading is editable too, and a new theory block no longer repeats “Theory” as its subtitle.

**Short answers only (back of book)** exports an answers-only document for independent practice, omitting the cover, theory, examples, review, activities and guided practice regardless of the teaching switches. This replaces the former short-answer source-page/appended-booklet behaviour. It retains question numbering and graphical answers, groups by booklet page in source-preserving projects, and flows in at most two columns without forcing a page break for each source section. Worked-solution export retains its previous full-booklet/appended behaviour.

The shared arrow renderer measures in local CSS pixels, so paper zoom no longer changes apparent curvature, line weight or arrowhead size. Adjacent arrows leave a small gap at their common cell, use diagonal curve tangents and point arrowheads along the curve. Anchors, labels and authored style fields remain unchanged.


## Booklet house style ? pinned release 1.4.0

Shared changes were made in the standalone MathsEditor project and synced with `scripts/booklet/sync-maths-editor.mjs`. Release 1.4.0 includes `house-style.mjs`, opt-in house-style table insertion and dotted cloze defaults without redundant table blanks. Booklet Studio mounts the selected editor directly on the page and shares the same structured document, tab, table and crop controls with the focused editor. See [the current editing workflow](booklet-document-editing.md).


### Release 1.4.1

Adds named swatches from the shared booklet palette to shading, text, border and arrow colour controls, retaining custom hex/native pickers and existing undo/read-only behavior. Shared source remains in the standalone MathsEditor project. Booklet Studio now defaults to focused editing following the user preference.


### Release 1.5.0 ? annotated equations

Adds structured annotated-equation blocks, term anchors, editable maths/prose labels, annotation properties and measured vector arrows. Native equation input commits to the focused draft and shares document undo. Rich copies remap target identities; removed targets remain flagged. Shared fixed-pitch vector cloze leaders replace width-dependent dotted borders in the booklet house style. See [the current editing workflow](booklet-document-editing.md).


### Focused arrangements - 7 September 2026

Pinned MathsEditor 1.6.0 adds the shared arrangement transaction model, illustrated tab guidance and orange palette. Studio opens whole questions with structural movement, sizing/spacing controls, selected content editing and direct diagram saves. Revision 44 adopts the P11/P30/P38/P39/P41 repairs while preserving unrelated edits. See `docs/booklet-focused-editing.md` and `docs/booklet-human-workflow.md`.
