# Proposal — Atomise Data Visualisation group (Booklets 1–3, topic `t-s4-dat`) — NIL RESULT

**Status: APPLIED (NIL) 2026-07-15** — audited, no changes recommended; user confirmed. `data/skills.json` untouched. QUEUE.md row 6 → nil.

## Context

Queue-mode pass over the three Stage 4 *Data Classification and Visualisation* booklets:

1. `Data Visualisation.md` (NEW, Book 1) — classifying data → **dp-s4-dat-1**
2. `Data Classification and Visualisation 2_Display data…` → **dp-s4-dat-2**
3. `Data Classification and Visualisation 3_Interpret data…` → **dp-s4-dat-3**

Topic `t-s4-dat`, MA4-DAT-C-01.

## Finding

No changes. dp-s4-dat is already covered by 8 skills, and every booklet routine traces to them:

- **Book 1 (classify)** — variable / numerical vs categorical / discrete-continuous / nominal-ordinal → `statistical-variable`, `classify-numerical-categorical`, `discrete-continuous-nominal-ordinal`.
- **DCV2 (display)** — column/line/dot/stem/histogram/pictogram construction → `represent-data-graphs`; conventions → `graph-conventions`; choosing a graph → `choose-graph-type`; column/line basics → s3 `construct-column-graph-scale`, `interpret-line-graphs`.
- **DCV3 (interpret)** — misleading graphs → `misleading-graphs` + `interpret-graphs-conclusions`; spreadsheets → tool operation.

## Considered and omitted (audit trail)

- **`construct-frequency-table`** (DCV2 "Frequency Distribution Tables" — ungrouped tally, `Σf`). Excluded — elementary organising step, no class-interval grouping at s4; feeds `represent-data-graphs` and the newly-added `summary-stats-frequency-table` but is not itself an at-risk routine. (`frequency-distribution-table` already exists at s6 for the relative/cumulative version.)
- **Sector / divided-bar graphs** (DCV2). Excluded — booklet content is *interpretation* (read %, fraction, proportional scaling), covered by `interpret-graphs-conclusions`; proportional step is cross-topic (FDP). No angle-construction routine present.
- **Frequency polygons** (DCV2) — presentation add-on to a histogram (`represent-data-graphs`); grouped version is s6 `grouped-data`.
- **Cumulative frequency histograms / ogives** (DCV2). Excluded — beyond the Stage 4 routine; cumulative frequency enters at Stage 5+ (`five-number-summary`, `grouped-data` lineage). OLD booklet over-includes.
- **Pictograms** — s3-level display within `represent-data-graphs` / `interpret-tables-graphs`.
- **Choosing an appropriate graph** — `choose-graph-type`.
- **Misleading graphs** (DCV3) — `misleading-graphs`.
- **Graphing with spreadsheets** — tool operation.

## Net change

None.
