# Resumable bounded review dispatch

`run-workflow drive` advances eligible inventory, authoring, mathematical,
teaching, question, feedback and final visual-review work. It reads the existing
dependency status and `run-workflow next`, uses the three-worker pool and records
results through the existing review APIs. The register, immutable tickets and
attempt ledger remain authoritative.
The controller event log under the ignored run directory is a compact trace,
not another approval register. The run receipt summarizes dispatches, recoveries
and stops by stage and reason alongside the existing model usage.

Start the run with the usual source inventory and representative-pattern gates.
Choose final-size cases for shared stems and nested grids, grouped short and
worked answers, wide tables and dense categories, diagram labels and answer
columns, teaching groups near page boundaries, and misleading graphs where
applicable. Run `pre-final` and the development export checks before settling;
inspect their rendered pages and pagination neighbours. Resolve repeated
defects before the full final export. These early checks never substitute for
the fresh standalone and combined-edition acceptance after settlement.
Link the coordinator session through `link-session` before automatic dispatch.
Supply the current `--config` and representative `--plan` for authoring; without
them the controller reports the existing source or representative blocker. The
existing `drain` command remains available for explicit targeted retries. Use
the existing settle, export, verification, final-review and publication commands
at their reported handoffs. Rerun `drive` after each handoff; it resumes current
work and reports remaining checklist items. `complete` means the current
verification checklist, including publication, readback and repeat-import, has
passed. A `handoff` or `needs-repair` result grants no approval.

Example budget file:

```json
{
  "totalTokens": 30000000,
  "uncachedPlusOutputTokens": 9000000,
  "externalTokens": 7000000,
  "reserveTokensPerJob": 100000,
  "warningFraction": 0.8
}
```

These limits are the proposal's unproven design targets. Set a run-specific
budget after reviewing its scope and available allowance. The three measures
overlap and are checked separately.

```text
node scripts/booklet/run-workflow.mjs drive --run-id RUN --project-file PROJECT.json --config CONFIG.json --plan PLAN.json --budget BUDGET.json --out .booklet-work/RUN/drive-result.json
```

At least one token limit is required. Before dispatch the controller reserves
`reserveTokensPerJob` for each concurrent call and compares projected usage with
the specified limits. If a full batch does not fit, it tries a smaller batch.
Inventory and authoring receive a dry-run estimate before an attempt is opened;
each assignment also checks the budget just before its model call.
Unknown usage, an unavailable linked session or a missing coordinator link stops
automatic dispatch. Reservations are estimates: actual model usage can exceed
them. The receipt remains the source of measured usage, including failed calls.

An existing ticket is reconciled before new work. A complete `generation.json`
or a completed worker event with a parseable final result is recorded through
`record-stage` without another model call. A ticket prepared before a worker
started resumes using the same immutable request. Partial worker output stays
blocked for explicit inspection. A rejected result remains available beside its
ticket; a controller restart does not retry that failed recovery automatically.
Use `record-stage` for a repaired structure that preserves the reviewer's actual
judgement, or cancel the ticket and address the underlying finding. Format repair
must never add missing checks, observations or a verdict.

## Scoped regression evidence

The historical regression signature covers all booklet scripts and tests. A
regression verification record can instead carry `regressionScope` with the
actually executed `testFiles` and any `supportFiles` read outside the module
import graph. Set `checks.coverageReviewed: true` only after reviewing the test
selection and file dependencies. `record-verification` stamps the current scoped
signature; validation recomputes it from those files, their local imports and
the package lock. Dynamic or unresolved imports widen to a conservative
scripts, tests, source and public-assets signature. Existing records without a
scope keep their historical broad dependency key.
Actual passing test output and the ordinary reviewer/evidence fields remain
required. If a test reads data through a runtime path, list that data under
`supportFiles` or retain the broad signature.

The accepted final-visual policy is unchanged: a new settlement needs fresh
standalone inspection and current combined comparison/composition evidence.
The controller does not infer review credit from hashes, generated responses or
its own scheduling events.
