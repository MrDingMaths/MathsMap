// Locations are validated against the current tree. Cached paths never own content
// and therefore remain safe after moves, undo, bank updates and project switches.
const locations = new Map();
const excluded = new Set(['source','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification']);
export function locateBookletContent(project, id) {
  if (!project?.sections || !id) return null;
  const key = project.id + ':' + id, cached = locations.get(key);
  const at = path => path.reduce((value, part) => value?.[part], project);
  if (cached && at(cached)?.id === id) return {node:at(cached),path:cached,section:project.sections[cached[1]],block:cached[2]==='blocks'?project.sections[cached[1]].blocks[cached[3]]:null};
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
  return {node:at(found),path:found,section:project.sections[found[1]],block:found[2]==='blocks'?project.sections[found[1]].blocks[found[3]]:null};
}

export function replaceAtPath(root, path, value) {
  if (!path.length) return value;
  const [key,...tail] = path;
  if (!root || typeof root !== 'object' || !Object.hasOwn(root,key)) throw Error('The edited content moved or was removed.');
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
