# Complete Linear Relationships booklet

Created 6 September 2026. The active Studio project is `linear-relationships-complete-v1`, currently saved at revision 163. Open `/#/booklet?stage=projects&project=linear-relationships-complete-v1` in the running app.

On 8 September the user accepted the 93-page questions and layout. The subsequent tone edit shortened 190 solution entries without changing questions, diagrams or layout settings. The question bank and 13 reusable teaching modules are now explicitly synchronised to this revision; see [the sync receipt](linear-relationships-bank-sync.json). Future generation follows [MathsDatabase conventions and the booklet's taught methods](booklet-worked-solution-style.md). The original export and review details below describe their historical versions; existing PDFs have not been regenerated for the tone edit.

## Deliverables

| Edition | File | Pages |
|---|---|---:|
| Student booklet | [Student PDF](../output/pdf/linear-relationships-student.pdf) | 93 |
| Worked solutions | [Worked PDF](../output/pdf/linear-relationships-worked-solutions.pdf) | 93 |
| Compact independent-practice answer key | [Short answers PDF](../output/pdf/linear-relationships-short-answers.pdf) | 30 |

The student edition leaves guided-practice, checkpoint and key-idea answers hidden. The worked edition enables those teaching answers. Studio's compact short-answer mode includes independent practice and labels entries by source page; it is not a second full teacher booklet.

The saved project contains all source pages 1–93 exactly once, 168 question blocks and 595 answer-bearing parts, each with a short and worked answer. There are 155 TikZ diagram records, 159 retained image records and 131 unique referenced asset paths, all present locally. The project contains 233 proposed block-level curriculum mappings across 12 skills.

## Provenance and archive

The working booklet combines 45 exact-lane pages with 48 retained batch-draft pages, carrying forward corrected pilot content and source overrides. Question continuations retain their source references, including question 2a–p across pages 17–20. Detailed origins are in [provenance.json](../output/linear-complete/provenance.json).

All three existing saved pilots and their revision histories were archived: 32 files, copied and SHA-256 verified before removal from the active project directory. See the [archive and restoration instructions](../booklets/archives/2026-09-06-linear-pilots/README.md). Source evidence, assets and historical exports remain available at their existing paths.

The original full-import records and raw batch candidates were preserved. This Studio assembly does not change exact-lane adoption or imply import approval. No remote transcription or bank publication was performed.

## Repairs and verification

Local repairs filled missing answers, corrected arithmetic and mathematical wording, supplied plotted solutions, recovered diagrams stored in unsupported fields, repaired table and maths formatting, and adjusted page layouts. Two renderer fixes keep multiple beside-question diagrams from overlapping and prevent short-answer section headings from splitting across PDF pages.

All student and worked pages were visually reviewed across rendering passes; final changed pages were rechecked against the earlier reviewed render. All 30 final short-answer pages were visually inspected. Expanded browser print metrics report no collisions for the final exports. A focused browser check confirms the two stacked diagram groups on source page 60 remain visible and do not overlap. The project/question structural checks pass, with no missing answers or assets. The application test suite passes **404 tests**, and the production build succeeds with existing CSS/bundle warnings.

See [project verification](../output/linear-complete/verification.json), [PDF verification](../output/linear-complete/pdf-verification.json) and the repair reports in `output/linear-complete/`.

## Review status

This is a complete assembled and exported review draft, not a record of human mathematical or curriculum approval. The audit retains 159 `unreasoned-raster` flags: source images are still used, and their retention/native-conversion decisions need review. Proposed curriculum mappings and diagram decisions remain unapproved. Visual and structural checks do not independently certify every mathematical answer.
