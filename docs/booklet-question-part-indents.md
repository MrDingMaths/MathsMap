# Question part indentation

Question parts retain a 7 mm label indent for each labelled ancestor in the
semantic question tree. Visual groups may be rearranged for diagrams, columns
and full-width follow-up parts; moving a part outside its parent's visual group
must not remove its question hierarchy.

`resolveArrangement` derives missing gutters without modifying saved content or
arrangement references. `BookletArrangement` adds only that missing distance to
the label position and its text gutter. Existing ancestor padding counts toward
the required distance, so ordinary nested layouts do not receive a second indent.
The same path renders the structure editor, page preview, pagination measurement
and print. Teaching examples and answer editions retain their separate layouts.

Regression coverage in `tests/booklet-arrangement.test.js` checks flattened parts,
nested subparts, diagram columns, existing insets, save/reopen round trips and all
current booklet question arrangements. `scripts/booklet/check-part-indents.mjs`
inventories affected questions and checks actual printed gutters and an isolated
edit/save/reopen without writing project or question-bank records.

This intentionally corrects the missing nesting in existing custom layouts while
preserving original evidence, mathematical content, IDs, diagram arrangements,
working-space dimensions and pagination settings. Future imports must check label
indentation separately from column order and diagram placement.

## Acceptance, 11 September 2026

Trigonometry revision 135 has 16 affected questions: source page 29 Q6;
Mixed Multistep Q1–4, Q6 and Q18; and Bearings Q4–5, Q11–12, Q14–16 and
Q18–19. All are corrected by shared rendering. Index Laws revision 205 and
Linear Relationships revision 7 have no missing gutters. Project and bank
records were not rewritten.

The 71 focused arrangement, pagination, flow, measurement and presentation
checks and the production build passed. Printed 7 mm gutters, ordinary nesting,
diagram columns, preview zoom and isolated edit/save/reopen passed. All five
trigonometry exports passed DOM and PDF geometry checks: 68 question pages,
4 short-answer pages, 35 worked-solution pages, 72 questions-plus-short pages
and 103 questions-plus-worked pages. All 282 pages received visual layout review;
the 11 affected physical question pages were also inspected individually.
All 606 internal PDF links resolve. Local evidence and measured export timings
are retained under `.booklet-work/part-indent/`.
