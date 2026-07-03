// Builds Cytoscape elements (nodes + prerequisite edges) from the taxonomy.
import { skills, courseById, skillById, strandForSkill, topicsForSkill, bandOrderFor, bandLabelFor } from './data.js';
import { getMastery } from './store.js';
import { plainMath } from './mathText.js';
import { ringSvg, trackColour } from './ring.js';
import { RANK_SEP } from './swimlane.js';

// Discrete-state ring for a single skill: one coloured arc whose length grows with
// mastery, matching the legend colours below. `mastered` is the full ring + check.
const skillRing = (masteryKey, isDark) => {
  const track = trackColour(isDark);
  if (masteryKey === 'mastered') return ringSvg({ track, full: true });
  const segments =
    masteryKey === 'learning'
      ? [{ pct: 33, color: masteryColour.learning }]
      : masteryKey === 'proficient'
        ? [{ pct: 66, color: masteryColour.proficient }]
        : [];
  return ringSvg({ track, segments });
};

// Shared so the topic meta-graph (topicGraph.js) renders with the same palette.
export const masteryColour = {
  none: '#475569',
  learning: '#d97706',
  proficient: '#2563eb',
  mastered: '#16a34a'
};

export const masteryLabel = {
  none: 'Not started',
  learning: 'Learning',
  proficient: 'Proficient',
  mastered: 'Mastered'
};

// Node diameter as a function of its connection count (in + out degree), so
// well-connected hubs read as bigger. Square-root growth keeps high-degree nodes
// from ballooning. Used by both the skill and topic graphs.
export const nodeSize = (degree) => Math.round(34 + 8 * Math.sqrt(Math.max(0, degree)));

// in+out degree per node id, from an array of edge elements.
export function degreeMap(edges) {
  const deg = new Map();
  for (const e of edges) {
    deg.set(e.data.source, (deg.get(e.data.source) || 0) + 1);
    deg.set(e.data.target, (deg.get(e.data.target) || 0) + 1);
  }
  return deg;
}

// `courseIds` may be a string or an array of course ids. With several courses
// selected, prerequisite edges that cross between courses become visible.
// `topicIds`, when given, scopes the skill graph to skills under those topics —
// used for the "drill into a topic" view so the skill graph stays small.
export function buildElements({ courseIds = null, stage = null, topicIds = null, isDark = false } = {}) {
  const wanted = courseIds == null ? null : new Set([].concat(courseIds));
  const wantedTopics = topicIds == null ? null : new Set([].concat(topicIds));

  let pool = skills;
  if (wanted) pool = pool.filter((s) => (s.courses || []).some((c) => wanted.has(c)));
  if (stage) pool = pool.filter((s) => s.stage === Number(stage));

  // When scoped to topics, split into core (belongs to those topics) and boundary
  // (outside the topics but directly connected to a core skill via prereq edge).
  let corePool = pool;
  if (wantedTopics)
    corePool = pool.filter((s) => topicsForSkill(s.id).some((t) => wantedTopics.has(t)));
  const coreIds = new Set(corePool.map((s) => s.id));

  const boundaryIds = new Set();
  if (wantedTopics) {
    const poolIds = new Set(pool.map((s) => s.id));
    for (const s of corePool) {
      for (const p of s.prereqs || []) {
        if (!coreIds.has(p) && poolIds.has(p)) boundaryIds.add(p);
      }
    }
    for (const s of pool) {
      if (coreIds.has(s.id)) continue;
      for (const p of s.prereqs || []) {
        if (coreIds.has(p)) { boundaryIds.add(s.id); break; }
      }
    }
  }

  const finalPool = [...corePool, ...pool.filter((s) => boundaryIds.has(s.id))];
  const finalIds = new Set(finalPool.map((s) => s.id));

  const nodes = finalPool.map((s) => {
    const course = courseById.get((s.courses || [])[0]);
    const mastery = getMastery(s.id);
    // "Ready now": not started, but every prerequisite is mastered (the learning
    // frontier — same rule as recommender.nextSkills).
    const ready =
      mastery === 'none' && (s.prereqs || []).every((p) => getMastery(p) === 'mastered');
    return {
      data: {
        id: s.id,
        label: plainMath(s.title),
        name: s.title,
        blurb: s.blurb || '',
        stage: s.stage,
        strand: strandForSkill(s.id),
        band: bandOrderFor(s.courses, wanted),
        bandLabel: bandLabelFor(s.courses, wanted),
        courseId: course?.id || '',
        course: course?.title || '',
        colour: course?.color || '#64748b',
        masteryKey: mastery,
        masteryLabel: masteryLabel[mastery],
        mastery: masteryColour[mastery],
        ring: skillRing(mastery, isDark)
      },
      classes: [boundaryIds.has(s.id) ? 'boundary' : '', ready ? 'ready' : '']
        .filter(Boolean)
        .join(' ')
    };
  });

  const edges = [];
  for (const s of finalPool) {
    for (const p of s.prereqs || []) {
      if (!finalIds.has(p)) continue;
      // When scoped, only draw edges where at least one endpoint is a core skill.
      if (wantedTopics && !coreIds.has(s.id) && !coreIds.has(p)) continue;
      const cross = !(skillById.get(p)?.courses || []).some((c) =>
        (s.courses || []).includes(c)
      );
      const isBoundaryEdge = boundaryIds.has(s.id) || boundaryIds.has(p);
      const classes = [cross ? 'cross-course' : '', isBoundaryEdge ? 'boundary-edge' : '']
        .filter(Boolean).join(' ');
      edges.push({ data: { id: `${p}->${s.id}`, source: p, target: s.id }, classes });
    }
  }

  // Size each node by its connection count.
  const deg = degreeMap(edges);
  for (const n of nodes) n.data.size = nodeSize(deg.get(n.data.id) || 0);

  return [...nodes, ...edges];
}

