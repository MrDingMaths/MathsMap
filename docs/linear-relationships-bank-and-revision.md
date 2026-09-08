# Linear Relationships bank and revision booklet

Implemented 8 September 2026 from source revision **145**. The user's revised booklet remains byte-for-byte unchanged. No outstanding audit recommendations were reapplied and no public curriculum graph changes were made.

## Reusable material

The working project is `linear-relationships-bank-working-v1` (Linear Relationships — Reusable bank). Its 13 modules contain **243 instructional blocks**, including **171 question records and 595 answer-bearing parts**. The three front-matter blocks are accounted for separately. Module boundaries follow the teaching chunks; current block order and content are retained.

Questions and meaningful parts have existing-skill mappings, teaching roles, archetypes and prerequisites. Difficulty classifications are editable preparation metadata. Source identity, selected part provenance and dependent context are retained in [the bank index](linear-relationships-bank-index.json). Canonical bank questions remain free of source-document metadata; the index and working project provide that lineage.

All 171 questions passed content and presentation equality checks after explicit bank saves. Saved TikZ code, graph models, widths, overlays and associated layout overrides are preserved. Seven continuation/comparison groups are recorded as selection units, including graphing Q2 across source pages 17–20 and comparison Q8 across pages 78–79. Shared non-question teaching context stays within its module.

Modules pin question revisions and include snapshots. The bank contains eight additional independent-part excerpts and one comparison-answer variant for the revision booklet; complete original question sets remain available.

## Revision booklet

Open project **Linear Relationships — Revision** (`linear-relationships-revision-v1`) in Studio. Its recipe selects only bank records derived from the revised source booklet, with explicit ordering and revision pins.

| Teaching module | Revision questions |
|---|---|
| Cartesian coordinates | 1 |
| Tables of values | 8; also 3 |
| Graphing from tables | 3 |
| Informal rules | 2 |
| Systematic rules from tables | 9 |
| Rules from graphs | 6 |
| Patterns, equations and graphs | 10 |
| Applying pattern equations | 4; optional 15 |
| Multiple representations | 12 |
| Real-life relationships | 7; optional 16 |
| Comparing relationships | 5 |
| Graphical equation solving | 11 |
| Simultaneous equations and verification | 13–14 |

Session 1 is estimated at 48 minutes and Session 2 at 38 minutes; optional challenge adds approximately 15 minutes. These are workload estimates, not classroom measurements. All 13 modules are represented, but a two-lesson revision selection does not cover every archetype or extension in the full bank.

Long drill sets were excerpted only where sibling tasks are independent, retaining the common stem, diagrams and selected descendants. The revision copy adds application labels and space for graphical working. One separate answer variant replaces stale colour-based line identification with coordinates and explains comparison conditions clearly; the source graph and original booklet remain unchanged.

Outputs are under `output/pdf/`: `linear-relationships-revision-student.pdf`, `linear-relationships-revision-short.pdf` and `linear-relationships-revision-worked.pdf`. The worked edition includes the student questions followed by worked answers, matching Studio's flowing-booklet export behaviour.

Final editions contain **8, 3 and 14 pages**, respectively. All pages were visually checked; the first eight worked-edition page bodies also match the student edition pixel-for-pixel. The final export used an isolated development renderer under `tmp/linear-revision-frozen` because another session was editing the shared graph renderer. Its source hashes are recorded in `output/linear-bank/renderer-baseline.json`.

## Implementation and verification

- Revision recipe mode provides ordered practice sessions and optional challenge without teaching placeholders. Existing recipes retain teaching mode by default. Missing questions, stale revision selections, duplicates, incomplete dependent groups and out-of-scope or unconfirmed-prerequisite selections are rejected.
- Question presentation metadata preserves layout overrides through explicit bank saves and fresh insertions. Reassigned IDs now update representation diagram slots, solution overlays and arrangement references. Local layout edits take precedence over imported defaults.
- PDF export waits for the requested answer edition to appear and checks that it remains selected before printing. This catches a timing failure that previously allowed a requested worked export to contain only student questions.
- Automated checks cover bank transfer equality, source preservation, mappings, dependency groups, snapshot independence, graph-slot and layout reference remapping, and revision-mode rejection cases. PDF geometry checks and visual inspection cover the delivered editions; selected mathematics was checked against prompts and graph models.

Evidence: `output/linear-bank/baseline.json`, `inventory.json`, `transfer-verification.json`, `revision-selection.json`, and `final-verification.json`. The reproducible preparation scripts are `build-linear-bank.mjs`, `finalize-linear-bank.mjs`, `build-linear-revision.mjs` and `polish-linear-revision.mjs` under `scripts/booklet/`. The bank builder resumes its captured baseline rather than replacing it with a later source revision. Rebuilding the revision project replaces that generated project, so preserve any subsequent human edits in a separate copy first.

## Deferred pain point: synchronisation

### Current explicit sync (8 September 2026)

The bank is now synchronised to the accepted complete booklet, revision 163: 168 current question records and all 13 teaching modules. Current questions, solutions, diagrams and captured presentation settings replace the older copies while existing bank IDs, classifications and part teaching mappings are retained. Three former continuation records are draft/superseded because their parts now appear in the corresponding parent question; their saved files and prior revisions remain available for pinned snapshots. The separate revision booklet, its eight excerpts and comparison variant retain their deliberate adaptations and pinned content.

`scripts/booklet/sync-linear-bank.mjs` prepares and validates the transfer; `--apply` performs it with concurrent-edit checks and rollback on a write failure. It verifies canonical content, classification retention, module contracts and saved revision hashes. The complete source booklet is unchanged. See [the sync receipt](linear-relationships-bank-sync.json).

Booklet edits and bank edits are **not automatically synchronised**. Use explicit bank updates; existing booklet and module snapshots remain pinned. A future workflow could identify newer bank revisions and let the user selectively refresh them while retaining local edits. That workflow is deliberately deferred. Linking an existing bank question replaces the local question; it is not a merge.
