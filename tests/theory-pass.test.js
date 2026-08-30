import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spliceTheory } from '../scripts/agy/lib/json-splice.mjs';
import { collectBlocks } from '../scripts/lib/tikz-blocks.mjs';
import { fieldAccessor } from '../scripts/diagram-audit/lib/audit-lib.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const FIGURE = [
  '\\begin{tikzpicture}[every node/.style={font=\\large}]',
  '\\draw (0,0) circle (1.5cm);',
  '\\draw (0,0) -- (1.5,0) node[midway, above] {$r$};',
  '\\end{tikzpicture}',
].join('\n');
const tikz = (body) => `[tikz]\n${body}\n[/tikz]`;

// checkRepair reads the CURRENT theory out of public/, so the fixtures below are exercised
// against a throwaway skill written into public/ and removed afterwards.
const SKILL = '__theory_pass_fixture__';
const contentFile = path.join(ROOT, 'public', 'content', `${SKILL}.json`);

const THEORY = {
  intro: 'A **circle** is the set of all points in a plane that are situated at a constant distance from a fixed central point.',
  facts: [
    'The **radius** $r$ is the distance from the centre to any point on the circumference of the circle.',
    'The diameter is $2r$.',
  ],
  steps: ['Identify the radius', 'Substitute into the formula'],
};
const TIGHT = {
  intro: 'A **circle** is every point the same distance from its centre.',
  facts: ['The **radius** $r$ runs from the centre to the edge.', 'The diameter is $2r$.'],
  steps: THEORY.steps,
};
const doc = (theory) => ({
  skillId: SKILL,
  atomType: 'R',
  theory,
  practice: { foundation: [{ question_text: 'Find the radius.', structure: 'find-radius', solution_text: '$r=3$' }] },
});
const writeFixture = (theory = THEORY) => fs.writeFileSync(contentFile, JSON.stringify(doc(theory), null, 2));

writeFixture();
const { checkRepair, countWords, countSentences } = await import('../scripts/check-theory.mjs');
const check = (replacement, extra = {}) => checkRepair(SKILL, { decision: 'rewrite', figure: 'none', ...extra, replacement }).faults;
const warn = (replacement, extra = {}) => checkRepair(SKILL, { decision: 'rewrite', figure: 'none', ...extra, replacement }).warnings;

test.after(() => { fs.rmSync(contentFile, { force: true }); });

// ---------------------------------------------------------------------------
// spliceTheory
// ---------------------------------------------------------------------------

test('spliceTheory replaces only the theory object', () => {
  const raw = JSON.stringify(doc(THEORY), null, 2);
  const next = spliceTheory(raw, { ...TIGHT, intro: `${TIGHT.intro}\n${tikz(FIGURE)}` });
  const parsed = JSON.parse(next);
  assert.match(parsed.theory.intro, /\[tikz\]/);
  assert.deepEqual(parsed.practice, doc(THEORY).practice);
  // everything after the theory object is byte-identical
  const tail = (s) => s.slice(s.indexOf('"practice"'));
  assert.equal(tail(next), tail(raw));
});

test('spliceTheory is not fooled by the word "theory" inside a string', () => {
  const withProse = doc(THEORY);
  withProse.practice.foundation[0].question_text = 'State the "theory": what is a radius?';
  const raw = JSON.stringify(withProse, null, 2);
  const next = spliceTheory(raw, { ...THEORY, intro: 'replaced' });
  assert.equal(JSON.parse(next).theory.intro, 'replaced');
  assert.equal(JSON.parse(next).practice.foundation[0].question_text, 'State the "theory": what is a radius?');
});

// ---------------------------------------------------------------------------
// collectBlocks + fieldAccessor
// ---------------------------------------------------------------------------

