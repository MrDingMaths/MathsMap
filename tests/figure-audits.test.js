import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const fxBad = join('tests', 'fixtures', 'figure-audits', 'fx-bad');
const fxGood = join('tests', 'fixtures', 'figure-audits', 'fx-good');

function run(script, args) {
  const result = spawnSync(process.execPath, [join('scripts', script), ...args], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

// --- audit-figure-scale.mjs -------------------------------------------------

test('audit-figure-scale flags a slant side drawn shorter than its label', () => {
  const { stdout } = run('audit-figure-scale.mjs', ['--dir', fxBad, '--only', 'skill-scale']);
  assert.match(stdout, /✗ LABEL-SCALE/);
  assert.match(stdout, /skill-scale foundation\[0\]\.question_text: label "6 cm" drawn 5\.00/);
});

test('audit-figure-scale exits 1 under --strict when a suspect is found', () => {
  const { status } = run('audit-figure-scale.mjs', ['--dir', fxBad, '--only', 'skill-scale', '--strict']);
  assert.equal(status, 1);
});

test('audit-figure-scale compares TRUE 3D lengths, so a foreshortened depth edge is clean', () => {
  const { stdout, status } = run('audit-figure-scale.mjs', ['--dir', fxGood, '--only', 'skill-3d', '--strict']);
  assert.equal(status, 0);
  assert.match(stdout, /✓ No figure-scale suspects/);
});

// The house 3D convention (shipped `trigonometry-3d`, and W3-11's `solve-3d-trig` after
// `\pic{angle=...}` proved to render as a full circle under `tdplot_main_coords`)
// hand-projects the solid into plain 2D coordinates and never mentions tdplot, so the
// string test alone missed it and the deliberately foreshortened depth edge was flagged
// against the in-plane median. A repeated OBLIQUE offset across 3+ coordinate pairs is
// the projection's signature; a plane parallelogram only ever repeats one twice.
test('audit-figure-scale skips a hand-projected solid that never mentions tdplot', () => {
  const { stdout, status } = run('audit-figure-scale.mjs', ['--dir', fxGood, '--only', 'skill-oblique', '--strict']);
  assert.equal(status, 0);
  assert.match(stdout, /✓ No figure-scale suspects/);
  assert.match(stdout, /skipped 1 hand-projected 3D figure/);
});

test('audit-figure-scale matches part-labels to sub-spans of a subdivided edge', () => {
  const { stdout, status } = run('audit-figure-scale.mjs', ['--dir', fxGood, '--only', 'skill-parts', '--strict']);
  assert.equal(status, 0);
  assert.match(stdout, /✓ No figure-scale suspects/);
});

// A bare `-- cycle` is the standard TikZ spelling and the only one the corpus
// uses (387 occurrences, 0 parenthesised). It was not tokenised as a path
// point, so the closing edge of every closed polygon was dropped: its label
// went unmatched and the figure fell below the 3-matched-label floor, being
// skipped rather than compared. Found in batch 14.
test('audit-figure-scale reads the closing edge of a bare `-- cycle` path', () => {
  const { stdout, status } = run('audit-figure-scale.mjs', ['--dir', fxBad, '--only', 'skill-cycle', '--strict']);
  assert.equal(status, 1);
  // 3 matched labels, not 2 — proof the closing edge became a real segment.
  assert.match(stdout, /compared 1 multi-label figure\(s\) \(3 matched labels\)/);
  assert.match(stdout, /label "9 cm" drawn 5\.00 coord-units/);
});

test('audit-figure-scale rejects space-separated ids after --only', () => {
  const { status, stderr } = run('audit-figure-scale.mjs', ['--only', 'skill-a', 'skill-b']);
  assert.equal(status, 2);
  assert.match(stderr, /comma form/);
});

// --- audit-angle-arms.mjs ---------------------------------------------------

test('audit-angle-arms flags a labelled angle drawn with only one bounding ray', () => {
  const { stdout } = run('audit-angle-arms.mjs', ['--dir', fxBad, '--only', 'skill-arms']);
  assert.match(stdout, /✗ ANGLE-ARMS/);
  assert.match(stdout, /has 1 bounding ray\(s\) drawn \(needs 2\)/);
});

test('audit-angle-arms exits 1 under --strict when a defect is found', () => {
  const { status } = run('audit-angle-arms.mjs', ['--dir', fxBad, '--only', 'skill-arms', '--strict']);
  assert.equal(status, 1);
});

test('audit-angle-arms does not assign an angle label to a bare ray tip', () => {
  const { stdout, status } = run('audit-angle-arms.mjs', ['--dir', fxGood, '--only', 'skill-parts', '--strict']);
  assert.equal(status, 0);
  assert.match(stdout, /✓ No angle-arm defects/);
});
