# Booklet Studio implementation

## Cleanup

Removed unreferenced MasteryControl and BookletQuestion components, the unused pilot bank loader/recipe, the disconnected selected-node AI seam, an unused inline-type constant, and an editor snapshot with no application consumers. Kept legacy storage and import/migration adapters. The documented PDF export command now uses the current project surface, accepts --project-id or a read-only --project preview, and supports --mode student|short|worked.

Source booklets, import evidence and bank records are preserved. Subsequent entries record implementation and verification, not human publication approval.

## Implemented workspace and contracts

- Standalone MathsEditor 1.0.0 now supports structured prose/maths, paragraph controls, tables and cell spans, images with crop/size/placement, reusable theory arrangements, history and rich clipboard handling. MathsMap uses a thin adapter and a hash-pinned copy. See [the integration contract](maths-editor-integration.md) for API, storage and current limits.
- The review workspace keeps source and reconstruction together, supports selected blocks and question parts, and records teaching atoms independently of public skills. The inspector includes mappings, prerequisites, rationale, diagrams, flags and four independent approval categories.
- Reviewed theory splits/merges and question-part grouping retain identities and source lineage. Changes reopen affected approvals. Project saves reject stale revisions and retain prior records under `.revisions`.
- AI requests create stored proposals with base revision, exact before/after values, target IDs and rationale. Individual decisions, dependent acceptance units and guarded batch undo preserve unrelated subsequent edits. Generated questions remain in a review pool until approved. Live provider generation is not established by the fake-provider regression test.
- Assembly accepts editable teaching chunks and counts, syllabus scope and explicit extensions, prerequisite constraints, archetype/tier coverage exceptions, optional mastery, cumulative practice and challenge sections. It keeps whole question trees and rekeys internal dependencies and diagram overlays together. Reused questions carry a source revision and a local snapshot.
- Current bank loading and all three PDF modes use the project workflow. Bank publication remains explicit and requires current reviews. No bank records or public graph nodes were published during implementation.

## Calibration evidence

Read the complete extracted text of the percentage (61 pages), index-laws (63 pages) and non-right-angled-trigonometry (59 pages) exemplars, together with existing principles and relevant prior proposal decisions. The [calibration findings](booklet-calibration-findings.md) record teaching grain, essential-feature examples and suspected source mistakes. Extraction omits some image-only content; complete visual calibration of all 183 exemplar pages remains outstanding. Suspected source mistakes were not silently corrected in the originals.

## Held-out pilot and measurements

The complete Linear Relationships student import has 93 pages in 31 transcription tasks. Nine tasks produced result files (27 pages); the run stopped on the AGY provider's individual quota. The exact lane remains resumable without discarding completed evidence:

```powershell
node scripts/booklet/transcription.mjs run --run-id linear-relationships-studio-v1 --lane exact --concurrency 3
```

The small pilot uses source pages 13–18 and preserves student/teacher sources and prior project revisions. All six student pages were visually compared; teacher answers were compared by equations and question identity where supplied. Answers absent from teacher evidence were independently evaluated, with that distinction retained in pilot metadata.

Source project: `project-linear-relationships-studio-sample-v1`. Assembled draft: `project-linear-relationships-assembled-pilot-v1`. Both appear in the project list. The current assembly selects 18 questions: 16 MathsMap and two imported. Cumulative practice uses one imported group and one MathsMap question after rejecting repeated table exercises. It reports 21 review/coverage gaps, so this is a workflow test draft rather than a completed teaching booklet. Source question 2 continues from page 17 onto page 18; those two blocks were excluded from this small assembly pending joint grouping.

Recorded corrections: 52 field/layout corrections across six source pages (8.67/page, 4.33/source question), plus 12 diagram replacements. Later typography and mapping operations are in proposal history but not included in those correction counts. These are agent interventions; human hands-on minutes were not recorded and are shown as unknown. The 100% accepted-operation rate describes agent-authored repair/audit proposals, not a measured acceptance rate for fresh AI candidates. Failed export attempts are not AI retries.

