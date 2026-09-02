import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { allDiagrams, makeBankManifest, normaliseQuestion, normalizeImport, validateImport, validateQuestion } from '../../src/lib/practice-question-model.js';
import { buildPracticePrompt } from './prompt-pipeline.mjs';

const WORK_ROOT = path.resolve('.booklet-work/practice-imports');
const BANK_ROOT = path.resolve('booklets/question-bank');
const ASSET_ROOT = path.resolve('public/booklet-assets');
const MAX_BODY = 240 * 1024 * 1024;

const safeId = (value) => String(value ?? '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160);
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const send = (res, code, value) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; if (raw.length > MAX_BODY) { reject(new Error('request body too large')); req.destroy(); } });
  req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('invalid JSON')); } });
  req.on('error', reject);
});
const extFor = (name, mime = '') => {
  const ext = path.extname(name).toLowerCase();
  if (ext) return ext;
  if (mime.includes('pdf')) return '.pdf';
  if (mime.includes('png')) return '.png';
  if (mime.includes('jpeg')) return '.jpg';
  if (mime.includes('webp')) return '.webp';
  return '.bin';
};
function decodeData(value) {
  const match = String(value ?? '').match(/^data:([^;,]+)?(?:;base64)?,([\s\S]*)$/i);
  if (!match) return Buffer.from(String(value ?? ''), 'base64');
  return /;base64,/i.test(String(value)) ? Buffer.from(match[2], 'base64') : Buffer.from(decodeURIComponent(match[2]), 'utf8');
}
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
  return result.status === 0 ? String(result.stdout ?? '') : '';
}

async function writeManifest() {
  const names = await fs.readdir(BANK_ROOT).catch(() => []);
  const records = [];
  for (const name of names.filter((entry) => entry.endsWith('.json') && entry !== 'manifest.json')) {
    try {
      const checked = validateQuestion(JSON.parse(await fs.readFile(path.join(BANK_ROOT, name), 'utf8')));
      if (checked.valid && checked.question.status === 'approved') records.push(checked.question);
    } catch {
      // Malformed records are kept out of the serving manifest until repaired.
    }
  }
  records.sort((a, b) => a.id.localeCompare(b.id));
  const manifest = makeBankManifest(records);
  await fs.mkdir(BANK_ROOT, { recursive: true });
  await fs.writeFile(path.join(BANK_ROOT, 'manifest.json'), json(manifest), 'utf8');
  return manifest;
}

async function importJobFromFiles(files, selectedNames = []) {
  const importId = Date.now().toString(36) + '-' + randomUUID().slice(0, 8);
  const root = path.join(WORK_ROOT, safeId(importId));
  const sourceRoot = path.join(root, 'source');
  const pagesRoot = path.join(root, 'pages');
  await fs.mkdir(sourceRoot, { recursive: true });
  await fs.mkdir(pagesRoot, { recursive: true });
  const selected = selectedNames.length ? files.filter((file) => selectedNames.includes(file.name)) : files;
  const pages = [];
  const sourceFiles = [];

  for (const file of selected) {
    const name = safeId(path.basename(file.name || 'source'));
    const ext = extFor(name, file.mimeType || file.type);
    const stored = name.replace(path.extname(name), '') + ext;
    const sourcePath = path.join(sourceRoot, stored);
    await fs.writeFile(sourcePath, decodeData(file.data ?? file.content));
    sourceFiles.push({ name: stored, originalName: file.name, mimeType: file.mimeType || file.type || '', path: sourcePath });
    if (ext === '.pdf') {
      const prefix = path.join(pagesRoot, 'render');
      run('pdftoppm', ['-png', '-r', '150', sourcePath, prefix]);
      const rendered = (await fs.readdir(pagesRoot).catch(() => []))
        .filter((entry) => /^render-\d+\.png$/i.test(entry))
        .sort((a, b) => Number(a.match(/(\d+)/)?.[1]) - Number(b.match(/(\d+)/)?.[1]));
      const extracted = run('pdftotext', ['-layout', sourcePath, '-']).split('\f');
      for (let index = 0; index < rendered.length; index += 1) {
        const pageName = 'page-' + (index + 1) + '.png';
        await fs.rename(path.join(pagesRoot, rendered[index]), path.join(pagesRoot, pageName));
        pages.push({ id: 'page-' + (index + 1), pageNumber: index + 1, sourceName: pageName, imageUrl: '/__booklet/imports/' + encodeURIComponent(importId) + '/files/pages/' + pageName, text: (extracted[index] ?? '').trim(), selected: true });
      }
    } else if (/^image\//i.test(file.mimeType || file.type || '') || ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
      const pageName = 'page-' + (pages.length + 1) + ext;
      await fs.copyFile(sourcePath, path.join(pagesRoot, pageName));
      pages.push({ id: 'page-' + (pages.length + 1), pageNumber: pages.length + 1, sourceName: pageName, imageUrl: '/__booklet/imports/' + encodeURIComponent(importId) + '/files/pages/' + pageName, text: '', selected: true });
    }
  }

  const prompt = buildPrompt({ importId, sourceFiles, pages });
  const job = { format: 'mathsmap-practice-import-job-v3', version: 3, id: importId, status: 'ready-for-transcription', createdAt: new Date().toISOString(), sourceFiles: sourceFiles.map(({ path: _path, ...rest }) => rest), pages, evidence: { sourceFiles: sourceFiles.map(({ path: _path, ...rest }) => rest), pages: pages.map(({ text: _text, ...page }) => page), questionMap: {} }, prompt, result: null };
  await fs.writeFile(path.join(root, 'job.json'), json(job), 'utf8');
  return job;
}

