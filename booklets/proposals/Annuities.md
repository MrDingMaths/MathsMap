---
status: applied
---

# Proposal — Atomise Annuities (Stage 6 Standard Y12, topic `t-s6st12-annuities`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (0 new skills, 1 new edge, 2 re-scopes); `npm run validate` clean. QUEUE.md row 56 → applied.

## Context

Queue row 56. One booklet: `Stage 6 Standard/Annuities.md` (MST-12-S2-03), covering `dp-s6st12-annuities-1`–`3`. Goal: check the 4 existing skills (`understand-annuity`, `annuity-interest-factors`, `annuity-contribution`, `annuity-problems`) against the booklet's 6 sections.

## Finding (headline)

Covered — with one deliberate exclusion. The booklet's §Annuities as Recurrence Relations is a full taught routine, but it is **legacy old-syllabus content** (2017 MS-F5 "model an annuity as a recurrence relation"), removed from MST-12-S2-03 — a proposed `annuity-recurrence-relation` skill was reviewed and **dropped by the user** (§4a). The rest is the standard Y12 shape: 1 new edge, 1 blurb widening, 1 prereq swap.

| Booklet section | dp | Skill |
|---|---|---|
| §Introduction (tables ≤4 periods, savings + loan variants, Q1–3) | dp-1 | `understand-annuity` ✓ |
| §Annuities as Recurrence Relations (investigation, worked ex., F Q1–4, D Q5–6, M Q7–8 HSC) | dp-1 | EXCLUDE §4a — legacy old-syllabus routine |
| §Annuities using Spreadsheets (setup + fill-down, F Q1–4) | dp-1 | EXCLUDE §4b |
| §Annuity FV Tables (worked ex. ×2, F Q1–2, D Q3–5; D Q6–12 find contribution; M Q13–16 HSC) | dp-2 | `annuity-interest-factors` ✓ + `annuity-contribution` ✓; non-annual matching → edge §2a |
| §Annuity PV Tables (worked ex. ×3 incl. payment-from-PV, F Q1–2, D Q3–5) | dp-2 | `annuity-interest-factors` ✓; payment-from-PV → blurb widening §3a |
| §Applications of PV (F Q1–4 fund withdrawals; D Q5–16 income/borrowing-capacity/loan repayments; M Q17–20 HSC) | dp-3 | `annuity-problems` — prereq swap §3b |

## 1. New skills

None. (`annuity-recurrence-relation` proposed, reviewed, dropped — see §4a.)

## 2. New prereq edges (applied)

### a. `annuity-interest-factors ← compounding-frequency`

- **Trace:** FV worked example 2 ("\$5000 per half-year at 6% p.a. six-monthly → $n=4$, $r=3\%$"), Your Turn (quarterly), FV Development Q3a–f (all six non-annual), PV worked example 2 + Your Turn (quarterly/monthly), PV Foundation Q2a–c, and nearly every §Applications question (monthly). The rate-per-period/period-count match is the drilled step before any table lookup.
- **Bar:** distinctive — period-matching is the characteristic enabler of non-annual table lookup (the table axes *are* per-period rate × period count); at-risk — classic error, retaught here; stage 5→6, within proximity; non-redundant — `compounding-frequency` sits downstream of `compound-interest-formula`, not reachable from `annuity-interest-factors` via `understand-annuity`. Precedent: row 55's `credit-cards` swap onto `compounding-frequency`.

## 3. Edits to existing skills (applied)

**a. `annuity-contribution` — blurb widening.**
- Before: "Determine the contribution required to achieve a given future value."
- After: "Determine the contribution required to achieve a given future value, or the regular payment provided by a given present value."
- Why: PV worked example 3 is literally payment-from-PV ("present value \$33 240 → $x = 33240/2.67$") with a Your Turn; §Applications Q6, 7, 11 (retirement income from lump sum) and Q13–19 (loan repayment = $P/\text{factor}$, incl. 2021 HSC, sample HSC, 2015 HSC) drill the same reverse-division routine. dp-2 text bundles both directions ("annuity values **and contributions**"). Structural twin of the FV direction already in the blurb — no structure change.

