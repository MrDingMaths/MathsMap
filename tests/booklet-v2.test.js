import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clozeNode,
  normalizeRichText,
  parseRichText,
  renderRichTextHtml,
  richTextToPlainText,
  roundTripRichText,
  serializeRichText,
} from '../src/lib/maths-editor.js';

test('MathsEditor preserves paragraphs, hard breaks, marks, maths, cloze, and escaped dollars', () => {
  const source = 'Explain **gradient**\nthen _interpret_ $m=\\frac{\\Delta y}{\\Delta x}$ [[positive|32]]\n\nA literal \\$5 follows.';
  const value = parseRichText(source);
  assert.equal(value.paragraphs.length, 2);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'break'), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'text' && node.marks.includes('bold')), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'text' && node.marks.includes('italic')), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'math'), true);
  assert.equal(value.paragraphs[0].inlines.some((node) => node.type === 'cloze'), true);
  assert.equal(serializeRichText(value), source);
  assert.equal(serializeRichText(roundTripRichText(value)), source);
  assert.match(renderRichTextHtml(value), /data-node-type="math"/);
  assert.equal(richTextToPlainText(value, { fillCloze: true }).includes('positive'), true);
});

test('MathsEditor remains compatible with text/maths segment records', () => {
  const value = normalizeRichText({ segments: [{ type: 'text', text: 'Let ', marks: ['bold'] }, { type: 'math', latex: 'x^2' }] });
  assert.equal(serializeRichText(value), '**Let **$x^2$');
  assert.equal(value.paragraphs[0].inlines[1].latex, 'x^2');
});
