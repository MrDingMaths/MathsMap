const edgeKey = (source, target) => `${source}->${target}`;
const pairKey = (a, b) => (a < b ? `${a}<->${b}` : `${b}<->${a}`);

const byId = (a, b) => a.localeCompare(b);
const byEdge = (a, b) => byId(a.source, b.source) || byId(a.target, b.target);

export function stronglyConnectedComponents(nodeIds, edges) {
  const nodes = [...new Set(nodeIds)].sort(byId);
  const adjacency = new Map(nodes.map((id) => [id, []]));
  for (const edge of [...edges].sort(byEdge)) {
    if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
      adjacency.get(edge.source).push(edge.target);
    }
  }
  for (const targets of adjacency.values()) targets.sort(byId);

  let nextIndex = 0;
  const index = new Map();
  const lowLink = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];

  function visit(id) {
    index.set(id, nextIndex);
    lowLink.set(id, nextIndex);
    nextIndex += 1;
    stack.push(id);
    onStack.add(id);

    for (const target of adjacency.get(id) || []) {
      if (!index.has(target)) {
        visit(target);
        lowLink.set(id, Math.min(lowLink.get(id), lowLink.get(target)));
      } else if (onStack.has(target)) {
        lowLink.set(id, Math.min(lowLink.get(id), index.get(target)));
      }
    }

    if (lowLink.get(id) !== index.get(id)) return;
    const component = [];
    let current;
    do {
      current = stack.pop();
      onStack.delete(current);
      component.push(current);
    } while (current !== id);
    component.sort(byId);
    components.push(component);
  }

  for (const id of nodes) if (!index.has(id)) visit(id);
  return components.sort((a, b) => byId(a[0], b[0]));
}

function hasAlternatePath(adjacency, source, target) {
  const seen = new Set([source]);
  const queue = (adjacency.get(source) || []).filter((id) => id !== target);
  while (queue.length) {
    const id = queue.shift();
    if (id === target) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(adjacency.get(id) || []));
  }
  return false;
}

export function transitiveReductionDag(nodeIds, edges) {
  const nodes = [...new Set(nodeIds)].sort(byId);
  const unique = new Map();
  for (const edge of edges) unique.set(edgeKey(edge.source, edge.target), edge);
  const ordered = [...unique.values()].sort(byEdge);
  const adjacency = new Map(nodes.map((id) => [id, []]));
  for (const edge of ordered) adjacency.get(edge.source)?.push(edge.target);
  for (const targets of adjacency.values()) targets.sort(byId);
  return ordered.filter((edge) => !hasAlternatePath(adjacency, edge.source, edge.target));
}

export function maximumWeightSpanningTree(nodeIds, edges) {
  const nodes = [...new Set(nodeIds)].sort(byId);
  const parent = new Map(nodes.map((id) => [id, id]));
  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== id) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  const ordered = [...edges].sort(
    (a, b) => (b.weight || 0) - (a.weight || 0) || byEdge(a, b)
  );
  const tree = [];
  for (const edge of ordered) {
    const sourceRoot = find(edge.source);
    const targetRoot = find(edge.target);
    if (sourceRoot === targetRoot) continue;
    parent.set(targetRoot, sourceRoot);
    tree.push(edge);
  }
  return tree;
}

export function buildTopicBackbone(nodeIds, relations) {
  const nodes = [...new Set(nodeIds)].sort(byId);
  const semantic = [...relations].sort(byEdge);
  const components = stronglyConnectedComponents(nodes, semantic);
  const componentByNode = new Map();
  components.forEach((component, index) => {
    for (const id of component) componentByNode.set(id, index);
  });

  const componentCandidates = new Map();
  for (const relation of semantic) {
    const sourceComponent = componentByNode.get(relation.source);
    const targetComponent = componentByNode.get(relation.target);
    if (sourceComponent === targetComponent) continue;
    const key = edgeKey(String(sourceComponent), String(targetComponent));
    if (!componentCandidates.has(key)) componentCandidates.set(key, []);
    componentCandidates.get(key).push(relation);
  }

  const componentEdges = [...componentCandidates.keys()].map((key) => {
    const [source, target] = key.split('->');
    return { source, target };
  });
  const reducedComponents = transitiveReductionDag(
    components.map((_, index) => String(index)),
    componentEdges
  );

  const backbone = reducedComponents.map((componentEdge) => {
    const candidates = componentCandidates
      .get(edgeKey(componentEdge.source, componentEdge.target))
      .sort((a, b) => (b.weight || 0) - (a.weight || 0) || byEdge(a, b));
    return { ...candidates[0], kind: 'backbone' };
  });

  const interdependent = [];
  for (const component of components.filter((item) => item.length > 1)) {
    const undirected = new Map();
    for (const relation of semantic) {
      if (!component.includes(relation.source) || !component.includes(relation.target)) continue;
      const key = pairKey(relation.source, relation.target);
      const [source, target] = key.split('<->');
      const current = undirected.get(key) || {
        id: `inter:${key}`,
        source,
        target,
        weight: 0,
        cross: false,
        kind: 'interdependent'
      };
      current.weight += relation.weight || 1;
      current.cross ||= Boolean(relation.cross);
      undirected.set(key, current);
    }
    interdependent.push(...maximumWeightSpanningTree(component, [...undirected.values()]));
  }

  const adjacency = new Map(
    nodes.map((id) => [id, { incoming: [], outgoing: [], interdependent: [] }])
  );
  for (const relation of semantic) {
    adjacency.get(relation.source)?.outgoing.push(relation);
    adjacency.get(relation.target)?.incoming.push(relation);
  }
  for (const component of components.filter((item) => item.length > 1)) {
    for (const id of component) {
      adjacency.get(id).interdependent = component.filter((other) => other !== id);
    }
  }
  for (const value of adjacency.values()) {
    value.incoming.sort(byEdge);
    value.outgoing.sort(byEdge);
    value.interdependent.sort(byId);
  }

  return { components, componentByNode, backbone, interdependent, adjacency };
}
