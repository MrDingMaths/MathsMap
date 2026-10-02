import { assignmentExecutionProfile, campaignRunnerConfiguration } from './campaign-execution-profile.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { runAstraTask } from '../booklet/codex-transcription.mjs';
import { assessmentItems, hashValue, CAMPAIGN_PROFILE, BOUNDED_CONTEXT_PROFILE, campaignPaths, loadPreviousReview } from './campaign-support.mjs';
import { inside, readJson, relative, validateUnavailableImages, unavailableImageDecisionHash } from './campaign-sources.mjs';
import { rejectPrerequisiteReferencesForExternal } from './campaign-prerequisite-context.mjs';

export const VARIABLE_LIMIT = 24000;
const METADATA_REFERENCE_INSTRUCTION = '\nSource metadata references: sourceEvidenceIndex is a zero-based index into the complete inline sourceEvidence array. sourceFields lists fields copied exactly from that source; fieldOrder records original metadata order. If unavailableImageIndex is present, those fields refer to that exact unavailableImages entry on the indexed source. Other inline fields, including support, observations, adjustments and accepted gap decisions, override nothing referenced and remain complete. Resolve these references using the inline source evidence; method sourceRefs still index sourceReview rows in original order. All original source images are attached. These references confer no new acceptance.';
const COMMON = `Use gpt-6.1-sol high, Standard. Complete only this assignment, independently, with all required evidence inline. No tools, file reads, subagents or other model calls. Return JSON only. Preserve source language, taught methods, scope, precision, all parts, editable inline $...$ mathematics and concise visible working, one step per line. For new or adapted worked examples, use manageable numbers exposing the assessed structure; avoid shortcut nice values and coincidental equality in different roles, including a deciding digit equal to the rounded digit. Preserve equality essential to the mathematical concept. Preserve good existing practice/quiz values and useful examples absent an actual mathematical, source, scope or teaching defect; do not rewrite for number aesthetics alone or pad numerical quotas. Stage 3 stays Stage 3 even with later source wording. Do not invent provenance or approve diagram visuals. For MCQ review, mathematicallyCorrect means the option correctly answers the actual stem; negative stems can ask for an invalid mathematical step, so explain both the step's validity and whether it answers the stem. Hash fields may be omitted: the coordinator binds them to actual bytes and rejects supplied wrong hashes. Never attempt a hash calculation. Patch beforeHash must copy the supplied original item hash exactly. Report {blocker:"specific missing evidence"} when necessary.`;
const CONTRACTS = {
  plan: `Review the complete source context and theory, then return {theoryPatch?:{beforeHash,value},methods:[{id,description,sourceRefs:[0]}],sourceReview:[{path,hash,startLine,endLine,locator,support:"direct"|"indirect",observation,adjustments}],substantiveCorrections:[]}. Include EVERY selected source section in sourceReview, copying its path/hash/startLine/endLine. Retain each declared unavailableImages illustration with its exact path/nonessential reason/textAlternative and explicit accepted:true plus an observation only if the complete text and actual booklet evidence suffice; otherwise report a blocker. Never waive a required original booklet figure. When sourceContextReviews are supplied, they are actual retained readings of every original section in separately bounded source jobs; reconcile their taught methods and observations together, do not invent an unseen excerpt. Theory excludes separately owned examples. Preserve unaffected fields. Freeze your final steps for every later assessment/example header. Method IDs describe distinct assessed mathematical methods, not superficial cases. Source examples, Key Ideas and practice must support the plan. Use/adapt available source examples rather than copying a practice card.`,
  author: `Audit/repair EVERY owned whole assessment item, all options and reasons. Return {patches:[{where,beforeHash,operation:"replace"|"remove",value?,reason?}],coverage:[{where,hash,methods:["method-id"]}],methods:[{id,description,sourceRefs:[0]}],substantiveCorrections:[]}. Return patches only for changes; omitted patches retain the item exactly. Removal requires a substantive reason. Every retained/final item needs exactly one hash-bound coverage entry, including unchanged items. Never change a quiz ID or another item's fields. This bounded assignment owns existing whole items only; if adding/restoring an assessed item or changing foreign ownership is necessary, return a specific blocker rather than claiming completion. Use planned theory steps consistently in every relevantTheory/procedure header. Add explicit new methods if needed; same ID must retain the same definition.`,
  examples: `Return {examples:[{question_text,solution_text}],coverage:[{where:"theory.workedExamples[0]",hash,methods:["method-id"]}],removals:[{where,hash,reason}],substantiveCorrections:[]}. Author or retain coherent source-supported examples covering EVERY assigned requiredMethodId. Existing examples are supplied whole. Preserve existing examples one-to-one by default, including equal-looking items; do not silently deduplicate them. In phase retain-existing, own only the supplied whole items: preserve/repair useful examples and map their methods, without adding numerical quotas. Any removal needs the exact supplied original locator/hash and substantive reason in removals. In phase cover-missing, author examples for the assigned missing methods. Output coverage locators index your local returned examples starting at zero; the coordinator assembles them. Use planned frozen theory steps in all headers. This job owns examples only; no theory steps change.`,
  review: `Independently solve EVERY whole owned item, including every example. Return {outcomes:[{where,hash,verdict:"accepted"|"repair"|"unresolved",independentSolution,observation,options?:[{hash,mathematicallyCorrect,observation}]}],findings:[],flaggedDiagrams:[]}. Derive written working yourself and review taught method, wording, scope, units, precision, variation and each item's assigned method. Complete method-to-example coverage receives a separate review using these independent example solutions. EVERY quiz option needs mathematical and distractor explanation review in original order; accepted MCQ has exactly one valid option agreeing with its marker. Hash fields must equal supplied actual hashes when supplied.`,
  'review-theory': `Independently review theory, source support, scope, complete method-to-example mapping and all supplied dependent solution headers. Examples and assessment calculations have separate whole-item reviews. Return {theoryObservation,sourceObservation,findings:[],flaggedDiagrams:[],sourceImageReviews:[{sourceIndex,imagePath,decisionHash?,accepted:boolean,observation}],stepsRepair?:{accepted,reason}}. Review EVERY supplied unavailable-image decision, confirming its nonessential reason and full textual alternative against actual booklet evidence or rejecting it; never waive a required figure. When steps changed explicitly judge the source-supported change and header coherence; every dependent header is supplied. Do not assume author assertions prove correctness.`,
  'review-theory-source': `Own the current and before theory, actual source support, scope and EVERY supplied unavailable-image decision only. Every complete example/assessment, each dependent solution header and each method-to-example link has a separate independent whole-item or explicit check. Their hash-bound results are retained in aggregateReview; actual rejected checks are supplied in rejectedAggregateChecks. Do not claim to have read or derived those separately reviewed questions, examples, mappings or headers. You are not asked to approve them from counts. Independently compare the supplied theory and method definitions with the actual source text/images and governing scope. Return {theoryObservation,sourceObservation,findings:[],flaggedDiagrams:[],sourceImageReviews:[{sourceIndex,imagePath,decisionHash?,accepted:boolean,observation}],stepsRepair?:{accepted,reason}}. Explicitly describe your limited source/theory review. If steps changed, judge whether that change follows the supplied source; the coordinator separately requires every current header and mapping check to pass before accepting stepsRepair. Confirm each missing illustration's nonessential reason and full textual alternative against actual booklet evidence or reject it; never waive a required original figure. Report genuine source/theory defects and carry the actual rejected checks; no unseen-content approval.`,
  'review-headers': `Independently check EVERY owned final solution-header/relevantTheory record against the supplied before/current theory steps. Whole assessment calculations have separate independent reviews. Return {checks:[{where,hash,accepted,observation}],theoryObservation,findings:[],flaggedDiagrams:[]}. Explain each item's header coherence or required repair; do not assume counts prove acceptance.`,
  'review-coverage': `Independently check EVERY owned method mapping against the supplied explicit method descriptions and source context. Each assessment/example was independently solved in a separate whole-item assignment. Example records include the actual independently derived solution and method observation. Return {checks:[{where,hash,accepted,observation}],sourceObservation,findings:[],flaggedDiagrams:[]}. Verify the assigned method genuinely matches the independent observation/solution. The coordinator requires every assessed method to have an independently reviewed example; numerical superficial cases are not distinct methods.`,
  'source-context': `Read EVERY owned whole selected source section, including its examples, Key Ideas and practice. Return {checks:[{where,hash,accepted,support:"direct"|"indirect",locator,observation,adjustments,methods:[{id,description}]}],theoryObservation,findings:[],flaggedDiagrams:[]}. These sections belong to a complete source-context plan split into bounded jobs; do not claim to have seen another job. Actual governing syllabus excerpts are supplied in sourceEvidence where applicable; other selected sections listed in sourceRefs receive separate readings before the complete plan. Record actual taught methods, notation, precision and source scope. Review any supplied candidate method definitions/theory against this source. Stage 3 uses later source wording only and must mark borrowed support indirect. Record source errors, ambiguous source parts and needed theory repairs in observations/adjustments; acceptance here means this evidence supplies a usable taught method and style within the governing scope, not that every original booklet question is correct. Never invent an ambiguous figure-to-part mapping. Block only if essential teaching or scope cannot be established from the supplied evidence. The coordinator keeps every source check and merges them for the global plan; no selected section may disappear.`,
  'review-removals': `Independently solve and review EVERY removed original whole item against source/scope and its proposed reason. Return {removals:[{where,hash,accepted,independentSolution,observation,options?:[{hash,mathematicallyCorrect,observation}]}],findings:[]}. Include actual independently derived working/result and review every removed MCQ option/reason in its original order. Do not rubber-stamp a removal.`
};

