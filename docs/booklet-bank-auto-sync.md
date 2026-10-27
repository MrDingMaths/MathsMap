# Automatic question-bank sync

Saving an original booklet automatically updates its linked bank questions and worked solutions. The 168 original Linear Relationships questions are owned by the canonical **Linear Relationships v1** (`booklets/projects/linear-relationships-v1.json`); newly created bank questions are linked to the booklet that promotes them. Duplicating an original creates a consumer of its bank questions, not a second original.

The 149 whole practice questions from accepted **Index Laws revision 200** are also registered originals, owned by `booklets/projects/index-laws-complete-v1.json`. Revision 201 adds their bank links and individual skill/difficulty classifications. Teaching reviews, activities, Key Ideas and guided practice were excluded from this import. The source-to-bank receipt is `booklets/provenance/index-laws-complete-v1/bank-import.json`. `node scripts/booklet/import-index-bank.mjs` verifies an existing import without writing or duplicating questions; first publication requires `--apply` and uses an isolated staging store followed by a checked transaction.

The **249 whole practice questions from Indices revision 442** are registered originals, owned by `booklets/projects/stage4-indices-v1.json`. Revision 443 adds their bank links and derives difficulty bands from the retained reasoning scores; skill mappings, answers and local presentation are preserved. The approved comparison-question part c was deleted before transfer, including its saved layout references. Teaching content is excluded. Bank-only projections supply the four shared-diagram square areas to otherwise blank parts and use equivalent fraction notation in one proof. See the [source-to-bank receipt](../booklets/provenance/stage4-indices-v1/bank-import.json) and [assessment register](../booklets/provenance/stage4-indices-v1/bank-assessments-20261013.json). Repeating the checked import creates no additional records.

Page settings, answer spaces, local question arrangement, diagram sizes and bank classifications/teaching mappings are retained. Deleting a booklet question does not delete the bank question. A deleted bank question is not silently recreated by a later booklet save.

**Feedback does not block transfer (21 October 2026, user requested).** Unresolved Studio feedback alone does not prevent bank import. Preserve the flags for later action; saving subsequent question and answer repairs in the owning booklet automatically syncs them to the bank. Duplicate consumers and simultaneous owner/bank edits retain the ordinary review rules below. Feedback flags neither grant nor revoke source/content acceptance; dependency, assessment, duplicate-decision and revision-safety checks still apply. This supersedes earlier transfer instructions that treated any unresolved flag as a publication hold.

The 91 whole practice questions from **Non-Right-Angled Trigonometry v1 revision 167** are registered originals, owned by that project. Revision 168 adds bank links and individual classifications while preserving content, ordering and local presentation. Teaching content is excluded. See the [import acceptance record](../booklets/provenance/non-right-angled-trigonometry-v1/bank-import.md) and its source-to-bank receipt. The reusable `scripts/booklet/import-project-bank.mjs` route takes `--project`, `--assessments` and `--out`; `--apply` publishes the verified stage, and a completed rerun verifies without writing.

The **132 whole practice questions from Data Classification and Visualisation revision 375** are registered originals, owned by `booklets/projects/data-visualisation-1-v1.json`. Revision 376 adds bank links and individual Stage 4 skill/difficulty classifications. Parts, solutions and local presentation are retained; teaching content is excluded. See the [import acceptance record](../booklets/provenance/data-visualisation-1-v1/bank-import.md), [source-to-bank receipt](../booklets/provenance/data-visualisation-1-v1/bank-import.json) and [assessment register](../booklets/provenance/data-visualisation-1-v1/bank-assessments-20260928.json). Repeating the checked import creates no additional records.

The **33 whole practice questions from Further Transformations revision 130** are registered originals, owned by `booklets/projects/further-transformations-v1.json`. Revision 131 adds bank links and individual Stage 6 Extension 1 Year 11 classifications. Teaching remains in the booklet. Explicit bank-only equivalent fraction projections preserve source notation during owner sync. See the [import acceptance record](../booklets/provenance/further-transformations-v1/bank-import.md), [source-to-bank receipt](../booklets/provenance/further-transformations-v1/bank-import.json) and [assessment register](../booklets/provenance/further-transformations-v1/bank-assessments-20260929.json). Repeating the checked import creates no additional records.

When synced text changes between plain text and editor paragraphs, the destination's arrangement references are reconciled with the new content. Existing layout item IDs, spacing and sizing are retained; extra paragraphs receive additional items. Unresolved references stop the sync write with a review error instead of saving a broken layout. Repeated publication reuses previously mapped content IDs.

