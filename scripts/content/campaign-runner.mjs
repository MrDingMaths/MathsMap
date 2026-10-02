import { assignmentExecutionProfile, futureExecutionProfile, campaignRunnerConfiguration, validateExecutionProfile } from './campaign-execution-profile.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { runAstraTask } from '../booklet/codex-transcription.mjs';
import { nextAssignment, prepareAssignment, stageAssignment, recordReview, readSkill, readCampaign, claimCoordinator, recordPaidCallCheckpoint, recordWorkerFailure, recordSourcePreparationGap, statusCampaign, publishAssignment, recoverCampaignPublication, campaignPaths, CAMPAIGN_PROFILE, hashValue, assessmentItems, loadPreviousReview } from './campaign-support.mjs';
import { inside, readJson, relative, validateSourceImages, preservePreparedSourceImages, unavailableImageDecisionHash } from './campaign-sources.mjs';
import { rejectPrerequisiteReferencesForExternal } from './campaign-prerequisite-context.mjs';

export const AUTHOR_CONTRACT = `Return ONLY JSON: {candidateContent,candidateQuiz,coverage:{methods:[{id,description,sourceRefs:[0]}],items:[{where,hash,methods:["method-id"]}]},sourceReview:[{path,hash,locator,support:"direct"|"indirect",observation,adjustments}],removals:[{where,hash,reason}],substantiveCorrections:["..."]}.
Canonical item locators are practice.foundation[0], practice.development[0], practice.mastery[0], theory.workedExamples[0], and quiz.<stable question id>, such as quiz.q1. Indices are zero-based.
Use the complete supplied baseline pair; preserve good items, identifiers, fields, narrow sets, mastery omissions and current edits. Review and repair ALL Foundation/Development/Mastery practice AND ALL quizzes. Every valid assessed distinct METHOD needs an example, not every superficial numerical case. Use ordered theory.workedExamples, with only question_text and solution_text; preserve existing legacy examples unless deliberately migrating.
Read the corresponding source worked examples, Key Ideas and practice together. Inspect actual linked PNGs/PDF pages where mathematical details require it. Choose/adapt the source booklet's worked examples when available; NEVER simply copy a published practice card into an example in place of an available booklet example. Record the exact source example/Key Ideas section/page and the actual wording/number/method adjustments. Direct mappings are suggestions until verified. Indirect closest-booklet plus syllabus support must be honestly marked indirect.
If an original skill booklet/example is absent, suitable existing booklet wording/setout plus explicit syllabus scope may support an adaptation. Record the original-source gap and the indirect support; missing essential method or scope evidence remains a blocker.
Use the booklet's simple language, notation, working sequence and taught method, with concise visible line-by-line working. No advanced language even if technically more precise. Site fields use inline $...$ maths only, one step per line, no display $$ or align* environments. Units/reasons/precision and every requested part remain. No vacuous procedure for recognition skills. Changing theory.steps requires updating EVERY dependent practice/quiz/example procedure header coherently.
Stage 3 mathematics, terminology and assumed knowledge remain strictly Stage 3; later-stage sources provide wording/presentation only. Later course membership never permits advancing scope. Repair out-of-scope practice rather than increasing example difficulty. Preserve scope decisions or flag consequential genuine conflicts.
For new or adapted worked examples, avoid easy numbers hiding the structure and coincidentally equal values in different roles, including equal DIGITS in a critical checked place and resulting place. Keep arithmetic manageable; retain equality essential to the concept and meaningful retained-digit equality. Preserve good existing practice/quiz values and useful existing examples; do not rewrite them for number aesthetics alone. Repair actual mathematical, source, scope or teaching defects. Multiple conceptual contrasting examples are useful where needed. Do not pad quotas. Audit every solution, MCQ option/why, wording, scope, difficulty, variation and coverage. Source errors are repairs with original evidence retained.
Map EACH final practice, quiz and example to explicit method IDs; structure slugs alone are not proof. SourceRefs indexes address sourceReview. Hash fields may be omitted: the coordinator derives them from your actual payload and verified source bytes. Supplied hashes must be correct. For each declared unavailableImages syllabus illustration, preserve its path/nonessential reason/textAlternative and explicitly return accepted:true plus your observation only if the complete text and actual booklet evidence suffice; otherwise report a blocker. Never waive a required original booklet figure. Unknown/missing exact source evidence must be a blocker, never invented provenance. For removals include the original locator and reason. Do not write files or publish. No subagents or additional model calls.`;

