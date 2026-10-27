# Diagram size: source-calibrated rules

User requested, 25 October 2026. This extends the graph-sizing convention and
supersedes a width-only rule for newly authored diagrams. It authorises an
explicit sizing maintenance pass over Stage 5, Stage 5 Paths, Stage 6 and
textbook imports, protecting recent manual work in **every** category. It does
not authorise a load-time migration, geometry rewrite or reduction in working
space. Keep existing acceptance, source evidence and bank relationships.

## Size for the task

Measure the complete diagram at final printed size, including dimension lines,
labels and captions which belong to it. Available column width is a constraint,
not a target to fill. A wide, shallow solid should remain shallow. Preserve
aspect ratio; do not compress one axis or change the camera, coordinates,
mathematical range or illustrative extrusion merely to meet a size target.

| Purpose | Starting size / ordinary range | Review trigger |
| --- | --- | --- |
| Supplied geometry, solids and small nets | 30–45 mm wide, usually 25–40 mm high | Height over 40 mm or width over 65 mm |
| Simple figures in a part grid or table | Start near 32 mm wide | Labels/features require more room |
| Supplied question graph | Start near 70 mm wide, usually 50–65 mm high | Width over 75 mm or height over 65 mm |
| Short-answer graph | Start near 50 mm wide | Width over 55 mm or height over 50 mm |
| Worked-solution graph | Start near 60 mm wide | Width over 65 mm or height over 60 mm |
| Short-answer figure | Usually 25–45 mm wide | Width over 50 mm or height over 35 mm |
| Worked-solution figure | Usually 30–55 mm wide | Width over 60 mm or height over 40 mm |
| Dense construction, tree/network, paired teaching figures | Size to the assessed features and labels | Usually review above 100 × 70 mm |
| Student plotting, construction or drawing grid | Size to the required drawing and scale | Never shrink using a supplied-answer limit |

These are review triggers, **not hard caps**. An important label, dense scale,
construction step, source comparison or usable drawing area takes priority.
Record the concrete reason for an exception. Do not enlarge a satisfactory
small figure just to reach the nominal starting size. Maintain independent
question, short-answer and worked-solution settings.

Store a diagram-specific exception in the existing preserved `spec` object as
`spec.sizing: { exceptionReason: "the mathematical or response-space reason" }`.
Use `spec.sizing: { purpose: "drawing" }` for an explicitly identified student
drawing scaffold. Existing local feedback and calibrated overrides also count;
their absence is not an instruction to erase a manual setting.

## Readability takes priority

- Keep complete native labels at 10 pt and existing graph-tick targets at 8.5 pt
  or their reviewed 8 pt exception. Keep mathematical scripts proportional.
- Calibrate labels at the proposed size before accepting a reduction. A
  reduction that introduces overlap, clipping or ambiguous geometry must be
  adjusted or rejected. Move labels, increase separation or retain a larger
  figure; never reduce the font to make a numerical target pass.
- Check label-to-edge clearance as well as label-to-label overlap. Dimension
  arrows, angle marks, hidden edges, equal-side ticks and narrow gaps must remain
  distinguishable. SVG view-box bounds alone do not establish readability.
- Retain a readable minimum width for a narrow tall diagram. If proportional
  shrinking cannot reduce height safely, use a reviewed layout exception.
- Raster labels do not have automatic typography calibration. Preserve them
  until their final-size readability has been inspected; do not blanket-scale
  screenshots, portraits, text-heavy illustrations or mathematical tables.
- Keep meaningful pairs, common scales, shared dimensions and diagram-to-working
  relationships. A group may legitimately be wider than an individual diagram.
- Diagram size and handwriting space are separate. This policy does not reduce
  answer allowances, table-cell capacity, padding or paragraph/row gaps.

## Calibration evidence

Nine original DOCX booklets were measured using their drawing extents, and
their original PDF pages were visually inspected. The source sample covers
Surface Area of Prisms and Cylinders, Right-angled Trigonometry, Compound Events,
Circle Geometry, Stage 6 acute-angle trigonometry, Quadratic and Cubic Functions,
Curve-sketching, Further Transformations and Network Concepts (median diagram
height 40.7 mm, with larger dense maps). The earlier Composite Solids repair
provides an additional final-size example.

Median source drawing heights were approximately 26 mm for right-angle
trigonometry, 30 mm for surface area, 33 mm for Stage 6 acute-angle trigonometry,
36 mm for compound events, 37 mm for circle geometry, 50 mm for quadratics and
curve-sketching, and 65 mm for Further Transformations. Drawing extents include
scaffolds, diagrams and teaching illustrations; these medians are preference
evidence, not certification of every source figure or a universal maximum.
Large drawing grids and detailed teaching figures are deliberate exceptions.

The local source measurements and review sheets are under
`.booklet-work/diagram-sizing-20261025/source-sizes.json` and `source-review/`.
Original sources remain unchanged.

## Maintenance protection and verification

For the 25 October maintenance pass, the user's later scope clarification
supersedes the initial seven-day/unknown-save-actor hold. Booklets that have
never had teacher comments are eligible. Everything else, including textbook
projects, import reviews and unassigned booklets, is authorised except these
explicit exclusions:

- All Stage 4 booklets and their class copies.
- Stage 5 Core: financial maths, algebra, index laws, surface area, similarity
  and data analysis.
- Stage 5 Paths: logarithms.
- Standard: networks.
- Year 11 Extension 1: Further Transformations, Binomial Theorem and Inverse
  Functions.

The named topic exclusions identify the personal course booklets; textbook
chapters remain authorised under the user's explicit textbook-project inclusion.
Inventory current revisions and preserve the excluded files exactly. Studio
save timestamps do not identify the actor; they no longer block a book covered
by this explicit clarification. Future maintenance needs its own authorised
scope rather than assuming this exception is a permanent migration policy.

Preserve explicit local sizing exceptions, feedback repairs and calibrated
answer overrides. Never use a new run or a different category to bypass an
explicit exclusion. Recheck the current revision and scope immediately before
publication; stop stale writes and retain completed checks for unchanged inputs.

Use explicit saved widths through the ordinary revision-safe project/bank
transaction. Preserve IDs, taxonomy, source references, source hashes, prompts,
answers, mathematical methods and drawing space. A sizing pass does not renew
mathematical acceptance or resolve unrelated teacher feedback.

Measure the settled candidate in its actual page context. Run full-DOM layout,
typography, answer coverage and navigation checks in the affected editions;
inspect changed arrangements, dense representatives, all flagged/new overlap
cases and pagination neighbours. Reuse unchanged output and combine identical
question bodies. Treat any pre-existing finding separately, and fix every
regression caused by this pass. Save only candidates with the required rendered
review. Keep protected/review cases in a compact report rather than forcing a
size reduction.

`src/lib/booklet-diagram-sizing.js` supplies the shared authoring prompt,
classification and reduction-only proposal rules. The semantic import prompt
includes it. Neither project normalisation nor the renderer calls its adoption
logic automatically.
