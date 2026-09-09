# Booklet Studio: human editing workflow

The September 9 document workspace update adds direct page writing and integrated comments. See [Document-first Booklet Studio](booklet-document-editing.md) for its current interactions, persistence and verification. The chat-driven import and bank-assembly principles below remain applicable.

Current direction, 7 September 2026. This replaces the earlier review queues, AI audits, proposal lifecycle and approval gates.

## Workflow

**Codex reconstruction through chat → editable projects → reusable banks → booklet assembly → export.** Reconstruction includes transcription; there is no second transcription pass. Studio does not run models, propose changes, track sign-offs, or generate missing questions.

Open **Source reconstructions** to compare retained source pages with reconstructed content, make corrections, and create an editable booklet. Projects support direct content/diagram editing, issue notes, teaching-atom mappings, split/merge/continuation operations, undo/redo, revision history and conflict-aware saves. Humans inspect and edit material without approval checkboxes or receipts. Issue notes are informational, not publication gates.

Bank saves remain explicit. Questions need structurally valid content and classification; reusable modules require bank references for their questions. Existing booklet snapshots remain pinned to their source bank revisions. The legacy bank format uses `status: approved` as a compatibility marker for explicitly published records, not a separate review decision.

Assembly retains curriculum scope, teaching atoms, prerequisites, recipe quantities, coverage gaps, distinct question selection, and theory → guided → blocked → mixed → cumulative → challenge sequencing. Mark an inapplicable tier with **Not applicable** and a rationale. Resolve gaps by editing or selecting content, or asking Codex in chat. Inspect student, short-answer and worked-solution exports separately.

## Chat-driven reconstruction

Prepare source evidence in a new run, without a model request:

```powershell
npm.cmd run booklet:prepare -- --pdf "booklets/Source.pdf" --docx "booklets/Source.docx" --pages 1-12 --run-id source-v1
```

Add `--teacher-pdf FILE --teacher-docx FILE` for paired answer evidence. Preparation retains original documents, page images, extracted Word media and provenance under `.booklet-work/full-imports/source-v1`. It requires Poppler and Pandoc, not a Codex executable. Existing runs are never overwritten.

Have Codex reconstruct the selected pages using that evidence and the current semantic/editor contracts. Save new JSON containing `{title, pages:[{id, pageNumber, section:{title}, blocks:[...]}]}`. Blocks use the editable project types and structured MathsEditor documents; diagrams retain mathematical constraints. Questions carry stable question/part IDs and separate answer fields. Page numbers must be unique and belong to the source run. A subset is allowed for incremental reconstruction; it does not claim complete source coverage.

Create a new project:

```powershell
npm.cmd run booklet:import -- --run-id source-v1 --input ".booklet-work/source-v1-candidate.json" --project-id source-v1-editable
```

The importer validates project structure, preserves IDs and source lineage, copies referenced `evidence/...` images into project assets, and prints the Studio link. It supports historical assets beneath `lanes/exact/evidence/...` and refuses to overwrite an existing project. Source overrides use their existing content-hash checks; conflicting overrides must be reconciled. No merged lane, review receipt or fidelity audit is required. Raw candidates and historical source runs remain unchanged.

The programmatic equivalent is `importReconstruction({runId,input,projectId})` from `scripts/booklet/import-reconstruction.mjs`. Existing drafts can be materialized through `POST /__booklet/projects/materialize` with `{runId}`. Full v4 projects can also be created through `POST /__booklet/projects`.

Historical exact results can be collected with `node scripts/booklet/transcription.mjs merge --run-id ID`; only `exact` is supported. Old build/run/repair/publish lane commands and Studio action/proposal endpoints are removed. Reconstruction execution and benchmark tools remain available for explicitly requested chat work, outside the Studio UI.

The separate direct-transcription and resumable batch execution CLIs are removed. Their historical result readers, evidence verification helpers, and the reader profile shared by reconstruction benchmarks remain.

## Original decisions and replacements

| Original design | Current decision |
| --- | --- |
| Independent LLM fidelity audit required for publication | Removed; retain deterministic checks and human inspection |
| Revision-bound AI proposals with accept/reject/undo | Removed; edits apply directly with ordinary editor undo |
| Separate content, mapping, sequence, layout and diagram approvals | Removed; retain mappings, source evidence and issue notes |
| Reusable question/theory banks | Retained with explicit saves and structural validation |
| Recipe-based assembly and coverage matrix | Retained without approval eligibility or gap generation |
| Pasted question JSON import and v2 importer | Replaced by chat reconstruction and editable projects |
| Time/correction/acceptance dashboards | Removed; diagnostic execution logs remain |
| Legacy local-storage writer and old recipe renderer | Removed; v2/v3 compatibility readers remain |

Historical proposals, approvals, metrics, raw candidates, archives and source material are preserved as evidence. Stored metadata never reactivates proposals or changes old review decisions. Prompt files hash-pinned by historical runs retain their original bytes. Public MathsMap graph proposals and the standalone MathsEditor project remain separate systems.

## Verification

Run `npm.cmd test` and `npm.cmd run build`. With Vite running, `node scripts/booklet/check-human-workflow.mjs` exercises source previews, direct mapping/split edits, undo/redo, save/reload, inert historical metadata and all three PDF modes using intercepted writes. Reports go to `.booklet-work/human-workflow-check/`; the check does not change user projects or banks.

### Implementation verification, 7 September 2026

- Full suite: 433 tests passed. Includes model, storage, routing, assembly, publication, reconstruction import, revision conflicts, lineage and compatibility regressions.
- Production build passed; Vite still reports its existing large-bundle warning.
- Human-workflow browser check passed with five intercepted saves and no browser errors. All three source previews and PDF output modes were checked; exported content pages were visually inspected. PDF totals including covers/dividers were 2 student, 1 short-answer and 4 worked-solution pages for the small fixture.
- The broader `check-studio-workflow.mjs` passed focused editing, mapping/undo, concurrent saves, assembly controls, five responsive viewport sizes and four real TikZ draft recovery cases. Its later legacy layout section stopped at the missing `page-7-q4-node` inline prompt selector. That script is not a full pass; the later layout assertions remain unverified by that run.
- Browser fixes keep the discard confirmation above embedded editor menus, restore source-comparison scroll after layout settles, show partial source reconstructions as content, and keep short-answer print backgrounds white.

Existing uncommitted work, source documents, archived projects and reconstruction evidence were preserved. Browser checks intercepted writes instead of modifying user records.
