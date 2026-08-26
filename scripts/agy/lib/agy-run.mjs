// Generic agy (Gemini CLI) task runner for Wave 3 — ported from
// MathsDatabase/tools/tikz-audit/redraw-agy.mjs and tools/qgen/lib/agent-cli.mjs runAgyOnce,
// generalised so every Wave-3 lane (generation, repairs, diagram audit, redraw) shares one
// driver instead of re-learning the quirks.
//
// The quirks this file exists to encode (all learned empirically in MathsDatabase):
//   - agy takes its prompt in argv (~32,767-char cap), so the prompt is a short pointer and
//     the real task is a task-NNN.md file the model Reads from its cwd.
//   - Writes must land IN cwd. An --add-dir write succeeds on disk but agy's artifact step
//     rejects the path and misreports status:"ERROR" — so cwd = tasksDir, and the driver
//     trusts the RESULT FILE's existence + shape over agy's own status field. It never
//     trusts stdout alone either: a genuine crash also produces no file.
//   - Result files may arrive BOM-prefixed → strip before JSON.parse.
//   - Each task-NNN.md has a sibling task-NNN.ids.json; the parsed result must cover exactly
//     those ids or the task is a FAILURE, never a partial.
//   - Google OAuth expiry mid-run shows as consecutive errors with no result file → halt the
//     pool with a distinctive error so the operator re-auths and reruns (results are
//     per-file, so resume = rerun; tasks with a valid result file are skipped).
//   - Every call appends a line to ledger.jsonl in tasksDir (tokens, wall-clock, ok/fail).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const AGY_BIN = process.env.AGY_PATH
  || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'agy', 'bin', 'agy.exe');

export const ARGV_CEILING = 28000;

export class OAuthExpiredError extends Error {
  constructor(failures) {
    super(`agy: ${failures} consecutive calls errored with no result file — Google OAuth has `
      + 'likely expired. Re-authenticate agy, then rerun this command; tasks with a valid '
      + 'result file are skipped automatically.');
    this.name = 'OAuthExpiredError';
  }
}

export function stripBom(text) {
  return String(text || '').replace(/^﻿/, '');
}

// Parse a result file: BOM tolerant, ```json fence tolerant. Returns the parsed value or
// throws with a reason.
export function parseResultFile(file) {
  let raw = stripBom(fs.readFileSync(file, 'utf8')).trim();
  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenced) raw = fenced[1].trim();
  return JSON.parse(raw);
}

// Collect every id string that appears as an `id` (or `skillId`) property anywhere in the
// parsed result — shape-agnostic so generation ({out files list}), audits ({results:[…]})
// and repairs all reconcile the same way.
export function collectIds(value, found = new Set()) {
  if (Array.isArray(value)) { for (const v of value) collectIds(v, found); return found; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'id' || k === 'skillId') && typeof v === 'string') found.add(v);
      else if (k === 'ids' && Array.isArray(v) && v.every(x => typeof x === 'string')) v.forEach(x => found.add(x));
      else collectIds(v, found);
    }
  }
  return found;
}

// ids.json contract: {"ids": ["…"]}. A result is reconciled when every expected id appears
// in it. MISSING ids fail the task — that is the "model silently dropped work" case a
// partial result would otherwise hide.
//
// Extra ids are reported but do NOT fail: legitimate results nest ids of their own. A repair
// result names the skill AND the quiz item it replaced (`{skillId, repairs:[{target:{itemId}},
// {replacement:{id}}]}`); an audit result names item addresses. A genuinely wandered model is
// still caught downstream — collect-gen only copies expected ids and validates that list, and
// apply-repairs/apply-redraws reject a target they did not ask for.
export function reconcileIds(expectedIds, result) {
  const got = collectIds(result);
  const missing = expectedIds.filter(id => !got.has(id));
  const extra = [...got].filter(id => !expectedIds.includes(id));
  return { ok: missing.length === 0, missing, extra };
}

function appendLedger(tasksDir, entry) {
  fs.appendFileSync(path.join(tasksDir, 'ledger.jsonl'), JSON.stringify(entry) + '\n');
}

// A task is already complete when its result file parses and reconciles — used for resume.
export function taskComplete(tasksDir, taskFile, resultSuffix) {
  const resultPath = path.join(tasksDir, taskFile.replace(/\.md$/, resultSuffix));
  const idsPath = path.join(tasksDir, taskFile.replace(/\.md$/, '.ids.json'));
  if (!fs.existsSync(resultPath)) return false;
  try {
    const result = parseResultFile(resultPath);
    if (!fs.existsSync(idsPath)) return true; // no ids contract → existence + parse is enough
    const { ids } = JSON.parse(stripBom(fs.readFileSync(idsPath, 'utf8')));
    return reconcileIds(ids, result).ok;
  } catch {
    return false;
  }
}

