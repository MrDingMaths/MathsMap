# Booklet pagination principles (11 November 2026, user approved)

This page is the single source for how a booklet's Questions edition is paged and laid out. The **Paginate booklet** pass (`src/lib/booklet-compose.js`; Studio's Pagination panel, `paginate/compose.mjs` and the polish `paginate` step) applies it. Where an older page conflicts with this one, this one wins: see [Superseded wording](#superseded-wording).

The aim is not the fewest pages. It is the layout a teacher would make by hand: each lesson reads on one page, questions stay whole, pages look evenly filled, and whitespace falls only where a unit ends.

Evidence for each rule (tags in brackets):
- **[H]** the handmade booklets in [studio-sources](../booklets/studio-sources/): Volume, Simultaneous Equations, Calculations with the Derivative, Quartiles and Box Plots, Circle Geometry and Projectile Motion were inspected page by page.
- **[E]** the teacher's Studio edits in finished booklets (layout diffs of the checkpoint commits `2c3b9532`, `4191d649`, `cf0872a9` and `00afc38d`).
- **[C]** teacher comments: 629 in `studio.flags`, and the 422-comment corpus in `.booklet-work/bench-20261022/corpus/cases.json`.
- **[U]** user decisions of 11 November 2026.
- **[R]** earlier written rules that are kept.

## A. Where pages start

1. **Every section or sub-topic banner starts a page.** [H, R]
2. **A new sub-topic's first theory or definition block starts a page** when it follows a review, identify, key-ideas, guided-practice or investigation block. [E: all 51 breaks the teacher added in the checkpoint commits sit here.] This break comes from the content's role, never from the source page.
3. **Every exercise starts a page** in the Questions edition. [U, H] Two exceptions:
   - A **mixed-review exercise** that is led in only by a repeated theory, summary or key-ideas block (no new teaching). The lead-in and the exercise flow together with no break. [U]
   - An exercise whose first block already has `flow.exercisePageBreakBefore: false`. This is the teacher's own choice, and it is honoured.
4. **Answer editions** (Short answers, Worked solutions) flow continuously, with no breaks between exercises. [R]
5. **Source page boundaries are not kept on their own account.** A break inside a topic exists only because of A1–A3, or because the teacher set it manually (`pageBreakBefore: true` or a page-break block). [R]

## B. What stays together

1. **A lesson is one unit**: theory → worked example → guided practice → key ideas, which the handmade booklets fit on one page. [H] Keep it on one page whenever it fits after tightening (principle C6).
2. **When a lesson cannot fit on one page**, split it only at these boundaries, in this order:
   1. before the guided practice (theory and example on one page; guided practice and key ideas on the next);
   2. before the worked example. The example stays whole with its self-explanation prompts. [H]
3. **Key ideas stay with the block they summarise**, never alone at the top of a page. **A review fits on one page.** [C, R]
4. **A question never splits across pages** unless it is taller than a page. Then it splits only at safe part boundaries, and a continued table repeats its header row. A question's last part is never left alone on the next page. [C, R]
5. **No lone question on an exercise's last page** if a tighter floor or a move within one difficulty band brings it back (the optimiser's orphan pull). [C, R]
6. **Whitespace is acceptable only at the end of a unit**: a sub-topic, a lesson or an exercise. [H] A page more than half empty in the middle of a section is a defect. This is the one threshold, and it replaces the older 40% and 60 mm figures for reporting.

## C. Block layout

1. **Part columns follow the longest part's prompt.** [E: medians in finished booklets]

   | Longest prompt (characters) | Columns |
   | --- | --- |
   | up to about 26 | 4 |
   | up to about 45 | 3 |
   | up to about 80 | 2 |
   | longer | 1 |

   - Display maths never wraps: drop a column rather than wrap it. [C]
   - Four parts default to a 2 × 2 grid, and a short last row keeps the grid's columns. [R]
   - Turn a long list of short parts into a grid; drop columns when parts wrap. [E]
2. **A diagram with parts sits beside them.** If the parts overhang the diagram by 20 mm or more and are at least 35% taller, put the diagram on top and the parts in a 2-column grid below. [C, E] Figures meant to be compared go side by side (spinners, two solids, a row of graphs). [C]
3. **Working space beside a diagram.** [U] This applies to a simple question (one part, or short parts) whose diagram sits below the prompt, left-aligned, with at least 60 mm free to its right. That free space is its working space, so the question's own working space is 0 mm. It applies only when the diagram is at least as tall as the calibrated allowance it replaces. The same rule applies to each cell of a grid.
4. **Worked examples.** [E, H]
   - One column per example, as many as fit across the width (1,161 of 1,581 finished examples do this).
   - A single example with a diagram uses `worked-rows`, with the diagram beside the working.
   - The two-column form (working on the left, self-explanation prompt on the right) is kept.
   - An example without a figure uses the full width, with no empty image column. [R]