**b. `annuity-problems` — prereq swap (transitive reduction).**
- prereqs: `["annuity-interest-factors"]` → `["annuity-contribution"]`
- Why: the dp-3 applications lean on the *contribution* direction — loan repayments (Q13–19), retirement income (Q6, 7, 11) — not just direct lookup. With that edge genuine, keeping the direct `annuity-interest-factors` edge violates rule 4: it stays reachable via `annuity-contribution → annuity-interest-factors`.
- Bar: distinctive — payment-from-value rearrangement is the characteristic enabler of the loan/superannuation problems; at-risk — multiply-vs-divide direction is the classic error; same stage; swap restores transitive reduction. Precedent: rows 46/51/52/55 swaps.

## 4. Borderline candidates → EXCLUDE

- **a. `annuity-recurrence-relation`** (§Annuities as Recurrence Relations — own titled section, worked example, Foundation Q1–4, Development Q5–6, Mastery Q7–8, three HSC questions). Proposed as a new dp-1 skill, then **dropped at review**: the routine is old-syllabus content — 2017 Standard 2 MS-F5 had an explicit "model an annuity as a recurrence relation" dot point (hence the 2013/2020/2021 *Standard 2* HSC questions), but MST-12-S2-03 removed it, keeping only tabular form + spreadsheet. Not Advanced content either — Advanced does annuities via geometric series (`annuity-future-value-gp`/`annuity-problems-gp`); recurrence appears only in Ext 2 (induction, integration by parts). The spreadsheet dot point covers the modelling in practice (`=B2*1.085+5000` *is* the recurrence). Booklet section flagged as legacy for revision. **User decision — do not re-propose.**
- **b. `annuity-spreadsheet`** (§Annuities using Spreadsheets — full section, Foundation Q1–4). Real taught content, but the knowledge is the recurrence structure (§4a) — the spreadsheet is the execution tool. Graph has zero spreadsheet/digital-tool skills anywhere; HSC assesses spreadsheets as stimulus only (2021 Q7). Recurring spreadsheet flag continues (rows 49, 55).
- **`annuity-interest-earned`** ($I = FV − \text{total payments}$; FV Q2, Q13b–14b, loan totals Q13–16c) — single-subtraction transformation inside `annuity-interest-factors`/`annuity-problems` scope. Same shape as row 55's `minimum-payment` rejection.
- **`delayed-annuity`** (2020 HSC Wil, Applications Q20 — PV over 30 yrs minus PV over 20 yrs) — Mastery one-off with an in-question hint; non-routine.
- **`compare-annuity-options`** (FV Q4 annual-vs-monthly; Q16 2022 HSC lump-sum-vs-annuity) — Mastery composites of `annuity-interest-factors` + `compound-interest-formula`.

## 5. Considered-and-omitted

- Syllabus line "effect of varying initial amount/payment/rate/duration using digital tools" — only spreadsheet Q2b/Q4d graph-shape commentary; no dedicated exercises. Inside `annuity-problems` umbrella; booklet gap noted.
- PV Development Q3–5 (verify $PV(1+r)^n = FV$) — relationship drills composing `annuity-interest-factors` + `compound-interest-formula`.
- FV Mastery Q15 (2019 HSC two-stage rate) — table value then one manual compounding step; composite.
- Borrowing-capacity direction (Applications Q8–9, Q12: max loan from affordable repayment) — direct multiply, inside `annuity-interest-factors`' PV routine.
- Superannuation/mortgage vocabulary — ambient context, inside `annuity-problems`.
- Loan tables in §Introduction Q3 — the tabular loan variant lives in `understand-annuity`'s table routine + `reducing-balance-loan` (investment topic); no cross-topic edge (scope rule).

## Net change applied

- **+0 skills, +1 edge** (`annuity-interest-factors ← compounding-frequency`)
- **2 re-scopes:** `annuity-contribution` (blurb), `annuity-problems` (prereq swap)
