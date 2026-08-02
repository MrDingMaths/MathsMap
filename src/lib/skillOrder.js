// Learning order for a set of skills shown together in a list (one dot point's
// skills, say). Kept free of the JSON taxonomy imports so it can be unit tested.

// Orders `group` so a prerequisite always precedes anything in the group that
// depends on it. Kahn's algorithm over the prereq edges internal to the group;
// prereqs outside it are ignored — those skills are ordered in their own group.
// Ties break by difficulty then by `fileIndex` (position in skills.json), so the
// curated file order still shows through wherever the graph leaves a choice.
// A cycle (shouldn't exist) leaves its nodes unreachable; they're appended in
// file order rather than dropped.
export const topoSortSkills = (group, fileIndex = new Map()) => {
  const byId = new Map(group.map((s) => [s.id, s]));
  const succ = new Map(group.map((s) => [s.id, []]));
  const indeg = new Map(group.map((s) => [s.id, 0]));
  for (const s of group) {
    for (const p of s.prereqs || []) {
      if (!byId.has(p) || p === s.id) continue;
      succ.get(p).push(s.id);
      indeg.set(s.id, indeg.get(s.id) + 1);
    }
  }
  const byRank = (a, b) => {
    const sa = byId.get(a);
    const sb = byId.get(b);
    return (
      (sa?.difficulty ?? 0) - (sb?.difficulty ?? 0) ||
      (fileIndex.get(a) ?? 0) - (fileIndex.get(b) ?? 0)
    );
  };
  const queue = group.filter((s) => indeg.get(s.id) === 0).map((s) => s.id);
  const order = [];
  const seen = new Set();
  while (queue.length) {
    queue.sort(byRank);
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const s of succ.get(id)) {
      indeg.set(s, indeg.get(s) - 1);
      if (indeg.get(s) === 0) queue.push(s);
    }
  }
  for (const s of group) if (!seen.has(s.id)) order.push(s.id);
  return order.map((id) => byId.get(id));
};
