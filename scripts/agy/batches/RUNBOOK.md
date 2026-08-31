# Wave-3 batch runbook (one session per batch)

Paste the prompt below into a fresh session, substituting the batch id. Everything it needs
is already in the repo: the config in this directory, the standing hazards in
`../lib/hazards.mjs`, and the workflow in `docs/content-generation.md`.

Order is binding — a batch whose prereq content does not exist loses its voice samples:
**W3-7 → W3-8 → W3-9 → W3-10, W3-11** (W3-10 and W3-11 both need W3-7 and W3-9).

---

## STANDING OWNER DECISION 2026-08-30 — GENERATION IS AUTHORED BY OPUS, NOT agy

From W4-4 onward, **step 2 below is not an agy run.** Content generation is done by parallel
Opus subagents, one per section, reading the same `task-NNN.md` briefs `build-gen-tasks.mjs`
writes and honouring the same output contract, so `collect-gen` consumes them unchanged. This
is a quality decision, not a quota workaround — see the measured comparison in the W4-2 and
W4-3 rows of `docs/content-queue.md` (W4-2: all 11 blind-check flags landed in agy's 8 skills,
none in Opus's 14, and agy's one skill containing a power carried 8 defective items; W4-3:
all-Opus, gate clean on the first pass, 0 answer mismatches).

**agy keeps the other lanes** — Tier-1 diagram vision, repair tasks and redraws still run
through `run-gen.mjs` on `gemini-3.7-flash-high`, where it is cheap and has held up.

The rest of the workflow below is unchanged.

---

## Per-batch prompt (substitute BATCH and NEXT)

> Run content-generation batch **BATCH** end to end, following `docs/content-generation.md`
> §Workflow and §"Wall-clock discipline". You orchestrate only: never author content, never
> spawn a subagent to run a command.
>
> The batch config is already written: `scripts/agy/batches/BATCH.json` (sections, booklet
> paths, tikzSections, topic hazards). Standing hazards are injected automatically — do not
> add them to the config. Do not commit; leave that to me.
>
> 1. `npm run dev:batch` (pins vite to 5199, records `.agywork/dev-server.json`).
> 2. `node scripts/agy/build-gen-tasks.mjs --config scripts/agy/batches/BATCH.json --out .agywork/BATCH/gen --allow-small`
>    then `node scripts/agy/run-gen.mjs --tasks-dir .agywork/BATCH/gen`
>    then `node scripts/agy/collect-gen.mjs --tasks-dir .agywork/BATCH/gen`.
> 3. **The moment collect-gen passes, launch NEXT's generation in the background**
>    (`build-gen-tasks --config scripts/agy/batches/NEXT.json --out .agywork/NEXT/gen --allow-small`,
>    then `run-gen` with `run_in_background`). Adjudicate BATCH while it runs. Skip this only
>    if NEXT depends on BATCH's content.
> 4. `node scripts/agy/gate.mjs --only <all ids>` — read the summary, do NOT repair yet.
> 4a. **RESTART THE DEV SERVER BEFORE RENDERING, AND PROVE IT.** The server started in step 1
>    predates this batch's content and serves `index.html` for it, which makes `render.mjs` report
>    `STALLED at 0/0` — this has cost a render in W4-5, W4-6 and W4-10. Do:
>    `npm run manifest` → `node scripts/agy/dev-server.mjs --stop` → `npm run dev:batch` →
>    `curl <base>/content/<one batch id>.json` and check it parses as JSON. Repeat after
>    `apply-repairs` if any content changed. (A genuinely figure-free skill also prints
>    `0 diagrams gathered`, so that message alone does not distinguish the two cases.)
> 5. Start both slow lanes now, before any repair:
>    - blind check: `node scripts/blind-for-check.mjs <id> …` for every skill, then
>      `node scripts/run-sonnet-check.mjs --skills <ids>`, then
>      `node scripts/run-luna-check.mjs --compare <ids>`;
>    - diagram lane: `node scripts/diagram-audit/render.mjs --ids <ids> --out .agywork/BATCH/diagram/captures`
>      (base URL comes from the dev-server file), `lint.mjs`, `build-audit-packets.mjs`,
>      `run-gen.mjs` over the packets, `merge.mjs`.
>    Fix only parse failures and compile failures first — those block the lanes.
> 6. Adjudicate every checker flag against the NOT-A-DEFECT list; the blind bundle's `taught`
>    block is authoritative, so a "mismatch" contradicting taught content is checker-side.
>    Verify every arithmetic claim yourself before accepting a mismatch.
> 7. **ONE merged repair round.** Build a single `.agywork/BATCH/defects.json` from the gate,
>    the adjudicated flags and the diagram verdicts together →
>    `build-repair-tasks.mjs` → `run-gen.mjs --tasks-dir .agywork/BATCH/repair` →
>    hand-verify every replacement key → `apply-repairs.mjs` → `gate.mjs` again →
>    `node scripts/recheck-repairs.mjs --tasks-dir .agywork/BATCH/repair --checker sonnet`.
>    A second round is only for defects the repairs themselves introduced (2-round cap, then
>    flag for me).
> 8. Diagram redraws (`build-redraw-tasks` → `run-gen` → `apply-redraws`), re-render,
>    re-lint, re-audit; then `report.mjs --batch BATCH`.
> 9. `npm run manifest`, `npm test`, unscoped `node scripts/agy/gate.mjs --unscoped`
>    (expect only the 2 known pre-existing duplicate debts), `node scripts/agy/dev-server.mjs --stop`.
> 10. Update the BATCH row in `docs/content-queue.md` (defect counts by class, token totals,
>     what I need to eyeball) and write the batch's lessons to memory. Report to me: what
>     shipped, what I must review by eye, and anything the standing hazards should absorb.
>
> Rules that have cost a batch before: never author TeX through a Bash heredoc or `node -e`
> (backslashes are stripped — use the Write tool); never tail an audit's output; `validate.mjs`
> takes no `--strict`; a closed-option-set collision is fixed by retyping the item, never by
> renumbering; `tikzSections` does not make the model draw — the hazard must say the card
> carries a figure.

---

## Batch ids

| Batch | Skills | Sections | Depends on |
|---|---:|---:|---|
| W3-7  | 22 | 7 | — |
| W3-8  | 25 | 7 | — |
| W3-9  | 25 | 7 | W3-8 |
| W3-10 | 21 | 6 | W3-7, W3-9 |
| W3-11 | 23 | 7 | W3-7, W3-9 |

Skill id lists come straight from the config:
`node -e "const c=require('./scripts/agy/batches/W3-7.json');console.log(c.sections.flatMap(s=>s.skillIds).join(','))"`
