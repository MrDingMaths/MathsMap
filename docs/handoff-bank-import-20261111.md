# Handoff: bank import pipeline (pipeline 4), after the Stage 6 audit (11 November 2026)

Written for a new session to pick up once the Stage 6 pedagogy audit v2 batch has finished. It continues the bank import pipeline, which publishes master and textbook questions to the question bank for the later mixed-practice pass (pipeline 5).

Read first: `AGENTS.md`, then [the pipeline plan](booklet-bank-import-pipeline.md). The plan has James's decisions (1–9), the stages, and the implementation notes with the first readiness counts. Also read [bank auto-sync](booklet-bank-auto-sync.md) and the "Hand-off to mixed practice" section of [import pipeline v2](booklet-import-pipeline-v2.md#hand-off-to-mixed-practice).

## Update, 12 November 2026

- **Steps 1–3 are done.** The publishing code was written in the worktree `D:\WebApps\MathsMap-bank` (branch `bank-import-publish`), because an import and page checks were running in this checkout. It is not merged or committed yet. Details are in the plan's section [Built, 12 November 2026](booklet-bank-import-pipeline.md#built-12-november-2026) on that branch.
- **The pilot changed** (James):
  - first, one unpublished master: `s6adv-sequences-and-series-1-sequences-and-series-v1`;
  - then `cambridge-x11-ch01` (Algebra review).
- **Paused before the pilot**, as James asked. The preview stages 16 and 75 new questions, and every record carries its origin.

## Before you start

- **Wait for the audit.** On 11 November, `pedagogy/audit-v2-batch.mjs` (process 15812, started 18:44) was auditing the Stage 6 masters through child `pedagogy/review.mjs audit-v2` processes. Continue once no `audit-v2` process remains. The planner skips any booklet that a running process names, so a run during the batch reports those booklets as busy.
- **Check for imports.** Don't edit `scripts/`, `src/` or `data/` while `lean-import.mjs`, `lean-review.mjs` or an export is running. A lean import of `enrichment-joshua-ch01a-20261111-r2` was running on 11 November. A new file in `scripts/` fails any export in flight, so put new code in `pedagogy/` where you can, as the planner does.

## Where it stands

- **Committed `8fdbb173`:**
  - [the plan](booklet-bank-import-pipeline.md);
  - `pedagogy/bank-batch.mjs plan`: a read-only planner, giving one action per practice question with reasons;
  - `tests/bank-batch.test.js`: 8 tests.
- **Committed `0e7b7cfa`** (session "Fix audit v2 invented skill IDs"): audit v2 now gives the questions it adds only skill ids from `data/skills.json`. That session also repaired 326 audit-added blocks in 113 masters through `publish-project.mjs`.
- **Readiness on 11 November**, before the Stage 6 batch finished: masters had 2,291 questions ready to publish and 363 left out; textbooks had 11,212 ready and 845 left out. Full counts are in the plan's implementation notes.
- **Nothing has been published.** No `scripts/` code for publishing has been written.

## Steps

### 1. Clean up invented skill ids (first)

Audit runs that began before 20:07 on 11 November loaded the audit code from before `0e7b7cfa`. Stage 6 booklets audited in that window can still have added questions with invented skill ids. Child processes started after 20:07 use the fixed code.

- Run `node pedagogy/bank-batch.mjs plan --masters`. List every `v2-` block whose reasons include `no-known-skill`. On 11 November, 8 remained, in `inverse-functions-2-v1` and `linear-relationships-2-v1`, plus whatever Stage 6 adds.
- Repair them the way that session did. Map each one to the skill of the question it was drafted beside, then save through the revision-checked `publish-project.mjs` route, one save per booklet. Never write booklet files directly.
- **Done:** the planner shows 0 `no-known-skill` for `v2-` blocks, and no master is skipped as busy.

### 2. Rerun the readiness plan

Run `plan --masters` and `plan --textbooks`. Update the counts table in the plan's implementation notes. Stage 6 masters will add many questions to `publish`, and their Exam questions to `out-of-scope`.

### 3. Build the publishing pieces

Build these in this order, with a test for each. Most are `scripts/` edits, so check for imports before each one.

