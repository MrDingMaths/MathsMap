import { deepCopy as copyQuestion, normaliseQuestion } from './practice-question-model.js';
import { normalizeBookletProject } from './booklet-model.js';

export const EDITABLE_BOOKLET_PROJECT_FORMAT = 'mathsmap-booklet-project-v4';
export const EDITABLE_BOOKLET_PROJECT_VERSION = 4;
export const PROJECT_ANSWER_MODES = Object.freeze(['none', 'short', 'worked']);
export const PROJECT_BLOCK_TYPES = Object.freeze([
  'rich-text', 'heading', 'callout', 'image', 'worked-example', 'question',
  'grid', 'page-break', 'spacer', 'narrative',
]);

const clone = (value) => copyQuestion(value);
const text = (value) => String(value ?? '').trim();
const safeSlug = (value, fallback = 'item') => text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback;

function uniqueId(prefix, seed = '') {
  let hash = 2166136261;
  for (const character of `${prefix}|${seed}|${Date.now()}|${Math.random()}`) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${safeSlug(prefix)}-${(hash >>> 0).toString(36)}`;
}

function walk(value, visit, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  visit(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => walk(item, visit, seen));
    else if (child && typeof child === 'object') walk(child, visit, seen);
  }
}

export function findProjectNode(project, id) {
  let found = null;
  walk(project?.sections ?? [], (node) => { if (!found && node?.id === id) found = node; });
  return found;
}

function pointerParts(pointer) {
  return String(pointer ?? '').split('/').slice(1).map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function setPointer(root, pointer, value) {
  const parts = pointerParts(pointer);
  if (!parts.length) throw new Error('A project edit needs a field pointer');
  let target = root;
  for (const part of parts.slice(0, -1)) {
    if (target?.[part] === undefined) throw new Error(`Project edit path does not exist: ${pointer}`);
    target = target[part];
  }
  const key = parts.at(-1);
  if (!target || typeof target !== 'object' || !(key in target)) throw new Error(`Project edit path does not exist: ${pointer}`);
  target[key] = clone(value);
}

function normalizeSettings(raw = {}) {
  return {
    showTheorySolutions: raw.showTheorySolutions !== false,
    practiceAnswers: PROJECT_ANSWER_MODES.includes(raw.practiceAnswers) ? raw.practiceAnswers : 'none',
    showResponseSpaces: raw.showResponseSpaces !== false,
    layoutOverrides: {
      answerSpaces: clone(raw.layoutOverrides?.answerSpaces ?? {}),
      diagramColourModes: clone(raw.layoutOverrides?.diagramColourModes ?? {}),
    },
  };
}

function normalizeV4Block(raw = {}, index = 0) {
  const block = clone(raw ?? {});
  block.type ??= 'rich-text';
  block.id ??= uniqueId(block.type, index);
  if (block.type === 'question') {
    block.snapshotKind = block.snapshotKind === 'bank' ? 'bank' : 'local';
    block.bankRef = block.bankRef?.id ? { id: String(block.bankRef.id), revision: String(block.bankRef.revision ?? '') } : null;
  }
  return block;
}

function normalizeV4Section(raw = {}, index = 0) {
  return {
    ...clone(raw),
    id: raw.id ?? uniqueId('section', index),
    title: raw.title ?? `Section ${index + 1}`,
    role: raw.role ?? 'teaching',
    blocks: (raw.blocks ?? []).map(normalizeV4Block),
  };
}

export function normalizeEditableProject(raw = {}) {
  const value = raw ?? {};
  return {
    ...clone(value),
    format: EDITABLE_BOOKLET_PROJECT_FORMAT,
    version: EDITABLE_BOOKLET_PROJECT_VERSION,
    id: value.id ?? uniqueId('booklet', value.title),
    title: value.title ?? 'Untitled booklet',
    subtitle: value.subtitle ?? '',
    status: value.status ?? 'draft',
    revision: Math.max(0, Number(value.revision) || 0),
    sections: (value.sections ?? []).map(normalizeV4Section),
    assets: clone(value.assets ?? []),
    settings: normalizeSettings(value.settings),
    source: clone(value.source ?? null),
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
  };
}

export function createEditableProject({ id = null, title = 'Untitled booklet', subtitle = '', sections = null, source = null } = {}) {
  return normalizeEditableProject({
    id: id ?? uniqueId('booklet', title),
    title,
    subtitle,
    source,
    sections: sections ?? [{ id: uniqueId('section', title), title: 'First section', role: 'teaching', blocks: [] }],
    settings: {},
    status: 'draft',
  });
}

function sourcePageTitle(page, index) {
  return page?.section?.title || `Page ${page?.pageNumber ?? index + 1}`;
}

function applyAnswerSpaces(value, overrides = {}) {
  walk(value, (node) => {
    if (node?.id && Object.prototype.hasOwnProperty.call(overrides, node.id) && !node.children?.length) {
      node.answerSpaceMm = Math.max(0, Number(overrides[node.id]) || 0);
    }
  });
}

function applyDiagramModes(value, overrides = {}) {
  walk(value, (node) => {
    if (node?.id && Object.prototype.hasOwnProperty.call(overrides, node.id) && ['image', 'svg'].includes(node.format)) {
      node.colourMode = overrides[node.id];
    }
  });
}

function applyDiagramApprovals(value, approvals = {}) {
  walk(value, (node) => {
    if (node?.id && node.format === 'tikz' && approvals[node.id]?.accepted === true) node.reviewStatus = 'approved';
  });
}

export function materializeAcceptedImport(transcription, review = {}, { projectId = null } = {}) {
  if (!transcription?.pages?.length) throw new Error('Accepted import has no transcribed pages');
  const pages = [...transcription.pages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber));
  const sections = pages.map((page, index) => ({
    id: uniqueId('section', `${page.id}-${index}`),
    title: sourcePageTitle(page, index),
    role: page.section?.role ?? 'teaching',
    sourcePageNumber: page.pageNumber,
    sourceSectionId: page.section?.id ?? null,
    blocks: (page.blocks ?? []).map((raw, blockIndex) => {
      const block = normalizeV4Block(raw, blockIndex);
      block.sourcePageNumber = page.pageNumber;
      if (block.type === 'question') {
        block.snapshotKind = 'local';
        block.bankRef = null;
      }
      return block;
    }),
  }));
  const project = normalizeEditableProject({
    id: projectId ?? `project-${safeSlug(transcription.runId ?? transcription.title ?? 'import')}`,
    title: transcription.title || pages.find((page) => page.section?.title)?.section?.title || 'Imported booklet',
    subtitle: transcription.subtitle ?? '',
    source: { type: 'full-booklet-import', runId: transcription.runId ?? review.runId ?? null },
    sections,
    assets: transcription.assets ?? [],
    settings: {
      showTheorySolutions: true,
      practiceAnswers: 'none',
      showResponseSpaces: true,
      layoutOverrides: clone(review.layoutOverrides ?? {}),
    },
  });
  applyAnswerSpaces(project, review.layoutOverrides?.answerSpaces);
  applyDiagramModes(project, review.layoutOverrides?.diagramColourModes);
  applyDiagramApprovals(project, review.diagrams);
  return project;
}

function rekeyTree(value, prefix) {
  const copy = clone(value);
  const idMap = new Map();
  walk(copy, (node) => { if (node?.id) idMap.set(node.id, `${prefix}-${safeSlug(node.id)}`); });
  walk(copy, (node) => {
    if (node?.id && idMap.has(node.id)) node.id = idMap.get(node.id);
    if (node?.overlayOf && idMap.has(node.overlayOf)) node.overlayOf = idMap.get(node.overlayOf);
  });
  return copy;
}

export function snapshotBankQuestion(question, { placementId = null } = {}) {
  const canonical = normaliseQuestion(question);
  const id = placementId ?? uniqueId('question', canonical.id);
  const snapshot = rekeyTree(canonical, id);
  return {
    ...snapshot,
    id,
    type: 'question',
    canonicalId: canonical.id,
    bankRef: { id: canonical.id, revision: '' },
    snapshotKind: 'bank',
  };
}

export function materializeLegacyProject(raw, { bank = [], modules = [] } = {}) {
  if (raw?.format === EDITABLE_BOOKLET_PROJECT_FORMAT || Number(raw?.version) === 4) return normalizeEditableProject(raw);
  const bankMap = bank instanceof Map ? bank : new Map((bank ?? []).map((question) => [question.id, question]));
  const moduleMap = modules instanceof Map ? modules : new Map((modules ?? []).map((module) => [module.id, module]));
  const legacy = normalizeBookletProject(raw);
  const sections = legacy.sections.map((section) => {
    const blocks = [];
    for (const placement of section.blocks) {
      if (placement.type === 'local-block') {
        blocks.push(clone(placement.block));
      } else if (placement.type === 'question-set') {
        for (const questionId of placement.questionIds ?? []) {
          const question = bankMap.get(questionId);
          if (question) blocks.push(snapshotBankQuestion(question));
        }
      } else if (placement.type === 'module-ref') {
        const module = moduleMap.get(placement.moduleId);
        for (const item of module?.sequence ?? []) {
          if (item.type === 'question-ref') {
            const question = bankMap.get(item.questionId);
            if (question) blocks.push(snapshotBankQuestion(question));
          } else if (item.block) blocks.push(clone(item.block));
        }
      } else {
        blocks.push(clone(placement));
      }
    }
    return { ...clone(section), blocks };
  });
  const project = normalizeEditableProject({
    id: legacy.id,
    title: legacy.title,
    subtitle: legacy.subtitle,
    status: legacy.status,
    source: { type: 'project-migration', fromFormat: raw?.format ?? null, fromVersion: raw?.version ?? null, previousSource: clone(raw?.source ?? null) },
    sections,
    settings: legacy.settings,
    assets: legacy.assets,
  });
  project.migratedFrom = { format: raw?.format ?? null, version: Number(raw?.version) || null };
  return project;
}

export function updateProjectContent(project, rootId, pointer, value) {
  const next = normalizeEditableProject(project);
  const root = findProjectNode(next, rootId);
  if (!root) throw new Error(`Project content root is missing: ${rootId}`);
  setPointer(root, pointer, value);
  return next;
}

export function updateProjectSettings(project, patch = {}) {
  const next = normalizeEditableProject(project);
  next.settings = normalizeSettings({ ...next.settings, ...clone(patch), layoutOverrides: { ...next.settings.layoutOverrides, ...(patch.layoutOverrides ?? {}) } });
  return next;
}

function sectionOf(project, sectionId) {
  return project.sections.find((section) => section.id === sectionId) ?? null;
}

export function addProjectSection(project, { afterIndex = null, title = 'New section' } = {}) {
  const next = normalizeEditableProject(project);
  const section = { id: uniqueId('section', title), title, role: 'teaching', blocks: [] };
  const index = afterIndex == null ? next.sections.length : Math.max(0, Math.min(next.sections.length, Number(afterIndex) + 1));
  next.sections.splice(index, 0, section);
  return next;
}

export function moveProjectSection(project, sectionId, delta) {
  const next = normalizeEditableProject(project);
  const from = next.sections.findIndex((section) => section.id === sectionId);
  const to = Math.max(0, Math.min(next.sections.length - 1, from + Number(delta)));
  if (from >= 0 && from !== to) next.sections.splice(to, 0, ...next.sections.splice(from, 1));
  return next;
}

export function deleteProjectSection(project, sectionId) {
  const next = normalizeEditableProject(project);
  if (next.sections.length <= 1) throw new Error('A booklet needs at least one section');
  next.sections = next.sections.filter((section) => section.id !== sectionId);
  return next;
}

export function duplicateProjectSection(project, sectionId) {
  const next = normalizeEditableProject(project);
  const index = next.sections.findIndex((section) => section.id === sectionId);
  if (index < 0) return next;
  const duplicate = rekeyTree(next.sections[index], uniqueId('section-copy', sectionId));
  duplicate.title = `${next.sections[index].title} copy`;
  duplicate.sourcePageNumber = null;
  next.sections.splice(index + 1, 0, duplicate);
  return next;
}

function blankQuestion() {
  const id = uniqueId('question', 'local');
  return {
    id,
    type: 'question',
    title: '',
    pedagogyRole: 'practice',
    classification: { primarySkillId: '', secondarySkillIds: [], reasoningScore: 25, difficulty: 'Development', difficultyReason: 'Author-created booklet question.' },
    content: { id: `${id}-root`, type: 'question', label: null, prompt: 'New question', layout: 'list', columns: null, questionDiagrams: [], children: [], answer: { short: null, worked: 'Add a worked solution.', solutionDiagrams: [] }, answerSpaceMm: 20 },
    bankRef: null,
    snapshotKind: 'local',
  };
}

export function createProjectBlock(type = 'rich-text') {
  const id = uniqueId(type, 'new');
  if (type === 'question') return blankQuestion();
  if (type === 'callout') return { id, type, variant: 'theory', title: 'Theory', content: 'Add theory content.' };
  if (type === 'worked-example') return { id, type, title: 'Worked example', content: 'Add the example prompt.', theorySolution: 'Add the worked solution.' };
  if (type === 'image') return { id, type, src: '', alt: 'Booklet image', caption: '', widthMm: 120 };
  if (type === 'page-break') return { id, type, label: 'Manual page break' };
  if (type === 'spacer') return { id, type, heightMm: 10, label: 'Vertical space' };
  if (type === 'grid') return { id, type: 'rich-text', title: null, content: '| Column 1 | Column 2 |\n| --- | --- |\n|  |  |' };
  if (type === 'heading') return { id, type, title: 'New heading', content: '' };
  return { id, type: 'rich-text', title: null, content: 'Add content.' };
}

export function addProjectBlock(project, sectionId, block, { afterIndex = null } = {}) {
  const next = normalizeEditableProject(project);
  const section = sectionOf(next, sectionId);
  if (!section) throw new Error(`Project section is missing: ${sectionId}`);
  const value = normalizeV4Block(block ?? createProjectBlock(), section.blocks.length);
  const index = afterIndex == null ? section.blocks.length : Math.max(0, Math.min(section.blocks.length, Number(afterIndex) + 1));
  section.blocks.splice(index, 0, value);
  return next;
}

export function moveProjectBlock(project, sectionId, blockId, delta) {
  const next = normalizeEditableProject(project);
  const section = sectionOf(next, sectionId);
  const from = section?.blocks.findIndex((block) => block.id === blockId) ?? -1;
  const to = Math.max(0, Math.min((section?.blocks.length ?? 1) - 1, from + Number(delta)));
  if (section && from >= 0 && from !== to) section.blocks.splice(to, 0, ...section.blocks.splice(from, 1));
  return next;
}

export function deleteProjectBlock(project, sectionId, blockId) {
  const next = normalizeEditableProject(project);
  const section = sectionOf(next, sectionId);
  if (section) section.blocks = section.blocks.filter((block) => block.id !== blockId);
  return next;
}

export function duplicateProjectBlock(project, sectionId, blockId) {
  const next = normalizeEditableProject(project);
  const section = sectionOf(next, sectionId);
  const index = section?.blocks.findIndex((block) => block.id === blockId) ?? -1;
  if (!section || index < 0) return next;
  const duplicate = rekeyTree(section.blocks[index], uniqueId('copy', blockId));
  duplicate.bankRef = clone(section.blocks[index].bankRef ?? null);
  section.blocks.splice(index + 1, 0, duplicate);
  return next;
}

function tableLines(value) {
  const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  const start = lines.findIndex((line, index) => /^\s*\|.*\|\s*$/.test(line) && /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index + 1] ?? ''));
  if (start < 0) throw new Error('The selected block has no Markdown table');
  let end = start + 2;
  while (end < lines.length && /^\s*\|.*\|\s*$/.test(lines[end])) end += 1;
  const cells = (line) => line.trim().slice(1, -1).split('|').map((cell) => cell.trim());
  return { lines, start, end, rows: lines.slice(start, end).map(cells) };
}

function serializeTable(table) {
  return table.map((row) => `| ${row.join(' | ')} |`);
}

export function resizeFirstProjectTable(project, blockId, { rows = 0, columns = 0 } = {}) {
  const next = normalizeEditableProject(project);
  const block = findProjectNode(next, blockId);
  if (!block || typeof block.content !== 'string') throw new Error('Select a text, theory, or worked-example block containing a table');
  const table = tableLines(block.content);
  if (columns > 0) table.rows = table.rows.map((row) => [...row, '']);
  if (columns < 0 && table.rows[0].length > 1) table.rows = table.rows.map((row) => row.slice(0, -1));
  if (rows > 0) table.rows.push(Array.from({ length: table.rows[0].length }, () => ''));
  if (rows < 0 && table.rows.length > 2) table.rows.pop();
  table.rows[1] = table.rows[1].map(() => '---');
  table.lines.splice(table.start, table.end - table.start, ...serializeTable(table.rows));
  block.content = table.lines.join('\n');
  return next;
}

export function resizeQuestionParts(project, blockId, delta) {
  const next = normalizeEditableProject(project);
  const block = findProjectNode(next, blockId);
  if (!block || block.type !== 'question' || !block.content) throw new Error('Select a question block');
  const root = block.content;
  root.children ??= [];
  if (Number(delta) > 0) {
    if (!root.children.length) {
      const first = {
        id: `${root.id}-a`, type: 'part', label: 'a', prompt: root.prompt ?? '', layout: 'list', columns: null,
        questionDiagrams: clone(root.questionDiagrams ?? []), children: [], answer: clone(root.answer ?? { short: null, worked: '', solutionDiagrams: [] }), answerSpaceMm: root.answerSpaceMm ?? 20,
      };
      root.prompt = '';
      root.questionDiagrams = [];
      delete root.answer;
      delete root.answerSpaceMm;
      root.children.push(first);
    }
    const index = root.children.length;
    root.children.push({ id: `${root.id}-${String.fromCharCode(97 + index)}`, type: 'part', label: String.fromCharCode(97 + index), prompt: 'New part', layout: 'list', columns: null, questionDiagrams: [], children: [], answer: { short: null, worked: 'Add a worked solution.', solutionDiagrams: [] }, answerSpaceMm: 20 });
  } else if (root.children.length > 1) {
    root.children.pop();
  } else if (root.children.length === 1) {
    const only = root.children[0];
    root.prompt = only.prompt;
    root.questionDiagrams = clone(only.questionDiagrams ?? []);
    root.answer = clone(only.answer);
    root.answerSpaceMm = only.answerSpaceMm;
    root.children = [];
  }
  root.children.forEach((part, index) => { part.label = String.fromCharCode(97 + index); });
  return next;
}

export function collectProjectQuestions(project) {
  const questions = [];
  walk(normalizeEditableProject(project).sections, (node) => {
    if (node?.type === 'question' && node.content?.type === 'question') questions.push(node);
  });
  return questions;
}

export function validateEditableProject(raw) {
  const errors = [];
  if (raw?.format !== EDITABLE_BOOKLET_PROJECT_FORMAT) errors.push(`Project format must be ${EDITABLE_BOOKLET_PROJECT_FORMAT}`);
  if (Number(raw?.version) !== EDITABLE_BOOKLET_PROJECT_VERSION) errors.push('Project version must be 4');
  if (!text(raw?.id)) errors.push('Project needs an id');
  if (!text(raw?.title)) errors.push('Project needs a title');
  if (!Array.isArray(raw?.sections) || !raw.sections.length) errors.push('Project needs at least one section');
  const ids = new Set();
  walk(raw?.sections ?? [], (node) => {
    if (!node?.id) return;
    if (ids.has(node.id)) errors.push(`Duplicate project node id: ${node.id}`);
    ids.add(node.id);
  });
  for (const section of raw?.sections ?? []) {
    if (!text(section.title)) errors.push(`Section ${section.id ?? '?'} needs a title`);
    if (!Array.isArray(section.blocks)) errors.push(`Section ${section.id ?? '?'} needs blocks`);
    for (const block of section.blocks ?? []) if (!PROJECT_BLOCK_TYPES.includes(block.type)) errors.push(`Unsupported project block type: ${block.type}`);
  }
  return { valid: errors.length === 0, errors, project: normalizeEditableProject(raw) };
}
