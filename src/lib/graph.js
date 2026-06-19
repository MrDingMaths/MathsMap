// Builds Cytoscape elements (nodes + prerequisite edges) from the taxonomy.
import { skills, courseById, skillById, strandForSkill, topicsForSkill } from './data.js';
import { getMastery } from './store.js';
import { plainMath } from './mathText.js';
import { ringSvg, trackColour } from './ring.js';

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
  return [...nodes, ...edges];
}

export function getCyStyle(isDark = true) {
  const nodeText = isDark ? '#e2e8f0' : '#1e293b';
  const edgeColor = isDark ? '#475569' : '#94a3b8';
  const highlight = isDark ? '#38bdf8' : '#0284c7';
  const chipBg = isDark ? '#273449' : '#f1f5f9'; // --panel-2
  const ready = '#06b6d4'; // cyan "ready now" halo
  return [
    {
      // Uniform circle whose face is a mastery progress ring (data(ring), an SVG
      // data URI baked at build time). Course colour is intentionally not shown —
      // strand grouping comes from the lane tints. Label sits in a chip so it never
      // lands on an edge.
      selector: 'node',
      style: {
        'background-opacity': 0,
        'background-image': 'data(ring)',
        'background-fit': 'cover',
        'border-width': 0,
        width: 40,
        height: 40,
        label: 'data(label)',
        color: nodeText,
        'font-size': 13,
        'text-wrap': 'wrap',
        'text-max-width': 92,
        'text-valign': 'bottom',
        'text-margin-y': 6,
        'text-background-color': chipBg,
        'text-background-opacity': 1,
        'text-background-shape': 'round-rectangle',
        'text-background-padding': 3
      }
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': edgeColor,
        'target-arrow-color': edgeColor,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.8,
        'curve-style': 'taxi',
        'taxi-direction': 'vertical',
        // Default fallback; staggerEdges() overrides taxi-turn per edge so
        // parallel horizontal segments separate onto distinct Y lines.
        'taxi-turn': '50%',
        'taxi-turn-min-distance': 2
      }
    },
    // Prerequisite links that span two different courses stand out — but gently.
    {
      selector: 'edge.cross-course',
      style: {
        width: 1.5,
        'line-color': '#b9823c',
        'target-arrow-color': '#b9823c',
        'line-style': 'dashed',
        'line-opacity': 0.75,
        'arrow-scale': 0.8
      }
    },
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
    { selector: '.faded', style: { opacity: 0.1 } },
    { selector: 'node.highlight', style: { 'border-width': 4, 'border-style': 'solid', 'border-color': highlight } },
    { selector: 'edge.highlight', style: { 'line-color': highlight, 'target-arrow-color': highlight, width: 3 } }
  ];
}