export function theoryContext(theory = {}) {
  const value = structuredClone(theory); delete value.workedExample; delete value.workedExamples; return value;
}
function assert(condition, message) { if (!condition) throw new Error(message); }
function uniqueRows(rows, owned, label) {
  assert(Array.isArray(rows), `${label} must be an array`);
  const seen = new Set();
  for (const row of rows) { assert(owned.some(item => item.where === row.where), `Foreign ${label}: ${row.where}`); assert(!seen.has(row.where), `Duplicate ${label}: ${row.where}`); seen.add(row.where); }
  return seen;
}
function exactHash(supplied, actual, label) { assert(supplied === actual, `Missing/stale hash: ${label}`); }
function bindOptionalHash(row, actual, label) { if (row.hash !== undefined) exactHash(row.hash, actual, label); row.hash = actual; }
function ownedLocator(where, items) {
  assert(typeof where === 'string', 'Item locator must be a string');
  let canonical = where.replace(/^(?:candidateContent|content)\./, '').replace(/^candidateQuiz\./, 'quiz.');
  const indexed = canonical.match(/^quiz\.questions\[(\d+)\]$/);
  if (indexed) { const item = items.find(item => item.kind === 'quiz' && item.quizIndex === Number(indexed[1])); assert(item, 'Unknown/ambiguous indexed quiz locator: ' + where); canonical = item.where; }
  assert(items.some(item => item.where === canonical), 'Foreign item locator: ' + where); return canonical;
}
function normalizedRows(rows, items) { assert(Array.isArray(rows), 'Expected item rows'); return rows.map(row => ({ ...structuredClone(row), where: ownedLocator(row.where, items) })); }
export function wholeItemBatches(items, context, { maxVariableChars = VARIABLE_LIMIT, oversizeExceptions = {} } = {}) {
  const batches = []; let pending = [];
  const size = owned => JSON.stringify({ ...context, items: owned }).length;
  assert(size([]) <= maxVariableChars, 'Bounded context itself exceeds budget; narrow selected source evidence or diagnose indivisible teaching context');
  for (const item of items) {
    if (pending.length && size([...pending, item]) > maxVariableChars) { batches.push({ ...context, items: pending }); pending = []; }
    if (size([item]) > maxVariableChars) {
      const exception = oversizeExceptions[item.where];
      assert(exception?.reason?.trim() && exception?.indivisible === true, `Indivisible oversized item ${item.where} (${size([item])} characters): explicit diagnosed exception required`);
      if (exception.variableChars !== undefined) assert(exception.variableChars === size([item]), 'Stale diagnosed oversize character count: ' + item.where);
      batches.push({ ...context, items: [item], budgetException: { where: item.where, ...exception } });
    } else pending.push(item);
  }
  if (pending.length) batches.push({ ...context, items: pending });
  return batches;
}

export function applyAssessmentPatches(pair, batches) {
  const candidate = structuredClone(pair), originals = assessmentItems(pair.content, pair.quiz, false).filter(item => item.kind !== 'example');
  const decisions = new Map(), corrections = [], methods = new Map(), removals = [];
  for (const { items, result: supplied } of batches) {
    const result = validateAssessmentBatch(items, supplied);
    uniqueRows(result.patches, items, 'patch'); uniqueRows(result.coverage, items, 'coverage');
    for (const method of result.methods || []) {
      if (methods.has(method.id)) assert(hashValue(methods.get(method.id)) === hashValue(method), `Conflicting method ${method.id}`);
      methods.set(method.id, method);
    }
    for (const item of items) {
      assert(!decisions.has(item.where), `Duplicate ownership: ${item.where}`);
      const original = originals.find(entry => entry.where === item.where); assert(original, `Foreign assessment: ${item.where}`); exactHash(item.hash, original.hash, item.where);
      const patch = result.patches.find(entry => entry.where === item.where), suppliedMapping = result.coverage.find(entry => entry.where === item.where), mapping = suppliedMapping && structuredClone(suppliedMapping);
      if (patch) {
        exactHash(patch.beforeHash, item.hash, item.where);
        assert(['replace', 'remove'].includes(patch.operation), 'Unknown patch operation');
        if (patch.operation === 'remove') { assert(patch.reason?.trim() && !mapping, 'Removal needs reason and no final coverage'); removals.push({ where: item.where, hash: item.hash, reason: patch.reason }); decisions.set(item.where, { removed: true }); continue; }
        assert(patch.value && typeof patch.value === 'object', 'Replacement must be a complete item');
        if (item.kind === 'quiz') assert(patch.value.id === item.value.id, 'Quiz stable ID changed');
      }
      const value = patch ? patch.value : item.value;
      assert(mapping?.methods?.length, `Missing method coverage: ${item.where}`); bindOptionalHash(mapping, hashValue(value), item.where);
      decisions.set(item.where, { value, methods: mapping.methods });
    }
    corrections.push(...(result.substantiveCorrections || []));
  }
  assert(decisions.size === originals.length, 'Incomplete whole assessment ownership');
  const coverage = [];
  for (const tier of ['foundation', 'development', 'mastery']) if (candidate.content.practice?.[tier]) {
    const output = [];
    candidate.content.practice[tier].forEach((_, index) => { const decision = decisions.get(`practice.${tier}[${index}]`); if (!decision.removed) { coverage.push({ where: `practice.${tier}[${output.length}]`, hash: hashValue(decision.value), methods: decision.methods }); output.push(decision.value); } });
    candidate.content.practice[tier] = output;
  }
  if (candidate.quiz) candidate.quiz.questions = candidate.quiz.questions.flatMap(item => { const decision = decisions.get('quiz.' + item.id); if (decision.removed) return []; coverage.push({ where: 'quiz.' + item.id, hash: hashValue(decision.value), methods: decision.methods }); return [decision.value]; });
  return { ...candidate, coverage, methods: [...methods.values()], removals, substantiveCorrections: corrections };
}

export function validateAssessmentBatch(items, result) {
  result = { ...structuredClone(result), patches: normalizedRows(result.patches, items), coverage: normalizedRows(result.coverage, items) };
  uniqueRows(result.patches, items, 'patch'); uniqueRows(result.coverage, items, 'coverage');
  for (const item of items) {
    const patch = result.patches.find(row => row.where === item.where), mapping = result.coverage.find(row => row.where === item.where);
    if (patch) { exactHash(patch.beforeHash, item.hash, item.where); assert(['replace', 'remove'].includes(patch.operation), 'Unknown patch operation'); }
    if (patch?.operation === 'remove') { assert(patch.reason?.trim() && !mapping, 'Removal needs reason and no final coverage'); continue; }
    const value = patch ? patch.value : item.value;
    assert(value && typeof value === 'object', 'Replacement must be a complete item');
    if (item.kind === 'quiz') assert(value.id === item.value.id, 'Quiz stable ID changed');
    assert(mapping?.methods?.length, `Missing method coverage: ${item.where}`);
    if (mapping.hash !== undefined) exactHash(mapping.hash, hashValue(value), item.where);
  }
  for (const method of result.methods || []) assert(/^[a-z0-9][a-z0-9-]*$/.test(method.id) && method.description?.trim() && method.sourceRefs?.length, 'Malformed method definition');
  return result;
}

