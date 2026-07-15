# Proposal — Atomise Ratios and Rates group (Booklets 1–5, topic `t-s4-rat`)

**Status: APPLIED 2026-07-15** — all recommendations below approved by the user and applied to `data/skills.json`; `npm run validate` clean (1083 skills). QUEUE.md row 1 → applied.

## Context

Queue-mode atomisation pass over the five Stage 4 *Ratios and Rates* booklets:

1. `Stage 4/Ratios and Rates 1_Recognise and simplify ratios.md` → **dp-s4-rat-1**
2. `Stage 4/Ratios and Rates 2_Solve problems involving ratios.md` → **dp-s4-rat-2**
3. `Stage 4/Ratios and Rates 3_Recognise and simplify rates.md` → **dp-s4-rat-3**
4. `Stage 4/Ratios and Rates 4_Solve problems involving rates.md` → **dp-s4-rat-4**
5. `Stage 4/Ratios and Rates 5_Interpret and construct distance–time graphs from authentic data.md` → **dp-s4-rat-5**

## Finding (headline)

The existing 13-skill `t-s4-rat` subgraph covers the spines well: `ratios-compare-quantities → ratio-part-as-fraction / simplify-ratios → unitary-method-ratios → divide-quantity-in-ratio → ratio-real-life-problems`, and `ratios-vs-rates → simplify-rates → {convert-rate-units, rate-problems}`, plus the three distance–time graph skills. **dp-s4-rat-3 (Booklet 3) is essentially fully covered — nil new skills.** Gaps concentrated in Booklets 1, 2, 4, 5.

## 1. New skills (8)

| id | title | stage | dotPoints | diff | prereqs |
|---|---|---|---|---|---|
| `equivalent-ratios` | Produce equivalent ratios | 4 | dp-s4-rat-1 | 2 | ratios-compare-quantities |
| `simplify-ratios-different-units` | Simplify ratios with different units | 4 | dp-s4-rat-1 | 2 | simplify-ratios |
| `simplify-ratios-fractions-decimals` | Simplify ratios involving fractions and decimals | 4 | dp-s4-rat-1 | 3 | simplify-ratios |
| `divide-ratio-given-difference` | Solve ratio problems given the difference between parts | 4 | dp-s4-rat-2 | 2 | divide-quantity-in-ratio |
| `best-buys` | Determine the best buy *(lift-out from `rate-problems`)* | 4 | dp-s4-rat-4, dp-s6st12-ratios-4 | 2 | simplify-rates |
| `related-rates-problems` | Solve problems involving related rates | 4 | dp-s4-rat-4 | 3 | rate-problems, convert-rate-units |
| `convert-time-decimal-sexagesimal` | Convert decimal hours ↔ h:min:s | 4 | dp-s4-rat-5 | 1 | time-as-decimals |
| `average-speed-journey` | Average speed over a whole journey | 4 | dp-s4-rat-5 | 2 | calculate-speed-distance-time |

Booklet traces (evidence): `equivalent-ratios` — B1 §Equivalent Ratios + B2 ratio-table sections. `simplify-ratios-different-units` — B1 worked example + Fred's 12 cm : 3 mm error, B2 Dev Q9. `simplify-ratios-fractions-decimals` — B1 dedicated section. `divide-ratio-given-difference` — B2 Sienna/Ava worked example + ~10 items. `best-buys` — B4 §Best Buys incl. 2019/2023 HSC Std 2, Mastery Q10 (direction misconception); explicit syllabus bullet. `related-rates-problems` — B4 §Related Rates, 3 worked examples, 12 Qs. `convert-time-decimal-sexagesimal` — B5 §Converting Units of Time, load-bearing in "nearest minute" speed Qs. `average-speed-journey` — B5 Dev Q5, Mastery Q9 (90/60 out-and-back trap), Q11.

