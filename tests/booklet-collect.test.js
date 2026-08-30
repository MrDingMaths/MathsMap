import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCards, checkBlocks } from '../scripts/booklet/collect-transcribe.mjs';

// The skeleton the deterministic parser produced: ids, tiers, origins, figures and part
// labels are fixed, everything else is null for the transcription to fill.
const skeletonCards = [
  {
    id: 'sine-rule-sides-f1',
    tier: 'foundation',
    origin: { file: 'b.md', section: 'Sine Rule for Sides', tier: 'foundation', q: 1, lines: [10, 20] },
    figure: { png: 'figures/image28.png', crop: { l: 0.05, t: 0, r: 0.69, b: 0 }, widthCm: 4 },
    _source: { stemRaw: 'Find $x$.', answerRaw: '7.9' },
  },
  {
    id: 'sine-rule-sides-d4',
    tier: 'development',
    origin: { file: 'b.md', section: 'Sine Rule for Sides', tier: 'development', q: 4, lines: [30, 40] },
    parts: [
      { label: 'a', _source: { stemRaw: '', answerRaw: '95' } },
      { label: 'b', _source: { stemRaw: '', answerRaw: '7.9 m' } },
    ],
  },
];

function faithful() {
  return [
    {
      id: 'sine-rule-sides-f1',
      tier: 'foundation',
      skills: ['sine-rule'],
      primarySkill: 'sine-rule',
      question_text: 'Find the value of $x$, correct to $1$ decimal place.',
      answer: '$7.9$',
      origin: { file: 'b.md', section: 'Sine Rule for Sides', tier: 'foundation', q: 1, lines: [10, 20] },
      figure: { png: 'figures/image28.png', crop: { l: 0.05, t: 0, r: 0.69, b: 0 }, widthCm: 4 },
    },
    {
      id: 'sine-rule-sides-d4',
      tier: 'development',
      skills: ['sine-rule'],
      primarySkill: 'sine-rule',
      question_text: 'A ship sails from $A$ to $B$.',
      origin: { file: 'b.md', section: 'Sine Rule for Sides', tier: 'development', q: 4, lines: [30, 40] },
      parts: [
        { label: 'a', question_text: 'Find $\\angle ABC$.', answer: '$95^{\\circ}$' },
        { label: 'b', question_text: 'Hence find $x$.', answer: '$7.9$ m' },
      ],
    },
  ];
}

test('a faithful transcription passes with no problems', () => {
  assert.deepEqual(checkCards(skeletonCards, faithful(), 'sec'), []);
});

test('a dropped card is caught', () => {
  const cards = faithful().slice(0, 1);
  assert.match(checkCards(skeletonCards, cards, 'sec').join('\n'), /card "sine-rule-sides-d4" is missing/);
});

test('an invented card is caught', () => {
  const cards = faithful();
  cards.push({ ...cards[0], id: 'sine-rule-sides-f9' });
  assert.match(checkCards(skeletonCards, cards, 'sec').join('\n'), /card "sine-rule-sides-f9" is not in the skeleton/);
});

test('a duplicated card is caught', () => {
  const cards = faithful();
  cards.push(cards[0]);
  assert.match(checkCards(skeletonCards, cards, 'sec').join('\n'), /appears more than once/);
});

test('a changed tier or origin is caught', () => {
  const tierChanged = faithful();
  tierChanged[0].tier = 'mastery';
  assert.match(checkCards(skeletonCards, tierChanged, 'sec').join('\n'), /"tier" changed from "foundation" to "mastery"/);

  const originChanged = faithful();
  originChanged[0].origin.lines = [1, 2];
  assert.match(checkCards(skeletonCards, originChanged, 'sec').join('\n'), /"origin" was modified/);
});

test('a changed figure crop is caught — crops come from the docx and are not the model to choose', () => {
  const cards = faithful();
  cards[0].figure.crop = { l: 0, t: 0, r: 0, b: 0 };
  assert.match(checkCards(skeletonCards, cards, 'sec').join('\n'), /"figure" changed/);
});

test('added, dropped or relabelled parts are caught', () => {
  const dropped = faithful();
  dropped[1].parts.pop();
  assert.match(checkCards(skeletonCards, dropped, 'sec').join('\n'), /has 1 part\(s\), the skeleton has 2/);

  const relabelled = faithful();
  relabelled[1].parts[1].label = 'c';
  assert.match(checkCards(skeletonCards, relabelled, 'sec').join('\n'), /label changed from "b" to "c"/);
});

test('left-over _source scaffolding is caught on cards and on parts', () => {
  const onCard = faithful();
  onCard[0]._source = { stemRaw: 'x' };
  assert.match(checkCards(skeletonCards, onCard, 'sec').join('\n'), /"_source" is scaffolding and must be removed/);

  const onPart = faithful();
  onPart[1].parts[0]._source = { stemRaw: 'x' };
  assert.match(checkCards(skeletonCards, onPart, 'sec').join('\n'), /parts\[0\]: "_source" must be removed/);
});

