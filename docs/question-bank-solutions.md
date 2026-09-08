# Viewing bank solutions

In **Question bank**, expand a question card and select **Show solution** beneath the question. The worked mathematics and solution diagrams appear inline; **Hide solution** closes them. Each card opens independently. This follows MathsDatabase's `js/worksheet.js` inline disclosure and `css/cards.css` layout, with lazy rendering and a changing Show/Hide label.

The worksheet toolbar's **Solutions** control still controls the worksheet preview and print output. Opening a card's solution does not select the question, edit it, or enable worksheet solutions.

On 8 September 2026, 28 bank records from the original Advanced `pilot.pdf` import were removed using the exact IDs in `.booklet-work/practice-imports/pilot-v3/job.json`. None was referenced by a current saved project or teaching module. The bank now has 177 active Linear Relationships questions (168 complete questions and nine revision adaptations); three superseded continuation records remain inactive. Original source evidence and assets are retained. The deletion backup is local at `output/advanced-bank-removal/backup.json`.

Verification: 457 application tests, production build and `scripts/booklet/check-bank-solutions.mjs` browser checks pass. Browser coverage includes keyboard reveal/hide, per-card state, collapse/reopen, mathematical rendering, solution images, narrow-screen width and no writes or worksheet-selection changes.
