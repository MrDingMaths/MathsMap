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
