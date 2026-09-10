// Token-efficient authoring prompts. The full contracts remain in the source
// files and are used for local review; these compact modules carry the rules
// needed for the page-level authoring call.
export const COMPACT_RECONSTRUCTION_PROMPT=`# Source reconstruction compact contract
Transcribe only the supplied source page into the requested semantic compact JSON. The PDF image is authoritative for student-visible text, diagrams, colours, alignment, order and answer visibility; extracted Word/PDF text is supporting evidence and may contain hidden teacher answers. Use teacher evidence for answer content only. Flag ambiguity rather than guessing. Never inspect other candidates, previous repairs or repository code.

Preserve every meaningful stem, part, subpart, worked demonstration, teaching activity, scaffold, table, grid, card, diagram, syllabus outcome, label and source order. Keep stable page-rooted IDs and printed question numbers. Do not omit content to fit. Use native editable maths, structured documents, tables, layouts and TikZ for reconstructible mathematics; retain a raster only when the visual is genuinely complex or uncertain and record the specific reason. Never use Markdown tables, hand-spaced columns, screenshots of equations or prose in place of a mathematical scaffold.

Student prompts must not contain supplied answers. Every response leaf has concise short and worked answers with the taught method, exact arithmetic until rounding is requested, units and necessary reasons. Parent nodes do not carry answers. Preserve intermediate working, arrows, annotations, colours, alignment, response type, physical writing space and source-supported column counts. Cloze/inline responses supply their own space; do not add generic working space.

Teaching blocks retain their source activity identity and one template-owned heading per group. Keep sourceAtom metadata, heading ownership, source references, sourceReview responses/arrangements/presentationRequirements and unresolved findings. Review numbers are structural labels, not checkbox glyphs in prompt prose. Do not print generated activity references or editor-only difficulty ratings.

Use the supported v4 block/node/document fields only. Return the page envelope requested by the caller, omit defaults and provenance from student-facing prose, and return only JSON. Successful generation is not acceptance: source comparison, content reconciliation, presentation review and final-size rendering remain separate.`;

const TIKZ_CORE=`# Conditional TikZ contract
Include TikZ only for a genuine mathematical visual. Return complete TikZ, not a placeholder, prose description or JSON. Use only the TikZJax-supported libraries/packages; no preamble, external images or raster effects. Trust the supplied source image for visual meaning and preserve question-versus-solution visibility. Do not invent unspecified lengths, angles, coordinates, labels or geometry.

Build a semantic specification first, then draw base geometry, semantic marks, labels, angles and solution-only annotations. Use coordinate-derived geometry: \\pic{angle = A--V--B} for ordinary angle marks, calc-derived right-angle squares, midpoint labels on their source segments, and equation-driven plotting for known functions. Check topology, endpoints, winding, proportions, labels, source colours, explicit ticks/grid presence and final physical size. Avoid guessed label coordinates and do not shrink crowded figures with scale.

Before returning, compile mentally against the supported subset and verify every source-required edge, mark, label, point, grid, answer overlay and relationship. The rendered PDF/preview remains authoritative for collision, clipping and readability checks.`;

