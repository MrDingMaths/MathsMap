import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { validateCandidatePair } from '../validate.mjs';
import { workedExampleEntries, theoryTextFields } from '../../src/lib/theory-content.js';
import { checkCampaignStepsRepair } from '../check-theory.mjs';
import { revalidateContextOutcomes } from './campaign-context-revalidation.mjs';
import { verifyCampaignRenderReceipt, withCampaignRendererContext, pngDimensions } from './campaign-visual-evidence.mjs';
import { CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE, verifyCampaignScopedRenderActivation } from './campaign-render-dependencies.mjs';

export function campaignRendererOptions(campaign) {
  if (campaign.rendererDependencyProfile === undefined && campaign.rendererActivation === undefined) return {};
  if (campaign.rendererDependencyProfile !== CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE || !campaign.rendererActivation?.path || !campaign.rendererActivation?.hash) throw new Error('Explicit scoped renderer campaign policy and immutable activation required');
  return { profile: campaign.rendererDependencyProfile, activation: campaign.rendererActivation };
}
function reviewRendererProfile(root, review) {
  // Mode discovery grants no trust. Full canonical validation checks every byte.
  try {
    const bytes=fs.readFileSync(inside(root,review.renderReceipt.path));
    if(hashValue(bytes)!==review.renderReceipt.hash)return null;
    return JSON.parse(bytes).rendererDependencyProfile;
  }
  catch { return null; }
}
function withReviewRendererContexts(root, campaign, reviews, validate) {
  const needsScoped=reviews.some(review=>reviewRendererProfile(root,review)===CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE);
  if (!needsScoped) return withCampaignRendererContext(root,validate);
  const options=campaignRendererOptions(campaign);
  if(options.profile!==CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE)throw new Error('Scoped capture requires explicit accepted campaign renderer activation');
  // Keep both held contexts alive for mixed historical evidence; never relabel v2.
  if(reviews.every(review=>reviewRendererProfile(root,review)===CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE))return withCampaignRendererContext(root,scoped=>validate({rendererContexts:{scoped},rendererActivation:options.activation}),options);
  return withCampaignRendererContext(root,legacy=>withCampaignRendererContext(root,scoped=>validate({rendererContexts:{legacy,scoped},rendererActivation:options.activation}),options));
}
import { verifyApplicableRenderReceipt, verifyTerminalPixelReuse, bindCurrentRenderField, LAYOUT_APPLICABILITY_PROFILE } from './campaign-render-applicability.mjs';

function verifyReviewRender(root,candidateHash,field,review,context){
  if(context?.rendererContexts) {
    if(reviewRendererProfile(root,review)===CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE) {
      const receipt=readJson(inside(root,review.renderReceipt.path));
      if(hashValue(receipt.rendererActivation)!==hashValue(context.rendererActivation))throw new Error('Scoped receipt activation differs from explicit campaign policy');
      context=context.rendererContexts.scoped;
    } else context=context.rendererContexts.legacy;
  }
  if(!review?.rendererApplicability)return verifyCampaignRenderReceipt(root,candidateHash,field,review?.renderReceipt,context);
  const captured=verifyApplicableRenderReceipt(root,candidateHash,field,review.renderReceipt,review.rendererApplicability,context);
  if(captured.applicability.profile===LAYOUT_APPLICABILITY_PROFILE&&review.inspectionMode!=='identical-png-reuse')throw new Error('Layout applicability requires genuine terminal positive original inspection reuse');
  if(review.inspectionMode==='identical-png-reuse')verifyTerminalPixelReuse(root,field,review.reusedInspection?.review||review.reusedInspection?.artifact,captured,review.reusedInspection?.profile||review.reusedInspection?.profileReference);
  return captured;
}
import { WORKER_LINEAGE_PROFILE, bindWorkerLineage, sameWorkerLineage, checkWorkerIndependence, retainedNativeAuthorLineage, validateWorkerProvenance, validateReviewProfileBinding, validateVisualWorkerBinding } from './campaign-lineage.mjs';
import { hashValue, readJson, inside, relative, sourceCatalog, governingScope, mappedSources, taxonomyAt, scopeDependencies, validateSourceImages, preservePreparedSourceImages, unavailableImageDecisionHash } from './campaign-sources.mjs';

