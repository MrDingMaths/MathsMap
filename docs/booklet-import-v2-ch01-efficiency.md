# Import v2 efficiency: Mastering Maths Adv 11 Ch 1 case study (12 November 2026)

Status: investigation, implemented changes and the Ch 2 pilot ([section 8](#8-pilot-mastering-maths-advanced-11-chapter-2-12-november-2026)). Companion to [import pipeline v2](booklet-import-pipeline-v2.md).

## Context
The Ch 1 textbook import (`mastering-maths-adv11-ch01`, 128 blocks) took 2 h 45 min, made 8 full exports against a budget of 3, and needed 4 sample-review rounds. James asked for a read-only investigation: verify the reported figures, reconstruct what each retry achieved, and deliver a ranked set of changes with a pilot plan for the next chapter. Model settings, worker limits and publication gates are fixed. Nothing in the run folder, project or bank was modified. An independent session's report on the same run was reconciled in.

Run root below: `.booklet-work/full-imports/mastering-maths-adv11-ch01/` (RUN).

## 1. Baseline: the reported figures checked against the artifacts

| Measure | Reported | Measured | Source |
|---|---|---|---|
| Elapsed | ~2 h 45 min | **164.6 min** (manifest 08:07:52 → last visual call 10:52:27) | `manifest.json`, call dirs |
| Active wall time (a model call or export running) | — | **112 min** (model 99, export 13); about 53 min of coordinator work, scripts and idle gaps | union of call-dir and `run-events.jsonl` intervals |
| Summed worker time | — | **250 min** (author 105, inventory 60, visual 37, content 36, sample 7, finish extras 5) | call-dir file times |
| Sol medium calls | 50 | **50** (24 inventory including a page 9 retry; 26 author) | `semantic-packets/` |
| Sol low calls | 254 | **254** in `lean-review/calls` (72 content, 59 sample, 123 visual), **plus 29 not counted** in `lean-review/finish/**/calls` (7 repair, 2 verify, 18 content-author, 2 content-check). Total 283 | call dirs |
| Tokens | — | input 19.6 M (10.7 M cached, 8.8 M uncached), output 517 K. **Visual: 8.85 M input (45%)**; content 3.8 M; author 2.5 M input / 242 K output; inventory 1.5 M / 133 K | `turn.completed` usage |
| Full exports | 8 vs budget 3 | 8 (1–3 exit 1; 4–8 `overBudget`), plus 5 sample exports; ~75 s each | `run-events.jsonl`, `streamlined-exports/*/report.json` |
| "197 accepted visual inspections" | 197 | **Mislabelled.** 197 is the final gate's `pagesAccepted` for export 8, of which 8 pages were inspected fresh. Across the run: **534 fresh inspections (434 accepted, 100 findings)** + 868 pixel-retained rows (exports 2–8), plus 59 sample inspections | `finish-batch8.log`, `visual-plan.json`, `reviewed.json`; `publish-verified-chapter.mjs` prints it as `passedVisualInspections` |
| Content re-reviews | — | 40 first-pass calls (35 + 5 retry) then **32 re-review calls** after visual repairs (10:01–10:48) | content call timestamps |

Timeline (local): inventory 08:08–08:31 · sample authoring + local repair 08:31–08:44 · 4 sample rounds 08:44–09:07 · bulk authoring 09:07–09:37 · content review 09:40–09:50 · **export/repair loop 09:52–10:52 (60 min, 8 exports, 6 visual rounds)**.

## 2. What each retry achieved (measured)

**Authoring.** 6 of 26 author calls failed validation; **5 were valid output rejected by the validator** (labels "Fundamentals 1", "Problem 1" and similar in shared stems, and a "renderer-owned page styling" exclusion), and 1 needed a one-field patch (`pedagogyRole`). All 6 were recovered locally, so **6 model calls were saved and 0 were regenerated**. The fixes (`practice-only-scope.mjs` label and exclusion regexes, in commit e0dd6e9db) prevent these exact forms only. Another publisher's labels ("Ex 1.2 Q3", "Extension 4") could fail the same way (hypothesis). The page 9 inventory retry came from a free-text `presentation` field (hypothesis: schema).

**Sample (4 rounds, 5 exports).** Round 1 found 6 defects. Round 2's new defect (sketch order) was caused by the round-1 fix, and round 3's label regression was an over-correction. Export "aligned" failed lint because a content patch introduced an unmatched `$`, so it was never reviewed. Student pages 3, 4, 7, 12 and 13 and the `p23-q1` worked solution were never reviewed. The align-gap defect was fixed block-locally in the sample and recurred on source pages 7–9 and 13; its renderer fix came only before export 8.

**Full exports.**

| # | Result | Cause | Earliest detectable |
|---|---|---|---|
| 1 | fail | `question-column-overflow` on `p14-p1` (three identities in a 3-column grid, up to 20.8 mm over) | authoring output (`layout: grid, columns: 3`; validation already said size fit unverified) |
| — | round 1: 198 inspections, 51 findings | missing Fundamentals/Challenge headings, cue+blank wraps, exercise starts in worked edition, repeated left-hand sides, align gaps, "Question 1(c)" reference | sample pages held 6 of the 7 patterns; none was flagged |
| 2, 3 | fail | `footer-overflow` on `p23-q1` (oversized investigation solution) **introduced by `apply-final-findings`** (deleting `sourceAtom` made it unsplittable). The 4 mm global reserve in export 3 didn't help and changed all 128 block stamps | a targeted render of the changed blocks |
| 4–7 | pass; rounds of 148, 124, 24, 32 inspections; 25, 13, 6, 5 findings | **18 findings introduced by the repairs' own reflow** (keep-together flags, breaks pointing at the wrong part, inline headings); 3 persisted from round 1 | a targeted render of repaired blocks and neighbours |
| 8 | pass, 8 fresh inspections | — | — |

- **Repeated across editions:** about 28 of the 100 findings repeat the same defect in another edition (student / with-short / with-worked triples). Combined editions took **263 of 534 fresh inspections**.
- **Reuse:** all of it came from pixel-identical retention (`retainPixelReviews`). Pixel-retained rows per export were 0, 81, 72, 65, 85, 185, 179, 201 (868 in all), and **stamp-carried rows were 0 in every export** (`streamlined-exports/*/visual-plan.json`: `retainedReviewKey` vs `carriedReviewKey`). The block-stamp carry added for v2 contributed nothing here. Two candidate causes, not yet separated:
  - stamps hash the renderer and every setting (`lean-visual-evidence.mjs:87-106`); src/ changed between exports 2–7 (`exportSeeding`: `renderer-changed`), and the 4 mm global reserve changed all 128 stamps;
  - 56–76 of ~210 rows per plan have no stamp (split-block pages), and any page beside one still to inspect is refused.

  Reflow, not lost evidence, drove re-inspection.
- **Tool gaps:** 7 one-off scripts (`apply-final-findings`, `refine-layout`, `compact-investigation-answer`, `apply-export4..7-findings`) did repairs that `lean-review repair` can't express: category headings, worked-edition keep-together, part-level breaks, row spacing, splitting align chains. Only 1 corrections-ledger entry was written after 09:50 (hypothesis: script edits bypassed the ledger).
- **Joshua pilot (comparable textbook run, 138 blocks, 4.4 h):** 62 author calls (12 failed, no local repair existed yet), 194 visual calls (14.7 M input), 11 full exports (4 failed). Ch 1 is better on every axis; the remaining waste is the export/repair loop, not authoring.

**Where the cost is:** time is dominated by Sol medium authoring/inventory (66% of worker time, 73% of output tokens; model settings are fixed) and by the serial 60-minute export/repair loop. Tokens are dominated by visual review (45% of input). The loop is the only large cost the constraints let us cut.

**Savings that would just move effort:** skipping the sample review (defects move to full exports at 5 editions × reflow); dropping combined editions entirely (round 2 had 4 with-worked-only heading defects); skipping content re-review on changed answers (weakens the confirmed-answers hand-off); bigger author assignments (Joshua's larger chunks raised failures).

## 3. Ranked changes

### 1. Pre-print preflight gate before the first full export (and after every repair batch)
Blocking lint first (the "aligned" sample export was wasted on an unmatched `$`). Then deterministic checks on the candidate, plus a DOM-only pass, before any finish export prints:
- category heading present whenever `sourceIdentity.category` changes (125 blocks carried it; validation note `nr-p5-finding-11`);
- cue letter / `x =` kept with its dotted blank;
- forced exercise start in the worked edition;
- repeated left-hand side or blank-row gaps in `align*`;
- grid column fit (`question-column-overflow`) and answer/footer overflow, via `check-compact-exercises --development --target-blocks` (10–31 s vs ~75 s; `check-compact-exercises.mjs:138-356`).

Finish exports are drafts, so they print even when DOM fails (`lean-review.mjs:621`, `check-compact-exercises.mjs:359-368`); make DOM failure block printing for finish too.
- **Evidence:** export 1 overflow, exports 2–3 footer overflow, about 30–35 of round 1's 51 findings.
- **Estimated saving (hypothesis):** 2–4 fewer full exports; 120–250 fewer fresh inspections (2–4 M input tokens, 25–50 visual calls); 15–30 min elapsed.
- **Preserves the gates:** checks only add blockers; every Questions page is still inspected once against the source; the 5-edition export and `deliverable: true` are unchanged.
- **Smallest experiment (read-only):** run the checks as a scratch script over `RUN/candidate.project.json` (09:37) and `RUN/candidate-reviewed.project.json` (final).
  - Recall = round-1 distinct defects flagged on the first file.
  - False positives = flags on the accepted final file.
  - Confirm if recall ≥ 60% with ≤ 5 false positives.
  - Then replay `p14-p1` and `p23-q1` with `--target-blocks` on a throwaway project copy (created and deleted; never the completed project) and confirm both overflows appear.

### 2. Repair loop: verify each repair batch with a targeted render; layout-only repairs skip content re-review; add the missing repair fields
- Add `lean-review repair` patch fields for what the 7 scripts did: `flow.practiceCategoryHeading`, worked keep-together, part-level break, row spacing, align-chain split. The ledger then records every change.
- Each finding names its owning block or response and a concrete post-repair check, such as "parts i–iii start on one worked page" or "the tallest fragment fits above the footer". A misplaced parent break on the cost-model task produced near-empty pages in round 5.
- After a batch, render the changed blocks ±1 page with `--target-blocks` across the affected editions, and loop locally until DOM-clean before the next full export.
- Re-review content only when a block's printed task or answer hash changes (`reasoningTaskHash` plus answer fields), not for layout fields.
- **Evidence:** 18 reflow findings and 4 extra exports came from repairs; 32 content re-review calls; 7 one-off scripts.
- **Estimated saving (hypothesis):** 2–3 fewer full exports (each loop cost 5–12 min); 150–250 fewer inspections; 15–25 of 32 content re-reviews (0.6–1.5 M tokens); 15–30 min.
- **Preserves the gates:** content re-review still runs for any changed answer or prompt; the final export still gets the visual round on changed pages ±1.
- **Smallest experiment (read-only first):**
  1. Classify the 32 re-reviewed blocks by whether their task/answer hash changed between first acceptance and re-review (`reviewed.json`, `lean-review/finish/state.json` stamps). This gives the measured upper bound on calls saved.
  2. Then replay export 4's repair (`RUN/pre-export4-findings.project.json` + `apply-export4-findings.mjs` patches on a throwaway copy) with `--target-blocks` and check whether round 3's 7 split findings appear as DOM issues or page-split signals.

### 3. Sample as a pattern pilot, with shared causes fixed in shared code before bulk authoring
- `selectLayoutSample` (`lean-visual.mjs:48-61`) picks figures first with a limit of 8 and ignores source groups. It should also pick by pattern: category boundaries, cloze with cues, align derivations, investigations, cross-page references, and each exercise start in the worked edition.
- Every sampled block must render in every applicable edition. The investigation `p23-q1` got no worked page because it was classified as teaching.
- Review every sample page (5 student pages were never seen). Give the reviewer the neighbouring page so cross-references can be checked.
- Any sample finding with a shared cause (headings, align compaction, chilli marker, label baseline) is fixed in renderer or tools **before** bulk authoring. src/ stays frozen through finish, so stamps and export seeding stay valid.
- **Evidence:** 6 of 7 full-export patterns were on sample pages; renderer edits mid-finish invalidated all carried evidence; the align-gap fix was block-local and recurred.
- **Estimated saving (hypothesis):** +5–15 sample inspections (+0.2–0.4 M tokens, +3–6 min) to avoid 1–2 full repair rounds (10–25 min, 100–200 inspections).
- **Preserves the gates:** adds review; nothing is skipped.
- **Smallest experiment (no model):** run the extended selector over `RUN/candidate.project.json` and count coverage of the 7 categories and the added pages. Confirm if all 7 are covered with ≤ 4 extra pages.

### Lower-ranked
4. **Reuse diagnostics first, then cross-edition reuse.** Log why each page was or wasn't reused (no stamp, stamp changed and why, neighbour rule, issue page). Only broaden reuse once the zero stamp-carry result is explained. After that, a combined-edition page could inherit an accepted standalone page with the same blocks, mode and stamp, and findings would be deduplicated by block set. Combined editions took 263 of 534 inspections and produced ~28 duplicates. Possible saving: 80–180 inspections (hypothesis). Experiment (read-only): for exports 4–5, recompute stamps per row and attribute each non-carry to its cause.
5a. **Intake smoke test of source conventions (from the independent session).** Before bulk dispatch, check one real example of each source convention (label forms, decorative backgrounds, investigation with embedded teaching, unkeyed answers needing all key pages) against the inventory and author validators, and allow label patterns in run config so a relaxation doesn't need a mid-run scripts/ edit. Ranked low: 7 of 50 calls failed, but 6 were recovered locally with no regeneration, and the measured wall cost was about 3–13 min (08:41–08:44, plus 09:37 for page 20). The early sample already plays this role (5 of the 6 failures surfaced there). Expected saving: 0–7 calls' latency.
5. **Honest metrics.**
   - Count all call dirs, including `finish/**/calls`.
   - Label 197 as accepted pages, not inspections.
   - Report active vs elapsed time and the script count.
   - Fail completion if script edits bypass `corrections.jsonl`.

   No saving, but the pilot needs it.
6. **Cache-friendly prompts.** Content prompts got 42% cached input against 57% for visual. Put fixed contracts first and per-batch payload last. Saves cost, not time. Experiment: compare cached/input on 5 content calls.

## Reconciliation with the independent session
- **Agreed (measured the same):** 50 Sol medium calls; 254 lean-review calls; 534 visual verdicts / 100 needs-change; 197 is a gate count; 8 exports with 1–3 failing automated checks; zero stamp-carried rows; 6 local recoveries, 0 regenerations.
- **Adopted from them:**
  - **Every sampled block must appear in every applicable edition.** The investigation `p23-q1` got no worked page in the sample because it was still classified as teaching (`pedagogyRole: investigation`, patched to null later), and it later caused exports 2–3. This goes into change 3.
  - **Run blocking lint before rendering.** The "aligned" sample export failed lint. This goes into change 1.
  - **Give each finding an owning block or response and a concrete post-repair check.** Example: a break attached to the parent of the cost-model parts produced near-empty pages. This goes into change 2.
  - **Diagnose reuse before broadening it.** This becomes change 4.
  - **The intake smoke test** becomes 5a.
- **Where I differ:**
  - Their change 1 saving (2½–4 min of rendering) counts only render time. The measured cost of exports 2–3 was the 10:11→10:19 loop plus a global setting change that re-stamped all blocks. The bigger saving is avoiding the visual round and reflow chain (rounds 2–5: 328 inspections, about 30 min).
  - Their target of "≥25% fewer verdicts" is looser than what the replay suggests is reachable, so I keep ≤250 fresh inspections per 100 blocks (−40%).
  - I also include the 29 finish-internal Sol low calls that both reports' headline counts omitted.

## 4. Pilot on the next textbook chapter
Use the next Mastering Maths Advanced 11 chapter, with a fresh v2 run, the same models, 3 workers and the same gates. Land changes 1–3 (plus 5 for measurement) first, each with tests, behind `importPolicy: "import-v2"`; no src/ or scripts/ edits during the run. Normalise per 100 blocks, against Ch 1 and Joshua.

| Metric (per 100 blocks unless stated) | Ch 1 baseline | Pilot success |
|---|---|---|
| Full exports (absolute) | 8 (3 failed) | ≤ 4, 0 failed on an automated check that preflight covers |
| Sample rounds | 4 | ≤ 2 |
| Fresh visual inspections | 417 | ≤ 250 |
| Visual input tokens | 6.9 M | ≤ 4.0 M |
| Content re-review calls | 25 | ≤ 8 |
| Findings introduced by repair reflow | 18 (absolute) | ≤ 3 |
| Export/repair loop (first export → deliverable) | 60 min | ≤ 30 min |
| Elapsed (per chapter of ~130 blocks) | 165 min | ≤ 120 min |
| One-off scripts in run root | 7 (+2) | 0 |

Acceptance must not move:
- `status --exports` → `deliverable: true` on all five editions;
- every Questions page inspected once beside its source;
- `requireReasoningCoverage` 100%;
- every answer confirmed by a Sol low content call bound to the current task hash;
- the inventory fully mapped;
- `check-question-dependencies --strict` passes;
- James spot-checks 10 random printed pages per edition against the source.

Preflight's precision is reported too (flags that were not real defects). Targeted-render time and count are reported beside full-render time, so work moved earlier stays visible. First-pass failures and model usage are recorded per stage.

Order: experiments 1–3 (read-only, about 1 h total) → implement what they confirm → pilot → compare.

## 5. Experiment results (12 November 2026, read-only)

The scripts were scratch files outside the repo. They read the retained snapshots in RUN and wrote nothing.

**Experiment 2a: what triggered the 32 content re-reviews.**
- The 31 re-review calls after the first finish repair covered 57 block reviews on 36 blocks.
- Each block was compared between the snapshot before the repair round (`pre-batch-layout-repair.json` for the 10:05–10:17 reviews, `pre-export4-findings.project.json` for the 10:29–10:48 reviews) and the snapshot after it.
- The comparison ignored layout fields and normalised presentation-only maths edits: `\tfrac` vs `\frac`, row spacing, wrapping braces, repeated left-hand sides dropped from `align*`, "or" vs `,\quad`, non-breaking joins, and category heading text.

| Change behind the re-review | Block reviews |
|---|---|
| Presentation only: heading added to the prompt and later moved to `flow.practiceCategoryHeading` (12 blocks, twice each), repeated left-hand sides removed, cue+blank joins, final-line formatting | **49 (86%)** |
| Task or answer changed: `p24-q2` cross-reference wording (3 times, flip-flopping), `p23-q1` investigation labels and worked rewrite (5 times) | 8 |

- **Result:** confirmed, more strongly than the estimate. Gating re-review on a task/answer hash that ignores presentation would have needed about 7–8 of the 32 calls, saving about 24 calls (≈1.2 M input tokens).
- **Caveat:** the comparison uses snapshot endpoints, not every intermediate state. Maths-equivalent edits should still get a deterministic equivalence check in place of the model call; the normaliser above is the starting point.

**Experiment 1: deterministic preflight, data checks only.** Six checks were run on the export-1 state and on the accepted final project.

| Check | Export-1 state: flags (blocks) | Accepted final: flags | Use |
|---|---|---|---|
| C1 category heading owned where a source group starts | 11 | 0 | blocker |
| C3 forced exercise start in the worked edition | 7 | 0 | blocker |
| C6 cross-question reference without a dependency decision | 2 | 1 (`p15-q2`) | blocker, reviewed |
| C2 cue letter or `x =` kept with its blank | 36 | 29 | **auto-join every cue+blank**, not a flag (non-breaking is harmless; most never wrap) |
| C4 repeated fraction left-hand side in `align*` | 110 | 86 | **retire**: the renderer now compacts these (`compactWorkedEqualityChains`, e0dd6e9db) |
| C5 grid of 3+ columns holding long maths | 7 | 6 | **route to `--target-blocks` render**, not a blocker |

- **Recall:** round-1 findings whose blocks were flagged by the matching check: **38 of 51 (75%)**.
  - headings 22/25
  - cue+blank 9/13
  - cross-reference 3/3
  - repeated left-hand side 3/3
  - overflow 1/2 (`p14-p1` is on the C5 list)
  - split/spacing/other 0/5
- **Result:** confirmed (criterion: ≥ 60% recall, ≤ 5 false positives).
  - The blockers C1, C3 and C6 give 1 false positive on the final.
  - C2 becomes an automatic join, C4 is already handled, and C5 decides where the targeted render goes.
  - The remaining 13 findings (splits, row spacing, one clipped marker) need a render: these are change 2's targeted render and the final visual round.
**Experiment 1b: targeted render replays.**
- No Studio project was needed. `check-compact-exercises --project-file` injects the candidate into the page through route interception, and `routeCandidateProject` (`diagram-preflight.mjs:19`) aborts every non-GET request. Nothing was saved.
- The replays ran against the running Studio, with no `--run-dir` and output in a scratch folder. Run evidence and the project were untouched.
- **Candidates:**
  - e1 = `pre-batch-layout-repair.json`;
  - e2 = e1 plus the run's own `apply-final-findings.mjs` and `refine-layout.mjs`, the edits made before export 2;
  - e4 = `pre-export4-findings.project.json`.
- **Caveat:** the replays use today's renderer, not the frozen export runtime, and e1/e2 don't hash-match the export-1/2 projects exactly (export 1 was itself flagged "exported from different project content").

| Replay | Edition | Result | Time | Full-export equivalent |
|---|---|---|---|---|
| e1, `--target-blocks p14-p1` | student | **caught** `question-column-overflow` p25, `p14-p1-c` 19.4 mm | 8 s | export 1 failed after 78 s (20.8 mm) |
| e2, `--target-blocks p23-q1` | worked | **caught** `footer-overflow` worked p54, 2.53 mm (identical to export 2) | 12 s | exports 2 and 3 failed after 82 s and 73 s |
| e4, `--target-blocks p23-q1,p14-p1` | student, worked | **passes** (repair confirmed) | 26 s | export 4, 76 s, then a visual round |

- **Result:** confirmed. Both historical automated failures appear in 8–12 s without a five-edition export, and the repair is confirmed in 26 s.
- With the C5 grid list and the blocks touched by each repair as targets, exports 1–3 would have been one export, not three.

**Experiment 3: sample coverage.**
- The Ch 1 sample (source pages 2, 3, 15, 16, 23, 24) already contained an instance of every pattern above except C5 grid fit. The C5 blocks are on pages 7, 8, 14, 20 and 21. Adding the first C5 block's page (7, or 14 for `p14-p1`) covers all 7 categories with **one extra page**.
- **Result:** confirmed, with a sharper conclusion. The sample's selection was nearly right. Its review coverage was not:
  - 5 student pages were never reviewed;
  - the investigation got no worked page;
  - each call saw only one page, so the cross-reference couldn't be checked.

  Change 3 should put most of its effort into reviewing every page in every edition with neighbour context, and only one rule into selection (one block per preflight risk class).

**Revised savings estimate after the experiments:**
- **Change 2:** strengthened (about 24 of 32 re-review calls).
- **Change 1:** confirmed at about three quarters of round-1 findings, before any render.
- **Change 3:** narrowed to review coverage plus one selection rule.

Still unmeasured: the full-export and inspection savings, which only the pilot can show.

## 6. Implemented (12 November 2026)

The layout preflight is in `import-layout-preflight.mjs` and `import-finish.mjs`; see [import pipeline v2, Layout preflight](booklet-import-pipeline-v2.md#pilots), just above Pilots.

**Covered:**
- **Change 1:** C1 headings, C3 worked exercise starts, C2 text-cue joins, C6 cross-reference decisions, and a targeted render before every export.
- **Change 2, verification part:** the targeted render covers every block a repair changed before the next export prints.

**Root cause behind the heading findings.** Authoring already supports category headings (`categoryHeadings`/`ownsHeading` in `author-assignments.mjs`), but only for labels on a fixed list (foundation, development, mastery, concept checks, …). Mastering Maths' "Fundamentals" and "Challenge Problems" groups weren't on it, so the author was never asked to transcribe them.
- Widening that list would change assignment plans and IDs, so resumed runs would regenerate authoring.
- The preflight sets the hash-neutral flow heading after authoring instead, using the same inventory evidence.

**Not implemented, needs James's decision: content re-review for presentation-only edits.**
- Experiment 2a showed 49 of 57 re-reviews followed presentation-only changes.
- About 24 of those came from headings typed into prompts, which C1 now prevents, and a further batch from repeated left-hand sides, which the renderer now compacts.
- Edits like `\tfrac` or `{x=7}` still change `reasoningTaskHash`, which covers the whole question including answers. Skipping their re-review would need the rating to be re-bound without a Sol low call. That changes the "rating bound to the current task" gate, so it waits for a decision.

**Change 3 (sample), implemented the same day:** `lean-import.mjs sample-pages`, every authored block sampled, every practice question required in every edition, and paired pages reviewed three at a time. See [import pipeline v2, Early sample](booklet-import-pipeline-v2.md#pilots).
- **Replayed on Ch 1:**
  - The recommender returns the hand-picked pages plus the missing Review page.
  - The edition check names `p23-q1` (short and worked) in both the first and the accepted sample.
  - Full-block sampling covers student pages 2–13 (was 7 pages) and worked 1–10 (was 5).
- **Cost:** with pairing, Ch 1's 24 sample pages would take about 12–13 calls per round instead of the 14–17 single-page calls made, running three at a time.

**Also not implemented:** repair-tool fields for keep-together, part breaks and row spacing (after the pilot, decision 7). Reuse diagnostics: see section 7.

**Baseline test note:** `booklet-import-completion.test.js` "open requests do not accept whole blocks" fails before and after this change. It tests `polish/guards.mjs` `teacherBlocks`, unchanged since 1 November.

## 7. Decisions (James, 12 November 2026) and pre-pilot work

James accepted every recommendation:

| # | Decision | Outcome |
|---|---|---|
| 1 | Re-review after presentation-only edits | **Keep the gate.** Measure the remaining re-reviews in the pilot, then revisit. |
| 2 | Pilot | **The next Mastering Maths Advanced 11 chapter, now.** |
| 3 | Reuse diagnostics | **Done.** Each review now records the parts of its block stamp (`pageBlockStampParts`: blocks, settings, presentation, renderer, page). The stamp value is unchanged: 153/153 Ch 1 export-8 stamps recompute identically. Each visual plan gets a `visual-reuse.json` beside it saying why each page was reused or not (`explainVisualReuse`). Replayed on Ch 1 exports 4–5 (approximate, against the final review table), stamp carry was refused mainly by the neighbour rule (83 pages) and by pages with no stamp, which start or end inside a split block (113). |
| 4 | Cross-question references | **Keep the v2-only blocker; don't widen the shared bank checker.** A read-only report found that reading `flow.dependsOn` in `check-question-dependencies` would newly flag 97 questions in 55 projects (46 already in the bank, 83 in masters). Those are ordering links such as "hence" chains. No unreviewed block anywhere uses the cross-reference wording pattern. |
| 5 | Maths cues (`x = ……`) | **Done.** `document-model.mjs` keeps an inline maths cue and its `joinPrevious` blank in one unbreakable run, and the preflight sets the join for a maths cue ending in `=`. Four existing blanks in two masters already asked for this join: `ratios-2-v1` renders clean; the `s6adv-working-with-functions-2-equations-v1` targeted check stopped on that master's existing 3D-visibility acceptance, so its one guided-practice block is unverified. |
| 6 | Headings at the source | **Keep the preflight fix only.** |
| 7 | Repair-tool fields | **After the pilot.** |
| 8 | Export budget | **Keep logging the overage;** the completion metrics report it. |
| — | Completion metrics | **Done.** `import-run-metrics.mjs` (CLI `--run-id`; `finish` writes `lean-review/finish/metrics.json` for v2 runs) counts every model call (`finish`'s own included), tokens, elapsed, active and worker time, exports and targeted renders, fresh inspections vs pixel-retained and stamp-carried rows, and scripts in the run root. On Ch 1 it reproduces the verified baseline (164.6 / 112.1 min, 333 calls, 534 fresh inspections, 868 retained). |
| — | Old failing test | Left to its owner. Pre-existing failures seen while testing: `teacherBlocks` (guards), two `inactive-cloze-export` tests (the square-root branch hash pin fails at HEAD too) and `arrangement-print` (Git's Xpdf `pdftotext` first on PATH under Bash). |

## 8. Pilot: Mastering Maths Advanced 11 Chapter 2 (12 November 2026)

Run `mastering-maths-adv11-ch02` covers source Part 4, pages 2–23, with answer-book pages 7–13. It ran on the same models, 3 workers and the same gates. It used every change above, plus the fixes the pilot itself prompted, which were committed during the run (listed below).

**Result: not deliverable, pending one decision for James.** Nothing was published to Studio or the bank.
- **What stands:** export 3 has zero DOM and print issues in all five editions, and visual review accepted 161 pages.
- **What remains:** three reviewers independently report the Question 3(b) graph (`p12-q1-b-graph`; student, with-short and with-worked page 18) as "missing its x-axis".
- **The evidence:** the full-resolution raster of export 3 shows a continuous axis; the curve's flat section runs along it at the origin.
- **Why it waits:** overriding an independent visual verdict is James's decision, and the three-export budget is used.

**Measured with `import-run-metrics.mjs`:**

| Measure | Ch 1 (128 blocks) | Ch 2 pilot (97 blocks) | Ch 2 per 100 blocks | Pilot target |
|---|---|---|---|---|
| Elapsed / active minutes | 164.6 / 112.1 | 120.5 / 77.6 (includes about 15 min of coordinator code fixes mid-run) | — | ≤ 120 elapsed |
| Model calls / input tokens | 333 / 19.6 M | 217 / 11.8 M | 224 / 12.2 M | — |
| Inventory + author calls | 50 | 48 (one page-18 author output fixed by local patch, 0 regenerated) | — | — |
| Sample rounds (calls) | 4 (59), sequential, ~5 min each | 3 (59), paired, three at a time, ~1 min each | — | ≤ 2 ✗ |
| Full exports (failed) | 8 (3) | 3 (1: unrendered maths, then a gate gap) | — | ≤ 4 ✓, 0 failed ✗ |
| Fresh visual inspections | 534 | 241 | 248 | ≤ 250 ✓ |
| Visual input tokens | 8.85 M | 4.61 M | 4.75 M | ≤ 4.0 M ✗ |
| Content re-review calls | 32 | 11 | 11 | ≤ 8 ✗ |
| Findings caused by repairs | 18 | 1 (a label the content review then moved back) | — | ≤ 3 ✓ |
| One-off scripts in run root | 9 | 0 | — | 0 ✓ |

Notes on the measures:
- **Scripts:** one structural split (the investigation, below) needed a scratch script outside the run root. All other repairs went through `lean-review repair` correction files, which the correction log records.
- **Stage times:** inventory 16 min (Ch 1: 23); sample authoring 17 min; sample 13 min including fixes; bulk authoring 16.5 min (Ch 1: 30); `finish` 52 min including mid-run code fixes.

**What the pilot exposed, and the fixes committed during the run:**

| Exposed | Fix (commit) |
|---|---|
| Recommended sample pages split a continuation chain, and assembly refused it | Recommender includes whole chains (88bef6f2b) |
| Junk group headers (subtitles, inventory sentences, running headers) | Stricter heading filter (7b8f47cf4) |
| Both sample-review findings were diagram label collisions, and Studio's label check catches them in seconds | Sample applies the preflight fixes and the label check before review (f7d570e8b). Two label collisions on page 23 were then caught before `finish` |
| Page 11's author wrote `\begin{align*}` without `$$` (raw LaTeX in print) | C7 wraps bare displays before content review (027bb0323) |
| The first export's DOM failure wasn't caught because the gate only reported its target pages | Gate always renders an anchor block and reports DOM issues from every page (027bb0323) |
| Page 17's Challenge heading was missed (blocks had no category) | C1 falls back to inventory group members (027bb0323) |
| A cue "‘o" wasn't joined | C2 accepts an initial after a quote mark (027bb0323) |
| Reviewer proposed `flow.dependsOn` between parts of one question, and the rejection held the block (twice) | Recorded as not-required (lean-review `applyCorrections`) |
| The intentional answer-recto blank page was flagged | Skipped by the v2 plan and status (30bd14da5, ff0a5885a) |
| `finish` refused an export silently (a finding's blocks were unchanged after the content review reverted a label) | Loop refusals are reported as blockers (e32f78cb5) |

**Coordinator errors this run (process, not tooling):**
- **Answer pages:** the config gave the composite-functions topic answer page 12 only. The author recorded incomplete answer-key-absence claims for five blocks, which `finish` refused. They were fixed by key references verified against page 11.
- **Investigation structure:** authored as one block with numbered nested questions, so a question number printed twice. It was split into one block per printed question, as in Ch 1.
- **Lesson:** take each topic's answer pages from the answer book's exercise headings, not by estimate. A config check that every topic's exercise heading appears on one of its answer pages would catch this.

**Running the tools on this machine:**
- Set `BOOKLET_CODEX_BIN` to the Codex binary when running from Git Bash; `codex` is not on PATH, and the first inventory launch failed with `spawn codex ENOENT`.
- Run Codex workers with the sandbox disabled, per AGENTS.md.

**Reuse diagnostics (decision 3), answered for this run:**
- Stamp carry again reused nothing, and pixel retention covered all reuse (96 and 95 rows in exports 2 and 3).
- Every page that was not pixel-retained had a real reason (`visual-reuse.json`):
  - its blocks changed (9, then 3);
  - it was flagged (13, then 5);
  - its blocks were new (14);
  - or it had no stamp because it starts or ends inside a split block (33, then 6).
- No renderer or settings change invalidated anything, and the neighbour rule refused nothing.
- Stamp carry is therefore redundant when the renderer is frozen. Retiring it is a candidate simplification, not a saving.

**Still open:** re-review gating (decision 1, gate kept). Content re-reviews were 11 per 100 blocks against Ch 1's 25. Most came from the investigation split and two diagram repairs, not from presentation-only edits.
