# Automatic question-bank sync

Saving an original booklet automatically updates its linked bank questions and worked solutions. The 168 original Linear Relationships questions are owned by the canonical **Linear Relationships v1** (`booklets/projects/linear-relationships-v1.json`); newly created bank questions are linked to the booklet that promotes them. Duplicating an original creates a consumer of its bank questions, not a second original.

The 149 whole practice questions from accepted **Index Laws revision 200** are also registered originals, owned by `booklets/projects/index-laws-complete-v1.json`. Revision 201 adds their bank links and individual skill/difficulty classifications. Teaching reviews, activities, Key Ideas and guided practice were excluded from this import. The source-to-bank receipt is `booklets/provenance/index-laws-complete-v1/bank-import.json`. `node scripts/booklet/import-index-bank.mjs` verifies an existing import without writing or duplicating questions; first publication requires `--apply` and uses an isolated staging store followed by a checked transaction.

Page settings, answer spaces, local question arrangement, diagram sizes and bank classifications/teaching mappings are retained. Deleting a booklet question does not delete the bank question. A deleted bank question is not silently recreated by a later booklet save.

The 91 whole practice questions from **Non-Right-Angled Trigonometry v1 revision 167** are registered originals, owned by that project. Revision 168 adds bank links and individual classifications while preserving content, ordering and local presentation. Teaching content is excluded. See the [import acceptance record](../booklets/provenance/non-right-angled-trigonometry-v1/bank-import.md) and its source-to-bank receipt. The reusable `scripts/booklet/import-project-bank.mjs` route takes `--project`, `--assessments` and `--out`; `--apply` publishes the verified stage, and a completed rerun verifies without writing.

When synced text changes between plain text and editor paragraphs, the destination's arrangement references are reconciled with the new content. Existing layout item IDs, spacing and sizing are retained; extra paragraphs receive additional items. Unresolved references stop the sync write with a review error instead of saving a broken layout. Repeated publication reuses previously mapped content IDs.

## Reviewing updates

Open **Bank sync** in the booklet toolbar. Pending bank updates also show a **Review updates** notice. Expand **Compare question and worked solution** for both versions, including diagrams.

- If only the original changed, saving publishes that question automatically.
- If only the bank changed, the booklet offers **Use bank version**.
- If both changed, automatic sync pauses for that question while the booklet itself still saves. Choose **Use bank version** or, in the original, **Use booklet version** after comparison.
- Other booklets keep their pinned snapshots. **Use bank version** explicitly refreshes content while retaining local layout; **Keep local version** detaches the adapted question so subsequent bank edits cannot overwrite it.

Checks run when opening/saving a booklet, when returning to the app, every 15 seconds while visible, and with **Check for updates**. Resolve updates only after saving or cancelling any current edit. Applying a version clears the local undo history to prevent an old undo from unexpectedly reapplying discarded content.

Linked exercise difficulty labels and reasoning scores refresh automatically on load, save and these checks. This bank-owned display metadata updates independently of content review and preserves question order, layout and unsaved edits. Loading/checking does not create a project revision; the current ratings are persisted on the next save. Detached or missing bank questions keep their existing ratings.

## Persistence

`booklets/question-bank/.sync/links.json` records the original project/block, shared-content baselines and bank revision for each linked question. Question revisions remain under `.revisions` for existing copies. Normal saves and explicit resolutions use the shared server write queue and rollback-capable file transactions. Stale project versions and stale resolution requests are rejected. Bank editor saves retain history and reject a changed modification timestamp.

The application server performs automatic sync. External scripts that write JSON files directly do not trigger it, and multiple independent server processes do not share the in-process write queue. Use one authoring server for this workspace. Existing adapted revision questions remain separate; teaching module and other booklet snapshots do not silently advance. New independent questions enter the bank through the existing bank-save action.

Original-owner registration for accepted Linear and Index Laws content is complete. Use the shared bank transaction helpers for future publication. `check-bank-sync.mjs` exercises persistence and conflict handling in an isolated browser session; automated tests cover automatic publication, layout-only saves, conflicts, explicit updates, revision pins, missing questions and transaction rollback.

Verification on 8 September 2026: all 469 tests and the production build passed. The browser check passed for reviewing and accepting a pinned update, resolving a conflict, and the narrow-screen layout. All 168 registered originals report synced; registration preserved the source booklet at revision 164.
