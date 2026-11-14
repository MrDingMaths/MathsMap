// Removes Booklet Studio's authoring folders from a public build.
// Runs after `vite build` (package.json "postbuild"): node deploy/prune-dist.mjs [outDir]
//
// Vite copies all of public/ into dist/, including Studio-only material:
// booklet images and source scans, project files, import evidence and audit
// inputs. The public site never reads them, and anything in dist/ is uploaded
// to Cloudflare and publicly reachable, so they are deleted from the build
// output (never from public/). A Studio build (VITE_BOOKLET_STUDIO=true) keeps them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const STUDIO_ONLY = ['booklet-assets', 'booklets', '__booklet', '.audit-input'];

export function pruneDist(outDir) {
  const root = path.resolve(outDir);
  if (path.basename(root) === 'public') throw new Error('Refusing to prune public/: pass the build output folder');
  const removed = [];
  for (const name of STUDIO_ONLY) {
    const target = path.join(root, name);
    if (!fs.existsSync(target)) continue;
    fs.rmSync(target, { recursive: true, force: true });
    removed.push(name);
  }
  return removed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outDir = path.resolve(process.argv[2] ?? 'dist');
  if (process.env.VITE_BOOKLET_STUDIO === 'true') {
    console.log('prune-dist: Studio build, keeping authoring folders');
  } else {
    if (!fs.existsSync(path.join(outDir, 'index.html'))) throw new Error(`Not a build folder (no index.html): ${outDir}`);
    const removed = pruneDist(outDir);
    console.log(`prune-dist: removed ${removed.length ? removed.join(', ') : 'nothing'} from ${outDir}`);
  }
}
