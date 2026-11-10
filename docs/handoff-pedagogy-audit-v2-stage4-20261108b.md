# Handoff: pedagogy audit v2, Stage 4 campaign, part 2 (8 November 2026, evening)

> **Status (8 November 2026, part 3): done.** PAUSE is removed. Batch 2 and the count top-up ran to the end, and every booklet was recounted, rescanned and page-reviewed. Results and open issues: [the report](pedagogy-audit-v2-stage4-report-20261108.md). Fixes: [booklet-pedagogy-audit-v2.md](booklet-pedagogy-audit-v2.md), "Fixes from the 8 November evening run". Nothing is committed. When James asks, add `docs/pedagogy-audit-v2-stage4-report-20261108.md` to the paths below.

Continues `docs/handoff-pedagogy-audit-v2-stage4-20261108.md`. Read first: `AGENTS.md`, `docs/booklet-pedagogy-audit-v2.md` (all 8 November sections), and that handoff. James approved everything here and wants autonomous progress, with a report at the end.

## Paused

`.booklet-work/pedagogy-audit-v2/PAUSE` exists. It was created at the user's usage limit and stops new audits before any model call. Runs already started when it was created finish their apply and save normally:
- batch 2: linear-relationships-v1, operations-fractions-decimals-2-v1, -3-v1;
- top-up batch: comparing-fractions-v1.

**Before resuming,** check that no `review.mjs audit-v2` or `--apply` process is still running.

**Read the ledger (`batch.jsonl`) by time.** Rows before about 05:30Z belong to the first batch's pause, and later rows supersede them. Each booklet's latest row, and whether `report.json` of its latest run has `topUp`, is the truth.

## Done in this session

**Steps 1–4 (count rules), implemented and applied.**
- Part counting: `practiceItemCount` in `pedagogy/audit-v2-plan.mjs`.
- Synonym grouping: `labelTypeRoles` and `roleGroupContract`.
- Count cap 3, filled round by round.
- Recount of the 8 November booklets: `recount-20261108.mjs`.
- 87 surplus count questions removed: `review-tools/remove-count-slots.mjs`.

All are documented in "Count rules: parts and synonyms".

**James's additions.**
- Variation sequences end to end: `proposal-variation`.
- Count top-up mode: `--top-up-counts`.
- Worked examples are solved from their own question and figure.

Documented in "Variation sequences", "Count top-up" and "Fixes from the 8 November review of the resumed batch".

**Code fixes found in review, all documented, with tests (36 pass).**
- Key ideas blanks beside maths (printed as `[[x|0]]`).
- Aligned working: spacing hints and numbered steps.
- Tab-row tables: options lists, and values laid out across.
- Grid columns: printed-length rule; the sibling layout was never applied.
- Apply retry without auto-applied proposals rendered the old candidate.
- Render culprits now include replaced and rewritten blocks (Length 2 p50-q2).
- "[object Object]" in replacement notes.
- **Part-count rule correction (last change).** A worded part ("Line FG") under a stem without data counts as its own task. Before, Angle Relationships 1 Q2 counted as 1 and the top-up added two redundant drawing questions.

**Saved booklets.**
- Batch 2 audited and applied: formulas, factorising-expressions, introduction-to-algebra, linear-relationships-2, length, length-2.
  - length-2 was applied by hand after the culprit fix; its p50-q2 replacements stayed comments.
- Top-up applied: data-visualisation-1 (trial), expanding-brackets, angle-relationships-2, angle-relationships-v1, area-circles-sectors, area-quadrilaterals.
- Page-reviewed: everything above except the area-circles-sectors and area-quadrilaterals top-ups.

**Repairs saved and rendered.**
- Row spacing: formulas j4 (also step alignment), angle-relationships-v1 j14, area-quadrilaterals j10, data-visualisation-1-2 j4.
- Tables: data-visualisation-1 (3 questions), data-analysis-3 (1).
- Columns: data-analysis-2, expanding-brackets.
- Cloze markup: linear-relationships-2, length-2.
- introduction-to-algebra j4 taken out and its comment reopened.

**Saved with the corrected part rule, pages not yet looked at.** 11 more surplus count questions were removed with revision-checked saves:
- angle-relationships-v1: the two new drawing questions, `v2-p4-practice-topup-slot-1` and `slot-2`;
- data-visualisation-1-v1: 4;
- linear-relationships-2-v1: 2;
- length-v1: 3.

`render-removed.mjs` was running for them at the pause. Look at `<booklet>/<stamp>-recount/render/` for each, and rerun `render-removed.mjs ID` if it is missing.

## Still to do

