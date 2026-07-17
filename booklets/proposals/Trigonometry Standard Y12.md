---
status: applied
---

# Proposal — Atomise Trigonometry (Stage 6 Standard Y12, topic `t-s6st12-trig`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (1 new skill, 2 new edges, 3 re-scopes); `npm run validate` clean. QUEUE.md row 57 → applied.

## Context

Queue row 57. One booklet: `Stage 6 Standard/Trigonometry.md` (MST-12-S2-04), covering `dp-s6st12-trig-1`–`5`. Goal: check the heavily Stage-5-fed skill set (14 skills already touch these dot points) against the booklet's 14 sections.

## Finding (headline)

Near-saturated — the Stage 5 Trig A/B/C passes did the structural work, and this booklet is largely their re-teach. **One genuine gap**: the area rule in **reverse** (given area, find side or included angle) has a taught worked example + Your Turn, drills in three sections, and two HSC questions — no skill carried it. Rest: two course-tag re-scopes (the two bearings skills were stuck at `s5-core`) and wiring `compass-radial-surveys` to its actual computational engine.

| Booklet section | dp | Skill |
|---|---|---|
| §Right-Angled Trig + §Solving Problems (sides, ratios, equations, denominator, angles, DMS, rounding, practical) | dp-1 | `trig-find-side` ✓ + `trig-find-angle` ✓ tagged; atoms reachable (row-50 capstone-tag policy) |
| §Angles of Elevation and Depression (identify + solve, mirrors Trig B B1) | dp-5 | `elevation-depression` ✓; `identify-elevation-depression` reachable |
| §Bearings (true/compass) | dp-5 | `bearings` ✓ |
| §Calculating Bearing Between Two Locations (full re-teach, same 244°/025° worked examples as Trig B) | dp-5 | `bearing-between-two-points` — tag §3a |
| §Problems Involving Bearings and Trigonometry (own 3-step method, F/D/M sets) | dp-5 | `bearings-problems` — tag §3b |
| §Sine Rule (sides + angles forms) / §Obtuse (180−θ) | dp-2 | `sine-rule`, `sine-rule-angles`, `sine-rule-obtuse` ✓ |
| §Cosine Rule (sides + rearranged angle form) | dp-3 | `cosine-rule`, `cosine-rule-angles` ✓ |
| §Area of a Triangle (direct + reverse worked example) | dp-4 | `area-rule-triangle` ✓ direct; reverse → new skill §1a |
| §Selecting an Appropriate Method (flowchart incl. right-angled branches) | dp-5 | `non-right-triangle-problems` ✓ |
| §Mixed Multistep / §Mixed Bearings (teaching-free composite sets) | dp-5 | EXCLUDE — Trig C rejections stand (§4) |
| §Radial Surveys (angles at centre → repeated area rule / cosine rule) | dp-5 | `compass-radial-surveys` — prereq edges + blurb (§2a/§3c) |

## 1. New skills (applied)

### a. `area-rule-reverse`

| Field | Value |
|---|---|
| id | `area-rule-reverse` |
| title | Find a side or angle from a triangle's area |
| blurb | Substitute a known area into $A = \tfrac{1}{2}ab\sin C$ and solve for an unknown side or the included angle. |
| stage | 6 · courses `["s6-std12"]` · dotPointIds `["dp-s6st12-trig-4"]` · difficulty 2 |
| prereqs | `["area-rule-triangle"]` |
| atom type | R (progression chain downstream of the direct form) |

**Trace:** §Area of a Triangle has a second titled worked example — "**Calculate side length of a triangle given area**" ($70 = \tfrac{1}{2}(11)x\sin 93°$, full division working shown) with Your Turn; Foundation Q3a–c, Development Q4a–b (find $θ$ given area 72 cm², nearest minute); §Selecting Dev Q7 (isosceles sides from area 35 cm²), Mastery Q9l (∠ACB from area 9.23 cm²); §Mixed Multistep Q5 (equilateral perimeter from area 600 cm²); §Radial Surveys Mastery Q10a (**2021 HSC**: ∠COB from area 466 m² via $\sin^{-1}$) and Q11 (**2019 HSC**: bearing via angle from area 198 km²).

**Bar:** (1) distinctive — the rearrangement (divide by $\tfrac{1}{2}ab$, then $\sin^{-1}$, or isolate the side) is the characteristic enabler, not ambient algebra at Standard level; (2) at-risk — two HSC questions hinge on it and the booklet gives it its own worked example rather than trusting transfer; (3) same stage; (4) non-redundant — progression-chain rule, downstream of `area-rule-triangle` (structural analogue of the sine/cosine sides→angles splits from the Trig C pass). Stage 6 = earliest genuine stage: the Stage 5 Trig C booklet never teaches the reverse direction.

## 2. New prereq edges (applied)

### a. `compass-radial-surveys ← area-rule-triangle` and `← cosine-rule`

