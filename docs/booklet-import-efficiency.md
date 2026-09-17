# Import efficiency: repairs, representatives and diagnostics

Implemented after Logarithms v1 and extended after Data Visualisation 1 v1,
16 September 2026. Use with the [change
runbook](booklet-change-runbook.md) and [review-first workflow](booklet-review-first-workflow.md).
These tools preserve independent inventory, mathematical review, source and
presentation reconciliation, revision-safe saves and complete edition coverage
under the [unique-layout visual/composition policy](booklet-review-first-workflow.md#unique-layout-final-acceptance).
They do not migrate accepted projects or invalidate unchanged
render evidence merely by being installed.

For current execution use the [bounded Astra workflow](booklet-bounded-workflow.md):
direct assignment scheduling, fresh stage tickets, reusable exercise teaching
reviews, exact feedback scopes and complete-job receipts. The
[September paired trial](booklet-astra-paired-trial-2026-09-17.md) records the live
authoring experiment and its acceptance/access limitations. The two-hour initial
import and 10%-weekly targets are not demonstrated savings. Next-import rollout
must retain the existing source, mathematical, edition and bank acceptance gates.

## New-run pipeline policy (17 September 2026)

Newly prepared runs record `pipelinePolicy: "pdf-import-efficient-v1"`. Existing
runs retain their original contract; do not edit their manifests to opt them in.
No accepted project is migrated by installing these tools.

Authoring now uses deterministic complete-question assignments, defaulting to
four questions and 24,000 characters of variable context. Descendants, explicit
inventory groups, `sharedContextIds`, `sharedWith`, `continuationOf` and prepared
page continuations stay together. Unknown dependencies fail planning; oversized
indivisible activities are retained and reported. `config.assignmentLimits`
can set `maxQuestions` and `maxCharacters`. Source inventory still happens once
per source page, independently of authoring. Full source pages remain available
as evidence; other questions visible in an image are not assigned work.

Each assignment has stable ownership IDs, evidence references, dependency hashes,
immutable attempts and an accepted-result cache under `semantic-packets/assignments`.
Workers return `{packets:[...]}` for their assigned source pages. The merger
rejects duplicate ownership/mappings, missing questions and foreign mappings,
then applies the existing full page validation and serialized publication checks.
Successful assignments survive another assignment's failure. Inspect a failed
assignment using `attempt-context` with `assignmentId` alongside `page` and
`fromAttempt`; `repair-attempt` writes a reviewed exact-field repair without a
model call. Resume with a newer page attempt to assemble cached fragments.
Only actual regeneration requires `--regenerate-reason`.

`representatives` chooses compact source-pattern coverage deterministically.
Complete the cross-cutting coverage list and run `check-representatives`; for
new-policy runs this saves the validated plan in the workflow register. Continue
using `candidatePages` for interchangeable coverage examples; deterministic greedy
selection maximizes uncovered requirements and breaks ties by source order.
`pages` and `exceptionPages` preserve cases that need their own inspection. Continue
using `approve-pattern` for source patterns. After actually inspecting each
applicable cross-cutting case, record it through:

```text
node scripts/booklet/run-workflow.mjs approve-coverage --run-id RUN --input REVIEW.json
```

The record contains the coverage `id`, `keys` mapping each planned page to its
current `representativeKey`, current `renderer`, actual `reviewer`, `note`,
hashed `artifacts`, `finalSize:true` and `sourceCompared:true`. Obtain keys and
renderer from `review-workflow status`. Required cases explicitly include
fraction-step spacing, equation-to-prose spacing, Venn shading, number-line labels,
answer widths and editor display. A completed plan never grants inspection credit.

Final exports write version 2 manifests with a `rasterization` record binding the
PDF hash, Poppler version, 144 dpi, implementation and each physical page's RGB
raster and derived PNG. The same pixels supply inspection, exact comparisons and
numbered footer strips. Final export no longer captures every browser page.
Keep browser screenshots for focused interaction checks. Repeating an export at
the same output path resumes verified PDFs and independently repairs absent or
corrupt rasters; do not use `--force` for routine resumption. Legacy manifests
remain readable as their original image evidence.

The workflow register also owns verification entries. Inspect the current checklist
and dependency values with `run-workflow verification --run-id RUN`. Record actual
checks with `record-verification --input REVIEW.json`. Records need `id`,
`outcome`, `reviewer`, `note`, current hashed `artifacts` and `dependencies`.
`question:BLOCK_ID` records bind `dependencies.question` to the displayed question
hash and assert `checks.answer`, `checks.skillMapping`, and `checks.taughtMethod`.
Other IDs are `ui`, `regressions`, `build`, `storage`, `publication`, `readback`,
and `repeat-import`. UI records cover `filtering`, `solutions`, `worksheet`,
`saveReopen` and `ownershipSync`. Project-dependent records bind the displayed
project hash; UI/regression/build records also bind the renderer. Regression records
add the displayed `authoring`, `assessment` and `regression` dependencies; builds
bind `build`, and storage checks bind `storage`. Renderer signatures follow the
application import graph, widening unknown dynamic imports conservatively. Extra file
dependencies belong in `dependencyArtifacts`; changes invalidate only dependent
checks. A build may be `not-applicable` only with `codeChanged:false` and a reason.

`check-import-harness` defaults to the combined scenario, in fresh isolated bank
and project storage. It edits through the real editor, waits for save acknowledgement,
reopens once, verifies owner sync, filters the bank and previews questions and
solutions in a worksheet. For a teaching-only candidate, explicitly choose
`--scenario editor`; this does not satisfy combined UI acceptance.

`import-project-bank` checks all current prepublication evidence before staging and
prepublication checks inside its publication transaction. New-policy imports
cannot bypass this gate through individual live-bank promotion. It pins the
unchanged reviewed source snapshot, records publication/readback, and records
`repeat-import` on the next idempotent import invocation. `receipt` and `closeout`
derive their checklist from the same register, without inventing review evidence.
Missing postpublication checks keep completion pending, without repeating PDFs.

**Stop once** required checks pass and no task-caused issue remains: publish,
read back, verify repeat-import idempotency and finish. No extra global audit,
navigation pass, save/reopen, re-solve, export or build is implied by closeout.
Unknown usage stays unavailable; report payload/image counts and measured costs,
not a percentage saving inferred from incomplete historical metrics.

### Isolated regression pilot (17 September 2026)

The implementation passed 107 relevant regression cases, with affected suites
rerun after fixes, one production build, and the repository storage check.
The build retains the existing bundle-size advisory. A new-policy transaction
test exercises staging, publication under the lock, preserved acceptance,
readback, repeat-import and rejection of a later changed publication.

The frozen five-question pilot exported 5/1/2/6/7 pages in the five formats.
All automated checks passed. Actual inspection covered all eight standalone
pages and seven required combined pages; six combined bodies reused exact
comparisons. Both combined compositions and all 13 footer strips were inspected.
The combined isolated UI scenario passed, including acknowledged save/reopen
and ownership sync. The final export took 14.656 seconds; a cache-resume probe
took 8.124 seconds and generated no PDFs or rasters, reusing all 21 page rasters.

Read-only planning against five existing source inventories produced 36 worker
assignments and five local exclusion-only groups. Variable context ranged from
5,341 to 23,737 characters, with four attached images per worker and no oversized
exception. Long shared guidance is referenced by hash; an assigned source page
also appearing in teaching context cannot pull in unrelated question repairs.

Detailed evidence and measured retries remain under
`.booklet-work/import-pipeline-efficiency-20260917/validation.json`. Development
included three UI-harness failures before its successful scenario and two PDF
refreshes while the dependency-signature implementation settled. The journal
retains those costs: 15 generated PDFs and 63 physical-page rasterizations across
development and final exports. No production project or historical acceptance
was republished. No new model authoring call was made; main-agent token usage
and unrecorded implementation time are unavailable. These are tooling pilot
measurements, not a comparable reimport or a percentage-savings estimate.

## 1. Prepare the complete representative set once

After independent inventory, generate the plan:

```text
node scripts/booklet/run-workflow.mjs representatives --run-id RUN --out .booklet-work/RUN/representatives-plan.json
```

This derives each pattern's first source occurrence, all affected source pages,
current approval status and missing inventories. It also creates an explicit
cross-cutting coverage checklist. Assign source pages to each applicable item;
record a source-supported not-applicable reason for the rest. Include notation
and fractions, physical dotted boxes in exponents/fractions, equation annotations,
value tables and borderless layouts, teaching templates, dense/paired graphs,
student/answer widths, pagination after edits, editor resize/save/reopen and
fresh/cached print parity. Add newly discovered source patterns to the independent
inventory before extending this plan. Do not gradually discover this test set
while bulk authoring is already running.

Set each coverage item's `status` to `planned` with its `pages`, or to
`not-applicable` with `notApplicableReason`. Validate the completed plan with
`run-workflow.mjs check-representatives --run-id RUN --input PLAN.json` before
bulk work. The check rejects missing inventory, stale pattern coverage and
unassigned cases, and returns the complete candidate page set. It certifies
planning completeness only; it does not mark any case visually accepted.

The checklist now explicitly covers ruler-based lengths, dense category labels
and each statistical graph family, including partial pictogram symbols, negative
or back-to-back stem-and-leaf layouts, divided bars, polygons and ogives where
the source requires them. Use inventory patterns for distinct variants. The
dependency CLI requires a current complete plan before scheduling bulk authoring:

```text
node scripts/booklet/run-workflow.mjs drain --run-id RUN --config CONFIG.json --plan PLAN.json
```

Inventory can still run before the plan exists; representative authoring uses
`--representative`. The plan adds coverage checking to the existing maths and
representative-acceptance gates. It does not grant those approvals.

Use the existing `author --representative`, assembly, diagram preflight and
`approve-pattern` commands. Inspect the actual source and final-size output;
the generated plan has no acceptance credit. Complete all applicable source
patterns and cross-cutting cases before the ordinary author batch. Run a
representative development export in every affected edition.

## 2. Repair exact fields after initial authoring

Use a targeted correction for known defects in otherwise valid content. Preserve
IDs, unrelated content and the independent source evidence. Put requested fields
in a local descriptor:

```json
{
  "targets": [
    {"page": 9, "scope": "author", "targetId": "ACTUAL_NODE_ID", "fields": ["/prompt", "/answer/short", "/answer/worked"]},
    {"page": 9, "scope": "inventory", "targetId": "ACTUAL_SOURCE_ID", "fields": ["/expectedAnswer"]}
  ],
  "teachingPages": [3, 4]
}
```

Only request fields and IDs that actually exist. Then:

```text
node scripts/booklet/run-workflow.mjs repair-context --run-id RUN --input targets.json --out .booklet-work/RUN/repair-context-1.json
```

The output contains exact current values after approved correction overlays,
source/teaching evidence paths and hashes, and the current review revision/key.
It neither calls a model nor mutates evidence, packets, the register or projects.
Output files are created exclusively; use a fresh name for another snapshot.

Read the linked source and taught methods. Request additional dependent fields
when needed: short/worked answers, diagrams, mappings and presentation expectations
must agree. Return only the changed fields and reasons, rather than another whole
page. Build the existing `decide` record with exact original/corrected values,
source references and actual reviewer evidence, then use `decide`/`propagate`.
Distinguish a source error from an implementation/layout repair in the reason.
Do not invent reviewer approval or silently refresh stale originals. Ambiguous
mathematics still goes into the single bundled issue register.

Unknown inventory IDs in a failed generation retain the bounded
`author --repair-from N` path. Regenerate a complete page only for a genuinely
incomplete/invalid initial reconstruction or a change whose scope demands it;
record why targeted correction is insufficient. Existing validators, representative
invalidation and affected-page/neighbour review still apply.

### Repair a preserved, unpublished attempt locally

Use `attempt-context` for structural or other exact-field repairs to a failed
author attempt. No model runs during either command:

```json
{"page":9,"fromAttempt":1,"targets":[{"targetId":"$packet","fields":["/inventoryMappings"]}]}
```

```text
node scripts/booklet/run-workflow.mjs attempt-context --run-id RUN --config CONFIG.json --input targets.json --out attempt-context.json --representative
node scripts/booklet/run-workflow.mjs repair-attempt --run-id RUN --config CONFIG.json --input repair.json --attempt 2 --representative
```

Use `--representative` only during representative authoring. `repair.json` holds
the exact returned `context`, `patches` with `targetId`, `field`, `original`,
`corrected` and `reason`, and `review` with the actual `reviewer`, `note` and
hashed `artifacts`. `$packet` permits mappings, unresolved findings and correction
proposals; other targets are existing content IDs. Every selected field must be
addressed. The command preserves all IDs, requires unchanged originals, source
and teaching dependencies, and rejects published content. Published content uses
the correction register through `repair-context` and `decide`/`propagate`.

The repaired result passes the same semantic, coverage, geometry and publication
checks. The new immutable attempt retains the patch and review record. Source
changes or stale evidence require fresh review; the command never silently
updates its context. Ambiguous mathematics remains in the issue register.

External full-page author retries now require `--regenerate-reason "..."` in
addition to the new attempt number (or `drain --retry`). This explanation records
why targeted repair is insufficient; it is not another permission request.
Mapping-only repair and explicitly reviewed local repair remain available.

## 3. Test the actual save route before long runs

Environment preflight now checks UTF-8 artifact write/read as well as source pins,
tools, authentication, TikZ and preview routes. Its read-only route test does not
test editing. Use a small representative candidate containing a visible diagram
with an explicit width:

```text
node scripts/booklet/check-import-harness.mjs --project-file CANDIDATE.json --diagram DIAGRAM_ID --out .booklet-work/RUN/harness-1 --run-dir .booklet-work/full-imports/RUN
```

This starts its own hidden-browser Vite session on an allocated local port,
changes the diagram width three times, saves through `saveBookletProject` and
shared bank transactions in fresh isolated storage, reloads and verifies the
original width. It retains revisions, actual duration, screenshot and a JSON
report. The input candidate stays unchanged. Inspect the screenshot for the
representative's arrangement. This is a harness check, not whole-booklet editor
or visual acceptance. `--base URL` optionally reuses an already healthy server.
Choose a fresh output directory for a retry; prior evidence is preserved.

## 4. Resume exports and bound preview investigations

Final exports already resume from valid edition manifests, PDF/image hashes and
layout verification caches. After an interruption, repeat the same output path
and command **without `--force`**. This reuses completed valid editions; changed
source, project, renderer, assets or settlement correctly invalidates them. Keep
the server alive until export completes. Do not restart a full five-edition
export merely because a browser session ended.

For a suspicious preview, first compare existing image bytes and decoded pixels:

```text
python scripts/booklet/diagnose-page-preview.py --first PREVIEW.png --second OTHER.png --pdf EDITION.pdf --page 6 --out .booklet-work/RUN/preview-diagnosis-1
```

Identical pixels stop further rasterization. Otherwise the tool renders only the
named PDF page through PyMuPDF at 2× and records hashes; `--second` is optional.
Compare that image visually with the source. If the suspect preview was already
produced by PyMuPDF, use Poppler for the independent check instead. Different
engines/resolutions are diagnostic evidence, not automatic proof of a defect.
Never repair content merely to compensate for a display artifact, and never
treat pixel equality as source fidelity or completed visual inspection.

The diagnostic needs Pillow and PyMuPDF. It also supports the existing ignored
PyMuPDF installation under `.booklet-work/python`.

## 5. Record actual costs without verbose payloads

```text
node scripts/booklet/run-workflow.mjs receipt --run-id RUN --summary --out .booklet-work/RUN/receipt-summary.json
node scripts/booklet/semantic-packets.mjs author --run-id RUN --pages PAGE --config CONFIG.json --attempt N --retry-reason content-repair
```

`--retry-reason` also works with `run-workflow drain --retry`. Allowed reasons:
`source-correction`, `content-repair`, `mapping-repair`, `renderer-change`,
`infrastructure`, `input-change`, `validation-repair`. Missing historical reasons
are reported as `unrecorded`, never inferred from a failed exit code. Mapping-only
repairs can be identified by their explicit repair source.

Receipts now split calls and input/cached/output tokens by stage, first/repeat
attempt, outcome and retry reason, and sum prompt characters by section. Compact
receipts retain missing-usage counts, unfinished work and phase failures without
dumping complete event journals. Cached input is already part of input; character
counts are not token counts. Concurrent phase sums are not elapsed wall time.
Repeated attempts include justified editorial work and are not all waste.

Metrics version 3 separates `generationAttempts`, external `calls` and
`localReplays`. Only explicit `externalModelCalls: 0` identifies a local replay;
missing metrics on other attempts remain unknown. Local replays contribute to
work timings, but not external call counts, prompt characters or missing-usage
penalties. The Data Visualisation event journal therefore reports 114 external
calls and 11 local replays, with the original external token totals preserved.

`run-workflow`, `review-workflow` and `visual-review` print compact summaries by
default. Use `--full` for the complete console payload; `--out FILE.json` retains
the full record regardless of console detail. The legacy receipt `--summary`
still explicitly writes a summary. Context and planning outputs use exclusive
creation, so select a fresh path for a new snapshot.

Retain compact common prompts, relevant teaching context and explicit schemas;
avoid weakening contracts merely to reduce input length. The targeted repair
path is the first option for reducing repeated context/output. No measured savings
are claimed until a comparable future import supplies actual end-to-end metrics.

Author prompts now read each affected field from the current materialized packet
once. Parent and descendant changes share that current value, with references
back to every applicable decision and reason. Removed targets are identified as
superseded; current-page inventory replacements already appear in the inventory.
Teaching content remains explicit. Exact originals and successive historical
replacements remain in the linked register, without repeating obsolete whole
teaching sections in each author prompt.

An offline comparison using the same current Data Visualisation register and
all 55 teaching-page assignments reduced editorial-context JSON from 5,468,668
to 2,857,404 characters (47.75%). Page 35 fell from 228,180 to 98,431 characters.
This compares context formatting, not complete historical prompts or measured
model tokens/runtime. The check took 2,794 ms locally; no model was called.

## 6. Reuse graph and teaching construction

[`scripts/booklet/graph-authoring.mjs`](../scripts/booklet/graph-authoring.mjs)
provides optional authoring helpers that emit existing editable types:

- `dataGraph` builds line graphs, frequency polygons, ogives and equal-width
  frequency histograms using the shared graph model, palette and typography.
  Supply numerical bounds, ticks and data explicitly. It rejects missing bins,
  out-of-scale data, decreasing cumulative totals and unsupported unequal-width
  frequency bars. Supply source-supported endpoints explicitly; none are invented.
- `pairTeachingBlocks` links existing Worked Example and Guided Practice groups
  with `pairedBlockId`, keeping their content, IDs and shared headers intact.
  Other source activity identities require their existing arrangements.
- `buildMeasurementBar` compiles a labelled, unfilled divided bar, measures its
  actual SVG target and returns the calibrated `diagram.widthMm` plus a hashed
  calibration record. `lengthMm` is the ruler target, not the SVG frame. Set
  `availableWidthMm` to the actual slot width; an undersized slot is rejected.

Example in a local authoring script:

```js
const {diagram, calibration} = await buildMeasurementBar({
  id: 'practice-ruler-bar', lengthMm: 120,
  parts: [{proportion: 0.4, label: 'A'}, {proportion: 0.6, label: 'B'}],
}, {availableWidthMm: 170});
```

Reuse the compiler/browser when building a batch. Save calibration as local
evidence, retain occurrence source references, and verify the final page and
editor round trip. Width caps, answer layouts and later edits still require
review; helper generation is not acceptance. Real compilation and final-size
Chromium checks measured 99.982 mm and 119.978 mm for the 100/120 mm cases.

## 7. Catch inexpensive defects before export and assemble closeout evidence

```text
node scripts/booklet/run-workflow.mjs pre-final --input booklets/projects/PROJECT.json --out pre-final.json
node scripts/booklet/run-workflow.mjs closeout --run-id RUN --out closeout.json
```

`pre-final` checks mixed-text maths delimiters, KaTeX rendering, common internal
editorial asides and coloured graph baselines/axes. Native text currency remains
literal. Ordinary axes use black; series colours remain meaningful. Historical
source evidence is excluded. The settlement CLI runs this check before accepting
settlement, so cheap defects can be repaired before five-edition export.

An intentional flagged occurrence needs `preFinalReviews` in its settlement
record: the issue's exact `rule`, `path` and `hash`, plus actual `reviewer` and
`reason`. Changes invalidate that exception. These narrow checks supplement
the full palette, shading, visibility, physical-size and visual-review gates.

`closeout` revalidates the current final acceptance and its five manifests, then
summarizes inventory, correction IDs/reasons, representatives, edition page
counts and actual metrics from existing records. Missing or stale acceptance
returns failure. It never records inspection or approves anything. Continue to
retain the project, referenced assets and durable provenance under the storage
policy, with original sources and detailed render evidence locally.

Publication now holds the review lock while checking fresh dependencies and
committing canonical content, attempt metadata and registration in one rollback
transaction. Short-lived contention waits for the owner; abandoned locks still
require explicit reconciliation. Independent pages retain their existing
dependency scope. Real relevant changes continue to reject stale publication.

### Validation of the 16 September tooling change

77 targeted tests passed, covering correction projection, exact-field repairs,
conflict handling, review locking, scheduling, local/model metrics, CLI output,
graph builders and existing acceptance APIs. The final native-text currency
check also passed. The production build and repository storage check passed;
the build retains its existing bundle-size advisory. Projected release content,
including the current pending source/code/content additions, remains within the
reviewed storage budget.

All nine current project files retained their starting SHA-256 hashes. The
read-only closeout revalidated Data Visualisation's five accepted editions
(78, 9, 28, 87 and 106 pages). No new transcription call or final booklet export
was needed for this tooling change. Measured tests, character comparison,
physical-size checks, build results, retry reasons and file hashes are retained
locally in `.booklet-work/import-efficiency-20260916/validation.json` and its
linked evidence. Complete implementation wall time and main-conversation token
usage were not measured.
