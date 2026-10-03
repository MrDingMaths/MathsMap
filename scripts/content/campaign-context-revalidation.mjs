import { hashValue } from './campaign-sources.mjs';
import { authorLineage, checkWorkerIndependence } from './campaign-lineage.mjs';

export const CONTEXT_REVALIDATION_PROFILE = 'prerequisite-context-revalidation-v1';
const fail = message => { throw new Error('Context revalidation: ' + message); };
const withoutParents = dependencies => ({ ...dependencies.context, prerequisiteTheory: [] });
const selection = refs => refs.map(({ observation, adjustments, ...ref }) => ref);

/** Explicit peer confirmation retains arithmetic evidence, never grants a pass from hashes alone. */
export function revalidateContextOutcomes({ prior, currentStage, currentDependencies, items, confirmation, reviewerLineage, reference }) {
  const old = prior.stage, review = prior.review, before = prior.dependencies;
  if (!confirmation || confirmation.profile !== CONTEXT_REVALIDATION_PROFILE) fail('explicit confirmation required');
  if (!reviewerLineage?.actorId || reviewerLineage.kind !== 'native' || confirmation.actorId !== reviewerLineage.actorId) fail('current actual native reviewer required');
  if (!authorLineage({ stage: old })?.actorId) fail('known original author identity required');
  checkWorkerIndependence({ stage: old }, reviewerLineage);
  if (review?.stageHash !== old?.hash || !review.outcomes?.length || review.findings?.length || review.outcomes.some(row => row.verdict !== 'accepted')) fail('complete accepted original review required');
  if (confirmation.priorReferenceHash !== reference.hash || confirmation.oldStageHash !== old.hash || confirmation.currentStageHash !== currentStage.hash || confirmation.candidateHash !== currentStage.candidateHash || confirmation.oldDependencyHash !== old.dependencyHash || confirmation.currentDependencyHash !== currentStage.dependencyHash) fail('stale reference/stage/parent binding');
  const dependencyHash = value => value && hashValue(Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'hash')));
  if (!before || dependencyHash(before) !== before.hash || dependencyHash(currentDependencies) !== currentDependencies.hash || before.hash !== old.dependencyHash || currentDependencies.hash !== currentStage.dependencyHash || hashValue(withoutParents(before)) !== hashValue(withoutParents(currentDependencies)) || hashValue(before.paths) !== hashValue(currentDependencies.paths) || hashValue(before.unavailableImages || []) !== hashValue(currentDependencies.unavailableImages || [])) fail('only prerequisite Theory may differ');
  if (old.candidateHash !== currentStage.candidateHash || hashValue(old.coverage) !== hashValue(currentStage.coverage) || hashValue(selection(old.sourceReview)) !== hashValue(selection(currentStage.sourceReview))) fail('candidate/source selection/method mapping changed');
  const changed = currentDependencies.context.prerequisiteTheory.filter(parent => hashValue(parent.theory) !== hashValue(before.context.prerequisiteTheory.find(row => row.id === parent.id)?.theory));
  if (!changed.length || confirmation.parents?.length !== changed.length) fail('every changed parent must be reviewed');
  for (const parent of changed) {
    const previous = before.context.prerequisiteTheory.find(row => row.id === parent.id);
    const rows = confirmation.parents.filter(row => row.id === parent.id), row = rows[0];
    if (!previous || rows.length !== 1 || row.oldTheoryHash !== hashValue(previous.theory) || row.currentTheoryHash !== hashValue(parent.theory) || row.scopeStillValid !== true || !row.observation?.trim()) fail('missing/stale full parent confirmation');
  }
  const methods = currentStage.coverage.methods;
  if (confirmation.methods?.length !== methods.length) fail('every taught method requires explicit confirmation');
  const fresh = new Set();
  for (const method of methods) {
    const rows = confirmation.methods.filter(row => row.id === method.id), row = rows[0];
    if (rows.length !== 1 || row.hash !== hashValue(method) || typeof row.requiresFreshDerivation !== 'boolean' || !row.observation?.trim()) fail('missing/stale method confirmation');
    if (row.requiresFreshDerivation) fresh.add(method.id);
  }
  // A changed instruction sequence is substantive: explicit scope prose cannot waive fresh derivations.
  if (changed.some(parent => hashValue(parent.theory?.steps ?? null) !== hashValue(before.context.prerequisiteTheory.find(row => row.id === parent.id)?.theory?.steps ?? null))) for (const method of methods) fresh.add(method.id);
  return review.outcomes.filter(outcome => {
    const item = items.find(item => item.where === outcome.where);
    if (!item || item.hash !== outcome.hash) fail('stale original item');
    const mapping = currentStage.coverage.items.find(row => row.where === outcome.where);
    return mapping && !mapping.methods.some(id => fresh.has(id));
  }).map(outcome => ({ ...structuredClone(outcome), reusedFrom: outcome.reusedFrom || { stageHash: old.hash, reviewer: review.reviewer, reviewedAt: review.reviewedAt }, contextRevalidatedFrom: { reference: structuredClone(reference), oldDependencyHash: old.dependencyHash, currentDependencyHash: currentStage.dependencyHash, actorId: reviewerLineage.actorId } }));
}
