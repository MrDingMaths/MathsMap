// MathsMap Booklet Studio v3 question-first contract.
// Canonical questions deliberately contain no source/provenance fields.
// Source files, page renders, and question-to-page mapping live in the import job.

export const PRACTICE_QUESTION_FORMAT = 'mathsmap-practice-question-v3';
export const PRACTICE_IMPORT_FORMAT = 'mathsmap-practice-import-v3';
export const PRACTICE_QUESTION_VERSION = 3;
export const QUESTION_BANK_MANIFEST = 'mathsmap-practice-bank-v3';
export const NODE_TYPES = Object.freeze(['question', 'group', 'part']);
export const NODE_LAYOUTS = Object.freeze(['list', 'grid']);
export const MAX_PART_DEPTH = 5;

export const DIFFICULTIES = Object.freeze([
  { id: 'Foundation', label: 'Foundation', order: 1, minScore: 0, maxScore: 24 },
  { id: 'Development', label: 'Development', order: 2, minScore: 25, maxScore: 49 },
  { id: 'Mastery', label: 'Mastery', order: 3, minScore: 50, maxScore: 79 },
  { id: 'Challenge', label: 'Challenge', order: 4, minScore: 80, maxScore: 100 },
]);
export const DIFFICULTY_ORDER = Object.freeze(Object.fromEntries(DIFFICULTIES.map((d) => [d.id, d.order])));
const LEGACY_SCORE = Object.freeze({ Foundation: 12, Development: 37, Mastery: 64, Challenge: 88 });

const text = (value) => (value == null ? '' : String(value).replace(/\r\n?/g, '\n').trim());
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
const unique = (values) => [...new Set((Array.isArray(values) ? values : []).map(text).filter(Boolean))];
export const deepCopy = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));
export const slug = (value, fallback = 'question') => text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback;

