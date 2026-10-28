# Booklet end-goal programme (28 October 2026)

Scope: Stage 5/6 teaching masters, not class copies, exemplars or textbook review chapters. Implement phases 1–6 against actual repository state. Phase 7 and source-dependent textbook imports wait for James to finalise the imports. Never import question-bank content into booklets during this programme.

## Approval boundaries

Each phase is piloted before rollout. James confirms the phase 4 real-source label mapping; phase 5 archetype sufficiency and gradient calibration; and phase 6 coverage/principle findings before rollout. A pilot report is not rollout approval. Pedagogy findings and generated drafts stay Studio comments for James; existing suggestions do not authorise content changes. New skill proposals require approval. Preserve class copies until James decides.

New content uses exactly `claude-sonnet-5-5`: backfill, scaffolded bridges, worked examples and guided practice. Verify the configured provider and exact model before generation; absence is a blocker, never permission to substitute. Reviews and ratings retain their settings. Keep comments concise and substantive; prefer scaffolded bridging questions to extra teaching unless the question needs a genuinely new archetype. Preserve explicitly taught methods, including labelled PSF for factorisation where applicable; no blanket method rewrite.

## Verified starting state

| Phase | Starting status | Evidence / next gate |
| --- | --- | --- |
| 1 Shared print fixes | Not started | Combined pagination had no odd-answer-page blank; implement shared fix and verify both parities. |
| 2 Stage 6 moves | Partial | `68040e64`: existing `polynomials-v1` r73 is the live Year 11 Extension 1 **Remainder and Factor Theorem**, page 2 ME1-11-02 with 19 bullets. Preserve identity, content and comments; do not create a replacement or archive it. Compare Logarithms before replacing overlapping content. |
| 3 Curved diagrams | Partial, active owner | `c6772fd0`, `4066c626`, `d45671c4`, `8cf7dc52` repaired 17 diagrams in 8 projects. ICE-EM 10A chapter 6 defects 6A Q1d, Q6f and 6C Q7d have an active separate coordinator. Do not duplicate its edits or shared prompt changes. |
| 4 Exam section | Not started | Read MathsBase only. Real source labels and skill/subtopic mapping need pilot confirmation before live insertion. |
| 6.1 Archetypes | Not started | Run before phase 5; retain a revision-bound proposal until pilot findings are reviewed. |
| 5 Exercise restructure | Not started | Challenge threshold 65; dependency groups stay together. Minimum 3, original archetype counts, gradient step and routine ceiling require pilot calibration before rollout. |
| 6.2–6.5 Principles | Partial | Existing dedicated audits cover 18 new Extension 1 imports, 118 comments. Polynomials has 9 rewritten and 3 withdrawn comments. These do not establish archetype coverage or permit repairs. |

Read-only solid inventory on 28 October reproduced **2,098 drawings requiring review and 236 images requiring review** (`.booklet-work/end-goal-20261028/solid-inventory.json`); 649 static passes and 1,380 reviewed records are separate. Static results cannot establish visual coverage. Do not call phase 3 complete until the active coordinator's missed examples and pattern checks have rendered evidence.

## Execution and evidence

Use `.booklet-work/end-goal-20261028/` for comparisons, candidate copies and pilot reports. Preserve unrelated dirty files and current renderer work. Use one explicit reproducible testing baseline; do not mutate historical frozen import runtime `f418ade6`. Reuse live Studio at 127.0.0.1:5173; leave remote/tunnel configuration untouched. Local scoped commits only, no push. One coordinator stages shared-code commits.

End sections follow **Mixed review → Exam questions → Challenge**. Challenge currently uses booklet-owned questions only. `workingSpace: none` is optional and absence preserves existing rendering; it removes dedicated working space, not mathematical response cells. Source labels are optional and absence preserves existing rendering. MathsBase whitelist: official/trial HSC and PLC/internal papers; exclude CAIE, MB, GEN, LBNZ, AU.AMC and SmarterMaths. Do not mutate its database, upload externally, change credentials or set up a new paid service.

## Implemented pilot results

- **Phase 1 shipped:** `67214248`. Simple Cubic Equations r21 has 5 Questions pages, a clean blank p6 and answers from p7. Standard Deviation r40 has 8 Questions pages, no blank and answers from p9. Adjacent headings measured 0 mm gap with the 6 mm exercise header retained. Transition PDFs, screenshots and geometry are in `phase1/` under the run folder.
- **Phase 2:** Sum/Product of Roots was revision-safely saved at r3 as Year 11 Extension 1; all five skills and ME1-11-02 support the correction. The Advanced Logarithms candidate preserves natural logarithms, rate of change, current source edits and seven Advanced precision instructions absent from Stage 5. Source/archive/class-copy and bank-ownership changes remain separate until candidate verification completes.
- **Phase 4:** actual inventory finds 11 active-master Exam topics (149 questions), plus 405 heuristic labelled candidates requiring review. The sibling `D:\WebApps\MathsDatabase` documents `Questions.fetch`/`fetch_questions`; its direct table is sealed. The supported read returned 277 scoped Development+ rows, 62 with eligible sources; no imports. Real official codes include `HSC.X1`; BHHS trial codes explicitly distinguish Y11/Y12, so do not label all trials Y12. See [the source-label pilot](booklet-exam-sections.md).
- **Phase 6 pilot:** Introduction to Polynomials at r73: 12 routine questions, 7 clusters (1 covered, 5 bridge, 1 missing). The missing evaluation cluster may be assumed prior learning at Year 11; James decides whether it needs an example or bridge. One pending Studio comment on `p6-q7` (`9df94f7c-7cbc-45c8-b94e-942d59a33ee0`) records this checkpoint; project r74 preserves all earlier comments and changes no teaching. The principles-only pilot found no reportable violations. No coverage rollout.
- **Phase 5 report:** `polish/run.mjs --project ID --challenge-split-report [--archetypes FILE]` is report-only and refuses save/output mutation. The exact r73 snapshot and map produce 21 proposed Challenge moves; Introduction's six taught routine groups imply 10 provisional backfill items under minimum 3, while its uncovered seventh group is excluded. Introduction has a 25-point jump and peaks at 55. Eight other topics remain unassessable; all-book jumps are 25, 18, 16 and 17. These are calibration findings, not approved targets. Mapped report: `.booklet-work/end-goal-pilot/challenge-split-mapped-r73.json`.
- **New generation blocked, not denied:** no discovered callable tool or local CLI executes exact `claude-sonnet-5-5`; a benchmark relay request alone does not establish execution availability. No generation or model fallback occurred. `pedagogy/new-content.mjs` embeds source style, booklet principles, PSF and independent answer/principle checks for future drafts. An existing authorized exact-model runner is needed before generating or validating an example.

Shared build passed. The combined focused run passed 43 tests sequentially. `repo:check` passed. The broad `npm test` run was interrupted after Windows paging exhaustion (1455); failures also appeared outside focused coverage, so no full-suite pass or verified baseline-failure claim is made. Only that run's owned process was stopped. No OS, security, Studio-server or tunnel settings changed. Cleanup is deferred while other repairs are active.
