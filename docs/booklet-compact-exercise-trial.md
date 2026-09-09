# Compact exercise trial

Open **Linear Relationships v1** (`linear-relationships-v1`), the canonical booklet from 8 September 2026. It preserves all content and layout from Compact Exercise Trial revision 8. Its 168 bank sync ownership links transferred with unchanged baselines. The original (now **Linear Relationships v0**), Flexible and Compact Exercise Trial are archived under `booklets/archives/2026-09-08-linear-relationships/`.

The historical trial was an independent consumer copy of **Linear Relationships — Flexible**, revision 3. All 237 blocks, question content, teaching mappings and pinned bank references matched that source revision. Later source/bank updates remained pending until explicitly accepted. The specification and historical verification below describe that trial.

The trial has 12 exercises, one per existing topic. Questions run from 1 within each exercise, including across teaching checkpoints. Practice runs were sorted stably by their pinned bank reasoning scores; linked continuations, paired questions and dependencies move together. Teaching pages and student response spaces retain their source settings. Practice can flow at safe part boundaries, including into unused space on the preceding page.

Difficulty labels and reasoning scores appear in the editor and outline only. Exercise numbers, contents page destinations, and question/answer links are calculated together. Screen and print use separate anchor identities so hidden editor content cannot steal PDF destinations.

Front-cover contents use separate columns for exercise number, topic title at a consistent tab stop, and right-aligned page number, without dot leaders, separator symbols or the word “Exercise”. Navigation links remain active. This is the shared convention for future booklets, recorded in `AGENTS.md`. Small question-side “Answers” links appear on screen only and are hidden in print.

Linked difficulty ratings automatically refresh from the current bank on open, save and the editor's regular bank checks (every 15 seconds while saved and visible, and on window focus). Question-content pins, question order and layout are retained; exercises are not automatically re-sorted. Detached questions retain their local ratings. The initial refresh on 8 September 2026 updated 122 of 126 ratings, including 35 band changes.

Short answers use two explicit columns, 9 pt type and an 8 mm gutter. Worked solutions use one column and 9.5 pt type. Both flow across exercise boundaries. Every column begins with its exercise context; new headings stay with their first answer. Standalone and multipart answers share an exercise-wide label gutter. Coordinate lists wrap between complete values; escaped currency remains prose. Editing opens the original source value, not its formatted display value.

The contents include a linked entry for each answer section present in the selected edition. “Short answers” and “Worked solutions” headings appear only at the start of their respective sections; exercise context remains on subsequent pages. The trial cover omits its two syllabus-summary lines. “Book 1” text aligns with the main text; version and feedback sit at the right with their text left-aligned.

Answer diagrams initially use 45 mm/55 mm caps. Dense graphs have measured exceptions up to 76 mm; these retain readable tick and coordinate labels without changing question diagrams. Calibrated code is an answer-only presentation override bound to the original diagram's signature. Changing the source diagram invalidates that override, preventing an old answer graph from masking an edit. The graph should then be checked/calibrated again.

## Model and rendering

The additive v4 settings are `exerciseOrganisation: "topic"` and `compactAnswers`, containing type sizes, column gutter, diagram caps and per-edition diagram presentation overrides. Blocks cache bank-owned display ratings under `flow.bankDifficulty`; their rating revision is independent of the question-content pin. Bank classifications and sync ownership are unchanged. Projects without these settings retain the legacy flexible rendering path.

Calculated compact pages contain explicit `columns` of answer fragments, each carrying its source section and label width. Stored question content is never fragmented. Shared solution diagrams and dependent parts remain atomic. Measurement, preview and PDF consume the same columns. Both diagram/style settings and column assignments participate in measurement cache keys.

## Reproduce and verify

- `node scripts/booklet/create-compact-linear.mjs` validates a new candidate; `--apply` creates it through the project API and refuses to overwrite an existing trial.
- `node scripts/booklet/calibrate-compact-answers.mjs --apply` recalibrates answer-only graph presentation through the revision-checked save API. `--ids=id1,id2` restricts a refinement to named diagrams.
- `node scripts/booklet/check-compact-exercises.mjs` defaults to canonical v1 across all five editions; `--projects baseline,trial` selects archived comparison snapshots. It checks every answer leaf, column bounds, graph typography, printed geometry and actual PDF destinations. `--projects trial --editions short,with-short` checks a subset.
- `node scripts/booklet/check-compact-navigation.mjs` checks virtualised contents/question/answer navigation, editor difficulty badges, zoom, a 390 px viewport and reload.
- `node --test tests/booklet-compact-exercises.test.js tests/booklet-flow.test.js tests/booklet-measurement.test.js` covers sorting, checkpoints, grouping, numbering, fragmentation, source-preserving display transformations and cache invalidation.

Generated PDFs, SVG compilation caches, screenshots and audit reports stay in `.booklet-work/compact-exercises`; delivery copies live in `output/pdf/compact-exercise-trial`. These are local evidence, not release files.

## Verification, 8 September 2026

| Edition | Flexible baseline | Compact trial |
| --- | ---: | ---: |
| Questions | 93 | 92 |
| Short answers | 45 | 15 |
| Worked solutions | 60 | 47 |
| Questions and short answers | 138 | 107 |
| Questions and worked solutions | 153 | 139 |

All five trial editions pass DOM layout, column bounds, graph typography and printed geometry checks. Every practice answer leaf occurs exactly once. The combined PDFs each contain 586 working internal links; the question-only PDF has 12 contents links. Difficulty badges are absent from print DOM. The editor navigation check passes contents jumps, question-to-answer and return links, zoom, a 390 px viewport and reload. All 509 repository tests and the production build pass; the existing large-bundle warning remains.

Visual review covered the contents, practice reflow, dense coordinate grids, graph/scenario answers, equation working, exercise transitions, and the reported 7f/7g/8/9 indentation case. Worked equations use the same compact display in preview and PDF, with the first equation kept on one line and all subsequent mathematical terms retained.

The baseline was freshly exported from flexible revision 5, which includes a concurrent matchstick-caption edit. The trial remains based on revision 3 and does not absorb that later edit. The concurrent original/booklet/bank changes were preserved.
