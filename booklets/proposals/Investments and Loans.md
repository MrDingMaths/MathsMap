---
status: applied
---

# Proposal — Atomise Investment and Loans (Stage 6 Standard Y12, topic `t-s6st12-investment`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (0 new skills, 4 re-scopes); `npm run validate` clean. QUEUE.md row 55 → applied.

## Context

Queue row 55. Four booklets: `Stage 6 Standard/Investments and Loans 1_Investment.md` (dp-1–4), `2_Depreciation.md` (dp-5), `3_Loans.md` (dp-6), `4_Credit cards.md` (dp-7). MST-12-S2-02.

## Finding (headline)

Saturated — 14 skills across the 7 dot points, and every taught section resolves to one. **0 new skills.** The pass is the now-standard Y12 shape: two course/dot-point tags (one the explicit row-49 deferral on `loan-repayment-table`), one blurb widening, and one prereq swap wiring `credit-cards` to its actual characteristic enabler.

| Booklet section | dp | Skill |
|---|---|---|
| B1 §Investigating Compound Interest (year-by-year table, Q1–3) | dp-2 | `compound-interest-repeated` — missing Y12 tag (§3b); Q4 (simple-vs-compound tables + graph) → `compare-simple-compound` ✓ dp-3 |
| B1 §Compound Interest Formula (FV, $I = FV-PV$, PV) | dp-2 | `compound-interest-formula` ✓ |
| B1 §Compounding Frequency | dp-2 | `compounding-frequency` ✓ |
| B1 §Appreciation and Inflation (both directions) | dp-2 | `compound-interest-applications` ✓ (blurb is literally "including inflation and appreciation") |
| B1 §Buying Shares (cost/income ± brokerage, flat or %) | dp-4 | `shares-brokerage` ✓ |
| B1 §Dividends + §Dividend Yield (all directions incl. yield→dividend) | dp-4 | `shares-dividends` ✓ |
| B1 Q8 share-price graph | dp-4 | `interpret-share-value` ✓ |
| B2 §Declining Balance (incl. find $V_0$, find $r$, find $n$ by guess-check) | dp-5 | `depreciation` ✓ |
| B2 §SL vs DB (graphs, tables, crossing point, HSC mixed-method) | dp-5 | `straight-line-depreciation` + `compare-depreciation-methods` ✓ |
| B3 §Reducing Balance Loans (P-I-R table) + balance-graph reading Q6–7 | dp-6 | `reducing-balance-loan` — blurb widening (§3c) |
| B3 §Loan Tables + §Calculating Total Repayment | dp-6 | `loan-repayment-table` — missing Y12 tag, the row-49 deferral (§3a) |
| B3 Q8/Q11/Q12/Q14b (double repayment, fortnightly, lump sums) | dp-6 | `loan-repayment-effects` ✓ |
| B4 (daily compounding per purchase, day counts, closing balance, min payment) | dp-7 | `credit-cards` — prereq swap (§3d) |

## 1. New skills

None. Topic saturated.

## 2. New prereq edges

None as additions — one swap in §3d (net edge count unchanged).

## 3. Edits to existing skills (applied)

**a. `loan-repayment-table` — tag re-scope (completing the row-49 deferral).**
- courses: `["s6-std11"]` → `["s6-std11", "s6-std12"]`; dotPointIds: + `dp-s6st12-investment-6`
- Trace: B3 §Reducing Balance Loan Tables — two worked-example tables (direct-lookup by loan amount at 8.5%; per-\$1000 with `repayment = table × P/1000`), Foundation Q1–4 both variants incl. reverse lookup ("max loan for \$2000/month"); §Calculating Total Repayment (total = repayment × periods, $I = A - P$; Foundation Q1–5 incl. term-length trade-off Q2d–g). Managing Money §1b explicitly deferred this tag to row 55.

**b. `compound-interest-repeated` — tag re-scope.**
- courses: `["s5-core"]` → `["s5-core", "s6-std12"]`; dotPointIds: + `dp-s6st12-investment-2`
- Trace: B1 §Investigating Compound Interest — own titled section: investigation (simple vs compound \$1000 @ 10%), Foundation Q1–3 (year-by-year tables, interest = ending − principal); §Compound Interest Formula Foundation Q1 re-drills table-then-formula. Standard tagging precedent (rows 46/47/49).

