import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { hashValue, inside } from './campaign-sources.mjs';

export const CAMPAIGN_RENDER_DEPENDENCY_PROFILE = 'content-campaign-render-dependencies-v2';
export const CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE = 'content-campaign-render-dependencies-scoped-v1';
export const CAMPAIGN_SCOPED_RENDER_CODE_FILES = Object.freeze([
  'scripts/content/campaign-render-dependencies.mjs', 'scripts/content/campaign-visual-evidence.mjs',
  'scripts/content/campaign-render-browser.mjs', 'tests/content-campaign-scoped-render-dependencies.test.js',
  'scripts/content/campaign-support.mjs',
  'docs/content-campaign-scoped-render-dependencies.md',
]);

export function verifyCampaignScopedRenderActivation(root, reference) {
  if (!reference?.path?.startsWith('.agywork/content-campaign/') || !reference.hash) throw Error('Explicit independently reviewed scoped renderer activation required');
  const bytes = fs.readFileSync(inside(root, reference.path));
  if (hashValue(bytes) !== reference.hash) throw Error('Scoped renderer activation changed');
  const review = JSON.parse(bytes), profile = review.profile;
  if (review.format !== 'content-campaign-scoped-render-code-review-v1' || review.accepted !== true || !review.authorIdentity?.startsWith('/root/') || !review.reviewerIdentity?.startsWith('/root/') || review.authorIdentity === review.reviewerIdentity || profile?.model !== 'gpt-6.1-sol' || profile.effort !== 'medium' || profile.requestedServiceTier !== 'default') throw Error('Different-worker Medium scoped renderer code review required');
  for (const file of CAMPAIGN_SCOPED_RENDER_CODE_FILES) {
    const row = review.files?.find(row => row.path === file);
    if (!row || row.hash !== hashValue(fs.readFileSync(inside(root, file)))) throw Error('Scoped renderer accepted code changed: ' + file);
  }
}
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

// Deliberately retain the complete v2 graph: inactive Svelte global styles and
// import-time effects still paint the live app. Only reviewed, uncalled function
// bodies are projected. Route/consumer pins require a new review before widening.
const scopePins = {
  'src/App.svelte': '03a712c9bc87231bd5427b093b0fa2d16b02299ff16ae8dfdf4930526b2dd71a',
  'src/components/FlowBookletPreview.svelte': 'b8f53093d9178fe8ab36ca9591f8d582f9dd2c86ee4f49c6a93301c44f62db95',
  'src/components/FlowBookletPage.svelte': '85f87db97afb9abd6731d42a29f64cbff58636ad7babe112dc95136b14965f33',
};
const paginationPath = 'src/lib/booklet-pagination.js';
const sourcesPath = 'scripts/content/campaign-sources.mjs';
const projectedPins = {
  [paginationPath]: '43dfa4135c49f61a0ccfca991f57fca89669852bf566c460ea91bd95578fb890',
  [sourcesPath]: '919ef2c2ef73eed28c94d5ddb77239da8d03a448c519193579f9121d3366fec1',
};
const activeRoots = ['src/views/TikzCheck.svelte', 'src/views/SkillDetail.svelte',
  'src/components/TheoryView.svelte', 'src/components/GlobalSearch.svelte',
  'src/components/SiteFooter.svelte', 'src/lib/router.svelte.js', 'src/lib/theme.svelte.js'];
const localModule = (file, name) => name.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(file), name)) : name.startsWith('/src/') ? name.slice(1) : null;

export function projectCampaignNonPaintingFunctions(file, bytes) {
  const source = bytes.toString('utf8');
  if (![paginationPath, sourcesPath].includes(file)) return source;
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const functions = ast.body.map(row => row.declaration || row).filter(row => row.type === 'FunctionDeclaration' && (file === paginationPath || row.id.name === 'validateSourceLongDescription'));
  if (!functions.length || (file === sourcesPath && functions.length !== 1)) throw Error('Missing reviewed non-painting functions: ' + file);
  // Function declarations are hoisted but their bodies must never run at module
  // evaluation. Any reference from a top-level initializer/expression rejects,
  // including aliases, callbacks, computed references and direct calls.
  const names = new Set(functions.map(row => row.id.name));
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') return;
    if (node.type === 'Identifier' && names.has(node.name)) throw Error('Non-painting function activated at module evaluation: ' + file);
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  };
  ast.body.forEach(visit);
  let projected = source;
  for (const row of functions.sort((a, b) => b.body.start - a.body.start)) projected = projected.slice(0, row.body.start) + '{/* reviewed inactive body */}' + projected.slice(row.body.end);
  return projected;
}

