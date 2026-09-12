# Volume revision 198 feedback repairs

The reference for exercise headings is canonical Linear Relationships v1: right-aligned uppercase 13 pt bold text, a 0.25 mm standard-blue top rule, 6 mm minimum height and 1 mm following margin. `BookletHeading` owns both page-start and inline headings, plus the main section band. Syllabus blocks may use `presentation.kind: main-section-header`; their original table is retained as source-layout evidence.

Standalone difficulty labels in compact imports use `presentation.editorOnly: true` and `presentation.sourceDifficulty`. This preserves source IDs, content and inventory evidence without printing a source tier. Presentation readiness flags unsuppressed plain or structured labels. Detection is restricted to standalone label content, never comments, source evidence or prose containing these words.

Practice continuation numbers appear only on the opening question fragment. Generated fragments omit the repeated opening stem; source continuations retain any new substantive instructions. Part labels, indentation and answer references remain intact. Teaching numbering is separate.

Select a multiline equation to edit **Equation row spacing (mm)**. This is extra spacing inside the equation; the Paragraph line-spacing control applies to prose. The control preserves nested matrices/substacks and supports mixed values without rewriting unrelated mathematics. Unsupported structures retain the Edit LaTeX route.

Select an empty paragraph and use **Delete paragraph** in the Studio toolbar, or Backspace/Delete while its caret is in the empty paragraph. The editor's necessary insertion placeholder does not become a printable blank. Intentionally inserted empty paragraphs remain supported.

Select an image/diagram to use **Space above image** on the toolbar or in Layout. This changes the selected image's spacing independently of column alignment. Native document images expose the same property. Structural edits retain separate undo steps and save/reopen behaviour.

Volume's local changes are 44 mm bottom-aligned diagram slots with 2 mm scaffold gaps on source page 16, 3 mm extra equation spacing on page 20 a?c, deletion of the specified empty paragraph in l, and 2 mm above both page 24 cylinder images. These dimensions are local choices, not future-booklet defaults. Mathematical content, original source evidence and drawing geometry remain unchanged.

Print group wrappers now use the same block layout as the paginator. The previous print-only display:contents changed margin behaviour and allowed reserved writing space into the footer-clearance area. Actual PDF and DOM checks must both pass.

Verification and comment acceptance are recorded in `booklets/provenance/volume-v1/feedback-r198.json`; local PDF/page evidence and measured runs are under `.booklet-work/volume-r198/`. Do not interpret these feedback repairs as resolution of unrelated source or solid-geometry review findings.

Accepted in Volume revision 200 after rendering revision 199. All seven comments are resolved, with original review data retained. Final equation writing-baseline gaps are 9.525?9.790 mm. Minimum measured PDF footer clearance across the 20 edition exports is 3.598 mm. The suite passed 729 tests; the production build passed. See the provenance register for page coverage, measured phase durations and retries.
