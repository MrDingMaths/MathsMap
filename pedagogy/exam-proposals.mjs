// One open Exam proposal per master (3 November 2026, user requested). Adding
// or replacing questions amends the open proposal, so James has one question
// per master. Sealed *-unsent-*.json files are history and are never rewritten.
// See docs/booklet-exam-completion.md.
//   node pedagogy/exam-proposals.mjs list [--open]
//   node pedagogy/exam-proposals.mjs show --project-id ID
//   node pedagogy/exam-proposals.mjs open --project-id ID --from-revision N --candidate FILE
//     --owners a,b --closure FILE [--amend] [--note TEXT]
//   node pedagogy/exam-proposals.mjs withdraw --project-id ID --reason TEXT
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const PROPOSAL_KIND = 'mathsmap-exam-proposal-v1';
export const DEFAULT_REGISTRY = '.booklet-work/end-goal-20261028/exam-proposals';
const sha = /^[a-f0-9]{64}$/;
const snapshot = entry => ({fromRevision: entry.fromRevision, candidateFile: entry.candidateFile, candidateSha256: entry.candidateSha256, ownerIds: [...entry.ownerIds], closureRecord: entry.closureRecord});

function checkInput(input) {
  if (!/^[a-zA-Z0-9._-]+$/.test(input.projectId ?? '')) throw Error('projectId is required');
  if (!Number.isSafeInteger(input.fromRevision)) throw Error('fromRevision is required');
  if (typeof input.candidateFile !== 'string' || !sha.test(input.candidateSha256 ?? '')) throw Error('candidateFile and candidateSha256 are required');
  if (!Array.isArray(input.ownerIds) || !input.ownerIds.length || new Set(input.ownerIds).size !== input.ownerIds.length) throw Error('ownerIds must be a non-empty list without repeats');
}

// Refuses a second open proposal unless the caller amends the open one.
export function openOrAmend(entry, input, {amend = false, at = new Date().toISOString()} = {}) {
  checkInput(input);
  if (entry && entry.projectId !== input.projectId) throw Error(`Registry entry is for ${entry.projectId}`);
  const fields = {fromRevision: input.fromRevision, candidateFile: input.candidateFile, candidateSha256: input.candidateSha256, ownerIds: [...input.ownerIds], closureRecord: input.closureRecord ?? null};
  if (entry?.status === 'open') {
    if (!amend) throw Error(`${input.projectId} already has an open proposal (${entry.candidateFile}); amend it instead of opening a second`);
    const before = new Set(entry.ownerIds), after = new Set(fields.ownerIds);
    const history = [...entry.history, {action: 'amended', at, previous: snapshot(entry), addedOwners: fields.ownerIds.filter(id => !before.has(id)), removedOwners: entry.ownerIds.filter(id => !after.has(id)), ...(input.note ? {note: input.note} : {})}];
    return {...entry, ...fields, history};
  }
  if (amend) throw Error(`${input.projectId} has no open proposal to amend`);
  const history = [...(entry?.history ?? [])];
  if (entry) history.push({action: 'closed-before-reopen', at, previous: {...snapshot(entry), status: entry.status}});
  history.push({action: 'opened', at, ...(input.note ? {note: input.note} : {})});
  return {kind: PROPOSAL_KIND, projectId: input.projectId, ...fields, status: 'open', history};
}

export function recordNote(entry, note, {at = new Date().toISOString()} = {}) {
  return {...entry, history: [...entry.history, {action: 'note', at, ...note}]};
}

export function recordApproval(entry, approvedBy, {at = new Date().toISOString()} = {}) {
  if (entry?.status !== 'open') throw Error('Only an open proposal can be approved');
  if (typeof approvedBy !== 'string' || approvedBy.trim().length < 3) throw Error('approvedBy must quote the chat approval');
  return {...entry, history: [...entry.history, {action: 'approved', at, approvedBy}]};
}

export function markSaved(entry, {publishResult, closureRecord, at = new Date().toISOString()}) {
  if (entry?.status !== 'open') throw Error('Only an open proposal can be marked saved');
  if (publishResult?.projectId !== entry.projectId || publishResult.from !== entry.fromRevision || publishResult.readback !== true) throw Error('Publish result does not match this proposal');
  const ledgerRow = {at: publishResult.savedAt, projectId: publishResult.projectId, from: publishResult.from, to: publishResult.to};
  const saved = {revision: publishResult.to, sha256: publishResult.savedSha256, savedAt: publishResult.savedAt, ledgerRow};
  return {...entry, status: 'saved', saved, ...(closureRecord ? {closureRecord} : {}), history: [...entry.history, {action: 'saved', at, ...saved}]};
}

