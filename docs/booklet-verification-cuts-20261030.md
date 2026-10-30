# Verification cuts approved 30 October 2026

James approved these cuts after reviewing retained verification findings. For programme phases 1–6 and bounded booklet maintenance, this supersedes conflicting verification steps in lean acceptance, the change runbook and exam-mark/order instructions. It does not change full-import acceptance or authorise diagram-engine changes. Preserve historical evidence; adoption itself invalidates nothing.

| Change | Required checks | Skip |
| --- | --- | --- |
| Strictly mark-only | Source-backed token identification; exact scoped diff/inverse preserving mathematical brackets, answers, dependencies and layout fields; valid existing rating reuse; schema/identity; target and linked-record revisions; guarded save/readback | Routine visual rendering, pagination, baseline, PDF, answer/Worked renders, maths review and rerating |
| Comment-only or nonprinting audit metadata | Exact scoped diff preserving printed content, ratings and order; schema/identity and applicable assessment binding; guarded save/readback | All visual renders, runtime snapshots, PDFs and maths review |
| New or mathematically changed questions | One independent combined source/native/maths/answer/rating review per master batch; holistic explicit/implicit dependency and order checks; literal reference renumbering; affected Questions and answer/Worked pages and boundaries; actual writing-space/diagram inspection | Repeated reviews of unchanged tasks, full PDFs and new baseline renders when valid scoped evidence exists |
| Reordering, diagrams, pagination or writing space | Holistic dependencies/order and reference checks where affected; exact scoped diff; existing independent ratings reused for unchanged tasks; affected pages/neighbours and edition boundaries; readable actual diagrams and usable writing space | Unchanged-topic review, unrelated editions, whole-book exports, repeated diagnostics of unchanged/off-scope diagrams |
| Shared renderer code | Focused regressions, one build after changes settle, representative editions/booklets and affected boundaries; broaden for a named risk | Routine cross-booklet re-export campaigns and unrelated whole-tree hash blockers |

Strictly mark-only means the exact source-proven removal of exam allocation tokens, with no mathematical, answer, diagram, order, dependency or layout-field edit. Ambiguous brackets, mixed edits and new questions use their substantive change route. A known pagination, diagram or writing-space defect remains a separate substantive repair; the mark-only exemption does not clear it.

For every save retain target/linked-record revision guards, schema/identity checks, current-task assessment bindings, user-edit protection and readback. Use `publish-project.mjs` dry run and `--apply`; keep the lightweight per-master ledger. A source cache, worker result or successful save alone is not content acceptance. Reconcile uncertain calls/saves before retrying; never bypass a denial.

For content-only changes, do not run an application build or unrelated application tests. Run `npm run repo:check` before committing or when adding assets. Commit compatible saves in batches, with narrow staging; do not push without authorisation.

Use valid existing page maps, renders and inspections instead of creating new baselines or full PDFs for bounded edits. Compare only material print dependencies for runtime compatibility. Do not hash or block on unrelated whole-tree changes. Scope diagram diagnostics to changed inputs and affected pages; retain old/off-scope findings as history without repeatedly reopening them or claiming they are cleared.

An unchanged task keeps its accepted maths and independent rating. Presentation-only diagram changes still require semantic equivalence and affected-output inspection under the existing rating-reuse contract. New/changed mathematics still requires independent review. New teaching, worked examples, guided practice, bridges and prerequisite Review additions remain concise comments for James; no automatic teaching changes. Phase 7 remains deferred.
