# Diagnostic Questions candidate processor

`process-candidates.mjs` consumes the JSON bundles returned by transcription,
checking and mapping workers. It is read-only unless `--promote` is present.

The login command saves cookies and local storage to the gitignored
`.diagnostic-questions/storage-state.json`. Later commands restore that state before
navigating, so their browser windows may close without requiring another login.

```powershell
npm.cmd run dq:capture -- login
npm.cmd run dq:capture -- discover --write
npm.cmd run dq:capture -- crawl
npm.cmd run dq:capture -- crawl --write
npm.cmd run dq:capture -- crawl --write --headless --force-source-ids 12345,67890
npm.cmd run dq:bg -- start -- crawl --write --headless
npm.cmd run dq:bg -- status --tail 30
npm.cmd run dq:bg -- stop
npm.cmd run dq:qa -- sync --state .diagnostic-questions/capture-state.json --ledger .diagnostic-questions/capture-qa-v2.json
npm.cmd run dq:qa -- claim --ledger .diagnostic-questions/capture-qa-v2.json --worker luna-1 --batch-size 5 --output .diagnostic-questions/jobs/luna-1.json
npm.cmd run dq:qa -- complete --ledger .diagnostic-questions/capture-qa-v2.json --result .diagnostic-questions/results/luna-1.json
npm.cmd run dq:qa -- resolve --ledger .diagnostic-questions/capture-qa-v2.json --result .diagnostic-questions/results/human-review.json
npm.cmd run dq:qa -- status --ledger .diagnostic-questions/capture-qa-v2.json --target-per-leaf 10
npm.cmd run dq:export -- --state .diagnostic-questions/capture-state.json --qa .diagnostic-questions/capture-qa-v2.json --permission-confirmed --output .diagnostic-questions/visual-jobs.json
npm.cmd run dq:export -- --state .diagnostic-questions/capture-state.json --qa .diagnostic-questions/capture-qa-v2.json --permission-confirmed --preserve .diagnostic-questions/worker-results.json --output .diagnostic-questions/visual-jobs-current.json
npm.cmd run dq:process -- --bundle .diagnostic-questions/candidates.json
npm.cmd run dq:process -- --bundle .diagnostic-questions/candidates.json --suggest
npm.cmd run dq:process -- --bundle .diagnostic-questions/candidates.json --promote
```

On Windows, `dq:bg` runs a long crawl through a hidden `Start-Process` worker and
returns immediately. Standard output, standard error, the run payload, PID, and final
exit record are stored under `.diagnostic-questions/background/runs/<runId>/`;
`current.json` points to the latest run. A second `start` is refused while the
recorded PID is alive and its command still contains both the private run token and
the expected worker path. `stop` performs the same PID-and-command check before it
terminates that process tree, so a stale or reused PID is never acted upon. Supervisor
options such as `--archive` go before `--`; all crawler options go after it. With no
crawler arguments, `start` uses `crawl --write --headless`.

`dq:qa` continuously imports newly captured PNG revisions into a checksum-bound
capture-QA ledger. `claim` records an exclusive, expiring assignment before it emits
a batch of at most five images, so parallel visual workers cannot receive the same
revision. Workers return a result containing the exact `jobId`, `workerId`, source ID,
and PNG SHA-256. `complete` re-hashes each PNG and rejects stale, partial, duplicate,
or out-of-assignment results. Workers should return `accepted`,
`recapture_requested`, `rejected_source`, or `needs_human_review`; every non-accepted
decision requires a reason. The legacy pilot `capture-qa.json` is migrated when it is
passed as the `--ledger` on the first `sync`.

`resolve` applies exact-checksum final decisions only to captures already held as
`needs_human_review`. `--force-source-ids` revisits completed leaves containing any
listed IDs and captures the source image at its natural dimensions, which is useful
when card-level screenshots clipped source content.

`export-jobs.mjs` is the bridge from the crawler's `capture-state.json` to
visual-worker inputs. It converts `capture.pngPath/pngChecksum`, `ranks`, and
`sourcePaths` into the processor's `source` envelope and creates deterministic,
disjoint jobs of at most five PNGs. Workers retain that envelope and add the
`transcription`, `checker`, `mapping`, and `review` fields shown below.
When `--qa` points to the v2 ledger, export includes only accepted current
source-ID/checksum pairs; stale accepted revisions cannot leak into a worker batch.
The explicit `--permission-confirmed` flag records the operator's reuse-rights
confirmation in every source envelope; without it candidates remain ineligible.
Before a ready bundle can be promoted, its retained source envelope must record
`licence.permissionConfirmed: true`; the exporter carries a candidate-level or
capture-state-level `licence` record through when present.
When `--preserve` is supplied, completed transcription/checker/mapping/review fields
are copied into the regenerated export only for an exact source-ID and PNG-checksum
match; results from superseded image revisions are never retained.

A ready candidate has this minimum shape:

```json
{
  "source": {
    "id": "12345",
    "url": "https://diagnosticquestions.com/Questions/12345",
    "categoryPath": ["Maths", "Number", "Fractions", "Adding fractions"],
    "pngPath": ".diagnostic-questions/images/12345.png",
    "pngSha256": "64 lowercase hex characters",
    "metrics": { "likes": 53, "likedRank": 2, "misconceptionRank": 8 },
    "licence": { "permissionConfirmed": true }
  },
  "transcription": {
    "question_text": "...",
    "structure": "...",
    "meaningfulCase": "...",
    "mastery": false,
    "options": [
      { "text": "...", "correct": true },
      { "text": "...", "why": "A specific misconception of at least 15 characters." },
      { "text": "...", "why": "A different specific misconception of at least 15 characters." }
    ],
    "solution_text": "...",
    "uncertainties": []
  },
  "checker": { "transcriptionMatch": true, "answerMatch": true },
  "mapping": {
    "mappers": [
      { "skillId": "skill-id", "score": 95, "runnerUpScore": 80, "atomic": true, "flags": [] },
      { "skillId": "skill-id", "score": 94, "runnerUpScore": 79, "atomic": true, "flags": [] }
    ]
  },
  "review": { "diagram": "approved" }
}
```

The automatic mapping gate requires both mappers to agree, score at least 90,
lead their runner-up by at least 12, confirm the question is atomic, and report no
flags. A reviewed override uses `review.mapping: "approved"` together with
`review.mappedSkillId`.

Promotion refuses candidates with missing teaching content, checker disagreement,
unresolved transcription/diagram review, duplicates, or a full question bank. It
adds only the six production question keys and records source/review metadata in
the tracked `data/dq-provenance.json` ledger (override with `--provenance <file>`).
