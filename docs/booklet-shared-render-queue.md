# Shared render queue

New bounded feedback QA can use `scripts/booklet/render-queue.mjs`. This is an opt-in host-side scheduler over the existing pinned feedback renderer and shared Chromium engine. It does not publish booklets, approve work, migrate active jobs, modify accepted pins or replace visual inspection. Legacy runners remain unchanged.

## What changes

Submit a revision-bound, authorized job once. A worker waits while resources are busy and starts it when admission passes; no repeated manual lane handoff is needed. Up to three workers can drain the same queue. An exclusive short transaction serializes slot allocation; a durable token is written before reserving an existing concrete lane lock. Starting, running and uncertain jobs all consume capacity. The policy stays at three hosts globally, at least6GiB available memory and3GiB free disk, with fresh checks before server/checker startup.

Each job snapshots exact input bytes, binds all input-role hashes into the authorized request digest, checks the live project/revision, and uses an immutable runtime pin and exact cache fingerprint. Candidate/baseline identity, allowed-path inverse, blocks, editions and settings are checked before admission. One booklet cannot be concurrently owned by two queue jobs. Browser execution uses the existing shared engine binding, its UUID registry and isolated operation-local profile/temp/download/log paths; engine binaries are not copied per host.

Busy capacity or an unrelated registered/unknown operation leaves an **unattempted waiting job**. It may be admitted later without asking for another lease. A render that actually starts gets one attempt: failure does not automatically retry. Expired/changed authorization, source drift and invalid scope are blocked. A successful automated render remains separate from actual visual acceptance.

## Coordinated rollout is mandatory

Old immutable runners do not share the queue transaction. Before enabling new admissions, Geometry and Exam must acknowledge a bounded **no-legacy-admission window**, reconcile actual processes, all legacy claims/locks and browser registries, and record the exact inventory. Active legacy jobs finish normally first. Never infer release from process age, a heartbeat timeout, or absent parent PID alone.

The activation record has this shape (replace placeholders with actual evidence, never fabricate an acknowledgement):

```json
{
  "kind": "shared-render-queue-rollout-v1",
  "coordinators": ["Geometry", "Exam"],
  "legacyAdmissionPaused": true,
  "legacyScopeReconciled": true,
  "expiresAt": "<bounded agreed window end>",
  "implementationSha256": {"render-queue.mjs":"<tested hash>","shared-render-queue.mjs":"<tested hash>","shared-render-runner.mjs":"<tested hash>","observed-abort-verifier.mjs":"<tested hash>"},
  "evidence": [{"file": "<coordinator acknowledgement>", "sha256": "<exact hash>"}],
  "registryRoots": ["<every reconciled legacy shared-browser registry>"],
  "additionalLocks": ["<every reconciled alternate legacy host lock>"]
}
```

The requested runtime's own browser registry is always checked even if omitted from the list. The three canonical `geometry-laneN-host.lock` paths are always checked and reserved with exclusive file creation; legacy file and directory locks both prevent overlap. No legacy coordination JSON is rewritten. A complete explicit alternate-lock/registry inventory and the coordinated barrier remain necessary: these three paths alone cannot police arbitrary old or external launchers. An unregistered Chrome/probe/server causes waiting and is never killed or adopted by a path substring.

The activation file and the three tested host-tool implementation hashes are bound and checked again immediately before each server/checker launch. A code change needs a reviewed activation update; do not blind-refresh its hashes. On window expiry, no further launch is admitted. Keep the queue worker outside the immutable runtime; existing capable pins can be reused when print dependencies match. A genuinely changed renderer, including the existing lazy-diagram `flushPending` fix, requires the normal supported new-pin procedure. Queue installation is not permission to use a stale renderer or blind-refresh hashes.

## Submit and drain

The queue uses `.booklet-work/shared-render-queue-v1` by default. Inspection/status is read-only and does not initialize it:

```powershell
node scripts/booklet/render-queue.mjs status
```

