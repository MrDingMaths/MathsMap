# Booklet Studio workflow

**Source evidence → semantic content → editable project → optional bank publication/assembly → export.**

Projects is the single booklet workspace. Source reconstructions and historical-import creation are retired. Old import links open Projects without creating a project. Source files remain available for comparison within an existing project.

## Import and verify

Follow [direct compact import](booklet-direct-compact-import.md) for preparation, independent source inventory, explicit candidate creation and separate content/presentation/layout acceptance. Compact mode is the default; exact mode remains available when requested. Creation refuses an existing project ID. Existing projects retain their layout settings.

The PDF governs visible content; extraction can expose hidden answers and must be checked against rendered evidence. Align teacher evidence by question identity and mathematics, not page number. Keep practice answers separate from student prompts, and retain intentional teaching demonstrations. Missing or contradictory evidence remains a review finding. Never use a model's own approval labels as verification.

## Edit, reuse and export

Use [document editing](booklet-document-editing.md) for direct writing, diagrams, comments, undo/redo and revision-checked saves. Project Review provides source comparison and fidelity findings. No model execution, draft-adoption queue or historical-import browser is part of Studio.

Publish new bank questions explicitly. Subsequent saves by their owning booklet follow [automatic bank sync](booklet-bank-auto-sync.md). Preserve classifications, teaching mappings, IDs, consumer pins and local layouts; competing content changes require question-level review.

Assembly uses curriculum scope, teaching atoms, prerequisites, coverage and question selection. Teaching atoms remain distinct from public MathsMap skills. Retain dependencies and theory → guided → blocked → mixed → cumulative → challenge sequencing where applicable. Resolve gaps by editing or selecting material, or requesting authoring through chat.

Export and inspect all relevant editions using the direct-import checks. Authoring completeness, mathematical fidelity and layout are separate requirements.

## Repository lifecycle

Version current application code, reusable authoring/check tools, tests, current booklet/bank content, referenced assets and durable provenance. Keep original source documents and required evidence. Reproducible renders, logs and revision histories stay ignored. Obsolete reports and snapshots are kept locally under `.booklet-work/recovery/`, with hashes and a cleanup manifest; regression inputs live in `tests/fixtures/`.
