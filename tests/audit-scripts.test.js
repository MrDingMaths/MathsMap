import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const fxDup = join('tests', 'fixtures', 'audits', 'fx-dup');
const fxLeak = join('tests', 'fixtures', 'audits', 'fx-leak');
const fxSigDup = join('tests', 'fixtures', 'audits', 'fx-sigdup');
const fxSigWeak = join('tests', 'fixtures', 'audits', 'fx-sigweak');
const fxIntersect = join('tests', 'fixtures', 'audits', 'fx-intersect');

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

// Pins the batch-16 miss: a quiz item that REWORDS a mastery card's stem but
// keeps the same numbers and the same correct answer sails through stem
// matching (different norm) and must instead be caught by the value-sig class.
test('audit-duplicate-stems finds QUIZ-COPIES-PRACTICE-VALUES for a reworded stem with identical values', () => {
  const { stdout, status } = run('audit-duplicate-stems.mjs', ['--dir', fxSigDup, '--strict']);
  assert.equal(status, 1);
  assert.match(stdout, /✗ QUIZ-COPIES-PRACTICE-VALUES\n\s+skill-a q1 == skill-a m1/);
  assert.match(stdout, /QUIZ-COPIES-PRACTICE-VALUES: 1\./);
});

// Pins the W3-11 miss on the other side: when canonicalise() cannot parse either
// answer — solution SETS like `x = \frac{5\pi}{6}, \frac{11\pi}{6}` — the signature
// degenerates to the stem literals alone, and on a topic with a tiny literal
// vocabulary (0, 2, 3 and a domain in every stem) it collides wholesale. All 30 of
// W3-11's flags were pairs with different equations AND different solution sets, so
// an evidence-free hit is now an advisory, never a gate-blocking defect.
test('audit-duplicate-stems demotes an answer-less value-signature hit to VALUES-WEAK', () => {
  const { stdout, status } = run('audit-duplicate-stems.mjs', ['--dir', fxSigWeak, '--strict']);
  assert.equal(status, 0);
  assert.match(stdout, /QUIZ-COPIES-PRACTICE-VALUES: 0\./);
  assert.match(stdout, /VALUES-WEAK advisory: 1\./);
  assert.match(stdout, /QUIZ-COPIES-PRACTICE-VALUES-WEAK, not counted toward --strict/);
});

test('audit-duplicate-stems does not flag QUIZ-COPIES-PRACTICE-VALUES for a reworded stem with different values', () => {
  const { stdout } = run('audit-duplicate-stems.mjs', ['--dir', fxSigDup]);
  // q2 (9, 3 / 75%) vs m2 (4, 1 / 80%): same shape, different numbers and
  // answer on both sides — must not collide with either q1 or m1.
  assert.doesNotMatch(stdout, /q2 == skill-a m/);
  assert.doesNotMatch(stdout, /q1 == skill-a m2/);
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

// --- audit-intersecting-features.mjs ----------------------------------------

test('audit-intersecting-features finds INTERSECT when the key is the strict mode of every slot', () => {
  const { stdout, status } = run('audit-intersecting-features.mjs', ['--dir', fxIntersect]);
  assert.equal(status, 0);
  assert.match(stdout, /✗ INTERSECT\n\s+skill-intersect q1: key is the strict mode of all 3 varying slot\(s\)/);
  // The printed grid is what a repair task reads, so it must carry the starred key.
  assert.match(stdout, /slot 11: \*W \| E \| W \| W/);
});

test('audit-intersecting-features leaves a balanced 2x2 distractor grid alone', () => {
  const { stdout } = run('audit-intersecting-features.mjs', ['--dir', fxIntersect]);
  // q2's every feature value ties 2:2 — that is the repair shape, not a defect.
  assert.doesNotMatch(stdout, /skill-intersect q2/);
  // q3 varies in one slot only: nothing to intersect.
  assert.doesNotMatch(stdout, /skill-intersect q3/);
});

test('audit-intersecting-features reports INTERSECT-WEAK as an advisory that --strict ignores', () => {
  const { stdout } = run('audit-intersecting-features.mjs', ['--dir', fxIntersect]);
  assert.match(stdout, /Advisory \(INTERSECT-WEAK, not counted toward --strict\)/);
  assert.match(stdout, /~ skill-intersect q4: key is the strict mode of all 3 feature\(s\)/);
  assert.match(stdout, /INTERSECT: 1\. INTERSECT-WEAK advisory: 1\./);
});

test('audit-intersecting-features exits 1 under --strict when defects are present', () => {
  const { status } = run('audit-intersecting-features.mjs', ['--dir', fxIntersect, '--strict']);
  assert.equal(status, 1);
});

// --- Task 1: stray positionals rejected across all five scripts ------------

test('all five scripts reject stray positionals after --only with exit 2', () => {
  for (const script of [
    'validate.mjs',
    'audit-equivalent-options.mjs',
    'audit-duplicate-stems.mjs',
    'audit-option-hygiene.mjs',
    'audit-intersecting-features.mjs',
  ]) {
    const { status, stderr } = run(script, ['--only', 'a', 'b']);
    assert.equal(status, 2, `${script} should exit 2 on stray positionals`);
    assert.match(stderr, /comma form/, `${script} should hint at the comma form`);
  }
});

// --- audit-figure-quota.mjs -------------------------------------------------
//
// The quota is keyed off the real data/skills.json (a skill "promises a figure" via its own
// title/blurb), so the fixtures are named after a genuinely visual skill id and only the
// content root is overridden.

const fxFigQuota = join('tests', 'fixtures', 'audits', 'fx-figquota');
const fxFigQuotaOk = join('tests', 'fixtures', 'audits', 'fx-figquota-ok');

test('audit-figure-quota flags a visual skill whose content carries no [tikz] block', () => {
  const { stdout, status } = run('audit-figure-quota.mjs', ['--dir', fxFigQuota, '--only', 'graph-parametric']);
  assert.equal(status, 0);
  assert.match(stdout, /✗ FIGURE-QUOTA \| graph-parametric \| 0 \[tikz\] block/);
});

test('audit-figure-quota passes the same skill once it carries one figure', () => {
  const { stdout, status } = run('audit-figure-quota.mjs', ['--dir', fxFigQuotaOk, '--only', 'graph-parametric', '--strict']);
  assert.equal(status, 0);
  assert.match(stdout, /✓ figure quota: 1 visual skill\(s\)/);
});

test('audit-figure-quota exits 1 under --strict when a visual skill has no figure', () => {
  const { status } = run('audit-figure-quota.mjs', ['--dir', fxFigQuota, '--only', 'graph-parametric', '--strict']);
  assert.equal(status, 1);
});

test('audit-figure-quota rejects stray positionals after --only with exit 2', () => {
  const { status, stderr } = run('audit-figure-quota.mjs', ['--only', 'a', 'b']);
  assert.equal(status, 2);
  assert.match(stderr, /comma form/);
});