**Trace:** §Radial Surveys teaches exactly two routines as numbered methods — **Calculating Area**: "1. Calculate all angles at the centre. 2. Use repeated applications of the sine rule for area $A = \frac{1}{2}ab\sin C$"; **Calculating Perimeter**: "2. Use the cosine rule $c = \sqrt{a^2+b^2-2ab\cos C}$". Every question F Q2–3, D Q4–7, M Q8–10 (2014/2013/2021 HSC) runs one or both.

**Bar:** distinctive — the two rules *are* the computational engine of the survey routine (the prior sole prereq `bearings` only covers reading the radial legs and computing centre angles); at-risk — repeated cosine-rule evaluation is the drilled risk at Standard level; stage 5→6 fine; non-redundant — neither reachable from `bearings`, and neither makes the other or `bearings` redundant.

## 3. Edits to existing skills (applied)

**a. `bearing-between-two-points` — tag re-scope.**
- courses: `["s5-core"]` → `["s5-core", "s6-std12"]`; dotPointIds: + `dp-s6st12-trig-5`
- Trace: §Calculating Bearing Between Two Locations — 11-page full re-teach (identical teaching points and 244°/025° worked examples to the Stage 5 Trig B source), own Foundation sets; terminal step of Mixed Bearings Q10d, Q12b, Q13c, Q14c, Q15c (2022/2023 HSC) and Radial Q11 (2019 HSC).

**b. `bearings-problems` — tag re-scope.**
- courses: `["s5-core"]` → `["s5-core", "s6-std12"]`; dotPointIds: + `dp-s6st12-trig-5`
- Trace: §Problems Involving Bearings and Trigonometry — own 3-step method box (compass rose at each point → right-angled triangle → trig), worked examples + F/D/M sets. Fixes an inversion: dp-5 tagged the atom `bearings` but not this capstone (row-50 policy).

**c. `compass-radial-surveys` — blurb widening.**
- Before: "Construct and interpret compass radial surveys and solve related problems."
- After: "Construct and interpret compass radial surveys, finding angles at the centre and the area and perimeter of the surveyed land."
- Why: the booklet's two named routines are precisely centre-angles → area / perimeter; "solve related problems" under-specified what is drilled and examined (3 HSC questions).

## 4. Borderline candidates → EXCLUDE

- **`bearings-non-right-triangle`** (§Mixed Trigonometry Problems Involving Bearings, F Q1–6, D Q7–9, M Q10–15 incl. three HSC) — **Trig C rejection stands**: teaching-free question set composing `non-right-triangle-problems` + `bearing-between-two-points` (both now tagged to dp-5). Do not re-propose.
- **`multistep-non-right-triangle`** (§Mixed Multistep — sectors, prism volume, two-position elevation, parallelogram) — **Trig C rejection stands**: teaching-free, most items graft cross-topic content.
- **`convert-decimal-sexagesimal` (angles)** (§Degrees Minutes Seconds re-teach) — **Trig A rejection stands**: routine lives in `convert-time-decimal-sexagesimal` + `round-angle-degrees-minutes`.
- **`identify-included-angle`** (§Area "Explain why NOT possible" drill, M Q7a) — **Trig C rejection stands**: absorbed in `area-rule-triangle`.
- **Vertical-offset elevation problems** (D Q10–11, M Q15–17: eye level, flagpole-on-building, two-depression-angles) — **Trig B exclusion stands**: still question-set only, no teaching section (the Trig B re-visit condition remains unmet).

## 5. Considered-and-omitted

- §Right-Angled Trig / §Solving Problems atoms (`define-trig-ratios`, `evaluate-trig-ratio`, `find-angle-from-ratio`, `trig-find-side-denominator`, `round-angle-degrees-minutes`, `identify-elevation-depression`) — reachable from tagged capstones; row-50 capstone-tag policy.
- §Constancy of the Trigonometric Ratios — Stage 5 dp-s5c-trga-1 recap; ambient.
- §Selecting an Appropriate Method's right-angled branches (trig ratio, Pythagoras alongside sine/cosine/area) — selection across right/non-right composes the two tagged capstones (`trig-practical-problems`, `non-right-triangle-problems`); no new node.
- "Longest side opposite largest angle" fact (§Sine Rule intro; §Selecting Q3/Q5 smallest/largest angle) — inside `cosine-rule-angles`/`sine-rule` scope.
- Radial centre-angle arithmetic incl. wrap-around ($360−320+74$, 2014 HSC Q8a) — inside `compass-radial-surveys` via its `bearings` prereq.
- Mixed Bearings Q3 speed/time parts — cross-topic (rates); scope rule, no edge.
- 2019 HSC Radial Q11 (bearing from area) — composite of new `area-rule-reverse` + `bearing-between-two-points`.

## Net change applied

- **+1 skill** (`area-rule-reverse`)
- **+2 edges** (`compass-radial-surveys ← area-rule-triangle`, `← cosine-rule`)
- **3 re-scopes:** `bearing-between-two-points` (tag), `bearings-problems` (tag), `compass-radial-surveys` (blurb)