The most visible pilot bottleneck is transcription/layout repair, followed by archetype coverage. Prioritise robust cross-page question grouping and diagram/table fidelity before scaling imports. Fresh candidate generation and human timing should be measured after the coverage audit is accepted.

## Verification

- `npm test`: 361 passing tests, including revision conflicts, safe undo, splits/merges, rich storage, prerequisite-constrained assembly and pinned migrations.
- `npm run build`: passed; existing bundle-size advisory remains.
- `node scripts/booklet/check-document-editor.mjs`: passed browser editing, history, table, image, clipboard, reload, read-only and print checks.
- `node scripts/booklet/check-studio-workflow.mjs`: passed browser integration, save/reload, proposal decisions/undo, real bank loading, assembly preview and print-control checks with intercepted project writes.

## Remaining acceptance work

Complete the full import once provider access permits; reconcile cross-page continuations; visually review all calibration pages; resolve coverage and pedagogical decisions; exercise live AI gap generation and conflict review; record a human-led end-to-end session. True images inside a prose run and smoother merged-table manipulation remain editor work. Full completion of the user's plan is not claimed.

## Small-pilot export inspection (5 September 2026)

Final assembled draft revision 5 exported to `.booklet-work/studio-pilot/reviewed-student.pdf` (13 pages), `reviewed-short.pdf` (23 pages), and `reviewed-worked.pdf` (23 pages). All distinct page content was visually inspected; unchanged page bodies were matched pixel-for-pixel against inspected renders, excluding the footer strip. `export-review.json` records PDF hashes and footer checks; `page-comparison.json` records equivalent page bodies.

The inspection found and fixed unstarted lazy inline diagrams, duplicate table exercises across Markdown/TeX formats, inconsistent example numbering, unnecessary repetition of solved theory examples in answer appendices, and narrow worked-answer columns. Export now starts every print diagram, rejects an empty print view, and refuses page or diagram rendering errors. The Print button also waits for diagram completion.

No observed practice-answer leakage, clipped mathematics or missing diagrams remains in these small-pilot exports. Teaching worked examples are deliberately visible in the student version. The draft still has sparse section-per-page pagination, repeated example/solution labels, and 21 explicit review/coverage gaps. Complete pedagogical approval and full-booklet verification remain open.

## Continuation follow-up

The inspector now offers **Join next question continuation**, including across section/page boundaries. The proposal keeps both original root groups, part labels, dependencies and diagrams beneath one combined question. It preserves both source block identities in lineage and reopens the changed reviews. Undo refuses changes to either affected section and preserves edits elsewhere. A regression test covers cross-page dependencies and conflict-safe undo.

Source pilot revision 9 contains a pending, concrete proposal joining page 17 question 2 and its page 18 continuation. The inspected assembled PDFs remain pinned to source revision 8 and assembled revision 5; adding the proposal has not changed their content.

The full import was resumed after the quota reset window. An initial sandbox attempt could not authenticate over the network; it was stopped and restarted with approved network access. The resumed job skipped all nine completed tasks. Check its ledger before resuming again, to avoid duplicate active jobs.

## Transcription performance investigation

See [AGY transcription performance](agy-transcription-performance.md). The failed tasks made 108–135 generation requests each; task 013 also searched drives for its relative task filename. The driver now supplies absolute paths, records agent duration/conversation identity/result bytes, reports elapsed time for missing-result failures, and distinguishes response timeouts from OAuth failures. A minimal response took 8.2 seconds including startup; a tiny file task with the fixed pointer took 17.2 seconds. Full transcription speedup has not yet been measured. All 364 tests pass. Existing run prompts/results, model and concurrency were preserved.

Prepared an isolated pages 37–39 benchmark with approximately 97 KB of text/schema/prompt/index material plus page images and selected original assets. Added content-based teacher retrieval, offset-preserving Word excerpts and pre-execution integrity checks. All 367 tests pass. Automatic approval review blocked the Gemini invocation pending explicit approval to send the booklet images and teacher-answer excerpts. No transcription is currently running; 39/93 full-import pages have result files. Speed and fidelity of the bounded execution remain unmeasured.