1. **Shared review test.** Move `recordedReview` (with `runIdOf` and the lean and workflow row readers) from `pedagogy/bank-batch.mjs` into a `scripts/booklet/` module. The planner and the publisher then use one definition.
2. **Assessments builder** (import v2, inefficiency 8). Build the `--assessments` file from the blocks, so nobody writes it by hand.
   - **Per question:** `classification` comes from the block. `mappingNote` and `methodNote` come from `sourceReview.teachingContext`. `teachingReferences` are `[{id, pdfPages}]`, taken from `teachingContext.pdfPages`.
   - **`sourceContext`:**
     - `projectHash` (`revisionHash`);
     - `courseIds` and `topicIds` derived from the questions' skills (`skills.json` courses; `dotpoints.json` topic ids);
     - for textbooks, `externalTeachingReferences` holding the source PDF path and SHA-256, a teaching summary, and per-page inspection records (`pdfPage`, `printedRef`, `inspection {reviewer, note, reviewedAt}`) taken from the import run's page evidence.
   - **Validation:** `validateSourceClassificationReview` and `externalTeachingEvidence` in `scripts/booklet/source-classification-review.mjs` must pass. Note that `externalTeachingEvidence` runs `pdfinfo`.
   - **Model:** `booklets/provenance/concept-maths-x11-ch01/bank-assessments-20260929.json`, a textbook assessments file that was accepted.
3. **Acceptance profile** in `import-project-bank.mjs`. This replaces the run gate for chapters imported before v2. None of the 127 passes that gate: all fail settlement and final editions, and most have stale evidence or open findings. It applies Decision 2 using the shared review test.
   - **Masters:** the existing `accepted-master-content-v1` profile needs a lean, workflow or independent proof for each question. Audit-checked or audit-added questions have none of these. My recommendation is one profile for both masters and textbooks, based on the recorded review. Record the choice in the plan.
4. **Bank record fields:** section role (`exercise` or `challenge`), origin (`master` or `textbook`) and the exam tag, with schema and validation in `src/lib/practice-question-model.js`. These are the fields pipeline 5 filters on.
5. **Decision 6 link.** A textbook question held against a master-owned bank question links to that copy at publication. The rule is in the planner's `classify`, and it has to go into the publish step.
6. **Exam tags.** Write `sourceReview.exam` for textbook questions the planner tags. Expect very few: on 11 November there was one genuine label, `concept-maths-adv11-ch08` p31-q5.
7. **Follow-up merges** (Decision 5, in the booklet).
   - **Candidates:** the planner's `follow-up-merge` rows; there were 58 on 11 November.
   - **Judge:** one Sol low call per booklet (`gpt-6.1-sol` low, explicit, with three workers at most, launched as `AGENTS.md` says) returns `merge`, `embed` or `independent` for each candidate.
   - **Apply:** a script makes the merge under the part-label and response-space rules, then Sol low re-rates the merged question, and one revision-checked save follows.
   - **`independent`:** record `sourceReview.bankDependencyReview {decision:'self-contained', signature, note}`. `questionDependencyFindings` already honours that record.
   - **Teacher-protected blocks** (`follow-up-comment`) get a Studio comment instead of an edit.
8. **Mark removal on textbooks** (import v2, open decision 16). Check that `pedagogy/exam-marks.mjs` handles textbook chapters before textbooks publish.
9. **Runner.** Add `run --projects … [--until stage]`, `save --approved-by "QUOTE"` and `report` to `pedagogy/bank-batch.mjs`, following `pedagogy/exam-batch.mjs`. When a chapter publishes, set `library.category: "textbook"` with `acceptedAt` and `acceptedRevision` (import v2, Decision 15).

### 4. Pilot (masters first, Decision 9)

Run one master with unpublished questions first, then `cambridge-x11-ch03` (12 follow-ups) and `iceem-7-ch01-20261015`. James reviews the report and the merged questions in Studio before any batch.

### 5. Batches

Publish masters first, then textbooks. James names each batch. Each batch has blanket approval with one report (Decision 8): created, linked, held (with Studio links), left out (with reasons), merges and exam tags.

## Rules that bite

- **Bank writes:** only through `import-project-bank.mjs`. Booklet saves are revision-checked, and nothing migrates on load.
- **Models:** no `claude-sonnet-5-5` calls, because pipeline 4 writes no new content. The only model calls are Sol low (follow-up judge and re-rating), and a fallback is never automatic.
- **Commits:** use explicit paths, and run `npm run repo:check` first. The working tree holds other sessions' changes, so don't commit them.
- **CRLF:** `pedagogy/audit-v2.mjs` and some other files use CRLF line endings. Edit them with the Edit tool, not with `sed -i` or a Python rewrite.
- **Waiting:** use 60-second waits, and don't poll more than needed.

## Open points for James

- 792 textbook questions are `review-stale` (edited after their import review). Should a Sol low recheck bring them in later?
- 184 master questions have `no-recorded-review`, mostly audit "retro" slots. Does the audit's blind-solve record count as their review?
