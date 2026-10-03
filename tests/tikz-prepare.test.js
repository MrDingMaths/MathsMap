import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareTikz } from '../src/lib/tikz-prepare.js';

test('wraps unambiguous AGY TikZ bodies in a tikzpicture environment', () => {
  const prepared = prepareTikz('\\draw (0,0) rectangle (1,1);');
  assert.match(prepared.cleanCode, /\\begin\{tikzpicture\}/);
  assert.match(prepared.cleanCode, /\\end\{tikzpicture\}$/);
});

test('does not double-wrap complete TikZ figures', () => {
  const code = '\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}';
  assert.ok(prepareTikz(code).cleanCode.endsWith(code));
  assert.equal((prepareTikz(code).cleanCode.match(/\\begin\{tikzpicture\}/g)||[]).length,1);
});

test('requests amsmath for boldsymbol while ordinary diagrams remain package-free', () => {
  const prepared = prepareTikz('\\begin{tikzpicture}\\node at (0,0) {$\\boldsymbol{x}$};\\end{tikzpicture}');
  assert.deepEqual(JSON.parse(prepared.pkgJson), { amsmath: '' });
  assert.match(prepared.cleanCode, /\\boldsymbol\{x\}/);
  assert.equal(prepareTikz('\\begin{tikzpicture}\\draw (0,0) rectangle (1,1);\\end{tikzpicture}').pkgJson, null);
});

test('loads amsmath for boxed handwriting spaces in diagram exponents', () => {
  const prepared = prepareTikz('\\begin{tikzpicture}\\node at (0,0) {$2^{\\boxed{\\rule{0pt}{4mm}\\hspace{9mm}}}$};\\end{tikzpicture}');
  assert.deepEqual(JSON.parse(prepared.pkgJson), { amsmath: '' });
  assert.match(prepared.cleanCode, /\\boxed\{\\rule\{0pt\}\{4mm\}\\hspace\{9mm\}\}/);
});

test('loads the supported symbol package for ASTC checkmarks without changing diagram content', () => {
  const code = '\\begin{tikzpicture}\\node[green] at (1,1) {$\\checkmark$};\\end{tikzpicture}';
  const prepared = prepareTikz(code);
  assert.deepEqual(JSON.parse(prepared.pkgJson), { amssymb: '' });
  assert.match(prepared.cleanCode, /\\node\[green\] at \(1,1\) \{\$\\checkmark\$\}/);
  assert.equal(prepareTikz(code.replace('\\checkmark', '\\checkmarkExtra')).pkgJson, null);
  assert.equal(prepareTikz(code.replace('\\checkmark', 'A')).pkgJson, null);
});
