# Volume feedback repairs, 12 September 2026

The revision 83 feedback covers fifteen comments. The content repairs were saved
on top of revision 84 through the revision-checked project API, retaining its
source evidence and current review flags. Existing bank ownership and question
IDs remain intact. See the occurrence register in
`booklets/provenance/volume-v1/feedback-2026-09-12.json` for final verification.

All fifteen comments are resolved in revision 86. Revision 85 contains the
reviewed content; revision 86 changes only comment status and the page 25 source
review signatures. Its rendering payload is unchanged. The 63 focused tests,
production build, editor interaction check and all-page DOM/PDF-clearance/link
checks passed. The three question-containing editions were exported for Volume,
Index Laws and Linear Relationships. Visual review covered 81 distinct affected
page bodies and neighbours; 90 identical bodies reused that review, with footers
and navigation checked separately. The final source-coverage comparison adds no
new findings. Detailed timing and retry records remain in the local run receipt.

Shared behaviour for every booklet:

- Arrangement items and groups expose Top, Middle and Bottom vertical alignment.
  Selecting a diagram inside a stacked example column aligns its containing
  column within the actual row. Alignment survives resizing and save/reopen.
- Formula annotation labels are placed against their actual term anchors, with
  collision separation and bounded wrapping. Arrows connect centred label text
  to the associated term. Term-to-term mathematical connection arrows retain
  their existing behaviour.
- Borderless native calculation scaffolds display dotted writing leaders;
  bordered numeric tables retain blank response cells. Scaffold dots align with
  the equation's writing line. Explicit underlined-space question scaffolds are
  migrated to native dotted mathematics, retaining vertical struts. Mathematical
  underlining, subscripts, answers and original source evidence are excluded.
  `node scripts/booklet/normalise-question-scaffolds.mjs` previews this maintenance;
  `--apply` uses the shared guarded project/bank transaction.

Volume repairs retain its compact pagination policy and teaching methods. The
syllabus band adopts the main section band's dimensions and type. Source-supported
diagram/calculation and paired-solid arrangements are restored on pages 15, 16,
22, 28 and 35. Narrow diagram labels are repositioned to keep the complete 10 pt
measurements readable. The top view on source page 7 uses a scale consistent with
its neighbouring faces. The isolated oblique cross-section on page 10 is oriented
to match the cut; the original source orientation remains in the evidence.

For the cylinder inside the cube, the oblique circle projection is
`x = 1.44 + cos(t) + 0.44 sin(t)`. Its vertical silhouette generators are therefore
at `t = atan(0.44)` and `t + 180 degrees`, not the former reflected angles. The
horizontal rolled-sheet illustration retains its open slit and omits the
incorrect rear arc at the left end. New source-hashed visibility reviews cover
each changed drawing; no blanket visibility exception is introduced.

The strict all-current-solids audit still reports 120 pre-existing review findings
in Volume, with no geometric defects and no changed drawing among those findings.
The full source-content acceptance also has pre-existing open findings. Completing
this feedback does not certify the entire Volume transcription or resolve those
other flags. Local PDF exports, page images, bank checks, timings and retry records
are under `.booklet-work/volume-feedback/`.

## Prevention in future work

These rules apply to future imports, edits and restored projects. Preserve each
book's content and teaching methods; the original explicitly local corrections
do not mandate identical widths, heights or placement in unrelated questions.

- Before authoring, inventory the source relationship between each diagram,
  calculation scaffold and photograph: left/right placement, paired figures,
  row grouping, baseline and relative scale. Preserve meaningful arrangements
  through native layouts or the shared arrangement editor. Record reviewed
  `arrangementOverride` and `presentationRequirements`; changing placement must
  invalidate the old acceptance. Do not silently stack source-paired figures.
- Align calculation starts across a source row using appropriate diagram slots
  and row spacing. Keep every measurement and 10 pt label readable and sufficient
  handwriting space, including blanks in exponents. Do not copy Volume's 57 mm
  slot or local widths as universal defaults.
- Use the shared section-header template/tokens, including standalone syllabus
  bands. Check geometry, type and padding as well as colour.
- Use native dotted clozes or dotted mathematical blanks for question scaffolds.
  Borderless alignment tables retain dotted leaders; bordered value-table cells
  retain their separate semantics. Mathematical underlining and original source
  evidence are preserved. `inspectPresentationFidelity` flags explicit
  underlined-space blanks even without teaching-template settings. The ordinary
  test suite also scans all current projects and current bank question files.
- Use native annotated equations, attaching labels to the actual formula terms.
  Review the complete text, wrapping, collision separation and arrow endpoints
  after resizing, zoom, save/reopen and at printed size. A non-overflowing figure
  alone does not establish correct attachment or alignment.
- Compare an isolated cross-section with its actual cut before accepting its
  rotation or reflection. Check curved/composite silhouettes from the actual
  projection: cylinder generators are ellipse extrema, and rolled sheets retain
  their open slit and exposed rim. Apply the visibility contract and exact-source
  review hashes; copying a familiar cylinder template is insufficient.

Run the focused prevention suite before accepting relevant work:

```text
node --test tests/booklet-volume-feedback.test.js tests/booklet-presentation-verification.test.js tests/booklet-arrangement.test.js tests/annotated-equation.test.js tests/solid-audit.test.js tests/solid-geometry.test.js
```

Use the existing content/presentation readiness check and strict solid audit on
each candidate, then inspect affected rendered pages and neighbours in applicable
editions. New transcriptions still require the complete five-edition review.
Do not resolve feedback until the actual content and final-size output have been
reviewed. Automated checks catch recorded and recognizable defects; source
comparison remains necessary for arrangements and geometries they cannot infer.

Prevention follow-up verification: 72 targeted tests passed, including deliberate
reintroduction of plain and structured underlined blanks, preservation of quoted
feedback/source evidence, and a scan of every current booklet and bank question.
The production build passed. This follow-up changes validation and authoring
guidance only; the earlier rendered-page evidence remains applicable.