export function hashText(value) {
  let hash = 2166136261;
  for (const character of text(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function normaliseForDuplicate(value) {
  return text(value)
    .replace(/\[tikz\][\s\S]*?\[\/tikz\]/gi, ' ')
    .replace(/\$[^$]*\$/g, ' math ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function stableQuestionId(source = {}, index = 0) {
  const key = slug(source.importId ?? source.file ?? source.title ?? 'import', 'import');
  const page = Number(source.pageNumber ?? source.page ?? 0);
  const number = text(source.questionNumber ?? source.questionId ?? source.number ?? index + 1);
  return 'q-' + hashText(key + '|' + page + '|' + number + '|' + index) + '-' + hashText(number + '|' + key).slice(0, 6);
}

export function difficultyBandForScore(value) {
  const score = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return DIFFICULTIES.find((difficulty) => score >= difficulty.minScore && score <= difficulty.maxScore)?.id ?? 'Foundation';
}

export function normaliseReasoningScore(value, fallbackDifficulty = 'Development') {
  if (value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value))) {
    return Math.max(0, Math.min(100, Math.round(Number(value))));
  }
  return LEGACY_SCORE[fallbackDifficulty] ?? LEGACY_SCORE.Development;
}

function firstString(value, keys) {
  for (const key of keys) if (value?.[key] != null) return text(value[key]);
  return '';
}

function clampSpace(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(180, number)) : fallback;
}

function normaliseDiagram(raw, role, index) {
  const value = raw && typeof raw === 'object' ? deepCopy(raw) : { src: raw };
  const code = value.code ?? value.tikz ?? null;
  const src = value.src ?? value.svg ?? value.url ?? value.path ?? null;
  const format = value.format ?? (code ? 'tikz' : value.svg ? 'svg' : 'image');
  const diagramRole = value.role ?? (value.overlayOf ? 'solution-overlay' : role);
  return {
    id: String(value.id ?? 'diagram-' + role + '-' + (index + 1)),
    role: diagramRole,
    format,
    code: code == null ? null : String(code).replace(/^\s*\[tikz\]/i, '').replace(/\[\/tikz\]\s*$/i, '').trim(),
    src: src == null ? null : String(src),
    widthMm: clampSpace(value.widthMm, 95),
    alt: text(value.alt ?? value.caption ?? 'Mathematical diagram') || 'Mathematical diagram',
    overlayOf: value.overlayOf ?? null,
    transparent: value.transparent === true,
    axes: deepCopy(value.axes ?? null),
    derived: value.derived === true,
    reviewStatus: value.reviewStatus ?? (value.approved === true ? 'approved' : 'needs-review'),
  };
}

function normaliseDiagrams(raw, role) {
  const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  return list.flatMap((item, index) => item == null || text(item) === '' ? [] : [normaliseDiagram(item, role, index)]);
}

function rawChildren(value) {
  return Array.isArray(value?.children) ? value.children : [];
}

function rawAnswer(value) {
  const answer = value?.answer && typeof value.answer === 'object' ? value.answer : {};
  return {
    short: answer.short ?? null,
    worked: answer.worked ?? '',
    solutionDiagrams: answer.solutionDiagrams ?? [],
  };
}

function normaliseLayout(value) {
  const columns = Number(value?.columns);
  if (value?.layout === 'grid' || (Number.isInteger(columns) && columns >= 2 && columns <= 4)) {
    return { layout: 'grid', columns: Number.isInteger(columns) && columns >= 2 && columns <= 4 ? columns : 2 };
  }
  return { layout: 'list', columns: null };
}

function normaliseNode(raw = {}, depth = 0, index = 0, root = false) {
  const value = raw && typeof raw === 'object' ? raw : { prompt: raw };
  const children = rawChildren(value);
  const layout = normaliseLayout(value);
  const requestedType = value.type;
  const type = root ? 'question' : NODE_TYPES.includes(requestedType) ? requestedType : (children.length ? 'group' : 'part');
  const node = {
    id: String(value.id ?? 'node-' + depth + '-' + (index + 1)),
    type,
    label: value.label ?? value.part ?? null,
    prompt: firstString(value, ['prompt']),
    layout: layout.layout,
    columns: layout.columns,
    questionDiagrams: normaliseDiagrams(value.questionDiagrams ?? value.question_diagrams ?? value.images ?? value.diagrams ?? value.tikz, 'question'),
    children: children.map((child, childIndex) => normaliseNode(child, depth + 1, childIndex, false)),
  };
  if (!children.length) {
    const answer = rawAnswer(value);
    node.answer = {
      short: answer.short == null || text(answer.short) === '' ? null : text(answer.short),
      worked: text(answer.worked),
      solutionDiagrams: normaliseDiagrams(answer.solutionDiagrams, 'solution'),
    };
    node.answerSpaceMm = clampSpace(value.answerSpaceMm ?? value.defaultAnswerSpaceMm ?? value.responseSpaceMm, null);
  }
  return node;
}

export function leafNodes(node) {
  return !node?.children?.length ? (node ? [node] : []) : node.children.flatMap(leafNodes);
}

export function allNodes(node) {
  return node ? [node, ...(node.children ?? []).flatMap(allNodes)] : [];
}

export function allDiagrams(question) {
  return allNodes(question?.content).flatMap((node) => [...(node.questionDiagrams ?? []), ...(node.answer?.solutionDiagrams ?? [])]);
}

export function isMultipart(question) {
  return Boolean(question?.content?.children?.length);
}

export function hasDiagrams(question) {
  return allDiagrams(question).length > 0;
}

export function estimateAnswerSpaceMm(node = {}) {
  if (node.answerSpaceMm != null && node.answerSpaceMm !== '' && Number.isFinite(Number(node.answerSpaceMm))) return Math.max(0, Number(node.answerSpaceMm));
  const workedLines = text(node.answer?.worked).split('\n').filter(Boolean).length;
  const diagramCount = (node.questionDiagrams?.length ?? 0) + (node.answer?.solutionDiagrams?.length ?? 0);
  return Math.max(12, Math.min(80, 14 + workedLines * 3 + diagramCount * 4));
}

function sourceContext(raw = {}, fallback = {}, index = 0) {
  const rawSource = raw?.source ?? raw?.provenance ?? fallback ?? {};
  return {
    importId: rawSource.importId ?? fallback?.importId ?? null,
    file: rawSource.file ?? rawSource.originalName ?? fallback?.file ?? null,
    pageNumber: rawSource.pageNumber ?? rawSource.page ?? fallback?.pageNumber ?? null,
    questionNumber: rawSource.questionNumber ?? rawSource.questionId ?? raw.number ?? fallback?.questionNumber ?? index + 1,
  };
}

export function normaliseQuestion(raw = {}, { index = 0, source = null } = {}) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const context = sourceContext(value, source ?? {}, index);
  const classification = value.classification ?? {};
  const legacyDifficulty = value.difficulty ?? classification.difficulty ?? 'Development';
  const score = normaliseReasoningScore(value.reasoningScore ?? classification.reasoningScore, legacyDifficulty);
  const primary = value.primarySkillId ?? classification.primarySkillId ?? value.skillId ?? value.skillIds?.[0] ?? '';
  const secondary = unique(value.secondarySkillIds ?? classification.secondarySkillIds ?? value.skills?.secondary ?? value.skillIds?.slice?.(1));
  const now = new Date().toISOString();
  const root = normaliseNode(value.content ?? value, 0, 0, true);
  return {
    format: PRACTICE_QUESTION_FORMAT,
    version: PRACTICE_QUESTION_VERSION,
    id: String(value.id ?? stableQuestionId(context, index)),
    status: value.status ?? 'draft',
    title: text(value.title),
    classification: {
      primarySkillId: text(primary),
      secondarySkillIds: secondary,
      reasoningScore: score,
      difficulty: difficultyBandForScore(score),
      difficultyReason: text(value.difficultyReason ?? classification.difficultyReason) || 'Score-derived from the calibrated 0–100 reasoning scale.',
    },
    content: root,
    review: {
      approvedBy: value.review?.approvedBy ?? null,
      approvedAt: value.review?.approvedAt ?? null,
      flags: unique(value.review?.flags ?? value.reviewFlags ?? value.uncertainties),
      diagramApprovals: deepCopy(value.review?.diagramApprovals ?? {}),
      history: deepCopy(value.review?.history ?? []),
    },
    createdAt: value.createdAt ?? now,
    updatedAt: value.updatedAt ?? now,
  };
}