Bar justification (per skill) — distinctive characteristic-enabler, at-risk misconception documented in the booklet, within stage-proximity, non-redundant by transitive reachability. `best-buys` is a legitimate lift-out (was only a blurb mention in `rate-problems`; mention ≠ reachability), mirroring the `solve-linear-2-step` de-bundling precedent. `simplify-ratios-{different-units, fractions-decimals}` are downstream progression-chain de-bundles of `simplify-ratios` (structural twins, split consistently).

## 2. Prereq re-wirings (2)

- `simplify-ratios` prereqs `[ratios-compare-quantities, hcf-two-numbers]` → `[equivalent-ratios, hcf-two-numbers]`. Simplifying is producing a particular equivalent ratio; keeping the old edge would violate transitive reduction (`equivalent-ratios → ratios-compare-quantities` already exists).
- `speed-from-distance-time` prereqs `[interpret-distance-time-graphs, rate-problems]` → `[interpret-distance-time-graphs, calculate-speed-distance-time]`. The s = d/t formula is the real enabler; `rate-problems` was a proxy.

## 3. Edits to existing skills (3)

- `ratio-part-as-fraction` blurb: "Identify one part of a ratio as a fraction of the total." → "Express one part of a ratio as a fraction of the whole or of another part, e.g. in $2:3$ the first part is $\tfrac{2}{5}$ of the total and $\tfrac{2}{3}$ of the second." (part-of-part was half the exercise load, outside old blurb).
- `rate-problems` blurb: "Solve real-life rate problems, including best buys." → "Solve real-life rate problems using equivalent rates, e.g. fuel use, typing speed, pay." (best-buy de-bundled to `best-buys`).
- `calculate-speed-distance-time`: stage 6 → 4; courses `[s6-std11]` → `[s4, s6-std11]`; dotPoints `[dp-s6st11-formulas-2]` → `[dp-s4-rat-5, dp-s6st11-formulas-2]`. B5 teaches all three rearrangements in full at Stage 4; earliest-genuine-stage. Both prereqs (`substitute-into-expressions`, `convert-rate-units`) are stage 4 — validates.

## 4. Borderline → EXCLUDE

- **`combined-work-rates`** (two painters / taps, add rates + reciprocate; B4 §Combined Rates). Distinctive + at-risk (Stephen's average-the-times misconception) but not a syllabus bullet, small section, enrichment genre, grafts fraction addition. Excluded — re-propose if coverage wanted (dp-s4-rat-4, prereq `[rate-problems]`, difficulty 3).
- **Scale drawings** (B2 §Finding Lengths) — already doubly represented (`ratio-real-life-problems` blurb names map scales; dedicated s5 `scale-drawings`).
- **$1:n$ form** (B1 Dev Q4, one exercise) — light variant of `equivalent-ratios`.
- **Ratio equations** ($2x:3=4:1$; B1 Mastery Q13, B2 algebraic-fractions) — ratio content is `equivalent-ratios`, rest is equation-solving (cross-topic).
- **Average rate of change from two readings** (B3 Mastery Q9–12) — mastery-tier only; formal skill at s6.
- **Split `convert-rate-units`** into one-/both-quantities — teaching scaffold of one coherent routine.

## 5. Considered-and-omitted

Representing ratios / three-term ratios (→ `ratios-compare-quantities`, `simplify-ratios`), unitary + dividing spine (→ existing), Olivia's fraction method (alt method), recipes/paint/prize contexts (→ `ratio-real-life-problems`), ratio-vs-rate vocab (Category bundle-out disfavoured per rejected `interpret-percentage-vocabulary`), simplify rates (→ `simplify-rates`), unit-conversion review (→ existing convert-* skills; ambient here), km/h↔m/s incl. ×3.6 (→ `convert-rate-units`' own example), D–T graph interpret/construct/segment-speed (→ existing three skills), evaporation-graph variant (→ s5 `variable-rate-distance-time`), unit-conversion prereq edges onto rate skills (measurement-topic, ambient).

## Net change (applied)

**+8 skills, +10 internal edges, +2 re-wirings, 3 edits.** Per dot point: rat-1 +3, rat-2 +1, rat-3 nil, rat-4 +2 (+1 edit), rat-5 +2 (+2 edits/re-wirings).