function verifyScopedRoutes(root, manifest) {
  const rows = new Map(manifest.files.map(row => [row.path, row.hash]));
  for (const [file, hash] of Object.entries(scopePins)) if (rows.get(file) !== hash) throw Error('Scoped render route/consumer needs independent review: ' + file);
  const pending = new Set(activeRoots);
  for (const file of pending) {
    if (file === paginationPath) throw Error('Pagination reached from active skill/TikZ route');
    const absolute = inside(root, file);
    if (!fs.existsSync(absolute)) throw Error('Missing active render dependency: ' + file);
    if (!/\.(?:js|mjs|svelte)$/.test(file)) continue;
    for (const name of moduleSources(fs.readFileSync(absolute, 'utf8'), file)) {
      const dependency = localModule(file, name);
      if (dependency) pending.add(dependency);
    }
  }
  // The private source parser is not part of the producer. Keep its import-time
  // wiring intact and reject rendering consumers acquiring new parser exports.
  for (const { path: file } of manifest.files) {
    if (!/\.(?:js|mjs|svelte)$/.test(file) || file === sourcesPath || !fs.existsSync(inside(root, file))) continue;
    const source = fs.readFileSync(inside(root, file), 'utf8');
    const references = moduleSources(source, file);
    for (const name of references) if (localModule(file, name) === paginationPath && !['src/components/FlowBookletPreview.svelte', 'src/components/FlowBookletPage.svelte'].includes(file)) throw Error('Scoped renderer acquired unreviewed pagination consumer: ' + file);
    const scripts = file.endsWith('.svelte') ? [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(row => row[1]) : [source];
    let sourceImports = 0;
    for (const script of scripts) {
      const ast = parse(script, { ecmaVersion: 'latest', sourceType: 'module' });
      for (const row of ast.body) if (row.source && localModule(file, row.source.value) === sourcesPath) {
        sourceImports++;
        if (row.type !== 'ImportDeclaration' || row.specifiers.some(s => s.type !== 'ImportSpecifier' || !['hashValue', 'inside', 'readJson', 'relative'].includes(s.imported.name))) throw Error('Scoped renderer acquired source parser dependency: ' + file);
      }
    }
    if (sourceImports !== references.filter(name => localModule(file, name) === sourcesPath).length) throw Error('Scoped renderer acquired dynamic source parser dependency: ' + file);
  }
}

export function campaignScopedRendererDependencyManifest(root) {
  const manifest = campaignRendererDependencyManifest(root);
  verifyScopedRoutes(root, manifest);
  return { profile: CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE, files: manifest.files.map(row => {
    if (![paginationPath, sourcesPath].includes(row.path)) return row;
    const hash = hashValue(projectCampaignNonPaintingFunctions(row.path, fs.readFileSync(inside(root, row.path))));
    if (hash !== projectedPins[row.path]) throw Error('Scoped render module wiring needs independent review: ' + row.path);
    return { ...row, hash, projection: 'reviewed-inactive-function-bodies-v1' };
  }) };
}

// Historical v2 receipts stay v2. This reports only dependency applicability;
// callers must still verify original receipt/input/PNG/whole-field/content and
// actual live browser evidence plus independently accepted activation code.
// Original source bytes are mandatory, hash-bound to each changed v2 row.
export function compareCampaignNonPaintingDependencyDelta(before, after, snapshots) {
  if (before?.profile !== CAMPAIGN_RENDER_DEPENDENCY_PROFILE || after?.profile !== CAMPAIGN_RENDER_DEPENDENCY_PROFILE) throw Error('Historical comparison requires complete v2 manifests');
  const a = new Map(before.files.map(row => [row.path, row.hash])), b = new Map(after.files.map(row => [row.path, row.hash]));
  if (a.size !== before.files.length || b.size !== after.files.length || a.size !== b.size || [...a.keys()].some(file => !b.has(file))) throw Error('Renderer dependency membership changed');
  for (const [file, hash] of Object.entries(scopePins)) if (a.get(file) !== hash || b.get(file) !== hash) throw Error('Historical scoped route/consumer needs independent review: ' + file);
  const changed = [...a.keys()].filter(file => a.get(file) !== b.get(file));
  for (const file of changed) {
    if (![paginationPath, sourcesPath].includes(file)) throw Error('Painting/unreviewed renderer dependency changed: ' + file);
    const pair = snapshots?.[file];
    if (!Buffer.isBuffer(pair?.before) || !Buffer.isBuffer(pair?.after) || hashValue(pair.before) !== a.get(file) || hashValue(pair.after) !== b.get(file)) throw Error('Hash-bound original/current source bytes required: ' + file);
    const projectedBefore = projectCampaignNonPaintingFunctions(file, pair.before), projectedAfter = projectCampaignNonPaintingFunctions(file, pair.after);
    if (projectedBefore !== projectedAfter || hashValue(projectedAfter) !== projectedPins[file]) throw Error('Imports/signatures/top-level renderer dependency changed: ' + file);
  }
  return { profile: CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE, applicableDependencies: true, changed, pixelAcceptance: false };
}
