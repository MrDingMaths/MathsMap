import { deepCopy, normalizeBlock, stableBookletId } from './booklet-model.js';

export const TEACHING_MODULE_FORMAT = 'mathsmap-teaching-module-v1';
export const TEACHING_MODULE_VERSION = 1;
export const MODULE_MAPPING_STATUSES = Object.freeze(['mapped', 'cross-skill', 'unmapped']);
export const PEDAGOGY_ROLES = Object.freeze([
  'theory', 'investigation', 'identify', 'worked-example', 'guided-practice', 'key-ideas', 'practice',
]);

function uniqueStrings(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
}

export function normalizeModuleClassification(raw = {}) {
  const value = raw ?? {};
  const primarySkillId = value.primarySkillId ? String(value.primarySkillId) : null;
  const secondarySkillIds = uniqueStrings(value.secondarySkillIds).filter((id) => id !== primarySkillId);
  const requestedStatus = String(value.mappingStatus ?? value.status ?? '').toLowerCase();
  const mappingStatus = MODULE_MAPPING_STATUSES.includes(requestedStatus)
    ? requestedStatus
    : primarySkillId || secondarySkillIds.length ? (secondarySkillIds.length ? 'cross-skill' : 'mapped') : 'unmapped';
  return {
    primarySkillId,
    secondarySkillIds,
    dotPointIds: uniqueStrings(value.dotPointIds),
    mappingStatus,
    mappingNote: String(value.mappingNote ?? value.note ?? ''),
  };
}

function normalizeSequenceItem(raw = {}, index = 0) {
  const value = raw ?? {};
  if (value.type === 'question-ref') {
    return {
      ...deepCopy(value),
      type: 'question-ref',
      id: value.id ?? stableBookletId('module-question', value.questionId ?? index),
      questionId: String(value.questionId ?? ''),
      pedagogyRole: value.pedagogyRole ?? 'guided-practice',
      order: 'fixed',
      layout: deepCopy(value.layout ?? {}),
    };
  }
  const block = normalizeBlock(value.block ?? value, index);
  return {
    ...deepCopy(value),
    type: 'content-block',
    id: value.id ?? block.id,
    pedagogyRole: PEDAGOGY_ROLES.includes(value.pedagogyRole) ? value.pedagogyRole : 'theory',
    block,
  };
}

export function normalizeTeachingModule(raw = {}) {
  const value = raw ?? {};
  const sequence = value.sequence ?? value.blocks ?? [];
  return {
    format: TEACHING_MODULE_FORMAT,
    version: TEACHING_MODULE_VERSION,
    id: value.id ?? stableBookletId('module', value.title ?? 'untitled'),
    status: value.status === 'approved' ? 'approved' : 'draft',
    title: value.title ?? 'Untitled teaching module',
    classification: normalizeModuleClassification(value.classification),
    sequence: sequence.map(normalizeSequenceItem),
    review: deepCopy(value.review ?? { flags: [], history: [] }),
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
  };
}

export function validateTeachingModule(raw, { skillIds = null, dotPointIds = null } = {}) {
  const module = normalizeTeachingModule(raw);
  const errors = [];
  if (raw?.format && raw.format !== TEACHING_MODULE_FORMAT) errors.push(`Unsupported teaching module format: ${raw.format}`);
  if (Number(raw?.version ?? TEACHING_MODULE_VERSION) !== TEACHING_MODULE_VERSION) errors.push(`Unsupported teaching module version: ${raw.version}`);
  if (!module.id) errors.push('Teaching module needs an id');
  if (!String(module.title).trim()) errors.push('Teaching module needs a title');
  if (!module.sequence.length) errors.push('Teaching module needs at least one sequence item');
  const ids = new Set();
  for (const item of module.sequence) {
    if (!item.id) errors.push('Every module sequence item needs an id');
    if (ids.has(item.id)) errors.push(`Duplicate module sequence id: ${item.id}`);
    ids.add(item.id);
    if (item.type === 'question-ref' && !item.questionId) errors.push(`Question reference ${item.id} needs questionId`);
    if (item.type === 'content-block' && !item.block?.type) errors.push(`Content item ${item.id} needs a block`);
  }
  const classification = module.classification;
  if (classification.mappingStatus === 'mapped' && !classification.primarySkillId) errors.push('Mapped module needs primarySkillId');
  if (classification.mappingStatus === 'unmapped' && (classification.primarySkillId || classification.secondarySkillIds.length)) errors.push('Unmapped module cannot name skills');
  if (classification.mappingStatus === 'cross-skill' && !classification.primarySkillId && !classification.secondarySkillIds.length) errors.push('Cross-skill module needs at least one skill');
  if (skillIds) for (const id of [classification.primarySkillId, ...classification.secondarySkillIds].filter(Boolean)) if (!skillIds.has(id)) errors.push(`Unknown module skill id: ${id}`);
  if (dotPointIds) for (const id of classification.dotPointIds) if (!dotPointIds.has(id)) errors.push(`Unknown module dot point id: ${id}`);
  return { valid: errors.length === 0, errors, module };
}