export { hashValue };
export { WORKER_LINEAGE_PROFILE };
import { CAMPAIGN_PROFILE, EXECUTION_OVERRIDE_PROFILE, assignmentExecutionProfile, futureExecutionProfile } from './campaign-execution-profile.mjs';
import { PREREQUISITE_CONTEXT_PROFILE, NATIVE_PREREQUISITE_READ_CONTRACT, planPrerequisiteContext, savePrerequisiteContext, validatePrerequisiteContext, validateReadAcknowledgment, prerequisitePacketContext, hasPrerequisiteContext } from './campaign-prerequisite-context.mjs';
import { CAPTURE_PRESENTATION_BINDING, validateBoundPresentationResolution } from './campaign-presentation-findings.mjs';
import { REPAIR_METADATA_PROFILE, REPAIR_METADATA_READ_CONTRACT, planRepairMetadata, saveRepairMetadata, validateRepairMetadata, saveRepairMetadataRead, hasRepairMetadata } from './campaign-repair-metadata.mjs';
export { PREREQUISITE_CONTEXT_PROFILE };
export { REPAIR_METADATA_PROFILE };
export { CAMPAIGN_PROFILE };
export const BOUNDED_CONTEXT_PROFILE = 'source-metadata-refs-v1';
export const PREVIOUS_REVIEW_PROFILE = 'whole-item-prior-review-ref-v1';
export const PACKET_SOURCE_PROFILE = 'packet-source-evidence-ref-v1';
export const REPAIR_PACKET_PROFILE = 'repair-common-source-ref-v1';
export const DEFAULT_CAMPAIGN = 'worked-examples-2026-09';
const now = () => new Date().toISOString();
const idPattern = /^[a-z0-9][a-z0-9-]*$/;
const assertId = id => { if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(id || '')) throw new Error('Invalid identifier: ' + id); return id; };
export function campaignPaths(root, campaignId = DEFAULT_CAMPAIGN) {
  assertId(campaignId);
  return { ledger: path.join(root, 'booklets/provenance/content-campaign', campaignId), work: path.join(root, '.agywork/content-campaign', campaignId) };
}
function save(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.' + randomUUID() + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  fs.renameSync(temp, file);
}
function lock(root, campaignId, callback) {
  const { work } = campaignPaths(root, campaignId); fs.mkdirSync(work, { recursive: true });
  // Unique bakery tickets expose PID/host before an owner file exists, so death
  // at any instruction is reclaimable without stealing a newer owner's lock.
  const directory = path.join(work, 'campaign-locks'); fs.mkdirSync(directory, { recursive: true });
  const host = os.hostname(), token = `${process.pid}-${Buffer.from(host).toString('hex')}-${randomUUID()}`, own = path.join(directory, token);
  fs.mkdirSync(own);
  const tickets = () => fs.readdirSync(directory).flatMap(name => {
    const match = /^(\d+)-([0-9a-f]+)-([a-z0-9-]+)$/.exec(name); if (!match) return [];
    const ticket = inside(root, path.join(directory, name));
    if (Buffer.from(match[2], 'hex').toString() === host) {
      let dead = false; try { process.kill(Number(match[1]), 0); } catch (error) { dead = error.code === 'ESRCH'; }
      if (dead) { fs.rmSync(ticket, { recursive: true, force: true }); return []; }
    }
    const owner = path.join(ticket, 'owner.json');
    try { return [{ name, number: fs.existsSync(owner) ? readJson(owner).number : null }]; }
    catch (error) { if (error.code === 'ENOENT' && !fs.existsSync(ticket)) return []; throw error; }
  });
  try {
    const number = 1 + Math.max(0, ...tickets().map(ticket => ticket.number || 0));
    save(path.join(own, 'owner.json'), { pid: process.pid, host, number, at: now() });
    if (tickets().some(ticket => ticket.name !== token && (ticket.number === null || ticket.number < number || (ticket.number === number && ticket.name < token)))) throw new Error('Campaign ledger busy; retry after active mutation finishes');
    return callback();
  } finally { fs.rmSync(inside(root, own), { recursive: true, force: true }); }
}
const ledgerFile = (root, campaignId) => path.join(campaignPaths(root, campaignId).ledger, 'campaign.json');
const skillFile = (root, campaignId, skillId) => path.join(campaignPaths(root, campaignId).ledger, 'skills', assertId(skillId) + '.json');
export const readCampaign = (root, campaignId = DEFAULT_CAMPAIGN) => readJson(ledgerFile(root, campaignId));
export function readSkill(root, campaignId, skillId) {
  const campaign = readCampaign(root, campaignId);
  if (!campaign.skillIds.includes(skillId)) throw new Error('Skill outside frozen campaign membership: ' + skillId);
  return readJson(skillFile(root, campaignId, skillId));
}
export function capturePair(root, skillId) {
  const contentPath = path.join(root, 'public/content', assertId(skillId) + '.json'), quizPath = path.join(root, 'public/quizzes', skillId + '.json');
  const contentRaw = fs.readFileSync(contentPath, 'utf8'), quizRaw = fs.existsSync(quizPath) ? fs.readFileSync(quizPath, 'utf8') : null;
  return { content: JSON.parse(contentRaw), quiz: quizRaw === null ? null : JSON.parse(quizRaw), contentRaw, quizRaw, expected: { contentHash: hashValue(contentRaw), quizHash: quizRaw === null ? null : hashValue(quizRaw) } };
}
export function assessmentItems(content, quiz, includeTheory = true) {
  const items = [];
  const emit = (where, value, kind) => items.push({ where, kind, hash: hashValue(value), value });
  for (const tier of ['foundation', 'development', 'mastery']) (content.practice?.[tier] || []).forEach((card, i) => emit(`practice.${tier}[${i}]`, card, 'practice'));
  (quiz?.questions || []).forEach(question => emit(`quiz.${question.id}`, question, 'quiz'));
  for (const { example, where } of workedExampleEntries(content.theory)) emit('theory.' + where, example, 'example');
  if (includeTheory) emit('theory', content.theory, 'theory');
  const locations = new Set();
  for (const item of items) { if (locations.has(item.where)) throw new Error('Ambiguous item locator: ' + item.where); locations.add(item.where); }
  return items;
}
export function initCampaign(root, { campaignId = DEFAULT_CAMPAIGN, expectedSkills = 1056, expectedExcluded = 137, scopeDecisions = {}, recordedSources = {} } = {}) {
  return lock(root, campaignId, () => {
    if (fs.existsSync(ledgerFile(root, campaignId))) {
      const existing = readCampaign(root, campaignId), counts = { practice: 0, quiz: 0, examples: 0, theory: 0 };
      for (const id of existing.skillIds) for (const item of readJson(skillFile(root, campaignId, id)).baselineItems) counts[item.kind === 'example' ? 'examples' : item.kind]++;
      if (JSON.stringify(existing.initialCounts) !== JSON.stringify(counts)) { existing.initialCounts = counts; save(ledgerFile(root, campaignId), existing); }
      return existing;
    }
    const taxonomy = taxonomyAt(root), taxonomyIds = new Set(taxonomy.skills.map(skill => skill.id));
    const skillIds = fs.readdirSync(path.join(root, 'public/content')).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5)).sort();
    if (skillIds.some(id => !taxonomyIds.has(id))) throw new Error('Published file not present in skills taxonomy');
    const excludedIds = [...taxonomyIds].filter(id => !skillIds.includes(id)).sort();
    if (expectedSkills !== null && skillIds.length !== expectedSkills) throw new Error(`Published membership is ${skillIds.length}, expected ${expectedSkills}; reconcile before freezing`);
    if (expectedExcluded !== null && excludedIds.length !== expectedExcluded) throw new Error(`Excluded membership is ${excludedIds.length}, expected ${expectedExcluded}; reconcile before freezing`);
    const manifestPath = path.join(root, 'public/content-manifest.json');
    const manifest = fs.existsSync(manifestPath) ? readJson(manifestPath) : { content: {}, quiz: {} };
    const manifestIds = Object.keys(manifest.content || {}).sort();
    const catalog = sourceCatalog(root), counts = { practice: 0, quiz: 0, examples: 0, theory: 0 };
    for (const skillId of skillIds) {
      const pair = capturePair(root, skillId), skill = taxonomy.skills.find(skill => skill.id === skillId), scope = governingScope(skill, taxonomy, scopeDecisions[skillId]);
      const sources = recordedSources[skillId] || mappedSources(skill, scope, catalog, root);
      const items = assessmentItems(pair.content, pair.quiz);
      items.forEach(item => counts[item.kind === 'example' ? 'examples' : item.kind]++);
      const state = { skillId, status: scope.pending ? 'blocked' : 'pending', scope, sources, baseline: pair.expected, baselineItems: items.map(({ value, ...item }) => item), pending: scope.pending ? [scope.pending] : [], attempts: [], createdAt: now() };
      save(skillFile(root, campaignId, skillId), state);
    }
    const campaign = { format: 'mathsmap-content-campaign-v1', campaignId, createdAt: now(), profile: CAMPAIGN_PROFILE, skillIds, excludedIds, membershipHash: hashValue(skillIds), initialCounts: counts, manifestReconciliation: { hash: fs.existsSync(manifestPath) ? hashValue(fs.readFileSync(manifestPath)) : null, missing: skillIds.filter(id => !manifestIds.includes(id)), extra: manifestIds.filter(id => !skillIds.includes(id)), countMismatch: skillIds.filter(id => {
      const pair = capturePair(root, id), actual = ['foundation', 'development', 'mastery'].map(tier => pair.content.practice?.[tier]?.length || 0);
      return JSON.stringify(actual) !== JSON.stringify(manifest.content?.[id]);
    }) }, policy: { allPracticeAndQuizzes: true, stage3MathsOnly: true, methodsNotSurfaceCases: true, independentEveryItem: true, noPublicWritesByWorkers: true } };
    save(ledgerFile(root, campaignId), campaign); return campaign;
  });
}
export function statusCampaign(root, campaignId = DEFAULT_CAMPAIGN) {
  const campaign = readCampaign(root, campaignId), states = campaign.skillIds.map(id => readJson(skillFile(root, campaignId, id)));
  const counts = {}; states.forEach(state => counts[state.status] = (counts[state.status] || 0) + 1);
  return { campaignId, membership: campaign.skillIds.length, excluded: campaign.excludedIds.length, initialCounts: campaign.initialCounts, counts, owners: states.filter(state => state.owner).map(({ skillId, owner, status }) => ({ skillId, owner, status })), blockers: states.filter(state => state.pending?.length).map(({ skillId, pending }) => ({ skillId, pending })) };
}
export function activateWorkerLineagePolicy(root, { campaignId = DEFAULT_CAMPAIGN } = {}) {
  return lock(root, campaignId, () => {
    const campaign = readCampaign(root, campaignId);
    if (campaign.futureAssignmentPolicy && campaign.futureAssignmentPolicy.workerLineageProfile !== WORKER_LINEAGE_PROFILE) throw new Error('Unknown prospective assignment policy');
    if (!campaign.futureAssignmentPolicy) {
      campaign.futureAssignmentPolicy = { workerLineageProfile: WORKER_LINEAGE_PROFILE, activatedAt: now(), appliesTo: 'new ownership only; existing owners/preparations and accepted evidence unchanged' };
      save(ledgerFile(root, campaignId), campaign);
    }
    return { campaignId, policy: campaign.futureAssignmentPolicy };
  });
}
/** Explicit prospective renderer opt-in; historical captures/inspections remain immutable. */
export function activateScopedRendererPolicy(root, { campaignId = DEFAULT_CAMPAIGN, rendererActivation } = {}) {
  return lock(root,campaignId,()=>{
    const campaign=readCampaign(root,campaignId),policy={rendererDependencyProfile:CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE,rendererActivation};
    const options=campaignRendererOptions(policy);
    verifyCampaignScopedRenderActivation(root,rendererActivation);
    withCampaignRendererContext(root,()=>null,options);
    if(campaign.rendererDependencyProfile!==undefined || campaign.rendererActivation!==undefined) {
      if(hashValue(campaignRendererOptions(campaign))!==hashValue(options))throw new Error('Preserve existing explicit renderer activation; a changed policy requires separate reviewed migration');
      return {campaignId,...policy,changed:false};
    }
    Object.assign(campaign,policy);campaign.rendererActivatedAt=now();
    save(ledgerFile(root,campaignId),campaign);
    return {campaignId,...policy,changed:true};
  });
}
/** Reviewed prospective migration; the previous policy and receipts stay immutable. */
export function migrateScopedRendererPolicy(root, { campaignId = DEFAULT_CAMPAIGN, expectedPolicy, expectedPolicyHash, rendererActivation, migratedBy, reason } = {}) {
  return lock(root, campaignId, () => {
    if (!expectedPolicy || JSON.stringify(Object.keys(expectedPolicy).sort()) !== JSON.stringify(['rendererActivatedAt','rendererActivation','rendererDependencyProfile']) || !/^[a-f0-9]{64}$/.test(expectedPolicyHash || '') || hashValue(expectedPolicy) !== expectedPolicyHash || !Number.isFinite(Date.parse(expectedPolicy.rendererActivatedAt)) || !/^\/root(?:\/[a-zA-Z0-9_/-]+)?$/.test(migratedBy || '') || !reason?.trim()) throw new Error('Explicit exact existing renderer policy/hash, actor and migration reason required');
    campaignRendererOptions(expectedPolicy);
    const campaign = readCampaign(root, campaignId), current = { rendererDependencyProfile: campaign.rendererDependencyProfile, rendererActivation: campaign.rendererActivation, rendererActivatedAt: campaign.rendererActivatedAt };
    if (hashValue(current) !== expectedPolicyHash) throw new Error('Stale renderer policy migration baseline');
    if (campaign.skillIds.some(id => { const state = readSkill(root, campaignId, id); return state.status === 'publishing' || state.owner?.role === 'publish' || fs.existsSync(path.join(root, '.agywork/content-publication/active', id + '.json')); })) throw new Error('Renderer policy migration refused during publication');
    if (hashValue(fs.readFileSync(inside(root, current.rendererActivation.path))) !== current.rendererActivation.hash) throw new Error('Historical renderer activation changed');
    const next = { rendererDependencyProfile: CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE, rendererActivation };
    const options = campaignRendererOptions(next);
    if (hashValue(rendererActivation) === hashValue(current.rendererActivation)) throw new Error('Renderer migration needs a different independently reviewed activation');
    verifyCampaignScopedRenderActivation(root, rendererActivation);
    withCampaignRendererContext(root, () => null, options);
    const migratedAt = now();
    campaign.rendererPolicyHistory = [...(campaign.rendererPolicyHistory || []), { previousPolicy: structuredClone(current), previousPolicyHash: expectedPolicyHash, nextPolicy: structuredClone(next), migratedAt, migratedBy, reason }];
    Object.assign(campaign, next); campaign.rendererActivatedAt = migratedAt;
    save(ledgerFile(root, campaignId), campaign);
    return { campaignId, ...next, rendererActivatedAt: migratedAt, previousPolicyHash: expectedPolicyHash, changed: true };
  });
}
export function activateExecutionOverride(root, { campaignId = DEFAULT_CAMPAIGN, request, requestedBy } = {}) {
  if (typeof request !== 'string' || !request.trim() || typeof requestedBy !== 'string' || !requestedBy.trim()) throw new Error('Explicit human request and requestedBy required');
  return lock(root, campaignId, () => {
    const campaign = readCampaign(root, campaignId);
    if (campaign.futureExecutionOverride) {
      futureExecutionProfile(campaign);
      if (campaign.futureExecutionOverride.request !== request || campaign.futureExecutionOverride.requestedBy !== requestedBy) throw new Error('Execution override already recorded; preserve original authorization');
      return { campaignId, override: campaign.futureExecutionOverride };
    }
    campaign.futureExecutionOverride = { format: EXECUTION_OVERRIDE_PROFILE, request, requestedBy, recordedAt: now(), appliesTo: 'new assignments only; historical owners, receipts and acceptance unchanged', profile: { ...CAMPAIGN_PROFILE, effort: 'medium', executionOverrideProfile: EXECUTION_OVERRIDE_PROFILE, reasoningOverride: { effort: 'medium', reason: request } }, requestedSettings: { model: 'gpt-6.1-sol', reasoningEffort: 'medium', requestedServiceTier: 'default', fastMode: false }, interfaces: { cli: 'model, effort, default service tier and disabled fast mode explicitly configurable', native: 'model and reasoning effort configurable; service tier and fast mode controls unavailable' }, observedModel: null, actualServiceTier: null, observation: 'Requested settings only; provider model and actual service tier unavailable until explicitly observed.' };
    save(ledgerFile(root, campaignId), campaign);
    return { campaignId, override: campaign.futureExecutionOverride };
  });
}
export function nextAssignment(root, { campaignId = DEFAULT_CAMPAIGN, workerId, workerLineage = null, ids = null, authorIds = null, excludeIds = [], role = null, claimGuard = null } = {}) {
  if (!workerId) throw new Error('workerId required');
  return lock(root, campaignId, () => {
    // Optional read-only plan guard runs under the same lock, before reconciliation
    // or ownership changes. It can only refuse; all normal assignment gates follow.
    if (claimGuard !== null) {
      if (typeof claimGuard !== 'function') throw new Error('Claim guard must be a function');
      const refusal = claimGuard();
      if (refusal) return { blocked: refusal };
    }
    const campaign = readCampaign(root, campaignId), states = campaign.skillIds.map(id => readJson(skillFile(root, campaignId, id)));
    const cache = { taxonomy: taxonomyAt(root), fileHashes: new Map() };
    const selectedIds = new Set(ids || campaign.skillIds);
    for (const [label, filter] of [['ids', ids], ['authorIds', authorIds], ['excludeIds', excludeIds]]) {
      if (filter !== null && (!Array.isArray(filter) || filter.some(id => !campaign.skillIds.includes(id)))) throw new Error(label + ' outside frozen published membership');
    }
    const excluded = new Set(excludeIds), freshAuthorIds = authorIds === null ? null : new Set(authorIds);
    const freshnessStates = states.filter(state => selectedIds.has(state.skillId) && !state.owner && ['published', 'accepted', 'staged', 'visual-pending'].includes(state.status));
    const checkFreshness = context => { cache.rendererContext = context;
    for (const state of freshnessStates) {
      const freshness = liveAcceptance(root, state, cache);
      if (!freshness.mathematicsSourceCurrent) reopenForReconciliation(root, campaignId, state, freshness);
    }
    };
    if (freshnessStates.some(state => state.review?.requiredVisuals?.length)) withReviewRendererContexts(root, campaign, freshnessStates.flatMap(state => state.review?.visualReviews || []), checkFreshness);
    else checkFreshness(null);
    const owned = states.find(state => state.owner?.workerId === workerId);
    if (owned) {
      if (owned.owner.workerLineage && workerLineage && !sameWorkerLineage(owned.owner.workerLineage, bindWorkerLineage(workerLineage))) throw new Error('Cannot replace the captured worker lineage on resume');
      return selectedIds.has(owned.skillId) && !excluded.has(owned.skillId) ? { skillId: owned.skillId, ...owned.owner, resumed: true } : { blocked: 'Worker owns an assignment outside the current assignment filter; preserve or explicitly release it first' };
    }
    if (states.filter(state => state.owner && state.owner.role !== 'publish').length >= CAMPAIGN_PROFILE.maxWorkers) return { blocked: 'Three active worker assignments; complete or explicitly release ownership first' };
    const eligible = states.filter(state => selectedIds.has(state.skillId) && !excluded.has(state.skillId) && !state.owner);
    const strict = campaign.futureAssignmentPolicy?.workerLineageProfile;
    if (strict && strict !== WORKER_LINEAGE_PROFILE) throw new Error('Unknown prospective worker lineage policy');
    const lineage = strict || campaign.futureExecutionOverride || workerLineage ? bindWorkerLineage(workerLineage) : null;
    const independent = state => { if (!lineage) return true; try { checkWorkerIndependence(state, lineage); return true; } catch { return false; } };
    const review = role !== 'author' ? eligible.find(state => state.status === 'staged' && state.stage.author !== workerId && independent(state)) : null;
    const stateById = new Map(states.map(state => [state.skillId, state]));
    const prerequisitesReady = state => (cache.taxonomy.skills.find(skill => skill.id === state.skillId)?.prereqs || []).filter(id => selectedIds.has(id)).every(id => stateById.get(id)?.status === 'published');
    const selected = review || (role !== 'review' && eligible.find(state => (state.status === 'pending' || state.status === 'repair-needed') && (state.status === 'repair-needed' || state.stage || freshAuthorIds === null || freshAuthorIds.has(state.skillId)) && prerequisitesReady(state)));
    if (!selected) return role === 'review' && lineage && eligible.some(state => state.status === 'staged' && !independent(state)) ? { blocked: 'Independent review needs a different stable actual native worker' } : { done: true };
    selected.owner = { workerId, role: review ? 'review' : 'author', assignmentId: randomUUID(), assignedAt: now(), profile: structuredClone(futureExecutionProfile(campaign)), ...(lineage ? { workerLineage: lineage } : {}) };
    save(skillFile(root, campaignId, selected.skillId), selected);
    return { skillId: selected.skillId, ...selected.owner };
  });
}
export function recordSourcePreparationGap(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId = null, error, gaps = [] } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId);
    if (state.status !== 'pending' || state.stage) throw new Error('Source readiness applies only to fresh pending author work');
    if (workerId) checkOwner(state, workerId, 'author');
    else if (state.owner) throw new Error('Source readiness cannot replace active assignment evidence');
    const record = { kind: 'source-prep-gap', error, gaps: structuredClone(gaps), accepted: false, externalModelCalls: 0 };
    if (!state.sourcePreparationGap || hashValue(record) !== hashValue(Object.fromEntries(Object.entries(state.sourcePreparationGap).filter(([key]) => key !== 'checkedAt')))) state.sourcePreparationGap = { ...record, checkedAt: now() };
    state.pending = [...new Set([...(state.pending || []), 'source-prep-gap: ' + error])];
    if (workerId) delete state.owner;
    save(skillFile(root, campaignId, skillId), state); return { skillId, status: state.status, ...record };
  });
}
function liveAcceptance(root, state, cache = {}) {
  const reasons = []; let actual = null, dependencyHash = null;
  try {
    actual = capturePair(root, state.skillId).expected;
    const expected = state.status === 'published' ? state.published?.expected : state.stage?.expected;
    if (JSON.stringify(actual) !== JSON.stringify(expected)) reasons.push('live content/quiz pair differs from accepted snapshot');
    dependencyHash = scopeDependencies(root, state.skillId, state.scope, state.stage?.sourceReview || [], cache).hash;
    if (dependencyHash !== state.stage?.dependencyHash) reasons.push('source/scope/prerequisite teaching dependencies changed');
  } catch (error) { reasons.push(error.message); }
  const mathematicsSourceCurrent = reasons.length === 0, renderingReasons = [];
  const checkRendering = context => {
    for (const field of state.review?.requiredVisuals || []) {
      const review = state.review.visualReviews?.find(review => review.where === field.where && review.hash === field.hash && review.accepted);
      try {
        const currentField=review?.rendererApplicability
          ? bindCurrentRenderField(readJson(inside(root,state.stage.candidatePath)),state.stage.candidateHash,field)
          : field;
        verifyReviewRender(root, state.stage.candidateHash, currentField, review, context);
      }
      catch (error) { renderingReasons.push({ where: field.where, reason: error.message }); }
    }
  };
  if ((state.review?.requiredVisuals || []).length) {
    if (cache.rendererContext) checkRendering(cache.rendererContext);
    else withReviewRendererContexts(root, cache.rendererCampaign || {}, state.review?.visualReviews || [], checkRendering);
  }
  return { current: mathematicsSourceCurrent && !renderingReasons.length, mathematicsSourceCurrent, renderingCurrent: !renderingReasons.length, renderingReasons, skillId: state.skillId, expected: state.status === 'published' ? state.published?.expected : state.stage?.expected, actual, expectedDependencyHash: state.stage?.dependencyHash || null, actualDependencyHash: dependencyHash, reasons };
}
function reopenForReconciliation(root, campaignId, state, freshness) {
  let priorReference = null;
  if (state.stage && state.review && freshness.reasons.length === 1 && freshness.reasons[0] === 'source/scope/prerequisite teaching dependencies changed') {
    const current = scopeDependencies(root, state.skillId, state.scope, state.stage.sourceReview);
    let dependencies = null;
    if (state.stage.dependencyReference) {
      const captured = readJson(inside(root, state.stage.dependencyReference.path));
      if (hashValue(captured) !== state.stage.dependencyReference.hash) throw new Error('Changed original dependency evidence');
      dependencies = captured;
    }
    // Legacy inline packets are usable only if their complete context reconstructs the original dependency hash.
    if (!dependencies) {
      const packetPath = path.join(path.dirname(inside(root, state.stage.candidatePath)), 'packet-1.json');
      if (fs.existsSync(packetPath)) {
        const context = readJson(packetPath).context;
        const body = { context, paths: current.paths, ...(current.unavailableImages ? { unavailableImages: current.unavailableImages } : {}) };
        if (context?.prerequisiteTheory && hashValue(body) === state.stage.dependencyHash) dependencies = { hash: state.stage.dependencyHash, ...body };
      }
    }
    if (dependencies) {
      const prior = { stage: state.stage, review: state.review, dependencies };
      const file = path.join(path.dirname(inside(root, state.stage.candidatePath)), `context-prior-review-${hashValue(prior)}.json`);
      const bytes = JSON.stringify(prior, null, 2) + '\n';
      if (!fs.existsSync(file)) fs.writeFileSync(file, bytes, { flag: 'wx' });
      else if (fs.readFileSync(file, 'utf8') !== bytes) throw new Error('Changed immutable context prior review');
      priorReference = { path: relative(root, file), hash: hashValue(prior) };
    }
  }
  if (state.published) state.publishedHistory = [...(state.publishedHistory || []), { published: state.published, stageHash: state.stage?.hash, dependencyHash: state.stage?.dependencyHash, invalidatedAt: now(), reasons: freshness.reasons }];
  if (state.stage) state.stageHistory = [...(state.stageHistory || []), { stageHash: state.stage.hash, candidatePath: state.stage.candidatePath, baselinePath: state.stage.baselinePath, invalidatedAt: now(), reasons: freshness.reasons }];
  state.sources = (state.stage?.sourceReview || state.sources).map(source => ({ ...source, support: state.scope.stage === 3 || source.support === 'indirect' ? 'indirect-candidate' : 'candidate', accepted: false, hash: fs.existsSync(inside(root, source.path)) ? hashValue(fs.readFileSync(inside(root, source.path))) : null, images: (source.images || []).map(image => ({ ...image, hash: fs.existsSync(inside(root, image.path)) ? hashValue(fs.readFileSync(inside(root, image.path))) : null })) }));
  state.reconciliation = { ...freshness, ...(priorReference ? { priorReference } : {}), reopenedAt: now() }; state.pending = freshness.reasons; state.status = 'pending'; delete state.stage; delete state.review; delete state.published;
  save(skillFile(root, campaignId, state.skillId), state);
}
function checkOwner(state, workerId, role) {
  if (!state.owner || state.owner.workerId !== workerId || (role && state.owner.role !== role)) throw new Error('Worker does not own this assignment');
}
export function claimCoordinator(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, runId } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId);
    if (state.owner.prepared && !sameWorkerLineage(state.owner.workerLineage, state.owner.prepared.workerLineage)) throw new Error('Cannot change prepared worker lineage on reprepare');
    const old = state.owner.coordinator;
    if (old && old.runId !== runId) {
      let alive = old.host !== os.hostname(); if (!alive) try { process.kill(old.pid, 0); alive = true; } catch (error) { alive = error.code !== 'ESRCH'; }
      if (alive) throw new Error('Assignment coordinator is still active; duplicate dispatch refused');
    }
    state.owner.coordinator = { runId, pid: process.pid, host: os.hostname(), claimedAt: now() }; save(skillFile(root, campaignId, skillId), state); return state.owner;
  });
}
function stageDir(root, campaignId, state) { return path.join(campaignPaths(root, campaignId).work, state.skillId, state.owner.assignmentId); }
function repairReview(state, repairTargets) {
  return state.status === 'repair-needed' && state.review ? { reviewer: state.review.reviewer, stageHash: state.review.stageHash, reviewedAt: state.review.reviewedAt, outcomes: state.review.outcomes.filter(outcome => outcome.verdict !== 'accepted' || repairTargets.some(target => target.where === outcome.where || target.where.startsWith(outcome.where + '.'))), findings: state.review.findings, note: 'Other passed outcomes remain in the preserved ledger; include only failed or explicitly targeted outcomes in this repair context.' } : null;
}
function currentRepairMetadata(state) {
  const repairTargets = (state.findingRegister || []).filter(finding => finding.stageHash === state.stage?.hash).flatMap(finding => finding.targets || []);
  return { priorFindings: state.pending, repairTargets, previousReview: repairReview(state, repairTargets) };
}
/** Native workers load the complete exact artifact; this grants no reading credit. */
export function loadRepairMetadata(root, prepared, state, { requireRead = false, packets = null } = {}) {
  const captured = state.owner?.prepared;
  if (hashValue(prepared.repairMetadataReference ?? null) !== hashValue(captured?.repairMetadataReference ?? null) || prepared.repairMetadataProfile !== captured?.repairMetadataProfile) throw new Error('Changed supplied repair metadata reference');
  validatePrerequisiteContext(root, state, { requireRead: false });
  return validateRepairMetadata(root, state, currentRepairMetadata(state), { requireRead, packets });
}
export function recordRepairMetadataRead(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, acknowledgment } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId);
    const value = loadRepairMetadata(root, state.owner.prepared, state);
    state.owner.prepared.repairMetadataReadReceipt = saveRepairMetadataRead(root, state, value, acknowledgment);
    save(skillFile(root, campaignId, skillId), state);
    return structuredClone(state.owner.prepared.repairMetadataReadReceipt);
  });
}
// Only the coordinator reads this reference. Workers still receive actual inline
// observations and complete owned questions; they never need file tools.
export function loadPreviousReview(root, prepared, state, packets) {
  verifyRepairPacketEvidence(root, prepared, state, packets);
  const captured = state.owner?.prepared;
  const profile = captured?.previousReviewProfile;
  if (!profile) {
    if (prepared.previousReviewReference || packets.some(packet => packet.previousReview?.reference)) throw new Error('Unexpected previous-review reference on a legacy preparation');
    return packets[0]?.previousReview;
  }
  const ref = captured.previousReviewReference;
  if (profile !== PREVIOUS_REVIEW_PROFILE || !ref || !/^[a-f0-9]{64}$/.test(ref.hash || '') || (prepared.previousReviewReference && hashValue(prepared.previousReviewReference) !== hashValue(ref))) throw new Error('Malformed previous-review reference');
  const file = inside(root, ref.path), directory = path.dirname(inside(root, captured.snapshotPath));
  if (path.dirname(file) !== directory || path.basename(file) !== `previous-review-${ref.hash}.json`) throw new Error('Foreign previous-review reference');
  const artifact = readJson(file), snapshot = readJson(inside(root, captured.snapshotPath));
  const repairTargets = (state.findingRegister || []).filter(finding => finding.stageHash === state.stage?.hash).flatMap(finding => finding.targets || []);
  const expected = repairReview(state, repairTargets);
  if (hashValue(artifact) !== ref.hash || artifact.format !== profile || artifact.skillId !== state.skillId || artifact.assignmentId !== state.owner.assignmentId || artifact.stageHash !== state.stage?.hash || artifact.candidateHash !== state.stage?.candidateHash || artifact.snapshotHash !== hashValue({ content: snapshot.content, quiz: snapshot.quiz }) || artifact.reviewHash !== hashValue(state.review) || !expected || hashValue(artifact.previousReview) !== hashValue(expected)) throw new Error('Stale or changed previous-review reference');
  const rows = new Map();
  for (const outcome of artifact.previousReview.outcomes) {
    if (rows.has(outcome.where)) throw new Error('Duplicate previous-review outcome');
    rows.set(outcome.where, outcome);
  }
  const items = new Map(assessmentItems(snapshot.content, snapshot.quiz, false).map(item => [item.where, item]));
  for (const outcome of rows.values()) if (!items.has(outcome.where) || (outcome.hash && outcome.hash !== items.get(outcome.where).hash)) throw new Error('Stale previous-review item');
  const { outcomes, ...identity } = artifact.previousReview;
  const summary = captured.repairMetadataProfile ? { reference: captured.repairMetadataReference } : { ...identity, reference: ref };
  for (const packet of packets) {
    if (hashValue(packet.previousReview) !== hashValue(summary)) throw new Error('Changed previous-review packet identity');
    for (const item of packet.items) {
      const original = items.get(item.where);
      if (!original || item.hash !== original.hash || hashValue(item.value) !== original.hash || hashValue(item.priorReview ?? null) !== hashValue(rows.get(item.where) ?? null)) throw new Error('Changed owned item or prior review');
    }
  }
  return artifact.previousReview;
}
// This only compresses repeated packet metadata. Dispatch still supplies every
// complete actual source section, image and unavailable-image decision once.
export function verifyRepairPacketEvidence(root, prepared, state, packets) {
  const captured = state.owner?.prepared;
  if (hasRepairMetadata(root, captured || prepared)) loadRepairMetadata(root, prepared, state, { packets });
  if (!captured?.repairPacketProfile) {
    if (prepared.repairPacketProfile || packets.some(packet => packet.repairPacketProfile || packet.repairPacketEvidence)) throw new Error('Unexpected repair packet reference on a legacy preparation');
    return;
  }
  if (captured.repairPacketProfile !== REPAIR_PACKET_PROFILE || (prepared.repairPacketProfile && prepared.repairPacketProfile !== captured.repairPacketProfile)) throw new Error('Unknown repair packet profile');
  if (prepared.sourceEvidencePath !== captured.sourceEvidencePath || prepared.sourceEvidenceHash !== captured.sourceEvidenceHash || hashValue(prepared.sourceReferences) !== hashValue(captured.sources) || (prepared.dependencyHash !== undefined && prepared.dependencyHash !== captured.dependencyHash)) throw new Error('Changed supplied repair source evidence binding');
  if (path.dirname(inside(root,captured.sourceEvidencePath)) !== path.dirname(inside(root,captured.snapshotPath)) || path.basename(captured.sourceEvidencePath) !== `source-evidence-${captured.sourceEvidenceHash}.json`) throw new Error('Foreign complete repair source artifact');
  const evidence = readJson(inside(root, captured.sourceEvidencePath));
  if (hashValue(evidence) !== captured.sourceEvidenceHash) throw new Error('Changed complete repair source evidence');
  const refs = evidence.map(({ excerpt, ...ref }) => ref);
  if (hashValue(refs) !== hashValue(captured.sources)) throw new Error('Changed complete repair source metadata');
  const compact = refs.map((ref,index) => repairPacketSource(ref,index));
  const dependencies = scopeDependencies(root,state.skillId,state.scope,refs);
  if (dependencies.hash !== captured.dependencyHash) throw new Error('Changed complete repair source/scope/prerequisite evidence');
  const priorFindings = captured.repairMetadataProfile ? { reference: captured.repairMetadataReference } : state.pending;
  for (const packet of packets) if (packet.repairPacketProfile !== captured.repairPacketProfile || hashValue(packet.repairPacketEvidence) !== hashValue({ path: captured.sourceEvidencePath, hash: captured.sourceEvidenceHash }) || hashValue(packet.sourceReferences) !== hashValue(compact) || hashValue(packet.context) !== hashValue(captured.prerequisiteContextProfile ? prerequisitePacketContext(root, state, dependencies) : dependencies.context) || hashValue(packet.scope) !== hashValue(state.scope) || hashValue(packet.priorFindings) !== hashValue(priorFindings)) throw new Error('Changed or incomplete repair packet source/context references');
}
function repairPacketSource(ref, index) {
  return { ...Object.fromEntries(['path','hash','startLine','endLine','locator','support'].filter(key=>ref[key]!==undefined).map(key=>[key,ref[key]])), sourceEvidenceIndex: index, metadataHash: hashValue(ref) };
}
export function prepareAssignment(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, sources = null, maxVariableChars = 24000, prerequisiteContextProfile, repairMetadataProfile } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId);
    const capturedPrerequisiteProfile = state.owner.prepared?.prerequisiteContextProfile;
    if (state.owner.prepared && prerequisiteContextProfile !== undefined && prerequisiteContextProfile !== capturedPrerequisiteProfile) throw new Error('Cannot migrate a historical prerequisite context profile');
    const parentProfile = state.owner.prepared ? capturedPrerequisiteProfile : prerequisiteContextProfile;
    if (parentProfile !== undefined && parentProfile !== PREREQUISITE_CONTEXT_PROFILE) throw new Error('Unknown prerequisite context profile');
    const capturedMetadataProfile = state.owner.prepared?.repairMetadataProfile;
    if (state.owner.prepared && repairMetadataProfile !== undefined && repairMetadataProfile !== capturedMetadataProfile) throw new Error('Cannot migrate a historical repair metadata profile');
    const metadataProfile = state.owner.prepared ? capturedMetadataProfile : repairMetadataProfile;
    if (metadataProfile !== undefined && (metadataProfile !== REPAIR_METADATA_PROFILE || parentProfile !== PREREQUISITE_CONTEXT_PROFILE || state.owner.workerLineage?.kind !== 'native' || state.status !== 'repair-needed' || !state.review)) throw new Error('Repair metadata profile requires a current native reviewed repair and prerequisite references');
    if (state.owner.prepared && !sameWorkerLineage(state.owner.workerLineage, state.owner.prepared.workerLineage)) throw new Error('Cannot change prepared worker lineage on reprepare');
    if (sources === null && state.owner.paidCallCheckpoint) {
      const prepared = requirePrepared(root, state, state.owner.role);
      return { skillId, assignmentId: state.owner.assignmentId, role: state.owner.role, packets: prepared.packets, sourceEvidencePath: prepared.sourceEvidencePath, sourceEvidenceHash: prepared.sourceEvidenceHash, expected: prepared.expected, dependencyHash: prepared.dependencyHash, sourceReferences: prepared.sources, ...(prepared.prerequisiteContextProfile ? { prerequisiteContextProfile: prepared.prerequisiteContextProfile, prerequisiteContextReference: prepared.prerequisiteContextReference } : {}), ...(prepared.repairPacketProfile ? { repairPacketProfile: prepared.repairPacketProfile } : {}), ...(prepared.workerLineage ? { workerLineage: structuredClone(prepared.workerLineage) } : {}), ...(prepared.boundedContextProfile ? { boundedContextProfile: prepared.boundedContextProfile } : {}), ...(prepared.packetSourceProfile ? { packetSourceProfile: prepared.packetSourceProfile } : {}), ...(prepared.repairMetadataProfile ? { repairMetadataProfile: prepared.repairMetadataProfile, repairMetadataReference: prepared.repairMetadataReference } : {}), ...(prepared.previousReviewProfile ? { previousReviewProfile: prepared.previousReviewProfile, previousReviewReference: prepared.previousReviewReference } : {}) };
    }
    const dir = stageDir(root, campaignId, state); fs.mkdirSync(dir, { recursive: true });
    // Capture the format only on the first preparation of a new assignment.
    // Legacy prepared leases keep their exact payload/cache identity on resume
    // and explicit reprepare, even when this code has gained a newer format.
    const boundedContextProfile = state.owner.prepared ? state.owner.prepared.boundedContextProfile : BOUNDED_CONTEXT_PROFILE;
    const packetSourceProfile = state.owner.prepared ? state.owner.prepared.packetSourceProfile : PACKET_SOURCE_PROFILE;
    if (packetSourceProfile !== undefined && packetSourceProfile !== PACKET_SOURCE_PROFILE) throw new Error('Unknown packet source profile');
    const snapshotFile = path.join(dir, 'snapshot.json');
    if (state.owner.role === 'author' && state.publishedRepair) {
      const candidate = readJson(inside(root, state.stage.candidatePath));
      if (state.publishedRepair.stageHash !== state.stage.hash || state.publishedRepair.candidateHash !== hashValue({ content: candidate.content, quiz: candidate.quiz }) || JSON.stringify(capturePair(root, skillId).expected) !== JSON.stringify(state.publishedRepair.expected) || scopeDependencies(root, skillId, state.scope, state.stage.sourceReview).hash !== state.stage.dependencyHash) throw new Error('Stale published repair baseline/source; reconcile before preparation');
    }
    let snapshot;
    if (fs.existsSync(snapshotFile)) snapshot = readJson(snapshotFile);
    else {
      snapshot = state.owner.role === 'review' || (state.status === 'repair-needed' && state.stage) ? readJson(inside(root, state.stage.candidatePath)) : capturePair(root, skillId);
      if (state.owner.role === 'author' && state.publishedRepair) {
        snapshot.expected = structuredClone(state.publishedRepair.expected);
      }
      save(snapshotFile, snapshot);
    }
    const refs = sources || state.owner.prepared?.sources || state.stage?.sourceReview || state.sources;
    const deps = scopeDependencies(root, skillId, state.scope, refs);
    const evidenceFromRefs = selected => selected.map(ref => {
      const file = inside(root, ref.path), hash = hashValue(fs.readFileSync(file));
      if (ref.hash && ref.hash !== hash) throw new Error('Stale source: ' + ref.path);
      const lines = path.extname(file).toLowerCase() === '.md' ? fs.readFileSync(file, 'utf8').split('\n') : null;
      const start = ref.startLine || 1, end = ref.endLine || (lines ? lines.length : 0);
      const rawExcerpt = lines ? lines.slice(start - 1, end).join('\n') : null;
      // Source transcription tables contain large padding/border runs. Remove
      // only cell padding and Markdown separator length, preserving cell words,
      // mathematics, newlines, column separators and alignment markers.
      const excerpt = rawExcerpt === null ? null : rawExcerpt.split('\n').map(line => line.trimStart().startsWith('|') ? line.split('|').map(cell => cell.trim().replace(/^(:?)-{3,}(:?)$/, '$1---$2')).join('|') : line).join('\n');
      const images = validateSourceImages(root, { ...ref, startLine: start, endLine: end });
      return { ...ref, hash, excerpt, rawExcerptHash: rawExcerpt === null ? null : hashValue(rawExcerpt), excerptHash: excerpt === null ? null : hashValue(excerpt), normalization: 'markdown-table-cell-padding-and-separator-runs-v1', startLine: start, endLine: end, images };
    });
    let sourceEvidence = evidenceFromRefs(refs);
    if (state.owner.prepared?.repairPacketProfile === REPAIR_PACKET_PROFILE && hashValue(refs) === hashValue(state.owner.prepared.sources) && hashValue(sourceEvidence.map(({excerpt,...ref})=>ref)) === hashValue(state.owner.prepared.sources)) {
      const capturedEvidence = readJson(inside(root,state.owner.prepared.sourceEvidencePath));
      if (hashValue(capturedEvidence) !== state.owner.prepared.sourceEvidenceHash) throw new Error('Changed complete repair source evidence');
      // Preserve the exact earlier JSON property order as well as source bytes.
      sourceEvidence = capturedEvidence;
    }
    const repairTargets = (state.findingRegister || []).filter(finding => finding.stageHash === state.stage?.hash).flatMap(finding => finding.targets || []);
    const fullPreviousReview = repairReview(state, repairTargets);
    const previousReviewProfile = state.owner.prepared ? state.owner.prepared.previousReviewProfile : (fullPreviousReview ? PREVIOUS_REVIEW_PROFILE : undefined);
    const previousReviewArtifact = previousReviewProfile && fullPreviousReview ? { format: previousReviewProfile, skillId, assignmentId: state.owner.assignmentId, stageHash: state.stage.hash, candidateHash: state.stage.candidateHash, snapshotHash: hashValue({ content: snapshot.content, quiz: snapshot.quiz }), reviewHash: hashValue(state.review), previousReview: fullPreviousReview } : null;
    const previousReviewReference = previousReviewArtifact ? { path: relative(root, path.join(dir, `previous-review-${hashValue(previousReviewArtifact)}.json`)), hash: hashValue(previousReviewArtifact) } : null;
    const previousReview = previousReviewArtifact ? { ...Object.fromEntries(Object.entries(fullPreviousReview).filter(([key]) => key !== 'outcomes')), reference: previousReviewReference } : fullPreviousReview;
    const packetTheory = structuredClone(snapshot.content.theory); delete packetTheory.workedExample; delete packetTheory.workedExamples;
    // Reviewer observations/adjustments remain complete in the prepared refs and
    // source-evidence file; repeating them beside every question adds no source text.
    // Derived excerpt hashes/normalization remain in the immutable full evidence
    // and prepared sources. Fresh packets need not repeat them beside every
    // whole question; exact file hash/range/image/gap bindings stay inline.
    const packetSourceKeys = ['path', 'hash', 'startLine', 'endLine', 'locator', 'support', 'mapping', 'section', 'images', 'unavailableImages', ...(packetSourceProfile ? [] : ['rawExcerptHash', 'excerptHash', 'normalization'])];
    const packetSource = ref => Object.fromEntries(packetSourceKeys.filter(key => ref[key] !== undefined).map(key => [key, ref[key]]));
    const resolvedSourceGap = !!(state.sourcePreparationGap && sourceEvidence.length);
    const priorFindings = resolvedSourceGap ? (state.pending || []).filter(message => !message.startsWith('source-prep-gap: ')) : state.pending;
    const imageDeps = scopeDependencies(root, skillId, state.scope, sourceEvidence);
    const prerequisitePlan = parentProfile ? planPrerequisiteContext(root, state, dir, sourceEvidence.map(({excerpt,...ref})=>ref), imageDeps, { maxVariableChars }) : null;
    const prerequisiteFields = prerequisitePlan ? { prerequisiteContextProfile: parentProfile, prerequisiteContextReference: prerequisitePlan.reference } : {};
    let prerequisiteReadReceipt;
    if (prerequisitePlan && state.owner.prepared?.prerequisiteReadReceipt && hashValue(state.owner.prepared.prerequisiteContextReference) === hashValue(prerequisitePlan.reference)) {
      validatePrerequisiteContext(root, state);
      prerequisiteReadReceipt = structuredClone(state.owner.prepared.prerequisiteReadReceipt);
    }
    const scopeContext = { profile: assignmentExecutionProfile(state), skillId, role: state.owner.role, ...(packetSourceProfile ? { packetSourceProfile } : {}), ...prerequisiteFields, ...(prerequisitePlan ? { nativePrerequisiteInstruction: NATIVE_PREREQUISITE_READ_CONTRACT } : {}), scope: state.scope, sourceReferences: sourceEvidence.map(packetSource), context: prerequisitePlan?.context || deps.context, priorFindings, repairTargets, previousCandidatePath: state.stage?.candidatePath || null, previousReview, stageCoverageHash: state.owner.role === 'review' ? hashValue(state.stage.coverage) : null, examplesNote: 'Complete examples remain whole in the prepared snapshot; bounded dispatch owns and reviews them separately.' };
    const pairs = assessmentItems(snapshot.content, snapshot.quiz).filter(item => item.kind !== 'example' && item.kind !== 'theory').map(item => {
      const priorReview = previousReviewArtifact && fullPreviousReview.outcomes.find(outcome => outcome.where === item.where);
      return priorReview ? { ...item, priorReview } : item;
    });
    // One whole question and its solution/options is the smallest unit. Never truncate it.
    const packetFor = (items, part, parts) => ({ ...scopeContext, part, parts, theory: packetTheory, items, sourceEvidence: [] });
    const boundParts = Math.max(1, pairs.length), size = items => JSON.stringify(packetFor(items, boundParts, boundParts)).length;
    // Only an unprepared repair that genuinely cannot fit its full questions
    // opts into this format. Every historical preparation keeps its old bytes.
    const repairPacketProfile = state.owner.prepared ? state.owner.prepared.repairPacketProfile : (fullPreviousReview && (size([]) > maxVariableChars || pairs.some(item=>size([item])>maxVariableChars)) ? REPAIR_PACKET_PROFILE : undefined);
    if (repairPacketProfile !== undefined && repairPacketProfile !== REPAIR_PACKET_PROFILE) throw new Error('Unknown repair packet profile');
    if (repairPacketProfile) {
      scopeContext.repairPacketProfile = repairPacketProfile;
      scopeContext.repairPacketEvidence = { path: relative(root,path.join(dir,`source-evidence-${hashValue(sourceEvidence)}.json`)), hash: hashValue(sourceEvidence) };
      scopeContext.sourceReferences = sourceEvidence.map(({excerpt,...ref},index)=>repairPacketSource(ref,index));
    }
    let metadataPlan, repairMetadataReadReceipt;
    if (metadataProfile) {
      if (!state.owner.prepared && size([]) <= maxVariableChars && pairs.every(item => size([item]) <= maxVariableChars)) throw new Error('Repair metadata references apply only to a fresh oversized repair preparation');
      metadataPlan = planRepairMetadata(root, state, dir, snapshot, sourceEvidence.map(({excerpt,...ref})=>ref), imageDeps, { priorFindings, repairTargets, previousReview: fullPreviousReview });
      scopeContext.repairMetadataProfile = metadataProfile;
      scopeContext.repairMetadataReference = metadataPlan.reference;
      scopeContext.nativeRepairMetadataInstruction = REPAIR_METADATA_READ_CONTRACT;
      for (const key of ['priorFindings', 'repairTargets', 'previousReview']) scopeContext[key] = { reference: metadataPlan.reference };
      if (state.owner.prepared?.repairMetadataReadReceipt && hashValue(state.owner.prepared.repairMetadataReference) === hashValue(metadataPlan.reference)) {
        loadRepairMetadata(root, state.owner.prepared, state, { requireRead: true });
        repairMetadataReadReceipt = structuredClone(state.owner.prepared.repairMetadataReadReceipt);
      }
    }
    const metadataFields = metadataPlan ? { repairMetadataProfile: metadataProfile, repairMetadataReference: metadataPlan.reference } : {};
    const budgetError = (message, items = []) => {
      const packet = packetFor(items, boundParts, boundParts), error = new Error(message);
      error.packetBudget = { limit: maxVariableChars, variableChars: JSON.stringify(packet).length, fields: Object.fromEntries(Object.entries(packet).map(([key, value]) => [key, JSON.stringify(value).length])), items: items.map(item => ({ where: item.where, variableChars: JSON.stringify(item).length })) };
      return error;
    };
    if (size([]) > maxVariableChars) throw budgetError('Scope/theory packet exceeds context bound; select source sections or smaller prerequisite context explicitly');
    const groups = []; let current = [];
    for (const item of pairs) {
      if (size([item]) > maxVariableChars) throw budgetError('Whole-question packet exceeds context bound: ' + item.where, [item]);
      if (size([...current, item]) > maxVariableChars && current.length) { groups.push(current); current = []; }
      current.push(item);
    }
    if (current.length || !groups.length) groups.push(current);
    const plannedPackets = groups.map((items, index) => {
      const packet = packetFor(items, index + 1, groups.length);
      for (const source of sourceEvidence) if (source.excerpt) {
        const entry = { ...packetSource(source), excerpt: source.excerpt };
        const candidate = { ...packet, sourceEvidence: [...packet.sourceEvidence, entry] };
        if (JSON.stringify(candidate).length <= maxVariableChars) packet.sourceEvidence.push(entry);
      }
      if (JSON.stringify(packet).length > maxVariableChars) throw new Error('Scope/theory packet exceeds context bound; select source sections or smaller prerequisite context explicitly');
      const file = path.join(dir, `packet-${index + 1}-${hashValue(packet)}.json`);
      return { file, packet, path: relative(root, file), variableChars: JSON.stringify(packet).length, estimatedVariableTokens: Math.ceil(JSON.stringify(packet).length / 3) };
    });
    const versionedSave = (file, value) => {
      if (fs.existsSync(file)) { if (hashValue(readJson(file)) !== hashValue(value)) throw new Error('Versioned preparation artifact changed: ' + relative(root, file)); }
      else save(file, value);
    };
    // Write only after every complete packet has passed sizing. Former preparation
    // artifacts keep their own content-hash paths, including source supplements.
    const sourceEvidenceHash = hashValue(sourceEvidence), sourceEvidencePath = path.join(dir, `source-evidence-${sourceEvidenceHash}.json`);
    versionedSave(sourceEvidencePath, sourceEvidence);
    if (prerequisitePlan) savePrerequisiteContext(prerequisitePlan);
    if (previousReviewArtifact) versionedSave(inside(root, previousReviewReference.path), previousReviewArtifact);
    if (metadataPlan) saveRepairMetadata(metadataPlan);
    for (const planned of plannedPackets) versionedSave(planned.file, planned.packet);
    const packets = plannedPackets.map(({ file, packet, ...record }) => record);
    if (state.owner.prepared) {
      const previous = structuredClone(state.owner.prepared);
      // Recover a legacy mutable evidence file only when original source bytes
      // reconstruct its exact recorded hash; never invent replacement evidence.
      if (previous.sourceEvidenceHash && previous.sources) {
        try {
          const oldFile = previous.sourceEvidencePath && inside(root, previous.sourceEvidencePath);
          const original = oldFile && fs.existsSync(oldFile) ? readJson(oldFile) : null;
          const recovered = original && hashValue(original) === previous.sourceEvidenceHash ? original : evidenceFromRefs(previous.sources);
          if (hashValue(recovered) === previous.sourceEvidenceHash) {
            const recoveredPath = path.join(dir, `source-evidence-${previous.sourceEvidenceHash}.json`); versionedSave(recoveredPath, recovered);
            previous.sourceEvidencePath = relative(root, recoveredPath);
          }
        } catch { /* Changed original sources remain a historical stale reference. */ }
      }
      state.owner.preparedHistory = [...(state.owner.preparedHistory || []), previous];
    }
    // Legacy aliases serve only the first preparation; current callers use the
    // returned immutable paths and aliases are never overwritten on reprepare.
    if (!fs.existsSync(path.join(dir, 'source-evidence.json'))) save(path.join(dir, 'source-evidence.json'), sourceEvidence);
    for (const [index, planned] of plannedPackets.entries()) if (!fs.existsSync(path.join(dir, `packet-${index + 1}.json`))) save(path.join(dir, `packet-${index + 1}.json`), planned.packet);
    state.owner.prepared = { snapshotPath: relative(root, snapshotFile), sourceEvidencePath: relative(root, sourceEvidencePath), sourceEvidenceHash, expected: snapshot.expected, dependencyHash: imageDeps.hash, sources: sourceEvidence.map(({ excerpt, ...ref }) => ref), packets, preparedAt: now(), ...prerequisiteFields, ...metadataFields, ...(repairMetadataReadReceipt ? { repairMetadataReadReceipt } : {}), ...(prerequisiteReadReceipt ? { prerequisiteReadReceipt } : {}), ...(repairPacketProfile ? { repairPacketProfile } : {}), ...(state.owner.workerLineage ? { workerLineage: structuredClone(state.owner.workerLineage) } : {}), ...(boundedContextProfile ? { boundedContextProfile } : {}), ...(packetSourceProfile ? { packetSourceProfile } : {}), ...(previousReviewArtifact ? { previousReviewProfile, previousReviewReference } : {}) };
    if (resolvedSourceGap) {
      state.sourcePreparationHistory = [...(state.sourcePreparationHistory || []), { ...state.sourcePreparationGap, resolvedAt: now(), preparedSourceEvidenceHash: sourceEvidenceHash }];
      delete state.sourcePreparationGap;
      state.pending = (state.pending || []).filter(message => !message.startsWith('source-prep-gap: '));
    }
    save(skillFile(root, campaignId, skillId), state);
    return { skillId, assignmentId: state.owner.assignmentId, role: state.owner.role, packets, sourceEvidencePath: state.owner.prepared.sourceEvidencePath, sourceEvidenceHash, expected: snapshot.expected, dependencyHash: imageDeps.hash, sourceReferences: state.owner.prepared.sources, ...prerequisiteFields, ...metadataFields, ...(repairPacketProfile ? { repairPacketProfile } : {}), ...(state.owner.workerLineage ? { workerLineage: structuredClone(state.owner.workerLineage) } : {}), ...(boundedContextProfile ? { boundedContextProfile } : {}), ...(packetSourceProfile ? { packetSourceProfile } : {}), ...(previousReviewArtifact ? { previousReviewProfile, previousReviewReference } : {}) };
  });
}
export function requirePrepared(root, state, expectedRole) {
  if (!state.owner?.prepared || state.owner.role !== expectedRole) throw new Error('Prepare the owned ' + expectedRole + ' assignment first');
  const prepared = state.owner.prepared, live = capturePair(root, state.skillId);
  if (!sameWorkerLineage(state.owner.workerLineage, prepared.workerLineage)) throw new Error('Prepared worker lineage differs from immutable ownership');
  const expected = expectedRole === 'review' ? state.stage.expected : prepared.expected;
  if (JSON.stringify(live.expected) !== JSON.stringify(expected)) throw new Error('Stale live content/quiz baseline; reconcile without overwriting concurrent edits');
  if (scopeDependencies(root, state.skillId, state.scope, prepared.sources).hash !== prepared.dependencyHash) throw new Error('Stale source/scope/teaching dependencies');
  if (hasPrerequisiteContext(root, prepared)) validatePrerequisiteContext(root, state);
  if (hasRepairMetadata(root, prepared)) loadRepairMetadata(root, prepared, state, { requireRead: true });
  return prepared;
}
/** An explicit native worker reading, separate from preparing or accepting content. */
export function recordPrerequisiteContextRead(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, acknowledgment } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId);
    const manifest = validatePrerequisiteContext(root, state, { requireRead: false });
    validateReadAcknowledgment(manifest, acknowledgment);
    const prepared = state.owner.prepared, receipt = { format: PREREQUISITE_CONTEXT_PROFILE, reference: prepared.prerequisiteContextReference, binding: manifest.binding, acknowledgment: structuredClone(acknowledgment), readAt: now() };
    if (prepared.prerequisiteReadReceipt) {
      validatePrerequisiteContext(root, state);
      throw new Error('Prerequisite reading already recorded; retain the immutable receipt');
    }
    const file = path.join(path.dirname(inside(root, prepared.snapshotPath)), `prerequisite-read-${hashValue(receipt)}.json`), bytes = JSON.stringify(receipt, null, 2) + '\n';
    fs.writeFileSync(file, bytes, { flag: 'wx' });
    prepared.prerequisiteReadReceipt = { path: relative(root, file), hash: hashValue(receipt), literalHash: hashValue(bytes) };
    save(skillFile(root, campaignId, skillId), state);
    return structuredClone(prepared.prerequisiteReadReceipt);
  });
}
function checkCoverage(content, quiz, coverage) {
  const items = assessmentItems(content, quiz), methods = coverage?.methods || [], mappings = coverage?.items || [];
  const ids = new Set(methods.map(method => method.id));
  if (ids.size !== methods.length || methods.some(method => !idPattern.test(method.id) || !method.description?.trim() || !Array.isArray(method.sourceRefs) || !method.sourceRefs.length)) throw new Error('Methods need unique IDs, descriptions and source references');
  const examples = items.filter(item => item.kind === 'example'), assessment = items.filter(item => ['practice', 'quiz'].includes(item.kind));
  for (const item of [...assessment, ...examples]) {
    const matches = mappings.filter(mapping => mapping.where === item.where);
    if (matches.length !== 1 || matches[0].hash !== item.hash) throw new Error('Missing/stale method coverage for ' + item.where);
    if (!matches[0].methods?.length || matches[0].methods.some(id => !ids.has(id))) throw new Error('Unknown/empty assessed method for ' + item.where);
  }
  if (mappings.some(mapping => ![...assessment, ...examples].some(item => item.where === mapping.where))) throw new Error('Unknown method coverage item');
  for (const method of methods) {
    const required = assessment.some(item => mappings.find(mapping => mapping.where === item.where).methods.includes(method.id));
    const covered = examples.some(item => mappings.find(mapping => mapping.where === item.where).methods.includes(method.id));
    if (required && !covered) throw new Error('Required method has no worked example: ' + method.id);
  }
  return { methods, items: mappings };
}
export function reconcileBaselineItems(before, after, removals = []) {
  const original = before.filter(item => ['practice', 'quiz'].includes(item.kind)), current = after.filter(item => ['practice', 'quiz'].includes(item.kind));
  const matchedBefore = new Set(), matchedAfter = new Set(), dispositions = [];
  // Reserve all unchanged items one-to-one before interpreting positions. Array
  // insertion/deletion/reordering therefore cannot masquerade as replacement.
  for (const [index, item] of original.entries()) {
    let target = current.findIndex((next, i) => !matchedAfter.has(i) && next.kind === item.kind && next.hash === item.hash && next.where === item.where);
    if (target < 0) target = current.findIndex((next, i) => !matchedAfter.has(i) && next.kind === item.kind && next.hash === item.hash);
    if (target >= 0) { matchedBefore.add(index); matchedAfter.add(target); dispositions.push({ where: item.where, hash: item.hash, outcome: 'retained', finalWhere: current[target].where, finalHash: current[target].hash }); }
  }
  const removalKeys = new Set();
  for (const removal of removals) {
    const index = original.findIndex(item => item.where === removal.where && item.hash === removal.hash);
    if (index < 0 || !removal.reason?.trim() || removalKeys.has(removal.where)) throw new Error('Removal must reference a unique real baseline item with reason');
    if (matchedBefore.has(index)) throw new Error('Cannot declare a preserved item removed');
    removalKeys.add(removal.where); matchedBefore.add(index); dispositions.push({ where: removal.where, hash: removal.hash, outcome: 'removed', reason: removal.reason });
  }
  for (const [index, item] of original.entries()) if (!matchedBefore.has(index)) {
    const target = current.findIndex((next, i) => !matchedAfter.has(i) && next.where === item.where && next.kind === item.kind);
    if (target < 0) throw new Error('Removed assessment missing explicit disposition: ' + item.where);
    matchedAfter.add(target); dispositions.push({ where: item.where, hash: item.hash, outcome: 'repaired', finalWhere: current[target].where, finalHash: current[target].hash });
  }
  return dispositions;
}
export function stageAssignment(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, candidateContent, candidateQuiz = null, coverage, sourceReview, removals = [], substantiveCorrections = [], metrics = null, validatePair = validateCandidatePair } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId, 'author'); const prepared = requirePrepared(root, state, 'author');
    const workerLineage = validateWorkerProvenance(state, { role: 'author', workerId, metrics });
    const content = typeof candidateContent === 'string' ? JSON.parse(candidateContent) : candidateContent, quiz = typeof candidateQuiz === 'string' ? JSON.parse(candidateQuiz) : candidateQuiz;
    const validation = validatePair({ skillId, content, quiz, rootDir: root }); if (validation.errors?.length) throw new Error('Candidate validation: ' + validation.errors.join('; '));
    const acceptedCoverage = checkCoverage(content, quiz, coverage);
    if (!Array.isArray(sourceReview) || !sourceReview.length || sourceReview.some(ref => !ref.path || !ref.hash || typeof ref.locator !== 'string' || !ref.locator.trim() || !['direct', 'indirect'].includes(ref.support) || typeof ref.observation !== 'string' || !ref.observation.trim() || typeof ref.adjustments !== 'string' || !ref.adjustments.trim())) throw new Error('Source review needs hashed exact sections/pages, support, observations and actual adjustments');
    for (const ref of sourceReview) if (hashValue(fs.readFileSync(inside(root, ref.path))) !== ref.hash) throw new Error('Stale reviewed source ' + ref.path);
    sourceReview = sourceReview.map(ref => ({ ...ref, images: validateSourceImages(root, preservePreparedSourceImages(root, ref, prepared.sources), { requireAccepted: true }) }));
    for (const ref of prepared.sources) for (const gap of ref.unavailableImages || []) if (!sourceReview.some(reviewed => reviewed.path === ref.path && reviewed.startLine === ref.startLine && reviewed.endLine === ref.endLine && reviewed.unavailableImages?.some(accepted => unavailableImageDecisionHash(accepted) === unavailableImageDecisionHash(gap)))) throw new Error('Source review omitted or changed the declared missing-illustration decision: ' + gap.path);
    for (const method of acceptedCoverage.methods) if (method.sourceRefs.some(index => !Number.isInteger(index) || !sourceReview[index])) throw new Error('Method references unknown source evidence');
    if (state.scope.stage === 3 && sourceReview.some(ref => ref.support !== 'indirect' && relative(root, inside(root, ref.path)).toLowerCase() !== 'syllabus/stage 3 content.md')) throw new Error('Stage 3 borrowed sources must use honest indirect support');
    const baselinePath = state.stage?.baselinePath || prepared.snapshotPath;
    const baseline = readJson(inside(root, baselinePath));
    const final = assessmentItems(content, quiz);
    const baselineDispositions = reconcileBaselineItems(assessmentItems(baseline.content, baseline.quiz), final, removals);
    const dependencies = scopeDependencies(root, skillId, state.scope, sourceReview);
    const previousStage = state.stage, previousReview = state.review;
    let reusedOutcomes = [];
    if (previousStage && previousStage.dependencyHash === dependencies.hash) {
      const previousCandidate = readJson(inside(root, previousStage.candidatePath));
      if (hashValue({ content: previousCandidate.content, quiz: previousCandidate.quiz }) !== previousStage.candidateHash) throw new Error('Stale previous staged candidate; cannot reuse independent outcomes');
      const teaching = theory => ({ intro: theory.intro, facts: theory.facts, steps: theory.steps });
      if (hashValue(teaching(previousCandidate.content.theory)) === hashValue(teaching(content.theory)) && hashValue(previousStage.coverage.methods) === hashValue(acceptedCoverage.methods)) {
        const priorOutcomes = new Map((previousStage.reusedOutcomes || []).map(outcome => [outcome.where, outcome]));
        // The latest actual review wins, including a fresh repair/unresolved verdict
        // that must invalidate an older retained pass at this locator.
        if (previousReview?.stageHash === previousStage.hash) for (const outcome of previousReview.outcomes) priorOutcomes.set(outcome.where, { ...outcome, reusedFrom: outcome.reusedFrom || { stageHash: previousStage.hash, reviewer: previousReview.reviewer, reviewedAt: previousReview.reviewedAt } });
        reusedOutcomes = [...priorOutcomes.values()].filter(outcome => {
          const before = previousStage.coverage.items.find(mapping => mapping.where === outcome.where), after = acceptedCoverage.items.find(mapping => mapping.where === outcome.where);
          return outcome.verdict === 'accepted' && outcome.reusedFrom?.stageHash && outcome.reusedFrom?.reviewer && outcome.reusedFrom?.reviewedAt && final.some(item => item.where === outcome.where && item.hash === outcome.hash) && before && after && hashValue(before) === hashValue(after);
        }).map(outcome => structuredClone(outcome));
      }
    }
    const dir = stageDir(root, campaignId, state), candidate = { content, quiz, expected: prepared.expected };
    const candidatePath = path.join(dir, 'candidate.json'); save(candidatePath, candidate);
    const stageHash = hashValue({ content, quiz, acceptedCoverage, sourceReview, removals, dependencyHash: dependencies.hash });
    if (state.stage) {
      const historyPath = path.join(dir, 'prior-stage-review.json'); save(historyPath, { stage: state.stage, review: state.review || null });
      state.stageHistory = [...(state.stageHistory || []), { stageHash: state.stage.hash, candidatePath: state.stage.candidatePath, evidencePath: relative(root, historyPath), at: now() }];
    }
    const inheritedVisualFlags = changedDiagramItems(baseline, { content, quiz }, [...(previousStage?.inheritedVisualFlags || []), ...(previousReview?.requiredVisuals || []).map(field => field.where)]).map(field => field.where);
    state.stage = { executionProfile: structuredClone(assignmentExecutionProfile(state)), candidatePath: relative(root, candidatePath), baselinePath, hash: stageHash, candidateHash: hashValue({ content, quiz }), expected: prepared.expected, baselineDispositions, reusedOutcomes, inheritedVisualFlags, author: workerId, authorSessionId: metrics?.sessionId || workerId, authorSessionIds: metrics?.sessions?.map(session => typeof session === 'string' ? session : session.sessionId).filter(Boolean) || [metrics?.sessionId || workerId], coverage: acceptedCoverage, sourceReview, removals, substantiveCorrections: [...new Set([...(state.stage?.substantiveCorrections || []), ...substantiveCorrections])], dependencyHash: dependencies.hash, validation: { warnings: validation.warnings || [], checkedAt: now() }, metrics, stagedAt: now() };
    if (workerLineage) state.stage.workerLineage = workerLineage;
    const dependencyPath = path.join(dir, `dependencies-${dependencies.hash}.json`);
    const dependencyBytes = JSON.stringify(dependencies, null, 2) + '\n';
    if (!fs.existsSync(dependencyPath)) fs.writeFileSync(dependencyPath, dependencyBytes, { flag: 'wx' });
    else if (fs.readFileSync(dependencyPath, 'utf8') !== dependencyBytes) throw new Error('Changed immutable dependency evidence');
    state.stage.dependencyReference = { path: relative(root, dependencyPath), hash: hashValue(dependencies) };
    if (state.reconciliation?.priorReference) state.stage.contextPriorReference = structuredClone(state.reconciliation.priorReference);
    const nativeAuthorLineage = retainedNativeAuthorLineage(previousStage, workerLineage);
    if (nativeAuthorLineage.length) state.stage.nativeAuthorLineage = nativeAuthorLineage;
    if (prepared.prerequisiteContextProfile) state.stage.prerequisiteReading = { profile: prepared.prerequisiteContextProfile, reference: structuredClone(prepared.prerequisiteContextReference), receipt: structuredClone(prepared.prerequisiteReadReceipt) };
    if (prepared.repairMetadataProfile) state.stage.repairMetadataReading = { profile: prepared.repairMetadataProfile, reference: structuredClone(prepared.repairMetadataReference), receipt: structuredClone(prepared.repairMetadataReadReceipt) };
    state.attempts.push({ assignmentId: state.owner.assignmentId, role: 'author', workerId, profile: structuredClone(assignmentExecutionProfile(state)), stageHash, metrics, ...(workerLineage ? { workerLineage } : {}), at: now() });
    delete state.review; delete state.owner; delete state.publishedRepair; state.status = 'staged'; state.pending = [];
    save(skillFile(root, campaignId, skillId), state); return { skillId, status: state.status, stageHash, candidatePath: state.stage.candidatePath };
  });
}
function reviewerMetrics(metrics, reviewerProfile, expectedProfile = CAMPAIGN_PROFILE) {
  if (reviewerProfile !== null) {
    if (typeof reviewerProfile !== 'object' || Array.isArray(reviewerProfile)) throw new Error('Reviewer profile must be an object');
    for (const model of [reviewerProfile.model, reviewerProfile.requestedModel, reviewerProfile.observedModel].filter(Boolean)) if (model !== CAMPAIGN_PROFILE.model) throw new Error('Unexpected reviewer profile model');
    if (reviewerProfile.effort && reviewerProfile.effort !== expectedProfile.effort) throw new Error('Unexpected reviewer profile effort');
    metrics = { ...structuredClone(reviewerProfile), ...(metrics || {}) };
  }
  return metrics;
}
export function recordReviewProfile(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, stageHash, reviewerProfile } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId);
    if (!reviewerProfile || state.owner || state.review?.stageHash !== stageHash || state.stage?.hash !== stageHash || state.review.reviewer !== workerId) throw new Error('Reviewer provenance must bind the current unowned review and recorded reviewer');
    validateReviewProfileBinding(state, workerId, reviewerProfile);
    const metrics = reviewerMetrics(state.review.metrics, reviewerProfile, assignmentExecutionProfile(state));
    state.review.provenanceHistory = [...(state.review.provenanceHistory || []), { metrics: state.review.metrics, reviewerProfile: state.review.reviewerProfile || null, at: now() }];
    state.review.metrics = metrics; state.review.reviewerProfile = structuredClone(reviewerProfile);
    const attempt = state.attempts.findLast(attempt => attempt.role === 'review' && attempt.workerId === workerId && attempt.stageHash === stageHash);
    if (attempt) { attempt.metrics = reviewerMetrics(attempt.metrics, reviewerProfile, assignmentExecutionProfile(state)); attempt.reviewerProfile = structuredClone(reviewerProfile); }
    save(skillFile(root, campaignId, skillId), state); return { skillId, stageHash, reviewer: workerId, metrics };
  });
}
export function normalizeReviewFindings(findings = []) {
  if (!Array.isArray(findings)) throw new Error('Review findings must be an array');
  return findings.map(finding => {
    if (typeof finding === 'string' && finding.trim()) return finding;
    if (!finding || typeof finding !== 'object' || Array.isArray(finding)) throw new Error('Review finding needs a nonempty description/observation/repair');
    const description = typeof finding.description === 'string' && finding.description.trim() ? finding.description : [finding.observation, finding.repair].filter(value => typeof value === 'string' && value.trim()).join(' ');
    if (!description.trim()) throw new Error('Review finding needs a nonempty description/observation/repair');
    return { ...structuredClone(finding), description };
  });
}
export function recordReview(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, stageHash, outcomes, theoryObservation, sourceObservation, removals = [], findings = [], visualReviews = [], flaggedDiagrams = [], stepsRepair = null, sourceImageReviews = [], metrics = null, reviewerProfile = null, contextRevalidation = null } = {}) {
  findings = normalizeReviewFindings(findings);
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId, 'review'); requirePrepared(root, state, 'review');
    const workerLineage = validateWorkerProvenance(state, { role: 'review', workerId, metrics, profile: reviewerProfile });
    metrics = reviewerMetrics(metrics, reviewerProfile, assignmentExecutionProfile(state));
    const reviewSessions = metrics?.sessions?.map(session => typeof session === 'string' ? session : session.sessionId).filter(Boolean) || [metrics?.sessionId];
    if (state.stage.author === workerId || reviewSessions.some(session => session && [state.stage.authorSessionId, ...(state.stage.authorSessionIds || [])].includes(session))) throw new Error('Review must use a different worker/session from author');
    if (stageHash !== state.stage.hash) throw new Error('Stale staged review evidence');
    const candidate = readJson(inside(root, state.stage.candidatePath));
    if (hashValue({ content: candidate.content, quiz: candidate.quiz }) !== state.stage.candidateHash) throw new Error('Staged candidate changed after authoring');
    const { outcomes: checkedOutcomes, requiredVisuals } = validateReviewStructure(root, state, { outcomes, theoryObservation, sourceObservation, removals, flaggedDiagrams, stepsRepair, sourceImageReviews, contextRevalidation });
    outcomes = checkedOutcomes;
    const checkedVisuals = validateVisualReviews(root, requiredVisuals, visualReviews, state.stage.candidateHash, candidate, readCampaign(root,campaignId));
    const visualPending = requiredVisuals.filter(item => !checkedVisuals.some(review => review.where === item.where && review.hash === item.hash));
    const issueOutcomes = outcomes.filter(outcome => outcome.verdict !== 'accepted');
    const imageGapIssues = sourceImageReviews.filter(review => !review.accepted);
    state.review = { executionProfile: structuredClone(assignmentExecutionProfile(state)), reviewer: workerId, reviewerSessionId: metrics?.sessionId || workerId, reviewerProfile: reviewerProfile ? structuredClone(reviewerProfile) : null, stageHash, outcomes, theoryObservation, sourceObservation, sourceImageReviews, removals, findings, visualReviews: checkedVisuals, requiredVisuals: requiredVisuals.map(({ value, ...item }) => item), stepsRepair, metrics, reviewedAt: now() };
    if (workerLineage) state.review.workerLineage = workerLineage;
    if (contextRevalidation) state.review.contextRevalidation = structuredClone(contextRevalidation);
    if (state.owner.prepared.prerequisiteContextProfile) state.review.prerequisiteReading = { profile: state.owner.prepared.prerequisiteContextProfile, reference: structuredClone(state.owner.prepared.prerequisiteContextReference), receipt: structuredClone(state.owner.prepared.prerequisiteReadReceipt) };
    state.pending = [...findings.map(finding => typeof finding === 'string' ? finding : finding.description), ...issueOutcomes.map(outcome => outcome.where + ': ' + outcome.verdict), ...imageGapIssues.map(review => review.imagePath + ': missing-source illustration decision rejected: ' + review.observation), ...visualPending.map(item => item.where + ': actual diagram visual/geometry/palette/visibility evidence pending')];
    state.status = issueOutcomes.length || findings.length || imageGapIssues.length ? 'repair-needed' : visualPending.length ? 'visual-pending' : 'accepted';
    state.attempts.push({ assignmentId: state.owner.assignmentId, role: 'review', workerId, profile: structuredClone(assignmentExecutionProfile(state)), stageHash, metrics, ...(workerLineage ? { workerLineage } : {}), at: now() }); delete state.owner;
    save(skillFile(root, campaignId, skillId), state); return { skillId, status: state.status, pending: state.pending };
  });
}
/** Read-only canonical receipt checks, shared with opt-in preflight. No acceptance or save. */
export function validateReviewStructure(root, state, { outcomes, theoryObservation, sourceObservation, removals = [], flaggedDiagrams = [], stepsRepair = null, sourceImageReviews = [], contextRevalidation = null } = {}) {
  const workerId = state.owner?.workerId;
  const candidate = readJson(inside(root, state.stage.candidatePath));
  if (!theoryObservation?.trim() || !sourceObservation?.trim()) throw new Error('Theory and source/method/language scope review observations required');
  const imageGaps = state.stage.sourceReview.flatMap((source, sourceIndex) => (source.unavailableImages || []).map(gap => ({ sourceIndex, sourcePath: source.path, imagePath: gap.path, decisionHash: unavailableImageDecisionHash(gap) })));
  if (!Array.isArray(sourceImageReviews) || sourceImageReviews.length !== imageGaps.length) throw new Error('Every declared unavailable illustration needs independent source review');
  for (const gap of imageGaps) {
    const matches = sourceImageReviews.filter(review => review.sourceIndex === gap.sourceIndex && review.imagePath === gap.imagePath);
    if (matches.length !== 1 || matches[0].decisionHash !== gap.decisionHash || typeof matches[0].accepted !== 'boolean' || typeof matches[0].observation !== 'string' || !matches[0].observation.trim()) throw new Error('Missing/stale independent unavailable-illustration decision: ' + gap.imagePath);
  }
  const items = assessmentItems(candidate.content, candidate.quiz).filter(item => item.kind !== 'theory');
  if (!Array.isArray(outcomes)) throw new Error('Independent review must cover every assessment and example');
  if (new Set(outcomes.map(outcome => outcome.where)).size !== outcomes.length) throw new Error('Duplicate independent review outcome');
  if (contextRevalidation) {
    requirePrepared(root, state, 'review');
    const reference = state.stage.contextPriorReference;
    if (!reference || !state.owner.prepared.prerequisiteReadReceipt) throw new Error('Context revalidation requires preserved prior evidence and actual current full prerequisite reading');
    checkWorkerIndependence(state, state.owner.workerLineage);
    const prior = readJson(inside(root, reference.path));
    if (hashValue(prior) !== reference.hash) throw new Error('Changed immutable context prior review');
    const priorCandidate = readJson(inside(root, prior.stage.candidatePath));
    if (hashValue({ content: priorCandidate.content, quiz: priorCandidate.quiz }) !== prior.stage.candidateHash) throw new Error('Changed original context candidate');
    const retained = revalidateContextOutcomes({ prior, reference, currentStage: state.stage, currentDependencies: scopeDependencies(root, state.skillId, state.scope, state.stage.sourceReview), items, confirmation: contextRevalidation, reviewerLineage: state.owner.workerLineage });
    outcomes = [...outcomes, ...retained.filter(row => !outcomes.some(fresh => fresh.where === row.where))];
  }
  // Context confirmation is the sole retention authority on this path: an older
  // stage reuse list must not restore methods explicitly requiring fresh work.
  if (!contextRevalidation) outcomes = [...outcomes, ...(state.stage.reusedOutcomes || []).filter(outcome => !outcomes.some(fresh => fresh.where === outcome.where))];
  if (outcomes.length !== items.length) throw new Error('Independent review must cover every assessment and example');
  for (const item of items) {
    const matches = outcomes.filter(outcome => outcome.where === item.where), outcome = matches[0];
    if (matches.length !== 1 || outcome.hash !== item.hash) throw new Error('Missing/stale review outcome: ' + item.where);
    if (!outcome.independentSolution?.trim() || !outcome.observation?.trim() || !['accepted', 'repair', 'unresolved'].includes(outcome.verdict)) throw new Error('Full independent solution and method/wording/scope observation required: ' + item.where);
    if (item.kind === 'quiz') {
      if (!Array.isArray(outcome.options) || outcome.options.length !== item.value.options.length) throw new Error('Every MCQ option needs independent review: ' + item.where);
      item.value.options.forEach((option, i) => { const reviewed = outcome.options[i]; if (reviewed?.hash !== hashValue(option) || !reviewed.observation?.trim() || typeof reviewed.mathematicallyCorrect !== 'boolean') throw new Error('Incomplete/stale option review: ' + item.where); });
      if (outcome.verdict === 'accepted' && (outcome.options.filter(option => option.mathematicallyCorrect).length !== 1 || outcome.options.some((option, i) => option.mathematicallyCorrect !== (item.value.options[i].correct === true)))) throw new Error('MCQ unique correct answer disagrees with candidate: ' + item.where);
    }
  }
  const baseline = readJson(inside(root, state.stage.baselinePath));
  if (removals.length !== state.stage.removals.length) throw new Error('Every removed assessment needs a unique independent disposition review');
  for (const removal of state.stage.removals) {
    const review = removals.find(review => review.hash === removal.hash && review.where === removal.where), original = assessmentItems(baseline.content, baseline.quiz).find(item => item.where === removal.where && item.hash === removal.hash);
    if (!review || !review.observation?.trim() || !review.independentSolution?.trim() || review.accepted !== true || !original) throw new Error('Removed assessment needs full independent solution/disposition review');
    if (original.kind === 'quiz' && (!Array.isArray(review.options) || review.options.length !== original.value.options.length || review.options.some((option, index) => option.hash !== hashValue(original.value.options[index]) || typeof option.mathematicallyCorrect !== 'boolean' || !option.observation?.trim()))) throw new Error('Removed MCQ requires every original option review');
  }
  if (JSON.stringify(baseline.content.theory.steps) !== JSON.stringify(candidate.content.theory.steps)) {
    const stepCheck = checkCampaignStepsRepair({ beforeTheory: baseline.content.theory, candidateContent: candidate.content, candidateQuiz: candidate.quiz, review: stepsRepair && { ...stepsRepair, author: state.stage.author, reviewer: workerId } });
    if (stepCheck.faults.length) throw new Error('Campaign steps repair: ' + stepCheck.faults.join('; '));
  }
  const requiredVisuals = changedDiagramItems(baseline, candidate, [...new Set([...flaggedDiagrams, ...(state.stage.inheritedVisualFlags || [])])]);
  return { outcomes, requiredVisuals };
}
function changedDiagramItems(baseline, candidate, flagged) {
  const fields = pair => {
    const out = theoryTextFields(pair.content.theory).map(({ obj, key, where }) => ({ where: 'theory.' + where, value: obj[key] }));
    for (const item of assessmentItems(pair.content, pair.quiz).filter(item => ['practice', 'quiz'].includes(item.kind))) for (const key of ['question_text', 'solution_text']) out.push({ where: item.where + '.' + key, value: item.value[key] });
    return out.filter(field => /\[tikz\]/.test(field.value || '')).map(field => ({ ...field, hash: hashValue(field.value), diagramHashes: [...field.value.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]/g)].map(match => hashValue(match[0])), kind: 'diagram-field' }));
  };
  const before = fields(baseline), after = fields(candidate);
  return after.filter(field => flagged.some(where => field.where === where || field.where.startsWith(where + '.')) || !before.some(old => old.where === field.where && old.hash === field.hash));
}
/** Validate observations and exact required fields before expensive render verification. */
export function validateVisualReviewStructure(required, review) {
  const item = required.find(item => item.where === review.where && item.hash === review.hash);
  if (!item || !review.accepted || review.renderedSourceHash !== review.hash || JSON.stringify(review.renderedBlockHashes) !== JSON.stringify(item.diagramHashes) || !review.observation?.trim()) throw new Error('Incomplete/stale visual review with every rendered block and source binding required');
  if (!review.geometryObservation?.trim() || !review.paletteObservation?.trim() || (review.solid3d && !review.visibilityObservation?.trim())) throw new Error('Diagram geometry/palette/solid visibility observations required');
  return item;
}
function validateVisualReviews(root, required, reviews, candidateHash, candidate = null, campaign = {}) {
  if (!reviews.length) return reviews;
  return withReviewRendererContexts(root, campaign, reviews, context => {
  for (const review of reviews) {
    const item = validateVisualReviewStructure(required, review);
    verifyReviewRender(root, candidateHash, review.rendererApplicability && candidate ? bindCurrentRenderField(candidate,candidateHash,item) : item, review, context);

  }
  return reviews;
  });
}
export function recordVisualReview(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, stageHash, visualReviews, reviewerProfile = null } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId);
    if (!['visual-pending', 'accepted'].includes(state.status) || state.stage.hash !== stageHash || state.review.stageHash !== stageHash) throw new Error('No current completed content review for visual acceptance');
    if (!workerId || workerId === state.stage.author) throw new Error('Visual reviewer must differ from author');
    const workerLineage = validateVisualWorkerBinding(state, workerId, reviewerProfile);
    if (scopeDependencies(root, skillId, state.scope, state.stage.sourceReview).hash !== state.stage.dependencyHash) throw new Error('Stale visual dependencies');
    const candidate = readJson(inside(root, state.stage.candidatePath));
    if (hashValue({ content: candidate.content, quiz: candidate.quiz }) !== state.stage.candidateHash) throw new Error('Stale visual candidate');
    const all = [...state.review.visualReviews, ...validateVisualReviews(root, state.review.requiredVisuals, visualReviews, state.stage.candidateHash, candidate, readCampaign(root,campaignId)).map(review => ({ ...review, reviewer: workerId, ...(workerLineage ? { workerLineage, reviewerProfile: structuredClone(reviewerProfile) } : {}), at: now() }))];
    state.review.visualReviews = [...new Map(all.map(review => [review.where, review])).values()];
    const pending = state.review.requiredVisuals.filter(item => !all.some(review => review.where === item.where && review.hash === item.hash));
    state.pending = pending.map(item => item.where + ': actual diagram visual/geometry/palette/visibility evidence pending'); state.status = pending.length ? 'visual-pending' : 'accepted';
    save(skillFile(root, campaignId, skillId), state); return { skillId, status: state.status, pending: state.pending };
  });
}

