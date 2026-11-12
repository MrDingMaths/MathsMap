# Bank import pipeline (plan, 11 November 2026)

Status: **built 12 November 2026; pilot waiting for James** (see [Built, 12 November 2026](#built-12-november-2026)). Decisions of 11 November 2026. This is pipeline 4 of the five booklet pipelines below. It publishes booklet questions to the question bank so the mixed-practice pass (pipeline 5) can draw on them.

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

Run before the batch rollout (James, 12 November 2026, replacing the earlier list):

1. one master with no published questions: `s6adv-sequences-and-series-1-sequences-and-series-v1` (James asked for a small one unrelated to the textbook; the first choice, `s6adv-working-with-functions-4-linear-functions-v1`, holds only Exam questions);
2. then `cambridge-x11-ch01` (Cambridge Mathematics Extension 1 Year 11, Chapter 1: Algebra review; one follow-up candidate).

James reviews the report and the merged questions in Studio before rollout.

## Built, 12 November 2026

Commands, after `node pedagogy/bank-batch.mjs plan`:

```
node pedagogy/bank-run.mjs run --projects ID,ID [--until edits|assessments|stage] [--preview]
node pedagogy/bank-run.mjs save --projects ID,ID --approved-by "QUOTE"
node pedagogy/bank-run.mjs report --projects ID,ID
```

- **`run`** handles one booklet at a time. It plans, then makes one revision-checked save of the Stage 2–3 edits: exam tags, follow-up judgements, merges and embeds, dependency reviews, and Studio comments on teacher-protected follow-ups. It then writes the left-out list and the assessments file, and stages the publication in isolation. Nothing reaches the bank. `--preview` makes no model call and saves nothing: follow-ups are deferred and the rest is staged. State and report are in `.booklet-work/bank-import-20261112/`.
- **`save`** publishes what `run` staged, but only with James's quoted approval of the batch. It reads every new record back and checks its origin. A published textbook chapter becomes `library.category: "textbook"` with `acceptedAt` and `acceptedRevision`.
- **Origin on bank records.** Every record that this pipeline creates carries `bankContext {origin: "master" | "textbook", projectId, blockId, sectionRole: "exercise" | "challenge", exam?}`. The manifest repeats `origin`, `sectionRole` and `exam` for filtering. The schema and validation are in `src/lib/practice-question-model.js`. `bankContext` is bank metadata, so sync and duplicate checks ignore it. A master that takes over a textbook-owned question (Decision 16) becomes its origin (`bank-sync.mjs`). Records published before 12 November have no `bankContext`. Their origin can still be traced through `.sync/links.json` to the owning booklet's `library.category`.
- **Acceptance profile `recorded-review-v1`** (`import-project-bank.mjs`). One profile covers masters and textbooks, as the handoff recommended. A question qualifies when a recorded review covers its current content and its rating is bound to its current task. The review test is shared with the planner in `scripts/booklet/recorded-review.mjs`. It replaces the import-run gate, which no pre-v2 chapter passes.
- **Assessments builder** (`pedagogy/bank-assessments.mjs`). For textbooks, it builds the external teaching reference from the import run's source PDF, using each question's `teachingContext` pages and method note. For masters, it uses the booklet's own teaching blocks. Course and topic scope come from the questions' skills.
- **Decision 6** (`masterLinks` in the assessments file). A textbook question held against a master-owned question links to the master's copy and adopts its wording and answers (Use existing). The publisher allows content changes only on those blocks.
- **Follow-up merges** (`pedagogy/bank-merges.mjs`). One Sol low call per booklet judges each candidate as `merge`, `embed` or `independent`.
  - **Merge:** the follow-up's parts continue the previous question's letters, as a second run under the follow-up's own instruction. Node ids and answers are kept. A follow-up that names a part (or anything else that cannot be joined safely) is reported as `merge-manual`.
  - **Embed:** the follow-up's stem is replaced by one that states the given.
  - **Independent:** the follow-up gets `bankDependencyReview` and is otherwise unchanged.
  - Merged and embedded questions are re-rated by one Sol low call. They carry a `bankMergeReview` that binds their content fingerprint to the components' current reviews. A merge whose parts lack a current review is not applied (`merge-blocked`).
- **Marks on textbooks** (open decision 16). `exam-marks.mjs` strips marks only with MathsBase source evidence, so it cannot clean textbook chapters. A textbook question that still prints a standalone `[n]` is left out with the reason `printed-marks`.
- **Tests:** `tests/bank-run.test.js` and `tests/bank-batch.test.js`.
- **Staging copies only what it touches** (12 November, after the pilot). Under `recorded-review-v1` and `accepted-master-content-v1`, staging copies and hashes only the bank records the booklet already links to or matches, plus the manifest and links. Before this, it copied all ~7,800 records: about 170 MB and 25 s per booklet. Now it takes 7–11 MB and a few seconds. A preview stages into a new folder each time.
- **Bank validation before staging.** A question the importer would refuse is left out with the reason `bank-validation: …` instead of stopping the whole booklet. On 12 November, 795 questions that were otherwise ready failed this way: 232 in 55 masters and 563 in 84 textbook chapters. Almost all failed on slash-style fractions such as `3/4` in worked answers.
- **Which slashes the bank accepts** (James, 12 November 2026). The fraction check (`invalidFractionSpans`, `src/lib/practice-question-model.js`) now accepts these slashes:
  - **units and rates:** `\text{ cm}^3/\text{min}`, `\$2.80/\text{kg}`, `^\circ\mathrm{C}/\mathrm{min}`, `\mathrm{m/s^2}`, `\$5028\text{/year}`, `\text{ nautical miles/h}`;
  - **a lone `/`:** a rising-slope mark in a gradient table;
  - **anything inside an exponent or a limit:** `x^{1/2}`, `e^{-t/5}`, `\int_0^{\pi/2}`;
  - **factorial ratios:** `5!/3!`.

  Every other slash between quantities still needs `\frac`.
  - **Effect:** of the 795 questions that failed on 12 November, 219 now pass. The 2,855 flagged slashes had been sorted by their operands first; scripts and lists are in `.booklet-work/bank-import-20261112/fraction-*`.
  - **Still failing:** 574 questions (94 masters, 480 textbook chapters, 124 booklets), all with genuine slash fractions such as `x=\pi/2`, `1/x`, `-5/3`, `AC/BC`, `96/12=8`, mostly in worked answers. They need a notation repair.
  - **One exception left on purpose:** `\text{more than 10 km/h over limit}` (`iceem-10-ch15-20261015` p23-q3) is still refused. It has the same shape as `\text{mg/L per x}`, which the earlier unit tests reject on purpose.
- **Counts.** A question already in the bank before the run counts as `published-before`, not as created, even though the receipt keeps its earlier entry.
- **Planner.** Each booklet's origin is cached by file time and size, so repeat plans no longer re-read every booklet: 3.5 s down to 28 ms.

**Pilot published, 12 November 2026** ("Yes publish", James):
- `s6adv-sequences-and-series-1-sequences-and-series-v1`: 16 new questions, origin `master`.
- `cambridge-x11-ch01`: 76 new questions, origin `textbook`. The follow-up `p10-q8` was judged `independent` (booklet r6), and the chapter was accepted as a textbook at r7.

Every record was read back as valid and synced, with its origin in the record and in the manifest.

**Pilot preview, 12 November 2026** (`--preview`, nothing saved). The master would create 16 questions; 3 Exam questions are out of scope. `cambridge-x11-ch01` would create 75; follow-up `p10-q8` ("Use the techniques of the previous questions") waits for the judge. Every staged record carries its origin and passes bank validation.

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

**Readiness rerun, 12 November 2026**, after the Stage 6 audit and the skill-id repair. One master was busy (`s6ext1-3-parametric-form-v1`).

| Origin | Questions | Linked | Publish | Linked to a master | Held | Follow-ups | Left out | Out of scope |
|---|---|---|---|---|---|---|---|---|
| Masters (210) | 15,962 | 6,431 | 4,493 (+27 link) | — | 83 | 9 | 287 | 4,632 |
| Textbooks (129) | 12,723 | 558 | 11,212 (+1 link) | 52 | 2 | 53 | 845 | — |

- **Masters left out:** 253 `no-recorded-review`, 120 `rating-not-current`, 10 `no-known-skill`, 10 `review-stale`. Reasons overlap, so they sum to more than 287.
- **Textbooks left out:** unchanged from 11 November.
- **Skill-id repair, 12 November.** Fourteen audit-added questions in nine masters were mapped to the skill of the questions beside them, through `publish-project.mjs`. Two mappings were corrected by hand to the matching skill: `parabola-intercepts-axis-vertex` and `recurring-decimal-to-fraction`.
  - Not repaired: one block in `inverse-functions-2-v1`, because saving that master would also take over a textbook-owned bank question (existing drift, Decision 16), and seven in `linear-relationships-2-v1`, whose own questions carry no skill ids at all.

**Built since: see [Built, 12 November 2026](#built-12-november-2026).**

## Open points

- Whether the 8,919 unpublished master questions include ones the audit added and still flags as comments-only. These would be left out until resolved.
