// Pure rule for self-marked practice (kept free of imports so it can be tested
// in Node). Practice can raise a skill to Proficient at most: Mastered only
// ever comes from the quiz.

export const GOT_IT_FOR_PROFICIENT = 3;

/**
 * Highest level a skill's practice marks justify (never 'mastered').
 * Proficient needs GOT_IT_FOR_PROFICIENT "Got it" marks, at least one of them
 * beyond Foundation when the skill has Development or Mastery questions.
 * @param {Record<string, 'got'|'not'>} skillMarks keyed `${tier}-${index}`
 * @param {{ hasHigherTiers?: boolean }} [options]
 * @returns {'none'|'learning'|'proficient'}
 */
export function practiceLevel(skillMarks = {}, { hasHigherTiers = false } = {}) {
  const entries = Object.entries(skillMarks);
  if (!entries.length) return 'none';
  const got = entries.filter(([, mark]) => mark === 'got');
  const gotBeyondFoundation = got.some(([key]) => !key.startsWith('foundation-'));
  if (got.length >= GOT_IT_FOR_PROFICIENT && (gotBeyondFoundation || !hasHigherTiers)) return 'proficient';
  return 'learning';
}

export function practiceSummary(skillMarks = {}, options = {}) {
  const got = Object.values(skillMarks).filter((mark) => mark === 'got').length;
  return { got, needed: GOT_IT_FOR_PROFICIENT, level: practiceLevel(skillMarks, options) };
}
