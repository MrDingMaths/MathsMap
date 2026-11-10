# Handoff: exam figure pass (exam top-up), paused 7 November 2026

The figure pass is paused because the Terra rater (Codex `gpt-6.1-terra`) hit its
usage limit at about 22:02 on 7 November. Codex said the limit resets **9 November
2026 at 4:26 PM**. Everything else is ready to resume. The workflow is described in
[exam completion: figure pass](booklet-exam-completion.md#figure-pass-7-november-2026-user-requested).

## Where it stands

- **Saved and committed:** 69 booklets with 468 redrawn figure questions
  (commits 9224a380, 7fdde8b8, 167c8c2a). Every save passed its closure check,
  Terra rating and render check under James's blanket approval of 7 November.
- **Finished with nothing to add:** the booklets whose `state.json` says
  `no-figure-rows`, `nothing-selected` or `none-accepted`. Six booklets were
  genuinely rejected by the checker or the author: compound-events-v1,
  coordinate-geometry-formulas-v1, graphing-lines-v1, polynomials-2-v1,
  s6adv-further-graph-transformations-and-modelling-2-modelling-with-functions-v1
  and s6ext1-3-further-trigonometric-equations-v1.
- **Waiting for Terra (42 booklets):**
  - 39 booklets whose rating failed on the usage limit. Their state was renamed
    `state.rating-failed.json`, so the driver treats them as not yet run, and their
    Sonnet drafts are cached. They are angle-relationships-v1, circle-trigonometry-2-v1,
    computation-with-integers(-2)-v1, converting-fdp-v1,
    coordinate-geometry-problems-v1, data-analysis(-2)-v1,
    direct-and-inverse-proportion-v1, earning-money-v1, inequalities-v1,
    linear-relationships-2-v1, measurement-error-v1,
    operations-fractions-decimals-3-v1, percentages-problems-v1, probability-v1,
    rates-v1, s6adv differential calculus 2–4, s6adv exponential functions 1,
    s6adv introduction to differentiation 2 (both), s6adv continuous random
    variables 2, s6adv arithmetic sequences, s6adv trigonometric identities,
    s6adv direct and inverse variation, s6ext1 multiplicity of zeroes, sum and
    product of roots, parametric form, binomial distributions 2, permutations and
    combinations, similar-areas-and-volumes-v1, simple-quadratic-equations-v1,
    simplifying-expressions-v1, solve-2-step-equations-2-v1, stage4-indices(-2)-v1
    and standard-deviation-v1.
  - 3 booklets that errored with "Codex exited 1": rates-2-v1,
    s6ext1-permutations-and-combinations-2-v1 and
    s6ext1-further-differentiation-and-integration-v1.
- **Areas Between Curves 2** (`s6ext1-3-area-between-curves-and-volumes-of-revolution-2-v1`)
  is saved, but 9 of its rows were held with "All three booklet worker slots are
  busy". Rerunning it picks up only rows not already in the booklet.

## How to resume

Before starting, check that the time is after the reset and that a one-line Codex call works.
If the limit has not lifted, do not switch the rater: a Sol low fallback must be
explicit, never automatic (AGENTS.md). Check for running `lean-import`,
`lean-review` and export processes, as usual for the shared checkout.

```text
node .booklet-work/exam-figures-20261107/rolling.mjs
powershell -File .booklet-work/exam-figures-20261107/redo.ps1 s6ext1-3-area-between-curves-and-volumes-of-revolution-2-v1
node .booklet-work/exam-figures-20261107/widths.mjs report
```

- `rolling.mjs` reads `rest.txt` and skips saved and finished booklets. It runs 3
  booklets at a time (each keeps its own cap of 3 model workers), renders and saves
  each as soon as it is built, and stops launching new booklets if claude or Codex
  calls fail for 3 booklets in a row. It logs progress to `rolling-progress.log`, with
  per-booklet output in `<id>/rolling.log`. (Some process holds `rest-progress.log`
  locked, so that file is no longer written.)
- `redo.ps1 ID,ID` runs run → render → save for named booklets, with the same approval quote.
- `widths.mjs report` / `repair-widths.ps1 ID,ID` fix diagram sizes and labels on
  booklets that are already saved (see below). After the last run it should report no changes.
- After the run: look at the Exam pages of every booklet saved since 167c8c2a. The
  36 booklets in 167c8c2a have also not had a page review, only their render check.
  `check-feedback-pages` rasters are in `<id>/render*/pdf-rasters`. Then run
  `npm run repo:check` and commit with explicit paths.
- Leave other sessions' edits out of commits. As of the handoff, these files hold
  uncommitted edits from elsewhere: rounding-decimals-v1.json,
  solve-2-step-equations-v1.json and
  s6adv-further-graph-transformations-and-modelling-2-modelling-with-functions-v1.json
  (Studio layout changes).

## Resumed 9 November 2026

Current status and next steps: [handoff of 9 November](handoff-exam-pass-20261109.md).

- **Sol 6.1 low for every Codex call** (James: "Instead of terra 6.1 high, all codex calls should use sol 6.1 low"). This covers the batch rating, the figure check and the new figure fix. Terra check replies cached before then are reused and keep Terra as their recorded rater.
- **The checker fixes rejected figures** (James, 8 November). Up to 3 fix-and-recheck rounds replace the single Sonnet repair round, and an accepted fix records `generation.revisedBy`. Failed author batches are retried row by row, and busy worker slots wait instead of holding rows. Details are in the [guide](booklet-exam-completion.md#figure-pass-7-november-2026-user-requested). More model calls per booklet make a usage limit likelier; `rolling.mjs` still stops after 3 booklets fail in a row.
- **Every master now has a batch closure record**, including booklets where the batch had nothing to add (33 booklets, 9 November). The figure pass therefore reaches their figure rows too.
- **Exam questions in exercises moved to Exam** (`.booklet-work/exam-regroup-20261109/`, Stage 4 included). This ran before the figure run, so the figure selection counts the moved questions as existing owners.
- **Second sweep.** Booklets saved earlier still have rows that Terra rejected or that failed author calls held. Their `saved.json` and `state.json` are set aside (`*.sweep1.json`) so `rolling.mjs` reruns them. A rerun picks up only rows not yet in the booklet.

## What changed in the builder on 7 November (all in `pedagogy/exam-figures.mjs`)

- **Diagram widths.** Each redraw is saved with the width it was drawn at, from the
  preview viewBox. Before this, every diagram printed at the 78 mm default.
  Diagrams the student draws or writes on (prompt says draw, sketch, complete,
  plot, mark, shade, fill in, represent or label) keep at least 78 mm and are
  tagged `spec.sizing.purpose: "drawing"`.
- **Label fixes.** "NOT TO SCALE" captions anchored to the bottom edge get a 3 pt
  gap, and graph tick labels get a white backing. Inline `{rgb,255:…}` colours
  become named HTML colours, because Studio printed them navy or green.
- **Label pre-check** (`pedagogy/figure-label-check.mjs`). Studio's
  `inspectDiagramLabelLayout` runs on every preview. A redraw with a collision goes
  back to its author once without a Terra call, and that send-back does not count
  as the row's repair round.
- **Prompt order.** The fixed manuals (about 31k tokens) come first in every authoring
  call, and the repair note after them.
- **Rating failures.** A garbled Terra reply is retried. Any other failure, such as
  Codex exiting or a usage limit, fails the booklet instead of recording its rows as
  rejected. Before this fix, the usage limit turned 86 rows into false "rating
  failed" rejections.

## Known minor issues left as they are

- Further Non-linear Relationships 2, Q4: some tick labels touch.
- Area of Circles, Q19b: the "2 cm" arrow is crowded.
- In 9224a380, `area-parallelograms-triangles-v1.json` included another session's
  Pedagogy audit v2 flag notes (revisions 294→296). They are valid Studio saves and were kept.