## Reuse acceptance for existing master transfers (21 October 2026, user requested)

Existing accepted Stage 4/5 master booklets transfer using their historical independent question acceptance. Stale project versions, renderer signatures, rating/classification metadata and local layout alone do not require another content review or export. The `accepted-master-content-v1` transfer profile checks actual historical lean-table or workflow-review inputs against current canonical mathematical content, including answers and diagrams. It reviews only genuinely changed or unreviewed content; preserved feedback remains actionable afterwards through owner sync. Do not renew historical acceptance timestamps or claim old model provenance as a new review. New/import-review projects retain their existing full import gates. Duplicate decisions, question dependencies, valid individual ratings and revision-safe publication remain required.

## Dependent follow-up questions (11 October 2026, user feedback)

Bank imports transfer whole question blocks, including their parts and embedded
givens. They do not automatically fetch a preceding question from wording such
as “use the previous question”. A `dependsOn` reference preserves an explicit
dependency inside a question; it does not supply another bank record's content.

Before publishing, keep a follow-up that requires the preceding task as the next
part of that complete question, with both answers and sufficient response space.
An independent question may instead embed the exact required graph, table or
definition, preserving source identities and recording the departure. References
to an earlier *method* alone need no merge when the task already supplies all its
givens. Apply the same rule to authorised pedagogy extensions. Preserve existing
bank IDs and pinned consumers when repairing an already published split.

**Append where possible (11 October 2026, user requested).** Prefer appending a
dependent follow-up to its preceding question over repeating the context in a
separate question. Keep distinct instructions and meaningful arrangements, label
all parts in one sequence, and retain both answers and source identities. Where
the task refers to two earlier questions, include both in the complete group if
their exercise and category boundaries permit it. Keep a genuinely independent
method-transfer task separate. If a meaningful boundary prevents grouping, embed
the necessary context instead.

Run `node scripts/booklet/check-question-dependencies.mjs [PROJECT] --strict`
before a bank transfer (`--json` for details). The bulk importer and individual
promotion also check the selected questions before creating or linking records.
The check reads prompts and explicit dependency IDs, never answers or comments.
Unresolved references stop publication for review; keyword matches do not merge
content. Explicit references to mathematical nodes outside the whole question
must be repaired. A self-contained method reference may retain a substantive
`sourceReview.bankDependencyReview` with `decision: "self-contained"`, `signature`
from `dependencySignature(block)` and a `note`; changing content invalidates it.
Existing accepted links are not retroactively blocked by a repeat import.

The existing authoring and content-review passes also inspect implicit shared
context, which a wording scan cannot reliably detect. No extra model call or
review stage is added. For an already published merge, the preceding bank ID is
updated; the absorbed record becomes a non-selectable draft with a supersession
history pointing to its replacement. Its record and earlier pinned revisions
remain available, and obsolete owner links are removed transactionally through
`supersedeBankQuestion` after the booklet's revision-safe save.

For a native response table with appended parts, retain the root table and its
`flow.tableContinuation` row ownership. Set `flow.tableOnlyPartIds` to the table's
answer-owning row IDs: those responses remain represented by the table, while
appended parts print afterwards. Without this optional field, `tableOnly` keeps
its earlier behaviour. Keep the root response table outside layout wrappers.

## Reviewing updates

Open **Bank sync** in the booklet toolbar. Pending bank updates also show a **Review updates** notice. Expand **Compare question and worked solution** for both versions, including diagrams.

- If only the original changed, saving publishes that question automatically.
- If only the bank changed, the booklet offers **Use bank version**.
- If both changed, automatic sync pauses for that question while the booklet itself still saves. Choose **Use bank version** or, in the original, **Use booklet version** after comparison.
- Other booklets keep their pinned snapshots. **Use bank version** explicitly refreshes content while retaining local layout; **Keep local version** detaches the adapted question so subsequent bank edits cannot overwrite it.

Checks run when opening/saving a booklet, when returning to the app, every 15 seconds while visible, and with **Check for updates**. Resolve updates only after saving or cancelling any current edit. Applying a version clears the local undo history to prevent an old undo from unexpectedly reapplying discarded content.

Linked exercise difficulty labels and reasoning scores refresh automatically on load, save and these checks. This bank-owned display metadata updates independently of content review and preserves question order, layout and unsaved edits. Loading/checking does not create a project revision; the current ratings are persisted on the next save. Detached or missing bank questions keep their existing ratings.

## Duplicates and linking (9 October 2026, user approved)

