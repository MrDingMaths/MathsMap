import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isRewriteTableQuestion, resolvePreviewAssets, splitBookletTables, visibleImportedQuestionTitle,
} from '../src/lib/booklet-preview.js';

test('printed exam attribution omits the Band rating without changing source metadata', () => {
  const question={title:'2016 HSC Standard 2 Band 4',content:{prompt:'Find the area.'}};
  assert.equal(visibleImportedQuestionTitle(question),'2016 HSC Standard 2');
  assert.equal(question.title,'2016 HSC Standard 2 Band 4');
  assert.equal(visibleImportedQuestionTitle({title:'HSC Mathematics Band 6'}),'HSC Mathematics');
  assert.equal(visibleImportedQuestionTitle({title:'2023 HSC Standard 2'}),'2023 HSC Standard 2');
});

test('question previews can copy reactive proxies without mutating transcription state', () => {
  const source = {
    id: 'page-30-q1',
    content: {
      prompt: 'Question',
      questionDiagrams: [{ id: 'diagram-1', src: 'evidence/assets/diagram.png' }],
      children: [],
    },
  };
  const reactiveProxy = new Proxy(source, {});
  assert.throws(() => structuredClone(reactiveProxy), /could not be cloned/i);

  const preview = resolvePreviewAssets(reactiveProxy, (src) => `/run/files/${src}`);
  assert.equal(preview.content.questionDiagrams[0].src, '/run/files/evidence/assets/diagram.png');
  assert.equal(source.content.questionDiagrams[0].src, 'evidence/assets/diagram.png');
  assert.notEqual(preview, source);
  assert.notEqual(preview.content, source.content);
});

test('booklet markdown tables become structural rows instead of visible pipe text', () => {
  const parts = splitBookletTables('Intro\n\n| | |\n| --- | --- |\n| $3+2=$ | $(-3)+2=$ |');
  assert.deepEqual(parts, [
    { type: 'text', value: 'Intro' },
    { type: 'table', header: null, rows: [['$3+2=$', '$(-3)+2=$']], alignments: ['left','left'] },
  ]);
});

test('import preview recognises paired rewrite tables and hides model-only titles', () => {
  const question = { title: 'Temperature midpoint', content: { prompt: 'Fill in the table. Continue.', layout: 'grid', columns: 2, children: [{ children: [] }, { children: [] }, { children: [] }, { children: [] }] } };
  assert.equal(isRewriteTableQuestion(question), true);
  assert.equal(visibleImportedQuestionTitle(question), '');
  assert.equal(visibleImportedQuestionTitle({ title: 'NAPLAN B+', content: { prompt: 'Solve it.' } }), 'NAPLAN B+');
});
