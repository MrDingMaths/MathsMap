// Shared data and selection rules for the local Booklet Studio.
//
// The student app stores atomic skill content as arrays without item IDs. The
// adapter below gives those records deterministic IDs for the print bank while
// accepting the richer records that the importer will produce later.

import { normalizeRichText, richTextToPlainText, serializeRichText } from './maths-editor.js';

export const BOOKLET_PROJECT_FORMAT = 'mathsmap-booklet-project-v2';
export const BOOKLET_PROJECT_VERSION = 2;
export const BOOKLET_IMPORT_FORMAT = 'mathsmap-booklet-import-v2';
export const PAGE_HEIGHT_MM = 257;
export const PAGE_WIDTH_MM = 210;

export const DIFFICULTY_ORDER = Object.freeze({
  foundation: 1,
  development: 2,
  mastery: 3,
  challenge: 4,
});

export const RESPONSE_SPACE_MM = Object.freeze({
  none: 0,
  compact: 12,
  standard: 25,
  extended: 46,
  full: 84,
});

export const BLOCK_TYPES = Object.freeze([
  'rich-text', 'heading', 'callout', 'image', 'worked-example',
  'question', 'grid', 'page-break', 'narrative', 'questions'
]);

const TIER_NAMES = ['foundation', 'development', 'mastery'];

export function stableQuestionId(skillId, tier, index) {
  return `${skillId}:${tier}:${index + 1}`;
}

function countLines(value) {
  return richTextToPlainText(value).split(/\r?\n/).filter((line) => line.trim()).length;
}

export function hasTikz(value) {
  return richTextToPlainText(value).includes('[tikz]');
}

export function suggestSolutionMode(question) {
  if (question.solutionMode === 'worked' || question.solutionMode === 'answer') return question.solutionMode;
  const lines = countLines(question.solution ?? question.solution_text);
  const multipart = Array.isArray(question.parts) && question.parts.length > 1;
  return lines >= 5 || multipart || hasTikz(question.prompt ?? question.question_text) ? 'worked' : 'answer';
}

export function suggestResponseSpace(question) {
  if (question.responseSpace && RESPONSE_SPACE_MM[question.responseSpace] !== undefined) return question.responseSpace;
  const lines = countLines(question.solution ?? question.solution_text);
  const multipart = Array.isArray(question.parts) && question.parts.length > 1;
  if (multipart || lines >= 10) return 'full';
  if (hasTikz(question.prompt ?? question.question_text) || lines >= 6) return 'extended';
  if (lines >= 3) return 'standard';
  return 'compact';
}

