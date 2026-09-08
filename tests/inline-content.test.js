import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitInlineContent,
  extractTikzBlocks,
  stripTikzBlocks,
  groupTextBlocks,
  setoutMathChain,
  validateProcedureLabels,
  unknownKeys,
  isStructureSlug,
  PRACTICE_CARD_KEYS,
  QUIZ_QUESTION_KEYS
} from '../src/lib/inline-content.js';

test('expands a chained worked solution for vertical relation alignment', () => {
  assert.equal(setoutMathChain('$-2+(-3)=-2-3=-5$'), '$-2+(-3)=-2-3$\n$=-5$');
  assert.equal(setoutMathChain('$x=2$'), '$x=2$');
  assert.equal(setoutMathChain('$200=240x+80\\implies240x=120\\implies x=0.5$',{stackFirstTerm:true}), '$200=240x+80\\implies240x=120\\implies x=0.5$');
  assert.match(groupTextBlocks(setoutMathChain('$a=b=c$'))[0].value, /begin\{aligned\}/);
});

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
  assert.deepEqual(unknownKeys({ question_text: 'q', structure: 'x', solution_text: 's', q: 'old', a: 'old', solution: [], tikz: '', tikzSolution: '' }, PRACTICE_CARD_KEYS), ['q', 'a', 'solution', 'tikz', 'tikzSolution']);
  assert.deepEqual(unknownKeys({ id: 'q1', question_text: 'q', solution_text: 's', structure: 'x', mastery: false, options: [], q: 'old', solution: [] }, QUIZ_QUESTION_KEYS), ['q', 'solution']);
});

test('isStructureSlug accepts kebab-case only', () => {
  assert.equal(isStructureSlug('round-to-tenths'), true);
  assert.equal(isStructureSlug('a'), true);
  assert.equal(isStructureSlug('a1-b2'), true);
  assert.equal(isStructureSlug(''), false);
  assert.equal(isStructureSlug('Round-To-Tenths'), false);
  assert.equal(isStructureSlug('round_to_tenths'), false);
  assert.equal(isStructureSlug('round--tenths'), false);
  assert.equal(isStructureSlug('-round'), false);
  assert.equal(isStructureSlug('round-'), false);
  assert.equal(isStructureSlug(undefined), false);
});


test('simultaneous equation prompts keep independent left-aligned lines',()=>{
 const source='$y = kx + 4$\n$3x - 2y = 5$';
 assert.deepEqual(groupTextBlocks(source,{alignRelations:false}),[
  {kind:'line',value:'$y = kx + 4$'},
  {kind:'line',value:'$3x - 2y = 5$'}
 ]);
 assert.match(groupTextBlocks(source)[0].value,/begin\{aligned\}/,'worked-solution alignment remains available');
});