export function aggregateExampleBatches(results, methods) {
  const examples = [], mappings = [];
  for (const result of results) {
    assert(Array.isArray(result.examples) && Array.isArray(result.coverage), 'Incomplete example author result');
    const checked = assertMethodCoverage({ theory: { workedExamples: result.examples }, practice: {} }, null, { methods, items: result.coverage });
    result.examples.forEach((example, index) => {
      const mapping = checked.items.find(row => row.where === `theory.workedExamples[${index}]`), hash = hashValue(example);
      const next = examples.length; examples.push(structuredClone(example)); mappings.push({ where: `theory.workedExamples[${next}]`, hash, methods: mapping.methods });
    });
  }
  return { examples, coverage: mappings, removals: results.flatMap(result => result.removals || []), substantiveCorrections: results.flatMap(result => result.substantiveCorrections || []) };
}
function validateExampleResult(reply, owned, methods) {
  const normalized = aggregateExampleBatches([reply], methods), removals = normalizedRows(reply.removals || [], owned);
  uniqueRows(removals, owned, 'example removal');
  for (const removal of removals) { const item = owned.find(item => item.where === removal.where); bindOptionalHash(removal, item.hash, item.where); assert(removal.reason?.trim(), 'Example removal needs a substantive reason'); }
  assert(normalized.examples.length >= owned.length - removals.length, 'Existing example omitted without explicit baseline-bound removal');
  return { ...normalized, removals };
}

export function assertMethodCoverage(content, quiz, coverage) {
  coverage = structuredClone(coverage);
  const items = assessmentItems(content, quiz, false).map(item => item.kind === 'quiz' ? { ...item, quizIndex: quiz.questions.findIndex(question => question.id === item.value.id) } : item), methods = coverage.methods;
  coverage.items = normalizedRows(coverage.items, items);
  assert(Array.isArray(methods) && new Set(methods.map(row => row.id)).size === methods.length, 'Duplicate/missing methods');
  const owned = uniqueRows(coverage.items, items, 'method coverage'); assert(owned.size === items.length, 'Incomplete method coverage');
  for (const item of items) { const mapping = coverage.items.find(row => row.where === item.where); bindOptionalHash(mapping, item.hash, item.where); assert(mapping.methods?.length && mapping.methods.every(id => methods.some(method => method.id === id)), `Unknown method: ${item.where}`); }
  for (const method of methods) if (items.some(item => item.kind !== 'example' && coverage.items.find(row => row.where === item.where).methods.includes(method.id))) assert(items.some(item => item.kind === 'example' && coverage.items.find(row => row.where === item.where).methods.includes(method.id)), `Required method has no example: ${method.id}`);
  return coverage;
}

export function validateBatchReview(items, result) {
  result = { ...structuredClone(result), outcomes: normalizedRows(result.outcomes, items) };
  const seen = uniqueRows(result.outcomes, items, 'review outcome'); assert(seen.size === items.length, 'Incomplete independent batch review');
  for (const item of items) {
    const row = result.outcomes.find(entry => entry.where === item.where); bindOptionalHash(row, item.hash, item.where);
    assert(['accepted', 'repair', 'unresolved'].includes(row.verdict) && row.independentSolution?.trim() && row.observation?.trim(), `Incomplete independent solution: ${item.where}`);
    if (item.kind === 'quiz') {
      assert(row.options?.length === item.value.options.length, `Every MCQ option needs review: ${item.where}`);
      row.options.forEach((option, index) => { bindOptionalHash(option, hashValue(item.value.options[index]), item.where + ' option ' + index); assert(typeof option.mathematicallyCorrect === 'boolean' && option.observation?.trim(), 'Incomplete option review'); });
      if (row.verdict === 'accepted') assert(row.options.filter(option => option.mathematicallyCorrect).length === 1 && row.options.every((option, index) => option.mathematicallyCorrect === (item.value.options[index].correct === true)), 'MCQ unique correct answer disagrees');
    }
  }
  return result;
}

// Reuse mathematical outcomes under unchanged item/method/teaching/source/scope.
// Current example coverage receives a fresh separate review when examples change.
export function reviewDependencyHash(item, { theory, sourceEvidence, sourceRefs, scope, coverage, context }) {
  const mapping = coverage.items.find(row => row.where === item.where);
  const ids = mapping?.methods || [];
  const source = ref => ({ path: ref.path, hash: ref.hash, startLine: ref.startLine, endLine: ref.endLine, excerpt: ref.excerpt, images: ref.images?.map(image => typeof image === 'string' ? image : { path: image.path, hash: image.hash }), ...(ref.unavailableImages?.length ? { unavailableImages: ref.unavailableImages } : {}) });
  return hashValue({ item, theory: theoryContext(theory), sourceEvidence: sourceEvidence?.map(source), sourceRefs: sourceRefs?.map(source), scope, context, methods: coverage.methods.filter(method => ids.includes(method.id)), methodIds: ids });
}

