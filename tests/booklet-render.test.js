import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBooklet, autoColumns, answerFromSolution, slugify } from '../scripts/booklet/resolve.mjs';
import { buildHtml } from '../scripts/booklet/build-html.mjs';
import { richText, richTextInline, estimateLines } from '../scripts/booklet/rich-text.mjs';
import { createTikzCache } from '../scripts/booklet/tikz-cache.mjs';

// A fixture bank and recipe held in memory, so the renderer's logic is testable without
// Chromium, without the repo's real content, and without a compile.

const CARDS = {
  'sec-f1': { id: 'sec-f1', tier: 'foundation', skills: ['sine-rule'], primarySkill: 'sine-rule', question_text: 'Find $x$.', answer: '$1.88$' },
  'sec-f2': { id: 'sec-f2', tier: 'foundation', skills: ['sine-rule'], primarySkill: 'sine-rule', question_text: 'Find $y$.', answer: '$2$' },
  'sec-d3': {
    id: 'sec-d3',
    tier: 'development',
    skills: ['sine-rule'],
    primarySkill: 'sine-rule',
    question_text: 'A ship sails.',
    marks: 3,
    source: { kind: 'hsc', year: 2022, course: 'Standard 2', band: 5 },
    parts: [
      { label: 'a', question_text: 'Find $\\angle A$.', answer: '$95^{\\circ}$' },
      { label: 'b', question_text: 'Hence find $d$.', answer: '$7.9$ m', solution_text: '$d = 7.9$' },
    ],
  },
  'sec-m4': { id: 'sec-m4', tier: 'mastery', skills: ['sine-rule'], primarySkill: 'sine-rule', question_text: 'Prove it.', solution_text: 'Because.' },
};

const BLOCKS = {
  'sec-teach-1': { id: 'sec-teach-1', type: 'teach', title: 'Sine Rule', body: 'In any triangle.', formula: '$\\frac{a}{\\sin A}$' },
  'sec-proof-1': { id: 'sec-proof-1', type: 'proof', title: 'Proof', tier: 'mastery', steps: [{ prompt: 'Show it.', working: '$h = b\\sin A$' }] },
  'sec-keyIdeas-1': { id: 'sec-keyIdeas-1', type: 'keyIdeas', items: [{ text: 'A pair is a {{side}} and its {{angle}}.' }] },
};

const ATOMS = {
  'sine-rule': {
    skillId: 'sine-rule',
    practice: {
      foundation: [
        { question_text: 'Atom one.', structure: 'solve-sine-proportion', solution_text: '$x = 2$\n$= 2.0$' },
        { question_text: 'Atom two.', structure: 'other-shape', solution_text: '$y = 3$' },
        { question_text: 'Atom three.', structure: 'solve-sine-proportion', solution_text: '$z = 4$' },
      ],
      development: [{ question_text: 'Atom four.', structure: 'solve-sine-proportion', solution_text: '$w = 5$' }],
    },
  },
};

const loaders = {
  loadBank: () => ({
    slug: 'fx',
    cards: new Map(Object.entries(CARDS)),
    blocks: new Map(Object.entries(BLOCKS)),
    sections: new Map([['sec', Object.keys(CARDS)]]),
  }),
  loadAtoms: (id) => ATOMS[id] || null,
};

function recipe(extra = {}) {
  return {
    slug: 'fx',
    meta: { course: 'Mathematics Stage 5 Path', title: 'Fixture', book: 2, description: 'd', version: '260830', feedbackUrl: 'https://example.test' },
    banks: { trig: 'fx' },
    defaults: { tiers: ['foundation', 'development', 'mastery'], output: { spaces: true, solutions: false, shortAnswers: false } },
    variants: {
      standard: {},
      top: { tiers: ['development', 'mastery'] },
      support: { tiers: ['foundation', 'development'], output: { shortAnswers: true } },
      teacher: { output: { spaces: false, solutions: true, shortAnswers: true } },
    },
    sections: [{
      title: 'Sine Rule for Sides',
      items: [
        { block: 'trig/sec-teach-1' },
        { block: 'trig/sec-proof-1' },
        { cards: { bank: 'trig', section: 'sec' } },
      ],
    }],
    ...extra,
  };
}

const resolveFx = (variant, extra, overrides) => resolveBooklet(recipe(extra), variant, { loaders, overrides });

