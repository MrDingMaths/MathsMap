# Lean import runtime

Implemented 3 October 2026 after the six-booklet FDP timing review. This is an explicit execution option for runs already recording `textbook-three-pass-v1`, Sol 6.1 medium and Standard speed. It does not migrate historical manifests, waive a check, change application APIs, publish to the bank or tune spacing.

## Adopt at a completed batch boundary

Do not replace a running campaign's helpers or steal its worker leases. Let active source batches finish and record completed review results. `review` refuses unresolved existing owners and active source-worker leases. A completed immutable review can be recorded through the ordinary API without another model call; a correction result returns to the existing propagation and revision-safe save handoff.

Create a run list with absolute paths:

```json
[
  {
    "runId": "BOOKLET-RUN-ID",
    "configFile": "D:/WebApps/MathsMap/.booklet-work/RUN/config.json",
    "projectFile": "D:/WebApps/MathsMap/.booklet-work/RUN/candidate.json"
  }
]
```

```powershell
node scripts/booklet/lean-import.mjs plan --runs .booklet-work/RUN/runs.json
node scripts/booklet/lean-import.mjs review --runs .booklet-work/RUN/runs.json --pool .booklet-work/RUN/pool --concurrency 3
```

Use one shared pool directory for related inventory, authoring and review commands. The pool refills when each job finishes, uses the existing question/teaching/visual dependency exclusions, retains successes, drains active jobs on failure and does not retry automatically. It pauses a run requiring correction propagation while other ready runs can finish. Canonical ownership and revision checks remain authoritative. Project publication remains the normal serialized save operation; the dispatcher does not save projects.

Two failed deliveries of an unchanged job persist across command restarts. Before a third delivery, supply `review ... --regenerate-reason "Diagnosed cause and changed approach"`; other unaffected runs can still finish. Planning failures also drain workers before the command exits. The pool coordinates only commands using that pool: include every participating run and adopt after earlier campaign workers have drained.

## Authoring and complete handoffs

```powershell
node scripts/booklet/lean-import.mjs inventory --run-id BOOKLET-RUN-ID --config CONFIG.json --pages 1-10 --pool .booklet-work/RUN/pool --concurrency 3
node scripts/booklet/lean-import.mjs author --run-id BOOKLET-RUN-ID --config CONFIG.json --pages 1-10 --pool .booklet-work/RUN/pool --concurrency 3
```

Independent inventory and semantic authoring still use the canonical source packets, assignment limits, continuation handling and validators. Authoring batches up to four complete questions using existing assignment planning; it never splits a shared stem. Teaching selections can use the existing guarded `authoringContextByInventoryId` configuration when an explicit source-bound selection is available.

The default optional native recipes supply editable document/diagram structure. The author explicitly supplies IDs, content, mathematical values, geometry and dimensions. No recipe generates a solution, approval or spacing reduction. Expansion occurs before ordinary packet validation and independent review. `--templates FILE` selects another explicit recipe catalogue; every declared slot is mandatory and overlapping slots are rejected.

Review uses the complete canonical source-context ticket rather than adding duplicate whole-page inventories, historical author envelopes or application files. Required source/teacher images and retained image assets are attached. Source, mathematics, answers, classifications, taught methods and applicable image/shading/visibility judgments remain in the same independent content pass.

`lean-import-context-v1` losslessly indexes repeated JSON values. Decoding must reconstruct the original payload exactly. Exact repair values, JSON pointer scopes, source identities and artifact hashes remain available. Small payloads keep the uncompressed form. The immutable ticket retains the full context and pins its delivery profile; an existing ticket cannot change profile. Review batch measurement includes the diagram/image supplement. Each worker retains a `lean-delivery.json` with actual prompt, hashes, character counts, image order and unchanged provider usage. Canonical limits still allow justified indivisible contexts; exceeding the budget is not hidden.

## Retain unchanged actual reviews together

```powershell
node scripts/booklet/lean-import.mjs retain --runs .booklet-work/RUN/runs.json
```

New opt-in assessments bind their actual immutable ticket/result, final reviewed semantic scope and taught-source context. Batch retention compares those hashes, checks original artifacts and pending findings, then uses the normal verification transaction once. Layout and metadata do not create mathematical review credit. Changed answers, classifications, source identities, response requirements, methods, sources or unverified dependencies remain pending. Already-current records are left alone. Older reviews without this binding retain their historical evidence; the tool does not guess a new binding or silently migrate them. Render/diagram checks and selected-page visual checks remain separately required after printable edits.

This retention command supports individual-source projects. Merged projects keep their canonical source-specific workflow; no retention binding is guessed across imported runs.

## Freeze and resume five-edition checks

```powershell
node scripts/booklet/lean-import.mjs export --run-id BOOKLET-RUN-ID --project PROJECT-ID --out .booklet-work/full-imports/BOOKLET-RUN-ID/final-exports-LEAN --visibility-reviews VISIBILITY.json
```

The runtime snapshot includes current uncommitted bytes and starts a separate localhost process whose working directory is the snapshot. Watching/HMR is disabled and that process closes on success or failure. It leaves the Studio server untouched. Existing compiled diagram caches stay accessible through their version/checksum guards. The export checker keeps its full five-edition requirement, source/settlement/diagram/layout/navigation gates and existing manifest/cache eligibility checks. Each uncached edition starts from a fresh document while retaining the browser context's diagram cache. Exports through the entry point are locked per run.

After interruption, repeat the same command and output directory while its dependencies match. Passing editions and PDF bytes remain in place; the normal checker establishes actual reuse. Canonical run-local `final-exports-*` directories can also seed eligible prior editions through the existing cache helper. No PDF or hash substitutes for the required visual inspection. An actual dependency change names changed files and requires a new output directory rather than overwriting old evidence. Two recorded export failures require a diagnosis and changed approach through `--regenerate-reason` before a third attempt.

## Measure before claiming savings

The pool records dispatch/completion/failure events and emits duration receipts after ten newly completed source pages or thirty active minutes. Read complete-job coverage and unavailable metrics; do not add overlapping worker durations as elapsed time. Preserve the canonical source page, review, export and local-replay counts.

An offline comparison on nine retained source-context tickets reduced delivered prompt sizes by 30–85% chiefly by removing duplicated campaign supplements. It made no model calls and measures delivery size only. No accepted whole-import time reduction or two-hour completion target has yet been established. Benchmark a representative teaching section, including independent review, repairs and export reuse, before changing routine batch sizes further.