async function runOne(tasksDir, taskFile, { model, resultSuffix, timeoutMs, printTimeout, pointerPrompt }) {
  const resultPath = path.join(tasksDir, taskFile.replace(/\.md$/, resultSuffix));
  const idsPath = path.join(tasksDir, taskFile.replace(/\.md$/, '.ids.json'));
  if (fs.existsSync(resultPath)) fs.unlinkSync(resultPath); // no stale result from a prior run

  const prompt = pointerPrompt
    ? pointerPrompt(taskFile)
    : `Read the task file at ${taskFile} in the current directory and follow its instructions `
      + 'exactly, including its Output Contract section, which tells you exactly where to '
      + 'write your JSON result and its shape. Do not ask for confirmation; write the result '
      + 'file directly.';
  if (prompt.length > ARGV_CEILING) throw new Error(`pointer prompt is ${prompt.length} chars, over the ${ARGV_CEILING}-char argv ceiling`);

  const started = Date.now();
  let stdout = '';
  let agyError = null;
  try {
    ({ stdout } = await execFileAsync(AGY_BIN, [
      '-p', prompt,
      '--model', model,
      '--output-format', 'json',
      '--disable-slash-commands',
      '--dangerously-skip-permissions',
      '--print-timeout', printTimeout,
    ], { cwd: tasksDir, maxBuffer: 1024 * 1024 * 64, timeout: timeoutMs }));
  } catch (error) {
    // agy exits 1 on its own spurious ERROR status too — keep going and check the file.
    agyError = error;
    stdout = error.stdout || '';
  }

  let envelope = null;
  try { envelope = JSON.parse(stripBom(stdout).trim()); } catch { /* file check decides */ }

  const elapsedMs = Date.now() - started;
  const base = { task: taskFile, model, elapsedMs, usage: envelope?.usage ?? null, at: new Date().toISOString() };

  if (!fs.existsSync(resultPath)) {
    const reason = agyError ? `agy invocation failed and no result file: ${agyError.message}`
      : envelope ? `agy reported status ${envelope.status} and no result file was written`
      : 'agy produced no parseable output and no result file';
    appendLedger(tasksDir, { ...base, ok: false, reason });
    return { file: taskFile, ok: false, noFile: true, reason, raw: String(stdout).slice(0, 2000) };
  }

  let result;
  try { result = parseResultFile(resultPath); } catch (error) {
    const reason = `result file is not valid JSON: ${error.message}`;
    appendLedger(tasksDir, { ...base, ok: false, reason });
    return { file: taskFile, ok: false, reason, elapsedMs };
  }

  if (fs.existsSync(idsPath)) {
    const { ids } = JSON.parse(stripBom(fs.readFileSync(idsPath, 'utf8')));
    const rec = reconcileIds(ids, result);
    if (!rec.ok) {
      const reason = `id reconciliation failed — missing: [${rec.missing.join(', ')}]`;
      appendLedger(tasksDir, { ...base, ok: false, reason });
      return { file: taskFile, ok: false, reason, elapsedMs };
    }
    if (rec.extra.length) console.log(`${taskFile}: note — result also names [${rec.extra.join(', ')}] (nested item ids are expected in repair/audit results)`);
  }

  if (envelope && envelope.status && envelope.status !== 'SUCCESS') {
    console.log(`${taskFile}: note — agy reported status ${envelope.status} but the result file is present and valid; trusting the file`);
  }
  appendLedger(tasksDir, { ...base, ok: true });
  return { file: taskFile, ok: true, result, elapsedMs, usage: envelope?.usage ?? null };
}

// Run every task-NNN.md in tasksDir through agy with bounded concurrency. Skips tasks whose
// result file already parses + reconciles (resume semantics). Halts with OAuthExpiredError
// after `oauthHaltAfter` consecutive no-file failures.
export async function runTasks(tasksDir, {
  model = 'gemini-3.7-flash-high',
  concurrency = 3,
  resultSuffix = '.result.json',
  timeoutMs = 25 * 60 * 1000,
  printTimeout = '20m',
  oauthHaltAfter = 3,
  pointerPrompt = null,
  taskPattern = /^task-\d+\.md$/,
} = {}) {
  if (!fs.existsSync(tasksDir)) throw new Error(`tasks dir does not exist: ${tasksDir}`);
  if (!fs.existsSync(AGY_BIN)) throw new Error(`agy.exe not found at ${AGY_BIN} — set AGY_PATH`);
  const all = fs.readdirSync(tasksDir).filter(f => taskPattern.test(f)).sort();
  if (!all.length) throw new Error(`no task files matching ${taskPattern} in ${tasksDir}`);

  const skipped = all.filter(f => taskComplete(tasksDir, f, resultSuffix));
  const pending = all.filter(f => !skipped.includes(f));
  if (skipped.length) console.log(`resume: skipping ${skipped.length} task(s) with valid results`);

  const results = [];
  let cursor = 0;
  let consecutiveNoFile = 0;
  let halted = null;

  async function worker() {
    while (cursor < pending.length && !halted) {
      const file = pending[cursor++];
      const outcome = await runOne(tasksDir, file, { model, resultSuffix, timeoutMs, printTimeout, pointerPrompt });
      results.push(outcome);
      if (outcome.ok) consecutiveNoFile = 0;
      else if (outcome.noFile && ++consecutiveNoFile >= oauthHaltAfter) halted = new OAuthExpiredError(consecutiveNoFile);
      console.log(`${file}: ${outcome.ok ? 'ok' : `FAIL — ${outcome.reason}`} (${Math.round((outcome.elapsedMs || 0) / 1000)}s)`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, worker));
  if (halted) throw halted;
  return { skipped, results, ok: results.every(r => r.ok) && pending.length === results.length };
}
