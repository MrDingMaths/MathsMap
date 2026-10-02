// Prospective campaign exceptions never migrate historical assignment settings.
export const CAMPAIGN_PROFILE = Object.freeze({ model: 'gpt-6.1-sol', effort: 'high', requestedServiceTier: 'default', maxWorkers: 3 });
export const EXECUTION_OVERRIDE_PROFILE = 'user-requested-sol61-medium-v1';
export function validateExecutionProfile(profile = CAMPAIGN_PROFILE) {
  if (!profile || profile.model !== CAMPAIGN_PROFILE.model || profile.requestedServiceTier !== 'default' || profile.maxWorkers !== 3 || !['high', 'medium'].includes(profile.effort)) throw new Error('Invalid campaign execution profile');
  if (profile.effort === 'medium' && (profile.executionOverrideProfile !== EXECUTION_OVERRIDE_PROFILE || profile.reasoningOverride?.effort !== 'medium' || !profile.reasoningOverride?.reason?.trim())) throw new Error('Medium requires the captured explicit user execution override');
  return profile;
}
export function assignmentExecutionProfile(state) { return validateExecutionProfile(state.owner?.profile || state.review?.executionProfile || CAMPAIGN_PROFILE); }
export function futureExecutionProfile(campaign) { return validateExecutionProfile(campaign.futureExecutionOverride?.profile || campaign.profile || CAMPAIGN_PROFILE); }
export function campaignRunnerConfiguration(profile) {
  validateExecutionProfile(profile);
  return { provider: 'codex', model: profile.model, effort: profile.effort, ...(profile.reasoningOverride ? { reasoningOverride: structuredClone(profile.reasoningOverride) } : {}) };
}
