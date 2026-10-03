import test from 'node:test';
import assert from 'node:assert/strict';
import { hashValue } from '../scripts/content/campaign-sources.mjs';
import { CONTEXT_REVALIDATION_PROFILE, revalidateContextOutcomes } from '../scripts/content/campaign-context-revalidation.mjs';

function fixture() {
  const deps = theory => {
    const body = { context: { skill: { id: 'child' }, prerequisiteTheory: [{ id: 'parent', theory }] }, paths: [{ path: 'source.md', hash: 'source' }] };
    return { hash: hashValue(body), ...body };
  };
  const oldTheory = { intro: 'Multiply', facts: ['Signs'], steps: ['Multiply factors'], workedExamples: [] };
  const currentTheory = { ...oldTheory, facts: ['Signs for whole number powers'], workedExamples: [{ question: '2 × 3', answer: '6' }] };
  const before = deps(oldTheory), currentDependencies = deps(currentTheory);
  const coverage = { methods: [{ id: 'multiply', description: 'Multiply factors', sourceRefs: [0] }], items: [{ where: 'practice.foundation[0]', hash: 'item', methods: ['multiply'] }] };
  const old = { hash: 'old-stage', candidateHash: 'pair', dependencyHash: before.hash, coverage, sourceReview: [{ path: 'source.md', hash: 'source', startLine: 1, endLine: 10, observation: 'Old reading' }], workerLineage: { kind: 'native', actorId: '/root/author' } };
  const currentStage = { ...structuredClone(old), hash: 'current-stage', dependencyHash: currentDependencies.hash };
  currentStage.sourceReview[0].observation = 'Fresh reading';
  const prior = { stage: old, dependencies: before, review: { stageHash: old.hash, reviewer: 'original-peer', reviewedAt: 'then', outcomes: [{ where: 'practice.foundation[0]', hash: 'item', verdict: 'accepted', independentSolution: '2 × 3 = 6', observation: 'Source method valid' }], findings: [] } };
  const reference = { path: 'immutable.json', hash: 'prior-ref' };
  const confirmation = { profile: CONTEXT_REVALIDATION_PROFILE, actorId: '/root/peer', priorReferenceHash: reference.hash, oldStageHash: old.hash, currentStageHash: currentStage.hash, candidateHash: 'pair', oldDependencyHash: before.hash, currentDependencyHash: currentDependencies.hash, parents: [{ id: 'parent', oldTheoryHash: hashValue(oldTheory), currentTheoryHash: hashValue(currentTheory), scopeStillValid: true, observation: 'Read both complete Theories; qualification and example preserve this taught multiplication.' }], methods: [{ id: 'multiply', hash: hashValue(coverage.methods[0]), requiresFreshDerivation: false, observation: 'Source and parent still teach the assessed method.' }] };
  return { prior, reference, currentStage, currentDependencies, items: [{ where: 'practice.foundation[0]', hash: 'item' }], confirmation, reviewerLineage: { kind: 'native', actorId: '/root/peer' } };
}
test('explicit different peer retains arithmetic through example additions and fact qualification, leaving original evidence untouched', () => {
  const input = fixture(), original = JSON.stringify(input.prior);
  const retained = revalidateContextOutcomes(input);
  assert.equal(retained.length, 1);
  assert.equal(retained[0].independentSolution, '2 × 3 = 6');
  assert.equal(retained[0].reusedFrom.stageHash, 'old-stage');
  assert.notEqual(retained[0].contextRevalidatedFrom.oldDependencyHash, retained[0].contextRevalidatedFrom.currentDependencyHash);
  assert.equal(JSON.stringify(input.prior), original);
});
test('relevant method change requires fresh affected item derivation', () => {
  const input = fixture(); input.confirmation.methods[0].requiresFreshDerivation = true;
  assert.deepEqual(revalidateContextOutcomes(input), []);
});
test('changed parent instruction sequence cannot be waived by scope confirmation', () => {
  const input = fixture(); input.currentDependencies.context.prerequisiteTheory[0].theory.steps = ['Use a different method'];
  const { hash, ...body } = input.currentDependencies; input.currentDependencies.hash = hashValue(body);
  input.currentStage.dependencyHash = input.currentDependencies.hash;
  input.confirmation.currentDependencyHash = input.currentDependencies.hash;
  input.confirmation.parents[0].currentTheoryHash = hashValue(input.currentDependencies.context.prerequisiteTheory[0].theory);
  assert.deepEqual(revalidateContextOutcomes(input), []);
});
for (const [name, mutate] of Object.entries({
  source: input => { input.currentDependencies.paths[0].hash = 'changed'; },
  item: input => { input.items[0].hash = 'changed'; },
  parent: input => { input.confirmation.parents[0].currentTheoryHash = 'stale'; },
  actor: input => { input.reviewerLineage.actorId = '/root/author'; input.confirmation.actorId = '/root/author'; },
  method: input => { input.currentStage.coverage.methods[0].description = 'Changed method'; },
  stage: input => { input.confirmation.currentStageHash = 'stale'; },
  reference: input => { input.confirmation.priorReferenceHash = 'stale'; },
  missing: input => { input.confirmation = null; }
})) test('rejects stale/unsupported ' + name, () => { const input = fixture(); mutate(input); assert.throws(() => revalidateContextOutcomes(input)); });
