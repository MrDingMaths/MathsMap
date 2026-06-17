// Builds Cytoscape elements (nodes + prerequisite edges) from the taxonomy.
import { skills, topicOf, courseById } from './data.js';
import { getMastery } from './store.js';

const masteryColour = {
  none: '#475569',
  learning: '#d97706',
  proficient: '#2563eb',
  mastered: '#16a34a'
};

export function buildElements({ courseId = null, stage = null } = {}) {
  let pool = skills;
  if (courseId) pool = pool.filter((s) => (s.courses || []).includes(courseId));
  if (stage) pool = pool.filter((s) => s.stage === Number(stage));
  const ids = new Set(pool.map((s) => s.id));

  const nodes = pool.map((s) => ({
    data: {
      id: s.id,
      label: s.title,
      stage: s.stage,
      colour: courseById.get((s.courses || [])[0])?.color || '#64748b',
      mastery: masteryColour[getMastery(s.id)]
    }
  }));

  const edges = [];
  for (const s of pool) {
    for (const p of s.prereqs || []) {
      if (ids.has(p)) edges.push({ data: { id: `${p}->${s.id}`, source: p, target: s.id } });
    }
  }
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
      width: 22,
      height: 22
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
  { selector: '.faded', style: { opacity: 0.12 } },
  { selector: '.highlight', style: { 'line-color': '#38bdf8', 'target-arrow-color': '#38bdf8', 'border-color': '#38bdf8' } }
];
