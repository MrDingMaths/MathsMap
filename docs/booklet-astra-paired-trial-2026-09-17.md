# Astra paired authoring trial — 17 September 2026

**This trial does not demonstrate import savings.** Both arms completed six author calls, but only two assignments per arm passed the scoped source, mathematics, taught-method, native-editability and rendered checks. The bounded arm also encountered blocked access to essential linked guidance. Completed, accepted throughput and the two-hour / 10% weekly-allowance targets remain unmeasured.

The isolated local evidence is in [`.booklet-work/astra-paired-trial-20260917-v2`](../.booklet-work/astra-paired-trial-20260917-v2/): [protocol](../.booklet-work/astra-paired-trial-20260917-v2/protocol.json), [metrics report](../.booklet-work/astra-paired-trial-20260917-v2/report.json), [revision-checked review register](../.booklet-work/astra-paired-trial-20260917-v2/review-register.json), and [setup/repair/inspection record](../.booklet-work/astra-paired-trial-20260917-v2/trial-operations.json). These ignored artifacts preserve original prompts, images, inventories, every model output, session events, failed gates, repairs and actual PDF rasters. No production project, bank entry or historical acceptance was changed.

## Design and source evidence

Exactly six complete source units were selected from the existing ten-page model benchmark. The trial reused independently available inventories; it made no new inventory model calls and called no weaker models.

| Assignment | Complete source unit | Teaching supplied initially |
|---|---|---|
| Teaching | Index Laws p4 Simplify group: three demonstrations and nine responses | p3–4 |
| Fractions | Index Laws p44 Q23: all six parts and the complete supplied example | p10, p16 |
| Shared stem | Index Laws p44 Q24: all nine parts | p10, p16 |
| Graphs | Linear Relationships p21 Q3: all four table/graph parts | p15–16 |
| Solids | Volume p11: all seven rows, figures and responses | p8, p10 |
| Answers | Volume p25 Q1: both cylinders, area givens and V=Ah scaffolds | p23–24 |

Both arms used the same selected ownership, source/teaching images, inventory and output envelope, with fresh configured Astra Low contexts at Standard speed. The baseline retained full-page prompt/inventory context and scheduled five page workers, serializing the two p44 assignments inside their page worker. The bounded arm scheduled the six assignments directly. Each arm used the shared maximum-three pool; baseline ran first. This is one pair, not a randomized repeated experiment. Session events did not independently emit an observed model name; requested settings and session IDs are recorded.

Three source/context decisions are explicit:

- Before any live call, the p11 inventory was switched from the historical Sol inventory, which misidentified a pentagonal prism, to the original Astra inventory. Both arms received that same inventory. The first preparation directory contains no live model calls.
- Both arms used actual p44 division/power teaching on p10/p16, replacing the historical benchmark's practice p37/p38. During review, [source p21 zero-index teaching](../.booklet-work/astra-paired-trial-20260917-v2/shared-zero-index-review.json) was additionally inspected for Q24h/i in both arms. The original prompts stayed frozen, and both solutions agreed with that teaching. This is not a comparison with the historical benchmark's model results.
- After authoring, the [shared inventory correction](../.booklet-work/astra-paired-trial-20260917-v2/source-inventory-correction-review.json) classified the p4 header ornament and demonstration/response grids as native teaching structures rather than independent mathematical diagrams. Existing revision-checked correction APIs retained all entries, original values, hashes and visual requirements. The correction did not grant presentation acceptance.

## Observed results

| Metric | Page-context baseline | Bounded assignments |
|---|---:|---:|
| Accepted selected assignments after review/repairs | **2 / 6** | **2 / 6** |
| Model author invocations | 6 | 6 |
| Authoring active wall time | 9m 10.141s | 8m 26.963s |
| Sum of concurrent call durations | 21m 33.539s | 22m 0.722s |
| Input tokens, including cached input | 226,041 | 252,469 |
| Cached input tokens | 70,656 | 134,912 |
| Output tokens | 41,715 | 42,716 |
| Saved exact-field author repairs | 2 | 0 |
| Observed completed tool events | 0 | 0 |
| Tool rejections independently observed in stderr | 0 | 2 |

All twelve author calls have reported input/cache/output usage. The bounded prompts were shorter, but total recorded input increased. These numbers cover unaccepted work too; they are not an accepted-throughput or weekly-allowance saving.

Both exact-field repairs supplied missing baseline section titles. The teaching repair passed structural validation after the shared inventory correction; the cylinder output still failed duplicate-ID validation. One earlier title-only patch was rejected before a repair revision was saved. No model reauthoring was used to force acceptance. Manual source-review and repair durations were not separately captured and remain unavailable.

