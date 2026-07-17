---
status: applied
---

# Proposal — Atomise Critical Path Analysis (Stage 6 Standard Y12, topic `t-s6st12-critical`)

**Status: APPLIED 2026-07-17** — approved by the user and applied to `data/skills.json` (1 new skill, 1 new edge, 0 re-scopes); `npm run validate` clean. QUEUE.md row 60 → applied.

## Context

Queue row 60. One booklet: `Stage 6 Standard/Critical Path Analysis.md` (MST-12-S2-07), dp-1–4. Five skills already sit on these dot points: `precedence-network` (dp-1), `forward-backward-scanning` + `float-times` (dp-2), `critical-path` (dp-3), `gantt-chart` (dp-4).

## Finding (headline)

The forward/backward-scan → float → critical-path spine is well covered. One genuine gap: **crashing** — reducing critical-activity durations to shorten completion time, with the max-reduction-before-the-critical-path-changes analysis and cost optimisation. It is the whole §Crashing chapter (2 investigations, F/D/M with 2019 HSC Band 6, 2021 HSC, HSC sample Band 5, Mastery Q9–11) and the second half of dp-4's text — no skill carried it; `gantt-chart` (the other dp-4 half) is about Gantt construction. Also a booklet gap the other way: dp-4's Gantt-chart half has no teaching section at all.

| Booklet section | dp | Skill |
|---|---|---|
| §Activity Charts (predecessor vocab, table↔chart) | dp-1 | `precedence-network` ✓ |
| §Dummy Activities + §Edge Weights | dp-1 | `precedence-network` ✓ ("including dummy activities") |
| §Forward and Backward Scans (EST/LST) | dp-2 | `forward-backward-scanning` ✓ |
| §Critical Path Analysis §Float Time | dp-2 | `float-times` ✓ |
| §Critical Path Analysis §Finding the Critical Path | dp-3 | `critical-path` ✓ |
| §Crashing | dp-4 | new `crashing-project` §1a |
| *(Gantt chart: no section — see gap note §5)* | dp-4 | `gantt-chart` ✓ (untouched) |

## 1. New skills (applied)

### a. `crashing-project`

| Field | Value |
|---|---|
| id | `crashing-project` |
| title | Crash a project to reduce completion time |
| blurb | Shorten a project's minimum completion time by reducing the duration of critical activities, finding the maximum useful reduction before a new critical path forms, and choosing the least-cost reductions. |
| stage 6 · courses `["s6-std12"]` · dotPointIds `["dp-s6st12-critical-4"]` · difficulty 3 · prereqs `["critical-path"]` · atom R |

**Trace:** §Crashing — Key Principles box (only critical activities reduce duration; crashing may create a new critical path; aim for equal-length paths), two guided Investigations (max-shorten-A-before-waiting-for-B; the D–E "why not 13 hours" limit), Foundation Q1–2, Development Q3–8 (Q3b/c reduce-B-by-100→only-90; 2019 HSC Band 6 Q8 show-new-time-29-weeks; 2021 HSC Q7 add-task-X float), Mastery Q9–11 (Q10d/e "max reduction without changing the critical path", Q11d least-cost $100/h vs $50/h optimisation → $200).

**Bar:** distinctive (reduce-only-on-critical-path, stop when a parallel path becomes critical); at-risk ("reduce by 3 ≠ save 3" trap drilled in both investigations + every HSC part); stage 6 sole source; non-redundant (`critical-path`'s blurb stops before any duration change). Dot-point home dp-4 (its own text is "examine the effect of changing activity durations").

## 2. New prereq edges (applied)

`crashing-project ← critical-path` — crashing operates on the located critical path + float times; distinctive, at-risk, same stage, non-redundant. `critical-path` transitively supplies `float-times`, `forward-backward-scanning`, `precedence-network` — no other edge needed.

## 3. Edits to existing skills

None. `critical-path` and `gantt-chart` blurbs stay accurate; crashing is a clean addition, not a de-bundle.

## 4. Borderline candidates → EXCLUDE

- **`dummy-activities` lift-out** (§Dummy Activities + §Edge Weights — shared-some-but-not-all-predecessors rule, dotted 0-weight edge, HSC sample Q7). Distinctive/at-risk, but a case within the table→network routine, not a separable routine; dp-1 and the `precedence-network` blurb both already name it. Kept bundled (leanness; scale-drawing-subroutine precedent).
- **`predecessor-vocabulary`** (§Activity Charts — prerequisite vs immediate predecessor, house-buying comprehension set). Category/vocabulary atom; bundle-out disfavoured (`interpret-percentage-vocabulary` rejection). Absorbed into `precedence-network`.
- **`add-activity-to-network`** (2021 HSC Q7c: place task X from EST/LST/duration). Single HSC part, no teaching section; composes `forward-backward-scanning` + `float-times`.
- **`minimum-completion-time` as own skill** — the finish-vertex output of `forward-backward-scanning`, already named in `critical-path`'s blurb.

## 5. Considered-and-omitted

- **Booklet gap (no graph change):** dp-4's Gantt-chart half (`gantt-chart`) has a syllabus bullet but no teaching section or question in the booklet — recurring-gap genre (rows 47/49/50/59). Skill stays as-is; flag for booklet revision.
- EST/LST comprehension warm-ups (§Forward Scan Foundation Q1–2) → entry steps of `forward-backward-scanning`.
- Float-time formula → `float-times`.
- Pronumeral fill-in on scan boxes (§Backward Q5) → drills of `forward-backward-scanning`.
- "Describe what the critical path represents" (§Crashing F Q1) → understanding check inside `critical-path`.
- Spreadsheet-modelling syllabus bullet — no booklet content (standing spreadsheet-gap note, rows 46+).

## Net change applied

- **+1 skill** (`crashing-project`)
- **+1 edge** (`crashing-project ← critical-path`)
- **0 re-scopes**