test('collectBlocks finds figures in every theory field', () => {
  writeFixture({
    intro: `${THEORY.intro}\n${tikz(FIGURE)}`,
    facts: [THEORY.facts[0], `${THEORY.facts[1]}\n${tikz(FIGURE)}`],
    steps: THEORY.steps,
  });
  const wheres = collectBlocks(path.join(ROOT, 'public'), (id) => id === SKILL).map((b) => b.where);
  assert.deepEqual(wheres.sort(), ['theory.facts[1]', 'theory.intro']);
  writeFixture();
});

test('fieldAccessor resolves the theory where-grammar', () => {
  const d = doc({ ...structuredClone(THEORY), intro: 'x' });
  assert.equal(fieldAccessor(d, 'theory.intro').get(), 'x');
  assert.equal(fieldAccessor(d, 'theory.facts[1]').get(), THEORY.facts[1]);
  fieldAccessor(d, 'theory.steps[0]').set('changed');
  assert.equal(d.theory.steps[0], 'changed');
  assert.throws(() => fieldAccessor(d, 'theory.facts[9]'), /no theory entry/);
});

// ---------------------------------------------------------------------------
// word counting
// ---------------------------------------------------------------------------

test('a maths span counts as one word', () => {
  assert.equal(countWords('The diameter is $2r$.'), 4);
  assert.equal(countWords('$\\frac{a}{b}$'), 1);
  assert.equal(countSentences('One. Two. Three.'), 3);
  assert.equal(countSentences('A decimal $3.5$ is not two sentences.'), 1);
});

// ---------------------------------------------------------------------------
// check-theory: the prose rewrite
// ---------------------------------------------------------------------------

test('a tightened theory passes', () => {
  assert.deepEqual(check(TIGHT), []);
});

test('an over-long intro is caught', () => {
  const long = { ...TIGHT, intro: `${TIGHT.intro} ${'word '.repeat(50)}` };
  assert.match(check(long).join(' | '), /intro is \d+ words \(limit 45\)/);
});

test('a paragraph-shaped intro is caught', () => {
  const wordy = { ...TIGHT, intro: 'One. Two. Three. Four.' };
  assert.match(check(wordy).join(' | '), /intro is 4 sentences \(limit 3\)/);
});

test('an over-long fact is caught', () => {
  const long = { ...TIGHT, facts: [`${'word '.repeat(30)}`, TIGHT.facts[1]] };
  assert.match(check(long).join(' | '), /facts\[0\] is \d+ words \(limit 25\)/);
});

// ADVISORY, not fatal (owner decision 2026-08-30): `docs/atomisation-teaching.md` prescribes
// example SETS (NPPPN, PPNN) and the schema has no `examples` field, so a set has nowhere to
// live but `facts`. Growth is reported for review; the per-fact word budget above is what
// keeps theory tight.
test('growing the fact list is an advisory, not a fault', () => {
  const more = { ...TIGHT, facts: [...TIGHT.facts, 'A third fact.'] };
  assert.deepEqual(check(more), []);
  assert.match(warn(more).join(' | '), /3 facts, was 2 — check this is an example set/);
});

test('merging two facts into one is allowed', () => {
  assert.deepEqual(check({ ...TIGHT, facts: ['The **radius** $r$ runs from the centre; the diameter is $2r$.'] }), []);
});

test('rewording a step is caught', () => {
  const moved = { ...TIGHT, steps: ['Find the radius', 'Substitute into the formula'] };
  assert.match(check(moved).join(' | '), /"steps" changed — steps are frozen/);
});

test('inventing a number under cover of a rewrite is reported as a warning', () => {
  const invented = { ...TIGHT, facts: [TIGHT.facts[0], 'The area of a $7$ cm circle is fixed.'] };
  assert.deepEqual(check(invented), []);
  assert.match(warn(invented).join(' | '), /numbers not in the original theory: 7/);
});

test('an unknown theory key is caught', () => {
  assert.match(check({ ...TIGHT, figure: FIGURE }).join(' | '), /unknown theory key "figure"/);
});

test('a raw control character is caught', () => {
  assert.match(check({ ...TIGHT, intro: `A **circle**\tis round.` }).join(' | '), /raw control character/);
});

