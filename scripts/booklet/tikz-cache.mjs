// On-disk cache of compiled TikZ figures, keyed exactly as the app keys its IndexedDB
// cache (src/lib/tikz-prepare.js `tikzKey`).
//
// A booklet can carry 200 diagrams and each takes about a second to compile in TikZJax, so
// a cold render is minutes and a warm one is seconds. That difference is what makes
// "produce three class variants" a practical operation rather than a coffee break: only the
// first variant compiles, the rest inline cached SVG.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DEFAULT_CACHE_DIR = join(ROOT, '.booklet-cache', 'tikz');

export function createTikzCache({ dir = DEFAULT_CACHE_DIR, enabled = true } = {}) {
  const memory = new Map();
  let hits = 0;
  let misses = 0;
  let writes = 0;

  if (enabled) mkdirSync(dir, { recursive: true });

  return {
    dir,
    enabled,
    get(key) {
      if (!enabled) {
        misses++;
        return null;
      }
      if (memory.has(key)) {
        hits++;
        return memory.get(key);
      }
      const file = join(dir, `${key}.svg`);
      if (!existsSync(file)) {
        misses++;
        return null;
      }
      const svg = readFileSync(file, 'utf8');
      memory.set(key, svg);
      hits++;
      return svg;
    },
    put(key, svg) {
      if (!enabled || !svg) return;
      memory.set(key, svg);
      writeFileSync(join(dir, `${key}.svg`), svg, 'utf8');
      writes++;
    },
    stats() {
      return { hits, misses, writes, size: enabled && existsSync(dir) ? readdirSync(dir).length : 0 };
    },
    clear() {
      memory.clear();
      if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
    },
  };
}
