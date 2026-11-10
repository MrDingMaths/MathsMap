# Handoff: finish the exam pass, paused 9 November 2026

> **Closed 10 November 2026 at James's request.** The exam pass is complete for all 210 live masters; see [exam pass closed](booklet-exam-completion.md#exam-pass-closed-10-november-2026). The notes below are the history of how it got there. Do not resume or rerun it.

James asked on 9 November 2026 to finish the exam pass for every booklet master. This has three parts:

- Use `gpt-6.1-sol` low for every Codex call ("Instead of terra 6.1 high, all codex calls should use sol 6.1 low").
- Let the checker fix rejected figures itself (his 8 November plan).
- Move exam questions that still sit in exercises into the Exam section, Stage 4 and top-up booklets included.

The session paused at a checkpoint at James's request. **Nothing is running. Nothing is committed, and `npm run repo:check` has not been run.**

## Done, 10 November 2026 evening

**The exam pass is complete.** The final closure survey (`dupfix-20261110/survey-final.txt`) closes 205 of 206 masters after rebase. The one left is the orphan proposal for `s6adv-working-with-functions-7-constructing-and-using-functions-v1`, whose booklet was removed in 4191d649.

- **Re-rates.** `rate-studio-questions.mjs --apply` filled the last unbound Exam ratings: 1 each in congruence, inverse-functions-2, optimisation, rates-of-change and curve-sketching, and 2 in quartiles-and-box-plots.
- **Second sweep.** The sweep finished. The first resume failed because the Studio server on 5173 was down (`TikZ preview failed: CONNECTION_REFUSED`). It was restarted with `mathsmap-dev` and `rolling.mjs` was run again.
  - Saved: working-with-functions-5 (1 question), curve-sketching (6), further-rates-of-change (3), area-between-curves-and-volumes-of-revolution-2 (12), quartiles-and-box-plots (8), area-between-curves-and-volumes-of-revolution (7), projectile-motion (6), volume (2), surface-area-pyramids-cones-spheres (3), inverse-trigonometric-functions (2).
  - 3d-trigonometry: no figures accepted.
  - **A rolling "closure-blocked" or "error" line can be stale.** When a run fails before closure, `rolling.mjs` reports the old `state.json` status, so read the booklet's `rolling.log`.
- **Page review.** Contact sheets for every save. `fig-dups2.mjs` found no duplicates; the one flag was a parabola question against an inverse-cosine question. `widths.mjs report` shows 0 changes.
- **Not defects.** The small red marks beside some question numbers are the chilli difficulty icon.
- **For James** (beyond "Known issues" below):
  - Display maths followed straight by text runs together ("≈ 0.571Since…", "5t²Let"), 489 cases. This needs a shared `src/` renderer fix.
  - inverse-trigonometric-functions Q4 says "the graph shown above", but the graph prints below the options.
  - quartiles-and-box-plots Q35 prints odd scale labels on a staggered second row.
  - further-rates-of-change Q26: the "1 m" label touches its edge.
  - Existing figures that print unreadably or crowded: bivariate-data-analysis-2 Q35a, further-non-linear-relationships Q17b, and the Normanhurst 2024 option graphs in further-transformations Q6.

### Holds resolved, 10 November 2026 (James: "drop the proposal", "figure out all these holds")