// ---------------------------------------------------------------------------
// check-theory: the figure
// ---------------------------------------------------------------------------

test('one figure at the end of intro passes', () => {
  const drawn = { ...TIGHT, intro: `${TIGHT.intro}\n${tikz(FIGURE)}` };
  assert.deepEqual(check(drawn, { figure: 'drawn', placement: 'intro' }), []);
});

test('a figure on the fact it illustrates passes', () => {
  const facts = [`${TIGHT.facts[0]}\n${tikz(FIGURE)}`, TIGHT.facts[1]];
  assert.deepEqual(check({ ...TIGHT, facts }, { figure: 'drawn', placement: 'facts[0]' }), []);
});

// There is NO CAP on the figure count (owner decision 2026-08-30). The lane's principle is
// that the diagram sits beside the fact it teaches, so a skill with several spatial facts
// wants several figures; the earlier one-per-skill fault was an unmeasured judgement.
test('several figures pass, one beside each fact that needs one', () => {
  const many = {
    ...TIGHT,
    intro: `${TIGHT.intro}\n${tikz(FIGURE)}`,
    facts: [`${TIGHT.facts[0]}\n${tikz(FIGURE)}`, TIGHT.facts[1]],
  };
  assert.deepEqual(check(many, { figure: 'drawn', placement: 'intro' }), []);
});

test('claiming a figure without drawing one is caught', () => {
  assert.match(check(TIGHT, { figure: 'drawn', placement: 'intro' }).join(' | '), /carries no \[tikz\] block/);
});

test('a figure nobody declared is caught', () => {
  const drawn = { ...TIGHT, intro: `${TIGHT.intro}\n${tikz(FIGURE)}` };
  assert.match(check(drawn).join(' | '), /figure "none" but the theory carries a \[tikz\] block/);
});

test('a figure in a step is caught', () => {
  const inStep = { ...TIGHT, steps: [`${THEORY.steps[0]}\n${tikz(FIGURE)}`, THEORY.steps[1]] };
  assert.match(check(inStep, { figure: 'drawn', placement: 'intro' }).join(' | '), /figure in theory\.steps/);
});

test('a placement that disagrees with where the figure landed is caught', () => {
  const drawn = { ...TIGHT, intro: `${TIGHT.intro}\n${tikz(FIGURE)}` };
  assert.match(check(drawn, { figure: 'drawn', placement: 'facts[0]' }).join(' | '), /placement says "facts\[0\]" but the figure is in intro/);
});

test('a figure placed before the prose it illustrates is caught', () => {
  const drawn = { ...TIGHT, intro: `${tikz(FIGURE)}\n${TIGHT.intro}` };
  assert.match(check(drawn, { figure: 'drawn', placement: 'intro' }).join(' | '), /comes before the prose it illustrates/);
});

test('a figure spliced mid-sentence is caught', () => {
  const drawn = { ...TIGHT, intro: `The radius ${tikz(FIGURE)} runs to the edge.` };
  assert.match(check(drawn, { figure: 'drawn', placement: 'intro' }).join(' | '), /spliced mid-sentence/);
});

// The point of removing the cap: an example and its near-miss non-example belong side by
// side under ONE fact (spanning trees showing what is and is not a spanning tree; the
// trapezoidal rule illustrating more than one application).
test('several figures under one fact pass, each on its own line', () => {
  const facts = [`${TIGHT.facts[0]}\n${tikz(FIGURE)}\n${tikz(FIGURE)}`, TIGHT.facts[1]];
  assert.deepEqual(check({ ...TIGHT, facts }, { figure: 'drawn', placement: 'facts[0]' }), []);
});

test('a rewrite that drops an existing figure is caught', () => {
  writeFixture({ ...THEORY, intro: `${THEORY.intro}\n${tikz(FIGURE)}` });
  assert.match(check(TIGHT).join(' | '), /already had a figure and the rewrite dropped it/);
  writeFixture();
});
