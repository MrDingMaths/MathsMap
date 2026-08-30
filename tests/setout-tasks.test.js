import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignLane, laneCDefects, hasFigure, buildPlan, LANE_A, LANE_B } from '../scripts/agy/build-setout-tasks.mjs';

const card = (structure, solution_text, question_text = 'Find the shortest path.') =>
  ({ item: { structure, solution_text, question_text } });

test('an algorithm-execution structure is lane A whatever its solution looks like', () => {
  for (const structure of LANE_A) {
    assert.equal(assignLane(card(structure, '$=9$')).lane, 'A', structure);
  }
});

test('a graph-valued answer is lane B', () => {
  for (const structure of LANE_B) {
    assert.equal(assignLane(card(structure, '$=9$')).lane, 'B', structure);
  }
});

test('a route structure is lane B only when there is a figure to redraw', () => {
  assert.equal(assignLane(card('walk-total-weight', '$T=4+3$\n$=7$')).lane, null);
  const withFig = card('walk-total-weight', '$T=4+3$\n$=7$', 'Trace it.\n[tikz]\\begin{tikzpicture}x\\end{tikzpicture}[/tikz]');
  assert.equal(assignLane(withFig).lane, 'B');
});

test('clean house-style working is left alone', () => {
  assert.equal(assignLane(card('tree-edge-vertex-count', '$e=n-1$\n$=8-1$\n$=7$')).lane, null);
  assert.deepEqual(laneCDefects('$e=n-1$\n$=8-1$\n$=7$'), []);
});

test('Markdown bullets are a defect — the renderer prints them literally', () => {
  const defects = laneCDefects('- Path $A$: $2+3=5$\n- Path $B$: $3+4=7$\nShortest is $A$.');
  assert.ok(defects.some((d) => /Markdown/.test(d)), defects.join(' | '));
  assert.equal(assignLane(card('shortest-path-by-inspection', '- Path $A$: $5$\nShortest is $A$.')).lane, 'C');
});

test('narration in place of working is a defect', () => {
  const narrated = 'Start at vertex $A$.\nLowest edge from $A$ is $AB$.\nFrom the tree, choose $AC$.';
  assert.ok(laneCDefects(narrated).some((d) => /prose lines/.test(d)));
});

test('a solution that opens at step 2 is a defect', () => {
  const orphan = '2. **Calculate the total weight by summing the selected edges**\n$L=18$';
  assert.ok(laneCDefects(orphan).some((d) => /opens at step header/.test(d)));
});

test('step headers and working lines are not counted as prose', () => {
  const clean = '1. **Do the thing**\n$A=1+2$\n$=3$\nThe cable costs less because it is shorter.';
  assert.deepEqual(laneCDefects(clean), []);
});

test('a figure inside the question is detected, one inside the solution alone is not the test', () => {
  assert.equal(hasFigure('a [tikz]\\begin{tikzpicture}x\\end{tikzpicture}[/tikz] b'), true);
  assert.equal(hasFigure('no figure here'), false);
});

test('the live plan covers the six networks skills and assigns every lane', () => {
  const plan = buildPlan();
  assert.equal(new Set(plan.map((p) => p.skillId)).size, 6);
  assert.ok(plan.every((p) => ['A', 'B', 'C'].includes(p.lane)));
  assert.ok(plan.every((p) => p.reason && p.target));
  // Lane A items that carry no question figure are the ones needing a model-authored layout.
  assert.ok(plan.some((p) => p.lane === 'A' && !p.hasFigure));
});