function walkRaw(value, visit, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  visit(value);
  for (const child of rawChildren(value)) walkRaw(child, visit, seen);
  for (const child of [value.content, value.node]) if (child && typeof child === 'object') walkRaw(child, visit, seen);
  for (const list of [value.questions, value.items]) if (Array.isArray(list)) for (const item of list) walkRaw(item, visit, seen);
  if (value.answer && typeof value.answer === 'object') {
    for (const diagram of Array.isArray(value.answer.solutionDiagrams) ? value.answer.solutionDiagrams : []) if (diagram && typeof diagram === 'object') walkRaw(diagram, visit, seen);
  }
}

export function containsForbiddenMarks(value) {
  let found = false;
  walkRaw(value, (node) => {
    if (hasOwn(node, 'marks') || hasOwn(node, 'totalMarks') || hasOwn(node, 'mark')) found = true;
  });
  return found;
}

export function containsParentAnswers(value) {
  let found = false;
  walkRaw(value, (node) => {
    if (!rawChildren(node).length) return;
    if (hasOwn(node, 'answer') || hasOwn(node, 'shortAnswer') || hasOwn(node, 'workedSolution') || hasOwn(node, 'solutionDiagrams') || hasOwn(node, 'answerSpaceMm')) found = true;
  });
  return found;
}

export function containsSourceMetadata(value) {
  let found = false;
  walkRaw(value, (node) => {
    if (['source', 'provenance', 'sourceRef', 'sourceCrop', 'sourceImage'].some((key) => hasOwn(node, key))) found = true;
  });
  return found;
}

