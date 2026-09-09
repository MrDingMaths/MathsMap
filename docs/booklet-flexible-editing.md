# Flexible booklet editing

Use [document editing](booklet-document-editing.md) for the current interface and [compact exercises](booklet-compact-exercise-trial.md) for new-project defaults.

Content has stable IDs, source references and logical continuation relationships. Moves retain identity; copies remap local references and retain bank pins. Cross-section edits merge through revision-checked saves. Conflicting edits require review.

Page constraints include start-on-new-page, keep-together and keep-with-next. Releasing an imported break permits reflow. Break only at safe boundaries, preserving complete arrangement rows, shared diagrams, dependencies and handwriting space. Content without a safe fit remains a layout finding; do not shrink it silently.

Numbering follows each exercise across teaching checkpoints. Source comparison follows the selected block after movement. Preview, contents navigation and PDF use the same calculated page map. All five editions remain supported; existing noncompact projects retain their settings.

Run `node --test tests/booklet-flow.test.js tests/booklet-save-merge.test.js` for identity, continuation, conversion and merge regressions. `check-flexible-booklet.mjs` exercises isolated editing; `--full` uses the legacy layout test fixture. `benchmark-pagination.mjs` measures current Linear v1 with intercepted writes. Use `check-compact-exercises.mjs --project ID` for current project edition checks; historical baseline/trial aliases are retired.