export const REVIEW_CONTRACT = `Return ONLY JSON: {stageHash,outcomes:[{where,hash,verdict:"accepted"|"repair"|"unresolved",independentSolution,observation,options?:[{hash,mathematicallyCorrect,observation}]}],theoryObservation,sourceObservation,removals:[{where,hash,accepted,independentSolution,observation,options?:[{hash,mathematicallyCorrect,observation}]}],findings:[{description}],flaggedDiagrams:["field locator"],stepsRepair?:{accepted,reason,beforeHash,candidateHash}}.
Previously accepted unchanged outcomes explicitly listed in reusedOutcomes may be reused; derive full independent solutions for every other item and every removed original, including all original MCQ options.
For each MCQ option, mathematicallyCorrect means it correctly answers the actual question stem. A negative stem such as "Which step is NOT correct?" has one valid answer naming the invalid step; explain each step's mathematical validity and whether it answers that stem in the observation.
For new or adapted worked examples, check coincidental equality in different roles, including checked digits versus resulting digits; retain meaningful unchanged-digit equality. Preserve good existing practice/quiz values and useful examples absent an actual mathematical, source, scope or teaching defect; number aesthetics alone do not require rewriting. Refresh the current method-to-example coverage assessment separately from reusable unchanged-item mathematical outcomes.
Independently fully solve EVERY final practice, quiz and example from its task/givens/source; do not merely agree with the supplied solution or sample items. Record your actual derived working/result for each. Examine ALL options in original order and every distractor reason; exactly one option must be valid. Review taught method, booklet language, notation, scope, level, units/precision, all parts, variation and every assessed-method-to-example link. Theory must be correct and support the practice. Review source examples/Key Ideas/practice together with actual linked image/PDF evidence where needed. Exact source locations and direct/indirect support must be honest; verify adaptation of available booklet examples instead of copying published practice. Stage 3 stays strictly Stage 3 despite later-source wording.
You are a distinct independent worker from the author using GPT-6.1 Sol high. Do not assume earlier assertions constitute evidence. Report straightforward required repairs as findings; do not mark repaired/unresolved items accepted. Check source evidence and current scope. For EVERY declared unavailableImages illustration return sourceImageReviews:[{sourceIndex,imagePath,decisionHash?,accepted:boolean,observation}], using the sourceReview index. Independently confirm its nonessential reason and complete textual alternative against actual booklet evidence, or reject it. No blanket missing-image waiver. Hash fields may be omitted: the coordinator binds your real outcomes to actual candidate/source bytes. Supplied hashes must be correct. If steps changed, explicitly accept the source-supported change after checking EVERY dependent solution header; the coordinator supplies exact before/candidate hashes when absent. Do not provide automatic visual approval: actual changed/new/flagged diagram rendering, geometry, palette and solid visibility remain a separate evidence step. No files, publication, subagents or other model calls.`;

export function workerContract(role, profile = CAMPAIGN_PROFILE) {
  validateExecutionProfile(profile);
  if (!['author', 'review'].includes(role)) throw new Error('Unknown worker role');
  return (role === 'review' ? REVIEW_CONTRACT : AUTHOR_CONTRACT).replace('GPT-6.1 Sol high', `GPT-6.1 Sol ${profile.effort}`);
}

