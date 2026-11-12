# Booklet import pipeline v2 (plan, 11 November 2026)

Status: **approved 11 November 2026; implementation in progress.** This page replaces the import sections listed under [Docs superseded](#docs-superseded), and a session follows this page alone for a new import. Runs whose manifest records `importPolicy: "import-v2"` use the new tooling; runs started earlier keep their recorded rules (see [Implementation notes](#implementation-notes-11-november-2026)). The two pilots under Implementation notes come before general rollout.

Scope: turning a source into an editable Studio project that is faithful to the source, including its Exam questions and diagrams. There are two tracks through the same stages: **booklet** (a teacher booklet with teaching and practice, which becomes a master) and **textbook** (a practice-only chapter from Cambridge, ICE-EM, Concept Maths and similar, with its answer key). See [Tracks](#tracks-booklet-and-textbook). Out of scope: everything in the [pedagogy audit v2](booklet-pedagogy-audit-v2.md), and mixed practice (see [Hand-off to mixed practice](#hand-off-to-mixed-practice)). Feedback repairs on existing booklets keep the [lean local-repair rule](agent-rules.md#lean-local-feedback-repairs-5-october-2026) and the [verification cuts](booklet-verification-cuts-20261030.md).

## Aims

1. **Faithful.** Every question, part, given, diagram, scaffold, teaching passage and supplied answer in the source is in the project, or has a recorded exclusion. Mathematics is correct; confirmed source errors are corrected and logged.
2. **Editable and house-style.** Native maths, native tables, templated or TikZ diagrams, shared presets and the standard palette. No screenshots of reconstructible maths.
3. **Complete answers.** Every practice question has a short answer and a worked solution in the booklet's taught method.
4. **Rated and classified.** Every practice question has a verified Sol-scale rating and a primary skill.
5. **Ready for the exam pass.** Exam questions are transcribed faithfully where the source puts them, rated, and tagged with what the [exam pass](booklet-exam-completion.md) needs. Import changes nothing about Exam content or structure; the two pipelines are disjoint.
6. **Checked once.** One independent content review, one source-side rendered review, one batched repair round, three exports.
7. **Handed off.** The audit and the bank can trust what import checked, without checking it again.
8. **No pedagogy at import.** Ordering, Challenge moves, gap filling, question types and theory style belong to the audit.

## Roles

| Role | Who | Does |
|---|---|---|
| Prepare, check, measure | Script | source intake, lint, part labels, alignment, gutter, structure, wrapped maths, pagination, exports, automated print checks, solid visibility, shading gate, bank linking, coverage and completion gate, pruning |
| Transcribe | `gpt-6.1-sol` medium (existing transcription setting) | inventory; authoring of questions, answers, worked solutions and classifications (no rating: see [inefficiency 3](#measured-inefficiencies-and-fixes)) |
| Review, rate | `gpt-6.1-sol` low, exactly | content review and rating, visual review, rating fills |
| Decide | James | early-sample questions he is asked, held bank duplicates, unresolved decisions in the completion report |

Import writes no new content, so it makes no `claude-sonnet-5-5` calls.

At most three model workers per booklet, shared by every session using the booklet's run directory. On Windows, Codex runners launch with `sandbox_permissions: "require_escalated"` from the first attempt, and every worker keeps `--sandbox read-only`. No fallback is automatic: a different model or effort must be recorded with its reason. Studio on 5173 is reused, never restarted. Saves are revision-checked; nothing migrates on load.

## Scope boundary

Every check or step that runs at import today, or that a current doc says runs at import:

| Check or step | Today | v2 | Reason |
|---|---|---|---|
| Independent source inventory | import | **import** | fidelity gate |
| Authoring with house presets, templated diagrams, avatars | import | **import** | |
| Early difficult-layout sample + `sample-review` | import | **import** | export 1 of 3 |
| Independent content review (fidelity, maths, answers, method, classification, rating consistency) | import | **import** | the audit relies on it |
| Theory-text fidelity (22 October principles) | import | **import** | fidelity only, small fixes |
| Theory style rules (watertight definitions, concision, active voice, bolding) | audit | **audit** | pedagogy |
| Redundant vertex labels | import | **import** | presentation of source content |
| Exam mark removal (`exam-marks.mjs`) | 29 Oct rule, not in `finish` | **exam pass** | an adaptation of source content with its own proof route; import only locates the tokens |
| Exam questions out of exercises, Exam section order (`regroup-exam-sections.mjs`) | exam pass | **exam pass** | |
| Exam closure, top-up from the MathsBase pool, figure redraws | exam pass (closed 10 Nov for current masters) | **exam pass** | adds questions the source doesn't have |
| Rating of exam questions in the source | import (as practice) | **import** | the exam pass needs `verifiedRating` on every Exam owner |
| Exercise difficulty ordering (29 October, "before review and pagination") | doc says import; code doesn't | **audit** (Stage 2/4) | the audit re-sorts anyway; import keeps source order and `flow.dependsOn` |
| Challenge moves (≥ 60) | audit | **audit** | |
| Within-booklet duplicates | audit | **audit** | v2 Stage 0/3 |
| Bank duplicates and linking | bank publication | **bank publication, separate** (script, no model) | import runs the read-only `bank-links` report |
| Question types (archetypes), worked-example matches, spread | audit | **audit** | |
| Backfill, bridges, extensions, prerequisites, Key ideas additions, Review boxes | audit | **audit** | |
| Pedagogy review before final export (9 October hold) | superseded for textbooks | **retire** for all imports | |
| Polish `pedagogy` step, `blank-style` call, `dependencies` model call | skipped by `--textbook`; `finish` uses `model:false` | **retire** from import | content review covers them |
| Polish full-book first-pass `review` + `residual` | polish route | **retire** from import | `finish` visual review replaces both |
| Polish break suggestions | polish | **retire** from import | [pagination principles](booklet-pagination-principles.md) decide breaks |
| Sweep `normalise`, wrapped maths, pagination | `finish` | **import** | |
| Lint, part-label sequence, dormant alignment, equals gutter, structural preflight, rating coverage (`validateImport`) | `finish` | **import** | one batched gate |
| Solid visibility (`audit-solid-visibility.mjs`) | import | **import** | |
| Diagram sizing (source-calibrated) | import | **import** | |
| Shading review + `check-diagram-shading.mjs` | `finish` | **import** | |
| Five-edition export + automated checks | import | **import** | |
| Source-side visual review | import | **import** | |
| Contact sheets of every Questions page | `finish` | **on demand** | evidence kept just in case |
| Presentation signatures, `sourceReview.visualAudit`, review-first gates, unique-layout pixel comparisons, bounded-stage tickets | legacy runs | **retire** for new imports | the lean route replaced them (confirm `inspectContentCoverage` does not require them) |
| Import duration checkpoints every ten pages | 28 Sep rule | **retire** as a rule | `finish` records phase timings |
| Ratings by comparison (Sonnet) | audit | **audit** | |
| Bank publication (`import-project-bank.mjs`) | separate, "not part of this route" | **separate, on request** (Decision 13) | import leaves the booklet ready for it |
| Run-folder pruning | after delivery | **import** | |

**What import must still do because the audit relies on it:**
- **Sol-scale ratings on every practice question.** Audit ratings by comparison place questions among Sol-rated references; a booklet with few Sol ratings has no ladder.
- **Confirmed answers.** The blind solve skips any question whose answer was confirmed at import with an unchanged fingerprint.
- **`flow.dependsOn` and printed references.** `score-order.mjs` holds dependent groups together.
- **Section roles.** Exercise, Exam, Mixed review and Challenge are recognised by `endSectionRole`. A source Exam section is transcribed as one (`workingSpace: "none"`); moving exam questions out of exercises belongs to the exam pass, which runs before the audit.
- **Worked-example working in `steps` or `theorySolution`**, never in the prompt (`structuralPreflight` reports `working-in-prompt`).
- **Stable block IDs, source references and the correction log**, so audit findings can name blocks and departures.
- **Master status.** The audit only runs on masters (`library.category: "master"` or the ledger), so import sets `library` when the booklet becomes a master.

## Tracks: booklet and textbook

Both tracks use the same stages, tools, gates and models. The manifest records `track: "booklet" | "textbook"`, set at intake. The textbook track replaces the 18 October streamlined-textbook steps, the ICE-EM direct route and the `polish --textbook` mode.

| Stage | Booklet track | Textbook track |
|---|---|---|
| 1 Intake | `--pdf [--docx] --pages` | `--pdf --pages` for exercises, `--context-pages` for teaching pages (method context only), `--teacher-pages` for the answer key; config `contentScope: "practice-only"`, `sourceEvidenceMode: "pixels"`, `settings.questionOrder: "source"` ([practice-only contract](booklet-practice-only-import.md)) |
| 2 Inventory | teaching and practice | practice only. Standalone theory, examples and summaries are excluded with one short reason per region; a definition inside a question is `embeddedInQuestion`. Each question is mapped to its answer-key entry. |
| 3 Authoring | teaching, practice, answers | practice and answers only. Short answers come from the key, worked solutions are authored in the method the chapter's teaching pages use, and shared-stem items become one question with parts. Assembly refuses teaching sections. |
| 5 Content review | source and maths | the same, plus each answer is checked against the key. A key error is logged as `source-error` with the key page; an extraction error is logged separately. |
| 6 Exam hand-off | tag exam questions and mark tokens | the same. Whether the exam pass touches textbooks is Open decision 16. |
| 8 Layout | teaching: source structure, house measurements; practice: presets (Decision 10) | presets for practice; source column counts kept where they carry meaning |
| 9 Visual | every Questions page beside the source; targeted answers | the same; answer pages are checked against the answer-key pages |
| 11 Hand-off | audit seed + import record | import record only (textbooks are not masters, so the audit never runs on them) |
| 12 Bank | readiness report; publish on request | the same. Textbooks are the largest feed for mixed practice, so expect to publish them soon after acceptance. |
| Order | source order | source order, permanently (no audit re-sort) |

`library.category` stays `import-review` until the chapter is accepted (passes the gate and is published to the bank), then becomes `textbook`; see Decisions 15 and 16.

## Stages

One coordinator command, as today: `node scripts/booklet/lean-review.mjs finish --run-id RUN --project-file CANDIDATE --project ID --out OUTPUT`. Stages 1–3 run before `finish` through `booklet:prepare` and `lean-import.mjs`; `finish` runs stages 4–11; stages 12–13 run after it. Every stage resumes from its recorded state.

### Stage 0. Preflight (script)

- Check for running `lean-import.mjs`, `lean-review.mjs` and export processes for this booklet's run. Reuse the canonical run directory, never a second run.
- New manifests record `completionProfile: "import-v2"` and `authoringPreferences: "house-presets-v1"`. Historical runs keep their profile; nothing migrates.
- **Done:** the manifest exists and no other session owns a lease. **Recorded:** manifest.

### Stage 1. Source intake (script)

- `npm run booklet:prepare -- --pdf SOURCE.pdf [--docx SOURCE.docx] --pages 1-N --run-id RUN`. Originals, hashes, extracted media and page images stay local in `RUN/evidence/`.
- **Done:** every selected page has an image and a hash. **Recorded:** `manifest.pins.runFiles`.

### Stage 2. Inventory (Sol medium, transcription profile)

- `lean-import.mjs inventory`. One independent pass produces `sourceInventory`: every question, part, shared instruction, diagram, scaffold, response requirement, teaching passage and supplied answer, with `targetId` or `exclusionReason`; `continuationOf` and `ambiguous` as today.
- It also flags, per entry: exam-mark tokens (`[3]`), exam source titles (HSC, trial, PLC; NAPLAN is not exam), difficulty pictograms (count only, never transcribed), decorative images to omit.
- **Done:** every page is `inventoried: true` from the source, never from counts. **Recorded:** `sourceInventory` on the candidate.

### Stage 3. Authoring and early sample (Sol medium; script)

- `lean-import.mjs author` writes editable questions, short answers, worked solutions, `classification.primarySkillId` and `secondarySkillIds`, `sourceRefs`, `flow.dependsOn` and source-backed scaffolds together, under the author contract (`token-efficient-prompts.mjs`, `house-authoring.mjs`, `DIAGRAM_SIZING_PROMPT`, `CURVED_SOLID_PROMPT`). The author doesn't rate, and it leaves `answerSpaceMm` to the estimator (`estimateWorkedWritingSpace`).
- **Every chunk passes the checks before the next is authored:** `lean-review.mjs lint` and `validateImport` run on each assembled chunk, and every new TikZ diagram is compiled with the label-collision check (`pedagogy/figure-label-check.mjs`). A diagram that fails goes back to the author once, before any review call sees it.
- Exam questions are transcribed where the source puts them, with their mark allocations as printed. The inventory's mark-token and exam-title flags carry through to the blocks (Stage 6).
- Layout follows [Decision 10](#decisions-to-be-confirmed-by-james): source structure for teaching blocks, presets for practice with recorded meaningful arrangements.
- **Early sample:** author the source pages that `lean-import.mjs sample-pages` recommends (see [Early sample](#pilots) in the implementation notes), then run `lean-import.mjs sample` (export 1 of 3) and `lean-review.mjs sample-review`. Findings go back into the author instructions for the remaining pages.
- **A failed author assignment, in this order:** (1) if the output needs an exact fix (a field, a label, a stray block or mapping), use the **local patch repair**, which makes no model call: `node scripts/booklet/run-workflow.mjs attempt-context`, then `repair-attempt`. Every failed assignment with output leaves a ready request in `local-repair-hint.json` beside it, and the error names the route. Don't change that page's config notes in between, or the repair context goes stale. (2) Regenerate with `--regenerate-reason` only when the content must be rewritten. `--repair-from` is the older page-level mapping repair; it doesn't apply to assignments.
- **Done:** every inventory entry is mapped and the sample is accepted. **Recorded:** candidate, sample review.

### Stage 4. Preparation (script, inside `finish`)

- Sweep `normalise` (gutter, cloze, steps, scaffold anchors, calibrated working space) and `dependencies` with `model:false`.
- **Done:** the candidate passes `polishSafetyIssues`. **Recorded:** `finish` state.

### Stage 5. Content review (Sol low, one independent reviewer)

- `lean-review.mjs content`: up to four consecutive blocks per call, three calls at once, with source page images and the topic's earlier teaching. It checks source fidelity, mathematics, every answer and worked solution (derived independently), the taught method, classification, the rating against the rubric, theory-text fidelity, vertex labels, the blank convention, diagram content and sizing intent, and implicit dependencies.
- **The reviewer is the one rater:** it writes the rating (`reasoningScore`, `difficultyReason`, from which the script stamps `difficulty` and `assessment`) in the same call that confirms the answers.
- It returns only corrections that change printed content, an answer, a classification or a rating. It never patches `answerSpaceMm`, widths or spacing: the estimator and pagination own those. Corrections are applied through the correction log and the revision-checked save. A rejected patch is retried once, then the block fails and goes to a person.
- **Change needed:** `lean-review` currently calls `reviewConfiguration()`, which gives Terra high. v2 adds an explicit, recorded `importReviewConfiguration()` (Sol low, with its reason, like `difficultyRatingConfiguration()`) for content, visual and shading calls.
- **Done:** no block pending or failed. **Recorded:** `RUN/lean-review/reviewed.json` (block → content hash, outcome, `acceptedVersion`), `corrections.jsonl`.

### Stage 6. Exam hand-off (script, no changes to content)

Import makes no Exam changes: no mark removal, no regrouping, no reordering, no closure, no top-up. It records what the exam pass needs; see [Hand-off to the exam pass](#hand-off-to-the-exam-pass).
- **Done:** every inventory entry flagged as exam-titled or carrying a mark token has its block tagged. **Recorded:** the tags on the blocks.

### Stage 7. Geometry and diagrams (script; Sol low only for unresolved cases)

- `node scripts/audit-solid-visibility.mjs --strict --only <new 3D diagram ids>`. Unsupported geometry needs a review bound to the source hash, passed to `export --visibility-reviews`.
- Diagram sizing: source-calibrated starting sizes and review triggers, recorded as `spec.sizing.exceptionReason` or `purpose: "drawing"`. Height is measured as well as width; labels are native 10 pt.
- Shading: unshaded by default. The author drops source fills unless it records a purpose. Retained fills are judged inside the Stage 9 visual call for that page, so the separate `shading` call goes. `check-diagram-shading.mjs --lean-reviews` stays the gate.
- **Done:** strict audit clean or reviewed, shading gate passes. **Recorded:** visibility reviews, shading decisions in `reviewed.json`.

### Stage 8. Layout (script, inside `finish`)

- `validateImport` once at the content boundary: lint, part-label sequence, dormant alignment, equals gutter, structural preflight, rating coverage.
- Wrapped maths (`checks/wrapped-math.mjs`), then pagination under the [11 November principles](booklet-pagination-principles.md) (Decision 8: `finish` calls the Paginate booklet pass, `paginate/compose.mjs`).
- **Done:** validation passes and no wrapped maths remains. **Recorded:** `finish` state `layoutHash`.

### Stage 9. Exports and visual review (script; Sol low)

- **Layout check before printing:** a DOM-only layout QA (`inspectBooklet`: overflow, overlap, clipping, palette) on the Questions and answer editions. No PDF is printed while it reports a blocking issue.
- **Export 2:** the five-edition export in the frozen runtime, with automated checks on all five editions and an image preflight.
- **Visual review** (`lean-review.mjs visual`): every Questions page beside its source pages; answer editions use the targeted selection; combined editions only at covers, transitions and flagged pages.
- **One batched repair round:** routed by what must change (layout path or content-capable path). Changed content goes back through Stage 5 for those blocks only. Then re-layout.
- **Export 3:** only pages whose body changed, plus their neighbours, are inspected again. The page hash leaves out the "Page N of M" footer and settings that don't print on that page, so one changed answer width or page count no longer re-inspects a whole edition. A fourth export needs `--regenerate-reason` naming the diagnosed cause.
- **Done:** `status --exports DIR` reports `deliverable: true`, or every remaining item is listed as an unresolved decision. **Recorded:** `visual-findings.json`, export reports.

### Stage 10. Ratings (Sol low)

- The Stage 5 reviewer's rating is the import rating, Exam questions included. Blocks whose task changed in the repair round are rated again when Stage 5 re-reviews them. Anything still missing, default or stale is filled by `rate-studio-questions.mjs --project ID --apply` (Sol low).
- **Done:** `requireReasoningCoverage` passes. **Recorded:** `classification.assessment` (`model`, `assessedAt`, `rubricVersion`, `taskHash`, `evidence`).

### Stage 11. Save (script)

- `finish` publishes the checked candidate through `saveBookletProject` with its expected revision. A progress save (`--save-progress`) stays incomplete.
- Write the [hand-off record](#hand-off-to-the-pedagogy-audit) (new; Stage 11 implementation task).

### Stage 12. Bank readiness (script, no model)

Import doesn't publish to the bank. Publication is a separate step, run when James asks for it ([Decision 13](#decisions-to-be-confirmed-by-james)). Import leaves the booklet ready for it and reports what a publication would do:

- `node scripts/booklet/check-question-dependencies.mjs ID --strict`, then `node scripts/booklet/bank-links.mjs --project ID`.
- Dependencies resolve cleanly, and the completion report lists the `bank-links` counts: questions that would link, be held or be created.
- **When James asks to publish:** `import-project-bank.mjs --project ID --assessments FILE --out DIR`, then `--apply`. Identical questions link, held matches wait for James's **Use existing** or **Keep separate**, and the rest are created. `sourceContext` evidence covers the whole current project hash. For a master, publishing after the exam pass and the audit avoids a second publication for their new questions; a rerun is idempotent either way.
- **Done (import):** `check-question-dependencies --strict` passes and the `bank-links` report is in the completion report. **Recorded:** that report.

### Stage 13. Completion and pruning

- A short completion report: deliverables, substantive source corrections, genuine unresolved decisions, elapsed time per stage and model usage. No receipts, closeout audits or readback scripts.
- When no import, repair or export process is running in any session: `npm run booklet:storage -- exports`, check the preview, then `--apply`.
- Commit with explicit paths after `npm run repo:check`.

## Hand-off to the pedagogy audit

Import records what it checked against the audit's own **content fingerprint** (`contentFingerprint` in `pedagogy/audit-v2-plan.mjs`). That fingerprint uses the same normalised question content as `reasoningTaskHash` in `scripts/booklet/reasoning-ratings.mjs` (the brief's "reasonableTaskHash"), extended to theory passages and with emphasis removed. Ratings keep their existing `taskHash` binding, which the audit already reads as current.

**1. Seeded audit checks** in `booklets/provenance/pedagogy-review/audit-v2/<projectId>.json`, the file Stage 0 of the audit already reads:

| Field | Set for | Meaning |
|---|---|---|
| `checks[blockId].error` = fingerprint | every question, worked example and guided practice item that passed the Stage 5 review | errors already checked; the audit doesn't re-check them |
| `checks[blockId].solve` = fingerprint | the same blocks | answer confirmed; the blind solve skips it |
| `importedBy: {runId, completedAt, reviewModel, reviewEffort}` | the record | provenance of the seeded rows |

Import doesn't seed `duplicate`, `type` or `theory`: the audit owns those checks.

**2. The import record** `booklets/provenance/import/<projectId>.json` (tracked, small), one row per block, keyed by `fingerprint`:

| Field | Content |
|---|---|
| `blockId`, `fingerprint`, `taskHash` (practice only) | identity |
| `answersConfirmed` | `{at, model, effort, evidence}`: the Stage 5 call that derived the answers |
| `rating` | a pointer only (`classification.assessment.taskHash`); the rating itself stays on the block |
| `skill` | `{primarySkillId, secondarySkillIds, verifiedBy: "import-content-review"}` |
| `sourceRefs` | `[{pageNumber}]`, as on the block, plus the inventory entry IDs |
| `corrections` | IDs of rows in `RUN/lean-review/corrections.jsonl` touching this block, with `kind` (`source-error`, `extraction-error`, `rating`, `classification`) |
| `exam` | the exam tags of Stage 6, when present |

The audit treats a row as current while its fingerprint matches, and never re-checks it. A changed fingerprint makes only that block stale, as now.

## Hand-off to the exam pass

The exam pass ([exam completion](booklet-exam-completion.md): `exam-marks`, `regroup-exam-sections`, `exam-closure`, `exam-batch`, `exam-figures`, `exam-publish`) runs after import and before the audit. It owns every change to Exam content and structure. Import leaves, on each flagged block:

| Field | Content |
|---|---|
| `sourceReview.exam.title` | the printed source label (HSC 2019 Q12, trial, PLC, "Sample Question"), exactly as printed; NAPLAN is recorded as `naplan: true` and is not an exam question |
| `sourceReview.exam.markTokens` | each candidate mark allocation, with path, exact text and source page, as inventory evidence for `exam-marks.mjs` (which still makes its own source-proven decision and inverse proof) |
| `sourceReview.exam.sourceSection` | where the source put it (Exam section, chapter review, exercise) |
| `classification` | the Stage 5 rating (`verifiedRating`), which closure requires for every Exam owner |

Order of pipelines for a new master: **import → exam pass → audit.** The audit expects exam questions already in the Exam section (its Aim 1), and the exam pass expects verified ratings and an untouched source.

## Hand-off to mixed practice

Mixed practice is not designed here. Import leaves what bank publication, and later selection from the bank, will need:

- every practice question ready to publish (Stage 12): self-contained (`check-question-dependencies --strict`), with both answers;
- a verified Sol rating bound to the task and a primary skill with `sourceContext` (syllabus `courseIds`, `topicIds`, `evidenceBlockIds`, `mappingNote`);
- exam provenance (`sourceReview.exam`) on every exam-titled question, and NAPLAN questions kept as practice;
- native diagrams with their sizing specs, so a question renders outside its booklet;
- the booklet's section role for each question (exercise, Exam, Challenge), so a later selector can filter.

The audit adds `archetype` later; mixed practice should read it from the bank when it is designed.

## Models

| Work at import | Model |
|---|---|
| Inventory, authoring | `gpt-6.1-sol` medium (existing transcription setting) |
| Content review and rating (Exam questions included), visual review (including retained fills), rating fills, unresolved dependency or blank calls | `gpt-6.1-sol` low, exactly |

No `claude-sonnet-5-5` calls: import writes no new content.

## What James reviews

- Held bank duplicates (**Use existing** or **Keep separate**).
- Unresolved decisions in the completion report (genuine source ambiguity, failed blocks, findings that remained after the repair round).
- The finished booklet in Studio. His comments go through the lean local-repair rule, not a re-import.

## Cost per booklet

Today, measured over 241 lean runs: about 84 blocks, 44 content calls, 43 visual calls, 13 shading calls, 280 page inspections and a median of 5 exports per run. v2 targets, for the same booklet:

- **Model calls:** inventory and authoring, about one call per source page each; content review and rating, about one call per four blocks (about 21); visual review, about one call per eight pages of each standalone edition reviewed (about 15–20 for a 60-page booklet); no separate shading calls; one repair round; rating fills only for blocks the repair changed.
- **Exports:** three (sample, final, post-repair).
- **Page inspections:** about 120–160 (each Questions page once, targeted answer pages, boundaries, then changed pages and neighbours).
- **Textbook track:** no teaching blocks, and the answer key replaces most solving effort, so expect about two-thirds of the booklet track's calls.
- Repeat runs on an unchanged candidate cost nothing: every stage resumes from its hashes.

## Measured inefficiencies and fixes

Measured on 11 November 2026 from the run records of 299 imports in `.booklet-work/full-imports/` (September–October 2026; 241 have lean-review tables). Sources: `workflow/run-events.jsonl`, `lean-review/corrections.jsonl`, `reviewed.json` and `lean-review/calls/`. Phase hours count only phases that logged start and finish events, so they understate the totals. The aggregation scripts are read-only and live outside the repo.

| # | Inefficiency | Measured | Cause | Fix in v2 |
|---|---|---|---|---|
| 1 | **Visual review mostly finds nothing** | 67,358 page inspections; 5,568 (8.3%) needed a change. 10,430 visual calls, as many as content calls (10,585). Recorded visual-review phases: 87 h in 46 runs, the largest single cost. | Pages re-inspected after unrelated changes: the page hash covers the footer ("Page N of M") and every project setting. Combined editions and repeat rounds. Layout faults that a DOM check could find. | Stage 9: footer and non-printing settings leave the page hash; DOM layout QA before printing; combined editions only at boundaries; each Questions page inspected once plus changed pages and their neighbours. Expect about one inspection per page per edition reviewed. |
| 2 | **Exports used to find defects** | 2,460 export phases, 772 failed (31%), 41 h; median 5 export folders per run against a budget of 3 (max 42). Most failures are exit 1 with a written report: checks failing, not crashes. | Lint, structure and layout faults first appear at the PDF stage (the Compound Interest lesson, 5 October: eight final exports). | Stage 3: lint and `validateImport` on every chunk. Stage 9: DOM layout QA gates printing. `finish` keeps the three-export budget and the named-cause rule. |
| 3 | **Ratings done twice** | 4,889 of 20,233 content-review corrections (24%) were rating or difficulty patches; 2,738 touched `classification`. | The author (Sol medium) rates, and the reviewer re-rates and patches it. | The reviewer (Sol low) is the one rater (Stage 5). This also settles the model rule for ratings (Open decision 3). |
| 4 | **Reviewer patches working space that is overwritten anyway** | 3,263 `answerSpaceMm` patches, plus 376 `widthMm`. | Stage 4 sets the calibrated working space and pagination re-tightens it, so review patches are discarded. | The reviewer never patches spacing (Stage 5); the estimator and pagination own it. |
| 5 | **Diagram code repaired in review** | 3,574 corrections to TikZ `code`, the largest single field. | Diagrams authored without compiling or checking labels first; families not covered by the early sample. | Stage 3: compile and label-collision check before review, one author retry; early sample covers every diagram family; templated families (number line, fraction bar or grid, fraction circle, blank grid) are always templates. |
| 6 | **One-off scripts despite the rule** | 2,031 scripts in run folders; Stage 6 Extension 1 runs had 20–61 each. | Gaps in `lean-review repair` (patches it can't express), evidence carried forward by hand, guards scripted around. | `repair` patch files for every repair; tool gaps fixed once in the shared tools; script count reported in the completion report as a metric, not hidden. |
| 7 | **Separate shading calls** | 3,066 shading calls for a default of "no shading". | A separate review call for every fill, including fills the author should have dropped. | The author drops fills without a purpose; retained fills are judged inside the visual call (Stage 7). |
| 8 | **Assembly failures** | 304 of 2,636 assembly phases failed (12%). | Malformed author output found at assembly. | Schema validation on each author reply, with one retry, before assembly (Stage 3). |
| 9 | **Runs spanning days** | Median span 4.2 h, but about 15 Stage 6 runs spanned 40–61 h. | Pauses, shared-renderer edits invalidating frozen exports, waiting for slots. | Pinned frozen runtime (28 October); no `scripts/` or renderer edits while imports run; three workers per booklet kept busy by the refilling pool. |
| 10 | **Prompt bloat from history** | One Chapter 2 prompt was 167,590 characters, 99,643 of them past correction decisions. | Superseded decisions resent with every call. | Calls carry current values only; history stays in the correction log. |

Together, 1, 2 and 3 account for most of the model calls and render time. The plan expects them to roughly halve visual calls and cut exports to the budget of three; these are estimates until two pilot imports (one per track) are measured.

## Redundancy and proposed cuts

1. **Three reviews of the same pages.** The polish `review` (full-book first pass), the polish `residual` and the `finish` visual review all compare rendered pages with the source. Keep only the `finish` visual review for imports.
2. **Three model calls for blank style and dependencies.** The polish `blank-style` and `dependencies` calls repeat what the content review already returns. `finish` already skips them (`model:false`, `--textbook`); state this in the docs and drop them from import.
3. **Exercise ordering twice.** The 29 October rule asks import to sort by difficulty, and the audit re-sorts in Stage 2/4. Sort once, in the audit.
4. **Four "has it changed" hashes.** `contentHash` (lean table), `reasoningTaskHash` (ratings), `contentFingerprint` (audit), and `contentVerificationKey` / `presentationVerificationKey` (direct compact). The hand-off uses the audit fingerprint; the lean table keeps its own hash only to resume; the presentation keys retire for new imports.
5. **Rating-reuse proofs.** `reasoning-ratings.mjs` has nine proof-carrying reuse paths (diagram, native layout, native table, gradient table, construct blank, answer presentation, worked correction, prompt line break, bank projection). Inside an import, a block whose task hash is unchanged keeps its rating with no proof, and a changed one is rerated by Sol low. The proofs stay for existing-booklet maintenance only.
6. **Evidence kept just in case.** Contact sheets of every Questions page after each export (`polish/sheets.mjs` in `finish`): produce them on demand. Presentation signatures and `sourceReview.visualAudit` categories: retire for new imports. Duration checkpoints every ten pages: retire.
7. **Stages the lean cut removed that docs still describe:** review-first gates, the representative-pattern register, bounded-stage tickets and settlement, unique-layout pixel comparison, every-page rasters, footer sheets, separate inventory-maths and teaching approval, the 9 October pedagogy hold, `handoff/run.mjs`, and the `polish --textbook` step 5. These move to a history note.
8. **Separate bank assessments file.** `import-project-bank.mjs` takes `--assessments` although every question already carries a verified rating and skill. Proposed: build that file from the blocks and the import record (implementation task).

## Decisions (to be confirmed by James)

1. Import is source fidelity plus correctness. All pedagogy moves to audit v2.
2. One coordinator (`finish`), one content review, one source-side visual review, one repair round, three exports.
3. Import review, rating and check calls use `gpt-6.1-sol` low through an explicit recorded configuration. The code is changed to match (it uses Terra high today).
4. Import seeds the audit's `error` and `solve` checks and writes the import record.
5. Bank publication is separate from import and runs on request (Decision 13).
6. Polish (`polish/run.mjs`) is not part of import. It remains for existing booklets.
7. Two tracks, booklet and textbook, share every stage and gate; the textbook track replaces the 18 October textbook route and ICE-EM's direct route.
8. The ten measured inefficiencies are fixed in the stages they come from, and two pilots measure the result before rollout.
9. Import and the exam pass are disjoint. Import transcribes exam questions as printed, rates them and tags them; the exam pass makes every Exam change. A new master runs import, then the exam pass, then the audit.
10. **Layout (James, 11 November 2026; Open decision 1, option B).** Teaching blocks (theory, worked examples, scaffolds, guided practice) take their structure from the source: alignment columns, arrow endpoints, side-by-side or stacked arrangement, figure side, indents, emphasis, order and grouping. House style sets every measurement. Practice uses the shared arrangement presets. A source grid, column count, card placement, paired figure or diagram that working must sit beside is kept as a custom arrangement, with its reason recorded in `sourceReview.customArrangement.reason`. Source placement alone is not a reason. Existing booklets are not migrated.
11. **Who rates (James, 11 November 2026; Open decision 3).** The `gpt-6.1-sol` low content reviewer gives each practice question its one import rating (`reasoningScore`, `difficultyReason`; the script stamps `difficulty` and `assessment`) in the same call that confirms its answers. The author (Sol medium) writes no rating. Questions whose task changes in the repair round are rated again when Stage 5 re-reviews them. `rate-studio-questions.mjs` (Sol low) fills only what is still missing. Existing valid ratings in other booklets keep their recorded provenance.
12. **Import review model in code (James, 11 November 2026; Open decision 2).** `scripts/booklet/transcription-settings.mjs` gains `importReviewConfiguration()`, beside `difficultyRatingConfiguration()`: explicitly `gpt-6.1-sol` low, with its reason ("5 November 2026 user policy: booklet-import reviews and ratings use Sol 6.1 Low"), recorded in every call's metrics. `lean-review` content, visual and image-preflight calls use it, and so does `first-pass/review.mjs` when `finish` runs it. `REVIEW_DEFAULT` stays Terra high for every other booklet review. It is never chosen automatically: an import that cannot get Sol low stops and reports why. Finished and in-flight calls keep their recorded model.
13. **Bank publication (James, 11 November 2026; Open decision 7).** Import doesn't publish to the bank. It checks dependencies and reports the read-only `bank-links` counts; `import-project-bank.mjs` runs as a separate step when James asks.
14. **The remaining open decisions (James, 11 November 2026).** Open decisions 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16 and 17 were decided as recommended; each is marked in place. Open decision 15 is settled by Decisions 15 and 16.
15. **Accepted textbook chapters (James, 11 November 2026).** A textbook chapter is accepted when (a) it passes the import completion gate, or, if it was imported before v2, it has its recorded bank-import receipt; and (b) it has been published to the bank (Decision 13). It then becomes `library.category: "textbook"`, with `library.acceptedAt` and `library.acceptedRevision`, and is never archived while it owns bank questions. The audit still skips it. The two chapters already in the bank are accepted on their records with no re-import: `concept-maths-x11-ch01` (312 bank questions, receipt `booklets/provenance/concept-maths-x11-ch01/bank-import.json`; unarchived) and `concept-maths-adv11-ch01` (246). Their bank IDs and the masters' pinned copies are unchanged.
    - **Implemented (11 November 2026).** `textbook` is a category in `src/lib/booklet-library.js` (Studio lists it under "Textbooks", after Import reviews); `normalizeProjectLibrary` keeps `acceptedAt` and `acceptedRevision` only when valid, so other projects normalise as before (test in `tests/booklet-library.test.js`). The audit skips textbooks: it takes only booklet masters (ledger entries or `category: "master"`). Both chapters were accepted through `publish-project.mjs` as library-only saves with no bank writes: `concept-maths-x11-ch01` revision 198→199 (`archivedAt` cleared, `acceptedRevision` 198) and `concept-maths-adv11-ch01` 21→22 (`acceptedRevision` 21).
16. **Masters override textbooks (James, 11 November 2026; to implement).** Today each bank question has one owner (`links[bankId]` in `booklets/question-bank/.sync/links.json`), and only the owner's saves sync automatically. A master holding a textbook question is a pinned consumer, and **Replace bank with this booklet** updates the bank without making the master the owner. New rule: when a master saves an edited version of a bank question owned by a textbook chapter, the save publishes the edit and ownership moves to that master block (through `registerBankOwner`, with the old link kept in `.revisions`). The textbook chapter becomes a consumer and is offered **Use bank version**, as other consumers are. Rules: a master always wins over a textbook, never the reverse; between two masters, the first to save an edit becomes owner and the other stays a consumer; a question edited in both since the last sync still pauses for one **Use bank version** or **Replace bank** decision, as now. Existing pins in other booklets don't move. Today, 146 of `concept-maths-x11-ch01`'s questions sit in Further Transformations 1 and 2 and Inverse Functions 1 and 2. **Implemented (11 November 2026):** `prepareAutomaticSync` in `scripts/booklet/bank-sync.mjs` (called with `projectRoot` by the Studio save path) transfers ownership when a `master` saves an edit to a question owned by a `textbook` or `import-review` project and the bank has not moved since the master's pin; the superseded bank record and owner link are kept under `.revisions/<bankId>/` (`<hash>.json`, `<hash>.owner.json`). A changed bank still gives **Use bank version** or **Replace bank**; masters never lose ownership to textbooks, and the second master stays a consumer. Tests: `tests/booklet-bank-sync.test.js`, "Decision 16" group.

## Open decisions

1. **Source layout vs presets (James asked for this to be raised).** James wants import to "preserve source layout as much as is reasonable". The 4 October rule says source appearance is evidence, not a layout target, and teaching and practice use the shared presets. The rules already split two ways: since 22–23 October, **teaching** blocks take their structure from the source and their measurements from house style. The AGENTS summary still states only the 4 October rule.
   - **A. Presets by default, source arrangement kept where it carries meaning** (current practice rule). Review cost: lowest; presets are fast to author and check. Existing booklets: no change.
   - **B. Source structure for teaching, presets for practice, with recorded custom arrangements for meaningful practice layouts** (the 22 October rule, made explicit). Source column counts and grids in practice (checklist item 5) count as meaningful. Review cost: about today's. Existing booklets: no change.
   - **C. Source arrangement by default everywhere, approximated within the presets** (nearest preset to the source grid, side-by-side and diagram placement). Review cost: higher. Every practice block needs a source comparison in the visual review, and Stage 4 feedback showed region matching made 2 useful repairs out of 54 blocks. Existing booklets: no change unless a migration is requested; new imports would look different from current masters.
   - **Decided: B (James, 11 November 2026).** It matches the reviewer contract that already exists and the teacher feedback behind it, and adds no review cost. See Decision 10.
2. **Import review model in code.** AGENTS.md (5 November) says import reviews use Sol low. `REVIEW_DEFAULT` in `transcription-settings.mjs` is Terra high, `lean-review` and `first-pass/review.mjs` use it, the three-pass doc still says Sol medium in places, and `question-bank-assessment.md` says content reviews use Terra high. **Decided (James, 11 November 2026):** add `importReviewConfiguration()` (explicit Sol low with reason) and use it for every import review call. Preserve the recorded provenance of finished calls. See Decision 12.
3. **Who rates.** The author rates at Sol medium inside its authoring call, and the fixed rule says rating calls use Sol low; the reviewer then re-rates (24% of all review corrections). **Decided (James, 11 November 2026):** the Sol low content reviewer is the one rater and the author doesn't rate. This removes the double rating and meets the fixed model rule. See Decision 11.
4. **Challenge threshold.** `booklet-exam-marks-and-order.md` (29 October) says 65; audit v2 (9 November) uses 60 (`routineCeiling` 59). **Decided (James, 11 November 2026):** 60, from audit v2. Import moves nothing to Challenge.
5. **Blank style.** These conflict: 4 October (dots even when the source has boxes); polish decision 4, 23 October (blank matches the source: brackets → parenthesised gap, box → box); 25 October lean authoring ("remove unnecessary cloze dots and full fraction response scaffolds"); 17 October (full fraction scaffolds keep their boxes; never replace them). **Decided (James, 11 November 2026):** one rule. Ordinary blanks are dotted. A missing numerator or denominator is a native box. A bracketed blank is a parenthesised gap. A full fraction scaffold keeps its boxes. The 25 October wording means *unneeded* scaffolds only, and "box → box" is dropped.
6. **Running the exam pass on new masters.** The exam pass is its own pipeline, disjoint from import, and it closed for the 210 current masters on 10 November. A new master needs it run once after import. Its tools take project lists (`exam-batch.mjs run --projects ID --mode topup`, `exam-figures.mjs`, `regroup-exam-sections.mjs`), but its doc describes a finished campaign. **Decided (James, 11 November 2026):** keep it a separate pipeline with its own doc (`booklet-exam-completion.md`, given a short "per new master" section), run after import and before the audit. Separately, the AGENTS models row "Exam questions … Terra high" is out of date: the exam pass has used Sol low since 9 November.
7. **When to publish to the bank.** The three-pass doc says bank publication is not part of the import route; the rating doc says it is. **Decided (James, 11 November 2026):** bank publication stays separate and runs when James asks. Import only reports readiness (Stage 12). See Decision 13.
8. **Pagination tool.** `finish` and polish call `paginate/optimise.mjs` (`driveStudio`); the 11 November principles name `paginate/compose.mjs` / `booklet-compose.js` as the single pass. **Decided (James, 11 November 2026):** `finish` calls the compose pass. **Done 11 November 2026:** `finish` and the polish `paginate` step both call `driveCompose`; the Optimise pagination button, `paginate/optimise.mjs` and the polish `breaks` step were retired (the compose pass runs the optimiser per exercise).
9. **Visual review scope.** The lean cut (5 October) used a targeted page selection for Questions; streamlined completion (24 October) compares every Questions page with its source; the checklist (review-first) inspects every standalone page. **Decided (James, 11 November 2026):** every Questions page beside its source, targeted answers, combined editions at boundaries (24 October).
10. **Source-relative placement.** The Volume prevention rule (standing conventions; checklist item 16) says keep source-relative diagram and working placement. 4 October superseded it, but both docs still state it. **Decided (James, 11 November 2026):** keep only "a diagram that working must sit beside"; mark the rest superseded.
11. **Speech-bubble portraits.** Checklist item 2 crops 17 mm source portraits; 4 October uses standard avatars and says never crop. **Decided (James, 11 November 2026):** standard avatars; edit item 2.
12. **ICE-EM direct route.** It is still an exception in `finish` (`--iceem-direct`). **Decided (James, 11 November 2026):** the textbook track replaces it for new runs. Keep the flag only for runs that already have it.
13. **AGENTS.md size.** The brief says under 32,000 bytes; `booklets/storage-policy.json` limits AGENTS.md to 8,192 (it is 5,473 now). **Decided (James, 11 November 2026):** keep the 8,192 limit; the diff below adds about 300 bytes.
14. **Presentation evidence.** Direct compact requires `sourceReview.visualAudit` and presentation signatures before acceptance. The lean route doesn't produce them, and `finishStatus` runs `inspectContentCoverage`. **Decided (James, 11 November 2026):** retire them for new imports; confirm during implementation that the coverage check doesn't block on them.

15. **What a finished textbook chapter is.** Textbook projects stay `library.category: "import-review"` (129 projects today) and are never masters. **Decided (James, 11 November 2026):** see Decisions 15 and 16.
16. **Exam pass on textbooks.** The exam pass is built for masters. For textbook chapters, should it run its mark-removal step (so bank questions carry no `[3]`), or leave textbooks as printed? **Decided (James, 11 November 2026):** run only the mark-removal step on textbooks, never regrouping or top-up, so the chapter keeps its source order and the bank gets clean questions.
17. **Visual review of every Questions page (cost vs Open decision 9).** Only 8.3% of inspected pages needed a change. **Decided (James, 11 November 2026):** keep every Questions page for the first inspection (it is where source-side layout faults show), but cut the re-inspections (inefficiency 1). If the two pilots show fewer than 5% of Questions pages need a change, move ordinary pages to the targeted selection.

## Precedence table

| Rule | Current rule (v2) | Source and date | Superseded doc lines |
|---|---|---|---|
| Import review model | Sol low, explicit | AGENTS 5 Nov; audit v2 Decision 10 | `booklet-three-pass-import.md` l.3 (Terra), l.103 and l.132 ("Sol 6.1 medium"); `booklet-lean-acceptance.md` l.3; `question-bank-assessment.md` l.3 ("content/pedagogy reviews … Terra"), l.5; `agents-moved-20261103.md` l.31 ("Sol high"), l.35 ("Sol medium for all … review") |
| Rating of the source's exam questions at import | Sol low (content reviewer) | fixed rule | AGENTS models row "Exam questions … `gpt-6.1-terra` high" no longer applies to import (that row is for exam completion, which import doesn't do) |
| Exam mark removal, regrouping, closure, top-up | exam pass only, after import | this plan; exam completion 3–10 Nov | `booklet-exam-marks-and-order.md` l.19 and three-pass l.5 ("apply exam mark removal … before candidate review/rating") for imports |
| Import route | `finish` (streamlined, 24 Oct) | three-pass 24 Oct | three-pass l.69–90 (18 Oct textbook steps), l.149–153 (9 Oct pedagogy hold), l.155–171 (Passes, ticket route); `agents-moved` l.23–35; `booklet-direct-compact-import.md` l.29–44 (review-first, bounded workflow) |
| Polish at import | not part of import | three-pass 24 Oct | `agent-rules.md` l.126–128 ("run polish before teacher review"), for imports |
| Pedagogy at import | none; audit v2 | three-pass 18 Oct; this plan | `booklet-verification-speed.md` decision 2 and `pedagogy` step for imports; three-pass l.149–153 |
| Exercise ordering | audit v2 Stage 2/4 | audit v2 5 Nov | `booklet-exam-marks-and-order.md` l.19 and three-pass l.5 ("before candidate review/rating and pagination") for imports; `booklet-direct-compact-import.md` l.74 (creation sorts by rating) |
| Challenge threshold | 60 | audit v2 9 Nov | `booklet-exam-marks-and-order.md` l.7 ("65") |
| Layout default | Decision 10 (option B) | 4 Oct + 22/23 Oct; James 11 Nov | `agent-rules.md` l.90–92 (add the teaching-block clause); `booklet-standing-conventions.md` l.17; checklist l.56 |
| Blank style | per Open decision 5 | 4, 17, 21, 23, 25 Oct | `booklet-verification-speed.md` decision 4; three-pass l.179 (second sentence) |
| Visual review scope | every Questions page source-side; targeted answers | three-pass 24 Oct | three-pass l.97 and l.159; `agents-moved` l.31; checklist l.74; `booklet-standing-conventions.md` l.15 and l.19 (legacy, already scoped) |
| Speech-bubble portraits | standard avatars | 4 Oct | checklist l.37 (crop 17 mm source portrait) |
| Exports per booklet | three | lean cut 5 Oct | `booklet-import-efficiency.md` resumable-export guidance for new runs |
| Worker limit | three per booklet | 6 Oct | three-pass l.86 (repeat; fold in) |
| Bank publication | separate, on request; import reports readiness | James 11 Nov | none (three-pass l.147 already says it is not part of the route) |
| Pagination | 11 Nov principles | pagination principles 11 Nov | three-pass l.45 band rule, `booklet-verification-speed.md` "optimiser reorders only within one difficulty band" (already superseded per that page) |
| Presentation evidence | retired for new imports | this plan | `booklet-direct-compact-import.md` l.116–135; checklist l.78–81 |
| Textbook imports | textbook track | this plan | `booklet-three-pass-import.md` l.69–90 (18 Oct streamlined textbook imports, ICE-EM override); `booklet-verification-speed.md` l.39 (`--textbook`) |
| Who rates at import | content reviewer, Sol low | this plan | three-pass l.65 and `question-bank-assessment.md` l.9 ("initial import authoring must supply the raw integer score") |

## Docs superseded

When James approves and the implementation lands, these keep their text but get a one-line header pointing here, for new imports:
- `booklet-three-pass-import.md` (all sections except history and the occurrence-specific fill review)
- `booklet-direct-compact-import.md` ("Prepare and create", "Verification and corrections" for new imports; the data-shape sections stay as reference)
- `booklet-transcription-feedback-checklist.md` ("Required completion evidence"; source-fidelity items stay as authoring rules)
- `booklet-verification-speed.md` (import use only)
- `booklet-lean-import-runtime.md`, `booklet-import-duration-controls.md`, `booklet-import-efficiency.md`, `booklet-review-first-workflow.md`, `booklet-bounded-workflow.md` (new imports)
- `agents-moved-20261103.md` "Future imports: three-pass precedence"
- `agent-rules.md` sections: Streamlined imports (24 Oct), Lean imports (5 Oct), Booklet polish pipeline (23 Oct, for imports), Future imports (28 Sep)

Still in force and linked from this page: standing conventions, cross-session rules, solid visibility, diagram sizing, pagination principles, bank auto-sync, rating policy, storage, change runbook (feedback repairs).

## Proposed AGENTS.md diff

```diff
 | Exam questions: checks and difficulty ratings ([batch](docs/booklet-exam-completion.md#batch-exam-completion-7-november-2026-user-requested)) | `gpt-6.1-terra` high |
-| Booklet imports: reviews, ratings, challenges; difficulty-only rating calls | `gpt-6.1-sol` low |
+| Booklet and textbook imports (including the source's exam questions): reviews, ratings; difficulty-only rating calls | `gpt-6.1-sol` low |
...
-| New booklet import | [three-pass import, streamlined completion](docs/booklet-three-pass-import.md#streamlined-completion-24-october-2026), [transcription checklist](docs/booklet-transcription-feedback-checklist.md), [direct compact workflow](docs/booklet-direct-compact-import.md); `lean-review.mjs finish` completes an import |
+| New booklet import | [import pipeline v2](docs/booklet-import-pipeline-v2.md) only; it links every rule it still uses. `lean-review.mjs finish` completes an import |
```

For Decision 10, add one clause to agent-rules.md l.90: "Teaching blocks take structure from the source and measurements from house style (22 October 2026)."

## Implementation tasks after approval (not part of this plan's deliverable)

1. `importReviewConfiguration()` in `transcription-settings.mjs`, used by `lean-review` content, visual and shading calls and by `first-pass/review.mjs` when called from `finish`.
2. Hand-off writer in `finish` Stage 11: seed audit `checks.error/solve` and write `booklets/provenance/import/<id>.json`.
3. Exam tags (`sourceReview.exam`) written from the inventory flags.
4. `finish` uses the compose pagination pass (after Open decision 8).
5. Sheets on demand; bank assessments built from blocks; the `bank-links` readiness report in the completion report.
6. Inefficiency fixes: footer and non-printing settings out of the page hash; DOM layout QA before printing; chunk lint and diagram compile with label check in authoring; author contract without rating or `answerSpaceMm`; reviewer contract as the one rater; shading folded into the visual call; schema check on author replies.
7. Textbook track: `track` in the manifest, answer-key comparison in the review contract, `textbook` category with `acceptedAt`/`acceptedRevision` (Decision 15); recategorise the two existing chapters.
8. Pilot one import on each track and measure the cost table above before rollout.
9. One-line "superseded for new imports" headers on the docs above; the AGENTS.md diff.
10. Master-over-textbook ownership transfer on first master edit (Decision 16), in the server's automatic sync, with tests for the transfer, two-master and conflict cases.

## Implementation notes (11 November 2026)

Everything below is gated on `importPolicy: "import-v2"`, which `scripts/booklet/transcription.mjs` now writes on new run manifests (with `track: "booklet" | "textbook"`, textbook when `contentScope` is `practice-only`). Runs without it keep their recorded behaviour, hashes and caches. Tests: `tests/booklet-import-v2.test.js` (10 tests).

| Plan item | Where | Notes |
|---|---|---|
| Import review model (Decision 12) | `transcription-settings.mjs` `importReviewConfiguration()`, `withReviewConfiguration()` | Applies to every import, not only v2 (the 5 November rule already says so). `lean-review` content, visual, shading and image-preflight calls and `import-sample-review` use it; `finishImport` runs inside it, so the first-pass and polish repair checks `finish` calls also get Sol low. Other reviews keep Terra high. |
| One rater (Decision 11) | `semantic-workflow.mjs`, `author-assignments.mjs`, `lean-review.mjs` | v2 authors get "do not rate" and no rating validation or stamp. The content reviewer sets `reasoningScore` and `difficultyReason`; the script derives `difficulty`. A passed practice question without a rating goes back once, then fails. |
| Working space (inefficiency 4) | `lean-review.mjs` `applyCorrections(..., {blockedFields})` | v2 content reviews drop `answerSpaceMm` patches as `not-required`, without holding the block. **Departure:** diagram `widthMm` stays patchable, because diagram sizing is part of the content review's own contract. |
| Page hash (inefficiency 1) | `page-review.mjs` `renderedPageHashes(..., {pageHashVersion: 2})`, `check-compact-exercises.mjs` | Version 2 leaves out the footer (page number and revision) and `compactAnswers.diagramWidths`. |
| Print only a passing layout (inefficiency 2) | `check-compact-exercises.mjs` | Non-draft exports stop before printing when DOM checks fail and still write the report. Lean exports are drafts and already collect DOM findings for one repair round, so they are unchanged. |
| Shading calls (inefficiency 7) | `lean-review.mjs` `runShadingReview` | **Departure:** fills are not folded into the visual call. v2 packs up to eight fills from neighbouring blocks into one shading call, with each still decided and recorded individually, so the shading gate is unchanged. Folding is a later step if the pilots show shading calls still matter. |
| Diagram label check (inefficiency 5) | `import-finish.mjs` `diagramLabelCheck()` | Before content review, Studio's label inspection (`pedagogy/figure-label-check.mjs`) runs on unaccepted TikZ. Collisions are completion blockers for a coordinator repair. Checked code is remembered; if Studio is unavailable the check is skipped with a log line. **Departure:** it runs at the start of `finish`, not per authored chunk, so no author retry is automatic. |
| Pagination (Decision 8) | `import-finish.mjs` `layoutFinishCandidate({compose})` | v2 uses `paginate/compose.mjs` `driveCompose`. **Dependency:** `paginate/compose.mjs` and `src/lib/booklet-compose.js` were still uncommitted work from another session on 11 November; v2 `finish` depends on them being committed. |
| Exam tags (Stage 6) | `import-exam-tags.mjs`, called in `finish` preparation | `sourceReview.exam` holds `title`, `naplan`, `markTokens` (path, text, index; prompts only, never answers) and `sourceSection`. Found by pattern, or from an inventory entry's `examTitle`. Metadata only: printed content and review hashes are unchanged. |
| Hand-off (Stage 11) | `import-handoff.mjs`, called when `finish` is deliverable | Writes `booklets/provenance/import/<id>.json` (rows keyed by the audit's `contentFingerprint`) and, for the booklet track, merges `checks[id].error/solve` into the audit record without overwriting the audit's own rows. Only blocks whose lean-table hash still matches are handed off. |

**Textbook-pilot fixes (11 November 2026, Enrichment Maths pilot; tests in `tests/booklet-import-v2.test.js`):**

| Fix | Where | Notes |
|---|---|---|
| Track recorded at intake | `transcription.mjs` `prepare --config FILE` / `--track` | `contentScope: "practice-only"` records `track: "textbook"`. Before this, every prepared run recorded `booklet`. |
| One set of exclusion rules | `practice-only-scope.mjs` | Recognisable wording for embedded definitions, running headers and marked topic headings is mapped to the accepted phrase. The embedded-conflict check runs at inventory acceptance, not first at authoring. Supplied answers are exempt. Vague headings and instruction-like text still fail. |
| No rating request reaches authors | `author-assignments.mjs`, `semantic-workflow.mjs` | Assignment prompts now carry the v2 `reasoning-rating` section, and the classification contract drops rating fields for v2. Authors still estimate `answerSpaceMm`, because the practice-only validator requires `workingSpaceEstimate`. |
| Smaller, cache-friendlier prompt | `author-assignments.mjs`, `semantic-workflow.mjs` | v2 only: fixed contracts and rules first; compact guidance metadata; per-topic `classificationSkillIds` on config topics. Earlier runs keep their prompts and hashes. |
| Larger textbook assignments | `import-v2-authoring.mjs` | v2 textbook default `maxQuestions: 8`, `maxCharacters: 48000`; a run's config overrides it. |
| Page-break continuations | `import-v2-authoring.mjs`, `lean-import.mjs author` | Inventory flags `continuesFromPreviousPage` / `continuesOnNextPage`. `author` derives the pairs into the run config, and declared pairs win. Unpaired flags are reported, not guessed. |
| Foreign mapping | `author-assignments.mjs` `mergeAssignmentPackets` | A mapping to an entry another assignment owns, with no authored content, is dropped and recorded. Authored duplicates still fail. |
| TeX row brackets | `house-authoring.mjs` `braceRowBrackets` | `\\[` starting an aligned row becomes `\\{[}`; spacing arguments such as `\\[4pt]` are kept. |
| Local patch repair is offered | `author-assignments.mjs` `localRepairHint` | See Stage 3. |
| Assembly without author ratings | `assemble-semantic-packets.mjs` | v2 assembly validates with `reviewerRates`, as authoring already did. Before this, every v2 candidate failed assembly. |
| Textbook without teaching pages | `lean-review.mjs` practice evidence | A textbook run prepared with no `--context-pages` uses each question's own pages as its method evidence (the notes sit on the exercise pages). Before this, content review refused questions with an empty `teachingContext.pdfPages`. |
| Reviewer never fails a block for file access | `lean-review.mjs` content prompt | The script pins and hash-checks every original before the call. Reviewers are told so and judge from the images; read-only workers cannot run commands. |
| Cross-page questions republish together | `semantic-workflow.mjs` `runSemanticPackets` | v2 authoring of one page also publishes every page in its continuation chain, so both copies of a continued block come from one attempt ("Continuation copies disagree" at assembly). |

Page notes in `config.pageEvidence` reach both inventory and authoring prompts. Write a note for the stage that is about to run, and replace inventory notes before authoring.

**Textbook pilot result (`enrichment-joshua-ch01a-20261111-r2`, 20 source pages, 138 blocks; finished 12 November 00:03 with no blockers, about 4.4 h):**

| Measure | Pilot | Target |
|---|---|---|
| Inventory / author calls | 29 / about 60; 8 of 20 pages failed first authoring | — |
| Sample exports / sample review calls | 4 / 46 | 1 |
| Content review calls; rating rows | 64; 140 for 138 blocks (one rater) | met |
| Reviewer `answerSpaceMm` patches; shading calls | 0; 3 | met |
| `finish` exports | 11 (4 failed) | 3 |
| Visual page inspections | 1,118 in 194 calls; 13.6% needed a change | about one per page per edition |
| Reviewer rewrites of correct source wording | 15 (`clarify-*`) | 0 |

Fixed during and after the pilot (Codex, 11–12 November): `finish` writes exports under `streamlined-exports/` (exports 1–2 failed the output-path gate); practice-only compose keeps source order (`preserveSourceOrder`) and never grids a `layout: "list"` question; a review is reused when only the checked footer differs and the body pixels match (`lean-visual-evidence.mjs`); `check-compact-exercises --development --target-blocks ID[,ID]` renders the pages of named blocks and their neighbours to check a repair before a full export.

**Pilot review fixes (James, 12 November 2026; tests in `tests/booklet-lean-visual-evidence.test.js` and `tests/booklet-import-v2.test.js`):**

| Fix | Where | Notes |
|---|---|---|
| Acceptance carries across a reflow | `lean-visual-evidence.mjs` `pageBlockStamp`, `carryUnchangedBlockReviews`; `lean-review.mjs` `visualPlan`, `prepareExportVisualPlan` | v2 only. Each visual plan row gets a stamp of its blocks' JSON, their own layout overrides, every other setting, section metadata and the renderer, and each review records it. A re-rendered page with the same blocks and stamp keeps an earlier acceptance. Never carried: the cover, pages that start or end inside a split block, pages with a finding, an automated issue, a sizing review or a contradictory earlier outcome, and neighbours of any page still to be inspected. A pilot replay suggests about a quarter of the 1,118 inspections would have carried. |
| One batched repair per export | `import-finish.mjs` `unrepairedVisualFindings` | v2 records block stamps on each export. A new export is refused while an outstanding visual finding of the last checked export names only unchanged blocks. Exports beyond three are logged and marked `overBudget`; the result reports `exportBudget`. |
| Generated cover not sent to the model | `lean-review.mjs` `visualPlan` | v2 only, unless it is flagged; DOM and PDF checks cover it (15 pilot inspections). |
| Empty source cells stay empty | `author-assignments.mjs` | v2 author prompt: no cloze dots, boxes or placeholders in empty table or grid response cells (the pilot reviewer removed them twice). |
| Correctness-only wording changes | `lean-review.mjs` content prompt | **Decided (James, 12 November 2026):** the v2 reviewer changes source wording only when it is wrong, contradicts the key, or cannot be answered as printed; clarity rewrites wait for audit v2. |

Not yet done: chunk-level lint is unchanged (it already runs per author assignment); the bank-assessments-from-blocks change, sheets on demand, and the booklet-track pilot. The textbook pilot ran on 11–12 November (results above); the fixes since then are not yet measured on a second textbook part. Decisions 15–16 and the doc headers are separate sessions.

**Layout preflight (12 November 2026; [Ch 1 case study](booklet-import-v2-ch01-efficiency.md), changes 1 and 2).** v2 only, not on the ICE-EM direct route. Code: `scripts/booklet/import-layout-preflight.mjs`, hooked into `import-finish.mjs`. Tests: `tests/booklet-import-layout-preflight.test.js`.

| When | What | Notes |
|---|---|---|
| Once, with preparation (before content review and rating) | **C1** `flow.practiceCategoryHeading` on the first block of each printed source group | Headings come only from group headers in the accepted inventory (`effectiveInventory`), matched to `sourceIdentity.category`. Exercise and chapter titles, running headers and numbered subheadings are excluded, so an author-invented category is never printed. |
| | **C3** `flow.workedPageBreakBefore` on each later practice section | Exercise starts stay forced in the worked edition. |
| | **C2** `joinPrevious` on a blank after a one-letter text cue | Maths cues (`x =`) are left alone: they need a judged break. |
| | Evidence | Fixes are recorded in `lean-review/finish/preflight-fixes.json`. C1 and C3 leave `contentHash` and `reasoningTaskHash` unchanged; C2 changes only the task hash, so it runs before rating. |
| Before every finish export | **C6** a block with `flow.dependsOn` whose wording refers to another question needs `sourceReview.bankDependencyReview` | Blocks printing with a named message. |
| | **Targeted render** (`check-compact-exercises --development --target-blocks`, one process per edition, against Studio on 5173) of 3+-column grids holding long maths plus every block whose stamp changed since the last export | Any DOM or printed issue blocks printing. A clean result is remembered per candidate hash. If Studio can't be reached, the edition is logged as skipped, as the label check is. |
| Added after the Ch 2 pilot | **C7** wrap a display environment written without `$$` (fix, before content review) | |
| | DOM issues from **every** page (`--all-dom-issues`), always rendering at least one anchor block | |
| | **C8** a block whose numbered children are groups or questions with parts holds several printed questions: blocker before content review and in the sample | Numbered parts (1)–(6) are legitimate; no existing project is flagged. |
| | **C9** an answer-key absence claim that searched only some of the prepared answer pages: blocker before content review and in the sample | Usually the topic's `teacherPages` missed the exercise. |
| | The sample also applies the preflight fixes and Studio's label check before review | |

**A wrong reviewer verdict.**
- **Command:** `node scripts/booklet/lean-review.mjs decide-page --run-id RUN --exports DIR --edition E --page N --decided-by NAME --reason TEXT --evidence FILE`. It records a person's decision on a page the independent reviewer marked needs-change.
- **What it keeps:** the reviewer's finding (`decision.overrides`), the page hash and raster binding, and a hash of the evidence file. Each decision is appended to `lean-review/page-decisions.jsonl` and counted in the run metrics (`humanPageDecisions`).
- **When to use it:** only for a verdict the evidence contradicts (for example a full-resolution crop showing the "missing" line), and only on James's decision.

Replayed on Ch 1 (about 28 s per state): it stops the export-1 state on `p24-q2` (C6), then on the 8 `p14-p1` column overflows. It stops the export-2 state on the `p23-q1` footer overflow (2.5 mm), and it passes the repaired state. These are the three failed exports' causes. The C1 output equals the 12 headings the visual review demanded and the final accepted project carries.

**Early sample (12 November 2026; [Ch 1 case study](booklet-import-v2-ch01-efficiency.md), change 3).** v2 only; earlier runs keep their sample behaviour. Tests: `tests/booklet-import-sample-v2.test.js`.

| What | Where | Notes |
|---|---|---|
| Choose the sample's source pages | `lean-import.mjs sample-pages --run-id RUN` (`recommendSamplePages` in `lean-visual.mjs`), after inventory and before authoring | It takes the first exercise (or the first page of questions), then the fewest pages that show every pattern the inventory can see: a printed group heading, clozes, tables, diagrams, wide source grids, investigations, review sections, page-break continuations (with the next page) and cross-question references (with the previous page). There is no model call. On Ch 1 it returns 2, 3, 15, 16, 19, 23, 24: the hand-picked six plus the Review page they missed. The coordinator may add pages, never drop a recommended one without a reason. |
| Sample every authored block | `runLayoutSample` (`selectLayoutSample(..., {all:true})`) | The 8-block limit left 5 of Ch 1's 13 student sample pages unreviewed. |
| Every practice question in every edition | `sampleBlocksMissingFromEditions` | A question missing from the short or worked edition fails the sample (`missingBlocks`). On Ch 1 it names `p23-q1` in both, in the first and the accepted sample alike; that investigation later caused exports 2–3. |
| Neighbour context, three at a time | `reviewImportSample` (`pairSamplePages`) | Consecutive pages of one edition go to one call (source images stay within eight), so splits and cross-page references are judged together. Up to three calls run at once. Every page still needs its own verdict. |
| Fix shared causes before bulk authoring | rule | A sample finding with a shared cause (renderer, preset, author contract) is fixed in shared code before bulk authoring starts. `src/` and `scripts/` then stay frozen until `finish` is deliverable (inefficiency 9). A block-local fix is only for a block-local defect. |

Grid fit can't be chosen from the inventory: Ch 1's `p14-p1` was recorded as one column and authored as three. The finish layout preflight's targeted render covers it.

**Author label retry (12 November 2026, Cambridge X11 Ch 5; James chose the code fix).**
- **Why:** 57 of the 157 graphs in the first Ch 5 sample failed Studio's label check, and every checked collision was real on the pixels. Explicit placement rules in the page notes cut that only to 52, because the author can't see where a label lands.
- **What it does:** this is the Stage 3 promise ("a diagram that fails goes back to the author once"), for v2 runs only. After an assignment passes validation, `retryDiagramLabels` (`scripts/booklet/author-label-retry.mjs`, called from `runAuthorAssignment`) runs Studio's label inspection on its TikZ. It then sends only the failing diagrams, with their measured collisions, back to the author in one code-only call (label placement only; paths, points and mathematics unchanged).
- **What it keeps:** returned code that doesn't compile is reverted, and a reply that fails the assignment's validation restores every authored diagram.
- **Recorded:** `label-retry.json` beside the attempt. The call is an `author-labels` attempt event, so the run metrics count it.
- **What it doesn't do:** it accepts nothing. Remaining collisions stay sample and `finish` blockers. If Studio can't be reached, the step is skipped with a log line.
- **Tests:** `tests/booklet-author-label-retry.test.js`.
- **Guard (same day):** a retry that drops or empties any printed `$…$` label is refused, and the authored diagram is kept. One of the 40 Ch 5 sample retries had emptied the source's −3 on a question diagram.

**Resolving a reviewed sample (12 November 2026, Cambridge X11 Ch 5; James chose this over a second review round).**
- **Why:** a sample is accepted only by a review round with zero findings, and `decide-page` works only on `finish` exports. So two false verdicts (a "missing" axis and a "missing" part label, both present at 300 dpi) and a layout finding deferred to `finish` could only be cleared by re-reviewing every page (about 57 Sol low calls), with no guarantee the false verdicts wouldn't repeat.
- **Command:** `node scripts/booklet/lean-review.mjs resolve-sample --run-id RUN --project-file CANDIDATE --sample DIR --resolutions FILE --visibility-reviews FILE`.
- **What it requires:** every needs-change page of the reviewed sample takes exactly one resolution:
  - `decision`: `decidedBy`, `reason` and an `evidence` file, bound to the page hash as `decide-page` does, and logged to `page-decisions.jsonl`.
  - `repaired`: the `correctionId`s applied through `lean-review repair`, verified mechanically by Studio's label check on the candidate (zero collisions) and a targeted render of the repaired blocks (zero issues), and logged to `sample-resolutions.jsonl`.
- **What it doesn't do:** it makes no model call. The `finish` visual review still inspects every Questions page.
- **Tests:** `tests/booklet-import-sample-resolve.test.js`.
- **Fixed alongside:** `targetedRenderCheck` now passes the run's `--visibility-reviews`. Without them, any run with a reviewed 2D curve failed the checker's 3D gate in every edition, which `finish`'s pre-render gate only logged as "skipped", so the gate checked nothing.

**Topic-scoped answer-key absence (12 November 2026, Cambridge X11 Ch 5; James chose this fix).**
- **Why:** content review accepted an absence claim only if it listed every prepared answer page, and then sent every one of those images, and C9 enforced the same rule. Ch 5's answer section has 24 pages against an 8-image limit, so no unkeyed question could be reviewed.
- **The rule now:** a chapter answer book is ordered by exercise heading, so an answer can only appear on its own topic's answer pages. When the run config (`RUN/config.json`) gives the block's topic `teacherPages`, a claim that searched exactly those pages is complete. C9 (`answerKeyCoverageBlockers`) and content review (`practiceContentEvidence`) both accept it, and the reviewer receives only those images. Claims that search fewer pages are still refused.
- **Code:** `topicAnswerScope` and `readRunConfig` in `import-layout-preflight.mjs`.
- **Tests:** `tests/booklet-import-layout-preflight.test.js`.

### Pilots

Before rollout, run one new import on each track with a fresh run (so the manifest records `import-v2`):
- **Booklet:** a teacher booklet of about 40–60 pages with diagrams and an exam-titled section.
- **Textbook:** one practice-only chapter with its answer key.

Measure against the cost table: content and visual calls, shading calls, exports, page inspections, rating patches (expect none), `answerSpaceMm` patches (expect none), label collisions found before review, and elapsed time per stage. If fewer than 5% of Questions pages need a change, move ordinary pages to the targeted selection (Open decision 17).
