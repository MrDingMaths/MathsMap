# Pedagogy audit v2, Stage 5: batch 3 report (10 November 2026, evening)

Continues `docs/handoff-pedagogy-audit-v2-stage5-20261110b.md`. Batch 3 (`stage5-batch3.txt`, 25 booklets) is applied, reviewed page by page, settled and recounted. With batches 1 and 2 that completes all 76 Stage 5 booklets. Code fixes are in `docs/booklet-pedagogy-audit-v2.md`, sections "Stage 5 batch 2 fixes" and "Stage 5 batch 3 fixes". 133 of 133 pedagogy tests pass; `npm run repo:check` passes. Nothing is pushed.

## What was done

1. **Further Parabolas 1** (failed apply): its new "Sketch $y=(3-x)(2x+4)$" question had no parts but carried its graph as a shared drawing, which prints only on a question with parts, so both answer editions failed their check. Fixed centrally (`answerFiguresOnLeaves`), re-applied without new model calls, and the graph now prints once in the short and worked answers. No other booklet had the defect.
2. **Simultaneous Equations 2** saved with a failed page check by design: none of its issues were new (grey grid strokes on exam graphs, already live).
3. **The last five booklets** ran with the content rules for the first time: 0 blocks broken, nothing held back. Surface Area of Pyramids saved with only pre-existing page-check issues.
4. **Page review:** every changed page of all 25 booklets was looked at (`review-run.ps1`). Defects found are listed below; each was fixed by a settle patch and its rendered page looked at again.
5. **Settle:** `settle-all.ps1 -Apply` on all 25 (auto-applied changes checked, summaries and counts resolved). The comments left open are the ones that need James (theory rewrites the apply could not make, and so on).
6. **The six defects the content rules found in earlier booklets** are repaired (below).
7. **Recount:** 12 surplus count questions removed from 9 booklets.
8. **Split-box detector** on batches 2 and 3: see the last section.

## Cost

$43.63 in 298 audit calls for the 25 booklets, plus a few cents for recounts. Further Parabolas 1's re-apply reused its saved replies.

## Batch 3

"New Q" counts the slot questions applied, before the recount. "Auto" counts auto-applied changes. "Open" is audit comments still open for James.

| Booklet | Rev | Cost | New Q | Auto | Open | Repaired in the settle |
| --- | --- | --- | --- | --- | --- | --- |
| Further Parabolas 2 (NLR 2B) | 8 | $2.02 | 20 | 5 | 2 | 2 count questions removed |
| Further Parabolas 1 (NLR 2A) | 84 | $1.36 | 3 | 9 | 2 | Leaf answer graph (central fix) |
| Further Quadratic Equations | 52 | $3.46 | 14 | 19 | 3 | Review cylinder and prism labels; Ex 5 Q2–Q3 bare row letters; 2 count questions removed |
| General and Point-Gradient Form | 42 | $1.41 | 11 | 17 | 0 | Q2 d, f restated the stem |
| Graph Regions | 45 | $1.12 | 3 | 10 | 2 | — |
| Graphs of Rates of Change 2 | 6 | $1.32 | 4 | 6 | 1 | Q8 axis title spacing; Q10 "Zara" on Liam's line |
| Graphs of Rates of Change 1 | 63 | $1.95 | 10 | 15 | 0 | 1 count question removed |
| Inequalities | 45 | $1.14 | 5 | 6 | 2 | — |
| Linear Equations with Fractions | 40 | $0.70 | 2 | 6 | 0 | — |
| Monic Quadratic Equations | 45 | $0.70 | 4 | 5 | 1 | — |
| Multistep Linear Equations | 55 | $1.14 | 7 | 7 | 1 | — |
| Negative Index Laws | 42 | $0.96 | 4 | 11 | 3 | 1 count question removed |
| Non-right-angled Trigonometry 2 | 12 | $4.66 | 31 | 7 | 2 | Angle arcs on 9 new figures; Q13 130° on the base; Q15, Q16 bearing labels; 1 count question removed |
| Non-right-angled Trigonometry 1 | 227 | $2.23 | 14 | 11 | 4 | Q6, Q10 distance on the north arrow; 1 count question removed |
| Rearrange Formulas | 38 | $1.63 | 4 | 12 | 2 | Ex 3 Q4b (by hand, below) |
| Set Notation and Conditional Probability | 53 | $2.84 | 15 | 12 | 2 | 1 count question removed |
| Similar Areas and Volumes | 40 | $0.82 | 4 | 3 | 1 | — |
| Similar Triangles | 45 | $0.15 | 0 | 1 | 0 | — |
| Simple Cubic Equations | 29 | $0.24 | 2 | 2 | 0 | Q1 and Q2 merged (same stem, type and rating) |
| Simultaneous Equations 2 | 7 | $1.93 | 14 | 11 | 0 | Q19 gave away its equations; annulus "4 cm" on the stroke |
| Simultaneous Equations 1 | 65 | $2.83 | 9 | 19 | 4 | — |
| Surds 2 | 5 | $2.54 | 9 | 23 | 2 | 1 count question removed |
| Surds 1 | 66 | $1.89 | 10 | 12 | 1 | 1 count question removed |
| Surface Area of Pyramids, Cones and Spheres | 53 | $2.45 | 2 | 18 | 0 | — |
| Volume of Pyramids, Cones and Spheres | 42 | $2.15 | 2 | 16 | 6 | — |

