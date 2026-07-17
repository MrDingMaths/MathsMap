# Proposal — Atomise Probability A group (Core, topic `t-s5c-pro-a`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1148 skills). QUEUE.md row 44 → applied.

## Context

Queue row 44. Two Stage 5 Core booklets:

1. `Probability A 1_Describe multistage chance experiments involving independent and dependent events` → **dp-s5c-proa-1**
2. `Probability A 2_Solve problems for multistage chance experiments` → **dp-s5c-proa-2**

MA5-PRO-C-01. Goal: fill genuine gaps only; graph already carried 6 skills on this topic.

## Finding (headline)

Dense existing coverage: `independent-dependent-events`, `multistage-outcomes`, `probability-independent-events`, `probability-dependent-events`, `complementary-multistage`, `probability-simulations`. Booklet 1 → fully covered, nothing new. Booklet 2 exposed **two gaps**:

1. The booklet's largest section — **probability by counting outcomes in a table/tree** (sum-of-two-dice, HSC 2023/2011 table questions) — had no skill. `multistage-outcomes` only *records* outcomes; `probability-independent-events` is the *multiplication rule*. The count-favourable-cells routine fell between them.
2. The **fundamental counting principle** is taught here as a boxed rule with fill-in practice, but the graph's `multiplication-principle` was stranded at Stage 6 Ext 1 — same situation as the `expected-frequency` re-stage precedent (S4 Probability proposal).

## 1. Recommended new skills (1)

### `multistage-probability-by-counting`

| field | value |
|---|---|
| id | `multistage-probability-by-counting` |
| title | Calculate probabilities by counting multistage outcomes |
| blurb | Calculate probabilities for multistage experiments by counting equally likely outcomes in an array or tree diagram, including events in any order. |
| stage | 5 |
| courses | `s5-core`, `s6-std12` |
| dotPointIds | `dp-s5c-proa-2`, `dp-s6st12-probability-2` |
| difficulty | 2 |
| prereqs | `multistage-outcomes`, `theoretical-probability` |
| atom type | R (2-atom chain: enumerate sample space → favourable/total) |

```json
{
  "id": "multistage-probability-by-counting",
  "title": "Calculate probabilities by counting multistage outcomes",
  "blurb": "Calculate probabilities for multistage experiments by counting equally likely outcomes in an array or tree diagram, including events in any order.",
  "stage": 5,
  "courses": ["s5-core", "s6-std12"],
  "dotPointIds": ["dp-s5c-proa-2", "dp-s6st12-probability-2"],
  "prereqs": ["multistage-outcomes", "theoretical-probability"],
  "difficulty": 2
}
```

**Booklet trace** (Booklet 2):
- §List Outcomes using Tables — coin+die table then $P(head, 4) = 1/12$, $P(head\ and\ odd) = 1/4$; TREE-without-replacement example $P(EE)$; Foundation Q2 (two dice sum, $P(8)=5/36$); Development Q7; **2023 HSC** Q8 ($P(\ge 7) = 10/24$); **2011 HSC** Q9.
- §List Outcomes using Tree Diagrams — Investigation (3 coins: $P(HHT$ any order$)$); Foundation Q1 ($P(\text{one head one tail})=1/2$), Q2 (T/F test, $3/8$), Q5 (socks "in any order"); Development Q7–8 (marbles with/without replacement, all parts by counting); **2022 HSC** Q9a.
- Dot-point text itself splits the same way: proa-2 says *record* outcomes then *determine* probabilities; dp-s6st12-probability-2 = "use arrays, tree diagrams… for multistage events".

**Edge bar (skill inclusion + its 2 edges):**
1. **Distinctive** — counting favourable multistage outcomes (incl. "in any order" = multiple cells/paths) is the characteristic enabler of the table/tree question type; not ambient arithmetic. Both prereq edges are the two constituent atoms, nothing else.
2. **At-risk** — booklet Q3 (§Trees) targets the classic failure directly ("HT and TH are two ways, so 1/2 not 1/3"); students who can list outcomes still miscount favourables.
3. **Stage-proximity** — both prereqs stage 4–5, skill stage 5. ✓
4. **Non-redundant** — `theoretical-probability` is not reachable from `multistage-outcomes` (its chain runs through `sample-space`); no existing skill covers the combination.

