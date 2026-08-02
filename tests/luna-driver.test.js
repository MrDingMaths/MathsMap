import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
// Absolute: the driver spawns codex with cwd set to a fresh temp dir per call, so a
// relative stub path would resolve against that temp dir instead of the repo.
const stubPath = path.join(rootDir, 'tests', 'stubs', 'luna-stub.mjs');
// Any real skill from data/skills.json works here -- the driver reads it for the skill
// card (title/blurb/stage/difficulty/prereqs/dependents); the quiz/mastery content used in
// these tests is a hand-written blind bundle, not this skill's real public/quizzes file.
const skillId = 'add-subtract-fractions';

function run(args, env = {}) {
  const result = spawnSync(process.execPath, [path.join('scripts', 'run-luna-check.mjs'), ...args], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

async function makeCheckworkDir(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'mm-luna-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

function blindBundle(id) {
  return {
    skillId: id,
    quiz: [
      { id: 'q1', question_text: 'Q1', structure: 's1', mastery: false, options: [{ text: 'A' }, { text: 'B' }] },
    ],
    masteryPractice: [{ id: 'm1', question_text: 'M1' }],
  };
}

test('check mode: success writes .luna.json with reply + meta', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status, stdout } = run(
    ['--skills', skillId, '--checkwork-dir', dir, '--timeout-ms', '10000'],
    { MM_LUNA_CODEX_CMD: JSON.stringify(['node', stubPath]) },
  );
  assert.equal(status, 0, stdout);
  assert.match(stdout, /OK\s+add-subtract-fractions/);

  const written = JSON.parse(await readFile(path.join(dir, `${skillId}.luna.json`), 'utf8'));
  assert.equal(written.reply.skillId, skillId);
  assert.equal(written.reply.coverage.itemsAnswered, 2);
  assert.equal(written.meta.model, 'gpt-5.6-luna');
  assert.equal(written.meta.effort, 'high');
  assert.equal(written.meta.resolveMode, 'figures-first');
  assert.equal(written.meta.retries, 0);
  assert.equal(typeof written.meta.durationMs, 'number');
  assert.match(written.meta.startedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('check mode: malformed reply triggers exactly one retry then fails', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status, stdout } = run(
    ['--skills', skillId, '--checkwork-dir', dir, '--timeout-ms', '10000'],
    { MM_LUNA_CODEX_CMD: JSON.stringify(['node', stubPath]), LUNA_STUB_MODE: 'malformed' },
  );
  assert.equal(status, 1);
  assert.match(stdout, /FAIL\s+add-subtract-fractions/);
});

test('check mode: a hung call is killed at the timeout and reported as a failure', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status, stdout } = run(
    ['--skills', skillId, '--checkwork-dir', dir, '--timeout-ms', '800'],
    { MM_LUNA_CODEX_CMD: JSON.stringify(['node', stubPath]), LUNA_STUB_MODE: 'hang' },
  );
  assert.equal(status, 1);
  assert.match(stdout, /FAIL\s+add-subtract-fractions/);
});

test('check mode: missing blind.json fails without invoking codex', async (t) => {
  const dir = await makeCheckworkDir(t);
  const { status, stdout } = run(
    ['--skills', skillId, '--checkwork-dir', dir, '--timeout-ms', '5000'],
    { MM_LUNA_CODEX_CMD: JSON.stringify(['node', stubPath]) },
  );
  assert.equal(status, 1);
  assert.match(stdout, /run blind-for-check\.mjs first/);
});

test('compare mode: detects a planted mismatch and a coverage shortfall', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.key.json`), JSON.stringify({
    skillId,
    quiz: [{ id: 'q1', correctText: 'A', shuffledIndexOfCorrect: 0, originalOrder: [0, 1] }],
    masteryPractice: [{ id: 'm1', solution_text: 'sol' }],
  }));
  await writeFile(path.join(dir, `${skillId}.luna.json`), JSON.stringify({
    reply: {
      skillId,
      quiz: [{ id: 'q1', chosenIndex: 1, chosenOptionText: 'B', method: 'm', confidence: 'solid' }],
      masteryPractice: [{ id: 'm1', answer: 'x', method: 'm', confidence: 'solid' }],
      flags: [{ itemId: 'q1', category: 'ambiguity', note: 'looks ambiguous', suggestedFix: '' }],
      coverage: { itemsReceived: 3, itemsAnswered: 2 },
    },
    meta: {
      model: 'gpt-5.6-luna', effort: 'high', resolveMode: 'figures-first', durationMs: 1,
      retries: 0, startedAt: new Date().toISOString(),
    },
  }));

  const { status, stdout } = run(['--compare', skillId, '--checkwork-dir', dir]);
  assert.equal(status, 1);
  assert.match(stdout, /chose index 1.*expected index 0/s);
  assert.match(stdout, /SHORTFALL/);
  assert.match(stdout, /ambiguity \(1\)/);
  assert.match(stdout, /looks ambiguous/);
});

test('compare mode: a clean reply reports no mismatches/shortfall and exits 0', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.key.json`), JSON.stringify({
    skillId,
    quiz: [{ id: 'q1', correctText: 'A', shuffledIndexOfCorrect: 0, originalOrder: [0, 1] }],
    masteryPractice: [{ id: 'm1', solution_text: 'sol' }],
  }));
  await writeFile(path.join(dir, `${skillId}.luna.json`), JSON.stringify({
    reply: {
      skillId,
      quiz: [{ id: 'q1', chosenIndex: 0, chosenOptionText: 'A', method: 'm', confidence: 'solid' }],
      masteryPractice: [{ id: 'm1', answer: 'x', method: 'm', confidence: 'solid' }],
      flags: [],
      coverage: { itemsReceived: 2, itemsAnswered: 2 },
    },
    meta: {
      model: 'gpt-5.6-luna', effort: 'high', resolveMode: 'figures-first', durationMs: 1,
      retries: 0, startedAt: new Date().toISOString(),
    },
  }));

  const { status, stdout } = run(['--compare', skillId, '--checkwork-dir', dir]);
  assert.equal(status, 0);
  assert.match(stdout, /ANSWER MISMATCHES\n\s+none/);
});
