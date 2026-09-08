// Compatibility readers for v2/v3 booklet data. New authoring uses editable-booklet-model.js.
import { normalizeRichText, serializeRichText, richTextToPlainText } from './maths-editor.js';

const LEGACY_BOOKLET_PROJECT_FORMAT = 'mathsmap-booklet-project-v2';
const BOOKLET_PROJECT_FORMAT = 'mathsmap-booklet-project-v3';
const BOOKLET_PROJECT_VERSION = 3;

const RESPONSE_SPACE_MM = Object.freeze({
  none: 0,
  compact: 12,
  standard: 25,
  extended: 46,
  full: 84,
});

const SECTION_ROLES = Object.freeze(['front-matter', 'teaching', 'mixed-practice', 'challenge']);

function hasTikz(value) {
  return richTextToPlainText(value).includes('[tikz]');
}

function deriveAnswer(solution) {
  const lines = String(solution ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const last = lines.at(-1) ?? '';
  return last.replace(/^\$\s*=\s*/, '$').replace(/\s*\$$/, '$').replace(/^=\s*/, '').trim();
}

// ---------------------------------------------------------------------------
// BookletProject v2
// ---------------------------------------------------------------------------

function projectClone(value) {
  if (value === undefined) return value;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value); } catch { /* Svelte reactive proxies need the JSON fallback. */ }
  }
  return JSON.parse(JSON.stringify(value));
}

function deepCopy(value) {
  return projectClone(value);
}

function slug(value) {
  return String(value ?? 'node').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'node';
}

