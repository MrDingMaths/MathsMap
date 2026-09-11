# Review-first transcription

Required for new semantic runs (`workflowPolicy: "review-first-v1"` in new manifests). Existing projects, historical evidence and exact-mode compatibility are unchanged. An older semantic run can opt in through its config, but its independent inventory must first supply the review fields below. This adds gates to the [direct compact workflow](booklet-direct-compact-import.md), not a replacement for the [feedback checklist](booklet-transcription-feedback-checklist.md).

## Initial contract

- Keep independent source inventory and complete final visual inspection. Counts, generation caches and numerical checks do not establish fidelity.
- Retain every printed measurement, including redundant givens. **Unused is not a defect.** Check consistency with the diagram and stated rounding precision before proposing a correction. Unknown precision is a review question, not permission to change a value.
- Inventory mathematical relationships early, bundle editorial decisions, and author unaffected pages while decisions are pending. An explicit decision to retain an unusual source value does not certify incorrect authored geometry.
- Approve final-size representatives of every distinct pattern before bulk authoring that pattern. Include writing boxes (including superscripts/fractions), label clearance, diagram size, attribution headings, source colours, alignment and native maths. State why an absent category is not applicable. Review label placement and appearance separately from numerical geometry.
- Render affected pages and pagination neighbours during development. Settle content, then check and visually inspect **all pages of all five editions**: `student`, `short`, `worked`, `with-short`, `with-worked`.

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

New review-first assembly uses configured cover metadata and flexible compact pagination; set `sourcePaginationPolicy: "source-boundaries"` explicitly when required. Historical assembly compatibility retains its previous defaults.

## Development and final acceptance

Use the [booklet change runbook](booklet-change-runbook.md) to organise scoped development checks, cache reuse, stable final inputs and run metrics. It preserves the complete final five-edition review and re-settlement requirements below.

```text
node scripts/booklet/check-compact-exercises.mjs --project PROJECT --out .booklet-work/review/PROJECT --development
```

All editions remain the default; select `--editions student` for an early representative checkpoint. The renderer still paginates the document to discover shifts, but exports/inspects only affected physical pages plus immediate neighbours. First export, missing baselines or `--force` exports all pages. Deleted/inserted pages and shifted tails are included. Page hashes bind rendered DOM, renderer, settings and assets; they are conservative change detectors, not a pixel-equivalence or fidelity certificate. Global style/asset edits can intentionally invalidate more pages.

Development PDFs, page manifests and reports have separate names and never populate final acceptance caches. Partial PDF page numbers in the inspection report are relative to the subset; `selectedPages` maps them back to physical edition pages. Draft/full exports likewise do not become visual acceptance automatically.

After content and repeated-pattern repairs are finished, propagate current status, complete independent content/presentation checks and obtain current `status.reviewKey`. Add `key` to an actual common reviewer record:

```text
node scripts/booklet/review-workflow.mjs propagate --run-id RUN --project PROJECT
node scripts/booklet/review-workflow.mjs settle --run-id RUN --project PROJECT --input content-settled.json
node scripts/booklet/check-compact-exercises.mjs --project PROJECT --out .booklet-work/review/PROJECT --force
```

Settlement requires all selected source pages authored, mathematical review and pattern approvals complete, and no pending issues. `settle` binds the current saved project. A subsequent project edit invalidates it. Non-draft full checks for review-first projects require settled content; original content/presentation readiness checks still apply independently.

Inspect **every page in all five full PDFs** against source and rendered expectations. Final review extends the common reviewer fields with `key`, `sourceCompared: true`, `contentVerified: true`, `presentationVerified: true`, and:

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

Supply all five edition records and **every** actual page, not just the abbreviated example. Run `review-workflow.mjs final-review --run-id RUN --input final-reviewed.json`. It rejects development manifests, stale project/renderer/settlement/PDF hashes, missing editions, changed page hashes and incomplete page inspection. Page hashes identify later edits; they never waive the required complete final visual review after content changes and re-settlement.

Compact prompts, reused teaching context, cached inputs and bounded concurrency remain. These controls aim to reduce repair cycles and review payloads, but this change has **not measured end-to-end token or time savings**. Retain actual per-call input/cached/output usage and elapsed times; include retries and review work in any future comparison.
