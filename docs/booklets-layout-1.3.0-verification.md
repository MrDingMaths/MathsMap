# Booklets layout controls — MathsEditor 1.3.0 verification

Verified on 6 September 2026. MathsMap consumes the standalone MathsEditor **1.3.0** release through `scripts/booklet/sync-maths-editor.mjs`. All **35** copied runtime files match both their recorded SHA-256 checksum and the standalone source.

## Delivered behaviour

- Focused question editing provides text/diagram width, gap, fixed/fit diagram sizing, Reset and local layout undo. Pointer and keyboard resizing retain the total row width. Content and layout remain drafts and commit together on Save.
- Paragraph indent and worked-example block inset are separate controls. The enclosing production question is shown in the preview.
- Paragraph tab stops support exact millimetres, a draggable ruler, left/centre/right/decimal alignment, dots/underline leaders, copy/apply settings and explicit conversion of selected trailing dots. Shared measurement runs in editing, preview and print.
- Table shading, text colour, border colour and border width have explicit cell/row/column/table scopes. Maths inherits production ink; authored colours remain intact. Arrows have accessible selection and visual geometry/style controls.
- Questions, Short answers and Worked solutions are visible canvas controls. They retain page/scroll state and do not autosave or change PDF settings. PDF has an explicit Use current view action.
- Turning off Show theory solutions leaves the measured solution area blank for students to copy the example. Hidden working and solution diagrams retain geometry, are inert and excluded from accessible content and printed marks. Prompts remain visible.

Storage remains additive document version 1 and the existing project settings format. Saving does not approve content. Diagram edits still create proposals; acceptance and approval remain separate.

## Automated checks

| Check | Result |
| --- | --- |
| Application tests | 401 passed |
| Standalone document-model tests | 14 passed |
| Existing document-editor browser check | Passed, default and contextual controls |
| Existing studio workflow browser check | Passed, intercepted fixture writes |
| Fidelity browser check | Passed, no browser errors |
| Current-project pilot layout | Passed on revision 18; 13 pages and 13 footers in all three modes |
| Production Vite build | Passed; existing large-chunk advisory |
| Shared release checksums | 35/35 match source and release manifest |
| Whitespace diff check | Passed |

Browser coverage includes inline-image editing and clipboard/history, merged tables and annotations, numeric/ruler focus and undo transactions, inherited colour, narrow-column mixed maths/text tabs, layout Save/Cancel/reload, proposal acceptance/undo, independent TikZ drafts and cached/error outcomes, and two-session conflict recovery. Saving remains distinct from approval.

The workflow ran at 1920×1080, 1440×900, 1280×800, 1024×768 and 390×844, with light/dark themes, keyboard focus, responsive tabs and 200% zoom. The pilot geometry check additionally covered 883×994 and all three paper zoom choices, retaining the regression assertion for the clipped left page edge and shell overflow. The hidden-theory test asserts identical example/solution heights, hidden/inert content and no project writes.

Detailed logs are in `tmp/layout-1.3.0/`: `tests.log`, `document-browser.log`, `workflow.log`, `fidelity.log`, `build.log`, `pilot-layout-revision18.json` and `final-audit.json`. Browser fixture mutations are intercepted and unmatched booklet mutations are blocked, including interception of the manifest GET that otherwise regenerates its timestamp.

## PDF inspection

PDFs were exported through the actual project renderer, with fonts and TikZ settled. Each final page was rasterised with Poppler at 1600 px and visually inspected, including labels, tables, shading, image alignment, graphical answers, rotated text, annotation anchors, plot geometry and footers.

| Snapshot | Modes / pages | Result |
| --- | --- | --- |
| Initial fresh pilot, revision 12 | Student, short and worked; 12 each | 36/36 pages pixel-identical to the same-snapshot pre-change document-rendering baseline |
| Edited representative fixture | Student, short and worked; 6 each | All 18 pages inspected; no page/footer collisions |
| Revision 12 with theory solutions hidden | Student; 12 pages | All pages inspected; blank example copy space retained; no collisions |
| Final fresh pilot, revision 18 | Student, short and worked; 13 each | 39/39 pages pixel-identical to the same-snapshot baseline; no collisions |

The baseline reverses the recorded additive document-model changes and intercepts that module during export. It is a **pre-change document-rendering comparison**, not a complete archived 1.2.1 application build. Pilot snapshots were read directly from current project files; project content was never reconstructed from previous output.

Edited fixtures cover the source 7 text/diagram split, source 9 tab leaders, source 13 inset and table colours, and source 29/33 styled cell-anchored arrows. The narrow-column PDF check exposed and fixed subpixel tab wrapping: measurement now uses computed fractional width and resets prior tab widths before measuring. Source 14 rotated tables and source 16 worked diagrams were inspected in the full pilot exports. The hidden-solutions PDF also has a text-extraction check confirming that source 13's example prompt remains and its hidden calculation text is absent.

Final current-snapshot PDFs:

- [Questions, revision 18](../output/pdf/editor-1.3.0-pilot-revision18-student.pdf)
- [Short answers, revision 18](../output/pdf/editor-1.3.0-pilot-revision18-short.pdf)
- [Worked solutions, revision 18](../output/pdf/editor-1.3.0-pilot-revision18-worked.pdf)
- [Blank example copy space, revision 12](../output/pdf/editor-1.3.0-copy-examples.pdf)
- [Edited representative questions](../output/pdf/editor-1.3.0-edited-student.pdf)

Raster pages/contact sheets are in `tmp/layout-1.3.0/pdf-pages/`; pixel comparison results are `pdf-comparison.json` and `pdf-comparison-revision18.json`. Successful compilation and layout inspection do not constitute mathematical or fidelity approval.

## Preservation and limits

The live pilot advanced from revision 12 to 18 during implementation. The additional section and all live edits were retained. The final file matched the read-only revision 18 snapshot byte for byte after verification. Revision 18 SHA-256: `5009c377e3d927aeb44bcc22c61136140e0ddf507f6e6e4cd310bdb432fd4e8f`. No project save was sent to the live API by this work. The bank manifest differed only in its generated timestamp; its current value was retained. The content manifest remained byte-identical. Existing changes, revisions and evidence were not reset.

Plain-source export emits tab characters and reports lost tab positioning, leaders and styling; rich JSON is authoritative. Tab stops beyond a narrow paragraph are visually constrained to its available edge. Applying stops to question parts does not automatically rewrite their punctuation. Layout undo is local to the layout controls; Save combines the final content and layout into one project transaction. Existing diagrams keep their sizing until edited.

No deployment, database changes, transcription jobs, model comparisons or broad source repairs were performed.
