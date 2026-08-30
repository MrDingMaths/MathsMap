import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findArithmeticDefects, evaluateExpression, withinTolerance } from '../scripts/audit-arithmetic.mjs';
import { lintBareTeX, lintMathString } from '../scripts/lib/lint-math.mjs';

// --- the two W3-3 defects this audit exists to catch -------------------------------

test('flags a false sum asserted inline (W3-3 grouped-summary-statistics q3)', () => {
  const found = findArithmeticDefects('$27 + 145 + 98 = 280$', 'q3');
  assert.equal(found.length, 1);
  assert.equal(found[0].actual, 270);
  assert.equal(found[0].claimed, 280);
});

test('flags a false subtraction with a negative operand (W3-3 identify-outliers-iqr q7)', () => {
  const found = findArithmeticDefects('$44 - (-4) = 52$', 'q7');
  assert.equal(found.length, 1);
  assert.equal(found[0].actual, 48);
});

test('flags the result stated on the following line (house setout)', () => {
  const found = findArithmeticDefects('$27 + 145 + 98$\n$= 280$', 'multi');
  assert.equal(found.length, 1);
  assert.equal(found[0].actual, 270);
});

test('accepts correct arithmetic in every supported spelling', () => {
  for (const line of ['$27 + 145 + 98 = 270$', '$0.40 \\times 120 = 48$', '$120 \\div 8 = 15$',
    '$3(4) - 2 = 10$', '$1,250 + 750 = 2000$', '$2 + 3 \\cdot 4 = 14$']) {
    assert.deepEqual(findArithmeticDefects(line, 'ok'), [], line);
  }
});

// --- everything it must refuse to judge --------------------------------------------

test('skips an equation carrying a variable', () => {
  assert.deepEqual(findArithmeticDefects('$2(x+6)-5=9$', 'eq'), []);
  assert.deepEqual(findArithmeticDefects('$5x = 20$', 'eq'), []);
});

test('skips lines with unsupported macros rather than guessing', () => {
  for (const line of ['$\\frac{3}{4} + 1 = 2$', '$\\sqrt{16} + 1 = 6$', '$\\sin 30 + 1 = 3$',
    '$2\\pi + 1 = 4$', '$1 + 1 \\approx 3$']) {
    assert.deepEqual(findArithmeticDefects(line, 'skip'), [], line);
  }
});

test('a prose label never becomes a side, and never leaks a pure fragment', () => {
  // The whole line is disqualified by the label's macro; splitting on \ge must not
  // manufacture a checkable chunk out of it (the grouped-data false positive).
  assert.deepEqual(
    findArithmeticDefects('$\\text{Candidates with class centre } \\ge 75 = 20 + 16 + 8$', 'label'),
    []);
});

test('a label followed by real arithmetic is still checked', () => {
  const found = findArithmeticDefects('$\\text{Total } (n) = 4 + 12 + 20 = 40$', 'label2');
  assert.equal(found.length, 1);
  assert.equal(found[0].actual, 36);
});

test('deliberate place-value restatement is not a false chain', () => {
  assert.deepEqual(findArithmeticDefects('$521\\times4=2084$\n$=20.84$', 'decimals'), []);
});

test('rounding within tolerance is accepted, real error is not', () => {
  assert.ok(withinTolerance(0.7333, 0.733));
  assert.ok(!withinTolerance(270, 280));
  assert.deepEqual(findArithmeticDefects('$44 / 60 = 0.733$', 'round'), []);
});

test('a bare restatement with no operator is ignored', () => {
  assert.deepEqual(findArithmeticDefects('$4 = 4$', 'noop'), []);
});

test('evaluateExpression returns null on anything it cannot fully parse', () => {
  assert.equal(evaluateExpression('2 +'), null);
  assert.equal(evaluateExpression('2 + 3)'), null);
  assert.equal(evaluateExpression('2 + 3'), 5);
  assert.equal(evaluateExpression('-4 + 2 * 3'), 2);
});

// --- bare-TeX lint (W3-5's 186 unrendered solution lines) ---------------------------

test('lintBareTeX flags a TeX macro outside the math spans', () => {
  const problems = [];
  lintBareTeX('\\text{Case 1: } 2x - 3 = 7', 'sol', problems);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /TeX outside math/);
});

test('lintBareTeX flags a macro between two well-formed spans', () => {
  const problems = [];
  lintBareTeX('$x = 2$ \\implies $y = 4$', 'sol', problems);
  assert.equal(problems.length, 1);
});

test('lintBareTeX passes correctly delimited maths and plain prose', () => {
  const problems = [];
  lintBareTeX('Case 1: $2x - 3 = 7$, so $x = 5$.', 'sol', problems);
  lintBareTeX('The cost is \\$5 per hour.', 'sol', problems);
  assert.deepEqual(problems, []);
});

test('lintBareTeX stays silent on unbalanced delimiters (the other lint owns those)', () => {
  const problems = [];
  lintBareTeX('$x = \\frac{1}{2}', 'sol', problems);
  assert.deepEqual(problems, []);
});

test('lintMathString reports bare TeX alongside its other rules', () => {
  const problems = [];
  lintMathString('$x = 2$ \\text{ so } $y = 4$', 'sol', problems);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /TeX outside math/);
});