export function invalidateApproval(question, reason = 'edited') {
  const next = normaliseQuestion(deepCopy(question));
  next.status = next.status === 'approved' ? 'draft' : next.status;
  next.review = { ...next.review, approvedAt: null, approvedBy: null, flags: reason === 'edited' ? [...next.review.flags] : unique([...next.review.flags, reason]) };
  next.updatedAt = new Date().toISOString();
  return next;
}

function balancedMath(value) {
  const source = text(value);
  const dollars = source.match(/(?<!\\)\$/g)?.length ?? 0;
  const opens = (source.match(/\\\(/g)?.length ?? 0) + (source.match(/\\\[/g)?.length ?? 0);
  const closes = (source.match(/\\\)/g)?.length ?? 0) + (source.match(/\\\]/g)?.length ?? 0);
  return dollars % 2 === 0 && opens === closes;
}

export function mathSpans(value) {
  const source = text(value);
  const spans = [];
  for (const match of source.matchAll(/(?<!\\)\$([\s\S]*?)(?<!\\)\$/g)) spans.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length, body: match[1], delimiter: '$' });
  for (const match of source.matchAll(/\\\(([\s\S]*?)\\\)/g)) spans.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length, body: match[1], delimiter: '\\()' });
  for (const match of source.matchAll(/\\\[([\s\S]*?)\\\]/g)) spans.push({ start: match.index ?? 0, end: (match.index ?? 0) + match[0].length, body: match[1], delimiter: '\\[\\]' });
  return spans;
}

export function invalidFractionSpans(value) {
  return mathSpans(value).filter((span) => /(?<!\\)\/(?!\/)/.test(span.body));
}

function validateDiagram(diagram, path, errors, warnings, diagramIds) {
  if (!diagram || typeof diagram !== 'object') return errors.push(path + ' must be an object');
  if (!diagram.id) errors.push(path + '.id is required');
  if (!['tikz', 'svg', 'image'].includes(diagram.format)) errors.push(path + '.format is unsupported');
  if (diagram.format === 'tikz' && !text(diagram.code)) errors.push(path + '.code is required for TikZ');
  if (diagram.format !== 'tikz' && !text(diagram.src)) errors.push(path + '.src is required for an asset');
  if (!['question', 'solution', 'solution-overlay'].includes(diagram.role)) errors.push(path + '.role is required');
  if (diagram.overlayOf && !diagramIds.has(diagram.overlayOf)) errors.push(path + '.overlayOf does not reference a source diagram');
  if (diagram.overlayOf && diagram.role !== 'solution-overlay') errors.push(path + '.overlayOf requires role solution-overlay');
  if (diagram.overlayOf && diagram.transparent !== true) errors.push(path + '.overlayOf requires a transparent overlay');
  if (diagram.widthMm == null || !Number.isFinite(Number(diagram.widthMm)) || Number(diagram.widthMm) <= 0 || Number(diagram.widthMm) > 190) errors.push(path + '.widthMm must be between 1 and 190');
  if (diagram.reviewStatus !== 'approved') warnings.push(path + ' is awaiting diagram review');
}