// Routes every edge clear of node rows as an explicit orthogonal polyline
// (`curve-style: segments` via the `routed` class) — every edge gets literal
// waypoints rather than leaning on Cytoscape's `taxi` solver, which can
// collapse its turn into a diagonal near the endpoints when there isn't room
// to honour `taxi-turn-min-distance`. Two regimes for computing the waypoints:
//
// **Short edges** (vertical span ≤ 1.5 × rankSep — adjacent ranks, or a band-gap
// hop onto the next band's first rank): a single horizontal jog in the gutter
// between the source and target ranks. Every gutter between rank rows is
// node-free (layoutSwimlanes() guarantees it), so the jog never crosses a
// node row.
//
// **Long edges** (span > 1.5 × rankSep) would still drop their single vertical
// run straight through every intermediate node row, so they get a longer
// polyline instead: down from the source into the gutter below it, across to
// a vertical **corridor between strand columns** (the inter-lane gap zones
// are node-free at every y), down the corridor, then across the gutter above
// the target and into it. Corridor candidates come from `layout.lanes` —
// midpoints between consecutive lanes plus an outer margin either side — and
// parallel edges spread a few px apart within the ~80px corridor so they
// don't fuse into one line.
//
// Both regimes stagger their gutter lines by index within the target's gutter
// group so parallel jogs land on distinct y lines. Cross-course edges get the
// same routing (they're the likeliest to be long) and stay dashed amber via
// their style class. `layout` is the { lanes, rows } object layoutSwimlanes()
// returns; `rankSep` must match the value it was run with (default RANK_SEP,
// shared via import) so the gutter lines actually land in the gutters.
export function routeEdges(cy, layout, rankSep = RANK_SEP) {
  const edges = cy.edges();

  // Node-free vertical corridor x's: between consecutive strand columns, plus a
  // margin corridor outside each end so outermost-lane edges have a side channel.
  const lanes = layout?.lanes || [];
  const corridors = [];
  if (lanes.length) {
    corridors.push(lanes[0].xLeft - 40);
    for (let i = 0; i + 1 < lanes.length; i++)
      corridors.push((lanes[i].xRight + lanes[i + 1].xLeft) / 2);
    corridors.push(lanes[lanes.length - 1].xRight + 40);
  }
  const laneIndexOf = (x) => lanes.findIndex((l) => x >= l.xLeft && x <= l.xRight);

  // Group by the target's rank (its gutter). Falls back to the position-derived
  // gutter if a node somehow has no `_rank` (e.g. layoutSwimlanes wasn't run) —
  // still deterministic, just coarser.
  const byGutter = new Map();
  edges.forEach((e) => {
    const t = e.target();
    const gutter = t.data('_rank') ?? Math.round(t.position('y') / rankSep);
    if (!byGutter.has(gutter)) byGutter.set(gutter, []);
    byGutter.get(gutter).push(e);
  });

  const LINES = 7; // distinct jog lines per gutter
  const SPREAD = 30; // px either side of the gutter midline
  for (const group of byGutter.values()) {
    group.forEach((e, i) => {
      // Per-edge stagger offset, shared by both of this edge's gutter lines so
      // one edge stays on one line throughout its route.
      const stag = -SPREAD + ((i % LINES) / (LINES - 1)) * (2 * SPREAD);
      const S = e.source().position();
      const T = e.target().position();
      const down = T.y >= S.y ? 1 : -1;
      const sN = e.source(), tN = e.target();
      // Pinned endpoints directly above/below each node's centre — see the
      // note below on why segments project against these rather than S/T.
      const SE = { x: S.x, y: S.y + down * (sN.outerHeight() / 2) };
      const TE = { x: T.x, y: T.y - down * (tN.outerHeight() / 2) };

      let pts;
      if (Math.abs(T.y - S.y) <= 1.5 * rankSep || corridors.length === 0) {
        // Short edge (or no corridor geometry to work with): a single
        // horizontal jog in the gutter between source and target ranks —
        // explicit waypoints rather than a `taxi-turn` offset, so the bend
        // is a guaranteed right angle instead of Cytoscape's `taxi` solver
        // occasionally collapsing the turn into a diagonal near the ends.
        const g = S.y + down * (rankSep / 2 + stag);
        pts = [
          [S.x, g],
          [T.x, g]
        ];
      } else {
        // Long edge: pick the corridor nearest the route's centre of gravity —
        // between the two columns when source and target sit in different lanes,
        // beside the shared column when they don't (so the edge hugs its own lane
        // instead of wandering across the map).
        const sameLane = laneIndexOf(S.x) === laneIndexOf(T.x);
        const ref = sameLane ? S.x : (S.x + T.x) / 2;
        let cx = corridors.reduce((best, c) => (Math.abs(c - ref) < Math.abs(best - ref) ? c : best));
        cx += ((i % LINES) - (LINES - 1) / 2) * 8; // spread within the ~80px corridor

        // Orthogonal waypoints: source → its gutter → corridor → target's gutter →
        // target. Both horizontal runs sit in node-free gutters and the vertical
        // run sits in the node-free corridor, so nothing crosses a node row.
        // `down` handles the (defensive) upward-edge case by mirroring the gutters.
        const g1 = S.y + down * (rankSep / 2 + stag);
        const g2 = T.y - down * (rankSep / 2 + stag);
        pts = [
          [S.x, g1],
          [cx, g1],
          [cx, g2],
          [T.x, g2]
        ];
      }

      // Cytoscape 'segments' expresses each waypoint P relative to the
      // *actual edge endpoints* (source-endpoint/target-endpoint), not the
      // node centres — so weight/distance are projected against SE→TE
      // (vector V) rather than S→T: weight = projection of (P−SE) onto V as
      // a fraction of |V|, distance = signed offset along the unit
      // perpendicular (−Vy, Vx)/|V|. We also pin source-endpoint/
      // target-endpoint below to these same points (straight above/below
      // each node's centre) so the entry/exit stubs and arrowheads stay
      // vertical instead of angling toward the node centre.
      const vx = TE.x - SE.x;
      const vy = TE.y - SE.y;
      const len2 = vx * vx + vy * vy;
      if (len2 === 0) return; // coincident endpoints; nothing sane to route
      const len = Math.sqrt(len2);
      const weights = [];
      const dists = [];
      for (const [px, py] of pts) {
        const rx = px - SE.x;
        const ry = py - SE.y;
        weights.push(((rx * vx + ry * vy) / len2).toFixed(4));
        dists.push(((rx * -vy + ry * vx) / len).toFixed(2));
      }
      e.addClass('routed');
      e.style({
        'segment-weights': weights.join(' '),
        'segment-distances': dists.join(' '),
        'source-endpoint': `0 ${down * sN.outerHeight() / 2}`,
        'target-endpoint': `0 ${-down * tN.outerHeight() / 2}`,
        // Without this, Cytoscape projects the weights/distances against the
        // node-border intersection line (`edge-distances: intersection`), not
        // the endpoints above — which skews every reconstructed waypoint.
        'edge-distances': 'endpoints'
      });
    });
  }
}