function bindHash(value, supplied, label) {
  const actual = hashValue(value); if (supplied && supplied !== actual) throw new Error('Supplied wrong hash: ' + label); return actual;
}
export function canonicalItemLocator(where, content, quiz) {
  if (typeof where !== 'string') throw new Error('Item locator must be a string');
  const normalized = where.replace(/^(?:candidateContent|content)\./, '');
  const indexedQuiz = normalized.match(/^(?:candidateQuiz|quiz)\.questions\[(\d+)\]$/);
  if (indexedQuiz) {
    const item = quiz?.questions?.[Number(indexedQuiz[1])];
    if (!item?.id || quiz.questions.filter(question => question.id === item.id).length !== 1) throw new Error('Unknown/ambiguous indexed quiz locator: ' + where);
    return 'quiz.' + item.id;
  }
  if (!assessmentItems(content, quiz).some(item => item.where === normalized)) throw new Error('Unknown item locator: ' + where);
  return normalized;
}
export function normalizeWorkerResult(root, state, result) {
  if (result?.blocker || result?.blocked || result?.status === 'blocked') throw new Error('Worker reported blocker: ' + JSON.stringify(result.blocker || result.blocked || result.reason));
  const normalized = structuredClone(result);
  if (state.owner.role === 'author') {
    if (!normalized?.candidateContent) throw new Error('Worker returned no candidate content: ' + (normalized?.reason || normalized?.message || 'inspect the retained raw result'));
    const content = typeof normalized.candidateContent === 'string' ? JSON.parse(normalized.candidateContent) : normalized.candidateContent;
    const quiz = typeof normalized.candidateQuiz === 'string' ? JSON.parse(normalized.candidateQuiz) : normalized.candidateQuiz;
    const items = assessmentItems(content, quiz);
    for (const mapping of normalized.coverage?.items || []) {
      mapping.where = canonicalItemLocator(mapping.where, content, quiz);
      const item = items.find(item => item.where === mapping.where); if (!item) throw new Error('Unknown coverage locator: ' + mapping.where);
      mapping.hash = bindHash(item.value, mapping.hash, mapping.where);
    }
    for (const source of normalized.sourceReview || []) {
      if (Array.isArray(source.adjustments)) {
        if (source.adjustments.some(value => typeof value !== 'string' || !value.trim())) throw new Error('Source adjustments array must contain nonempty strings');
        source.adjustments = source.adjustments.length ? source.adjustments.join('\n') : 'No source adjustments were recorded.';
      }
      if (typeof source.adjustments !== 'string' || !source.adjustments.trim()) throw new Error('Source adjustments must be a nonempty string or an explicit array');
      const bytes = fs.readFileSync(inside(root, source.path)); source.hash = bindHash(bytes, source.hash, source.path);
      const lineCount = bytes.toString('utf8').split(/\r?\n/).length;
      const validateBounds = () => {
        for (const key of ['startLine', 'endLine']) if (source[key] !== undefined && (!Number.isInteger(source[key]) || source[key] < 1 || source[key] > lineCount)) throw new Error('Invalid source section boundary: ' + source.path + ' ' + key);
        if (source.startLine !== undefined && source.endLine !== undefined && source.startLine > source.endLine) throw new Error('Invalid reversed source section: ' + source.path);
      };
      validateBounds();
      const candidates = state.owner.prepared.sources.filter(ref => ref.path === source.path);
      // A path or repeated descriptive locator cannot override explicit section
      // boundaries. Missing bounds may be inferred only from one compatible ref.
      const completeSpan = source.startLine !== undefined && source.endLine !== undefined;
      const compatible = candidates.filter(ref =>
        (source.startLine === undefined || ref.startLine === source.startLine) &&
        (source.endLine === undefined || ref.endLine === source.endLine));
      // Locators are descriptive prose, not ranges. A known locator can select
      // among compatible refs, but cannot override a contradictory explicit bound.
      const located = source.locator == null ? [] : candidates.filter(ref => ref.locator === source.locator);
      const choices = !completeSpan && located.length ? compatible.filter(ref => located.includes(ref)) : compatible;
      if (choices.length > 1 || (!completeSpan && candidates.length && choices.length !== 1)) throw new Error('Ambiguous or contradictory prepared source section: ' + source.path);
      const selected = choices.length === 1 ? choices[0] : null;
      // Preparation uses 1/0 for an unbounded non-Markdown source. Preserve the
      // omitted end range; an explicit raw zero already failed validation above.
      const preparedBinaryDefault = path.extname(source.path).toLowerCase() !== '.md' && selected?.startLine === 1 && selected?.endLine === 0;
      if (source.startLine === undefined && selected?.startLine !== undefined) source.startLine = selected.startLine;
      if (source.endLine === undefined && selected?.endLine !== undefined && !preparedBinaryDefault) source.endLine = selected.endLine;
      validateBounds();
      const declaredGaps = selected?.unavailableImages || [];
      if (source.unavailableImages === undefined && declaredGaps.length) source.unavailableImages = structuredClone(declaredGaps);
      else if (Array.isArray(source.unavailableImages)) source.unavailableImages = source.unavailableImages.map(gap => ({ ...structuredClone(declaredGaps.find(declared => declared.path === gap.path) || {}), ...gap }));
      source.images = validateSourceImages(root, preservePreparedSourceImages(root, source, state.owner.prepared.sources));
    }
    const baseline = readJson(inside(root, state.owner.prepared.snapshotPath));
    for (const removal of normalized.removals || []) {
      removal.where = canonicalItemLocator(removal.where, baseline.content, baseline.quiz);
      const item = assessmentItems(baseline.content, baseline.quiz).find(item => item.where === removal.where);
      if (!item) throw new Error('Unknown baseline removal locator'); removal.hash = bindHash(item.value, removal.hash, removal.where);
    }
  } else {
    const candidate = readJson(inside(root, state.stage.candidatePath)), items = assessmentItems(candidate.content, candidate.quiz);
    if (normalized.stageHash && normalized.stageHash !== state.stage.hash) throw new Error('Supplied wrong stage hash'); normalized.stageHash = state.stage.hash;
    for (const review of normalized.sourceImageReviews || []) {
      const gap = state.stage.sourceReview[review.sourceIndex]?.unavailableImages?.find(gap => gap.path === review.imagePath);
      if (!gap) throw new Error('Unknown unavailable-illustration review');
      const actual = unavailableImageDecisionHash(gap); if (review.decisionHash && review.decisionHash !== actual) throw new Error('Supplied wrong unavailable-illustration decision hash'); review.decisionHash = actual;
    }
    for (const outcome of normalized.outcomes || []) {
      outcome.where = canonicalItemLocator(outcome.where, candidate.content, candidate.quiz);
      const item = items.find(item => item.where === outcome.where); if (!item) throw new Error('Unknown review locator: ' + outcome.where);
      outcome.hash = bindHash(item.value, outcome.hash, outcome.where);
      for (const [index, option] of (outcome.options || []).entries()) {
        if (!item.value.options?.[index]) throw new Error('Unknown MCQ option index'); option.hash = bindHash(item.value.options[index], option.hash, outcome.where + ' option ' + index);
      }
    }
    for (const removal of normalized.removals || []) {
      const item = state.stage.removals.find(item => item.where === removal.where); if (!item) throw new Error('Unknown removed-item review');
      if (removal.hash && removal.hash !== item.hash) throw new Error('Supplied wrong removed-item hash'); removal.hash = item.hash;
      if (removal.options) {
        const baseline = readJson(inside(root, state.stage.baselinePath)); const original = assessmentItems(baseline.content, baseline.quiz).find(original => original.where === item.where && original.hash === item.hash);
        for (const [index, option] of removal.options.entries()) { if (!original?.value.options?.[index]) throw new Error('Unknown removed MCQ option'); option.hash = bindHash(original.value.options[index], option.hash, item.where + ' removed option ' + index); }
      }
    }
    if (normalized.stepsRepair) {
      const baseline = readJson(inside(root, state.stage.baselinePath));
      normalized.stepsRepair.beforeHash = bindHash(baseline.content.theory, normalized.stepsRepair.beforeHash, 'steps before theory');
      normalized.stepsRepair.candidateHash = bindHash({ content: candidate.content, quiz: candidate.quiz }, normalized.stepsRepair.candidateHash, 'steps candidate pair');
    }
  }
  return normalized;
}

