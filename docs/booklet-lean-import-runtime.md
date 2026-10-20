# Lean import runtime

Textbook work not yet started follows the [18 October 2026 streamlined policy](booklet-three-pass-import.md#streamlined-textbook-imports-18-october-2026-user-approved), including combined concise source indexing/organisation, reuse of proven ordinary early layouts and no pedagogy stage. Preserve running workers and completed evidence; adopt on the next launch or completed boundary.

> Since 5 October 2026 new imports use the [lean review route](booklet-three-pass-import.md#lean-review-route-no-ledger-5-october-2026-user-approved) for review, export and visual inspection. `lean-import.mjs inventory|author|sample` below still apply; its `review`, `export` and `visual` commands remain for runs already using them.

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

Use one shared pool directory for related inventory, authoring and review commands. Launch a command once and read its result and checkpoint when it exits; do not poll it from a model session. The pool refills when each job finishes, uses the existing question/teaching/visual dependency exclusions, retains successes and does not retry automatically. A failed job pauses only its own run; other ready runs keep their slots. Approved corrections returned by a review are published through the existing serialized `publishStageCorrections` as each result settles; a publication that cannot proceed pauses that run for the normal correction handoff. Only the run whose state changed is re-planned. Canonical ownership and revision checks remain authoritative.

Two failed deliveries of an unchanged job persist across command restarts. Before a third delivery, supply `review ... --regenerate-reason "Diagnosed cause and changed approach"`. Planning failures drain workers before the command exits. The pool coordinates only commands using that pool: include every participating run and adopt after earlier campaign workers have drained. Author at most two booklets at once and give the remaining capacity to the booklet nearest acceptance; the pool already orders ready runs that way.

## Authoring and complete handoffs

```powershell
node scripts/booklet/lean-import.mjs inventory --run-id BOOKLET-RUN-ID --config CONFIG.json --pages 1-10 --pool .booklet-work/RUN/pool --concurrency 3
node scripts/booklet/lean-import.mjs author --run-id BOOKLET-RUN-ID --config CONFIG.json --pages 1-10 --pool .booklet-work/RUN/pool --concurrency 3
```

Independent inventory and semantic authoring still use the canonical source packets, assignment limits, continuation handling and validators. Authoring batches up to four complete questions using existing assignment planning; it never splits a shared stem. Teaching selections can use the existing guarded `authoringContextByInventoryId` configuration when an explicit source-bound selection is available.

Review uses the complete canonical source-context ticket rather than adding duplicate whole-page inventories, historical author envelopes or application files. Three-pass review jobs carry skill definitions, teaching and section context once per job; the 24,000-character budget counts each additional complete question, and the four-question cap, shared stems and exercise boundaries are unchanged. Source, mathematics, answers, classifications, taught methods and applicable image/shading/visibility judgments remain in the same independent content pass. Run the existing `--diagram-preflight` and packet validators on each authored batch before review, so compile and binding defects are found before export.

Layout and metadata edits already leave three-pass review dependencies unchanged, because the canonical question hash excludes them. There is no separate retention command, prompt codec or author template catalogue; they were removed on 4 October 2026 after an offline benchmark showed the codec contributed 0–7% and the remaining reduction came from dropping duplicated supplements.

## Benchmark arms

A fresh run may record `benchmarkArm: {id, reason}` for an explicit user-requested model comparison (currently `claude-sonnet-5-5-relay`). Its manifest records the actual provider and model. The Codex runner refuses it; `relay-runner.mjs` writes each canonical prompt and image list under `POOL/relay/pending` and waits for the worker's `relay-response.json`, then the normal validators and recording apply. Usage is recorded as unavailable, never estimated. Production runs remain Sol 6.1 medium.

## Early layout sample

```powershell
node scripts/booklet/lean-import.mjs sample --run-id BOOKLET-RUN-ID --project PROJECT-ID --project-file CANDIDATE.json --out .booklet-work/full-imports/BOOKLET-RUN-ID/layout-sample [--limit 8]
```

The three-pass profile asks for a small sample of difficult layouts to be checked, and shared causes fixed, before authoring scales up. Run this once the first teaching and practice pages are authored into a candidate project, and again after any shared layout change. It picks every block carrying a figure (diagrams and images are where placement and page splits fail), then the densest block of each other layout family, using the same family and density rule as final page selection. It draft-renders the candidate's student and worked editions through the frozen runtime, rasterises only the pages carrying those blocks and writes `layout-sample.json`. It makes no model call and records no acceptance: look at the listed pages at final size and fix causes (arrangement, diagram width, page splits) before authoring the rest. A manual override that only clears an automated overflow check is not a layout fix; inspect the page it produces.

## Freeze and resume five-edition checks

```powershell
node scripts/booklet/lean-import.mjs export --run-id BOOKLET-RUN-ID --project PROJECT-ID --out .booklet-work/full-imports/BOOKLET-RUN-ID/final-exports-LEAN --visibility-reviews VISIBILITY.json
```

The runtime snapshot includes current uncommitted bytes and starts a separate localhost process whose working directory is the snapshot. Watching/HMR is disabled and that process closes on success or failure. It leaves the Studio server untouched. Existing compiled diagram caches stay accessible through their version/checksum guards. The export checker keeps its full five-edition requirement, source/settlement/diagram/layout/navigation gates and existing manifest/cache eligibility checks. Each uncached edition starts from a fresh document while retaining the browser context's diagram cache. Exports through the entry point are locked per run.

After interruption, repeat the same command and output directory while its dependencies match. Passing editions and PDF bytes remain in place; the normal checker establishes actual reuse. Canonical run-local `final-exports-*` directories can also seed eligible prior editions through the existing cache helper. No PDF or hash substitutes for the required visual inspection. An actual dependency change names changed files and requires a new output directory rather than overwriting old evidence. Two recorded export failures require a diagnosis and changed approach through `--regenerate-reason` before a third attempt.

## Final visual review is scheduled work

A passed five-edition export is automated evidence only; its receipt records `visualAcceptance: false`. `export` therefore finishes by binding the exporter's own selected pages (layout families and their densest examples, one ordinary page per exercise, covers, answer transitions, flagged pages) to the existing visual review queue, and reports the result as `visualReview`. A problem preparing the queue is reported there and never hides that inspection is still pending. To prepare it again without exporting:

```powershell
node scripts/booklet/lean-import.mjs visual --run-id BOOKLET-RUN-ID --project PROJECT-ID --exports .booklet-work/full-imports/BOOKLET-RUN-ID/final-exports-LEAN
```

Preparation requires a settled project and all five passed edition manifests, and the queue is guarded by the same renderer, project and asset hashes as the export. `review --runs` then dispatches the pending page inspections through the shared pool alongside any content review; standalone pages are inspected; since 5 October 2026 combined editions queue only their covers, transitions and flagged pages (see the [lean cut](booklet-three-pass-import.md#lean-cut-5-october-2026-user-approved)). When no page is pending, record the final review with `visual-review.mjs final-record` and then `review-workflow.mjs final-review`. A booklet is not delivered while this queue has pending pages.

## Measure before claiming savings

Low-risk efficiency changes (20 October 2026): newly generated author assignments run the existing blocking maths-text lint before their results enter the assignment cache. Retained successful assignment caches and worker prompts are unchanged. Layout samples and final lean exports report the existing solid/image acceptance issues before copying or launching the frozen renderer; this is an earlier diagnostic, not a new review or an exemption. Unreferenced private assets belonging to another verified Studio project can be ignored by the existing scoped export guard, as can those belonging to a registered import run. Own assets, shared/unknown namespaces, referenced assets, project bytes, frozen runtime and PDFs remain guarded.

The ICE-EM campaign's local `repair-queue.mjs` accepts explicitly diagnosed chapter failures with `enqueue RUN_ID DIAGNOSED_CAUSE`. Its `run` mode processes nearer-delivery repairs first, reserves ownership and runs each ticket once through the ordinary chapter pipeline. Tickets bind the failure, project and config bytes and become stale if these change. The queue waits for the historical continuation dispatcher to drain, preserving its active workers and avoiding an admission race with its already-loaded scheduling code. It never infers acceptance from a retry, removes dead leases, or automatically retries a failed repair. Queue files, logs and its dated tests stay in the canonical campaign folder.

Every pool event records the number of active workers, so slot occupancy is measured rather than inferred from overlapping call durations. Checkpoints (after ten newly completed source pages, thirty active minutes and at command exit) store receipt summaries. Read complete-job coverage and unavailable metrics; preserve the canonical source page, review, export and local-replay counts.

No accepted whole-import time reduction or two-hour completion target has yet been established. Do not claim savings from prompt size alone; benchmark a representative booklet including independent review, repairs and export reuse.