A question is published once. Any other booklet that contains the same question links to that bank record as a consumer instead of creating a second one.

Two comparisons decide this. Neither involves a model call or a review stage, and imports are unchanged.

- **Identical** means the sync comparison (`sharedHash` in `scripts/booklet/bank-sync.mjs`) already calls the booklet question and a bank record equal. Node IDs and layout are ignored; every word, number, answer and diagram counts.
- **Same question** means equal `questionKey` (`src/lib/question-sync.js`): the same comparison without answers, a numeric source question number, inline widths or whitespace differences.

Each practice question has one outcome, checked in this order:

| Outcome | When | What happens |
|---|---|---|
| Linked | It already has a bank link | Left alone |
| Exact | Identical to a bank record, or to an earlier question in the same booklet | Linked as a consumer. Only the link is added, so printed pages cannot change |
| Held | Same question as a bank record, with a different answer, solution or inline formatting, and no decision recorded | Stays unpublished; the rest of the booklet publishes |
| New | Anything else | A new record owned by this booklet |

Decide a held question in Studio with **Promote** on that question:

- **Use existing** links it and takes the bank's answer and worked solution. The block keeps its IDs and layout. Check the pages that hold it as for any content change.
- **Keep separate** records the decision on the block (`bankDecision.of`); the next publication creates its own record. An identical question cannot be kept separate.

The similarity percentages in the same dialog are advisory. They never hold or block anything.

When a linking booklet files the question under a different primary skill, that skill is added to the bank record's secondary skills, so the question appears under both skill filters. The owner's primary skill and every consumer's sync state are unchanged, and the previous record stays under `.revisions`.

`import-project-bank.mjs` applies these outcomes. Assessments cover the new questions only, the receipt records an `outcome` for every practice question, and a rerun after decisions handles the remainder. `--resume-from` supports only booklets whose practice questions are all new. Creating a bank question in the bank editor is refused when an identical record exists.

Bank links cover published practice questions. Cross-booklet shared-content discovery and propagation were retired on 27 October 2026. Bank duplicate matching, ownership, revision pins and consumer updates remain active.

To see where one booklet or the whole library stands, run the read-only report:

```text
node scripts/booklet/bank-links.mjs [--project ID] [--json]
```

It lists, per booklet, the questions owned, consuming, to link, held and to create, and how many also exist unpublished in another booklet. Whichever booklet is published first owns those; the other links to them when it is published.

Not detected: the same question transcribed independently with different wording or structure. Use the similarity list for those.

## Persistence

New transfers omit source-confirmed category headings (such as Concept check,
Essential problems, Additional practice and enrichment) from bank prompts and
their layout slots. Questions from every category remain selectable. The source
booklet retains its headings. An optional versioned `projection` on its ownership
link records the omitted paragraph IDs; promotion, duplicate detection, sync
comparisons, owner saves and explicit resolutions use the same projection.
Accepting bank changes restores those source-only paragraphs in the booklet.
Existing links without a projection retain their previous behavior. Source
hashes and transfer receipts retain the original evidence and intentional omissions.
Transfer assessments can also supply exact `notationReplacements` for equivalent
fraction notation required by bank validation. These apply only inside native
maths or delimited expressions; unchanged booklet notation is preserved during
reverse sync. Unrecognised new notation still receives ordinary bank validation.

`booklets/question-bank/.sync/links.json` records the original project/block, shared-content baselines and bank revision for each linked question. Question revisions remain under `.revisions` for existing copies. Normal saves and explicit resolutions use the shared server write queue and rollback-capable file transactions. Stale project versions and stale resolution requests are rejected. Bank editor saves retain history and reject a changed modification timestamp.

The application server performs automatic sync. External scripts that write JSON files directly do not trigger it, and multiple independent server processes do not share the in-process write queue. Use one authoring server for this workspace. Existing adapted revision questions remain separate; teaching module and other booklet snapshots do not silently advance. New independent questions enter the bank through the existing bank-save action.

Original-owner registration for accepted Linear and Index Laws content is complete. Use the shared bank transaction helpers for future publication. `check-bank-sync.mjs` exercises persistence and conflict handling in an isolated browser session; automated tests cover automatic publication, layout-only saves, conflicts, explicit updates, revision pins, missing questions and transaction rollback.

Verification on 8 September 2026: all 469 tests and the production build passed. The browser check passed for reviewing and accepting a pinned update, resolving a conflict, and the narrow-screen layout. All 168 registered originals report synced; registration preserved the source booklet at revision 164.