const TYPE_RULES={
 graph:`## Graph/coordinate rules
- Distinguish categorical data displays from equation/function graphs. Plot a known equation mathematically over a bounded domain; do not trace pixels.
- Preserve the source's axes, tick presence, grid, scale, arrows, points, dashes and semantic series colours. Omit the Cartesian-origin O label.
- Keep axis numbers readable at final size (normally 8.5 pt), other labels around 10 pt, and prevent axis titles colliding with tick labels. Use role-specific strokes: plots 0.8 pt, axes 0.5 pt, ticks/guides 0.4 pt, major grid 0.25 pt, minor grid 0.15 pt.`,
 angle:`## Angle/triangle/geometry rules
- Preserve the source topology, point names, side labels, angle sectors, equal-length marks, parallel marks and right-angle marks.
- Derive marks from the actual edges and coordinates; use the correct angle winding and keep labels inside or outside their intended regions. Do not replace a complete scaffold with only the final result.
- Keep not-to-scale status, source palette, line styles and question/solution overlays distinct.`,
 bearing:`## Bearing rules
- Derive legs from the stated bearings and distances. Use a north arrow only where the source measures a bearing.
- Reflex bearing arcs use the computed bearing-based arc recipe, not an ordinary angle pic. Put bearing labels on the computed bisector and distance labels midway along their legs with clear backgrounds.`,
 circle:`## Circle rules
- Preserve the centre, radii/chords, tangent relationships, angle sectors, equal-length marks and required construction lines.
- Derive right angles and equal-length ticks from the actual geometry; do not hand-place marks by guessed coordinates.`,
 solid:`## 3D-solid rules
- Preserve visible faces, hidden/visible edges, depth direction, dimensions, curved-surface silhouettes and labels. Do not join the apexes of curved surfaces.
- Use a consistent coordinate model and keep dimension labels outside the solid with outward anchors.`,
 network:`## Network/graph-theory rules
- Preserve every vertex, edge, arrow direction, weight, route and highlighted step. Network edge arrows are mid-line markers, not endpoint arrows.
- Keep labels and weights legible and do not replace the network by an adjacency list or prose.`,
 table:`## Visual-table rules
- A value table needed by the question is native editable table content, not TikZ. Use TikZ only for a document-like visual the learner reads, such as a spreadsheet or bank statement.
- Preserve every row/column, header, label, border, alignment, shading and source grouping.`,
 pattern:`## Visual-pattern rules
- Show the concrete source stages, with consistent spacing and orientation, and isolate the changing feature. Do not reveal the requested general rule on the question side.`,
};

function lower(value){return String(value??'').toLowerCase();}
export function visualKinds(inventory,sourceText=''){
 const text=lower(JSON.stringify(inventory)+' '+sourceText);
 const kinds=[];
 if(/\b(graph|coordinate|axis|axes|plot|histogram|scatter|ogive|function graph|number line)\b/.test(text))kinds.push('graph');
 if(/\b(angle|triangle|polygon|parallel|perpendicular|quadrilateral|trapez|geometry)\b/.test(text))kinds.push('angle');
 if(/\b(bearing|north arrow|true bearing)\b/.test(text))kinds.push('bearing');
 if(/\b(circle|tangent|radius|diameter|chord|cyclic)\b/.test(text))kinds.push('circle');
 if(/\b(cylinder|cone|prism|pyramid|cuboid|solid|3d|three-dimensional)\b/.test(text))kinds.push('solid');
 if(/\b(network|vertex|vertices|directed edge|dijkstra|tree diagram)\b/.test(text))kinds.push('network');
 if(/\b(spreadsheet|bank statement|schedule|visual table)\b/.test(text))kinds.push('table');
 if(/\b(pattern|stage \d|growing pattern|matchstick)\b/.test(text))kinds.push('pattern');
 return [...new Set(kinds)];
}

export function hasTikzVisual(inventory,sourceText=''){
 const entries=Array.isArray(inventory?.entries)?inventory.entries:[];
 const visualSignal=/\b(diagram|figure|graph|plot|histogram|scatter|ogive|number line|triangle|polygon|quadrilateral|circle|tangent|bearing|north arrow|cylinder|cone|prism|pyramid|cuboid|network|coordinate plane|visual pattern)\b/i;
 return entries.some(entry=>entry.kind==='diagram'||visualSignal.test(JSON.stringify(entry)))||(!entries.length&&visualSignal.test(sourceText));
}

export function compactTikzPrompt({inventory,sourceText=''}){
 if(!hasTikzVisual(inventory,sourceText))return 'No TikZ visual is expected on this page. Use native editable maths, tables, cards or layouts for representable content; do not invent a diagram.';
 const kinds=visualKinds(inventory,sourceText);
 return [TIKZ_CORE,...kinds.map(kind=>TYPE_RULES[kind]),'## Final visual check\nCompare the complete figure with the source at intended printed size. Check labels, line endings, marks, colours, dashes, arrows, clipping, whitespace and question/solution visibility before returning.'].join('\n\n');
}
