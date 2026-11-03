# Exam completion: closure record, one proposal, guarded save (3 November 2026, user requested)

James asked for a completion-first Exam workflow after the 3 November investigation. It found that coverage closure had no tracked implementation and some closures reused historical exclusions. Superseding proposals piled up with out-of-date statuses, and saves stopped writing ledger rows. This page governs how a programme master's Exam section is declared complete. It changes no content, guard or verification cut.

## The current screen is the pool

Each master gets one closure record (`pedagogy/exam-closure.mjs`) built on the **current** source screen. At present that is the 29 October v2 rescreen, `.booklet-work/end-goal-20261028/phase4/external-read-campaign/source-rescreen-20261029-v2/masters/<projectId>.json`. The record has one row per pool question and carries the live revision and sha256 and the screen file and sha256. Rows the screen marks `excluded-provider` or `excluded-difficulty` start as `ineligible`, with basis `screen:<status>`. Every other row starts `pending`.

The current screen replaces reused historical exclusions. An earlier per-master ledger is imported by source id with an explicit mapping of its disposition strings. An unmapped string stays `pending` and is reported, and a class is never guessed. A prior decision about a row the current screen excludes is reported and does not override the screen.

```text
node pedagogy/exam-closure.mjs skeleton --project-id ID --out FILE
node pedagogy/exam-closure.mjs check --record FILE --project booklets/projects/ID.json [--candidate FILE]
```

## Classes

Every row has exactly one class.

| Class | Required fields | Meaning |
| --- | --- | --- |
| `ineligible` | `basis` | Screen exclusion, or a recorded scope ruling |
| `duplicate` | `duplicateOf` | The same question as a row or owner in the **same** booklet |
| `represented` | `representedBy`, `basis` | Its whole ask is covered by named Exam owners |
| `selected` | `ownerId` | It is an Exam owner |
| `faulty` | `fault` (quoted, specific), `action` (`fixed`/`parked`) | A concrete defect in the source; a flag or warning alone is never faulty |
| `cosmetic` | `issue` and the underlying `coverageClass` | Only a label or presentation is held. Never blocks; the coverage class still applies |
| `unused-eligible` | `basis` | Eligible and not yet covered. Blocks closure until a new owner or a ruling settles it |

## Closure criteria

`checkClosure` returns `{closed, blocking, nonBlocking, counts, coverage}`. A master closes when all of the following hold:

1. The record's rows are exactly this master's screen rows (same count and ids), and the screen sha256 matches.
2. No row is `pending` or `unused-eligible`, and every row has its required fields.
3. Every `selected.ownerId` and `represented.representedBy` id is a question in the checked project's Exam section.
4. `validateProgrammeExamSection` holds nothing for **new** owners. For existing owners, a label-only mismatch is listed as `cosmetic-label`, and other attribution holds are listed as `existing-owner-attribution`. Neither blocks.
5. The Exam section has `workingSpace: "none"`.
6. Every Exam owner's rating is bound to its current task (`verifiedRating`).
7. The record's `liveRevision` and `liveSha256` match the live project. A candidate must be built on that revision.

Cosmetic holds and practice-phase holds (phases 5 and 6, and rating bindings for ordinary practice) are reported as `nonBlocking` and never block Exam closure. James chose "Sample Question" as the canonical undated label on 3 November 2026: undated official samples print as `HSC <paper> Sample Question` (or `HSC Sample Question` with no paper). Other existing wordings remain cosmetic until normalised.

## One open proposal per master

`pedagogy/exam-proposals.mjs` keeps one JSON per master in `.booklet-work/end-goal-20261028/exam-proposals/`, holding at most one `open` proposal. Adding or replacing questions **amends** the open proposal: the old candidate moves into `history` and James still has one question for that master. Opening a second proposal is refused. `list --open` prints the queue for one approval decision. Sealed `*-unsent-*.json` files stay as history and are never rewritten. `importLegacy` may record "superseded by saved commit X" only when the live revision and owners prove that the content was saved.

## Saves and commits

Saves go through `pedagogy/exam-publish.mjs`, which calls `scripts/booklet/publish-project.mjs` with `--ledger .booklet-work/end-goal-20261028/publications.jsonl`, so every save writes a ledger row. It runs a dry run by default. `--apply` needs `--approved-by "<quote of James's chat approval>"` and a closed check on the candidate, and it records the quote in the proposal history. After the save it checks closure on the read-back file under a rebased record (`…closure.r<new>.json`) and marks the proposal `saved`.

```text
node pedagogy/exam-publish.mjs --project-id ID
node pedagogy/exam-publish.mjs --project-id ID --apply --approved-by "QUOTE"
```

Commits are taken from the **live** file. The wrapper prints the exact `git add` paths and the saved sha256 to compare first, and it never commits. Git HEAD is not a record of live content.
