# Atomisation proposal — `Equations 2: Formulas`

**Status: APPROVED & APPLIED.** Both recommended edges have been added to
`data/skills.json` (object `model-word-problems-equations`). No new skills.

## Scope

Atomised `booklets/Stage 4/Equations 2_Formulas.md` into genuinely-missing skills +
prereq edges for `data/skills.json`, per `docs/atomisation-principles.md`.

Edge-inclusion bar: add `X ← P` only if P is (1) distinctive, (2) at-risk,
(3) within ~1 stage of X unless distinctive, (4) non-redundant by transitive
reachability. New skills only when no existing skill covers the routine.

### Target dot point / topic

- **Primary:** `dp-s5c-equa-3` — "Solve linear equations arising from word
  problems and substitution into formulas" (topic `t-s5c-equ-a`, Stage 5 Core).
- **Supporting (§1, evaluate the subject):** `dp-s4-alg-2` ("Create algebraic
  expressions and evaluate them by substitution") and `dp-s4-equ-2` ("Solve and
  verify linear equations by substitution").

The booklet has three parts: §1 *Substitution into Formulas* (evaluate the
subject), §2 *Solving for an Unknown after Substitution* (substitute → solve),
and a *Challenge Exercise* (word-problem equation modelling).

## Headline outcome

**No new skills.** The booklet's routines are already represented:

| Booklet routine | Existing skill |
|---|---|
| §1 substitute into formula, evaluate subject | `substitute-into-expressions` (+ `substitute-negative-numbers` for negatives) |
| §2 substitute, then solve for a non-subject unknown | `equations-from-formulas` |
| §2 quadratic case (e.g. `S = 2πr²`, find `r`) | `quadratics-from-formulas` |
| §2 / Mastery "write a formula for…" then use it | `translate-expressions` |
| Challenge: form & solve equations from words | `model-word-problems-equations` |

The genuine gaps were **two missing prereq edges on
`model-word-problems-equations`**, both driven by the Challenge Exercise.

## New prereq edges applied (to existing skills)

### 1. `model-word-problems-equations ← solve-equation-x-both-sides`  — HIGH confidence
- **Both Stage 4** (proximity ✓).
- **Distinctive:** the Challenge "age / comparison / quantity" problems
  characteristically produce the pronumeral on *both sides*; gathering the x-terms
  (keeping the coefficient positive) is the enabling step, not ambient arithmetic.
- **At-risk:** classic sign/coefficient errors when collecting x to one side.
- **Non-redundant:** current path is `model → solve-linear-2-step`;
  `solve-equation-x-both-sides → solve-linear-2-step`. They share `solve-linear-2-step`
  as a common ancestor but there is no path `model → solve-equation-x-both-sides`.
- **Booklet trace:** Challenge Q2 `2x−10 = x+3`; Q3 `3x−4 = x+10`; Q9
  `6+x = 4x−18`; age problems Q21 `n+(n+3) = (n+25)−11`, Q23–Q27; "marbles/coins"
  Q33d `2x−5 = (x+5)+10`.

### 2. `model-word-problems-equations ← translate-expressions`  — RECOMMEND (slightly lower confidence)
- **Both Stage 4** (proximity ✓).
- **Distinctive:** translating the worded relationship into algebra ("the sum of
  two consecutive odd numbers is 32" → `x+(x+2)=32`) is the crux of modelling and
  the step students most often get wrong.
- **At-risk:** yes — setting up the correct equation/expression is the hardest part.
- **Non-redundant:** `translate-expressions → algebraic-notation`; no existing path
  from `model-word-problems-equations` reaches it.
- **Lift justification:** `model-word-problems-equations`'s blurb bundles "set up …
  from worded problems"; per the rubric a blurb merely mentioning the sub-step does
  NOT make the split redundant, and `translate-expressions` already exists as its
  own skill, so this is just an edge.
- **Booklet trace:** entire Challenge Exercise (Q1–Q14, Q33); plus "write a
  formula" tasks §2 Q9b `P=3a+3b`, Q10a `P=4l`, Q14a `W=800+150n`, Q19,
  Q22 (a–d), Q31 `m=3c−10`, Q34 `m=7c−52`.

## Borderline candidates considered → EXCLUDE

- **`model-word-problems-equations ← solve-linear-3-step`** — Challenge fraction
  problems (Q5 `x+x/3=20`, Q7 `x/2+10=x+4`) and several age problems need ≥3
  steps. EXCLUDE: `solve-linear-3-step` is **Stage 5**, but
  `model-word-problems-equations.stage = 4`; a prereq above the skill's own stage
  is structurally contradictory. The S4 component (`solve-equation-x-both-sides`,
  edge 1) carries the load; deeper 3-step work is reachable in the S5-core context
  via `solve-linear-3-step ← solve-equation-x-both-sides`.
- **`equations-from-formulas ← solve-linear-3-step` / `← solve-linear-algebraic-fraction`**
  — HSC items Q23 `C=5/9(F−32)` (find F), Q24 `C=A(y+1)/24` (find y) are ≥3-step
  with a fraction coefficient. EXCLUDE for the same stage contradiction
  (`equations-from-formulas.stage = 4`). *Observation, not an edge:*
  `equations-from-formulas` (S4, difficulty 2) is arguably under-specified for the
  S5-core slice of `dp-s5c-equa-3`, but fixing that means restructuring an existing
  skill's stage — out of scope for a booklet edge proposal.
- **`equations-from-formulas ← substitute-negative-numbers`** — EXCLUDE: §2's
  solve-for-unknown questions are almost all positive (negatives live in §1, where
  `substitute-negative-numbers` already owns the routine). Weak booklet trace.
- **New skill "write a formula with a designated subject"** (Q22 "make the first
  pronumeral the subject", Q9/Q17/Q19 perimeter formulas, Q31/Q34 exam-mark
  formulas) — EXCLUDE as a new skill: this is generating an algebraic
  relationship, i.e. `translate-expressions` (covered by edge 2). A separate skill
  would duplicate it.
- **New skill "decide: evaluate the subject vs. substitute-and-solve"** (the
  invisible Category atom distinguishing §1 from §2) — EXCLUDE: inherent to
  `substitute-into-expressions` vs `equations-from-formulas`; a standalone decision
  skill would be pollution.

## Considered and omitted (ambient / elementary / cross-topic / already-covered)

- **Evaluating powers/roots after substitution** (`½mv²`, `r³`, `√(a²+b²)`,
  `m=x/√y`) — cross-topic (indices/surds) and ambient by this stage; not grafted
  onto the substitution skill (no-cross-topic rule).
- **Rounding to n d.p.** (Q2h, Q15, BMI) — ambient, separate `round-decimals`
  skill; not distinctive to formulas.
- **Unit conversion inside a formula** (BMI cm→m Q6/Q9; m/s↔km/h Q26; seconds→min
  Q20) — cross-topic (measurement/rates) graft; omitted.
- **Order of operations / integer arithmetic during evaluation** — ambient;
  already prereqs of `substitute-into-expressions`.
- **Substituting negatives in §1** — already the dedicated existing skill
  `substitute-negative-numbers` (no new work).
- **Quadratic / square-root isolation** (`S=2πr²` find r; `V²=gR`) — covered by
  existing `quadratics-from-formulas` (`← solve-quadratic-ax2`).
- **Changing the subject before substituting** — not the booklet's method (it
  substitutes first, then solves); `change-subject-formula` (S5-path) is a
  different routine a stage up. Omitted.

## Net change to `data/skills.json`

- New skills: **0**
- New edges: **2** (both into `model-word-problems-equations`):
  `+ "solve-equation-x-both-sides"`, `+ "translate-expressions"`.
- No dot-point reattachments (the edited skill already carries `dp-s5c-equa-3`).
- Validated: JSON parses; both new prereq ids resolve to existing skills; both are
  strictly upstream of `model-word-problems-equations` (no cycle).
