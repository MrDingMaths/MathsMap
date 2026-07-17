# Proposal — Atomise Formulas and Equations (Stage 6 Standard Y11, topic `t-s6st11-formulas`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1148 skills). QUEUE.md row 46 → applied.

## Context

Queue row 46 — first Stage 6 group. One booklet: `Stage 6 Standard/Formulas and Equations.md` → **dp-s6st11-formulas-1**–**5**, MST-11-01.

## Finding (headline)

**No new skills, no new nodes needed.** The topic is a Standard-course re-application of skills the graph already held — 9 existing skills already tagged to these dot points (`substitute-into-expressions`, `calculate-speed-distance-time`, `stopping-distance`, `apply-bac-formulas`, `bac-time-to-zero`, `bac-limitations`, `medication-dosage-formulas`, `change-subject-formula`, `model-word-problems-equations`). The gap was **tagging, not structure**: three booklet sections re-teach Stage 4 skills that weren't surfaced on this topic, and one blurb undersold its routine.

## 1. New skills

None.

## 2. New prereq edges (2 edge swaps) — APPLIED

### `apply-bac-formulas`: prereq `substitute-into-expressions` → **`equations-from-formulas`**
### `medication-dosage-formulas`: prereq `substitute-into-expressions` → **`equations-from-formulas`**

**Trace:** both skills' booklet routines include the *reverse* direction as worked-example blocks, not extension: BAC — "An 80 kg male wants a BAC less than 0.05. How many drinks…" (solve $0.05 = (10N − 7.5(5))/6.8(80)$ for $N$); Medication — full section "**Use medication formulas find an unknown quantity**" (find adult dosage, child weight from Clark's, age from Young's).

**Bar:**
1. **Distinctive** — solve-after-substitution is the characteristic enabler of the reverse questions; plain substitution can't do them.
2. **At-risk** — Standard Y11 cohort demonstrably shaky on inverse-operations solving; that's why the booklet re-teaches it (§Solving for an Unknown after Substitution).
3. **Stage-proximity** — `equations-from-formulas` is stage 4 vs skill stage 6 (2 below); relies on distinctiveness override. The *previous* prereq `substitute-into-expressions` was also stage 4, so proximity is no worse than status quo.
4. **Non-redundant / transitive reduction** — swap, not add: `equations-from-formulas` already has `substitute-into-expressions` as its own prereq, so keeping the old edge alongside would violate rule 4. Old edge removed.

## 3. Edits to existing skills (4) — APPLIED

**a. `equations-from-formulas`** — re-taught as its own section (§Solving for an Unknown after Substitution: $720 = 45w$; $29 = 2x + 7$) and used by BAC/dosage reverses.
- courses: + `s6-std11`; dotPointIds: + `dp-s6st11-formulas-1`.

**b. `quadratics-from-formulas`** — §Using Formulas with Quadratic Equations ($A = 3x^2$ find $x$, $x = 25 − y^2$, $y = 3x^2 + 6$, ± both roots) is exactly the syllabus line "non-linear… limited to quadratics of the form $y = ax^2 + c$".
- courses: + `s6-std11`; dotPointIds: + `dp-s6st11-formulas-1`.

**c. `convert-time-decimal-sexagesimal`** — §Converting Units of Time re-teaches in full (DMS button, 2 h 37 min → 2.616 h and back) as enabler of speed/time answers ("7.875 hours = 7 h 52 min 30 s").
- courses: + `s6-std11`; dotPointIds: + `dp-s6st11-formulas-2`.

**d. `stopping-distance`** — blurb undersold the routine. Booklet requires computing both components: reaction distance = speed × reaction time (km/h → m/s conversion), braking distance from a given formula (e.g. $d = 0.01v^2$).

| | blurb |
|---|---|
| before | Use stopping distance = reaction distance + braking distance. |
| after | Calculate stopping distance = reaction distance + braking distance, finding reaction distance as speed × reaction time (converting km/h to m/s) and braking distance from a given formula. |

## 4. Borderline candidates → EXCLUDE

- **`convert-speed-units` (km/h ↔ m/s) as own node** — drilled as a sub-section, but an instance of existing `convert-rate-units` (already a prereq of `calculate-speed-distance-time`). Redundant.
- **`solve-formula-reverse-quadratic`** — instances of `quadratics-from-formulas` after tag edit (b).
- **Powers/roots subject change** ($r = \pm\sqrt{A/\pi}$, $M$ from $v = \sqrt{2GM/r}$) — **already rejected** as a separate node in the Equations C proposal; stays bundled in `change-subject-formula`. Not re-proposed.
- **Young's-formula reverse with subject-collecting** ($36 = 95y/(y+12)$ → $36y + 432 = 95y$) — hardest instance in the booklet; a one-off Mastery-grade variant of the dosage reverse, not a taught progression.

## 5. Considered-and-omitted

- Formula/subject vocabulary, 3-step ritual (write–substitute–solve) — ambient, folded into `substitute-into-expressions` / `equations-from-formulas`.
- Speed–distance–time triangle, multi-form use → `calculate-speed-distance-time` (already tagged).
- BAC interpretation, factors, zero-BAC time, limitations → `apply-bac-formulas`, `bac-time-to-zero`, `bac-limitations` (already tagged).
- Choosing Fried's vs Young's vs Clark's by age/weight — Category atom bundled in `medication-dosage-formulas` ("as appropriate").
- Word problems → linear equations → `model-word-problems-equations` (already tagged).
- One/two-step rearranging → `change-subject-formula` (already tagged, s6-std11 already present).
- Syllabus line "use a spreadsheet to perform calculations" — **no booklet content exists for it**; nothing to atomise. Flagged for future booklet revision.

## Net change

- 0 new skills
- 2 prereq edge swaps (`apply-bac-formulas`, `medication-dosage-formulas`: `substitute-into-expressions` → `equations-from-formulas`)
- 4 re-scopes (3 course/dot-point tags, 1 blurb)
