// Locations are validated against the current tree. Cached paths never own content
// and therefore remain safe after moves, undo, bank updates and project switches.
const locations = new Map();
const excluded = new Set(['source','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification']);
const indexes = new Map();
// The same pre-order walk as the exact search below, so the first occurrence wins.
function indexContent(project) {
  const paths = new Map(), path = ['sections', 0];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.id && !paths.has(node.id)) paths.set(node.id, [...path]);
    for (const [key,value] of Object.entries(node)) if (!excluded.has(key)) {
      if (Array.isArray(value)) { path.push(key, 0); value.forEach((child,i)=>{path[path.length-1]=i;visit(child);}); path.length -= 2; }
      else if (value && typeof value === 'object') { path.push(key); visit(value); path.length -= 1; }
    }
  };
  project.sections.forEach((section,i)=>{path[1]=i;visit(section);});
  return {sections:project.sections, paths};
}
const located = (project, path) => ({node:path.reduce((value, part) => value?.[part], project),path,section:project.sections[path[1]],block:path[2]==='blocks'?project.sections[path[1]].blocks[path[3]]:null});
export function locateBookletContent(project, id) {
  if (!project?.sections || !id) return null;
  const key = project.id + ':' + id, cached = locations.get(key);
  const at = path => path.reduce((value, part) => value?.[part], project);
  if (cached && at(cached)?.id === id) return located(project,cached);
  // A booklet's first edit resolves dozens of uncached comment anchors; one walk
  // records every id. An index built in this call is exact for an absent id;
  // an older one may predate an in-place change, so the exact search decides.
  let index = indexes.get(project.id), fresh = false;
  if (index?.sections !== project.sections) {
    index = indexContent(project); fresh = true;
    indexes.delete(project.id); indexes.set(project.id, index); if (indexes.size > 4) indexes.delete(indexes.keys().next().value);
  }
  const indexed = index.paths.get(id);
  if (indexed && at(indexed)?.id === id) { locations.set(key,indexed); if(locations.size>10000)locations.delete(locations.keys().next().value); return located(project,indexed); }
  if (fresh) return null;
  let found;
  const visit = (node, path) => {
    if (!node || typeof node !== 'object' || found) return;
    if (node.id === id) { found = path; return; }
    for (const [key,value] of Object.entries(node)) if (!excluded.has(key)) {
      if (Array.isArray(value)) value.forEach((child,i)=>visit(child,[...path,key,i]));
      else if (value && typeof value === 'object') visit(value,[...path,key]);
    }
  };
  project.sections.forEach((section,i)=>visit(section,['sections',i]));
  if (!found) return null;
  locations.set(key,found);if(locations.size>10000)locations.delete(locations.keys().next().value);
  return located(project,found);
}

export function replaceAtPath(root, path, value) {
  if (!path.length) return value;
  const [key,...tail] = path;
  if (['__proto__','prototype','constructor'].includes(key)) throw Error('Invalid project edit path');
  if (!root || typeof root !== 'object' || (Array.isArray(root) && !/^(0|[1-9]\d*)$/.test(String(key))) || (!Object.hasOwn(root,key) && (tail.length || Array.isArray(root)))) throw Error('The edited content moved or was removed.');
  const next = Array.isArray(root) ? [...root] : {...root};
  next[key] = replaceAtPath(root[key],tail,value);
  return next;
}

export function changedBookletBlocks(before, after) {
  if(before?.sections===after?.sections)return [];
  const previous = new Map(before?.sections.flatMap(s=>s.blocks.map(b=>[b.id,b]))??[]), changed=[];
  for(const section of after?.sections??[])for(const block of section.blocks){if(previous.get(block.id)!==block)changed.push(block.id);previous.delete(block.id);}
  return [...changed,...previous.keys()];
}