After explicit user approval, the benchmark ran and timed out after 491.116 seconds without a result file. It made 43 generation requests and reported 53,533 thinking tokens out of 57,350 output tokens. The absolute pointer worked, but repeated asset/Word searches continued. Fixed future packet asset selection to include nearby occurrences outside excerpt boundaries; preserved the benchmark packet unchanged. All 368 tests pass. The full import remains at 39/93 pages and is not running. See the performance report for counts, limitations and the next controlled experiment.

Added optional, validated AGY reasoning effort and ledger recording, plus recovery of wrapped-table image links omitted from the old occurrence index. Prepared a corrected packet with five visually checked graph/scaffold assets and a source-identity guide. All 370 tests pass. Automatic approval review rejected the expanded packet invocation because the prior approval covered only one original-packet benchmark; narrowed the pending payload to the verified images in `task-013-verified-low-v3`. Neither new packet has been executed. Explicit approval for this corrected payload remains required; the full import remains at 39/93 pages.

After user approval, corrected an AGY model/effort conflict (zero-token startup failure) by resolving `gemini-3.8-flash-high` plus explicit low effort to the listed `gemini-3.8-flash-low` ID. The actual low-reasoning benchmark still timed out at 491.181 seconds without output: 57 generation requests, 5,925 output tokens, zero reported thinking tokens. Tool records show repeated evidence extraction, schema searches outside the packet and failed Node/PowerShell commands. Future packets now expose readable Markdown evidence rather than directing the agent at JSON-escaped excerpt strings. All 372 tests pass; no benchmark result was available for fidelity review or adoption. Full import remains paused at 39/93 pages. See the performance report for the exact evidence and remaining limitation.

Implemented a direct-input runner: task/text/schema travel over stdin, an explicitly selected reader profile provides only image viewing plus AGY's internal task-status tool, and Node saves/validates the final JSON. Fixed profile discovery using AGY's documented user-level profile directory; the workspace-level copy was ignored and has been removed. Discovered that init.tools reports the global registry and that the CLI schema flag repeats synthetic stream responses; the runner verifies the exact installed profile, monitors actual tools and validates output locally. A synthetic transport probe passed in 7.354 seconds, one turn, no tool calls. All 378 tests pass. The real `task-013-direct-v6` test uses the same approved v3 source evidence, but automatic approval review rejected the invocation pending explicit transmission approval. No new transcription is running; full import remains at 39/93 pages. See the performance report for the exact command and limitations.

After the user approved the direct-input benchmark, the first attempt canceled on image-read permission after 12.582 seconds. Enabled process-local headless approvals only for the hash-verified restricted reader profile and retried the same packet. **The three-page draft returned in 57.989 seconds**, versus the previous 491.181-second timeout without a result. It used seven image reads, zero reported thinking tokens and no shell/search/editing calls. All 26 short answers match the independent reference, but the candidate failed fidelity checks: composite diagrams are duplicated/misplaced, answer dots and a bare TeX spacing command render poorly, introductory/closing prose sits in ignored fields, one worked answer names an incorrect coordinate, and one response table has an extra column. Inspected all three rendered source-page containers; these are not validated PDF exports. Added rejection of ignored worked-example prose fields and a regression test. **379 tests pass.** The raw candidate, timing ledger and review screenshots are retained in `task-013-direct-v6`; it was not adopted. Full import remains paused at 39/93 pages, concurrency three. The next measured stage is contract/layout repair using this faster transport, not increased worker count.

