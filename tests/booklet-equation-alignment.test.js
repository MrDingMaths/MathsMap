import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeDocument, renderDocument } from '../public/libs/maths-editor/document-model.mjs';

test('p14 q1 equation prompts stay left aligned while table cells stay centred', () => {
  const project = JSON.parse(fs.readFileSync(new URL('./fixtures/booklets/linear-legacy-layout.json', import.meta.url), 'utf8'));
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

test('Probability complement identities keep their centred paragraph through rendering',()=>{
 const project=JSON.parse(fs.readFileSync('booklets/projects/probability-v1.json','utf8'));
 let identity;
 const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(walk);return;}if(x.id==='p36-complementary-probabilities-identities')identity=x;Object.values(x).forEach(walk);};
 walk(project.sections);
 assert.equal(identity.align,'center');
 assert.equal(identity.inlines.filter(x=>x.type==='math'&&x.display).length,1);
 assert.match(identity.inlines[0].latex,/P\(E\)\+P\(\\overline\{E\}\).*\\\\ P\(\\overline\{E\}\)/);
 assert.match(renderDocument({blocks:[identity]}),/data-id="p36-complementary-probabilities-identities"[^>]*text-align:center/);
 const printCss=fs.readFileSync('src/components/BookletRichText.svelte','utf8');
 const editorCss=fs.readFileSync('public/libs/maths-editor/document-editor.css','utf8');
 assert.match(printCss,/\.document-content :global\(\.katex-display\) \{ text-align:inherit/);
 assert.match(editorCss,/\.booklet-document-field \.katex-display\{[^}]*text-align:inherit/);
});
