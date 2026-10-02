import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentTarget } from '../src/lib/booklet-document-controller.js';
import {
  selectFeedbackTarget, feedbackSelectionAnchor, createFeedback,
  feedbackPrompt, feedbackStatus, bookletComments
} from '../src/lib/booklet-feedback.js';

const source = readFileSync(new URL('../src/components/BookletProjects.svelte', import.meta.url), 'utf8');
const Q24 = 'p24-q1-block';
const NATIVE_Q24 = 'p24-q1';
const P82 = 'p82-information-introduction';
const QUESTION = 'Calculate the mean of 2, 4 and 6.';
const INFORMATION = 'Page 82 information introduction.';
const copy = value => JSON.parse(JSON.stringify(value));

function fixture() {
  return {
    id: 'feedback-target-integration', title: 'Data Analysis', revision: 1,
    settings: { layoutOverrides: { blockLayouts: {} } },
    studio: { version: 1, flags: [] },
    sections: [
      {
        id: 'section-24', title: 'Exercise 1', sourcePageNumber: 24,
        blocks: [{
          id: Q24, type: 'question', sourcePageNumber: 24,
          content: {
            id: NATIVE_Q24, type: 'question', sourcePageNumber: 24,
            prompt: QUESTION, answer: { short: '4', worked: 'Mean = (2 + 4 + 6) / 3 = 4.' }
          }
        }]
      },
      {
        id: 'section-82', title: 'Information', sourcePageNumber: 82,
        blocks: [{
          id: P82, type: 'information', sourcePageNumber: 82,
          content: {
            id: 'p82-information-content', type: 'paragraph',
            inlines: [{ type: 'text', text: INFORMATION }]
          }
        }]
      }
    ]
  };
}

// Extract the production handlers rather than reproducing their selection logic.
// These selected handlers contain ordinary strings, comments and nested braces.
function closingBrace(text, start) {
  let depth = 0, quote = '', lineComment = false, blockComment = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && next === '/') { lineComment = true; i++; continue; }
    if (c === '/' && next === '*') { blockComment = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return i;
  }
  throw new Error('Unclosed production handler body');
}

