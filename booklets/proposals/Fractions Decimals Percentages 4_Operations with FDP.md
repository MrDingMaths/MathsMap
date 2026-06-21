# Atomisation proposal — Fractions Decimals Percentages 4: Operations with FDP

**Source booklet:** `booklets/Fractions Decimals Percentages 4_Operations with FDP.md`
**Topic:** `t-s4-frc` (Stage 4) · **Target dot points:** `dp-s4-frc-7`, `dp-s4-frc-8`
(`dp-s4-frc-4` already owns `improper-mixed-numbers`, used as a prereq below)
**Status:** proposal only — **not yet applied to `data/skills.json`**.

## Finding

The booklet covers fraction +/− (same / related / unrelated denominators, mixed
numbers), fraction ×/÷ (incl. mixed numerals, reciprocals), and decimal ×/÷ (incl.
powers of 10). These routines are **already covered at a coarse grain** by existing
Stage 4 skills:

- `add-subtract-fractions` (dp-s4-frc-7) — "Add and subtract fractions and mixed numbers"
- `multiply-divide-fractions` (dp-s4-frc-8) — "Multiply and divide fractions and mixed numbers"
- `multiply-divide-decimals` (dp-s4-frc-8) — "Multiply and divide decimals"

Existing support skills `improper-mixed-numbers`, `lcm-two-numbers`,
`simplify-fractions`, `equivalent-fractions`, `effect-multiply-by-fraction`,
`decimal-times-divide-powers-10` are all present.

So the value is **not** new top-level routines. It is (1) **one genuinely missing
skill** — reciprocals (the graph only has Stage 5/6 *advanced* reciprocal skills) —
and (2) **lifting tricky, at-risk sub-steps out of the coarse skills** as their own
skill + prereq edge, applied consistently to structural twins.

---

## A. Recommended new skills (3)

### A1 · `find-reciprocal` — Find the reciprocal of a number
- **blurb:** Find the reciprocal of a whole number, fraction or mixed numeral by swapping numerator and denominator, recognising that a number times its reciprocal is $1$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-frc-8"]` · **difficulty:** 1
- **prereqs:** `["improper-mixed-numbers"]` — mixed-numeral reciprocals require converting to an improper fraction first.
- **atom type:** Transformation (+ Fact: product with reciprocal $=1$)
- **nearest dot point:** `dp-s4-frc-8` (multiplication/division of fractions — reciprocals are the division enabler).
- **booklet trace:** dedicated section **"Reciprocals"** — worked examples (reciprocal of $\tfrac{1}{8}$, $\tfrac{2}{3}$); Foundation Q1 a–p incl. whole numbers ($3\to\tfrac{1}{3}$) and mixed numerals ($2\tfrac{1}{2}\to\tfrac{2}{5}$, $5\tfrac{3}{4}\to\tfrac{4}{23}$).
- **bar:** Distinctive characteristic enabler of fraction division; at-risk; **genuinely missing** — the only existing `reciprocal-*` skills are Stage 5/6 (index expressions, reciprocal functions/trig), with no elementary "reciprocal of a number".

### A2 · `place-decimal-point-product` — Place the decimal point in a decimal product
- **blurb:** Multiply decimals by multiplying as whole numbers, then place the decimal point so the product has as many decimal places as the two factors combined, e.g. given $534\times12=6408$, $5.34\times1.2=6.408$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-frc-8"]` · **difficulty:** 2
- **prereqs:** `[]` — relies only on whole-number multiplication (ambient, intentionally unrecorded).
- **atom type:** Fact + Transformation
- **nearest dot point:** `dp-s4-frc-8`.
- **booklet trace:** **"Multiplying Decimals"** — "Algorithmic method" worked example ($5.34\times1.2=6.408$, count decimal places); Development Q11, Q13, Q14 ("Given $67\times28=1876$, work out $67\times2.8$ …").
- **bar:** Lift-out of an at-risk sub-step bundled in coarse `multiply-divide-decimals`. Distinctive (count-the-places rule), famously at-risk (misplaced points), separately assessable (booklet tests it directly from a given integer product). Non-redundant.

