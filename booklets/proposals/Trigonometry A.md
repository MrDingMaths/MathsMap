# Proposal — Atomise `Trigonometry A` (Core) group

**Status: APPLIED** (skills.json updated, `npm run validate` clean).

**Context.** Booklets: `Stage 5 Core/Trigonometry A 1_Demonstrate and explain the
constancy of trigonometric ratios for a given angle in right-angled triangles.md`,
`Stage 5 Core/Trigonometry A 2_Apply trigonometry to solve right-angled triangle
problems.md`. Target topic `t-s5c-trg-a`, dot points **dp-s5c-trga-1**
(constancy/definition) and **dp-s5c-trga-2** (apply to right-angled triangles).
MA5-TRG-C-01.

**Finding (headline).** dp-1 is nearly saturated (`label-trig-sides →
define-trig-ratios → {trig-ratio-constancy, find-angle-from-ratio}`) — A1's
Sides / Ratios / Constancy sections map 1:1, and the constancy investigation's
similar-triangle argument is already wired (`trig-ratio-constancy ←
similar-figures-properties`). One real dp-1 gap: A1 gives a whole section +
21-part Foundation Q1 to **evaluating** a ratio on the calculator (the forward
direction) — the graph only has the inverse direction. dp-2 has three skills
(`trig-find-side`, `trig-find-angle`, `trig-practical-problems`) whose blurbs
bundle content the booklet deliberately teaches as separate progressions: A2
splits unknown-in-**numerator** (Part 1) from unknown-in-**denominator**
(Part 2), and `trig-find-angle`'s "including in degrees and minutes" hides A2's
rule-based sexagesimal rounding routine.

## 1. Recommended new skills (3)

### 1.1 `evaluate-trig-ratio`

| field | value |
|---|---|
| id | `evaluate-trig-ratio` |
| title | Evaluate a trigonometric ratio |
| blurb | Use a calculator to evaluate $\sin\theta$, $\cos\theta$ and $\tan\theta$ for a given angle, including compound forms such as $12\sin 13^{\circ}$ and $\dfrac{9}{\sin 57^{\circ}}$. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-trga-1"]` · difficulty 1 |
| prereqs | `["define-trig-ratios"]` |
| atom type | Transformation |

```json
{ "id": "evaluate-trig-ratio", "title": "Evaluate a trigonometric ratio", "blurb": "Use a calculator to evaluate $\\sin\\theta$, $\\cos\\theta$ and $\\tan\\theta$ for a given angle, including compound forms such as $12\\sin 13^{\\circ}$ and $\\dfrac{9}{\\sin 57^{\\circ}}$.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-trga-1"], "difficulty": 1, "prereqs": ["define-trig-ratios"] }
```

**Booklet trace:** A1 §"Calculating the Value of a Trigonometric Ratio" — two
Examples ($\cos 84^{\circ}\approx0.1045$; $6\cos 27^{\circ}\approx5.3460$),
Guided Practice a–f, Foundation Q1a–u, which escalates through `12 sin 13°`,
`150 cos 18.5°`, `9/sin 57°`, `53.2/tan 42°` — exactly the two evaluation shapes
the dp-2 routines need.

**Bar:** (1) *Distinctive* — the forward "angle → ratio" calculator step is the
characteristic enabler of every dp-2 routine and is the only dp-1 direction not
in the graph (`find-angle-from-ratio` is its mirror). (2) *At-risk* — A2's
Check-your-Understanding Q1–Q4 are built entirely on this misconception,
distractors `sin(50×6)` vs `sin(50)×6` and `sin(50)/6` vs `6/sin(50)`.
(3) *Stage-proximity* — same stage. (4) *Non-redundant* — nothing else in the
graph reaches it.

### 1.2 `trig-find-side-denominator`

| field | value |
|---|---|
| id | `trig-find-side-denominator` |
| title | Find an unknown side in the denominator |
| blurb | Solve for an unknown side when it sits in the denominator, e.g. $\sin 35^{\circ}=\dfrac{5}{x}$, by multiplying by $x$ then dividing by the ratio. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-trga-2"]` · difficulty 2 |
| prereqs | `["trig-find-side"]` |
| atom type | Routine (progression chain downstream of the numerator case) |

```json
{ "id": "trig-find-side-denominator", "title": "Find an unknown side in the denominator", "blurb": "Solve for an unknown side when it sits in the denominator, e.g. $\\sin 35^{\\circ}=\\dfrac{5}{x}$, by multiplying by $x$ then dividing by the ratio.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-trga-2"], "difficulty": 2, "prereqs": ["trig-find-side"] }
```

