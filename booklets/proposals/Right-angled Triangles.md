# Proposal — Atomise `Right-angled Triangles` booklet

Target booklet: `booklets/Right-angled Triangles.md` (Pythagoras' theorem).
Target dot points: **dp-s4-pyt-1** ("Identify and define Pythagoras' theorem")
and **dp-s4-pyt-2** ("Examine problems involving Pythagoras' theorem"),
topic `t-s4-pyt` (Stage 4).

## Existing graph already covers most of the booklet
Current cluster on these dot points (skills.json:282–286):

| skill | covers booklet section |
|---|---|
| `hypotenuse` | "The Hypotenuse" (identify longest side opposite right angle) |
| `pythagoras-theorem-statement` ← hypotenuse | "Pythagoras' Theorem" (write `a²+b²=c²` for a triangle) |
| `pythagoras-find-side` ← statement, `square-cube-roots`, `solve-quadratic-ax2` | "Calculating the Length of the Hypotenuse" |
| `converse-pythagoras` ← find-side | "Prove a Triangle is Right-Angled"; also "test whether 3 numbers form a triad" (same `a²+b²` vs `c²` computation) |
| `pythagoras-problems` ← find-side | "Solving Problems using Right-Angled Triangles" (single application; blurb already names triad identification) |

Gaps: (1) the *shorter-side* variant (subtract, not add), (2) the *multistep*
variant (apply twice, keep exact intermediate). No existing edges are missing.

## NEW skills (2) — APPROVED

### 1. `pythagoras-find-shorter-side`
- **title:** Find a shorter side using Pythagoras' theorem
- **blurb:** Rearrange `a² + b² = h²` to `a² = h² − b²` to find a shorter side, identifying the hypotenuse correctly.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-pyt-2"]` · **difficulty:** 2
- **prereqs:** `["pythagoras-find-side"]`
- **atom type:** Routine (distinctive Transformation sub-step: the subtract rearrangement)
- **booklet trace:** "Calculating the Length of a Shorter Side" — Example (`y² + 8² = 26² → y² = 612`), Guided Practice, Foundation Q1; at-risk error explicit in **Q2** ("He substituted incorrectly. The hypotenuse is 13").
- **bar:** Distinctive sub-step (the `h² − b²` sign rewrite + identifying the hypotenuse) lifted out of the coarse `pythagoras-find-side`, whose blurb nominally bundles "an unknown side" but only ever demonstrates the add-then-root case. Not redundant — the subtraction case is not otherwise reachable. At-risk: students routinely add instead of subtract / mis-assign the hypotenuse.

### 2. `pythagoras-multistep`
- **title:** Solve multistep Pythagoras problems
- **blurb:** Apply Pythagoras' theorem twice — find an intermediate side, then the final side — keeping the intermediate value exact until the last step.
- **stage:** 4 · **courses:** `["s4"]` · **dotPointIds:** `["dp-s4-pyt-2"]` · **difficulty:** 3
- **prereqs:** `["pythagoras-problems", "pythagoras-find-shorter-side"]`
- **atom type:** Routine (chain of 2 applications + a distinctive "don't round the intermediate" decision)
- **booklet trace:** "Solving Multistep Problems with Right-Angled Triangles" — Example (`y=√52`, then `x=√(12²+(√52)²)=14`), Guided Practice a–d, Foundation Q13, Q19; not-rounding sub-skill explicit in **Q10c/d**.
- **bar:** Distinct routine the booklet separates from single-application problems; the "carry the exact intermediate" decision is the characteristic at-risk enabler and lives nowhere else. Prereqs `pythagoras-problems` and `pythagoras-find-shorter-side` are mutually unreachable → no transitive redundancy.

## New prereq EDGES to existing skills
**None.** Existing edges are complete; the two new skills carry their own.

## Borderline candidates → EXCLUDED
- **`generate-pythagorean-triads`** (scale a known triad by ×/÷). Real booklet weight ("Generating Pythagorean Triads" Example, Guided Practice a–c, Foundation Q2) but gates nothing and is low at-risk proportional scaling. Excluded for leanness.
- **"Choose which formula / which side is unknown"** ("Choosing an Appropriate Strategy"; "Identify which formula to use"). Intrinsic to `pythagoras-find-shorter-side` — absorbed into skill 1.
- **"Leave in exact / surd form" at Stage 4** — covered by the `square-cube-roots` prereq of `pythagoras-find-side`; the Stage-5 surd strand must not wire in as a Stage-4 prereq.

## Considered and omitted (ambient / elementary / already-covered)
- Identify hypotenuse → `hypotenuse`. Write `a²+b²=c²` → `pythagoras-theorem-statement`.
- Prove right-angled / test 3 numbers for triad → `converse-pythagoras`.
- Find the hypotenuse (add-then-root) → `pythagoras-find-side`.
- Single-application worded problems (ladder, kite, gate, triangle height) → `pythagoras-problems`.
- Square numbers / roots review → `square-cube-roots`.
- Triad formula `b=½(a²−1)`, `c=½(a²+1)`; Q12/Q26 setting up `x²+(2x)²=…` and solving → non-routine + cross-topic (algebra); no algebra prereq added per the no-cross-topic rule.
- Perimeter/area composites, arc-length, equilateral height, spiral, HSC band-4/5 items → non-routine "mastery" extensions or other topics (area already has `area-using-pythagoras`).

## Net change applied
- **+2 skills:** `pythagoras-find-shorter-side`, `pythagoras-multistep`
- **+0 edges to existing skills**
- Both attach to **dp-s4-pyt-2**, Stage 4, `["s4"]`.
