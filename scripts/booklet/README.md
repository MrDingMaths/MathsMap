# Booklet Studio

For full-booklet transcription, header terminology and the content-first human
review process, see [Human review workflow](../../docs/booklet-human-review.md).

Booklet Studio is the local MathsMap worksheet workflow for selecting approved practice questions and assembling clean A4 output in the MathsDatabase style.

## Local-only question bank

The question bank is a JSON file set under \`booklets/question-bank\`, served by the Vite development server. There is no live database, authentication, cloud storage, or deployment path in this workflow.

Canonical questions use \`mathsmap-practice-question-v3\`. They have UUID-style IDs, no source/provenance fields, no marks, and a hierarchy of \`question\`, \`group\`, and \`part\` nodes. Source PDFs, rendered pages, and question-to-page mappings are retained only in the local import job under \`.booklet-work/practice-imports\`.

Classification follows the MathsMap taxonomy: course → topic → dot point/subtopic → skill. Difficulty is derived from an integer reasoning score from 0 to 100:

- 0–24 Foundation
- 25–49 Development
- 50–79 Mastery
- 80–100 Challenge

The score is intended to reflect reasoning demand and dependent decisions, not marks alone.

## Import and review

Start the dev server and open:

\`http://localhost:5173/#/booklet\`

Choose source files to render them locally, copy the generated prompt, and paste an AI result matching \`scripts/booklet/practice-question-schema.json\`. The active prompt pipeline is in \`scripts/booklet/prompt-pipeline.mjs\` and exposes versioned transcription, TikZ, reasoning-score, and most-advanced-skill prompts. Review shows the retained source page; approval writes only the source-free canonical question to the local bank.

The transcription prompt requires exact original wording, text transcription for text-dominant images, explicit LaTeX, leaf-only answers, and actual source-derived solution sketches. It does not permit fabricated subparts, redundant wording, marks, or source metadata inside question objects.

## Pilot bank and PDF export

The pilot bank was migrated with the reversible script:

\`node scripts/booklet/migrate-pilot-v3.mjs\`

The old records are kept in the timestamped \`.booklet-work/v3-migration-backup-*\` directory. Export the three canonical pilot PDFs with the dev server running:

\`node scripts/booklet/export-practice-pdfs.mjs --base http://127.0.0.1:5173 --out-dir output/pdf\`

The exporter writes questions-only, short-answer, and worked-solution PDFs. Answer spaces are blank MathsDatabase-style rectangles in the screen preview and have no internal lines in print. Diagram widths are stored as millimetre values and can be resized from the preview or structured editor.