export function getCyStyle(isDark = true) {
  const edgeColor = isDark ? '#475569' : '#94a3b8';
  const highlight = isDark ? '#38bdf8' : '#0284c7';
  const nodeFill = isDark ? '#0f172a' : '#ffffff'; // solid node centre (matches backdrop)
  const litColor = isDark ? '#f8fafc' : '#000000'; // bold near-black/near-white for the focused chain
  const ready = '#06b6d4'; // cyan "ready now" halo
  return [
    {
      // Circle whose face is a mastery progress ring (data(ring), an SVG data URI
      // baked at build time) and whose diameter (data(size)) grows with connection
      // count. Course colour is intentionally not shown — strand grouping comes from
      // the lane tints. Labels are drawn by a KaTeX HTML overlay (see Map.svelte), not
      // by Cytoscape's canvas text, so no label styling lives here.
      selector: 'node',
      style: {
        // Solid disc (white in light, dark in dark) so the band tint and crossing
        // links don't show through the centre; the ring SVG composites on top.
        'background-color': nodeFill,
        'background-opacity': 1,
        'background-image': 'data(ring)',
        'background-fit': 'cover',
        'overlay-opacity': 0,
        'border-width': 0,
        width: 'data(size)',
        height: 'data(size)'
      }
    },
    {
      // Intra-topic links: crisp orthogonal taxi lanes. Downward (bottom-exit)
      // flow — leave the node's bottom, drop down a vertical lane, branch
      // horizontally into the target. routeEdges() overrides taxi-turn per edge
      // so parallel lanes land on distinct Y lines instead of overlapping (and
      // upgrades long edges to segments — see edge.routed below). Faint by
      // default so a dense graph reads cleanly; focus lights the chain (`lit`).
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': edgeColor,
        'line-opacity': 0.32,
        'target-arrow-color': edgeColor,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.7,
        'overlay-opacity': 0,
        'curve-style': 'taxi',
        'taxi-direction': 'vertical',
        'taxi-turn': '50%',
        'taxi-turn-min-distance': 10
      }
    },
    // Zoomed-out legibility: Map.svelte toggles `far` on every edge when the zoom
    // drops below a threshold — thicker, more opaque strokes so the graph's shape
    // still reads from a distance. Placed before the cross-course rules so those
    // (equal class-specificity, later in the sheet) keep their width/colour; the
    // dedicated cross-course.far rule below re-softens their opacity.
    { selector: 'edge.far', style: { width: 2.5, 'line-opacity': 0.5, 'arrow-scale': 1 } },
    // Focus state: the chain of the hovered/clicked node comes to full strength —
    // bold near-black (light) / near-white (dark), thicker, fully opaque.
    {
      selector: 'edge.lit',
      style: {
        width: 3,
        'line-color': litColor,
        'target-arrow-color': litColor,
        'line-opacity': 1,
        'arrow-scale': 1
      }
    },
    // Cross-topic links span between courses/strands. Same orthogonal routing
    // family as intra-topic edges (routeEdges places their turns in node-free
    // gutters/corridors, like every other edge) but dashed amber and faint until
    // a node is focused, so they still read as a different kind of link.
    {
      selector: 'edge.cross-course',
      style: {
        width: 1.5,
        'line-color': '#b9823c',
        'target-arrow-color': '#b9823c',
        'line-style': 'dashed',
        'line-opacity': 0.18,
        'arrow-scale': 0.7,
        'curve-style': 'taxi',
        'taxi-direction': 'vertical',
        'taxi-turn': '50%',
        'taxi-turn-min-distance': 10
      }
    },
    // Zoomed-out variant, softer than plain edge.far so the dashed amber layer
    // doesn't overwhelm the in-course structure. Before .lit so lit still wins.
    { selector: 'edge.cross-course.far', style: { 'line-opacity': 0.3 } },
    { selector: 'edge.cross-course.lit', style: { 'line-opacity': 0.85, width: 1.5 } },
    // Long edges routed through inter-column corridors by routeEdges(): explicit
    // orthogonal polylines whose waypoints live in per-edge segment-weights/
    // -distances styles. Placed after the taxi rules (base edge and
    // cross-course) so this curve-style wins for routed edges of either kind;
    // .far/.lit only touch width/opacity so they compose with it unchanged.
    { selector: 'edge.routed', style: { 'curve-style': 'segments' } },
    // Ready-now frontier: dashed cyan halo + bolded, tinted label chip.
    {
      selector: 'node.ready',
      style: {
        'border-width': 2,
        'border-style': 'dashed',
        'border-color': ready,
        'font-weight': 'bold',
        color: ready
      }
    },
    { selector: 'node.boundary', style: { opacity: 0.4, 'font-size': 11 } },
    { selector: 'edge.boundary-edge', style: { opacity: 0.35, width: 1.5 } },
    // Nodes outside the focused chain dim back so the lit chain stands out.
    { selector: 'node.dim', style: { opacity: 0.4 } },
    { selector: '.faded', style: { opacity: 0.1 } },
    { selector: 'node.highlight', style: { 'border-width': 4, 'border-style': 'solid', 'border-color': highlight } },
    { selector: 'edge.highlight', style: { 'line-color': highlight, 'target-arrow-color': highlight, width: 3 } }
  ];
}
