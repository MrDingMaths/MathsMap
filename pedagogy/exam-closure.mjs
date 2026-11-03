// Per-master Exam coverage closure (3 November 2026, user requested). One
// record per master, built on the current source screen: every pool question
// carries exactly one class, and closure is checked against the project that
// would be (or was) saved. The core functions do no I/O; the CLI reads files
// and writes only to --out. See docs/booklet-exam-completion.md.
//   node pedagogy/exam-closure.mjs skeleton --project-id ID --out FILE [--screen-dir DIR]
//   node pedagogy/exam-closure.mjs check --record FILE --project FILE [--candidate FILE]
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {validateProgrammeExamSection} from './programme-exam.mjs';

export const CLOSURE_KIND = 'mathsmap-exam-closure-v1';
export const DEFAULT_SCREEN_DIR = '.booklet-work/end-goal-20261028/phase4/external-read-campaign/source-rescreen-20261029-v2';
export const CLASSES = ['ineligible', 'duplicate', 'represented', 'selected', 'faulty', 'cosmetic', 'unused-eligible'];
// A cosmetic row keeps its coverage class; cosmetic itself never blocks.
const COVERAGE = CLASSES.filter(name => name !== 'cosmetic');
const SCREEN_INELIGIBLE = new Set(['excluded-provider', 'excluded-difficulty']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const ids = value => Array.isArray(value) && value.length > 0 && value.every(text);

export const coverageClass = row => row?.class === 'cosmetic' ? row.coverageClass : row?.class;

// Problems with one row's own fields. 'pending' is reported by checkClosure.
export function rowProblems(row) {
  const problems = [];
  if (row.class === 'pending') return problems;
  if (!CLASSES.includes(row.class)) return [`unknown class ${JSON.stringify(row.class)}`];
  if (row.class === 'cosmetic') {
    if (!text(row.issue)) problems.push('cosmetic needs issue');
    if (!COVERAGE.includes(row.coverageClass) && row.coverageClass !== 'pending') problems.push('cosmetic needs its underlying coverageClass');
  }
  switch (coverageClass(row)) {
    case 'ineligible': case 'unused-eligible': if (!text(row.basis)) problems.push(`${coverageClass(row)} needs basis`); break;
    case 'duplicate': if (!text(row.duplicateOf)) problems.push('duplicate needs duplicateOf'); break;
    case 'represented': if (!ids(row.representedBy) || !text(row.basis)) problems.push('represented needs representedBy and basis'); break;
    case 'selected': if (!text(row.ownerId)) problems.push('selected needs ownerId'); break;
    case 'faulty':
      if (!text(row.fault)) problems.push('faulty needs a quoted, specific fault');
      if (!['fixed', 'parked'].includes(row.action)) problems.push('faulty needs action fixed or parked');
      break;
  }
  return problems;
}

// screenRows: this master's rows from the current screen, {id, status, ...}.
export function buildClosureSkeleton({projectId, project, projectSha256, screenRows, screen = {}}) {
  if (project?.id !== projectId) throw Error(`Project id ${project?.id} is not ${projectId}`);
  const seen = new Set();
  const rows = screenRows.map(source => {
    if (!text(source.id) || seen.has(source.id)) throw Error(`Screen row id missing or repeated: ${source.id}`);
    seen.add(source.id);
    const row = {id: source.id, screenStatus: source.status};
    for (const key of ['sourceCode', 'difficulty', 'key']) if (source[key] !== undefined) row[key] = source[key];
    if (SCREEN_INELIGIBLE.has(source.status)) Object.assign(row, {class: 'ineligible', basis: `screen:${source.status}`});
    else row.class = 'pending';
    return row;
  });
  return {
    kind: CLOSURE_KIND, projectId,
    liveRevision: project.revision, liveSha256: projectSha256,
    screenFile: screen.file ?? null, screenSha256: screen.sha256 ?? null,
    screenRowCount: rows.length, rows,
  };
}

// mapping: old disposition string -> class, or {class, ...fixed fields}.
// Unmapped strings stay pending and are reported; a class is never guessed.
export function importPriorDispositions(skeleton, priorRows, mapping, {from} = {}) {
  const record = structuredClone(skeleton), byId = new Map(record.rows.map(row => [row.id, row]));
  const report = {imported: 0, unmapped: [], notInScreen: [], screenIneligible: [], incomplete: []};
  for (const prior of priorRows) {
    const id = prior.sourceId ?? prior.id, row = byId.get(id), old = prior.disposition ?? prior.class;
    if (!row) { report.notInScreen.push({id, disposition: old}); continue; }
    // The current screen outranks an old decision about the same question.
    if (row.class === 'ineligible') { report.screenIneligible.push({id, disposition: old}); continue; }
    const target = typeof mapping[old] === 'string' ? {class: mapping[old]} : mapping[old];
    if (!target?.class) { report.unmapped.push({id, disposition: old}); continue; }
    const next = {...row, ...target, prior: {disposition: old, ...(from ? {file: from} : {})}};
    for (const key of ['representedBy', 'basis', 'duplicateOf', 'fault', 'action', 'issue', 'ownerId']) if (prior[key] !== undefined && next[key] === undefined) next[key] = structuredClone(prior[key]);
    if (next.class === 'selected' && next.ownerId === undefined && prior.representedBy?.length === 1) next.ownerId = prior.representedBy[0];
    const problems = rowProblems(next);
    if (problems.length) { report.incomplete.push({id, disposition: old, problems}); continue; }
    Object.assign(row, next);
    report.imported++;
  }
  return {record, report};
}

// A hand disposition. Throws rather than storing an incomplete row.
export function setDisposition(record, id, fields) {
  const row = record.rows.find(item => item.id === id);
  if (!row) throw Error(`No pool row ${id}`);
  if (row.class === 'ineligible' && SCREEN_INELIGIBLE.has(row.screenStatus)) throw Error(`${id} is screen-ineligible`);
  const next = {id: row.id, screenStatus: row.screenStatus, ...pick(row, ['sourceCode', 'difficulty', 'key', 'prior']), ...fields};
  const problems = rowProblems(next);
  if (problems.length || next.class === 'pending') throw Error(`${id}: ${problems.join('; ') || 'class required'}`);
  for (const key of Object.keys(row)) delete row[key];
  Object.assign(row, next);
  return row;
}

// Keep the coverage class and add the cosmetic issue on top of it.
export function markCosmetic(record, id, issue) {
  const row = record.rows.find(item => item.id === id);
  if (!row) throw Error(`No pool row ${id}`);
  if (row.class !== 'cosmetic') { row.coverageClass = row.class; row.class = 'cosmetic'; }
  row.issue = issue;
  return row;
}

const pick = (value, keys) => Object.fromEntries(keys.filter(key => value[key] !== undefined).map(key => [key, value[key]]));
const examSections = project => (project?.sections ?? []).filter(section => section.role === 'exam');
const questionIds = sections => sections.flatMap(section => (section.blocks ?? []).filter(block => block?.type === 'question').map(block => block.id));

// Label-only: the guard's literal source exists and only the printed label differs.
function labelOnly(held) {
  const expected = held.expectedSource, actual = held.actualSource;
  if (!expected || !actual || typeof actual.label !== 'string') return false;
  return (actual.provider === undefined || actual.provider === expected.provider)
    && (actual.year === undefined || String(actual.year) === String(expected.year ?? ''));
}

// isRatingBound is the existing assessment-binding check (verifiedRating);
// practiceBlocks lists ordinary practice for the nonblocking practice report.
export function checkClosure({record, project, projectSha256, candidate, screenRows, screenSha256, isRatingBound, practiceBlocks = () => []}) {
  if (typeof isRatingBound !== 'function') throw Error('isRatingBound (the existing assessment binding check) is required');
  const checked = candidate ?? project, blocking = [], nonBlocking = [];
  const block = (kind, detail = {}) => blocking.push({kind, ...detail}), note = (kind, detail = {}) => nonBlocking.push({kind, ...detail});
  if (record?.kind !== CLOSURE_KIND || record.projectId !== checked?.id) block('record-identity', {projectId: record?.projectId, checked: checked?.id});

  // 1. The pool is the current screen for this master.
  const screenIds = new Set((screenRows ?? []).map(row => row.id)), rowIds = new Set(record.rows.map(row => row.id));
  if (record.screenSha256 !== screenSha256) block('screen-hash', {record: record.screenSha256, screen: screenSha256});
  if (record.rows.length !== screenIds.size || record.screenRowCount !== screenIds.size || rowIds.size !== record.rows.length || [...screenIds].some(id => !rowIds.has(id))) {
    block('screen-count', {rows: record.rows.length, screen: screenIds.size, missing: [...screenIds].filter(id => !rowIds.has(id)).length, extra: [...rowIds].filter(id => !screenIds.has(id)).length});
  }
  const screenStatus = new Map((screenRows ?? []).map(row => [row.id, row.status]));
  for (const row of record.rows) {
    const status = screenStatus.get(row.id);
    if (status !== undefined && row.screenStatus !== status) block('screen-status', {id: row.id, record: row.screenStatus, screen: status});
    if (SCREEN_INELIGIBLE.has(status) && coverageClass(row) !== 'ineligible') block('screen-ineligible-overridden', {id: row.id, class: row.class});
  }

  // 2. Every row has one complete, non-open class.
  for (const row of record.rows) {
    const effective = coverageClass(row);
    if (effective === 'pending' || row.class === 'pending') block('pending', {id: row.id, sourceCode: row.sourceCode});
    else if (effective === 'unused-eligible') block('unused-eligible', {id: row.id, sourceCode: row.sourceCode, basis: row.basis});
    for (const problem of rowProblems(row)) block('row-fields', {id: row.id, problem});
    if (row.class === 'cosmetic') note('cosmetic-row', {id: row.id, issue: row.issue});
    if (effective === 'faulty' && row.action === 'parked') note('faulty-parked', {id: row.id, fault: row.fault});
  }

  // 3. Every named owner exists in the Exam section being checked.
  const sections = examSections(checked), owners = new Set(questionIds(sections));
  const allBlocks = new Set((checked?.sections ?? []).flatMap(section => (section.blocks ?? []).map(item => item.id)));
  const named = new Set();
  for (const row of record.rows) {
    const effective = coverageClass(row);
    const refs = effective === 'selected' ? [row.ownerId] : effective === 'represented' ? row.representedBy ?? [] : [];
    for (const id of refs) { named.add(id); if (!owners.has(id)) block('unknown-owner', {id: row.id, ownerId: id}); }
    if (effective === 'duplicate' && !rowIds.has(row.duplicateOf) && !allBlocks.has(row.duplicateOf)) block('unknown-duplicate', {id: row.id, duplicateOf: row.duplicateOf});
  }
  for (const id of owners) if (!named.has(id)) note('owner-not-named-by-pool', {ownerId: id});

  // 4–5. Guard holds: new owners block; existing owners' attribution is listed.
  if (!sections.length) block('no-exam-section');
  // Existing owners are blocks already in the live project (any section).
  const existing = new Set((project?.sections ?? []).flatMap(section => (section.blocks ?? []).map(item => item.id)));
  for (const section of sections) {
    if (section.workingSpace !== 'none') block('working-space', {sectionId: section.id, workingSpace: section.workingSpace ?? null});
    for (const held of validateProgrammeExamSection(section).held) {
      if (held.id === undefined) { if (!/workingSpace/.test(held.reason)) block('section-guard', {sectionId: section.id, reason: held.reason}); continue; }
      const detail = {ownerId: held.id, reason: held.reason, expected: held.expectedSource?.label, actual: held.actualSource?.label};
      if (!existing.has(held.id)) block('new-owner-guard', detail);
      else if (labelOnly(held)) note('cosmetic-label', detail);
      else note('existing-owner-attribution', detail);
    }
  }

  // 6. Every Exam owner's assessment is bound to its current task.
  for (const section of sections) for (const item of section.blocks ?? []) if (item?.type === 'question' && !isRatingBound(item)) block('rating-unbound', {ownerId: item.id});

  // 7. The record was built on the project being checked.
  if (record.liveRevision !== project?.revision || record.liveSha256 !== projectSha256) block('stale-revision', {record: [record.liveRevision, record.liveSha256], live: [project?.revision, projectSha256]});
  if (candidate && candidate.revision !== project?.revision) block('candidate-base', {candidate: candidate.revision, live: project?.revision});

  // Practice-phase holds never block Exam closure.
  const examIds = new Set(sections.flatMap(section => (section.blocks ?? []).map(item => item.id)));
  const practiceHolds = practiceBlocks(checked).filter(item => !examIds.has(item.id) && !isRatingBound(item)).map(item => item.id);
  if (practiceHolds.length) note('practice-rating', {count: practiceHolds.length, ids: practiceHolds.slice(0, 20)});

  const counts = {}, coverage = {};
  for (const row of record.rows) { counts[row.class] = (counts[row.class] ?? 0) + 1; coverage[coverageClass(row)] = (coverage[coverageClass(row)] ?? 0) + 1; }
  return {closed: blocking.length === 0, blocking, nonBlocking, counts, coverage};
}

// After a guarded save the content is the checked candidate at a new revision.
export function rebaseClosureRecord(record, {revision, sha256, savedFrom}) {
  return {...structuredClone(record), liveRevision: revision, liveSha256: sha256, rebasedFrom: {revision: record.liveRevision, sha256: record.liveSha256, ...(savedFrom ? {publication: savedFrom} : {})}};
}

// ---- I/O helpers and CLI ----
export const sha256File = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
const posix = file => file.replaceAll('\\', '/');

// The per-master v2 screen names this master's rows; the index adds codes.
export function readScreen(projectId, {root = process.cwd(), screenDir = DEFAULT_SCREEN_DIR, withIndex = false} = {}) {
  const file = path.join(root, screenDir, 'masters', projectId + '.json');
  const master = readJson(file), refs = master.questionReferences ?? [];
  if (master.projectId !== projectId) throw Error(`Screen file is for ${master.projectId}`);
  let rows = refs.map(ref => ({id: ref.id, key: ref.key, status: ref.status}));
  if (withIndex) {
    const index = readJson(path.join(root, screenDir, 'question-source-index.json')), byKey = new Map(Object.values(index.questions).map(q => [q.key, q]));
    rows = rows.map(row => { const q = byKey.get(row.key); return {...row, sourceCode: q?.sourceCode, difficulty: q?.difficulty}; });
  }
  return {rows, file: posix(path.relative(root, file)), sha256: sha256File(file), counts: master.counts};
}

export async function defaultBindings() {
  const {verifiedRating, practiceRatingBlocks} = await import('../scripts/booklet/reasoning-ratings.mjs');
  return {isRatingBound: block => verifiedRating(block), practiceBlocks: project => practiceRatingBlocks(project).map(row => row.block)};
}

export async function checkClosureFiles({recordFile, projectFile, candidateFile, root = process.cwd()}) {
  const record = readJson(recordFile), project = readJson(projectFile);
  const screenFile = path.resolve(root, record.screenFile), screen = readJson(screenFile);
  const screenRows = (screen.questionReferences ?? []).map(ref => ({id: ref.id, status: ref.status}));
  return checkClosure({
    record, project, projectSha256: sha256File(projectFile),
    candidate: candidateFile ? readJson(candidateFile) : undefined,
    screenRows, screenSha256: sha256File(screenFile), ...await defaultBindings(),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2), arg = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
  const need = name => arg(name) ?? (() => { throw Error(`${name} is required`); })();
  if (command === 'skeleton') {
    const projectId = need('--project-id'), out = need('--out'), projectFile = path.join('booklets/projects', projectId + '.json');
    const screen = readScreen(projectId, {screenDir: arg('--screen-dir') ?? DEFAULT_SCREEN_DIR, withIndex: true});
    const record = buildClosureSkeleton({projectId, project: readJson(projectFile), projectSha256: sha256File(projectFile), screenRows: screen.rows, screen});
    fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
    fs.writeFileSync(out, JSON.stringify(record, null, 2) + '\n', {flag: 'wx'});
    console.log(JSON.stringify({out, rows: record.rows.length, screen: screen.counts}, null, 2));
  } else if (command === 'check') {
    const result = await checkClosureFiles({recordFile: need('--record'), projectFile: need('--project'), candidateFile: arg('--candidate')});
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.closed ? 0 : 1;
  } else {
    console.error('Usage: exam-closure.mjs skeleton --project-id ID --out FILE | check --record FILE --project FILE [--candidate FILE]');
    process.exitCode = 2;
  }
}
