# Proposal — Atomise `booklets/Stage 4/Fractions Decimals Percentages 2_Decimals.md`

## Context

Second booklet-atomisation pass over the *Fractions, Decimals & Percentages* unit
(booklet 2: **Decimals**). Goal: extract any genuinely **missing** skills / prereq
edges the booklet exercises but `data/skills.json` does not yet capture, and attach
them to the nearest existing dot point. Booklet sections:

1. **Rounding Decimals using a Number Line** (nearest whole/tenth/hundredth via a line)
2. **Rounding using the Critical Digit Method** (cut → critical digit → round; to a
   place value AND to a number of decimal places; Foundation→Mastery)
3. **Terminating and Recurring Decimals** (dot/bar notation; classify
   terminating / recurring / non-recurring; fraction→decimal by calculator)

Target dot points (topic `t-s4-frc`, MA4-FRC-C-01):
- **dp-s4-frc-2** — "Round decimals to a specified degree of accuracy using approximations"
- **dp-s4-frc-3** — "Identify terminating and recurring decimals"

This is a **proposal only** — `data/skills.json` is not modified.

## Finding (headline)

This area is **already densely covered**; almost everything the booklet teaches maps
to an existing skill. The only candidate that survives the edge-inclusion bar is the
**round-up carry/cascade across a 9** (e.g. `9.999 ≈ 10.00`) — the single most-
emphasised at-risk sub-step in the booklet (the rule statement plus three dedicated
error-analysis questions), and it is currently bundled invisibly inside the coarse
`round-decimals` routine. Lifting it out mirrors the booklet-flagged "lift a tricky,
at-risk bundled sub-step" pattern. Everything else is already covered or ambient.

### Existing coverage (verified — do NOT re-add)

| Booklet content | Existing skill |
|---|---|
| Round to a number of decimal places / nearest place value | `round-decimals` (s3/s4, dp-s3-rna-4 + dp-s4-frc-2) ← `order-decimals-3dp` |
| `≈` approximation notation | `approximation-notation` (s4, dp-s4-frc-2) ← `round-decimals` |
| Placing decimals on a number line | `place-decimals-number-line` (s3) |
| Place-value understanding (the "cut" position) | `partition-decimals-place-value` → `express-thousandths-decimals` (reachable via `round-decimals ← order-decimals-3dp`) |
| Dot/bar (vinculum) recurring notation | `recurring-decimal-notation` (s4, dp-s4-frc-3) |
| Classify terminating vs recurring | `classify-terminating-recurring` (s4, dp-s4-frc-3) ← `recurring-decimal-notation` |

---

## 1. Recommended new skill (×1)

### `round-decimals-carry` — "Round up across a 9 when rounding decimals"

| Field | Value |
|---|---|
| **id** | `round-decimals-carry` |
| **title** | Round up across a 9 when rounding decimals |
| **blurb** | Handle the carry when rounding up turns a 9 into 10, cascading into the next place value, e.g. 9.999 ≈ 10.00. |
| **stage** | 4 |
| **courses** | `["s4"]` |
| **dotPointIds** | `["dp-s4-frc-2"]` |
| **difficulty** | 2 |
| **prereqs** | `["round-decimals"]` |
| **atom type** | Transformation (T) — a hard branch of the rounding routine |

**Proposed JSON object** (insert next to `round-decimals` / `approximation-notation`):

```json
{ "id": "round-decimals-carry", "title": "Round up across a 9 when rounding decimals", "blurb": "Handle the carry when rounding up turns a 9 into 10, cascading into the next place value, e.g. 9.999 ≈ 10.00.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-frc-2"], "prereqs": ["round-decimals"], "difficulty": 2 },
```

**Booklet trace:**
- Critical Digit Method rule, step 4ii "rounding up: Add 1 to digit before the cut"
  — the carry case (lines 105–106).
- Guided Practice e. `8.991` to nearest tenth → `9.0` (lines 140–141).
- Foundation Q5h `7.98` to 1 d.p. → `8.0` (line 272); Q5g `55.55` → `55.6`.
- Foundation Q6 (error analysis) "When we round up from 9, it becomes 10, which we
  carry over to the next place value; 9.0" (lines 289–293).
- Q7 table `9.9899` → 1 d.p. `10.0`, 2 d.p. `9.99` (line 325).
- Development Q12 (error analysis) "Josh rounds 9.999 to two dp and writes 9.90 …
  The answer should be 10.00" (lines 378–383).

