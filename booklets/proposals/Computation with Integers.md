# Atomisation proposal — Computation with Integers (Stage 4)

Source booklet: `booklets/Stage 4/Computation with Integers.md`
Target dot points: `dp-s4-int-1` … `dp-s4-int-4` (topic `t-s4-int`, MA4-INT-C-01)
Rubric: `docs/atomisation-principles.md`

**Status: RESOLVED — 2-skill scope applied to `data/skills.json`.**
After a booklet-free cross-check pass, the agreed final outcome is the two
"split the at-risk sign step out of the coarse skill" refinements:
`rewrite-touching-signs` and `determine-sign-product-quotient` (+ their two edges).
`interpret-minus-sign` and `additive-inverse-integers` were **dropped** as scaffolding
(see "Dropped after review" below). The recommendations below are kept for the record.

---

## Existing graph (Stage 4 integers)

```
locate-integers-number-line (s3/s4, int-1) []
  └─ compare-order-integers (s4, int-1)
       └─ add-subtract-integers (s4, int-2)
            ├─ directed-number-sentences (s4, int-2)
            └─ multiply-divide-integers (s4, int-3)
                 └─ order-of-operations-integers (s4, int-4)  [+ order-of-operations]
interpret-integers-context (s3, rnb-1) [locate-integers-number-line]
```

Confirmed absent before this proposal: any skill for opposite / additive inverse,
the dual meaning of the minus sign, rewriting touching signs, or the sign rule for
×/÷.

---

## Recommended new skills (4)

Each is traced to a dedicated booklet section with its own worked examples **and**
practice exercises, and clears the edge-inclusion bar (distinctive enabler, at-risk
for the cohort, within ~1 stage, non-redundant).

### 1. `additive-inverse-integers`
- **Title:** Find the opposite of an integer
- **Blurb:** Find the opposite (additive inverse) of an integer and use zero pairs, $a + (-a) = 0$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-int-1"]` · **difficulty:** 1
- **prereqs:** `["locate-integers-number-line"]`
- **Atom type:** Fact / Transformation
- **Booklet trace:** "Opposite Integers" + "Additive Inverse" sections — opposite = same magnitude, different direction; "Apply Additive inverse property" exercise (find missing integer in $5 + (-5) =$ , $\_\_ + (-4) = 0$, $x + \_\_ = 0$).
- **Why it clears the bar:** distinct named concept; at-risk specifically on the missing-addend / zero-pair items, which the coarse `add-subtract-integers` does not isolate.

### 2. `interpret-minus-sign`
- **Title:** Interpret the two meanings of the minus sign
- **Blurb:** Distinguish the minus sign as negative direction (e.g. $-5$) from subtraction (e.g. $8 - 5$), and read $8 + (-5)$ as "add negative 5".
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-int-2"]` · **difficulty:** 1
- **prereqs:** `["locate-integers-number-line"]`
- **Atom type:** Category (decide: direction vs operation)
- **Booklet trace:** "The Negative Symbol" → "Meaning of the Minus Sign" + "Interpret the negative symbol" exercise (write what $9 - 4$, $-12$, $3 + (-5)$, $2 - (-3)$ mean in words, and the reverse).
- **Why it clears the bar:** the characteristic conceptual enabler of touching-signs work; a classic, well-documented site of student confusion → at-risk. Distinct from computing.

### 3. `rewrite-touching-signs`
- **Title:** Rewrite touching signs as a single operation
- **Blurb:** Rewrite two touching signs as one, using $a + (-b) = a - b$ and $a - (-b) = a + b$.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-int-2"]` · **difficulty:** 2
- **prereqs:** `["interpret-minus-sign"]`
- **Atom type:** Transformation
- **Booklet trace:** "Adding and Subtracting Negative Integers" → "Rewriting Touching Signs" rule + dedicated **"Rewrite as subtraction / Rewrite as addition — do not evaluate"** exercises and the fill-in table (single sign ↔ two signs).
- **Why it clears the bar:** the booklet teaches this as a separable step performed *before* any number-line computation; high at-risk; not reachable through any existing prereq.
- **Note on prereqs:** `additive-inverse-integers` underpins this conceptually (zero pairs), but I link only `interpret-minus-sign` to keep the chain minimal. Flag if you'd prefer the extra edge.

