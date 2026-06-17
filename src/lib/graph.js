// Builds Cytoscape elements (nodes + prerequisite edges) from the taxonomy.
import { skills, courseById, skillById, strandForSkill, topicsForSkill } from './data.js';
import { getMastery } from './store.js';

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
  if (wantedTopics)
    pool = pool.filter((s) => topicsForSkill(s.id).some((t) => wantedTopics.has(t)));
  const ids = new Set(pool.map((s) => s.id));

  const nodes = pool.map((s) => {
    const course = courseById.get((s.courses || [])[0]);
    const mastery = getMastery(s.id);
    return {
      data: {
        id: s.id,
        label: s.title,
        blurb: s.blurb || '',
        stage: s.stage,
        strand: strandForSkill(s.id),
        courseId: course?.id || '',
        course: course?.title || '',
        colour: course?.color || '#64748b',
        masteryKey: mastery,
        masteryLabel: masteryLabel[mastery],
        mastery: masteryColour[mastery]
      }
    };
  });

  const edges = [];
  for (const s of pool) {
    for (const p of s.prereqs || []) {
      if (!ids.has(p)) continue;
      const cross = !(skillById.get(p)?.courses || []).some((c) =>
        (s.courses || []).includes(c)
      );
      edges.push({
        data: { id: `${p}->${s.id}`, source: p, target: s.id },
        classes: cross ? 'cross-course' : ''
      });
    }
  }
  applyNodeSizes(nodes, edges);
  return [...nodes, ...edges];
}

export const cyStyle = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(mastery)',
      'border-width': 3,
      'border-color': 'data(colour)',
      label: 'data(label)',
      color: '#e2e8f0',
      'font-size': 10,
      'text-wrap': 'wrap',
      'text-max-width': 130,
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
      'line-color': '#475569',
      'target-arrow-color': '#475569',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier'
    }
  },
  // Prerequisite links that span two different courses stand out.
  {
    selector: 'edge.cross-course',
    style: {
      width: 2.5,
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      'line-style': 'dashed'
    }
  },
  { selector: '.faded', style: { opacity: 0.1 } },
  { selector: 'node.highlight', style: { 'border-color': '#38bdf8', 'border-width': 4 } },
  { selector: 'edge.highlight', style: { 'line-color': '#38bdf8', 'target-arrow-color': '#38bdf8', width: 3 } }
];
