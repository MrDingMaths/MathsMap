# Native maths sweep and shared feedback scope

This follow-up supersedes the outstanding ordinary-maths image list in the consistency audit. Converted 56 equation/scaffold images in 11 questions, plus four flowcharts and four square diagrams in two further questions. Original image evidence is retained in each node's sourceLayoutEvidence. Answers were preserved and project saves used the bank-sync save path.

Nine active raster images remain: four character illustrations and five handwriting examples used for error analysis. Ordinary expression and scaffold screenshots are no longer active content. Linear Relationships was also inspected; originalGraph images are evidence for native diagrams, not rendered image content.

Fraction-step spacing is implemented in the shared equation renderer and editable document renderer, applying to all books and editions. Aligned fraction rows receive at least 8 pt spacing, preserving larger or explicitly dimensioned writing gaps and matrix layouts. AGENTS.md and the feedback checklist now explicitly apply general feedback across books and repeated occurrences.

Validation: 71 relevant regression checks passed, followed by 28 presentation/content/raster checks after broadening the image gate. Production build passed. Browser regression passed for all 20 Key Ideas number alignments and retained-image alignment controls. All 13 converted questions were visually inspected in rendered output; the exported page containing the four flowcharts was also inspected.

All five edition layout checks passed for both books, with zero detected DOM or print-boundary issues:

| Book | Questions | Short | Worked | Questions + short | Questions + worked |
| --- | ---: | ---: | ---: | ---: | ---: |
| Index Laws | 65 | 15 | 68 | 80 | 133 |
| Linear Relationships | 92 | 14 | 47 | 106 | 139 |

These are draft layout checks, not blanket acceptance of every source-review category. Existing source-review flags remain pending; conversion does not automatically certify unrelated content. Local screenshots, source comparison records and PDFs are in `.booklet-work/native-maths-sweep/`.
