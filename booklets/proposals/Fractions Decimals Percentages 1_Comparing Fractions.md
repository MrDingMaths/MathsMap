# Proposal — Atomise `booklets/Stage 4/Fractions Decimals Percentages 1_Comparing Fractions.md`

## Context

Booklet-atomisation pass over the first *Fractions, Decimals & Percentages* unit.
Goal: extract any genuinely **missing** skills / prereq edges the booklet exercises
but `data/skills.json` does not yet capture, and attach them to the nearest existing
dot point. The booklet has nine sections: **HCF**, **LCM**, **Relating HCF & LCM**,
**Equivalent Fractions (diagrams)**, **Equivalent Fractions (the rule)**, **Simplifying
Fractions**, and **Comparing Fractions** (same denominator/numerator → related
denominators → unrelated denominators).

Target dot point: **dp-s4-frc-1** ("Compare fractions using equivalence", topic
`t-s4-frc`, MA4-FRC-C-01) — where the existing HCF / equivalent / simplify / compare
fraction skills already live, so the nearest home for new HCF/LCM work.

This is a **proposal only** — `data/skills.json` is not yet modified.

## Finding (headline)

The topic is already densely covered. The graph lifts **HCF** out as its own skill
(`hcf-two-numbers`, s4) feeding `simplify-fractions`. Its structural twin **LCM has no
skill at all** anywhere in the graph (confirmed by grep — no `lcm-*`, no
`find-multiples-*`), even though the booklet teaches LCM across a full
Foundation→Mastery section, and LCM is the characteristic enabler bundled inside
`compare-order-fractions` (the "find the lowest common denominator" sub-step). Lifting
LCM out — mirroring the existing HCF lift — is the one high-value, non-redundant
addition. Everything else the booklet teaches is already covered or is ambient.

### Existing coverage (verified — do NOT re-add)

| Booklet section | Existing skill |
|---|---|
| HCF | `hcf-two-numbers` (s4, dp-s4-frc-1) ← `find-factors-of-number` |
| Listing factors | `find-factors-of-number` (s3) |
| Equivalent fractions — diagrams | `equivalent-fractions` (s3/s4) |
| Equivalent fractions — the rule (×/÷ num & denom by same number) | core mechanism of `equivalent-fractions` |
| Simplifying fractions | `simplify-fractions` (s4) ← `hcf-two-numbers`, `equivalent-fractions` |
| Compare same/related denominators | `order-fractions-related-denominators` (s3), `compare-fractions-area-discrete`, `order-unit-fractions` |
| Compare unrelated denominators / order | `compare-order-fractions` (s4) ← `equivalent-fractions` |

---

## 1. Recommended new skill (×1)

### `lcm-two-numbers` — "Find the lowest common multiple (LCM)"

| Field | Value |
|---|---|
| **id** | `lcm-two-numbers` |
| **title** | Find the lowest common multiple (LCM) |
| **blurb** | Determine the LCM of two whole numbers by listing multiples or by dividing the product by the HCF. |
| **stage** | 4 |
| **courses** | `["s4"]` |
| **dotPointIds** | `["dp-s4-frc-1"]` |
| **difficulty** | 1 |
| **prereqs** | `[]` |
| **atom type** | Routine (R) |

**Proposed JSON object** (insert next to `hcf-two-numbers`):

```json
{ "id": "lcm-two-numbers", "title": "Find the lowest common multiple (LCM)", "blurb": "Determine the LCM of two whole numbers by listing multiples or by dividing the product by the HCF.", "stage": 4, "courses": ["s4"], "dotPointIds": ["dp-s4-frc-1"], "prereqs": [], "difficulty": 1 },
```

**Booklet trace (heavily represented):**
- *Lowest Common Multiple* → boxed rule + **Example** "Determine the LCM of 6 and 8"
  (lines 227–240), Guided Practice a–c (245–270), Foundation Q1–Q6 (282–419).
- *Relating HCF and LCM* → product÷HCF shortcut **Example** + Q10 (lines 562–602);
  LCM determination Q7–Q8, Q12 (501–706).

**Bar justification (all four hold):**
1. *Distinctive* — the characteristic enabler of common-denominator comparison
   (finding the LCD); not ambient arithmetic. Direct structural twin of the
   already-lifted `hcf-two-numbers`.
2. *At-risk* — newly taught at Stage 4 and a classic point of confusion with HCF
   (which to list — multiples or factors; which is bigger).
3. *Stage-proximity* — sits at stage 4 alongside its consumer `compare-order-fractions`.
4. *Non-redundant* — no LCM skill (or multiples skill) exists in the graph.

