// TikZJax engine bundle integrity: the deployed public/libs/tikzjax/{run-tex,tikzjax}.js
// must be byte-reproducible from the pristine *.vendor.js files via scripts/tikz-patcher.
// Ported from MathsDatabase tools/tikz-performance/{patcher.test.mjs,check-tikz-bundles.mjs}.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchRunTex, patchTikzJax, generate } from '../scripts/tikz-patcher/patcher.mjs';
import { verifyBundlePairs } from '../scripts/tikz-patcher/bundles.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'libs', 'tikzjax');
const runVendor = fs.readFileSync(path.join(dir, 'run-tex.vendor.js'), 'utf8');
const tikzVendor = fs.readFileSync(path.join(dir, 'tikzjax.vendor.js'), 'utf8');

test('patches change the source', () => {
  assert.notEqual(patchRunTex(runVendor), runVendor);
  assert.notEqual(patchTikzJax(tikzVendor), tikzVendor);
});

test('ambiguous patch sites are refused', () => {
  assert.throws(
    () => patchRunTex(runVendor.replace('let o,i,a;', 'let o,i,a;let o,i,a;')),
    /not unique/);
});

test('deployed bundles are byte-identical to regenerated output', () => {
  const { runOut, tikzOut } = generate({ write: false });
  assert.equal(runOut, fs.readFileSync(path.join(dir, 'run-tex.js'), 'utf8'));
  assert.equal(tikzOut, fs.readFileSync(path.join(dir, 'tikzjax.js'), 'utf8'));
});

test('verifyBundlePairs reports clean', () => {
  const { errors, pending } = verifyBundlePairs(root);
  assert.deepEqual(errors, []);
  assert.deepEqual(pending, []);
});
