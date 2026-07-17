---
status: applied
---

# Proposal — Atomise Relative Frequency and Probability (Stage 6 Standard Y12, topic `t-s6st12-probability`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (0 new skills, 0 new edges, 2 re-scopes); `npm run validate` clean. QUEUE.md row 62 → applied.

## Context

Queue row 62. One booklet: `Stage 6 Standard/Relative Frequency and Probability.md` (MST-12-S2-09), dp-1–4. Eight skills already tagged to these dot points (dual-tagged from Stage 4 Probability and Stage 5 Probability A/B passes).

## Finding (headline)

Heavily pre-tagged and near-saturated. No new skills. Two skills the booklet teaches in full are stuck at `s5-core` and need the Standard-Y12 tag: dependent-event probability trees (without replacement) and the "at least one = 1 − P(none)" complement routine. Everything else — sample space, theoretical probability, complements, arrays/tree diagrams, the independent multiplication rule, relative/expected frequency, Venn/two-way tables — is already tagged.

| Booklet section | dp | Skill |
|---|---|---|
| §Outcomes and Sample Space, §Calculating Probability, §Describing Probability | dp-1 | `sample-space`, `theoretical-probability` ✓ |
| §Complementary Events, §Using the Complement | dp-1 | `complementary-probability` ✓ |
| §Expected Frequency (f = np) | dp-3 | `expected-frequency` ✓ |
| §Relative Frequency, §Law of Large Numbers | dp-3 | `observed-probability` ✓ |
| §List Outcomes using Tables / Tree Diagrams | dp-2 | `multistage-outcomes`, `multistage-probability-by-counting` ✓ |
| §Probability Trees with Independent Events, §Multiplication Rule | dp-2 | `probability-independent-events` ✓ |
| §Complementary Events in Multistage / §At Least One | dp-2 | `complementary-multistage` — tag §3a |
| §Probability Trees with Dependent Events | dp-2 | `probability-dependent-events` — tag §3b |
| §Interpreting / Constructing Venn Diagrams and Two-Way Tables | dp-4 | `venn-diagrams-two-way-tables` ✓ |

## 1. New skills

None.

## 2. New prereq edges

None. The independent/dependent tree routines already carry their prereqs (`multistage-outcomes`, `independent-dependent-events`, `complementary-probability`); the two tagged skills need no new edges at Standard.

## 3. Edits to existing skills (applied)

**a. `complementary-multistage` — tag re-scope.**
- courses: `["s5-core"]` → `["s5-core", "s6-std12"]`; dotPointIds: + `dp-s6st12-probability-2`
- Trace: §Complementary Events in Multistage Probability + §At Least One — "the complement of 'at least one' is 'none'", $P(\text{at least 1}) = 1 - P(\text{none})$ box, identify-the-complement grid, F Q1–2; re-used as the "at least one" step in every probability-tree worked example (independent: $1 - P(BB)$; dependent: $1 - P(B,B)$).

**b. `probability-dependent-events` — tag re-scope.**
- courses: `["s5-core"]` → `["s5-core", "s6-std12"]`; dotPointIds: + `dp-s6st12-probability-2`
- Trace: §Probability Trees with Dependent Events — own 4-step method box ("probability of the second event depends on the first"), worked example (3 red 5 blue without replacement, second branch $\tfrac{2}{7}$, "any order" + "at least one" parts), Your Turn (2 black 7 white, a–d); §Independent and Dependent Events sets up with-/without-replacement. dp-2 text ("probability trees for multistage events") covers dependent trees; skill was s5-only.

## 4. Borderline candidates → EXCLUDE

- **`probability-tree-weighted` as its own skill** — the weighted-branch tree (independent) is `probability-independent-events` rendered as a tree, with "in any order" = add mutually-exclusive path products and "at least one" = `complementary-multistage`. Composition of tagged skills.
- **`law-of-large-numbers`** (§Law of Large Numbers + two MC). Concept backing why relative frequency estimates probability — already the content of `observed-probability`; not a separable assessable routine at Standard.
- **`mutually-exclusive-events`** (§Interpreting Venn Diagrams opening classification). Category/vocabulary atom (bundle-out disfavoured); overlap reading sits inside `venn-diagrams-two-way-tables`. No formal $P(A\cup B)$ addition rule at Standard here.
- **`describe-chance-words`** (§Describing Probability impossible…certain). Category vocabulary; not separable.
- **`fundamental-counting-principle`** (§List Outcomes, $p×q$). Already `multiplication-principle`, reachable via `multistage-outcomes`; used only as an outcome-count check.

## 5. Considered-and-omitted

- Sample-space listing, equally-likely judgments → `sample-space`.
- $P = \tfrac{\text{favourable}}{\text{total}}$, sum-to-1 → `theoretical-probability`.
- Complement identification, $P(E') = 1 - P(E)$ → `complement-of-event`/`complementary-probability`.
- Two-way/array outcome listing (incl. TREE-without-replacement grid) → `multistage-outcomes`.
- Independent multiplication die-and-spinner → `probability-independent-events`.
- Relative ↔ expected frequency conversion → `observed-probability` + `expected-frequency`.
- Venn/two-way construction ("fill what you know, subtract the rest") and all read-offs → `venn-diagrams-two-way-tables`.
- "Statistics shaping media/government decisions" syllabus bullet — no booklet content; ambient.

## Net change applied

- **0 new skills**
- **0 new edges**
- **2 re-scopes:** `complementary-multistage` (tag +s6-std12/+dp-probability-2), `probability-dependent-events` (tag +s6-std12/+dp-probability-2)
