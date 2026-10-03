import { assessmentItems } from './campaign-support.mjs';
import { inside, readJson } from './campaign-sources.mjs';
import { LEAN_PROFILE, preflightReview } from './campaign-lean.mjs';

export const COMPACT_REVIEW_PROFILE = 'compact-independent-review-v1';
const meaningful = value => typeof value === 'string' && value.trim().length > 0;
function expandRows(rows, items, label) {
  if (!Array.isArray(rows)) throw new Error('Explicit ' + label + ' array required');
  const seen = new Set();
  return rows.map(row => {
    if (!row || !meaningful(row.where) || seen.has(row.where)) throw new Error('Missing/duplicate compact ' + label + ' locator');
    seen.add(row.where);
    const item = items.find(item => item.where === row.where);
    if (!item) throw new Error('Unknown compact ' + label + ' locator: ' + row.where);
    const expanded = structuredClone(row);
    if (!Object.hasOwn(row, 'optionSet')) return expanded;
    if (item.kind !== 'quiz' || Object.hasOwn(row, 'options')) throw new Error('Option set requires a quiz without a second options array: ' + row.where);
    const set = row.optionSet;
    if (!set || set.checkedEveryOption !== true || set.checkedEveryExplanation !== true || !meaningful(set.observation)) throw new Error('Explicit complete ordered option/explanation inspection required: ' + row.where);
    if (Object.keys(set).some(key => !['orderedTruths', 'checkedEveryOption', 'checkedEveryExplanation', 'observation', 'exceptions'].includes(key))) throw new Error('Unknown compact option assertion');
    const count = item.value.options.length;
    if (!Array.isArray(set.orderedTruths) || set.orderedTruths.length !== count || Array.from({ length: count }, (_, index) => set.orderedTruths[index]).some(value => typeof value !== 'boolean')) throw new Error('Explicit truth for every ordered option required: ' + row.where);
    const exceptions = set.exceptions ?? [];
    if (!Array.isArray(exceptions) || new Set(exceptions.map(entry => entry?.index)).size !== exceptions.length || exceptions.some(entry => !entry || !Number.isInteger(entry.index) || entry.index < 0 || entry.index >= count || !meaningful(entry.observation) || Object.keys(entry).some(key => !['index', 'observation'].includes(key)))) throw new Error('Invalid/duplicate compact option exception: ' + row.where);
    expanded.options = set.orderedTruths.map((mathematicallyCorrect, index) => {
      const exception = exceptions.find(entry => entry.index === index);
      return { mathematicallyCorrect, observation: set.observation + (exception ? '\nOption ' + (index + 1) + ': ' + exception.observation : '') };
    });
    delete expanded.optionSet;
    return expanded;
  });
}
/** Pure assertion expansion. Candidate values supply locators/counts only, never mathematical decisions. */
export function expandCompactReviewAssertions(candidate, baseline, result) {
  if (!result || typeof result !== 'object') throw new Error('Explicit compact review result required');
  const expanded = structuredClone(result);
  expanded.outcomes = expandRows(result.outcomes, assessmentItems(candidate.content, candidate.quiz, false), 'outcomes');
  if (result.removals !== undefined) expanded.removals = expandRows(result.removals, assessmentItems(baseline.content, baseline.quiz, false), 'removals');
  return expanded;
}
/** Read-only opt-in adapter to the unchanged native lean preflight; no acceptance or ledger mutation. */
export function preflightCompactReview(root, state, input) {
  if (input?.profile !== COMPACT_REVIEW_PROFILE) throw new Error('Explicit compact review profile required');
  if (!state.stage?.candidatePath || !state.stage?.baselinePath) throw new Error('Current staged candidate and baseline required');
  const candidate = readJson(inside(root, state.stage.candidatePath));
  const baseline = readJson(inside(root, state.stage.baselinePath));
  const result = expandCompactReviewAssertions(candidate, baseline, input.result);
  return preflightReview(root, state, { profile: LEAN_PROFILE, binding: input.binding, result });
}
