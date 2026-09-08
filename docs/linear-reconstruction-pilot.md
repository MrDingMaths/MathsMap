# Linear relationships reconstruction pilot

This pilot uses source pages 1, 2, 3, 7, 9, 13, 14, 16, 24, 28, 29 and 33. The original 93-page import, evidence, candidates and approval state are preserved. The pilot is a separate draft; adoption and publication are outside this phase.

Subsequent user decision (6 September 2026): use Astra Low through Codex for all new transcription. This is now the production default, without changing the historical benchmark result or repinning old runs. The current editable pilot also aligns question numbers with their stems and omits O at Cartesian origins. See [Finish editor usability](handoffs/finish-editor-usability.md) for the next work and current verification state. Earlier exported PDFs below document the earlier inspected revision.

## What the pipeline review found

- Draft preview deliberately disabled its editing controls, and the server only saved merged transcription. Draft saves now use persistent root overrides with both a base content hash and review revision. A stale save returns HTTP 409. Merge/refresh reports conflicting overrides instead of silently applying them to a changed root. Saving an edit never approves a page.
- The legacy exact-v2 prompt preferred retained source graphics, and the direct execution contract reinforced image retention. That explains why reconstructible mathematics survived as images. The new isolated source-v3 pipeline has separate editable reconstruction and full-manual TikZ stages. Old pinned runs keep their historical inputs.
- Descriptive source metadata doubled as visible band headings. The renderer now separates visible subtitle from description and draws the review checkbox beside the skill in the body.
- Markdown tables discarded horizontal alignment and used a generic full-width, top-aligned, bold-first-row presentation. Source-v3 uses editable structured tables with physical dimensions, row heights, cell alignment/rotation/shading/emphasis, and cell-ID-based SVG arrows/circles/boxes.
- The document model and annotation implementation were changed in standalone MathsEditor first, then synced as a pinned 1.1.0 release into MathsMap.
- A successful JSON parse or TikZ compilation does not establish mathematical or visual fidelity. Initial rendering exposed duplicated footer content, full diagrams incorrectly declared as overlays, omitted worked fields, oversized number lines and overflowing pages. These remain initial-output defects in the comparison.

## Reproduce the isolated comparison

The manifest and immutable initial outputs are under `.booklet-work/reconstruction-benchmarks/linear-three-model-v1`. It records common packet evidence and hashes, prompt hashes, renderer file hashes, requested settings, observed provider settings where exposed, invocation logs, usage and failures. The output contract is embedded in the pinned reconstruction prompt; it is identical across transports. The frozen source/editor snapshot is in `frozen-renderer`; unchanged TikZJax assets are identified by manifest hashes.

Commands:

```powershell
node scripts/booklet/benchmark.mjs prepare .booklet-work/full-imports/linear-relationships-studio-v1 NEW_OUTPUT_DIRECTORY
node scripts/booklet/benchmark.mjs run NEW_OUTPUT_DIRECTORY
node scripts/booklet/render-benchmark.mjs NEW_OUTPUT_DIRECTORY
node scripts/booklet/benchmark-review-materials.mjs NEW_OUTPUT_DIRECTORY
node scripts/booklet/score-benchmark.mjs NEW_OUTPUT_DIRECTORY
```

Preparation refuses an existing output directory. Execution has one attempt per packet/stage, 900-second invocation limits, one active invocation per arm, packet-wise rotated launch order, immutable responses and retained failures. Resuming never silently retries an existing failed stage. An integration failure is distinct from a successful model invocation.

Codex receives the common student/context/teacher images as attachments; AGY uses its existing restricted image-reader transport on those same files. Both have the same candidate Word excerpts, original asset paths and teacher evidence. Codex model/effort are explicit CLI arguments; model identity is not independently attested when the event stream does not expose it. This is a configured-system pilot, not a statistically conclusive model ranking.

## Review procedure

`docs/linear-pilot-source-checklist.json` records source-based criteria and feedback deferred beyond the pilot. `scripts/booklet/pilot-reference.mjs` contains independently calculated reviewer answers, never included in model packets. Initial candidates are rendered in student, short and worked modes using the frozen renderer. Anonymous sample labels are assigned once, with a separate key. The reviewer can also see execution timing and automatic arm metrics, so this is not claimed to be a fully blinded independent human study.

A page passes initially only when it has no critical or major defect, including shared renderer defects. Missing candidates are failed coverage, not zero-defect pages. Common-page fidelity comparison orders critical, then major, then minor defects. Full-pilot acceptance also requires complete coverage. Runtime is summed invocation time, including failed calls, not wall-clock time with concurrent arms. Costs are reported only if provided; usage categories from different transports are not assumed equivalent.

## Verification completed before initial runs

- 388 application tests passed.
- Production Vite build passed.
- Standalone MathsEditor document-model tests passed.
- Editor browser checks covered text, mathematics, history, table changes, image crop, clipboard, reload, read-only and print behavior.
- A dedicated browser regression verified the formerly disabled draft edit path, revision/base-hash save payload, and annotation movement after table resizing.

## Completed initial comparison

All configured jobs reached a terminal result. Only 15 of the requested 36 page candidates completed; seven failed packet invocations left 21 pages unavailable. No failed call was retried, silently repaired or replaced. All 15 available candidates were rendered and scored in all three modes before pilot correction.

