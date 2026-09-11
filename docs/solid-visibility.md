# 3D diagram visibility

Visible solid boundaries and silhouettes are solid black; obscured edges are dashed. A back-face edge can be a visible silhouette. Never swap all solid and dashed paths, infer visibility from vertex names, or assume a template's hidden-edge list survives changing the view. Construction guides, internal diagonals, cut sections and semantic highlights have separate teaching roles.

## Construction

`src/lib/solid-geometry.js` is the shared DOM-free authoring geometry. `prismModel(front, offset, view)` and `pyramidModel(base, apex, view)` create explicit 3D vertices/faces. `tdplotView(theta, phi)` matches the bundled TeX matrix; `obliqueView(dx,dy)` uses a front XY cross-section and receding positive Z. For closed convex models, `convexFaceFacing(model)` orients adjacent face normals outwards and tests them against the viewing direction. `edgeVisibility(model,a,b)` uses this classification, and otherwise splits an edge at projected occluding-face boundaries and casts toward the viewer, supporting concave outlines and explicitly omitted open faces. Unknown/non-planar constructions require review or explicit subdivision.

`solidTikz(model,{labels,annotations,scale})` emits editable plain 2D TikZ plus `% mathsmap-solid` version 1 metadata. Labels use `\path`, never another `\draw`. Project right-angle marks and angle arms before drawing them; never put an angle pic in a tdplot coordinate scope. Preserve labels/values, numerical precision, meaningful fills and mathematical colour roles. An equivalent translated cross-section edge may carry a dimension; equal numerical length alone does not establish equivalence.

`curvedSolidTikz(kind,parameters)` supplies bounded analytic cylinder, cone, sphere and semicylinder templates. The cone rim splits at the tangent points from its apex. The semicylinder's rear arc splits at depth direction + 90 degrees, with its exposed rear contour solid and obscured rear arc dashed. Do not draw an arbitrary apex-to-apex crease. Unsupported orientations/composites need geometric and final-size visual review, not an inferred blanket arc style.

## Acceptance and current content

Run `node scripts/audit-solid-visibility.mjs --strict` (or `--only id1,id2`). The generation gate and booklet candidate validation use the same geometric audit. Supported legacy solids are reconstructed from verified topology; arbitrary TeX is not automatically rewritten. Unsupported candidates need a reason and accepted review bound to the exact source hash. Changes invalidate that review. Candidate detection intentionally includes false positives such as planar nets and coordinate constructions; reviewers distinguish them explicitly.

Use the guarded maintenance command `node scripts/repair-solid-visibility.mjs` to preview proposed repairs; `--apply` uses exact source guards and revision-safe booklet/bank transactions. Current correct diagrams and original evidence stay intact. Store decisions and before/after hashes in `booklets/provenance/solid-visibility-2026-09-12.json`; local captures, input snapshots and timing receipts stay under `.booklet-work/solid-visibility/`.

Review actual drawings at their final dimensions, retaining 10 pt native labels, black ordinary ink, semantic accents, editor/preview/PDF parity, and applicable booklet edition gates. Numerical visibility checks do not certify label placement or source mathematics. Every affected occurrence requires review; representative checks precede bulk changes.

## Regression origin

Commit `5e0bb759` (26 August 2026) changed the loading ramp in `volume-of-prism` development question 1 from a solid front triangle to dashed front edges, and moved measurements to the rear without changing `tdplotsetmaincoords{70}{110}`. The TikZ preparation layer preserves these commands. The correction therefore repairs source geometry and adds prevention at authoring/acceptance rather than introducing a renderer-wide style inversion.
