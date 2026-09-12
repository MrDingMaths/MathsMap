import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync(new URL('../../booklets/sources.json', import.meta.url), 'utf8'));
export const MATHSMAP_SOURCE_ROOT = 'booklets/mathsmap-sources';
export const STUDIO_SOURCE_ROOT = 'booklets/studio-sources';

// Old batch configurations and provenance remain readable after moving sources.
// This resolves known repo-relative names only; it never searches arbitrary files.
export function currentBookletSourcePath(value) {
  const input = String(value).replaceAll('\\', '/');
  for (const move of registry.relocations) {
    if (input === move.from) return move.to;
    if (move.kind === 'directory' && input.startsWith(move.from + '/')) return move.to + input.slice(move.from.length);
  }
  return input;
}
