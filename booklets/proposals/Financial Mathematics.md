---
status: applied
---

# Proposal — Atomise Financial Mathematics (Stage 6 Advanced Y12, topic `t-s6adv12-finance`)

**Status: APPLIED 2026-08-27** — approved by the user and applied to `data/skills.json` (4 new skills, 1 new edge, 2 prereq swaps, 1 re-scope); `npm run validate` clean. QUEUE.md row 77 → applied.

## Context

- **Booklet:** `Stage 6 Advanced/Financial Mathematics.md` (NEW combined booklet, v260827, ~3300 lines) — supersedes the two content-less 241201 stubs `Financial Mathematics 1_Reducing balance loans.md` and `Financial Mathematics 2_Annuities.md` (deleted).
- **Target topic:** `t-s6adv12-finance` (MAV-12-08) — dot points `dp-s6adv12-finance-1` (reducing balance loans), `dp-s6adv12-finance-2` (annuities).
- **Goal:** re-atomise the topic now that real worked examples and practice questions exist.
- **Supersedes:** `proposals/Financial Mathematics (Advanced).md` — a nil result *forced by the stubs* ("both booklets are syllabus-overview stubs… nothing new can be traced"). The evidence changed, not the decision.

## Finding (headline)

The graph's 4 finance skills (2 per dot point, `recognise → solve`) were calibrated against empty stubs. The real booklet contains **five distinct derivation routines** that the pair-per-dot-point shape cannot represent: end-of-period annuity (covered), start-of-period annuity (**due**), annuity with a starting lump sum / withdrawals, repayment-from-zero-balance, and time-to-repay via logarithms. Each has its own worked example, Guided Practice, and 5–15 practice questions.

| Booklet section | dp | Coverage |
|---|---|---|
| §Annuities (recurrence relations) | — | EXCLUDE §4a — prior user rejection |
| §Annuities using Spreadsheets | — | EXCLUDE §4b |
| §Annuity Future Value Tables | — | EXCLUDE §4c — Standard-course routine, already `annuity-interest-factors`/`annuity-contribution` |
| §Annuities as a Geometric Series | dp-2 | `annuity-future-value-gp` ✓ |
| §Other Annuity Problems | dp-2 | **§1c, §1d new** |
| §Reducing Balance Loans (balance owing) | dp-1 | `reducing-balance-loan-calculations` ✓ (re-scoped §3a) |
| §Reducing Balance Loans (repayment, term) | dp-1 | **§1a, §1b new** |

## 1. New skills (applied)

### a. `loan-repayment-geometric-series`

| field | value |
|---|---|
| title | Find the repayment on a reducing balance loan |
| blurb | Set the balance after the final repayment to zero and solve the geometric-series expression for the equal repayment $M$, or for the amount that can be borrowed. |
| stage | 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-finance-1"]` · difficulty 3 |
| prereqs | `reducing-balance-loan-calculations` |
| atom type | Routine (R) |

- **Trace:** §Reducing Balance Loans worked example "An \$18 000 loan… find the monthly repayment" (sets $FV = 0$, rearranges to $M = (18000(1.01)^{36}(0.01))/((1.01)^{36}-1)$); Guided Practice a–b; Foundation Q1–3; Development Q16–20, Q24, Q28; Mastery Q31–33. Borrow-capacity direction: Q21a, Q22, Q23, Q29b, Q30 ($P = 800\,\frac{r^{300}-1}{r^{300}(r-1)}$).
- **Bar:** distinctive ✓ — the "$A_n = 0$, then rearrange" inversion is the characteristic enabler, absent from the forward balance calculation; at-risk ✓ — rearranging a fraction-of-a-fraction for $M$ is the drilled failure point (Mastery Q31 is entirely about it); same stage ✓; non-redundant ✓ — nothing in `reducing-balance-loan-calculations`' closure inverts the expression.

### b. `loan-term-logarithms`

| field | value |
|---|---|
| title | Find the time taken to repay a loan |
| blurb | Set the balance to zero, collect the $(1+r)^{n}$ terms and use logarithms to find the number of repayments, interpreting a non-integer result as a smaller final payment. |
| stage | 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-finance-1"]` · difficulty 3 |
| prereqs | `reducing-balance-loan-calculations`, `solve-exponential-log-equations` |
| atom type | Routine (R) |

