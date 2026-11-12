# Handoff: import Cambridge Mathematics Extension 1 Year 11, Chapter 5 (12 November 2026)

This is for a new session that imports **Chapter 5, Transformations and symmetry**, of *CambridgeMATHS NSW Stage 6 Mathematics Extension 1 Year 11* (2025) as a textbook chapter through [import pipeline v2](booklet-import-pipeline-v2.md).

It is the first Cambridge chapter on v2. The earlier Cambridge imports (`cambridge-x11-ch01`–`ch04`, `ch09`) used the older three-pass route. So this run is also the cross-publisher test the [Ch 1 case study](booklet-import-v2-ch01-efficiency.md) asks for: measure it the same way.

Read first:
- `AGENTS.md`;
- the pipeline doc, especially Stage 3 and the implementation notes (layout preflight, early sample, `decide-page`);
- section 8 of the case study (the Mastering Maths Ch 2 pilot).

## Before you start

- **Shared checkout.** Check for running `lean-import.mjs`, `lean-review.mjs`, `check-compact-exercises.mjs` or export processes, and for an audit or bank batch. Don't edit `scripts/`, `src/`, `public/` or `data/` while one runs, or while this import runs (frozen renderer, inefficiency 9). Never clear run folders with `rm -rf`, `Remove-Item -Recurse` or `git clean`: they hold junctions to `node_modules`.
- **Studio on 5173** may be serving James remotely. Reuse it; never restart it. The label check, the targeted render and the sample need it.
- **Codex from Git Bash.**
  - `codex` is not on PATH. Set `BOOKLET_CODEX_BIN` to the path that `node -e "import('./scripts/content/lean-route.mjs').then(m=>console.log(m.codexBinary()))"` prints, and run every model command with the sandbox disabled.
  - A failed launch (`spawn codex ENOENT`) leaves empty attempt folders: rerun with the next `--attempt`.
