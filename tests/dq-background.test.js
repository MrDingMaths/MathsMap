import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  classifyRunStatus,
  createRunRecord,
  normalizeCaptureArgs,
  parseBackgroundArgs,
  recordedProcessMatches,
} from '../scripts/dq/background.mjs';

test('background CLI keeps supervisor and crawler arguments separate', () => {
  assert.deepEqual(parseBackgroundArgs([
    'start', '--archive', 'archive', '--', 'crawl', '--write', '--headless', '--adaptive',
  ]), {
    command: 'start',
    archive: 'archive',
    tail: 20,
    captureArgs: ['crawl', '--write', '--headless', '--adaptive'],
  });
  assert.deepEqual(normalizeCaptureArgs([]), ['crawl', '--write', '--headless']);
  assert.throws(() => normalizeCaptureArgs(['login', '--headless']), /restricted.*crawl/);
  assert.throws(() => normalizeCaptureArgs(['crawl', '--write']), /must include --headless/);
});
test('run records keep logs and status files within the selected archive', () => {
  const archiveRoot = path.resolve('private-archive');
  const run = createRunRecord({
    repoRoot: path.resolve('.'),
    archiveRoot,
    captureArgs: ['crawl', '--write', '--headless'],
    runId: 'dq-crawl-test',
    runToken: 'secret-marker',
    startedAt: '2026-08-02T00:00:00.000Z',
  });
  for (const filePath of [run.stdoutPath, run.stderrPath, run.exitPath, run.payloadPath]) {
    assert.equal(path.relative(archiveRoot, filePath).startsWith('..'), false);
  }
  assert.equal(run.status, 'starting');
  assert.equal(run.command.marker, 'secret-marker');
});

test('PID is considered active only when its command contains the exact run marker and worker', () => {
  const run = createRunRecord({
    repoRoot: 'C:\\repo',
    archiveRoot: 'C:\\repo\\.diagnostic-questions',
    captureArgs: ['crawl', '--write', '--headless'],
    runId: 'run-1',
    runToken: 'token-123',
  });
  run.pid = 321;
  const matching = {
    ProcessId: 321,
    CommandLine: `powershell -File "${run.workerScript}" -DqRunToken token-123`,
  };
  assert.equal(recordedProcessMatches(run, matching), true);
  assert.equal(recordedProcessMatches(run, { ...matching, CommandLine: 'unrelated process' }), false);
  assert.equal(recordedProcessMatches(run, { ...matching, ProcessId: 322 }), false);
  assert.deepEqual(classifyRunStatus(run, { processInfo: matching }), {
    state: 'running', active: true, exitCode: null, finishedAt: null,
  });
  assert.equal(classifyRunStatus(run, { processInfo: { ...matching, CommandLine: 'unrelated' } }).state, 'stale_pid');
});

test('an exit record takes precedence over PID reuse', () => {
  const run = { pid: 123, runToken: 'token', workerScript: 'worker.ps1' };
  const status = classifyRunStatus(run, {
    exitRecord: { outcome: 'completed', exitCode: 0, finishedAt: '2026-08-02T01:00:00.000Z' },
    processInfo: { ProcessId: 123, CommandLine: 'unrelated reused PID' },
  });
  assert.deepEqual(status, {
    state: 'completed', active: false, exitCode: 0, finishedAt: '2026-08-02T01:00:00.000Z',
  });
});
