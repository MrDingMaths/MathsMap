# Feedback-process efficiency review — 16 September 2026

The Logarithms revision 207 repair was verified, but its verification expanded too
far and restarted too often. The revised [change runbook](booklet-change-runbook.md#minimum-verification-for-feedback-maintenance)
makes ordinary feedback use only checks justified by the changed dependencies.

## Recorded costs

The local receipt at `.booklet-work/log-feedback-r207-20260916/receipt.json` records
81.03 minutes of wall time. Its 12 export phases contain 36 complete edition exports
and 2,377 page instances, including repeats. Their command durations total 15.94
minutes; that sum is not elapsed wall time because phases can overlap. The receipt
also lists an earlier 84.993-second export retry separately, outside those counts.
Token usage and separate manual-review time were not recorded. No percentage
saving can be established from these data.

The 98-test regression run took 1.648 seconds, and the final ten-case editor run
took 21.148 seconds. Those checks were inexpensive and directly exercised the
reported defects. Representative visual checks also caught real equation-spacing
and figure-label regressions; retain them.

## Changes to the process

- Ordinary feedback now has a minimum-check matrix and an explicit stopping rule.
  Full five-edition review is reserved for new imports, global pagination/export
  changes with unbounded impact, or an explicit full-review request. The original Logarithms plan did
  explicitly require one five-edition pass; the repeated passes were the problem.
- Inspect changed pages, pagination neighbours and actual shifts. A shared repair
  still audits every applicable occurrence and source exception, but does not
  automatically require every page of every book to be exported and reread.
- Verify stable inputs. Inspect concurrent diffs once and invalidate only relevant
  checks. Do not treat every aggregate renderer-hash change as a fresh full review
  or chase another session's edits indefinitely.
- Keep focused failure-mechanism tests, one necessary save/reopen, and one build
  after application changes settle. Diagram/3D/bank/navigation audits are conditional
  on their dependencies; record unrelated pre-existing findings once.
- Use existing scripts and compact receipts. Repeated one-off comparison helpers,
  verbose file/status dumps, duplicate images, premature dependent commands and
  retrospective timing reconstruction add cost without improving acceptance.

This review changes workflow guidance only. It does not modify booklet content,
comments, application code or existing acceptance records. Verification of this
documentation change is limited to its diff, internal links and scope consistency.