export function inlineEvidencePrompt(root, prepared, state, { maxVariableChars = 24000 } = {}) {
  rejectPrerequisiteReferencesForExternal(prepared, state, root);
  const packets = prepared.packets.map(packet => readJson(inside(root, packet.path)));
  const snapshot = readJson(inside(root, state.owner.prepared.snapshotPath));
  const previousReview = loadPreviousReview(root, prepared, state, packets);
  const sourceEvidence = prepared.sourceEvidencePath ? readJson(inside(root, prepared.sourceEvidencePath)) : [...new Map(packets.flatMap(packet => packet.sourceEvidence).map(source => [source.path + ':' + source.startLine + ':' + source.endLine, source])).values()];
  if (prepared.sourceEvidenceHash && hashValue(sourceEvidence) !== prepared.sourceEvidenceHash) throw new Error('Prepared source evidence changed');
  const reuseGroups = [], reusedOutcomes = state.owner.role === 'review' ? (state.stage.reusedOutcomes || []).map(outcome => {
    let group = reuseGroups.findIndex(value => hashValue(value) === hashValue(outcome.reusedFrom)); if (group < 0) { group = reuseGroups.length; reuseGroups.push(outcome.reusedFrom); }
    return { where: outcome.where, hash: outcome.hash, reuseGroup: group, verdict: 'accepted' };
  }) : null;
  const context = { skillId: state.skillId, role: state.owner.role, stageHash: state.stage?.hash || null, profile: assignmentExecutionProfile(state), scope: state.scope, context: packets[0].context, candidateContent: snapshot.content, candidateQuiz: snapshot.quiz, sourceEvidence, sourceRefs: prepared.sourceReferences, priorFindings: state.pending, previousReview, coverage: state.owner.role === 'review' ? state.stage.coverage : null, reusedOutcomes, reuseGroups, removals: state.owner.role === 'review' ? state.stage.removals : null, requiredHashes: { encoding: 'SHA-256 of JSON.stringify(value), UTF-8', candidateHash: state.stage?.candidateHash || null } };
  if (state.owner.role === 'review' && state.stage.baselinePath) {
    const baseline = readJson(inside(root, state.stage.baselinePath));
    context.removedOriginalItems = (state.stage.removals || []).map(removal => {
      const item = assessmentItems(baseline.content, baseline.quiz).find(item => item.where === removal.where && item.hash === removal.hash);
      if (!item) throw new Error('Stale removed original baseline item');
      return { ...item, removalReason: removal.reason };
    });
    if (JSON.stringify(baseline.content.theory.steps) !== JSON.stringify(snapshot.content.theory.steps)) context.beforeTheory = baseline.content.theory;
  }
  const variable = JSON.stringify(context);
  if (variable.length > maxVariableChars) throw new Error(`Inline whole-skill evidence exceeds ${maxVariableChars} characters (${variable.length}); select precise source sections and bound context before dispatch. Do not silently omit assessment items.`);
  if (!sourceEvidence.length || prepared.sourceReferences.some(ref => path.extname(ref.path).toLowerCase() === '.md' && !sourceEvidence.some(source => source.path === ref.path))) throw new Error('Selected source evidence does not fit inline; select a precise bounded excerpt before dispatch');
  return { prompt: `${workerContract(state.owner.role, assignmentExecutionProfile(state))}\n\nThe complete required evidence is inline below. No file read is required. Whole questions contain their solutions and options. Work only from this evidence; report consequential missing evidence rather than guessing. Source images supplied as attachments must be inspected where relevant. Preserve all assessment items unless explicitly justified and independently reviewed.\n\n${variable}`, variableChars: variable.length, images: sourceEvidence.flatMap(source => source.images || []).map(image => inside(root, typeof image === 'string' ? image : image.path)) };
}
export function validateOversizeExceptions(campaign, exceptions = {}) {
  if (!exceptions || typeof exceptions !== 'object' || Array.isArray(exceptions)) throw new Error('Oversize exceptions must be a per-skill object');
  const kinds = new Set(['author', 'examples', 'review', 'review-headers', 'review-coverage', 'review-removals']);
  for (const [skillId, rows] of Object.entries(exceptions)) {
    if (!campaign.skillIds.includes(skillId)) throw new Error('Oversize exception outside frozen published membership: ' + skillId);
    if (!rows || typeof rows !== 'object' || Array.isArray(rows) || !Object.keys(rows).length) throw new Error('Oversize exceptions need explicit whole-item locators');
    for (const [where, exception] of Object.entries(rows)) {
      if (!/^(?:practice\.(?:foundation|development|mastery)\[\d+\]|theory\.workedExamples\[\d+\]|quiz\.[\w-]+)$/.test(where)) throw new Error('Oversize exception needs a canonical whole-item locator: ' + where);
      if (!exception || typeof exception !== 'object' || Array.isArray(exception) || typeof exception.reason !== 'string' || !exception.reason.trim() || exception.indivisible !== true || !Number.isInteger(exception.variableChars) || exception.variableChars <= 24000 || !kinds.has(exception.kind)) throw new Error('Oversize exception needs explicit reason, indivisible:true, measured variableChars above 24000 and an item-job kind');
      for (const key of ['stageHash', 'candidateHash', 'itemHash', 'dependencyHash']) if (!/^[a-f0-9]{64}$/.test(exception[key] || '')) throw new Error('Oversize exception needs exact current ' + key);
      if (exception.failureVariableChars !== undefined && (!Number.isInteger(exception.failureVariableChars) || exception.failureVariableChars <= 24000)) throw new Error('Oversize failureVariableChars must be the actual original measured failure above 24000');
      if (Object.keys(exception).some(key => !['reason', 'indivisible', 'variableChars', 'failureVariableChars', 'kind', 'stageHash', 'candidateHash', 'itemHash', 'dependencyHash'].includes(key))) throw new Error('Unknown oversize exception field');
    }
  }
  return structuredClone(exceptions);
}
export async function runCampaign(root, { campaignId, ids = null, authorIds = null, excludeIds = [], oversizeExceptions = {}, concurrency = 3, maxCalls = null, publish = false, runner = runAstraTask, prepareSources = null, onProgress = () => {} } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) throw new Error('Campaign uses at most three workers');
  const campaign = readCampaign(root, campaignId);
  oversizeExceptions = validateOversizeExceptions(campaign, oversizeExceptions);
  for (const owner of statusCampaign(root, campaignId).owners.filter(owner => owner.status === 'publishing')) await recoverCampaignPublication(root, { campaignId, skillId: owner.skillId });
  for (const [label, filter] of [['ids', ids], ['authorIds', authorIds], ['excludeIds', excludeIds]]) if (filter !== null && (!Array.isArray(filter) || filter.some(id => !campaign.skillIds.includes(id)))) throw new Error('Run ' + label + ' outside frozen published membership');
  const results = [], failedIds = new Set(), failureCauses = new Map();
  const selectedIds = ids || campaign.skillIds, excluded = new Set(excludeIds);
  let readyAuthorIds = authorIds;
  if (prepareSources?.preview) {
    const ready = new Set(authorIds || selectedIds);
    for (const skillId of selectedIds.filter(id => ready.has(id) && !excluded.has(id))) {
      const state = readSkill(root, campaignId, skillId);
      if (state.status !== 'pending' || state.stage || state.owner) continue;
      try {
        const selection = await prepareSources.preview({ root, campaignId, state });
        if (!selection.dispatchReady) { const error = new Error('Source selection requires reconciliation before dispatch: ' + (selection.gaps || []).map(gap => gap.kind).join(', ')); error.gaps = selection.gaps; throw error; }
      } catch (error) {
        ready.delete(skillId);
        const gap = recordSourcePreparationGap(root, { campaignId, skillId, error: error.message, gaps: error.gaps || [] });
        results.push({ ...gap, role: 'author', ok: false }); onProgress({ type: 'campaign.source-prep-gap', ...gap });
      }
    }
    readyAuthorIds = [...ready];
  }
  let sharedFailure = null;
  const runId = randomUUID();
  const authorAttemptsThisRun = new Map();
  const resumeOwners = statusCampaign(root, campaignId).owners.filter(owner => owner.owner.role !== 'publish' && owner.owner.workerLineage?.kind !== 'native' && !owner.owner.workerId?.startsWith('sol61-native-') && owner.owner.nativeInterface !== 'collaboration' && owner.owner.profile?.nativeInterface !== 'collaboration' && selectedIds.includes(owner.skillId) && !excluded.has(owner.skillId)).map(owner => owner.owner.workerId);
  let calls = 0;
  const lanes = async () => {
    while (!sharedFailure && (maxCalls === null || calls < maxCalls)) {
      const workerId = resumeOwners.shift() || `sol61-${randomUUID()}`;
      const assignment = nextAssignment(root, { campaignId, workerId, ...(campaign.futureAssignmentPolicy ? { workerLineage: { kind: 'external-ephemeral' } } : {}), ids: selectedIds, authorIds: readyAuthorIds, excludeIds: [...excluded, ...failedIds] });
      if (assignment.done || assignment.blocked) break;
      let state, out, reply, claimed = false, selectingSources = false;
      try {
        claimCoordinator(root, { campaignId, skillId: assignment.skillId, workerId, runId }); claimed = true;
        if (assignment.role === 'author' && (authorAttemptsThisRun.get(assignment.skillId) || 0) >= 2) throw new Error('Two author/repair attempts in this run; diagnose the repeated findings before a third attempt');
        const currentState = readSkill(root, campaignId, assignment.skillId);
        selectingSources = !!(prepareSources && assignment.role === 'author' && currentState.status === 'pending' && !currentState.owner.prepared && !currentState.stage);
        const selected = selectingSources ? await prepareSources({ root, campaignId, assignment, state: currentState }) : null;
        selectingSources = false;
        const prepared = prepareAssignment(root, { ...selected, campaignId, skillId: assignment.skillId, workerId });
        state = readSkill(root, campaignId, assignment.skillId);
        out = path.join(campaignPaths(root, campaignId).work, assignment.skillId, assignment.assignmentId, 'attempt-' + randomUUID());
        const paidRunner = async options => {
          if (maxCalls !== null && calls >= maxCalls) {
            const error = new Error('Requested paid-call bound reached; preserve bounded evidence and resume after this checkpoint');
            error.code = 'CAMPAIGN_PAID_CALL_CHECKPOINT';
            error.metrics = { externalModelCalls: 0, dispatched: false }; throw error;
          }
          calls++;
          try {
            const response = await runner(options);
            response.metrics = { externalModelCalls: 1, dispatched: true, ...(response.metrics || {}) }; return response;
          } catch (error) {
            error.metrics = { externalModelCalls: 1, dispatched: true, ...(error.metrics || {}) }; throw error;
          }
        };
        let evidence = null;
        try { evidence = inlineEvidencePrompt(root, prepared, state); }
        catch (error) {
          if (!/exceeds|does not fit inline/.test(error.message)) throw error;
          const { runBoundedAssignment } = await import('./campaign-bounded.mjs');
          reply = await runBoundedAssignment({ root, campaignId, prepared, state, runner: paidRunner, onProgress, out, concurrency: 1, oversizeExceptions: oversizeExceptions[assignment.skillId] || {} });
        }
        if (assignment.role === 'author') authorAttemptsThisRun.set(assignment.skillId, (authorAttemptsThisRun.get(assignment.skillId) || 0) + 1);
        if (evidence) {
          fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'prompt.txt'), evidence.prompt);
          reply = await paidRunner({ cwd: root, runDir: campaignPaths(root, campaignId).work, prompt: evidence.prompt, images: evidence.images, out, profile: assignment.role === 'review' ? 'review' : 'transcription', configuration: campaignRunnerConfiguration(assignment.profile), stage: 'content-' + assignment.role, onProgress });
        }
        fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(reply.result, null, 2));
        if (reply.metrics?.observedModel && reply.metrics.observedModel !== CAMPAIGN_PROFILE.model) throw new Error('Unexpected observed worker model');
        const normalized = normalizeWorkerResult(root, state, reply.result);
        fs.writeFileSync(path.join(out, 'normalized-result.json'), JSON.stringify(normalized, null, 2));
        const options = { ...normalized, campaignId, skillId: assignment.skillId, workerId, metrics: reply.metrics };
        const result = assignment.role === 'review' ? recordReview(root, options) : stageAssignment(root, options);
        results.push(result); onProgress({ type: 'campaign.assignment.completed', ...result });
        if (publish && result.status === 'accepted') results.push(await publishAssignment(root, { campaignId, skillId: assignment.skillId }));
      } catch (error) {
        if (error.code === 'CAMPAIGN_PAID_CALL_CHECKPOINT' && claimed) {
          const checkpoint = recordPaidCallCheckpoint(root, { campaignId, skillId: assignment.skillId, workerId, runId, metrics: reply?.metrics || error.metrics || null, outputPath: out ? relative(root, out) : null });
          results.push(checkpoint); onProgress({ type: 'campaign.paid-call-checkpoint', ...checkpoint }); break;
        }
        if (selectingSources && claimed) {
          const gap = recordSourcePreparationGap(root, { campaignId, skillId: assignment.skillId, workerId, error: error.message, gaps: error.gaps || [] });
          results.push({ ...gap, role: assignment.role, ok: false }); failedIds.add(assignment.skillId); onProgress({ type: 'campaign.source-prep-gap', ...gap }); continue;
        }
        results.push({ skillId: assignment.skillId, role: assignment.role, ok: false, error: error.message });
        failedIds.add(assignment.skillId);
        if (claimed) try { recordWorkerFailure(root, { campaignId, skillId: assignment.skillId, workerId, error: error.message, metrics: reply?.metrics || error.metrics || null, outputPath: out ? relative(root, out) : null }); } catch { /* Publication may already have released it. */ }
        const cause = error.message.replace(/[0-9a-f]{24,}/gi, '<hash>').replace(/\d+/g, '#');
        failureCauses.set(cause, (failureCauses.get(cause) || 0) + 1);
        if (failureCauses.get(cause) >= 2) sharedFailure = { cause, occurrences: failureCauses.get(cause), instruction: 'Diagnose the repeated shared cause before further dispatch.' };
        // Keep the failed skill pending; unrelated eligible skills can proceed.
        // Repeated shared failures stop fresh dispatch without discarding evidence.
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, lanes));
  return { campaignId, calls, results, sharedFailure, profile: futureExecutionProfile(readCampaign(root, campaignId)), noAutomaticDiagramAcceptance: true };
}