export function deriveAnswer(solution) {
  const lines = String(solution ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const last = lines.at(-1) ?? '';
  return last.replace(/^\$\s*=\s*/, '$').replace(/\s*\$$/, '$').replace(/^=\s*/, '').trim();
}

export function normalizeQuestion(raw, {
  skillId = raw.skillId,
  tier = raw.difficulty ?? raw.mastery ?? 'foundation',
  index = 0,
  source = null,
} = {}) {
  const prompt = raw.prompt ?? raw.question_text ?? raw.question ?? '';
  const solution = raw.solution ?? raw.solution_text ?? '';
  const normalizedTier = String(tier).toLowerCase();
  const id = raw.id ?? (skillId ? stableQuestionId(skillId, normalizedTier, index) : `imported:${index + 1}`);
  const question = {
    ...raw,
    id,
    prompt,
    solution,
    structure: raw.structure ?? null,
    difficulty: raw.difficulty ?? normalizedTier,
    skillIds: raw.skillIds ?? (skillId ? [skillId] : []),
    source: raw.source ?? source ?? (skillId ? { type: 'mathsmap', skillId, tier: normalizedTier, index: index + 1 } : null),
  };
  question.solutionMode = raw.solutionMode ?? suggestSolutionMode(question);
  question.responseSpace = raw.responseSpace ?? suggestResponseSpace(question);
  question.answer = raw.answer ?? raw.finalAnswer ?? deriveAnswer(solution);
  question.hasDiagram = raw.hasDiagram ?? (hasTikz(prompt) || hasTikz(solution));
  return question;
}

export function normalizeContentFile(skillId, payload) {
  const bank = [];
  for (const tier of TIER_NAMES) {
    const questions = payload?.practice?.[tier] ?? [];
    questions.forEach((raw, index) => bank.push(normalizeQuestion(raw, { skillId, tier, index })));
  }
  return bank;
}

export function normalizeBank(records) {
  const values = records instanceof Map ? [...records.values()] : records ?? [];
  const result = new Map();
  for (const raw of values) {
    const question = raw.prompt ? raw : normalizeQuestion(raw);
    if (result.has(question.id)) throw new Error(`Duplicate booklet question id: ${question.id}`);
    result.set(question.id, question);
  }
  return result;
}

export function matchesDifficulty(question, maxDifficulty = 'mastery') {
  if (!maxDifficulty || maxDifficulty === 'all') return true;
  return (DIFFICULTY_ORDER[question.difficulty] ?? 99) <= (DIFFICULTY_ORDER[maxDifficulty] ?? 99);
}

function overrideFor(overrides, id, fallback) {
  if (!overrides) return fallback;
  if (overrides instanceof Map) return overrides.get(id) ?? fallback;
  return overrides[id] ?? fallback;
}

export function resolveRecipe(recipe, bankInput, options = {}) {
  const bank = normalizeBank(bankInput);
  const maxDifficulty = options.maxDifficulty ?? 'all';
  const pinned = new Set([...(recipe.pinnedQuestionIds ?? []), ...(options.pinnedQuestionIds ?? [])]);
  const solutionModeOverrides = options.solutionModeOverrides ?? recipe.solutionModeOverrides;
  const spaceOverrides = options.spaceOverrides ?? recipe.spaceOverrides;
  const missing = [];
  const selectedIds = [];
  const seen = new Set();
  let questionCount = 0;

  const sections = (recipe.sections ?? []).map((section, sectionIndex) => {
    let sectionQuestion = 0;
    const blocks = (section.blocks ?? []).map((block) => {
      if (block.type === 'questions') {
        const questions = [];
        for (const id of block.questionIds ?? []) {
          const raw = bank.get(id);
          if (!raw) { missing.push(id); continue; }
          if (!pinned.has(id) && !matchesDifficulty(raw, maxDifficulty)) continue;
          sectionQuestion += 1;
          questionCount += 1;
          selectedIds.push(id);
          if (seen.has(id)) missing.push(`duplicate:${id}`);
          seen.add(id);
          questions.push({
            ...raw,
            number: `${sectionIndex + 1}.${sectionQuestion}`,
            solutionMode: overrideFor(solutionModeOverrides, id, raw.solutionMode),
            responseSpace: overrideFor(spaceOverrides, id, raw.responseSpace),
          });
        }
        return { ...block, questions };
      }
      if (block.type === 'worked-example' && block.questionId) {
        const raw = bank.get(block.questionId);
        if (!raw) { missing.push(block.questionId); return { ...block, question: null }; }
        return { ...block, question: { ...raw, solutionMode: 'worked', responseSpace: 'none' } };
      }
      return { ...block };
    });
    return { ...section, number: sectionIndex + 1, blocks };
  });

  const warnings = missing.map((id) => id.startsWith('duplicate:')
    ? `Question appears more than once: ${id.slice('duplicate:'.length)}`
    : `Question is missing from the loaded bank: ${id}`);
  return {
    ...recipe,
    sections,
    selectedIds,
    questionCount,
    missing,
    warnings,
    solutions: sections.flatMap((section) => section.blocks.filter((block) => block.type === 'questions').flatMap((block) => block.questions)),
  };
}

export function estimateQuestionHeightMm(question, { includeSolution = false } = {}) {
  const promptLines = countLines(question.prompt);
  const solutionLines = includeSolution ? countLines(question.solution) : 0;
  const diagram = question.hasDiagram ? 56 : 0;
  const parts = Array.isArray(question.parts) ? question.parts.length * 5 : 0;
  const space = RESPONSE_SPACE_MM[question.responseSpace] ?? RESPONSE_SPACE_MM.standard;
  return 13 + (promptLines * 4.2) + (solutionLines * 3.5) + parts + diagram + space;
}

export function estimateRecipePages(resolved, { pageHeightMm = 257, includeSolutions = true } = {}) {
  let height = 38;
  for (const section of resolved.sections ?? []) {
    height += 18;
    for (const block of section.blocks ?? []) {
      if (block.type === 'questions') {
        height += 12;
        for (const question of block.questions ?? []) height += estimateQuestionHeightMm(question);
      } else if (block.type === 'worked-example') {
        height += estimateQuestionHeightMm(block.question ?? {}, { includeSolution: true }) + 8;
      } else {
        height += 18 + countLines(block.content) * 3.8;
      }
    }
  }
  if (includeSolutions) {
    height += 24;
    for (const question of resolved.solutions ?? []) height += estimateQuestionHeightMm({ ...question, responseSpace: 'none' }, { includeSolution: true });
  }
  return Math.max(1, Math.ceil(height / pageHeightMm));
}

export function validateRecipe(recipe) {
  const errors = [];
  if (!recipe?.id) errors.push('Recipe needs an id');
  if (!recipe?.title) errors.push('Recipe needs a title');
  if (!Array.isArray(recipe?.sections) || !recipe.sections.length) errors.push('Recipe needs at least one section');
  for (const [index, section] of (recipe.sections ?? []).entries()) {
    if (!section.id) errors.push(`Section ${index + 1} needs an id`);
    for (const block of section.blocks ?? []) {
      if (!block.type) errors.push(`Section ${index + 1} contains a block without a type`);
      if (block.type === 'questions' && !Array.isArray(block.questionIds)) errors.push(`Question block in section ${index + 1} needs questionIds`);
    }
  }
  return errors;
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

export function deepCopy(value) {
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

export function stableBookletId(prefix, seed = '') {
  return `${slug(prefix)}-${slug(seed).slice(0, 42)}-${hash(seed)}`;
}

export function clampColumns(value, fallback = 1) {
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

export function normalizePart(raw = {}, index = 0, parent = {}) {
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

export function normalizeQuestionBlock(raw = {}, { id = null, origin = null } = {}) {
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

export function normalizeBlock(raw = {}, index = 0) {
  const value = raw ?? {};
  const type = value.type ?? 'rich-text';
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
    blocks: (raw.blocks ?? []).map((block, blockIndex) => normalizeBlock(block, blockIndex)),
  };
}

export function normalizeBookletProject(raw = {}) {
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
    settings: { includeSolutions: true, ...projectClone(value.settings ?? {}) },
    source: projectClone(value.source ?? null),
    status: value.status ?? 'draft',
    updatedAt: value.updatedAt ?? null,
  };
  // v1 recipes used a soft target. It is intentionally not part of the v2
  // project contract: page count is measured from live A4 flow instead.
  delete normalized.pageTarget;
  return normalized;
}

export function createBookletProject({ id, title, subtitle = '', sections = [], ...rest } = {}) {
  return normalizeBookletProject({ ...rest, id: id ?? stableBookletId('project', title ?? 'untitled'), title: title ?? 'Untitled booklet', subtitle, sections });
}

export function makeQuestionBlock(question, { copyIndex = 0, origin = null } = {}) {
  const normalized = normalizeQuestionBlock(projectClone(question), { origin: origin ?? sourceOf(question) });
  const base = normalized.id || normalized.questionId || normalized.prompt;
  normalized.id = copyIndex ? `${stableBookletId('question', base)}-copy-${copyIndex + 1}` : stableBookletId('question', base);
  normalized.questionId = question.id ?? normalized.questionId ?? null;
  normalized.origin = origin ?? normalized.origin ?? {
    type: 'mathsmap',
    questionId: question.id ?? null,
    skillIds: projectClone(question.skillIds ?? []),
  };
  return normalized;
}

export function recipeToProject(recipe, bankInput = new Map()) {
  const bank = normalizeBank(bankInput);
  const sections = (recipe?.sections ?? []).map((section) => {
    const blocks = [];
    for (const block of section.blocks ?? []) {
      if (block.type === 'questions') {
        (block.questionIds ?? []).forEach((id, index) => {
          const question = bank.get(id);
          if (question) blocks.push(makeQuestionBlock(question, { copyIndex: index }));
          else blocks.push({ type: 'question', id: stableBookletId('missing-question', id), questionId: id, prompt: normalizeRichText(`Missing question ${id}`), solution: normalizeRichText(''), answer: '', difficulty: 'foundation', skillIds: [], parts: [normalizePart({ content: `Missing question ${id}`, answerSpaceMm: 25 })], columns: 1, reviewFlags: ['missing-bank-question'], origin: { type: 'recipe', recipeId: recipe.id, questionId: id } });
        });
      } else if (block.type === 'worked-example') {
        const question = bank.get(block.questionId);
        const questionBlock = question ? makeQuestionBlock(question, { origin: { type: 'mathsmap', questionId: block.questionId } }) : normalizeQuestionBlock({ id: block.questionId, prompt: `Missing worked example ${block.questionId}` });
        blocks.push({ type: 'worked-example', id: block.id ?? stableBookletId('worked-example', block.questionId ?? block.title), title: block.title ?? 'Worked example', question: questionBlock, source: block.source ?? null });
      } else if (block.type === 'narrative') {
        blocks.push({ type: 'rich-text', id: block.id ?? stableBookletId('narrative', block.title ?? blocks.length), style: 'narrative', title: block.title ?? null, content: normalizeRichText(block.content ?? '') });
      } else {
        blocks.push(normalizeBlock(block, blocks.length));
      }
    }
    return { ...section, blocks };
  });
  return normalizeBookletProject({
    id: recipe?.id,
    title: recipe?.title,
    subtitle: recipe?.subtitle,
    version: BOOKLET_PROJECT_VERSION,
    sections,
    settings: { includeSolutions: true },
    source: { type: 'recipe', recipeId: recipe?.id, version: recipe?.version ?? null },
  });
}

export function numberProject(project) {
  const value = normalizeBookletProject(project);
  const sections = value.sections.map((section, sectionIndex) => {
    let questionIndex = 0;
    const blocks = section.blocks.map((block) => {
      if (block.type === 'question') {
        questionIndex += 1;
        const number = `${sectionIndex + 1}.${questionIndex}`;
        return { ...block, number, parts: block.parts.map((part, partIndex) => ({ ...part, number: block.parts.length > 1 ? `${number}(${part.label ?? String.fromCharCode(97 + partIndex)})` : null })) };
      }
      if (block.type === 'worked-example' && block.question) return { ...block, question: { ...block.question, number: null } };
      if (block.type === 'questions') return { ...block, questions: (block.questions ?? []).map((question) => {
        questionIndex += 1;
        const number = `${sectionIndex + 1}.${questionIndex}`;
        return { ...question, number, parts: (question.parts ?? []).map((part, partIndex) => ({ ...part, number: question.parts.length > 1 ? `${number}(${part.label ?? String.fromCharCode(97 + partIndex)})` : null })) };
      }) };
      return block;
    });
    return { ...section, number: sectionIndex + 1, blocks };
  });
  return { ...value, sections };
}

export function resolveProject(project, bankInput = new Map(), { includeSolutions = true } = {}) {
  const bank = normalizeBank(bankInput);
  const base = normalizeBookletProject(project);
  const sections = base.sections.map((section) => {
    const blocks = [];
    for (const block of section.blocks) {
      if (block.type === 'questions') {
        for (const id of block.questionIds ?? []) {
          const question = bank.get(id);
          if (question) blocks.push(makeQuestionBlock(question));
        }
      } else {
        blocks.push(block);
      }
    }
    return { ...section, blocks };
  });
  const numbered = numberProject({ ...base, sections });
  const questions = numbered.sections.flatMap((section) => section.blocks.flatMap((block) => {
    if (block.type === 'question') return [block];
    if (block.type === 'questions') return block.questions ?? [];
    return [];
  }));
  return { ...numbered, questionCount: questions.length, selectedIds: questions.map((question) => question.questionId ?? question.id), solutions: includeSolutions ? questions.filter((question) => question.showInSolutions !== false) : [], warnings: questions.flatMap((question) => question.reviewFlags ?? []) };
}

export function projectQuestions(project) {
  return normalizeBookletProject(project).sections.flatMap((section) => section.blocks.flatMap((block) => block.type === 'question' ? [block] : block.type === 'questions' ? block.questions ?? [] : []));
}

export function addQuestionsToSection(project, sectionId, questions, { index = null } = {}) {
  const value = normalizeBookletProject(project);
  const section = value.sections.find((item) => item.id === sectionId) ?? value.sections[0];
  if (!section) return value;
  const copiesByQuestion = new Map();
  for (const candidateSection of value.sections) for (const block of candidateSection.blocks) {
    if (block.type === 'question' && block.questionId) copiesByQuestion.set(block.questionId, (copiesByQuestion.get(block.questionId) ?? 0) + 1);
    if (block.type === 'questions') for (const question of block.questions ?? []) if (question.questionId) copiesByQuestion.set(question.questionId, (copiesByQuestion.get(question.questionId) ?? 0) + 1);
  }
  const additions = (questions ?? []).map((question) => {
    const copyIndex = copiesByQuestion.get(question.id) ?? 0;
    copiesByQuestion.set(question.id, copyIndex + 1);
    return makeQuestionBlock(question, { copyIndex, origin: { type: 'mathsmap', questionId: question.id ?? null, skillIds: projectClone(question.skillIds ?? []) } });
  });
  const at = index == null ? section.blocks.length : Math.max(0, Math.min(section.blocks.length, index));
  section.blocks.splice(at, 0, ...additions);
  return normalizeBookletProject(value);
}

export function insertLibraryContent(project, sectionId, master, origin = {}) {
  const value = normalizeBookletProject(project);
  const section = value.sections.find((item) => item.id === sectionId) ?? value.sections[0];
  if (!section) return value;
  const masters = Array.isArray(master) ? master : [master];
  const usedIds = new Set(section.blocks.map((block) => block.id));
  const copies = masters.map((item, index) => {
    const copy = normalizeBlock(deepCopy(item), section.blocks.length + index);
    const baseId = copy.id;
    let copyId = `${baseId}-copy-${hash(`${value.id}:${section.id}:${baseId}:${section.blocks.length + index}`)}`;
    let suffix = 2;
    while (usedIds.has(copyId)) copyId = `${baseId}-copy-${hash(`${value.id}:${section.id}:${baseId}:${section.blocks.length + index}`)}-${suffix++}`;
    copy.id = copyId;
    usedIds.add(copyId);
    copy.origin = { type: 'library', masterId: item.id ?? null, ...projectClone(origin) };
    return copy;
  });
  section.blocks.push(...copies);
  return normalizeBookletProject(value);
}

export function reorderProjectBlock(project, sectionId, fromIndex, toIndex) {
  const value = normalizeBookletProject(project);
  const section = value.sections.find((item) => item.id === sectionId);
  if (!section || fromIndex < 0 || fromIndex >= section.blocks.length) return value;
  const [block] = section.blocks.splice(fromIndex, 1);
  section.blocks.splice(Math.max(0, Math.min(section.blocks.length, toIndex)), 0, block);
  return value;
}

export function reorderProjectSections(project, fromIndex, toIndex) {
  const value = normalizeBookletProject(project);
  if (fromIndex < 0 || fromIndex >= value.sections.length) return value;
  const [section] = value.sections.splice(fromIndex, 1);
  value.sections.splice(Math.max(0, Math.min(value.sections.length, toIndex)), 0, section);
  return value;
}

export function wrapMultipartParts(parts = [], columns = 1) {
  const width = clampColumns(columns);
  const rows = [];
  for (let index = 0; index < parts.length; index += width) rows.push(parts.slice(index, index + width));
  return rows;
}

export function filterQuestionBank(records, filters = {}) {
  const values = records instanceof Map ? [...records.values()] : records ?? [];
  const query = String(filters.text ?? filters.search ?? '').trim().toLowerCase();
  return values.filter((question) => {
    if (!matchesDifficulty(question, filters.difficulty ?? filters.maxDifficulty ?? 'all')) return false;
    const list = (question[filters.courseKey ?? 'courses'] ?? question.courseIds ?? question.course ?? []);
    if (filters.course && !(Array.isArray(list) ? list : [list]).includes(filters.course)) return false;
    const topics = question.topicIds ?? question.topics ?? question.topic ?? [];
    if (filters.topic && !(Array.isArray(topics) ? topics : [topics]).includes(filters.topic)) return false;
    const skills = question.skillIds ?? (question.skillId ? [question.skillId] : []);
    if (filters.skill && !skills.includes(filters.skill)) return false;
    const source = JSON.stringify(question.source ?? question.origin ?? '').toLowerCase();
    if (filters.source && !source.includes(String(filters.source).toLowerCase())) return false;
    if (query) {
      const haystack = `${question.id ?? ''} ${question.title ?? ''} ${richTextToPlainText(question.prompt ?? question.question_text ?? '')} ${question.structure ?? ''} ${source}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function projectStats(project, pageCount = null) {
  const questions = projectQuestions(project);
  return {
    sections: normalizeBookletProject(project).sections.length,
    blocks: normalizeBookletProject(project).sections.reduce((total, section) => total + section.blocks.length, 0),
    questions: questions.length,
    parts: questions.reduce((total, question) => total + question.parts.length, 0),
    pages: pageCount,
  };
}

export function validateBookletProject(project) {
  const value = project ?? {};
  const errors = [];
  if (value.format && value.format !== BOOKLET_PROJECT_FORMAT) errors.push(`Unsupported booklet format: ${value.format}`);
  if (value.version && Number(value.version) > BOOKLET_PROJECT_VERSION) errors.push(`Unsupported booklet version: ${value.version}`);
  if (!value.id) errors.push('Project needs an id');
  if (!value.title) errors.push('Project needs a title');
  if ('pageTarget' in value) errors.push('Soft page targets are not supported; use live A4 page count');
  if (!Array.isArray(value.sections) || !value.sections.length) errors.push('Project needs at least one section');
  const sectionIds = new Set();
  const blockIds = new Set();
  for (const [sectionIndex, section] of (value.sections ?? []).entries()) {
    if (!section.id) errors.push(`Section ${sectionIndex + 1} needs an id`);
    if (sectionIds.has(section.id)) errors.push(`Duplicate section id: ${section.id}`);
    sectionIds.add(section.id);
    for (const [blockIndex, block] of (section.blocks ?? []).entries()) {
      if (!BLOCK_TYPES.includes(block.type)) errors.push(`Unknown block type ${block.type} in section ${sectionIndex + 1}`);
      if (!block.id) errors.push(`Block ${sectionIndex + 1}.${blockIndex + 1} needs an id`);
      if (blockIds.has(block.id)) errors.push(`Duplicate block id: ${block.id}`);
      blockIds.add(block.id);
      if (block.type === 'question') {
        if (!Array.isArray(block.parts) || !block.parts.length) errors.push(`Question ${block.id} needs at least one part`);
        if (block.columns !== undefined && clampColumns(block.columns) !== Number(block.columns)) errors.push(`Question ${block.id} columns must be between 1 and 4`);
        for (const part of block.parts ?? []) if (Number(part.answerSpaceMm) < 0) errors.push(`Question ${block.id} has negative answer space`);
      }
      if (block.type === 'grid' && block.columns !== undefined && clampColumns(block.columns) !== Number(block.columns)) errors.push(`Grid ${block.id} columns must be between 1 and 4`);
    }
  }
  if (value.status === 'published' && value.review?.pages?.some((page) => page.accepted !== true)) errors.push('Project cannot be published with unaccepted review pages');
  return errors;
}

export function estimateProjectPages(project, { pageHeightMm = PAGE_HEIGHT_MM, includeSolutions = true } = {}) {
  const resolved = resolveProject(project, new Map(), { includeSolutions });
  let pageHeight = 0;
  let pages = 1;
  const add = (height) => {
    const value = Math.max(0, Number(height) || 0);
    if (pageHeight && pageHeight + value > pageHeightMm) { pages += 1; pageHeight = 0; }
    pageHeight += value;
  };
  for (const section of resolved.sections) {
    add(22);
    for (const block of section.blocks) {
      if (block.type === 'page-break') { pages += 1; pageHeight = 0; continue; }
      if (block.type === 'question') add(estimateQuestionHeightMm({ prompt: richTextToPlainText(block.prompt), solution: richTextToPlainText(block.solution), parts: block.parts, hasDiagram: block.hasDiagram, responseSpace: 'standard' }));
      else if (block.type === 'worked-example') add(estimateQuestionHeightMm({ prompt: richTextToPlainText(block.question?.prompt), solution: richTextToPlainText(block.question?.solution), parts: block.question?.parts, hasDiagram: block.question?.hasDiagram, responseSpace: 'none' }, { includeSolution: true }) + 10);
      else add(12 + countLines(richTextToPlainText(block.content)) * 4);
    }
  }
  if (includeSolutions && resolved.solutions.length) { add(24); resolved.solutions.forEach((question) => add(estimateQuestionHeightMm({ prompt: richTextToPlainText(question.prompt), solution: richTextToPlainText(question.solution), parts: question.parts, responseSpace: 'none' }, { includeSolution: true }))); }
  return Math.max(1, pages);
}
