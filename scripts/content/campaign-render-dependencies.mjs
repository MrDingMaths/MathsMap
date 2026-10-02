import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { hashValue, inside } from './campaign-sources.mjs';

export const CAMPAIGN_RENDER_DEPENDENCY_PROFILE = 'content-campaign-render-dependencies-v2';
// Bind the actual canonical producer and both diagram/content containers. Follow
// their local module imports and include the complete installed font/TeX assets.
// Candidate/source JSON stays separately bound by the capture receipt.
const roots = [
  'scripts/shoot-tikz.mjs', 'src/views/TikzCheck.svelte',
  'src/components/Tikz.svelte', 'src/components/InlineContent.svelte',
  'src/components/Math.svelte', 'src/components/TheoryView.svelte',
  'src/views/SkillDetail.svelte', 'src/app.css', 'index.html', 'vite.config.js',
  'scripts/booklet/render-cache-server.mjs', 'scripts/vite-public-modules.mjs',
  'scripts/content/campaign-render-dependencies.mjs',
  'scripts/content/campaign-visual-evidence.mjs', 'package-lock.json',
];
// Parse imports rather than matching line starts: a same-line second import,
// re-export or literal dynamic import must not escape the binding. Variable
// imports require an explicit dependency declaration instead of a guessed hash.
function moduleSources(source, file) {
  const scripts = file.endsWith('.svelte')
    ? [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(row => row[1]) : [source];
  const names = [];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) names.push(node.source.value);
    if (node.type === 'ImportExpression') {
      if (node.source.type !== 'Literal' || typeof node.source.value !== 'string') throw new Error('Unbound variable renderer import in ' + file);
      names.push(node.source.value);
    }
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  };
  for (const script of scripts) visit(parse(script, { ecmaVersion: 'latest', sourceType: 'module' }));
  return names;
}
export function campaignRendererDependencyManifest(root) {
  const files = new Set(roots);
  function addTree(relativePath) {
    const file = inside(root, relativePath);
    if (!fs.existsSync(file)) { files.add(relativePath); return; }
    if (fs.statSync(file).isDirectory()) {
      for (const entry of fs.readdirSync(file).sort()) addTree(relativePath + '/' + entry);
    } else files.add(relativePath);
  }
  addTree('public/libs');
  addTree('node_modules/katex/dist');
  addTree('node_modules/acorn/dist');
  // Iterating a Set visits dependencies added during traversal, including cycles
  // only once. Missing local imports remain explicit null bindings.
  for (const relativePath of files) {
    const file = inside(root, relativePath);
    if (!/\.(?:js|mjs|svelte|css|html)$/.test(file) || !fs.existsSync(file) || /^(?:public\/libs|node_modules)\//.test(relativePath)) continue;
    const source = fs.readFileSync(file, 'utf8');
    const references = /\.(?:js|mjs|svelte)$/.test(file) ? moduleSources(source, relativePath).map(name => ({ name, module: true })) : [];
    // CSS assets and imports affect painted fonts/ink too. Public absolute URLs
    // are rooted in public; queries/fragments select the same local bytes.
    if (/\.(?:css|svelte|html)$/.test(file)) {
      for (const match of source.matchAll(/url\(\s*["']?([^"'\s)]+)["']?\s*\)/g)) references.push({ name: match[1], module: false });
      for (const match of source.matchAll(/@import\s+["']([^"']+)["']/g)) references.push({ name: match[1], module: false });
    }
    if (file.endsWith('.html')) {
      for (const match of source.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/g)) references.push({ name: match[1], module: true });
    }
    for (const { name, module } of references) {
      if (typeof name !== 'string' || /^(?:[a-z]+:|#|\/\/)/i.test(name) || (module && !name.startsWith('.') && !name.startsWith('/'))) continue;
      const clean = decodeURIComponent(name.split(/[?#]/)[0]);
      const dependency = path.posix.normalize(clean.startsWith('/') ? (module && (clean.startsWith('/src/') || fs.existsSync(inside(root, clean.slice(1)))) ? clean.slice(1) : 'public' + clean) : path.posix.join(path.posix.dirname(relativePath), clean));
      inside(root, dependency); // Reject escaping imports instead of hashing outside the workspace.
      files.add(dependency);
    }
  }
  return {
    profile: CAMPAIGN_RENDER_DEPENDENCY_PROFILE,
    files: [...files].sort().map(relativePath => {
      const file = inside(root, relativePath);
      return { path: relativePath, hash: fs.existsSync(file) && fs.statSync(file).isFile() ? hashValue(fs.readFileSync(file)) : null };
    }),
  };
}

export const campaignRendererSignature = root => hashValue(campaignRendererDependencyManifest(root));
