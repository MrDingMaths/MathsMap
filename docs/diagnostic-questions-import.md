# Diagnostic Questions import workflow

This workflow turns selected image-based questions from Diagnostic Questions into reviewed,
schema-exact MathsMap quiz entries. Crawling, transcription, checking, mapping, and publication
are separate operations. Permission to reproduce and publish the source material must be
confirmed before capture or promotion.

## Local workspace and browser capture

All browser state and unpublished material lives under `.diagnostic-questions/`, which is
gitignored. This includes the persistent browser profile, screenshots, taxonomy/index data,
candidate records, worker handoffs, and held questions. Never put credentials, cookies, or raw
source PNGs in tracked files.

Use the acquisition CLI in interactive-login mode once to open system Chrome with the
persistent local profile. Sign in manually; the pipeline must never accept, print, or commit a
password. The login command also writes a Playwright storage-state snapshot inside the same
gitignored archive so session cookies and local storage survive when each command closes its
browser window. Subsequent runs restore that state, traverse the source taxonomy to leaf subtopics,
and inspect both **Most Liked** and **Most Misconceptions** orderings. Runs are single-browser,
rate-limited, resumable, and idempotent by source ID and PNG checksum.

The acquisition interface exposes these operations; use its `--help` output for every flag:

```text
npm.cmd run dq:capture -- login
npm.cmd run dq:capture -- discover --write
npm.cmd run dq:capture -- crawl
npm.cmd run dq:capture -- crawl --write
npm.cmd run dq:capture -- crawl --write --headless --leaf-path "Algebra > Solving Equations > Linear Equations"
npm.cmd run dq:capture -- crawl --write --headless --force-source-ids 12345,67890
```

`crawl` is read-only unless `--write` is supplied. Run `discover --write` first, compare
`.diagnostic-questions/discovery.png` with the live page, and copy
`scripts/dq/selectors.example.json` into the local archive when selector overrides are needed.
Use `--leaf-path` to scope a pilot or resumable run to one already-discovered leaf while
retaining its complete source category path. Pagination is followed until the requested
per-sort indexing limit is reached. By default, each leaf indexes 30 results under each sort
and compares its top-10 membership with the first 15. It expands to 60 and then at most 100
only while the shortlist is underfilled or its membership is still changing. Pass
`--limit-per-sort <n>` for an exact fixed-depth crawl; `--top <n>` overrides the shortlist size.
Completed leaves whose retrieval policy and PNG checksums still match are skipped on resumed
write runs, and progress is printed leaf-by-leaf on stderr.

Full taxonomy discovery is also resumable. Its versioned, source/root-bound breadth-first queue
is checkpointed after every successfully classified category in
`.diagnostic-questions/taxonomy-progress.json`, with a progress message every 10 categories.
Interrupted runs retry only the incomplete category. The closed graph is validated before its
nodes and leaves replace `capture-state.json` taxonomy data. Use `--refresh-taxonomy` when a
deliberate fresh discovery is required; dry runs never write the progress file.

Capture uses a high-resolution screenshot of the isolated question card. Never submit an
answer merely to reveal an answer key or response data. Each candidate retains its source URL
and category path, sort ranks and visible metrics, capture time, local PNG path, and checksum.

## Visual handoff, checking, and mapping

Export deterministic, disjoint worker batches after capture:

```text
npm.cmd run dq:export -- --state .diagnostic-questions/capture-state.json --qa .diagnostic-questions/capture-qa-v2.json --permission-confirmed --output .diagnostic-questions/visual-jobs.json
npm.cmd run dq:export -- --state .diagnostic-questions/capture-state.json --qa .diagnostic-questions/capture-qa-v2.json --permission-confirmed --preserve .diagnostic-questions/worker-results.json --output .diagnostic-questions/visual-jobs-current.json
```

The orchestrator assigns each batch of at most five PNGs to a visual transcription subagent.
When visual capture QA has been completed, the optional `--qa` ledger restricts export to
accepted current PNG revisions and keeps rejected or superseded captures out of worker batches.
Legacy `acceptedIds` pilot ledgers remain supported, but the v2 checksum-bound ledger is preferred.
Regenerated exports may retain completed worker fields from `--preserve`; retention is
allowed only when both the source ID and PNG checksum match the current accepted revision.
Use the role prompts under `scripts/dq/prompts/`; workers return JSON and never edit production
files. The transcription handoff contains the
exact stem and options, an independently solved correct option, specific distractor
misconceptions, worked solution, proposed `structure` and `mastery`, diagram/TikZ requirements,
and explicit uncertainty flags.

Run the checker and two independent mapping passes over the completed worker bundle with the
resumable Luna runner. It writes per-job results under the gitignored archive and only merges them
into `worker-results.json` after all three passes cover every accepted candidate:

```text
npm.cmd run dq:check-map -- --mode all --concurrency 16
npm.cmd run dq:check-map -- --mode mapper-a --concurrency 6
npm.cmd run dq:check-map -- --mode mapper-b --concurrency 6
npm.cmd run dq:check-map -- --mode merge
npm.cmd run dq:check-map -- --mode review --concurrency 16
npm.cmd run dq:check-map -- --mode merge-review
npm.cmd run dq:check-map -- --mode repair --concurrency 16
npm.cmd run dq:check-map -- --mode merge-repair
```

`checker` attaches `transcriptionMatch`, `answerMatch`, issue notes, and diagram comparison. Mapper
A and mapper B each return one skill report; automatic consensus is accepted only when both choose
the same atomic skill with scores of at least 90, a margin of at least 12, and no flags. `review`
adjudicates the held candidates with source images and records an adjudication under
`candidate.review`; this Luna pass is a review aid, not a substitute for final human visual
approval, and it does not promote production content.
`repair` is restricted to source-confirmed local transcription, schema, and answer corrections;
ambiguous or contradictory candidates remain held. Repaired candidates retain the original
automated checker verdict under `checker.automated`.

A separate checker subagent compares each draft with its PNG and solves it independently.
Disagreements, ambiguity, illegibility, and uncertain diagrams are held for human review. Two
independent mapping passes rank candidates from the MathsMap skill index. Auto-mapping is
allowed only when both choose the same atomic skill, each score is at least 90/100, the winner
leads its runner-up by at least 12 points, and no prerequisite, sibling, dependant, notation,
composite-skill, or diagram concern is flagged. GCSE/A-level categories are retrieval hints,
not stage mappings.

Diagrams are recreated as inline TikZ so production content never depends on source PNGs.
Every TikZ block must compile and its rendered output must receive human visual comparison
against the capture before approval.

## Review, provenance, and promotion

Candidate processing and promotion are dry-run by default. The pipeline accepts either a flat
`candidates` bundle or the exported `jobs[].candidates[]` shape after workers have added their
results. It records transcription, checker decisions, mapping votes, duplicate audit, review status,
and publication status in the local candidate store. Its generic operations are:

```text
npm.cmd run dq:process -- --bundle .diagnostic-questions/worker-results.json --suggest --output .diagnostic-questions/suggestions.json
npm.cmd run dq:process -- --bundle .diagnostic-questions/worker-results.json --output .diagnostic-questions/promotion-plan.json
npm.cmd run dq:process -- --bundle .diagnostic-questions/worker-results.json --promote
```

Before promotion, detect duplicates by source ID, PNG checksum, canonical stem/options hash,
semantic similarity, and existing quiz/practice content. Production IDs are stable
`dq-<source-id>` values. Select approved items round-robin across structures and meaningful
cases, with no more than two imported questions for the same structure/case combination.

Promotion preserves existing questions and refuses to exceed **20 total questions per skill**.
The normal authoring target remains **6–8**; 20 is an import safety ceiling, not a target.
Promotion also requires `public/content/{skillId}.json`. Otherwise the candidate remains
`held_missing_content` in the local archive. Only the six question keys documented in
[content-schema.md](content-schema.md) enter production.

Approved source URL, visible metrics snapshot, licence record, checksum, mapped skill, and
human/automatic review decision are appended to the tracked provenance ledger. The ledger
is `data/dq-provenance.json` by default and must not contain raw PNGs, browser state,
credentials, or unpublished question text.

After a write, run repository validation, focused import tests, TikZ compilation and visual QA
where applicable, the full test suite, and manifest generation. The manifest builder warns and
excludes any orphan quiz as a final defensive gate.

## Current import snapshot

The completed 2 August 2026 checker, dual-mapping, adjudication, and conservative-repair pass
contains 3,305 candidates. The dry-run promotion gate currently reports:

| Status | Count | Meaning |
| --- | ---: | --- |
| Eligible/importable | 479 | Passes validation, checker, mapping, content, review, duplicate, and selection gates |
| Held for missing content | 948 | Mapping is usable, but `public/content/{skillId}.json` is absent |
| Needs review | 590 | Checker, uncertainty, diagram, or mapping decision remains unresolved |
| Invalid | 1,271 | Fails production schema, checker, atomic-mapping, or skill-existence checks |
| Duplicate | 14 | Matches an existing or already accepted question |
| Not selected | 3 | Passed eligibility but was excluded by per-skill selection limits |

The 112 conservative repairs were source-confirmed local corrections only. Twenty-one ambiguous
repair candidates remain unchanged. No candidate has been promoted to a production quiz by this
pass.

## Archive cleanup and version control

The complete `.diagnostic-questions/` archive is intentionally gitignored. It contains browser
state, source PNGs, worker bundles, adjudication results, repair results, and resumable capture
state; do not force-add it. Luna scratch directories and runner logs can be removed after a pass;
the durable worker, review, repair, and capture records should be retained when an audit trail or
resumable continuation is required.