- **Orphan proposal dropped.** `exam-proposals/s6adv-working-with-functions-7-constructing-and-using-functions-v1.json` was renamed `.json.dropped-20261110` and the reason recorded in `DROPPED.md`, so every reader skips it.
- **Moved to Exam** (`.booklet-work/exam-holds-20261110/holds.mjs`, which uses the regroup's labelling and Exam ordering). Each question was held only because it shared a unit with practice, or because its HSC title had no paper:
  - data-visualisation-1 p9-q13 (HSC Standard 2 2018). The page break before it stays in the exercise.
  - equations-with-algebraic-fractions p15-q3 (HSC Standard 2 2018). The method note stays with the practice question p15-q4.
  - properties-of-geometrical-figures-stage5-a-2 p53-q5 (HSC Sample Question). p51-q2 and p52-q4 are textbook practice and stay.
  - logarithmic-functions p19-q20 ("Solve 2log₃5 − log₃2 + log₃x = 2") and p26-q16 ("5^x = 4", multiple choice). Both are old 2U Mathematics papers, retitled "2017 HSC Advanced" and "2013 HSC Advanced"; the bank copies were updated with `--allow-bank`.
  - introduction-to-differentiation-1 p19-q9 (HSC Advanced Sample Question). The rest of that exercise is practice.
- **Exercise duplicates removed.** The Exam already prints each of these questions, so the exercise copy was dropped:
  - graphs-of-rates-of-change p17-q8;
  - properties-of-geometrical-figures-stage5-a-2 s5-p37-q16 and p40-q13;
  - further-rates-of-change p26-q15;
  - introduction-to-differentiation-3 p19-q19;
  - probability-and-data-3 p17-q25;
  - area-circles-sectors p20-q5, the open-response copy of HSC Standard 2 2009 Q11 (Exam Q16, 42 cm²). A fresh regroup plan found it after the other holds were resolved. The plan's only remaining candidates are the three scaffolded versions below, which `holds.json` keeps in their exercises.
- **Kept as practice.** These exercise versions are scaffolded rewrites of an Exam question, not copies:
  - inequalities p20-q11 (the 2024 question in guided steps);
  - radians p19-q26 (extends the 2009 question);
  - radians p18-q23 (the original HSC 2008 version, where the Exam has the NSG 2025 rewrite).

### Page-review defects fixed, 10 November 2026 (James: "fix the ones worth fixing")

The edits are in `.booklet-work/figure-fixes-20261110/` (`make-edits.mjs` writes `edits.json`, and `fixes.mjs` builds and saves). Each booklet got a scoped render that passed and a page review. The six Exam owners whose content changed were re-rated (Sol low), which restored closure.

- **bivariate-data-analysis-2 Q35a.** The source plotting grid (a small raster) and its solution are now native TikZ grids at 100 mm, ruled as in the source.
- **further-transformations Q4.** Option panels A, B and D are zoomed to the curve (x window ±1.15) and enlarged: panels 5.2 × 4.4 cm, figure 120 mm.
- **further-transformations Q6.** Option graphs are drawn at 1.2 cm per unit, up from 0.8 cm, and the figure is 122 mm.
- **further-non-linear-relationships Q17.** The solution sketch is now 62 mm, up from 46 mm.
- **quartiles-and-box-plots Q35.** The scale is labelled 0 to 22 on one row.
- **further-rates-of-change Q26.** The right-hand "1 m" label is clear of its edge.
- **inverse-trigonometric-functions Q4.** "Shown above" now reads "shown below".

Not changed:
- **The source label inside part (a), or under the diagram.** This is deliberate code: `sourceAttributionPromptId` in `src/lib/question-source.js` makes the first visible prompt the label's print slot. Fixing it is a heading-layout change in the shared renderer, so it is left as a separate task.
- **Grey and red palette strokes on older redraws.** The QA flags them, but they print legibly.

## Update, 9 November 2026 evening (second session)

Stopped at 18:42 because Codex hit its usage limit ("try again at 9:38 PM"). **Nothing is running and nothing is committed.** Done since the first pause:

- **Regroup: finished.** The 20 built booklets and the graphs-of-rates-of-change `unmove` are saved (21 saves). Page review found two more reworded duplicates in radians (p19-q26 and p18-q23), now in `holds.json`, so radians moved 4. The three failed renders had issues only on existing Exam owners (palette grey and unclassified graph strokes), so each has `render/accepted.json`. The word-overlap check is `.booklet-work/exam-regroup-20261109/overlap.mjs`. It flags candidates only; confirm them by reading the pair.
- **Ratings: done.** `rate-studio-questions.mjs --apply` ran for non-right-angled-trigonometry-2 (21 rows), radians (4), s6adv-applications-of-calculus-2 (3), applications-of-calculus-3, integral-calculus-3 and -3-2, s6ext1-vector-representation-2 and s6ext1-4-projectile-motion (1 each). **The script needs `BOOKLET_CODEX_BIN`** (`C:\Users\Admin\AppData\Local\OpenAI\Codex\bin\f71a721e0e6193a9\codex.exe`), otherwise every job fails with `spawn codex ENOENT`. `exam-figures.mjs` sets it itself.
- **Figure pass:** `rest.txt` was rebuilt from `rest` (112 lines, 65 pending). `rolling.mjs` saved 9 booklets (right-angled-trigonometry-2 25 questions, similar-triangles 9, congruence 7, circle-geometry-2 6, circle-geometry 5, bivariate-data-analysis 3, further-transformations-2 2, data-visualisation-1 2, graphs-of-rates-of-change-2 1). 4 finished with nothing to add. Then the usage limit stopped it. The 6 booklets that failed (s6ext1-further-differentiation-and-integration, s6adv-working-with-functions-6-reciprocal-functions, rates-2, s6ext1-permutations-and-combinations-2, compound-interest-depreciation, area-quadrilaterals) are not saved and rerun automatically. No leases or render claims were left behind.
- **Page review** of stage4-indices, non-right-angled-trigonometry and the 9 saves above is done, with contact sheets and a duplicate check (`tools-20261109/fig-dups2.mjs`). It found no duplicates. Right-angled-trigonometry-2 Q21 (Sydney Grammar 2023) resembles Q25 (HSC 2019), but AB is 4.7 cm against 4.9 cm, so both are kept. A figure-first question with no stem prints its source label under the diagram (circle-geometry Q6, circle-geometry-2 Q9/Q13/Q14). This has the same shared renderer cause as the "source label inside part (a)" issue.
- **Second sweep list** (`tools-20261109/sweep-list.mjs --list`): 59 booklets, 133 rejected rows and 124 failure-held rows, which matches the counts above. Not started.
- **Closure survey** (`tools-20261109/closure-survey.mjs`, read-only). It takes each master's newest record from the proposal or either run folder and checks it against the live booklet, both as recorded and rebased in memory to the live revision. Before the ratings, 189 of 195 closed after rebase. The rest were the 5 rating gaps since filled, plus `s6adv-working-with-functions-7-constructing-and-using-functions-v1`, whose booklet was removed in commit 4191d649. That proposal is an orphan; raise it with James. About 90 records are `stale-revision` only, because the booklet changed after the record (regroup saves, other sessions). No rebased record files have been written.

Tools for the next session are in `.booklet-work/exam-figures-20261107/tools-20261109/`: `sweep-list.mjs`, `closure-survey.mjs`, `fig-dups2.mjs` and `sheets.py`, which makes contact sheets with `python sheets.py ID,ID [runRoot] [outDir]`.

The rules are in [exam completion](booklet-exam-completion.md): see "Sol 6.1 low for every exam-pass Codex call", "Exam questions out of exercises" and the figure-pass "Fix" bullet. The earlier figure-pass handoff is [here](handoff-exam-figure-pass-20261107.md).

## Before you start

- **Run every booklet render, save or driver from PowerShell**, never from the Bash tool. Git Bash's `pdftotext` has no `-bbox`, so `check-feedback-pages` fails and saves are refused. This happened once on 9 November; the cleanup is described below.
- Check for running `exam-figures`, `rolling.mjs`, `lean-import`, `lean-review`, `redraft.mjs` and export processes. Another session's pedagogy-audit redraft (`.booklet-work/pedagogy-audit-v2/review-tools/redraft-guided-20261109/redraft.mjs`) was saving booklets earlier that day. Saves are revision-checked, and the regroup save refuses a booklet that changed since its build. In that case run `build` again.
- **Interrupted runs leave locks.** If a run is stopped, look for `.booklet-work/exam-figures-20261107/<id>/workflow/worker-slots/*.json` whose `pid` is dead, and for a leftover `<id>/render.claim`. Rename them aside rather than deleting them; the 9 November ones were renamed `interrupted-lease-20261109-*.json` and `render.claim.interrupted-20261109`.

## Code changed (uncommitted)

| File | Change |
| --- | --- |
| `pedagogy/exam-batch.mjs` | `RATER` is Sol low, and `examPassConfiguration()` is passed to `runAstraTask`. `recordOnly()` writes a closure record when there are no eligible rows, nothing is selected or nothing is accepted. |
| `pedagogy/exam-figures.mjs` | `figureRounds()` (injectable round loop) and `figureIO()` (real calls). Adds `fixPrompt`, `FIX_ROUNDS = 3`, `FIX_VERSION`, author retries and `generation.revisedBy`. Terra check replies cached before 9 November are reused, with Terra recorded as their rater. The build creates an Exam section when a booklet has none. |
| `scripts/booklet/regroup-exam-sections.mjs` | Stage 4 masters are allowed, and a moved question matching an Exam owner (same MathsBase id or same prompt text) is held. |
| `docs/booklet-exam-completion.md`, `docs/booklet-exam-sections.md`, `docs/handoff-exam-figure-pass-20261107.md` | Document the above. |

The offline tests of the loop are in the old session's scratchpad. Re-create them only if you change `figureRounds`; they stub `author/compile/labels/rate/fix` and the Codex runner.

`git status` also lists `pedagogy/audit-v2*.mjs`, `docs/booklet-pedagogy-audit-v2.md`, `docs/booklet-standing-conventions.md` and many `booklets/projects/*.json`. **Those belong to other sessions.** Commit with explicit paths only.

## Where it stands

### 1. Batch closures: done
33 masters that had no closure record were run through `exam-batch.mjs` (log in `.booklet-work/exam-batch-20261107/close-20261109*.log`). The 6 that gained text-only questions are saved with closure closed, and their Exam pages were reviewed:

| Booklet | New questions |
| --- | --- |
| compound-interest-depreciation | 27 |
| further-algebraic-fractions | 5 |
| formulas, circle-trigonometry, further-expansion-factorisation-2, s6ext1-binomial-distributions | 1 each |

### 2. Regroup (exam questions out of exercises): 30 of 51 saved
The run folder is `.booklet-work/exam-regroup-20261109/`. Commands:

```text
node .booklet-work/exam-regroup-20261109/apply.mjs plan|build|save|unmove --projects ID,ID
powershell -File .booklet-work/exam-regroup-20261109/render.ps1 ID,ID
```

`holds.json` lists the reviewed duplicates, which stay in their exercises.

- **Built and rendered with the render check passed, waiting for page review then `save` (17):**
  - properties-of-geometrical-figures-stage5-a-2 (rebuilt with its 2 holds)
  - s6adv-financial-maths
  - s6adv-introduction-to-differentiation-3 and -4
  - s6adv-probability-and-data-2 and -3
  - s6adv-trigonometric-identities-and-equations
  - s6adv-trigonometry-and-measure-of-angles-3-radians
  - s6ext1-1-3d-trigonometry
  - s6ext1-2-compound-angle-identities
  - s6ext1-2-further-rates-of-change (rebuilt with its hold)
  - s6ext1-inverse-trigonometric-functions
  - set-notation-and-conditional-probability
  - simple-quadratic-equations
  - surface-area-pyramids-cones-spheres
  - volume-of-pyramids-cones-spheres
  - volume
- **Render did not pass; inspect `render/feedback-pages.json` first:**
  - s6adv-exponential-and-logarithmic-functions-2-logarithmic-functions
  - s6adv-working-with-functions-10-properties-of-functions-relations-and-graphs
  - s6ext1-3-parametric-form

  If every issue is on an existing `exam-mb-…` owner and none is on a moved question, write `render/accepted.json` with the reason (as done for features-quadratics-exponentials-2 and both graphs-of-rates-of-change booklets), then save.
- **graphs-of-rates-of-change-v1:** an `unmove` candidate is built and rendered (passed). It puts p17-q8 back in its exercise because the Exam already has the same HSC 2007 question. Run `save` for it.
- **s6ext1-4-inequalities:** nothing left to move; its only candidate was a duplicate.
- **Held for James to decide (not moved):**
  - data-visualisation-1 p9-q13 (linked to a flow block)
  - equations-with-algebraic-fractions p15-q3/q4 (shared method note)
  - properties-of-geometrical-figures-stage5-a-2 p51-q2/p52-q4/p53-q5 (linked)
  - logarithmic-functions p19-q20 and p26-q16 (HSC title with no paper or year)
  - introduction-to-differentiation-1 assignment section (cross-section dependency)
  - two duplicates the guard found: introduction-to-differentiation-3 p19-q19 and probability-and-data-3 p17-q25
- **Review method that worked:** the page lists come from each render's `editionsReport.student.images`; look at 4 pages per contact sheet. The prompt-text guard misses reworded duplicates. A word-overlap check (Jaccard of words, same year in the source label, ≥ 0.35, against owners that were not moved) found the 5 in `holds.json`. Run it on every new candidate.

### 3. Figure pass: 71 saved, about 53 to run
- Saved on 9 November: stage4-indices (pilot) and non-right-angled-trigonometry (20 questions, 8 of them through checker fixes).
- circle-geometry-v1 is built (5 questions) and its render was interrupted. `rolling.mjs` re-renders and saves it.
- `rest.txt` was rebuilt on 9 November from `node pedagogy/exam-figures.mjs rest`, without the regroup booklets that were still pending. **After the regroup saves finish, rebuild it** from `rest` (the full list is in `rest-all-20261109.txt`), so the regroup booklets are included. Then, from PowerShell:

```text
node .booklet-work/exam-figures-20261107/rolling.mjs
```

- `no-figure-rows` with a large `carriedOver` is expected: the 4 November pass already decided those rows.

### 4. Not started
- **Second sweep.** 59 finished booklets hold 133 rows Terra rejected and 124 rows held by failed author calls. To rerun one, rename its `saved.json` and `state.json` to `*.sweep1.json`, add it to `rest.txt` and run `rolling.mjs`. A rerun picks up only rows not yet in the booklet, and the Terra check replies stay cached, so most of the cost is the fix calls.
- **Unbound Exam ratings block closure:**
  - non-right-angled-trigonometry-2 has 17 existing owners and the moved nr-p47-q12;
  - radians has 4.

  Re-rate them with the difficulty-only route, `scripts/booklet/rate-studio-questions.mjs --project ID`: dry run first, then `--apply`. That route is already Sol low.
- **Page review** of every booklet the figure pass saved since 167c8c2a, then `node .booklet-work/exam-figures-20261107/widths.mjs report`.
- **Finish:** run `npm run repo:check`, then commit the code, docs and saved booklets with explicit paths, leaving out other sessions' files.

## Known issues to raise with James
- **Source label inside part (a).** When a question has no stem text, Studio prints its source label inside part (a) rather than beside the question number. Examples: elevation-depression-bearings Q16, compound-interest-depreciation Q27, rates Q14. This is a shared renderer cause, and needs a separate `src/` fix.
- **Pre-existing layout warnings on earlier figure-pass redraws:**
  - features-quadratics-exponentials-2: unclassified graph strokes;
  - graphs-of-rates-of-change and graphs-of-rates-of-change-2: grey `rgb(128,128,128)` strokes;
  - graphs-of-rates-of-change: wrapped table labels.
- **AGENTS.md** still lists Terra high for exam checks. The Sol-low exception for this pass is recorded in the guide, and AGENTS.md was left unchanged because of its length limit.
