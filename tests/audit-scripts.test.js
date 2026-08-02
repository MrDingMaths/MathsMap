import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const fxDup = join('tests', 'fixtures', 'audits', 'fx-dup');
const fxLeak = join('tests', 'fixtures', 'audits', 'fx-leak');

function run(script, args) {
  const result = spawnSync(process.execPath, [join('scripts', script), ...args], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

// --- Task 3: audit-duplicate-stems.mjs --------------------------------------

test('audit-duplicate-stems finds QUIZ-COPIES-PRACTICE across both foundation and mastery tiers', () => {
  const { stdout, status } = run('audit-duplicate-stems.mjs', ['--dir', fxDup]);
  assert.equal(status, 0);
  assert.match(stdout, /✗ QUIZ-COPIES-PRACTICE\n\s+skill-a q2 == skill-a f1/);
  assert.match(stdout, /✗ QUIZ-COPIES-PRACTICE\n\s+skill-a q4 == skill-a m1/);
});

test('audit-duplicate-stems finds INTRA-FILE-DUP for two quiz items with equal stems', () => {
  const { stdout } = run('audit-duplicate-stems.mjs', ['--dir', fxDup]);
  assert.match(stdout, /✗ INTRA-FILE-DUP\n\s+skill-a q3 == skill-a q3b/);
});

test('audit-duplicate-stems finds CROSS-SKILL-DUP for two different skills sharing a stem', () => {
  const { stdout } = run('audit-duplicate-stems.mjs', ['--dir', fxDup]);
  assert.match(stdout, /✗ CROSS-SKILL-DUP\n\s+skill-a q1 == skill-b f1/);
});

test('audit-duplicate-stems reports a NEAR-DUP advisory that does not add to the defect count', () => {
  const { stdout, status } = run('audit-duplicate-stems.mjs', ['--dir', fxDup, '--only', 'skill-c', '--strict']);
  assert.equal(status, 0); // advisory-only skill must not trip --strict
  assert.match(stdout, /NEAR-DUP/);
  assert.match(stdout, /skill-c q1 ~= skill-c q2/);
  assert.match(stdout, /✓ No duplicate-stem defects\./);
});

test('audit-duplicate-stems exits 1 under --strict when real defects are present', () => {
  const { status } = run('audit-duplicate-stems.mjs', ['--dir', fxDup, '--strict']);
  assert.equal(status, 1);
});

test('audit-duplicate-stems exits 0 without --strict even with defects present', () => {
  const { status } = run('audit-duplicate-stems.mjs', ['--dir', fxDup]);
  assert.equal(status, 0);
});

// --- Task 4: audit-option-hygiene.mjs ---------------------------------------

test('audit-option-hygiene finds LEAKED-KEY only within the same structure group', () => {
  const { stdout, status } = run('audit-option-hygiene.mjs', ['--dir', fxLeak]);
  assert.equal(status, 0);
  assert.match(stdout, /skill-leak: 1 structure group\(s\) of size >= 2/);
  assert.match(stdout, /✗ LEAKED-KEY\n\s+skill-leak q1: option "\$7\$" equals key of q2 \(structure: solve-two-step\)/);
  // q3 has a bare "$7$" option under a different, singleton structure group — never flagged.
  assert.doesNotMatch(stdout, /q3.*equals key/s);
});

test('audit-option-hygiene finds VAGUE-WHY for boilerplate distractor reasons', () => {
  const { stdout } = run('audit-option-hygiene.mjs', ['--dir', fxLeak]);
  assert.match(stdout, /✗ VAGUE-WHY\n\s+skill-leak q2: option "\$6\$"/);
});

test('audit-option-hygiene exits 1 under --strict when defects are present', () => {
  const { status } = run('audit-option-hygiene.mjs', ['--dir', fxLeak, '--strict']);
  assert.equal(status, 1);
});

// --- Task 1: stray positionals rejected across all four scripts ------------

test('all four scripts reject stray positionals after --only with exit 2', () => {
  for (const script of [
    'validate.mjs',
    'audit-equivalent-options.mjs',
    'audit-duplicate-stems.mjs',
    'audit-option-hygiene.mjs',
  ]) {
    const { status, stderr } = run(script, ['--only', 'a', 'b']);
    assert.equal(status, 2, `${script} should exit 2 on stray positionals`);
    assert.match(stderr, /comma form/, `${script} should hint at the comma form`);
  }
});
