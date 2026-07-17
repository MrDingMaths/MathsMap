# Proposal — Atomise Managing Money (Stage 6 Standard Y11, topic `t-s6st11-managing`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`. QUEUE.md row 49 → applied.

## Context

Queue row 49. Two booklets:

1. `Stage 6 Standard/Managing Money 1_Purchasing goods.md` → **dp-s6st11-managing-1, -2, -3**
2. `Stage 6 Standard/Managing Money 2_Budgeting.md` → **dp-s6st11-managing-4** (+ vehicle ongoing costs syllabus line of dp-3)

MST-11-04.

## Finding (headline)

Topic already carried 6 tagged skills (`financial-percentage-problems`, `buying-on-terms`, `vehicle-purchase-costs`, `vehicle-running-costs`, `household-bills`, `prepare-budget`). Booklet 1 is ~70% a re-teach of the Stage 4 percentage cluster — a **tagging gap, not structure** (Formulas and Equations precedent). Two genuine structural gaps, both inside `vehicle-purchase-costs`: **vehicle stamp duty** (piecewise 3%/5% excess routine — structural twin of `progressive-income-tax`, which the FMA pass lifted out; lift-out rule demands consistent treatment of twins) and the **loan-repayment-per-$1000 table** routine (full section, own formulas, nothing in graph covered it — `reducing-balance-loan` is the Y12 amortisation-table routine, a different animal).

## 1. New skills (2) — APPLIED

### 1a. `vehicle-stamp-duty`

```json
{
  "id": "vehicle-stamp-duty",
  "title": "Calculate stamp duty on a vehicle",
  "blurb": "Calculate stamp duty as $3\\%$ of a vehicle's market value up to $\\$45\\,000$, plus $5\\%$ of the excess over $\\$45\\,000$.",
  "stage": 6,
  "courses": ["s6-std11"],
  "dotPointIds": ["dp-s6st11-managing-3"],
  "prereqs": ["percentage-of-quantity"],
  "difficulty": 2
}
```

**Trace.** Booklet 1 §Stamp Duty: worked example ($57 000 Mazda: excess $12 000 → 3% × 45 000 + 5% × 12 000 = $1950) + practice a–d ($32 600, $26 500 under threshold; $52 700, $98 400 over).

**Edge-bar.** (1) Distinctive — piecewise threshold/excess computation, not flat percentage. (2) At-risk — same error mode as progressive tax (applying 5% to whole value); booklet drills both branches. (3) Proximity — prereq 2 stages below; distinctive override, exact `progressive-income-tax` precedent. (4) Non-redundant — `vehicle-purchase-costs` blurb merely *mentioned* stamp duty; mention ≠ reachable (lift-out rule). Twin-consistency: `progressive-income-tax` was lifted out of `taxable-income-tax` for the identical structure.

### 1b. `loan-repayment-table`

```json
{
  "id": "loan-repayment-table",
  "title": "Use a loan repayment table",
  "blurb": "Use a table of monthly repayments per $\\$1000$ borrowed to find the repayment ($\\text{table value} \\times \\frac{P}{1000}$), the total repaid and the total interest on a loan.",
  "stage": 6,
  "courses": ["s6-std11"],
  "dotPointIds": ["dp-s6st11-managing-3"],
  "prereqs": [],
  "difficulty": 2
}
```

**Trace.** Booklet 1 §Loan Repayments: worked example ($23 600 at 9% p.a. over 5 yr: 20.76 × 23.6 = $489.94/mo; × 60 = $29 396.40; interest $5796.40) + practice ($25 000 at 11% over 4 yr, three parts).

**Edge-bar.** (1) Distinctive — per-$1000 scaling ($P/1000$, not $P$) is the characteristic trip-wire. (2) At-risk — booklet dedicates three guided questions to exactly the scaling and the months conversion. (3) Proximity — no prereq edges to test. (4) Non-redundant — `reducing-balance-loan` (Y12) models the amortisation table row-by-row; this is a different routine (lookup + scale). Note: row 55 (Investments and Loans 3_Loans) will likely add an `s6-std12` tag — left to that pass.

## 2. New prereq edges (2) — APPLIED

