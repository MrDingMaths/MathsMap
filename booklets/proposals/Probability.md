# Proposal — Atomise Probability group (Booklets 1–2, topic `t-s4-pro`)

**Status: APPLIED 2026-07-15** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1092 skills). QUEUE.md row 7 → applied.

## Context

Queue-mode pass over the two Stage 4 *Probability* booklets:

1. `Probability 1_Determine probabilities for chance experiments` → **dp-s4-pro-1**
2. `Probability 2_Determine probabilities for complementary events` → **dp-s4-pro-2**

Topic `t-s4-pro`, MA4-PRO-C-01.

## Finding

Near-complete coverage; one stage correction. Every routine maps to existing skills except **expected frequency** (`f = np`), which Probability 1 teaches as a full Stage 4 section but whose skill (`expected-frequency`) was stranded at Stage 6 Standard. Fix = re-stage it to its earliest genuine stage (s4), not a new node.

Existing coverage: pro-1 `sample-space`, `theoretical-probability`, `probability-range`, `observed-probability` (+ s3 `equally-likely-outcomes`, `probability-as-fraction`, `probabilities-sum-to-one`, `probability-benchmark-equivalents`); pro-2 `complement-of-event`, `complementary-probability`.

## Applied — re-stage (1)

**`expected-frequency`** — first taught at Stage 4 (Probability 1 "Expected Frequency": `f = np`, coin/die/spinner worked examples), was stage 6 only.

| field | before | after |
|---|---|---|
| stage | `6` | `4` |
| courses | `["s6-std12"]` | `["s4", "s6-std12"]` |
| dotPointIds | `["dp-s6st12-probability-3"]` | `["dp-s4-pro-1", "dp-s6st12-probability-3"]` |
| blurb | `Calculate the expected frequency of an event using np.` | `Calculate the expected frequency of an event as number of trials × probability ($f = np$).` |

- prereqs unchanged (`["theoretical-probability"]`, stage 4 → stage-monotonic holds).
- **Trace:** Probability 1 "Expected Frequency" — formula `f = np`; worked example (coin 100× → 50 heads); guided (die 120 rolls → 20; spinner 20 spins → 8).
- Same skill as Stage 6's, surfaced at its true earliest stage — mirrors `theoretical-probability`, `sample-space`, `complementary-probability` already spanning s4 + s6.

## Borderline → EXCLUDE

- **`law-of-large-numbers`** (Probability 1) — conceptual observation tied to `observed-probability` / s3 `compare-observed-expected`.
- **`describe-likelihood-words`** (Probability 1 "Describing Probability") — `probability-range` + s3 `probability-benchmark-equivalents`.

## Considered and omitted (audit trail)

- Sample space; `P = favourable/total`; 0–1 range; probabilities sum to 1; theoretical vs observed — `sample-space`, `theoretical-probability`, `probability-range`, `observed-probability`.
- Complement; `P(event)+P(complement)=1`; "at least one" — `complement-of-event`, `complementary-probability`.
- Multistage / tree diagrams / independent events — Stage 5, out of scope.

## Net change

- 0 new skills, 0 new edges.
- 1 re-scope: `expected-frequency` re-staged 6 → 4.