// --- variants ------------------------------------------------------------------

test('the standard variant keeps every tier', () => {
  const model = resolveFx('standard');
  const cards = model.sections[0].items.filter((i) => i.kind === 'card');
  assert.deepEqual(cards.map((c) => c.card.id), ['sec-f1', 'sec-f2', 'sec-d3', 'sec-m4']);
  assert.equal(model.expectedCards, 4);
});

test('the top variant drops foundation, the support variant drops mastery', () => {
  const top = resolveFx('top').sections[0].items.filter((i) => i.kind === 'card');
  assert.deepEqual(top.map((c) => c.card.id), ['sec-d3', 'sec-m4']);

  const support = resolveFx('support').sections[0].items.filter((i) => i.kind === 'card');
  assert.deepEqual(support.map((c) => c.card.id), ['sec-f1', 'sec-f2', 'sec-d3']);
});

test('a tiered block is dropped by a variant that excludes its tier', () => {
  const hasProof = (variant) => resolveFx(variant).sections[0].items.some((i) => i.kind === 'block' && i.block.id === 'sec-proof-1');
  assert.ok(hasProof('standard'), 'the mastery proof box is in the standard booklet');
  assert.ok(!hasProof('support'), 'and gone from the support booklet, which has no mastery tier');
});

test('questions are numbered continuously through a section and restart per section', () => {
  const model = resolveFx('standard', {
    sections: [
      { title: 'One', items: [{ cards: { bank: 'trig', section: 'sec' } }] },
      { title: 'Two', items: [{ cards: ['trig/sec-f1'] }] },
    ],
  });
  assert.deepEqual(model.sections[0].items.map((i) => i.number), [1, 2, 3, 4]);
  assert.deepEqual(model.sections[1].items.map((i) => i.number), [1]);
});

test('numbering is unaffected by the variant filter — the printed booklet numbers what it shows', () => {
  const top = resolveFx('top').sections[0].items.filter((i) => i.kind === 'card');
  assert.deepEqual(top.map((c) => c.number), [1, 2]);
});

test('a tier heading is attached to the first card of each tier only', () => {
  const items = resolveFx('standard').sections[0].items.filter((i) => i.kind === 'card');
  assert.deepEqual(items.map((i) => i.tierHeading), ['Foundation', null, 'Development', 'Mastery']);
});

test('output flags come from defaults, then the variant, then the CLI', () => {
  assert.deepEqual(resolveFx('standard').output, { spaces: true, solutions: false, shortAnswers: false });
  assert.deepEqual(resolveFx('teacher').output, { spaces: false, solutions: true, shortAnswers: true });
  assert.equal(resolveFx('standard', {}, { solutions: true }).output.solutions, true);
});

test('an unknown variant is refused rather than silently rendering the default', () => {
  assert.throws(() => resolveFx('year-12'), /unknown variant "year-12"/);
});

// --- atom pulls ----------------------------------------------------------------

test('an atom pull becomes cards, filtered by structure and capped by limit', () => {
  const model = resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ atoms: { skill: 'sine-rule', tiers: ['foundation'], structures: ['solve-sine-proportion'], limit: 2 } }] }],
  }), 'standard', { loaders });
  const cards = model.sections[0].items;
  assert.equal(cards.length, 2);
  assert.deepEqual(cards.map((c) => c.card.question_text), ['Atom one.', 'Atom three.']);
  assert.equal(cards[0].card.primarySkill, 'sine-rule');
});

test('an atom pull respects the variant tier filter', () => {
  const model = resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ atoms: { skill: 'sine-rule', tiers: ['foundation', 'development'] } }] }],
  }), 'top', { loaders });
  assert.deepEqual(model.sections[0].items.map((c) => c.card.tier), ['development']);
});

test('an atom short answer is the last line of its worked solution', () => {
  assert.equal(answerFromSolution('$x = 2$\n$= 2.0$'), '$= 2.0$');
  assert.equal(answerFromSolution(''), null);
});

test('a pull that matches nothing warns instead of failing silently', () => {
  const model = resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ atoms: { skill: 'sine-rule', tiers: ['foundation'], structures: ['no-such-structure'] } }] }],
  }), 'standard', { loaders });
  assert.match(model.warnings.join('\n'), /matched nothing/);
});