The user then requested **high effort**. Added explicit manifest-pinned effort selection to direct packet preparation/execution, with a regression test proving `--effort high` reaches the CLI alongside `gemini-3.8-flash-high`. Ran `task-013-direct-high-v7`: identical evidence, schema and prompt except execution paths. It returned in **152.404 seconds**, using eight image reads and 33,763 thinking tokens. All 26 short answers match the reference. High fixes the worked-answer coordinate error and answer-rule rendering, but preserves duplicated graph arrangements and invisible introductory/closing prose, and introduces four malformed Markdown tables (17m–p). Inspected all three rendered containers and extended validation to reject the newly observed ignored prose fields. The result remains an isolated rejected candidate; no full-import adoption. **380 full-suite tests passed**, and all eight targeted tests passed after the guard extension. See the performance report for the complete Low/High comparison. Continue with high effort as requested, focusing next on the content contract and diagram/table repair; full import remains paused at 39/93 pages.

## Continued transcription and local repairs

Added source-image regions to question diagrams: original image bytes and occurrence identities are preserved, while a bounded pixel rectangle controls display. Regions and graph/prompt placement survive question normalization and JSON save/reload. Questions can display graphs before or beside their response prompts. Validation rejects out-of-bounds regions and Markdown tables whose separator/data rows have different cell counts. It permits a graph beside a distinct native table when the source relationship is explicitly documented; that evidence does not grant publication approval.

Repaired the existing high-effort task 013 locally: restored introduction and closing prose, retained both example headings, repaired four table separators, removed literal emphasis markers, separated the paired graphs, assigned the reversed Word c/d graphs to their correct PDF parts, retained the difference-arrow scaffolds, and restored the three-column response table in 2d. The graph placement now follows the source's before/beside relationships. The repair history has 29 content/region operations plus 12 placement/space operations, preserved in `local-repairs.json` and `local-layout-repairs.json` beside the raw candidate. These are agent interventions, not measured human hands-on minutes.

All three repaired source-page containers were visually inspected (the final layout changes affect page 39 only). Six image placements loaded, with no browser page errors. The six graphs retain their original mathematical content, all 26 short answers remain unchanged/correct, and no practice answer was observed in the student render. Minor typography, an extra generic Example heading, and tiny crop-edge traces still differ from the source; final PDF pagination, TikZ replacements, teacher-evidence approval and human review remain pending.

The repaired `task-013.repaired-layout.json` passed structural/question validation and was copied into the exact lane as **a draft**, with `task-013.execution.json` preserving original-task, execution-prompt, candidate, repair-chain and result hashes. Existing results and pinned evidence were verified and preserved; no review approvals or published bank records changed. The full import now has **14/31 task results, representing 42/93 pages**. Repaired renders are under `task-013-direct-high-v7/repaired-render-review`; raw-candidate renders remain in `render-review`.

Future direct packets now default to the user's requested high effort and include a supported-rendering contract: separate prose blocks, equal table cell counts, explicit graph/table relationships and verified image regions. Prepared the next packet, `task-014-direct-high-v1`, for pages **40–42**, selected Word/teacher excerpts and 23 candidate PNGs (including the three pages). Its invocation was rejected by automatic approval review: it requires explicit approval to send this new private payload to AGY/Gemini despite the user's request to continue. It did not launch; no transcription job is running. The pending command is `node scripts/booklet/transcription-direct.mjs run .booklet-work/transcription-benchmarks/task-014-direct-high-v1`.

Verification: **382 tests pass**, including source-region bounds, save/reload and graph/table distinction; production build passes with the existing bundle-size advisory. No live model retry was used for the local repairs.

## Pages 40–42 transcribed after approval

The user explicitly approved the prepared pages 40–42 packet and asked why repeated approval was necessary. Explained that automatic approval review had treated new private-data batches separately; the record does not establish why the earlier pilots were treated differently. The approved `task-014-direct-high-v1` run then launched successfully with **Gemini 3.8 Flash High**.

The draft returned in **252.657 seconds wall time** (241.904 seconds reported agent duration), with 12 image reads, one conversation turn and no shell/search/editing calls. Usage: 98,646 input tokens, 306,410 cache-read tokens, 48,111 output tokens including 30,959 thinking tokens. Candidate: `task-014.1788615333629.candidate.json`, SHA-256 `87169bfd50ea1019913bff51983df2adf57a906bee328d7fc1131dc923ef74ee`. The raw draft failed a table-shape check and five diagram/table checks; independent presentation checks found two inconsistent difficulty headings.

