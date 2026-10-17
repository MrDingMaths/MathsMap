# Pre-review sweep

17 October 2026, teacher approved for booklets they have not reviewed yet. About 40% of the teacher's Studio comments from 11–17 October repeated conventions already set for every booklet. `sweep/run.mjs` applies those conventions before the teacher's page review, so the review starts from the house style. It lives outside `scripts/`, which exports freeze.

## Scope

A booklet is in scope when it has no teacher comment (a `project.studio.flags` entry with no `kind` and an `at` timestamp, open or resolved) and is not a class copy (`source.type` `project-copy`). Reviewed booklets and class copies are refused by `prepare` and `apply`.

## Commands

```
node sweep/run.mjs report [--project ID,ID] [--rules gutter,cloze] [--list] [--all]
node sweep/run.mjs prepare --project ID
node sweep/run.mjs apply --project ID
node sweep/run.mjs apply --all [--rules gutter,cloze,labels,empty] [--notes FILE]
node sweep/run.mjs apply --all --rules gutter,cloze,labels,empty --exclude ID,ID
node sweep/run.mjs summary
node sweep/run.mjs pages --project ID [--threshold 0.4]
node sweep/compare.mjs ID [edition]
node sweep/compare.mjs ID [edition] [report-prefix]
powershell -File sweep/check-pages.ps1 -Project ID [-Editions student]
```

- `report` is the dry run: one line per booklet with fixes and reports per rule, and `.booklet-work/pre-review-sweep/report.json`. `--list` prints every finding.
- `prepare` writes `before.json`, `candidate.json` and `changes.json` to `.booklet-work/pre-review-sweep/ID/` without saving. It refuses a candidate whose words, numbers, expressions or answers differ from the booklet (`verifyCandidate`).
- `check-pages.ps1` renders the candidate's affected Questions pages with `check-feedback-pages.mjs --blocks` and the automated checks, and the same blocks from the before-snapshot, for a side-by-side look. Run it from PowerShell.
- `apply` first defers when `lean-import.mjs`, `lean-review.mjs` or `lean-route.mjs` is running, when any process names the booklet, or when another run folder holds a candidate for it newer than the live file. It then saves through `saveRepair` (revision-checked, recovery checkpoint first, read back, bank sync for linked questions). It re-prepares when the booklet moved on since `prepare`.
- `apply --all` applies every unreviewed booklet that still has a fix for the named rules, one at a time; deferred and failed booklets are logged and the run continues. `--notes FILE` takes each saved booklet off a one-ID-per-line list that other sessions read.
- `summary` prints one line per unreviewed booklet: the revision saved, what the sweep fixed, anything still to fix, and what is left for the teacher. It writes `.booklet-work/pre-review-sweep/summary.txt`.
- `compare.mjs` composes before/after images of the pages `check-pages.ps1` rendered whose rasters changed.
- `--exclude ID,ID` leaves booklets with failed checks deferred during a batch. Release their unsaved sweep candidates when abandoning them. Comparisons remove stale page PNGs on recheck; an optional report prefix (for example `ratio-pages`) preserves separate before/after comparisons.
- `pages` renders the Questions edition and lists forced page breaks and source page boundaries that leave more than 40% of the previous page empty. It changes nothing.

Each changed block gets a `sourceReview.feedbackRepairs` entry naming the rules applied.

The 17 October completion checks found that increasing a blank beside prose can push words onto another line (Gradient Intercept Form p84). Such increases are now reported for a measured layout decision instead of applied automatically. Shrinking those blanks remains supported.

A shared-size increase beside maths in a table is also reported when the existing blank already fits its own answer. Circle Trigonometry p82 otherwise wrapped the closing parenthesis of an inverse-tangent expression. Necessary handwriting-capacity increases remain supported.

**Ratio clearance (17 October 2026, authorised completion repair):** a labelled bottom arrow below an internal table row reserves at least 22 mm for the following row. This clears the `×1.5` label from the next ratio on Properties of Geometrical Figures Questions p28. Both ratio booklets passed visual and automated checks after this repair; the earlier visual hold is closed. The five recorded blue-header exceptions in Similar Areas and Volumes remain untouched.

