# Handoff: pedagogy audit v2, Stage 4 campaign (8 November 2026)

Read first: `AGENTS.md`, `docs/booklet-pedagogy-audit-v2.md` (all 8 November sections, especially "Fixes from the first live batch"), `docs/booklet-standing-conventions.md`.

## State

- **Done (17 of 43 Stage 4 masters).**
  - Pilots: Rounding Decimals, Equations 1A (`solve-2-step-equations-v1`), Area 1 (`area-parallelograms-triangles-v1`).
  - Audited, applied, page-reviewed and repaired today:
    - area-circles-sectors-v1, angle-relationships-v1, angle-relationships-2-v1;
    - computation-with-integers-2-v1, comparing-fractions-v1, area-quadrilaterals-v1, computation-with-integers-v1;
    - data-analysis-2-v1, converting-fdp-v1, data-analysis-3-v1, data-analysis-v1;
    - expanding-brackets-v1, data-visualisation-1-2-v1, data-visualisation-1-v1.
- **Paused (26).** `.booklet-work/pedagogy-audit-v2/PAUSE` exists and stops new audits before any model call. The batch ledger (`.booklet-work/pedagogy-audit-v2/batch.jsonl`) shows them as `blocked` "Paused". They are:
  - factorising-expressions, formulas, introduction-to-algebra, length-2, length;
  - linear-relationships-2, linear-relationships;
  - operations-fractions-decimals-2, -3 and -v1;
  - percentage-increase-decrease-change-2 and -v1, percentages-problems;
  - probability, properties-of-geometrical-figures, pythagoras-theorem;
  - rates-2, rates, ratios-2, ratios;
  - simple-quadratic-equations, simplifying-expressions, solve-2-step-equations-2;
  - stage4-indices-2, stage4-indices, volume.

  All ids end in `-v1`. `review-tools/remaining.mjs` lists the Stage 4 masters not yet done.
- **Ledger.** The ledger shows `apply-failed` for six booklets whose apply I reran by hand after a fix. All six are saved: computation-with-integers-2, comparing-fractions, data-analysis-2, converting-fdp, data-analysis-3, data-visualisation-1.
- **Cost.** About $2.90 per booklet over 11 booklets (no cache writes). The first three cost about $5 each, including bug reruns.
- **Not committed.**
  - Changed: `pedagogy/audit-v2.mjs`, `pedagogy/audit-v2-apply.mjs`, `pedagogy/audit-v2-prompts.mjs`, `docs/booklet-pedagogy-audit-v2.md`.
  - New and untracked: `pedagogy/audit-v2-batch.mjs`.
  - Other files in the working tree were changed by earlier sessions, so commit with explicit paths, and only when James asks. Run `npm run repo:check` first. `tests/pedagogy-audit-v2.test.js` has one failure that predates today ("a drafted question takes the layout of a same-type sibling"), caused by the 8 November grid-layout rule.

## James's decision (8 November): implement autonomously, without asking

1. **Count parts, not questions.**
   - The core-type minimum (`LIMITS.minimumItems` 3, in `pedagogy/audit-v2-plan.mjs`; counting is in `pedagogy/audit-v2.mjs` around the "Topic-wide counts" code, `k.items`) counts each question as one item.
   - Count complete-task parts instead, with at most 3 per question. A scaffolded chain of steps in one problem counts as one.
   - Example: Algebra 3 Expanding Brackets, Exercise 1. Q1 "Complete the table" has 5 tile-diagram parts, yet the audit added Q2 and Q3 (`v2-cf2349-p5-practice-slot-1` and `slot-2`, type `expand-from-tile-diagram`, reason `type-count`). James judged them unnecessary.
2. **Group synonymous types by skill before counting.**
   - Extend the `3b-roles` call (`roleContract`) to also cluster types that use the identical method.
   - Examples: `decimal-to-simplified-fraction` and `decimal-to-fraction-simplify`; `percent-to-fraction` and `percent-to-simplified-fraction`.
   - Merge only when the method is identical. Record every merge in the report and in the "Practice counts" comment.
   - If the call fails, fall back to no grouping.
   - Today the cap held back 344 count questions over 202 types in 14 booklets (`review-tools/capped.cjs`). Much of that is synonym splitting.
