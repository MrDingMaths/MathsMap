// scripts/run-sonnet-check.mjs — the Claude-subscription blind checker. Exercised against
// a scripted stub CLI (tests/stubs/sonnet-stub.mjs); no test contacts a real model.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const stubPath = path.join(rootDir, 'tests', 'stubs', 'sonnet-stub.mjs');
// Any real skill id works — the driver reads data/skills.json for the card only.
const skillId = 'add-subtract-fractions';

function run(args, env = {}) {
  const result = spawnSync(process.execPath, [path.join('scripts', 'run-sonnet-check.mjs'), ...args], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, MM_CLAUDE_CMD: JSON.stringify([process.execPath, stubPath]), ...env },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

async function makeCheckworkDir(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'mm-sonnet-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

function blindBundle(id) {
  return {
    skillId: id,
    quiz: [{ id: 'q1', question_text: 'Q1', structure: 's1', mastery: false, options: [{ text: 'A' }, { text: 'B' }] }],
    masteryPractice: [{ id: 'm1', question_text: 'M1' }],
  };
}

test('writes {id}.luna.json in the shape --compare consumes', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status, stdout } = run(['--skills', skillId, '--checkwork-dir', dir]);
  assert.equal(status, 0, stdout);

  const record = JSON.parse(await readFile(path.join(dir, `${skillId}.luna.json`), 'utf8'));
  // --compare reads exactly these fields.
  assert.equal(record.reply.quiz[0].chosenIndex, 1);
  assert.equal(record.reply.quiz[0].chosenOptionText, 'B');
  assert.equal(record.reply.coverage.itemsReceived, 2);
  assert.equal(record.reply.coverage.itemsAnswered, 2);
  // meta records WHICH checker ran, so a batch checked by Sonnet is distinguishable.
  assert.match(record.meta.model, /sonnet/);
  assert.equal(record.meta.checker, 'claude-cli');
  // Usage is summed across fresh + cached prompt tokens.
  assert.equal(record.meta.usage.input_tokens, 1500);
});

test('a fenced reply still parses (the model ignoring "no markdown fencing")', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status } = run(['--skills', skillId, '--checkwork-dir', dir], { SONNET_STUB_MODE: 'fenced' });
  assert.equal(status, 0);
  const record = JSON.parse(await readFile(path.join(dir, `${skillId}.luna.json`), 'utf8'));
  assert.equal(record.reply.quiz[0].chosenIndex, 1);
});

test('a malformed reply retries once, then fails without writing a result', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status, stdout } = run(['--skills', skillId, '--checkwork-dir', dir], { SONNET_STUB_MODE: 'malformed' });
  assert.equal(status, 1);
  assert.match(stdout, /FAIL/);
  await assert.rejects(readFile(path.join(dir, `${skillId}.luna.json`), 'utf8'));
});

test('an is_error envelope is reported as a failure, not parsed as a reply', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));

  const { status, stdout } = run(['--skills', skillId, '--checkwork-dir', dir], { SONNET_STUB_MODE: 'is_error' });
  assert.equal(status, 1);
  assert.match(stdout, /usage limit|claude reported an error/);
});

test('missing blind.json fails without invoking the CLI', async (t) => {
  const dir = await makeCheckworkDir(t);
  const { status, stdout } = run(['--skills', skillId, '--checkwork-dir', dir]);
  assert.equal(status, 1);
  assert.match(stdout, /blind-for-check/);
});

test('the prompt sent to the checker contains no answer key', async (t) => {
  const dir = await makeCheckworkDir(t);
  await writeFile(path.join(dir, `${skillId}.blind.json`), JSON.stringify(blindBundle(skillId)));
  // A key file alongside the blind bundle must never reach the model.
  await writeFile(path.join(dir, `${skillId}.key.json`), JSON.stringify({ quiz: [{ id: 'q1', correctText: 'A', shuffledIndexOfCorrect: 0 }] }));

  const { buildPrompt, loadSkillCard } = await import('../scripts/run-luna-check.mjs');
  const prompt = buildPrompt({
    skillId,
    skillCard: await loadSkillCard(skillId),
    blindBundle: blindBundle(skillId),
    resolveMode: 'figures-first',
  });
  assert.doesNotMatch(prompt, /correctText|shuffledIndexOfCorrect|solution_text/);
});
