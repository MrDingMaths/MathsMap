# Figure-free Theory cohort UI sampling

Use `figure-free-theory-cohort-ui-sampling-v1` only for plain question/solution strings in the shared Theory example container. Complete independent mathematical/source acceptance remains separate. Figures, structured content and different containers use ordinary actual inspection.

`scripts/content/campaign-ui-capture.mjs` checks every example at desktop and mobile sizes. First run `--audit-only` with the cohort skill IDs to obtain actual measurements. Save an immutable JSON array of the resulting `{path,hash}` capture references. Then run the same cohort with `--selection-hints=REFERENCE_LIST.json`; it measures the examples again and captures the first, tallest and widest representatives of each actual display/line-mode family. TeX command vocabulary alone does not split families.

```powershell
node scripts/content/campaign-ui-capture.mjs --audit-only SKILL_A SKILL_B
node scripts/content/campaign-ui-capture.mjs --selection-hints=REFERENCE_LIST.json SKILL_A SKILL_B
```

Actual per-example rows bind candidate, item, container, viewport and measured geometry, with successful mathematical rendering, visible question/working, loaded fonts and no overflow or clipping. The mechanism pins the named UI modules, math/font assets, browser binary, system fonts and both producer files. It excludes unrelated planner and campaign-ledger code.

A different native worker personally inspects the selected PNGs and supplies the explicit applicability decision. The immutable cohort proof records `captures`, the exact inspected `artifacts`, `actualRepresentativeInspection`, `applicabilityObservation`, `reviewerIdentity`, `reviewerProfile` and the retained `inspectionLineage` profile/stage references. `verifyTheoryUISampling` checks complete current independent content acceptance, current captures and dependencies, every automated row, representative selection, actual pixel declarations and the reviewer's native identity/settings. It never claims unsampled pixels were personally viewed.

Per-skill publication wrappers use this profile, the exact `skillId`, `stageHash`, `candidateHash`, `accepted`, immutable `samplingProof` reference and the same reviewer identity/profile as that proof. The campaign's explicit assertion and retention branches run the verifier before normal serialized publication. Ordinary Theory, Practice and Quiz guards remain unchanged. Source or mathematical findings keep the skill pending.

The accepted Cubic/Credit Cards pilot checked all 12 examples at both viewports and inspected six representative images, versus eight under the ordinary first/tallest-per-skill selection. The initial command-vocabulary classifier selected 21 images and was rejected. These counts establish reduced screenshot work for this pilot; overall elapsed-time or token savings remain unmeasured.