// A renderer-only maintenance operation has no author lease and never publishes
// content. Revision binding prevents two inspectors from overwriting each other.
export const visualRefreshRevision = state => hashValue({ stage: state.stage, review: state.review, status: state.status, pending: state.pending, published: state.published, publishedRepair: state.publishedRepair, findingRegister: state.findingRegister, visualRefreshHistory: state.visualRefreshHistory });
const ratioBorderFinding = Object.freeze({
  skillId: 'ratios-compare-quantities', stageHash: 'c6516c033f9f6c1c5fbf35f574cfd66cc13da024b20016d14082e22b33fa6647',
  where: 'practice.foundation[1].question_text', fieldHash: 'b7f2f2cde3d6daf158fe4af738ac59a82518f00794709367e1cbdb9384b20f86',
  itemWhere: 'practice.foundation[1]', itemHash: 'e2f7b286b01fdb80a119a122748714b319e4b4f65c9340718f388b9536b12dcb',
  findingHash: 'a67a5ee6d9b34fb3f530700f6e708fb205bbb93a1f2996a9c67abace0fec1faa',
});
function refreshProfile(state, workerId, profile, { historical = false, expectedProfile = CAMPAIGN_PROFILE } = {}) {
  validateVisualWorkerBinding(state, workerId, profile, { historical, expectedProfile });
  if (!workerId?.trim() || !profile?.reviewerIdentity?.trim() || profile.model !== CAMPAIGN_PROFILE.model || profile.effort !== expectedProfile.effort || profile.requestedServiceTier !== CAMPAIGN_PROFILE.requestedServiceTier) throw new Error('Explicit independent Sol 6.1 configured effort Standard/default reviewer profile required');
  if (profile.workerId && profile.workerId !== workerId) throw new Error('Refreshed reviewer worker/profile identity mismatch');
  reviewerMetrics(null, profile, expectedProfile);
  const authors = [state.stage.author, state.stage.authorSessionId, ...(state.stage.authorSessionIds || []), state.stage.metrics?.authorIdentity].filter(Boolean);
  if ([workerId, profile.reviewerIdentity, profile.workerId, profile.sessionId].some(identity => identity && authors.includes(identity))) throw new Error('Refreshed inspection must differ from content author identity/session');
}
function refreshArtifact(root, reference) {
  if (!reference?.path || !reference.hash || !/^(?:\.agywork\/content-campaign\/|booklets\/provenance\/)/.test(reference.path)) throw new Error('Hash-bound immutable campaign evidence reference required');
  const bytes = fs.readFileSync(inside(root, reference.path));
  if (hashValue(bytes) !== reference.hash) throw new Error('Historical inspection evidence changed');
  return { bytes, value: JSON.parse(bytes) };
}
// Historical partial renderer signatures remain unverified. This verifies only
// their actual source/block/PNG attribution for strict byte-identical reuse.
function historicalVisual(root, state, field, reference, accepted, profileReference = null) {
  const artifact = refreshArtifact(root, reference), rows = artifact.value.visualReviews;
  const matches = Array.isArray(rows) ? rows.filter(row => row.where === field.where && row.hash === field.hash) : [];
  const row = matches[0];
  if (matches.length !== 1 || row.accepted !== accepted || row.renderedSourceHash !== field.hash || JSON.stringify(row.renderedBlockHashes) !== JSON.stringify(field.diagramHashes) || !row.observation?.trim() || !row.geometryObservation?.trim() || !row.paletteObservation?.trim()) throw new Error('Historical inspection must contain the exact explicit positive/negative field verdict');
  const profile = artifact.value.reviewerProfile || (profileReference && refreshArtifact(root, profileReference).value);
  refreshProfile(state, profile?.workerId || profile?.sessionId || profile?.reviewerIdentity, profile, { historical: true });
  const receipt = refreshArtifact(root, row.renderReceipt).value;
  const old = receipt.fields?.find(item => item.where === field.where);
  if (receipt.format !== 'content-campaign-render-v1' || receipt.producer !== 'scripts/shoot-tikz.mjs' || (artifact.value.candidateHash && receipt.candidateHash !== artifact.value.candidateHash) || !old || old.fieldHash !== field.hash || JSON.stringify(old.blockHashes) !== JSON.stringify(field.diagramHashes) || old.artifacts?.length !== field.diagramHashes.length) throw new Error('Historical render source/blocks do not match the inspection');
  const input = refreshArtifact(root, receipt.input).value.items, manifest = refreshArtifact(root, receipt.manifest).value;
  for (const [index, image] of old.artifacts.entries()) {
    const item = input.find(item => item.auditId === image.auditId), capture = manifest.find(item => item.auditId === image.auditId);
    const bytes = fs.readFileSync(inside(root, image.path)), dimensions = pngDimensions(bytes);
    if (image.blockIndex !== index || image.blockHash !== field.diagramHashes[index] || image.status !== 'pass' || !item || item.field !== `${field.where}[${index}]` || hashValue('[tikz]' + item.code + '[/tikz]') !== image.blockHash || !capture || capture.status !== 'pass' || path.basename(image.path) !== capture.png || hashValue(bytes) !== image.hash || image.width !== dimensions.width || image.height !== dimensions.height) throw new Error('Historical actual PNG/input attribution is missing or changed');
  }
  return { artifact: reference, profileReference, inspection: structuredClone(row), reviewerProfile: structuredClone(profile), receipt: structuredClone(receipt), historicalRendererDependencies: receipt.rendererDependencyProfile || 'legacy-partial-unverified' };
}
export function recordRefreshedVisualReview(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, stageHash, candidateHash, expectedVisualRevisionHash, reviewerProfile, visualReviews, resolvedPresentationFindings = [] } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId);
    if (state.owner) throw new Error('Visual refresh cannot steal an active worker/publisher owner');
    if (!['published', 'accepted', 'visual-pending', 'repair-needed'].includes(state.status) || !state.review || state.stage?.hash !== stageHash || state.review.stageHash !== stageHash || state.stage.candidateHash !== candidateHash) throw new Error('Visual refresh requires the current completed stage/review');
    if (!expectedVisualRevisionHash || visualRefreshRevision(state) !== expectedVisualRevisionHash) throw new Error('Stale visual refresh revision; preserve the intervening inspection');
    refreshProfile(state, workerId, reviewerProfile, { expectedProfile: futureExecutionProfile(readCampaign(root, campaignId)) });
    if (!Array.isArray(visualReviews) || !visualReviews.length || new Set(visualReviews.map(row => row.where)).size !== visualReviews.length || !Array.isArray(resolvedPresentationFindings)) throw new Error('Unique nonempty refreshed field inspections required');
    const candidate = readJson(inside(root, state.stage.candidatePath));
    const verifyLive = () => {
      const expected = state.status === 'published' ? state.published?.expected : state.publishedRepair?.expected || state.stage.expected;
      if (JSON.stringify(capturePair(root, skillId).expected) !== JSON.stringify(expected)) throw new Error('Live pair changed during visual refresh');
      if (hashValue({ content: candidate.content, quiz: candidate.quiz }) !== candidateHash || hashValue(readJson(inside(root, state.stage.candidatePath))) !== hashValue(candidate)) throw new Error('Visual refresh candidate changed');
      if (scopeDependencies(root, skillId, state.scope, state.stage.sourceReview).hash !== state.stage.dependencyHash) throw new Error('Visual refresh source/scope/prerequisite dependencies changed');
      if (hashValue({ content: candidate.content, quiz: candidate.quiz, acceptedCoverage: state.stage.coverage, sourceReview: state.stage.sourceReview, removals: state.stage.removals, dependencyHash: state.stage.dependencyHash }) !== stageHash) throw new Error('Visual refresh stage/method binding changed');
    };
    verifyLive();
    const items = assessmentItems(candidate.content, candidate.quiz).filter(item => item.kind !== 'theory');
    if (state.review.outcomes.length !== items.length || new Set(state.review.outcomes.map(row => row.where)).size !== items.length || items.some(item => !state.review.outcomes.some(row => row.where === item.where && row.hash === item.hash))) throw new Error('Existing complete mathematical outcomes no longer match current items');
    const required = changedDiagramItems(candidate, candidate, state.review.requiredVisuals.map(field => field.where));
    if (required.length !== state.review.requiredVisuals.length || required.some(field => !state.review.requiredVisuals.some(old => old.where === field.where && old.hash === field.hash && JSON.stringify(old.diagramHashes) === JSON.stringify(field.diagramHashes)))) throw new Error('Required diagram fields changed');
    const checked = withReviewRendererContexts(root, readCampaign(root,campaignId), visualReviews, context => visualReviews.map(review => {
      const field = required.find(field => field.where === review.where && field.hash === review.hash);
      if (!field || review.accepted !== true || review.renderedSourceHash !== field.hash || JSON.stringify(review.renderedBlockHashes) !== JSON.stringify(field.diagramHashes) || !review.observation?.trim() || !review.geometryObservation?.trim() || !review.paletteObservation?.trim() || !review.visibilityObservation?.trim()) throw new Error('Complete positive refreshed field/block/geometry/palette/visibility observations required');
      const fresh = verifyReviewRender(root, candidateHash, field, review, context);
      if (review.inspectionMode === 'identical-png-reuse') {
        const prior = historicalVisual(root, state, field, review.reusedInspection?.review, true, review.reusedInspection?.profile);
        const terminal = review.rendererApplicability ? verifyTerminalPixelReuse(root,field,review.reusedInspection?.review,fresh,review.reusedInspection?.profile) : null;
        if (review.actualPixelInspection === true || prior.receipt.fields.find(row => row.where === field.where).artifacts.some((image, index) => !fs.readFileSync(inside(root, image.path)).equals(fs.readFileSync(inside(root, fresh.artifacts[index].path))))) throw new Error('Changed pixels need fresh actual inspection; historical attribution cannot be relabelled');
        return { ...structuredClone(review), reusedInspection: prior, ...(terminal ? {terminalInspection:terminal,rendererApplicabilityEvidence:fresh.applicability} : {}), reviewer: workerId, reviewerProfile: structuredClone(reviewerProfile), checkedAt: now() };
      }
      const capturedAt = Date.parse(readJson(inside(root, review.renderReceipt.path)).capturedAt), inspectedAt = Date.parse(review.inspectedAt);
      if (review.inspectionMode !== 'fresh' || review.actualPixelInspection !== true || !Number.isFinite(capturedAt) || !Number.isFinite(inspectedAt) || inspectedAt < capturedAt || inspectedAt > Date.now() + 30000) throw new Error('Fresh actual pixel inspection timestamp must follow the current capture');
      return { ...structuredClone(review), ...(review.rendererApplicability ? {rendererApplicabilityEvidence:fresh.applicability} : {}), reviewer: workerId, reviewerProfile: structuredClone(reviewerProfile), checkedAt: now() };
    }));
    const findingsToResolve = new Set(), outcomesToReplace = new Map(), resolutionHistory = [];
    for (const resolution of resolvedPresentationFindings) {
      if (skillId === CAPTURE_PRESENTATION_BINDING.skillId) {
        if (findingsToResolve.has(resolution.findingHash)) throw new Error('Duplicate capture presentation resolution');
        const evidence = validateBoundPresentationResolution(CAPTURE_PRESENTATION_BINDING, state, resolution, checked);
        findingsToResolve.add(resolution.findingHash); resolutionHistory.push(evidence);
        continue;
      }
      const allowed = ratioBorderFinding, finding = state.review.findings.find(finding => hashValue(finding) === resolution.findingHash), field = required.find(field => field.where === allowed.where), previous = state.review.outcomes.find(outcome => outcome.where === allowed.itemWhere), outcome = resolution.outcome;
      if (skillId !== allowed.skillId || stageHash !== allowed.stageHash || resolution.where !== allowed.where || resolution.findingHash !== allowed.findingHash || !finding || finding.where !== allowed.where || field?.hash !== allowed.fieldHash || previous?.hash !== allowed.itemHash || previous.verdict !== 'repair' || findingsToResolve.has(resolution.findingHash)) throw new Error('Only the exact recorded Ratios border presentation finding can resolve here');
      if (reviewerProfile.reviewerIdentity === state.review.reviewerProfile?.reviewerIdentity || workerId === state.review.reviewer || (reviewerProfile.sessionId && reviewerProfile.sessionId === state.review.reviewerSessionId)) throw new Error('Fresh presentation repair derivation requires a different original reviewer');
      if (!checked.some(row => row.where === field.where && row.inspectionMode === 'fresh') || outcome?.where !== allowed.itemWhere || outcome.hash !== allowed.itemHash || outcome.verdict !== 'accepted' || !outcome.independentSolution?.trim() || !outcome.observation?.trim() || outcome.reusedFrom || !resolution.observation?.trim()) throw new Error('Fresh whole-item derivation and actual current field pixels required for presentation resolution');
      const negative = historicalVisual(root, state, field, resolution.priorFailureReview, false, resolution.priorFailureProfile);
      findingsToResolve.add(resolution.findingHash); outcomesToReplace.set(outcome.where, { ...structuredClone(outcome), reviewer: workerId, reviewerProfile: structuredClone(reviewerProfile), reviewedAt: now(), resolvedPresentationFinding: resolution.findingHash });
      resolutionHistory.push({ ...structuredClone(resolution), originalFinding: structuredClone(finding), originalOutcome: structuredClone(previous), originalNegativeVisual: negative });
    }
    const oldPending = new Set([...(state.review.findings || []).map(finding => typeof finding === 'string' ? finding : finding.description), ...state.review.outcomes.filter(outcome => outcome.verdict !== 'accepted').map(outcome => outcome.where + ': ' + outcome.verdict), ...required.map(field => field.where + ': actual diagram visual/geometry/palette/visibility evidence pending')]);
    const retainedPending = state.pending.filter(pending => !oldPending.has(pending));
    const before = { status: state.status, pending: state.pending, stage: state.stage, review: state.review, published: state.published, publishedRepair: state.publishedRepair, findingRegister: state.findingRegister, visualRefreshHistory: state.visualRefreshHistory };
    const updated = structuredClone(state);
    updated.review.visualReviews = [...new Map([...(state.review.visualReviews || []), ...checked].map(review => [review.where, review])).values()];
    updated.review.findings = state.review.findings.filter(finding => !findingsToResolve.has(hashValue(finding)));
    updated.review.outcomes = state.review.outcomes.map(outcome => outcomesToReplace.get(outcome.where) || outcome);
    const renderingPending = withReviewRendererContexts(root, readCampaign(root,campaignId), updated.review.visualReviews || [], context => required.filter(field => {
      const review = updated.review.visualReviews.find(row => row.where === field.where && row.hash === field.hash && row.accepted);
      try { verifyReviewRender(root, candidateHash, field, review, context); return false; } catch { return true; }
    })).map(field => field.where);
    if (state.status !== 'published') {
      const contentPending = [...retainedPending, ...updated.review.findings.map(finding => typeof finding === 'string' ? finding : finding.description), ...updated.review.outcomes.filter(outcome => outcome.verdict !== 'accepted').map(outcome => outcome.where + ': ' + outcome.verdict), ...(updated.review.sourceImageReviews || []).filter(review => !review.accepted).map(review => review.imagePath + ': missing-source illustration decision rejected: ' + review.observation)];
      updated.pending = [...new Set([...contentPending, ...renderingPending.map(where => where + ': actual diagram visual/geometry/palette/visibility evidence pending')])];
      updated.status = contentPending.length ? 'repair-needed' : renderingPending.length ? 'visual-pending' : 'accepted';
    }
    verifyLive();
    if (visualRefreshRevision(readSkill(root, campaignId, skillId)) !== expectedVisualRevisionHash) throw new Error('Visual ledger changed during validation; preserve the intervening inspection');
    const directory = path.join(campaignPaths(root, campaignId).work, skillId, 'visual-refresh-' + randomUUID());
    fs.mkdirSync(directory, { recursive: true });
    const writeEvidence = (name, value) => { const file = path.join(directory, name); fs.writeFileSync(file, JSON.stringify(value, null, 2), { flag: 'wx' }); return { path: relative(root, file), hash: hashValue(fs.readFileSync(file)) }; };
    const beforeReview = writeEvidence('before.json', before), evidence = writeEvidence('inspection.json', { skillId, stageHash, candidateHash, workerId, reviewerProfile, visualReviews: checked, resolutions: resolutionHistory });
    updated.visualRefreshHistory = [...(state.visualRefreshHistory || []), { at: now(), stageHash, candidateHash, workerId, reviewerIdentity: reviewerProfile.reviewerIdentity, expectedVisualRevisionHash, beforeReview, evidence, renderingPending }];
    // All guards precede the one atomic ledger replacement. Source/content and
    // prior raw/canonical artifacts are not rewritten, including published pairs.
    save(skillFile(root, campaignId, skillId), updated);
    return { skillId, status: updated.status, renderingCurrent: !renderingPending.length, renderingPending, visualRevisionHash: visualRefreshRevision(updated), beforeReview, evidence };
  });
}
export function releaseAssignment(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, reason } = {}) {
  if (!reason?.trim()) throw new Error('Explicit release reason required');
  return lock(root, campaignId, () => { const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId); state.attempts.push({ ...state.owner, releasedAt: now(), reason }); delete state.owner; save(skillFile(root, campaignId, skillId), state); return { skillId, status: state.status }; });
}
export function requestRepair(root, { campaignId = DEFAULT_CAMPAIGN, skillId, stageHash, finding, targets = [], reportedBy = 'coordinator' } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId);
    if (!['accepted', 'visual-pending', 'staged', 'published'].includes(state.status) || state.owner || state.stage?.hash !== stageHash) throw new Error('Finding must target the current unowned staged/published acceptance');
    const published = state.status === 'published', actual = capturePair(root, skillId).expected;
    if (JSON.stringify(actual) !== JSON.stringify(published ? state.published?.expected : state.stage.expected)) throw new Error('Stale finding baseline; reconcile concurrent edits first');
    if (!finding?.trim()) throw new Error('Substantive finding description required');
    const candidate = readJson(inside(root, state.stage.candidatePath)), items = assessmentItems(candidate.content, candidate.quiz);
    if (published && (hashValue({ content: candidate.content, quiz: candidate.quiz }) !== state.stage.candidateHash || scopeDependencies(root, skillId, state.scope, state.stage.sourceReview).hash !== state.stage.dependencyHash)) throw new Error('Stale published candidate/source acceptance');
    const fields = theoryTextFields(candidate.content.theory).map(({ obj, key, where }) => ({ where: 'theory.' + where, hash: hashValue(obj[key]) }));
    const boundTargets = targets.map(where => { const item = items.find(item => item.where === where) || fields.find(field => field.where === where); if (!item) throw new Error('Unknown finding target ' + where); return { where, hash: item.hash }; });
    state.findingRegister = [...(state.findingRegister || []), { stageHash, finding, targets: boundTargets, reportedBy, at: now() }];
    if (published) {
      state.publishedHistory = [...(state.publishedHistory || []), { published: structuredClone(state.published), stageHash, candidatePath: state.stage.candidatePath, baselinePath: state.stage.baselinePath, dependencyHash: state.stage.dependencyHash, repairRequestedAt: now(), finding }];
      state.publishedRepair = { stageHash, candidateHash: state.stage.candidateHash, expected: actual, requestedAt: now() };
    }
    state.pending = [...new Set([...(state.pending || []), finding])]; state.status = 'repair-needed'; save(skillFile(root, campaignId, skillId), state);
    return { skillId, status: state.status, stageHash, finding, targets: boundTargets };
  });
}
export function recordPaidCallCheckpoint(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, runId, metrics = null, outputPath = null } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId);
    if (!state.owner.prepared || state.owner.coordinator?.runId !== runId) throw new Error('Paid-call checkpoint requires the prepared assignment and current coordinator');
    state.attempts.push({ assignmentId: state.owner.assignmentId, role: state.owner.role, workerId, kind: 'paid-call-checkpoint', checkpointedAt: now(), metrics, outputPath, ...(state.owner.workerLineage ? { workerLineage: structuredClone(state.owner.workerLineage) } : {}) });
    // Preserve assignment, prepared source selection, findings and bounded cache
    // identity. A later run may claim this same assignment, even in this process.
    delete state.owner.coordinator;
    state.owner.paidCallCheckpoint = { checkpointedAt: now(), outputPath };
    save(skillFile(root, campaignId, skillId), state);
    return { skillId, status: state.status, checkpoint: 'paid-call-bound', assignmentId: state.owner.assignmentId };
  });
}
export function recordWorkerFailure(root, { campaignId = DEFAULT_CAMPAIGN, skillId, workerId, error, metrics = null, outputPath = null } = {}) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId); checkOwner(state, workerId);
    state.attempts.push({ assignmentId: state.owner.assignmentId, role: state.owner.role, workerId, failedAt: now(), error, metrics, outputPath, ...(state.owner.workerLineage ? { workerLineage: structuredClone(state.owner.workerLineage) } : {}) });
    state.pending = [...new Set([...(state.pending || []), 'Worker attempt failed; diagnose before retry: ' + error])];
    delete state.owner; save(skillFile(root, campaignId, skillId), state); return { skillId, status: state.status };
  });
}
export async function publishAssignment(root, { campaignId = DEFAULT_CAMPAIGN, skillId, publisher = null, expectedStageHash = null } = {}) {
  // Publication's own root/skill lock protects all canonical writers. A ledger lease
  // prevents two coordinators publishing the same accepted assignment concurrently.
  let state;
  lock(root, campaignId, () => {
    state = readSkill(root, campaignId, skillId); if (!['accepted', 'publishing'].includes(state.status)) throw new Error('Skill has not passed independent and actual visual review');
    if(expectedStageHash!==null && state.stage?.hash!==expectedStageHash)throw new Error('Stale explicitly requested publication stage');
    if (state.owner) throw new Error('Publication already owned');
    if (scopeDependencies(root, skillId, state.scope, state.stage.sourceReview).hash !== state.stage.dependencyHash) throw new Error('Stale source/scope acceptance');
    for (const [sourceIndex, source] of state.stage.sourceReview.entries()) {
      validateSourceImages(root, source, { requireAccepted: true, requireBound: true });
      for (const gap of source.unavailableImages || []) {
        const reviewed = (state.review.sourceImageReviews || []).filter(review => review.sourceIndex === sourceIndex && review.imagePath === gap.path && review.decisionHash === unavailableImageDecisionHash(gap));
        if (reviewed.length !== 1 || reviewed[0].accepted !== true || !reviewed[0].observation?.trim()) throw new Error('Unavailable-source illustration lacks current independent acceptance: ' + gap.path);
      }
    }
    validateVisualReviews(root, state.review.requiredVisuals, state.review.visualReviews, state.stage.candidateHash, readJson(inside(root,state.stage.candidatePath)), readCampaign(root,campaignId));
    state.status = 'publishing'; state.owner = { workerId: 'coordinator-publication', role: 'publish', pid: process.pid, assignedAt: now() }; save(skillFile(root, campaignId, skillId), state);
  });
  try {
    const publication = publisher || (await import('./publication.mjs')).publishSkill;
    const candidate = readJson(inside(root, state.stage.candidatePath));
    if (hashValue({ content: candidate.content, quiz: candidate.quiz }) !== state.stage.candidateHash || state.review.stageHash !== state.stage.hash) throw new Error('Stale candidate/acceptance');
    const result = await publication(root, skillId, { expected: state.stage.expected, candidateContent: candidate.content, candidateQuiz: candidate.quiz });
    return finishPublished(root, campaignId, skillId, result.journalPath || null);
  } catch (error) {
    lock(root, campaignId, () => {
      const current = readSkill(root, campaignId, skillId), activeJournal = fs.existsSync(path.join(root, '.agywork/content-publication/active', skillId + '.json'));
      const changed = JSON.stringify(capturePair(root, skillId).expected) !== JSON.stringify(current.stage.expected);
      current.status = activeJournal || changed ? 'publishing' : 'accepted'; current.pending = ['Publication interrupted or rejected: ' + error.message];
      if (current.status === 'publishing') current.owner = { workerId: 'coordinator-publication', role: 'publish', interrupted: true, pid: null, failedAt: now() }; else delete current.owner;
      save(skillFile(root, campaignId, skillId), current);
    }); throw error;
  }
}
function finishPublished(root, campaignId, skillId, journalPath) {
  return lock(root, campaignId, () => {
    const state = readSkill(root, campaignId, skillId), readback = capturePair(root, skillId);
    if (hashValue({ content: readback.content, quiz: readback.quiz }) !== state.stage.candidateHash) throw new Error('Published readback differs from accepted candidate');
    const dispositions = state.stage.baselineDispositions.map(disposition => ({ ...disposition, review: disposition.outcome === 'removed' ? state.review.removals.find(outcome => outcome.where === disposition.where && outcome.hash === disposition.hash) : state.review.outcomes.find(outcome => outcome.where === disposition.finalWhere && outcome.hash === disposition.finalHash) }));
    state.published = { expected: readback.expected, at: now(), journalPath, finalItems: assessmentItems(readback.content, readback.quiz).map(({ value, ...item }) => item), baselineDispositions: dispositions };
    state.status = 'published'; state.pending = []; delete state.owner; save(skillFile(root, campaignId, skillId), state);
    return { skillId, status: state.status, expected: readback.expected };
  });
}
export async function recoverCampaignPublication(root, { campaignId = DEFAULT_CAMPAIGN, skillId, force = false, recoverer = null } = {}) {
  const state = readSkill(root, campaignId, skillId);
  if (state.status !== 'publishing') return { skillId, status: state.status, recovered: false };
  if (state.owner?.pid && !force) {
    let alive = false; try { process.kill(state.owner.pid, 0); alive = true; } catch { /* dead publisher */ }
    if (alive) throw new Error('Publisher process still active; do not steal publication ownership');
  }
  const recover = recoverer || (await import('./publication.mjs')).recoverSkill;
  const result = await recover(root, skillId, { mode: 'finish' });
  const current = capturePair(root, skillId);
  if (hashValue({ content: current.content, quiz: current.quiz }) === state.stage.candidateHash) return finishPublished(root, campaignId, skillId, result?.journalPath || null);
  if (JSON.stringify(current.expected) !== JSON.stringify(state.stage.expected)) throw new Error('Publication recovery found concurrent edits; reconcile explicitly');
  return lock(root, campaignId, () => { const currentState = readSkill(root, campaignId, skillId); currentState.status = 'accepted'; delete currentState.owner; save(skillFile(root, campaignId, skillId), currentState); return { skillId, status: 'accepted', recovered: true }; });
}
export function receiptCampaign(root, campaignId = DEFAULT_CAMPAIGN) {
  const campaign = readCampaign(root, campaignId), states = campaign.skillIds.map(id => readJson(skillFile(root, campaignId, id)));
  const attempts = states.flatMap(state => state.attempts || []);
  const observations = attempts.flatMap(attempt => attempt.metrics?.boundedAttempts ? attempt.metrics.boundedAttempts.filter(call => !call.reused && call.metrics?.externalModelCalls !== 0).map(call => ({ ...call.metrics, callId: call.metrics?.callId || call.attemptId })) : attempt.metrics && attempt.metrics.externalModelCalls !== 0 ? [attempt.metrics] : []);
  const metrics = [...new Map(observations.map((metric, index) => [metric.callId || metric.sessionId || 'unidentified-' + index, metric])).values()];
  const cache = { taxonomy: taxonomyAt(root), fileHashes: new Map(), rendererCampaign: campaign }, finalFreshness = withReviewRendererContexts(root, campaign, states.flatMap(state => state.review?.visualReviews || []), context => {
    cache.rendererContext = context;
    return states.filter(state => state.status === 'published').map(state => liveAcceptance(root, state, cache));
  }), staleFinals = finalFreshness.filter(final => !final.current);
  const receipt = { ...statusCampaign(root, campaignId), startedAt: campaign.createdAt, observedAt: now(), elapsedMs: Date.now() - Date.parse(campaign.createdAt), profile: campaign.profile, futureExecutionOverride: campaign.futureExecutionOverride || null, workerCalls: metrics.length, recordedSessions: metrics.map(metric => metric.sessionId).filter(Boolean), availableUsage: metrics.map(metric => ({ sessionId: metric.sessionId || null, usage: metric.usage ?? null, observedModel: metric.observedModel ?? null, serviceTier: metric.serviceTier ?? null })), usageUnavailableCalls: metrics.filter(metric => !metric.usage).length, substantiveCorrections: states.flatMap(state => (state.stage?.substantiveCorrections || []).map(correction => ({ skillId: state.skillId, correction }))), staleFinals, verifiedCurrentPublished: finalFreshness.filter(final => final.current).length, complete: states.every(state => state.status === 'published') && !staleFinals.length };
  save(path.join(campaignPaths(root, campaignId).ledger, 'receipt.json'), receipt); return receipt;
}