function namedHandler(name) {
  const match = new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\(').exec(source);
  assert.ok(match, `Production handler ${name} is present`);
  const start = source.indexOf('{', match.index + match[0].length);
  return source.slice(match.index, closingBrace(source, start) + 1);
}

function arrows(text, pattern, predicate) {
  const result = [];
  for (const match of text.matchAll(pattern)) {
    const start = match.index + match[0].lastIndexOf('{');
    const arrowStart = match.index + match[0].indexOf(match[1]);
    const handler = text.slice(arrowStart, closingBrace(text, start) + 1);
    if (predicate(handler)) result.push(handler);
  }
  return result;
}

const handlers = ['selectLayout', 'selectFlow', 'goPage', 'selectCommentTarget', 'currentAnchor', 'addComment']
  .map(namedHandler).join('\n');
const outlineStart = source.indexOf('class="block-list"');
assert.ok(outlineStart >= 0, 'Legacy block outline is present');
const outlineEnd = source.indexOf('</ol>', outlineStart);
assert.ok(outlineEnd > outlineStart, 'Legacy block outline has an end');
const outlineHandlers = arrows(
  source.slice(outlineStart, outlineEnd), /onclick=\{\s*(\(\)\s*=>\s*)\{/g,
  handler => /selectCommentTarget\(block\.id\)/.test(handler)
);
assert.equal(outlineHandlers.length, 2, 'Outline selection and properties both use comment targeting');
const pointerHandlers = arrows(
  source, /const\s+select\s*=\s*(event\s*=>\s*)\{/g,
  handler => /selectCommentTarget\(rootId\)/.test(handler)
);
assert.equal(pointerHandlers.length, 1, 'Document pointer selection handler is identifiable');
const editionHandlers = arrows(
  source, /onchange=\{\s*(async\s+e\s*=>\s*)\{/g,
  handler => /flowEdition\s*=\s*next/.test(handler) && /selectCommentTarget/.test(handler)
);
assert.equal(editionHandlers.length, 1, 'Edition change handler is identifiable');

function controller(project = fixture(), initial = {}) {
  const started = [];
  const build = new Function('input', `
    const { project, contentTarget, selectFeedbackTarget, feedbackSelectionAnchor } = input;
    let documentSelection = input.initial.documentSelection ?? { rootId: '${P82}', edition: 'with-short', quote: '${INFORMATION}' };
    let textSelection = input.initial.textSelection === undefined
      ? { edition: 'with-short', quote: '${INFORMATION}', ranges: [{ rootId: '${P82}', edition: 'with-short' }] }
      : input.initial.textSelection;
    let selectedBlockId = input.initial.selectedBlockId ?? '${P82}';
    let selectedTargetId = '', selectedSectionId = 'section-82';
    let groupSelection = [], diagramSelection = null, layoutSelection = null;
    let flexible = true, flowEdition = 'with-short', answerView = 'student';
    let selectedPageId = 'page-82', workspaceWidth = 1600, navigation = true;
    let inlineSession = null, activeEditor = null, panel = '', error = '';
    const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
    const captureEditorSelection = () => null;
    const finishInline = () => { inlineSession = null; };
    const selectedFlowIds = (_project, ids) => ids;
    const resolveArrangement = () => ({ tree: { root: { id: 'arrangement-root' } } });
    const flowPreview = { jumpTo() {} };
    const tick = async () => {};
    const flushDocument = async () => {};
    const commentsPanel = { start(anchor) { input.started.push(anchor); } };
    const projectPages = [
      { id: 'page-24', section: project.sections[0], blocks: project.sections[0].blocks },
      { id: 'page-82', section: project.sections[1], blocks: project.sections[1].blocks },
      { id: 'empty-page', section: project.sections[0], blocks: [] }
    ];
    const block = project.sections[0].blocks[0];
    ${handlers}
    const outlineSelections = [${outlineHandlers.join(',')}];
    const pointerSelect = ${pointerHandlers[0]};
    const changeEdition = ${editionHandlers[0]};
    return {
      selectLayout, selectFlow, goPage, selectCommentTarget, addComment,
      outlineSelections, pointerSelect, changeEdition,
      setSelections(document, text) { documentSelection = document; textSelection = text; },
      state() { return { documentSelection, textSelection, selectedBlockId, selectedTargetId,
        selectedSectionId, selectedPageId, flowEdition, panel, error }; }
    };
  `);
  return { project, started, ...build({ project, initial, started, contentTarget, selectFeedbackTarget, feedbackSelectionAnchor }) };
}

function assertQuestionSelection(ui, expectedRoot = Q24) {
  const state = ui.state();
  assert.equal(state.selectedBlockId, Q24);
  assert.equal(state.documentSelection.rootId, expectedRoot);
  assert.equal(state.documentSelection.edition, state.flowEdition);
  assert.equal(state.textSelection, null);
  assert.equal(state.documentSelection.quote, undefined);
}

for (const [name, select] of [
  ['layout', ui => ui.selectLayout(Q24, 'arrangement-root')],
  ['flow', ui => ui.selectFlow(Q24, 'section-24')],
  ['page navigation', ui => ui.goPage(0)],
  ['legacy outline', ui => ui.outlineSelections[0]()],
  ['legacy properties', ui => ui.outlineSelections[1]()]
]) {
  test(`${name} replaces page 82 document and text selections before Add comment`, async () => {
    const ui = controller();
    select(ui);
    assertQuestionSelection(ui);
    await ui.addComment();
    assert.equal(ui.state().error, '');
    assert.equal(ui.started.length, 1);
    assert.equal(ui.started[0].rootId, Q24);
    assert.equal(ui.started[0].quote, QUESTION);
    assert.ok(Object.isFrozen(ui.started[0]));
  });
}

test('actual controller resolves both the native question and its wrapper', () => {
  const project = fixture();
  assert.equal(contentTarget(project, Q24)?.block.id, Q24);
  assert.equal(contentTarget(project, NATIVE_Q24)?.block.id, Q24);
});

test('actual pointer handler selects a native question and clears page 82 text', async () => {
  const ui = controller();
  ui.pointerSelect({ target: { closest(selector) {
    return selector === '[data-edit-root]' ? { dataset: { editRoot: NATIVE_Q24 } } : null;
  } } });
  assertQuestionSelection(ui, NATIVE_Q24);
  assert.equal(ui.state().selectedTargetId, NATIVE_Q24);
  await ui.addComment();
  assert.equal(ui.state().error, '');
  assert.equal(ui.started[0].rootId, NATIVE_Q24);
  assert.equal(ui.started[0].quote, QUESTION);
});

test('edition handler invalidates document and text selections from the prior edition', async () => {
  const ui = controller();
  ui.selectLayout(Q24, 'arrangement-root');
  ui.setSelections(
    { rootId: NATIVE_Q24, edition: 'with-short', quote: QUESTION },
    { edition: 'with-short', quote: QUESTION, ranges: [{ rootId: NATIVE_Q24, edition: 'with-short' }] }
  );
  await ui.changeEdition({ currentTarget: { value: 'worked' } });
  assertQuestionSelection(ui);
  assert.equal(ui.state().flowEdition, 'worked');
  await ui.addComment();
  assert.equal(ui.state().error, '');
  assert.equal(ui.started[0].edition, 'worked');
});

test('navigation to an empty page clears both selections', () => {
  const ui = controller();
  ui.goPage(2);
  assert.equal(ui.state().selectedBlockId, '');
  assert.equal(ui.state().documentSelection, null);
  assert.equal(ui.state().textSelection, null);
});

test('Add comment falls back from an incompatible document anchor to the selected block', async () => {
  const ui = controller(fixture(), { selectedBlockId: Q24, textSelection: null });
  await ui.addComment();
  assert.equal(ui.state().error, '');
  assert.equal(ui.started[0].rootId, Q24);
  assert.equal(ui.started[0].quote, QUESTION);
});

test('Add comment refuses incompatible surviving text rather than saving the wrong target', async () => {
  const ui = controller(fixture(), { selectedBlockId: Q24 });
  await ui.addComment();
  assert.equal(ui.started.length, 0);
  assert.match(ui.state().error, /text selection and selected comment target do not match/i);
});

test('native text selection survives wrapper selection and the form receives an independent frozen anchor', async () => {
  const ui = controller();
  const originalText = {
    edition: 'with-short', quote: QUESTION,
    ranges: [{
      rootId: NATIVE_Q24, edition: 'with-short',
      bookmark: { start: { nodeId: 'paragraph-24', offset: 0 }, end: { nodeId: 'paragraph-24', offset: 12 } }
    }]
  };
  ui.setSelections({ rootId: NATIVE_Q24, edition: 'with-short', quote: QUESTION }, originalText);
  ui.selectLayout(Q24, 'arrangement-root');
  assert.equal(ui.state().documentSelection.rootId, NATIVE_Q24);
  assert.deepEqual(ui.state().textSelection, originalText);
  await ui.addComment();
  assert.equal(ui.state().error, '');
  const held = ui.started[0];
  assert.equal(held.rootId, NATIVE_Q24);
  assert.ok(Object.isFrozen(held));
  assert.ok(Object.isFrozen(held.ranges));
  assert.ok(Object.isFrozen(held.ranges[0].bookmark.start));
  originalText.quote = INFORMATION;
  originalText.ranges[0].bookmark.start.offset = 99;
  ui.selectFlow(P82, 'section-82');
  assert.equal(held.quote, QUESTION);
  assert.equal(held.ranges[0].bookmark.start.offset, 0);
  assert.throws(() => { held.rootId = P82; }, TypeError);
});

test('normal feedback creation, studio storage, copied prompt and JSON reopen retain the frozen target', async () => {
  const ui = controller();
  ui.selectLayout(Q24, 'arrangement-root');
  await ui.addComment();
  assert.equal(ui.state().error, '');
  const held = ui.started[0];
  ui.selectFlow(P82, 'section-82');
  const flag = createFeedback(ui.project, held, '  Repair this question.  ', 'local');
  const legacy = { id: 'legacy-note', targetId: Q24, note: 'Previously saved note', resolved: false, scope: 'local' };
  const saved = { ...ui.project, studio: { ...ui.project.studio, flags: [legacy, flag] } };
  assert.equal(flag.targetId, Q24);
  assert.equal(flag.anchor.rootId, Q24);
  assert.equal(flag.quote, QUESTION);
  assert.equal(flag.anchor.quote, QUESTION);
  assert.equal(flag.edition, 'with-short');
  assert.equal(flag.note, 'Repair this question.');
  assert.deepEqual(flag.sourceRefs.map(ref => ref.pageNumber), [24]);
  assert.notEqual(flag.anchor, held);
  assert.equal(feedbackStatus(saved, flag), '');
  const prompt = feedbackPrompt(saved);
  assert.ok(prompt.includes(`Target: ${Q24}`));
  assert.ok(prompt.includes(`Quoted context: ${QUESTION}`));
  assert.ok(prompt.includes('Source pages: 24'));
  assert.ok(prompt.includes('Edition: with-short'));
  assert.ok(prompt.includes('Edition: Not recorded (legacy note)'));
  assert.ok(prompt.includes('Previously saved note'));
  assert.ok(!prompt.includes(P82));
  assert.ok(!prompt.includes(INFORMATION));
  const reopened = copy(saved);
  assert.deepEqual(reopened.studio.flags, saved.studio.flags);
  assert.equal(feedbackPrompt(reopened), prompt);
  assert.equal(feedbackStatus(reopened, reopened.studio.flags[1]), '');
  assert.equal(bookletComments(reopened).length, 2);
  assert.deepEqual(legacy, { id: 'legacy-note', targetId: Q24, note: 'Previously saved note', resolved: false, scope: 'local' });
});
