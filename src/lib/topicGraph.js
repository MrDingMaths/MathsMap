// Builds a topic-level meta-graph: each node is a topic, each edge an aggregated
// prerequisite relationship rolled up from the underlying skill prerequisites.
// This is the default, low-detail view of the Map — far fewer nodes than the
// full skill graph, so it stays legible with several courses selected.
import { skills, topicById, skillById, topicsForSkill } from './data.js';
import { getMastery } from './store.js';
import { masteryColour, masteryLabel } from './graph.js';

const MASTERY_KEYS = ['none', 'learning', 'proficient', 'mastered'];

// Most-common mastery bucket across a set of skills (ties → higher mastery).
function dominantMastery(skillIds) {
  const counts = { none: 0, learning: 0, proficient: 0, mastered: 0 };
  for (const id of skillIds) counts[getMastery(id)]++;
  let best = 'none';
  for (const k of MASTERY_KEYS) {
    if (counts[k] >= counts[best]) best = k;
  }
  return best;
}

// `courseIds` may be a string or an array of course ids.
export function buildTopicElements({ courseIds = null } = {}) {
  const wanted = courseIds == null ? null : new Set([].concat(courseIds));

  let pool = skills;
  if (wanted) pool = pool.filter((s) => (s.courses || []).some((c) => wanted.has(c)));
  const poolIds = new Set(pool.map((s) => s.id));

  // Group the in-scope skills by the topics they map to (restricted to topics
  // whose course set intersects the selection).
  const topicSkills = new Map(); // topicId -> skill ids
  for (const s of pool) {
    for (const topicId of topicsForSkill(s.id)) {
      const topic = topicById.get(topicId);
      if (!topic) continue;
      if (wanted && !(topic.courses || []).some((c) => wanted.has(c))) continue;
      if (!topicSkills.has(topicId)) topicSkills.set(topicId, []);
      topicSkills.get(topicId).push(s.id);
    }
  }

  const nodes = [];
  for (const [topicId, skillIds] of topicSkills) {
    const topic = topicById.get(topicId);
    const mastery = dominantMastery(skillIds);
    nodes.push({
      data: {
        id: topicId,
        label: topic.title,
        blurb: topic.blurb || '',
        strand: topic.strand,
        stage: topic.stage,
        course: topic.title,
        colour: topic.color || '#64748b',
        skillCount: skillIds.length,
        masteryKey: mastery,
        masteryLabel: masteryLabel[mastery],
        mastery: masteryColour[mastery]
      }
    });
  }

  // Aggregate edges: topic A -> topic B when some skill in B requires a skill in A
  // (A != B). Cross-course when the contributing skill relationship spans courses.
  const edgeMap = new Map(); // `${a}->${b}` -> cross flag
  for (const [topicB, skillIds] of topicSkills) {
    for (const sid of skillIds) {
      const s = skillById.get(sid);
      for (const p of s?.prereqs || []) {
        if (!poolIds.has(p)) continue;
        const cross = !(skillById.get(p)?.courses || []).some((c) =>
          (s.courses || []).includes(c)
        );
        for (const topicA of topicsForSkill(p)) {
          if (!topicSkills.has(topicA) || topicA === topicB) continue;
          const key = `${topicA}->${topicB}`;
          // Keep cross=true if any contributing relationship crosses courses.
          edgeMap.set(key, (edgeMap.get(key) || false) || cross);
        }
      }
    }
  }

  const edges = [];
  for (const [key, cross] of edgeMap) {
    const [source, target] = key.split('->');
    edges.push({ data: { id: key, source, target }, classes: cross ? 'cross-course' : '' });
  }

  return [...nodes, ...edges];
}
