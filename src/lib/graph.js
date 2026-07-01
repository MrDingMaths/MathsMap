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

// Places every taxi edge's horizontal jog inside the empty gutter just above its
// target node — every gutter between rank rows is node-free (layoutSwimlanes()
// guarantees it), so an absolute px turn measured from the target end never
// crosses a node row the way the old midpoint-percentage turn could. `-Npx` means
// "N px up from the target end" (a negative taxi-turn is measured from the target
// instead of the source). Edges sharing a target's gutter are staggered across a
// handful of deterministic lines so parallel jogs don't stack into one lane.
// Cross-course edges are bezier curves and are left untouched. `rankSep` must
// match the value layoutSwimlanes() was run with (default RANK_SEP, shared via
// import) so the stagger band actually lands inside the gutter.
export function staggerEdges(cy, rankSep = RANK_SEP) {
  const edges = cy.edges().filter((e) => !e.hasClass('cross-course'));

  // Group by the target's rank (its gutter). Falls back to the rendered y ÷
  // rankSep if a node somehow has no `_rank` (e.g. layoutSwimlanes wasn't run) —
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
  const mid = rankSep / 2;
  for (const group of byGutter.values()) {
    group.forEach((e, i) => {
      const px = mid - SPREAD + ((i % LINES) / (LINES - 1)) * (2 * SPREAD);
      e.style('taxi-turn', `-${Math.round(px)}px`);
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
      // horizontally into the target. staggerEdges() overrides taxi-turn per edge
      // so parallel lanes land on distinct Y lines instead of overlapping. Faint
      // by default so a dense graph reads cleanly; focus lights the chain (`lit`).
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
    // Cross-topic links span between courses/strands. Drawn as a gentle bezier
    // bow so they read as clearly different from the square intra-topic lanes,
    // dashed amber, and faint until a node is focused.
    {
      selector: 'edge.cross-course',
      style: {
        width: 1.5,
        'line-color': '#b9823c',
        'target-arrow-color': '#b9823c',
        'line-style': 'dashed',
        'line-opacity': 0.18,
        'arrow-scale': 0.7,
        'curve-style': 'unbundled-bezier',
        'control-point-distances': '40',
        'control-point-weights': '0.5'
      }
    },
    { selector: 'edge.cross-course.lit', style: { 'line-opacity': 0.85, width: 1.5 } },
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