A submission JSON has `{request, authorizationFile, authorizationSha256, inputs}`. `inputs` is an array of `{role,file,sha256}`; role names are unique safe names. Include at least distinct `baseline` and `candidate` inputs. Baseline bytes must equal the current live project. All input roles/hashes, including evidence, must appear exactly in `request.inputHashes`.

The request fields are:

```text
kind: pinned-feedback-render-v1
owner: existing responsible coordinator
projectId, projectFile: canonical booklets/projects/<id>.json
projectRevision, projectSha256: exact current live head
baselineInput, candidateInput: input role names
inputHashes: {role: exactSHA256, ...}
runtime: {pinRoot, pinHash, manifestFile, manifestSha256, cacheFingerprint}
liveGuards: [{file,sha256,revision?,projectId?}, ...]
blocks: exact mutation block IDs
selectionBlocks?: print selection IDs (otherwise blocks)
allowedPaths: exact approved JSON pointers; inverse must restore baseline
editions, checksOnly: explicit supported edition arrays
fullDevelopmentReason?: explicit approved reason when affected selection covers a whole edition
dependsOn?: [{jobId,requireInspection:true}, ...]
```

The authorization is one existing, explicitly approved bounded render scope, not a new request for user approval on every host booking. Its record must be produced by the responsible coordinator from actual authorization/clearance evidence. The queue cannot create approvals. Bind it using the exported canonical `requestHash(request)`:

`fullDevelopmentReason` is optional, must be a nonblank string of at most 2000 characters without NUL, and is forwarded unchanged as one `--full-development-reason` argument to the pinned checker. It has no default: the existing full-development guard still refuses an unexplained whole-edition selection, including a two-page Short edition. The exact reason and edition scope are part of the authorized request hash; adding, changing or removing the reason needs a newly bound grant. This field supplies the existing guard's named cause, and does not expand allowed paths, authorize retries or publication, or change resource/ownership/runtime admission. Preserve accepted unchanged edition evidence; do not repeat Student merely to recover incomplete Short/Worked checks.

```text
kind: bounded-render-authorization-v1
owner: same as request.owner
requestHash: canonical request digest
executionAuthorized: true
publicationAuthorized: false
maxAttempts: 1
expiresAt: actual approved admission deadline
admission: {
  projectId, projectRevision, projectSha256,
  projectNonoverlap:true, scopeApproved:true, pilotAllowed:true
}
```

These booleans record completed real decisions; they do not waive missing project clearance, pilot stops or a denied action. Bind supporting records as immutable inputs/live guards. Resuming previously stopped or denied work still follows its existing approval rules.

```powershell
node scripts/booklet/render-queue.mjs enqueue --manifest <submission.json> --activation <activation.json> --activation-sha <hash>
node scripts/booklet/render-queue.mjs work --owner <coordinator> --activation <activation.json> --activation-sha <hash>
```

Run the worker through the normal supported hidden/background process route when appropriate. Multiple workers share one queue. Workers wait while unattempted jobs remain queued/waiting, subject to each authorization/window deadline; they exit after the idle interval only once no pending admission remains. `--once` is an explicit single admission check. No shell command from a job is executed: the adapter invokes only the pinned Node/check-feedback-pages route with validated arguments. It captures child output and records server/checker intent, process birth identity, terminal result and closure.

For a horizon requiring visual acceptance before its next packet, set dependencies with `requireInspection:true`. After inspecting actual output, the owning coordinator records a JSON review bound to `{jobId,manifestHash,token,accepted}` and registers its exact file/hash:

```powershell
node scripts/booklet/render-queue.mjs inspect --job <id> --owner <owner> --file <review.json> --sha <hash> --activation <activation.json> --activation-sha <hash>
```

The bound inspection file is rehashed before dependent admission. A rejected inspection fails that job; it does not authorize another attempt. Other independent jobs may proceed only under their own authorization and existing programme stop rules.

