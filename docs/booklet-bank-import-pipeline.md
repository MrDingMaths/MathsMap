# Bank import pipeline (plan, 11 November 2026)

Status: **draft plan with James's decisions of 11 November 2026. Not implemented.** This is pipeline 4 of the five booklet pipelines below. It publishes booklet questions to the question bank so the mixed-practice pass (pipeline 5) can draw on them.

## The five pipelines

| # | Pipeline | Runs on | Produces | Models | Hands on |
|---|---|---|---|---|---|
| 1 | [Import](booklet-import-pipeline-v2.md) | a source (booklet or textbook chapter) | a faithful Studio project: every practice question rated, with a primary skill and both answers | `gpt-6.1-sol` medium (authoring), Sol low (review, rating) | to 2 and 3 (masters) or 4 (textbooks); reports bank readiness |
| 2 | [Exam pass](booklet-exam-completion.md) | masters; mark removal only on textbooks | Exam section from the source and MathsBase, marks removed | Sonnet (select, adapt), Sol low (rate) | to 3 |
| 3 | [Pedagogy audit v2](booklet-pedagogy-audit-v2.md) | masters only | ordering, Challenge moves, archetypes, backfill, bridges, fixes | `claude-sonnet-5-5` medium | to 4 |
| 4 | **Bank import** (this page) | masters and textbook chapters | bank records with skill, rating, exam tag, section role and origin | Sol low (follow-up merges only) | to 5 |
| 5 | Mixed practice (to design) | masters | a review section before Exam, plus Challenge additions, drawn from textbook-owned bank questions | to decide | — |

Typical life: a **master** goes 1 → 2 → 3 → 4. A **textbook chapter** goes 1 → (2, mark removal only) → 4. Pipeline 5 reads the bank and writes into masters. A master edit made later reaches the bank through [automatic sync](booklet-bank-auto-sync.md); since Decision 16 of the import plan, a master that edits a textbook-owned question becomes its owner.

## Decisions (James, 11 November 2026)

1. **Scope: textbooks and masters.** Both are published. Master Exam-section questions and exam-titled questions are not published (leaving out "Everything, Exam too"). Theory reviews are already excluded by `isTheoryReview`.
2. **Bar for pre-v2 textbook chapters: trust the recorded review.** A block is published when it has a rating bound to its current task, a primary skill and no open import finding. Any other block is left out and listed with its reason. No model call for this. Chapters imported under import v2 use its completion gate instead.
3. **Timing: on request, in batches.** Import keeps reporting readiness only (import v2, Decision 13). James names a batch.
4. **No archetypes in the bank.** Skills are fine-grained (1,194; median 7 master and 10 textbook questions per skill), so skill is the bank's unit. When a skill's pool is large, pipeline 5 sorts candidates into the target booklet's own audit types. Revisit only if a cross-booklet use for types appears.
5. **Follow-up questions are merged automatically, in the booklet.** A question that depends on the one before it becomes that question's next part, through a revision-checked save, and is then published. Booklet and bank stay identical, so sync keeps working.
6. **Duplicates: a rule, then James.** A textbook question that matches a master question links to the master's copy. Every other held match waits for **Use existing** or **Keep separate** in Studio, and the rest of the batch publishes meanwhile.
7. **Exam tags from source labels.** A script tags questions whose printed label names an exam (HSC, trial, school paper) with `sourceReview.exam`. NAPLAN stays practice. A scan on 11 November found no genuine exam label in the 127 textbook chapters, so this is expected to tag little.
8. **Blanket approval per batch, with a report**, as in the exam pass.
9. **Masters first.** Master batches publish before textbook batches, so the Decision 6 rule links textbook copies to master questions already in the bank.

## Stages

Run as `node pedagogy/bank-batch.mjs run --projects ID,ID [--until STAGE]` (name provisional). Each booklet keeps run state in `.booklet-work/bank-import-<date>/<projectId>/`.

**0. Preflight (script).** Refuse a booklet with an import, audit, exam pass or feedback repair in flight. Take the practice questions (`practiceQuestions`), minus Exam-role sections and exam-titled questions in masters. Record each question's section role (exercise, Challenge) and origin (`master` or `textbook`).

**1. Mark removal (textbooks only, script).** Run `pedagogy/exam-marks.mjs` (import v2, open decision 16) so bank records carry no `[3]`. Masters already had it in the exam pass.

**2. Exam tags (script).** Tag questions from source labels (Decision 7). Tagged questions are published, but carry the tag so pipeline 5 can leave them out.

**3. Follow-up merges (Sol low, then script).** Candidates come from `check-question-dependencies.mjs --strict`, which matches on wording only (57 in textbooks and 18 in masters on 11 November). A Sol low call per booklet sees each candidate with the question it points to. It returns `merge` (the follow-up becomes the next part), `embed` (a self-contained question that carries the exact givens it needs) or `independent` (a reference to a method only, nothing to do). A script applies merges under the part-label and response-space rules, a Sol low call re-rates each merged question, and one revision-checked save follows. A teacher-protected master block gets a Studio comment instead of an edit.