function validateNode(node, path, errors, warnings, depth, diagramIds) {
  if (!node || typeof node !== 'object') return errors.push(path + ' must be an object');
  if (!NODE_TYPES.includes(node.type)) errors.push(path + '.type must be question, group, or part');
  const children = Array.isArray(node.children) ? node.children : [];
  if (!text(node.prompt) && !children.length && !(node.questionDiagrams ?? []).length) errors.push(path + '.prompt is required');
  if (!NODE_LAYOUTS.includes(node.layout)) errors.push(path + '.layout must be list or grid');
  if (node.layout === 'grid' && !(Number.isInteger(Number(node.columns)) && Number(node.columns) >= 2 && Number(node.columns) <= 4)) errors.push(path + '.columns must be 2, 3, or 4 for a grid');
  if (node.layout === 'list' && node.columns != null) errors.push(path + '.columns must be null for a list');
  if (depth > MAX_PART_DEPTH) errors.push(path + ' exceeds supported nesting depth');
  if (!Array.isArray(node.children)) errors.push(path + '.children must be an array');
  if (children.length && node.type === 'part') errors.push(path + '.part cannot contain children');
  if (!children.length && node.type === 'group') errors.push(path + '.group must contain children');
  if (!children.length) {
    if (!node.answer || typeof node.answer !== 'object') errors.push(path + '.answer is required on a leaf');
    if (node.answer && !text(node.answer.worked)) errors.push(path + '.answer.worked is required on a leaf');
    if (node.answer && node.answer.short != null && !balancedMath(node.answer.short)) errors.push(path + '.answer.short has unbalanced maths delimiters');
  } else if (hasOwn(node, 'answer')) {
    errors.push(path + '.answer is only allowed on leaf nodes');
  }
  for (const [field, value] of [['prompt', node.prompt], ['answer.short', node.answer?.short], ['answer.worked', node.answer?.worked]]) {
    if (value != null) {
      if (!balancedMath(value)) errors.push(path + '.' + field + ' has unbalanced maths delimiters');
      if (invalidFractionSpans(value).length) errors.push(path + '.' + field + ' uses slash-style fraction notation; use \\frac{numerator}{denominator}');
    }
  }
  for (const [index, diagram] of (node.questionDiagrams ?? []).entries()) validateDiagram(diagram, path + '.questionDiagrams[' + index + ']', errors, warnings, diagramIds);
  for (const [index, diagram] of (node.answer?.solutionDiagrams ?? []).entries()) validateDiagram(diagram, path + '.answer.solutionDiagrams[' + index + ']', errors, warnings, diagramIds);
  children.forEach((child, index) => validateNode(child, path + '.children[' + index + ']', errors, warnings, depth + 1, diagramIds));
}

export function validateQuestion(raw, { skillIds = null, allowDraft = true } = {}) {
  const question = normaliseQuestion(raw);
  const errors = [];
  const warnings = [];
  if (containsForbiddenMarks(raw)) errors.push('marks are not part of the v3 question contract');
  if (containsParentAnswers(raw)) errors.push('parent nodes cannot carry answers or solution summaries');
  if (containsSourceMetadata(raw)) errors.push('source metadata belongs in the import job, not the canonical question');
  if (raw?.format !== PRACTICE_QUESTION_FORMAT) errors.push('question format must be ' + PRACTICE_QUESTION_FORMAT);
  if (Number(raw?.version) !== PRACTICE_QUESTION_VERSION) errors.push('question version must be 3');
  if (!['draft', 'approved'].includes(question.status)) errors.push('question.status must be draft or approved');
  if (!question.classification.primarySkillId) errors.push('classification.primarySkillId is required');
  if (skillIds && question.classification.primarySkillId && !skillIds.has(question.classification.primarySkillId)) errors.push('unknown primary skill: ' + question.classification.primarySkillId);
  for (const id of question.classification.secondarySkillIds) if (skillIds && !skillIds.has(id)) errors.push('unknown secondary skill: ' + id);
  if (!Number.isInteger(question.classification.reasoningScore) || question.classification.reasoningScore < 0 || question.classification.reasoningScore > 100) errors.push('classification.reasoningScore must be an integer from 0 to 100');
  if (question.classification.difficulty !== difficultyBandForScore(question.classification.reasoningScore)) errors.push('classification.difficulty must be derived from reasoningScore');
  if (!question.classification.difficultyReason) errors.push('classification.difficultyReason is required');
  if (!allowDraft && question.status !== 'approved') errors.push('question is not approved');
  const diagramIds = new Set(allDiagrams(question).map((diagram) => diagram.id));
  validateNode(question.content, 'content', errors, warnings, 0, diagramIds);
  if (question.content.type !== 'question') errors.push('content.type must be question');
  if (question.review.flags.length) warnings.push('review.flags must be resolved before approval');
  return { question, errors, warnings, valid: errors.length === 0 };
}