| Assignment | Final scoped finding in both arms |
|---|---|
| Fractions | Accepted: all expressions, supplied example, results, taught steps, source grouping and inspected student/answer layouts passed. |
| Shared stem | Accepted after the equal zero-index teaching review: all nine items, results, grouping and inspected layouts passed. |
| Teaching | Failed presentation: an exercise header appears inside teaching; the bounded output also changes the red Simplify activity to Guided Practice and separates its icon from the header. |
| Graphs | Correct calculations and source ranges; failed presentation. Both need native completed answer tables. Baseline retains unclipped lines/tick-overlap findings; bounded retains three insufficient cloze-width findings. |
| Solids | Failed: native four-column response composition and labels disappear. Visibility acceptance remains unresolved; bounded explicitly retains a dashed silhouette defect. |
| Answers | Correct givens/results and V=Ah method; failed labels/visibility acceptance. Baseline retains a duplicate block/root ID. Bounded has unresolved native scaffold references. |

“Accepted” here covers the selected assignment's source/mathematics, native model editing and serialization, and inspected draft layouts. It does not certify production publication, browser editing, bank sync, full-booklet coverage or combined-edition composition. Missing teacher-answer evidence for the unaccepted graph/solid work remains explicitly unresolved; authored answers were not relabelled as source answers.

The bounded graph and solid workers attempted to read linked diagram/supplement guidance. Their `stderr.txt` files contain `exec_command ... rejected: blocked by policy`; their JSONL streams contain no corresponding command items. Thus zero completed tool events does not mean zero attempted tools. This unequal effective access to instructions invalidates the performance comparison. Production guidance delivery was subsequently changed to inline essential guidance and current correction values; the frozen trial does not measure that later implementation.

## Rendering, repairs and remaining measurements

The current student, short, worked and teaching-response drafts contain **33 pages**, all visually inspected in batches of at most eight. Actual browser PDF exports, automated layout checks, PDF clearance checks, diagram measurements and failed solid-visibility gates are retained. These are diagnostic drafts, not five-edition acceptance.

The initial trial composition incorrectly prefixed native document owner IDs without prefixing `#paragraph-id` reference fragments. Fixing that isolated harness bug restored the baseline cylinder scaffolds. **The earlier baseline scaffold-omission finding is retracted.** It was not a production renderer or author-content defect. The bounded scaffold references remain genuinely unresolved in its original packet.

Superseded renders are `baseline/render-1789635210555` and `bounded/render-1789635750314`. Current inspected renders are `baseline/render-1789635920532` and `bounded/render-1789635922114`. All are retained with distinct project/PDF hashes. The two render rounds produced eight PDFs per arm and 66 raster pages overall, with no raster reuse between those isolated render directories. Recorded render durations total 83.406s baseline and 96.131s bounded. This harness repair/setup cost is separate from the two author-content repairs; its manual duration is unavailable.

Coordinator usage, separately timed active review and human waiting, complete feedback repairs, production bank behavior, all-five-edition acceptance, combined exact-pixel/composition evidence, and same-reset-window weekly usage are not measured by this trial. The next required booklet must supply those measurements before either target can be claimed.

## Reproduction and focused checks

The reusable [trial runner](../scripts/booklet/paired-astra-trial.mjs) freezes dependencies, preserves immutable attempts, deduplicates recorded calls, refuses stale review/repair inputs, records source corrections through the existing register and reports unavailable measurements explicitly. The [diagnostic renderer](../scripts/booklet/paired-astra-trial-render.mjs) never publishes candidates or grants visual acceptance.

```powershell
node scripts/booklet/paired-astra-trial.mjs prepare --out .booklet-work/astra-paired-trial-new
node scripts/booklet/paired-astra-trial.mjs run --out .booklet-work/astra-paired-trial-new --arm baseline
node scripts/booklet/paired-astra-trial.mjs run --out .booklet-work/astra-paired-trial-new --arm bounded
node scripts/booklet/paired-astra-trial-render.mjs --out .booklet-work/astra-paired-trial-new --arm baseline
node scripts/booklet/paired-astra-trial-render.mjs --out .booklet-work/astra-paired-trial-new --arm bounded
node scripts/booklet/paired-astra-trial.mjs report --out .booklet-work/astra-paired-trial-new
node --test tests/booklet-paired-astra-trial.test.js
```

`prepare` uses current guidance, so a newly prepared experiment measures the current implementation, not these frozen prompts. Review records require an expected register revision, current output hash, named observations, explicit checks/issues and hashed inspected artifacts; `review`, `correct-inventory` and `repair` accept JSON files through `--input`. Re-running `run` preserves completed and failed attempts rather than silently spending more model calls. Current focused regressions cover complete ownership, bounded scheduling/resume, unavailable usage, stale evidence, revision-safe repair/review, and native-reference composition.
