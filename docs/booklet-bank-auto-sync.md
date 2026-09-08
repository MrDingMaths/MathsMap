# Automatic question-bank sync

Saving an original booklet automatically updates its linked bank questions and worked solutions. The 168 original Linear Relationships questions are enabled; newly created bank questions are linked to the booklet that promotes them. Duplicating an original creates a consumer of its bank questions, not a second original.

Page settings, answer spaces, local question arrangement, diagram sizes and bank classifications/teaching mappings are retained. Deleting a booklet question does not delete the bank question. A deleted bank question is not silently recreated by a later booklet save.

## Reviewing updates

Open **Bank sync** in the booklet toolbar. Pending bank updates also show a **Review updates** notice. Expand **Compare question and worked solution** for both versions, including diagrams.

- If only the original changed, saving publishes that question automatically.
- If only the bank changed, the booklet offers **Use bank version**.
- If both changed, automatic sync pauses for that question while the booklet itself still saves. Choose **Use bank version** or, in the original, **Use booklet version** after comparison.
- Other booklets keep their pinned snapshots. **Use bank version** explicitly refreshes content while retaining local layout; **Keep local version** detaches the adapted question so subsequent bank edits cannot overwrite it.

Checks run when opening/saving a booklet, when returning to the app, every 15 seconds while visible, and with **Check for updates**. Resolve updates only after saving or cancelling any current edit. Applying a version clears the local undo history to prevent an old undo from unexpectedly reapplying discarded content.

## Persistence

`booklets/question-bank/.sync/links.json` records the original project/block, shared-content baselines and bank revision for each linked question. Question revisions remain under `.revisions` for existing copies. Normal saves and explicit resolutions use the shared server write queue and rollback-capable file transactions. Stale project versions and stale resolution requests are rejected. Bank editor saves retain history and reject a changed modification timestamp.

The application server performs automatic sync. External scripts that write JSON files directly do not trigger it, and multiple independent server processes do not share the in-process write queue. Use one authoring server for this workspace. Existing adapted revision questions remain separate; teaching module and other booklet snapshots do not silently advance. New independent questions enter the bank through the existing bank-save action.

`enable-linear-bank-sync.mjs --apply` registers the accepted source without changing booklet content. `check-bank-sync.mjs` exercises the real persistence functions through an isolated browser session. Automated tests cover automatic publication, layout-only saves, conflicts, explicit updates, revision pins, graph references, missing questions, concurrent saves and transaction rollback.

Verification on 8 September 2026: all 469 tests and the production build passed. The browser check passed for reviewing and accepting a pinned update, resolving a conflict, and the narrow-screen layout. All 168 registered originals report synced; registration preserved the source booklet at revision 164.
