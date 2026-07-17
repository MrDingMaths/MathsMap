# Financial Mathematics (Advanced) — atomisation proposal

**Status: APPLIED (nil result) — no graph changes.**

## Context

- **Booklets:** `Stage 6 Advanced/Financial Mathematics 1_Reducing balance loans.md`, `Stage 6 Advanced/Financial Mathematics 2_Annuities.md`
- **Target topic:** `t-s6adv12-finance` — dot points `dp-s6adv12-finance-1` (reducing balance loans), `dp-s6adv12-finance-2` (annuities).
- **Goal:** Audit whether the topic needs any new skills or prereq edges.

## Finding (headline)

**No changes.** Both booklets are syllabus-overview stubs (47 and 53 lines) — front matter, `# Overview`, and the MAV-12-08 dot-point bullets only. No worked examples, no practice questions. The booklet-required constraint means nothing new can be traced from them.

The graph already covers both dot points with coherent chains:

| Dot point | Existing skills |
|---|---|
| `dp-s6adv12-finance-1` | `reducing-balance-loan-gp` (diff 2) → `reducing-balance-loan-calculations` (diff 3) |
| `dp-s6adv12-finance-2` | `annuity-future-value-gp` (diff 3) → `annuity-problems-gp` (diff 3) |

Both entry skills feed from `geometric-series-sum` + `compound-interest-formula`. Structure is recognise/model → solve-problems, difficulty calibration sensible, blurbs match syllabus scope (recognise reducing-balance loan as compound interest with periodic repayments; calculate repayment/owing/total/time and examine rate & repayment effects; identify annuity and model future value as a geometric-series sum; solve annuity problems examining payment/rate/duration effects).

## Considered-and-omitted

- **New skills:** none — no atomisable routine content in the booklets; graph coverage already complete.
- **New prereq edges:** none.
- **De-bundling / re-scopes:** none — blurbs are appropriately scoped; no bundled sub-step is missing an edge.
- **Standard-course twins:** `understand-annuity` / `annuity-problems` (Standard rows 55–56) are distinct skills on Standard dot points. No overlap or dedup issue with the Advanced `-gp` skills.

## Net change: none

No new skills, no new edges, no re-scopes. `data/skills.json` untouched.

**STOP.**
