# Handoff: pedagogy audit v2, Stage 5, paused in batch 2 (10 November 2026)

Continues `docs/handoff-pedagogy-audit-v2-stage5-20261109b.md`. Paused at James's request (usage limit). Nothing is committed. `.booklet-work/pedagogy-audit-v2/PAUSE` exists: remove it to resume. James approved running batches 2 and 3 (10 November).

## Where it stands

- **Batch 1 is finished** (26 booklets, pilot included): every booklet applied, settled, recounted and scanned; queued patches applied and their blocks rendered and looked at.
- **Batch 2: 21 of 25 applied** (Circle Trigonometry 2 re-applied by hand after the bank-sync fix). Every applied booklet's changed pages were looked at, apart from Further Algebraic Fractions (saved at the pause).
  - **Stopped mid-audit:** Further Expansion and Factorisation 1 and 2 (stopped by hand; their finished calls are in each booklet's `reply-cache`, so a re-run reuses them).
  - **Not started:** Further Non-linear Relationships 1 and 2 (logged "blocked: Paused").
- **Batch 3:** not started. Its dry run passed for all 25.
- **Studio server:** started at 07:31 with `mathsmap-dev` (it was down; apply page checks failed until it ran).
- **The exam figure pass is running in another session** (`rolling.mjs`). Its page checks block the audit on the same booklet ("An import, review, export or repair is running"); re-run any booklet blocked that way.

## Code fixes on 10 November (each has a test; 66 of 66 pass)

In `pedagogy/audit-v2.mjs` and `pedagogy/audit-v2-apply.mjs`:

1. **Tables of values labelled by their equation** (`isEquationLabel`): "x" over "y=x^{2}-8x+10" is a bordered table with a wide shaded label column (Features of Quadratics 1 j2).
2. **Part tables limit grid columns** (`figureColumns`): a bordered table's content width (longest cell per column) limits the columns (FQ1 slot 5). Borderless working is not limited.
3. **House grid colour** (`houseTints`): a drafted figure naming `housegrid` gets its `\definecolor` (Quartiles slot 12 did not compile).
4. **Restated parts** (`bareLikeSiblings`), three more shapes: a stem ending mid-phrase "…of a:" (Angle Sums p17-q5); the stem's words around one maths item (Circle Trigonometry 1 Ex 4 and 6); the stem's opening and closing words around the items (Coordinate Geometry Formulas p12-q2).
5. **One-part lettered blocks** (`keepPartShell`): a duplicate replacing a block that is one labelled part keeps the part and its label (Circle Geometry 2 vv, hhh, vvv).
6. **Continued lettered runs** (`joinContinuedRuns`, run on every apply): new questions inside a question continued across blocks join it as fragments, and the run is lettered in one sequence (Circle Geometry 1 Exercise 6 printed 6, 9, 10 and two "nn").
7. **Bank sync retry** (`applyAuditV2`): when bank sync cannot place a changed question's new diagram, that change stays a comment and the apply runs again (Circle Trigonometry 2 p38-q3).

## New review tools (`.booklet-work/pedagogy-audit-v2/review-tools/`)

- `repair-equation-tables.patch.mjs`, `repair-part-shells.mjs`, `repair-continued-runs.patch.mjs`: settle patches and scanners for fixes 1–2, 5 and 6.
- `split-arranged.mjs` then `split-text-loss.mjs` then `split-suspect-pages.mjs`: the silent-content-loss detector. Run on 71 audited booklets: 143 arranged blocks span two pages, 34 suspects, and on inspection none had lost content.

## To do on resume, in order

1. Remove `PAUSE`. Confirm the Further Algebraic Fractions apply saved (`batch.jsonl`), and look at its changed pages (`review-run.ps1`).
2. Run the rest of batch 2 through the driver: `node pedagogy/audit-v2-batch.mjs --projects <ids> --parallel 3` (the driver skips booklets already done). Look at every applied booklet's pages.
3. **Settle batch 2** (`settle-all.ps1 -Apply` on its ids). Patches already queued in `settle-20261108/*.manual.json`:
   - Angle Sums of Polygons, Circle Trigonometry 1, Coordinate Geometry Formulas: `repair-restated-parts.patch.mjs`.
   - Circle Geometry 2: `repair-part-shells.mjs`.
   - Circle Geometry 1: `repair-continued-runs.patch.mjs` (reletters Exercise 6 p…ggg).
   Then render the patched blocks (`render-blocks.mjs`) and look at them.
4. `after-booklet.ps1` on batch 2, then `remove-count-slots.mjs ID --apply` for the surplus it lists.
5. Batch 3 (`stage5-batch3.txt`), the same routine.
6. Split-box detector on the batch 2 and 3 booklets.
7. Report: `docs/pedagogy-audit-v2-stage5-report-<date>.md`.

## Cost

Batch 1 re-runs: Quartiles $2.20 (4 calls reused), Bivariate 2 $2.03 (its booklet had changed, so no reuse). Batch 2: see `batch.jsonl` totals (about $2 to $3 a booklet).

## For James

- **Four Stage 4 booklets cannot be page-checked:** Percentages Problems, Probability, Ratios and Volume have arrangement references to paragraphs that no longer exist (already in the committed version; not the audit's).
- **Possible errors in teacher content:** Algebraic Fractions (algebraic denominator) p19 example simplifies 12x²y/120x³y³ to 1/(10xy⁴) (should be 1/(10xy²)); Direct and Inverse Proportion p34 guided practice ("How long would it take 2 people to paint the fence?") has no setup.
- **Cluttered drafted figures:** Surface Area p59 guided practice (labels overlap); Circle Trigonometry 2 Exercise 5 Q1–Q2 (small triangles, labels cramped).
- **Near-repeats:** Binomial Numerator Q2 e/h and f/i (differ only by sign); Compound Events Q7 reuses Q6a's Venn diagram.
- Earlier items from the 9 November handoff still stand (Comparing Fractions restated stems, `=` alignment, duplicate "a" in Bivariate p8, and the rest).
