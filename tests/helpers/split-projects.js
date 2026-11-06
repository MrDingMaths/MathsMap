// Helpers for booklets split into two parts on 6 November 2026:
// part 1 keeps the original id, part 2 is `<stem>-2-v1`; block ids are unchanged.
import fs from 'node:fs';

const root = new URL('../../booklets/projects/', import.meta.url);

export function siblingId(id) {
  return id.replace(/-v1$/, '-2-v1');
}

export function readProjectFile(id) {
  const url = new URL(`${id}.json`, root);
  return fs.existsSync(url) ? JSON.parse(fs.readFileSync(url, 'utf8')) : null;
}

// Part 1 and part 2 (when the booklet has been split), in order.
export function loadParts(id) {
  const first = readProjectFile(id);
  const second = first ? readProjectFile(siblingId(id)) : null;
  return second && second.source?.partition?.parentProjectId === id ? [first, second] : [first];
}

// Part 1 with the sections of every later part appended, so content that moved
// to part 2 is still found under the original id.
export function loadWholeProject(id) {
  const parts = loadParts(id);
  const whole = structuredClone(parts[0]);
  for (const part of parts.slice(1)) {
    whole.sections.push(...structuredClone(part.sections));
    mergeKeyed(whole, part, ['settings', 'layoutOverrides', 'blockLayouts']);
  }
  return whole;
}

// Finds a block across a split pair; returns the project that holds it too.
export function findBlockAcrossParts(id, blockId) {
  for (const project of loadParts(id)) {
    const stack = [...project.sections];
    while (stack.length) {
      const node = stack.shift();
      if (!node || typeof node !== 'object') continue;
      if (node.id === blockId && node !== project) return { project, block: node };
      for (const v of Object.values(node)) if (v && typeof v === 'object') stack.push(...(Array.isArray(v) ? v : [v]));
    }
  }
  return null;
}

// Adds the entries of a keyed map that exist only in `part` to the same map of `whole`.
function mergeKeyed(whole, part, keys) {
  const read = (p) => keys.reduce((o, k) => o?.[k], p);
  const extra = read(part);
  if (!extra) return;
  let target = whole;
  for (const k of keys.slice(0, -1)) target = target[k] ??= {};
  const last = keys[keys.length - 1];
  target[last] = { ...structuredClone(extra), ...(target[last] ?? {}) };
}
