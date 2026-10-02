import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommentTargeting, formatFeedbackComment } from '../src/lib/booklet-comment-targeting.js';

function fixture() {
  const project = { id: 'data-analysis-v1', title: 'Data Analysis', revision: 353, sections: [{ id: 'section', title: 'Data analysis', blocks: [
    { id: 'p82-information-introduction', type: 'information', fields: { '/content': 'Previous information text' }, sourceRefs: [{ pageNumber: 82 }] },
    { id: 'p24-q1-block', type: 'question', fields: { '/prompt': 'New question text', '/answer/short': 'New answer' }, sourceRefs: [{ pageNumber: 24 }] },
    { id: 'p24-q2-block', type: 'question', fields: { '/prompt': 'Second question text' }, sourceRefs: [{ pageNumber: 24 }] }
  ] }] };
  const contentTarget = (booklet, id) => {
    for (const section of booklet.sections) {
      const block = section.blocks.find(item => item.id === id);
      if (block) return { section, block, node: block };
    }
    return null;
  };
  const fieldValue = (booklet, anchor) => {
    const block = contentTarget(booklet, anchor?.rootId)?.block;
    return anchor?.pointer != null ? block?.fields[anchor.pointer] : block?.fields[Object.keys(block?.fields ?? {})[0]];
  };
  const targeting = createCommentTargeting({ contentTarget, fieldValue,
    feedbackText: value => value ?? '', sourceReferences: node => node?.sourceRefs ?? [],
    feedbackSignature: value => JSON.stringify(value) ?? '' });
  const oldAnchor = { rootId: 'p82-information-introduction', pointer: '/content', edition: 'student', quote: 'Previous information text' };
  return { project, targeting, oldAnchor };
}

const metadata = { id: 'comment-1', at: '2026-09-30T00:00:00.000Z' };

test('navigation replaces the previous editor target, quote and source page consistently', () => {
  for (const entry of ['layout', 'flow', 'coverage', 'document group']) {
    const { project, targeting, oldAnchor } = fixture();
    const state = targeting.select(project, {
      documentSelection: oldAnchor,
      textSelection: { ranges: [oldAnchor], quote: oldAnchor.quote }
    }, 'p24-q1-block', 'student');
    assert.equal(state.textSelection, null, entry);
    const anchor = targeting.choose(project, state, 'p24-q1-block', 'student');
    const flag = targeting.record(project, anchor, 'Repair this question.', 'all', metadata);
    assert.equal(flag.targetId, 'p24-q1-block', entry);
    assert.equal(flag.quote, 'New question text', entry);
    assert.deepEqual(flag.sourceRefs, [{ pageNumber: 24 }], entry);
    const prompt = formatFeedbackComment(flag, 0);
    assert.ok(prompt.includes('Target: p24-q1-block'), entry);
    assert.ok(prompt.includes('Quoted context: New question text'), entry);
    assert.ok(prompt.includes('Source pages: 24'), entry);
    assert.ok(!prompt.includes('p82-information-introduction'), entry);
    assert.ok(!prompt.includes('Previous information text'), entry);
  }
});

test('same-target navigation retains inline ranges and the active inline anchor takes precedence', () => {
  const { project, targeting } = fixture();
  const first = { rootId: 'p24-q1-block', pointer: '/prompt', edition: 'student', start: 0, end: 3, quote: 'New' };
  const second = { ...first, start: 4, end: 12, quote: 'question' };
  const state = targeting.select(project, {
    documentSelection: first,
    textSelection: { ranges: [first, second], quote: 'New question', edition: 'student' }
  }, first.rootId, 'student');
  assert.deepEqual(state.textSelection.ranges, [first, second]);
  assert.deepEqual(targeting.choose(project, state, first.rootId, 'student').ranges, [first, second]);
  const inline = { ...first, start: 4, end: 12, quote: 'question', bookmark: { start: { nodeId: 'paragraph', offset: 4 }, end: { nodeId: 'paragraph', offset: 12 } } };
  const chosen = targeting.choose(project, state, first.rootId, 'student', inline);
  assert.equal(chosen.quote, 'question');
  assert.deepEqual(chosen.bookmark, inline.bookmark);
  assert.equal(chosen.ranges, undefined);
});