- **`vehicle-purchase-costs` ← `vehicle-stamp-duty`** — dp-3 and the booklet's vehicle-costs chapter consume stamp duty as one component of total purchase cost. Bar: (1) characteristic component, (2) at-risk piecewise routine, (3) same stage, (4) not reachable otherwise.
- **`vehicle-purchase-costs` ← `loan-repayment-table`** — dp-3 text "purchase price **or loan repayments**, registration, … stamp duty"; the loan section sits inside the Costs of Buying a Car chapter. Same 4-part reasoning.

## 3. Edits to existing skills (9) — APPLIED

**a–h. Course/dot-point tags** (+`s6-std11`, +`dp-s6st11-managing-1`) — Booklet 1 re-teaches each as its own titled section with worked example + practice (Formulas-and-Equations tagging precedent):

| skill | booklet section trace |
|---|---|
| `quantity-as-fraction-percentage` | §Expressing a Quantity as a Proportion of another (Q a–d) |
| `percentage-of-quantity` | §Finding Percentages Using Multipliers (Q a–d) |
| `percentage-multiplier` | §Percentage Increase and Decrease using Multipliers (2 × Q a–d) |
| `percentage-change` | §Change as a Percentage of the Original (Q a–f) + §Profit and Loss percentage examples |
| `repeated-percentage-change` | §Repeated Percentage Change (2 investigations + Q a–c) |
| `unitary-method-percentages` | §Unitary Method For Finding a Percentage (Q a–d) |
| `interpret-percentage-represented` | §Markups table ("final price as a percentage") + §Problems Involving GST percentage-identification drill (8 cells) |
| `reverse-percentage-problems` | §Unitary Method for Financial Problems (Q a–d: find original from discounted/marked-up price) |

**i. `vehicle-purchase-costs` blurb re-scope** (de-bundling, consumes the two lift-outs):

| | blurb |
|---|---|
| before | Include purchase price, registration, insurance and stamp duty. |
| after | Combine purchase price or loan repayments, registration (vehicle tax by tare weight), insurance premiums with no-claim bonuses, and stamp duty into the total cost of purchasing a vehicle. |

## 4. Borderline candidates → EXCLUDE

- **`vehicle-tax-table`** (registration fee by tare weight/use) — pure two-way table read, no computation; bundled in `vehicle-purchase-costs`.
- **`no-claim-bonus`** — single percentage decrease; instance of `percentage-multiplier`; bundled in `vehicle-purchase-costs`.
- **`bnpl-late-fees`** ("25% or $68, whichever is less") — one worked example, no practice set; bundled in `buying-on-terms` (FMA precedent: "BNPL late fees → `buying-on-terms`").
- **`budget-time-period-conversion`** (weekly ×52 / fortnightly ×26 / monthly ×12 annualising) — same rejection as `pay-period-conversions` in the Earning Money pass; stays inside `prepare-budget`.
- **`read-utility-bills`** as separate node from `household-bills` — bill-reading Foundation questions are the entry ramp of the existing skill, not a separate routine.

## 5. Considered-and-omitted

- Markups/discounts/surcharge/inflation vocabulary → `financial-percentage-problems` + `percentage-multiplier` (tagged above).
- GST forward/reverse (÷11, percentage-identification) → `financial-percentage-problems` (already tagged) via `reverse-percentage-problems` prereq.
- Profit/loss as dollar difference → ambient subtraction inside `percentage-change`/`financial-percentage-problems`.
- Buying on terms (deposit + instalments), BNPL total paid, savings vs upfront → `buying-on-terms` (already tagged).
- Budget balance, saving vs dissaving → `prepare-budget` (already tagged).
- Credit card statement reading (Booklet 2 Q3) → bill-reading ramp; full credit-card routine is Y12 `credit-cards`.
- Booklet 2 Q2g (bill increase as % of last bill) → single instance of `percentage-change`; no edge into `household-bills`.
- Syllabus lines with **no booklet content**: spreadsheet modelling (vehicle + budgets), vehicle *ongoing* cost calculations (dp-3's `vehicle-running-costs` has no exercises in either booklet), emergency fund/saving strategies — nothing to atomise; flagged for booklet revision.

## Net change

- **2 new skills** (`vehicle-stamp-duty`, `loan-repayment-table`)
- **2 new edges** (both into `vehicle-purchase-costs`)
- **9 re-scopes** (8 course/dot-point tags, 1 blurb)
