import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildQaStatus,
  captureRevisionKey,
  claimQaJob,
  completeQaJob,
  createEmptyQaLedger,
  migrateLegacyQaLedger,
  resolveHumanReview,
  syncCaptureState,
  withLedgerLock,
} from '../scripts/dq/qa-jobs.mjs';

const checksum = (character) => character.repeat(64);
const captured = (sourceId, hash, sourcePath = ['Maths', 'Number', 'Integers']) => ({
  sourceId,
  sourcePaths: [sourcePath],
  capture: {
    pngPath: `png/${sourceId}.png`,
    pngChecksum: hash,
    capturedAt: `2026-08-01T00:00:${String(sourceId).padStart(2, '0')}.000Z`,
  },
});
const stateWith = (...candidates) => ({ candidates: Object.fromEntries(candidates.map((item) => [item.sourceId, item])) });

test('sync is idempotent and a changed checksum supersedes the old revision', () => {
  const ledger = createEmptyQaLedger('2026-08-02T00:00:00.000Z');
  const first = stateWith(captured('1', checksum('a')));
  assert.deepEqual(syncCaptureState(ledger, first), { added: 1, superseded: 0, current: 1 });
  assert.deepEqual(syncCaptureState(ledger, first), { added: 0, superseded: 0, current: 1 });

  const oldKey = captureRevisionKey('1', checksum('a'));
  ledger.captures[oldKey].status = 'accepted';
  const changed = stateWith(captured('1', checksum('b')));
  assert.deepEqual(syncCaptureState(ledger, changed), { added: 1, superseded: 1, current: 1 });
  assert.equal(ledger.captures[oldKey].status, 'superseded');
  assert.equal(ledger.captures[captureRevisionKey('1', checksum('b'))].status, 'unreviewed');
});

test('claims are disjoint, deterministic, and capped at five images', () => {
  const ledger = createEmptyQaLedger();
  syncCaptureState(ledger, stateWith(...Array.from({ length: 8 }, (_, index) =>
    captured(String(index + 1), String(index + 1).repeat(64)))));

  const first = claimQaJob(ledger, { workerId: 'luna-a', batchSize: 5, now: '2026-08-02T01:00:00.000Z' });
  const second = claimQaJob(ledger, { workerId: 'luna-b', batchSize: 5, now: '2026-08-02T01:00:01.000Z' });
  assert.equal(first.candidates.length, 5);
  assert.equal(second.candidates.length, 3);
  assert.equal(new Set([...first.candidates, ...second.candidates].map((item) => item.captureKey)).size, 8);
  assert.equal(claimQaJob(ledger, { workerId: 'luna-c', now: '2026-08-02T01:00:02.000Z' }), null);
  assert.throws(() => claimQaJob(ledger, { workerId: 'x', batchSize: 6 }), /1 to 5/);
});

test('human resolution is exact-revision bound and final', () => {
  const ledger = createEmptyQaLedger();
  syncCaptureState(ledger, stateWith(captured('1', checksum('a'))));
  const key = captureRevisionKey('1', checksum('a'));
  ledger.captures[key].status = 'needs_human_review';
  const result = {
    reviewer: 'human-a',
    completedAt: '2026-08-02T02:00:00.000Z',
    decisions: [{
      sourceId: '1',
      pngSha256: checksum('a'),
      verdict: 'rejected_source',
      reasonCodes: ['intrinsic_ambiguity'],
      notes: 'The complete source is intrinsically ambiguous.',
    }],
  };
  assert.deepEqual(resolveHumanReview(ledger, result), { reviewer: 'human-a', resolved: 1 });
  assert.equal(ledger.captures[key].status, 'rejected_source');
  assert.throws(() => resolveHumanReview(ledger, result), /not needs_human_review/);
});