test('a figure the parser did not place may be added, but a placed one may not be dropped', () => {
  const added = faithful();
  added[1].parts[0].figure = { png: 'figures/image50.png', widthCm: 4 };
  assert.deepEqual(checkCards(skeletonCards, added, 'sec'), [], 'adding a figure is allowed');

  const removed = faithful();
  delete removed[0].figure;
  assert.match(checkCards(skeletonCards, removed, 'sec').join('\n'), /"figure" changed/);
});

// --- blocks ------------------------------------------------------------------

const skeletonBlocks = [
  { id: 'sine-rule-sides-review-1', type: 'review', origin: { file: 'b.md', section: 'S', lines: [1, 5] } },
  { id: 'sine-rule-sides-teach-1', type: 'teach', origin: { file: 'b.md', section: 'S', lines: [6, 9] } },
];

test('blocks must all be present, keep their type, and carry no _source', () => {
  const good = [
    { id: 'sine-rule-sides-review-1', type: 'review', origin: { file: 'b.md', section: 'S', lines: [1, 5] }, groups: [] },
    { id: 'sine-rule-sides-teach-1', type: 'teach', origin: { file: 'b.md', section: 'S', lines: [6, 9] }, body: 'x' },
  ];
  assert.deepEqual(checkBlocks(skeletonBlocks, good, 'sec'), []);

  const retyped = structuredClone(good);
  retyped[0].type = 'guided';
  assert.match(checkBlocks(skeletonBlocks, retyped, 'sec').join('\n'), /"type" changed from "review" to "guided"/);

  const withSource = structuredClone(good);
  withSource[1]._source = { prose: [] };
  assert.match(checkBlocks(skeletonBlocks, withSource, 'sec').join('\n'), /"_source" must be removed/);

  assert.match(checkBlocks(skeletonBlocks, [good[0]], 'sec').join('\n'), /block "sine-rule-sides-teach-1" is missing/);
});

// --- extra figures and block cells ---------------------------------------------

test('the extra diagrams an item shows may not be dropped', () => {
  const skeleton = [{
    id: 'sec-f1',
    tier: 'foundation',
    origin: { file: 'b.md', section: 'S', tier: 'foundation', q: 1, lines: [1, 2] },
    figure: { png: 'figures/image2.png', widthCm: 7 },
    figures: [{ png: 'figures/image3.png', widthCm: 7.2 }],
  }];
  const base = {
    id: 'sec-f1',
    tier: 'foundation',
    skills: ['sine-rule'],
    primarySkill: 'sine-rule',
    question_text: 'Find it.',
    answer: '$1$',
    origin: { file: 'b.md', section: 'S', tier: 'foundation', q: 1, lines: [1, 2] },
    figure: { png: 'figures/image2.png', widthCm: 7 },
  };

  assert.match(checkCards(skeleton, [base], 'sec').join('\n'), /"figures" changed/);
  assert.deepEqual(
    checkCards(skeleton, [{ ...base, figures: [{ png: 'figures/image3.png', widthCm: 7.2 }] }], 'sec'),
    [],
  );
});

test('a drill cell missing from a block is caught, cells being questions too', () => {
  const skeleton = [{
    id: 'sec-identify-1',
    type: 'identify',
    origin: { file: 'b.md', section: 'S', lines: [1, 9] },
    cells: [{ label: 'a' }, { label: 'b', figure: { png: 'figures/image2.png', widthCm: 7 } }],
  }];
  const dropped = [{
    id: 'sec-identify-1',
    type: 'identify',
    origin: { file: 'b.md', section: 'S', lines: [1, 9] },
    cells: [{ label: 'b', question_text: 'Can you?', answer: 'yes', figure: { png: 'figures/image2.png', widthCm: 7 } }],
  }];
  assert.match(checkBlocks(skeleton, dropped, 'sec').join('\n'), /has 1 cell\(s\), the skeleton has 2/);

  const kept = [{
    ...dropped[0],
    cells: [
      { label: 'a', question_text: 'Can you?', answer: 'no' },
      { label: 'b', question_text: 'Can you?', answer: 'yes', figure: { png: 'figures/image2.png', widthCm: 7 } },
    ],
  }];
  assert.deepEqual(checkBlocks(skeleton, kept, 'sec'), []);
});

test('a review box\'s nested group cells are compared too', () => {
  const skeleton = [{
    id: 'sec-review-1',
    type: 'review',
    origin: { file: 'b.md', section: 'S', lines: [1, 9] },
    groups: [{ cells: [{ label: 'a' }, { label: 'b' }] }],
  }];
  const dropped = [{
    id: 'sec-review-1',
    type: 'review',
    origin: { file: 'b.md', section: 'S', lines: [1, 9] },
    groups: [{ prompt: 'Solve.', cells: [{ label: 'a', question_text: '$x$', answer: '1' }] }],
  }];
  assert.match(checkBlocks(skeleton, dropped, 'sec').join('\n'), /has 1 cell\(s\), the skeleton has 2/);
});
