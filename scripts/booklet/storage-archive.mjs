// Local, lossless, content-addressed archives. No bank-history retention lives here.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {gzip, gunzip} from 'node:zlib';
import {promisify} from 'node:util';

const compress = promisify(gzip), extract = promisify(gunzip);
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
export function inside(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..') || relative.includes(':')) throw Error('Unsafe archive path');
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw Error('Path escapes archive root');
  return target;
}
export async function noLinks(target) {
  // Check every ancestor, including junctions, before reading/writing/removing files.
  for (let current = path.resolve(target); ; current = path.dirname(current)) {
    const stat = await fs.lstat(current).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (stat?.isSymbolicLink()) throw Error('Refusing linked path: ' + current);
    if (current === path.dirname(current)) break;
  }
}
export async function walkFiles(root, relative = '') {
  await noLinks(root);
  const files = [], skippedLinks = [];
  async function walk(dir, prefix) {
    for (const entry of await fs.readdir(dir, {withFileTypes:true})) {
      const name = prefix ? prefix + '/' + entry.name : entry.name;
      if (entry.isSymbolicLink()) { skippedLinks.push(name); continue; }
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), name);
      else if (entry.isFile()) files.push(name);
    }
  }
  const directory = relative ? inside(root, relative) : root;
  await noLinks(directory);
  try { await walk(directory, relative); } catch(e) { if (e.code !== 'ENOENT') throw e; }
  return {files:files.sort(), skippedLinks};
}
async function durableWrite(file, data) {
  await noLinks(file);
  await fs.mkdir(path.dirname(file), {recursive:true});
  const temp = file + '.' + randomUUID() + '.tmp';
  const handle = await fs.open(temp, 'wx');
  try { await handle.writeFile(data); await handle.sync(); } finally { await handle.close(); }
  await fs.rename(temp, file);
}
export async function withArchiveLock(archiveRoot, work) {
  await noLinks(archiveRoot);
  await fs.mkdir(archiveRoot, {recursive:true});
  const file = path.join(archiveRoot, 'maintenance.lock');
  const handle = await fs.open(file, 'wx').catch(e => { if (e.code === 'EEXIST') throw Error('Storage maintenance already running (or interrupted): ' + file); throw e; });
  try { await handle.writeFile(json({pid:process.pid,startedAt:new Date().toISOString()})); return await work(); }
  finally { await handle.close(); await fs.unlink(file); }
}
function objectPath(root, hash) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw Error('Invalid archive hash');
  return inside(root, `objects/${hash.slice(0,2)}/${hash}.gz`);
}
async function decoded(archiveRoot, entry) {
  const file = objectPath(archiveRoot, entry.sha256);
  await noLinks(file);
  const bytes = await extract(await fs.readFile(file));
  if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw Error('Archive verification failed: ' + entry.path);
  return bytes;
}
export async function archiveFiles({sourceRoot, archiveRoot, files, label, prune = false, metadata = {}}) {
  const started = Date.now(), entries = [];
  let addedBytes = 0;
  for (const relative of [...new Set(files)].sort()) {
    const source = inside(sourceRoot, relative);
    await noLinks(source);
    if (source === path.resolve(archiveRoot) || source.startsWith(path.resolve(archiveRoot) + path.sep)) throw Error('Cannot archive the archive itself');
    const stat = await fs.stat(source);
    if (!stat.isFile()) throw Error('Expected regular file: ' + source);
    const bytes = await fs.readFile(source), hash = sha256(bytes);
    const entry = {path:relative,bytes:bytes.length,sha256:hash,mtime:stat.mtime.toISOString()};
    const object = objectPath(archiveRoot, hash);
    await noLinks(object);
    if (!(await fs.stat(object).catch(e => { if (e.code === 'ENOENT') return null; throw e; }))) {
      const packed = await compress(bytes);
      await durableWrite(object, packed); addedBytes += packed.length;
    }
    // Read the published object from disk and extract every byte before accepting it.
    await decoded(archiveRoot, entry);
    entries.push(entry);
  }
  if (!entries.length) return {files:0,removedBytes:0,addedBytes:0,elapsedMs:Date.now()-started};
  const manifest = {format:'mathsmap-storage-archive-v1',createdAt:new Date().toISOString(),label,sourceRoot:path.resolve(sourceRoot),metadata,entries};
  const name = new Date().toISOString().replace(/[:.]/g,'-') + '-' + randomUUID() + '.json';
  const manifestPath = path.join(archiveRoot, 'manifests', name);
  await durableWrite(manifestPath, json(manifest));
  // Re-read the durable index before removing any loose source.
  const published = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (json(published) !== json(manifest)) throw Error('Archive index verification failed');
  const removed = [], changed = [];
  if (prune) for (const entry of entries) {
    const source = inside(sourceRoot, entry.path);
    await noLinks(source);
    const current = await fs.readFile(source).catch(e => { if (e.code === 'ENOENT') return null; throw e; });
    if (!current || sha256(current) !== entry.sha256) { changed.push(entry.path); continue; }
    await fs.unlink(source); // Individual verified files only; never recursive deletion.
    removed.push(entry);
  }
  const result = {manifest:manifestPath,files:entries.length,sourceBytes:entries.reduce((n,e)=>n+e.bytes,0),removedFiles:removed.length,removedBytes:removed.reduce((n,e)=>n+e.bytes,0),addedBytes,changed,elapsedMs:Date.now()-started};
  await durableWrite(path.join(archiveRoot, 'receipts', name), json(result));
  return result;
}
export async function restoreArchive({archiveRoot, manifestPath, outputRoot, only}) {
  await noLinks(manifestPath);
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (manifest.format !== 'mathsmap-storage-archive-v1' || !Array.isArray(manifest.entries)) throw Error('Invalid archive manifest');
  const entries = manifest.entries.filter(e => !only || e.path === only);
  if (!entries.length) throw Error('No matching archive entries');
  // Validate all destinations before writing; never replace an existing file.
  for (const entry of entries) {
    inside(archiveRoot, entry.path);
    if (outputRoot) {
      const target = inside(outputRoot, entry.path); await noLinks(target);
      if (await fs.stat(target).catch(e => { if (e.code === 'ENOENT') return null; throw e; })) throw Error('Restore destination exists: ' + target);
    }
  }
  let bytes = 0;
  for (const entry of entries) {
    const data = await decoded(archiveRoot, entry); bytes += data.length;
    if (outputRoot) {
      const target = inside(outputRoot, entry.path); await noLinks(target);
      await fs.mkdir(path.dirname(target), {recursive:true});
      await fs.writeFile(target, data, {flag:'wx'});
      if (sha256(await fs.readFile(target)) !== entry.sha256) throw Error('Restored file verification failed');
    }
  }
  return {files:entries.length,bytes,restored:!!outputRoot};
}

