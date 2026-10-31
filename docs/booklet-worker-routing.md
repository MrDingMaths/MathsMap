# Booklet worker routing (31 October 2026, user approved)

This governs future assignments. Preserve running jobs, completed reviews and actual provenance; do not repeat work to change its route or model. Sol 6.1 Low orchestrates the programme; one owner publishes live project/bank changes and owns Git commits. Existing revision, source fidelity, rating and visual gates remain.

## Choose the route

- Use native subagents by default for local inspection, inventory, retained-evidence reconciliation, testing, diagnosis and actual visual QA. Assign disjoint booklet/file scope and read/write boundaries. Local inspection is not a new formal independent maths assessment.
- Use a fresh-context native `gpt-6.1-terra` High reviewer for an independent booklet review where the available tool can deliver the complete bounded question, answer, source/teaching context and required images and return usable evidence. Give the reviewer the task and relevant source evidence, not the coordinator's whole conversation or a leading preferred verdict. Preserve source-first independence and actual model/effort provenance.
- Keep CLI execution for specifically authorized Sonnet/provider work and sealed batches that genuinely need exact image-attachment capture, per-call metrics, machine-readable outputs or durable resume. New content still uses exactly `claude-sonnet-5-5`; no fallback is implicit. The existing CLI route remains available when native tools cannot deliver a required formal-review capability. Name that reason rather than creating a second review.
- Count native formal reviewers and CLI model workers together against the canonical three-worker limit per booklet across sessions. The coordinator schedules them; a bounded worker does not start further workers or model calls. Preserve render-lane/resource limits and serialized publication. Do not occupy slots with redundant checks.

## Give authorization context once, at the outset

Before a delegated external action, pass the relevant original user disclosure and reply as conversation/task context, together with the exact bounded payload, destination/model/effort, purpose, attachments and exclusions. Preserve the user's words and distinguish permission from actual execution. Do not copy credentials, real student information or unrelated personal data. Do not place approval evidence into shell/tool action arguments.

Standing authorization covering an ordinary action does not require an additional workflow-created manual approval hold. A genuinely new scope or an actual automatic-review denial is different. After denial, stop that operation; retry only once per materially new relevant evidence when known unexecuted. Reconcile uncertain execution first. Do not repackage, change destination, switch route or delegate the denied action to bypass review. A model-route change never clears a denial.

## Diagnose the failure before escalating

Separate technical launch/ENOENT/startup failures, quota, parser recovery, uncertain remote execution, sandbox escalation and actual disclosure/save refusal. Reuse completed outputs; recover valid retained captures locally rather than paying for another call. On this Windows machine, an authorized CLI runner uses outer `require_escalated` from its first launch as AGENTS requires, while its worker remains read-only. This requirement is not blanket data-sharing or content-save permission.

The shared CLI wrapper currently uses `--ephemeral --ignore-user-config --sandbox read-only`. Do not assume it inherits coordinator user-config preferences. Use repository cwd where appropriate so repository instructions are discoverable, and include task-relevant instructions explicitly when a temporary cwd is necessary. Keep caller payload context bounded; do not append the entire campaign transcript.

No sandbox, network, custom rule, approval policy or managed reviewer setting is changed by this workflow. Such a change needs a separate exact proposal. Do not remove `--ignore-user-config` or weaken restrictions as an unreviewed shortcut.

## Prompt-context helper

`scripts/booklet/worker-authorization-context.mjs` exports `workerAuthorizationContext(envelope, expectedScope)` for native/provider handoff preparation and `withWorkerAuthorizationContext(prompt, options)`. The existing `runAstraTask` accepts `authorizationContext` and `authorizationScope`, validates them before acquiring a slot, and includes the context only in prompt stdin. Actual Codex model/effort and image paths must match. Existing un-enveloped calls remain compatible; new delegated external actions should supply both fields from their prepared scope and actual user evidence. There is no automatic retry or claim that missing historical context invalidates already completed work.

The envelope contains `scope`, `originalDisclosure:{messageId,text}` and `originalApproval:{messageId,text}`. Scope contains `destination:{provider,model,effort}`, `payload:{sourceIds}` and/or `payload:{manifest:{path,sha256}}`, `purpose`, `attachments` (exact paths), `permittedActions`, `dataCategories` and `excludedData`. Exclusions must be `credentials`, `real-student-information` and `unrelated-personal-data`. The independently prepared expected scope must match exactly; actions and source/attachment sets cannot silently grow. The caller remains responsible for verifying manifest bytes, source membership, actual payload contents and the applicability of original authorization.

The helper preserves supplied words but cannot authenticate message IDs, interpret consent, establish freshness or guarantee that an approval reviewer sees the context. Its sensitive-category checks reject declared sensitive inclusions; they are not a content classifier or proof that free text/images contain no sensitive data. No arbitrary content is automatically scanned, copied or authorized. No managed approval boundary is altered.