3. **Recount today's 14 booklets with 1 and 2, without drafting.** Set `LIMITS.countSlotsPerExercise` (now 2) from the result. The proposal was 3 or 4, filling taught types with 0–1 items first.
4. **Remove redundant count questions already added.** Across the 14 booklets (and the pilots, if they have any), remove audit-added count questions (reason `type-count`) whose type already meets the minimum under the new count.
   - Use revision-checked saves (`publishProject` with `allowBank`, as the `review-tools/repair-*.mjs` scripts do).
   - Resolve their "Applied automatically" comments with a note saying why. Also update any summary comment that lists them.
   - Check bank links, ordering holds and neighbouring bridges first.
   - Render and look at each changed page.
5. **Resume the 26.** Remove `PAUSE`, then run from PowerShell:
   `node pedagogy/audit-v2-batch.mjs --projects <the 26 ids, comma-separated> --parallel 3`
   Run it in the background, with a Monitor on its log, and use 60-second waits.
   - The batch driver now runs applies one at a time. An apply refuses to start while another page check runs.
   - Do not run your own page checks while a batch apply may start; check for `--apply` and `check-feedback-pages` processes first.
6. **Review every finished booklet before reporting** (see below), fix shared causes in code, and repair saved booklets.
7. **When all are done,** report per booklet (cost, what was applied, what was left as comments and why, issues), and update `docs/booklet-pedagogy-audit-v2.md`.
   - Recurring defect to watch: worked examples drafted without a figure while their guided practice has one. The guard leaves these as comments. It recurred once, in Data Visualisation 1-2 p25.
   - James said: if it recurs, the workflow may need adjusting. The proposal is for the blind solve to also solve each new worked example from its prompt and figure, and redraft when it can't. Implement that if it recurs again.

## Review workflow per finished booklet

All tools are in `.booklet-work/pedagogy-audit-v2/review-tools/`. Run them from PowerShell, because Git Bash finds the wrong `pdftotext`.

1. **Summary.** `node summary.cjs <id>…` reports cost, applied changes, comments with reasons, and worked examples without a figure. `node costs.cjs <id>…` gives cost by stage.
2. **Figureless examples.** `node nofig.cjs <id>…` flags figureless worked examples whose prompt points at a diagram.
3. **Maths in sentences.** `node scan-text-in-math.cjs <id>…` finds sentences set inside maths.
4. **Old-builder blocks.** `node fix-built.mjs id1,id2 [--apply]` fixes blocks built before today's builder fixes: blanks inside Key ideas maths, and plain-heading tables without header style.
5. **Pages.**
   - Rasterise the run's student PDF: `python sheets.py <run>/pages/<id>-student-feedback.pdf <outdir> 55`. Use `python`, not `python -I`, because PIL is in the user site-packages.
   - Pick the pages holding audit blocks: `node audit-pages.cjs <runDir>` prints `PICK …`. Then run `python pick.py <outdir> <list>`.
   - Look at every picked sheet. Check that:
     - worked solutions are blue and operations red;
     - short parts sit in grids;
     - guided practice and Key ideas stay on one page;
     - new teaching sits after the existing guided practice and before Key ideas;
     - figures match their working;
     - no instruction was overwritten;
     - tables have the house style.
6. **Repair helpers.** Each has a usage line at the top:
   - `repair-j13.mjs` rebuilds a worked example's text from its accepted draft;
   - `repair-we-diagrams.mjs` restores worked-example figures from the accepted redraft;
   - `repair-rootprompt.mjs` converts a tab-row prompt to a table;
   - `repair-keyideas.mjs` rebuilds a Key ideas box;
   - `repair-unapply-theory.mjs` restores a block and reopens its comment;
   - `replay-sync.mjs` and `replay-order.mjs` replay an apply with current code (no save) and compare it with the live booklet;
   - `widen-tables.mjs` and `pad1.mjs` adjust table widths and padding.

## Open issues (not fixed)

- **Already in the live booklets, before the audit:**
  - Computation with Integers 2 has five short clozes.
  - Data Analysis 3 `p74-q5-block`'s arrangement names nodes that no longer exist.
- **Left as comments by the "did not print cleanly" retry.**
  - Removed or left as comments:
    - Data Visualisation 1: slots 8 and 9, upper and lower (graphs too tall), and slot 14;
    - Data Visualisation 1: j16 and its Key ideas box (off-palette figure colours);
    - Data Visualisation 1-2: two extensions (palette);
    - Data Analysis 3: slots 10 and 11 (slot 11 only shared slot 10's page);
    - Expanding Brackets: the p11 worked example (column overflow).
  - A drafting rule on figure size and palette would reduce these.
- **Angle Relationships 1 j13** has no figure. Left for James.
- **Minor style:**
  - sentences still in the maths font in Data Analysis 3 j5 and Angle Relationships 1 j11 part c;
  - the Expanding Brackets 2 Review box runs onto a second page.