test('a dangling card or block reference is an error, not a gap in the booklet', () => {
  assert.throws(() => resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ cards: ['trig/sec-f99'] }] }],
  }), 'standard', { loaders }), /card "trig\/sec-f99" not found/);
  assert.throws(() => resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ block: 'nope/sec-teach-1' }] }],
  }), 'standard', { loaders }), /unknown bank alias "nope"/);
});

// --- columns and helpers -------------------------------------------------------

test('autoColumns widens for figures and prose, narrows for short parts', () => {
  assert.equal(autoColumns([{ question_text: '$a$' }, { question_text: '$b$' }, { question_text: '$c$' }]), 3);
  assert.equal(autoColumns([{ question_text: 'x', figure: { widthCm: 7 } }, { question_text: 'y', figure: { widthCm: 7 } }]), 2);
  assert.equal(autoColumns([{ question_text: 'a'.repeat(120) }, { question_text: 'b' }]), 2);
  assert.equal(autoColumns([]), 1);
});

test('slugify matches the anchors the contents page links to', () => {
  assert.equal(slugify('Area of a Triangle using Trigonometry'), 'area-of-a-triangle-using-trigonometry');
});

test('answer space is derived from the worked solution when not authored', () => {
  assert.equal(estimateLines({ space: 9 }), 9, 'an authored value wins');
  assert.ok(estimateLines({ solution_text: '$x=1$\n$=2$' }) >= 3);
  assert.ok(estimateLines({ solution_text: `${'a'.repeat(600)}` }) <= 14, 'clamped so one question cannot eat a page');
});

// --- rich text -----------------------------------------------------------------

test('rich text renders maths, keeps one line per line, and routes tikz to the callback', () => {
  const html = richText('Find $x$.\n$x = 2$\n[tikz]\\begin{tikzpicture}\\end{tikzpicture}[/tikz]', { tikz: () => '<figure class="fig">F</figure>' });
  assert.match(html, /class="katex"/);
  assert.match(html, /<figure class="fig">F<\/figure>/);
});

test('consecutive pure-maths lines are aligned on the relation, as the booklets set out working', () => {
  const html = richText('$x = 2 + 3$\n$= 5$', {});
  assert.match(html, /aligned|array/, 'the shared grouping produced an aligned block');
});

test('a cloze prints as a blank normally and as the answer with solutions on', () => {
  const blank = richText('a {{side}} and its {{angle}}', {});
  assert.match(blank, /class="cloze"/);
  assert.ok(!blank.includes('side<'), 'the answer is not printed in the student version');

  const filled = richText('a {{side}} and its {{angle}}', { cloze: 'filled' });
  assert.match(filled, /cloze-filled/);
  assert.match(filled, /side/);
});

test('richTextInline collapses a printed answer onto one line', () => {
  assert.ok(!richTextInline('$7.9$ m\nsecond line', {}).includes('<div'));
});

// --- html ----------------------------------------------------------------------

const noCache = () => createTikzCache({ enabled: false });

function html(variant, overrides) {
  const model = resolveFx(variant, {}, overrides);
  return buildHtml(model, { cache: noCache(), bankSlug: 'fx', css: '/* test */' });
}

test('the document carries the cover, contents links and one section per recipe section', () => {
  const { html: doc, stats } = html('standard');
  assert.match(doc, /<section class="cover">/);
  assert.match(doc, /href="#sec-sine-rule-for-sides"/);
  assert.match(doc, /id="sec-sine-rule-for-sides"/);
  assert.match(doc, /Mathematics Stage 5 Path/);
  assert.match(doc, /Book 2/);
  assert.equal(stats.cards, 4);
  assert.equal(stats.blocks, 2);
});