Locally repaired headings, the malformed plotting-data table, graph crops and source part assignments. Page 40 retains eight graphs in three columns and native blank tables only for a–c. Page 41 retains the unequal-axis-scale instruction and correct graph panels (Word image78 panels b/g/d/f correspond to PDF parts a/b/c/d). All numerical answers match the independent reference in `tmp/agy-transcription-diagnostics/task-014-review-reference.json`. Page 42 keeps the three tasks within one Review atom, restores checkboxes, leaves the plotting grid and match-count cells blank in the student view, and retains a native drawing box. Its teacher excerpt lacks filled answers; the independently checked answer candidates remain flagged for teacher-evidence review.

The model generated 15 derived TikZ diagrams alongside source graphics. These are preserved in `diagram-proposals.json` for dedicated diagram review, removed from the current render to prevent duplication, and are not approved. Model-supplied approval labels on source diagrams were reset to needs-review. No source image bytes were changed.

Added persistent right-of-prompt diagram placement and boxed answer spaces; regression coverage verifies normalization/save-reload. All three repaired student page containers were inspected; all 15 source-image placements loaded and there were no browser page errors or observed answer leaks. Final display differences remain: multiple-choice options are stacked rather than in the source's two-column arrangement, the matchstick drawing box is below the table rather than beside the pattern, minor crop-edge traces/typography remain, and full PDF pagination still needs review. These are draft results, not final fidelity approval.

Adopted `task-014.ready-draft.json` into the exact lane with `task-014.execution.json` recording hashes and the four local repair records. Original prompts, evidence, raw candidates and earlier results are preserved. The full import now has **15/31 task results, representing 45/93 pages**; review approvals remain pending. Final renders are in `task-014-direct-high-v1/final-render-review`. **382 tests pass and the production build passes.** No transcription job remains running.

## Remaining-booklet batch at concurrency 10

The user requested continuing the entire remainder and increasing concurrency to **10**. Implemented `scripts/booklet/transcription-batch.mjs`, which prepares bounded direct-input packets for missing tasks and executes a resumable worker pool. It retains raw candidates even when validation fails, skips existing import results and retained drafts on resume, records per-task timing/status plus peak active workers, and uses an exclusive batch lock to prevent duplicate execution. It does not automatically publish or approve drafts.

Prepared `.booklet-work/transcription-batches/linear-remaining-high-10-v1`: **16 tasks, 48 pages**, specifically pages **43–48 and 52–93**. Task 017/pages 49–51 already have a result and are skipped, along with the other completed tasks. Each new packet pins `gemini-3.8-flash-high` and `effort: high`; the combined local execution inputs total 26,448,756 bytes including repeated evidence/schema/profile files. This is not a provider token or billing estimate.

Saved the current import's concurrency as 10 and linked it to the prepared direct batch. Run status and the UI now reflect the run's stored concurrency; the exact-lane Run action dispatches this import to its configured direct batch instead of the old exploratory driver. Other imports retain their existing settings/defaults. Original prompts, evidence and results remain unchanged.

Automatic approval review rejected the full batch invocation before launch. Its stated reason was that “continue with the rest” authorizes the goal but does not explicitly authorize sending the new 48-page private payload and teacher/Word/graphic evidence to AGY/Gemini. No workaround was attempted. The concrete pending command is:

```powershell
node scripts/booklet/transcription-batch.mjs run .booklet-work/transcription-batches/linear-remaining-high-10-v1
```

The pending approval covers the entire prepared remainder at ten concurrent jobs, not a single three-page task. No job is running and import coverage remains **45/93 pages**. Local verification: **383 tests pass**, including a 16-item worker-pool test that reaches exactly ten active workers, retains a failure and completes the remaining queue; production build passes. Provider throughput at concurrency 10 is not yet measured.

## Approved remainder completed at concurrency 10

