import fs from 'node:fs';
import path from 'node:path';
import {inside} from './storage-archive.mjs';

// Reclaims regenerable export payload from local run folders and, on request,
// the process records of idle runs. Frozen runtime copies contain junctions to
// the real node_modules and render cache, so nothing here ever enters a link:
// only the link itself is removed.
const HOUR = 3600e3, DAY = 24 * HOUR;
export const PRUNE_DEFAULTS = {tempIdleMs: DAY, activeMs: 2 * DAY, recordIdleMs: 7 * DAY};

// Local tool installs, live caches, deliveries and recovery material.
const PROTECTED = new Set(['render-cache','deliveries','recovery','python','pdf-libs','practice-imports','storage-restore-check']);
// Only prefixes that tests and preflights pass to mkdtemp. Wider patterns match
// real folders such as word-studio and source-review.
const TEMP = /^(?:(?:lean-review|completed-export|booklet-snapshot-campaign|export-campaign|\.preflight)-[A-Za-z0-9]{6}|test-tmp|tool-test-temp|test-cache|bank-import-tests|classification-tests|tikz-card-capture-test-\d+)$/;
const SNAPSHOT = /^(?:runtime|frozen-runtime|baseline-app|verification-inputs|renderer-snapshot.*)$/;
const SNAPSHOT_SIGNATURE = ['src','public','scripts','vite.config.js'];
const EVIDENCE = new Set(['evidence','lanes','source','media','word']);
const STATE_DIRS = new Set(['workflow','semantic-packets']);
const STATE_FILES = new Set(['config.json','review.json','candidate.json']);
const DECISION = /corrections|reviewed|visual-findings|decision|editorial/i;
const LEASE = /\.lock$|lease|ticket|claim/i;
const LATEST_EXPORT = /\.pdf$|^report\.json$|readiness|receipt/i;

const posix = value => value.split(path.sep).join('/');
const key = value => value.toLowerCase();
const stat = file => { try { return fs.statSync(file); } catch { return null; } };
const entries = directory => fs.readdirSync(directory, {withFileTypes: true});