function writeOnce(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2), { flag: 'wx' }); }
function headerEvidence(items) { return items.map(item => ({ where: item.where, hash: item.hash, relevantTheory: item.value.relevantTheory, headers: String(item.value.solution_text || '').split('\n').filter(line => /^\s*(?:#{1,6}|\*\*|\d+[.)])/.test(line)) })); }

export function compactContext(context = {}) {
  const related = new Map();
  for (const group of ['prereqs', 'siblings', 'dependents']) for (const skill of context[group] || []) related.set(skill.id, { ...related.get(skill.id), ...skill });
  return { ...context, ...(related.size ? { relatedSkills: [...related.values()], prereqs: (context.prereqs || []).map(skill => skill.id), siblings: (context.siblings || []).map(skill => skill.id), dependents: (context.dependents || []).map(skill => skill.id) } : {}) };
}
function leanSource(source, includeExcerpt = true) {
  const { path, hash, startLine, endLine, excerpt, images, support, locator, unavailableImages } = source;
  // Excerpt-normalization hashes and archived mapping metadata remain in the
  // verified immutable evidence file; workers receive the same text and identity.
  return { path, hash, startLine, endLine, ...(includeExcerpt ? { excerpt } : {}), images, support, locator, ...(unavailableImages?.length ? { unavailableImages } : {}) };
}

// Only redundant metadata may become references. The complete source text,
// images and gap declarations stay inline once; decisions and observations stay
// on their original review rows. Explicit field order makes this reversible.
export function compactAuthorSourceContext(payload, profile, completeSources) {
  if (profile !== BOUNDED_CONTEXT_PROFILE || payload.sourceContextReviews || !payload.sourceEvidence?.length) return payload;
  if (hashValue(payload.sourceEvidence) !== hashValue(completeSources.map(source => leanSource(source)))) return payload;
  const evidence = payload.sourceEvidence, keys = ['path', 'hash', 'startLine', 'endLine'];
  const identity = source => keys.map(key => source[key]);
  assert(evidence.every(source => keys.every(key => source[key] !== undefined)), 'Source metadata references need exact path/hash/ranges');
  assert(new Set(evidence.map(source => JSON.stringify(identity(source)))).size === evidence.length, 'Ambiguous duplicate source evidence identity');
  const result = structuredClone(payload);
  const reference = (row, sourceEvidenceIndex, unavailableImageIndex = undefined, preserve = []) => {
    const source = unavailableImageIndex === undefined ? evidence[sourceEvidenceIndex] : evidence[sourceEvidenceIndex].unavailableImages[unavailableImageIndex];
    const fieldOrder = Object.keys(row).filter(key => row[key] !== undefined);
    const sourceFields = fieldOrder.filter(key => !preserve.includes(key) && key in source && JSON.stringify(row[key]) === JSON.stringify(source[key]));
    const other = Object.fromEntries(Object.entries(row).filter(([key]) => !sourceFields.includes(key)));
    assert(!['sourceEvidenceIndex', 'unavailableImageIndex', 'sourceFields', 'fieldOrder'].some(key => key in row), 'Reserved source-reference field in original metadata');
    return { sourceEvidenceIndex, ...(unavailableImageIndex === undefined ? {} : { unavailableImageIndex }), sourceFields, fieldOrder, ...other };
  };
  const gapReference = (gap, sourceEvidenceIndex = undefined) => {
    const matches = evidence.flatMap((source, index) => (source.unavailableImages || []).flatMap((declared, gapIndex) => {
      if (sourceEvidenceIndex !== undefined && index !== sourceEvidenceIndex) return [];
      return declared.path === gap.path && unavailableImageDecisionHash(declared) === unavailableImageDecisionHash(gap) ? [{ index, gapIndex, declared }] : [];
    }));
    assert(matches.length === 1, 'Missing/ambiguous source gap reference: ' + gap.path);
    const match = matches[0];
    for (const key of ['textAlternativeLocator', 'matchingBookletStyle']) if (gap[key] !== undefined) assert(JSON.stringify(gap[key]) === JSON.stringify(match.declared[key]), 'Changed source gap metadata: ' + key);
    return reference(gap, match.index, match.gapIndex, ['accepted', 'observation']);
  };
  const sourceReference = (row, isReview) => {
    const matches = evidence.flatMap((source, index) => JSON.stringify(identity(source)) === JSON.stringify(identity(row)) ? [index] : []);
    assert(matches.length === 1, 'Missing/ambiguous exact source metadata reference: ' + row.path);
    const index = matches[0], source = evidence[index];
    // Never allow an author-supplied list to remove or mutate delivered figures.
    if (row.images !== undefined) assert(hashValue(row.images) === hashValue(source.images), 'Changed source images in metadata reference');
    const compressed = reference(row, index, undefined, isReview ? ['support', 'observation', 'adjustments', 'unavailableImages'] : ['unavailableImages']);
    if (row.unavailableImages) compressed.unavailableImages = row.unavailableImages.map(gap => gapReference(gap, index));
    return compressed;
  };
  if (result.sourceRefs) result.sourceRefs = result.sourceRefs.map(row => sourceReference(row, false));
  if (result.sourceReview) result.sourceReview = result.sourceReview.map(row => sourceReference(row, true));
  if (result.sourceSelection?.hints?.unavailableImages) result.sourceSelection.hints.unavailableImages = result.sourceSelection.hints.unavailableImages.map(gap => gapReference(gap));
  result.boundedContextProfile = BOUNDED_CONTEXT_PROFILE;
  assert(hashValue(expandAuthorSourceContext(result)) === hashValue(payload), 'Source metadata references changed original context');
  return result;
}

export function expandAuthorSourceContext(payload) {
  if (payload.boundedContextProfile !== BOUNDED_CONTEXT_PROFILE) return payload;
  const evidence = payload.sourceEvidence;
  const expand = value => {
    if (Array.isArray(value)) return value.map(expand);
    if (!value || typeof value !== 'object') return value;
    if (!Object.hasOwn(value, 'sourceEvidenceIndex')) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expand(entry)]));
    assert(Number.isInteger(value.sourceEvidenceIndex) && evidence[value.sourceEvidenceIndex], 'Invalid source evidence reference');
    const row = evidence[value.sourceEvidenceIndex], source = value.unavailableImageIndex === undefined ? row : row.unavailableImages?.[value.unavailableImageIndex];
    assert(source && Array.isArray(value.sourceFields) && Array.isArray(value.fieldOrder), 'Invalid source metadata reference');
    return Object.fromEntries(value.fieldOrder.map(key => { assert(value.sourceFields.includes(key) ? Object.hasOwn(source, key) : Object.hasOwn(value, key), 'Missing referenced source field: ' + key); return [key, value.sourceFields.includes(key) ? structuredClone(source[key]) : expand(value[key])]; }));
  };
  const result = structuredClone(payload);delete result.boundedContextProfile;
  for (const key of ['sourceRefs', 'sourceReview', 'sourceSelection']) if (result[key]) result[key] = expand(result[key]);
  return result;
}

export function validateAggregateChecks(items, result, observationField) {
  result = { ...structuredClone(result), checks: normalizedRows(result.checks, items) };
  const seen = uniqueRows(result.checks, items, 'aggregate check'); assert(seen.size === items.length, 'Incomplete aggregate review');
  assert(result[observationField]?.trim(), 'Missing aggregate source/teaching observation');
  for (const item of items) { const row = result.checks.find(row => row.where === item.where); bindOptionalHash(row, item.hash, item.where); assert(typeof row.accepted === 'boolean' && row.observation?.trim(), 'Incomplete aggregate observation: ' + item.where); }
  return result;
}

// Method reviewers need the actual problem and independently derived working,
// including examples for each method when a mixed-method item forms its own
// group. These examples are supporting evidence, not additional owned items.
export function methodMappingBatches(items, coverage, outcomes, context, options = {}) {
  const evidence = items.map(item => {
    const outcome = outcomes.find(row => row.where === item.where && row.hash === item.hash);
    const mapping = coverage.items.find(row => row.where === item.where && row.hash === item.hash);
    assert(outcome?.independentSolution?.trim() && outcome.observation?.trim() && mapping?.methods?.length, 'Missing actual independent method evidence: ' + item.where);
    return { where: item.where, hash: item.hash, kind: item.kind, value: { question: structuredClone(item.value), methods: mapping.methods, independentVerdict: outcome.verdict, independentSolution: outcome.independentSolution, independentObservation: outcome.observation } };
  });
  const groups = new Map();
  for (const row of evidence) { const key = JSON.stringify([...row.value.methods].sort()); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); }
  const jobs = [...groups.entries()].flatMap(([key, owned]) => {
    const ids = JSON.parse(key);
    const independentMethodExamples = evidence.filter(row => row.kind === 'example' && row.value.methods.some(id => ids.includes(id)));
    for (const id of ids) assert(independentMethodExamples.some(row => row.value.methods.includes(id)), 'Missing independently derived method example: ' + id);
    const describedIds = new Set([...ids, ...independentMethodExamples.flatMap(row => row.value.methods)]);
    return wholeItemBatches(owned, { ...context, requiredMethodIds: ids, methods: coverage.methods.filter(method => describedIds.has(method.id)), independentMethodExamples, methodEvidenceNote: 'Each owned question is the complete retained item, including every MCQ option and reason. Compare its actual independent working with its assigned methods. independentMethodExamples are unowned supporting examples with their complete questions, actual independent working, observations and verdicts; check only the owned items in your result.' }, options);
  });
  return { evidence, jobs };
}

// A diagnosed local budget refusal adds coordinator bookkeeping after the paid
// mathematical review succeeded. Reuse only that exact exception-bound change;
// substantive prior findings and every other payload byte must still match.
export function budgetDiagnosticReviewReuse(original, current, exceptions) {
  const messages = Object.entries(exceptions).filter(([, exception]) => exception.indivisible === true && exception.reason?.trim() && Number.isInteger(exception.failureVariableChars)).map(([where, exception]) => `Worker attempt failed; diagnose before retry: Indivisible oversized item ${where} (${exception.failureVariableChars} characters): explicit diagnosed exception required`);
  const omitted = (current.priorFindings || []).filter(message => messages.includes(message));
  if (!omitted.length || hashValue(original) === hashValue(current)) return null;
  const withoutDiagnostic = payload => ({ ...payload, priorFindings: (payload.priorFindings || []).filter(message => !messages.includes(message)) });
  if (hashValue(withoutDiagnostic(original)) !== hashValue(withoutDiagnostic(current))) return null;
  return { reason: 'Unchanged whole mathematical review; only an explicitly diagnosed coordinator budget refusal changed.', diagnosticHash: hashValue(omitted) };
}

export function validateOversizeExceptionBindings(state, snapshot, exceptions) {
  const items = assessmentItems(snapshot.content, snapshot.quiz, false);
  for (const [where, exception] of Object.entries(exceptions)) {
    // Legacy direct helper callers retain their existing explicit exception API.
    // Campaign-supplied exceptions additionally bind the accepted stage and item.
    if (exception.failureVariableChars !== undefined) assert(exception.stageHash !== undefined, 'Diagnosed review reuse needs current stage/item/source bindings');
    if (exception.stageHash !== undefined) {
      exactHash(exception.stageHash, state.stage?.hash, 'oversize stage');
      exactHash(exception.candidateHash, state.stage?.candidateHash, 'oversize candidate');
      exactHash(exception.candidateHash, hashValue({ content: snapshot.content, quiz: snapshot.quiz }), 'oversize snapshot');
      exactHash(exception.dependencyHash, state.stage?.dependencyHash, 'oversize dependencies');
      exactHash(exception.dependencyHash, state.owner.prepared.dependencyHash, 'oversize prepared dependencies');
      exactHash(exception.itemHash, items.find(item => item.where === where)?.hash, 'oversize owned item');
    }
  }
}

export function loadSourceEvidence(root, prepared, state, packets) {
  const file = prepared.sourceEvidencePath || state.owner.prepared.sourceEvidencePath;
  const evidence = file ? readJson(inside(root, file)) : [...new Map(packets.flatMap(packet => packet.sourceEvidence || []).map(source => [source.path + ':' + source.startLine + ':' + source.endLine, source])).values()];
  if (file) {
    exactHash(prepared.sourceEvidenceHash || state.owner.prepared.sourceEvidenceHash, hashValue(evidence), 'complete source evidence');
    for (const source of evidence) {
      const bytes = fs.readFileSync(inside(root, source.path)); exactHash(source.hash, hashValue(bytes), source.path);
      if (path.extname(source.path).toLowerCase() === '.md') {
        const lines = bytes.toString('utf8').split('\n'), raw = lines.slice((source.startLine || 1) - 1, source.endLine || lines.length).join('\n');
        const normalized = source.normalization === 'markdown-table-cell-padding-and-separator-runs-v1' ? raw.split('\n').map(line => line.trimStart().startsWith('|') ? line.split('|').map(cell => cell.trim().replace(/^(:?)-{3,}(:?)$/, '$1---$2')).join('|') : line).join('\n') : raw;
        assert(source.excerpt === normalized, 'Stale selected source excerpt: ' + source.path);
        if (source.rawExcerptHash) exactHash(source.rawExcerptHash, hashValue(raw), 'raw excerpt');
        if (source.excerptHash) exactHash(source.excerptHash, hashValue(normalized), 'normalized excerpt');
      }
      for (const image of source.images || []) exactHash(image.hash, hashValue(fs.readFileSync(inside(root, image.path))), 'source image ' + image.path);
      validateUnavailableImages(root, source);
    }
  }
  assert(evidence.length, 'No inline source evidence');
  for (const ref of prepared.sourceReferences || []) if (path.extname(ref.path).toLowerCase() === '.md') assert(evidence.some(source => source.path === ref.path && (!ref.startLine || source.startLine === ref.startLine) && (!ref.endLine || source.endLine === ref.endLine)), 'Selected source section absent inline: ' + ref.path);
  return evidence;
}

export async function runBoundedAssignment({ root, campaignId, prepared, state, runner = runAstraTask, onProgress = () => {}, out, concurrency = 3, maxVariableChars = VARIABLE_LIMIT, oversizeExceptions = {}, diagnosis = null } = {}) {
  rejectPrerequisiteReferencesForExternal(prepared, state, root);
  assert(Number.isInteger(concurrency) && concurrency >= 1 && concurrency <= 3, 'At most three actual bounded workers');
  assert(state.owner.role === 'author' || state.owner.role === 'review', 'Unknown bounded role');
  const executionProfile = assignmentExecutionProfile(state);
  const common = COMMON.replace('gpt-6.1-sol high, Standard', `gpt-6.1-sol ${executionProfile.effort}, Standard`);
  const snapshot = readJson(inside(root, state.owner.prepared.snapshotPath));
  const packets = prepared.packets.map(packet => readJson(inside(root, packet.path)));
  const previousReview = loadPreviousReview(root, prepared, state, packets);
  const sourceEvidence = loadSourceEvidence(root, prepared, state, packets);
  validateOversizeExceptionBindings(state, snapshot, oversizeExceptions);
  const selection = prepared.sourceReferences?.find(source => source.selection)?.selection;
  let base = { skillId: state.skillId, scope: state.scope, context: compactContext(packets[0].context), sourceEvidence: sourceEvidence.map(source => leanSource(source)), sourceRefs: prepared.sourceReferences?.map(source => leanSource(source, false)), ...(selection ? { sourceSelection: { path: selection.path, hash: selection.hash, status: 'candidate-only', hints: selection.hints } } : {}), priorFindings: state.pending || [] };
  const work = campaignPaths(root, campaignId || prepared.campaignId || state.campaignId).work;
  const cache = path.join(work, state.skillId, 'bounded-evidence');
  // Assignment output path identifies the campaign unambiguously for existing callers.
  const cacheDir = out ? path.join(path.dirname(path.dirname(out)), 'bounded-evidence') : cache;
  const attempts = [], authorSessions = new Set([state.stage?.authorSessionId, ...(state.stage?.authorSessionIds || []), ...(state.stage?.metrics?.sessions || [])].filter(Boolean));
  const role = state.owner.role;
  if (role === 'review') assert(state.owner.workerId !== state.stage.author, 'Review must use an independent author worker');
  async function call(kind, payload, validate, exception = null) {
    const variable = JSON.stringify(payload), chars = variable.length;
    if (chars > maxVariableChars) assert(exception?.indivisible && exception.reason?.trim(), `Indivisible oversized ${kind} context (${chars} characters): explicit diagnosed exception required`);
    if (exception?.kind !== undefined) assert(exception.kind === kind, 'Oversize exception belongs to a different job kind: ' + kind);
    const metadataInstruction = payload.boundedContextProfile === BOUNDED_CONTEXT_PROFILE ? METADATA_REFERENCE_INSTRUCTION : '';
    const inputHash = hashValue({ kind, payload, profile: executionProfile, common, contract: CONTRACTS[kind], ...(metadataInstruction ? { metadataInstruction } : {}) });
    const dir = path.join(cacheDir, inputHash); fs.mkdirSync(dir, { recursive: true });
    const previous = fs.readdirSync(dir).filter(name => name.endsWith('.json')).map(name => readJson(path.join(dir, name)));
    const reusable = previous.find(record => record.ok && record.inputHash === inputHash && (role !== 'review' || !authorSessions.has(record.metrics?.sessionId)));
    if (reusable) { const normalized = validate(reusable.result) || reusable.result; attempts.push({ ...reusable, reused: true }); return normalized; }
    if (kind === 'review' && Object.keys(oversizeExceptions).length) {
      for (const entry of fs.readdirSync(cacheDir, { withFileTypes: true }).filter(entry => entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name))) {
        for (const file of fs.readdirSync(path.join(cacheDir, entry.name)).filter(file => file.endsWith('.json'))) {
          const record = readJson(path.join(cacheDir, entry.name, file));
          if (!record.ok || record.kind !== 'review' || authorSessions.has(record.metrics?.sessionId) || !record.outputPath) continue;
          const ticketPath = inside(root, record.outputPath + '/ticket.json');
          if (!fs.existsSync(ticketPath)) continue;
          const ticket = readJson(ticketPath), reuse = budgetDiagnosticReviewReuse(ticket.payload, payload, oversizeExceptions);
          if (!reuse) continue;
          assert(typeof record.metrics?.sessionId === 'string' && record.metrics.sessionId.trim(), 'Original cached review needs a known independent session');
          exactHash(ticket.kind, kind, 'original cached review kind');
          if (hashValue(ticket.profile) !== hashValue(executionProfile)) continue; // Different execution settings retain their original cache.
          const originalHash = hashValue({ kind, payload: ticket.payload, profile: executionProfile, common, contract: CONTRACTS[kind] });
          exactHash(ticket.inputHash, originalHash, 'original cached review ticket'); exactHash(record.inputHash, originalHash, 'original cached review');
          const normalized = validate(record.result) || record.result;
          attempts.push({ ...record, reused: true, requestedInputHash: inputHash, budgetDiagnosticReuse: reuse });
          return normalized;
        }
      }
    }
    const failures = previous.filter(record => !record.ok && record.externalModelCalls !== 0 && record.metrics?.externalModelCalls !== 0);
    if (failures.length >= 2) assert(diagnosis?.reason?.trim() && diagnosis.failuresHash === hashValue(failures.map(record => record.attemptId)), 'Diagnose repeated bounded failure before a third attempt');
    const attemptId = randomUUID(), attemptOut = path.join(out || cacheDir, kind + '-' + attemptId);
    const ticket = { attemptId, inputHash, kind, profile: executionProfile, variableChars: chars, budgetException: exception, diagnosis, payload };
    writeOnce(path.join(attemptOut, 'ticket.json'), ticket);
    const prompt = common + '\n' + CONTRACTS[kind] + metadataInstruction + '\nRequired hashes use SHA-256 of JSON.stringify(value), UTF-8. Supplied hashes are exact.\n' + variable;
    writeOnce(path.join(attemptOut, 'prompt.txt'), prompt);
    let reply;
    try {
      const deliveredSources = [...(payload.sourceEvidence || []), ...(payload.items || []).filter(item => item.kind === 'source').map(item => item.value)];
      reply = await runner({ cwd: root, runDir: work, prompt, images: [...new Set(deliveredSources.flatMap(source => source.images || []).map(image => inside(root, typeof image === 'string' ? image : image.path)))], out: attemptOut, profile: role === 'author' ? 'transcription' : 'review', configuration: campaignRunnerConfiguration(executionProfile), stage: 'content-bounded-' + kind, onProgress });
      writeOnce(path.join(attemptOut, 'result.json'), reply.result);
      assert(!reply.result?.blocker && !reply.result?.blocked, 'Worker blocker: ' + (reply.result?.blocker || reply.result?.blocked));
      assert(!reply.metrics?.observedModel || reply.metrics.observedModel === CAMPAIGN_PROFILE.model, 'Unexpected bounded worker model');
      assert(!reply.metrics?.effort || reply.metrics.effort === executionProfile.effort, 'Unexpected bounded reasoning effort');
      assert(!reply.metrics?.serviceTier || reply.metrics.serviceTier === 'default', 'Unexpected bounded service tier');
      if (role === 'review') assert(!authorSessions.has(reply.metrics?.sessionId), 'Review must use independent author sessions');
      const normalized = validate(reply.result) || reply.result;
      writeOnce(path.join(attemptOut, 'normalized-result.json'), normalized);
      const record = { attemptId, inputHash, kind, ok: true, result: normalized, metrics: reply.metrics || null, outputPath: relative(root, attemptOut) };
      writeOnce(path.join(dir, attemptId + '.json'), record); attempts.push(record); return normalized;
    } catch (error) {
      const record = { attemptId, inputHash, kind, ok: false, error: error.message, metrics: reply?.metrics || error.metrics || null, ...(error.externalModelCalls === 0 ? { externalModelCalls: 0 } : {}), outputPath: relative(root, attemptOut) };
      writeOnce(path.join(dir, attemptId + '.json'), record); attempts.push(record); error.boundedAttempts = attempts; error.metrics = aggregateMetrics(attempts, executionProfile); throw error;
    }
  }
  async function pool(jobs, execute) {
    const results = new Array(jobs.length); let next = 0, failure = null;
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => { while (next < jobs.length && !failure) { const index = next++; try { results[index] = await execute(jobs[index]); } catch (error) { failure ||= error; } } }));
    if (failure) { failure.boundedAttempts = attempts; failure.metrics = aggregateMetrics(attempts, executionProfile); throw failure; } return results;
  }
  try {
  let sourceContextReplies = [];
  const planningTheory = theoryContext(snapshot.content.theory);
  if (JSON.stringify({ ...base, theory: { value: planningTheory, hash: hashValue(planningTheory) } }).length > maxVariableChars - 1500) {
    const sourceItems = base.sourceEvidence.map((source, index) => ({ where: `source[${index}]`, kind: 'source', hash: hashValue(source), value: source }));
    // Borrowed booklet sections need the actual governing stage text, even when
    // that small syllabus section is owned by another bounded reading job.
    // Keep it as supplementary evidence, without duplicating ownership checks.
    const governingEvidence = base.sourceEvidence.filter(source => source.path.replaceAll('\\', '/').toLowerCase() === `syllabus/stage ${state.scope.stage} content.md`);
    const sourceJobs = wholeItemBatches(sourceItems, { ...base, sourceEvidence: governingEvidence, theory: planningTheory, role, ...(role === 'review' ? { candidateMethods: state.stage.coverage.methods } : {}) }, { maxVariableChars, oversizeExceptions });
    sourceContextReplies = await pool(sourceJobs, job => call('source-context', job, reply => {
      const checked = validateAggregateChecks(job.items, reply, 'theoryObservation');
      for (const row of checked.checks) { assert(['direct', 'indirect'].includes(row.support) && row.locator?.trim() && row.adjustments?.trim() && Array.isArray(row.methods), 'Incomplete source-context check'); if (state.scope.stage === 3 && job.items.find(item => item.where === row.where).value.path.toLowerCase() !== 'syllabus/stage 3 content.md') assert(row.support === 'indirect', 'Stage 3 borrowed source-context support must be indirect'); }
      return checked;
    }, job.budgetException));
    const checks = sourceContextReplies.flatMap(reply => reply.checks);
    validateAggregateChecks(sourceItems, { checks, theoryObservation: 'Every selected source section was checked in a bounded job.' }, 'theoryObservation');
    assert(checks.every(check => check.accepted) && !sourceContextReplies.some(reply => reply.findings?.length), 'Required source-context repair remains; inspect retained bounded source checks');
    base = { ...base, sourceEvidence: [], sourceContextReviews: checks.map(check => ({ ...check, source: sourceItems.find(item => item.where === check.where).value.path, sourceHash: sourceItems.find(item => item.where === check.where).value.hash })) };
  }
  let result;
  if (role === 'author') {
    const originalTheory = theoryContext(snapshot.content.theory);
    const plan = await call('plan', { ...base, theory: { value: originalTheory, hash: hashValue(originalTheory) } }, reply => {
      assert(reply.methods?.length && reply.sourceReview?.length, 'Incomplete source/method plan'); if (reply.theoryPatch) exactHash(reply.theoryPatch.beforeHash, hashValue(originalTheory), 'theory');
      const normalized = structuredClone(reply);
      for (const ref of normalized.sourceReview) {
        const candidates = sourceEvidence.filter(source => source.path === ref.path && (!ref.startLine || source.startLine === ref.startLine) && (!ref.endLine || source.endLine === ref.endLine));
        assert(candidates.length === 1, 'Missing/ambiguous selected source section: ' + ref.path); const source = candidates[0]; bindOptionalHash(ref, source.hash, ref.path); ref.startLine = source.startLine; ref.endLine = source.endLine;
        if (source.unavailableImages?.length) {
          assert(Array.isArray(ref.unavailableImages), 'Plan omitted unavailable-illustration decisions');
          ref.unavailableImages = ref.unavailableImages.map(gap => ({ ...structuredClone(source.unavailableImages.find(declared => declared.path === gap.path) || {}), ...gap }));
          for (const gap of source.unavailableImages) assert(ref.unavailableImages.some(accepted => unavailableImageDecisionHash(accepted) === unavailableImageDecisionHash(gap)), 'Plan changed/omitted unavailable-illustration decision');
        }
        validateUnavailableImages(root, ref, { requireAccepted: true });
      }
      for (const source of sourceEvidence) assert(normalized.sourceReview.some(ref => ref.path === source.path && ref.startLine === source.startLine && ref.endLine === source.endLine), 'Plan omitted selected source section: ' + source.path);
      return normalized;
    }, oversizeExceptions.theory);
    const theory = plan.theoryPatch?.value || originalTheory;
    assert(theory && !theory.workedExample && !theory.workedExamples, 'Plan cannot own examples');
    const items = assessmentItems(snapshot.content, snapshot.quiz, false).filter(item => item.kind !== 'example').map(item => ({ ...item, ...(item.kind === 'quiz' ? { quizIndex: snapshot.quiz.questions.findIndex(question => question.id === item.value.id) } : {}), ...(previousReview?.outcomes?.some(row => row.where === item.where) ? { priorReview: previousReview.outcomes.find(row => row.where === item.where) } : {}) }));
    const priorReview = previousReview && { ...previousReview, outcomes: undefined };
    const authorContext = context => compactAuthorSourceContext(context, state.owner.prepared.boundedContextProfile, sourceEvidence);
    const jobs = wholeItemBatches(items, authorContext({ ...base, theory, methods: plan.methods, sourceReview: plan.sourceReview, ...(priorReview ? { priorReview } : {}) }), { maxVariableChars, oversizeExceptions });
    const authored = await pool(jobs, async job => ({ items: job.items, result: await call('author', job, reply => validateAssessmentBatch(job.items, reply), job.budgetException) }));
    const assembled = applyAssessmentPatches(snapshot, authored);
    const methods = new Map(plan.methods.map(method => [method.id, method]));
    for (const method of assembled.methods) { if (methods.has(method.id)) assert(hashValue(methods.get(method.id)) === hashValue(method), 'Conflicting planned method: ' + method.id); methods.set(method.id, method); }
    const finalMethods = [...methods.values()], existingExamples = assessmentItems(snapshot.content, snapshot.quiz, false).filter(item => item.kind === 'example').map(item => {
      const priorReview = state.owner.prepared.previousReviewProfile && previousReview?.outcomes?.find(row => row.where === item.where);
      return priorReview ? { ...item, priorReview } : item;
    });
    const requiredMethodIds = [...new Set(assembled.coverage.flatMap(row => row.methods))];
    const examplePayload = authorContext({ ...base, theory, methods: finalMethods, requiredMethodIds, sourceReview: plan.sourceReview, existingExamples });
    let exampleReply;
    if (JSON.stringify(examplePayload).length <= maxVariableChars) {
      exampleReply = await call('examples', examplePayload, reply => {
        assertMethodCoverage({ ...assembled.content, theory: { ...theory, workedExamples: reply.examples } }, assembled.quiz, { methods: finalMethods, items: [...assembled.coverage, ...reply.coverage] }); return validateExampleResult(reply, existingExamples, finalMethods);
      });
    } else {
      // Existing examples and missing methods are divisible work, never a reason
      // to authorize an oversized full collection or repeat a full pair response.
      const existingJobs = wholeItemBatches(existingExamples, authorContext({ ...base, theory, methods: finalMethods, requiredMethodIds: [], sourceReview: plan.sourceReview, phase: 'retain-existing' }), { maxVariableChars, oversizeExceptions });
      const retained = await pool(existingJobs, job => call('examples', job, reply => validateExampleResult(reply, job.items, finalMethods), job.budgetException));
      const retainedAggregate = aggregateExampleBatches(retained, finalMethods), covered = new Set(retainedAggregate.coverage.flatMap(row => row.methods));
      const missingMethods = finalMethods.filter(method => requiredMethodIds.includes(method.id) && !covered.has(method.id));
      const additions = await pool(missingMethods, method => call('examples', authorContext({ ...base, theory, methods: [method], requiredMethodIds: [method.id], sourceReview: plan.sourceReview, existingExamples: [], phase: 'cover-missing' }), reply => {
        const merged = validateExampleResult(reply, [], finalMethods); assert(merged.coverage.some(row => row.methods.includes(method.id)), 'Missing assigned method example: ' + method.id); return merged;
      }, oversizeExceptions['method.' + method.id]));
      exampleReply = aggregateExampleBatches([...retained, ...additions], finalMethods);
    }
    assembled.content.theory = { ...theory, workedExamples: exampleReply.examples };
    const coverage = assertMethodCoverage(assembled.content, assembled.quiz, { methods: finalMethods, items: [...assembled.coverage, ...exampleReply.coverage] });
    const removals = [...assembled.removals, ...(exampleReply.removals || [])].map(removal => {
      const original = state.stage?.baselineDispositions?.find(disposition => disposition.finalWhere === removal.where && disposition.finalHash === removal.hash);
      return original ? { ...removal, where: original.where, hash: original.hash } : removal;
    });
    result = { candidateContent: assembled.content, candidateQuiz: assembled.quiz, coverage, sourceReview: plan.sourceReview, removals: [...(state.stage?.removals || []), ...removals], substantiveCorrections: [...(plan.substantiveCorrections || []), ...assembled.substantiveCorrections, ...(exampleReply.substantiveCorrections || [])] };
  } else {
    const items = assessmentItems(snapshot.content, snapshot.quiz, false).map(item => item.kind === 'quiz' ? { ...item, quizIndex: snapshot.quiz.questions.findIndex(question => question.id === item.value.id) } : item), examples = items.filter(item => item.kind === 'example'), coverage = state.stage.coverage;
    assertMethodCoverage(snapshot.content, snapshot.quiz, coverage);
    const context = { ...base, theory: snapshot.content.theory, coverage, examples };
    // Each whole-item review carries only the methods/examples it actually depends
    // on; the separate global review verifies complete coverage and theory.
    const groups = new Map(), reusedReviews = [];
    for (const item of items) {
      const stagedEvidence = state.stage.reusedOutcomes?.find(outcome => outcome.where === item.where && outcome.hash === item.hash && outcome.verdict === 'accepted');
      if (stagedEvidence) { const reused = { outcomes: [structuredClone(stagedEvidence)], findings: [], flaggedDiagrams: [] }; validateBatchReview([item], reused); reusedReviews.push(reused); continue; }
      const dependencyHash = reviewDependencyHash(item, context), itemDir = path.join(cacheDir, 'items', dependencyHash);
      const previous = fs.existsSync(itemDir) ? fs.readdirSync(itemDir).filter(name => name.endsWith('.json')).map(name => readJson(path.join(itemDir, name))) : [];
      const prior = previous.find(record => record.dependencyHash === dependencyHash && record.outcome.verdict === 'accepted' && !authorSessions.has(record.metrics?.sessionId));
      if (prior) {
        const reused = { outcomes: [prior.outcome], findings: [], flaggedDiagrams: prior.flaggedDiagrams || [] }; validateBatchReview([item], reused); reusedReviews.push(reused);
        attempts.push({ attemptId: prior.attemptId, kind: 'review-item', ok: true, reused: true, inputHash: dependencyHash, metrics: prior.metrics, outputPath: prior.outputPath }); continue;
      }
      const key = JSON.stringify([...coverage.items.find(row => row.where === item.where).methods].sort()); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item);
    }
    const jobs = [...groups.entries()].flatMap(([key, owned]) => {
      const ids = JSON.parse(key);
      return wholeItemBatches(owned, { ...base, theory: theoryContext(snapshot.content.theory), methods: coverage.methods.filter(method => ids.includes(method.id)) }, { maxVariableChars, oversizeExceptions });
    });
    const reviewed = [...reusedReviews, ...await pool(jobs, async job => {
      const reply = await call('review', job, result => validateBatchReview(job.items, result), job.budgetException);
      const record = attempts.findLast(record => record.kind === 'review' && (record.requestedInputHash || record.inputHash) === hashValue({ kind: 'review', payload: job, profile: executionProfile, common, contract: CONTRACTS.review }));
      if (!(reply.findings || []).length) for (const item of job.items) {
        const outcome = reply.outcomes.find(row => row.where === item.where); if (outcome.verdict !== 'accepted') continue;
        const dependencyHash = reviewDependencyHash(item, context), itemFile = path.join(cacheDir, 'items', dependencyHash, record.attemptId + '.json');
        if (!fs.existsSync(itemFile)) writeOnce(itemFile, { dependencyHash, outcome, attemptId: record.attemptId, metrics: record.metrics, outputPath: record.outputPath, flaggedDiagrams: (reply.flaggedDiagrams || []).filter(field => field.startsWith(item.where)) });
      }
      return reply;
    })];
    const baseline = readJson(inside(root, state.stage.baselinePath));
    const coverageSummary = { methods: coverage.methods, items: coverage.items.map(({ where, methods }) => ({ where, methods })) };
    const allOutcomes = reviewed.flatMap(reply => reply.outcomes), independentExampleReviews = allOutcomes.filter(outcome => examples.some(example => example.where === outcome.where));
    const theoryBase = { ...base, theory: theoryContext(snapshot.content.theory), beforeTheory: theoryContext(baseline.content.theory) };
    const imageDecisions = state.stage.sourceReview?.flatMap((source, sourceIndex) => (source.unavailableImages || []).map(gap => ({ sourceIndex, sourcePath: source.path, imagePath: gap.path, decisionHash: unavailableImageDecisionHash(gap), ...gap }))) || [];
    if (imageDecisions.length) theoryBase.unavailableImageDecisions = imageDecisions;
    const fullTheoryPayload = { ...theoryBase, coverage: coverageSummary, examples, independentExampleReviews, dependentHeaders: headerEvidence(items) };
    let theoryReply, aggregateReplies = [];
    const validateTheory = reply => {
      assert(reply.theoryObservation?.trim() && reply.sourceObservation?.trim(), 'Missing theory/source review');
      if (imageDecisions.length) {
        assert(Array.isArray(reply.sourceImageReviews) && reply.sourceImageReviews.length === imageDecisions.length, 'Every unavailable illustration needs independent review');
        for (const decision of imageDecisions) {
          const matches = reply.sourceImageReviews.filter(review => review.sourceIndex === decision.sourceIndex && review.imagePath === decision.imagePath);
          assert(matches.length === 1 && typeof matches[0].accepted === 'boolean' && matches[0].observation?.trim(), 'Incomplete unavailable-illustration review');
          if (matches[0].decisionHash !== undefined) exactHash(matches[0].decisionHash, decision.decisionHash, 'unavailable-illustration decision'); matches[0].decisionHash = decision.decisionHash;
        }
      }
    };
    if (JSON.stringify(fullTheoryPayload).length <= maxVariableChars) theoryReply = await call('review-theory', fullTheoryPayload, validateTheory);
    else {
      const headerRows = headerEvidence(items).map(row => ({ where: row.where, hash: row.hash, kind: 'headers', value: { relevantTheory: row.relevantTheory, headers: row.headers } }));
      const headerJobs = wholeItemBatches(headerRows, theoryBase, { maxVariableChars, oversizeExceptions });
      const headerReplies = await pool(headerJobs, job => call('review-headers', job, reply => validateAggregateChecks(job.items, reply, 'theoryObservation'), job.budgetException));
      const headerChecks = headerReplies.flatMap(reply => reply.checks); validateAggregateChecks(headerRows, { checks: headerChecks, theoryObservation: 'Every final header was independently checked.' }, 'theoryObservation');
      const { evidence: coverageRows, jobs: mappingJobs } = methodMappingBatches(items, coverage, allOutcomes, { ...base, theory: theoryBase.theory }, { maxVariableChars, oversizeExceptions });
      const mappingReplies = await pool(mappingJobs, job => call('review-coverage', job, reply => validateAggregateChecks(job.items, reply, 'sourceObservation'), job.budgetException));
      const mappingChecks = mappingReplies.flatMap(reply => reply.checks); validateAggregateChecks(coverageRows, { checks: mappingChecks, sourceObservation: 'Every final method assignment and independent example solution was checked.' }, 'sourceObservation');
      aggregateReplies = [...headerReplies, ...mappingReplies];
      const failedChecks = [...headerChecks, ...mappingChecks].filter(check => !check.accepted);
      const certificate = { coverageHash: hashValue(coverage), headerEvidenceHash: hashValue(headerRows), mappingEvidenceHash: hashValue(coverageRows), itemCount: items.length, exampleCount: examples.length, methodCount: coverage.methods.length, headerChecks: headerChecks.length, mappingChecks: mappingChecks.length, rejectedChecks: failedChecks.length, independentReviewEvidenceHash: hashValue(aggregateReplies) };
      const methodSummary = coverage.methods.map(method => ({ id: method.id, assessedCount: items.filter(item => item.kind !== 'example' && coverage.items.find(row => row.where === item.where).methods.includes(method.id)).length, exampleCount: examples.filter(item => coverage.items.find(row => row.where === item.where).methods.includes(method.id)).length }));
      theoryReply = await call('review-theory-source', { ...theoryBase, reviewPhase: 'source-theory-after-independent-item-header-and-mapping-review', methods: coverage.methods, aggregateReview: certificate, methodCoverageCounts: methodSummary, rejectedAggregateChecks: failedChecks }, validateTheory, oversizeExceptions.theory);
      theoryReply = { ...theoryReply, findings: [...(theoryReply.findings || []), ...failedChecks.map(check => ({ description: check.where + ': aggregate method/header repair: ' + check.observation }))] };
      if (failedChecks.length && theoryReply.stepsRepair) theoryReply.stepsRepair.accepted = false;
    }
    const removed = (state.stage.removals || []).map(removal => { const item = assessmentItems(baseline.content, baseline.quiz, false).find(item => item.where === removal.where && item.hash === removal.hash); assert(item, 'Stale removed original item'); return { ...item, ...(item.kind === 'quiz' ? { quizIndex: baseline.quiz.questions.findIndex(question => question.id === item.value.id) } : {}), removalReason: removal.reason }; });
    const removalJobs = wholeItemBatches(removed, { ...base, theory: theoryContext(snapshot.content.theory) }, { maxVariableChars, oversizeExceptions });
    const removals = await pool(removalJobs, job => call('review-removals', job, reply => {
      const rows = normalizedRows(reply.removals, job.items), seen = uniqueRows(rows, job.items, 'removal review'); assert(seen.size === job.items.length, 'Missing removed item review');
      for (const item of job.items) { const row = rows.find(row => row.where === item.where); bindOptionalHash(row, item.hash, item.where); assert(typeof row.accepted === 'boolean' && row.observation?.trim() && row.independentSolution?.trim(), 'Incomplete removal review'); }
      const checked = validateBatchReview(job.items, { outcomes: rows.map(row => ({ ...row, verdict: 'repair' })) });
      return { ...reply, removals: checked.outcomes.map(({ verdict, ...row }) => row) };
    }, job.budgetException));
    result = { stageHash: state.stage.hash, outcomes: reviewed.flatMap(reply => reply.outcomes), theoryObservation: theoryReply.theoryObservation, sourceObservation: theoryReply.sourceObservation, ...(imageDecisions.length ? { sourceImageReviews: theoryReply.sourceImageReviews } : {}), findings: [...reviewed, ...aggregateReplies, theoryReply, ...removals].flatMap(reply => reply.findings || []), flaggedDiagrams: [...new Set([...(state.stage.inheritedVisualFlags || []), ...[...reviewed, ...aggregateReplies, theoryReply, ...sourceContextReplies].flatMap(reply => reply.flaggedDiagrams || [])])], removals: removals.flatMap(reply => reply.removals), ...(theoryReply.stepsRepair ? { stepsRepair: { ...theoryReply.stepsRepair, beforeHash: hashValue(baseline.content.theory), candidateHash: hashValue({ content: snapshot.content, quiz: snapshot.quiz }) } } : {}) };
    validateBatchReview(items, result);
  }
  return { result, metrics: aggregateMetrics(attempts, executionProfile), attempts };
  } catch (error) { error.boundedAttempts = attempts; error.metrics = aggregateMetrics(attempts, executionProfile); throw error; }
}

export function aggregateMetrics(attempts, executionProfile = CAMPAIGN_PROFILE) {
  const paid = attempts.filter(attempt => !attempt.reused && attempt.externalModelCalls !== 0 && attempt.metrics?.externalModelCalls !== 0), sessions = [...new Set(attempts.map(attempt => attempt.metrics?.sessionId).filter(Boolean))];
  return { ...executionProfile, serviceTier: 'default', provider: 'bounded-codex', sessionId: sessions[0] || null, sessions, workerCalls: paid.length, reusedCalls: attempts.filter(attempt => attempt.reused).length, undispatchedCalls: attempts.filter(attempt => !attempt.reused && (attempt.externalModelCalls === 0 || attempt.metrics?.externalModelCalls === 0)).length, usage: null, availableUsage: paid.map(attempt => ({ attemptId: attempt.attemptId, sessionId: attempt.metrics?.sessionId || null, usage: attempt.metrics?.usage ?? null })), boundedAttempts: attempts.map(({ result, ...record }) => record) };
}