export function approvalCheck(raw, options = {}) {
  const checked = validateQuestion(raw, options);
  const blockers = [...checked.errors];
  const question = checked.question;
  if (question.review.flags.length) blockers.push('review.flags contains unresolved uncertainty');
  for (const diagram of allDiagrams(question)) {
    if (!diagram.role) blockers.push(diagram.id + ' has no diagram role');
    if (diagram.reviewStatus !== 'approved') blockers.push(diagram.id + ' is awaiting diagram approval');
    if (diagram.overlayOf && diagram.transparent !== true) blockers.push(diagram.id + ' overlay is not transparent');
  }
  return { ...checked, blockers, ready: blockers.length === 0 };
}

export function markApproved(raw, { approvedBy = 'Luna Max', at = new Date().toISOString() } = {}) {
  const check = approvalCheck(raw);
  if (!check.ready) throw new Error('Cannot approve ' + check.question.id + ': ' + check.blockers.join('; '));
  const next = normaliseQuestion(deepCopy(raw));
  next.status = 'approved';
  next.review = { ...next.review, approvedBy, approvedAt: at, history: [...(next.review.history ?? []), { status: 'approved', approvedBy, at }] };
  next.updatedAt = at;
  return next;
}

export function questionSearchText(question) {
  return [question?.title, ...allNodes(question?.content).flatMap((node) => [node.prompt, node.answer?.short, node.answer?.worked])]
    .filter(Boolean)
    .join(' ');
}

export function questionSourceLabel(question) {
  return question?.id ?? 'Question';
}

function selectedValues(value) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return text(value) ? [text(value)] : [];
}

function questionSkillIds(question) {
  return unique([question?.classification?.primarySkillId, ...(question?.classification?.secondarySkillIds ?? [])]);
}

export function skillMatchesTaxonomyPath(skill = {}, filters = {}, dotpointCatalog = []) {
  const dotpointMap = dotpointCatalog instanceof Map
    ? dotpointCatalog
    : new Map((dotpointCatalog ?? []).map((dotpoint) => [dotpoint.id, dotpoint]));
  const courseId = text(filters.courseId);
  const topicId = text(filters.topicId);
  const subtopicId = text(filters.subtopicId ?? filters.dotpointId);
  if (courseId && !(skill.courses ?? []).includes(courseId)) return false;
  if (subtopicId && !(skill.dotPointIds ?? []).includes(subtopicId)) return false;
  if (topicId && !(skill.dotPointIds ?? []).some((id) => dotpointMap.get(id)?.topicId === topicId)) return false;
  return true;
}

export function questionTaxonomy(question, { skills = [], topics = [], dotpoints = [] } = {}) {
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
  const dotpointMap = new Map(dotpoints.map((dotpoint) => [dotpoint.id, dotpoint]));
  const skillRecords = questionSkillIds(question).map((id) => skillMap.get(id)).filter(Boolean);
  return {
    skillIds: questionSkillIds(question),
    courseIds: unique(skillRecords.flatMap((skill) => skill.courses ?? [])),
    subtopicIds: unique(skillRecords.flatMap((skill) => skill.dotPointIds ?? [])),
    topicIds: unique(skillRecords.flatMap((skill) => (skill.dotPointIds ?? []).map((id) => dotpointMap.get(id)?.topicId).filter(Boolean))),
  };
}

