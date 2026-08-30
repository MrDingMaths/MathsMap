import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNetworkFigure,
  expandChainedDraws,
  normaliseEdgeRef,
  emitStep,
  renderSolution,
  findCrowdedVertices,
  backWeightLabel,
  figureFromQuestion,
  TREE_EDGE_STYLE,
  STEP_MARKER
} from '../scripts/networks-steps.mjs';

const FIGURE = [
  '\\begin{tikzpicture}[every node/.style={font=\\large}]',
  '\\coordinate (A) at (0,1.5);',
  '\\coordinate (B) at (2,2.6);',
  '\\coordinate (C) at (2,0.4);',
  '\\draw (A) -- (B) node[midway, above left] {$2$};',
  '\\draw (B) -- (C) node[midway, fill=white, inner sep=1pt] {$4$};',
  '\\draw (A) -- (C) node[midway, below left] {$6$};',
  '\\fill (A) circle (2.5pt) node[left] {$A$};',
  '\\fill (B) circle (2.5pt) node[above] {$B$};',
  '\\fill (C) circle (2.5pt) node[below] {$C$};',
  '\\end{tikzpicture}'
].join('\n');

test('parses a networks figure into coordinates, edges and vertices', () => {
  const fig = parseNetworkFigure(FIGURE);
  assert.equal(fig.options, '[every node/.style={font=\\large}]');
  assert.deepEqual([...fig.coords.keys()], ['A', 'B', 'C']);
  assert.equal(fig.edges.length, 3);
  assert.equal(fig.vertices.length, 3);
  assert.deepEqual(fig.coords.get('B'), { x: 2, y: 2.6 });
});

test('a directed figure keeps its arrow-style preamble', () => {
  const directed = FIGURE
    .replace('\\coordinate (A)', '\\usetikzlibrary{decorations.markings}\n\\coordinate (A)')
    .replace('\\draw (A) -- (B)', '\\draw[midarrow] (A) -- (B)');
  const fig = parseNetworkFigure(directed);
  assert.deepEqual(fig.preamble, ['\\usetikzlibrary{decorations.markings}']);
  assert.equal(fig.edges[0].opts, 'midarrow');
  assert.match(emitStep(fig, { bold: ['A-B'] }), /\\draw\[midarrow, line width=1\.6pt\] \(A\) -- \(B\)/);
});

test('expands an unweighted chained path into one draw per edge', () => {
  const expanded = expandChainedDraws('\\draw (A) -- (B) -- (C) -- (A);');
  assert.deepEqual(expanded.split('\n'), [
    '\\draw (A) -- (B);',
    '\\draw (B) -- (C);',
    '\\draw (C) -- (A);'
  ]);
});

test('an unparseable figure line throws rather than rendering silently', () => {
  assert.throws(() => parseNetworkFigure(FIGURE.replace('\\coordinate (C) at (2,0.4);', '\\path (C) circle (1);')), /unparseable figure line/);
});

test('edge references are read in every form the model may write', () => {
  const coords = new Map([['A', {}], ['B', {}], ['M1', {}], ['M5', {}]]);
  assert.equal(normaliseEdgeRef('A-B', coords), 'A-B');
  assert.equal(normaliseEdgeRef('B-A', coords), 'A-B');
  assert.equal(normaliseEdgeRef('A–B', coords), 'A-B');
  assert.equal(normaliseEdgeRef(['B', 'A'], coords), 'A-B');
  assert.equal(normaliseEdgeRef('AB', coords), 'A-B');
  assert.equal(normaliseEdgeRef('M1M5', coords), 'M1-M5');
});

test('a step thickens only the selected edges and never deletes the rest', () => {
  const fig = parseNetworkFigure(FIGURE);
  const step = emitStep(fig, { bold: ['A-B'] });
  assert.equal((step.match(/\\draw/g) || []).length, 3);
  assert.equal((step.match(new RegExp(TREE_EDGE_STYLE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1);
  assert.match(step, /\\draw\[line width=1\.6pt\] \(A\) -- \(B\)/);
  // coordinates are reproduced verbatim — the whole point of rendering from the base figure
  assert.match(step, /\\coordinate \(B\) at \(2,2\.6\);/);
});

test('naming an edge the figure does not contain is an error, not a silent no-op', () => {
  const fig = parseNetworkFigure(FIGURE);
  assert.throws(() => emitStep(fig, { bold: ['A-Z'] }), /step names edge A-Z, which is not in the figure/);
  assert.throws(() => emitStep(fig, { bold: ['ABC'] }), /cannot read edge reference/);
});

test('Dijkstra mode draws label circles, leaving unreached vertices empty', () => {
  const fig = parseNetworkFigure(FIGURE);
  const step = emitStep(fig, { labels: { A: 0, B: 2 } });
  assert.match(step, /\\node\[circle, draw, fill=white, minimum size=7mm, inner sep=0pt\] at \(A\) \{\$0\$\};/);
  assert.match(step, /\\node\[circle, draw, fill=white, minimum size=7mm, inner sep=0pt\] at \(C\) \{\};/);
  assert.match(step, /\\node\[left=4mm\] at \(A\) \{\$A\$\};/);
  assert.equal(step.includes('\\fill (A) circle'), false);
  assert.throws(() => emitStep(fig, { labels: { Z: 1 } }), /which the figure never draws/);
});

test('weights are backed with white so they survive the denser step diagram', () => {
  assert.equal(backWeightLabel('node[midway, above left] {$2$}'), 'node[midway, above left, fill=white, inner sep=1pt] {$2$}');
  // already backed — left alone rather than double-filled
  const already = 'node[midway, fill=white, inner sep=1pt] {$4$}';
  assert.equal(backWeightLabel(already), already);
});

test('markers are replaced in order and a miscount fails loudly', () => {
  const fig = parseNetworkFigure(FIGURE);
  const solution = `1. **Start**\n${STEP_MARKER}\n2. **Add**\n${STEP_MARKER}\n$=6$`;
  const rendered = renderSolution(solution, fig, [{ bold: [] }, { bold: ['A-B'] }]);
  assert.equal((rendered.match(/\[tikz\]/g) || []).length, 2);
  assert.equal(rendered.includes(STEP_MARKER), false);
  assert.match(rendered.split('[/tikz]')[1], /^\n2\. \*\*Add\*\*/);
  assert.throws(() => renderSolution(solution, fig, [{ bold: [] }]), /2 \[\[STEP\]\] marker\(s\) but 1 step/);
});

test('crowding faults name the vertex the layout collides with', () => {
  const tight = FIGURE.replace('\\coordinate (C) at (2,0.4);', '\\coordinate (C) at (1,2.05);');
  const faults = findCrowdedVertices(parseNetworkFigure(tight));
  assert.ok(faults.some((f) => /edge A-B passes .* from vertex C/.test(f)), faults.join(' | '));
  assert.deepEqual(findCrowdedVertices(parseNetworkFigure(FIGURE)), []);
});

test('the base figure is taken from the question text when there is one', () => {
  assert.equal(figureFromQuestion(`Find the shortest path.\n[tikz]\n${FIGURE}\n[/tikz]`), FIGURE);
  assert.equal(figureFromQuestion('Edge weights are $AB=8$.'), null);
});