- **PowerShell** for `check-compact-exercises.mjs` and the `node --test` suite. Git Bash puts Xpdf's `pdftotext` first on PATH, so printed-geometry checks fail there.
- **Write scripts and patch files with the file tool, never a heredoc or `node -e`.** Both mangle backslashes in LaTeX and regexes.
- **Models (fixed):**
  - inventory and authoring: `gpt-6.1-sol` medium (the run's transcription setting);
  - content review, ratings, sample and visual review: `gpt-6.1-sol` low (`importReviewConfiguration`).
- **Worker limit:** at most three model workers for this run.

## The source

| | |
|---|---|
| Chapter PDF | `booklets/studio-sources/Textbooks/CambridgeX11/11 Cambridge X1 2025_Part7.pdf` (62 pages; Part *n* is Chapter *n*−2). It has a text layer, unlike Mastering Maths |
| Answer book | `.../CambridgeX11/11 Cambridge X1 2025_Part21.pdf` (135 pages); Chapter 5 answers are pages **28–50** (Exercise 6A starts on page 51) |
| Run and project ID | `cambridge-x11-ch05` (no run or project exists yet) |
| Title | "Cambridge Mathematics Extension 1 Year 11 — Chapter 5: Transformations and symmetry" (the form `ch01`, `ch03`, `ch04` and `ch09` use) |

**Pages**, from the text layer (PDF page numbers).

Use exercise pages as `--pages` and teaching pages as `--context-pages`:

| Section | Teaching (context) | Exercise (practice) | Answer pages |
|---|---|---|---|
| 5A Translations of known graphs | 1–5 | 6–10 | 28–32 |
| 5B Reflection in the y-axis and x-axis | 11–13 | 14–17 | 32–36 |
| 5C Even and odd symmetry | 18–19 | 20–22 | 36–38 |
| 5D Horizontal and vertical dilations | 23–27 | 28–31 | 38–40 |
| 5E The absolute value function | 32–35 | 36–38 | 40–43 |
| 5F Composite functions | 39–40 | 41–44 (Exercise 5F starts part-way down page 41) | 43–44 |
| 5G Combining transformations | 45–47 | 48–51 | 44–46 |
| 5H Continuity and piecewise-defined functions | 52–55 | 56–58 | 46–49 |
| Chapter 5 review | — | 59–62 | 49–50 |

**Confirm each topic's answer pages on the page images before inventory.** In the Ch 2 pilot an estimated topic page range cost a failed `finish` start. C9 now stops on a partial answer-page search, but setting the pages right first is cheaper.

**Chapter-specific risks:**
- **Graph-heavy.** Most answers are sketches of transformed graphs, so expect a large TikZ workload and a high label-collision rate. Run Studio's label check after every assembly. The sample and `finish` both run it.
- **Difficulty headings.** Cambridge exercises print FOUNDATION, DEVELOPMENT and CHALLENGE. These are on the authoring heading list (unlike Mastering Maths' "Fundamentals"), so authors should own them. C1 covers any that are missed.
- **Curves and solids.** Circles and ellipses can trip the 3D solid-visibility audit ("No supported solid topology"). For a plainly 2D graph, record a review in `RUN/visibility-reviews.json`, keyed by the diagram code hash with status `accepted` and a reason, and pass `--visibility-reviews`. A review is bound to the code hash, so re-record it after any edit to that diagram.

## Steps

All commands run from the repository root, with `R=.booklet-work/full-imports/cambridge-x11-ch05`.

1. **Prepare.**
   - Write a config file with `title`, `contentScope: "practice-only"`, `track: "textbook"`, `sourceEvidenceMode: "pixels"`, `settings: {category: "Import review", questionOrder: "source"}`, `reviewRoute: "lean-review-v1"`, `authoringPreferences: "house-presets-v1"` and a `cover`.
   - Copy the shape of `.booklet-work/full-imports/mastering-maths-adv11-ch02/config.json`.
   - Run `npm run booklet:prepare -- --pdf "<Part7>" --pages 6-10,14-17,20-22,28-31,36-38,41-44,48-51,56-62 --context-pages 1-5,11-13,18-19,23-27,32-35,39-40,45-47,52-55 --teacher-pdf "<Part21>" --teacher-pages 28-50 --run-id cambridge-x11-ch05 --config FILE`.
   - Check that the manifest records `importPolicy: "import-v2"` and `track: "textbook"`.
2. **Config for inventory.** Copy the config to `$R/config.json` and add:
   - `topics` (id, title, `start`/`end` exercise pages, `teacherPages` from the table, `classificationSkillIds`) and the top-level `classificationSkillIds`;
   - a `pageEvidence` note per page about Cambridge's FOUNDATION/DEVELOPMENT/CHALLENGE headings and the answer book's exercise labels.

   Candidate skills (check each against `data/skills.json`): `transform-translations`, `transform-reflections`, `transform-dilations`, `apply-combined-transformations`, `order-of-transformations`, `describe-transformations-from-equation`, `graph-function-transformations`, `reflect-function-graphs`, `dilate-function-graphs`, `parabola-transformations`, `hyperbola-transformations`, `circle-equation-general`, `graph-semicircles`, `symmetry-of-graphs`, `even-odd-functions`, `absolute-value-definition`, `graph-absolute-value`, `express-abs-as-piecewise`, `solve-absolute-value-equations`, `solve-absolute-value-inequalities`, `composite-functions`, `composite-function-equations`, `domain-range-composite-function`, `continuity-discontinuity`, `interpret-piecewise`, `graph-piecewise`.
3. **Inventory:** `node scripts/booklet/lean-import.mjs inventory --run-id cambridge-x11-ch05 --config $R/config.json --pages <exercise pages>`, run in the background.
4. **Sample pages:** `node scripts/booklet/lean-import.mjs sample-pages --run-id cambridge-x11-ch05`. Author the recommended pages; it includes whole continuation chains. Replace the inventory notes with authoring notes first: the Ch 2 note is in `.../mastering-maths-adv11-ch02/config.json`, including the graph-label lesson and the "one block per printed question" rule.
5. **Author the sample, then assemble.**
   - Author: `lean-import.mjs author --pages <recommended>`.
   - A failed assignment with output takes the local patch route: `run-workflow.mjs attempt-context ... --out FILE`, then `repair-attempt --attempt 2`. Use `$packet`/`/inventoryMappings` for a mapping fix. Then rerun that page with `--attempt 2`; no model call is made.
   - Assemble: `node scripts/booklet/assemble-semantic-packets.mjs --run-id cambridge-x11-ch05 --pages <same> --config $R/config.json --out $R/sample.project.json --project-id cambridge-x11-ch05`.
6. **Render and review the sample.**
   - Render: `lean-import.mjs sample --run-id cambridge-x11-ch05 --project cambridge-x11-ch05 --project-file $R/sample.project.project.json --out $R/early-sample --visibility-reviews $R/visibility-reviews.json`. This applies the preflight fixes and fails on label collisions, nested questions (C8), partial answer-page searches (C9) and missing editions.
   - Review: `lean-review.mjs sample-review --run-id cambridge-x11-ch05 --project-file $R/sample.project.project.json --sample $R/early-sample`.
   - **Repairs:** write `lean-review repair --corrections FILE` patch files (`{corrections:[{id,reason,patches:[{targetId,field,original,corrected}]}]}`), never direct edits. Keep each file in `$R/repairs/`; you will re-apply them to the full candidate. Render each new sample into a **new** folder.
   - Fix shared causes in shared code before bulk authoring (and say so in a commit), then freeze `scripts/` and `src/`.
7. **Bulk author** the remaining exercise pages. Then assemble pages 6–62 (practice pages only) to `$R/candidate.json`, and re-apply the sample correction files to `$R/candidate.project.json`.
8. **Finish:** `node scripts/booklet/lean-review.mjs finish --run-id cambridge-x11-ch05 --project-file $R/candidate.project.json --project cambridge-x11-ch05 --visibility-reviews $R/visibility-reviews.json`, run in the background. Its state then fixes its input.
   - **Repairs** go to `$R/lean-review/finish/candidate.json` through `lean-review repair`. Resume `finish` with the same command.
   - **Export 3** needs `--regenerate-reason` naming the diagnosed causes. If `finish` stops with no new export, read the blockers: loop refusals are reported now.
   - **A visual verdict the pixels contradict** goes to James with a full-resolution crop. Record it only on his word: `lean-review.mjs decide-page --run-id cambridge-x11-ch05 --exports DIR --edition E --page N --decided-by James --reason TEXT --evidence FILE`.
9. **Measure:** `node scripts/booklet/import-run-metrics.mjs --run-id cambridge-x11-ch05 --out FILE`. Compare per 100 blocks with Mastering Maths Ch 2 (case study §8):
   - fresh inspections ≤ 250;
   - visual input ≤ 4.0 M tokens;
   - content re-reviews ≤ 8;
   - ≤ 3 full exports;
   - findings caused by repairs ≤ 3;
   - 0 one-off scripts in the run root.

   Add a short results section to the case study, and record any coordinator errors as process lessons.
10. **Studio and bank.** `finish` doesn't publish a textbook to `booklets/projects`. Ch 1 was created there with a checked publish (`.booklet-work/full-imports/mastering-maths-adv11-ch01/publish-verified-chapter.mjs`: `prepareProjectWrite`, then `saveBookletProject(..., {create:true, expectedRevision:0})`).
    - Do it only when `finish` reports `deliverable: true`, and keep `library.category: "import-review"`.
    - Bank publication is separate and on James's request ([bank import pipeline](booklet-bank-import-pipeline.md)).
11. **Commit** with explicit paths after `npm run repo:check`. Prune the run folder only when nothing is running (`npm run booklet:storage -- exports`, preview, then `--apply`).

## Known open items (not part of this import)

- **Mastering Maths Ch 2** (`mastering-maths-adv11-ch02`) waits for James's decision on the Question 3(b) "missing x-axis" verdict. The full-resolution raster shows the axis present. It isn't published.
- **Pre-existing test failures**, unrelated to the import tools:
  - `booklet-import-completion` "open requests do not accept whole blocks" (`polish/guards.mjs`);
  - two `booklet-inactive-cloze-export` tests (square-root branch hash pin);
  - `booklet-arrangement-print` under Git Bash only (`pdftotext`).
