# Teaching controls and arrow correction — 1.3.1

Verified 6 September 2026 using a fresh read-only pilot revision **18**. Browser writes used intercepted project fixtures; no live project mutation was sent.

Implemented independent review, identify/activity and guided-practice answer switches; discoverable activity creation; editable bold callout/teaching headings; independent-practice-only back-of-book short answers; and smooth table arrows with separated endpoints, tangent-aligned heads and zoom-independent geometry. The shared fix was made in standalone MathsEditor and synced as checksummed **1.3.1**.

Validation:

- 404 application tests and 15 standalone model tests passed.
- Existing document-editor browser checks passed, including a new 50% zoom geometry regression against the standalone runtime.
- Existing studio workflow passed, including the new answer toggles, no autosave on toggles, short-export exclusions, activity creation and bold heading Save/reload. Existing image/table/history, responsive/focus, TikZ proposal and two-session conflict scenarios still pass.
- Current-pilot layout and fidelity checks passed. Full student/worked output remains 13 pages with no detected page/footer collisions. Short output has five independent-practice groups flowing onto four physical PDF pages, without theory or a cover.
- Production build passed (existing large-chunk advisory).

All pages of the student (13), worked (13) and short-answer (4) PDFs were visually inspected. The arrow correction was inspected closely on source 29/33. Short-answer inspection caught and fixed crowded four-column coordinates and an orphaned page heading. The answer-only output retains graphical answers and original question numbers.

Outputs:

- [Back-of-book short answers](../output/pdf/teaching-controls-short.pdf)
- [Student booklet](../output/pdf/teaching-controls-student.pdf)
- [Worked solutions booklet](../output/pdf/teaching-controls-worked.pdf)

Logs, screenshots, snapshots and checksum/preservation results are under `tmp/teaching-controls/`. Project content, mathematical approval and fidelity approval were not changed by verification. No deployment or database changes were performed.
