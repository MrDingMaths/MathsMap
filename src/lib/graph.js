// Builds Cytoscape elements (nodes + prerequisite edges) from the taxonomy.
import { skills, courseById, skillById, strandForSkill, topicsForSkill } from './data.js';
import { getMastery } from './store.js';
import { plainMath } from './mathText.js';

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

// Node diameter as a function of how many prerequisite links touch it. Sub-linear
// (sqrt) so heavily-connected hubs stand out without dwarfing everything else.
export const nodeSize = (degree) => Math.round(Math.min(64, 20 + 7 * Math.sqrt(degree)));

// Tallies degree from the built edge list and writes `size` onto each node's data.
// Shared by the skill graph and the topic meta-graph so sizing is consistent.
export function applyNodeSizes(nodes, edges) {
  const deg = new Map();
  for (const e of edges) {
    deg.set(e.data.source, (deg.get(e.data.source) || 0) + 1);
    deg.set(e.data.target, (deg.get(e.data.target) || 0) + 1);
  }
  for (const n of nodes) n.data.size = nodeSize(deg.get(n.data.id) || 0);
}

// `courseIds` may be a string or an array of course ids. With several courses
// selected, prerequisite edges that cross between courses become visible.
// `topicIds`, when given, scopes the skill graph to skills under those topics —
// used for the "drill into a topic" view so the skill graph stays small.
export function buildElements({ courseIds = null, stage = null, topicIds = null } = {}) {
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
        mastery: masteryColour[mastery]
      },
      classes: boundaryIds.has(s.id) ? 'boundary' : ''
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
  applyNodeSizes(nodes, edges);
  return [...nodes, ...edges];
}

export function getCyStyle(isDark = true) {
  const nodeText = isDark ? '#e2e8f0' : '#1e293b';
  const edgeColor = isDark ? '#475569' : '#94a3b8';
  const highlight = isDark ? '#38bdf8' : '#0284c7';
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(mastery)',
        'border-width': 3,
        'border-color': 'data(colour)',
        label: 'data(label)',
        color: nodeText,
        'font-size': 10,
        'text-wrap': 'wrap',
        'text-max-width': 84,
        'text-valign': 'bottom',
        'text-margin-y': 4,
        width: 'data(size)',
        height: 'data(size)'
      }
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': edgeColor,
        'target-arrow-color': edgeColor,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
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
    { selector: 'node.boundary', style: { opacity: 0.4, 'font-size': 8 } },
    { selector: 'edge.boundary-edge', style: { opacity: 0.35, width: 1.5 } },
    { selector: '.faded', style: { opacity: 0.1 } },
    { selector: 'node.highlight', style: { 'border-color': highlight, 'border-width': 4 } },
    { selector: 'edge.highlight', style: { 'line-color': highlight, 'target-arrow-color': highlight, width: 3 } }
  ];
}
