// Loads the curated taxonomy and builds in-memory indexes used across views.
import courses from '../../data/courses.json';
import topics from '../../data/topics.json';
import dotpoints from '../../data/dotpoints.json';
import skills from '../../data/skills.json';
import meta from '../../data/meta.json';

export { courses, topics, dotpoints, skills, meta };

export const courseById = new Map(courses.map((c) => [c.id, c]));
export const topicById = new Map(topics.map((t) => [t.id, t]));
export const dotpointById = new Map(dotpoints.map((d) => [d.id, d]));
export const skillById = new Map(skills.map((s) => [s.id, s]));

// Reverse prerequisite edges: skill id -> ids of skills that depend on it.
export const dependentsOf = new Map(skills.map((s) => [s.id, []]));
for (const s of skills) {
  for (const p of s.prereqs || []) {
    if (dependentsOf.has(p)) dependentsOf.get(p).push(s.id);
  }
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export const coursesByStage = () => {
  const map = new Map();
  for (const c of [...courses].sort(byOrder)) {
    if (!map.has(c.stage)) map.set(c.stage, []);
    map.get(c.stage).push(c);
  }
  return map;
};

export const topicsForCourse = (courseId) =>
  topics.filter((t) => (t.courses || []).includes(courseId)).sort(byOrder);

export const dotpointsForTopic = (topicId) =>
  dotpoints.filter((d) => d.topicId === topicId).sort(byOrder);

// Skills under a topic, optionally scoped to a course, grouped by dot point.
export const skillsForTopic = (topicId, courseId = null) => {
  const dps = dotpointsForTopic(topicId);
  return dps.map((dp) => ({
    dotpoint: dp,
    skills: skills.filter(
      (s) =>
        (s.dotPointIds || []).includes(dp.id) &&
        (!courseId || (s.courses || []).includes(courseId))
    )
  }));
};

export const searchSkills = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return skills
    .filter((s) => s.title.toLowerCase().includes(q) || (s.blurb || '').toLowerCase().includes(q))
    .slice(0, 30);
};

export const topicOf = (skill) =>
  topicById.get(dotpointById.get((skill.dotPointIds || [])[0])?.topicId);

// Fixed strand order — used as the swimlane band order in the Map view.
export const STRANDS = [
  'Number & Algebra',
  'Measurement & Space',
  'Statistics & Probability',
  'Functions & Calculus'
];

// Ordered, unique topic ids a skill maps to (via its dot points).
export const topicsForSkill = (skillId) => {
  const skill = skillById.get(skillId);
  if (!skill) return [];
  const seen = new Set();
  const out = [];
  for (const dpId of skill.dotPointIds || []) {
    const topicId = dotpointById.get(dpId)?.topicId;
    if (topicId && !seen.has(topicId)) {
      seen.add(topicId);
      out.push(topicId);
    }
  }
  return out;
};

// The skill's primary topic (first dot point's topic) — used for band assignment.
export const primaryTopicForSkill = (skillId) =>
  topicById.get(topicsForSkill(skillId)[0]);

// Previous/next sibling skills under the same (primary) dot point, optionally scoped
// to a course — drives the prev/next stepper on the skill page. Nulls at the ends.
export const siblingSkills = (skillId, courseId = null) => {
  const skill = skillById.get(skillId);
  const topic = skill ? primaryTopicForSkill(skillId) : null;
  if (!skill || !topic) return { prev: null, next: null };
  const dpId = (skill.dotPointIds || [])[0];
  const group = skillsForTopic(topic.id, courseId).find((g) => g.dotpoint.id === dpId);
  const list = group?.skills ?? [];
  const i = list.findIndex((s) => s.id === skillId);
  if (i < 0) return { prev: null, next: null };
  return { prev: list[i - 1] ?? null, next: list[i + 1] ?? null };
};

// The strand a skill belongs to, via its primary topic. Falls back to the first band.
export const strandForSkill = (skillId) =>
  primaryTopicForSkill(skillId)?.strand || STRANDS[0];

// Vertical band key for the Map grid: the `order` of the earliest *selected* course a
// node belongs to. Earliest selected course wins for nodes shared across courses, so a
// node always lands in one band. Falls back to 0 (single band) when no selection.
export const bandOrderFor = (courseIds, selectedSet) => {
  let min = Infinity;
  for (const c of courseIds || []) {
    if (selectedSet && !selectedSet.has(c)) continue;
    const o = courseById.get(c)?.order ?? 0;
    if (o < min) min = o;
  }
  return Number.isFinite(min) ? min : 0;
};

// Title of the earliest selected course a node belongs to — the band's label.
export const bandLabelFor = (courseIds, selectedSet) => {
  let best = null;
  let min = Infinity;
  for (const c of courseIds || []) {
    if (selectedSet && !selectedSet.has(c)) continue;
    const o = courseById.get(c)?.order ?? 0;
    if (o < min) { min = o; best = courseById.get(c)?.title || null; }
  }
  return best;
};