function referenceCandidates(raw) {
  // Evidence notes often continue as prose; try each shorter prefix.
  // A trailing slash must go too, or a named folder would not match its contents.
  const trim = value => value.replace(/[.\s`'",;)\]\/]+$/, '');
  const out = [trim(raw)];
  for (let value = out[0]; ;) {
    const cut = Math.max(value.lastIndexOf(' '), value.lastIndexOf(';'), value.lastIndexOf(','), value.lastIndexOf(')'), value.lastIndexOf('#'), value.lastIndexOf('`'));
    if (cut < 0) break;
    value = trim(value.slice(0, cut));
    if (value) out.push(value);
  }
  return out;
}

// Every .booklet-work or .agywork path named by a live booklet, bank or module,
// or by a tracked provenance record. Directories protect everything inside.
export function liveReferences(root) {
  const files = new Set(), directories = new Set(), ancestors = new Set();
  // A note that names a whole run folder points at no particular evidence.
  const runDepth = parts => parts[1] === 'full-imports' || parts[1] === 'content-campaign' ? 3 : 2;
  const realRoot = fs.realpathSync.native(root);
  const register = (candidate, directory) => {
    const parts = candidate.split('/');
    if (directory && parts.length <= runDepth(parts)) return;
    (directory ? directories : files).add(key(candidate));
    for (let n = 1; n < parts.length; n++) ancestors.add(key(parts.slice(0, n).join('/')));
  };
  const exact = candidate => {
    const file = path.join(root, candidate), info = stat(file);
    if (!info) return false;
    register(candidate, info.isDirectory());
    // A note may name its file through a link, such as the work folder
    // linked inside a frozen copy. Protect the file it really is as well.
    let real;
    try { real = posix(path.relative(realRoot, fs.realpathSync.native(file))); } catch { return true; }
    if (real && !real.startsWith('..') && !path.isAbsolute(real) && key(real) !== key(candidate)) register(real, info.isDirectory());
    return true;
  };
  const add = relative => { for (const candidate of referenceCandidates(relative)) if (exact(candidate)) return; };
  // A booklet also cites files by a path relative to its own run folder.
  const RELATIVE = /^[\w.@()+ -]+(?:[\\\/][\w.@()+ -]+)+\.\w{2,5}$/;
  const runRelative = text => {
    let project;
    try { project = JSON.parse(text); } catch { return; }
    const runs = new Set(), cited = new Set();
    const visit = (value, name) => {
      if (typeof value === 'string') {
        if (name === 'runId' && /^[\w.-]+$/.test(value)) runs.add(value);
        else if (value.length < 300 && RELATIVE.test(value)) cited.add(value.split(/[\\\/]+/).join('/'));
      } else if (value && typeof value === 'object') for (const [child, item] of Object.entries(value)) visit(item, Array.isArray(value) ? name : child);
    };
    visit(project, '');
    for (const relative of cited) {
      if (relative.split('/').some(part => part === '.' || part === '..')) continue;
      for (const run of runs) { exact(`.booklet-work/full-imports/${run}/${relative}`); exact(`.booklet-work/full-imports/${run}/lanes/exact/${relative}`); }
    }
  };
  const scan = (file, booklet = false) => {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
    if (booklet) runRelative(text);
    if (!text.includes('booklet-work') && !text.includes('agywork') && !text.includes('__booklet/full-imports')) return;
    for (const match of text.matchAll(/\.(booklet-work|agywork)((?:(?:\\\\|\\|\/)+[^"`\\\/\r\n<>|*?:]+)+)/g))
      add('.' + match[1] + '/' + match[2].split(/[\\\/]+/).filter(Boolean).join('/'));
    for (const match of text.matchAll(/\/__booklet\/full-imports\/([^\/"\\]+)\/files\/([^"\\?#\s]+)/g)) {
      try { add('.booklet-work/full-imports/' + decodeURIComponent(match[1]) + '/' + decodeURIComponent(match[2])); } catch { /* malformed escape */ }
    }
  };
  const walk = (directory, recursive, booklet = false) => {
    let list;
    try { list = entries(directory); } catch { return; }
    for (const entry of list) {
      if (entry.isSymbolicLink() || entry.name === '.revisions' || entry.name === '.sync') continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) { if (recursive) walk(file, true); }
      else if (/\.(?:json|md)$/i.test(entry.name)) scan(file, booklet && entry.name.endsWith('.json'));
    }
  };
  walk(path.join(root, 'booklets/projects'), false, true);
  walk(path.join(root, 'booklets/module-bank'), false);
  walk(path.join(root, 'booklets/question-bank'), false);
  walk(path.join(root, 'booklets/provenance'), true);
  scan(path.join(root, 'booklets/sources.json'));
  return {files, directories, ancestors};
}

function subtree(directory) {
  // Sizes a whole tree without entering links.
  let bytes = 0, files = 0, newest = 0, unreadable = false;
  for (const stack = [directory]; stack.length;) {
    const current = stack.pop();
    let list;
    try { list = entries(current); } catch { unreadable = true; continue; }
    for (const entry of list) {
      if (entry.isSymbolicLink()) continue;
      const file = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(file);
      else if (entry.isFile()) { const info = stat(file); if (info) { bytes += info.size; files++; newest = Math.max(newest, info.mtimeMs); } }
    }
  }
  return {bytes, files, newest, unreadable};
}

function payloadReason(name, directory, underEvidence) {
  if (underEvidence) return null;
  if (name === 'vite-cache') return 'vite-cache';
  if (/rasters$/.test(name)) return 'rasters';
  if (!SNAPSHOT.test(name)) return null;
  let names;
  try { names = new Set(fs.readdirSync(directory)); } catch { return null; }
  return SNAPSHOT_SIGNATURE.some(item => names.has(item)) ? 'frozen-copy' : null;
}

function readFolder(directory, relative, segments = []) {
  const node = {relative, name: path.basename(directory), segments, files: [], folders: [], payload: [], links: 0, unreadable: false, newest: 0, ownNewest: 0};
  let list;
  try { list = entries(directory); } catch { node.unreadable = true; return node; }
  const underEvidence = segments.some(segment => EVIDENCE.has(key(segment)));
  for (const entry of list) {
    const file = path.join(directory, entry.name), child = relative + '/' + entry.name;
    if (entry.isSymbolicLink()) { node.links++; continue; }
    if (entry.isDirectory()) {
      const reason = payloadReason(entry.name, file, underEvidence);
      if (reason) node.payload.push({name: entry.name, relative: child, reason, ...subtree(file)});
      else { const folder = readFolder(file, child, [...segments, entry.name]); node.folders.push(folder); node.newest = Math.max(node.newest, folder.newest); }
    } else if (entry.isFile()) {
      const info = stat(file);
      if (!info) continue;
      node.files.push({name: entry.name, relative: child, bytes: info.size, modified: info.mtimeMs});
      node.ownNewest = Math.max(node.ownNewest, info.mtimeMs);
    }
  }
  node.newest = Math.max(node.newest, node.ownNewest);
  node.export = node.files.some(file => file.name === 'runtime-manifest.json' || file.name.startsWith('frozen-export-receipt')) || node.payload.some(item => item.name === 'runtime' && item.reason === 'frozen-copy');
  return node;
}

function markNewestExports(node) {
  const exports = node.folders.filter(folder => folder.export);
  if (exports.length) exports.reduce((a, b) => b.ownNewest > a.ownNewest ? b : a).newestExport = true;
  node.folders.forEach(markNewestExports);
}

function keepRule(file, node, depth, campaign) {
  const lower = key(file.name), segments = node.segments.map(key);
  if (segments.some(segment => EVIDENCE.has(segment)) || /\.(?:docx?|pptx?)$/.test(lower)) return 'source evidence';
  if (segments.some(segment => STATE_DIRS.has(segment)) || lower === 'manifest.json' || (depth === 0 || campaign) && STATE_FILES.has(lower)) return 'run state';
  // A campaign's own root files are its ledger.
  if (campaign && depth === 0) return 'run state';
  if (DECISION.test(lower)) return 'final decisions';
  if (node.newestExport && LATEST_EXPORT.test(lower)) return 'latest export';
  if (depth === 0 && lower.endsWith('.pdf')) return 'source evidence';
  if (lower.endsWith('.md')) return 'notes';
  return null;
}

export function prunePlan({root, now = Date.now(), records = false, tracked = new Set(), references = liveReferences(root), limits = PRUNE_DEFAULTS} = {}) {
  root = path.resolve(root);
  const deletions = [], skipped = [], totals = {}, kept = {}, folders = {scanned: 0, idle: 0, active: 0};
  const trackedFolders = new Set();
  for (const file of tracked) { const parts = key(file).split('/'); for (let n = 1; n < parts.length; n++) trackedFolders.add(parts.slice(0, n).join('/')); }
  const trackedFiles = new Set([...tracked].map(key));
  const tally = (bucket, name, bytes, files = 1) => { const row = bucket[name] ??= {bytes: 0, files: 0}; row.bytes += bytes; row.files += files; };
  const referenced = relative => {
    const lower = key(relative);
    if (references.files.has(lower) || references.directories.has(lower)) return true;
    for (let cut = lower.lastIndexOf('/'); cut > 0; cut = lower.lastIndexOf('/', cut - 1)) if (references.directories.has(lower.slice(0, cut))) return true;
    return false;
  };
  const holdsReference = relative => references.ancestors.has(key(relative)) || referenced(relative);

  function decide(node, state, depth = 0) {
    // Returns the deletions inside this folder, collapsed to the folder itself
    // when nothing in it is kept.
    const out = []; let keptHere = node.links > 0 || node.unreadable, bytes = 0, files = 0;
    const protectExport = state.active && (node.newestExport || state.underNewestExport);
    const keep = (rule, size, count = 1) => { keptHere = true; tally(kept, rule, size, count); };
    const remove = (item, type, reason, size, count) => { out.push({path: item.relative, type, reason, bytes: size, files: count}); bytes += size; files += count; tally(totals, reason, size, count); };
    for (const item of node.payload) {
      if (item.unreadable || trackedFolders.has(key(item.relative))) { keep('unreadable or tracked', item.bytes, item.files); skipped.push({path: item.relative, why: item.unreadable ? 'unreadable' : 'tracked'}); }
      else if (holdsReference(item.relative)) { keep('referenced', item.bytes, item.files); skipped.push({path: item.relative, why: 'referenced'}); }
      else if (protectExport) { keep('active export', item.bytes, item.files); skipped.push({path: item.relative, why: 'newest export of an active folder'}); }
      else remove(item, 'directory', item.reason, item.bytes, item.files);
    }
    for (const file of node.files) {
      if (trackedFiles.has(key(file.relative))) { keep('unreadable or tracked', file.bytes); continue; }
      if (referenced(file.relative)) { keep('referenced', file.bytes); continue; }
      if (LEASE.test(file.name)) { keep('leases', file.bytes); continue; }
      if (node.export && file.name === 'cache.json' && !protectExport) { remove(file, 'file', 'layout-cache', file.bytes, 1); continue; }
      if (!state.records) { keep('not idle', file.bytes); continue; }
      const rule = keepRule(file, node, depth, state.campaign);
      if (rule) keep(rule, file.bytes); else remove(file, 'file', 'record', file.bytes, 1);
    }
    for (const folder of node.folders) {
      const child = decide(folder, {...state, underNewestExport: protectExport}, depth + 1);
      out.push(...child.entries); bytes += child.bytes; files += child.files;
      if (child.kept) keptHere = true;
    }
    const emptied = !keptHere && (bytes > 0 || files > 0 || out.length > 0 || state.records) && depth > 0 && !trackedFolders.has(key(node.relative)) && !holdsReference(node.relative);
    if (!emptied) return {entries: out, bytes, files, kept: true};
    const reasons = new Set(out.map(item => item.reason));
    return {entries: [{path: node.relative, type: 'directory', reason: reasons.size === 1 ? [...reasons][0] : 'record', bytes, files}], bytes, files, kept: false};
  }

  function runFolder(directory, relative, {campaign = false} = {}) {
    const node = readFolder(directory, relative);
    markNewestExports(node);
    const newest = node.newest || Math.max(0, ...node.payload.map(item => item.newest)) || stat(directory)?.mtimeMs || now;
    const idle = now - newest;
    folders.scanned++; idle >= limits.recordIdleMs ? folders.idle++ : idle < limits.activeMs && folders.active++;
    if (campaign && idle < limits.recordIdleMs) { skipped.push({path: relative, why: 'campaign active within the record idle period'}); return; }
    deletions.push(...decide(node, {active: idle < limits.activeMs, records: records && idle >= limits.recordIdleMs, campaign}).entries);
  }

  function temporary(directory, relative) {
    const size = subtree(directory), newest = size.newest || stat(directory)?.mtimeMs || now;
    if (size.unreadable || now - newest < limits.tempIdleMs) { skipped.push({path: relative, why: size.unreadable ? 'unreadable' : 'recent test folder'}); return; }
    deletions.push({path: relative, type: 'directory', reason: 'test-temp', bytes: size.bytes, files: size.files}); tally(totals, 'test-temp', size.bytes, size.files);
  }

  const folderEntries = relative => { try { return entries(path.join(root, relative)).filter(entry => entry.isDirectory() && !entry.isSymbolicLink()); } catch { return []; } };
  for (const entry of folderEntries('.booklet-work')) {
    const relative = '.booklet-work/' + entry.name;
    if (entry.name === 'full-imports') {
      for (const run of folderEntries(relative)) TEMP.test(run.name) ? temporary(path.join(root, relative, run.name), relative + '/' + run.name) : runFolder(path.join(root, relative, run.name), relative + '/' + run.name);
    } else if (PROTECTED.has(entry.name) || entry.name.startsWith('repo-cleanup-')) continue;
    else if (TEMP.test(entry.name)) temporary(path.join(root, relative), relative);
    else runFolder(path.join(root, relative), relative);
  }
  for (const entry of folderEntries('.agywork')) if (TEMP.test(entry.name)) temporary(path.join(root, '.agywork', entry.name), '.agywork/' + entry.name);
  // A campaign shares one ledger and lock folder, so it is one run: nothing
  // inside it is touched until the whole campaign has been idle.
  for (const entry of folderEntries('.agywork/content-campaign')) runFolder(path.join(root, '.agywork/content-campaign', entry.name), '.agywork/content-campaign/' + entry.name, {campaign: true});
  return {root, createdAt: new Date(now).toISOString(), records, limits, folders, totals, kept, deletions, skipped};
}

// Removes a file or tree without following a link or junction out of it.
export function removeTree(target) {
  const result = {files: 0, bytes: 0, directories: 0, links: 0, errors: []};
  const fail = (file, error) => { if (result.errors.length < 200) result.errors.push({path: file, error: error.code ?? error.message}); else result.errors.truncated = true; };
  const unlink = file => { try { fs.unlinkSync(file); result.links++; } catch { try { fs.rmdirSync(file); result.links++; } catch (error) { fail(file, error); } } };
  const real = fs.realpathSync.native(path.dirname(target));
  const visit = (file, expected) => {
    let info;
    try { info = fs.lstatSync(file); } catch (error) { if (error.code !== 'ENOENT') fail(file, error); return; }
    if (info.isSymbolicLink()) return unlink(file);
    if (!info.isDirectory()) { try { fs.unlinkSync(file); result.files++; result.bytes += info.size; } catch (error) { fail(file, error); } return; }
    // A reparse point that lstat did not report still resolves elsewhere.
    let resolved;
    try { resolved = fs.realpathSync.native(file); } catch (error) { return fail(file, error); }
    if (key(resolved) !== key(expected)) return unlink(file);
    let list;
    try { list = entries(file); } catch (error) { return fail(file, error); }
    for (const entry of list) {
      const child = path.join(file, entry.name);
      if (entry.isSymbolicLink()) unlink(child); else visit(child, path.join(expected, entry.name));
    }
    try { fs.rmdirSync(file); result.directories++; } catch (error) { fail(file, error); }
  };
  visit(target, path.join(real, path.basename(target)));
  return result;
}

export function applyPrune(root, plan, {progress} = {}) {
  root = path.resolve(root);
  const result = {removedFiles: 0, removedBytes: 0, removedDirectories: 0, unlinked: 0, errors: []};
  const linked = new Map();
  const throughLink = directory => {
    // No ancestor between the workspace and the target may be a link.
    if (directory === root || !directory.startsWith(root + path.sep)) return false;
    if (!linked.has(directory)) { let info = null; try { info = fs.lstatSync(directory); } catch { /* removed */ } linked.set(directory, !!info?.isSymbolicLink() || throughLink(path.dirname(directory))); }
    return linked.get(directory);
  };
  const parents = new Set();
  plan.deletions.forEach((item, index) => {
    let target;
    try { target = inside(root, item.path); } catch (error) { result.errors.push({path: item.path, error: error.message}); return; }
    if (!/^\.(?:booklet-work|agywork)\//.test(item.path) || throughLink(path.dirname(target))) { result.errors.push({path: item.path, error: 'outside prune scope'}); return; }
    const removed = removeTree(target);
    result.removedFiles += removed.files; result.removedBytes += removed.bytes; result.removedDirectories += removed.directories; result.unlinked += removed.links;
    for (const error of removed.errors) if (result.errors.length < 200) result.errors.push({path: posix(path.relative(root, error.path)), error: error.error});
    parents.add(path.dirname(target));
    if (progress && (index + 1) % 500 === 0) progress(index + 1, plan.deletions.length, result);
  });
  // Folders left empty go too, up to the folder that holds the run.
  const stops = new Set(['.booklet-work', '.booklet-work/full-imports', '.agywork', '.agywork/content-campaign'].map(item => path.join(root, item)));
  for (let directory of parents) {
    while (directory.startsWith(root + path.sep) && !stops.has(directory)) {
      try { fs.rmdirSync(directory); result.removedDirectories++; } catch { break; }
      directory = path.dirname(directory);
    }
  }
  return result;
}