- **Trace:** worked example "Calculate length of a loan" (\$25 000 at 6% p.a., \$600/month → $n = \log_{1.005}(\ldots) = 46.84$, "repaid after 47 repayments, the 47th smaller than \$600"); Guided Practice a–b (b: "the loan will never be repaid"); Mastery Q34c ($n = \log 1.28/\log 1.004375 = 57$ months), Q35e–f ($1.006^{n} = 4$, 8 months early). Annuity twin: §Annuities as a Geometric Series Guided Practice c(i) "find when the fund first exceeds \$500 000", Q12(c)(iii), Q4(d)(iii).
- **Bar:** distinctive ✓ — the collect-and-factor step producing $(1+r)^{n}(P - \frac{M}{r})$ is unique to this question type; at-risk ✓ — both sides go negative before dividing, and the ceiling-not-proportion interpretation is explicitly flagged in the booklet ("notice how we don't just do $0.8396 \times \$600$"); same stage ✓; non-redundant ✓.

### c. `annuity-due-start-of-period`

| field | value |
|---|---|
| title | Model an annuity with start-of-period payments |
| blurb | Model an annuity due by factoring one extra $(1+r)$ out of the geometric series, giving $FV = a\left[\dfrac{(1+r)^{n}-1}{r}\right](1+r)$. |
| stage | 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-finance-2"]` · difficulty 3 |
| prereqs | `annuity-future-value-gp` |
| atom type | Routine (R) |

- **Trace:** §Other Annuity Problems, "Types of Annuity Problems" box (**Annuity due** named and derived); Guided Practice a–b; Development Q1, Q2, Q5, Q7; Mastery Q9a–e (Finster, "show that $A_{20} = \frac{12000 \times 1.09(1.09^{20}-1)}{0.09}$"), Q12a–b (Itsushi), Q4c–e (contributions on 1 January).
- **Bar:** distinctive ✓ — the first term becomes $a(1+r)$, not $a$, and the $n$ terms run $r^{1} \ldots r^{n}$; at-risk ✓ — the off-by-one is the most-tested error in this section, and every HSC-style "show that" hinges on it; same stage ✓; non-redundant ✓ — `annuity-future-value-gp` derives the end-of-period case only.

### d. `annuity-lump-sum-and-withdrawals`

| field | value |
|---|---|
| title | Model an annuity with an initial lump sum |
| blurb | Split the account into a lump sum compounding as $PV(1+r)^{n}$ and a geometric series of regular payments, added for contributions or subtracted for withdrawals. |
| stage | 6 · courses `["s6-adv12"]` · dotPointIds `["dp-s6adv12-finance-2"]` · difficulty 3 |
| prereqs | `annuity-future-value-gp` |
| atom type | Routine (R) |

- **Trace:** "Types of Annuity Problems" box (**Annuity with starting lump sum**, **Annuity withdrawal problem** — "treat your withdrawals as a parallel timeline and subtract"); §Other Annuity Problems Guided Practice c–d; Development Q3 ($10000(1.06)^{8} + \frac{1500(1.06^{8}-1)}{0.06}$), Q6, Q8, Q13 (solve for the unknown starting amount $P$); §Annuity withdrawals investigation (\$30 000 fund, \$1500/month).
- **Bar:** distinctive ✓ — the decision to split into two independent timelines, and the sign of the series, is the whole routine; at-risk ✓ — students commonly try to force a single series; same stage ✓; non-redundant ✓.
- **Note:** the booklet states withdrawals are mathematically identical to a reducing balance loan ("What do you notice…?"), so this stays **one** skill rather than a separate withdrawal skill — the dp-1 chain carries the loan framing.

## 2. New prereq edges (applied)

### a. `loan-term-logarithms ← solve-exponential-log-equations`

- **Trace / bar:** as in §1b. Stage 5 → 6, constitutive — the routine cannot terminate without taking logarithms of both sides.
- Deliberately attached to the narrow new skill, not to `reducing-balance-loan-calculations`, so the general balance-owing routine stays log-free — which is what the syllabus's "with or without digital tools" wording protects.
- **Prior-decision note:** `proposals/cross-topic-backfill/G-s6std-adv.md` **rejected** `solve-exponential-log-equations → reducing-balance-loan-calculations` on the stated ground "checked both source booklets — **zero uses of logs** anywhere in either". That was the stubs. The new booklet solves for $n$ with logarithms in a titled worked example, its Guided Practice, and three Mastery questions. Re-raised on new evidence, onto a narrower target.

## 3. Edits to existing skills (applied)

### a. `reducing-balance-loan-calculations` — re-scope (de-bundling, progression chain)

- **Before:** "Calculate the repayment, amount owing, total paid and time to repay a reducing balance loan and examine the effect of rate and repayment."
- **After:** "Derive the balance owing after $n$ repayments as $PV(1+r)^{n} - M\left[\dfrac{(1+r)^{n}-1}{r}\right]$ and calculate the total paid and interest charged."
- **Why:** the blurb bundled a taught progression — derive balance (worked example 1) → solve for repayment (worked example 2) → solve for term (worked example 3), each with its own Guided Practice. Per the rubric's progression-chain rule the harder variants sit **downstream** (§1a, §1b) and the base skill narrows to the derivation it actually is.