The user's explicit “approve” resolved the pending transmission approval for the entire prepared remainder. Ran the existing batch without changing its pinned inputs. All **16 tasks / 48 pages** returned complete draft candidates using **Gemini 3.8 Flash High**. The batch started at `2026-09-05T14:00:35.848Z` and finished at `2026-09-05T14:06:45.176Z`: **369.328 seconds (6 minutes 9 seconds)**, with a recorded peak of **10 active workers**. There were no failed requests, missing candidate pages or automatic retries. No job remains running.

Per-packet wall time ranged from **118.396 to 299.304 seconds**, with a median of **168.434 seconds**. Aggregate throughput was approximately **7.80 draft pages/minute**. This measures generation and initial structural validation, not fidelity review, local correction or publication. All requested source-page numbers occur exactly once within their respective candidates; 90 question blocks were inventoried and all referenced local evidence assets were found.

The runner classified **9 packets as validated-draft** and retained **7 as draft-needs-repair**. Those labels describe its initial checks only. A deeper independent inventory also found question-model errors in five packets and 20 presentation flags across 13 packets. Problems include answer-rule dots, inconsistent table cell counts, possible graph/table duplication, missing worked-answer evidence, maths/currency delimiter checks, heading/table treatments, and a repeated section identifier caught by the generic duplicate-ID guard. The repeated section identifier may represent intentional shared metadata and needs validator review; it is not evidence of a missing question. No mathematical or visual approval is inferred from a structural pass.

The candidates contain 24 TikZ diagram records and 112 model-supplied diagram approval labels. These remain raw model output, **not accepted review decisions**. Diagram proposals, source relationships and labels must be reviewed before adoption; the new candidates have not been copied into the exact lane or published. Existing accepted/rejected decisions, results, source evidence and user edits are unchanged.

The combined earlier results and new candidates now provide **draft material for all 93 source pages**. Exact-lane adoption remains **15/31 results, 45/93 pages**, and full-import page approvals remain **0**. The remaining 48 pages are isolated in `.booklet-work/transcription-batches/linear-remaining-high-10-v1`; each task retains its raw candidate, prompt/evidence hashes and timing ledger. `summary.json` records execution outcomes; `review-inventory.json` records candidate hashes, page coverage, question checks, presentation flags, asset checks and outstanding diagram review. The inventory can be regenerated without a model call using:

```powershell
node tmp/agy-transcription-diagnostics/report-batch.mjs .booklet-work/transcription-batches/linear-remaining-high-10-v1
```

Next transcription stage: repair these retained drafts locally, verify source/student/teacher alignment and render fidelity, then adopt draft results with provenance. Final PDF review and human hands-on measurements remain pending. No further remote transcription was needed in this turn. The latest production verification remains **383 passing tests and a successful build**; this continuation added a local diagnostic inventory and execution documentation, without changing application code.

## Full booklet view now exposes unmerged drafts

Fixed the misleading empty reconstruction view reported after the batch finished. The Full booklet endpoint previously loaded only `merged/transcription.json`; this import has no merged file because the strict merge requires all exact-lane results. It therefore hid both the existing 45 pages and the additional 48 retained candidate pages.

Added a read-only pre-merge preview that combines existing exact results with remaining direct-batch drafts, preferring adopted results over raw candidates. It validates batch ownership, task directory containment and execution-manifest hashes, reports unavailable/malformed drafts, and does not write or approve any import data. Merged imports continue to use their persisted transcription and existing content overrides. The UI now displays **Draft preview · 93/93 pages available**, provides Refresh drafts, and distinguishes inspection from editing/approval, which remain attached to the merged workflow.

Verified the live endpoint returns all 93 pages without load issues. Browser checks visited source pages 1, 46 and 93, confirmed reconstruction and source images load, confirmed pre-merge editing/approval controls are disabled, and found no browser page errors. This checks visibility and loading, not the drafts' mathematical/layout fidelity. Inspection evidence: `tmp/agy-transcription-diagnostics/draft-preview-check.json` and the corresponding page screenshots. **384 tests pass and the production build passes** with the existing bundle-size advisory. No candidates were regenerated, adopted or published; exact-lane coverage and approvals remain unchanged.