| Arm | Completed pages | First-pass accepted / 12 | Model critical / major / minor | Shared defects | Failed packet calls | Summed invocation seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A: Astra low | 9 | 0 | 0 / 24 / 4 | 3 | 1 | 2728.5 |
| B: Luna max | 3 | 0 | 0 / 3 / 1 | 1 | 3 | 2929.5 |
| C: Gemini high | 3 | 1 | 0 / 1 / 2 | 1 | 3 | 1720.1 |

There is **no satisfactory winner**. Only pages 1, 2 and 3 are available across every arm. On that narrow common subset the model-attributed fidelity order is C, B, A; it does not establish performance on the mathematical/table-heavy pages. Astra completed more pages, but those outputs still required substantive repair. Totals across unequal coverage must not be used as a fidelity ranking.

A packet 4 timed out. B packet 2 returned malformed JSON, and packets 3 and 4 timed out. C packet 2 was interrupted; packets 3 and 4 reached its output-token limit. The three-page verbose document contract is therefore a practical reliability problem alongside model fidelity. Successful compilation also concealed inappropriate overlay declarations and missing answer representations. Changing models alone does not address the original editor and renderer defects.

The [source/A/B/C comparison](../output/linear-pilot/comparison.html) includes every pilot source page, all available initial outputs, selectable student/short/worked modes and the defect matrix. [Raw comparison metrics](../output/linear-pilot/comparison.json) retain timings, reported usage, failures and per-page defects. Actual costs were not provided. Per-arm correction effort was not measured comparably, so it is not used to rank the arms.

The [protocol audit](../output/linear-pilot/protocol-audit.json) supplements the immutable benchmark manifest with the embedded-schema and frozen-renderer hashes and audit limits. Codex events do not attest the actual serving model; requested model/effort are recorded. AGY reports its model but its read progress omits file-path arguments. Evidence isolation was enforced through the input contract and transport restrictions, not demonstrated as an audited operating-system boundary. Review labels were anonymised, but arm-identified diagnostics were visible during debugging; this is not a fully blinded independent review.

## Corrected review pilot and subsequent pipeline fixes

The separate pilot contains eight corrected A candidates (pages 1, 3, 7, 9, 13, 14, 16, 24), one corrected C candidate (page 2), and three explicitly labelled source-based manual reconstructions (28, 29, 33). Those final three pages are not model successes. [Corrections and origin hashes](../output/linear-pilot/corrections.json) record the origin and subsequent changes for every page. Initial candidates and scores remain unchanged.

After initial scoring, MathsEditor was updated in its standalone project and synced as pinned release **1.1.1**. The additional table controls cover margins, border styles, per-cell borders, annotation label boxes and card arrangements. The live booklet renderer also supports shared answer plots, compact answer columns, side-by-side worked rows, explicit Verify labels, typeset cover/header mathematics and fixed source-page project exports. A print stylesheet precedence bug that added a blank thirteenth page was corrected.

The new `source-reconstruction.mjs` entry point makes fresh source reconstruction explicit and preserves historical imports. Its source-v4 prompts use sparse JSON and default to one page per packet, retain the full TikZ instructions and clarify source order, nonempty answers, occurrence ownership and full-figure versus overlay contracts. **These post-score v4 improvements have not been tested by another model comparison.** Astra Low is now the default by the user's subsequent instruction; no model was adopted automatically from the scores.

```powershell
node scripts/booklet/source-reconstruction.mjs prepare SOURCE_RUN NEW_OUTPUT --arm A --pages 1,2,3
node scripts/booklet/source-reconstruction.mjs run NEW_OUTPUT
node scripts/booklet/source-reconstruction.mjs check CANDIDATE_JSON REVIEW_RECEIPT_JSON
```

The draft project is `linear-relationships-pilot-v1`, with persistent source identities and no approvals. Source page boundaries are retained; exported page numbers run from 1 to 12 with a pilot-specific contents list. The [editable project JSON](../output/linear-pilot/project.json) is also available separately. Original source files, import candidates and user edits were preserved. Feedback outside these twelve pages is recorded in the source checklist for later recovery.

Final exports: [student](../output/pdf/linear-pilot-student.pdf), [short answers](../output/pdf/linear-pilot-short.pdf), [worked solutions](../output/pdf/linear-pilot-worked.pdf). Each PDF contains exactly twelve A4 pages. All 36 exported pages were inspected against the source and independent answer reference, including actual plotted coordinates, line equations/scales/bounds, substitutions, scaffolds, colours and answer visibility. Thin answer rules were additionally checked at higher raster resolution. Practice reflow is compact; answer-only modes intentionally retain source-page boundaries. This is a reviewable pilot, not a claim of pixel-identical reproduction or publication approval.

The [review receipt](../output/linear-pilot/review.json) records final candidate, source-image, PDF and page-image hashes, all three visual checks per page and independent mathematics checks. It records elapsed wall time for the combined correction/export/QA work, rather than inventing per-arm hands-on effort. The [review gate](../output/linear-pilot/review-gate.json) reports `readyForUserReview: true`, `approved: false`, and no hazards. The [browser verification](../output/linear-pilot/browser-verification.json) confirms twelve pages, one cover, twelve footers, no footer/page collisions or rendering errors, centred table cells, the five-column card grid, 26 student annotation boxes, single shared answer plots and correct tick/cross visibility and colours.

Final validation: **394 application tests passed**, production build passed, three standalone MathsEditor model tests passed, editor browser checks passed, and the draft-edit/conflict payload plus annotation-resize browser regression passed. No adoption, full 93-page repair or publication was performed.
