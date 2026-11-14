import test from 'node:test';
import assert from 'node:assert/strict';
import { splitParts, pairParts } from '../src/lib/skill-parts.js';

test('splitParts separates the stem from consecutive lettered parts', () => {
  const result = splitParts('Find the precision.\n(a) $20$ kg\n(b) $20.6$ kg\nmeasured on scales');
  assert.equal(result.stem, 'Find the precision.');
  assert.deepEqual(result.parts, [
    { label: 'a', text: '$20$ kg' },
    { label: 'b', text: '$20.6$ kg\nmeasured on scales' },
  ]);
});

test('splitParts leaves text whole unless the run is a, b, c… from a', () => {
  for (const text of ['Plain question', '(a) only one part', '(b) x\n(c) y', '(a) x\n(a) y', '(a) x\n(c) y']) {
    assert.deepEqual(splitParts(text), { stem: text, parts: [] });
  }
});

test('splitParts ignores part-like lines inside tikz blocks', () => {
  const text = 'Stem\n[tikz]\n(a) not a part\n[/tikz]\n(a) one\n(b) two';
  const result = splitParts(text);
  assert.equal(result.stem, 'Stem\n[tikz]\n(a) not a part\n[/tikz]');
  assert.deepEqual(result.parts.map(p => p.label), ['a', 'b']);
});

test('pairParts pairs matching labels and refuses mismatches', () => {
  const paired = pairParts('Q\n(a) x\n(b) y', '(a) X\n(b) Y');
  assert.deepEqual(paired.rows, [
    { label: 'a', prompt: 'x', solution: 'X' },
    { label: 'b', prompt: 'y', solution: 'Y' },
  ]);
  assert.equal(pairParts('(a) x\n(b) y', '(a) X'), null);
  assert.equal(pairParts('No parts', '(a) X\n(b) Y'), null);
});
