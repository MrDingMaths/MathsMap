# Booklet Studio and MathsMap sources

The two source collections have different purposes. Editing a Studio project does not edit the original source files or the MathsMap site content.

| Folder | Purpose |
| --- | --- |
| [projects/](projects/) | Current editable Booklet Studio projects. Open these through Studio; save through its revision-checked project/bank transaction. |
| [studio-sources/](studio-sources/) | Original PDFs and Word documents for Studio, grouped by booklet topic. |
| [mathsmap-sources/](mathsmap-sources/) | Stage-organised Markdown source booklets and their extracted media for building MathsMap content and skills. |
| [question-bank/](question-bank/) and [module-bank/](module-bank/) | Studio's reusable question and teaching libraries. Bank revision baselines can still be live dependencies. |
| [provenance/](provenance/) | Durable source reviews, corrections and acceptance records. |
| [proposals/](proposals/), [QUEUE.md](QUEUE.md), [PROMPT.md](PROMPT.md), [TRIAGE.md](TRIAGE.md) | MathsMap atomisation workflow and its history. |

The site uses `data/`, `public/content/` and `public/quizzes/` as its generated/runtime content. Original source booklets remain useful for corrections, teaching methods and regeneration; successful site generation is not a reason to delete them.

Place new Studio source documents in `studio-sources/<topic>/`. Place new MathsMap source material in `mathsmap-sources/<stage>/`, retaining the relative paths to its media. Keep editable projects in `projects/`; do not place PDF exports in either source collection.

`public/booklet-assets/` contains referenced Studio assets. `.booklet-work/full-imports/` contains local source evidence still used by Compare source. Local rendering/test output belongs in `.booklet-work/<run>/` or `output/`. Recovery material and automatic project histories are local, not release files.

[sources.json](sources.json) records the 12 September 2026 relocations and original PDF/Word hashes. Historical provenance and completed batch files keep their original paths; the generation tools resolve those known old names to the current locations. The source files themselves were not rewritten.

See [the storage audit and retention proposal](../docs/booklet-storage.md) before cleanup. Do not blanket-delete `.booklet-work/`, `media/`, or bank `.revisions/`.
