# Booklets

Source inputs for enriching the skill graph in [`../data/skills.json`](../data/skills.json).

- Drop one markdown file per booklet/topic here (worked examples + your atomisation).
- Generated proposal docs land in [`proposals/`](proposals/), one per booklet.
- The atomisation rubric applied to every booklet lives in
  [`../docs/atomisation-principles.md`](../docs/atomisation-principles.md).

Workflow: read booklet + principles → atomise worked examples → dedup against
existing skills → propose new skills and missing prereq edges → review → apply →
`npm run validate`. See the approved plan for the full process.