## Rules

Fixes (presentation only):

| Rule | Convention | Fix |
|---|---|---|
| `gutter` | [Equals-sign gutter](booklet-transcription-feedback-checklist.md#equals-sign-gutter-10-october-2026-user-requested) | `\mathrel{\phantom{=}}` before a left-aligned opening expression followed by lines starting with a relation, in paragraphs, in a column of a scaffold table, before `\begin{aligned}&=…`, and in aligned rows and source strings (via `scripts/content/example-gutters.mjs`). Centred working, manual spacing and example prompts without `equationAlignment` are reported. |
| `cloze` | [Cloze styles](booklet-cross-session-rules.md#cloze-styles-and-source-tables-4-october-2026), reviewer contract | Width 2.2 mm per character + 6 mm, minimum 8 mm (`clozeHandwritingMm`). In one question, blanks whose answers are of similar length (within 1.6×) share the widest size; a word among numbers keeps its own. Changes under 4 mm are left. A blank in a table column too narrow for its answer is reported. Bordered tables that force cloze dots back on lose them. |
| `labels` | Reviewer contract, labels | A lone `a` on an investigation or worked example is hidden (`presentation.sourceResponseLabels` with an empty response label). Key Ideas are numbered from 1, continuing across a continued block. A typed part label alone in a paragraph (`a)`, `(b)`) becomes a bold letter. |
| `empty` | Reviewer contract, spacing | Empty paragraphs leading or trailing a prompt; empty answer groups under a completed table (`flow.tableOnly`, as in Rounding p7); empty groups in a vertical stack of a saved arrangement (row columns and structural gutters stay). |
| `ratio` | Ratios feedback, 17 October 2026 | A table with a colon column on every row: no borders, no header fill, a 2.5 mm colon column with terms right- and left-aligned beside it. |

Reported only: fraction components drawn with dots, boxes inside equations, fraction bars drawn as separate rules, comparison circles with dots; lone `a` on guided practice, identify and other activities; text that starts with a typed label; adjacent tables with the same columns and parts that each hold one row of a table (`tables`); forced breaks (`breaks`, measured by `pages`); restarted part labels (`sequence`); dormant cell alignment (`alignment`). Full fraction scaffolds retain a boxed numerator, boxed denominator and vinculum, even when both components are blank (17 October 2026, user reaffirmed). They are no longer reported as a potential conversion to dots. Fraction recognition includes `frac`, `dfrac` and `tfrac`; fraction-component boxes are excluded from ordinary equation-box flags.

## Local exceptions

A block's recorded decisions (`sourceReview.intentionalDepartures`, `authorisedFeedback`, earlier `feedbackRepairs`) hold a rule back when they bear on it: a gutter or alignment note for `gutter`; a local instruction to keep a box or dots, or a decision "for this question only", for `cloze`; a part-label note for `labels`; a ratio or colon note for `ratio`. Held fixes are reported with the note.

## Report-only convention follow-up (17 October 2026)

The authorised follow-up lives in `sweep/conventions.mjs`, with the local driver and evidence in `.booklet-work/pre-review-sweep/`. It converts ordinary equation blanks only where the saved response identifies each blank, normalises typed labels, joins fragmented native tables, and repairs confirmed equals gutters and inadequate sentence-writing space. It preserves fraction component boxes, full boxed fraction scaffolds, meaningful response regions, mathematical answers, owner identities and skill mappings. The narrowly listed response instructions use “blanks” after their boxes become dotted clozes.

The driver rejects changed live snapshots or candidates after inspection and uses the existing revision-checked save, recovery checkpoint and bank sync. Inspect the affected Questions pages and neighbours; inspect answer pages where their response terminology changed. Previously measured response lines with explicit line breaks retain adequate equal line widths rather than being automatically shortened. Remaining detector reports include intentional fraction structures, already adequate widths, distinct complete tables, deliberate breaks and centred working; they are not a count of unresolved defects. See `conventions-summary.txt` in that run directory for the saved revisions, actual page selections, baseline warnings and two resolved label choices.

