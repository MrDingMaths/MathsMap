# Handoff: pedagogy audit v2, Stage 5 campaign (9 November 2026)

Read first: `AGENTS.md`, `docs/booklet-pedagogy-audit-v2.md` (all 8 and 9 November sections), `docs/handoff-pedagogy-audit-v2-stage4-20261108b.md` and `docs/pedagogy-audit-v2-stage4-report-20261108.md`. James has approved autonomous progress, with a report at the end.

## Where Stage 4 ended

- All 43 Stage 4 masters are audited and saved. Comments are settled, so no booklet has an open v2 comment except those needing James's decision.
- The 9 November rules are in force and tested: Challenge starts at 60, Challenge and Exam sorted, later-lesson relocation, lone guided practice repaired, worked examples carry figures.
- **Fixed on 9 November (James):** 24 worked examples in 12 Stage 4 booklets had their working in the prompt, so the figure printed after the working. The working now sits in `theorySolution`, so the figure prints between the question and the working (`review-tools/move-working-20261109/`). Results are in the section "Worked-example working moved" at the end of `docs/booklet-pedagogy-audit-v2.md`.
- Not committed: all audit saves, provenance and question-bank changes. The exam figure pass (paused 9 November, `docs/handoff-exam-pass-20261109.md`) is separate; its regroup candidates for 17 booklets are behind the live revisions.

## Stage 5 scope

- 77 live masters: `s5-core` 29 and `s5-path` 48. The list is in `.booklet-work/pedagogy-audit-v2/stage5-ids.txt` (one id per line); `stage5-ids.csv` marks which already have an audit record.
- `similar-triangles-v1` already has an audit record (earlier pilot). Check its revision before deciding whether to skip it.
- 76 of the 77 are in the programme ledger (`.booklet-work/end-goal-20261028/coverage-status.json`). **`logarithms-v1` is not**, so the runner refuses it without `--allow-non-master`. Ask James before using that flag.
- Unlike Stage 4, there is no `--stage4` shortcut: name the booklets with `--projects`.

## Rules that apply (all in AGENTS.md and the audit doc)

- Model: `claude-sonnet-5-5` medium for every audit call, exactly. Sol low for ratings of changed questions. At most three model workers per booklet.
- Verified findings apply automatically and leave an open "Applied automatically" comment. Comments left for James: at most 2–3 per booklet.
- Jump limit 15, routine ceiling 59, Challenge at 60 or above, Exam questions never in Challenge. NAPLAN-titled questions stay in practice.
- New content (backfill, bridges, worked examples, guided practice) is `claude-sonnet-5-5` only. A missing provider is a blocker, never a reason to substitute.
- Run every booklet render, save or driver from PowerShell. Git Bash finds the wrong `pdftotext` and the page check fails.
- The Studio server on 5173 may be serving James remotely. Reuse it, do not restart it, and never touch the tunnel.
- Other sessions share this checkout. Before editing `src/`, `scripts/` or `pedagogy/`, and before each save, check for running `lean-import`, `lean-review`, export, `--apply` and `check-feedback-pages` processes. Run only one batch process at a time.
- Write patch files with the Write tool, never a Bash heredoc (it halves backslashes).
- Look at every changed page before reporting. Metrics hid defects before.

## Steps

0. **Check the state.** `git status` for the paths you will touch, running processes, and that `.booklet-work/pedagogy-audit-v2/PAUSE` does not exist.
1. **Dry run, free.** From PowerShell:
   `node pedagogy/audit-v2-batch.mjs --dry-run --projects (Get-Content .booklet-work/pedagogy-audit-v2/stage5-ids.txt | Where-Object { $_ -ne 'logarithms-v1' }) -join ','`
   Read `batch-dry-run.jsonl`: holds, prompt sizes, calls and slot counts per booklet. Stage 4's overhead cuts (input size, call count) were tuned on Stage 4 booklets, so look for over-cap topics (the audit refuses a pedagogy prompt over 300,000 characters) and for booklets with no ledger row. Estimate cost at about $2.90 per booklet (Stage 4 average) and give James the total before spending.
2. **Pilot one mid-sized booklet** with `--apply`, for example `node pedagogy/audit-v2-batch.mjs --projects <id> --parallel 1`. Review all changed pages (`review-tools/review-run.ps1 ID`), run `review-tools/after-booklet.ps1 ID`, and check Challenge and Exam order, the open comment count and that no worked example carries its working in the prompt. Fix any shared cause in code, with a test in `tests/pedagogy-audit-v2.test.js`, before the batch.
3. **Run the batches** of about 20, in the background from PowerShell, with a Monitor on the log and 60-second waits: `node pedagogy/audit-v2-batch.mjs --projects <20 ids> --parallel 3`. The driver skips booklets already done and applies one at a time.
4. **After each batch:** `recount-20261108.mjs` then `remove-count-slots.mjs` (count rule, jump guard included), then the repair scanners (`repair-cloze-markup.mjs`, `repair-rowspacing.mjs`, `repair-tables.mjs`, `repair-columns.mjs` for 4→3 only). Each prints what it would change; add `--apply` only in a quiet window and render the result.
5. **Settle comments** as for Stage 4: `triage-comments.mjs ID`, `hold-causes.mjs ID`, `newq-classify.mjs`, `settle-comments.mjs`. Leave only comments that need James's decision.
6. **Report.** Write `docs/pedagogy-audit-v2-stage5-report-<date>.md` in the format of the Stage 4 report (cost, applied, comments and why, variations, top-up, repairs, issues). Add the run results to `docs/booklet-pedagogy-audit-v2.md`.

## Commits

Nothing is committed. When James asks, run `npm run repo:check` and commit with explicit paths: `pedagogy/audit-v2*.mjs`, `tests/pedagogy-audit-v2.test.js`, the audit docs and handoffs, and the changed booklet, provenance and question-bank files. Never use `git clean` or recursive deletes in run folders; they hold junctions to `node_modules`.
