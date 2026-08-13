import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTopicBackbone,
  maximumWeightSpanningTree,
  stronglyConnectedComponents,
  transitiveReductionDag
} from '../src/lib/graphReduction.js';

const relation = (source, target, weight = 1) => ({
  id: `${source}->${target}`,
  source,
  target,
  weight,
  cross: false
});

function reachable(nodes, edges, source, target) {
  const adjacency = new Map(nodes.map((id) => [id, []]));
  for (const edge of edges) adjacency.get(edge.source)?.push(edge.target);
  const seen = new Set([source]);
  const queue = [...(adjacency.get(source) || [])];
  while (queue.length) {
    const id = queue.shift();
    if (id === target) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(adjacency.get(id) || []));
  }
  return false;
}

test('strongly connected topic groups are deterministic', () => {
  const nodes = ['d', 'c', 'b', 'a'];
  const edges = [relation('b', 'a'), relation('a', 'b'), relation('b', 'c'), relation('c', 'd')];
  assert.deepEqual(stronglyConnectedComponents(nodes, edges), [['a', 'b'], ['c'], ['d']]);
});

test('DAG reduction removes shortcuts while preserving reachability', () => {
  const nodes = ['a', 'b', 'c', 'd'];
  const edges = [
    relation('a', 'b'),
    relation('a', 'c'),
    relation('a', 'd'),
    relation('b', 'c'),
    relation('c', 'd')
  ];
  const reduced = transitiveReductionDag(nodes, edges);
  assert.deepEqual(reduced.map((edge) => edge.id), ['a->b', 'b->c', 'c->d']);
  for (const source of nodes) {
    for (const target of nodes) {
      assert.equal(
        reachable(nodes, reduced, source, target),
        reachable(nodes, edges, source, target),
        `${source} -> ${target}`
      );
    }
  }
});

test('maximum-weight interdependence tree prefers stronger relations with stable ties', () => {
  const tree = maximumWeightSpanningTree(['a', 'b', 'c'], [
    { source: 'a', target: 'b', weight: 5 },
    { source: 'a', target: 'c', weight: 2 },
    { source: 'b', target: 'c', weight: 2 }
  ]);
  assert.deepEqual(tree.map((edge) => `${edge.source}<->${edge.target}`), ['a<->b', 'a<->c']);
});

test('topic backbone separates semantic, backbone, and interdependent relations', () => {
  const nodes = ['a', 'b', 'c', 'd', 'e'];
  const semantic = [
    relation('a', 'b', 1),
    relation('b', 'a', 3),
    relation('a', 'c', 1),
    relation('b', 'c', 2),
    relation('b', 'd', 1),
    relation('c', 'd', 2),
    relation('c', 'e', 1),
    relation('d', 'e', 2)
  ];
  const graph = buildTopicBackbone(nodes, semantic);
  assert.deepEqual(graph.components, [['a', 'b'], ['c'], ['d'], ['e']]);
  assert.deepEqual(graph.backbone.map((edge) => edge.id), ['b->c', 'c->d', 'd->e']);
  assert.deepEqual(graph.interdependent.map((edge) => edge.id), ['inter:a<->b']);
  assert.deepEqual(graph.adjacency.get('a').interdependent, ['b']);
});
