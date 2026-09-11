# Standard booklet palette

Accepted 11 September 2026 for Index Laws, Linear Relationships, Non-Right-Angled Trigonometry, all five editions, reusable question-bank content and future transcriptions. This contract supersedes earlier instructions to preserve source shades. Preserve mathematical colour **meaning**, source evidence, content, stable IDs, classifications, local layouts and pagination settings.

| Role | Colour |
| --- | --- |
| Ordinary text, short answers and light/unfilled heading text | `#24282d` |
| Ordinary diagram marks and labels | `#000000` |
| Main section-band background | `#52769a` (desaturated blue) |
| Main section-band text | `#ffffff` |
| Blue | `#268cff` |
| Red | `#ef6068` |
| Green | `#4f9b63` |
| Orange | `#ef8b2c` |
| Table labels | `#d3e8fc` |
| Borders and grids | `#cccccc` |
| Skipped cells | `#c7c7c7` |
| Muted text | `#777777` |
| White | `#ffffff` |

Light accent fills are 20% accent mixed with white, rounded to RGB bytes: blue `#d4e8ff`, red `#fcdfe1`, green `#dcebe0`, orange `#fce8d5`. Main section bands use desaturated blue `#52769a` with white `#ffffff` text, restoring the earlier white-on-blue treatment across every current booklet and future transcription. Preserve their existing geometry. Light teaching-group headers and unfilled exercise/answer headings retain near-black text. The dedicated `headerBlue` token is reserved for section bands; mathematical blue stays `#268cff`. The shared definitions live in `public/libs/maths-editor/house-style.mjs`; `booklet-palette.mjs` supplies tokens, reviewed legacy mappings and normalization.

Apply to covers, headings, prose, inline/display mathematics, teaching responses, worked solutions, short answers, tables, cards, speech bubbles, annotations, native diagrams and graph legends. Ordinary short answers, including numbers and part labels, stay near-black; meaningful series and correctness symbols use standard accents. Both answer sections remain practice-only. Ordinary diagram labels remain 10 ± 0.1 pt at final printed size; graph ticks retain 8.5 pt and reviewed 8 pt exceptions.

Preserve relationships by role. Pink maps to red. Reviewed purple distinctions use orange and teal distinctions use blue; assign different available accents within a figure when that would merge identities. Match equation, curve and legend colours. Add dash or marker distinctions where four accents are insufficient. In Linear Relationships page 93 question 4, labels A/B/C match the corresponding blue/red/green lines. Retain source hue and original evidence separately; semantic diagram metadata cannot authorise a custom output shade. Index Laws source red `#AA0505` intentionally becomes standard red `#ef6068`.

Photographs, screenshots and retained raster diagrams remain unchanged and need separate occurrence-specific review. Do not alter historical revisions, recovery copies or original source evidence. A restored project must be normalized and pass current palette acceptance before receiving new export acceptance.

## Maintenance and acceptance

Use `node scripts/booklet/normalise-booklet-palette.mjs` to inventory proposed repairs; add `--apply --report PATH` to save through the revision-safe project/bank transaction. Preserve valid answer-diagram width signatures when palette-only source changes occur. Require a zero-change repeat run and reconciled bank links. Keep reviewed departure records in `booklets/provenance/standard-palette-2026-09-11.json`, with local detailed QA and original evidence under `.booklet-work/standard-palette/`.

The renderer, rich-text editor, saved content and TikZ preparation share normalization. Cache keys include prepared colour definitions. Booklet colour controls offer standard tokens and fills; an unresolved custom colour can remain in a draft but **fails export acceptance**. QA checks visible editable text, mathematics, SVG strokes/fills, borders and backgrounds, including covers. It excludes application controls and raster pixels. Source-colour metadata cannot expand the accepted palette.

Run `node scripts/booklet/audit-booklet-palette.mjs --report PATH` to audit stored editable paint across current projects and the reusable bank, including supplemental text and equation fields. Pair it with rendered QA; neither replaces the other. The initial rollout's [acceptance record](booklet-standard-palette-acceptance.md) records reviewed output, migration preservation, real timings and retries.

Follow the [change runbook](booklet-change-runbook.md): representative patterns first, affected pages and neighbours during development, settled inputs before final exports. Verify matched diagram/equation colours, legends, correctness symbols, teaching/worked highlights, rich-text fills, custom-colour findings, editor/cache parity, width/zoom/reopen typography, answer transitions, writing space, footer clearance and navigation. Complete all five trig editions and affected pages across the other books. Record actual phase timings, retries and cache reuse; counts alone do not establish visual acceptance.

## Main section-header follow-up

The white-on-desaturated-blue treatment passed all 15 edition exports (1,035 pages), including 99 main section-band occurrences. Visual review covered all 282 pages across the five current trig editions and all affected header pages and neighbours in the other books (483 pages total), with enlarged checks for long titles and native mathematics. Screen/print/reopen representatives, 48 relevant regressions and the production build passed. Project files remained byte-identical. See [the header acceptance record](../booklets/provenance/section-headers-2026-09-11.json); detailed local output and actual timings/retries are under `.booklet-work/section-headers/`. This renderer follow-up does not recertify older source-review metadata.
