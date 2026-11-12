# Import v2 simplification plan (13 November 2026)

Status: **items 1, 3, 4 and 5 approved by James and implemented (13 November 2026); items 2 and 6–10 not started.** What was built and its replay results are in [import pipeline v2, Simplification](booklet-import-pipeline-v2.md#simplification-items-1-3-4-and-5-13-november-2026). Companion to the [Ch 1 case study](booklet-import-v2-ch01-efficiency.md).

| Item | Measured on replay (no model calls) |
|---|---|
| 1 Label placement | Ch 5 first-attempt TikZ: 140 collisions in 94 of 361 diagrams → 3 in 3; no label text or stroke changed; 690 s |
| 3 `finish --check` | Ch 5 at its first `finish`: 164 blockers in one 86 s pass (the run met them one at a time over 26 min); the targeted render now fails closed |
| 4 Config check | Ch 5's first config: 9 problems (no topic had `teachingPages`) |
| 5 One reference rule | Ch 5's `p50-q7` and `p58-q14` linked and recorded with no reword |

Goal: a 60-page, graph-heavy textbook chapter (about 150 blocks) in under 2 hours and at well under half of today's model cost, with the same fidelity and correctness.

## Summary

- **Cambridge X11 Ch 5 took 6 h 20 min to reach its first full export**, and it was still running when this was measured (13th `finish`, first five-edition export, visual review not started). 165 blocks, 374 TikZ diagrams (373 graphs).
- **Of the 380 minutes: 230 were model time, about 10 render time, about 90 coordinator diagnosis and repair, and 48 waiting on James** (six questions).
- **About 80 of the 230 model minutes were rework.** The ten sample pages were authored three times (page 9 five times) because of graph label collisions.
- **10 of the 12 `finish` stops before the first export were caused by rules, tools or config, not by defects in the booklet.** Only one stop (7 label collisions) was a real defect.
- **Removing every overhead found here gets a Ch 5-sized chapter to about 2 h 50 min, not 2 h.** One clean pass of today's model work is about 156 minutes at three workers. Reaching 2 h and half the cost also needs less authoring output per graph (item 2 below).

## Evidence and limits

- Runs read (nothing written to them): `cambridge-x11-ch05`, `mastering-maths-adv11-ch02`, `mastering-maths-adv11-ch01` under `.booklet-work/full-imports/`.
- Sources: `import-run-metrics.mjs`, `semantic-packets/attempt-events.jsonl`, `workflow/run-events.jsonl`, `lean-review/corrections.jsonl` (661 rows), `lean-review/calls/`, `finish-*.log`, `sample-*.log`, `repairs/`, `label-retry.json` files, the git log, and the Ch 5 session transcript (for question wait times).
- No model calls were made. Scratch scripts stayed outside the repo.
- **Not measured:** Ch 5's export, visual review and repair loop (still running). Figures for that stage come from the Ch 2 pilot.
- Every saving below is an estimate unless it says "measured".

## Ch 5 timeline (local time, 12 November)

| Time | Stage | Model calls | What stopped it | Fix | Fix time |
|---|---|---|---|---|---|
| 17:33–18:13 | Prepare, inventory | 38 | 4 pages inventoried headings as teaching entries | Page note, 4 regenerations | 4 min |
| 18:13–18:48 | Sample authoring 1, export 1 | 10 | 57 of 157 graphs fail the label check; page 59 validation | Local patch (p59); placement rules added to page notes | 10 min |
| 18:50–19:44 | Sample authoring 2, export 2 | 11 | Still 52 of 157 collisions; page 9 structure wrong twice; export 2 fails the 3D solid audit on a 2D curve | Page 9 re-authored twice; visibility review recorded | 54 min |
| 19:46–20:16 | Waiting, then code | 0 | James asked (25 min); author label retry written (`f64a0a7d7`) | Code change 1 | 30 min |
| 20:16–20:46 | Sample authoring 3 | 8 + 7 label retries | — | — | 30 min |
| 20:46–21:05 | Sample exports 3–5, review | 57 | Export 3: collisions and a 69 mm footer overflow; retry had emptied a printed −3 label | 15 hand label patches; retry guard (`cd2a868e7`, code change 2) | 19 min |
| 21:05–21:35 | Sample findings | 0 | 13 findings: 8 label, 3 base-graph placement, 2 false verdicts; James asked (13 min) | `resolve-sample` written (`7948c1aec`, code change 3) | 30 min |
| 21:35–22:45 | Bulk authoring, assembly | 34 + 11 label retries | 5 assignments failed validation; assembly failed once | 5 local patches (no model call), page 51 re-authored | 10 min |
| 22:47–23:13 | `finish` 1–5 | 0 | C9 (4 blocks); 7 label collisions; no teaching pages on any block; 8-image limit; absence claim beside key references | 165-block repair; James asked (7 min); topic scoping (`410a12865`, code change 4) | 26 min |
| 23:13–23:28 | Content review | 74 | — | — | 15 min |
| 23:28–23:53 | `finish` 6–12 | 7 | 2 failed blocks; C10 twice; 4 label repairs on one graph; 261,646-character prompt; stale review | 3 questions to James (3 min); oversize reason (`338bf9f3e`, code change 5); follow-up record (`d597f5566`, code change 6) | 25 min |
| 23:53– | Export 1 | — | Student edition: 26 DOM issues (pre-render gate reported none) | running | — |

## 1. Where the time went

| | Ch 5 (to first export) | Ch 2 (complete) |
|---|---|---|
| Elapsed | 380 min | 158 min |
| Model active | 230 min | 71 min |
| Render and export | about 10 min | about 9 min |
| Waiting on James | 48 min (6 questions) | not measured |
| Coordinator diagnosis, repair files, code | about 90 min | about 78 min including waiting |

Model work in Ch 5, by stage (worker-minutes are summed over the three workers):

| Stage | Calls | Worker-min | Input / output tokens | Of which rework |
|---|---|---|---|---|
| Inventory | 38 | 109 | 1.93 M / 309 K | 4 calls |
| Authoring | 55 | 424 | 5.58 M / 1.11 M | sample rounds 1 and 2: 21 calls, 162 worker-min, 2.04 M / 476 K (43% of author output) |
| Author label retries | 18 | 31 | 0.47 M / 46 K | all (replaced by item 1) |
| Sample review | 57 | 10 | 2.05 M / 11 K | — |
| Content review | 81 | 47 | 4.61 M / 98 K | 7 re-review calls |

- Authoring is 72% of output tokens. Content review is the largest input (57 K tokens per call, 32% cached, 2.2 blocks per call against a design of 4).
- One clean pass of this work is about 468 worker-minutes, so about 156 minutes at three workers, before any render or repair.

## 2. Which gates earned their place

"Unique" means nothing later would have caught the defect, or would only have caught it at five-edition cost.

| Gate | Ch 5 / Ch 2 result | Verdict |
|---|---|---|
| Diagram label check | 57/157, 52/157, then 72/337 first-pass graphs; 7 more at `finish` | **Keep.** Unique and high-yield. It tests overlap only, with no clearance, so the reviewer still found 6 labels touching curves or axes. |
| Author label retry (model) | Fixed 69 of 72; emptied one printed label | **Replace** with deterministic placement (item 1). |
| Early sample export | Found a 69 mm footer overflow and missing editions | **Keep** the render and its automated checks. |
| Sample review (model) | Ch 5: 13 findings = 8 label, 3 base-graph placement, 2 false. Ch 2: both findings were label collisions | **Shrink.** Label findings move to the checker. Review student and worked pages only (short-answer graphs repeat in worked). |
| C1, C2, C3, C7 | Fixes, not gates (Ch 5: 24 headings, 4 joins, 8 worked starts) | **Keep.** |
| C6 and C10 | Same rule at two times; also repeats the bank's dependency check. Ch 5: 2 blocks, 2 stops, 2 questions to James | **Merge** into one check in the dry-run, with follow-ups recorded automatically. |
| C8 nested questions | No hit in Ch 5 (author validation caught page 9 first) | **Keep**, inside the dry-run. |
| C9 answer-page search | Ch 5: 4 hits, all artefacts of the rule. Ch 2: 5 hits from a real config error | **Move** to the config check (item 4). |
| Pre-render gate | Ch 5: reported nothing; export 1 then had 26 DOM issues in the student edition | **Keep but fix.** It duplicates the export's DOM check and is only worth having if it fails closed. |
| Content review | A key error, a wrong crossing claim, incomplete answers, 7 primary-skill changes, 168 ratings | **Keep.** Unique. |
| Structural preflight (`validateImport`) | Runs after content review | **Move** into the dry-run, before any model call. |
| Solid-visibility audit | Ch 5: false positives only ("No supported solid topology" on 2D graphs); failed sample export 2 | **Scope** to non-graph diagrams. |
| Rating coverage | Passed | **Keep.** Deterministic and cheap. |
| Visual review | Ch 5 not yet run. Ch 2: 244 inspections, 23 needs-change, 3 of them false | **Keep.** |
| Stamp carry | 0 rows reused in all three runs | **Delete** (pixel retention does all the reuse). |

## 3. Rule conflicts

The six known ones are confirmed in the logs. Others found:

| # | Conflict | Seen |
|---|---|---|
| 7 | The one-rater rule needs a rating patch from the reviewer for every block, and each is logged as a "correction" (336 of 661 rows) | Hides the reviewer's real content corrections |
| 8 | A reviewer may patch diagram `/code`, but the label check runs before review, so a reviewer edit is never checked until the next `finish` | 23:28 edit → collision → 4 hand repairs |
| 9 | A re-review sends the accepted snapshot as well as the current block, which doubles the prompt and breaks the 200,000-character limit for large blocks | Review Q20: 261,646 characters |
| 10 | A visibility review is bound to the diagram's code hash, and label repairs change the code | Re-record after every label edit |
| 11 | The label retry may move labels but had no rule to keep them | A printed −3 was emptied |
| 12 | A sample is accepted only by a zero-finding review, but a false verdict could only be cleared on `finish` exports | `resolve-sample` written mid-run |
| 13 | Bank-ready rewording (before review) removes a source reference that the reviewer then needs as evidence | `p51-q11` failed review |
| 14 | Topic `teachingPages` are optional in the config but required on every practice block by content review | 165-block repair |
| 15 | "Freeze `scripts/` during an import" against six code fixes needed to finish this one | All six commits |
| 16 | The export budget counts exports, but most stops happen before any export | 12 `finish` attempts, 0 exports used |

## 4. Why `finish` finds blockers one at a time

`finishCandidate` (`import-finish.mjs`) returns at the first failing stage, and `practiceContentEvidence` (`lean-review.mjs`) throws on the first block. The order is: structural → labels → evidence → content review → validation → layout → pre-render → export. Each stage sees the candidate only after the one before it passes.

**Proposed: `lean-review.mjs finish --check`**, with no model call, no save and no lock on review state. It collects every blocker from every stage and prints one list:

1. Config schema (item 4).
2. Evidence for every block: source and teaching references, answer references or a topic-scoped absence claim, image count against the batch limit, prompt size against the review limit.
3. C8, C9 and the merged question-reference check.
4. Lint and `validateImport`.
5. Label check with clearance on every TikZ diagram.
6. Solid audit on non-graph diagrams.
7. Targeted render of risk blocks, failing closed when Studio is unreachable.

`finish` runs the same function first and refuses to start a model call while it reports anything. Ch 5 would have had one stop with about 180 lines, not five stops over 26 minutes before review.

## 5. Graph labels

| Approach | Measured on Ch 5 |
|---|---|
| Author alone | 57 of 157 fail (36%) |
| Author with placement rules in page notes | 52 of 157 (33%); 72 of 337 (21%) across the final pass |
| One model retry per assignment | 69 of 72 fixed; 18 calls, 31 worker-min; 1 label emptied |
| Hand repair after that | 15 patches in the sample, 7 at `finish`, then 4 on one graph after a reviewer edit |
| Reviewer findings the checker missed | 6 (labels touching a curve or axis) |

Total cost of the label problem in Ch 5: about 150 of the 380 minutes (82 re-authoring, 25 waiting, about 30 code, about 15 hand repair), and 43% of author output tokens.

**Deterministic pass (proposed).** For each label the checker flags: take its rendered box, try 8 compass positions at 2 or 3 offsets around its anchor, score each against the sampled stroke points and the other label boxes (both already computed by `inspectDiagramLabelLayout` in `src/lib/diagram-typography.js`) with a clearance margin, and write the best position back to the node's placement option. Nothing else in the code changes, and the label text is compared before and after.

- **Effort:** about 2–3 days: the placer (1 day), the TikZ writer for `node[...] at (...)` and `\foreach` labels (1 day), tests and a replay (0.5–1 day).
- **Expected collision rate:** unmeasured. My estimate is under 3% (about 10 of 374), the crowded cases where every side is blocked, such as three curves through one intercept. Those need a leader or a rescale and go to a person.
- **Test with no model call:** replay on the stored first-attempt code of the 129 graphs that failed in Ch 5. Pass if at least 90% clear with every label text unchanged.

## 6. Config fields that are silently required

| Field | Used by | When it fails today |
|---|---|---|
| `topics[].teachingPages` | authoring context and content review | `finish` 3 (165-block repair); authors also never saw the teaching pages |
| `topics[].teacherPages` | C9 and review evidence | `finish` (Ch 2: 5 blocks; Ch 5: 4) |
| `topics[].start` / `end` | topic lookup for both | silently no topic |
| `classificationSkillIds` | author prompt | unknown IDs found at review |
| `pageEvidence` notes | inventory and authoring share one field | stale inventory notes reach authors |

**Proposed check at `booklet:prepare` and again at the start of `inventory` and `author`:**
- every selected page belongs to exactly one topic;
- every topic of a textbook run has `teachingPages` (or `embeddedContext: true`) inside the prepared context pages, and `teacherPages` inside the prepared answer pages;
- each topic's evidence fits the 8-image limit;
- every skill ID exists in `data/skills.json`.

It prints every problem at once and makes no model call.

**Open question for the booklet:** Ch 5's worked solutions were authored without the teaching pages. Content review later checked them against those pages, but the method was not re-authored. Worth a spot check before acceptance.

## 7. Evidence binding that forces re-work

| Binding | Covers | Presentation-only edits that break it |
|---|---|---|
| `contentHash` (content review) | the whole block except `answerSpaceMm` | TikZ label positions, row spacing, `\tfrac`, joins |
| `reasoningTaskHash` (rating) | the whole question | the same |
| Visibility review | diagram code hash | any label move |
| Label check memory | diagram code hash | (correct: it must re-run) |
| `finish` input hash | the whole candidate | any edit outside `repair` |
| Block stamps | block JSON and every setting | one global setting re-stamps every block |

**Proposed exemption, one rule:** hash a diagram for review, rating and visibility by its code with label placement options normalised away (anchor side and offset only; label text, coordinates of points and every path stay in the hash). An edit made by the deterministic placer then leaves the review, the rating and the visibility record current. Nothing else is exempted now. The Ch 1 finding that 86% of re-reviews followed presentation-only edits stays with James's 12 November decision to keep that gate.

## Ranked plan

Savings are for a Ch 5-sized chapter and are estimates from the measurements above.

| # | Change | Problem and measured cost | Saving | Risk | Test that nothing is lost |
|---|---|---|---|---|---|
| 1 | **Deterministic label placement** with a clearance margin; delete the model label retry; reviewers report label positions, never patch them | 150 min; 2.5 M input and 0.52 M output tokens; 26 hand patches; conflicts 8, 10, 11 | about 130 min; a third of author output | A placer bug moves a label to the wrong feature | Replay on 129 stored failures; label text and all paths identical; checker clean; visual review unchanged |
| 2 | **Function-graph template** built on `src/lib/graph-model.js`: the author returns functions, window, marked points and asymptotes, and the script draws and labels it | 373 hand-written TikZ graphs; authoring is 72% of output tokens and 424 worker-min | unmeasured; needed to reach 2 h. If half the graph output goes, about 40 min and 0.3 M output tokens | Coverage: source graphs the template can't express fall back to TikZ | Rebuild Ch 5's graphs from specs and compare rasters with the accepted TikZ; report coverage before adopting |
| 3 | **`finish --check` dry-run** (section 4) | 12 stops before export 1; 51 min of stops outside review | about 35 min | Low: it only reports | Replay on the Ch 5 `finish` 1 candidate: must list all blockers from stops 1–5 and the prompt-size stop |
| 4 | **Config schema check** at prepare (section 6) | 165-block repair, 2 stops, authors without teaching pages | about 10 min, and a fidelity gap closed | Low | Ch 5 and Ch 2 original configs must fail with the fields named |
| 5 | **One question-reference rule**: merge C6 and C10; a source follow-up to an earlier question in the same section is recorded by the script; rewording only when the target isn't in the booklet | 2 stops, 2 questions, 3 re-review calls, about 20 min | about 20 min | A follow-up reaches the bank as one; the bank check already handles that | Ch 5's two blocks pass with no reword; `check-question-dependencies --strict` unchanged |
| 6 | **Label-placement exemption** in the review, rating and visibility hashes (section 7) | Stale reviews and re-recorded visibility after label moves; the Q20 oversize chain (17 min, 1 code change) | about 15 min, 5–10 calls | A real change hidden as "placement" | Hash test: any change to text, a coordinate or a path changes the hash |
| 7 | **Re-review sends the changed fields**, not both snapshots | 261,646-character prompt; a mid-run code change | removes a stop | Reviewer loses context | Q20 prompt under 200,000 characters with the same evidence |
| 8 | **Solid audit skips graphs** | 1 failed sample export; visibility records for 2D curves | about 5 min | A 3D figure tagged as a graph | Audit still runs on every non-graph diagram; tag is checked against the code |
| 9 | **Sample review on student and worked only** | 57 calls, 2.05 M input | about 0.7 M input | A short-only defect waits for `finish` | Count short-only sample findings in Ch 1, 2, 5 (Ch 5: none that the checker with clearance would miss) |
| 10 | **Delete stamp carry; log ratings separately from corrections; pre-render gate fails closed** | 0 reuse in three runs; 336 rating rows crowd the correction log; 26 DOM issues reached export 1 | clarity; one export | Low | Existing visual-evidence tests; a skipped render blocks |

**Projected result for a Ch 5-sized chapter:**

| | Today | Items 1, 3–10 | Plus item 2 (if it halves graph output) |
|---|---|---|---|
| Elapsed to deliverable | over 6 h 20 min | about 2 h 50 min | about 2 h 10 min |
| Output tokens | 1.53 M so far | about 1.0 M | about 0.7 M |
| Input tokens (before visual) | 14.2 M | about 11 M | about 10 M |

- **2 hours** therefore needs item 2 to work, and one more cut in model time. The candidates are content-review batching (2.2 blocks per call against 4; cause not yet established) and inventory cost (109 worker-min).
- **Half the cost** is reachable on output tokens with item 2. Input tokens need the content-review prompt trimmed as well (cache-friendly order, four blocks per call).

## Is about an hour right for `finish`? (13 November 2026)

**Short answer: no.** About an hour is what today's tooling needs for a Ch 5-sized chapter even with no stops. That floor is inflated by slow exports. A clean `finish` for 165 graph-heavy blocks should take about 30–40 minutes.

**Measured (from `finish` logs, call folders and export reports):**

| | Ch 2 (97 blocks, 247 export pages) | Ch 5 (165 blocks, 574 export pages) |
|---|---|---|
| `finish` wall clock | 52 min to deliverable | 147 min (22:47–01:14), **not deliverable**: export budget used, export 3 died in with-worked ("Mathematics failed to render") |
| Model time | 20 min (content 12, visual 7, shading 1) | 33 min (content 25 incl. 25 re-review calls, visual 8) |
| Exports | 4 × 1.5–2 min | 8.0, 11.9, 12.7 min (32.6 in all) |
| Stops, coordination, waiting | about 25 min | about 81 min: pre-review stops 26, post-review stops 25 (items 3–5 now remove most of both), repair writing 12, the rest between attempts |

**Where a clean Ch 5 `finish` goes with today's tooling:**

| Step | Minutes |
|---|---|
| Content review | 15 |
| Export 1 | 8–12 |
| Visual review | 8 |
| One repair round (coordinator) | about 10 |
| Re-review | 3 |
| Export 2 | 8–12 |
| Visual review of changed pages | 2 |
| **Total** | **55–65** |

Content and visual review are model time under fixed settings (Sol low, three workers) and look right: 0.08–0.09 min of first-pass content wall time per block on both chapters.

**Why Ch 5's exports are 6–8× Ch 2's for 2.3× the pages:**

| Cause | Measured | Proposed cut | Expected export time |
|---|---|---|---|
| Cold TikZ compiles in the frozen export runtime | Export 1: short compiled 205 diagrams (134 s). Export 2: with-worked compiled 368 (251 s). The runtime reads only the shared `.booklet-work/render-cache` (69 entries), never the SVGs Studio's label check and placement have just compiled. | Publish the label check's compiled SVGs to the shared render cache (`publishBrowserDiagrams` in `render-cache-server.mjs`). | −2 to −4 min per export |
| Pagination per page | short 106–218 s for 40 pages (2.6–5.4 s/page); worked 134 s for 139 pages. Ch 2: 0.3–0.4 s/page. | Profile `paginate/compose.mjs` on Ch 5's short edition (graph-heavy answers, many measured diagrams per exercise). Not yet diagnosed. | −3 to −4 min per export if it reaches Ch 2's rate |
| Exports printed with known DOM failures | Export 1's 216 mm footer overflow on `p51-q10` (and column overflows on `p56-q1`, `p61-q18`) printed again in export 2. The pre-render gate had crashed on the 3D audit and passed. | Done on the branch: the gate fails closed (item 3). | one fewer export (12 min) |
| A block over the prompt limit stops every re-review | Q20 (`p61-q20`) needed a manual `content --oversize-reason` run before `finish` twice (23:45, 00:26). | Let `finish` take `--oversize-reason --oversize-blocks` and keep them in its state (small), or plan item 7. | one stop per re-review |

**With those cuts:** content 15 + export 4 + visual 8 + one repair round about 15 (coordinator, re-review, export 4, changed pages) = **about 40 minutes**. About 30 when the fail-closed gate and placement remove the repair round.

## Decisions for James

1. ~~Approve items 1 and 3–5 for implementation first?~~ **Approved and implemented (James, 13 November 2026).**
2. Item 2 (graph template): run the no-model coverage replay on Ch 5 before deciding?
3. Item 5: accept source follow-ups as printed, recorded by the script, instead of rewording before review?
4. Item 6: allow label placement to leave reviews and ratings current?
5. Item 9: drop the short edition from the sample review?

Kept as decided: Sol low for review and rating, Sol medium for authoring, at most three workers, Studio on 5173 reused, no pedagogy at import.
