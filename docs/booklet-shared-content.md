# Shared content across booklets

User approved, 21 October 2026. Overlapping booklets (Stage 6 especially) repeat the same theory and practice questions. Shared content keeps identical copies in step and lets a copy differ only by decision.

## What counts as the same content

Two blocks are copies when their printed content is identical: text, maths, answers, worked solutions, diagrams, teaching responses and mathematical colour. The comparison is `reuseContentHash` in [`reuse-content.mjs`](../scripts/booklet/reuse-content.mjs), the same identity import reuse uses. It also ignores sizes and spacing inside the content (cloze and inline widths, table column widths, row heights, gaps).

Each booklet keeps its own:
- IDs
- numbering and source references
- layout, answer spaces, cloze and column widths
- skill classification and difficulty
- bank link
- review records

A merge never changes these.

## Groups and copies

[`booklets/shared-content/groups.json`](../booklets/shared-content/groups.json) lists each group. A group holds its current shared version and its copies. Every shared version is kept in `booklets/shared-content/.revisions/<group>/<hash>.json`, together with the version it replaced and the node positions the edited copy started from. That record lets a later copy take a change exactly, including inserted parts.

A copy's status is worked out from its current content:

| Status | Meaning |
|---|---|
| In step (`synced`) | Matches the shared version |
| Changed here (`edited`) | Edited and waiting for a decision |
| Differs (`diverged`) | Already different when linked; waiting for a decision |
| Update waiting (`behind`) | Another copy's change has not reached it yet |
| Kept different (`separate`) | Decided; it no longer takes updates |

## Deciding

Saving never propagates anything. Studio shows a notice on the booklet with a changed shared block, and **Shared content** offers:

- **Apply to all N copies** records the new shared version and updates every linked copy in its own revision-checked write. That write runs the ordinary bank sync, so a bank-owned question publishes and its consumers show synced.
- **Use the shared version** replaces this copy with the shared version and keeps its layout.
- **Keep different here**, with an optional reason, stops this copy taking updates.

An edit started from an older shared version, because another copy changed first, cannot be applied to all. Use the shared version or keep it different.

A booklet with an import, review, export or repair in progress is not written. Busy means either:
- a live worker lease in its run directory;
- a node process whose command line names the booklet or its run.

Its copies stay **Update waiting**. They are applied when the booklet is next open, saved and idle in Studio, or with `apply-pending`. An open booklet that is saved and idle takes an update in place. One with unsaved edits keeps them and meets the ordinary save conflict.

## New questions in shared exercises

A question added in Studio to an exercise that holds shared blocks is offered to the other booklets that share that exercise. Studio shows a notice, and **Shared content** lists each booklet and exercise with a checkbox.

- **Add to selected booklets** puts a copy in each chosen exercise. It goes after the copy of the nearest earlier shared block, or before the nearest later one, or at the end of the exercise. Each copy:
  - gets new IDs, no bank link and no source identity;
  - keeps the source's saved layout;
  - records `sourceReview.reuse`.

  The copies and the original form a new shared group, so later edits follow the ordinary decision. Each changed booklet gets a page check covering every edition.
- **Keep in this booklet only** closes the offer.

The offer copies the question as it is when you add it, so finish writing the question first. A busy booklet is skipped and offered again later.

These are not offered:
- questions created by imports;
- questions in class copies;
- questions in exercises with no shared blocks;
- booklets that already contain the same question.

## Keeping the registry up to date

The registry follows the library by itself, in two ways.

**Studio's save:**
- records edits;
- removes deleted copies;
- links a new import copy whose reuse source is shared;
- raises new-question offers.

**A background refresh** runs a few seconds after each Studio save or decision, and when a booklet checks its status and the last refresh is over a minute old. It reads only booklets whose files changed since the last refresh, so it also sees imports and repairs that write booklet files directly. It forgets copies whose block or booklet was deleted, and links two kinds of copy:
- copies recorded by import reuse (`sourceReview.reuse`);
- identical blocks in different booklets. Practice questions always qualify; a teaching block needs at least 300 characters of content.

The refresh keeps a hash index of every booklet in `.booklet-work/shared-content/index.json`. The first refresh reads the whole library; later ones read only what changed.

Rules the refresh follows:
- **Additive.** Existing groups and decisions are never changed, and no booklet is edited.
- **One copy per booklet.** It adds at most one copy per booklet to a group, unless import reuse links more, because a question duplicated within a booklet is usually the start of a variant.
- **Class copies are left out** (`library.category: "class"`) unless `--include-class-copies` is given, because they are a class's own snapshot.
- **Duplicated booklets** that are not class copies are linked like any other booklet.

Outside Studio, run `refresh --apply` yourself, for example after delivering an import while Studio is closed.

## Pages to check

Each update or added question queues a page check for the booklet it changed. A background runner renders that booklet's page maps before and after in headless Chrome, against the running Studio. It renders the Questions edition, plus the answer editions when answers changed. It records:
- the pages holding the updated block;
- the pages whose blocks moved;
- whether the page count changed (which changes every footer and the contents page).

Studio lists these under **Updated from other booklets** until you press **Checked**. The snapshots are kept in `.booklet-work/shared-content/checks/` and removed once checked. A two-page test booklet took 10–23 s; large booklets take longer. The block-height shortcut in the original plan was not built.

## Commands

```text
node scripts/booklet/shared-content.mjs refresh [--apply] [--include-class-copies] [--json]
node scripts/booklet/shared-content.mjs report [--project ID] [--json]
node scripts/booklet/shared-content.mjs decide --project ID --block ID --apply-all|--keep-separate|--use-shared [--reason TEXT]
node scripts/booklet/shared-content.mjs apply-pending [--project ID]
node scripts/booklet/shared-content-pages.mjs --project ID [--base URL]
```

Without `--apply`, `refresh` only previews. `seed` is its earlier name.

`decide` is for scripted repairs, such as approved pedagogy findings. It applies the same choices as Studio, so state the scope when a repair is approved.

## Not covered yet

- **Copies across different structures.** Copies that differ in structure (a rebuilt worked example, a different number of parts) are linked only through import reuse, and start as **Differs**.
- **Removing a question.** Deleting a question from a shared exercise is not offered to the other booklets; that copy just leaves its group.
