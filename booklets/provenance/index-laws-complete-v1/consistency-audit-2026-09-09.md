# Index Laws consistency audit — 9 September 2026

Audited active revision 116; source-link repair saved in revision 119. This is an inventory of confirmed inconsistencies and review exceptions, not whole-booklet visual acceptance.

## Confirmed image/native maths inconsistency

Inspected all 34 distinct raster assets used in 73 active occurrences, excluding preserved source evidence. Compared their contents with the active question/part mappings. There are **56 ordinary mathematical examples, equations or scaffolds across 11 questions** still rendered from images:

| Exercise | Question | Source page | Image items | Finding |
| --- | --- | --- | --- | --- |
| 4 | 8 | 23 | 1 | Worked zero-index example is raster; practice parts are native maths. |
| 5 | 6 | 28 | 4 | Example and three multistep box scaffolds are raster. |
| 6 | 5 | 34 | 13 | Cancellation examples and twelve fractions/scaffolds are raster. |
| 7 | 2 | 36 | 4 | Index addition/subtraction scaffolds use image-based exponent boxes. |
| 7 | 16 | 42 | 4 | Worked example and three fraction questions, including intermediate answer boxes, are raster. |
| 7 | 22 | 43 | 15 | Fifteen algebraic fractions; early parts include intermediate and final box scaffolds. |
| 7 | 23 | 44 | 1 | Worked example is raster; practice parts are native maths. |
| 8 | 1 | 51 | 2 | Repeated-factor expansion scaffolds remain raster. |
| 8 | 16 | 54 | 5 | Expansion/simplification example and response lines are raster. |
| 9 | 1 | 57 | 2 | Quotient expansion scaffolds remain raster. |
| 10 | 5 | 62 | 5 | Worked example and four fraction questions, including exponent and fraction boxes, remain raster. |

These need semantic transcription preserving every source intermediate step, colour, cancellation annotation and physical writing area. Merely replacing an image with the stored `mathematicalExpression` would discard scaffolds. The 51 parts flagged by the earlier search exclude five root-level examples; this audit includes both.

## Retained-image exceptions and further review

- Four character illustrations: Exercise 1 Q7/Q8, Exercise 2 Q13, Exercise 5 Q12. Illustrations are suitable retained raster content.
- Five handwritten error-analysis examples: Exercise 2 Q12, Exercise 7 Q17, Exercise 8 Q9 (two), Exercise 9 Q8. Handwriting, ticks/crosses and annotations serve the question; do not flatten their meaning into an unlabelled corrected equation.
- Four geometric diagrams: Exercise 8 Q12. These contain squares, equal-side/right-angle markings and algebraic labels; a geometry-template conversion is separate from ordinary equation transcription.
- Four flowchart crops: Exercise 8 Q15. These need a connected editable layout if converted, preserving arrows, nodes, response boxes and the extension task. They are not ordinary standalone formulas.

## Other findings

1. **Exercise 8 Q1(a) width discrepancy:** active raster width is 58.3 mm; the recorded source-reviewed requirement is 76.28466666666667 mm. This is a confirmed data mismatch, not yet a determination that either size is correct. Compare the source and final printed writing space before resolving it.
2. **Q9 source links repaired:** the previous native conversion left twelve source inventory entries pointing to removed image-node IDs. They now point to the corresponding stable question-part IDs. Original image evidence is retained. Content reconciliation now reports zero missing targets, zero duplicates and zero ambiguous targets.
3. **Review evidence remains stale:** current content reconciliation reports 17 verified, 1 excluded and 1,649 unchecked inventory entries. The unchecked total reflects signature/review state and must not be described as 1,649 content errors. Presentation checks also retain pending visual reviews and arrangement-signature differences from earlier edits. They prevent a claim of full acceptance.
4. **Saved question arrangement references:** checked every saved question arrangement against its active content catalog. No missing active references or omitted content entries were found at the audit baseline.

## Checklist scope and evidence

The transcription feedback acceptance checklist was read. Native mathematical typography and source scaffolds were reviewed across every active raster occurrence. Character, handwriting, geometric and flowchart exceptions were inventoried explicitly. No question text, answers or visible layout changes are delivered by this audit; only the Q9 source-link maintenance is retained. Trial conversions of two examples were reverted pending complete layout checks.

Whole-booklet final-size alignment, speech-bubble spacing, paragraph padding, palette, grids, native cards, box dimensions, Key Ideas number placement, image-control round trips, source-boundary pagination and all five editions remain outside this completed raster-inventory pass. Earlier checked flags have not been renewed to imply those reviews occurred.

Local evidence is retained under `.booklet-work/consistency-audit/`: active image inventory, six asset review sheets, arrangement-reference audit, presentation report and before/after content reconciliation reports. Source assets and original documents remain intact.