**Bar justification (all four hold):**
1. *Distinctive* — a genuinely distinct mechanic (the carry/cascade changes digits
   *before* the cut, possibly across several place values), not ambient arithmetic.
   It is the booklet's flagged at-risk sub-step bundled inside `round-decimals`.
2. *At-risk* — the booklet devotes its rule statement plus **two full error-analysis
   questions** (Q6, Q12) to this exact mistake; explicitly "a common mistake students
   (even senior students!) make".
3. *Stage-proximity* — same stage (4) as its base skill `round-decimals`.
4. *Non-redundant* — no carry/cascade rounding skill exists (grep confirms); not
   reachable from `round-decimals`.

**Attachment rationale:** nearest existing dot point is **dp-s4-frc-2** ("Round
decimals to a specified degree of accuracy"), where `round-decimals` and
`approximation-notation` already sit.

**Stage note (for your call):** attested only in this s4 booklet, so stage 4 / `s4`.
The carry case is arguably also relevant where the base `round-decimals` lives (s3);
if you'd rather it sit with the base skill, change to stage 3 / `["s3","s4"]`.

## 2. Recommended new prereq edge (×1)

### `round-decimals-carry ← round-decimals`

The carry skill is a hard branch of the rounding routine: a student must first be able
to round normally before handling the cascade. This is the new skill's own prereq edge
(included in §1's JSON). **No edges on existing skills change.**

---

## 3. Borderline candidates considered → **EXCLUDE**

**A. "Round only at the final step (avoid premature rounding)"** — Mastery Q13, the
net-area worked comparison (lines 387–435).
- *Exclude:* a procedural *caution*, not a routine atom; it grafts area-of-rectangles
  calculation (cross-topic) and has no clean fraction/decimal dot point to attach to.

**B. "Round to a place value" treated as distinct from "round to N decimal places".**
- *Exclude:* same routine. The booklet's own Q7 table explicitly equates them
  (1 d.p. = nearest tenth, 2 d.p. = nearest hundredth); already inside `round-decimals`.

**C. "Critical Digit Method" as its own skill** (the cut → circle → decide → round
procedure, lines 88–107).
- *Exclude:* this is a *method/representation* for performing `round-decimals`, not a
  separable atom with its own consumer. Same status as the number-line method.

**D. "Classify a decimal as non-recurring (irrational)"** — the third category in Q2
and the π discussion in Q7 (lines 480–498, 578–589).
- *Exclude:* arises only for non-fraction decimals (e.g. π); a minor conceptual
  extension, essentially ambient. `classify-terminating-recurring` covers the routine
  (every *fraction* yields terminating or recurring — never non-recurring).

## 4. Considered-and-omitted (ambient / elementary / already covered)

- **Number-line rounding** (Section 1) → `round-decimals` / `place-decimals-number-line`.
- **Rounding money & measurements** (nearest dollar Q3; nearest 100 g Q9; batting
  average to 2 d.p. Q10) → application of `round-decimals`; the unit framing is ambient
  / cross-topic measurement.
- **Identifying the critical digit / "look only at the digit immediately after the
  cut" / "when rounding down, don't change the digit before the cut"** (Q6a, Q6b) →
  misconception corrections *within* the `round-decimals` routine, not separable atoms.
- **Dot/bar (vinculum) recurring notation** → `recurring-decimal-notation`.
- **Terminating vs recurring classification** → `classify-terminating-recurring`.
- **Converting a fraction to a decimal with a calculator** (recurring section,
  Q5–Q6) → ambient calculator step; downstream conversion is `convert-fractions-decimals-percentages`.
- **`≈` approximation symbol** → `approximation-notation`.
- **Place value / "ths" naming** (tenths/hundredths/thousandths) → reachable via
  `express-thousandths-decimals` → `partition-decimals-place-value`.

---

## Net change if approved

- **+1 skill:** `round-decimals-carry` (stage 4, dp-s4-frc-2).
- **+1 edge:** `round-decimals-carry ← round-decimals` (the new skill's own prereq).
- No edits to any existing skill definition.

If you judge the carry case to be a within-routine edge case rather than a separable
skill, the alternative clean outcome is **zero additions** (booklet fully covered).

## Verification (after applying to data/skills.json, on a later approval)

- Re-run any existing skills-graph validation/build the repo uses for `data/skills.json`
  (JSON parse + referential integrity of `prereqs`/`dotPointIds`).
- Confirm `round-decimals-carry` resolves its prereq `round-decimals` and its
  `dp-s4-frc-2` dot point, and that no cycle is introduced.

**STOP — awaiting review before applying to `data/skills.json`.**
