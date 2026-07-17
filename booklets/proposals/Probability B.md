# Proposal — Atomise Probability B group (Path, topic `t-s5p-pro-b`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json`; `npm run validate` clean (1148 skills). QUEUE.md row 45 → applied.

## Context

Queue row 45. Three Stage 5 Path booklets:

1. `Probability B_1 Solve problems involving Venn diagrams and 2-way tables` → **dp-s5p-pro-b-1**
2. `Probability B_2 Use the language, 'if … then', 'given', 'of' and 'knowing that', to examine conditional statements…` → **dp-s5p-pro-b-2**
3. `Probability B_3 Describe mutually and non-mutually exclusive events using specific language and calculate related probabilities` → **dp-s5p-pro-b-3**

MA5-PRO-P-01.

## Finding (headline)

**No new skills or edges.** Five existing skills were authored directly from these dot points and cover every routine: `venn-diagrams-two-way-tables` (interpret/construct/convert, incl. subtraction-fill), `set-notation-events` ($\overline{A}$, $A \cap B$, $A \cup B$, shading, listing elements), `conditional-probability` (reduced sample space, $P(A|B) = P(A \cap B)/P(B)$, 'given'/'of'/'knowing that' from Venn + 2-way tables), `mutually-exclusive-events` (classify, inclusive/exclusive or language), `compound-event-probability` (probability from Venn/2-way regions). One under-scoped blurb fixed.

## 1–2. New skills / edges

None.

## 3. Edits to existing skills (1 blurb re-scope)

**`compound-event-probability`** — blurb omitted the inclusive/exclusive 'or' calculation, the single most-drilled routine in B_3 (§Compound Events worked example "$P(red\ or\ ace,\ NOT\ BOTH)$"; Foundation Q2k; Development Q3d, Q4; §Venn Q5d, Q8e "or both / but not both" throughout). `mutually-exclusive-events` only covers *describing* the language, not calculating.

| | blurb |
|---|---|
| before | Use Venn diagrams and 2-way tables to find probabilities of compound events, using 'at least', 'at most', 'not' and 'and'. |
| after | Use Venn diagrams and 2-way tables to find probabilities of compound events, using 'at least', 'at most', 'not', 'and', and inclusive/exclusive 'or'. |

No structural change — nominal scope already implied by dp-s5p-pro-b-3 text ("*inclusive or* and *exclusive or*… calculate related probabilities").

## 4. Borderline candidates → EXCLUDE

- **`conditional-probability-rearrange`** ($P(A \cap B) = P(B|A) \times P(A)$; B_2 Dev Q10) — forward/backward use of the same taught formula, a Transformation step inside `conditional-probability`'s routine; only 1 question block traces it. The full product-rule treatment belongs to Stage 6 Adv (dp-s6adv11-probdata-4), audit at QUEUE row 70.
- **Re-stage `probability-complement-addition` (6 → 5)** — B_1 Dev Q7 computes $P(A \cup B)$ from $P(A)$, $P(B)$, $P(A \cap B)$, but via Venn-region filling (scaffold diagrams supplied), never the addition-rule formula. The formula is genuinely first taught in Stage 6 Adv. No re-stage — contrast with the FCP case (row 44 / Probability A proposal), where the rule itself was boxed and drilled.
- **Three-set Venn regions** (B_1 §Set Notation Q13–14: $(A \cap B) \cup C$; three-language diagram) — extension instances beyond the two-attribute dot-point scope; Stage 6 Adv `set-notation-fundamentals` territory.
- **De Morgan investigation** (B_1 Q12: $\overline{A \cup B} = \overline{A} \cap \overline{B}$?) — one-off investigation, not a routine.
- **VCE algebra question** (B_2 Q16: $P(A)$ in terms of $p$) — non-routine/competition-style, out of scope per rubric.

## 5. Considered-and-omitted

- Deck-of-cards structure (B_3 opener) — ambient fact, folded into any card-based probability question.
- Interpret Venn/2-way counts, 'only', 'neither' (B_1 §Interpreting; B_3 §Venn Q2–4, Q6–8) → `venn-diagrams-two-way-tables`.
- Construct from partial info incl. algebraic cells, HSC error-spotting (B_1 §Constructing Q7g, Q14–18) → same skill, harder instances.
- Probability from Venn/2-way incl. HSC Standard 2014/2016/2010/2004 → `compound-event-probability` (+ `theoretical-probability`).
- $P(\overline{A}) = 1 - P(A)$ → s4 `complementary-probability`.
- Reduced-sample-space conditional, table-based 'of' questions (B_2 throughout, HSC 2009/2005) → `conditional-probability`.
- at least / at most on single-stage (B_3) → `compound-event-probability` blurb now names these.
- Mutually exclusive classification, removing elements to force exclusivity (B_1 §Set Q9–11; B_3 opener) → `mutually-exclusive-events` / `set-notation-events`.

## Net change

- 0 new skills, 0 new edges, **1 blurb re-scope** (`compound-event-probability`).
