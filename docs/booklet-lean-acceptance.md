# Lean programme acceptance — 29 October 2026

30 October: [approved verification cuts](booklet-verification-cuts-20261030.md) supersede conflicting steps below, including routine visual checks for strictly mark-only changes. Comment-only saves remain nonprinting; additions, diagrams, pagination and writing space retain affected-output inspection.

James approved immediate adoption, without a pilot. This governs the active phases 1–6 programme and its geometry, exam-mark and difficulty-ordering maintenance. It supersedes conflicting blanket acceptance requirements for that scope; phase 7 remains deferred.

- **Metadata/rating only:** validate schema, identity, assessment binding and target/linked-record revisions; save and read back. No PDF unless displayed output changes.
- **Diagram presentation repairs (29 October, James):** do not request another difficulty review when verified mathematics, givens, relationships, marker multiplicities and scaffolding are unchanged. `reuseDiagramPresentationRating` preserves the original score, model, date and raw assessment with explicit old/new task and diagram lineage. It requires a pinned source, exact diagram-only inverse, coordinator-verified semantic equivalence and actual visual evidence; the persisted rating gate rechecks the acceptance records and task bindings. Pixel hashes are checked once at acceptance and retained as history; regenerating or pruning raster caches does not invalidate difficulty ratings. New/unreviewed questions and changes to mathematics or supplied task/answers retain their normal independent review requirements.
- **Local diagram, mark or layout:** inspect affected pages and pagination neighbours in the relevant editions. Inspect geometry at readable resolution. Do not export all five editions by default.
- **Reordering or new questions:** retain independent answer/content checks and holistic explicit/implicit dependency review, stable identities and literal reference renumbering. Run primary Questions pagination and inspect affected answer/worked pages. Broaden only for an identified risk. Exam questions remain Exam regardless of reasoning score.
- **Shared renderer:** focused regressions, one build and a representative five-edition sample; avoid repeated full cross-booklet exports. Expand only when the affected behaviour warrants it.

Batch compatible outstanding changes per booklet, verify once and save/commit once where practical. Reuse checks whose content and rendering dependencies remain valid; adoption itself invalidates nothing. A dependency/reference hold remains a hold until resolved and tested.

Use a stable isolated renderer per batch. Preserve live user work and all older immutable snapshots. Record the renderer version and check only materially relevant print dependencies for compatibility before publication. Remove repeated whole-tree/current-versus-frozen manifest comparisons and unrelated-artifact hash blockers. Keep target booklet and linked-record revision guards, changed-content assessment bindings, user-edit protection and save/readback. Never bypass a denial.

Filter the relevant geometry-marker inventory and group identical source/render inputs. Reuse inspection only where page context also matches; preserve equality/parallel relationships and marker multiplicities. Inventory coverage and repaired/visually verified coverage remain separate.

Bound stalled-render diagnosis. Recover only confirmed owned failed processes safely; isolate unresolved exceptions and continue the ready queue. Reconcile uncertain outcomes before retrying. Keep heavy rendering serial unless observed resources justify more concurrency; independent source/review preparation can continue in parallel within existing worker limits.

Use one lightweight per-master ledger and one coordinated publication owner with disjoint worker ownership. Concise milestone reports do not require stopping healthy workers, duplicate receipts or restarting checks. Keep original evidence and actual model provenance. New teaching, worked examples, guided practice and prior-knowledge Review additions remain comments-first.

## Change-type checklist and pipeline cuts — 30 October 2026

James approved the pipeline review's plan and decided: count/gradient holds stay as they are; a multipart question without reviewed independent parts counts as **one** practice item (it no longer makes its topic unassessable); **one approved request per master batch** is the standard approval unit; saves are **committed in batches**, not one commit per booklet.

