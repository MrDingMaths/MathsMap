import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerFragments,
  answerNodeContext,
  answerNodePath,
  compactAnswerLabel,
} from '../src/lib/booklet-exercises.js';

const text = value => ({type: 'text', text: value});
const math = latex => ({type: 'math', latex, display: false});
const doc = (id, ...inlines) => ({
  format: 'maths-editor-document-v1',
  version: 1,
  blocks: [{id, type: 'paragraph', inlines}],
});
const response = (id, result, method = result) => ({
  id,
  answer: {
    short: doc(`${id}-short`, text(result)),
    worked: doc(`${id}-worked`, text(method)),
  },
});

// Observe the public display APIs after fragmentation has pruned siblings.
function rows(block, number, mode) {
  return answerFragments(block, mode).map(({content}) => {
    let node = content;
    let parent = null;
    let path = [];
    const contexts = [];
    const ids = [];
    const prompts = [];
    for (;;) {
      path = answerNodePath(content, node, path);
      const context = answerNodeContext(content, node, 0, parent);
      if (context) contexts.push(context);
      ids.push(node.id);
      prompts.push(node.prompt);
      if (!node.children?.length) {
        return {
          label: compactAnswerLabel(number, path),
          contexts,
          ids,
          prompts,
          answer: node.answer,
        };
      }
      assert.equal(node.children.length, 1);
      parent = node;
      node = node.children[0];
    }
  });
}

function checkBothModes(block, number, check) {
  const original = structuredClone(block);
  for (const mode of ['short', 'worked']) {
    check(rows(block, number, mode), mode);
    assert.deepEqual(block, original, `${mode} fragmentation changed the source`);
  }
}

const evenDefinition = {
  "format": "maths-editor-document-v1",
  "version": 1,
  "blocks": [
    {
      "id": "p79-q33-even-context",
      "type": "paragraph",
      "align": "left",
      "inlines": [
        {
          "type": "text",
          "text": "Consecutive even numbers are even numbers that occur one after the other, such as 14, 16, 18."
        },
        {
          "type": "break"
        },
        {
          "type": "text",
          "text": "Any even number can be represented as "
        },
        {
          "type": "math",
          "latex": "2n",
          "display": false
        },
        {
          "type": "text",
          "text": ", where "
        },
        {
          "type": "math",
          "latex": "n",
          "display": false
        },
        {
          "type": "text",
          "text": " is an integer."
        },
        {
          "type": "break"
        },
        {
          "type": "text",
          "text": "Consecutive even numbers would be "
        },
        {
          "type": "math",
          "latex": "2n,\\ (2n+2),\\ (2n+4),\\ (2n+6),\\ldots",
          "display": false
        }
      ]
    }
  ]
};
const oddDefinition = {
  "format": "maths-editor-document-v1",
  "version": 1,
  "blocks": [
    {
      "id": "p79-q33-odd-context",
      "type": "paragraph",
      "align": "left",
      "inlines": [
        {
          "type": "text",
          "text": "Consecutive odd numbers are odd numbers that occur one after the other, such as 11, 13, 15."
        },
        {
          "type": "break"
        },
        {
          "type": "text",
          "text": "Any odd number can be represented as "
        },
        {
          "type": "math",
          "latex": "2n+1",
          "display": false
        },
        {
          "type": "text",
          "text": ", where "
        },
        {
          "type": "math",
          "latex": "n",
          "display": false
        },
        {
          "type": "text",
          "text": " is an integer."
        },
        {
          "type": "break"
        },
        {
          "type": "text",
          "text": "Consecutive odd numbers would be "
        },
        {
          "type": "math",
          "latex": "2n+1,\\ (2n+3),\\ (2n+5),\\ (2n+7),\\ldots",
          "display": false
        }
      ]
    }
  ]
};

