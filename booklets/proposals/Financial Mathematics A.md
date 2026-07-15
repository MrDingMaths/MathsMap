# Proposal — Financial Mathematics A (t-s5c-fin-a) — APPLIED

Status: **applied** (2026-07-15). `npm run validate` clean (0 warnings).

**Context.** Group 8, booklets `Financial Mathematics A 1/2/3` (earning / simple
interest / spending money), target `t-s5c-fin-a`, dot points `dp-s5c-fina-1`–`3`.
Goal: check the routines in all three booklets against the existing graph and
lift out anything genuinely distinctive still buried in a bundle.

**Finding (headline).** Dense coverage already existed — `earning-money`,
`taxable-income-tax` (fina-1), `simple-interest` (fina-2), `buying-on-terms`
(fina-3), plus a Stage-6 tax cluster (`medicare-levy`, `tax-refund-or-owing`).
One real gap: the **progressive income-tax-table routine** (bracket → excess →
`base + rate × excess`) is the single most distinctive, at-risk, HSC-examined
routine in booklet 1, yet it was hidden inside the coarse `taxable-income-tax`
blurb. Everything else in the three booklets reduces to percentage/rate
arithmetic already carried by existing prereqs.

---

## 1. New skill — `progressive-income-tax`

```json
{
  "id": "progressive-income-tax",
  "title": "Calculate income tax from a tax table",
  "blurb": "Calculate income tax payable from a progressive tax table by finding the bracket, the excess and applying $\\text{tax} = \\text{base} + \\text{rate} \\times \\text{excess}$.",
  "stage": 5,
  "courses": ["s5-core", "s6-std11"],
  "dotPointIds": ["dp-s5c-fina-1", "dp-s6st11-earning-3"],
  "prereqs": ["percentage-of-quantity"],
  "difficulty": 2
}
```

**Trace.** Booklet 1, *Income Tax Table* section: worked examples
($12k/$25k/$63k and $8k/$40k/$165k), Foundation Q2, Development Q3–Q8, Mastery
Q9–Q15; HSC 2021/2023/2013. Two *misconception* investigations ("I don't want
the pay rise… taxed at 37%" and "45c of every dollar") target the bracket/excess
idea. Reused in *PAYG*, *Tax Refund or Liability*, *Medicare Levy* sections.

**Edge-bar.** (1) Distinctive — piecewise bracket + excess + `base + rate ×
excess`, not flat `percentage-of-quantity`. (2) At-risk — two dedicated
misconception investigations; high-frequency HSC error. (3) Proximity — first
taught here (Stage 5 Core booklet 1); prereq one stage below. (4) Non-redundant
— no existing skill; sibling lift-outs `medicare-levy` / `tax-refund-or-owing`
already exist, so decomposing the core routine is consistent.

## 2. New prereq edge

`taxable-income-tax ← progressive-income-tax`. Net pay / PAYG / refund all
consume the tax-payable figure from the table routine. Also gives the Stage-6
leaves `medicare-levy` / `tax-refund-or-owing` transitive reach to
`progressive-income-tax` (no direct edges needed — transitive-reduction rule 4).

## 3. Re-scope — `taxable-income-tax` blurb

- Before: `Determine taxable income, PAYG tax and net earnings after deductions.`
- After: `Determine taxable income (gross − deductions), PAYG instalments and net earnings, given the income tax payable.`

## 4. Re-scope (§4 Reading A applied) — `medicare-levy`, `tax-refund-or-owing`

Booklet 1 (Stage 5 **Core**) teaches both the Medicare levy and tax
refund/liability in full, with HSC Standard 2 questions, so their *earliest
genuine stage* is 5. Both retagged: stage `6 → 5`, courses `+ s5-core`,
dotPointIds `+ dp-s5c-fina-1`. Both are leaf skills; prereq `taxable-income-tax`
is stage 5 so monotonicity holds.

## 5. Considered-and-omitted (bundled / ambient)

- **Penalty rates / overtime / equivalent normal hours** — bundled in `earning-money`.
- **Sliding-scale commission, royalties, retainer+commission** — piecewise percentage; `earning-money`.
- **Salary conversions, bonuses, allowances, leave loading (17.5%)** — `earning-money` / `rate-problems`.
- **Simple-interest find P / r / n** — inside `simple-interest` ("algebraically") + generic equation solving. Excluded.
- **Total amount `A = P + I`** — trivial; ambient.
- **Loan repayments, buying on terms, find-rate-on-terms, BNPL late fees** — `buying-on-terms`.

---

## Net change applied

- **New skills:** 1 (`progressive-income-tax`)
- **New edges:** 1 (`taxable-income-tax ← progressive-income-tax`)
- **Re-scopes:** 3 (`taxable-income-tax` blurb; `medicare-levy` + `tax-refund-or-owing` stage/course/dp retag)
