# Handoff: pedagogy audit v2, Stage 5, paused in batch 3 (10 November 2026, afternoon)

Continues `docs/handoff-pedagogy-audit-v2-stage5-20261110.md`. Paused at James's request. `.booklet-work/pedagogy-audit-v2/PAUSE` exists: remove it to resume. James approved batches 2 and 3 (10 November). Everything up to the pause is committed (see "Commits" below).

## Where it stands

- **Batch 1:** finished (26 booklets).
- **Batch 2: finished** (25 booklets): all applied, settled with the queued patches (restated parts, part shells, continued runs), recounted, 11 surplus count questions removed from 9 booklets, every changed page and every patched block rendered and looked at.
- **Batch 3 (`stage5-batch3.txt`): 20 of 25 applied, not yet looked at or settled.**
  - Applied: Further Parabolas 2, Further Quadratic Equations, General and Point-Gradient Form, Graph Regions, Graphs of Rates of Change 1 and 2, Inequalities, Linear Equations with Fractions, Monic Quadratic Equations, Multistep Linear Equations, Negative Index Laws, Non-right-angled Trigonometry 1 and 2, Rearrange Formulas, Set Notation and Conditional Probability, Similar Areas and Volumes, Similar Triangles, Simple Cubic Equations, Simultaneous Equations 2 (saved, but its render check exited 1: read `simultaneous-equations-2-v1/20261110-040631/render.json` and look closely at its pages).
  - **Apply failed: Further Parabolas 1** (run `further-parabolas-v1/20261110-025907`). The audit finished; the render check failed with 2 new check failures, both "answer-coverage" (short edition): a complete answer diagram does not appear exactly once (`render.json`). Not looked into. Find which audit change adds or drops the answer diagram (the list mentions `v2-86081e-p7-practice-slot-1-…-graph`), fix centrally, then re-apply (`node pedagogy/review.mjs audit-v2 --project further-parabolas-v1 --apply --run <run>`).
  - **Not started (blocked by PAUSE):** Simultaneous Equations 1, Surds 1 and 2, Surface Area of Pyramids, Cones and Spheres, Volume of Pyramids, Cones and Spheres.
- **Exam figure pass:** not running at the pause (no `rolling.mjs` process). Its uncommitted code and docs were committed with this pause, as asked.

## Fixes on 10 November afternoon (each has a test; 69 of 69 pass)

1. **Key ideas maths in `$…$`** (`audit-v2-prompts.mjs`: prompt rule and `bareMaths` check in `validateAudit`). Two replies wrote bare maths that printed as plain text; the 8 boxes (Further Non-linear Relationships 1: 5, Circle Trigonometry 2: 3) were rebuilt with `review-tools/repair-keyideas.mjs --items review-tools/keyideas-maths-20261110.json` and looked at. Batch 3 ran with the check.
2. **Restated stem, fifth shape** (`bareLikeSiblings` in `audit-v2-apply.mjs`): a replaced part repeating the stem's later lines word for word keeps only its item (Further Non-linear Relationships 1 Ex 5 Q3a, applied in the batch 2 settle).

Both recorded in `docs/booklet-pedagogy-audit-v2.md` ("Stage 5 batch 2 fixes").

## To do on resume, in order

1. Fix and re-apply Further Parabolas 1 (above).
2. Remove `PAUSE`; run the rest of batch 3: `node pedagogy/audit-v2-batch.mjs --projects simultaneous-equations-v1,surds-2-v1,surds-v1,surface-area-pyramids-cones-spheres-v1,volume-of-pyramids-cones-spheres-v1 --parallel 3` (the driver skips booklets already done).
3. Look at every batch 3 booklet's changed pages: `powershell -File .booklet-work/pedagogy-audit-v2/review-tools/review-run.ps1 ID`. Check key ideas boxes and replaced parts in particular.
4. Before settling, scan for restated parts across Stage 5 (`repair-restated-parts.patch.mjs` dry, as in the batch 2 scan) and queue `settle-20261108/ID.manual.json` for any found; then `settle-all.ps1 -Apply` on batch 3 and render the patched blocks (`render-blocks.mjs`).
5. `after-booklet.ps1` on batch 3; `remove-count-slots.mjs ID --apply` for the surplus it lists.
6. Split-box detector (`split-arranged.mjs` → `split-text-loss.mjs` → `split-suspect-pages.mjs`) on batch 2 and 3 booklets; inspect the suspects.
7. Report: `docs/pedagogy-audit-v2-stage5-report-<date>.md`.

## Commits

Made at the pause, all on `master`, not pushed:
- `6c792fd4` Pedagogy audit v2: Stage 5 fixes and batch driver (code, tests, audit doc, standing conventions).
- `6df288b1` Exam figure pass: Sol low checks, fix loop, regroup into Exam (the other session's code and docs; it was not running).
- `3d0f74d0` Studio: Difference of Two Squares and Polynomials 1A booklets (James's own Studio edits).
- `ecf4490e` Booklets: Stage 5 audit batches 1–3 and exam figure pass content (projects, question bank, provenance).
- This handoff, with the earlier Stage 4 and Stage 5 handoffs and reports.

`.booklet-work/` is ignored by git: the run folders, review tools (`review-tools/`), settle patches (`settle-20261108/`) and `batch.jsonl` stay on disk only.

## For James

- **Four Stage 4 booklets cannot be page-checked** (Percentages Problems, Probability, Ratios, Volume): arrangement references to paragraphs that no longer exist, already in the committed version.
- **Possible errors in teacher content:** Algebraic Fractions (algebraic denominator) p19 example gives 1/(10xy⁴), should be 1/(10xy²); Direct and Inverse Proportion p34 guided practice ("How long would it take 2 people …") has no setup.
- **Cluttered or small figures:** Surface Area p59 guided practice (labels overlap); Circle Trigonometry 2 Exercise 5 Q1–Q2 (small triangles); Circle Geometry 2 vv (tiny figure, instruction in a narrow column).
- **Near-repeats:** Binomial Numerator Q2 e/h and f/i (differ only by sign); Compound Events Q7 reuses Q6a's Venn diagram; Circle Trigonometry 1 Exercise 6 k and n are both θ = 135°.
- **Your Studio work in this checkout** was committed separately: the new Difference of Two Squares booklet, a second Polynomials 1A booklet (`project-9169da60-…`), and the deletion of the empty "Monic Factorising for 7" booklet (`booklet-gi16q1`).
- Earlier items from the 9 November handoffs still stand.