function taxonomyPathMatches(question, filters, catalog) {
  const courses = selectedValues(filters.courseId ?? filters.course ?? filters.courses);
  const topics = selectedValues(filters.topicId ?? filters.topic ?? filters.topics);
  const subtopics = selectedValues(filters.subtopicId ?? filters.subtopic ?? filters.dotpointId ?? filters.dotpoint);
  const skill = text(filters.skill);
  const skillQuery = text(filters.skillQuery).toLowerCase();
  const skillRecords = questionSkillIds(question).map((id) => catalog.skillMap.get(id)).filter(Boolean);
  const hasPathFilter = courses.length || topics.length || subtopics.length;
  if (skill && !questionSkillIds(question).includes(skill)) return false;
  if (skillQuery && !skillRecords.some((record) => (record.title + ' ' + (record.blurb ?? '')).toLowerCase().includes(skillQuery))) return false;
  if (!hasPathFilter) return true;
  if (!skillRecords.length) {
    const taxonomy = questionTaxonomy(question, { skills: catalog.skills, topics: catalog.topics, dotpoints: catalog.dotpoints });
    return (!courses.length || courses.some((id) => taxonomy.courseIds.includes(id)))
      && (!topics.length || topics.some((id) => taxonomy.topicIds.includes(id)))
      && (!subtopics.length || subtopics.some((id) => taxonomy.subtopicIds.includes(id)));
  }
  return skillRecords.some((record) => {
    const recordTopics = (record.dotPointIds ?? []).map((id) => catalog.dotpointMap.get(id)?.topicId).filter(Boolean);
    return (!courses.length || courses.some((id) => (record.courses ?? []).includes(id)))
      && (!topics.length || topics.some((id) => recordTopics.includes(id)))
      && (!subtopics.length || subtopics.some((id) => (record.dotPointIds ?? []).includes(id)));
  });
}

export function filterQuestionBank(records = [], filters = {}, taxonomy = {}) {
  const query = text(filters.text).toLowerCase();
  const sources = selectedValues(filters.sources);
  const catalog = {
    skills: taxonomy.skills ?? [],
    topics: taxonomy.topics ?? [],
    dotpoints: taxonomy.dotpoints ?? [],
    skillMap: new Map((taxonomy.skills ?? []).map((skill) => [skill.id, skill])),
    dotpointMap: new Map((taxonomy.dotpoints ?? []).map((dotpoint) => [dotpoint.id, dotpoint])),
  };
  return records.filter((question) => {
    if (question.status !== 'approved') return false;
    if (filters.difficulty?.length && !filters.difficulty.includes(question.classification.difficulty)) return false;
    if (filters.reasoningMin !== '' && filters.reasoningMin != null && question.classification.reasoningScore < Number(filters.reasoningMin)) return false;
    if (filters.reasoningMax !== '' && filters.reasoningMax != null && question.classification.reasoningScore > Number(filters.reasoningMax)) return false;
    if (!taxonomyPathMatches(question, filters, catalog)) return false;
    if (sources.length) return false;
    if (filters.source || filters.sources) return false;
    if (filters.multipart != null && isMultipart(question) !== Boolean(filters.multipart)) return false;
    if (filters.hasDiagram != null && hasDiagrams(question) !== Boolean(filters.hasDiagram)) return false;
    if (!query) return true;
    const searchable = question.id + ' ' + questionSearchText(question) + ' ' + question.classification.primarySkillId + ' ' + (question.classification.secondarySkillIds ?? []).join(' ');
    return searchable.toLowerCase().includes(query);
  });
}

function scoreCompare(a, b) {
  return Number(a.classification?.reasoningScore ?? 0) - Number(b.classification?.reasoningScore ?? 0) || a.id.localeCompare(b.id);
}

export function sortQuestions(records, mode = 'reasoning') {
  const out = [...records];
  if (mode === 'difficulty' || mode === 'reasoning') return out.sort(scoreCompare);
  if (mode === 'skill') return out.sort((a, b) => a.classification.primarySkillId.localeCompare(b.classification.primarySkillId) || scoreCompare(a, b));
  if (mode === 'source' || mode === 'manual') return out.sort((a, b) => a.id.localeCompare(b.id));
  return out.sort(scoreCompare);
}

export function worksheetLeaves(question, overrides = {}) {
  return leafNodes(question?.content).map((node) => ({ ...deepCopy(node), answerSpaceMm: Number.isFinite(Number(overrides[node.id])) ? Number(overrides[node.id]) : estimateAnswerSpaceMm(node) }));
}