for (const labelState of ['absent', 'null']) {
  test(`Q33 native definitions have no answer context with ${labelState} group labels`, () => {
    const c = {...response('q33-c', 'Even', 'Since f(-x)=f(x), the function is even.'), label: 'c', prompt: doc('c-prompt', math('f(x)=x^2'))};
    const d = {...response('q33-d', 'Even', 'Since f(-x)=f(x), the function is even.'), label: 'd', prompt: doc('d-prompt', math('f(x)=x^4'))};
    const e = {...response('q33-e', 'Odd', 'Since f(-x)=-f(x), the function is odd.'), label: 'e', prompt: doc('e-prompt', math('f(x)=x^3'))};
    const f = {...response('q33-f', 'Odd', 'Since f(-x)=-f(x), the function is odd.'), label: 'f', prompt: doc('f-prompt', math('f(x)=x^5'))};
    const even = {id: 'q33-even', prompt: evenDefinition, children: [c, d]};
    const odd = {id: 'q33-odd', prompt: oddDefinition, children: [e, f]};
    if (labelState === 'null') {
      even.label = null;
      odd.label = null;
    }
    const block = {
      id: 'q33-block',
      flow: {keepTogether: false},
      content: {
        id: 'q33',
        prompt: doc('q33-prompt', text('Classify these functions.')),
        children: [even, odd],
      },
    };
    checkBothModes(block, 33, actual => {
      assert.deepEqual(actual.map(row => row.label), ['33c', '33d', '33e', '33f']);
      assert.deepEqual(actual.map(row => row.contexts), [[], [], [], []]);
      assert.deepEqual(actual.map(row => row.ids), [
        ['q33', 'q33-even', 'q33-c'],
        ['q33', 'q33-even', 'q33-d'],
        ['q33', 'q33-odd', 'q33-e'],
        ['q33', 'q33-odd', 'q33-f'],
      ]);
      assert.deepEqual(actual.map(row => row.prompts[1]), [evenDefinition, evenDefinition, oddDefinition, oddDefinition]);
      assert.deepEqual(actual.map(row => row.prompts[2]), [c.prompt, d.prompt, e.prompt, f.prompt]);
      assert.deepEqual(actual.map(row => row.answer), [c.answer, d.answer, e.answer, f.answer]);
    });
  });
}

test('explicitly empty Jackson group retains its heading and positional segment', () => {
  const block = {content: {
    id: 'comparison',
    prompt: doc('comparison-prompt', text('Compare the work below.')),
    children: [{
      id: 'jackson-group',
      label: '',
      prompt: doc('jackson-heading', text('Jackson’s work:')),
      children: [response('jackson-a', 'Correct'), response('jackson-b', 'Incorrect')],
    }],
  }};
  checkBothModes(block, 1, actual => {
    assert.deepEqual(actual.map(row => row.label), ['1(1)a', '1(1)b']);
    assert.deepEqual(actual.map(row => row.contexts), [['Jackson’s work'], ['Jackson’s work']]);
  });
});

for (const labelState of ['absent', 'null']) {
  test(`anonymous group with ${labelState} label retains context for unlabeled responses`, () => {
    const group = {
      id: 'inverse-group',
      prompt: doc('inverse-heading', text('Use the inverse operation:')),
      children: [response('inverse-a', '3'), response('inverse-b', '5')],
    };
    if (labelState === 'null') group.label = null;
    const block = {content: {
      id: 'inverse-root',
      prompt: doc('inverse-prompt', text('Complete both responses.')),
      children: [group],
    }};
    checkBothModes(block, 1, actual => {
      assert.deepEqual(actual.map(row => row.label), ['1(1)a', '1(1)b']);
      assert.deepEqual(actual.map(row => row.contexts), [['Use the inverse operation'], ['Use the inverse operation']]);
    });
  });
}

test('native paired-method prompt preserves both student attributions after fragmentation', () => {
  const block = {content: {
    id: 'paired-root',
    prompt: doc('paired-prompt', text('Jackson and Maya are solving the equation '), math('2x+5=17'), text('.')),
    children: [{
      id: 'paired-group',
      prompt: doc('paired-heading', text('Solve using both methods:')),
      children: [response('paired-a', 'x = 6'), response('paired-b', 'x = 6')],
    }],
  }};
  checkBothModes(block, 1, actual => {
    assert.deepEqual(actual.map(row => row.label), ['1(1)a', '1(1)b']);
    assert.deepEqual(actual.map(row => row.contexts), [
      ['Solve using both methods', 'Jackson’s method'],
      ['Solve using both methods', 'Maya’s method'],
    ]);
  });
});

test('named student root contexts remain unchanged', () => {
  for (const prompt of [
    doc('read-root', text('Read Jackson’s work carefully before answering.')),
    doc('solving-root', text('Jackson is solving the equation '), math('2x+5=17'), text('.')),
  ]) {
    const block = {content: {
      id: 'named-root',
      prompt,
      children: [{...response('named-a', 'x = 6'), label: 'a'}],
    }};
    checkBothModes(block, 1, actual => {
      assert.deepEqual(actual.map(row => row.label), ['1a']);
      assert.deepEqual(actual.map(row => row.contexts), [['Jackson’s work']]);
    });
  }
});

test('ordinary labeled response remains 1a without instructional answer context', () => {
  const a = {...response('ordinary-a', 'x = 6'), label: 'a', prompt: doc('ordinary-a-prompt', text('Solve '), math('2x+5=17'), text('.'))};
  const block = {content: {
    id: 'ordinary-root',
    prompt: doc('ordinary-prompt', text('Solve the equation.')),
    children: [a],
  }};
  checkBothModes(block, 1, actual => {
    assert.deepEqual(actual.map(row => row.label), ['1a']);
    assert.deepEqual(actual.map(row => row.contexts), [[]]);
    assert.deepEqual(actual[0].ids, ['ordinary-root', 'ordinary-a']);
    assert.deepEqual(actual[0].answer, a.answer);
  });
});
