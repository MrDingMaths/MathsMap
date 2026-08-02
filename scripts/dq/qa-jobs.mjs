#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const QA_LEDGER_VERSION = 2;
export const MAX_QA_BATCH_SIZE = 5;
export const QA_VERDICTS = Object.freeze([
  'accepted',
  'recapture_requested',
  'rejected_source',
  'needs_human_review',
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function isoNow() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireSha256(value, label = 'PNG checksum') {
  const normalized = String(value ?? '').toLowerCase();
  if (!SHA256_PATTERN.test(normalized)) throw new Error(`${label} must be a lowercase SHA-256 digest`);
  return normalized;
}

function requireSourceId(value) {
  const sourceId = String(value ?? '').trim();
  if (!sourceId) throw new Error('capture candidate is missing sourceId');
  return sourceId;
}

export function captureRevisionKey(sourceId, pngSha256) {
  return `${requireSourceId(sourceId)}@${requireSha256(pngSha256)}`;
}

export function createEmptyQaLedger(now = isoNow()) {
  return {
    schemaVersion: QA_LEDGER_VERSION,
    nextJobSequence: 1,
    createdAt: now,
    updatedAt: now,
    captures: {},
    currentBySourceId: {},
    jobs: {},
  };
}

function captureRecord(candidate, now = isoNow()) {
  const sourceId = requireSourceId(candidate?.sourceId);
  const capture = candidate?.capture ?? {};
  const pngSha256 = requireSha256(capture.pngChecksum, `capture ${sourceId} checksum`);
  const sourcePaths = candidate.sourcePaths ?? (candidate.categoryPath ? [candidate.categoryPath] : []);
  return {
    sourceId,
    pngSha256,
    pngPath: String(capture.pngPath ?? '').replaceAll('\\', '/'),
    capturedAt: capture.capturedAt ?? candidate.updatedAt ?? now,
    sourcePaths: sourcePaths
      .filter((parts) => Array.isArray(parts) && parts.length)
      .map((parts) => parts.map(String)),
    status: 'unreviewed',
    assignment: null,
    decision: null,
    firstSyncedAt: now,
    updatedAt: now,
  };
}

function currentCandidateRecords(captureState, now = isoNow()) {
  return Object.values(captureState?.candidates ?? {})
    .filter((candidate) => candidate?.capture?.pngPath && candidate?.capture?.pngChecksum)
    .map((candidate) => captureRecord(candidate, now));
}

function cancelSupersededJob(ledger, jobId, now) {
  const job = ledger.jobs[jobId];
  if (!job || job.status !== 'claimed') return;
  job.status = 'cancelled_superseded';
  job.completedAt = now;
  for (const key of job.captureKeys ?? []) {
    const item = ledger.captures[key];
    if (item?.status === 'claimed') {
      item.status = 'unreviewed';
      item.assignment = null;
      item.updatedAt = now;
    }
  }
}

/** Merge a capture-state snapshot into the revision ledger without requeueing reviewed PNGs. */
export function syncCaptureState(ledger, captureState, { now = isoNow() } = {}) {
  if (ledger?.schemaVersion !== QA_LEDGER_VERSION) {
    throw new Error(`QA ledger must have schemaVersion ${QA_LEDGER_VERSION}`);
  }
  let added = 0;
  let superseded = 0;
  for (const record of currentCandidateRecords(captureState, now)) {
    const key = captureRevisionKey(record.sourceId, record.pngSha256);
    const previousKey = ledger.currentBySourceId[record.sourceId];
    if (previousKey && previousKey !== key) {
      const previous = ledger.captures[previousKey];
      if (previous?.assignment?.jobId) cancelSupersededJob(ledger, previous.assignment.jobId, now);
      if (previous) {
        previous.status = 'superseded';
        previous.assignment = null;
        previous.updatedAt = now;
      }
      superseded += 1;
    }
    if (!ledger.captures[key]) {
      ledger.captures[key] = record;
      added += 1;
    } else {
      ledger.captures[key].pngPath = record.pngPath;
      ledger.captures[key].capturedAt = record.capturedAt;
      ledger.captures[key].sourcePaths = record.sourcePaths;
      ledger.captures[key].updatedAt = now;
    }
    ledger.currentBySourceId[record.sourceId] = key;
  }
  ledger.updatedAt = now;
  return { added, superseded, current: Object.keys(ledger.currentBySourceId).length };
}

/** Bind the pilot's source-id-only decisions to the exact current checksums. */
export function migrateLegacyQaLedger(legacy, captureState, { now = isoNow() } = {}) {
  if (!legacy || legacy.schemaVersion !== 1 || !Array.isArray(legacy.acceptedIds)) {
    throw new Error('legacy QA ledger must have schemaVersion 1 and acceptedIds[]');
  }
  const ledger = createEmptyQaLedger(now);
  syncCaptureState(ledger, captureState, { now });
  const accepted = new Set(legacy.acceptedIds.map(String));
  const rejected = legacy.rejected ?? {};
  const recaptured = legacy.recaptured ?? {};
  const reviewedAt = legacy.auditedAt ?? now;
  for (const [sourceId, key] of Object.entries(ledger.currentBySourceId)) {
    const item = ledger.captures[key];
    let verdict = null;
    let notes = '';
    if (Object.hasOwn(rejected, sourceId)) {
      verdict = 'rejected_source';
      notes = String(rejected[sourceId]);
    } else if (accepted.has(sourceId)) {
      verdict = 'accepted';
      notes = recaptured[sourceId] ? String(recaptured[sourceId]) : '';
    }
    if (!verdict) continue;
    item.status = verdict;
    item.decision = {
      reviewer: 'legacy-pilot-migration',
      completedAt: reviewedAt,
      verdict,
      reasonCodes: verdict === 'rejected_source' ? ['legacy_source_rejection'] : [],
      notes,
    };
    item.updatedAt = now;
  }
  ledger.migratedFrom = { schemaVersion: 1, migratedAt: now, auditedAt: legacy.auditedAt ?? null };
  return ledger;
}

function requeueExpiredClaims(ledger, now) {
  const nowMs = Date.parse(now);
  for (const job of Object.values(ledger.jobs)) {
    if (job.status !== 'claimed' || Date.parse(job.leaseExpiresAt) > nowMs) continue;
    job.status = 'expired';
    job.completedAt = now;
    for (const key of job.captureKeys ?? []) {
      const item = ledger.captures[key];
      if (item?.status === 'claimed' && item.assignment?.jobId === job.jobId) {
        item.status = 'unreviewed';
        item.assignment = null;
        item.updatedAt = now;
      }
    }
  }
}

/** Atomically claimable pure operation; the file wrapper below supplies serialization. */
export function claimQaJob(ledger, {
  workerId,
  batchSize = MAX_QA_BATCH_SIZE,
  leaseMinutes = 90,
  archiveRoot = '.',
  now = isoNow(),
} = {}) {
  if (ledger?.schemaVersion !== QA_LEDGER_VERSION) {
    throw new Error(`QA ledger must have schemaVersion ${QA_LEDGER_VERSION}`);
  }
  const worker = String(workerId ?? '').trim();
  if (!worker) throw new Error('workerId is required');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_QA_BATCH_SIZE) {
    throw new Error(`batchSize must be an integer from 1 to ${MAX_QA_BATCH_SIZE}`);
  }
  if (!Number.isFinite(leaseMinutes) || leaseMinutes <= 0) throw new Error('leaseMinutes must be positive');
  requeueExpiredClaims(ledger, now);
  const pending = Object.entries(ledger.captures)
    .filter(([key, item]) => ledger.currentBySourceId[item.sourceId] === key && item.status === 'unreviewed')
    .sort(([, left], [, right]) =>
      String(left.capturedAt).localeCompare(String(right.capturedAt)) ||
      left.sourceId.localeCompare(right.sourceId))
    .slice(0, batchSize);
  if (!pending.length) return null;

  const sequence = Number.isInteger(ledger.nextJobSequence) ? ledger.nextJobSequence : 1;
  const jobId = `dq-capture-qa-${String(sequence).padStart(6, '0')}`;
  ledger.nextJobSequence = sequence + 1;
  const leaseExpiresAt = new Date(Date.parse(now) + leaseMinutes * 60_000).toISOString();
  const captureKeys = pending.map(([key]) => key);
  const job = {
    jobId,
    stage: 'capture_qa',
    status: 'claimed',
    workerId: worker,
    captureKeys,
    claimedAt: now,
    leaseExpiresAt,
    completedAt: null,
  };
  ledger.jobs[jobId] = job;
  for (const [key, item] of pending) {
    item.status = 'claimed';
    item.assignment = { jobId, workerId: worker, claimedAt: now, leaseExpiresAt };
    item.updatedAt = now;
  }
  ledger.updatedAt = now;
  return {
    schemaVersion: 1,
    jobId,
    stage: 'capture_qa',
    workerId: worker,
    claimedAt: now,
    leaseExpiresAt,
    candidates: pending.map(([key, item]) => ({
      captureKey: key,
      sourceId: item.sourceId,
      pngSha256: item.pngSha256,
      pngPath: path.resolve(archiveRoot, item.pngPath),
      sourcePaths: item.sourcePaths,
    })),
  };
}

/** Validate and apply a complete worker result for one exact claimed job. */
export function completeQaJob(ledger, result, { now = isoNow() } = {}) {
  if (ledger?.schemaVersion !== QA_LEDGER_VERSION) {
    throw new Error(`QA ledger must have schemaVersion ${QA_LEDGER_VERSION}`);
  }
  const jobId = String(result?.jobId ?? '');
  const workerId = String(result?.workerId ?? '');
  const job = ledger.jobs[jobId];
  if (!job) throw new Error(`unknown QA job: ${jobId}`);
  if (job.status !== 'claimed') throw new Error(`QA job ${jobId} is ${job.status}, not claimed`);
  if (job.workerId !== workerId) throw new Error(`QA job ${jobId} belongs to ${job.workerId}, not ${workerId}`);
  if (Date.parse(job.leaseExpiresAt) <= Date.parse(now)) throw new Error(`QA job ${jobId} lease has expired`);
  if (!Array.isArray(result.decisions)) throw new Error('result decisions[] is required');
  const expected = new Set(job.captureKeys);
  const seen = new Set();
  for (const decision of result.decisions) {
    const key = captureRevisionKey(decision.sourceId, decision.pngSha256);
    if (!expected.has(key)) throw new Error(`result contains unassigned capture ${key}`);
    if (seen.has(key)) throw new Error(`result contains duplicate decision for ${key}`);
    seen.add(key);
    if (!QA_VERDICTS.includes(decision.verdict)) throw new Error(`invalid QA verdict for ${key}: ${decision.verdict}`);
    if (decision.verdict !== 'accepted' &&
      !(decision.reasonCodes?.length || String(decision.notes ?? '').trim())) {
      throw new Error(`non-accepted decision for ${key} requires a reason code or note`);
    }
    if (ledger.currentBySourceId[String(decision.sourceId)] !== key) {
      throw new Error(`result refers to superseded capture ${key}`);
    }
  }
  if (seen.size !== expected.size) {
    const missing = [...expected].filter((key) => !seen.has(key));
    throw new Error(`result is missing ${missing.length} assigned capture(s): ${missing.join(', ')}`);
  }
  const completedAt = result.completedAt ?? now;
  for (const decision of result.decisions) {
    const key = captureRevisionKey(decision.sourceId, decision.pngSha256);
    const item = ledger.captures[key];
    item.status = decision.verdict;
    item.assignment = null;
    item.decision = {
      reviewer: workerId,
      completedAt,
      verdict: decision.verdict,
      reasonCodes: Array.isArray(decision.reasonCodes) ? decision.reasonCodes.map(String) : [],
      notes: String(decision.notes ?? ''),
    };
    item.updatedAt = now;
  }
  job.status = 'completed';
  job.completedAt = completedAt;
  ledger.updatedAt = now;
  return { jobId, completed: seen.size };
}

/** Apply an exact-revision human decision to captures already held for human review. */
export function resolveHumanReview(ledger, result, { now = isoNow() } = {}) {
  if (ledger?.schemaVersion !== QA_LEDGER_VERSION) {
    throw new Error(`QA ledger must have schemaVersion ${QA_LEDGER_VERSION}`);
  }
  const reviewer = String(result?.reviewer ?? '').trim();
  if (!reviewer) throw new Error('reviewer is required');
  if (!Array.isArray(result?.decisions) || result.decisions.length === 0) {
    throw new Error('result decisions[] is required');
  }
  const seen = new Set();
  for (const decision of result.decisions) {
    const key = captureRevisionKey(decision.sourceId, decision.pngSha256);
    if (seen.has(key)) throw new Error(`result contains duplicate decision for ${key}`);
    seen.add(key);
    const item = ledger.captures[key];
    if (!item || ledger.currentBySourceId[item.sourceId] !== key) {
      throw new Error(`result refers to unknown or superseded capture ${key}`);
    }
    if (item.status !== 'needs_human_review') {
      throw new Error(`capture ${key} is ${item.status}, not needs_human_review`);
    }
    if (!QA_VERDICTS.includes(decision.verdict) || decision.verdict === 'needs_human_review') {
      throw new Error(`human resolution for ${key} requires a final verdict`);
    }
    if (decision.verdict !== 'accepted' &&
      !(decision.reasonCodes?.length || String(decision.notes ?? '').trim())) {
      throw new Error(`non-accepted decision for ${key} requires a reason code or note`);
    }
  }
  const completedAt = result.completedAt ?? now;
  for (const decision of result.decisions) {
    const key = captureRevisionKey(decision.sourceId, decision.pngSha256);
    const item = ledger.captures[key];
    item.status = decision.verdict;
    item.assignment = null;
    item.decision = {
      reviewer,
      completedAt,
      verdict: decision.verdict,
      reasonCodes: Array.isArray(decision.reasonCodes) ? decision.reasonCodes.map(String) : [],
      notes: String(decision.notes ?? ''),
    };
    item.updatedAt = now;
  }
  ledger.updatedAt = now;
  return { reviewer, resolved: seen.size };
}

export function buildQaStatus(ledger, { targetPerLeaf = null } = {}) {
  if (ledger?.schemaVersion !== QA_LEDGER_VERSION) {
    throw new Error(`QA ledger must have schemaVersion ${QA_LEDGER_VERSION}`);
  }
  const current = Object.values(ledger.currentBySourceId)
    .map((key) => ledger.captures[key])
    .filter(Boolean);
  const counts = {};
  for (const item of current) counts[item.status] = (counts[item.status] ?? 0) + 1;
  const leafMap = new Map();
  for (const item of current) {
    for (const sourcePath of item.sourcePaths ?? []) {
      const key = sourcePath.join(' > ');
      if (!leafMap.has(key)) leafMap.set(key, { sourcePath, total: 0 });
      const summary = leafMap.get(key);
      summary.total += 1;
      summary[item.status] = (summary[item.status] ?? 0) + 1;
    }
  }
  const byLeaf = [...leafMap.values()]
    .sort((left, right) => left.sourcePath.join('\0').localeCompare(right.sourcePath.join('\0')))
    .map((summary) => ({
      ...summary,
      ...(Number.isInteger(targetPerLeaf) && targetPerLeaf > 0
        ? { remainingToTarget: Math.max(0, targetPerLeaf - (summary.accepted ?? 0)) }
        : {}),
    }));
  const jobCounts = {};
  for (const job of Object.values(ledger.jobs)) jobCounts[job.status] = (jobCounts[job.status] ?? 0) + 1;
  return {
    schemaVersion: ledger.schemaVersion,
    currentCaptures: current.length,
    counts,
    jobs: jobCounts,
    byLeaf,
  };
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function sha256File(filePath) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

async function verifyCaptureFiles(captureState, archiveRoot) {
  for (const item of currentCandidateRecords(captureState)) {
    const absolutePath = path.resolve(archiveRoot, item.pngPath);
    if (!(await exists(absolutePath))) throw new Error(`captured PNG is missing: ${absolutePath}`);
    const actual = await sha256File(absolutePath);
    if (actual !== item.pngSha256) {
      throw new Error(`captured PNG checksum mismatch for ${item.sourceId}: expected ${item.pngSha256}, got ${actual}`);
    }
  }
}

async function verifyResultFiles(ledger, result, archiveRoot) {
  for (const decision of result?.decisions ?? []) {
    const key = captureRevisionKey(decision.sourceId, decision.pngSha256);
    const item = ledger.captures[key];
    if (!item) throw new Error(`result refers to unknown capture ${key}`);
    const absolutePath = path.resolve(archiveRoot, item.pngPath);
    if (!(await exists(absolutePath))) throw new Error(`captured PNG is missing: ${absolutePath}`);
    const actual = await sha256File(absolutePath);
    if (actual !== item.pngSha256) {
      throw new Error(`captured PNG checksum mismatch for ${item.sourceId}: expected ${item.pngSha256}, got ${actual}`);
    }
  }
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, filePath);
}

export async function withLedgerLock(ledgerPath, operation, {
  attempts = 100,
  retryDelayMs = 50,
} = {}) {
  const lockPath = `${ledgerPath}.lock`;
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  let handle;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      handle = await open(lockPath, 'wx');
      break;
    } catch (error) {
      if (error.code !== 'EEXIST' || attempt === attempts) throw error;
      await sleep(retryDelayMs);
    }
  }
  try {
    return await operation();
  } finally {
    await handle?.close();
    await unlink(lockPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

function parseArgs(argv) {
  const args = [...argv];
  const first = args.shift();
  const command = !first || first === '--help' || first === '-h' ? 'help' : first;
  const result = { command, batchSize: 5, leaseMinutes: 90 };
  while (args.length) {
    const token = args.shift();
    if (token === '--help' || token === '-h') result.help = true;
    else if (['--state', '--ledger', '--archive', '--worker', '--output', '--result', '--batch-size', '--lease-minutes', '--target-per-leaf'].includes(token)) {
      if (args[0] === undefined || args[0].startsWith('--')) throw new Error(`${token} requires a value`);
      const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      result[key] = args.shift();
    } else throw new Error(`unknown argument: ${token}`);
  }
  result.batchSize = Number(result.batchSize);
  result.leaseMinutes = Number(result.leaseMinutes);
  if (result.targetPerLeaf !== undefined) result.targetPerLeaf = Number(result.targetPerLeaf);
  return result;
}

function usage() {
  return `Diagnostic Questions capture-QA coordinator

Usage:
  node scripts/dq/qa-jobs.mjs sync --state <capture-state.json> [--ledger <file>] [--archive <dir>]
  node scripts/dq/qa-jobs.mjs claim --worker <id> [--ledger <file>] [--batch-size 5] [--lease-minutes 90] [--output <file>]
  node scripts/dq/qa-jobs.mjs complete --result <worker-result.json> [--ledger <file>]
  node scripts/dq/qa-jobs.mjs resolve --result <human-result.json> [--ledger <file>]
  node scripts/dq/qa-jobs.mjs status [--ledger <file>] [--target-per-leaf 10]

sync verifies every current PNG against capture-state before updating the ledger.
claim records a disjoint lease before emitting at most five immutable assignments.`;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function loadLedgerForSync(ledgerPath, captureState, now) {
  if (!(await exists(ledgerPath))) return createEmptyQaLedger(now);
  const existing = await readJson(ledgerPath);
  if (existing.schemaVersion === 1) return migrateLegacyQaLedger(existing, captureState, { now });
  if (existing.schemaVersion !== QA_LEDGER_VERSION) throw new Error(`unsupported QA ledger schemaVersion: ${existing.schemaVersion}`);
  return existing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.command === 'help') {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const defaultArchive = path.resolve('.diagnostic-questions');
  const ledgerPath = path.resolve(args.ledger ?? path.join(defaultArchive, 'capture-qa-v2.json'));

  if (args.command === 'sync') {
    const statePath = path.resolve(args.state ?? path.join(defaultArchive, 'capture-state.json'));
    const archiveRoot = path.resolve(args.archive ?? path.dirname(statePath));
    const captureState = await readJson(statePath);
    await verifyCaptureFiles(captureState, archiveRoot);
    const report = await withLedgerLock(ledgerPath, async () => {
      const now = isoNow();
      const ledger = await loadLedgerForSync(ledgerPath, captureState, now);
      const synced = syncCaptureState(ledger, captureState, { now });
      await writeJsonAtomic(ledgerPath, ledger);
      return { migratedLegacy: Boolean(ledger.migratedFrom), ...synced };
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (args.command === 'claim') {
    if (!args.worker) throw new Error('--worker is required');
    let manifest;
    await withLedgerLock(ledgerPath, async () => {
      const ledger = await readJson(ledgerPath);
      manifest = claimQaJob(ledger, {
        workerId: args.worker,
        batchSize: args.batchSize,
        leaseMinutes: args.leaseMinutes,
        archiveRoot: path.resolve(args.archive ?? path.dirname(ledgerPath)),
      });
      if (manifest) {
        for (const candidate of manifest.candidates) {
          const actual = await sha256File(candidate.pngPath);
          if (actual !== candidate.pngSha256) throw new Error(`PNG changed before claim: ${candidate.sourceId}`);
        }
        await writeJsonAtomic(ledgerPath, ledger);
      }
    });
    const output = `${JSON.stringify(manifest ?? { job: null, reason: 'no_unreviewed_captures' }, null, 2)}\n`;
    if (args.output) {
      const outputPath = path.resolve(args.output);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, output, 'utf8');
    }
    else process.stdout.write(output);
    return;
  }

  if (args.command === 'complete') {
    if (!args.result) throw new Error('--result is required');
    const result = await readJson(path.resolve(args.result));
    const report = await withLedgerLock(ledgerPath, async () => {
      const ledger = await readJson(ledgerPath);
      await verifyResultFiles(ledger, result, path.resolve(args.archive ?? path.dirname(ledgerPath)));
      const completed = completeQaJob(ledger, result);
      await writeJsonAtomic(ledgerPath, ledger);
      return completed;
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (args.command === 'resolve') {
    if (!args.result) throw new Error('--result is required');
    const result = await readJson(path.resolve(args.result));
    const report = await withLedgerLock(ledgerPath, async () => {
      const ledger = await readJson(ledgerPath);
      await verifyResultFiles(ledger, result, path.resolve(args.archive ?? path.dirname(ledgerPath)));
      const resolved = resolveHumanReview(ledger, result);
      await writeJsonAtomic(ledgerPath, ledger);
      return resolved;
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (args.command === 'status') {
    const ledger = await readJson(ledgerPath);
    process.stdout.write(`${JSON.stringify(buildQaStatus(ledger, { targetPerLeaf: args.targetPerLeaf }), null, 2)}\n`);
    return;
  }

  throw new Error(`unknown command: ${args.command}\n\n${usage()}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[dq-qa] ${error.message}`);
    process.exitCode = 1;
  });
}
