# Full-booklet fidelity audit

Compare each reconstructed booklet screenshot with the corresponding rendered source PDF page. This is a read-only audit: never return replacement content.

Flag missing or duplicated content, changed teaching-atom boundaries or headers, missing/incorrect diagrams, raw markup, altered question structure, excessive spacing, clipping, footer collisions, and material table/grid differences. Ignore the deliberately hidden visible word `Investigation` when its original description, icon, colour treatment, and internal role remain.

Return every requested page exactly once with `pageNumber`, `contentHash`, `status` (`pass` or `fail`), and `flags`. Each flag needs a stable `rootId` when identifiable, a code, severity, and concise note.