test('an active selection spanning targets survives selection of a participating target', () => {
  const { project, targeting } = fixture();
  const ranges = [
    { rootId: 'p24-q1-block', pointer: '/prompt', edition: 'student' },
    { rootId: 'p24-q2-block', pointer: '/prompt', edition: 'student' }
  ];
  const state = targeting.select(project, { documentSelection: ranges[0], textSelection: { ranges, quote: 'New question text\nSecond question text' } }, 'p24-q2-block', 'student');
  const anchor = targeting.choose(project, state, 'p24-q2-block', 'student');
  assert.deepEqual(anchor.ranges, ranges);
  const flag = targeting.record(project, anchor, 'Check both questions.', 'all', metadata);
  assert.equal(flag.quote, 'New question text\nSecond question text');
  assert.ok(formatFeedbackComment(flag, 0).includes('Selection spans: p24-q1-block/prompt, p24-q2-block/prompt'));
});

test('opening a form clones and freezes its anchor independently of later selection', () => {
  const { project, targeting } = fixture();
  const range = { rootId: 'p24-q1-block', pointer: '/prompt', edition: 'student', start: 0, end: 3 };
  const input = { ...range, ranges: [range], quote: 'New', bookmark: { start: { offset: 0 } } };
  const opened = targeting.snapshot(project, input);
  input.rootId = 'p82-information-introduction';
  range.rootId = 'p82-information-introduction';
  input.bookmark.start.offset = 99;
  targeting.select(project, { documentSelection: opened, textSelection: null }, 'p24-q2-block', 'student');
  assert.equal(opened.rootId, 'p24-q1-block');
  assert.equal(opened.ranges[0].rootId, 'p24-q1-block');
  assert.equal(opened.bookmark.start.offset, 0);
  assert.ok(Object.isFrozen(opened));
  assert.ok(Object.isFrozen(opened.ranges[0]));
  const saved = targeting.record(project, opened, 'Keep the original target.', 'local', metadata);
  assert.equal(saved.targetId, 'p24-q1-block');
  const reopened = JSON.parse(JSON.stringify(saved));
  assert.deepEqual(reopened, saved);
  assert.equal(targeting.snapshot(project, reopened.anchor).quote, 'New');
});

test('a removed target blocks form submission without attaching to another block', () => {
  const { project, targeting } = fixture();
  const opened = targeting.snapshot(project, { rootId: 'p24-q1-block', pointer: '/prompt', edition: 'student', quote: 'New' });
  project.sections[0].blocks = project.sections[0].blocks.filter(block => block.id !== opened.rootId);
  assert.throws(() => targeting.record(project, opened, 'Repair.', 'all', metadata), /no longer in this booklet/);
  assert.throws(() => targeting.choose(project, { documentSelection: opened, textSelection: null }, opened.rootId, 'student'), /no longer in this booklet/);
  const preview = targeting.preview(project, opened);
  assert.equal(preview.targetId, 'p24-q1-block');
  assert.equal(preview.quote, 'New');
  assert.ok(preview.error);
});

test('a removed field or secondary range is rejected', () => {
  const { project, targeting } = fixture();
  const anchor = { rootId: 'p24-q1-block', pointer: '/prompt', edition: 'student', ranges: [
    { rootId: 'p24-q1-block', pointer: '/prompt' },
    { rootId: 'p24-q2-block', pointer: '/prompt' }
  ] };
  const opened = targeting.snapshot(project, anchor);
  delete project.sections[0].blocks[2].fields['/prompt'];
  assert.throws(() => targeting.record(project, opened, 'Repair.', 'all', metadata), /field is no longer available/);
});

test('edition changes clear old ranges and stale edition anchors cannot be submitted', () => {
  const { project, targeting } = fixture();
  const old = { rootId: 'p24-q1-block', pointer: '/prompt', edition: 'student', quote: 'New' };
  const state = targeting.select(project, { documentSelection: old, textSelection: { ranges: [old], quote: 'New' } }, old.rootId, 'short');
  assert.equal(state.textSelection, null);
  assert.equal(state.documentSelection.edition, 'short');
  assert.equal(state.documentSelection.pointer, undefined);
  assert.throws(() => targeting.snapshot(project, old, 'short'), /another edition/);
});

test('booklet-wide comments retain a null anchor and legacy prompt metadata remains supported', () => {
  const { project, targeting } = fixture();
  const flag = targeting.record(project, null, 'General feedback.', 'all', metadata);
  assert.equal(flag.targetId, project.id);
  assert.equal(flag.anchor, null);
  assert.equal(flag.location, 'Whole booklet');
  const prompt = formatFeedbackComment({ id: 'legacy', targetId: 'p24-q1-block', note: 'Existing note' }, 0);
  assert.ok(prompt.includes('Edition: Not recorded (legacy note)'));
});