function buildPrompt(args) { return buildPracticePrompt(args); }
async function readJob(id) {
  return JSON.parse(await fs.readFile(path.join(WORK_ROOT, safeId(id), 'job.json'), 'utf8'));
}
async function fileFromJob(id, relative) {
  const root = path.resolve(WORK_ROOT, safeId(id));
  const target = path.resolve(root, relative);
  if (!(target === root || target.startsWith(root + path.sep))) throw new Error('bad path');
  return target;
}
async function removeDerivedAssets(question) {
  for (const diagram of allDiagrams(question)) {
    if (!diagram.derived || !diagram.src) continue;
    const target = path.resolve('public', String(diagram.src).replace(/^\/+/, ''));
    if (target === ASSET_ROOT || target.startsWith(ASSET_ROOT + path.sep)) await fs.rm(target, { force: true });
  }
}
async function removeImportDraft(importId) {
  if (!importId) return;
  const root = path.join(WORK_ROOT, safeId(importId));
  await fs.rm(path.join(root, 'result.json'), { force: true });
  try {
    const jobPath = path.join(root, 'job.json');
    const job = JSON.parse(await fs.readFile(jobPath, 'utf8'));
    job.result = null;
    job.status = 'ready-for-transcription';
    await fs.writeFile(jobPath, json(job), 'utf8');
  } catch {
    // Hand-authored records may not have an import job.
  }
}

export function practiceStudioPlugin() {
  return {
    name: 'practice-studio',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/__booklet/')) return next();
        try {
          if (pathname === '/__booklet/bank/manifest' && req.method === 'GET') return send(res, 200, await writeManifest());

          const questionMatch = pathname.match(/^\/__booklet\/bank\/questions\/([^/]+)$/);
          if (questionMatch && req.method === 'GET') {
            const id = safeId(decodeURIComponent(questionMatch[1]));
            return send(res, 200, JSON.parse(await fs.readFile(path.join(BANK_ROOT, id + '.json'), 'utf8')));
          }
          if ((pathname === '/__booklet/bank/questions' && req.method === 'POST') || (questionMatch && req.method === 'PUT')) {
            const raw = await readBody(req);
            const checked = validateQuestion(raw);
            if (!checked.valid) return send(res, 400, { error: checked.errors.join('; ') });
            const question = normaliseQuestion(raw);
            if (questionMatch && question.id !== safeId(decodeURIComponent(questionMatch[1]))) {
              return send(res, 400, { error: 'Question id cannot be changed during an edit.' });
            }
            await fs.mkdir(BANK_ROOT, { recursive: true });
            await fs.writeFile(path.join(BANK_ROOT, safeId(question.id) + '.json'), json(question), 'utf8');
            await writeManifest();
            return send(res, 200, question);
          }
          if (questionMatch && req.method === 'DELETE') {
            const id = safeId(decodeURIComponent(questionMatch[1]));
            const body = await readBody(req);
            if (body.confirmId !== id) return send(res, 400, { error: 'Exact question id confirmation is required.' });
            const file = path.join(BANK_ROOT, id + '.json');
            const question = normaliseQuestion(JSON.parse(await fs.readFile(file, 'utf8')));
            await removeDerivedAssets(question);
            await fs.rm(file, { force: true });
            await removeImportDraft(null);
            await writeManifest();
            return send(res, 200, { deleted: id });
          }

          const importFiles = pathname.match(/^\/__booklet\/imports\/([^/]+)\/files\/(.+)$/);
          if (importFiles && req.method === 'GET') {
            const target = await fileFromJob(decodeURIComponent(importFiles[1]), decodeURIComponent(importFiles[2]));
            const data = await fs.readFile(target);
            const ext = path.extname(target).toLowerCase();
            const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
            res.statusCode = 200;
            res.setHeader('Content-Type', mime);
            return res.end(data);
          }
          if (pathname === '/__booklet/imports' && req.method === 'POST') {
            const body = await readBody(req);
            return send(res, 200, await importJobFromFiles(body.files ?? [], body.selectedNames ?? []));
          }

          const importMatch = pathname.match(/^\/__booklet\/imports\/([^/]+)(?:\/result)?$/);
          if (importMatch && req.method === 'GET') return send(res, 200, await readJob(decodeURIComponent(importMatch[1])));
          if (importMatch && pathname.endsWith('/result') && req.method === 'POST') {
            const id = decodeURIComponent(importMatch[1]);
            const raw = await readBody(req);
            const checked = validateImport(raw);
            if (!checked.valid) return send(res, 400, { error: checked.errors.join('; ') });
            const payload = normalizeImport(checked.payload, { importId: id });
            const root = path.join(WORK_ROOT, safeId(id));
            await fs.writeFile(path.join(root, 'result.json'), json(payload), 'utf8');
            const job = await readJob(id);
            job.status = 'needs-review';
            job.result = payload;
            await fs.writeFile(path.join(root, 'job.json'), json(job), 'utf8');
            return send(res, 200, payload);
          }
          return send(res, 404, { error: 'Unknown Booklet Studio endpoint' });
        } catch (error) {
          console.error('[practice-studio]', error);
          return send(res, error.code === 'ENOENT' ? 404 : 400, { error: String(error.message ?? error) });
        }
      });
    },
  };
}