### b. `reducing-balance-loan-gp` — prereq swap

- prereqs: `["geometric-series-sum", "compound-interest-formula"]` → `["geometric-series-sum", "compounding-frequency"]`
- **Why:** every worked example and near-every question converts an annual rate to a rate per period first ("9.6% p.a. → 0.8% monthly"; $r = 1 + \frac{0.15}{12}$; Q28/Q32 compound monthly while repaying annually/six-monthly). `compounding-frequency` is downstream of `compound-interest-formula`, so keeping both violates edge rule 4 — swap, don't add. Precedent: the `credit-cards` and `annuity-interest-factors` swaps.

### c. `annuity-future-value-gp` — prereq swap

- prereqs: `["geometric-series-sum", "compound-interest-formula"]` → `["geometric-series-sum", "compounding-frequency"]`
- **Why:** structural twin of §3b. Trace: §Annuities as a Geometric Series Guided Practice b (12% p.a. compounded monthly over 10 years → $r = 1.01$, $n = 120$); §Other Annuity Problems Q7 ($r = 1 + \frac{0.072}{12}$, $n = 48$), Q8.

## 4. Borderline candidates → EXCLUDE

- **a. `annuity-recurrence-relation`** (§Annuities + its full Foundation/Development/Mastery set, 2013/2020/2021 HSC Standard 2). **Prior user decision** — `proposals/Annuities.md` §4a: legacy old-syllabus MS-F5 content, removed from MST-12-S2-03, and not Advanced content. Not re-proposed.
- **b. `annuity-spreadsheet`** (§Annuities using Spreadsheets, Foundation Q1–4). Standing rejection; the graph has no digital-tool skills anywhere.
- **c. Future-value-table skills** (§Annuity Future Value Tables — 2 worked examples, 16 questions, five HSC Standard 2 items). Entirely the Standard-course routine, already covered by `annuity-interest-factors` + `annuity-contribution` on `dp-s6st12-annuities-2`. Not in MAV-12-08, and the no-Standard-prereqs rule forbids wiring Advanced skills to them. This section is Standard material carried into the Advanced booklet.
- **d. `loan-balance-table`** (§Reducing Balance Loans investigation, Foundation Q1–2 table completion). This *is* the "recognise a reducing balance loan as compound interest with periodic repayments" step — bundled in `reducing-balance-loan-gp`, which these questions exist to motivate. Standard twin `reducing-balance-loan` already carries the tabular framing.
- **e. `deferred-repayment-loan`** (Q25 no repayments for 2 months, Q26 NSW-vs-Sydney Bank, Q27 hire purchase with a 6-month deferral). Genuinely distinctive — the principal compounds for $n$ periods while only $n-k$ repayments form the series — but three Development/Mastery questions, no worked example, no Guided Practice. Below the routine bar; revisit if a future booklet promotes it.
- **f. `mismatched-repayment-compounding-period`** (Q28, Q32 — monthly compounding with annual/six-monthly repayments, $r = (1 + \frac{i}{12})^{12}$). Two Mastery questions, no worked example. Non-routine variant.
- **g. `rounding-effect-final-payment`** (Q31 "Problems with rounding", worked-example bonus "show that the final payment is \$504.01"). Framed as an investigation into rounding; one question. Non-routine.

## 5. Considered-and-omitted

- $I = FV - \text{total payments}$ (annuity interest earned, loan total interest) — a single subtraction inside the parent skills. Same shape as the `annuity-interest-earned` rejection in `proposals/Annuities.md`.
- Compare-two-options questions (Q4 annual-vs-monthly, Q11/Q4 \$1000×15 vs \$500×30, Q24 two banks, Q26) — composites of the proposed skills, no new machinery.
- Deposit-then-finance-the-balance questions (Q16, Q18, Q20) — a percentage subtraction grafted onto the repayment routine; grafted context, not constitutive.
- Reducible-to-simple-interest conversion (Q33e) — one part of one Mastery question, composes `simple-interest`.
- "Examine the effect of varying rate/repayment/duration" (both dot points) — the booklet delivers this only through spreadsheet graph-shape prompts (§Spreadsheets Q2b, Q4d); stays under the parent skills. Booklet gap noted, same as the Standard pass.

## Net change (applied)

**4 new skills** · **1 new edge** · **2 prereq swaps** · **1 blurb re-scope**.

Resulting chains:

- dp-1: `reducing-balance-loan-gp → reducing-balance-loan-calculations → {loan-repayment-geometric-series, loan-term-logarithms}`
- dp-2: `annuity-future-value-gp → {annuity-problems-gp, annuity-due-start-of-period, annuity-lump-sum-and-withdrawals}`
