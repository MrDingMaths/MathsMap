---
status: applied
---

# Proposal — Atomise Ratios and Rates (Stage 6 Standard Y12, topic `t-s6st12-ratios`)

**Status: APPLIED 2026-07-17** — re-scopes approved and applied to `data/skills.json` (0 new skills, 0 new edges, 4 re-scopes); proposed new skill `heart-rate-calculations` **REJECTED by the user** — do not re-propose. `npm run validate` clean. QUEUE.md row 58 → applied.

## Context

Queue row 58. Two booklets: `Stage 6 Standard/Ratios and Rates 1_Ratios.md`, `Ratios and Rates 2_Rates.md` (MST-12-S2-05), covering `dp-s6st12-ratios-1`–`5`. Goal: check coverage against a subgraph the Stage 4 Ratios pass (row 1) already built and heavily dual-tagged.

## Finding (headline)

Near-saturated — the row-1 Stage 4 pass pre-tagged the spine onto these dot points (`simplify-ratios`, `divide-quantity-in-ratio`, `ratio-real-life-problems`, `capture-recapture`, `scale-drawings`, `area-from-scale`, `rainfall-volume`, `ratios-vs-rates`, `simplify-rates`, `convert-rate-units`, `rate-problems`, `best-buys`, `interpret-distance-time-graphs`, `fuel-consumption`, `energy-kilowatt-hours`), and both booklets are largely re-teaches of it. Pass yielded three course-tag re-scopes (Y12-re-taught sections whose skills were stuck at `s4`) and one blurb widening. The single new-skill candidate (heart rates) was rejected at review.

| Booklet section | dp | Skill |
|---|---|---|
| B1 §Representing/§Fractions/§Equivalent/§Simplifying (×3)/§Unitary/§Dividing | dp-1 | capstones `simplify-ratios`, `divide-quantity-in-ratio`, `ratio-real-life-problems` ✓ tagged; feeder atoms reachable — except `ratio-part-as-fraction` → tag §3c |
| B1 §Capture-Recapture (incl. 4 HSC Qs) | dp-2 | `capture-recapture` ✓ |
| B1 §Scale Drawings (×5 sections) | dp-2 | `scale-drawings` ✓; `scale-factor` reachable as its prereq |
| B1 §Volume of Rainfall + trapezoidal-rule HSC Qs | dp-3 | `rainfall-volume`, `area-from-scale` ✓ |
| B2 §Intro/§Simplifying/§Converting (×2)/§Best Buys/§Rates Problems | dp-4 | `ratios-vs-rates`, `simplify-rates`, `convert-rate-units`, `rate-problems`, `best-buys` ✓ |
| B2 §Heart Rates | dp-4 | proposed `heart-rate-calculations` — **REJECTED** (§1) |
| B2 §Related Rates (drip rates) | dp-4 | `related-rates-problems` — tag §3b |
| B2 §Interpreting D–T Graphs | dp-5 | `interpret-distance-time-graphs` ✓ |
| B2 §Calculating Speed in D–T Graphs | dp-5 | `speed-from-distance-time` — tag §3a |
| B2 §Fuel Consumption | dp-5 | `fuel-consumption` ✓ — blurb widening §3d |
| B2 §Units of Energy/§Energy Cost | dp-5 | `energy-kilowatt-hours` ✓ |

## 1. New skills — NONE (1 proposed, rejected)

### a. `heart-rate-calculations` — REJECTED at review

Proposed as: "Calculate maximum and target heart rates" — apply $\text{max heart rate} = 220 - \text{age}$, find $50\%$–$85\%$ target range, total beats over a timed session; stage 6, `s6-std12`, `dp-s6st12-ratios-4`, difficulty 2, prereq `rate-problems`; `stopping-distance`/`medication-dosage-formulas` genre.

**Trace was:** B2 §Heart Rates — three taught sub-sections with worked examples + Your Turns, Foundation Q1–4, Development Q5 (target HR × session minutes → total beats), Q6 = 2022 HSC Std 2 Band 3.

**User rejected the skill.** Heart-rate content stays covered implicitly: bpm conversions are `rate-problems`/`simplify-rates` instances; max-HR substitution and percentage band remain unrecorded. A rejection is a decision — do not re-propose.

## 2. New prereq edges — NONE

`heart-rate-calculations ← rate-problems` died with the skill. `percentage-of-quantity` had already been dropped at proposal time (universally exercised across Standard; fails the at-risk test).

## 3. Edits to existing skills (4, applied)

