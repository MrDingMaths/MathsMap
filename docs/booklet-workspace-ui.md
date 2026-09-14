# Booklet workspace UI

The booklet editor uses a compact outline, contextual Layout / Arrange / Page inspector, and a full-height detailed arrangement workspace. The left outline expands the current topic and shows question numbers, content excerpts and page numbers. Topic, section and block actions are in their adjacent menus.

## Common actions

- **Insert a bank question:** Insert -> From question bank. Search by skill, wording or ID, inspect the full question/answers, then Insert question. Copies are inserted after the selected logical group using the existing bank snapshot workflow.
- **Manual page break:** select a question or teaching block, then Layout & spacing -> Page -> Page break before/after. The same actions are in outline block menus. Use the topic menu's Start exercise on new page for an exercise boundary.
- **Remove a break:** use Remove on its manual-break marker or Page -> Remove break before. Automatic and source boundaries are labelled separately; explicit actions can override a source boundary. Keeping with next does not defeat an explicit break.
- **Spacing:** Layout controls affect the selected item. Choose Whole question in Scope to change all its answer spaces or stacked gaps. Units are shown once per field group; Auto width retains automatic sizing.
- **Arrangement:** Detailed arrangement preserves the selected item. Layout changes dimensions; Arrange changes order/grouping; Page changes booklet boundaries when the draft is saved. Cancel leaves the project unchanged. Use Structure on smaller screens to open the tree.
- **Tables:** select a cell and use the Table row selector to edit one row's minimum height. The inspector does not grow with the number of rows.

Desktop property tabs fit at 1366 x 768, 1920 x 1080 and 3386 x 1219. Narrow screens use drawers and enlarged text can scroll without hiding controls. The document canvas owns page scrolling. Colours, print geometry, booklet IDs/content and bank ownership are unchanged by opening or closing the UI.

## Verification

- `node --test tests/booklet-workspace.test.js` covers logical teaching groups, exercise boundaries, idempotence, break removal, keep-with-next precedence and bank summaries/search.
- `node scripts/booklet/check-workspace-ui.mjs` intercepts all booklet saves in memory. It checks desktop overflow, full dialog height, Cancel, bank preview/insertion, page-break removal, save/reopen, native text and table-row controls, and captures narrow/enlarged-text views. `BOOKLET_TEST_BASE` selects the server (default port 5173).
- `BOOKLET_TEST_BASE=http://127.0.0.1:5173 node scripts/booklet/check-text-spacing.mjs` covers actual Space/Enter input, nested content, autosave/reopen and keyboard layout selection. Set the environment variable using the syntax for your shell.
- `node scripts/booklet/check-arrangement-controls.mjs` uses isolated trigonometry questions to check selected-diagram preservation, movement/undo, Apply/Discard, spacing, save/reopen and preview zoom.
- `node scripts/booklet/check-print-transition.mjs` verifies the PDF button and Ctrl+P preparation, then exports actual PDFs immediately from screen mode in all five editions. It rejects blank pages, leaked workspace controls and pagination differences compared with settled print mode. Requires Chrome and Poppler; `BOOKLET_TEST_BASE` selects the server. The route animation is disabled in print because Chromium can snapshot its invisible initial frame.

Acceptance evidence remains local under `.booklet-work/ui-redesign/`. The real Angle Relationships pattern from source pages 47-48 was reviewed in the workspace and arrangement dialog. Eleven representative print pages across all five editions had identical image hashes before and after changing panel visibility, viewport width and screen zoom. Diagram readiness and font readiness were awaited before comparing images. This is UI/print parity evidence, not a new content-fidelity review or a full-booklet export.
