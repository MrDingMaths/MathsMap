# MathsEditor structured-document integration

The source of truth is `D:\WebApps\MathsEditor`. MathsMap consumes the pinned release under `public/libs/maths-editor`; `release.json` records version 1.0.0 and the SHA-256 of each runtime file. Run `npm run booklet:sync-editor` after changing and verifying the standalone source. Do not patch the copied runtime independently.

## Public API

Load `maths-editor.js` as an ES module and create `<maths-editor structured>`. Assign `editor.document` to a JSON document with `format: "maths-editor-document-v1"`, `version: 1` and a `blocks` array. Reading `.document` returns a copy. Persist this property, including identities and nested blocks.

Listen for `document-change`; `event.detail.document` is the structured value and `event.detail.source` is its legacy text/maths projection. The existing `.value` string API remains available for legacy prose and equations. Assigning `.value` replaces the document through the legacy parser: it must not be used as rich-document storage. The Svelte adapter stores the document object on every rich edit.

`readonly` disables editing. History covers prose, MathLive input, tables, layouts and image properties. Rich clipboard data uses a custom JSON MIME representation, with text/HTML fallbacks; the destination gives pasted nodes fresh identities.

## Storage

- Paragraphs contain text with marks, inline/display math, breaks and cloze fields. Paragraph properties hold spacing, font size, alignment and indentation.
- Tables hold column width ratios and rows of cells. Cells retain nested blocks, spans, borders, padding, alignment and optional rotation.
- Images retain source, alternative text, caption, width, aspect ratio, crop percentages and placement. Uploaded images use data URLs, so saving does not depend on a temporary object URL.
- Layout blocks retain an arrangement (`investigation`, `parallel`, `worked-rows` or `scaffold`) separately from content slots.
- Spacers retain working-space height.

The structured-document normalizer rejects unsupported versions. Existing string content is parsed only when opening the editor; it is not destructively rewritten during project loading.

## Verification and current limits

`node scripts/booklet/check-document-editor.mjs` exercises the standalone fixture through a browser. `node scripts/booklet/check-studio-workflow.mjs` exercises the Svelte integration with intercepted writes. Unit tests cover storage and review invalidation.

Image crop and resize controls are numeric, with proportional resizing. Beside-text placement is anchored to document flow. The current inline image option is an inline-block figure between content blocks; true insertion inside a prose run is still outstanding. Row/column changes on merged tables require splitting the affected merged cells first. AI/OCR and free page positioning are outside this release.