**Booklet trace:** A2 §"Finding Unknown Sides Part 2" — a whole booklet part
separate from Part 1, with its own §"Trigonometric Equations with Unknown in
Denominator" Example ($\cos 60^{\circ}=\frac{5}{x}\Rightarrow
x=\frac{5}{\cos 60^{\circ}}=10$), Guided Practice a–f, own §"Solving for an
unknown side" Example ($x=\frac{5}{\sin 35^{\circ}}\approx8.72$;
$x=\frac{19}{\tan 28^{\circ}}\approx35.73$), Guided Practice a–c; recurring in
Foundation §Problem-Solving Q1a (ladder, 638 cm) and Q10a/b.

**Bar:** (1) *Distinctive* — the "when is $x$ in the denominator, multiply then
divide by the ratio" decision is the characteristic sub-step; the booklet's own
prompt names it ("When should we do $\times x$ to both sides? *When $x$ is in
the denominator*"). (2) *At-risk* — CYU Q1–Q4 distractors are precisely
`sin(50)×6` vs `6/sin(50)`. (3) *Stage-proximity* — same stage.
(4) *Non-redundant* — per the rubric's progression-chain rule this sits
**downstream** of the re-scoped `trig-find-side` (see §3), not beside it.

### 1.3 `round-angle-degrees-minutes`

| field | value |
|---|---|
| id | `round-angle-degrees-minutes` |
| title | Round an angle to the nearest degree or minute |
| blurb | Round an angle in sexagesimal form, rounding up when the critical unit is $30$ or more, e.g. $43^{\circ}\,44'\,8.4'' \approx 44^{\circ}$. |
| stage | 5 · courses `["s5-core"]` · dotPointIds `["dp-s5c-trga-2"]` · difficulty 1 |
| prereqs | `[]` |
| atom type | Routine (Fact: the 30-unit threshold) |

```json
{ "id": "round-angle-degrees-minutes", "title": "Round an angle to the nearest degree or minute", "blurb": "Round an angle in sexagesimal form, rounding up when the critical unit is $30$ or more, e.g. $43^{\\circ}\\,44'\\,8.4'' \\approx 44^{\\circ}$.", "stage": 5, "courses": ["s5-core"], "dotPointIds": ["dp-s5c-trga-2"], "difficulty": 1, "prereqs": [] }
```

**Booklet trace:** A2 §"Degrees Minutes Seconds" → §"Rounding in Sexagesimal
Form" — an explicit 4-step rule (cut / circle critical unit / decide / round)
with two Examples ($43^{\circ}44'8.4''\approx44^{\circ}$;
$88^{\circ}30'22''\approx88^{\circ}30'$) and Guided Practice a–f. It is then
load-bearing across §Trigonometry with DMS Example 2
($44^{\circ}25'37.21''\approx44^{\circ}26'$) and every "to the nearest minute"
question: Foundation Q1d/e, Q2b, Q4, Q5, Development Q6, Q10d/e, Mastery Q13
(2019 HSC Standard 2).

**Bar:** (1) *Distinctive* — base-60 rounding with a threshold of 30, not the
decimal threshold of 5; a different rule from `round-decimals`, not ambient
arithmetic. (2) *At-risk* — a student fluent in decimal rounding will apply the
5-threshold; the booklet builds a bespoke 4-step scaffold precisely because it
is. (3) *Stage-proximity* — same stage. (4) *Non-redundant* — no existing skill
reaches it (`convert-time-decimal-sexagesimal` is a Stage-4 **time** skill and
cannot wire in — see §4).

## 2. Recommended new prereq edges (3, net +1 after transitive reduction)

- **`trig-find-side ← evaluate-trig-ratio`** — A2's §"Solving for an unknown
  side" step 5 is "solve the equation", which *is* evaluating $7\sin 38^{\circ}$.
  Bar: distinctive (the calculator evaluation is the terminal step of the
  routine), at-risk (CYU Q1–4), same stage. *Transitive reduction:*
  `define-trig-ratios` becomes reachable via `evaluate-trig-ratio`, so **drop**
  the existing `trig-find-side ← define-trig-ratios` edge.
- **`trig-find-angle ← round-angle-degrees-minutes`** — A2 §"Trigonometry with
  DMS" Example 2 and the DMS-answer questions above. Bar: distinctive (the
  answer-form conversion is what "in degrees and minutes" means operationally),
  at-risk, same stage, not otherwise reachable.