Notes on individual repairs:
- **Rearrange Formulas Ex 3 Q4:** the audit replaced part b ("$v$ the subject", a near-duplicate) with a different formula under the stem's "Rearrange the formula $K=\frac12mv^2$ to make:". Both parts now use this booklet's Q8 form: "Make the pronumeral in the bracket the subject." with a $K=\frac12mv^2\ (m)$, b $V=\frac13\pi r^2h\ (r)$.
- **Simultaneous Equations 2 Q19:** copied the teacher's Q18, which prints "$2L+W=11$, $L=4$." to students; the copy's "$L+W=8$, $L=3W$." is taken out. Q18 itself is James's (below).
- **Simple Cubic Equations:** the two new slot questions became one question, a–d; slot 2's open review comment moved to it with a note.

## Earlier booklets repaired (the handoff's six defects)

All found by the content rules, repaired through `settle-comments.mjs` (decisions in `.booklet-work/pedagogy-audit-v2/settle-20261110b/`), rendered and looked at:
- Linear Relationships 1 page-14-q2 e: "Construct a table of values for" dropped; its table now has the siblings' borders and blue header.
- Quartiles and Box Plots p14-q4 g: the restated sentence dropped; its table now matches its siblings' width.
- Surface Area of Prisms and Cylinders p15-q2 b: the restated sentence dropped.
- Length 2 p56-q5 a: a figure part restating the stem prints its figure alone, like its siblings.
- Compound Interest and Depreciation p23 guided g: $V_0$ and $\text{depreciation}=V_0-S$ set as maths.
- Rearrange Formulas p10 Q4b: above.

## Decisions for James

1. **Slot pairs printed harder first (all three batches): done.** A difficulty-jump slot's two versions were each inserted straight after the same question, so the harder one printed first. Fixed for future runs (`afterInserted`). James approved the swap (10 November): 58 pairs in 29 booklets now stand in score order, each booklet saved through `settle-comments.mjs` with its page check (all passed). Decisions: `.booklet-work/pedagogy-audit-v2/settle-20261110b/slot-order/`. No question refers to a swapped one by number.
2. **Angle labels without arcs in batches 1 and 2: done.** Circle Trigonometry 1's four blocks got their arcs. Angle Relationships 2's four are "draw an arc" questions, where the teacher marks the given angle with its letter alone, so after a look at the pages James had them left without (10 November). The audit no longer adds arcs to such questions.

## For James (teacher content, unchanged by the audit)

- Simultaneous Equations 2 p15 Q18: the prompt prints "$2L+W=11$, $L=4$." — looks like an answer left in the question.
- Simultaneous Equations 1 p36 "Identify multiplier": parts c and e are the same pair of equations.
- Further Quadratic Equations p51: the discriminant is defined twice in a row (two callouts, near word for word).
- Further Parabolas 2 p6: "The discriminantΔ" runs together.
- Graphs of Rates of Change 1 p25 Q7: the "M (mph)" axis title sits on the tick numbers.
- Multistep Linear Equations p21: the steps are numbered 5–8 (the list starts at 5).
- Graphs of Rates of Change 2, short answers 2a, 2b and 5a: the y-axis title runs into the tick numbers (the same fix as the audit's 3b: move the title left).
- Inequalities: number-line circles are about 1 mm across, so open and closed are hard to tell apart (the audit's new ones copy the teacher's size).

## Split-box detector (batches 2 and 3)

All 50 booklets of batches 2 and 3 were checked (`split-arranged.mjs` → `split-text-loss.mjs` → `split-suspect-pages.mjs`; results in `.booklet-work/pedagogy-audit-v2/split-*-20261110b/c.*`). 77 arranged blocks span two or more pages, and 23 were flagged. Each flagged pair of pages was looked at: none has lost content. The flags were the next question repeating the same stem ("Simplify these expressions."), a box continued by design ("Question 6 continued", a continued Interpret box), or parts that are maths or handwritten images the text match cannot read, which print on the next page.

## Found after the report by the new figure findings

The workflow review (see "Workflow changes before Stage 6" in `docs/booklet-pedagogy-audit-v2.md`) made the apply record figure findings in the audit's own figures. Run over batch 3, they named two defects the page review had missed, both repaired and looked at: Non-right-angled Trigonometry 2 Exercise 4 Q16 (the "O" sat on a diagonal) and Graphs of Rates of Change 2 short answer 3b (the axis title ran into the tick numbers).