test('completion is exact-checksum and exact-membership bound', () => {
  const ledger = createEmptyQaLedger();
  syncCaptureState(ledger, stateWith(captured('1', checksum('a')), captured('2', checksum('b'))));
  const job = claimQaJob(ledger, {
    workerId: 'luna-a', batchSize: 2, now: '2026-08-02T01:00:00.000Z', leaseMinutes: 30,
  });
  const base = {
    jobId: job.jobId,
    workerId: 'luna-a',
    decisions: [
      { sourceId: '1', pngSha256: checksum('a'), verdict: 'accepted', reasonCodes: [], notes: '' },
      { sourceId: '2', pngSha256: checksum('b'), verdict: 'recapture_requested', reasonCodes: ['card_cropped'], notes: '' },
    ],
  };
  const wrongChecksum = structuredClone(base);
  wrongChecksum.decisions[0].pngSha256 = checksum('c');
  assert.throws(() => completeQaJob(ledger, wrongChecksum, { now: '2026-08-02T01:01:00.000Z' }), /unassigned capture/);
  const missing = structuredClone(base);
  missing.decisions.pop();
  assert.throws(() => completeQaJob(ledger, missing, { now: '2026-08-02T01:01:00.000Z' }), /missing 1 assigned/);

  assert.deepEqual(completeQaJob(ledger, base, { now: '2026-08-02T01:01:00.000Z' }), {
    jobId: job.jobId, completed: 2,
  });
  assert.equal(ledger.captures[captureRevisionKey('1', checksum('a'))].status, 'accepted');
  assert.equal(ledger.captures[captureRevisionKey('2', checksum('b'))].status, 'recapture_requested');
  assert.throws(() => completeQaJob(ledger, base), /completed, not claimed/);
});

test('expired leases are requeued before another worker claims them', () => {
  const ledger = createEmptyQaLedger();
  syncCaptureState(ledger, stateWith(captured('1', checksum('a'))));
  const expired = claimQaJob(ledger, {
    workerId: 'luna-a', now: '2026-08-02T01:00:00.000Z', leaseMinutes: 1,
  });
  const replacement = claimQaJob(ledger, {
    workerId: 'luna-b', now: '2026-08-02T01:02:00.000Z', leaseMinutes: 1,
  });
  assert.equal(ledger.jobs[expired.jobId].status, 'expired');
  assert.equal(replacement.candidates[0].sourceId, '1');
  assert.notEqual(replacement.jobId, expired.jobId);
});

test('legacy pilot decisions migrate onto current checksums', () => {
  const state = stateWith(
    captured('1', checksum('a')),
    captured('2', checksum('b')),
    captured('3', checksum('c')),
  );
  const ledger = migrateLegacyQaLedger({
    schemaVersion: 1,
    auditedAt: '2026-08-01T14:00:00.000Z',
    acceptedIds: ['1'],
    recaptured: { 1: 'Passed after recapture.' },
    rejected: { 2: 'Source upload is truncated.' },
  }, state);
  assert.equal(ledger.captures[captureRevisionKey('1', checksum('a'))].status, 'accepted');
  assert.equal(ledger.captures[captureRevisionKey('1', checksum('a'))].decision.notes, 'Passed after recapture.');
  assert.equal(ledger.captures[captureRevisionKey('2', checksum('b'))].status, 'rejected_source');
  assert.equal(ledger.captures[captureRevisionKey('3', checksum('c'))].status, 'unreviewed');
});

test('status reports current revisions and per-leaf remaining targets', () => {
  const ledger = createEmptyQaLedger();
  syncCaptureState(ledger, stateWith(
    captured('1', checksum('a'), ['Maths', 'Number', 'Integers']),
    captured('2', checksum('b'), ['Maths', 'Number', 'Integers']),
  ));
  ledger.captures[captureRevisionKey('1', checksum('a'))].status = 'accepted';
  const report = buildQaStatus(ledger, { targetPerLeaf: 3 });
  assert.equal(report.currentCaptures, 2);
  assert.deepEqual(report.counts, { accepted: 1, unreviewed: 1 });
  assert.equal(report.byLeaf[0].remainingToTarget, 2);
});

test('filesystem lock serializes concurrent ledger mutations', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dq-qa-lock-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const ledgerPath = path.join(directory, 'ledger.json');
  await writeFile(ledgerPath, JSON.stringify({ value: 0 }));
  const increment = () => withLedgerLock(ledgerPath, async () => {
    const value = JSON.parse(await readFile(ledgerPath, 'utf8'));
    await new Promise((resolve) => setTimeout(resolve, 15));
    value.value += 1;
    await writeFile(ledgerPath, JSON.stringify(value));
  });
  await Promise.all([increment(), increment(), increment()]);
  assert.equal(JSON.parse(await readFile(ledgerPath, 'utf8')).value, 3);
});
