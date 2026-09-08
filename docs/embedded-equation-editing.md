# Embedded equation editing

MathsMap's structured MathsEditor now provides:

- A searchable Symbols picker (Tab while inside an equation), hosted inside the active editor dialog.
- Arrow-key entry from adjacent prose and exit from equation boundaries; Escape returns to prose.
- Tab to insert maths in ordinary prose. Existing table, list, tab-stop and Escape-then-Tab behaviour is retained.
- Bold/italic and colour controls for MathLive selections; document formatting shortcuts also act on focused maths.
- An Edit LaTeX dialog with preview, Apply and Cancel.

The implementation is in `public/libs/maths-editor/math-editing.mjs`, connected by `document-editor.js`. The palette comes from the standalone MathsEditor with a local modal-parent adjustment. The app loader loads its scripts and styles. These are MathsMap-local enhancements; a future upstream runtime sync must retain or upstream these changes before replacing the vendored files.

Verification: `node scripts/booklet/check-math-editing.mjs` exercises the actual browser editor in a temporary modal without modifying booklets. It covers selected-maths formatting, palette insertion, keyboard navigation, LaTeX apply/cancel, structured save/reload and Tab insertion. The relevant 44 Node tests and production build pass.
