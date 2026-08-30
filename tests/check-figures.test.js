import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// checkRepair reads the CURRENT item out of public/, so the fixtures below are exercised
// against a throwaway skill written into public/ and removed afterwards.
const SKILL = '__check_figures_fixture__';
const contentFile = path.join(ROOT, 'public', 'content', `${SKILL}.json`);
const quizFile = path.join(ROOT, 'public', 'quizzes', `${SKILL}.json`);

const FIGURE = [
  '\\begin{tikzpicture}[every node/.style={font=\\large}]',
  '\\coordinate (A) at (0,1.5);',
  '\\coordinate (B) at (2.2,2.8);',
  '\\coordinate (C) at (2.2,0.2);',
  '\\draw (A) -- (B) node[midway, above left] {$8$};',
  '\\draw (A) -- (C) node[midway, below left] {$5$};',
  '\\draw (B) -- (C) node[midway, right] {$2$};',
  '\\fill (A) circle (2.5pt) node[left] {$A$};',
  '\\fill (B) circle (2.5pt) node[above] {$B$};',
  '\\fill (C) circle (2.5pt) node[below] {$C$};',
  '\\end{tikzpicture}',
].join('\n');

const BEFORE = {
  question_text: 'A network connects $A$, $B$ and $C$.\nEdge weights are $AB=8, AC=5, BC=2$.\nFind the shortest path from $A$ to $B$.',
  structure: 'shortest-path-by-inspection',
  solution_text: '$A\\text{–}C\\text{–}B = 5+2$\n$=7$',
};

const withFigure = (figure, question) => ({
  ...BEFORE,
  question_text: question ?? `A network connects $A$, $B$ and $C$.\n[tikz]\n${figure}\n[/tikz]\nFind the shortest path from $A$ to $B$.`,
});

fs.writeFileSync(contentFile, JSON.stringify({
  skillId: SKILL, atomType: 'R',
  theory: { intro: 'x', facts: ['y'] },
  practice: { foundation: [BEFORE] },
}, null, 2));
fs.writeFileSync(quizFile, JSON.stringify({ skillId: SKILL, questions: [] }, null, 2));

const { checkRepair } = await import('../scripts/check-figures.mjs');
const target = { file: 'content', tier: 'foundation', index: 0 };
const check = (replacement) => checkRepair(SKILL, { target, replacement });

test.after(() => {
  fs.rmSync(contentFile, { force: true });
  fs.rmSync(quizFile, { force: true });
});

test('a faithful figure passes', () => {
  assert.deepEqual(check(withFigure(FIGURE)), []);
});

test('dropping an edge weight the stem stated is caught', () => {
  const missing = FIGURE.replace('\\draw (B) -- (C) node[midway, right] {$2$};', '\\draw (B) -- (C);');
  assert.match(check(withFigure(missing)).join(' | '), /stem states edge weight\(s\) 2 that the figure does not show/);
});

test('inventing a weight the item never mentions is caught', () => {
  const invented = FIGURE.replace('{$2$}', '{$9$}');
  const faults = check(withFigure(invented)).join(' | ');
  assert.match(faults, /figure shows weight 9, which appears nowhere in the item/);
});

test('a route TOTAL is not mistaken for an edge weight the figure must show', () => {
  // "8 min + 11 min = 19 min" states a total, not an edge — the figure must NOT draw 19.
  fs.writeFileSync(contentFile, JSON.stringify({
    skillId: SKILL, atomType: 'R', theory: { intro: 'x', facts: ['y'] },
    practice: { foundation: [{ ...BEFORE, question_text: 'Two paths connect $A$ to $B$:\nPath 1: $8 + 11 = 19$\nPath 2: $5 + 2 = 7$\nWhich is shorter?' }] },
  }, null, 2));
  assert.deepEqual(check(withFigure(FIGURE)), []);
  fs.writeFileSync(contentFile, JSON.stringify({
    skillId: SKILL, atomType: 'R', theory: { intro: 'x', facts: ['y'] },
    practice: { foundation: [BEFORE] },
  }, null, 2));
});

test('re-checking an item whose figure is already applied is idempotent', () => {
  // Once applied, the edge-list prose is gone from the stem; the weights live only in the figure.
  const applied = withFigure(FIGURE);
  fs.writeFileSync(contentFile, JSON.stringify({
    skillId: SKILL, atomType: 'R', theory: { intro: 'x', facts: ['y'] },
    practice: { foundation: [applied] },
  }, null, 2));
  assert.deepEqual(check(applied), []);
  fs.writeFileSync(contentFile, JSON.stringify({
    skillId: SKILL, atomType: 'R', theory: { intro: 'x', facts: ['y'] },
    practice: { foundation: [BEFORE] },
  }, null, 2));
});

test('a question figure may not mark its own answer', () => {
  const bold = FIGURE.replace('\\draw (A) -- (C)', '\\draw[line width=1.6pt] (A) -- (C)');
  assert.match(check(withFigure(bold)).join(' | '), /must not mark the answer/);
  const labelled = FIGURE.replace(
    '\\fill (A) circle (2.5pt) node[left] {$A$};',
    '\\node[circle, draw, fill=white, minimum size=7mm, inner sep=0pt] at (A) {$0$};'
  );
  assert.match(check(withFigure(labelled)).join(' | '), /must not carry running totals|does not parse/);
});

test('changing anything but question_text is caught', () => {
  const drifted = { ...withFigure(FIGURE), solution_text: '$=99$' };
  assert.match(check(drifted).join(' | '), /"solution_text" changed — only question_text may change/);
});

test('a crowded layout is caught', () => {
  const tight = FIGURE.replace('\\coordinate (C) at (2.2,0.2);', '\\coordinate (C) at (1.1,2.15);');
  assert.ok(check(withFigure(tight)).length > 0);
});

test('a replacement with no figure at all is caught', () => {
  assert.match(check({ ...BEFORE }).join(' | '), /no \[tikz\] block/);
});
