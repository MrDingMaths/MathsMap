# MathsMap

A student-facing map of NSW maths, **Stage 3 → Stage 6**. It imposes a clear
hierarchy and prerequisite graph over the curriculum so students can see what
they know, what they're ready for, and what to learn next.

```
Stage → Course → Topic → Dot point → Skill   (browsing hierarchy)
Skill.prereqs                                  (prerequisite DAG, cuts across all of the above)
```

## Stack

Vite + Svelte 5 + Cytoscape.js. Static build; progress is stored in
`localStorage` behind `src/lib/store.js` so it can later be swapped for a
backend (e.g. Supabase) without touching the UI.

## Develop

```bash
npm install
npm run dev        # start the app
npm run validate   # check the taxonomy (refs, cycles, stage-monotonic prereqs)
npm run build      # production build to dist/
```

## Data (source of truth) — `data/`

| File | What it holds |
|------|---------------|
| `courses.json`   | Stages and course streams (s3, s4, s5-core, s5-path, s6-standard/advanced/ext1/ext2). |
| `topics.json`    | Syllabus topics, tagged to one or more courses. |
| `dotpoints.json` | Verbatim syllabus content dot points, under a topic. |
| `skills.json`    | The atomic, **deduplicated** skill nodes: tagged with course(s) + dot point(s), with `prereqs` (skill ids). A skill shared across courses appears **once** with multiple course tags. |
| `meta.json`      | Schema version + mastery levels. |

### Authoring workflow (one course at a time)

1. Drop a syllabus doc in `syllabus/{stage}-{course}.md`.
2. Decompose: topic → dot points → individual skills.
3. **Dedup**: if a skill already exists, reuse its id and append the new course/dot-point rather than duplicating.
4. **Prereqs, stage-ordered**: Stage 3 first (within Stage 3), then Stage 4 (from Stage 3, then within Stage 4), and so on. Prereqs may only point to same-or-earlier-stage skills.
5. `npm run validate`.

## Status

- [x] Phase 0 — scaffold + sample data
- [x] Phase 1 — schema + validator (content authoring ongoing, per course)
- [x] Phase 2 — hierarchy browser (Browse, search)
- [x] Phase 3 — Cytoscape map view (per-course, dagre LR)
- [~] Phase 4 — progress + recommender wired in; **AI question generation TODO** (`scripts/generate-questions.mjs`)