5. **Working space.** [E, R]
   - Start from the calibrated allowance (`workingSpaceFloor`, calibration of 22 October 2026): cloze and inline answers 0 mm, tick-cross 6 mm, short answers about 10 mm, and working by the calibrated fit. Never below 8 mm unless 0 mm is right for the kind, or rule C3 applies.
   - Snap to round values: 6, 8, 10, 12, 15, 20, 25, 30, 35, 40, then steps of 5.
   - Use one value across a grid row.
   - Exam sections keep 0 mm working space and a 10 mm gap between questions.
6. **Order of tightening when something does not fit.** [R, C]
   1. Duplicated margins, gaps and paragraph spacing.
   2. Side-by-side placement (C2) or more columns (C1).
   3. Diagram width, down to its kind's minimum.
   4. Working space, down to its floor.

   Never shrink text, and never take working space below its floor to make a fit.

## D. Fill

After packing, a page's trailing space is shared among that page's working-space items, in proportion to their size, so the page looks evenly filled as the handmade booklets do. [U, H]
- Each item grows at most to 1.5 × its calibrated value, or by 25 mm, whichever is smaller.
- Theory, example and key-ideas spacing is never stretched.
- The final page of a sub-topic, lesson or exercise may keep its whitespace when it has no working space to grow.
- Filling must not move any block between pages: the pass re-measures and backs off if it does.

## E. How the pass chooses

**Hard guards.** A candidate is rejected if it introduces any of these:
- an `oversized-content` issue;
- an allowance below its floor;
- an exercise starting mid-page (other than the A3 exceptions);
- a new pagination issue;
- a new **layout fault** (11 November 2026, user requested): content past the page margin (`margin-overflow`) or columns that overlap (`column-overlap`), read from the rendered boxes by `src/lib/booklet-layout-faults.js` on every measured page. Faults the booklet already had are not counted; a rejected trial is reported with reason `layout-fault`;
- a lost or reordered dependency (`dependsOn`, `keepWithNext`, `pairedBlockId`, continuations).

**Objective.** Among the candidates that pass, the pass minimises, in this order:
1. questions split across pages;
2. lessons split, or split at a worse boundary than B2 allows;
3. half-empty mid-section pages;
4. pages;
5. difficulty-order inversions (moves stay within one band).

**Teacher-reviewed booklets.** The pass proposes changes on any booklet. On a booklet with teacher review (`hasTeacherReview`), a change to a reviewed block is applied only when the teacher accepts the before/after diff in Studio, or passes `--accept-reviewed` explicitly on the command line. No automatic path changes reviewed values.

## Superseded wording

These older passages now defer to this page:

- [first-pass review](booklet-first-pass-review.md), the pagination convention and check list. Reviewers still never propose breaks: the pass places A2 breaks from block roles. The source-based "teaching box that the source starts on a new page" check is withdrawn.
- [polish pipeline decisions](booklet-verification-speed.md#decisions-23-october-2026-user), decision 1: exercise breaks stay forced (A3), and the A3 mixed-review exception is applied automatically.
- [cross-session rules](booklet-cross-session-rules.md#exercise-starts-and-layout-spacing-13-september-2026): exercise starts.
- [pre-review sweep](booklet-pre-review-sweep.md): the 40% `pages` threshold, for reporting only, is replaced by B6.

## First bench (11 November 2026)

Each booklet was run from its import (before teacher review), with reviewed blocks accepted. Reports and PDFs are in `.booklet-work/compose-20261111/<booklet>/`.

| Booklet | Split questions | Split lessons (cost) | Half-empty pages | Pages |
| --- | --- | --- | --- | --- |
| Rates | 6 → 3 | 32 → 29 | 4 → 2 | 74 → 73 |
| Quartiles and Box Plots | 6 → 4 | 16 → 14 | 6 → 4 | 52 → 51 |
| Solve 2-Step Equations | 16 → 8 | 28 → 16 | 4 → 1 | 117 → 107 |

Page breaks agree with the teacher's finals more often than the import's do: recall rose from 0.45 to 0.55 (Quartiles) and from 0.58 to 0.67 (Solve 2-Step). Most of the remaining disagreement is exercise starts, which A3 now always breaks and which the teacher had removed in those booklets.

Working space ends a little above the teacher's finals, by about 0.5 to 2 mm on average, because fill (D) shares out space the teacher left empty.

Known gaps:
- Lessons longer than a page still split wherever the page ends. Only a single cut, at the preferred boundary, is tried.
- Diagram-beside-parts placement (C2) is not automated yet.
- Studio shows metrics and a change list, not page thumbnails.