**`prereqs: []` rationale:** the taught primary method is listing multiples
(skip-counting / times-tables), which is ambient — no graph skill captures it. The
product÷HCF shortcut is one optional route, so `hcf-two-numbers` is **not** a true
dependency (see Borderline B).

**Attachment rationale:** `dp-s4-frc-1` is the nearest existing dot point, mirroring
where `hcf-two-numbers` already sits (both are number-theory enablers of fraction
comparison/simplification).

## 2. Recommended new prereq edge (×1)

### `compare-order-fractions ← lcm-two-numbers`

`compare-order-fractions` ("compare and order fractions with unrelated denominators")
nominally bundles the tricky sub-step "find the LCM of the denominators (the LCD)".
The booklet's *Unrelated Denominators* section is built entirely on computing that LCM
(Example lines 2213–2221; Review "Determine LCM" prompts 2171–2177; Development Q3
2338–2409). Lifting this bundled, at-risk sub-step out is legitimate and the exact
mirror of the existing `simplify-fractions ← hcf-two-numbers` edge.

**Bar:** distinctive ✓, at-risk ✓, both stage 4 (proximity ✓), non-redundant —
`equivalent-fractions` (the existing prereq) does not reach `lcm-two-numbers` ✓.

**Resulting `prereqs` for `compare-order-fractions`:**
`["equivalent-fractions", "lcm-two-numbers"]`.

> Note: `order-fractions-related-denominators` (s3, diagram-based) deliberately gets
> **no** LCM edge — for related denominators the LCD is just the larger denominator, so
> no LCM computation is required.

---

## 3. Borderline candidates considered → **EXCLUDE**

**A. "Compare fractions with the same denominator / same numerator"**
(dedicated booklet section, lines 1809–1949).
- *Exclude:* the same-denominator rule ("larger numerator wins") is ambient/trivial;
  the genuinely at-risk same-numerator case ("smaller denominator is larger", e.g.
  1/12 < 1/7) is already captured by `compare-unit-fractions-half` +
  `order-unit-fractions`. No distinctive, non-redundant atom remains.

**B. Edge `lcm-two-numbers ← hcf-two-numbers`** (the product÷HCF shortcut, Q10 lines
562–602).
- *Exclude:* LCM's primary taught method (listing multiples) does not depend on HCF;
  the shortcut is one optional route, not a true prerequisite. Adding it would
  over-couple the two number-theory skills.

**C. "Decide HCF vs LCM and solve worded problems"** (*Relating HCF and LCM* Mastery
Q14–Q28: buses meeting, cutting planks, rose bunches; lines 715–868).
- The *strongest* borderline — a real routine genre, and the "which one?" decision is
  at-risk.
- *Exclude on balance:* peripheral to the fraction dot points. `dp-s4-frc-1` is
  "compare fractions using equivalence"; bus/plank/bunch problems are a number-theory
  **application** grafted on, with no clean fraction dot point to attach to. **Flagged
  for review** — if application coverage is wanted, it would attach to `dp-s4-frc-1`
  with prereqs `["hcf-two-numbers", "lcm-two-numbers"]`.

## 4. Considered-and-omitted (ambient / elementary / already covered)

- **Listing multiples / skip-counting** — ambient, elementary; not a graph skill, not a prereq.
- **Listing factors** — already `find-factors-of-number`.
- **Equivalent fractions by diagrams** (section 4) — `equivalent-fractions`.
- **Equivalent fractions "by the rule"** (section 5, ×/÷ num & denom by same number) —
  *is* the mechanism of `equivalent-fractions`, not a separate teachable atom.
- **Simplifying fractions** — `simplify-fractions`.
- **Fraction of a shaded diagram** (equiv Q22, simplify Q12–13) —
  `compare-fractions-area-discrete` / `equivalent-fractions`.
- **Comparing related denominators** — `order-fractions-related-denominators`
  (+ reachable via `compare-order-fractions`).
- **Ordering improper/mixed fractions ascending** (Unrelated Q7, lines 2449–2465) —
  ordering is covered by `compare-order-fractions`; the improper⇄mixed conversion is a
  different topic grafted on (no-cross-topic rule) — omit.
- **Relational symbols `<, >, =`** — ambient.

---

## Net change if approved

- **+1 skill:** `lcm-two-numbers` (stage 4, dp-s4-frc-1).
- **+1 edge:** `compare-order-fractions ← lcm-two-numbers`.
- No edits to any existing skill definition.

**STOP — awaiting review before applying to `data/skills.json`.**
