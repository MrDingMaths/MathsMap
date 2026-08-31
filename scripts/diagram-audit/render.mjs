// Wave 3 diagram lane, step 1: render every [tikz] block for a set of skills to PNGs.
//
//   node scripts/diagram-audit/render.mjs --ids a,b,c --out .agywork/W3-1/diagram/captures
//
// Thin wrapper over scripts/shoot-tikz.mjs (which needs `npm run dev` running — start it
// first; `predev` refreshes the manifest, or run `npm run manifest` after content changes).
// After the shoot, splits the manifest: compile failures (status "fail"/"pending") are
// written to compile-failures.json — those route straight to redraw tasks, no vision pass.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib/audit-lib.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const ids = arg('--ids', '');
const outDir = path.resolve(arg('--out', ''));
// Vite takes the next free port when 5173 is occupied (a second checkout, a stale server),
// and rendering against the wrong instance silently shoots someone else's content — so the
// base URL is never assumed: an explicit --base wins, otherwise the batch's own pinned
// server (scripts/agy/dev-server.mjs --start) is used, and only failing both do we fall
// back to the default port.
const { readBase } = await import('../agy/dev-server.mjs');
const base = arg('--base', readBase() || 'http://localhost:5173');
if (!ids || !arg('--out', '')) {
  console.error('usage: node scripts/diagram-audit/render.mjs --ids a,b,c --out <dir> [--base http://localhost:5173]  (dev server must be running)');
  process.exit(2);
}

try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'shoot-tikz.mjs'), '--ids', ids, '--out', outDir, '--base', base],
    { stdio: 'inherit', cwd: ROOT, timeout: 10 * 60 * 1000 });
} catch (error) {
  console.error(`✗ shoot-tikz failed: ${error.message} — is the dev server running (npm run dev)?`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
const failures = manifest.filter(m => m.status !== 'ok' && m.status !== 'done' && m.status !== 'success');
const failFile = path.join(outDir, 'compile-failures.json');
fs.writeFileSync(failFile, JSON.stringify(failures.filter(m => m.status === 'fail' || m.status === 'pending'), null, 2));
const failCount = failures.filter(m => m.status === 'fail' || m.status === 'pending').length;
console.log(`${manifest.length} block(s) rendered, ${failCount} compile failure(s)/stall(s) → ${failFile}`);
