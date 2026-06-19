// Builds a topic-level meta-graph: each node is a topic, each edge an aggregated
// prerequisite relationship rolled up from the underlying skill prerequisites.
// This is the default, low-detail view of the Map — far fewer nodes than the
// full skill graph, so it stays legible with several courses selected.
import { skills, topicById, skillById, topicsForSkill } from './data.js';
import { getMastery } from './store.js';
import { masteryColour, masteryLabel } from './graph.js';
import { ringSvg, trackColour } from './ring.js';
import { plainMath } from './mathText.js';

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

// Mastered / in-progress proportions across a topic's skills, for a two-segment
// ring (mirrors statsFor in store.js — in-progress folds learning + proficient).
function masteryStats(skillIds) {
  let mastered = 0;
  let inProgress = 0;
  for (const id of skillIds) {
    const m = getMastery(id);
    if (m === 'mastered') mastered++;
    else if (m === 'learning' || m === 'proficient') inProgress++;
  }
  const total = skillIds.length || 1;
  return {
    masteredPct: Math.round((mastered / total) * 100),
    inProgressPct: Math.round((inProgress / total) * 100),
    fullyMastered: mastered === skillIds.length && skillIds.length > 0,
    started: mastered + inProgress > 0
  };
}

// `courseIds` may be a string or an array of course ids.
export function buildTopicElements({ courseIds = null, isDark = false } = {}) {
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

  const track = trackColour(isDark);
  const nodes = [];
  const statsById = new Map(); // topicId -> { fullyMastered, started }
  for (const [topicId, skillIds] of topicSkills) {
    const topic = topicById.get(topicId);
    const mastery = dominantMastery(skillIds);
    const stats = masteryStats(skillIds);
    statsById.set(topicId, stats);
    const ring = stats.fullyMastered
      ? ringSvg({ track, full: true })
      : ringSvg({
          track,
          // Longer (amber) arc first so the green mastered arc sits on top.
          segments: [
            { pct: stats.masteredPct + stats.inProgressPct, color: '#fbbf24' },
            { pct: stats.masteredPct, color: '#16a34a' }
          ]
        });
    nodes.push({
      data: {
        id: topicId,
        label: plainMath(topic.title),
        name: topic.title,
        blurb: topic.blurb || '',
        strand: topic.strand,
        stage: topic.stage,
        course: topic.title,
        colour: topic.color || '#64748b',
        skillCount: skillIds.length,
        masteryKey: mastery,
        masteryLabel: masteryLabel[mastery],
        mastery: masteryColour[mastery],
        ring
      }
    });
  }

  // Aggregate edges: topic A -> topic B when some skill in B requires a skill in A
  // (A != B). Cross-course when the contributing skill relationship spans courses.
  const edgeMap = new Map(); // `${a}->${b}` -> cross flag
  for (const [topicB, skillIds] of topicSkills) {
    const stageB = topicById.get(topicB)?.stage;
    for (const sid of skillIds) {
      const s = skillById.get(sid);
      for (const p of s?.prereqs || []) {
        if (!poolIds.has(p)) continue;
        // Attribute the prerequisite to a single source topic — its primary
        // (first) topic that is visible. A skill shared across stages otherwise
        // injects spurious edges from its later-stage topics, creating cycles
        // that scramble dagre's ranking.
        const topicA = topicsForSkill(p).find((t) => topicSkills.has(t));
        if (!topicA || topicA === topicB) continue;
        // Skill prerequisites are stage-monotonic, so a later -> earlier topic
        // edge is always an artifact of shared skills; drop it.
        const stageA = topicById.get(topicA)?.stage;
        if (stageA != null && stageB != null && stageA > stageB) continue;
        const cross = !(skillById.get(p)?.courses || []).some((c) =>
          (s.courses || []).includes(c)
        );
        const key = `${topicA}->${topicB}`;
        // Keep cross=true if any contributing relationship crosses courses.
        edgeMap.set(key, (edgeMap.get(key) || false) || cross);
      }
    }
  }

  const edges = [];
  const prereqsOf = new Map(); // topic -> [prerequisite topics]
  for (const [key, cross] of edgeMap) {
    const [source, target] = key.split('->');
    edges.push({ data: { id: key, source, target }, classes: cross ? 'cross-course' : '' });
    if (!prereqsOf.has(target)) prereqsOf.set(target, []);
    prereqsOf.get(target).push(source);
  }

  // "Ready now": a topic not yet started whose every prerequisite topic is fully
  // mastered — the frontier the student can pick up next.
  for (const n of nodes) {
    const stats = statsById.get(n.data.id);
    const prereqs = prereqsOf.get(n.data.id) || [];
    const ready =
      !stats.started &&
      prereqs.length > 0 &&
      prereqs.every((t) => statsById.get(t)?.fullyMastered);
    if (ready) n.classes = 'ready';
  }

  return [...nodes, ...edges];
}
