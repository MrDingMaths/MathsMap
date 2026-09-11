# Embedded equation editing

MathsMap's structured MathsEditor now provides:

- A searchable Symbols picker (Tab while inside an equation), hosted inside the active editor dialog.
- Arrow-key entry from adjacent prose and exit from equation boundaries; Escape returns to prose.
- Tab to insert maths in ordinary prose. Existing table, list, tab-stop and Escape-then-Tab behaviour is retained.
- Bold/italic and colour controls for MathLive selections; document formatting shortcuts also act on focused maths.
- An Edit LaTeX dialog with preview, Apply and Cancel.
- A blue outline and light tint on the selected equation, retained while its tools, Symbols picker or LaTeX dialog are open. Selection styling is transient and excluded from print.
- Selection-aware undo/redo, including whole-equation deletion and a neighbouring prose caret. Equation-only history changes retain the mounted MathLive field. Booklet bookmarks retain selected ranges and support regenerated legacy paragraph IDs.
- In-page equation tools appear below the main document toolbar, outside scaled paper and narrow question columns. They retain readable colours in both themes. Long live equations scroll within their field rather than covering neighbouring questions.

The source of truth is `D:\WebApps\MathsEditor`. Release 1.6.1 reconciles the former MathsMap-only interaction, palette, source-colour and fraction-spacing enhancements into that source. `math-editing.mjs` owns equation tools; `math-selection.mjs` owns transient bookmarks and equation-only history updates. `document-editor.js` connects both. The sync script includes those modules, equation spacing and palette assets, while preserving MathsMap's host house style. Do not replace the bundled runtime with an older standalone copy.

Verification: `node scripts/booklet/check-math-editing.mjs` exercises the actual browser editor in a temporary modal without modifying booklets. It covers selected-maths formatting, palette insertion, keyboard navigation, LaTeX apply/cancel, structured save/reload and Tab insertion. The relevant 44 Node tests and production build pass.

The 1.6.1 regressions are `check-equation-reliability.mjs`, `check-equation-editing.mjs` and `check-document-editor.mjs` under `scripts/booklet/`. They cover highlighting and print geometry, selected-term formatting, fraction/exponent edits, adding/removing multiline rows, rapid undo/redo, whole-equation deletion, tables/lists/teaching slots, annotated-equation references, clipboard and read-only behaviour. Screenshots are retained locally in `.booklet-work/equation-reliability/`.

`BOOKLET_TEST_BASE=http://127.0.0.1:5173 node scripts/booklet/check-equation-performance.mjs` exercises the actual Index Laws booklet through intercepted in-memory saves: typing, autosave, pagination, external selected-term formatting, undo/redo and reload. Its evidence remains in `.booklet-work/equation-performance/`. Run without syncing public assets concurrently, since Vite reloads active pages when those files change. The document format and `document-change` event contract are unchanged; existing projects require no migration.

11 September 2026 verification: all five browser scripts above, 23 focused Node tests (document editor/tools, annotated equations, equation alignment and source rows), the production build, and all 46 release checksums passed. The booklet test also checks toolbar viewport bounds and readable button colour, opens the LaTeX dialog from the main toolbar, and verifies the selected-term edit after reload. Booklet writes were intercepted; no project or bank content was changed by these tests.
