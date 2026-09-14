# Probability revision 166 layout feedback

Layout repairs saved through `saveBookletProject` as revision 167. Existing
sections, mathematical content, source-review evidence and bank links were
unchanged. The three changed arrangements retain their original content refs.

| Comment | Repair | Verification |
| --- | --- | --- |
| aae23699-ad09-4ebd-8ea0-1f440a947f16 | Borderless layout defaults; keep individual card outlines in page 4 Q3–Q4 | PDF page 4 visually checked |
| 282cb8b5-23ff-4522-af46-88d9405ae722 | Remove 24 mm minimum heights from page 10 Q2 rows a–c; expose minimum height control | PDF page 11 visually checked; model round-trip regression passed; interactive undo/save/reopen still pending |
| 9ab77845-9441-438f-8482-a988db67b832 | Page 15 Q20 choices in one horizontal row | PDF page 17 visually checked |
| 56d06ec9-c4b3-43f7-95c3-9f36bfa6c5d0 | Scaffold layout defaults borderless; preserve actual tables and writing boxes | PDF pages 23–24 visually checked |
| 9a81a9d9-4757-4d98-8e03-3a9751e3e06a | Page 22 Q5 spinners side by side | PDF page 25 visually checked |
| 52ed7dee-d233-4b5c-ac56-edfbe608cb7d | Shared question-side exercise starts require a new page | PDF page 41 visually checked; all-active-project boundary regression passed; cross-book visual review pending |

## Scope audit

The active-project audit found implicit layout borders on Probability's two
card arrangements, their outer parallel containers, and two expected-frequency
scaffolds; trigonometry's `nr-p38-methods-columns` also inherits the corrected
default. Explicit borders are preserved. Other minimum heights of at least
24 mm belong to diagram alignment groups in Angle Relationships and Volume,
or the separate Probability figures group, and were retained.

## Checks and remaining acceptance

All 40 focused tests passed and the production build passed. All five Probability
review exports passed DOM and printed-geometry checks: Questions 51 pages,
short answers 5, worked solutions 33, Questions with short answers 56, Questions
with worked solutions 84. Seven affected PDF pages were inspected visually.
These exports do not establish complete final visual acceptance.

The final acceptance workflow rejects the current project because older content
and arrangement review records are not settled. The shading audit also reports
stale/missing context evidence; section content was unchanged by this repair.
The strict solid-visibility audit passed. The broad test run reports unused CSS
selector warnings in concurrently edited Studio controls. No comments were
marked resolved merely because they were exported.

Remaining work: inspect all required final pages and affected other-book editions,
exercise the new control through interactive undo/apply/save/reopen, reconcile
the outstanding source-hashed review evidence, and rerun the acceptance gates.

Evidence, input snapshot, revision/hash receipt and check logs are local under
`.booklet-work/probability-feedback-r166/`. Build retries followed a corrected
Svelte `{@const}` placement in the concurrently edited page controls. Actual
export timings are recorded by the check scripts; token metrics are unavailable.

## Controlling spacing

Select the question, open **Layout & spacing → Detailed arrangement…**, select
the row/group under **Question structure**, and change **Minimum height (mm)**.
Zero fits the content. **Gap (mm)** controls spacing between children; separate
answer-space heights and table row heights can still reserve writing space.
