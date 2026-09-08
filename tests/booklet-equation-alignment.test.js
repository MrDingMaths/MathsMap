import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeDocument, renderDocument } from '../public/libs/maths-editor/document-model.mjs';

test('p14 q1 equation prompts stay left aligned while table cells stay centred', () => {
  const project = JSON.parse(fs.readFileSync(new URL('../booklets/projects/linear-relationships-complete-v1.json', import.meta.url), 'utf8'));
  const question = project.sections.find(s => s.sourcePageNumber === 14).blocks.find(b => b.id === 'page-14-q1').content;
  assert.equal(question.children.length, 5);
  for (const part of question.children) {
    const doc = normalizeDocument(part.prompt);
    const equation = doc.blocks.find(b => b.id === `${part.id}-eq`);
    assert.equal(equation.align, 'left', part.id);
    assert.match(renderDocument({ blocks: [equation] }), /text-align:left/);
    const table = doc.blocks.find(b => b.id === `${part.id}-table`);
    assert.ok(table.rows.flat().every(cell => cell.align === 'center'));
  }
});

test('new equation paragraphs default to left alignment', () => {
  const doc = normalizeDocument({ blocks: [{ type: 'paragraph', inlines: [{ type: 'math', latex: 'y=x+2', display: false }] }] });
  assert.equal(doc.blocks[0].align, 'left');
  assert.match(renderDocument(doc), /text-align:left/);
});