**4. Eligibility (script).** Apply Decision 2 to textbooks. For masters, use the existing `accepted-master-content-v1` transfer profile. Write the left-out list with reasons.

**5. Assessments file (script).** Build `--assessments` from the blocks and the import record (import v2, inefficiency 8), so no hand-written file is needed.

**6. Publish (script).** `import-project-bank.mjs`, with a new acceptance profile for pre-v2 textbook chapters that applies the Stage 4 test in place of the old run gate. Identical questions link, textbook-to-master matches link to the master (Decision 6), other held matches wait for James, and the rest are created. Readback as now.

**7. Accept textbook chapters (script).** On publication a chapter becomes `library.category: "textbook"` with `acceptedAt` and `acceptedRevision` (import v2, Decision 15).

**8. Report.** One report per batch: created, linked, held (with Studio links), left out (with reasons), merges applied or commented, exam tags.

## What bank records carry for pipeline 5

Each bank record carries:

- **already:** primary and secondary skills, rating and difficulty band;
- **added by this pipeline:** exam tag, section role, and origin (master or textbook) with its owning booklet.

Archetype is not added (Decision 4).

## Code to write

- the batch runner and run state;
- the acceptance profile for pre-v2 textbook chapters in `import-project-bank.mjs`;
- the assessments builder;
- the follow-up merge step: Sol low prompt, schema, apply and re-rate;
- the exam-tag script;
- the section-role and origin fields on bank records, with schema and validation;
- the textbook-to-master link rule in `resolveBankOutcomes`;
- a check that `exam-marks.mjs` handles textbook chapters.

## Pilot

Run before the batch rollout:

- `cambridge-x11-ch03` (12 follow-up candidates);
- one ICE-EM chapter with none;
- one master with unpublished questions.

James reviews the report and the merged questions in Studio before rollout.

## Implementation notes (11 November 2026)

**Built: `node pedagogy/bank-batch.mjs plan --projects a,b | --masters | --textbooks`.** This command covers Stage 0 and the read-only part of Stages 2–6. It writes nothing to projects or the bank. For each practice question it reports one action:

| Action | Meaning |
|---|---|
| `linked` | already in the bank |
| `publish` | ready to be created as a new bank question |
| `link` | identical to a bank question; links to it |
| `link-master` | Decision 6: links to the master's copy |
| `hold` | likely duplicate; waits for James |
| `follow-up-merge` | Decision 5: merged into the question before it first |
| `follow-up-comment` | a follow-up on a teacher-protected block; posted as a comment |
| `leave-out` | not published; reasons are `rating-not-current`, `no-known-skill`, `review-stale`, `no-recorded-review`, `open-finding` |
| `out-of-scope` | Exam questions in masters |

Each run also records the section role, origin and exam tag. A booklet that another process names is skipped as busy. The report goes to `.booklet-work/bank-import-20261111/plan-<time>.json`. Tests are in `tests/bank-batch.test.js`.

**How a recorded review counts as current.** A review covers a question when one of these matches its current content:
- audit v2's error check, against the content fingerprint;
- the import's lean review row, against its hash or its accepted snapshot;
- for September runs, the workflow register's independent review, against the reviewed input beside the result (the same test as the master transfer `workflow` proof).

**First readiness counts, 11 November 2026.** 57 masters were skipped because an audit v2 batch was running.

| Origin | Questions | Linked | Publish | Linked to a master | Held | Follow-ups | Left out | Out of scope |
|---|---|---|---|---|---|---|---|---|
| Masters (154) | 11,915 | 6,298 | 2,291 | — | 5 | 5 | 363 | 2,953 |
| Textbooks (129) | 12,723 | 558 | 11,212 (+1 link) | 52 | 2 | 53 | 845 | — |

- **Textbooks left out:** 792 `review-stale` (content edited after its import review), 63 `no-known-skill`, 49 `rating-not-current`, 24 `open-finding`.
- **Masters left out:** 213 `no-known-skill`, 211 of them audit-added questions whose skill ID is not in `data/skills.json` (for example `surd-laws`, `recurring-decimals`), and 184 `no-recorded-review`, mostly audit "retro" slots.
- **Exam tags:** one genuine label (`concept-maths-adv11-ch08` p31-q5, HSC).

**Not built yet; these need `scripts/` edits, made while no import is running:**
- the pre-v2 textbook acceptance profile and the assessments builder in `import-project-bank.mjs`;
- the Decision 6 link at publication;
- section-role and origin fields on bank records;
- writing exam tags;
- the follow-up merge step;
- the textbook mark-removal check.

## Open points

- Whether the 8,919 unpublished master questions include ones the audit added and still flags as comments-only. These would be left out until resolved.