## Failure and recovery

`state.json` atomically records status, history, immutable manifest hash, worker ownership, attempt token, reservation and closure. Per-job attempt directories retain logs, exact startup intents, child birth/exit records, checker report hashes and terminal/cleanup errors. `succeeded` means automated rendering plus normal resource closure, not published or visually accepted.

- `queued`/`waiting`: no render attempt; busy resources are retried at admission only.
- `blocked`: changed/expired scope or admission evidence; no render starts automatically.
- `running`: token and slot owned, including startup/closing.
- `failed`: known terminal/content/visual failure with normal resource closure, or separately verified observed-abort failure as described below; no automatic retry.
- `uncertain`: possible startup/spawn/browser/pin/cleanup issue; slot and reservation remain owned.

Known no-checker-start refusals have explicit intent/absence proof and normal server closure, so they can release as failed. Content drift fails the job but does not retain a normally closed resource merely because a live document changed. Immutable pin, snapshot, token or actual cleanup uncertainty still retains ownership.

```powershell
node scripts/booklet/render-queue.mjs recover --job <id> --token <original-token> --activation <activation.json> --activation-sha <hash>
```

Recovery requires the recorded worker to be dead and the original token's complete server/checker/browser closure proof; age alone never reclaims a slot. PID reuse/uncertain liveness remains held. Recovery does not rerender. External lock release is same-token idempotent only after valid closure; a foreign/changed lock is retained. If a writer crashed holding `transaction.lock`, the library's `recoverTransactionLock({token})` similarly requires its exact owner token and proven dead writer; partial/unknown metadata requires explicit reconciliation. No force-clear command exists.

If an interrupted attempt has no normal outcome records, a distinct failure-only reconciliation is available:

```powershell
node scripts/booklet/render-queue.mjs abort-observed --job <id> --token <original-token> --owner <owner> --activation <activation.json> --activation-sha <hash>
```

This requires the exact uncertain owner/token, immutable inputs and original pin, absence of normal outcome records, two fresh Windows process/listener inventories, absence of the original worker/checker and descendants, original server/port and browser leases, and the unchanged reservation. It records `actualChildExitCode: null`, `normalClosureKnown: false` and `renderPassed: false` in a separate receipt. Pending reconciliation remains `uncertain` and counts against capacity and project ownership until the exact reservation is released; only then does it become `failed`. Crash recovery rechecks the receipt, fresh host state and same reservation. It never fabricates normal shutdown evidence or grants audit, inspection or publication credit. A later render requires a distinct authorized request. Windows host inventory must run with access to CIM; an inaccessible inventory retains ownership.

Action-time admission errors retain the refused reason and resource counts without changing admission predicates. For bounded `--blocks` feedback checks, affected pages and neighbours remain gating; unrelated page QA is retained as `offScopeIssues`, not reported as repaired. Full/checks-only editions continue to check every page.

## Compatibility and limits

Focused tests cover competing processes, three-slot capacity, memory/disk boundaries, immutable role substitution, revision/auth drift, single-attempt failure, inspection dependencies, token ownership, durable reservation intent, recovery, process ancestry/PID reuse, exact server provenance, shared-engine environment and legacy pinned launch behavior. No existing accepted pin or active host is migrated. Real queued PDF rendering must be verified on the first authorized current-pin job; fixture tests alone do not establish visual correctness.

The adapter supports bounded feedback QA on an existing current project with a byte-exact current baseline, including explicitly approved new Exam blocks whose array insertion has an exact inverse. Mutation/selection IDs must exist in the before or candidate project; the existing checker still enforces repair scope. Initial source/maths/rating review and approval for new questions remain the coordinator's responsibility. This is not a general importer, publisher, arbitrary shell scheduler, persistent shared browser/profile, or replacement for actual-print inspection. Legacy direct callers and third-party probes need coordinated adoption; they cannot safely be mixed freely with queued admissions.
