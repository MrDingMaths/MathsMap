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

## Screening a slice with agy

The two jobs that made the first pilot slow — assigning every candidate a structure slug from
its skill's vocabulary, and spotting the questions a machine gate cannot judge — are handed to
agy. Nothing in this lane writes production content; it produces the structure map and the
exclusion list that `process-candidates.mjs` then consumes.

```text
node scripts/dq/build-screen-tasks.mjs --bundle .diagnostic-questions/worker-results.json \
  --topic t-s4-alg --out .agywork/dq-t-s4-alg --batch-size 12
node scripts/agy/run-gen.mjs --tasks-dir .agywork/dq-t-s4-alg --concurrency 5
node scripts/dq/apply-screen.mjs --tasks-dir .agywork/dq-t-s4-alg \
  --structure-map .diagnostic-questions/structure-map-t-s4-alg.json \
  --exclusions .diagnostic-questions/exclusions-t-s4-alg.txt
```

`--topic` accepts a comma-separated list, so several topics can share one agy run. The builder
applies the same eligibility funnel as promotion, so the screen only ever sees candidates that
would actually be published, and it keeps a whole skill inside one task so the model can see
that skill's full vocabulary and catch within-skill option collisions.

`apply-screen.mjs` refuses a partial merge. Every id the tasks asked about must come back
exactly once with a `keep`/`reject` verdict, a kebab-case slug when kept, and a reason when
rejected — a screen that silently dropped candidates would otherwise promote them unmapped.

The reject classes agy applies are the ones observed by hand on the pilot: corrupted source
text, not English, cites a figure it does not carry, off-skill, exam-paper fragment, duplicate,
and option collision. **Off-skill is the common one** — on `t-s4-alg`, 11 of 15 rejections were
binomial or triple-product expansions that two independent mappers had still landed on a
Stage 4 single-bracket skill.

## Re-running after a gate defect — mind the ledger

A gate defect means dropping the question and re-promoting, but promotion writes **two** things:
the quiz files and `data/dq-provenance.json`. `loadExistingQuestions` counts everything in that
ledger as already published, so reverting only the quizzes makes the very next run classify all
of the previous slice as `duplicate` and promote almost nothing.

Revert both, and re-promote every slice from the clean baseline:

```text
git checkout -- public/quizzes
rm -f data/dq-provenance.json
# then re-run each slice's --promote command in turn
```

Note also that `git checkout -- public/quizzes` reverts **every** slice, not just the one being
fixed — which is why re-promoting each slice in turn is the recovery, not an optional tidy-up.

## Scoping a promotion pass

Promotion runs one slice at a time. Beyond `--bundle`, `--promote` and `--output`:

| Flag | Purpose |
| --- | --- |
| `--topic <topicId>` | Restrict to the skills hanging off one topic, resolved through `data/dotpoints.json`. |
| `--skills <id,id,...>` | Restrict to named skills; combines with `--topic`. |
| `--max-questions <n>` | Final bank ceiling for this pass. **20 is the hard safety ceiling, not a target** — a slice should aim at 8–10. |
| `--structure-map <file>` | `{ "<sourceId>": "<slug>" }`, renormalising each import's structure onto an archetype the target skill already uses. |
| `--exclude <id,id,...>` | Human-rejected source ids, recorded in the report so a rerun stays reproducible. |

**Why the structure map is not optional.** Transcriptions arrive with roughly one hyper-specific
`structure` slug per question (2,543 distinct slugs across 3,305 candidates). Left alone they break
three things at once: `checkStructureParity` warns on every unmatched slug, the
`MAX_PER_STRUCTURE_CASE` selection cap never binds, and `pickNonMasteryQuestions()` in
`src/lib/quiz-engine.js` — which prefers two *distinct* structures — systematically over-picks
imports over authored items. Map every candidate in the slice onto that skill's existing
vocabulary before promoting.

**Text normalisation and its limit.** `\( \)` and `\[ \]` delimiters are rewritten to `$…$`
automatically; the renderer understands nothing else, and swapping a delimiter does not touch the
mathematics. Beyond that, every production question is run through the repo's own text lints
(`scripts/lib/lint-math.mjs`) and anything still failing is marked `invalid`. In practice that
catches transcriptions whose LaTeX backslash was eaten in transit, arriving as a raw TAB or
FORMFEED (`$45\timports0.2$` → `$45  imes0.2$`). Those are dropped, never guessed at.

## Current import snapshot

The completed 2 August 2026 checker, dual-mapping, adjudication, and conservative-repair pass
contains 3,305 candidates. Re-run against the repository on 31 August 2026, after Waves 3 and 4
added the missing teaching content, the dry-run promotion gate reports:

| Status | 2 Aug | 31 Aug | Meaning |
| --- | ---: | ---: | --- |
| Eligible/importable | 479 | 1,095 | Passes validation, checker, mapping, content, review, duplicate, and selection gates |
| Held for missing content | 948 | 71 | Mapping is usable, but `public/content/{skillId}.json` is absent |
| Needs review | 590 | 868 | Checker, uncertainty, diagram, or mapping decision remains unresolved |
| Invalid | 1,271 | 1,271 | Fails production schema, checker, atomic-mapping, or skill-existence checks |

The 112 conservative repairs were source-confirmed local corrections only. Twenty-one ambiguous
repair candidates remain unchanged.

### Promoted to date, 31 August 2026

**447 questions across 293 skills**, in five slices, gated together:

| Slice | Scope | Screened | Kept | Promoted |
| --- | --- | ---: | ---: | ---: |
| `t-s4-frc` pilot | 1 topic | 87 (by hand) | 75 | 55 |
| `t-s4-alg` | 1 topic | 54 (agy) | 39 | 28 |
| batch 2 | 9 topics | 260 (agy) | 225 | 108 |
| batch 3 | 33 topics | — (agy) | — | 161 |
| batch 4 | 107 skills | 192 (agy) | 150 | 95 |

"Kept" exceeds "promoted" because the per-skill bank cap (`--max-questions 10`) and the
per-structure-case limit leave surplus candidates unselected; they stay available for a later
pass that raises the ceiling.

Batch 4 is scoped by **skill**, not topic, and `promote-all.sh` calls it through
`promote_skills`. Its unscreened skills are scattered across topics that also hold
already-screened ones (`t-s6st11-measurement`: 11 fresh candidates of 43), and a `--topic`
scope would pull those already-published candidates into a slice whose structure map does not
cover them — they would promote unmapped.

Rebuild every slice with `.diagnostic-questions/promote-all.sh`, which does the clean-baseline
revert and re-promotes each slice in order.

**32 parity warnings** now come from imports — cases where agy minted an archetype the skill's
practice cards do not yet cover (`recall-formula`, `identify-point`, `product-rule-trig`, …).
These are deliberately left unsuppressed: a `coverageNote` would also silence that skill's
genuine practice-side gaps, and the warning is accurate signal that a practice card is missing
for a question type the quiz now tests.

#### Never run the convergence gate through `npm run`

`promote-all.sh` originally gated with `npm run gate --silent -- --only "$(cat all-ids.txt)"`.
Once the id list passed roughly 360 skills, npm's cmd.exe shim answered **"The command line is
too long."** — and because the gate call ends in `|| true`, the loop swallowed it, grepped an
empty string for `dq-` ids, found none, and printed a confident `converged` having verified
nothing. Call `node scripts/agy/gate.mjs` directly. Any convergence that reports zero named
imports on its **first** round deserves one manual gate run before it is believed.

#### Option letters baked into option text

Eleven promoted imports carried their source's `A. `/`B. ` prefixes inside `options[].text`.
No audit catches this, and it is worse than cosmetic: `QuizQuestion.svelte` shuffles options
per question, so the baked letters render out of order. One of the eleven also carried
corrupted text ("by 6 and add subtract 1"). All were dropped. Scan a new slice for
`^[A-D][.)] ` across imported options before believing a clean gate.

#### Two figure defects the gate cannot see

Both from batch 4, both caught only by rendering and looking:

- A `oreach` over a coordinate list that **would not compile** (`nets-of-3d-objects`).
- A cone whose stem gives the **height** as 4.2 m while the drawing labels 4.2 m along the
  **slant** (`surface-area-cone`). The item's whole point is that the height is not the slant,
  so the figure inverted its answer. A figure that contradicts its stem is reject class 3(b).

#### Pre-existing authored defects the wider scope exposed

Batch 4 grew the gate's `--only` list from 258 to 364 skills, which surfaced three authored
defects that are byte-identical to HEAD and are **not** import damage. The drop-never-rewrite
contract does not cover them, so they are left for an owner decision:

- `order-operations-roots` f8 vs d1 — the known canonicaliser false positive; it strips the
  parentheses that are the entire difference between an order-of-operations pair.
- `classify-stationary-first-derivative` q2/q3 — each question's key is an option of the other.
- `classify-stationary-second-derivative` q8 — the key is the strict mode of all three varying
  slots, so it is guessable without the calculus.

### The `t-s4-frc` pilot, in detail

**56 questions across 23 skills** (Fractions, decimals and percentages, Stage 4) — the first
candidates ever published. Banks went from 4–6 questions to 5–10 at `--max-questions 10`. The
full ten-check gate is clean, `npm run validate` passes, and the 250-test suite is green.

Twelve candidates were rejected by hand and are listed in
`.diagnostic-questions/pilot-exclusions.txt`. The reasons are the classes worth expecting in every
later slice:

- **Corrupted source text** — a stem reading `$dfrac18$`, where the backslash is simply gone.
- **Wrong language** — one question in Welsh.
- **Cites a figure it does not carry** — "the following shape", "which other diagram", a table
  described but not drawn. Unanswerable as shipped.
- **Off-skill mapping** — an equation-solving item mapped to multiply/divide fractions.
- **Exam-paper fragment** — a stem still carrying its "(b) (i)" part labels and requiring a calculator.
- **Gate defects** — an item whose options contained two equal values, one duplicating an existing
  practice card by value, and two `LEAKED-KEY` collisions with the authored bank.
- **A figure that would not compile** — caught by `scripts/shoot-tikz.mjs`, not by the gate.

Note that a gate defect on an imported question means **dropping the question**, not rewriting it.
Re-run the promotion from a clean `git checkout -- public/quizzes` with the id added to
`--exclude`, so selection can backfill from the candidates it had passed over.

One open question for later slices: 11 of the promoted items use £ amounts, which is
mathematically sound but reads oddly on an NSW site. Localising currency would be a text edit, so
it is deliberately out of scope for the repair contract.

## Archive cleanup and version control

The complete `.diagnostic-questions/` archive is intentionally gitignored. It contains browser
state, source PNGs, worker bundles, adjudication results, repair results, and resumable capture
state; do not force-add it. Luna scratch directories and runner logs can be removed after a pass;
the durable worker, review, repair, and capture records should be retained when an audit trail or
resumable continuation is required.