function hash(value) {
  let result = 2166136261;
  for (const char of String(value ?? '')) {
    result ^= char.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function stableBookletId(prefix, seed = '') {
  return `${slug(prefix)}-${slug(seed).slice(0, 42)}-${hash(seed)}`;
}

function clampColumns(value, fallback = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(4, Math.round(numeric))) : fallback;
}

function sourceOf(raw) {
  return raw?.source ?? raw?.origin ?? null;
}

function richContentOf(raw, keys) {
  for (const key of keys) {
    if (raw?.[key] !== undefined && raw?.[key] !== null) return normalizeRichText(raw[key]);
  }
  return normalizeRichText('');
}

function normalizePart(raw = {}, index = 0, parent = {}) {
  const value = raw ?? {};
  const source = value.source ?? parent.source ?? null;
  const answerSpaceMm = Number(value.answerSpaceMm ?? value.spaceMm ?? NaN);
  const responseSpace = value.responseSpace ?? parent.responseSpace ?? null;
  const fallbackMm = responseSpace && RESPONSE_SPACE_MM[responseSpace] !== undefined ? RESPONSE_SPACE_MM[responseSpace] : RESPONSE_SPACE_MM.standard;
  return {
    ...projectClone(value),
    id: value.id ?? `part-${index + 1}`,
    label: value.label ?? String.fromCharCode(97 + index),
    content: richContentOf(value, ['content', 'prompt', 'question_text', 'text']),
    solution: richContentOf(value, ['solution', 'solution_text', 'answerContent']),
    answer: value.answer ?? value.finalAnswer ?? '',
    images: projectClone(value.images ?? value.diagrams ?? []),
    tikz: value.tikz ?? null,
    answerSpaceMm: Number.isFinite(answerSpaceMm) ? Math.max(0, answerSpaceMm) : fallbackMm,
    responseSpace: responseSpace ?? (Number.isFinite(answerSpaceMm) ? null : 'standard'),
    source,
    reviewFlags: [...new Set(value.reviewFlags ?? value.uncertainties ?? [])],
  };
}

function normalizeQuestionBlock(raw = {}, { id = null, origin = null } = {}) {
  const value = raw ?? {};
  const source = value.question && typeof value.question === 'object' ? value.question : value;
  const prompt = source.content ?? source.prompt ?? source.question_text ?? source.question ?? source.text ?? '';
  const solution = source.solution ?? source.solution_text ?? '';
  const rawParts = Array.isArray(source.parts) && source.parts.length
    ? source.parts
    : [
      {
        id: 'part-1',
        content: prompt,
        solution,
        answer: source.answer ?? source.finalAnswer ?? '',
        images: source.images ?? source.diagrams ?? [],
        tikz: source.tikz ?? null,
        answerSpaceMm: source.answerSpaceMm,
        responseSpace: source.responseSpace,
      },
    ];
  const blockId = id ?? value.id ?? source.blockId ?? source.id ?? stableBookletId('question', source.sourceId ?? source.id ?? prompt);
  return {
    ...projectClone(value),
    type: 'question',
    id: blockId,
    questionId: value.questionId ?? source.id ?? null,
    prompt: normalizeRichText(value.prompt ?? prompt),
    solution: normalizeRichText(value.solution ?? solution),
    answer: value.answer ?? source.answer ?? source.finalAnswer ?? deriveAnswer(typeof solution === 'string' ? solution : serializeRichText(solution)),
    difficulty: value.difficulty ?? source.difficulty ?? source.mastery ?? 'foundation',
    skillIds: projectClone(value.skillIds ?? source.skillIds ?? (source.skillId ? [source.skillId] : [])),
    title: value.title ?? source.title ?? null,
    parts: rawParts.map((part, index) => normalizePart(part, index, source)),
    columns: clampColumns(value.columns ?? source.columns ?? (rawParts.length > 1 ? Math.min(rawParts.length, 2) : 1)),
    showInSolutions: value.showInSolutions !== false,
    origin: origin ?? value.origin ?? sourceOf(source),
    source: value.source ?? sourceOf(source),
    hasDiagram: value.hasDiagram ?? source.hasDiagram ?? Boolean(
      source.images?.length || source.diagrams?.length || source.tikz
      || rawParts.some((part) => part?.images?.length || part?.diagrams?.length || part?.tikz)
      || hasTikz(prompt),
    ),
    reviewFlags: [...new Set(value.reviewFlags ?? source.reviewFlags ?? source.uncertainties ?? [])],
  };
}

function normalizeBlock(raw = {}, index = 0) {
  const value = raw ?? {};
  const type = value.type ?? 'rich-text';
  if (type === 'module-ref') return { ...projectClone(value), type, id: value.id ?? stableBookletId('module-ref', value.moduleId ?? index), moduleId: String(value.moduleId ?? ''), layout: projectClone(value.layout ?? {}) };
  if (type === 'question-set') return { ...projectClone(value), type, id: value.id ?? stableBookletId('question-set', index), questionIds: [...(value.questionIds ?? [])].map(String), sort: value.sort ?? 'source', layout: projectClone(value.layout ?? {}) };
  if (type === 'local-block') return { ...projectClone(value), type, id: value.id ?? stableBookletId('local-block', value.block?.id ?? index), block: normalizeBlock(value.block ?? { type: 'rich-text', content: '' }, index), layout: projectClone(value.layout ?? {}) };
  if (type === 'question') return normalizeQuestionBlock(value);
  if (type === 'worked-example') {
    const question = value.question ? normalizeQuestionBlock(value.question, { id: value.question.id }) : normalizeQuestionBlock(value);
    return { ...projectClone(value), type, id: value.id ?? stableBookletId('worked-example', value.title ?? index), question, title: value.title ?? 'Worked example', prompt: question.prompt, solution: question.solution, source: value.source ?? question.source };
  }
  if (type === 'questions') {
    return { ...projectClone(value), type, id: value.id ?? `questions-${index + 1}`, questionIds: [...(value.questionIds ?? [])], questions: (value.questions ?? []).map((question) => normalizeQuestionBlock(question)) };
  }
  if (type === 'image') {
    return { ...projectClone(value), type, id: value.id ?? stableBookletId('image', value.assetId ?? value.src ?? index), assetId: value.assetId ?? null, src: value.src ?? '', widthMm: Number(value.widthMm ?? 120), heightMm: Number(value.heightMm ?? 0), caption: value.caption ?? '', alt: value.alt ?? value.caption ?? 'Booklet image', tikz: value.tikz ?? null, source: sourceOf(value) };
  }
  if (type === 'grid') {
    return { ...projectClone(value), type, id: value.id ?? `grid-${index + 1}`, columns: clampColumns(value.columns, 2), cells: projectClone(value.cells ?? value.rows ?? []), source: sourceOf(value) };
  }
  if (type === 'page-break') return { ...projectClone(value), type, id: value.id ?? `page-break-${index + 1}`, label: value.label ?? '' };
  return {
    ...projectClone(value),
    type,
    id: value.id ?? `${type}-${index + 1}`,
    title: value.title ?? null,
    variant: value.variant ?? null,
    content: value.content !== undefined ? normalizeRichText(value.content) : normalizeRichText(value.text ?? ''),
    source: sourceOf(value),
    reviewFlags: [...new Set(value.reviewFlags ?? [])],
  };
}

function normalizeSection(raw = {}, index = 0) {
  return {
    ...projectClone(raw),
    id: raw.id ?? `section-${index + 1}`,
    title: raw.title ?? `Section ${index + 1}`,
    kicker: raw.kicker ?? '',
    role: SECTION_ROLES.includes(raw.role) ? raw.role : 'teaching',
    blocks: (raw.blocks ?? []).map((block, blockIndex) => normalizeBlock(block, blockIndex)),
  };
}

function normalizeBookletProject(raw = {}) {
  const value = raw ?? {};
  const normalized = {
    ...projectClone(value),
    format: BOOKLET_PROJECT_FORMAT,
    version: BOOKLET_PROJECT_VERSION,
    id: value.id ?? stableBookletId('project', value.title ?? 'untitled'),
    title: value.title ?? 'Untitled booklet',
    subtitle: value.subtitle ?? '',
    sections: (value.sections ?? []).map(normalizeSection),
    assets: projectClone(value.assets ?? {}),
    settings: { includeSolutions: true, showTheorySolutions: true, ...projectClone(value.settings ?? {}) },
    source: projectClone(value.source ?? null),
    status: value.status ?? 'draft',
    updatedAt: value.updatedAt ?? null,
  };
  if (value.format === LEGACY_BOOKLET_PROJECT_FORMAT || Number(value.version) === 2) {
    normalized.migratedFrom = projectClone(value.migratedFrom ?? { format: LEGACY_BOOKLET_PROJECT_FORMAT, version: 2 });
    normalized.sections = normalized.sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => ['module-ref', 'question-set', 'local-block'].includes(block.type)
        ? block
        : normalizeBlock({ type: 'local-block', id: `placement-${block.id}`, block }, 0)),
    }));
  }
  // v1 recipes used a soft target. It is intentionally not part of the v2
  // project contract: page count is measured from live A4 flow instead.
  delete normalized.pageTarget;
  return normalized;
}

export { deepCopy, deriveAnswer, normalizeBlock, normalizeBookletProject, stableBookletId };
