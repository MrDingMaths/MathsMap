import { normalizeContentFile, normalizeBank } from './booklet-model.js';
import { PILOT_RECIPE, PILOT_SOURCE_SKILLS } from './booklet-pilot.js';
import { skills, courses, topics, dotpoints, courseById, topicById, dotpointById } from './data.js';

export const bookletSkillCatalog = skills.map((skill) => ({
  id: skill.id,
  title: skill.title,
  blurb: skill.blurb ?? '',
  difficulty: skill.difficulty,
  courses: skill.courses ?? [],
  topics: [...new Set((skill.dotPointIds ?? []).map((id) => dotpointById.get(id)?.topicId).filter(Boolean))],
}));

export { courses, topics, dotpoints };

function enrich(question, skillId) {
  const skill = skills.find((item) => item.id === skillId);
  return {
    ...question,
    skillId,
    skillIds: question.skillIds?.length ? question.skillIds : [skillId],
    skillTitle: skill?.title ?? skillId,
    courses: skill?.courses ?? [],
    topicIds: [...new Set((skill?.dotPointIds ?? []).map((id) => dotpointById.get(id)?.topicId).filter(Boolean))],
    courseTitles: (skill?.courses ?? []).map((id) => courseById.get(id)?.title).filter(Boolean),
    topicTitles: [...new Set((skill?.dotPointIds ?? []).map((id) => topicById.get(dotpointById.get(id)?.topicId)?.title).filter(Boolean))],
    source: question.source ?? { type: 'mathsmap', skillId, tier: question.difficulty, questionId: question.id },
  };
}

export async function loadSkillBank(skillId, fetchImpl = fetch, { basePath = '/content' } = {}) {
  const response = await fetchImpl(`${basePath}/${skillId}.json`);
  if (!response.ok) throw new Error(`Unable to load ${skillId} (${response.status})`);
  return normalizeContentFile(skillId, await response.json()).map((question) => enrich(question, skillId));
}

export async function loadBankForSkills(skillIds, fetchImpl = fetch, options = {}) {
  const records = await Promise.all([...new Set(skillIds ?? [])].map((skillId) => loadSkillBank(skillId, fetchImpl, options)));
  return normalizeBank(records.flat());
}

export async function loadPilotBank(fetchImpl = fetch, { basePath = '/content' } = {}) {
  const records = await Promise.all(PILOT_SOURCE_SKILLS.map((skillId) => loadSkillBank(skillId, fetchImpl, { basePath })));
  return normalizeBank(records.flat());
}

export { PILOT_RECIPE, PILOT_SOURCE_SKILLS };