### 4. `determine-sign-product-quotient`
- **Title:** Determine the sign of a product or quotient
- **Blurb:** Decide the sign of a product or quotient — same signs → positive, different signs → negative.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-int-3"]` · **difficulty:** 1
- **prereqs:** `[]`
- **Atom type:** Category
- **Booklet trace:** "Multiplying and Dividing Integers" → "Sign Rules" + **"Identify whether the answer will be positive or negative"** exercise (sign decided in isolation, before the magnitude), and the procedure box: "1. Determine the sign … 2. Multiply the magnitudes … 3. Write the correct sign".
- **Why it clears the bar:** the booklet explicitly isolates the sign decision as step 1, separate from magnitude; distinctive and at-risk.

---

## Recommended new prereq edges to existing skills (2)

- **`add-subtract-integers` ← `rewrite-touching-signs`**
  The negative-integer case (e.g. $-6 - (-2)$, $-2 + (-3)$) requires rewriting the
  touching signs before the number-line step. Distinctive, same-stage, non-redundant.
- **`multiply-divide-integers` ← `determine-sign-product-quotient`**
  The sign decision is the characteristic first step of the ×/÷ routine.

`directed-number-sentences` and `order-of-operations-integers` sit above these and
inherit the new skills transitively — no extra edges.

Resulting Stage 4 integer subgraph:

```
locate-integers-number-line
  ├─ compare-order-integers ─ add-subtract-integers
  ├─ interpret-minus-sign ─ rewrite-touching-signs ─→ add-subtract-integers
  └─ additive-inverse-integers
determine-sign-product-quotient ─→ multiply-divide-integers
```

---

## Dropped after review (booklet-free cross-check)

- **`interpret-minus-sign`** — folded into `rewrite-touching-signs`; it was essentially
  that skill's prereq, and the booklet-free pass did not surface it independently. To
  keep the chain minimal, `rewrite-touching-signs` now attaches directly to
  `locate-integers-number-line`.
- **`additive-inverse-integers`** — at-risk too thin for the Stage 4 cohort ("opposite
  of $-7$"); also absent from the booklet-free pass. Dropped.

The booklet-free pass also (wrongly) excluded `determine-sign-product-quotient` as
"redundant with `multiply-divide-integers`' blurb" — but the rubric's non-redundant
test is transitive reachability, not blurb overlap, and nothing else reaches it. It is
the structural twin of `rewrite-touching-signs` (each lifts the characteristic at-risk
sign step out of a coarse skill), so both are kept.

## Borderline — flagged, recommend EXCLUDE

- **`mental-shortcuts-add-subtract-integers`** — "Mental Shortcuts for Adding and
  Subtracting Integers" section: $-a - b = -(a+b)$, and partitioning the larger
  magnitude into zero pairs ($50 - 130 = 50 - 50 - 80$). This is a *computation
  strategy* for the same routine, not a separate teachable/assessable skill →
  recommend folding into `add-subtract-integers`. **Add only if you want the mental
  method tracked separately.**
- **`sign-of-power-of-negative`** — mult/div §Q18–Q19: $(-2)^4$ positive, $(-2)^3$
  negative; "even number of times → positive, odd → negative"; predict the sign of
  $(-65)^{13}$. Genuinely routine *but* grafts **index notation** onto integers →
  cross-topic per the rubric. Recommend exclude (revisit when atomising Indices).

---

## Considered and omitted (no schema change)

Ambient / elementary / already covered — recorded so the decision is auditable:

- **Magnitude & direction of an integer**; **identify integers** (whole vs
  fraction/decimal) — elementary classification, subsumed by
  `locate-integers-number-line`.
- **Counting up/down in steps, halfway-between, reading marked number lines** —
  subsumed by `locate-integers-number-line` / `compare-order-integers`.
- **Left-to-right for equal-priority ×/÷**; **fraction bar as division** ($\frac{-12}{4} = -12 \div 4$)
  — already in `order-of-operations-integers` / `division-as-fraction`.
- **Real-context modelling** (temperature, debt, altitude, lift floors) — already in
  `interpret-integers-context` (s3) and `directed-number-sentences` (s4).

---

## On approval

Apply the 4 skills + 2 edges to `data/skills.json` (near lines 165–169, matching the
one-line-per-skill formatting and the `CLAUDE.md` notation table), then run
`npm run validate` — expecting zero warnings.
