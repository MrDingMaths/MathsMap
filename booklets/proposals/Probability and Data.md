# Probability and Data (Stage 6 Advanced Y11) — atomisation proposal

**Status: APPLIED** (2026-07-17). 1 new skill, 2 new edges, 0 re-scopes.
`npm run validate` clean (1168 skills).

## Context
- **Booklets:** `Probability and Data 1_Sets and set notation`, `2_Probability`,
  `3_Conditional Probability`, `4_Data`.
- **Target:** `t-s6adv11-probdata`, dot points `dp-s6adv11-probdata-1`…`-6`
  (MAV-11-09 / MAV-11-10).
- **Goal:** audit the four booklets against the existing graph; propose only
  genuinely missing skills/edges.

## Finding (headline)
Topic already comprehensively covered — 18 skills touch these six dot points,
including nine Stage-6-Advanced-specific skills (`set-notation-fundamentals`,
`inclusion-exclusion-rule`, `probability-complement-addition`,
`multistage-arrays-trees`, `independence-test`,
`discrete-continuous-random-variables`, `frequency-distribution-table`,
`frequency-cumulative-graphs`, `estimate-probability-relative-frequency`) plus
reused Stage 4/5 skills. Every set-notation, sample-space, complement/addition,
Venn, multistage-tree, frequency-table/ogive, and relative-frequency routine in
the booklets maps to an existing skill.

**One genuine gap:** the tree-based reverse ("Bayes-type") conditional
probability routine — dedicated booklet-3 section with its own 4-step method,
worked example, two practice sets, and 6+ HSC/VCE questions — is not captured by
the Stage-5 `conditional-probability` skill (the sample-space-restriction/Venn
method).

## 1. Recommended new skill

| field | value |
|---|---|
| id | `conditional-probability-tree` |
| title | Reverse conditional probability with trees |
| blurb | Find a reverse conditional probability $P(B\|A)$ for multistage events by building a tree from $P(B)$, $P(A\|B)$ and $P(A\|\bar{B})$, then applying $P(B\|A)=\dfrac{P(A\cap B)}{P(A\cap B)+P(\bar{B}\cap A)}$. |
| stage | 6 |
| courses | `["s6-adv11"]` |
| dotPointIds | `["dp-s6adv11-probdata-4"]` |
| difficulty | 3 |
| prereqs | `conditional-probability`, `multistage-arrays-trees` |
| atom type | Routine (R) |

```json
{
  "id": "conditional-probability-tree",
  "title": "Reverse conditional probability with trees",
  "blurb": "Find a reverse conditional probability $P(B|A)$ for multistage events by building a tree from $P(B)$, $P(A|B)$ and $P(A|\\bar{B})$, then applying $P(B|A)=\\dfrac{P(A\\cap B)}{P(A\\cap B)+P(\\bar{B}\\cap A)}$.",
  "stage": 6,
  "courses": ["s6-adv11"],
  "dotPointIds": ["dp-s6adv11-probdata-4"],
  "prereqs": ["conditional-probability", "multistage-arrays-trees"],
  "difficulty": 3
}
```

**Booklet trace:** Booklet 3, "Conditional Probability for Multistage Events"
section — 4-step method + worked Example (zoo births/article,
P(Baby|Article)=0.64); Practice (hospital serious-condition; factory defective);
Q10 (tennis home/away); Q25 (2022 HSC, special die); Q27 (2024 VCE,
limousine/photo); Q28 (2023 HSC, availability). All are
given-forward-conditionals → find-reverse-conditional via a tree + total
probability.

**Edge-bar justification (both prereqs):**
1. **Distinctive** — computing $P(A)$ as the sum of branch products and inverting
   the condition is the characteristic enabler; not the plain sample-space
   restriction of `conditional-probability`, nor a generic tree.
2. **At-risk** — a student fluent in basic "given"/Venn conditionals (Stage 5)
   can readily still fail the reverse-conditional-from-a-tree; well-known HSC
   Band 5/6 discriminator.
3. **Stage-proximity** — `conditional-probability` (5) and
   `multistage-arrays-trees` (6) are both ≤1 stage from this Stage-6 skill.
4. **Non-redundant** — neither prereq reaches the other
   (`conditional-probability ← set-notation-events, independent-dependent-events`;
   `multistage-arrays-trees ← theoretical-probability`), so both edges survive
   transitive reduction.

## 2. Recommended new prereq edges
None beyond the two carried by the new skill above.

## 3. Edits to existing skills
None. `frequency-cumulative-graphs` already states "identify the mode and
median"; `summary-stats-frequency-table` already carries
$\overline{x}=\sum fx/\sum f$.

## 4. Borderline candidates → EXCLUDE
- **`expected-frequency` retag to probdata** — booklet 2 teaches $f=np$, but the
  skill already exists (Stage 4) and expected frequency is not a probdata
  dot-point outcome; revision. Omit.
- **`summary-stats-frequency-table` / mean-from-table retag to probdata-5** —
  mean/median/mode from a frequency table is a Stage 4 skill; probdata dot points
  cover organising tables and "identify mode/median from graphs/tables" (already
  in `frequency-cumulative-graphs`). Computing the mean is ambient support. Omit.
- **Edge `multistage-arrays-trees ← probability-independent-events`** —
  product-rule is re-taught from scratch in booklet 2, and the graph author
  deliberately gave `multistage-arrays-trees` a minimal prereq
  (`theoretical-probability`). Cross-stage edge risks pollution for no at-risk
  gain. Omit.
- **Algebraic independence proof** (dp-4 syllabus "show algebraically…") — no
  routine proof questions in the booklet (all practice is "test independent" /
  "find x"); covered by `independence-test`. Omit.

## 5. Considered-and-omitted (already covered)
Set notation, ∈, n(A)/|A|, complement, subset, ∩/∪, disjoint, Venn shading →
`set-notation-fundamentals` + `venn-diagrams-two-way-tables`; inclusion–exclusion
→ `inclusion-exclusion-rule`; sample space & $P(A)=|A|/|S|$ → `sample-space`,
`theoretical-probability`; complement/addition rules →
`probability-complement-addition`; fundamental counting, two-way tables, tree
diagrams, product rule (indep + dependent/no-replacement), "at least one =
1−P(none)" → `multistage-arrays-trees` + Stage-5 `probability-independent-events`
/ `probability-dependent-events` / `complementary-multistage`; basic conditional
& independence test → `conditional-probability`, `independence-test`;
discrete/continuous RVs → `discrete-continuous-random-variables`;
frequency/cumulative/relative tables + histograms/polygons/ogives + mode/median →
`frequency-distribution-table`, `frequency-cumulative-graphs`, `grouped-data`;
relative frequency & law of large numbers → `estimate-probability-relative-frequency`.

## Net change
**1 new skill, 2 new edges, 0 re-scopes.**
