// Revision-safe publication shared by maintenance workers and the dev editors.
// The journal is local recovery evidence, never production content.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export const contentHash = (raw) => raw === null ? null : createHash('sha256').update(raw).digest('hex');
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function locations(root, skillId) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(skillId)) throw fail('Invalid skill ID', 400);
  root = path.resolve(root);
  const work = path.join(root, '.agywork', 'content-publication');
  return { root, work, lock: path.join(work, 'locks', skillId), active: path.join(work, 'active', `${skillId}.json`),
    content: path.join(root, 'public', 'content', `${skillId}.json`), quiz: path.join(root, 'public', 'quizzes', `${skillId}.json`) };
}
async function read(file) { try { return await fs.readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
async function atomic(file, raw) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await fs.open(temp, 'wx');
    try { await handle.writeFile(raw); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}
async function writeJson(file, value) { await atomic(file, JSON.stringify(value, null, 2) + '\n'); }
async function lock(loc, task, { lockTimeoutMs = 10000 } = {}) {
  // Lamport bakery tickets avoid a reusable ownership directory and recovery
  // mutex. PID/host are present in the ticket name from its first visible
  // operation, so dying before the owner file is written is recoverable too.
  await fs.mkdir(loc.lock, { recursive: true });
  const hostHex = Buffer.from(os.hostname()).toString('hex');
  const token = `${process.pid}-${hostHex}-${randomUUID()}`, ticket = path.join(loc.lock, token), started = Date.now();
  await fs.mkdir(ticket);
  async function tickets() {
    const entries = [];
    for (const name of await fs.readdir(loc.lock)) {
      const match = /^(\d+)-([0-9a-f]+)-([a-z0-9-]+)$/.exec(name);
      if (!match) continue;
      const directory = path.join(loc.lock, name);
      let dead = false;
      if (Buffer.from(match[2], 'hex').toString() === os.hostname()) {
        try { process.kill(Number(match[1]), 0); } catch (error) { dead = error.code === 'ESRCH'; }
      }
      if (dead) {
        // Ticket names are never reused, so concurrent reclaimers cannot move
        // the next owner's ticket. There is no second lock to abandon.
        const tomb = `${loc.lock}.abandoned-${randomUUID()}`;
        try { await fs.rename(directory, tomb); await fs.rm(tomb, { recursive: true, force: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
        continue;
      }
      const raw = await read(path.join(directory, 'owner.json'));
      // A missing owner is a live process still choosing its ticket number.
      entries.push({ name, number: raw === null ? null : JSON.parse(raw).number });
    }
    return entries;
  }
  try {
    const number = 1 + Math.max(0, ...(await tickets()).map((entry) => entry.number ?? 0));
    await writeJson(path.join(ticket, 'owner.json'), { pid: process.pid, host: os.hostname(), token, number, started: new Date().toISOString() });
    while (true) {
      const blocked = (await tickets()).some((entry) => entry.name !== token && (entry.number === null || entry.number < number || (entry.number === number && entry.name < token)));
      if (!blocked) break;
      if (Date.now() - started >= lockTimeoutMs) throw fail('Skill is being saved by another process; retry after it finishes', 423);
      await pause(25);
    }
    return await task();
  } finally { await fs.rm(ticket, { recursive: true, force: true }); }
}
// Manifest/build scans and all pair mutations share this outer lock. Lock order
// is always global, then skill, so an index never observes a half-published pair.
export async function withPublicationLock(root, task, options = {}) {
  const loc = locations(root, 'publication-lock');
  loc.lock = path.join(loc.work, 'global-lock');
  return lock(loc, async () => {
    if (options.recoverPending) {
      let entries = [];
      try { entries = await fs.readdir(path.join(loc.work, 'active')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      for (const name of entries.filter((name) => name.endsWith('.json'))) {
        const skillId = name.slice(0, -5), skillLoc = locations(root, skillId);
        await lock(skillLoc, () => recoverLocked(skillLoc, skillId), options);
      }
    }
    return task();
  }, options);
}
async function snapshot(loc) {
  const [contentRaw, quizRaw] = await Promise.all([read(loc.content), read(loc.quiz)]);
  return { content: contentRaw === null ? null : JSON.parse(contentRaw), quiz: quizRaw === null ? null : JSON.parse(quizRaw),
    contentRaw, quizRaw, expected: { contentHash: contentHash(contentRaw), quizHash: contentHash(quizRaw) } };
}
function assertExpected(actual, expected) {
  if (!expected || !Object.hasOwn(expected, 'contentHash') || !Object.hasOwn(expected, 'quizHash')) throw fail('Reload this skill before saving: both revision hashes are required', 428);
  if (actual.contentHash !== expected.contentHash || actual.quizHash !== expected.quizHash) throw fail('This skill changed since it was loaded. Reload and reconcile your edits before saving.');
}

// Parse value spans once. Unchanged values are copied from the original text,
// including escapes and formatting; arrays can insert, delete and reorder them.
function jsonTree(raw) {
  JSON.parse(raw);
  let at = 0;
  const whitespace = () => { while (/\s/.test(raw[at] ?? '') && at < raw.length) at++; };
  function stringEnd() { at++; while (at < raw.length) { const c = raw[at++]; if (c === '\\') at++; else if (c === '"') return; } }
  function value() {
    whitespace(); const start = at, children = [];
    if (raw[at] === '{') {
      at++; whitespace();
      while (raw[at] !== '}') {
        const keyStart = at; stringEnd(); const keyEnd = at, key = JSON.parse(raw.slice(keyStart, keyEnd));
        whitespace(); at++; const child = value(); children.push({ key, keyStart, keyEnd, child });
        whitespace(); if (raw[at] !== ',') break; at++; whitespace();
      }
      at++;
    } else if (raw[at] === '[') {
      at++; whitespace();
      while (raw[at] !== ']') { children.push(value()); whitespace(); if (raw[at] !== ',') break; at++; }
      at++;
    } else if (raw[at] === '"') stringEnd();
    else while (at < raw.length && !/[\s,\]}]/.test(raw[at])) at++;
    return { start, end: at, children, value: JSON.parse(raw.slice(start, at)) };
  }
  return value();
}
export function preserveJsonBytes(raw, candidate) {
  if (raw === null) return JSON.stringify(candidate, null, 2) + '\n';
  const tree = jsonTree(raw);
  function render(node, next) {
    if (isDeepStrictEqual(node.value, next)) return raw.slice(node.start, node.end);
    if (Array.isArray(node.value) && Array.isArray(next)) {
      const used = new Set();
      // Reserve all unchanged entries before matching changed/new entries, so
      // inserting at the start cannot consume the old first entry's raw span.
      const matches = next.map((item) => {
        const match = node.children.findIndex((child, i) => !used.has(i) && isDeepStrictEqual(child.value, item));
        if (match >= 0) used.add(match);
        return match;
      });
      const values = next.map((item, index) => {
        let match = matches[index];
        if (match < 0 && item?.id) match = node.children.findIndex((child, i) => !used.has(i) && child.value?.id === item.id);
        if (match < 0 && index < node.children.length && !used.has(index)) match = index;
        if (match < 0) return JSON.stringify(item, null, 2);
        used.add(match); return render(node.children[match], item);
      });
      return '[' + (values.length ? '\n' + values.join(',\n') + '\n' : '') + ']';
    }
    if (node.value && next && typeof node.value === 'object' && typeof next === 'object' && !Array.isArray(next) && !Array.isArray(node.value)) {
      const keys = Object.keys(next), oldKeys = Object.keys(node.value);
      if (isDeepStrictEqual(keys, oldKeys)) {
        let output = raw.slice(node.start, node.end);
        for (const { key, child } of [...node.children].reverse()) output = output.slice(0, child.start - node.start) + render(child, next[key]) + output.slice(child.end - node.start);
        return output;
      }
      return '{\n' + keys.map((key) => {
        const old = node.children.find((entry) => entry.key === key);
        return old ? raw.slice(old.keyStart, old.child.start) + render(old.child, next[key]) : JSON.stringify(key) + ': ' + JSON.stringify(next[key], null, 2);
      }).join(',\n') + '\n}';
    }
    return JSON.stringify(next, null, 2);
  }
  return raw.slice(0, tree.start) + render(tree, candidate) + raw.slice(tree.end);
}
async function validate(root, skillId, content, quiz, extra) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) throw fail('Publication requires a valid content object', 422);
  const { validateCandidatePair } = await import('../validate.mjs');
  const result = await validateCandidatePair({ rootDir: root, skillId, content, quiz });
  if (!result || !Array.isArray(result.errors)) throw fail('Candidate validator did not return validation evidence', 500);
  if (result.errors.length) throw fail('Candidate pair failed validation: ' + result.errors.join('; '), 422);
  if (extra) { const additional = await extra({ skillId, content, quiz }); if (additional === false || additional?.errors?.length) throw fail('Candidate pair failed additional review: ' + (additional?.errors ?? []).join('; '), 422); }
  return result;
}
async function recoverLocked(loc, skillId, { mode = 'finish', onProgress } = {}) {
  const pointer = await read(loc.active);
  if (pointer === null) return null;
  const { transactionId } = JSON.parse(pointer);
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(transactionId)) throw fail('Invalid publication journal', 500);
  const directory = path.join(loc.work, 'transactions', transactionId), journalPath = path.join(directory, 'journal.json');
  const journal = JSON.parse(await read(journalPath));
  if (journal.skillId !== skillId || !journal.validation?.passed) throw fail('Unvalidated publication journal', 500);
  const current = await snapshot(loc);
  for (const kind of ['content', 'quiz']) {
    const hash = current.expected[kind + 'Hash'];
    if (hash !== journal.pre[kind + 'Hash'] && hash !== journal.post[kind + 'Hash']) throw fail('Recovery stopped: external edits overlap the pending publication. Original and prepared files are retained.');
  }
  const target = mode === 'rollback' ? journal.pre : journal.post;
  if (!['finish', 'rollback'].includes(mode)) throw fail('Invalid recovery mode', 400);
  const payload = {};
  for (const kind of ['content', 'quiz']) {
    payload[kind] = target[kind + 'Hash'] === null ? null : await read(path.join(directory, `${kind}.${mode === 'rollback' ? 'before' : 'after'}.json`));
    if (contentHash(payload[kind]) !== target[kind + 'Hash']) throw fail('Recovery payload hash mismatch', 500);
  }
  if (mode === 'finish') await validate(loc.root, skillId, payload.content === null ? null : JSON.parse(payload.content), payload.quiz === null ? null : JSON.parse(payload.quiz));
  for (const kind of ['content', 'quiz']) {
    const raw = payload[kind];
    // Recheck immediately before replacement; participating writers hold this lock.
    const actual = contentHash(await read(loc[kind]));
    if (actual !== journal.pre[kind + 'Hash'] && actual !== journal.post[kind + 'Hash']) throw fail('Recovery stopped: file changed during publication');
    if (actual !== target[kind + 'Hash']) {
      if (raw === null) await fs.rm(loc[kind], { force: true }); else await atomic(loc[kind], raw);
    }
    journal.replaced[kind] = true;
    await writeJson(journalPath, journal);
    await onProgress?.({ kind, journal, journalPath });
  }
  const after = await snapshot(loc);
  assertExpected(after.expected, target);
  if (mode === 'finish') await validate(loc.root, skillId, after.content, after.quiz);
  journal.status = mode === 'rollback' ? 'rolled-back' : 'complete';
  journal.readback = { ...after.expected, validated: mode === 'finish', at: new Date().toISOString() };
  await writeJson(journalPath, journal);
  await fs.rm(loc.active, { force: true });
  return { ...after, journalPath };
}
export async function recoverSkill(root, skillId, options = {}) {
  const loc = locations(root, skillId);
  return withPublicationLock(root, () => lock(loc, () => recoverLocked(loc, skillId, options), options), options);
}
export async function captureSnapshot(root, skillId, options = {}) {
  const loc = locations(root, skillId);
  return withPublicationLock(root, () => lock(loc, async () => { await recoverLocked(loc, skillId); return snapshot(loc); }, options), options);
}
export async function publishSkill(root, skillId, options) {
  const loc = locations(root, skillId);
  return withPublicationLock(root, () => lock(loc, async () => {
    await recoverLocked(loc, skillId);
    const before = await snapshot(loc);
    assertExpected(before.expected, options.expected);
    const make = (kind) => {
      const value = Object.hasOwn(options, kind === 'content' ? 'candidateContent' : 'candidateQuiz') ? options[kind === 'content' ? 'candidateContent' : 'candidateQuiz'] : before[kind];
      return value === null ? null : typeof value === 'string' ? value : preserveJsonBytes(before[kind + 'Raw'], value);
    };
    const contentRaw = make('content'), quizRaw = make('quiz');
    const content = contentRaw === null ? null : JSON.parse(contentRaw), quiz = quizRaw === null ? null : JSON.parse(quizRaw);
    const validation = await validate(loc.root, skillId, content, quiz, options.validatePair);
    const post = { contentHash: contentHash(contentRaw), quizHash: contentHash(quizRaw) };
    if (isDeepStrictEqual(before.expected, post)) return { ...before, journalPath: null };
    const transactionId = `${skillId}-${randomUUID()}`, directory = path.join(loc.work, 'transactions', transactionId);
    await fs.mkdir(directory, { recursive: true });
    for (const [file, raw] of [['content.before.json', before.contentRaw], ['quiz.before.json', before.quizRaw], ['content.after.json', contentRaw], ['quiz.after.json', quizRaw]]) if (raw !== null) await atomic(path.join(directory, file), raw);
    const journal = { version: 1, transactionId, skillId, status: 'prepared', createdAt: new Date().toISOString(), pre: before.expected, post,
      validation: { passed: true, warnings: validation.warnings ?? [] }, prepared: ['content.after.json', 'quiz.after.json'], replaced: { content: false, quiz: false } };
    await writeJson(path.join(directory, 'journal.json'), journal);
    assertExpected((await snapshot(loc)).expected, before.expected);
    await writeJson(loc.active, { transactionId });
    return recoverLocked(loc, skillId, { onProgress: options.onProgress });
  }, options), options);
}
