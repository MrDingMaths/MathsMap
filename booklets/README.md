# Booklets

Source inputs for enriching the skill graph in [`../data/skills.json`](../data/skills.json).

- Booklets live as markdown in stage folders: `Stage 4/`, `Stage 5/` (new
  syllabus), `Stage 5 Core/`, `Stage 5 Path/`, `Stage 6 Advanced/`,
  `Stage 6 Extension 1/`, `Stage 6 Standard/`. Each stage folder has a
  `media/<booklet>/` subtree with the booklet's extracted images (gitignored);
  image links in the markdown resolve to those PNGs.
- Generated proposal docs land in [`proposals/`](proposals/), one per booklet
  or topic group.
- The atomisation rubric applied to every booklet lives in
  [`../docs/atomisation-principles.md`](../docs/atomisation-principles.md).

## Workflow (semi-automated)

- [`QUEUE.md`](QUEUE.md) — the ordered atomisation queue of topic groups with
  live status (`pending / proposed / applied / nil`). One group per session.
- [`PROMPT.md`](PROMPT.md) — session prompt. Queue mode: paste one line, the
  session takes the next pending group, produces one combined proposal, and
  pauses for review. Apply + `npm run validate` after approval, then the queue
  status is updated.
- [`TRIAGE.md`](TRIAGE.md) — the audit record of which old booklets were
  superseded/already-atomised (and deleted) vs kept.

Per pass: read booklets + principles → atomise worked examples and practice
questions → dedup against existing skills → propose new skills and missing
prereq edges → **review** → apply → `npm run validate`.

## Ordering rationale

The queue finishes started units first, then goes upstream before downstream:
new skills need prerequisite edges pointing into already-refined upstream
nodes, and atomising a downstream unit before its upstream feeders are settled
means those edges attach to still-coarse nodes and get reworked later.
Stage 4 remainder → Stage 5 (dependency order, Core before Path within a
topic) → Stage 6 (Standard, then Advanced, then Extension 1 — respecting the
Stage-6 course-split rules: Year 11/12 split ids, no Standard prereqs for
Advanced).

All 20 original Stage-4 booklets are audited. Four have no proposal doc
because the pass recommended no changes (Algebraic Techniques 1 & 2, FDP 3,
FDP 6) — nil-change passes now get a short nil-result proposal doc so coverage
stays auditable (see `PROMPT.md`).
