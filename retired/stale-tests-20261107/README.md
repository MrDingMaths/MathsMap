# Retired stale tests

Retired at James's request on 7 November 2026, after the booklet split follow-up. `originals.zip` holds the files as they were before retirement, plus `removed.json`, which lists each test removed and its original line. It is an inert archive: nothing imports it, and the test runner does not see it. Archive SHA-256: `a946c02361d7380996c1a96a96e93449f208de9f5dfacacf29dfab780ac036aa`.

Every test here also failed on the pre-split HEAD (`8db43d12`), so none of them was broken by the split. Each one checked a one-off repair or a booklet that has since been deleted, against data that later, deliberate edits had moved on:

| Retired | Why |
| --- | --- |
| `tests/booklet-construct-blank-lineage.test.js` (whole file, 8 tests) | Its fixture reads `s6adv-working-with-functions-7-constructing-and-using-functions-v1`, which is not in the repository. `scripts/booklet/construct-blank-lineage.mjs` is kept. |
| `tests/repair-worked-example-fields.test.js` and `scripts/booklet/repair-worked-example-fields.mjs` | 25 September one-off. Its fixes are in the saved booklets. A re-run changes only one table-header flag, which a later edit undid deliberately (the same is true at HEAD). |
| Earning Money repair (`booklet-import-structure`) | Pinned answer spaces 12/20; the booklet now has 10/15. |
| Probability repair (`booklet-probability-response-layout`) | Pinned the repair result on a booklet edited since. |
| Two Index boxes tests (`booklet-index-boxes`) and the r175 grid test (`booklet-index-feedback-r175`) | Pinned Index Laws repair results that later edits changed. |
| Native-maths sweep flowchart test (`booklet-native-maths-sweep`) | Pinned a one-off sweep result. |
| Review-format prompt test (`booklet-review-format`) | Expected 16 Review blocks in Index Laws Complete, which now has 8. |
| Linear rating pin (`question-bank-assessment`) | Pinned Development 25; the current verified rating is Foundation 18. |
| `syllabus-consolidation-2026-09-25`: the `project-ac094b6d-…` case and the whole-`project.source` hash pin | That booklet was deleted in `4191d649`. The source hash changes on any legitimate source edit. The content checks remain. |

## Restore

Extract to a temporary folder, never over a live checkout. Restore a test only after re-pinning it to the current saved booklet.