## 2. Recommended new prereq edges (1)

### `multistage-outcomes ← multiplication-principle`

**Trace:** §List Outcomes using Tables opens with the boxed **Fundamental Counting Principle** ($p \times q$ ways); every table example asks "Does this match the fundamental counting principle?"; Investigation (3 coins): "…agrees with the fundamental counting principle, $2 \times 2 \times 2 = 8$"; Foundation Q2a "$6 \times 6 = 36$"; Check-your-understanding Q2–3 assess it bare (count outcomes of two spinners without listing).

**Bar:**
1. **Distinctive** — the completeness check ("have I found all outcomes?") is characteristic of the recording routine, and $p \times q$ is a named, separately-boxed fact.
2. **At-risk** — first met at this level; CYU Q2–3 show it assessed standalone and it's a known weak spot (students list 9 of 12 outcomes and stop).
3. **Stage-proximity** — holds after the re-stage below (both stage 5).
4. **Non-redundant** — `multiplication-principle` had no edges into anything below Ext 1; not reachable via any prereq of `multistage-outcomes`.

## 3. Edits to existing skills (1 re-stage)

**`multiplication-principle`** — first genuinely taught Stage 5 Core (this booklet), was Stage 6 Ext 1 only. Mirrors the `expected-frequency` 6→4 re-stage precedent.

| field | before | after |
|---|---|---|
| stage | `6` | `5` |
| courses | `["s6-ext1-11"]` | `["s5-core", "s6-ext1-11"]` |
| dotPointIds | `["dp-s6x1y11-combinatorics-1"]` | `["dp-s5c-proa-2", "dp-s6x1y11-combinatorics-1"]` |

Title/blurb unchanged ("count the number of ways a sequence of choices can be made" already fits the $p \times q$ form). Prereqs `[]` → monotonicity trivially holds; downstream Ext 1 dependents (`arrange-n-objects`) unaffected (5 ≤ 6).

## 4. Borderline candidates → EXCLUDE

- **`dependent-branch-probabilities`** (lift-out: adjust 2nd-stage probabilities after no replacement — the "what replaces the star" MCQs). It *is* separately assessed, but it is the entire substance of `probability-dependent-events`; lifting it would hollow the parent to a duplicate of the independent case. Keep bundled.
- **`label-probability-tree`** (lift-out from `probability-independent-events`) — same reasoning; steps 1–2 of the routine, only assessed as scaffolding within it.
- **Three-stage selections without replacement** (Mastery Q8–9, 2013 HSC Adv Q15) — harder instance of `probability-dependent-events`, same routine, not a progression split the booklet teaches separately.
- **Algebraic branch probabilities** ($x$ green, $y$ pink, Mastery Q7) — one-off/non-routine variant.

## 5. Considered-and-omitted

- Classify independent vs dependent, replacement effect, gambler's-fallacy items (Booklet 1 throughout; Booklet 2 Q15b, Q16b) → `independent-dependent-events`.
- Multiplication rule $P(A \text{ and } B)=P(A) \times P(B)$, incl. 3–4 events (§Multiplication Rule Q5) → `probability-independent-events`.
- "At least one" = $1 − P(\text{none})$ (§Complementary Events; Q11b, 2012 HSC) → `complementary-multistage`; identifying the complement itself → s4 `complement-of-event`.
- Expected wins over repeated games (2022 HSC Q9b: $30 \times 2/3$) → `expected-frequency` (already re-staged to 4 in the S4 Probability pass).
- dp-s5c-proa-3 (simulations) — no booklet in this group covers it; `probability-simulations` already sits on it. No action.

## Net change

- **1 new skill** (`multistage-probability-by-counting`, with 2 prereq edges)
- **1 new edge** (`multistage-outcomes ← multiplication-principle`)
- **1 re-scope** (`multiplication-principle` re-staged 6 → 5)
