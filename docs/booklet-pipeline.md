# Booklet pipeline — runbook

Turns a Word-era booklet into a JSON question bank and renders it to PDF, one file per
class level, with answer space / worked solutions / short answers as flags.

The schema is [booklet-bank-schema.md](booklet-bank-schema.md). This page is the order of
operations.

```text
booklet.md + booklet.docx
    │  parse-booklet.mjs            deterministic: sections, questions, parts, cells,
    ▼                               figures + the crops pandoc discarded
 parsed/<section>.json  (skeleton: ids, tiers, origins, figures fixed; text null)
    │  build-transcribe-tasks.mjs   one agy task per section — fill the nulls
    ▼  run-gen.mjs
 out/<section>.cards.json
    │  collect-transcribe.mjs       refuses any structural departure from the skeleton
    ▼
 booklets/bank/<bank>/cards|blocks/<section>.json
    │  run-fidelity-check.mjs       a different model reads source vs JSON
    ▼
 booklets/recipes/<slug>.json  ──  render.mjs  ──▶  PDFs
```

## Why the pipeline is shaped this way

**Everything provable is proved, not judged.** The parser settles what is mechanical —
which questions exist, their numbering, their tier, which pictures each shows and how Word
cropped them. The model only writes prose. The collector then rejects any output that moved
something structural. That division is what stops a question quietly disappearing between
Word and print; it caught a dropped drill cell and 32 dropped diagrams on the pilot booklet.

**The crops matter more than they look.** 45 of the pilot's 185 images are composite strips
— one PNG holding six triangles, shown as six different crops in six cells. pandoc drops
`<a:srcRect>`, so the markdown alone cannot say which slice a cell showed. The docx can, and
`lib/docx.mjs` reads it with no dependency.

## Running it

```bash
# 1. Parse (deterministic; safe to re-run any time)
node scripts/booklet/parse-booklet.mjs \
  --md "booklets/Stage 5/Trigonometry C 2_Non-Right-Angled Trigonometry.md" \
  --docx "booklets/Trigonometry C 2_Non-Right-Angled Trigonometry.docx" \
  --bank s5-trig-c-2 --out .agywork/booklet/s5-trig-c-2/parsed

# 2. Stage the images the bank actually uses into the tracked figures/ folder
node scripts/booklet/stage-figures.mjs --bank s5-trig-c-2 \
  --from .agywork/booklet/s5-trig-c-2/parsed

# 3. Build and run the transcription tasks (one per section)
node scripts/booklet/build-transcribe-tasks.mjs --bank s5-trig-c-2 \
  --parsed .agywork/booklet/s5-trig-c-2/parsed \
  --out .agywork/booklet/s5-trig-c-2/transcribe
node scripts/agy/run-gen.mjs --tasks-dir .agywork/booklet/s5-trig-c-2/transcribe

# 4. Collect into the bank (validates as it goes; nothing is written if anything is off)
node scripts/booklet/collect-transcribe.mjs --bank s5-trig-c-2 \
  --tasks-dir .agywork/booklet/s5-trig-c-2/transcribe \
  --parsed .agywork/booklet/s5-trig-c-2/parsed

# 5. Independent fidelity check, then read the report
node scripts/booklet/run-fidelity-check.mjs --bank s5-trig-c-2 \
  --parsed .agywork/booklet/s5-trig-c-2/parsed
node scripts/booklet/run-fidelity-check.mjs --bank s5-trig-c-2 --report

# 6. Index, validate, render
npm run bank:index
npm run validate
npm run booklet -- --recipe booklets/recipes/s5-trig-c-2.json --matrix --out-dir out/booklets
```

Steps 3 and 5 are the only ones that cost model calls, and both resume: a section with a
valid result file, or an existing `.fidelity.json`, is skipped.

## Rendering

```bash
npm run booklet -- --recipe <recipe> --variant standard --spaces --out out/x.pdf
npm run booklet -- --recipe <recipe> --matrix --out-dir out/booklets   # levels × student/teacher
```

Flags: `--spaces` `--solutions` `--short-answers` `--variant` `--all-variants` `--matrix`
`--html <file>` (dump the HTML) `--no-cache` `--strict` (exit 1 on any defect) `--headed`.

The summary on stdout is the check: `cards` must equal `expectedCards`, `tikz.failed` and
`overflow` must be empty, `missingAssets` empty. Then look at the PDF —
`pdftoppm -r 75 -png -f 1 -l 3 out/x.pdf out/preview/p` rasterises the first pages.

Compiled diagrams are cached in `.booklet-cache/tikz/`, so only the first render of a
booklet is slow: the pilot's cold render took 27s and every later variant under a second.

## Known operational limits

- **agy has a daily quota.** A run that stops with `AgyQuotaError` names the reset time;
  rerun the same command afterwards and finished sections are skipped.
- **`booklets/**/media/` is gitignored** — regenerate it with `pandoc --extract-media` if a
  bank ever needs re-staging. The bank's own `figures/` folder is tracked.
- **Word's `arrows.meta` TeX file is absent from the TikZJax bundle**, so a 404 for
  `tikzlibraryarrows.meta.code.tex.gz` appears in `missingAssets` on any booklet with a
  TikZ figure. It is pre-existing and harmless — the app requests it too, and pgf's own
  `arrows.meta` implementation is what actually loads.

## Adding a second booklet

1. `parse-booklet.mjs` with its `--md`/`--docx`, a new `--bank` slug.
2. Write `booklets/bank/<slug>/bank.json` (course, title, sourceFile, sourceDocx,
   sourceMediaDir, sections in printed order).
3. Write `scripts/booklet/batches/<slug>.json` — the candidate skill ids per section, and
   `skip` for any section with no questions.
4. Then steps 2–6 above.
