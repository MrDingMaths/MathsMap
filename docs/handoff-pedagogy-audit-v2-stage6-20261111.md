# Handoff: Stage 6 pedagogy audit v2 batch, paused (11 November 2026)

Written for a new session. The Stage 6 batch over the 89 Stage 6 masters is paused safely. No audit is running. The `PAUSE` marker is in place, and every booklet that started has finished its save or failed cleanly.

Read first: `AGENTS.md`, `docs/booklet-pedagogy-audit-v2.md` (the "Workflow changes before Stage 6" and "Pilot and retrofit fixes" sections), and the predecessor [handoff](handoff-pedagogy-audit-v2-fixes-20261111.md).

## Where it stands

The list is `.booklet-work/pedagogy-audit-v2/stage6-ids.txt` (89 booklets), and the ledger is `.booklet-work/pedagogy-audit-v2/batch.jsonl`.

| State | Count | What to do |
| --- | --- | --- |
| Applied (63), or pilots skipped as already done (2) | 65 | Review only (see below) |
| Audited; the save's page check could not reach port 5173 | 4 | Re-apply the existing run; no model calls |
| Blocked by a validator fault, since fixed | 2 | Re-run; accepted replies are reused |
| Not started, held by the pause | 18 | Run the batch |

Model spend recorded today on Stage 6 audit rows: about $124 (`totals.costUsd` on `audited` rows).

Logs: `stage6-batch-20261111.log` (first run, paused by James at 3:55 pm), `stage6-batch-20261111-resume.log`, `stage6-batch-20261111-resume2.log`. Working notes: `stage6-followups-20261111.md`.

## To resume

1. Check for running `review.mjs audit-v2`, `lean-import`, `lean-review` or export processes. Check that `http://127.0.0.1:5173/` answers.
2. **Re-apply the four** whose audit finished but whose page check got `ERR_CONNECTION_REFUSED`. Do them one at a time, since only one apply may run at once:

   ```
   node pedagogy/review.mjs audit-v2 --project ID --apply --run .booklet-work/pedagogy-audit-v2/ID/RUN
   ```

   | ID | RUN |
   | --- | --- |
   | s6adv-introduction-to-differentiation-2-calculations-with-the-derivative-v1 | 20261111-074411 |
   | s6adv-sequences-and-series-1-sequences-and-series-v1 | 20261111-082555 |
   | s6adv-sequences-and-series-3-geometric-sequences-and-series-2-v1 | 20261111-082840 |
   | s6adv-trigonometry-and-measure-of-angles-1-trigonometry-with-acute-angles-v1 | 20261111-083532 |

   If a booklet's live revision has moved since its run, the apply refuses. Re-run that booklet through the batch instead.
3. **Run the rest in one batch:** remove `PAUSE`, then pass the two re-runs and the 18 not started. Pass only these ids. Do not pass `stage6-ids.txt` again (see "Revision skip" below).
   - Re-runs: `s6adv-introduction-to-differentiation-2-calculations-with-the-derivative-2-v1`, `s6adv-working-with-functions-11-piecewise-defined-functions-v1`.
   - Not started: `s6ext1-2-further-operations-with-vectors-v1`, `s6ext1-2-further-rates-of-change-v1`, `s6ext1-2-sum-and-product-of-roots-v1`, `s6ext1-3-area-between-curves-and-volumes-of-revolution-2-v1`, `s6ext1-3-area-between-curves-and-volumes-of-revolution-v1`, `s6ext1-3-further-trigonometric-equations-v1`, `s6ext1-3-parametric-form-v1`, `s6ext1-4-differential-equations-2-v1`, `s6ext1-4-differential-equations-v1`, `s6ext1-4-inequalities-v1`, `s6ext1-4-projectile-motion-v1`, `s6ext1-binomial-distributions-v1`, `s6ext1-further-differentiation-and-integration-2-v1`, `s6ext1-further-differentiation-and-integration-v1`, `s6ext1-permutations-and-combinations-2-v1`, `s6ext1-permutations-and-combinations-v1`, `s6ext1-proof-by-mathematical-induction-v1`, `wf1-algebraic-techniques-v2`.

   ```
   node pedagogy/audit-v2-batch.mjs --projects <the 20 ids, comma-separated> --parallel 3
   ```
4. **Review every Stage 6 booklet** using the workflow's review tools in `.booklet-work/pedagogy-audit-v2/review-tools/`:
   - Run `after-booklet.ps1`.
   - Run `review-run.ps1` for the sheets: flags first, then figure and teaching pages in full, then the short and worked answer pages.
   - Look at the rendered pages by eye.
   - Fix shared defects in the runner, not one booklet at a time.

   Done so far: `after-booklet.ps1` ran on the first 29 applied booklets (`stage6-after-booklet-first29.txt`). It found no repair, shape or lettered-run findings. Not done yet: scanners on the other 36 applied booklets, and any visual review.
5. Add a dated Stage 6 batch note to `docs/booklet-pedagogy-audit-v2.md` covering the fixes and the points below. Then run `npm run repo:check` and commit with explicit paths.

## Fixed during this run (committed in `0e7b7cfa`, tests in `tests/pedagogy-audit-v2.test.js`)

- **A draft reply that leaves out a request** (`validateDrafts`) now drops that slot. The slot is listed under `report.dropped`, and the run is not blocked. A reply that drafts nothing and declines nothing still fails.
  - Applications of Calculus 2B Optimisation: slot-6 was left out on both attempts and blocked the run before the pause.
  - The first version of this fix rejected valid replies that declined every request, which blocked Differentiation 2B part 2. That was corrected the same evening.
- **An equivalence reply that leaves out a pair** (`validateEquivalence`) now counts that pair as not equivalent, with a reason. The run is not blocked. A reply with no verdicts at all still fails. Case: Piecewise-defined Functions, `slot-2-upper#0`.

## Points for James or the next session

- **Revision skip.** The batch skips a booklet only when its audit record, or an applied ledger row, matches the live revision.
  - The 6:27 pm unneeded-review repair saved new revisions for booklets already audited today.
  - So a re-run over `stage6-ids.txt` audited four of them a second time, and each re-run saved normally: `inverse-functions-v1`, `inverse-functions-2-v1`, `graph-transformations-2-v1`, `polynomials-2-v1`.
  - Check those four for duplicated additions.
  - Possible runner change, not made: skip a booklet that has an applied ledger row from the same batch, whatever its revision.
- **Surplus count questions** in 5 booklets, flagged by the after-booklet recount and left in:
  - `inverse-functions-2-v1` slot-6
  - `s6adv-differential-calculus-3-…` slot-2
  - `s6adv-differential-calculus-1-…` slot-6
  - `s6adv-exponential-and-logarithmic-functions-2-…` slot-1 and slot-10
  - `s6adv-integral-calculus-1-…` slot-4

  That recount groups types with its own model call. The save-time recount of 11 November deliberately uses the run's own type groups, so the two can disagree. Remove these only if James agrees.
- **Studio server.**
  - From 6:51 pm another session edited files the server loads (`scripts/booklet/project-studio-server.mjs`, `bank-sync.mjs` and others). Vite reloads its config after each edit, which caused the short refusals.
  - At 7:39 pm port 5173 had no Vite process at all. This session restarted it with the `mathsmap-dev` launch configuration. That server belongs to this session's preview, so if it is gone when work resumes, start it the same way.
