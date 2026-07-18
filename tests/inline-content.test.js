import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitInlineContent,
  extractTikzBlocks,
  stripTikzBlocks,
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

test('rejects missing, unknown, and out-of-order procedure labels', () => {
  const steps = ['Substitute values.', 'Simplify.'];
  assert.match(validateProcedureLabels('$=6$', steps)[0], /must include/);
  assert.match(validateProcedureLabels('$=6$  **Guess**', steps)[0], /does not match/);
  assert.match(validateProcedureLabels('$=6$  **Simplify**\n$2(3)$  **Substitute values**', steps)[0], /out of theory order/);
});

test('schema key sets reject every legacy question field', () => {
  assert.deepEqual(unknownKeys({ question_text: 'q', solution_text: 's', q: 'old', a: 'old', solution: [], tikz: '', tikzSolution: '' }, PRACTICE_CARD_KEYS), ['q', 'a', 'solution', 'tikz', 'tikzSolution']);
  assert.deepEqual(unknownKeys({ id: 'q1', question_text: 'q', solution_text: 's', structure: 'x', mastery: false, options: [], q: 'old', solution: [] }, QUIZ_QUESTION_KEYS), ['q', 'solution']);
});
