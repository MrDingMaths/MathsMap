import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_PROFILE, EXECUTION_OVERRIDE_PROFILE, validateExecutionProfile, campaignRunnerConfiguration } from '../scripts/content/campaign-execution-profile.mjs';
import { astraCommandArgs } from '../scripts/booklet/codex-transcription.mjs';
import { validateWorkerProvenance, bindWorkerLineage } from '../scripts/content/campaign-lineage.mjs';
import { workerContract } from '../scripts/content/campaign-runner.mjs';

const medium = { ...CAMPAIGN_PROFILE, effort: 'medium', executionOverrideProfile: EXECUTION_OVERRIDE_PROFILE, reasoningOverride: { effort: 'medium', reason: 'switch model to gpt6.1 sol medium' } };
test('whole-skill review instructions follow captured effort and retain historical High defaults', () => {
  assert.match(workerContract('review', medium), /GPT-6\.1 Sol medium/);
  assert.doesNotMatch(workerContract('review', medium), /GPT-6\.1 Sol high/);
  assert.match(workerContract('review'), /GPT-6\.1 Sol high/);
  assert.throws(() => workerContract('review', { ...CAMPAIGN_PROFILE, effort: 'medium' }), /captured explicit user/);
});
test('CLI gets explicit Medium/default configuration while booklet defaults stay High', () => {
  const args = astraCommandArgs({ cwd: '.', raw: 'result.txt', configuration: campaignRunnerConfiguration(medium) });
  assert.ok(args.includes('model_reasoning_effort="medium"'));
  assert.ok(args.includes('service_tier="default"'));
  assert.ok(args.includes('features.fast_mode=false'));
  assert.ok(astraCommandArgs({ cwd: '.', raw: 'result.txt' }).includes('model_reasoning_effort="high"'));
  assert.throws(() => validateExecutionProfile({ ...CAMPAIGN_PROFILE, effort: 'medium' }), /captured explicit user/);
  for (const effort of ['low', 'xhigh']) assert.throws(() => validateExecutionProfile({ ...medium, effort }), /Invalid campaign/);
});
test('external Medium provenance binds assignment settings and real independent sessions', () => {
  const state = { owner: { assignmentId: 'assignment', profile: medium, workerLineage: bindWorkerLineage({ kind: 'external-ephemeral' }) }, stage: { workerLineage: { kind: 'external-ephemeral', sessionIds: ['author-session'] } } };
  const metrics = { provider: 'codex', model: 'gpt-6.1-sol', effort: 'medium', requestedServiceTier: 'default', sessionId: 'review-session' };
  assert.deepEqual(validateWorkerProvenance(state, { role: 'review', workerId: 'review', metrics }).sessionIds, ['review-session']);
  assert.throws(() => validateWorkerProvenance(state, { role: 'review', workerId: 'review', metrics: { ...metrics, effort: 'high' } }), /Conflicting exposed/);
  assert.throws(() => validateWorkerProvenance(state, { role: 'review', workerId: 'review', metrics: { ...metrics, sessionId: 'author-session' } }), /different actual external/);
});
