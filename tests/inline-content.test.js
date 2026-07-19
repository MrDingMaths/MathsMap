import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitInlineContent,
  extractTikzBlocks,
  stripTikzBlocks,
  groupTextBlocks,
  validateProcedureLabels,
  unknownKeys,
  PRACTICE_CARD_KEYS,
  QUIZ_QUESTION_KEYS
} from '../src/lib/inline-content.js';

test('splits multiline maths and multiple inline TikZ blocks in source order', () => {
  const text = '$x=1$\n[tikz]\\begin{tikzpicture}A\\end{tikzpicture}[/tikz]\nthen\n[tikz]\\begin{tikzpicture}B\\end{tikzpicture}[/tikz]';
  const parsed = splitInlineContent(text);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.parts.map((part) => part.type), ['text', 'tikz', 'text', 'tikz']);
  assert.equal(extractTikzBlocks(text).blocks.length, 2);
  assert.equal(stripTikzBlocks(text), '$x=1$\n\nthen');
});

test('groups consecutive whole-line maths into one aligned block on the relation', () => {
  const blocks = groupTextBlocks('$y=68^{\\circ}$\n$x=180^{\\circ}-68^{\\circ}$\n$=112^{\\circ}$');
  assert.equal(blocks.length, 1);
  assert.equal(
    blocks[0].value,
    '$\\begin{aligned}y&=68^{\\circ} \\\\ x&=180^{\\circ}-68^{\\circ} \\\\ &=112^{\\circ}\\end{aligned}$'
  );
});

test('aligns on a relation macro and ignores relations nested in braces', () => {
  const blocks = groupTextBlocks('$\\frac{3}{4} \\le 1$\n$\\frac{1}{2} = 0.5$');
  assert.equal(blocks[0].value, '$\\begin{aligned}\\frac{3}{4} &\\le 1 \\\\ \\frac{1}{2} &= 0.5\\end{aligned}$');
});

test('leaves single lines, prose, and existing environments untouched', () => {
  assert.deepEqual(groupTextBlocks('$5$'), [{ kind: 'line', value: '$5$' }]);
  assert.deepEqual(groupTextBlocks('plain prose'), [{ kind: 'line', value: 'plain prose' }]);
  // trailing prose breaks the run; the aligned pair still forms above it
  const mixed = groupTextBlocks('$a=1$\n$=2$\n$x=2$, by the rule');
  assert.equal(mixed.length, 2);
  assert.ok(mixed[0].value.includes('\\begin{aligned}'));
  assert.equal(mixed[1].value, '$x=2$, by the rule');
  // a line that already carries its own environment is never re-wrapped
  assert.deepEqual(
    groupTextBlocks('$\\begin{cases}x\\end{cases}$'),
    [{ kind: 'line', value: '$\\begin{cases}x\\end{cases}$' }]
  );
});

test('reports malformed, stray, and empty TikZ tags', () => {
  assert.match(splitInlineContent('[tikz]x').errors[0], /Missing/);
  assert.match(splitInlineContent('x[/tikz]').errors[0], /Unexpected/);
  assert.match(splitInlineContent('[tikz] [/tikz]').errors[0], /Empty/);
});

test('accepts repeated or skipped procedure steps in theory order', () => {
  const steps = ['Substitute values.', 'Simplify.', 'Check the answer.'];
  const text = '$2(3)$  **Substitute values**\n$=6$  **Simplify**\n$6$  **Check the answer**';
  assert.deepEqual(validateProcedureLabels(text, steps), []);
  assert.deepEqual(validateProcedureLabels('$=6$  **Simplify**', steps), []);
});

test('rejects unknown and out-of-order procedure labels but allows none', () => {
  const steps = ['Substitute values.', 'Simplify.'];
  // Labels are optional now — absent headers are not an error.
  assert.deepEqual(validateProcedureLabels('$=6$', steps), []);
  assert.match(validateProcedureLabels('$=6$  **Guess**', steps)[0], /does not match/);
  assert.match(validateProcedureLabels('$=6$  **Simplify**\n$2(3)$  **Substitute values**', steps)[0], /out of theory order/);
});

test('schema key sets reject every legacy question field', () => {
  assert.deepEqual(unknownKeys({ question_text: 'q', solution_text: 's', q: 'old', a: 'old', solution: [], tikz: '', tikzSolution: '' }, PRACTICE_CARD_KEYS), ['q', 'a', 'solution', 'tikz', 'tikzSolution']);
  assert.deepEqual(unknownKeys({ id: 'q1', question_text: 'q', solution_text: 's', structure: 'x', mastery: false, options: [], q: 'old', solution: [] }, QUIZ_QUESTION_KEYS), ['q', 'solution']);
});