| Change | Check | No longer done |
| --- | --- | --- |
| Metadata, rating, archetype, comment | Schema, identity, rating bound to the current task, `publish-project.mjs` dry run then `--apply` (expected revision, readback, ledger row) | PDF, runtime snapshot, per-save publish/prove scripts, re-hashing earlier proofs, programme-doc paragraph, per-save commit |
| Presentation-only diagram or mark | Before/after code diff, one coordinator equivalence note, `check-feedback-pages --blocks` (Questions pages and neighbours; answers only if the diagram appears there), geometry at readable resolution; rating kept | Difficulty re-review, re-review "with images", five editions, combined-edition pagination, baseline render, raster-hash rechecks |
| Exam mark removal (`[3]` etc.) | Source-backed token diff touching no mathematical bracket; affected Questions page | Re-rating, answer editions |
| Reordered exercise | One holistic explicit/implicit dependency review; literal renumbering in questions, short and worked answers; independent ratings reused; Questions pagination; affected answer/worked pages; `keepWithNext`/`dependsOn` | Re-render of the old version when a page map exists (`--reuse-baseline`), per-question re-rating, a separate gradient review |
| New questions (exam or routine) | Source inspection; one independent call per master batch covering source fidelity, native form, answers and rating; ordering checks above; Questions plus affected answer pages | Separate content re-derivation, a second review after a wording-only edit, one call per question |
| Shared renderer | Focused tests, one build, one representative five-edition sample on 2–3 booklets | Cross-booklet re-exports, new snapshots for editor-only edits, diagram-cache loss from TikZ scheduling edits |

New full imports keep the three-pass rules and their five-edition checks.

Tooling that implements this:

- `check-feedback-pages.mjs`: `--checks-only` defaults to `none` (or `with-worked` when practice answers changed); `--reuse-baseline DIR` and `--reuse-images REPORT` reuse an earlier map and identical-page images with their inspection.
- Diagram cache version: only the TikZ engine and the code between `// diagram-output:begin` and `// diagram-output:end` in `src/lib/tikz.js` and `src/lib/tikz-prepare.js` (base preamble) count. Watchdog, scheduling and measurement edits, and colour, typography or palette edits (which change each diagram's key instead), keep compiled SVGs. Use `warm-diagrams.mjs` for the booklets to be verified rather than paying cold compiles inside a verification.
- `check-feedback-pages.mjs` measures diagram labels on the selected pages only (`diagramFiguresTotal` still counts every figure); page layout QA still covers the whole edition.
- Cold diagrams before a scoped check: add `--prewarm` to `check-feedback-pages.mjs`, or run `node scripts/booklet/prewarm-diagrams.mjs --project ID` (or `--project-file FILE`) with the same `--base` and `--editions` as the check. It collects the booklet's TikZ sources without compiling and compiles them across three pages. Differential Equations, 90 new diagrams: 77 s pre-warm plus a 51 s check, against 315 s for the cold check alone. Skip it when nothing diagram-related changed, because the check is already warm.
- Frozen exports: later live edits block reuse only when the renderer or checker would load them (`printRelevantChanges`); host-only script edits are recorded as `hostOnlyChanges`.
- Pedagogy and archetype prompts are sent as `pedagogy/review.mjs` builds them (one topic plus budgeted earlier teaching). `runAstraTask` refuses a `pedagogy-*` prompt over 300,000 characters; do not prepend the whole booklet's native content.
- `runAstraTask` also refuses any other review-profile prompt over 200,000 characters, whatever its stage is called, unless the caller passes a named `oversizeReason`, which the call metrics record with `promptCharacters`. Use `pedagogy/review.mjs coverage-challenge` and `insertionReviewView` rather than whole-booklet wrappers.
- Rating inputs now carry `linkedQuestions`, the unanswered text of the questions a task `dependsOn`, as context only. The task hash is unchanged, so no existing rating is invalidated or rerated.
- Approval: build one fixed, size-checked payload per master batch and submit it once; a denied payload is never rebuilt or rerouted, and no approval control is bypassed.
- Status: the per-master ledger and publication records carry progress. The programme document keeps rules and one current-state paragraph, not per-save checkpoints.
