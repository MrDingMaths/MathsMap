# Booklet Studio project library

The Open booklet picker searches titles, stage/course names and class labels.
Masters are grouped by their single home course, using the existing MathsMap
course catalogue. Class booklets are grouped by class label. Import reviews and
unclassified legacy projects have separate groups. Archived projects are shown
only when the archive checkbox is selected; their direct project links still work.

Use **File → Project details** to change category, home course or class label.
Uncertain courses remain Unassigned. A library category is independent of
publication status and bank ownership: changing it never transfers ownership.

In a master, **File → Create class booklet** saves pending edits and creates an
independent copy with a class label and editable title. Content, solutions,
pagination, local layout and bank revision pins are retained. Source review
comments are cleared. Bank content updates still require explicit acceptance;
master layout changes do not propagate to copies. Display ratings retain their
existing automatic refresh behaviour.

**Archive booklet** hides the project without deleting its JSON, assets, evidence,
history or bank links. Open it through Archived projects and choose **Restore
booklet** to return it to the active library. Concept Maths is an active Import
review for spacing checks. Keep it after import because it owns linked bank
questions; archive it when review is finished instead of deleting it.

## Persistence and migration

Optional `library` metadata contains `category` (`master`, `class`,
`import-review`, or null), `courseId`, `classLabel`, and `archivedAt` (ISO date or
null). Stage is derived from the course. List summaries include normalized
metadata; absent metadata means Unassigned. Existing whole-project saves retain
revision checking and bank-sync behaviour.

`PATCH /__booklet/projects/:id/library` accepts `library` and a required
`expectedRevision`. It writes only library metadata, revision and update time
through the shared transaction and checkpoint helpers. It does not publish
pending question edits. A stale revision returns 409.

The repeatable initial migration uses the running authoring server's write queue:

```powershell
node scripts/booklet/migrate-project-library.mjs --base http://localhost:5173
node scripts/booklet/migrate-project-library.mjs --base http://localhost:5173 --apply
```

It categorises the eight named topic masters, Volume for 8MAT6, and Concept Maths.
Only Linear Relationships (Stage 4) and Concept Maths (Year 11 Advanced) receive
home courses. Already classified or manually adjusted projects are skipped.
Publication status, bank ownership, source references and document content are
preserved. The 17 September 2026 application verified unchanged document-content
hashes for all ten projects and unchanged bank-ownership links.

## Scoped verification

Run the library, project, bank-sync and save-merge unit tests, plus
`node scripts/booklet/check-project-library.mjs http://localhost:5173`.
The browser check uses temporary projects and bank storage, tests keyboard/search,
class creation, details/save/reopen, archive/restore, narrow-screen positioning,
preview and print-only visibility, and new project categories. Screenshots are
local under `.booklet-work/library-review/`. Loading/switching checks use
`project-library-browser.mjs` instead of the retired native-select interaction.
This change does not alter booklet rendering and does not require full PDF exports.
