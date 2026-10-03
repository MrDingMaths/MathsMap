import test from 'node:test';
import assert from 'node:assert/strict';
import { hashValue } from '../scripts/content/campaign-sources.mjs';
import { CAPTURE_PRESENTATION_BINDING, validateBoundPresentationResolution } from '../scripts/content/campaign-presentation-findings.mjs';

function fixture() {
  const finding = { where: 'quiz.q2.question_text', description: 'Presentation only: clipped label.' };
  const outcomes = [{ where: 'quiz.q2', hash: 'whole-item', verdict: 'accepted', independentSolution: 'Independently derived answer.', options: [{ mathematicallyCorrect: true, observation: 'Verified explanation.' }] }];
  const binding = { skillId: 'fixture', stageHash: 'stage', outcomesHash: hashValue(outcomes), findings: [[finding.where, hashValue(finding), 'field']] };
  const state = { skillId: 'fixture', stage: { hash: 'stage' }, review: { findings: [finding], outcomes, requiredVisuals: [{ where: finding.where, hash: 'field' }] } };
  const resolution = { where: finding.where, findingHash: hashValue(finding), observation: 'Complete original pixels inspected after shared repair.' };
  const checked = [{ where: finding.where, hash: 'field', accepted: true, inspectionMode: 'fresh', actualPixelInspection: true }];
  return { binding, state, resolution, checked };
}

test('registered capture repairs preserve accepted mathematical outcomes and original findings', () => {
  const f = fixture(), before = structuredClone(f.state);
  const evidence = validateBoundPresentationResolution(f.binding, f.state, f.resolution, f.checked);
  assert.deepEqual(f.state, before);
  assert.deepEqual(evidence.originalFinding, before.review.findings[0]);
  assert.equal(evidence.preservedMathematicalOutcomesHash, hashValue(before.review.outcomes));
  assert.equal(CAPTURE_PRESENTATION_BINDING.findings.length, 6);
  assert.ok(Object.isFrozen(CAPTURE_PRESENTATION_BINDING.findings[0]));
});

test('a description or supplied replacement cannot clear changed mathematics or unregistered findings', () => {
  for (const mutate of [
    f => { f.state.skillId = 'other'; },
    f => { f.state.stage.hash = 'changed'; },
    f => { f.state.review.outcomes[0].independentSolution = 'Changed'; },
    f => { f.state.review.outcomes[0].verdict = 'repair'; f.binding.outcomesHash = hashValue(f.state.review.outcomes); },
    f => { f.resolution.findingHash = 'unregistered'; },
    f => { f.state.review.findings[0].description += ' altered'; },
    f => { f.state.review.requiredVisuals[0].hash = 'changed'; },
    f => { f.resolution.outcome = { verdict: 'accepted' }; },
    f => { f.resolution.observation = ' '; },
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => validateBoundPresentationResolution(f.binding, f.state, f.resolution, f.checked), /exact registered/);
  }
});

test('negative, reused, absent or mismatched field inspections cannot resolve capture findings', () => {
  for (const mutate of [
    f => { f.checked = []; },
    f => { f.checked[0].accepted = false; },
    f => { f.checked[0].inspectionMode = 'identical-png-reuse'; },
    f => { f.checked[0].actualPixelInspection = false; },
    f => { f.checked[0].hash = 'other'; },
    f => { f.checked[0].where = 'other'; },
  ]) {
    const f = fixture(); mutate(f);
    assert.throws(() => validateBoundPresentationResolution(f.binding, f.state, f.resolution, f.checked), /fresh actual/);
  }
});