**a. `speed-from-distance-time` — tag re-scope.**
- courses: `["s4"]` → `["s4", "s6-std12"]`; dotPointIds: + `dp-s6st12-ratios-5`
- Trace: B2 §Calculating Speed in Distance-Time Graphs — full re-taught section (Bella bushwalk worked example, leg speeds via $s = d/t$), practice Qa–d. dp-5's text ("solve problems related to speed, distance and time" from D–T graphs) names exactly this routine; previously only the atom `interpret-distance-time-graphs` carried the dp — same inversion fixed for `bearings-problems` in row 57.

**b. `related-rates-problems` — tag re-scope.**
- courses: `["s4"]` → `["s4", "s6-std12"]`; dotPointIds: + `dp-s6st12-ratios-4`
- Trace: B2 §Related Rates — full section: related-rate equation method box, two drip-rate worked examples (75 drops/min; 600 min reverse), Foundation Q1–2, Development Q3–10. Nursing drip rates are a Standard staple; skill was s4-only.

**c. `ratio-part-as-fraction` — tag re-scope.**
- courses: `["s4"]` → `["s4", "s6-std12"]`; dotPointIds: + `dp-s6st12-ratios-1`
- Trace: B1 §Ratios as Fractions — full re-taught section (part:part vs part:whole fractions, worked example + Qa–c); syllabus bullet "recognise ratios and explain their relationship with fractions"; load-bearing in §Capture-Recapture's $\frac{tagged}{total}$ set-up. Not reachable from any tagged capstone (sibling of `ratios-compare-quantities`), so the capstone policy didn't cover it.

**d. `fuel-consumption` — blurb widening.**
- Before: "Compare the efficiency of vehicles using fuel consumption rates."
- After: "Calculate fuel consumption rates in km/L and L/100 km, and use them to find fuel used, distance travelled and fuel cost."
- Why: the booklet's three named routines (rate in both forms; fuel-for-distance; distance-from-fuel, reciprocal step) plus cost chains are what's drilled — F Q1–6, D Q7–14 and Mastery incl. six HSC questions (2014×2/2016/2017/2018 + Tesla comparison). "Compare efficiency" under-specified all of it.

## 4. Borderline candidates → EXCLUDE

- **`heart-rate-calculations`** — rejected at review (§1a); the standing rejection for this group.
- **`average-speed-journey` tag** — appears only as B2 §Calculating Speed Qd (Ben's whole-journey average, one sub-question), no Y12 teaching. Thin trace; skill stays s4-only. Re-visit if a future Standard booklet teaches it.
- **Tiered gas-bill (MJ) problems** (B2 §Energy Cost Mastery Q16) — single mastery question; MJ tiered charging grafts tiered-table reading (Earning Money genre) onto energy costs. Not routine here.
- **`watts-kilowatts-conversion` split** — trivial ÷1000 transformation, already named inside `energy-kilowatt-hours`'s blurb; lift-out would be grain-too-fine.
- **Capture-recapture over/underestimate reasoning** (B1 Q7a–c) — evaluation variant of the same assumption, inside `capture-recapture` scope.
- **Floor-plan symbols / counting features** (B1 Mastery Q7, 2019 HSC "how many windows") — plan-reading conventions inside `scale-drawings` ("maps and plans"); Category-vocabulary bundle-out disfavoured per the `interpret-percentage-vocabulary` rejection.
- **Scale-drawing sub-routine splits** (find original / find image / measure-then-calculate Parts 1–2) — one routine family under `scale-drawings` + prereq `scale-factor`; splitting = scaffold, not atoms.

## 5. Considered-and-omitted

- B1 feeder atoms (`ratios-compare-quantities`, `equivalent-ratios`, `simplify-ratios-different-units`, `simplify-ratios-fractions-decimals`, `unitary-method-ratios`, `divide-ratio-given-difference`) — all exist at s4 and are reachable from the tagged dp-1 capstones; row-50 capstone-tag policy.
- `scale-factor` (B1 §Calculating Scale Factor) — reachable as `scale-drawings`' prereq; no tag.
- `trapezoidal-rule` — reachable via `area-from-scale`; no tag.
- Rainfall unit conversions ($1$ m³ $=$ $1$ kL etc.) — inside `rainfall-volume`.
- Drip-rate reverse direction (time from drops/min) — the second worked example of `related-rates-problems`' own routine.
- Resting-heart-rate table lookup (B1 F Q1) — table reading, ambient.
- D–T graph construction — `construct-distance-time-graphs` stays s4; the Y12 booklet only interprets.
- B2 heart-rate bpm-from-count conversions — instances of `rate-problems`/`simplify-rates`.

## Net change applied

- **0 new skills** (`heart-rate-calculations` rejected)
- **0 new edges**
- **4 re-scopes:** `speed-from-distance-time` (tag), `related-rates-problems` (tag), `ratio-part-as-fraction` (tag), `fuel-consumption` (blurb)
