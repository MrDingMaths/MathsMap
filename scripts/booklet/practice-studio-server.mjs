import { promises as fs } from 'node:fs';
import path from 'node:path';
import { allDiagrams, makeBankManifest, normaliseQuestion, validateQuestion } from '../../src/lib/practice-question-model.js';

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
export function practiceStudioPlugin() {
  return {
    name: 'practice-studio',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        const ownsPath = pathname.startsWith('/__booklet/bank/')
          || pathname === '/__booklet/imports'
          || pathname.startsWith('/__booklet/imports/');
        if (!ownsPath) return next();
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
            const question = { ...normaliseQuestion(raw), status: 'approved' };
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
          return send(res, 404, { error: 'Unknown Booklet Studio endpoint' });
        } catch (error) {
          console.error('[practice-studio]', error);
          return send(res, error.code === 'ENOENT' ? 404 : 400, { error: String(error.message ?? error) });
        }
      });
    },
  };
}
