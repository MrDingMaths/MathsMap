// Assembles a runnable vision-gate workflow script from a shots directory.
// Reads <shots>/manifest.json (from shoot-tikz.mjs) and inlines the item list
// (absolute PNG paths + Q/A) into head+tail templates, so the workflow needs no
// filesystem access of its own. Usage:
//   node scripts/build-vision-gate.mjs --shots .shots --head <head.js> --tail <tail.js> --out <gate.js>
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const arg = (n, d = null) => { const i = process.argv.indexOf(n); return i !== -1 && i < process.argv.length - 1 ? process.argv[i + 1] : d; };
const shots = resolve(arg('--shots', '.shots'));
const head = readFileSync(resolve(arg('--head')), 'utf8');
const tail = readFileSync(resolve(arg('--tail')), 'utf8');
const out = resolve(arg('--out'));

const manifest = JSON.parse(readFileSync(join(shots, 'manifest.json'), 'utf8'));
const items = manifest.map((m, i) => ({
  id: `${String(i).padStart(3, '0')}-${m.skillId}-${m.field}`.replace(/[^a-z0-9-]+/gi, '-'),
  png: join(shots, m.png),
  skillId: m.skillId,
  field: m.field,
  q: m.q,
  a: m.a,
  status: m.status
}));

// Only vision-review diagrams that actually compiled; compile-fails are already
// known from the manifest status and need code fixes, not a vision opinion.
const reviewable = items.filter((it) => it.status !== 'fail');
const script = head + JSON.stringify(reviewable, null, 1) + '\n' + tail;
writeFileSync(out, script);
console.log(JSON.stringify({ out, total: items.length, reviewable: reviewable.length, compileFails: items.length - reviewable.length }));
