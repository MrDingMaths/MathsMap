# Reviewed repository growth

The Data Visualisation import adds one current editable project (about 5.6 MB) and durable source inventory, correction history, source mappings and acceptance records (about 9.3 MB). There are no referenced raster assets. These are current content and durable provenance under the repository storage contract.

The existing Git index is 358,294,597 bytes. The prior 350 MiB total limit leaves about 8.7 MB, which does not accommodate this authorised import. The total content allowance in `booklets/storage-policy.json` is therefore increased from 350 MiB to **375 MiB**. The 10 MiB per-file limit and existing narrow source-file exceptions are unchanged.

This allowance is for current project content and durable review records. Original PDF/Word files, detailed extracted source evidence, model logs, automatic revisions, intermediate renders and the five final PDFs remain local and are excluded from the projected release file set. No source/history deletion or archive pruning was performed.

The measured file set and policy result are recorded in [storage-review.json](storage-review.json). Its projection starts with the Git index, substitutes current working files for the shared paths touched by this import, and adds this project's deliverables. Unrelated untracked work is outside that projection and needs its own growth review when committed. The check does not stage files or create a commit.