- **`trig-practical-problems ← trig-find-side-denominator`** — Foundation
  §Problem-Solving Q1a (ladder length), Q10a/b (ladder, glider) are
  denominator-case practical problems. *Transitive reduction:* `trig-find-side`
  stays reachable through the new skill, so **drop** the existing
  `trig-practical-problems ← trig-find-side` edge.

## 3. Edits to existing skills (2 re-scopes)

- **`trig-find-side`** — before: *"Apply trig ratios to find unknown side lengths
  in right-angled triangles."* → after: *"Apply trig ratios to find an unknown
  side that is in the numerator, e.g. $\sin 38^{\circ}=\dfrac{x}{7}$."*
  (Progression-chain rule: the blurb bundled both cases while the booklet teaches
  them as Parts 1 and 2; the harder case moves downstream.) Prereqs become
  `["evaluate-trig-ratio"]`.
- **`trig-find-angle`** — before: *"Apply trig ratios to find unknown angles,
  including in degrees and minutes."* → after: *"Apply trig ratios to find
  unknown angles in a right-angled triangle, using the inverse trig functions."*
  (The "degrees and minutes" clause is now carried by the lifted-out prereq.)
  Prereqs become `["find-angle-from-ratio", "round-angle-degrees-minutes"]`.

## 4. Borderline candidates → EXCLUDE

- **`convert-decimal-sexagesimal` (angles)** — A2 §Sexagesimal Notation Example +
  Guided Practice a–f. Excluded: a pure calculator-button transformation, and the
  identical routine already exists as `convert-time-decimal-sexagesimal` (Stage 4,
  added by the Ratios and Rates pass, whose blurb already names the DMS button).
  Wiring that Stage-4 **time** skill into a trig routine is a cross-topic
  prereq — barred by the scope rule. Recorded so a future pass doesn't re-derive
  it.
- **`solve-trig-equation`** (treat the ratio as a number:
  $\sin 30^{\circ}=\frac{x}{7}$ *is* $0.5=\frac{x}{7}$) — A2
  §Trigonometric Equations, both parts. Absorbed into `trig-find-side` /
  `trig-find-side-denominator`; standalone it is one-step equation solving, i.e.
  ambient algebra.
- **`trig-multistep`** (two triangles, chain an intermediate side) — A2 Mastery
  Q11 (snapped tree), Q14 (`AB`), Q15 (`XY`). Real weight but Mastery-only;
  precedent from the `Right-angled Triangles` pass excludes mastery/HSC-band
  extensions as non-routine. `pythagoras-multistep` exists there because that
  booklet gave the routine its own teaching section — this one doesn't.
- **"Choose which ratio to use"** (step 2 of the booklet's 5-step scaffold; A2
  CYU §Finding unknown angle Q1) — an invisible Category atom, but intrinsic to
  and inseparable from `trig-find-side`/`trig-find-angle`. Absorbed, not split.

## 5. Considered-and-omitted (already covered / ambient)

- Label H/O/A in any orientation → `label-trig-sides`. Write the three ratios →
  `define-trig-ratios`.
- Constancy investigation + similar-triangles Foundation Q1 →
  `trig-ratio-constancy` (its `similar-figures-properties` prereq already carries
  the argument).
- Inverse functions $\theta=\sin^{-1}(\frac{6}{10})$, A1 §Calculating the Value
  of an Angle → `find-angle-from-ratio`; applied in a triangle →
  `trig-find-angle`.
- Practical problems (ladder, tree, roof, flagpole, kite, ramp, HSC Q13) →
  `trig-practical-problems`.
- Rounding to 2 d.p. / nearest cm throughout → `round-decimals` (Stage 3),
  ambient.
- A2 Foundation Q3 (isosceles ⇒ $\theta=45^{\circ}$ via angle sum) → cross-topic
  geometry; no edge per the scope rule.
- Sexagesimal *definitions* (degree = 1/360 turn, minute = 1/60 degree) → Fact,
  absorbed into `round-angle-degrees-minutes`.

## Net change applied

- **+3 skills:** `evaluate-trig-ratio`, `trig-find-side-denominator`,
  `round-angle-degrees-minutes`
- **+3 edges, −2 edges** by transitive reduction (net **+1**)
- **2 blurb re-scopes:** `trig-find-side`, `trig-find-angle`
