// scripts/lib/lint-math.mjs — the field-level KaTeX/text lints used by validate.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintMathString, lintControlChars, isEscaped, lintSelfReferencingNodes } from '../scripts/lib/lint-math.mjs';

function lint(str) {
  const problems = [];
  lintMathString(str, 'field', problems);
  return problems;
}

test('accepts a well-formed multi-line working block', () => {
  assert.deepEqual(lint('$a = 1$\n$b = 2$'), []);
});

test('an escaped \\$ is a literal dollar, not a delimiter', () => {
  assert.deepEqual(lint('The mulch costs $\\$468$.'), []);
  assert.deepEqual(lint('Graph $B$ passes the origin ($0$ kg costs \\$0).'), []);
  assert.equal(isEscaped('\\$', 1), true);
  assert.equal(isEscaped('a$', 1), false);
});

test('flags a $ left open at end of line even when the whole string balances', () => {
  // Four lines, one delimiter each: even overall, but every line renders wrong —
  // the span swallows the following working step instead of closing.
  const spill = '$a = 1\n$b = 2\n$c = 3\n$d = 4';
  const problems = lint(spill);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /opened but not closed on line 1/);
});

test('reports the offending line number', () => {
  // Total delimiter count here is even (2 + 0 + 1 + 1), so only the per-line rule can
  // catch it, and the spill starts on line 3. An ODD total is caught earlier by the
  // whole-string rule, which names the whole field rather than a line.
  const problems = lint('$a$\nplain text\n$b = 2\n$c = 3');
  assert.equal(problems.length, 1, JSON.stringify(problems));
  assert.match(problems[0], /line 3/);
});

test('still flags a genuinely odd delimiter count', () => {
  assert.match(lint('$a = 1')[0], /unbalanced \$ delimiters/);
});

test('flags unbalanced bold pairs', () => {
  assert.match(lint('**bold text')[0], /unbalanced \*\* pairs/);
});

test('flags KaTeX that will not render', () => {
  assert.match(lint('$\\frac{1$')[0], /unbalanced|KaTeX error/);
});

test('flags raw control characters from a single-escaped LaTeX macro', () => {
  const problems = [];
  lintControlChars('5 \times 3', 'field', problems); // literal TAB + "imes"
  assert.match(problems[0], /raw TAB/);
});

test('a multi-line tikz-free field with no maths at all is fine', () => {
  assert.deepEqual(lint('First line of prose.\nSecond line of prose.'), []);
});

test('flags a tikz node positioned relative to itself', () => {
  const problems = [];
  lintSelfReferencingNodes(
    '\\node[cell, below=0pt of b1.south west, anchor=north west] (b1) {Contract B};',
    'field', problems);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /node \(b1\) is positioned relative to itself/);
});

test('a node anchored to a different node is fine', () => {
  const problems = [];
  lintSelfReferencingNodes(
    '\\node[cell, below=0pt of a1.south west, anchor=north west] (b1) {Contract B};\n'
    + '\\node[cell, right=0pt of b1] (b2) {$450/fn};',
    'field', problems);
  assert.deepEqual(problems, []);
});
