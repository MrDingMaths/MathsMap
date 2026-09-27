# Review-first transcription

Required for new semantic runs (`workflowPolicy: "review-first-v1"` in new manifests). Existing projects, historical evidence and exact-mode compatibility are unchanged. An older semantic run can opt in through its config, but its independent inventory must first supply the review fields below. This adds gates to the [direct compact workflow](booklet-direct-compact-import.md), not a replacement for the [feedback checklist](booklet-transcription-feedback-checklist.md).

## Initial contract

Scope: ordinary feedback maintenance uses the [minimum verification matrix](booklet-change-runbook.md#minimum-verification-for-feedback-maintenance). A feedback save, comment resolution or unrelated renderer edit does not require a new full-import settlement. The complete five-edition and fresh-inspection rules below apply when new-import/full acceptance is actually required; maintenance evidence must not be represented as that acceptance.

- Keep independent source inventory and complete final visual inspection. Counts, generation caches and numerical checks do not establish fidelity.
- Retain every printed measurement, including redundant givens. **Unused is not a defect.** Check consistency with the diagram and stated rounding precision before proposing a correction. Unknown precision is a review question, not permission to change a value.
- Inventory mathematical relationships early, bundle editorial decisions, and author unaffected pages while decisions are pending. An explicit decision to retain an unusual source value does not certify incorrect authored geometry.
- Approve final-size representatives of every distinct pattern before bulk authoring that pattern. Include writing boxes (including superscripts/fractions), label clearance, diagram size, attribution headings, source colours, alignment and native maths. State why an absent category is not applicable. Review label placement and appearance separately from numerical geometry.
- Render affected pages and pagination neighbours during development. Settle content, check all five export formats, and cover every final page under the [unique-layout policy](#unique-layout-final-acceptance): inspect the three standalone layouts and reuse verified duplicate bodies in combined editions with explicit composition review.

## Inventory and early mathematical review

Run the independent `semantic-packets.mjs inventory` stage as usual. New-run prompts additionally request:

```json
{
  "layoutPatterns": [{"id": "triangle-short-response", "description": "Triangle beside a short prompt, external measurement labels"}],
  "entries": [{
    "id": "p8-triangle", "targetId": "p8-diagram", "kind": "diagram",
    "description": "Preserve source vertex names, labels, colours and all givens",
    "mathematicalModel": {
      "type": "triangle",
      "sides": {"b": {"value": 5, "exact": true}, "c": {"value": 5, "exact": true}, "a": {"value": 7.7, "quantum": 0.1}},
      "angles": {"A": {"value": 100, "exact": true}}
    }
  }]
}
```

The internal convention is `a=BC`, `b=CA`, `c=AB`; preserve the source's printed vertex names separately. `quantum` is the stated rounding increment, not an arbitrary tolerance. Only use `exact: true` with source support. Missing measurements are omitted. The example's redundant 7.7 side is retained: it is consistent at one decimal place and must not distort the 100° construction.

`triangle-constraints.mjs` checks positive measurements, units, triangle inequality, angle sum and conservative cosine-law intervals. It constructs SAS/SSS/ASA/AAS relationships and tests the result against every supplied precision interval. Underdetermined/ambiguous SSA, unsupported relationships and cases needing a more general constraint solver remain review findings; do not invent a construction or loosen precision to pass. Optional `mathematicalChecks: [{left: "2+3", right: "5", exact: true}]` support safe decimal arithmetic `+-*/()`; unsupported expressions need manual review. A numerical pass is not an exhaustive mathematical audit: the reviewer still checks the complete independent inventory and solution methods.

New inventories are registered automatically. To register existing review-ready packets and see current decisions together:

```text
node scripts/booklet/review-workflow.mjs inventory --run-id RUN
node scripts/booklet/review-workflow.mjs status --run-id RUN
```

`status` is read-only and returns current pending issues, per-page inventory/review keys, representative keys and renderer signature. It recalculates stale state rather than repeating historical prose. All modifying review commands need an actual reviewer record, not generated `checked: true` placeholders. Common fields are:

```json
{
  "reviewer": "Actual reviewer",
  "note": "What was compared and concluded",
  "artifacts": [{"path": "D:/absolute/path/source-review.md", "hash": "SHA-256 of actual file bytes"}]
}
```

Use absolute artifact paths. Preserve source comparisons and decision evidence. Obtain hashes with `Get-FileHash -Algorithm SHA256`, converted to lowercase, or exported `bytesHash(file)`. Files and hashes are checked on every resume, with each artifact read once per live status snapshot.

After resolving a page's editorial issues, add `pages: [{page: 8, key: "inventoryKey from current status"}]` to the common record and run:

```text
node scripts/booklet/review-workflow.mjs review-maths --run-id RUN --input maths-reviewed.json
```

Pages without approved mathematical review wait; unaffected pages may proceed. The author runner reports blocked pages explicitly and completes runnable ones with bounded concurrency. Author-generated findings can be repaired with another immutable author attempt; they do not block their own repair call. They do block representative/final acceptance. A source, correction or review-gate change during a call prevents publishing its now-stale result.

## One correction register, automatic dependent outputs

`RUN/workflow/issues.json` is the authoritative current register. Approved corrections live there once as complete structured patches; `workflow/history.json` stores historical transitions and superseded issue records. Original PDF/Word evidence, canonical generation packets and immutable attempts are not rewritten by correction propagation. Effective inventories/author packets are overlays of those originals, not new independent source evidence.

Review-first configs must not contain the legacy `sourceDecisions` list. Move approved corrections to the register instead of maintaining parallel, potentially contradictory instructions. Later author correction proposals and inventory ambiguities automatically become pending issues; authors cannot approve their own correction records.

A decision record extends the common reviewer fields:

```json
{
  "expectedRevision": 3,
  "key": "reviewKey from current status",
  "corrections": [{
    "id": "p8-confirmed-source-typo",
    "reason": "Approved mathematical correction, with source comparison",
    "sourceRefs": [{"pageNumber": 8}],
    "patches": [
      {"scope": "inventory", "page": 8, "targetId": "p8-stem", "field": "/description", "original": "Find x.", "corrected": "Find y."},
      {"scope": "author", "page": 8, "targetId": "p8-question", "field": "/prompt", "original": "Find x.", "corrected": "Find y."}
    ]
  }],
  "resolutions": [{"id": "issue ID from status", "status": "corrected", "correctionId": "p8-confirmed-source-typo", "reason": "Approved replacement"}]
}
```

Use `status: "retained"` with a reason when the original is correct/intentional, including redundant measurements. No correction is required merely because a given is unused. Bundle all dependent semantic changes (prompt, answer, diagram relationships/code, inventory description/model) in the same approved correction. Do not do blind global string replacements or guess new answers. A patch may replace a structured object as well as a string. `project` scope addresses a project-only content node. Target IDs remain stable; inventory mappings continue to refer to the same content unless an explicit mapping correction is approved.

```text
node scripts/booklet/review-workflow.mjs decide --run-id RUN --input decisions.json
node scripts/booklet/review-workflow.mjs propagate --run-id RUN --project PROJECT
```

`decide` preflights existing dependents, records approved patches and refreshes `workflow/current/*.json` atomically with the register. `assemble-semantic-packets.mjs` and author prompts automatically consume effective corrected inventories/packets. Assembly rebuilds the inventory mappings from these effective inputs. Existing project propagation applies author/inventory/project patches and removes affected content/presentation acceptance, including shared teaching-context checks. Original evidence stays separate; replaying an already-applied patch preserves fresh checks. Stale originals or missing targets stop propagation instead of overwriting another edit. Corrections for not-yet-authored pages should initially target the independent inventory; authoring then consumes those approved values. Add explicit dependent patches when existing authored content needs repair.

Passing `--project` binds only that run's project. Later review commands automatically synchronize its workflow-owned flags and corrections; unrelated flags remain intact. Saves use `saveBookletProject`, optimistic revisions and the shared automatic bank-sync transaction. A concurrent project edit can stop the project save after the register commits; the command fails, the correction remains approved, and `propagate` safely retries after reconciliation. Do not silently replace the user's concurrent edit. Other projects remain pinned under the existing bank rules.

`workflow/current/status.json` and generated project flags are projections, not alternate issue registers; use `status` for live progress. Preserve the run's register and history with its source/recovery evidence. When publishing final booklet provenance, retain the approved correction record with the release's source references; do not treat it as a disposable render cache. No accepted project is migrated merely by installing these tools.

## Representative-page checkpoint

Before bulk authoring, prepare the complete source-pattern and cross-cutting
coverage plan using [the efficiency workflow](booklet-import-efficiency.md).
Use its read-only repair context for known content defects before choosing
another whole-page author attempt. Existing approval and propagation commands
remain the sole acceptance and mutation path.

Pattern IDs are shared across pages. Review their grouping during inventory; distinct source arrangements need distinct patterns. The first inventoried occurrence is the representative. Author it with:

```text
node scripts/booklet/semantic-packets.mjs author --run-id RUN --pages REPRESENTATIVE_PAGES --config CONFIG.json --representative
```

This flag permits only the representative occurrence to proceed before that pattern is approved; it cannot bypass mathematics or authorize bulk pages. Assemble a reviewable candidate, render at final size, compare with source and record the common evidence plus:

```json
{
  "pattern": "triangle-short-response", "page": 8,
  "key": "representativeKey from current status", "renderer": "renderer from current status",
  "finalSize": true, "sourceCompared": true,
  "checks": {"writingBoxes": true, "labelClearance": true, "diagramSizing": true, "sourceColours": true, "alignment": true, "nativeMaths": true},
  "notApplicable": {"attribution": "No attribution heading occurs in this source pattern"}
}
```

```text
node scripts/booklet/review-workflow.mjs approve-pattern --run-id RUN --input representative-reviewed.json
```

Never mark these checks from counts or absence of overflow. Evidence must show the actual current source and authored pattern at intended physical size. Author/source/renderer/evidence changes invalidate the relevant approval. Changes made directly in the project still require affected-pattern inspection; final settlement additionally binds the complete project hash. Then run ordinary author batches for approved patterns. Generated triangles reuse supplied numeric coordinates, and publication checks their actual angles and side ratios; non-uniform scaling is rejected. This validates the declared construction, not arbitrary TeX, labels or final rendered appearance, which still require visual review.

Before approving native-diagram patterns, use the isolated final-size preflight on the assembled representative candidate:

```text
node scripts/booklet/check-compact-exercises.mjs --diagram-preflight --project PROJECT --project-file CANDIDATE.json --out .booklet-work/RUN/preflight
```

It renders question, short-answer and worked-solution compositions at their actual widths, checks calibrated label bounds and source-bound answer-width overrides, and saves PDFs/page images plus measurements. Inspect angle regions, overlays, raster labels and source arrangements separately. Preflight is development evidence; it never writes final acceptance. Label-bounds checks also run during ordinary compact development/final checks.

Unknown inventory mappings can use one bounded `author ... --attempt NEW --repair-from OLD` call against a preserved attempt with a matching input snapshot. It edits only unknown mappings, retains explicit reasons and reruns full validation; real mappings and content cannot change. Other defects require a normal reviewed author attempt. `semantic-packets.mjs metrics --run-id RUN` reports recorded usage and unfinished calls without generation. See the [first implementation package](booklet-angle-relationships-efficiency-review.md#first-package-implemented-tools) for exact boundaries and offline replay.

An isolated author config may opt into `authoringFormat: "shared-diagrams-v1"` to reference shared TikZ source fragments. The runner expands these into ordinary complete diagrams before every existing validator; canonical packets and project schemas do not change. Keep it opt-in pending generation/fidelity measurements. See the [shared-diagram experiment](booklet-angle-relationships-efficiency-review.md#second-package-opt-in-shared-diagrams-and-an-offline-benchmark); its character-count results do not establish token or elapsed-time savings.

New review-first assembly uses configured cover metadata and flexible compact pagination; set `sourcePaginationPolicy: "source-boundaries"` explicitly when required. Historical assembly compatibility retains its previous defaults.

## Development and final acceptance

Use the [booklet change runbook](booklet-change-runbook.md) to organise scoped development checks, cache reuse, stable final inputs and run metrics. Ordinary edits use affected output; final acceptance covers all five editions under the policy below.

```text
node scripts/booklet/check-compact-exercises.mjs --project PROJECT --out .booklet-work/review/PROJECT --development
```

For a deliberate first full development baseline, add `--full-development-reason "Initial import baseline"`. The ordinary development path refuses absent or stale baselines and whole-edition selections without a recorded reason; check the edition and page scope before authorising one.

All editions remain the default; select `--editions student` for an early representative checkpoint. The renderer still paginates the document to discover shifts, but exports/inspects only affected physical pages plus immediate neighbours. First export, missing baselines or `--force` exports all pages. Deleted/inserted pages and shifted tails are included. Page hashes bind rendered DOM, renderer, settings and assets; they are conservative change detectors, not a pixel-equivalence or fidelity certificate. Global style/asset edits can intentionally invalidate more pages.

Development PDFs, page manifests and reports have separate names and never populate final acceptance caches. Partial PDF page numbers in the inspection report are relative to the subset; `selectedPages` maps them back to physical edition pages. Draft/full exports likewise do not become visual acceptance automatically.

After content and repeated-pattern repairs are finished, propagate current status, complete independent content/presentation checks and obtain current `status.reviewKey`. Add `key` to an actual common reviewer record:

```text
node scripts/booklet/review-workflow.mjs propagate --run-id RUN --project PROJECT
node scripts/booklet/review-workflow.mjs settle --run-id RUN --project PROJECT --input content-settled.json
node scripts/booklet/check-compact-exercises.mjs --project PROJECT --out .booklet-work/review/PROJECT --force
```

Settlement requires all selected source pages authored, mathematical review and pattern approvals complete, and no pending issues. `settle` binds the current saved project. A subsequent project edit invalidates it. Non-draft full checks for review-first projects require settled content; original content/presentation readiness checks still apply independently.

### Unique-layout final acceptance

Apply this section only to required full acceptance. Ordinary feedback follows the scoped change runbook; it does not require complete pixel comparisons, all-page footer sheets or a fresh whole-booklet review by default.

Accepted 16 September 2026. This supersedes earlier instructions to manually reread identical pages in all five editions, including trig-specific requirements. It does not reduce mathematical, source-content, teaching/arrangement or final-size diagram checks.

1. Inspect every page of `student`, `short` and `worked` against source and rendered expectations. These are the three standalone content layouts.
2. Retain passed full manifests and automated PDF geometry/navigation checks for **all five** editions. Compare actual PDF RGB pixels at 144 dpi, with zero differing body pixels allowed. The fixed bottom 15 mm footer strip is excluded; no other masks, tolerances, resizing or source/DOM-hash substitutes are allowed. Only A4 portrait pages qualify. Existing printed footer glyphs begin about 12.5 mm above the bottom, so a 12 mm strip is insufficient.
3. Match combined question pages to the same student page and combined answer pages to their standalone answer offset. Different page counts disable reuse for that combined edition. Cover page 1, the final question page and the first answer page always need full inspection. Any other unmatched or different page also needs full inspection.
4. Explicitly review both combined documents' covers, contents, question/answer transitions, numbering, **every footer including the excluded strip**, and links/destinations. Review any content extending into the excluded strip as part of this check. Pixel equivalence does not establish these checks.
5. Credit a duplicate body only after its exact standalone page has an accepted visual inspection and its combined edition has an accepted composition review. An unresolved finding cannot inherit acceptance. Report actual inspections and reused bodies separately; do not mark reused pages `allPagesVisuallyInspected`.

`visual-review.mjs describe` prepares this default policy (`unique-layouts-v1`) using `edition-comparison.mjs`. It retains gzip-compressed full Poppler RGB rasters, PDF/manifest hashes, the comparison implementation hash and measured body fingerprints. Later validation recomputes fingerprints from current raster bytes. Raster caches bind PDF bytes, page, Poppler version, resolution and comparison implementation. Changed inputs invalidate their dependent evidence; unchanged reports and inspections resume without repeat exports.

Implementation verification (16 September 2026): 51 focused comparison, queue, review-workflow and cache regressions passed. A read-only comparison of the existing Probability revision 39 PDFs covered 243 physical pages: 143 combined bodies matched exactly, with six combined cover/boundary pages remaining for full inspection alongside 94 standalone pages. This identifies reuse candidates; it is not renewed booklet/source acceptance or a completed composition review. First rasterisation took 37.535 s, comparison validation 2.062 s and cached preparation 3.018 s on this run. No end-to-end time saving is inferred. The local receipt is `.booklet-work/edition-review-policy-20260916/full-comparison-receipt.json`.

Set `"fullVisual": true` in the descriptor for the supported full-manual fallback. If Poppler/comparison evidence is unavailable, choose this explicit fallback and inspect all five PDFs; never infer a match. Existing full-manual acceptance records remain compatible. For this fallback, final review extends the common reviewer fields with `key`, `sourceCompared: true`, `contentVerified: true`, `presentationVerified: true`, and:

```json
{
  "editions": {
    "student": {
      "allPagesVisuallyInspected": true,
      "manifest": {"path": "D:/absolute/path/PROJECT-student.full.pages.json", "hash": "SHA-256"},
      "artifacts": [{"path": "D:/absolute/path/student-visual-review.md", "hash": "SHA-256"}],
      "pages": [{"page": 1, "hash": "actual manifest page hash", "checked": true}]
    }
  }
}
```

Supply all five edition records and **every** actual page, not just the abbreviated example. Prefer `visual-review.mjs final-record` to emit the correct record. Under `unique-layouts-v1`, pages have `reviewMethod: "visual"` or `"equivalent"` with their verified standalone reference; the record also retains the comparison and explicit composition inspections. Run `review-workflow.mjs final-review --run-id RUN --input final-reviewed.json`. It rejects development manifests, stale project/renderer/settlement/PDF or comparison evidence, missing editions, changed page hashes, unreviewed standalone references and incomplete composition checks. A new settlement requires fresh standalone and exception inspection, current PDF comparison and new composition review; identical pixels do not carry an old settlement's inspection forward.

Compact prompts, reused teaching context, cached inputs and bounded concurrency remain. These controls aim to reduce repair cycles and review payloads, but this change has **not measured end-to-end token or time savings**. Retain actual per-call input/cached/output usage and elapsed times; include retries and review work in any future comparison.

## Resumable run and visual-review tools

Start with environment/source checks and inspect the runnable queue:

```text
node scripts/booklet/run-workflow.mjs preflight --run-id RUN --out .booklet-work/RUN/preflight.json
node scripts/booklet/run-workflow.mjs status --run-id RUN --config CONFIG.json
node scripts/booklet/run-workflow.mjs drain --run-id RUN --config CONFIG.json --pages 1-10
```

`drain` runs actual inventory/author model calls at the existing configured concurrency. It exits when work finishes or remaining pages need explicit review/retry. Complete mathematical review through the existing commands, use `--representative` for the first pattern candidates, inspect/approve those patterns, then drain the remaining pages. Repeat `status`/`drain` to resume. Valid cached generations are retained. After inspecting a failed or stale attempt, `--retry` permits one newer immutable attempt per affected page/stage; it never loops automatically. Targeted mapping repairs still use `semantic-packets.mjs author --repair-from N`. Publication/registration is serialized across processes, with fresh dependency checks inside the lock. Never remove an owned lock to bypass a conflict.

Assembly records its phase automatically. Pass `--run-dir .booklet-work/full-imports/RUN` to `check-compact-exercises.mjs` to record export execution in the same run journal. Its normal full manifests now include individual full-page images; unchanged verified PDF/images are reused. Browser reports retain compile/cache counters and timings. Read the combined receipt at any time:

```text
node scripts/booklet/run-workflow.mjs receipt --run-id RUN --out .booklet-work/RUN/receipt.json
```

Receipts are derived from append-only model and run events. Completed overlapping work counts once. Unfinished attempts/reviews remain visible. Review duration is measured only between an explicit `begin` and `record`; cancel an interrupted session and begin again when ready. Canceled reviews have no completed inspection credit. Unrecorded offline work and historical missing usage remain unavailable.

Prepare a review descriptor JSON with these fields (paths resolve from the working directory):

```json
{
  "projectFile": "booklets/projects/PROJECT.json",
  "sourceFiles": [".booklet-work/full-imports/RUN/source/booklet.pdf"],
  "manifestFiles": [".booklet-work/RUN/PROJECT-student.full.pages.json"],
  "key": "current settlement key"
}
```

For final review, list all five full manifests and retain access to all relevant source evidence. For development preflight, replace `manifestFiles`/`key` with `preflightFile` pointing to `diagram-preflight.json`, plus `outDir` for derived development manifests. Optionally supply `projectId` if the report's key differs from the project ID. This path cannot create a final queue. Then:

```text
node scripts/booklet/visual-review.mjs describe --run-id RUN --input descriptor.json --out review-input.json
node scripts/booklet/visual-review.mjs prepare --run-id RUN --input review-input.json
node scripts/booklet/visual-review.mjs status --run-id RUN --out review-status.json
```

Status prints a compact pending-page sample with the current revision/session key and any active inspection. `pending` contains pages needing actual inspection; `awaitingReuse` contains matching bodies waiting for standalone/composition acceptance; `pendingComposition` lists combined editions still needing structural review. `reviewed` counts actual full-page inspections and `reused` counts accepted duplicate bodies. `--out review-status.json` or `--full` retains the complete lists, image/source paths and previous findings. Open the actual source and full-page output to inspect; the queue never infers inspection from source hashes. `begin --input begin.json` accepts:

```json
{"expectedRevision":1,"sessionKey":"from status","pageKeys":["current page key"]}
```

After inspecting those pages, use `record --input inspection.json` with the updated revision from `begin`, its `active.id` as `reviewId`, and actual observations:

```json
{
  "expectedRevision":2,"sessionKey":"from status","reviewId":"active id",
  "reviewer":"Actual reviewer","note":"Specific checks and observations",
  "outcome":"accepted","sourceCompared":true,"contentVerified":true,"presentationVerified":true
}
```

To review composition, use `begin` with `compositionEditions: ["with-short", "with-worked"]` instead of `pageKeys`. Inspect their actual PDFs, then use `record` with current revision/session/review ID, reviewer, note, `outcome: "accepted"`, and:

```json
{"compositionChecks":{"covers":true,"contents":true,"transitions":true,"numbering":true,"footers":true,"links":true}}
```

These fields record completed observations, not a checklist to prefill. Composition inspection receives its own timed phase and immutable artifact; it does not count as full-page content inspection. Source/standalone content checks are still required independently.

Use `outcome: "needs-change"` to retain a defect for correction; it remains pending even when its body matches. `cancel` takes the current `expectedRevision` and `sessionKey`. Inspection records are immutable artifacts, while queue state is updated atomically. Stale project/source/asset/render/PDF/image, comparison or inspection evidence is rejected. During development, preparing new evidence invalidates changed pages and pagination neighbours and retains other current inspection records. The same unchanged final settlement can resume inspection; a new final project or settlement resets actual inspection and composition credit, including for pixel-identical pages.

Once every final page is covered by actual inspection or verified duplicate reuse, and both combined composition reviews pass, `final-record --input signer.json --out final-reviewed.json` takes current `expectedRevision`, `sessionKey`, `reviewer` and `note`. It emits the complete record for `review-workflow.mjs final-review`. Dependencies retain source, images, comparisons, rasters and individual inspection artifacts. Describing or preparing a queue never independently certifies content. All queue artifacts, render caches and event journals remain local, ignored evidence under `.booklet-work/`.
