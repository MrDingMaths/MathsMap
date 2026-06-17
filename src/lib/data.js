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