### A3 · `decimal-divisor-to-whole` — Convert a decimal divisor to a whole number
- **blurb:** Divide by a decimal by multiplying both the dividend and the divisor by the same power of $10$ so the divisor becomes a whole number, e.g. $5.085\div0.03 = 508.5\div3$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-frc-8"]` · **difficulty:** 2
- **prereqs:** `["decimal-times-divide-powers-10"]` — the enabling move is scaling both numbers by a power of $10$.
- **atom type:** Transformation (equivalent-quotient idea)
- **nearest dot point:** `dp-s4-frc-8`.
- **booklet trace:** **"Dividing Decimals"** — method box step 1, worked example $5.085\div0.03$; Foundation Q2 ($52.1\div0.8$, $1.16\div0.04$ …); Guided Practice $0.486\div0.3$.
- **bar:** Structural twin of A2 from the same coarse skill. Distinctive ("shift both" preserves the quotient), at-risk, within ~1 stage, non-redundant.

---

## B. Recommended new prereq edges to existing skills (3)

| Edge (skill ← prereq) | Justification | Redundancy check |
|---|---|---|
| `multiply-divide-fractions ← find-reciprocal` | "Divide by a fraction → multiply by its reciprocal" is the defining step of fraction division (section "Dividing Fractions using the Reciprocal"). | `multiply-divide-fractions` currently only → `add-subtract-fractions`; `find-reciprocal` not reachable. Non-redundant. |
| `add-subtract-fractions ← improper-mixed-numbers` | Adding/subtracting **mixed numbers** (section "Fraction Addition: Mixed Numbers") hinges on converting mixed→improper ($a\tfrac{b}{n}=\tfrac{an+b}{n}$). Place at the **root** of the chain so it propagates upward. | `add-subtract-fractions` → equivalent-fractions, add-subtract-related-denominators; neither reaches `improper-mixed-numbers`. Non-redundant. |
| `add-subtract-fractions ← lcm-two-numbers` *(borderline-include — most trimmable)* | Unrelated-denominator addition's characteristic step is finding the LCD = LCM of the denominators (section "Unrelated Denominators", Key Idea 2). | `lcm-two-numbers` not reachable via existing prereqs. Non-redundant. **Note:** booklet also offers cross-multiplying as a fallback, slightly weakening "distinctive". |

Each new skill also carries its own prereq edge: A1 ← `improper-mixed-numbers`,
A3 ← `decimal-times-divide-powers-10` (A2 has none).

---

## C. Considered and recommended EXCLUDE

- **`multiply-divide-fractions ← improper-mixed-numbers`** — converting mixed→improper also enables *multiplying* mixed numerals ("Multiplying Mixed Numerals"). **Redundant by transitive reachability** once edge B2 is added: `multiply-divide-fractions → add-subtract-fractions → improper-mixed-numbers`. Do not double-record.
- **"Simplify before you multiply" (cross-cancelling) as a new skill** — reduces to existing `simplify-fractions` applied to the product; no new atom. The graph treats fraction-simplifying as **ambient hygiene** (neither add/subtract nor multiply/divide fractions list `simplify-fractions`), so adding it only here would be inconsistent. (Section "Simplify Before You Multiply".)
- **`multiply-divide-fractions ← simplify-fractions`** — same ambient-hygiene reasoning.
- **"Multiplying fractions and integers" as a separate skill** — sub-case of `multiply-divide-fractions` ($\tfrac{a}{b}\times c$); elementary, already covered. (Sections "Multiplying Fractions and Integers / using Models / using the Rule".)
- **"Multiply/divide by powers of 10"** — fully covered by existing `decimal-times-divide-powers-10` (s3, dp-s3-mrb-2). (Sections "Multiplying and Dividing by Powers of 10" + "… using the Rule".)
- **"Effect of ×/÷ by a number between 0 and 1"** (greater/less without calculating; Division Q8–Q9) — already exists as `effect-multiply-by-fraction` (dp-s4-frc-8).
- **Decimal-multiplication "convert to fractions over powers of 10" method** — composes existing `multiply-divide-fractions` + powers-of-10; no new atom.
- **Cross-topic grafts (scope rule — ignored):** algebraic items ($\tfrac{x}{9}+\tfrac{3}{7}$, $\tfrac{2x}{3}\times-6$), order-of-operations chains, area/perimeter & rate word problems, competition questions (JMO/JMC).

---

## Summary

- **3 new skills:** `find-reciprocal`, `place-decimal-point-product`, `decimal-divisor-to-whole` (all Stage 4, `dp-s4-frc-8`).
- **3 new edges:** `multiply-divide-fractions ← find-reciprocal`; `add-subtract-fractions ← improper-mixed-numbers`; `add-subtract-fractions ← lcm-two-numbers` (last is borderline/trimmable).

**Apply note (later pass):** when inserting into `data/skills.json`, keep the
`improper-mixed-numbers` edge only on `add-subtract-fractions` (not also on
`multiply-divide-fractions`) to preserve transitive reduction.
