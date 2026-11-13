# Handoff: import v2 simplification (13 November 2026, updated 08:00)

For the next session that continues the [import v2 simplification plan](booklet-import-v2-simplification-plan.md). Read AGENTS.md first.

## Where things stand

- **Items 1, 3, 4 and 5 are merged to master** (`ec8de9c9d`). The `import-v2-simplify` branch and its worktree are removed. After the merge the nine affected suites gave 143 pass, 0 fail, 2 skipped, and `repo:check` passed.
- **Two `finish`-time cuts are committed:**
  - `finish --oversize-reason --oversize-blocks` keeps the exemption in its state (`7c5c04d11`);
  - the label check publishes its compiled diagrams to the shared render cache (`d47629535`).
  - Details and measurements: [import pipeline v2, `finish` time](booklet-import-pipeline-v2.md#finish-time-13-november-2026).
- **Pagination wait fixed** (James approved). `TikZ.flushPending` now wakes when a job finishes instead of sleeping 200 ms per check. Ch 5's worked pagination fell from 80 s to 19 s, and the diagram cache version is unchanged.
- **Studio on 5173 stopped at about 07:33** while this work was running, cause unknown. It was restarted with the `mathsmap-dev` launch configuration (diagram fingerprint unchanged, `0c360a2a…`). The tunnel was not touched.
- **Plan items 2 and 6–10 have not been started.** Decisions 2–5 in the plan doc are still open for James.

## Mastering Ch 3 pilot (`mastering-maths-adv11-ch03`)

Results and the open items are in [import pipeline v2, Ch 3 pilot](booklet-import-pipeline-v2.md#mastering-adv-11-ch-3-pilot-13-november-2026-after-the-simplification-and-finish-time-changes).

**Where it stands:** deliverable after export 4 (`streamlined-exports/4`, James approved the 4th): 297 pages accepted, no findings, no blockers. Not yet published to Studio or the bank; that is James's call. The readiness presentation checks that cost the 4th export now run in `finish --check` and the pre-review gate.

## Next (ranked)

1. **Measure on the next real import** with `import-run-metrics.mjs`: export compiles (`timings.tikzCompiles` per edition in the export's `report.json`) should be near zero after the label check, and `timings.paginationMs` close to Ch 2's rate.
2. **Item 8 is done** (solid audit skips tagged 2D graphs). **Item 2's coverage replay is done**: 80% of Ch 5's graphs (66–71% on Ch 2 and Ch 3) map to a function/conic/region/parametric spec, about 80% shorter than the TikZ; hand-sketched `controls` curves are the main gap. Building the template is James's decision 2.
3. **Wait for the next import's measurements** before items 6, 7 and 9; fold item 10 into whatever next touches those files.

## Working notes

- **Scratch profilers** used for the diagnosis are in the 13 November session's scratchpad. To rebuild one:
  - load a candidate with `routeCandidateProject`;
  - open `#/booklet?stage=projects&project=ID` with `settings.flowEdition` set;
  - wait for `.flow-document[data-pagination-state=ready]`;
  - read `dataset.paginationMetrics` (`assetsMs` is the settle wait);
  - to try a `src/` change without editing, serve a patched `/src/lib/tikz.js` with `page.route`.
- **Run-folder hygiene:** read run folders only, and never clear them recursively.
- **Studio** on 5173 is shared with James and other sessions: reuse it, never restart it while it runs.