export function withdraw(entry, reason, {at = new Date().toISOString()} = {}) {
  if (entry?.status !== 'open') throw Error('Only an open proposal can be withdrawn');
  if (!reason) throw Error('A reason is required');
  return {...entry, status: 'withdrawn', history: [...entry.history, {action: 'withdrawn', at, reason}]};
}

// Records that a sealed legacy proposal was saved, only when the live booklet
// proves it: the revision is at or past the legacy base and every owner exists.
export function importLegacy(entry, {projectId, legacyFile, legacySha256, ownerIds, savedCommit, liveRevision, liveOwnerIds, legacyFromRevision}, {at = new Date().toISOString()} = {}) {
  const live = new Set(liveOwnerIds), missing = ownerIds.filter(id => !live.has(id));
  if (!ownerIds.length || missing.length) return {entry, proven: false, missing};
  if (Number.isSafeInteger(legacyFromRevision) && liveRevision <= legacyFromRevision) return {entry, proven: false, missing: [], reason: 'live revision has not moved past the legacy base'};
  const row = {action: 'legacy-superseded', at, legacyFile, legacySha256, savedCommit, liveRevision, ownerIds: [...ownerIds], note: `superseded by saved commit ${savedCommit}`};
  if (entry) return {entry: {...entry, history: [...entry.history, row]}, proven: true};
  return {entry: {kind: PROPOSAL_KIND, projectId, fromRevision: legacyFromRevision ?? null, candidateFile: legacyFile, candidateSha256: legacySha256, ownerIds: [...ownerIds], closureRecord: null, status: 'saved', saved: {revision: liveRevision, commit: savedCommit}, history: [row]}, proven: true};
}

// ---- Registry files: one JSON per master, compare-and-swap on write ----
export const registryFile = (projectId, dir = DEFAULT_REGISTRY) => path.join(dir, projectId + '.json');
export function readEntry(projectId, dir = DEFAULT_REGISTRY) {
  const file = registryFile(projectId, dir);
  if (!fs.existsSync(file)) return {entry: null, bytes: null};
  const bytes = fs.readFileSync(file, 'utf8');
  return {entry: JSON.parse(bytes), bytes};
}
export function writeEntry(entry, {dir = DEFAULT_REGISTRY, expectedBytes}) {
  const file = registryFile(entry.projectId, dir), now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (now !== expectedBytes) throw Error(`${file} changed since it was read; re-read and retry`);
  fs.mkdirSync(dir, {recursive: true});
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(entry, null, 2) + '\n', {flag: 'wx'});
  fs.renameSync(temp, file);
  return file;
}
export function updateEntry(projectId, change, {dir = DEFAULT_REGISTRY} = {}) {
  const {entry, bytes} = readEntry(projectId, dir), next = change(entry);
  return {entry: next, file: writeEntry(next, {dir, expectedBytes: bytes})};
}
export function listEntries(dir = DEFAULT_REGISTRY) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => name.endsWith('.json')).map(name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2), arg = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
  const need = name => arg(name) ?? (() => { throw Error(`${name} is required`); })(), dir = arg('--registry') ?? DEFAULT_REGISTRY;
  if (command === 'list') {
    const rows = listEntries(dir).filter(entry => !args.includes('--open') || entry.status === 'open');
    for (const entry of rows) console.log([entry.projectId, entry.status, `r${entry.fromRevision}`, `${entry.ownerIds.length} owners`, entry.candidateFile].join('\t'));
    if (!rows.length) console.log('(none)');
  } else if (command === 'show') {
    console.log(JSON.stringify(readEntry(need('--project-id'), dir).entry, null, 2));
  } else if (command === 'open') {
    const candidateFile = need('--candidate');
    const input = {projectId: need('--project-id'), fromRevision: Number(need('--from-revision')), candidateFile: candidateFile.replaceAll('\\', '/'), candidateSha256: createHash('sha256').update(fs.readFileSync(candidateFile)).digest('hex'), ownerIds: need('--owners').split(',').filter(Boolean), closureRecord: arg('--closure') ?? null, note: arg('--note')};
    const {file, entry} = updateEntry(input.projectId, current => openOrAmend(current, input, {amend: args.includes('--amend')}), {dir});
    console.log(`${entry.status} ${file}`);
  } else if (command === 'withdraw') {
    const {file} = updateEntry(need('--project-id'), current => withdraw(current, need('--reason')), {dir});
    console.log(`withdrawn ${file}`);
  } else {
    console.error('Usage: exam-proposals.mjs list [--open] | show --project-id ID | open ... [--amend] | withdraw --project-id ID --reason TEXT');
    process.exitCode = 2;
  }
}