test('every card renders exactly one numbered article', () => {
  const { html: doc } = html('standard');
  assert.equal((doc.match(/<article class="q[^"]*" data-card=/g) || []).length, 4);
  assert.match(doc, /<span class="qnum">3\.<\/span>/);
});

test('answer space appears only with --spaces, solutions only with --solutions', () => {
  assert.match(html('standard').html, /class="space"/);
  assert.ok(!html('standard').html.includes('class="sol"'));

  const teacher = html('teacher').html;
  assert.match(teacher, /class="sol"/);
  assert.ok(!teacher.includes('class="space"'), 'a teacher copy needs no writing room');
});

test('short answers print the booklet value, and only when asked for', () => {
  assert.ok(!html('standard').html.includes('class="ans"'));
  assert.match(html('support').html, /class="ans"/);
});

test('lettered parts are laid out as a chunked grid so a page can break between rows', () => {
  const doc = html('standard').html;
  assert.match(doc, /<div class="cells" style="--cols:\d">/);
  assert.equal((doc.match(/class="cell"/g) || []).length, 2, 'the two parts of the HSC question');
});

test('HSC provenance and marks are printed', () => {
  const doc = html('standard').html;
  assert.match(doc, /2022 HSC Standard 2 Band 5/);
  assert.match(doc, /<span class="marks">\(3\)<\/span>/);
});

test('an uncached figure becomes a text/tikz script carrying the app\'s exact preamble', () => {
  const model = resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ cards: ['trig/sec-f1'] }] }],
  }), 'standard', { loaders });
  model.sections[0].items[0].card = {
    ...CARDS['sec-f1'],
    question_text: 'See.\n[tikz]\n\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}\n[/tikz]',
  };
  const { html: doc, stats } = buildHtml(model, { cache: noCache(), bankSlug: 'fx', css: '' });
  assert.equal(stats.tikzPending, 1);
  assert.match(doc, /<script type="text\/tikz" data-disable-cache="1"/);
  assert.match(doc, /data-add-to-preamble="[^"]*usetikzlibrary\{arrows,arrows.meta/);
  assert.ok(!doc.includes('[tikz]'), 'the delimiters never reach the page');
});

test('a cached figure is inlined as SVG and needs no compile', () => {
  const cache = createTikzCache({ enabled: true, dir: `${process.env.TEMP || '/tmp'}/booklet-cache-test-${process.pid}` });
  cache.clear();
  const model = resolveBooklet(recipe({ sections: [{ title: 'S', items: [{ cards: ['trig/sec-f1'] }] }] }), 'standard', { loaders });
  model.sections[0].items[0].card = {
    ...CARDS['sec-f1'],
    question_text: '[tikz]\n\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}\n[/tikz]',
  };
  const first = buildHtml(model, { cache, bankSlug: 'fx', css: '' });
  const key = first.html.match(/data-tikz-key="([^"]+)"/)[1];
  cache.put(key, '<svg id="compiled"></svg>');

  const second = buildHtml(model, { cache, bankSlug: 'fx', css: '' });
  assert.equal(second.stats.tikzCached, 1);
  assert.equal(second.stats.tikzPending, 0);
  assert.match(second.html, /<svg id="compiled">/);
  cache.clear();
});

test('a cropped PNG becomes a clip box, an uncropped one a plain image', () => {
  const model = resolveBooklet(recipe({ sections: [{ title: 'S', items: [{ cards: ['trig/sec-f1', 'trig/sec-f2'] }] }] }), 'standard', { loaders });
  model.sections[0].items[0].card = { ...CARDS['sec-f1'], figure: { png: 'figures/image6.png', widthCm: 4, crop: { l: 0.1, t: 0, r: 0.6, b: 0 } } };
  model.sections[0].items[1].card = { ...CARDS['sec-f2'], figure: { png: 'figures/image9.png', widthCm: 5 } };
  const { html: doc } = buildHtml(model, { cache: noCache(), bankSlug: 'fx', css: '' });
  assert.match(doc, /class="fig fig-cropped"[^>]*--w:4cm/);
  assert.match(doc, /src="\/bank\/fx\/image6\.png"/);
  assert.match(doc, /<figure class="fig"><img src="\/bank\/fx\/image9\.png" style="width:5cm"/);
});

test('a worked example always shows its working, whatever the variant', () => {
  const model = resolveBooklet(recipe({
    sections: [{ title: 'S', items: [{ block: 'trig/sec-example-1' }] }],
  }), 'standard', {
    loaders: {
      ...loaders,
      loadBank: () => ({
        cards: new Map(),
        sections: new Map(),
        blocks: new Map([['sec-example-1', { id: 'sec-example-1', type: 'example', title: 'Example', question_text: 'Find $x$.', solution_text: '$x = 7.1$' }]]),
      }),
    },
  });
  const { html: doc } = buildHtml(model, { cache: noCache(), bankSlug: 'fx', css: '' });
  assert.match(doc, /class="working"/);
  assert.match(doc, /7\.1/);
});
