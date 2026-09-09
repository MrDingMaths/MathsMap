# Exact booklet transcription v2

Act only as a faithful transcriber. The rendered PDF pages are the visual authority. The extracted Word text and assets recover editable wording, mathematics, and original graphics; they never override what is visibly present on the PDF page. Use `evidence/word/asset-occurrences.json` to distinguish repeated placements of the same Word asset.

## Teaching atoms

Keep each visible coloured/headered teaching atom intact. Do not split, merge, relabel, or infer a teaching atom from its content. Every member block of an atom must carry identical `sourceAtom` metadata: stable `id`, exact visible `kind`, exact `label`, descriptive `description`, and numeric `order`. Examples and practice parts inside one visible Identify atom remain in that one atom.

Record the source label `Investigation` in `sourceAtom.label` as evidence. Booklet Studio suppresses that label when rendering while keeping its icon, colour, description, and internal role.

## Content and presentation

Preserve wording, mathematics, block order, grids, cloze blanks, diagrams, teaching roles, question parts, and visible answer-space intent. Do not classify, simplify, reorder, rewrite, or infer curriculum mapping. Keep inline worked theory content as theory solutions; never put practice answers inline.

Use exactly one rendered representation for each source item:

- Transcribe text-only cards, number/symbol tiles, boxes, and tables natively. Their source images are `evidence-only`.
- The source's storage format is not an output decision: ordinary equations, worked steps and complete mathematical scaffolds must be native even when supplied as images. Retaining a screenshot because it preserves appearance is not an exception. Inventory retained-image candidates separately and record their specific source-supported reason for final-size visual review. Never discard intermediate steps or writing boxes when converting an image.
- Preserve original graphical assets as evidence. Reconstruct known mathematical graphs, blank grids, number lines and representable geometry as editable native diagrams, using equations and coordinates rather than pixel tracing. A derived TikZ/SVG retains its source link and is marked `derived: true` and `reviewStatus: needs-review` until compared with source and final-size output. Keep active rasters for illustrations, handwriting whose appearance is the task, or specifically recorded unresolved/unsupported visuals; do not retain reconstructible mathematical diagrams by default. Never guess uncertain mathematics.
- Distinguish base/question diagrams, solution diagrams, and solution overlays. Never discard a visible graphical occurrence.
- Convert dotted response rules and repeated placeholder dots to `answerSpaceMm` or structured cloze blanks. Do not copy them as prompt text. Preserve genuine mathematical ellipses.

Every visible source item needs a stable id rooted at its page id. Preserve continuation links so multipart questions, worked examples, and continued source material are never split across tasks.

Return `mathsmap-exact-transcription-result-v2`. Asset records are occurrence-level, not filename-level: include `occurrenceId`, `path`, `pageNumber`, `usage`, and relationship/placement details when available.
