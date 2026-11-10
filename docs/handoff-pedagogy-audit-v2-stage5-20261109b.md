# Handoff: pedagogy audit v2, Stage 5, paused after batch 1 (9 November 2026)

Continues `docs/handoff-pedagogy-audit-v2-stage5-20261109.md`. James asked for a pause after batch 1. Nothing is committed. `logarithms-v1` is out of scope (James, 9 November: no ledger row).

## Where it stands

- **Done:** the pilot (Compound Interest) plus batch 1, 26 of the 76 booklets in all. 20 are applied and saved, 5 failed their apply and 1 was blocked (re-run list below). The comment settle and repair scanners have run only on the pilot.
- **Cost so far:** $53.73 for audit calls and $0.90 for apply-step ratings (26 booklets, about $2.10 each).
- **Not started:** batches 2 and 3 (`.booklet-work/pedagogy-audit-v2/stage5-batch2.txt`, `stage5-batch3.txt`, 25 ids each), the after-batch recount and repair scanners, the comment settle for batch 1, and the report.
- `tests/pedagogy-audit-v2.test.js`: 61 of 61 pass.

## Code fixes on 9 November (each has a test)

In `pedagogy/audit-v2.mjs`, `pedagogy/audit-v2-apply.mjs` and `pedagogy/audit-v2-prompts.mjs`:

1. **Drafted tables (`promptFromSource`).**
   - A cell's width counts every blank in it, not just the first, and operators in printed maths get extra width.
   - Rows of four or more items get a gutter.
   - Working tables with blanks get 10 mm rows.
   - Tables labelled by variables plus a word (x / y / Coordinate) and two-way tables with a blank corner are bordered, with their headings shaded.
2. **Replaced parts (`bareLikeSiblings`).** A restated stem command is dropped from a replaced part: a whole sentence, the stem's second verb, or a first paragraph or line restating the stem.
3. **Exam questions (`keepExamQuestions`).** A duplicate never replaces a past exam question. The replacement goes to the pair's other, non-exam question; otherwise the judgement is dropped.
4. **Single parts (`singlePartDraft`).** A part is replaced only by a single item with an answer.
5. **Maths inside text (`unnestTextMath`).** `\text{… $y$ …}` inside maths no longer breaks the render.
6. **Theory rewrites (`pruneArrangement`).** A rewrite that merges paragraphs drops only the dangling arrangement items.
7. **Baseline check (`unchangedFigure`).** A figure issue in a block the audit left unchanged is not counted as new.
8. **Figure columns (`figureColumns`).** A part figure more than 1.5 times its column's width limits the grid's columns.
9. **Reply parsing (`parseJson`).** A reply that sends a corrected second JSON object is read from that object.
10. **Drafting contract.** Axis tick labels must be at least 8 mm apart, and angle pics must be ordered to mark the interior angle.

## Saves already made (all page-checked and looked at)

- Earning Money 2 p55-q9: resource annotation (rev 5).
- Compound Interest: settled, and two wording fixes applied by hand (rev 176).
- Drafted scaffolds widened, or given row heights, in 9 booklets. Tool: `review-tools/repair-narrow-scaffolds.mjs`.
- Gradient-Intercept Form slot 1: equation rows widened (rev 392).
- **Past exam questions restored** (`review-tools/restore-exam-question.mjs`):
  - Earning Money 2 p56-q13 (2021 HSC), which the audit had replaced today with a drafted "Rachel" question.
  - Area of Circles and Sectors p20-q5 (2009 HSC), replaced on 8 November in Stage 4.

## To do on resume, in order

1. **Re-run or re-apply**, one at a time, from PowerShell:
   - `features-quadratics-exponentials-2-v1`: `node pedagogy/review.mjs audit-v2 --project features-quadratics-exponentials-2-v1 --apply --run .booklet-work/pedagogy-audit-v2/features-quadratics-exponentials-2-v1/20261109-101105`
   - `features-quadratics-exponentials-v1`: the same command with run `20261109-101212`. Then look at the p4-teaching layout.
   - `grouped-data-v1`: the same command with run `20261109-103600`. The retry should take j2 b (38 mm past the footer) and the slot-1 table out as comments.
   - `index-laws-complete-v1`: the same command with run `20261109-104053`.
   - `bivariate-data-analysis-2-v1` and `quartiles-and-box-plots-v1`: re-run through the batch driver (cached replies).
2. **Settle batch 1** (`build-decisions.mjs`, `settle-all.ps1`). Apply these patches with the settle; `settle-all -Apply` skips the page check, so render the patched blocks afterwards:
   - `review-tools/repair-restated-parts.patch.mjs` for Algebraic Fractions, Expanding Expressions and Negative Indices.
   - `review-tools/repair-mixed-label-tables.patch.mjs` for Graphing Lines and Multistage Probability.
   - The per-booklet patches in `settle-20261108/`:
     - Coordinate Geometry: j3 b axis labels.
     - Elevation and Depression: j4 guided practice angle labels.
     - Multistage Probability 2: `pageBreakBefore` on p25-interpret, and slot-3 columns.
     - Right-Angled Trigonometry 2: the reflex angle pic.
3. Run the recount and repair scanners (`after-booklet.ps1`) on the batch 1 booklets.
4. Run batches 2 and 3.
5. **Detector for silent content loss.** The renderer split the full-page investigation in Multistage Probability 2 once new Review items pushed it down the page. Only its heading and first sentence printed, twice, and the page check passed. Render each audited booklet's arranged blocks and list every arranged block that lands on more than one page.
6. Write the report.

## For James

- **Renderer issues:**
  - Arranged boxes split across pages can drop content silently (above).
  - Aligned working does not line up its `=` signs when the left-hand sides differ in width.
  - Separate guided-practice blocks in one box are both lettered "a" (Bivariate p8).
- **Comparing Fractions (Stage 4):** four replaced parts restate their stem sentence. They were left as they are because the Stage 4 notes keep that wording.
- **The two restored exam questions:** each one's duplicate partner is also an exam version, so both pairs stay as printed.
- **Smaller notes:** some drafted figures are cluttered (Elevation j4 and j7 examples; Right-Angled Trigonometry p22 Q11), there are near-repeated slots (Measurement Error, Significant Figures), and Right-Angled Trigonometry 2 has an angles-topic box titled "Solving for an Unknown Side".
