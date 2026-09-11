# Compact exercise specification

The accepted reference is **Linear Relationships v1** (`linear-relationships-v1`). Preserve existing questions and layout unless migration is requested. Historical trial snapshots are local recovery records; compatibility tests use dedicated fixtures.

- One numbered exercise per topic, with continuous practice numbering across teaching checkpoints. Difficulty labels are editor-only. Sort only supported independent practice groups at creation; uncertain ratings/dependencies keep source order and create findings. Later rating refreshes never reorder questions.
- Print the question-side exercise heading once, at the start of its first non-empty practice section. Source-page sections, teaching checkpoints and continued questions must not repeat it. Derive this centrally in `flowEditionSections`, including inline starts on teaching pages; do not remove source sections or embed replacement headings in prompt text. Compact answer columns retain their exercise context headings.
- Flexible pagination at safe part boundaries; preserve meaningful arrangements, dependencies and handwriting space. Source boundaries are an explicit per-project option, not a default.
- Short answers: two columns, 9 pt, 8 mm gutter. Worked solutions: one column, 9.5 pt. New projects include practice answers only; teaching responses remain available through teaching controls.
- Use exercise-wide answer-label gutters. Keep each new heading with its first answer and carry exercise context into subsequent columns/pages. Answer-section headings appear only at section starts.
- Answer diagrams start with 45 mm/55 mm caps; measure final label readability and retain reviewed exceptions. Presentation overrides are bound to diagram signatures, so source edits invalidate them.
- Generate cover contents and question/answer navigation together. Contents omit “Exercise”, dot leaders and separators; number, title and page occupy separate columns. Include linked answer-section entries only for included sections. Question-side Answers links are screen-only.
- Covers omit syllabus-summary lines beneath the book number; align the book number with title/contents. Version and feedback sit together at the right with left-aligned text. Preserve the separately inventoried Syllabus Content page.
- Native maths uses the new-project display-glyph policy. Shared fraction spacing applies across all books and editions. Stored content stays whole even when its rendered fragments cross pages.

The creation preset lives in `src/lib/booklet-creation.js`; normalization does not apply it to existing projects. See [direct compact import](booklet-direct-compact-import.md) for creation, content/presentation verification, all five edition checks, navigation checks and cache rules. Regression coverage includes `booklet-compact-exercises`, `booklet-flow` and `booklet-measurement` tests.
