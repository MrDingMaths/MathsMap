# Proposal — Atomise Earning Money (Stage 6 Standard Y11, topic `t-s6st11-earning`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1148 skills). QUEUE.md row 48 → applied.

## Context

Queue row 48. Two booklets:

1. `Stage 6 Standard/Earning Money 1_Ways of earning.md` → **dp-s6st11-earning-1**, **-2**
2. `Stage 6 Standard/Earning Money 2_Taxation.md` → **dp-s6st11-earning-3**, **-4**

MST-11-03.

## Finding (headline)

**No new skills or edges.** This topic was pre-atomised by the Financial Mathematics A pass (row 8): `earning-money` (dp-1, dp-2), `taxable-income-tax` (dp-3, dp-4), `progressive-income-tax` (dp-3), `medicare-levy` (dp-3), `tax-refund-or-owing` (dp-4) — all already tagged, and the FMA proposal explicitly bundled every Booklet-1 variant (penalty rates, sliding-scale commission, royalties, salary conversions, bonuses/allowances, leave loading) into `earning-money`. Those are decisions, not oversights. One blurb lagged its own bundle.

## 1–2. New skills / edges

None.

## 3. Edits to existing skills (1 blurb re-scope) — APPLIED

**`earning-money`** — blurb omitted salary, royalties and bonuses even though (a) dp-s6st11-earning-1 names "salaries … royalties" explicitly, (b) the FMA pass ruled they live in this bundle, and (c) Booklet 1 teaches each as its own section (§Salary, §Royalties, §Bonuses and Allowances, §Sliding Scale Commission).

| | blurb |
|---|---|
| before | Calculate wages, overtime, penalty rates, commission, piecework and leave loading. |
| after | Calculate earnings from salaries, wages, overtime and penalty rates, commission (including sliding scale), piecework, royalties, bonuses and leave loading. |

Nominal-scope alignment only; no structural change.

## 4. Borderline candidates → EXCLUDE

- **`pay-period-conversions`** (§Units of Time: weeks/fortnights/months; §Salary: p.a. → fortnightly) — arithmetic conversions already exercised inside `earning-money` routines ("1 year = 52 weeks" fact); a standalone node would be graph pollution. FMA precedent: "salary conversions … `earning-money` / `rate-problems`".
- **`reverse-wage-problems`** (find hourly rate / number of hours from total) — inverse use of the same one-formula triangle; taught in the same section, same skill.
- **`sliding-scale-commission`** — **already rejected** (FMA §5: "piecewise percentage; `earning-money`"). Not re-proposed.

## 5. Considered-and-omitted

- Wages / penalty rates / piecework / commission+retainer (incl. reverse: find sales from pay) → `earning-money`.
- Taxable income (gross − deductions, rounding down), net income, PAYG per period → `taxable-income-tax`.
- Tax-table bracket → excess → base + rate × excess → `progressive-income-tax`.
- Refund vs liability (instalments − payable) → `tax-refund-or-owing`.
- Medicare levy 2% incl. from gross-minus-deductions → `medicare-levy`.
- Combined year-end routine (§All Tax Calculations) — the chain `taxable-income-tax` → `progressive-income-tax` / `medicare-levy` / `tax-refund-or-owing`; already fully wired.
- Syllabus lines with **no booklet content**: government payments, sole-trader earnings, spreadsheet modelling — nothing to atomise; flagged for booklet revision.

## Net change

- 0 new skills, 0 new edges, **1 blurb re-scope** (`earning-money`).
