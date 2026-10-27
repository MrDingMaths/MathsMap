# Retired cross-booklet duplicate tooling

Retired at James's request on 27 October 2026. `originals.zip` is an inert, byte-verified archive, not application source. Nothing imports it; normal application, test and import scans do not execute or enumerate its contents.

The archive contains the original shared-content panel, preview, server/CLI modules, automatic cross-booklet discovery/materialisation tools, their tests and documentation, the complete shared registry and revision snapshots (including the ten newly identified groups), plus original integration-file snapshots and local registry/index evidence. `SHA256-INVENTORY.json` inside the ZIP lists every original path, byte count and SHA-256. Archive SHA-256: `037fce3612047046504e3bc6a8233894b4e6d6417a2062c0d44d24d7d41a9f43` (411 entries, 2,733,840 compressed bytes).

Removed active behaviour: cross-booklet discovery, author-copy suggestions, shared-content badges/panel, shared comparison/decision routes, save-time registry updates, automatic refresh/catch-up/propagation and related CLI/page-check tools. Booklets retain their own content and presentation; no master, source, revision history or bank record is migrated.

Retained deliberately: duplicate identification **within a booklet** during review; **full question-bank duplicate matching** and its conflict decisions, owner/consumer synchronization and revision pins; explicit historical review reuse and source provenance; source-page continuations; ordinary copy/duplicate editing commands; duplicate-ID and other integrity validation.

## Restore

Do not extract into a live working checkout. Extract to a temporary folder and verify each entry against `SHA256-INVENTORY.json`. Review the retirement commit and reverse only its integration changes in an isolated checkout, then restore the exclusive modules and `booklets/shared-content` registry from the ZIP. Original mixed files include older unrelated working changes: do not overwrite current application files wholesale. Use their snapshots only to recover the retired integration deliberately. Restore registry and revision objects together, at a supported idle boundary, and rerun tests/build before enabling producers. Never run an archived CLI against the current library casually.

Local task evidence and the full uncompressed recovery copy remain under `.booklet-work/duplicate-tooling-retirement-20261027/`; those local files are not the Git backup. The ZIP and this note are the durable, scoped Git archive. No replacement duplicate-management system was introduced.
