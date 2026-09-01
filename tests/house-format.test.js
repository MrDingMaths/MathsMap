// scripts/lib/house-format.mjs — the stem/solution spacing canonicaliser.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { houseFormatStem, houseFormatSolution } from '../scripts/lib/house-format.mjs';

test('a stem gets one sentence per line', () => {
  assert.equal(
    houseFormatStem('Find the area of the rectangle. Give your answer in cm$^2$.'),
    'Find the area of the rectangle.\nGive your answer in cm$^2$.'
  );
});

test('a sentence break immediately before a math run still splits', () => {
  // SENT_RE cannot see across the protected-block cut, so this is handled separately.
  assert.equal(houseFormatStem('Solve for $x$. $2x + 1 = 9$'), 'Solve for $x$.\n$2x + 1 = 9$');
});

test('decimals inside math are never split', () => {
  assert.equal(houseFormatStem('Round $3.47$ to one decimal place.'), 'Round $3.47$ to one decimal place.');
  assert.equal(houseFormatStem('The cost is \\$4.50 each.'), 'The cost is \\$4.50 each.');
});

test('abbreviations are not sentence ends', () => {
  assert.equal(houseFormatStem('Use a benchmark, e.g. $0.5$, to compare.'), 'Use a benchmark, e.g. $0.5$, to compare.');
  assert.equal(houseFormatStem('Mr. Chen buys $3$ apples.'), 'Mr. Chen buys $3$ apples.');
});

test('an enumerator label stays with its item', () => {
  assert.equal(
    houseFormatStem('Which is largest?\nA. $\\frac{1}{2}$\nB. $\\frac{1}{3}$'),
    'Which is largest?\nA. $\\frac{1}{2}$\nB. $\\frac{1}{3}$'
  );
  // "A. " before a math block is a list label, not a sentence end.
  assert.equal(houseFormatStem('Pick one.\nA. $y = 2x$'), 'Pick one.\nA. $y = 2x$');
});

test('blank lines are removed, [tikz] included', () => {
  assert.equal(
    houseFormatStem('Find $x$.\n\n[tikz]\n\\begin{tikzpicture}\n\\end{tikzpicture}\n[/tikz]\n\nGive a reason.'),
    'Find $x$.\n[tikz]\n\\begin{tikzpicture}\n\\end{tikzpicture}\n[/tikz]\nGive a reason.'
  );
  assert.equal(houseFormatSolution('$x = 3$\nA check.\n\nGiving $y = 4$.'), '$x = 3$\nA check.\nGiving $y = 4$.');
});

test('a blank line separating two maths runs is kept', () => {
  // groupTextBlocks() welds adjacent $…$ lines into one aligned block, so this
  // blank is the only thing stopping two computations chaining into one.
  const solution = '$a^2+b^2$\n$=145$\n\n$h^2$\n$=144$';
  assert.equal(houseFormatSolution(solution), solution);
  assert.equal(houseFormatStem(solution), solution);
  // ...but a run of several blanks still collapses to the single separator.
  assert.equal(houseFormatSolution('$a=1$\n\n\n$b=2$'), '$a=1$\n\n$b=2$');
});

test('a [tikz] interior is copied byte for byte', () => {
  const code = '[tikz]\n\\begin{tikzpicture}\n  \\draw (0,0) -- (1,1);  \n\n  \\node at (0,0) {A. B};\n\\end{tikzpicture}\n[/tikz]';
  assert.equal(houseFormatStem(`Find $x$.\n${code}`), `Find $x$.\n${code}`);
});

test('a solution is never sentence-split', () => {
  const solution = 'Both angles sit on a straight line. The unknown is the remainder.\n$180 - 55$\n$=125^{\\circ}$';
  assert.equal(houseFormatSolution(solution), solution);
});

test('trailing spaces and outer whitespace are trimmed', () => {
  assert.equal(houseFormatSolution('\n$x = 3$   \n$y = 4$\n\n'), '$x = 3$\n$y = 4$');
});

test('CRLF is normalised to LF', () => {
  assert.equal(houseFormatStem('Find $x$.\r\nGive a reason.'), 'Find $x$.\nGive a reason.');
});

test('both formatters are idempotent', () => {
  const samples = [
    'Find the area. Give your answer in cm$^2$.',
    'Which is largest?\nA. $\\frac{1}{2}$\nB. $\\frac{1}{3}$',
    'Find $x$.\n\n[tikz]\n\\begin{tikzpicture}\n\\end{tikzpicture}\n[/tikz]\n\nExplain.',
    '$180 - 55$\n$=125^{\\circ}$, angles on a straight line'
  ];
  for (const s of samples) {
    assert.equal(houseFormatStem(houseFormatStem(s)), houseFormatStem(s));
    assert.equal(houseFormatSolution(houseFormatSolution(s)), houseFormatSolution(s));
  }
});

test('non-strings pass through untouched', () => {
  assert.equal(houseFormatStem(undefined), undefined);
  assert.equal(houseFormatSolution(null), null);
});