export async function revisionCandidates(projectRoot, {retired = false, projectId} = {}) {
  await noLinks(projectRoot);
  const sourceRoot = path.dirname(path.resolve(projectRoot));
  const prefix = path.basename(projectRoot) + '/.revisions';
  const milestonesPath = path.join(projectRoot, '.revisions', 'milestones.json');
  await noLinks(milestonesPath);
  const milestones = await fs.readFile(milestonesPath, 'utf8').then(JSON.parse).catch(e => { if (e.code === 'ENOENT') return {}; throw e; });
  if (!milestones || Array.isArray(milestones) || typeof milestones !== 'object' || Object.values(milestones).some(v=>!Array.isArray(v)||v.some(n=>!Number.isSafeInteger(n)||n<0))) throw Error('Invalid revision milestone configuration');
  const inventory = await walkFiles(sourceRoot, prefix), groups = new Map();
  for (const file of inventory.files) {
    const parts = file.slice(prefix.length+1).split('/');
    if (parts.length !== 2 || parts[0].startsWith('.') || !/^\d+\.json$/.test(parts[1]) || (projectId && parts[0] !== projectId)) continue;
    const list = groups.get(parts[0]) ?? []; list.push({path:file,revision:Number(parts[1].slice(0,-5))}); groups.set(parts[0],list);
  }
  const files = [], summary = [];
  for (const [id,list] of groups) {
    const live = path.join(projectRoot, id+'.json'); await noLinks(live);
    const active = !!await fs.stat(live).catch(e => { if(e.code==='ENOENT') return null; throw e; });
    list.sort((a,b)=>b.revision-a.revision);
    const selected = list.slice(!active && retired ? 0 : 20).filter(e=>!(milestones[id]??[]).includes(e.revision));
    files.push(...selected.map(e=>e.path));
    summary.push({id,active,snapshots:list.length,archive:selected.length,retain:list.length-selected.length});
  }
  return {sourceRoot,files,summary,skippedLinks:inventory.skippedLinks};
}
export async function maintainProjectHistory(projectRoot, projectId) {
  const archiveRoot = path.join(path.dirname(path.resolve(projectRoot)), '.storage-archives');
  return withArchiveLock(archiveRoot, async () => {
    const plan = await revisionCandidates(projectRoot, {projectId});
    return archiveFiles({...plan,archiveRoot,label:'Automatic project revision retention',prune:true,metadata:{histories:plan.summary}});
  });
}
