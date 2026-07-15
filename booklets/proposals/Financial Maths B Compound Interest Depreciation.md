# Proposal — Financial Mathematics B (t-s5c-fin-b) — APPLIED

Status: **applied** (2026-07-15). `npm run validate` clean (0 warnings, 1094 skills).

**Context.** Group 9, booklet `Financial Maths B Compound Interest Depreciation`
(NEW; supersedes OLD Financial Mathematics B 1), target `t-s5c-fin-b`, dp
`dp-s5c-finb-1` ("compound interest and depreciation").

**Finding.** Dot point already well covered — `compound-interest-repeated`,
`compound-interest-formula`, `compare-simple-compound`, `depreciation`. One
genuine gap: the booklet's **Compounding Frequency** section (non-annual
compounding — `n = years × k`, `r = annual ÷ k` for monthly/quarterly/
half-yearly) was in no skill, yet it is a distinct high-error routine driving
nearly every HSC question in the booklet (2020, 2019, 2008, 2022, 2021).

---

## 1. New skill — `compounding-frequency`

```json
{
  "id": "compounding-frequency",
  "title": "Adjust for compounding frequency",
  "blurb": "Apply $FV = PV(1 + r)^{n}$ with non-annual compounding by matching the rate per period and number of periods to the compounding frequency.",
  "stage": 5,
  "courses": ["s5-core", "s6-std12"],
  "dotPointIds": ["dp-s5c-finb-1", "dp-s6st12-investment-2"],
  "prereqs": ["compound-interest-formula"],
  "difficulty": 3
}
```

**Trace.** *Compounding Frequency* section: review, worked example (annual vs
monthly $3000 @ 5%), Guided Practice, Foundation Q1–4, Development Q5–10, HSC
2020/2019/2008/2022/2021.

**Edge-bar.** (1) Distinctive — `n = years × k`, `r = annual ÷ k` matching is the
characteristic enabler. (2) At-risk — classic unit-mismatch error, drilled
throughout the section. (3) Proximity — downstream of the annual formula, same
stage. (4) Non-redundant — no existing skill. Per de-bundling **progression-chain**
rule, placed **downstream as a dependent** of `compound-interest-formula`.

## 2. Re-scope — `compound-interest-formula` (clarify base case)

- Before: `Use $FV = PV(1 + r)^{n}$ to solve compound interest problems.`
- After: `Use $FV = PV(1 + r)^{n}$ to solve compound interest problems with annual compounding.`

## 3. Borderline → EXCLUDE

- **Find present value (rearrange for `PV`)** — within `compound-interest-formula` scope.
- **Find rate / find `n` by guess-and-check** — within the formula skills' scope.
- **Half-yearly depreciation** (2020 HSC) — rate given per period; bundled in `depreciation`.
- **Continuous compounding / `e`** (Q19) — non-routine investigation.

## 4. Considered-and-omitted

- **Table / repeated-multiplication method** — `compound-interest-repeated`.
- **`I = FV − PV`** — trivial; part of `compound-interest-formula`.
- **Growth/decay contexts** (radioactive decay, temperature, arable land) — `depreciation`.
- **Deposit/instalment/percentage-profit sub-parts** (Q18) — `buying-on-terms` / `percentage-of-quantity`.

---

## Net change applied

- **New skills:** 1 (`compounding-frequency`)
- **New edges:** 1 (`compounding-frequency ← compound-interest-formula`)
- **Re-scopes:** 1 (`compound-interest-formula` blurb)
