// Explicit programme candidate authoring only. No load/save hook or migration.
import {approvedMathsBaseSource, isQuestionSource} from '../src/lib/question-source.js';
import {sourceFromBookletTitle} from '../scripts/booklet/regroup-exam-sections.mjs';

const canonical = value => value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
function expectedSource(block) {
  const code = block.sourceReview?.origin?.sourceCode;
  if (code !== undefined) {
    const source = approvedMathsBaseSource(code);
    if (!source || source.needsSchoolMapping || !source.label) return {reason: 'literal source code is excluded, unknown or needs an approved school mapping', sourceCode: code};
    return {source};
  }
  // Reuse the accepted explicit booklet-title/undated-sample parser, without
  // letting its existing-source fast path trust a caller's arbitrary label.
  const source = sourceFromBookletTitle({title: block.title});
  return source ? {source} : {reason: 'literal source code or recognised original booklet attribution is required'};
}

export function validateProgrammeExamSection(section) {
  const held = [];
  if (section?.role !== 'exam' || section?.phase !== 'practice') held.push({sectionId: section?.id, reason: 'programme Exam section must have role exam and phase practice'});
  if (section?.workingSpace !== 'none') held.push({sectionId: section?.id, reason: 'programme Exam acceptance requires explicit workingSpace: none'});
  const questions = (section?.blocks ?? []).filter(block => block.type === 'question');
  if (!questions.length) held.push({sectionId: section?.id, reason: 'programme Exam section has no question owners'});
  for (const block of questions) {
    const expected = expectedSource(block);
    if (!expected.source) { held.push({id: block.id, ...expected}); continue; }
    if (!isQuestionSource(block.source) || !same(block.source, expected.source)) {
      held.push({id: block.id, reason: 'printed attribution differs from the approved literal source formatter', expectedSource: expected.source, actualSource: structuredClone(block.source ?? null)});
    }
  }
  return {valid: held.length === 0, status: held.length ? 'held' : 'accepted-presentation', held};
}

export function createProgrammeExamSection(options) {
  const section = structuredClone(options);
  section.role ??= 'exam';
  section.phase ??= 'practice';
  section.workingSpace ??= 'none';
  for (const block of section.blocks ?? []) {
    if (block.type !== 'question' || block.source != null) continue;
    const expected = expectedSource(block);
    if (expected.source) block.source = expected.source;
  }
  const report = validateProgrammeExamSection(section);
  return {section: report.valid ? section : null, report};
}

// One-off authoring wrappers use this before writing a new candidate. Ambiguity
// is an explicit held error, never permission to emit an unqualified section.
export function requireProgrammeExamSection(options) {
  const result = createProgrammeExamSection(options);
  if (!result.section) {
    const error = new Error('Programme Exam candidate held: ' + result.report.held.map(row => `${row.id ?? row.sectionId}: ${row.reason}`).join('; '));
    error.held = result.report.held;
    throw error;
  }
  return result.section;
}
