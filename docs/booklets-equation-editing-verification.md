# Equation editing and Linear Relationships page 74 — 2026-09-08

The structured editor now provides **Text before equation**, **Text after equation** and **Delete equation** in its equation toolbar. Escape returns to following prose; Shift+Escape returns to preceding prose. Backspace/Delete on an already empty MathLive field removes its wrapper. Deletion from the adjacent prose boundary removes the whole equation and participates in document undo/redo. Actual spaces still delete individually.

Chromium discarded native selections beside an otherwise isolated display equation. Editable-only caret spans now provide valid text positions. Their zero-width sentinel is removed when reading or copying content; rendered booklet output contains no caret spans. The same anchors are installed for inserted and reloaded equations. Text, mathematical formatting and table boundaries are preserved.

Linear Relationships revision **157** repairs source page **74**: removed the duplicate `y=-2x+1` from the last comparison, consolidated equation pairs with a line break, removed stray boundary whitespace, and standardized example spacing. References to merged paragraphs were removed from the saved arrangement while retaining the custom columns and diagrams. Revision 156 remains in the project's revision history. Other sections are unchanged.

Verification:

- `node scripts/booklet/check-equation-editing.mjs http://127.0.0.1:5174/libs/maths-editor/studio.html`: browser keystrokes cover empty/adjacent deletion, typing on both sides of inline/display equations, spaces, undo/redo, reload, tables, readonly, paragraph joining, Shift+Enter, insertion and clipboard sentinel removal.
- Existing standalone document and math-editing browser checks pass.
- 58 targeted unit tests pass for equations, project persistence, content, arrangements, spaces and lists; Vite production build passes.
- Saved page 74 renders all ten graphs, has no layout QA issues and has about 35 mm footer clearance. Screenshot: `tmp/p74-fixed.png`.

The MathsMap runtime already contains host changes absent from `D:/WebApps/MathsEditor`, including `math-editing.mjs`. This repair updates the host runtime and its affected release checksums. Before running the standalone sync, carry these changes into the standalone project; a blind sync would discard host editor fixes. This supersedes the earlier integration document's assumption that the two runtime trees are identical.
