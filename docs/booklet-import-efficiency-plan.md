# Reduce total booklet import time and token usage

Updated 2 October 2026 following review of the original improvement plan.

Implementation is available through the existing workflow controller and export
checker; see [implementation and operation](booklet-workflow-controller.md#import-efficiency-implementation-2-october-2026).
Packet accounting/context delivery, pending batching, slot refill, dependency
barriers, durable recovery/publication, failure diagnosis and canonical export
seeding diagnostics are implemented. Relevant authoring assignments receive graph
sizing guidance. Compact-spacing tuning remains outside this work.

An offline replay of 101 retained Pythagoras packets reduced complete delivered
characters from 3,420,637 to 3,339,211 (2.38%), with no larger packets or model calls.
This is a packet-projection measurement only. Overall accepted-import time and
token improvements remain to be measured on the next authorised comparable run.

## Summary and success criteria

The primary goal is to reduce total time from an authorised import's start to
accepted, reviewable delivery, including source preparation, authoring, independent
review, repairs, exports and required visual checks. Reduce complete-job worker
and coordinator token usage as a secondary goal. Smaller prompts, fuller batches
or fewer exports are useful only when they improve the complete workflow.

Preserve the three-pass workflow, independent source/mathematical review of every
item, revision-safe saves, historical run policies and all required quality gates.
Introduce no additional routine model call, review stage, approval register or
full-book export. Keep deterministic validation and accounting local and light.
Any added processing must be offset by avoided work in the overall measurement;
an optimization that makes comparable accepted imports slower must be revised or
disabled for future runs, without discarding completed evidence.

Compact-layout tuning stays with the user. Remove the proposed compact-spacing
policy, layout-reference campaign and discretionary gap, padding and minimum-height
reductions from this work. Established house style and handwriting requirements
still apply. Preventing oversized graphs is an explicit authoring convention.

Use Pythagoras as a diagnostic baseline, not a controlled speed benchmark:
the receipt generated at `2026-10-02T06:12:29.889Z` records **103 assessment model
calls**, **25 generated edition exports** and **zero verified export reuse**.
Calls are not automatically distinct tickets; missing usage and unmeasured phases
remain unknown. Its medium-reasoning configuration is a historical trial; future
production work uses Sol 6.1 medium as approved on 2 October 2026, Standard speed, with at most three workers.
Do not attribute medium-versus-high differences to workflow improvements.

Baseline locator: `.booklet-work/pythagoras-import-20261002/receipt.json`.
Pinned receipt SHA-256:
`24040397c0e86704ceb1803d91dd69fff85d6718c33ad65b6b475d3c0b072d24`.
Retain the associated input/ticket and implementation versions for comparisons;
never substitute a later receipt silently.

## 1. Prevent oversized graphs during existing authoring

- Apply the [graph sizing convention](booklet-cross-session-rules.md#graph-sizing-and-user-directed-compact-layouts-2-october-2026): start routine supplied question graphs around 70 mm wide and simple short-answer graphs around 50 mm. These are reference sizes, not caps. Further Transformations retained short-answer exceptions at 50–65 mm and reviewed question exceptions at 75 mm.
- Do not stretch graphs to fill available page or column width. Increase size when complete labels, ticks, multiple curves or assessed features require it. Preserve 10 pt ordinary labels and existing graph tick sizes; never shrink fonts or alter mathematical ranges simply to fit.
- Size blank grids for the drawing students must produce. Preserve meaningful paired figures, manual overrides and independently editable question, short-answer and worked-solution widths.
- Put concise sizing guidance only into relevant authoring assignments. Use the existing early difficult-layout sample and selected final-size checks; add no separate graph review or additional routine call.
- Preserve accepted projects on loading or duplication. Future graph-size feedback uses scoped maintenance rather than automatic whole-project resizing.

## 2. Remove repeated review context and improve existing batching

- Extend the canonical packet builder with useful source text, same-page sibling context and identity guidance from the Pythagoras custom runner. Bind that evidence to the immutable delivered packet before dispatch, rather than appending unaccounted context afterwards. Source pixels remain authoritative.
- Deliver each required source/context item once per packet, with lossless references where appropriate. Include all owned content, relevant source/key images, taught methods, current scoped decisions and necessary schemas. Omit unrelated history and superseded presentation snapshots.
- Measure the complete delivered prompt, including supplements and relevant guidance, before preparation. Distinguish stable instructions from variable context without reclassifying required assignment guidance out of the existing 24,000-character budget. Split compatible groups where possible; retain and explain genuinely indivisible exceptions. Do not omit required evidence to meet the limit.
- Improve the existing up-to-four-question batching rather than build a second batcher. Pack compatible unclaimed pending questions from the same exercise, preserving complete questions, shared stems and teaching dependencies. Prepared tickets retain exact immutable ownership.
- Reuse current teaching summaries. Record the first accepted summary before preparing dependent batches, then avoid redelivering unchanged original teaching context where the existing contract permits summary reuse.
- Apply scoped reviewer repairs through the correction register and revision-safe save. Record acceptance of already-authored departures without no-op repair/reassessment cycles. Preserve independent coverage of every teaching/practice item.

## 3. Consolidate resumable dispatch and recovery

- Extend the existing dispatcher/controller using `run-workflow next` as the source of truth. Reuse existing slot refill, serialized publication, failure draining and retained-result recovery mechanisms; consolidate the remaining custom content-runner behaviour.
- Keep at most three active workers and refill safe slots promptly. Preserve teaching-summary barriers and shared-source conflict guards from the custom runner. Serialization of writes alone does not make overlapping review dependencies safe.
- Validate selected owners and correction targets against the exact current project snapshot. Revalidate relevant dependencies before publication; preserve unrelated accepted work and reconcile affected retained results before scheduling replacement calls.
- Check runtime configuration and writable state locally. Verify worker connectivity through the first useful assignment rather than a disposable model probe. After a failure, stop new dispatch promptly, drain active workers, retain their outputs and diagnose before retrying.
- Translate source-group aliases through canonical mappings; reject ambiguous identities. Validate all output locally before publication. Define an explicit allowlist for unambiguous serialization normalization, retaining original bytes and a transformation receipt. Never invent mathematical repairs, source identities, ownership or acceptance through normalization.
- Recover completed immutable results after restart without another model call. Distinguish ended-worker failures from retained outputs requiring reconciliation; never cancel active owners or guess recovery paths.
- Use concise status summaries and existing phase/usage receipts. Reuse expensive deterministic work only within the established dependency-validation rules; avoid new process-wide acceptance caches.

## 4. Settle repairs once and make existing export reuse effective

- Diagnose shared causes and consolidate necessary repairs before final exports. Cosmetic compact-layout tuning does not become an import closeout task.
- Inspect development changes and pagination neighbours only as required, following shifts until the accepted page map rejoins. Preserve valid content review when only layout or metadata changes.
- Diagnose missed export reuse before adding another cache mechanism. The canonical checker already seeds compatible three-pass editions for run-local `final-exports-*` output directories. Ensure the dispatcher/export path invokes that existing integration correctly and records why each edition was generated, reused or ineligible.
- Reuse only passed edition artifacts with current verified dependencies and intact PDF bytes. Keep PDF reuse separate from visual-inspection reuse; retained inspection credit follows the existing exact selected-page evidence rules. Do not introduce whole-book raster comparisons solely for caching.
- For new imports, retain all five automated edition checks and three-pass selected visual coverage after repairs settle. For feedback repairs, use the minimum-check matrix, revision-safe save/readback and stopping rule. Unrelated concurrent edits do not restart acceptance.

## 5. Verify and roll out in bounded increments

1. Start with complete packet accounting/deduplication and deterministic retained-result recovery. Use offline retained evidence to establish completeness and identify actual duplication, without model calls or new acceptance claims.
2. Extend content dispatch and reuse existing export integration. Test immutable ownership, teaching barriers, shared-source conflicts, failure draining and restart reconciliation before sustained dispatch.
3. Include the concise graph convention in relevant authoring. Reuse existing simple/dense graph examples and checks; do not build a new compact-layout framework.

Test that packet projection preserves every required item, teaching reuse invalidates
only when appropriate, and batching neither loses nor duplicates coverage. Test
export reuse positively and negatively for changed printable dependencies,
metadata-only edits and missing/corrupt artifacts. Verify affected graph behaviour
and manual/legacy width preservation only when those mechanisms change. Run
focused regressions and one production build after application changes settle;
documentation-only changes need no build or PDF export.

Validate on the next authorised new import and, when requested, an ordinary
feedback batch. Do not initiate a paid full re-import solely to benchmark this
plan. Compare compatible accepted work under the same model/effort/speed and
quality policy; record source size, question/part counts and difficult-layout mix.

Record total elapsed time and time to reviewable output; distinguish active work
from human waiting and external interruptions. Capture worker and coordinator
usage, cached/uncached input, unavailable metrics, batch occupancy, generated/reused
exports, actual/reused page inspections and retry causes. Give underfilled batches
and rejected export reuse reason codes. Separate local replays, bootstrap failures,
model calls and one-time workflow-engineering costs. Avoid heavy measurement on
the routine critical path.

Engineering completion requires focused checks and preserved quality gates.
Efficiency success additionally requires lower total time on comparable complete
accepted work; packet-size reductions alone do not establish it. Report token
changes separately and explain any increase. Until those measurements exist,
describe the changes as intended improvements, not proven savings. Keep the
existing two-hour/weekly-usage targets explicitly unproven.