export function estimateWorksheetPages(questions = [], { includeSpaces = false, includeShortAnswers = false, includeWorkedSolutions = false } = {}) {
  const questionLoad = questions.reduce((sum, question) => sum + 14 + leafNodes(question.content).reduce((subtotal, node) => subtotal + 8 + (includeSpaces ? (Number(node.answerSpaceMm) || estimateAnswerSpaceMm(node)) : 0), 0) / 100, 0);
  const answerLoad = includeShortAnswers ? questions.length * 0.25 : 0;
  const workedLoad = includeWorkedSolutions ? questions.reduce((sum, question) => sum + leafNodes(question.content).reduce((subtotal, node) => subtotal + 0.18 + text(node.answer?.worked).split('\n').length * 0.025, 0), 0) : 0;
  const pageCapacity = includeSpaces ? 18 : includeWorkedSolutions ? 24 : includeShortAnswers ? 27 : 40;
  return Math.max(1, Math.ceil((questionLoad + answerLoad + workedLoad) / pageCapacity));
}

export function makeBankManifest(records = []) {
  return {
    format: QUESTION_BANK_MANIFEST,
    version: PRACTICE_QUESTION_VERSION,
    generatedAt: new Date().toISOString(),
    questions: records.filter((question) => question.status === 'approved').map((question) => ({
      id: question.id,
      path: question.id + '.json',
      reasoningScore: question.classification.reasoningScore,
      difficulty: question.classification.difficulty,
      primarySkillId: question.classification.primarySkillId,
      secondarySkillIds: [...(question.classification.secondarySkillIds ?? [])],
      multipart: isMultipart(question),
      hasDiagram: hasDiagrams(question),
      shape: question.content.layout === 'grid' ? 'grid' : isMultipart(question) ? 'multipart' : 'single',
    })),
  };
}

export function normalizeImport(raw = {}, source = {}) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const questions = Array.isArray(value.questions) ? value.questions : Array.isArray(value.items) ? value.items : [];
  const evidence = deepCopy(value.evidence ?? value.sourceEvidence ?? {});
  return {
    format: PRACTICE_IMPORT_FORMAT,
    version: PRACTICE_QUESTION_VERSION,
    status: value.status ?? 'needs-review',
    jobId: value.jobId ?? source.importId ?? null,
    evidence,
    questions: questions.map((question, index) => normaliseQuestion(question, { index, source: { ...source, ...(question?.source ?? {}) } })),
    flags: unique(value.flags ?? value.reviewFlags),
  };
}

export function validateImport(raw, { skillIds = null } = {}) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const payload = normalizeImport(value);
  const rawQuestions = Array.isArray(value.questions) ? value.questions : Array.isArray(value.items) ? value.items : [];
  const errors = [];
  const warnings = [...payload.flags];
  if (value.format !== PRACTICE_IMPORT_FORMAT) errors.push('import format must be ' + PRACTICE_IMPORT_FORMAT);
  if (Number(value.version) !== PRACTICE_QUESTION_VERSION) errors.push('import version must be 3');
  if (!payload.questions.length) errors.push('Import contains no questions');
  if (containsForbiddenMarks(value)) errors.push('marks are not part of the v3 import contract');
  if (rawQuestions.some(containsParentAnswers)) errors.push('parent nodes cannot carry answers or solution summaries');
  if (rawQuestions.some(containsSourceMetadata)) errors.push('source metadata belongs in the import job evidence map');
  const ids = new Set();
  for (const question of payload.questions) {
    if (ids.has(question.id)) errors.push('Duplicate question id: ' + question.id);
    ids.add(question.id);
    const checked = validateQuestion(question, { skillIds });
    errors.push(...checked.errors.map((error) => question.id + ': ' + error));
    warnings.push(...checked.warnings.map((warning) => question.id + ': ' + warning));
  }
  return { payload, errors, warnings, valid: errors.length === 0 };
}