**c. `reducing-balance-loan` — blurb widening.**
- Before: "Model and solve reducing balance loan problems in tabular form."
- After: "Model and solve reducing balance loan problems in tabular form and interpret graphs of the balance owing over the term."
- Why: B3 Development Q6–7 are two full graph-reading questions (amount borrowed, owing at $t$, when owing = \$X, when repaid, "why does the curve steepen"), and HSC Q9–Q14 all supply P-I-R spreadsheets or balance graphs. Syllabus: "…using a graph or by calculation." No structure change.

**d. `credit-cards` — prereq swap (transitive reduction).**
- prereqs: `["compound-interest-formula"]` → `["compounding-frequency"]`
- Trace: B4 §Calculating Closing Balance step 1 is "Calculate daily interest rate" — every question converts $r_{p.a.}/365$ and counts days (Foundation Q1–3, Dev Q4–5, all six HSC items). That rate-per-period/periods-matching move *is* `compounding-frequency`'s routine, not the bare annual formula.
- Bar: distinctive (daily-rate matching is the characteristic enabler of credit-card interest), at-risk (rate/day-count mismatch is the drilled error), stage 5→6 fine, and the swap restores transitive reduction — `compound-interest-formula` stays reachable via `compounding-frequency → compound-interest-formula`, so keeping the direct edge would violate rule 4. Precedent: prereq swaps in rows 46/51/52.

## 4. Borderline candidates → EXCLUDE

- **`find-compound-rate-or-term`** (B1 Q17–18 guess-and-check $n$; B2 Q9–14 find $r$/$n$/$V_0$ for depreciation) — FMB pass precedent: "Find present value / find rate / find $n$ by guess-and-check — within the formula skills' scope."
- **`equivalent-simple-interest-rate`** (B1 Mastery Q15–16 + 2021 HSC Q16) — Mastery-only composite of `compare-simple-compound` + `simple-interest`; no taught section.
- **`sequential-depreciation`** (B2 Mastery Q6/Q9/Q10: SL for $k$ years then DB) — HSC Mastery composites of the two existing formula skills; `compare-depreciation-methods` is the umbrella.
- **`daily-interest-day-count`** (B4 inclusive day-counting, 30−12+1) — sub-step of `credit-cards`; §3d's swap covers the at-risk half.
- **`minimum-payment`** (2–5% of closing balance) — single `percentage-of-quantity` application inside `credit-cards`' blurb.

## 5. Considered-and-omitted

- B1 has **no dedicated simple-interest section** (dp-1 lines appear only inside comparisons Q4/Q11–12/Q15–16) — `simple-interest` + `simple-interest-graphs` already carry dp-1; graph ahead of booklet, flagged for booklet revision.
- 2019 HSC Q13 (compare compound graphs for different rates/frequencies, MC) → "effect of varying rate/term/period" syllabus line; single item, no dedicated section — booklet gap noted.
- B1 §Buying Shares profit Q6 → `shares-brokerage` + `percentage-change`; Q9 ordinary/preference mix, Q13 2020 HSC portfolio reverse → Mastery composites of `shares-dividends`.
- Continuous compounding / $e$ (B1 Q17 investigation) → non-routine (FMB precedent).
- B2 Q17 (write scenario for $300(1.07)^{12}$…) → interpretation drill inside `depreciation`/`compound-interest-formula`; Q18 → `buying-on-terms`; Q19–21 decay contexts → `depreciation` (FMB precedent verbatim).
- B3 BNPL / short-vs-long-loan syllabus line — no BNPL section here (lives in Managing Money → `buying-on-terms`); term trade-off Q2d–g folds into `loan-repayment-table`.
- Spreadsheet syllabus lines (investments, depreciation, loans) — no booklet content; recurring flag.
- B4 cash advances / fee taxonomy — descriptive theory box, no exercises; inside `credit-cards`.

## Net change applied

- **+0 skills, +0 net edges**
- **4 re-scopes:** `loan-repayment-table` (+course/+dp), `compound-interest-repeated` (+course/+dp), `reducing-balance-loan` (blurb), `credit-cards` (prereq swap)
