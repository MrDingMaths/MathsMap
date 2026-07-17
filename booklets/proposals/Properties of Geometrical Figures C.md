# Proposal — Atomise `Properties of Geometrical Figures C` (Path) group

**Status: NIL RESULT** (audited, no changes to `data/skills.json`). The one skill
proposed, `conclusions-from-congruence`, was **REJECTED at review** — see §4. The
`prove-congruent-triangles` re-scope that accompanied it was dropped with it.

**Context.** Booklets: `Stage 5 Path/Properties of Geometrical Figures C_1
Construct formal proofs involving congruent and similar triangles.md`, `…C_2
Apply logical reasoning to proofs involving plane shapes.md`. Target topic
`t-s5p-geo-c`, dot points **dp-s5p-geo-c-1**–**dp-s5p-geo-c-2**. MA5-GEP-P-02.

**Finding.** Four skills cover the topic —
`prove-congruent-triangles` and `prove-similar-triangles` on dp-1,
`prove-properties-triangles-quadrilaterals → prove-quadrilateral-tests` on dp-2 —
and the dp-2 pair maps onto C2 section-for-section. C2 needs nothing.

The pass examined one candidate gap on dp-1: C1's Development is almost entirely
two-part questions of the form "prove the triangles congruent — *hence* prove
AB ∥ DE / PS bisects QR / ΔACD is isosceles / OC ⊥ AB", which is also its own
syllabus bullet ("…and drawing relevant conclusions") and the second step of
every C2 property proof. It was proposed as a lift-out from
`prove-congruent-triangles` (whose blurb mentions "and draw conclusions") and
rejected. **Net change: none.**

## 4. Borderline candidates → EXCLUDE

- **`conclusions-from-congruence`** ("Use corresponding parts of congruent
  triangles to prove a further result, e.g. that intervals are parallel, bisected
  or perpendicular"; proposed at dp-s5p-geo-c-1, difficulty 3, prereq
  `prove-congruent-triangles`) — **proposed and REJECTED at review.** Booklet
  trace was strong: C1 §Formal Proofs of Congruence Development Q2b (hence
  ∠A = ∠C), Q3b–c (hence QS = SR, hence PS bisects QR), Q4b (hence AB ∥ DE),
  Q5b, Q6b/d (incl. the circle/radii version), Q7b (hence AC ⊥ BD, chaining the
  straight-angle fact), Q8b (hence ΔACD is isosceles), Q9 (why OC ⊥ AB); plus
  C2's Example and Foundation Q1 using the same move as step 2 of every property
  proof. Rejected nonetheless: the knowledge stays bundled in
  `prove-congruent-triangles`, whose blurb already says "and draw conclusions".
  **A rejection is a decision — do not re-propose this in a later pass.** The
  accompanying re-scope (dropping "and draw conclusions" from that blurb) is void
  with it; the blurb stands unchanged.
- **`conclusions-from-similarity`** (prove similar, hence find a length) — C1
  §Formal Proofs of Similarity Development Q6b (pole height 40 m), Q7b (cone
  water radius $\frac43$ cm), Mastery Q9b, Q10b, Q11a. Excluded: what follows a
  similarity proof is "set up the ratio of corresponding sides and solve", which
  is already `find-sides-similar`. Nothing to lift out; the work is homed.
- **`prove-similar-triangles-parallel-configuration`** (common angle +
  corresponding/alternate angles on parallel lines; the "two triangles sharing a
  vertex" figure) — C1 §Formal Proofs of Similarity Example, Foundation Q1–Q2,
  Mastery Q9–Q11; also B3 Mastery Q12–Q14, deferred here from row 39. Excluded:
  it is the standard configuration of `prove-similar-triangles` rather than a
  routine beside it — "equiangular" is the test being applied, and the
  parallel-line angle facts are Stage 4 ambient
  (`parallel-line-angle-properties`). **Row 39's deferral is now closed.**
- **`definition-vs-property`** (C2 dp-2 bullet: "recognise that a definition is
  the minimum amount of information needed to identify a particular figure") —
  the booklet never teaches or assesses it; it appears only as framing for
  proving *from* definitions. Excluded on the booklet-required rule.
- **`identify-common-side`** (name the side common to both triangles) — C2 Review
  of Prior Knowledge Q3, C1 Example margin ("What does '$AC$ is common' mean?").
  A genuinely at-risk perception step, but it is one line inside every congruence
  proof and can't be assessed apart from it. Absorbed by
  `prove-congruent-triangles`.

## 5. Considered-and-omitted (already covered / ambient)

- C1 §Formal Proofs of Congruence (the four tests restated; the setting-out —
  "In ΔABC and ΔADC:", R/H/S line labels, a reason per line, `∴ … (RHS)`;
  Example; Foundation Q1a–d complete-the-proof) → `prove-congruent-triangles`,
  prereq'd on `congruent-triangle-tests`.
- C1 §Formal Proofs of Similarity (four tests; "you must write the full reasoning
  every time"; Example equiangular proof; Foundation; Development Q8 finding the
  third angle first) → `prove-similar-triangles`.
- C1 Development Q6b, Q7b, Mastery Q9b/Q10b (having proved similarity, find the
  length) → `find-sides-similar`.
- C1 Review of Prior Knowledge (radii equal in a circle; vertically opposite and
  alternate angles; which test for an isosceles dissection) → Stage 4
  `parallel-line-angle-properties`, `angle-sum-triangle`; ambient.
- C2 §Applying Proofs to Prove Properties (prove properties of squares,
  parallelograms, kites, rhombuses, isosceles triangles from definitions; Example
  "diagonals of a parallelogram bisect each other"; Foundation Q1; Development
  Q7–Q8; Mastery Q14a–d) → `prove-properties-triangles-quadrilaterals`.
- C2 Development Q9, Mastery Q14e–f (the converse direction: diagonals bisect
  each other ⇒ parallelogram; opposite sides equal ⇒ parallelogram) →
  `prove-quadrilateral-tests`, whose blurb already covers tests for
  parallelograms and rhombuses.
- C2 Mastery Q12 (trapezium: why △ABE is *not* congruent to △CDE) → the same
  skill; a non-example of the routine, not a new one.

## Net change

**None.** 0 new skills, 0 new edges, 0 re-scopes. `data/skills.json` untouched.
