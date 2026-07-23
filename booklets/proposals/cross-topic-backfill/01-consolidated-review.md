# Consolidated review — cross-topic backfill

**Status: APPLIED 2026-07-23** — 89 edges across 78 skills written to `data/skills.json`;
amendment landed in `docs/atomisation-principles.md`. Read with
[`00-policy-amendment.md`](00-policy-amendment.md), which this round depends on.

## Outcome of the decision queue

| item | proposed | final call | result |
|---|---|---|---|
| 1 — 3 rejects (wrong redundancy bar) | overturn | **reject stands** | Checked against real `prereqs`: all 3 redundant/ambient at *skill* level, not just topic level. GM-A→Linear and Int→Linear reach their targets via legit multi-hop chains (direct edge = bar-4 violation); AlgTechA→EquationsA has no constitutive S5 edge. No edges added. |
| 2 — `evaluate-index-notation → area-of-circle` | drop | **keep** | Edge retained. |
| 3a — Further Calculus Skills sources | confirm typo | **typo confirmed** | Sources belong to Further *Applications* of Calculus; 3 rejects stand. |
| 3b — Algebraic Relationships ← Lin/Non-lin C | confirm | **reject** | Holds on content/direction grounds (backward + non-constitutive), not the tagging argument (Standard students can meet `s5-path` content in Yr 10). |
| 4 — weaker-evidence accepts | accept | **accepted** | Applied. |
| 5 — `graph-log-functions` wiring | fix | **fixed** | `exponential-transformations` added (sibling kept — add, not replace). |

Net: **89 edges applied** (the 75 accepted pairs), the D1 pairs excluded. `npm run validate`
clean; no cycle, no stage inversion; trigger case and all flagged zero-path pairs now direct.

## Scope

111 expected topic→topic prerequisite pairs, 64 target topics, split across eight packs
(`A`–`H`) and proposed independently. Baseline: **0 of 111** existed as direct edges.

| | count |
|---|---|
| pairs examined | 111 |
| accepted | 75 |
| rejected | 36 |
| skills modified | 78 |
| skill-level edges added | 89 |

## Verification of the merged patch

Ran against `data/skills.json` with all eight patches applied in memory:

- every skill id and prereq id exists ✓
- every "current prereqs" column matches the real array — no stale/hallucinated baselines ✓
- no prereq at a higher stage than its dependent (no stage inversion) ✓
- no duplicate edges across packs ✓
- no already-present prereqs re-added ✓
- **no cycles** in the full 1189-skill graph after applying ✓
- 75/111 pairs become direct edges; the 36 that don't are exactly the 36 documented
  rejects — no silent drops ✓

## Decision queue — needs your call before applying

### 1. Rejects that used the wrong redundancy bar (recommend: overturn)

Three rejects applied non-redundancy at *topic* level rather than *skill* level, which is
broader than the amendment specifies and leaves pairs you explicitly asked for unfilled:

| pair | pack | reject reason given | why it's questionable |
|---|---|---|---|
| Geometric measure A → Linear relationships | B | 2-hop topic path GM-A→GM-B→Lin | a 2-hop path through a *different* topic is not the direct dependency you listed |
| Computation with integers → Linear relationships | B | 2-hop path Int→Alg→Lin | same |
| Algebraic techniques A → Equations A | C | `solve-linear-3-step → solve-linear-2-step → expand-brackets` | that chain resolves to **S4** Algebraic techniques, not **S5** Algebraic techniques A — the pair you asked for still won't appear |

### 2. Weakest accepted edge (recommend: drop)

`evaluate-index-notation` → `area-of-circle` (pack A). Squaring *r* is arguably ambient
arithmetic, failing bar 1 (Distinctive). Kept only because the pack expected an
Indices→Area link and nothing stronger surfaced. Dropping it costs one expected pair.

### 3. Possible errors in the source list (recommend: you confirm)

- **Further Calculus Skills ← Area and Surface Area B; Volume B; Polynomials.** All three
  rejected. Those sources fit **Further *Applications* of Calculus** (related rates,
  volumes of revolution) — which is a separate row in your list. Suspected typo.
- **Algebraic Relationships (Standard 2) ← Linear/Non-linear Relationships C.** Both
  rejected on a structural finding: every skill in those two topics is tagged `s5-path`
  only, never `s6-std12`. Standard 2 students never study that content, so the pairing
  looks like strand-name similarity rather than a real dependency.

### 4. Weaker-evidence accepts (recommend: accept, but know the basis)

- Extension 2 targets (`t-s6x2-vectors`, `t-s6x2-proof`) have **no authored booklets** —
  those calls rest on syllabus reasoning alone.
- Two Ext-1 edges lean on a 2-stage gap (stage 4 → 6) via the stage-proximity relaxation.
- `Data analysis A/B → Data analysis C`: no booklet exists for the capstone skill; the
  blurb mentions only "visualisations", not summary stats or bivariate methods.
- `linear-real-life` (D) and `surface-area-prism` (C) each take two new prereqs.
  `unknown-angles-point` / `unknown-angles-parallel` (A) take six between them across
  three source pairs — individually evidenced, worth an eyeball on the total.

### 5. Unrelated bug found in passing (recommend: fix with this batch)

`graph-log-functions` is wired to a **different-course sibling** of
`exponential-transformations` rather than the real one (pack E). Pre-existing defect,
independent of this backfill.

## Rejects that look correct and need no review

`Additive relations B → Computation with integers` (decimal/word-problem arithmetic vs
signed-integer rules — genuine domain mismatch, leaves that target with no new in-edges);
`Properties of geometrical figures C → Further work with vectors` and both
`The Nature of Proof` pairs (grafted context — the amendment's retained exclusion);
`Ratios and rates → Linear relationships A` (gradient's "simplify the fraction" step is
ambient); the Geo-B measurement pairs (booklets always *give* SA/volume, never compute it).

## Apply order, once decisions are made

1. Amend `docs/atomisation-principles.md` per `00-policy-amendment.md`.
2. Apply the eight patch tables to `data/skills.json`.
3. `npm run validate`.
4. Re-run the topic-pair audit; confirm the accepted set is direct and the reject set is
   the only remainder.
5. Load the Map view and confirm dagre still ranks (new cross-course edges render as
   `cross-course`).
