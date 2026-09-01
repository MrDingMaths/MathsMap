import { createHash } from 'node:crypto';
import { lintMathString, validateInlineText } from '../lib/lint-math.mjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const MAX_QUESTIONS_PER_SKILL = 20;
export const MAX_PER_STRUCTURE_CASE = 2;
export const PRODUCTION_QUESTION_KEYS = Object.freeze([
  'id',
  'question_text',
  'structure',
  'mastery',
  'options',
  'solution_text',
]);

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'calculate', 'determine',
  'evaluate', 'find', 'for', 'from', 'given', 'in', 'is', 'it', 'of', 'on',
  'or', 'show', 'that', 'the', 'then', 'to', 'use', 'using', 'what', 'which',
  'with', 'write', 'your',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pushStringError(errors, value, label, { optional = false } = {}) {
  if (optional && value === undefined) return;
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${label} must be a non-empty string`);
  }
}

function getTranscription(candidate) {
  return candidate?.transcription ?? candidate?.draft;
}

function getMeaningfulCase(candidate) {
  const transcription = getTranscription(candidate);
  return candidate?.meaningfulCase ?? transcription?.meaningfulCase ?? transcription?.case ?? '';
}

export function validateProductionQuestion(question, { exactKeys = false } = {}) {
  const errors = [];
  if (!isObject(question)) return { valid: false, errors: ['question must be an object'] };

  if (exactKeys) {
    const expected = new Set(PRODUCTION_QUESTION_KEYS);
    for (const key of Object.keys(question)) {
      if (!expected.has(key)) errors.push(`question.${key} is not a production question key`);
    }
    for (const key of expected) {
      if (!(key in question)) errors.push(`question.${key} is required`);
    }
  }

  pushStringError(errors, question.id, 'question.id');
  pushStringError(errors, question.question_text, 'question.question_text');
  pushStringError(errors, question.structure, 'question.structure');
  pushStringError(errors, question.solution_text, 'question.solution_text');
  if (typeof question.mastery !== 'boolean') errors.push('question.mastery must be a boolean');

  if (!Array.isArray(question.options) || question.options.length < 3 || question.options.length > 5) {
    errors.push('question.options must contain 3 to 5 options');
  } else {
    let correct = 0;
    question.options.forEach((option, index) => {
      if (!isObject(option)) {
        errors.push(`question.options[${index}] must be an object`);
        return;
      }
      pushStringError(errors, option.text, `question.options[${index}].text`);
      if (option.correct === true) {
        correct += 1;
        if ('why' in option) errors.push(`question.options[${index}] correct option must not have why`);
      } else if (typeof option.why !== 'string' || option.why.trim().length < 15) {
        errors.push(`question.options[${index}].why must name a specific misconception (15+ characters)`);
      }
    });
    if (correct !== 1) errors.push(`question.options must contain exactly one correct option (found ${correct})`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a local candidate at one of the pipeline boundaries.
 * capture: source/screenshot metadata; draft: + transcription; ready: + checker and two mapper reports.
 */
export function validateCandidate(candidate, { phase = 'draft' } = {}) {
  const errors = [];
  if (!isObject(candidate)) return { valid: false, errors: ['candidate must be an object'] };
  if (!['capture', 'draft', 'ready'].includes(phase)) errors.push(`unknown validation phase "${phase}"`);

  if (!isObject(candidate.source)) {
    errors.push('source must be an object');
  } else {
    pushStringError(errors, candidate.source.id, 'source.id');
    pushStringError(errors, candidate.source.url, 'source.url');
    if (!Array.isArray(candidate.source.categoryPath) || candidate.source.categoryPath.some((part) => typeof part !== 'string' || !part.trim())) {
      errors.push('source.categoryPath must be an array of non-empty strings');
    }
    pushStringError(errors, candidate.source.pngPath, 'source.pngPath');
    if (typeof candidate.source.pngSha256 !== 'string' || !/^[a-f\d]{64}$/i.test(candidate.source.pngSha256)) {
      errors.push('source.pngSha256 must be a 64-character SHA-256 hex digest');
    }
    if (phase === 'ready' && candidate.source.licence?.permissionConfirmed !== true) {
      errors.push('source.licence.permissionConfirmed must be true before publication review');
    }
  }

  if (phase !== 'capture') {
    const transcription = getTranscription(candidate);
    if (!isObject(transcription)) {
      errors.push('transcription must be an object');
    } else {
      const productionDraft = { id: stableQuestionId(candidate.source?.id ?? ''), ...transcription };
      const result = validateProductionQuestion(productionDraft);
      errors.push(...result.errors.filter((error) => error !== 'question.id must be a non-empty string').map((error) => error.replace(/^question\./, 'transcription.')));
      if (transcription.uncertainties !== undefined && !Array.isArray(transcription.uncertainties)) {
        errors.push('transcription.uncertainties must be an array when supplied');
      }
    }
  }

  if (phase === 'ready') {
    const checker = candidate.checker ?? candidate.review?.checker;
    if (!isObject(checker) || checker.transcriptionMatch !== true || checker.answerMatch !== true) {
      errors.push('checker must confirm transcriptionMatch and answerMatch');
    }
    const reports = getMapperReports(candidate);
    if (reports.length !== 2) errors.push('mapping must contain exactly two mapper reports');
    reports.forEach((report, index) => {
      if (!isObject(report)) {
        errors.push(`mapping mapper ${index + 1} must be an object`);
        return;
      }
      pushStringError(errors, report.skillId, `mapping mapper ${index + 1}.skillId`);
      if (!Number.isFinite(report.score) || report.score < 0 || report.score > 100) {
        errors.push(`mapping mapper ${index + 1}.score must be between 0 and 100`);
      }
      if (!Number.isFinite(report.runnerUpScore) || report.runnerUpScore < 0 || report.runnerUpScore > 100) {
        errors.push(`mapping mapper ${index + 1}.runnerUpScore must be between 0 and 100`);
      }
      if (report.atomic !== true && report.isAtomic !== true) {
        errors.push(`mapping mapper ${index + 1} must confirm atomic:true`);
      }
      if (report.flags !== undefined && !Array.isArray(report.flags)) {
        errors.push(`mapping mapper ${index + 1}.flags must be an array`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

export function stableQuestionId(sourceId) {
  const raw = String(sourceId ?? '').trim();
  if (!raw) throw new Error('sourceId is required');
  const safe = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  if (!safe) return `dq-${sha256(raw).slice(0, 12)}`;
  if (safe === raw.toLowerCase()) return `dq-${safe}`;
  return `dq-${safe}-${sha256(raw).slice(0, 8)}`;
}

export function canonicalizeText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, ' [diagram] ')
    .replace(/\\(?:left|right|,|;|!|quad|qquad)\b/g, ' ')
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*([=+\-*/^(),.:%<>])\s*/g, '$1')
    .trim();
}

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function canonicalQuestion(questionOrCandidate) {
  const question = getTranscription(questionOrCandidate) ?? questionOrCandidate ?? {};
  const options = Array.isArray(question.options) ? question.options.map((option) => canonicalizeText(option?.text)).sort() : [];
  return canonicalizeText(`${question.question_text ?? ''}\n${options.join('\n')}`);
}

function canonicalStem(questionOrCandidate) {
  const question = getTranscription(questionOrCandidate) ?? questionOrCandidate ?? {};
  return canonicalizeText(question.question_text ?? '');
}

export function questionHash(questionOrCandidate) {
  return sha256(canonicalQuestion(questionOrCandidate));
}

function words(value) {
  return canonicalizeText(value)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(' ')
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function ngrams(value, n = 3) {
  const compact = canonicalizeText(value).replace(/\s+/g, ' ');
  if (compact.length <= n) return compact ? new Set([compact]) : new Set();
  const result = new Set();
  for (let i = 0; i <= compact.length - n; i += 1) result.add(compact.slice(i, i + n));
  return result;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / (a.size + b.size - intersection || 1);
}

/**
 * Everything `semanticSimilarity` needs about one side of a comparison. Hoisted
 * out so a candidate is canonicalised once instead of once per existing item:
 * the corpus is ~26,000 questions and cards.
 */
export function prepareForSimilarity(questionOrCandidate) {
  const canonical = canonicalQuestion(questionOrCandidate);
  const stem = canonicalStem(questionOrCandidate);
  return {
    canonical,
    words: new Set(words(canonical)),
    trigrams: ngrams(canonical),
    stem,
    stemWords: stem ? new Set(words(stem)) : new Set(),
    stemTrigrams: stem ? ngrams(stem) : new Set(),
  };
}

function similarityBetween(left, right) {
  if (left.canonical === right.canonical) return 1;
  const fullScore = 0.6 * jaccard(left.words, right.words) + 0.4 * jaccard(left.trigrams, right.trigrams);
  const stemScore = left.stem && right.stem
    ? 0.6 * jaccard(left.stemWords, right.stemWords) + 0.4 * jaccard(left.stemTrigrams, right.stemTrigrams)
    : 0;
  return Math.max(0, Math.min(1, Math.max(fullScore, stemScore)));
}

export function semanticSimilarity(left, right) {
  return similarityBetween(prepareForSimilarity(left), prepareForSimilarity(right));
}

function normaliseExisting(entry, skillId) {
  if (entry?.question) return { ...entry, skillId: entry.skillId ?? skillId, question: entry.question };
  return { skillId, question: entry };
}

/**
 * Flattens one existing quiz question or practice card into the shape the
 * duplicate scan compares against, with its canonical forms already computed.
 * Building this once per corpus turns the scan from O(candidates x corpus)
 * canonicalisations into O(corpus).
 */
export function prepareExistingEntry(raw) {
  const entry = normaliseExisting(raw, raw?.skillId);
  const question = entry.question ?? {};
  const canonical = canonicalQuestion(question);
  return {
    skillId: entry.skillId,
    questionId: question.id,
    sourceId: String(entry.sourceId ?? entry.source?.id ?? ''),
    pngSha256: String(entry.pngSha256 ?? entry.source?.pngSha256 ?? '').toLowerCase(),
    canonical,
    hash: canonical ? sha256(canonical) : '',
    similarity: prepareForSimilarity(question),
  };
}

export function prepareExistingEntries(existing = []) {
  return existing.map(prepareExistingEntry);
}

/** Exact checks are source id, PNG digest, production id, and canonical stem/options digest. */
export function findDuplicates(candidate, existing = [], { nearThreshold = 0.9, preparedExisting } = {}) {
  const sourceId = String(candidate?.source?.id ?? '');
  const pngSha256 = candidate?.source?.pngSha256?.toLowerCase();
  const id = stableQuestionId(sourceId);
  const hash = questionHash(candidate);
  const candidateSimilarity = prepareForSimilarity(candidate);
  const entries = preparedExisting ?? prepareExistingEntries(existing);
  const exact = [];
  const near = [];

  for (const entry of entries) {
    const reasons = [];
    if (sourceId && entry.sourceId === sourceId) reasons.push('source_id');
    if (pngSha256 && entry.pngSha256 === pngSha256) reasons.push('png_sha256');
    if (entry.questionId === id) reasons.push('production_id');
    if (entry.canonical && entry.hash === hash) reasons.push('canonical_question');
    if (reasons.length) {
      exact.push({ skillId: entry.skillId, questionId: entry.questionId, reasons });
      continue;
    }
    const similarity = similarityBetween(candidateSimilarity, entry.similarity);
    if (similarity >= nearThreshold) near.push({ skillId: entry.skillId, questionId: entry.questionId, similarity });
  }
  near.sort((a, b) => b.similarity - a.similarity);
  return { duplicate: exact.length > 0 || near.length > 0, exact, near };
}

export function buildSkillIndex({ skills = [], dotpoints = [], topics = [], courses = [], quizzes = {} }) {
  const dotpointById = new Map(dotpoints.map((item) => [item.id, item]));
  const topicById = new Map(topics.map((item) => [item.id, item]));
  const courseById = new Map(courses.map((item) => [item.id, item]));
  const dependants = new Map(skills.map((skill) => [skill.id, []]));
  for (const skill of skills) {
    for (const prereq of skill.prereqs ?? []) dependants.get(prereq)?.push(skill.id);
  }

  const topicIdsBySkill = new Map();
  for (const skill of skills) {
    topicIdsBySkill.set(skill.id, [...new Set((skill.dotPointIds ?? []).map((id) => dotpointById.get(id)?.topicId).filter(Boolean))]);
  }

  return skills.map((skill) => {
    const topicIds = topicIdsBySkill.get(skill.id) ?? [];
    const topicIdSet = new Set(topicIds);
    const siblingIds = skills
      .filter((other) => other.id !== skill.id && (topicIdsBySkill.get(other.id) ?? []).some((id) => topicIdSet.has(id)))
      .map((other) => other.id);
    const dotPointTexts = (skill.dotPointIds ?? []).map((id) => dotpointById.get(id)?.text).filter(Boolean);
    const topicRecords = topicIds.map((id) => topicById.get(id)).filter(Boolean);
    const courseRecords = (skill.courses ?? []).map((id) => courseById.get(id)).filter(Boolean);
    const quiz = quizzes instanceof Map ? quizzes.get(skill.id) : quizzes[skill.id];
    const existingStructures = [...new Set((quiz?.questions ?? []).map((question) => question?.structure).filter(Boolean))];
    const searchFields = {
      title: skill.title ?? '',
      blurb: skill.blurb ?? '',
      dotpoints: dotPointTexts.join(' '),
      topics: topicRecords.flatMap((topic) => [topic.title, topic.blurb, topic.strand]).filter(Boolean).join(' '),
      structures: existingStructures.join(' '),
      relations: [...(skill.prereqs ?? []), ...(dependants.get(skill.id) ?? []), ...siblingIds].join(' '),
      courses: courseRecords.map((course) => course.title).filter(Boolean).join(' '),
    };
    return {
      ...skill,
      dotPointTexts,
      topics: topicRecords.map((topic) => ({ id: topic.id, title: topic.title, blurb: topic.blurb, strand: topic.strand })),
      courseDetails: courseRecords.map((course) => ({ id: course.id, title: course.title, stage: course.stage, stream: course.stream })),
      existingStructures,
      siblingIds,
      dependantIds: dependants.get(skill.id) ?? [],
      searchFields,
      searchText: Object.values(searchFields).join(' '),
    };
  });
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function readQuizDirectory(quizDir) {
  const result = {};
  let names = [];
  try {
    names = await fs.readdir(quizDir);
  } catch (error) {
    if (error.code === 'ENOENT') return result;
    throw error;
  }
  for (const name of names.filter((entry) => entry.endsWith('.json'))) {
    result[name.slice(0, -5)] = await readJson(path.join(quizDir, name));
  }
  return result;
}

export async function loadSkillIndex(repoRoot) {
  const dataDir = path.join(repoRoot, 'data');
  const [skills, dotpoints, topics, courses, quizzes] = await Promise.all([
    readJson(path.join(dataDir, 'skills.json')),
    readJson(path.join(dataDir, 'dotpoints.json')),
    readJson(path.join(dataDir, 'topics.json')),
    readJson(path.join(dataDir, 'courses.json')),
    readQuizDirectory(path.join(repoRoot, 'public', 'quizzes')),
  ]);
  return buildSkillIndex({ skills, dotpoints, topics, courses, quizzes });
}

function queryText(query) {
  if (typeof query === 'string') return query;
  const transcription = getTranscription(query) ?? query ?? {};
  return [
    transcription.question_text,
    transcription.structure,
    getMeaningfulCase(query),
    ...(query?.source?.categoryPath ?? []),
  ].filter(Boolean).join(' ');
}

/** Weighted lexical retrieval. Stage/course terms contribute to rank but never filter candidates. */
export function retrieveSkillCandidates(query, index, { limit = 10 } = {}) {
  const queryTokens = words(queryText(query));
  const queryCounts = new Map();
  for (const token of queryTokens) queryCounts.set(token, (queryCounts.get(token) ?? 0) + 1);
  const documentFrequency = new Map();
  for (const skill of index) {
    const unique = new Set(words(skill.searchText));
    for (const token of unique) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }

  const weights = { title: 6, blurb: 4, dotpoints: 4, topics: 3, structures: 3, relations: 1, courses: 1 };
  const total = index.length || 1;
  const ranked = index.map((skill) => {
    let score = 0;
    const matchedTerms = new Set();
    for (const [field, weight] of Object.entries(weights)) {
      const fieldCounts = new Map();
      for (const token of words(skill.searchFields?.[field] ?? '')) fieldCounts.set(token, (fieldCounts.get(token) ?? 0) + 1);
      for (const [token, queryCount] of queryCounts) {
        const frequency = fieldCounts.get(token) ?? 0;
        if (!frequency) continue;
        const inverseDocumentFrequency = Math.log(1 + total / (1 + (documentFrequency.get(token) ?? 0)));
        score += weight * Math.min(2, frequency) * Math.min(2, queryCount) * inverseDocumentFrequency;
        matchedTerms.add(token);
      }
    }
    return { skill, score, matchedTerms: [...matchedTerms].sort() };
  });
  return ranked
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
    .slice(0, limit);
}

export function getMapperReports(candidateOrMapping) {
  const mapping = candidateOrMapping?.mapping ?? candidateOrMapping ?? {};
  if (Array.isArray(mapping.mappers)) return mapping.mappers;
  return [mapping.mapperA, mapping.mapperB].filter(Boolean);
}

export function evaluateMappingConsensus(candidateOrMapping) {
  const reports = getMapperReports(candidateOrMapping);
  const reasons = [];
  if (reports.length !== 2) reasons.push('requires_exactly_two_mappers');
  if (reports.length === 2 && reports[0]?.skillId !== reports[1]?.skillId) reasons.push('mapper_disagreement');
  reports.forEach((report, index) => {
    const label = `mapper_${index + 1}`;
    if (!Number.isFinite(report?.score) || report.score < 90) reasons.push(`${label}_score_below_90`);
    const margin = Number.isFinite(report?.score) && Number.isFinite(report?.runnerUpScore)
      ? report.score - report.runnerUpScore
      : Number.NEGATIVE_INFINITY;
    if (margin < 12) reasons.push(`${label}_margin_below_12`);
    if (report?.atomic !== true && report?.isAtomic !== true) reasons.push(`${label}_not_atomic`);
    const flags = Array.isArray(report?.flags) ? report.flags.filter(Boolean) : [];
    if (flags.length) reasons.push(`${label}_flags:${flags.join(',')}`);
  });
  return {
    autoMapped: reasons.length === 0,
    skillId: reasons.length === 0 ? reports[0].skillId : null,
    reasons,
    reports,
  };
}

export function resolveMappedSkill(candidate) {
  const humanSkillId = candidate?.review?.mappedSkillId;
  const humanApproved = candidate?.review?.mapping === 'approved' || candidate?.review?.mappingApproved === true;
  if (humanSkillId && humanApproved) return { skillId: humanSkillId, method: 'human_review', reasons: [] };
  const consensus = evaluateMappingConsensus(candidate);
  return {
    skillId: consensus.skillId,
    method: consensus.autoMapped ? 'mapper_consensus' : 'needs_human_review',
    reasons: consensus.reasons,
  };
}

/**
 * `structureMap` renormalises an import's hyper-specific structure slug onto an
 * archetype the target skill already uses. Imports arrive with roughly one slug
 * per question, which would defeat both the per-structure selection cap and the
 * quiz engine's distinct-structure preference.
 */
export function toProductionQuestion(candidate, { structureMap } = {}) {
  const transcription = getTranscription(candidate);
  if (!isObject(transcription)) throw new Error('candidate transcription is required');
  const override = structureMap?.[String(candidate.source?.id ?? '')];
  const question = {
    id: stableQuestionId(candidate.source?.id),
    question_text: transcription.question_text,
    structure: override ?? transcription.structure,
    mastery: transcription.mastery,
    options: transcription.options?.map((option) => option.correct === true
      ? { text: option.text, correct: true }
      : { text: option.text, why: option.why }),
    solution_text: transcription.solution_text,
  };
  const normalised = normaliseProductionQuestion(question);
  const validation = validateProductionQuestion(normalised, { exactKeys: true });
  if (!validation.valid) throw new Error(`invalid production question: ${validation.errors.join('; ')}`);
  return normalised;
}

export function createProvenanceEntry(candidate, { skillId, decision, decidedAt = new Date().toISOString(), duplicateAudit } = {}) {
  const source = candidate.source ?? {};
  return {
    questionId: stableQuestionId(source.id),
    sourceId: String(source.id),
    sourceUrl: source.url,
    categoryPath: [...(source.categoryPath ?? [])],
    metrics: structuredClone(source.metrics ?? {}),
    licence: structuredClone(source.licence ?? candidate.licence ?? {}),
    pngSha256: source.pngSha256,
    questionSha256: questionHash(candidate),
    mappedSkillId: skillId ?? null,
    mappingMethod: resolveMappedSkill(candidate).method,
    reviewDecision: decision ?? candidate.review?.status ?? 'pending',
    decidedAt,
    duplicateAudit: structuredClone(duplicateAudit ?? candidate.duplicateAudit ?? {}),
  };
}

function effectiveStructure(item, structureMap) {
  const override = structureMap?.[String(item?.source?.id ?? '')];
  if (override) return override;
  const question = getTranscription(item) ?? item.question ?? item;
  return question?.structure;
}

function structureCaseKey(item, structureMap) {
  const meaningfulCase = getMeaningfulCase(item) || item.meaningfulCase || item.case || '';
  return `${canonicalizeText(effectiveStructure(item, structureMap))}\u0000${canonicalizeText(meaningfulCase)}`;
}

function candidateQuality(candidate) {
  const explicit = candidate.qualityScore ?? candidate.source?.qualityScore ?? candidate.source?.ranking?.score;
  if (Number.isFinite(explicit)) return explicit;
  const ranks = [candidate.source?.metrics?.likedRank, candidate.source?.metrics?.misconceptionRank].filter(Number.isFinite);
  return ranks.length ? -ranks.reduce((sum, value) => sum + value, 0) / ranks.length : 0;
}

/** Preserve existing questions and select imports round-robin across structures. */
export function selectQuestionsForSkill({
  candidates,
  existingQuestions = [],
  maxQuestions = MAX_QUESTIONS_PER_SKILL,
  maxPerStructureCase = MAX_PER_STRUCTURE_CASE,
  structureMap,
}) {
  const capacity = Math.max(0, maxQuestions - existingQuestions.length);
  const variantCounts = new Map();
  for (const question of existingQuestions) {
    const key = structureCaseKey(question);
    variantCounts.set(key, (variantCounts.get(key) ?? 0) + 1);
  }

  const ordered = [...candidates].sort((a, b) => candidateQuality(b) - candidateQuality(a) || String(a.source?.id).localeCompare(String(b.source?.id)));
  const groups = new Map();
  for (const candidate of ordered) {
    const structure = canonicalizeText(effectiveStructure(candidate, structureMap));
    if (!groups.has(structure)) groups.set(structure, []);
    groups.get(structure).push(candidate);
  }

  const selected = [];
  const skipped = [];
  while (selected.length < capacity && groups.size) {
    let madeProgress = false;
    for (const [structure, queue] of [...groups]) {
      let accepted = false;
      while (queue.length && !accepted) {
        const candidate = queue.shift();
        const key = structureCaseKey(candidate, structureMap);
        if ((variantCounts.get(key) ?? 0) >= maxPerStructureCase) {
          skipped.push({ candidate, reason: 'structure_case_limit' });
          continue;
        }
        selected.push(candidate);
        variantCounts.set(key, (variantCounts.get(key) ?? 0) + 1);
        accepted = true;
        madeProgress = true;
      }
      if (!queue.length) groups.delete(structure);
      if (selected.length >= capacity) break;
    }
    if (!madeProgress) break;
  }

  const selectedSet = new Set(selected);
  for (const candidate of candidates) {
    if (!selectedSet.has(candidate) && !skipped.some((entry) => entry.candidate === candidate)) {
      skipped.push({ candidate, reason: capacity === 0 || selected.length >= capacity ? 'bank_cap' : 'not_selected' });
    }
  }
  return { selected, skipped, capacity, finalCount: existingQuestions.length + selected.length };
}

export async function assessPromotionEligibility(candidate, {
  repoRoot,
  existing = [],
  nearThreshold = 0.9,
  skillIds,
  preparedExisting,
} = {}) {
  const validation = validateCandidate(candidate, { phase: 'ready' });
  if (!validation.valid) return { status: 'invalid', reasons: validation.errors, skillId: null };

  const mapped = resolveMappedSkill(candidate);
  if (!mapped.skillId) return { status: 'needs_human_review', reasons: mapped.reasons, skillId: null };

  // `skillIds` lets a bundle run load skills.json once instead of once per candidate.
  try {
    const known = skillIds ?? new Set((await readJson(path.join(repoRoot, 'data', 'skills.json'))).map((skill) => skill.id));
    if (!known.has(mapped.skillId)) {
      return { status: 'invalid', reasons: ['mapped skill does not exist'], skillId: mapped.skillId };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const contentPath = path.join(repoRoot, 'public', 'content', `${mapped.skillId}.json`);
  try {
    await fs.access(contentPath);
  } catch {
    return { status: 'held_missing_content', reasons: ['mapped skill has no teaching content'], skillId: mapped.skillId };
  }

  const checker = candidate.checker ?? candidate.review?.checker;
  if (checker?.transcriptionMatch !== true || checker?.answerMatch !== true) {
    return { status: 'needs_human_review', reasons: ['checker disagreement'], skillId: mapped.skillId };
  }
  const transcription = getTranscription(candidate);
  if ((transcription?.uncertainties ?? []).length) {
    return { status: 'needs_human_review', reasons: ['unresolved transcription uncertainty'], skillId: mapped.skillId };
  }
  const hasDiagram = Boolean(
    transcription?.diagramRequired ||
    transcription?.diagram?.required ||
    /\[tikz\]/.test(`${transcription?.question_text ?? ''}\n${transcription?.solution_text ?? ''}`)
  );
  if (hasDiagram && candidate.review?.diagram !== 'approved' && candidate.review?.diagramApproved !== true) {
    return { status: 'needs_human_review', reasons: ['diagram requires compiled visual approval'], skillId: mapped.skillId };
  }

  // Hold anything the repo's own text lints reject. Delimiter style is already
  // normalised by this point, so what survives is real corruption -- typically a
  // LaTeX backslash eaten in transit, arriving as a raw TAB or FORMFEED.
  const lintProblems = lintProductionQuestion(toProductionQuestion(candidate));
  if (lintProblems.length) {
    return { status: 'invalid', reasons: lintProblems.slice(0, 4), skillId: mapped.skillId };
  }

  const duplicateAudit = findDuplicates(candidate, existing, { nearThreshold, preparedExisting });
  if (duplicateAudit.duplicate) return { status: 'duplicate', reasons: ['exact or near duplicate'], skillId: mapped.skillId, duplicateAudit };
  return { status: 'eligible', reasons: [], skillId: mapped.skillId, duplicateAudit };
}

export async function loadExistingQuestions(repoRoot, { provenancePath = path.join(repoRoot, 'data', 'dq-provenance.json') } = {}) {
  const quizzes = await readQuizDirectory(path.join(repoRoot, 'public', 'quizzes'));
  const existing = Object.entries(quizzes).flatMap(([skillId, quiz]) =>
    (quiz.questions ?? []).map((question) => ({ skillId, kind: 'quiz', question })));
  const contentDir = path.join(repoRoot, 'public', 'content');
  let names = [];
  try {
    names = await fs.readdir(contentDir);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const name of names.filter((entry) => entry.endsWith('.json'))) {
    const skillId = name.slice(0, -5);
    const content = await readJson(path.join(contentDir, name));
    for (const tier of ['foundation', 'development', 'mastery']) {
      for (const question of content.practice?.[tier] ?? []) {
        existing.push({ skillId, kind: `practice_${tier}`, question });
      }
    }
  }
  try {
    const provenance = await readJson(provenancePath);
    for (const entry of Array.isArray(provenance) ? provenance : provenance.entries ?? []) {
      existing.push({
        skillId: entry.mappedSkillId,
        kind: 'provenance',
        sourceId: entry.sourceId,
        pngSha256: entry.pngSha256,
        question: { id: entry.questionId },
      });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return existing;
}

async function writeJsonAtomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, file);
}

/**
 * Plan or execute publication. `promote` is false by default and is the only switch that writes.
 */
/**
 * Resolve a topic id to the skills that hang off it, via dot points. Mirrors the
 * course -> topic -> dotpoint -> skill traversal the content pipeline uses.
 */
export async function skillIdsForTopic(repoRoot, topicId) {
  const dataDir = path.join(repoRoot, 'data');
  const [skills, dotpoints] = await Promise.all([
    readJson(path.join(dataDir, 'skills.json')),
    readJson(path.join(dataDir, 'dotpoints.json')),
  ]);
  const topicByDotpoint = new Map(dotpoints.map((item) => [item.id, item.topicId]));
  return skills
    .filter((skill) => (skill.dotPointIds ?? []).some((id) => topicByDotpoint.get(id) === topicId))
    .map((skill) => skill.id);
}

export async function processCandidateBundle({
  candidates,
  repoRoot,
  promote = false,
  provenancePath = path.join(repoRoot, 'data', 'dq-provenance.json'),
  nearThreshold = 0.9,
  skillFilter,
  excludeSourceIds,
  maxQuestions = MAX_QUESTIONS_PER_SKILL,
  structureMap,
}) {
  if (!Array.isArray(candidates)) throw new Error('candidates must be an array');
  if (!Number.isInteger(maxQuestions) || maxQuestions < 1 || maxQuestions > MAX_QUESTIONS_PER_SKILL) {
    throw new Error(`maxQuestions must be an integer between 1 and ${MAX_QUESTIONS_PER_SKILL}`);
  }
  const scope = skillFilter ? new Set(skillFilter) : null;
  // Human-rejected candidates: content that is sound but does not belong on this
  // site (wrong language, a stem that cites a figure it does not carry, an
  // off-skill mapping). Recorded so a rerun stays reproducible.
  const excluded = excludeSourceIds ? new Set(excludeSourceIds.map(String)) : null;
  // A repo without a taxonomy (test fixtures) skips the skill-existence check,
  // exactly as the per-candidate read used to.
  const skillIds = await (async () => {
    try {
      return new Set((await readJson(path.join(repoRoot, 'data', 'skills.json'))).map((skill) => skill.id));
    } catch (error) {
      if (error.code === 'ENOENT') return undefined;
      throw error;
    }
  })();
  const existing = await loadExistingQuestions(repoRoot, { provenancePath });
  // Canonicalise the corpus once; the batch's own accepted items are appended as
  // they are prepared, so a later candidate still sees an earlier one.
  const preparedExisting = prepareExistingEntries(existing);
  const decisions = [];
  const eligibleBySkill = new Map();
  const outOfScope = [];

  const rejected = [];
  for (const candidate of candidates) {
    if (excluded?.has(String(candidate?.source?.id ?? ''))) {
      rejected.push(String(candidate.source.id));
      continue;
    }
    if (scope) {
      const mapped = resolveMappedSkill(candidate);
      if (!mapped.skillId || !scope.has(mapped.skillId)) {
        outOfScope.push(String(candidate?.source?.id ?? ''));
        continue;
      }
    }
    const eligibility = await assessPromotionEligibility(candidate, {
      repoRoot,
      nearThreshold,
      skillIds,
      preparedExisting,
    });
    const decision = { sourceId: candidate?.source?.id, ...eligibility };
    decisions.push(decision);
    if (eligibility.status === 'eligible') {
      if (!eligibleBySkill.has(eligibility.skillId)) eligibleBySkill.set(eligibility.skillId, []);
      eligibleBySkill.get(eligibility.skillId).push(candidate);
      preparedExisting.push(prepareExistingEntry({
        skillId: eligibility.skillId,
        sourceId: candidate.source.id,
        pngSha256: candidate.source.pngSha256,
        question: toProductionQuestion(candidate, { structureMap }),
      }));
    }
  }

  const promotionPlan = [];
  for (const [skillId, group] of eligibleBySkill) {
    const quizPath = path.join(repoRoot, 'public', 'quizzes', `${skillId}.json`);
    let quiz = { skillId, questions: [] };
    try {
      quiz = await readJson(quizPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const selection = selectQuestionsForSkill({
      candidates: group,
      existingQuestions: quiz.questions ?? [],
      maxQuestions,
      structureMap,
    });
    const selectedIds = new Set(selection.selected.map((candidate) => String(candidate.source.id)));
    for (const decision of decisions.filter((item) => item.skillId === skillId && item.status === 'eligible')) {
      if (!selectedIds.has(String(decision.sourceId))) decision.status = 'not_selected';
    }
    promotionPlan.push({
      skillId,
      quizPath,
      existingCount: quiz.questions?.length ?? 0,
      selectedSourceIds: selection.selected.map((candidate) => String(candidate.source.id)),
      finalCount: selection.finalCount,
      quiz,
      selection,
    });
  }

  if (promote) {
    const provenance = await (async () => {
      try {
        const value = await readJson(provenancePath);
        return Array.isArray(value) ? value : value.entries ?? [];
      } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
      }
    })();
    const provenanceByQuestionId = new Map(provenance.map((entry) => [entry.questionId, entry]));

    for (const plan of promotionPlan) {
      // Re-check at the last possible point: a contentless skill is never published.
      await fs.access(path.join(repoRoot, 'public', 'content', `${plan.skillId}.json`));
      const questions = [
        ...(plan.quiz.questions ?? []),
        ...plan.selection.selected.map((candidate) => toProductionQuestion(candidate, { structureMap })),
      ];
      // `maxQuestions` is a ceiling on what this pass may ADD up to, not a claim about banks
      // that were already larger — an authored skill with 11 questions is not a defect, and
      // selection has already given it zero capacity. Only a bank this pass actually grew
      // past the ceiling is a bug.
      const ceiling = Math.max(maxQuestions, plan.quiz.questions?.length ?? 0);
      if (questions.length > ceiling) throw new Error(`refusing to publish ${plan.skillId}: bank would exceed ${ceiling}`);
      if (questions.length > MAX_QUESTIONS_PER_SKILL) throw new Error(`refusing to publish ${plan.skillId}: bank would exceed 20`);
      await writeJsonAtomic(plan.quizPath, { ...plan.quiz, skillId: plan.skillId, questions });
      for (const candidate of plan.selection.selected) {
        const decision = decisions.find((item) => String(item.sourceId) === String(candidate.source.id));
        const entry = createProvenanceEntry(candidate, {
          skillId: plan.skillId,
          decision: 'published',
          duplicateAudit: decision?.duplicateAudit,
        });
        provenanceByQuestionId.set(entry.questionId, entry);
      }
    }
    await writeJsonAtomic(provenancePath, { schemaVersion: 1, entries: [...provenanceByQuestionId.values()] });
  }

  return {
    mode: promote ? 'promote' : 'dry-run',
    scope: scope ? { skillIds: [...scope], outOfScopeCount: outOfScope.length } : undefined,
    excludedSourceIds: rejected.length ? rejected : undefined,
    maxQuestions,
    decisions,
    promotionPlan: promotionPlan.map(({ quiz, selection, ...plan }) => ({
      ...plan,
      skipped: selection.skipped.map((entry) => ({ sourceId: entry.candidate.source.id, reason: entry.reason })),
    })),
  };
}

/**
 * Source transcriptions use LaTeX's \( \) and \[ \] delimiters; this repo's
 * renderer only understands $…$, so anything left in the other form renders as
 * literal TeX. Swapping the delimiter is formatting normalisation — it does not
 * touch the mathematics — and is the only in-place edit an import may receive.
 */
export function normaliseMathDelimiters(value) {
  if (typeof value !== 'string') return value;
  return value
    .split('\\(').join('$')
    .split('\\)').join('$')
    .split('\\[').join('$')
    .split('\\]').join('$');
}

export function normaliseProductionQuestion(question) {
  return {
    ...question,
    question_text: normaliseMathDelimiters(question.question_text),
    solution_text: normaliseMathDelimiters(question.solution_text),
    options: question.options.map((option) => (option.correct === true
      ? { text: normaliseMathDelimiters(option.text), correct: true }
      : { text: normaliseMathDelimiters(option.text), why: normaliseMathDelimiters(option.why) })),
  };
}

/**
 * Run a production question through the same text lints `scripts/validate.mjs`
 * applies to authored content. Catches the corruption class where a LaTeX
 * backslash was eaten in transit ("\times" arriving as a raw TAB), which no
 * amount of reformatting can honestly repair.
 */
export function lintProductionQuestion(question) {
  const problems = [];
  validateInlineText(question.question_text, 'question_text', problems);
  validateInlineText(question.solution_text, 'solution_text', problems);
  question.options.forEach((option, index) => {
    lintMathString(option.text, `options[${index}].text`, problems);
    if (option.why) lintMathString(option.why, `options[${index}].why`, problems);
  });
  return problems;
}
