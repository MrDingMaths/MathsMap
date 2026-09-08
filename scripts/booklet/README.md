# Booklet Studio

Current workflow: **Codex reconstruction through chat -> editable projects -> reusable banks -> assembly -> export**.

See [the human editing workflow](../../docs/booklet-human-workflow.md) for source preparation, reconstruction JSON import, compatibility, original design decisions and verification commands.

Studio has no AI execution controls, proposals, approval tracking, pasted question JSON import or workflow measurement dashboard. Bank saves remain explicit. Technical validation, issue notes, source comparison, undo/redo and revision conflict protection remain.

```powershell
npm.cmd run booklet:prepare -- --pdf SOURCE.pdf --docx SOURCE.docx --pages 1-12 --run-id source-v1
npm.cmd run booklet:import -- --run-id source-v1 --input CANDIDATE.json --project-id editable-v1
node scripts/booklet/export-pdf.mjs --project-id editable-v1 --mode student --out output/student.pdf
```

PDF export needs the local Vite server. Modes are `student`, `short`, and `worked`. The question bank uses `mathsmap-practice-question-v3`; projects use `mathsmap-booklet-project-v4`. Older projects remain readable through compatibility normalization.


House-style 1.1.0 exports use the shared preview/print validator and a final Poppler geometry gate. `pdftotext` must be on PATH. Failed checks leave the delivered PDF unchanged and write diagnostic `.qa.json` / `.printed-qa.json` files. Use `audit-house-style-v2.mjs --project=booklets/projects/linear-relationships-complete-v1.json --both --tag=review --screenshots` for the full saved-booklet regression. See `docs/linear-relationships-house-style-repair.md`.
