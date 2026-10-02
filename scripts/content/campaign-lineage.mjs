import { CAMPAIGN_PROFILE, assignmentExecutionProfile } from './campaign-execution-profile.mjs';
// Assignment identities are coordinator declarations, not model-output claims.
// Native actor IDs identify an actual continuing agent; external identities come
// only from the runner's reported ephemeral provider sessions.
export const WORKER_LINEAGE_PROFILE = 'stable-worker-lineage-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const string = value => typeof value === 'string' && value.trim() && value === value.trim();
export function bindWorkerLineage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !['profile', 'kind', 'actorId', 'origin'].includes(key)) || (value.origin !== undefined && value.origin !== 'coordinator-bound')) throw new Error('Coordinator worker lineage required for a fresh strict assignment');
  if (value.profile && value.profile !== WORKER_LINEAGE_PROFILE) throw new Error('Unknown worker lineage profile');
  if (!['native', 'external-ephemeral'].includes(value.kind)) throw new Error('Worker lineage kind must be native or external-ephemeral');
  if (value.kind === 'native' && (!string(value.actorId) || !/^\/[a-z0-9_]+(?:\/[a-z0-9_]+)*$/.test(value.actorId))) throw new Error('Canonical stable actual native actorId required; assignment UUID is not an actor identity');
  if (value.kind === 'external-ephemeral' && value.actorId != null) throw new Error('External actor identity must come from actual runner sessions');
  return { profile: WORKER_LINEAGE_PROFILE, kind: value.kind, actorId: value.kind === 'native' ? value.actorId : null, origin: 'coordinator-bound' };
}
const canonical = value => value && typeof value === 'object' ? (Array.isArray(value) ? value.map(canonical) : Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))) : value;
export function sameWorkerLineage(a, b) { return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)); }
function sessionIds(metrics) {
  return [...new Set([metrics?.sessionId, ...(metrics?.sessions || []).map(session => typeof session === 'string' ? session : session?.sessionId)].filter(string))];
}
function metadataAliases(lineage, role, workerId, metrics, profile, strict, expectedProfile = CAMPAIGN_PROFILE) {
  const identityKey = role === 'author' ? 'authorIdentity' : 'reviewerIdentity';
  for (const record of [metrics, profile].filter(Boolean)) {
    if (typeof record !== 'object' || Array.isArray(record)) throw new Error('Worker provenance must be an object');
    if (record.workerId !== undefined && record.workerId !== workerId) throw new Error('Worker/profile assignment identity mismatch');
    for (const key of ['authorIdentity', 'reviewerIdentity', 'actorId']) if (record[key] !== undefined && (!string(record[key]) || record[key] !== lineage.actorId)) throw new Error('Conflicting stable worker identity alias: ' + key);
    if (record.workerLineage !== undefined && !sameWorkerLineage(record.workerLineage, lineage)) throw new Error('Conflicting worker lineage binding');
    if (strict) for (const [key, expected] of [['model', 'gpt-6.1-sol'], ['requestedModel', 'gpt-6.1-sol'], ['effort', expectedProfile.effort], ['requestedServiceTier', 'default'], ['fastMode', false]]) if (record[key] !== undefined && record[key] !== null && record[key] !== expected) throw new Error('Conflicting exposed worker setting: ' + key);
  }
  if (strict) {
    const record = profile || metrics;
    if (!record || !string(record[identityKey])) throw new Error('Missing native ' + identityKey);
    if (metrics?.nativeInterface === 'collaboration' && !string(metrics[identityKey])) throw new Error('Missing native metrics ' + identityKey);
    if (profile && !string(profile[identityKey])) throw new Error('Missing native profile ' + identityKey);
    if (record.model !== 'gpt-6.1-sol' || record.effort !== expectedProfile.effort || record.requestedServiceTier !== 'default') throw new Error('Explicit exposed Sol 6.1 assignment effort and requested default settings required');
  }
}
export function authorLineage(state) {
  if (state.stage?.workerLineage) return clone(state.stage.workerLineage);
  // This is actual supplied historical metadata, not a fabricated missing ID.
  const actorId = state.stage?.metrics?.authorIdentity;
  return string(actorId) ? { profile: 'historical-supplied-identity', kind: 'native', actorId, origin: 'historical-author-metrics' } : null;
}
export function checkWorkerIndependence(state, lineage) {
  const author = authorLineage(state);
  const knownNativeAuthors = [author, ...(state.stage?.nativeAuthorLineage || []).map(entry=>entry.workerLineage)].filter(entry=>entry?.kind==='native');
  if (lineage?.kind === 'native' && knownNativeAuthors.some(entry=>entry.actorId===lineage.actorId)) throw new Error('Independent review must use a different stable actual native worker from the author and retained strict authorship ancestry');
  if (lineage?.kind === 'external-ephemeral' && author?.kind === 'external-ephemeral' && lineage.sessionIds?.some(id => author.sessionIds?.includes(id))) throw new Error('Independent review must use different actual external runner sessions');
}
export function retainedNativeAuthorLineage(previousStage, nextLineage=null) {
  const rows = [...(previousStage?.nativeAuthorLineage || [])];
  if (previousStage?.workerLineage?.profile === WORKER_LINEAGE_PROFILE && previousStage.workerLineage.kind === 'native') rows.push({workerLineage:clone(previousStage.workerLineage),stageHash:previousStage.hash,candidateHash:previousStage.candidateHash,author:previousStage.author});
  else if(nextLineage?.profile===WORKER_LINEAGE_PROFILE&&string(previousStage?.metrics?.authorIdentity))rows.push({workerLineage:{profile:'historical-supplied-identity',kind:'native',actorId:previousStage.metrics.authorIdentity,origin:'historical-author-metrics'},stageHash:previousStage.hash,candidateHash:previousStage.candidateHash,author:previousStage.author});
  return [...new Map(rows.map(row=>[row.stageHash+':'+row.workerLineage.actorId,clone(row)])).values()];
}
export function validateWorkerProvenance(state, { role, workerId, metrics = null, profile = null, lineage = state.owner?.workerLineage, strict = lineage?.profile === WORKER_LINEAGE_PROFILE, expectedProfile = assignmentExecutionProfile(state) } = {}) {
  if (!lineage) return null; // Unmigrated historical owners retain their policy.
  if (lineage.profile !== WORKER_LINEAGE_PROFILE && strict) throw new Error('Unknown captured worker lineage profile');
  if (lineage.kind === 'native') {
    metadataAliases(lineage, role, workerId, metrics, profile, strict, expectedProfile);
  } else {
    if (profile?.reviewerIdentity || profile?.authorIdentity || metrics?.reviewerIdentity || metrics?.authorIdentity || metrics?.nativeInterface === 'collaboration') throw new Error('Native provenance cannot masquerade as an external ephemeral worker');
    if (!['codex', 'bounded-codex'].includes(metrics?.provider)) throw new Error('Actual external runner provenance required');
    const sessions = sessionIds(metrics);
    if (!sessions.length || sessions.includes(workerId) || sessions.includes(state.owner?.assignmentId)) throw new Error('Actual external provider session IDs required, not inferred assignment IDs');
    for (const record of [metrics, profile].filter(Boolean)) {
      if (record.workerId !== undefined && record.workerId !== workerId) throw new Error('Worker/profile assignment identity mismatch');
      if (record.actorId != null) throw new Error('External stable native actor alias is invalid');
      if (record.workerLineage !== undefined && !sameWorkerLineage(record.workerLineage, lineage)) throw new Error('Conflicting worker lineage binding');
      for (const [key, expected] of [['model', 'gpt-6.1-sol'], ['requestedModel', 'gpt-6.1-sol'], ['effort', expectedProfile.effort], ['requestedServiceTier', 'default'], ['fastMode', false]]) if (record[key] !== undefined && record[key] !== null && record[key] !== expected) throw new Error('Conflicting exposed worker setting: ' + key);
    }
    if (profile && sessionIds(profile).some(id => !sessions.includes(id))) throw new Error('Conflicting external provider session alias');
    lineage = { ...lineage, sessionIds: sessions, origin: 'runner-reported-sessions' };
  }
  if (role === 'review') checkWorkerIndependence(state, lineage);
  return clone(lineage);
}
export function validateReviewProfileBinding(state, workerId, profile) {
  const lineage = state.review?.workerLineage;
  if (lineage) {
    validateWorkerProvenance(state, { role: 'review', workerId, metrics: state.review.metrics, profile, lineage, expectedProfile: state.review.executionProfile || CAMPAIGN_PROFILE });
  } else if (string(profile?.reviewerIdentity)) {
    // Do not migrate accepted evidence. Reject contradictory future attachments
    // where an actual stable identity already exists, including old native work.
    const known = state.review.reviewerProfile?.reviewerIdentity || state.review.metrics?.reviewerIdentity;
    if (known && profile.reviewerIdentity !== known) throw new Error('Cannot replace the recorded stable reviewer identity');
    const legacy = { kind: 'native', actorId: profile.reviewerIdentity };
    metadataAliases(legacy, 'review', workerId, state.review.metrics, profile, false);
    checkWorkerIndependence(state, legacy);
  }
}
export function validateVisualWorkerBinding(state, workerId, profile, { historical = false, expectedProfile = historical ? CAMPAIGN_PROFILE : assignmentExecutionProfile(state) } = {}) {
  const strict = !historical && (state.stage.workerLineage?.profile === WORKER_LINEAGE_PROFILE || state.stage.nativeAuthorLineage?.length);
  if (strict || profile?.workerLineage) {
    if (!profile?.workerLineage) throw new Error('Explicit coordinator-bound visual worker lineage required');
    const lineage = bindWorkerLineage(profile.workerLineage);
    return validateWorkerProvenance(state, { role: 'review', workerId, profile, metrics: lineage.kind === 'external-ephemeral' ? profile : null, lineage, strict: true, expectedProfile });
  }
  if (string(profile?.reviewerIdentity)) {
    const lineage = { kind: 'native', actorId: profile.reviewerIdentity };
    metadataAliases(lineage, 'review', workerId, null, profile, false);
    checkWorkerIndependence(state, lineage);
  }
  return null;
}