0. **operations-fractions-decimals-3-v1:** its apply failed the page check after the pause. Nothing was saved, and the run is `20261108-055159`.
   - Read `render.json` there.
   - If the cause is shared, fix it in code.
   - Then rerun `node pedagogy/review.mjs audit-v2 --project operations-fractions-decimals-3-v1 --apply --run .booklet-work/pedagogy-audit-v2/operations-fractions-decimals-3-v1/20261108-055159`.
   - If the live revision has moved, re-audit the booklet instead.

1. **Finish the cleanup** above, and look at each removal's rendered pages.
2. **Remove PAUSE** and run the remaining booklets from PowerShell, in the background, with a Monitor and 60-second waits. Run only one batch process at a time: two batches' applies collide on page checks.
   - Batch 2 (17 left): `node pedagogy/audit-v2-batch.mjs --projects operations-fractions-decimals-v1,percentage-increase-decrease-change-2-v1,percentage-increase-decrease-change-v1,percentages-problems-v1,probability-v1,properties-of-geometrical-figures-v1,pythagoras-theorem-v1,rates-2-v1,rates-v1,ratios-2-v1,ratios-v1,simple-quadratic-equations-v1,simplifying-expressions-v1,solve-2-step-equations-2-v1,stage4-indices-2-v1,stage4-indices-v1,volume-v1 --parallel 3`. Add any of linear-relationships-v1 and operations-fractions-decimals-2/-3 whose ledger row is not `applied`. The driver skips booklets already done.
   - Then the top-up for the rest: `node pedagogy/audit-v2-batch.mjs --projects computation-with-integers-2-v1,computation-with-integers-v1,converting-fdp-v1,data-analysis-2-v1,data-analysis-3-v1,data-analysis-v1,data-visualisation-1-2-v1,rounding-decimals-v1,solve-2-step-equations-v1,area-parallelograms-triangles-v1,formulas-v1,factorising-expressions-v1,introduction-to-algebra-v1,comparing-fractions-v1 --parallel 2 --top-up-counts`. It skips booklets whose top-up is applied.
3. **Recount and clean every applied booklet** after its audit or top-up: `recount-20261108.mjs` then `remove-count-slots.mjs` (jump guard included). This catches count questions that duplicate an existing question's method under the corrected part rule.
4. **Rescan all Stage 4 masters with the repair scanners**, because audits spawned before a fix can still carry its defect:
   - `repair-cloze-markup.mjs`
   - `repair-rowspacing.mjs`
   - `repair-tables.mjs`
   - `repair-columns.mjs` (apply only 4→3; leave 3→2, which may be hand-set)

   Each prints what it would change; add `--apply` only in a quiet window, and render (`render-blocks.mjs ID ids NAME`).
5. **Review every finished booklet**: `review-tools/review-run.ps1 ID` tiles the pages holding this run's blocks. Use `summary.cjs`, `nofig.cjs` and `scan-text-in-math.cjs` too.
6. **Final report** per booklet (cost, applied, comments and why, variations proposed, confirmed and applied, top-up added and shortfall left, issues), and update `docs/booklet-pedagogy-audit-v2.md` with the run results.

## Issues for the report (found so far)

- **Computation with Integers 2:** short clozes on p19 and later, already in the live booklet.
- **Data Visualisation 1:**
  - top-up slot-8 (column graph) did not print cleanly and stayed a comment;
  - pictogram questions p27 Q5 and Q6 list their data as text, with little room to draw;
  - top-up ids reused removed ids (`…foundation-slot-2`); fixed for later runs with the `topup-` prefix.
- **Expanding Brackets:** variation Q8 step b repeats the existing Q9a, $2(x+3)-3(x+1)$.
- **Introduction to Algebra:**
  - p25 "Write algebraic expressions from a description": the matching options A–G run together in one sentence (already in the booklet);
  - j4 was taken out and is open for a redraft with the drawn figure.
- **Linear Relationships 2:** 5 theory rewrites stayed comments, because those callouts have no editable text.
- **Minor style, already in booklets:** sentences in the maths font inside some worked examples (Introduction to Algebra j4, Linear Relationships 2 j3, Formulas j4).
- **Area 1 j7 and Converting FDP j7:** 3-column grids for longer parts, left as they are.

## Cautions

- **The Bash tool collapses `\\` in heredocs.** Write patches with Write or Edit, never heredocs with backslashes.
- **Saves and page checks collide with batch applies.** Wait for no `--apply`, `check-feedback-pages` or `publish-project` process before each save or render (the `Wait-Quiet` loop in PowerShell).
- **Nothing is committed.** When James asks, run `npm run repo:check` and commit with explicit paths:
  - `pedagogy/audit-v2*.mjs`
  - `tests/pedagogy-audit-v2.test.js`
  - `docs/booklet-pedagogy-audit-v2.md`
  - `docs/handoff-pedagogy-audit-v2-stage4-20261108b.md`
  - the changed booklets, provenance and question-bank files
