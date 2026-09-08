> Historical audit: the 11 pt graph requirement below is superseded by [the September 2026 typography convention](booklet-graph-typography-2026-09.md).

# Linear Relationships house-style repair ? verified 7 September 2026

Saved project revision **145**, house style **1.1.0**. All 93 source pages were audited in student and worked-solution modes. There are no unresolved rendering, page-fit, palette, table-label or cloze-capacity failures in the delivered editions.

## Repairs

- **p39 and p41:** compact question/diagram spacing retained; final graph typography meets the 11 pt minimum after SVG fitting.
- **p62?64 and p67?70:** representation arrangements tightened, empty pattern slots removed where inappropriate, tables/equations placed beside graphs, duplicate margins removed. Variable/equation and calculation working space retained. These pages required no continuations.
- **p73:** fixed the narrow question-label grid that expanded the teaching block to approximately 558 mm. The annotated equation and three explanation/graph groups now fit. Preserved the newer saved editable equation captions, mathematical clarifications, manual label positions and arrangement adjustments; enlarged the graphs to 55 mm. Minimum graph label is 12.02 pt; measured preview footer clearance is 11.95 mm.
- **p83:** graph beside its related interpretation questions; separate expected responses for ?triangles?, ?matchsticks? and the full interpretation sentence. The sentence has two handwriting lines. No continuation required.
- **p87 and p91, plus all reconstructed graphs:** grey grids, solid black axes and blue/red/green relationships, with enlarged ticks, variables, coordinates and equations. Removed inherited grayscale overrides on reconstructed graphs. Preserved instructional software screenshots and original source evidence.
- **Other audit findings:** corrected solution typography, multi-panel font inheritance, p6 crowded solution ticks, p17 table cloze capacity, p55/p88 excessive group gaps, p90 coordinate-component blanks and p92 spacing. Source evidence records were not changed.
- **Tables and cloze:** descriptive first-column labels fit on one line at normal text size; numeric columns remain compact. All **223** saved blanks have known response-specific sizing metadata (including marked representative open responses); **0** unknown-response blanks remain. Student PDFs do not show answer metadata.

Content/style changes affect source pages: 3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 30, 31, 32, 34, 35, 36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93. Shared layout repairs also apply wherever the same arrangements are used.

## Continuations

Six continuation pages: two after source p32, three after source p34 and one after source p60. Both full editions therefore contain **99 physical pages**. Source references, question labels, physical numbering and contents mapping are retained. The short-answer edition flows independently into **31 pages**.

## Acceptance results

| Edition | Physical pages | Minimum graph label | Layout / printed-PDF failures |
|---|---:|---:|---:|
| student | 99 | 11.000 pt | 0 |
| worked-solutions | 99 | 11.000 pt | 0 |
| short-answers | 31 | 11.018 pt | 0 |

- **198 preview page/mode checks**, zero issues; final merged p73 rechecked after saving. Lowest measured preview content/working-space clearance: **3.97 mm**.
- Actual print surfaces passed the same validator after fonts, images, TikZ and annotations settled. Short-answer flow additionally checks unbreakable items against its available page height.
- Poppler checks the generated PDF's word bounds, including graph text, and footer clearance before the exporter replaces the delivered file. The short-answer margin was increased after this check found a 1.42 mm clearance; the regenerated edition passes with a minimum printed-text clearance of **10.40 mm**.
- Source comparisons and rendered PDF checks cover the named repaired pages. The Studio **Print / save PDF** route was exercised with its dialog intercepted: shared QA passed and the print call was reached.
- **439 tests passed**. Production build passed (existing bundle-size advisory only). Regression coverage includes nested-container and writing-space overflow, overlapping siblings, scaled graph text, panel regeneration, wrapped descriptive labels, sentence clozes and actual PDF footer clearance.

## Persistence and future enforcement

The migration was explicit. Existing projects keep their stored version and layout; loading does not adopt 1.1.0. The save merged the latest revision, preserved newer p73 labels/geometry and saved with an expected-revision check. Pre-adoption snapshot and automatic revision history are retained.

The shared house style, production Codex transcription prompt, editing metadata, preview checks, Studio printing and command-line PDF exporter enforce the new requirements. Invalid exports fail; metrics alone are insufficient. See [House style 1.1.0](booklet-house-style-1.1.md), [human review](booklet-human-review.md) and [pedagogy contract](booklet-pedagogy-contract.md).

Re-run the full saved-project regression with the dev server running:

```powershell
node scripts/booklet/audit-house-style-v2.mjs --project=booklets/projects/linear-relationships-complete-v1.json --both --tag=review --screenshots
node --test "tests/*.test.js"
```

Audit evidence: `output/house-style-v2/acceptance.json`, `pdf-acceptance.json`, `adopted.json`, `merge-decisions.json`, rendered comparisons and test output. Each PDF has adjacent `.qa.json` and `.printed-qa.json` reports. The exporter requires Poppler's `pdftotext` on PATH.

Remaining review items: **none for this repair's rendering, page fit or house-style requirements**.
