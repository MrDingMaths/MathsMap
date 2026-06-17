// "What should I learn next?" — pure function over the prerequisite DAG.
// A skill is recommended when it is not yet mastered but every prerequisite is.
import { skills, courseById } from './data.js';
import { getMastery } from './store.js';

const stageOf = (s) => s.stage ?? 0;

export function nextSkills({ courseId = null, limit = 12 } = {}) {
  const pool = courseId
    ? skills.filter((s) => (s.courses || []).includes(courseId))
    : skills;

  const ready = pool.filter((s) => {
    if (getMastery(s.id) === 'mastered') return false;
    return (s.prereqs || []).every((p) => getMastery(p) === 'mastered');
  });

  ready.sort(
    (a, b) =>
      stageOf(a) - stageOf(b) ||
      (a.difficulty ?? 0) - (b.difficulty ?? 0) ||
      a.title.localeCompare(b.title)
  );
  return ready.slice(0, limit);
}

// Skills blocked only because some prerequisite is unmet — useful for "coming up".
export function lockedSkills(skill) {
  return (skill.prereqs || []).filter((p) => getMastery(p) !== 'mastered');
}

export function courseLabel(id) {
  return courseById.get(id)?.title ?? id;
}
